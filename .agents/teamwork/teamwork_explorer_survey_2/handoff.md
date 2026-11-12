# RelatÃ³rio de Handoff â€” Survey TÃ©cnico do Simulador (Fase 0)

**Autor**: Teamwork Explorer (Survey 2 - Simulador)  
**Data/Hora**: 2026-11-02T22:50:00Z  
**DiretÃ³rio de Trabalho**: `C:\Users\Kethely\Desktop\Whats-Kethy-Portatil\.agents\teamwork\teamwork_explorer_survey_2\`  
**Contexto de Requisitos**: `C:\Users\Kethely\Desktop\Whats-Kethy-Portatil\.agents\teamwork\ORIGINAL_REQUEST.md` (R1, R2, R3, R4)

---

## 1. Observation (ObservaÃ§Ãµes Diretas com EvidÃªncias de CÃ³digo)

A inspeÃ§Ã£o do repositÃ³rio `Whats-Kethy-Portatil` nos diretÃ³rios `simulator/`, `public/`, `src/` e raiz revelou a arquitetura exata de execuÃ§Ã£o do simulador e da aplicaÃ§Ã£o principal:

### 1.1 Portas e Arquitetura do Backend do Simulador
* **Arquivo**: `simulator/server.cjs` (424 linhas, CommonJS, Node.js nativo sem frameworks pesados como Express).
* **Porta 3334 (Principal)**:
  - Definida na linha 5: `const PORT = 3334;`
  - Ouvinte na linha 411:
    ```javascript
    server.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`ðŸ“± SIMULADOR WHATSAPP SDR ATIVO:`);
      console.log(`ðŸ‘‰ Link 1: http://localhost:3334`);
      console.log(`ðŸ‘‰ Link 2 (Virgem/Sem Cache): http://localhost:3335`);
      console.log(`ðŸ¤– Modelo: ${MODEL_CONVERSA} (Keydex API)`);
      console.log(`ðŸŽ¯ Metodologia: Gong Labs (CTA de Interesse) + Anti-Golpe Brasil`);
      console.log(`======================================================\n`);
    });
    ```
* **Porta 3335 (SecundÃ¡ria / Anti-Cache)**:
  - Definida nas linhas 421-423:
    ```javascript
    // Subir tambÃ©m na porta 3335
    const server2 = http.createServer(server.listeners('request')[0]);
    server2.listen(3335);
    ```
  - `server2` espelha 100% o mesmo listener de requisiÃ§Ã£o de `server`. Serve como uma porta alternativa para contornar cache local de navegador ou testes paralelos em duas abas sem interferÃªncia.
* **Porta 3333 (AplicaÃ§Ã£o WhatsApp Baileys de ProduÃ§Ã£o)**:
  - Definida em `src/server.ts:17` (`const port = Number(process.env.PORT || 3333);`) e documentada em `GUIA_COMO_USAR.md:13` e `INICIAR.bat:37`.
  - Serve a interface web oficial em `public/index.html` (886 linhas), com suporte ao Baileys, QR code, transcriÃ§Ã£o de Ã¡udio e anÃ¡lise de imagem.
  - **ConstataÃ§Ã£o**: O simulador (`simulator/server.cjs`) Ã© um processo totalmente desacoplado da porta 3333, com ciclo de vida independente e zero chamadas mÃºtuas no momento.
* **Script de InicializaÃ§Ã£o**:
  - `simulator/INICIAR_SIMULADOR.bat` (linhas 13-18):
    ```bat
    echo [1/2] Abrindo Simulador no Navegador...
    start http://localhost:3334

    echo [2/2] Iniciando Servidor Local...
    node server.cjs
    pause
    ```

### 1.2 IntegraÃ§Ã£o com LLM e Provedor Keydex Shop
* **Arquivo**: `simulator/server.cjs` (linhas 6-8):
  ```javascript
  const KEYDEX_KEY = "SUA_CHAVE_API_AQUI";
  const KEYDEX_URL = "https://keydex.shop/v1/chat/completions";
  const MODEL_CONVERSA = "claude-sonnet-4-6";
  ```
* **Chamadas Ã  API**:
  - Realizadas via `fetch()` nativo do Node.js (linhas 253-272 e 346-362) utilizando cabeÃ§alhos `Authorization: Bearer ${KEYDEX_KEY}` e payload compatÃ­vel com OpenAI Chat Completions.
  - Modelo utilizado: `claude-sonnet-4-6`.
  - Temperatura: `0.5`, `max_tokens: 350` (chat) e `280` (first-contact).

### 1.3 Estado Atual dos Leads no Simulador
* **Arquivo**: `simulator/server.cjs` (linhas 11-128).
* Existem apenas 4 personas mockadas na memÃ³ria:
  1. `lead-1`: Dr. Roberto Medeiros â€” *Diretor da ClÃ­nica Medeiros (Dermatologia)* â€” Tag: "ClÃ­nica MÃ©dica / Alta ExigÃªncia"
  2. `lead-2`: Camila Ramos â€” *Diretora de OperaÃ§Ãµes na Logistics BR (LogÃ­stica)* â€” Tag: "OperaÃ§Ãµes / Ocupada"
  3. `lead-3`: Marcos Silva â€” *SÃ³cio de ImobiliÃ¡ria (Silva ImÃ³veis)* â€” Tag: "ImobiliÃ¡ria / CÃ©tico de PreÃ§o"
  4. `lead-4`: Dra. Juliana Dias â€” *CirurgiÃ£-Dentista & Dona de ConsultÃ³rio (Odontologia)* â€” Tag: "Odontologia / Receptiva"
* **Lacunas Imediatas**:
  - O nicho de **Advocacia** estÃ¡ completamente ausente no array `leads`.
  - NÃ£o hÃ¡ estrutura de dados para Tiers (A, B, C) atribuÃ­dos a cada lead.
  - NÃ£o hÃ¡ campos estruturados para fontes pÃºblicas auditadas (Google Meu NegÃ³cio, Instagram, Doctoralia, OAB, Reclame Aqui, Meta Ads Library, Vagas de Atendimento).
  - As mensagens iniciais prÃ©-carregadas possuem 3 balÃµes (m1, m2, m3), violando o critÃ©rio estrito de 2 balÃµes de ORIGINAL_REQUEST.md.

### 1.4 Regras de Prompt e BalÃµes Atuais
* **Arquivo**: `simulator/server.cjs` (linhas 169-172 e 338-343):
  ```javascript
  // Linhas 170-171:
  - Mensagens curtas: no mÃ¡ximo 50 palavras no total.
  - Use "---SPLIT---" para dividir em 2 ou 3 balÃµes curtos e fÃ¡ceis de ler no celular.
  // Linha 339:
  - Divida em 2 ou 3 balÃµes usando ---SPLIT---
  - Total mÃ¡ximo: 45 a 55 palavras
  ```
* **Inconformidade com ORIGINAL_REQUEST.md**:
  - O requisito R1 e os CritÃ©rios de AceitaÃ§Ã£o exigem: *"Todas as mensagens de abordagem possuem no mÃ¡ximo 50 palavras distribuÃ­das em exatamente 2 balÃµes"* e *"As abordagens contÃªm os 4 blocos obrigatÃ³rios: [Fonte pÃºblica] + [fato verificÃ¡vel] + [implicaÃ§Ã£o] + [pergunta/CTA]"*.
  - O prompt atual aceita 3 balÃµes e atÃ© 55 palavras, e nÃ£o parametriza os 4 blocos analÃ­ticos.

### 1.5 Interface Frontend do Simulador
* **Arquivo**: `simulator/public/index.html` (807 linhas, HTML5/CSS/Vanilla JS).
* **Estrutura Visual**:
  - Topbar (`.sim-topbar`, linhas 473-481): Exibe badge, modelo ("Claude Sonnet 4.6") e metodologia ("Gong Labs + Anti-Golpe Brasil").
  - Sidebar Esquerda (`.sidebar`, linhas 485-493): Lista de leads com avatar, nome, tag e Ãºltima mensagem. BotÃ£o "+ Novo Lead" que usa `prompt()` simples. NÃ£o possui filtro/seletor de nicho.
  - Ãrea Central de Chat (`.chat-area`, linhas 496-533): Visual realista do WhatsApp Web (wallpaper clÃ¡ssico em overlay, balÃµes verdes `#005c4b` para SDR e cinzas `#202c33` para lead, indicador animado de digitaÃ§Ã£o `#typingIndicator` com delay proporcional ao tamanho da resposta). BotÃ£o `ðŸš€ Disparar Abordagem (c + d)` e `ðŸ”„ Limpar`.
  - Painel Lateral Direito (`.telemetry-panel`, linhas 536-571): Exibe cards estÃ¡ticos de estatÃ­sticas da Gong Labs e Anti-golpe, e card `#statLastThought` com o texto cru do Sonnet 4.6. NÃ£o hÃ¡ tela de mÃ©tricas por tier, histÃ³rico de 4-6 semanas ou validador visual de balÃµes/palavras.
