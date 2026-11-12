# Relatório de Handoff — Desafio Empírico e Adversário do Marco M1

**Agente**: `teamwork_challenger_m1_1` (critic, specialist)  
**Marco**: M1 — Core SDR Engine, 5 Nichos & Keydex API  
**Veredicto Oficial**: **REJECT** (Rejeição técnica por vulnerabilidades críticas reproduzíveis no sanitizador e guardrails éticos)  
**Data**: 2026-11-02T23:23:00Z  

---

## 1. Observation (Observações Empíricas Diretas)

Durante a execução da suíte de testes adversários implementada em `tests/stress/adversarial_validator.test.ts`, foram executados 39 cenários de estresse via `npx tsx tests/stress/adversarial_validator.test.ts`. Foram observadas 10 anomalias e 4 falhas ativas de validação, documentadas com as seguintes evidências diretas:

### Observação 1.1: Limites Exatos de Palavras (Fronteiras 49, 50, 51)
- **Comportamento Observado**:
  - Mensagem sintética com 49 palavras: `validateApproach` retorna `isValid: true, totalWordCount: 49`.
  - Mensagem sintética com 50 palavras: `validateApproach` retorna `isValid: true, totalWordCount: 50`.
  - Mensagem sintética com 51 palavras: `validateApproach` retorna `isValid: false`, com erro verbatim: `"Mensagem excede o limite estrito de 50 palavras (atual: 51)."`.
  - Mensagem vazia (`""`): `validateApproach` retorna erro verbatim: `"Mensagem vazia ou sem palavras válidas."`.
  - String com apenas `---SPLIT---`: `splitBubbles` filtra os elementos vazios retornando 0 balões válidos e 0 palavras.
- **Arquivo/Linhas**: `src/sdr/validator.ts:43-50` (`countWords`) e `src/sdr/validator.ts:197-203`.

### Observação 1.2: Sanitizador Injeta Artefato Literal `"split"` no Balão 1 ao Receber `"--- split ---"`
- **Comando**: `npx tsx tests/stress/adversarial_validator.test.ts`
- **Código Fonte**: `src/sdr/validator.ts:275`:
  ```typescript
  const altSplitRegex = /\s*(?:\[SPLIT\]|---+\s*SPLIT\s*---+|===+\s*SPLIT\s*===+|---)\s*/g;
  ```
- **Fato Observado**: Quando o texto contém delimitador corrompido em minúsculo ou com espaços como `"--- split ---"`:
  ```typescript
  'Vi no Google que 3 avaliações citam demora. --- split --- A recepção divide agenda. Faz sentido te mandar em 2 linhas? Se não, só avisar.'
  ```
  O `altSplitRegex` não possui flag case-insensitive (`/i`). Por ter a alternativa `|---` no final, ele substitui o primeiro `---` por `---SPLIT---` e o segundo `---` por `---SPLIT---`. O sanitizador passa a ter 3 balões (`["Vi no Google que 3 avaliações citam demora.", "split", "A recepção divide agenda..."]`). Na etapa de fusão (linha 306), ele junta os dois primeiros:
  - Balão 1 resultante: `"Vi no Google que 3 avaliações citam demora. split"`
  - Balão 2 resultante: `"A recepção divide agenda. Faz sentido te mandar em 2 linhas? Se não, só avisar."`
  O artefato textual `"split"` é injetado fisicamente no texto da mensagem entregue ao lead.

### Observação 1.3: Sanitizador Não Converte Delimitador de Dois Hífens `"--SPLIT--"`
- **Código Fonte**: `src/sdr/validator.ts:275`
- **Fato Observado**: O `altSplitRegex` exige no mínimo 3 hífens (`---+`). Ao receber `"--SPLIT--"` (2 hífens):
  - `altSplitRegex.test(text)` retorna `false`.
  - `text.includes(BUBBLE_SEPARATOR)` permanece `false`.
  - A mensagem não é dividida, mantendo 1 único balão.
  - Resultado: `validateApproach` reprova a mensagem com erro: `"Mensagem deve conter exatamente 2 balões separados por '---SPLIT---'. Encontrado: 1."`.

### Observação 1.4: Sanitizador Cliva Frases ao Meio se Houver Travessão Textual `"---"`
- **Código Fonte**: `src/sdr/validator.ts:275`
- **Fato Observado**: A cláusula `|---` em `altSplitRegex` faz com que qualquer travessão de 3 hífens ou divisor markdown (`---`) utilizado pelo redator/IA em um texto sem delimitador oficial seja sumariamente convertido em `---SPLIT---`, dividindo frases no meio.

