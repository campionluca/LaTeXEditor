// === TOAST NOTIFICATIONS ===
function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);

    // Auto-remove dopo duration
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Template LaTeX di base
let currentTemplate = `\\documentclass{verifica}

\\usepackage[utf8]{inputenc}
\\usepackage[italian]{babel}
\\usepackage[T1]{fontenc}
\\usepackage{lmodern}
\\usepackage{ulem}
\\usepackage{float}
\\usepackage{eurosym}
\\tempo{{{TEMPO}}}
\\docente{{{DOCENTE}}}

\\begin{document}

{{INTESTAZIONE}}

{{CONSEGNA}}

\\begin{esercizi}
{{ESERCIZI}}
\\end{esercizi}
{{TABELLA}}
\\totpunti[]
\\end{document}
`;

// Stato dell'applicazione
let descrittori = [];
let descrittoreCounter = 1;
let esercizi = [];
let eserciziCounter = 1;

// History per undo/redo
let history = [];
let historyIndex = -1;
const MAX_HISTORY = 50;

// Autosave timer
let autosaveTimer = null;

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    initializeApp();
    setupEventListeners();
    if (descrittori.length === 0) {
        addDescrittore();
        addDescrittore();
    }
    if (esercizi.length === 0) {
        addEsercizio();
    }
    loadTheme();
});

function initializeApp() {
    // Carica valori di default se non ci sono dati salvati
    if (!document.getElementById('tempo').value) {
        document.getElementById('tempo').value = '100 minuti';
    }
    if (!document.getElementById('docente').value) {
        document.getElementById('docente').value = 'Proff. Luca Campion, Riccardo Rossi';
    }

    // Imposta l'editor LaTeX sempre in modalità modifica di default
    const editableToggle = document.getElementById('editableToggle');
    const preview = document.getElementById('latexPreview');
    const editor = document.getElementById('latexEditor');

    editableToggle.checked = true;
    preview.style.display = 'none';
    editor.style.display = 'block';
}