* **Ciclo de Vida de ExecuÃ§Ã£o do Chat**:
  1. `carregarLeads()` dispara `GET /api/leads`.
  2. `selecionarLead(leadId)` popula o cabeÃ§alho e renderiza os balÃµes da conversa (`adicionarBalaoNaTela`).
  3. `dispararPrimeiroContato()` envia `POST /api/first-contact { leadId }`. O backend invoca a Keydex e divide a resposta por `---SPLIT---`.
  4. `enviarMensagemLead()` simula a resposta do cliente. O usuÃ¡rio digita no input `#chatInput`, envia a mensagem, o sistema aguarda uma pausa humana de 1000ms, ativa o indicador `digitando...`, envia `POST /api/chat`, recebe os balÃµes com delays calculados (`wordCount * 260ms`) e exibe cada balÃ£o sequencialmente.

---

## 2. Logic Chain (Cadeia de RaciocÃ­nio das ObservaÃ§Ãµes Ã s ConclusÃµes)

1. **Premissa de IndependÃªncia dos ServiÃ§os**:  
   Conforme observado na seÃ§Ã£o 1.1, o simulador roda em processo Node.js nativo prÃ³prio (portas 3334 e 3335) e nÃ£o interfere na porta 3333 (Baileys/WhatsApp real).  
   *InferÃªncia*: O simulador pode ser ampliado, enriquecido com novas rotas, telas e modelos de dados sem qualquer risco de quebrar a sessÃ£o ou estabilidade do cliente Baileys de produÃ§Ã£o.

