#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import os

# Rediriger stderr vers un fichier
sys.stderr = open('d:/apk_sante/server_stderr.log', 'w', encoding='utf-8')
sys.stdout = open('d:/apk_sante/server_stdout.log', 'w', encoding='utf-8')

print("Démarrage du serveur...", flush=True)

try:
    os.chdir('d:/apk_sante/backend')
    sys.path.insert(0, 'd:/apk_sante/backend')
    
    from app import app
    print("Module app importé avec succès", flush=True)
    
    port = int(os.environ.get('PORT', 5001))
    host = os.environ.get('HOST', '0.0.0.0')
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"Démarrage sur {host}:{port}", flush=True)
    app.run(host=host, port=port, debug=debug)
    
except Exception as e:
    print(f"ERREUR: {e}", flush=True)
    import traceback
    traceback.print_exc()
    sys.exit(1)
