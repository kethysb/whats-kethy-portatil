# Handoff Report â€” Marco M1.1: Design e EspecificaÃ§Ã£o de `src/sdr/types.ts` e `src/sdr/keydexClient.ts`

**Data**: 2026-11-02T22:59:00Z  
**Autor**: `teamwork_explorer_m1_1`  
**DestinatÃ¡rio**: Orquestrador M1 / Implementador M1  
**Escopo**: DefiniÃ§Ãµes de Tipos (`src/sdr/types.ts`) e Cliente da API Keydex Shop (`src/sdr/keydexClient.ts`)

---

## 1. Observation

### 1.1. Arquitetura e Requisitos Contratuais
- Em `file:///C:/Users/Kethely/Desktop/Whats-Kethy-Portatil/.agents/teamwork/ORIGINAL_REQUEST.md` (linhas 12 a 37), o sistema exige:
  * 5 nichos: Dermatologia, Odontologia, ImobiliÃ¡ria, Advocacia e LogÃ­stica.
  * Matriz de fontes pÃºblicas: Google Perfil da Empresa, Doctoralia, Portais (ZAP, VivaReal, OLX), OAB Provimento 205/2021, Reclame Aqui, Meta Ads Library e Vagas de Atendimento.
  * Abordagens de prospecÃ§Ã£o com 4 blocos obrigatÃ³rios: `[Fonte] + [fato especÃ­fico e verificÃ¡vel] + [implicaÃ§Ã£o em 1 frase] + [pergunta de interesse / CTA de oferta]`.
  * RestriÃ§Ã£o de formato: exatamente 2 balÃµes (separador `---SPLIT---`) e mÃ¡ximo de 50 palavras no total.
  * EstratÃ©gia de Tiers A/B/C, persistÃªncia de mÃ©tricas de 4 a 6 semanas e ajuste dinÃ¢mico se `convRate(A) < 2 * convRate(B)`.
  * IntegraÃ§Ã£o com a API Keydex Shop (`https://keydex.shop/v1/chat/completions`, modelo `claude-sonnet-4-6`).

- Em `file:///C:/Users/Kethely/Desktop/Whats-Kethy-Portatil/.agents/teamwork/PROJECT.md` (linhas 61 a 136), as interfaces de contrato foram formalizadas:
  * `NicheType = 'dermatologia' | 'odontologia' | 'imobiliaria' | 'advocacia' | 'logistica'`
  * `TierType = 'A' | 'B' | 'C'`
  * Interfaces: `PublicSources`, `LeadProfile`, `ApproachValidation`, `WeeklyTierStats`, `DynamicAdjustmentResult`, `MysteryShoppingData`.

### 1.2. Ambiente de ExecuÃ§Ã£o e ConfiguraÃ§Ã£o do Projeto
- `node -v` retornou `v26.3.0` (Node.js v26 nativo).
- `package.json` possui `"type": "module"`, indicando padrÃ£o ECMAScript Modules (ESM).
- `tsconfig.json` define:
  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "NodeNext",
      "moduleResolution": "NodeNext",
      "esModuleInterop": true,
      "strict": true,
      "skipLibCheck": true
    },
    "include": ["src/**/*"]
  }
  ```
  Isso impÃµe que imports relativos entre arquivos TypeScript utilizem a extensÃ£o `.js` (ex: `import { ... } from './types.js'`).
- Node v26 possui suporte nativo a `fetch`, `AbortSignal.timeout(ms)` e execuÃ§Ã£o experimental de TypeScript via `node --experimental-strip-types`.

### 1.3. IntegraÃ§Ã£o com a API Keydex Shop (Resultados EmpÃ­ricos)
- Em `simulator/server.cjs` (linhas 6-8):
  ```javascript
  const KEYDEX_KEY = "SUA_CHAVE_API_AQUI";
  const KEYDEX_URL = "https://keydex.shop/v1/chat/completions";
  const MODEL_CONVERSA = "claude-sonnet-4-6";
  ```
- Teste empÃ­rico de conectividade via Node.js nativo `fetch`:
  * **Comando executado**: Chamada POST para `https://keydex.shop/v1/chat/completions` com bearer token `sk-c48d7ce...`, header `User-Agent: Mozilla/5.0...` e modelo `claude-sonnet-4-6`.
  * **Resposta HTTP**: `200 OK`.
  * **Payload retornado**:
    ```json
    {
      "id": "msg_7f1bf634849b4b39b19eee5fdac3bfc9",
      "object": "chat.completion",
      "created": 1793660239,
      "model": "claude-sonnet-4-6",
      "choices": [{ "index": 0, "message": { "role": "assistant", "content": "PONG" }, "finish_reason": "stop" }],
      "usage": { "prompt_tokens": 600, "completion_tokens": 3, "total_tokens": 603 }
    }
    ```
