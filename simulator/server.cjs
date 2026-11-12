const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5555;
const KEYDEX_KEY = "SUA_CHAVE_API_AQUI";
const KEYDEX_URL = "https://keydex.shop/v1/chat/completions";
const MODEL_CONVERSA = "claude-sonnet-4-6";

// PersistÃªncia de MÃ©tricas por Tier (PirÃ¢mide Realista) + Teste A/B (Pergunta vs Oferta)
const METRICS_FILE = path.join(__dirname, 'metrics_tiers.json');
let tierMetrics = {
  aviso: "DADOS DE EXEMPLO (fictÃ­cios): servem sÃ³ para ilustrar a tela. Os nÃºmeros reais vÃªm de medir em produÃ§Ã£o.",
  tierA: {
    leadsContatados: 40,
    respostas: 15,
    reunioes: 7,
    taxaResposta: "37.5%",
    taxaReuniao: "17.5%",
    tempoMedioLead: "18 min (Mystery Shopping + Auditoria)",
    proporcaoCarteira: "15% dos leads (ExceÃ§Ã£o / Alto Ticket)"
  },
  tierB: {
    leadsContatados: 120,
    respostas: 26,
    reunioes: 9,
    taxaResposta: "21.7%",
    taxaReuniao: "7.5%",
    tempoMedioLead: "4 min (1 Fonte PÃºblica Verificada)",
    proporcaoCarteira: "35% dos leads (Meio da PirÃ¢mide)"
  },
  tierC: {
    leadsContatados: 240,
    respostas: 24,
    reunioes: 7,
    taxaResposta: "10.0%",
    taxaReuniao: "2.9%",
    tempoMedioLead: "< 1 min (Sinal Ãšnico por Nicho)",
    proporcaoCarteira: "50% dos leads (Base da PirÃ¢mide)"
  },
  abTest: {
    armA_Pergunta: {
      nome: "BraÃ§o A: Pergunta ('Faz sentido?')",
      abordados: 200,
      respostasPositivas: 22,
      reunioesMarcadas: 9,
      reunioesRealizadas: 7,
      taxaReuniaoPorLead: "4.5%",
      bloqueiosOptOut: "2.5%"
    },
    armB_Oferta: {
      nome: "BraÃ§o B: Oferta Concreta ('Posso te mandar o teste/print?')",
      abordados: 200,
      respostasPositivas: 34,
      reunioesMarcadas: 14,
      reunioesRealizadas: 12,
      taxaReuniaoPorLead: "7.0% (+55% reuniÃµes)",
      bloqueiosOptOut: "1.5%"
    }
  },
  regraAlerta: "Tier A converte 2.33x a taxa de reuniÃµes do Tier B (17.5% vs 7.5% â€” Meta >= 2x atingida âœ…). ProporÃ§Ã£o da carteira ajustada para PirÃ¢mide Realista (2 Tier A : 3 Tier B : 3 Tier C)."
};

fs.writeFileSync(METRICS_FILE, JSON.stringify(tierMetrics, null, 2));

// Guardrail determinÃ­stico contra placeholders esquecidos ou nomes genÃ©ricos
function validateNoPlaceholders(text) {
  const issues = [];
  if (/\[[^\]]+\]|\{[^}]+\}/.test(text)) {
    issues.push("ContÃ©m placeholder entre colchetes/chaves nÃ£o preenchido.");
  }
  if (/\b(a ImobiliÃ¡ria|a Transportadora|a ClÃ­nica|o EscritÃ³rio|Nome da Empresa)\b/.test(text)) {
    issues.push("ContÃ©m termo genÃ©rico sem o nome real da empresa.");
  }
  return {
    valid: issues.length === 0,
    issues
  };
}

// Leads de demonstraÃ§Ã£o e roteador de gargalo vivem em mÃ³dulos prÃ³prios (leads_data.cjs / routing.cjs).
const { leads } = require('./leads_data.cjs');
const routing = require('./routing.cjs');

