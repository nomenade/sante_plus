import React, { useState, useRef } from 'react';
import { DISEASE_INFO } from './symptomData';
import './SymptomChecker.css';

/* ============================================================
   Zones anatomiques cliquables (schéma stylisé, homme de face)
   ============================================================ */
const BODY_ZONES = [
  { id: 'tete', label: 'Tête', node: <circle cx="100" cy="38" r="26" /> },
  {
    id: 'poitrine',
    label: 'Poitrine',
    node: <path d="M78 84 C70 112 70 134 76 152 L124 152 C130 134 130 112 122 84 Z" />
  },
  {
    id: 'abdomen',
    label: 'Abdomen',
    node: <path d="M76 152 L124 152 C128 178 128 198 122 212 L78 212 C72 198 72 178 76 152 Z" />
  },
  {
    id: 'bassin',
    label: 'Bassin',
    node: <path d="M78 212 L122 212 C125 232 124 248 117 258 L83 258 C76 248 75 232 78 212 Z" />
  },
  {
    id: 'brasG',
    label: 'Bras gauche',
    node: <path d="M65 84 L54 90 C50 120 50 160 54 196 L64 200 C72 196 74 150 74 120 Z" />
  },
  {
    id: 'brasD',
    label: 'Bras droit',
    node: <path d="M135 84 L146 90 C150 120 150 160 146 196 L136 200 C128 196 126 150 126 120 Z" />
  },
  {
    id: 'jambeG',
    label: 'Jambe gauche',
    node: <path d="M82 258 L100 258 C100 300 100 344 98 356 L84 356 C81 344 80 300 82 258 Z" />
  },
  {
    id: 'jambeD',
    label: 'Jambe droite',
    node: <path d="M100 258 L118 258 C120 300 119 344 116 356 L102 356 C100 344 100 300 98 258 Z" />
  }
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
  { id: 'douleurs_articulaires', label: 'Douleurs articulaires', icon: '🦴' }
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
  { disease: 'Appendicite', urgency: 'élevée', symptoms: ['douleurs_abdominales', 'vomissements', 'nausees', 'fievre'] }
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
  nausees: ['abdomen'],
  vomissements: ['abdomen'],
  diarrhee: ['abdomen'],
  crampes_abdominales: ['abdomen'],
  douleurs_abdominales: ['abdomen'],
  ballonnements: ['abdomen'],
  constipation: ['abdomen'],
  douleurs_articulaires: ['brasG', 'brasD', 'jambeG', 'jambeD']
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
  { re: /t[êe]te|migraine/i, ids: ['maux_de_tete'] }
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
    setCustomSymptoms((prev) => [...prev, text]);
    setCustomInput('');
  };

  const removeCustomSymptom = (text) => {
    setCustomSymptoms((prev) => prev.filter((s) => s !== text));
  };

  // Union des symptômes (standard + ceux déduits des champs libres)
  const effectiveSymptoms = () => {
    const ids = new Set(selectedSymptoms);
    customSymptoms.forEach((text) => {
      const lower = text.toLowerCase();
      CUSTOM_KEYWORDS.forEach(({ re, ids: mapped }) => {
        if (re.test(lower)) mapped.forEach((m) => ids.add(m));
      });
    });
    return Array.from(ids);
  };

  const handleAnalyze = () => {
    if (selectedSymptoms.length === 0 && customSymptoms.length === 0) {
      showToast('Sélectionnez au moins un symptôme', 'error');
      return;
    }
    setAnalyzing(true);
    setResult(null);
    setTimeout(() => {
      const symptoms = effectiveSymptoms();
      const items = runAnalysis(symptoms, selectedZones);
      if (items.length === 0) {
        showToast('Aucune hypothèse trouvée pour ces symptômes', 'error');
      }
      setResult({
        source: 'analysis',
        zones: selectedZones,
        symptoms,
        items: items.map((it) => ({
          ...it,
          info: DISEASE_INFO[it.disease] || null,
          matchedSymptoms: it.matchedIds.map(symptomLabel)
        }))
      });
      setAnalyzing(false);
      scrollToResult();
    }, 800);
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
            <svg viewBox="0 0 200 370" className="body-svg">
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

      {/* Suggestions rapides - badges interactifs */}
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
      </div>
    </section>
  );
}

export default SymptomChecker;

