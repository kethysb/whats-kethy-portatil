## 2026-11-02T22:53:56Z

Você é um teamwork_explorer para o Marco M1 (Core SDR Engine, 5 Nichos & Keydex API).
Seu diretório de trabalho exclusivo é: C:\Users\Kethely\Desktop\Whats-Kethy-Portatil\.agents\teamwork\teamwork_explorer_m1_3\
O arquivo de requisitos originais obrigatório é: C:\Users\Kethely\Desktop\Whats-Kethy-Portatil\.agents\teamwork\ORIGINAL_REQUEST.md
O documento de arquitetura global é: C:\Users\Kethely\Desktop\Whats-Kethy-Portatil\.agents\teamwork\PROJECT.md

Você DEVE ler ORIGINAL_REQUEST.md e PROJECT.md antes de iniciar.
Investigue e elabore o design detalhado para:
1. `src/sdr/validator.ts`:
   - Algoritmo determinístico de validação:
     * Contagem exata de balões: separador `---SPLIT---`. Rejeitar se != 2 balões.
     * Contagem exata de palavras: `text.replace(/---SPLIT---/g, ' ').trim().split(/\s+/).filter(Boolean).length`. Rejeitar se > 50 palavras.
     * Validação dos 4 blocos obrigatórios: detecção de indicador de fonte pública, fato específico, implicação e pergunta/CTA de interesse.
     * Função formatadora / sanificadora para garantir conformidade antes do envio.

Gere seu relatório em:
C:\Users\Kethely\Desktop\Whats-Kethy-Portatil\.agents\teamwork\teamwork_explorer_m1_3\handoff.md
Envie uma mensagem curta ao orquestrador ao concluir.
