#!/usr/bin/env python3
"""
Script de réinitialisation complète de la base de données.

- Supprime le fichier SQLite `backend/health.db` (toute donnée est perdue).
- Le backend le régénère automatiquement au prochain démarrage (init_db).

Usage :
    python backend/reset_db.py        # supprime health.db
    python backend/reset_db.py --prod # supprime la base PostgreSQL (DATABASE_URL)

⚠️  ATTENTION : aucune confirmation n'est demandée. Utilisez avec précaution.
"""
import os
import sys

# Chemin relatif au répertoire du script (marche en local ET sur Render)
HERE = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(HERE, "health.db")

DATABASE_URL = os.environ.get("DATABASE_URL")

if __name__ == "__main__":
    if "--prod" in sys.argv and DATABASE_URL:
        # PostgreSQL en production : on ne peut pas supprimer un fichier ici.
        # On vide les tables au lieu de ça (conservateur).
        print("[!] Base PostgreSQL détectée. Utilisez un outil comme")
        print("    `psql $DATABASE_URL -c 'TRUNCATE users;'` pour vider.")
        print("[!] Sauvegarde du fichier health.db supprimée (n'existe pas en PG).")
    else:
        if os.path.exists(DB_PATH):
            os.remove(DB_PATH)
            print("[OK] Base SQLite supprimée :", DB_PATH)
        else:
            print("[OK] Aucun fichier health.db présent — rien à supprimer.")
        print("[i] Le backend recréera une base vide au prochain démarrage.")
