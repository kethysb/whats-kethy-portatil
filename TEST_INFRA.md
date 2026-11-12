# Test Infrastructure Specification — Whats-Kethy-Portatil

## 1. Visão Geral e Filosofia de Testes

A suíte de testes E2E do **Whats-Kethy-Portatil** foi projetada para ser **opaca, determinística e independente**, validando os requisitos especificados em `ORIGINAL_REQUEST.md` e `PROJECT.md` sem depender de acoplamento a implementações internas de produção.

A arquitetura de testes cobre os 4 tiers metodológicos:
1. **Tier 1: Feature Coverage** (Cobertura canônica de todas as features para os 5 nichos, fontes públicas brasileiras, 4 blocos obrigatórios, 2 balões, <= 50 palavras, Provimento 205 OAB, Tiers A/B/C, persistência, ajuste dinâmico 2x, mystery shopping e reciprocidade).
2. **Tier 2: Boundary & Corner Cases** (Valores limite de 50 e 51 palavras, 1 balão vs 3 balões, strings vazias, divisão por zero em taxas, limiares exatos de 1.99x e 2.01x no ajuste dinâmico, tempos de resposta extremos e violações éticas CFM/CFO/OAB/LGPD).
3. **Tier 3: Cross-Feature Combinations** (Interações entre pares e fluxos integrados como Advocacia + Tier A + OAB 205, Imobiliária + Mystery Shopping + Portais ZAP, Logística + Reclame Aqui + Ajuste Dinâmico).
4. **Tier 4: Real-World Application Scenarios** (Conversações completas e realistas simulando múltiplos turnos de prospecção nos 5 nichos com respostas a objeções, LGPD e agendamento de reuniões).

---

## 2. Estrutura de Arquivos

```
Whats-Kethy-Portatil/
├── tests/
│   ├── synthetic_personas.json               # Base oficial de 8 personas completas nos 5 nichos e 3 tiers
│   └── e2e/
│       ├── test_runner.cjs                   # Test runner executável CLI (Node.js nativo, zero dependências externas)
│       ├── helpers/
│       │   ├── approach_validator.cjs        # Oráculo de validação dos 4 blocos, 2 balões, <= 50 palavras e guardrails
│       │   ├── tier_calculator.cjs           # Oráculo matemático de taxas e algoritmo de ajuste dinâmico 2x
│       │   └── mystery_shopping_validator.cjs# Oráculo de estrutura e transparência do Mystery Shopping
│       ├── tier1_feature_coverage.test.cjs   # 50 testes de cobertura de features (F1 a F10)
│       ├── tier2_boundary_corner.test.cjs    # 35 testes de limites e corner cases (B1 a B7)
│       ├── tier3_cross_feature.test.cjs      # 10 testes de combinações cruzadas (C1 a C10)
│       └── tier4_real_world_scenarios.test.cjs# 5 testes de cenários realistas de aplicação (S1 a S5)
├── TEST_INFRA.md                             # Especificação da infraestrutura (este documento)
└── TEST_READY.md                             # Prontidão e relatório de execução dos testes
```

---

## 3. Como Executar os Testes

O test runner utiliza apenas módulos nativos do Node.js (`assert`, `path`, `fs`, `perf_hooks`), garantindo execução imediata em qualquer ambiente sem necessidade de instalar pacotes adicionais via npm.

### Execução Completa (100 Testes)
```bash
node tests/e2e/test_runner.cjs
```

### Execução por Tier Específico
```bash
# Executar apenas Tier 1: Feature Coverage
node tests/e2e/test_runner.cjs --tier 1

# Executar apenas Tier 2: Boundary & Corner Cases
node tests/e2e/test_runner.cjs --tier 2

# Executar apenas Tier 3: Cross-Feature Combinations
node tests/e2e/test_runner.cjs --tier 3

# Executar apenas Tier 4: Real-World Application Scenarios
node tests/e2e/test_runner.cjs --tier 4
```

### Filtro por Nome ou Expressão Regular
```bash
# Executar apenas testes que contenham "OAB"
node tests/e2e/test_runner.cjs --filter "OAB"

# Executar testes de persistência
node tests/e2e/test_runner.cjs --filter "persistência"
```

### Saída Estruturada em JSON
```bash
node tests/e2e/test_runner.cjs --json
```

---

## 4. Detalhamento dos 4 Tiers Metodológicos

