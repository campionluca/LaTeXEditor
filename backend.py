#!/usr/bin/env python3
"""
Backend Flask per compilazione LaTeX
Compila file .tex in PDF usando pdflatex locale
"""

from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from io import BytesIO
import subprocess
import tempfile
import os
import shutil

app = Flask(__name__)
CORS(app)  # Abilita CORS per tutte le route

@app.route('/compile', methods=['POST'])
def compile_latex():
    """Compila codice LaTeX e restituisce PDF"""

    try:
        # Ottieni il codice LaTeX dal body
        data = request.get_json()
        latex_code = data.get('latex', '')

        if not latex_code:
            return jsonify({'error': 'Nessun codice LaTeX fornito'}), 400

        # Crea directory temporanea
        with tempfile.TemporaryDirectory() as tmpdir:
            tex_path = os.path.join(tmpdir, 'document.tex')
            pdf_path = os.path.join(tmpdir, 'document.pdf')

            # Copia verifica.cls locale nella directory temporanea (se esiste)
            verifica_cls_path = os.path.join(os.path.dirname(__file__), 'verifica.cls')
            if os.path.exists(verifica_cls_path):
                shutil.copy(verifica_cls_path, tmpdir)

            # Scrivi il file .tex
            with open(tex_path, 'w', encoding='utf-8') as f:
                f.write(latex_code)

            # Compila con pdflatex (2 passaggi per referenze)
            for _ in range(2):
                result = subprocess.run(
                    ['pdflatex', '-interaction=nonstopmode', '-halt-on-error', 'document.tex'],
                    cwd=tmpdir,
                    capture_output=True,
                    timeout=30
                )

            # Controlla se il PDF è stato generato
            if not os.path.exists(pdf_path):
                # Leggi il log per gli errori
                log_path = os.path.join(tmpdir, 'document.log')
                error_msg = 'Compilazione fallita'

                if os.path.exists(log_path):
                    with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
                        log_content = f.read()
                        # Estrai le righe con errori
                        errors = [line for line in log_content.split('\n') if '!' in line]
                        if errors:
                            error_msg = '\n'.join(errors[:5])  # Prime 5 righe di errore

                return jsonify({'error': error_msg}), 500

            # Leggi il PDF in memoria prima che tmpdir venga cancellato
            with open(pdf_path, 'rb') as pdf_file:
                pdf_data = pdf_file.read()

        # Restituisci il PDF dalla memoria (fuori dal context manager)
        return send_file(
            BytesIO(pdf_data),
            mimetype='application/pdf',
            as_attachment=False,
            download_name='verifica.pdf'
        )

    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Timeout durante la compilazione'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Endpoint di health check"""
    try:
        # Verifica che pdflatex sia disponibile
        result = subprocess.run(['pdflatex', '--version'], capture_output=True)
        if result.returncode == 0:
            return jsonify({'status': 'ok', 'pdflatex': 'available'})
        else:
            return jsonify({'status': 'error', 'pdflatex': 'not found'}), 500
    except FileNotFoundError:
        return jsonify({'status': 'error', 'pdflatex': 'not installed'}), 500

if __name__ == '__main__':
    print("🚀 Server LaTeX backend in esecuzione su http://localhost:5000")
    print("📝 Endpoint: POST /compile")
    print("💚 Health check: GET /health")
    app.run(host='0.0.0.0', port=5000, debug=True)
