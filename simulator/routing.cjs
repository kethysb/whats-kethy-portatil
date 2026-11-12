/**
 * Roteador de gargalo (Super Tier) + auditoria de mensagens.
 *
 * Ideia: a pergunta do D+0 depende do que a análise do site/anúncio encontra.
 * O diagnóstico é DETERMINÍSTICO (regras auditáveis) e sempre devolve:
 *   - tipo do gargalo, nível de confiança, evidências e ação recomendada.
 * Se a confiança for baixa, cai na abordagem padrão com revisão humana.
 *
 * NOTA: os `siteSignals` dos leads do simulador são DADOS FICTÍCIOS de demonstração.
 * Em produção precisam vir de evidência real (print/trecho verificado).
 */

// O que fazer quando o problema é o SITE (e não o atendimento). Troque via env SITE_POLICY.
const SITE_POLICIES = {
  honest_close:
    "Se o lead concordar que o gargalo é o site, seja honesta: diga que automação de atendimento não resolve isso agora, agradeça e encerre sem insistir, deixando o contato.",
  partner:
    "Se o lead concordar que o gargalo é o site, indique que existe parceiro de confiança para site/landing page e ofereça retomar o assunto do atendimento depois que o site estiver ajustado.",
  integrated:
    "Se o lead concordar que o gargalo é o site, ofereça a solução integrada da KethyTech: página simples com botão de WhatsApp já conectada à automação de atendimento."
};
const SITE_POLICY = SITE_POLICIES[process.env.SITE_POLICY] ? process.env.SITE_POLICY : 'honest_close';

function diagnose(lead) {
  const s = lead.siteSignals || {};
  const evidence = [];

  if (!s.scanConfidence || s.scanConfidence === 'baixa') {
    return {
      type: 'indefinido',
      label: 'Diagnóstico incerto',
      confidence: 'baixa',
      action: 'usar_padrao_com_revisao_humana',
      evidence: [s.evidenceNote || 'Sem evidência suficiente para diagnosticar'],
      reason: 'Confiança baixa: usa a abordagem padrão e pede revisão humana antes de enviar.'
    };
  }

  if (s.hasChatbot && s.onlineScheduling) {
    return {
      type: 'ja_resolvido',
      label: 'Já resolvido',
      confidence: s.scanConfidence,
      action: 'nao_enviar',
      evidence: ['Já tem chat/bot e agendamento online'],
      reason: 'Oferecer automação de atendimento seria irrelevante. Só abordar se houver outro gancho.'
    };
  }

  if (s.adLandsOn === 'home') {
    evidence.push(s.siteObservation || 'Anúncio leva para a página inicial, não para o WhatsApp');
    return {
      type: 'landing_anuncio',
      label: 'Gargalo no anúncio/landing page',
      confidence: s.scanConfidence,
      action: 'enviar_roteada',
      evidence,
      reason: 'O dinheiro do anúncio se perde antes do atendimento. A pergunta muda para o caminho do clique.'
    };
  }

  if (!s.hasWhatsappButton && !s.onlineScheduling) {
    evidence.push(s.siteObservation || 'Site sem botão de WhatsApp nem agenda online');
    return {
      type: 'site_conversao',
      label: 'Gargalo no site (conversão)',
      confidence: s.scanConfidence,
      action: 'enviar_roteada',
      evidence,
      reason: 'Bot de WhatsApp não ajuda se o visitante do site não chega até ele.',
      sitePolicy: SITE_POLICY
    };
  }

  if (s.closesAt18 || s.reviewsMentionDelay || s.whatsappManual) {
    if (s.closesAt18) evidence.push('Atendimento encerra às 18h');
    if (s.reviewsMentionDelay) evidence.push('Avaliações citam demora de resposta');
    if (s.whatsappManual) evidence.push('Contato/agendamento é manual pelo WhatsApp');
    if (s.evidenceNote) evidence.push(s.evidenceNote);
    return {
      type: 'atendimento',
      label: 'Gargalo no atendimento',
      confidence: s.scanConfidence,
      action: 'enviar_padrao',
      evidence,
      reason: 'O visitante chega ao WhatsApp, mas a resposta é lenta ou manual. É o caso da automação.'
    };
  }

  return {
    type: 'sem_encaixe',
    label: 'Sem encaixe claro',
    confidence: s.scanConfidence,
    action: 'nao_enviar',
    evidence: ['Nenhum gargalo verificável encontrado'],
    reason: 'Sem sinal concreto, não vale gastar o contato.'
  };
}

