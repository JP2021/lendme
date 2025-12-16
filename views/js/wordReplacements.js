


function normalizeText(text) {
    return text.trim().toLowerCase();
}

const replacements = [
   
    { pattern: "2.s", replacement: ":" },
    { pattern: "t. um", replacement: "T1" },
    { pattern: "ter. um", replacement: "T1" },
    { pattern: "vírgula", replacement: "," },
    { pattern: "fechadura", replacement: "?" },
    { pattern: "ponto", replacement: "." },
    { pattern: "reticências", replacement: "..." },
    { pattern: "três pontos", replacement: "..." },
    { pattern: "3 pontinhos", replacement: "..." },
    { pattern: "dois pontos", replacement: ":" },
    { pattern: "interrogação", replacement: "?" },
    { pattern: "ponto e vírgula", replacement: ";" },
    { pattern: "exclamação", replacement: "!" },
    { pattern: "ponto de interrogação", replacement: "?" },
    { pattern: "abrir parêntesis", replacement: "(" },
    { pattern: "abre parêntesis", replacement: "(" },
    { pattern: "parêntese", replacement: "(" },
    { pattern: "abre parêntese", replacement: "(" },
    { pattern: "fechar parêntesis", replacement: ")" },
    { pattern: "fecha parêntesis", replacement: ")" },
    { pattern: "fechar parêntese", replacement: ")" },
    { pattern: "fecha parêntese", replacement: ")" },
    { pattern: "abrir aspas simples", replacement: "'" },
    { pattern: "abre aspas simples", replacement: "'" },
    { pattern: "fechar aspas simples", replacement: "'" },
    { pattern: "fecha aspas simples", replacement: "'" },
    { pattern: "abrir aspas", replacement: "\"" },
    { pattern: "abre aspas", replacement: "\"" },
    { pattern: "fechar aspas", replacement: "\"" },
    { pattern: "fecha aspas", replacement: "\"" },
    { pattern: "asterisco", replacement: "*" },
    { pattern: "travessão", replacement: "-" },
    { pattern: "sinal de igual", replacement: "=" },
    { pattern: "barra", replacement: "/" },
    { pattern: "slash", replacement: "/" },
    { pattern: "sinal de dividir", replacement: "/" },
    { pattern: "barra invertida", replacement: "\\" },
    { pattern: "backslash", replacement: "\\" }
];

function applySubstitutions(text) {
    let newText = text;
    replacements.forEach(({ pattern, replacement }) => {
        newText = newText.replace(new RegExp(pattern, 'gi'), replacement);
    });
    return newText;
}




const wordReplacements = [
    

    { pattern: "backslash", replacement: "\\" }
];

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceWords(text) {
    let newText = text;
    wordReplacements.forEach(({ pattern, replacement }) => {
        const regex = new RegExp(`\\b${escapeRegExp(pattern)}\\b`, 'gi');

        newText = newText.replace(regex, replacement);
    });
    return newText;
}

// Testes no console
const testCases = [
    "ponto final",
    "nova linha ponto de interrogação",
    "dois pontos travessão",
    "barra invertida backslash"
];

testCases.forEach(test => {
    console.log(`Entrada: ${test}`);
    console.log(`Saída: ${replaceWords(test)}`);
    console.log("------------------");
});

// Função que pesquisa e substitui "=?" por "=" automaticamente
function corrigirAutomaticamente() {
    const range = quill.getSelection();
    const cursorPosition = range ? range.index : quill.getLength();
    let textoAtual = quill.getText();

    // Substitui "=?" por "="
    let novoTexto = textoAtual.replace(/=\?/g, "=");
    

    if (novoTexto !== textoAtual) {
        quill.setText(novoTexto);
        quill.setSelection(cursorPosition);
    }
}

function inserirAutomaticamente() {
    const range = quill.getSelection();
    const cursorPosition = range ? range.index : quill.getLength();
    let textoAtual = quill.getText();

    // Lista de substituições
    const substituicoes = [
        { 
            // Substitui "espaço" por " " (espaço) apenas se não estiver entre certas palavras
            pattern: /(?<!\s+(vago|entre|livre|conceito|local))\s+[Ee]spaço(?!\s+(vago|entre|livre|conceito|local))/g, 
            replacement: " "
        }, // Substitui "Espaço" ou "espaço" por um espaço, se não for seguido ou precedido por palavras específicas
        { pattern: /2\.s/g, replacement: ":" }, // Substitui "2.s" por ":"
        { pattern: /(\w),\s*:/g, replacement: "$1:" }, // Remove a vírgula antes de ":"
        { pattern: /\bcentímetros cúbicos\b/gi, replacement: "cm³"},
        { pattern: /(\d+)\s+por\s+(\d+)/g, replacement: "$1 x $2" } // Substitui "por" entre dois números por "x"
    ];

    // Aplica todas as substituições
    let novoTexto = textoAtual;
    substituicoes.forEach(({ pattern, replacement }) => {
        novoTexto = novoTexto.replace(pattern, replacement);
    });

    if (novoTexto !== textoAtual) {
        quill.setText(novoTexto);
        quill.setSelection(cursorPosition);
    }
}

let intervaloCorrigir = setInterval(corrigirAutomaticamente, 500);
let intervaloInserir = setInterval(inserirAutomaticamente, 500);

function toggleCorrigir() {
    const botao = document.getElementById("btnCorrigir");

    if (!intervaloCorrigir) {
        intervaloCorrigir = setInterval(corrigirAutomaticamente, 500);
        botao.innerHTML = '<img src="./assets/img/d-on.png" alt="Pausar" width="30">';
    } else {
        clearInterval(intervaloCorrigir);
        intervaloCorrigir = null;
        botao.innerHTML = '<img src="./assets/img/d-off.png" alt="Iniciar" width="30">';
    }
}

function toggleInserir() {
    const botao = document.getElementById("btnInserir");

    if (!intervaloInserir) {
        intervaloInserir = setInterval(inserirAutomaticamente, 500);
        botao.innerHTML = '<img src="./assets/img/cdr-tex-ont.png" alt="Pausar" width="30">';
    } else {
        clearInterval(intervaloInserir);
        intervaloInserir = null;
        botao.innerHTML = '<img src="./assets/img/cdr-text-off.png" alt="Iniciar" width="30">';
    }
}

// Definir ícones iniciais como "Pausar" porque já começam ativos
window.onload = function() {
    document.getElementById("btnCorrigir").innerHTML = '<img src="./assets/img/d-on.png" class="botao-sem-borda" alt="Pausar" width="30">';

    document.getElementById("btnInserir").innerHTML = '<img src="./assets/img/cdr-tex-ont.png" alt="Pausar" width="30">';
};

// Exemplo de botões no HTML:
// <button id="btnCorrigir" onclick="toggleCorrigir()"></button>
// <button id="btnInserir" onclick="toggleInserir()"></button>



// Configura um intervalo para rodar a cada 500ms (0.5s)
//setInterval(corrigirAutomaticamente, 500);

//setInterval(inserirAutomaticamente, 500);



// Exportação correta da função para uso em outro script
window.replaceWords = replaceWords;

  