/* ============================================================
   Fiches détaillées des maladies : symptômes, médicaments,
   aliments à éviter, aliments à manger.
   Utilisées par SymptomChecker (analyse + suggestions rapides).
   ============================================================ */

export const DISEASE_INFO = {
  'Choléra': {
    symptoms: ['Vomissements', 'Diarrhée aqueuse abondante', 'Crampes abdominales', 'Déshydratation rapide'],
    medications: ['Sels de réhydratation orale (SRO)', 'Zinc (10 jours)', 'Antibiotiques sur prescription'],
    foodsToAvoid: ['Aliments gras et frits', 'Produits laitiers non pasteurisés', 'Crudités non lavées', 'Fruits non pelés'],
    foodsToEat: ['Solution de réhydratation (SRO)', 'Riz bien cuit', 'Banane mûre', 'Bouillon léger salé', 'Purée de carottes']
  },
  'Gastro-entérite': {
    symptoms: ['Vomissements', 'Diarrhée', 'Nausées', 'Crampes abdominales', 'Fièvre modérée'],
    medications: ['Sels de réhydratation orale (SRO)', 'Zinc', 'Paracétamol si fièvre (sur conseil)', 'Probiotiques'],
    foodsToAvoid: ['Produits laitiers', 'Aliments épicés et gras', 'Crudités', 'Jus de fruits acides'],
    foodsToEat: ['Riz et pâtes bien cuits', 'Banane', 'Pommes cuites', 'Poulet grillé sans peau', 'Bouillon de légumes']
  },
  'Paludisme': {
    symptoms: ['Fièvre élevée', 'Frissons', 'Sueurs', 'Maux de tête', 'Courbatures'],
    medications: ['Antipaludéens (combinaisons artémisinine - ACT)', 'Paracétamol contre la fièvre', 'Repos'],
    foodsToAvoid: ['Alcool', 'Aliments trop gras', 'Caféine en excès'],
    foodsToEat: ['Eau en abondance', 'Bouillons nourrissants', 'Fruits riches en vitamine C', 'Riz', 'Légumes cuits']
  },
  'Typhoïde': {
    symptoms: ['Fièvre prolongée', 'Maux de tête', 'Douleurs abdominales', 'Constipation ou diarrhée', 'Fatigue'],
    medications: ['Antibiotiques prescrits par un médecin', 'Paracétamol contre la fièvre', 'Hydratation régulière'],
    foodsToAvoid: ['Aliments crus', 'Produits laitiers non pasteurisés', 'Fruits de mer', 'Aliments épicés'],
    foodsToEat: ['Aliments bien cuits et digestes', 'Riz', 'Soupes légères', 'Bananes', 'Eau potable traitée']
  },
  'Grippe': {
    symptoms: ['Fièvre', 'Toux sèche', 'Courbatures', 'Fatigue', 'Frissons'],
    medications: ['Paracétamol (fièvre et douleurs)', 'Repos', 'Hydratation abondante', 'Vitamine C'],
    foodsToAvoid: ['Alcool', 'Aliments très sucrés', 'Fritures', 'Produits laitiers en excès'],
    foodsToEat: ['Soupes chaudes', 'Miel (après 1 an)', 'Agrumes', 'Riz', 'Bouillons']
  },
  'Dengue': {
    symptoms: ['Fièvre brutale', 'Douleurs articulaires', 'Douleurs derrière les yeux', 'Maux de tête', 'Éruption cutanée'],
    medications: ['Paracétamol à faible dose', 'Repos strict', 'Hydratation'],
    foodsToAvoid: ['Ibuprofène et aspirine (risque hémorragique)', 'Aliments gras', 'Alcool'],
    foodsToEat: ['Eau en abondance', 'Jus de fruits', 'Bouillons', 'Papaye', 'Fruits riches en vitamine C']
  },
  'Anémie': {
    symptoms: ['Fatigue', 'Pâleur', 'Vertiges', 'Essoufflement', 'Maux de tête'],
    medications: ['Supplément de fer', 'Vitamine C (aide à l\'absorption)', 'Acide folique', 'Vitamine B12 si carence'],
    foodsToAvoid: ['Thé et café juste après les repas', 'Calcium au même repas que le fer', 'Alcool'],
    foodsToEat: ['Viande rouge maigre', 'Foie', 'Épinards et légumes verts', 'Lentilles', 'Agrumes']
  },
  'Ulcère': {
    symptoms: ['Douleurs abdominales (brûlure)', 'Nausées', 'Ballonnements', 'Vomissements'],
    medications: ['Inhibiteurs de la pompe à protons (IPP)', 'Antiacides', 'Repas fractionnés'],
    foodsToAvoid: ['Aliments épicés', 'Café et alcool', 'Fritures', 'Agrumes à jeun', 'Sodas'],
    foodsToEat: ['Riz et féculents doux', 'Banane', 'Pommes de terre cuites', 'Poulet sans peau', 'Yaourt nature']
  },
  'Migraine': {
    symptoms: ['Maux de tête pulsatile', 'Nausées', 'Sensibilité à la lumière et au bruit'],
    medications: ['Paracétamol ou AINS en début de crise (sur conseil)', 'Triptans sur prescription', 'Repos au calme'],
    foodsToAvoid: ['Chocolat', 'Fromages fermentés', 'Alcool (surtout vin rouge)', 'Excès de caféine', 'Aliments riches en glutamate'],
    foodsToEat: ['Repas réguliers', 'Eau', 'Amandes', 'Poissons gras (oméga-3)', 'Légumes verts']
  },
  'Appendicite': {
    symptoms: ['Douleur en bas à droite du ventre', 'Nausées', 'Vomissements', 'Fièvre'],
    medications: ['Aucun — URGENCE médicale', 'Ne pas prendre d\'antalgique avant l\'avis du médecin'],
    foodsToAvoid: ['Ne rien manger ni boire avant l\'avis médical', 'Laxatifs'],
    foodsToEat: ['Jeûne jusqu\'à l\'avis médical', 'Alimentation douce après traitement']
  },
  'Diabète': {
    symptoms: ['Soif intense', 'Urines fréquentes', 'Fatigue', 'Perte de poids', 'Vision floue'],
    medications: ['Metformine (sur prescription)', 'Hypoglycémiants ou insuline (selon avis médical)', 'Surveillance de la glycémie'],
    foodsToAvoid: ['Sucres rapides (sodas, bonbons)', 'Pain blanc', 'Pâtisseries', 'Jus sucrés'],
    foodsToEat: ['Légumes verts', 'Céréales complètes', 'Poissons', 'Haricots', 'Fruits à index glycémique bas (pomme, poire)']
  },
  'Hypertension': {
    symptoms: ['Maux de tête', 'Vertiges', 'Bouffées de chaleur', 'Fatigue', 'Vision trouble'],
    medications: ['Traitement antihypertenseur (sur prescription)', 'Réduction du sel', 'Activité physique régulière'],
    foodsToAvoid: ['Sel en excès', 'Charcuteries', 'Aliments transformés', 'Alcool', 'Caféine en excès'],
    foodsToEat: ['Légumes et fruits frais', 'Poissons', 'Ail', 'Banane (potassium)', 'Eau']
  },
  'VIH': {
    symptoms: ['Fièvre', 'Fatigue prolongée', 'Ganglions', 'Perte de poids', 'Infections répétées'],
    medications: ['Traitement antirétroviral (TARV) — suivi médical obligatoire', 'Prévention des infections opportunistes'],
    foodsToAvoid: ['Viandes crues', 'Œufs crus', 'Lait non pasteurisé', 'Alcool'],
    foodsToEat: ['Protéines maigres (poulet, poisson)', 'Fruits et légumes cuits', 'Riz complet', 'Eau potable', 'Arachides']
  },
  'COVID-19': {
    symptoms: ['Fièvre', 'Toux sèche', 'Perte du goût ou de l\'odorat', 'Essoufflement', 'Fatigue', 'Maux de gorge'],
    medications: ['Paracétamol contre la fièvre (sur conseil)', 'Repos et hydratation', 'Vitamine C et zinc'],
    foodsToAvoid: ['Aliments frits et gras', 'Boissons glacées', 'Excès de sucre'],
    foodsToEat: ['Eau en abondance', 'Soupes chaudes', 'Agrumes (vitamine C)', 'Miel', 'Bouillons nourrissants']
  },
  'Rage': {
    symptoms: ['Morsure ou griffure d\'animal', 'Fièvre', 'Maux de tête', 'Salivation excessive', 'Soif'],
    medications: ['URGENCE — laver la plaie à l\'eau et au savon', 'Vaccin antirabique immédiat', 'Consulter un centre antirabique'],
    foodsToAvoid: ['Aliments épicés', 'Alcool', 'Caféine en excès'],
    foodsToEat: ['Eau propre', 'Bouillons légers', 'Bananes', 'Riz bien cuit']
  },
  'Tuberculose': {
    symptoms: ['Toux persistante', 'Fièvre', 'Expectorations (crachats)', 'Fatigue', 'Perte de poids'],
    medications: ['Traitement antituberculeux (sur prescription)', 'Antibiotiques sous suivi médical', 'Repos prolongé'],
    foodsToAvoid: ['Alcool', 'Tabac', 'Aliments trop gras'],
    foodsToEat: ['Protéines (œufs, poulet)', 'Légumes verts', 'Riz', 'Eau potable', 'Fruits']
  },
  'Hépatite B': {
    symptoms: ['Fièvre', 'Fatigue', 'Nausées', 'Jaunisse (coloration jaune)', 'Douleurs abdominales'],
    medications: ['Vaccination et traitement sur prescription', 'Repos strict', 'Hydratation'],
    foodsToAvoid: ['Alcool', 'Aliments gras et frits', 'Fruits de mer crus'],
    foodsToEat: ['Eau potable', 'Riz', 'Légumes cuits', 'Poulet grillé', 'Fruits']
  },
  'Méningite': {
    symptoms: ['Fièvre élevée', 'Maux de tête violents', 'Raids', 'Rigidité ou nuque raide', 'Nausées'],
    medications: ['URGENCE médicale immédiate', 'Antibiotiques sous prescription'],
    foodsToAvoid: ['Aucun — consultation urgente', 'Aliments lourds'],
    foodsToEat: ['Repos strict', 'Eau', 'Bouillons légers']
  },
  'Asthme': {
    symptoms: ['Essoufflement', 'Toux', 'Gêne respiratoire', 'Respiration sifflante', 'Fatigue'],
    medications: ['Bronchodilatateurs (sur prescription)', 'Posologie selon avis médical', 'Éviter les déclencheurs (poussière, fumée)'],
    foodsToAvoid: ['Aliments très salés', 'Boissons glacées', 'Aliments transformés riches en sulfites'],
    foodsToEat: ['Poissons gras (oméga-3)', 'Fruits et légumes frais', 'Eau', 'Repos au calme']
  },
  'Bronchite': {
    symptoms: ['Toux grasse', 'Expectorations', 'Douleur thoracique', 'Fièvre', 'Fatigue'],
    medications: ['Antitussifs si besoin (sur conseil)', 'Antibiotiques si infection bactérienne', 'Repos'],
    foodsToAvoid: ['Aliments glacés', 'Boissons glacées', 'Fritures'],
    foodsToEat: ['Soupes chaudes', 'Miel', 'Citron', 'Légumes cuits', 'Riz']
  },
  'Rougeole': {
    symptoms: ['Fièvre', 'Éruption cutanée rouge', 'Toux', 'Écoulement nasal', 'Maux de tête'],
    medications: ['Paracétamol contre la fièvre', 'Repos', 'Hydratation abondante'],
    foodsToAvoid: ['Aliments gras', 'Boissons glacées', 'Fritures'],
    foodsToEat: ['Eau', 'Soupes chaudes', 'Fruits', 'Riz', 'Bouillons']
  },
  'Tétanos': {
    symptoms: ['Blessure piquée ou coupure profonde', 'Mâchoire serrée', 'Raideur musculaire', 'Spasmes', 'Fièvre'],
    medications: ['Vaccin antitétanique immédiat', 'Soin de la plaie', 'Urgence médicale si spasmes'],
    foodsToAvoid: ['Aliments lourds en cas de spasmes', 'Boissons fraîches'],
    foodsToEat: ['Eau', 'Repas légers', 'Bouillons', 'Fruits']
  }
};