function setupEventListeners() {
    // Pulsanti toolbar
    document.getElementById('addDescrittoreBtn').addEventListener('click', () => {
        addDescrittore();
        saveState();
    });
    document.getElementById('addEsercizioBtn').addEventListener('click', () => {
        addEsercizio();
        saveState();
    });
    document.getElementById('generateBtn').addEventListener('click', generateLatex);
    document.getElementById('downloadBtn').addEventListener('click', downloadLatex);
    document.getElementById('copyCodeBtn').addEventListener('click', copyCode);
    document.getElementById('loadTemplateBtn').addEventListener('click', loadTemplate);
    document.getElementById('newTemplateBtn').addEventListener('click', newTemplate);

    // Nuove funzionalità
    document.getElementById('exportJsonBtn').addEventListener('click', exportProject);
    document.getElementById('importJsonBtn').addEventListener('click', () => {
        document.getElementById('jsonFileInput').click();
    });
    document.getElementById('jsonFileInput').addEventListener('change', importProject);
    document.getElementById('undoBtn').addEventListener('click', undo);
    document.getElementById('redoBtn').addEventListener('click', redo);
    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);

    // Checkbox mostra tabella descrittori
    document.getElementById('mostraTabella').addEventListener('change', function() {
        const container = document.getElementById('descrittoriContainer');
        const btn = document.getElementById('addDescrittoreBtn');
        if (this.checked) {
            container.style.display = 'block';
            btn.style.display = 'inline-block';
        } else {
            container.style.display = 'none';
            btn.style.display = 'none';
        }
    });

    // Nuovi pulsanti
    document.getElementById('printBtn').addEventListener('click', printDocument);
    document.getElementById('statsBtn').addEventListener('click', toggleStats);
    document.getElementById('closeStatsBtn').addEventListener('click', () => {
        document.getElementById('statsPanel').classList.remove('show');
    });

    // Custom templates
    document.getElementById('customTemplatesBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('customTemplatesMenu').classList.toggle('show');
    });
    document.getElementById('saveAsTemplateBtn').addEventListener('click', () => {
        saveAsTemplate();
        document.getElementById('customTemplatesMenu').classList.remove('show');
    });

    // Template preimpostati
    document.getElementById('presetsBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('presetsMenu').classList.toggle('show');
    });

    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const preset = e.target.dataset.preset;
            if (preset) {
                loadPreset(preset);
                document.getElementById('presetsMenu').classList.remove('show');
            }
        });
    });

    // Nuove funzionalità avanzate
    document.getElementById('versionsBtn').addEventListener('click', showVersionHistory);
    document.getElementById('realtimeBtn').addEventListener('click', toggleRealtime);
    document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);
    document.getElementById('compactBtn').addEventListener('click', toggleCompactMode);

    // Editor LaTeX edit/import
    document.getElementById('editableToggle').addEventListener('change', toggleLatexEdit);
    document.getElementById('importLatexBtn').addEventListener('click', importLatexToForm);

    // Chiudi dropdown quando si clicca fuori
    document.addEventListener('click', () => {
        document.getElementById('presetsMenu').classList.remove('show');
        document.getElementById('customTemplatesMenu').classList.remove('show');
    });

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchTab(tabName);
        });
    });

    // Autosave su input changes + realtime preview
    document.getElementById('tempo').addEventListener('input', () => {
        scheduleAutosave();
        scheduleRealtimeUpdate();
    });
    document.getElementById('docente').addEventListener('input', () => {
        scheduleAutosave();
        scheduleRealtimeUpdate();
    });
    document.getElementById('consegna').addEventListener('input', () => {
        scheduleAutosave();
        scheduleRealtimeUpdate();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Initialize custom templates menu
    updateCustomTemplatesMenu();

    // Salva stato iniziale
    saveState();
}

// === ESERCIZI ===
function addEsercizio() {
    const id = eserciziCounter++;
    esercizi.push({ id, testo: '', stella: false, punti: 1 });

    const container = document.getElementById('eserciziContainer');
    const item = document.createElement('div');
    item.className = 'esercizio-item';
    item.id = `esercizio-${id}`;

    item.innerHTML = `
        <h4>
            Esercizio #${id}
            <div>
                <button class="btn btn-secondary btn-small" onclick="duplicateEsercizio(${id})" title="Duplica esercizio">📋 Duplica</button>
                <button class="btn btn-danger btn-small" onclick="removeEsercizio(${id})">🗑️ Rimuovi</button>
            </div>
        </h4>
        <div class="form-group">
            <label>
                <input type="checkbox" id="stella-${id}" onchange="updateEsercizio(${id}); scheduleAutosave();">
                Esercizio con stella ($\\star$)
            </label>
        </div>
        <div class="form-group">
            <label>Testo:</label>
            <textarea id="esercizio-text-${id}" rows="2"
                placeholder="Descrizione dell'esercizio..."
                oninput="updateEsercizio(${id}); updateCharCounter(${id}); scheduleAutosave(); scheduleRealtimeUpdate();"></textarea>
            <div class="char-counter" id="counter-esercizio-${id}">0 caratteri, 0 parole</div>
        </div>
        <div class="form-group">
            <label>Punti:</label>
            <input type="number" id="punti-es-${id}" value="1" min="0" step="1"
                oninput="updateEsercizio(${id}); scheduleAutosave(); scheduleRealtimeUpdate();">
        </div>
    `;

    container.appendChild(item);
    updateCharCounter(id);
}

function removeEsercizio(id) {
    const item = document.getElementById(`esercizio-${id}`);
    if (item) {
        item.remove();
        esercizi = esercizi.filter(e => e.id !== id);
        saveState();
    }
}

function updateEsercizio(id) {
    const testo = document.getElementById(`esercizio-text-${id}`)?.value || '';
    const stella = document.getElementById(`stella-${id}`)?.checked || false;
    const punti = parseInt(document.getElementById(`punti-es-${id}`)?.value) || 1;

    const index = esercizi.findIndex(e => e.id === id);
    if (index !== -1) {
        esercizi[index].testo = testo;
        esercizi[index].stella = stella;
        esercizi[index].punti = punti;
    }
}

// === DESCRITTORI ===
function addDescrittore() {
    const id = descrittoreCounter++;
    descrittori.push({ id, descrittore: '', punti: '' });

    const container = document.getElementById('descrittoriContainer');
    const item = document.createElement('div');
    item.className = 'descrittore-item';
    item.id = `descrittore-${id}`;

    item.innerHTML = `
        <h4>
            Descrittore #${id}
            <div>
                <button class="btn btn-secondary btn-small" onclick="duplicateDescrittore(${id})" title="Duplica descrittore">📋 Duplica</button>
                <button class="btn btn-danger btn-small" onclick="removeDescrittore(${id})">🗑️ Rimuovi</button>
            </div>
        </h4>
        <div class="descrittore-fields">
            <div class="form-group">
                <label>Descrizione:</label>
                <input type="text" id="desc-${id}" placeholder="es. Comprensione del testo"
                       oninput="updateDescrittore(${id}); scheduleAutosave();">
            </div>
            <div class="form-group">
                <label>Punti:</label>
                <input type="number" id="punti-${id}" placeholder="10"
                       oninput="updateDescrittore(${id}); scheduleAutosave();">
            </div>
        </div>
    `;

    container.appendChild(item);
}

function removeDescrittore(id) {
    const item = document.getElementById(`descrittore-${id}`);
    if (item) {
        item.remove();
        descrittori = descrittori.filter(d => d.id !== id);
        saveState();
    }
}

function updateDescrittore(id) {
    const desc = document.getElementById(`desc-${id}`)?.value || '';
    const punti = document.getElementById(`punti-${id}`)?.value || '';

    const index = descrittori.findIndex(d => d.id === id);
    if (index !== -1) {
        descrittori[index].descrittore = desc;
        descrittori[index].punti = punti;
    }
}

// === GENERAZIONE LATEX ===
function generateLatex() {
    const tempo = document.getElementById('tempo').value || '100 minuti';
    const docente = document.getElementById('docente').value || 'Proff. Luca Campion, Riccardo Rossi';
    const consegna = document.getElementById('consegna').value || 'Inserisci la consegna';
    const tipoIntestazione = document.getElementById('tipoIntestazione')?.value || 'semplice';

    // Mappa tipo intestazione al comando LaTeX
    const intestazioneMap = {
        'semplice': '\\intestazionesemplice',
        'default': '\\intestazionedefault',
        'righe': '\\intestazionerighe'
    };
    const intestazioneCmd = intestazioneMap[tipoIntestazione] || '\\intestazionesemplice';

    // Aggiorna i dati degli esercizi
    esercizi.forEach(e => {
        const testo = document.getElementById(`esercizio-text-${e.id}`)?.value || '';
        const stella = document.getElementById(`stella-${e.id}`)?.checked || false;
        e.testo = testo;
        e.stella = stella;
    });

    // Genera la sezione esercizi
    let eserciziText = '';
    let punteggiEsercizi = 0;
    esercizi.forEach(e => {
        if (e.testo) {
            const prefix = e.stella ? '($\\\\star$) ' : '';
            // Converti newline JavaScript in newline LaTeX
            const testoLatex = e.testo.replace(/\n/g, '\\\\ ');
            const punti = e.punti || 1;
            // Aggiungi \punti{} ad ogni esercizio con punteggio personalizzato
            eserciziText += `    \\item ${prefix}${testoLatex} \\punti{${punti}}\n`;
            punteggiEsercizi += punti;
        }
    });

    // Controlla se la tabella descrittori deve essere mostrata
    const mostraTabella = document.getElementById('mostraTabella')?.checked;

    let descrittoriRows = '';
    let tabellaLatex = '';
    let totalePunti = 0;

    if (mostraTabella) {
        // Aggiorna i dati dei descrittori
        descrittori.forEach(d => {
            const desc = document.getElementById(`desc-${d.id}`)?.value || '';
            const punti = document.getElementById(`punti-${d.id}`)?.value || '';
            d.descrittore = desc;
            d.punti = punti;
        });

        // Genera le righe dei descrittori
        descrittori.forEach(d => {
            if (d.descrittore && d.punti) {
                descrittoriRows += `${d.descrittore}                                        & $\\_\\_\\_\\_$/${d.punti}            \\\\ \\hline\n`;
                totalePunti += parseInt(d.punti) || 0;
            }
        });

        // Aggiungi automaticamente il descrittore "Funzionamento" con somma punti esercizi
        if (punteggiEsercizi > 0) {
            descrittoriRows += `Funzionamento                                        & $\\_\\_\\_\\_$/${punteggiEsercizi}            \\\\ \\hline\n`;
            totalePunti += punteggiEsercizi;
        }

        if (descrittoriRows === '') {
            descrittoriRows = 'Inserisci descrittori                                        & $\\_\\_\\_\\_$/10            \\\\ \\hline\n';
            totalePunti = 10;
        }

        // Genera la tabella completa
        tabellaLatex = `\\begin{table}[H]
    \\centering
\\begin{tabular}{|l|c|c|}
\\hline
\\textbf{Descrittore}                          & \\textbf{Punti ottenuti} \\\\ \\hline
${descrittoriRows}
\\end{tabular}
\\end{table}`;
    } else {
        // Se la tabella non è mostrata, il totale è solo la somma dei punti degli esercizi
        totalePunti = punteggiEsercizi;
    }

    // Calcola la formula per \totpunti[] con voto max e min configurabili
    const votoMin = Math.round(parseFloat(document.getElementById('votoMinimo')?.value) || 0);
    const votoMax = Math.round(parseFloat(document.getElementById('votoMassimo')?.value) || 10);
    const diffVoti = votoMax - votoMin; // Calcola la differenza
    let totpuntiFormula = '';

    if (totalePunti > 0) {
        // Formula semplificata con valori già calcolati
        if (votoMin <= 0) {
            totpuntiFormula = `[/${totalePunti}*${diffVoti}]`;
        } else {
            totpuntiFormula = `[/${totalePunti}*${diffVoti}+${votoMin}]`;
        }
    } else {
        // Default se non ci sono descrittori
        if (votoMin <= 0) {
            totpuntiFormula = `[/1*${diffVoti}]`;
        } else {
            totpuntiFormula = `[/1*${diffVoti}+${votoMin}]`;
        }
    }

    // Formatta la consegna generale
    let consegnaLatex = '';
    if (consegna && consegna.trim() !== '' && consegna !== 'Inserisci la consegna') {
        consegnaLatex = `\\noindent\\textbf{Consegna:} ${consegna}\n\n\\vspace{0.3cm}`;
    }

    // Sostituisci i placeholder nel template
    let latex = currentTemplate
        .replace('{{TEMPO}}', tempo)
        .replace('{{DOCENTE}}', docente)
        .replace('{{INTESTAZIONE}}', intestazioneCmd)
        .replace('{{CONSEGNA}}', consegnaLatex)
        .replace('{{ESERCIZI}}', eserciziText)
        .replace('{{TABELLA}}', tabellaLatex)
        .replace('\\totpunti[]', `\\totpunti${totpuntiFormula}`);

    // Mostra il codice LaTeX generato nel preview e nell'editor
    const preview = document.getElementById('latexPreview');
    const editor = document.getElementById('latexEditor');
    preview.innerHTML = `<code>${escapeHtml(latex)}</code>`;
    editor.value = latex;

    // Compila il PDF e mostralo
    compilePDF(latex);

    // Passa automaticamente al tab PDF
    switchTab('pdf');
}

// === DOWNLOAD & COPY ===
function downloadLatex() {
    const latexCode = document.getElementById('latexPreview').textContent;

    if (latexCode === 'Il codice LaTeX apparirà qui dopo aver cliccato "Genera LaTeX"...') {
        showToast('Genera prima il codice LaTeX cliccando su "Genera LaTeX"!', 'warning');
        return;
    }

    const blob = new Blob([latexCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'verifica.tex';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function copyCode() {
    const latexCode = document.getElementById('latexPreview').textContent;

    if (latexCode === 'Il codice LaTeX apparirà qui dopo aver cliccato "Genera LaTeX"...') {
        showToast('Genera prima il codice LaTeX cliccando su "Genera LaTeX"!', 'warning');
        return;
    }

    navigator.clipboard.writeText(latexCode).then(() => {
        const btn = document.getElementById('copyCodeBtn');
        const originalText = btn.textContent;
        btn.textContent = '✅ Copiato!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    });
}

// === LATEX EDITING & IMPORT ===
function toggleLatexEdit() {
    const checkbox = document.getElementById('editableToggle');
    const preview = document.getElementById('latexPreview');
    const editor = document.getElementById('latexEditor');

    if (checkbox.checked) {
        // Mostra editor
        preview.style.display = 'none';
        editor.style.display = 'block';
        // Copia il contenuto del preview nell'editor
        editor.value = preview.textContent;
    } else {
        // Mostra preview
        editor.style.display = 'none';
        preview.style.display = 'block';
        // Aggiorna il preview con il contenuto modificato
        preview.innerHTML = `<code>${escapeHtml(editor.value)}</code>`;
    }
}

function importLatexToForm() {
    // Ottieni il codice LaTeX dall'editor o dal preview
    const editableToggle = document.getElementById('editableToggle');
    let latexCode;

    if (editableToggle.checked) {
        latexCode = document.getElementById('latexEditor').value;
    } else {
        latexCode = document.getElementById('latexPreview').textContent;
    }

    if (!latexCode || latexCode === 'Il codice LaTeX apparirà qui dopo aver cliccato "Genera LaTeX"...') {
        showToast('Nessun codice LaTeX da importare. Genera prima il LaTeX o attiva la modalità modifica.', 'warning');
        return;
    }

    if (!confirm('Importare il codice LaTeX nei campi? Questo sovrascriverà i dati attuali.')) {
        return;
    }

    try {
        // Parse LaTeX code e riempi i campi
        parseLatexToForm(latexCode);
        showToast('Codice LaTeX importato con successo nei campi!', 'success');
        saveState();
    } catch (error) {
        showToast('Errore durante l\'importazione: ' + error.message, 'error');
        console.error('Import error:', error);
    }
}

function parseLatexToForm(latex) {
    // Estrai tempo
    const tempoMatch = latex.match(/\\tempo\{([^}]+)\}/);
    if (tempoMatch) {
        document.getElementById('tempo').value = tempoMatch[1];
    }

    // Estrai docente
    const docenteMatch = latex.match(/\\docente\{([^}]+)\}/);
    if (docenteMatch) {
        document.getElementById('docente').value = docenteMatch[1];
    }

    // Estrai items/esercizi dall'ambiente esercizi
    const eserciziMatch = latex.match(/\\begin\{esercizi\}([\s\S]*?)\\end\{esercizi\}/);
    if (eserciziMatch) {
        const itemsText = eserciziMatch[1];
        const itemMatches = itemsText.matchAll(/\\item\s+([\s\S]*?)(?=\\item|$)/g);

        // Rimuovi tutti gli esercizi esistenti
        esercizi.forEach(e => {
            const item = document.getElementById(`esercizio-${e.id}`);
            if (item) item.remove();
        });
        esercizi = [];
        eserciziCounter = 1;

        // Aggiungi esercizi dal LaTeX
        for (const match of itemMatches) {
            let fullText = match[1].trim();

            // Controlla se c'è la stella
            const stellaMatch = fullText.match(/^\(\$\\star\$\)\s*/);
            const stella = !!stellaMatch;

            if (stellaMatch) {
                fullText = fullText.substring(stellaMatch[0].length);
            }

            // Estrai punti da \punti{N}
            const puntiMatch = fullText.match(/\\punti\{(\d+)\}/);
            const punti = puntiMatch ? parseInt(puntiMatch[1]) : 1;

            // Rimuovi \punti{N} dal testo
            if (puntiMatch) {
                fullText = fullText.replace(/\\punti\{\d+\}/, '').trim();
            }

            // Rimuovi newlines e pulisci
            fullText = fullText.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();

            if (fullText) {
                addEsercizio();
                const lastEsercizio = esercizi[esercizi.length - 1];
                document.getElementById(`esercizio-text-${lastEsercizio.id}`).value = fullText;
                document.getElementById(`stella-${lastEsercizio.id}`).checked = stella;
                document.getElementById(`punti-es-${lastEsercizio.id}`).value = punti;
                lastEsercizio.testo = fullText;
                lastEsercizio.stella = stella;
                lastEsercizio.punti = punti;
            }
        }
    }

    // Estrai griglia di valutazione
    const tabulaMatch = latex.match(/\\begin\{tabular\}\{[^}]+\}([\s\S]*?)\\end\{tabular\}/);
    if (tabulaMatch) {
        const rows = tabulaMatch[1].split('\\\\');

        // Rimuovi tutti i descrittori esistenti
        descrittori.forEach(d => {
            const item = document.getElementById(`descrittore-${d.id}`);
            if (item) item.remove();
        });
        descrittori = [];
        descrittoreCounter = 1;

        // Aggiungi descrittori dal LaTeX
        for (const row of rows) {
            const cells = row.split('&').map(c => c.trim());
            if (cells.length >= 2 && cells[0] && !cells[0].includes('hline') && !cells[0].includes('textbf')) {
                const descrittore = cells[0].replace(/\s+/g, ' ').trim();
                const puntiMatch = cells[1].match(/\/(\d+)/);
                const punti = puntiMatch ? puntiMatch[1] : '';

                if (descrittore && punti) {
                    addDescrittore();
                    const lastDescrittore = descrittori[descrittori.length - 1];
                    document.getElementById(`desc-${lastDescrittore.id}`).value = descrittore;
                    document.getElementById(`punti-${lastDescrittore.id}`).value = punti;
                    lastDescrittore.descrittore = descrittore;
                    lastDescrittore.punti = punti;
                }
            }
        }
    }

    // Estrai voto min e max da \totpunti[]
    // Formula con voto minimo: [/totalePunti*(votoMax-votoMin)/votoMin+votoMin]
    const totpuntiComplexMatch = latex.match(/\\totpunti\[\/\d+\*\(([0-9.]+)-([0-9.]+)\)\/[0-9.]+\+([0-9.]+)\]/);
    if (totpuntiComplexMatch) {
        const votoMax = totpuntiComplexMatch[1];
        const votoMin = totpuntiComplexMatch[3]; // Il votoMin è sia nel denominatore che sommato alla fine
        document.getElementById('votoMassimo').value = votoMax;
        document.getElementById('votoMinimo').value = votoMin;
    } else {
        // Formula semplice: [/totalePunti*votoMax]
        const totpuntiSimpleMatch = latex.match(/\\totpunti\[\/\d+\*([0-9.]+)\]/);
        if (totpuntiSimpleMatch) {
            const votoMax = totpuntiSimpleMatch[1];
            document.getElementById('votoMassimo').value = votoMax;
            document.getElementById('votoMinimo').value = '0';
        } else {
            // Default
            document.getElementById('votoMassimo').value = '10';
            document.getElementById('votoMinimo').value = '0';
        }
    }
}

// === TEMPLATE MANAGEMENT ===
function loadTemplate() {
    fetch('templateGestionaleLab.tex')
        .then(response => response.text())
        .then(data => {
            currentTemplate = data;
            parseTemplate(data);
            showToast('Template caricato con successo!', 'success');
        })
        .catch(error => {
            showToast('Impossibile caricare il template. Assicurati che il file templateGestionaleLab.tex sia presente.', 'error');
            console.error(error);
        });
}

function parseTemplate(template) {
    const tempoMatch = template.match(/\\tempo\{([^}]+)\}/);
    if (tempoMatch) {
        document.getElementById('tempo').value = tempoMatch[1];
    }

    const docenteMatch = template.match(/\\docente\{([^}]+)\}/);
    if (docenteMatch) {
        document.getElementById('docente').value = docenteMatch[1];
    }

    const consegnaMatch = template.match(/\\item\s+\{\{([^}]+)\}\}/);
    const es10Match = template.match(/\(\$\\star\$\)\s+\{\{([^}]+)\}\}/);

    if (consegnaMatch) {
        document.getElementById('consegna').placeholder = consegnaMatch[1];
    }
}

