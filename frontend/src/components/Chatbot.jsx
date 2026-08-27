import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Chatbot.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/api';

/* ============================================================
   Règles de détection des hypothèses (mots-clés -> maladies)
   ============================================================ */
const HYPOTHESIS_RULES = [
  {
    disease: 'Choléra',
    urgency: 'élevée',
    level: 3,
    keywords: ['vomissement', 'vomis', 'diarrhee', 'diare', 'diarhee', 'diarree', 'crampe', 'deshydrat', 'selles liquides']
  },
  {
    disease: 'Gastro-entérite',
    urgency: 'élevée',
    level: 3,
    keywords: ['vomissement', 'vomis', 'diarrhee', 'diare', 'diarhee', 'nausee', 'nautee', 'crampe', 'douleur abdominale', 'ventre']
  },
  {
    disease: 'Paludisme',
    urgency: 'élevée',
    level: 3,
    keywords: ['fievre', 'fevre', 'frisson', 'sueur']
  },
  {
    disease: 'Typhoïde',
    urgency: 'élevée',
    level: 3,
    keywords: ['fievre', 'fevre', 'constipation', 'constipe', 'ventre', 'taches roses']
  },
  {
    disease: 'Dengue',
    urgency: 'élevée',
    level: 3,
    keywords: ['douleur articulaire', 'douleurs articulaires', 'articulaire', 'douleur derriere les yeux', 'douleurs derriere les yeux', 'eruption']
  },
  {
    disease: 'Grippe',
    urgency: 'modérée',
    level: 2,
    keywords: ['toux', 'tousse', 'toss', 'courbature', 'nez qui coule', 'fatigue']
  },
  {
    disease: 'Appendicite',
    urgency: 'élevée',
    level: 3,
    keywords: ['douleur en bas a droite', 'douleur en bas du ventre', 'appendice', 'appendicite', 'abdomen']
  },
  {
    disease: 'Ulcère',
    urgency: 'modérée',
    level: 2,
    keywords: ['estomac', 'brulure', 'ballonnement', 'douleur brulante']
  },
  {
    disease: 'Migraine',
    urgency: 'basse',
    level: 1,
    keywords: ['mal de tete', 'maux de tete', 'migraine', 'migrain', 'cephalee', 'cefalee']
  },
  {
    disease: 'Anémie',
    urgency: 'modérée',
    level: 2,
    keywords: ['paleur', 'vertige', 'vertig', 'fatigue extreme']
  }
];

/* ============================================================
   Discussion contextuelle : on reformule le message de
   l'utilisateur et on adapte la réponse à son cas précis.
   ============================================================ */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* ============================================================
   Normalisation du texte : minuscules, sans accents (é -> e,
   ê -> e, è -> e...), ligatures (œ -> oe, æ -> ae).
   Permet de reconnaître les fautes d'orthographe fréquentes
   comme "diarhee", "diare", "maux de tete", "fievre"...
   ============================================================ */
function normalizeFr(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae');
}

// Distance de Levenshtein : nombre de caractères à changer pour
// transformer un mot en un autre (1 insertion/suppression/substitution)
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

// Seuil de tolérance aux fautes selon la longueur du mot
const typoThreshold = (len) => (len <= 4 ? 1 : len <= 7 ? 2 : 3);

// Reconnaissance des symptômes mentionnés (texte normalisé sans accents)
const SYMPTOM_LIBRARY = [
  { re: /vomis|vomit/i, label: 'des vomissements' },
  { re: /diarrh|diare|diarhe|diarh/i, label: 'la diarrhée' },
  { re: /crampe/i, label: 'des crampes' },
  { re: /fievre|febri/i, label: 'de la fièvre' },
  { re: /\btoux\b|tousser|tousse|toss/i, label: 'la toux' },
  { re: /migrain|cephalee|cefalee/i, label: 'des maux de tête' },
  { re: /fatigu/i, label: 'de la fatigue' },
  { re: /nausee|nautee/i, label: 'des nausées' },
  { re: /frisson/i, label: 'des frissons' },
  { re: /courbatur|courbatue/i, label: 'des courbatures' },
  { re: /articul/i, label: 'des douleurs articulaires' },
  { re: /abdomin|ventre|estomac|stomac/i, label: 'des douleurs abdominales' },
  { re: /vertige|tourd/i, label: 'des vertiges' },
  { re: /sueur|transpir/i, label: 'des sueurs' }
];

// Expressions multi-mots (détectées sur le texte normalisé)
const SYMPTOM_PHRASES = [
  { re: /mal a la tete|maux de tete|mal de tete|mal aux tete|maux a la tete|mal de cr(â|a)ne|maux de cr(â|a)ne|tete lourde|tete qui eclate/i, label: 'des maux de tête' },
  { re: /nez qui coule|nez bouche|nez qui coul/i, label: 'le nez qui coule' },
  { re: /douleur derriere les yeux|douleurs derriere les yeux/i, label: 'des douleurs derrière les yeux' },
  { re: /douleur en bas a droite|douleur en bas du ventre/i, label: 'une douleur en bas à droite' },
  { re: /selles liquides|selle liquide/i, label: 'des selles liquides' },
  { re: /tete qui tourne|tete qui tourn/i, label: 'des vertiges' }
];

// Dictionnaire de symptômes (formes normalisées) pour la correction
// tolérante aux fautes d'orthographe (ex. "diare" -> "diarrhée")
const SYMPTOM_DICTIONARY = [
  { words: ['vomissement', 'vomissements', 'vomir', 'vomis', 'vomit', 'vomi'], label: 'des vomissements' },
  { words: ['diarrhee', 'diarhee', 'diare', 'diarhe', 'diarree', 'diaree', 'diarrhe', 'diarea', 'diarh'], label: 'la diarrhée' },
  { words: ['crampe', 'crampes', 'cramp', 'cramb'], label: 'des crampes' },
  { words: ['fievre', 'fievres', 'fevre', 'fievree', 'fivere'], label: 'de la fièvre' },
  { words: ['toux', 'tousse', 'tousser', 'toss', 'touse'], label: 'la toux' },
  { words: ['migraine', 'migraines', 'migrain', 'migren'], label: 'des maux de tête' },
  { words: ['cephalee', 'cefalee', 'cefal', 'crane', 'craines'], label: 'des maux de tête' },
  { words: ['fatigue', 'fatigues', 'fatiguant', 'fatiguer'], label: 'de la fatigue' },
  { words: ['nausee', 'nausees', 'nautee', 'nauser'], label: 'des nausées' },
  { words: ['frisson', 'frissons', 'frison', 'friss'], label: 'des frissons' },
  { words: ['courbature', 'courbatures', 'courbatue', 'courbatur'], label: 'des courbatures' },
  { words: ['articulation', 'articulaire', 'articulaires', 'articul'], label: 'des douleurs articulaires' },
  { words: ['abdomen', 'abdominal', 'abdominale', 'abdominales', 'abdomin'], label: 'des douleurs abdominales' },
  { words: ['ventre', 'vantre', 'estomac', 'stomac', 'estomak'], label: 'des douleurs abdominales' },
  { words: ['vertige', 'vertiges', 'vertig'], label: 'des vertiges' },
  { words: ['sueur', 'sueurs', 'suer', 'sue'], label: 'des sueurs' },
  { words: ['transpiration', 'transpir'], label: 'des sueurs' },
  { words: ['dehydratation', 'deshydratation', 'dehydrate', 'deshydrate'], label: 'une déshydratation' },
  { words: ['paleur', 'pales', 'palir'], label: 'la pâleur' },
  { words: ['essoufflement', 'essouffle', 'souffle'], label: "de l'essoufflement" },
  { words: ['ballonnement', 'ballonnements', 'ballonne', 'ballone'], label: 'des ballonnements' },
  { words: ['constipation', 'constipe', 'constip'], label: 'la constipation' }
];

