// ==========================================
// ⚔️ FLUXO DE ENTRADA DO DROME
// ==========================================

window.estadoDrome = {
    tipoJogo: null, modo: null,
    deckSelecionado: null, amigoDesafiado: null, naFila: false
};

// Helpers Firebase (usa as funções já carregadas pelo script.js via window)
function _dbGet(path) { return window._dbGet(path); }
function _dbSet(path, val) { return window._dbSet(path, val); }
function _dbUpdate(path, val) { return window._dbUpdate(path, val); }
function _dbRemove(path) { return window._dbRemove(path); }
function _dbOn(path, cb) { return window._dbOn(path, cb); }

// ==========================================
// ABRE A TELA DE ENTRADA
// ==========================================
window.abrirEntradaDrome = function() {
    document.getElementById("tela-menu").style.display = "none";
    window.modoMenu = false;
    renderizarPassoTipoJogo();
};

// ==========================================
// PASSO 1: Online ou Amigo
// ==========================================
function renderizarPassoTipoJogo() {
    let tela = document.getElementById("tela-entrada-drome");
    tela.style.display = "flex";
    tela.innerHTML = `
        <p class="titulo-tela" style="margin-top:20px;font-size:14px;letter-spacing:2px;">⚔️ DROME ⚔️</p>
        <p style="color:#4CAF50;font-size:10px;margin-bottom:30px;font-family:monospace;">SELECIONE O MODO DE BATALHA</p>
        <div style="display:flex;flex-direction:column;gap:15px;width:85%;">
            <div class="btn-entrada-drome online" onclick="window.selecionarTipoJogo('online')">
                <span style="font-size:28px;">🌐</span>
                <div>
                    <div style="font-size:13px;font-weight:bold;color:#fff;">JOGAR ONLINE</div>
                    <div style="font-size:9px;color:#aaa;margin-top:3px;">Entra na fila e enfrenta um adversário aleatório</div>
                </div>
            </div>
            <div class="btn-entrada-drome amigo" onclick="window.selecionarTipoJogo('amigo')">
                <span style="font-size:28px;">🤝</span>
                <div>
                    <div style="font-size:13px;font-weight:bold;color:#fff;">JOGAR COM AMIGO</div>
                    <div style="font-size:9px;color:#aaa;margin-top:3px;">Desafie um amigo da sua lista de conexões</div>
                </div>
            </div>
        </div>
        <button class="btn-voltar-pequeno" style="margin-top:40px;" onclick="window.voltarMenuDrome()">Voltar ao Menu</button>
    `;
}

// ==========================================
// PASSO 2: Modo
// ==========================================
function renderizarPassoModo() {
    let tela = document.getElementById("tela-entrada-drome");
    let labelTipo = window.estadoDrome.tipoJogo === 'online' ? '🌐 ONLINE' : '🤝 COM AMIGO';
    tela.innerHTML = `
        <p class="titulo-tela" style="margin-top:20px;font-size:14px;letter-spacing:2px;">⚔️ DROME ⚔️</p>
        <p style="color:#4CAF50;font-size:10px;margin-bottom:5px;font-family:monospace;">${labelTipo}</p>
        <p style="color:#fff;font-size:11px;margin-bottom:25px;">ESCOLHA O MODO DE JOGO</p>
        <div style="display:flex;flex-direction:column;gap:12px;width:85%;">
            <div class="btn-entrada-drome modo" onclick="window.selecionarModo('6x6')">
                <span style="font-size:24px;">⚔️</span>
                <div><div style="font-size:13px;font-weight:bold;color:#fff;">6x6 PRINCIPAL</div><div style="font-size:9px;color:#aaa;margin-top:2px;">6 Criaturas · 6 Mugics · 6 Equips · 20 Ataques · 10 Locais</div></div>
            </div>
            <div class="btn-entrada-drome modo" onclick="window.selecionarModo('3x3')">
                <span style="font-size:24px;">🗡️</span>
                <div><div style="font-size:13px;font-weight:bold;color:#fff;">3x3 RÁPIDO</div><div style="font-size:9px;color:#aaa;margin-top:2px;">3 Criaturas · 3 Mugics · 3 Equips · 20 Ataques · 10 Locais</div></div>
            </div>
            <div class="btn-entrada-drome modo" onclick="window.selecionarModo('1x1')">
                <span style="font-size:24px;">🎯</span>
                <div><div style="font-size:13px;font-weight:bold;color:#fff;">1x1 DUELO</div><div style="font-size:9px;color:#aaa;margin-top:2px;">1 Criatura · 1 Mugic · 1 Equip · 20 Ataques · 10 Locais</div></div>
            </div>
        </div>
        <button class="btn-voltar-pequeno" style="margin-top:30px;" onclick="renderizarPassoTipoJogo()">← Voltar</button>
    `;
}

