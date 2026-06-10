# Supernova Hunter 🌌

[Italiano](#italiano) | [English](#english)

---

## Italiano

**Supernova Hunter** è un'applicazione web e sistema di automazione completo per tracciare in tempo reale la visibilità delle supernove e la presenza di asteroidi nel cielo notturno. 

Il sistema combina un **backend di prelievo automatizzato** (Python + GitHub Actions) che scarica giornalmente i dati ufficiali dal server astronomico mondiale **WIS-TNS (Transient Name Server)**, e un **frontend interattivo ad alte prestazioni** (HTML/CSS/JS con Canvas Sky Radar).

### 🚀 Live Demo

Il portale è pubblicato e consultabile direttamente su **GitHub Pages** tramite i seguenti link:

* 📡 **[Radar Tracker (Mappa Celeste)](https://qsecofr76.github.io/SupernovaHunter/)**: Visualizzazione radar Alt-Azimutale in tempo reale delle supernove visibili dalla propria posizione.
* 🔍 **[Ricerca Area Celeste](https://qsecofr76.github.io/SupernovaHunter/search.html)**: Ricerca per coordinate o nome oggetto (Messier, NGC, IC, stelle) con calcolo delle supernove nel raggio e integrazione con il Minor Planet Center (MPC) per individuare asteroidi (Mag < 20).

### 🌟 Caratteristiche Principali

* **Sky Radar Celeste**: Mappa radar Canvas interattiva basata sulle coordinate dell'osservatore e sul Tempo Siderale Locale (LST), filtrata a Magnitudine < 16.5.
* **Ricerca per Coordinate ed Asteroidi**: Traduzione istantanea dei nomi degli oggetti del cielo profondo (DSO) in coordinate tramite il name resolver *CDS Sesame*, con precessione automatica JNow ➔ J2000.
* **Integrazione Minor Planet Center (MPC)**: Interrogazione dinamica di MPChecker (con fallback multi-proxy) per trovare asteroidi di magnitudine < 20 in corrispondenza del campo inquadrato.
* **Ottimizzazione Dati**: Il backend mantiene solo le supernove scoperte negli ultimi **120 giorni** (4 mesi) con magnitudine **< 18.5**, riducendo le dimensioni del database per caricamenti istantanei.
* **Calcolo Trigonometrico Galassie Ospiti**: Identificazione offline ed online delle galassie vicine (catalogo OpenNGC ed interrogazione PGC su VizieR) se non specificate da WIS-TNS, con salvataggio incrementale a due fasi.

### 💻 Sviluppo in Locale

Se desideri clonare ed eseguire il progetto localmente:

1. **Avviare le Pagine Web**:
   Puoi aprire direttamente `index.html` o `search.html` nel browser, oppure avviare un server locale dalla root del progetto:
   ```bash
   python -m http.server 8000
   ```

2. **Aggiornare il Database (`supernovae.json`)**:
   Per eseguire lo script di aggiornamento automatico `scripts/update_data.py`, **è necessario richiedere le proprie chiavi API personali a WIS-TNS** (Bot ID, Bot Name e API Key). Una volta ottenute:
   * Crea un file `.env` nella root del progetto:
     ```ini
     TNS_BOT_ID=il_tuo_bot_id
     TNS_BOT_NAME=il_tuo_bot_name
     TNS_API_KEY=la_tua_api_key_tns
     DAYS_LIMIT=120
     ```
   * Installa le dipendenze Python ed esegui lo script:
     ```bash
     pip install -r requirements.txt
     python scripts/update_data.py
     ```

### 📡 Pipeline di Aggiornamento Dati

Il database delle supernove viene mantenuto aggiornato automaticamente tramite **GitHub Actions**:
* Il workflow programmato in `.github/workflows/update_supernovae.yml` viene eseguito dal server ogni giorno alle **18:00 UTC** (le **20:00** italiane), l'orario ideale per avere i dati freschi prima delle osservazioni serali.

### 💙 Dedicato a Paolo Campaner
Questo progetto è dedicato alla memoria di **Paolo Campaner**, amico indimenticato, appassionato scopritore di supernove e fondatore del gruppo **Astrofili Ponte di Piave** ([www.astrofilipontedipiave.it](https://www.astrofilipontedipiave.it)).

---

## English

**Supernova Hunter** is a web application and automation system designed to track the real-time visibility of supernovae and the presence of asteroids in the night sky.

The system combines an **automated backend crawler** (Python + GitHub Actions) that downloads daily official data from the **WIS-TNS (Transient Name Server)** global registry, and an **interactive high-performance frontend** (HTML/CSS/JS with a Canvas Sky Radar).

### 🚀 Live Demo

The portal is published and accessible directly on **GitHub Pages**:

* 📡 **[Radar Tracker (Celestial Map)](https://qsecofr76.github.io/SupernovaHunter/)**: Real-time Alt-Azimuth radar tracker showing visible supernovae from your coordinates.
* 🔍 **[Celestial Area Search](https://qsecofr76.github.io/SupernovaHunter/search.html)**: Search by coordinates or object name (Messier, NGC, IC, stars) to detect supernovae within a specific radius, integrated with the Minor Planet Center (MPC) to plot asteroids (Mag < 20).

### 🌟 Key Features

* **Celestial Sky Radar**: Interactive Canvas radar map based on observer coordinates and Local Sidereal Time (LST), filtered at Magnitude < 16.5.
* **Coordinate & Asteroid Search**: Instant translation of Deep Sky Object (DSO) names into coordinates using the *CDS Sesame* name resolver, featuring automatic JNow ➔ J2000 precession.
* **Minor Planet Center (MPC) Integration**: Dynamic MPChecker queries (with multi-proxy fallback) to find asteroids brighter than V = 20 in the selected field of view.
* **Data Optimization**: The backend stores only supernovae discovered in the last **120 days** (4 months) with a magnitude **< 18.5**, keeping the database small for instant load times.
* **Host Galaxy Cross-matching**: Offline and online identification of host galaxies (via OpenNGC catalog and PGC queries on VizieR) when not specified by WIS-TNS, utilizing a robust two-phase incremental save.

### 💻 Local Development

To clone and run this project locally:

1. **Host Web Pages**:
   You can open `index.html` or `search.html` directly in your browser, or spin up a local web server from the project's root folder:
   ```bash
   python -m http.server 8000
   ```

2. **Update Database (`supernovae.json`)**:
   To run the automated crawler `scripts/update_data.py`, **you must request your own personal API credentials from WIS-TNS** (Bot ID, Bot Name, and API Key). Once acquired:
   * Create a `.env` file in the project's root folder:
     ```ini
     TNS_BOT_ID=your_bot_id
     TNS_BOT_NAME=your_bot_name
     TNS_API_KEY=your_tns_api_key
     DAYS_LIMIT=120
     ```
   * Install Python dependencies and execute the script:
     ```bash
     pip install -r requirements.txt
     python scripts/update_data.py
     ```

### 📡 Data Update Pipeline

The supernovae database is automatically kept up-to-date using **GitHub Actions**:
* The scheduled workflow in `.github/workflows/update_supernovae.yml` runs daily at **18:00 UTC** (20:00 Italian time), ensuring fresh database files before nightly observation sessions begin.

### 💙 Dedicated to Paolo Campaner
This project is dedicated to the memory of **Paolo Campaner**, unforgotten friend, passionate supernova discoverer, and founder of the **Astrofili Ponte di Piave** group ([www.astrofilipontedipiave.it](https://www.astrofilipontedipiave.it)).