2. **Necessidade do 5Âº Nicho (Advocacia) e DossiÃª de Fontes PÃºblicas**:  
   Conforme observado na seÃ§Ã£o 1.3, o array `leads` possui apenas 4 pessoas e nÃ£o detalha fontes pÃºblicas. O requisito R1 exige 5 nichos (Dermatologia, Odontologia, ImobiliÃ¡ria, Advocacia e LogÃ­stica) com fontes especÃ­ficas (Google Perfil, Instagram, Meta Ads, Doctoralia, OAB Provimento 205/2021, Reclame Aqui).  
   *InferÃªncia*: Ã‰ necessÃ¡rio criar uma persona estruturada para Advocacia (com nÃºmero da OAB e nota de triagem receptiva) e refatorar o modelo de dados dos leads no backend para conter um objeto estruturado `publicSources`, alÃ©m de adicionar um seletor visual por abas ou pills no frontend (`[Todos] [ðŸ©º Dermatologia] [ðŸ¦· Odontologia] [ðŸ¢ ImobiliÃ¡ria] [âš–ï¸ Advocacia] [ðŸšš LogÃ­stica]`).

3. **RestriÃ§Ã£o Estrita de Formato (2 BalÃµes e <= 50 Palavras)**:  
   Conforme observado na seÃ§Ã£o 1.4, o prompt atual permite 3 balÃµes e atÃ© 55 palavras.  
   *InferÃªncia*: O `SDR_SYSTEM_PROMPT` e a rota `POST /api/first-contact` devem ser ajustados para instruir rigorosamente: *"Divida em exatamente 2 balÃµes usando ---SPLIT--- (exatamente uma quebra). O somatÃ³rio das palavras dos 2 balÃµes nÃ£o pode ultrapassar 50 palavras"*. AlÃ©m disso, o backend deve calcular e retornar `stats: { wordCount, bubbleCount, isValid }`, permitindo que o frontend exiba badges visuais de conformidade em tempo real.

