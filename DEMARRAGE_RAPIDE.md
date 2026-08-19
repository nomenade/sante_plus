# 🚀 Démarrage Rapide - Application Santé+

## ✅ État Actuel

### Backend (Flask)
- **Status**: ✅ **DÉJÀ EN COURS D'EXÉCUTION**
- **Port**: 5001
- **URL**: http://127.0.0.1:5001
- **Health Check**: ✅ Fonctionnel

### Frontend (Vite)
- **Status**: ❌ **NÉCESSITE DÉMARRAGE MANUEL**
- **Port**: 5173
- **URL**: http://localhost:5173

---

## 🎯 Démarrage en 2 Étapes

### **Étape 1 : Backend (DÉJÀ LANCÉ)**
Le backend est déjà en cours d'exécution ! Vérifiez avec :
```powershell
http://127.0.0.1:5001/health
```

Si vous avez besoin de le redémarrer :
```powershell
python d:\apk_sante\run_server.py
```

---

### **Étape 2 : Frontend (À LANCER)**

#### **Méthode A : Double-clic (PLUS SIMPLE)**
1. Ouvrez l'explorateur de fichiers
2. Allez dans `d:\apk_sante\`
3. **Double-cliquez sur** `start_frontend.bat`
4. Une fenêtre va s'ouvrir avec le serveur

#### **Méthode B : Ligne de commande**
```powershell
cd d:\apk_sante\frontend
npm run dev
```

#### **Méthode C : PowerShell**
```powershell
powershell -ExecutionPolicy Bypass -File d:\apk_sante\start_frontend.ps1
```

---

## 🌐 Accéder à l'Application

Une fois les deux serveurs lancés :

1. Ouvrez votre navigateur
2. Allez sur : **http://localhost:5173**
3. Connectez-vous avec :
   - **Email**: test@test.com
   - **Mot de passe**: Test1234!

---

## 📊 Vérification Rapide

### Test Backend
```powershell
try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:5001/health' -UseBasicParsing; Write-Host '✅ Backend OK' } catch { Write-Host '❌ Backend DOWN' }
```

### Test Frontend
```powershell
try { $r = Invoke-WebRequest -Uri 'http://localhost:5173' -UseBasicParsing; Write-Host '✅ Frontend OK' } catch { Write-Host '❌ Frontend DOWN' }
```

---

## 🔧 Dépannage

### Backend ne répond pas
```powershell
# Vérifier les processus
Get-Process python -ErrorAction SilentlyContinue

# Redémarrer le backend
python d:\apk_sante\run_server.py
```

### Frontend ne démarre pas
```powershell
# Vérifier que npm est installé
npm --version

# Réinstaller les dépendances si nécessaire
cd d:\apk_sante\frontend
npm install

# Puis relancer
npm run dev
```

### Port déjà utilisé
```powershell
# Backend (port 5001)
netstat -ano | findstr :5001

# Frontend (port 5173)
netstat -ano | findstr :5173

# Tuer un processus (exemple pour port 5173, PID 1234)
Stop-Process -Id 1234 -Force
```

---

## 📝 Commandes Utiles

### Arrêter tous les serveurs
```powershell
# Arrêter le backend
Get-Process python | Stop-Process -Force

# Arrêter le frontend
Get-Process node | Stop-Process -Force
```

### Voir les logs
```powershell
# Logs backend
Get-Content d:\apk_sante\server_stderr.log -Tail 20
Get-Content d:\apk_sante\server_stdout.log -Tail 20
```

---

## ⚡ Performance Backend

**Temps de démarrage**: ~9 secondes (normal pour la première fois)  
**Temps par requête**: ~2 secondes

**Pourquoi c'est lent ?**
- Le fichier `app.py` charge un gros dictionnaire de données médicales au démarrage
- Une fois démarré, le serveur reste rapide

**Conseil**: Gardez le serveur ouvert pendant vos tests, ne le redémarrez pas à chaque fois.

---

## 🎓 Résumé pour l'Utilisateur

### **Pour lancer l'application complète :**

1. **Backend** : Déjà lancé (port 5001)
   - Si besoin : `python d:\apk_sante\run_server.py`

2. **Frontend** : Double-cliquez sur `d:\apk_sante\start_frontend.bat`
   - Ou lancez : `cd d:\apk_sante\frontend && npm run dev`

3. **Navigateur** : http://localhost:5173

4. **Login** : test@test.com / Test1234!

---

## ✅ Checklist de Vérification

- [ ] Backend accessible sur http://127.0.0.1:5001/health
- [ ] Frontend accessible sur http://localhost:5173
- [ ] Page de login s'affiche
- [ ] Connexion réussie avec test@test.com
- [ ] Dashboard s'affiche après connexion

---

**Date**: 12 Août 2026  
**Version**: 1.0  
**Status**: ✅ Prêt pour les tests
