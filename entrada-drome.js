// ==========================================
// ⚔️ FLUXO DE ENTRADA DO DROME
// ==========================================

// Estado do fluxo
window.estadoDrome = {
    tipoJogo: null,       // 'online' ou 'amigo'
    modo: null,           // '6x6', '3x3', '1x1'
    deckSelecionado: null, // dados do deck escolhido
    amigoDesafiado: null,  // dados do amigo (se for modo amigo)
    naFila: false
};

// ==========================================
// FUNÇÃO PRINCIPAL: Abre a tela de entrada
// ==========================================
window.abrirEntradaDrome = function() {
    document.getElementById("tela-menu").style.display = "none";
    window.modoMenu = false;
    renderizarPassoTipoJogo();
};

// ==========================================
// PASSO 1: Escolher Online ou Amigo
// ==========================================
function renderizarPassoTipoJogo() {
    let tela = document.getElementById("tela-entrada-drome");
    tela.style.display = "flex";

    tela.innerHTML = `
        <p class="titulo-tela" style="margin-top: 20px; font-size: 14px; letter-spacing: 2px;">⚔️ DROME ⚔️</p>
        <p style="color: #4CAF50; font-size: 10px; margin-bottom: 30px; font-family: monospace;">SELECIONE O MODO DE BATALHA</p>

        <div style="display: flex; flex-direction: column; gap: 15px; width: 85%;">

            <div class="btn-entrada-drome online" onclick="selecionarTipoJogo('online')">
                <span style="font-size: 28px;">🌐</span>
                <div>
                    <div style="font-size: 13px; font-weight: bold; color: #fff;">JOGAR ONLINE</div>
                    <div style="font-size: 9px; color: #aaa; margin-top: 3px;">Entra na fila e enfrenta um adversário aleatório</div>
                </div>
            </div>

            <div class="btn-entrada-drome amigo" onclick="selecionarTipoJogo('amigo')">
                <span style="font-size: 28px;">🤝</span>
                <div>
                    <div style="font-size: 13px; font-weight: bold; color: #fff;">JOGAR COM AMIGO</div>
                    <div style="font-size: 9px; color: #aaa; margin-top: 3px;">Desafie um amigo da sua lista de conexões</div>
                </div>
            </div>

        </div>

        <button class="btn-voltar-pequeno" style="margin-top: 40px;" onclick="voltarMenuDrome()">Voltar ao Menu</button>
    `;
}

// ==========================================
// PASSO 2: Escolher Modo (6x6, 3x3, 1x1)
// ==========================================
function renderizarPassoModo() {
    let tela = document.getElementById("tela-entrada-drome");

    let labelTipo = window.estadoDrome.tipoJogo === 'online' ? '🌐 ONLINE' : '🤝 COM AMIGO';

    tela.innerHTML = `
        <p class="titulo-tela" style="margin-top: 20px; font-size: 14px; letter-spacing: 2px;">⚔️ DROME ⚔️</p>
        <p style="color: #4CAF50; font-size: 10px; margin-bottom: 5px; font-family: monospace;">${labelTipo}</p>
        <p style="color: #fff; font-size: 11px; margin-bottom: 25px;">ESCOLHA O MODO DE JOGO</p>

        <div style="display: flex; flex-direction: column; gap: 12px; width: 85%;">

            <div class="btn-entrada-drome modo" onclick="selecionarModo('6x6')">
                <span style="font-size: 24px;">⚔️</span>
                <div>
                    <div style="font-size: 13px; font-weight: bold; color: #fff;">6x6 PRINCIPAL</div>
                    <div style="font-size: 9px; color: #aaa; margin-top: 2px;">6 Criaturas · 6 Mugics · 6 Equips · 20 Ataques · 10 Locais</div>
                </div>
            </div>

            <div class="btn-entrada-drome modo" onclick="selecionarModo('3x3')">
                <span style="font-size: 24px;">🗡️</span>
                <div>
                    <div style="font-size: 13px; font-weight: bold; color: #fff;">3x3 RÁPIDO</div>
                    <div style="font-size: 9px; color: #aaa; margin-top: 2px;">3 Criaturas · 3 Mugics · 3 Equips · 20 Ataques · 10 Locais</div>
                </div>
            </div>

            <div class="btn-entrada-drome modo" onclick="selecionarModo('1x1')">
                <span style="font-size: 24px;">🎯</span>
                <div>
                    <div style="font-size: 13px; font-weight: bold; color: #fff;">1x1 DUELO</div>
                    <div style="font-size: 9px; color: #aaa; margin-top: 2px;">1 Criatura · 1 Mugic · 1 Equip · 20 Ataques · 10 Locais</div>
                </div>
            </div>

        </div>

        <button class="btn-voltar-pequeno" style="margin-top: 30px;" onclick="renderizarPassoTipoJogo()">← Voltar</button>
    `;
}

