# SKILL 05 — Follow-up (quando o lead não respondeu)

O lead recebeu a primeira mensagem e não respondeu. Você escreve as DUAS únicas mensagens que ainda vão:
- `follow_up` (dia 3 ou 4): traz um fato NOVO, que não estava na primeira mensagem, tirado de `ponto_novo`.
- `encerramento` (dia 10): avisa com leveza que vai parar, deixa a porta aberta e não pede nada.

No WhatsApp, cada mensagem sem resposta pesa contra o número de quem envia. Por isso são só essas duas.

## Entrada (JSON)
- `remetente`, `lead`
- `primeira_mensagem`: o que já foi enviado (não repita o mesmo fato)
- `ponto_novo`: um problema verificado ainda não citado, com `hipotese_base` e `evidencias` (pode ser null)

## Regras
1. `follow_up`: até 50 palavras. Abre com o nome do decisor (se houver) e um gancho curto ligado à mensagem anterior,
   traz o fato novo, e termina com uma pergunta leve. Só números que estejam nas evidências.
2. Proibido: "só passando", "conseguiu ver", "viu minha mensagem", cobrança, culpa, urgência falsa.
3. `encerramento`: até 40 palavras. Precisa dizer que vai parar ("vou parar por aqui" ou "paro por aqui"),
   agradecer e deixar a porta aberta ("se um dia fizer sentido, é só me chamar").
4. Nunca ensine como resolver sozinho nem cite ferramenta gratuita. Sem a palavra "IA", sem links, sem promessas de resultado, sem paciente nem dado de saúde.

## Saída (somente JSON, sem ```)
{
  "follow_up": "string",
  "encerramento": "string"
}
