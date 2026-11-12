#!/usr/bin/env node

/**
 * WhatsApp SDR Whats-Kethy-Portatil - E2E Test Runner
 * Suíte de Testes Ponta a Ponta Opace e Independente
 * 
 * Uso:
 *   node tests/e2e/test_runner.cjs
 *   node tests/e2e/test_runner.cjs --tier 1
 *   node tests/e2e/test_runner.cjs --tier 2
 *   node tests/e2e/test_runner.cjs --tier 3
 *   node tests/e2e/test_runner.cjs --tier 4
 *   node tests/e2e/test_runner.cjs --filter "OAB"
 *   node tests/e2e/test_runner.cjs --json
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { performance } = require('perf_hooks');

// Cores ANSI para saída no terminal
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  bgGreen: "\x1b[42m\x1b[30m",
  bgRed: "\x1b[41m\x1b[37m"
};

class TestContext {
  constructor(suiteName, filterRegex = null) {
    this.suiteName = suiteName;
    this.filterRegex = filterRegex;
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
    this.assertionsCount = 0;
  }

  async test(name, fn) {
    if (this.filterRegex && !this.filterRegex.test(name)) {
      this.skipped++;
      return;
    }

    const start = performance.now();
    try {
      await fn();
      const duration = (performance.now() - start).toFixed(2);
      this.passed++;
      this.tests.push({ name, status: 'pass', duration, error: null });
      console.log(`    ${colors.green}✔${colors.reset} ${name} ${colors.dim}(${duration}ms)${colors.reset}`);
    } catch (err) {
      const duration = (performance.now() - start).toFixed(2);
      this.failed++;
      this.tests.push({ name, status: 'fail', duration, error: err });
      console.log(`    ${colors.red}✖${colors.reset} ${colors.bold}${name}${colors.reset} ${colors.dim}(${duration}ms)${colors.reset}`);
      console.log(`      ${colors.red}Erro: ${err.message}${colors.reset}`);
      if (err.stack && !err.message.includes('AssertionError')) {
        console.log(`      ${colors.dim}${err.stack.split('\n').slice(1, 3).join('\n')}${colors.reset}`);
      }
    }
  }

  ok(condition, message) {
    this.assertionsCount++;
    assert.ok(condition, message);
  }

  strictEqual(actual, expected, message) {
    this.assertionsCount++;
    assert.strictEqual(actual, expected, message);
  }

  deepStrictEqual(actual, expected, message) {
    this.assertionsCount++;
    assert.deepStrictEqual(actual, expected, message);
  }

  assert(condition, message) {
    this.assertionsCount++;
    assert.ok(condition, message);
  }

  throws(fn, expected, message) {
    this.assertionsCount++;
    assert.throws(fn, expected, message);
  }
}

async function run() {
  const args = process.argv.slice(2);
  let tierFilter = null;
  let filterRegex = null;
  let jsonOutput = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tier' || args[i] === '-t') {
      tierFilter = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--filter' || args[i] === '-f') {
      filterRegex = new RegExp(args[i + 1], 'i');
      i++;
    } else if (args[i] === '--json') {
      jsonOutput = true;
    }
  }

  const suitesToRun = [
    { tier: 1, file: './tier1_feature_coverage.test.cjs' },
    { tier: 2, file: './tier2_boundary_corner.test.cjs' },
    { tier: 3, file: './tier3_cross_feature.test.cjs' },
    { tier: 4, file: './tier4_real_world_scenarios.test.cjs' }
  ].filter(s => tierFilter === null || s.tier === tierFilter);

  if (!jsonOutput) {
    console.log(`\n${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}  WHATSAPP SDR WHATS-KETHY-PORTATIL - SUÍTE DE TESTES E2E (4 TIERS)  ${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
    console.log(`Início: ${new Date().toISOString()}`);
    if (tierFilter) console.log(`Filtro: Apenas Tier ${tierFilter}`);
    if (filterRegex) console.log(`Filtro por nome: ${filterRegex}`);
    console.log(``);
  }

  const overallStart = performance.now();
  const results = [];

  for (const item of suitesToRun) {
    const fullPath = path.resolve(__dirname, item.file);
    if (!fs.existsSync(fullPath)) {
      console.error(`${colors.red}Arquivo de suite não encontrado: ${fullPath}${colors.reset}`);
      continue;
    }

    const suiteModule = require(fullPath);
    const context = new TestContext(suiteModule.name, filterRegex);

    if (!jsonOutput) {
      console.log(`\n${colors.bold}${colors.yellow}► Executando: [Tier ${item.tier}] ${suiteModule.name}${colors.reset}`);
    }

    await suiteModule.run(context);
    results.push({
      tier: item.tier,
      name: suiteModule.name,
      passed: context.passed,
      failed: context.failed,
      skipped: context.skipped,
      assertions: context.assertionsCount,
      tests: context.tests
    });
  }

  const totalDuration = (performance.now() - overallStart).toFixed(2);
  const totalPassed = results.reduce((acc, r) => acc + r.passed, 0);
  const totalFailed = results.reduce((acc, r) => acc + r.failed, 0);
  const totalSkipped = results.reduce((acc, r) => acc + r.skipped, 0);
  const totalTests = totalPassed + totalFailed;
  const passRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;

  if (jsonOutput) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      durationMs: parseFloat(totalDuration),
      summary: { totalTests, totalPassed, totalFailed, totalSkipped, passRate: `${passRate}%` },
      suites: results
    }, null, 2));
  } else {
    console.log(`\n${colors.bold}----------------------------------------------------------------------${colors.reset}`);
    console.log(`${colors.bold}RESUMO DE EXECUÇÃO POR TIER METODOLÓGICO:${colors.reset}`);
    console.log(`----------------------------------------------------------------------`);
    for (const r of results) {
      const badge = r.failed === 0 ? `${colors.green}[PASS]${colors.reset}` : `${colors.red}[FAIL]${colors.reset}`;
      console.log(`  Tier ${r.tier}: ${r.name.padEnd(42)} ${badge}  ${r.passed} passaram, ${r.failed} falharam (${r.assertions} asserções)`);
    }
    console.log(`----------------------------------------------------------------------`);
    console.log(`Total de Testes Executados: ${colors.bold}${totalTests}${colors.reset}`);
    console.log(`Passaram: ${colors.green}${colors.bold}${totalPassed}${colors.reset} | Falharam: ${totalFailed > 0 ? colors.red : colors.green}${colors.bold}${totalFailed}${colors.reset} | Taxa de Aprovação: ${colors.bold}${passRate}%${colors.reset}`);
    console.log(`Tempo Total de Execução: ${totalDuration}ms`);
    console.log(`----------------------------------------------------------------------\n`);

    if (totalFailed === 0) {
      console.log(`${colors.bgGreen}${colors.bold}  SUCESSO: 100% DOS TESTES E2E APROVADOS!  ${colors.reset}\n`);
    } else {
      console.log(`${colors.bgRed}${colors.bold}  FALHA: ${totalFailed} TESTE(S) E2E FALHARAM!  ${colors.reset}\n`);
    }
  }

  process.exit(totalFailed === 0 ? 0 : 1);
}

run().catch(err => {
  console.error("Erro fatal no test runner:", err);
  process.exit(1);
});
