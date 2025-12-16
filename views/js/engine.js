let isRecording = false;
let recognition;
let shouldCapitalize = true;
let quill;
let modalQuill;

// Função para inicializar o Quill quando o DOM estiver pronto
function initializeQuill() {
    // Inicializar editor principal
    if (!quill && document.getElementById('editor')) {
        quill = new Quill('#editor', {
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
        
        // Atualiza a lista de campos sempre que o texto for alterado
        quill.on('text-change', function() {
            encontrarCampos();
        });
    }

    // Inicializar editor do modal
    if (!modalQuill && document.getElementById('modal-editor')) {
        modalQuill = new Quill('#modal-editor', {
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
    }
}

// Tentar inicializar imediatamente se o DOM já estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeQuill);
} else {
    initializeQuill();
    // Se ainda não inicializou, tentar novamente após um pequeno delay
    if (!quill) {
        setTimeout(initializeQuill, 100);
    }
}

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
    if (documentList) {
        documentList.innerHTML = '';
        for (const docName in documents) {
            const li = document.createElement('li');
            li.classList.add('list-group-item');
            li.textContent = docName;
            li.addEventListener('click', () => openDocumentForEditing(docName));
            documentList.appendChild(li);
        }
    }
}

function openDocumentForEditing(docName) {
    console.log('Abrindo para edição:', docName);
    const documents = getDocumentsFromLocalStorage();
    const docNameInput = document.getElementById('documentName');
    const deleteBtn = document.getElementById('deleteDocumentBtn');
    const modalElement = document.getElementById('autoTextoModal');
    
    if (docNameInput) docNameInput.value = docName;
    if (modalQuill && documents[docName]) {
        modalQuill.root.innerHTML = documents[docName];
    }
    if (deleteBtn) deleteBtn.style.display = 'inline-block';
    if (modalElement && typeof bootstrap !== 'undefined') {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
}

function openModalForNewDocument() {
    console.log('Abrindo modal para novo documento');
    const docNameInput = document.getElementById('documentName');
    const deleteBtn = document.getElementById('deleteDocumentBtn');
    const modalElement = document.getElementById('autoTextoModal');
    
    if (docNameInput) docNameInput.value = '';
    if (modalQuill) modalQuill.root.innerHTML = '';
    if (deleteBtn) deleteBtn.style.display = 'none';
    if (modalElement && typeof bootstrap !== 'undefined') {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
}

// Função para carregar auto texto no editor principal
function loadDocument(docName) {
    console.log('Carregando documento:', docName);
    const documents = getDocumentsFromLocalStorage();
    if (documents[docName] && quill) {
        const range = quill.getSelection();
        const index = range ? range.index : quill.getLength();
        quill.clipboard.dangerouslyPasteHTML(index, documents[docName]);
        quill.setSelection(index + documents[docName].length);
    } else if (!quill) {
        console.log('Quill ainda não foi inicializado');
    } else {
        console.log(`Documento "${docName}" não encontrado`);
    }
}

// Configurar eventos quando o DOM estiver pronto
function setupEventListeners() {
    // Eventos de documentos
    const mascarasLink = document.getElementById('mascaras-link');
    if (mascarasLink) {
        mascarasLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModalForNewDocument();
        });
    }

    const saveBtn = document.getElementById('saveDocumentBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const docNameInput = document.getElementById('documentName');
            const modalElement = document.getElementById('autoTextoModal');
            if (docNameInput && modalQuill) {
                const docName = docNameInput.value.trim();
                const content = modalQuill.root.innerHTML;
                if (docName && content) {
                    saveDocumentToLocalStorage(docName, content);
                    if (modalElement && typeof bootstrap !== 'undefined') {
                        const modal = bootstrap.Modal.getInstance(modalElement);
                        if (modal) modal.hide();
                    }
                } else {
                    alert('Preencha nome e conteúdo.');
                }
            }
        });
    }

    const deleteBtn = document.getElementById('deleteDocumentBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            const docNameInput = document.getElementById('documentName');
            const modalElement = document.getElementById('autoTextoModal');
            if (docNameInput) {
                const docName = docNameInput.value.trim();
                if (confirm(`Excluir "${docName}"?`)) {
                    deleteDocumentFromLocalStorage(docName);
                    if (modalElement && typeof bootstrap !== 'undefined') {
                        const modal = bootstrap.Modal.getInstance(modalElement);
                        if (modal) modal.hide();
                    }
                }
            }
        });
    }

    const toggleBtn = document.getElementById('toggle-documents-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const docList = document.getElementById('documents-ul');
            const title = document.getElementById('document-list-title');
            if (docList && title) {
                if (docList.style.display === 'none') {
                    docList.style.display = 'block';
                    toggleBtn.textContent = 'Ocultar';
                    title.textContent = 'Auto Texto';
                    title.classList.add('visivel');
                    title.classList.remove('oculto');
                } else {
                    docList.style.display = 'none';
                    toggleBtn.textContent = 'Mostrar';
                    title.textContent = 'Auto Texto (Ocultos)';
                    title.classList.add('oculto');
                    title.classList.remove('visivel');
                }
            }
        });
    }

    // Botão de gravação
    const recordBtn = document.getElementById('record-btn');
    if (recordBtn) {
        recordBtn.addEventListener('click', toggleRecording);
    }

    // Botão de cor
    const changeColorBtn = document.getElementById('change-color');
    const colorPicker = document.getElementById('color-picker');
    if (changeColorBtn && colorPicker) {
        changeColorBtn.addEventListener('click', () => colorPicker.click());
        colorPicker.addEventListener('input', (e) => {
            if (quill) {
                quill.root.style.backgroundColor = e.target.value;
            }
        });
    }

    // Botão de simular auto texto
    const simulateBtn = document.getElementById('simulate-auto-texto');
    if (simulateBtn) {
        simulateBtn.addEventListener('click', () => {
            const exemplo = '<h3 data-start="109" data-end="166" style="color: rgb(33, 37, 41);"><span data-start="113" data-end="164" style="font-weight: bolder;">LAUDO DE RESSONÂNCIA MAGNÉTICA DA COLUNA LOMBAR</span></h3><p data-start="168" data-end="372"><span data-start="168" data-end="181" style="font-weight: bolder;">Paciente:</span>&nbsp;João da Silva<br data-start="195" data-end="198"><span data-start="198" data-end="216" style="font-weight: bolder;">Data do exame:</span>&nbsp;14/02/2025<br data-start="227" data-end="230"><span data-start="230" data-end="242" style="font-weight: bolder;">Técnica:</span>&nbsp;Ressonância Magnética da coluna lombar realizada em sequências ponderadas em T1, T2 e STIR nos planos sagital, axial e coronal.</p><h4 data-start="374" data-end="393" style="color: rgb(33, 37, 41);"><span data-start="379" data-end="391" style="font-weight: bolder;">Achados:</span></h4><ul data-start="394" data-end="1043"><li data-start="394" data-end="458">Alinhamento vertebral preservado, sem evidência de listeses.</li><li data-start="459" data-end="553">Altura e sinal dos corpos vertebrais preservados, sem sinais de fraturas ou lesões ósseas.</li><li data-start="554" data-end="656">Discos intervertebrais de morfologia e sinal normais, sem sinais de protrusões ou hérnias discais.</li><li data-start="657" data-end="731">Canal vertebral de amplitude normal, sem sinais de compressão medular.</li><li data-start="732" data-end="816">Conus medullaris localizado em posição habitual, com morfologia e sinal normais.</li><li data-start="817" data-end="887">Espaços intervertebrais sem sinais de estreitamento significativo.</li><li data-start="888" data-end="965">Articulações facetárias preservadas, sem sinais de artrose significativa.</li><li data-start="966" data-end="1043">Ausência de coleções líquidas ou alterações inflamatórias paravertebrais.</li></ul><h4 data-start="1045" data-end="1066" style="color: rgb(33, 37, 41);"><span data-start="1050" data-end="1064" style="font-weight: bolder;">Conclusão:</span></h4><p data-start="1067" data-end="1148">Exame sem evidências de alterações estruturais significativas na coluna lombar.</p>';
            saveDocumentToLocalStorage('lombar', exemplo);
            loadDocument('lombar');
        });
    }
}