### Observação 1.5: Fragilidade de Espaços Múltiplos no Validador (`validateApproach`)
- **Código Fonte**: `src/sdr/validator.ts:116-124` (`CTA_INTEREST_REGEX`):
  ```typescript
  const CTA_INTEREST_REGEX = new RegExp(
    '\\b(' +
    'faz sentido|posso te mandar|posso mandar|posso enviar|posso mostrar|te mando em 2 linhas|te mostrar como|mandar o print|mandar o resumo|' +
    '2 ideias|2 linhas|1 minuto|se n[aã]o for prioridade|se n[aã]o for o momento|se n[aã]o for o caso|' +
    'se n[aã]o fizer sentido|[eé] s[oó] me dizer|[eé] s[oó] avisar|[eé] s[oó] falar|só avisar|só me avisar|só falar|' +
    'me avisa|sem problema|sem problemas|tranquilo|sem compromisso' +
    ')\\b',
    'i'
  );
  ```
- **Fato Observado**: O validador determinístico `validateApproach(text)` chama `detectRequiredBlocks(text)` diretamente no texto bruto antes de qualquer normalização de espaços (linhas 183-205). Como `CTA_INTEREST_REGEX` utiliza espaços literais simples (ex: `'faz sentido'`, `'só avisar'`), qualquer texto gerado com múltiplos espaços ou tabulações entre palavras-chave (ex: `"Faz   sentido?"` ou `"só   avisar."`) FALHA na detecção do Bloco 4, emitindo o erro:
  `"Bloco ausente: Pergunta de interesse ou CTA com saída honrosa não identificada."`

### Observação 1.6: Falso Positivo no Bloco 2 (Fato Verificável) por Fallback de Dígito (`\b\d+\b`)
- **Código Fonte**: `src/sdr/validator.ts:86-97` (`VERIFIABLE_FACT_REGEX`):
  ```typescript
  const VERIFIABLE_FACT_REGEX = new RegExp(
    '(' +
    ...
    'agenda concorrida|\\b\\d+\\b' +
    ')',
    'i'
  );
  ```
- **Fato Observado**: Mensagens que NÃO contêm nenhum fato verificável, mas incluem `"2 linhas"` no Bloco 4 (CTA), são erroneamente marcadas como `hasVerifiableFact: true`. O dígito `2` satisfaz a alternativa `\b\d+\b`, anulando a obrigatoriedade de haver um fato real da empresa.

### Observação 1.7: Evasão Regulatória e Discrepância Entre `niches.ts` e `validator.ts`
- **Código Fonte**: `src/sdr/niches.ts:88` vs `src/sdr/validator.ts:142`
- **Fato Observado**:
  1. **Dermatologia (CFM 2.336/2023)**: `niches.ts:88` lista explicitamente `'desconto'` e `'promoção'` como `prohibitedTerms`. Porém, `validator.ts:142` (`checkEthicalGuardrails`) apenas testa `antes e depois|garantia de resultado|pele perfeita garantida|cura definitiva|avaliação gratuita|consulta grátis`. Mensagens com `"promoção e desconto de 50%"` foram APROVADAS (`isValid: true`) por `validateApproach`.
  2. **Inversões Sintáticas no CFM**: A expressão `"resultado garantido"` não é capturada por `garantia de resultado`.
  3. **Advocacia (Provimento 205/2021 OAB)**: Termos deontológicos como `"angariação de causas"` e `"prospecção de clientes"` não são capturados pela regex `prohibitedOAB` (que testa apenas o verbo `"prospectar clientes"` e `"captar clientes"`).
  4. **Odontologia (CFO 196/2019)**: `"atendimento gratuito"` não é capturado por `prohibitedCFO` (que testa apenas `"consulta/avaliação gratuita"`).

---

## 2. Logic Chain (Cadeia Lógica de Inferência)

