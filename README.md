# LaTeX WYSIWYG Editor

Un editor visuale (WYSIWYG) per creare e modificare template LaTeX per verifiche e esami scolastici.

## Caratteristiche

- **Editor Visuale**: Compila i campi del template tramite un'interfaccia grafica intuitiva
- **Generazione Automatica**: Il codice LaTeX viene generato automaticamente dai dati inseriti
- **Gestione Descrittori**: Aggiungi/rimuovi facilmente i criteri di valutazione
- **Preview in Tempo Reale**: Visualizza il codice LaTeX generato
- **Download**: Scarica il file .tex pronto per la compilazione
- **Template Personalizzabili**: Carica template esistenti o crea nuovi template da zero

## Come Usare

### 1. Aprire l'Editor

Apri il file `index.html` in un browser web moderno (Chrome, Firefox, Safari, Edge).

### 2. Compilare il Template

1. **Informazioni Generali**:
   - Inserisci il tempo previsto per la verifica
   - Inserisci il nome del/dei docente/i

2. **Esercizi**:
   - Inserisci la consegna principale
   - Inserisci l'esercizio con stella (se presente)

3. **Griglia di Valutazione**:
   - Clicca su "➕ Aggiungi Descrittore" per aggiungere criteri di valutazione
   - Per ogni descrittore, inserisci:
     - Descrizione (es. "Comprensione del testo")
     - Punteggio massimo (es. "10")
   - Clicca su "🗑️ Rimuovi" per eliminare un descrittore

### 3. Generare il Codice LaTeX

Clicca sul pulsante **"🔄 Genera LaTeX"** per generare il codice LaTeX completo.

Il codice apparirà nel pannello di destra.

### 4. Scaricare il File

Clicca sul pulsante **"💾 Scarica .tex"** per scaricare il file LaTeX generato.

Il file verrà salvato come `verifica.tex` e potrà essere compilato con qualsiasi compilatore LaTeX.

### 5. Funzioni Aggiuntive

- **📂 Carica Template**: Carica il template esistente `templateGestionaleLab.tex`
- **➕ Nuovo Template**: Crea un nuovo template da zero (resetta tutti i campi)
- **📋 Copia Codice**: Copia il codice LaTeX negli appunti

## File Inclusi

- `index.html` - Interfaccia principale dell'editor
- `style.css` - Stili e layout dell'applicazione
- `app.js` - Logica dell'applicazione
- `templateGestionaleLab.tex` - Template di esempio
- `document.tex` - Documento LaTeX di base

## Requisiti

- Browser web moderno con JavaScript abilitato
- Nessun server web richiesto (può funzionare in locale)
- Per compilare i file .tex generati: LaTeX (TexLive, MiKTeX, etc.)

## Classe LaTeX Richiesta

I template generati utilizzano la classe `verifica`. Assicurati di avere questa classe installata nel tuo sistema LaTeX o disponibile nella stessa directory del file .tex.

## Personalizzazione

Puoi modificare il template di base modificando la variabile `currentTemplate` nel file `app.js`.

## Note

- L'editor salva i dati solo localmente nel browser
- Non è richiesta una connessione internet (dopo il primo caricamento)
- I file generati sono compatibili con LaTeX standard

## Supporto

Per problemi o suggerimenti, apri una issue nel repository.
