#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de vérification avant déploiement
Vérifie que tous les fichiers nécessaires sont présents et correctement configurés
"""

import os
import sys
import io

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def check_file_exists(filepath, description):
    """Vérifie qu'un fichier existe"""
    if os.path.exists(filepath):
        print(f"✅ {description}: {filepath}")
        return True
    else:
        print(f"❌ {description}: {filepath} - MANQUANT")
        return False

def check_file_contains(filepath, search_string, description):
    """Vérifie qu'un fichier contient une chaîne de caractères"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            if search_string in content:
                print(f"✅ {description}")
                return True
            else:
                print(f"❌ {description} - NON TROUVÉ dans {filepath}")
                return False
    except Exception as e:
        print(f"❌ Erreur lors de la lecture de {filepath}: {e}")
        return False

def main():
    print("=" * 60)
    print("  Vérification du déploiement Santé+")
    print("=" * 60)
    print()
    
    all_ok = True
    
    # Vérifier les fichiers de configuration backend
    print("[BACKEND] Fichiers de configuration:")
    all_ok &= check_file_exists("backend/requirements.txt", "requirements.txt")
    all_ok &= check_file_exists("backend/gunicorn_config.py", "gunicorn_config.py")
    all_ok &= check_file_contains("backend/requirements.txt", "gunicorn", "Gunicorn dans requirements.txt")
    all_ok &= check_file_contains("backend/requirements.txt", "psycopg2-binary", "PostgreSQL driver dans requirements.txt")
    all_ok &= check_file_contains("backend/app.py", "DATABASE_URL", "Support DATABASE_URL dans app.py")
    all_ok &= check_file_contains("backend/app.py", "get_db_connection", "Fonction get_db_connection()")
    all_ok &= check_file_contains("backend/app.py", "psycopg2", "Import psycopg2")
    print()
    
    # Vérifier les fichiers de configuration frontend
    print("[FRONTEND] Fichiers de configuration:")
    all_ok &= check_file_exists("frontend/.env.production", ".env.production")
    all_ok &= check_file_contains("frontend/.env.production", "VITE_API_URL", "VITE_API_URL dans .env.production")
    all_ok &= check_file_contains("frontend/src/components/Auth.jsx", "import.meta.env.VITE_API_URL", "API_URL dynamique dans Auth.jsx")
    all_ok &= check_file_contains("frontend/src/components/Dashboard.jsx", "import.meta.env.VITE_API_URL", "API_URL dynamique dans Dashboard.jsx")
    print()
    
    # Vérifier les fichiers de documentation
    print("[DOCUMENTATION] Fichiers:")
    all_ok &= check_file_exists("DEPLOIEMENT.md", "Guide de déploiement")
    all_ok &= check_file_exists("README.md", "README principal")
    all_ok &= check_file_exists(".gitignore", ".gitignore")
    print()
    
    # Vérifier la structure du projet
    print("[PROJET] Structure:")
    all_ok &= check_file_exists("backend/app.py", "Backend app.py")
    all_ok &= check_file_exists("frontend/package.json", "Frontend package.json")
    all_ok &= check_file_exists("frontend/src/App.jsx", "Frontend App.jsx")
    print()
    
    # Résumé
    print("=" * 60)
    if all_ok:
        print("[SUCCES] TOUT EST PRET POUR LE DEPLOIEMENT !")
        print()
        print("Prochaines etapes :")
        print("1. Pousser le code sur GitHub")
        print("2. Aller sur render.com et creer un compte")
        print("3. Suivre le guide DEPLOIEMENT.md")
        print()
        print("Consultez DEPLOIEMENT.md pour les instructions detaillees")
        return 0
    else:
        print("[ERREUR] DES FICHIERS SONT MANQUANTS OU MAL CONFIGURES")
        print()
        print("Veuillez corriger les erreurs ci-dessus avant de deployer.")
        return 1

if __name__ == "__main__":
    sys.exit(main())