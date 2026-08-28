// ============================================================
// Module central des statistiques d'usage (tableau de bord).
// Toutes les valeurs commencent à 0 pour un NOUVEL utilisateur
// et augmentent réellement selon ses actions :
//   - Parler à l'assistant IA        → +1 « Analyses IA réalisées »
//   - Décrire des symptômes (IA)     → +1 « Consultations enregistrées »
//   - Lancer une analyse symptômes   → +1 « Consultations enregistrées »
//   - Ajouter un rappel (carnet)     → +1 « Rappels actifs »
//   - Revenir chaque jour            → +1 « Jours de suivi »
// ============================================================

export function readCount(key) {
  try {
    return parseInt(localStorage.getItem(key) || '0', 10) || 0;
  } catch { return 0; }
}

export function incrementCount(key) {
  try {
    localStorage.setItem(key, String(readCount(key) + 1));
  } catch { /* noop */ }
}

const todayLabel = () =>
  new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

// Enregistre une consultation RÉELLE (analyse symptômes ou discussion IA
// avec détection de symptômes) : alimente l'historique + le compteur.
export function recordConsultation(title, description) {
  try {
    const saved = localStorage.getItem('santeConsultations');
    const list = saved ? JSON.parse(saved) : [];
    list.unshift({
      id: Date.now(),
      date: todayLabel(),
      title: String(title || 'Consultation'),
      description: String(description || '').slice(0, 200)
    });
    // On garde au maximum 50 consultations (évite un localStorage infini)
    localStorage.setItem('santeConsultations', JSON.stringify(list.slice(0, 50)));
    incrementCount('santeConsultCount');
  } catch { /* noop */ }
}

// Liste des consultations enregistrées (la plus récente en premier).
// Tableau vide pour un nouvel utilisateur.
export function readConsultations() {
  try {
    const saved = localStorage.getItem('santeConsultations');
    const list = saved ? JSON.parse(saved) : [];
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}
