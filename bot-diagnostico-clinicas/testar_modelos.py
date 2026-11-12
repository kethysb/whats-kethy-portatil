"""Testa quais modelos respondem numa API (sem gravar a chave em arquivo).

Uso (PowerShell):
  $env:LLM_API_KEY="sua-chave"
  python testar_modelos.py kie          # https://api.kie.ai/claude/v1/messages (formato Anthropic)
  python testar_modelos.py keydex       # https://keydex.shop/v1/chat/completions (formato OpenAI)
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

ALVOS = {
    "kie": {"url": "https://api.kie.ai/claude/v1/messages", "formato": "anthropic",
            "modelos": ["claude-opus-5-5", "claude-opus-5", "claude-opus-4-8", "claude-opus-4-7",
                        "claude-opus-4-5", "claude-sonnet-5-5", "claude-sonnet-4-6", "claude-haiku-5-5",
                        "claude-haiku-4-5", "claude-fable-5"]},
    "keydex": {"url": "https://keydex.shop/v1/chat/completions", "formato": "openai",
               "modelos": ["claude-opus-5-5", "claude-sonnet-4-6"]},
}


def testar(url, formato, modelo, chave):
    pergunta = 'Responda só com o JSON {"ok": true}'
    if formato == "anthropic":
        corpo = {"model": modelo, "max_tokens": 50, "stream": False,
                 "messages": [{"role": "user", "content": pergunta}]}
    else:
        corpo = {"model": modelo, "max_tokens": 50, "messages": [{"role": "user", "content": pergunta}]}
    req = urllib.request.Request(url, data=json.dumps(corpo).encode(),
                                 headers={"Authorization": f"Bearer {chave}", "Content-Type": "application/json",
                                          "anthropic-version": "2023-06-01"})
    t = time.time()
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            dados = json.loads(r.read())
    except urllib.error.HTTPError as e:
        return f"ERRO HTTP {e.code}: {e.read()[:160].decode(errors='ignore')}"
    except Exception as e:  # noqa: BLE001
        return f"ERRO: {e}"
    seg = time.time() - t
    if isinstance(dados, dict) and dados.get("code") not in (None, 200):
        return f"RECUSADO ({dados.get('code')}): {str(dados.get('msg') or dados)[:160]}"
    if formato == "anthropic":
        texto = "".join(b.get("text", "") for b in dados.get("content", []) if isinstance(b, dict))
    else:
        texto = dados["choices"][0]["message"]["content"]
    extra = f" | modelo respondido: {dados.get('model')}"
    if "credits_consumed" in dados:
        extra += f" | créditos: {dados['credits_consumed']}"
    return f"OK em {seg:.1f}s | resposta: {texto.strip()[:60]!r}{extra}"


if __name__ == "__main__":
    alvo = ALVOS[sys.argv[1] if len(sys.argv) > 1 else "kie"]
    chave = os.environ["LLM_API_KEY"]
    for m in alvo["modelos"]:
        print(f"{m:22s} -> {testar(alvo['url'], alvo['formato'], m, chave)}", flush=True)
