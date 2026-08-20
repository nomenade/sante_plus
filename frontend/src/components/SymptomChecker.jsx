import React, { useState, useRef } from 'react';
import { DISEASE_INFO } from './symptomData';
import './SymptomChecker.css';

// Normalise un texte (minuscules, sans accents) pour la recherche approximative
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Cherche le nom d'une maladie connue dans un texte saisi librement
// (insensible aux accents : "covid", "COVID-19", "rage", "hepatite" -> fiche)
function matchDiseaseByName(text) {
  const wanted = norm(text);
  if (!wanted) return null;
  return (
    Object.keys(DISEASE_INFO).find((d) => norm(d) === wanted) ||
    Object.keys(DISEASE_INFO).find((d) => norm(d).includes(wanted) || wanted.includes(norm(d)))
  ) || null;
}

/* ============================================================
   Zones anatomiques cliquables (figure humaine réaliste de face)
   Corps segmenté avec arrondis pour un rendu proche d'un schéma
   anatomique : cou, épaules/pontrine, abdomen, bassin, bras (haut
   + avant-bras + main), jambes (cuisse + pied). Chaque zone est
   cliquable et sélectionnable.
   ============================================================ */
const BODY_ZONES = [
  // Tête (cercle)
  { id: 'tete', label: 'Tête', node: <circle cx="110" cy="32" r="24" /> },
  // Cou
  { id: 'cou', label: 'Cou', node: <rect x="101" y="42" width="18" height="22" rx="7" /> },
  // Poitrine (épaules et buste supérieur, rentrant à la taille)
  {
    id: 'poitrine',
    label: 'Poitrine',
    node: <path d="M84 62 L136 62 L126 94 L96 100 L90 96 L84 90 L84 110 L80 112 L82 140 L96 142 L126 142 Z" />
  },
  // Abdomen (buste inférieur, avant de la taille)
  {
    id: 'abdomen',
    label: 'Abdomen',
    node: <path d="M96 140 L126 140 L124 176 L98 176 Z" />
  },
  // Bassin (hanches / pelvis)
  {
    id: 'bassin',
    label: 'Bassin',
    node: <path d="M98 176 L124 176 L134 200 L88 200 Z" />
  },
  // Bras gauche - haut du bras (épaule -> coude)
  { id: 'brasG', label: 'Bras gauche (haut)', node: <rect x="70" y="64" width="20" height="58" rx="9" /> },
  // Avant-bras gauche
  { id: 'avantBrasG', label: 'Avant-bras gauche', node: <rect x="72" y="122" width="18" height="60" rx="8" /> },
  // Main gauche
  { id: 'mainG', label: 'Main gauche', node: <rect x="73" y="182" width="15" height="24" rx="6" /> },
  // Bras droit du haut
  { id: 'brasD', label: 'Bras droit (haut)', node: <rect x="128" y="64" width="22" height="66" rx="9" /> },
  // Avant-bras droit
  { id: 'avantBrasD', label: 'Avant-bras droit', node: <rect x="130" y="122" width="18" height="60" rx="8" /> },
  // Main droite
  { id: 'mainD', label: 'Main droite', node: <rect x="132" y="182" width="15" height="24" rx="6" /> },
  // Jambe gauche (cuisse + tibia)
  { id: 'jambeG', label: 'Jambe gauche', node: <rect x="86" y="202" width="28" height="140" rx="11" /> },
  // Pied gauche
  { id: 'piedG', label: 'Pied gauche', node: <rect x="82" y="342" width="36" height="26" rx="8" /> },
  // Jambe droite
  { id: 'jambeD', label: 'Jambe droite', node: <rect x="112" y="202" width="28" height="140" rx="11" /> },
  // Pied droit
  { id: 'piedD', label: 'Pied droit', node: <rect x="102" y="342" width="36" height="26" rx="8" /> }
];

/* ============================================================
   Symptômes courants (puces cliquables)
   ============================================================ */