// ==========================================
// PASSO 3: Escolher Deck
// ==========================================
window.renderizarPassoEscolhaDeck = function() {
    let tela = document.getElementById("tela-entrada-drome");
    let modo = window.estadoDrome.modo;
    tela.innerHTML = `
        <p class="titulo-tela" style="margin-top:20px;font-size:14px;letter-spacing:2px;">⚔️ DROME ⚔️</p>
        <p style="color:#4CAF50;font-size:10px;margin-bottom:5px;font-family:monospace;">MODO ${modo.toUpperCase()}</p>
        <p style="color:#fff;font-size:11px;margin-bottom:20px;">ESCOLHA SEU DECK</p>
        <div id="lista-decks-drome" style="display:flex;flex-direction:column;gap:12px;width:85%;">
            <p style="color:#555;font-size:10px;text-align:center;font-family:monospace;">Carregando decks...</p>
        </div>
        <div id="aviso-deck-irregular" style="display:none;background:rgba(229,57,53,0.15);border:1px solid #e53935;border-radius:8px;padding:10px;width:85%;margin-top:15px;box-sizing:border-box;">
            <p style="color:#ff5555;font-size:10px;font-weight:bold;margin:0 0 5px 0;">⚠️ DECK IRREGULAR</p>
            <p id="texto-irregularidade" style="color:#ffaaaa;font-size:9px;margin:0;line-height:1.4;"></p>
        </div>
        <button id="btn-jogar-drome" style="display:none;margin-top:20px;background:#4CAF50;color:#000;font-weight:bold;font-size:14px;padding:14px;border-radius:8px;border:2px solid #1b5e20;width:85%;cursor:pointer;box-shadow:0 5px 0 #1b5e20;" onclick="window.confirmarEntradaDrome()">⚔️ ENTRAR NO DROME</button>
        <button class="btn-voltar-pequeno" style="margin-top:15px;" onclick="renderizarPassoModo()">← Voltar</button>
    `;
    carregarDecksParaEscolha(modo);
};

function carregarDecksParaEscolha(modo) {
    let lista = document.getElementById("lista-decks-drome");
    if (!lista) return;
    let uid = localStorage.getItem("chaoticUID");

    _dbGet('jogadores/' + uid + '/decks').then(snapshot => {
        lista.innerHTML = "";
        let encontrouAlgum = false;
        
        // Aqui está o segredo: forçar o nome exato que usamos para salvar
        [1, 2, 3].forEach(numSlot => {
            let idFogo = modo + "_" + numSlot; 
            
            let todosOsDecks = snapshot.exists() ? snapshot.val() : {};
            let deckData = todosOsDecks[idFogo] ? todosOsDecks[idFogo] : null;
            
            if (deckData) {
                encontrouAlgum = true;
                let irreg = verificarIrregularidadeDeck(deckData, modo);
                let div = document.createElement("div");
                div.className = "card-deck-drome";
                div.style.borderColor = irreg ? "#e53935" : "#4CAF50";
                div.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
                        <div style="text-align:left;">
                            <div style="font-size:13px;font-weight:bold;color:#fff;">${deckData.nome || 'Deck Sem Nome'}</div>
                            <div style="font-size:9px;color:#aaa;margin-top:3px;">Slot ${numSlot} · Modo ${deckData.modo || modo}</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:18px;">${irreg ? '⚠️' : '✅'}</div>
                            <div style="font-size:8px;color:${irreg ? '#ff5555' : '#4CAF50'};font-weight:bold;">${irreg ? 'IRREGULAR' : 'PRONTO'}</div>
                        </div>
                    </div>
                `;
                div.onclick = () => selecionarDeckDrome(deckData, numSlot, irreg, div);
                lista.appendChild(div);
            } else {
                let div = document.createElement("div");
                div.className = "card-deck-drome vazio";
                div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;width:100%;opacity:0.4;"><div><div style="font-size:12px;font-weight:bold;color:#777;">Slot ${numSlot} — Vazio</div><div style="font-size:9px;color:#555;margin-top:3px;">Nenhum deck ${modo} salvo aqui</div></div><div style="font-size:20px;">🔒</div></div>`;
                lista.appendChild(div);
            }
        });
        if (!encontrouAlgum) {
            lista.innerHTML = `<p style="color:#aaa;font-size:10px;text-align:center;line-height:1.6;">Nenhum deck ${modo} encontrado.<br><span style="color:#4CAF50;">Crie um deck na Oficina primeiro!</span></p>`;
        }
   }).catch((err) => {
        console.error("Erro na leitura da Nuvem:", err); // Agora o console vai fofocar o erro!
        lista.innerHTML = "<p style='color:#ff5555;font-size:10px;text-align:center;'>Falha ao carregar decks!</p>";
    });
}