// Configurar eventos quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initializeQuill();
        setupEventListeners();
        updateDocumentList();
    });
} else {
    // DOM já carregado
    initializeQuill();
    setupEventListeners();
    updateDocumentList();
}

// Reconhecimento de voz
function toggleRecording() {
    if (!isRecording) {
        iniciarGravacao();
    } else {
        pararGravacao();
    }
}

function iniciarGravacao() {
    // Verificar suporte para reconhecimento de voz
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        alert('Seu navegador não suporta reconhecimento de voz.');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';

    recognition.onstart = function() {
        console.log('Reconhecimento de voz iniciado.');
        isRecording = true;
        // Atualizar interface visual
        const recordBtn = document.getElementById('record-btn');
        if (recordBtn) recordBtn.classList.add('recording');
        const statusText = document.getElementById('status-text');
        if (statusText) statusText.textContent = 'Gravando... Fale agora';
        const indicator = document.querySelector('.indicator');
        if (indicator) {
            indicator.classList.remove('ready');
            indicator.classList.add('recording');
        }
    };

    recognition.onresult = function(event) {
        let transcript = '';
        let newLine = false;
        let newParagraph = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                let currentTranscript = event.results[i][0].transcript.trim().toLowerCase();
                console.log('Transcrição final:', currentTranscript);

                // Verifica se o comando é "próximo campo"
                if (currentTranscript.includes("próximo campo")) {
                    processarComandoVoz("próximo campo");
                    continue; // Não insere o comando como texto
                }
                if (currentTranscript.includes("campo anterior")) {
                    processarComandoVozAnterior("campo anterior");
                    continue; // Não insere o comando como texto
                }

                if (currentTranscript.includes("ponto")) {
                    console.log('Ponto detectado');
                    setTimeout(aplicarCorrecaoNoEditor, 500);
                }
                if (currentTranscript.includes("vírgula")) {
                    console.log('Vírgula detectada');
                    setTimeout(aplicarCorrecaoNoEditor, 500);
                }
                
                if (currentTranscript.includes("=?")) {
                    console.log('Interrogação igual detectada');
                    setTimeout(aplicarCorrecaoNoEditor, 500);
                }

                currentTranscript = currentTranscript.replace(/\.$/, ' ');

                if (currentTranscript.includes("nova linha")) {
                    newLine = true;
                    currentTranscript = currentTranscript.replace(/nova linha/gi, '');
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
                    currentTranscript = applySubstitutions(currentTranscript);

                    if (shouldCapitalize && currentTranscript.length > 0) {
                        currentTranscript = currentTranscript.charAt(0).toUpperCase() + currentTranscript.slice(1);
                        shouldCapitalize = false;
                    }
                    transcript += currentTranscript + ' ';
                }
            }
        }

        if ((transcript.trim() || newLine || newParagraph) && quill) {
            let range = quill.getSelection();
            let index = range ? range.index : quill.getLength();
            if (transcript.trim()) {
                console.log('Inserindo texto no editor:', transcript);
                quill.insertText(index, transcript, 'user');
                index += transcript.length;
            }
            if (newLine) {
                console.log('Inserindo nova linha');
                quill.insertText(index++, '\n', 'user');
                shouldCapitalize = true;
            }
            if (newParagraph) {
                console.log('Inserindo novo parágrafo');
                quill.insertText(index, '\n\n', 'user');
                index += 2;
                shouldCapitalize = true;
            }
            quill.setSelection(index);
        }
    };

    recognition.onend = function() {
        console.log('Reconhecimento de voz encerrado.');
        isRecording = false;
        shouldCapitalize = true;
        // Atualizar interface visual
        const recordBtn = document.getElementById('record-btn');
        if (recordBtn) recordBtn.classList.remove('recording');
        const statusText = document.getElementById('status-text');
        if (statusText) statusText.textContent = 'Sistema Pronto';
        const indicator = document.querySelector('.indicator');
        if (indicator) {
            indicator.classList.remove('recording');
            indicator.classList.add('ready');
        }
    };

    recognition.onerror = function(event) {
        console.error('Erro no reconhecimento de voz:', event.error);
        isRecording = false;
        const recordBtn = document.getElementById('record-btn');
        if (recordBtn) recordBtn.classList.remove('recording');
        const statusText = document.getElementById('status-text');
        if (statusText) {
            if (event.error === 'not-allowed') {
                statusText.textContent = 'Permissão de microfone negada';
                alert('Permissão de microfone necessária! Por favor, permita o acesso ao microfone nas configurações do navegador.');
            } else {
                statusText.textContent = 'Erro: ' + event.error;
            }
        }
        const indicator = document.querySelector('.indicator');
        if (indicator) {
            indicator.classList.remove('recording');
            indicator.classList.add('ready');
        }
    };

    recognition.start();
}

