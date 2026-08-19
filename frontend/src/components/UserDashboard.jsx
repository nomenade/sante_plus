import React, { useState, useEffect } from 'react';
import Chatbot from './Chatbot';
import './UserDashboard.css';

const HYDRATION_TARGET = 1.8; // litre par jour

const DEFAULT_PROFILE = {
  name: 'Utilisateur',
  avatarColor: '#10b981'
};

// Déduit un nom affichable depuis l'email saisi au formulaire d'inscription/connexion
function displayNameFromEmail(email) {
  if (!email) return 'Utilisateur';
  const local = email.split('@')[0];
  const words = local.split(/[._\-+]+/).filter(Boolean);
  const name = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return name || 'Utilisateur';
}

const DEFAULT_MEDICATIONS = [
  { id: 1, name: 'Doxycycline', dosage: '100mg', posologie: '2 fois/jour', rappel: false },
  { id: 2, name: 'Paracétamol', dosage: '500mg', posologie: '3 fois/jour', rappel: true }
];

const NAV_ITEMS = [
  { id: 'accueil', label: 'Accueil', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ) },
  { id: 'chatbot', label: 'Chatbot', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
    </svg>
  ) },
  { id: 'historique', label: 'Historique', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <polyline points="12 7 12 12 16 14" />
    </svg>
  ) },
  { id: 'profil', label: 'Profil', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ) },
  { id: 'rappels', label: 'Rappels', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ) }
];

const lToStr = (v) => `${v.toFixed(1).replace('.', ',')}L`;

// Initiales pour l'avatar
const initialsOf = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

