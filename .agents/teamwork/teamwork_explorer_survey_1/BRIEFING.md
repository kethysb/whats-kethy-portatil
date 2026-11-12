# BRIEFING — 2026-11-02T22:50:00Z

## Mission
Executar o Survey Técnico do Código Fonte (Fase 0) do projeto Whats-Kethy-Portatil, analisando arquitetura SDR, LLMs, prompts, persistência, scripts/testes e gaps para os requisitos.

## 🔒 My Identity
- Archetype: explorer
- Roles: teamwork_explorer
- Working directory: C:\Users\Kethely\Desktop\Whats-Kethy-Portatil\.agents\teamwork\teamwork_explorer_survey_1
- Original parent: a7f07c87-0a89-4812-974e-b274bcd25c7e
- Milestone: Fase 0 - Survey Técnico do Código Fonte

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Diretório exclusivo: .agents/teamwork/teamwork_explorer_survey_1
- Resposta e relatórios em português (Brasil)
- Não alterar código-fonte do projeto (src/, package.json, etc.)

## Current Parent
- Conversation ID: a7f07c87-0a89-4812-974e-b274bcd25c7e
- Updated: 2026-11-02T22:50:00Z

## Investigation State
- **Explored paths**: `ORIGINAL_REQUEST.md`, `package.json`, `tsconfig.json`, `Dockerfile`, `docker-compose.yml`, `INICIAR.bat`, `src/server.ts`, `src/agent.ts`, `src/whatsapp.ts`, `simulator/server.cjs`, `simulator/public/index.html`, `public/index.html`, API Keydex Shop (`https://keydex.shop/v1`).
- **Key findings**:
  1. Arquitetura dual: backend oficial (`src/` na porta 3333) opera como assistente pessoal com Groq; simulador (`simulator/` nas portas 3334/3335) opera protótipo SDR com Keydex Shop (`claude-sonnet-4-6`).
  2. A API da Keydex Shop está online e funcional com `claude-sonnet-4-6` verificado via chamada REST.
  3. Faltam no simulador: o nicho de Advocacia (Provimento 205/2021 OAB), regra estrita de 2 balões / <= 50 palavras (usa 3 balões e 45-55 palavras), segmentação e persistência de Tiers A/B/C, ajuste dinâmico 2x e Mystery Shopping.
  4. Persistência: backend oficial usa JSON estático `.data/chats-store.json`, simulador é 100% volátil em memória. Ausência de banco de dados e persistência de métricas semanais.
  5. Scripts: sem script `test` ou `build` no `package.json`. Node v26.3.0 e `tsx` disponíveis.
- **Unexplored areas**: Nenhuma pendência na Fase 0. Investigação concluída com sucesso.

## Key Decisions Made
- Produzir relatório completo de 5 componentes em `handoff.md` detalhando cada uma das 6 dimensões solicitadas.
- Documentar métodos independentes de verificação com comandos PowerShell e inspeções de código.

## Artifact Index
- handoff.md — Relatório estruturado de 5 componentes sobre o survey técnico do código-fonte (concluído)
- progress.md — Heartbeat de liveness e progresso (concluído)
- DISPATCH.md — Registro do chamado inicial
- BRIEFING.md — Memória de trabalho persistente
