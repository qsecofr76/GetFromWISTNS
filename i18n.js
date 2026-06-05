/* ==========================================================================
   SUPERNOVA HUNTER - MULTILINGUAL TRANSLATION ENGINE (i18n)
   ========================================================================== */

const TRANSLATIONS = {
    it: {
        // Menu & Common Header
        "menu-radar": "📡 Radar Tracker",
        "menu-search": "🔍 Ricerca Area Celeste",
        "header-subtitle-radar": "Rilevatore in tempo reale di Supernove visibili nel cielo notturno (Dati ufficiali WIS-TNS)",
        "header-subtitle-search": "Rilevatore e motore di ricerca celeste per Transienti ed Asteroidi",
        "header-dedication": 'Dedicato alla memoria di <strong class="dedication-highlight">Paolo Campaner</strong>, amico indimenticato, appassionato scopritore di supernove e fondatore del gruppo <a href="https://www.astrofilipontedipiave.it" target="_blank" class="dedication-link">"Astrofili Ponte di Piave"</a>',
        
        // Common Footer
        "footer-dedication": "Dedicato alla memoria di <span class=\"dedication-highlight\">Paolo Campaner</span>",
        "footer-updated": "Database aggiornato via GitHub Actions | ",
        "btn-tns": "Apri scheda su WIS-TNS",

        // Index.html
        "config-title": "⚙️ Configurazione Osservatore",
        "label-lat": "Latitudine (°)",
        "label-lon": "Longitudine (°)",
        "label-date": "Data di Osservazione",
        "label-time": "Ora Inizio",
        "label-mag": "Magnitudine Limite (Mag <)",
        "label-alt": "Altezza Minima Orizzonte (°)",
        "btn-gps": "📍 Rileva GPS",
        "btn-tonight": "🌃 Stasera (Buio)",
        "btn-apply": "🔭 Applica e Calcola",
        "radar-title": "🌌 Mappa Celeste (Radar, Mag &lt; 17.5)",
        "scrubber-label": "Scorri il tempo nella finestra di 6 ore:",
        "banner-title": "Stato Osservativo Notturno",
        "results-title": "☄️ Supernove Visibili nelle prossime 6 Ore",
        
        // Table Headers Index
        "th-sn": "SN",
        "th-type": "Tipo",
        "th-mag": "Brillantezza (Mag)",
        "th-constellation": "Costellazione",
        "th-galaxy": "Galassia",
        "th-altitude": "Altezza Attuale / Peak",
        "th-direction": "Direzione (Azimut)",
        "th-phys-data": "Dati Fisici (RA/Dec)",
        "th-group": "Scopritore",
        "th-discovery": "Scoperta",
        
        // Modal
        "modal-filter": "Filtro Rilevazione",
        "modal-redshift": "Redshift (z)",
        "modal-ra": "Ascensione Retta",
        "modal-dec": "Declinazione",
        "modal-group": "Gruppo Scopritore",
        "modal-date": "Data di Rilevazione",
        "modal-vis-window": "📈 Finestra Visibilità (Prossime 6 Ore)",
        "modal-btn-close": "Chiudi",
        
        // Search.html
        "search-params-title": "🔍 Parametri di Ricerca",
        "label-dso": "Cerca Oggetto (Messier, NGC, IC, Stelle...)",
        "label-epoch": "Sistema di Coordinate (Epoca)",
        "label-epoch-j2000": "J2000 (Standard)",
        "label-epoch-jnow": "JNow (Data di Ricerca)",
        "label-ra-search": "Ascensione Retta (RA) — [es. 21h 01m 07s o 315.28]",
        "label-dec-search": "Declinazione (Dec) — [es. +41° 16' 07\" o 41.269]",
        "label-search-date": "Data Osservazione (UT)",
        "label-search-time": "Ora Osservazione (UT)",
        "label-search-radius": "Raggio di Ricerca (degr.)",
        "label-limit-mag": "Mag. Asteroidi Limite",
        "btn-search-area": "🔭 Avvia Ricerca Area",
        "fov-title": "🎯 Campo di Vista (FOV)",
        "fov-desc": "Il mirino mostra l'area di ricerca selezionata (Raggio: <span id=\"fovRadiusLabel\">1.5</span>°).",
        "btn-flip-h": "⇄ Specchia Orizzontale (RA)",
        "btn-flip-v": "⇅ Specchia Verticale (Dec)",
        "search-status-title": "Stato Ricerca Celeste",
        "search-status-default": "Inserisci le coordinate o cerca un oggetto celeste per iniziare.",
        "sn-area-title": "🌌 Supernove Rilevate nell'Area",
        "ast-area-title": "☄️ Asteroidi Rilevati nell'Area (MPC)",
        "fallback-title": "Problema con l'interrogazione diretta dell'MPC",
        "fallback-desc": "La richiesta diretta ai server del Minor Planet Center è stata bloccata (CORS o timeout). Puoi comunque produrre la lista ufficiale compilando la richiesta ufficiale in una nuova finestra.",
        "btn-fallback": "🔗 Apri Ricerca su Minor Planet Center (Nuova Scheda)",
        "debug-title": "🛠️ MPC Debug Console (Scambio Query)",
        "debug-toggle": "Espandi/Riduci",
        "debug-url-label": "URL Richiesta (tramite Proxy):",
        "debug-response-label": "Risposta HTML Ricevuta:",
        
        // Table Headers Search
        "th-sn-search": "Supernova",
        "th-type-search": "Tipo",
        "th-mag-search": "Mag. Scoperta",
        "th-constellation-search": "Costellazione",
        "th-galaxy-search": "Galassia Ospite",
        "th-dist-search": "Distanza Centro",
        "th-phys-search": "Dati Fisici (RA/Dec)",
        "th-date-search": "Data Scoperta",
        
        "th-ast-name": "Asteroide / Designazione",
        "th-ast-mag": "Magnitudine (V)",
        "th-ast-dist": "Distanza Centro",
        "th-ast-ra": "Ascensione Retta (RA)",
        "th-ast-dec": "Declinazione (Dec)",
        
        "placeholder-no-search": "Nessuna ricerca effettuata. Inserisci i parametri a sinistra.",
        "placeholder-loading-catalog": "Caricamento del catalogo in corso...",
        "placeholder-table-search": "Cerca per SN, costellazione, tipo...",
        "placeholder-dso-search": "es. M31, NGC 7000, Vega...",

        // Dynamic JS Strings
        "gps-status-ready": "GPS Pronto",
        "gps-status-detecting": "Rilevamento...",
        "gps-status-detected": "📍 GPS Rilevato",
        "gps-status-failed": "Rilevamento fallito",
        "gps-status-unsupported": "Non supportato",
        "gps-unsupported": "Geolocalizzazione non supportata dal tuo browser.",
        "gps-failed-alert": "Impossibile rilevare la posizione. Inserisci le coordinate manualmente.",
        "slider-start-time": "Ora Inizio",
        "slider-radar-start": "T + 0h (Inizio)",
        "slider-offset-hours": "T + {hours} ore ({time} {tz})",
        "last-update-prefix": "Ultimo aggiornamento",
        "results-count": "{count} trovate",
        "results-count-asteroids": "{count} trovati",
        
        "sun-warning-text": "⚠️ Attenzione: Alle {time} {tz} il sole è ancora alto (Alt: {alt}°). Imposta un orario notturno per rilevare supernove visibili nel buio!",
        "summary-observer": "Osservatore: <strong>{lat}° {latDir}</strong>, <strong>{lon}° {lonDir}</strong> | Finestra: <strong>{date} {time} - {endTime} {tz}</strong>",
        "sn-table-empty": "Nessun transiente visibile trovato con i criteri attuali. Prova a incrementare la Magnitudine limite o a selezionare una data diversa.",
        "search-sn-empty": "Nessuna supernova scoperta negli ultimi 6 mesi rilevata in questo raggio di visualizzazione.",
        "search-summary-coords": "Target J2000: <strong>RA: {raStr} ({raDeg}°)</strong> | <strong>Dec: {decStr} ({decDeg}°)</strong> <a href=\"{aladinUrl}\" target=\"_blank\" class=\"btn-aladin-inline\">🌌 Aladin Lite</a><br>Raggio: <strong>{radius}°</strong> | Data Ricerca: <strong>{date}</strong>",
        "sn-group-1": "🌌 Brillantissime (Magnitudine 10 - 13) — [{count} visibili, in ordine di scoperta]",
        "sn-group-2": "🔭 Brillanti (Magnitudine 13 - 15) — [{count} visibili, in ordine di scoperta]",
        "sn-group-3": "☄️ Osservabili (Magnitudine 15 - 19) — [{count} visibili, in ordine di scoperta]",
        "sn-group-4": "Altre supernove (Mag > 19 o N/D) — [{count} visibili]",
        "sn-group-empty-msg": "Nessuna supernova visibile in questa fascia in queste 6 ore.",
        
        "sesame-resolving": "⏳ <strong>SIMBAD Lookup</strong>: Risoluzione coordinate per <strong>\"{name}\"</strong> in corso tramite CDS Sesame...",
        "sesame-success": "✅ <strong>SIMBAD</strong>: Oggetto <strong>\"{name}\"</strong> identificato! Coordinate caricate (RA: {ra}, Dec: {dec}).",
        "sesame-failed": "❌ <strong>SIMBAD</strong>: Risoluzione fallita per <strong>\"{name}\"</strong> (oggetto non trovato nei cataloghi).",
        "sesame-error": "❌ <strong>SIMBAD</strong>: Errore di connessione o proxy durante la ricerca di <strong>\"{name}\"</strong>.",
        "sesame-suggest-querying": "⏳ Interrogazione CDS Sesame...",
        "sesame-suggest-failed": "❌ Oggetto non trovato. Riprova con una sigla standard.",
        "sesame-suggest-error": "❌ Errore di rete o blocco CORS. Inserisci coordinate manualmente.",
        
        "mpc-loading-label": "Interrogazione in corso del Minor Planet Center (MPC)...",
        "mpc-resolving": "⏳ <strong>MPC Lookup</strong>: Interrogazione del Minor Planet Center in corso per asteroidi...",
        "mpc-success": "✅ <strong>MPC Lookup</strong>: Trovati <strong>{count}</strong> asteroidi nel raggio di {radius}° (Mag < {limitMag}).",
        "mpc-failed": "❌ <strong>MPC Lookup</strong>: Query fallita o bloccata. Compilazione manuale disponibile sotto.",
        "mpc-error-msg": "❌ Impossibile caricare direttamente i dati MPC dal browser (blocco CORS, timeout o errore di validazione).<br>Usa il modulo arancione visualizzato qui sotto per consultare MPC in una nuova scheda.",
        "asteroid-empty-msg": "Nessun asteroide di magnitudine limitante impostata rilevato in questa area.",
        
        "host-galaxy-host": "Galassia Ospitante",
        "host-galaxy-label": "Galassia",
        "host-galaxy-isolated-label": "Isolata / Ignota",
        "modal-not-visible": "Non visibile in modo ottimale in questa finestra temporale.",
        
        "limit-label": "Raggio"
    },
    en: {
        // Menu & Common Header
        "menu-radar": "📡 Radar Tracker",
        "menu-search": "🔍 Celestial Area Search",
        "header-subtitle-radar": "Real-time visibility tracker of supernovae in the night sky (Official WIS-TNS data)",
        "header-subtitle-search": "Real-time celestial tracker and search engine for transients and asteroids",
        "header-dedication": 'Dedicated to the memory of <strong class="dedication-highlight">Paolo Campaner</strong>, unforgotten friend, passionate supernova discoverer and founder of <a href="https://www.astrofilipontedipiave.it" target="_blank" class="dedication-link">"Astrofili Ponte di Piave"</a>',
        
        // Common Footer
        "footer-dedication": "Dedicated to the memory of <span class=\"dedication-highlight\">Paolo Campaner</span>",
        "footer-updated": "Database updated via GitHub Actions | ",
        "btn-tns": "Open page on WIS-TNS",

        // Index.html
        "config-title": "⚙️ Observer Configuration",
        "label-lat": "Latitude (°)",
        "label-lon": "Longitude (°)",
        "label-date": "Observation Date",
        "label-time": "Start Time",
        "label-mag": "Limiting Magnitude (Mag <)",
        "label-alt": "Min Horizon Altitude (°)",
        "btn-gps": "📍 Detect GPS",
        "btn-tonight": "🌃 Tonight (Dark)",
        "btn-apply": "🔭 Apply & Calculate",
        "radar-title": "🌌 Celestial Sky Map (Radar, Mag &lt; 17.5)",
        "scrubber-label": "Scrub time within the 6-hour window:",
        "banner-title": "Nightly Observational Status",
        "results-title": "☄️ Visible Supernovae in the Next 6 Hours",
        
        // Table Headers Index
        "th-sn": "SN",
        "th-type": "Type",
        "th-mag": "Brightness (Mag)",
        "th-constellation": "Constellation",
        "th-galaxy": "Galaxy",
        "th-altitude": "Current Alt / Peak",
        "th-direction": "Direction (Azimuth)",
        "th-phys-data": "Physical Data (RA/Dec)",
        "th-group": "Discoverer",
        "th-discovery": "Discovery",
        
        // Modal
        "modal-filter": "Detection Filter",
        "modal-redshift": "Redshift (z)",
        "modal-ra": "Right Ascension",
        "modal-dec": "Declination",
        "modal-group": "Discovering Group",
        "modal-date": "Detection Date",
        "modal-vis-window": "📈 Visibility Window (Next 6 Hours)",
        "modal-btn-close": "Close",
        
        // Search.html
        "search-params-title": "🔍 Search Parameters",
        "label-dso": "Search Object (Messier, NGC, IC, Stars...)",
        "label-epoch": "Coordinate System (Epoch)",
        "label-epoch-j2000": "J2000 (Standard)",
        "label-epoch-jnow": "JNow (Search Date)",
        "label-ra-search": "Right Ascension (RA) — [e.g. 21h 01m 07s or 315.28]",
        "label-dec-search": "Declination (Dec) — [e.g. +41° 16' 07\" or 41.269]",
        "label-search-date": "Observation Date (UT)",
        "label-search-time": "Observation Time (UT)",
        "label-search-radius": "Search Radius (deg.)",
        "label-limit-mag": "Limit Asteroid Mag",
        "btn-search-area": "🔭 Start Area Search",
        "fov-title": "🎯 Field of View (FOV)",
        "fov-desc": "The reticle shows the selected search area (Radius: <span id=\"fovRadiusLabel\">1.5</span>°).",
        "btn-flip-h": "⇄ Mirror Horizontal (RA)",
        "btn-flip-v": "⇅ Mirror Vertical (Dec)",
        "search-status-title": "Celestial Search Status",
        "search-status-default": "Enter coordinates or search for a celestial object to start.",
        "sn-area-title": "🌌 Supernovae Detected in Area",
        "ast-area-title": "☄️ Asteroids Detected in Area (MPC)",
        "fallback-title": "Issue with direct MPC query",
        "fallback-desc": "Direct request to the Minor Planet Center servers has been blocked (CORS or timeout). You can still obtain the official list by submitting the official form in a new window.",
        "btn-fallback": "🔗 Open Search on Minor Planet Center (New Tab)",
        "debug-title": "🛠️ MPC Debug Console (Query Exchange)",
        "debug-toggle": "Expand/Collapse",
        "debug-url-label": "Request URL (via Proxy):",
        "debug-response-label": "HTML Response Received:",
        
        // Table Headers Search
        "th-sn-search": "Supernova",
        "th-type-search": "Type",
        "th-mag-search": "Discovery Mag",
        "th-constellation-search": "Constellation",
        "th-galaxy-search": "Host Galaxy",
        "th-dist-search": "Distance Center",
        "th-phys-search": "Physical Data (RA/Dec)",
        "th-date-search": "Discovery Date",
        
        "th-ast-name": "Asteroid / Designation",
        "th-ast-mag": "Magnitude (V)",
        "th-ast-dist": "Distance Center",
        "th-ast-ra": "Right Ascension (RA)",
        "th-ast-dec": "Declination (Dec)",
        
        "placeholder-no-search": "No search performed. Enter parameters on the left.",
        "placeholder-loading-catalog": "Loading catalog...",
        "placeholder-table-search": "Search by SN, constellation, type...",
        "placeholder-dso-search": "e.g. M31, NGC 7000, Vega...",

        // Dynamic JS Strings
        "gps-status-ready": "GPS Ready",
        "gps-status-detecting": "Detecting...",
        "gps-status-detected": "📍 GPS Detected",
        "gps-status-failed": "Detection failed",
        "gps-status-unsupported": "Unsupported",
        "gps-unsupported": "Geolocation is not supported by your browser.",
        "gps-failed-alert": "Unable to detect location. Please enter coordinates manually.",
        "slider-start-time": "Start Time",
        "slider-radar-start": "T + 0h (Start)",
        "slider-offset-hours": "T + {hours} hours ({time} {tz})",
        "last-update-prefix": "Last update",
        "results-count": "{count} found",
        "results-count-asteroids": "{count} found",
        
        "sun-warning-text": "⚠️ Warning: At {time} {tz} the sun is still high (Alt: {alt}°). Set a nighttime value to detect supernovae visible in the dark!",
        "summary-observer": "Observer: <strong>{lat}° {latDir}</strong>, <strong>{lon}° {lonDir}</strong> | Window: <strong>{date} {time} - {endTime} {tz}</strong>",
        "sn-table-empty": "No visible transients found with current criteria. Try increasing the limiting magnitude or selecting a different date.",
        "search-sn-empty": "No supernovae discovered in the last 6 months detected within this search radius.",
        "search-summary-coords": "Target J2000: <strong>RA: {raStr} ({raDeg}°)</strong> | <strong>Dec: {decStr} ({decDeg}°)</strong> <a href=\"{aladinUrl}\" target=\"_blank\" class=\"btn-aladin-inline\">🌌 Aladin Lite</a><br>Radius: <strong>{radius}°</strong> | Search Date: <strong>{date}</strong>",
        "sn-group-1": "🌌 Very Bright (Magnitude 10 - 13) — [{count} visible, by discovery date]",
        "sn-group-2": "🔭 Bright (Magnitude 13 - 15) — [{count} visible, by discovery date]",
        "sn-group-3": "☄️ Observable (Magnitude 15 - 19) — [{count} visible, by discovery date]",
        "sn-group-4": "Other supernovae (Mag > 19 or N/D) — [{count} visible]",
        "sn-group-empty-msg": "No visible supernovae in this range in these 6 hours.",
        
        "sesame-resolving": "⏳ <strong>SIMBAD Lookup</strong>: Resolving coordinates for <strong>\"{name}\"</strong> in progress via CDS Sesame...",
        "sesame-success": "✅ <strong>SIMBAD</strong>: Object <strong>\"{name}\"</strong> identified! Coordinates loaded (RA: {ra}, Dec: {dec}).",
        "sesame-failed": "❌ <strong>SIMBAD</strong>: Resolution failed for <strong>\"{name}\"</strong> (object not found in catalogs).",
        "sesame-error": "❌ <strong>SIMBAD</strong>: Connection or proxy error during search of <strong>\"{name}\"</strong>.",
        "sesame-suggest-querying": "⏳ Querying CDS Sesame...",
        "sesame-suggest-failed": "❌ Object not found. Try standard designation.",
        "sesame-suggest-error": "❌ Network error or CORS block. Enter coordinates manually.",
        
        "mpc-loading-label": "Querying the Minor Planet Center (MPC)...",
        "mpc-resolving": "⏳ <strong>MPC Lookup</strong>: Querying Minor Planet Center in progress for asteroids...",
        "mpc-success": "✅ <strong>MPC Lookup</strong>: Found <strong>{count}</strong> asteroids within {radius}° (Mag < {limitMag}).",
        "mpc-failed": "❌ <strong>MPC Lookup</strong>: Query failed or blocked. Manual submission available below.",
        "mpc-error-msg": "❌ Unable to load MPC data directly from browser (CORS block, timeout or validation error).<br>Use the orange form below to search MPC in a new tab.",
        "asteroid-empty-msg": "No asteroids of set limiting magnitude detected in this area.",
        
        "host-galaxy-host": "Host Galaxy",
        "host-galaxy-label": "Galaxy",
        "host-galaxy-isolated-label": "Isolated / Unknown",
        "modal-not-visible": "Not optimally visible in this time window.",
        
        "limit-label": "Limit"
    }
};

