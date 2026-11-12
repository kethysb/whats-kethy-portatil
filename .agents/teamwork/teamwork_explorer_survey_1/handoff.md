# Handoff Report â€” Fase 0: Survey TÃ©cnico do CÃ³digo Fonte (Whats-Kethy-Portatil)

- **Autor**: teamwork_explorer (Survey 1)
- **Data/Hora**: 2026-11-02T22:50:00Z
- **Destino**: Orquestrador e Equipe de Engenharia / Planejamento
- **DiretÃ³rio de Trabalho**: `C:\Users\Kethely\Desktop\Whats-Kethy-Portatil\.agents\teamwork\teamwork_explorer_survey_1\`
- **Arquivo de Requisitos**: `C:\Users\Kethely\Desktop\Whats-Kethy-Portatil\.agents\teamwork\ORIGINAL_REQUEST.md`

---

## 1. Observation

### 1.1 Estrutura do SDR do WhatsApp e Arquitetura do Projeto
A anÃ¡lise detalhada dos arquivos revelou que o projeto opera atualmente com uma **arquitetura dual desarticulada**:

1. **Backend de ProduÃ§Ã£o Oficial (`src/` na porta 3333)**:
   - **Ponto de entrada**: `src/server.ts` (284 linhas). Inicializa um servidor Express na porta 3333 (configurÃ¡vel via `PORT` no `.env`).
   - **InstÃ¢ncias centrais**:
     - `WhatsAppClient` (`src/whatsapp.ts`, linhas 49-498): gerencia o Baileys (`@whiskeysockets/baileys` v6.7.12) com autenticaÃ§Ã£o multi-arquivos (`useMultiFileAuthState`) na pasta `.data/whatsapp-session-kethy`.
     - `CleanAgent` (`src/agent.ts`, linhas 10-235): implementa um agente focado em **assistente pessoal e executivo da Kethely**, e NÃƒO em prospecÃ§Ã£o SDR outbound.
   - **Manipuladores e Eventos**:
     - `wa.onMessage`: escuta mensagens recebidas. Se houver mÃ­dia de Ã¡udio (`mediaType === 'audio'`), chama `ai.transcribeAudio()`; se imagem (`mediaType === 'image'`), chama `ai.analyzeImage()`. Se `autoReplyEnabled === true`, chama `ai.reply()` (linhas 24-63 de `src/server.ts`).
     - Rotas REST no Express: `/api/status`, `/api/qrcode-image`, `/api/pairing-code`, `/api/chats`, `/api/contacts`, `/api/scan-sessions`, `/api/contact-info/:jid`, `/api/chats/unreplied`, `/api/chats/:jid`, `/api/chats/:jid/send`, `/api/ai/analyze-pending`, `/api/ai/analyze-image`, `/api/ai/transcribe-audio`, `/api/ai/suggest-reply`, `/api/ai/toggle-auto-reply`, `/api/force-history-sync`.
   - **Modelos de Dados (`src/whatsapp.ts`)**:
     - `StoredMessage` (linhas 16-28): `{ id: string, from: string, senderName: string, fromMe: boolean, timestamp: number, text: string, mediaType?, mediaUrl?, mediaPath?, transcription?, analysis? }`.
     - `ChatSummary` (linhas 30-38): `{ jid: string, name: string, lastMessage: string, lastTimestamp: number, unreadCount: number, needsReply: boolean, messages: StoredMessage[] }`.
   - **Frontend do Painel Web Oficial**: `public/index.html` (886 linhas), focado em visualizar conversas reais, escanear QR Code, ver transcriÃ§Ãµes e gerar checklist de pendÃªncias da Kethely via botÃ£o "O que preciso fazer hoje?".

2. **Simulador de ProspecÃ§Ã£o SDR (`simulator/` nas portas 3334 e 3335)**:
   - **Ponto de entrada**: `simulator/server.cjs` (424 linhas, CommonJS). Roda um servidor HTTP nativo do Node.js atendendo na porta 3334 (linha 5) e simultaneamente na porta 3335 (linhas 422-423).
   - **Modelos de Dados do Simulador**:
     - Array estÃ¡tico em memÃ³ria `leads` (linhas 11-128). Cada lead possui: `{ id, name, avatar, role, tag, trigger, statusText, messages: [{ id, sender: 'sdr' | 'lead', text, time }] }`.
     - Atualmente existem apenas 4 personas hardcoded:
       - `lead-1`: "Dr. Roberto Medeiros" (ClÃ­nica Medeiros - Dermatologia)
       - `lead-2`: "Camila Ramos" (Logistics BR - OperaÃ§Ãµes)
       - `lead-3`: "Marcos Silva" (Silva ImÃ³veis - ImobiliÃ¡ria)
       - `lead-4`: "Dra. Juliana Dias" (ConsultÃ³rio OdontolÃ³gico)
       - **ATENÃ‡ÃƒO**: O nicho de **Advocacia** estÃ¡ completamente ausente no simulador!
   - **Rotas REST do Simulador**:
     - `GET /api/leads` (linhas 214-216): retorna a lista de leads.
     - `POST /api/leads/:leadId/reset` (linhas 219-226): limpa as mensagens do lead em memÃ³ria.
     - `POST /api/chat` (linhas 229-324): recebe resposta do lead, envia histÃ³rico para a Keydex API e quebra a resposta do SDR em balÃµes (`bubblesWithDelays`).
     - `POST /api/first-contact` (linhas 327-385): gera a primeira abordagem de prospecÃ§Ã£o para o lead.
   - **Frontend do Simulador**: `simulator/public/index.html` (807 linhas). Interface tipo WhatsApp Web com simulador de digitaÃ§Ã£o humana (`typingDurationMs`), seletor de leads, botÃ£o para "Disparar Primeiro Contato" e inspeÃ§Ã£o de metodologia Gong Labs.

---

### 1.2 IntegraÃ§Ã£o com a API da Keydex Shop e LLMs

1. **ImplementaÃ§Ã£o no Simulador (`simulator/server.cjs`)**:
   - Linhas 6-8:
     ```javascript
     const KEYDEX_KEY = "SUA_CHAVE_API_AQUI";
     const KEYDEX_URL = "https://keydex.shop/v1/chat/completions";
     const MODEL_CONVERSA = "claude-sonnet-4-6";
     ```
   - Chamada REST (linhas 253-272 e 346-363): utiliza `fetch` nativo com cabeÃ§alhos `'Authorization': Bearer ${KEYDEX_KEY}` e `'User-Agent': 'Mozilla/5.0'`, com corpo no formato OpenAI (`model: 'claude-sonnet-4-6'`, `messages: [...]`, `temperature: 0.5`).
   - **VerificaÃ§Ã£o ao vivo da API da Keydex**:
     Comando executado:
     `powershell -Command "Invoke-RestMethod -Uri 'https://keydex.shop/v1/models' -Method Get -Headers @{ Authorization = 'Bearer SUA_CHAVE_API_AQUI' }"`
     Resultado: Retornou **HTTP 200 OK** com a lista de modelos ativos, confirmando a disponibilidade de `"id": "claude-sonnet-4-6"`.

2. **ImplementaÃ§Ã£o no Backend Oficial (`src/agent.ts` e `.env`)**:
   - `src/agent.ts` (linhas 20-24):
     ```typescript
     this.apiKey = process.env.AI_API_KEY || '';
     this.baseUrl = process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1';
     this.model = process.env.AI_MODEL || 'llama-3.3-70b-versatile';
     this.visionModel = process.env.AI_VISION_MODEL || 'llama-3.2-11b-vision-preview';
     this.audioModel = process.env.AI_AUDIO_MODEL || 'whisper-large-v3-turbo';
     ```
   - `.env` (linhas 6-10): aponta para a Groq (`https://api.groq.com/openai/v1`) com modelos `qwen/qwen3.8-27b`, `openai/gpt-oss-120b` e `whisper-large-v3-turbo`.
   - **Lacuna identificada**: A automaÃ§Ã£o oficial em `src/agent.ts` ainda nÃ£o estÃ¡ apontando para a Keydex Shop nem consumindo o modelo `claude-sonnet-4-6`.

