@echo off
title Poas Agua y Fuego - Servidor
cd /d "%~dp0"

echo.
echo  Instalando dependencias...
call npm install

echo.
echo  Iniciando servidor...
echo.
node server.js
pause
