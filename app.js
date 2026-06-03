/* ==========================================================================
   SUPERNOVA HUNTER - CLIENT-SIDE ASTRONOMICAL ENGINE
   ========================================================================== */

// --- ASTRONOMICAL COMPUTATIONS ---

// 1. Convert Date to Julian Date (JD)
function getJulianDate(date) {
    return (date.getTime() / 86400000) + 2440587.5;
}

// 2. Calculate Greenwich Mean Sidereal Time (GMST) in degrees
function getGMST(date) {
    const jd = getJulianDate(date);
    const T = (jd - 2451545.0) / 36525.0;
    
    // Standard Meeus Formula
    let gmst = 280.46061837 + 
               360.98564736629 * (jd - 2451545.0) + 
               0.000387933 * T * T - 
               T * T * T / 38710000.0;
               
    return (gmst % 360 + 360) % 360;
}

// 3. Convert Equatorial Coordinates (RA/Dec) to Horizon Coordinates (Alt/Az)
function raDecToAltAz(ra, dec, lat, lon, date) {
    // Local Sidereal Time
    const gmst = getGMST(date);
    const lst = (gmst + lon) % 360;
    
    // Local Hour Angle (HA)
    let ha = lst - ra;
    ha = (ha % 360 + 360) % 360;
    
    // Degrees to Radians
    const haRad = ha * Math.PI / 180;
    const decRad = dec * Math.PI / 180;
    const latRad = lat * Math.PI / 180;
    
    // Altitude calculation
    const sinAlt = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
    const altRad = Math.asin(sinAlt);
    const alt = altRad * 180 / Math.PI;
    
    // Azimuth calculation
    const y = -Math.sin(haRad);
    const x = Math.tan(decRad) * Math.cos(latRad) - Math.sin(latRad) * Math.cos(haRad);
    let azRad = Math.atan2(y, x);
    let az = azRad * 180 / Math.PI;
    az = (az % 360 + 360) % 360;
    
    return { alt, az };
}

// 4. Calculate Sun Equatorial coordinates (low-precision USNO method)
function getSunPosition(date) {
    const jd = getJulianDate(date);
    const D = jd - 2451545.0; // Days since J2000
    
    // Mean anomaly of the Sun (degrees)
    let g = 357.529 + 0.98560028 * D;
    // Mean longitude of the Sun (degrees)
    let q = 280.459 + 0.98564736 * D;
    
    const normalize = (angle) => ((angle % 360) + 360) % 360;
    g = normalize(g);
    q = normalize(q);
    
    // Convert g to radians for sin calculations
    const gRad = g * (Math.PI / 180);
    
    // Ecliptic longitude in degrees
    let L = q + (1.915 * Math.sin(gRad)) + (0.020 * Math.sin(2 * gRad));
    L = normalize(L) * (Math.PI / 180); // convert L to radians
    
    // Obliquity of ecliptic in degrees
    let e = 23.439 - 0.00000036 * D;
    e = normalize(e) * (Math.PI / 180); // convert e to radians
    
    // RA and Dec using atan2
    let ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
    let dec = Math.asin(Math.sin(e) * Math.sin(L));
    
    return {
        ra: (ra * (180 / Math.PI) + 360) % 360,
        dec: dec * (180 / Math.PI)
    };
}

// 5. Calculate Sun Altitude
function getSunAltitude(date, lat, lon) {
    const sunPos = getSunPosition(date);
    const altAz = raDecToAltAz(sunPos.ra, sunPos.dec, lat, lon, date);
    return altAz.alt;
}

// 6. Calculate Sunset Time for a given location and day (-0.833° Sun altitude)
function getSunsetTime(date, lat, lon) {
    const noon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    for (let m = 0; m <= 720; m += 2) {
        const checkDate = new Date(noon.getTime() + m * 60 * 1000);
        const alt = getSunAltitude(checkDate, lat, lon);
        if (alt <= -0.833) {
            return checkDate;
        }
    }
    return null;
}

// 6b. Calculate Start of Dark Night (Sun altitude <= -12° for observing)
// This implements a robust default time in the night so that the user is not warned about daylight!
function getDarkNightStartTime(date, lat, lon) {
    const noon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    for (let m = 0; m <= 720; m += 2) {
        const checkDate = new Date(noon.getTime() + m * 60 * 1000);
        const alt = getSunAltitude(checkDate, lat, lon);
        if (alt <= -12.0) {
            return checkDate; // Dark night starts
        }
    }
    // Fallback: 22:00 local time
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 22, 0, 0);
}

// 7. Get Observer Timezone Abbreviation (e.g. CEST, CET, etc.)
function getTimezoneAbbreviation(date) {
    try {
        const parts = new Intl.DateTimeFormat('it-IT', { timeZoneName: 'short' }).formatToParts(date);
        const tzPart = parts.find(p => p.type === 'timeZoneName');
        return tzPart ? tzPart.value : '';
    } catch (e) {
        return '';
    }
}

// --- APP STATE & GLOBALS ---
let allSupernovae = [];
let visibleSupernovae = [];
let observerSettings = {
    lat: 45.7160, // Ponte di Piave default (Venezia/Treviso, Veneto)
    lon: 12.4652,
    date: new Date(),
    maxMag: 19.0,
    minAlt: 10
};