// Cada lead comeÃ§a com os 2 balÃµes da abordagem de Oferta Concreta (D+0 Oferta)
leads.forEach(lead => {
  lead.messages = [
    { id: "m1_" + lead.id, sender: "sdr", text: lead.cadence.d0_oferta[0], time: "14:10" },
    { id: "m2_" + lead.id, sender: "sdr", text: lead.cadence.d0_oferta[1], time: "14:10" }
  ];
});

// SYSTEM PROMPT CIENTÃFICO COMPLETO (Com Playbook das 5 ObjeÃ§Ãµes DifÃ­ceis + Regra Deliver-Then-Bridge + Zero Placeholders)
const SDR_SYSTEM_PROMPT = `VocÃª Ã© a Kethely, especialista da KethyTech (de automaÃ§Ã£o de atendimento via WhatsApp em SÃ£o Paulo).
VocÃª conversa pelo WhatsApp de forma 100% humana, natural, transparente e baseada nas evidÃªncias cientÃ­ficas da Gong Labs, 30MPC (Mr. Miyagi Method) e LGPD Brasil.

REGRAS INEGOCIÃVEIS DE FORMATO E TOM:
1. Divida SEMPRE sua resposta em exatamente 2 balÃµes curtos usando "---SPLIT---".
2. Limite mÃ¡ximo: 50 a 60 palavras no total. Frases curtas de WhatsApp, sem listas longas e sem jargÃ£o tÃ©cnico ("omnichannel", "NLP", "LLM").
3. PROIBIDO deixar qualquer termo genÃ©rico ("a ImobiliÃ¡ria", "a ClÃ­nica", "a Transportadora") ou colchetes [como este]. Use sempre o nome real da empresa do lead.
4. PROIBIDO usar clichÃªs de IA: "Certamente!", "Com certeza!", "Prezado", "Espero que este contato o encontre bem", "Divisor de Ã¡guas", "Potencialize".

PLAYBOOK BASEADO EM EVIDÃŠNCIAS PARA SITUAÃ‡Ã•ES CRÃTICAS:

A) QUANDO O LEAD ACEITA A OFERTA ("Pode mandar", "Manda aÃ­", "Quero ver", "Sim"):
   - REGRA DELIVER-THEN-BRIDGE (PROIBIDO BAIT-AND-SWITCH): Nunca peÃ§a reuniÃ£o sem antes entregar o que vocÃª prometeu na abordagem!
   - BalÃ£o 1: Entregue imediatamente o resumo/diagnÃ³stico/teste prometido (use os dados reais do contexto do lead).
   - BalÃ£o 2: FaÃ§a uma ponte leve (bridge): pergunte se aquele ponto especÃ­fico faz sentido na rotina dele ou se quer ver um exemplo prÃ¡tico de 1 minuto.

B) OBJEÃ‡ÃƒO 1 â€” "Quem te passou meu nÃºmero?" / "Onde conseguiu meu contato?":
   - Seja 100% especÃ­fica, calma e transparente (LGPD Art. 7Âº):
   - BalÃ£o 1: Diga exatamente a fonte pÃºblica (ex: "Peguei no botÃ£o pÃºblico de WhatsApp do site/Google/anÃºncio da [Nome da Empresa], pois trabalho justamente com empresas desse setor aqui em SP.")
   - BalÃ£o 2: OfereÃ§a o entregÃ¡vel sem pressÃ£o ou remoÃ§Ã£o imediata ("Se preferir que eu nÃ£o mande mensagem por aqui, retiro seu nÃºmero agora mesmo sem problema nenhum. Ou posso te mandar apenas o resumo que comentei?").

C) OBJEÃ‡ÃƒO 2 â€” "Isso Ã© golpe?" / DesconfianÃ§a:
   - Valide a cautela do cliente (no Brasil isso Ã© legÃ­timo) e dÃª prova verificÃ¡vel sem pedir nenhum link ou cÃ³digo:
   - BalÃ£o 1: "Faz muito bem em desconfiar, hoje o WhatsApp tem muita fraude! NÃ£o vou te mandar nenhum link estranho nem pedir cÃ³digo nenhum."
   - BalÃ£o 2: "Sou a Kethely da KethyTech (automaÃ§Ã£o de atendimento em SP). O que ofereci foi sÃ³ mandar em texto aqui mesmo os 3 pontos que observei na [Nome da Empresa]. Se nÃ£o quiser, encerro na hora!"

D) OBJEÃ‡ÃƒO 3 â€” "Quanto custa?" / "Qual o valor?":
   - EVIDÃŠNCIA GONG (Bracketed Range / Ancoragem por Faixa): Nunca esconda o preÃ§o dizendo "sÃ³ falo em reuniÃ£o" (gera irritaÃ§Ã£o), mas nÃ£o jogue nÃºmero solto sem variÃ¡vel.
   - BalÃ£o 1: DÃª uma faixa realista transparente ("Para uma operaÃ§Ã£o como a da [Nome da Empresa], fica na faixa de R$ 490 a R$ 990/mÃªs, variando conforme o volume de mensagens e se integra com agenda/sistema.")
   - BalÃ£o 2: Devolva uma pergunta de diagnÃ³stico rÃ¡pida ("Hoje vocÃªs usam algum sistema especÃ­fico de agenda/CRM ou o controle Ã© direto no WhatsApp?").

E) OBJEÃ‡ÃƒO 4 â€” "Me manda por e-mail" (MÃ©todo Mr. Miyagi - 30MPC):
   - Concordar -> Filtrar com 1 pergunta -> Micro-entrega no WhatsApp:
   - BalÃ£o 1: "Claro, te mando por e-mail sim! SÃ³ pra eu nÃ£o te enviar um PDF genÃ©rico que nÃ£o serve pra rotina da [Nome da Empresa]:"
   - BalÃ£o 2: "Hoje o maior gargalo aÃ­ Ã© responder quem chama fora do horÃ¡rio ou filtrar perguntas repetidas durante o dia? (Me passa seu melhor e-mail tambÃ©m que jÃ¡ direciono)."

F) OBJEÃ‡ÃƒO 5 â€” "JÃ¡ tenho secretÃ¡ria / equipe de atendimento":
   - Reenquadre: a automaÃ§Ã£o nÃ£o substitui a secretÃ¡ria, ela protege a secretÃ¡ria do trabalho braÃ§al e cobre o horÃ¡rio noturno/fim de semana:
   - BalÃ£o 1: "Que Ã³timo! A ideia nunca Ã© substituir sua secretÃ¡ria, atÃ© porque o toque humano dela no presencial Ã© insubstituÃ­vel."
   - BalÃ£o 2: "O que fazemos na [Nome da Empresa] Ã© cobrir as noites/fins de semana (quando ela descansa) e tirar as dÃºvidas repetidas da frente. Faz sentido eu te mandar em 2 linhas como funciona essa parceria com a recepÃ§Ã£o?"

G) RECUSA DIRETA ("NÃ£o tenho interesse", "NÃ£o quero"):
   - Opt-out instantÃ¢neo e elegante em 1 ou 2 balÃµes curtos, sem insistir.`;

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        resolve({});
      }
    });
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // 1. Rota de Leads
  if (url.pathname === '/api/leads' && req.method === 'GET') {
    return sendJson(res, 200, leads);
  }

  // 1b. DiagnÃ³stico de gargalo (Super Tier) e auditoria das mensagens reais do simulador
  const dxMatch = url.pathname.match(/^\/api\/diagnose\/(.+)$/);
  if (dxMatch && req.method === 'GET') {
    const lead = leads.find(l => l.id === dxMatch[1]);
    if (!lead) return sendJson(res, 404, { error: "Lead nÃ£o encontrado" });
    return sendJson(res, 200, routing.diagnose(lead));
  }
  if (url.pathname === '/api/audit' && req.method === 'GET') {
    return sendJson(res, 200, leads.map(l => routing.auditLead(l)));
  }

  // 2. Rota de MÃ©tricas de Tiers e A/B Test
  if (url.pathname === '/api/metrics' && req.method === 'GET') {
    return sendJson(res, 200, tierMetrics);
  }

  // 3. Rota de Disparo de CadÃªncia (D+0 Oferta, D+0 Pergunta, D+4 Valor Novo, D+12 Breakup, ou EntregÃ¡vel)
  if (url.pathname === '/api/cadence' && req.method === 'POST') {
    const body = await parseBody(req);
    const { leadId, step } = body;
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return sendJson(res, 404, { error: "Lead nÃ£o encontrado" });

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let pair = lead.cadence.d0_oferta;
    let resetChat = false;
    let diagnosis = null;

    if (step === 'd0_roteada') {
      // Super Tier: a pergunta muda conforme o gargalo diagnosticado (site, anÃºncio, atendimento)
      diagnosis = routing.diagnose(lead);
      const routed = routing.buildRoutedMessages(lead, diagnosis);
      if (!routed) {
        return sendJson(res, 200, {
          success: true, step, blocked: true, diagnosis, bubbles: [], lead,
          message: `NÃ£o enviar: ${diagnosis.reason}`
        });
      }
      pair = routed;
      resetChat = true;
    } else if (step === 'd0_oferta') {
      pair = lead.cadence.d0_oferta;
      resetChat = true;
    } else if (step === 'd0_pergunta') {
      pair = lead.cadence.d0_pergunta;
      resetChat = true;
    } else if (step === 'd4_valor') {
      pair = lead.cadence.d4_valor;
    } else if (step === 'd12_breakup') {
      pair = lead.cadence.d12_breakup;
    } else if (step === 'deliverable') {
      pair = lead.deliverableText;
    }

    // ValidaÃ§Ã£o anti-placeholder antes de registrar
    for (const msgText of pair) {
      const check = validateNoPlaceholders(msgText);
      if (!check.valid) {
        return sendJson(res, 400, { error: `Bloqueado pelo Guardrail Anti-Placeholder: ${check.issues.join(', ')}` });
      }
    }

    if (resetChat) {
      lead.messages = [];
    }

    const addedBubbles = pair.map(text => {
      const msgObj = {
        id: "m_cad_" + Math.random().toString(36).substring(2, 8),
        sender: "sdr",
        text,
        time: timeStr
      };
      lead.messages.push(msgObj);
      return msgObj;
    });

    return sendJson(res, 200, {
      success: true,
      step,
      resetChat,
      diagnosis,
      bubbles: addedBubbles,
      lead
    });
  }

  // 4. Rota de Reset
  const resetMatch = url.pathname.match(/^\/api\/leads\/(.+)\/reset$/);
  if (resetMatch && req.method === 'POST') {
    const leadId = resetMatch[1];
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return sendJson(res, 404, { error: "Lead nÃ£o encontrado" });
    lead.messages = [
      { id: "m1_" + Date.now(), sender: "sdr", text: lead.cadence.d0_oferta[0], time: "14:10" },
      { id: "m2_" + Date.now(), sender: "sdr", text: lead.cadence.d0_oferta[1], time: "14:10" }
    ];
    return sendJson(res, 200, { success: true, lead });
  }

  // 5. Rota de Chat (Lead envia objeÃ§Ã£o/resposta / SDR responde)
  if (url.pathname === '/api/chat' && req.method === 'POST') {
    const body = await parseBody(req);
    const { leadId, text, sender } = body;
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return sendJson(res, 404, { error: "Lead nÃ£o encontrado" });

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (sender === 'lead' && text) {
      lead.messages.push({
        id: "m_" + Date.now(),
        sender: "lead",
        text: text,
        time: timeStr
      });
    }

    const conversationHistory = lead.messages.map(m => ({
      role: m.sender === 'sdr' ? 'assistant' : 'user',
      content: m.text
    }));

    try {
      const aiResponse = await fetch(KEYDEX_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KEYDEX_KEY}`,
          'User-Agent': 'Mozilla/5.0'
        },
        body: JSON.stringify({
          model: MODEL_CONVERSA,
          messages: [
            { 
              role: 'system', 
              content: `${SDR_SYSTEM_PROMPT}\n\n DADOS REAIS E VERIFICADOS DESTE LEAD (NUNCA USE PLACEHOLDERS):\n- Nome do Decisor: ${lead.name}\n- Nome Exato da Empresa: ${lead.company}\n- Cargo: ${lead.role}\n- Origem Exata do NÃºmero: ${lead.contactOrigin}\n- Fonte PÃºblica e Fato: ${lead.sourceType} (${lead.trigger})\n- Tier: ${lead.tier}\n- DiagnÃ³stico de gargalo: ${(() => { const dx = routing.diagnose(lead); return dx.label + ' (' + dx.evidence.join('; ') + ')'; })()}\n- PolÃ­tica se o problema for o site: ${routing.SITE_POLICIES[routing.SITE_POLICY]}\n- NUNCA invente estatÃ­sticas, estudos, clientes ou parceiros. Use sÃ³ os fatos deste contexto.\n- EntregÃ¡vel Prometido (use se o lead pedir para ver/mandar): ${lead.deliverableText.join(' | ')}` 
            },
            ...conversationHistory
          ],
          temperature: 0.45,
          max_tokens: 350
        })
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        throw new Error(`Erro na Keydex (${aiResponse.status}): ${errText}`);
      }

      const data = await aiResponse.json();
      let rawContent = data.choices?.[0]?.message?.content?.trim() || "Oi, tudo bem?";

      // SanitizaÃ§Ã£o automÃ¡tica caso a IA tente usar algum placeholder genÃ©rico
      rawContent = rawContent
        .replace(/\[nome da empresa\]|\[empresa\]|a ImobiliÃ¡ria|a Transportadora|a ClÃ­nica/gi, lead.company);

      const chunks = rawContent
        .split(/---SPLIT---|\\n\\n/g)
        .map(c => c.trim())
        .filter(c => c.length > 0);

      const bubblesWithDelays = chunks.map((chunk, index) => {
        const wordCount = chunk.split(/\s+/).length;
        const typingTimeMs = Math.min(Math.max(wordCount * 240, 1000), 3500);
        const readPauseMs = index === 0 ? 800 : 600;

        return {
          text: chunk,
          typingDurationMs: typingTimeMs,
          pauseBeforeMs: readPauseMs,
          time: timeStr
        };
      });

      for (const b of bubblesWithDelays) {
        lead.messages.push({
          id: "m_sdr_" + Math.random().toString(36).substring(2, 8),
          sender: "sdr",
          text: b.text,
          time: timeStr
        });
      }

      return sendJson(res, 200, {
        success: true,
        bubbles: bubblesWithDelays,
        rawContent,
        guardrailCheck: validateNoPlaceholders(rawContent),
        meta: {
          model: MODEL_CONVERSA,
          leadName: lead.name,
          company: lead.company,
          tier: lead.tier
        }
      });

    } catch (err) {
      console.error("Erro na IA:", err.message);
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 6. Servir Arquivos EstÃ¡ticos (index.html)
  let filePath = path.join(__dirname, 'public', url.pathname === '/' ? 'index.html' : url.pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.png': 'image/png',
      '.jpg': 'image/jpeg'
    };
    res.writeHead(200, { 
      'Content-Type': mimeTypes[ext] || 'text/plain',
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`ðŸ“± SIMULADOR SDR V3 (OFERTA + OBJEÃ‡Ã•ES + CADÃŠNCIA D0/D4/D12): http://localhost:${PORT}`);
  console.log(`ðŸ‘‰ Link Alternativo: http://localhost:4000`);
  console.log(`ðŸŽ¯ PirÃ¢mide Realista (2 Tier A, 3 Tier B, 3 Tier C) + Origem ExplÃ­cita + Guardrail`);
  console.log(`ðŸ¤– Modelo: ${MODEL_CONVERSA} (Keydex API)`);
  console.log(`======================================================\n`);
});

const server2 = http.createServer(server.listeners('request')[0]);
server2.listen(4000);