4. **PersistÃªncia e Painel de MÃ©tricas de Tiers A/B/C (R2)**:  
   Conforme observado na seÃ§Ã£o 1.5, o simulador nÃ£o possui mÃ³dulo de persistÃªncia nem tela de mÃ©tricas. O requisito R2 exige o registro de 4 a 6 semanas de contatos, taxas de resposta e reuniÃµes por Tier, com regra matemÃ¡tica de ajuste dinÃ¢mico (se conversÃ£o Tier A < 2x Tier B -> reduzir tempo alocado ao Tier A).  
   *InferÃªncia*: Devemos criar uma persistÃªncia em arquivo JSON local (`simulator/data/tier_metrics.json`) ou SQLite leve, com rotas `GET /api/metrics/tiers`, `POST /api/metrics/simulate-week` e `POST /api/metrics/reset`. No frontend, deve ser adicionada uma visualizaÃ§Ã£o por abas no cabeÃ§alho: `[ðŸ’¬ WhatsApp Simulator] [ðŸ“Š Painel de MÃ©tricas (Tiers A/B/C)] [ðŸ•µï¸ Mystery Shopping]`, contendo KPIs, tabela temporal de semanas 1 a 6 e badge de alocaÃ§Ã£o de tempo com alerta dinÃ¢mico.

5. **SimulaÃ§Ã£o de Mystery Shopping Ã‰tico e CTAs de Reciprocidade (R3)**:  
   Conforme observado na seÃ§Ã£o 1.5, o simulador sÃ³ possui o disparo de outbound direto.  
   *InferÃªncia*: Devemos adicionar um endpoint `POST /api/mystery-shopping/simulate` e controles na interface:
   - BotÃ£o para simular a pergunta teste de tempo de resposta sem agendamento (ex: "Qual o horÃ¡rio de atendimento hoje?").
   - ExibiÃ§Ã£o do tempo medido (ex: 4h12min) e do mini diagnÃ³stico em 3 linhas gerado.
   - BotÃ£o para gerar a abordagem com gancho de reciprocidade utilizando o resultado do teste.

---

## 3. Caveats (Ressalvas, LimitaÃ§Ãµes e Premissas)

1. **ExecuÃ§Ã£o Standalone**: O simulador roda sem banco de dados externo ou servidor redis. Toda a persistÃªncia Ã© baseada em sistema de arquivos local (JSON) e memÃ³ria, o que Ã© ideal para portabilidade e execuÃ§Ã£o com 1 clique no Windows.
2. **DependÃªncia da Chave Keydex**: O simulador depende da disponibilidade da API Keydex Shop (`https://keydex.shop/v1/chat/completions`) e do modelo `claude-sonnet-4-6`. Se a conexÃ£o de rede oscilar ou a chave expirar, o simulador deve exibir mensagens de erro tratadas no frontend sem quebrar o processo Node.
3. **PersistÃªncia das MÃ©tricas**: Para garantir persistÃªncia limpa sem concorrÃªncia de escritas, as operaÃ§Ãµes de leitura/escrita em `simulator/data/tier_metrics.json` devem ser atÃ´micas e sÃ­ncronas (`fs.writeFileSync`).

---

## 4. Conclusion (DiagnÃ³stico Completo e Respostas aos 5 Questionamentos)