function UserDashboard({ userEmail }) {
  const [activeView, setActiveView] = useState('accueil');
  const [hydration, setHydration] = useState(1.2);
  const [medications, setMedications] = useState(DEFAULT_MEDICATIONS);
  const [antecedents, setAntecedents] = useState('Allergie aux pénicillines');
  const [editingAntecedents, setEditingAntecedents] = useState(false);
  const [antecedentsDraft, setAntecedentsDraft] = useState('');
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('santeUserProfile');
      const savedObj = saved ? JSON.parse(saved) : {};
      return { ...DEFAULT_PROFILE, name: displayNameFromEmail(userEmail), ...savedObj };
    } catch {
      return { ...DEFAULT_PROFILE, name: displayNameFromEmail(userEmail) };
    }
  });
  const [toast, setToast] = useState(null);

  // Persistance du profil
  useEffect(() => {
    try {
      localStorage.setItem('santeUserProfile', JSON.stringify(profile));
    } catch { /* noop */ }
  }, [profile]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const adjustHydration = (delta) => {
    setHydration((prev) => {
      const next = Math.round((prev + delta) * 10) / 10;
      return Math.max(0, Math.min(HYDRATION_TARGET, next));
    });
  };

  const toggleRappel = (id) => {
    setMedications((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, rappel: !m.rappel } : m
      )
    );
    const med = medications.find((m) => m.id === id);
    const next = !med?.rappel;
    showToast(next ? `Rappel activé pour ${med?.name}` : `Rappel désactivé pour ${med?.name}`);
  };

  const startEditAntecedents = () => {
    setAntecedentsDraft(antecedents);
    setEditingAntecedents(true);
  };

  const saveAntecedents = () => {
    setAntecedents(antecedentsDraft.trim());
    setEditingAntecedents(false);
    showToast('Antécédents enregistrés');
  };

  const hydrationPct = Math.round((hydration / HYDRATION_TARGET) * 100);
  const RING_R = 52;
  const RING_C = 2 * Math.PI * RING_R;
  const ringOffset = RING_C * (1 - hydration / HYDRATION_TARGET);

  return (
    <section className="user-dashboard">
      {toast && (
        <div className={`ud-toast ${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header : photo de profil + nom */}
      <header className="ud-header">
        <div className="ud-brand">
          <div className="ud-brand-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div>
            <strong>Santé<em>+</em></strong>
            <span>Carnet de santé personnel</span>
          </div>
        </div>

        <button className="ud-profile" type="button" onClick={() => setActiveView('profil')}>
          <div className="ud-avatar" style={{ background: profile.avatarColor }}>
            {initialsOf(profile.name)}
          </div>
          <div className="ud-profile-text">
            <strong>{profile.name}</strong>
            <span>Mon profil</span>
          </div>
        </button>
      </header>

      <div className="ud-body">
        {/* Navigation latérale */}
        <nav className="ud-sidebar">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ud-nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Contenu */}
        <div className="ud-content">

        {activeView === 'accueil' && (
          <div className="ud-accueil">
            <div className="ud-welcome">
              <h2>Bonjour, {profile.name.split(' ')[0]} 👋</h2>
              <p>Voici votre carnet de santé du jour.</p>
            </div>

            <div className="ud-cards">
              {/* 1. Bien-être du jour - hydratation */}
              <div className="ud-card bienetre-card">
                <div className="ud-card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Bien-être du jour</span>
                </div>
                <div className="hydration">
                  <div className="hydration-ring">
                    <svg viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r={RING_R} className="ring-bg" />
                      <circle
                        cx="60" cy="60" r={RING_R}
                        className="ring-value"
                        style={{ strokeDasharray: RING_C, strokeDashoffset: ringOffset }}
                      />
                    </svg>
                    <div className="hydration-center">
                      <strong>{lToStr(hydration)}</strong>
                      <span>sur {lToStr(HYDRATION_TARGET)}</span>
                    </div>
                  </div>
                  <div className="hydration-controls">
                    <button type="button" className="h-btn" onClick={() => adjustHydration(0.1)} aria-label="Ajouter">
                      +
                    </button>
                    <span className="hydration-pct">{hydrationPct}%</span>
                    <button type="button" className="h-btn" onClick={() => adjustHydration(-0.1)} aria-label="Retirer">
                      −
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Dernière consultation */}
              <div className="ud-card">
                <div className="ud-card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span>Dernière consultation</span>
                </div>
                <div className="last-consult">
                  <div className="last-consult-badge">Choléra</div>
                  <p>Diagnostiqué le 10/08/2024</p>
                  <span className="last-consult-ia">via l'assistant IA Santé+</span>
                </div>
              </div>

              {/* 3. Médicaments en cours */}
              <div className="ud-card">
                <div className="ud-card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="2" width="16" height="20" rx="2" />
                    <line x1="9" y1="22" x2="9" y2="2" />
                    <line x1="15" y1="22" x2="15" y2="2" />
                  </svg>
                  <span>Médicaments en cours</span>
                </div>
                <ul className="med-list">
                  {medications.map((m) => (
                    <li key={m.id} className="med-item">
                      <div className="med-info">
                        <strong>{m.name} {m.dosage}</strong>
                        <span>{m.posologie}</span>
                      </div>
                      <span
                        className={`rappel-pill ${m.rappel ? 'active' : ''}`}
                        onClick={() => toggleRappel(m.id)}
                        role="button"
                        tabIndex="0"
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleRappel(m.id); }}
                      >
                        {m.rappel ? '🔔 Actif' : '🔕 Rappel'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 4. Antécédents */}
              <div className="ud-card">
                <div className="ud-card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                  <span>Antécédents</span>
                </div>
                {editingAntecedents ? (
                  <div className="antecedents-edit">
                    <textarea
                      value={antecedentsDraft}
                      onChange={(e) => setAntecedentsDraft(e.target.value)}
                      rows="3"
                    />
                    <div className="antecedents-actions">
                      <button type="button" className="save-btn" onClick={saveAntecedents}>Enregistrer</button>
                      <button type="button" className="cancel-btn" onClick={() => setEditingAntecedents(false)}>Annuler</button>
                    </div>
                  </div>
                ) : (
                  <div className="antecedents-view">
                    <p>{antecedents || 'Aucun antécédent renseigné.'}</p>
                    <button type="button" className="edit-btn" onClick={startEditAntecedents}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z" />
                      </svg>
                      Modifier
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'chatbot' && (
          <div className="ud-view chatbot-view">
            <Chatbot />
          </div>
        )}

        {activeView === 'historique' && (
          <div className="ud-view">
            <h2 className="ud-view-title">Historique des consultations</h2>
            <div className="history-list">
              <div className="history-item">
                <span className="history-date">10/08/2024</span>
                <div>
                  <strong>Choléra</strong>
                  <p>Consultation via l'assistant IA — risque élevé de déshydratation.</p>
                </div>
              </div>
              <div className="history-item">
                <span className="history-date">02/08/2024</span>
                <div>
                  <strong>Gastro-entérite</strong>
                  <p>Conseils de réhydratation orale et repos.</p>
                </div>
              </div>
              <div className="history-item">
                <span className="history-date">18/07/2024</span>
                <div>
                  <strong>Migraine</strong>
                  <p>Recommandations : hydratation et réduction du stress.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'profil' && (
          <div className="ud-view">
            <h2 className="ud-view-title">Mon profil</h2>
            <div className="profile-form">
              <div className="profile-avatar-large" style={{ background: profile.avatarColor }}>
                {initialsOf(profile.name)}
              </div>
              <label>
                Nom complet
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                />
              </label>
              <label>
                Email du compte
                <input type="text" value={userEmail || ''} placeholder="Non renseigné" disabled />
              </label>
              <div className="profile-actions">
                <button type="button" className="save-btn" onClick={() => showToast('Profil mis à jour')}>
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}

        {activeView === 'rappels' && (
          <div className="ud-view">
            <h2 className="ud-view-title">Rappels de prise</h2>
            <div className="rappels-list">
              {medications.map((m) => (
                <div key={m.id} className="rappel-item">
                  <span className={`rappel-dot ${m.rappel ? 'on' : ''}`}></span>
                  <div>
                    <strong>{m.name} {m.dosage}</strong>
                    <span>{m.posologie}{m.rappel ? ' — rappel activé' : ''}</span>
                  </div>
                  <span
                    className={`rappel-pill ${m.rappel ? 'active' : ''}`}
                    onClick={() => toggleRappel(m.id)}
                    role="button"
                    tabIndex="0"
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleRappel(m.id); }}
                  >
                    {m.rappel ? '🔔 Actif' : '🔕 Inactif'}
                  </span>
                </div>
              ))}
              <div className="rappel-note">
                💡 Activez un rappel pour être notifié à l'heure de chaque prise de médicament.
              </div>
            </div>
          </div>
        )}

        </div>
      </div>
    </section>
  );
}

export default UserDashboard;

