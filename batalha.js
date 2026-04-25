// ==========================================

// CONFIGURAÇÕES DE DESIGN (COLOQUE SUA IMAGEM DO VERSO AQUI)

// ==========================================

const URL_FUNDO_CARTA = 'cartas/verso.jpg'; 



// ==========================================

// MOTOR DA MINI-CARTA (DROME PRO 2.1 - ELEMENTOS ESCONDIDOS E EQUIPAMENTOS)

// ==========================================

function desenharMiniCarta(criaturaObj) {

    let img = "";

    let hpAtual = 0;

    let c = 0, p = 0, s = 0, v = 0;

    let pct = 0;

    let corHp = '#444';

    let triboClass = ""; 

    let htmlEquipamento = ""; 

    

    // Preparando as luzes dos elementos

    let temFogo = false, temAgua = false, temTerra = false, temAr = false;



    if (criaturaObj) {

        img = criaturaObj.cartaBlank; 

        

        let hpMax = criaturaObj.hpMax || criaturaObj.statsMax?.energia || 0;

        hpAtual = criaturaObj.hpAtual !== undefined ? criaturaObj.hpAtual : hpMax;

        

        c = criaturaObj.coragem || criaturaObj.statsMax?.coragem || 0;

        p = criaturaObj.poder || criaturaObj.statsMax?.poder || 0;

        s = criaturaObj.sabedoria || criaturaObj.statsMax?.sabedoria || 0;

        v = criaturaObj.velocidade || criaturaObj.statsMax?.velocidade || 0;

        

        // 🔥 O LEITOR UNIVERSAL DE ELEMENTOS (À prova de falhas)

        let elemsBrutos = criaturaObj.elementos;

        

        // Se o inventário antigo do cara não salvou os elementos, busca direto na fonte (cartas.js)

        if ((!elemsBrutos || elemsBrutos.length === 0) && typeof MONSTROS !== 'undefined') {

            let dbCarta = MONSTROS.find(m => m.nome === criaturaObj.nome);

            if (dbCarta && dbCarta.elementos) elemsBrutos = dbCarta.elementos;

        }



        // O Truque: Transforma QUALQUER coisa num texto minúsculo sem acento

        let textoElementos = JSON.stringify(elemsBrutos || "").toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");

        

        // Agora ele acha fácil, seja "Fogo", "fogo", ["Fogo"], etc.

        temFogo = textoElementos.includes('fogo');

        temAgua = textoElementos.includes('agua');

        temTerra = textoElementos.includes('terra');

        temAr = textoElementos.includes('ar');

        

        const triboMap = {'Azul': 'tribo-azul', 'Vermelho': 'tribo-vermelho', 'Amarelo': 'tribo-amarelo', 'Verde': 'tribo-verde', 'Ciano': 'tribo-ciano', 'Cinza': 'tribo-cinza'};

        triboClass = triboMap[criaturaObj.tribo] || 'tribo-cinza';



        pct = Math.max(0, Math.min(100, (hpAtual / hpMax) * 100));

        corHp = 'lime';

        if (pct <= 50) corHp = 'orange';

        if (pct <= 20) corHp = 'red';



        if (criaturaObj.equipamento) {

            if (criaturaObj.equipamentoRevelado) {

                htmlEquipamento = `

                    <div class="mini-equip-icon revelado" style="background-image: url('${criaturaObj.equipamento.img}')">

                        <div class="equip-tooltip"><b>${criaturaObj.equipamento.nome}</b><br>${criaturaObj.equipamento.efeito || 'Sem efeito'}</div>

                    </div>

                `;

            } else {

                let textoTooltip = criaturaObj.dono === 'jogador' ? 'Oponente não pode ver' : 'Você não pode ver';

                htmlEquipamento = `

                    <div class="mini-equip-icon oculto">

                        ?

                        <div class="equip-tooltip"><b>Equipamento Oculto</b><br>${textoTooltip}</div>

                    </div>

                `;

            }

        }

    }



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

// SISTEMA DE CONTADOR INTELIGENTE, CARGA DE DECK E COMPRA DE MÃO 🔥

// ==========================================



let campoJogador = { c1: null, c2: null, c3: null, c4: null, c5: null, c6: null };

window.baralhoAtaques = []; 

window.maoAtaques = [];     

window.jogadorMugics = []; 



function embaralharArray(array) {

    let arr = [...array];

    for (let i = arr.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [arr[i], arr[j]] = [arr[j], arr[i]];

    }

    return arr;

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

window.carregarDeckParaBatalha = function(salaId, souP1) {

    campoJogador = { c1: null, c2: null, c3: null, c4: null, c5: null, c6: null };

    window.campoOponente = { c1: null, c2: null, c3: null, c4: null, c5: null, c6: null };

    window.slotSelecionadoMovimento = null;

    window.jogadorMugics = []; 

    window.lixoAtaques = []; 

    window.lixoAtaquesOponente = 0; 

    window.cemiterio = [];

    window.cemiterioOponente = [];



    if (typeof limparDestaquesMovimento === "function") limparDestaquesMovimento();



    let deck = window.estadoDrome.deckSelecionado;

    if (!deck || !deck.criaturas) return;



    // 1. CARREGA O SEU DECK (P1 ou P2 local)

    if (deck.ataques && deck.ataques.length > 0) {

        window.baralhoAtaques = embaralharArray(deck.ataques); 

        window.maoAtaques = window.baralhoAtaques.splice(0, 3); 

    } else {

        window.baralhoAtaques = [];

        window.maoAtaques = [];

    }



    if (deck.mugics && deck.mugics.length > 0) {

        deck.mugics.forEach(idMagia => {

            if (idMagia) {

                let magiaReal = window.inventario.find(c => c.id == idMagia);

                if (magiaReal) window.jogadorMugics.push(magiaReal);

            }

        });

    }



    let chaves = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];

    

    chaves.forEach((chave, index) => {

        let idCarta = deck.criaturas[index]; 

        let idEquip = deck.equipamentos ? deck.equipamentos[index] : null; 

        

        if (idCarta) {

            let cartaOriginal = window.inventario.find(c => c.id == idCarta);

            let equipOriginal = idEquip ? window.inventario.find(c => c.id == idEquip) : null; 

            

            if (cartaOriginal) {

                let fichasReais = 0;

                let temEfeitoReal = false;

                let textoCartaReal = "";



                if (typeof MONSTROS !== 'undefined') {

                    let cartaDB = MONSTROS.find(m => m.nome === cartaOriginal.nome);

                    if (cartaDB) {

                        if (cartaDB.fichasHabilidade !== undefined) fichasReais = parseInt(cartaDB.fichasHabilidade);

                        temEfeitoReal = cartaDB.temEfeito || false;

                        textoCartaReal = cartaDB.textoCarta || "";

                    }

                }



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

                    fichasHabilidade: fichasReais,

                    temEfeito: temEfeitoReal,

                    textoCarta: textoCartaReal,

                    equipamento: equipOriginal ? { nome: equipOriginal.nome, img: equipOriginal.img, efeito: equipOriginal.efeito } : null,

                    equipamentoRevelado: false

                };

            }

        }

    });



    // 2. PUXA O DECK DO OPONENTE DA NUVEM (O Handshake)

    window.montarDeckOponente = function(deckOp) {

        if (!deckOp) return;

        

        // Se for bot (Modo Simulado), o deckOp é apenas os IDs numéricos. Então chamamos o tradutor!

        if (!deckOp.criaturas_objs && typeof window.expandirDeckParaOnline === "function") {

            deckOp = window.expandirDeckParaOnline(deckOp);

        }



        chaves.forEach((chave, index) => {

            let cartaOp = deckOp.criaturas_objs[index];

            let equipOp = deckOp.equipamentos_objs ? deckOp.equipamentos_objs[index] : null;

            

            if (cartaOp) {

                let fichasReais = 0;

                let temEfeitoReal = false;

                let textoCartaReal = "";



                if (typeof MONSTROS !== 'undefined') {

                    let cartaDB = MONSTROS.find(m => m.nome === cartaOp.nome);

                    if (cartaDB) {

                        if (cartaDB.fichasHabilidade !== undefined) fichasReais = parseInt(cartaDB.fichasHabilidade);

                        temEfeitoReal = cartaDB.temEfeito || false;

                        textoCartaReal = cartaDB.textoCarta || "";

                    }

                }



                window.campoOponente[chave] = {

                    dono: 'oponente',

                    nome: cartaOp.nome,

                    tribo: cartaOp.tribo || "Azul",

                    elementos: cartaOp.elementos || [],

                    cartaBlank: cartaOp.img,

                    statsMax: { 

                        coragem: cartaOp.stats?.c || 0, 

                        poder: cartaOp.stats?.p || 0, 

                        sabedoria: cartaOp.stats?.s || 0, 

                        velocidade: cartaOp.stats?.v || 0, 

                        energia: cartaOp.stats?.e || 0 

                    },

                    hpAtual: cartaOp.stats?.e || 0,

                    fichasHabilidade: fichasReais,

                    temEfeito: temEfeitoReal,

                    textoCarta: textoCartaReal,

                    equipamento: equipOp ? { nome: equipOp.nome, img: equipOp.img, efeito: equipOp.efeito } : null,

                    equipamentoRevelado: false

                };

            }

        });



        // Configura o tamanho da mão e do baralho inimigo com base nos dados reais dele!

        window.qtdBaralhoOponente = deckOp.ataques_objs ? deckOp.ataques_objs.length : 20;

        window.qtdMaoOponente = 3;

        window.qtdBaralhoOponente -= 3; // Retira 3 para a mão inicial



        atualizarTelaBatalha(); 

        

       // 🌐 GRAVA OS DADOS DA SALA ONLINE E LIGA O RÁDIO DE TURNOS!

        if (salaId && salaId !== "sala_simulada") {

            window.salaBatalhaAtual = salaId;

            window.souP1Batalha = souP1;

            window.iniciarEscutaDeTurnoOnline(); // Rádio 1: Escuta os Turnos e o Jokenpo!

            if (typeof window.iniciarEscutaAcoesOnline === 'function') {

                window.iniciarEscutaAcoesOnline(); // Rádio 2: Escuta os movimentos e as magias!

            }

            if (typeof window.iniciarEscutaAcoesOnline === 'function') {

                window.iniciarEscutaAcoesOnline(); // Rádio 2: Escuta os movimentos de tabuleiro!

            } 

        }

        

        // CHAMA O JOKENPO PRA TODO MUNDO (Bot ou Online)!

        setTimeout(() => { window.abrirJokenpo(); }, 800); 

    };



    // CONEXÃO COM O SERVIDOR

    if (salaId && salaId !== "sala_simulada") {

        window.mostrarMensagemScanner("📡 Conectando ao oponente...");

        

        // Fica escutando a sala para baixar o deck do oponente assim que ele soltar na rede

        window._dbGet('salas_drome/' + salaId).then(snap => {

            let sala = snap.val();

            let deckInimigo = souP1 ? sala.p2.deck : sala.p1.deck;

            

            // O Jogador 1 pode ter entrado frações de segundo antes do Jogador 2 colocar o deck.

            if (!deckInimigo) {

                window.mostrarMensagemScanner("Aguardando sincronização do oponente...");

                // Escuta até a rede dizer "status pronta" e o P2 jogar o deck

                window._dbOn('salas_drome/' + salaId, snapEspera => {

                    let s = snapEspera.val();

                    if (s && s.status === "pronta") {

                        let deckAtualizado = souP1 ? s.p2.deck : s.p1.deck;

                        if (deckAtualizado) {

                            window.mostrarMensagemScanner("⚡ Sinal interceptado! Carregando monstros...");

                            window.montarDeckOponente(deckAtualizado);

                        }

                    }

                });

            } else {

                window.mostrarMensagemScanner("⚡ Sinal interceptado! Carregando monstros...");

                window.montarDeckOponente(deckInimigo);

            }

        });

    } else {

        // Se não tiver amigo online, roda a partida Treino Simulado como sempre

        window.mostrarMensagemScanner("Simulando batalha...");

        window.montarDeckOponente(window.estadoDrome.deckSelecionado);

    }

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

    atualizarDecksEMaoCards(); 

    atualizarMugicsDaTela(); 

}



function atualizarMugicsDaTela() {

    let slotsJogador = document.querySelectorAll('.lado-jogador .hex-mugic');

    slotsJogador.forEach((slot, index) => {

        let mugic = window.jogadorMugics[index];

        if (mugic) {

            slot.style.backgroundImage = `url('${mugic.img}')`;

            slot.style.backgroundSize = 'cover';

            slot.style.backgroundPosition = 'center';

            slot.style.cursor = 'pointer';

            slot.onclick = () => window.verMugicModal(index);

        } else {

            slot.style.backgroundImage = 'none';

            slot.style.cursor = 'default';

            slot.onclick = null;

        }

    });



    let slotsOponente = document.querySelectorAll('.lado-oponente .hex-mugic');

    slotsOponente.forEach((slot) => {

        slot.style.backgroundImage = `url('${URL_FUNDO_CARTA}')`;

        slot.style.backgroundSize = 'cover';

        slot.style.backgroundPosition = 'center';

    });

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



    if(!window.campoOponente) window.campoOponente = { c1: null, c2: null, c3: null, c4: null, c5: null, c6: null };



    let totalJogador = 0;

    let totalOponente = 0;

    

    let todasAsCartas = [...Object.values(campoJogador), ...Object.values(window.campoOponente)];



    todasAsCartas.forEach(c => { 

        if (c && c.fichasHabilidade) {

            if (c.dono === 'jogador') totalJogador += c.fichasHabilidade;

            else if (c.dono === 'oponente') totalOponente += c.fichasHabilidade;

        }

    });



    renderizarBotaoFichas('.lado-jogador', 'jogador', totalJogador);

    renderizarBotaoFichas('.lado-oponente', 'oponente', totalOponente);

}