// ==========================================
// PASSO 3: Escolher o Deck
// ==========================================
window.renderizarPassoEscolhaDeck = function() {
    let tela = document.getElementById("tela-entrada-drome");
    let modo = window.estadoDrome.modo;

    tela.innerHTML = `
        <p class="titulo-tela" style="margin-top: 20px; font-size: 14px; letter-spacing: 2px;">⚔️ DROME ⚔️</p>
        <p style="color: #4CAF50; font-size: 10px; margin-bottom: 5px; font-family: monospace;">MODO ${modo.toUpperCase()}</p>
        <p style="color: #fff; font-size: 11px; margin-bottom: 20px;">ESCOLHA SEU DECK</p>

        <div id="lista-decks-drome" style="display: flex; flex-direction: column; gap: 12px; width: 85%;">
            <p style="color: #555; font-size: 10px; text-align: center; font-family: monospace;">Carregando decks...</p>
        </div>

        <div id="aviso-deck-irregular" style="display: none; background: rgba(229,57,53,0.15); border: 1px solid #e53935; border-radius: 8px; padding: 10px; width: 85%; margin-top: 15px; box-sizing: border-box;">
            <p style="color: #ff5555; font-size: 10px; font-weight: bold; margin: 0 0 5px 0;">⚠️ DECK IRREGULAR</p>
            <p id="texto-irregularidade" style="color: #ffaaaa; font-size: 9px; margin: 0; line-height: 1.4;"></p>
        </div>

        <button id="btn-jogar-drome" style="display: none; margin-top: 20px; background: #4CAF50; color: #000; font-weight: bold; font-size: 14px; padding: 14px; border-radius: 8px; border: 2px solid #1b5e20; width: 85%; cursor: pointer; box-shadow: 0 5px 0 #1b5e20; transition: transform 0.1s, box-shadow 0.1s;" onclick="confirmarEntradaDrome()">
            ⚔️ ENTRAR NO DROME
        </button>

        <button class="btn-voltar-pequeno" style="margin-top: 15px;" onclick="renderizarPassoModo()">← Voltar</button>
    `;

    carregarDecksParaEscolha(modo);
};

