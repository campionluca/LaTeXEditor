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
    ($\\star$) {{ES10}}
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

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    addDescrittore(); // Aggiungi un descrittore di default
    addDescrittore(); // Aggiungi un secondo descrittore di default
});

function initializeApp() {
    // Carica valori di default
    document.getElementById('tempo').value = '100 minuti';
    document.getElementById('docente').value = 'Proff. Luca Campion, Riccardo Rossi';
}

function setupEventListeners() {
    document.getElementById('addDescrittoreBtn').addEventListener('click', addDescrittore);
    document.getElementById('generateBtn').addEventListener('click', generateLatex);
    document.getElementById('downloadBtn').addEventListener('click', downloadLatex);
    document.getElementById('copyCodeBtn').addEventListener('click', copyCode);
    document.getElementById('loadTemplateBtn').addEventListener('click', loadTemplate);
    document.getElementById('newTemplateBtn').addEventListener('click', newTemplate);
}

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
                       oninput="updateDescrittore(${id})">
            </div>
            <div class="form-group">
                <label>Punti:</label>
                <input type="number" id="punti-${id}" placeholder="10"
                       oninput="updateDescrittore(${id})">
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
    }
}

function updateDescrittore(id) {
    const desc = document.getElementById(`desc-${id}`).value;
    const punti = document.getElementById(`punti-${id}`).value;

    const index = descrittori.findIndex(d => d.id === id);
    if (index !== -1) {
        descrittori[index].descrittore = desc;
        descrittori[index].punti = punti;
    }
}

function generateLatex() {
    const tempo = document.getElementById('tempo').value || '100 minuti';
    const docente = document.getElementById('docente').value || 'Proff. Luca Campion, Riccardo Rossi';
    const consegna = document.getElementById('consegna').value || 'Inserisci la consegna';
    const es10 = document.getElementById('es10').value || 'Inserisci l\'esercizio';

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

    // Se non ci sono descrittori, aggiungi una riga di esempio
    if (descrittoriRows === '') {
        descrittoriRows = 'Inserisci descrittori                                        & $\\_\\_\\_\\_$/10            \\\\ \\hline\n';
    }

    // Sostituisci i placeholder nel template
    let latex = currentTemplate
        .replace('{{TEMPO}}', tempo)
        .replace('{{DOCENTE}}', docente)
        .replace('{{CONSEGNA}}', consegna)
        .replace('{{ES10}}', es10)
        .replace('{{DESCRITTORI_ROWS}}', descrittoriRows);

    // Mostra il codice LaTeX generato
    const preview = document.getElementById('latexPreview');
    preview.innerHTML = `<code>${escapeHtml(latex)}</code>`;
}

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

function loadTemplate() {
    // Carica il template esistente
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
    // Cerca il valore del tempo
    const tempoMatch = template.match(/\\tempo\{([^}]+)\}/);
    if (tempoMatch) {
        document.getElementById('tempo').value = tempoMatch[1];
    }

    // Cerca il valore del docente
    const docenteMatch = template.match(/\\docente\{([^}]+)\}/);
    if (docenteMatch) {
        document.getElementById('docente').value = docenteMatch[1];
    }

    // Cerca i placeholder {{...}}
    const consegnaMatch = template.match(/\\item\s+\{\{([^}]+)\}\}/);
    const es10Match = template.match(/\(\$\\star\$\)\s+\{\{([^}]+)\}\}/);

    if (consegnaMatch) {
        document.getElementById('consegna').placeholder = consegnaMatch[1];
    }
    if (es10Match) {
        document.getElementById('es10').placeholder = es10Match[1];
    }
}

function newTemplate() {
    if (confirm('Creare un nuovo template? Tutti i dati non salvati andranno persi.')) {
        // Reset dei campi
        document.getElementById('tempo').value = '';
        document.getElementById('docente').value = '';
        document.getElementById('consegna').value = '';
        document.getElementById('es10').value = '';

        // Rimuovi tutti i descrittori
        descrittori.forEach(d => {
            const item = document.getElementById(`descrittore-${d.id}`);
            if (item) item.remove();
        });
        descrittori = [];
        descrittoreCounter = 1;

        // Aggiungi un descrittore vuoto
        addDescrittore();

        // Reset preview
        document.getElementById('latexPreview').innerHTML = '<code>Il codice LaTeX apparirà qui dopo aver cliccato "Genera LaTeX"...</code>';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