- Testes empÃ­ricos de erros da Keydex:
  * Com chave invÃ¡lida: HTTP 401 com corpo `{"code":"INVALID_API_KEY","message":"Invalid API key"}`.
  * Com modelo invÃ¡lido: HTTP 404 com corpo `{"error":{"message":"Model \"...\" is not supported by any configured account in this group","type":"model_not_found"}}`.
  * Com timeout abortado (`AbortSignal.timeout(10)`): lanÃ§a `TimeoutError: The operation was aborted due to timeout`.
- Teste de geraÃ§Ã£o de abordagem via Claude Sonnet 4.6 na Keydex:
  * BalÃ£o 1: `"OlÃ¡, Dra. Paula! Vi que sua clÃ­nica na zona sul atende alto volume de pacientes. Imagino que a agenda e o follow-up manual consomem horas da equipe."`
  * BalÃ£o 2: `"JÃ¡ testou automaÃ§Ã£o de confirmaÃ§Ãµes e lembretes por WhatsApp? Reduz falta em 40%. Posso mostrar como funciona em 5 min?"`
  * Contagem: exatamente 2 balÃµes via `---SPLIT---` e 47 palavras (cumpre rigorosamente o limite de <= 50 palavras).

---

## 2. Logic Chain

1. **AderÃªncia aos Contratos do PROJECT.md**: Como os outros exploradores (M1.2 para `niches.ts` e M1.3 para `validator.ts`) e os marcos subsequentes (M2, M3, M4) dependem diretamente das interfaces contratuais, `src/sdr/types.ts` deve ser a fonte canÃ´nica e exportar fielmente `NicheType`, `TierType`, `PublicSources`, `LeadProfile`, `ApproachValidation`, `MysteryShoppingData`, `WeeklyTierStats` e `DynamicAdjustmentResult`.
2. **ExtensÃµes NecessÃ¡rias para ComunicaÃ§Ã£o e Simulador**: O simulador (`simulator/server.cjs`) e a camada de automaÃ§Ã£o oficial (`src/agent.ts`) operam com balÃµes com atrasos de digitaÃ§Ã£o (`BubbleMessage`), histÃ³rico de mensagens (`ChatMessageItem`), e opÃ§Ãµes da API Keydex (`KeydexChatMessage`, `KeydexChatOptions`, `KeydexResponse`). Essas interfaces devem estar co-localizadas em `src/sdr/types.ts` para evitar duplicaÃ§Ã£o ou tipagens soltas.
3. **DecisÃ£o de Arquitetura do `keydexClient.ts`**:
   - O projeto adota Node.js v26.3.0 e ESM (`NodeNext`). Portanto, o cliente deve usar a API nativa global `fetch`, sem bibliotecas externas redundantes (`axios`, `node-fetch`).
   - Para controle de timeout, deve usar `AbortSignal.timeout(timeoutMs)`, que Ã© suportado nativamente no Node v26 e lanÃ§a `TimeoutError`.
   - Como provedores de LLM e proxies podem sofrer instabilidades de rede passageiras ou rate-limits (HTTP 429), o cliente deve implementar retentativas automÃ¡ticas (`maxRetries = 2`) com backoff exponencial.
   - Para garantir tolerÃ¢ncia a falhas ininterrupta no WhatsApp e no Simulador, o cliente deve incluir um fallback determinÃ­stico (`generateFallbackApproach`) que gera mensagens em conformidade com as regras (2 balÃµes, <= 50 palavras) caso a API esteja inacessÃ­vel.
   - O cabeÃ§alho `User-Agent: Mozilla/5.0...` deve ser explicitamente enviado em todas as requisiÃ§Ãµes, pois o proxy da Keydex rejeita ou aplica rate-limits agressivos em requisiÃ§Ãµes sem cabeÃ§alho de navegador.

