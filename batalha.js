// ==========================================
// MOTOR DA MINI-CARTA (DROME PRO 2.1 - ELEMENTOS ESCONDIDOS)
// ==========================================
function desenharMiniCarta(criaturaObj) {
    let img = "";
    let hpAtual = 0;
    let c = 0, p = 0, s = 0, v = 0;
    let elems = [];
    let pct = 0;
    let corHp = '#444';
    let triboClass = ""; 

    if (criaturaObj) {
        img = criaturaObj.cartaBlank; 
        
        let hpMax = criaturaObj.hpMax || criaturaObj.statsMax?.energia || 0;
        hpAtual = criaturaObj.hpAtual !== undefined ? criaturaObj.hpAtual : hpMax;
        
        c = criaturaObj.coragem || criaturaObj.statsMax?.coragem || 0;
        p = criaturaObj.poder || criaturaObj.statsMax?.poder || 0;
        s = criaturaObj.sabedoria || criaturaObj.statsMax?.sabedoria || 0;
        v = criaturaObj.velocidade || criaturaObj.statsMax?.velocidade || 0;
        elems = criaturaObj.elementos || [];
        
        const triboMap = {'Azul': 'tribo-azul', 'Vermelho': 'tribo-vermelho', 'Amarelo': 'tribo-amarelo', 'Verde': 'tribo-verde', 'Ciano': 'tribo-ciano', 'Cinza': 'tribo-cinza'};
        triboClass = triboMap[criaturaObj.tribo] || 'tribo-cinza';

        pct = Math.max(0, Math.min(100, (hpAtual / hpMax) * 100));
        corHp = 'lime';
        if (pct <= 50) corHp = 'orange';
        if (pct <= 20) corHp = 'red';
    }

    const temFogo = elems.includes('Fogo');
    const temAgua = elems.includes('Agua');
    const temTerra = elems.includes('Terra');
    const temAr = elems.includes('Ar');

    return `
        <div class="mini-card-wrapper">
            <div class="mini-card-body ${triboClass}">
                <div class="mini-top-row">
                    <div class="mini-art" style="${img ? `background-image: url('${img}');` : ''}">${!img ? '🛡️' : ''}</div>
                </div>
                
                <div class="mini-hp-row">
                    <div class="mini-hp-fill" style="width: ${pct}%; background-color: ${corHp};"></div>
                    <span class="mini-hp-text">${hpAtual > 0 ? hpAtual : ''}</span>
                </div>

                <div class="mini-stats-container">
                    <div class="mini-stats-band">
                        <div class="mini-stat-item"><span>❤️</span><b>${criaturaObj ? c : ''}</b></div>
                        <div class="mini-stat-item"><span>⚡</span><b>${criaturaObj ? p : ''}</b></div>
                        <div class="mini-stat-item"><span>👁️</span><b>${criaturaObj ? s : ''}</b></div>
                        <div class="mini-stat-item"><span>💨</span><b>${criaturaObj ? v : ''}</b></div>
                    </div>

                    <div class="mini-elements-band">
                        <div class="mini-el fogo ${temFogo ? 'ativo' : ''}">🔥</div>
                        <div class="mini-el ar ${temAr ? 'ativo' : ''}">☁️</div>
                        <div class="mini-el terra ${temTerra ? 'ativo' : ''}">⛰️</div>
                        <div class="mini-el agua ${temAgua ? 'ativo' : ''}">🌊</div>
                    </div>
                </div>

            </div>
        </div>
    `;
}

// ==========================================
// SISTEMA DE CONTADOR INTELIGENTE E CARGA DE DECK
// ==========================================

// O Campo agora começa 100% vazio, aguardando o Scanner injetar as cartas reais
let campoJogador = { c1: null, c2: null, c3: null, c4: null, c5: null, c6: null };

