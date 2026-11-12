/**
 * src/sdr/niches.ts - Matriz de Nichos, Fontes Públicas e Guardrails Regulatórios
 * Whats-Kethy-Portatil (Produção)
 * 
 * Cobre os 5 nichos: Dermatologia, Odontologia, Imobiliária, Advocacia e Logística.
 * Conformidade com CFM 2.336/2023, CFO 196/2019, LGPD, Provimento 205/2021 OAB.
 */

import { NicheType, PublicSources } from './types.js';

export interface RegulatoryGuardrail {
  authority: string;
  normative: string;
  prohibitedTerms: string[];
  prohibitedPractices: string[];
  mandatoryDisclosures: string[];
  allowedFocusAreas: string[];
}

export interface PublicSourceDefinition {
  sourceKey: keyof PublicSources | 'generic';
  name: string;
  description?: string;
  dataPoints: string[];
  verifiableFactExample: string;
}

export interface NicheTemplate {
  id: string;
  variant: string;
  primarySource: string;
  balloon1: string;
  balloon2: string;
  wordCountB1: number;
  wordCountB2: number;
  totalWordCount: number;
  blocks: {
    source: string;
    fact: string;
    implication: string;
    cta: string;
  };
}

export interface NicheDefinition {
  id: NicheType;
  displayName: string;
  sectorDescription: string;
  generalSources: PublicSourceDefinition[];
  specificSources: PublicSourceDefinition[];
  guardrails: RegulatoryGuardrail;
  operationalPains: string[];
  frequentQuestions: string[];
  templates: NicheTemplate[];
}