function pararGravacao() {
    if (recognition) {
        recognition.stop();
        isRecording = false;
        // Atualizar interface visual
        const recordBtn = document.getElementById('record-btn');
        if (recordBtn) recordBtn.classList.remove('recording');
        const statusText = document.getElementById('status-text');
        if (statusText) statusText.textContent = 'Sistema Pronto';
        const indicator = document.querySelector('.indicator');
        if (indicator) {
            indicator.classList.remove('recording');
            indicator.classList.add('ready');
        }
    }
}

// Funções auxiliares
function corrigirEspacosAntesDePontos(texto) {
    return texto.replace(/(\w+)\s+([.,])/g, "$1$2");
}

function removerInterrogacaoIgual(texto) {
    return texto.replace(/=\s*\?/g, "=");
}

function aplicarCorrecaoNoEditor() {
    if (!quill) return; // Quill não está inicializado
    
    const range = quill.getSelection();
    const cursorPosition = range ? range.index : quill.getLength();
    let textoAtual = quill.getText();
    
    // Aplica ambas as correções
    textoAtual = corrigirEspacosAntesDePontos(textoAtual);
    textoAtual = removerInterrogacaoIgual(textoAtual);
    
    quill.setText(textoAtual);
    quill.setSelection(cursorPosition);
}