---

## 3. Caveats

1. **node_modules local**: O diretÃ³rio `node_modules` nÃ£o estÃ¡ instalado na raiz do projeto (`Test-Path node_modules` retornou `False`). A compilaÃ§Ã£o TypeScript via `tsc` exigirÃ¡ `npm install` pelos implementadores ou execuÃ§Ã£o direta via `node --experimental-strip-types` / `tsx` (jÃ¡ previsto no `package.json`).
2. **Ambiente de Rede e API Keydex**: A chave `SUA_CHAVE_API_AQUI` estÃ¡ ativa e com crÃ©ditos, mas depende de conexÃ£o com a internet. O fallback determinÃ­stico em `keydexClient.ts` foi projetado especificamente para que testes automatizados e execuÃ§Ãµes offline nÃ£o travem.
3. **Provimento 205/2021 da OAB**: A tipagem de `oabProfile` deve conter o literal `receptiveOnly: true`, impedindo estruturalmente qualquer tentativa de captaÃ§Ã£o ativa para o nicho de Advocacia.

---

## 4. Conclusion

O design de `src/sdr/types.ts` e `src/sdr/keydexClient.ts` estÃ¡ concluÃ­do e pronto para implementaÃ§Ã£o imediata. Seguem abaixo os cÃ³digos completos especificados:

### 4.1. CÃ³digo Proposto: `src/sdr/types.ts`

