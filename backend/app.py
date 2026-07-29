from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token
import sqlite3
import os
import psycopg2
from urllib.parse import urlparse

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

app.config['JWT_SECRET_KEY'] = 'super-secret-health-app-green-2024'
jwt = JWTManager(app)

# Database configuration - supports both SQLite (dev) and PostgreSQL (prod)
DB_PATH = os.path.join(os.path.dirname(__file__), 'health.db')
DATABASE_URL = os.environ.get('DATABASE_URL')

def get_db_connection():
    """Get database connection - PostgreSQL in production, SQLite in development"""
    if DATABASE_URL:
        # Production: PostgreSQL
        result = urlparse(DATABASE_URL)
        conn = psycopg2.connect(
            database=result.path[1:],
            user=result.username,
            password=result.password,
            host=result.hostname,
            port=result.port
        )
        return conn
    else:
        # Development: SQLite
        conn = sqlite3.connect(DB_PATH)
        return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Create table with appropriate syntax for the database type
    if DATABASE_URL:
        # PostgreSQL syntax
        c.execute('''CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL
        )''')
    else:
        # SQLite syntax
        c.execute('''CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )''')
    
    conn.commit()
    conn.close()

init_db()

# ---------- DISEASE ADVICE DATABASE ----------
disease_advice = {
    "diabète": {
        "symptomes": ["Soif excessive", "Urination fréquente", "Fatigue chronique", "Vision floue", "Perte de poids inexpliquée", "Engourdissement des extrémités"],
        "conseils": [
            "Évitez ABSOLUMENT le sucre raffiné, les sodas et les pâtisseries",
            "Pratiquez une activité physique régulière (marche 30min/jour, natation, vélo)",
            "Mangez du manioc, du riz complet, de l'igname, du mil (glucides complexes)",
            "Consommez des légumes verts (épinards, chou, laitue, gombo) à chaque repas",
            "Mangez des protéines maigres (poisson, poulet sans peau, tofu, œufs)",
            "Buvez beaucoup d'eau (au moins 2L par jour) et des tisanes non sucrées",
            "Surveillez votre glycémie régulièrement avec un glucomètre",
            "Dormez suffisamment (7-8h par nuit) et gérez votre stress",
            "Faites des repas à heures fixes et en petites quantités",
            "Consultez un endocrinologue régulièrement"
        ],
        "medicaments": [
            "Metformine (Glucophage) - médicament de première ligne",
            "Insuline (prescrite selon le type de diabète)",
            "Sulfonylurées (glibenclamide, gliclazide)",
            "Inhibiteurs SGLT2 (dapagliflozine, empagliflozine)",
            "Inhibiteurs DPP-4 (sitagliptine, vildagliptine)",
            "Analogues du GLP-1 (liraglutide, sémaglutide)"
        ],
        "aliments_recommandes": [
            "Manioc, igname, patate douce, mil, sorgho",
            "Légumes verts à feuilles (épinards, chou, laitue)",
            "Poisson grillé, poulet sans peau",
            "Haricots, lentilles, pois d'Angole",
            "Avocat, noix, amandes et graines",
            "Eau, tisanes non sucrées, infusion de gingembre",
            "Ail, oignon, curcuma"
        ],
        "aliments_eviter": [
            "Sucre blanc, miel, sirops, confitures",
            "Sodas, jus industriels et boissons sucrées",
            "Pain blanc, pâtes raffinées, riz blanc",
            "Gâteaux, biscuits, pâtisseries et viennoiseries",
            "Aliments frits et gras saturés",
            "Fruits trop sucrés (mangue, raisin, banane) en excès"
        ]
    },
    "hypertension": {
        "symptomes": ["Maux de tête persistants", "Vertiges", "Vision trouble", "Palpitations cardiaques", "Saignements de nez fréquents", "Bourdonnements d'oreilles", "Fatigue"],
        "conseils": [
            "Réduisez votre consommation de sel (pas plus que 5g/jour)",
            "Pratiquez 30 minutes d'exercice modéré par jour (marche rapide)",
            "Évitez TOTALEMENT l'alcool et le tabac",
            "Gérez votre stress avec la méditation, le yoga ou la respiration profonde",
            "Maintenez un poids santé",
            "Dormez suffisamment (7-8h) et à heures régulières",
            "Limitez la caféine (max 2 tasses de café/jour)",
            "Surveillez votre tension régulièrement avec un tensiomètre",
            "Réduisez le stress au travail et prenez des pauses"
        ],
        "medicaments": [
            "Inhibiteurs ACE (énalapril, lisinopril, ramipril)",
            "Bêta-bloquants (aténolol, métoprolol, bisoprolol)",
            "Diurétiques (hydrochlorothiazide, furosémide)",
            "Bloqueurs des canaux calciques (amlodipine, nifédipine)",
            "Antagonistes des récepteurs de l'angiotensine II (losartan, valsartan)"
        ],
        "aliments_recommandes": [
            "Bananes, avocats, patates douces (riches en potassium)",
            "Légumes verts à feuilles (épinards, chou vert)",
            "Ail et oignon (réduisent naturellement la tension)",
            "Poisson gras (saumon, maquereau, sardines)",
            "Fruits frais (oranges, baies, pastèque)",
            "Avoine, quinoa et céréales complètes",
            "Betterave (riche en nitrates naturels)"
        ],
        "aliments_eviter": [
            "Aliments salés (chips, conserves, sauces industrielles)",
            "Charcuteries et viandes transformées",
            "Aliments transformés et plats préparés",
            "Boissons alcoolisées",
            "Café en excès et boissons énergisantes",
            "Fromages vieux et salés"
        ]
    },
    "paludisme": {
        "symptomes": ["Fièvre élevée (39-40°C)", "Frissons intenses", "Maux de tête violents", "Courbatures", "Nausées et vomissements", "Transpiration abondante", "Anémie"],
        "conseils": [
            "Consultez URGENCE un médecin dès les premiers symptômes",
            "Faites un test de diagnostic rapide (TDR) immédiatement",
            "Reposez-vous au lit absolument",
            "Buvez beaucoup d'eau pour éviter la déshydratation",
            "Utilisez une moustiquaire imprégnée d'insecticide tous les jours",
            "Évitez les piqûres de moustiques (repellent, vêtements longs)",
            "Dormez sous moustiquaire même pendant la journée",
            "Éliminez les eaux stagnantes autour de votre maison"
        ],
        "medicaments": [
            "Artéméther-luméfantrine (Coartem) - traitement standard",
            "Artésunate injectable (pour cas sévères)",
            "Quinine (sous surveillance médicale stricte)",
            "Chloroquine (selon la région et la résistance)",
            "Primaquine (prévention des rechutes)",
            "Paracétamol pour faire baisser la fièvre"
        ],
        "aliments_recommandes": [
            "Bouillon de poule nutritif",
            "Jus de fruits naturels (orange, citron, gingembre)",
            "Purées de légumes (carottes, patates douces)",
            "Eau de coco (riche en électrolytes)",
            "Compléments alimentaires (vitamine C, zinc, fer)",
            "Riz blanc bien cuit"
        ],
        "aliments_eviter": [
            "Aliments gras et lourds",
            "Épices fortes et piment",
            "Alcool (interdit pendant le traitement)",
            "Caféine excessive (thé, café, sodas)",
            "Aliments crus ou mal cuits"
        ]
    },
    "grippe": {
        "symptomes": ["Fièvre élevée (38-40°C)", "Toux sèche puis grasse", "Maux de gorge", "Nez qui coule ou bouché", "Courbatures généralisées", "Fatigue intense", "Maux de tête"],
        "conseils": [
            "Reposez-vous au maximum - votre corps a besoin d'énergie pour guérir",
            "Buvez des liquides chauds (thé, soupe, infusion) très régulièrement",
            "Prenez une douche chaude pour décongestionner les voies respiratoires",
            "Lavez-vous les mains fréquemment avec du savon",
            "Aérez votre chambre au moins 10 min par jour",
            "Évitez les foules et le contact avec les autres",
            "Utilisez un humidificateur ou un bol d'eau chaude dans la chambre",
            "Mangez léger mais nutritif"
        ],
        "medicaments": [
            "Paracétamol (Doliprane, Efferalgan) contre la fièvre et les douleurs",
            "Ibuprofène (Advil) pour les courbatures",
            "Sirop antitussif si toux sèche gênante",
            "Spray ou sérum physiologique pour le nez bouché",
            "Vitamine C, zinc et échinacée pour renforcer l'immunité",
            "Antiviraux (oseltamivir/Tamiflu) sur prescription"
        ],
        "aliments_recommandes": [
            "Soupe de poulet maison",
            "Thé au gingembre et citron avec du miel",
            "Miel (anti-inflammatoire et apaisant pour la gorge)",
            "Jus d'orange frais riche en vitamine C",
            "Compotes de fruits et fruits cuits",
            "Ail cru (antiviral naturel)"
        ],
        "aliments_eviter": [
            "Aliments épicés et pimentés",
            "Produits laitiers (peuvent épaissir le mucus)",
            "Alcool (déshydrate et affaiblit le système immunitaire)",
            "Aliments frits et gras",
            "Sucres raffinés"
        ]
    },
    "cancer": {
        "symptomes": ["Perte de poids inexpliquée", "Fatigue persistante", "Douleurs chroniques", "Masse ou gonflement inhabituel", "Changements cutanés", "Toux persistante", "Saignements anormaux"],
        "conseils": [
            "Consultez un oncologue immédiatement - le diagnostic précoce sauve des vies",
            "Suivez strictement le traitement prescrit (chimiothérapie, radiothérapie, chirurgie)",
            "Adoptez une alimentation RICHE en antioxydants",
            "Restez actif selon vos capacités (marche douce, étirements)",
            "Rejoignez un groupe de soutien pour le moral",
            "Évitez ABSOLUMENT l'alcool et le tabac",
            "Gérez le stress avec la méditation, la prière ou la relaxation",
            "Hydratez-vous bien surtout pendant la chimiothérapie"
        ],
        "medicaments": [
            "Chimiothérapie (adaptée au type et stade du cancer)",
            "Immunothérapie (inhibiteurs de points de contrôle immunitaire)",
            "Thérapie ciblée",
            "Radiothérapie (séances ciblées)",
            "Antidouleurs (morphine, tramadol, patchs)",
            "Antiémétiques contre les nausées",
            "Corticostéroïdes"
        ],
        "aliments_recommandes": [
            "Fruits et légumes colorés (baies, brocoli, carottes, tomates)",
            "Curcuma frais et gingembre",
            "Thé vert (riche en catéchines antioxydantes)",
            "Poisson gras riche en oméga-3",
            "Graines de lin, noix, amandes",
            "Ail et oignon",
            "Champignons (shiitake, pleurote)"
        ],
        "aliments_eviter": [
            "Aliments transformés et industriels",
            "Viande rouge en excès et charcuteries",
            "Alcool (même en petite quantité)",
            "Sucres raffinés",
            "Aliments frits et grillés au charbon",
            "Plats trop salés"
        ]
    },
    "covid-19": {
        "symptomes": ["Fièvre", "Toux sèche persistante", "Fatigue extrême", "Perte de l'odorat et du goût", "Difficultés respiratoires", "Maux de tête", "Courbatures", "Congestion nasale"],
        "conseils": [
            "Isolez-vous IMMÉDIATEMENT dans une pièce séparée",
            "Faites un test antigénique ou PCR COVID-19",
            "Surveillez votre saturation en oxygène avec un oxymètre",
            "Si saturation < 94%, appelez les secours URGENCE",
            "Reposez-vous au lit et hydratez-vous très régulièrement",
            "Portez un masque FFP2 si vous devez sortir",
            "Désinfectez les surfaces (poignées, téléphone, interrupteurs)",
            "Aérez la pièce régulièrement",
            "Consultez un médecin si les symptômes s'aggravent après 5 jours"
        ],
        "medicaments": [
            "Paracétamol (max 3g/jour) pour la fièvre et les douleurs",
            "Anticoagulants à dose préventive",
            "Corticostéroïdes (dexaméthasone) pour les cas graves",
            "Oxygénothérapie si saturation basse",
            "Antiviraux (Paxlovid, remdesivir) sur prescription",
            "Vitamine D"
        ],
        "aliments_recommandes": [
            "Soupe chaude nutritive (poulet, légumes)",
            "Jus de fruits frais naturels (orange, citron, gingembre)",
            "Thé au gingembre, citron et miel",
            "Miel (antibactérien naturel, apaise la toux)",
            "Aliments faciles à digérer",
            "Ail et oignon crus"
        ],
        "aliments_eviter": [
            "Aliments épicés et acides",
            "Alcool (affaiblit le système immunitaire)",
            "Caféine excessive",
            "Aliments très transformés et sucrés",
            "Produits laitiers (épaississent le mucus)"
        ]
    },
    "anémie": {
        "symptomes": ["Fatigue extrême et persistante", "Pâleur de la peau et des muqueuses", "Essoufflement au moindre effort", "Vertiges et maux de tête", "Ongles cassants et concaves", "Palpitations cardiaques", "Extrémités froides"],
        "conseils": [
            "Faites un bilan sanguin complet (NFS, ferritine, vitamine B12)",
            "Consommez des aliments riches en fer (animal et végétal)",
            "Associez la vitamine C (agrumes, tomates) pour mieux absorber le fer",
            "Évitez le thé et le café pendant les repas",
            "Reposez-vous suffisamment",
            "Consultez un médecin pour des suppléments adaptés",
            "Cuisinez dans des casseroles en fonte",
            "Mangez des protéines animales pour le fer héminique"
        ],
        "medicaments": [
            "Sulfate ferreux (Tardyferon, Fero-Grad) - fer oral",
            "Acide folique (vitamine B9) en complément",
            "Vitamine B12 (Méthylcobalamine) - injections si carence sévère",
            "Complexe vitaminique (B6, B9, B12, C)",
            "Érythropoïétine (EPO) - cas sévères",
            "Transfusion sanguine (anémie sévère)"
        ],
        "aliments_recommandes": [
            "Épinards, feuilles de moringa, légumes verts foncés",
            "Viande rouge maigre (bœuf, agneau) avec modération",
            "Foie de volaille ou de bœuf (très riche en fer)",
            "Haricots rouges, lentilles, pois chiches",
            "Fruits secs (abricots secs, raisins secs, dattes)",
            "Agrumes (oranges, citrons) pour la vitamine C",
            "Œufs (jaune d'œuf riche en fer)",
            "Poisson et fruits de mer"
        ],
        "aliments_eviter": [
            "Thé et café pendant ou juste après les repas",
            "Aliments transformés et industriels",
            "Produits laitiers en excès (calcium bloque absorption du fer)",
            "Céréales complètes en excès",
            "Alcool"
        ]
    },
    "asthme": {
        "symptomes": ["Essoufflement soudain", "Sifflements respiratoires (wheezing)", "Oppression thoracique", "Toux nocturne ou matinale", "Difficulté à parler pendant les crises", "Respiration rapide"],
        "conseils": [
            "Utilisez votre inhalateur de secours (Ventoline) dès les premiers signes",
            "Identifiez vos déclencheurs (pollen, poussière, acariens, fumée)",
            "Faites des exercices de respiration (respiration diaphragmatique)",
            "Nettoyez régulièrement votre maison (aspirateur avec filtre HEPA)",
            "Évitez les environnements enfumés",
            "La natation est excellente (air humide bénéfique)",
            "Utilisez des housses anti-acariens",
            "Évitez les changements brusques de température"
        ],
        "medicaments": [
            "Salbutamol (Ventoline) - inhalateur de secours",
            "Corticostéroïdes inhalés (béclométasone, budésonide)",
            "Bêta-agonistes longue durée (salmétérol, formotérol)",
            "Montélukast (Singulair) - pour asthme allergique",
            "Théophylline (pour cas chroniques)",
            "Omalizumab (Xolair) - pour asthme sévère"
        ],
        "aliments_recommandes": [
            "Poisson gras (saumon, maquereau) - oméga-3 anti-inflammatoires",
            "Fruits et légumes riches en vitamine C",
            "Gingembre frais (propriétés bronchodilatatrices)",
            "Ail et oignon (quercétine - antihistaminique naturel)",
            "Curcuma (curcumine anti-inflammatoire)",
            "Miel local (réduit les allergies au pollen)",
            "Pommes et baies"
        ],
        "aliments_eviter": [
            "Aliments transformés et additifs",
            "Sulfites (vin, fruits secs, crevettes)",
            "Produits laitiers si intolérance",
            "Aliments frits et gras",
            "Fruits de mer si allergie",
            "Aliments très froids"
        ]
    },
    "migraine": {
        "symptomes": ["Douleur pulsatile d'un côté de la tête", "Nausées et vomissements", "Sensibilité à la lumière", "Sensibilité au bruit", "Vision floue ou taches (aura)", "Douleur aggravée par l'activité"],
        "conseils": [
            "Reposez-vous dans une pièce calme et sombre",
            "Appliquez une compresse froide sur votre front",
            "Buvez de l'eau pour éviter la déshydratation",
            "Identifiez vos déclencheurs (stress, aliments, manque de sommeil)",
            "Adoptez un horaire de sommeil régulier",
            "Évitez les écrans pendant la crise",
            "Gérez votre stress avec relaxation ou yoga",
            "Massez doucement vos tempes et votre cou",
            "Buvez une tisane de camomille ou de gingembre"
        ],
        "medicaments": [
            "Triptans (sumatriptan, rizatriptan) - spécifiques de la migraine",
            "Anti-inflammatoires (ibuprofène, naproxène) pour crises légères",
            "Paracétamol (si douleur modérée)",
            "Antiémétiques (dompéridone) contre les nausées",
            "Bêta-bloquants (propranolol) en prévention",
            "Amitriptyline (prévention des migraines chroniques)",
            "Topiramate (prévention des migraines fréquentes)"
        ],
        "aliments_recommandes": [
            "Gingembre frais (anti-inflammatoire et anti-nausée)",
            "Amandes et noix (riches en magnésium)",
            "Épinards et légumes verts (magnésium)",
            "Poisson gras (oméga-3 anti-inflammatoire)",
            "Bananes (potassium et magnésium)",
            "Eau en quantité suffisante"
        ],
        "aliments_eviter": [
            "Fromages vieux et fermentés (tyramine)",
            "Chocolat en excès",
            "Vin rouge et alcool",
            "Glutamate monosodique (exhausteur de goût)",
            "Caféine excessive ou manque soudain",
            "Aliments très transformés"
        ]
    },
    "arthrose": {
        "symptomes": ["Douleur articulaire mécanique", "Raideur matinale (< 30 minutes)", "Craquements articulaires", "Perte de flexibilité", "Gonflement articulaire léger", "Difficulté à bouger"],
        "conseils": [
            "Maintenez un poids santé (chaque kg en trop aggrave l'arthrose)",
            "Faites des exercices à faible impact (natation, vélo, marche)",
            "Appliquez du chaud ou du froid sur les articulations",
            "Utilisez des supports (canne, genouillère) si nécessaire",
            "Évitez les mouvements répétitifs",
            "Faites des étirements doux tous les jours",
            "Adoptez une alimentation anti-inflammatoire",
            "Consultez un kinésithérapeute"
        ],
        "medicaments": [
            "Paracétamol (antalgique de première intention)",
            "Anti-inflammatoires (ibuprofène, diclofénac) en cure courte",
            "Crèmes anti-inflammatoires topiques (Voltaren gel)",
            "Glucosamine et chondroïtine (compléments)",
            "Infiltrations de corticoïdes",
            "Acide hyaluronique (visco-supplémentation)",
            "Antalgiques plus forts (tramadol)"
        ],
        "aliments_recommandes": [
            "Poisson gras riche en oméga-3",
            "Curcuma et gingembre (anti-inflammatoires puissants)",
            "Légumes verts à feuilles",
            "Baies (myrtilles, fraises) - antioxydants",
            "Huile d'olive extra vierge",
            "Ail et oignon",
            "Gélatine et bouillon d'os (collagène)"
        ],
        "aliments_eviter": [
            "Sucres raffinés (pro-inflammatoires)",
            "Aliments frits et gras trans",
            "Viande rouge en excès",
            "Produits laitiers en excès",
            "Alcool (favorise l'inflammation)",
            "Sodas et boissons sucrées"
        ]
    },
    "vih": {
        "symptomes": ["Fièvre persistante", "Fatigue chronique", "Perte de poids rapide", "Sueurs nocturnes", "Ganglions enflés", "Diarrhée chronique", "Infections opportunistes"],
        "conseils": [
            "Faites le test de dépistage VIH - c'est gratuit et confidentiel",
            "Consultez un médecin pour débuter un traitement antirétroviral (TARV)",
            "Prenez vos médicaments TOUS LES JOURS sans interruption",
            "Utilisez le préservatif à chaque rapport sexuel",
            "Adoptez une alimentation riche en nutriments pour renforcer l'immunité",
            "Évitez l'alcool et le tabac qui affaiblissent le système immunitaire",
            "Rejoignez un groupe de soutien pour les personnes vivant avec le VIH",
            "Informez votre partenaire pour qu'il/elle se fasse dépister aussi"
        ],
        "medicaments": [
            "TARV (Thérapie Antirétrovirale) - combinaison de 3 médicaments",
            "Ténofovir + Lamivudine + Dolutégravir (TLD) - traitement standard",
            "Abacavir + Lamivudine + Dolutégravir",
            "Efavirenz + Ténofovir + Emtricitabine",
            "Cotrimoxazole (prévention des infections opportunistes)",
            "Traitement des infections opportunistes selon le cas"
        ],
        "aliments_recommandes": [
            "Légumes verts à feuilles (épinards, moringa, feuilles de patate)",
            "Fruits frais riches en vitamines (oranges, papayes, mangues, bananes)",
            "Protéines maigres (poisson, poulet, œufs)",
            "Haricots, lentilles, pois",
            "Ail, gingembre, curcuma (renforcent l'immunité)",
            "Eau propre et bouillie",
            "Avocat, noix et graines"
        ],
        "aliments_eviter": [
            "Alcool (affaiblit le système immunitaire)",
            "Aliments crus ou mal cuits (risque d'infections)",
            "Aliments trop gras et frits",
            "Sucres raffinés et sodas",
            "Aliments de rue non hygiéniques",
            "Eau non traitée"
        ]
    },
    "syphilis": {
        "symptomes": ["Ulcère génital indolore (chancre)", "Éruption cutanée sur le corps", "Ganglions enflés", "Fièvre légère", "Fatigue", "Maux de gorge", "Perte de cheveux par plaques"],
        "conseils": [
            "Consultez un médecin dès les premiers symptômes",
            "Faites un test de dépistage sanguin",
            "Le traitement est simple et efficace si pris à temps",
            "Évitez tout rapport sexuel jusqu'à la guérison complète",
            "Informez votre/vos partenaire(s) pour qu'ils se fassent traiter aussi",
            "Utilisez le préservatif pour prévenir la réinfection",
            "La syphilis non traitée peut causer des lésions graves au cœur et au cerveau",
            "Faites un suivi médical régulier après le traitement"
        ],
        "medicaments": [
            "Pénicilline G benzathine (Extencilline) - injection unique",
            "Doxycycline (pour les allergiques à la pénicilline)",
            "Ceftriaxone (alternative hospitalière)",
            "Paracétamol pour la fièvre",
            "Antihistaminiques si réaction allergique"
        ],
        "aliments_recommandes": [
            "Aliments riches en vitamine C (agrumes, kiwis, poivrons)",
            "Légumes verts pour renforcer l'immunité",
            "Soupe et bouillons nutritifs",
            "Ail, gingembre et miel (antibactériens naturels)",
            "Beaucoup d'eau pour éliminer les toxines"
        ],
        "aliments_eviter": [
            "Alcool (interfère avec le traitement)",
            "Aliments épicés qui irritent les lésions",
            "Caféine excessive",
            "Aliments transformés et sucrés"
        ]
    },
    "hépatite": {
        "symptomes": ["Jaunisse (peau et yeux jaunes)", "Urine foncée", "Fatigue extrême", "Nausées et vomissements", "Douleur abdominale", "Perte d'appétit", "Fièvre"],
        "conseils": [
            "Consultez un médecin pour un bilan sanguin (sérologie hépatite)",
            "Reposez-vous au maximum - le foie a besoin d'énergie pour guérir",
            "Évitez ABSOLUMENT l'alcool pendant la maladie et après",
            "Lavez-vous les mains régulièrement",
            "Ne partagez ni aiguilles, ni brosses à dents, ni rasoirs",
            "Faites-vous vacciner contre l'hépatite A et B",
            "Buvez beaucoup d'eau pour aider le foie à éliminer les toxines",
            "Évitez les médicaments toxiques pour le foie (paracétamol en excès)"
        ],
        "medicaments": [
            "Antiviraux (ténofovir, entécavir) pour hépatite B chronique",
            "Interféron pégylé (hépatite B et C)",
            "Sofosbuvir + velpatasvir (pour hépatite C)",
            "Ribavirine (en combinaison)",
            "Vitamines B et complexes vitaminiques",
            "Hépatoprotecteurs (silymarine, vitamine E)"
        ],
        "aliments_recommandes": [
            "Légumes verts amers (feuilles de moringa, ndolè, bitter leaf)",
            "Citron et agrumes (aident le foie à détoxifier)",
            "Artichaut, curcuma, gingembre",
            "Riz bien cuit et bouillie de mil",
            "Poisson grillé, poulet sans peau",
            "Eau de coco, tisanes de citronnelle",
            "Papaye, ananas et fruits riches en enzymes"
        ],
        "aliments_eviter": [
            "ALCOOL - totalement interdit",
            "Aliments frits et gras",
            "Aliments transformés et conserves",
            "Fruits de mer crus",
            "Médicaments sans avis médical",
            "Aliments épicés"
        ]
    },
    "tuberculose": {
        "symptomes": ["Toux persistante (> 3 semaines)", "Crachats sanglants", "Fièvre vespérale", "Sueurs nocturnes", "Perte de poids", "Douleur thoracique", "Fatigue intense"],
        "conseils": [
            "Faites un test de crachat (BK) immédiatement",
            "Le traitement est GRATUIT dans les centres de santé",
            "Prenez vos médicaments TOUS LES JOURS sans exception",
            "Couvrez votre bouche quand vous toussez (masque ou mouchoir)",
            "Aérez votre chambre régulièrement",
            "Mangez des aliments riches en protéines et vitamines",
            "Reposez-vous - la tuberculose épuise le corps",
            "Le traitement dure 6 mois - ne l'arrêtez PAS avant"
        ],
        "medicaments": [
            "Rifampicine + Isoniazide + Pyrazinamide + Éthambutol (phase intensive 2 mois)",
            "Rifampicine + Isoniazide (phase de continuation 4 mois)",
            "Vitamine B6 pour prévenir les effets secondaires",
            "Paracétamol pour la fièvre"
        ],
        "aliments_recommandes": [
            "Bouillon de poule enrichi (protéines)",
            "Purées de patates douces, carottes",
            "Œufs, poisson, poulet (protéines de qualité)",
            "Bananes mûres, avocats",
            "Jus de fruits frais riches en vitamine C",
            "Moringa, épinards et légumes verts"
        ],
        "aliments_eviter": [
            "Alcool (réduit l'efficacité du traitement)",
            "Tabac (aggrave les lésions pulmonaires)",
            "Aliments frits et gras",
            "Caféine excessive"
        ]
    },
    "choléra": {
        "symptomes": ["Diarrhée aqueuse abondante (eau de riz)", "Vomissements", "Déshydratation rapide", "Soif intense", "Crampes musculaires", "Faiblesse extrême", "Yeux creux"],
        "conseils": [
            "URGENCE - Consultez immédiatement un centre de santé",
            "Buvez du sérum oral (SRO) ou de l'eau sucrée-salée",
            "Continuez à boire même si vous vomissez (petites gorgées fréquentes)",
            "Lavez-vous les mains au savon après chaque toilette",
            "Ne buvez QUE de l'eau bouillie ou traitée (javel 2 gouttes/L)",
            "Lavez les fruits et légumes avec de l'eau javellisée",
            "Désinfectez les latrines avec de l'eau de javel",
            "Couvrez les aliments pour les protéger des mouches"
        ],
        "medicaments": [
            "Sels de réhydratation orale (SRO) - le traitement principal",
            "Perfusion intraveineuse (si déshydratation sévère)",
            "Doxycycline ou Azithromycine (antibiotiques)",
            "Zinc (réduit la durée de la diarrhée)",
            "Probiotiques"
        ],
        "aliments_recommandes": [
            "Bouillon de riz (eau de riz) - excellent contre la diarrhée",
            "Bananes mûres écrasées",
            "Eau de coco (riche en électrolytes)",
            "Soupe de carottes",
            "Bouillie de mil ou de maïs",
            "Yaourt nature (probiotiques)"
        ],
        "aliments_eviter": [
            "Aliments crus et non lavés",
            "Fruits de mer mal cuits",
            "Aliments de rue non hygiéniques",
            "Produits laitiers non pasteurisés",
            "Aliments gras et épicés",
            "Eau non traitée"
        ]
    },
    "dengue": {
        "symptomes": ["Fièvre élevée brutale (40°C)", "Maux de tête intenses (derrière les yeux)", "Douleurs articulaires et musculaires", "Fatigue extrême", "Nausées et vomissements", "Éruption cutanée", "Saignements légers"],
        "conseils": [
            "Consultez un médecin URGENCE si fièvre élevée + douleurs",
            "Reposez-vous au lit strictement",
            "Buvez beaucoup d'eau (au moins 2L/jour)",
            "Surveillez les signes de gravité : saignements, douleur abdominale",
            "Éliminez les eaux stagnantes autour de la maison",
            "Utilisez des moustiquaires même le jour (moustique Aedes pique le jour)",
            "Portez des vêtements longs",
            "Évitez l'ibuprofène et l'aspirine (risque hémorragique)"
        ],
        "medicaments": [
            "Paracétamol (max 3g/jour) pour la fièvre - PAS D'IBUPROFÈNE",
            "Sérum oral pour éviter la déshydratation",
            "Perfusion intraveineuse si nécessaire",
            "Transfusion plaquettaire (cas graves)",
            "Antihistaminiques pour l'éruption cutanée",
            "Vitamine C et zinc pour renforcer l'immunité"
        ],
        "aliments_recommandes": [
            "Eau de coco (riche en électrolytes)",
            "Jus de papaye verte (augmente les plaquettes)",
            "Bouillon de poule nutritif",
            "Purées de légumes (carottes, courgettes)",
            "Compotes de pommes",
            "Thé au gingembre et citron"
        ],
        "aliments_eviter": [
            "Ibuprofène, aspirine et anti-inflammatoires",
            "Aliments épicés et acides",
            "Caféine excessive",
            "Alcool (déshydrate et aggrave les saignements)",
            "Aliments frits et gras"
        ]
    },
    "typhoïde": {
        "symptomes": ["Fièvre progressive en escalier", "Maux de tête persistants", "Douleur abdominale", "Constipation puis diarrhée", "Fatigue intense", "Perte d'appétit", "Taches rosées sur le torse"],
        "conseils": [
            "Consultez un médecin pour une analyse de sang (Widal ou hémoculture)",
            "Buvez BEAUCOUP d'eau pour éviter la déshydratation",
            "Reposez-vous au lit - la typhoïde épuise",
            "Lavez-vous les mains au savon avant chaque repas",
            "Ne buvez QUE de l'eau bouillie ou en bouteille scellée",
            "Évitez les aliments crus et non pelés",
            "Désinfectez les toilettes après chaque utilisation",
            "Le traitement dure 10-14 jours - terminez-le"
        ],
        "medicaments": [
            "Azithromycine (traitement standard)",
            "Ceftriaxone injectable (cas sévères)",
            "Ciprofloxacine (selon résistance locale)",
            "Paracétamol pour la fièvre",
            "Probiotiques pour restaurer la flore intestinale"
        ],
        "aliments_recommandes": [
            "Bouillon de riz et soupes légères",
            "Bananes mûres (faciles à digérer)",
            "Compotes de pommes sans sucre",
            "Purées de carottes et courgettes",
            "Riz blanc bien cuit",
            "Poisson vapeur, poulet bouilli",
            "Eau de coco"
        ],
        "aliments_eviter": [
            "Aliments crus (salades, fruits non pelés)",
            "Produits laitiers non pasteurisés",
            "Fruits de mer et poisson cru",
            "Aliments de rue",
            "Aliments épicés et acides",
            "Eau non traitée du robinet"
        ]
    },
    "bilharziose": {
        "symptomes": ["Fièvre", "Sang dans les urines", "Douleur en urinant", "Fatigue", "Douleur abdominale", "Éruption cutanée (dermatite du baigneur)", "Toux sèche"],
        "conseils": [
            "Consultez un médecin pour une analyse d'urine et de selles",
            "Le traitement est simple et efficace",
            "Évitez de vous baigner dans les eaux douces (fleuves, lacs, marigots)",
            "Buvez de l'eau potable ou bouillie",
            "Portez des bottes dans les rizières et champs inondés",
            "Traitez les points d'eau avec des molluscicides",
            "Lavez-vous après avoir été en contact avec de l'eau douce"
        ],
        "medicaments": [
            "Praziquantel (traitement standard - dose unique)",
            "Antipaludiques (parfois associée au paludisme)",
            "Traitement de l'anémie si nécessaire",
            "Antibiotiques pour surinfections urinaires"
        ],
        "aliments_recommandes": [
            "Aliments riches en fer (épinards, foie, lentilles)",
            "Protéines maigres pour renforcer l'immunité",
            "Fruits riches en vitamine C",
            "Beaucoup d'eau propre",
            "Soupe et bouillons nutritifs"
        ],
        "aliments_eviter": [
            "Alcool (aggrave les lésions hépatiques)",
            "Aliments épicés (irritent la vessie)",
            "Caféine excessive",
            "Eau non traitée"
        ]
    },
    "ulcère": {
        "symptomes": ["Douleur brûlante à l'estomac", "Douleur entre les repas ou la nuit", "Ballonnements", "Nausées", "Vomissements", "Perte d'appétit", "Selles noires (hémorragie)"],
        "conseils": [
            "Consultez un gastro-entérologue pour une endoscopie",
            "Évitez les anti-inflammatoires (ibuprofène, aspirine)",
            "Mangez en petites quantités mais plus fréquemment (5-6 repas/jour)",
            "Évitez de manger 3 heures avant le coucher",
            "Surélevez la tête de votre lit",
            "Gérez votre stress (le stress aggrave l'ulcère)",
            "Arrêtez de fumer",
            "Buvez des tisanes apaisantes (camomille, gingembre)"
        ],
        "medicaments": [
            "Inhibiteurs de la pompe à protons (oméprazole, ésoméprazole)",
            "Anti-H2 (ranitidine, famotidine)",
            "Anti-acides (Maalox, Gaviscon) pour soulagement rapide",
            "Antibiotiques (si Helicobacter pylori - trithérapie)",
            "Sucralfate (protège la muqueuse gastrique)"
        ],
        "aliments_recommandes": [
            "Riz blanc bien cuit et pâtes bien cuites",
            "Bananes mûres (protègent la muqueuse)",
            "Pommes de terre et carottes cuites",
            "Poisson et poulet",
            "Yaourt nature (probiotiques)",
            "Compotes de fruits sans sucre",
            "Tisanes de camomille, gingembre"
        ],
        "aliments_eviter": [
            "Aliments épicés, pimentés et acides",
            "Café, thé fort et sodas caféinés",
            "Alcool (irrite la muqueuse)",
            "Aliments frits et très gras",
            "Chocolat, menthe",
            "Tomates et produits à base de tomate",
            "Ail et oignon crus"
        ]
    },
    "peste": {
        "symptomes": ["Fièvre élevée brutale", "Ganglions enflés et douloureux (bubons)", "Frissons intenses", "Maux de tête violents", "Faiblesse extrême", "Toux avec crachats sanglants (peste pulmonaire)", "Nausées et vomissements"],
        "conseils": [
            "URGENCE ABSOLUE - Consultez immédiatement un centre de santé",
            "Isolez le patient pour éviter la contagion",
            "Le traitement antibiotique est URGENT et efficace",
            "Portez un masque et des gants pour protéger les proches",
            "Dératisez votre maison et votre environnement",
            "Éliminez les cadavres de rats (porteurs de puces infectées)",
            "Utilisez des insecticides contre les puces",
            "Surveillez l'apparition de cas similaires dans votre entourage"
        ],
        "medicaments": [
            "Streptomycine (traitement de référence)",
            "Gentamicine (alternative efficace)",
            "Doxycycline (traitement et prévention)",
            "Ciprofloxacine (alternative)",
            "Chloramphénicol (cas sévères)",
            "Paracétamol pour la fièvre"
        ],
        "aliments_recommandes": [
            "Bouillons nutritifs pour maintenir les forces",
            "Purées de légumes faciles à digérer",
            "Eau en abondance pour éviter la déshydratation",
            "Jus de fruits frais riches en vitamine C",
            "Compotes de fruits"
        ],
        "aliments_eviter": [
            "Aliments gras et lourds",
            "Alcool (interdit pendant le traitement)",
            "Aliments épicés"
        ]
    },
    "méningite": {
        "symptomes": ["Fièvre élevée", "Raidissement de la nuque (cou raide)", "Maux de tête violents", "Nausées et vomissements", "Sensibilité à la lumière (photophobie)", "Confusion ou somnolence", "Convulsions", "Éruption cutanée (tâches rouges/violettes)"],
        "conseils": [
            "URGENCE - Consultez immédiatement un médecin ou allez à l'hôpital",
            "Ne tardez PAS - la méningite peut être fatale en 24h",
            "Faites une ponction lombaire pour confirmer le diagnostic",
            "Le traitement antibiotique doit être administré TRÈS rapidement",
            "Reposez-vous au lit strictement",
            "Évitez la lumière vive et le bruit",
            "Les proches doivent prendre un traitement préventif",
            "Vaccinez-vous contre la méningite (vaccin disponible)"
        ],
        "medicaments": [
            "Ceftriaxone (antibiotique de première ligne)",
            "Céfotaxime (alternative)",
            "Ampicilline (selon l'âge et la cause)",
            "Dexaméthasone (anti-inflammatoire)",
            "Anticonvulsivants si convulsions",
            "Paracétamol pour la fièvre"
        ],
        "aliments_recommandes": [
            "Liquides en abondance (eau, tisanes, bouillons)",
            "Soupe légère et nutritive",
            "Purées de légumes",
            "Jus de fruits frais",
            "Eau de coco"
        ],
        "aliments_eviter": [
            "Aliments solides si difficulté à avaler",
            "Aliments épicés et acides",
            "Alcool et caféine"
        ]
    },
    "rougeole": {
        "symptomes": ["Fièvre élevée", "Toux sèche", "Nez qui coule (rhinite)", "Yeux rouges et larmoyants (conjonctivite)", "Tâches blanches dans la bouche (tâches de Koplik)", "Éruption cutanée rouge qui commence sur le visage", "Fatigue intense"],
        "conseils": [
            "Consultez un médecin pour confirmer le diagnostic",
            "Isolez le malade pendant 4 jours après le début de l'éruption",
            "Reposez-vous au lit jusqu'à la guérison",
            "Buvez beaucoup d'eau pour éviter la déshydratation",
            "Utilisez un humidificateur d'air pour la toux",
            "Surveillez les complications (pneumonie, otite, encéphalite)",
            "La vaccination est le SEUL moyen de prévention efficace",
            "Évitez tout contact avec les femmes enceintes et les nourrissons"
        ],
        "medicaments": [
            "Paracétamol contre la fièvre et les douleurs",
            "Vitamine A (réduit la gravité et la mortalité)",
            "Antibiotiques si surinfection bactérienne",
            "Sirop antitussif pour la toux",
            "Collyre pour les yeux (conjonctivite)"
        ],
        "aliments_recommandes": [
            "Bouillon de poule nutritif",
            "Purées de légumes (carottes, patates douces)",
            "Compotes de fruits riches en vitamine A (mangue, papaye)",
            "Jus de fruits frais",
            "Eau, tisanes, infusions"
        ],
        "aliments_eviter": [
            "Aliments épicés qui irritent la gorge",
            "Aliments acides (agrumes non dilués)",
            "Alcool et tabac"
        ]
    },
    "varicelle": {
        "symptomes": ["Fièvre modérée", "Fatigue et malaise général", "Éruption de vésicules (petites cloques remplies de liquide)", "Démangeaisons intenses", "Vésicules sur tout le corps (visage, tronc, membres)", "Croûtes qui se forment après quelques jours"],
        "conseils": [
            "Consultez un médecin pour confirmer le diagnostic",
            "Évitez de gratter les vésicules (risque d'infection et de cicatrices)",
            "Coupez les ongles courts (surtout chez les enfants)",
            "Prenez des bains tièdes avec du bicarbonate de soude",
            "Portez des vêtements amples en coton",
            "Isolez le malade jusqu'à ce que toutes les lésions soient sèches (5-7 jours)",
            "Évitez tout contact avec les femmes enceintes et les nouveau-nés",
            "Le repos à domicile est suffisant dans la plupart des cas"
        ],
        "medicaments": [
            "Paracétamol contre la fièvre (PAS D'ASPIRINE - risque de syndrome de Reye)",
            "Antihistaminiques (cétirizine, loratadine) contre les démangeaisons",
            "Calamine lotion ou crème apaisante",
            "Pommade antivirale (aciclovir) pour les cas graves",
            "Antibiotiques si surinfection des lésions"
        ],
        "aliments_recommandes": [
            "Aliments mous et faciles à avaler",
            "Soupe fraîche ou tiède",
            "Compotes de fruits",
            "Yaourt nature et lait frais",
            "Beaucoup d'eau et de jus de fruits"
        ],
        "aliments_eviter": [
            "Aliments trop salés qui irritent les lésions buccales",
            "Aliments acides (agrumes, tomates) si lésions dans la bouche",
            "Aliments épicés"
        ]
    },
    "oreillons": {
        "symptomes": ["Gonflement douloureux des glandes salivaires (joues gonflées)", "Fièvre modérée", "Maux de tête", "Douleur en mâchant ou en avalant", "Fatigue", "Perte d'appétit", "Douleur aux testicules (chez les hommes adultes)"],
        "conseils": [
            "Consultez un médecin pour le diagnostic",
            "Reposez-vous au lit jusqu'à la disparition du gonflement",
            "Appliquez des compresses froides ou chaudes sur les joues gonflées",
            "Mangez des aliments mous qui ne nécessitent pas de mastication",
            "Buvez beaucoup de liquides pour éviter la déshydratation",
            "Évitez les aliments acides qui stimulent la salivation et augmentent la douleur",
            "Isolez le malade jusqu'à 5 jours après le début du gonflement",
            "La vaccination (ROR) est le meilleur moyen de prévention"
        ],
        "medicaments": [
            "Paracétamol contre la fièvre et la douleur",
            "Anti-inflammatoires (ibuprofène) pour réduire le gonflement",
            "Antalgiques plus forts si douleur intense"
        ],
        "aliments_recommandes": [
            "Purées de légumes et soupes mixées",
            "Compotes de fruits",
            "Yaourts et laitages",
            "Bouillie de céréales",
            "Eau, tisanes, jus dilués"
        ],
        "aliments_eviter": [
            "Aliments acides (agrumes, vinaigre, cornichons)",
            "Aliments durs qui nécessitent de mâcher",
            "Aliments épicés et salés"
        ]
    },
    "coqueluche": {
        "symptomes": ["Toux violente en quintes (série de toux rapides)", "Sifflement inspiratoire (chant du coq)", "Visage rouge ou bleu pendant les quintes", "Vomissements après la toux", "Fatigue extrême", "Fièvre légère ou absente"],
        "conseils": [
            "Consultez un médecin immédiatement - la coqueluche est grave chez les nourrissons",
            "Un traitement antibiotique précoce réduit la contagiosité",
            "Isolez le malade pendant 5 jours après le début du traitement",
            "Surveillez les signes de détresse respiratoire (lèvres bleues)",
            "Fractionnez les repas en petites quantités fréquentes",
            "Évitez les irritants respiratoires (fumée, poussière, parfums)",
            "Utilisez un humidificateur d'air dans la chambre",
            "La vaccination des nourrissons est ESSENTIELLE (DTCoq)"
        ],
        "medicaments": [
            "Azithromycine (traitement standard 5 jours)",
            "Érythromycine (alternative 14 jours)",
            "Clarithromycine",
            "Sirop antitussif (sur avis médical)",
            "Paracétamol si fièvre"
        ],
        "aliments_recommandes": [
            "Petits repas fréquents et faciles à digérer",
            "Soupe liquide et bouillon",
            "Compotes de fruits",
            "Eau et tisanes en petites gorgées fréquentes",
            "Aliments mous et froids"
        ],
        "aliments_eviter": [
            "Aliments secs qui peuvent déclencher la toux",
            "Boissons gazeuses",
            "Aliments très chauds ou très froids"
        ]
    },
    "tétanos": {
        "symptomes": ["Contractures musculaires douloureuses", "Raideur de la mâchoire (trismus - impossibilité d'ouvrir la bouche)", "Raideur de la nuque et du dos", "Spasmes musculaires involontaires", "Difficulté à avaler", "Fièvre", "Transpiration excessive"],
        "conseils": [
            "URGENCE - Hospitalisation immédiate aux soins intensifs",
            "Le tétanos est mortel sans traitement médical",
            "Nettoyez IMMÉDIATEMENT toute plaie avec de l'eau et du savon",
            "Désinfectez les plaies avec de l'eau oxygénée ou de la Bétadine",
            "La vaccination antitétanique est OBLIGATOIRE (3 doses + rappels)",
            "Évitez les coupures avec des objets rouillés ou sales",
            "Portez des chaussures pour éviter les blessures aux pieds",
            "Après une blessure, consultez pour un rappel de vaccin antitétanique"
        ],
        "medicaments": [
            "Immunoglobuline antitétanique (traitement d'urgence)",
            "Diazepam (Valium) pour les spasmes musculaires",
            "Métronidazole ou pénicilline (antibiotiques)",
            "Myorelaxants (relaxants musculaires)",
            "Vaccin antitétanique (dose de rappel)"
        ],
        "aliments_recommandes": [
            "Alimentation liquide ou par sonde si difficulté à avaler",
            "Bouillons nutritifs enrichis en protéines",
            "Eau en quantité suffisante",
            "Compléments nutritionnels liquides"
        ],
        "aliments_eviter": [
            "Aliments solides (si trismus/difficulté à avaler)",
            "Alcool"
        ]
    },
    "poliomyélite": {
        "symptomes": ["Fièvre", "Fatigue intense", "Maux de tête", "Vomissements", "Raideur de la nuque", "Faiblesse musculaire soudaine dans un membre", "Paralysie flasque (les membres deviennent mous)"],
        "conseils": [
            "Consultez un médecin dès les premiers signes de paralysie",
            "Signalez immédiatement tout cas suspect aux autorités sanitaires",
            "Le traitement est symptomatique - pas de médicament antiviral spécifique",
            "La rééducation physique est essentielle pour récupérer la mobilité",
            "Utilisez des attelles et appareillages orthopédiques si nécessaire",
            "La VACCINATION est la SEULE prévention efficace",
            "Faites vacciner tous les enfants (vaccin polio oral ou injectable)",
            "Maintenez une bonne hygiène (lavage des mains, eau potable)"
        ],
        "medicaments": [
            "Paracétamol pour la fièvre et les douleurs",
            "Anti-inflammatoires",
            "Kinésithérapie et rééducation fonctionnelle",
            "Appareillages orthopédiques",
            "Antalgiques pour les douleurs musculaires"
        ],
        "aliments_recommandes": [
            "Repas équilibrés riches en protéines pour la récupération musculaire",
            "Fruits et légumes frais pour les vitamines",
            "Eau en abondance",
            "Aliments faciles à mâcher et à avaler"
        ],
        "aliments_eviter": [
            "Aliments trop gras et transformés",
            "Alcool"
        ]
    },
    "fièvre jaune": {
        "symptomes": ["Fièvre élevée soudaine", "Frissons", "Maux de tête violents", "Douleurs musculaires (dos, jambes)", "Nausées et vomissements", "Jaunisse (peau et yeux jaunes)", "Urines foncées", "Saignements (nez, gencives, interne)"],
        "conseils": [
            "URGENCE - Consultez un médecin immédiatement",
            "Faites une analyse de sang pour confirmer le diagnostic",
            "Reposez-vous au lit strictement",
            "Buvez beaucoup d'eau pour éviter la déshydratation",
            "Surveillez les signes hémorragiques (saignements)",
            "Évitez les piqûres de moustiques (moustiquaire, repellent)",
            "Le vaccin contre la fièvre jaune est OBLIGATOIRE et très efficace",
            "Le vaccin est exigé pour voyager dans certains pays"
        ],
        "medicaments": [
            "Paracétamol pour la fièvre (PAS D'ASPIRINE NI D'IBUPROFÈNE)",
            "Sérum oral ou perfusion intraveineuse",
            "Transfusion sanguine si hémorragie sévère",
            "Vitamine K pour les troubles de coagulation",
            "Traitement symptomatique en milieu hospitalier"
        ],
        "aliments_recommandes": [
            "Bouillons et soupes nutritifs",
            "Eau de coco riche en électrolytes",
            "Jus de fruits frais",
            "Purées de légumes faciles à digérer",
            "Compotes de fruits"
        ],
        "aliments_eviter": [
            "Alcool (toxique pour le foie déjà affecté)",
            "Aliments gras et frits",
            "Aliments épicés",
            "Ibuprofène, aspirine et anti-inflammatoires"
        ]
    },
    "rage": {
        "symptomes": ["Fièvre", "Maux de tête", "Anxiété et agitation", "Difficulté à avaler (hydrophobie - peur de l'eau)", "Salivation excessive", "Hallucinations", "Spasmes musculaires", "Paralysie progressive"],
        "conseils": [
            "URGENCE ABSOLUE - Après une morsure, lavez immédiatement la plaie",
            "Lavez la morsure à l'eau et au savon PENDANT 15 MINUTES",
            "Appliquez de l'alcool ou de la Bétadine sur la plaie",
            "Consultez un centre antirabique dans les HEURES qui suivent",
            "Le traitement post-exposition (vaccin + immunoglobuline) est TRÈS EFFICACE",
            "Ne tuez pas l'animal - il doit être mis en observation",
            "Surveillez l'animal mordeur pendant 10 jours",
            "Vaccinez vos chiens et chats contre la rage"
        ],
        "medicaments": [
            "Vaccin antirabique (5 doses sur 28 jours)",
            "Immunoglobuline antirabique (injection autour de la plaie)",
            "Paracétamol pour la fièvre",
            "Sédatifs pour l'agitation",
            "Traitement de soutien en unité de soins intensifs"
        ],
        "aliments_recommandes": [
            "Aliments liquides et semi-liquides si difficulté à avaler",
            "Bouillons nutritifs",
            "Eau et jus de fruits"
        ],
        "aliments_eviter": [
            "Aliments solides si difficulté à avaler",
            "Eau (phobie de l'eau dans les stades avancés)"
        ]
    },
    "lèpre": {
        "symptomes": ["Tâches cutanées claires ou rougeâtres", "Perte de sensibilité dans les zones touchées", "Engourdissement des mains et des pieds", "Faiblesse musculaire", "Lésions cutanées qui ne guérissent pas", "Épaississement des nerfs (nerfs palpables)", "Déformations des doigts et des orteils (stade avancé)"],
        "conseils": [
            "Consultez un dermatologue pour un diagnostic précis",
            "Le traitement est GRATUIT dans les centres spécialisés",
            "La lèpre se guérit TOTALEMENT avec le traitement",
            "Prenez vos médicaments TOUS LES JOURS sans interruption (6-12 mois)",
            "N'ayez pas honte - la lèpre n'est pas une malédiction",
            "Protégez les zones insensibles des brûlures et blessures",
            "Portez des chaussures adaptées pour éviter les plaies aux pieds",
            "Le dépistage précoce évite les handicaps permanents"
        ],
        "medicaments": [
            "Polychimiothérapie (PCT) - traitement standard gratuit",
            "Rifampicine + Dapsone + Clofazimine (multibacillaire)",
            "Rifampicine + Dapsone (paucibacillaire)",
            "Anti-inflammatoires pour les réactions lépreuses",
            "Corticostéroïdes pour les atteintes nerveuses",
            "Kinésithérapie et rééducation"
        ],
        "aliments_recommandes": [
            "Aliments riches en protéines pour la réparation tissulaire",
            "Fruits et légumes frais riches en vitamines",
            "Céréales complètes et légumineuses",
            "Poisson et viande maigre",
            "Eau en quantité suffisante"
        ],
        "aliments_eviter": [
            "Alcool (interfère avec le traitement)",
            "Aliments trop transformés"
        ]
    },
    "bronchite": {
        "symptomes": ["Toux grasse avec crachats", "Respiration sifflante", "Oppression thoracique", "Fièvre légère", "Fatigue", "Essoufflement léger", "Nez bouché ou qui coule"],
        "conseils": [
            "Reposez-vous et évitez les efforts physiques",
            "Buvez beaucoup de liquides chauds (thé, tisane, soupe)",
            "Utilisez un humidificateur d'air dans votre chambre",
            "Évitez la fumée de tabac et les irritants respiratoires",
            "Surveillez la couleur des crachats (jaune/vert = infection bactérienne)",
            "Consultez un médecin si la fièvre persiste plus de 3 jours",
            "La bronchite aiguë guérit généralement seule en 1-3 semaines",
            "Lavez-vous les mains régulièrement pour éviter la propagation"
        ],
        "medicaments": [
            "Paracétamol contre la fièvre et les douleurs",
            "Sirop mucolytique (fluidifie les crachats : acétylcystéine)",
            "Bronchodilatateurs (salbutamol) si respiration sifflante",
            "Antibiotiques UNIQUEMENT si infection bactérienne confirmée",
            "Anti-inflammatoires (ibuprofène) si douleur thoracique"
        ],
        "aliments_recommandes": [
            "Soupe de poulet chaude aux légumes",
            "Thé au gingembre, citron et miel",
            "Jus de fruits frais riches en vitamine C",
            "Ail cru (antibactérien naturel)",
            "Eau et tisanes en abondance"
        ],
        "aliments_eviter": [
            "Produits laitiers en excès (épaississent le mucus)",
            "Aliments frits et gras",
            "Alcool et caféine excessive",
            "Aliments très froids (glaces, boissons glacées)"
        ]
    },
    "pneumonie": {
        "symptomes": ["Fièvre élevée (39-40°C)", "Toux avec crachats jaunes/verts ou sanglants", "Essoufflement et respiration rapide", "Douleur thoracique en respirant", "Frissons intenses", "Fatigue extrême", "Confusion (surtout chez les personnes âgées)"],
        "conseils": [
            "Consultez un médecin URGENCE - la pneumonie peut être grave",
            "Faites une radiographie des poumons pour confirmer",
            "Le traitement antibiotique doit être pris COMPLÈTEMENT",
            "Reposez-vous au lit strictement",
            "Buvez beaucoup d'eau et de liquides chauds",
            "Surveillez votre saturation en oxygène",
            "Évitez la fumée de tabac et les polluants",
            "La vaccination antipneumococcique est recommandée chez les personnes à risque"
        ],
        "medicaments": [
            "Amoxicilline (antibiotique de première ligne)",
            "Azithromycine (alternative en cas d'allergie)",
            "Ceftriaxone (cas sévères hospitalisés)",
            "Paracétamol contre la fièvre",
            "Oxygénothérapie si saturation basse",
            "Mucolytiques pour fluidifier les crachats"
        ],
        "aliments_recommandes": [
            "Soupe de poule chaude et nutritive",
            "Purées de légumes (carottes, potiron)",
            "Jus de fruits frais riches en vitamine C",
            "Thé au gingembre et miel",
            "Eau en abondance"
        ],
        "aliments_eviter": [
            "Aliments très froids",
            "Produits laitiers en excès",
            "Alcool (affaiblit le système immunitaire)",
            "Tabac (aggrave l'inflammation pulmonaire)"
        ]
    },
    "conjonctivite": {
        "symptomes": ["Œil rouge", "Démangeaisons oculaires", "Larmoiement excessif", "Sécrétions (jaunes/vertes pour bactérienne, claires pour virale)", "Sensation de sable dans l'œil", "Paupières collées au réveil", "Sensibilité à la lumière"],
        "conseils": [
            "Consultez un ophtalmologiste ou un médecin généraliste",
            "Lavez-vous les mains TRÈS RÉGULIÈREMENT",
            "Ne touchez pas vos yeux avec les mains sales",
            "Nettoyez vos yeux avec du sérum physiologique",
            "Utilisez une serviette et un oreiller séparés",
            "Ne partagez pas les serviettes, gants de toilette ou cosmétiques",
            "Jetez les mouchoirs après chaque usage",
            "Remplacez le maquillage des yeux pour éviter la réinfection"
        ],
        "medicaments": [
            "Collyre antibiotique (pour conjonctivite bactérienne)",
            "Collyre antihistaminique (pour conjonctivite allergique)",
            "Larmes artificielles (soulagent l'irritation)",
            "Sérum physiologique pour le lavage des yeux",
            "Compresses d'eau froide pour les démangeaisons"
        ],
        "aliments_recommandes": [
            "Aliments riches en vitamine A (carottes, patates douces, mangues)",
            "Légumes verts à feuilles (épinards, chou)",
            "Fruits riches en vitamine C (oranges, kiwis)",
            "Eau en abondance"
        ],
        "aliments_eviter": [
            "Aliments épicés (peuvent irriter les yeux)",
            "Alcool"
        ]
    },
    "salmonellose": {
        "symptomes": ["Diarrhée aqueuse", "Fièvre modérée à élevée", "Douleurs abdominales et crampes", "Nausées et vomissements", "Maux de tête", "Frissons", "Sang dans les selles (parfois)"],
        "conseils": [
            "Buvez du sérum oral (SRO) pour éviter la déshydratation",
            "Reposez-vous et restez au chaud",
            "Consultez un médecin si les symptômes persistent plus de 48h",
            "Lavez-vous les mains après chaque toilette",
            "Ne préparez pas à manger pour les autres pendant la maladie",
            "Lavez soigneusement les aliments avant de les cuisiner",
            "Cuisez bien les œufs et la volaille (température interne > 75°C)",
            "Évitez la contamination croisée dans la cuisine"
        ],
        "medicaments": [
            "Sels de réhydratation orale (SRO) - essentiel",
            "Antibiotiques (azithromycine, ciprofloxacine) pour cas sévères",
            "Paracétamol pour la fièvre",
            "Probiotiques pour restaurer la flore intestinale",
            "Zinc pour réduire la durée de la diarrhée"
        ],
        "aliments_recommandes": [
            "Bouillon de riz (eau de riz) contre la diarrhée",
            "Bananes mûres écrasées",
            "Compotes de pommes sans sucre",
            "Riz blanc bien cuit",
            "Eau de coco",
            "Yaourt nature (probiotiques)"
        ],
        "aliments_eviter": [
            "Œufs crus ou mal cuits",
            "Viande de volaille crue ou saignante",
            "Produits laitiers non pasteurisés",
            "Fruits de mer crus",
            "Mayonnaise maison et sauces à l'œuf cru",
            "Aliments de rue non hygiéniques"
        ]
    },
    "cystite": {
        "symptomes": ["Envie fréquente et urgente d'uriner", "Brûlure ou douleur en urinant", "Urines troubles ou malodorantes", "Sang dans les urines (parfois)", "Douleur dans le bas-ventre", "Sensation de vidange incomplète de la vessie"],
        "conseils": [
            "Buvez BEAUCOUP d'eau (au moins 2L par jour) pour diluer les urines",
            "Faites une analyse d'urine (bandelette ou ECBU) pour confirmer",
            "Urinez dès que vous en ressentez le besoin - ne retenez pas",
            "Urinez après les rapports sexuels",
            "Essuyez-vous d'avant en arrière après la toilette",
            "Évitez les vêtements trop serrés et les sous-vêtements synthétiques",
            "Portez des sous-vêtements en coton",
            "Consultez si les symptômes persistent après traitement"
        ],
        "medicaments": [
            "Antibiotiques (fosfomycine, monodose efficace)",
            "Triméthoprime-sulfaméthoxazole (Bactrim)",
            "Nitrofurantoïne (traitement de 3-5 jours)",
            "Ciprofloxacine (alternative)",
            "Paracétamol contre la douleur",
            "Phytothérapie (cranberry, baies de myrtille)"
        ],
        "aliments_recommandes": [
            "Eau en TRÈS GRANDE quantité",
            "Jus de cranberry (canneberge) - prévient les infections",
            "Tisanes diurétiques (thé vert, queue de cerise, pissenlit)",
            "Ail (antibactérien naturel)",
            "Fruits riches en vitamine C"
        ],
        "aliments_eviter": [
            "Aliments épicés et acides (irritent la vessie)",
            "Caféine (café, thé fort, sodas)",
            "Alcool",
            "Chocolat, tomates, agrumes en excès",
            "Boissons gazeuses et sucrées"
        ]
    },
    "appendicite": {
        "symptomes": ["Douleur autour du nombril puis dans le bas-ventre droit", "Douleur qui s'aggrave en bougeant, en toussant ou en appuyant", "Nausées et vomissements", "Perte d'appétit", "Fièvre légère", "Constipation ou diarrhée", "Ballonnements"],
        "conseils": [
            "URGENCE - Consultez un médecin ou allez aux urgences IMMÉDIATEMENT",
            "NE MANGEZ PAS ET NE BUVEZ PAS (vous pourriez avoir besoin d'une chirurgie)",
            "NE PRENEZ PAS de laxatifs ou d'anti-douleurs forts",
            "Ne mettez pas de bouillotte chaude sur le ventre",
            "L'appendicite nécessite une intervention chirurgicale en urgence",
            "Le diagnostic se fait par examen clinique, échographie ou scanner",
            "Après l'opération, reprenez l'alimentation progressivement",
            "L'appendicite non traitée peut provoquer une péritonite mortelle"
        ],
        "medicaments": [
            "Antibiotiques intraveineux (avant et après la chirurgie)",
            "Antalgiques (après le diagnostic chirurgical)",
            "Antiémétiques contre les nausées",
            "Paracétamol pour la fièvre"
        ],
        "aliments_recommandes": [
            "Régime liquide après l'opération (eau, bouillon, tisanes)",
            "Aliments mous et faciles à digérer (purées, compotes)",
            "Repas légers et fréquents pendant la convalescence",
            "Aliments riches en fibres pour éviter la constipation"
        ],
        "aliments_eviter": [
            "NE RIEN MANGER NI BOIRE avant le diagnostic",
            "Aliments gras et lourds après l'opération (au début)",
            "Aliments gazeux (sodas, choux, haricots)",
            "Épices fortes et aliments irritants"
        ]
    }
}

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({"error": "Email et mot de passe requis"}), 400
    if len(password) < 6:
        return jsonify({"error": "Le mot de passe doit contenir au moins 6 caractères"}), 400
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    try:
        conn = get_db_connection()
        c = conn.cursor()
        if DATABASE_URL:
            # PostgreSQL uses %s placeholders
            c.execute("INSERT INTO users (email, password) VALUES (%s, %s)", (email, hashed_password))
        else:
            # SQLite uses ? placeholders
            c.execute("INSERT INTO users (email, password) VALUES (?, ?)", (email, hashed_password))
        conn.commit()
        conn.close()
        return jsonify({"message": "Compte créé avec succès ! Vous pouvez maintenant vous connecter."}), 201
    except Exception as e:
        if 'unique' in str(e).lower() or 'duplicate' in str(e).lower():
            return jsonify({"error": "Cet email existe déjà."}), 400
        return jsonify({"error": "Erreur lors de la création du compte."}), 400

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({"error": "Veuillez entrer votre email et votre mot de passe."}), 400
    conn = get_db_connection()
    c = conn.cursor()
    if DATABASE_URL:
        c.execute("SELECT id, password FROM users WHERE email = %s", (email,))
    else:
        c.execute("SELECT id, password FROM users WHERE email = ?", (email,))
    user = c.fetchone()
    conn.close()
    if not user:
        return jsonify({"error": "❌ Aucun compte trouvé avec cet email. Veuillez d'abord créer un compte."}), 401
    if not bcrypt.check_password_hash(user[1], password):
        return jsonify({"error": "❌ Mot de passe incorrect. Veuillez réessayer."}), 401
    token = create_access_token(identity=str(user[0]))
    return jsonify({"token": token, "message": "Connexion réussie !"}), 200