function verificarIrregularidadeDeck(deck, modo) {
    let p = [];
    
    // 1. O Filtro Base: Exige 20 Ataques e 10 Locais para TODOS os modos (Regra de Ouro)
    let qtdAtaques = deck.ataques ? (Array.isArray(deck.ataques) ? deck.ataques.length : Object.values(deck.ataques).length) : 0;
    let qtdLocais = deck.locais ? (Array.isArray(deck.locais) ? deck.locais.length : Object.values(deck.locais).length) : 0;
    
    if (qtdAtaques !== 20) p.push(`Ataques: ${qtdAtaques}/20`);
    if (qtdLocais !== 10) p.push(`Locais: ${qtdLocais}/10`);
    
    // 2. O Filtro Flexível de Criaturas
    // O jogador pode ir com espaços vazios ("criaturas faltando"). Só precisa de pelo menos 1 para jogar!
    let criaturasVivas = 0;
    
    if (deck.criaturas) {
        let listaCrias = Array.isArray(deck.criaturas) ? deck.criaturas : Object.values(deck.criaturas);
        criaturasVivas = listaCrias.filter(c => c !== null && c !== undefined && String(c).trim() !== "").length;
    }
    
    if (criaturasVivas < 1) p.push(`Criaturas: O deck precisa de pelo menos 1 criatura!`);
    
    return p.length > 0 ? p.join(' · ') : null;
}

function selecionarDeckDrome(deckData, numSlot, irreg, divEl) {
    document.querySelectorAll('.card-deck-drome').forEach(d => d.classList.remove('selecionado'));
    divEl.classList.add('selecionado');
    window.estadoDrome.deckSelecionado = Object.assign({}, deckData, { slot: numSlot });
    let aviso = document.getElementById("aviso-deck-irregular");
    let btn = document.getElementById("btn-jogar-drome");
    if (irreg) {
        aviso.style.display = "block";
        document.getElementById("texto-irregularidade").innerText = irreg;
        if (btn) btn.style.display = "none";
    } else {
        aviso.style.display = "none";
        if (btn) btn.style.display = "block";
    }
}

window.confirmarEntradaDrome = function() {
    if (!window.estadoDrome.deckSelecionado) return;
    
    if (window.estadoDrome.tipoJogo === 'online') {
        // 🔥 MODO ONLINE REATIVADO! (Chama a função da fila do servidor)
        window.mostrarMensagemScanner("Conectando aos servidores do Drome...");
        renderizarFilaOnline(); 
    } 
    else {
        renderizarPassoEscolhaAmigo();
    }
};

