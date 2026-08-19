import React, { useState, useEffect } from 'react';
import Chatbot from './Chatbot';
import SymptomChecker from './SymptomChecker';
import UserDashboard from './UserDashboard';
import EmergencyLocator from './EmergencyLocator';
import './Dashboard.css';

function Dashboard({ onLogout, userRole, onOpenAdmin, userEmail }) {
  const [darkMode, setDarkMode] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [tool, setTool] = useState('chatbot'); // 'chatbot' | 'checker'

  // Dark mode toggle - only affects Dashboard, not Auth form
  useEffect(() => {
    const dashboardEl = document.querySelector('.dashboard');
    if (darkMode) {
      dashboardEl?.classList.add('dark-mode');
    } else {
      dashboardEl?.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`dashboard ${darkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div>
              <h1>Santé<strong>+</strong></h1>
              <span className="header-subtitle">Assistant Santé Intelligent</span>
            </div>
          </div>
          <div className="header-right">
            {userRole === 'admin' && (
              <button className="admin-btn-header" onClick={onOpenAdmin} title="Backoffice">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Backoffice
              </button>
            )}
            <button
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Mode clair' : 'Mode sombre'}
            >
              {darkMode ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>
            <button className="logout-btn" onClick={onLogout}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Sélecteur d'outil : Chatbot / Symptom Checker / Carnet / Urgences */}
        <div className="tool-switcher">
          <button
            type="button"
            className={`tool-tab ${tool === 'chatbot' ? 'active' : ''}`}
            onClick={() => setTool('chatbot')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
            </svg>
            Chatbot IA
          </button>
          <button
            type="button"
            className={`tool-tab ${tool === 'checker' ? 'active' : ''}`}
            onClick={() => setTool('checker')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="7" r="4" />
              <path d="M5.5 21v-6a6.5 6.5 0 0113 0v6" />
              <path d="M2 21h20" />
            </svg>
            Symptom Checker
          </button>
          <button
            type="button"
            className={`tool-tab ${tool === 'carnet' ? 'active' : ''}`}
            onClick={() => setTool('carnet')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            Carnet de santé
          </button>
          <button
            type="button"
            className={`tool-tab ${tool === 'locator' ? 'active' : ''}`}
            onClick={() => setTool('locator')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Urgences
          </button>
        </div>

        {tool === 'chatbot' && <Chatbot />}
        {tool === 'checker' && <SymptomChecker />}
        {tool === 'carnet' && <UserDashboard userEmail={userEmail} />}
        {tool === 'locator' && <EmergencyLocator />}


        {/* Health Tips Section */}
        <section className="tips-section">
          <div className="section-header">
            <h3>Conseils de santé généraux</h3>
            <p>Des habitudes simples pour une vie plus saine</p>
          </div>
          <div className="tips-grid">
            <div className="tip-card">
              <div className="tip-icon gradient-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h4>Bien manger</h4>
              <p>Adoptez une alimentation équilibrée riche en fruits, légumes et protéines maigres</p>
              <div className="tip-tags">
                <span>Fruits</span>
                <span>Légumes</span>
                <span>Protéines</span>
              </div>
            </div>
            <div className="tip-card">
              <div className="tip-icon gradient-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <h4>Faire du sport</h4>
              <p>Pratiquez au moins 30 minutes d'activité physique chaque jour</p>
              <div className="tip-tags">
                <span>Marche</span>
                <span>Natation</span>
                <span>Vélo</span>
              </div>
            </div>
            <div className="tip-card">
              <div className="tip-icon gradient-purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
              </div>
              <h4>Bien dormir</h4>
              <p>Dormez 7 à 8 heures par nuit pour une bonne récupération</p>
              <div className="tip-tags">
                <span>Routine</span>
                <span>Calme</span>
                <span>Récupération</span>
              </div>
            </div>
            <div className="tip-card">
              <div className="tip-icon gradient-orange">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h4>Boire de l'eau</h4>
              <p>Buvez au moins 1.5L d'eau par jour pour rester hydraté</p>
              <div className="tip-tags">
                <span>Hydratation</span>
                <span>Santé</span>
                <span>Énergie</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button className="scroll-top-btn" onClick={scrollToTop}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      )}

      <footer className="dashboard-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <span>Santé<strong>+</strong></span>
          </div>
          <p>© 2024 Santé+ - Votre assistant santé intelligent. Tous droits réservés.</p>
          <p className="footer-disclaimer">
            Ce site ne remplace pas l'avis d'un professionnel de santé. En cas d'urgence, appelez le 15 (SAMU).
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;
