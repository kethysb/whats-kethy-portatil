/**
 * Approach Validator - Opaque Reference Oracle for WhatsApp SDR Messages
 * Based strictly on ORIGINAL_REQUEST.md (R1) and PROJECT.md (Interface Contracts)
 */

const PUBLIC_SOURCE_REGEX = /(google|doctoralia|zap|vivareal|olx|oab|cna|reclame\s+aqui|meta\s+ads|biblioteca\s+de\s+an[uú]ncios|instagram|site(\s+(do\s+escrit[óo]rio|da\s+cl[íi]nica|oficial))?|vaga(s)?(\s+de\s+sac)?|portal|portais)/i;

const VERIFIABLE_FACT_REGEX = /(\d+\s*(das\s*[\u00fa\w]+\s*\d+|im[óo]veis|avalia[çc][õo]es|minutos|horas?|an[uú]ncios)|ontem\s+[àa]s\s+\d+h|resposta\s+veio|sem\s+agenda\s+online|fecha\s+[àa]s\s+\d+h|(atendimento\s+)?at[ée]\s+(as\s+)?\d+h|vaga(\s+aberta|\s+recente|\s+de\s+sac)?|(vai|direciona).*whatsapp|link\s+da\s+bio|retorno\s+de\s+rastreio|prazo\s+de\s+rastreio|an[uú]ncios(\s+de\s+botox)?\s+ativos|rodam\s+campanhas)/i;

const IMPLICATION_REGEX = /(espera|esfria|procura\s+outra|divide\s+agenda|lotar|fecha\s+com\s+quem|vai\s+em\s+triagem|travar|consome\s+tempo|perdendo|perdem|sobrecarregad|gasta.*triagem|organiza.*(triagem|receptivo|d[uú]vidas)|liberar.*tempo)/i;

const CTA_OPT_OUT_REGEX = /(faz\s+sentido|posso\s+(te\s+)?mandar|se\s+n[ãa]o\s+for\s+(prioridade|o\s+momento|o\s+foco)|se\s+n[ãa]o\s+fizer(\s+sentido)?|tranquilo|me\s+avisa|s[óo]\s+(me\s+)?dizer|s[óo]\s+falar|n[ãa]o\s+tem\s+compromisso|sem\s+compromisso)/i;

// Forbidden keywords for OAB Provimento 205/2021 (active client solicitation / mercantilization)
const OAB_FORBIDDEN_REGEX = /(ganhe\s+(sua\s+)?causa|process(ar|e)\s+(a\s+)?empresa|indeniza[çc][ãa]o\s+garantida|capta[çc][ãa]o\s+ativa|temos\s+clientes\s+para\s+voc[êe]|contrate\s+nossos\s+advogados)/i;

// Forbidden keywords for CFM Resolução 2.336/2023
const CFM_FORBIDDEN_REGEX = /(antes\s*e\s*depois\s*sensacionalista|garantia\s+de\s+resultado\s+perfeito|cura\s+definitiva\s+garantida)/i;

// Forbidden keywords for CFO Resoluções 196/2019 e 230/2020 (active offering/mercantilization)
const CFO_FORBIDDEN_OFFER_REGEX = /(oferec(er|emos)|temos|ganhe|aproveite|anunci(ar|amos))\s+(avalia[çc][ãa]o\s+gratuita|consulta\s+gr[áa]tis)|(avalia[çc][ãa]o\s+gratuita|consulta\s+gr[áa]tis)\s+(para\s+atrair|se\s+vier)|limpeza\s+gr[áa]tis\s+se\s+vier/i;

// Prohibited robotic clichés
const ROBOT_CLICHE_REGEX = /(prezado|certamente!|como\s+posso\s+ajud[áa]-lo\s+hoje\??|no\s+mundo\s+acelerado\s+de\s+hoje)/i;

function countWords(str) {
  if (!str || typeof str !== 'string') return 0;
  const trimmed = str.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).filter(w => w.length > 0).length;
}

