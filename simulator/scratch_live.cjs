const http = require('http');
function post(path, body) {
  return new Promise(res => {
    const d = JSON.stringify(body);
    const r = http.request({ host: 'localhost', port: 5555, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) } }, x => { let b = ''; x.on('data', c => b += c); x.on('end', () => res(JSON.parse(b))); });
    r.write(d); r.end();
  });
}
(async () => {
  for (const id of ['lead-fernanda-diagnostico', 'lead-camila-meta', 'lead-paula', 'lead-juliana-corretora']) {
    const r = await post('/api/cadence', { leadId: id, step: 'd0_roteada' });
    console.log('\n== ' + id + ' -> ' + r.diagnosis.type + ' (' + r.diagnosis.confidence + ') ' + r.diagnosis.action);
    (r.bubbles || []).forEach(b => console.log('  > ' + b.text));
  }
})();
