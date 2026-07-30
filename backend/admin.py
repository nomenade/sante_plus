"""
Routes d'administration pour Santé+ Backoffice
Protégé par JWT - Accès réservé aux administrateurs
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import get_db_connection, logger, bcrypt, DATABASE_URL

admin_bp = Blueprint('admin', __name__)

def require_admin(f):
    """Décorateur pour vérifier que l'utilisateur est admin"""
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        conn = get_db_connection()
        c = conn.cursor()
        if DATABASE_URL:
            c.execute("SELECT role FROM users WHERE id = %s", (user_id,))
        else:
            c.execute("SELECT role FROM users WHERE id = ?", (user_id,))
        user = c.fetchone()
        conn.close()
        
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
    expected_key = 'admin-setup-key-2024'  # À remplacer par une vraie clé en prod
    
    if master_key != expected_key:
        return jsonify({"error": "Clé maître invalide"}), 403
    
    # Vérifier s'il y a déjà un admin
    conn = get_db_connection()
    c = conn.cursor()
    if DATABASE_URL:
        c.execute("SELECT COUNT(*) FROM users WHERE role = %s", ('admin',))
    else:
        c.execute("SELECT COUNT(*) FROM users WHERE role = ?", ('admin',))
    count = c.fetchone()[0]
    
    if count > 0:
        conn.close()
        return jsonify({"error": "Un administrateur existe déjà"}), 400
    
    # Créer l'admin
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    if DATABASE_URL:
        c.execute("INSERT INTO users (email, password, role) VALUES (%s, %s, %s)",
                  (email, hashed_password, 'admin'))
    else:
        c.execute("INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
                  (email, hashed_password, 'admin'))
    conn.commit()
    conn.close()
    
    logger.warning(f"PREMIER ADMIN CRÉÉ: {email}")
    return jsonify({"message": "Compte administrateur créé avec succès"}), 201

# Lister tous les utilisateurs
@admin_bp.route('/api/admin/users', methods=['GET'])
@require_admin
def list_users():
    """Liste tous les utilisateurs (réservé aux admins)"""
    conn = get_db_connection()
    c = conn.cursor()
    if DATABASE_URL:
        c.execute("SELECT id, email, role FROM users ORDER BY id DESC")
    else:
        c.execute("SELECT id, email, role FROM users ORDER BY id DESC")
    users = c.fetchall()
    conn.close()
    
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
    conn = get_db_connection()
    c = conn.cursor()
    
    # Vérifier que l'utilisateur existe
    if DATABASE_URL:
        c.execute("SELECT id, role FROM users WHERE id = %s", (user_id,))
    else:
        c.execute("SELECT id, role FROM users WHERE id = ?", (user_id,))
    user = c.fetchone()
    
    if not user:
        conn.close()
        return jsonify({"error": "Utilisateur non trouvé"}), 404
    
    # Ne pas permettre la suppression d'un admin
    if user[1] == 'admin':
        conn.close()
        return jsonify({"error": "Impossible de supprimer un administrateur"}), 400
    
    # Supprimer l'utilisateur
    if DATABASE_URL:
        c.execute("DELETE FROM users WHERE id = %s", (user_id,))
    else:
        c.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    
    logger.warning(f"Utilisateur {user_id} supprimé par admin")
    return jsonify({"message": "Utilisateur supprimé avec succès"}), 200

# Promouvoir un utilisateur en admin
@admin_bp.route('/api/admin/users/<int:user_id>/promote', methods=['PUT'])
@require_admin
def promote_user(user_id):
    """Promouvoir un utilisateur en administrateur"""
    conn = get_db_connection()
    c = conn.cursor()
    
    if DATABASE_URL:
        c.execute("UPDATE users SET role = 'admin' WHERE id = %s", (user_id,))
    else:
        c.execute("UPDATE users SET role = 'admin' WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    
    logger.warning(f"Utilisateur {user_id} promu admin")
    return jsonify({"message": "Utilisateur promu administrateur"}), 200

# Statistiques
@admin_bp.route('/api/admin/stats', methods=['GET'])
@require_admin
def get_stats():
    """Statistiques de l'application"""
    conn = get_db_connection()
    c = conn.cursor()
    
    if DATABASE_URL:
        c.execute("SELECT COUNT(*) FROM users")
        total_users = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM users WHERE role = 'admin'")
        total_admins = c.fetchone()[0]
    else:
        c.execute("SELECT COUNT(*) FROM users")
        total_users = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM users WHERE role = 'admin'")
        total_admins = c.fetchone()[0]
    
    conn.close()
    
    return jsonify({
        "total_users": total_users,
        "total_admins": total_admins,
        "total_regular_users": total_users - total_admins
    }), 200