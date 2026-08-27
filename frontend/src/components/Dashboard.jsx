import React, { useState, useEffect } from 'react';
import Chatbot from './Chatbot';
import SymptomChecker from './SymptomChecker';
import UserDashboard from './UserDashboard';
import EmergencyLocator from './EmergencyLocator';
import DashboardHome from './DashboardHome';
import './Dashboard.css';

const NAV_ITEMS = [
  {
    id: 'accueil',
    label: 'Tableau de bord',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    id: 'chatbot',
    label: 'Assistant IA',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
        <path d="M19 10v2a7 7 0 01-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
      </svg>
    ),
  },
  {
    id: 'checker',
    label: 'Symptom Checker',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    id: 'carnet',
    label: 'Carnet de santé',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'locator',
    label: 'Urgences',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    id: 'conseils',
    label: 'Conseils de santé',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.4 7.2 16.9l.9-5.4L4.2 7.7l5.4-.8z" />
      </svg>
    ),
  },
];

const TIPS = [
  {
    title: 'Bien manger',
    text: "Adoptez une alimentation équilibrée riche en fruits, légumes et protéines maigres",
    tags: ['Fruits', 'Légumes', 'Protéines'],
    color: 'var(--green-gradient)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Faire du sport',
    text: "Pratiquez au moins 30 minutes d'activité physique chaque jour",
    tags: ['Marche', 'Natation', 'Vélo'],
    color: 'var(--blue-gradient, linear-gradient(135deg,#3b82f6,#06b6d4))',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    title: 'Bien dormir',
    text: "Dormez 7 à 8 heures par nuit pour une bonne récupération",
    tags: ['Routine', 'Calme', 'Récupération'],
    color: 'var(--purple-gradient, linear-gradient(135deg,#8b5cf6,#d946ef))',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
  {
    title: 'Boire de l\u2019eau',
    text: "Buvez au moins 1.5L d'eau par jour pour rester hydraté",
    tags: ['Hydratation', 'Santé', 'Énergie'],
    color: 'var(--orange-gradient, linear-gradient(135deg,#f59e0b,#f97316))',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

function Dashboard({ onLogout, userRole, onOpenAdmin, userEmail }) {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('accueil');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Dark mode toggle - only affects Dashboard, not Auth form
  useEffect(() => {
    const dashboardEl = document.querySelector('.dashboard');
    if (darkMode) dashboardEl?.classList.add('dark-mode');
    else dashboardEl?.classList.remove('dark-mode');
  }, [darkMode]);

  // Bouton « Haut de page » : apparaît UNIQUEMENT arrivé tout en bas de l'écran
  useEffect(() => {
    const handleScroll = () => {
      const doc = document.documentElement;
      const maxScroll = doc.scrollHeight - window.innerHeight;
      // Page assez longue pour scroller ET position au fond (tolérance 48px)
      setShowScrollTop(maxScroll > 120 && window.scrollY >= maxScroll - 48);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const navigate = (id) => {
    setActiveView(id);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const current = NAV_ITEMS.find((i) => i.id === activeView) || NAV_ITEMS[0];

  return (
    <div className={`dashboard ${darkMode ? 'dark-mode' : ''}`}>
      {/* ===== SIDEBAR ===== */}
      <aside className={`platform-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="ps-brand">
          <div className="ps-brand-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div className="ps-brand-text">
            <strong>Ny fahasalamako</strong>
          </div>
        </div>

        <p className="ps-label">Menu principal</p>
        <nav className="ps-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ps-nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {userRole === 'admin' && (
          <>
            <p className="ps-label">Administration</p>
            <button type="button" className="ps-nav-item" onClick={onOpenAdmin}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Backoffice</span>
            </button>
          </>
        )}
      </aside>

      {/* Overlay mobile */}
      <div
        className={`platform-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* ===== MAIN ===== */}
      <div className="platform-main">
        <header className="platform-topbar">
          <button
            type="button"
            className="ps-hamburger"
            onClick={() => setSidebarOpen(true)}
            title="Ouvrir le menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="pt-title">
            <h2>{current.label}</h2>
            <span>Plateforme Ny fahasalamako</span>
          </div>

          <div className="pt-right">
            <button
              type="button"
              className="pt-icon-btn"
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

            {userRole === 'admin' && (
              <button type="button" className="pt-icon-btn pt-admin" onClick={onOpenAdmin} title="Backoffice">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </button>
            )}

            <button type="button" className="pt-logout" onClick={onLogout} title="Déconnexion">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Déconnexion</span>
            </button>
          </div>
        </header>

        <main className="platform-content">
          {activeView === 'accueil' && <DashboardHome userEmail={userEmail} onNavigate={navigate} />}
          {activeView === 'chatbot' && (
            <div className="view-panel"><Chatbot /></div>
          )}
          {activeView === 'checker' && (
            <div className="view-panel"><SymptomChecker /></div>
          )}
          {activeView === 'carnet' && <UserDashboard userEmail={userEmail} />}
          {activeView === 'locator' && (
            <div className="view-panel"><EmergencyLocator /></div>
          )}

          {activeView === 'conseils' && (
            <section className="tips-view">
              <div className="tips-view-head">
                <h3>Conseils de santé généraux</h3>
                <p>Des habitudes simples pour une vie plus saine</p>
              </div>
              <div className="tips-grid">
                {TIPS.map((tip) => (
                  <div className="tip-card" key={tip.title}>
                    <div className="tip-icon gradient" style={{ background: tip.color }}>
                      {tip.icon}
                    </div>
                    <h4>{tip.title}</h4>
                    <p>{tip.text}</p>
                    <div className="tip-tags">
                      {tip.tags.map((t) => <span key={t}>{t}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Bouton « Haut de page » : visible uniquement arrivé tout en bas */}
        {showScrollTop && (
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
        )}

        <footer className="platform-footer">
          <p>© 2024 Ny fahasalamako — Votre plateforme de santé intelligente. Tous droits réservés.</p>
          <p className="footer-disclaimer">
            Ce site ne remplace pas l'avis d'un professionnel de santé. En cas d'urgence, appelez le 15 (SAMU).
          </p>
        </footer>
      </div>
    </div>
  );
}

export default Dashboard;