const COMMON_SYMPTOMS = [
  { id: 'vomissements', label: 'Vomissements', icon: '🤮' },
  { id: 'crampes_abdominales', label: 'Crampes abdominales', icon: '😖' },
  { id: 'diarrhee', label: 'Diarrhée', icon: '💧' },
  { id: 'fievre', label: 'Fièvre', icon: '🌡️' },
  { id: 'maux_de_tete', label: 'Maux de tête', icon: '🤕' },
  { id: 'toux', label: 'Toux', icon: '😷' },
  { id: 'fatigue', label: 'Fatigue', icon: '🥱' },
  { id: 'nausees', label: 'Nausées', icon: '🤢' },
  { id: 'douleurs_abdominales', label: 'Douleurs abdominales', icon: '🫃' },
  { id: 'frissons', label: 'Frissons', icon: '🥶' },
  { id: 'courbatures', label: 'Courbatures', icon: '💪' },
  { id: 'douleurs_articulaires', label: 'Douleurs articulaires', icon: '🦴' },
  { id: 'essoufflement', label: 'Essoufflement', icon: '😮‍💨' },
  { id: 'perte_gout_odorat', label: 'Perte du goût/odorat', icon: '👅' },
  { id: 'morsure_animale', label: 'Morsure d\'animal', icon: '🐕' }
];

/* ============================================================
   Règles : symptômes -> maladies (avec niveau d'urgence)
   ============================================================ */
const DISEASE_RULES = [
  { disease: 'Choléra', urgency: 'élevée', symptoms: ['vomissements', 'crampes_abdominales', 'diarrhee', 'deshydratation'] },
  { disease: 'Gastro-entérite', urgency: 'élevée', symptoms: ['vomissements', 'nausees', 'diarrhee', 'douleurs_abdominales', 'fievre'] },
  { disease: 'Paludisme', urgency: 'élevée', symptoms: ['fievre', 'frissons', 'maux_de_tete', 'courbatures'] },
  { disease: 'Typhoïde', urgency: 'élevée', symptoms: ['fievre', 'maux_de_tete', 'douleurs_abdominales', 'constipation'] },
  { disease: 'Grippe', urgency: 'modérée', symptoms: ['fievre', 'toux', 'courbatures', 'fatigue'] },
  { disease: 'Dengue', urgency: 'élevée', symptoms: ['fievre', 'douleurs_articulaires', 'maux_de_tete', 'courbatures'] },
  { disease: 'Anémie', urgency: 'modérée', symptoms: ['fatigue', 'paleurs', 'vertiges', 'essoufflement'] },
  { disease: 'Ulcère', urgency: 'modérée', symptoms: ['douleurs_abdominales', 'nausees', 'vomissements', 'ballonnements'] },
  { disease: 'Migraine', urgency: 'basse', symptoms: ['maux_de_tete', 'nausees'] },
  { disease: 'Appendicite', urgency: 'élevée', symptoms: ['douleurs_abdominales', 'vomissements', 'nausees', 'fievre'] },
  { disease: 'COVID-19', urgency: 'élevée', symptoms: ['fievre', 'toux', 'perte_gout_odorat', 'essoufflement', 'fatigue'] },
  { disease: 'Rage', urgency: 'élevée', symptoms: ['morsure_animale', 'fievre', 'maux_de_tete'] },
  { disease: 'Tuberculose', urgency: 'élevée', symptoms: ['toux', 'fievre', 'essoufflement', 'fatigue'] },
  { disease: 'Hépatite B', urgency: 'élevée', symptoms: ['fievre', 'nausees', 'douleurs_abdominales', 'fatigue'] },
  { disease: 'Méningite', urgency: 'élevée', symptoms: ['maux_de_tete', 'fievre', 'nausees'] },
  { disease: 'Asthme', urgency: 'modérée', symptoms: ['essoufflement', 'toux', 'fatigue'] },
  { disease: 'Bronchite', urgency: 'modérée', symptoms: ['toux', 'essoufflement', 'fievre', 'fatigue'] },
  { disease: 'Rougeole', urgency: 'élevée', symptoms: ['fievre', 'toux', 'maux_de_tete'] },
  { disease: 'Tétanos', urgency: 'élevée', symptoms: ['morsure_animale', 'fievre'] }
];

