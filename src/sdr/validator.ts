/**
 * src/sdr/validator.ts
 * Motor determinístico de validação e sanitização de mensagens do SDR Whats-Kethy-Portatil.
 * Garante conformidade estrita com:
 * - Exatamente 2 balões com delimitador '---SPLIT---'
 * - Limite inegociável de no máximo 50 palavras no total
 * - Presença dos 4 blocos obrigatórios: [Fonte pública] + [fato verificável] + [implicação] + [pergunta/CTA]
 * - Guardrails éticos: OAB Provimento 205/2021 (Advocacia), CFM 2.336/2023, CFO 196/2019 e LGPD.
 */

import {
  ApproachValidation,
  EthicalComplianceResult,
  NicheType,
  RequiredApproachBlocks
} from './types.js';

export const BUBBLE_SEPARATOR = '---SPLIT---';
export const MAX_WORDS_LIMIT = 50;
export const EXACT_BUBBLES_COUNT = 2;

export interface ValidationOptions {
  niche?: NicheType;
  maxWords?: number;
  exactBubbles?: number;
}

export interface SanitizeResult {
  originalText: string;
  sanitizedText: string;
  bubbles: string[];
  totalWordCount: number;
  bubbleCount: number;
  modified: boolean;
  changes: string[];
  isValid: boolean;
}

/**
 * Contagem exata e determinística de palavras.
 * Fórmula oficial: text.replace(/---SPLIT---/g, ' ').trim().split(/\s+/).filter(Boolean).length
 */
