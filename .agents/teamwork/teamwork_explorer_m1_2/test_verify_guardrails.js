// Simulação e teste de guardrails regulatórios e templates

const prohibitedTermsByNiche = {
  dermatologia: ['avaliação gratuita', 'consulta grátis', 'promoção', 'desconto', 'antes e depois', 'rejuvenescimento garantido', 'fique mais jovem', 'captar pacientes'],
  odontologia: ['avaliação gratuita', 'consulta grátis', 'avaliação sem custo', 'orçamento grátis', 'promoção relâmpago', 'desconto em implante', 'atrair mais clientes de odonto'],
  imobiliaria: ['base de clientes comprada', 'dados de proprietários vazados', 'disparo em massa para proprietários'],
  advocacia: ['captar clientes', 'atrair clientes', 'prospectar clientes', 'aumentar carteira de clientes', 'ganhar ações judiciais', 'causa ganha', 'consulta grátis', 'atrair mais clientes'],
  logistica: ['prometer entrega sem estoque', 'omitir prazos reais']
};

function checkCompliance(niche, text) {
  const prohibited = prohibitedTermsByNiche[niche] || [];
  const normalized = text.toLowerCase();
  const violations = [];
  for (const term of prohibited) {
    if (normalized.includes(term.toLowerCase())) {
      violations.push(term);
    }
  }
  return { compliant: violations.length === 0, violations };
}

// 1. Testar se detecta violações reais
console.log('--- TESTE 1: DETECÇÃO DE VIOLAÇÕES ---');
const testCfmViolation = checkCompliance('dermatologia', 'Venha fazer uma avaliação gratuita e veja fotos de antes e depois dos nossos pacientes de botox.');
console.log('CFM Violations detectadas:', testCfmViolation.violations, 'Compliant?', testCfmViolation.compliant);

const testCfoViolation = checkCompliance('odontologia', 'Agende sua consulta grátis para colocar implante dentário com desconto.');
console.log('CFO Violations detectadas:', testCfoViolation.violations, 'Compliant?', testCfoViolation.compliant);

const testOabViolation = checkCompliance('advocacia', 'Nosso robô vai captar clientes e prospectar clientes para ações trabalhistas do seu escritório.');
console.log('OAB Violations detectadas:', testOabViolation.violations, 'Compliant?', testOabViolation.compliant);

// 2. Testar se nossos templates oficiais estão 100% compliant
console.log('\n--- TESTE 2: TEMPLATES OFICIAIS SÃO 100% COMPLIANT? ---');
const officialTemplates = [
  { niche: 'dermatologia', text: 'Oi, Dra. Paula! Sou a Kethely de SP. Vi no Google que 3 das últimas avaliações citam demora para responder no WhatsApp. A recepção costuma dividir agenda e mensagens. Faz sentido te mandar em 2 linhas como resolvemos isso em clínicas? Se não for prioridade, só avisar.' },
  { niche: 'dermatologia', text: 'Oi, Dra. Paula! Sou a Kethely de SP. Vi na Biblioteca da Meta anúncios ativos de procedimentos levando pro WhatsApp da clínica. Quando o lead espera, ele esfria rápido. Faz sentido te mandar em 2 linhas como responder em segundos? Se não for prioridade, só me avisar.' },
  { niche: 'odontologia', text: 'Oi, Dr. Rafael! Sou a Kethely de SP. Achei o consultório no Google e vi que fazem tratamentos de implantes e alinhadores. Muitos consultórios perdem tempo com curiosos na recepção. Faz sentido te mandar em 2 linhas como pré-qualificar antes da consulta? Se não for o momento, me avisa.' },
  { niche: 'odontologia', text: 'Oi, Dr. Rafael! Sou a Kethely de SP. Vi no Doctoralia que a clínica tem agenda concorrida e encerra às 19h. Pacientes que pesquisam à noite fecham com quem responde primeiro. Posso mandar em 2 linhas como evitar faltas na cadeira? Se não for o momento, sem problemas.' },
  { niche: 'imobiliaria', text: 'Oi, Marcos! Sou a Kethely de SP. Vi no ZAP mais de 100 imóveis ativos direcionando pro WhatsApp. Lead de portal esfria rápido enquanto o corretor faz visitas. Faz sentido te mandar em 2 linhas como pré-qualificar a renda antes? Se não for prioridade, só falar.' },
  { niche: 'imobiliaria', text: 'Oi, Marcos! Sou a Kethely de SP. Vi anúncios ativos dos seus lançamentos no Meta Ads levando direto pro WhatsApp. Corretores perdem metade do dia atendendo contatos sem perfil. Faz sentido te mandar em 2 linhas como filtrar antes da visita? Se não for prioridade, sem problema.' },
  { niche: 'advocacia', text: 'Oi, Dr. André! Sou a Kethely de SP. Vi no site do escritório o atendimento receptivo via WhatsApp. Advogados perdem horas na triagem de novos casos. Faz sentido te mandar em 2 linhas como organizar isso pela OAB 205? Se não for prioridade, só avisar.' },
  { niche: 'advocacia', text: 'Oi, Dr. André! Sou a Kethely de SP. Vi no site que os contatos caem no WhatsApp da equipe. Dúvidas de processo tiram o foco dos sócios. Faz sentido te mostrar em 2 linhas como organizar a triagem receptiva pela OAB? Se não for o momento, só falar.' },
  { niche: 'logistica', text: 'Oi, Ricardo! Sou a Kethely de SP. Vi no LinkedIn a vaga de SAC da transportadora e reclamações de rastreio. O "onde está minha entrega?" costuma lotar o WhatsApp. Faz sentido te mandar em 2 linhas como automatizar esse rastreio? Se não for prioridade, só falar.' },
  { niche: 'logistica', text: 'Oi, Ricardo! Sou a Kethely de SP. Vi no Reclame Aqui que a maioria das dúvidas é sobre status de frete. Dúvidas repetitivas de rastreamento sobrecarregam o atendimento diário. Faz sentido te mandar em 2 linhas como resolver isso no WhatsApp? Se não for o momento, só me avisar.' }
];

let allCompliant = true;
officialTemplates.forEach((t, idx) => {
  const result = checkCompliance(t.niche, t.text);
  if (!result.compliant) {
    allCompliant = false;
    console.error(`Falha no template [${idx + 1}] (${t.niche}):`, result.violations);
  } else {
    console.log(`Template [${idx + 1}] (${t.niche}): COMPLIANT ✅`);
  }
});

console.log(`\nResultado da Conformidade Ético-Regulatória: ${allCompliant ? '100% COMPLIANT ✅' : 'FALHA ❌'}`);
