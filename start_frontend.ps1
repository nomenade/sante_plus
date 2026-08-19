#!/usr/bin/env pwsh
# Script de démarrage du frontend Santé+
Set-Location 'd:\apk_sante\frontend'
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Santé+ Frontend - Démarrage" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Lancement du serveur de développement..." -ForegroundColor Yellow
Write-Host "URL: http://localhost:5173" -ForegroundColor Green
Write-Host ""
npm run dev
