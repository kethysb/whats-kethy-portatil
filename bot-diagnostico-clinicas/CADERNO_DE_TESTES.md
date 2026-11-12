# Caderno de testes: bot de diagnóstico para clínicas

Cada Maps testado ganha uma entrada. O objetivo é anotar onde o bot erra e qual regra ajustar,
para depois comparar o Opus 5.5 com um modelo mais barato usando os mesmos casos.

## Como anotar

| Campo | O que escrever |
|---|---|
| Lead | Nome da clínica e link do Maps |
| O que a gente viu (humano) | O maior problema visível, na sua opinião |
| O que o bot escolheu | Código do problema (C01 a C11) e pontuação |
| Bateu? | Sim / Não / Parcial |
| Erro do bot | Fato errado, tag errada, problema irrelevante, tom ruim... |
| Ajuste | Qual regra, peso ou prompt mudar |

## Erros a vigiar (lista viva)

1. Horário lido como "fechado" por causa da hora da coleta (caso Millano's/iFood).
2. Nota e número de avaliações desatualizados ou diferentes entre o print e o texto.
3. Avaliação antiga (mais de 6 meses) usada como gancho.
4. Tag errada: elogio marcado como reclamação, ou reclamação de preço marcada como demora.
5. Problema escolhido que a clínica não sente (ex.: site lento numa clínica que agenda tudo por indicação).
6. Mensagem que cita paciente ou detalhe de saúde.

## Registro

### Teste 0: Clínica Exemplo Derma (caso fictício de calibração)
- **Humano:** anúncio de peeling levando ao WhatsApp + avaliações de demora.
- **Bot:** C10 (anúncio sem estrutura de resposta), score 5.0. Empatou com C01 e venceu pelo número de evidências.
- **Bateu?** Sim.
- **Checagens:** descartou a avaliação A7 (trecho inventado) e removeu o nome da decisora, que não estava no texto bruto.
- **Ajuste:** desempate por número de evidências adicionado.

### Teste 1: Redeorto Americana (odontologia, Americana/SP), coletado em 08/11/2026
- **Link:** https://maps.app.goo.gl/mfvGCoEDRDp46jx1A
- **Retrato:** nota 5,0 com 167 avaliações, todas as recentes com resposta do proprietário, Instagram ativo (post há 4 dias),
  botão "Book online" da ficha leva para o WhatsApp, sem site, atende até 18h/18h30 e sábado até 13h. É uma franquia (rede Redeorto).
- **Humano:** clínica bem cuidada. Sem dor visível nas avaliações; uma avaliação de 2025 até elogia a rapidez no WhatsApp.
  A brecha real é que o agendamento depende de uma pessoa no WhatsApp em horário comercial (noite, sábado à tarde e domingo sem resposta).
- **Bot (antes do ajuste):** mensagem de segmento (só achou C08 "sem site", score 1,6).
- **Erro do bot:** a regra de "sem agendamento online" exigia ter site coletado, e o botão de WhatsApp da ficha não era tratado como atendimento manual.
- **Ajuste feito:** (1) sem site conta como sem agendamento online; (2) botão "Agendar/Book online" que leva ao WhatsApp
  = `tem_link_whatsapp` e não agendamento; (3) C03 sobe para confiança alta quando o WhatsApp é o canal de agendamento.
- **Bot (depois):** C03 "sem atendimento fora do horário", score 4,0. **Bateu.**
- **Mensagem** (passou nas checagens na 2ª tentativa; a 1ª foi bloqueada por ter 76 palavras):
  > Oi, Dra. Érica, tudo bem? Aqui é a Kethely, da KethyTech. Cuido de atendimento automático no WhatsApp para clínicas e achei o contato de vocês no Google.
  >
  > Vi que o agendamento pela ficha vai pro WhatsApp, e vocês atendem até as 18h e sábado só de manhã. Quem chama à noite ou no domingo provavelmente só tem resposta no dia seguinte. Hoje alguém responde esses contatos? Se não for prioridade, é só me dizer.
- **Achados novos para o catálogo:**
  - Avaliação de "a month ago" fala de "cartão de Todos", exame médico e outro médico: é de OUTRO estabelecimento,
    publicada na ficha errada, e contém dado de saúde. Regra 4c adicionada à extração (tag `outro`, nunca vira evidência).
  - Franquia: quem decide pode ser o franqueado, não a responsável técnica (Dra. Érica, R.T.). Campo `franquia` adicionado.
    Antes de enviar, conferir no Instagram ou na recepção quem é o dono da unidade. Franquia também pode já ter sistema da rede.
  - O Google exibiu a página em inglês ("Closed", "Book online", "6 PM"): a extração precisa entender os dois idiomas.
  - Não deu para coletar a Biblioteca de Anúncios (Facebook bloqueou o acesso sem login).
- **Qualidade do lead:** médio. É uma clínica organizada e com pouca dor aparente; a abordagem certa é "ampliar o que já funciona", não "consertar".

### Teste 1b: Redeorto Americana, refeito com diagnóstico em degraus (sugestões da Kethely)
- **Regras novas:** C12 (número em destaque é fixo e o WhatsApp fica escondido no botão de agendar) e C08 reescrito
  ("a ficha do Google não aponta para um site"; em franquia vira confiança média e entra como A CONFERIR).
- **Correção da Kethely registrada:** a Redeorto TEM WhatsApp, (19) 97161-6392, no botão "Book online".
  O ponto certo não é "não tem WhatsApp", e sim "o número em destaque é o fixo".
- **Pontos escolhidos:** C03 (atendimento fora do horário) + C08 (site) + C12 (fixo em destaque).
  O bot prefere áreas diferentes para mostrar a agência inteira.
- **O que as checagens pegaram nesta rodada:**
  - Mensagem com 88 palavras (limite de 85 com o aviso de "mais pontos") e um ponto do diagnóstico com mais de 60 palavras. Enxugados.
  - Falso alarme do validador: os códigos C03/C08/C12 eram lidos como números. Corrigido.
  - "13h" barrado porque o Google mostrava "1 PM". Corrigido: o validador agora converte horário em inglês.
- **A conferir antes de enviar:** (1) se a rede Redeorto tem página da unidade de Americana
  (o buscador de unidades do site da rede não abriu daqui); (2) se a Dra. Érica é a dona da unidade ou só a R.T.
- **Observação:** os pontos 1 e 3 se tocam (ambos falam de fora do horário). Se incomodar, a regra pode
  exigir que os extras não repitam a mesma consequência.

### Rodada 3: sequência completa (dica A/B, teste do WhatsApp, follow-up)
- **Redeorto:** caiu na variante A no sorteio. As duas variantes foram geradas para comparação e passaram em todas as checagens
  (mensagem A com 84 palavras, B com 95; diagnóstico, follow-up e encerramento ok).
- **Teste do WhatsApp na clínica fictícia:** o C13 (demora medida) empatou com o C10 (anúncio + avaliações) e perdeu no desempate.
  **Ajuste:** fato medido por você agora ganha o desempate, e com C13 como principal o diagnóstico não repete C01/C03/C10.
- Antes do ajuste, os horários do teste foram barrados como "números sem evidência" porque o problema escolhido era outro.
  A checagem funcionou como devia.

### Rodada 4: estudos no resumo e troca do "uma dica rápida" (pedido da Kethely)
- "Dica rápida" e "dica de ouro" agora são proibidas. A dica entra como "Uma coisa simples que já ajuda: ...".
- Tabela `estudos_verificados.json` criada com E1 (HBR 2011), E2 (Opinion Box 2025) e E3 (Maister 1985).
  Estudos só aparecem no resumo depois do "sim", no máximo 2.
- **Teste de sabotagem:** um resumo com "Harvard: quem responde em 1 hora vende 7 vezes mais" e "Cornell: 75% checam o site".
  Na 1ª versão das regras, a fonte inventada foi barrada, mas "vende" passou, porque a lista só tinha "venda" e "vender".
  **Ajuste:** o bloqueio agora é pela raiz da palavra (vend-, fech-, fatur-...). Na 2ª rodada, as duas distorções foram barradas.
- "Agente de IA" agora pode aparecer no resumo (depois do "sim"). Na primeira mensagem continua "atendimento automático".

### Rodada 5: dica grátis retirada (pedido da Kethely)
- **Motivo:** a dica ("ativar a mensagem de ausência do WhatsApp Business") ensinava a resolver com ferramenta gratuita
  e competia com o serviço da KethyTech.
- **Troca:** a variante B agora diz em meia frase o que a KethyTech entrega, sem ensinar como
  (ex.: "dá pra deixar o WhatsApp respondendo e agendando sozinho, inclusive à noite"). Cada um dos 13 problemas tem a sua.
  "Mensagem de ausência" e "uma coisa simples que já ajuda" agora são barradas.
- **Achado no teste com outros problemas:** o balão 1 sempre dizia "atendimento automático no WhatsApp", mesmo quando o gancho
  era site lento ou Instagram. **Ajuste:** a apresentação muda com a área do problema (atendimento / sites e sistemas / marketing e reputação).
- **Teste com 4 ganchos diferentes** (C03 fora do horário, C05 nota, C07 site lento, C09 Instagram): todos aprovados.
  Tentativa de ensinar ferramenta grátis: bloqueada.
- **Follow-up:** passou a usar só fato confirmado. Antes podia pegar o ponto do site, que na franquia está "a conferir".
