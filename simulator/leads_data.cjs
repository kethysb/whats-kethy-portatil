// Leads de DEMONSTRAÇÃO (personas fictícias). Fatos, horários e siteSignals são simulados.
// Em produção, cada fato precisa vir de evidência real verificada (print/trecho/link).
const leads = [
  {
    id: "lead-rafael",
    name: "Dr. Rafael — OdontoPrime",
    greet: "Dr. Rafael",
    originShort: "no seu perfil do Google",
    company: "Clínica OdontoPrime",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80",
    role: "Cirurgião-Dentista & Diretor (OdontoPrime)",
    tier: "Tier A",
    sourceType: "Mystery Shopping no WhatsApp (Google)",
    contactOrigin: "Número público no perfil da OdontoPrime no Google",
    trigger: "Pergunta enviada ontem às 19h12 sobre avaliação; respondida hoje às 10h04",
    siteSignals: { hasWhatsappButton: true, hasChatbot: false, onlineScheduling: false, adLandsOn: 'none', closesAt18: true, reviewsMentionDelay: false, whatsappManual: true, scanConfidence: 'alta', evidenceNote: 'Teste real: 19h12 → 10h04' },
    deliverableText: [
      "Dr. Rafael, o teste: ontem às 19h12 perguntei 'Vocês atendem avaliação aos sábados?' no WhatsApp da OdontoPrime. A resposta veio hoje às 10h04, quase 15h depois.",
      "Duas ideias: resposta imediata à noite já perguntando o procedimento, e confirmação SIM/NÃO 24h antes pra reduzir falta. Quer ver como fica no celular, em 1 minuto?"
    ],
    cadence: {
      d0_oferta: [
        "Dr. Rafael, aqui é a Kethely, da KethyTech (automação de atendimento). Ontem às 19h12 mandei uma dúvida de avaliação no WhatsApp da OdontoPrime. A resposta veio hoje às 10h04.",
        "Peguei o número no seu perfil do Google. Posso te mandar o print do teste? Se não fizer sentido, só avisar."
      ],
      d0_pergunta: [
        "Dr. Rafael, aqui é a Kethely, da KethyTech (automação de atendimento). Peguei seu número no perfil da OdontoPrime no Google e vi que o atendimento encerra às 18h.",
        "Paciente de implante que chama à noite tende a fechar com quem responde primeiro. Faz sentido conversarmos sobre isso? Se não, só avisar."
      ],
      d4_valor: [
        "Dr. Rafael, um detalhe do teste de ontem: a resposta de hoje não perguntou o procedimento nem ofereceu horário, então o paciente teria que escrever de novo.",
        "Montei uma resposta curta que já pergunta o procedimento e oferece 2 horários. Posso te mandar?"
      ],
      d12_breakup: [
        "Dr. Rafael, vou parar de escrever por aqui.",
        "Se um dia o atendimento noturno da OdontoPrime entrar na pauta, o print do teste continua guardado. É só pedir."
      ]
    },
    messages: []
  },
  {
    id: "lead-marcos-zap",
    name: "Marcos — Silva Imóveis",
    greet: "Marcos",
    originShort: "no anúncio do ZAP",
    company: "Silva Imóveis",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    role: "Sócio-Diretor da Silva Imóveis",
    tier: "Tier A",
    sourceType: "Mystery Shopping em Anúncio do ZAP",
    contactOrigin: "Número do botão de WhatsApp no anúncio da Silva Imóveis no ZAP",
    trigger: "120 imóveis ativos no ZAP + teste real de resposta em anúncio ontem às 20h15",
    siteSignals: { hasWhatsappButton: true, hasChatbot: false, onlineScheduling: false, adLandsOn: 'whatsapp', closesAt18: false, reviewsMentionDelay: false, whatsappManual: true, scanConfidence: 'alta', evidenceNote: 'Teste real no ZAP: 20h15 → 11h20' },
    deliverableText: [
      "Marcos, o teste: ontem às 20h15 perguntei no anúncio do apartamento de Pinheiros da Silva Imóveis se aceitava financiamento. A resposta só veio hoje às 11h20.",
      "A triagem que montei responde em segundos (valor, quartos, financiamento) e já passa o lead pro corretor com resumo. Quer testar no seu WhatsApp, em 1 minuto?"
    ],
    cadence: {
      d0_oferta: [
        "Marcos, aqui é a Kethely, da KethyTech (automação de atendimento). Ontem às 20h15 perguntei sobre financiamento num anúncio da Silva Imóveis no ZAP. O retorno veio hoje às 11h20.",
        "Peguei o número no próprio anúncio. Posso te mandar o print do teste? Se preferir, não escrevo mais."
      ],
      d0_pergunta: [
        "Marcos, aqui é a Kethely, da KethyTech (automação de atendimento). Peguei seu número num anúncio da Silva Imóveis no ZAP, onde vocês têm 120 imóveis ativos.",
        "Lead de portal esfria enquanto o corretor está em visita. Faz sentido te mostrar como qualificar e agendar visita sozinho? Se não, me avisa."
      ],
      d4_valor: [
        "Marcos, uma observação do teste no ZAP: a resposta que recebi não perguntou faixa de valor nem forma de pagamento, então o corretor ainda teria que qualificar do zero.",
        "Montei 3 perguntas automáticas pra separar quem tem entrada ou financiamento antes de chegar no corretor. Te mando aqui em 3 linhas?"
      ],
      d12_breakup: [
        "Marcos, vou encerrar por aqui pra não tomar seu WhatsApp.",
        "Se a resposta rápida aos leads do ZAP virar pauta na Silva Imóveis, o print do teste está comigo. É só chamar."
      ]
    },
    messages: []
  },
  {
    id: "lead-paula",
    name: "Dra. Paula — Clínica DermaPlus",
    greet: "Dra. Paula",
    originShort: "no site da clínica",
    company: "Clínica DermaPlus",
    avatar: "https://images.unsplash.com/photo-1594824813689-d421255e4e89?w=120&auto=format&fit=crop&q=80",
    role: "Dermatologista & Sócia (Clínica DermaPlus)",
    tier: "Tier B",
    sourceType: "Avaliações Recentes no Google",
    contactOrigin: "Número público no site oficial da Clínica DermaPlus",
    trigger: "3 das últimas 10 avaliações no Google citam demora de resposta no WhatsApp",
    siteSignals: { hasWhatsappButton: true, hasChatbot: false, onlineScheduling: false, adLandsOn: 'none', closesAt18: false, reviewsMentionDelay: true, whatsappManual: true, scanConfidence: 'alta', evidenceNote: '3 de 10 avaliações recentes citam demora' },
    deliverableText: [
      "Dra. Paula, as 3 avaliações recentes no Google da DermaPlus dizem que tentaram agendar pelo WhatsApp e ficaram sem retorno por mais de um dia.",
      "Duas ideias: separar quem quer agendar de quem tem dúvida rápida, e responder na hora fora do expediente. Quer ver uma simulação rápida?"
    ],
    cadence: {
      d0_oferta: [
        "Dra. Paula, aqui é a Kethely, da KethyTech (automação de atendimento). No Google da DermaPlus, 3 das últimas 10 avaliações citam demora de resposta no WhatsApp.",
        "Peguei seu contato no site da clínica. Posso te mandar as 3 avaliações e 2 ideias pra resolver? Se incomodar, é só falar."
      ],
      d0_pergunta: [
        "Dra. Paula, aqui é a Kethely, da KethyTech (automação de atendimento). Peguei seu contato no site da DermaPlus e vi no Google que 3 das últimas 10 avaliações citam demora no WhatsApp.",
        "Imagino que a recepção divida agenda e mensagens. Faz sentido conversarmos sobre isso? Se não, é só falar."
      ],
      d4_valor: [
        "Dra. Paula, outra coisa que costuma pesar na recepção de dermatologia: perguntas repetidas de valor de consulta e procedimento antes do agendamento.",
        "Tenho um texto-modelo pra essas respostas, sem prometer resultado, pensado pra seguir a Resolução CFM 2.336/2023 (vale revisar com seu jurídico). Quer ver?"
      ],
      d12_breakup: [
        "Dra. Paula, vou parar de escrever por aqui.",
        "As 3 avaliações do Google da DermaPlus continuam no meu resumo. Se aliviar a recepção virar assunto, é só chamar."
      ]
    },
    messages: []
  },
  {
    id: "lead-fernanda-diagnostico",
    name: "Dra. Fernanda — Clínica Vita",
    greet: "Dra. Fernanda",
    originShort: "no perfil do Google da clínica",
    company: "Clínica Vita",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&auto=format&fit=crop&q=80",
    role: "Diretora Médica da Clínica Vita",
    tier: "Tier B",
    sourceType: "Mini Diagnóstico (Doctoralia + Google + site)",
    contactOrigin: "Contato público no perfil da Clínica Vita no Google",
    trigger: "Fecha às 18h; o site só tem formulário, sem agenda online nem botão de WhatsApp",
    siteSignals: { hasWhatsappButton: false, hasChatbot: false, onlineScheduling: false, adLandsOn: 'none', closesAt18: true, reviewsMentionDelay: false, whatsappManual: false, scanConfidence: 'alta', siteObservation: 'só achei um formulário, sem agenda online nem WhatsApp', evidenceNote: 'Site: só formulário' },
    deliverableText: [
      "Dra. Fernanda, os 3 pontos que anotei da Clínica Vita:\n1) expediente até 18h, então quem busca consulta à noite fica pro dia seguinte;\n2) o site só tem formulário, sem agenda online;\n3) não vi confirmação 24h antes.",
      "São ajustes que não exigem contratar mais gente. Quer ver em 2 minutos como a triagem conversa?"
    ],
    cadence: {
      d0_oferta: [
        "Dra. Fernanda, aqui é a Kethely, da KethyTech (automação de atendimento). Olhei a Clínica Vita no Google: atendimento até as 18h e, no site, só um formulário.",
        "Peguei seu contato no perfil do Google. Posso te mandar os 3 pontos que anotei, em 3 linhas? Sem compromisso."
      ],
      d0_pergunta: [
        "Dra. Fernanda, aqui é a Kethely, da KethyTech (automação de atendimento). Peguei seu contato no Google da Clínica Vita e notei que o atendimento encerra às 18h.",
        "Muita gente procura consulta fora desse horário. Faz sentido conversarmos sobre como atender essas pessoas? Sem compromisso."
      ],
      d4_valor: [
        "Dra. Fernanda, sobre faltas: lembrete passivo ('sua consulta é amanhã') só informa. Pedir SIM ou NÃO e chamar a lista de espera quando alguém cancela costuma funcionar melhor.",
        "Posso te mandar o texto exato dessa confirmação pra sua recepção testar?"
      ],
      d12_breakup: [
        "Dra. Fernanda, vou encerrar por aqui.",
        "Se reduzir faltas ou organizar o agendamento da Clínica Vita entrar no radar, meu resumo de 3 pontos continua válido. É só chamar."
      ]
    },
    messages: []
  },
  {
    id: "lead-camila-meta",
    name: "Camila — Clínica Lumina Estética",
    greet: "Camila",
    originShort: "pelo perfil do Instagram da clínica",
    company: "Clínica Lumina Estética",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    role: "Gestora da Clínica Lumina Estética",
    tier: "Tier B",
    sourceType: "Anúncios no Instagram (Botox/Laser)",
    contactOrigin: "Botão de WhatsApp no perfil do Instagram da Clínica Lumina",
    trigger: "Anúncio de botox no Instagram cai na página inicial do site, não no WhatsApp",
    siteSignals: { hasWhatsappButton: true, hasChatbot: false, onlineScheduling: false, adLandsOn: 'home', closesAt18: false, reviewsMentionDelay: false, whatsappManual: true, scanConfidence: 'media', adDesc: 'de botox no Instagram', siteObservation: 'ele cai na página inicial do site, não no WhatsApp', evidenceNote: 'Anúncio → home' },
    deliverableText: [
      "Camila, quem clica no anúncio de botox da Lumina à noite ou no domingo está no pico de interesse. Se a resposta só vem de manhã, esse impulso já passou.",
      "Dois scripts: acolher em segundos perguntando o objetivo, e pré-agendar a avaliação na hora. Quer que eu simule esse atendimento com você?"
    ],
    cadence: {
      d0_oferta: [
        "Camila, aqui é a Kethely, da KethyTech (automação de atendimento). Vi os anúncios de botox da Clínica Lumina no Instagram e peguei seu contato pelo perfil.",
        "Lead de anúncio que espera costuma esfriar. Posso te mandar 2 exemplos de como clínicas respondem e agendam em segundos? Se não for o momento, tudo bem."
      ],
      d0_pergunta: [
        "Camila, aqui é a Kethely, da KethyTech (automação de atendimento). Vi os anúncios de botox da Clínica Lumina no Instagram e peguei seu contato pelo perfil.",
        "Quando o lead pago demora a ser respondido, o custo por agendamento sobe. Faz sentido conversarmos? Se não for o momento, tudo bem."
      ],
      d4_valor: [
        "Camila, um detalhe de anúncio de estética: muita gente clica só pra perguntar 'qual o valor do botox?' e esfria quando a resposta é só o preço seco.",
        "Posso te mandar a sequência de 2 mensagens que leva essa pergunta pra uma avaliação?"
      ],
      d12_breakup: [
        "Camila, vou parar por aqui pra não lotar seu WhatsApp.",
        "Se aproveitar melhor os leads dos anúncios da Lumina virar pauta, é só chamar."
      ]
    },
    messages: []
  },
  {
    id: "lead-ricardo-logistica",
    name: "Ricardo — RodoLog Transportes",
    greet: "Ricardo",
    originShort: "no site de vocês",
    company: "RodoLog Transportes",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    role: "Gerente de Operações (RodoLog Transportes)",
    tier: "Tier C",
    sourceType: "Vaga Aberta de SAC no LinkedIn",
    contactOrigin: "Contato público na página da RodoLog Transportes no LinkedIn / Site",
    trigger: "Vaga aberta de atendente de SAC na RodoLog Transportes",
    siteSignals: { hasWhatsappButton: true, hasChatbot: false, onlineScheduling: false, adLandsOn: 'none', closesAt18: false, reviewsMentionDelay: false, whatsappManual: true, scanConfidence: 'media', evidenceNote: 'Vaga de SAC aberta (inferência, não prova de gargalo)' },
    deliverableText: [
      "Ricardo, em SAC de transportadora, três pedidos tendem a dominar o WhatsApp:\n1) status por CNPJ ou NF;\n2) segunda via de boleto ou XML;\n3) cotação rápida de frete.",
      "Dá pra automatizar só essas 3 e deixar a equipe pros casos críticos. Quer ver em 1 minuto a consulta por NF?"
    ],
    cadence: {
      d0_oferta: [
        "Ricardo, aqui é a Kethely, da KethyTech (automação de atendimento). Vi no LinkedIn a vaga de atendente de SAC da RodoLog.",
        "Peguei o contato no site. Vaga de SAC costuma abrir quando o 'cadê minha entrega?' lota o WhatsApp. Posso te mandar as 3 dúvidas que dá pra automatizar? Se não for você, quem cuida?"
      ],
      d0_pergunta: [
        "Ricardo, aqui é a Kethely, da KethyTech (automação de atendimento). Vi no LinkedIn a vaga de atendente de SAC da RodoLog e peguei o contato no site.",
        "Rastreio costuma tomar boa parte do dia da operação. Faz sentido conversarmos sobre automatizar isso no WhatsApp? Se não for com você, me indica quem cuida?"
      ],
      d4_valor: [
        "Ricardo, atendente novo de SAC leva um tempo até pegar o ritmo, mas 'cadê minha entrega?' por nota fiscal dá pra responder na hora, sem ninguém.",
        "Posso te mandar um fluxo de 1 página de como isso funciona no WhatsApp?"
      ],
      d12_breakup: [
        "Ricardo, vou encerrar por aqui.",
        "Se consultas de rastreio e cotação na RodoLog virarem pauta, é só chamar. Se não for com você, me diz quem cuida disso?"
      ]
    },
    messages: []
  },
  {
    id: "lead-andre-oab",
    name: "Dr. André — Mendes & Associados",
    greet: "Dr. André",
    originShort: "no botão do site",
    company: "Mendes & Associados Advocacia",
    avatar: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=120&auto=format&fit=crop&q=80",
    role: "Sócio-Gestor (Mendes & Associados Advocacia)",
    tier: "Tier C",
    sourceType: "Site Oficial do Escritório (OAB 205/2021)",
    contactOrigin: "Botão de WhatsApp no site oficial do escritório Mendes & Associados",
    trigger: "Site direciona atendimento pro WhatsApp com encerramento às 18h",
    siteSignals: { hasWhatsappButton: true, hasChatbot: false, onlineScheduling: false, adLandsOn: 'none', closesAt18: true, reviewsMentionDelay: false, whatsappManual: true, scanConfidence: 'media', evidenceNote: 'Site → WhatsApp, expediente até 18h' },
    deliverableText: [
      "Dr. André, modelo de triagem receptiva (só pra quem já procura o escritório, pensado para o Provimento 205/2021; vale conferir com a OAB):\n1) área da demanda;\n2) resumo do caso e documentos básicos;\n3) encaminhamento ao advogado responsável.",
      "Isso tira os advogados do WhatsApp durante a redação de peças. Quer ver como fica na tela?"
    ],
    cadence: {
      d0_oferta: [
        "Dr. André, aqui é a Kethely, da KethyTech (automação de atendimento). O site do Mendes & Associados leva pro WhatsApp, e o atendimento fecha às 18h.",
        "Peguei o contato no botão do site. Posso te mandar um modelo de triagem de 3 perguntas, só pra quem já procura o escritório? Se não couber, avise."
      ],
      d0_pergunta: [
        "Dr. André, aqui é a Kethely, da KethyTech (automação de atendimento). Peguei seu contato no site do Mendes & Associados.",
        "Triagem manual no WhatsApp costuma interromper os advogados. Faz sentido conversarmos sobre organizar essa recepção? Se não couber, me avise."
      ],
      d4_valor: [
        "Dr. André, além de quem chega pelo site, cliente antigo perguntando 'como está meu processo?' interrompe a equipe técnica.",
        "Posso te mandar um exemplo de como organizar esse atendimento receptivo sem perder a pessoalidade do escritório?"
      ],
      d12_breakup: [
        "Dr. André, vou encerrar por aqui pra respeitar sua rotina.",
        "Se organizar a triagem do WhatsApp do Mendes & Associados entrar em pauta, é só chamar."
      ]
    },
    messages: []
  },
  {
    id: "lead-juliana-corretora",
    name: "Juliana — Corretora Alto Padrão",
    greet: "Juliana",
    originShort: "pelo link da bio",
    company: "Juliana Dias Imóveis",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    role: "Corretora de Imóveis Autônoma (CRECI-SP)",
    tier: "Tier C",
    sourceType: "Instagram Profissional (Link da Bio)",
    contactOrigin: "Link direto de WhatsApp na bio do seu Instagram profissional (@julianadiasimoveis)",
    trigger: "Link da bio leva direto pro WhatsApp pessoal",
    siteSignals: { hasWhatsappButton: true, scanConfidence: 'baixa', evidenceNote: 'Só Instagram, sem site para analisar' },
    deliverableText: [
      "Juliana, 3 perguntas que filtram curiosos sem parecer interrogatório:\n1) moradia ou investimento?\n2) financiamento, FGTS ou recurso próprio?\n3) pra qual mês pensa em mudar?",
      "A automação faz essas 3 enquanto você está em visita e te entrega o resumo. Quer testar como ela responde?"
    ],
    cadence: {
      d0_oferta: [
        "Juliana, aqui é a Kethely, da KethyTech (automação de atendimento). Vi no seu Instagram que o link da bio leva direto pro seu WhatsApp.",
        "Peguei o contato por lá. Responder todo mundo durante visita é pesado. Posso te mandar 3 perguntas que filtram curiosos? Se não rolar, sem problema."
      ],
      d0_pergunta: [
        "Juliana, aqui é a Kethely, da KethyTech (automação de atendimento). Peguei seu contato no link da bio do seu Instagram profissional.",
        "Atender lead do Instagram durante visita costuma ser corrido. Faz sentido te mostrar como automatizar esse primeiro contato? Se não rolar, sem problema."
      ],
      d4_valor: [
        "Juliana, comprador qualificado costuma mandar mensagem sábado à tarde, quando você está mostrando outro imóvel.",
        "Posso te mandar um vídeo de 40 segundos de como a assistente segura esse cliente e pré-agenda a visita?"
      ],
      d12_breakup: [
        "Juliana, vou parar por aqui.",
        "Se filtrar os contatos do Instagram virar assunto, é só chamar."
      ]
    },
    messages: []
  }
];

module.exports = { leads };
