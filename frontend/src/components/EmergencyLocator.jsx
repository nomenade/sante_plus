import React, { useState, useEffect, useRef, useCallback } from 'react';
import './EmergencyLocator.css';

/* ============================================================
   Localisateur de soins — vraie carte (Leaflet + OpenStreetMap)
   et TOUTES les structures de santé à proximité (API Overpass)
   ============================================================ */

const DEFAULT_CENTER = { lat: 6.3703, lon: 2.3912 }; // Cotonou par défaut
const DEFAULT_LABEL = 'Cotonou — position par défaut';

const TYPE_META = {
  hospital: { label: 'Hôpital',   color: '#dc2626', icon: '🏥' },
  clinic:   { label: 'Clinique',  color: '#f59e0b', icon: '🩺' },
  doctors:  { label: 'Médecin',   color: '#2563eb', icon: '👨‍⚕️' },
  pharmacy: { label: 'Pharmacie', color: '#10b981', icon: '💊' }
};

const FILTERS = {
  tous:      ['hospital', 'clinic', 'doctors', 'pharmacy'],
  hospital:  ['hospital', 'clinic'],
  medecin:   ['doctors', 'clinic'],
  pharmacie: ['pharmacy']
};

// Distance orthodromique en km
function distKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// Transforme une étape OSRM en consigne française (façon Google Maps)
function frRouteStep(step) {
  const m = step.maneuver || {};
  const road = step.name || '';
  const d = step.distance != null
    ? (step.distance < 1000 ? `${Math.round(step.distance)} m` : `${(step.distance / 1000).toFixed(1)} km`)
    : '';
  const dir = {
    left: 'à gauche',
    right: 'à droite',
    'slight left': 'légèrement à gauche',
    'slight right': 'légèrement à droite',
    'sharp left': 'franchement à gauche',
    'sharp right': 'franchement à droite',
    straight: 'tout droit',
    uturn: 'demi-tour'
  }[m.modifier] || '';
  const on = road ? ` sur ${road}` : '';
  let text;
  switch (m.type) {
    case 'depart': text = `Départ vers ${road || 'la destination'}`; break;
    case 'arrive': text = 'Arrivée à destination'; break;
    case 'turn': text = `Tournez ${dir}${on}`; break;
    case 'continue': text = `Continuez ${dir}${on}`; break;
    case 'new name': text = `Poursuivez${on}`; break;
    case 'merge': text = `Rejoignez${on}`; break;
    case 'on ramp': text = `Prenez la bretelle d'accès${on}`; break;
    case 'off ramp': text = `Sortez de la bretelle${on}`; break;
    case 'fork': text = `À l'embranchement, restez ${dir}`; break;
    case 'end of road': text = `Au bout de la route, tournez ${dir}${on}`; break;
    case 'roundabout':
    case 'rotary':
    case 'roundabout turn':
      text = m.exit ? `Au rond-point, prenez la ${m.exit}ᵉ sortie${on}` : `Au rond-point, sortez${on}`;
      break;
    case 'exit roundabout': text = `Quittez le rond-point${on}`; break;
    default: text = `Continuez${on}`; break;
  }
  return `${text}${d ? ' · ' + d : ''}`;
}

// Flèche de manœuvre (icône de direction) pour chaque étape
function stepArrow(step) {
  const m = step.maneuver || {};
  const icons = {
    left: '⬅', right: '➡', 'slight left': '↖', 'slight right': '↗',
    'sharp left': '⬅', 'sharp right': '➡', straight: '⬆', uturn: '↩'
  };
  if (m.type === 'arrive') return '🏁';
  if (m.type === 'depart') return '🚗';
  if (m.type === 'roundabout' || m.type === 'rotary' || m.type === 'roundabout turn') return '🔁';
  if (m.type === 'on ramp') return '🛣️';
  if (m.type === 'off ramp') return '↘️';
  return icons[m.modifier] || '⬆';
}

