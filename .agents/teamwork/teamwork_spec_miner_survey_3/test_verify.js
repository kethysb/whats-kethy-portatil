const personas = [
  {
    niche: "Dermatologia",
    text: "Dr. Roberto, boa tarde! Sou a Kethely de SP. Vi o perfil da clínica no Google e notei anúncios ativos no fim de semana.---SPLIT---Como o atendimento encerra às 19h, pacientes à noite ficam sem resposta rápida. Faz sentido te mostrar como outras clínicas resolvem isso?"
  },
  {
    niche: "Odontologia",
    text: "Dra. Juliana, boa tarde! Sou a Kethely de SP. Acompanho o Instagram da clínica e os casos de alinhadores invisíveis.---SPLIT---Muitos consultórios perdem consultas porque curiosos perguntam e a recepção demora a filtrar. Faz sentido te mostrar como pré-qualificar antes da consulta?"
  },
  {
    niche: "Imobiliária",
    text: "Marcos, boa tarde! Aqui é a Kethely de SP. Vi os anúncios ativos dos seus lançamentos em Pinheiros no Meta Ads.---SPLIT---Corretores perdem metade do dia atendendo curiosos sem renda pré-aprovada. Vale a pena te mostrar como filtrar o lead antes do corretor?"
  },
  {
    niche: "Advocacia",
    text: "Dr. Henrique, boa tarde! Sou a Kethely de SP. Vi o site do escritório e seus artigos de compliance trabalhista.---SPLIT---Muitos escritórios sobrecarregam advogados na triagem de contatos do WhatsApp. Faz sentido te mostrar como automatizar essa triagem receptiva conforme o Provimento 205?"
  },
  {
    niche: "Logística",
    text: "Camila, boa tarde! Sou a Kethely de SP. Vi no LinkedIn que a ExpressLog abriu novas vagas de atendimento para SAC.---SPLIT---Operações logísticas perdem muito tempo com dúvidas repetitivas de rastreio de mercadorias. Faz sentido te mandar em 2 linhas como desafogar o time?"
  }
];

console.log("=== VERIFICAÇÃO INDEPENDENTE DE REGRAS DE FORMATAÇÃO ===");
let allPassed = true;

personas.forEach((p, idx) => {
  const bubbles = p.text.split("---SPLIT---");
  const words = p.text.replace("---SPLIT---", " ").trim().split(/\s+/).filter(Boolean);
  const bubbleCountOk = bubbles.length === 2;
  const wordCountOk = words.length <= 50;
  
  console.log(`Persona ${idx + 1} (${p.niche}):`);
  console.log(`  Balões: ${bubbles.length} [${bubbleCountOk ? 'OK' : 'FAIL'}]`);
  console.log(`  Palavras: ${words.length} / 50 [${wordCountOk ? 'OK' : 'FAIL'}]`);
  
  if (!bubbleCountOk || !wordCountOk) {
    allPassed = false;
  }
});

// Teste da Fórmula de Ajuste Dinâmico de Tiers
console.log("\n=== TESTE DA FÓRMULA DE AJUSTE DINÂMICO DE TIERS ===");
function testDynamicTierRebalance(contactsA, meetingsA, contactsB, meetingsB, currentAllocA, currentAllocB) {
  const crA = meetingsA / contactsA;
  const crB = meetingsB / contactsB;
  const conditionTriggered = crA < 2 * crB;
  
  let newAllocA = currentAllocA;
  let newAllocB = currentAllocB;
  
  if (contactsA >= 15 && contactsB >= 15 && conditionTriggered) {
    const ratio = crA / (2 * crB);
    const delta = Math.min(0.15, Math.max(0.05, 0.15 * (1 - ratio)));
    newAllocA = Math.max(0.25, currentAllocA - delta);
    newAllocB = currentAllocB + (currentAllocA - newAllocA);
  }
  
  return { crA, crB, conditionTriggered, currentAllocA, newAllocA, currentAllocB, newAllocB };
}

const scenario1 = testDynamicTierRebalance(20, 2, 30, 3, 0.50, 0.35); // crA = 0.10, crB = 0.10 -> crA < 2*crB (0.10 < 0.20) -> deve reduzir Tier A
console.log("Cenário 1 (crA = 10%, crB = 10%):", scenario1);
if (scenario1.newAllocA < scenario1.currentAllocA && scenario1.newAllocB > scenario1.currentAllocB) {
  console.log("  [OK] Tier A reduzido de", scenario1.currentAllocA, "para", scenario1.newAllocA.toFixed(2), "e Tier B aumentado.");
} else {
  console.log("  [FAIL] Rebalanceamento incorreto.");
  allPassed = false;
}

const scenario2 = testDynamicTierRebalance(20, 5, 30, 3, 0.50, 0.35); // crA = 0.25, crB = 0.10 -> crA >= 2*crB (0.25 >= 0.20) -> mantém Tier A
console.log("Cenário 2 (crA = 25%, crB = 10%):", scenario2);
if (scenario2.newAllocA === scenario2.currentAllocA && !scenario2.conditionTriggered) {
  console.log("  [OK] Tier A mantido sem redução quando crA >= 2*crB.");
} else {
  console.log("  [FAIL] Condição de eficiência falhou.");
  allPassed = false;
}

console.log("\nResultado Geral dos Testes:", allPassed ? "TODOS OS TESTES PASSARAM COM SUCESSO!" : "FALHA NOS TESTES!");
