const templates = [
  {
    niche: 'dermatologia',
    variant: 'google_reviews',
    b1: 'Oi, Dra. Paula! Sou a Kethely de SP. Vi no Google que 3 das últimas avaliações citam demora para responder no WhatsApp.',
    b2: 'A recepção costuma dividir agenda e mensagens. Faz sentido te mandar em 2 linhas como resolvemos isso em clínicas? Se não for prioridade, só avisar.'
  },
  {
    niche: 'dermatologia',
    variant: 'meta_ads_botox',
    b1: 'Oi, Dra. Paula! Sou a Kethely de SP. Vi na Biblioteca da Meta anúncios ativos de procedimentos levando pro WhatsApp da clínica.',
    b2: 'Quando o lead espera, ele esfria rápido. Faz sentido te mandar em 2 linhas como responder em segundos? Se não for prioridade, só me avisar.'
  },
  {
    niche: 'odontologia',
    variant: 'google_implants',
    b1: 'Oi, Dr. Rafael! Sou a Kethely de SP. Achei o consultório no Google e vi que fazem tratamentos de implantes e alinhadores.',
    b2: 'Muitos consultórios perdem tempo com curiosos na recepção. Faz sentido te mandar em 2 linhas como pré-qualificar antes da consulta? Se não for o momento, me avisa.'
  },
  {
    niche: 'odontologia',
    variant: 'no_show_doctoralia',
    b1: 'Oi, Dr. Rafael! Sou a Kethely de SP. Vi no Doctoralia que a clínica tem agenda concorrida e encerra às 19h.',
    b2: 'Pacientes que pesquisam à noite fecham com quem responde primeiro. Posso mandar em 2 linhas como evitar faltas na cadeira? Se não for o momento, sem problemas.'
  },
  {
    niche: 'imobiliaria',
    variant: 'zap_portal',
    b1: 'Oi, Marcos! Sou a Kethely de SP. Vi no ZAP mais de 100 imóveis ativos direcionando pro WhatsApp.',
    b2: 'Lead de portal esfria rápido enquanto o corretor faz visitas. Faz sentido te mandar em 2 linhas como pré-qualificar a renda antes? Se não for prioridade, só falar.'
  },
  {
    niche: 'imobiliaria',
    variant: 'meta_ads_launch',
    b1: 'Oi, Marcos! Sou a Kethely de SP. Vi anúncios ativos dos seus lançamentos no Meta Ads levando direto pro WhatsApp.',
    b2: 'Corretores perdem metade do dia atendendo contatos sem perfil. Faz sentido te mandar em 2 linhas como filtrar antes da visita? Se não for prioridade, sem problema.'
  },
  {
    niche: 'advocacia',
    variant: 'oab_receptive_site',
    b1: 'Oi, Dr. André! Sou a Kethely de SP. Vi no site do escritório o atendimento receptivo via WhatsApp.',
    b2: 'Advogados perdem horas na triagem de novos casos. Faz sentido te mandar em 2 linhas como organizar isso pela OAB 205? Se não for prioridade, só avisar.'
  },
  {
    niche: 'advocacia',
    variant: 'oab_process_status',
    b1: 'Oi, Dr. André! Sou a Kethely de SP. Vi no site que os contatos caem no WhatsApp da equipe.',
    b2: 'Dúvidas de processo tiram o foco dos sócios. Faz sentido te mostrar em 2 linhas como organizar a triagem receptiva pela OAB? Se não for o momento, só falar.'
  },
  {
    niche: 'logistica',
    variant: 'sac_job_linkedin',
    b1: 'Oi, Ricardo! Sou a Kethely de SP. Vi no LinkedIn a vaga de SAC da transportadora e reclamações de rastreio.',
    b2: 'O "onde está minha entrega?" costuma lotar o WhatsApp. Faz sentido te mandar em 2 linhas como automatizar esse rastreio? Se não for prioridade, só falar.'
  },
  {
    niche: 'logistica',
    variant: 'reclame_aqui_tracking',
    b1: 'Oi, Ricardo! Sou a Kethely de SP. Vi no Reclame Aqui que a maioria das dúvidas é sobre status de frete.',
    b2: 'Dúvidas repetitivas de rastreamento sobrecarregam o atendimento diário. Faz sentido te mandar em 2 linhas como resolver isso no WhatsApp? Se não for o momento, só me avisar.'
  }
];

console.log('=== TESTE DE TEMPLATES E CONTAGEM DE PALAVRAS ===\n');
let allPassed = true;

templates.forEach((t, i) => {
  const full = `${t.b1} ---SPLIT--- ${t.b2}`;
  const splitChunks = full.split('---SPLIT---');
  const bubbleCount = splitChunks.length;
  const words = full.replace(/---SPLIT---/g, ' ').trim().split(/\s+/).filter(Boolean);
  const b1Words = t.b1.trim().split(/\s+/).filter(Boolean).length;
  const b2Words = t.b2.trim().split(/\s+/).filter(Boolean).length;
  const isBubbleCountValid = bubbleCount === 2;
  const isWordCountValid = words.length <= 50;

  if (!isBubbleCountValid || !isWordCountValid) {
    allPassed = false;
  }

  console.log(`[${i + 1}] Nicho: ${t.niche} (${t.variant})`);
  console.log(`    Balões: ${bubbleCount} (Válido: ${isBubbleCountValid})`);
  console.log(`    Palavras: ${words.length} (B1: ${b1Words}, B2: ${b2Words}) <= 50: ${isWordCountValid}`);
  console.log(`    B1: "${t.b1}"`);
  console.log(`    B2: "${t.b2}"\n`);
});

console.log(`Resultado Geral: ${allPassed ? 'TODOS PASSARAM COM SUCESSO! ✅' : 'FALHA EM TEMPLATES! ❌'}`);