1. **Premissa 1 (R1 & PROJECT.md)**: As abordagens geradas pelo motor SDR Whats-Kethy devem ser 100% blindadas contra envio de mensagens corrompidas e contra infrações legais que gerem sanções de órgãos de classe (OAB, CFM, CFO) ou constrangimento comercial perante leads.
2. **Premissa 2 (Observação 1.2)**: Quando a LLM (Claude Sonnet 4.6 via Keydex) ou o usuário digita uma variação comum de delimitador com espaços ou caixa baixa (`"--- split ---"`), o sanitizador quebra a estrutura e injeta a palavra `"split"` dentro da mensagem enviada ao lead. Isso degrada a percepção humana e quebra o requisito de parecer humano e não robô.
3. **Premissa 3 (Observação 1.3 & 1.5)**: A falta de resiliência a `"--SPLIT--"` e a sensibilidade a espaços duplos em `validateApproach` provocam falsas rejeições de abordagens válidas em tempo de execução.
4. **Premissa 4 (Observação 1.6)**: A presença de `\b\d+\b` no validador de fato verificável permite que mensagens vazias de fato concreto sejam aprovadas pelo simples fato de o CTA conter "2 linhas", desvirtuando o núcleo da estratégia dos 4 blocos.
5. **Premissa 5 (Observação 1.7)**: O validador principal `validateApproach` não está sincronizado com `NICHES_CONFIG.guardrails.prohibitedTerms` de `src/sdr/niches.ts`. Mensagens ofertando `"promoção e desconto"` em medicina estética são aprovadas, gerando risco iminente de infração ao CFM Resolução 2.336/2023.
6. **Conclusão Lógica**: O código atual de `src/sdr/validator.ts` não possui robustez adversarial suficiente para entrar em produção sem correções cirúrgicas prévias. O Marco M1 deve ser rejeitado no portão de qualidade até que essas falhas sejam sanadas pelo time de desenvolvimento.

---

## 3. Caveats (Ressalvas)

- Não foi modificada nenhuma linha do código-fonte em `src/sdr/`, em cumprimento estrito ao papel de reviewer/challenger (`Review-only — do NOT modify implementation code`).
- O gerador de fallback em `KeydexClient.generateFallbackApproach` e os 10 templates canônicos em `niches.ts` são válidos e cumprem a risca o contrato de <= 50 palavras e 2 balões quando executados em condições nominais.
- A vulnerabilidade está concentrada na camada determinística de regex e sanitização em `src/sdr/validator.ts`.

---

## 4. Conclusion (Veredicto Final e Recomendações de Ação)

### Veredicto: ❌ **REJECT**

Recomenda-se o bloqueio da transição para os Marcos M2/M4 até que as seguintes 5 correções pontuais sejam aplicadas pelo agente de implementação em `src/sdr/validator.ts`:

1. **Correção do `altSplitRegex` (linha 275)**:
   - Adicionar flag `/i`.
   - Incluir suporte a 2 ou mais hífens (`--+\s*split\s*--+`).
   - Remover o `|---` genérico que consome travessões legítimos de pontuação.
   - Recomendação de regex: `/\s*(?:\[SPLIT\]|-{2,}\s*split\s*-{2,}|={2,}\s*split\s*={2,})\s*/gi`.
2. **Normalização Prévia de Espaços em `validateApproach` (linha 183)**:
   - Aplicar normalização de múltiplos espaços (`text.replace(/[ \t]+/g, ' ')`) antes de passar o texto para `detectRequiredBlocks(text)` e `checkEthicalGuardrails(text)`.
   - Atualizar `CTA_INTEREST_REGEX` e `PUBLIC_SOURCE_REGEX` para usar `\s+` em vez de espaços literais.
3. **Refinamento do `VERIFIABLE_FACT_REGEX` (linha 93)**:
   - Remover o fallback cego `\b\d+\b` isolado, exigindo que números venham acompanhados de unidades contextuais (ex: `\d+\s*(?:avaliações|imóveis|horas|h|min|minutos|reclamações|vagas|artigos|anos)`).
4. **Sincronização de Guardrails Éticos**:
   - Integrar `validateRegulatoryCompliance(niche, text)` de `src/sdr/niches.ts` dentro de `checkEthicalGuardrails` em `src/sdr/validator.ts`.
   - Adicionar `"promoção"`, `"desconto"` e variações sintáticas (`"resultado garantido"`, `"angariação de causas"`, `"prospecção de clientes"`, `"atendimento gratuito"`).

---

## 5. Verification Method (Método de Verificação Independente)

Para reproduzir empiricamente todas as evidências deste relatório de forma automatizada:

1. Executar a suíte unitária padrão:
   ```bash
   cd "C:\Users\Kethely\Desktop\Whats-Kethy-Portatil"
   npx tsx tests/unit/m1_engine.test.ts
   ```
   *(Resultado esperado: 20/20 PASS nas condições nominais).*

2. Executar a suíte de estresse adversária:
   ```bash
   cd "C:\Users\Kethely\Desktop\Whats-Kethy-Portatil"
   npx tsx tests/stress/adversarial_validator.test.ts
   ```
   *(Resultado esperado: Reprodução imediata das 4 falhas ativas de teste e emissão detalhada das 10 anomalias documentadas).*

3. Condição de invalidação deste relatório:
   - O relatório será invalidado se `src/sdr/validator.ts` for corrigido de forma que a execução de `npx tsx tests/stress/adversarial_validator.test.ts` passe com 100% de aprovação (39/39 PASS) e 0 anomalias.