@app.route('/api/advice', methods=['POST'])
def get_advice():
    data = request.get_json()
    disease = data.get('disease', '').strip().lower()
    disease_map = {
        "diabetic": "diabète", "diabete": "diabète", "diabetes": "diabète",
        "diabetique": "diabète", "hightension": "hypertension",
        "high blood pressure": "hypertension", "tension": "hypertension",
        "palu": "paludisme", "malaria": "paludisme",
        "grip": "grippe", "flu": "grippe", "cold": "grippe", "rhume": "grippe",
        "cancer": "cancer", "tumeur": "cancer",
        "covid": "covid-19", "corona": "covid-19", "coronavirus": "covid-19",
        "anemia": "anémie", "anemie": "anémie",
        "asthme": "asthme", "asthma": "asthme",
        "migraine": "migraine", "arthrose": "arthrose",
        "ulcer": "ulcère", "ulcère": "ulcère", "ulcere": "ulcère",
        "gastrite": "ulcère", "mal d'estomac": "ulcère",
        "vih": "vih", "sida": "vih", "hiv": "vih", "stds": "vih",
        "syphilis": "syphilis", "verole": "syphilis",
        "hepatite": "hépatite", "hepatitis": "hépatite", "jaunisse": "hépatite",
        "tuberculose": "tuberculose", "tb": "tuberculose", "tbc": "tuberculose",
        "cholera": "choléra", "choler": "choléra", "diarrhee": "choléra",
        "dengue": "dengue", "deng": "dengue",
        "typhoide": "typhoïde", "typhoid": "typhoïde", "fievre typhoide": "typhoïde",
        "bilharziose": "bilharziose", "bilharzia": "bilharziose",
        "peste": "peste", "plague": "peste",
        "meningite": "méningite", "meningitis": "méningite",
        "rougeole": "rougeole", "measles": "rougeole",
        "varicelle": "varicelle", "chickenpox": "varicelle",
        "oreillons": "oreillons", "mumps": "oreillons",
        "coqueluche": "coqueluche", "whooping cough": "coqueluche",
        "tetanos": "tétanos", "tetanus": "tétanos",
        "polio": "poliomyélite", "poliomyelite": "poliomyélite", "poliomyelitis": "poliomyélite",
        "fievre jaune": "fièvre jaune", "yellow fever": "fièvre jaune", "yellowfever": "fièvre jaune",
        "rage": "rage", "rabies": "rage",
        "lepre": "lèpre", "leprosy": "lèpre", "hansen": "lèpre",
        "bronchite": "bronchite", "bronchitis": "bronchite",
        "pneumonie": "pneumonie", "pneumonia": "pneumonie",
        "conjonctivite": "conjonctivite", "conjunctivitis": "conjonctivite", "yeux rouges": "conjonctivite",
        "salmonellose": "salmonellose", "salmonella": "salmonellose",
        "cystite": "cystite", "infection urinaire": "cystite", "uti": "cystite",
        "appendicite": "appendicite", "appendicitis": "appendicite"
    }
    if disease in disease_map:
        disease = disease_map[disease]
    result = disease_advice.get(disease)
    if result:
        return jsonify({"found": True, "disease": disease.title(), "data": result}), 200
    suggestions = []
    for key in disease_advice:
        if disease in key or key in disease:
            suggestions.append(key.title())
    if not suggestions:
        for key in disease_advice:
            for word in disease.split():
                if word in key and len(word) > 3:
                    suggestions.append(key.title())
                    break
    suggestions = list(dict.fromkeys(suggestions))
    return jsonify({
        "found": False,
        "message": "Désolé, je n'ai pas d'information spécifique sur cette maladie.",
        "suggestions": suggestions if suggestions else None
    }), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Santé+ API is running"}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    print("=" * 50)
    print("  Santé+ API Server - Green Edition")
    print("=" * 50)
    print(f"  Running on {host}:{port}")
    print(f"  Debug mode: {debug}")
    print("=" * 50)
    
    app.run(host=host, port=port, debug=debug)