### Resposta 1: Como o simulador funciona hoje e quais portas utiliza?
- **Portas**: Opera nativamente nas portas **3334** (URL primÃ¡ria) e **3335** (URL espelho sem cache), ambas levantadas no mesmo arquivo `simulator/server.cjs`. A porta 3333 pertence ao servidor de produÃ§Ã£o Baileys (`src/server.ts`).
- **Backend**: Implementado em Node.js puro (`http`, `fs`, `path`), sem Express. MantÃ©m os leads em memÃ³ria, gerencia CORS, serve arquivos estÃ¡ticos de `simulator/public/` e expÃµe 3 endpoints principais: `GET /api/leads`, `POST /api/leads/:leadId/reset`, `POST /api/chat` e `POST /api/first-contact`.
- **Frontend**: Single Page Application em Vanilla JS (`simulator/public/index.html`) com tema escuro do WhatsApp Web, lista de contatos, chat interativo com simulaÃ§Ã£o de digitaÃ§Ã£o humana e painel lateral com preceitos da metodologia Gong Labs.

### Resposta 2: Como interage com o WhatsApp SDR oficial ou com LLMs?
- NÃ£o interage com a porta 3333 do Baileys â€” funciona como um ambiente de validaÃ§Ã£o e demonstraÃ§Ã£o isolado.
- Interage diretamente com a **API Keydex Shop** (`https://keydex.shop/v1/chat/completions`) usando a chave `sk-c48d...` e o modelo `claude-sonnet-4-6`.

### Resposta 3: Como as conversas simuladas sÃ£o iniciadas, renderizadas e testadas?
- O usuÃ¡rio seleciona um lead na barra lateral.
- Clica em `ðŸš€ Disparar Abordagem (c + d)`: o backend solicita ao Sonnet 4.6 uma mensagem outbound, fatia em balÃµes pelo token `---SPLIT---` e renderiza na tela.
- O usuÃ¡rio testa a reaÃ§Ã£o da IA digitando na caixa inferior como se fosse o cliente (lead). O frontend simula pausa de leitura, ativa o status "digitando..." e envia para `POST /api/chat`, recebendo e desenrolando a resposta do SDR com delay temporal realista.

### Resposta 4: Como acomodar os novos requisitos no simulador?
1. **Seletor de Nicho e DossiÃª de Fontes**:
   - Barra de filtros com tags dos 5 nichos: `[Todos] [ðŸ©º Dermatologia] [ðŸ¦· Odontologia] [ðŸ¢ ImobiliÃ¡ria] [âš–ï¸ Advocacia] [ðŸšš LogÃ­stica]`.
   - Card "DossiÃª de Fontes PÃºblicas" no painel lateral exibindo dados mockados reais (Doctoralia, Google Perfil, Instagram, OAB, Reclame Aqui).
2. **Painel de MÃ©tricas por Tier (4-6 Semanas)**:
   - Nova aba ou modal de navegaÃ§Ã£o "MÃ©tricas & Tiers".
   - ExibiÃ§Ã£o de cards KPI dos Tiers A, B e C (contatos, respostas %, reuniÃµes %, tempo alocado %).
   - Indicador visual da regra de ajuste 2x (se taxa Tier A < 2x Tier B -> alerta e reduÃ§Ã£o do tempo do Tier A).
   - Tabela de evoluÃ§Ã£o das semanas 1 a 6 e botÃ£o "Simular PrÃ³xima Semana".
3. **SimulaÃ§Ã£o de Mystery Shopping**:
   - BotÃ£o e card dedicado para simular o teste de tempo de resposta sem agendamento.
   - GeraÃ§Ã£o e visualizaÃ§Ã£o do mini diagnÃ³stico de 3 linhas.
   - Disparo da abordagem integrada com CTA de reciprocidade.
4. **VerificaÃ§Ã£o Visual dos 2 BalÃµes e Limite de 50 Palavras**:
   - Badges flutuantes no balÃ£o do SDR:
     `[2 BalÃµes âœ…]` | `[38/50 Palavras âœ…]` | `[4 Blocos Ã‰ticos âœ…]`.
   - Se ultrapassar 50 palavras ou nÃ£o tiver 2 balÃµes, exibe badge vermelha de alerta `[InvÃ¡lido âš ï¸]`.

### Resposta 5: RelaÃ§Ã£o Exata de Arquivos a Modificar ou Criar

