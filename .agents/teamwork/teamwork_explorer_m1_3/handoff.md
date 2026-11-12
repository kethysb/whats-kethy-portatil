# Handoff Report: Design Detalhado do Validador e Sanitizador SDR (`src/sdr/validator.ts`)

**Autor**: teamwork_explorer_m1_3  
**Data**: 2026-11-02T23:10:00Z  
**Escopo**: Marco M1 — Core SDR Engine, 5 Nichos & Keydex API  
**Arquivo Alvo**: `src/sdr/validator.ts`  

---

## 1. Observation

Durante a investigação do repositório `Whats-Kethy-Portatil`, foram observados diretamente os seguintes fatos, arquivos e trechos de código:

1. **Requisitos de Aceitação em `ORIGINAL_REQUEST.md` (Linhas 21 e 44-47)**:
   - Linha 21: *"As abordagens geradas devem seguir rigorosamente a estrutura ética de não parecer robô ou stalker: [Fonte] + [fato específico e verificável] + [implicação em 1 frase] + [pergunta de interesse / CTA de oferta], limitadas a 50 palavras divididas em 2 balões, em conformidade com LGPD, CFM, CFO e Provimento 205/2021 da OAB."*
   - Linha 45: *"- [ ] Todas as mensagens de abordagem possuem no máximo 50 palavras distribuídas em exatamente 2 balões."*
   - Linha 46: *"- [ ] As abordagens contêm os 4 blocos obrigatórios: [Fonte pública] + [fato verificável] + [implicação] + [pergunta/CTA]."*
   - Linha 47: *"- [ ] Os fluxos para Advocacia respeitam o Provimento 205/2021 da OAB, restringindo-se à triagem e atendimento receptivo."*