---

### 1.3 GeraÃ§Ã£o de Prompts do Sistema e Armazenamento de Templates

1. **Prompts no Simulador (`simulator/server.cjs`)**:
   - `SDR_SYSTEM_PROMPT` (linhas 131-172): constante hardcoded no script JavaScript. Define o papel do SDR como "Kethely (ou assistente sÃªnior da equipe da Kethely)", focando na metodologia Gong Labs (formato C + D: Contexto + Dor Operacional + Pergunta de Interesse + SaÃ­da FÃ¡cil / Opt-out).
   - Regra atual de formataÃ§Ã£o no prompt (linhas 170-171):
     `"Mensagens curtas: no mÃ¡ximo 50 palavras no total. Use ---SPLIT--- para dividir em 2 ou 3 balÃµes curtos e fÃ¡ceis de ler no celular."`
   - Prompt de primeiro contato em `/api/first-contact` (linhas 338-344):
     - Exige explicitamente: "Divida em 2 ou 3 balÃµes usando ---SPLIT--- / Total mÃ¡ximo: 45 a 55 palavras".
     - BalÃ£o 1: TransparÃªncia imediata
     - BalÃ£o 2: Gatilho real + problema em 1 frase
     - BalÃ£o 3: Pergunta de interesse + SaÃ­da fÃ¡cil
   - **Templates prÃ©-definidos de mensagens**: EstÃ£o embutidos dentro do array `leads` (linhas 20-39, 50-68, 80-97, 109-126). Todos usam **3 balÃµes** (m1, m2, m3), violando o novo requisito R1 de exatamente 2 balÃµes.

