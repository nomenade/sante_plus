import React, { useState, useRef } from 'react';
import { DISEASE_INFO } from './symptomData';
import { recordConsultation } from '../utils/stats';
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
   Zones anatomiques cliquables — silhouette humaine réaliste
   (vue de face, tracé en courbes de Bézier haute résolution,
   viewBox 360x760). Chaque zone est une forme dédiée qui
   épouse l'anatomie ; le côté gauche est obtenu en reflétant
   le côté droit sur l'axe central (x -> 360 - x).
   ============================================================ */
const mirrorPath = (d) =>
  d.replace(/(-?\d+(?:\.\d+)?)[ ,]+(-?\d+(?:\.\d+)?)/g, (_m, x, y) =>
    `${(360 - parseFloat(x)).toFixed(1)} ${y}`
  );

// Membre supérieur droit (bras, avant-bras, main)
const RD_BRAS = 'M246 196 C258 186 266 172 264 158 C276 168 284 186 286 208 C288 244 288 284 286 318 C280 330 268 332 258 326 C250 288 246 244 246 196 Z';
const RD_AVANTBRAS = 'M258 326 C268 332 280 330 286 318 C292 356 296 400 298 442 C299 458 297 470 292 478 C282 484 268 484 260 478 C254 470 252 458 253 442 C255 400 256 356 258 326 Z';
const RD_MAIN = 'M260 478 C268 484 282 484 292 478 C296 492 300 508 304 524 C306 534 306 544 302 550 C300 558 296 560 292 558 C290 562 286 563 283 559 C280 563 276 563 274 558 C270 562 266 561 264 556 C258 546 256 532 257 518 C258 504 259 490 260 478 Z';
// Membre inférieur droit (cuisse + mollet, pied)
const RD_JAMBE = 'M250 424 C252 470 250 520 240 570 C234 592 232 606 234 620 C238 646 234 668 224 686 C216 694 204 696 196 690 C192 668 192 646 196 624 C200 600 198 570 192 545 C188 512 184 470 181 452 C204 452 228 444 242 434 C245 430 248 427 250 424 Z';
const RD_PIED = 'M224 686 C232 692 240 698 246 706 C252 716 252 728 246 734 C238 742 220 744 208 740 C200 736 196 726 196 716 C196 706 198 696 204 690 C210 686 218 684 224 686 Z';