2. **Contrato de Interface em `PROJECT.md` (Linhas 89-100)**:
   - A interface contratual formal estipula:
   ```typescript
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

3. **Código Atual de Mensagens em `simulator/server.cjs` (Linhas 37-50, 60-73, 83-96, 106-119, 129-142, 175-188)**:
   - Em `simulator/server.cjs`, as abordagens dos leads possuem mensagens divididas em 2 balões (`m1` e `m2`), porém a contagem de palavras excede 50 palavras em praticamente todas as mensagens existentes:
     * **Dra. Paula (Dermatologia)**: m1 tem 32 palavras, m2 tem 24 palavras. Total = **56 palavras** (> 50).
     * **Dr. Rafael (Odontologia)**: m1 tem 30 palavras, m2 tem 26 palavras. Total = **56 palavras** (> 50).
     * **Camila (Estética / Meta Ads)**: m1 tem 27 palavras, m2 tem 26 palavras. Total = **53 palavras** (> 50).
     * **Marcos (Imobiliária / ZAP)**: m1 tem 22 palavras, m2 tem 32 palavras. Total = **54 palavras** (> 50).
     * **Dr. André (Advocacia / OAB)**: m1 tem 26 palavras, m2 tem 28 palavras. Total = **54 palavras** (> 50).
     * **Ricardo (Logística / SAC)**: m1 tem 27 palavras, m2 tem 24 palavras. Total = **51 palavras** (> 50).
   - Verbatim do tratamento no simulador (`simulator/server.cjs`, Linhas 345-348):
     ```javascript
     const chunks = rawContent
       .split(/---SPLIT---|\\n\\n/g)
       .map(c => c.trim())
       .filter(c => c.length > 0);
     ```

4. **Configuração TypeScript em `tsconfig.json`**:
   - `target`: `ES2022`, `module`: `NodeNext`, `moduleResolution`: `NodeNext`, `strict`: `true`.
   - Requer extensões explícitas `.js` nos imports relativos de TypeScript (ex: `import { ... } from './types.js'`).

5. **Instrução Específica do Dispatch**:
   - Algoritmo determinístico de contagem de palavras:
     `text.replace(/---SPLIT---/g, ' ').trim().split(/\s+/).filter(Boolean).length`
   - Rejeição estrita se `bubbleCount != 2` ou `totalWordCount > 50`.
   - Detecção determinística dos 4 blocos e função sanitizadora/formatadora pré-envio.

---

## 2. Logic Chain

A partir das observações acima, a cadeia de raciocínio lógico estruturada é:

1. **Premissa de Inflexibilidade Regulatória e de Experiência**:
   - Conforme R1 e PROJECT.md, mensagens enviadas no WhatsApp com mais de 50 palavras ou em balão único são lidas pelo lead como "textão de robô", gerando alta taxa de bloqueio e desconfiança.
   - O delimitador oficial `---SPLIT---` é o padrão adotado no projeto para simular a digitação natural humana em 2 balões com intervalo de leitura.

2. **Dedução sobre o Bug Latente nas Mensagens do Simulador**:
   - Observação 3 revelou que as abordagens estáticas pré-existentes em `simulator/server.cjs` têm entre 51 e 56 palavras.
   - Se o validador estrito for aplicado sobre essas mensagens cruas sem sanitização ou sem ajuste prévio, **100% das mensagens de teste falharão na validação de palavras**.
   - Conclusão da etapa: O módulo `src/sdr/validator.ts` deve fornecer tanto a validação pura (`validateApproach`) quanto uma função sanitizadora/formatadora altamente eficaz (`sanitizeApproach`), e as mensagens padrão dos 5 nichos devem ser fornecidas calibradas entre 38 e 44 palavras.

3. **Dedução do Algoritmo de Balões**:
   - Divisão via `text.split('---SPLIT---')` com limpeza `map(b => b.trim()).filter(b => b.length > 0)`.
   - Se o tamanho do array resultante for diferente de 2, a mensagem deve ser marcada como inválida (`isValid: false`), reportando erro claro e determinístico indicando quantos balões foram encontrados.

4. **Dedução do Algoritmo de Palavras**:
   - Utilizando a fórmula oficial `text.replace(/---SPLIT---/g, ' ').trim().split(/\s+/).filter(Boolean).length`, garante-se que o separador não conte como palavra e que duas palavras em torno do delimitador não fiquem coladas.
   - Além da contagem consolidada, o validador deve calcular e expor `bubbleWordCounts: [number, number]`, permitindo auditoria detalhada de cada balão.

5. **Dedução da Detecção dos 4 Blocos Obrigatórios**:
   - **Bloco 1 (Fonte Pública)**: O SDR deve ancorar a mensagem com a fonte pública legítima (Google, Doctoralia, ZAP/VivaReal, Instagram, Meta Ads, Vagas, Reclame Aqui, Site, CNA/OAB). Detectável por termos de fontes brasileiras catalogadas e verbos de ancoragem (`peguei seu contato no`, `vi no`, `achei`, `encontrei`).
   - **Bloco 2 (Fato Específico e Verificável)**: Não pode ser um elogio vazio; deve conter métricas, dados temporais ou eventos operacionais concretos (`3 das últimas 10 avaliações`, `ontem às 19h`, `anúncios de botox ativos`, `120 imóveis no ZAP`, `fecha às 18h`).
   - **Bloco 3 (Implicação em 1 Frase)**: Conexão direta com a dor operacional (`esfria rápido`, `recepção divide agenda`, `paciente fecha com quem responde primeiro`, `cadê minha entrega lota o WhatsApp`, `boa parte do dia vai em triagem`).
   - **Bloco 4 (Pergunta de Interesse / CTA de Reciprocidade)**: Convite de baixa fricção com ponto de interrogação `?` e gatilhos de saída honrosa (`faz sentido`, `posso te mandar`, `em 2 linhas`, `se não for prioridade`, `sem compromisso`).

6. **Dedução dos Guardrails Éticos**:
   - Advocacia: Restrição estrita do Provimento 205/2021 da OAB — vedada captação ativa. O validador deve auditar se não há menções a "captação", "ganhar causas", "processar", garantindo que o teor seja 100% receptivo/triagem.
   - Saúde/Medicina: Resolução CFM 2.336/2023 — proibido antes/depois ou promessa de cura.
   - Odontologia: Resoluções CFO 196/2019 e 230/2020 — proibida consulta grátis como isca.

7. **Dedução da Função Formatadora / Sanificadora (`sanitizeApproach`)**:
   - Detecta e remove artefatos gerados por LLM: markdown code blocks, prefixos `[Balão 1]`, `1.`, `Balão 2:`, etc.
   - Se o texto não possui `---SPLIT---` mas possui 2 parágrafos nítidos (`\n\n`), converte para `---SPLIT---`.
   - Se possuir múltiplos separadores (ex: saudação isolada), funde os balões para garantir exatamente 2.
   - Se ultrapassar 50 palavras por margem pequena, executa contrações idiomáticas seguras (ex: `aqui de São Paulo` -> `de SP`, `com o objetivo de` -> `para`).

---

## 3. Caveats

1. **Tolerância Heurística vs Determinismo Estrito**:
   - A contagem de balões e palavras é 100% matemática e determinística.
   - A detecção dos 4 blocos (`hasRequiredBlocks`) utiliza regexes consolidadas com base no vocabulário oficial das personas e fontes públicas brasileiras. Textos em outros idiomas ou gírias completamente fora do padrão SDR B2B podem necessitar de expansão do dicionário de padrões no futuro.
2. **Ambiente NodeNext**:
   - O projeto Whats-Kethy-Portatil utiliza TypeScript com ESM (`"module": "NodeNext"`). Qualquer importação de tipos ou módulos em `validator.ts` deve incluir a extensão `.js` (ex: `import type { NicheType } from './types.js'`).
3. **Escopo do Validador**:
   - O validador não faz chamadas de rede nem consulta APIs externas. É um módulo puro, síncrono, de altíssima performance, ideal para execução em pipeline de geração de mensagens e testes unitários.

---

## 4. Conclusion

O design de `src/sdr/validator.ts` está completamente estruturado e pronto para codificação no Marco M1.

Abaixo segue a especificação técnica completa, acompanhada do código de referência detalhado e da suíte de testes recomendada.

### A. Assinatura e Código Completo Proposto para `src/sdr/validator.ts`

```typescript
/**
 * src/sdr/validator.ts
 * Motor determinístico de validação e sanitização de mensagens do SDR Whats-Kethy-Portatil.
 * Garante conformidade estrita com:
 * - Exatamente 2 balões com delimitador '---SPLIT---'
 * - Limite inegociável de no máximo 50 palavras no total
 * - Presença dos 4 blocos obrigatórios: [Fonte pública] + [fato verificável] + [implicação] + [pergunta/CTA]
 * - Guardrails éticos: OAB Provimento 205/2021 (Advocacia), CFM 2.336/2023, CFO 196/2019 e LGPD.
 */

