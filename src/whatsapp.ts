import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  WASocket,
  downloadMediaMessage,
  proto
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';

export interface StoredMessage {
  id: string;
  from: string;
  senderName: string;
  fromMe: boolean;
  timestamp: number;
  text: string;
  mediaType?: 'image' | 'audio' | 'document' | 'video';
  mediaUrl?: string;
  mediaPath?: string;
  transcription?: string;
  analysis?: string;
}

export interface ChatSummary {
  jid: string;
  name: string;
  lastMessage: string;
  lastTimestamp: number;
  unreadCount: number;
  needsReply: boolean;
  messages: StoredMessage[];
}

function getRealMessage(rawMsg: proto.IMessage | null | undefined): proto.IMessage | undefined {
  if (!rawMsg) return undefined;
  if (rawMsg.ephemeralMessage?.message) return getRealMessage(rawMsg.ephemeralMessage.message);
  if (rawMsg.viewOnceMessage?.message) return getRealMessage(rawMsg.viewOnceMessage.message);
  if (rawMsg.viewOnceMessageV2?.message) return getRealMessage(rawMsg.viewOnceMessageV2.message);
  if (rawMsg.documentWithCaptionMessage?.message) return getRealMessage(rawMsg.documentWithCaptionMessage.message);
  return rawMsg;
}

export class WhatsAppClient {
  public sock: WASocket | null = null;
  public qrCodeRaw: string = '';
  public qrCodeDataUrl: string = '';
  public isConnected: boolean = false;
  public userJid: string = '';
  public userName: string = '';
  private authDir: string;
  private chats: Map<string, ChatSummary> = new Map();
  private contacts: Map<string, string> = new Map();
  private storageFile: string;
  private mediaDir: string;
  private onMessageCallback?: (msg: StoredMessage, chat: ChatSummary) => Promise<void>;
  private historySyncReceived: boolean = false;
  private historySyncTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(authDir: string = '.data/whatsapp-session-kethy') {
    this.authDir = authDir;
    this.storageFile = path.resolve('.data', 'chats-store.json');
    this.mediaDir = path.resolve('public', 'media');

    if (!fs.existsSync(this.mediaDir)) {
      fs.mkdirSync(this.mediaDir, { recursive: true });
    }
    const authParent = path.dirname(path.resolve(this.authDir));
    if (!fs.existsSync(authParent)) {
      fs.mkdirSync(authParent, { recursive: true });
    }

    this.loadStorage();
  }

  public onMessage(callback: (msg: StoredMessage, chat: ChatSummary) => Promise<void>) {
    this.onMessageCallback = callback;
  }

