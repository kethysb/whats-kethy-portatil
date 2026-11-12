import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { WhatsAppClient } from './whatsapp.js';
import { CleanAgent } from './agent.js';
import { TierEngine, MysteryShoppingEngine, validateApproach, getAllNiches, getNicheConfig } from './sdr/index.js';

const tierEngine = new TierEngine();

const app = express();
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da interface web e das mídias
const publicDir = path.resolve('public');
app.use(express.static(publicDir));

const port = Number(process.env.PORT || 3333);
const wa = new WhatsAppClient(process.env.AUTH_DIR || '.data/whatsapp-session-kethy');
const ai = new CleanAgent();

let autoReplyEnabled = process.env.AUTO_REPLY === 'true';

// Quando receber mensagem no WhatsApp:
wa.onMessage(async (msg, chat) => {
  console.log(`📩 [${chat.name}] ${msg.senderName}: ${msg.text}`);

  // Se for áudio, transcrever automaticamente em background
  if (msg.mediaType === 'audio' && msg.mediaPath) {
    console.log(`🎙️ Transcrevendo áudio recebido de ${chat.name}...`);
    try {
      const trans = await ai.transcribeAudio(msg.mediaPath);
      msg.transcription = trans;
      wa.saveStorage();
      console.log(`📝 Transcrição (${chat.name}): "${trans}"`);
    } catch (e: any) {
      console.error('Erro na transcrição automática:', e.message);
    }
  }

  // Se for imagem, analisar em background
  if (msg.mediaType === 'image' && msg.mediaPath) {
    console.log(`🖼️ Analisando imagem recebida de ${chat.name}...`);
    try {
      const analysis = await ai.analyzeImage(msg.mediaPath);
      msg.analysis = analysis;
      wa.saveStorage();
      console.log(`🔍 Análise da Imagem (${chat.name}): "${analysis}"`);
    } catch (e: any) {
      console.error('Erro na análise automática de imagem:', e.message);
    }
  }

  // Se auto-reply estiver ativado
  if (autoReplyEnabled) {
    try {
      const answer = await ai.reply(msg.from, msg.text);
      await wa.sendMessage(msg.from, answer);
      console.log(`🤖 Resposta automática enviada para ${chat.name}: ${answer}`);
    } catch (err) {
      console.error('Erro na resposta automática da IA:', err);
    }
  }
});

// Inicializar motor Baileys
void wa.start();

// --- ROTAS DA API REST ---

// 1. Status da Conexão
app.get('/api/status', (req, res) => {
  const unreplied = wa.getUnrepliedChats();
  res.json({
    connected: wa.isConnected,
    userName: wa.userName,
    userJid: wa.userJid,
    hasQr: Boolean(wa.qrCodeDataUrl),
    qrCodeDataUrl: wa.qrCodeDataUrl,
    totalChats: wa.getChats().length,
    unrepliedCount: unreplied.length,
    autoReply: autoReplyEnabled
  });
});

// 2. Retornar imagem direta do QR Code (para carregar em <img> ou navegador)
app.get('/api/qrcode-image', (req, res) => {
  const qrFile = path.resolve('public', 'qrcode.png');
  if (fs.existsSync(qrFile) && !wa.isConnected) {
    res.sendFile(qrFile);
  } else {
    res.status(404).send('QR Code não disponível ou já conectado.');
  }
});

