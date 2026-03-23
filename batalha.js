// ==========================================
// MOTOR DA MINI-CARTA (DROME PRO 2.1 - ELEMENTOS ESCONDIDOS E EQUIPAMENTOS)
// ==========================================
function desenharMiniCarta(criaturaObj) {
    let img = "";
    let hpAtual = 0;
    let c = 0, p = 0, s = 0, v = 0;
    let elems = [];
    let pct = 0;
    let corHp = '#444';
    let triboClass = ""; 
    let htmlEquipamento = ""; // 🔥 NOVO: HTML do ícone de equipamento

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

        // 🔥 NOVO: Renderiza o ícone do equipamento se existir
        if (criaturaObj.equipamento) {
            if (criaturaObj.equipamentoRevelado) {
                htmlEquipamento = `
                    <div class="mini-equip-icon revelado" style="background-image: url('${criaturaObj.equipamento.img}')">
                        <div class="equip-tooltip"><b>${criaturaObj.equipamento.nome}</b><br>${criaturaObj.equipamento.efeito || 'Sem efeito'}</div>
                    </div>
                `;
            } else if (criaturaObj.dono === 'jogador') {
                htmlEquipamento = `
                    <div class="mini-equip-icon oculto">
                        ?
                        <div class="equip-tooltip"><b>Equipamento Oculto</b><br>Oponente não pode ver</div>
                    </div>
                `;
            }
        }
    }

    const temFogo = elems.includes('Fogo');
    const temAgua = elems.includes('Agua');
    const temTerra = elems.includes('Terra');
    const temAr = elems.includes('Ar');

    return `
        <div class="mini-card-wrapper">
            ${htmlEquipamento}
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

let campoJogador = { c1: null, c2: null, c3: null, c4: null, c5: null, c6: null };

window.carregarDeckParaBatalha = function() {
    campoJogador = { c1: null, c2: null, c3: null, c4: null, c5: null, c6: null };
    window.campoOponente = { c1: null, c2: null, c3: null, c4: null, c5: null, c6: null };
    window.slotSelecionadoMovimento = null;
    if (typeof limparDestaquesMovimento === "function") limparDestaquesMovimento();

    let deck = window.estadoDrome.deckSelecionado;
    if (!deck || !deck.criaturas) return;

    let chaves = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
    
    chaves.forEach((chave, index) => {
        let idCarta = deck.criaturas[index]; 
        let idEquip = deck.equipamentos ? deck.equipamentos[index] : null; // 🔥 NOVO: Puxa o equipamento do deck
        
        if (idCarta) {
            let cartaOriginal = window.inventario.find(c => c.id == idCarta);
            let equipOriginal = idEquip ? window.inventario.find(c => c.id == idEquip) : null; // 🔥 NOVO: Busca item no inventário
            
            if (cartaOriginal) {
                campoJogador[chave] = {
                    dono: 'jogador',
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
                    fichasHabilidade: 2,
                    // 🔥 NOVO: Salva os dados do equipamento no guerreiro!
                    equipamento: equipOriginal ? { 
                        nome: equipOriginal.nome, 
                        img: equipOriginal.img, 
                        efeito: equipOriginal.efeito 
                    } : null,
                    equipamentoRevelado: false
                };
            }
        }
    });

    atualizarTelaBatalha(); 
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
        if(el) el.innerHTML = desenharMiniCarta(window.campoOponente ? window.campoOponente[slotId] : null); 
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
// SISTEMA DE MODAL DETALHADO E EQUIPAMENTOS
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

// 🔥 NOVO: MODAL DE AÇÕES DA CRIATURA (Equipamento vs Movimento)
window.abrirModalAcoesCriatura = function(fullId, criatura) {
    if (document.getElementById('overlay-acoes')) return;

    let botoesHTML = `
        <button class="btn-acao-modal btn-mover" onclick="window.selecionarParaMovimento('${fullId}')">Prepara para Mover</button>
    `;

    if (criatura.equipamento) {
        if (!criatura.equipamentoRevelado) {
            botoesHTML += `<button class="btn-acao-modal btn-revelar" onclick="window.revelarEquipamento('${fullId}')">Revelar Equipamento</button>`;
        } else {
            botoesHTML += `<button class="btn-acao-modal btn-ver" onclick="window.verEquipamentoModal('${fullId}')">Ver Equipamento</button>`;
        }
    }

    botoesHTML += `<button class="btn-acao-modal btn-cancelar" onclick="fecharModalAcoes()">Cancelar</button>`;

    const modalHTML = `
        <div class="modal-overlay" id="overlay-acoes">
            <div class="modal-content-fichas" style="text-align:center;">
                <h3 style="color:#4CAF50;margin-bottom:5px;">${criatura.nome}</h3>
                <p style="font-size:10px;color:#aaa;margin-bottom:20px;">O que deseja fazer?</p>
                <div style="display:flex;flex-direction:column;gap:10px;">
                    ${botoesHTML}
                </div>
            </div>
        </div>
    `;

    document.getElementById('tela-batalha').insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('overlay-acoes').addEventListener('click', function(e) {
        if(e.target === this) fecharModalAcoes();
    });
}

window.fecharModalAcoes = function() {
    const el = document.getElementById('overlay-acoes');
    if(el) el.remove();
}

window.selecionarParaMovimento = function(fullId) {
    window.fecharModalAcoes();
    window.slotSelecionadoMovimento = fullId;
    destacarAdjacentes(fullId);
    if(window.tocarSFX) window.tocarSFX('notificacao'); 
}

window.revelarEquipamento = function(fullId) {
    window.fecharModalAcoes();
    let criatura = obterCriaturaNoSlot(fullId);
    if (criatura && criatura.equipamento) {
        criatura.equipamentoRevelado = true;
        window.mostrarMensagemScanner("🔮 Equipamento Revelado!");
        atualizarTelaBatalha();
        // Em um jogo online, aqui enviaríamos o comando pro Firebase avisando o inimigo!
    }
}

window.verEquipamentoModal = function(fullId) {
    window.fecharModalAcoes();
    let criatura = obterCriaturaNoSlot(fullId);
    if (!criatura || !criatura.equipamento) return;
    
    const equip = criatura.equipamento;
    const modalHTML = `
        <div class="modal-overlay" id="overlay-ver-equip">
            <div class="modal-content-fichas" style="text-align:center;">
                <span class="fechar-modal-fichas" onclick="document.getElementById('overlay-ver-equip').remove()">×</span>
                <h3 style="color:#ffd700;margin-bottom:15px;">Equipamento</h3>
                <div style="width:120px;height:120px;margin:0 auto 15px auto;background-image:url('${equip.img}');background-size:cover;border:2px solid #ffd700;border-radius:10px;"></div>
                <h4 style="color:#fff;margin-bottom:5px;">${equip.nome}</h4>
                <p style="font-size:11px;color:#ccc;line-height:1.4;">${equip.efeito}</p>
            </div>
        </div>
    `;
    document.getElementById('tela-batalha').insertAdjacentHTML('beforeend', modalHTML);
}

setTimeout(atualizarTelaBatalha, 500);

// ==========================================
// SISTEMA DE MOVIMENTAÇÃO E COMBATE DINÂMICO
// ==========================================

const baseAdjacencia = {
    'jog-c1': ['jog-c2', 'jog-c4'],
    'jog-c2': ['jog-c1', 'jog-c3', 'jog-c4', 'jog-c5'],
    'jog-c3': ['jog-c2', 'jog-c5'],
    'jog-c4': ['jog-c1', 'jog-c2', 'jog-c5', 'jog-c6'],
    'jog-c5': ['jog-c2', 'jog-c3', 'jog-c4', 'jog-c6'],
    'jog-c6': ['jog-c4', 'jog-c5'], 
    
    'op-c1': ['op-c2', 'op-c4'],
    'op-c2': ['op-c1', 'op-c3', 'op-c4', 'op-c5'],
    'op-c3': ['op-c2', 'op-c5'],
    'op-c4': ['op-c1', 'op-c2', 'op-c5', 'op-c6'],
    'op-c5': ['op-c2', 'op-c3', 'op-c4', 'op-c6'],
    'op-c6': ['op-c4', 'op-c5']
};

window.slotSelecionadoMovimento = null;

function obterAdjacencias(fullId) {
    let adj = [...(baseAdjacencia[fullId] || [])];
    let modo = window.estadoDrome ? window.estadoDrome.modo : "6x6";

    if (modo === "6x6") {
        if (fullId === 'jog-c1') adj.push('op-c3', 'op-c2'); 
        if (fullId === 'jog-c2') adj.push('op-c3', 'op-c2', 'op-c1'); 
        if (fullId === 'jog-c3') adj.push('op-c2', 'op-c1'); 
        
        if (fullId === 'op-c3') adj.push('jog-c1', 'jog-c2');
        if (fullId === 'op-c2') adj.push('jog-c1', 'jog-c2', 'jog-c3');
        if (fullId === 'op-c1') adj.push('jog-c2', 'jog-c3');
    } 
    else if (modo === "3x3") {
        if (fullId === 'jog-c4') adj.push('op-c5', 'op-c4'); 
        if (fullId === 'jog-c5') adj.push('op-c5', 'op-c4');
        
        if (fullId === 'op-c4') adj.push('jog-c5', 'jog-c4');
        if (fullId === 'op-c5') adj.push('jog-c5', 'jog-c4');
    } 
    else if (modo && modo.includes("1x1")) {
        if (fullId === 'jog-c6') adj.push('op-c6');
        if (fullId === 'op-c6') adj.push('jog-c6');
    }

    return adj;
}

function obterCriaturaNoSlot(fullId) {
    if (fullId.startsWith('jog-')) return campoJogador[fullId.replace('jog-', '')];
    if (fullId.startsWith('op-')) return window.campoOponente[fullId.replace('op-', '')];
    return null;
}

function setarCriaturaNoSlot(fullId, criatura) {
    if (fullId.startsWith('jog-')) campoJogador[fullId.replace('jog-', '')] = criatura;
    if (fullId.startsWith('op-')) window.campoOponente[fullId.replace('op-', '')] = criatura;
}

window.lidarComCliqueTabuleiro = function(fullId) {
    let criaturaAlvo = obterCriaturaNoSlot(fullId);
    let el = document.getElementById(fullId);
    
    if (!el || el.parentElement.style.display === 'none') return;

    // 🔥 NOVO LOGIC DO CLIQUE INICIAL (Com Equipamento)
    if (!window.slotSelecionadoMovimento) {
        if (criaturaAlvo) {
            if (criaturaAlvo.dono === 'jogador') {
                if (criaturaAlvo.equipamento) {
                    // Tem equipamento? Abre o Modal de Ações pra escolher
                    window.abrirModalAcoesCriatura(fullId, criaturaAlvo);
                } else {
                    // Não tem equipamento? Já puxa direto pro movimento pra ser rápido!
                    window.selecionarParaMovimento(fullId);
                }
            } else if (criaturaAlvo.dono === 'oponente' && criaturaAlvo.equipamento && criaturaAlvo.equipamentoRevelado) {
                // Clicou no oponente e o equipamento tá revelado? Mostra os detalhes
                window.verEquipamentoModal(fullId);
            }
        }
        return;
    }

    let idOrigem = window.slotSelecionadoMovimento;
    let criaturaOrigem = obterCriaturaNoSlot(idOrigem);

    if (idOrigem === fullId) {
        limparDestaquesMovimento();
        window.slotSelecionadoMovimento = null;
        return;
    }

    if (criaturaAlvo && criaturaAlvo.dono === 'jogador') {
        limparDestaquesMovimento();
        window.slotSelecionadoMovimento = fullId;
        destacarAdjacentes(fullId);
        if(window.tocarSFX) window.tocarSFX('notificacao');
        return;
    }

    if (!obterAdjacencias(idOrigem).includes(fullId)) {
        limparDestaquesMovimento();
        window.slotSelecionadoMovimento = null;
        return;
    }

    if (!criaturaAlvo) {
        setarCriaturaNoSlot(fullId, criaturaOrigem); 
        setarCriaturaNoSlot(idOrigem, null); 
        window.mostrarMensagemScanner("Avançando pelo tabuleiro!");
    } else if (criaturaAlvo.dono === 'oponente') {
        window.mostrarMensagemScanner("⚔️ COMBATE INICIADO!");
    }

    limparDestaquesMovimento();
    window.slotSelecionadoMovimento = null;
    atualizarTelaBatalha(); 
}

function destacarAdjacentes(fullId) {
    limparDestaquesMovimento();
    document.getElementById(fullId).classList.add('slot-selecionado');

    obterAdjacencias(fullId).forEach(adjId => {
        let el = document.getElementById(adjId);
        if (el && el.parentElement.style.display !== 'none') {
            let criaturaAlvo = obterCriaturaNoSlot(adjId);
            if (!criaturaAlvo) {
                el.classList.add('slot-livre-movimento'); 
            } else if (criaturaAlvo.dono === 'oponente') {
                el.classList.add('slot-alvo-combate'); 
            }
        }
    });
}

function limparDestaquesMovimento() {
    document.querySelectorAll('.slot-criatura, .zona-central > div').forEach(el => {
        el.classList.remove('slot-selecionado', 'slot-livre-movimento', 'slot-alvo-combate');
    });
}

setTimeout(() => {
    // 🔥 NOVO CSS: Estilos do Equipamento, Ícones Hover e Botões do Modal
    if (!document.getElementById("css-movimento")) {
        let style = document.createElement('style');
        style.id = "css-movimento";
        style.innerHTML = `
            .slot-selecionado { box-shadow: 0 0 20px #ffd700, inset 0 0 10px #ffd700 !important; border-color: #ffd700 !important; transform: scale(1.05); transition: 0.2s; z-index: 100;}
            .slot-livre-movimento { box-shadow: inset 0 0 25px rgba(0,255,0,0.8), 0 0 15px rgba(0,255,0,0.5) !important; border-color: #00ff00 !important; cursor: pointer; transition: 0.2s; z-index: 90;}
            .slot-livre-movimento:hover { background: rgba(0,255,0,0.15); transform: scale(1.02); }
            .slot-alvo-combate { box-shadow: inset 0 0 25px rgba(255,0,0,0.8), 0 0 15px rgba(255,0,0,0.5) !important; border-color: #ff0000 !important; cursor: pointer; transition: 0.2s; z-index: 90;}
            .slot-alvo-combate:hover { background: rgba(255,0,0,0.15); transform: scale(1.02); }
            
            /* CSS DOS EQUIPAMENTOS */
            .mini-card-wrapper { position: relative; }
            .mini-equip-icon { position: absolute; top: -8px; right: -8px; width: 22px; height: 22px; border-radius: 50%; z-index: 50; cursor: help; border: 2px solid #ffd700; display:flex; justify-content:center; align-items:center; }
            .mini-equip-icon.revelado { background-size: cover; background-position: center; }
            .mini-equip-icon.oculto { background: #222; color: #fff; font-weight: bold; font-size: 14px; border-color: #aaa; }
            .equip-tooltip { display: none; position: absolute; bottom: 120%; left: 50%; transform: translateX(-50%); width: 130px; background: rgba(0,10,0,0.95); border: 1px solid #4CAF50; color: white; text-align: center; font-size: 9px; padding: 6px; border-radius: 5px; pointer-events: none; z-index: 200; line-height: 1.3; }
            .mini-equip-icon:hover .equip-tooltip { display: block; }
            
            /* CSS DOS BOTÕES DO MODAL */
            .btn-acao-modal { background: #112211; border: 1px solid #4CAF50; color: white; padding: 10px; border-radius: 5px; cursor: pointer; font-weight: bold; width: 100%; transition: 0.2s; }
            .btn-acao-modal:hover { background: #4CAF50; color: black; }
            .btn-acao-modal.btn-mover { border-color: #00bcd4; color: #00bcd4; }
            .btn-acao-modal.btn-mover:hover { background: #00bcd4; color: black; }
            .btn-acao-modal.btn-revelar { border-color: #ffd700; color: #ffd700; }
            .btn-acao-modal.btn-revelar:hover { background: #ffd700; color: black; }
            .btn-acao-modal.btn-cancelar { border-color: #e53935; color: #e53935; margin-top: 10px; }
            .btn-acao-modal.btn-cancelar:hover { background: #e53935; color: white; }
        `;
        document.head.appendChild(style);
    }

    let zonas = document.querySelectorAll('.zona-central');
    if (zonas) zonas.forEach(z => z.style.pointerEvents = "none"); 

    ['jog', 'op'].forEach(lado => {
        ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'].forEach(slot => {
            let el = document.getElementById(`${lado}-${slot}`);
            if (el) {
                if (el.parentElement) el.parentElement.style.pointerEvents = "none";
                el.style.pointerEvents = "auto";
                
                el.onclick = (e) => {
                    e.stopPropagation(); 
                    window.lidarComCliqueTabuleiro(`${lado}-${slot}`);
                };
            }
        });
    });
}, 1000);
