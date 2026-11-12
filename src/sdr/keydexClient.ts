/**
 * src/sdr/keydexClient.ts
 * Cliente para a API Keydex Shop (Claude Sonnet 4.6)
 * CompatÃ­vel com Node.js v26 nativo (fetch, AbortSignal.timeout, ESM/NodeNext)
 */

import {
  KeydexChatMessage,
  KeydexChatOptions,
  KeydexClientConfig,
  KeydexResponse,
  LeadProfile,
  NicheType
} from './types.js';

declare const process: any;

export class KeydexClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly defaultTimeoutMs: number;
  private readonly maxRetries: number;

  constructor(config?: KeydexClientConfig) {
    this.apiKey =
      config?.apiKey ||
      process.env.KEYDEX_API_KEY ||
      'SUA_CHAVE_API_AQUI';

    this.baseUrl =
      config?.baseUrl ||
      process.env.KEYDEX_URL ||
      process.env.KEYDEX_BASE_URL ||
      'https://keydex.shop/v1/chat/completions';

    this.defaultModel =
      config?.model ||
      process.env.KEYDEX_MODEL ||
      'claude-sonnet-4-6';

    this.defaultTimeoutMs = config?.timeoutMs || 25000;
    this.maxRetries = config?.maxRetries ?? 2;
  }

  /**
   * Executa chamada de chat completion na API Keydex Shop
   */
  public async chatCompletion(
    messages: KeydexChatMessage[],
    options?: KeydexChatOptions
  ): Promise<string> {
    const model = options?.model || this.defaultModel;
    const temperature = options?.temperature ?? 0.5;
    const max_tokens = options?.max_tokens ?? 400;
    const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;

    const payload = {
      model,
      messages,
      temperature,
      max_tokens
    };

    const response = await this.executeWithRetry(payload, timeoutMs);
    const content = response.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('Keydex API retornou uma resposta sem conteÃºdo.');
    }

    return content;
  }

  /**
   * Gera abordagem de prospecÃ§Ã£o em 2 balÃµes e <= 50 palavras para um lead especÃ­fico
   */
  public async generateApproach(
    lead: LeadProfile,
    customPrompt?: string
  ): Promise<{ raw: string; bubbles: [string, string]; totalWords: number; isValid: boolean }> {
    const systemPrompt = customPrompt || this.buildSystemPrompt(lead);
    const userPrompt = `Gere agora a abordagem de WhatsApp para o lead: ${lead.name} (${lead.company}). Respeite rigorosamente a divisÃ£o com ---SPLIT--- e o limite de 50 palavras no total.`;

    const messages: KeydexChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const raw = await this.chatCompletion(messages, { temperature: 0.3, max_tokens: 250 });
      const bubbles = this.parseBubbles(raw);
      const totalWords = this.countWords(raw);
      const isValid = bubbles.length === 2 && totalWords <= 50;

      return { raw, bubbles, totalWords, isValid };
    } catch (err: any) {
      console.warn(`[KeydexClient] Falha na geraÃ§Ã£o online (${err.message}). Acionando fallback determinÃ­stico.`);
      return this.generateFallbackApproach(lead);
    }
  }

  /**
   * Fallback determinÃ­stico offline garantindo conformidade caso a API esteja indisponÃ­vel
   */
  public generateFallbackApproach(lead: LeadProfile): {
    raw: string;
    bubbles: [string, string];
    totalWords: number;
    isValid: boolean;
  } {
    let b1 = '';
    let b2 = '';

    switch (lead.niche) {
      case 'dermatologia':
        b1 = `Oi, ${lead.name}! Sou a Kethely de SP. Vi no Google que 3 das Ãºltimas avaliaÃ§Ãµes citam demora para responder no WhatsApp.`;
        b2 = `A recepÃ§Ã£o costuma dividir agenda e mensagens. Faz sentido te mandar em 2 linhas como resolvemos isso em clÃ­nicas? Se nÃ£o for prioridade, sÃ³ avisar.`;
        break;

      case 'odontologia':
        b1 = `Oi, ${lead.name}! Sou a Kethely de SP. Achei o consultÃ³rio no Google e vi que fazem tratamentos de implantes e alinhadores.`;
        b2 = `Muitos consultÃ³rios perdem tempo com curiosos na recepÃ§Ã£o. Faz sentido te mandar em 2 linhas como prÃ©-qualificar antes da consulta? Se nÃ£o for o momento, me avisa.`;
        break;

      case 'imobiliaria':
        b1 = `Oi, ${lead.name}! Sou a Kethely de SP. Vi no ZAP mais de 100 imÃ³veis ativos direcionando pro WhatsApp.`;
        b2 = `Lead de portal esfria rÃ¡pido enquanto o corretor faz visitas. Faz sentido te mandar em 2 linhas como prÃ©-qualificar a renda antes? Se nÃ£o for prioridade, sÃ³ falar.`;
        break;

      case 'advocacia':
        b1 = `Oi, ${lead.name}! Sou a Kethely de SP. Vi no site do escritÃ³rio o atendimento receptivo via WhatsApp.`;
        b2 = `Advogados perdem horas na triagem de novos casos. Faz sentido te mandar em 2 linhas como organizar isso pela OAB 205? Se nÃ£o for prioridade, sÃ³ avisar.`;
        break;

      case 'logistica':
      default:
        b1 = `Oi, ${lead.name}! Sou a Kethely de SP. Vi no LinkedIn a vaga de SAC da transportadora e reclamaÃ§Ãµes de rastreio.`;
        b2 = `O "onde estÃ¡ minha entrega?" costuma lotar o WhatsApp. Faz sentido te mandar em 2 linhas como automatizar esse rastreio? Se nÃ£o for prioridade, sÃ³ falar.`;
        break;
    }

    const raw = `${b1} ---SPLIT--- ${b2}`;
    const bubbles: [string, string] = [b1, b2];
    const totalWords = this.countWords(raw);

    return {
      raw,
      bubbles,
      totalWords,
      isValid: totalWords <= 50
    };
  }

  /**
   * Executa requisiÃ§Ã£o HTTP com retentativas automÃ¡ticas e backoff exponencial
   */
  private async executeWithRetry(payload: any, timeoutMs: number): Promise<KeydexResponse> {
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= this.maxRetries) {
      try {
        const signal = AbortSignal.timeout(timeoutMs);
        const res = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Whats-Kethy-SDR/1.0'
          },
          body: JSON.stringify(payload),
          signal
        });

        if (!res.ok) {
          const status = res.status;
          const errorText = await res.text();
          let parsedError = errorText;

          try {
            const jsonErr = JSON.parse(errorText);
            parsedError = jsonErr.message || jsonErr.error?.message || errorText;
          } catch {}

          // Erros nÃ£o transitÃ³rios (401, 403, 404) nÃ£o devem ser retentados
          if (status === 401 || status === 403 || status === 404) {
            throw new Error(`Keydex API (${status}): ${parsedError}`);
          }

          throw new Error(`Keydex API Erro (${status}): ${parsedError}`);
        }

        const data = (await res.json()) as KeydexResponse;
        return data;

      } catch (err: any) {
        lastError = err;
        attempt++;

        if (attempt > this.maxRetries) {
          break;
        }

        const isTimeout = err.name === 'TimeoutError';
        const isNetworkErr = err.message?.includes('fetch failed') || err.message?.includes('ECONNRESET');
        const isServerErr = err.message?.includes('500') || err.message?.includes('502') || err.message?.includes('503') || err.message?.includes('429');

        if (isTimeout || isNetworkErr || isServerErr) {
          const delayMs = 1000 * Math.pow(2, attempt - 1);
          await this.sleep(delayMs);
        } else {
          // Erro que nÃ£o adianta retentar
          break;
        }
      }
    }

    throw lastError || new Error('Falha ao comunicar com a Keydex API apÃ³s mÃºltiplas tentativas.');
  }

  private parseBubbles(rawContent: string): [string, string] {
    const parts = rawContent
      .split(/---SPLIT---|\\n\\n/g)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (parts.length >= 2) {
      return [parts[0], parts.slice(1).join(' ')];
    } else if (parts.length === 1) {
      // Caso a IA tenha omitido o separador, realiza uma quebra sintÃ¡tica limpa
      const sentences = parts[0].split(/(?<=[.?!])\s+/);
      const mid = Math.ceil(sentences.length / 2);
      const b1 = sentences.slice(0, mid).join(' ');
      const b2 = sentences.slice(mid).join(' ') || 'Faz sentido te mostrar como funciona em 2 minutos?';
      return [b1, b2];
    }

    return ['Oi, tudo bem?', 'Gostaria de saber se faz sentido te mostrar um diagnÃ³stico rÃ¡pido?'];
  }

  private countWords(text: string): number {
    return text
      .replace(/---SPLIT---/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private buildSystemPrompt(lead: LeadProfile): string {
    return `VocÃª Ã© a Kethely, especialista em prospecÃ§Ã£o SDR Ã©tica via WhatsApp da KethyTech em SÃ£o Paulo.
Sua missÃ£o Ã© gerar abordagens frias B2B hiper-personalizadas para o nicho "${lead.niche}".

REGRAS INEGOCIÃVEIS:
1. EXATAMENTE 2 BALÃ•ES separados estritamente por "---SPLIT---".
2. NO MÃXIMO 50 PALAVRAS no total somando os 2 balÃµes.
3. ESTRUTURA DOS 4 BLOCOS:
   - BalÃ£o 1: [Fonte pÃºblica] + [fato especÃ­fico e verificÃ¡vel]
   - BalÃ£o 2: [implicaÃ§Ã£o em 1 frase] + [pergunta de interesse / CTA de oferta leve]
4. ZERO clichÃªs de IA (proibido "Espero que este contato te encontre bem", "Revolucione", "No mundo atual").
5. CONFORMIDADE Ã‰TICO-LEGAL:
   - Para Advocacia: Estrito Provimento 205/2021 da OAB (triagem e atendimento receptivo de quem jÃ¡ procurou o escritÃ³rio, vedada qualquer captaÃ§Ã£o ativa).
   - Para Dermatologia/Odontologia: Foco em organizaÃ§Ã£o de agenda, confirmaÃ§Ãµes de consulta e reduÃ§Ã£o de no-show sem promessas clÃ­nicas nem consultas gratuitas.`;
  }
}

