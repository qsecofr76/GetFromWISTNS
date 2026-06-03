/* ==========================================================================
   SUPERNOVA HUNTER - CELESTIAL SEARCH ENGINE
   ========================================================================== */

// --- LOCAL DATABASE OF POPULAR CELESTIAL OBJECTS (For Instant Autocomplete) ---
const LOCAL_DSO_CATALOG = [
    // Messier Objects
    { name: "M1", alt: "Crab Nebula", ra: 83.633, dec: 22.014, type: "Nebula" },
    { name: "M8", alt: "Lagoon Nebula", ra: 270.917, dec: -24.383, type: "Nebula" },
    { name: "M13", alt: "Hercules Cluster", ra: 250.421, dec: 36.461, type: "Cluster" },
    { name: "M16", alt: "Eagle Nebula", ra: 274.700, dec: -13.790, type: "Nebula" },
    { name: "M20", alt: "Trifid Nebula", ra: 270.630, dec: -23.030, type: "Nebula" },
    { name: "M27", alt: "Dumbbell Nebula", ra: 299.900, dec: 22.720, type: "Nebula" },
    { name: "M31", alt: "Andromeda Galaxy", ra: 10.6847, dec: 41.2687, type: "Galaxy" },
    { name: "M33", alt: "Triangulum Galaxy", ra: 23.462, dec: 30.660, type: "Galaxy" },
    { name: "M42", alt: "Orion Nebula", ra: 83.822, dec: -5.391, type: "Nebula" },
    { name: "M45", alt: "Pleiades", ra: 56.750, dec: 24.120, type: "Cluster" },
    { name: "M51", alt: "Whirlpool Galaxy", ra: 202.468, dec: 47.195, type: "Galaxy" },
    { name: "M57", alt: "Ring Nebula", ra: 288.158, dec: 33.029, type: "Nebula" },
    { name: "M81", alt: "Bode's Galaxy", ra: 148.888, dec: 69.065, type: "Galaxy" },
    { name: "M82", alt: "Cigar Galaxy", ra: 148.968, dec: 69.679, type: "Galaxy" },
    { name: "M101", alt: "Pinwheel Galaxy", ra: 210.802, dec: 54.348, type: "Galaxy" },
    { name: "M104", alt: "Sombrero Galaxy", ra: 199.997, dec: -11.623, type: "Galaxy" },
    
    // Major Stars
    { name: "Polaris", alt: "Stella Polare", ra: 37.954, dec: 89.264, type: "Star" },
    { name: "Vega", alt: "Alpha Lyrae", ra: 279.234, dec: 38.783, type: "Star" },
    { name: "Sirius", alt: "Alpha Canis Majoris", ra: 101.287, dec: -16.716, type: "Star" },
    { name: "Betelgeuse", alt: "Alpha Orionis", ra: 88.793, dec: 7.407, type: "Star" },
    { name: "Rigel", alt: "Beta Orionis", ra: 78.634, dec: -8.201, type: "Star" },
    { name: "Arcturus", alt: "Alpha Boötis", ra: 213.915, dec: 19.182, type: "Star" },
    { name: "Capella", alt: "Alpha Aurigae", ra: 79.172, dec: 45.998, type: "Star" },
    { name: "Procyon", alt: "Alpha Canis Minoris", ra: 114.825, dec: 5.224, type: "Star" },
    { name: "Altair", alt: "Alpha Aquilae", ra: 297.695, dec: 8.868, type: "Star" },
    { name: "Aldebaran", alt: "Alpha Tauri", ra: 68.980, dec: 16.509, type: "Star" },
    { name: "Spica", alt: "Alpha Virginis", ra: 201.298, dec: -11.161, type: "Star" },
    { name: "Antares", alt: "Alpha Scorpii", ra: 247.351, dec: -26.432, type: "Star" },
    { name: "Deneb", alt: "Alpha Cygni", ra: 310.357, dec: 45.280, type: "Star" },
    
    // Other DSOs
    { name: "NGC 7000", alt: "North America Nebula", ra: 314.750, dec: 44.330, type: "Nebula" },
    { name: "IC 1396", alt: "Elephant's Trunk", ra: 326.170, dec: 57.500, type: "Nebula" },
    { name: "IC 434", alt: "Horsehead Nebula", ra: 85.240, dec: -2.450, type: "Nebula" },
    { name: "NGC 2070", alt: "Tarantula Nebula", ra: 84.677, dec: -69.101, type: "Nebula" }
];