function newTemplate() {
    if (confirm('Creare un nuovo template? Tutti i dati non salvati andranno persi.')) {
        document.getElementById('tempo').value = '';
        document.getElementById('docente').value = '';
        document.getElementById('consegna').value = '';

        // Rimuovi tutti gli esercizi
        esercizi.forEach(e => {
            const item = document.getElementById(`esercizio-${e.id}`);
            if (item) item.remove();
        });
        esercizi = [];
        eserciziCounter = 1;
        addEsercizio();

        // Rimuovi tutti i descrittori
        descrittori.forEach(d => {
            const item = document.getElementById(`descrittore-${d.id}`);
            if (item) item.remove();
        });
        descrittori = [];
        descrittoreCounter = 1;
        addDescrittore();

        document.getElementById('latexPreview').innerHTML = '<code>Il codice LaTeX apparirà qui dopo aver cliccato "Genera LaTeX"...</code>';
        document.getElementById('visualPreview').innerHTML = '<p class="preview-placeholder">Clicca su "Genera LaTeX" per vedere l\'anteprima visuale</p>';

        saveState();
    }
}

// === EXPORT/IMPORT JSON ===
function exportProject() {
    const projectData = {
        tempo: document.getElementById('tempo').value,
        docente: document.getElementById('docente').value,
        consegna: document.getElementById('consegna').value,
        esercizi: esercizi.map(e => ({
            testo: document.getElementById(`esercizio-text-${e.id}`)?.value || '',
            stella: document.getElementById(`stella-${e.id}`)?.checked || false
        })),
        descrittori: descrittori.map(d => ({
            descrittore: document.getElementById(`desc-${d.id}`)?.value || '',
            punti: document.getElementById(`punti-${d.id}`)?.value || ''
        }))
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'progetto-latex.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importProject(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const projectData = JSON.parse(e.target.result);

            // Ripristina i dati
            document.getElementById('tempo').value = projectData.tempo || '';
            document.getElementById('docente').value = projectData.docente || '';
            document.getElementById('consegna').value = projectData.consegna || '';

            // Rimuovi esercizi esistenti
            esercizi.forEach(ex => {
                const item = document.getElementById(`esercizio-${ex.id}`);
                if (item) item.remove();
            });
            esercizi = [];
            eserciziCounter = 1;

            // Aggiungi esercizi importati
            projectData.esercizi.forEach(e => {
                addEsercizio();
                const currentId = eserciziCounter - 1;
                setTimeout(() => {
                    document.getElementById(`esercizio-text-${currentId}`).value = e.testo;
                    document.getElementById(`stella-${currentId}`).checked = e.stella;
                    document.getElementById(`punti-es-${currentId}`).value = e.punti || 1;
                }, 0);
            });

            // Rimuovi descrittori esistenti
            descrittori.forEach(d => {
                const item = document.getElementById(`descrittore-${d.id}`);
                if (item) item.remove();
            });
            descrittori = [];
            descrittoreCounter = 1;

            // Aggiungi descrittori importati
            projectData.descrittori.forEach(d => {
                addDescrittore();
                const currentId = descrittoreCounter - 1;
                setTimeout(() => {
                    document.getElementById(`desc-${currentId}`).value = d.descrittore;
                    document.getElementById(`punti-${currentId}`).value = d.punti;
                }, 0);
            });

            showToast('Progetto importato con successo!', 'success');
            saveState();
        } catch (error) {
            showToast('Errore nell\'importazione del file JSON: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);

    // Reset input
    event.target.value = '';
}

// === UNDO/REDO ===
function saveState() {
    const state = {
        tempo: document.getElementById('tempo').value,
        docente: document.getElementById('docente').value,
        consegna: document.getElementById('consegna').value,
        esercizi: esercizi.map(e => ({
            id: e.id,
            testo: document.getElementById(`esercizio-text-${e.id}`)?.value || '',
            stella: document.getElementById(`stella-${e.id}`)?.checked || false
        })),
        descrittori: descrittori.map(d => ({
            id: d.id,
            descrittore: document.getElementById(`desc-${d.id}`)?.value || '',
            punti: document.getElementById(`punti-${d.id}`)?.value || ''
        })),
        eserciziCounter,
        descrittoreCounter
    };

    // Rimuovi stati futuri se siamo in mezzo alla cronologia
    if (historyIndex < history.length - 1) {
        history = history.slice(0, historyIndex + 1);
    }

    history.push(JSON.parse(JSON.stringify(state)));

    if (history.length > MAX_HISTORY) {
        history.shift();
    } else {
        historyIndex++;
    }

    updateUndoRedoButtons();
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        restoreState(history[historyIndex]);
        updateUndoRedoButtons();
    }
}

function redo() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        restoreState(history[historyIndex]);
        updateUndoRedoButtons();
    }
}

