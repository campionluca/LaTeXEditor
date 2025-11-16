% verifica.cls - Classe per verifiche scolastiche
% Versione locale per LaTeX Editor
\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{verifica}[2025/11/16 Classe per verifiche scolastiche]

% Basata su article
\LoadClass[a4paper,12pt]{article}

% Pacchetti richiesti
\RequirePackage[utf8]{inputenc}
\RequirePackage[italian]{babel}
\RequirePackage[T1]{fontenc}
\RequirePackage{lmodern}
\RequirePackage{geometry}
\RequirePackage{enumitem}
\RequirePackage{amsmath}
\RequirePackage{amssymb}
\RequirePackage{graphicx}
\RequirePackage{float}
\RequirePackage{fancyhdr}
\RequirePackage{tabularx}

% Geometria della pagina
\geometry{a4paper, margin=2cm}

% Variabili per tempo e docente
\def\tempovalore{100 minuti}
\def\docentevalore{}

% Comando \tempo
\newcommand{\tempo}[1]{\def\tempovalore{#1}}

% Comando \docente
\newcommand{\docente}[1]{\def\docentevalore{#1}}

% Comando \lineanome
\newcommand{\lineanome}{%
    \vspace{0.5cm}
    \noindent\textbf{Nome:} \underline{\hspace{5cm}} \textbf{Cognome:} \underline{\hspace{5cm}}\\[0.3cm]
    \noindent\textbf{Classe:} \underline{\hspace{3cm}} \textbf{Data:} \underline{\hspace{3cm}}
    \vspace{0.5cm}
}

% Comando \intestazionesemplice
\newcommand{\intestazionesemplice}{%
    \begin{center}
        {\Large\bfseries VERIFICA}\\[0.5cm]
        \textbf{Tempo a disposizione:} \tempovalore\\
        \textbf{Docente:} \docentevalore
    \end{center}
    \lineanome
}

% Ambiente esercizi
\newenvironment{esercizi}{%
    \begin{enumerate}[label=\arabic*.,leftmargin=*,itemsep=0.8cm]
}{%
    \end{enumerate}
}

% Comando \totpunti
\newcommand{\totpunti}[1]{%
    \vspace{1cm}
    \noindent\textbf{VOTO:} \underline{\hspace{2cm}} / 10 \quad (Formula: #1)
}

% Stile pagina
\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\small Verifica}
\fancyhead[R]{\small \today}
% Nessun numero di pagina nel footer

\endinput
