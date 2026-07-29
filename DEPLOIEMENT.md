# Guide de Déploiement - Santé+ 🏥

Ce guide vous explique comment mettre en ligne votre application Santé+ gratuitement sur **Render.com**.

## 📋 Prérequis

- Un compte GitHub (pour héberger votre code)
- Un compte Render.com (gratuit)
- Votre projet prêt à être déployé

---

## 🚀 Étape 1 : Préparer votre code sur GitHub

### 1.1 Créer un repository GitHub

1. Allez sur [github.com](https://github.com) et connectez-vous
2. Cliquez sur **"New repository"**
3. Nommez-le : `sante-plus` (ou autre nom de votre choix)
4. Laissez-le **public** (gratuit)
5. Cliquez sur **"Create repository"**

### 1.2 Pousser votre code vers GitHub

Ouvrez un terminal dans le dossier `d:\apk_sante` et exécutez :

```bash
# Initialiser git (si pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Initial commit - Santé+ app ready for deployment"

# Ajouter le repository GitHub (remplacez par votre URL)
git remote add origin https://github.com/VOTRE_USERNAME/sante-plus.git

# Pousser le code
git branch -M main
git push -u origin main
```

**Remplacez `VOTRE_USERNAME` par votre nom d'utilisateur GitHub !**

---

## 🎯 Étape 2 : Déployer le Backend sur Render

### 2.1 Créer un compte Render

1. Allez sur [render.com](https://render.com)
2. Cliquez sur **"Get Started"** ou **"Sign Up"**
3. Connectez-vous avec votre compte GitHub
4. Autorisez Render à accéder à vos repositories

### 2.2 Créer un Web Service pour le Backend

1. Dans le dashboard Render, cliquez sur **"New +"** → **"Web Service"**
2. Sélectionnez votre repository `sante-plus`
3. Configurez le service :

**Nom du service :** `sante-plus-backend` (ou votre nom personnalisé)

**Root Directory :** `backend`

**Runtime :** `Python 3`

**Build Command :**
```bash
pip install -r requirements.txt
```

**Start Command :**
```bash
gunicorn gunicorn_config.py
```

4. **Plan :** Choisissez **"Free"** (gratuit)

5. Cliquez sur **"Advanced"** et ajoutez ces variables d'environnement :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `FLASK_DEBUG` | `False` | Désactive le mode debug |
| `JWT_SECRET_KEY` | `super-secret-health-app-green-2024` | Clé secrète JWT |

**⚠️ IMPORTANT :** Notez l'URL de votre service ! Elle sera affichée après le déploiement.
- Exemple d'URL : `https://sante-plus-backend.onrender.com`
- **Copiez cette URL** (vous en aurez besoin pour le frontend)

6. Cliquez sur **"Create Web Service"**

7. **Attendez 2-3 minutes** que le déploiement se termine**

**✅ Vérification :** Testez l'URL dans votre navigateur :
```
https://votre-nom-backend.onrender.com/api/health
```
Vous devriez voir : `{"status": "ok", "message": "Santé+ API is running"}`

---

## 🗄️ Étape 3 : Créer une Base de Données PostgreSQL

### 3.1 Créer la base de données

1. Dans Render, cliquez sur **"New +"** → **"PostgreSQL"**
2. Configurez :
   - **Name :** `sante-plus-db`
   - **Plan :** **"Free"**
   - **Region :** Choisissez la même région que votre backend
3. Cliquez sur **"Create Database"**

### 3.2 Connecter la base de données au Backend

1. Dans la page de votre base de données, trouvez la section **"Connection"**
2. Copiez l'**"Internal Database URL"** (ex: `postgresql://user:pass@host:5432/dbname`)
3. Retournez dans votre **Web Service** (backend)
4. Allez dans l'onglet **"Environment"**
5. Ajoutez une nouvelle variable :
   - **Key :** `DATABASE_URL`
   - **Value :** Collez l'URL de la base de données
6. Cliquez sur **"Save Changes"**
7. Le backend va redéployer automatiquement (attendez 2-3 minutes)

---

## 🎨 Étape 4 : Déployer le Frontend sur Render

### 4.1 Créer un Static Site

1. Cliquez sur **"New +"** → **"Static Site"**
2. Sélectionnez votre repository `sante-plus`
3. Configurez :

**Nom du service :** `sante-plus-frontend`

**Root Directory :** `frontend`

**Build Command :**
```bash
npm install && npm run build
```

**Publish Directory :** `dist`

4. Cliquez sur **"Advanced"** et ajoutez la variable d'environnement :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `VITE_API_URL` | `https://sante-plus-backend.onrender.com/api` | URL complète de votre API backend |

**⚠️ IMPORTANT :** Remplacez `sante-plus-backend` par le nom de VOTRE service backend !

**Exemples :**
- Si votre backend s'appelle `sante-plus-backend` : `https://sante-plus-backend.onrender.com/api`
- Si votre backend s'appelle `mon-api-sante` : `https://mon-api-sante.onrender.com/api`
- Si votre backend s'appelle `health-app` : `https://health-app.onrender.com/api`

**Format :** `https://NOM-DE-VOTRE-SERVICE.onrender.com/api`

**Ne mettez PAS** `/api/health` à la fin, juste `/api`

5. Cliquez sur **"Create Static Site"**

6. **Attendez 3-5 minutes** que le build se termine

7. **Copiez l'URL du frontend** (ex: `https://sante-plus-frontend.onrender.com)

---

## ✅ Étape 5 : Tester l'Application

1. Ouvrez l'URL de votre frontend dans un navigateur
2. Testez l'inscription d'un nouvel utilisateur
3. Testez la connexion
4. Testez la recherche de maladies (ex: "diabète", "paludisme")
5. Vérifiez que le mode sombre fonctionne
6. Testez sur mobile (responsive design)

---

## 🔧 Dépannage

### Problème : Le backend ne démarre pas

**Solution :**
- Vérifiez les logs dans Render (onglet "Logs")
- Assurez-vous que `DATABASE_URL` est bien configurée
- Vérifiez que le port est 5000 (déjà configuré dans gunicorn_config.py)

### Problème : Erreur CORS

**Solution :**
- Le backend a déjà `CORS(app)` activé dans app.py
- Si erreur persiste, vérifiez que l'URL du frontend est autorisée

### Problème : La base de données ne se crée pas

**Solution :**
- Les tables sont créées automatiquement au premier démarrage
- Vérifiez les logs du backend pour voir si `init_db()` s'exécute

### Problème : Le frontend ne trouve pas l'API

**Solution :**
- Vérifiez que `VITE_API_URL` dans le frontend pointe vers la bonne URL du backend
- Assurez-vous que le backend est démarré (vérifiez les logs)
- Testez l'URL directement : `https://votre-backend.onrender.com/api/health`

---

## 📊 Vérifier que tout fonctionne

### Test de l'API Backend

Ouvrez dans votre navigateur :
```
https://votre-backend.onrender.com/api/health
```

**Exemple concret :**
```
https://sante-plus-backend.onrender.com/api/health
```

Vous devriez voir :
```json
{
  "status": "ok",
  "message": "Santé+ API is running"
}
```

**Si vous voyez cette réponse, votre backend fonctionne ! ✅**

### Test de l'inscription

Utilisez Postman ou curl pour tester :
```bash
curl -X POST https://votre-backend.onrender.com/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

---

## 🎉 Félicitations !

Votre application Santé+ est maintenant en ligne et accessible gratuitement !

**URLs :**
- Frontend : `https://sante-plus-frontend.onrender.com`
- Backend : `https://sante-plus-backend.onrender.com`
- Base de données : PostgreSQL sur Render

---

## 📝 Notes importantes

1. **Gratuité :** Render offre 750 heures/mois gratuitement (suffisant pour un projet étudiant)
2. **Première requête lente :** Le premier accès au backend peut prendre 30-50 secondes (mise en veille)
3. **Base de données :** PostgreSQL remplace SQLite en production (meilleure performance)
4. **Sécurité :** Changez le `JWT_SECRET_KEY` pour quelque chose de plus sécurisé en production
5. **Logs :** Consultez les logs Render pour debugger en cas de problème
6. **URL du backend :** Notez bien l'URL de votre backend (ex: `https://sante-plus-backend.onrender.com`) pour la configurer dans le frontend

---

## 🔄 Mettre à jour l'application

Lorsque vous modifiez le code :

1. Poussez les modifications sur GitHub :
   ```bash
   git add .
   git commit -m "Description des modifications"
   git push
   ```

2. Render détecte automatiquement les changements et redéploie

3. Attendez 2-5 minutes que le déploiement se termine

---

## 📞 Support

- Documentation Render : [render.com/docs](https://render.com/docs)
- Support Render : [render.com/support](https://render.com/support)

---

**Bon déploiement ! 🚀**