/**
 * Tier Calculator & Dynamic Adjustment Oracle
 * Based strictly on ORIGINAL_REQUEST.md (R2) and PROJECT.md (Interface Contracts)
 */

function computeRates(contacts, responses, meetings) {
  const safeContacts = Number(contacts) || 0;
  const safeResponses = Number(responses) || 0;
  const safeMeetings = Number(meetings) || 0;

  if (safeContacts <= 0) {
    return {
      contactsApproached: 0,
      responsesReceived: 0,
      meetingsBooked: 0,
      responseRate: 0,
      meetingConversionRate: 0,
      responseRatePct: "0.0%",
      meetingConversionRatePct: "0.0%"
    };
  }

  const responseRate = safeResponses / safeContacts;
  const meetingConversionRate = safeMeetings / safeContacts;

  return {
    contactsApproached: safeContacts,
    responsesReceived: safeResponses,
    meetingsBooked: safeMeetings,
    responseRate,
    meetingConversionRate,
    responseRatePct: (responseRate * 100).toFixed(1) + "%",
    meetingConversionRatePct: (meetingConversionRate * 100).toFixed(1) + "%"
  };
}

function evaluateDynamicAdjustment(tierAInput, tierBInput, options = {}) {
  const minSample = options.minSample !== undefined ? options.minSample : 10;
  const currentAllocation = options.currentAllocation || { tierA: 50, tierB: 30, tierC: 20 };

  const statsA = computeRates(tierAInput.contactsApproached, tierAInput.responsesReceived, tierAInput.meetingsBooked);
  const statsB = computeRates(tierBInput.contactsApproached, tierBInput.responsesReceived, tierBInput.meetingsBooked);

  const rateA = statsA.meetingConversionRate;
  const rateB = statsB.meetingConversionRate;
  const thresholdRequired = 2 * rateB;

  // Se amostra insuficiente para inferência estatística
  if (statsA.contactsApproached < minSample || statsB.contactsApproached < minSample) {
    return {
      needsAdjustment: false,
      tierAConversionRate: rateA,
      tierBConversionRate: rateB,
      thresholdRequired,
      currentAllocation,
      recommendedAllocation: currentAllocation,
      reason: `Amostra insuficiente para ajuste (A: ${statsA.contactsApproached}/${minSample}, B: ${statsB.contactsApproached}/${minSample})`
    };
  }

  // Regra central de negócio: se taxa de reunião do Tier A não for pelo menos o dobro da taxa do Tier B
  const needsAdjustment = rateA < thresholdRequired;

  let recommendedAllocation;
  let reason;

  if (needsAdjustment) {
    recommendedAllocation = { tierA: 30, tierB: 45, tierC: 25 };
    reason = `ALERTA DE AJUSTE DINÂMICO: Taxa de reunião do Tier A (${(rateA * 100).toFixed(1)}%) é inferior a 2x a taxa do Tier B (exigido: >= ${(thresholdRequired * 100).toFixed(1)}%). Tempo do Tier A reduzido de ${currentAllocation.tierA}% para ${recommendedAllocation.tierA}%.`;
  } else {
    recommendedAllocation = currentAllocation;
    const ratio = rateB > 0 ? (rateA / rateB).toFixed(2) : "inf";
    reason = `META MÍNIMA ATINGIDA: Tier A convertendo ${ratio}x em relação ao Tier B (meta mínima de 2x superada). Prioridade alta mantida.`;
  }

  return {
    needsAdjustment,
    tierAConversionRate: rateA,
    tierBConversionRate: rateB,
    thresholdRequired,
    currentAllocation,
    recommendedAllocation,
    reason
  };
}

module.exports = {
  computeRates,
  evaluateDynamicAdjustment
};
