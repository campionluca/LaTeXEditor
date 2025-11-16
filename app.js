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
\\lineanome

\\begin{document}


\\intestazionesemplice

\\begin{esercizi}
    \\item {{CONSEGNA}}
{{ESERCIZI}}
\\end{esercizi}
\\begin{table}[H]
    \\centering
\\begin{tabular}{|l|c|c|}
\\hline
\\textbf{Descrittore}                          & \\textbf{Punti ottenuti} \\\\ \\hline
{{DESCRITTORI_ROWS}}
\\end{tabular}
\\end{table}
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
    esercizi.push({ id, testo: '', stella: false });

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

    const index = esercizi.findIndex(e => e.id === id);
    if (index !== -1) {
        esercizi[index].testo = testo;
        esercizi[index].stella = stella;
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

    // Aggiorna i dati degli esercizi
    esercizi.forEach(e => {
        const testo = document.getElementById(`esercizio-text-${e.id}`)?.value || '';
        const stella = document.getElementById(`stella-${e.id}`)?.checked || false;
        e.testo = testo;
        e.stella = stella;
    });

    // Genera la sezione esercizi
    let eserciziText = '';
    esercizi.forEach(e => {
        if (e.testo) {
            const prefix = e.stella ? '($\\\\star$) ' : '';
            eserciziText += `    ${prefix}${e.testo}\\n`;
        }
    });

    // Aggiorna i dati dei descrittori
    descrittori.forEach(d => {
        const desc = document.getElementById(`desc-${d.id}`)?.value || '';
        const punti = document.getElementById(`punti-${d.id}`)?.value || '';
        d.descrittore = desc;
        d.punti = punti;
    });

    // Genera le righe dei descrittori
    let descrittoriRows = '';
    descrittori.forEach(d => {
        if (d.descrittore && d.punti) {
            descrittoriRows += `${d.descrittore}                                        & $\\_\\_\\_\\_$/${d.punti}            \\\\ \\hline\n`;
        }
    });

    if (descrittoriRows === '') {
        descrittoriRows = 'Inserisci descrittori                                        & $\\_\\_\\_\\_$/10            \\\\ \\hline\n';
    }

    // Sostituisci i placeholder nel template
    let latex = currentTemplate
        .replace('{{TEMPO}}', tempo)
        .replace('{{DOCENTE}}', docente)
        .replace('{{CONSEGNA}}', consegna)
        .replace('{{ESERCIZI}}', eserciziText)
        .replace('{{DESCRITTORI_ROWS}}', descrittoriRows);

    // Mostra il codice LaTeX generato
    const preview = document.getElementById('latexPreview');
    preview.innerHTML = `<code>${escapeHtml(latex)}</code>`;

    // Genera anche la preview visuale
    generateVisualPreview(tempo, docente, consegna);
}

function generateVisualPreview(tempo, docente, consegna) {
    const visualPreview = document.getElementById('visualPreview');

    let eserciziHTML = '';
    esercizi.forEach((e, index) => {
        if (e.testo) {
            const stellaSymbol = e.stella ? '(★) ' : '';
            eserciziHTML += `<div class="exercise-item">${index + 1}. ${stellaSymbol}${escapeHtml(e.testo)}</div>`;
        }
    });

    let descrittoriHTML = '';
    descrittori.forEach(d => {
        if (d.descrittore && d.punti) {
            descrittoriHTML += `
                <tr>
                    <td>${escapeHtml(d.descrittore)}</td>
                    <td>____/${d.punti}</td>
                </tr>
            `;
        }
    });

    visualPreview.innerHTML = `
        <h1>Verifica</h1>
        <div class="doc-meta">
            <div>Tempo: ${escapeHtml(tempo)}</div>
            <div>Docente: ${escapeHtml(docente)}</div>
            <div>Nome: _________________________</div>
        </div>

        <div class="section">
            <h3>Esercizi</h3>
            <div class="exercise-item">${escapeHtml(consegna)}</div>
            ${eserciziHTML}
        </div>

        <div class="section">
            <h3>Griglia di Valutazione</h3>
            <table>
                <thead>
                    <tr>
                        <th>Descrittore</th>
                        <th>Punti ottenuti</th>
                    </tr>
                </thead>
                <tbody>
                    ${descrittoriHTML}
                </tbody>
            </table>
        </div>
    `;
}

// === DOWNLOAD & COPY ===
function downloadLatex() {
    const latexCode = document.getElementById('latexPreview').textContent;

    if (latexCode === 'Il codice LaTeX apparirà qui dopo aver cliccato "Genera LaTeX"...') {
        alert('Genera prima il codice LaTeX cliccando su "Genera LaTeX"!');
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
        alert('Genera prima il codice LaTeX cliccando su "Genera LaTeX"!');
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

// === TEMPLATE MANAGEMENT ===
function loadTemplate() {
    fetch('templateGestionaleLab.tex')
        .then(response => response.text())
        .then(data => {
            currentTemplate = data;
            parseTemplate(data);
            alert('Template caricato con successo!');
        })
        .catch(error => {
            alert('Impossibile caricare il template. Assicurati che il file templateGestionaleLab.tex sia presente.');
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

            alert('Progetto importato con successo!');
            saveState();
        } catch (error) {
            alert('Errore nell\'importazione del file JSON: ' + error.message);
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

// === DUPLICATE FUNCTIONS ===
function duplicateEsercizio(id) {
    const sourceText = document.getElementById(`esercizio-text-${id}`)?.value || '';
    const sourceStella = document.getElementById(`stella-${id}`)?.checked || false;

    addEsercizio();
    const newId = eserciziCounter - 1;

    setTimeout(() => {
        document.getElementById(`esercizio-text-${newId}`).value = sourceText;
        document.getElementById(`stella-${newId}`).checked = sourceStella;
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
    alert(`Template "${name}" salvato con successo!`);
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