### Tier 1: Feature Coverage (50 Testes | 338 Asserções)
- **F1 (5 Nichos)**: Validação canônica de personas para Dermatologia, Odontologia, Imobiliária, Advocacia e Logística.
- **F2 (Matriz de Fontes Públicas)**: Mapeamento de Google Perfil, Doctoralia, ZAP/VivaReal, Meta Ads Library, Vagas de SAC e Reclame Aqui.
- **F3 (4 Blocos Obrigatórios)**: Detecção e decomposição dos blocos: `[Fonte pública] + [fato verificável] + [implicação] + [CTA de interesse]`.
- **F4 (2 Balões e <= 50 Palavras)**: Validação estrita do separador `---SPLIT---` e contagem de palavras Unicode.
- **F5 (Provimento 205 OAB e Guardrails Éticos)**: Bloqueio de captação ativa, veto a consulta grátis pelo CFO, veto a promessas de resultado pelo CFM e cláusula de saída LGPD.
- **F6 (Estratégia de Tiers A/B/C)**: Qualificação de leads, cotas de alocação de tempo (50% A, 30% B, 20% C).
- **F7 (Persistência Estruturada)**: Registro e acompanhamento de 4 a 6 semanas de métricas em `metrics_tiers.json`.
- **F8 (Ajuste Dinâmico 2x)**: Avaliação da condição `convRate(Tier A) < 2 * convRate(Tier B)` e rebalanceamento automático de tempo.
- **F9 (Mystery Shopping Ético)**: Pergunta não fictícia, medição em minutos, transparência no início da abordagem.
- **F10 (CTAs de Reciprocidade)**: 3 formatos: print do tempo medido, mini diagnóstico em 3 linhas e lista das 5 perguntas repetidas.

### Tier 2: Boundary & Corner Cases (35 Testes | 89 Asserções)
- **B1 (Limites de Palavras)**: Exatamente 50 palavras (aprovado), 51 palavras (rejeitado), 49 palavras (aprovado), 0 palavras (rejeitado), tratamento de espaços múltiplos.
- **B2 (Limites de Balões)**: 2 balões (aprovado), 1 balão (rejeitado), 3 balões (rejeitado), 4 balões (rejeitado), balão em branco (rejeitado), quebra `\n\n` (suportado).
- **B3 (Ausência de Blocos)**: Detecção individual de falta de Fonte, Fato, Implicação ou CTA; rejeição de abordagens genéricas de robô.
- **B4 (Métricas e Divisão por Zero)**: 0 contatos abordados protegido contra `NaN`/`Infinity`; valores nulos, negativos ou 100% de conversão.
- **B5 (Limiares de Ajuste Dinâmico)**: 1.99x (dispara ajuste), 2.01x (mantém), Tier B com 0% (sem divisão por zero), ambos com 0%, amostra mínima de 10 contatos.
- **B6 (Limites de Mystery Shopping)**: 0 minutos (bot imediato), 14400 minutos (10 dias sem resposta), mini diagnóstico com 2 ou 4 linhas (rejeitados), 4 perguntas frequentes (rejeitado).
- **B7 (Limites Éticos)**: Bloqueio de "indenização garantida" (OAB 205), "limpeza grátis se vier" (CFO), "resultado perfeito garantido" (CFM) e abordagem intimidatória sem saída.

### Tier 3: Cross-Feature Combinations (10 Testes | 76 Asserções)
- **C1**: Advocacia + Tier A + Provimento 205 OAB + 4 Blocos + 2 Balões.
- **C2**: Imobiliária + Mystery Shopping + Portais ZAP + CTA Reciprocidade.
- **C3**: Logística + Reclame Aqui + Vagas SAC + Tier B + Ajuste Dinâmico.
- **C4**: Dermatologia + Meta Ads Library + Reciprocidade (Mini Diagnóstico 3 Linhas).
- **C5**: Odontologia + Mystery Shopping + CFO (Sem Consulta Grátis) + Persistência.
- **C6**: Persistência Semanal de 6 Semanas com Marco de Avaliação Dinâmica na Semana 4.
- **C7**: Advocacia + 5 Perguntas Repetidas + Resposta de Opt-out LGPD.
- **C8**: Imobiliária + Tier C + Instagram Bio + Reciprocidade (Filtro de Curiosos).
- **C9**: Consistência Holística dos 5 Nichos simultaneamente.
- **C10**: Consistência e integração com o arquivo `simulator/metrics_tiers.json`.

