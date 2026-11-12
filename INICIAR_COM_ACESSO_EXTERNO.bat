@echo off
chcp 65001 > nul
title Whats Kethy - Acesso Externo (Internet/Celular)
cls

echo ======================================================
echo    🌐 INICIANDO WHATS KETHY COM LINK PARA INTERNET
echo ======================================================
echo.

:: Iniciar o servidor em segundo plano
start "Servidor Whats Kethy" cmd /c "npx tsx src/server.ts"

echo Aguardando servidor iniciar...
timeout /t 4 /nobreak >nul

echo Gerando link público e seguro para você acessar de qualquer lugar...
echo Copie o link abaixo para abrir no celular ou em outro computador:
echo.

npx cloudflared tunnel --url http://localhost:3333
pause