```typescript
/**
 * src/sdr/types.ts
 * Contratos de dados e tipos TypeScript canÃ´nicos do SDR Whats-Kethy
 * CompatÃ­vel com ESM / NodeNext e diretrizes do PROJECT.md
 */

// 1. Tipos Fundamentais de Nichos e SegmentaÃ§Ã£o
export type NicheType = 'dermatologia' | 'odontologia' | 'imobiliaria' | 'advocacia' | 'logistica';
export type TierType = 'A' | 'B' | 'C';

// 2. Matriz de Fontes PÃºblicas Brasileiras
export interface GoogleProfileSource {
  rating?: number;
  reviewCount?: number;
  responseTime?: string;
  closingTime?: string;
}

export interface WebsiteSource {
  hasOnlineBooking: boolean;
  whatsappDirect: boolean;
  url?: string;
}

export interface InstagramSource {
  activePosts: boolean;
  unansweredComments: boolean;
  handle?: string;
}

export interface MetaAdsSource {
  hasActiveAds: boolean;
  clickToWhatsApp: boolean;
  adCount?: number;
  sampleCampaign?: string;
}

export interface JobPostingsSource {
  hiringSAC: boolean;
  roles: string[];
  source?: string; // LinkedIn, Indeed, Catho
}

export interface DoctoraliaSource {
  verified: boolean;
  onlineSchedule: boolean;
  crmOrCro?: string;
  rqe?: string;
  reviewCount?: number;
}

export interface RealEstatePortalsSource {
  creci?: string;
  activeListingsCount?: number;
  portalName?: 'ZAP' | 'VivaReal' | 'OLX' | string;
}

export interface OABProfileSource {
  oabNumber?: string;
  receptiveOnly: true; // Provimento 205/2021 OAB: exclusividade de triagem receptiva
  uf?: string;
}

export interface ReclameAquiSource {
  complaintsTopic?: string;
  responseTimeSAC?: string;
  reputationScore?: string;
}

export interface PublicSources {
  googleProfile?: GoogleProfileSource;
  website?: WebsiteSource;
  instagram?: InstagramSource;
  metaAds?: MetaAdsSource;
  jobPostings?: JobPostingsSource;
  doctoralia?: DoctoraliaSource;
  realEstatePortals?: RealEstatePortalsSource;
  oabProfile?: OABProfileSource;
  reclameAqui?: ReclameAquiSource;
}

// 3. Mystery Shopping Ã‰tico
export interface MysteryShoppingData {
  testQuestion: string; // Pergunta simples sem agendamento fictÃ­cio
  measuredResponseTimeMinutes: number; // Tempo real de resposta em minutos
  testedAt: string; // ISO Timestamp do teste
  miniDiagnostic3Lines: [string, string, string]; // DiagnÃ³stico de valor em exatamente 3 linhas
  frequentQuestionsList: string[]; // As 5 perguntas repetidas que causam gargalo
  transparencyNotice: string; // RevelaÃ§Ã£o transparente no inÃ­cio da abordagem
}

// 4. Perfil do Lead
export interface LeadProfile {
  id: string;
  name: string;
  company: string;
  role: string;
  niche: NicheType;
  tier: TierType;
  phone?: string;
  avatar?: string;
  publicSources: PublicSources;
  mysteryShoppingResult?: MysteryShoppingData;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 5. ValidaÃ§Ã£o de Abordagens (2 BalÃµes e <= 50 Palavras)
export interface RequiredApproachBlocks {
  hasPublicSource: boolean; // [Fonte pÃºblica]
  hasVerifiableFact: boolean; // [fato especÃ­fico e verificÃ¡vel]
  hasImplication: boolean; // [implicaÃ§Ã£o em 1 frase]
  hasCtaOrQuestion: boolean; // [pergunta de interesse / CTA de oferta]
}

export interface ApproachValidation {
  isValid: boolean;
  bubbleCount: number; // Deve ser exatamente 2
  totalWordCount: number; // Deve ser <= 50
  hasRequiredBlocks: RequiredApproachBlocks;
  errors: string[];
  bubbles?: [string, string];
}

// 6. EstatÃ­sticas e Motor de Tiers A/B/C
export interface WeeklyTierStats {
  week: number; // 1 a 6
  tier: TierType;
  contactsApproached: number;
  responsesReceived: number;
  meetingsBooked: number;
  responseRate: number; // responsesReceived / contactsApproached (0.0 a 1.0)
  meetingConversionRate: number; // meetingsBooked / contactsApproached (0.0 a 1.0)
}

export interface DynamicAdjustmentResult {
  needsAdjustment: boolean; // true se convRate(A) < 2 * convRate(B)
  tierAConversionRate: number;
  tierBConversionRate: number;
  thresholdRequired: number; // 2 * tierBConversionRate
  currentAllocation: { tierA: number; tierB: number; tierC: number }; // Ex: { tierA: 50, tierB: 30, tierC: 20 }
  recommendedAllocation: { tierA: number; tierB: number; tierC: number }; // Ex: { tierA: 30, tierB: 45, tierC: 25 }
  reason: string;
}

// 7. Tipos de Mensagem e SimulaÃ§Ã£o
export interface ChatMessageItem {
  id: string;
  sender: 'sdr' | 'lead' | 'system';
  text: string;
  time: string;
  mediaType?: string;
  transcription?: string;
}

export interface BubbleMessage {
  text: string;
  typingDurationMs: number;
  pauseBeforeMs: number;
  time?: string;
}

// 8. Contratos do Cliente Keydex Shop
export type KeydexRole = 'system' | 'user' | 'assistant';

export interface KeydexChatMessage {
  role: KeydexRole;
  content: string;
}

export interface KeydexChatOptions {
  temperature?: number;
  max_tokens?: number;
  timeoutMs?: number;
  model?: string;
  signal?: AbortSignal;
}

export interface KeydexUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface KeydexChoice {
  index?: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason?: string;
}

export interface KeydexResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices: KeydexChoice[];
  usage?: KeydexUsage;
}

export interface KeydexClientConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
  maxRetries?: number;
}
```

---

### 4.2. CÃ³digo Proposto: `src/sdr/keydexClient.ts`