// Normalise un élément Overpass en lieu exploitable
function normalize(o) {
  const tags = o.tags || {};
  let type = 'clinic';
  if (tags.amenity === 'hospital') type = 'hospital';
  else if (tags.amenity === 'doctors') type = 'doctors';
  else if (tags.amenity === 'pharmacy' || tags.shop === 'pharmacy') type = 'pharmacy';
  const lat = o.lat != null ? +o.lat : o.center && o.center.lat;
  const lon = o.lon != null ? +o.lon : o.center && o.center.lon;
  const name = tags.name || tags['name:fr'] || `${TYPE_META[type].label} (sans nom)`;
  const addr = [tags['addr:housenumber'], tags['addr:street'], tags['addr:city']].filter(Boolean).join(', ');
  return {
    id: `${o.type}-${o.id}`,
    name,
    type,
    lat,
    lon,
    address: addr || '',
    phone: tags.phone || tags['contact:phone'] || '',
    hours: tags.opening_hours || '',
    distance: null
  };
}

// Interroge Overpass pour lister TOUS les établissements de santé autour d'un point
async function overpassQuery(lat, lon, km) {
  const radius = Math.round(km * 1000);
  const query = `[out:json][timeout:25];
  (
    nwr["amenity"="hospital"](around:${radius},${lat},${lon});
    nwr["amenity"="clinic"](around:${radius},${lat},${lon});
    nwr["amenity"="doctors"](around:${radius},${lat},${lon});
    nwr["amenity"="pharmacy"](around:${radius},${lat},${lon});
    nwr["shop"="pharmacy"](around:${radius},${lat},${lon});
  );
  out center;`;
  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];
  let lastErr = null;
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      return (data.elements || []).map(normalize);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