| Arquivo | AÃ§Ã£o | DescriÃ§Ã£o das ModificaÃ§Ãµes |
|---|---|---|
| `simulator/server.cjs` | **Modificar** | 1. Adicionar o 5Âº lead (Advocacia) com Provimento 205/2021.<br>2. Estruturar `publicSources` e `tier` em todos os leads.<br>3. Ajustar prompt para forÃ§ar **exatamente 2 balÃµes** e **<= 50 palavras** com os 4 blocos.<br>4. Implementar rotas `/api/metrics/tiers`, `/api/metrics/simulate-week`, `/api/metrics/reset`.<br>5. Implementar rota `/api/mystery-shopping/simulate`.<br>6. Adicionar validaÃ§Ã£o de contagem de palavras e balÃµes no payload de resposta. |
| `simulator/public/index.html` | **Modificar** | 1. Adicionar seletor/filtro por nicho na barra lateral.<br>2. Adicionar aba/painel de MÃ©tricas por Tier com histÃ³rico de semanas 1 a 6 e regra matemÃ¡tica de 2x.<br>3. Adicionar Ã¡rea de simulaÃ§Ã£o de Mystery Shopping e diagnÃ³stico de 3 linhas.<br>4. Adicionar inspeÃ§Ã£o do DossiÃª de Fontes PÃºblicas no painel lateral.<br>5. Adicionar badges visuais de conformidade nos balÃµes (2 balÃµes, contagem de palavras, 4 blocos). |
| `simulator/data/tier_metrics.json` | **Criar** | Arquivo de persistÃªncia local das mÃ©tricas de Tiers A/B/C ao longo de 4 a 6 semanas (volume de contatos, respostas, reuniÃµes e alocaÃ§Ã£o dinÃ¢mica). |
| `simulator/data/mock_leads.json` | **Criar** (Recomendado) | Base de dados estruturada das personas e fontes pÃºblicas dos 5 nichos, mantendo o `server.cjs` enxuto. |
| `simulator/INICIAR_SIMULADOR.bat` | **Manter/Ajustar** | Garantir mensagens claras no terminal sobre as portas 3334 e 3335 e link do painel. |

---

## 5. Verification Method (MÃ©todo de VerificaÃ§Ã£o Independente)

Para que qualquer outro agente ou a usuÃ¡ria possa verificar de forma reprodutÃ­vel e independente as constataÃ§Ãµes deste survey:

1. **InspeÃ§Ã£o de CÃ³digo e Portas**:
   - Abrir `simulator/server.cjs` e verificar as linhas 5 (`PORT = 3334`), 6-8 (Keydex URL e Claude Sonnet 4.6) e 423 (`server2.listen(3335)`).
   - Abrir `simulator/INICIAR_SIMULADOR.bat` e verificar linha 14 (`start http://localhost:3334`).
2. **ExecuÃ§Ã£o do Servidor do Simulador**:
   - Executar no terminal powershell:
     ```powershell
     cd C:\Users\Kethely\Desktop\Whats-Kethy-Portatil\simulator
     node server.cjs
     ```
   - Verificar logs confirmando a escuta simultÃ¢nea nas portas 3334 e 3335.
3. **Teste de Conectividade e Endpoints**:
   - Testar listagem de leads na porta 3334:
     ```powershell
     curl -s http://localhost:3334/api/leads
     ```
   - Testar o mesmo endpoint na porta 3335:
     ```powershell
     curl -s http://localhost:3335/api/leads
     ```
   - Confirmar que ambos retornam o JSON idÃªntico com os 4 leads atuais.
4. **CondiÃ§Ã£o de InvalidaÃ§Ã£o**:
   - Se for identificado que `simulator/` jÃ¡ possui cÃ³digo de persistÃªncia em SQLite ou rota para Advocacia em outro arquivo nÃ£o mapeado, a constataÃ§Ã£o de ausÃªncia do 5Âº nicho e de persistÃªncia serÃ¡ invalidada. (VerificaÃ§Ã£o por busca de texto confirmou zero ocorrÃªncias prÃ©vias de advocacia ou persistÃªncia no diretÃ³rio simulator).