function abrirModalFichas(ladoId) {

    let listaHTML = '';

    const tituloModal = ladoId === 'oponente' ? 'FICHAS DO OPONENTE' : 'MINHAS FICHAS';

    

    let todasAsCartas = [...Object.values(campoJogador), ...Object.values(window.campoOponente)];

    

    todasAsCartas.forEach(c => {

        if (c && c.dono === ladoId) {

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

    document.getElementById('overlay-fichas').addEventListener('click', function(e) { if(e.target === this) fecharModalFichas(); });

}



function fecharModalFichas() {

    const el = document.getElementById('overlay-fichas');

    if(el) el.remove();

}



window.abrirModalAcoesCriatura = function(fullId, criatura) {

    if (document.getElementById('overlay-acoes')) return;



    let botoesHTML = "";

    let emCombate = window.estadoCombate && window.estadoCombate.ativo;



    if (!emCombate && !criatura.moveuNesteTurno) {

        botoesHTML += `<button class="btn-acao-modal btn-mover" onclick="window.selecionarParaMovimento('${fullId}')">Prepara para Mover</button>`;

    } else if (!emCombate && criatura.moveuNesteTurno) {

        botoesHTML += `<p style="font-size: 10px; color: #ff9800; margin-bottom: 10px;">Esta criatura já se moveu neste turno.</p>`;

    } else if (emCombate) {

        botoesHTML += `<p style="font-size: 10px; color: #ff9800; margin-bottom: 10px;">Movimento bloqueado durante o Combate!</p>`;

    }



    let textoMinusculo = (criatura.textoCarta || "").toLowerCase();

    let habilidadeAtiva = textoMinusculo.includes('descarte') || textoMinusculo.includes('gaste') || textoMinusculo.includes('ficha');

    

    if (criatura.temEfeito && habilidadeAtiva && criatura.fichasHabilidade > 0) {

        botoesHTML += `<button class="btn-acao-modal" style="border-color: #ff9800; color: #ff9800;" onclick="window.usarHabilidade('${fullId}')">Usar Habilidade</button>`;

    }



    if (criatura.fichasHabilidade > 0) {

        botoesHTML += `<button class="btn-acao-modal" style="border-color: #00bcd4; color: #00bcd4;" onclick="window.prepararMugic('${fullId}')">Usar Mugic</button>`;

    }



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

            <div class="modal-content-fichas" style="text-align:center; max-height: 90vh; overflow-y: auto;">

                <h3 style="color:#4CAF50;margin-bottom:5px;">${criatura.nome}</h3>

                

                <div onclick="window.ampliarCartaClicada('${criatura.cartaBlank}', '${fullId}')" style="width:140px;height:200px;margin:0 auto 10px auto;background-image:url('${criatura.cartaBlank}');background-size:cover;background-position:center;border:2px solid #4CAF50;border-radius:10px;box-shadow: 0 0 15px rgba(76, 175, 80, 0.4); cursor: pointer;">

                    <div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; opacity: 0; background: rgba(0,0,0,0.5); border-radius: 8px; transition: 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0'">

                        <span style="color: white; font-weight: bold; font-size: 12px;">🔍 AMPLIAR</span>

                    </div>

                </div>

                

                <p style="font-size:14px; color:#ffd700; margin-bottom:5px;">Fichas Atuais: <b style="font-size:18px;">${criatura.fichasHabilidade}</b></p>

                <p style="font-size:10px;color:#aaa;margin-bottom:15px;line-height:1.3;">${criatura.textoCarta || 'Sem efeito especial.'}</p>

                

                <div style="display:flex;flex-direction:column;gap:10px;">

                    ${botoesHTML}

                </div>

            </div>

        </div>

    `;



    document.getElementById('tela-batalha').insertAdjacentHTML('beforeend', modalHTML);

    

    // 🔥 CORREÇÃO DO "CLIQUE FANTASMA" NO CELULAR 🔥

    // Deixa a janela intocável por 350ms para ignorar o "rastro" do toque na tela

    let modalOpcoes = document.getElementById('overlay-acoes');

    if (modalOpcoes) {

        modalOpcoes.style.pointerEvents = 'none';

        setTimeout(() => { modalOpcoes.style.pointerEvents = 'auto'; }, 350);

    }

    

    document.getElementById('overlay-acoes').addEventListener('click', function(e) { if(e.target === this) fecharModalAcoes(); });

};



// 🔥 FUNÇÃO NOVA E TURBINADA: Amplia a carta com HUD de Batalha!

window.ampliarCartaClicada = function(imgUrl, fullId) {

    let overlayHTML = "";

    let corBorda = "rgba(76, 175, 80, 0.8)"; // Verde base



    // Se o jogo souber quem é a criatura (veio do tabuleiro), cria o HUD!

    if (fullId) {

        let criatura = obterCriaturaNoSlot(fullId);

        if (criatura) {

            corBorda = criatura.dono === 'jogador' ? "#4CAF50" : "#e53935"; // Verde ou Vermelho

            let hpMax = criatura.hpMax || criatura.statsMax?.energia || 0;

            let hpAtual = criatura.hpAtual !== undefined ? criatura.hpAtual : hpMax;

            let pct = Math.max(0, Math.min(100, (hpAtual / hpMax) * 100));

            let corHp = pct > 50 ? 'lime' : pct > 20 ? 'orange' : 'red';

            

            let c = criatura.coragem || criatura.statsMax?.coragem || 0;

            let p = criatura.poder || criatura.statsMax?.poder || 0;

            let s = criatura.sabedoria || criatura.statsMax?.sabedoria || 0;

            let v = criatura.velocidade || criatura.statsMax?.velocidade || 0;



            overlayHTML = `

                <div style="position: absolute; bottom: -25px; left: 50%; transform: translateX(-50%); width: 95%; max-width: 350px; background: rgba(0,0,0,0.9); border: 2px solid ${corBorda}; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 0 25px black;">

                    <div style="width: 100%; background: #222; height: 18px; border-radius: 8px; overflow: hidden; position: relative; border: 1px solid #555;">

                        <div style="width: ${pct}%; background: ${corHp}; height: 100%; transition: width 0.3s;"></div>

                        <span style="position: absolute; top:0; left:0; width:100%; text-align:center; font-size: 13px; font-weight: bold; color: white; line-height: 18px; text-shadow: 0 0 4px black, 0 0 4px black;">HP: ${hpAtual} / ${hpMax}</span>

                    </div>

                    <div style="display: flex; justify-content: space-around; font-size: 18px; color: white; font-family: monospace; font-weight: bold; text-shadow: 0 0 5px black;">

                        <span>❤️ ${c}</span>

                        <span>⚡ ${p}</span>

                        <span>👁️ ${s}</span>

                        <span>💨 ${v}</span>

                    </div>

                </div>

            `;

        }

    }



    const modalAmpliadoHTML = `

        <div class="modal-overlay" id="overlay-carta-ampliada" style="z-index: 1000000; background: rgba(0,0,0,0.9); display: flex; justify-content: center; align-items: center; flex-direction: column;" onclick="this.remove()">

            <div style="position: relative; display: flex; justify-content: center; align-items: center; margin-bottom: 20px;">

                <img src="${imgUrl}" style="max-width: 95vw; max-height: 75vh; border-radius: 15px; box-shadow: 0 0 30px ${corBorda};">

                ${overlayHTML}

            </div>

            <p style="color: #aaa; font-size: 12px; font-family: monospace; margin-top: 15px;">Toque em qualquer lugar para fechar</p>

        </div>

    `;

    document.body.insertAdjacentHTML('beforeend', modalAmpliadoHTML);

};



window.fecharModalAcoes = function() {

    const el = document.getElementById('overlay-acoes');

    if(el) el.remove();

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



window.verMugicModal = function(index) {

    let mugic = window.jogadorMugics[index];

    if (!mugic) return;

    

    const modalHTML = `

        <div class="modal-overlay" id="overlay-ver-mugic">

            <div class="modal-content-fichas" style="text-align:center; border: 2px solid #00bcd4;">

                <span class="fechar-modal-fichas" onclick="document.getElementById('overlay-ver-mugic').remove()">×</span>

                <h3 style="color:#00bcd4;margin-bottom:15px;">Magia (Mugic)</h3>

                <div style="width:120px;height:170px;margin:0 auto 15px auto;background-image:url('${mugic.img}');background-size:cover;background-position:center;border:2px solid #00bcd4;border-radius:8px;box-shadow: 0 0 15px rgba(0,188,212,0.5);"></div>

                <h4 style="color:#fff;margin-bottom:5px;">${mugic.nome}</h4>

                <p style="font-size:11px;color:#ccc;line-height:1.4;">${mugic.efeito || 'Use suas fichas de habilidade para conjurar.'}</p>

                

                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px;">

                    <button class="btn-acao-modal" style="background:#e53935;color:#fff;border:none;flex:1;" onclick="window.descartarMugic(${index})">USAR E DESCARTAR</button>

                    <button class="btn-acao-modal" style="background:#555;color:#fff;border:none;flex:1;" onclick="document.getElementById('overlay-ver-mugic').remove()">FECHAR</button>

                </div>

            </div>

        </div>

    `;

    document.getElementById('tela-batalha').insertAdjacentHTML('beforeend', modalHTML);

}



// 🔥 FUNÇÃO NOVA QUE JOGA A MAGIA NO LIXO

window.descartarMugic = function(index) {

    let mugic = window.jogadorMugics[index];

    if (mugic) {

        if (!window.cemiterio) window.cemiterio = [];

        window.cemiterio.push(mugic.id); // Manda pro lixo permanente

        window.jogadorMugics[index] = null; // Tira do slot heptagonal da tela

        

        document.getElementById('overlay-ver-mugic').remove();

        window.mostrarMensagemScanner(`✨ Mugic ${mugic.nome} ativado e enviado para o Lixo!`);

        if(window.tocarSFX) window.tocarSFX('notificacao');

        

        atualizarMugicsDaTela();

        atualizarDecksEMaoCards(); // Sobe o número do lixo

    }

};



window.ajustarTabuleiroBatalha = function(modo) {

    let opZona = document.querySelector('.lado-oponente .zona-central');

    let jogZona = document.querySelector('.lado-jogador .zona-central');



    let opLinha3 = document.getElementById('op-c1').parentElement; 

    let opLinha2 = document.getElementById('op-c4').parentElement; 

    let opLinha1 = document.getElementById('op-c6').parentElement; 

    let jogLinha3 = document.getElementById('jog-c1').parentElement; 

    let jogLinha2 = document.getElementById('jog-c4').parentElement; 

    let jogLinha1 = document.getElementById('jog-c6').parentElement; 

    

    let opMugics = document.querySelectorAll('.lado-oponente .hex-mugic');

    let jogMugics = document.querySelectorAll('.lado-jogador .hex-mugic');



    let jogDecksBottom = document.querySelectorAll('.lado-jogador .zona-lateral > div[style*="bottom: 0"]');

    let opDecksBottom = document.querySelectorAll('.lado-oponente .zona-lateral > div[style*="bottom: 0"]');



    let contadoresJog = document.querySelector('.lado-jogador .container-fichas-js')?.parentElement;

    let contadoresOp = document.querySelector('.lado-oponente .container-fichas-js')?.parentElement;



    if (modo === "6x6") {

        opLinha3.style.display = "flex"; opLinha2.style.display = "flex"; opLinha1.style.display = "flex";

        jogLinha3.style.display = "flex"; jogLinha2.style.display = "flex"; jogLinha1.style.display = "flex";

        opMugics.forEach(m => m.style.display = "block");

        jogMugics.forEach(m => m.style.display = "block");



        if(jogZona) jogZona.style.transform = "translateY(-71px)";

        if(opZona) opZona.style.transform = "translateY(-71px)"; 

        

        jogDecksBottom.forEach(el => el.style.transform = "translateY(15px)"); 

        opDecksBottom.forEach(el => el.style.transform = "translateY(15px)");



        if(contadoresJog) contadoresJog.style.transform = "translateY(-80px)";

        if(contadoresOp) contadoresOp.style.transform = "translateY(-80px)";

    } 

    else if (modo === "3x3") {

        opLinha3.style.display = "none"; opLinha2.style.display = "flex"; opLinha1.style.display = "flex";

        jogLinha3.style.display = "none"; jogLinha2.style.display = "flex"; jogLinha1.style.display = "flex";

        opMugics.forEach((m, i) => m.style.display = i >= 3 ? "none" : "block");

        jogMugics.forEach((m, i) => m.style.display = i >= 3 ? "none" : "block");



        if(jogZona) jogZona.style.transform = "translateY(-124px)"; 

        if(opZona) opZona.style.transform = "translateY(-124px)";

        

        jogDecksBottom.forEach(el => el.style.transform = "translateY(15px)"); 

        opDecksBottom.forEach(el => el.style.transform = "translateY(15px)"); 

        

        if(contadoresJog) contadoresJog.style.transform = "translateY(-80px)"; 

        if(contadoresOp) contadoresOp.style.transform = "translateY(-80px)"; 

    } 

    else if (modo && modo.includes("1x1")) {

        opLinha3.style.display = "none"; opLinha2.style.display = "none"; opLinha1.style.display = "flex";

        jogLinha3.style.display = "none"; jogLinha2.style.display = "none"; jogLinha1.style.display = "flex";

        opMugics.forEach((m, i) => m.style.display = i >= 1 ? "none" : "block");

        jogMugics.forEach((m, i) => m.style.display = i >= 1 ? "none" : "block");



        if(jogZona) jogZona.style.transform = "translateY(-176px)";

        if(opZona) opZona.style.transform = "translateY(-176px)";

        

        jogDecksBottom.forEach(el => el.style.transform = "translateY(15px)");

        opDecksBottom.forEach(el => el.style.transform = "translateY(15px)");



        if(contadoresJog) contadoresJog.style.transform = "translateY(-80px)";

        if(contadoresOp) contadoresOp.style.transform = "translateY(-80px)";

    }

}



setTimeout(atualizarTelaBatalha, 500);



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



window.modoAlvo = null; // Guarda o que você está mirando

window.conjuradorMugicAtual = null; // Guarda quem vai lançar a magia



window.lidarComCliqueTabuleiro = function(fullId) {

    // 🔥 1. INTERCEPTADOR DE ALVOS (MIRA HOLOGRÁFICA) 🔥

    if (window.modoAlvo) {

        let alvo = obterCriaturaNoSlot(fullId);

        if (!alvo) { window.modoAlvo = null; window.mostrarMensagemScanner("Mira desativada."); return; }

        

        let ctx = window.modoAlvo;

        window.modoAlvo = null; 

        let conjurador = obterCriaturaNoSlot(ctx.origem);

        if (!conjurador || conjurador.fichasHabilidade <= 0) return;



        conjurador.fichasHabilidade -= 1; 

        atualizarTelaBatalha();



        if (ctx.tipo === 'habilidade') {

            let acao = { dono: conjurador.dono, nomeAcao: `Habilidade de ${conjurador.nome} ➔ ${alvo.nome}`, tipo: 'habilidade', executar: function() { window.mostrarMensagemScanner(`⚡ Efeito ativado em ${alvo.nome}!`); if(window.tocarSFX) window.tocarSFX('notificacao'); } };

            window.adicionarAoBurst(acao);

        } else if (ctx.tipo === 'mugic') {

            if (!window.cemiterio) window.cemiterio = [];

            window.cemiterio.push(ctx.mugicObj.id); 

            window.jogadorMugics[ctx.mugicIndex] = null;

            atualizarMugicsDaTela(); atualizarDecksEMaoCards();

            let acao = { dono: 'jogador', nomeAcao: `Mugic: ${ctx.mugicObj.nome} ➔ ${alvo.nome}`, tipo: 'mugic', executar: function() { window.mostrarMensagemScanner(`✨ Mugic explodiu em ${alvo.nome}!`); if(window.tocarSFX) window.tocarSFX('notificacao'); } };

            window.adicionarAoBurst(acao);

        }

        return;

    }



    // 🔥 O CADEADO: Permite clicar no turno inimigo APENAS se estiver no Burst!

    if (window.estadoTurno.jogadorAtual !== 'jogador' && !window.aguardandoResposta) return;



    let criaturaAlvo = obterCriaturaNoSlot(fullId);

    let el = document.getElementById(fullId);

    if (!el || el.parentElement.style.display === 'none') return;



    if (!window.slotSelecionadoMovimento) {

        if (criaturaAlvo) {

            if (criaturaAlvo.dono === 'jogador') { window.abrirModalAcoesCriatura(fullId, criaturaAlvo); } 

            else if (criaturaAlvo.dono === 'oponente') {

                if (criaturaAlvo.equipamento && criaturaAlvo.equipamentoRevelado) window.verEquipamentoModal(fullId);

                else if (typeof window.ampliarCartaClicada === 'function') window.ampliarCartaClicada(criaturaAlvo.cartaBlank, fullId);

            }

        }

        return;

    }



    // 🔥 TRAVA: Não deixa arrastar/mover carta se a corrente estiver aberta

    if (window.aguardandoResposta) {

        window.mostrarMensagemScanner("Ação inválida. Resolva a Corrente primeiro!");

        limparDestaquesMovimento(); window.slotSelecionadoMovimento = null; return;

    }



    let idOrigem = window.slotSelecionadoMovimento;

    let criaturaOrigem = obterCriaturaNoSlot(idOrigem);



    if (idOrigem === fullId) { limparDestaquesMovimento(); window.slotSelecionadoMovimento = null; return; }



    if (criaturaAlvo && criaturaAlvo.dono === 'jogador') {

        if (criaturaAlvo.moveuNesteTurno) { window.mostrarMensagemScanner("Já agiu neste turno!"); limparDestaquesMovimento(); window.slotSelecionadoMovimento = null; return; }

        limparDestaquesMovimento(); window.slotSelecionadoMovimento = fullId; destacarAdjacentes(fullId); if(window.tocarSFX) window.tocarSFX('notificacao'); return;

    }



    if (!obterAdjacencias(idOrigem).includes(fullId)) { limparDestaquesMovimento(); window.slotSelecionadoMovimento = null; return; }



    if (!criaturaAlvo) {

        setarCriaturaNoSlot(fullId, criaturaOrigem); setarCriaturaNoSlot(idOrigem, null); criaturaOrigem.moveuNesteTurno = true; window.mostrarMensagemScanner("Avançando!");

        if (typeof window.enviarAcaoRede === 'function') window.enviarAcaoRede({ tipo: 'mover', origem: idOrigem, destino: fullId });

    } else if (criaturaAlvo.dono === 'oponente') {

        criaturaOrigem.moveuNesteTurno = true; window.mostrarMensagemScanner("⚔️ COMBATE INICIADO!");

        if (typeof window.enviarAcaoRede === 'function') window.enviarAcaoRede({ tipo: 'combate', origem: idOrigem, destino: fullId });

        if(typeof window.iniciarCombate === 'function') window.iniciarCombate(idOrigem, fullId);

    }



    limparDestaquesMovimento(); window.slotSelecionadoMovimento = null; atualizarTelaBatalha(); 

};



function destacarAdjacentes(fullId) {

    limparDestaquesMovimento(); document.getElementById(fullId).classList.add('slot-selecionado');

    obterAdjacencias(fullId).forEach(adjId => {

        let el = document.getElementById(adjId);

        if (el && el.parentElement.style.display !== 'none') {

            let cAlvo = obterCriaturaNoSlot(adjId);

            if (!cAlvo) el.classList.add('slot-livre-movimento'); else if (cAlvo.dono === 'oponente') el.classList.add('slot-alvo-combate'); 

        }

    });

}



function limparDestaquesMovimento() { document.querySelectorAll('.slot-criatura, .zona-central > div').forEach(el => { el.classList.remove('slot-selecionado', 'slot-livre-movimento', 'slot-alvo-combate'); }); }



setTimeout(() => {

    let arena = document.querySelector('.arena-drome-container');

    if (arena) { arena.style.paddingBottom = "15px"; arena.style.paddingTop = "15px"; arena.style.boxSizing = "border-box"; }

    // ... [CSS Movement Block Skipped for brevity, already loaded normally via timeout] ...

    

    if (!document.getElementById("css-movimento")) {

        let style = document.createElement('style');

        style.id = "css-movimento";

        style.innerHTML = `

            .zona-central {

                justify-content: flex-start !important; 

                gap: 5px !important;

            }

            .linha-formacao-batalha { margin: 0 !important; }



            [id^="jog-"], [id^="op-"] {

                touch-action: none !important; 

            }



            .slot-selecionado { box-shadow: 0 0 20px #ffd700, inset 0 0 10px #ffd700 !important; border-color: #ffd700 !important; transform: scale(1.05); transition: 0.2s; z-index: 100;}

            .slot-livre-movimento { box-shadow: inset 0 0 25px rgba(0,255,0,0.8), 0 0 15px rgba(0,255,0,0.5) !important; border-color: #00ff00 !important; cursor: pointer; transition: 0.2s; z-index: 90;}

            .slot-livre-movimento:hover { background: rgba(0,255,0,0.15); transform: scale(1.02); }

            .slot-alvo-combate { box-shadow: inset 0 0 25px rgba(255,0,0,0.8), 0 0 15px rgba(255,0,0,0.5) !important; border-color: #ff0000 !important; cursor: pointer; transition: 0.2s; z-index: 90;}

            .slot-alvo-combate:hover { background: rgba(255,0,0,0.15); transform: scale(1.02); }

            

            .mini-card-wrapper { position: relative; pointer-events: none; } 

            .mini-equip-icon { pointer-events: auto; position: absolute; top: -8px; right: -8px; width: 22px; height: 22px; border-radius: 50%; z-index: 50; cursor: help; border: 2px solid #ffd700; display:flex; justify-content:center; align-items:center; }

            .mini-equip-icon.revelado { background-size: cover; background-position: center; }

            .mini-equip-icon.oculto { background: #222; color: #fff; font-weight: bold; font-size: 14px; border-color: #aaa; }

            .equip-tooltip { display: none; position: absolute; bottom: 120%; left: 50%; transform: translateX(-50%); width: 130px; background: rgba(0,10,0,0.95); border: 1px solid #4CAF50; color: white; text-align: center; font-size: 9px; padding: 6px; border-radius: 5px; pointer-events: none; z-index: 200; line-height: 1.3; }

            .mini-equip-icon:hover .equip-tooltip { display: block; }

            

            .btn-acao-modal { background: #112211; border: 1px solid #4CAF50; color: white; padding: 10px; border-radius: 5px; cursor: pointer; font-weight: bold; width: 100%; transition: 0.2s; }

            .btn-acao-modal:hover { background: #4CAF50; color: black; }

            .btn-acao-modal.btn-mover { border-color: #00bcd4; color: #00bcd4; }

            .btn-acao-modal.btn-mover:hover { background: #00bcd4; color: black; }

            .btn-acao-modal.btn-revelar { border-color: #ffd700; color: #ffd700; }

            .btn-acao-modal.btn-revelar:hover { background: #ffd700; color: black; }

            .btn-acao-modal.btn-cancelar { border-color: #e53935; color: #e53935; margin-top: 10px; }

            .btn-acao-modal.btn-cancelar:hover { background: #e53935; color: white; }



            .fundo-carta-personalizado {

                background-image: url('${URL_FUNDO_CARTA}') !important;

                background-size: cover !important;

                background-position: center !important;

                background-color: transparent !important;

                color: #fff !important;

                text-shadow: 0px 0px 4px #000, 0px 0px 6px #000 !important;

                border: 2px solid #555 !important;

                position: relative !important;

            }

            .texto-deck-baixo {

                position: absolute;

                bottom: 5px;

                left: 0;

                width: 100%;

                text-align: center;

                line-height: 1.2;

                font-size: 8px; 

            }

        `;

        document.head.appendChild(style);

    }



    let zonas = document.querySelectorAll('.zona-central');

    if (zonas) zonas.forEach(z => z.style.pointerEvents = "none"); 



    let interacao = { idOrigem: null, isDragging: false, clone: null, startX: 0, startY: 0 };



    window.iniciarInteracaoSlot = function(e, fullId) {

        if (e.button === 2) return; 



        // 🔥 O CADEADO DO ARRASTAR: Bloqueia se for turno do inimigo e NÃO for a hora do Burst!

        if (window.estadoTurno.jogadorAtual !== 'jogador' && !window.aguardandoResposta) {

            window.mostrarMensagemScanner("TURNO DO OPONENTE! Aguarde."); return;

        }



        let pointer = e.touches ? e.touches[0] : e; 

        interacao.idOrigem = fullId; interacao.isDragging = false; interacao.startX = pointer.clientX; interacao.startY = pointer.clientY;



        let criatura = obterCriaturaNoSlot(fullId);



        if (criatura && criatura.dono === 'jogador') {

            let emCombate = window.estadoCombate && window.estadoCombate.ativo;

            if (criatura.moveuNesteTurno && !emCombate) { window.mostrarMensagemScanner("Esta criatura já agiu!"); interacao.idOrigem = null; return; }

            

            // 🛑 Bloqueia o "arrastar" carta (criar clone visual) se a corrente estiver pedindo resposta!

            if (!emCombate && !criatura.moveuNesteTurno && !window.aguardandoResposta) {

                let elOriginal = document.getElementById(fullId);

                let rect = elOriginal.getBoundingClientRect();

                

                interacao.clone = elOriginal.cloneNode(true);

                interacao.clone.style.position = 'fixed'; interacao.clone.style.left = rect.left + 'px'; interacao.clone.style.top = rect.top + 'px';

                interacao.clone.style.width = rect.width + 'px'; interacao.clone.style.height = rect.height + 'px';

                interacao.clone.style.pointerEvents = 'none'; interacao.clone.style.zIndex = '999999';

                interacao.clone.style.opacity = '0.9'; interacao.clone.style.transform = 'scale(1.1)';

                interacao.clone.style.display = 'none'; 

                document.body.appendChild(interacao.clone);



                document.addEventListener('pointermove', moverInteracao, {passive: false});

                document.addEventListener('touchmove', moverInteracao, {passive: false});

            }

        }

        

        document.addEventListener('pointerup', soltarInteracao);

        document.addEventListener('touchend', soltarInteracao);

    };



  let ultimaSyncDrag = 0; // A memória do atraso de 80ms



    function moverInteracao(e) {

        if (!interacao.idOrigem || !interacao.clone) return;

        

        let pointer = e.touches ? e.touches[0] : e;

        

        let moveX = Math.abs(pointer.clientX - interacao.startX);

        let moveY = Math.abs(pointer.clientY - interacao.startY);



        if (!interacao.isDragging && (moveX > 25 || moveY > 25)) {

            interacao.isDragging = true;

            interacao.clone.style.display = 'flex';

            

            window.fecharModalAcoes(); 

            

            window.slotSelecionadoMovimento = interacao.idOrigem;

            destacarAdjacentes(interacao.idOrigem);

            if(window.tocarSFX) window.tocarSFX('notificacao'); 

        }



        if (interacao.isDragging) {

            if(e.cancelable) e.preventDefault(); 

            interacao.clone.style.left = (pointer.clientX - interacao.clone.offsetWidth / 2) + 'px';

            interacao.clone.style.top = (pointer.clientY - interacao.clone.offsetHeight / 2) + 'px';



            // 🌐 O TRANSMISSOR FANTASMA: Envia a posição do dedo a cada 80ms!

            if (window.salaBatalhaAtual && window.salaBatalhaAtual !== "sala_simulada") {

                let agora = Date.now();

                if (agora - ultimaSyncDrag > 80) {

                    ultimaSyncDrag = agora;

                    // Converte pixels em Porcentagem (pra funcionar em qualquer tamanho de tela)

                    let pctX = (pointer.clientX / window.innerWidth) * 100;

                    let pctY = (pointer.clientY / window.innerHeight) * 100;

                    let criaturaDrag = obterCriaturaNoSlot(interacao.idOrigem);

                    

                    if (criaturaDrag) {

                        window._dbUpdate('salas_drome/' + window.salaBatalhaAtual + '/drag/' + (window.souP1Batalha ? 'p1' : 'p2'), {

                            ativo: true, x: pctX, y: pctY, img: criaturaDrag.cartaBlank

                        });

                    }

                }

            }

        }

    }



    function soltarInteracao(e) {

        document.removeEventListener('pointermove', moverInteracao);

        document.removeEventListener('touchmove', moverInteracao);

        document.removeEventListener('pointerup', soltarInteracao);

        document.removeEventListener('touchend', soltarInteracao);



        let origem = interacao.idOrigem;



        // 🌐 DESLIGA O FANTASMA QUANDO SOLTAR A CARTA

        if (window.salaBatalhaAtual && window.salaBatalhaAtual !== "sala_simulada") {

            window._dbUpdate('salas_drome/' + window.salaBatalhaAtual + '/drag/' + (window.souP1Batalha ? 'p1' : 'p2'), { ativo: false });

        }

        

        if (interacao.isDragging) {

            let pointer = e.changedTouches ? e.changedTouches[0] : e;

            

            interacao.clone.style.display = 'none';

            let elementoAbaixo = document.elementFromPoint(pointer.clientX, pointer.clientY);

            

            let slotDestino = null;

            if (elementoAbaixo) {

                let hitBox = elementoAbaixo.closest('[id^="jog-"], [id^="op-"]');

                if (hitBox) slotDestino = hitBox.id;

            }



            interacao.clone.remove();

            interacao = { idOrigem: null, isDragging: false, clone: null };



            if (slotDestino && slotDestino !== origem) {

                if (obterAdjacencias(origem).includes(slotDestino)) {

                    window.slotSelecionadoMovimento = origem;

                    window.lidarComCliqueTabuleiro(slotDestino);

                } else {

                    limparDestaquesMovimento();

                    window.slotSelecionadoMovimento = null;

                }

            } else {

                if (slotDestino === origem) {

                    window.lidarComCliqueTabuleiro(origem);

                } else {

                    limparDestaquesMovimento();

                    window.slotSelecionadoMovimento = null;

                }

            }



        } else {

            if (interacao.clone) interacao.clone.remove();

            interacao = { idOrigem: null, isDragging: false, clone: null };

            

            window.lidarComCliqueTabuleiro(origem);

        }

    }

    ['jog', 'op'].forEach(lado => {

        ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'].forEach(slot => {

            let el = document.getElementById(`${lado}-${slot}`);

            if (el) {

                if (el.parentElement) el.parentElement.style.pointerEvents = "none";

                el.style.pointerEvents = "auto";

                

                // 🔥 FIX REAL: Se for carta do Oponente, usa o clique simples igual carta de ataque!

                if (lado === 'op') {

                    el.onpointerdown = null;

                    el.ontouchstart = null;

                    el.onclick = () => window.lidarComCliqueTabuleiro(`op-${slot}`);

                } else {

                    // Nas suas cartas, mantém o sistema de arrastar e soltar

                    el.onpointerdown = (e) => window.iniciarInteracaoSlot(e, `${lado}-${slot}`);

                    el.ontouchstart = (e) => window.iniciarInteracaoSlot(e, `${lado}-${slot}`);

                }

            }

        });

    });

}, 1000);



setTimeout(() => {

    if (!document.getElementById("css-mao-cartas")) {

        let style = document.createElement('style');

        style.id = "css-mao-cartas";

        style.innerHTML = `

            .container-mao-ataques {

                position: fixed;

                bottom: -20px; 

                left: 50%;

                transform: translateX(-50%);

                display: flex;

                justify-content: center;

                align-items: flex-end;

                z-index: 9999;

                pointer-events: none; 

            }



            .carta-na-mao {

                width: 60px; 

                height: 90px;

                background: #111; 

                border: 2px solid #e53935;

                border-radius: 6px;

                margin: 0 -15px; 

                box-shadow: -4px 4px 10px rgba(0,0,0,0.6);

                transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); 

                transform-origin: bottom center; 

                pointer-events: auto; 

                cursor: pointer;

                display: flex;

                justify-content: center;

                align-items: center;

                color: #e53935;

                font-family: monospace;

                font-weight: bold;

                font-size: 10px;

                text-align: center;

            }



            .carta-na-mao:nth-child(1) { transform: rotate(-15deg) translateY(12px); }

            .carta-na-mao:nth-child(2) { transform: rotate(0deg) translateY(0px); z-index: 2; }

            .carta-na-mao:nth-child(3) { transform: rotate(15deg) translateY(12px); }



            .carta-na-mao:hover {

                transform: rotate(0deg) translateY(-40px) scale(1.4) !important;

                z-index: 100 !important;

                box-shadow: 0 15px 25px rgba(0,0,0,0.9);

                border-color: #ffd700; 

                color: #ffd700;

            }



            .container-mao-oponente {

                position: fixed;

                top: -25px; 

                left: 50%;

                transform: translateX(-50%) rotate(180deg); 

                display: flex;

                justify-content: center;

                align-items: flex-end;

                z-index: 9999;

                pointer-events: none;

            }



            .carta-oponente-na-mao {

                width: 50px; 

                height: 75px;

                background-image: url('${URL_FUNDO_CARTA}'); 

                background-size: cover;

                background-position: center;

                border: 2px solid #555;

                border-radius: 6px;

                margin: 0 -10px;

                box-shadow: -4px 4px 10px rgba(0,0,0,0.6);

            }



            .carta-oponente-na-mao:nth-child(1) { transform: rotate(-15deg) translateY(12px); }

            .carta-oponente-na-mao:nth-child(2) { transform: rotate(0deg) translateY(0px); z-index: 2; }

            .carta-oponente-na-mao:nth-child(3) { transform: rotate(15deg) translateY(12px); }

        `;

        document.head.appendChild(style);

    }



    let todasAsCartas = document.querySelectorAll('.carta-mao'); 

    if(todasAsCartas.length > 0) {

        let caixaPai = todasAsCartas[0].parentElement;

        caixaPai.className = "container-mao-ataques"; 

        todasAsCartas.forEach(carta => {

            carta.className = "carta-na-mao"; 

        });

    }



    if(!document.getElementById('mao-oponente-ui')) {

        let maoOp = document.createElement('div');

        maoOp.id = 'mao-oponente-ui';

        maoOp.className = 'container-mao-oponente';

        maoOp.innerHTML = `

            <div class="carta-oponente-na-mao"></div>

            <div class="carta-oponente-na-mao"></div>

            <div class="carta-oponente-na-mao"></div>

        `;

        document.getElementById('tela-batalha').appendChild(maoOp);

    }



}, 1200);



setTimeout(() => {

    atualizarDecksEMaoCards();

    atualizarMugicsDaTela();

}, 1300);



window.estadoTurno = {

    jogadorAtual: null, 

    turnoNumero: 0,

    fase: 'pre-jogo'

};



setTimeout(() => {

    if (!document.getElementById("css-turnos-tcg")) {

        let style = document.createElement('style');

        style.id = "css-turnos-tcg";

        style.innerHTML = `

            .tcg-banner-container {

                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;

                display: flex; justify-content: center; align-items: center;

                pointer-events: none; z-index: 100000; overflow: hidden;

            }

            .tcg-banner-bg {

                position: absolute; width: 100%; height: 150px;

                background: linear-gradient(90deg, transparent, rgba(0,0,0,0.9), transparent);

                transform: scaleY(0); transition: transform 0.2s;

            }

            .tcg-banner-texto {

                font-family: 'Arial Black', sans-serif; font-size: 45px; font-weight: 900;

                color: transparent; -webkit-text-stroke: 2px #fff;

                text-transform: uppercase; letter-spacing: 15px;

                transform: translateX(150vw) skewX(-15deg); text-shadow: 0 0 20px rgba(255,255,255,0);

            }

            

            .banner-ativo .tcg-banner-bg { transform: scaleY(1); }

            .banner-ativo .tcg-banner-texto {

                animation: rasgarTela 2.5s cubic-bezier(0.1, 0.8, 0.1, 1) forwards;

            }

            @keyframes rasgarTela {

                0% { transform: translateX(150vw) skewX(-15deg); color: transparent; text-shadow: 0 0 0px transparent; }

                20% { transform: translateX(0) skewX(-15deg); color: #fff; text-shadow: 0 0 30px currentColor; }

                80% { transform: translateX(-20px) skewX(-15deg); color: #fff; text-shadow: 0 0 10px currentColor; }

                100% { transform: translateX(-150vw) skewX(-15deg); color: transparent; text-shadow: 0 0 0px transparent; }

            }



            .jokenpo-btn {

                font-size: 40px; background: #222; border: 3px solid #4CAF50;

                border-radius: 50%; width: 80px; height: 80px; cursor: pointer;

                transition: 0.2s; color: white; display: flex; justify-content: center; align-items: center;

            }

            .jokenpo-btn:hover { background: #4CAF50; transform: scale(1.2); box-shadow: 0 0 20px #4CAF50; }

        `;

        document.head.appendChild(style);

    }

}, 1000);



window.mostrarBannerTCG = function(texto, corCorpo, corBorda, callback) {

    const container = document.createElement('div');

    container.className = 'tcg-banner-container banner-ativo';

    container.innerHTML = `

        <div class="tcg-banner-bg" style="border-top: 3px solid ${corBorda}; border-bottom: 3px solid ${corBorda}; background: linear-gradient(90deg, transparent, ${corCorpo}, transparent);"></div>

        <div class="tcg-banner-texto" style="-webkit-text-stroke: 2px ${corBorda};">${texto}</div>

    `;

    document.getElementById('tela-batalha').appendChild(container);

    

    if(window.tocarSFX) window.tocarSFX('notificacao'); 



    setTimeout(() => {

        container.remove();

        if(callback) callback();

    }, 2500); 

};







window.abrirJokenpo = function() {

    window.estadoTurno.fase = 'jokenpo';



    // Limpa a mesa de Jokenpo antiga do servidor se você for o dono da sala (P1)

    if (window.salaBatalhaAtual && window.souP1Batalha) {

        window._dbUpdate('salas_drome/' + window.salaBatalhaAtual, { jokenpo: null });

    }



    const modalHTML = `

        <div class="modal-overlay" id="overlay-jokenpo" style="z-index: 99990; background: rgba(0,0,0,0.9);">

            <div style="text-align:center; display: flex; flex-direction: column; align-items: center;">

                <h2 style="color:#ffd700; font-size:24px; margin-bottom:10px; text-shadow: 0 0 10px #ffd700;">DECIDA QUEM COMEÇA!</h2>

                <p id="jokenpo-status" style="color:#fff; margin-bottom: 30px; font-family: monospace;">Escolha sua arma...</p>

                

                <div id="jokenpo-botoes" style="display:flex; gap: 20px; margin-bottom: 30px;">

                    <button class="jokenpo-btn" onclick="window.resolverJokenpo('pedra')">✊</button>

                    <button class="jokenpo-btn" onclick="window.resolverJokenpo('papel')">✋</button>

                    <button class="jokenpo-btn" onclick="window.resolverJokenpo('tesoura')">✌️</button>

                </div>

            </div>

        </div>

    `;

    document.getElementById('tela-batalha').insertAdjacentHTML('beforeend', modalHTML);

};



window.resolverJokenpo = function(escolhaJogador) {

    const emojis = { 'pedra': '✊', 'papel': '✋', 'tesoura': '✌️' };

    const statusEl = document.getElementById('jokenpo-status');

    const boxBotoes = document.getElementById('jokenpo-botoes');



    if (!window.salaBatalhaAtual || window.salaBatalhaAtual === "sala_simulada") {

        // 🤖 MODO BOT (Sorteio Rápido)

        const opcoes = ['pedra', 'papel', 'tesoura'];

        const escolhaOp = opcoes[Math.floor(Math.random() * opcoes.length)];

        

        statusEl.innerHTML = `Você: ${emojis[escolhaJogador]} <br> Oponente: ${emojis[escolhaOp]}`;



        setTimeout(() => {

            if (escolhaJogador === escolhaOp) {

                statusEl.innerHTML = `<span style="color:#ff9800; font-weight:bold; font-size:18px;">EMPATE! JOGUE DE NOVO!</span>`;

                document.getElementById('overlay-jokenpo').style.animation = "shake 0.5s";

                setTimeout(() => document.getElementById('overlay-jokenpo').style.animation = "", 500);

            } 

            else if ((escolhaJogador === 'pedra' && escolhaOp === 'tesoura') || (escolhaJogador === 'papel' && escolhaOp === 'pedra') || (escolhaJogador === 'tesoura' && escolhaOp === 'papel')) {

                statusEl.innerHTML = `<span style="color:#4CAF50; font-weight:bold; font-size:24px;">VOCÊ VENCEU!</span>`;

                window.abrirEscolhaDeTurno('jogador');

            } else {

                statusEl.innerHTML = `<span style="color:#e53935; font-weight:bold; font-size:24px;">OPONENTE VENCEU!</span>`;

                setTimeout(() => {

                    document.getElementById('overlay-jokenpo').remove();

                    window.iniciarTurnoReal('oponente');

                }, 1500);

            }

        }, 1000);

    } 

    else {

        // 🌐 MODO ONLINE (Nuvem)

        boxBotoes.style.display = 'none'; // Some com os botões pra não clicar duas vezes!

        statusEl.innerHTML = `Sua arma: ${emojis[escolhaJogador]} <br> <span style="color:#00ffff; font-size:12px; margin-top: 10px; display:block;">Aguardando adversário...</span>`;

        

        let meuSlot = window.souP1Batalha ? 'p1' : 'p2';

        window._dbUpdate('salas_drome/' + window.salaBatalhaAtual + '/jokenpo', { [meuSlot]: escolhaJogador });



        // Fica escutando as duas jogadas no Firebase

        window._dbOn('salas_drome/' + window.salaBatalhaAtual + '/jokenpo', (snap) => {

            if (!snap.exists()) return;

            let jogoData = snap.val();



            if (jogoData.p1 && jogoData.p2) {

                let minhaEscolha = window.souP1Batalha ? jogoData.p1 : jogoData.p2;

                let escolhaDele = window.souP1Batalha ? jogoData.p2 : jogoData.p1;



                statusEl.innerHTML = `Você: ${emojis[minhaEscolha]} <br> Oponente: ${emojis[escolhaDele]}`;



                setTimeout(() => {

                    if (minhaEscolha === escolhaDele) {

                        statusEl.innerHTML = `<span style="color:#ff9800; font-weight:bold; font-size:18px;">EMPATE! DE NOVO!</span>`;

                        document.getElementById('overlay-jokenpo').style.animation = "shake 0.5s";

                        setTimeout(() => document.getElementById('overlay-jokenpo').style.animation = "", 500);

                        

                        boxBotoes.style.display = 'flex';

                        if (window.souP1Batalha) window._dbUpdate('salas_drome/' + window.salaBatalhaAtual, { jokenpo: null });

                    } 

                    else if ((minhaEscolha === 'pedra' && escolhaDele === 'tesoura') || (minhaEscolha === 'papel' && escolhaDele === 'pedra') || (minhaEscolha === 'tesoura' && escolhaDele === 'papel')) {

                        statusEl.innerHTML = `<span style="color:#4CAF50; font-weight:bold; font-size:24px;">VOCÊ VENCEU!</span>`;

                        window.abrirEscolhaDeTurno('jogador');

                    } else {

                        statusEl.innerHTML = `<span style="color:#e53935; font-weight:bold; font-size:24px;">OPONENTE VENCEU!</span><br><span style="font-size:11px;color:#aaa;">Aguardando escolha de turno...</span>`;

                    }

                }, 1500);

            }

        });

    }

};



window.abrirEscolhaDeTurno = function(vencedor) {

    const modal = document.getElementById('overlay-jokenpo');

    modal.innerHTML = `

        <div style="text-align:center; display: flex; flex-direction: column; align-items: center;">

            <h2 style="color:#4CAF50; font-size:24px; margin-bottom:10px;">VITÓRIA!</h2>

            <p style="color:#fff; margin-bottom: 30px;">Você ganhou o direito de escolha:</p>

            <div style="display:flex; gap: 20px;">

                <button class="btn-acao-modal" style="width: 120px;" onclick="window.enviarEscolhaDeTurno('eu')">EU COMEÇO</button>

                <button class="btn-acao-modal" style="width: 120px; border-color:#e53935; color:#e53935;" onclick="window.enviarEscolhaDeTurno('ele')">OPONENTE COMEÇA</button>

            </div>

        </div>

    `;

};













window.enviarEscolhaDeTurno = function(quemComeca) {

    let modalJokenpo = document.getElementById('overlay-jokenpo');

    if (modalJokenpo) modalJokenpo.remove();

    

    if (!window.salaBatalhaAtual || window.salaBatalhaAtual === "sala_simulada") {

        // MODO BOT (Liga a partida direto)

        let jog = quemComeca === 'eu' ? 'jogador' : 'oponente';

        iniciarTurnoReal(jog);

    } else {

        // MODO ONLINE (Avisa na nuvem quem o ganhador escolheu pra começar)

        let turnoInicial = '';

        if (quemComeca === 'eu') turnoInicial = window.souP1Batalha ? 'p1' : 'p2';

        else turnoInicial = window.souP1Batalha ? 'p2' : 'p1';

        

        window._dbUpdate('salas_drome/' + window.salaBatalhaAtual, { turno_ativo: turnoInicial });

    }

};









setTimeout(() => {

    if (!document.getElementById("css-botao-turno")) {

        let style = document.createElement('style');

        style.id = "css-botao-turno";

        style.innerHTML = `

            #btn-passar-turno {

                position: absolute;

                right: 5%; 

                top: 45%;

                width: 90px;

                height: 50px;

                background: #4CAF50;

                color: black;

                font-family: 'Arial Black', sans-serif;

                font-size: 11px;

                font-weight: bold;

                border: 2px solid #fff;

                border-radius: 8px;

                cursor: pointer;

                z-index: 10000;

                box-shadow: 0 0 15px #4CAF50;

                transition: 0.3s;

                display: none; 

                text-align: center;

                line-height: 1.2;

            }

            #btn-passar-turno:hover:not(:disabled) {

                transform: scale(1.1);

                background: #fff;

            }

            #btn-passar-turno:disabled {

                background: #e53935 !important;

                color: white !important;

                box-shadow: 0 0 15px #e53935 !important;

                cursor: not-allowed;

            }

            .esgotado {

                filter: grayscale(80%) brightness(0.6);

            }

        `;

        document.head.appendChild(style);

    }



    if (!document.getElementById('btn-passar-turno')) {

        let btn = document.createElement('button');

        btn.id = 'btn-passar-turno';

        btn.onclick = window.passarTurno;

        document.getElementById('tela-batalha').appendChild(btn);

    }

}, 1500);



const desenharMiniCartaOriginal = desenharMiniCarta;

window.desenharMiniCarta = function(criaturaObj) {

    let html = desenharMiniCartaOriginal(criaturaObj);

    if (criaturaObj && criaturaObj.moveuNesteTurno) {

        html = html.replace('class="mini-card-wrapper"', 'class="mini-card-wrapper esgotado"');

    }

    return html;

};



window.localAtivoAtual = null;



window.sortearLocalAnimado = function(jogadorDaVez, callback) {

    let deck = window.estadoDrome.deckSelecionado;

    let imagensLocais = [];

    

    if (deck && deck.locais && deck.locais.length > 0) {

        imagensLocais = deck.locais.map(id => {

            let localEncontrado = null;

            if (typeof LOCAIS_DB !== 'undefined') localEncontrado = LOCAIS_DB.find(x => x.id == id || x.nome == id);

            if (!localEncontrado && window.inventario) localEncontrado = window.inventario.find(x => x.id == id || x.nome == id);

            return localEncontrado ? (localEncontrado.img || localEncontrado.cartaBlank) : null;

        }).filter(img => img !== null && img !== undefined);

    }



    if (imagensLocais.length === 0) {

        console.error("⚠️ DEBBUG: Nenhum local encontrado no Deck Salvo! Mostrando apenas o verso.");

        imagensLocais = [URL_FUNDO_CARTA];

    }



    const roletaHTML = `

        <div class="modal-overlay" id="overlay-roleta-local" style="z-index: 1000000; background: rgba(0,0,0,0.9); display: flex; flex-direction: column; align-items: center; justify-content: center;">

            <h2 style="color: #00bcd4; font-family: 'Arial Black', sans-serif; letter-spacing: 5px; text-shadow: 0 0 15px #00bcd4; margin-bottom: 20px; animation: pulse 1s infinite;">SORTEANDO LOCAL...</h2>

            <div id="roleta-imagem" style="width: 400px; height: 280px; background-size: 100% 100%; background-repeat: no-repeat; background-position: center; border: 4px solid #fff; border-radius: 15px; box-shadow: 0 0 40px #fff; transition: background-image 0.1s;"></div>

        </div>

    `;

    document.body.insertAdjacentHTML('beforeend', roletaHTML);



    let divImagem = document.getElementById('roleta-imagem');

    let tempo = 50; 

    let giros = 0;

    let indexSorteio = 0;



    if(window.tocarSFX) window.tocarSFX('notificacao');



    function girar() {

        indexSorteio = Math.floor(Math.random() * imagensLocais.length);

        divImagem.style.backgroundImage = `url('${imagensLocais[indexSorteio]}')`;

        

        giros++;

        tempo += 10; 



        if (giros < 25) {

            setTimeout(girar, tempo);

        } else {

            divImagem.style.borderColor = "#ffd700";

            divImagem.style.boxShadow = "0 0 50px #ffd700";

            let titulo = document.querySelector('#overlay-roleta-local h2');

            if(titulo) {

                titulo.innerText = "LOCAL DEFINIDO!";

                titulo.style.color = "#ffd700";

            }

            

            window.localAtivoAtual = imagensLocais[indexSorteio];

            if (typeof atualizarLocaisAtivosNaMesa === "function") atualizarLocaisAtivosNaMesa();



            setTimeout(() => {

                let modal = document.getElementById('overlay-roleta-local');

                if (modal) modal.remove();

                

                if(callback) {

                    try {

                        callback();

                    } catch(e) {

                        console.error("Erro no callback após roleta:", e);

                    }

                }

            }, 2000); 

        }

    }

    

    girar(); 

};



const scannerOriginal = window.mostrarMensagemScanner;

window.mostrarMensagemScanner = function(msg) {

    try {

        if (typeof scannerOriginal === 'function') {

            scannerOriginal(msg);

        }

    } catch(e) {

        console.warn("Scanner não encontrado. Usando Toast flutuante. Mensagem:", msg);

        let toast = document.createElement('div');

        toast.innerText = msg;

        toast.style.cssText = "position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:rgba(0,10,0,0.9); color:#00ff00; padding:10px 20px; border-radius:8px; border:2px solid #00ff00; z-index:999999; font-family:monospace; font-weight:bold; box-shadow:0 0 15px #00ff00;";

        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 3500);

    }

};



function atualizarLocaisAtivosNaMesa() {

    let candidatos = document.querySelectorAll('.zona-lateral > div, .box-local-ativo-js');

    let boxesLocais = [];



    candidatos.forEach(div => {

        let texto = div.innerText || div.textContent || "";

        

        if (texto.includes('LOCAL ATIVO') || div.classList.contains('box-local-ativo-js')) {

            if (!boxesLocais.includes(div)) {

                boxesLocais.push(div);

            }

        }

    });



    boxesLocais.forEach(box => {

        box.classList.add('box-local-ativo-js'); 

        

        if (window.localAtivoAtual) {

            box.style.backgroundImage = `url('${window.localAtivoAtual}')`;

            box.style.backgroundSize = '100% 100%'; 

            box.style.backgroundPosition = 'center';

            box.style.backgroundRepeat = 'no-repeat';

            box.style.border = "2px solid #ffd700";

            box.style.boxShadow = "0 0 15px rgba(255, 215, 0, 0.4)";

            

            box.style.cursor = 'pointer';

            box.onclick = function() {

                if (typeof window.ampliarCartaClicada === 'function') {

                    if(window.tocarSFX) window.tocarSFX('notificacao'); 

                    window.ampliarCartaClicada(window.localAtivoAtual);

                }

            };

            

            box.innerHTML = `

                <div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; opacity: 0; background: rgba(0,0,0,0.5); transition: 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0'">

                    <span style="color: white; font-weight: bold; font-size: 14px; font-family: 'Arial Black', sans-serif; text-shadow: 0 0 10px black, 0 0 5px #000;">🔍 LER CARTA</span>

                </div>

            `; 

            

        } else {

            box.style.backgroundImage = 'none';

            box.style.border = "1px solid #4CAF50";

            box.style.boxShadow = "none";

            box.style.cursor = 'default';

            box.onclick = null; 

            box.innerHTML = '<span style="font-size: 10px; color: white; font-family: monospace; display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; text-align: center;">LOCAL ATIVO</span>';

        }

    });

}



window.estadoCombate = { ativo: false, atacante: null, defensor: null };



window.encerrarCombateMorte = function(idMorto) {

    if (!window.cemiterio) window.cemiterio = [];

    if (!window.cemiterioOponente) window.cemiterioOponente = [];



    let morto = obterCriaturaNoSlot(idMorto);

    window.mostrarMensagemScanner(`💀 ${morto.nome} FOI DESTRUÍDO! O tabuleiro será redefinido.`);

    

    // 🔥 1. GUARDA O MORTO E O EQUIPAMENTO NO CEMITÉRIO PERMANENTE 🔥

    if (morto) {

        let isPlayer = morto.dono === 'jogador';

        let arrayCemiterio = isPlayer ? window.cemiterio : window.cemiterioOponente;

        

        let cartaOriginal = window.inventario ? window.inventario.find(c => c.nome === morto.nome) : null;

        if (cartaOriginal) arrayCemiterio.push(cartaOriginal.id);

        

        if (morto.equipamento) {

            let equipOriginal = window.inventario ? window.inventario.find(c => c.nome === morto.equipamento.nome) : null;

            if (equipOriginal) arrayCemiterio.push(equipOriginal.id);

        }

    }



    // 2. CHAMA A ANIMAÇÃO DE CÓDIGOS ANTES DE APAGAR DA TELA!

    window.animarExplosaoCodigo(idMorto, () => {

        

        // Apaga a criatura da mesa

        setarCriaturaNoSlot(idMorto, null);

        

        // Destrava a mesa

        window.estadoCombate.ativo = false;

        window.estadoCombate.atacante = null;

        window.estadoCombate.defensor = null;

        

        // ==========================================

        // 🔥 FASE DE MANUTENÇÃO PÓS-COMBATE 🔥

        // ==========================================

        

        // 1. Os Pontos de Ataque voltam para a base de 3

        window.pontosAtaque = { jogador: 3, oponente: 3 };

        

        // 2. O SEU BARALHO: Junta Mão + Lixo + Deck, embaralha e saca 3 novas

        let todasMinhasCartas = [...(window.baralhoAtaques || []), ...(window.maoAtaques || []), ...(window.lixoAtaques || [])];

        if (todasMinhasCartas.length > 0) {

            window.baralhoAtaques = embaralharArray(todasMinhasCartas);

            window.maoAtaques = window.baralhoAtaques.splice(0, 3);

        }

        window.lixoAtaques = []; // Zera o seu Lixo

        

        // 3. O BARALHO DO BOT: Reseta a matemática para 17 no deck, 3 na mão e 0 no lixo

        window.qtdBaralhoOponente = 17;

        window.qtdMaoOponente = 3;

        window.lixoAtaquesOponente = 0;

        

        // Atualiza a tela para refletir tudo instantaneamente

        atualizarTelaBatalha();

        if (typeof window.atualizarSeusContadoresDeAtaque === 'function') window.atualizarSeusContadoresDeAtaque();



        // 🔥 2. CHECA SE ALGUÉM GANHOU O JOGO APÓS A REDEFINIÇÃO!

        if (typeof window.checarFimDeJogo === 'function') window.checarFimDeJogo();

    });

};







window.pilhaBurst = []; 

window.aguardandoResposta = false;



window.adicionarAoBurst = function(acaoObj) {

    window.pilhaBurst.push(acaoObj);

    window.mostrarMensagemScanner(`⚡ BURST ATIVADO: ${acaoObj.nomeAcao} entrou na corrente!`);



    // 🌐 MODO ONLINE: Avisa a rede e aguarda a resposta do inimigo!

    if (window.salaBatalhaAtual && window.salaBatalhaAtual !== "sala_simulada") {

        if (acaoObj.dono === 'jogador') {

            window.mostrarMensagemScanner("⏳ Aguardando a resposta do Oponente...");

            window.enviarAcaoRede({ tipo: 'abrir_burst', nomeAcao: acaoObj.nomeAcao });

        } else {

            // Se eu recebi a ação da rede, a tela pergunta se eu quero responder!

            setTimeout(() => window.perguntarResposta('jogador', acaoObj), 500);

        }

    } else {

        // 🤖 MODO BOT OFFLINE

        let jogadorAlvo = acaoObj.dono === 'jogador' ? 'oponente' : 'jogador';

        setTimeout(() => window.perguntarResposta(jogadorAlvo, acaoObj), 1000);

    }

};



window.iniciarRespostaBurst = function(jogadorAlvo) {

    document.getElementById('overlay-burst').remove();

    window.mostrarMensagemScanner(`⏳ Escolha a sua Magia ou Habilidade para responder!`);

};



window.negarRespostaBurst = function() {

    let modal = document.getElementById('overlay-burst');

    if(modal) modal.remove();

    

    window.aguardandoResposta = false;

    

    // 🌐 Avisa o inimigo que você recusou responder

    if (window.salaBatalhaAtual && window.salaBatalhaAtual !== "sala_simulada") {

        window.enviarAcaoRede({ tipo: 'fechar_burst' });

    }

    

    window.mostrarMensagemScanner("Você não respondeu. Resolvendo as ações...");

    setTimeout(() => window.resolverBurst(), 1000);

};



window.resolverBurst = function() {

    if (window.pilhaBurst.length === 0) {

        window.mostrarMensagemScanner("Todas as ações resolvidas.");

        atualizarTelaBatalha();

        

        // 🌐 MASTER SYNC: Aquele que jogou no próprio turno atualiza a vida de todos na rede!

        if (window.salaBatalhaAtual && window.salaBatalhaAtual !== "sala_simulada" && window.estadoTurno.jogadorAtual === 'jogador') {

            setTimeout(() => {

                window.enviarAcaoRede({

                    tipo: 'sincronizar_mesa',

                    campoJog: window.campoJogador,

                    campoOp: window.campoOponente

                });

            }, 1000); // Dá um tempinho pras animações de HP acabarem na tela local

        }

        return;

    }



    let acaoAtual = window.pilhaBurst.pop();

    window.mostrarMensagemScanner(`✨ Resolvendo: ${acaoAtual.nomeAcao}`);

    acaoAtual.executar();

    setTimeout(() => window.resolverBurst(), 2500);

};



window.cancelarRespostaBurst = function() {

    if (window.aguardandoResposta) {

        window.aguardandoResposta = false;

        if (window.salaBatalhaAtual && window.salaBatalhaAtual !== "sala_simulada") {

            window.enviarAcaoRede({ tipo: 'fechar_burst' });

        }

        window.mostrarMensagemScanner("Resposta cancelada. Resolvendo a corrente...");

        window.resolverBurst();

    }

};



window.atualizarSeusContadoresDeAtaque = function() {

    let ptsJogador = window.pontosAtaque ? (window.pontosAtaque['jogador'] || 0) : 0;

    let ptsOponente = window.pontosAtaque ? (window.pontosAtaque['oponente'] || 0) : 0;



    let displayPontosJogador = document.getElementById('contador-ataque-jogador');

    let displayPontosOponente = document.getElementById('contador-ataque-oponente');



    if (displayPontosJogador) displayPontosJogador.innerText = `Cont. Ataque: ${ptsJogador}`;

    if (displayPontosOponente) displayPontosOponente.innerText = `Cont. Ataque: ${ptsOponente}`;

};



window.iniciarTurnoReal = function(primeiroJogador) {

    let modal = document.getElementById('overlay-jokenpo');

    if (modal) modal.remove();



    window.estadoTurno.jogadorAtual = primeiroJogador;

    window.estadoTurno.turnoNumero = 1;

    window.estadoTurno.fase = 'principal';



    window.pontosAtaque = { jogador: 3, oponente: 3 };

    

    window.qtdMaoOponente = 3;

    window.qtdBaralhoOponente = 17;



    Object.values(campoJogador).forEach(c => { if(c) c.moveuNesteTurno = false; });

    if(window.campoOponente) Object.values(window.campoOponente).forEach(c => { if(c) c.moveuNesteTurno = false; });



    let btnTurno = document.getElementById('btn-passar-turno');

    if (btnTurno) btnTurno.style.display = 'block';



    let iniciarOpc = () => {
        window.sortearLocalAnimado(primeiroJogador, () => {
            if (primeiroJogador === 'jogador') {
                window.mostrarMensagemScanner("Seu turno! Movimente suas criaturas.");
            } else {
                window.mostrarMensagemScanner("Aguarde a jogada do oponente...");
                
                // 🤖 Só o Bot passa o turno sozinho no começo do jogo! No online a tela só aguarda.
                if (!window.salaBatalhaAtual || window.salaBatalhaAtual === "sala_simulada") {
                    setTimeout(() => { window.passarTurno(); }, 3000);
                }
            }
        });
    };



    if (primeiroJogador === 'jogador') {

        if(btnTurno) { btnTurno.disabled = false; btnTurno.innerHTML = "PASSAR<br>TURNO"; }

        window.mostrarBannerTCG('SUA VEZ', 'rgba(0, 100, 0, 0.8)', '#4CAF50', iniciarOpc);

    } else {

        if(btnTurno) { btnTurno.disabled = true; btnTurno.innerHTML = "TURNO<br>OPONENTE"; }

        window.mostrarBannerTCG('TURNO DO INIMIGO', 'rgba(100, 0, 0, 0.8)', '#e53935', iniciarOpc);

    }

    atualizarTelaBatalha(); 

};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function atualizarDecksEMaoCards() {

    document.querySelectorAll('.box-deck').forEach(deck => {

        let isPlayer = deck.closest('.lado-jogador') !== null;

        let textoAtual = deck.textContent || ""; 



        if (textoAtual.includes('DECK') && textoAtual.includes('ATAQUE')) {

            let qtd = isPlayer ? (window.baralhoAtaques ? window.baralhoAtaques.length : 20) : (window.qtdBaralhoOponente !== undefined ? window.qtdBaralhoOponente : 17);

            deck.innerHTML = `<span class="texto-deck-baixo">DECK<br>ATAQUE<br><span style="font-size:9px; color:#fff; text-shadow: 0 0 3px black;">${qtd}/20</span></span>`;

            deck.classList.add('fundo-carta-personalizado');

        }

        // 🔥 CORREÇÃO VISUAL DO LIXO E ADIÇÃO DO CLIQUE

       else if (textoAtual.includes('LIXO')) {

            // 🔥 SOMA OS ATAQUES + O CEMITÉRIO PERMANENTE

            let qtdLixo = isPlayer ? 

                ((window.lixoAtaques ? window.lixoAtaques.length : 0) + (window.cemiterio ? window.cemiterio.length : 0)) : 

                ((window.lixoAtaquesOponente || 0) + (window.cemiterioOponente ? window.cemiterioOponente.length : 0));

            

            // Layout perfeito centralizado que não vaza da caixa!

            deck.innerHTML = `

                <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; height: 100%;">

                    <span style="font-size: 10px; font-weight: bold; color: #fff;">LIXO</span>

                    <span style="font-size: 14px; font-weight: bold; color: #fff; text-shadow: 0 0 5px black; margin-top: 2px;">${qtdLixo}</span>

                </div>

            `;

            deck.style.background = 'rgba(255, 0, 0, 0.15)'; // Fundo vermelho transparente

            deck.style.border = '2px dashed #ff5555'; // Borda tracejada vermelha

            deck.style.cursor = 'pointer'; // Mostra a mãozinha de clique

            

            // Evento para abrir a janela do cemitério

            deck.onclick = () => window.abrirModalVerLixo(isPlayer ? 'jogador' : 'oponente');

        }

        else if (textoAtual.trim() === 'DECK' || textoAtual.includes('LOCAIS')) {

            deck.innerHTML = `<span class="texto-deck-baixo">DECK<br>LOCAIS</span>`;

            deck.classList.add('fundo-carta-personalizado');

        }

    });



    let caixaMao = document.querySelector('.container-mao-ataques') || document.querySelector('.mao-jogador');

    if(caixaMao) {

        caixaMao.className = 'container-mao-ataques'; 

        caixaMao.style.pointerEvents = 'none'; 

        caixaMao.style.zIndex = '99999';

        caixaMao.innerHTML = ''; 



        let totalCartas = window.maoAtaques.length;

        let meio = (totalCartas - 1) / 2;



        window.maoAtaques.forEach((idAtaque, index) => {

            let cartaOriginal = window.inventario.find(c => c.id == idAtaque);

            if (cartaOriginal) {

                let el = document.createElement('div');

                el.className = 'carta-na-mao';

                el.style.backgroundImage = `url('${cartaOriginal.img}')`;

                el.style.backgroundSize = 'cover';

                el.style.backgroundPosition = 'center';

                el.style.pointerEvents = 'auto';

                el.style.cursor = 'pointer';



                let offset = index - meio;

                let angulo = offset * 12; 

                let descida = Math.abs(offset) * 6; 

                

                el.style.transform = `rotate(${angulo}deg) translateY(${descida}px)`;

                el.style.zIndex = index + 1;

                

               el.onclick = function(e) {

                    e.stopPropagation(); 

                    window.abrirModalAtaque(index, idAtaque, cartaOriginal);

                };

                caixaMao.appendChild(el);

            }

        });

    }



    let caixaMaoOp = document.getElementById('mao-oponente-ui');

    if (caixaMaoOp) {

        caixaMaoOp.innerHTML = ''; 

        

        let totalOp = window.qtdMaoOponente !== undefined ? window.qtdMaoOponente : 3;

        let meioOp = (totalOp - 1) / 2;

        

        for(let i = 0; i < totalOp; i++) {

            let el = document.createElement('div');

            el.className = 'carta-oponente-na-mao';

            

            let offset = i - meioOp;

            let angulo = offset * 12; 

            let descida = Math.abs(offset) * 6; 

            

            el.style.transform = `rotate(${angulo}deg) translateY(${descida}px)`;

            el.style.zIndex = i + 1;

            

            caixaMaoOp.appendChild(el);

        }

    }

}



window.iniciarCombate = function(idAtacante, idDefensor) {

    let atacante = obterCriaturaNoSlot(idAtacante);

    let defensor = obterCriaturaNoSlot(idDefensor);



    window.estadoCombate = { ativo: true, atacante: idAtacante, defensor: idDefensor };



    let nomeLocal = "Local Desconhecido";

    let locDB = null;

    if (window.localAtivoAtual) {

        if (typeof LOCAIS_DB !== 'undefined') locDB = LOCAIS_DB.find(l => l.img === window.localAtivoAtual);

        if (!locDB && window.inventario) locDB = window.inventario.find(l => l.img === window.localAtivoAtual);

        if (locDB) nomeLocal = locDB.nome;

    }



    // 🔥 CÁLCULO DE INICIATIVA 🔥

    let atributoIniciativa = locDB && locDB.iniciativa ? locDB.iniciativa.toLowerCase() : "velocidade"; // Velocidade é o padrão se falhar

    let prop = 'velocidade';

    if (atributoIniciativa.includes('coragem')) prop = 'coragem';

    if (atributoIniciativa.includes('poder')) prop = 'poder';

    if (atributoIniciativa.includes('sabedoria')) prop = 'sabedoria';



    let valAta = atacante.statsMax ? atacante.statsMax[prop] : 0;

    let valDef = defensor.statsMax ? defensor.statsMax[prop] : 0;



    let vencedorIniciativa = atacante.dono; // Empate vai pro atacante

    if (valDef > valAta) {

        vencedorIniciativa = defensor.dono;

    }



    let textoNarracao = `${atacante.nome} ataca ${defensor.nome} em ${nomeLocal}`;



    try {

        window.speechSynthesis.cancel(); 

        let vozRobo = new SpeechSynthesisUtterance(textoNarracao);

        vozRobo.lang = 'pt-BR'; vozRobo.rate = 1.0; vozRobo.pitch = 0.5; vozRobo.volume = 1.0; 

        window.speechSynthesis.speak(vozRobo);

    } catch(e) {}



    let iconeAtacante = atacante.cartaBlank;

    let iconeDefensor = defensor.cartaBlank;

    if (typeof MONSTROS !== 'undefined') {

        let dbAta = MONSTROS.find(m => m.nome === atacante.nome);

        if (dbAta && dbAta.iconeMapa) iconeAtacante = dbAta.iconeMapa;

        let dbDef = MONSTROS.find(m => m.nome === defensor.nome);

        if (dbDef && dbDef.iconeMapa) iconeDefensor = dbDef.iconeMapa;

    }



    const vsHTML = `

        <div class="modal-overlay" id="overlay-combate-vs" style="z-index: 1000000; background: #000; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100vw; height: 100vh; overflow: hidden;">

            <div style="position: relative; width: 160px; height: 230px; margin-bottom: 20px; animation: dropInTop 0.5s forwards;">

                <div class="carta-base" style="position: absolute; width: 100%; height: 100%; background-image: url('${defensor.cartaBlank}'); background-size: 100% 100%; border: 3px solid #e53935; border-radius: 10px; box-shadow: 0 0 30px #e53935; animation: fadeOutScan 0.5s 1.5s forwards;"></div>

                <div class="criatura-revelada" style="position: absolute; width: 100%; height: 100%; background-image: url('${iconeDefensor}'); background-size: contain; background-repeat: no-repeat; background-position: center; filter: drop-shadow(0 0 15px #e53935) brightness(1.2); opacity: 0; animation: revelarCarta 0.5s 1.5s forwards;"></div>

            </div>

            <div style="position: relative; width: 100%; display: flex; justify-content: center; align-items: center; height: 60px;">

                <div style="font-family: 'Arial Black', sans-serif; font-size: 60px; color: #fff; text-shadow: 0 0 20px #e53935, 0 0 30px #ffd700; z-index: 10; animation: pulseVS 0.5s infinite alternate;">VS</div>

            </div>

            <div style="position: relative; width: 160px; height: 230px; margin-top: 20px; animation: dropInBottom 0.5s forwards;">

                <div class="carta-base" style="position: absolute; width: 100%; height: 100%; background-image: url('${atacante.cartaBlank}'); background-size: 100% 100%; border: 3px solid #4CAF50; border-radius: 10px; box-shadow: 0 0 30px #4CAF50; animation: fadeOutScan 0.5s 1.5s forwards;"></div>

                <div class="criatura-revelada" style="position: absolute; width: 100%; height: 100%; background-image: url('${iconeAtacante}'); background-size: contain; background-repeat: no-repeat; background-position: center; filter: drop-shadow(0 0 15px #4CAF50) brightness(1.2); opacity: 0; animation: revelarCarta 0.5s 1.5s forwards;"></div>

            </div>

            <div style="position: absolute; bottom: 5%; width: 90%; text-align: center; font-family: monospace; font-size: 14px; font-weight: bold; color: #00ff00; background: rgba(0, 20, 0, 0.8); padding: 10px; border: 1px solid #00ff00; border-radius: 5px; opacity: 0; animation: revelarCarta 0.5s 0.5s forwards;">

                > ${textoNarracao.toUpperCase()}

            </div>

        </div>

        <style>

            @keyframes dropInTop { from { transform: translateY(-100vh); } to { transform: translateY(0); } }

            @keyframes dropInBottom { from { transform: translateY(100vh); } to { transform: translateY(0); } }

            @keyframes revelarCarta { to { opacity: 1; } }

            @keyframes fadeOutScan { to { opacity: 0; visibility: hidden; } }

            @keyframes pulseVS { from { transform: scale(1); } to { transform: scale(1.2); } }

        </style>

    `;

    document.body.insertAdjacentHTML('beforeend', vsHTML);



    setTimeout(() => {

        let telaVS = document.getElementById('overlay-combate-vs');

        if (telaVS) telaVS.remove();

        

       // 🔥 APLICA A INICIATIVA 🔥
        window.estadoTurno.jogadorAtual = vencedorIniciativa;
        window.pontosAtaque[vencedorIniciativa] += 1; 
        if (typeof window.atualizarSeusContadoresDeAtaque === 'function') window.atualizarSeusContadoresDeAtaque();
        
        let btn = document.getElementById('btn-passar-turno');

        

        if (vencedorIniciativa === 'jogador') {

            if(btn) { btn.disabled = false; btn.innerHTML = "PASSAR<br>TURNO"; }

            window.mostrarBannerTCG('SUA INICIATIVA', 'rgba(0, 100, 0, 0.8)', '#4CAF50', () => {

                window.mostrarMensagemScanner(`⚠️ Você ganhou a Iniciativa de ${prop.toUpperCase()} (${valAta} vs ${valDef}). Ataque primeiro!`);

            });

        } else {

            if(btn) { btn.disabled = true; btn.innerHTML = "TURNO<br>OPONENTE"; }

            window.mostrarBannerTCG('INICIATIVA DO INIMIGO', 'rgba(100, 0, 0, 0.8)', '#e53935', () => {

                window.mostrarMensagemScanner(`⚠️ Oponente ganhou a Iniciativa de ${prop.toUpperCase()} (${valDef} vs ${valAta}). Ele ataca primeiro!`);

                

                // 🤖 Só o Bot passa o turno sozinho! Online você tem que esperar.

                if (!window.salaBatalhaAtual || window.salaBatalhaAtual === "sala_simulada") {

                    setTimeout(() => { window.passarTurno(true); }, 4000);

                }

            });

        }

        

        atualizarTelaBatalha();

    }, 8000); 

};

/////////////////////////////////////////////////////////////////////

window.passarTurno = function(ignorarLimite) {

    let emCombate = window.estadoCombate && window.estadoCombate.ativo;



    if (emCombate && window.estadoTurno.jogadorAtual === 'jogador' && ignorarLimite !== true) {

        if (window.maoAtaques && window.maoAtaques.length > 5) {

            window.abrirModalDescarte();

            return; 

        }

    }



    // 🌐 SE FOR ONLINE: Envia o comando de passar o turno para a nuvem!

    if (window.salaBatalhaAtual && window.salaBatalhaAtual !== "sala_simulada") {

        if (window.estadoTurno.jogadorAtual === 'jogador') {

            let proximoTurno = window.souP1Batalha ? 'p2' : 'p1';

            window.mostrarMensagemScanner("Enviando turno...");

            

            // Oculta o botão instantaneamente para evitar duplo-clique

            let btn = document.getElementById('btn-passar-turno');

            if (btn) btn.style.display = 'none';

            

            window._dbUpdate('salas_drome/' + window.salaBatalhaAtual, { turno_ativo: proximoTurno });

            return; // Interrompe aqui. A tela só vira quando o Firebase devolver o sinal.

        }

    }



    // Se for Bot (ou se a nuvem confirmou), roda o script local!

    window.executarPassagemDeTurnoLocal();

};



// 🌐 O RÁDIO DO FIREBASE: Fica escutando quem é o dono do turno

window.iniciarEscutaDeTurnoOnline = function() {

    window._dbOn('salas_drome/' + window.salaBatalhaAtual + '/turno_ativo', (snapshot) => {

        if (!snapshot.exists()) return;

        let turnoVigente = snapshot.val(); // Retorna 'p1' ou 'p2'

        

        let minhaVez = (window.souP1Batalha && turnoVigente === 'p1') || (!window.souP1Batalha && turnoVigente === 'p2');

        

        // Remove a tela do Jokenpo (Pra quem perdeu e ficou esperando o sinal)

        let modalJokenpo = document.getElementById('overlay-jokenpo');

        if (modalJokenpo) modalJokenpo.remove();



        // 1. PRIMEIRA LARGADA DO JOGO: Se o jogo acabou de sair do Jokenpo!

        if (window.estadoTurno.fase !== 'principal') {

            window.iniciarTurnoReal(minhaVez ? 'jogador' : 'oponente');

        } 

        // 2. MUDANÇA DE TURNO NORMAL NO MEIO DO JOGO

        else {

            if (minhaVez && window.estadoTurno.jogadorAtual === 'oponente') {

                window.executarPassagemDeTurnoLocal();

            } else if (!minhaVez && window.estadoTurno.jogadorAtual === 'jogador') {

                window.executarPassagemDeTurnoLocal();

            }

        }

    });

};



// O verdadeiro motor que vira a mesa (Separado do clique do botão)

window.executarPassagemDeTurnoLocal = function() {

    let emCombate = window.estadoCombate && window.estadoCombate.ativo;



    if (typeof window.qtdMaoOponente === 'undefined') window.qtdMaoOponente = 3;

    if (typeof window.qtdBaralhoOponente === 'undefined') window.qtdBaralhoOponente = 17;

    if (typeof window.lixoAtaquesOponente === 'undefined') window.lixoAtaquesOponente = 0;

    if (typeof window.lixoAtaques === 'undefined') window.lixoAtaques = [];



    if (window.estadoTurno.jogadorAtual === 'jogador') {

        window.estadoTurno.jogadorAtual = 'oponente';

        window.estadoTurno.turnoNumero++;

        if(window.campoOponente) Object.values(window.campoOponente).forEach(c => { if(c) c.moveuNesteTurno = false; });

        

        if (emCombate) {

            window.pontosAtaque['oponente'] += 1;

            

            if (window.qtdBaralhoOponente <= 0 && window.lixoAtaquesOponente > 0) {

                window.qtdBaralhoOponente = window.lixoAtaquesOponente;

                window.lixoAtaquesOponente = 0;

            }



            if (window.qtdBaralhoOponente > 0) {

                window.qtdMaoOponente++; 

                window.qtdBaralhoOponente--; 

            }

        }



        let btn = document.getElementById('btn-passar-turno');

        if(btn) { 

            btn.style.display = 'block'; 

            btn.disabled = true; 

            btn.innerHTML = "TURNO<br>OPONENTE"; 

        }

        

        window.mostrarBannerTCG('TURNO DO INIMIGO', 'rgba(100, 0, 0, 0.8)', '#e53935', () => {

            window.mostrarMensagemScanner(emCombate ? "Turno do oponente no combate..." : "Turno de movimento do oponente...");

            

            // 🤖 SE FOR BOT (Muda o turno sozinho dps de 4s)

            if (!window.salaBatalhaAtual || window.salaBatalhaAtual === "sala_simulada") {

                setTimeout(() => { window.passarTurno(); }, 4000);

            }

        });

    } else {

        if (emCombate && window.qtdMaoOponente > 5) {

            let excesso = window.qtdMaoOponente - 5;

            window.qtdMaoOponente = 5;

            window.lixoAtaquesOponente += excesso;

        }



        window.estadoTurno.jogadorAtual = 'jogador';

        window.estadoTurno.turnoNumero++;

        Object.values(campoJogador).forEach(c => { if(c) c.moveuNesteTurno = false; });

        

        if (emCombate) {

            window.pontosAtaque['jogador'] += 1;

            

            if ((!window.baralhoAtaques || window.baralhoAtaques.length === 0) && window.lixoAtaques && window.lixoAtaques.length > 0) {

                window.mostrarMensagemScanner("Baralho vazio! Reembaralhando o Lixo...");

                window.baralhoAtaques = embaralharArray(window.lixoAtaques);

                window.lixoAtaques = []; 

            }



            if (window.baralhoAtaques && window.baralhoAtaques.length > 0) {

                window.maoAtaques.push(window.baralhoAtaques.shift());

            }

        }



        let btn = document.getElementById('btn-passar-turno');

        if(btn) { 

            btn.style.display = 'block'; 

            btn.disabled = false; 

            btn.innerHTML = "PASSAR<br>TURNO"; 

        }

        

        window.mostrarBannerTCG('SUA VEZ', 'rgba(0, 100, 0, 0.8)', '#4CAF50', () => {

            window.mostrarMensagemScanner(emCombate ? "Sua vez de atacar! +1 Ponto e +1 Carta." : "Sua vez! Movimente suas criaturas.");

        });

    }

    

    atualizarTelaBatalha(); 

    if (typeof window.atualizarSeusContadoresDeAtaque === 'function') window.atualizarSeusContadoresDeAtaque();

};

// ==========================================

// 🔥 MOTOR DE DESCARTE E LIXO DA MÃO 🔥

// ==========================================

window.abrirModalDescarte = function() {

    let excesso = window.maoAtaques.length - 5;

    let htmlCartas = "";



    window.maoAtaques.forEach((idAtaque, index) => {

        let cartaOriginal = window.inventario.find(c => c.id == idAtaque);

        if (cartaOriginal) {

            htmlCartas += `

                <div onclick="window.descartarCartaAtaque(${index}, '${idAtaque}')" style="width: 70px; height: 100px; background-image: url('${cartaOriginal.img}'); background-size: cover; background-position: center; border: 2px solid #ff5555; border-radius: 5px; cursor: pointer; transition: 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">

                </div>

            `;

        }

    });



    const modalHTML = `

        <div class="modal-overlay" id="overlay-descarte" style="z-index: 1000000; background: rgba(0,0,0,0.95); flex-direction: column;">

            <h2 style="color: #ff5555; text-shadow: 0 0 10px #ff5555; margin-bottom: 10px;">LIMITE DE MÃO EXCEDIDO!</h2>

            <p style="color: #fff; margin-bottom: 20px; font-size: 14px;">Selecione e descarte <b style="color:#ffd700; font-size: 18px;">${excesso}</b> carta(s) para passar o turno.</p>

            <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; max-width: 90%;">

                ${htmlCartas}

            </div>

        </div>

    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

};



window.descartarCartaAtaque = function(index, idAtaque) {

    document.getElementById('overlay-descarte').remove();

    

    // Tira da mão e joga pro Lixo!

    window.maoAtaques.splice(index, 1);

    if (typeof window.lixoAtaques === 'undefined') window.lixoAtaques = [];

    window.lixoAtaques.push(idAtaque);

    

    atualizarDecksEMaoCards(); // Atualiza a contagem visual na mesa



    // Verifica se ainda precisa descartar mais alguma

    if (window.maoAtaques.length > 5) {

        window.abrirModalDescarte();

    } else {

        window.mostrarMensagemScanner("Descarte concluído! Passando o turno...");

        window.passarTurno(true); // O "true" autoriza a passar de fase

    }

};

// ==========================================

// 🔥 MOTOR DE DESCARTE E LIXO DA MÃO 🔥

// ==========================================

window.abrirModalDescarte = function() {

    let excesso = window.maoAtaques.length - 5;

    let htmlCartas = "";



    window.maoAtaques.forEach((idAtaque, index) => {

        let cartaOriginal = window.inventario.find(c => c.id == idAtaque);

        if (cartaOriginal) {

            htmlCartas += `

                <div onclick="window.descartarCartaAtaque(${index}, '${idAtaque}')" style="width: 70px; height: 100px; background-image: url('${cartaOriginal.img}'); background-size: cover; background-position: center; border: 2px solid #ff5555; border-radius: 5px; cursor: pointer; transition: 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">

                </div>

            `;

        }

    });



    const modalHTML = `

        <div class="modal-overlay" id="overlay-descarte" style="z-index: 1000000; background: rgba(0,0,0,0.95); flex-direction: column;">

            <h2 style="color: #ff5555; text-shadow: 0 0 10px #ff5555; margin-bottom: 10px;">LIMITE DE MÃO EXCEDIDO!</h2>

            <p style="color: #fff; margin-bottom: 20px; font-size: 14px;">Selecione e descarte <b style="color:#ffd700; font-size: 18px;">${excesso}</b> carta(s) para passar o turno.</p>

            <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; max-width: 90%;">

                ${htmlCartas}

            </div>

        </div>

    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

};



window.descartarCartaAtaque = function(index, idAtaque) {

    document.getElementById('overlay-descarte').remove();

    

    // Tira da mão e joga pro Lixo!

    window.maoAtaques.splice(index, 1);

    if (typeof window.lixoAtaques === 'undefined') window.lixoAtaques = [];

    window.lixoAtaques.push(idAtaque);

    

    atualizarDecksEMaoCards(); 



    // Verifica se ainda precisa descartar mais alguma

    if (window.maoAtaques.length > 5) {

        window.abrirModalDescarte();

    } else {

        window.mostrarMensagemScanner("Descarte concluído! Passando o turno...");

        window.passarTurno(true); // O "true" autoriza a passar de fase

    }

};



window.abrirModalAtaque = function(indexMao, idAtaque, cartaInventario) {

    if (document.getElementById('overlay-ataque')) return;



    let ataqueDB = typeof ATAQUES !== 'undefined' ? ATAQUES.find(a => a.nome === cartaInventario.nome) : null;

    let custo = ataqueDB ? ataqueDB.custo : 0;

    let dano = ataqueDB ? ataqueDB.danoBase : 0;

    let img = ataqueDB ? ataqueDB.img : cartaInventario.img;



    let ptsAtuais = window.pontosAtaque['jogador'] || 0;

    let emCombate = window.estadoCombate && window.estadoCombate.ativo;

    let ehMeuTurno = (window.estadoTurno.jogadorAtual === 'jogador');

    

    // 🔥 REGRA OFICIAL TCG: Ataques NORMAIS só entram no SEU turno (sem burst inimigo)

    let podeAtacar = (emCombate && ehMeuTurno && !window.aguardandoResposta);

    let temPontos = (ptsAtuais >= custo);



    let btnUsarHTML = "";

    

    if (window.aguardandoResposta) {

        btnUsarHTML = `<p style="font-size: 10px; color: #ff9800; margin-bottom: 10px;">Ataques não podem ser ativados em resposta na Corrente (Burst)!</p>`;

    } else if (podeAtacar) {

        if (temPontos) {

            btnUsarHTML = `<button class="btn-acao-modal" style="border-color: #e53935; color: #e53935; background: #220000; font-size: 16px;" onclick="window.usarCartaAtaque(${indexMao}, '${idAtaque}', ${custo}, ${dano}, '${cartaInventario.nome}')">💥 USAR ATAQUE</button>`;

        } else {

            btnUsarHTML = `<button class="btn-acao-modal" style="border-color: #555; color: #555; background: #222;" disabled>Sem Pontos Suficientes</button>`;

        }

    } else {

        btnUsarHTML = `<p style="font-size: 10px; color: #ff9800; margin-bottom: 10px;">Ataques permitidos apenas durante o seu turno no Combate!</p>`;

    }



    const modalHTML = `

        <div class="modal-overlay" id="overlay-ataque" style="z-index: 9999999;" onclick="if(event.target === this) this.remove()">

            <div class="modal-content-fichas" style="text-align:center;">

                <h3 style="color:#e53935;margin-bottom:5px;">${cartaInventario.nome}</h3>

                <div onclick="window.ampliarCartaClicada('${img}')" style="width:140px;height:200px;margin:0 auto 10px auto;background-image:url('${img}');background-size:cover;background-position:center;border:2px solid #e53935;border-radius:10px;box-shadow: 0 0 15px rgba(229, 57, 53, 0.4); cursor: pointer;">

                    <div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; opacity: 0; background: rgba(0,0,0,0.5); border-radius: 8px; transition: 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0'">

                        <span style="color: white; font-weight: bold; font-size: 12px;">🔍 VER CARTA</span>

                    </div>

                </div>

                <p style="font-size:14px; color:#ffd700; margin-bottom:5px;">Seus Pontos de Ataque: <b style="font-size:18px;">${ptsAtuais}</b></p>

                <p style="font-size:12px; color:#fff; margin-bottom:15px;">Dano Base: <b>${dano}</b> | Custo: <b>${custo}</b></p>

                <div style="display:flex;flex-direction:column;gap:10px;">

                    ${btnUsarHTML}

                    <button class="btn-acao-modal btn-cancelar" onclick="document.getElementById('overlay-ataque').remove()">Cancelar</button>

                </div>

            </div>

        </div>

    `;

    document.getElementById('tela-batalha').insertAdjacentHTML('beforeend', modalHTML);

};



window.usarCartaAtaque = function(indexMao, idAtaque, custo, danoBase, nomeAtaque) {
    let modalAtaque = document.getElementById('overlay-ataque');
    if (modalAtaque) modalAtaque.remove();

    window.pontosAtaque['jogador'] -= custo;
    window.maoAtaques.splice(indexMao, 1);
    window.lixoAtaques.push(idAtaque);
    atualizarDecksEMaoCards();
    
    if (typeof window.atualizarSeusContadoresDeAtaque === 'function') window.atualizarSeusContadoresDeAtaque();

    // 🔥 LÓGICA DO DANO (ELEMENTAL + CHECAGEM DE ATRIBUTOS) 🔥
    let ataqueDB = typeof ATAQUES !== 'undefined' ? ATAQUES.find(a => a.nome === nomeAtaque) : null;
    let danoExtra = 0;
    let msgBonus = "";

    // 🔥 FIX DO BUMERANGUE: Identifica quem é o seu monstro e quem é o monstro inimigo no duelo atual!
    let idMeuMonstro = null;
    let idMonstroInimigo = null;

    if (window.estadoCombate && window.estadoCombate.ativo) {
        let p1Card = obterCriaturaNoSlot(window.estadoCombate.atacante);
        let p2Card = obterCriaturaNoSlot(window.estadoCombate.defensor);

        if (p1Card && p1Card.dono === 'jogador') { idMeuMonstro = window.estadoCombate.atacante; } 
        else { idMonstroInimigo = window.estadoCombate.atacante; }

        if (p2Card && p2Card.dono === 'jogador') { idMeuMonstro = window.estadoCombate.defensor; } 
        else { idMonstroInimigo = window.estadoCombate.defensor; }
    }

    if (ataqueDB && idMeuMonstro && idMonstroInimigo) {
        let minhaCriatura = obterCriaturaNoSlot(idMeuMonstro);
        let criaturaInimiga = obterCriaturaNoSlot(idMonstroInimigo); 
        
        if (minhaCriatura) {
            // 1. CHECAGEM ELEMENTAL
            if (ataqueDB.danoElemental) {
                let elemsBrutos = minhaCriatura.elementos;
                if ((!elemsBrutos || elemsBrutos.length === 0) && typeof MONSTROS !== 'undefined') {
                    let dbCarta = MONSTROS.find(m => m.nome === minhaCriatura.nome);
                    if (dbCarta && dbCarta.elementos) elemsBrutos = dbCarta.elementos;
                }
                let textoElementos = JSON.stringify(elemsBrutos || "").toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");

                if (textoElementos.includes('fogo') && ataqueDB.danoElemental.fogo > 0) { danoExtra += ataqueDB.danoElemental.fogo; msgBonus += "🔥 "; }
                if (textoElementos.includes('agua') && ataqueDB.danoElemental.agua > 0) { danoExtra += ataqueDB.danoElemental.agua; msgBonus += "🌊 "; }
                if (textoElementos.includes('terra') && ataqueDB.danoElemental.terra > 0) { danoExtra += ataqueDB.danoElemental.terra; msgBonus += "⛰️ "; }
                if ((textoElementos.includes('ar') || textoElementos.includes('vento')) && ataqueDB.danoElemental.vento > 0) { danoExtra += ataqueDB.danoElemental.vento; msgBonus += "☁️ "; }
            }

            // 2. CHECAGEM DE ATRIBUTOS (STAT CHECK) 🔥
            if (ataqueDB.checkAtributo && criaturaInimiga) {
                let attr = ataqueDB.checkAtributo.atributo.toLowerCase(); 
                let bonus = ataqueDB.checkAtributo.danoExtra;
                
                let valAta = minhaCriatura.statsMax ? (minhaCriatura.statsMax[attr] || 0) : 0;
                let valDef = criaturaInimiga.statsMax ? (criaturaInimiga.statsMax[attr] || 0) : 0;

                if (valAta > valDef) {
                    danoExtra += bonus;
                    let iconesAttr = { 'coragem': '❤️', 'poder': '⚡', 'sabedoria': '👁️', 'velocidade': '💨' };
                    msgBonus += `[+${bonus} Check ${iconesAttr[attr] || ''}] `;
                }
            }
        }
    }

    let danoTotal = danoBase + danoExtra;

    let acaoDoAtaque = {
        dono: 'jogador',
        nomeAcao: nomeAtaque,
        tipo: 'ataque',
        executar: function() {
            if (!idMonstroInimigo) return;
            let alvo = obterCriaturaNoSlot(idMonstroInimigo);
            if (alvo) {
                alvo.hpAtual -= danoTotal; 
                if(window.tocarSFX) window.tocarSFX('notificacao'); 
                
                let msgScanner = `💥 Dano aplicado! ${alvo.nome} perdeu ${danoTotal} de energia!`;
                if (danoExtra > 0) msgScanner = `💥 DANO AUMENTADO! ${alvo.nome} perdeu ${danoTotal} de energia! (${danoBase} Base + ${danoExtra} Bônus ${msgBonus})`;
                
                window.mostrarMensagemScanner(msgScanner);
                
                let elAlvo = document.getElementById(idMonstroInimigo);
                if(elAlvo) {
                    elAlvo.style.animation = "shake 0.5s";
                    setTimeout(() => { elAlvo.style.animation = ""; }, 500);
                }
                if (alvo.hpAtual <= 0) {
                    alvo.hpAtual = 0;
                    setTimeout(() => window.encerrarCombateMorte(idMonstroInimigo), 1000);
                }
                atualizarTelaBatalha();
            }
        }
    };
    window.adicionarAoBurst(acaoDoAtaque);
};

/////////////////////////////////////////////////////////////////////////////////





let btnSairDrome = document.getElementById("btn-sair-drome");

if (btnSairDrome) {

    btnSairDrome.onclick = () => {

        let vivasJogador = Object.values(campoJogador).filter(c => c !== null).length;

        let vivasOp = window.campoOponente ? Object.values(window.campoOponente).filter(c => c !== null).length : 0;

        

        // Se a partida estiver rolando, abre o Modal Personalizado de Fuga

        if (vivasJogador > 0 && vivasOp > 0) {

            if (document.getElementById('overlay-fuga')) return;



            const modalHTML = `

                <div class="modal-overlay" id="overlay-fuga" style="z-index: 9999999; background: rgba(0,0,0,0.95); display: flex; flex-direction: column; align-items: center; justify-content: center;">

                    <div class="modal-content-fichas" style="text-align: center; border: 3px solid #e53935; box-shadow: 0 0 30px rgba(229, 57, 53, 0.5); background: #111; padding: 30px; border-radius: 10px; max-width: 400px;">

                        <h2 style="color: #e53935; font-family: 'Arial Black', sans-serif; text-shadow: 0 0 10px #e53935; margin-bottom: 20px; font-size: 24px;">ATENÇÃO!</h2>

                        <p style="color: #fff; font-size: 14px; font-family: monospace; margin-bottom: 30px; line-height: 1.5;">

                            A Batalha está rolando! Se você sair agora, contará como <b style="color: #e53935; font-size: 16px;">DESISTÊNCIA (Derrota)</b>.<br><br>Deseja fugir do Drome?

                        </p>

                        <div style="display: flex; gap: 15px; justify-content: center;">

                            <button class="btn-acao-modal" style="background: #220000; color: #e53935; border: 1px solid #e53935; width: 130px;" onclick="

                                document.getElementById('overlay-fuga').remove();

                                window.declararVitoria('oponente', 'O jogador fugiu covardemente do Drome (Desistência).');

                            ">FUGIR</button>

                            <button class="btn-acao-modal" style="background: #112211; color: #4CAF50; border: 1px solid #4CAF50; width: 160px;" onclick="document.getElementById('overlay-fuga').remove()">VOLTAR À LUTA</button>

                        </div>

                    </div>

                </div>

            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);

            if(window.tocarSFX) window.tocarSFX('notificacao');

            return;

        }



        // Se o jogo não tinha começado ou já tinha acabado, apenas sai direto

        window.sairDaBatalhaAposFim();

    };

}



window.perguntarResposta = function(jogadorAlvo, acaoAnterior) {

    if (jogadorAlvo === 'oponente') {

        window.mostrarMensagemScanner("Oponente pensando...");

        setTimeout(() => {

            window.mostrarMensagemScanner("Oponente não tem respostas! O ataque vai acertar!");

            window.aguardandoResposta = false;

            window.resolverBurst(); 

        }, 2000);

        return; 

    }



    window.aguardandoResposta = true;

    let cor = jogadorAlvo === 'jogador' ? '#4CAF50' : '#e53935';

    let nomeJogador = jogadorAlvo === 'jogador' ? 'VOCÊ' : 'OPONENTE';



    // 🔍 DETETIVE DE CARTAS: Extrai o nome da carta da mensagem da rede!

    let nomeBusca = acaoAnterior.nomeAcao;

    if (nomeBusca.includes('Mugic:')) {

        nomeBusca = nomeBusca.split('Mugic: ')[1].split(' ➔')[0].trim();

    } else if (nomeBusca.includes('Habilidade de')) {

        nomeBusca = nomeBusca.split('Habilidade de ')[1].split(' ➔')[0].trim();

    } else if (nomeBusca.includes('Revelar Equipamento')) {

        nomeBusca = nomeBusca.replace('Revelar Equipamento (', '').replace(')', '').trim();

    }



    // 📚 Procura a carta em todos os bancos de dados para mostrar a foto!

    let cartaDB = null;

    if(typeof ATAQUES !== 'undefined') cartaDB = ATAQUES.find(c => c.nome === nomeBusca);

    if(!cartaDB && typeof MAGIAS !== 'undefined') cartaDB = MAGIAS.find(c => c.nome === nomeBusca);

    if(!cartaDB && typeof MONSTROS !== 'undefined') cartaDB = MONSTROS.find(c => c.nome === nomeBusca);

    if(!cartaDB && typeof EQUIPAMENTOS !== 'undefined') cartaDB = EQUIPAMENTOS.find(c => c.nome === nomeBusca);



    let htmlVisualCarta = "";

    if (cartaDB) {

        let imgCard = cartaDB.img || cartaDB.cartaBlank;

        let txtEfeito = cartaDB.efeito || cartaDB.textoCarta || "Sem efeito descrito.";

        htmlVisualCarta = `

            <div style="display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.5); padding: 15px 10px; border-radius: 8px; margin: 15px 0; border: 1px solid #444; box-shadow: inset 0 0 10px rgba(0,0,0,0.8);">

                <div onclick="window.ampliarCartaClicada('${imgCard}')" style="width: 70px; height: 100px; background-image: url('${imgCard}'); background-size: cover; background-position: center; border: 2px solid #ffd700; border-radius: 5px; cursor: pointer; box-shadow: 0 0 15px rgba(255,215,0,0.4); margin-bottom: 10px; transition: 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"></div>

                <p style="font-size: 11px; color: #ccc; max-width: 250px; line-height: 1.4; font-style: italic; text-shadow: 0 0 3px #000;">"${txtEfeito}"</p>

                <p style="font-size: 9px; color: #888; margin-top: 8px; text-transform: uppercase;">(Toque na carta para ver detalhes)</p>

            </div>

        `;

    }



    const modalHTML = `

        <div class="modal-overlay" id="overlay-burst" style="z-index: 1000000; background: rgba(0,0,0,0.9);">

            <div class="modal-content-fichas" style="text-align:center; border: 3px solid ${cor}; box-shadow: 0 0 30px ${cor};">

                <h3 style="color:${cor}; margin-bottom:15px; font-size: 24px; text-shadow: 0 0 10px ${cor};">AÇÃO DO ADVERSÁRIO!</h3>

                <p style="color:#fff; font-size: 14px; margin-bottom: 5px;">

                    O adversário ativou: <b style="color:#ffd700; font-size: 16px;">${acaoAnterior.nomeAcao}</b>

                </p>

                ${htmlVisualCarta}

                <p style="color:#fff; font-size: 16px; margin-bottom: 20px;">

                    ${nomeJogador}, deseja responder a essa ação?

                </p>

                <div style="display:flex; gap: 20px; justify-content: center;">

                    <button class="btn-acao-modal" style="width: 100px; border-color:#00bcd4; color:#00bcd4; background: #002222; font-size: 14px;" onclick="window.iniciarRespostaBurst('${jogadorAlvo}')">SIM</button>

                    <button class="btn-acao-modal" style="width: 100px; border-color:#e53935; color:#e53935; background: #220000; font-size: 14px;" onclick="window.negarRespostaBurst()">NÃO</button>

                </div>

                <p style="font-size: 10px; color: #888; margin-top: 15px;">Se clicar em SIM e não fizer nada, basta cancelar na sua carta.</p>

            </div>

        </div>

    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

};













// ==========================================

// 🔥 NOVO MOTOR: VISUALIZAR CEMITÉRIO (LIXO) 🔥

// ==========================================



window.abrirModalVerLixo = function(dono) {

    if (document.getElementById('overlay-ver-lixo')) return;



    let cartasHTML = "";

    let titulo = dono === 'jogador' ? "SEU CEMITÉRIO (LIXO)" : "CEMITÉRIO DO OPONENTE";

    let cor = dono === 'jogador' ? "#4CAF50" : "#e53935";



    if (dono === 'jogador') {

        // 🔥 JUNTA ATAQUES + MONSTROS + EQUIPAMENTOS + MAGIAS

        let lixoArray = [...(window.lixoAtaques || []), ...(window.cemiterio || [])];

        if (lixoArray.length === 0) {

            cartasHTML = `<p style="color:#aaa; font-size:12px; margin-top: 20px;">Seu lixo está vazio.</p>`;

        } else {

            lixoArray.forEach(idCarta => {

                let c = window.inventario.find(item => item.id == idCarta);

                if (c) {

                    cartasHTML += `

                        <div onclick="if(typeof window.ampliarCartaClicada === 'function') window.ampliarCartaClicada('${c.img}')" style="width: 80px; height: 115px; background-image: url('${c.img}'); background-size: cover; background-position: center; border: 2px solid #777; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.8); cursor: pointer; transition: 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"></div>

                    `;

                }

            });

        }

    } else {

        let qtdOpAtaques = window.lixoAtaquesOponente || 0;

        let lixoOpCartas = window.cemiterioOponente || [];

        

        if (qtdOpAtaques === 0 && lixoOpCartas.length === 0) {

            cartasHTML = `<p style="color:#aaa; font-size:12px; margin-top: 20px;">O lixo do oponente está vazio.</p>`;

        } else {

            // 1. Mostra os MONSTROS E EQUIPAMENTOS reais destruídos do Bot!

            lixoOpCartas.forEach(idCarta => {

                let c = window.inventario.find(item => item.id == idCarta);

                if (c) {

                    cartasHTML += `

                        <div onclick="if(typeof window.ampliarCartaClicada === 'function') window.ampliarCartaClicada('${c.img}')" style="width: 80px; height: 115px; background-image: url('${c.img}'); background-size: cover; background-position: center; border: 2px solid #555; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.8); cursor: pointer; transition: 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"></div>

                    `;

                }

            });

            

            // 2. Mostra as cartas de ATAQUE simuladas do Bot!

            let todosAtaques = typeof ATAQUES !== 'undefined' ? ATAQUES : window.inventario.filter(c => c.tipoCarta === 'Ataque');

            for (let i = 0; i < qtdOpAtaques; i++) {

                let cartaSimulada = todosAtaques[Math.floor(Math.random() * todosAtaques.length)];

                let imgBot = cartaSimulada ? cartaSimulada.img : URL_FUNDO_CARTA;

                cartasHTML += `

                    <div onclick="if(typeof window.ampliarCartaClicada === 'function') window.ampliarCartaClicada('${imgBot}')" style="width: 80px; height: 115px; background-image: url('${imgBot}'); background-size: cover; background-position: center; border: 2px solid #e53935; border-radius: 5px; box-shadow: 0 0 10px rgba(229,57,53,0.8); cursor: pointer; transition: 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"></div>

                `;

            }

        }

    }



    const modalHTML = `

        <div class="modal-overlay" id="overlay-ver-lixo" style="z-index: 1000000; background: rgba(0,0,0,0.95); flex-direction: column; align-items: center; justify-content: center; display: flex;">

            <h2 style="color: ${cor}; text-shadow: 0 0 10px ${cor}; margin-bottom: 20px; font-family: 'Arial Black', sans-serif;">${titulo}</h2>

            <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; width: 90%; max-width: 400px; max-height: 50vh; overflow-y: auto; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px; border: 1px solid #333;">

                ${cartasHTML}

            </div>

            <button class="btn-acao-modal" style="width: 150px; background: #222; color: #fff; border: 2px solid #fff; margin-top: 25px;" onclick="document.getElementById('overlay-ver-lixo').remove()">FECHAR</button>

        </div>

    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

};









// ==========================================

// 🔥 MOTOR DE EXPLOSÃO DE CÓDIGOS (ANIME) 🔥

// ==========================================

window.animarExplosaoCodigo = function(idElemento, callback) {

    let el = document.getElementById(idElemento);

    if (!el) { callback(); return; }



    let rect = el.getBoundingClientRect();

    

    // Efeito de Tela "Bugando" e Ficando Verde (Matrix)

    el.style.transition = "all 0.5s";

    el.style.filter = "sepia(1) hue-rotate(90deg) saturate(500%) brightness(1.5)";

    el.style.transform = "scale(1.1)";

    el.style.opacity = "0";



    // Cria as partículas de Binários (Zeros e Uns) voando

    for(let i = 0; i < 40; i++) {

        let part = document.createElement('div');

        part.innerText = Math.random() > 0.5 ? "1" : "0";

        part.style.position = "fixed";

        part.style.left = (rect.left + rect.width / 2) + "px";

        part.style.top = (rect.top + rect.height / 2) + "px";

        part.style.color = "#00ff00"; // Verde neon

        part.style.fontFamily = "monospace";

        part.style.fontWeight = "bold";

        part.style.fontSize = (Math.random() * 15 + 10) + "px";

        part.style.pointerEvents = "none";

        part.style.zIndex = "9999999";

        part.style.textShadow = "0 0 8px #00ff00";

        

        // Direção aleatória da explosão

        let moveX = (Math.random() - 0.5) * 250;

        let moveY = (Math.random() - 0.5) * 250;

        

        part.style.transition = "all 1s cubic-bezier(0.1, 0.8, 0.3, 1)";

        document.body.appendChild(part);

        

        // Dispara o movimento 10ms depois para a transição funcionar

        setTimeout(() => {

            part.style.transform = `translate(${moveX}px, ${moveY}px) rotate(${Math.random()*360}deg) scale(0)`;

            part.style.opacity = "0";

        }, 10);

        

        // Limpa o lixo HTML

        setTimeout(() => part.remove(), 1000);

    }



    // Espera a animação acabar para apagar a criatura de verdade (callback)

    setTimeout(() => {

        el.style.filter = "";

        el.style.transform = "";

        el.style.opacity = "1";

        callback();

    }, 1000);

};



// ==========================================

// 🏆 SISTEMA DE VITÓRIA E DERROTA 🏆

// ==========================================

window.checarFimDeJogo = function() {

    let vivasJogador = Object.values(campoJogador).filter(c => c !== null).length;

    let vivasOponente = window.campoOponente ? Object.values(window.campoOponente).filter(c => c !== null).length : 0;



    if (vivasJogador === 0) {

        window.declararVitoria('oponente', 'Todo o seu exército foi aniquilado.');

    } else if (vivasOponente === 0) {

        window.declararVitoria('jogador', 'Você destruiu todas as criaturas inimigas e dominou o Drome!');

    }

};



window.declararVitoria = function(vencedor, motivo) {

    let cor = vencedor === 'jogador' ? '#4CAF50' : '#e53935';

    let titulo = vencedor === 'jogador' ? 'VITÓRIA!' : 'DERROTA!';

    let subtitulo = vencedor === 'jogador' ? 'O DROME É SEU.' : 'VOCÊ FOI DESTRUÍDO.';

    

    // Toca som de fim de partida (se tiver)

    if(window.tocarSFX) window.tocarSFX('notificacao');



    const modalHTML = `

        <div class="modal-overlay" id="overlay-vitoria" style="z-index: 99999999; background: rgba(0,0,0,0.95); flex-direction: column; display:flex; justify-content:center; align-items:center;">

            <h1 style="color: ${cor}; font-size: 60px; font-family: 'Arial Black', sans-serif; text-shadow: 0 0 20px ${cor}, 0 0 40px ${cor}; margin-bottom: 10px; text-transform: uppercase;">${titulo}</h1>

            <h3 style="color: #fff; font-size: 20px; font-family: monospace; margin-bottom: 30px;">${subtitulo}</h3>

            <p style="color: #ffd700; font-size: 14px; margin-bottom: 40px; text-align: center; max-width: 80%;">Motivo: ${motivo}</p>

            <button class="btn-acao-modal" style="width: 200px; background: #222; border-color: ${cor}; color: ${cor}; font-size: 18px;" onclick="window.sairDaBatalhaAposFim()">SAIR DA ARENA</button>

        </div>

    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

};



window.sairDaBatalhaAposFim = function() {

    let modal = document.getElementById('overlay-vitoria');

    if(modal) modal.remove();

    

    // Volta pro Menu Principal

    document.getElementById("tela-batalha").style.display = "none";

    document.getElementById("tela-menu").style.display = "flex";

    window.modoMenu = true;

    

    // FAXINA GERAL: Limpa a memória para uma próxima batalha limpa

    window.estadoCombate = { ativo: false, atacante: null, defensor: null };

    window.estadoTurno = { jogadorAtual: null, turnoNumero: 0, fase: 'pre-jogo' };

    window.pontosAtaque = { jogador: 3, oponente: 3 };

    window.baralhoAtaques = [];

    window.maoAtaques = [];

    window.lixoAtaques = [];

    window.campoJogador = { c1: null, c2: null, c3: null, c4: null, c5: null, c6: null };

    window.campoOponente = { c1: null, c2: null, c3: null, c4: null, c5: null, c6: null };

};







// ==========================================

// 🔥 MOTOR DE AÇÕES DA CRIATURA (HABILIDADE, MUGIC E EQUIPAMENTO) 🔥

// ==========================================



// 1. REVELAR EQUIPAMENTO

// 1. REVELAR EQUIPAMENTO (AGORA NO BURST)

window.revelarEquipamento = function(fullId) {

    let criatura = obterCriaturaNoSlot(fullId);

    if (criatura && criatura.equipamento && !criatura.equipamentoRevelado) {

        window.fecharModalAcoes();

        

        let acaoRevelar = {

            dono: criatura.dono,

            nomeAcao: `Revelar Equipamento (${criatura.equipamento.nome})`,

            tipo: 'equipamento',

            executar: function() {

                criatura.equipamentoRevelado = true; // Vira a carta pra cima só na resolução!

                window.mostrarMensagemScanner(`✨ EQUIPAMENTO REVELADO: ${criatura.nome} revelou ${criatura.equipamento.nome}!`);

                if(window.tocarSFX) window.tocarSFX('notificacao');

                atualizarTelaBatalha(); 

            }

        };

        window.adicionarAoBurst(acaoRevelar);

    }

};



// 2. USAR HABILIDADE (AGORA COM MIRA)

window.usarHabilidade = function(fullId) {

    let criatura = obterCriaturaNoSlot(fullId);

    

    if (criatura && criatura.fichasHabilidade > 0) {

        window.fecharModalAcoes();

        

        // Ativa o Modo Alvo! (A ficha só será gasta se ele clicar no alvo)

        window.modoAlvo = {

            tipo: 'habilidade',

            origem: fullId

        };

        

        window.mostrarMensagemScanner(`🎯 MIRA ATIVA: Clique na criatura alvo para usar a habilidade de ${criatura.nome} (Ou num espaço vazio para cancelar).`);

        if(window.tocarSFX) window.tocarSFX('notificacao');



    } else {

        window.mostrarMensagemScanner("❌ Fichas de habilidade insuficientes!");

    }

};



// 3. PREPARAR MUGIC (Registra quem é o Conjurador sem gastar a ficha)

window.prepararMugic = function(fullId) {

    let criatura = obterCriaturaNoSlot(fullId);

    

    if (criatura && criatura.fichasHabilidade > 0) {

        window.conjuradorMugicAtual = fullId; // Salva o mago escolhido!

        window.fecharModalAcoes();

        window.mostrarMensagemScanner(`🎵 PREPARANDO: ${criatura.nome} está pronto para conjurar. Clique na Magia na lateral direita!`);

        if(window.tocarSFX) window.tocarSFX('notificacao');

    } else {

        window.mostrarMensagemScanner("❌ Fichas insuficientes para conjurar um Mugic!");

    }

};



// 4. USAR MUGIC (CHECA A TRIBO E ABRE A MIRA)

window.descartarMugic = function(index) {

    let mugic = window.jogadorMugics[index];

    if (!mugic) return;



    let conjuradorId = window.conjuradorMugicAtual;

    if (!conjuradorId) {

        window.mostrarMensagemScanner("❌ Erro: Selecione primeiro uma criatura (Usar Mugic) antes de escolher a carta!");

        return;

    }



    let criatura = obterCriaturaNoSlot(conjuradorId);

    if (!criatura || criatura.fichasHabilidade <= 0) return;



    // 🔥 REGRA DA COR (RESTRIÇÃO DE TRIBO) 🔥

    if (mugic.triboRestricao && mugic.triboRestricao.toLowerCase() !== criatura.tribo.toLowerCase()) {

        window.mostrarMensagemScanner(`❌ Falha! O Mugic é da tribo ${mugic.triboRestricao}. ${criatura.nome} (${criatura.tribo}) não pode conjurá-lo!`);

        return;

    }



    document.getElementById('overlay-ver-mugic').remove();



    // Ativa o Modo Alvo para o Mugic!

    window.modoAlvo = {

        tipo: 'mugic',

        origem: conjuradorId,

        mugicIndex: index,

        mugicObj: mugic

    };



    window.mostrarMensagemScanner(`🎯 MIRA ATIVA: Clique na criatura alvo para o ${mugic.nome}... (Ou num vazio para cancelar)`);

    if(window.tocarSFX) window.tocarSFX('notificacao');

};









    







                 // ==========================================

// 📡 PILAR 3: CENTRAL DE RÁDIO ONLINE (O GRANDE SINCRONIZADOR)

// ==========================================



window.ultimaAcaoProcessada = 0; // Memória anti-eco



// 🎤 O TRANSMISSOR: Envia o que você fez para a Nuvem

window.enviarAcaoRede = function(acaoData) {

    if (!window.salaBatalhaAtual || window.salaBatalhaAtual === "sala_simulada") return;

    acaoData.timestamp = Date.now();

    acaoData.remetente = window.souP1Batalha ? 'p1' : 'p2';

    window._dbUpdate('salas_drome/' + window.salaBatalhaAtual, { ultima_acao: acaoData });

};



// 🎧 O RECEPTOR: Fica escutando a Nuvem o tempo todo

window.iniciarEscutaAcoesOnline = function() {

    if (!window.salaBatalhaAtual || window.salaBatalhaAtual === "sala_simulada") return;

    

    // Rádio 1: Escuta as ações pesadas (Movimento final, combate, magias)

    window._dbOn('salas_drome/' + window.salaBatalhaAtual + '/ultima_acao', (snap) => {

        if (!snap.exists()) return;

        let acao = snap.val();

        if (acao.remetente === (window.souP1Batalha ? 'p1' : 'p2')) return;

        if (window.ultimaAcaoProcessada === acao.timestamp) return;

        window.ultimaAcaoProcessada = acao.timestamp;

        window.processarAcaoInimiga(acao);

    });



    // 👻 Rádio 2: O Radar de Fantasmas (Vê a carta do oponente flutuando na tela)

    let inimigo = window.souP1Batalha ? 'p2' : 'p1';

    window._dbOn('salas_drome/' + window.salaBatalhaAtual + '/drag/' + inimigo, (snap) => {

        if (!snap.exists()) return;

        let drag = snap.val();

        let cloneFantasma = document.getElementById('clone-drag-inimigo');

        

        if (drag.ativo) {

            if (!cloneFantasma) {

                cloneFantasma = document.createElement('div');

                cloneFantasma.id = 'clone-drag-inimigo';

                // Cria a carta flutuante com brilho vermelho (inimigo)

                cloneFantasma.style.cssText = 'position:fixed; width:80px; height:115px; background-size:cover; border:2px solid #e53935; border-radius:5px; box-shadow:0 0 20px #e53935; z-index:999998; pointer-events:none; opacity:0.8; transition: transform 0.1s linear, left 0.1s linear, top 0.1s linear;';

                document.body.appendChild(cloneFantasma);

            }

            cloneFantasma.style.backgroundImage = `url('${drag.img}')`;

            

            // 🧠 A GRANDE SACADA: A tela dele é de ponta-cabeça em relação à sua!

            // Se ele move pra BAIXO na tela dele, pra você tem que ir pra CIMA.

            let xInvertido = 100 - drag.x;

            let yInvertido = 100 - drag.y;

            

            // Centraliza a miniatura no mouse invertido

            cloneFantasma.style.left = `calc(${xInvertido}vw - 40px)`;

            cloneFantasma.style.top = `calc(${yInvertido}vh - 57px)`;

            cloneFantasma.style.transform = "scale(1.1)";

        } else {

            // Ele soltou a carta, deleta o fantasma instantaneamente!

            if (cloneFantasma) cloneFantasma.remove();

        }

    });

};



// 🤖 O FANTASMA: Pega o sinal do rádio e mexe as cartas na sua mesa

window.processarAcaoInimiga = function(acao) {

    // 1. MOVIMENTO DE CARTA

    if (acao.tipo === 'mover') {

        let origemReal = acao.origem.replace('jog-', 'op-');

        let destinoReal = acao.destino.replace('jog-', 'op-');

        let criatura = obterCriaturaNoSlot(origemReal);

        setarCriaturaNoSlot(destinoReal, criatura); 

        setarCriaturaNoSlot(origemReal, null); 

        if(criatura) criatura.moveuNesteTurno = true;

        window.mostrarMensagemScanner("O inimigo reposicionou uma criatura!");

        if(window.tocarSFX) window.tocarSFX('notificacao');

        atualizarTelaBatalha();

    }

    // 2. INÍCIO DE COMBATE

    else if (acao.tipo === 'combate') {

        let origemReal = acao.origem.replace('jog-', 'op-');

        let destinoReal = acao.destino.replace('jog-', 'op-').replace('op-', 'jog-'); // O alvo dele sou eu ('jog-')

        let criatura = obterCriaturaNoSlot(origemReal);

        if(criatura) criatura.moveuNesteTurno = true;

        window.mostrarMensagemScanner("⚔️ ALERTA: O INIMIGO INICIOU UM COMBATE!");

        if(typeof window.iniciarCombate === 'function') window.iniciarCombate(origemReal, destinoReal);

        atualizarTelaBatalha();

    }

    // 3. ABERTURA DE CORRENTE (BURST)

    else if (acao.tipo === 'abrir_burst') {

        let acaoInimiga = {

            dono: 'oponente',

            nomeAcao: acao.nomeAcao,

            tipo: 'rede',

            executar: function() { window.mostrarMensagemScanner(`✨ Resolvido: ${acao.nomeAcao}`); }

        };

        window.adicionarAoBurst(acaoInimiga);

    }

    // 4. FECHAMENTO DE CORRENTE (Oponente clicou em NÃO)

    else if (acao.tipo === 'fechar_burst') {

        window.aguardandoResposta = false;

        window.mostrarMensagemScanner("O Oponente não respondeu. Resolvendo a corrente...");

        setTimeout(() => window.resolverBurst(), 1000);

    }

    // 5. SINCRONIZAÇÃO MESTRA DE MESA (Garante que os HPs fiquem iguais pós-dano)

    else if (acao.tipo === 'sincronizar_mesa') {

        // O que é campoJogador para ele, é campoOponente para mim, e vice-versa!

        window.campoJogador = acao.campoOp;

        window.campoOponente = acao.campoJog;

        atualizarTelaBatalha();

    }

};
