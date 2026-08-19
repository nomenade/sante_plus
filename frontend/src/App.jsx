import React, { useState } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'user');
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || '');
  const [showAdmin, setShowAdmin] = useState(false);

  const handleLogin = (newToken, role, email) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('userRole', role || 'user');
    if (email) {
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