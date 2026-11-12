import fs from 'fs';
import path from 'path';
import { ChatSummary, StoredMessage } from './whatsapp.js';

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string | any[];
};

export class CleanAgent {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private visionModel: string;
  private audioModel: string;
  private systemPrompt: string;
  private memory: Map<string, any[]> = new Map();

  constructor() {
    this.apiKey = process.env.AI_API_KEY || '';
    this.baseUrl = process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1';
    this.model = process.env.AI_MODEL || 'llama-3.3-70b-versatile';
    this.visionModel = process.env.AI_VISION_MODEL || 'llama-3.2-11b-vision-preview';
    this.audioModel = process.env.AI_AUDIO_MODEL || 'whisper-large-v3-turbo';
    this.systemPrompt =
      process.env.SYSTEM_PROMPT ||
      'Você é a assistente pessoal inteligente da Kethely. Ajude com clareza, empatia e objetividade.';
  }

  // Responder mensagem individual
  public async reply(from: string, userText: string): Promise<string> {
    if (!this.apiKey) return 'API de IA não configurada no .env.';

    const history = this.memory.get(from) || [];
    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...history.slice(-8),
      { role: 'user', content: userText }
    ];

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.5,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Erro IA (${response.status}): ${errBody}`);
      }

      const data = await response.json();
      const replyText =
        data.choices?.[0]?.message?.content?.trim() || 'Desculpe, não consegui processar a resposta.';

      history.push({ role: 'user', content: userText });
      history.push({ role: 'assistant', content: replyText });
      this.memory.set(from, history);

      return replyText;
    } catch (err: any) {
      console.error('Erro na IA:', err.message);
      return `Erro ao processar com IA: ${err.message}`;
    }
  }

  // Analisar pendências e criar checklist de tarefas
  public async analyzePendingTasks(unrepliedChats: ChatSummary[]): Promise<string> {
    if (!this.apiKey) return 'Adicione a AI_API_KEY no arquivo .env para ativar a análise inteligente.';

    if (unrepliedChats.length === 0) {
      return '🎉 Parabéns Kethely! Nenhuma mensagem não respondida no momento. Tudo em dia!';
    }

    // Montar resumo das conversas
    const chatsData = unrepliedChats.map((c) => {
      const recent = c.messages.slice(-5).map((m) => {
        let extra = '';
        if (m.mediaType) extra = ` [Mídia: ${m.mediaType}]`;
        if (m.transcription) extra += ` [Transcrição do Áudio: "${m.transcription}"]`;
        if (m.analysis) extra += ` [Análise da Imagem: "${m.analysis}"]`;
        return `${m.senderName}: ${m.text}${extra}`;
      }).join('\n');

      return `--- Contato: ${c.name} (${c.jid.split('@')[0]}) ---\nÚltimas mensagens:\n${recent}\n`;
    }).join('\n');

    const prompt = `Você é o Co-Piloto e Assistente Pessoal de Alta Produtividade da Kethely.
Analise detalhadamente as seguintes mensagens não respondidas no WhatsApp dela e monte um relatório super prático e direto ao ponto:

${chatsData}

Seu relatório DEVE conter estas seções bem formatadas com emojis:
1. 🚨 **URGÊNCIAS & COBRANÇAS IMEDIATAS** (quem está esperando uma decisão, aprovação, resposta rápida ou documento)
2. 📝 **CHECKLIST DE TAREFAS DA KETHELY** (lista com caixas de seleção [ ] com o que exatamente a Kethely precisa fazer no mundo real)
3. 💬 **SUGESTÕES DE RESPOSTAS RÁPIDAS** (para cada contato prioritário, escreva uma resposta pronta curta e simpática no tom dela para ela só copiar e mandar)
4. ☕ **PODE RESPONDER MAIS TARDE / BAIXA PRIORIDADE** (mensagens casuais ou sem urgência)

Escreva em português brasileiro, tom profissional, ágil e atencioso.`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || 'Não foi possível gerar a análise.';
    } catch (err: any) {
      console.error('Erro ao analisar tarefas:', err);
      return `Erro ao gerar análise: ${err.message}`;
    }
  }

  // Analisar imagem usando modelo de visão
  public async analyzeImage(imagePath: string, userInstruction?: string): Promise<string> {
    if (!this.apiKey) return 'API de IA não configurada.';
    if (!fs.existsSync(imagePath)) return 'Imagem não encontrada no disco.';

    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const ext = path.extname(imagePath).replace('.', '') || 'jpeg';
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
      const dataUri = `data:${mimeType};base64,${base64Image}`;

      const promptText =
        userInstruction ||
        'O que há nesta imagem enviada no WhatsApp para a Kethely? É um comprovante, documento, erro, print ou foto? Extraia os dados principais (valores, datas, nomes ou tarefas necessárias).';

      const messages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: promptText },
            { type: 'image_url', image_url: { url: dataUri } }
          ]
        }
      ];

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.visionModel,
          messages,
          temperature: 0.2,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erro Visão: ${errText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || 'Sem descrição gerada.';
    } catch (err: any) {
      console.error('Erro ao analisar imagem:', err.message);
      return `Erro ao analisar imagem: ${err.message}`;
    }
  }

  // Transcrever áudio usando Whisper
  public async transcribeAudio(audioPath: string): Promise<string> {
    if (!this.apiKey) return 'API de IA não configurada.';
    if (!fs.existsSync(audioPath)) return 'Arquivo de áudio não encontrado.';

    try {
      const fileBuffer = fs.readFileSync(audioPath);
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
      const filename = path.basename(audioPath);

      // Montar multipart/form-data nativo sem dependência externa
      const parts: Buffer[] = [];

      // Campo model
      parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\n${this.audioModel}\r\n`));
      // Campo language
      parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\npt\r\n`));
      // Campo file
      parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: audio/ogg\r\n\r\n`));
      parts.push(fileBuffer);
      parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

      const payload = Buffer.concat(parts);

      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body: payload
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erro Transcrição (${response.status}): ${errText}`);
      }

      const data = await response.json();
      return data.text || 'Transcrição vazia.';
    } catch (err: any) {
      console.error('Erro ao transcrever áudio:', err.message);
      return `Erro na transcrição: ${err.message}`;
    }
  }
}
