# LaTeX WYSIWYG Editor - Ultimate Version

Un editor visuale (WYSIWYG) professionale e completo per creare e modificare template LaTeX per verifiche e esami scolastici.

## 🚀 Caratteristiche Principali

### 📝 Editor Visuale Avanzato
- **Interfaccia Intuitiva**: Compila i campi del template tramite un'interfaccia grafica moderna e professionale
- **Generazione Automatica**: Il codice LaTeX viene generato automaticamente dai dati inseriti
- **Anteprima Doppia**: Visualizza sia il codice LaTeX che l'anteprima HTML visuale
- **Modalità Tempo Reale**: Attiva l'anteprima in tempo reale con aggiornamenti automatici mentre scrivi (⚡)
- **Gestione Esercizi Multipli**: Aggiungi/rimuovi/duplica esercizi con un solo click
- **Griglia di Valutazione Dinamica**: Aggiungi/rimuovi facilmente i criteri di valutazione

### 💾 Sistema di Template
- **Template Preimpostati**: 4 template pronti all'uso per diverse materie
  - 📐 Matematica
  - 📖 Italiano
  - 🔬 Scienze
  - 💻 Informatica
- **Template Personalizzati**: Salva i tuoi template personalizzati per riutilizzarli
- **Gestione Template**: Carica, modifica, elimina e rinomina i tuoi template salvati
- **Template Base**: Carica il template esempio `templateGestionaleLab.tex`

### 📜 Cronologia e Versioni
- **Version History**: Sistema di versioning automatico che salva fino a 20 versioni
- **Autosave**: Salvataggio automatico ogni 5 minuti
- **Timestamp**: Ogni versione è datata e può essere ripristinata con un click
- **Undo/Redo**: Sistema di annulla/ripeti con 50 livelli di cronologia (↶ ↷)
- **Protezione Dati**: Tutti i dati sono salvati localmente nel browser

### 🎨 Interfaccia e Visualizzazione
- **Tema Scuro/Chiaro**: Passa tra tema chiaro e scuro con un click (🌓)
- **Modalità Fullscreen**: Concentrati solo sull'anteprima nascondendo l'editor (⛶)
- **Modalità Compatta**: Riduci lo spazio verticale per vedere più contenuto (◧)
- **Design Responsive**: Funziona perfettamente su desktop, tablet e mobile
- **Effetti Visivi**: Animazioni fluide e transizioni eleganti

### 📊 Statistiche e Validazione
- **Pannello Statistiche**: Visualizza statistiche in tempo reale del documento (📊)
  - Numero totale di esercizi
  - Numero di descrittori di valutazione
  - Punteggio totale
  - Tempo previsto per la verifica
- **Validazione Automatica**: Avvisi per verifiche troppo brevi o troppo lunghe
- **Contatore Caratteri**: Avvisi visivi per testi troppo lunghi
  - 🟡 Giallo: > 300 caratteri
  - 🔴 Rosso: > 500 caratteri

### 💡 Suggerimenti Intelligenti
- **Suggerimenti per Materia**: Proposte automatiche di criteri di valutazione
- **One-Click Add**: Aggiungi criteri suggeriti con un solo click
- **Suggerimenti Personalizzati**: In base alla materia del template selezionato

### 📤 Import/Export
- **Export JSON**: Esporta l'intero documento in formato JSON (📤)
- **Import JSON**: Importa documenti salvati precedentemente (📥)
- **Download LaTeX**: Scarica il file .tex pronto per la compilazione (💾)
- **Copia Codice**: Copia il codice LaTeX negli appunti con un click (📋)
- **Stampa**: Funzione di stampa integrata (🖨️)

### ⌨️ Scorciatoie Tastiera
- `Ctrl + S` - Scarica file LaTeX
- `Ctrl + G` - Genera LaTeX
- `Ctrl + Z` - Annulla
- `Ctrl + Y` - Ripeti
- `Ctrl + P` - Stampa
- `Ctrl + E` - Esporta JSON
- `F1` - Mostra/Nascondi guida scorciatoie

## 📖 Come Usare

### 1. Aprire l'Editor

Apri il file `index.html` in un browser web moderno (Chrome, Firefox, Safari, Edge).

### 2. Scegliere un Template

Hai diverse opzioni per iniziare:

1. **Template Preimpostati** (📚 Template):
   - Clicca su "📚 Template" nella toolbar
   - Scegli tra Matematica, Italiano, Scienze o Informatica
   - Il template verrà caricato con campi precompilati di esempio

2. **Template Personalizzati** (💾 Miei Template):
   - Clicca su "💾 Miei Template" per vedere i template salvati
   - Scegli un template dalla lista
   - Gestisci i template (rinomina o elimina)

3. **Template da File** (📂 Carica):
   - Carica il template `templateGestionaleLab.tex` incluso nel progetto

