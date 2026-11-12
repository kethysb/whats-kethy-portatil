const fs = require('fs');
const p = 'C:/Users/Kethely/Desktop/Whats-Kethy-Portatil/simulator/server.cjs';
const L = fs.readFileSync(p, 'utf8').split('\n');
console.log('start:', JSON.stringify(L[79]));
console.log('end  :', JSON.stringify(L[367]));
if (!L[79].startsWith('// Os 8 Leads') || L[367].trim() !== '});') { console.error('limites inesperados'); process.exit(1); }
const rep = `// Leads de demonstração e roteador de gargalo vivem em módulos próprios (leads_data.cjs / routing.cjs).
const { leads } = require('./leads_data.cjs');
const routing = require('./routing.cjs');

// Cada lead começa com os 2 balões da abordagem de Oferta Concreta (D+0 Oferta)
leads.forEach(lead => {
  lead.messages = [
    { id: "m1_" + lead.id, sender: "sdr", text: lead.cadence.d0_oferta[0], time: "14:10" },
    { id: "m2_" + lead.id, sender: "sdr", text: lead.cadence.d0_oferta[1], time: "14:10" }
  ];
});`.split('\n');
L.splice(79, 368 - 79, ...rep);
fs.writeFileSync(p, L.join('\n'));
console.log('ok, linhas:', L.length);
