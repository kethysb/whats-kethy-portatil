"""Testa as checagens automáticas sem gastar API: python teste_validador.py"""
import json
from pathlib import Path
from bot import validar_extracao, diagnosticar, validar_mensagem

bruto = Path("casos/clinica_exemplo.txt").read_text(encoding="utf-8")
fatos, _ = validar_extracao(json.loads(Path("casos/clinica_exemplo.fatos.json").read_text(encoding="utf-8")), bruto)
problema = diagnosticar(fatos)[0]
lead = {"clinica": "Clínica Exemplo Derma", "decisor": None, "cidade": "Campinas", "origem_contato": "ficha do Google"}
print("Problema escolhido:", problema["id"], problema["nome"])

boa = {"balao_1": "Oi, tudo bem? Falo com o responsável pela Clínica Exemplo Derma? Aqui é a Kethely, da KethyTech. "
                  "Cuido de atendimento automático no WhatsApp para clínicas e achei o contato de vocês no Google.",
       "balao_2": "Vi que vocês estão com anúncio de peeling levando direto pro WhatsApp, e algumas avaliações recentes "
                  "comentam demora pra ter resposta. Quem responde esses contatos hoje? Se não for prioridade, é só me dizer."}
ruim = {"balao_1": "Olá, equipe! Preparamos um vídeo executivo para vocês.",
        "balao_2": "Vocês estão perdendo 70 a 120 pacientes por mês e R$ 150.000 por ano, segundo estudo da Cornell. "
                   "Nossa IA resolve isso. Vamos marcar uma reunião?"}
for nome, msg in [("BOA", boa), ("RUIM", ruim)]:
    erros = validar_mensagem(msg, problema, lead)
    print(f"\nMensagem {nome}: {'APROVADA' if not erros else 'BLOQUEADA'}")
    for e in erros:
        print("  -", e)