export type NicheType = 'dermatologia' | 'odontologia' | 'imobiliaria' | 'advocacia' | 'logistica';

export const BUBBLE_SEPARATOR = '---SPLIT---';
export const MAX_WORDS_LIMIT = 50;
export const EXACT_BUBBLES_COUNT = 2;

export interface RequiredBlocksResult {
  hasPublicSource: boolean;
  hasVerifiableFact: boolean;
  hasImplication: boolean;
  hasCtaOrQuestion: boolean;
}

export interface EthicalComplianceResult {
  isCompliant: boolean;
  violations: string[];
}

export interface ApproachValidation {
  isValid: boolean;
  bubbleCount: number; // deve ser exatamente 2
  totalWordCount: number; // deve ser <= 50
  bubbleWordCounts: [number, number] | number[];
  hasRequiredBlocks: RequiredBlocksResult;
  ethicalCompliance: EthicalComplianceResult;
  errors: string[];
}

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
  return text.replace(/---SPLIT---/g, ' ').trim().split(/\s+/).filter(Boolean).length;
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
  'google|google perfil|google meu neg[oó]cio|avalia[cç][oõ]es (no|do) google|' +
  'doctoralia|' +
  'zap|vivareal|viva real|olx|imovelweb|portal imobili[aá]rio|portais|' +
  'instagram|bio|link da bio|perfil profissional|stories|' +
  'meta ads|biblioteca de an[uú]ncios|an[uú]ncios (na|da) meta|an[uú]ncios no facebook|an[uú]ncios no instagram|' +
  'vaga|vagas|vaga de sac|atendente de sac|catho|linkedin|indeed|gupy|' +
  'reclame aqui|' +
  'site da cl[ií]nica|site do escrit[oó]rio|site da empresa|no site|' +
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
  '\\d+\\s*(das|dos|avalia[cç][oõ]es|im[oó]veis|horas|h|minutos|min|pontos|reclama[cç][oõ]es|vagas)|' +
  '[aà]s\\s*\\d+h|at[eé]\\s*[aà]s?\\s*\\d+h|fecha\\s*[aà]s|ontem\\s*[aà]s|resposta\\s*(veio|s[oó])|' +
  'demora\\s*(pra|para)\\s*responder|sem agenda online|an[uú]ncios\\s*(ativos|de botox|levando)|' +
  'contato\\s*indo\\s*pro|centraliza\\s*contatos|abriu\\s*vaga|retorno\\s*de\\s*rastreio|' +
  'posta\\s*im[oó]veis|\\b\\d+\\b' +
  ')',
  'i'
);

