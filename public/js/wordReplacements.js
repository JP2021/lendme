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

// Exportação correta da função para uso em outro script
window.applySubstitutions = applySubstitutions;