// --- GLOBALS & STATE ---
let allSupernovae = [];
let targetCoords = { ra: 10.6847, dec: 41.2687 }; // Default: M31 coordinates
let searchRadius = 1.5; // default in degrees
let visualizerCanvas;
let visualizerCtx;

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    initElements();
    initCanvas();
    loadSupernovaeCatalog();
    
    // Event listeners
    document.getElementById("dsoSearch").addEventListener("input", handleDsoSearchInput);
    document.getElementById("searchForm").addEventListener("submit", handleSearchSubmit);
    document.getElementById("searchRadius").addEventListener("input", handleRadiusInput);
    
    // Hide suggestions list when clicking outside
    document.addEventListener("click", (e) => {
        if (e.target.id !== "dsoSearch" && !e.target.closest(".suggestions-list")) {
            document.getElementById("searchSuggestions").style.display = "none";
        }
    });

    // Populate initial visualizer
    drawTargetVisualizer([], []);
});

function initElements() {
    const today = new Date();
    document.getElementById("searchDate").value = today.toISOString().split('T')[0];
    
    // Format UT hour and minute
    const hours = String(today.getUTCHours()).padStart(2, '0');
    const minutes = String(today.getUTCMinutes()).padStart(2, '0');
    document.getElementById("searchTime").value = `${hours}:${minutes}`;
    
    // Default RA/Dec inputs to M31
    document.getElementById("inputRA").value = "00h 42m 44.3s";
    document.getElementById("inputDec").value = "+41° 16' 07.5\"";
}

function initCanvas() {
    visualizerCanvas = document.getElementById("coordVisualizer");
    visualizerCtx = visualizerCanvas.getContext("2d");
}

function handleRadiusInput(e) {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
        document.getElementById("fovRadiusLabel").innerText = val.toFixed(1);
        searchRadius = val;
        drawTargetVisualizer([], []); // redraw background circle
    }
}

// --- DYNAMIC DSO SUGGESTIONS & REMOTE SESAME LOOKUP ---
function handleDsoSearchInput(e) {
    const query = e.target.value.trim().toLowerCase();
    const list = document.getElementById("searchSuggestions");
    
    if (query.length < 1) {
        list.style.display = "none";
        return;
    }
    
    // Filter local dictionary
    const matches = LOCAL_DSO_CATALOG.filter(dso => 
        dso.name.toLowerCase().includes(query) || 
        dso.alt.toLowerCase().includes(query)
    );
    
    if (matches.length === 0) {
        // Offer online lookup option
        list.innerHTML = `
            <div class="suggestion-item" onclick="resolveOnlineDSO('${e.target.value}')">
                <span>🔍 Cerca online: <strong>${e.target.value}</strong></span>
                <span class="type-tag">SIMBAD Lookup</span>
            </div>
        `;
    } else {
        list.innerHTML = matches.map(dso => `
            <div class="suggestion-item" onclick="selectLocalDSO('${dso.name}')">
                <span><strong>${dso.name}</strong> - ${dso.alt}</span>
                <span class="type-tag">${dso.type}</span>
            </div>
        `).join("");
    }
    
    list.style.display = "block";
}

function selectLocalDSO(name) {
    const dso = LOCAL_DSO_CATALOG.find(d => d.name === name);
    if (dso) {
        document.getElementById("dsoSearch").value = `${dso.name} (${dso.alt})`;
        document.getElementById("inputRA").value = formatRA(dso.ra);
        document.getElementById("inputDec").value = formatDec(dso.dec);
        
        // Mark active selection with green glow
        const dsoInput = document.getElementById("dsoSearch");
        dsoInput.classList.add("dso-resolved-badge");
        setTimeout(() => dsoInput.classList.remove("dso-resolved-badge"), 2000);
        
        document.getElementById("searchSuggestions").style.display = "none";
        triggerCoordinatesUpdate();
    }
}