// Monta o par de balões do D+0 conforme o diagnóstico.
function buildRoutedMessages(lead, dx) {
  const s = lead.siteSignals || {};
  if (dx.action === 'nao_enviar') return null;
  if (dx.type === 'atendimento' || dx.action === 'usar_padrao_com_revisao_humana') {
    return lead.cadence.d0_oferta;
  }
  const intro = `${lead.greet}, aqui é a Kethely, da KethyTech (automação de atendimento).`;
  if (dx.type === 'site_conversao') {
    return [
      `${intro} Entrei no site da ${lead.company} pra agendar: ${s.siteObservation}.`,
      `Peguei seu contato ${lead.originShort}. Em quantos cliques quem chega pelo site fala com vocês? Posso te mandar o print do caminho?`
    ];
  }
  if (dx.type === 'landing_anuncio') {
    return [
      `${intro} Abri o anúncio ${s.adDesc} da ${lead.company}: ${s.siteObservation}.`,
      `Peguei seu contato ${lead.originShort}. Vocês medem quantos desses cliques viram conversa? Posso te mandar o print do caminho?`
    ];
  }
  return lead.cadence.d0_oferta;
}

const countWords = t => String(t).trim().split(/\s+/).filter(Boolean).length;

// Auditoria das mensagens reais do simulador (não só das canônicas).
function auditLead(lead, wordCap = 55) {
  const issues = [];
  const check = (stepName, pair, opts = {}) => {
    if (!Array.isArray(pair) || pair.length !== 2) {
      issues.push(`${stepName}: precisa ter exatamente 2 balões`);
      return;
    }
    const total = pair.reduce((a, t) => a + countWords(t), 0);
    if (opts.cap && total > opts.cap) issues.push(`${stepName}: ${total} palavras (limite ${opts.cap})`);
    pair.forEach(t => {
      if (/\[[^\]]+\]|\{[^}]+\}/.test(t)) issues.push(`${stepName}: placeholder`);
      if (/prioridade/i.test(t)) issues.push(`${stepName}: usa "prioridade" (convida o "não")`);
      if (/\d+\s?%/.test(t)) issues.push(`${stepName}: percentual sem fonte`);
      if (/parceir|estudos?\b|clientes que atendemos|que atendemos/i.test(t)) issues.push(`${stepName}: alegação sem lastro (parceiros/estudos/clientes)`);
      if (/100\s?%\s*(dentro|adequad|conforme)/i.test(t)) issues.push(`${stepName}: promessa de conformidade`);
    });
  };
  check('d0_oferta', lead.cadence.d0_oferta, { cap: wordCap });
  check('d0_pergunta', lead.cadence.d0_pergunta, { cap: wordCap });
  check('d4_valor', lead.cadence.d4_valor, { cap: 60 });
  check('d12_breakup', lead.cadence.d12_breakup, { cap: 45 });
  check('deliverable', lead.deliverableText, { cap: 75 });

  const dx = diagnose(lead);
  const routed = buildRoutedMessages(lead, dx);
  if (routed) check('d0_roteada', routed, { cap: wordCap });
  return { leadId: lead.id, ok: issues.length === 0, issues, diagnosis: dx.type };
}

module.exports = { diagnose, buildRoutedMessages, auditLead, countWords, SITE_POLICY, SITE_POLICIES };