function restoreState(state) {
    document.getElementById('tempo').value = state.tempo;
    document.getElementById('docente').value = state.docente;
    document.getElementById('consegna').value = state.consegna;

    // Ripristina esercizi
    esercizi.forEach(e => {
        const item = document.getElementById(`esercizio-${e.id}`);
        if (item) item.remove();
    });
    esercizi = [];
    eserciziCounter = state.eserciziCounter;

    state.esercizi.forEach(e => {
        esercizi.push({ id: e.id, testo: e.testo, stella: e.stella });
        const container = document.getElementById('eserciziContainer');
        const item = document.createElement('div');
        item.className = 'esercizio-item';
        item.id = `esercizio-${e.id}`;

        item.innerHTML = `
            <h4>
                Esercizio #${e.id}
                <button class="btn btn-danger btn-small" onclick="removeEsercizio(${e.id})">🗑️ Rimuovi</button>
            </h4>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="stella-${e.id}" ${e.stella ? 'checked' : ''} onchange="updateEsercizio(${e.id}); scheduleAutosave();">
                    Esercizio con stella ($\\star$)
                </label>
            </div>
            <div class="form-group">
                <label>Testo:</label>
                <textarea id="esercizio-text-${e.id}" rows="2"
                    placeholder="Descrizione dell'esercizio..."
                    oninput="updateEsercizio(${e.id}); scheduleAutosave();">${escapeHtml(e.testo)}</textarea>
            </div>
        `;
        container.appendChild(item);
    });

    // Ripristina descrittori
    descrittori.forEach(d => {
        const item = document.getElementById(`descrittore-${d.id}`);
        if (item) item.remove();
    });
    descrittori = [];
    descrittoreCounter = state.descrittoreCounter;

    state.descrittori.forEach(d => {
        descrittori.push({ id: d.id, descrittore: d.descrittore, punti: d.punti });
        const container = document.getElementById('descrittoriContainer');
        const item = document.createElement('div');
        item.className = 'descrittore-item';
        item.id = `descrittore-${d.id}`;

        item.innerHTML = `
            <h4>
                Descrittore #${d.id}
                <button class="btn btn-danger btn-small" onclick="removeDescrittore(${d.id})">🗑️ Rimuovi</button>
            </h4>
            <div class="descrittore-fields">
                <div class="form-group">
                    <label>Descrizione:</label>
                    <input type="text" id="desc-${d.id}" placeholder="es. Comprensione del testo"
                           value="${escapeHtml(d.descrittore)}"
                           oninput="updateDescrittore(${d.id}); scheduleAutosave();">
                </div>
                <div class="form-group">
                    <label>Punti:</label>
                    <input type="number" id="punti-${d.id}" placeholder="10"
                           value="${escapeHtml(d.punti)}"
                           oninput="updateDescrittore(${d.id}); scheduleAutosave();">
                </div>
            </div>
        `;
        container.appendChild(item);
    });
}

function updateUndoRedoButtons() {
    document.getElementById('undoBtn').disabled = historyIndex <= 0;
    document.getElementById('redoBtn').disabled = historyIndex >= history.length - 1;
}

// === AUTOSAVE ===
function scheduleAutosave() {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
        saveToLocalStorage();
        showAutosaveStatus();
    }, 1000);
}