// 🛠️ MÁGICA: A função que pega o seu deck selecionado e cria os guerreiros no tabuleiro!
window.carregarDeckParaBatalha = function() {
    // 🔥 CORREÇÃO DO BUG FANTASMA: Limpa o tabuleiro inteiro antes de começar!
    campoJogador = { c1: null, c2: null, c3: null, c4: null, c5: null, c6: null };
    window.campoOponente = { c1: null, c2: null, c3: null, c4: null, c5: null, c6: null };
    window.slotSelecionadoMovimento = null;
    if (typeof limparDestaquesMovimento === "function") limparDestaquesMovimento();

    let deck = window.estadoDrome.deckSelecionado;
    if (!deck || !deck.criaturas) return;

    // As 6 posições do tabuleiro
    let chaves = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
    
    chaves.forEach((chave, index) => {
        let idCarta = deck.criaturas[index]; // Pega o ID salvo no slot do deck
        
        if (idCarta) {
            // Acha a carta real no seu inventário!
            let cartaOriginal = window.inventario.find(c => c.id == idCarta);
            
            if (cartaOriginal) {
                // Monta o guerreiro com os status reais de DNA da sua coleção
                campoJogador[chave] = {
                    dono: 'jogador', // 🔥 NOVO: Identidade para o sistema saber que a carta é sua
                    nome: cartaOriginal.nome,
                    tribo: cartaOriginal.tribo || "Azul",
                    elementos: cartaOriginal.elementos || [],
                    cartaBlank: cartaOriginal.img,
                    statsMax: { 
                        coragem: cartaOriginal.stats?.c || 0, 
                        poder: cartaOriginal.stats?.p || 0, 
                        sabedoria: cartaOriginal.stats?.s || 0, 
                        velocidade: cartaOriginal.stats?.v || 0, 
                        energia: cartaOriginal.stats?.e || 0 
                    },
                    hpAtual: cartaOriginal.stats?.e || 0,
                    fichasHabilidade: 2 // Começa com 2 fichas padrão
                };
            }
        } else {
            campoJogador[chave] = null;
        }
    });

    atualizarTelaBatalha(); // Manda desenhar na tela!
};

function atualizarTelaBatalha() {
    const slots = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
    slots.forEach(slotId => {
        const el = document.getElementById('jog-' + slotId);
        if(el) el.innerHTML = desenharMiniCarta(campoJogador[slotId]);
    });

    const slotsOp = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
    slotsOp.forEach(slotId => {
        const el = document.getElementById('op-' + slotId);
        if(el) el.innerHTML = desenharMiniCarta(window.campoOponente ? window.campoOponente[slotId] : null); // Alterado para ler do oponente também
    });

    atualizarContadorFichasHabilidade();
}

function atualizarContadorFichasHabilidade() {
    
    function renderizarBotaoFichas(seletorLado, ladoId, totalFichas) {
        const containerFichas = document.querySelector(`${seletorLado} .container-fichas-js`);
        
        if(containerFichas && !document.getElementById(`btn-contador-${ladoId}`)) {
            const btnHTML = `
                <button class="btn-total-fichas" id="btn-contador-${ladoId}">
                    <span id="txt-fichas-${ladoId}">Fichas: <span class="total-number" id="valor-total-${ladoId}">${totalFichas}</span></span>
                </button>
            `;
            containerFichas.innerHTML = btnHTML;
            document.getElementById(`btn-contador-${ladoId}`).addEventListener('click', () => abrirModalFichas(ladoId));
        } else if (document.getElementById(`valor-total-${ladoId}`)) {
            document.getElementById(`valor-total-${ladoId}`).textContent = totalFichas;
        }
    }

    let totalJogador = 0;
    Object.values(campoJogador).forEach(c => {
        if(c && c.fichasHabilidade) totalJogador += c.fichasHabilidade;
    });
    renderizarBotaoFichas('.lado-jogador', 'jogador', totalJogador);

    if(!window.campoOponente) {
        window.campoOponente = { c1: null, c2: null, c3: null, c4: null, c5: null, c6: null };
    }

    let totalOponente = 0;
    Object.values(window.campoOponente).forEach(c => {
        if(c && c.fichasHabilidade) totalOponente += c.fichasHabilidade;
    });
    renderizarBotaoFichas('.lado-oponente', 'oponente', totalOponente);
}

// --------------------------------------------------
// SISTEMA DE MODAL DETALHADO
// --------------------------------------------------

function abrirModalFichas(ladoId) {
    let listaHTML = '';
    
    const campoAlvo = ladoId === 'oponente' ? window.campoOponente : campoJogador;
    const tituloModal = ladoId === 'oponente' ? 'FICHAS DO OPONENTE' : 'MINHAS FICHAS';
    
    Object.values(campoAlvo).forEach(c => {
        if(c) {
            const fichas = c.fichasHabilidade || 0;
            const semFichasClass = fichas === 0 ? 'sem-fichas' : '';
            
            listaHTML += `
                <div class="criatura-fichas-item ${semFichasClass}">
                    <div class="criatura-fichas-art" style="background-image: url('${c.cartaBlank}')"></div>
                    <div class="criatura-fichas-info">
                        <div class="criatura-fichas-nome">${c.nome}</div>
                        <div class="criatura-fichas-tribo">${c.tribo}</div>
                    </div>
                    <div class="criatura-fichas-valor">${fichas}</div>
                </div>
            `;
        }
    });

    if(listaHTML === '') listaHTML = '<p style="color:#aaa; text-align:center;">Sem criaturas com fichas no momento.</p>';

    const modalHTML = `
        <div class="modal-overlay" id="overlay-fichas">
            <div class="modal-content-fichas">
                <span class="fechar-modal-fichas" id="fechar-modal-fichas">×</span>
                <h3>${tituloModal}</h3>
                <div class="fichas-lista">
                    ${listaHTML}
                </div>
            </div>
        </div>
    `;

    document.getElementById('tela-batalha').insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('fechar-modal-fichas').addEventListener('click', fecharModalFichas);
    document.getElementById('overlay-fichas').addEventListener('click', function(e) {
        if(e.target === this) fecharModalFichas();
    });
}

