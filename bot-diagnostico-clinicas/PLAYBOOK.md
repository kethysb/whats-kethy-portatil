# Playbook de prospecção: clínicas (KethyTech)

A sequência inteira de um lead, do primeiro contato à demonstração. O bot gera os textos marcados com [BOT];
o resto é você.

## Visão geral

| Quando | O quê | Quem |
|---|---|---|
| Antes (opcional, leads bons) | Ligação de 1 min para a recepção: descobrir o nome de quem decide | Você |
| Antes (opcional, leads bons) | Teste do WhatsApp da clínica fora do horário | Você |
| Dia 0 | Primeira mensagem: 1 problema + "notei mais X pontos" (+ meia frase do que você entrega, na variante B) | [BOT] você aprova |
| Respondeu "sim" | Responder em minutos com o diagnóstico de até 3 pontos | [BOT] já pronto |
| Depois do diagnóstico | Áudio de 30–40 s com a sua voz (opcional) + convite para a demo | Você |
| Dia 3 ou 4, sem resposta | Follow-up com fato novo | [BOT] já pronto |
| Dia 10, sem resposta | Encerramento: "vou parar por aqui" | [BOT] já pronto |
| Respondeu "não" ou "pare" | Agradecer e tirar da lista na hora | Você |

Máximo de 3 mensagens sem resposta por lead (primeira + follow-up + encerramento). No WhatsApp, cada mensagem
sem resposta pesa contra o seu número.

## 1. Ligação para a recepção (antes da mensagem)

> Oi, tudo bem? Aqui é a Kethely. Queria mandar uma mensagem pra pessoa que cuida da parte administrativa
> da clínica. Qual o nome dela e qual o melhor WhatsApp pra isso?

Anote o nome em `decisor:` na seção `[LEAD]`. Em franquia, pergunte quem é o responsável pela unidade.
Se a recepção não passar, tudo bem: o bot usa "Falo com o responsável pela...".

## 2. Teste do WhatsApp (cliente oculto, com ética)

- Mande UMA pergunta real e simples, à noite ou no fim de semana: "Vocês atendem sábado?" ou "Qual o valor da avaliação?".
- Nunca marque consulta, nunca invente sintoma, nunca peça orçamento que dê trabalho à equipe.
- Prefira um número diferente do que vai prospectar, mas sempre conte na primeira mensagem que foi você.
- Registre no caso:

```
[TESTE_WHATSAPP]
pergunta: Vocês atendem sábado?
enviado: 2026-11-07 20:05
resposta: 2026-11-08 09:12      (ou: resposta: sem resposta)
```

O que o bot faz com isso:
- resposta depois de 60 min ou sem resposta: vira o problema principal (C13);
- resposta em até 30 min fora do horário: a clínica já resolve isso, e o bot descarta os ganchos de "demora" e "fora do horário".

## 3. Respostas prontas

**"Sim" / "pode mandar"** → mande o `diagnostico_whatsapp` do `saida/<lead>.json` (troque [HORARIO_1] e [HORARIO_2]).

**"Sim, ninguém responde à noite" (confirmou a dor)**
> Imaginei. Muita gente pesquisa tratamento à noite, quando está em casa. Te mando o resumo dos 3 pontos agora
> e, se fizer sentido, te mostro funcionando com o nome de vocês em 15 minutos.

**"Quanto custa?"**
> Depende do volume de mensagens e do que vocês querem automatizar. Pra clínica do tamanho de vocês costuma
> ficar entre [SUA FAIXA]. Te mostro funcionando e já passo o valor certinho, pode ser [HORARIO_1] ou [HORARIO_2]?

**"A recepção já dá conta"**
> Total, e pelas avaliações a recepção faz um ótimo trabalho. A ideia não é substituir: é ela não responder
> a mesma pergunta vinte vezes por dia, e ninguém ficar sem resposta depois do horário. Quer ver como ficaria?

**"Manda por aqui, não tenho tempo pra reunião"**
> Claro! Monto um teste com as informações de vocês e te mando: você manda "oi" e vê como responderia. Te mando até amanhã, pode ser?

**"É golpe?" / "Quem te passou meu número?"**
> Pergunta justa, tem muito golpe por aí. Sou a Kethely, da KethyTech, de SP. Peguei o número na ficha de vocês
> no Google. Não vou pedir nada, nem dado nem pagamento. Se quiser conferir, te mando meu Instagram. E se
> preferir não receber contato, é só falar que eu tiro vocês da lista.

**"Não tenho interesse" / "Pare"**
> Sem problema, obrigada por responder! Tiro vocês da lista. Boa semana!

Registre o "não" e nunca mais mande mensagem para esse número (direito de oposição, LGPD).

**Sumiu depois do "sim" (2 dias)**
> Oi, [Nome]! Ainda faz sentido eu te mostrar aquele teste? Se a semana estiver corrida, me fala uma melhor.

## 4. Áudio

- Nunca na primeira mensagem (áudio de desconhecido parece golpe e exige parar para ouvir).
- Depois que a pessoa responder: 30 a 40 s, com a sua voz real, falando o nome dela e o ponto principal.
- Voz clonada ou gerada por IA: não.

## 5. Teste A/B que já está rodando

O bot sorteia cada clínica (sempre a mesma variante para a mesma clínica):
- **A:** primeira mensagem sem falar da solução;
- **B:** primeira mensagem com meia frase do que a KethyTech entrega (ex.: "dá pra deixar o WhatsApp respondendo
  e agendando sozinho, inclusive à noite"), sem ensinar como fazer.

A dica grátis foi retirada: ela ensinava a resolver com ferramenta gratuita e competia com o seu serviço.

O campo `variante_ab` fica em `saida/<lead>.json` e no `relatorio.csv`. Anote o resultado de cada lead
na planilha de controle: respondeu, respondeu positivo, marcou demo, bloqueou ou pediu para parar.

**Quando decidir:** com cerca de 100 leads em cada variante. A métrica principal é **demo marcada por lead contatado**.
Se B marcar mais demos sem aumentar bloqueios, B vira o padrão e testamos a próxima ideia.

## 6. O que medir toda semana

| Métrica | Fórmula |
|---|---|
| Taxa de resposta | respostas ÷ leads contatados |
| Resposta positiva | "sim"/interesse ÷ leads contatados |
| Demo marcada | demos ÷ leads contatados (a principal) |
| Bloqueio/pare | pedidos de parar + bloqueios percebidos ÷ leads contatados (a de segurança) |
| Tempo até responder o lead | minutos entre a resposta dele e a sua (meta: menos de 15) |

## Nível de evidência de cada peça (para não se iludir)

| Peça | Evidência |
|---|---|
| Oferta em vez de pedir reunião | Gong/30MPC: +28% de resposta com oferta (dado de fornecedor, e-mail) |
| 1 problema relevante em vez de personalização superficial | Gong/30MPC, Meetime (fornecedores; e-mail e multicanal) |
| Teste do WhatsApp como gancho | Método de cliente oculto da HBR (2.241 empresas); uso em prospecção não medido |
| Meia frase da solução na primeira mensagem | Sem dado; pitch completo derruba resposta (Gong), meia frase de resultado não foi medida. Por isso está em teste A/B |
| Máximo de 2 follow-ups | Dados de e-mail (Ramper) + limite de mensagens sem resposta que o WhatsApp está testando |
| Ligação para a recepção | Cadência multicanal (Meetime, fornecedor) |
| Áudio só depois da resposta | Sem dado; julgamento por risco de golpe |
| Horário de envio | Sem dado confiável; teste meio da manhã × começo da tarde |
