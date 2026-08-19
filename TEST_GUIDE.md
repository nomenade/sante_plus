# Guide de Test - Application Santé+

## ✅ État des Serveurs

### Backend (Flask) - Port 5001
- **Status**: ✅ En cours d'exécution
- **URL**: http://127.0.0.1:5001
- **Health Check**: http://127.0.0.1:5001/health

### Frontend (Vite) - Port 5173
- **Status**: ✅ En cours d'exécution
- **URL**: http://localhost:5173

---

## 🧪 Tests à Effectuer

### 1. Test d'Inscription
```bash
POST http://127.0.0.1:5001/api/register
Content-Type: application/json

{
  "email": "test@test.com",
  "password": "Test1234!"
}
```

**Résultat attendu**: 
- Status: 201
- Message: "Compte créé avec succès ! Vous pouvez maintenant vous connecter."

### 2. Test de Connexion
```bash
POST http://127.0.0.1:5001/api/login
Content-Type: application/json

{
  "email": "test@test.com",
  "password": "Test1234!"
}
```

**Résultat attendu**:
- Status: 200
- Token JWT retourné
- Rôle: "user"

### 3. Test de l'API Conseils Santé
```bash
POST http://127.0.0.1:5001/api/advice
Content-Type: application/json
Authorization: Bearer <VOTRE_TOKEN>

{
  "disease": "paludisme"
}
```

**Résultat attendu**:
- Status: 200
- Données de conseils pour le paludisme

---

## 🌐 Accès à l'Application

### Frontend
Ouvrez votre navigateur et accédez à :
```
http://localhost:5173
```

### Comptes de Test
- **Email**: test@test.com
- **Mot de passe**: Test1234!

---

## 📋 Fonctionnalités à Tester

### 1. Authentification
- [ ] Inscription avec un nouvel email
- [ ] Connexion avec le compte test
- [ ] Validation du mot de passe (8 caractères, majuscule, chiffre, caractère spécial)
- [ ] Déconnexion

### 2. Chatbot Santé
- [ ] Envoyer un message texte
- [ ] Recevoir une réponse du chatbot
- [ ] Tester la dictée vocale (microphone)
- [ ] Consulter une fiche de conseil

### 3. Symptom Checker
- [ ] Cliquer sur une zone du corps
- [ ] Sélectionner des symptômes
- [ ] Lancer l'analyse
- [ ] Voir les hypothèses de diagnostic

### 4. Carnet de Santé (UserDashboard)
- [ ] Voir le profil utilisateur
- [ ] Ajouter/modifier des antécédents
- [ ] Gérer les médicaments
- [ ] Suivre l'hydratation
- [ ] Consulter l'historique

### 5. Localisateur d'Urgences
- [ ] Voir la carte
- [ ] Localiser les hôpitaux
- [ ] Localiser les pharmacies de garde
- [ ] Calculer les distances

### 6. Backoffice (Admin)
- [ ] Accéder au backoffice (nécessite un compte admin)
- [ ] Voir la liste des utilisateurs
- [ ] Voir les statistiques
- [ ] Promouvoir un utilisateur en admin
- [ ] Supprimer un utilisateur

---

## 🔧 Corrections Effectuées

### Backend
1. ✅ Installation de `flask-limiter` (protection contre les attaques brute force)
2. ✅ Démarrage automatique du serveur Flask sur le port 5001
3. ✅ Configuration CORS pour autoriser les requêtes depuis le frontend

### Frontend
1. ✅ Suppression du paramètre `token` inutilisé dans `Dashboard.jsx`
2. ✅ Correction des erreurs de lint dans `Auth.jsx` (caractère d'échappement)
3. ✅ Correction des erreurs de lint dans `Chatbot.jsx` (paramètres catch inutilisés)
4. ✅ Correction des erreurs de lint dans `UserDashboard.jsx` (paramètres catch inutilisés)
5. ✅ Démarrage du serveur Vite sur le port 5173

---

## 🚀 Commandes de Démarrage

### Démarrer le Backend
```bash
python d:\apk_sante\run_server.py
```

### Démarrer le Frontend
```bash
cd d:\apk_sante\frontend
npm run dev
```

### Démarrer les deux serveurs
Les deux serveurs sont déjà en cours d'exécution. Si vous devez les redémarrer :

```powershell
# Backend
python d:\apk_sante\run_server.py

# Frontend (dans un nouveau terminal)
cd d:\apk_sante\frontend
npm run dev
```

---

## 📝 Notes

- Le backend utilise SQLite par défaut (`health.db`) en développement
- Pour utiliser PostgreSQL, définissez la variable d'environnement `DATABASE_URL`
- Le frontend utilise l'URL de l'API définie dans `.env.production` ou `http://127.0.0.1:5001/api` en développement
- Les tokens JWT expirent après 1 heure
- Le rate limiting est actif (50 requêtes par heure par IP)

---

## 🐛 Dépannage

### Backend ne démarre pas
```bash
# Vérifier les logs
Get-Content d:\apk_sante\server_stderr.log
Get-Content d:\apk_sante\server_stdout.log
```

### Frontend ne démarre pas
```bash
# Vérifier que le port 5173 n'est pas déjà utilisé
netstat -ano | findstr :5173

# Tuer le processus si nécessaire
Stop-Process -Id <PID> -Force
```

### Erreur CORS
Vérifiez que le backend est démarré et accessible sur http://127.0.0.1:5001

### Erreur de base de données
Supprimez le fichier `d:\apk_sante\backend\health.db` pour recréer la base de données

---

## ✅ Vérification Rapide

```powershell
# Test backend
try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:5001/health' -UseBasicParsing; Write-Host '✅ Backend OK' } catch { Write-Host '❌ Backend ERREUR' }

# Test frontend
try { $r = Invoke-WebRequest -Uri 'http://localhost:5173' -UseBasicParsing; Write-Host '✅ Frontend OK' } catch { Write-Host '❌ Frontend ERREUR' }
```

---

**Date de dernière mise à jour**: 12 Août 2026
**Version**: 1.0