/**
 * Validador de implicação em 1 frase (Bloco 3).
 */
const IMPLICATION_REGEX = new RegExp(
  '\\b(' +
  'esfria r[aá]pido|lead esfria|esfriar|' +
  'recep[cç][aã]o divide|lotar o whatsapp|sobrecarreg|pesado responder|correria|' +
  'paciente fecha|procura outro|perdendo paciente|perder vendas|' +
  'filtrar curiosos|como est[aá] meu processo|cad[eê] minha entrega|' +
  'gargalo|gasto de tempo|tempo gasto|divide agenda|muito paciente' +
  ')\\b',
  'i'
);

/**
 * Validador de pergunta de interesse / CTA de reciprocidade (Bloco 4).
 */
const CTA_INTEREST_REGEX = new RegExp(
  '\\b(' +
  'faz sentido|posso te mandar|posso enviar|te mando em 2 linhas|mandar o print|mandar o resumo|' +
  '2 ideias|1 minuto de leitura|se n[aã]o for prioridade|se n[aã]o for o momento|' +
  'se n[aã]o fizer sentido|se n[aã]o for o caso|[eé] s[oó] me dizer|[eé] s[oó] falar|' +
  'me avisa|sem problema|tranquilo|sem compromisso' +
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
    const prohibitedOAB = /\b(capta[cç][aã]o ativa|captar clientes|ganhar causas?|ganhar processos?|indeniza[cç][aã]o garantida|promessa de causa|venda de servi[cç]os jur[ií]dicos|aumentar seus clientes)\b/i;
    if (prohibitedOAB.test(text)) {
      violations.push('Violação OAB Provimento 205/2021: Proibida captação ativa ou promessa de causa. O foco deve ser estritamente triagem e atendimento receptivo.');
    }
  }

  if (niche === 'dermatologia') {
    // Resolução CFM 2.336/2023 - Vedado sensacionalismo e promessa de resultado
    const prohibitedCFM = /\b(antes e depois|garantia de resultado|pele perfeita garantida|cura definitiva)\b/i;
    if (prohibitedCFM.test(text)) {
      violations.push('Violação CFM 2.336/2023: Proibido antes/depois ou promessa de resultado estético.');
    }
  }

  if (niche === 'odontologia') {
    // Resoluções CFO 196/2019 e 230/2020 - Vedada consulta gratuita mercantilista
    const prohibitedCFO = /\b(avalia[cç][aã]o gratuita|consulta gr[aá]tis|procedimento sem custo)\b/i;
    if (prohibitedCFO.test(text)) {
      violations.push('Violação CFO: Proibida oferta mercantilista de consulta/avaliação gratuita.');
    }
  }

  return {
    isCompliant: violations.length === 0,
    violations
  };
}

/**
 * Detecta os 4 blocos obrigatórios de abordagem ética.
 */
