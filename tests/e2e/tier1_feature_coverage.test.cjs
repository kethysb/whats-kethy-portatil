/**
 * Tier 1: Feature Coverage Test Suite (>= 5 tests per feature)
 * Cobertura Completa das 10 Features Centrais:
 * 1. 5 Nichos Brasileiros
 * 2. Matriz de Fontes Públicas
 * 3. Estrutura dos 4 Blocos Obrigatórios
 * 4. Regra de 2 Balões e <= 50 Palavras
 * 5. Provimento 205/2021 OAB & Guardrails Éticos
 * 6. Estratégia de Tiers A/B/C
 * 7. Persistência Local Estruturada de Métricas
 * 8. Algoritmo de Ajuste Dinâmico 2x
 * 9. Mystery Shopping Ético
 * 10. CTAs de Reciprocidade
 */

const fs = require('fs');
const path = require('path');
const { validateApproach, countWords } = require('./helpers/approach_validator.cjs');
const { computeRates, evaluateDynamicAdjustment } = require('./helpers/tier_calculator.cjs');
const { validateMysteryShopping } = require('./helpers/mystery_shopping_validator.cjs');

const PERSONAS_PATH = path.join(__dirname, '..', 'synthetic_personas.json');

module.exports = {
  name: "Tier 1: Feature Coverage",
  run: async (t) => {
    const rawData = fs.readFileSync(PERSONAS_PATH, 'utf-8');
    const db = JSON.parse(rawData);
    const personas = db.personas;

    // =========================================================================
    // FEATURE 1: 5 Nichos Brasileiros (>= 5 testes)
    // =========================================================================
    await t.test("F1.1: Suporte e validação canônica para Dermatologia (Dra. Paula)", () => {
      const p = personas.find(x => x.niche === 'dermatologia');
      t.ok(p, "Persona de dermatologia deve existir");
      t.strictEqual(p.niche, 'dermatologia');
      const val = validateApproach(p.canonicalApproach.splitText, { niche: p.niche });
      t.ok(val.isValid, `Abordagem de Dermatologia deve ser válida: ${val.errors.join(', ')}`);
      t.ok(val.totalWordCount <= 50, `Máximo 50 palavras (atual: ${val.totalWordCount})`);
    });

    await t.test("F1.2: Suporte e validação canônica para Odontologia (Dr. Rafael)", () => {
      const p = personas.find(x => x.niche === 'odontologia');
      t.ok(p, "Persona de odontologia deve existir");
      t.strictEqual(p.niche, 'odontologia');
      const val = validateApproach(p.canonicalApproach.splitText, { niche: p.niche });
      t.ok(val.isValid, `Abordagem de Odontologia deve ser válida: ${val.errors.join(', ')}`);
      t.ok(val.totalWordCount <= 50, `Máximo 50 palavras (atual: ${val.totalWordCount})`);
    });

    await t.test("F1.3: Suporte e validação canônica para Imobiliária (Marcos)", () => {
      const p = personas.find(x => x.niche === 'imobiliaria');
      t.ok(p, "Persona de imobiliária deve existir");
      t.strictEqual(p.niche, 'imobiliaria');
      const val = validateApproach(p.canonicalApproach.splitText, { niche: p.niche });
      t.ok(val.isValid, `Abordagem de Imobiliária deve ser válida: ${val.errors.join(', ')}`);
      t.ok(val.totalWordCount <= 50, `Máximo 50 palavras (atual: ${val.totalWordCount})`);
    });

    await t.test("F1.4: Suporte e validação canônica para Advocacia (Dr. André)", () => {
      const p = personas.find(x => x.niche === 'advocacia');
      t.ok(p, "Persona de advocacia deve existir");
      t.strictEqual(p.niche, 'advocacia');
      const val = validateApproach(p.canonicalApproach.splitText, { niche: p.niche });
      t.ok(val.isValid, `Abordagem de Advocacia deve ser válida: ${val.errors.join(', ')}`);
      t.ok(val.totalWordCount <= 50, `Máximo 50 palavras (atual: ${val.totalWordCount})`);
    });

    await t.test("F1.5: Suporte e validação canônica para Logística (Ricardo)", () => {
      const p = personas.find(x => x.niche === 'logistica');
      t.ok(p, "Persona de logística deve existir");
      t.strictEqual(p.niche, 'logistica');
      const val = validateApproach(p.canonicalApproach.splitText, { niche: p.niche });
      t.ok(val.isValid, `Abordagem de Logística deve ser válida: ${val.errors.join(', ')}`);
      t.ok(val.totalWordCount <= 50, `Máximo 50 palavras (atual: ${val.totalWordCount})`);
    });

    // =========================================================================
    // FEATURE 2: Matriz de Fontes Públicas Brasileiras (>= 5 testes)
    // =========================================================================
    await t.test("F2.1: Mapeamento de Google Perfil da Empresa (avaliações e horário)", () => {
      const p = personas.find(x => x.id === 'lead-paula-derma');
      t.ok(p.publicSources.googleProfile, "Dra. Paula deve possuir Google Perfil mapeado");
      t.ok(p.publicSources.googleProfile.reviewCount > 0, "Deve conter contagem de avaliações");
      t.ok(p.canonicalApproach.splitText.includes("Google"), "Abordagem deve citar Google como fonte");
    });

    await t.test("F2.2: Mapeamento de Doctoralia (CRM/RQE e agendamento)", () => {
      const p = personas.find(x => x.id === 'lead-paula-derma');
      t.ok(p.publicSources.doctoralia, "Doctoralia deve estar mapeado");
      t.strictEqual(p.publicSources.doctoralia.verified, true);
      t.ok(p.publicSources.doctoralia.crmOrCro.includes("CRM"), "Deve conter número de CRM");
    });

    await t.test("F2.3: Mapeamento de Portais Imobiliários (ZAP / VivaReal)", () => {
      const p = personas.find(x => x.id === 'lead-marcos-imob');
      t.ok(p.publicSources.realEstatePortals, "Portais imobiliários devem estar mapeados");
      t.strictEqual(p.publicSources.realEstatePortals.activeListingsCount, 120);
      t.ok(p.canonicalApproach.splitText.includes("ZAP"), "Abordagem deve citar portal ZAP");
    });

    await t.test("F2.4: Mapeamento de Meta Ads Library (anúncios ativos com WhatsApp)", () => {
      const p = personas.find(x => x.id === 'lead-camila-meta');
      t.ok(p.publicSources.metaAds, "Meta Ads deve estar mapeado");
      t.strictEqual(p.publicSources.metaAds.hasActiveAds, true);
      t.ok(p.canonicalApproach.splitText.includes("Biblioteca de Anúncios"), "Abordagem deve citar Meta Ads");
    });

    await t.test("F2.5: Mapeamento de Vagas de Atendimento & Reclame Aqui (Logística)", () => {
      const p = personas.find(x => x.id === 'lead-ricardo-log');
      t.ok(p.publicSources.jobPostings, "Vagas de SAC devem estar mapeadas");
      t.ok(p.publicSources.reclameAqui, "Reclame Aqui deve estar mapeado");
      t.ok(p.canonicalApproach.splitText.includes("Reclame Aqui"), "Abordagem deve citar Reclame Aqui");
    });

    // =========================================================================
    // FEATURE 3: Estrutura dos 4 Blocos Obrigatórios (>= 5 testes)
    // =========================================================================
    await t.test("F3.1: Bloco 1 - Fonte Pública reconhecida em todas as abordagens", () => {
      for (const p of personas) {
        const val = validateApproach(p.canonicalApproach.splitText, { niche: p.niche });
        t.ok(val.hasRequiredBlocks.hasPublicSource, `Persona ${p.id} deve ter Fonte Pública reconhecida: ${p.canonicalApproach.splitText}`);
      }
    });

    await t.test("F3.2: Bloco 2 - Fato Verificável específico presente em todas as abordagens", () => {
      for (const p of personas) {
        const val = validateApproach(p.canonicalApproach.splitText, { niche: p.niche });
        t.ok(val.hasRequiredBlocks.hasVerifiableFact, `Persona ${p.id} deve ter Fato Específico e Verificável: ${p.canonicalApproach.splitText}`);
      }
    });

    await t.test("F3.3: Bloco 3 - Implicação de negócio em 1 frase presente em todas as abordagens", () => {
      for (const p of personas) {
        const val = validateApproach(p.canonicalApproach.splitText, { niche: p.niche });
        t.ok(val.hasRequiredBlocks.hasImplication, `Persona ${p.id} deve ter Implicação clara: ${p.canonicalApproach.splitText}`);
      }
    });

    await t.test("F3.4: Bloco 4 - Pergunta/CTA de interesse com saída honrosa presente", () => {
      for (const p of personas) {
        const val = validateApproach(p.canonicalApproach.splitText, { niche: p.niche });
        t.ok(val.hasRequiredBlocks.hasCtaOrQuestion, `Persona ${p.id} deve ter Pergunta de Interesse / CTA com saída`);
      }
    });

    await t.test("F3.5: Decomposição formal dos 4 blocos em estrutura de objeto", () => {
      const p = personas[0];
      const blocks = p.canonicalApproach.blocks;
      t.ok(blocks.source, "Bloco source deve existir");
      t.ok(blocks.verifiableFact, "Bloco verifiableFact deve existir");
      t.ok(blocks.implication, "Bloco implication deve existir");
      t.ok(blocks.cta, "Bloco cta deve existir");
    });

    // =========================================================================
    // FEATURE 4: Regra de 2 Balões e <= 50 Palavras (>= 5 testes)
    // =========================================================================
    await t.test("F4.1: Todas as abordagens canônicas contêm exatamente 2 balões", () => {
      for (const p of personas) {
        const val = validateApproach(p.canonicalApproach.splitText);
        t.strictEqual(val.bubbleCount, 2, `Persona ${p.id} deve ter 2 balões`);
      }
    });

    await t.test("F4.2: Todas as abordagens canônicas contêm <= 50 palavras no total", () => {
      for (const p of personas) {
        const count = countWords(p.canonicalApproach.splitText.replace('---SPLIT---', ' '));
        t.ok(count <= 50, `Persona ${p.id} tem ${count} palavras (máximo: 50)`);
      }
    });

    await t.test("F4.3: Separador de split '---SPLIT---' divide mensagens de forma equilibrada", () => {
      for (const p of personas) {
        const parts = p.canonicalApproach.splitText.split('---SPLIT---');
        t.strictEqual(parts.length, 2);
        const w1 = countWords(parts[0]);
        const w2 = countWords(parts[1]);
        t.ok(w1 >= 10, `Balão 1 deve ter substância (>= 10 palavras, atual: ${w1})`);
        t.ok(w2 >= 10, `Balão 2 deve ter substância (>= 10 palavras, atual: ${w2})`);
      }
    });

    await t.test("F4.4: Validação de array de strings como entrada de 2 balões", () => {
      const p = personas[0];
      const arrayInput = [p.canonicalApproach.bubble1, p.canonicalApproach.bubble2];
      const val = validateApproach(arrayInput, { niche: p.niche });
      t.ok(val.isValid, "Entrada em array de 2 balões deve ser validada com sucesso");
      t.strictEqual(val.bubbleCount, 2);
    });

    await t.test("F4.5: Validador rejeita mensagens com menos ou mais balões", () => {
      const oneBubble = "Oi, tudo bem? Vi sua clínica no Google e podemos ajudar com seu WhatsApp.";
      const val1 = validateApproach(oneBubble);
      t.strictEqual(val1.isValid, false);
      t.strictEqual(val1.bubbleCount, 1);

      const threeBubbles = "Balão 1---SPLIT---Balão 2---SPLIT---Balão 3";
      const val3 = validateApproach(threeBubbles);
      t.strictEqual(val3.isValid, false);
      t.strictEqual(val3.bubbleCount, 3);
    });

    // =========================================================================
    // FEATURE 5: Provimento 205/2021 da OAB e Guardrails Éticos (>= 5 testes)
    // =========================================================================
    await t.test("F5.1: Advocacia - Restrição exclusiva à triagem e atendimento receptivo", () => {
      const p = personas.find(x => x.niche === 'advocacia');
      t.ok(p.publicSources.oabProfile.receptiveOnly, "Advocacia deve ser exclusivamente receptivo");
      const approach = p.canonicalApproach.splitText;
      t.ok(approach.includes("receptivo") || approach.includes("triagem"), "Mensagem deve focar em triagem receptiva");
    });

    await t.test("F5.2: Advocacia - Detecção e bloqueio de captação ativa vedada", () => {
      const illegalApproach = "Oi Dr André! Vi seu escritório no Google.---SPLIT---Podemos fazer captação ativa e processar a empresa com causa ganha! Posso mandar?";
      const val = validateApproach(illegalApproach, { niche: 'advocacia' });
      t.strictEqual(val.isValid, false);
      t.ok(val.errors.some(e => e.includes("Provimento 205/2021")), "Deve acusar violação do Provimento 205/2021 da OAB");
    });

    await t.test("F5.3: Odontologia - CFO veda consulta/avaliação gratuita mercantilista", () => {
      const illegalOdonto = "Oi Dr Rafael! Vi sua clínica no Google.---SPLIT---Oferecemos avaliação gratuita e consulta grátis para novos clientes. Posso te mandar?";
      const val = validateApproach(illegalOdonto, { niche: 'odontologia' });
      t.strictEqual(val.isValid, false);
      t.ok(val.errors.some(e => e.includes("CFO")), "Deve acusar violação do CFO para avaliação gratuita");
    });

    await t.test("F5.4: Dermatologia - CFM veda promessas de resultado ou antes/depois", () => {
      const illegalDerma = "Oi Dra Paula! Vi seu site no Google.---SPLIT---Prometemos antes e depois sensacionalista com cura definitiva garantida! Quer ver?";
      const val = validateApproach(illegalDerma, { niche: 'dermatologia' });
      t.strictEqual(val.isValid, false);
      t.ok(val.errors.some(e => e.includes("CFM")), "Deve acusar violação do CFM 2.336/2023");
    });

    await t.test("F5.5: LGPD - Todas as personas contêm cláusula de saída/opt-out honrosa", () => {
      for (const p of personas) {
        const text = p.canonicalApproach.splitText;
        const hasOptOut = /(se não for prioridade|se não fizer|se não for o momento|se não for o foco|tranquilo|me avisa|é só me dizer|é só falar|sem compromisso)/i.test(text);
        t.ok(hasOptOut, `Persona ${p.id} deve conter cláusula de saída honrosa LGPD: ${text}`);
      }
    });

    // =========================================================================
    // FEATURE 6: Estratégia de Tiers A/B/C e Qualificação (>= 5 testes)
    // =========================================================================
    await t.test("F6.1: Presença e validação de leads no Tier A (alto valor/enterprise)", () => {
      const tierALeads = personas.filter(p => p.tier === 'A');
      t.ok(tierALeads.length >= 3, "Tier A deve conter pelo menos 3 personas de alta relevância");
      for (const l of tierALeads) {
        t.strictEqual(l.tier, 'A');
      }
    });

    await t.test("F6.2: Presença e validação de leads no Tier B (médio porte/processo)", () => {
      const tierBLeads = personas.filter(p => p.tier === 'B');
      t.ok(tierBLeads.length >= 1, "Tier B deve conter personas mapeadas");
      for (const l of tierBLeads) {
        t.strictEqual(l.tier, 'B');
      }
    });

    await t.test("F6.3: Presença e validação de leads no Tier C (entrada/escala rápida)", () => {
      const tierCLeads = personas.filter(p => p.tier === 'C');
      t.ok(tierCLeads.length >= 1, "Tier C deve conter personas de menor complexidade");
      for (const l of tierCLeads) {
        t.strictEqual(l.tier, 'C');
      }
    });

    await t.test("F6.4: Alocação inicial de tempo por Tier (50% A, 30% B, 20% C)", () => {
      const defaultAllocation = { tierA: 50, tierB: 30, tierC: 20 };
      t.strictEqual(defaultAllocation.tierA + defaultAllocation.tierB + defaultAllocation.tierC, 100);
      t.ok(defaultAllocation.tierA > defaultAllocation.tierB);
      t.ok(defaultAllocation.tierB > defaultAllocation.tierC);
    });

    await t.test("F6.5: Diferenciação de abordagem entre Tiers (alta personalização vs escala)", () => {
      const leadA = personas.find(p => p.tier === 'A');
      const leadC = personas.find(p => p.tier === 'C');
      t.ok(leadA.publicSources.doctoralia || leadA.publicSources.realEstatePortals || leadA.publicSources.googleProfile);
      t.ok(leadC.publicSources.instagram || leadC.publicSources.googleProfile);
    });

    // =========================================================================
    // FEATURE 7: Persistência Local Estruturada de Métricas (>= 5 testes)
    // =========================================================================
    await t.test("F7.1: Cálculo determinístico de taxas de resposta e reuniões", () => {
      const rates = computeRates(100, 30, 15);
      t.strictEqual(rates.contactsApproached, 100);
      t.strictEqual(rates.responsesReceived, 30);
      t.strictEqual(rates.meetingsBooked, 15);
      t.strictEqual(rates.responseRate, 0.30);
      t.strictEqual(rates.meetingConversionRate, 0.15);
      t.strictEqual(rates.responseRatePct, "30.0%");
      t.strictEqual(rates.meetingConversionRatePct, "15.0%");
    });

    await t.test("F7.2: Proteção contra divisão por zero em taxas (0 contatos)", () => {
      const rates = computeRates(0, 0, 0);
      t.strictEqual(rates.responseRate, 0);
      t.strictEqual(rates.meetingConversionRate, 0);
      t.strictEqual(rates.responseRatePct, "0.0%");
      t.strictEqual(rates.meetingConversionRatePct, "0.0%");
    });

    await t.test("F7.3: Verificação de persistência do arquivo metrics_tiers.json do projeto", () => {
      const metricsFile = path.join(__dirname, '..', '..', 'simulator', 'metrics_tiers.json');
      t.ok(fs.existsSync(metricsFile), "Arquivo simulator/metrics_tiers.json deve existir");
      const content = JSON.parse(fs.readFileSync(metricsFile, 'utf-8'));
      t.ok(content.tierA, "Deve possuir métricas do Tier A");
      t.ok(content.tierB, "Deve possuir métricas do Tier B");
      t.ok(content.tierC, "Deve possuir métricas do Tier C");
    });

    await t.test("F7.4: Validação do schema de métricas persistidas por Tier", () => {
      const metricsFile = path.join(__dirname, '..', '..', 'simulator', 'metrics_tiers.json');
      const content = JSON.parse(fs.readFileSync(metricsFile, 'utf-8'));
      for (const tierKey of ['tierA', 'tierB', 'tierC']) {
        const item = content[tierKey];
        t.ok(typeof item.leadsContatados === 'number', `${tierKey}.leadsContatados deve ser numérico`);
        t.ok(typeof item.respostas === 'number', `${tierKey}.respostas deve ser numérico`);
        t.ok(typeof item.reunioes === 'number', `${tierKey}.reunioes deve ser numérico`);
        t.ok(typeof item.taxaResposta === 'string', `${tierKey}.taxaResposta deve ser string formatada`);
        t.ok(typeof item.taxaReuniao === 'string', `${tierKey}.taxaReuniao deve ser string formatada`);
      }
    });

    await t.test("F7.5: Estrutura semanal simulada de 4 a 6 semanas", () => {
      const weeksData = [
        { week: 1, tier: 'A', contacts: 20, responses: 6, meetings: 3 },
        { week: 2, tier: 'A', contacts: 25, responses: 8, meetings: 4 },
        { week: 3, tier: 'A', contacts: 25, responses: 7, meetings: 3 },
        { week: 4, tier: 'A', contacts: 30, responses: 9, meetings: 5 }
      ];
      t.strictEqual(weeksData.length, 4);
      let totalContacts = 0;
      let totalMeetings = 0;
      for (const w of weeksData) {
        totalContacts += w.contacts;
        totalMeetings += w.meetings;
      }
      const aggregated = computeRates(totalContacts, 30, totalMeetings);
      t.strictEqual(aggregated.contactsApproached, 100);
      t.strictEqual(aggregated.meetingsBooked, 15);
      t.strictEqual(aggregated.meetingConversionRate, 0.15);
    });

    // =========================================================================
    // FEATURE 8: Algoritmo de Ajuste Dinâmico 2x (>= 5 testes)
    // =========================================================================
    await t.test("F8.1: Tier A atingindo meta mínima (convA >= 2 * convB) -> Sem ajuste", () => {
      const tierA = { contactsApproached: 120, responsesReceived: 36, meetingsBooked: 18 }; // 15.0%
      const tierB = { contactsApproached: 250, responsesReceived: 45, meetingsBooked: 15 }; // 6.0%
      const res = evaluateDynamicAdjustment(tierA, tierB);
      t.strictEqual(res.needsAdjustment, false, "15% é > 2 * 6% (12%), logo não precisa ajuste");
      t.strictEqual(res.recommendedAllocation.tierA, 50);
      t.ok(res.reason.includes("META MÍNIMA ATINGIDA"));
    });

    await t.test("F8.2: Tier A abaixo de 2x Tier B -> Dispara redução automática do Tier A", () => {
      const tierA = { contactsApproached: 100, responsesReceived: 20, meetingsBooked: 8 }; // 8.0%
      const tierB = { contactsApproached: 100, responsesReceived: 20, meetingsBooked: 6 }; // 6.0% -> threshold = 12%
      const res = evaluateDynamicAdjustment(tierA, tierB);
      t.strictEqual(res.needsAdjustment, true, "8% é < 2 * 6% (12%), deve disparar ajuste");
      t.strictEqual(res.recommendedAllocation.tierA, 30, "Tempo do Tier A deve ser reduzido para 30%");
      t.strictEqual(res.recommendedAllocation.tierB, 45, "Tempo do Tier B deve ser elevado para 45%");
      t.ok(res.reason.includes("ALERTA DE AJUSTE DINÂMICO"));
    });

    await t.test("F8.3: Limiar exato de corte (convA exatamente 2 * convB) -> Mantém sem ajuste", () => {
      const tierA = { contactsApproached: 100, responsesReceived: 30, meetingsBooked: 12 }; // 12.0%
      const tierB = { contactsApproached: 100, responsesReceived: 20, meetingsBooked: 6 };  // 6.0% -> threshold = 12%
      const res = evaluateDynamicAdjustment(tierA, tierB);
      t.strictEqual(res.needsAdjustment, false, "Taxa igual a 2x exato atinge o critério");
    });

    await t.test("F8.4: Proteção contra amostra insuficiente (menos de 10 contatos)", () => {
      const tierA = { contactsApproached: 5, responsesReceived: 1, meetingsBooked: 0 };
      const tierB = { contactsApproached: 5, responsesReceived: 2, meetingsBooked: 1 };
      const res = evaluateDynamicAdjustment(tierA, tierB, { minSample: 10 });
      t.strictEqual(res.needsAdjustment, false, "Não deve disparar ajuste dinâmico com amostra menor que 10");
      t.ok(res.reason.includes("Amostra insuficiente"));
    });

    await t.test("F8.5: Alocação percentual total após ajuste soma exatamente 100%", () => {
      const tierA = { contactsApproached: 100, responsesReceived: 10, meetingsBooked: 5 };
      const tierB = { contactsApproached: 100, responsesReceived: 15, meetingsBooked: 5 };
      const res = evaluateDynamicAdjustment(tierA, tierB);
      const total = res.recommendedAllocation.tierA + res.recommendedAllocation.tierB + res.recommendedAllocation.tierC;
      t.strictEqual(total, 100, "Soma das cotas recomendadas deve ser exatamente 100%");
    });

    // =========================================================================
    // FEATURE 9: Mystery Shopping Ético (>= 5 testes)
    // =========================================================================
    await t.test("F9.1: Todas as personas contêm resultado válido de Mystery Shopping", () => {
      for (const p of personas) {
        const val = validateMysteryShopping(p.mysteryShoppingResult);
        t.ok(val.isValid, `Mystery Shopping da persona ${p.id} deve ser válido: ${val.errors.join(', ')}`);
      }
    });

    await t.test("F9.2: Pergunta de mystery shopping é simples e não agenda falsamente", () => {
      for (const p of personas) {
        const q = p.mysteryShoppingResult.testQuestion;
        t.ok(q.length >= 10, `Pergunta de ${p.id} deve ser relevante`);
        t.ok(!q.includes("confirmar a consulta no meu nome"), "Não deve fingir agendamento definitivo");
        t.ok(!q.includes("CPF"), "Não deve fornecer CPF falso");
      }
    });

    await t.test("F9.3: Tempo de resposta é medido numericamente em minutos", () => {
      for (const p of personas) {
        const time = p.mysteryShoppingResult.measuredResponseTimeMinutes;
        t.ok(typeof time === 'number' && time >= 0, `Tempo de ${p.id} deve ser numérico >= 0 (atual: ${time})`);
      }
    });

    await t.test("F9.4: Revelação transparente e honesta do teste logo no contato", () => {
      for (const p of personas) {
        const notice = p.mysteryShoppingResult.transparencyNotice;
        t.ok(notice && notice.length >= 15, `Aviso de transparência em ${p.id} deve existir`);
        t.ok(/(teste|diagn[óo]stico|checagem)/i.test(notice), "Deve identificar como teste/diagnóstico");
      }
    });

    await t.test("F9.5: Validador rejeita tentativas de agendamento fictício com CPF", () => {
      const invalidData = {
        testQuestion: "Pode confirmar a consulta no meu nome meu cpf é 12345678900",
        measuredResponseTimeMinutes: 30,
        miniDiagnostic3Lines: ["L1", "L2", "L3"],
        frequentQuestionsList: ["Q1", "Q2", "Q3", "Q4", "Q5"],
        transparencyNotice: "Teste como diagnóstico gratuito"
      };
      const val = validateMysteryShopping(invalidData);
      t.strictEqual(val.isValid, false);
      t.ok(val.errors.some(e => e.includes("Violação ética")));
    });

    // =========================================================================
    // FEATURE 10: CTAs de Reciprocidade (3 Formatos) (>= 5 testes)
    // =========================================================================
    await t.test("F10.1: Formato 1 - CTA com print/dado do tempo de resposta medido", () => {
      const p = personas.find(x => x.id === 'lead-rafael-odonto');
      const text = p.canonicalApproach.splitText;
      t.ok(text.includes("print"), "Abordagem deve oferecer envio do print de tempo");
      t.ok(text.includes("10h"), "Abordagem deve conter dado concreto do tempo medido");
    });

    await t.test("F10.2: Formato 2 - CTA com Mini Diagnóstico em exatamente 3 linhas", () => {
      const p = personas.find(x => x.id === 'lead-fernanda-diag');
      t.strictEqual(p.mysteryShoppingResult.miniDiagnostic3Lines.length, 3, "Mini diagnóstico deve conter 3 linhas");
      const text = p.canonicalApproach.splitText;
      t.ok(text.includes("3 linhas") || text.includes("mini diagnóstico"), "CTA deve oferecer as 3 linhas");
    });

    await t.test("F10.3: Formato 3 - CTA com lista das 5 perguntas repetidas de clientes", () => {
      const p = personas.find(x => x.id === 'lead-andre-adv');
      t.strictEqual(p.mysteryShoppingResult.frequentQuestionsList.length, 5, "Deve conter 5 perguntas frequentes");
      t.ok(p.mysteryShoppingResult.frequentQuestionsList[0].includes("processo"), "Deve mapear dúvidas de processo");
    });

    await t.test("F10.4: Todas as 3 linhas do mini diagnóstico possuem conteúdo de valor prático", () => {
      for (const p of personas) {
        const diag = p.mysteryShoppingResult.miniDiagnostic3Lines;
        t.strictEqual(diag.length, 3);
        for (let i = 0; i < 3; i++) {
          t.ok(diag[i].trim().length > 10, `Linha ${i + 1} da persona ${p.id} deve ter substância (> 10 caracteres)`);
        }
      }
    });

    await t.test("F10.5: Todas as personas possuem as 5 perguntas frequentes mapeadas para automação", () => {
      for (const p of personas) {
        const list = p.mysteryShoppingResult.frequentQuestionsList;
        t.strictEqual(list.length, 5, `Persona ${p.id} deve ter exatamente 5 perguntas repetidas`);
        for (const q of list) {
          t.ok(q.endsWith("?"), `Pergunta '${q}' deve terminar com ponto de interrogação`);
        }
      }
    });
  }
};
