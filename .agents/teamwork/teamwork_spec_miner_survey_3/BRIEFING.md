# BRIEFING — 2026-11-02T22:52:00Z

## Mission
Levantamento e especificação técnica exaustiva de todos os requisitos, regras de domínio brasileiras (LGPD, CFM, CFO, OAB Provimento 205/2021), tiers dinâmicos, mystery shopping e integração de simuladores para o SDR WhatsApp Whats-Kethy-Portatil.

## 🔒 My Identity
- Archetype: teamwork_spec_miner
- Roles: Specification Miner
- Working directory: C:\Users\Kethely\Desktop\Whats-Kethy-Portatil\.agents\teamwork\teamwork_spec_miner_survey_3
- Original parent: a7f07c87-0a89-4812-974e-b274bcd25c7e
- Milestone: Fase 0 - Especificação Técnica e Regras de Domínio

## 🔒 Key Constraints
- Read-only em relação ao código-fonte e pastas externas; escrita estrita apenas em `C:\Users\Kethely\Desktop\Whats-Kethy-Portatil\.agents\teamwork\teamwork_spec_miner_survey_3\`.
- Estrutura obrigatória dos 4 blocos em todas as abordagens: [Fonte] + [fato específico e verificável] + [implicação em 1 frase] + [pergunta de interesse / CTA de oferta].
- Limite estrito de exatamente 2 balões de mensagem e no máximo 50 palavras no total por abordagem.
- Conformidade legal e ética estrita: LGPD, CFM (Conselho Federal de Medicina), CFO (Conselho Federal de Odontologia) e OAB Provimento 205/2021 (foco exclusivo em triagem e atendimento receptivo; proibição expressa de captação ativa mercantilista).
- Fórmula matemática de ajuste dinâmico de Tiers: se `taxa_conversao(Tier A) < 2 * taxa_conversao(Tier B)` -> reduzir percentual de tempo alocado ao Tier A.
- Mystery Shopping: pergunta simples, medição de tempo de resposta sem agendamento real, revelação transparente inicial como diagnóstico gratuito e CTAs de reciprocidade.
- Integração: Keydex Shop API (https://keydex.shop/v1, modelo `claude-sonnet-4-6`) e simuladores locais (portas 3334 e 3335).
- Relatório de handoff obrigatório de 5 componentes (Observation, Logic Chain, Caveats, Conclusion, Verification Method) em `handoff.md`.

## Current Parent
- Conversation ID: a7f07c87-0a89-4812-974e-b274bcd25c7e
- Updated: 2026-11-02T22:52:00Z

## Task Summary
- **What to build**: Especificação técnica formal e mineração completa de requisitos de domínio para a Fase 0.
- **Success criteria**: Documentação exaustiva de R1 a R4 com matriz de fontes públicas, regras deontológicas, modelo de tiers, fórmula de ajuste, protocolo de mystery shopping, contratos de API e personas sintéticas para 5 nichos.
- **Interface contracts**: ORIGINAL_REQUEST.md
- **Code layout**: C:\Users\Kethely\Desktop\Whats-Kethy-Portatil

## Key Decisions Made
- Validação formal das 5 personas com script determinístico `test_verify.js`, comprovando 2 balões e contagens de 42 a 46 palavras (todas <= 50 palavras).
- Regra matemática de ajuste de tiers formalizada com threshold de amostra mínima ($N \ge 15$) para evitar instabilidade prematura na primeira semana.
- Especificação de DDL SQLite e schemas JSON canônicos para persistência de 4-6 semanas.
- Inclusão do nicho de Advocacia e alinhamento estrito com o Provimento 205/2021 da OAB (triagem e atendimento receptivo exclusivo).

## Artifact Index
- DISPATCH.md — Registro do chamado da tarefa
- BRIEFING.md — Memória de trabalho e identidade
- progress.md — Heartbeat de liveness e status
- test_verify.js — Script de verificação independente de regras de formatação e matemática de tiers
- handoff.md — Especificação técnica formal e relatório final de 5 componentes