// ==========================================
// AJUSTE DINÂMICO DA ARENA DE BATALHA (CALIBRAÇÃO FINAL 1x1)
// ==========================================
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

    // 🔥 Reset base e aplicação de Flex-Start (Cola as cartas na linha divisória)
    [opZona, jogZona].forEach(zona => {
        if(zona) {
            zona.style.display = "flex";
            zona.style.flexDirection = "column";
            zona.style.height = "100%"; // Obriga a zona a encostar na linha divisória
            
            // Gruda as cartas no topo da zona (que visualmente é o centro do tabuleiro)
            zona.style.justifyContent = modo === "6x6" ? "space-evenly" : "flex-start"; 
            zona.style.padding = "0"; 
        }
    });

    // Zera todas as margens antigas
    [opLinha1, opLinha2, opLinha3, jogLinha1, jogLinha2, jogLinha3].forEach(linha => {
        if(linha) { linha.style.marginTop = "0"; linha.style.marginBottom = "0"; }
    });

    if (modo === "6x6") {
        opLinha3.style.display = "flex"; opLinha2.style.display = "flex"; opLinha1.style.display = "flex";
        jogLinha3.style.display = "flex"; jogLinha2.style.display = "flex"; jogLinha1.style.display = "flex";
        
        opMugics.forEach(m => m.style.display = "block");
        jogMugics.forEach(m => m.style.display = "block");
    } 
    else if (modo === "3x3") {
        opLinha3.style.display = "none"; opLinha2.style.display = "flex"; opLinha1.style.display = "flex";
        jogLinha3.style.display = "none"; jogLinha2.style.display = "flex"; jogLinha1.style.display = "flex";
        
        // Mantém o vão que já estava bom no 3x3
        if(jogLinha2) jogLinha2.style.marginTop = "10px";
        if(opLinha2) opLinha2.style.marginTop = "10px";

        opMugics.forEach((m, i) => m.style.display = i >= 3 ? "none" : "block");
        jogMugics.forEach((m, i) => m.style.display = i >= 3 ? "none" : "block");
    } 
    else if (modo.includes("1x1")) {
        opLinha3.style.display = "none"; opLinha2.style.display = "none"; opLinha1.style.display = "flex";
        jogLinha3.style.display = "none"; jogLinha2.style.display = "none"; jogLinha1.style.display = "flex";
        
        // 🔥 CALIBRAÇÃO FINAL DO 1x1: Trocamos margem negativa por POSITIVA
        // Isso vai empurrá-los levemente para longe da linha, criando o vão perfeito.
        if(jogLinha1) jogLinha1.style.marginTop = "2px"; // Empurra o jogador 10px pra baixo
        if(opLinha1) opLinha1.style.marginTop = "2px";   // Empurra o oponente 10px (visualmente) pra cima

        opMugics.forEach((m, i) => m.style.display = i >= 1 ? "none" : "block");
        jogMugics.forEach((m, i) => m.style.display = i >= 1 ? "none" : "block");
    }
}
// ==========================================
// 🌐 TRADUTOR DE DECK PARA O MODO ONLINE
// ==========================================
window.expandirDeckParaOnline = function(deckIds) {
    let deckExpandido = { nome: deckIds.nome, modo: deckIds.modo };
    let expandirArray = (arr) => (arr || []).map(id => id ? window.inventario.find(c => c.id == id) || null : null);
    
    deckExpandido.criaturas_objs = expandirArray(deckIds.criaturas);
    deckExpandido.equipamentos_objs = expandirArray(deckIds.equipamentos);
    deckExpandido.ataques_objs = expandirArray(deckIds.ataques);
    deckExpandido.locais_objs = expandirArray(deckIds.locais);
    deckExpandido.mugics_objs = expandirArray(deckIds.mugics);
    
    return deckExpandido;
};

// ==========================================
// INICIAR PARTIDA (AGORA COM SUPORTE ONLINE)
// ==========================================
function iniciarPartidaDrome(salaId, souP1) {
    clearInterval(window._timerFila);
    window.estadoDrome.naFila = false;
    document.getElementById("tela-entrada-drome").style.display = "none";
    
    window.ajustarTabuleiroBatalha(window.estadoDrome.modo);

    // 🛠️ MÁGICA 2: Manda a ID da Sala pro Tabuleiro baixar os dados da nuvem!
    if (typeof window.carregarDeckParaBatalha === "function") {
        window.carregarDeckParaBatalha(salaId, souP1); 
    }
    
    document.getElementById("tela-batalha").style.display = "flex";
    window.modoMenu = false;
    window.mostrarMensagemScanner("⚔️ ARENA PRONTA!");
}

// ==========================================
// FILA ONLINE
// ==========================================

