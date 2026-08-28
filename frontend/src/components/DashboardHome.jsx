import React from 'react';
import './DashboardHome.css';

// Récupère le prénom affichable depuis le profil local ou l'email
// (sans les chiffres : "Santatra12@gmail.com" → "Santatra")
function userNameOf(email) {
  try {
    const saved = localStorage.getItem('santeUserProfile');
    const profile = saved ? JSON.parse(saved) : {};
    if (profile.name && profile.name.trim()) {
      // Nom TOUJOURS sans chiffres, même issu d'un ancien profil sauvegardé
      const cleaned = profile.name
        .trim()
        .split(/\s+/)
        .map((w) => w.replace(/\d+/g, ''))
        .filter(Boolean)
        .join(' ');
      if (cleaned) return cleaned;
    }
  } catch { /* noop */ }
  if (!email) return 'Utilisateur';
  const local = email.split('@')[0];
  const words = local
    .split(/[._\-+]+/)
    .filter(Boolean)
    .map((w) => w.replace(/\d+/g, ''))
    .filter(Boolean);
  const name = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return name || 'Utilisateur';
}

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return 'Bonne nuit';
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

const QUICK_ACTIONS = [
  {
    id: 'chatbot',
    label: 'Assistant IA',
    desc: 'Posez une question de santé',
    color: '#10b981',
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
    desc: 'Analyser vos symptômes',
    color: '#8b5cf6',
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
    desc: 'Vos médicaments & rappels',
    color: '#f59e0b',
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
    desc: 'Trouver un centre proche',
    color: '#ef4444',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
];

// Liste des rappels (médicaments avec rappel activé + hydratation).
// Dynamique : lit les vraies données du carnet de santé. Pour un nouvel
// utilisateur (aucune donnée), la liste est vide → 0 rappel.
function getActiveReminders() {
  const meds = readMedications();
  return meds
    .filter((m) => m.rappel !== false && m.posologie && /^(\d{1,2}):(\d{2})$/.test(m.posologie))
    .map((m) => {
      const [h, min] = m.posologie.split(':').map(Number);
      return { ...m, emoji: m.emoji || '💊', timeMins: h * 60 + min };
    });
}

// Heure du PROCHAIN rappel de prise (ex. « 12:30 »).
// Pour un nouvel utilisateur sans rappel : « --:-- »
function nextReminderTime() {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const times = getActiveReminders()
    .map((r) => r.timeMins)
    .sort((a, b) => a - b);
  if (!times.length) return '--:--';
  const mins = times.find((t) => t >= nowMins) ?? times[0];
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

// Nombre de rappels encore actifs maintenant (heure courante ou future)
function upcomingReminders() {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return getActiveReminders().filter((r) => r.timeMins >= nowMins).length;
}

// Lit la liste réelle des médicaments depuis le carnet de santé.
// Renvoie [] pour un NOUEL utilisateur (aucune donnée) → donc 0 rappels.
function readMedications() {
  try {
    const saved = localStorage.getItem('santeMedications');
    if (!saved) return []; // nouvel utilisateur : rien du tout
    const arr = JSON.parse(saved);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

// Jours de suivi : comptés depuis la première ouverture du tableau de bord
function daysOfTracking() {
  try {
    const t = localStorage.getItem('santeFirstSeen');
    if (!t) {
      localStorage.setItem('santeFirstSeen', String(Date.now()));
      return 1;
    }
    return Math.max(1, Math.floor((Date.now() - parseInt(t, 10)) / 86400000) + 1);
  } catch { return 1; }
}

// Heure du PROCHAIN rappel de prise (ex. « 12:30 ») — vraie donnée de la liste.
  title: 'Conseil du jour',
  body: 'Praticien de 30 minutes de marche rapide aide à réduire le stress et à renforcer votre cœur. Bougez un peu chaque jour !',
  tag: 'Bien-être',
};

function DashboardHome({ userEmail, onNavigate }) {
  const name = userNameOf(userEmail);

  // Cartes d'activité alimentées par les VRAIES valeurs du moment :
  // compteurs d'usage persistants, heure actuelle et ancienneté de suivi.
  const activityCards = [
    { label: 'Consultations enregistrées', icon: '📋', color: '#10b981', value: readCount('santeConsultCount') },
    { label: 'Analyses IA réalisées', icon: '🤖', color: '#8b5cf6', value: readCount('santeAiCount') },
    { label: 'Rappels actifs', icon: '🔔', color: '#f59e0b', value: upcomingReminders() },
    { label: 'Jours de suivi', icon: '🔥', color: '#ef4444', value: daysOfTracking() },
  ];

  return (
    <section className="dash-home">
      {/* Bannière de bienvenue */}
      <div className="dh-hero">
        <div className="dh-hero-glow"></div>
        <div className="dh-hero-text">
          <span className="dh-hero-badge">
            <span className="dh-dot"></span> Plateforme Ny fahasalamako
          </span>
          <h2>{greeting()}, {name.split(' ')[0]} 👋</h2>
          <p>Voici l'aperçu de votre espace santé. Retrouvez tous vos outils, rappels et statistiques au même endroit.</p>
          <div className="dh-chips">
            <span className="dh-chip" style={{ background: 'rgba(255,255,255,0.18)' }}>💧 Hydratation</span>
            <span className="dh-chip" style={{ background: 'rgba(255,255,255,0.18)' }}>💊 Rappels</span>
            <span className="dh-chip" style={{ background: 'rgba(255,255,255,0.18)' }}>🩺 Suivi</span>
          </div>
        </div>
        <div className="dh-hero-stats">
          <div className="dh-hero-stat">
            <div className="dh-hero-stat-num">{nextReminderTime()}</div>
            <div className="dh-hero-stat-label">Prochaine prise 💊</div>
          </div>
          <div className="dh-hero-stat">
            <div className="dh-hero-stat-num">{upcomingReminders()}</div>
            <div className="dh-hero-stat-label">Rappels restants aujourd'hui</div>
          </div>
        </div>
      </div>

      {/* Cartes de statistiques (valeurs réelles) */}
      <div className="dh-stats">
        {activityCards.map((s) => (
          <div className="dh-stat-card" key={s.label}>
            <div className="dh-stat-icon" style={{ background: `${s.color}1a`, color: s.color }}>
              {s.icon}
            </div>
            <div className="dh-stat-info">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Actions rapides */}
      <div className="dh-section-title">
        <h3>Accès rapides</h3>
        <span>Choisissez un outil pour commencer</span>
      </div>
      <div className="dh-tools">
        {QUICK_ACTIONS.map((a) => (
          <button
            type="button"
            className="dh-tool"
            key={a.id}
            onClick={() => onNavigate(a.id)}
          >
            <div className="dh-tool-icon" style={{ background: `${a.color}1a`, color: a.color }}>
              {a.icon}
            </div>
            <div className="dh-tool-text">
              <strong>{a.label}</strong>
              <span>{a.desc}</span>
            </div>
            <span className="dh-tool-arrow">→</span>
          </button>
        ))}
      </div>

             {/* Rappels + conseil */}
      <div className="dh-grid">
        <div className="dh-card">
          <div className="dh-card-head">
            <h4>🔔 Rappels à venir</h4>
            <button type="button" className="dh-link" onClick={() => onNavigate('carnet')}>Tout voir</button>
          </div>
          <ul className="dh-reminders">
            {getActiveReminders().length === 0 ? (
              <li className="dh-reminder-empty">
                <span>Aucun rappel de prise pour le moment. Configurez-en un dans votre carnet de santé !</span>
              </li>
            ) : (
              getActiveReminders().map((r) => (
                <li key={r.id} className="dh-reminder">
                  <span className="dh-reminder-emoji">{r.emoji}</span>
                  <div className="dh-reminder-info">
                    <strong>{r.name} <em>{r.dosage}</em></strong>
                    <span>{r.posologie}</span>
                  </div>
                  <span className="dh-reminder-dot"></span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="dh-card dh-tip">
          <span className="dh-tip-tag">{TIP_OF_DAY.tag}</span>
          <div className="dh-tip-icon">🌿</div>
          <h4>{TIP_OF_DAY.title}</h4>
          <p>{TIP_OF_DAY.body}</p>
          <button type="button" className="dh-link" onClick={() => onNavigate('conseils')}>Voir tous les conseils →</button>
        </div>
      </div>
    </section>
  );
}

export default DashboardHome;