function parseBubbles(input) {
  if (Array.isArray(input)) {
    return input.map(b => (typeof b === 'string' ? b : b.text || '')).filter(b => b.trim().length > 0);
  }
  if (typeof input === 'string') {
    return input.split(/---SPLIT---|\r?\n\s*\r?\n/g).map(b => b.trim()).filter(b => b.length > 0);
  }
  return [];
}

function validateApproach(input, options = {}) {
  const niche = options.niche || 'geral';
  const isConversationTurn = options.isConversationTurn === true;
  const bubbles = parseBubbles(input);
  const bubbleCount = bubbles.length;
  const fullText = bubbles.join(' ');
  const totalWordCount = countWords(fullText);

  const errors = [];

  // Bubble Count rule
  if (isConversationTurn) {
    if (bubbleCount < 1 || bubbleCount > 2) {
      errors.push(`Turno de conversa deve conter no máximo 1 a 2 balões curtos, recebido ${bubbleCount}`);
    }
  } else {
    if (bubbleCount !== 2) {
      errors.push(`Regra de balões violada: esperado exatamente 2 balões, recebido ${bubbleCount}`);
    }
  }

  // Word Count rule
  if (totalWordCount > 50) {
    errors.push(`Limite de palavras violado: máximo de 50 palavras permitido, recebido ${totalWordCount}`);
  }

  if (totalWordCount === 0) {
    errors.push('Mensagem vazia');
  }

  // Anti-robot check
  if (ROBOT_CLICHE_REGEX.test(fullText)) {
    errors.push('Clichê de robô proibido detectado na mensagem');
  }

  // Required 4 blocks (enforced on initial approaches)
  const hasPublicSource = PUBLIC_SOURCE_REGEX.test(fullText);
  const hasVerifiableFact = VERIFIABLE_FACT_REGEX.test(fullText);
  const hasImplication = IMPLICATION_REGEX.test(fullText);
  const hasCtaOrQuestion = CTA_OPT_OUT_REGEX.test(fullText);

  if (!isConversationTurn) {
    if (!hasPublicSource) {
      errors.push('Bloco 1 ausente: [Fonte pública] brasileira não identificada no texto');
    }
    if (!hasVerifiableFact) {
      errors.push('Bloco 2 ausente: [Fato específico e verificável] não identificado no texto');
    }
    if (!hasImplication) {
      errors.push('Bloco 3 ausente: [Implicação em 1 frase] não identificada no texto');
    }
    if (!hasCtaOrQuestion) {
      errors.push('Bloco 4 ausente: [Pergunta de interesse / CTA com saída honrosa] não identificado');
    }
  }

  // Constraint: Ethical guardrails by niche
  if (niche === 'advocacia') {
    if (OAB_FORBIDDEN_REGEX.test(fullText)) {
      errors.push('Violação do Provimento 205/2021 da OAB: detectada captação ativa ou mercantilização vedada');
    }
  }

  if (niche === 'dermatologia') {
    if (CFM_FORBIDDEN_REGEX.test(fullText)) {
      errors.push('Violação do CFM 2.336/2023: promessa de resultado ou fotos sensacionalistas vedadas');
    }
  }

  if (niche === 'odontologia') {
    if (CFO_FORBIDDEN_OFFER_REGEX.test(fullText)) {
      errors.push('Violação do CFO 196/2019: vedada oferta mercantilista de consulta/avaliação gratuita');
    }
  }

  return {
    isValid: errors.length === 0,
    bubbleCount,
    totalWordCount,
    bubbles,
    hasRequiredBlocks: {
      hasPublicSource,
      hasVerifiableFact,
      hasImplication,
      hasCtaOrQuestion
    },
    errors
  };
}

module.exports = {
  countWords,
  parseBubbles,
  validateApproach,
  PUBLIC_SOURCE_REGEX,
  VERIFIABLE_FACT_REGEX,
  IMPLICATION_REGEX,
  CTA_OPT_OUT_REGEX,
  OAB_FORBIDDEN_REGEX,
  CFO_FORBIDDEN_OFFER_REGEX,
  ROBOT_CLICHE_REGEX
};
