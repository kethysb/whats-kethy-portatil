# BRIEFING — 2026-11-02T23:12:00Z

## Mission
Investigar e elaborar o design detalhado do validador determinístico e formatador/sanitizador de mensagens SDR (`src/sdr/validator.ts`) para o Marco M1.

## 🔒 My Identity
- Archetype: teamwork_explorer
- Roles: investigator, synthesizer
- Working directory: C:\Users\Kethely\Desktop\Whats-Kethely-Portatil\.agents\teamwork\teamwork_explorer_m1_3
- Original parent: a7f07c87-0a89-4812-974e-b274bcd25c7e
- Milestone: M1 (Core SDR Engine, 5 Nichos & Keydex API)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement in src/
- Algoritmo determinístico: contagem exata de 2 balões com delimitador `---SPLIT---`
- Limite estrito de no máximo 50 palavras em todo o texto somado
- Validação estrutural dos 4 blocos obrigatórios (fonte pública, fato específico, implicação, CTA de interesse)
- Sanitizador/formatador para padronizar e corrigir anomalias antes do envio

## Current Parent
- Conversation ID: a7f07c87-0a89-4812-974e-b274bcd25c7e
- Updated: 2026-11-02T23:12:00Z

## Investigation State
- **Explored paths**:
  - `ORIGINAL_REQUEST.md` (R1 e critérios de aceitação de 2 balões, 50 palavras e 4 blocos)
  - `PROJECT.md` (contrato `ApproachValidation`, arquitetura M1 e guardrails éticos)
  - `simulator/server.cjs` (mensagens reais dos leads e contagem de palavras observadas)
  - `tsconfig.json` e `package.json` (ESM / NodeNext)
- **Key findings**:
  - As mensagens do `simulator/server.cjs` excediam 50 palavras (51 a 56 palavras). Necessidade de templates calibrados em 38-44 palavras.
  - O delimitador oficial é `---SPLIT---`. A contagem exata de palavras é `text.replace(/---SPLIT---/g, ' ').trim().split(/\s+/).filter(Boolean).length`.
  - Os 4 blocos foram mapeados com regexes determinísticas para as fontes públicas brasileiras.
  - Guardrails regulatórios mapeados: Provimento 205/2021 OAB (Advocacia: apenas triagem/receptivo), CFM 2.336/2023, CFO 196/2019 e LGPD.
  - Função sanitizadora `sanitizeApproach` limpa markdown, aspas externas, etiquetas de LLM, converte `\n\n` e aplica contrações idiomáticas se necessário.
- **Unexplored areas**: Nenhuma pendência no escopo do validador. Pronto para implementação pelo coder do M1.

## Key Decisions Made
- Entregar em `handoff.md` a especificação técnica completa de `src/sdr/validator.ts` incluindo tipos TypeScript, regexes, guardrails e suíte de testes unitários executável.

## Artifact Index
- `handoff.md` — Relatório de handoff de 5 seções com código completo e verificação
- `progress.md` — Heartbeat de execução atualizado
- `DISPATCH.md` — Mensagem de ativação do orquestrador
