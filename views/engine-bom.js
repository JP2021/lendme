let isRecording = false;
let recognition;
let shouldCapitalize = true;

const quill = new Quill('#editor', {
    theme: 'snow',
    modules: {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],  // Formatação de texto
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],  // Listas
            [{ 'align': '' }, { 'align': 'center' }, { 'align': 'right' }, { 'align': 'justify' }],  // Alinhamento
            ['link', 'image'],  // Links e Imagens
            [{ 'color': [] }, { 'background': [] }],  // Cor do texto e fundo
            ['blockquote', 'code-block'],  // Citação e Bloco de Código
            [{ 'font': [] }, { 'size': [] }],  // Fontes e Tamanho
            ['clean'], // Limpar formatação
        ]
    },
    placeholder: 'Comece a digitar ou use o reconhecimento de voz....'
});

const modalQuill = new Quill('#modal-editor', {
    theme: 'snow',
    modules: {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],  // Formatação de texto
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],  // Listas
            [{ 'align': '' }, { 'align': 'center' }, { 'align': 'right' }, { 'align': 'justify' }],  // Alinhamento
            ['link', 'image'],  // Links e Imagens
            [{ 'color': [] }, { 'background': [] }],  // Cor do texto e fundo
            ['blockquote', 'code-block'],  // Citação e Bloco de Código
            [{ 'font': [] }, { 'size': [] }],  // Fontes e Tamanho
            ['clean'], // Limpar formatação
        ]
    },
    placeholder: 'Digite o conteúdo do auto texto....'
});

// Funções de gerenciamento de documentos
function getDocumentsFromLocalStorage() {
    const documentsJSON = localStorage.getItem('documents');
    return documentsJSON ? JSON.parse(documentsJSON) : {};
}

function saveDocumentToLocalStorage(name, content) {
    console.log('Salvando documento:', name);
    const documents = getDocumentsFromLocalStorage();
    documents[name] = content;
    localStorage.setItem('documents', JSON.stringify(documents));
    updateDocumentList();
}

function deleteDocumentFromLocalStorage(name) {
    console.log('Excluindo documento:', name);
    const documents = getDocumentsFromLocalStorage();
    delete documents[name];
    localStorage.setItem('documents', JSON.stringify(documents));
    updateDocumentList();
}

function updateDocumentList() {
    console.log('Atualizando lista de documentos');
    const documents = getDocumentsFromLocalStorage();
    const documentList = document.getElementById('documents-ul');
    documentList.innerHTML = '';
    for (const docName in documents) {
        const li = document.createElement('li');
        li.classList.add('list-group-item');
        li.textContent = docName;
        li.addEventListener('click', () => openDocumentForEditing(docName));
        documentList.appendChild(li);
    }
}

function openDocumentForEditing(docName) {
    console.log('Abrindo para edição:', docName);
    const documents = getDocumentsFromLocalStorage();
    document.getElementById('documentName').value = docName;
    modalQuill.root.innerHTML = documents[docName];
    document.getElementById('deleteDocumentBtn').style.display = 'inline-block';
    const modal = new bootstrap.Modal(document.getElementById('autoTextoModal'));
    modal.show();
}

function openModalForNewDocument() {
    console.log('Abrindo modal para novo documento');
    document.getElementById('documentName').value = '';
    modalQuill.root.innerHTML = '';
    document.getElementById('deleteDocumentBtn').style.display = 'none';
    const modal = new bootstrap.Modal(document.getElementById('autoTextoModal'));
    modal.show();
}

// Função para carregar auto texto no editor principal
function loadDocument(docName) {
    console.log('Carregando documento:', docName);
    const documents = getDocumentsFromLocalStorage();
    if (documents[docName]) {
        const range = quill.getSelection();
        const index = range ? range.index : quill.getLength();
        quill.clipboard.dangerouslyPasteHTML(index, documents[docName]);
        quill.setSelection(index + documents[docName].length);
    } else {
        console.log(`Documento "${docName}" não encontrado`);
    }
}

// Eventos
document.getElementById('mascaras-link').addEventListener('click', (e) => {
    e.preventDefault();
    openModalForNewDocument();
});