// Current active language helper
function getLang() {
    return localStorage.getItem("preferred_language") || "it";
}

// Translate key dynamically
function t(key, replacements = {}) {
    const lang = getLang();
    let text = (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || key;
    
    // Perform dynamic replacements
    Object.keys(replacements).forEach(rKey => {
        text = text.replace(new RegExp(`\\{${rKey}\\}`, "g"), replacements[rKey]);
    });
    return text;
}

// Apply translations to all DOM elements
function applyTranslations() {
    const lang = getLang();
    
    // Translate texts
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key] !== undefined) {
            el.innerHTML = TRANSLATIONS[lang][key];
        }
    });
    
    // Translate placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key] !== undefined) {
            el.setAttribute("placeholder", TRANSLATIONS[lang][key]);
        }
    });

    // Update active button state
    document.querySelectorAll(".lang-btn").forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
    });
}

// Initialize translations
function initTranslations() {
    // Add language toggle buttons on load
    const header = document.querySelector(".app-header");
    if (header && !document.querySelector(".lang-selector")) {
        const langSelector = document.createElement("div");
        langSelector.className = "lang-selector";
        langSelector.innerHTML = `
            <button type="button" class="lang-btn" data-lang="it">IT</button>
            <button type="button" class="lang-btn" data-lang="en">EN</button>
        `;
        header.appendChild(langSelector);
        
        // Add click listeners
        langSelector.querySelectorAll(".lang-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const selectedLang = btn.getAttribute("data-lang");
                localStorage.setItem("preferred_language", selectedLang);
                applyTranslations();
                
                // Trigger redraw/recalculation of the active app/search engine
                if (typeof applyCalculation === "function") {
                    applyCalculation();
                } else if (typeof handleSearchSubmit === "function") {
                    // Triggers search recalculation to update translated dynamic tables
                    const searchForm = document.getElementById("searchForm");
                    if (searchForm) {
                        searchForm.dispatchEvent(new Event("submit"));
                    } else {
                        // fallback redraw if no form
                        triggerCoordinatesUpdate();
                    }
                }
            });
        });
    }
    
    applyTranslations();
}

// Bind load event
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTranslations);
} else {
    initTranslations();
}
