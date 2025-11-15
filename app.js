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

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchTab(tabName);
        });
    });

    // Autosave su input changes
    document.getElementById('tempo').addEventListener('input', scheduleAutosave);
    document.getElementById('docente').addEventListener('input', scheduleAutosave);
    document.getElementById('consegna').addEventListener('input', scheduleAutosave);

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
            <button class="btn btn-danger btn-small" onclick="removeEsercizio(${id})">🗑️ Rimuovi</button>
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
                oninput="updateEsercizio(${id}); scheduleAutosave();"></textarea>
        </div>
    `;

    container.appendChild(item);
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
            <button class="btn btn-danger btn-small" onclick="removeDescrittore(${id})">🗑️ Rimuovi</button>
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

// === UTILITIES ===
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