4. **Nuovo Template** (➕ Nuovo):
   - Inizia da zero con un template vuoto

### 3. Compilare il Template

1. **Informazioni Generali**:
   - Inserisci il tempo previsto (es. "100 minuti")
   - Inserisci il nome del/dei docente/i (es. "Prof. Mario Rossi")

2. **Esercizi**:
   - Inserisci la consegna generale
   - Aggiungi esercizi con "➕ Aggiungi Esercizio"
   - Per ogni esercizio:
     - Inserisci il testo dell'esercizio
     - Clicca su "📋 Duplica" per duplicare un esercizio
     - Clicca su "🗑️ Rimuovi" per eliminarlo
   - Il contatore caratteri ti avviserà se il testo è troppo lungo

3. **Griglia di Valutazione**:
   - Clicca su "➕ Aggiungi Descrittore"
   - Per ogni descrittore:
     - Descrizione (es. "Comprensione del testo")
     - Punteggio massimo (es. "10")
   - Usa i "💡 Suggerimenti" per aggiungere criteri comuni

### 4. Generare e Visualizzare

1. **Generazione Manuale**:
   - Clicca su "🔄 Genera" per generare il codice LaTeX
   - Il codice apparirà nel pannello di anteprima

2. **Modalità Tempo Reale** (consigliata):
   - Clicca su "⚡ Tempo Reale" per attivare l'anteprima automatica
   - Il codice si aggiornerà automaticamente mentre scrivi

3. **Anteprima**:
   - Passa tra "📄 Codice LaTeX" e "👁️ Anteprima Visuale"
   - Usa "⛶ Fullscreen" per vedere solo l'anteprima
   - Usa "◧ Compatta" per ridurre lo spazio verticale

### 5. Salvare e Esportare

1. **Download File LaTeX**:
   - Clicca su "💾 Scarica" per scaricare il file .tex
   - Il file sarà pronto per la compilazione

2. **Salva come Template Personalizzato**:
   - Vai su "💾 Miei Template" → "➕ Salva come Template"
   - Inserisci un nome per il template
   - Riutilizzalo in futuro

3. **Export/Import JSON**:
   - Usa "📤 Export" per salvare il documento in JSON
   - Usa "📥 Import" per caricare un documento salvato
   - Utile per backup o per condividere documenti

4. **Altre Funzioni**:
   - "📋 Copia Codice" per copiare il LaTeX negli appunti
   - "🖨️ Stampa" per stampare direttamente

### 6. Funzioni Avanzate

1. **Cronologia e Versioni**:
   - Clicca su "📜 Versioni" per vedere la cronologia
   - Ripristina versioni precedenti
   - L'autosave salva automaticamente ogni 5 minuti

2. **Undo/Redo**:
   - Usa "↶ Annulla" e "↷ Ripeti"
   - Oppure `Ctrl+Z` e `Ctrl+Y`

3. **Statistiche**:
   - Clicca su "📊 Statistiche" per vedere:
     - Numero di esercizi e descrittori
     - Punteggio totale
     - Tempo previsto
     - Avvisi di validazione

4. **Temi e Modalità**:
   - "🌓 Tema" per passare tra chiaro e scuro
   - "⛶ Fullscreen" per modalità a schermo intero
   - "◧ Compatta" per layout compatto

## 📁 File Inclusi

- `index.html` - Interfaccia principale dell'editor con tutti i pannelli e toolbar
- `style.css` - Stili completi con tema scuro/chiaro, responsive design e animazioni
- `app.js` - Logica dell'applicazione (1543 righe) con tutte le 30+ funzionalità
- `templateGestionaleLab.tex` - Template di esempio per esami di laboratorio
- `document.tex` - Documento LaTeX di base
- `README.md` - Questa documentazione

## 💻 Requisiti

- **Browser**: Browser web moderno con JavaScript abilitato
  - Chrome 90+ (consigliato)
  - Firefox 88+
  - Safari 14+
  - Edge 90+
- **LocalStorage**: Abilitato per salvare template e versioni
- **Connessione Internet**: NON richiesta (funziona completamente offline)
- **Per Compilazione LaTeX**: LaTeX (TexLive, MiKTeX, etc.) con classe `verifica`

## 📦 Classe LaTeX Richiesta

I template generati utilizzano la classe `verifica`. Assicurati di avere questa classe installata nel tuo sistema LaTeX o disponibile nella stessa directory del file .tex.

## 🎯 Funzionalità Complete (30+)