// Carrega os decks salvos na nuvem filtrando pelo modo escolhido
function carregarDecksParaEscolha(modo) {
    let lista = document.getElementById("lista-decks-drome");
    if (!lista) return;

    let uid = localStorage.getItem("chaoticUID");
    import("https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js").then(({ get, ref }) => {
        let db = window._firebaseDB;
        if (!db) { lista.innerHTML = "<p style='color:#ff5555; font-size:10px; text-align:center;'>Erro de conexão!</p>"; return; }

        get(ref(db, 'jogadores/' + uid + '/decks')).then(snapshot => {
            lista.innerHTML = "";
            let encontrouAlgum = false;

            [1, 2, 3].forEach(numSlot => {
                let idFogo = modo + "_slot_" + numSlot;
                let deckData = snapshot.exists() && snapshot.val()[idFogo] ? snapshot.val()[idFogo] : null;

                if (deckData) {
                    encontrouAlgum = true;
                    let irregularidade = verificarIrregularidadeDeck(deckData, modo);
                    let corBorda = irregularidade ? "#e53935" : "#4CAF50";
                    let iconStatus = irregularidade ? "⚠️" : "✅";
                    let statusTexto = irregularidade ? "IRREGULAR" : "PRONTO";
                    let corStatus = irregularidade ? "#ff5555" : "#4CAF50";

                    let div = document.createElement("div");
                    div.className = "card-deck-drome";
                    div.style.borderColor = corBorda;
                    div.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                            <div style="text-align: left;">
                                <div style="font-size: 13px; font-weight: bold; color: #fff;">${deckData.nome || 'Deck Sem Nome'}</div>
                                <div style="font-size: 9px; color: #aaa; margin-top: 3px;">Slot ${numSlot} · Modo ${deckData.modo || modo}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 18px;">${iconStatus}</div>
                                <div style="font-size: 8px; color: ${corStatus}; font-weight: bold;">${statusTexto}</div>
                            </div>
                        </div>
                    `;

                    div.onclick = () => selecionarDeckDrome(deckData, numSlot, irregularidade, div);
                    lista.appendChild(div);
                } else {
                    // Slot vazio — aparece bloqueado
                    let div = document.createElement("div");
                    div.className = "card-deck-drome vazio";
                    div.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; opacity: 0.4;">
                            <div style="text-align: left;">
                                <div style="font-size: 12px; font-weight: bold; color: #777;">Slot ${numSlot} — Vazio</div>
                                <div style="font-size: 9px; color: #555; margin-top: 3px;">Nenhum deck ${modo} salvo aqui</div>
                            </div>
                            <div style="font-size: 20px;">🔒</div>
                        </div>
                    `;
                    lista.appendChild(div);
                }
            });

            if (!encontrouAlgum) {
                lista.innerHTML = `
                    <p style="color:#aaa; font-size:10px; text-align:center; line-height:1.6;">
                        Nenhum deck ${modo} encontrado.<br>
                        <span style="color:#4CAF50;">Crie um deck na Oficina primeiro!</span>
                    </p>
                `;
            }
        }).catch(() => {
            lista.innerHTML = "<p style='color:#ff5555; font-size:10px; text-align:center;'>Falha ao carregar decks!</p>";
        });
    });
}

// Verifica se o deck segue as regras e retorna a mensagem de irregularidade (ou null se estiver ok)
function verificarIrregularidadeDeck(deck, modo) {
    let problemas = [];

    // Checa ataques
    if (!deck.ataques || deck.ataques.length !== 20) {
        problemas.push(`Ataques: ${deck.ataques ? deck.ataques.length : 0}/20`);
    }

    // Checa custo de ataques
    if (deck.ataques && deck.ataques.length > 0) {
        let custoTotal = 0;
        deck.ataques.forEach(id => {
            let carta = window.inventario ? window.inventario.find(c => c.id == id) : null;
            if (carta) custoTotal += (parseInt(carta.custo) || 0);
        });
        if (custoTotal !== 20) {
            problemas.push(`Custo de Ataques: ${custoTotal}/20`);
        }
    }

    // Checa locais
    if (!deck.locais || deck.locais.length !== 10) {
        problemas.push(`Locais: ${deck.locais ? deck.locais.length : 0}/10`);
    }

    // Checa criaturas por modo
    let minCriaturas = modo === '6x6' ? 6 : modo === '3x3' ? 3 : 1;
    let criaturasReais = deck.criaturas ? deck.criaturas.filter(c => c !== null).length : 0;
    if (criaturasReais < minCriaturas) {
        problemas.push(`Criaturas: ${criaturasReais}/${minCriaturas}`);
    }

    return problemas.length > 0 ? problemas.join(' · ') : null;
}

// Quando o jogador clica num deck
function selecionarDeckDrome(deckData, numSlot, irregularidade, divElement) {
    // Remove seleção anterior
    document.querySelectorAll('.card-deck-drome').forEach(d => d.classList.remove('selecionado'));
    divElement.classList.add('selecionado');

    window.estadoDrome.deckSelecionado = { ...deckData, slot: numSlot };

    let avisoDiv = document.getElementById("aviso-deck-irregular");
    let btnJogar = document.getElementById("btn-jogar-drome");

    if (irregularidade) {
        avisoDiv.style.display = "block";
        document.getElementById("texto-irregularidade").innerText = irregularidade;
        if (btnJogar) btnJogar.style.display = "none";
    } else {
        avisoDiv.style.display = "none";
        if (btnJogar) btnJogar.style.display = "block";
    }
}

