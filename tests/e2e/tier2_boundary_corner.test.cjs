/**
 * Tier 2: Boundary & Corner Cases Test Suite (>= 5 tests per category/feature)
 * Casos Limite, Valores Extremos, Falhas e Proteções Matemáticas:
 * 1. Limite de Contagem de Palavras (50, 51, 49, 1, 0, whitespace)
 * 2. Limite de Balões (2 balões, 1 balão, 3 balões, balões vazios, delimitadores)
 * 3. Ausência de Blocos Obrigatórios (Fonte, Fato, Implicação, CTA)
 * 4. Métricas e Persistência (Divisão por zero, valores zerados, negativos, clamping)
 * 5. Limiar Matemático de Ajuste Dinâmico 2x (1.99x, 2.00x, 2.01x, Tier B zerado, amostra mínima)
 * 6. Limites de Mystery Shopping (0 min, 10 dias, 2 vs 3 vs 4 linhas, 4 vs 5 vs 6 perguntas)
 * 7. Limites Ético-Legais (Tentativa de captação OAB, mercantilização CFO, sensacionalismo CFM, LGPD)
 */

const { validateApproach, countWords } = require('./helpers/approach_validator.cjs');
const { computeRates, evaluateDynamicAdjustment } = require('./helpers/tier_calculator.cjs');
const { validateMysteryShopping } = require('./helpers/mystery_shopping_validator.cjs');

