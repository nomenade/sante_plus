import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Auth.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/api';

function Auth({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Intercepte la réussite de création de compte
  useEffect(() => {
    const handleSuccess = (e) => {
      setSuccessMessage(e.detail?.message || 'Compte cree avec succes ! Connectez-vous.');
    };
    window.addEventListener('auth-register-success', handleSuccess);
    return () => window.removeEventListener('auth-register-success', handleSuccess);
  }, []);

  const validatePassword = (pwd) => {
    const errors = [];
    if (!pwd || pwd.length < 8) errors.push('au moins 8 caracteres');
    if (!/[A-Z]/.test(pwd)) errors.push('une majuscule');
    if (!/[0-9]/.test(pwd)) errors.push('un chiffre');
    if (!/[!@#$%^&*()_+=\[\]{}|;:,.<>?]/.test(pwd)) errors.push('un caractere special');
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    if (!isLogin) {
      const pwdErrors = validatePassword(password);
      if (pwdErrors.length > 0) {
        setError('Erreur: ' + pwdErrors.join(', '));
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        const res = await axios.post(`${API_URL}/login`, { email, password });
        setSuccessMessage('Connexion reussie !');
        setTimeout(() => onLogin(res.data.token, res.data.role, email), 800);
      } else {
        await axios.post(`${API_URL}/register`, { email, password });
        setSuccessMessage('Compte cree avec succes !');
        setEmail('');
        setPassword('');
        setShowPassword(false);
        setTimeout(() => {
          setIsLogin(true);
          setSuccessMessage('');
          window.dispatchEvent(new CustomEvent('auth-register-success', {
            detail: { message: 'Compte cree ! Connectez-vous.' }
          }));
        }, 1500);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Erreur reseau.';
      setError(msg);
      setSuccessMessage('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <h1>Ny fahasalamako</h1>
          <p>{isLogin ? "Deja membre ? Connectez-vous. Sinon, creez un compte." : "Creez votre compte en toute securite."}</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input
                type="email"
                placeholder="exemple@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {successMessage && (
            <div className="auth-message success">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="auth-message error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Mot de passe</label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <span className="loading-spinner"></span>
            ) : (
              isLogin ? 'Se connecter' : 'Creer mon compte'
            )}
          </button>

          <button
            type="button"
            className="auth-switch-btn"
            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMessage(''); }}
          >
            {isLogin ? "Vous n'avez pas de compte ? Creer un compte" : 'Deja inscrit ? Me connecter'}
          </button>
        </form>

        <div className="auth-footer">
          <p>La sante est le plus grand des biens</p>
          <svg className="heartbeat" viewBox="0 0 100 20" fill="none" stroke="#059669" strokeWidth="1.5">
            <polyline points="0,10 10,10 15,3 25,17 35,3 45,17 55,10 100,10" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default Auth;