export function countWords(text: string): number {
  if (!text) return 0;
  return text
    .replace(/---SPLIT---/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * Divide o texto nos balões através do separador oficial '---SPLIT---'.
 */
export function splitBubbles(text: string): string[] {
  if (!text) return [];
  return text
    .split(BUBBLE_SEPARATOR)
    .map(b => b.trim())
    .filter(b => b.length > 0);
}

/**
 * Validador de fontes públicas brasileiras (Bloco 1).
 */
const PUBLIC_SOURCE_REGEX = new RegExp(
  '\\b(' +
  'google|google perfil|google meu neg[oó]cio|google maps|avalia[cç][oõ]es (no|do) google|' +
  'doctoralia|' +
  'zap|vivareal|viva real|olx|imovelweb|portal imobili[aá]rio|portais|' +
  'instagram|bio|link da bio|perfil profissional|stories|' +
  'meta ads|biblioteca de an[uú]ncios|biblioteca da meta|an[uú]ncios (na|da) meta|an[uú]ncios no facebook|an[uú]ncios no instagram|' +
  'vaga|vagas|vaga de sac|atendente de sac|catho|linkedin|indeed|gupy|' +
  'reclame aqui|' +
  'site da cl[ií]nica|site do escrit[oó]rio|site da empresa|site da transportadora|site dos corretores|no site|' +
  'oab|creci|crm|cro|rqe|cna|' +
  'teste ontem|mandei uma pergunta|mandei uma mensagem|fiz um teste' +
  ')\\b|' +
  '\\b(peguei (seu|o) contato|vi no|vi na|vi que|achei (o|a|no|na)|encontrei|pesquisei|acompanho)\\b',
  'i'
);

/**
 * Validador de fato específico e verificável (Bloco 2).
 */
const VERIFIABLE_FACT_REGEX = new RegExp(
  '(' +
  '\\d+\\s*(das|dos|avalia[cç][oõ]es|im[oó]veis|horas|h|minutos|min|pontos|reclama[cç][oõ]es|vagas|artigos)|' +
  '[aà]s\\s*\\d+h|at[eé]\\s*[aà]s?\\s*\\d+h|fecha\\s*[aà]s|ontem\\s*[aà]s|resposta\\s*(veio|s[oó])|' +
  'demora\\s*(pra|para)\\s*responder|sem agenda online|an[uú]ncios\\s*(ativos|de botox|levando|dos lançamentos)|' +
  'contato\\s*indo\\s*pro|contatos\\s*caem|centraliza\\s*contatos|abriu\\s*vaga|vaga aberta|retorno\\s*de\\s*rastreio|' +
  'posta\\s*im[oó]veis|atendimento receptivo|status de frete|reclamações de rastreio|alinhadores|implantes|' +
  'agenda concorrida|\\b\\d+\\b' +
  ')',
  'i'
);

/**
 * Validador de implicação em 1 frase (Bloco 3).
 */
const IMPLICATION_REGEX = new RegExp(
  '\\b(' +
  'esfria(m|r)?\\s+r[aá]pido|lead\\s+esfria|esfriar|' +
  'recep[cç][aã]o\\s+(costuma\\s+)?divid(e|ir)|recep[cç][aã]o\\s+ocupada|lotar\\s+o\\s+whatsapp|sobrecarreg(a|am|ar|ado)?|pesado\\s+responder|correria|' +
  'fecham?\\s+com\\s+quem\\s+responde|paciente(s)?\\s+fecha(m)?|paciente(s)?\\s+se\\s+perdem|procura\\s+outr(o|a)|perdendo\\s+paciente|perder\\s+vendas|' +
  'faltas?\\s+na\\s+cadeira|no-show|perdem?\\s+(tempo|metade|horas|dia)|' +
  'filtrar\\s+curiosos|como\\s+est[aá]\\s+meu\\s+processo|cad[eê]\\s+minha\\s+entrega|onde\\s+est[aá]\\s+minha\\s+entrega|' +
  'gargalo|gasto\\s+de\\s+tempo|tempo\\s+gasto|tiram?\\s+o\\s+foco|divid(e|ir)\\s+agenda|muito\\s+paciente' +
  ')\\b',
  'i'
);

/**
 * Validador de pergunta de interesse / CTA de reciprocidade (Bloco 4).
 */
const CTA_INTEREST_REGEX = new RegExp(
  '\\b(' +
  'faz sentido|posso te mandar|posso mandar|posso enviar|posso mostrar|te mando em 2 linhas|te mostrar como|mandar o print|mandar o resumo|' +
  '2 ideias|2 linhas|1 minuto|se n[aã]o for prioridade|se n[aã]o for o momento|se n[aã]o for o caso|' +
  'se n[aã]o fizer sentido|[eé] s[oó] me dizer|[eé] s[oó] avisar|[eé] s[oó] falar|só avisar|só me avisar|só falar|' +
  'me avisa|sem problema|sem problemas|tranquilo|sem compromisso' +
  ')\\b',
  'i'
);

/**
 * Verifica violações éticas específicas por nicho.
 */
export function checkEthicalGuardrails(text: string, niche?: NicheType): EthicalComplianceResult {
  const violations: string[] = [];

  if (niche === 'advocacia') {
    // Provimento 205/2021 OAB - Vedada captação ativa e mercantilização
    const prohibitedOAB = /\b(capta[cç][aã]o ativa|captar clientes|prospectar clientes|atrair mais clientes|captar novos clientes|ganhar causas?|ganhar processos?|indeniza[cç][aã]o garantida|promessa de causa|venda de servi[cç]os jur[ií]dicos|aumentar seus clientes)\b/i;
    if (prohibitedOAB.test(text)) {
      violations.push('Violação OAB Provimento 205/2021: Proibida captação ativa ou promessa de causa. O foco deve ser estritamente triagem e atendimento receptivo.');
    }
  }

  if (niche === 'dermatologia') {
    // Resolução CFM 2.336/2023 - Vedado sensacionalismo e promessa de resultado
    const prohibitedCFM = /\b(antes e depois|garantia de resultado|pele perfeita garantida|cura definitiva|avalia[cç][aã]o gratuita|consulta gr[aá]tis)\b/i;
    if (prohibitedCFM.test(text)) {
      violations.push('Violação CFM 2.336/2023: Proibido antes/depois, promessa de resultado estético ou mercantilização (avaliação/consulta grátis).');
    }
  }

  if (niche === 'odontologia') {
    // Resoluções CFO 196/2019 e 230/2020 - Vedada consulta gratuita mercantilista
    const prohibitedCFO = /\b(avalia[cç][aã]o gratuita|consulta gr[aá]tis|avaliação sem custo|procedimento sem custo)\b/i;
    if (prohibitedCFO.test(text)) {
      violations.push('Violação CFO: Proibida oferta mercantilista de consulta/avaliação gratuita.');
    }
  }

  // Guardrail Anti-Placeholder: bloqueia colchetes não preenchidos ex: [Nome], [Clínica]
  if (/\[[^\]]+\]|\{[^}]+\}/.test(text)) {
    violations.push('Violação Anti-Placeholder: Mensagem contém campo entre colchetes/chaves não substituído.');
  }

  return {
    isCompliant: violations.length === 0,
    violations
  };
}