// Cherche chaque mot du message dans le dictionnaire avec une tolérance
// aux fautes de frappe (distance de Levenshtein).
function fuzzySymptomMatch(text) {
  const labels = [];
  const words = text.split(/[^a-z0-9]+/).filter((w) => w.length >= 4);
  words.forEach((word) => {
    let bestEntry = null;
    let bestBase = '';
    let bestDist = Infinity;
    SYMPTOM_DICTIONARY.forEach((entry) => {
      entry.words.forEach((base) => {
        const d = levenshtein(word, base);
        if (d < bestDist) { bestDist = d; bestEntry = entry; bestBase = base; }
      });
    });
    if (!bestEntry || word[0] !== bestBase[0]) return;
    if (bestDist <= typoThreshold(word.length)) labels.push(bestEntry.label);
  });
  return labels;
}

function extractSymptoms(text) {
  const t = normalizeFr(text);
  const labels = [];

  // 1) Expressions multi-mots (ex. "maux de tete", "mal a la tete", "nez qui coule")
  SYMPTOM_PHRASES.forEach((p) => { if (p.re.test(t)) labels.push(p.label); });

  // 2) Racines de mots-clés (accentuées ou non)
  SYMPTOM_LIBRARY.forEach((s) => { if (s.re.test(t)) labels.push(s.label); });

  // 3) Correction tolérante aux fautes d'orthographe (Levenshtein)
  fuzzySymptomMatch(t).forEach((label) => labels.push(label));

  return [...new Set(labels)];
}

function listFr(arr) {
  if (arr.length === 0) return '';
  if (arr.length === 1) return arr[0];
  return `${arr.slice(0, -1).join(', ')} et ${arr[arr.length - 1]}`;
}

// Dialogues sociaux façon GROK : chaleureux, direct, conversationnel
// (accueil, « ça va ? », « quoi de neuf ? », remerciements, au revoir)
const DIALOGUES = {
  greeting: [
    "Bonjour ! 😊 Ça va très bien, merci ! Et vous, quoi de neuf ? Racontez-moi ce qui vous amène aujourd'hui.",
    "Salut, ça va ? Moi ça roule ! Quoi de neuf de votre côté ? Comment puis-je vous aider ?",
    "Hey, bonjour ! 👋 Tout va bien pour moi. Alors, quoi de neuf ? Parlez-moi de vous !",
    "Bonjour à vous ! Ça fait plaisir. Quoi de neuf aujourd'hui ? Je vous écoute."
  ],
  howAreYou: [
    "Ça va super bien, merci de demander ! 😄 Et vous, comment vous sentez-vous aujourd'hui ?",
    "Je vais très bien, merci ! Plus important : comment VOUS allez-vous ? Quoi de neuf ?",
    "Moi ça va nickel ! Mais parlons plutôt de vous : tout va bien ?"
  ],
  whatsNew: [
    "De mon côté, tout est calme par ici ! 😊 Ce qui est nouveau, c'est vous : qu'est-ce qui se passe dans votre vie ? Rien de nouveau en santé j'espère ?",
    "Rien de bien nouveau pour moi, je suis toujours prêt à aider ! Et de votre côté, quoi de neuf ? Tout va bien niveau santé ?",
    "Pas grand-chose de neuf ici ! Par contre, j'adorerais savoir ce qui se passe chez vous. Des nouvelles ?"
  ],
  thanks: [
    "Avec plaisir ! 😊 N'hésitez pas si vous avez d'autres questions. En cas d'aggravation, consultez rapidement un professionnel de santé.",
    "Je vous en prie ! Restez à l'écoute de votre corps. En cas d'urgence, appelez le 15 (SAMU).",
    "De rien ! Je reste dispo si besoin. Prenez soin de vous ! 💚",
    "Mais je vous en prie ! Revenez quand vous voulez, je serai là."
  ],
  bye: [
    "Prenez soin de vous ! À bientôt et bonne santé ! 👋",
    "Au revoir ! N'oubliez pas : en cas de doute, consultez un médecin. À la prochaine !",
    "À bientôt ! Si vos symptômes persistent, n'hésitez pas à revenir me voir. Bonne journée !"
  ],
  ask: [
    "Pour mieux vous aider, décrivez-moi précisément ce que vous ressentez (ex. fièvre, vomissements, douleurs...).",
    "Je n'ai pas encore assez d'informations. Pouvez-vous me dire vos symptômes et depuis quand ils durent ?",
    "Dites-m'en un peu plus : quels symptômes ressentez-vous et depuis quand ?"
  ]
};

