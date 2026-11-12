# Bot de diagnóstico e primeira mensagem para clínicas (KethyTech)

O bot olha os dados públicos de uma clínica, encontra o problema mais visível **e verificável**,
e escreve a primeira mensagem de WhatsApp falando desse problema. Você aprova antes de enviar.

## Como ele funciona

```
casos/<lead>.txt  (texto bruto: ficha do Google, avaliações, site, PageSpeed, Instagram, anúncios)
   │
   ├─ SKILL 01 (IA) ─ extrai os fatos em JSON, cada um com o trecho literal de onde saiu
   │      └─ código confere se cada trecho existe no texto bruto; o que não existe é descartado
   │
   ├─ diagnóstico (CÓDIGO, sem IA) ─ aplica as regras do catálogo e dá nota:
   │      impacto (1–5) × confiança (alta 1,0 / média 0,6 / baixa 0,3) × peso do serviço
   │      └─ se nenhum problema passar de 2,4, usa a mensagem de segmento (não inventa gancho)
   │
   ├─ SKILL 02 (IA) ─ escreve 2 balões com 1 fato, hipótese, pergunta e saída fácil
   │      └─ código confere: tamanho, nome/empresa, origem do contato, palavras proibidas,
   │         e se TODO número da mensagem existe nas evidências (se não, devolve para a IA corrigir)
   │
   ├─ SKILL 04 (IA) ─ diagnóstico de até 3 pontos (principal + extras de áreas diferentes:
   │      atendimento, site, marketing), já pronto para mandar quando o lead disser "sim"
   │      └─ código confere números, tamanho de cada ponto e se cada ponto é um problema verificado
   │
   ├─ SKILL 05 (IA) ─ follow-up do dia 3/4 (fato novo ou dica) e encerramento do dia 10
   │      └─ código confere tamanho, "vou parar por aqui", expressões proibidas e números
   │
   └─ SKILL 03 (IA) ─ revisa tom, ética (CFM/CFO) e cara de golpe → status para você aprovar
```

**Teste do WhatsApp (opcional):** se você colocar a seção `[TESTE_WHATSAPP]` no caso, o código calcula
a demora sozinho. Demora de 60 min ou mais vira o gancho principal (C13), porque um fato medido por você
ganha de qualquer suposição. Resposta rápida fora do horário descarta os ganchos de "demora".

**Teste A/B:** cada clínica é sorteada, sempre na mesma variante: A (sem falar da solução) ou B (com meia frase do que a KethyTech entrega, sem ensinar como).
Para testar uma variante específica: `set AB_FORCAR=B` antes de rodar.

**Estudos:** só no resumo depois do "sim" (no máximo 2) e só os da `config/estudos_verificados.json`.
O código barra fonte fora da tabela (ex.: "Cornell"), número diferente do estudo e citação que distorce o que ele mede
(ex.: o da Harvard mede chance de conversar com o cliente, então "vende 7 vezes mais" é bloqueado).
Para acrescentar um estudo novo, confira a fonte original antes e preencha todos os campos.

**A sequência inteira, com respostas prontas, ligação e métricas, está no `PLAYBOOK.md`.**

**Em degraus:** a primeira mensagem fala de 1 problema e avisa "notei mais X pontos" quando existem
outros verificados. O diagnóstico completo (campo `diagnostico_whatsapp` em `saida/<lead>.json`, já
formatado para colar no WhatsApp) só vai depois do "sim". Pontos marcados com `A CONFERIR`
(ex.: franquia que pode ter site da rede) precisam da sua checagem antes do envio.

**Por que a pontuação é código:** modelos baratos erram mais quando precisam decidir.
Aqui a IA só lê, escreve e revisa, e as decisões ficam em regras que você controla no
`config/catalogo_clinicas.json`.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `prompts/01_extracao.md` | Skill de extração (system prompt) |
| `prompts/02_mensagem.md` | Skill de escrita da mensagem |
| `prompts/03_revisor.md` | Skill de revisão |
| `prompts/04_diagnostico.md` | Skill do diagnóstico de até 3 pontos (depois do "sim") |
| `prompts/05_followup.md` | Skill do follow-up e do encerramento |
| `PLAYBOOK.md` | Sequência completa, respostas prontas, ligação, áudio, A/B e métricas |
| `config/catalogo_clinicas.json` | Os 13 problemas (C01 a C13), com a meia frase de solução de cada um, impacto, serviço e frases-base |
| `config/estudos_verificados.json` | Os únicos estudos que o bot pode citar (Harvard/HBR, Opinion Box, Maister), com o que cada um mede e as ressalvas |
| `config/remetente.json` | Seu nome, empresa, saídas fáceis, palavras proibidas, limites de tamanho |
| `bot.py` | Pipeline completo + cliente de API |
| `teste_validador.py` | Testa as checagens sem gastar API |
| `casos/` | Um `.txt` por lead (veja `clinica_exemplo.txt`) |
| `saida/` | Resultado de cada lead em JSON + `relatorio.csv` para aprovar em lote |
| `CADERNO_DE_TESTES.md` | Onde anotamos os erros de cada Maps testado |

## Rodar com a sua API

```bash
# API compatível com OpenAI (OpenRouter, Keydex, Groq, OpenAI...)
set LLM_PROVIDER=openai
set LLM_BASE_URL=https://sua-api/v1
set LLM_API_KEY=sua-chave
set LLM_MODEL=claude-sonnet-4-6

python bot.py casos/clinica_exemplo.txt   # um lead
python bot.py casos/                      # todos os leads da pasta + saida/relatorio.csv
```

Para a API da Anthropic direto: `LLM_PROVIDER=anthropic` e `LLM_BASE_URL=https://api.anthropic.com`.
Não precisa instalar nada: usa só a biblioteca padrão do Python.

## Comparar modelos (Opus × mais barato)

1. Junte de 20 a 30 casos reais em `casos/`, já conferidos no caderno de testes.
2. Rode a pasta inteira com cada modelo, trocando só `LLM_MODEL`, e guarde os `relatorio.csv`.
3. Compare: % de leads em que o problema escolhido bateu com o caderno, % bloqueados pelo validador,
   avisos de trecho inventado na extração e % aprovados pelo revisor.
4. O modelo barato serve quando acerta o mesmo problema em 90% ou mais dos casos e tem zero trecho inventado aprovado.

## Formato do texto bruto (casos/<lead>.txt)

Seções opcionais: `[LEAD]`, `[GOOGLE]`, `[AVALIACOES]`, `[SITE]`, `[PAGESPEED]`, `[INSTAGRAM]`,
`[ANUNCIOS]`, `[DOCTORALIA]`, `[TESTE_WHATSAPP]`. Seção que não foi coletada simplesmente não entra; o bot trata como
"não sabe" e não usa como gancho. Em `[LEAD]` informe `clinica`, `cidade`, `origem_contato` e, se souber, `decisor`.

## Próximos passos
- Coletor automático (Google Places API para ficha e avaliações + PageSpeed Insights API, que é grátis).
  Observação: a Places API devolve só 5 avaliações e não traz as respostas do proprietário;
  para a regra C04 vai ser preciso o navegador.
- Fila de aprovação no seu simulador (ler `saida/*.json`).