async function resolveOnlineDSO(objectName) {
    const list = document.getElementById("searchSuggestions");
    list.innerHTML = `<div class="suggestion-item" style="cursor: default;"><span>⏳ Interrogazione CDS Sesame...</span></div>`;
    
    // Update banner with resolution status
    const banner = document.getElementById("searchInfoBanner");
    const summary = document.getElementById("searchSummaryText");
    summary.innerHTML = `⏳ <strong>SIMBAD Lookup</strong>: Risoluzione coordinate per <strong>"${objectName}"</strong> in corso tramite CDS Sesame...`;
    banner.className = "info-banner";

    try {
        const cleanName = objectName.replace(/[^a-zA-Z0-9\s+-]/g, '').trim();
        const targetUrl = `https://cds.unistra.fr/cgi-bin/nph-sesame/-oX/S?${encodeURIComponent(cleanName)}`;
        const proxyUrl = `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(targetUrl)}`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("CORS Proxy error");
        
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        
        const raNode = xmlDoc.querySelector("jradeg");
        const decNode = xmlDoc.querySelector("jdedeg");
        const nameNode = xmlDoc.querySelector("name");
        
        if (raNode && decNode) {
            const ra = parseFloat(raNode.textContent);
            const dec = parseFloat(decNode.textContent);
            const resolvedName = nameNode ? nameNode.textContent : objectName;
            
            document.getElementById("dsoSearch").value = resolvedName;
            document.getElementById("inputRA").value = formatRA(ra);
            document.getElementById("inputDec").value = formatDec(dec);
            
            // Success animation
            const dsoInput = document.getElementById("dsoSearch");
            dsoInput.classList.add("dso-resolved-badge");
            setTimeout(() => dsoInput.classList.remove("dso-resolved-badge"), 2000);
            
            summary.innerHTML = `✅ <strong>SIMBAD</strong>: Oggetto <strong>"${resolvedName}"</strong> identificato! Coordinate caricate (RA: ${formatRA(ra)}, Dec: ${formatDec(dec)}).`;
            
            list.style.display = "none";
            triggerCoordinatesUpdate();
        } else {
            list.innerHTML = `<div class="suggestion-item" style="color: var(--neon-red); cursor: default;"><span>❌ Oggetto non trovato. Riprova con una sigla standard.</span></div>`;
            summary.innerHTML = `❌ <strong>SIMBAD</strong>: Risoluzione fallita per <strong>"${objectName}"</strong> (oggetto non trovato nei cataloghi).`;
            banner.className = "info-banner banner-warning";
        }
    } catch (error) {
        console.error(error);
        list.innerHTML = `<div class="suggestion-item" style="color: var(--neon-red); cursor: default;"><span>❌ Errore di rete o blocco CORS. Inserisci coordinate manualmente.</span></div>`;
        summary.innerHTML = `❌ <strong>SIMBAD</strong>: Errore di connessione o proxy durante la ricerca di <strong>"${objectName}"</strong>.`;
        banner.className = "info-banner banner-warning";
    }
}

function triggerCoordinatesUpdate() {
    // Redraw viz based on newly resolved inputs
    const parsed = getFormCoordinates();
    if (parsed) {
        targetCoords = parsed;
        drawTargetVisualizer([], []);
    }
}

// --- COORDINATE PARSING UTILITIES ---

function parseRA(raInput) {
    raInput = raInput.trim();
    if (isNaN(raInput)) {
        // Match sexagesimal hours: e.g. 00h 42m 44.3s or 00:42:44.3
        const regex = /(?:(\d+)\s*[h:]\s*)?(?:(\d+)\s*[m:]\s*)?(\d+(?:\.\d+)?)\s*s?/i;
        const match = raInput.match(regex);
        if (match) {
            const h = parseFloat(match[1] || 0);
            const m = parseFloat(match[2] || 0);
            const s = parseFloat(match[3] || 0);
            return (h + m / 60 + s / 3600) * 15; // convert to degrees
        }
    }
    return parseFloat(raInput);
}