/**
 * Detecta os 4 blocos obrigatórios de abordagem ética.
 */
export function detectRequiredBlocks(text: string): RequiredApproachBlocks {
  const hasPublicSource = PUBLIC_SOURCE_REGEX.test(text);
  const hasVerifiableFact = VERIFIABLE_FACT_REGEX.test(text);
  const hasImplication = IMPLICATION_REGEX.test(text);
  const hasQuestionMark = text.includes('?');
  const hasCtaOrQuestion = hasQuestionMark && CTA_INTEREST_REGEX.test(text);

  return {
    hasPublicSource,
    hasVerifiableFact,
    hasImplication,
    hasCtaOrQuestion
  };
}

/**
 * Validador principal determinístico.
 */
export function validateApproach(text: string, options: ValidationOptions = {}): ApproachValidation {
  const maxWords = options.maxWords ?? MAX_WORDS_LIMIT;
  const exactBubbles = options.exactBubbles ?? EXACT_BUBBLES_COUNT;
  const errors: string[] = [];

  const bubbles = splitBubbles(text);
  const bubbleCount = bubbles.length;
  const totalWordCount = countWords(text);
  const bubbleWordCounts = bubbles.map(b => countWords(b));

  if (bubbleCount !== exactBubbles) {
    errors.push(`Mensagem deve conter exatamente ${exactBubbles} balões separados por '${BUBBLE_SEPARATOR}'. Encontrado: ${bubbleCount}.`);
  }

  if (totalWordCount > maxWords) {
    errors.push(`Mensagem excede o limite estrito de ${maxWords} palavras (atual: ${totalWordCount}).`);
  }

  if (totalWordCount === 0) {
    errors.push('Mensagem vazia ou sem palavras válidas.');
  }

  const hasRequiredBlocks = detectRequiredBlocks(text);

  if (!hasRequiredBlocks.hasPublicSource) {
    errors.push('Bloco ausente: Indicador de Fonte Pública não identificado na abordagem.');
  }
  if (!hasRequiredBlocks.hasVerifiableFact) {
    errors.push('Bloco ausente: Fato específico e verificável não identificado.');
  }
  if (!hasRequiredBlocks.hasImplication) {
    errors.push('Bloco ausente: Implicação em 1 frase (dor/impacto operacional) não identificada.');
  }
  if (!hasRequiredBlocks.hasCtaOrQuestion) {
    errors.push('Bloco ausente: Pergunta de interesse ou CTA com saída honrosa não identificada.');
  }

  const ethicalCompliance = checkEthicalGuardrails(text, options.niche);
  if (!ethicalCompliance.isCompliant) {
    errors.push(...ethicalCompliance.violations);
  }

  const result: ApproachValidation = {
    isValid: errors.length === 0,
    bubbleCount,
    totalWordCount,
    bubbleWordCounts,
    hasRequiredBlocks,
    ethicalCompliance,
    errors
  };

  if (bubbleCount === 2) {
    result.bubbles = [bubbles[0], bubbles[1]];
  }

  return result;
}

/**
 * Sanitizador e formatador pré-envio.
 * Limpa artefatos de IA, normaliza balões e ajusta pontuação para assegurar conformidade.
 */
