# Supernova Hunter 🌌

**Supernova Hunter** è un'applicazione web e sistema di automazione completo per tracciare in tempo reale la visibilità delle supernove e la presenza di asteroidi nel cielo notturno. 

Il sistema combina un **backend di prelievo automatizzato** (Python + GitHub Actions) che scarica giornalmente i dati ufficiali dal server astronomico mondiale **WIS-TNS (Transient Name Server)**, e un **frontend interattivo ad alte prestazioni** (HTML/CSS/JS con Canvas Sky Radar).

---

## 🚀 Live Demo

Il portale è pubblicato e consultabile direttamente su **GitHub Pages** tramite i seguenti link:

* 📡 **[Radar Tracker (Mappa Celeste)](https://qsecofr76.github.io/SupernovaHunter/)**: Visualizzazione radar Alt-Azimutale in tempo reale delle supernove visibili dalla propria posizione.
* 🔍 **[Ricerca Area Celeste](https://qsecofr76.github.io/SupernovaHunter/search.html)**: Ricerca per coordinate o nome oggetto (Messier, NGC, IC, stelle) con calcolo delle supernove nel raggio e integrazione con il Minor Planet Center (MPC) per individuare asteroidi (Mag < 20).

---

## 🌟 Caratteristiche Principali

* **Sky Radar Celeste**: Mappa radar Canvas interattiva basata sulle coordinate dell'osservatore e sul Tempo Siderale Locale (LST).
* **Ricerca per Coordinate ed Asteroidi**: Traduzione istantanea dei nomi degli oggetti del cielo profondo (DSO) in coordinate tramite il name resolver *CDS Sesame*, con precessione automatica JNow ➔ J2000.
* **Integrazione Minor Planet Center (MPC)**: Interrogazione dinamica di MPChecker per trovare asteroidi di magnitudine < 20 in corrispondenza del campo inquadrato.
* **Ottimizzazione Dati**: Il backend mantiene solo le supernove scoperte negli ultimi 180 giorni con magnitudine < 19.0, riducendo del 9x le dimensioni del database per caricamenti istantanei.
* **Calcolo Trigonometrico Galassie Ospiti**: Identificazione automatica offline delle galassie vicine (catalogo OpenNGC) se non specificate da WIS-TNS.

---

## 💻 Sviluppo in Locale

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
     DAYS_LIMIT=180
     ```
   * Installa le dipendenze Python ed esegui lo script:
     ```bash
     pip install -r requirements.txt
     python scripts/update_data.py
     ```

---

## 📡 Pipeline di Aggiornamento Dati

Il database delle supernove viene mantenuto aggiornato automaticamente tramite **GitHub Actions**:
* Il workflow programmato in `.github/workflows/update_supernovae.yml` viene eseguito dal server ogni giorno alle **18:00 UTC** (le **20:00** italiane), l'orario ideale per avere i dati freschi prima delle osservazioni serali.

---

## 💙 Dedicato a Paolo Campaner
Questo progetto è dedicato alla memoria di **Paolo Campaner**, amico indimenticato, appassionato scopritore di supernove e fondatore del gruppo **Astrofili Ponte di Piave** ([www.astrofilipontedipiave.it](https://www.astrofilipontedipiave.it)).
