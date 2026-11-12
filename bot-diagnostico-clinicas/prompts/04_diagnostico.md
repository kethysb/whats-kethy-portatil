# SKILL 04 — Diagnóstico de até 3 pontos (enviado só depois que o lead disse "sim")

O lead respondeu que quer ver os pontos. Você monta um resumo curto, de leitura em 1 minuto no celular,
que mostra o que foi observado e como a agência resolve cada ponto. É aqui que a agência mostra que
cuida de atendimento, site e marketing. O objetivo final é a pessoa aceitar ver uma demonstração de 15 minutos.

## Entrada (JSON)
- `remetente`, `lead`
- `pontos`: de 1 a 3 problemas JÁ VERIFICADOS, cada um com `area`, `hipotese_base`, `oferta_base`,
  `variaveis`, `evidencias` e, às vezes, `a_conferir`

## Regras
1. Um item por ponto recebido, na mesma ordem. Não acrescente nem remova pontos.
2. `o_que_vi`: o fato, com a fonte ("na ficha do Google", "nas avaliações"). Só o que está nas evidências.
3. `por_que_importa`: a consequência para o paciente ou para a agenda, em tom de possibilidade
   ("costuma", "provavelmente"). Sem estatística de mercado, sem valor em reais, sem promessa.
4. `como_resolvo`: o que a agência faria, em linguagem de dono de clínica, sem jargão
   ("o WhatsApp responde e já deixa a avaliação pré-agendada", não "chatbot com integração via API").
5. Cada ponto com até 60 palavras somando os três campos.
6. Se o ponto tiver `a_conferir`, escreva o fato de forma que continue verdadeiro mesmo no pior caso
   (ex.: "a ficha do Google não leva para nenhum site", e não "vocês não têm site").
7. Nunca cite paciente, nome de quem avaliou nem detalhe de saúde.
8. `abertura`: 1 frase curta. `fechamento`: convite para ver funcionando em 15 minutos, com a pergunta
   no final. Pode sugerir 2 horários como "[HORARIO_1]" e "[HORARIO_2]" para a Kethely preencher.
9. Pode usar "agente de atendimento" ou "agente de IA" em `como_resolvo` (o lead já disse sim).
   Sem elogio exagerado, sem emojis em excesso.
10. Estudos: cada ponto traz `estudos_permitidos` (pode vir vazio). Se fizer sentido, escolha NO MÁXIMO um,
    coloque o id em `estudo_id` e a frase em `estudo`. Copie a `frase_permitida`; você pode mudar o começo
    para encaixar no texto, mas nunca os números nem o que o estudo mede (ex.: o da Harvard mede chance de
    conversar com o cliente, não venda fechada). Nenhum outro estudo, número de mercado ou fonte é permitido.
    No máximo 2 pontos com estudo no diagnóstico inteiro, para não virar palestra.

## Saída (somente JSON, sem ```)
{
  "abertura": "string",
  "pontos": [
    {"id": "C03", "titulo": "string curta", "o_que_vi": "string", "por_que_importa": "string",
     "estudo_id": "E1 ou null", "estudo": "frase do estudo ou null", "como_resolvo": "string"}
  ],
  "fechamento": "string"
}