/* ============================================================
   Carte anatomique : localisation corporelle de chaque symptôme.
   Les symptômes généraux (fièvre, fatigue, frissons...) touchent
   tout le corps : ils sont donc compatibles avec n'importe quelle
   zone sélectionnée. Cela rend l'analyse cohérente avec le choix
   de la carte anatomique.
   ============================================================ */
const ALL_BODY_ZONES = BODY_ZONES.map((z) => z.id);

const SYMPTOM_ZONES = {
  maux_de_tete: ['tete'],
  vertiges: ['tete'],
  fievre: ALL_BODY_ZONES,
  frissons: ALL_BODY_ZONES,
  sueurs: ALL_BODY_ZONES,
  fatigue: ALL_BODY_ZONES,
  courbatures: ALL_BODY_ZONES,
  deshydratation: ALL_BODY_ZONES,
  paleurs: ALL_BODY_ZONES,
  toux: ['poitrine'],
  essoufflement: ['poitrine'],
  perte_gout_odorat: ['tete'],
  morsure_animale: ALL_BODY_ZONES,
  nausees: ['abdomen'],
  vomissements: ['abdomen'],
  diarrhee: ['abdomen'],
  crampes_abdominales: ['abdomen'],
  douleurs_abdominales: ['abdomen'],
  ballonnements: ['abdomen'],
  constipation: ['abdomen'],
  douleurs_articulaires: ['brasG', 'brasD', 'avantBrasG', 'avantBrasD', 'jambeG', 'jambeD', 'mainG', 'mainD', 'piedG', 'piedD', 'cou']
};

/* Mots-clés pour interpréter les symptômes saisis librement */
const CUSTOM_KEYWORDS = [
  { re: /diarrh/i, ids: ['diarrhee'] },
  { re: /vomiss|vomit/i, ids: ['vomissements'] },
  { re: /naus/i, ids: ['nausees'] },
  { re: /fi[èe]vre/i, ids: ['fievre'] },
  { re: /toux/i, ids: ['toux'] },
  { re: /fatigu/i, ids: ['fatigue'] },
  { re: /frisson/i, ids: ['frissons'] },
  { re: /courbatur/i, ids: ['courbatures'] },
  { re: /crampe/i, ids: ['crampes_abdominales'] },
  { re: /abdomin|douleur.*ventre/i, ids: ['douleurs_abdominales'] },
  { re: /t[êe]te|migraine/i, ids: ['maux_de_tete'] },
  { re: /essouffle|souffle.*court|respiration/i, ids: ['essoufflement'] },
  { re: /(perte.*(go[uû]t|odorat)|go[uû]t.*odorat|odorat)/i, ids: ['perte_gout_odorat'] },
  { re: /morfdu|mord|griffe.*animal|morsure/i, ids: ['morsure_animale'] }
];

/* Suggestions rapides (badges interactifs) */
const QUICK_DISEASES = [
  { name: 'Diabète', icon: '🩸' },
  { name: 'Paludisme', icon: '🦟' },
  { name: 'Grippe', icon: '🤒' },
  { name: 'Hypertension', icon: '❤️' },
  { name: 'VIH', icon: '🔴' },
  { name: 'Choléra', icon: '💧' },
  { name: 'Dengue', icon: '🦟' },
  { name: 'Anémie', icon: '🩺' },
  { name: 'Migraine', icon: '🤯' }
];

const DEFAULT_URGENCY = {
  'Diabète': 'élevée', 'Paludisme': 'élevée', 'Grippe': 'modérée',
  'Hypertension': 'élevée', 'VIH': 'élevée', 'Choléra': 'élevée',
  'Dengue': 'élevée', 'Anémie': 'modérée', 'Migraine': 'basse'
};


