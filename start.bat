@echo off
title Santé+ - Application
echo ==================================================
echo   Santé+ - Lancement des serveurs
echo ==================================================
echo.

echo [1/2] Demarrage du backend (Flask API)...
start "Santé+ API" cmd /c "cd /d d:\apk_sante\backend && python app.py"
timeout /t 3 /nobreak >nul

echo [2/2] Demarrage du frontend (Vite React)...
start "Santé+ Frontend" cmd /c "cd /d d:\apk_sante\frontend && node_modules\.bin\vite.cmd --host"

echo.
echo ==================================================
echo   Les serveurs sont en cours de demarrage...
echo.
echo   Backend  : http://127.0.0.1:5001
echo   Frontend : http://localhost:5173
echo ==================================================
echo.
echo  Appuyez sur une touche pour ouvrir le navigateur...
pause >nul

start http://localhost:5173