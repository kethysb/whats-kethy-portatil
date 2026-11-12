@echo off
chcp 65001 > nul
title Whats Kethy - Iniciando Servidor...
cls

echo ======================================================
echo    🚀 INICIANDO O WHATS KETHY...
echo ======================================================
echo.

:: Verificar se o Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] O Node.js não foi encontrado neste computador!
    echo Por favor, baixe e instale o Node.js em: https://nodejs.org
    echo Depois de instalar, abra este arquivo novamente.
    echo.
    pause
    exit /b 1
)

:: Se não tiver a pasta node_modules, instala automático
if not exist "node_modules\" (
    echo [!] Primeira execução detectada! Instalando dependências...
    echo Isso só acontece uma vez, por favor aguarde...
    call npm install --allow-git=all
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao instalar dependências.
        pause
        exit /b 1
    )
    echo [OK] Dependências instaladas com sucesso!
    echo.
)

:: Abrir o navegador no painel automaticamente após 3 segundos
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3333"

:: Iniciar o servidor
echo ======================================================
echo  Painel Web abrindo em: http://localhost:3333
echo  Para fechar o servidor, basta fechar esta janela.
echo ======================================================
echo.

npx tsx src/server.ts
pause