function fecharModalFichas() {
    const el = document.getElementById('overlay-fichas');
    if(el) el.remove();
}

// A atualização inicial do tabuleiro agora acontece de forma mais limpa!
setTimeout(atualizarTelaBatalha, 500);

// ==========================================
// SISTEMA DE MOVIMENTAÇÃO E COMBATE
// ==========================================

// 1. O Mapa Mental do Tabuleiro (A Pirâmide do Drome e as pontes)
const mapAdjacencia = {
    'jog-c1': ['jog-c2', 'jog-c4'],
    'jog-c2': ['jog-c1', 'jog-c3', 'jog-c4', 'jog-c5'],
    'jog-c3': ['jog-c2', 'jog-c5'],
    'jog-c4': ['jog-c1', 'jog-c2', 'jog-c5', 'jog-c6'],
    'jog-c5': ['jog-c2', 'jog-c3', 'jog-c4', 'jog-c6'],
    'jog-c6': ['jog-c4', 'jog-c5', 'op-c6'], // Ponte para o inimigo!
    'op-c1': ['op-c2', 'op-c4'],
    'op-c2': ['op-c1', 'op-c3', 'op-c4', 'op-c5'],
    'op-c3': ['op-c2', 'op-c5'],
    'op-c4': ['op-c1', 'op-c2', 'op-c5', 'op-c6'],
    'op-c5': ['op-c2', 'op-c3', 'op-c4', 'op-c6'],
    'op-c6': ['op-c4', 'op-c5', 'jog-c6'] // Ponte de volta
};

window.slotSelecionadoMovimento = null;

// Puxa ou salva a criatura dependendo do lado da mesa
function obterCriaturaNoSlot(fullId) {
    if (fullId.startsWith('jog-')) return campoJogador[fullId.replace('jog-', '')];
    if (fullId.startsWith('op-')) return window.campoOponente[fullId.replace('op-', '')];
    return null;
}

function setarCriaturaNoSlot(fullId, criatura) {
    if (fullId.startsWith('jog-')) campoJogador[fullId.replace('jog-', '')] = criatura;
    if (fullId.startsWith('op-')) window.campoOponente[fullId.replace('op-', '')] = criatura;
}

// 2. A Lógica do Clique no Tabuleiro
window.lidarComCliqueTabuleiro = function(fullId) {
    let criaturaAlvo = obterCriaturaNoSlot(fullId);
    let el = document.getElementById(fullId);
    
    // Se o slot estiver invisível por causa do modo (ex: 1x1 ou 3x3), ignora totalmente!
    if (!el || el.parentElement.style.display === 'none') return;

    // A) SE NÃO TEM NINGUÉM SELECIONADO AINDA
    if (!window.slotSelecionadoMovimento) {
        if (criaturaAlvo && criaturaAlvo.dono === 'jogador') {
            window.slotSelecionadoMovimento = fullId;
            destacarAdjacentes(fullId);
            if(window.tocarSFX) window.tocarSFX('notificacao'); // Toca sonzinho suave
        }
        return;
    }

    // B) SE JÁ TEM ALGUÉM SELECIONADO
    let idOrigem = window.slotSelecionadoMovimento;
    let criaturaOrigem = obterCriaturaNoSlot(idOrigem);

    // Clicou na mesma carta? Deseleciona.
    if (idOrigem === fullId) {
        limparDestaquesMovimento();
        window.slotSelecionadoMovimento = null;
        return;
    }

    // Clicou em outra carta SUA? Troca a seleção pra ela!
    if (criaturaAlvo && criaturaAlvo.dono === 'jogador') {
        limparDestaquesMovimento();
        window.slotSelecionadoMovimento = fullId;
        destacarAdjacentes(fullId);
        if(window.tocarSFX) window.tocarSFX('notificacao');
        return;
    }

    // Clicou longe demais? (Espaço não é adjacente)
    if (!mapAdjacencia[idOrigem].includes(fullId)) {
        limparDestaquesMovimento();
        window.slotSelecionadoMovimento = null;
        return;
    }

    // ===========================
    // MODO AÇÃO! (Mover ou Atacar)
    // ===========================
    if (!criaturaAlvo) {
        // MOVIMENTO (Clicou num buraco vazio)
        setarCriaturaNoSlot(fullId, criaturaOrigem); // Clona pra frente
        setarCriaturaNoSlot(idOrigem, null); // Apaga de onde estava
        window.mostrarMensagemScanner("Avançando pelo tabuleiro!");
    } else if (criaturaAlvo.dono === 'oponente') {
        // COMBATE (Clicou numa criatura do Oponente)
        window.mostrarMensagemScanner("⚔️ COMBATE INICIADO!");
        // O código de abrir a tela de ataque entrará aqui futuramente
    }

    limparDestaquesMovimento();
    window.slotSelecionadoMovimento = null;
    atualizarTelaBatalha(); // Redesenha a tela pra mostrar a carta no lugar novo
}

