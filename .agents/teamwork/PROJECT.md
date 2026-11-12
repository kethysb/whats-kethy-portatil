# Project: SDR WhatsApp Whats-Kethy-Portatil (Produção)

## Architecture
O sistema Whats-Kethy-Portatil é composto por três subsistemas integrados:
1. **Engine SDR de Prospecção e Modelos de Nicho**:
   - Mapeamento de 5 nichos brasileiros (Dermatologia, Odontologia, Imobiliária, Advocacia, Logística).
   - Matriz de fontes públicas (Google Perfil, Doctoralia, Portais ZAP/VivaReal, CNA/OAB, Reclame Aqui, Meta Ads Library, Vagas de Atendimento).
   - Gerador de abordagens com conformidade estrita aos 4 blocos: `[Fonte pública] + [fato verificável] + [implicação] + [pergunta/CTA de interesse]`.
   - Restrição física inegociável: exatamente 2 balões (separador `---SPLIT---`) e máximo de 50 palavras no total.
   - Guardrails ético-legais: LGPD (Base legal do Legítimo Interesse B2B), CFM Resolução 2.336/2023 (sem antes/depois, sem promessas, com CRM/RQE), CFO Resoluções 196/2019 e 230/2020 (sem consulta grátis, foco em no-show), OAB Provimento 205/2021 (exclusividade de triagem receptiva, vedada captação ativa).
2. **Motor de Tiers A/B/C, Métricas e Persistência**:
   - Regras de qualificação e abordagem por Tier (A = Alto valor/Enterprise, B = Médio porte/Processo estruturado, C = Entrada/Rápida escala).
   - Persistência estruturada local (JSON/SQLite) para monitorar contatos, taxas de resposta e reuniões por Tier ao longo de 4 a 6 semanas.
   - Algoritmo de ajuste dinâmico: Se `convRate(A) < 2 * convRate(B)`, reduzir automaticamente o tempo alocado para o Tier A.
3. **Módulo de Mystery Shopping Ético e CTAs de Reciprocidade**:
   - Pergunta simples e objetiva sem efetuar agendamento fictício para medir tempo real de resposta.
   - Revelação transparente do teste no início da abordagem como diagnóstico gratuito.
   - 3 formatos de CTAs de reciprocidade: print/dado do tempo de resposta medido, mini diagnóstico em 3 linhas ou lista das 5 dúvidas repetidas de clientes.
4. **Simulador de Prospecção (Portas 3334 e 3335) e Painel Web**:
   - Servidor HTTP (`simulator/server.cjs`) operando nas portas 3334 (principal) e 3335 (espelho anti-cache).
   - Integração com a API Keydex Shop (`https://keydex.shop/v1/chat/completions`) utilizando o modelo `claude-sonnet-4-6`.
   - Interface web com chat interativo, seletor de nichos, badges de conformidade (2 balões e contagem de palavras) e painel analítico de métricas por Tier.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Modelos e Matriz de 5 Nichos | Suporte completo a Dermatologia, Odontologia, Imobiliária, Advocacia e Logística | M1 | R1 |
| 2 | Matriz de Fontes Públicas | Google Perfil, Doctoralia, Portais, OAB, Reclame Aqui, Meta Ads, Vagas | M1 | R1 |
| 3 | Estrutura dos 4 Blocos Obrigatórios | [Fonte] + [fato verificável] + [implicação] + [CTA] em todas as mensagens | M1 | R1 |
| 4 | Regra de 2 Balões e <= 50 Palavras | Validador e formatador estrito com `---SPLIT---` e contagem de palavras | M1 | R1 |
| 5 | Guardrails Éticos (CFM, CFO, OAB 205, LGPD) | Garantia de conformidade legal, especialmente triagem receptiva para advocacia | M1 | R1 |
| 6 | Cliente Keydex Shop API (claude-sonnet-4-6) | Integração robusta com `https://keydex.shop/v1` para geração e chat | M1 | R4 |
| 7 | Segmentação e Qualificação de Tiers A/B/C | Critérios de qualificação e abordagem diferenciada por Tier | M2 | R2 |
| 8 | Persistência Local Estruturada de Métricas | Armazenamento de 4-6 semanas de contatos, respostas e reuniões por Tier | M2 | R2 |
| 9 | Algoritmo de Ajuste Dinâmico de Tiers | Redução de alocação de tempo se conversão Tier A < 2x Tier B | M2 | R2 |
| 10 | Fluxo de Mystery Shopping Ético | Pergunta de triagem sem agendamento fictício e medição de tempo de resposta | M3 | R3 |
| 11 | Revelação Transparente como Diagnóstico | Abertura honesta da abordagem informando o teste gratuito de atendimento | M3 | R3 |
| 12 | CTAs de Reciprocidade (3 Formatos) | Print/dado de tempo de resposta, mini diagnóstico de 3 linhas, 5 perguntas | M3 | R3 |
| 13 | Backend do Simulador (Portas 3334 e 3335) | Endpoints de leads, métricas de tiers, mystery shopping e chat | M4 | R4 |
| 14 | Frontend do Simulador com Abas e Dashboard | Seletor de nicho, painel de métricas por tier, histórico e painel mystery shopping | M4 | R4 |
| 15 | Integração com Automação Oficial | Compatibilidade e compartilhamento de módulos entre simulador e `src/` | M4 | R4 |
| 16 | Suíte de Cenários Sintéticos & 100% E2E Pass | Validação completa de todos os critérios com suíte E2E automatizada | M5 | R1-R4 |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core SDR Engine, 5 Nichos & Keydex API | Modelos de dados dos 5 nichos, fontes públicas, validador de 2 balões/50 palavras, guardrails éticos e cliente Keydex | none | PLANNED |
| M2 | Engine de Tiers, Persistência & Ajuste Dinâmico | Segmentação Tiers A/B/C, persistência estruturada (JSON/SQLite), tracking 4-6 semanas e regra matemática de 2x | M1 | PLANNED |
| M3 | Mystery Shopping Ético & CTAs de Reciprocidade | Módulo de mystery shopping, medição de tempo de resposta, mini diagnósticos de 3 linhas e CTAs de reciprocidade | M1 | PLANNED |
| M4 | Integração no Simulador (3334/3335) & Dashboard UI | Refatoração de `simulator/server.cjs` e `simulator/public/index.html` com rotas de API, tabs, dashboard de métricas e suporte a Advocacia | M1, M2, M3 | PLANNED |
| M5 | Final Milestone: Validação 100% E2E & Adversarial Hardening | Phase 1: Aprovação em 100% dos testes E2E (Tiers 1-4). Phase 2: Endurecimento adversarial (Tier 5) | M4, E2E_TEST_TRACK | PLANNED |

