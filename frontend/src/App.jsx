import React, { useState } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import './App.css';

// Données d'usage personnelles : compteurs du tableau de bord, carnet,
// historique des consultations, hydratation. Purgeées quand le compte
// change, afin que tout NOUVEL utilisateur démarre réellement à zéro.
const USAGE_KEYS = [
  'santeMedications',
  'santeConsultations',
  'santeConsultCount',
  'santeAiCount',
  'santeFirstSeen',
  'santeHydration'
];

const purgeUsageData = () => {
  USAGE_KEYS.forEach((k) => localStorage.removeItem(k));
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'user');
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || '');
  const [showAdmin, setShowAdmin] = useState(false);

  const handleLogin = (newToken, role, email) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('userRole', role || 'user');
    if (email) {
      // Un compte DIFFÉRENT se connecte sur cet appareil :
      // ses statistiques (consultations, analyses IA, rappels...) repartent de zéro
      if (localStorage.getItem('santeLastUser') !== email) {
        purgeUsageData();
        localStorage.setItem('santeLastUser', email);
      }
      localStorage.setItem('userEmail', email);
      localStorage.removeItem('santeUserProfile'); // profil recalculé pour ce compte
    }
    setToken(newToken);
    setUserRole(role || 'user');
    setUserEmail(email || '');
    setShowAdmin(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('santeUserProfile');
    purgeUsageData(); // le prochain utilisateur démarre avec des statistiques à zéro
    setToken(null);
    setUserRole('user');
    setUserEmail('');
    setShowAdmin(false);
  };

  const handleOpenAdmin = () => {
    setShowAdmin(true);
  };

  const handleCloseAdmin = () => {
    setShowAdmin(false);
  };

  return (
    <div className="app">
      {!token ? (
        <Auth onLogin={handleLogin} />
      ) : showAdmin ? (
        <AdminPanel token={token} onBack={handleCloseAdmin} />
      ) : (
        <Dashboard 
          token={token} 
          onLogout={handleLogout} 
          userRole={userRole}
          userEmail={userEmail}
          onOpenAdmin={handleOpenAdmin}
        />
      )}
    </div>
  );
}

export default App;