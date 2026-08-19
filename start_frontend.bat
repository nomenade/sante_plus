@echo off
chcp 65001 >nul
echo ========================================
echo   Santé+ Frontend - Demarrage
echo ========================================
echo.
cd /d d:\apk_sante\frontend
echo Lancement du serveur de developpement...
echo.
npm run dev
pause