function saveToLocalStorage() {
    const data = {
        tempo: document.getElementById('tempo').value,
        docente: document.getElementById('docente').value,
        consegna: document.getElementById('consegna').value,
        esercizi: esercizi.map(e => ({
            id: e.id,
            testo: document.getElementById(`esercizio-text-${e.id}`)?.value || '',
            stella: document.getElementById(`stella-${e.id}`)?.checked || false
        })),
        descrittori: descrittori.map(d => ({
            id: d.id,
            descrittore: document.getElementById(`desc-${d.id}`)?.value || '',
            punti: document.getElementById(`punti-${d.id}`)?.value || ''
        })),
        eserciziCounter,
        descrittoreCounter
    };

    localStorage.setItem('latexEditorData', JSON.stringify(data));
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem('latexEditorData');
    if (!savedData) return;

    try {
        const data = JSON.parse(savedData);

        document.getElementById('tempo').value = data.tempo || '';
        document.getElementById('docente').value = data.docente || '';
        document.getElementById('consegna').value = data.consegna || '';

        eserciziCounter = data.eserciziCounter || 1;
        descrittoreCounter = data.descrittoreCounter || 1;

        // Carica esercizi
        if (data.esercizi && data.esercizi.length > 0) {
            data.esercizi.forEach(e => {
                esercizi.push({ id: e.id, testo: e.testo, stella: e.stella });
                const container = document.getElementById('eserciziContainer');
                const item = document.createElement('div');
                item.className = 'esercizio-item';
                item.id = `esercizio-${e.id}`;

                item.innerHTML = `
                    <h4>
                        Esercizio #${e.id}
                        <button class="btn btn-danger btn-small" onclick="removeEsercizio(${e.id})">🗑️ Rimuovi</button>
                    </h4>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="stella-${e.id}" ${e.stella ? 'checked' : ''} onchange="updateEsercizio(${e.id}); scheduleAutosave();">
                            Esercizio con stella ($\\star$)
                        </label>
                    </div>
                    <div class="form-group">
                        <label>Testo:</label>
                        <textarea id="esercizio-text-${e.id}" rows="2"
                            placeholder="Descrizione dell'esercizio..."
                            oninput="updateEsercizio(${e.id}); scheduleAutosave();">${escapeHtml(e.testo)}</textarea>
                    </div>
                `;
                container.appendChild(item);
            });
        }

        // Carica descrittori
        if (data.descrittori && data.descrittori.length > 0) {
            data.descrittori.forEach(d => {
                descrittori.push({ id: d.id, descrittore: d.descrittore, punti: d.punti });
                const container = document.getElementById('descrittoriContainer');
                const item = document.createElement('div');
                item.className = 'descrittore-item';
                item.id = `descrittore-${d.id}`;

                item.innerHTML = `
                    <h4>
                        Descrittore #${d.id}
                        <button class="btn btn-danger btn-small" onclick="removeDescrittore(${d.id})">🗑️ Rimuovi</button>
                    </h4>
                    <div class="descrittore-fields">
                        <div class="form-group">
                            <label>Descrizione:</label>
                            <input type="text" id="desc-${d.id}" placeholder="es. Comprensione del testo"
                                   value="${escapeHtml(d.descrittore)}"
                                   oninput="updateDescrittore(${d.id}); scheduleAutosave();">
                        </div>
                        <div class="form-group">
                            <label>Punti:</label>
                            <input type="number" id="punti-${d.id}" placeholder="10"
                                   value="${escapeHtml(d.punti)}"
                                   oninput="updateDescrittore(${d.id}); scheduleAutosave();">
                        </div>
                    </div>
                `;
                container.appendChild(item);
            });
        }
    } catch (error) {
        console.error('Errore nel caricamento dei dati salvati:', error);
    }
}

function showAutosaveStatus() {
    const status = document.getElementById('autosaveStatus');
    status.classList.add('show');
    setTimeout(() => {
        status.classList.remove('show');
    }, 2000);
}

// === THEME TOGGLE ===
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function loadTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    }
}

// === TAB SWITCHING ===
function switchTab(tabName) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Add active class to selected tab and content
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

// === PDF COMPILATION ===
let currentPdfBlob = null;

// URL del backend (modificabile)
const BACKEND_URL = 'http://localhost:5000';

async function compilePDF(latexCode) {
    const pdfLoading = document.getElementById('pdfLoading');
    const pdfError = document.getElementById('pdfError');
    const pdfViewer = document.getElementById('pdfViewer');
    const pdfPlaceholder = document.getElementById('pdfPlaceholder');

    // Nascondi tutti gli elementi e mostra loading
    pdfPlaceholder.style.display = 'none';
    pdfError.style.display = 'none';
    pdfViewer.style.display = 'none';
    pdfLoading.style.display = 'flex';

    try {
        showToast('Compilazione PDF con pdflatex in corso...', 'info', 3000);

        // Prova prima a compilare con la classe verifica originale
        let response = await fetch(`${BACKEND_URL}/compile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                latex: latexCode
            })
        });

        // Se fallisce per classe verifica mancante, converti ad article
        if (!response.ok) {
            const errorData = await response.json();
            const errorMsg = errorData.error || '';

            // Se l'errore è dovuto a verifica.cls non trovato, converti ad article
            if (errorMsg.includes('verifica.cls') || errorMsg.includes('File `verifica') || errorMsg.includes('verifica.sty')) {
                showToast('Classe verifica non trovata, conversione ad article...', 'info', 2000);

                // Converti il documento per essere compilabile con pdflatex
                const compilableLatex = convertToCompilableLatex(latexCode);

                // Riprova con la versione convertita
                response = await fetch(`${BACKEND_URL}/compile`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        latex: compilableLatex
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Errore durante la compilazione');
                }
            } else {
                // Altri errori, rilancia
                throw new Error(errorMsg);
            }
        }

        // Ottieni il PDF come blob
        const pdfBlob = await response.blob();
        currentPdfBlob = pdfBlob;

        // Mostra il PDF
        const pdfUrl = URL.createObjectURL(pdfBlob);
        pdfViewer.src = pdfUrl;
        pdfLoading.style.display = 'none';
        pdfViewer.style.display = 'block';

        showToast('✅ PDF compilato con successo tramite pdflatex!', 'success', 4000);

    } catch (error) {
        console.error('Errore compilazione PDF:', error);

        pdfLoading.style.display = 'none';
        pdfError.style.display = 'flex';

        const errorMsg = document.getElementById('pdfErrorMessage');

        // Controlla se il backend non è raggiungibile
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
            errorMsg.innerHTML = `
                <strong>❌ Backend non raggiungibile</strong><br><br>
                Il server backend per la compilazione pdflatex non è attivo.<br><br>
                <strong>Per avviare il backend:</strong><br>
                1. Apri un terminale nella cartella del progetto<br>
                2. Installa le dipendenze: <code>pip install -r requirements.txt</code><br>
                3. Avvia il server: <code>python backend.py</code><br>
                4. Il backend sarà disponibile su http://localhost:5000<br><br>
                <strong>Requisiti:</strong><br>
                • Python 3.x installato<br>
                • pdflatex installato (TexLive o MiKTeX)
            `;
        } else {
            errorMsg.innerHTML = `
                <strong>❌ Errore durante la compilazione pdflatex</strong><br><br>
                ${escapeHtml(error.message)}<br><br>
                <strong>Cosa fare:</strong><br>
                • Controlla che tutti i campi siano compilati correttamente<br>
                • Scarica il file .tex e controlla gli errori di compilazione<br>
                • Verifica che pdflatex sia installato sul sistema<br>
                • Riprova la compilazione
            `;
        }

        showToast('Errore compilazione pdflatex', 'error', 6000);
    }
}


function convertToCompilableLatex(latexCode) {
    // Converti il documento dalla classe "verifica" ad "article"
    // reimplementando tutti i comandi custom nel preambolo

    // Estrai tempo e docente
    const tempoMatch = latexCode.match(/\\tempo\{([^}]+)\}/);
    const docenteMatch = latexCode.match(/\\docente\{([^}]+)\}/);
    const tempo = tempoMatch ? tempoMatch[1] : '100 minuti';
    const docente = docenteMatch ? docenteMatch[1] : '';

    // Estrai il contenuto del documento
    const beginDocMatch = latexCode.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
    const documentContent = beginDocMatch ? beginDocMatch[1] : '';

    // Crea un documento LaTeX compilabile con article class
    const compilableDoc = `\\documentclass[a4paper,12pt]{article}

\\usepackage[utf8]{inputenc}
\\usepackage[italian]{babel}
\\usepackage[T1]{fontenc}
\\usepackage{lmodern}
\\usepackage{geometry}
\\usepackage{enumitem}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{graphicx}
\\usepackage{float}
\\usepackage{fancyhdr}
\\usepackage{tabularx}

\\geometry{a4paper, margin=2cm}

% Ridefinisci i comandi della classe verifica
\\newcommand{\\tempo}[1]{\\def\\tempovalore{#1}}
\\newcommand{\\docente}[1]{\\def\\docentevalore{#1}}
\\newcommand{\\lineanome}{%
    \\vspace{0.5cm}
    \\noindent\\textbf{Nome:} \\underline{\\hspace{5cm}} \\textbf{Cognome:} \\underline{\\hspace{5cm}}\\\\[0.3cm]
    \\noindent\\textbf{Classe:} \\underline{\\hspace{3cm}} \\textbf{Data:} \\underline{\\hspace{3cm}}
    \\vspace{0.5cm}
}

\\newcommand{\\intestazionesemplice}{%
    \\begin{center}
        {\\Large\\bfseries VERIFICA}\\\\[0.5cm]
        \\textbf{Tempo a disposizione:} \\tempovalore\\\\
        \\textbf{Docente:} \\docentevalore
    \\end{center}
    \\lineanome
}

% Definisci l'ambiente esercizi come enumerate
\\newenvironment{esercizi}{%
    \\begin{enumerate}[label=\\arabic*.,leftmargin=*,itemsep=0.8cm]
}{%
    \\end{enumerate}
}

% Comando totpunti per calcolare il voto
\\newcommand{\\totpunti}[1]{%
    \\vspace{1cm}
    \\noindent\\textbf{VOTO:} \\underline{\\hspace{2cm}} / 10 \\quad (Formula: #1)
}

\\tempo{${tempo}}
\\docente{${docente}}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[L]{\\small Verifica}
\\fancyhead[R]{\\small \\today}

\\begin{document}

\\intestazionesemplice

${documentContent}

\\end{document}
`;

    return compilableDoc;
}