function renderizarFilaOnline() {
    let tela = document.getElementById("tela-entrada-drome");
    window.estadoDrome.naFila = true;
    
    let modo = window.estadoDrome.modo;
    let uid = localStorage.getItem("chaoticUID");
    let filaPath = 'fila_drome/' + modo; // ESTE É O ENDEREÇO DA FILA

    // 🔥 LOGS DETETIVES: Para podermos investigar os erros de "Fila Eterna"
    console.log("📡 RADAR DE FILA: Tentando entrar na fila:", filaPath);
    console.log("🆔 Meu UID é:", uid);

    tela.innerHTML = `
        <p class="titulo-tela" style="margin-top:30px;font-size:14px;letter-spacing:2px;">⚔️ DROME ONLINE ⚔️</p>
        <p style="color:#4CAF50;font-size:10px;margin-bottom:40px;font-family:monospace;">MODO ${modo.toUpperCase()} · ${window.estadoDrome.deckSelecionado.nome}</p>
        <div style="display:flex;flex-direction:column;align-items:center;gap:20px;">
            <div style="width:80px;height:80px;border:4px solid #4CAF50;border-top-color:transparent;border-radius:50%;animation:girar 1s linear infinite;"></div>
            <p class="texto-carregando" style="font-size:13px;">Procurando adversário...</p>
            <p id="tempo-fila" style="color:#555;font-size:10px;font-family:monospace;">00:00</p>
        </div>
        <button class="btn-voltar-pequeno" style="margin-top:40px;border-color:#e53935;color:#e53935;" onclick="window.cancelarFila()">Cancelar e Voltar</button>
        <style>@keyframes girar{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}</style>
    `;
    let s = 0;
    window._timerFila = setInterval(() => {
        s++;
        let el = document.getElementById("tempo-fila");
        if (el) el.innerText = String(Math.floor(s/60)).padStart(2,'0') + ":" + String(s%60).padStart(2,'0');
    }, 1000);

    let deckPronto = window.expandirDeckParaOnline(window.estadoDrome.deckSelecionado);
    
    // 🎧 RECEPTOR P2: Escuta se alguém puxou você pra uma sala!
    window._dbOn('jogadores/' + uid + '/match_drome', snap => {
        if (!snap.exists() || !window.estadoDrome.naFila) return;
        let match = snap.val();
        console.log("✅ ENCONTREI UMA PARTIDA! Sala:", match.salaId);
        window.cancelarFila(); // Para o cronômetro
        window._dbRemove('jogadores/' + uid + '/match_drome'); // Apaga o convite da nuvem
        iniciarPartidaDrome(match.salaId, false); // P2 ENTRA NA SALA!
    });

    // 📤 TRANSMISSOR: Entra na fila
    window._dbSet(filaPath + '/' + uid, { uid, nome: window.perfilJogador.nome, deck: deckPronto, timestamp: Date.now() });
    
    // 📡 TRANSMISSOR P1: O mais velho na fila cria a sala e chama o P2
    window._dbOn(filaPath, snapshot => {
        if (!snapshot.exists() || !window.estadoDrome.naFila) return;
        
        let dadosFila = snapshot.val();
        let lista = Object.entries(dadosFila).sort((a,b) => a[1].timestamp - b[1].timestamp);
        
        console.log("👥 JOGADORES NA FILA ATUALMENTE:", lista.length, lista);
        
        if (lista.length >= 2) {
            let p1 = lista[0], p2 = lista[1];
            console.log("⚔️ TENTANDO CRIAR SALA ENTRE:", p1[0], "e", p2[0]);
            
            if (p1[0] === uid) {
                console.log("👑 SOU O P1, VOU CRIAR A SALA!");
                let salaId = "online_" + p1[0] + "_" + p2[0];
                window._dbRemove(filaPath + '/' + p1[0]);
                window._dbRemove(filaPath + '/' + p2[0]);
                
                window._dbSet('salas_drome/' + salaId, { 
                    p1: {uid:p1[0],nome:p1[1].nome,deck:p1[1].deck}, 
                    p2: {uid:p2[0],nome:p2[1].nome,deck:p2[1].deck}, 
                    modo: modo, status: "iniciando" 
                });
                
                // 🔥 A MÁGICA: Manda o ID da sala direto pro perfil do P2!
                window._dbSet('jogadores/' + p2[0] + '/match_drome', { salaId: salaId });
                
                window.cancelarFila();
                iniciarPartidaDrome(salaId, true); // P1 ENTRA NA SALA!
            }
        }
    });
}

window.cancelarFila = function() {
    window.estadoDrome.naFila = false;
    clearInterval(window._timerFila);
    let uid = localStorage.getItem("chaoticUID");
    _dbRemove('fila_drome/' + window.estadoDrome.modo + '/' + uid);
    window.renderizarPassoEscolhaDeck();
};

// ==========================================
// ESCOLHER AMIGO
// ==========================================
function renderizarPassoEscolhaAmigo() {
    let tela = document.getElementById("tela-entrada-drome");
    let amigos = window.amigos || [];
    tela.innerHTML = `
        <p class="titulo-tela" style="margin-top:20px;font-size:14px;letter-spacing:2px;">⚔️ DESAFIAR AMIGO ⚔️</p>
        <p style="color:#4CAF50;font-size:10px;margin-bottom:20px;font-family:monospace;">MODO ${window.estadoDrome.modo.toUpperCase()} · ${window.estadoDrome.deckSelecionado.nome}</p>
        <div id="lista-amigos-drome" style="display:flex;flex-direction:column;gap:10px;width:85%;margin-bottom:10px;">
            ${amigos.length === 0 ? '<p style="color:#555;font-size:10px;text-align:center;">Nenhum amigo na lista.</p>' : ''}
        </div>
        <button class="btn-voltar-pequeno" style="margin-top:20px;" onclick="window.renderizarPassoEscolhaDeck()">← Voltar</button>
    `;
    let lista = document.getElementById("lista-amigos-drome");
    amigos.forEach((amigo, i) => {
        let av = (amigo.avatar.startsWith("http