1. ✏️ Editor visuale con form dinamici
2. 📄 Generazione automatica LaTeX
3. 👁️ Anteprima HTML visuale
4. ⚡ Modalità tempo reale
5. 💾 4 Template preimpostati per materie
6. 🗂️ Sistema template personalizzati
7. 📜 Cronologia versioni (20 versioni)
8. 💾 Autosave ogni 5 minuti
9. ↶↷ Undo/Redo (50 livelli)
10. 🌓 Tema scuro/chiaro
11. ⛶ Modalità fullscreen
12. ◧ Modalità compatta
13. 📊 Pannello statistiche
14. ⚠️ Validazione automatica
15. 📈 Contatore caratteri con avvisi
16. 💡 Suggerimenti intelligenti per materia
17. ➕ Gestione multipla esercizi
18. 📋 Duplicazione esercizi
19. ➕ Gestione descrittori valutazione
20. 📤 Export JSON
21. 📥 Import JSON
22. 💾 Download file .tex
23. 📋 Copia codice negli appunti
24. 🖨️ Funzione stampa
25. 📂 Carica template da file
26. ➕ Nuovo template vuoto
27. 🔄 Aggiornamento live statistiche
28. 🎨 Design responsive
29. ⌨️ Scorciatoie tastiera complete
30. 💾 Salvataggio locale persistente
31. 🏷️ Rinomina template salvati
32. 🗑️ Elimina template salvati

## 🔧 Personalizzazione

### Modificare i Template Preimpostati

Modifica l'oggetto `presetTemplates` in `app.js` (circa linea 400):

```javascript
const presetTemplates = {
    matematica: {
        tempo: "Il tuo tempo",
        docente: "Il tuo nome",
        consegna: "La tua consegna",
        // ...
    }
}
```

### Modificare i Suggerimenti

Modifica l'oggetto `suggestions` in `app.js` (circa linea 600):

```javascript
const suggestions = {
    matematica: [
        { text: "Il tuo suggerimento", points: "Punti" }
    ]
}
```

### Personalizzare i Colori

Modifica le variabili CSS in `style.css`:

```css
:root {
    --primary: #4a90e2;
    --success: #27ae60;
    /* ... */
}
```

## 💡 Suggerimenti e Best Practices

### Per Massima Produttività

1. **Attiva la Modalità Tempo Reale** (⚡): Vedrai le modifiche istantaneamente
2. **Salva Template Personalizzati**: Riutilizza verifiche simili
3. **Usa le Scorciatoie**: `Ctrl+G` per generare, `Ctrl+S` per scaricare
4. **Monitora le Statistiche**: Verifica che il punteggio totale sia corretto
5. **Sfrutta i Suggerimenti**: Aggiungi criteri di valutazione comuni con un click

### Per la Gestione Documenti

1. **Export JSON Periodico**: Fai backup dei documenti importanti
2. **Cronologia Versioni**: Usa il pannello versioni per confrontare modifiche
3. **Template per Materia**: Crea un template base per ogni materia che insegni
4. **Duplica Esercizi**: Per esercizi simili, duplica invece di riscrivere

### Per l'Anteprima

1. **Fullscreen per Revisione**: Usa la modalità fullscreen per revisionare il documento
2. **Modalità Compatta**: Per documenti lunghi, usa la modalità compatta
3. **Anteprima Visuale**: Controlla la formattazione prima di scaricare
4. **Tema Scuro**: Per lavorare la sera, attiva il tema scuro

## 📝 Note Importanti

- **Salvataggio Locale**: Tutti i dati sono salvati nel browser (localStorage)
  - I template personalizzati persistono tra le sessioni
  - La cronologia versioni è limitata a 20 versioni
  - Cancellare i dati del browser eliminerà template e versioni salvate

- **Offline First**: L'editor funziona completamente offline
  - Nessun dato viene inviato a server esterni
  - Nessuna connessione internet richiesta dopo il primo caricamento

- **Compatibilità LaTeX**: I file generati sono compatibili con LaTeX standard
  - Richiede la classe `verifica` per la compilazione
  - Usa pacchetti comuni (babel, inputenc, etc.)

- **Limiti del Browser**:
  - localStorage ha un limite di ~5-10MB
  - Sufficienti per centinaia di template e versioni
  - Se raggiungi il limite, elimina template/versioni non necessarie

## 🐛 Risoluzione Problemi

### L'autosave non funziona
- Verifica che localStorage sia abilitato nel browser
- Controlla che non sia in modalità navigazione privata

### I template personalizzati non si salvano
- Verifica lo spazio disponibile in localStorage
- Prova a eliminare vecchi template non utilizzati

### Il codice LaTeX non si genera
- Controlla che tutti i campi obbligatori siano compilati
- Verifica la console del browser per eventuali errori

### L'anteprima visuale non corrisponde
- L'anteprima HTML è una rappresentazione semplificata
- Per la versione finale, compila sempre il file .tex

## 🤝 Supporto

Per problemi, suggerimenti o richieste di funzionalità:
- Apri una issue nel repository GitHub
- Descrivi il problema in dettaglio
- Includi screenshot se possibile

## 📄 Licenza

Questo progetto è open source. Sentiti libero di usarlo, modificarlo e distribuirlo.
