#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de démarrage rapide du backend Santé+
Lance le serveur Flask sans avoir à entrer dans le dossier backend
"""
import sys
import os

# Ajouter le dossier backend au path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Changer le répertoire de travail
os.chdir(os.path.join(os.path.dirname(__file__), 'backend'))

# Importer et démarrer l'application
from app import app

if __name__ == '__main__':
    print("=" * 50)
    print("  Santé+ API Server - Démarrage")
    print("=" * 50)
    print(f"  URL: http://127.0.0.1:5001")
    print(f"  Health: http://127.0.0.1:5001/health")
    print("=" * 50)
    print()
    
    app.run(host='0.0.0.0', port=5001, debug=False)
