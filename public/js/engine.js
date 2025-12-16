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

// Funções de gerenciamento de documentos (substituindo localStorage por backend)
async function getDocumentsFromBackend() {
    try {
        const response = await fetch('/autotext');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao carregar documentos:', error);
        return [];
    }
}

async function saveDocumentToBackend(name, content) {
    try {
        const response = await fetch('/autotext', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, content })
        });
        const result = await response.json();
        if (result.message) {
            alert(result.message);
            updateDocumentList();
        }
    } catch (error) {
        console.error('Erro ao salvar documento:', error);
    }
}

async function deleteDocumentFromBackend(id) {
    try {
        const response = await fetch(`/autotext/${id}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (result.message) {
            alert(result.message);
            updateDocumentList();
        }
    } catch (error) {
        console.error('Erro ao excluir documento:', error);
    }
}

async function updateDocumentList() {
    try {
        const documents = await getDocumentsFromBackend();
        const documentList = document.getElementById('documents-ul');
        if (documentList) {
            documentList.innerHTML = '';
            documents.forEach(doc => {
                const li = document.createElement('li');
                li.classList.add('list-group-item');
                li.textContent = doc.name;
                li.addEventListener('click', () => openDocumentForEditing(doc._id));
                documentList.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Erro ao atualizar lista de documentos:', error);
    }
}

async function openDocumentForEditing(id) {
    try {
        const response = await fetch(`/autotext/${id}`);
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        
        // Preencha o campo "documentName" com o nome do documento
        const docNameInput = document.getElementById('documentName');
        if (docNameInput) docNameInput.value = data.name;
        
        // Preencha o editor com o conteúdo do documento
        if (modalQuill) modalQuill.root.innerHTML = data.content;
        
        // Armazene o ID do documento no formulário para uso posterior
        const form = document.getElementById('autoTextoForm');
        if (form) form.dataset.id = id;
        
        // Mostre o botão "Excluir"
        const deleteBtn = document.getElementById('deleteDocumentBtn');
        if (deleteBtn) deleteBtn.style.display = 'inline-block';
        
        // Abra o modal
        const modalElement = document.getElementById('autoTextoModal');
        if (modalElement && typeof bootstrap !== 'undefined') {
            new bootstrap.Modal(modalElement).show();
        }
    } catch (error) {
        console.error('Erro ao abrir documento para edição:', error);
        alert('Erro ao carregar o documento. Verifique o console para mais detalhes.');
    }
}

function openModalForNewDocument() {
    const docNameInput = document.getElementById('documentName');
    const deleteBtn = document.getElementById('deleteDocumentBtn');
    const modalElement = document.getElementById('autoTextoModal');
    const form = document.getElementById('autoTextoForm');
    
    if (docNameInput) docNameInput.value = '';
    if (modalQuill) modalQuill.root.innerHTML = '';
    if (deleteBtn) deleteBtn.style.display = 'none';
    if (form) delete form.dataset.id; // Remover o ID do formulário
    
    if (modalElement && typeof bootstrap !== 'undefined') {
        new bootstrap.Modal(modalElement).show();
    }
}

async function loadDocument(docName) {
    try {
        console.log(`Buscando documento: ${docName}`);

        const response = await fetch(`/autotext/by-name?name=${encodeURIComponent(docName)}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        console.log('Resposta do servidor:', response);

        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Resposta do backend:', data);

        if (data.content && quill) {
            const range = quill.getSelection();
            const index = range ? range.index : quill.getLength();
            quill.clipboard.dangerouslyPasteHTML(index, data.content);
            quill.setSelection(index + data.content.length);
        } else if (!quill) {
            console.log('Quill ainda não foi inicializado');
        } else {
            console.log(`Documento com nome "${docName}" não encontrado`);
            alert(`Documento "${docName}" não encontrado!`);
        }
    } catch (error) {
        console.error('Erro ao carregar documento:', error);
        alert('Erro ao carregar o documento. Verifique o console para mais detalhes.');
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
        saveBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('Botão Salvar clicado');

            const docNameInput = document.getElementById('documentName');
            const modalElement = document.getElementById('autoTextoModal');
            const form = document.getElementById('autoTextoForm');
            
            if (docNameInput && modalQuill) {
                const docName = docNameInput.value.trim();
                const content = modalQuill.root.innerHTML;
                const id = form ? form.dataset.id : null;

                if (docName && content) {
                    const data = {
                        id: id,
                        name: docName,
                        content: content
                    };

                    const response = await fetch('/autotext', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });

                    if (response.ok) {
                        const result = await response.json();
                        alert(result.message);
                        if (modalElement && typeof bootstrap !== 'undefined') {
                            const modal = bootstrap.Modal.getInstance(modalElement);
                            if (modal) modal.hide();
                        }
                        updateDocumentList();
                    } else {
                        alert('Erro ao salvar auto texto.');
                    }
                } else {
                    alert('Preencha nome e conteúdo.');
                }
            }
        });
    }

    const deleteBtn = document.getElementById('deleteDocumentBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            const form = document.getElementById('autoTextoForm');
            const modalElement = document.getElementById('autoTextoModal');
            
            if (form) {
                const id = form.dataset.id;
                if (id && confirm('Tem certeza que deseja excluir este auto texto?')) {
                    await deleteDocumentFromBackend(id);
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

    // Botão de simular auto texto (removido pois agora usa backend)
    const simulateBtn = document.getElementById('simulate-auto-texto');
    if (simulateBtn) {
        simulateBtn.style.display = 'none'; // Esconder botão de simulação
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

// Funções auxiliares para correção de texto
function corrigirEspacosAntesDePontos(texto) {
    return texto.replace(/(\w+)\s+([.,])/g, "$1$2");
}

function removerInterrogacaoIgual(texto) {
    return texto.replace(/=\s*\?/g, "=");
}

// FUNÇÃO CORRIGIDA - Aplica correção apenas na linha ativa
function aplicarCorrecaoNoEditor() {
    if (!quill) return;
    
    const range = quill.getSelection();
    if (!range) return;
    
    const cursorPosition = range.index;
    const textoCompleto = quill.getText();
    
    // Encontra os limites da linha atual (até as quebras de linha mais próximas)
    let inicioLinha = textoCompleto.lastIndexOf('\n', cursorPosition - 1);
    let fimLinha = textoCompleto.indexOf('\n', cursorPosition);
    
    // Ajusta os índices
    inicioLinha = inicioLinha === -1 ? 0 : inicioLinha + 1;
    fimLinha = fimLinha === -1 ? textoCompleto.length : fimLinha;
    
    // Obtém o texto da linha atual
    const textoLinha = textoCompleto.substring(inicioLinha, fimLinha);
    
    // Aplica correções apenas na linha atual
    let textoCorrigido = corrigirEspacosAntesDePontos(textoLinha);
    textoCorrigido = removerInterrogacaoIgual(textoCorrigido);
    
    // Se houve alteração, substitui apenas a linha atual
    if (textoCorrigido !== textoLinha) {
        // Calcula a nova posição do cursor baseado nas mudanças
        const posicaoNaLinha = cursorPosition - inicioLinha;
        const diferenca = textoCorrigido.length - textoLinha.length;
        const novaPosicao = cursorPosition + diferenca;
        
        // Substitui apenas a linha atual
        quill.deleteText(inicioLinha, fimLinha - inicioLinha);
        quill.insertText(inicioLinha, textoCorrigido);
        
        // Restaura a posição do cursor
        quill.setSelection(novaPosicao);
        
        console.log('Correção aplicada apenas na linha atual');
    }
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