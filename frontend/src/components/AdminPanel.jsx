import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPanel.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/api';

function AdminPanel({ token, onBack }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const headers = {
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/users`, { headers });
      setUsers(res.data.users);
      setLoading(false);
    } catch (err) {
      setError('❌ Erreur chargement utilisateurs - ' + (err.response?.data?.error || 'Accès refusé'));
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/stats`, { headers });
      setStats(res.data);
    } catch (err) {
      console.error('Erreur stats:', err);
    }
  };

  const deleteUser = async (userId, email) => {
    if (!window.confirm(`⚠️ Supprimer l'utilisateur "${email}" ? Cette action est irréversible.`)) return;
    
    try {
      await axios.delete(`${API_URL}/admin/users/${userId}`, { headers });
      setSuccessMessage(`✅ Utilisateur "${email}" supprimé`);
      fetchUsers();
      fetchStats();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('❌ ' + (err.response?.data?.error || 'Erreur suppression'));
      setTimeout(() => setError(''), 3000);
    }
  };

  const promoteUser = async (userId, email) => {
    if (!window.confirm(`⚠️ Promouvoir "${email}" en administrateur ?`)) return;
    
    try {
      await axios.put(`${API_URL}/admin/users/${userId}/promote`, {}, { headers });
      setSuccessMessage(`✅ "${email}" est maintenant administrateur`);
      fetchUsers();
      fetchStats();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('❌ ' + (err.response?.data?.error || 'Erreur promotion'));
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="admin-loading">Chargement du backoffice...</div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <div className="admin-header-left">
          <button className="admin-back-btn" onClick={onBack}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Retour
          </button>
          <div className="admin-header-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <h1>Backoffice Santé+</h1>
          </div>
        </div>
      </header>

      {error && <div className="admin-error">{error}</div>}
      {successMessage && <div className="admin-success">{successMessage}</div>}

      {/* Statistiques */}
      {stats && (
        <section className="admin-stats">
          <div className="stat-card">
            <span className="stat-number">{stats.total_users}</span>
            <span className="stat-label">Utilisateurs total</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.total_admins}</span>
            <span className="stat-label">Administrateurs</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.total_regular_users}</span>
            <span className="stat-label">Utilisateurs standard</span>
          </div>
        </section>
      )}

      {/* Liste des utilisateurs */}
      <section className="admin-users-section">
        <h2>Gestion des utilisateurs</h2>
        <div className="admin-users-table-wrapper">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="no-users">Aucun utilisateur trouvé</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className={user.role === 'admin' ? 'admin-row' : ''}>
                    <td>{user.id}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role === 'admin' ? 'role-admin' : 'role-user'}`}>
                        {user.role === 'admin' ? '👑 Admin' : '👤 Utilisateur'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      {user.role !== 'admin' && (
                        <>
                          <button
                            className="admin-btn promote-btn"
                            onClick={() => promoteUser(user.id, user.email)}
                            title="Promouvoir en administrateur"
                          >
                            👑 Promouvoir
                          </button>
                          <button
                            className="admin-btn delete-btn"
                            onClick={() => deleteUser(user.id, user.email)}
                            title="Supprimer cet utilisateur"
                          >
                            🗑️ Supprimer
                          </button>
                        </>
                      )}
                      {user.role === 'admin' && (
                        <span className="no-action">Protégé</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bouton « Haut de page » : toujours visible dans le backoffice aussi */}
      <button
        type="button"
        className="scroll-top-btn"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        title="Haut de page"
        aria-label="Retour en haut de page"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      </button>
    </div>
  );
}

export default AdminPanel;