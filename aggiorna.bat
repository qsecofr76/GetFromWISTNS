@echo off
title Supernova Hunter - Aggiornamento Database
chcp 65001 > nul
cls
echo =====================================================================
echo    SUPERNOVA HUNTER - STRUMENTO DI AGGIORNAMENTO RAPIDO (LOCALE)
echo =====================================================================
echo.
echo   Questo strumento scarica il catalogo aggiornato da WIS-TNS usando la
echo   tua connessione di casa (evitando i blocchi IP di GitHub Actions)
echo   e lo pubblica automaticamente su GitHub Pages.
echo.
echo   [*] 1. Avvio del motore astronomico Python in corso...
echo.
python scripts/update_data.py
if %errorlevel% neq 0 (
    echo.
    echo   [!] ERRORE: Download o parsing fallito.
    echo   Verifica la tua connessione e le credenziali nel file .env.
    echo.
    pause
    exit /b %errorlevel%
)

echo.
echo   [+] 2. Database 'supernovae.json' aggiornato con successo!
echo.
echo   [*] 3. Caricamento e pubblicazione su GitHub Pages in corso...
echo.

git add supernovae.json hostnames_cache.json
git commit -m "Auto-update supernovae data [local run]"
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo   [!] ERRORE: Impossibile effettuare il push su GitHub.
    echo   Verifica che non ci siano modifiche in sospeso o conflitti di rete.
    echo.
    pause
    exit /b %errorlevel%
)

echo.
echo =====================================================================
echo   [+] AGGIORNAMENTO COMPLETATO!
echo   Il tuo sito su GitHub Pages si aggiornerà automaticamente tra circa
echo   45 secondi all'indirizzo ufficiale.
echo =====================================================================
echo.
pause