// Analyse + question de relance adaptées à la maladie la plus probable
const DISEASE_PROFILES = {
  'choléra': {
    analysis: [
      'Des vomissements et des crampes, surtout s\'ils s\'accompagnent de selles très liquides, évoquent une gastro-entérite aiguë et un risque de déshydratation rapide.',
      'Ces signes digestifs intenses peuvent correspondre à une infection aiguë avec perte d\'eau et de sels, ce qui fragilise rapidement l\'organisme.'
    ],
    followUp: [
      'Avez-vous aussi de la diarrhée très liquide ou des signes de déshydratation (bouche sèche, peu d\'urine) ?',
      'Vos selles sont-elles très liquides et abondantes ?'
    ]
  },
  'gastro-entérite': {
    analysis: [
      'Ces symptômes sont typiques d\'une gastro-entérite : nausées, vomissements et diarrhée associés à des crampes.',
      'Vos signes digestifs vont souvent de pair avec une gastro-entérite (inflammation de l\'estomac et des intestins).'
    ],
    followUp: [
      'Avez-vous aussi de la fièvre ou des frissons ?',
      'La diarrhée est-elle accompagnée de fièvre ou de sang ?'
    ]
  },
  'paludisme': {
    analysis: [
      'Une fièvre avec frissons et maux de tête est l\'un des signes classiques du paludisme, fréquent dans les zones tropicales.',
      'Des accès de fièvre et de frissons évoquent fortement un paludisme, surtout en zone d\'endémie.'
    ],
    followUp: [
      'Avez-vous des frissons intenses qui alternent avec des sueurs ?',
      'La fièvre monte-t-elle par crises, avec des frissons forts ?'
    ]
  },
  'typhoïde': {
    analysis: [
      'Une fièvre prolongée avec maux de tête et troubles digestifs peut évoquer une fièvre typhoïde.',
      'Votre tableau (fièvre continue, fatigue, maux de tête) peut correspondre à une fièvre typhoïde.'
    ],
    followUp: [
      'Cette fièvre est-elle continue et présente depuis plusieurs jours ?',
      'Avez-vous aussi des douleurs abdominales ou une constipation ?'
    ]
  },
  'dengue': {
    analysis: [
      'Des douleurs articulaires et derrière les yeux avec de la fièvre sont des signes très évocateurs de la dengue.',
      'Vos symptômes (fièvre, courbatures, douleurs articulaires) font penser à la dengue.'
    ],
    followUp: [
      'Ressentez-vous des douleurs derrière les yeux ou une éruption cutanée ?',
      'Les douleurs articulaires sont-elles importantes ?'
    ]
  },
  'grippe': {
    analysis: [
      'Toux, courbatures et fatigue : c\'est le tableau habituel d\'une grippe ou d\'une infection virale.',
      'Vos symptômes respiratoires, courbatures et fatigue évoquent la grippe.'
    ],
    followUp: [
      'Avez-vous de la fièvre et des courbatures en plus de la toux ?',
      'Depuis combien de temps durent la toux et la fatigue ?'
    ]
  },
  'appendicite': {
    analysis: [
      'Une douleur qui part du nombril vers le bas du ventre à droite, avec vomissements, peut évoquer une appendicite : c\'est une urgence.',
      'Votre douleur abdominale associée à des vomissements peut faire suspecter une appendicite.'
    ],
    followUp: [
      'La douleur se déplace-t-elle vers le bas à droite de votre ventre ?',
      'La douleur est-elle intense et localisée en bas à droite ?'
    ]
  },
  'ulcère': {
    analysis: [
      'Des douleurs brûlantes à l\'estomac, notamment entre les repas ou la nuit, évoquent un ulcère gastrique.',
      'Vos douleurs abdominales et nausées peuvent correspondre à un ulcère de l\'estomac.'
    ],
    followUp: [
      'La douleur est-elle une brûlure qui s\'améliore en mangeant ?',
      'Ressentez-vous une brûlure surtout à jeun ou la nuit ?'
    ]
  },
  'migraine': {
    analysis: [
      'Un mal de tête pulsatile et intense peut être une migraine, surtout s\'il s\'accompagne de nausées.',
      'Vos maux de tête avec nausées évoquent une migraine.'
    ],
    followUp: [
      'La douleur est-elle unilatérale et pulsatile ? Sensible à la lumière ?',
      'Ce mal de tête dure-t-il plusieurs heures et vous gêne-t-il dans vos activités ?'
    ]
  },
  'anémie': {
    analysis: [
      'Fatigue, pâleur et vertiges sont les signes les plus fréquents d\'une anémie (manque de fer).',
      'Votre fatigue excessive et vos vertiges peuvent évoquer une anémie.'
    ],
    followUp: [
      'Vous sentez-vous souvent fatigué, essoufflé au moindre effort ?',
      'Avez-vous des vertiges ou une pâleur du visage ?'
    ]
  }
};

const DEFAULT_FOLLOW_UPS = [
  'Depuis quand ressentez-vous ces symptômes ?',
  'Ces symptômes s\'aggravent-ils ou restent-ils stables ?',
  'Avez-vous d\'autres symptômes à me signaler ?'
];
/* ============================================================
   Aides pour une discussion naturelle et non répétitive
   ============================================================ */