// Canvas variables
let radarCanvas;
let radarCtx;
let plottedRadarObjects = [];

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    initElements();
    parseUrlParams();
    initRadar();
    loadCatalog();
    
    // Add event listeners
    document.getElementById("configForm").addEventListener("submit", handleConfigSubmit);
    document.getElementById("btnGps").addEventListener("click", detectGpsLocation);
    document.getElementById("btnTonight").addEventListener("click", setTonightTime);
    document.getElementById("timeSlider").addEventListener("input", handleTimeSliderInput);
    document.getElementById("tableSearch").addEventListener("input", handleSearch);
    
    // Collapsible Observer Config Panel on Mobile
    const configHeader = document.querySelector(".config-panel .card-header");
    const configForm = document.getElementById("configForm");
    if (configHeader && configForm) {
        configHeader.addEventListener("click", () => {
            if (window.innerWidth < 768) {
                configForm.classList.toggle("collapsed");
                configHeader.classList.toggle("form-collapsed");
            }
        });
        
        // Auto-collapse on small screens initially
        if (window.innerWidth < 768) {
            configForm.classList.add("collapsed");
            configHeader.classList.add("form-collapsed");
        }
    }

    // Modal events
    document.getElementById("modalClose").addEventListener("click", closeModal);
    document.getElementById("btnModalClose").addEventListener("click", closeModal);
    window.addEventListener("click", (e) => {
        if (e.target === document.getElementById("detailModal")) {
            closeModal();
        }
    });

    // Listen to changes to dynamically update nav link
    document.getElementById("obsDate").addEventListener("input", updateNavToSearch);
    document.getElementById("obsTime").addEventListener("input", updateNavToSearch);
    updateNavToSearch();
});

function initElements() {
    const today = new Date();
    document.getElementById("obsDate").value = today.toISOString().split('T')[0];
    
    // Default observer coordinates: Ponte di Piave
    const lat = 45.7160;
    const lon = 12.4652;
    document.getElementById("lat").value = "45.7160";
    document.getElementById("lon").value = "12.4652";
    
    // Check if current time is already dark (Sun altitude <= -12°)
    const currentSunAlt = getSunAltitude(today, lat, lon);
    let targetTime = today;
    
    // If it is currently daytime or bright twilight, default to the start of dark night!
    if (currentSunAlt > -12.0) {
        const darkStart = getDarkNightStartTime(today, lat, lon);
        if (darkStart) {
            targetTime = darkStart;
        }
    }
    
    // Format hour and minute
    const hours = String(targetTime.getHours()).padStart(2, '0');
    const minutes = String(targetTime.getMinutes()).padStart(2, '0');
    document.getElementById("obsTime").value = `${hours}:${minutes}`;
}

// Parse GET URL parameters if present (e.g. ?lat=45.7160&lon=12.4652&date=2026-06-01&time=22:00)
function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    let hasParams = false;
    
    if (params.has("lat")) {
        document.getElementById("lat").value = parseFloat(params.get("lat"));
        hasParams = true;
    } else {
        document.getElementById("lat").value = "45.7160"; // Ponte di Piave default
    }
    if (params.has("lon")) {
        document.getElementById("lon").value = parseFloat(params.get("lon"));
        hasParams = true;
    } else {
        document.getElementById("lon").value = "12.4652"; // Ponte di Piave default
    }
    if (params.has("date")) {
        document.getElementById("obsDate").value = params.get("date");
        hasParams = true;
    }
    if (params.has("time")) {
        document.getElementById("obsTime").value = params.get("time");
        hasParams = true;
    }
    if (params.has("mag")) {
        document.getElementById("maxMag").value = parseFloat(params.get("mag"));
    }
    if (params.has("alt")) {
        document.getElementById("minAlt").value = parseInt(params.get("alt"));
    }
    
    // If coordinates are provided in URL but no time, default to dark night start
    if (hasParams && params.has("lat") && params.has("lon") && !params.has("time")) {
        const lat = parseFloat(params.get("lat"));
        const lon = parseFloat(params.get("lon"));
        const today = new Date();
        
        const currentSunAlt = getSunAltitude(today, lat, lon);
        let targetTime = today;
        
        if (currentSunAlt > -12.0) {
            const darkStart = getDarkNightStartTime(today, lat, lon);
            if (darkStart) {
                targetTime = darkStart;
            }
        }
        
        const hours = String(targetTime.getHours()).padStart(2, '0');
        const minutes = String(targetTime.getMinutes()).padStart(2, '0');
        document.getElementById("obsTime").value = `${hours}:${minutes}`;
    }
    
    if (!hasParams) {
        // Show configuration panel clearly if no parameters are passed
        document.getElementById("configPanel").classList.add("highlight-panel");
    }
}

// Initialize Canvas Sky Radar
function initRadar() {
    radarCanvas = document.getElementById("skyRadar");
    radarCtx = radarCanvas.getContext("2d");
    
    // Canvas click event to open details modal of supernova
    radarCanvas.addEventListener("click", (e) => {
        const rect = radarCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const clickedObj = plottedRadarObjects.find(obj => {
            const dx = mouseX - obj.x;
            const dy = mouseY - obj.y;
            const threshold = Math.max(12, obj.size + 8);
            return (dx * dx + dy * dy) <= (threshold * threshold);
        });
        
        if (clickedObj) {
            openModal(clickedObj.sn.objid);
        }
    });

    // Hover effect (change cursor to pointer)
    radarCanvas.addEventListener("mousemove", (e) => {
        const rect = radarCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const isHovering = plottedRadarObjects.some(obj => {
            const dx = mouseX - obj.x;
            const dy = mouseY - obj.y;
            const threshold = Math.max(12, obj.size + 8);
            return (dx * dx + dy * dy) <= (threshold * threshold);
        });
        
        radarCanvas.style.cursor = isHovering ? "pointer" : "default";
    });
}