export function detectRequiredBlocks(text: string): RequiredBlocksResult {
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

  return {
    isValid: errors.length === 0,
    bubbleCount,
    totalWordCount,
    bubbleWordCounts,
    hasRequiredBlocks,
    ethicalCompliance,
    errors
  };
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
    // Funde balões extras iniciais caso o primeiro seja apenas saudação
    const first = currentBubbles.slice(0, currentBubbles.length - 1).join(' ');
    const second = currentBubbles[currentBubbles.length - 1];
    text = `${first}${BUBBLE_SEPARATOR}${second}`;
    currentBubbles = [first, second];
    changes.push(`Fundidos ${currentBubbles.length} balões para restabelecer exatamente 2 balões`);
    modified = true;
  }

  // 8. Otimização idiomática de contagem se ultrapassar 50 palavras
  let currentWordCount = countWords(text);
  if (currentWordCount > (options.maxWords ?? MAX_WORDS_LIMIT)) {
    const contractions: [RegExp, string][] = [
      [/\baqui de S[aã]o Paulo\b/gi, 'de SP'],
      [/\bda cidade de S[aã]o Paulo\b/gi, 'de SP'],
      [/\bcom o objetivo de\b/gi, 'para'],
      [/\bde forma a\b/gi, 'para'],
      [/\bpor gentileza\b/gi, 'por favor'],
      [/\bse n[aã]o for prioridade, me avisa que eu n[aã]o insisto\b/gi, 'se não for prioridade, me avisa'],
      [/\bse n[aã]o for prioridade, [eé] s[oó] me dizer\b/gi, 'se não for prioridade, é só avisar']
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
```

---

## 5. Verification Method

Para verificar de forma independente e reproduzível a exatidão deste design, executar os seguintes passos e comandos:

### 1. Teste de Contagem e Balões via Node.js
Executar no terminal PowerShell da raiz do projeto:
```powershell
npx tsx -e "
import { validateApproach, sanitizeApproach } from './src/sdr/validator.js';

const validSample = 'Oi, Dra. Paula! Kethely da KethyTech. Vi no Google que 3 das últimas 10 avaliações citam demora no WhatsApp.---SPLIT---Imagino a recepção na correria. Faz sentido te mandar em 2 linhas como resolvemos isso? Se não, tranquilo.';

const res = validateApproach(validSample, { niche: 'dermatologia' });
console.log('Valid:', res.isValid, 'Words:', res.totalWordCount, 'Bubbles:', res.bubbleCount);
console.assert(res.isValid === true, 'Deveria ser válido');
console.assert(res.bubbleCount === 2, 'Deveria ter 2 balões');
console.assert(res.totalWordCount <= 50, 'Deveria ter <= 50 palavras');
console.log('✅ Verificação concluída com sucesso!');
"
```

### 2. Matriz de Testes Unitários de Casos de Borda (Boundary & Corner Cases)
Verificar os seguintes 6 cenários essenciais:
1. **Rejeição por 1 balão**: Texto sem `---SPLIT---` -> `isValid: false`, `errors` contém *"deve conter exatamente 2 balões"*.
2. **Rejeição por 3 balões**: Texto com dois `---SPLIT---` -> `isValid: false`, `bubbleCount: 3`.
3. **Rejeição por > 50 palavras**: Texto com 51 palavras -> `isValid: false`, `errors` contém *"excede o limite estrito de 50 palavras"*.
4. **Validação dos 4 blocos**:
   - Sem fonte pública -> `hasPublicSource: false`.
   - Sem métrica/fato -> `hasVerifiableFact: false`.
   - Sem implicação de negócio -> `hasImplication: false`.
   - Sem CTA/pergunta `?` -> `hasCtaOrQuestion: false`.
5. **Guardrail Ético OAB**: Abordagem no nicho `advocacia` contendo *"captar clientes"* ou *"ganhar causas"* -> `ethicalCompliance.isCompliant: false`.
6. **Sanitização Automática**: Texto com quebras `\n\n` e tags `[Balão 1]:` -> `sanitizeApproach` limpa as tags, converte para `---SPLIT---` e retorna `modified: true` e `isValid: true`.

### 3. Condições de Invalidação
Este relatório e design serão considerados invalidados se:
- O separador acordado `---SPLIT---` for alterado sem notificação para outra convenção.
- O limite estrito de palavras for alterado de 50 para outro patamar em `ORIGINAL_REQUEST.md`.
- Uma mensagem de abordagem com mais de 50 palavras ou diferente de 2 balões for aceita como válida.
