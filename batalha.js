// ==========================================
// MOTOR DA MINI-CARTA (DROME PRO 2.0)
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

    // Heptágonos individuais removidos da mini-carta

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
                        <div class="mini-el ${elems.includes('Fogo') ? 'fogo' : ''}"></div>
                        <div class="mini-el ${elems.includes('Ar') ? 'ar' : ''}"></div>
                        <div class="mini-el ${elems.includes('Terra') ? 'terra' : ''}"></div>
                        <div class="mini-el ${elems.includes('Agua') ? 'agua' : ''}"></div>
                    </div>
                </div>

                </div>
        </div>
    `;
}

// ==========================================
// SISTEMA DE CONTADOR INTELIGENTE
// ==========================================

// 1. O "Cérebro" do seu tabuleiro (Apenas simulando Johnes no C2 para teste)
let campoJogador = {
    c1: null,
    c2: {
        nome: "Johnes",
        tribo: "Azul",
        elementos: ["Terra"],
        cartaBlank: "cartas/criaturas/azul/johnes.jpg",
        statsMax: { coragem: 50, poder: 40, sabedoria: 60, velocidade: 30, energia: 45 },
        hpAtual: 45, // Adicionamos hpAtual explicitamente para a barra de vida funcionar
        fichasHabilidade: 2 // Contadores atuais
    },
    c3: null, c4: null, c5: null, c6: null
};

// Função para atualizar a tela inteira (incluindo o contador)
function atualizarTelaBatalha() {
    // A. Desenha as cartas nos slots
    const slots = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
    slots.forEach(slotId => {
        const el = document.getElementById('jog-' + slotId);
        if(el) el.innerHTML = desenharMiniCarta(campoJogador[slotId]);
    });

    // B. Desenha os slots vazios do oponente (para teste)
    const slotsOp = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
    slotsOp.forEach(slotId => {
        const el = document.getElementById('op-' + slotId);
        if(el) el.innerHTML = desenharMiniCarta(null);
    });

    // C. Calcula e desenha o Contador Inteligente
    atualizarContadorFichasHabilidade();
}

// Calcula o total de contadores e atualiza o botão na lateral
function atualizarContadorFichasHabilidade() {
    // Insere o elemento HTML do botão na zona lateral, se ainda não existir
    const zonaLateral = document.querySelector('.lado-jogador .zona-lateral');
    if(zonaLateral && !document.getElementById('btn-contador-habilidade')) {
        const btnHTML = `
            <button class="btn-total-fichas" id="btn-contador-habilidade">
                <div class="mini-contador-heptagono"></div>
                <span id="txt-fichas-habilidade">Fichas: </span>
                <span class="total-number" id="valor-total-fichas">0</span>
            </button>
        `;
        // Insere no topo da zona lateral
        zonaLateral.insertAdjacentHTML('afterbegin', btnHTML);
        
        // Adiciona o evento de clique para abrir o modal
        document.getElementById('btn-contador-habilidade').addEventListener('click', abrirModalFichas);
    }

    // Soma as fichas de todas as criaturas no campo
    let totalFichas = 0;
    Object.values(campoJogador).forEach(criatura => {
        if(criatura && criatura.fichasHabilidade) {
            totalFichas += criatura.fichasHabilidade;
        }
    });

    // Atualiza o valor no botão
    const elValor = document.getElementById('valor-total-fichas');
    if(elValor) elValor.textContent = totalFichas;
}

// --------------------------------------------------
// SISTEMA DE MODAL DETALHADO
// --------------------------------------------------

// Gera a lista detalhada e abre o modal
function abrirModalFichas() {
    let listaHTML = '';
    
    // Itera sobre o campo para ver quem tem ficha
    Object.values(campoJogador).forEach(c => {
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

    // Se não tiver ninguém no campo
    if(listaHTML === '') listaHTML = '<p style="color:#aaa; text-align:center;">Sem criaturas em campo.</p>';

    // Cria o HTML do modal e insere na tela do Drome
    const modalHTML = `
        <div class="modal-overlay" id="overlay-fichas">
            <div class="modal-content-fichas">
                <span class="fechar-modal-fichas" id="fechar-modal-fichas">×</span>
                <h3>DETALHES DE FICHAS</h3>
                <div class="fichas-lista">
                    ${listaHTML}
                </div>
            </div>
        </div>
    `;

    document.getElementById('tela-batalha').insertAdjacentHTML('beforeend', modalHTML);

    // Eventos para fechar o modal
    document.getElementById('fechar-modal-fichas').addEventListener('click', fecharModalFichas);
    document.getElementById('overlay-fichas').addEventListener('click', function(e) {
        if(e.target === this) fecharModalFichas();
    });
}

function fecharModalFichas() {
    const el = document.getElementById('overlay-fichas');
    if(el) el.remove();
}


// --------------------------------------------------
// TESTE PRÁTICO: Rodando a simulação
// --------------------------------------------------
// O setTimeout garante que o HTML carregou
setTimeout(atualizarTelaBatalha, 500);
