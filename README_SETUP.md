# LaTeX WYSIWYG Editor - Setup Completo

Editor visuale per la creazione di verifiche scolastiche in LaTeX con compilazione pdflatex.

## Architettura

- **Frontend**: HTML + JavaScript (app.js)
- **Backend**: Flask (backend.py) - compila LaTeX localmente con pdflatex
- **Output**: PDF compilato reale tramite pdflatex

## Requisiti

### 1. Python 3.x
```bash
# Verifica versione
python3 --version
```

### 2. pdflatex (TexLive o MiKTeX)

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install texlive-latex-base texlive-latex-extra texlive-fonts-recommended texlive-lang-italian
```

**macOS:**
```bash
brew install --cask mactex
```

**Windows:**
1. Scarica MiKTeX: https://miktex.org/download
2. Installa con le opzioni predefinite
3. Aggiungi `C:\Program Files\MiKTeX\miktex\bin\x64\` al PATH

### 3. Dipendenze Python
```bash
pip install -r requirements.txt
```

## Avvio

### 1. Avvia il Backend
```bash
python backend.py
```

Output atteso:
```
🚀 Server LaTeX backend in esecuzione su http://localhost:5000
📝 Endpoint: POST /compile
💚 Health check: GET /health
```

### 2. Apri il Frontend
Apri `index.html` nel browser oppure usa un server locale:

```bash
# Python
python -m http.server 8000

# Node.js
npx http-server
```

Poi apri: **http://localhost:8000**

## Utilizzo

1. **Compila il template** usando i campi del form
2. Clicca **"Genera"** per:
   - Generare codice LaTeX
   - Compilare con pdflatex (via backend)
   - Visualizzare PDF risultante
3. **Tab disponibili**:
   - 📄 **Codice LaTeX**: Modifica il codice generato
   - 📕 **PDF Compilato**: Visualizza PDF reale da pdflatex

## Funzionalità

✅ Form WYSIWYG per compilazione template
✅ Generazione codice LaTeX
✅ Compilazione pdflatex **REALE** (via backend locale)
✅ Visualizzazione PDF nel browser
✅ Modifica bidirezionale LaTeX ↔ Form
✅ Download file .tex e PDF
✅ Calcolo automatico formula voti
✅ Template personalizzati
✅ Cronologia versioni
✅ Autosalvataggio

## Troubleshooting

### Backend non raggiungibile
**Errore**: "Backend non raggiungibile"

**Soluzione**:
1. Verifica che il backend sia in esecuzione: `python backend.py`
2. Controlla che sia su http://localhost:5000
3. Verifica che non ci siano firewall che bloccano la porta 5000

### pdflatex non trovato
**Errore**: "pdflatex: not found"

**Soluzione**:
```bash
# Verifica installazione
which pdflatex  # Linux/macOS
where pdflatex  # Windows

# Se non trovato, installa TexLive/MiKTeX (vedi Requisiti)
```

### Errori di compilazione LaTeX
**Errore**: "Errori nella compilazione LaTeX"

**Soluzione**:
1. Controlla il codice LaTeX generato nel tab "Codice LaTeX"
2. Scarica il file .tex
3. Prova a compilarlo localmente per vedere gli errori dettagliati:
   ```bash
   pdflatex document.tex
   ```
4. Controlla il file document.log per errori

### CORS errors (se usi file:// )
**Errore**: "CORS policy"

**Soluzione**: Non aprire index.html direttamente (file://), usa un server locale:
```bash
python -m http.server 8000
# Poi apri http://localhost:8000
```

## File Principali

```
LaTeXEditor/
├── index.html          # Frontend UI
├── app.js              # Logica applicazione
├── style.css           # Stili
├── backend.py          # Backend Flask per pdflatex
├── requirements.txt    # Dipendenze Python
├── README_BACKEND.md   # Documentazione backend
└── README_SETUP.md     # Questo file
```

## API Backend

### POST /compile
Compila codice LaTeX in PDF

**Request:**
```json
{
  "latex": "\\documentclass{article}..."
}
```

**Response:** PDF binary (application/pdf)

### GET /health
Verifica stato backend

**Response:**
```json
{
  "status": "ok",
  "pdflatex": "available"
}
```

## Note Importanti

1. **Il backend DEVE essere in esecuzione** per compilare PDF
2. **pdflatex DEVE essere installato** sul sistema
3. L'unico output PDF è quello **compilato realmente con pdflatex**
4. Non ci sono servizi esterni - tutto è locale
5. I file temporanei vengono eliminati automaticamente

## Supporto

Per problemi o domande, controlla:
1. README_BACKEND.md per dettagli backend
2. Console del browser (F12) per errori frontend
3. Output terminal del backend.py per errori compilazione
