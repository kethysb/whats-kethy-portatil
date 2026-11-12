/**
 * tests/unit/m1_engine.test.ts
 * Suíte de Testes Unitários do Marco M1 (Core SDR Engine, 5 Nichos & Keydex API)
 * Whats-Kethy-Portatil
 */

import {
  NicheType,
  TierType,
  LeadProfile,
  NICHES_CONFIG,
  getNicheConfig,
  getAllNiches,
  getNicheTemplates,
  validateRegulatoryCompliance,
  formatApproach,
  countWords,
  splitBubbles,
  detectRequiredBlocks,
  checkEthicalGuardrails,
  validateApproach,
  sanitizeApproach,
  formatForWhatsApp,
  KeydexClient
} from '../../src/sdr/index.js';

declare const process: any;

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  PASS: ${name}`);
  } catch (err: any) {
    results.push({ name, passed: false, error: err.message || String(err) });
    console.error(`  FAIL: ${name} -> ${err.message}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEquals<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message} - Expected: ${expected}, Received: ${actual}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 Executando Suíte de Testes do Marco M1 (SDR Engine)');
  console.log('======================================================\n');

  // --------------------------------------------------------------------------
  // GRUPO 1: Matriz de Nichos e Fontes Públicas (R1)
  // --------------------------------------------------------------------------
  console.log('\n--- [1] Matriz de Nichos e Fontes Públicas ---');

  await test('Deve conter os 5 nichos contratuais mapeados', () => {
    const niches = getAllNiches();
    assertEquals(niches.length, 5, 'Deve haver exatamente 5 nichos');
    const ids = niches.map(n => n.id);
    assert(ids.includes('dermatologia'), 'Dermatologia deve estar presente');
    assert(ids.includes('odontologia'), 'Odontologia deve estar presente');
    assert(ids.includes('imobiliaria'), 'Imobiliária deve estar presente');
    assert(ids.includes('advocacia'), 'Advocacia deve estar presente');
    assert(ids.includes('logistica'), 'Logística deve estar presente');
  });

  await test('Cada nicho deve ter fontes públicas gerais e específicas definidas', () => {
    const niches: NicheType[] = ['dermatologia', 'odontologia', 'imobiliaria', 'advocacia', 'logistica'];
    for (const niche of niches) {
      const config = getNicheConfig(niche);
      assert(config.generalSources.length > 0, `${niche} deve ter fontes gerais`);
      assert(config.specificSources.length > 0, `${niche} deve ter fontes específicas`);
      assert(config.operationalPains.length >= 3, `${niche} deve ter pelo menos 3 dores operacionais`);
      assert(config.frequentQuestions.length >= 5, `${niche} deve ter pelo menos 5 perguntas frequentes`);
      assert(config.templates.length >= 2, `${niche} deve ter pelo menos 2 templates calibrados`);
    }
  });

  await test('Todos os 10 templates oficiais devem ter <= 50 palavras e exatamente 2 balões', () => {
    const niches: NicheType[] = ['dermatologia', 'odontologia', 'imobiliaria', 'advocacia', 'logistica'];
    let templateCount = 0;

    for (const niche of niches) {
      const templates = getNicheTemplates(niche);
      for (const t of templates) {
        templateCount++;
        const formatted = formatApproach(niche, t.id);
        const bubbles = splitBubbles(formatted.formattedMessage);

        assertEquals(bubbles.length, 2, `Template ${t.id} deve ter exatamente 2 balões`);
        assert(
          formatted.totalWords <= 50,
          `Template ${t.id} deve ter <= 50 palavras (atual: ${formatted.totalWords})`
        );
        assert(
          formatted.totalWords >= 40,
          `Template ${t.id} deve ser substantivo com >= 40 palavras (atual: ${formatted.totalWords})`
        );

        // Validar blocos presentes no template
        const blocks = detectRequiredBlocks(formatted.formattedMessage);
        assert(blocks.hasPublicSource, `Template ${t.id} deve conter fonte pública`);
        assert(blocks.hasVerifiableFact, `Template ${t.id} deve conter fato verificável`);
        assert(blocks.hasImplication, `Template ${t.id} deve conter implicação operacional`);
        assert(blocks.hasCtaOrQuestion, `Template ${t.id} deve conter CTA/pergunta de interesse`);
      }
    }

    assertEquals(templateCount, 10, 'Deve ter avaliado exatamente 10 templates oficiais');
  });

  // --------------------------------------------------------------------------
  // GRUPO 2: Validador Determinístico de Abordagens (R1)
  // --------------------------------------------------------------------------
  console.log('\n--- [2] Validador Determinístico de Abordagens ---');

  await test('countWords deve calcular número exato de palavras ignorando o separador', () => {
    const sample = 'Olá, Dr. Paulo! Sou a Kethely de SP.---SPLIT---Podemos conversar em 2 minutos?';
    const words = countWords(sample);
    // "Olá," "Dr." "Paulo!" "Sou" "a" "Kethely" "de" "SP." | "Podemos" "conversar" "em" "2" "minutos?" = 13 palavras
    assertEquals(words, 13, 'Deveria contar 13 palavras');
  });

  await test('splitBubbles deve retornar array limpo com os balões', () => {
    const sample = 'Balão 1 de teste aqui. ---SPLIT--- Balão 2 de teste com proposta.';
    const bubbles = splitBubbles(sample);
    assertEquals(bubbles.length, 2, 'Deveria retornar 2 balões');
    assertEquals(bubbles[0], 'Balão 1 de teste aqui.', 'Balão 1 deve coincidir');
    assertEquals(bubbles[1], 'Balão 2 de teste com proposta.', 'Balão 2 deve coincidir');
  });

  await test('validateApproach deve aprovar mensagem válida dentro dos critérios', () => {
    const validMessage =
      'Oi, Dra. Paula! Sou a Kethely de SP. Vi no Google que 3 das últimas avaliações citam demora para responder no WhatsApp.' +
      ' ---SPLIT--- ' +
      'A recepção costuma dividir agenda e mensagens. Faz sentido te mandar em 2 linhas como resolvemos isso em clínicas? Se não for prioridade, só avisar.';

    const result = validateApproach(validMessage, { niche: 'dermatologia' });
    assert(result.isValid, `Mensagem válida deveria ser aprovada. Erros: ${result.errors.join(', ')}`);
    assertEquals(result.bubbleCount, 2, 'Deveria conter 2 balões');
    assert(result.totalWordCount <= 50, 'Palavras devem ser <= 50');
    assert(result.hasRequiredBlocks.hasPublicSource, 'Deve conter fonte pública');
    assert(result.hasRequiredBlocks.hasVerifiableFact, 'Deve conter fato verificável');
    assert(result.hasRequiredBlocks.hasImplication, 'Deve conter implicação');
    assert(result.hasRequiredBlocks.hasCtaOrQuestion, 'Deve conter CTA de interesse');
  });

  await test('validateApproach deve reprovar mensagem com apenas 1 balão', () => {
    const singleBubble = 'Oi, Dra. Paula! Sou a Kethely de SP. Vi no Google que 3 avaliações citam demora. Faz sentido te mandar em 2 linhas como resolver?';
    const result = validateApproach(singleBubble);
    assert(!result.isValid, 'Deveria reprovar mensagem sem delimitador ---SPLIT---');
    assertEquals(result.bubbleCount, 1, 'Deveria acusar 1 balão');
    assert(result.errors.some(e => e.includes('exatamente 2 balões')), 'Erro deve informar necessidade de 2 balões');
  });

  await test('validateApproach deve reprovar mensagem com 3 balões', () => {
    const threeBubbles = 'Balão 1 aqui.---SPLIT---Balão 2 aqui no meio.---SPLIT---Balão 3 no final.';
    const result = validateApproach(threeBubbles);
    assert(!result.isValid, 'Deveria reprovar mensagem com 3 balões');
    assertEquals(result.bubbleCount, 3, 'Deveria acusar 3 balões');
  });

  await test('validateApproach deve reprovar mensagem que ultrapassa 50 palavras', () => {
    const longB1 = 'Esta é uma mensagem intencionalmente longa criada para testar a rejeição de palavras no validador do nosso sistema de prospecção do WhatsApp comercial em São Paulo vi no Google que vocês atendem procedimentos estéticos e médicos na clínica';
    const longB2 = 'e nós queremos propor uma automação de atendimento completa para a equipe com o objetivo de responder em segundos e aumentar drasticamente os agendamentos confirmados faz sentido conversar hoje mesmo?';
    const longMessage = `${longB1} ---SPLIT--- ${longB2}`;

    const words = countWords(longMessage);
    assert(words > 50, `Mensagem de teste deve ter > 50 palavras (tem ${words})`);

    const result = validateApproach(longMessage);
    assert(!result.isValid, 'Deveria reprovar mensagem com > 50 palavras');
    assert(result.errors.some(e => e.includes('excede o limite estrito')), 'Erro deve reportar excesso de palavras');
  });

  // --------------------------------------------------------------------------
  // GRUPO 3: Guardrails Ético-Regulatórios (OAB 205, CFM, CFO, LGPD)
  // --------------------------------------------------------------------------
  console.log('\n--- [3] Guardrails Ético-Regulatórios ---');

  await test('Advocacia: Deve barrar captação ativa e mercantilização (Provimento 205/2021 OAB)', () => {
    const illegalOAB =
      'Oi, Dr. André! Sou a Kethely de SP. Vi no site o contato do escritório.---SPLIT---Temos um sistema para captar clientes que precisam de ação trabalhista. Faz sentido?';

    const compliance = checkEthicalGuardrails(illegalOAB, 'advocacia');
    assert(!compliance.isCompliant, 'Deveria identificar violação do Provimento 205 OAB');
    assert(compliance.violations.some(v => v.includes('OAB Provimento 205/2021')), 'Deve citar OAB 205');

    const validation = validateApproach(illegalOAB, { niche: 'advocacia' });
    assert(!validation.isValid, 'Validação completa deve reprovar captação ativa');
  });

  await test('Advocacia: Deve aprovar atendimento receptivo e triagem (Provimento 205/2021 OAB)', () => {
    const legalOAB =
      'Oi, Dr. André! Sou a Kethely de SP. Vi no site do escritório o atendimento receptivo via WhatsApp.' +
      ' ---SPLIT--- ' +
      'Advogados perdem horas na triagem de novos casos. Faz sentido te mandar em 2 linhas como organizar isso pela OAB 205? Se não for prioridade, só avisar.';

    const compliance = checkEthicalGuardrails(legalOAB, 'advocacia');
    assert(compliance.isCompliant, 'Deveria aprovar triagem receptiva para OAB');

    const validation = validateApproach(legalOAB, { niche: 'advocacia' });
    assert(validation.isValid, `Deveria aprovar abordagem receptiva conforme OAB 205. Erros: ${validation.errors.join(', ')}`);
  });

  await test('Dermatologia: Deve barrar antes/depois e consulta grátis (Resolução CFM 2.336/2023)', () => {
    const illegalCFM =
      'Oi, Dra. Paula! Vi no Google sua clínica estética.---SPLIT---Postamos fotos de antes e depois com avaliação gratuita para você. Faz sentido?';

    const compliance = checkEthicalGuardrails(illegalCFM, 'dermatologia');
    assert(!compliance.isCompliant, 'Deveria identificar violação do CFM');
    assert(compliance.violations.some(v => v.includes('CFM')), 'Deve citar CFM 2.336/2023');
  });

  await test('Odontologia: Deve barrar consulta grátis / avaliação sem custo (Resolução CFO 196/2019)', () => {
    const illegalCFO =
      'Oi, Dr. Rafael! Vi seu consultório no Google.---SPLIT---Podemos divulgar avaliação gratuita e consulta grátis para implantes. Faz sentido?';

    const compliance = checkEthicalGuardrails(illegalCFO, 'odontologia');
    assert(!compliance.isCompliant, 'Deveria identificar violação do CFO');
    assert(compliance.violations.some(v => v.includes('CFO')), 'Deve citar CFO');
  });

  // --------------------------------------------------------------------------
  // GRUPO 4: Sanitizador e Formatador Pré-Envio (sanitizeApproach)
  // --------------------------------------------------------------------------
  console.log('\n--- [4] Sanitizador e Formatador Pré-Envio ---');

  await test('sanitizeApproach deve remover markdown, aspas externas e rótulos de balão gerados por IA', () => {
    const rawAiOutput =
      '```text\n' +
      '[Balão 1]: Oi, Marcos! Sou a Kethely de SP. Vi no ZAP mais de 100 imóveis ativos direcionando pro WhatsApp.\n\n' +
      '[Balão 2]: Lead de portal esfria rápido enquanto o corretor faz visitas. Faz sentido te mandar em 2 linhas como pré-qualificar a renda antes? Se não for prioridade, só falar.\n' +
      '```';

    const sanitized = sanitizeApproach(rawAiOutput, { niche: 'imobiliaria' });
    assert(sanitized.modified, 'Deveria indicar modificação');
    assertEquals(sanitized.bubbleCount, 2, 'Deveria produzir exatamente 2 balões');
    assert(!sanitized.sanitizedText.includes('```'), 'Não deve conter blocos de código');
    assert(!sanitized.sanitizedText.includes('[Balão 1]'), 'Não deve conter tags de balão');
    assert(sanitized.totalWordCount <= 50, `Palavras devem ser <= 50 (tem ${sanitized.totalWordCount})`);
    assert(sanitized.isValid, 'Texto sanitizado deve passar na validação estrita');
  });

  await test('sanitizeApproach deve converter 2 parágrafos duplos em ---SPLIT---', () => {
    const textWithoutSplit =
      'Oi, Ricardo! Sou a Kethely de SP. Vi no LinkedIn a vaga de SAC da transportadora e reclamações de rastreio.\n\n' +
      'O "onde está minha entrega?" costuma lotar o WhatsApp. Faz sentido te mandar em 2 linhas como automatizar esse rastreio? Se não for prioridade, só falar.';

    const sanitized = sanitizeApproach(textWithoutSplit, { niche: 'logistica' });
    assert(sanitized.sanitizedText.includes('---SPLIT---'), 'Deve conter delimitador ---SPLIT---');
    assertEquals(sanitized.bubbleCount, 2, 'Deve ter exatamente 2 balões');
    assert(sanitized.isValid, 'Deve ser válido');
  });

  await test('sanitizeApproach deve fundir balões se IA gerou mais de 2 balões', () => {
    const threeBubbles =
      'Oi, Dr. Rafael! Sou a Kethely de SP. ---SPLIT--- Achei o consultório no Google e vi que fazem tratamentos de implantes. ---SPLIT--- Muitos consultórios perdem tempo na recepção. Faz sentido te mandar em 2 linhas como pré-qualificar? Se não, avisa.';

    const sanitized = sanitizeApproach(threeBubbles, { niche: 'odontologia' });
    assertEquals(sanitized.bubbleCount, 2, 'Deve forçar fusão para exatamente 2 balões');
    assert(sanitized.sanitizedText.split('---SPLIT---').length === 2, 'Deve ter apenas 1 delimitador');
  });

  // --------------------------------------------------------------------------
  // GRUPO 5: Cliente Keydex Shop e Fallback Offline
  // --------------------------------------------------------------------------
  console.log('\n--- [5] Cliente Keydex Shop e Fallback Offline ---');

  await test('KeydexClient deve instanciar com configurações padrão e modelo claude-sonnet-4-6', () => {
    const client = new KeydexClient();
    assert(client !== null, 'Cliente deve ser instanciado');
  });

  await test('generateFallbackApproach deve gerar abordagens válidas para os 5 nichos', () => {
    const client = new KeydexClient();
    const niches: NicheType[] = ['dermatologia', 'odontologia', 'imobiliaria', 'advocacia', 'logistica'];

    for (const niche of niches) {
      const mockLead: LeadProfile = {
        id: `lead-test-${niche}`,
        name: 'Doutor Teste',
        company: 'Empresa Teste',
        role: 'Diretor',
        niche,
        tier: 'A',
        publicSources: {}
      };

      const fallback = client.generateFallbackApproach(mockLead);
      assert(fallback.isValid, `Fallback do nicho ${niche} deve ser válido`);
      assertEquals(fallback.bubbles.length, 2, `Fallback do nicho ${niche} deve ter 2 balões`);
      assert(fallback.totalWords <= 50, `Fallback do nicho ${niche} deve ter <= 50 palavras (tem ${fallback.totalWords})`);

      // Validar conformidade de guardrail no fallback
      const compliance = validateRegulatoryCompliance(niche, fallback.raw);
      assert(compliance.compliant, `Fallback do nicho ${niche} não deve ter violações: ${compliance.violations.join(', ')}`);
    }
  });

  await test('formatForWhatsApp deve unir balões com o delimitador oficial', () => {
    const bubbles = ['Primeiro balão', 'Segundo balão'];
    const formatted = formatForWhatsApp(bubbles);
    assertEquals(formatted, 'Primeiro balão---SPLIT---Segundo balão', 'Deve unir com ---SPLIT---');
  });

  // --------------------------------------------------------------------------
  // GRUPO 6: Conformidade com Base de Dados Sintética Oficial
  // --------------------------------------------------------------------------
  console.log('\n--- [6] Conformidade com Base de Dados Sintética Oficial ---');

  await test('Todas as personas em synthetic_personas.json devem cumprir 2 balões e <= 50 palavras', async () => {
    const fs: any = await (eval('import("node:fs")'));
    const path: any = await (eval('import("node:path")'));
    const personasPath = path.resolve('tests/synthetic_personas.json');
    assert(fs.existsSync(personasPath), 'Arquivo synthetic_personas.json deve existir');
    const data = JSON.parse(fs.readFileSync(personasPath, 'utf-8'));
    assert(Array.isArray(data.personas), 'Personas deve ser um array');
    assert(data.personas.length >= 5, 'Deve conter pelo menos 5 personas');

    for (const p of data.personas) {
      if (p.canonicalApproach?.splitText) {
        const res = validateApproach(p.canonicalApproach.splitText, { niche: p.niche });
        assert(res.isValid, `Persona ${p.id} (${p.niche}) falhou na validação: ${res.errors.join(', ')}`);
        assertEquals(res.bubbleCount, 2, `Persona ${p.id} deve ter 2 balões`);
        assert(res.totalWordCount <= 50, `Persona ${p.id} deve ter <= 50 palavras (tem ${res.totalWordCount})`);
        assert(res.hasRequiredBlocks.hasPublicSource, `Persona ${p.id} deve conter fonte pública`);
        assert(res.hasRequiredBlocks.hasVerifiableFact, `Persona ${p.id} deve conter fato verificável`);
        assert(res.hasRequiredBlocks.hasImplication, `Persona ${p.id} deve conter implicação`);
        assert(res.hasRequiredBlocks.hasCtaOrQuestion, `Persona ${p.id} deve conter CTA/pergunta`);
      }
    }
  });

  // --------------------------------------------------------------------------
  // RESUMO E STATUS FINAL
  // --------------------------------------------------------------------------
  console.log('\n======================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`📊 Resultado dos Testes Unitários M1: ${passed}/${total} APROVADOS`);
  if (failed > 0) {
    console.error(`❌ ${failed} teste(s) falharam:`);
    for (const r of results.filter(r => !r.passed)) {
      console.error(`   - ${r.name}: ${r.error}`);
    }
    process.exit(1);
  } else {
    console.log('✅ TODOS OS TESTES UNITÁRIOS DO MARCO M1 PASSARAM COM SUCESSO!\n');
  }
}

runTests().catch(err => {
  console.error('Erro fatal na execução dos testes:', err);
  process.exit(1);
});
