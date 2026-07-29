# ⚡ GUIDE RAPIDE - Déploiement Santé+

## 🎯 En 3 étapes simples

```
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 1 : GitHub (5 min)                                   │
│  → Pousser le code sur GitHub                               │
│  → Commandes dans commandes_git.md                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 2 : Render Backend (5 min)                           │
│  → Créer Web Service sur Render                             │
│  → Configurer avec DATABASE_URL                             │
│  → Noter l'URL : https://NOM-BACKEND.onrender.com           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 3 : Render Frontend (5 min)                          │
│  → Créer Static Site sur Render                             │
│  → Configurer VITE_API_URL avec l'URL du backend            │
│  → Tester l'application !                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Checklist de déploiement

### Avant de commencer
- [ ] Compte GitHub créé
- [ ] Compte Render.com créé (gratuit)
- [ ] Git installé sur votre ordinateur

### Étape 1 : GitHub
- [ ] Repository `sante-plus` créé sur GitHub (public)
- [ ] Code poussé vers GitHub
- [ ] Tous les fichiers visibles sur GitHub

### Étape 2 : Backend Render
- [ ] Web Service créé (Root: `backend`)
- [ ] Variables configurées : `FLASK_DEBUG=False`, `JWT_SECRET_KEY=...`
- [ ] Base de données PostgreSQL créée
- [ ] `DATABASE_URL` ajoutée dans les variables du backend
- [ ] Backend déployé avec succès
- [ ] **URL du backend notée** (ex: `https://sante-plus-backend.onrender.com`)
- [ ] Test API réussi : `https://votre-backend.onrender.com/api/health`

### Étape 3 : Frontend Render
- [ ] Static Site créé (Root: `frontend`)
- [ ] Variable `VITE_API_URL` configurée avec l'URL du backend
- [ ] Frontend déployé avec succès
- [ ] **URL du frontend notée** (ex: `https://sante-plus-frontend.onrender.com`)

### Tests finaux
- [ ] Inscription fonctionne
- [ ] Connexion fonctionne
- [ ] Recherche de maladies fonctionne
- [ ] Mode sombre fonctionne
- [ ] Interface responsive (mobile/tablette/desktop)

---

## 🔑 Variables d'environnement à configurer

### Backend (Web Service)
```
FLASK_DEBUG = False
JWT_SECRET_KEY = super-secret-health-app-green-2024
DATABASE_URL = postgresql://user:pass@host:5432/dbname (fournie par Render)
```

### Frontend (Static Site)
```
VITE_API_URL = https://NOM-DE-VOTRE-BACKEND.onrender.com/api
```

**⚠️ Remplacez `NOM-DE-VOTRE-BACKEND` par le nom réel de votre service !**

---

## 📝 Exemples concrets

### Exemple 1 : Jean Dupont
- GitHub username : `jean-dupont`
- Backend name : `sante-plus-api`
- Frontend name : `sante-plus-web`

**URLs :**
- Backend : `https://sante-plus-api.onrender.com`
- Frontend : `https://sante-plus-web.onrender.com`
- VITE_API_URL : `https://sante-plus-api.onrender.com/api`

### Exemple 2 : Marie Martin
- GitHub username : `marie-martin`
- Backend name : `health-app-backend`
- Frontend name : `health-app-frontend`

**URLs :**
- Backend : `https://health-app-backend.onrender.com`
- Frontend : `https://health-app-frontend.onrender.com`
- VITE_API_URL : `https://health-app-backend.onrender.com/api`

---

## 🚀 Commandes Git rapides

```bash
# Configuration (première fois)
git config --global user.name "Votre Nom"
git config --global user.email "votre.email@exemple.com"

# Initialisation
git init
git add .
git commit -m "Initial commit - Santé+ app ready for deployment"

# Lien vers GitHub (remplacez VOTRE_USERNAME)
git remote add origin https://github.com/VOTRE_USERNAME/sante-plus.git
git branch -M main
git push -u origin main

# Mises à jour futures
git add .
git commit -m "Description des modifications"
git push
```

---

## 🆘 Dépannage express

| Problème | Solution |
|----------|----------|
| Backend ne démarre pas | Vérifiez les logs Render, DATABASE_URL configurée |
| Erreur CORS | CORS déjà activé dans app.py |
| Frontend ne trouve pas l'API | Vérifiez VITE_API_URL dans Render |
| Base de données ne se crée pas | Tables créées automatiquement au démarrage |
| Première requête lente | Normal (30-50s), mise en veille après 15min |

---

## 📚 Documentation complète

- **RESUME_DEPLOIEMENT.md** - Vue d'ensemble du déploiement
- **DEPLOIEMENT.md** - Guide détaillé pas à pas
- **commandes_git.md** - Commandes Git complètes
- **README.md** - Documentation du projet
- **verifier_deploiement.py** - Script de vérification

---

## ✅ Vérification finale

Après le déploiement, testez ces URLs :

```
1. Health check backend :
   https://VOTRE-BACKEND.onrender.com/api/health
   
2. Frontend :
   https://VOTRE-FRONTEND.onrender.com
   
3. Inscription :
   Créer un compte sur le frontend
   
4. Recherche :
   Tester "diabète", "paludisme", "grippe"
```

---

## 🎉 Félicitations !

Votre application Santé+ est maintenant en ligne et accessible gratuitement dans le monde entier !

**Temps total :** 15-20 minutes  
**Coût :** 100% gratuit  
**Hébergement :** Render.com (750 heures/mois)

---

**Besoin d'aide ?** Consultez DEPLOIEMENT.md section "Dépannage"

**Bon déploiement ! 🚀**