document.getElementById('saveDocumentBtn').addEventListener('click', () => {
    const docName = document.getElementById('documentName').value.trim();
    const content = modalQuill.root.innerHTML;
    if (docName && content) {
        saveDocumentToLocalStorage(docName, content);
        bootstrap.Modal.getInstance(document.getElementById('autoTextoModal')).hide();
    } else {
        alert('Preencha nome e conteúdo.');
    }
});

document.getElementById('deleteDocumentBtn').addEventListener('click', () => {
    const docName = document.getElementById('documentName').value.trim();
    if (confirm(`Excluir "${docName}"?`)) {
        deleteDocumentFromLocalStorage(docName);
        bootstrap.Modal.getInstance(document.getElementById('autoTextoModal')).hide();
    }
});

document.getElementById('toggle-documents-btn').addEventListener('click', () => {
    const docList = document.getElementById('documents-ul');
    const title = document.getElementById('document-list-title');
    if (docList.style.display === 'none') {
        docList.style.display = 'block';
        document.getElementById('toggle-documents-btn').textContent = 'Ocultar';
        title.textContent = 'Auto Texto';
        title.classList.add('visivel');
        title.classList.remove('oculto');
    } else {
        docList.style.display = 'none';
        document.getElementById('toggle-documents-btn').textContent = 'Mostrar';
        title.textContent = 'Auto Texto (Ocultos)';
        title.classList.add('oculto');
        title.classList.remove('visivel');
    }
});

document.getElementById('record-btn').addEventListener('click', toggleRecording);

document.getElementById('change-color').addEventListener('click', () => document.getElementById('color-picker').click());
document.getElementById('color-picker').addEventListener('input', (e) => quill.root.style.backgroundColor = e.target.value);

document.getElementById('simulate-auto-texto').addEventListener('click', () => {
    const exemplo = '<h3 data-start="109" data-end="166" style="color: rgb(33, 37, 41);"><span data-start="113" data-end="164" style="font-weight: bolder;">LAUDO DE RESSONÂNCIA MAGNÉTICA DA COLUNA LOMBAR</span></h3><p data-start="168" data-end="372"><span data-start="168" data-end="181" style="font-weight: bolder;">Paciente:</span>&nbsp;João da Silva<br data-start="195" data-end="198"><span data-start="198" data-end="216" style="font-weight: bolder;">Data do exame:</span>&nbsp;14/02/2025<br data-start="227" data-end="230"><span data-start="230" data-end="242" style="font-weight: bolder;">Técnica:</span>&nbsp;Ressonância Magnética da coluna lombar realizada em sequências ponderadas em T1, T2 e STIR nos planos sagital, axial e coronal.</p><h4 data-start="374" data-end="393" style="color: rgb(33, 37, 41);"><span data-start="379" data-end="391" style="font-weight: bolder;">Achados:</span></h4><ul data-start="394" data-end="1043"><li data-start="394" data-end="458">Alinhamento vertebral preservado, sem evidência de listeses.</li><li data-start="459" data-end="553">Altura e sinal dos corpos vertebrais preservados, sem sinais de fraturas ou lesões ósseas.</li><li data-start="554" data-end="656">Discos intervertebrais de morfologia e sinal normais, sem sinais de protrusões ou hérnias discais.</li><li data-start="657" data-end="731">Canal vertebral de amplitude normal, sem sinais de compressão medular.</li><li data-start="732" data-end="816">Conus medullaris localizado em posição habitual, com morfologia e sinal normais.</li><li data-start="817" data-end="887">Espaços intervertebrais sem sinais de estreitamento significativo.</li><li data-start="888" data-end="965">Articulações facetárias preservadas, sem sinais de artrose significativa.</li><li data-start="966" data-end="1043">Ausência de coleções líquidas ou alterações inflamatórias paravertebrais.</li></ul><h4 data-start="1045" data-end="1066" style="color: rgb(33, 37, 41);"><span data-start="1050" data-end="1064" style="font-weight: bolder;">Conclusão:</span></h4><p data-start="1067" data-end="1148">Exame sem evidências de alterações estruturais significativas na coluna lombar.</p>';
    saveDocumentToLocalStorage('lombar', exemplo);
    loadDocument('lombar');
});