// Load Supernovae Catalog JSON file
async function loadCatalog() {
    try {
        const response = await fetch('./supernovae.json');
        if (!response.ok) {
            throw new Error("Impossibile caricare il catalogo JSON.");
        }
        const data = await response.json();
        allSupernovae = data.supernovae || [];
        
        // Show update timestamp in footer
        if (data.metadata && data.metadata.generated_at) {
            document.getElementById("lastUpdateText").innerText = `${t("last-update-prefix")}: ${data.metadata.generated_at}`;
        }
        
        console.log(`[+] Caricate ${allSupernovae.length} supernove dal catalogo.`);
        
        // Trigger initial calculation
        applyCalculation();
        
    } catch (error) {
        console.error("[!] Errore di caricamento:", error);
        let errorMsg = `<p style="color: var(--neon-red)">❌ Errore nel caricamento del catalogo. Assicurati che 'supernovae.json' sia presente nella cartella principale.</p>`;
        
        if (window.location.protocol === 'file:') {
            errorMsg = `
                <div style="text-align: left; max-width: 600px; margin: 0 auto; padding: 18px; background: rgba(239, 68, 68, 0.1); border: 1px solid var(--neon-red); border-radius: 8px; font-family: var(--font-sans);">
                    <h4 style="color: var(--neon-red); margin-bottom: 8px; font-family: var(--font-display); font-size: 0.95rem;">⚠️ Sicurezza del Browser (CORS local file://)</h4>
                    <p style="font-size: 0.8rem; margin-bottom: 12px; line-height: 1.5; color: var(--text-primary);">
                        I browser moderni bloccano il caricamento di file JSON esterni o locali (tramite <code>fetch</code>) quando la pagina HTML viene aperta facendo doppio clic direttamente sul file (indirizzo <code>file://</code>).
                    </p>
                    <p style="font-size: 0.8rem; font-weight: 600; margin-bottom: 6px; color: var(--neon-cyan);">Risoluzione rapida - Avvia un server web locale:</p>
                    <ol style="font-size: 0.8rem; margin-left: 20px; margin-bottom: 12px; line-height: 1.5; color: var(--text-secondary);">
                        <li>Apri il terminale (o PowerShell) nella cartella del progetto: <code>C:\\ProgettiVari\\SupernovaHunter</code></li>
                        <li>Esegui il comando Python: <code style="background: rgba(0,0,0,0.5); padding: 2px 6px; border-radius: 4px; color: #fff; font-family: monospace;">python -m http.server 8000</code></li>
                        <li>Oppure il comando Node: <code style="background: rgba(0,0,0,0.5); padding: 2px 6px; border-radius: 4px; color: #fff; font-family: monospace;">npx http-server -p 8000</code></li>
                        <li>Apri nel browser l'indirizzo: <a href="http://localhost:8000" target="_blank" style="color: var(--neon-cyan); text-decoration: underline; font-weight: 600;">http://localhost:8000</a></li>
                    </ol>
                    <p style="font-size: 0.75rem; color: var(--text-muted);">
                        Nota: Una volta caricato su GitHub Pages, il catalogo funzionerà automaticamente online senza bisogno di fare nient'altro!
                    </p>
                </div>
            `;
        }
        
        document.getElementById("snTableBody").innerHTML = `
            <tr>
                <td colspan="10" class="table-placeholder">
                    ${errorMsg}
                </td>
            </tr>
        `;
    }
}

// --- GPS & CONFIG ACTIONS ---

// Detect browser Geolocation and auto-set time to its dark night start
function detectGpsLocation() {
    const gpsStatus = document.getElementById("gpsStatus");
    gpsStatus.innerText = t("gps-status-detecting");
    gpsStatus.className = "badge badge-purple";
    
    if (!navigator.geolocation) {
        gpsStatus.innerText = t("gps-status-unsupported");
        gpsStatus.className = "badge badge-pink";
        alert(t("gps-unsupported"));
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            document.getElementById("lat").value = lat.toFixed(4);
            document.getElementById("lon").value = lon.toFixed(4);
            gpsStatus.innerText = t("gps-status-detected");
            gpsStatus.className = "badge badge-green";
            
            // Auto-calculate dark night start time for their coordinates
            const today = new Date();
            const currentSunAlt = getSunAltitude(today, lat, lon);
            let targetTime = today;
            if (currentSunAlt > -12.0) {
                const darkStart = getDarkNightStartTime(today, lat, lon);
                if (darkStart) {
                    targetTime = darkStart;
                }
            }
            
            const hours = String(targetTime.getHours()).padStart(2, '0');
            const minutes = String(targetTime.getMinutes()).padStart(2, '0');
            document.getElementById("obsTime").value = `${hours}:${minutes}`;
            
            // Run calculation immediately
            applyCalculation();
        },
        (error) => {
            gpsStatus.innerText = t("gps-status-failed");
            gpsStatus.className = "badge badge-pink";
            alert(t("gps-failed-alert"));
        },
        { enableHighAccuracy: true, timeout: 5000 }
    );
}

