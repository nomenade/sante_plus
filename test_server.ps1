# Tester le serveur backend Sante+
$ErrorActionPreference = "Stop"

Write-Host "=== Test du serveur backend ===" -ForegroundColor Cyan

# Arreter les processus python existants
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Lancer le serveur en arriere-plan
Write-Host "`n1. Lancement du serveur..." -ForegroundColor Yellow
$server = Start-Process -FilePath "python" -ArgumentList "d:\apk_sante\backend\app.py" -PassThru -WindowStyle Hidden

# Attendre que le serveur demarre
Write-Host "2. Attente du demarrage (5s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verifier que le processus tourne
if ($server -and -not $server.HasExited) {
    Write-Host "   OK Processus serveur actif (PID: $($server.Id))" -ForegroundColor Green
} else {
    Write-Host "   ERREUR Le serveur s'est arrete prematurement" -ForegroundColor Red
    exit 1
}

# Tester l'endpoint de sante
Write-Host "`n3. Test de l'endpoint /health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5001/health" -Method GET -TimeoutSec 10 -UseBasicParsing
    Write-Host "   OK Reponse HTTP $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   OK Contenu: $($response.Content)" -ForegroundColor Green
    
    if ($response.StatusCode -eq 200) {
        Write-Host "`n=== SUCCES : Le serveur fonctionne correctement ===" -ForegroundColor Green
        $success = $true
    } else {
        Write-Host "`n=== ECHEC : Statut HTTP inattendu ===" -ForegroundColor Red
        $success = $false
    }
} catch {
    Write-Host "   ERREUR: $($_.Exception.Message)" -ForegroundColor Red
    $success = $false
}

# Nettoyage
Write-Host "`n4. Arret du serveur..." -ForegroundColor Yellow
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force

if ($success) {
    exit 0
} else {
    exit 1
}
