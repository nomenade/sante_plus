import React, { useState } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'user');
  const [showAdmin, setShowAdmin] = useState(false);

  const handleLogin = (newToken, role) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('userRole', role || 'user');
    setToken(newToken);
    setUserRole(role || 'user');
    setShowAdmin(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setToken(null);
    setUserRole('user');
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
          onOpenAdmin={handleOpenAdmin}
        />
      )}
    </div>
  );
}

export default App;