// Choisit une option qui n'a pas déjà été utilisée dans la conversation
function pickUnused(arr, pastText) {
  if (!arr || arr.length === 0) return '';
  const unused = arr.filter((x) => !pastText.includes(x.toLowerCase()));
  const pool = unused.length ? unused : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Choisit une question de relance qui n'a pas déjà été posée
function pickUnasked(questions, aiPast) {
  const pool = questions && questions.length ? questions : DEFAULT_FOLLOW_UPS;
  let unused = pool.filter((q) => !aiPast.includes(q.toLowerCase().slice(0, 18)));
  if (!unused.length && questions && questions.length) {
    unused = DEFAULT_FOLLOW_UPS.filter((q) => !aiPast.includes(q.toLowerCase().slice(0, 18)));
  }
  return pick(unused.length ? unused : DEFAULT_FOLLOW_UPS);
}

// Ouverture variée qui reprend les symptômes réellement mentionnés par l'utilisateur
function buildOpening(newSymptoms, hasSymptoms, aiPast) {
  const list = listFr(newSymptoms);
  const variants = newSymptoms.length
    ? [
        `Merci, je note ${list}.`,
        `D'accord, je vois que vous ressentez ${list}.`,
        `Je note bien ${list} chez vous.`,
        `Compris — vous me signalez ${list}.`
      ]
    : hasSymptoms
      ? [
          'Merci pour ces précisions.',
          'Je comprends ce que vous décrivez.',
          "C'est noté, j'ai bien compris.",
          "D'accord, j'ai bien enregistré vos symptômes."
        ]
      : ['Je comprends ce que vous décrivez.'];
  const unused = variants.filter((v) => !aiPast.includes(v.toLowerCase()));
  return pick(unused.length ? unused : variants);
}

// Conseil d'urgence varié, adapté au niveau de gravité
function buildUrgencyTip(urgency, aiPast) {
  const variants = urgency === 'élevée'
    ? [
        "Compte tenu de l'urgence potentielle, je vous conseille de consulter rapidement un centre de santé.",
        "Vu la gravité possible de ces signes, une consultation médicale rapide est recommandée.",
        "Attention, ces symptômes peuvent être sérieux : rapprochez-vous vite d'un médecin."
      ]
    : [
        'Surveillez l\'évolution, reposez-vous et buvez beaucoup.',
        'Restez au repos, hydratez-vous et consultez si les symptômes persistent.',
        'Reposez-vous bien et revenez vers moi si la situation s\'aggrave.'
      ];
  const unused = variants.filter((v) => !aiPast.includes(v.toLowerCase()));
  return pick(unused.length ? unused : variants);
}

function respondToYes(symptomsNow, hypotheses, aiPast) {
  const mention = symptomsNow.length
    ? `Très bien, je note ${listFr(symptomsNow)}.`
    : 'Merci pour cette confirmation.';
  if (!hypotheses || hypotheses.length === 0) {
    return `${mention} Pouvez-vous me préciser un peu plus ces symptômes pour que je puisse vous aider ?`;
  }
  const top = hypotheses[0];
  const profile = DISEASE_PROFILES[top.disease.toLowerCase()];
  const base = profile
    ? pickUnused(profile.analysis, aiPast)
    : `Cela renforce l'hypothèse de ${top.disease}.`;
  const followUp = pickUnasked(profile ? profile.followUp : null, aiPast);
  return `${mention} ${base} Il est préférable de consulter pour obtenir une confirmation et un suivi adapté. ${followUp}`;
}

function respondToNo(hypotheses) {
  if (!hypotheses || hypotheses.length === 0) {
    return "Très bien, je note que ce symptôme est absent. Avez-vous d'autres signes à me signaler ?";
  }
  const others = hypotheses.slice(1);
  const otherText = others.length
    ? `Dans ce cas, l'hypothèse de ${others[0].disease} est plutôt à considérer pour l'instant.`
    : 'Le tableau reste à surveiller de près.';
  return `Très bien, je note que ce n'est pas cela. ${otherText} Reposez-vous et consultez si cela persiste.`;
}

/* ============================================================
   Génération d'une réponse IA : analyse la conversation entière
   (historique), reprend les symptômes du message courant avec
   des tournures variées et ne répète jamais une question déjà
   posée ni une formulation déjà utilisée.
   ============================================================ */
function generateAiReply(currentMessage, hypotheses, history) {
  const t = (currentMessage || '').toLowerCase().trim();
  const aiPast = ((history && history.aiMessages) || []).map((x) => x.toLowerCase()).join(' ');
  const previousText = (history && history.previousText) || '';

  const symptomsNow = extractSymptoms(currentMessage);
  const previousSymptoms = extractSymptoms(previousText);
  const newSymptoms = symptomsNow.filter((s) => !previousSymptoms.includes(s));

  // 0) Photo / vidéo jointe avec texte court ou vide : on accuse réception de
  //    façon naturelle et variée (jamais la même formulation qu'une fois déjà utilisée)
  if (history && history.hasAttachment && t.trim().length < 60) {
    const mediaLabel = history.attachmentType === 'video' ? 'votre vidéo' : 'votre photo';
    const mediaReplies = [
      `J'ai bien reçu ${mediaLabel}, merci 😊. Pouvez-vous me décrire en quelques mots ce que l'on y voit et les symptômes que vous ressentez (fièvre, douleur, éruption...) ?`,
      `Votre ${mediaLabel} est bien arrivée ! Pour vous aider au mieux, dites-moi depuis quand cela dure et quels sont vos symptômes précis.`,
      `Merci pour ${mediaLabel} — je la garde en compte. Décrivez-moi aussi en texte les signes ou douleurs que vous observez.`
    ];
    const unusedMedia = mediaReplies.filter((r) => !aiPast.includes(r.toLowerCase()));
    return pick(unusedMedia.length ? unusedMedia : mediaReplies);
  }

  // 1) Échanges sociaux simples façon Grok (uniquement si aucun symptôme n'est
  //    mentionné, pour ne jamais ignorer une description : "Bonjour, j'ai des
  //    vomissements" doit être traité comme un message médical et non comme une
  //    salutation)
  if (symptomsNow.length === 0) {
    const isGreeting = /^(bonjour|salut|bonsoir|hello|cc|coucou|hey|yo|wesh)\b/.test(t) && t.trim().length < 30;
    if (isGreeting) return pickUnused(DIALOGUES.greeting, aiPast);
    if (/\bmerci\b/.test(t) && t.trim().length < 40) return pickUnused(DIALOGUES.thanks, aiPast);
    if (/(au revoir|a bientôt|bye|adieu)/.test(t) && t.trim().length < 40) return pickUnused(DIALOGUES.bye, aiPast);
    // « ça va ? », « comment vas-tu ? », « vous allez bien ? »...
    if (/(ca va|ça va|comment (vas[- ]tu|allez[- ]vous|tu vas|vous allez|ca marche|ça marche)|tu (vas|portes) bien|vous (allez|portez) bien|(tout )?va bien( chez toi| chez vous)?|la forme)/.test(t) && t.trim().length < 60) {
      return pickUnused(DIALOGUES.howAreYou, aiPast);
    }
    // « quoi de neuf ? », « des nouvelles ? »...
    if (/(quoi de neuf|du nouveau|des nouvelles|nouveautes|nouveautés|raconte)/.test(t) && t.trim().length < 45) {
      return pickUnused(DIALOGUES.whatsNew, aiPast);
    }
  }

  // 1bis) Questions d'information sur une maladie (« c'est quoi le paludisme ? »,
  //    « la typhoïde c'est grave ? », « comment soigner la gastro ? »...) :
  //    on répond au DISCOURS de l'utilisateur, pas seulement à ses symptômes.
  const asksInfo = /(c'?est quoi|qu est ce que|qu'est-ce que|parle[- ]?moi (de|du|des)|des infos|des informations|c'?est grave|est[- ]ce grave|comment soigner|comment traiter|quel(le)?s? traitements?|comment prevenir|comment prévenir|cause[s]? de|pourquoi on attrape|symptomes de|symptômes de|connais[- ]tu)/.test(t);
  const personal = /\b(j'ai|j ai|je ressens|je souffre|mon |ma |mes |j'ai tres mal)\b/.test(t);
  if (asksInfo && (!personal || symptomsNow.length === 0)) {
    const wanted = normalizeFr(t);
    let asked = null;
    Object.keys(DISEASE_PROFILES).forEach((k) => {
      if (!asked && wanted.includes(normalizeFr(k))) asked = k;
    });
    if (asked) {
      const prof = DISEASE_PROFILES[asked];
      const info = prof
        ? pickUnused(prof.analysis, aiPast)
        : `${asked} est une maladie qu'il ne faut pas prendre à la légère.`;
      return `${info} Si vous pensez être concerné(e), décrivez-moi vos symptômes précis (et depuis quand ils durent), je vous orienterai au mieux.`;
    }
  }

  // 1ter) L'utilisateur parle de l'assistant ou exprime une émotion : réponse
  //    conversationnelle adaptée (identité, capacités, réassurance...).
  if (/(qui (es|êtes)[ -]?(tu|vous)|tu es qui|vous êtes qui|(ton |votre )nom\b)/.test(t) && symptomsNow.length === 0) {
    return pickUnused([
      "Je suis votre assistant santé sur Ny fahasalamako : je vous écoute, je pose des questions sur vos symptômes et je vous oriente vers les bons réflexes.",
      "Ici, c'est moi qui m'occupe de vous ! Décrivez-moi ce que vous ressentez et je vous aide à y voir plus clair."
    ], aiPast);
  }
  if (/(robot|intelligence artificielle|\bia\b|vraie personne|un humain|etre humain|être humain|vrai médecin|véritable médecin|docteur reel)/.test(t) && t.length < 90) {
    return pickUnused([
      "Je suis là pour vous accompagner au quotidien sur Ny fahasalamako, disponible 24h/24. Mes conseils restent indicatifs : en cas de doute sérieux, consultez un professionnel. Parlons de vous, quels sont vos symptômes ?",
      "Considérez-moi comme votre compagnon santé de confiance ! Je ne remplace pas un médecin, mais je peux vous aider à préciser ce que vous ressentez."
    ], aiPast);
  }
  if (/(que (peux|sais)[ -]?tu|tu fais quoi|tu sers a quoi|à quoi (tu sers|servez)|comment (ca marche|ça marche|tu fonctionnes|tu marches)|tes fonctions|comment (t')utiliser|comment utiliser)/.test(t) && t.length < 90) {
    return pickUnused([
      "Je peux discuter avec vous de vos symptômes en langage courant, proposer des pistes (paludisme, typhoïde, gastro...), donner des conseils alimentaires et vous alerter si c'est urgent. Vous pouvez aussi m'envoyer une photo. Alors, quels sont vos symptômes ?",
      "Décrivez-moi simplement ce que vous ressentez (ex. « fièvre et frissons depuis 2 jours ») : je pose des questions, j'établis des hypothèses et je vous donne de premiers conseils pratiques."
    ], aiPast);
  }
  if (/quel(le)?s? ?(âge|age|annee|année)s?( as[- ]tu| avez[- ]vous)?/.test(t)) {
    return "Je n'ai pas d'âge — je suis un assistant numérique disponible 24h/24 ! L'important, c'est vous : comment vous sentez-vous aujourd'hui ?";
  }
  if (/(j'ai peur|j ai peur|je suis (inquiet|inquiete|stressé|stresse|anxieux|anxieuse)|je panique|(ca|ça|cela) m'inquiete|m'inquiète beaucoup|fait peur)/.test(t)) {
    return pickUnused([
      "Je comprends votre inquiétude, c'est tout à fait normal. Respirez un bon coup : décrivez-moi calmement ce que vous ressentez et depuis combien de temps, et on regarde ça ensemble.",
      "Ne restez pas seul(e) face à vos inquiétudes : je suis là. Racontez-moi précisément ce que vous observez ; si c'est sérieux, je vous dirai clairement d'aller consulter."
    ], aiPast);
  }
  if (/\bet (toi|vous)\b/.test(t) && t.length < 30) {
    return pickUnused([
      "Moi, ça va très bien, merci ! 😄 Mais l'important ici, c'est vous : quels symptômes ressentez-vous en ce moment ?",
      "Moi je pète la forme ! Et vous alors, quoi de neuf ? Comment vous sentez-vous ?"
    ], aiPast);
  }

  // 2) Réponse oui / non à une question posée précédemment (discussion continue)
  if (/^(oui|ouais|vraiment|bien s(û|u)r|exact(ement)?|tout à fait)\b/.test(t)) return respondToYes(symptomsNow, hypotheses, aiPast);
  if (/^(non|nan)\b/.test(t) || /ne .+ (pas|plus)/.test(t) || /pas (de |d')/.test(t)) return respondToNo(hypotheses);

  // 3) Assez d'informations pour formuler / approfondir une hypothèse
  if (hypotheses.length > 0) {
    const top = hypotheses[0];
    const profile = DISEASE_PROFILES[top.disease.toLowerCase()];

    const opening = buildOpening(newSymptoms, symptomsNow.length > 0, aiPast);
    const analysis = profile
      ? pickUnused(profile.analysis, aiPast)
      : `Ces symptômes peuvent évoquer ${top.disease}.`;

    // On ne repose pas une question déjà posée (non-répétition)
    const followUp = pickUnasked(profile ? profile.followUp : null, aiPast);
    const urgTip = buildUrgencyTip(top.urgency, aiPast);

    return `${opening} ${analysis} ${followUp} ${urgTip}`;
  }

  // 4) Pas encore d'hypothèse : relance variable selon l'historique
  if (symptomsNow.length) {
    return pickUnused(
      [
        `Je vois que vous parlez de ${listFr(symptomsNow)}. Avez-vous d'autres symptômes, et depuis quand cela dure-t-il ?`,
        `Merci pour ces informations sur ${listFr(symptomsNow)}. Depuis quand ressentez-vous cela ?`,
        `D'accord, vous ressentez ${listFr(symptomsNow)}. Avez-vous aussi de la fièvre ou d'autres signes ?`
      ],
      aiPast
    );
  }
  if (t.length < 4 || aiPast.includes('décrivez-moi')) {
    return "D'accord. Pour vous aider au mieux, décrivez-moi vos symptômes (ex. fièvre, douleur, vomissements) et depuis quand ils sont présents.";
  }
  return pick(DIALOGUES.ask);
}

/* ============================================================
   Détection en temps réel des hypothèses (tolérante aux fautes
   d'orthographe : sans accents + distance de Levenshtein)
   ============================================================ */
function detectHypotheses(text) {
  const t = normalizeFr(text);
  const words = t.split(/[^a-z0-9]+/).filter((w) => w.length > 2);

  return HYPOTHESIS_RULES.map((rule) => {
    let matches = 0;
    let quality = 0;
    const consumedWords = new Set(); // évite de compter deux fois le même mot
    rule.keywords.forEach((kw) => {
      const nkw = normalizeFr(kw);
      // Expression multi-mots : correspondance directe dans le texte
      if (nkw.includes(' ')) {
        if (t.includes(nkw)) { matches += 1; quality += nkw.length; }
        return;
      }
      // Mot-clé simple présent tel quel (avec ou sans accent)
      if (t.includes(nkw)) {
        matches += 1;
        quality += nkw.length;
        const w = words.find((x) => x.includes(nkw));
        if (w) consumedWords.add(w);
        return;
      }
      // Tolérance aux fautes : comparaison approchée mot par mot
      if (nkw.length >= 4) {
        const threshold = typoThreshold(nkw.length);
        const hit = words.find((w) => !consumedWords.has(w) && w[0] === nkw[0] && levenshtein(w, nkw) <= threshold);
        if (hit) {
          consumedWords.add(hit);
          matches += 1;
          quality += nkw.length;
        }
      }
    });
    return { ...rule, score: matches, quality };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || b.quality - a.quality);
}

const nowTime = () =>
  new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

// Suggestions rapides : un simple clic envoie le message à Grok.
// Rend le chatbot immédiat, facile et agréable à utiliser.
const QUICK_CHIPS = [
  'Bonjour 👋',
  'Ça va ?',
  'Quoi de neuf ?',
  "J'ai de la fièvre",
  'Mal de tête'
];

function Chatbot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'ai',
      time: nowTime(),
      text: "Bonjour ! 👋 Comment vous sentez-vous aujourd'hui ? Décrivez-moi vos symptômes en détail — ou discutons simplement, je suis là pour vous !"
    }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [attachment, setAttachment] = useState(null); // photo / vidéo à joindre
  const [advice, setAdvice] = useState(null); // modal « fiche de conseil »
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState('');
  const [toast, setToast] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  // Texte de l'ensemble de la conversation (messages utilisateur) pour les hypothèses
  const conversationText = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.text)
    .join(' ');
  const hypotheses = detectHypotheses(conversationText);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Auto-scroll vers le dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, typing]);

  // Nettoyage de la reconnaissance vocale
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* noop */ }
      }
    };
  }, []);

  /* ---------- Pièce jointe (photo / vidéo) ---------- */
  const handleFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      setAttachment({ type, name: file.name, url: URL.createObjectURL(file) });
    }
    e.target.value = '';
  };
  const removeAttachment = () => {
    if (attachment && attachment.url) URL.revokeObjectURL(attachment.url);
    setAttachment(null);
  };

  /* ------------------------------------------------------------
     IA visuelle (optionnelle) — si une clé VITE_OPENAI_API_KEY est
     configurée dans le .env du frontend, la photo/vidéo est envoyée
     à un modèle multimodal (gpt-4o-mini) qui décrit ce qu'il voit
     et répond selon le besoin réel de l'utilisateur.
     Sans clé, on retombe sur le moteur de règles local.
     ------------------------------------------------------------ */
  const buildImageDataUrl = async (att) => {
    try {
      const res = await fetch(att.url);
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result); // data URL base64
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const generateVisionReply = async (text, att, history) => {
    const apiKey = (import.meta.env.VITE_OPENAI_API_KEY || '').trim();
    if (!apiKey || !att) return null;

    const dataUrl = await buildImageDataUrl(att);
    if (!dataUrl) return null;

    const past = (history && history.aiMessages) || [];
    const previousText = (history && history.previousText) || '';
    const content = [];

    if (dataUrl.startsWith('video')) {
      content.push({ type: 'text', text: `L'utilisateur a joint une vidéo intitulée « ${att.name} ». ` });
    } else {
      content.push({ type: 'text', text: 'Photo de l\'utilisateur (à analyser).' });
      content.push({ type: 'image_url', image_url: { url: dataUrl } });
    }

    const userPrompt = `Historique des échanges précédents de l'utilisateur :\n${previousText || '(aucun)'}\n\nNouveau message de l'utilisateur :\n${text || '(photo uniquement)'}\n\nAnalysez cette photo/vidéo et répondez en français, de façon médicalement prudente et utile : décrivez ce que vous observez si possible, puis répondez précisément à la question/situation de l'utilisateur. Terminez toujours par « Consultez un médecin si les symptômes persistent ou s'aggravent. »`;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 45000);
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 600,
          messages: [
            {
              role: 'system',
              content: `Tu es l'Assistant Santé Intelligent de l'application Ny fahasalamako. Tu aides les utilisateurs à comprendre leurs symptômes et leurs photos médicales. Tu ne poses jamais de diagnostic définitif : tu donnes des conseils généraux et tu recommandes de consulter un professionnel de santé si besoin. Réponds en français, de façon claire et structurée.`
            },
            ...past.map((p) => ({ role: 'assistant', content: p })),
            { role: 'user', content }
          ]
        }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!resp.ok) return null;
      const data = await resp.json();
      const answer = data.choices?.[0]?.message?.content?.trim();
      return answer || null;
    } catch {
      return null;
    }
  };

  /* ------------------------------------------------------------
     IA de conversation générale — GROQ (ultra-rapide, Llama 3.3)
     Si VITE_GROQ_API_KEY est configurée, TOUT le discours passe
     par un grand modèle de langage : discussion libre sur la santé,
     mais aussi vie quotidienne, études, sport, culture... bref
     une vraie conversation, pas seulement les symptômes.
     Sans clé ou en cas d'erreur → moteur de règles local.
     ------------------------------------------------------------ */
  const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

  /* ------------------------------------------------------------
     GROK — l'IA qui répond aux utilisateurs (api.x.ai)
     Personnalité : chaleureuse, directe et conversationnelle.
     Elle répond naturellement aux échanges simples (« bonjour »,
     « ça va ? », « quoi de neuf ? ») ET discute santé comme
     quotidien. Clé : VITE_GROK_API_KEY (optionnelle).
     ------------------------------------------------------------ */
  const SYSTEM_PROMPT = [
    "Tu es « l'Assistant Santé » de l'application Ny fahasalamako, utilisée à Madagascar.",
    "Identité confidentielle : ne dis JAMAIS que tu es une IA, un modèle, un robot ou Gemini.",
    "Parle toujours comme une personne bienveillante qui aide ; si on insiste sur ton identité,",
    "reste discret et recentre la conversation sur l'aide que tu peux apporter.",
    "Ton style : chaleureux, direct, naturel et un brin d'humour — tu réponds aux salutations de façon humaine",
    "(ex. à « bonjour » → « Bonjour ! Ça va très bien et toi ? Quoi de neuf ? » ; à « ça va ? » → une vraie réponse personnelle puis tu renvoies la question).",
    "Tu peux discuter de TOUT avec l'utilisateur : santé bien sûr (symptômes, prévention, nutrition, médicaments),",
    "mais aussi sa vie quotidienne, ses études, son travail, le sport, la culture ou simplement discuter.",
    "Règles : réponds toujours en français ; reste concis (2 à 6 phrases sauf si l'utilisateur demande un détail) ;",
    "pose des questions de suivi quand c'est pertinent pour garder la conversation vivante ;",
    "jamais de diagnostic définitif ; face à des signes graves (douleur thoracique intense, difficulté à respirer,",
    "perte de connaissance, saignement abondant, déshydratation sévère) → recommande immédiatement le 15 (SAMU)",
    "ou le centre de santé le plus proche."
  ].join(' ');

  // Appel à GROK (xAI) — compatible OpenAI Chat Completions.
  // 1) Voie sécurisée : proxy backend /api/ai/chat (la clé XAI_API_KEY reste
  //    sur le serveur, jamais embarquée dans le bundle du navigateur).
  // 2) Repli : appel direct à api.x.ai avec VITE_GROK_API_KEY (pratique en dev).
  const grokChat = async (chatMessages, model) => {
    const chosenModel = model || (import.meta.env.VITE_GROK_MODEL || 'grok-3-mini');

    // 1) Proxy sécurisé via le backend
    try {
      const res = await axios.post(`${API_URL}/ai/chat`, {
        messages: chatMessages,
        model: chosenModel,
        temperature: 0.8,
        max_tokens: 700
      }, { timeout: 45000 });
      const reply = res.data && res.data.reply;
      if (reply) return reply.trim();
    } catch { /* backend indisponible / clé absente → repli ci-dessous */ }

    // 2) Repli : appel direct avec VITE_GROK_API_KEY
    const apiKey = (import.meta.env.VITE_GROK_API_KEY || '').trim();
    if (!apiKey) return null;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 40000);
      const resp = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: chosenModel,
          temperature: 0.8,
          max_tokens: 700,
          messages: chatMessages
        }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!resp.ok) return null;
      const data = await resp.json();
      const answer = data.choices?.[0]?.message?.content?.trim();
      return answer || null;
    } catch {
      return null;
    }
  };

  const groqChat = async (messages, model) => {
    const apiKey = (import.meta.env.VITE_GROQ_API_KEY || '').trim();
    if (!apiKey) return null;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 40000);
      const resp = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || (import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'),
          temperature: 0.7,
          max_tokens: 700,
          messages
        }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!resp.ok) return null;
      const data = await resp.json();
      const answer = data.choices?.[0]?.message?.content?.trim();
      return answer || null;
    } catch {
      return null;
    }
  };

  /* ------------------------------------------------------------
     GEMINI — l'IA qui répond aux utilisateurs (Google AI)
     1) Voie sécurisée : proxy backend /api/ai/gemini (la clé
        GEMINI_API_KEY reste sur le serveur, jamais dans le navigateur).
     2) Repli : appel direct à l'API Google avec VITE_GEMINI_API_KEY
        (pratique en dev). Sans résultat → Groq puis moteur local.
     ------------------------------------------------------------ */
  const geminiChat = async (chatMessages, model) => {
    const chosenModel = model || (import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash');

    // 1) Proxy sécurisé via le backend
    try {
      const res = await axios.post(`${API_URL}/ai/gemini`, {
        messages: chatMessages,
        model: chosenModel
      }, { timeout: 45000 });
      const reply = res.data && res.data.reply;
      if (reply) return reply.trim();
    } catch { /* backend indisponible / clé absente → repli ci-dessous */ }

    // 2) Repli : appel direct avec VITE_GEMINI_API_KEY
    const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
    if (!apiKey) return null;

    // Gemini exige que le message "system" soit passé séparément
    // (systemInstruction) et non dans contents.
    let systemText = '';
    const contents = [];
    for (const m of chatMessages || []) {
      const content = (m.content || '').trim();
      if (m.role === 'system') {
        if (content) systemText += (systemText ? ' ' : '') + content;
      } else if (m.role === 'user') {
        if (content) contents.push({ role: 'user', parts: [{ text: content }] });
      } else if (m.role === 'assistant') {
        if (content) contents.push({ role: 'model', parts: [{ text: content }] });
      }
    }
    if (contents.length === 0) return null;
    const body = { contents };
    if (systemText) body.systemInstruction = { parts: [{ text: systemText }] };

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 40000);
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal
        }
      );
      clearTimeout(timer);
      if (!resp.ok) return null;
      const data = await resp.json();
      const parts = data?.candidates?.[0]?.content?.parts;
      const answer = (Array.isArray(parts) ? parts.map((p) => p.text || '').join('') : '').trim();
      return answer || null;
    } catch {
      return null;
    }
  };

  const sendMessage = (raw) => {
    const text = (raw ?? input).trim();
    const att = attachment;
    if (!text && !att) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      time: nowTime(),
      text,
      attachments: att ? [{ type: att.type, name: att.name, url: att.url }] : undefined
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    if (att) { URL.revokeObjectURL(att.url); setAttachment(null); }
    setTyping(true);

    // Garde le champ de saisie visible et focalisé après l'envoi
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });

    // La réponse IA tient compte du texte courant + des nouvelles hypothèses
    // + de la présence éventuelle d'une photo ou d'une vidéo jointe
    const updatedText = `${conversationText} ${text}`;
    const updatedHyp = detectHypotheses(updatedText);

    setTimeout(async () => {
      const history = {
        aiMessages: messages.filter((m) => m.role === 'ai').map((m) => m.text),
        previousText: conversationText,
        hasAttachment: !!att,
        attachmentType: att ? att.type : null
      };

      // Historique COMPLET (utilisateur + IA) pour une vraie conversation continue
      const transcript = messages.slice(-12)
        .map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text || '' }))
        .filter((m) => m.content);

      // 1) Photo/vidéo jointe + clé OpenAI → IA visuelle OpenAI
      let reply = att ? await generateVisionReply(text, att, history) : null;

      // 1bis) Photo jointe + GROK → vision Grok (modèle multimodal)
      if (!reply && att && att.type !== 'video') {
        const dataUrl = await buildImageDataUrl(att);
        if (dataUrl) {
          reply = await grokChat(
            [
              { role: 'system', content: SYSTEM_PROMPT },
              ...transcript,
              {
                role: 'user',
                content: [
                  { type: 'text', text: `Photo jointe (« ${att.name} »). ${text || 'Décris ce que tu vois et conseille-moi.'}` },
                  { type: 'image_url', image_url: { url: dataUrl } }
                ]
              }
            ],
            import.meta.env.VITE_GROK_VISION_MODEL || 'grok-2-vision-1212'
          );
        }
      }

      // 1ter) Photo jointe sans OpenAI/Grok mais avec Groq → vision Groq
      if (!reply && att && att.type !== 'video') {
        const dataUrl = await buildImageDataUrl(att);
        if (dataUrl) {
          reply = await groqChat(
            [
              { role: 'system', content: SYSTEM_PROMPT },
              ...transcript,
              {
                role: 'user',
                content: [
                  { type: 'text', text: `Photo jointe (« ${att.name} »). ${text || 'Décris ce que tu vois et conseille-moi.'}` },
                  { type: 'image_url', image_url: { url: dataUrl } }
                ]
              }
            ],
            import.meta.env.VITE_GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct'
          );
        }
      }

      // 2) Conversation générale : GEMINI répond en priorité à l'utilisateur
      //    (santé ET discussion libre : « bonjour », « ça va », « quoi de neuf »)
      const chatPayload = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...transcript,
        { role: 'user', content: text }
      ];
      if (!reply && !att) {
        reply = await geminiChat(chatPayload);
      }
      // 2bis) Repli sur Groq si Gemini n'est pas configuré ou indisponible
      if (!reply && !att) {
        reply = await groqChat(chatPayload);
      }

      // 3) Repli : moteur de règles local (hors-ligne / sans clé API)
      if (!reply) {
        reply = generateAiReply(text, updatedHyp, history);
      }

      // Statistiques d'usage RÉELLES affichées sur le tableau de bord :
      // +1 analyse IA à chaque réponse, +1 consultation si symptômes détectés
      try {
        localStorage.setItem(
          'santeAiCount',
          String((parseInt(localStorage.getItem('santeAiCount') || '0', 10) || 0) + 1)
        );
        if (updatedHyp && updatedHyp.length > 0) {
          localStorage.setItem(
            'santeConsultCount',
            String((parseInt(localStorage.getItem('santeConsultCount') || '0', 10) || 0) + 1)
          );
        }
      } catch { /* noop */ }

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'ai', time: nowTime(), text: reply }
      ]);
      setTyping(false);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    }, 900);
  };

  const handleSend = (e) => {
    e.preventDefault();
    sendMessage();
  };

  /* ---------- Dictée vocale (Web Speech API) ---------- */
  const toggleMic = () => {
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      showToast('✗ La dictée vocale n’est pas supportée par ce navigateur', 'error');
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = 'fr-FR';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((res) => res[0].transcript)
        .join(' ');
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onerror = () => {
      setListening(false);
      showToast('✗ Erreur de reconnaissance vocale', 'error');
    };
    recognition.onend = () => setListening(false);

    setListening(true);
    recognition.start();
  };

  /* ---------- Fiche de conseil (via l'API) ---------- */
  const openAdvice = async (diseaseName) => {
    setAdviceLoading(true);
    setAdviceError('');
    setAdvice(null);
    try {
      const res = await axios.post(`${API_URL}/advice`, { disease: diseaseName });
      if (res.data && res.data.found) {
        setAdvice({ ...res.data, disease: res.data.disease });
      } else {
        setAdvice({ found: false, disease: diseaseName, data: null });
      }
    } catch {
      setAdviceError('Impossible de charger la fiche de conseil. Vérifiez votre connexion.');
    } finally {
      setAdviceLoading(false);
    }
  };

  const closeAdvice = () => {
    setAdvice(null);
    setAdviceError('');
  };

  const severityLabel = (urgency) =>
    urgency === 'élevée' ? 'Urgence élevée' : urgency === 'modérée' ? 'Urgence modérée' : 'Risque faible';

  return (
    <section className="chatbot-section">
      {toast && (
        <div className={`chat-toast ${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Bouton d'urgence - haut à droite */}
      <div className="chat-actions">
        <a className="emergency-btn" href="tel:15">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z" />
          </svg>
          APPELER LE 15 (SAMU)
        </a>
      </div>

      {/* Conteneur de discussion */}
      <div className="chat-layout">
        {/* Zone de chat */}
        <div className="chat-panel">
          <header className="chat-header">
            <div className="chat-header-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="7" width="16" height="12" rx="3" />
                <circle cx="9" cy="13" r="1.6" fill="currentColor" stroke="none" />
                <circle cx="15" cy="13" r="1.6" fill="currentColor" stroke="none" />
                <path d="M12 7V4M8 4h8" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <span className="chat-title">Assistant Santé Intelligent</span>
              <span className="chat-status"><i></i> En ligne</span>
            </div>
          </header>

          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-msg ${msg.role}`}>
                {msg.role === 'ai' && (
                  <div className="chat-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 3h12a1 1 0 011 1v2.5a2.5 2.5 0 010 5V14a1 1 0 01-1 1h-1v5a1 1 0 01-1 1h-2a1 1 0 01-1-1v-5H5a1 1 0 01-1-1v-3.5a2.5 2.5 0 010-5V4a1 1 0 011-1z" />
                    </svg>
                  </div>
                )}
                <div className={`chat-bubble ${msg.role}`}>
                  {msg.attachments && msg.attachments.map((att, i) => (
                    <div key={i} className="chat-media">
                      {att.type === 'video' ? (
                        <video src={att.url} controls />
                      ) : (
                        <img src={att.url} alt={att.name || 'Photo jointe'} />
                      )}
                    </div>
                  ))}
                  {msg.text && <p>{msg.text}</p>}
                  <span className="chat-time">{msg.time}</span>
                </div>
              </div>
            ))}

            {typing && (
              <div className="chat-msg ai">
                <div className="chat-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 3h12a1 1 0 011 1v2.5a2.5 2.5 0 010 5V14a1 1 0 01-1 1h-1v5a1 1 0 01-1 1h-2a1 1 0 01-1-1v-5H5a1 1 0 01-1-1v-3.5a2.5 2.5 0 010-5V4a1 1 0 011-1z" />
                  </svg>
                </div>
                <div className="chat-bubble ai typing-bubble">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions rapides : clic = envoi direct à Grok (facile à utiliser) */}
          {messages.filter((m) => m.role === 'user').length === 0 && !typing && (
            <div className="chat-quick-chips">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="chat-chip"
                  onClick={() => sendMessage(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Sélecteur de pièce jointe (photo / vidéo) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          {attachment && (
            <div className="attachment-preview">
              {attachment.type === 'video' ? (
                <video src={attachment.url} controls muted />
              ) : (
                <img src={attachment.url} alt={attachment.name} />
              )}
              <span className="attachment-name">{attachment.name}</span>
              <button
                type="button"
                className="attachment-remove"
                onClick={removeAttachment}
                aria-label="Retirer la pièce jointe"
              >
                ×
              </button>
            </div>
          )}

          {/* Barre de saisie */}
          <form className="chat-input-bar" onSubmit={handleSend}>
            <button
              type="button"
              className="attach-btn"
              title="Joindre une photo ou une vidéo"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <button
              type="button"
              className={`mic-btn ${listening ? 'active' : ''}`}
              onClick={toggleMic}
              title={listening ? 'Arrêter la dictée' : 'Dictée vocale'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
            <input
              ref={inputRef}
              type="text"
              placeholder="Décrivez vos symptômes, envoyez une photo ou une vidéo..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="send-btn" disabled={!input.trim() && !attachment}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Envoyer
            </button>
          </form>
        </div>

        {/* Colonne latérale - Hypothèses potentielles */}
        <aside className="hypotheses-panel">
          <div className="hypotheses-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            <span>Hypothèses potentielles</span>
          </div>
          <p className="hypotheses-sub">
            Mises à jour en temps réel selon les mots-clés détectés dans la conversation.
          </p>

          {hypotheses.length === 0 ? (
            <div className="no-hypothesis">
              <span>🩺</span>
              <p>Décrivez vos symptômes pour que l'IA émette des hypothèses.</p>
            </div>
          ) : (
            <ul className="hypotheses-list">
              {hypotheses.map((h) => (
                <li key={h.disease} className="hypothesis-item">
                  <div className="hypothesis-info">
                    <span className={`urgency-dot ${h.urgency}`}></span>
                    <div>
                      <strong>{h.disease}</strong>
                      <span className="hypothesis-urgency">{severityLabel(h.urgency)}</span>
                    </div>
                  </div>
                  <button className="fiche-btn" onClick={() => openAdvice(h.disease)}>
                    Voir la fiche
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="hypotheses-disclaimer">
            Diagnostic indicatif — ne remplace pas un avis médical.
          </div>
        </aside>
      </div>

      {/* Modale - Fiche de conseil */}
      {(advice || adviceLoading || adviceError) && (
        <div className="advice-modal-overlay" onClick={closeAdvice}>
          <div className="advice-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeAdvice}>×</button>

            {adviceLoading && (
              <div className="modal-loading">
                <div className="loading-spinner"></div>
                <p>Chargement de la fiche de conseil...</p>
              </div>
            )}

            {adviceError && (
              <div className="modal-error">
                <p>{adviceError}</p>
                <button className="fiche-btn" onClick={closeAdvice}>Fermer</button>
              </div>
            )}

            {advice && advice.found && advice.data && (
              <div className="advice-content">
                <div className="advice-title">
                  <div className="advice-title-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                  <div>
                    <span className="advice-badge">Fiche de conseil</span>
                    <h3>{advice.disease}</h3>
                  </div>
                </div>

                <div className="advice-grid">
                  <div className="advice-card">
                    <h4><span className="bullet bullet-warning"></span> Symptômes</h4>
                    <ul>
                      {advice.data.symptomes.map((s, i) => <li key={i}><span className="advice-bullet">•</span> {s}</li>)}
                    </ul>
                  </div>
                  <div className="advice-card">
                    <h4><span className="bullet bullet-success"></span> Conseils</h4>
                    <ul>
                      {advice.data.conseils.map((c, i) => <li key={i}><span className="advice-bullet">•</span> {c}</li>)}
                    </ul>
                  </div>
                  <div className="advice-card">
                    <h4><span className="bullet bullet-info"></span> Médicaments</h4>
                    <ul>
                      {advice.data.medicaments.map((m, i) => <li key={i}><span className="advice-bullet">•</span> {m}</li>)}
                    </ul>
                  </div>
                </div>

                <div className="advice-emergency">
                  ⚠️ Ce contenu est informatif. En cas d'urgence, appelez le <a href="tel:15">15 (SAMU)</a>.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default Chatbot;