export const NICHES_CONFIG: Record<NicheType, NicheDefinition> = {
  dermatologia: {
    id: 'dermatologia',
    displayName: 'Dermatologia & Estética Médica',
    sectorDescription: 'Clínicas dermatológicas, consultórios médicos e centros de procedimentos estéticos com corpo clínico especializado.',
    generalSources: [
      {
        sourceKey: 'googleProfile',
        name: 'Google Perfil da Empresa',
        dataPoints: ['Nota média', 'Avaliações recentes citando demora no WhatsApp', 'Horário de fechamento'],
        verifiableFactExample: '3 das últimas avaliações citam demora para responder no WhatsApp'
      },
      {
        sourceKey: 'metaAds',
        name: 'Meta Ads Library',
        dataPoints: ['Anúncios ativos de procedimentos (Botox, Lavieen)', 'Destino Click-to-WhatsApp'],
        verifiableFactExample: 'anúncios ativos de procedimentos levando pro WhatsApp da clínica'
      }
    ],
    specificSources: [
      {
        sourceKey: 'doctoralia',
        name: 'Doctoralia / CFM / RQE',
        dataPoints: ['RQE do especialista', 'Avaliações de pacientes', 'Presença de agenda online'],
        verifiableFactExample: 'agenda concorrida no Doctoralia com atendimento encerrando às 19h'
      }
    ],
    guardrails: {
      authority: 'CFM (Conselho Federal de Medicina)',
      normative: 'Resolução CFM nº 2.336/2023',
      prohibitedTerms: [
        'avaliação gratuita', 'consulta grátis', 'promoção', 'desconto',
        'antes e depois', 'rejuvenescimento garantido', 'fique mais jovem',
        'aumentar faturamento com pacientes', 'captar pacientes'
      ],
      prohibitedPractices: [
        'Promessa de resultados milagrosos ou garantias terapêuticas',
        'Mercantilização da medicina e leilão de procedimentos',
        'Fotos de antes/depois que sugiram garantia de resultado',
        'Ofertas promocionais ou descontos em procedimentos médicos'
      ],
      mandatoryDisclosures: ['Menção a CRM e RQE ao associar o profissional à especialidade'],
      allowedFocusAreas: [
        'Pontualidade e agilidade no atendimento de dúvidas prévias',
        'Acolhimento rápido de pacientes em horários noturnos e fins de semana',
        'Redução de no-show (faltas) na agenda médica',
        'Organização de fila de espera para procedimentos de alto ticket'
      ]
    },
    operationalPains: [
      'Recepção divide atenção entre presencial e centenas de mensagens no WhatsApp',
      'Pacientes que mandam mensagem à noite esfriam e agendam com quem responder primeiro',
      'Faltas (no-show) em horários nobres de procedimentos a laser'
    ],
    frequentQuestions: [
      'Qual o valor da aplicação de toxina botulínica?',
      'Vocês aceitam meu convênio ou atendem somente particular?',
      'Tem horário disponível para consulta nesta semana?',
      'O laser Lavieen descama a pele ou exige tempo de recuperação?',
      'Vocês fazem avaliação prévia antes do procedimento?'
    ],
    templates: [
      {
        id: 'derm-google-1',
        variant: 'google_reviews',
        primarySource: 'Google Perfil da Empresa',
        balloon1: 'Oi, Dra. Paula! Sou a Kethely de SP. Vi no Google que 3 das últimas avaliações citam demora para responder no WhatsApp.',
        balloon2: 'A recepção costuma dividir agenda e mensagens. Faz sentido te mandar em 2 linhas como resolvemos isso em clínicas? Se não for prioridade, só avisar.',
        wordCountB1: 22,
        wordCountB2: 25,
        totalWordCount: 47,
        blocks: {
          source: 'Vi no Google',
          fact: '3 das últimas avaliações citam demora para responder no WhatsApp',
          implication: 'A recepção costuma dividir agenda e mensagens',
          cta: 'Faz sentido te mandar em 2 linhas como resolvemos isso em clínicas? Se não for prioridade, só avisar.'
        }
      },
      {
        id: 'derm-meta-2',
        variant: 'meta_ads_botox',
        primarySource: 'Meta Ads Library',
        balloon1: 'Oi, Dra. Paula! Sou a Kethely de SP. Vi na Biblioteca da Meta anúncios ativos de procedimentos levando pro WhatsApp da clínica.',
        balloon2: 'Quando o lead espera, ele esfria rápido. Faz sentido te mandar em 2 linhas como responder em segundos? Se não for prioridade, só me avisar.',
        wordCountB1: 22,
        wordCountB2: 25,
        totalWordCount: 47,
        blocks: {
          source: 'Vi na Biblioteca da Meta',
          fact: 'anúncios ativos de procedimentos levando pro WhatsApp da clínica',
          implication: 'Quando o lead espera, ele esfria rápido',
          cta: 'Faz sentido te mandar em 2 linhas como responder em segundos? Se não for prioridade, só me avisar.'
        }
      }
    ]
  },

  odontologia: {
    id: 'odontologia',
    displayName: 'Odontologia & Ortodontia',
    sectorDescription: 'Consultórios odontológicos e clínicas com foco em tratamentos de média e longa duração (Invisalign, implantes, próteses).',
    generalSources: [
      {
        sourceKey: 'googleProfile',
        name: 'Google Maps / Perfil',
        dataPoints: ['Nota média', 'Horário de atendimento', 'Volume de avaliações'],
        verifiableFactExample: 'consultório no Google com foco em tratamentos de implantes e alinhadores'
      },
      {
        sourceKey: 'website',
        name: 'Site da Clínica',
        dataPoints: ['Botão de WhatsApp', 'Especialidades divulgadas'],
        verifiableFactExample: 'atendimento encerra às 19h com contato centralizado no WhatsApp'
      }
    ],
    specificSources: [
      {
        sourceKey: 'doctoralia',
        name: 'Doctoralia Odonto / CRO',
        dataPoints: ['CRO do profissional', 'Agenda online', 'Avaliações sobre tratamentos'],
        verifiableFactExample: 'agenda concorrida no Doctoralia com tratamentos de prótese e implantes'
      }
    ],
    guardrails: {
      authority: 'CFO (Conselho Federal de Odontologia)',
      normative: 'Resoluções CFO 196/2019 e 230/2020',
      prohibitedTerms: [
        'avaliação gratuita', 'consulta grátis', 'avaliação sem custo',
        'orçamento grátis', 'promoção relâmpago', 'desconto em implante',
        'atrair mais clientes de odonto'
      ],
      prohibitedPractices: [
        'Divulgar avaliação sem custo ou consulta gratuita como isca mercantil',
        'Fixação pública de preços de próteses ou alinhadores sem exame clínico presencial',
        'Garantias de tempo de cura ou promessa infalível de alinhamento dental'
      ],
      mandatoryDisclosures: ['Identificação do profissional com número de CRO'],
      allowedFocusAreas: [
        'Pré-qualificação ágil de dúvidas clínicas para valorizar o tempo de cadeira',
        'Confirmação ativa de consultas para zerar o no-show em procedimentos caros',
        'Atendimento imediato a pacientes com interesse em tratamentos longos'
      ]
    },
    operationalPains: [
      'Dentista perde horas na cadeira com curiosos perguntando apenas preço de implante/Invisalign',
      'No-show (falta de paciente) em horários nobres de cirurgia de implante',
      'Recepção sobrecarregada com lembretes manuais de confirmação'
    ],
    frequentQuestions: [
      'Quanto custa colocar Invisalign ou alinhador transparente?',
      'Vocês fazem avaliação no mesmo dia?',
      'Quanto tempo demora para finalizar um implante dentário?',
      'Vocês atendem urgência para dor de dente?',
      'Aceitam convênio odontológico ou é apenas particular?'
    ],
    templates: [
      {
        id: 'odonto-google-1',
        variant: 'google_implants',
        primarySource: 'Google Perfil da Empresa',
        balloon1: 'Oi, Dr. Rafael! Sou a Kethely de SP. Achei o consultório no Google e vi que fazem tratamentos de implantes e alinhadores.',
        balloon2: 'Muitos consultórios perdem tempo com curiosos na recepção. Faz sentido te mandar em 2 linhas como pré-qualificar antes da consulta? Se não for o momento, me avisa.',
        wordCountB1: 22,
        wordCountB2: 27,
        totalWordCount: 49,
        blocks: {
          source: 'Achei o consultório no Google',
          fact: 'vi que fazem tratamentos de implantes e alinhadores',
          implication: 'Muitos consultórios perdem tempo com curiosos na recepção',
          cta: 'Faz sentido te mandar em 2 linhas como pré-qualificar antes da consulta? Se não for o momento, me avisa.'
        }
      },
      {
        id: 'odonto-doctoralia-2',
        variant: 'no_show_doctoralia',
        primarySource: 'Doctoralia Odonto',
        balloon1: 'Oi, Dr. Rafael! Sou a Kethely de SP. Vi no Doctoralia que a clínica tem agenda concorrida e encerra às 19h.',
        balloon2: 'Pacientes que pesquisam à noite fecham com quem responde primeiro. Posso mandar em 2 linhas como evitar faltas na cadeira? Se não for o momento, sem problemas.',
        wordCountB1: 21,
        wordCountB2: 27,
        totalWordCount: 48,
        blocks: {
          source: 'Vi no Doctoralia',
          fact: 'a clínica tem agenda concorrida e encerra às 19h',
          implication: 'Pacientes que pesquisam à noite fecham com quem responde primeiro',
          cta: 'Posso mandar em 2 linhas como evitar faltas na cadeira? Se não for o momento, sem problemas.'
        }
      }
    ]
  },

  imobiliaria: {
    id: 'imobiliaria',
    displayName: 'Imobiliária & Mercado Imobiliário',
    sectorDescription: 'Imobiliárias e corretores associados atuantes em vendas de lançamentos, imóveis prontos de médio/alto padrão e locação.',
    generalSources: [
      {
        sourceKey: 'metaAds',
        name: 'Meta Ads Library',
        dataPoints: ['Campanhas de empreendimentos ativos', 'Botão para WhatsApp'],
        verifiableFactExample: 'anúncios ativos dos seus lançamentos no Meta Ads levando direto pro WhatsApp'
      },
      {
        sourceKey: 'website',
        name: 'Site da Imobiliária',
        dataPoints: ['Catálogo online', 'Contato direto dos corretores'],
        verifiableFactExample: 'contato centralizado no WhatsApp comercial da equipe de corretores'
      }
    ],
    specificSources: [
      {
        sourceKey: 'realEstatePortals',
        name: 'Portais Imobiliários (ZAP / VivaReal / OLX)',
        dataPoints: ['CRECI jurídico', 'Volume de anúncios ativos', 'Tipologia dos imóveis anunciados'],
        verifiableFactExample: 'mais de 100 imóveis ativos no ZAP direcionando pro WhatsApp'
      }
    ],
    guardrails: {
      authority: 'LGPD / ANPD / CRECI',
      normative: 'Lei Federal nº 13.709/2018 (Art. 7º, IX - Legítimo Interesse B2B)',
      prohibitedTerms: [
        'base de clientes comprada', 'dados de proprietários vazados',
        'disparo em massa para proprietários', 'comprar lista de compradores'
      ],
      prohibitedPractices: [
        'Uso de bases de contatos não-públicas ou vazadas sem consentimento',
        'Disparo massivo indiscriminado (spam) para pessoas físicas',
        'Ausência de canal claro de cancelamento/opt-out imediato'
      ],
      mandatoryDisclosures: ['Canal de opt-out imediato e citação da fonte pública comercial'],
      allowedFocusAreas: [
        'Velocidade de primeiro atendimento para leads de portais (speed-to-lead)',
        'Pré-qualificação automática de renda e perfil de crédito imobiliário',
        'Triagem de agendamento de visitas presenciais para liberar a agenda do corretor'
      ]
    },
    operationalPains: [
      'Lead de portal imobiliário esfria se não for respondido nos primeiros 5 a 10 minutos',
      'Corretor passa o dia atendendo curiosos sem renda comprovada ou sem FGTS para entrada',
      'Perda de contatos durante visitas externas de campo'
    ],
    frequentQuestions: [
      'Esse imóvel em Pinheiros ainda está disponível para visitação?',
      'Aceita permuta por outro apartamento menor?',
      'Qual o valor do condomínio e do IPTU mensal?',
      'Qual o fluxo de entrada e parcelas durante a obra?',
      'Vocês fazem a simulação de financiamento bancário pela Caixa?'
    ],
    templates: [
      {
        id: 'imob-zap-1',
        variant: 'zap_portal',
        primarySource: 'ZAP Imóveis / VivaReal',
        balloon1: 'Oi, Marcos! Sou a Kethely de SP. Vi no ZAP mais de 100 imóveis ativos direcionando pro WhatsApp.',
        balloon2: 'Lead de portal esfria rápido enquanto o corretor faz visitas. Faz sentido te mandar em 2 linhas como pré-qualificar a renda antes? Se não for prioridade, só falar.',
        wordCountB1: 18,
        wordCountB2: 28,
        totalWordCount: 46,
        blocks: {
          source: 'Vi no ZAP',
          fact: 'mais de 100 imóveis ativos direcionando pro WhatsApp',
          implication: 'Lead de portal esfria rápido enquanto o corretor faz visitas',
          cta: 'Faz sentido te mandar em 2 linhas como pré-qualificar a renda antes? Se não for prioridade, só falar.'
        }
      },
      {
        id: 'imob-meta-2',
        variant: 'meta_ads_launch',
        primarySource: 'Meta Ads Library',
        balloon1: 'Oi, Marcos! Sou a Kethely de SP. Vi anúncios ativos dos seus lançamentos no Meta Ads levando direto pro WhatsApp.',
        balloon2: 'Corretores perdem metade do dia atendendo contatos sem perfil. Faz sentido te mandar em 2 linhas como filtrar antes da visita? Se não for prioridade, sem problema.',
        wordCountB1: 20,
        wordCountB2: 27,
        totalWordCount: 47,
        blocks: {
          source: 'Vi anúncios ativos dos seus lançamentos no Meta Ads',
          fact: 'levando direto pro WhatsApp',
          implication: 'Corretores perdem metade do dia atendendo contatos sem perfil',
          cta: 'Faz sentido te mandar em 2 linhas como filtrar antes da visita? Se não for prioridade, sem problema.'
        }
      }
    ]
  },

  advocacia: {
    id: 'advocacia',
    displayName: 'Advocacia & Sociedades de Advogados',
    sectorDescription: 'Escritórios de advocacia com sócios e associados atuantes em Direito Civil, Trabalhista, Tributário e Previdenciário.',
    generalSources: [
      {
        sourceKey: 'website',
        name: 'Site Institucional do Escritório',
        dataPoints: ['Áreas de atuação', 'Botão de WhatsApp para contato', 'Horário de expediente'],
        verifiableFactExample: 'site do escritório com atendimento receptivo via WhatsApp e expediente até as 18h'
      },
      {
        sourceKey: 'googleProfile',
        name: 'Google Maps / Perfil',
        dataPoints: ['Endereço da sede', 'Avaliações públicas'],
        verifiableFactExample: 'perfil do escritório no Google com atuação em Direito Trabalhista patronal'
      }
    ],
    specificSources: [
      {
        sourceKey: 'oabProfile',
        name: 'CNA OAB / Publicações Oficiais',
        dataPoints: ['Número da OAB dos sócios', 'Artigos jurídicos públicos'],
        verifiableFactExample: 'artigos técnicos publicados sobre compliance trabalhista e LGPD'
      }
    ],
    guardrails: {
      authority: 'OAB (Conselho Federal da Ordem dos Advogados do Brasil)',
      normative: 'Provimento CFOAB nº 205/2021 e Código de Ética e Disciplina',
      prohibitedTerms: [
        'captar clientes', 'atrair clientes', 'prospectar clientes',
        'aumentar carteira de clientes', 'ganhar ações judiciais',
        'causa ganha', 'consulta grátis', 'disparo ativo para clientes'
      ],
      prohibitedPractices: [
        'PROIBIÇÃO ABSOLUTA de captação ativa de clientela (outbound marketing para cidadãos)',
        'Sensacionalismo, mercantilização e promessa de resultado jurídico',
        'Divulgação de valores de honorários em mensagens ativas',
        'Oferecer automação que execute captação ativa ou envio frio para pessoas físicas'
      ],
      mandatoryDisclosures: [
        'A abordagem DEVE se restringir estritamente à triagem receptiva e organização de fila',
        'Identificação expressa da conformidade com o Provimento 205/2021 da OAB'
      ],
      allowedFocusAreas: [
        'Acolhimento imediato e triagem receptiva de quem procura o escritório voluntariamente',
        'Filtragem inicial de viabilidade jurídica de novos contatos recebidos no site/WhatsApp',
        'Respostas automáticas a dúvidas recorrentes de clientes sobre andamento processual',
        'Organização e distribuição interna de atendimentos entre os advogados associados'
      ]
    },
    operationalPains: [
      'Sócios perdem horas preciosas fazendo triagem manual de mensagens no WhatsApp',
      'Clientes existentes perguntam repetidamente "como está meu processo?", interrompendo prazos judiciais',
      'Contatos interessados que chegam pelo site fora do horário comercial ficam sem resposta até o dia seguinte'
    ],
    frequentQuestions: [
      'Meu processo já foi julgado ou tem data de audiência?',
      'Vocês cobram consulta inicial para analisar a documentação da empresa?',
      'Como funciona o contrato de honorários de vocês?',
      'Vocês atuam com revisão de contratos comerciais e societários?',
      'Posso enviar meus documentos em PDF por aqui para vocês analisarem?'
    ],
    templates: [
      {
        id: 'adv-site-1',
        variant: 'oab_receptive_site',
        primarySource: 'Site Institucional / Provimento 205 OAB',
        balloon1: 'Oi, Dr. André! Sou a Kethely de SP. Vi no site do escritório o atendimento receptivo via WhatsApp.',
        balloon2: 'Advogados perdem horas na triagem de novos casos. Faz sentido te mandar em 2 linhas como organizar isso pela OAB 205? Se não for prioridade, só avisar.',
        wordCountB1: 18,
        wordCountB2: 27,
        totalWordCount: 45,
        blocks: {
          source: 'Vi no site do escritório',
          fact: 'o atendimento receptivo via WhatsApp',
          implication: 'Advogados perdem horas na triagem de novos casos',
          cta: 'Faz sentido te mandar em 2 linhas como organizar isso pela OAB 205? Se não for prioridade, só avisar.'
        }
      },
      {
        id: 'adv-status-2',
        variant: 'oab_process_status',
        primarySource: 'Site do Escritório',
        balloon1: 'Oi, Dr. André! Sou a Kethely de SP. Vi no site que os contatos caem no WhatsApp da equipe.',
        balloon2: 'Dúvidas de processo tiram o foco dos sócios. Faz sentido te mostrar em 2 linhas como organizar a triagem receptiva pela OAB? Se não for o momento, só falar.',
        wordCountB1: 19,
        wordCountB2: 29,
        totalWordCount: 48,
        blocks: {
          source: 'Vi no site',
          fact: 'os contatos caem no WhatsApp da equipe',
          implication: 'Dúvidas de processo tiram o foco dos sócios',
          cta: 'Faz sentido te mostrar em 2 linhas como organizar a triagem receptiva pela OAB? Se não for o momento, só falar.'
        }
      }
    ]
  },

  logistica: {
    id: 'logistica',
    displayName: 'Logística & Transportes',
    sectorDescription: 'Transportadoras de carga, operadoras logísticas rodoviárias, centros de distribuição e serviços de entrega rápida.',
    generalSources: [
      {
        sourceKey: 'jobPostings',
        name: 'LinkedIn / Indeed Vagas',
        dataPoints: ['Vagas de Atendente de SAC', 'Vagas de Assistente de Rastreamento'],
        verifiableFactExample: 'vaga de SAC aberta recentemente no LinkedIn para atendimento ao cliente'
      },
      {
        sourceKey: 'googleProfile',
        name: 'Google Maps / Perfil',
        dataPoints: ['Localização de galpões', 'Avaliações sobre entregas'],
        verifiableFactExample: 'perfil da transportadora no Google com atendimento focado em fretes corporativos'
      }
    ],
    specificSources: [
      {
        sourceKey: 'reclameAqui',
        name: 'Reclame Aqui',
        dataPoints: ['Volume de queixas de rastreamento de carga', 'Tempo médio de resposta'],
        verifiableFactExample: 'avaliações no Reclame Aqui apontando solicitações recorrentes de código de rastreio'
      }
    ],
    guardrails: {
      authority: 'Código de Defesa do Consumidor / LGPD',
      normative: 'Lei nº 8.078/1990 (Art. 6º - Informação adequada e tempestiva)',
      prohibitedTerms: ['prometer entrega sem estoque', 'omitir prazos reais'],
      prohibitedPractices: [
        'Deixar o consumidor sem posicionamento de mercadoria em trânsito',
        'Venda de bases de fretes com dados de destinatários pessoais'
      ],
      mandatoryDisclosures: ['Canal de rastreio transparente e protocolo de atendimento'],
      allowedFocusAreas: [
        'Autoatendimento 24/7 para consulta de status de entrega por nota fiscal ou código',
        'Desafogo de atendentes humanos de dúvidas repetitivas de "onde está meu pacote"',
        'Notificação ativa de saída para entrega e tentativa frustrada de recebimento'
      ]
    },
    operationalPains: [
      'Equipe de SAC gasta 80% do expediente respondendo a pergunta "cadê minha encomenda?"',
      'Picos de mensagens em datas comemorativas travam as linhas telefônicas e o WhatsApp',
      'Atraso na comunicação de ocorrências de transporte gera reclamações públicas no Reclame Aqui'
    ],
    frequentQuestions: [
      'Onde está minha encomenda com a nota fiscal número X?',
      'Qual a previsão exata de entrega para o CEP Y?',
      'Vocês fazem entrega aos sábados e feriados?',
      'O motorista já saiu para entrega hoje?',
      'Como faço para alterar o endereço de recebimento do pacote?'
    ],
    templates: [
      {
        id: 'log-sac-1',
        variant: 'sac_job_linkedin',
        primarySource: 'LinkedIn Vagas',
        balloon1: 'Oi, Ricardo! Sou a Kethely de SP. Vi no LinkedIn a vaga de SAC da transportadora e reclamações de rastreio.',
        balloon2: 'O "onde está minha entrega?" costuma lotar o WhatsApp. Faz sentido te mandar em 2 linhas como automatizar esse rastreio? Se não for prioridade, só falar.',
        wordCountB1: 20,
        wordCountB2: 26,
        totalWordCount: 46,
        blocks: {
          source: 'Vi no LinkedIn a vaga de SAC da transportadora',
          fact: 'vaga de SAC e reclamações de rastreio',
          implication: 'O "onde está minha entrega?" costuma lotar o WhatsApp',
          cta: 'Faz sentido te mandar em 2 linhas como automatizar esse rastreio? Se não for prioridade, só falar.'
        }
      },
      {
        id: 'log-reclame-2',
        variant: 'reclame_aqui_tracking',
        primarySource: 'Reclame Aqui',
        balloon1: 'Oi, Ricardo! Sou a Kethely de SP. Vi no Reclame Aqui que a maioria das dúvidas é sobre status de frete.',
        balloon2: 'Dúvidas repetitivas de rastreamento sobrecarregam o atendimento diário. Faz sentido te mandar em 2 linhas como resolver isso no WhatsApp? Se não for o momento, só me avisar.',
        wordCountB1: 21,
        wordCountB2: 28,
        totalWordCount: 49,
        blocks: {
          source: 'Vi no Reclame Aqui',
          fact: 'a maioria das dúvidas é sobre status de frete',
          implication: 'Dúvidas repetitivas de rastreamento sobrecarregam o atendimento diário',
          cta: 'Faz sentido te mandar em 2 linhas como resolver isso no WhatsApp? Se não for o momento, só me avisar.'
        }
      }
    ]
  }
};

