import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/api';

function Dashboard({ token, onLogout }) {
  const [disease, setDisease] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [toast, setToast] = useState(null);
  const resultRef = useRef(null);

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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!disease.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await axios.post(`${API_URL}/advice`, { disease: disease.trim() });
      setResult(res.data);
      if (res.data.found) {
        showToast(`✓ Résultats trouvés pour ${res.data.disease}`, 'success');
      }
      // Scroll to results
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError('Erreur lors de la recherche. Veuillez réessayer.');
      showToast('✗ Erreur de connexion au serveur', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setDisease(suggestion);
    // Auto-submit after a brief delay
    setTimeout(() => {
      const form = document.querySelector('.search-form');
      if (form) form.requestSubmit();
    }, 200);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`dashboard ${darkMode ? 'dark' : ''}`}>
      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

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
        {/* Hero Section with Particles */}
        <section className="hero-section">
          <div className="particles">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="particle" style={{
                left: `${10 + (i * 15)}%`,
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${3 + i * 0.5}s`
              }} />
            ))}
          </div>
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Plateforme Santé en ligne
            </div>
            <h2>Votre santé, <span className="gradient-text">notre priorité</span></h2>
            <p>
              Découvrez des conseils personnalisés, des recommandations alimentaires 
              et des informations sur les médicaments pour mieux comprendre et gérer 
              votre santé.
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">16+</span>
                <span className="stat-label">Maladies traitées</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">100%</span>
                <span className="stat-label">Conseils gratuits</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">24/7</span>
                <span className="stat-label">Disponible</span>
              </div>
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="search-section">
          <div className="search-container">
            <div className="search-header">
              <div className="search-icon-big">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <h3>Quel est votre problème de santé ?</h3>
              <p>Décrivez votre maladie ou vos symptômes pour obtenir des conseils personnalisés</p>
            </div>
            
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-wrapper">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Ex: diabète, hypertension, paludisme, grippe..."
                  value={disease}
                  onChange={(e) => setDisease(e.target.value)}
                />
                <button type="submit" className="search-btn" disabled={loading || !disease.trim()}>
                  {loading ? (
                    <span className="loading-spinner"></span>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                      Consulter
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick suggestions */}
            <div className="quick-suggestions">
              <span className="suggestions-label">Suggestions rapides :</span>
              <div className="suggestion-chips">
                {[
                  { name: 'Diabète', icon: '🩸' },
                  { name: 'Hypertension', icon: '❤️' },
                  { name: 'Paludisme', icon: '🦟' },
                  { name: 'Grippe', icon: '🤒' },
                  { name: 'VIH', icon: '🔴' },
                  { name: 'Choléra', icon: '💧' },
                  { name: 'Dengue', icon: '🦟' },
                  { name: 'Anémie', icon: '🩺' }
                ].map((s) => (
                  <button
                    key={s.name}
                    className="suggestion-chip"
                    onClick={() => handleSuggestionClick(s.name)}
                  >
                    <span className="chip-icon">{s.icon}</span>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Results Section */}
        {error && (
          <div className="error-message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {result && (
          <section className="results-section" ref={resultRef}>
            {result.found ? (
              <div className="results-container">
                <div className="result-header">
                  <div className="result-title-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                  <div>
                    <span className="result-badge">Diagnostic</span>
                    <h3>{result.disease}</h3>
                  </div>
                </div>

                <div className="result-grid">
                  {/* Symptoms */}
                  <div className="result-card symptoms">
                    <div className="card-header">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                      <h4>Symptômes</h4>
                    </div>
                    <ul>
                      {result.data.symptomes.map((s, i) => (
                        <li key={i}>
                          <span className="bullet bullet-warning"></span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Conseils */}
                  <div className="result-card conseils">
                    <div className="card-header">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <h4>Conseils</h4>
                    </div>
                    <ul>
                      {result.data.conseils.map((c, i) => (
                        <li key={i}>
                          <span className="bullet bullet-success"></span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Médicaments */}
                  <div className="result-card medicaments">
                    <div className="card-header">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="4" y="2" width="16" height="20" rx="2" />
                        <line x1="9" y1="22" x2="9" y2="2" />
                        <line x1="15" y1="22" x2="15" y2="2" />
                      </svg>
                      <h4>Médicaments</h4>
                    </div>
                    <ul>
                      {result.data.medicaments.map((m, i) => (
                        <li key={i}>
                          <span className="bullet bullet-info"></span>
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Aliments Recommandés */}
                  <div className="result-card aliments-recommandes">
                    <div className="card-header">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 8h1a4 4 0 010 8h-1" />
                        <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
                        <line x1="6" y1="1" x2="6" y2="4" />
                        <line x1="10" y1="1" x2="10" y2="4" />
                        <line x1="14" y1="1" x2="14" y2="4" />
                      </svg>
                      <h4>Aliments Recommandés</h4>
                    </div>
                    <ul>
                      {result.data.aliments_recommandes.map((a, i) => (
                        <li key={i}>
                          <span className="bullet bullet-purple"></span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Aliments à Éviter */}
                  <div className="result-card aliments-eviter">
                    <div className="card-header">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      <h4>Aliments à Éviter</h4>
                    </div>
                    <ul>
                      {result.data.aliments_eviter.map((a, i) => (
                        <li key={i}>
                          <span className="bullet bullet-danger"></span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="disclaimer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <p>
                    <strong>Important :</strong> Ces informations sont données à titre indicatif. 
                    Consultez toujours un professionnel de santé pour un diagnostic et un traitement adapté.
                  </p>
                </div>
              </div>
            ) : (
              <div className="not-found">
                <div className="not-found-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h3>Maladie non trouvée</h3>
                <p>{result.message}</p>
                {result.suggestions && result.suggestions.length > 0 && (
                  <div className="suggestions-list">
                    <p>Essayez plutôt :</p>
                    <div className="suggestion-chips">
                      {result.suggestions.map((s, i) => (
                        <button
                          key={i}
                          className="suggestion-chip"
                          onClick={() => handleSuggestionClick(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

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