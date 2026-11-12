# 📱 Whats Kethy — Guia Rápido de Instalação e Acesso

Este pacote contém o motor completo do seu WhatsApp conectado via Baileys com Painel Web visual e Agente de IA (Groq/Qwen/Whisper/Vision).

---

## 💻 Opção 1: Rodar em outro Computador Windows (1 Clique)

1. Copie esta pasta para o outro computador (via Pendrive, Google Drive ou Baixando o .ZIP).
2. Certifique-se de que o **Node.js** está instalado (baixe em [nodejs.org](https://nodejs.org) se não tiver).
3. Dê **2 cliques no arquivo `INICIAR.bat`**.
4. Ele vai instalar tudo automaticamente na primeira vez e abrir o painel no navegador:
   👉 **`http://localhost:3333`**
5. Na tela vai aparecer o **QR Code** para você conectar o WhatsApp pelo celular (Aparelhos Conectados).

---

## 📱 Opção 2: Acessar do Celular ou de Qualquer Lugar (Fora de Casa)

Se você deixar o computador ligado em casa e quiser acessar o painel do seu celular na rua:
1. Dê **2 cliques no arquivo `INICIAR_COM_ACESSO_EXTERNO.bat`**.
2. Ele vai iniciar o servidor e criar um link público gratuito (via Cloudflare).
3. Vai aparecer um link na janela (ex: `https://xxxx.trycloudflare.com`).
4. Abra esse link no navegador do seu celular ou de qualquer outro PC e você terá o controle total do seu WhatsApp!

---

## ☁️ Opção 3: Rodar 24 Horas em uma VPS na Nuvem (Ex: Hostinger)

Se você quiser que ele fique ligado 24h por dia sem precisar deixar o seu notebook ligado:

1. Acesse o terminal da sua VPS (onde já roda a Telles Club).
2. Envie os arquivos desta pasta para a VPS ou clone com git.
3. Se tiver Docker na VPS, basta rodar:
   ```bash
   docker compose up -d --build
   ```
4. Se preferir rodar direto com PM2:
   ```bash
   npm install --allow-git=all
   pm2 start "npx tsx src/server.ts" --name "whats-kethy"
   pm2 save
   ```
5. Acesse pelo IP da sua VPS na porta 3333 (ex: `http://177.7.59.132:3333`).

---

## ⚙️ Arquivos Importantes:

* **`INICIAR.bat`**: Atalho de 1 clique para iniciar no Windows.
* **`INICIAR_COM_ACESSO_EXTERNO.bat`**: Cria link online para abrir no celular.
* **`src/`**: Código do servidor e IA.
* **`public/index.html`**: O painel web visual.
* **`.env`**: Suas chaves de IA e configurações.