// Lista para armazenar as posições dos campos
let campos = [];
let campoAtualIndex = -1;

// Função para encontrar todos os campos no texto
function encontrarCampos() {
    if (!quill) return; // Quill não está inicializado
    
    const texto = quill.getText();
    campos = [];
    let regex = /\[([^\]]*)\]/g;
    let match;

    // Encontra todos os campos no texto e armazena suas posições
    while ((match = regex.exec(texto)) !== null) {
        campos.push({
            start: match.index,
            end: match.index + match[0].length,
            conteudo: match[1]
        });
    }
}

// Função para navegar para o próximo campo
function proximoCampo() {
    if (!quill) {
        console.log("Quill não está inicializado");
        return;
    }
    if (campos.length === 0) {
        console.log("Nenhum campo encontrado.");
        return;
    }

    campoAtualIndex = (campoAtualIndex + 1) % campos.length; // Avança para o próximo campo
    const campo = campos[campoAtualIndex];

    // Move o cursor para dentro do campo, logo após o conteúdo existente
    const posicaoCursor = campo.start + campo.conteudo.length + 1; // +1 para pular o "["
    quill.setSelection(posicaoCursor);

    console.log(`Navegando para o campo: [${campo.conteudo}]`);
}

function campoAnterior() {
    if (!quill) {
        console.log("Quill não está inicializado");
        return;
    }
    if (campos.length === 0) {
        console.log("Nenhum campo encontrado.");
        return;
    }

    campoAtualIndex = (campoAtualIndex - 1 + campos.length) % campos.length; // Volta para o campo anterior
    const campo = campos[campoAtualIndex];

    // Move o cursor para dentro do campo, logo após o conteúdo existente
    const posicaoCursor = campo.start + campo.conteudo.length + 1; // +1 para pular o "["
    quill.setSelection(posicaoCursor);

    console.log(`Navegando para o campo anterior: [${campo.conteudo}]`);
}

// Função para processar comandos de voz
function processarComandoVoz(comando) {
    if (comando.includes("próximo campo")) {
        encontrarCampos(); // Atualiza a lista de campos antes de navegar
        proximoCampo();
    }
}

function processarComandoVozAnterior(comando) {
    if (comando.includes("campo anterior")) {
        encontrarCampos(); // Atualiza a lista de campos antes de navegar
        campoAnterior();
    }
}

// A atualização de campos será configurada quando o Quill for inicializado
// (já está na função initializeQuill acima)