// 3. Solicitar código de pareamento por telefone (ex: 5511999998888)
app.post('/api/pairing-code', async (req, res) => {
  try {
    const phone = String(req.body.phone || '');
    if (!phone) {
      return res.status(400).json({ error: 'Informe o telefone com DDD.' });
    }
    const code = await wa.requestPairingCode(phone);
    res.json({ ok: true, code });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Listar todas as conversas
app.get('/api/chats', (req, res) => {
  res.json(wa.getChats());
});

// 4.1 Listar contatos conhecidos
app.get('/api/contacts', (req, res) => {
  res.json(Array.from(wa.getContacts().entries()));
});

// 4.2 Varrer sessões e buscar informações
app.get('/api/scan-sessions', async (req, res) => {
  try {
    const sessionDir = path.resolve('.data/whatsapp-session-kethy');
    const files = fs.readdirSync(sessionDir).filter(f => f.startsWith('session-') && f.endsWith('.0.json'));
    const results = [];

    for (const f of files) {
      const id = f.replace('session-', '').replace('.0.json', '');
      const jid = id.length > 15 ? `${id}@lid` : `${id}@s.whatsapp.net`;
      const chat = wa.getChat(jid);
      let statusText = '';
      if (wa.sock) {
        try {
          const st = await wa.sock.fetchStatus(jid);
          statusText = st?.status || '';
        } catch (_) {}
      }
      results.push({
        jid,
        name: chat?.name || id,
        lastMessage: chat?.lastMessage || '',
        statusText,
        totalMessages: chat?.messages?.length || 0
      });
    }
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4.3 Consultar info de um contato
app.get('/api/contact-info/:jid', async (req, res) => {
  try {
    const { jid } = req.params;
    let statusText = '';
    let profilePic = '';
    if (wa.sock) {
      try {
        const st = await wa.sock.fetchStatus(jid);
        statusText = st?.status || '';
      } catch (_) {}
      try {
        profilePic = await wa.sock.profilePictureUrl(jid, 'image') || '';
      } catch (_) {}
    }
    res.json({ jid, statusText, profilePic });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Listar conversas não respondidas
app.get('/api/chats/unreplied', (req, res) => {
  res.json(wa.getUnrepliedChats());
});

// 6. Mensagens de uma conversa
app.get('/api/chats/:jid', (req, res) => {
  const { jid } = req.params;
  const chat = wa.getChat(jid);
  if (!chat) {
    return res.status(404).json({ error: 'Conversa não encontrada.' });
  }
  res.json(chat);
});

// 7. Enviar mensagem de texto
app.post('/api/chats/:jid/send', async (req, res) => {
  try {
    const { jid } = req.params;
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Texto da mensagem é obrigatório.' });
    }
    await wa.sendMessage(jid, text);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 8. Rota Mestra de IA: Analisar todas as pendências da Kethely
app.post('/api/ai/analyze-pending', async (req, res) => {
  try {
    const unreplied = wa.getUnrepliedChats();
    const result = await ai.analyzePendingTasks(unreplied);
    res.json({
      ok: true,
      pendingChatsCount: unreplied.length,
      analysis: result
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Analisar imagem sob demanda
app.post('/api/ai/analyze-image', async (req, res) => {
  try {
    const { imagePath, prompt } = req.body;
    const fullPath = path.isAbsolute(imagePath)
      ? imagePath
      : path.resolve('public', imagePath.replace(/^\//, ''));
    const analysis = await ai.analyzeImage(fullPath, prompt);
    res.json({ ok: true, analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Transcrever áudio sob demanda
app.post('/api/ai/transcribe-audio', async (req, res) => {
  try {
    const { audioPath } = req.body;
    const fullPath = path.isAbsolute(audioPath)
      ? audioPath
      : path.resolve('public', audioPath.replace(/^\//, ''));
    const transcription = await ai.transcribeAudio(fullPath);
    res.json({ ok: true, transcription });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Sugerir resposta com IA para um chat
app.post('/api/ai/suggest-reply', async (req, res) => {
  try {
    const { jid } = req.body;
    const chat = wa.getChat(jid);
    if (!chat || chat.messages.length === 0) {
      return res.status(400).json({ error: 'Chat sem mensagens.' });
    }
    const lastMsg = chat.messages[chat.messages.length - 1];
    const suggestion = await ai.reply(jid, `Aja como sugestão de resposta para a Kethely mandar para: "${lastMsg.text}". Gere uma resposta natural, curta e pronta para envio.`);
    res.json({ ok: true, suggestion });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Toggle Auto-Reply
app.post('/api/ai/toggle-auto-reply', (req, res) => {
  autoReplyEnabled = !autoReplyEnabled;
  res.json({ ok: true, autoReply: autoReplyEnabled });
});

// 13. Forçar sincronização de histórico
app.post('/api/force-history-sync', async (req, res) => {
  try {
    const result = await wa.forceHistorySync();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// --- ROTAS DO MOTOR SDR CIENTÍFICO (5 NICHOS, TIERS A/B/C, MYSTERY SHOPPING) ---

// 14. Listar Nichos & Fontes Públicas
app.get('/api/sdr/niches', (_req, res) => {
  res.json({ ok: true, niches: getAllNiches() });
});

// 15. Métricas e Alocação dos Tiers A/B/C
app.get('/api/sdr/tiers', (_req, res) => {
  const snapshot = tierEngine.getSnapshot();
  const evaluation = tierEngine.evaluateDynamicAdjustment();
  res.json({ ok: true, snapshot, evaluation });
});

// 16. Registrar Evento de Prospecção (contato, resposta, reunião)
app.post('/api/sdr/tiers/event', (req, res) => {
  try {
    const { tier, event, week } = req.body;
    if (!['A', 'B', 'C'].includes(tier) || !['contact', 'response', 'meeting'].includes(event)) {
      return res.status(400).json({ error: 'Parâmetros inválidos. tier deve ser A, B ou C; event deve ser contact, response ou meeting.' });
    }
    tierEngine.recordEvent(tier, event, week);
    res.json({ ok: true, snapshot: tierEngine.getSnapshot() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 17. Aplicar Ajuste Dinâmico de Tiers
app.post('/api/sdr/tiers/adjust', (_req, res) => {
  try {
    tierEngine.applyRecommendedAdjustment();
    res.json({ ok: true, snapshot: tierEngine.getSnapshot() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 18. Gerar Diagnóstico de Mystery Shopping
app.post('/api/sdr/mystery-shopping', (req, res) => {
  try {
    const { niche, leadTitle, company, sentAt, repliedAt } = req.body;
    const diag = MysteryShoppingEngine.createDiagnostic(niche || 'dermatologia', leadTitle || 'Doutor(a)', company || 'Clínica', sentAt, repliedAt);
    const approach = MysteryShoppingEngine.formatMysteryApproach(niche || 'dermatologia', leadTitle || 'Doutor(a)', company || 'Clínica', diag);
    const validation = validateApproach(approach, niche);

    res.json({ ok: true, diagnostic: diag, approach, validation });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 19. Validar Abordagem (4 blocos, 50 palavras, 2 balões)
app.post('/api/sdr/validate', (req, res) => {
  try {
    const { text, niche } = req.body;
    const result = validateApproach(text, niche);
    res.json({ ok: true, validation: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Site "Whats Kethy" rodando em http://localhost:${port}`);
  console.log(`🔒 Sessão isolada: ${process.env.AUTH_DIR || '.data/whatsapp-session-kethy'}`);
  console.log(`======================================================\n`);
});