  private loadStorage() {
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf8');
        const data = JSON.parse(raw);
        for (const item of data) {
          this.chats.set(item.jid, item);
        }
      }
    } catch (err) {
      console.error('Aviso ao carregar storage de chats:', err);
    }
  }

  public saveStorage() {
    try {
      const arr = Array.from(this.chats.values());
      fs.writeFileSync(this.storageFile, JSON.stringify(arr, null, 2), 'utf8');
    } catch (err) {
      console.error('Erro ao salvar storage:', err);
    }
  }

  public getContacts(): Map<string, string> {
    return this.contacts;
  }

  public getChats(): ChatSummary[] {
    return Array.from(this.chats.values()).sort(
      (a, b) => b.lastTimestamp - a.lastTimestamp
    );
  }

  public getChat(jid: string): ChatSummary | undefined {
    return this.chats.get(jid);
  }

  public getUnrepliedChats(): ChatSummary[] {
    return this.getChats().filter((c) => c.needsReply);
  }

  public async start(): Promise<void> {
    const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
    const { version } = await fetchLatestBaileysVersion();

    this.sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'warn' }),
      printQRInTerminal: false,
      browser: ['Ubuntu', 'Chrome', '22.04.4'],
      syncFullHistory: true,
      shouldSyncHistoryMessage: () => true,
      markOnlineOnConnect: true
    });

    this.sock.ev.on('creds.update', saveCreds);

    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.qrCodeRaw = qr;
        try {
          this.qrCodeDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 8 });
          const qrPath = path.resolve('public', 'qrcode.png');
          await QRCode.toFile(qrPath, qr, { margin: 2, scale: 8 });
        } catch (e) {
          console.error('Erro ao gerar imagem QR:', e);
        }

        console.log('\n📱 Escaneie o QR Code no seu WhatsApp ou acesse http://localhost:3333');
        qrcodeTerminal.generate(qr, { small: true });
      }

      if (connection === 'open') {
        this.isConnected = true;
        this.qrCodeRaw = '';
        this.qrCodeDataUrl = '';
        this.userJid = this.sock?.user?.id || '';
        this.userName = this.sock?.user?.name || 'Kethely';

        console.log(`\n✅ Whats Kethy CONECTADO com sucesso! (${this.userJid})`);

        // Forçar sync de histórico logo após conectar
        this.scheduleHistorySync();
      }

      if (connection === 'close') {
        this.isConnected = false;
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`Conexão fechada (${statusCode}). Reconectando: ${shouldReconnect}`);

        if (shouldReconnect) {
          setTimeout(() => this.start(), 3500);
        }
      }
    });

    // Capturar contatos
    this.sock.ev.on('contacts.upsert', (contactsList) => {
      for (const contact of contactsList) {
        if (contact.id && (contact.name || contact.notify)) {
          this.contacts.set(contact.id, contact.name || contact.notify || '');
          const existing = this.chats.get(contact.id);
          if (existing) {
            existing.name = contact.name || contact.notify || existing.name;
          }
        }
      }
      this.saveStorage();
    });

    // Capturar histórico inicial que o WhatsApp envia ao conectar
    this.sock.ev.on('messaging-history.set', async ({ chats, contacts, messages }) => {
      const totalMsgs = messages?.length || 0;
      console.log(`📦 Histórico recebido: ${chats?.length || 0} conversas, ${totalMsgs} mensagens, ${contacts?.length || 0} contatos.`);

      this.historySyncReceived = true;

      if (contacts) {
        for (const c of contacts) {
          if (c.id && (c.name || c.notify)) {
            this.contacts.set(c.id, c.name || c.notify || '');
          }
        }
      }

      if (messages) {
        for (const msg of messages) {
          await this.handleIncomingMessage(msg, false);
        }
      }
      this.saveStorage();
      console.log(`✅ Histórico sincronizado! Total de chats: ${this.chats.size}`);
    });

    // Mensagens em tempo real
    this.sock.ev.on('messages.upsert', async (m) => {
      console.log(`📨 Evento messages.upsert: tipo=${m.type}, qtd=${m.messages.length}`);
      for (const msg of m.messages) {
        if (!msg.message) continue;
        await this.handleIncomingMessage(msg, true);
      }
    });
  }

  /**
   * Agenda um sync de histórico automático.
   * Se o WhatsApp não mandar messaging-history.set em 20s, força manualmente.
   */
  private scheduleHistorySync() {
    this.historySyncReceived = false;

    if (this.historySyncTimer) {
      clearTimeout(this.historySyncTimer);
    }

    // Aguarda 20s para ver se o histórico chegou automaticamente
    this.historySyncTimer = setTimeout(async () => {
      if (!this.historySyncReceived) {
        console.log('⚠️  Histórico não chegou automaticamente. Forçando requestHistorySync...');
        await this.forceHistorySync();
      }
    }, 20000);
  }

  /**
   * Força o download de histórico via sendNode (protocolo interno do Baileys).
   * Pode ser chamado manualmente via endpoint POST /api/force-history-sync.
   */
  public async forceHistorySync(): Promise<{ ok: boolean; message: string }> {
    if (!this.sock || !this.isConnected) {
      return { ok: false, message: 'WhatsApp não está conectado.' };
    }

    try {
      const sock = this.sock as any;

      // 1. Tenta cleanDirtyBits('account_sync') — sinaliza ao servidor WA que precisa reenviar dados
      if (typeof sock.cleanDirtyBits === 'function') {
        await sock.cleanDirtyBits('account_sync');
        console.log('🔄 cleanDirtyBits(account_sync) disparado.');
      }

      // 2. Tenta resyncAppState para forçar re-sincronização completa
      if (typeof sock.resyncAppState === 'function') {
        const ALL_PATCHES = ['critical_block', 'critical_unblock_low', 'regular_high', 'regular_low', 'regular'];
        await sock.resyncAppState(ALL_PATCHES, true);
        console.log('🔄 resyncAppState() disparado com sincronização completa.');
        return { ok: true, message: 'Sync completo iniciado. O histórico chegará em instantes via evento messaging-history.set. Aguarde até 60s.' };
      }

      return { ok: true, message: 'cleanDirtyBits disparado. Aguarde o evento de histórico.' };

    } catch (err: any) {
      console.error('Erro ao forçar sync:', err?.message);
      return { ok: false, message: `Erro: ${err?.message}` };
    }
  }

  private async handleIncomingMessage(msg: proto.IWebMessageInfo, triggerCallback: boolean = true) {
    const from = msg.key.remoteJid;
    if (!from || from === 'status@broadcast') return;

    const fromMe = Boolean(msg.key.fromMe);
    const id = msg.key.id || String(Date.now());
    const pushName = msg.pushName || '';
    const contactName = this.contacts.get(from) || pushName;
    const name = fromMe ? 'Eu' : (contactName || from.split('@')[0]);
    const timestamp = Number(msg.messageTimestamp || Math.floor(Date.now() / 1000)) * 1000;

    const realMsg = getRealMessage(msg.message);
    if (!realMsg) return;

    // Ignorar mensagens de protocolo/leitura
    if (realMsg.protocolMessage || realMsg.senderKeyDistributionMessage) return;

    let text =
      realMsg.conversation ||
      realMsg.extendedTextMessage?.text ||
      realMsg.imageMessage?.caption ||
      realMsg.videoMessage?.caption ||
      realMsg.documentMessage?.caption ||
      '';

    let mediaType: 'image' | 'audio' | 'document' | 'video' | undefined;
    let mediaUrl: string | undefined;
    let mediaPath: string | undefined;

    // Detectar imagem
    if (realMsg.imageMessage) {
      mediaType = 'image';
      text = text || '[Imagem]';
      const filename = `img_${id}.jpg`;
      const filePath = path.join(this.mediaDir, filename);

      if (!fs.existsSync(filePath) && this.sock) {
        try {
          const buffer = await downloadMediaMessage(
            msg,
            'buffer',
            {},
            {
              logger: pino({ level: 'silent' }),
              reuploadRequest: this.sock.updateMediaMessage
            }
          );
          fs.writeFileSync(filePath, buffer as Buffer);
          mediaPath = filePath;
          mediaUrl = `/media/${filename}`;

          // Copiar para imagens_thaise APENAS se for mensagem da Thaise (JID 93316888682660@lid)
          const THAISE_JID = '93316888682660@lid';
          if (from === THAISE_JID && !fromMe) {
            const thaiseDir = path.resolve('imagens_thaise');
            if (!fs.existsSync(thaiseDir)) fs.mkdirSync(thaiseDir, { recursive: true });
            const count = fs.readdirSync(thaiseDir).length + 1;
            const target = path.join(thaiseDir, `imagem_thaise_${count}_${filename}`);
            fs.copyFileSync(filePath, target);
            console.log(`📸 [THAISE] Imagem salva em imagens_thaise/${path.basename(target)}`);
          }
        } catch (err) {
          // Imagem expirada ou falha ao baixar
        }
      } else if (fs.existsSync(filePath)) {
        mediaPath = filePath;
        mediaUrl = `/media/${filename}`;
      }
    }

    // Detectar áudio
    if (realMsg.audioMessage) {
      mediaType = 'audio';
      text = text || '[Áudio de voz]';
      const filename = `audio_${id}.ogg`;
      const filePath = path.join(this.mediaDir, filename);

      if (!fs.existsSync(filePath) && this.sock) {
        try {
          const buffer = await downloadMediaMessage(
            msg,
            'buffer',
            {},
            {
              logger: pino({ level: 'silent' }),
              reuploadRequest: this.sock.updateMediaMessage
            }
          );
          fs.writeFileSync(filePath, buffer as Buffer);
          mediaPath = filePath;
          mediaUrl = `/media/${filename}`;
        } catch (err) {
          // Áudio expirado ou falha
        }
      } else if (fs.existsSync(filePath)) {
        mediaPath = filePath;
        mediaUrl = `/media/${filename}`;
      }
    }

    if (!text && !mediaType) return;

    // Atualizar ou criar chat
    let chat = this.chats.get(from);
    if (!chat) {
      chat = {
        jid: from,
        name: fromMe ? from.split('@')[0] : name,
        lastMessage: text,
        lastTimestamp: timestamp,
        unreadCount: fromMe ? 0 : 1,
        needsReply: !fromMe,
        messages: []
      };
      this.chats.set(from, chat);
    } else {
      if (timestamp >= chat.lastTimestamp) {
        chat.lastMessage = text;
        chat.lastTimestamp = timestamp;
        if (!fromMe) {
          chat.needsReply = true;
        } else {
          chat.needsReply = false;
          chat.unreadCount = 0;
        }
      }
      if (name && name !== 'Contato' && !name.includes('@')) {
        chat.name = name;
      }
    }

    // Evitar duplicatas
    const exists = chat.messages.some((m) => m.id === id);
    if (!exists) {
      const storedMsg: StoredMessage = {
        id,
        from,
        senderName: fromMe ? 'Eu' : (chat.name || name),
        fromMe,
        timestamp,
        text,
        mediaType,
        mediaUrl,
        mediaPath
      };

      chat.messages.push(storedMsg);
      // Ordenar por timestamp
      chat.messages.sort((a, b) => a.timestamp - b.timestamp);
      if (chat.messages.length > 100) {
        chat.messages = chat.messages.slice(-100);
      }

      this.saveStorage();

      if (triggerCallback && !fromMe && this.onMessageCallback) {
        await this.onMessageCallback(storedMsg, chat);
      }
    }
  }

  public async sendMessage(to: string, text: string): Promise<void> {
    if (!this.sock || !this.isConnected) {
      throw new Error('WhatsApp não está conectado.');
    }
    const jid = to.includes('@') ? to : `${to.replace(/\D/g, '')}@s.whatsapp.net`;

    try {
      await this.sock.sendPresenceUpdate('composing', jid);
      await new Promise((r) => setTimeout(r, 1000));
      await this.sock.sendPresenceUpdate('paused', jid);
    } catch (_) {}

    await this.sock.sendMessage(jid, { text });

    const chat = this.chats.get(jid);
    const now = Date.now();
    const storedMsg: StoredMessage = {
      id: `sent_${now}`,
      from: jid,
      senderName: 'Eu',
      fromMe: true,
      timestamp: now,
      text
    };

    if (chat) {
      chat.lastMessage = text;
      chat.lastTimestamp = now;
      chat.needsReply = false;
      chat.messages.push(storedMsg);
    } else {
      this.chats.set(jid, {
        jid,
        name: jid.split('@')[0],
        lastMessage: text,
        lastTimestamp: now,
        unreadCount: 0,
        needsReply: false,
        messages: [storedMsg]
      });
    }
    this.saveStorage();
  }

  public async requestPairingCode(phoneNumber: string): Promise<string> {
    if (!this.sock) throw new Error('WhatsApp ainda não inicializado.');
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const code = await this.sock.requestPairingCode(cleanNumber);
    return code;
  }
}