function parseDec(decInput) {
    decInput = decInput.trim();
    if (isNaN(decInput)) {
        // Match sexagesimal degrees: e.g. +41° 16' 07.5" or -41:16:07.5
        const regex = /([+-]?)\s*(?:(\d+)\s*[°d:]\s*)?(?:(\d+)\s*['m:]\s*)?(\d+(?:\.\d+)?)\s*"?/i;
        const match = decInput.match(regex);
        if (match) {
            const sign = match[1] === '-' ? -1 : 1;
            const d = parseFloat(match[2] || 0);
            const m = parseFloat(match[3] || 0);
            const s = parseFloat(match[4] || 0);
            return sign * (d + m / 60 + s / 3600);
        }
    }
    return parseFloat(decInput);
}

// Formatting helpers
function formatRA(raDegrees) {
    const hoursDecimal = raDegrees / 15;
    const h = Math.floor(hoursDecimal);
    const minsDecimal = (hoursDecimal - h) * 60;
    const m = Math.floor(minsDecimal);
    const s = ((minsDecimal - m) * 60).toFixed(1);
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(4, '0')}s`;
}

function formatDec(decDegrees) {
    const sign = decDegrees >= 0 ? '+' : '-';
    const absDec = Math.abs(decDegrees);
    const d = Math.floor(absDec);
    const minsDecimal = (absDec - d) * 60;
    const m = Math.floor(minsDecimal);
    const s = ((minsDecimal - m) * 60).toFixed(1);
    return `${sign}${String(d).padStart(2, '0')}° ${String(m).padStart(2, '0')}' ${String(s).padStart(4, '0')}"`;
}

// --- PRECESSION (JNow -> J2000) ---
function precessJNowToJ2000(raDeg, decDeg, date) {
    const year = date.getFullYear() + (date.getMonth() + 0.5) / 12;
    const dy = 2000 - year; // reverse precession to bring coordinates back to J2000
    
    // Constants per year in degrees
    const m = 3.07496 / 3600 * 15; // ~0.0128 degrees
    const n = 1.33621 / 3600 * 15; // ~0.0055 degrees
    
    const raRad = raDeg * Math.PI / 180;
    const decRad = decDeg * Math.PI / 180;
    
    const dRa = (m + n * Math.sin(raRad) * Math.tan(decRad)) * dy;
    const dDec = (n * Math.cos(raRad)) * dy;
    
    let raJ2000 = raDeg + dRa;
    let decJ2000 = decDeg + dDec;
    
    raJ2000 = (raJ2000 % 360 + 360) % 360;
    decJ2000 = Math.max(-90, Math.min(90, decJ2000));
    
    return { ra: raJ2000, dec: decJ2000 };
}

// Spherical Distance (degrees)
function getAngularDistance(ra1, dec1, ra2, dec2) {
    const ra1Rad = ra1 * Math.PI / 180;
    const dec1Rad = dec1 * Math.PI / 180;
    const ra2Rad = ra2 * Math.PI / 180;
    const dec2Rad = dec2 * Math.PI / 180;
    
    const cosD = Math.sin(dec1Rad) * Math.sin(dec2Rad) + 
                 Math.cos(dec1Rad) * Math.cos(dec2Rad) * Math.cos(ra1Rad - ra2Rad);
                 
    return Math.acos(Math.max(-1, Math.min(1, cosD))) * 180 / Math.PI;
}

// --- CATALOG LOADERS ---
async function loadSupernovaeCatalog() {
    try {
        const response = await fetch('./supernovae.json');
        if (!response.ok) throw new Error("Catalog fetch error");
        const data = await response.json();
        allSupernovae = data.supernovae || [];
        console.log(`[+] Caricate ${allSupernovae.length} supernove.`);
    } catch (e) {
        console.error("Non è stato possibile caricare supernovae.json:", e);
    }
}

// --- FORM AND SEARCH SUBMISSIONS ---

function getFormCoordinates() {
    const raInput = document.getElementById("inputRA").value;
    const decInput = document.getElementById("inputDec").value;
    
    const ra = parseRA(raInput);
    const dec = parseDec(decInput);
    
    if (isNaN(ra) || isNaN(dec)) {
        return null;
    }
    return { ra, dec };
}

async function handleSearchSubmit(e) {
    e.preventDefault();
    
    const parsed = getFormCoordinates();
    if (!parsed) {
        alert("Inserisci coordinate RA e Dec valide.");
        return;
    }
    
    // Gather date/time
    const dateVal = document.getElementById("searchDate").value;
    const timeVal = document.getElementById("searchTime").value;
    const [y, mo, d] = dateVal.split("-").map(Number);
    const [h, mi] = timeVal.split(":").map(Number);
    const searchDateObj = new Date(Date.UTC(y, mo - 1, d, h, mi));
    
    const epochSystem = document.querySelector('input[name="coordEpoch"]:checked').value;
    const inputRAVal = parsed.ra;
    const inputDecVal = parsed.dec;
    
    let j2000Coords = { ra: inputRAVal, dec: inputDecVal };
    
    // Convert JNow to J2000 if chosen
    if (epochSystem === "JNow") {
        j2000Coords = precessJNowToJ2000(inputRAVal, inputDecVal, searchDateObj);
        console.log(`[i] Precessato JNow (${inputRAVal.toFixed(3)}, ${inputDecVal.toFixed(3)}) -> J2000 (${j2000Coords.ra.toFixed(3)}, ${j2000Coords.dec.toFixed(3)})`);
    }
    
    targetCoords = j2000Coords;
    searchRadius = parseFloat(document.getElementById("searchRadius").value);
    const limitMag = parseFloat(document.getElementById("limitMag").value);
    
    // Update Information Banner
    updateBannerInfo(j2000Coords, searchRadius, searchDateObj);
    
    // 1. Search Supernovae locally
    const matchedSNe = searchSupernovae(j2000Coords, searchRadius);
    renderSupernovaeTable(matchedSNe);
    
    // 2. Query Asteroids from MPC
    renderAsteroidsLoading();
    const matchedAsteroids = await queryMPCAsteroids(j2000Coords, searchRadius, limitMag, searchDateObj);
    
    // Redraw visualizer with new coordinates
    drawTargetVisualizer(matchedSNe, matchedAsteroids);
}

function updateBannerInfo(coords, radius, date) {
    const banner = document.getElementById("searchInfoBanner");
    const summary = document.getElementById("searchSummaryText");
    
    const formattedDate = date.toUTCString();
    summary.innerHTML = `
        Target J2000: <strong>RA: ${formatRA(coords.ra)} (${coords.ra.toFixed(3)}°)</strong> | 
        <strong>Dec: ${formatDec(coords.dec)} (${coords.dec.toFixed(3)}°)</strong><br>
        Raggio: <strong>${radius}°</strong> | Data Ricerca: <strong>${formattedDate}</strong>
    `;
    banner.className = "info-banner";
}

// --- SEARCH SUPERNOVAE LOGIC ---
function searchSupernovae(center, radius) {
    const results = [];
    allSupernovae.forEach(sn => {
        const dist = getAngularDistance(center.ra, center.dec, sn.ra, sn.dec);
        if (dist <= radius) {
            results.push({
                ...sn,
                distance: dist
            });
        }
    });
    // Sort by distance ascending
    return results.sort((a, b) => a.distance - b.distance);
}

function renderSupernovaeTable(list) {
    const tbody = document.getElementById("snResultsBody");
    const countBadge = document.getElementById("snCountBadge");
    
    countBadge.innerText = `${list.length} trovate`;
    
    if (list.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="table-placeholder">
                    Nessuna supernova scoperta negli ultimi 6 mesi rilevata in questo raggio di visualizzazione.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = list.map(sn => {
        let typeClass = "badge-info";
        if (sn.type.includes("Ia")) typeClass = "badge-purple";
        else if (sn.type.includes("II")) typeClass = "badge-pink";
        else if (sn.type.includes("SLSN")) typeClass = "badge-gold";
        
        const hostGal = sn.host_galaxy && sn.host_galaxy !== "N/A" ? sn.host_galaxy : "<span class='text-muted'>Isolata</span>";
        
        return `
            <tr>
                <td><span style="color: var(--neon-cyan); font-weight: 700;">${sn.prefix} ${sn.name}</span></td>
                <td><span class="badge ${typeClass}">${sn.type}</span></td>
                <td class="sn-mag-cell" style="color: var(--neon-gold); font-weight: 600;">${sn.discoverymag ? sn.discoverymag.toFixed(1) : "N/D"}</td>
                <td>${sn.constellation}</td>
                <td style="color: var(--text-primary); font-weight: 500;">${hostGal}</td>
                <td><strong>${sn.distance.toFixed(3)}°</strong></td>
                <td style="font-family: monospace; font-size: 0.75rem;">RA: ${formatRA(sn.ra)}<br>Dec: ${formatDec(sn.dec)}</td>
                <td>${sn.discoverydate ? sn.discoverydate.substring(0,10) : "N/D"}</td>
            </tr>
        `;
    }).join("");
}

// --- MPC QUERY SCRAPER LOGIC ---

function decimalUTDay(date) {
    const day = date.getUTCDate();
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const seconds = date.getUTCSeconds();
    
    const decimalDay = day + (hours / 24) + (minutes / 1440) + (seconds / 86400);
    return decimalDay.toFixed(2);
}

function decimalToMPCFormat(raDeg, decDeg) {
    // Convert RA decimal to HH MM SS.s
    const hoursDecimal = raDeg / 15;
    const h = Math.floor(hoursDecimal);
    const mDecimal = (hoursDecimal - h) * 60;
    const m = Math.floor(mDecimal);
    const s = ((mDecimal - m) * 60).toFixed(1);
    const raStr = `${String(h).padStart(2,'0')} ${String(m).padStart(2,'0')} ${String(s).padStart(4,'0')}`;
    
    // Convert Dec decimal to +DD MM SS
    const sign = decDeg >= 0 ? '+' : '-';
    const absDec = Math.abs(decDeg);
    const d = Math.floor(absDec);
    const decMDecimal = (absDec - d) * 60;
    const decM = Math.floor(decMDecimal);
    const decS = ((decMDecimal - decM) * 60).toFixed(0);
    const decStr = `${sign}${String(d).padStart(2,'0')} ${String(decM).padStart(2,'0')} ${String(decS).padStart(2,'0')}`;
    
    return { raStr, decStr };
}

function renderAsteroidsLoading() {
    document.getElementById("asteroidResultsBody").innerHTML = `
        <tr>
            <td colspan="8" class="table-placeholder">
                <div class="loader"></div>
                <p>Interrogazione in corso del Minor Planet Center (MPC)...</p>
            </td>
        </tr>
    `;
    document.getElementById("mpcFallbackContainer").style.display = "none";
}

async function queryMPCAsteroids(coords, radiusDeg, limitMag, date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dayStr = decimalUTDay(date);
    
    const { raStr, decStr } = decimalToMPCFormat(coords.ra, coords.dec);
    const radiusArcmin = Math.round(radiusDeg * 60); // 1 degree = 60 arcminutes
    
    // Set fallback inputs
    document.getElementById("fallbackYear").value = year;
    document.getElementById("fallbackMonth").value = month;
    document.getElementById("fallbackDay").value = dayStr;
    document.getElementById("fallbackRA").value = raStr;
    document.getElementById("fallbackDec").value = decStr;
    document.getElementById("fallbackRadius").value = radiusArcmin;
    document.getElementById("fallbackLimit").value = limitMag;

    const summary = document.getElementById("searchSummaryText");
    const originalText = summary.innerHTML;
    summary.innerHTML = originalText + `<br>⏳ <strong>MPC Lookup</strong>: Interrogazione del Minor Planet Center in corso per asteroidi...`;

    const mpcUrl = `https://minorplanetcenter.net/cgi-bin/mpcheck.cgi?year=${year}&month=${month}&day=${dayStr}&which=pos&ra=${encodeURIComponent(raStr)}&decl=${encodeURIComponent(decStr)}&TextArea=&radius=${radiusArcmin}&limit=${limitMag}&oc=500&sort=d&mot=h&tmot=s&pdes=u&needed=f&ps=n&type=p`;
    
    const proxyUrl = `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(mpcUrl)}`;
    
    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("MPC Query failed");
        
        const html = await response.text();
        
        // Check if the MPC returned its WebCS validation error
        if (html.includes("Error from WebCS Script") || html.includes("Invalid data")) {
            throw new Error("MPC WebCS validation failed");
        }
        
        const parsedAsteroids = parseMPCHtml(html);
        
        renderAsteroidsTable(parsedAsteroids);
        summary.innerHTML = originalText + `<br>✅ <strong>MPC Lookup</strong>: Trovati <strong>${parsedAsteroids.length}</strong> asteroidi nel raggio di ${radiusDeg}° (Mag < ${limitMag}).`;
        return parsedAsteroids;
    } catch (e) {
        console.error("CORS MPC fetch failed, showing fallback redirection options.", e);
        
        // Show fallback UI
        document.getElementById("mpcFallbackContainer").style.display = "block";
        document.getElementById("asteroidResultsBody").innerHTML = `
            <tr>
                <td colspan="8" class="table-placeholder" style="color: var(--neon-red);">
                    ❌ Impossibile caricare direttamente i dati MPC dal browser (blocco CORS, timeout o errore di validazione).<br>
                    Usa il modulo arancione visualizzato qui sotto per consultare MPC in una nuova scheda.<br>
                    <span style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace; display: inline-block; margin-top: 8px;">Dettaglio Errore: ${e.message || e.toString()}</span>
                </td>
            </tr>
        `;
        summary.innerHTML = originalText + `<br>❌ <strong>MPC Lookup</strong>: Query fallita o bloccata. Compilazione manuale disponibile sotto.`;
        return [];
    }
}

function parseMPCHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const pre = doc.querySelector("pre");
    
    if (!pre) return [];
    
    const text = pre.textContent || pre.innerText;
    const lines = text.split("\n");
    const asteroids = [];
    
    // Example of MPC data lines inside <pre>:
    // (1015) Christa          00 42 12.1 +41 12 34  14.5  e   orbit    2.3w  4.5s  ...
    // Match line: name/designation (can contain spaces), coordinates, magnitude
    // Standard format matches:
    // Name (1-20 chars) | RA (00 00 00.0) | Dec (+00 00 00) | V (mag) | Orbit type
    const regex = /^\s*([\w\s()-]+?)\s+(\d{2}\s\d{2}\s\d{2}(?:\.\d+)?)\s+([+-]\d{2}\s\d{2}\s\d{2}(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:(\w+)\s+)?([\d.-]+[nesw])\s+([\d.-]+[nesw])\s+([\d.-]+)\s+([\d.-]+)/i;
    
    lines.forEach(line => {
        const match = line.match(regex);
        if (match) {
            const name = match[1].trim();
            const raRaw = match[2].trim();
            const decRaw = match[3].trim();
            const vMag = parseFloat(match[4]);
            const orbit = match[5];
            const offsetRa = match[7];
            const offsetDec = match[8];
            const motRa = match[9];
            const motDec = match[10];
            
            // Convert RA/Dec sexagesimal back to decimal degrees for visualizer plotting
            const raParts = raRaw.split(" ").map(Number);
            const decParts = decRaw.replace("+", "").split(" ").map(Number);
            const decSign = decRaw.startsWith("-") ? -1 : 1;
            
            const raDeg = (raParts[0] + raParts[1] / 60 + raParts[2] / 3600) * 15;
            const decDeg = decSign * (decParts[0] + decParts[1] / 60 + decParts[2] / 3600);
            
            // Calculate actual angular distance from center
            const distance = getAngularDistance(targetCoords.ra, targetCoords.dec, raDeg, decDeg);
            
            asteroids.push({
                name,
                ra: raDeg,
                dec: decDeg,
                vMag,
                orbit,
                offsetRa,
                offsetDec,
                motRa,
                motDec,
                distance
            });
        }
    });
    
    return asteroids;
}

function renderAsteroidsTable(asteroids) {
    const tbody = document.getElementById("asteroidResultsBody");
    const countBadge = document.getElementById("asteroidCountBadge");
    
    countBadge.innerText = `${asteroids.length} trovati`;
    
    if (asteroids.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="table-placeholder">
                    Nessun asteroide di magnitudine limitante impostata rilevato in questa area.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = asteroids.map(ast => `
        <tr class="asteroids-table-header">
            <td><strong style="color: var(--neon-gold);">${ast.name}</strong></td>
            <td style="color: var(--neon-gold); font-weight: 700;">${ast.vMag.toFixed(1)}</td>
            <td><strong>${ast.distance.toFixed(3)}°</strong></td>
            <td>${ast.offsetRa}</td>
            <td>${ast.offsetDec}</td>
            <td>${ast.motRa} "/h</td>
            <td>${ast.motDec} "/h</td>
            <td><span class="badge badge-gold" style="text-transform: uppercase;">${ast.orbit}</span></td>
        </tr>
    `).join("");
}

// --- MINI TARGET VISUALIZER CANVAS DRAWING ---

function drawTargetVisualizer(supernovae, asteroids) {
    visualizerCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
    
    const w = visualizerCanvas.width;
    const h = visualizerCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const maxFovRadiusPx = w / 2 - 30; // padding
    
    // Draw outer grid lines
    visualizerCtx.strokeStyle = "rgba(139, 92, 246, 0.12)";
    visualizerCtx.lineWidth = 1;
    visualizerCtx.beginPath();
    visualizerCtx.moveTo(cx, 0);
    visualizerCtx.lineTo(cx, h);
    visualizerCtx.moveTo(0, cy);
    visualizerCtx.lineTo(w, cy);
    visualizerCtx.stroke();
    
    // Draw concentric circles representing fraction of the search radius
    visualizerCtx.strokeStyle = "rgba(6, 182, 212, 0.15)";
    [0.33, 0.66, 1.0].forEach(frac => {
        visualizerCtx.beginPath();
        visualizerCtx.arc(cx, cy, maxFovRadiusPx * frac, 0, 2 * Math.PI);
        visualizerCtx.stroke();
    });
    
    // Label for search radius limit
    visualizerCtx.fillStyle = "rgba(148, 163, 184, 0.4)";
    visualizerCtx.font = "9px Inter";
    visualizerCtx.fillText(`${searchRadius.toFixed(1)}° Limit`, cx + 4, cy - maxFovRadiusPx + 12);
    
    // Draw center crosshair (Target Pin)
    visualizerCtx.strokeStyle = "var(--neon-pink)";
    visualizerCtx.lineWidth = 2;
    visualizerCtx.beginPath();
    visualizerCtx.arc(cx, cy, 5, 0, 2 * Math.PI);
    visualizerCtx.stroke();
    
    // Scale coordinate offsets relative to searchRadius
    // 1px = searchRadius / maxFovRadiusPx degrees
    const scale = maxFovRadiusPx / searchRadius;
    
    // Plot Supernovae (Cyan neon dots)
    supernovae.forEach(sn => {
        // Compute delta RA (approx offset in dec scale) and delta Dec
        const dDec = sn.dec - targetCoords.dec;
        const dRa = (sn.ra - targetCoords.ra) * Math.cos(targetCoords.dec * Math.PI / 180);
        
        // Convert to canvas coordinates (flip Y because declination increases upwards)
        const px = cx + dRa * scale;
        const py = cy - dDec * scale;
        
        // Draw glow dot
        visualizerCtx.shadowBlur = 10;
        visualizerCtx.shadowColor = "var(--neon-cyan)";
        visualizerCtx.fillStyle = "var(--neon-cyan)";
        visualizerCtx.beginPath();
        visualizerCtx.arc(px, py, 6, 0, 2 * Math.PI);
        visualizerCtx.fill();
        visualizerCtx.shadowBlur = 0;
        
        // Draw text label
        visualizerCtx.fillStyle = "#fff";
        visualizerCtx.font = "bold 9px Outfit";
        visualizerCtx.fillText(sn.name, px + 8, py + 3);
    });
    
    // Plot Asteroids (Gold neon dots)
    asteroids.forEach(ast => {
        const dDec = ast.dec - targetCoords.dec;
        const dRa = (ast.ra - targetCoords.ra) * Math.cos(targetCoords.dec * Math.PI / 180);
        
        const px = cx + dRa * scale;
        const py = cy - dDec * scale;
        
        // Draw asteroid dot
        visualizerCtx.shadowBlur = 8;
        visualizerCtx.shadowColor = "var(--neon-gold)";
        visualizerCtx.fillStyle = "var(--neon-gold)";
        visualizerCtx.beginPath();
        visualizerCtx.arc(px, py, 4, 0, 2 * Math.PI);
        visualizerCtx.fill();
        visualizerCtx.shadowBlur = 0;
        
        // Label
        visualizerCtx.fillStyle = "var(--text-secondary)";
        visualizerCtx.font = "8px Inter";
        visualizerCtx.fillText(ast.name, px + 7, py + 2);
    });
}
