Implementar e estruturar o SDR de WhatsApp em produção no projeto Whats-Kethy-Portatil com matriz de fontes públicas por nicho, mystery shopping ético, estratégia de Tiers A/B/C, CTAs de oferta/reciprocidade, mini diagnósticos e medição de taxas de resposta e reuniões.

Working directory: C:\Users\Kethely\Desktop\Whats-Kethy-Portatil
Integrity mode: development

## Requirements

### R1. Matriz de Fontes Públicas e Abordagens por Nicho
Estruturar modelos de dados, campos e templates no SDR para incorporar dados de fontes públicas brasileiras:
- Fontes gerais: Google Perfil da Empresa (avaliações recentes e tempo de resposta do proprietário), horário de funcionamento, site (presença de agendamento online/WhatsApp), Instagram (frequência de postagens e comentários com dúvidas de valor), Meta Ads Library (anúncios ativos com destino WhatsApp), vagas de atendimento (LinkedIn/Indeed/Catho), expansão/notícias, porte CNPJ e Reclame Aqui.
- Fontes específicas por segmento:
  - Dermatologia/estética: Doctoralia (avaliações, agenda online, corpo clínico), procedimentos divulgados (botox, laser), CRM/RQE.
  - Odontologia: Doctoralia, avaliação gratuita, tratamentos longos (ortodontia, implante).
  - Imobiliária/corretor: Portais (ZAP, VivaReal, OLX), Creci, volume de imóveis anunciados.
  - Advocacia: Áreas de atuação, Provimento 205/2021 da OAB (atendimento receptivo/triagem sem captação ativa).
  - Logística/operações: Reclame Aqui, Google, vagas de SAC.
As abordagens geradas devem seguir rigorosamente a estrutura ética de não parecer robô ou stalker: [Fonte] + [fato específico e verificável] + [implicação em 1 frase] + [pergunta de interesse / CTA de oferta], limitadas a 50 palavras divididas em 2 balões, em conformidade com LGPD, CFM, CFO e Provimento 205/2021 da OAB.

### R2. Estratégia de Tiers e Medição de Conversão
Implementar segmentação em Tiers A, B e C:
- Regras de qualificação e abordagem diferenciadas por tier.
- Criar estrutura local de persistência no projeto (JSON, SQLite ou CSV integrado) para registrar e acompanhar ao longo de 4 a 6 semanas o volume de contatos, a taxa de resposta e a taxa de agendamento de reuniões discriminadas por tier.
- Lógica de ajuste dinâmico: se o Tier A não converter pelo menos o dobro da taxa do Tier B, reduzir o tempo alocado para o Tier A.

### R3. Mystery Shopping Ético e CTAs de Reciprocidade
Incorporar fluxo de mystery shopping como gancho comercial:
- Medição do tempo de resposta real através de pergunta simples sem efetuar agendamento.
- Revelação transparente do teste no início da prospecção como um diagnóstico gratuito.
- CTAs de reciprocidade com oferta de valor (print/dado do tempo de resposta, mini diagnóstico em 3 linhas ou lista das 5 perguntas mais repetidas).

### R4. Integração no Simulador e na Automação Oficial
Integrar a matriz de fontes, a lógica de tiers, o mystery shopping e os templates de abordagem ao simulador local (portas 3335 e 3334) e à automação oficial do Whats-Kethy-Portatil utilizando a API Keydex Shop (https://keydex.shop/v1, modelo claude-sonnet-4-6). A equipe tem permissão para alterar o backend e o frontend do simulador conforme necessário para acomodar as funcionalidades e telas de métricas.

## Verification Resources
A equipe deve implementar uma suíte de cenários de teste sintéticos contendo dados e personas simuladas para os 5 nichos (Dermatologia, Odontologia, Imobiliária, Advocacia e Logística), verificando a conformidade das mensagens geradas e o registro das métricas.

## Acceptance Criteria

### Validação por Nicho
- [ ] O simulador e a automação executam fluxos de prospecção para os 5 nichos: Dermatologia, Odontologia, Imobiliária, Advocacia e Logística.
- [ ] Todas as mensagens de abordagem possuem no máximo 50 palavras distribuídas em exatamente 2 balões.
- [ ] As abordagens contêm os 4 blocos obrigatórios: [Fonte pública] + [fato verificável] + [implicação] + [pergunta/CTA].
- [ ] Os fluxos para Advocacia respeitam o Provimento 205/2021 da OAB, restringindo-se à triagem e atendimento receptivo.

### Tiers e Persistência
- [ ] Os contatos são classificados nos Tiers A, B e C.
- [ ] As taxas de resposta e agendamento de reuniões são persistidas localmente no projeto em formato estruturado (JSON/SQLite/CSV) por tier.
- [ ] Existe teste ou mecanismo demonstrando a redução de tempo alocado ao Tier A caso sua taxa de conversão seja inferior ao dobro da taxa do Tier B.

### Mystery Shopping e Reciprocidade
- [ ] O fluxo gera abordagem com gancho de tempo de resposta medido ou mini diagnóstico de 3 linhas.
- [ ] O teste de mystery shopping não efetua agendamentos reais e se apresenta como diagnóstico gratuito.