function EmergencyLocator() {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const routeLayerRef = useRef(null);

  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [centerLabel, setCenterLabel] = useState(DEFAULT_LABEL);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [radius, setRadius] = useState(10);
  const [filter, setFilter] = useState('tous');
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState('');
  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [fullscreen, setFullscreen] = useState(false);

  // Initialisation de la carte Leaflet (une seule fois)
  useEffect(() => {
    const L = window.L;
    if (!mapElRef.current || !L || mapRef.current) return;
    const map = L.map(mapElRef.current, { zoomControl: false }).setView([center.lat, center.lon], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.scale({ imperial: false, metric: true, maxWidth: 120, position: 'bottomleft' }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 150);
    return () => { map.remove(); mapRef.current = null; layerRef.current = null; routeLayerRef.current = null; };
  }, []);

  const loadPlaces = useCallback(async (c, km) => {
    setLoading(true);
    setError('');
    try {
      const raw = await overpassQuery(c.lat, c.lon, km);
      const list = raw
        .map((p) => ({ ...p, distance: distKm(c, p) }))
        .filter((p) => p.lat != null && p.lon != null && p.name && p.distance <= km)
        .sort((a, b) => a.distance - b.distance);
      setPlaces(list);
    } catch {
      setError('Connexion impossible au service de cartographie. Réessayez dans un instant.');
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Géolocalisation au premier chargement
  useEffect(() => {
    if (!navigator.geolocation) { loadPlaces(DEFAULT_CENTER, 10); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setCenter(p);
        setCenterLabel('Votre position actuelle');
        setLocating(false);
        loadPlaces(p, 10);
      },
      () => { setLocating(false); loadPlaces(DEFAULT_CENTER, 10); },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 120000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recentrer la carte quand le centre change
  useEffect(() => {
    if (mapRef.current) mapRef.current.setView([center.lat, center.lon], 13);
    // Efface l'itinéraire tracé quand on change de position/centre
    if (routeLayerRef.current) {
      routeLayerRef.current.clearLayers();
      setRoute(null);
      setRouteError('');
    }
  }, [center]);

  // Marqueurs + point utilisateur
  useEffect(() => {
    const L = window.L;
    if (!mapRef.current || !layerRef.current || !L) return;
    layerRef.current.clearLayers();

    // Cercle du rayon de recherche autour de l'adresse/position (façon Google Maps)
    L.circle([center.lat, center.lon], {
      radius: radius * 1000,
      color: '#2563eb', weight: 1.5, dashArray: '6 6', fillColor: '#2563eb', fillOpacity: 0.06
    }).addTo(layerRef.current);

    // Point utilisateur (adresse/position)
    const userCircle = L.circleMarker([center.lat, center.lon], {
      radius: 9, color: '#2563eb', weight: 3, fillColor: '#2563eb', fillOpacity: 0.85
    }).addTo(layerRef.current);

    const types = FILTERS[filter] || FILTERS.tous;
    places.filter((p) => types.includes(p.type)).forEach((p) => {
      const meta = TYPE_META[p.type];
      const icon = L.divIcon({
        className: 'loc-divicon',
        html: `<div class="loc-pin" style="background:${meta.color}"><span>${meta.icon}</span></div>`,
        iconSize: [32, 40],
        iconAnchor: [16, 38],
        popupAnchor: [0, -36]
      });
      const marker = L.marker([p.lat, p.lon], { icon }).addTo(layerRef.current);
      const dist = p.distance < 1 ? `${Math.round(p.distance * 1000)} m` : `${p.distance.toFixed(1)} km`;
      const itin = `https://www.google.com/maps/dir/?api=1&origin=${center.lat},${center.lon}&destination=${p.lat},${p.lon}`;
      marker.bindPopup(
        `<div class="loc-popup">
          <div class="loc-popup-head"><span>${meta.icon}</span><strong>${escapeHtml(p.name)}</strong></div>
          <div class="loc-popup-meta">${meta.label} · ${dist}</div>
          ${p.address ? `<div class="loc-popup-row">📍 ${escapeHtml(p.address)}</div>` : ''}
          ${p.phone ? `<div class="loc-popup-row">📞 ${escapeHtml(p.phone)}</div>` : ''}
          ${p.hours ? `<div class="loc-popup-row">🕒 ${escapeHtml(p.hours)}</div>` : ''}
          <button type="button" class="loc-popup-trace">🛣️ Tracer l'itinéraire</button>
          <a class="loc-popup-link" href="${itin}" target="_blank" rel="noopener noreferrer">Ouvrir dans Google Maps</a>
        </div>`
      );
      marker.on('popupopen', () => {
        const btn = document.querySelector('.leaflet-popup-content .loc-popup-trace');
        if (btn) btn.onclick = () => { marker.closePopup(); traceRoute(p); };
      });
      marker.on('click', () => {
        setSelectedId(p.id);
        if (mapRef.current) mapRef.current.setView([p.lat, p.lon], 15);
      });
    });
    return () => { userCircle.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, filter, center, radius]);

  const filteredPlaces = places.filter((p) => (FILTERS[filter] || FILTERS.tous).includes(p.type));

  const locateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setCenter(p);
        setCenterLabel('Votre position actuelle');
        setLocating(false);
        loadPlaces(p, radius);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const q = search.trim();
    if (!q || searching) return;
    setSearching(true);
    setError('');
    try {
      const res = await fetch(
        'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(q),
        { headers: { 'Accept-Language': 'fr' } }
      );
      const data = await res.json();
      if (!data || data.length === 0) { setError('Aucun lieu trouvé pour cette recherche.'); return; }
      const p = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      const label = data[0].display_name ? data[0].display_name.split(',')[0] : q;
      setCenter(p);
      setCenterLabel(label);
      loadPlaces(p, radius);
    } catch {
      setError('Recherche impossible (vérifiez votre connexion).');
    } finally {
      setSearching(false);
    }
  };

  const applyRadius = (km) => { setRadius(km); loadPlaces(center, km); };
  const goTo = (p) => { setSelectedId(p.id); if (mapRef.current) mapRef.current.setView([p.lat, p.lon], 15); };

  // Trace l'itinéraire façon Google Maps : ligne précise + étapes détaillées
  function traceRoute(place) {
    const L = window.L;
    if (!mapRef.current || !routeLayerRef.current || !L) return;
    setRouteLoading(true);
    setRouteError('');
    routeLayerRef.current.clearLayers();
    const url =
      `https://router.project-osrm.org/route/v1/driving/${center.lon},${center.lat};${place.lon},${place.lat}` +
      '?overview=full&geometries=geojson&steps=true&alternatives=false';
    fetch(url)
      .then((res) => { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
      .then((data) => {
        const r = data.routes && data.routes[0];
        if (!r || !r.geometry || !r.geometry.coordinates) throw new Error('Aucune route');
        const coords = r.geometry.coordinates.map(([lon, lat]) => [lat, lon]);

        // Feuille de route détaillée (étapes OSRM)
        const steps = (r.legs && r.legs[0] && r.legs[0].steps) || [];

        // Tracé précis façon Google Maps : liseré blanc + ligne bleue,
        // extrémités et virages arrondis pour un rendu net
        L.polyline(coords, {
          color: '#ffffff', weight: 12, opacity: 0.95, interactive: false,
          lineCap: 'round', lineJoin: 'round'
        }).addTo(routeLayerRef.current);
        L.polyline(coords, {
          color: '#4285F4', weight: 7, opacity: 1, interactive: false,
          lineCap: 'round', lineJoin: 'round'
        }).addTo(routeLayerRef.current);

        // Point de départ : rond bleu « vous êtes ici »
        L.circleMarker([center.lat, center.lon], {
          radius: 10, color: '#ffffff', weight: 3.5, fillColor: '#4285F4', fillOpacity: 1
        }).addTo(routeLayerRef.current);

        // Épingle rouge façon Google Maps à destination
        const endIcon = L.divIcon({
          className: 'loc-divicon',
          html: `<div class="loc-pin loc-pin-end"><span>${TYPE_META[place.type].icon}</span></div>`,
          iconSize: [30, 44],
          iconAnchor: [15, 42],
          popupAnchor: [0, -40]
        });
        L.marker([place.lat, place.lon], { icon: endIcon, interactive: false }).addTo(routeLayerRef.current);

        // Zoom précis sur l'ensemble du tracé (sans excès)
        mapRef.current.fitBounds(L.latLngBounds(coords), { padding: [60, 60], maxZoom: 17 });

        setRoute({
          place,
          distanceKm: (r.distance || 0) / 1000,
          durationMin: (r.duration || 0) / 60,
          steps,
          googleUrl: `https://www.google.com/maps/dir/?api=1&origin=${center.lat},${center.lon}&destination=${place.lat},${place.lon}`
        });
      })
      .catch(() => {
        routeLayerRef.current.clearLayers();
        setRoute(null);
        setRouteError('Impossible de calculer l\'itinéraire. Vérifiez votre connexion puis réessayez.');
      })
      .finally(() => setRouteLoading(false));
  }

  // Recentre la carte sur la position/adresse courante
  const recenter = () => {
    if (mapRef.current) mapRef.current.setView([center.lat, center.lon], 13);
    loadPlaces(center, radius);
  };

  // Bascule la carte en plein écran (façon Google Maps)
  const toggleFullscreen = () => {
    setFullscreen((f) => {
      const next = !f;
      setTimeout(() => mapRef.current?.invalidateSize(), 80);
      return next;
    });
  };

  // Efface l'itinéraire tracé
  function clearRoute() {
    if (routeLayerRef.current) routeLayerRef.current.clearLayers();
    setRoute(null);
    setRouteError('');
  }

  const openItinerary = (p) => { setSelectedId(p.id); traceRoute(p); };

  return (
    <section className="loc-section">
      <a className="loc-emergency" href="tel:15" title="Appeler les urgences (SAMU)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z" />
        </svg>
        Appeler le 15
      </a>

      <header className="loc-header">
        <h2>📍 Localisateur de soins</h2>
        <p>Saisissez votre adresse ou activez votre position : la carte se centre dessus (cercle = rayon de recherche) et affiche tous les hôpitaux, cliniques, médecins et pharmacies à proximité (OpenStreetMap). Cliquez sur « Itinéraire » pour tracer un trajet précis façon Google Maps avec des consignes étape par étape.</p>
      </header>

      {/* Recherche + localisation */}
      <div className="loc-search">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 0 }}>
          <input
            type="text"
            className="loc-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Votre adresse (rue, ville, pays) — ex. Cotonou, Avenue Clozel"
          />
          <button type="submit" className="loc-filter active" disabled={searching} style={{ border: 'none', cursor: 'pointer' }}>
            {searching ? '…' : 'Chercher'}
          </button>
        </form>
        <button type="button" className="loc-filter" onClick={locateMe} style={{ cursor: 'pointer' }}>
          {locating ? 'Localisation…' : '🛰️ Me localiser'}
        </button>
      </div>

      {/* Filtres + rayon */}
      <div className="loc-search loc-filters-row">
        <span className="loc-filters">
          {[['tous', 'Tous'], ['hospital', '🏥 Hôpitaux'], ['medecin', '👨‍⚕️ Médecins'], ['pharmacie', '💊 Pharmacies']].map(([key, label]) => (
            <button key={key} type="button" className={`loc-filter ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>
              {label}
            </button>
          ))}
        </span>
        <span className="loc-filters">
          <span className="loc-radius-label">Rayon :</span>
          {[5, 10, 20, 30].map((km) => (
            <button key={km} type="button" className={`loc-filter ${radius === km ? 'active' : ''}`} onClick={() => applyRadius(km)}>
              {km} km
            </button>
          ))}
        </span>
      </div>

      <div className="loc-layout">
        {/* Résultats */}
        <aside className="loc-results">
          <h3>{loading ? 'Chargement…' : `${filteredPlaces.length} établissement(s) · ${centerLabel}`}</h3>
          {locating && <div className="loc-locating">📍 Localisation en cours…</div>}
          {error && <div className="loc-empty">{error}</div>}
          {!loading && !error && filteredPlaces.length === 0 && (
            <div className="loc-empty">Aucun établissement trouvé. Élargissez le rayon ou changez de lieu.</div>
          )}
          <ul className="loc-result-list">
            {filteredPlaces.map((p) => {
              const meta = TYPE_META[p.type];
              return (
                <li key={p.id} className={`loc-result ${selectedId === p.id ? 'active' : ''}`} onClick={() => goTo(p)} role="button" tabIndex="0">
                  <span className="loc-dot" style={{ background: meta.color }} />
                  <div className="loc-result-main">
                    <div className="loc-result-top">
                      <strong>{p.name}</strong>
                    </div>
                    <span className="loc-type">{meta.label}</span>
                    {p.address && <span className="loc-address">{p.address}</span>}
                    {p.phone && <span className="loc-address">📞 {p.phone}</span>}
                    <span className="loc-distance">À {p.distance < 1 ? `${Math.round(p.distance * 1000)} m` : `${p.distance.toFixed(1)} km`} de vous</span>
                  </div>
                  <button type="button" className="loc-itineraire" onClick={(e) => { e.stopPropagation(); openItinerary(p); }}>
                    Itinéraire
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="loc-results-note">Données ouvertes © OpenStreetMap. Vérifiez l'actualité des horaires auprès de l'établissement.</div>
        </aside>

        {/* Carte Leaflet / OpenStreetMap */}
        <div className={`loc-map-wrap ${fullscreen ? 'fullscreen' : ''}`}>
          <div className="loc-map-tools">
            <button type="button" className="loc-map-btn" onClick={recenter} title="Recentrer sur votre position" aria-label="Recentrer">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              </svg>
            </button>
            <button type="button" className="loc-map-btn" onClick={toggleFullscreen} title={fullscreen ? 'Quitter le plein écran' : 'Plein écran'} aria-label="Plein écran">
              {fullscreen ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v3a2 2 0 01-2 2H3M21 8h-3a2 2 0 01-2-2V3M3 16h3a2 2 0 012 2v3M16 21v-3a2 2 0 012-2h3" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3" />
                </svg>
              )}
            </button>
          </div>
          {route && (
            <div className="loc-route-card">
              <div className="loc-route-card-head">
                <strong>🛣️ Itinéraire tracé</strong>
                <button type="button" className="loc-route-close" onClick={clearRoute} aria-label="Fermer l'itinéraire" title="Fermer">✕</button>
              </div>
              <div className="loc-route-to">Vers : <strong>{route.place.name}</strong></div>
              <div className="loc-route-summary">
                <span>🚗 {route.distanceKm < 1 ? `${Math.round(route.distanceKm * 1000)} m` : `${route.distanceKm.toFixed(1)} km`}</span>
                <span>⏱️ {Math.round(route.durationMin)} min</span>
              </div>
              {route.steps && route.steps.length > 0 && (
                <ol className="loc-route-steps">
                  {route.steps.map((s, i) => (
                    <li key={`${s.maneuver?.location?.[0] || i}-${i}`} className="loc-route-step">
                      <span className="loc-step-arrow">{stepArrow(s)}</span>
                      <span className="loc-step-text">{frRouteStep(s)}</span>
                    </li>
                  ))}
                </ol>
              )}
              <a className="loc-popup-link" href={route.googleUrl} target="_blank" rel="noopener noreferrer">Ouvrir dans Google Maps</a>
            </div>
          )}
          {routeLoading && <div className="loc-route-loading">Calcul de l'itinéraire…</div>}
          {routeError && !route && <div className="loc-route-error">{routeError}</div>}
          <div className="loc-map" ref={mapElRef} role="application" aria-label="Carte OpenStreetMap des centres de santé"></div>
        </div>
      </div>
    </section>
  );
}

export default EmergencyLocator;