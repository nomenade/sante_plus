# 🏥 Santé+ - Assistant Santé Intelligent

Application web d'assistance santé qui fournit des conseils personnalisés, des recommandations alimentaires et des informations sur les médicaments pour diverses maladies.

## ✨ Fonctionnalités

- ✅ **Authentification sécurisée** : Inscription et connexion avec JWT
- ✅ **16+ maladies couvertes** : Diabète, hypertension, paludisme, grippe, VIH, et plus encore
- ✅ **Conseils personnalisés** : Symptômes, traitements, médicaments, alimentation
- ✅ **Interface moderne** : Design responsive avec mode sombre
- ✅ **Recherche intelligente** : Suggestions automatiques de maladies
- ✅ **100% gratuit** : Aucune publicité, aucun paiement requis

## 🛠️ Technologies Utilisées

### Backend
- **Python 3** avec **Flask** (framework web)
- **SQLite** (développement) / **PostgreSQL** (production)
- **Flask-JWT-Extended** (authentification)
- **Flask-Bcrypt** (hashage des mots de passe)
- **Flask-CORS** (gestion des requêtes cross-origin)
- **Gunicorn** (serveur WSGI pour la production)

### Frontend
- **React 19** avec **Vite** (build tool)
- **React Router DOM** (navigation)
- **Axios** (requêtes HTTP)
- **CSS moderne** (design responsive)

## 📦 Structure du Projet

```
apk_sante/
├── backend/
│   ├── app.py                 # API Flask principale
│   ├── requirements.txt       # Dépendances Python
│   ├── gunicorn_config.py     # Configuration serveur production
│   └── health.db              # Base de données SQLite (développement)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth.jsx      # Page de connexion/inscription
│   │   │   └── Dashboard.jsx # Interface principale
│   │   ├── App.jsx           # Composant racine
│   │   └── main.jsx          # Point d'entrée
│   ├── package.json          # Dépendances Node.js
│   ├── vite.config.js        # Configuration Vite
│   └── .env.production       # Variables d'environnement production
├── DEPLOIEMENT.md            # Guide de déploiement
└── README.md                 # Ce fichier
```

## 🚀 Installation en Local

### Prérequis
- Python 3.8+
- Node.js 16+
- npm ou yarn

### Backend

```bash
# Aller dans le dossier backend
cd backend

# Créer un environnement virtuel (optionnel mais recommandé)
python -m venv venv

# Activer l'environnement virtuel
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Lancer le serveur
python app.py
```

Le backend sera accessible sur `http://127.0.0.1:5001`

### Frontend

```bash
# Aller dans le dossier frontend
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Le frontend sera accessible sur `http://localhost:5173`

## 🌐 Déploiement en Production

Pour déployer l'application gratuitement sur Render.com, consultez le guide complet :

📄 **[DEPLOIEMENT.md](./DEPLOIEMENT.md)**

### Résumé du déploiement :
1. Pousser le code sur GitHub
2. Créer un Web Service sur Render pour le backend
3. Créer une base de données PostgreSQL sur Render
4. Créer un Static Site sur Render pour le frontend
5. Configurer les variables d'environnement

**Coût :** 100% gratuit (750 heures/mois sur Render)

## 📱 Utilisation

1. **Inscription** : Créez un compte avec email et mot de passe
2. **Connexion** : Connectez-vous avec vos identifiants
3. **Recherche** : Tapez le nom d'une maladie (ex: "diabète", "paludisme")
4. **Consultation** : Consultez les symptômes, conseils, médicaments et alimentation
5. **Mode sombre** : Activez le mode sombre pour plus de confort

## 🔒 Sécurité

- Mots de passe hashés avec Bcrypt
- Authentification JWT (JSON Web Tokens)
- CORS configuré pour autoriser uniquement les domaines autorisés
- Variables d'environnement pour les données sensibles

## 🎨 Captures d'Écran

### Page de Connexion
- Interface moderne avec onglets Connexion/Inscription
- Validation des formulaires en temps réel
- Design responsive (mobile, tablette, desktop)

### Dashboard
- Recherche de maladies avec suggestions rapides
- Affichage détaillé des résultats (symptômes, conseils, médicaments, alimentation)
- Mode sombre/clair
- Conseils de santé généraux

## 🧪 Tests

### Tester l'API Backend

```bash
# Health check
curl https://votre-backend.onrender.com/api/health

# Inscription
curl -X POST https://votre-backend.onrender.com/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'

# Recherche de conseils
curl -X POST https://votre-backend.onrender.com/api/advice \
  -H "Content-Type: application/json" \
  -d '{"disease":"diabète"}'
```

## 📊 Maladies Couvertes

1. Diabète
2. Hypertension
3. Paludisme
4. Grippe
5. Cancer
6. COVID-19
7. Anémie
8. Asthme
9. Migraine
10. Arthrose
11. VIH/SIDA
12. Syphilis
13. Hépatite
14. Tuberculose
15. Choléra
16. Dengue
17. Typhoïde
18. Bilharziose
19. Ulcère
20. Peste
21. Méningite
22. Rougeole
23. Varicelle
24. Oreillons
25. Coqueluche
26. Tétanos
27. Poliomyélite
28. Fièvre jaune
29. Rage
30. Lèpre
31. Bronchite
32. Pneumonie
33. Conjonctivite
34. Salmonellose
35. Cystite
36. Appendicite

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer de nouvelles fonctionnalités
- Ajouter de nouvelles maladies
- Améliorer le design

## 📝 Licence

Ce projet est open source et disponible sous licence MIT.

## 👨‍💻 Auteur

Développé avec ❤️ pour aider les personnes à mieux comprendre et gérer leur santé.

---

## ⚠️ Avertissement Médical

**Important :** Cette application fournit des informations à titre indicatif uniquement. Elle ne remplace pas l'avis d'un professionnel de santé. En cas d'urgence, contactez les services médicaux appropriés (SAMU : 15).

---

## 📞 Support

- 📧 Email : support@sante-plus.com
- 📖 Documentation : [DEPLOIEMENT.md](./DEPLOIEMENT.md)
- 🐛 Issues : [GitHub Issues](https://github.com/VOTRE_USERNAME/sante-plus/issues)

---

**Fait avec ❤️ pour une santé meilleure ! 🏥✨**