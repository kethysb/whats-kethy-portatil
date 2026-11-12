const { leads } = require('./leads_data.cjs');
const r = require('./routing.cjs');
let bad = 0;
for (const l of leads) {
  const a = r.auditLead(l);
  const dx = r.diagnose(l);
  console.log(`${a.ok ? 'OK ' : 'ERR'} ${l.id.padEnd(26)} dx=${dx.type.padEnd(16)} conf=${dx.confidence} acao=${dx.action}`);
  a.issues.forEach(i => console.log('     - ' + i));
  if (!a.ok) bad++;
}
// Casos sintéticos das regras
const mk = s => ({ greet: 'X', company: 'Y', originShort: 'z', cadence: { d0_oferta: ['a', 'b'] }, siteSignals: s });
const cases = {
  ja_resolvido: mk({ hasChatbot: true, onlineScheduling: true, scanConfidence: 'alta' }),
  sem_encaixe: mk({ hasWhatsappButton: true, scanConfidence: 'alta' }),
  indefinido: mk({ scanConfidence: 'baixa' })
};
for (const [exp, l] of Object.entries(cases)) {
  const got = r.diagnose(l).type;
  console.log(`${got === exp ? 'OK ' : 'ERR'} regra ${exp} -> ${got}`);
  if (got !== exp) bad++;
}
console.log(bad ? `FALHAS: ${bad}` : 'TUDO OK');
process.exit(bad ? 1 : 0);
