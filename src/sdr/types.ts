/**
 * src/sdr/types.ts
 * Contratos de dados e tipos TypeScript canônicos do SDR Whats-Kethy
 * Compatível com ESM / NodeNext e diretrizes do PROJECT.md
 */

// 1. Tipos Fundamentais de Nichos e Segmentação
export type NicheType = 'dermatologia' | 'odontologia' | 'imobiliaria' | 'advocacia' | 'logistica';
export type TierType = 'A' | 'B' | 'C';

// 2. Matriz de Fontes Públicas Brasileiras
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

// 3. Mystery Shopping Ético
export interface MysteryShoppingData {
  testQuestion: string; // Pergunta simples sem agendamento fictício
  measuredResponseTimeMinutes: number; // Tempo real de resposta em minutos
  testedAt: string; // ISO Timestamp do teste
  miniDiagnostic3Lines: [string, string, string]; // Diagnóstico de valor em exatamente 3 linhas
  frequentQuestionsList: string[]; // As 5 perguntas repetidas que causam gargalo
  transparencyNotice: string; // Revelação transparente no início da abordagem
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

// 5. Validação de Abordagens (2 Balões e <= 50 Palavras)
export interface RequiredApproachBlocks {
  hasPublicSource: boolean; // [Fonte pública]
  hasVerifiableFact: boolean; // [fato específico e verificável]
  hasImplication: boolean; // [implicação em 1 frase]
  hasCtaOrQuestion: boolean; // [pergunta de interesse / CTA de oferta leve]
}

export interface EthicalComplianceResult {
  isCompliant: boolean;
  violations: string[];
}

export interface ApproachValidation {
  isValid: boolean;
  bubbleCount: number; // Deve ser exatamente 2
  totalWordCount: number; // Deve ser <= 50
  bubbleWordCounts?: [number, number] | number[];
  hasRequiredBlocks: RequiredApproachBlocks;
  errors: string[];
  bubbles?: [string, string];
  ethicalCompliance?: EthicalComplianceResult;
}

// 6. Estatísticas e Motor de Tiers A/B/C
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

// 7. Tipos de Mensagem e Simulação
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
