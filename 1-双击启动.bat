@echo off
chcp 65001 >nul
title 薪火相传有继承 - AI案例生成器
echo.
echo ========================================
echo   薪火相传有继承 - AI案例生成器
echo ========================================
echo.
echo   正在启动服务...
echo.
cd /d "%~dp0"
start "" "http://localhost:3456"
node\node.exe server.js
pause