2. **Prompts no Backend Oficial (`src/agent.ts`)**:
   - `SYSTEM_PROMPT`: lido de variÃ¡vel de ambiente (`.env`: "VocÃª Ã© o assistente executivo pessoal da Kethely. Sua missÃ£o Ã© ler as mensagens recebidas, identificar tarefas...").
   - `analyzePendingTasks` (linhas 97-108): prompt hardcoded para categorizar pendÃªncias em 4 seÃ§Ãµes (UrgÃªncias, Checklist, Respostas RÃ¡pidas, Baixa Prioridade).
   - **Lacuna identificada**: NÃ£o hÃ¡ nenhum template de prospecÃ§Ã£o, nem matriz de fontes pÃºblicas brasileiras em `src/`.

---

### 1.4 PersistÃªncia de Dados Atual

1. **Backend Oficial (`src/whatsapp.ts`)**:
   - Arquivo JSON em disco: `.data/chats-store.json` (linhas 59, 67, 78-106).
   - OperaÃ§Ã£o: carrega na inicializaÃ§Ã£o em um `Map<string, ChatSummary>`, e serializa a lista completa a cada mensagem nova via `fs.writeFileSync(this.storageFile, JSON.stringify(arr, null, 2))`.
   - MÃ­dias (imagens e Ã¡udios) salvas em `public/media/`.
   - Credenciais do WhatsApp salvas em `.data/whatsapp-session-kethy/`.

2. **Simulador (`simulator/server.cjs`)**:
   - **Zero persistÃªncia em disco**: 100% em memÃ³ria no array `leads`.
   - Ao reiniciar o processo `node server.cjs`, todas as mensagens e estados de teste sÃ£o perdidos.
   - **InexistÃªncia de SQLite, CSV ou JSON de MÃ©tricas**: NÃ£o hÃ¡ nenhuma estrutura para registrar histÃ³rico de contatos ao longo de 4 a 6 semanas, taxa de resposta, reuniÃµes agendadas ou segmentaÃ§Ã£o por Tiers.

---

### 1.5 DependÃªncias Instaladas, Scripts NPM e Ferramentas de Teste

1. **`package.json`**:
   - DependÃªncias de ProduÃ§Ã£o: `@hapi/boom` (^10.0.1), `@whiskeysockets/baileys` (^6.7.12), `cors` (^2.8.5), `dotenv` (^16.4.7), `express` (^4.21.2), `pino` (^9.6.0), `qrcode` (^1.5.4), `qrcode-terminal` (^0.12.0).
   - DependÃªncias de Desenvolvimento: `@types/cors`, `@types/express`, `@types/node`, `@types/qrcode`, `@types/qrcode-terminal`, `tsx` (^4.19.2), `typescript` (^5.7.2).
   - **Scripts existentes**:
     - `"dev": "tsx watch src/server.ts"`
     - `"start": "tsx src/server.ts"`
   - **Scripts ausentes**:
     - NÃ£o hÃ¡ script `"test"` configurado.
     - NÃ£o hÃ¡ script `"build"` configurado.
     - NÃ£o hÃ¡ script npm para rodar o simulador (atualmente roda via `simulator/INICIAR_SIMULADOR.bat` chamando `node server.cjs`).

