# Commandes Git pour déployer Santé+

Ce fichier contient toutes les commandes à exécuter pour pousser votre projet sur GitHub.

## 📋 Prérequis

- Git installé sur votre ordinateur ([git-scm.com](https://git-scm.com/downloads))
- Un compte GitHub créé ([github.com](https://github.com))

---

## 🚀 Commandes à exécuter

Ouvrez un terminal (PowerShell, CMD, ou Git Bash) dans le dossier `d:\apk_sante` et exécutez ces commandes :

### 1. Configurer Git (première fois seulement)

```bash
# Configurer votre nom et email (remplacez par vos informations)
git config --global user.name "Votre Nom"
git config --global user.email "votre.email@exemple.com"
```

### 2. Initialiser le repository Git

```bash
# Initialiser git dans le projet
git init
```

### 3. Ajouter tous les fichiers

```bash
# Ajouter tous les fichiers au staging
git add .
```

### 4. Créer le premier commit

```bash
# Créer un commit avec tous les fichiers
git commit -m "Initial commit - Santé+ app ready for deployment"
```

### 5. Créer un repository sur GitHub

1. Allez sur [github.com](https://github.com)
2. Cliquez sur **"New repository"** (bouton vert en haut à droite)
3. Nom du repository : `sante-plus`
4. Laissez **Public** (gratuit)
5. **NE COCHEZ PAS** "Add a README file"
6. Cliquez sur **"Create repository"**

### 6. Lier le repository local à GitHub

```bash
# Remplacer VOTRE_USERNAME par votre nom d'utilisateur GitHub
git remote add origin https://github.com/VOTRE_USERNAME/sante-plus.git
```

**Exemple :**
```bash
git remote add origin https://github.com/jean-dupont/sante-plus.git
```

### 7. Renommer la branche en 'main'

```bash
git branch -M main
```

### 8. Pousser le code vers GitHub

```bash
# Pousser le code vers GitHub
git push -u origin main
```

---

## ✅ Vérification

Après avoir exécuté toutes les commandes :

1. Rafraîchissez la page de votre repository GitHub
2. Vous devriez voir tous vos fichiers (backend/, frontend/, README.md, etc.)
3. Le code est maintenant sur GitHub et prêt pour Render !

---

## 🔄 Commandes pour les mises à jour futures

Lorsque vous modifiez le code et voulez mettre à jour :

```bash
# 1. Ajouter les modifications
git add .

# 2. Créer un commit
git commit -m "Description de vos modifications"

# 3. Pousser vers GitHub
git push
```

---

## ❓ Problèmes courants

### Erreur : "remote origin already exists"

```bash
# Supprimer l'ancien remote et réessayer
git remote remove origin
git remote add origin https://github.com/VOTRE_USERNAME/sante-plus.git
```

### Erreur : "Authentication failed"

Utilisez un Personal Access Token (PAT) :
1. Allez sur GitHub → Settings → Developer settings → Personal access tokens
2. Générez un nouveau token avec les permissions `repo`
3. Utilisez le token comme mot de passe lors de la poussée

### Erreur : "fatal: unable to access"

Vérifiez votre connexion internet et réessayez.

---

## 📝 Notes importantes

- **VOTRE_USERNAME** : Remplacez par votre nom d'utilisateur GitHub
- Le repository doit être **public** pour utiliser Render gratuitement
- Ne commitez jamais de fichiers sensibles (mots de passe, clés API)
- Le fichier `.gitignore` est déjà configuré pour exclure les fichiers inutiles

---

## 🎯 Après le push vers GitHub

Une fois le code sur GitHub, suivez le guide **DEPLOIEMENT.md** pour déployer sur Render !

**Résumé des prochaines étapes :**
1. ✅ Code sur GitHub
2. → Créer un compte sur Render.com
3. → Déployer le backend (Web Service)
4. → Créer la base de données PostgreSQL
5. → Déployer le frontend (Static Site)
6. → Tester l'application

---

**Bon déploiement ! 🚀**