document.addEventListener('DOMContentLoaded', updateDocumentList);

// Reconhecimento de voz
function toggleRecording() {
    if (!isRecording) {
        iniciarGravacao();
        isRecording = true;
        document.getElementById('record-btn').innerHTML = '<img src="./assets/img/pausar.png" alt="Pausar" width="30">';
    } else {
        pararGravacao();
        isRecording = false;
        document.getElementById('record-btn').innerHTML = '<img src="./assets/img/icone.png" alt="Gravar" width="30">';
    }
}

function iniciarGravacao() {
    if (!('webkitSpeechRecognition' in window)) {
        alert('Seu navegador não suporta reconhecimento de voz.');
        return;
    }
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';

    recognition.onresult = function(event) {
        let transcript = '';
        let newLine = false;
        let newParagraph = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                let currentTranscript = event.results[i][0].transcript.trim().toLowerCase();

                if (currentTranscript.includes("ponto")) {
                    console.log('Ponto detectado');
                    setTimeout(aplicarCorrecaoNoEditor, 500);
                }
                if (currentTranscript.includes("vírgula")) {
                    console.log('Vírgula detectada');
                    setTimeout(aplicarCorrecaoNoEditor, 500);
                }
                
                if (currentTranscript.includes("=?")) {
                    console.log('Ponto detectado');
                    setTimeout(aplicarCorrecaoNoEditor, 500);
                }

                currentTranscript = currentTranscript.replace(/\.$/, ' ');

                if (currentTranscript.includes("nova linha")) {
                    newLine = true;
                    currentTranscript = currentTranscript.replace(/nova linha/gi, '');
                    
                    // Capitalizar a primeira letra da transcrição
                    currentTranscript = currentTranscript.charAt(0).toUpperCase() + currentTranscript.slice(1);
                }

                if (currentTranscript.includes("ponto parágrafo")) {
                    newParagraph = true;
                    shouldCapitalize = true;
                    currentTranscript = currentTranscript.replace(/ponto parágrafo/gi, '');
                }

                const match = currentTranscript.match(/^auto\s*texto\s*([\w\s]+)/i);
                if (match) {
                    const docName = normalizeText(match[1]);
                    loadDocument(docName);
                } else {
                    currentTranscript = replaceWords(applySubstitutions(currentTranscript));

                    if (shouldCapitalize && currentTranscript.length > 0) {
                        currentTranscript = currentTranscript.charAt(0).toUpperCase() + currentTranscript.slice(1);
                        shouldCapitalize = false;
                    }
                    transcript += currentTranscript + ' ';
                }
            }
        }

        if (transcript.trim() || newLine || newParagraph) {
            let range = quill.getSelection();
            let index = range ? range.index : quill.getLength();
            if (transcript.trim()) {
                quill.insertText(index, transcript, 'user');
                index += transcript.length;
            }
            if (newLine) {
                quill.insertText(index++, '\n', 'user');
                shouldCapitalize = true; // Ativar capitalização para a próxima palavra
            }
            if (newParagraph) {
                quill.insertText(index, '\n\n', 'user');
                index += 2;
                shouldCapitalize = true; // Ativar capitalização para a próxima palavra
            }
            quill.setSelection(index);
        }
    };

    recognition.onend = () => shouldCapitalize = true;
    recognition.start();
}

function pararGravacao() {
    if (recognition) recognition.stop();
}



function replaceWords(text) {
    return applySubstitutions(text);
}

function corrigirEspacosAntesDePontos(texto) {
    return texto.replace(/(\w+)\s+([.,])/g, "$1$2");
}

function removerInterrogacaoIgual(texto) {
    // Remover "? " após o sinal de igual
    return texto.replace(/=\s*\?/g, "=");
}

function aplicarCorrecaoNoEditor() {
    const range = quill.getSelection();
    const cursorPosition = range ? range.index : quill.getLength();
    let textoAtual = quill.getText();
    
    // Aplica ambas as correções
    textoAtual = corrigirEspacosAntesDePontos(textoAtual);
    textoAtual = removerInterrogacaoIgual(textoAtual);
    
    quill.setText(textoAtual);
    quill.setSelection(cursorPosition);
}