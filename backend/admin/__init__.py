"""
Routes d'administration pour Santé+ Backoffice
Protégé par JWT - Accès réservé aux administrateurs

Utilise un pattern factory : les dépendances (connexion DB, logger, bcrypt,
URL de base de données) sont injectées depuis app.py. Cela évite tout import
circulaire entre les modules 'app' (exécuté sous le nom __main__ quand on
lance `python app.py`) et 'admin'.
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity


def create_admin_bp(get_db_connection, logger, bcrypt, database_url):
    """Construit et retourne le blueprint d'administration."""

    admin_bp = Blueprint('admin', __name__)

    # Placeholder SQL selon le type de base de données (%s pour Postgres, ? pour SQLite)
    ph = lambda: '%s' if database_url else '?'

    def require_admin(f):
        """Décorateur pour vérifier que l'utilisateur est admin"""
        @jwt_required()
        def wrapper(*args, **kwargs):
            user_id = get_jwt_identity()
            conn = None
            try:
                conn = get_db_connection()
                c = conn.cursor()
                c.execute(f"SELECT role FROM users WHERE id = {ph()}", (user_id,))
                user = c.fetchone()
            finally:
                if conn is not None:
                    try:
                        conn.close()
                    except Exception:
                        pass

            if not user or user[0] != 'admin':
                return jsonify({"error": "Accès refusé. Droits d'administrateur requis."}), 403
            return f(*args, **kwargs)
        wrapper.__name__ = f.__name__
        return wrapper

    # Créer le premier admin (à exécuter une fois)
    @admin_bp.route('/api/admin/setup', methods=['POST'])
    def setup_first_admin():
        """Crée le premier compte administrateur (à sécuriser en production)"""
        data = request.get_json()
        master_key = data.get('master_key', '')
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        # Vérifier une clé maître en variable d'environnement
        import os
        expected_key = os.environ.get('ADMIN_SETUP_KEY', 'admin-setup-key-2024')

        if master_key != expected_key:
            return jsonify({"error": "Clé maître invalide"}), 403

        # Vérifier s'il y a déjà un admin
        conn = None
        try:
            conn = get_db_connection()
            c = conn.cursor()
            c.execute(f"SELECT COUNT(*) FROM users WHERE role = {ph()}", ('admin',))
            count = c.fetchone()[0]
        finally:
            if conn is not None:
                try:
                    conn.close()
                except Exception:
                    pass

        if count > 0:
            return jsonify({"error": "Un administrateur existe déjà"}), 400

        # Créer l'admin
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        try:
            conn = get_db_connection()
            c = conn.cursor()
            c.execute(f"INSERT INTO users (email, password, role) VALUES ({ph()}, {ph()}, {ph()})",
                      (email, hashed_password, 'admin'))
            conn.commit()
        finally:
            if conn is not None:
                try:
                    conn.close()
                except Exception:
                    pass

        logger.warning(f"PREMIER ADMIN CRÉÉ: {email}")
        return jsonify({"message": "Compte administrateur créé avec succès"}), 201

    # Lister tous les utilisateurs
    @admin_bp.route('/api/admin/users', methods=['GET'])
    @require_admin
    def list_users():
        """Liste tous les utilisateurs (réservé aux admins)"""
        conn = None
        try:
            conn = get_db_connection()
            c = conn.cursor()
            c.execute("SELECT id, email, role FROM users ORDER BY id DESC")
            users = c.fetchall()
        finally:
            if conn is not None:
                try:
                    conn.close()
                except Exception:
                    pass

        user_list = []
        for user in users:
            user_list.append({
                "id": user[0],
                "email": user[1],
                "role": user[2]
            })

        return jsonify({"users": user_list}), 200

    # Supprimer un utilisateur
    @admin_bp.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
    @require_admin
    def delete_user(user_id):
        """Supprime un utilisateur (réservé aux admins)"""
        conn = None
        try:
            conn = get_db_connection()
            c = conn.cursor()

            # Vérifier que l'utilisateur existe
            c.execute(f"SELECT id, role FROM users WHERE id = {ph()}", (user_id,))
            user = c.fetchone()

            if not user:
                return jsonify({"error": "Utilisateur non trouvé"}), 404

            # Ne pas permettre la suppression d'un admin
            if user[1] == 'admin':
                return jsonify({"error": "Impossible de supprimer un administrateur"}), 400

            # Supprimer l'utilisateur
            c.execute(f"DELETE FROM users WHERE id = {ph()}", (user_id,))
            conn.commit()
        finally:
            if conn is not None:
                try:
                    conn.close()
                except Exception:
                    pass

        logger.warning(f"Utilisateur {user_id} supprimé par admin")
        return jsonify({"message": "Utilisateur supprimé avec succès"}), 200

    # Promouvoir un utilisateur en admin
    @admin_bp.route('/api/admin/users/<int:user_id>/promote', methods=['PUT'])
    @require_admin
    def promote_user(user_id):
        """Promouvoir un utilisateur en administrateur"""
        conn = None
        try:
            conn = get_db_connection()
            c = conn.cursor()
            c.execute(f"UPDATE users SET role = 'admin' WHERE id = {ph()}", (user_id,))
            conn.commit()
        finally:
            if conn is not None:
                try:
                    conn.close()
                except Exception:
                    pass

        logger.warning(f"Utilisateur {user_id} promu admin")
        return jsonify({"message": "Utilisateur promu administrateur"}), 200

    # Statistiques
    @admin_bp.route('/api/admin/stats', methods=['GET'])
    @require_admin
    def get_stats():
        """Statistiques de l'application"""
        conn = None
        try:
            conn = get_db_connection()
            c = conn.cursor()

            c.execute("SELECT COUNT(*) FROM users")
            total_users = c.fetchone()[0]
            c.execute("SELECT COUNT(*) FROM users WHERE role = 'admin'")
            total_admins = c.fetchone()[0]
        finally:
            if conn is not None:
                try:
                    conn.close()
                except Exception:
                    pass

        return jsonify({
            "total_users": total_users,
            "total_admins": total_admins,
            "total_regular_users": total_users - total_admins
        }), 200

    return admin_bp