function retryPdfCompilation() {
    const latexCode = document.getElementById('latexEditor').value ||
                     document.getElementById('latexPreview').textContent;
    compilePDF(latexCode);
}

// === DUPLICATE FUNCTIONS ===
function duplicateEsercizio(id) {
    const sourceText = document.getElementById(`esercizio-text-${id}`)?.value || '';
    const sourceStella = document.getElementById(`stella-${id}`)?.checked || false;
    const sourcePunti = document.getElementById(`punti-es-${id}`)?.value || '1';

    addEsercizio();
    const newId = eserciziCounter - 1;

    setTimeout(() => {
        document.getElementById(`esercizio-text-${newId}`).value = sourceText;
        document.getElementById(`stella-${newId}`).checked = sourceStella;
        document.getElementById(`punti-es-${newId}`).value = sourcePunti;
        updateEsercizio(newId);
        saveState();
    }, 0);
}

function duplicateDescrittore(id) {
    const sourceDesc = document.getElementById(`desc-${id}`)?.value || '';
    const sourcePunti = document.getElementById(`punti-${id}`)?.value || '';

    addDescrittore();
    const newId = descrittoreCounter - 1;

    setTimeout(() => {
        document.getElementById(`desc-${newId}`).value = sourceDesc;
        document.getElementById(`punti-${newId}`).value = sourcePunti;
        updateDescrittore(newId);
        saveState();
    }, 0);
}

// === KEYBOARD SHORTCUTS ===
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + S - Download LaTeX
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        downloadLatex();
        return;
    }

    // Ctrl/Cmd + G - Generate LaTeX
    if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        generateLatex();
        return;
    }

    // Ctrl/Cmd + Z - Undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
    }

    // Ctrl/Cmd + Y - Redo
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
        return;
    }

    // Ctrl/Cmd + P - Print
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        printDocument();
        return;
    }

    // Ctrl/Cmd + E - Export JSON
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportProject();
        return;
    }

    // F1 - Toggle shortcuts help
    if (e.key === 'F1') {
        e.preventDefault();
        document.getElementById('shortcutsHelp').classList.toggle('show');
        return;
    }
}

// === PRINT ===
function printDocument() {
    // Genera il LaTeX se non è stato ancora generato
    const latexCode = document.getElementById('latexPreview').textContent;
    if (latexCode === 'Il codice LaTeX apparirà qui dopo aver cliccato "Genera LaTeX"...') {
        generateLatex();
    }

    // Passa alla tab visuale prima di stampare
    switchTab('visual');

    // Attendi un momento per il rendering e poi stampa
    setTimeout(() => {
        window.print();
    }, 100);
}

// === STATISTICS ===
function toggleStats() {
    const panel = document.getElementById('statsPanel');
    const isShowing = panel.classList.contains('show');

    if (!isShowing) {
        calculateStatistics();
    }

    panel.classList.toggle('show');
}

function calculateStatistics() {
    // Conta esercizi
    const numEsercizi = esercizi.filter(e => {
        const text = document.getElementById(`esercizio-text-${e.id}`)?.value || '';
        return text.trim().length > 0;
    }).length;

    // Conta descrittori
    const numDescrittori = descrittori.filter(d => {
        const desc = document.getElementById(`desc-${d.id}`)?.value || '';
        const punti = document.getElementById(`punti-${d.id}`)?.value || '';
        return desc.trim().length > 0 && punti.trim().length > 0;
    }).length;

    // Calcola punteggio totale
    let punteggioTotale = 0;
    descrittori.forEach(d => {
        const punti = parseInt(document.getElementById(`punti-${d.id}`)?.value || '0');
        if (!isNaN(punti)) {
            punteggioTotale += punti;
        }
    });

    // Ottieni tempo
    const tempo = document.getElementById('tempo').value || '-';

    // Aggiorna UI
    document.getElementById('statEsercizi').textContent = numEsercizi;
    document.getElementById('statDescrittori').textContent = numDescrittori;
    document.getElementById('statPunteggio').textContent = punteggioTotale;
    document.getElementById('statTempo').textContent = tempo;

    // Validazione e warnings
    const warnings = validateForm();
    const warningSection = document.getElementById('warningSection');
    const warningList = document.getElementById('warningList');

    if (warnings.length > 0) {
        warningList.innerHTML = warnings.map(w => `<li>${w}</li>`).join('');
        warningSection.style.display = 'block';
    } else {
        warningSection.style.display = 'none';
    }
}

function validateForm() {
    const warnings = [];

    // Verifica tempo
    const tempo = document.getElementById('tempo').value;
    if (!tempo || tempo.trim().length === 0) {
        warnings.push('Il tempo non è specificato');
    }

    // Verifica docente
    const docente = document.getElementById('docente').value;
    if (!docente || docente.trim().length === 0) {
        warnings.push('Il docente non è specificato');
    }

    // Verifica consegna
    const consegna = document.getElementById('consegna').value;
    if (!consegna || consegna.trim().length === 0) {
        warnings.push('La consegna generale è vuota');
    }

    // Verifica esercizi
    const eserciziVuoti = esercizi.filter(e => {
        const text = document.getElementById(`esercizio-text-${e.id}`)?.value || '';
        return text.trim().length === 0;
    }).length;

    if (eserciziVuoti > 0) {
        warnings.push(`${eserciziVuoti} esercizio/i vuoto/i`);
    }

    if (esercizi.length === 0) {
        warnings.push('Nessun esercizio aggiunto');
    }

    // Verifica descrittori
    const descrittoriIncompleti = descrittori.filter(d => {
        const desc = document.getElementById(`desc-${d.id}`)?.value || '';
        const punti = document.getElementById(`punti-${d.id}`)?.value || '';
        return desc.trim().length === 0 || punti.trim().length === 0;
    }).length;

    if (descrittoriIncompleti > 0) {
        warnings.push(`${descrittoriIncompleti} descrittore/i incompleto/i`);
    }

    if (descrittori.length === 0) {
        warnings.push('Nessun descrittore aggiunto');
    }

    return warnings;
}

// === TEMPLATE PRESETS ===
const presets = {
    matematica: {
        tempo: '60 minuti',
        docente: 'Prof. Matematica',
        consegna: 'Svolgere gli esercizi mostrando tutti i passaggi. Non è consentito l\'uso della calcolatrice.',
        esercizi: [
            { testo: 'Risolvi la seguente equazione di secondo grado: x² - 5x + 6 = 0', stella: false },
            { testo: 'Calcola il limite: lim(x→∞) (3x² + 2x - 1)/(x² + 1)', stella: true }
        ],
        descrittori: [
            { descrittore: 'Correttezza del procedimento', punti: '15' },
            { descrittore: 'Correttezza del risultato', punti: '10' },
            { descrittore: 'Chiarezza espositiva', punti: '5' }
        ]
    },
    italiano: {
        tempo: '90 minuti',
        docente: 'Prof. Italiano',
        consegna: 'Leggi attentamente il testo e rispondi alle domande seguenti in modo completo ed esauriente.',
        esercizi: [
            { testo: 'Analizza la struttura narrativa del brano proposto', stella: false },
            { testo: 'Commenta lo stile e le figure retoriche utilizzate dall\'autore', stella: true }
        ],
        descrittori: [
            { descrittore: 'Comprensione del testo', punti: '12' },
            { descrittore: 'Capacità di analisi', punti: '10' },
            { descrittore: 'Proprietà di linguaggio', punti: '8' }
        ]
    },
    scienze: {
        tempo: '75 minuti',
        docente: 'Prof. Scienze',
        consegna: 'Rispondi alle domande in modo chiaro e preciso, utilizzando la terminologia scientifica appropriata.',
        esercizi: [
            { testo: 'Descrivi il ciclo dell\'acqua e le sue fasi principali', stella: false },
            { testo: 'Spiega il processo di fotosintesi clorofilliana', stella: true }
        ],
        descrittori: [
            { descrittore: 'Conoscenza dei contenuti', punti: '14' },
            { descrittore: 'Uso del linguaggio scientifico', punti: '8' },
            { descrittore: 'Capacità di sintesi', punti: '8' }
        ]
    },
    informatica: {
        tempo: '60 minuti',
        docente: 'Prof. Informatica',
        consegna: 'Risolvi gli esercizi di programmazione mostrando il codice e spiegando la logica utilizzata.',
        esercizi: [
            { testo: 'Scrivi una funzione che calcoli il fattoriale di un numero', stella: false },
            { testo: 'Implementa un algoritmo di ordinamento (bubble sort o selection sort)', stella: true }
        ],
        descrittori: [
            { descrittore: 'Correttezza del codice', punti: '15' },
            { descrittore: 'Efficienza dell\'algoritmo', punti: '10' },
            { descrittore: 'Chiarezza dei commenti', punti: '5' }
        ]
    }
};

