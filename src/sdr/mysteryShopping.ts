/**
 * src/sdr/mysteryShopping.ts
 * Módulo de Mystery Shopping Ético e CTAs de Reciprocidade
 * 
 * Regras Éticas Inegociáveis:
 * 1. NUNCA agendar consulta, ocupar horário de agenda ou inventar sintomas médicos.
 * 2. Enviar pergunta simples, objetiva e real de horário/atendimento.
 * 3. Revelar o teste com total transparência logo na primeira mensagem de abordagem como diagnóstico gratuito.
 * 4. Apresentar o resultado com empatia ("super normal com a recepção cheia"), sem tom de acusação.
 */

import { MysteryShoppingData, NicheType } from './types.js';

export interface MysteryTestQuestion {
  niche: NicheType;
  question: string;
  idealHoursToTest: string; // Ex: "19h às 20h" (fora do comercial)
  targetContext: string;
}

export const ETHICAL_TEST_QUESTIONS: Record<NicheType, MysteryTestQuestion> = {
  dermatologia: {
    niche: 'dermatologia',
    question: 'Olá, boa noite! Vocês têm horário para avaliação dermatológica aos sábados?',
    idealHoursToTest: '19:00 - 20:30',
    targetContext: 'Testar se a clínica tem atendimento ou triagem automatizada no período noturno'
  },
  odontologia: {
    niche: 'odontologia',
    question: 'Boa noite! Gostaria de saber se vocês atendem avaliação para aparelho/Invisalign aos sábados?',
    idealHoursToTest: '19:00 - 20:30',
    targetContext: 'Testar tempo de resposta fora do horário comercial'
  },
  imobiliaria: {
    niche: 'imobiliaria',
    question: 'Olá, tudo bem? Esse imóvel anunciado no portal ainda está disponível para visita neste fim de semana?',
    idealHoursToTest: '19:30 - 21:00',
    targetContext: 'Lead de portal que esfria se o corretor não responder em até 1 hora'
  },
  advocacia: {
    niche: 'advocacia',
    question: 'Olá, boa tarde! Gostaria de saber os horários de atendimento do escritório para consulta inicial.',
    idealHoursToTest: '18:15 - 19:00',
    targetContext: 'Triagem receptiva de quem procura o escritório após as 18h (Provimento 205/2021 OAB)'
  },
  logistica: {
    niche: 'logistica',
    question: 'Olá! Vocês fazem cotação de frete fracionado para São Paulo pelo WhatsApp?',
    idealHoursToTest: '18:30 - 19:30',
    targetContext: 'Tempo de resposta do SAC/atendimento para cotações e suporte'
  }
};

export class MysteryShoppingEngine {
  /**
   * Cria dados de Mystery Shopping simulado ou real
   */
  public static createDiagnostic(
    niche: NicheType,
    leadName: string,
    company: string,
    sentAtTime: string = '19h',
    repliedAtTime: string = '10h do dia seguinte',
    responseTimeMinutes: number = 900
  ): MysteryShoppingData {
    const testDef = ETHICAL_TEST_QUESTIONS[niche];

    const miniDiagnostic: [string, string, string] = [
      '1) Sem resposta imediata fora do horário (leads que chamam após às 18h esfriam até o dia seguinte)',
      '2) Recepção dividida entre telefone presencial e dezenas de mensagens acumuladas',
      '3) Ausência de triagem automática para separar curiosos de clientes/pacientes qualificados'
    ];

    const frequentQuestions: string[] = [
      'Qual o valor da consulta / procedimento?',
      'Vocês atendem pelo meu plano / convênio?',
      'Tem horário disponível para este sábado?',
      'Onde fica exatamente a clínica / escritório?',
      'Como funciona a primeira avaliação?'
    ];

    return {
      testQuestion: testDef.question,
      measuredResponseTimeMinutes: responseTimeMinutes,
      testedAt: new Date().toISOString(),
      miniDiagnostic3Lines: miniDiagnostic,
      frequentQuestionsList: frequentQuestions,
      transparencyNotice: `Achei o contato no Google e ontem às ${sentAtTime} mandei uma dúvida rápida no WhatsApp da ${company}. A resposta chegou às ${repliedAtTime}.`
    };
  }

  /**
   * Formata a abordagem de 2 balões com gancho de Mystery Shopping (<= 50 palavras)
   */
  public static formatMysteryApproach(
    niche: NicheType,
    leadTitle: string, // Ex: "Dr. Rafael"
    company: string,
    diagnostic: MysteryShoppingData
  ): [string, string] {
    const b1 = `Oi, ${leadTitle}, Kethely da KethyTech, de SP. Achei o consultório no Google e ontem às 19h mandei uma pergunta no WhatsApp de vocês. A resposta veio hoje às 10h.`;
    const b2 = `Normal com a agenda cheia, mas à noite muito paciente fecha com quem responde primeiro. Posso te mandar o print e 2 ideias? Se não for prioridade, sem problema.`;

    return [b1, b2];
  }

  /**
   * Formata a abordagem de Mini Diagnóstico em 3 Linhas (<= 50 palavras)
   */
  public static formatDiagnosticApproach(
    leadTitle: string, // Ex: "Dra. Fernanda"
    company: string
  ): [string, string] {
    const b1 = `Oi, ${leadTitle}! Sou a Kethely, da KethyTech, de SP. Achei a clínica no Doctoralia e no Google e anotei 3 pontos onde vocês podem estar perdendo paciente no WhatsApp.`;
    const b2 = `Posso te mandar o resumo de 3 linhas? Leva 1 minuto de leitura e não tem compromisso. Se não for prioridade, é só me dizer.`;

    return [b1, b2];
  }
}