/**
 * Retorna as configurações de um nicho específico
 */
export function getNicheConfig(niche: NicheType): NicheDefinition {
  const config = NICHES_CONFIG[niche];
  if (!config) {
    throw new Error(`Nicho não suportado: ${niche}`);
  }
  return config;
}

/**
 * Retorna todos os nichos suportados
 */
export function getAllNiches(): NicheDefinition[] {
  return Object.values(NICHES_CONFIG);
}

/**
 * Retorna os templates de abordagem de um nicho
 */
export function getNicheTemplates(niche: NicheType): NicheTemplate[] {
  return getNicheConfig(niche).templates;
}

/**
 * Validação semântica de conformidade regulatória para o texto gerado
 */
export function validateRegulatoryCompliance(
  niche: NicheType,
  text: string
): { compliant: boolean; violations: string[] } {
  const config = getNicheConfig(niche);
  const violations: string[] = [];
  const normalizedText = text.toLowerCase();

  for (const term of config.guardrails.prohibitedTerms) {
    if (normalizedText.includes(term.toLowerCase())) {
      violations.push(`Termo proibido detectado (${config.guardrails.authority}): "${term}"`);
    }
  }

  // Regra extra estrita para Advocacia (Provimento 205/2021)
  if (niche === 'advocacia') {
    const activeCaptureTerms = ['atrair mais clientes', 'prospectar clientes', 'captar novos clientes', 'gerar leads para você'];
    for (const term of activeCaptureTerms) {
      if (normalizedText.includes(term)) {
        violations.push(`Violação do Provimento 205/2021 OAB: Proibida oferta de captação ativa de clientela ("${term}"). Apenas atendimento receptivo e triagem são autorizados.`);
      }
    }
  }

  return {
    compliant: violations.length === 0,
    violations
  };
}

/**
 * Formata um template em balões e valida restrições físicas
 */
export function formatApproach(
  niche: NicheType,
  templateId?: string
): { balloon1: string; balloon2: string; formattedMessage: string; totalWords: number } {
  const templates = getNicheTemplates(niche);
  const selected = templateId ? templates.find((t) => t.id === templateId) || templates[0] : templates[0];

  const formattedMessage = `${selected.balloon1} ---SPLIT--- ${selected.balloon2}`;
  const totalWords = formattedMessage.replace(/---SPLIT---/g, ' ').trim().split(/\s+/).filter(Boolean).length;

  return {
    balloon1: selected.balloon1,
    balloon2: selected.balloon2,
    formattedMessage,
    totalWords
  };
}