function loadPreset(presetName) {
    const preset = presets[presetName];
    if (!preset) return;

    if (!confirm(`Caricare il template "${presetName}"? Tutti i dati non salvati andranno persi.`)) {
        return;
    }

    // Imposta i valori di base
    document.getElementById('tempo').value = preset.tempo;
    document.getElementById('docente').value = preset.docente;
    document.getElementById('consegna').value = preset.consegna;

    // Rimuovi esercizi esistenti
    esercizi.forEach(e => {
        const item = document.getElementById(`esercizio-${e.id}`);
        if (item) item.remove();
    });
    esercizi = [];
    eserciziCounter = 1;

    // Aggiungi nuovi esercizi
    preset.esercizi.forEach(e => {
        addEsercizio();
        const currentId = eserciziCounter - 1;
        setTimeout(() => {
            document.getElementById(`esercizio-text-${currentId}`).value = e.testo;
            document.getElementById(`stella-${currentId}`).checked = e.stella;
            document.getElementById(`punti-es-${currentId}`).value = e.punti || 1;
            updateEsercizio(currentId);
        }, 0);
    });

    // Rimuovi descrittori esistenti
    descrittori.forEach(d => {
        const item = document.getElementById(`descrittore-${d.id}`);
        if (item) item.remove();
    });
    descrittori = [];
    descrittoreCounter = 1;

    // Aggiungi nuovi descrittori
    preset.descrittori.forEach(d => {
        addDescrittore();
        const currentId = descrittoreCounter - 1;
        setTimeout(() => {
            document.getElementById(`desc-${currentId}`).value = d.descrittore;
            document.getElementById(`punti-${currentId}`).value = d.punti;
            updateDescrittore(currentId);
        }, 0);
    });

    setTimeout(() => {
        saveState();
    }, 100);
}

// === CUSTOM TEMPLATES ===
let customTemplates = JSON.parse(localStorage.getItem('customTemplates') || '[]');

function saveAsTemplate() {
    const name = prompt('Nome del template:');
    if (!name) return;

    const template = {
        id: Date.now(),
        name: name,
        timestamp: new Date().toISOString(),
        data: {
            tempo: document.getElementById('tempo').value,
            docente: document.getElementById('docente').value,
            consegna: document.getElementById('consegna').value,
            esercizi: esercizi.map(e => ({
                testo: document.getElementById(`esercizio-text-${e.id}`)?.value || '',
                stella: document.getElementById(`stella-${e.id}`)?.checked || false
            })),
            descrittori: descrittori.map(d => ({
                descrittore: document.getElementById(`desc-${d.id}`)?.value || '',
                punti: document.getElementById(`punti-${d.id}`)?.value || ''
            }))
        }
    };

    customTemplates.push(template);
    localStorage.setItem('customTemplates', JSON.stringify(customTemplates));
    updateCustomTemplatesMenu();
    showToast(`Template "${name}" salvato con successo!`, 'success');
}

function loadCustomTemplate(id) {
    const template = customTemplates.find(t => t.id === id);
    if (!template) return;

    if (!confirm(`Caricare il template "${template.name}"? I dati correnti andranno persi.`)) {
        return;
    }

    const data = template.data;
    document.getElementById('tempo').value = data.tempo || '';
    document.getElementById('docente').value = data.docente || '';
    document.getElementById('consegna').value = data.consegna || '';

    // Rimuovi esercizi esistenti
    esercizi.forEach(e => {
        const item = document.getElementById(`esercizio-${e.id}`);
        if (item) item.remove();
    });
    esercizi = [];
    eserciziCounter = 1;

    // Aggiungi nuovi esercizi
    data.esercizi.forEach(e => {
        addEsercizio();
        const currentId = eserciziCounter - 1;
        setTimeout(() => {
            document.getElementById(`esercizio-text-${currentId}`).value = e.testo;
            document.getElementById(`stella-${currentId}`).checked = e.stella;
            document.getElementById(`punti-es-${currentId}`).value = e.punti || 1;
            updateEsercizio(currentId);
        }, 0);
    });

    // Rimuovi descrittori esistenti
    descrittori.forEach(d => {
        const item = document.getElementById(`descrittore-${d.id}`);
        if (item) item.remove();
    });
    descrittori = [];
    descrittoreCounter = 1;

    // Aggiungi nuovi descrittori
    data.descrittori.forEach(d => {
        addDescrittore();
        const currentId = descrittoreCounter - 1;
        setTimeout(() => {
            document.getElementById(`desc-${currentId}`).value = d.descrittore;
            document.getElementById(`punti-${currentId}`).value = d.punti;
            updateDescrittore(currentId);
        }, 0);
    });

    setTimeout(() => saveState(), 100);
}

function deleteCustomTemplate(id) {
    const template = customTemplates.find(t => t.id === id);
    if (!template) return;

    if (confirm(`Eliminare il template "${template.name}"?`)) {
        customTemplates = customTemplates.filter(t => t.id !== id);
        localStorage.setItem('customTemplates', JSON.stringify(customTemplates));
        updateCustomTemplatesMenu();
    }
}

function updateCustomTemplatesMenu() {
    const list = document.getElementById('customTemplatesList');
    if (customTemplates.length === 0) {
        list.innerHTML = '<div style="padding: 10px; text-align: center; color: #999;">Nessun template salvato</div>';
        return;
    }

    list.innerHTML = customTemplates.map(t => `
        <div class="dropdown-item-custom" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px;">
            <span onclick="loadCustomTemplate(${t.id})" style="flex: 1; cursor: pointer;">${t.name}</span>
            <button onclick="event.stopPropagation(); deleteCustomTemplate(${t.id})"
                    style="background: #dc3545; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">🗑️</button>
        </div>
    `).join('');
}

// === VERSION HISTORY ===
let versions = JSON.parse(localStorage.getItem('documentVersions') || '[]');
const MAX_VERSIONS = 20;

function saveVersion() {
    const version = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        data: {
            tempo: document.getElementById('tempo').value,
            docente: document.getElementById('docente').value,
            consegna: document.getElementById('consegna').value,
            esercizi: esercizi.map(e => ({
                id: e.id,
                testo: document.getElementById(`esercizio-text-${e.id}`)?.value || '',
                stella: document.getElementById(`stella-${e.id}`)?.checked || false
            })),
            descrittori: descrittori.map(d => ({
                id: d.id,
                descrittore: document.getElementById(`desc-${d.id}`)?.value || '',
                punti: document.getElementById(`punti-${d.id}`)?.value || ''
            }))
        }
    };

    versions.unshift(version);
    if (versions.length > MAX_VERSIONS) {
        versions = versions.slice(0, MAX_VERSIONS);
    }

    localStorage.setItem('documentVersions', JSON.stringify(versions));
}