// ==========================================
// PASSO 4A: Confirmar entrada (Online ou Amigo)
// ==========================================
window.confirmarEntradaDrome = function() {
    if (!window.estadoDrome.deckSelecionado) return;

    if (window.estadoDrome.tipoJogo === 'online') {
        renderizarFilaOnline();
    } else {
        renderizarPassoEscolhaAmigo();
    }
};

// ==========================================
// PASSO 4B: Fila Online
// ==========================================
function renderizarFilaOnline() {
    let tela = document.getElementById("tela-entrada-drome");
    window.estadoDrome.naFila = true;

    tela.innerHTML = `
        <p class="titulo-tela" style="margin-top: 30px; font-size: 14px; letter-spacing: 2px;">⚔️ DROME ONLINE ⚔️</p>
        <p style="color: #4CAF50; font-size: 10px; margin-bottom: 40px; font-family: monospace;">MODO ${window.estadoDrome.modo.toUpperCase()} · ${window.estadoDrome.deckSelecionado.nome}</p>

        <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
            <div style="width: 80px; height: 80px; border: 4px solid #4CAF50; border-top-color: transparent; border-radius: 50%; animation: girar 1s linear infinite;"></div>
            <p class="texto-carregando" style="font-size: 13px;">Procurando adversário...</p>
            <p id="tempo-fila" style="color: #555; font-size: 10px; font-family: monospace;">00:00</p>
        </div>

        <div style="margin-top: 50px; background: #112211; border: 1px solid #333; border-radius: 10px; padding: 12px; width: 80%; box-sizing: border-box;">
            <p style="color: #4CAF50; font-size: 9px; font-weight: bold; margin: 0 0 5px 0;">SEU DECK</p>
            <p style="color: #fff; font-size: 11px; font-weight: bold; margin: 0;">${window.estadoDrome.deckSelecionado.nome}</p>
            <p style="color: #aaa; font-size: 9px; margin: 3px 0 0 0;">Modo ${window.estadoDrome.modo} · Slot ${window.estadoDrome.deckSelecionado.slot}</p>
        </div>

        <button class="btn-voltar-pequeno" style="margin-top: 30px; border-color: #e53935; color: #e53935;" onclick="cancelarFila()">Cancelar e Voltar</button>

        <style>
            @keyframes girar { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
    `;

    // Contador de tempo na fila
    let segundos = 0;
    window._timerFila = setInterval(() => {
        segundos++;
        let min = String(Math.floor(segundos / 60)).padStart(2, '0');
        let seg = String(segundos % 60).padStart(2, '0');
        let el = document.getElementById("tempo-fila");
        if (el) el.innerText = min + ":" + seg;
    }, 1000);

    entrarNaFilaFirebase();
}

// Entra na fila no Firebase
function entrarNaFilaFirebase() {
    let uid = localStorage.getItem("chaoticUID");
    let db = window._firebaseDB;
    if (!db) return;

    import("https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js").then(({ ref, set, get, onValue, remove }) => {
        let filaRef = ref(db, 'fila_drome/' + window.estadoDrome.modo);

        set(ref(db, 'fila_drome/' + window.estadoDrome.modo + '/' + uid), {
            uid: uid,
            nome: window.perfilJogador.nome,
            deck: window.estadoDrome.deckSelecionado.nome,
            timestamp: Date.now()
        });

        // Escuta a fila esperando um adversário
        window._unsubFila = onValue(filaRef, (snapshot) => {
            if (!snapshot.exists() || !window.estadoDrome.naFila) return;

            let jogadores = snapshot.val();
            let lista = Object.entries(jogadores);

            // Se tiver 2 ou mais jogadores, o primeiro da lista inicia a partida
            if (lista.length >= 2) {
                let ordenados = lista.sort((a, b) => a[1].timestamp - b[1].timestamp);
                let p1 = ordenados[0];
                let p2 = ordenados[1];

                // Só o P1 (mais antigo na fila) cria a sala
                if (p1[0] === uid) {
                    let salaId = "online_" + uid + "_" + p2[0];

                    // Remove os dois da fila
                    remove(ref(db, 'fila_drome/' + window.estadoDrome.modo + '/' + p1[0]));
                    remove(ref(db, 'fila_drome/' + window.estadoDrome.modo + '/' + p2[0]));

                    // Cria a sala
                    set(ref(db, 'salas_drome/' + salaId), {
                        p1: { uid: p1[0], nome: p1[1].nome, deck: p1[1].deck },
                        p2: { uid: p2[0], nome: p2[1].nome, deck: p2[1].deck },
                        modo: window.estadoDrome.modo,
                        status: "iniciando"
                    });

                    cancelarFila();
                    iniciarPartidaDrome(salaId, true);
                }
            }
        });
    });
}

