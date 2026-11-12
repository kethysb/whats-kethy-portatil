/**
 * Mystery Shopping Validator & Oracle
 * Based strictly on ORIGINAL_REQUEST.md (R3) and PROJECT.md (Interface Contracts)
 */

const FICTITIOUS_BOOKING_ATTEMPT_REGEX = /(pode\s+confirmar\s+a\s+consulta\s+no\s+meu\s+nome|meu\s+cpf\s+[ée]\s+\d+|pode\s+emitir\s+a\s+reserva\s+definitiva|estou\s+fechando\s+o\s+contrato\s+agora\s+com\s+sinal)/i;

function validateMysteryShopping(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Dados de Mystery Shopping ausentes ou inválidos'] };
  }

  // 1. Question validation (simple non-booking question)
  if (!data.testQuestion || typeof data.testQuestion !== 'string' || data.testQuestion.trim().length < 10) {
    errors.push('Pergunta de teste ausente ou excessivamente curta');
  } else if (FICTITIOUS_BOOKING_ATTEMPT_REGEX.test(data.testQuestion)) {
    errors.push('Violação ética: a pergunta de mystery shopping tentou efetuar agendamento fictício definitivo');
  }

  // 2. Measured response time
  if (typeof data.measuredResponseTimeMinutes !== 'number' || data.measuredResponseTimeMinutes < 0) {
    errors.push('Tempo de resposta medido deve ser um número maior ou igual a zero');
  }

  // 3. Mini diagnostic exactly 3 lines
  if (!Array.isArray(data.miniDiagnostic3Lines)) {
    errors.push('Mini diagnóstico em 3 linhas deve ser um array');
  } else {
    if (data.miniDiagnostic3Lines.length !== 3) {
      errors.push(`Mini diagnóstico deve conter exatamente 3 linhas, recebido ${data.miniDiagnostic3Lines.length}`);
    }
    for (let i = 0; i < data.miniDiagnostic3Lines.length; i++) {
      const line = data.miniDiagnostic3Lines[i];
      if (typeof line !== 'string' || line.trim().length === 0) {
        errors.push(`Linha ${i + 1} do mini diagnóstico está vazia`);
      }
    }
  }

  // 4. Frequent questions list (5 questions)
  if (!Array.isArray(data.frequentQuestionsList)) {
    errors.push('Lista de perguntas repetidas deve ser um array');
  } else {
    if (data.frequentQuestionsList.length !== 5) {
      errors.push(`Lista de perguntas repetidas deve conter exatamente 5 perguntas, recebido ${data.frequentQuestionsList.length}`);
    }
    for (let i = 0; i < data.frequentQuestionsList.length; i++) {
      const q = data.frequentQuestionsList[i];
      if (typeof q !== 'string' || q.trim().length === 0) {
        errors.push(`Pergunta frequente ${i + 1} está vazia`);
      }
    }
  }

  // 5. Transparency notice
  if (!data.transparencyNotice || typeof data.transparencyNotice !== 'string' || data.transparencyNotice.trim().length < 15) {
    errors.push('Aviso de transparência ausente ou insuficiente');
  } else {
    const mentionsDiagnosticOrTest = /(teste|diagn[óo]stico(\s+gratuito)?|checagem|verifica[çc][ãa]o|tempo\s+real)/i.test(data.transparencyNotice);
    if (!mentionsDiagnosticOrTest) {
      errors.push('Aviso de transparência deve informar explicitamente que se tratou de um teste/diagnóstico gratuito');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateMysteryShopping,
  FICTITIOUS_BOOKING_ATTEMPT_REGEX
};