### Tier 4: Real-World Application Scenarios (5 Testes | 43 Asserções)
- **S1 (Dermatologia - Dra. Paula)**: Abordagem fria -> Ceticismo inicial da médica -> Esclarecimento transparente LGPD -> Envio do resumo em 3 tópicos -> Proposta de vídeo de 1 minuto -> Reunião agendada -> Registro de métrica Tier A.
- **S2 (Odontologia - Dr. Rafael)**: Abordagem Mystery Shopping -> Dúvida do dentista sobre consulta grátis -> Reafirmação da vedação do CFO -> Envio do print do teste -> Reunião agendada.
- **S3 (Imobiliária - Marcos)**: Abordagem Portais ZAP -> Objeção "sem tempo no fechamento de mês" -> Saída honrosa sem insistência -> Reativação cordial do lead para contato futuro.
- **S4 (Advocacia - Dr. André)**: Abordagem triagem receptiva -> Questionamento rígido sobre Provimento 205 OAB -> Esclarecimento técnico de triagem interna de andamentos -> Reunião agendada.
- **S5 (Logística - Ricardo)**: Abordagem Vagas SAC -> Dor de rastreio de carga confirmada -> Apresentação de automação em 3 passos -> Agendamento técnico com supervisor operacional.

---

## 5. Oráculos de Validação e Derivação de Saídas

Todas as asserções são comparadas contra regras formais derivadas diretamente de `ORIGINAL_REQUEST.md` e `PROJECT.md`:

| Feature | Fonte Autoritativa | Regra de Validação / Oráculo |
|---------|-------------------|-----------------------------|
| 2 Balões | ORIGINAL_REQUEST.md R1 | Exatamente 2 balões delimitados por `---SPLIT---` ou `\n\n` |
| <= 50 Palavras | ORIGINAL_REQUEST.md R1 | Contagem total de palavras no texto somado das duas mensagens <= 50 |
| 4 Blocos | ORIGINAL_REQUEST.md R1 | Detecção de `[Fonte pública]` + `[fato verificável]` + `[implicação]` + `[pergunta/CTA]` |
| OAB Provimento 205 | ORIGINAL_REQUEST.md R1 | Foco exclusivo em triagem e atendimento receptivo; vedada captação ativa |
| CFM 2.336/2023 | PROJECT.md Architecture | Vedadas promessas de resultado ou fotos sensacionalistas de antes/depois |
| CFO 196/2019 | PROJECT.md Architecture | Vedada oferta mercantilista de consulta/avaliação gratuita |
| LGPD | ORIGINAL_REQUEST.md R1 | Origem pública identificada e cláusula de saída/opt-out honrosa em toda abordagem |
| Ajuste Dinâmico 2x | ORIGINAL_REQUEST.md R2 | Se `taxaReuniao(A) < 2 * taxaReuniao(B)`, reduzir tempo de Tier A de 50% para 30% |
| Mystery Shopping | ORIGINAL_REQUEST.md R3 | Pergunta simples sem agendamento fictício; aviso de transparência como diagnóstico |
| CTAs Reciprocidade | ORIGINAL_REQUEST.md R3 | Print de tempo medido, mini diagnóstico em 3 linhas ou 5 perguntas repetidas |

---

## 6. Bugs de Implementação Identificados para Escalação

Durante a verificação adversarial dos arquivos existentes no repositório, foi detectada uma inconsistência importante no código do simulador atual (`simulator/server.cjs`):

- **Inconsistência**: As 8 mensagens iniciais de exemplo cadastradas em `simulator/server.cjs` (linhas 28 a 213) possuem entre **57 e 62 palavras**, violando o limite inegociável de **máximo 50 palavras** estabelecido no Requisito 1 de `ORIGINAL_REQUEST.md` e no Critério de Aceite 45.
- **Exemplo**:
  - `lead-paula`: 59 palavras (m1: 32 + m2: 27).
  - `lead-rafael`: 59 palavras (m1: 32 + m2: 27).
  - `lead-fernanda-diagnostico`: 62 palavras (m1: 40 + m2: 22).
- **Recomendação para a Equipe de Implementação**:
  - Quando os implementadores de produção desenvolverem os módulos em `src/sdr/` ou atualizarem `simulator/server.cjs` no Milestone 4, devem substituir essas mensagens pelas versões canônicas já calibradas e validadas em `tests/synthetic_personas.json` (que possuem entre 42 e 50 palavras exatas).
