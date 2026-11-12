@echo off
title SIMULADOR WHATSAPP SDR V2 - KETHELY
color 0A
cls
echo ======================================================
echo    SIMULADOR WHATSAPP SDR (PORTA 5555)
echo    8 Nichos Cientificos + Tiers A/B/C + Gong Labs
echo ======================================================
echo.

cd /d "%~dp0"

echo Abrindo navegador na porta 5555...
start http://localhost:5555

node server.cjs
pause
