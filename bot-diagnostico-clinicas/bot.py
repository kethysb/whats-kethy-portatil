"""
Bot de diagnóstico e primeira mensagem para clínicas (KethyTech).

Fluxo de cada lead:
  1. Texto bruto do lead (casos/<lead>.txt)        -> coletado por você, pelo coletor.py ou por scraping
  2. SKILL 01 (LLM) extrai fatos em JSON           -> validar_extracao() confere cada trecho no texto bruto
  3. diagnosticar() pontua os problemas (CÓDIGO)   -> escolhe 1 problema ou cai na mensagem de segmento
  4. SKILL 02 (LLM) escreve a mensagem             -> validar_mensagem() confere números, tamanho, palavras
  5. SKILL 03 (LLM) revisa tom e ética             -> você aprova ou edita na fila

Só a extração, a escrita e a revisão usam IA. Pontuação e checagens são código:
isso é o que permite trocar por um modelo mais barato sem perder o controle.

Uso:
  python bot.py casos/clinica_exemplo.txt            # um lead
  python bot.py casos/                               # todos os .txt da pasta + relatorio.csv
  python bot.py casos/x.txt --fatos casos/x.fatos.json   # pula a SKILL 01 (teste do diagnóstico)
  python bot.py casos/x.txt --sem-llm                # só extração já pronta + diagnóstico, sem API

Configuração da API (variáveis de ambiente):
  LLM_PROVIDER = openai | anthropic   (openai = qualquer API compatível: OpenRouter, Keydex, Groq...)
  LLM_BASE_URL = ex.: https://api.openai.com/v1  ou  https://api.anthropic.com
  LLM_API_KEY  = sua chave
  LLM_MODEL    = ex.: claude-opus-5-5, claude-sonnet-4-6, gpt-4o-mini...
"""

from __future__ import annotations

import csv
import hashlib
from datetime import datetime
import json
import os
import re
import sys
import unicodedata
import urllib.request
from pathlib import Path

BASE = Path(__file__).resolve().parent
CATALOGO = json.loads((BASE / "config" / "catalogo_clinicas.json").read_text(encoding="utf-8"))
REMETENTE = json.loads((BASE / "config" / "remetente.json").read_text(encoding="utf-8"))
ESTUDOS = json.loads((BASE / "config" / "estudos_verificados.json").read_text(encoding="utf-8"))["estudos"]
FONTES_PROIBIDAS = ["cornell", "baymard", "mckinsey", "gartner", "forrester", "hubspot", "salesforce"]
PROMPT = {n: (BASE / "prompts" / f).read_text(encoding="utf-8") for n, f in
          {"extracao": "01_extracao.md", "mensagem": "02_mensagem.md", "revisor": "03_revisor.md",
           "diagnostico": "04_diagnostico.md", "followup": "05_followup.md"}.items()}

TAGS_VALIDAS = {"demora_resposta", "dificuldade_agendar", "faltas_remarcacao",
                "atendimento_recepcao", "preco", "elogio", "outro"}


# ----------------------------------------------------------------------------- utilidades

def normalizar(txt: str) -> str:
    """Minúsculas, sem acento, espaços colapsados: para conferir trechos literais."""
    txt = unicodedata.normalize("NFKD", txt or "")
    txt = "".join(c for c in txt if not unicodedata.combining(c))
    txt = txt.replace("“", '"').replace("”", '"').replace("’", "'")
    return re.sub(r"\s+", " ", txt).strip().lower()


def trecho_existe(trecho: str | None, bruto_norm: str) -> bool:
    if not trecho:
        return False
    t = normalizar(trecho).strip(" .…\"'")
    return len(t) >= 4 and t in bruto_norm


def idade_meses(quando: str | None) -> float | None:
    """Converte 'há 2 meses', 'há uma semana', 'a year ago' em meses."""
    if not quando:
        return None
    q = normalizar(quando)
    num = re.search(r"\d+", q)
    n = int(num.group()) if num else 1  # "há um mês", "a week ago"
    if re.search(r"dia|day|hora|hour|minut", q):
        return 0
    if re.search(r"semana|week", q):
        return n / 4.3
    if re.search(r"mes|month", q):
        return n
    if re.search(r"ano|year", q):
        return n * 12
    return None


def numeros(txt: str) -> set[str]:
    """Números de um texto, normalizados ('4,5' -> '4.5', '18h' -> '18', '18:00' -> '18', '00')."""
    achados = set()
    # Horários em inglês do Google: "1 PM" vira 13, "6:30 PM" vira 18 (e 30)
    for h, mnt in re.findall(r"\b(\d{1,2})(?::(\d{2}))?\s?PM\b", txt or "", flags=re.I):
        achados.add(str(int(h) % 12 + 12))
    for m in re.findall(r"\d+(?:[.,]\d+)?", txt or ""):
        m = m.replace(",", ".")
        achados.add(m)
        if "." in m:  # aceita 856 e 856.0, 1.200 e 1200
            achados.add(m.replace(".", ""))
            inteiro, dec = m.split(".")
            if set(dec) == {"0"}:
                achados.add(inteiro)
    return achados


DIAS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"]


