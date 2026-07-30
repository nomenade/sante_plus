# 🚀 Guide de Déploiement Sécurisé - Santé+

## 📋 ÉTAPE 1 : Pousser le code sur GitHub

```bash
# Depuis le dossier d:\apk_sante
git init
git add .
git commit -m "Version sécurisée avec backoffice"
git remote add origin https://github.com/VOTRE_USERNAME/sante-plus.git
git branch -M main
git push -u origin main
```

---

## 🎯 ÉTAPE 2 : Déployer le Backend sur Render

### 2.1 Créer un compte Render
1. Allez sur [render.com](https://render.com)
2. Connectez-vous avec GitHub
3. Cliquez sur **"New +"** → **"Web Service"**

### 2.2 Configuration du Web Service
| Champ | Valeur |
|-------|--------|
| **Name** | `sante-plus-backend` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn gunicorn_config.py` |
| **Plan** | **Free** |

### 2.3 Variables d'environnement (obligatoires)
Cliquez sur **"Advanced"** et ajoutez :

| Variable | Valeur | OBLIGATOIRE |
|----------|--------|-------------|
| `JWT_SECRET_KEY` | (générer une clé forte) | **OUI** 🔴 |
| `FRONTEND_URL` | `https://votre-frontend.onrender.com` | **OUI** 🔴 |
| `FLASK_DEBUG` | `False` | **OUI** 🔴 |
| `DATABASE_URL` | (après création PostgreSQL) | **OUI** 🔴 |

**🔑 Générer une clé JWT forte :**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```
Copiez le résultat et utilisez-le comme valeur de `JWT_SECRET_KEY`.

---

## 🗄️ ÉTAPE 3 : Créer la Base de Données PostgreSQL

1. **New +** → **"PostgreSQL"**
2. **Name :** `sante-plus-db`
3. **Plan :** **Free**
4. **Region :** Même région que le backend

5. **Copiez l'URL** de connexion (section "Connections" → "Internal Database URL")
6. Allez dans votre **Web Service** → **Environment** → Ajoutez :
   - **Key :** `DATABASE_URL`
   - **Value :** Collez l'URL copiée
7. **Save Changes** (le backend redémarre)

---

## 🎨 ÉTAPE 4 : Déployer le Frontend

1. **New +** → **"Static Site"**
2. Sélectionnez votre repo GitHub
3. Configuration :

| Champ | Valeur |
|-------|--------|
| **Name** | `sante-plus-frontend` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |
| **Plan** | **Free** |

4. **Variable d'environnement :**
   - **Key :** `VITE_API_URL`
   - **Value :** `https://sante-plus-backend.onrender.com/api`
   *(Remplacez `sante-plus-backend` par le nom de votre service backend)*

---

## 🔐 ÉTAPE 5 : Créer le Compte Administrateur

Une fois le backend déployé, créez le premier admin :

```bash
curl -X POST https://sante-plus-backend.onrender.com/api/admin/setup \
  -H "Content-Type: application/json" \
  -d '{
    "master_key": "admin-setup-key-2024",
    "email": "votre-email@admin.com",
    "password": "VotreMotDePasse123!"
  }'
```

**⚠️ Important :** Changez la `master_key` dans `backend/admin.py` après la première utilisation !

---

## ✅ ÉTAPE 6 : Tester l'Application

### 6.1 Vérifier le backend
```bash
curl https://sante-plus-backend.onrender.com/api/health
```
Réponse attendue : `{"status": "ok", "message": "Santé+ API is running"}`

### 6.2 Tester l'inscription
```bash
curl -X POST https://sante-plus-backend.onrender.com/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234!"}'
```

### 6.3 Tester la connexion
```bash
curl -X POST https://sante-plus-backend.onrender.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234!"}'
```

### 6.4 Accéder au backoffice
1. Connectez-vous avec le compte admin
2. Cliquez sur **"Backoffice"** dans le header
3. Vous pouvez voir les utilisateurs, les promouvoir ou les supprimer

---

## 🔒 RÉSUMÉ DES AMÉLIORATIONS DE SÉCURITÉ

| Problème | Solution | Statut |
|----------|----------|--------|
| Clé JWT en dur | Maintenant lue depuis `JWT_SECRET_KEY` (env var) | ✅ |
| CORS ouvert à tous | Restreint à `FRONTEND_URL` | ✅ |
| Rate limiting | Flask-Limiter (5 req/min register, 10 req/min login) | ✅ |
| Validation email | Regex validation côté backend | ✅ |
| Journalisation | Logging des tentatives échouées | ✅ |
| Headers de sécurité | XSS, Clickjacking, HSTS, Cache-Control | ✅ |
| Expiration token | 1 heure au lieu de 24h | ✅ |
| Backoffice admin | Gestion des utilisateurs via `/api/admin/*` | ✅ |
| Rôle utilisateur | Champ `role` (admin/user) en base de données | ✅ |

---

## ⚙️ COMMANDES DE MAINTENANCE

```bash
# Mettre à jour l'application
git add .
git commit -m "Description des changements"
git push

# Voir les logs du backend
# Dashboard Render → Web Service → Logs

# Redémarrer le backend
# Dashboard Render → Web Service → Manual Deploy → Deploy
```

---

## 🆘 DÉPANNAGE

**Le backend ne démarre pas :**
- Vérifiez les logs dans Render
- Assurez-vous que `DATABASE_URL` est correcte
- Vérifiez que `JWT_SECRET_KEY` est définie

**Erreur CORS :**
- Vérifiez que `FRONTEND_URL` pointe vers l'URL exacte de votre frontend
- Vérifiez que `VITE_API_URL` pointe vers l'URL exacte de votre backend

**Le backoffice est inaccessible :**
- Assurez-vous d'être connecté avec un compte admin
- Créez d'abord l'admin via la route `/api/admin/setup`

**Erreur 429 (Too Many Requests) :**
- Vous avez dépassé la limite de taux (rate limit)
- Attendez 1 minute avant de réessayer

---

## 📝 NOTES IMPORTANTES

1. **Première connexion lente :** Render met en veille les services gratuits. Le premier accès peut prendre 30-50 secondes.
2. **750 heures/mois gratuites :** Suffisant pour un projet personnel/étudiant.
3. **Changez la clé maître :** Modifiez `expected_key` dans `backend/admin.py` après la première création d'admin.
4. **Sauvegardez votre clé JWT :** Notez-la dans un endroit sûr.
5. **Les logs sont vos amis :** Consultez les logs Render pour debugger.

---

**Félicitations ! 🎉 Votre application Santé+ est maintenant déployée et sécurisée !**