// 3. Efeitos Visuais (CSS Dinâmico)
function destacarAdjacentes(fullId) {
    limparDestaquesMovimento();
    document.getElementById(fullId).classList.add('slot-selecionado');

    mapAdjacencia[fullId].forEach(adjId => {
        let el = document.getElementById(adjId);
        // Só acende e permite ir para slots que existem e estão visíveis na tela
        if (el && el.parentElement.style.display !== 'none') {
            let criaturaAlvo = obterCriaturaNoSlot(adjId);
            if (!criaturaAlvo) {
                el.classList.add('slot-livre-movimento'); // Verde: Pode andar
            } else if (criaturaAlvo.dono === 'oponente') {
                el.classList.add('slot-alvo-combate'); // Vermelho: Pode atacar
            }
        }
    });
}

function limparDestaquesMovimento() {
    // 🔥 CORREÇÃO 6x6: O limpador agora varre todo mundo para tirar as cores
    document.querySelectorAll('.slot-criatura, .zona-central > div').forEach(el => {
        el.classList.remove('slot-selecionado', 'slot-livre-movimento', 'slot-alvo-combate');
    });
}

// Injeta o CSS das luzes e os Sensores de Clique nas caixas
setTimeout(() => {
    if (!document.getElementById("css-movimento")) {
        let style = document.createElement('style');
        style.id = "css-movimento";
        style.innerHTML = `
            .slot-selecionado { box-shadow: 0 0 20px #ffd700, inset 0 0 10px #ffd700 !important; border-color: #ffd700 !important; transform: scale(1.05); transition: 0.2s; z-index: 100;}
            .slot-livre-movimento { box-shadow: inset 0 0 25px rgba(0,255,0,0.8), 0 0 15px rgba(0,255,0,0.5) !important; border-color: #00ff00 !important; cursor: pointer; transition: 0.2s; z-index: 90;}
            .slot-livre-movimento:hover { background: rgba(0,255,0,0.15); transform: scale(1.02); }
            .slot-alvo-combate { box-shadow: inset 0 0 25px rgba(255,0,0,0.8), 0 0 15px rgba(255,0,0,0.5) !important; border-color: #ff0000 !important; cursor: pointer; transition: 0.2s; z-index: 90;}
            .slot-alvo-combate:hover { background: rgba(255,0,0,0.15); transform: scale(1.02); }
        `;
        document.head.appendChild(style);
    }

    // 🔥 CORREÇÃO DA LONA INVISÍVEL: Fura a barreira das fileiras
    let zonas = document.querySelectorAll('.zona-central');
    if (zonas) zonas.forEach(z => z.style.pointerEvents = "none"); // Fura a lona gigante

    // Cola o sensor de clique em todos os 12 buracos do tabuleiro!
    ['jog', 'op'].forEach(lado => {
        ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'].forEach(slot => {
            let el = document.getElementById(`${lado}-${slot}`);
            if (el) {
                // Fura a lona da fileira individual
                if (el.parentElement) el.parentElement.style.pointerEvents = "none";
                
                // Devolve a capacidade de clicar APENAS para a minicarta
                el.style.pointerEvents = "auto";
                
                el.onclick = (e) => {
                    e.stopPropagation(); // Trava pro clique não vazar
                    window.lidarComCliqueTabuleiro(`${lado}-${slot}`);
                };
            }
        });
    });
}, 1000); // 1 segundo de atraso para ter certeza que a tela existe
