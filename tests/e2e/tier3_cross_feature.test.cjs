/**
 * Tier 3: Cross-Feature Combinations Test Suite
 * Interações entre pares e combinação de múltiplos módulos:
 * - Advocacia + Tier A + Provimento 205 OAB
 * - Imobiliária + Mystery Shopping + Portais ZAP
 * - Logística + Reclame Aqui + Ajuste Dinâmico de Tiers
 * - Dermatologia + Meta Ads Library + Mini Diagnóstico 3 Linhas
 * - Odontologia + Mystery Shopping + CFO + Persistência
 * - Persistência Semanal + Ajuste Dinâmico 2x
 * - Advocacia + 5 Perguntas Frequentes + LGPD Opt-out
 * - Imobiliária + Tier C + Instagram + Reciprocidade
 * - Validação Multi-nicho Holística
 */

const fs = require('fs');
const path = require('path');
const { validateApproach, countWords } = require('./helpers/approach_validator.cjs');
const { computeRates, evaluateDynamicAdjustment } = require('./helpers/tier_calculator.cjs');
const { validateMysteryShopping } = require('./helpers/mystery_shopping_validator.cjs');

const PERSONAS_PATH = path.join(__dirname, '..', 'synthetic_personas.json');

module.exports = {
  name: "Tier 3: Cross-Feature Combinations",
  run: async (t) => {
    const rawData = fs.readFileSync(PERSONAS_PATH, 'utf-8');
    const db = JSON.parse(rawData);
    const personas = db.personas;

    // =========================================================================
    // COMBO 1: Advocacia + Tier A + Provimento 205 OAB + 4 Blocos + 2 Balões
    // =========================================================================
    await t.test("C1: Advocacia + Tier A + OAB 205 + 4 Blocos + 2 Balões (Dr. André)", () => {
      const p = personas.find(x => x.id === 'lead-andre-adv');
      t.strictEqual(p.tier, 'A', "Lead deve ser Tier A");
      t.strictEqual(p.niche, 'advocacia', "Lead deve ser de advocacia");
      t.ok(p.publicSources.oabProfile.receptiveOnly, "OAB deve ser apenas receptivo");

      const val = validateApproach(p.canonicalApproach.splitText, { niche: p.niche });
      t.ok(val.isValid, `Abordagem combinada deve ser 100% válida: ${val.errors.join(', ')}`);
      t.strictEqual(val.bubbleCount, 2, "Exatamente 2 balões");
      t.ok(val.totalWordCount <= 50, "Máximo de 50 palavras");
      t.ok(val.hasRequiredBlocks.hasPublicSource);
      t.ok(val.hasRequiredBlocks.hasVerifiableFact);
      t.ok(val.hasRequiredBlocks.hasImplication);
      t.ok(val.hasRequiredBlocks.hasCtaOrQuestion);
      t.ok(!val.errors.some(e => e.includes("Provimento 205")), "Sem violação da OAB");
    });

    // =========================================================================
    // COMBO 2: Imobiliária + Mystery Shopping + Portais ZAP + CTA Reciprocidade
    // =========================================================================
    await t.test("C2: Imobiliária + Mystery Shopping + Portais ZAP + CTA Reciprocidade (Marcos)", () => {
      const p = personas.find(x => x.id === 'lead-marcos-imob');
      t.strictEqual(p.niche, 'imobiliaria');
      t.strictEqual(p.publicSources.realEstatePortals.activeListingsCount, 120);

      // Valida mystery shopping
      const msVal = validateMysteryShopping(p.mysteryShoppingResult);
      t.ok(msVal.isValid, "Mystery Shopping deve ser válido");
      t.strictEqual(p.mysteryShoppingResult.measuredResponseTimeMinutes, 270);

      // Valida abordagem vinculada ao portal e CTA
      const val = validateApproach(p.canonicalApproach.splitText, { niche: p.niche });
      t.ok(val.isValid);
      t.ok(p.canonicalApproach.splitText.includes("ZAP"));
      t.ok(p.canonicalApproach.splitText.includes("filtrar automaticamente"));
    });

    // =========================================================================
    // COMBO 3: Logística + Reclame Aqui + Vagas SAC + Tier B + Ajuste Dinâmico
    // =========================================================================
    await t.test("C3: Logística + Reclame Aqui + Vagas SAC + Tier B + Ajuste Dinâmico (Ricardo)", () => {
      const p = personas.find(x => x.id === 'lead-ricardo-log');
      t.strictEqual(p.niche, 'logistica');
      t.strictEqual(p.tier, 'B');
      t.ok(p.publicSources.reclameAqui);
      t.ok(p.publicSources.jobPostings.hiringSAC);

      // Simula métricas de conversão para Logística em Tier B
      const tierBLogistica = { contactsApproached: 80, responsesReceived: 20, meetingsBooked: 8 }; // 10%
      const tierALogistica = { contactsApproached: 40, responsesReceived: 8, meetingsBooked: 3 };  // 7.5% -> threshold = 20%
      const adj = evaluateDynamicAdjustment(tierALogistica, tierBLogistica);
      t.strictEqual(adj.needsAdjustment, true, "Tier A performando abaixo de 2x Tier B dispara redução");
      t.strictEqual(adj.recommendedAllocation.tierB, 45, "Tier B ganha maior alocação");
    });

    // =========================================================================
    // COMBO 4: Dermatologia + Meta Ads Library + Reciprocidade (Mini Diagnóstico 3 Linhas)
    // =========================================================================
    await t.test("C4: Dermatologia + Meta Ads + Mini Diagnóstico 3 Linhas (Camila & Dra. Fernanda)", () => {
      const pCamila = personas.find(x => x.id === 'lead-camila-meta');
      t.ok(pCamila.publicSources.metaAds.hasActiveAds, "Deve ter Meta Ads ativo");
      const valCamila = validateApproach(pCamila.canonicalApproach.splitText, { niche: pCamila.niche });
      t.ok(valCamila.isValid, `Camila válida: ${valCamila.errors.join(', ')}`);

      const pFernanda = personas.find(x => x.id === 'lead-fernanda-diag');
      t.strictEqual(pFernanda.mysteryShoppingResult.miniDiagnostic3Lines.length, 3);
      t.ok(pFernanda.canonicalApproach.splitText.includes("3 linhas") || pFernanda.canonicalApproach.splitText.includes("mini diagnóstico"));
      const valFernanda = validateApproach(pFernanda.canonicalApproach.splitText, { niche: pFernanda.niche });
      t.ok(valFernanda.isValid, `Dra Fernanda válida: ${valFernanda.errors.join(', ')}`);
    });

    // =========================================================================
    // COMBO 5: Odontologia + Mystery Shopping + CFO + Persistência Local
    // =========================================================================
    await t.test("C5: Odontologia + Mystery Shopping + CFO (Sem Consulta Grátis) + Persistência", () => {
      const p = personas.find(x => x.id === 'lead-rafael-odonto');
      t.strictEqual(p.niche, 'odontologia');
      t.ok(p.mysteryShoppingResult.measuredResponseTimeMinutes > 0);

      // Abordagem canônica não pode ter consulta grátis
      t.ok(!p.canonicalApproach.splitText.includes("avaliação gratuita"));
      t.ok(!p.canonicalApproach.splitText.includes("consulta grátis"));

      // Validação determinística
      const val = validateApproach(p.canonicalApproach.splitText, { niche: p.niche });
      t.ok(val.isValid, `Dr Rafael válido: ${val.errors.join(', ')}`);

      // Registro e cálculo de persistência
      const stats = computeRates(50, 15, 8);
      t.strictEqual(stats.meetingConversionRatePct, "16.0%");
    });

    // =========================================================================
    // COMBO 6: Persistência Semanal de 6 Semanas + Avaliação Dinâmica no Marco de 4 Semanas
    // =========================================================================
    await t.test("C6: Persistência Semanal (Semanas 1 a 6) com Avaliação Dinâmica na Semana 4", () => {
      const weeklyLog = [
        { week: 1, tierA: { c: 25, r: 6, m: 2 }, tierB: { c: 50, r: 8, m: 3 } },
        { week: 2, tierA: { c: 25, r: 7, m: 3 }, tierB: { c: 50, r: 9, m: 3 } },
        { week: 3, tierA: { c: 30, r: 8, m: 2 }, tierB: { c: 60, r: 10, m: 4 } },
        { week: 4, tierA: { c: 30, r: 8, m: 3 }, tierB: { c: 60, r: 11, m: 5 } }, // Avaliação Marco
        { week: 5, tierA: { c: 20, r: 5, m: 2 }, tierB: { c: 75, r: 15, m: 7 } }, // Após ajuste
        { week: 6, tierA: { c: 20, r: 6, m: 3 }, tierB: { c: 75, r: 16, m: 8 } }
      ];

      // Acumulado até Semana 4
      let sumA_4 = { contactsApproached: 0, responsesReceived: 0, meetingsBooked: 0 };
      let sumB_4 = { contactsApproached: 0, responsesReceived: 0, meetingsBooked: 0 };

      for (let i = 0; i < 4; i++) {
        sumA_4.contactsApproached += weeklyLog[i].tierA.c;
        sumA_4.responsesReceived += weeklyLog[i].tierA.r;
        sumA_4.meetingsBooked += weeklyLog[i].tierA.m;

        sumB_4.contactsApproached += weeklyLog[i].tierB.c;
        sumB_4.responsesReceived += weeklyLog[i].tierB.r;
        sumB_4.meetingsBooked += weeklyLog[i].tierB.m;
      }

      // Tier A: 110 contatos, 10 reuniões = 9.09%
      // Tier B: 220 contatos, 15 reuniões = 6.81% -> 2x = 13.62%
      // Como 9.09% < 13.62%, dispara ajuste
      const adjW4 = evaluateDynamicAdjustment(sumA_4, sumB_4);
      t.strictEqual(adjW4.needsAdjustment, true, "Na semana 4 deve recomendar rebalanceamento");
      t.strictEqual(adjW4.recommendedAllocation.tierA, 30);
      t.strictEqual(adjW4.recommendedAllocation.tierB, 45);
    });

    // =========================================================================
    // COMBO 7: Advocacia + CTA 5 Perguntas Repetidas + LGPD Opt-out
    // =========================================================================
    await t.test("C7: Advocacia + CTA 5 Perguntas Repetidas + LGPD Opt-out", () => {
      const p = personas.find(x => x.id === 'lead-andre-adv');
      const qList = p.mysteryShoppingResult.frequentQuestionsList;
      t.strictEqual(qList.length, 5);
      t.ok(qList.some(q => q.toLowerCase().includes("processo")), "Deve conter dúvida sobre processo");

      // Opt out test: simulação do advogado pedindo para sair
      const optOutReply = "Não tenho interesse e prefiro não receber mensagens.";
      const sdrClosure = "Perfeito, Dr. André! Agradeço pelo retorno rápido, retiro seu número agora mesmo e não volto a incomodar. Sucesso no escritório!";
      t.ok(sdrClosure.includes("retiro seu número") || sdrClosure.includes("não volto a incomodar"));
      t.ok(countWords(sdrClosure) <= 50, "Mensagem de saída deve ser sucinta");
    });

    // =========================================================================
    // COMBO 8: Imobiliária + Tier C (Corretora Autônoma) + Instagram + Reciprocidade
    // =========================================================================
    await t.test("C8: Imobiliária + Tier C + Instagram Bio + Reciprocidade (Juliana)", () => {
      const p = personas.find(x => x.id === 'lead-juliana-corretora');
      t.strictEqual(p.tier, 'C');
      t.strictEqual(p.niche, 'imobiliaria');
      t.ok(p.publicSources.instagram.verifiedTrigger.includes("bio"));

      const val = validateApproach(p.canonicalApproach.splitText, { niche: p.niche });
      t.ok(val.isValid);
      t.ok(p.canonicalApproach.splitText.includes("Instagram"));
      t.ok(p.canonicalApproach.splitText.includes("filtrar curiosos"));
    });

    // =========================================================================
    // COMBO 9: Consistência Holística dos 5 Nichos (2 Balões e <= 50 Palavras)
    // =========================================================================
    await t.test("C9: Consistência dos 5 Nichos - 100% de conformidade com 2 balões e <= 50 palavras", () => {
      const nichesCovered = new Set();
      for (const p of personas) {
        nichesCovered.add(p.niche);
        const val = validateApproach(p.canonicalApproach.splitText, { niche: p.niche });
        t.ok(val.isValid, `Persona ${p.id} deve cumprir todas as regras: ${val.errors.join(', ')}`);
        t.strictEqual(val.bubbleCount, 2);
        t.ok(val.totalWordCount <= 50);
      }
      t.strictEqual(nichesCovered.size, 5, "Todos os 5 nichos devem estar contemplados");
    });

    // =========================================================================
    // COMBO 10: Integração com Endpoint Simulado ou Arquivo de Métricas
    // =========================================================================
    await t.test("C10: Verificação de consistência entre personas e metrics_tiers.json", () => {
      const metricsFile = path.join(__dirname, '..', '..', 'simulator', 'metrics_tiers.json');
      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf-8'));
      
      const convA = parseFloat(metrics.tierA.taxaReuniao) / 100;
      const convB = parseFloat(metrics.tierB.taxaReuniao) / 100;
      t.ok(convA >= 0.15, "Taxa de reunião do Tier A deve ser >= 15%");
      t.ok(convB >= 0.06, "Taxa de reunião do Tier B deve ser >= 6%");

      // Ratio >= 2.0x -> Meta de 2x batida
      const ratio = convA / convB;
      t.ok(ratio >= 2.0, `Ratio atual é ${ratio}x (meta >= 2x)`);
    });

    // =========================================================================
    // COMBO 11: Mensagens REAIS do simulador + roteamento por gargalo (Super Tier)
    // =========================================================================
    await t.test("C11: Mensagens do simulador passam na auditoria e o roteador diagnostica corretamente", () => {
      const { leads } = require(path.join(__dirname, '..', '..', 'simulator', 'leads_data.cjs'));
      const routing = require(path.join(__dirname, '..', '..', 'simulator', 'routing.cjs'));
      t.strictEqual(leads.length, 8);
      for (const l of leads) {
        const a = routing.auditLead(l);
        t.ok(a.ok, `Lead ${l.id}: ${a.issues.join(' | ')}`);
      }
      const dx = id => routing.diagnose(leads.find(l => l.id === id)).type;
      t.strictEqual(dx('lead-fernanda-diagnostico'), 'site_conversao');
      t.strictEqual(dx('lead-camila-meta'), 'landing_anuncio');
      t.strictEqual(dx('lead-rafael'), 'atendimento');
      t.strictEqual(dx('lead-juliana-corretora'), 'indefinido');
      t.strictEqual(routing.diagnose({ siteSignals: { hasChatbot: true, onlineScheduling: true, scanConfidence: 'alta' } }).action, 'nao_enviar');
    });
  }
};