2. **Ambiente e Ferramentas**:
   - Node.js instalado no sistema: **v26.3.0**.
   - npm instalado: **12.0.2**.
   - A pasta `node_modules` **nÃ£o existe** atualmente no repositÃ³rio (`Test-Path "node_modules"` retornou `False`).
   - Suporte a testes: Node.js v26.3 possui runner nativo de testes (`node --test`), e o `tsx` suporta execuÃ§Ã£o direta de arquivos de teste TypeScript (`npx tsx --test`).

---

### 1.6 Mapeamento de Gaps e Requisitos (R1 a R4)

| Requisito | Estado Atual no CÃ³digo | O que Precisa ser Adicionado / Alterado |
|---|---|---|
| **R1: 5 Nichos** | O simulador tem apenas 4 personas (`Dermatologia`, `LogÃ­stica`, `ImobiliÃ¡ria`, `Odontologia`). `Advocacia` estÃ¡ ausente. | Incluir persona e cenÃ¡rios para **Advocacia**, com restriÃ§Ã£o estrita ao Provimento 205/2021 da OAB (atendimento receptivo/triagem sem captaÃ§Ã£o ativa). |
| **R1: Matriz de Fontes PÃºblicas** | Gatilhos genÃ©ricos de texto (`trigger: "..."`), sem estruturaÃ§Ã£o formal das fontes pÃºblicas brasileiras. | Criar mÃ³dulo estruturado com os campos: `[Fonte pÃºblica]` (Google Perfil, Doctoralia, Portais ZAP/VivaReal, OAB, Reclame Aqui, Meta Ads, vagas) + `[Fato verificÃ¡vel]` + `[ImplicaÃ§Ã£o]` + `[CTA de oferta]`. |
| **R1: Limite de 50 Palavras & Exatamente 2 BalÃµes** | Prompts e mensagens prÃ©-configuradas usam **3 balÃµes** e faixa de **45 a 55 palavras**. | Ajustar o `SDR_SYSTEM_PROMPT`, o prompt de `/api/first-contact` e as mensagens estÃ¡ticas para gerar **rigorosamente 2 balÃµes** com separador `---SPLIT---` e limite mÃ¡ximo de **50 palavras combinadas**. Implementar pÃ³s-processador/validador programÃ¡tico. |
| **R2: SegmentaÃ§Ã£o de Tiers A/B/C** | Inexistente. NÃ£o hÃ¡ campos de Tier nos leads nem no modelo de contatos do WhatsApp. | Criar campo `tier: 'A' \| 'B' \| 'C'` no modelo de dados, com regras de qualificaÃ§Ã£o especÃ­ficas por tier. |
| **R2: PersistÃªncia de MÃ©tricas (4 a 6 semanas)** | Inexistente. Nenhuma mÃ©trica gravada em disco. | Implementar persistÃªncia local (SQLite ou mÃ³dulo JSON/CSV dedicado) gravando: contatos abordados, respostas recebidas, reuniÃµes agendadas, agrupadas por tier e semana. |
| **R2: LÃ³gica de Ajuste DinÃ¢mico de Tiers** | Inexistente. | Implementar algoritmo: se a taxa de conversÃ£o do Tier A for inferior ao dobro da taxa do Tier B (`convRate(A) < 2 * convRate(B)`), acionar ajuste dinÃ¢mico reduzindo o tempo/esforÃ§o alocado para o Tier A. |
| **R3: Mystery Shopping Ã‰tico & Reciprocidade** | Inexistente. As abordagens atuais apenas comentam "vi no Google" ou "vi no LinkedIn". | Criar fluxo de simulaÃ§Ã£o de mystery shopping: pergunta simples sem agendar, mediÃ§Ã£o de tempo de resposta real/simulado, abordagem transparente revelando o teste como diagnÃ³stico gratuito, e CTAs com oferta de valor (print do tempo de resposta, mini diagnÃ³stico em 3 linhas ou lista das 5 perguntas frequentes). |
| **R4: IntegraÃ§Ã£o Simulador (3334/3335) + AutomaÃ§Ã£o Oficial (3333)** | O simulador usa Keydex (`claude-sonnet-4-6`) em cÃ³digo separado (`server.cjs`). A automaÃ§Ã£o oficial (`src/`) usa Groq e nÃ£o possui inteligÃªncia SDR. | Unificar a engine SDR compartilhando a biblioteca de prompts, templates de nichos, regras de validaÃ§Ã£o e persistÃªncia entre o simulador e o backend oficial, configurando a Keydex Shop como provedor oficial. |
| **R4: Telas de MÃ©tricas no Frontend** | O frontend do simulador sÃ³ tem a tela de chat. | Adicionar painel/dashboard no frontend do simulador mostrando as mÃ©tricas de Tiers (A/B/C), taxas de resposta, reuniÃµes e alerta de ajuste dinÃ¢mico. |

