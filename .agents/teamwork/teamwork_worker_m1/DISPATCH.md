## 2026-11-02T23:01:18Z
Você é o teamwork_worker encarregado da implementação do Marco M1 (Core SDR Engine, 5 Nichos & Keydex API).
Seu diretório de trabalho exclusivo é: C:\Users\Kethely\Desktop\Whats-Kethy-Portatil\.agents\teamwork\teamwork_worker_m1\
O arquivo de requisitos originais obrigatório é: C:\Users\Kethely\Desktop\Whats-Kethy-Portatil\.agents\teamwork\ORIGINAL_REQUEST.md
O documento de arquitetura global é: C:\Users\Kethely\Desktop\Whats-Kethy-Portatil\.agents\teamwork\PROJECT.md

Arquivos de insumo dos Exploradores (LEIA-OS com atenção antes de codificar):
- C:\Users\Kethely\Desktop\Whats-Kethy-Portatil\.agents\teamwork\teamwork_explorer_m1_1\handoff.md (Design de types.ts e keydexClient.ts)
- C:\Users\Kethely\Desktop\Whats-Kethy-Portatil\.agents\teamwork\teamwork_explorer_m1_2\handoff.md e C:\Users\Kethely\Desktop\Whats-Kethy-Portatil\.agents\teamwork\teamwork_explorer_m1_2\proposed_niches.ts (Design de niches.ts e templates)
- C:\Users\Kethely\Desktop\Whats-Kethy-Portatil\.agents\teamwork\teamwork_explorer_m1_3\handoff.md (Design de validator.ts e sanitizador)
- C:\Users\Kethely\Desktop\Whats-Kethy-Portatil\.agents\teamwork\teamwork_spec_miner_survey_3\handoff.md (Especificação legal OAB 205, CFM, CFO)

Propriedade Exclusiva de Arquivos:
Você possui controle exclusivo sobre os seguintes arquivos:
- `src/sdr/types.ts`
- `src/sdr/niches.ts`
- `src/sdr/validator.ts`
- `src/sdr/keydexClient.ts`
- `src/sdr/index.ts`
- `tests/unit/m1_engine.test.ts` (ou script de teste em `tests/unit/`)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Sua missão de implementação:
1. Criar `src/sdr/types.ts` com todos os tipos contratuais de PROJECT.md (NicheType, TierType, PublicSources, LeadProfile, ApproachValidation, WeeklyTierStats, DynamicAdjustmentResult, MysteryShoppingData, etc.).
2. Criar `src/sdr/niches.ts` cobrindo os 5 nichos:
   - Dermatologia (Doctoralia, CRM/RQE, Botox/Laser, CFM 2.336/2023)
   - Odontologia (Doctoralia, CRO, Invisalign/implantes, CFO 196/2019)
   - Imobiliária (ZAP, VivaReal, CRECI, volume de imóveis, LGPD)
   - Advocacia (OAB, CNA, Provimento 205/2021: atendimento receptivo e triagem apenas, proibição absoluta de captação ativa)
   - Logística (Reclame Aqui, Google, vagas de SAC, rastreio)
   Templates com os 4 blocos rigorosos calibrados em <= 50 palavras e 2 balões com ---SPLIT---.
3. Criar `src/sdr/validator.ts`:
   - Validador determinístico: exatamente 2 balões via `---SPLIT---`.
   - Limite estrito de no máximo 50 palavras no total (`text.replace(/---SPLIT---/g, ' ').trim().split(/\s+/).filter(Boolean).length`).
   - Validação dos 4 blocos obrigatórios ([Fonte pública] + [fato específico] + [implicação] + [pergunta/CTA]).
   - Guardrails éticos (CFM, CFO, OAB Provimento 205/2021).
   - Função `sanitizeApproach` para higienização e conformidade.
4. Criar `src/sdr/keydexClient.ts`:
   - Conexão com https://keydex.shop/v1/chat/completions usando claude-sonnet-4-6.
   - Headers necessários ('User-Agent': 'Mozilla/5.0...'), timeout nativo (AbortSignal.timeout), retentativa exponencial e fallback determinístico offline.
5. Criar `src/sdr/index.ts` exportando os módulos.
6. Executar build / compilação e rodar testes unitários para comprovar funcionamento real.
7. Escrever `handoff.md` estruturado (Observation, Logic Chain, Caveats, Conclusion, Verification Method) com os comandos de teste executados e resultados.
8. Enviar mensagem de conclusão ao orquestrador.