def _hora_fala(dt: datetime) -> str:
    return f"{dt.hour}h" + (f"{dt.minute:02d}" if dt.minute else "")


def ler_teste_whatsapp(bruto: str) -> dict | None:
    """Lê a seção [TESTE_WHATSAPP]: enviado: AAAA-MM-DD HH:MM | resposta: AAAA-MM-DD HH:MM ou 'sem resposta'."""
    m = re.search(r"\[TESTE_WHATSAPP\](.*?)(?=\n\[[A-Z_]+\]|\Z)", bruto, re.S)
    if not m:
        return None
    campos = {}
    for linha in m.group(1).strip().splitlines():
        if ":" in linha:
            k, v = linha.split(":", 1)
            campos[k.strip().lower()] = v.strip()
    try:
        enviado = datetime.strptime(campos["enviado"], "%Y-%m-%d %H:%M")
    except (KeyError, ValueError):
        return None
    teste = {"trecho": m.group(1).strip(), "pergunta": campos.get("pergunta"),
             "enviado_em": f"{DIAS[enviado.weekday()]} às {_hora_fala(enviado)}",
             "fora_do_horario": enviado.hour >= 19 or enviado.hour < 8 or enviado.weekday() == 6}
    resp = campos.get("resposta", "")
    if not resp or "sem" in resp.lower():
        teste.update(minutos=None, resposta_em="até agora, sem resposta", sem_resposta=True)
        return teste
    resposta = datetime.strptime(resp, "%Y-%m-%d %H:%M")
    teste["minutos"] = int((resposta - enviado).total_seconds() // 60)
    teste["sem_resposta"] = False
    dia = "no mesmo dia" if resposta.date() == enviado.date() else (
        "no dia seguinte" if (resposta.date() - enviado.date()).days == 1 else f"na {DIAS[resposta.weekday()]}")
    teste["resposta_em"] = f"{dia} às {_hora_fala(resposta)}"
    return teste


def variante_ab(nome_clinica: str) -> str:
    """Sorteio fixo por clínica (sempre cai na mesma variante): A = sem falar da solução, B = com meia frase do que a KethyTech entrega."""
    if os.environ.get("AB_FORCAR") in ("A", "B"):  # só para testes: AB_FORCAR=B python bot.py ...
        return os.environ["AB_FORCAR"]
    if not CATALOGO.get("teste_ab", {}).get("ativo"):
        return "A"
    return "AB"[int(hashlib.md5(normalizar(nome_clinica).encode()).hexdigest(), 16) % 2]


def ler_lead(bruto: str) -> dict:
    """Lê a seção [LEAD] (chave: valor) do texto bruto. Não usa IA."""
    lead = {}
    m = re.search(r"\[LEAD\](.*?)(?=\n\[[A-Z]+\]|\Z)", bruto, re.S)
    if m:
        for linha in m.group(1).strip().splitlines():
            if ":" in linha:
                k, v = linha.split(":", 1)
                lead[k.strip().lower()] = v.strip()
    return lead


# ----------------------------------------------------------------------------- cliente LLM

def chamar_llm(system: str, user: dict | str, temperatura: float = 0.2) -> str:
    provedor = os.environ.get("LLM_PROVIDER", "openai").lower()
    base_url = os.environ.get("LLM_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    chave = os.environ["LLM_API_KEY"]
    modelo = os.environ["LLM_MODEL"]
    conteudo = user if isinstance(user, str) else json.dumps(user, ensure_ascii=False)

    if provedor == "anthropic":
        url = f"{base_url}/v1/messages"
        corpo = {"model": modelo, "max_tokens": 4000, "temperature": temperatura,
                 "system": system, "messages": [{"role": "user", "content": conteudo}]}
        headers = {"x-api-key": chave, "anthropic-version": "2023-06-01"}
    else:
        url = f"{base_url}/chat/completions"
        corpo = {"model": modelo, "temperature": temperatura,
                 "messages": [{"role": "system", "content": system},
                              {"role": "user", "content": conteudo}]}
        headers = {"Authorization": f"Bearer {chave}"}

    req = urllib.request.Request(url, data=json.dumps(corpo).encode(),
                                 headers={**headers, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as r:
        resp = json.loads(r.read())
    if provedor == "anthropic":
        return "".join(b.get("text", "") for b in resp["content"])
    return resp["choices"][0]["message"]["content"]


def extrair_json(txt: str) -> dict:
    txt = txt.strip()
    txt = re.sub(r"^```(?:json)?|```$", "", txt, flags=re.M).strip()
    ini, fim = txt.find("{"), txt.rfind("}")
    return json.loads(txt[ini:fim + 1])


def chamar_json(system: str, user: dict, validar=None, tentativas: int = 3) -> tuple[dict, list[str]]:
    """Chama o LLM, exige JSON e, se houver validador, devolve os erros para ele corrigir."""
    erros: list[str] = []
    saida: dict = {}
    entrada = dict(user)
    for _ in range(tentativas):
        try:
            saida = extrair_json(chamar_llm(system, entrada))
        except (json.JSONDecodeError, ValueError) as e:
            erros = [f"JSON inválido: {e}"]
            entrada = {**user, "erros_da_tentativa_anterior": erros}
            continue
        erros = validar(saida) if validar else []
        if not erros:
            return saida, []
        entrada = {**user, "sua_resposta_anterior": saida, "erros_da_tentativa_anterior": erros}
    return saida, erros


# ----------------------------------------------------------------------------- etapa 2: validar extração

def validar_extracao(fatos: dict, bruto: str) -> tuple[dict, list[str]]:
    """Confere cada trecho no texto bruto. O que não bate é anulado (nunca vira gancho)."""
    b = normalizar(bruto)
    avisos = []

    def anular(secao: str, campos: list[str], trecho_campo: str, rotulo: str):
        s = fatos.get(secao) or {}
        if any(s.get(c) not in (None, False) for c in campos) and not trecho_existe(s.get(trecho_campo), b):
            avisos.append(f"{rotulo}: trecho não encontrado no texto bruto, dado anulado")
            for c in campos:
                s[c] = None

    anular("google", ["nota", "total_avaliacoes"], "nota_trecho", "Nota do Google")
    h = (fatos.get("google") or {}).get("horario") or {}
    if any(h.get(c) for c in ("fecha_dias_uteis", "sabado", "domingo")) and not trecho_existe(h.get("trecho"), b):
        avisos.append("Horário: trecho não encontrado, horário anulado")
        for c in ("fecha_dias_uteis", "sabado", "domingo"):
            h[c] = None
    anular("site", ["tem_agendamento_online", "tem_botao_whatsapp"], "trecho", "Site")
    anular("instagram", ["data_ultimo_post", "dias_desde_ultimo_post"], "trecho", "Instagram")
    anular("anuncios", ["ativos", "destino_whatsapp", "procedimento"], "trecho", "Anúncios")
    anular("doctoralia", ["tem_agenda_online"], "trecho", "Doctoralia")
    c = fatos.get("clinica") or {}
    if c.get("decisor_nome") and not trecho_existe(c.get("decisor_trecho"), b):
        avisos.append("Nome do decisor não confirmado no texto bruto: removido")
        c["decisor_nome"] = None

    validas = []
    for a in fatos.get("avaliacoes") or []:
        a["tags"] = [t for t in a.get("tags") or [] if t in TAGS_VALIDAS]
        if not trecho_existe(a.get("trecho"), b):
            avisos.append(f"Avaliação {a.get('id')}: trecho inventado ou alterado, descartada")
            continue
        a["idade_meses"] = idade_meses(a.get("quando"))
        validas.append(a)
    fatos["avaliacoes"] = validas
    return fatos, avisos


# ----------------------------------------------------------------------------- etapa 3: diagnóstico (código)

def _hora(h: str | None) -> int | None:
    m = re.match(r"(\d{1,2})", h or "")
    return int(m.group(1)) if m else None


def diagnosticar(fatos: dict, teste: dict | None = None) -> list[dict]:
    """Aplica as regras do catálogo. Devolve os candidatos ordenados por pontuação."""
    g = fatos.get("google") or {}
    h = g.get("horario") or {}
    site = fatos.get("site") or {}
    ps = fatos.get("pagespeed") or {}
    ig = fatos.get("instagram") or {}
    ads = fatos.get("anuncios") or {}
    doc = fatos.get("doctoralia") or {}
    recentes = [a for a in fatos.get("avaliacoes") or []
                if a.get("idade_meses") is not None and a["idade_meses"] <= 6]

    def com_tag(tag):
        return [a for a in recentes if tag in a["tags"]]

    def ev_aval(lista):
        return [{"id": a["id"], "fonte": "avaliação no Google", "trecho": a["trecho"],
                 "quando": a.get("quando")} for a in lista]

    # Sem site também conta como "sem agendamento online no site" (correção do teste Redeorto).
    # Link de WhatsApp na ficha NÃO é agendamento online: é atendimento manual.
    site_sem_agenda = site.get("tem_agendamento_online") is False or (not g.get("site") and g.get("nota") is not None)
    sem_agendamento_online = (site_sem_agenda
                              and doc.get("tem_agenda_online") is not True
                              and g.get("tem_link_agendamento") is not True)

    achados: dict[str, dict] = {}

    demora = com_tag("demora_resposta")
    if demora:
        achados["C01"] = {"confianca": "alta" if len(demora) >= 2 else "media",
                          "evidencias": ev_aval(demora[:3])}

    agendar = com_tag("dificuldade_agendar")
    if agendar and sem_agendamento_online:
        achados["C02"] = {"confianca": "alta" if len(agendar) >= 2 else "media",
                          "evidencias": ev_aval(agendar[:2]) + [
                              {"id": "SITE", "fonte": "site", "trecho": site.get("trecho")}]}

    fecha = _hora(h.get("fecha_dias_uteis"))
    if fecha is not None and fecha <= 19 and h.get("sabado") in ("fechado", "manha") and sem_agendamento_online:
        # Se o WhatsApp é o canal de agendamento da ficha, a dependência do horário humano é fato, não inferência.
        achados["C03"] = {"confianca": "alta" if g.get("tem_link_whatsapp") else "media",
                          "evidencias": [{"id": "HORARIO", "fonte": "ficha do Google", "trecho": h.get("trecho")}],
                          "variaveis": {"fecha_dias_uteis": h.get("fecha_dias_uteis")}}

    com_info = [a for a in (fatos.get("avaliacoes") or [])[:10] if a.get("tem_resposta_proprietario") is not None]
    if len(com_info) >= 5:
        respondidas = sum(1 for a in com_info if a["tem_resposta_proprietario"])
        if respondidas / len(com_info) <= 0.2:
            achados["C04"] = {"confianca": "alta",
                              "evidencias": [{"id": "RESPOSTAS", "fonte": "avaliações no Google",
                                              "trecho": f"{respondidas} de {len(com_info)} avaliações recentes com resposta"}],
                              "variaveis": {"respondidas": respondidas, "analisadas": len(com_info)}}

    if g.get("nota") is not None and g["nota"] < 4.3 and (g.get("total_avaliacoes") or 0) >= 20:
        achados["C05"] = {"confianca": "alta",
                          "evidencias": [{"id": "NOTA", "fonte": "ficha do Google", "trecho": g.get("nota_trecho")}],
                          "variaveis": {"nota": g["nota"], "total_avaliacoes": g.get("total_avaliacoes")}}

    if g.get("tem_link_whatsapp") is False and site.get("tem_botao_whatsapp") is False:
        achados["C06"] = {"confianca": "alta",
                          "evidencias": [{"id": "SITE", "fonte": "site e ficha do Google", "trecho": site.get("trecho")}]}

    if ps.get("coletado") and ((ps.get("score_mobile") or 100) < 50 or (ps.get("lcp_segundos") or 0) > 4):
        achados["C07"] = {"confianca": "alta",
                          "evidencias": [{"id": "PAGESPEED", "fonte": "teste PageSpeed do Google",
                                          "trecho": f"score mobile {ps.get('score_mobile')}, LCP {ps.get('lcp_segundos')} s"}],
                          "variaveis": {"lcp_segundos": ps.get("lcp_segundos"), "score_mobile": ps.get("score_mobile")}}

    franquia = bool((fatos.get("clinica") or {}).get("franquia"))
    if not g.get("site") and g.get("nota") is not None:
        achados["C08"] = {"confianca": "media" if franquia else "alta",
                          "evidencias": [{"id": "SEM_SITE", "fonte": "ficha do Google", "trecho": "ficha sem site"}],
                          "a_conferir": ("Franquia: confira se a rede tem página da unidade antes de citar."
                                         if franquia else None)}

    if g.get("telefone_e_fixo") and g.get("tem_link_whatsapp"):
        achados["C12"] = {"confianca": "alta",
                          "evidencias": [{"id": "TELEFONE", "fonte": "ficha do Google",
                                          "trecho": f"telefone em destaque {g.get('telefone')} (fixo); WhatsApp só no botão de agendar"}],
                          "variaveis": {"telefone": g.get("telefone")}}

    if ig.get("coletado") and (ig.get("dias_desde_ultimo_post") or 0) > 60:
        achados["C09"] = {"confianca": "alta",
                          "evidencias": [{"id": "INSTAGRAM", "fonte": "Instagram", "trecho": ig.get("trecho")}],
                          "variaveis": {"data_ultimo_post": ig.get("data_ultimo_post")}}

    if (ads.get("ativos") or 0) > 0 and ads.get("destino_whatsapp") and ("C01" in achados or "C03" in achados):
        base = achados.get("C01") or achados.get("C03")
        achados["C10"] = {"confianca": base["confianca"],
                          "evidencias": [{"id": "ANUNCIOS", "fonte": "Biblioteca de Anúncios da Meta",
                                          "trecho": ads.get("trecho")}] + base["evidencias"],
                          "variaveis": {"procedimento_anuncio": ads.get("procedimento") or "procedimentos"}}

    faltas = com_tag("faltas_remarcacao")
    if faltas:
        achados["C11"] = {"confianca": "alta" if len(faltas) >= 2 else "media",
                          "evidencias": ev_aval(faltas[:2])}

    if teste:
        rapido_fora_do_horario = (not teste["sem_resposta"] and teste["minutos"] <= 30 and teste["fora_do_horario"])
        if rapido_fora_do_horario:
            # Responderam rápido mesmo fora do horário: a hipótese de "ninguém responde" é falsa.
            achados.pop("C01", None)
            achados.pop("C03", None)
            achados.pop("C10", None)
        elif teste["sem_resposta"] or teste["minutos"] >= 60:
            achados["C13"] = {"confianca": "alta",
                              "evidencias": [{"id": "TESTE", "fonte": "teste no WhatsApp da clínica",
                                              "trecho": teste["trecho"]}],
                              "variaveis": {"enviado_em": teste["enviado_em"], "resposta_em": teste["resposta_em"]}}
            achados.pop("C01", None)  # o teste real substitui a evidência indireta das avaliações

    pc, ps_ = CATALOGO["pesos_confianca"], CATALOGO["pesos_servico"]
    candidatos = []
    for p in CATALOGO["problemas"]:
        if p["id"] not in achados:
            continue
        a = achados[p["id"]]
        score = round(p["impacto"] * pc[a["confianca"]] * ps_[p["servico"]], 2)
        candidatos.append({**p, **a, "score": score, "variaveis": a.get("variaveis", {}),
                           "a_conferir": a.get("a_conferir")})
    for c in candidatos:  # preenche {variáveis} das frases-base
        for campo in ("hipotese_base", "pergunta_base", "oferta_base"):
            try:
                c[campo] = c[campo].format(**{k: v for k, v in c["variaveis"].items() if v is not None})
            except (KeyError, IndexError):
                pass
    # Desempate: fato medido por você (C13) > fato observado > número de evidências
    return sorted(candidatos, key=lambda c: (-c["score"], c["id"] != "C13", -len(c["evidencias"])))


# ----------------------------------------------------------------------------- etapa 4: validar mensagem

PALAVRAS_ORIGEM = ["google", "site", "instagram", "doctoralia", "indica", "maps", "anuncio"]


def validar_mensagem(msg: dict, problema: dict, lead: dict, outros_pontos: int = 0,
                     dica: dict | None = None) -> list[str]:
    erros = []
    b1, b2 = msg.get("balao_1") or "", msg.get("balao_2") or ""
    texto = f"{b1} {b2}"
    n = len(texto.split())
    limite_max = REMETENTE["limite_palavras_max"] + (10 if outros_pontos else 0) + (15 if dica else 0)
    if not (REMETENTE["limite_palavras_min"] <= n <= limite_max):
        erros.append(f"Tamanho: {n} palavras (permitido {REMETENTE['limite_palavras_min']}-{limite_max})")
    if outros_pontos and not re.search(r"\bmais\b", normalizar(b2)):
        erros.append(f"Há {outros_pontos} outro(s) ponto(s): o balão 2 precisa avisar que notou mais pontos")

    t_norm = normalizar(texto)
    for p in REMETENTE["palavras_proibidas"]:
        if p == "IA":
            if re.search(r"\bIA\b", texto):
                erros.append("Palavra proibida: IA")
        elif re.search(rf"(?<!\w){re.escape(normalizar(p))}(?!\w)", t_norm):
            erros.append(f"Palavra proibida: {p}")

    if REMETENTE["nome"].lower() not in b1.lower() or REMETENTE["empresa"].lower() not in b1.lower():
        erros.append("Balão 1 precisa ter o nome e a empresa do remetente")
    if not any(w in normalizar(b1) for w in PALAVRAS_ORIGEM):
        erros.append("Balão 1 precisa dizer de onde veio o contato (Google, site, Instagram...)")
    if "?" not in b2:
        erros.append("Balão 2 precisa terminar com uma pergunta de interesse")
    if not any(normalizar(s).rstrip(".") in t_norm for s in REMETENTE["saidas_faceis"]):
        erros.append("Falta uma das saídas fáceis do remetente")
    if dica and normalizar(dica["palavra_chave"]) not in t_norm:
        erros.append(f"Variante B: a meia frase da solução precisa aparecer ({dica['texto']})")
    if re.search(r"https?://|www\.", texto):
        erros.append("Sem links na primeira mensagem")

    permitidos = set()
    for fonte in [json.dumps(problema.get("evidencias"), ensure_ascii=False),
                  json.dumps(problema.get("variaveis"), ensure_ascii=False),
                  problema.get("oferta_base", ""), problema.get("pergunta_base", ""),
                  problema.get("hipotese_base", ""), " ".join(REMETENTE["saidas_faceis"]),
                  json.dumps(lead, ensure_ascii=False), f"{outros_pontos} {outros_pontos + 1}",
                  (dica or {}).get("texto", "")]:
        permitidos |= numeros(fonte)
    estranhos = numeros(texto) - permitidos
    if estranhos:
        erros.append(f"Números sem evidência: {sorted(estranhos)} (só use números das evidências)")
    return erros


# ----------------------------------------------------------------------------- pipeline

def mensagem_de_segmento(lead: dict) -> dict:
    """Fallback quando nenhum problema tem pontuação suficiente: não força um gancho falso."""
    nome = lead.get("clinica", "a clínica")
    return {"balao_1": f"Oi, tudo bem? Falo com o responsável pela {nome}? Aqui é a {REMETENTE['nome']}, "
                       f"da {REMETENTE['empresa']}. Achei o contato de vocês no Google.",
            "balao_2": "Eu cuido de atendimento automático no WhatsApp para clínicas: responder, agendar e "
                       "confirmar consulta, inclusive à noite. Faz sentido te mandar em 2 linhas como funciona? "
                       + REMETENTE["saidas_faceis"][0],
            "evidencias_usadas": [], "observacao_para_revisor": "Mensagem de segmento: nenhum problema verificável."}


SCORE_MINIMO_PONTO_EXTRA = 1.5
TEXTO_SERVICO = {"automacao": "atendimento e automação no WhatsApp",
                 "programacao": "site e programação", "marketing": "marketing e reputação"}


def escolher_pontos(candidatos: list[dict], maximo: int = 3) -> list[dict]:
    """Problema principal + até 2 extras, preferindo serviços diferentes (mostra a agência inteira).
    C10 já contém a evidência de C01/C03, então não repete esses dois junto com ele."""
    if not candidatos:
        return []
    principal = candidatos[0]
    repetidos = ({"C01", "C03"} if principal["id"] == "C10" else
                 {"C01", "C03", "C10"} if principal["id"] == "C13" else set())
    pc = CATALOGO["pesos_confianca"]
    # Para ENTRAR no diagnóstico conta impacto x confiança; o peso do serviço só ordena (não exclui).
    extras = [c for c in candidatos[1:]
              if c["impacto"] * pc[c["confianca"]] >= SCORE_MINIMO_PONTO_EXTRA and c["id"] not in repetidos]
    escolhidos, servicos = [principal], {principal["servico"]}
    for c in extras:  # primeiro, um de cada serviço ainda não mostrado
        if len(escolhidos) < maximo and c["servico"] not in servicos:
            escolhidos.append(c)
            servicos.add(c["servico"])
    for c in extras:  # depois, completa pela pontuação
        if len(escolhidos) < maximo and c not in escolhidos:
            escolhidos.append(c)
    return escolhidos


def montar_entrada_diagnostico(pontos: list[dict], lead: dict) -> dict:
    return {"remetente": {k: REMETENTE[k] for k in ("nome", "empresa")}, "lead": lead,
            "pontos": [{"id": p["id"], "nome": p["nome"], "area": TEXTO_SERVICO[p["servico"]],
                        "hipotese_base": p["hipotese_base"], "oferta_base": p["oferta_base"],
                        "variaveis": p["variaveis"], "evidencias": p["evidencias"],
                        "a_conferir": p.get("a_conferir"),
                        "estudos_permitidos": [{k: e[k] for k in ("id", "frase_permitida", "o_que_mede")}
                                               for e in ESTUDOS if p["id"] in e["problemas"]]}
                       for p in pontos]}


def validar_diagnostico(d: dict, pontos: list[dict]) -> list[str]:
    erros = []
    itens = d.get("pontos") or []
    if len(itens) != len(pontos):
        erros.append(f"O diagnóstico precisa ter exatamente {len(pontos)} pontos")
    ids = {p["id"] for p in pontos}
    for i, it in enumerate(itens, 1):
        if it.get("id") not in ids:
            erros.append(f"Ponto {i}: id {it.get('id')} não está entre os problemas verificados")
        for campo in ("titulo", "o_que_vi", "por_que_importa", "como_resolvo"):
            if not it.get(campo):
                erros.append(f"Ponto {i}: falta o campo {campo}")
        limite = 60
        eid = it.get("estudo_id")
        if eid:
            estudo = next((e for e in ESTUDOS if e["id"] == eid), None)
            if not estudo:
                erros.append(f"Ponto {i}: estudo {eid} não existe na tabela de estudos verificados")
            elif it.get("id") not in estudo["problemas"]:
                erros.append(f"Ponto {i}: o estudo {eid} não serve para o problema {it.get('id')}")
            elif not all(normalizar(k) in normalizar(it.get("estudo", "")) for k in estudo["palavras_chave"]):
                erros.append(f"Ponto {i}: cite a fonte do estudo ({estudo['fonte_curta']})")
            elif numeros(it.get("estudo", "")) - numeros(estudo["frase_permitida"]):
                erros.append(f"Ponto {i}: o estudo foi citado com números diferentes da tabela")
            elif any(re.search(rf"\b{re.escape(normalizar(v))}", normalizar(it.get("estudo", "")))
                     for v in estudo.get("raizes_vedadas_na_citacao", [])):
                erros.append(f"Ponto {i}: a citação do estudo {eid} distorce o que ele mede ({estudo['o_que_mede']})")
            limite = 60 + len((it.get("estudo") or "").split())
        elif it.get("estudo"):
            erros.append(f"Ponto {i}: tem texto de estudo sem estudo_id")
        campos = ("o_que_vi", "por_que_importa", "como_resolvo", "estudo")
        if len(" ".join(str(it.get(c) or "") for c in campos).split()) > limite:
            erros.append(f"Ponto {i}: passou de {limite} palavras")
    texto = json.dumps({"abertura": d.get("abertura"), "fechamento": d.get("fechamento"),
                        "pontos": [{k: v for k, v in it.items() if k not in ("id", "estudo_id")} for it in itens]},
                       ensure_ascii=False)
    permitidos = set()
    for it in itens:
        e = next((e for e in ESTUDOS if e["id"] == it.get("estudo_id")), None)
        if e:
            permitidos |= numeros(e["frase_permitida"])
    for p in pontos:
        permitidos |= numeros(json.dumps({k: p.get(k) for k in ("evidencias", "variaveis", "hipotese_base",
                                                                 "oferta_base")}, ensure_ascii=False))
    permitidos |= numeros(" ".join(str(i) for i in range(1, len(pontos) + 2))) | numeros("15 24")
    estranhos = numeros(texto) - permitidos
    if estranhos:
        erros.append(f"Números sem evidência no diagnóstico: {sorted(estranhos)}")
    t_norm = normalizar(texto)
    tem_estudo = any(it.get("estudo_id") for it in itens)
    if sum(1 for it in itens if it.get("estudo_id")) > 2:
        erros.append("No máximo 2 pontos com estudo no diagnóstico")
    for p in REMETENTE["palavras_proibidas"]:
        # Depois do "sim": convite para conversar, "agente de IA" e estudo da tabela são permitidos
        if p in ("IA", "reunião", "call") or (tem_estudo and p in ("estudo", "pesquisa mostra")):
            continue
        if re.search(rf"(?<!\w){re.escape(normalizar(p))}(?!\w)", t_norm):
            erros.append(f"Palavra proibida no diagnóstico: {p}")
    for f in FONTES_PROIBIDAS:
        if f in t_norm:
            erros.append(f"Fonte fora da tabela de estudos verificados: {f}")
    return erros


PROIBIDO_FOLLOWUP = ["so passando", "conseguiu ver", "viu minha mensagem", "ultima chance", "urgente"]


def validar_followup(f: dict, ponto_novo: dict | None, dica: dict | None, primeira: dict) -> list[str]:
    erros = []
    fu, enc = f.get("follow_up") or "", f.get("encerramento") or ""
    if not fu or len(fu.split()) > 50:
        erros.append(f"follow_up precisa ter entre 1 e 50 palavras (tem {len(fu.split())})")
    if "?" not in fu:
        erros.append("follow_up precisa terminar com uma pergunta leve")
    if not enc or len(enc.split()) > 40:
        erros.append(f"encerramento precisa ter entre 1 e 40 palavras (tem {len(enc.split())})")
    if not re.search(r"vou parar|paro por aqui|nao vou mais", normalizar(enc)):
        erros.append("encerramento precisa dizer que vai parar")
    t = normalizar(fu + " " + enc)
    for p in PROIBIDO_FOLLOWUP:
        if p in t:
            erros.append(f"Expressão proibida no follow-up: {p}")
    for p in REMETENTE["palavras_proibidas"]:
        if p != "IA" and re.search(rf"(?<!\w){re.escape(normalizar(p))}(?!\w)", t):
            erros.append(f"Palavra proibida no follow-up: {p}")
    if re.search(r"\bIA\b", fu + enc) or re.search(r"https?://|www\.", fu + enc):
        erros.append("Sem 'IA' e sem links no follow-up")
    permitidos = numeros(json.dumps([ponto_novo, dica, primeira], ensure_ascii=False))
    estranhos = numeros(fu + " " + enc) - permitidos
    if estranhos:
        erros.append(f"Números sem evidência no follow-up: {sorted(estranhos)}")
    return erros


def formatar_diagnostico_whatsapp(d: dict) -> str:
    """Texto pronto para colar no WhatsApp (negrito com *asteriscos*)."""
    partes = [d.get("abertura", "")]
    for i, it in enumerate(d.get("pontos") or [], 1):
        estudo = f" {it['estudo']}" if it.get("estudo") else ""
        partes.append(f"*{i}. {it.get('titulo')}*\n{it.get('o_que_vi')} {it.get('por_que_importa')}{estudo}\n"
                      f"_Como resolvo:_ {it.get('como_resolvo')}")
    partes.append(d.get("fechamento", ""))
    return "\n\n".join(p for p in partes if p)


def processar(caminho: Path, fatos_prontos: Path | None = None, sem_llm: bool = False) -> dict:
    bruto = caminho.read_text(encoding="utf-8")
    lead = ler_lead(bruto)
    resultado = {"lead": lead, "arquivo": caminho.name}

    # SKILL 01
    if fatos_prontos:
        fatos = json.loads(fatos_prontos.read_text(encoding="utf-8"))
    elif sem_llm:
        raise SystemExit("--sem-llm exige --fatos")
    else:
        fatos, _ = chamar_json(PROMPT["extracao"], {"texto_bruto": bruto})
    fatos, avisos = validar_extracao(fatos, bruto)
    resultado["avisos_extracao"] = avisos
    resultado["fatos"] = fatos

    # Diagnóstico (código)
    teste = ler_teste_whatsapp(bruto)
    resultado["teste_whatsapp"] = teste
    candidatos = diagnosticar(fatos, teste)
    resultado["candidatos"] = [{"id": c["id"], "nome": c["nome"], "score": c["score"],
                                "confianca": c["confianca"]} for c in candidatos]
    escolhido = candidatos[0] if candidatos and candidatos[0]["score"] >= CATALOGO["score_minimo"] else None
    resultado["problema_escolhido"] = escolhido["id"] if escolhido else None

    lead_msg = {"clinica": (fatos.get("clinica") or {}).get("nome") or lead.get("clinica"),
                "decisor": (fatos.get("clinica") or {}).get("decisor_nome") or lead.get("decisor"),
                "cidade": lead.get("cidade"), "origem_contato": lead.get("origem_contato")}

    if escolhido is None:
        resultado["mensagem"] = mensagem_de_segmento(lead_msg)
        resultado["erros_mensagem"] = []
        resultado["status"] = "segmento"
        return resultado
    pontos = escolher_pontos(candidatos)
    outros = len(pontos) - 1
    resultado["pontos_diagnostico"] = [p["id"] for p in pontos]
    resultado["a_conferir"] = [p["a_conferir"] for p in pontos if p.get("a_conferir")]
    if sem_llm:
        resultado["status"] = "diagnostico_ok_sem_mensagem"
        return resultado

    # SKILL 02 com validação automática e até 3 tentativas
    remetente_msg = {**REMETENTE, "descricao_curta": REMETENTE["descricao_por_area"][escolhido["servico"]]}
    entrada = {"remetente": remetente_msg, "lead": lead_msg,
               "problema": {k: escolhido[k] for k in ("id", "nome", "hipotese_base", "pergunta_base",
                                                      "oferta_base", "variaveis")},
               "evidencias": escolhido["evidencias"],
               "outros_pontos": outros}
    variante = variante_ab(lead_msg["clinica"] or caminho.stem)
    dica = escolhido.get("solucao_kethytech") if variante == "B" else None
    if variante == "B" and not dica:
        variante = "A"
    resultado["variante_ab"] = variante
    if dica:
        entrada["solucao_kethytech"] = dica["texto"]
    msg, erros = chamar_json(PROMPT["mensagem"], entrada,
                             validar=lambda m: validar_mensagem(m, escolhido, lead_msg, outros, dica))
    resultado["mensagem"], resultado["erros_mensagem"] = msg, erros

    # SKILL 04: diagnóstico de até 3 pontos, já pronto para mandar depois do "sim"
    if len(pontos) > 1:
        entrada_d = montar_entrada_diagnostico(pontos, lead_msg)
        diag, erros_d = chamar_json(PROMPT["diagnostico"], entrada_d,
                                    validar=lambda d: validar_diagnostico(d, pontos))
        resultado["diagnostico"], resultado["erros_diagnostico"] = diag, erros_d
        if not erros_d:
            resultado["diagnostico_whatsapp"] = formatar_diagnostico_whatsapp(diag)

    # SKILL 05: follow-up (dia 3/4) e encerramento (dia 10), já prontos para quem não responder
    if not erros:
        extras_seguros = [p for p in pontos[1:] if not p.get("a_conferir")]  # follow-up só com fato confirmado
        ponto_novo = extras_seguros[0] if extras_seguros else None
        dica_fu = None  # follow-up traz fato novo; não ensinamos a solução de graça
        entrada_f = {"remetente": {k: REMETENTE[k] for k in ("nome", "empresa")}, "lead": lead_msg,
                     "primeira_mensagem": msg,
                     "ponto_novo": ({k: ponto_novo[k] for k in ("nome", "hipotese_base", "evidencias", "variaveis")}
                                    if ponto_novo else None),
                     }
        fu, erros_f = chamar_json(PROMPT["followup"], entrada_f,
                                  validar=lambda f: validar_followup(f, entrada_f["ponto_novo"], dica_fu, msg))
        resultado["followup"], resultado["erros_followup"] = fu, erros_f

    # SKILL 03
    if not erros:
        rev, _ = chamar_json(PROMPT["revisor"], {"mensagem": msg, "problema": entrada["problema"],
                                                  "evidencias": escolhido["evidencias"]})
        resultado["revisao"] = rev
        resultado["status"] = "pronto_para_aprovar" if rev.get("aprovado") else "revisar"
    else:
        resultado["status"] = "bloqueado"
    return resultado


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        return
    alvo = Path(args[0])
    fatos = Path(args[args.index("--fatos") + 1]) if "--fatos" in args else None
    sem_llm = "--sem-llm" in args
    arquivos = sorted(alvo.glob("*.txt")) if alvo.is_dir() else [alvo]
    (BASE / "saida").mkdir(exist_ok=True)

    linhas = []
    for arq in arquivos:
        r = processar(arq, fatos, sem_llm)
        (BASE / "saida" / f"{arq.stem}.json").write_text(json.dumps(r, ensure_ascii=False, indent=2), encoding="utf-8")
        m = r.get("mensagem") or {}
        linhas.append({"lead": arq.stem, "status": r["status"], "problema": r.get("problema_escolhido"),
                       "avisos": len(r.get("avisos_extracao", [])), "erros": "; ".join(r.get("erros_mensagem", [])),
                       "balao_1": m.get("balao_1", ""), "balao_2": m.get("balao_2", "")})
        print(f"\n=== {arq.stem}: {r['status']} | problema {r.get('problema_escolhido')}")
        for c in r["candidatos"]:
            print(f"   {c['id']} {c['nome']}: score {c['score']} ({c['confianca']})")
        if r.get("pontos_diagnostico"):
            print(f"   pontos do diagnóstico: {r['pontos_diagnostico']}")
        for a in r.get("a_conferir", []):
            print(f"   A CONFERIR: {a}")
        for a in r.get("avisos_extracao", []):
            print(f"   aviso: {a}")
        if m:
            print(f"   > {m.get('balao_1')}\n   > {m.get('balao_2')}")

    if len(arquivos) > 1:
        with open(BASE / "saida" / "relatorio.csv", "w", newline="", encoding="utf-8-sig") as f:
            w = csv.DictWriter(f, fieldnames=list(linhas[0].keys()), delimiter=";")
            w.writeheader()
            w.writerows(linhas)


if __name__ == "__main__":
    main()