---

## 2. Logic Chain

1. **A partir da observaÃ§Ã£o de que `src/server.ts` e `src/agent.ts` operam como assistente pessoal com Groq**, deduz-se que o backend principal do WhatsApp ainda nÃ£o incorporou o motor SDR outbound com Keydex Shop. Toda a inteligÃªncia prÃ©via de prospecÃ§Ã£o comercial foi desenvolvida isoladamente dentro de `simulator/server.cjs`.
2. **A partir da observaÃ§Ã£o de que `simulator/server.cjs` armazena dados em uma variÃ¡vel `const leads = [...]` em memÃ³ria**, conclui-se que o simulador atual Ã© puramente efÃªmero e nÃ£o atende ao requisito R2 (persistÃªncia de mÃ©tricas por tier ao longo de 4 a 6 semanas).
3. **A partir da observaÃ§Ã£o de que os leads hardcoded e o prompt em `simulator/server.cjs:338-344` demandam 3 balÃµes**, deduz-se que o cÃ³digo atual quebra o critÃ©rio de aceitaÃ§Ã£o estrito de "exatamente 2 balÃµes" e "mÃ¡ximo 50 palavras no total". O prompt e o parser de split precisam ser reformulados com trava programÃ¡tica.
4. **A partir da observaÃ§Ã£o de que faltam cenÃ¡rios para Advocacia e regras da OAB no simulador**, deduz-se que a suÃ­te de testes sintÃ©ticos exigida em R1/R4 necessitarÃ¡ de uma biblioteca modular de personas contendo os 5 nichos mapeados com conformidade jurÃ­dica expressa (Provimento 205/2021 da OAB).
5. **A partir da observaÃ§Ã£o de que `package.json` nÃ£o contÃ©m dependÃªncia de banco de dados nem scripts de teste**, deduz-se que o projeto necessita da adiÃ§Ã£o de um script `"test"` (usando `tsx --test` ou `node --test`) e de um mÃ³dulo leve de persistÃªncia estruturada (ex: SQLite via `better-sqlite3` ou motor de JSON relacional persistente com locking em `.data/metrics.json`) para viabilizar os testes automatizados e o registro histÃ³rico.

---

## 3. Caveats

1. **ConexÃ£o Baileys Live**: O teste do backend oficial com o WhatsApp real depende do escaneamento manual de QR Code ou cÃ³digo de pareamento com um celular fÃ­sico. Para a validaÃ§Ã£o contÃ­nua de software sem intervenÃ§Ã£o humana, a suÃ­te de testes automatizados sintÃ©ticos no simulador (portas 3334/3335) e testes unitÃ¡rios/integrados via `tsx --test` sÃ£o o mecanismo indispensÃ¡vel.
2. **Rate Limits da Keydex Shop**: Embora o endpoint `https://keydex.shop/v1/chat/completions` com `claude-sonnet-4-6` tenha respondido com sucesso imediato nos testes, testes massivos simultÃ¢neos devem implementar retry exponencial e fallback para evitar erros de rede ou throttling.
3. **NÃ£o alteraÃ§Ã£o de arquivos de cÃ³digo na Fase 0**: Em conformidade estrita com o papel de `teamwork_explorer`, nenhum arquivo de cÃ³digo-fonte (`src/`, `simulator/`, `package.json`, `.env`) foi modificado nesta fase de investigaÃ§Ã£o tÃ©cnica.

---

## 4. Conclusion

