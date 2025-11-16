# Backend LaTeX - Compilazione PDF

Questo backend Flask compila file LaTeX in PDF usando pdflatex locale.

## Requisiti

- **Python 3.x** installato
- **pdflatex** installato (TexLive o MiKTeX)
- Dipendenze Python: Flask, flask-cors

## Installazione

```bash
# Installa le dipendenze Python
pip install -r requirements.txt
```

### Installazione pdflatex

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install texlive-latex-base texlive-latex-extra texlive-fonts-recommended
```

#### macOS
```bash
brew install --cask mactex
```

#### Windows
Scarica e installa MiKTeX da: https://miktex.org/download

## Avvio del Backend

```bash
python backend.py
```

Il server sarà disponibile su **http://localhost:5000**

## Test

Verifica che il backend sia attivo:
```bash
curl http://localhost:5000/health
```

Risposta attesa:
```json
{"status": "ok", "pdflatex": "available"}
```

## API Endpoints

### POST /compile
Compila codice LaTeX in PDF

**Request:**
```json
{
  "latex": "\\documentclass{article}\\begin{document}Hello World\\end{document}"
}
```

**Response:** PDF file (application/pdf)

### GET /health
Health check del backend

**Response:**
```json
{
  "status": "ok",
  "pdflatex": "available"
}
```

## Note

- Il backend usa directory temporanee che vengono eliminate automaticamente
- La compilazione ha un timeout di 30 secondi
- pdflatex viene eseguito 2 volte per risolvere le referenze
- Gli errori di compilazione vengono estratti dal file .log