// Quick set tonight observation (calculating the dark night start)
function setTonightTime() {
    const today = new Date();
    let lat = parseFloat(document.getElementById("lat").value);
    let lon = parseFloat(document.getElementById("lon").value);
    
    if (isNaN(lat) || isNaN(lon)) {
        lat = 45.7160;
        lon = 12.4652;
        document.getElementById("lat").value = "45.7160";
        document.getElementById("lon").value = "12.4652";
    }
    
    document.getElementById("obsDate").value = today.toISOString().split('T')[0];
    
    // Calculate the start of dark night (Sun altitude <= -12°)
    const darkStart = getDarkNightStartTime(today, lat, lon);
    let targetTime = today;
    if (darkStart) {
        targetTime = darkStart;
    } else {
        // Fallback
        targetTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 22, 0, 0);
    }
    
    const hours = String(targetTime.getHours()).padStart(2, '0');
    const minutes = String(targetTime.getMinutes()).padStart(2, '0');
    document.getElementById("obsTime").value = `${hours}:${minutes}`;
    applyCalculation();
}

// Form Submission
function handleConfigSubmit(e) {
    e.preventDefault();
    applyCalculation();
}

// --- CORE CALCULATION ENGINE ---

function applyCalculation() {
    // 1. Gather inputs
    let lat = parseFloat(document.getElementById("lat").value);
    let lon = parseFloat(document.getElementById("lon").value);
    
    // Fallback to Ponte di Piave if coordinate fields are empty or invalid
    if (isNaN(lat) || isNaN(lon)) {
        lat = 45.7160;
        lon = 12.4652;
        document.getElementById("lat").value = "45.7160";
        document.getElementById("lon").value = "12.4652";
    }
    
    const dateStr = document.getElementById("obsDate").value;
    const timeStr = document.getElementById("obsTime").value;
    const maxMag = parseFloat(document.getElementById("maxMag").value);
    const minAlt = parseFloat(document.getElementById("minAlt").value);
    
    if (isNaN(lat) || isNaN(lon)) {
        alert("Inserisci latitudine e longitudine valide.");
        return;
    }
    
    // Parse selected Date/Time in local timezone
    const [year, month, day] = dateStr.split("-");
    const [hours, minutes] = timeStr.split(":");
    const startDate = new Date(year, month - 1, day, hours, minutes, 0);
    
    observerSettings = { lat, lon, date: startDate, maxMag, minAlt };
    
    // 2. Perform 6-hour visibility window query
    // Check 13 checkpoints (every 30 minutes) from T+0h to T+6h
    visibleSupernovae = [];
    
    const filterMagSNe = allSupernovae.filter(sn => sn.discoverymag !== null && sn.discoverymag <= maxMag);
    
    filterMagSNe.forEach(sn => {
        let isVisibleInWindow = false;
        let peakAlt = -90;
        let peakAz = 0;
        let peakTime = null;
        let visibleSegments = [];
        
        for (let i = 0; i <= 12; i++) {
            const offsetHours = i * 0.5;
            const checkDate = new Date(startDate.getTime() + offsetHours * 3600000);
            
            // Check Sun altitude (must be < -12° for dark night sky)
            const sunAlt = getSunAltitude(checkDate, lat, lon);
            const isNight = sunAlt < -12;
            
            // Calculate SN Alt-Az
            const snAltAz = raDecToAltAz(sn.ra, sn.dec, lat, lon, checkDate);
            const isAboveHorizon = snAltAz.alt >= minAlt;
            
            // Track highest altitude reached during the 6-hour window
            if (snAltAz.alt > peakAlt) {
                peakAlt = snAltAz.alt;
                peakAz = snAltAz.az;
                peakTime = checkDate;
            }
            
            if (isNight && isAboveHorizon) {
                isVisibleInWindow = true;
                visibleSegments.push({
                    time: formatHoursOffset(startDate, checkDate),
                    alt: snAltAz.alt,
                    az: snAltAz.az
                });
            }
        }
        
        if (isVisibleInWindow) {
            visibleSupernovae.push({
                ...sn,
                peakAlt,
                peakAz,
                peakTime,
                visibleSegments
            });
        }
    });
    
    // 3. Update Observer Info Summary Banner
    updateSummaryBanner(startDate, lat, lon);
    
    // 4. Reset Slider to T + 0
    document.getElementById("timeSlider").value = 0;
    
    const tz = getTimezoneAbbreviation(startDate);
    const currentLocale = getLang() === 'it' ? 'it-IT' : 'en-US';
    const startStr = startDate.toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' });
    document.getElementById("sliderValue").innerText = `${t("slider-start-time")} (${startStr} ${tz})`;
    document.getElementById("radarTimeLabel").innerText = t("slider-radar-start");
    
    // 5. Draw Celestial Radar at T+0h
    drawRadar(0);
    
    // 6. Build the table results
    renderTable();

    // 7. Update Navigation link
    updateNavToSearch();
}

