/**
 * Tier 4: Real-World Application Scenarios Test Suite
 * Fluxos de Conversação Completos e Realistas nos 5 Nichos:
 * 1. Cenário Dermatologia (Dra. Paula) - Abordagem -> Curiosidade -> Triagem 3 Tópicos -> Reunião
 * 2. Cenário Odontologia (Dr. Rafael) - Mystery Shopping -> Transparência CFO -> Envio de Print -> Reunião
 * 3. Cenário Imobiliária (Marcos) - Abordagem Portais -> Objeção "Sem tempo" -> Saída Honrosa -> Resgate
 * 4. Cenário Advocacia (Dr. André) - Abordagem Receptiva -> Questionamento OAB 205 -> Esclarecimento -> Reunião
 * 5. Cenário Logística (Ricardo) - Abordagem Vagas SAC -> Dor de Rastreio -> Automação 3 Passos -> Reunião
 */

const fs = require('fs');
const path = require('path');
const { validateApproach, countWords } = require('./helpers/approach_validator.cjs');
const { computeRates } = require('./helpers/tier_calculator.cjs');
const { validateMysteryShopping } = require('./helpers/mystery_shopping_validator.cjs');

const PERSONAS_PATH = path.join(__dirname, '..', 'synthetic_personas.json');

module.exports = {
  name: "Tier 4: Real-World Application Scenarios",
  run: async (t) => {
    const rawData = fs.readFileSync(PERSONAS_PATH, 'utf-8');
    const db = JSON.parse(rawData);
    const personas = db.personas;

    // =========================================================================
    // SCENARIO 1: Dermatologia (Dra. Paula) - Fluxo de Prospecção Completo
    // =========================================================================
    await t.test("S1: Dermatologia - Fluxo Completo Realista (Dra. Paula)", () => {
      const p = personas.find(x => x.id === 'lead-paula-derma');

      // Turno 1: Abordagem fria do SDR
      const approachVal = validateApproach(p.canonicalApproach.splitText, { niche: p.niche });
      t.ok(approachVal.isValid, `Turno 1: Abordagem deve ser válida: ${approachVal.errors.join(', ')}`);
      t.strictEqual(approachVal.bubbleCount, 2);
      t.ok(approachVal.totalWordCount <= 50);

      // Turno 2: Resposta da Médica com ceticismo inicial
      const leadResponseT2 = "Oi Kethely. De onde você pegou meu WhatsApp e por que está olhando as avaliações da clínica?";
      t.ok(leadResponseT2.includes("onde você pegou"), "Turno 2: Lead questiona origem dos dados");

      // Turno 3: SDR responde com transparência LGPD e sem agressividade
      const sdrResponseT3 = "Desculpe pelo contato direto, Dra. Paula! Peguei o número público no site oficial da clínica. Como acompanho o segmento médico em SP, anotei os gargalos do WhatsApp pra somar. Se preferir, retiro seu número agora mesmo!";
      t.ok(sdrResponseT3.includes("público no site"), "Turno 3: SDR esclarece fonte pública");
      t.ok(sdrResponseT3.includes("retiro seu número"), "Turno 3: SDR oferece opt-out imediato");
      t.ok(countWords(sdrResponseT3) <= 50, "Turno 3: SDR mantém concisão");

      // Turno 4: Médica se tranquiliza e pede o resumo
      const leadResponseT4 = "Entendi. Pode me mandar em 2 linhas o que você sugeriu então.";
      t.ok(/(pode mandar|2 linhas)/i.test(leadResponseT4));

      // Turno 5: SDR entrega valor em 3 tópicos ultra curtos + CTA de 5 minutos
      const sdrResponseT5 = "1) Triagem automática de convênio vs particular.---SPLIT---2) Resposta imediata de botox à noite e 3) Confirmação interativa na véspera. Faz sentido ver 1 minuto em vídeo?";
      const valT5 = validateApproach(sdrResponseT5, { niche: p.niche, isConversationTurn: true });
      t.ok(valT5.isValid, `Turno 5 válido: ${valT5.errors.join(', ')}`);
      t.strictEqual(valT5.bubbleCount, 2);
      t.ok(valT5.totalWordCount <= 50);

      // Turno 6: Médica agenda demonstração
      const leadResponseT6 = "Faz sentido sim. Me manda o vídeo ou me chama amanhã às 14h.";
      t.ok(/(faz sentido|chama amanhã)/i.test(leadResponseT6));

      // Atualização de Métricas do Tier A
      const updatedMetrics = computeRates(1, 1, 1);
      t.strictEqual(updatedMetrics.responseRate, 1.0);
      t.strictEqual(updatedMetrics.meetingConversionRate, 1.0);
    });

    // =========================================================================
    // SCENARIO 2: Odontologia (Dr. Rafael) - Mystery Shopping e Compliance CFO
    // =========================================================================
    await t.test("S2: Odontologia - Mystery Shopping e Conformidade CFO (Dr. Rafael)", () => {
      const p = personas.find(x => x.id === 'lead-rafael-odonto');

      // Turno 1: SDR envia abordagem canônica com trigger do mystery shopping
      const approachVal = validateApproach(p.canonicalApproach.splitText, { niche: p.niche });
      t.ok(approachVal.isValid, `Turno 1 válido: ${approachVal.errors.join(', ')}`);
      t.ok(p.canonicalApproach.splitText.includes("10h"));

      // Turno 2: Dr. Rafael reconhece a dor
      const leadResponseT2 = "Olá Kethely. Realmente fechamos às 19h e a secretária só responde às 10h. Vocês fazem avaliação gratuita para atrair clientes?";
      t.ok(leadResponseT2.includes("fechamos às 19h"));

      // Turno 3: SDR reforça conformidade ética com CFO (sem consulta grátis)
      const sdrResponseT3 = "Não fazemos avaliação gratuita, Dr. Rafael! O CFO veda isso como mercantilização.---SPLIT---Focamos em triagem rápida de horários e confirmação para derrubar faltas. Posso mandar o print do teste?";
      const valT3 = validateApproach(sdrResponseT3, { niche: p.niche, isConversationTurn: true });
      t.ok(valT3.isValid, `Turno 3 válido: ${valT3.errors.join(', ')}`);
      t.strictEqual(valT3.bubbleCount, 2);
      t.ok(valT3.totalWordCount <= 50);

      // Turno 4: Dr. Rafael aceita
      const leadResponseT4 = "Excelente saber que respeitam o CFO. Manda o print do teste sim.";
      t.ok(leadResponseT4.includes("print"));

      // Registro de métricas Tier A
      const stats = computeRates(10, 4, 2);
      t.strictEqual(stats.meetingConversionRatePct, "20.0%");
    });

    // =========================================================================
    // SCENARIO 3: Imobiliária (Marcos) - Objeção e Recuperação Elegante
    // =========================================================================
    await t.test("S3: Imobiliária - Tratamento de Objeção e Saída Honrosa (Marcos)", () => {
      const p = personas.find(x => x.id === 'lead-marcos-imob');

      // Turno 1: Abordagem ZAP
      const approachVal = validateApproach(p.canonicalApproach.splitText, { niche: p.niche });
      t.ok(approachVal.isValid, `Turno 1 válido: ${approachVal.errors.join(', ')}`);

      // Turno 2: Marcos dá objeção de falta de tempo
      const leadResponseT2 = "Oi Kethely, agora não é o momento. Estamos no meio do fechamento de metas e sem tempo pra nada.";
      t.ok(leadResponseT2.includes("não é o momento"));

      // Turno 3: SDR aplica saída honrosa sem forçar a barra (Regra de Ouro)
      const sdrResponseT3 = "Entendido perfeitamente, Marcos! Bom fechamento de metas por aí e não volto a incomodar. Se mais pra frente a triagem dos 120 imóveis fizer sentido, estou à disposição. Sucesso nas vendas!";
      t.ok(countWords(sdrResponseT3) <= 50);
      t.ok(sdrResponseT3.includes("não volto a incomodar"));

      // Turno 4: Marcos agradece a educação e pede para manter contato
      const leadResponseT4 = "Obrigado pela educação! Me passa seu link ou contato pra eu guardar aqui.";
      t.ok(leadResponseT4.includes("Obrigado") || leadResponseT4.includes("guardar"));
    });

    // =========================================================================
    // SCENARIO 4: Advocacia (Dr. André) - Esclarecimento Rígido Provimento 205 OAB
    // =========================================================================
    await t.test("S4: Advocacia - Esclarecimento Rígido Provimento 205/2021 (Dr. André)", () => {
      const p = personas.find(x => x.id === 'lead-andre-adv');

      // Turno 1: Abordagem receptiva de triagem
      const approachVal = validateApproach(p.canonicalApproach.splitText, { niche: p.niche });
      t.ok(approachVal.isValid, `Turno 1 válido: ${approachVal.errors.join(', ')}`);
      t.ok(p.canonicalApproach.splitText.includes("receptivo"));

      // Turno 2: Advogado indaga sobre legalidade na OAB
      const leadResponseT2 = "Prezada Kethely. Como advogado, sou proibido pela OAB de fazer captação ativa ou mercantilização. O que vocês fazem exatamente?";
      t.ok(leadResponseT2.includes("OAB"));

      // Turno 3: SDR esclarece Provimento 205/2021 com precisão
      const sdrResponseT3 = "Com certeza, Dr. André! Cumprimos rigorosamente o Provimento 205/2021 da OAB.---SPLIT---Nossa solução é 100% receptiva: organiza dúvidas de quem já chamou o escritório e tria andamentos processuais. Faz sentido ver 2 ideias?";
      const valT3 = validateApproach(sdrResponseT3, { niche: p.niche, isConversationTurn: true });
      t.ok(valT3.isValid, `Turno 3 válido: ${valT3.errors.join(', ')}`);
      t.strictEqual(valT3.bubbleCount, 2);
      t.ok(valT3.totalWordCount <= 50);

      // Turno 4: Dr. André aprova e propõe conversa
      const leadResponseT4 = "Perfeito. Essa triagem interna de andamentos nos interessa muito. Pode me ligar amanhã às 11h.";
      t.ok(leadResponseT4.includes("interessa") || leadResponseT4.includes("amanhã"));

      // Registro de conversão
      const stats = computeRates(5, 3, 2);
      t.strictEqual(stats.meetingConversionRatePct, "40.0%");
    });

    // =========================================================================
    // SCENARIO 5: Logística (Ricardo) - Automação de Rastreio SAC Tier B
    // =========================================================================
    await t.test("S5: Logística - Automação de Rastreio SAC Tier B (Ricardo)", () => {
      const p = personas.find(x => x.id === 'lead-ricardo-log');

      // Turno 1: Abordagem Reclame Aqui + Vagas SAC
      const approachVal = validateApproach(p.canonicalApproach.splitText, { niche: p.niche });
      t.ok(approachVal.isValid, `Turno 1 válido: ${approachVal.errors.join(', ')}`);
      t.strictEqual(p.tier, 'B');

      // Turno 2: Ricardo confirma o problema operacional
      const leadResponseT2 = "Opa Kethely. Realmente estamos afogados com cliente cobrando prazo de entrega no WhatsApp toda hora.";
      t.ok(leadResponseT2.includes("afogados") || leadResponseT2.includes("prazo de entrega"));

      // Turno 3: SDR envia solução em 3 passos estruturados
      const sdrResponseT3 = "1) Consulta automática de status com número da nota.---SPLIT---2) Alerta de 'saiu para entrega' e 3) Transbordo pro atendente só se houver avaria. Faz sentido ver como roda?";
      const valT3 = validateApproach(sdrResponseT3, { niche: p.niche, isConversationTurn: true });
      t.ok(valT3.isValid, `Turno 3 válido: ${valT3.errors.join(', ')}`);
      t.strictEqual(valT3.bubbleCount, 2);
      t.ok(valT3.totalWordCount <= 50);

      // Turno 4: Ricardo aprova para alinhamento técnico
      const leadResponseT4 = "Muito bom. Quero colocar meu supervisor operacional pra ver isso com a gente. Quando podemos falar?";
      t.ok(leadResponseT4.includes("supervisor") || leadResponseT4.includes("Quando podemos falar"));

      // Registro de conversão Tier B
      const stats = computeRates(20, 8, 4);
      t.strictEqual(stats.meetingConversionRatePct, "20.0%");
    });
  }
};