// Ordre de peinture : jambes derrière, torse puis tête devant
const BODY_ZONES = [
  // Jambes + pieds
  { id: 'jambeG', label: 'Jambe gauche', d: mirrorPath(RD_JAMBE) },
  { id: 'piedG', label: 'Pied gauche', d: mirrorPath(RD_PIED) },
  { id: 'jambeD', label: 'Jambe droite', d: RD_JAMBE },
  { id: 'piedD', label: 'Pied droit', d: RD_PIED },
  // Bras + mains
  { id: 'brasG', label: 'Bras gauche (haut)', d: mirrorPath(RD_BRAS) },
  { id: 'avantBrasG', label: 'Avant-bras gauche', d: mirrorPath(RD_AVANTBRAS) },
  { id: 'mainG', label: 'Main gauche', d: mirrorPath(RD_MAIN) },
  { id: 'brasD', label: 'Bras droit (haut)', d: RD_BRAS },
  { id: 'avantBrasD', label: 'Avant-bras droit', d: RD_AVANTBRAS },
  { id: 'mainD', label: 'Main droite', d: RD_MAIN },
  // Tronc
  {
    id: 'bassin',
    label: 'Bassin',
    d: 'M126 386 C144 394 162 397 180 397 C198 397 216 394 234 386 C242 400 248 412 250 424 C240 442 214 452 180 452 C146 452 120 442 110 424 C112 412 118 400 126 386 Z'
  },
  {
    id: 'abdomen',
    label: 'Abdomen',
    d: 'M124 300 C140 308 160 311 180 311 C200 311 220 308 236 300 C235 330 234 358 232 386 C214 394 196 397 180 397 C164 397 146 394 128 386 C126 358 125 330 124 300 Z'
  },
  {
    id: 'poitrine',
    label: 'Poitrine',
    d: 'M96 158 C118 140 148 132 180 132 C212 132 242 140 264 158 C262 176 256 190 246 196 C244 232 240 268 236 300 C220 308 200 311 180 311 C160 311 140 308 124 300 C120 268 116 232 114 196 C104 190 98 176 96 158 Z'
  },
  // Cou (avec trapèzes)
  {
    id: 'cou',
    label: 'Cou',
    d: 'M162 100 C165 112 167 120 165 128 C152 134 134 139 118 148 L118 160 C138 152 160 149 180 149 C200 149 222 152 242 160 L242 148 C226 139 208 134 195 128 C193 120 195 112 198 100 C192 105 187 107 180 107 C173 107 168 105 162 100 Z'
  },
  // Tête
  {
    id: 'tete',
    label: 'Tête',
    d: 'M180 18 C203 18 217 34 217 57 C217 76 209 92 197 101 C191 106 186 109 180 109 C174 109 169 106 163 101 C151 92 143 76 143 57 C143 34 157 18 180 18 Z'
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
   Analyse : calcule les hypothèses classées par COMPATIBILITÉ
   avec les symptômes signalés (et la carte anatomique).

   Améliorations :
   • Pondération par SPÉCIFICITÉ : un symptôme rare (morsure,
     perte du goût…) est bien plus révélateur qu'un symptôme
     commun (fièvre présente dans 15 profils).
   • Normalisation RELATIVE : la maladie la plus compatible
     sert de référence (~94 %), les autres sont proportionnées —
     les pourcentages se lisent comme un classement clair.
   ============================================================ */

// Nombre de maladies utilisant chaque symptôme (pour la spécificité)
const SYMPTOM_FREQ = {};
DISEASE_RULES.forEach((r) => r.symptoms.forEach((s) => {
  SYMPTOM_FREQ[s] = (SYMPTOM_FREQ[s] || 0) + 1;
}));
// Plus un symptôme est rare, plus il est spécifique (poids élevé)
const specificityOf = (s) => 1 / Math.sqrt(SYMPTOM_FREQ[s] || 1);

function runAnalysis(selectedIds, selectedZoneIds) {
  const set = new Set(selectedIds);
  const zones = new Set(selectedZoneIds || []);
  const totalReported = set.size;

  // --- 1er passage : score brut pondéré de chaque candidat ---
  const raws = DISEASE_RULES
    .map((rule) => {
      const matchedIds = rule.symptoms.filter((s) => set.has(s));
      if (matchedIds.length === 0) return null;

      const total = rule.symptoms.length;

      // Couverture PONDÉRÉE du profil type : les symptômes spécifiques
      // comptent plus que les symptômes génériques
      let matchedWeight = 0;
      let maxWeight = 0;
      rule.symptoms.forEach((s) => {
        const w = specificityOf(s);
        maxWeight += w;
        if (set.has(s)) matchedWeight += w;
      });
      const coverageW = maxWeight > 0 ? matchedWeight / maxWeight : 0;

      // Compatibilité anatomique calculée sur les symptômes réellement
      // signalés : un symptôme général convient toujours, un symptôme
      // localisé ne valide que si sa zone est sélectionnée sur la carte.
      let zoneCoverage = 0.5;
      if (zones.size > 0) {
        const scores = matchedIds.map((s) => {
          const loc = SYMPTOM_ZONES[s];
          if (!loc || loc.length === 0) return 0.5;
          return loc.some((z) => zones.has(z)) ? 1 : 0;
        });
        zoneCoverage = scores.reduce((a, b) => a + b, 0) / matchedIds.length;
      }

      // Symptôme « signature » : le plus spécifique présent est un fort indice
      const signature = Math.max(...matchedIds.map(specificityOf));

      // Richesse du signalement : plus la description est complète, plus c'est fiable
      const richness = Math.min(1, totalReported / 4);

      const raw =
        coverageW * 60 +           // cœur : ressemblance au profil type
        signature * 14 +           // indice fort : symptôme très révélateur présent
        zoneCoverage * 16 +        // cohérence avec la carte anatomique
        richness * 6 +             // description assez complète
        (matchedIds.length >= 3 ? 4 : 0);

      return {
        disease: rule.disease,
        urgency: rule.urgency,
        matched: matchedIds.length,
        total,
        matchedIds,
        zoneCoverage: Math.round(zoneCoverage * 100),
        raw
      };
    })
    .filter(Boolean);

  if (raws.length === 0) return [];

  // --- 2e passage : normalisation RELATIVE des pourcentages ---
  const topRaw = Math.max(...raws.map((r) => r.raw));
  return raws
    .sort((a, b) => b.raw - a.raw)
    .map((r) => {
      let p = topRaw > 0 ? (r.raw / topRaw) * 94 : 10;
      // Planchers honnêtes selon la force de correspondance
      const floor = r.matched >= 3 ? 24 : r.matched === 2 ? 15 : 8;
      p = Math.max(floor, Math.min(96, p));
      return {
        disease: r.disease,
        urgency: r.urgency,
        matched: r.matched,
        total: r.total,
        matchedIds: r.matchedIds,
        zoneCoverage: r.zoneCoverage,
        probability: Math.round(p)
      };
    });
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
    // Statistique d'usage réelle : une consultation RÉELLE de plus
    // (compteur + historique) pour le tableau de bord
    const symptomNames = selectedSymptoms.map(symptomLabel).filter(Boolean).join(', ');
    recordConsultation(
      'Analyse des symptômes',
      symptomNames
        ? `Analyse lancée depuis le Symptom Checker — symptômes : ${symptomNames}`
        : 'Analyse lancée depuis le Symptom Checker'
    );
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
            <svg viewBox="0 0 360 760" className="body-svg">
              <defs>
                <linearGradient id="gzSkin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffe3d0" />
                  <stop offset="45%" stopColor="#ffcdb2" />
                  <stop offset="100%" stopColor="#f0ac91" />
                </linearGradient>
                <linearGradient id="gzSkinDark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d9a68c" />
                  <stop offset="50%" stopColor="#c98b74" />
                  <stop offset="100%" stopColor="#b06f58" />
                </linearGradient>
              </defs>

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
                    <path className="zone-skin" d={z.d} />
                    <path className="zone-tint" d={z.d} />
                    <title>{z.label}</title>
                  </g>
                );
              })}

              {/* Détails anatomiques décoratifs (non cliquables) */}
              <g className="body-detail" aria-hidden="true">
                {/* Oreilles */}
                <ellipse className="detail-skin" cx="141" cy="61" rx="6" ry="10" />
                <ellipse className="detail-skin" cx="219" cy="61" rx="6" ry="10" />
                {/* Cheveux */}
                <path className="detail-hair" d="M143 52 C145 30 160 19 180 19 C200 19 215 30 217 52 C205 41 190 37 180 37 C170 37 155 41 143 52 Z" />
                {/* Traits du visage */}
                <g className="detail-lines">
                  <path d="M164 58 C168 54 174 54 177 57" />
                  <path d="M183 57 C186 54 192 54 196 58" />
                  <path d="M170 88 C175 92 185 92 190 88" />
                </g>
                {/* Clavicules, sternum, pectoraux, nombril */}
                <g className="detail-lines">
                  <path d="M138 170 C158 179 202 179 222 170" />
                  <path d="M180 186 L180 252" />
                  <path d="M136 240 C158 254 202 254 224 240" />
                  <circle cx="180" cy="360" r="3" />
                </g>
                {/* Rotules et coudes */}
                <g className="detail-lines">
                  <path d="M206 600 C213 593 227 593 234 600" />
                  <path d="M126 600 C133 593 147 593 154 600" />
                  <path d="M262 318 C268 314 276 314 282 318" />
                  <path d="M78 318 C84 314 92 314 98 318" />
                </g>
              </g>
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
                    <span className="prob-label">Compatibilité avec vos symptômes</span>

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