window.cancelarFila = function() {
    window.estadoDrome.naFila = false;
    clearInterval(window._timerFila);

    let uid = localStorage.getItem("chaoticUID");
    let db = window._firebaseDB;
    if (db) {
        import("https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js").then(({ ref, remove }) => {
            remove(ref(db, 'fila_drome/' + window.estadoDrome.modo + '/' + uid));
        });
    }

    renderizarPassoEscolhaDeck();
};

// ==========================================
// PASSO 4C: Escolher Amigo para Desafiar
// ==========================================
function renderizarPassoEscolhaAmigo() {
    let tela = document.getElementById("tela-entrada-drome");

    let amigos = window.amigos || [];

    tela.innerHTML = `
        <p class="titulo-tela" style="margin-top: 20px; font-size: 14px; letter-spacing: 2px;">⚔️ DESAFIAR AMIGO ⚔️</p>
        <p style="color: #4CAF50; font-size: 10px; margin-bottom: 20px; font-family: monospace;">MODO ${window.estadoDrome.modo.toUpperCase()} · ${window.estadoDrome.deckSelecionado.nome}</p>

        <div id="lista-amigos-drome" style="display: flex; flex-direction: column; gap: 10px; width: 85%; margin-bottom: 10px;">
            ${amigos.length === 0 ? '<p style="color:#555; font-size:10px; text-align:center;">Nenhum amigo na lista.</p>' : ''}
        </div>

        <button class="btn-voltar-pequeno" style="margin-top: 20px;" onclick="window.renderizarPassoEscolhaDeck()">← Voltar</button>
    `;

    let lista = document.getElementById("lista-amigos-drome");
    amigos.forEach((amigo, i) => {
        let avatarHTML = amigo.avatar.startsWith("http") || amigo.avatar.startsWith("data:")
            ? `<div style="width:35px; height:35px; background-image:url('${amigo.avatar}'); background-size:cover; border-radius:50%; border:2px solid #4CAF50; flex-shrink:0;"></div>`
            : `<div style="width:35px; height:35px; background:#000; border-radius:50%; border:2px solid #4CAF50; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0;">${amigo.avatar}</div>`;

        let div = document.createElement("div");
        div.style = "background:#112211; border:1px solid #4CAF50; border-radius:8px; padding:10px; display:flex; justify-content:space-between; align-items:center;";
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                ${avatarHTML}
                <div style="text-align:left;">
                    <div style="color:#fff; font-size:11px; font-weight:bold;">${amigo.nome}</div>
                    <div style="color:#4CAF50; font-size:9px;">🟢 Online</div>
                </div>
            </div>
            <button style="background:#e53935; color:white; border:none; padding:8px 12px; border-radius:5px; font-weight:bold; cursor:pointer; font-size:10px;" onclick="desafiarAmigoDrome(${i})">DESAFIAR</button>
        `;
        lista.appendChild(div);
    });
}

// Envia o desafio para o amigo
window.desafiarAmigoDrome = function(index) {
    let amigo = window.amigos[index];
    window.estadoDrome.amigoDesafiado = amigo;

    let uid = localStorage.getItem("chaoticUID");
    let salaId = "drome_" + uid + "_" + amigo.uid;
    let db = window._firebaseDB;
    if (!db) return;

    import("https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js").then(({ ref, set }) => {
        // Cria a sala
        set(ref(db, 'salas_drome/' + salaId), {
            p1: { uid: uid, nome: window.perfilJogador.nome, deck: window.estadoDrome.deckSelecionado.nome },
            p2: { uid: amigo.uid, nome: amigo.nome, deck: null },
            modo: window.estadoDrome.modo,
            status: "aguardando"
        });

        // Envia notificação para o amigo
        set(ref(db, 'jogadores/' + amigo.uid + '/desafio_drome'), {
            de: uid,
            nome: window.perfilJogador.nome,
            salaId: salaId,
            modo: window.estadoDrome.modo
        });
    });

    renderizarAguardandoAmigo(salaId, amigo.nome);
};

// Tela de espera enquanto o amigo aceita
function renderizarAguardandoAmigo(salaId, nomeAmigo) {
    let tela = document.getElementById("tela-entrada-drome");

    tela.innerHTML = `
        <p class="titulo-tela" style="margin-top: 30px; font-size: 14px; letter-spacing: 2px;">⚔️ AGUARDANDO ⚔️</p>
        <p style="color: #4CAF50; font-size: 10px; margin-bottom: 40px; font-family: monospace;">DESAFIO ENVIADO PARA ${nomeAmigo.toUpperCase()}</p>

        <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
            <div style="font-size: 50px;">⚔️</div>
            <p class="texto-carregando" style="font-size: 12px;">Aguardando resposta...</p>
        </div>

        <button class="btn-voltar-pequeno" style="margin-top: 50px; border-color: #e53935; color: #e53935;" onclick="cancelarDesafioDrome('${salaId}')">Cancelar Desafio</button>
    `;

    // Escuta a sala esperando o amigo aceitar e escolher o deck
    let db = window._firebaseDB;
    if (!db) return;

    import("https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js").then(({ ref, onValue }) => {
        window._unsubDesafio = onValue(ref(db, 'salas_drome/' + salaId), (snapshot) => {
            if (!snapshot.exists()) return;
            let sala = snapshot.val();

            if (sala.status === "pronta") {
                iniciarPartidaDrome(salaId, true);
            } else if (sala.status === "recusado") {
                window.mostrarMensagemScanner(nomeAmigo.toUpperCase() + " RECUSOU O DESAFIO!");
                renderizarPassoEscolhaAmigo();
            }
        });
    });
}

window.cancelarDesafioDrome = function(salaId) {
    let db = window._firebaseDB;
    if (db) {
        import("https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js").then(({ ref, remove, update }) => {
            update(ref(db, 'salas_drome/' + salaId), { status: "cancelado" });
            setTimeout(() => remove(ref(db, 'salas_drome/' + salaId)), 2000);
        });
    }
    renderizarPassoEscolhaAmigo();
};

// ==========================================
// ESCUTA DE DESAFIO RECEBIDO (Para o amigo que foi desafiado)
// ==========================================
window.escutarDesafiosDrome = function() {
    let uid = localStorage.getItem("chaoticUID");
    let db = window._firebaseDB;
    if (!db) return;

    import("https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js").then(({ ref, onValue, set }) => {
        onValue(ref(db, 'jogadores/' + uid + '/desafio_drome'), (snapshot) => {
            if (!snapshot.exists()) return;

            let desafio = snapshot.val();
            set(ref(db, 'jogadores/' + uid + '/desafio_drome'), null);

            // Mostra o modal de desafio recebido
            mostrarModalDesafioDrome(desafio);
        });
    });
};

function mostrarModalDesafioDrome(desafio) {
    if (!document.getElementById("modal-desafio-drome")) {
        let m = document.createElement("div");
        m.id = "modal-desafio-drome";
        m.style.cssText = "display:none; position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,15,0,0.97); z-index:500; justify-content:center; align-items:center; flex-direction:column; padding:20px; box-sizing:border-box; border:2px solid #e53935;";
        document.getElementById("tela-jogo").appendChild(m);
    }

    let m = document.getElementById("modal-desafio-drome");
    m.innerHTML = `
        <p style="color:#e53935; font-weight:bold; font-size:16px; margin-bottom:5px; text-align:center; text-shadow:0 0 5px #e53935;">⚔️ DESAFIO RECEBIDO!</p>
        <p style="color:#fff; font-size:12px; margin-bottom:5px; text-align:center; font-family:monospace;">${desafio.nome.toUpperCase()} te desafiou!</p>
        <p style="color:#4CAF50; font-size:10px; margin-bottom:25px; text-align:center;">Modo: ${desafio.modo.toUpperCase()}</p>
        <div style="display:flex; gap:10px;">
            <button onclick="responderDesafioDrome('recusar', '${desafio.salaId}')" style="background:#e53935; color:white; font-weight:bold; padding:10px 15px; border-radius:5px; cursor:pointer; border:none; font-size:11px; box-shadow:0 0 10px #e53935;">RECUSAR</button>
            <button onclick="responderDesafioDrome('aceitar', '${desafio.salaId}', '${desafio.modo}')" style="background:#4CAF50; color:black; font-weight:bold; padding:10px 15px; border-radius:5px; cursor:pointer; border:none; font-size:11px; box-shadow:0 0 10px #4CAF50;">ACEITAR</button>
        </div>
    `;
    m.style.display = "flex";
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}

window.responderDesafioDrome = function(resposta, salaId, modo) {
    document.getElementById("modal-desafio-drome").style.display = "none";
    let db = window._firebaseDB;
    if (!db) return;

    import("https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js").then(({ ref, update }) => {
        if (resposta === 'recusar') {
            update(ref(db, 'salas_drome/' + salaId), { status: "recusado" });
        } else {
            // Aceita: abre o fluxo de escolha de deck para o amigo
            window.estadoDrome.tipoJogo = 'amigo';
            window.estadoDrome.modo = modo;
            window.estadoDrome._salaIdAceita = salaId;

            document.getElementById("tela-menu").style.display = "none";
            document.getElementById("tela-entrada-drome").style.display = "flex";
            window.modoMenu = false;
            window.renderizarPassoEscolhaDeck();

            // Sobrescreve o botão jogar para essa sala específica
            setTimeout(() => {
                let btn = document.getElementById("btn-jogar-drome");
                if (btn) {
                    btn.onclick = () => {
                        update(ref(db, 'salas_drome/' + salaId), { status: "pronta" });
                        iniciarPartidaDrome(salaId, false);
                    };
                }
            }, 1500);
        }
    });
};

// ==========================================
// INICIAR A PARTIDA DE FATO
// ==========================================
function iniciarPartidaDrome(salaId, souP1) {
    clearInterval(window._timerFila);
    window.estadoDrome.naFila = false;

    document.getElementById("tela-entrada-drome").style.display = "none";
    document.getElementById("tela-batalha").style.display = "flex";
    window.modoMenu = false;

    window.mostrarMensagemScanner("⚔️ PARTIDA INICIADA!");
}

// ==========================================
// VOLTAR AO MENU
// ==========================================
window.voltarMenuDrome = function() {
    document.getElementById("tela-entrada-drome").style.display = "none";
    document.getElementById("tela-menu").style.display = "flex";
    window.modoMenu = true;
    window.estadoDrome = { tipoJogo: null, modo: null, deckSelecionado: null, amigoDesafiado: null, naFila: false };
};

// ==========================================
// FUNÇÕES AUXILIARES DE NAVEGAÇÃO
// ==========================================
window.selecionarTipoJogo = function(tipo) {
    window.estadoDrome.tipoJogo = tipo;
    renderizarPassoModo();
};

window.selecionarModo = function(modo) {
    window.estadoDrome.modo = modo;
    window.renderizarPassoEscolhaDeck();
};

// ==========================================
// EXPÕE O DB DO FIREBASE GLOBALMENTE
// (para que este arquivo possa acessá-lo)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // Aguarda o script.js inicializar o Firebase e expõe o db
    setTimeout(() => {
        // O db já existe no script.js, precisamos expô-lo
        // Adicione window._firebaseDB = db; no script.js logo após inicializar o Firebase
        window.escutarDesafiosDrome();
    }, 1000);
});