O projeto Whats-Kethy-Portatil possui fundaÃ§Ãµes tÃ©cnicas sÃ³lidas:
- Um motor de conexÃ£o Baileys funcional e robusto em `src/whatsapp.ts`.
- Um protÃ³tipo navegÃ¡vel e interativo de simulador SDR em `simulator/server.cjs` com conexÃ£o comprovada e ativa Ã  Keydex Shop (`claude-sonnet-4-6`).

No entanto, hÃ¡ uma **lacuna substancial entre o estado atual e os requisitos da tarefa (R1 a R4)**:
1. **UnificaÃ§Ã£o Arquitetural**: A inteligÃªncia SDR de prospecÃ§Ã£o deve ser desacoplada do arquivo monolÃ­tico `simulator/server.cjs` em um mÃ³dulo de domÃ­nio compartilhado (`src/sdr/` ou `src/domain/`), consumÃ­vel tanto pelo simulador quanto pela automaÃ§Ã£o oficial.
2. **MÃ³dulo de Fontes PÃºblicas & 5 Nichos**: CriaÃ§Ã£o da matriz completa contemplando Dermatologia, Odontologia, ImobiliÃ¡ria, Advocacia (OAB 205/2021) e LogÃ­stica.
3. **Formatador Estrito de 2 BalÃµes & 50 Palavras**: Reescrita do prompt e inclusÃ£o de pÃ³s-validador determinÃ­stico.
4. **Motor de Tiers e PersistÃªncia**: CriaÃ§Ã£o do repositÃ³rio local de mÃ©tricas (Tiers A/B/C, taxas de resposta e reuniÃµes) com o cÃ¡lculo de ajuste dinÃ¢mico (regra 2x).
5. **Mystery Shopping**: InjeÃ§Ã£o da mediÃ§Ã£o de tempo de resposta e CTAs de reciprocidade no fluxo.
6. **SuÃ­te de Testes SintÃ©ticos**: ConfiguraÃ§Ã£o de script de teste no `package.json` cobrindo 100% dos cenÃ¡rios dos 5 nichos e critÃ©rios de aceitaÃ§Ã£o.

---

## 5. Verification Method

Para reproduzir e auditar de forma independente todas as evidÃªncias apresentadas neste relatÃ³rio, execute os seguintes passos:

### 5.1 Verificar Conectividade da API da Keydex Shop e Modelo Claude Sonnet 4.6
Execute no terminal PowerShell:
```powershell
powershell -Command "Invoke-RestMethod -Uri 'https://keydex.shop/v1/models' -Method Get -Headers @{ Authorization = 'Bearer SUA_CHAVE_API_AQUI' } | ConvertTo-Json -Depth 2"
```
*CritÃ©rio de validaÃ§Ã£o*: Deve retornar HTTP 200 contendo `"id": "claude-sonnet-4-6"`.

### 5.2 Inspecionar Estrutura do Simulador e AusÃªncia de Advocacia
Inspecione `C:\Users\Kethely\Desktop\Whats-Kethy-Portatil\simulator\server.cjs`:
- Linhas 11-128: Observe a lista `leads` contendo apenas 4 leads (Medeiros/Dermatologia, Ramos/LogÃ­stica, Silva/ImobiliÃ¡ria, Dias/Odontologia). NÃ£o hÃ¡ menÃ§Ã£o a Direito ou OAB.
- Linhas 338-344: Observe a instruÃ§Ã£o `"Divida em 2 ou 3 balÃµes usando ---SPLIT---"`.

### 5.3 Inspecionar DependÃªncias e Scripts
Inspecione `C:\Users\Kethely\Desktop\Whats-Kethy-Portatil\package.json`:
- Verifique que os Ãºnicos scripts sÃ£o `"dev"` e `"start"`. NÃ£o hÃ¡ script `"test"`.
- Execute `Test-Path "C:\Users\Kethely\Desktop\Whats-Kethy-Portatil\node_modules"` para constatar a ausÃªncia de `node_modules`.

### 5.4 Inspecionar Armazenamento Atual
- Inspecione `src/whatsapp.ts` (linhas 59, 67, 85-106): verifique o uso de `.data/chats-store.json`.
- Inspecione `simulator/server.cjs` (linhas 11, 224, 239, 371): verifique que todas as mutaÃ§Ãµes ocorrem exclusivamente no array em memÃ³ria `leads`.