/* ============================================================
   Analyse : calcule les hypothèses classées par probabilité.
   Le résultat est compatible avec les symptômes ET avec la carte
   anatomique (zones sélectionnées) : une hypothèse dont les
   symptômes se situent dans les zones choisies est favorisée.
   ============================================================ */
function runAnalysis(selectedIds, selectedZoneIds) {
  const set = new Set(selectedIds);
  const zones = new Set(selectedZoneIds || []);
  const totalReported = set.size;
  const hasZones = zones.size > 0;

  const items = DISEASE_RULES
    .map((rule) => {
      const matchedIds = rule.symptoms.filter((s) => set.has(s));
      const matched = matchedIds.length;
      if (matched === 0) return null;

      const total = rule.symptoms.length;
      const coverage = total > 0 ? matched / total : 0;

      // Compatibilité anatomique calculée sur les symptômes réellement
      // signalés (matched) : un symptôme général convient toujours, un
      // symptôme localisé ne valide que si l'une de ses zones corporelles
      // fait partie des zones sélectionnées sur la carte.
      let zoneCoverage = 0.5;
      if (hasZones && matched > 0) {
        const scores = matchedIds.map((s) => {
          const loc = SYMPTOM_ZONES[s];
          if (!loc || loc.length === 0) return 0.5;
          return loc.some((z) => zones.has(z)) ? 1 : 0;
        });
        zoneCoverage = scores.reduce((a, b) => a + b, 0) / matched;
      }

      // Fiabilité : la couverture des symptômes types de la maladie prime,
      // fortement renforcée par la concordance avec la carte anatomique et
      // le nombre total de symptômes signalés.
      const infoConfidence = Math.min(1, totalReported / 4);
      let probability = 12 + 54 * Math.pow(coverage, 0.6) + 24 * zoneCoverage + 10 * infoConfidence;
      if (coverage >= 0.8) probability += 6; // presque tous les symptômes types => très probable
      else if (coverage >= 0.6) probability += 3;

      return {
        disease: rule.disease,
        urgency: rule.urgency,
        matched,
        total,
        matchedIds,
        zoneCoverage: Math.round(zoneCoverage * 100),
        probability: Math.round(Math.max(10, Math.min(96, probability)))
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.probability - a.probability);

  return items;
}

function severityLabel(urgency) {
  return urgency === 'élevée' ? 'Urgence élevée' : urgency === 'modérée' ? 'Urgence modérée' : 'Risque faible';
}

function symptomLabel(id) {
  return COMMON_SYMPTOMS.find((s) => s.id === id)?.label || id;
}

function SymptomChecker() {
  const [selectedZones, setSelectedZones] = useState(['abdomen']);
  const [selectedSymptoms, setSelectedSymptoms] = useState(['vomissements', 'crampes_abdominales']);
  const [customInput, setCustomInput] = useState('');
  const [customSymptoms, setCustomSymptoms] = useState([]);
  const [quickInput, setQuickInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null); // { source, items:[...] }
  const [toast, setToast] = useState(null);
  const resultRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fait défiler la page jusqu'à la zone de résultat
  const scrollToResult = () => {
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  const toggleZone = (id) => {
    setSelectedZones((prev) =>
      prev.includes(id) ? prev.filter((z) => z !== id) : [...prev, id]
    );
  };

  const toggleSymptom = (id) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const addCustomSymptom = () => {
    const text = customInput.trim();
    if (!text) return;
    if (customSymptoms.includes(text)) {
      showToast('Ce symptôme est déjà ajouté', 'error');
      return;
    }
    const next = [...customSymptoms, text];
    setCustomSymptoms(next);
    setCustomInput('');

    // Nom de maladie saisi directement (covid, rage, tuberculose…) :
    // on affiche immédiatement sa fiche complète.
    const direct = matchDiseaseByName(text);
    if (direct) {
      const rule = DISEASE_RULES.find((r) => r.disease === direct);
      const urgency = rule ? rule.urgency : DEFAULT_URGENCY[direct] || 'modérée';
      setResult({
        source: 'quick',
        disease: direct,
        items: [{ disease: direct, urgency, probability: 95, info: DISEASE_INFO[direct] || null }]
      });
      showToast(`Fiche : ${direct}`);
      scrollToResult();
      return;
    }

    // Sinon, analyse symptomatique : le résultat s'affiche sous le bouton "Lancer l'analyse"
    const ids = buildEffectiveIds(next);
    if (ids.length > 0) runAnalysisFlow(ids);
    else showToast('Symptôme non reconnu. Essayez un nom de maladie ou un symptôme précis.', 'error');
  };

  const removeCustomSymptom = (text) => {
    setCustomSymptoms((prev) => prev.filter((s) => s !== text));
  };

  // Union des symptômes (standard + ceux déduits des champs libres)
  const buildEffectiveIds = (customList) => {
    const ids = new Set(selectedSymptoms);
    (customList || []).forEach((text) => {
      const lower = text.toLowerCase();
      CUSTOM_KEYWORDS.forEach(({ re, ids: mapped }) => {
        if (re.test(lower)) mapped.forEach((m) => ids.add(m));
      });
    });
    return Array.from(ids);
  };

  // Analyse commune : calcule puis affiche le résultat dans la zone
  // située juste sous le bouton "Lancer l'analyse"
  const runAnalysisFlow = (ids) => {
    setAnalyzing(true);
    setResult(null);
    setTimeout(() => {
      const items = runAnalysis(ids, selectedZones);
      if (items.length === 0) {
        showToast('Aucune hypothèse trouvée pour ces symptômes', 'error');
      }
      setResult({
        source: 'analysis',
        zones: selectedZones,
        symptoms: ids,
        items: items.map((it) => ({
          ...it,
          info: DISEASE_INFO[it.disease] || null,
          matchedSymptoms: it.matchedIds.map(symptomLabel)
        }))
      });
      setAnalyzing(false);
      scrollToResult();
    }, 600);
  };

  const handleAnalyze = () => {
    if (selectedSymptoms.length === 0 && customSymptoms.length === 0) {
      showToast('Sélectionnez au moins un symptôme', 'error');
      return;
    }
    runAnalysisFlow(buildEffectiveIds(customSymptoms));
  };

  // Suggestion rapide : affiche la fiche complète de la maladie
  const handleQuick = (disease) => {
    const rule = DISEASE_RULES.find((r) => r.disease === disease);
    const urgency = rule ? rule.urgency : DEFAULT_URGENCY[disease] || 'modérée';
    setResult({
      source: 'quick',
      disease,
      items: [{ disease, urgency, probability: 90, info: DISEASE_INFO[disease] || null }]
    });
    showToast(`Fiche rapide : ${disease}`);
    scrollToResult();
  };

  // Suggestion rapide libre : cherche une maladie non listée dans la base
  // (insensible aux accents) et affiche sa fiche dans la zone de résultat.
  const handleQuickCustom = () => {
    const name = quickInput.trim();
    if (!name) {
      showToast('Tapez le nom d\'une maladie', 'error');
      return;
    }
    const wanted = norm(name);
    const key =
      Object.keys(DISEASE_INFO).find((d) => norm(d) === wanted) ||
      Object.keys(DISEASE_INFO).find((d) => norm(d).includes(wanted)) ||
      Object.keys(DISEASE_INFO).find((d) => wanted.includes(norm(d)));
    if (!key) {
      showToast('Maladie non trouvée dans la base. Essayez un autre nom.', 'error');
      return;
    }
    setQuickInput('');
    handleQuick(key);
  };

  return (
    <section className="checker-section">
      {toast && (
        <div className={`checker-toast ${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="checker-header">
        <h2>
          🩻 Symptom Checker Anatomique
          <span>Diagnostic visuel interactif</span>
        </h2>
        <p>
          Cliquez sur la zone du corps concernée, sélectionnez vos symptômes puis
          lancez l'analyse pour obtenir des hypothèses de diagnostic.
        </p>
      </div>

      <div className="checker-columns">
        {/* Colonne 1 - Carte anatomique */}
        <div className="checker-col anatomy-col">
          <div className="col-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="7" r="4" />
              <path d="M5.5 21v-6a6.5 6.5 0 0113 0v6" />
              <path d="M2 21h20" />
            </svg>
            <span>Carte anatomique</span>
          </div>

          <div className="body-map">
            <svg viewBox="0 0 220 380" className="body-svg">
              {BODY_ZONES.map((z) => {
                const isSelected = selectedZones.includes(z.id);
                return (
                  <g
                    key={z.id}
                    className={`body-zone ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleZone(z.id)}
                    role="button"
                    tabIndex="0"
                    aria-label={z.label}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleZone(z.id); }}
                  >
                    {z.node}
                    <title>{z.label}</title>
                  </g>
                );
              })}
            </svg>
          </div>

          <p className="body-map-hint">Cliquez sur une zone du corps ci-dessus (cou, poitrine, bras, main, jambe, pied…) pour la sélectionner et affiner l'analyse.</p>

          <div className="zone-legend">
            {selectedZones.length === 0 ? (
              <span className="legend-empty">Aucune zone sélectionnée</span>
            ) : (
              selectedZones.map((id) => (
                <span key={id} className="legend-chip">
                  {BODY_ZONES.find((z) => z.id === id)?.label}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Colonne 2 - Symptômes */}
        <div className="checker-col symptoms-col">
          <div className="col-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            <span>Symptômes</span>
          </div>

          <ul className="symptom-list">
            {COMMON_SYMPTOMS.map((s) => {
              const isSelected = selectedSymptoms.includes(s.id);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`symptom-chip ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleSymptom(s.id)}
                  >
                    <span className="symptom-icon">{s.icon}</span>
                    {s.label}
                    <span className="check-mark">{isSelected ? '✓' : ''}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="custom-symptoms">
            <label>Autres symptômes non listés</label>
            <div className="custom-row">
              <input
                type="text"
                placeholder="Ex : j'ai la diarrhée, douleurs au ventre..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSymptom(); } }}
              />
              <button type="button" className="add-symptom-btn" onClick={addCustomSymptom}>
                Ajouter
              </button>
            </div>
            {customSymptoms.length > 0 && (
              <div className="custom-tags">
                {customSymptoms.map((c) => (
                  <span key={c} className="custom-tag">
                    {c}
                    <button type="button" onClick={() => removeCustomSymptom(c)}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Colonne 3 - Actions & Résultat */}
        <div className="checker-col result-col">
          <div className="col-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span>Actions &amp; Résultat</span>
          </div>

          <button
            type="button"
            className="analyze-btn"
            onClick={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <span className="loading-spinner"></span>
                Analyse en cours...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                Lancer l'analyse
              </>
            )}
          </button>

          <div className="result-area" ref={resultRef}>
            {result ? (
              <div className="result-list">
                {result.source === 'quick' && (
                  <div className="quick-note">Résultat de la suggestion rapide</div>
                )}
                {result.source === 'analysis' && (
                  <div className="analysis-context">
                    {result.zones && result.zones.length > 0 && (
                      <div className="context-row">
                        <span className="context-label">Zones anatomiques :</span>
                        {result.zones.map((id) => (
                          <span key={id} className="context-chip">
                            {BODY_ZONES.find((z) => z.id === id)?.label}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="context-row">
                      <span className="context-label">Symptômes analysés :</span>
                      <span className="context-text">
                        {result.symptoms && result.symptoms.length
                          ? result.symptoms.map(symptomLabel).join(', ')
                          : '—'}
                      </span>
                    </div>
                  </div>
                )}
                {result.items.map((item, idx) => (
                  <div
                    key={item.disease}
                    className={`result-card ${idx === 0 ? 'top' : ''}`}
                  >
                    <div className="result-card-head">
                      <div>
                        <span className={`severity-badge ${item.urgency}`}>{severityLabel(item.urgency)}</span>
                        <h3>{item.disease}</h3>
                      </div>
                      <div className="prob-big">{item.probability}%</div>
                    </div>
                    <div className="prob-bar">
                      <span style={{ width: `${item.probability}%` }}></span>
                    </div>
                    <span className="prob-label">Probabilité estimée</span>

                    {result.source === 'analysis' && item.matchedSymptoms?.length > 0 && (
                      <div className="matched-symptoms">
                        <span className="context-label">Symptômes correspondants :</span>
                        {item.matchedSymptoms.map((s) => (
                          <span key={s} className="matched-chip">{s}</span>
                        ))}
                      </div>
                    )}
                    {result.source === 'analysis' && result.zones && result.zones.length > 0 && (
                      item.zoneCoverage >= 60 ? (
                        <div className="zone-match-tag">✅ Zones anatomiques concordantes</div>
                      ) : item.zoneCoverage < 40 ? (
                        <div className="zone-mismatch-tag">⚠️ Zones peu concordantes avec ces symptômes</div>
                      ) : null
                    )}

                    {(result.source === 'quick' || idx === 0) && item.info && (
                      <div className="fiche">
                        <div className="fiche-block">
                          <h4>🩺 Symptômes</h4>
                          <ul className="fiche-list">
                            {item.info.symptoms.map((s, i) => (
                              <li key={i}><span className="fiche-bullet">•</span> {s}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="fiche-block">
                          <h4>💊 Médicaments</h4>
                          <ul className="fiche-list">
                            {item.info.medications.map((m, i) => (
                              <li key={i}><span className="fiche-bullet">•</span> {m}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="fiche-block fiche-avoid">
                          <h4>🚫 Aliments à éviter</h4>
                          <ul className="fiche-list">
                            {item.info.foodsToAvoid.map((f, i) => (
                              <li key={i}><span className="fiche-bullet">•</span> {f}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="fiche-block fiche-eat">
                          <h4>✅ Aliments à manger</h4>
                          <ul className="fiche-list">
                            {item.info.foodsToEat.map((f, i) => (
                              <li key={i}><span className="fiche-bullet">•</span> {f}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="fiche-note">
                          Fiche indicative — consultez un professionnel de santé pour un diagnostic.
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="result-empty">
                <span>🩺</span>
                <p>
                  {analyzing
                    ? 'Analyse en cours...'
                    : 'Lancez l\u2019analyse pour afficher les hypothèses potentielles ici.'}
                </p>
              </div>
            )}
          </div>

          <div className="result-disclaimer">
            Diagnostic indicatif et non médical. En cas d'urgence, appelez le 15 (SAMU).
          </div>
        </div>
      </div>

      {/* Suggestions rapides - badges interactifs + maladie libre */}
      <div className="quick-row">
        <span className="suggestions-label">Suggestions rapides :</span>
        <div className="quick-badges">
          {QUICK_DISEASES.map((q) => (
            <button
              key={q.name}
              type="button"
              className="quick-badge"
              onClick={() => handleQuick(q.name)}
            >
              <span className="quick-icon">{q.icon}</span>
              {q.name}
            </button>
          ))}
        </div>
        <div className="quick-custom">
          <input
            type="text"
            placeholder="Autre maladie (ex : Typhoïde, Ulcère, Appendicite…)"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleQuickCustom(); } }}
            aria-label="Rechercher une autre maladie"
          />
          <button type="button" className="quick-custom-btn" onClick={handleQuickCustom}>
            Afficher
          </button>
        </div>
      </div>
    </section>
  );
}

export default SymptomChecker;