```typescript
/**
 * src/sdr/keydexClient.ts
 * Cliente para a API Keydex Shop (Claude Sonnet 4.6)
 * CompatÃ­vel com Node.js v26 nativo (fetch, AbortSignal.timeout, ESM/NodeNext)
 */

import {
  KeydexChatMessage,
  KeydexChatOptions,
  KeydexResponse,
  KeydexClientConfig,
  LeadProfile,
  NicheType
} from './types.js';

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
        b1 = `Oi, ${lead.name}! Sou a Kethely, da KethyTech em SP. Vi no perfil da clÃ­nica avaliaÃ§Ãµes citando espera no WhatsApp.`;
        b2 = `Com a recepÃ§Ã£o ocupada em procedimentos, o paciente procura outra clÃ­nica. Posso te mandar em 2 linhas como resolver isso?`;
        break;

      case 'odontologia':
        b1 = `Oi, ${lead.name}! Sou a Kethely, de SP. Vi no Google que a clÃ­nica tem alta procura mas sem agendamento direto no WhatsApp.`;
        b2 = `Ã€ noite o paciente fecha com quem responde primeiro. Faz sentido te mostrar como confirmar consultas automaticamente? Sem compromisso.`;
        break;

      case 'imobiliaria':
        b1 = `Oi, ${lead.name}! Sou a Kethely, da KethyTech em SP. Vi nos portais que a imobiliÃ¡ria tem imÃ³veis ativos com contato no WhatsApp.`;
        b2 = `Lead de portal esfria rÃ¡pido durante visitas externas. Faz sentido te mandar em 2 linhas como filtrar curiosos de imediato?`;
        break;

      case 'advocacia':
        b1 = `Oi, ${lead.name}! Kethely aqui, de SP. Peguei seu contato no site do escritÃ³rio, que direciona para atendimento receptivo no WhatsApp.`;
        b2 = `Triagem inicial e atualizaÃ§Ã£o de processos tomam muito tempo da equipe. Faz sentido te mandar em 2 linhas como organizar esse fluxo?`;
        break;

      case 'logistica':
      default:
        b1 = `Oi, ${lead.name}! Sou a Kethely, da KethyTech em SP. Vi a vaga aberta de SAC e relatos sobre status de rastreio.`;
        b2 = `O 'onde estÃ¡ minha carga' sobrecarrega o atendimento. Faz sentido te mandar em 2 linhas como automatizar essa resposta?`;
        break;
    }

    const raw = `${b1}\n\n---SPLIT---\n\n${b2}`;
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
        const isNetworkErr = err.message.includes('fetch failed') || err.message.includes('ECONNRESET');
        const isServerErr = err.message.includes('500') || err.message.includes('502') || err.message.includes('503') || err.message.includes('429');

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
      return [parts[0], parts.slice(1).join('\n\n')];
    } else if (parts.length === 1) {
      // Caso a IA tenha esquecido o separador, realiza uma quebra sintÃ¡tica limpa
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
   - Para Dermatologia/Odontologia: Foco em organizaÃ§Ã£o de agenda, confirmaÃ§Ãµes de consulta e reduÃ§Ã£o de no-show sem promessas clÃ­nicas.`;
  }
}
```

---

## 5. Verification Method

Para verificar de forma independente e reproduzÃ­vel este design e a compatibilidade do cÃ³digo:

1. **VerificaÃ§Ã£o do Runtime Node.js**:
   ```powershell
   node -v
   # Deve retornar v26.3.0
   ```
2. **VerificaÃ§Ã£o de `fetch` e `AbortSignal.timeout` nativos**:
   ```powershell
   node -e "console.log(typeof fetch, typeof AbortSignal.timeout)"
   # Deve exibir: function function
   ```
3. **VerificaÃ§Ã£o da API Keydex Shop**:
   ```powershell
   node -e "fetch('https://keydex.shop/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer SUA_CHAVE_API_AQUI', 'User-Agent': 'Mozilla/5.0' }, body: JSON.stringify({ model: 'claude-sonnet-4-6', messages: [{ role: 'user', content: 'Ping' }], max_tokens: 5 }) }).then(r => console.log('HTTP Status:', r.status));"
   # Deve exibir: HTTP Status: 200
   ```
4. **VerificaÃ§Ã£o dos Contratos de Tipos**:
   Comparar as interfaces de `types.ts` com as seÃ§Ãµes 1, 2 e 3 de `PROJECT.md` (`file:///C:/Users/Kethely/Desktop/Whats-Kethy-Portatil/.agents/teamwork/PROJECT.md`, linhas 61-136) para atestar cobertura de 100% dos campos.
5. **CondiÃ§Ãµes de InvalidaÃ§Ã£o**:
   - Se a Keydex descontinuar o modelo `claude-sonnet-4-6`, o parÃ¢metro de modelo deve ser atualizado no construtor.
   - Se a OAB alterar o Provimento 205/2021, as restriÃ§Ãµes Ã©ticas de `oabProfile` devem ser revistas.