module.exports = {
  name: "Tier 2: Boundary & Corner Cases",
  run: async (t) => {

    // =========================================================================
    // CATEGORY 1: Limite de Palavras (>= 5 testes)
    // =========================================================================
    await t.test("B1.1: Exatamente 50 palavras no total -> Válido (limite máximo permitido)", () => {
      // 21 palavras
      const b1 = "Oi Dra Paula! Kethely da KethyTech em SP. Vi no Google que 3 das últimas 10 avaliações citam demora no WhatsApp.";
      // 29 palavras
      const b2 = "Quando o lead espera ele procura outra clínica rapidamente. Posso te mandar em duas linhas como resolvemos isso no automático? Se não for prioridade me avisa que não insisto.";
      const text = `${b1}---SPLIT---${b2}`;
      const totalWords = countWords(text.replace('---SPLIT---', ' '));
      t.strictEqual(totalWords, 50, `Deve ter exatamente 50 palavras (atual: ${totalWords})`);
      const val = validateApproach(text, { niche: 'dermatologia' });
      t.strictEqual(val.totalWordCount, 50);
      t.ok(val.isValid, `50 palavras exatas deve ser aceito: ${val.errors.join(', ')}`);
    });

    await t.test("B1.2: Exatamente 51 palavras no total -> Inválido (estouro de limite por 1 palavra)", () => {
      // 21 palavras
      const b1 = "Oi Dra Paula! Kethely da KethyTech em SP. Vi no Google que 3 das últimas 10 avaliações citam demora no WhatsApp.";
      // 30 palavras
      const b2 = "Quando o lead espera ele procura outra clínica rapidamente. Posso te mandar em duas linhas como resolvemos isso no automático? Se não for prioridade me avisa que não insisto mesmo.";
      const text = `${b1}---SPLIT---${b2}`;
      const totalWords = countWords(text.replace('---SPLIT---', ' '));
      t.strictEqual(totalWords, 51, `Deve ter exatamente 51 palavras (atual: ${totalWords})`);
      const val = validateApproach(text, { niche: 'dermatologia' });
      t.strictEqual(val.totalWordCount, 51);
      t.strictEqual(val.isValid, false, "51 palavras deve ser estritamente rejeitado");
      t.ok(val.errors.some(e => e.includes("Limite de palavras violado")));
    });

    await t.test("B1.3: Exatamente 49 palavras no total -> Válido", () => {
      // 21 palavras
      const b1 = "Oi Dra Paula! Kethely da KethyTech em SP. Vi no Google que 3 das últimas 10 avaliações citam demora no WhatsApp.";
      // 28 palavras
      const b2 = "Quando o lead espera ele procura outra clínica rapidamente. Posso te mandar em duas linhas como resolvemos isso no automático? Se não for prioridade me avisa que insisto.";
      const text = `${b1}---SPLIT---${b2}`;
      const totalWords = countWords(text.replace('---SPLIT---', ' '));
      t.strictEqual(totalWords, 49, `Deve ter exatamente 49 palavras (atual: ${totalWords})`);
      const val = validateApproach(text, { niche: 'dermatologia' });
      t.ok(val.isValid, `49 palavras deve ser válido: ${val.errors.join(', ')}`);
    });

    await t.test("B1.4: 0 palavras / string vazia / apenas espaços -> Rejeitado com erro", () => {
      const val = validateApproach("     ");
      t.strictEqual(val.isValid, false);
      t.strictEqual(val.totalWordCount, 0);
      t.ok(val.errors.some(e => e.includes("vazia")));
    });

    await t.test("B1.5: Múltiplos espaços, quebras de linha e tabulações não distorcem a contagem", () => {
      const text = "Oi,   Dra.   Paula! \n\n Vi   no   Google   3   avaliações. ---SPLIT--- Posso   mandar?   Se   não   for   prioridade,   avisa.";
      const count = countWords(text.replace('---SPLIT---', ' '));
      t.ok(count < 50);
      t.strictEqual(countWords("   palavra1    palavra2   palavra3   "), 3, "Espaços extras não alteram contagem");
    });

    // =========================================================================
    // CATEGORY 2: Limite de Balões (>= 5 testes)
    // =========================================================================
    await t.test("B2.1: Exatamente 1 balão (sem separador ---SPLIT---) -> Inválido", () => {
      const oneBubble = "Oi Dr Rafael! Vi sua clínica no Google e podemos ajudar com seu WhatsApp. Posso mandar se não for prioridade?";
      const val = validateApproach(oneBubble);
      t.strictEqual(val.isValid, false);
      t.strictEqual(val.bubbleCount, 1);
      t.ok(val.errors.some(e => e.includes("Regra de balões violada")));
    });

    await t.test("B2.2: Exatamente 3 balões (dois separadores) -> Inválido", () => {
      const threeBubbles = "Oi Dr André! Vi seu site no Google.---SPLIT---Boa parte do dia vai em triagem.---SPLIT---Posso mandar se não for prioridade?";
      const val = validateApproach(threeBubbles);
      t.strictEqual(val.isValid, false);
      t.strictEqual(val.bubbleCount, 3);
      t.ok(val.errors.some(e => e.includes("Regra de balões violada")));
    });

    await t.test("B2.3: 4 ou mais balões -> Inválido", () => {
      const fourBubbles = "B1---SPLIT---B2---SPLIT---B3---SPLIT---B4";
      const val = validateApproach(fourBubbles);
      t.strictEqual(val.isValid, false);
      t.strictEqual(val.bubbleCount, 4);
    });

    await t.test("B2.4: 2 balões com separador mas um deles vazio -> Inválido (rejeita balão em branco)", () => {
      const emptySecond = "Oi Dra Paula, vi seu perfil no Google com 3 avaliações.---SPLIT---    ";
      const val = validateApproach(emptySecond);
      t.strictEqual(val.isValid, false);
      t.strictEqual(val.bubbleCount, 1, "Balão vazio é filtrado resultando em 1 balão real");
    });

    await t.test("B2.5: Compatibilidade com separador de nova linha dupla (\\n\\n)", () => {
      const textNewline = "Oi Ricardo, vi no Reclame Aqui que retorno de rastreio trava o SAC.\n\nPosso te mandar em 2 linhas como resolver? Se não for prioridade me avisa.";
      const val = validateApproach(textNewline, { niche: 'logistica' });
      t.strictEqual(val.bubbleCount, 2, "Quebra dupla deve ser tratada como 2 balões");
    });

    // =========================================================================
    // CATEGORY 3: Ausência de Blocos Obrigatórios (>= 5 testes)
    // =========================================================================
    await t.test("B3.1: Abordagem sem Fonte Pública -> Rejeitada no Bloco 1", () => {
      const noSource = "Oi Dr André, como vai você hoje?---SPLIT---Seu escritório fecha às 18h e podemos automatizar. Posso mandar se não for prioridade?";
      const val = validateApproach(noSource, { niche: 'advocacia' });
      t.strictEqual(val.isValid, false);
      t.strictEqual(val.hasRequiredBlocks.hasPublicSource, false);
      t.ok(val.errors.some(e => e.includes("Bloco 1 ausente")));
    });

    await t.test("B3.2: Abordagem sem Fato Verificável Específico -> Rejeitada no Bloco 2", () => {
      const noFact = "Oi Marcos, vi sua imobiliária no ZAP e tudo bem com você?---SPLIT---Podemos ajudar com mensagens que chegam no WhatsApp. Posso mandar se fizer sentido?";
      const val = validateApproach(noFact, { niche: 'imobiliaria' });
      t.strictEqual(val.isValid, false);
      t.strictEqual(val.hasRequiredBlocks.hasVerifiableFact, false);
      t.ok(val.errors.some(e => e.includes("Bloco 2 ausente")));
    });

    await t.test("B3.3: Abordagem sem Implicação de Negócio -> Rejeitada no Bloco 3", () => {
      const noImplication = "Oi Dra Paula! Vi no Google que 3 avaliações citam demora no WhatsApp.---SPLIT---Temos um software muito bom de inteligência artificial. Posso te mandar?";
      const val = validateApproach(noImplication, { niche: 'dermatologia' });
      t.strictEqual(val.isValid, false);
      t.strictEqual(val.hasRequiredBlocks.hasImplication, false);
      t.ok(val.errors.some(e => e.includes("Bloco 3 ausente")));
    });

    await t.test("B3.4: Abordagem sem Pergunta/CTA com saída honrosa -> Rejeitada no Bloco 4", () => {
      const noCta = "Oi Ricardo! Vi no Reclame Aqui que rastreio trava o SAC.---SPLIT---O 'cadê minha entrega' lota o WhatsApp e custa caro pra empresa todo mês.";
      const val = validateApproach(noCta, { niche: 'logistica' });
      t.strictEqual(val.isValid, false);
      t.strictEqual(val.hasRequiredBlocks.hasCtaOrQuestion, false);
      t.ok(val.errors.some(e => e.includes("Bloco 4 ausente")));
    });

    await t.test("B3.5: Abordagem genérica de robô (nenhum dos 4 blocos reais) -> Todos os 4 blocos acusados", () => {
      const robotText = "Olá, tudo bem? Somos a melhor agência do Brasil.---SPLIT---Queremos agendar uma reunião comercial com seu diretor agora mesmo.";
      const val = validateApproach(robotText);
      t.strictEqual(val.isValid, false);
      t.strictEqual(val.hasRequiredBlocks.hasPublicSource, false);
      t.strictEqual(val.hasRequiredBlocks.hasVerifiableFact, false);
      t.strictEqual(val.hasRequiredBlocks.hasImplication, false);
      t.strictEqual(val.hasRequiredBlocks.hasCtaOrQuestion, false);
      t.ok(val.errors.length >= 4);
    });

    // =========================================================================
    // CATEGORY 4: Métricas, Persistência e Divisão por Zero (>= 5 testes)
    // =========================================================================
    await t.test("B4.1: 0 contatos abordados não gera NaN nem Infinity", () => {
      const rates = computeRates(0, 0, 0);
      t.strictEqual(Number.isNaN(rates.responseRate), false);
      t.strictEqual(Number.isFinite(rates.responseRate), true);
      t.strictEqual(rates.responseRate, 0);
      t.strictEqual(rates.meetingConversionRate, 0);
    });

    await t.test("B4.2: Valores nulos, indefinidos ou strings não numéricas são tratados com segurança", () => {
      const rates = computeRates(null, undefined, "inválido");
      t.strictEqual(rates.contactsApproached, 0);
      t.strictEqual(rates.responseRate, 0);
      t.strictEqual(rates.meetingConversionRate, 0);
    });

    await t.test("B4.3: Contatos positivos com 0 respostas e 0 reuniões -> 0.0%", () => {
      const rates = computeRates(50, 0, 0);
      t.strictEqual(rates.responseRate, 0);
      t.strictEqual(rates.meetingConversionRate, 0);
      t.strictEqual(rates.responseRatePct, "0.0%");
      t.strictEqual(rates.meetingConversionRatePct, "0.0%");
    });

    await t.test("B4.4: 100% de conversão (10 contatos, 10 respostas, 10 reuniões) -> 100.0%", () => {
      const rates = computeRates(10, 10, 10);
      t.strictEqual(rates.responseRate, 1.0);
      t.strictEqual(rates.meetingConversionRate, 1.0);
      t.strictEqual(rates.responseRatePct, "100.0%");
      t.strictEqual(rates.meetingConversionRatePct, "100.0%");
    });

    await t.test("B4.5: Valores negativos de contatos são convertidos ou bloqueados com segurança", () => {
      const rates = computeRates(-20, -5, -2);
      t.strictEqual(rates.contactsApproached, 0);
      t.strictEqual(rates.responseRate, 0);
      t.strictEqual(rates.meetingConversionRate, 0);
    });

    // =========================================================================
    // CATEGORY 5: Limiares Matemáticos do Ajuste Dinâmico 2x (>= 5 testes)
    // =========================================================================
    await t.test("B5.1: Tier A com taxa = 1.99x Tier B (abaixo do limiar por 0.01x) -> Dispara ajuste", () => {
      const tierA = { contactsApproached: 100, responsesReceived: 30, meetingsBooked: 19 };
      const tierB = { contactsApproached: 100, responsesReceived: 20, meetingsBooked: 10 };
      const res = evaluateDynamicAdjustment(tierA, tierB);
      t.strictEqual(res.needsAdjustment, true, "19% é < 2 * 10% (20%), deve disparar ajuste");
      t.strictEqual(res.recommendedAllocation.tierA, 30);
    });

    await t.test("B5.2: Tier A com taxa = 2.01x Tier B (acima do limiar por 0.01x) -> Mantém sem ajuste", () => {
      const tierA = { contactsApproached: 100, responsesReceived: 35, meetingsBooked: 21 };
      const tierB = { contactsApproached: 100, responsesReceived: 20, meetingsBooked: 10 };
      const res = evaluateDynamicAdjustment(tierA, tierB);
      t.strictEqual(res.needsAdjustment, false, "21% é > 2 * 10% (20%), atinge meta");
      t.strictEqual(res.recommendedAllocation.tierA, 50);
    });

    await t.test("B5.3: Tier B com 0% de conversão (0 reuniões) -> Não causa divisão por zero", () => {
      const tierA = { contactsApproached: 100, responsesReceived: 10, meetingsBooked: 5 };
      const tierB = { contactsApproached: 100, responsesReceived: 10, meetingsBooked: 0 };
      const res = evaluateDynamicAdjustment(tierA, tierB);
      t.strictEqual(res.thresholdRequired, 0);
      t.strictEqual(res.needsAdjustment, false);
      t.strictEqual(Number.isFinite(res.thresholdRequired), true);
    });

    await t.test("B5.4: Ambos os Tiers com 0% de conversão -> Não causa falha de execução", () => {
      const tierA = { contactsApproached: 50, responsesReceived: 5, meetingsBooked: 0 };
      const tierB = { contactsApproached: 50, responsesReceived: 5, meetingsBooked: 0 };
      const res = evaluateDynamicAdjustment(tierA, tierB);
      t.strictEqual(res.needsAdjustment, false);
      t.strictEqual(res.tierAConversionRate, 0);
      t.strictEqual(res.tierBConversionRate, 0);
    });

    await t.test("B5.5: Amostra limítrofe exatamente igual ao minSample (10 contatos) -> Avalia ajuste", () => {
      const tierA = { contactsApproached: 10, responsesReceived: 2, meetingsBooked: 0 };
      const tierB = { contactsApproached: 10, responsesReceived: 3, meetingsBooked: 1 };
      const res = evaluateDynamicAdjustment(tierA, tierB, { minSample: 10 });
      t.strictEqual(res.needsAdjustment, true, "Com 10 contatos o limiar é ativado e 0% < 20%");
    });

    // =========================================================================
    // CATEGORY 6: Limites de Mystery Shopping (>= 5 testes)
    // =========================================================================
    await t.test("B6.1: Tempo de resposta = 0 minutos (resposta instantânea/bot) -> Aceito", () => {
      const immediateData = {
        testQuestion: "Olá! Vocês atendem convênio Unimed?",
        measuredResponseTimeMinutes: 0,
        miniDiagnostic3Lines: ["Linha 1 de diagnóstico", "Linha 2 de diagnóstico", "Linha 3 de diagnóstico"],
        frequentQuestionsList: ["Q1?", "Q2?", "Q3?", "Q4?", "Q5?"],
        transparencyNotice: "Teste realizado como diagnóstico gratuito de atendimento."
      };
      const val = validateMysteryShopping(immediateData);
      t.ok(val.isValid);
    });

    await t.test("B6.2: Tempo de resposta extremo (ex: 10 dias / 14400 minutos) -> Aceito numericamente", () => {
      const extremeTimeData = {
        testQuestion: "Boa tarde, qual o valor médio da consulta?",
        measuredResponseTimeMinutes: 14400,
        miniDiagnostic3Lines: ["Linha 1", "Linha 2", "Linha 3"],
        frequentQuestionsList: ["Q1?", "Q2?", "Q3?", "Q4?", "Q5?"],
        transparencyNotice: "Diagnóstico gratuito de tempo de resposta."
      };
      const val = validateMysteryShopping(extremeTimeData);
      t.ok(val.isValid);
    });

    await t.test("B6.3: Mini diagnóstico com 2 linhas (menos que 3) -> Rejeitado", () => {
      const twoLines = {
        testQuestion: "Qual o horário de atendimento aos sábados?",
        measuredResponseTimeMinutes: 60,
        miniDiagnostic3Lines: ["Linha 1", "Linha 2"],
        frequentQuestionsList: ["Q1?", "Q2?", "Q3?", "Q4?", "Q5?"],
        transparencyNotice: "Teste como diagnóstico gratuito."
      };
      const val = validateMysteryShopping(twoLines);
      t.strictEqual(val.isValid, false);
      t.ok(val.errors.some(e => e.includes("exatamente 3 linhas")));
    });

    await t.test("B6.4: Mini diagnóstico com 4 linhas (mais que 3) -> Rejeitado", () => {
      const fourLines = {
        testQuestion: "Qual o horário de atendimento aos sábados?",
        measuredResponseTimeMinutes: 60,
        miniDiagnostic3Lines: ["Linha 1", "Linha 2", "Linha 3", "Linha 4"],
        frequentQuestionsList: ["Q1?", "Q2?", "Q3?", "Q4?", "Q5?"],
        transparencyNotice: "Teste como diagnóstico gratuito."
      };
      const val = validateMysteryShopping(fourLines);
      t.strictEqual(val.isValid, false);
      t.ok(val.errors.some(e => e.includes("exatamente 3 linhas")));
    });

    await t.test("B6.5: Lista de perguntas com 4 itens (menos que 5) -> Rejeitado", () => {
      const fourQuestions = {
        testQuestion: "Qual o horário de atendimento aos sábados?",
        measuredResponseTimeMinutes: 60,
        miniDiagnostic3Lines: ["L1", "L2", "L3"],
        frequentQuestionsList: ["Q1?", "Q2?", "Q3?", "Q4?"],
        transparencyNotice: "Teste como diagnóstico gratuito."
      };
      const val = validateMysteryShopping(fourQuestions);
      t.strictEqual(val.isValid, false);
      t.ok(val.errors.some(e => e.includes("exatamente 5 perguntas")));
    });

    // =========================================================================
    // CATEGORY 7: Limites Ético-Legais (CFM, CFO, OAB, LGPD) (>= 5 testes)
    // =========================================================================
    await t.test("B7.1: Bloqueio de 'indenização garantida' em advocacia (OAB 205)", () => {
      const text = "Oi Dr André! Vi seu escritório no Google.---SPLIT---Garantimos indenização garantida em processos trabalhistas! Se não for prioridade avisa.";
      const val = validateApproach(text, { niche: 'advocacia' });
      t.strictEqual(val.isValid, false);
      t.ok(val.errors.some(e => e.includes("Provimento 205/2021")));
    });

    await t.test("B7.2: Bloqueio de 'limpeza grátis se vier' em odontologia (CFO)", () => {
      const text = "Oi Dr Rafael! Vi sua clínica no Google.---SPLIT---Temos limpeza grátis se vier hoje na clínica para atrair clientes. Se não fizer sentido me avisa.";
      const val = validateApproach(text, { niche: 'odontologia' });
      t.strictEqual(val.isValid, false);
      t.ok(val.errors.some(e => e.includes("CFO")));
    });

    await t.test("B7.3: Bloqueio de 'garantia de resultado perfeito' em medicina/dermatologia (CFM)", () => {
      const text = "Oi Dra Paula! Vi sua clínica no Google.---SPLIT---Temos garantia de resultado perfeito no tratamento de manchas. Posso mandar se fizer sentido?";
      const val = validateApproach(text, { niche: 'dermatologia' });
      t.strictEqual(val.isValid, false);
      t.ok(val.errors.some(e => e.includes("CFM")));
    });

    await t.test("B7.4: Abordagem que respeita estritamente o Provimento 205 da OAB -> Válida", () => {
      const legalText = "Oi, Dr. André! Kethely da KethyTech em SP. Peguei seu contato no site do escritório, que vai pro WhatsApp até as 18h.---SPLIT---Organizamos a triagem e andamentos no atendimento receptivo para liberar seu tempo. Faz sentido mandar em 2 linhas? Se não for prioridade, me avisa.";
      const val = validateApproach(legalText, { niche: 'advocacia' });
      t.ok(val.isValid, `Deve ser aceita como triagem receptiva: ${val.errors.join(', ')}`);
    });

    await t.test("B7.5: Rejeição de mensagem com tom intimidador ou sem consentimento de saída", () => {
      const stalkingText = "Oi Marcos! Vi tudo sobre você no ZAP e sei que você não responde ninguém.---SPLIT---Você é obrigado a me responder agora ou sua imobiliária vai perder todos os clientes.";
      const val = validateApproach(stalkingText, { niche: 'imobiliaria' });
      t.strictEqual(val.isValid, false);
      t.strictEqual(val.hasRequiredBlocks.hasCtaOrQuestion, false);
    });
  }
};