---

## Interface Contracts

### 1. Niche & Public Source Contract (`nicheEngine`)
```typescript
export type NicheType = 'dermatologia' | 'odontologia' | 'imobiliaria' | 'advocacia' | 'logistica';
export type TierType = 'A' | 'B' | 'C';

export interface PublicSources {
  googleProfile?: { rating?: number; reviewCount?: number; responseTime?: string; closingTime?: string };
  website?: { hasOnlineBooking: boolean; whatsappDirect: boolean };
  instagram?: { activePosts: boolean; unansweredComments: boolean };
  metaAds?: { hasActiveAds: boolean; clickToWhatsApp: boolean };
  jobPostings?: { hiringSAC: boolean; roles: string[] };
  doctoralia?: { verified: boolean; onlineSchedule: boolean; crmOrCro?: string; rqe?: string };
  realEstatePortals?: { creci?: string; activeListingsCount?: number };
  oabProfile?: { oabNumber?: string; receptiveOnly: true }; // Provimento 205/2021
  reclameAqui?: { complaintsTopic?: string; responseTimeSAC?: string };
}

export interface LeadProfile {
  id: string;
  name: string;
  company: string;
  role: string;
  niche: NicheType;
  tier: TierType;
  publicSources: PublicSources;
  mysteryShoppingResult?: MysteryShoppingData;
}

export interface ApproachValidation {
  isValid: boolean;
  bubbleCount: number; // must be exactly 2
  totalWordCount: number; // must be <= 50
  hasRequiredBlocks: {
    hasPublicSource: boolean;
    hasVerifiableFact: boolean;
    hasImplication: boolean;
    hasCtaOrQuestion: boolean;
  };
  errors: string[];
}
```

### 2. Tier Strategy & Persistence Contract (`tierEngine`)
```typescript
export interface WeeklyTierStats {
  week: number; // 1 to 6
  tier: TierType;
  contactsApproached: number;
  responsesReceived: number;
  meetingsBooked: number;
  responseRate: number; // responsesReceived / contactsApproached
  meetingConversionRate: number; // meetingsBooked / contactsApproached
}

export interface DynamicAdjustmentResult {
  needsAdjustment: boolean; // true if convRate(A) < 2 * convRate(B) (given minimum sample)
  tierAConversionRate: number;
  tierBConversionRate: number;
  thresholdRequired: number; // 2 * tierBConversionRate
  currentAllocation: { tierA: number; tierB: number; tierC: number }; // percentages, e.g. 50, 30, 20
  recommendedAllocation: { tierA: number; tierB: number; tierC: number }; // e.g. 30, 45, 25
  reason: string;
}
```

### 3. Mystery Shopping Contract (`mysteryShoppingEngine`)
```typescript
export interface MysteryShoppingData {
  testQuestion: string; // simple non-booking question
  measuredResponseTimeMinutes: number;
  testedAt: string;
  miniDiagnostic3Lines: [string, string, string]; // exactly 3 lines of diagnostic value
  frequentQuestionsList: string[]; // 5 frequent questions
  transparencyNotice: string; // honest initial disclosure
}
```

---

## Code Layout
- `src/sdr/`:
  - `src/sdr/types.ts`: Definições de tipos, enums e contratos de dados.
  - `src/sdr/niches.ts`: Matriz de fontes públicas, regras éticas e personas padrão para os 5 nichos.
  - `src/sdr/validator.ts`: Validador determinístico dos 4 blocos, 2 balões e <= 50 palavras.
  - `src/sdr/keydexClient.ts`: Cliente da API Keydex Shop (`claude-sonnet-4-6`).
  - `src/sdr/tierManager.ts`: Engine de Tiers A/B/C, persistência de métricas de 4-6 semanas e regra matemática de ajuste dinâmico (2x).
  - `src/sdr/mysteryShopping.ts`: Engine de mystery shopping ético, diagnósticos de 3 linhas e CTAs de reciprocidade.
- `simulator/`:
  - `simulator/server.cjs`: Servidor Express/Node para portas 3334 e 3335 com rotas atualizadas.
  - `simulator/data/`: Persistência local de métricas e leads (`tier_metrics.json`).
  - `simulator/public/index.html`: Interface web aprimorada com seletor de 5 nichos, painel de métricas por Tier e tela de mystery shopping.
- `tests/`:
  - `tests/e2e/`: Suíte de testes ponta a ponta dos Tiers 1 a 4.
  - `tests/synthetic_personas.json`: 5 personas completas cobrindo os 5 nichos.