function updateSummaryBanner(startDate, lat, lon) {
    const banner = document.getElementById("infoBanner");
    const summaryText = document.getElementById("obsSummaryText");
    
    // Check initial Sun altitude to warn user if it is daytime
    const sunAlt = getSunAltitude(startDate, lat, lon);
    const isDark = sunAlt < -12;
    
    const tz = getTimezoneAbbreviation(startDate);
    const currentLocale = getLang() === 'it' ? 'it-IT' : 'en-US';
    const formattedDate = startDate.toLocaleDateString(currentLocale, { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = startDate.toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' });
    const endDate = new Date(startDate.getTime() + 6 * 3600000);
    const formattedEndTime = endDate.toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' });
    
    summaryText.innerHTML = t("summary-observer", {
        lat: Math.abs(lat).toFixed(3),
        latDir: lat >= 0 ? (getLang() === 'it' ? 'N' : 'N') : (getLang() === 'it' ? 'S' : 'S'),
        lon: Math.abs(lon).toFixed(3),
        lonDir: lon >= 0 ? (getLang() === 'it' ? 'E' : 'E') : (getLang() === 'it' ? 'W' : 'W'),
        date: formattedDate,
        time: formattedTime,
        endTime: formattedEndTime,
        tz: tz
    });
    
    if (!isDark) {
        banner.className = "info-banner banner-warning";
        summaryText.innerHTML += `<br><span style="color: var(--neon-red); font-weight: 600;">` + t("sun-warning-text", {
            time: formattedTime,
            tz: tz,
            alt: sunAlt.toFixed(1)
        }) + `</span>`;
    } else {
        banner.className = "info-banner";
    }
}

// --- RENDER TABLE RESULTS (GROUPED BY BRIGHTNESS BINS) ---

function renderTable(filterQuery = "") {
    const tbody = document.getElementById("snTableBody");
    const countBadge = document.getElementById("resultsCount");
    
    // Filter by search query
    let filteredSNe = visibleSupernovae;
    if (filterQuery.trim() !== "") {
        const query = filterQuery.toLowerCase();
        filteredSNe = visibleSupernovae.filter(sn => 
            sn.name.toLowerCase().includes(query) ||
            sn.constellation.toLowerCase().includes(query) ||
            sn.type.toLowerCase().includes(query) ||
            sn.reporting_group.toLowerCase().includes(query) ||
            (sn.host_galaxy && sn.host_galaxy.toLowerCase().includes(query))
        );
    }
    
    countBadge.innerText = t("results-count", {count: filteredSNe.length});
    
    if (filteredSNe.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="table-placeholder">
                    <p>${t("sn-table-empty")}</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sorting inside groups: discovery date descending (most recent first)
    const sortByDate = (a, b) => new Date(b.discoverydate) - new Date(a.discoverydate);
    
    // Group into three magnitude bands:
    // Group 1: 10 to 13 (Brillantissime)
    // Group 2: 13 to 15 (Brillanti)
    // Group 3: 15 to 19 (Osservabili amatorialmente)
    const groupBrightest = [];
    const groupBright = [];
    const groupObservable = [];
    const groupOther = []; // Fallback for Mag > 19 or N/D
    
    filteredSNe.forEach(sn => {
        const mag = sn.discoverymag;
        if (mag === null) {
            groupOther.push(sn);
        } else if (mag >= 10.0 && mag < 13.0) {
            groupBrightest.push(sn);
        } else if (mag >= 13.0 && mag < 15.0) {
            groupBright.push(sn);
        } else if (mag >= 15.0 && mag <= 19.0) {
            groupObservable.push(sn);
        } else {
            groupOther.push(sn);
        }
    });
    
    // Sort each group
    groupBrightest.sort(sortByDate);
    groupBright.sort(sortByDate);
    groupObservable.sort(sortByDate);
    groupOther.sort(sortByDate);
    
    // Helper to render rows of a specific group
    function renderGroupRows(groupSNe) {
        if (groupSNe.length === 0) {
            return `
                <tr>
                    <td colspan="10" style="text-align: center; color: var(--text-muted); padding: 16px 0; font-style: italic;">
                        ${t("sn-group-empty-msg")}
                    </td>
                </tr>
            `;
        }
        
        return groupSNe.map(sn => {
            // Badge color based on classification type
            let typeClass = "badge-info";
            if (sn.type.includes("Ia")) typeClass = "badge-purple";
            else if (sn.type.includes("II")) typeClass = "badge-pink";
            else if (sn.type.includes("SLSN")) typeClass = "badge-gold";
            
            // Formatted coordinates
            const raFormatted = formatRA(sn.ra);
            const decFormatted = formatDec(sn.dec);
            
            // Progress bar for peak altitude
            const progressWidth = Math.max(0, Math.min(100, (sn.peakAlt / 90) * 100));
            
            // Companion filter / group
            const group = sn.reporting_group ? sn.reporting_group : (sn.source_group ? sn.source_group : (getLang() === 'it' ? 'Sconosciuto' : 'Unknown'));
            let groupClass = "badge-info";
            if (group.toUpperCase().includes("ATLAS")) groupClass = "badge-gold"; // Highlight ATLAS
            else if (group.toUpperCase().includes("ZTF")) groupClass = "badge-purple";
            
            // Peak Azimuth cardinal direction
            const peakDir = getCardinalDirection(sn.peakAz);
            
            // Format discovery date
            const discDate = sn.discoverydate ? sn.discoverydate.substring(0, 10) : "N/D";
            
            // Host Galaxy formatting
            const hostGal = sn.host_galaxy && sn.host_galaxy !== "N/A" ? sn.host_galaxy : `<span class='text-muted'>${t("host-galaxy-isolated-label")}</span>`;
            
            return `
                <tr onclick="openModal(${sn.objid})">
                    <td>
                        <div class="sn-name-cell">
                            <span>${sn.prefix} ${sn.name}</span>
                        </div>
                    </td>
                    <td>
                        <span class="badge ${typeClass}" style="font-weight: 700; text-transform: uppercase;">${sn.type}</span>
                    </td>
                    <td class="sn-mag-cell" style="color: ${getMagColor(sn.discoverymag)}">
                        ${sn.discoverymag !== null ? sn.discoverymag.toFixed(2) : "N/D"}
                    </td>
                    <td class="sn-constellation-cell">${sn.constellation}</td>
                    <td style="font-weight: 600; color: var(--neon-cyan);">${hostGal}</td>
                    <td>
                        <div class="sn-altitude-cell">
                            <span>Peak: <strong>${sn.peakAlt.toFixed(1)}°</strong></span>
                            <div class="alt-progress-bg">
                                <div class="alt-progress-bar" style="width: ${progressWidth}%"></div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="sn-dir-cell">
                            <span>${sn.peakAz.toFixed(0)}° (${peakDir})</span>
                        </div>
                    </td>
                    <td style="font-family: monospace; font-size: 0.75rem;">
                        RA: ${raFormatted}<br>Dec: ${decFormatted}
                    </td>
                    <td><span class="badge ${groupClass}">${group}</span></td>
                    <td>${discDate}</td>
                </tr>
            `;
        }).join("");
    }
    
    // Assemble table content with separators
    let html = "";
    
    html += `<tr class="table-group-header group-brightest-header"><td colspan="10">${t("sn-group-1", {count: groupBrightest.length})}</td></tr>`;
    html += renderGroupRows(groupBrightest);
    
    html += `<tr class="table-group-header group-bright-header"><td colspan="10">${t("sn-group-2", {count: groupBright.length})}</td></tr>`;
    html += renderGroupRows(groupBright);
    
    html += `<tr class="table-group-header group-observable-header"><td colspan="10">${t("sn-group-3", {count: groupObservable.length})}</td></tr>`;
    html += renderGroupRows(groupObservable);
    
    if (groupOther.length > 0) {
        html += `<tr class="table-group-header" style="border-left: 4px solid var(--text-muted); background: rgba(20,20,20,0.5);"><td colspan="10" style="color: var(--text-secondary) !important;">${t("sn-group-4", {count: groupOther.length})}</td></tr>`;
        html += renderGroupRows(groupOther);
    }
    
    tbody.innerHTML = html;
}

// --- RADAR DRAWING ENGINE ---

function drawRadar(offsetHours) {
    const lat = observerSettings.lat;
    const lon = observerSettings.lon;
    const startDate = observerSettings.date;
    const minAlt = observerSettings.minAlt;
    
    const checkDate = new Date(startDate.getTime() + offsetHours * 3600000);
    
    // Reset plotted radar objects
    plottedRadarObjects = [];
    
    // Clear canvas
    radarCtx.clearRect(0, 0, radarCanvas.width, radarCanvas.height);
    
    const centerX = radarCanvas.width / 2;
    const centerY = radarCanvas.height / 2;
    const maxRadius = radarCanvas.width / 2 - 20; // safe padding
    
    // Draw radar concentric circles
    radarCtx.strokeStyle = "rgba(139, 92, 246, 0.15)";
    radarCtx.lineWidth = 1;
    
    // 30° and 60° circles
    [30, 60].forEach(altLimit => {
        const radius = maxRadius * ((90 - altLimit) / (90 - minAlt));
        radarCtx.beginPath();
        radarCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        radarCtx.stroke();
        
        // Add alt labels
        radarCtx.fillStyle = "rgba(100, 116, 139, 0.4)";
        radarCtx.font = "9px Outfit";
        radarCtx.fillText(`${altLimit}°`, centerX + 4, centerY - radius - 2);
    });
    
    // Draw crosshair axes (radial lines)
    radarCtx.beginPath();
    radarCtx.moveTo(centerX, 15);
    radarCtx.lineTo(centerX, radarCanvas.height - 15);
    radarCtx.moveTo(15, centerY);
    radarCtx.lineTo(radarCanvas.width - 15, centerY);
    radarCtx.stroke();
    
    // Plot Sun if visible (represented as a golden circle)
    const sunAlt = getSunAltitude(checkDate, lat, lon);
    if (sunAlt > 0) {
        const sunPos = getSunPosition(checkDate);
        const sunAltAz = raDecToAltAz(sunPos.ra, sunPos.dec, lat, lon, checkDate);
        
        const zAngle = 90 - sunAltAz.alt;
        const radius = maxRadius * (zAngle / (90 - minAlt));
        const angleRad = (sunAltAz.az - 90) * Math.PI / 180;
        
        const x = centerX + radius * Math.cos(angleRad);
        const y = centerY + radius * Math.sin(angleRad);
        
        // Glow effect
        radarCtx.shadowBlur = 15;
        radarCtx.shadowColor = "#f59e0b";
        radarCtx.fillStyle = "#f59e0b";
        radarCtx.beginPath();
        radarCtx.arc(x, y, 9, 0, 2 * Math.PI);
        radarCtx.fill();
        
        // Reset shadow
        radarCtx.shadowBlur = 0;
    }
    
    // Plot visible Supernovae
    visibleSupernovae.forEach(sn => {
        // Only plot supernovas brighter than magnitude 17.5 on the celestial radar map
        if (sn.discoverymag === null || sn.discoverymag >= 17.5) {
            return;
        }
        
        // Recalculate Alt-Az at the target offset hours
        const snAltAz = raDecToAltAz(sn.ra, sn.dec, lat, lon, checkDate);
        
        // Only draw if above the horizon limit at this specific time
        if (snAltAz.alt >= minAlt) {
            const zAngle = 90 - snAltAz.alt;
            const radius = maxRadius * (zAngle / (90 - minAlt));
            const angleRad = (snAltAz.az - 90) * Math.PI / 180;
            
            const x = centerX + radius * Math.cos(angleRad);
            const y = centerY + radius * Math.sin(angleRad);
            
            // Choose color based on type
            let color = "#10b981"; // Emerald default
            if (sn.type.includes("Ia")) color = "#a78bfa"; // Neon Purple
            else if (sn.type.includes("II")) color = "#22d3ee"; // Neon Cyan
            
            // Draw SN dot
            radarCtx.shadowBlur = 10;
            radarCtx.shadowColor = color;
            radarCtx.fillStyle = color;
            
            // Dot size relative to magnitude (brighter = larger)
            const mag = sn.discoverymag !== null ? sn.discoverymag : 18.0;
            const size = Math.max(3, Math.min(8, 18.0 - mag + 3));
            
            radarCtx.beginPath();
            radarCtx.arc(x, y, size, 0, 2 * Math.PI);
            radarCtx.fill();
            
            // Record plotted coordinates for click events
            plottedRadarObjects.push({ x: x, y: y, size: size, sn: sn });
            
            // Add tiny label
            radarCtx.shadowBlur = 0;
            radarCtx.fillStyle = "rgba(248, 250, 252, 0.75)";
            radarCtx.font = "bold 9px Outfit";
            radarCtx.fillText(sn.name, x + size + 2, y + 2);
        }
    });
}

// --- INTERACTIVE SLIDER SCRUBBER ---

function handleTimeSliderInput(e) {
    const offsetHours = parseFloat(e.target.value);
    
    // Update label
    const label = document.getElementById("sliderValue");
    const radarTimeLabel = document.getElementById("radarTimeLabel");
    
    const targetDate = new Date(observerSettings.date.getTime() + offsetHours * 3600000);
    const tz = getTimezoneAbbreviation(targetDate);
    const currentLocale = getLang() === 'it' ? 'it-IT' : 'en-US';
    const targetTimeStr = targetDate.toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' });
    
    if (offsetHours === 0) {
        label.innerText = `${t("slider-start-time")} (${targetTimeStr} ${tz})`;
        radarTimeLabel.innerText = t("slider-radar-start");
    } else {
        label.innerText = t("slider-offset-hours", {
            hours: offsetHours.toFixed(1),
            time: targetTimeStr,
            tz: tz
        });
        radarTimeLabel.innerText = `T + ${offsetHours.toFixed(1)}h`;
    }
    
    // Redraw Radar at the selected offset time
    drawRadar(offsetHours);
}

// --- SEARCH FILTER ---

function handleSearch(e) {
    renderTable(e.target.value);
}

// --- DETAIL MODAL SYSTEM ---

function openModal(objid) {
    const sn = visibleSupernovae.find(s => s.objid === objid);
    if (!sn) return;
    
    // Populate simple info
    document.getElementById("modalSnName").innerText = `${sn.prefix} ${sn.name}`;
    
    const modalType = document.getElementById("modalSnType");
    modalType.innerText = sn.type;
    modalType.className = "badge " + (sn.type.includes("Ia") ? "badge-purple" : (sn.type.includes("II") ? "badge-pink" : "badge-green"));
    
    // Constellation and Host Galaxy
    const hostGal = sn.host_galaxy && sn.host_galaxy !== "N/A" ? sn.host_galaxy : "Non rilevata / Isolata";
    document.getElementById("modalConstellation").innerHTML = `${sn.constellation} <br><span style="font-size:0.75rem; color:var(--text-muted)">Galassia Ospitante: <strong style="color:var(--neon-cyan)">${hostGal}</strong></span>`;
    
    document.getElementById("modalMag").innerText = sn.discoverymag !== null ? sn.discoverymag.toFixed(2) : "N/D";
    document.getElementById("modalFilter").innerText = sn.filter ? `${sn.filter} (${sn.discmagfilter})` : sn.discmagfilter;
    // Redshift and presunta/stima distance in Light Years
    let redshiftText = "N/D";
    if (sn.redshift !== null) {
        if (sn.redshift > 0) {
            const distLy = sn.redshift * 13.9686 * 1000000000;
            let formattedDist = "";
            if (distLy >= 1000000000) {
                formattedDist = ` (~${(distLy / 1000000000).toFixed(2)} miliardi di a.l.)`;
            } else {
                formattedDist = ` (~${(distLy / 1000000).toFixed(1)} milioni di a.l.)`;
            }
            redshiftText = `${sn.redshift.toFixed(5)}${formattedDist}`;
        } else {
            redshiftText = `${sn.redshift.toFixed(5)}`;
        }
    } else if (sn.host_galaxy_distance_ly) {
        const distLy = sn.host_galaxy_distance_ly;
        let formattedDist = "";
        if (distLy >= 1000000000) {
            formattedDist = `~${(distLy / 1000000000).toFixed(2)} mld a.l.`;
        } else {
            formattedDist = `~${(distLy / 1000000).toFixed(1)} mln a.l.`;
        }
        redshiftText = `N/D <span style="color:var(--text-muted); font-size:0.8rem">(Stima galassia: <strong style="color:var(--neon-green)">${formattedDist}</strong>)</span>`;
    }
    document.getElementById("modalRedshift").innerHTML = redshiftText;
    
    // Coordinates
    document.getElementById("modalRa").innerText = `${formatRA(sn.ra)} (${sn.ra.toFixed(4)}°)`;
    document.getElementById("modalDec").innerText = `${formatDec(sn.dec)} (${sn.dec.toFixed(4)}°)`;
    
    // Group and Date
    document.getElementById("modalGroup").innerText = sn.reporting_group ? sn.reporting_group : (sn.source_group ? sn.source_group : "Sconosciuto");
    document.getElementById("modalDate").innerText = sn.discoverydate;
    
    // Direct link to the object page on WIS-TNS
    document.getElementById("btnTnsLink").href = `https://www.wis-tns.org/object/${sn.name}`;
    
    // Direct link to the sky view on Aladin Lite (DSS2 Color, 0.5 degrees FOV)
    const aladinTarget = `${sn.ra} ${sn.dec}`;
    document.getElementById("btnAladinLink").href = `https://aladin.cds.unistra.fr/AladinLite/?target=${encodeURIComponent(aladinTarget)}&fov=0.5&survey=P%2FDSS2%2Fcolor`;
    
    // Generate Visibility Timeline Row inside Modal
    const timeline = document.getElementById("modalTimeline");
    
    if (sn.visibleSegments.length === 0) {
        timeline.innerHTML = "<p style='color: var(--text-muted); font-size: 0.75rem;'>Non visibile in modo ottimale in questa finestra temporale.</p>";
    } else {
        timeline.innerHTML = sn.visibleSegments.map(seg => {
            const width = Math.max(0, Math.min(100, (seg.alt / 90) * 100));
            return `
                <div class="timeline-row">
                    <span class="timeline-time">${seg.time}</span>
                    <div class="timeline-bar-wrapper">
                        <div class="timeline-bar-visible" style="width: ${width}%"></div>
                    </div>
                    <span class="timeline-status" style="color: ${getAltColor(seg.alt)}">Alt: ${seg.alt.toFixed(1)}° (${getCardinalDirection(seg.az)})</span>
                </div>
            `;
        }).join("");
    }
    
    // Display Modal
    document.getElementById("detailModal").classList.add("active");
}

function closeModal() {
    document.getElementById("detailModal").classList.remove("active");
}

// --- GEOGRAPHIC & CONVERSIONS HELPERS ---

// Format hours offset into hh:mm string
function formatHoursOffset(startDate, targetDate) {
    return targetDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

// Format Right Ascension to sexagesimal hours (hh:mm:ss)
function formatRA(raDegrees) {
    const hoursDecimal = raDegrees / 15;
    const h = Math.floor(hoursDecimal);
    const mDecimal = (hoursDecimal - h) * 60;
    const m = Math.floor(mDecimal);
    const s = Math.round((mDecimal - m) * 60);
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

// Format Declination to sexagesimal degrees (dd° mm' ss")
function formatDec(decDegrees) {
    const sign = decDegrees >= 0 ? "+" : "-";
    const decAbs = Math.abs(decDegrees);
    const d = Math.floor(decAbs);
    const mDecimal = (decAbs - d) * 60;
    const m = Math.floor(mDecimal);
    const s = Math.round((mDecimal - m) * 60);
    return `${sign}${String(d).padStart(2, '0')}° ${String(m).padStart(2, '0')}' ${String(s).padStart(2, '0')}"`;
}

// Get cardinal direction abbreviation from Azimuth degrees
function getCardinalDirection(az) {
    const sectors = getLang() === 'it' 
        ? ["N", "NE", "E", "SE", "S", "SO", "O", "NO"]
        : ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(az / 45) % 8;
    return sectors[index];
}

// Get color scale for supernova magnitude
function getMagColor(mag) {
    if (mag === null) return "var(--text-primary)";
    if (mag < 15) return "var(--neon-cyan)"; // extremely bright
    if (mag < 17) return "var(--neon-green)"; // very bright
    if (mag < 18) return "var(--neon-gold)"; // moderately bright
    return "var(--text-secondary)"; // faint
}

// Get color based on Altitude
function getAltColor(alt) {
    if (alt > 45) return "var(--neon-cyan)";
    if (alt > 20) return "var(--neon-green)";
    return "var(--neon-gold)";
}

function updateNavToSearch() {
    const dateEl = document.getElementById("obsDate");
    const timeEl = document.getElementById("obsTime");
    const navToSearch = document.getElementById("navToSearch");
    if (dateEl && dateEl.value && timeEl && timeEl.value && navToSearch) {
        // Parse the local date/time
        const [y, mo, d] = dateEl.value.split("-").map(Number);
        const [h, mi] = timeEl.value.split(":").map(Number);
        const localDate = new Date(y, mo - 1, d, h, mi);
        
        // Format to UT date/time strings
        const utYear = localDate.getUTCFullYear();
        const utMonth = String(localDate.getUTCMonth() + 1).padStart(2, '0');
        const utDay = String(localDate.getUTCDate()).padStart(2, '0');
        const utHours = String(localDate.getUTCHours()).padStart(2, '0');
        const utMinutes = String(localDate.getUTCMinutes()).padStart(2, '0');
        
        const utDateStr = `${utYear}-${utMonth}-${utDay}`;
        const utTimeStr = `${utHours}:${utMinutes}`;
        
        navToSearch.href = `search.html?date=${encodeURIComponent(utDateStr)}&time=${encodeURIComponent(utTimeStr)}`;
    }
}