function loadVersion(id) {
    const version = versions.find(v => v.id === id);
    if (!version) return;

    if (!confirm('Ripristinare questa versione? I dati correnti andranno persi.')) {
        return;
    }

    const data = version.data;
    document.getElementById('tempo').value = data.tempo;
    document.getElementById('docente').value = data.docente;
    document.getElementById('consegna').value = data.consegna;

    // Ripristina esercizi
    esercizi.forEach(e => {
        const item = document.getElementById(`esercizio-${e.id}`);
        if (item) item.remove();
    });
    esercizi = [];

    data.esercizi.forEach(e => {
        eserciziCounter = Math.max(eserciziCounter, e.id + 1);
        esercizi.push({ id: e.id, testo: e.testo, stella: e.stella });

        const container = document.getElementById('eserciziContainer');
        const item = document.createElement('div');
        item.className = 'esercizio-item';
        item.id = `esercizio-${e.id}`;
        item.innerHTML = `
            <h4>
                Esercizio #${e.id}
                <div>
                    <button class="btn btn-secondary btn-small" onclick="duplicateEsercizio(${e.id})" title="Duplica esercizio">📋 Duplica</button>
                    <button class="btn btn-danger btn-small" onclick="removeEsercizio(${e.id})">🗑️ Rimuovi</button>
                </div>
            </h4>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="stella-${e.id}" ${e.stella ? 'checked' : ''} onchange="updateEsercizio(${e.id}); scheduleAutosave();">
                    Esercizio con stella ($\\star$)
                </label>
            </div>
            <div class="form-group">
                <label>Testo:</label>
                <textarea id="esercizio-text-${e.id}" rows="2"
                    placeholder="Descrizione dell'esercizio..."
                    oninput="updateEsercizio(${e.id}); updateCharCounter(${e.id}); scheduleAutosave();">${escapeHtml(e.testo)}</textarea>
                <div class="char-counter" id="counter-esercizio-${e.id}"></div>
            </div>
        `;
        container.appendChild(item);
        updateCharCounter(e.id);
    });

    // Ripristina descrittori
    descrittori.forEach(d => {
        const item = document.getElementById(`descrittore-${d.id}`);
        if (item) item.remove();
    });
    descrittori = [];

    data.descrittori.forEach(d => {
        descrittoreCounter = Math.max(descrittoreCounter, d.id + 1);
        descrittori.push({ id: d.id, descrittore: d.descrittore, punti: d.punti });

        const container = document.getElementById('descrittoriContainer');
        const item = document.createElement('div');
        item.className = 'descrittore-item';
        item.id = `descrittore-${d.id}`;
        item.innerHTML = `
            <h4>
                Descrittore #${d.id}
                <div>
                    <button class="btn btn-secondary btn-small" onclick="duplicateDescrittore(${d.id})" title="Duplica descrittore">📋 Duplica</button>
                    <button class="btn btn-danger btn-small" onclick="removeDescrittore(${d.id})">🗑️ Rimuovi</button>
                </div>
            </h4>
            <div class="descrittore-fields">
                <div class="form-group">
                    <label>Descrizione:</label>
                    <input type="text" id="desc-${d.id}" value="${escapeHtml(d.descrittore)}" placeholder="es. Comprensione del testo"
                           oninput="updateDescrittore(${d.id}); scheduleAutosave();">
                </div>
                <div class="form-group">
                    <label>Punti:</label>
                    <input type="number" id="punti-${d.id}" value="${escapeHtml(d.punti)}" placeholder="10"
                           oninput="updateDescrittore(${d.id}); scheduleAutosave();">
                </div>
            </div>
        `;
        container.appendChild(item);
    });

    document.getElementById('versionsPanel').classList.remove('show');
    saveState();
}

function showVersionHistory() {
    const panel = document.getElementById('versionsPanel');
    const list = document.getElementById('versionsList');

    if (versions.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #999;">Nessuna versione salvata</p>';
    } else {
        list.innerHTML = versions.map(v => {
            const date = new Date(v.timestamp);
            const preview = v.data.consegna ? v.data.consegna.substring(0, 50) + '...' : 'Documento senza consegna';

            return `
                <div class="version-item">
                    <div class="version-time">${date.toLocaleString('it-IT')}</div>
                    <div class="version-preview">${escapeHtml(preview)}</div>
                    <div class="version-actions">
                        <button class="btn btn-small btn-primary" onclick="loadVersion(${v.id})">Ripristina</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    panel.classList.toggle('show');
}

// === REAL-TIME PREVIEW ===
let realtimeMode = false;
let realtimeTimeout = null;

function toggleRealtime() {
    realtimeMode = !realtimeMode;
    const btn = document.getElementById('realtimeBtn');

    if (realtimeMode) {
        btn.classList.add('realtime-active');
        btn.title = 'Anteprima Tempo Reale: ATTIVA';
        generateLatex(); // Genera immediatamente
    } else {
        btn.classList.remove('realtime-active');
        btn.title = 'Anteprima Tempo Reale: DISATTIVA';
    }
}

function scheduleRealtimeUpdate() {
    if (!realtimeMode) return;

    clearTimeout(realtimeTimeout);
    realtimeTimeout = setTimeout(() => {
        generateLatex();
    }, 1000);
}

// === FULLSCREEN & COMPACT MODE ===
function toggleFullscreen() {
    document.body.classList.toggle('fullscreen-mode');
    const btn = document.getElementById('fullscreenBtn');
    if (document.body.classList.contains('fullscreen-mode')) {
        btn.textContent = '⛶';
        btn.title = 'Esci da Fullscreen';
    } else {
        btn.textContent = '⛶';
        btn.title = 'Modalità Fullscreen';
    }
}

function toggleCompactMode() {
    document.body.classList.toggle('compact-mode');
    const btn = document.getElementById('compactBtn');
    if (document.body.classList.contains('compact-mode')) {
        btn.textContent = '◧';
        btn.title = 'Modalità Normale';
    } else {
        btn.textContent = '◧';
        btn.title = 'Modalità Compatta';
    }
}

// === CHARACTER COUNTER ===
function updateCharCounter(id) {
    const textarea = document.getElementById(`esercizio-text-${id}`);
    const counter = document.getElementById(`counter-esercizio-${id}`);

    if (!textarea || !counter) return;

    const text = textarea.value;
    const chars = text.length;
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;

    counter.textContent = `${chars} caratteri, ${words} parole`;

    // Warning/error colors
    counter.classList.remove('warning', 'error');
    if (chars > 500) counter.classList.add('error');
    else if (chars > 300) counter.classList.add('warning');
}

// === SMART SUGGESTIONS ===
const suggestionsBySubject = {
    matematica: [
        { text: 'Correttezza del procedimento', punti: '15' },
        { text: 'Correttezza del risultato', punti: '10' },
        { text: 'Chiarezza espositiva', punti: '5' },
        { text: 'Uso corretto della terminologia', punti: '5' }
    ],
    italiano: [
        { text: 'Comprensione del testo', punti: '12' },
        { text: 'Capacità di analisi', punti: '10' },
        { text: 'Proprietà di linguaggio', punti: '8' },
        { text: 'Coerenza argomentativa', punti: '5' }
    ],
    scienze: [
        { text: 'Conoscenza dei contenuti', punti: '14' },
        { text: 'Uso del linguaggio scientifico', punti: '8' },
        { text: 'Capacità di sintesi', punti: '8' },
        { text: 'Precisione terminologica', punti: '5' }
    ],
    generale: [
        { text: 'Completezza della risposta', punti: '10' },
        { text: 'Organizzazione del testo', punti: '8' },
        { text: 'Correttezza ortografica', punti: '5' }
    ]
};

function openSuggestionsPanel() {
    const panel = document.getElementById('suggestionsPanel');
    const list = document.getElementById('suggestionsList');

    const allSuggestions = Object.values(suggestionsBySubject).flat();
    const uniqueSuggestions = Array.from(new Set(allSuggestions.map(s => JSON.stringify(s))))
        .map(s => JSON.parse(s));

    list.innerHTML = uniqueSuggestions.map((s, i) => `
        <div class="suggestion-item">
            <span class="suggestion-text">${s.text} (${s.punti} punti)</span>
            <button class="suggestion-add" onclick="addSuggestionAsDescrittore('${s.text}', '${s.punti}')">Aggiungi</button>
        </div>
    `).join('');

    panel.classList.toggle('show');
}

function addSuggestionAsDescrittore(text, punti) {
    addDescrittore();
    const newId = descrittoreCounter - 1;

    setTimeout(() => {
        document.getElementById(`desc-${newId}`).value = text;
        document.getElementById(`punti-${newId}`).value = punti;
        updateDescrittore(newId);
        saveState();
    }, 0);
}

// Auto-save version every 5 minutes
setInterval(() => {
    saveVersion();
}, 5 * 60 * 1000);

// === UTILITIES ===
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