export function sanitizeApproach(rawText: string, options: ValidationOptions = {}): SanitizeResult {
  const changes: string[] = [];
  let modified = false;
  let text = rawText || '';

  // 1. Remover blocos de código Markdown
  if (/```[\s\S]*?```/g.test(text)) {
    text = text.replace(/```(?:json|markdown|text)?([\s\S]*?)```/g, '$1');
    changes.push('Removidos blocos de markdown ```');
    modified = true;
  }

  // 2. Remover aspas envolventes externas
  const trimmed = text.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    text = trimmed.substring(1, trimmed.length - 1).trim();
    changes.push('Removidas aspas externas envolventes');
    modified = true;
  }

  // 3. Remover etiquetas geradas por LLM (ex: "[Balão 1]:", "Balão 1:", "Mensagem 1:")
  const artifactRegex = /\[?(?:Bal[aã]o|Mensagem|Parte)\s*\d+\]?:?\s*/gi;
  if (artifactRegex.test(text)) {
    text = text.replace(artifactRegex, '');
    changes.push('Removidas etiquetas de balão inseridas por IA (ex: [Balão 1])');
    modified = true;
  }

  // 4. Normalizar variações do delimitador
  const altSplitRegex = /\s*(?:\[SPLIT\]|---+\s*SPLIT\s*---+|===+\s*SPLIT\s*===+|---)\s*/g;
  if (!text.includes(BUBBLE_SEPARATOR) && altSplitRegex.test(text)) {
    text = text.replace(altSplitRegex, BUBBLE_SEPARATOR);
    changes.push('Normalizado delimitador alternativo para ---SPLIT---');
    modified = true;
  }

  // 5. Se não tiver BUBBLE_SEPARATOR, tentar dividir por parágrafos duplos (\n\n)
  if (!text.includes(BUBBLE_SEPARATOR) && text.includes('\n\n')) {
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    if (paragraphs.length === 2) {
      text = paragraphs.join(BUBBLE_SEPARATOR);
      changes.push('Convertidos 2 parágrafos separados por quebra dupla em ---SPLIT---');
      modified = true;
    }
  }

  // 6. Normalizar espaços múltiplos e pontuação
  const cleanedText = text
    .replace(/[ \t]+/g, ' ')
    .replace(/\s+([,\.!\?])/g, '$1')
    .trim();

  if (cleanedText !== text) {
    text = cleanedText;
    changes.push('Espaços múltiplos e espaçamento antes de pontuação normalizados');
    modified = true;
  }

  // 7. Resolver excesso de balões (se > 2)
  let currentBubbles = splitBubbles(text);
  if (currentBubbles.length > 2) {
    const first = currentBubbles.slice(0, currentBubbles.length - 1).join(' ');
    const second = currentBubbles[currentBubbles.length - 1];
    text = `${first}${BUBBLE_SEPARATOR}${second}`;
    currentBubbles = [first, second];
    changes.push(`Fundidos ${currentBubbles.length} balões para restabelecer exatamente 2 balões`);
    modified = true;
  }

  // 8. Otimização idiomática de contagem se ultrapassar 50 palavras
  const maxWords = options.maxWords ?? MAX_WORDS_LIMIT;
  let currentWordCount = countWords(text);
  if (currentWordCount > maxWords) {
    const contractions: [RegExp, string][] = [
      [/\baqui de S[aã]o Paulo\b/gi, 'de SP'],
      [/\bda cidade de S[aã]o Paulo\b/gi, 'de SP'],
      [/\bcom o objetivo de\b/gi, 'para'],
      [/\bde forma a\b/gi, 'para'],
      [/\bpor gentileza\b/gi, 'por favor'],
      [/\bse n[aã]o for prioridade, me avisa que eu n[aã]o insisto\b/gi, 'se não for prioridade, só avisar'],
      [/\bse n[aã]o for prioridade, [eé] s[oó] me dizer\b/gi, 'se não for prioridade, só avisar'],
      [/\bse n[aã]o for prioridade, s[oó] me avisar\b/gi, 'se não for prioridade, só avisar']
    ];

    for (const [pattern, replacement] of contractions) {
      if (pattern.test(text)) {
        text = text.replace(pattern, replacement);
        changes.push(`Aplicada contração idiomática: ${replacement}`);
        modified = true;
      }
    }
  }

  const finalBubbles = splitBubbles(text);
  const finalWordCount = countWords(text);
  const validation = validateApproach(text, options);

  return {
    originalText: rawText,
    sanitizedText: text,
    bubbles: finalBubbles,
    totalWordCount: finalWordCount,
    bubbleCount: finalBubbles.length,
    modified,
    changes,
    isValid: validation.isValid
  };
}

/**
 * Utilitário de formatação para simulação e envio.
 */
export function formatForWhatsApp(bubbles: string[]): string {
  return bubbles.map(b => b.trim()).filter(Boolean).join(BUBBLE_SEPARATOR);
}
