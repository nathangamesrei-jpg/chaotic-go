// ==========================================
// ☁️ CONEXÃO CLOUD (FIREBASE) E MÓDULO PRINCIPAL
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, set, get, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyD9o1B06TShDaO--6-DQsS8abutVXuU_jo",
    authDomain: "chaotic-go.firebaseapp.com",
    databaseURL: "https://chaotic-go-default-rtdb.firebaseio.com", 
    projectId: "chaotic-go",
    storageBucket: "chaotic-go.firebasestorage.app",
    messagingSenderId: "394870191188",
    appId: "1:394870191188:web:5e6040097ec0a4a4d7e9c1"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Verifica Segurança: O jogador está logado?
const uid = localStorage.getItem("chaoticUID");
if (!uid) {
    window.location.href = "login.html"; // Manda de volta pro login se não tiver UID
}

// ==========================================
// 1. VARIÁVEIS GLOBAIS DA NUVEM
// ==========================================
let mapaScanner, marcadorJogador, marcadorMonstro, watchID, circuloRadar;
let localParaViagem = "";
let imgLocalParaViagem = ""; 
let triboLocalParaViagem = ""; 
let modoMenu = true;
let indexSelecionado = 0;
let monstroAtual = null;
let tipoDeCartaAtual = ""; 
let cartaVisualizadaId = null; 

let circulosParaAcertar = 0;
let tempoRestante = 10;
let timerInterval, miraInterval;

// Os dados do jogador agora começam vazios e são preenchidos pela nuvem
window.inventario = []; 
window.perfilJogador = { nome: "Carregando...", avatar: "👤", vitorias: 0, derrotas: 0 };
window.amigos = [];
let amigoAtualTroca = null;
let minhaCartaOfertada = null;

// ==========================================
// 2. SINCRONIZAÇÃO EM TEMPO REAL COM O FIREBASE
// ==========================================

// 2.1 Puxando Perfil
const perfilRef = ref(db, 'jogadores/' + uid);
onValue(perfilRef, (snapshot) => {
    if (snapshot.exists()) {
        window.perfilJogador = snapshot.val();
    } else {
        // O PLANO B: Se a nuvem estiver vazia, cria um perfil básico
        window.perfilJogador = { nome: "Novato(a)", avatar: "👤", vitorias: 0, derrotas: 0 };
    }
    
    // Atualiza a tela se ela estiver aberta
    if (document.getElementById("tela-perfil").style.display === "flex") {
        abrirPerfil();
    }
});

// 2.2 Puxando Álbum (Inventário)
const albumRef = ref(db, 'jogadores/' + uid + '/album');
onValue(albumRef, (snapshot) => {
    if (snapshot.exists()) {
        let dadosNuvem = snapshot.val();
        
        // CÓDIGO DE PROTEÇÃO: Força o Firebase a devolver uma Lista (Array) limpa!
        window.inventario = Array.isArray(dadosNuvem) ? dadosNuvem : Object.values(dadosNuvem);
        window.inventario = window.inventario.filter(item => item !== null && item !== undefined);
        
    } else {
        // PLANO B DO ÁLBUM: Conta nova? Recebe a Cidade de Kiru de brinde!
        window.inventario = [{
            id: Date.now(), 
            nome: "Cidade de Kiru", 
            tribo: "Azul", 
            tipoCarta: "Local", 
            img: "cartas/locais/locais azul/cidade de kiru.jpg", 
            favorito: false, 
            quantidade: 1,
            stats: { c: "-", p: "-", s: "-", v: "-", e: "-" }
        }];
        salvarAlbumNaNuvem(); // Grava o brinde no Firebase na mesma hora!
    }

    // Atualiza a tela de cartas se ela estiver aberta
    if (document.getElementById("tela-album").style.display === "flex") {
        renderizarListaAlbum();
    }
});

// 2.3 Puxando Amigos
const amigosRef = ref(db, 'jogadores/' + uid + '/amigos');
onValue(amigosRef, (snapshot) => {
    if (snapshot.exists()) {
        window.amigos = snapshot.val() || [];
        // Atualiza a lista social se estiver aberta
        if (document.getElementById("tela-social").style.display === "flex") renderizarAmigos();
    } else {
        window.amigos = [];
    }
});
// 2.4 Puxando Pedidos de Amizade (Caixa de Entrada)
window.pedidosAmizade = null;
const pedidosRef = ref(db, 'jogadores/' + uid + '/pedidos');
onValue(pedidosRef, (snapshot) => {
    if (snapshot.exists()) {
        window.pedidosAmizade = snapshot.val();
        // Se a aba social estiver aberta, atualiza na hora pra mostrar o convite!
        if (document.getElementById("tela-social").style.display === "flex") renderizarAmigos();
    } else {
        window.pedidosAmizade = null;
        if (document.getElementById("tela-social").style.display === "flex") renderizarAmigos();
    }
});
// ==========================================
// 2.5 ESCUTANDO CHAMADAS PARA O LOBBY DE TROCA
// ==========================================
let salaTrocaAtual = null;
let souP1 = false; 
let chamadaPendente = null;

const conviteLobbyRef = ref(db, 'jogadores/' + uid + '/chamada_troca');
onValue(conviteLobbyRef, (snapshot) => {
    if (snapshot.exists()) {
        chamadaPendente = snapshot.val();
        
        // Verificação de segurança para garantir que os elementos existem
        const modal = document.getElementById("modal-chamada-troca");
        const texto = document.getElementById("texto-chamada-troca");

        if (modal && texto && chamadaPendente.nome) {
            texto.innerText = chamadaPendente.nome.toUpperCase() + "\nABRIU UM PORTAL DE TROCAS!";
            modal.style.display = "flex";
            
            // Toca um som ou vibra se possível para alertar o jogador
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        }
        
        // Limpa a chamada da nuvem imediatamente para evitar loops
        set(ref(db, 'jogadores/' + uid + '/chamada_troca'), null);
    }
});

// A função que os novos botões do HTML vão acionar
window.responderChamadaTroca = function(resposta) {
    document.getElementById("modal-chamada-troca").style.display = "none";
    
    if (!chamadaPendente) {
        mostrarMensagemScanner("Sinal perdido...");
        return;
    }

    if (resposta === 'aceitar') {
        // MUDA PARA A TELA SOCIAL PRIMEIRO
        abrirSocial(); 
        
        // DEPOIS DE ABRIR A TELA, CHAMA A SALA COM UM PEQUENO ATRASO PARA GARANTIR O RENDER
        setTimeout(() => {
            entrarNaSalaDeTroca(chamadaPendente.salaId, false, chamadaPendente.de, chamadaPendente.nome);
        }, 100); 
        
    } else if (resposta === 'esperar') {
        update(ref(db, 'salas_troca/' + chamadaPendente.salaId), { status: "ocupado" });
        mostrarMensagemScanner("Aviso de 'Aguarde' enviado!");
        
    } else if (resposta === 'recusar') {
        update(ref(db, 'salas_troca/' + chamadaPendente.salaId), { status: "recusado" });
        mostrarMensagemScanner("Chamada rejeitada.");
    }
    
    chamadaPendente = null;
}
// ==========================================
// 3. FUNÇÕES DE SALVAMENTO NA NUVEM
// ==========================================
window.salvarAlbumNaNuvem = function() {
    set(ref(db, 'jogadores/' + uid + '/album'), window.inventario)
        .catch(err => console.error("Erro ao salvar álbum na nuvem:", err));
};

window.salvarPerfilNaNuvem = function() {
    set(ref(db, 'jogadores/' + uid), window.perfilJogador)
        .catch(err => console.error("Erro ao salvar perfil na nuvem:", err));
};

window.salvarAmigosNaNuvem = function() {
    set(ref(db, 'jogadores/' + uid + '/amigos'), window.amigos)
        .catch(err => console.error("Erro ao salvar amigos na nuvem:", err));
};

// Gerador de números fixos baseado em uma semente (Para que todos vejam o mesmo monstro)
function sementeRandom(s) {
    let t = s += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

// ==========================================
// 2. FUNÇÕES DE APOIO E MENSAGEM GLOBAL
// ==========================================
function mostrarMensagemScanner(texto) {
    let cx = document.getElementById("mensagem-global");
    if (!cx) {
        cx = document.createElement("div");
        cx.id = "mensagem-global";
        cx.className = "mensagem-sistema";
        cx.style.position = "absolute";
        cx.style.top = "15px";
        cx.style.left = "50%";
        cx.style.transform = "translateX(-50%)";
        cx.style.zIndex = "9999";
        cx.style.background = "rgba(0, 0, 0, 0.8)";
        cx.style.padding = "5px 15px";
        cx.style.borderRadius = "5px";
        cx.style.border = "1px solid #4CAF50";
        document.getElementById("tela-jogo").appendChild(cx);
    }
    
    cx.innerText = texto;
    cx.classList.add("mostrar");
    setTimeout(() => cx.classList.remove("mostrar"), 2500);
}

function gerarDNA(monstroID) {
    if (typeof MONSTROS === 'undefined') return;
    const dados = MONSTROS.find(m => m.id === monstroID);
    document.getElementById("camada-stats").style.display = "block";

    function sortearMultiploDe5(maximo, minimo = 0) {
        let maxMultiplos = Math.floor(maximo / 5);
        let minMultiplos = Math.floor(minimo / 5);
        let sorteio = Math.floor(Math.random() * ((maxMultiplos - minMultiplos) + 1)) + minMultiplos;
        return sorteio * 5; 
    }

    document.getElementById("stat-coragem").innerText = sortearMultiploDe5(dados.statsMax.coragem);
    document.getElementById("stat-poder").innerText = sortearMultiploDe5(dados.statsMax.poder);
    document.getElementById("stat-sabedoria").innerText = sortearMultiploDe5(dados.statsMax.sabedoria);
    document.getElementById("stat-velocidade").innerText = sortearMultiploDe5(dados.statsMax.velocidade);
    document.getElementById("stat-energia").innerText = sortearMultiploDe5(dados.statsMax.energia, 15);
}

// ==========================================
// 3. SISTEMA DE CARTA HÍBRIDA
// ==========================================
window.abrirDetalheCarta = function(nome, tribo, img, tipo = "local") {
    tipoDeCartaAtual = tipo;
    document.getElementById("imagem-detalhe").src = img;
    
    let btnEsq = document.getElementById("btn-acao-esq"); 
    let btnDir = document.getElementById("btn-acao-dir"); 

    if (tipo === "local") {
        localParaViagem = nome;
        imgLocalParaViagem = img;
        triboLocalParaViagem = tribo;
        document.getElementById("camada-stats").style.display = "none";
        btnEsq.innerText = "VOLTAR";
        btnDir.innerText = "VIAJAR";
    } else if (tipo === "monstro") {
        btnEsq.innerText = "DELETAR";
        btnDir.innerText = "GUARDAR";
    } else if (tipo === "album" || tipo === "inspecao_troca") {
        btnEsq.innerText = "EXCLUIR"; 
        btnDir.innerText = "VOLTAR"; 
        // Na inspeção de troca antes de aceitar, não permitimos excluir
        if(tipo === "inspecao_troca") btnEsq.style.display = "none";
        else btnEsq.style.display = "block";
    }

    document.getElementById("tela-locais").style.display = "none";
    document.getElementById("tela-album").style.display = "none";
    document.getElementById("tela-perfil").style.display = "none";
    if(document.getElementById("tela-social")) document.getElementById("tela-social").style.display = "none"; 
    
    document.getElementById("tela-detalhe-carta").style.display = "flex";
    document.getElementById("painel-botoes-fisicos").style.display = "none";
    document.getElementById("painel-viagem").style.display = "flex";
};

document.getElementById("btn-acao-dir").onclick = function() {
    if (tipoDeCartaAtual === "local") {
        iniciarGPS(); 
    } else if (tipoDeCartaAtual === "monstro") {
        let novaCaptura = {
            id: Date.now(), nome: monstroAtual.nome, tribo: monstroAtual.tribo || "Azul", tipoCarta: "Criatura", 
            img: monstroAtual.cartaBlank, favorito: false, quantidade: 1,
            stats: {
                c: document.getElementById("stat-coragem").innerText, p: document.getElementById("stat-poder").innerText,
                s: document.getElementById("stat-sabedoria").innerText, v: document.getElementById("stat-velocidade").innerText,
                e: document.getElementById("stat-energia").innerText
            }
        };
        inventario.push(novaCaptura);
        salvarAlbumNaNuvem();
        mostrarMensagemScanner("CARTA ARMAZENADA NO ÁLBUM!");
        voltarAoRadar();
    } else if (tipoDeCartaAtual === "album") {
        document.getElementById("tela-detalhe-carta").style.display = "none";
        document.getElementById("painel-viagem").style.display = "none";
        abrirAlbum();
    } else if (tipoDeCartaAtual === "inspecao_troca") {
        document.getElementById("tela-detalhe-carta").style.display = "none";
        document.getElementById("painel-viagem").style.display = "none";
        if(document.getElementById("tela-social")) document.getElementById("tela-social").style.display = "flex";
    }
};

document.getElementById("btn-acao-esq").onclick = function() {
    if (tipoDeCartaAtual === "local") {
        location.reload(); 
    } else if (tipoDeCartaAtual === "monstro") {
        mostrarMensagemScanner("CÓDIGO DE DNA DELETADO!");
        voltarAoRadar();
    } else if (tipoDeCartaAtual === "album") {
        let carta = inventario.find(c => c.id === cartaVisualizadaId);
        if(carta && carta.favorito) document.getElementById("modal-confirmacao").style.display = "flex"; 
        else excluirCartaConfirmada(); 
    }
};

window.cancelarExclusao = function() {
    document.getElementById("modal-confirmacao").style.display = "none";
}

window.excluirCartaConfirmada = function() {
    document.getElementById("modal-confirmacao").style.display = "none";
    let carta = inventario.find(c => c.id === cartaVisualizadaId);
    if (carta && carta.tipoCarta === "Local" && carta.quantidade > 1) {
        carta.quantidade--; mostrarMensagemScanner("UMA CÓPIA EXCLUÍDA!");
    } else {
        inventario = inventario.filter(c => c.id !== cartaVisualizadaId); mostrarMensagemScanner("CARTA EXCLUÍDA!");
    }
    salvarAlbumNaNuvem(); 
    document.getElementById("tela-detalhe-carta").style.display = "none";
    document.getElementById("painel-viagem").style.display = "none";
    abrirAlbum(); 
}

function voltarAoRadar() {
    setTimeout(() => {
        document.getElementById("tela-detalhe-carta").style.display = "none";
        document.getElementById("painel-viagem").style.display = "none";
        document.getElementById("tela-mapa").style.display = "flex";
        document.getElementById("painel-botoes-fisicos").style.display = "flex";
        
        // Em vez de gerar um novo no mesmo lugar (como antes), apenas deixamos o mapa ativo
        // O motor de spawn passivo cuidará de gerar novos quando o jogador andar
    }, 1500);
}

// ==========================================
// 4. LÓGICA DO MINI-GAME E RADAR
// ==========================================
function iniciarMinigame(monstro) {
    monstroAtual = monstro;
    modoMenu = false;
    document.getElementById("tela-mapa").style.display = "none";
    document.getElementById("tela-minigame").style.display = "block";
    document.getElementById("fundo-cena-minigame").src = CENARIOS[localParaViagem] || "";
    document.getElementById("monstro-cena").src = monstro.iconeMapa;
    circulosParaAcertar = 4;
    tempoRestante = 10;
    document.getElementById("alvo-container").innerHTML = "";
    document.getElementById("timer-progresso").style.width = "100%";
    
    for(let i=0; i<4; i++) {
        let alvo = document.createElement("div");
        alvo.className = "alvo-circulo";
        alvo.style.top = (25 + Math.random() * 50) + "%";
        alvo.style.left = (25 + Math.random() * 50) + "%";
        document.getElementById("alvo-container").appendChild(alvo);
    }
    timerInterval = setInterval(() => {
        tempoRestante -= 0.1;
        document.getElementById("segundos").innerText = Math.ceil(tempoRestante);
        document.getElementById("timer-progresso").style.width = (tempoRestante * 10) + "%";
        if(tempoRestante <= 0) finalizarMinigame(false);
    }, 100);
    miraInterval = setInterval(() => {
        let mira = document.getElementById("mira-vermelha");
        mira.style.top = (10 + Math.random() * 80) + "%";
        mira.style.left = (10 + Math.random() * 80) + "%";
    }, 400);
}

function verificarAcerto() {
    let mira = document.getElementById("mira-vermelha");
    let alvos = document.querySelectorAll(".alvo-circulo:not(.atingido)");
    let rectMira = mira.getBoundingClientRect();
    let centroMiraX = rectMira.left + (rectMira.width / 2);
    let centroMiraY = rectMira.top + (rectMira.height / 2);

    alvos.forEach(alvo => {
        let rectAlvo = alvo.getBoundingClientRect();
        let centroAlvoX = rectAlvo.left + (rectAlvo.width / 2);
        let centroAlvoY = rectAlvo.top + (rectAlvo.height / 2);
        let dist = Math.sqrt(Math.pow(centroMiraX - centroAlvoX, 2) + Math.pow(centroMiraY - centroAlvoY, 2));
        if(dist < 45) { 
            alvo.classList.add("atingido");
            circulosParaAcertar--;
            mira.style.borderColor = "#00ff00";
            setTimeout(() => { mira.style.borderColor = "#ff5555"; }, 200);
            if(circulosParaAcertar <= 0) finalizarMinigame(true);
        }
    });
}

function finalizarMinigame(vitoria) {
    clearInterval(timerInterval);
    clearInterval(miraInterval);
    
    // O monstro é removido do mapa pela função criarMarcadorMonstro agora
    
    if(vitoria) {
        mostrarMensagemScanner("SINCRONIZAÇÃO COMPLETA!");
        setTimeout(() => {
            document.getElementById("tela-minigame").style.display = "none";
            gerarDNA(monstroAtual.id);
            abrirDetalheCarta(monstroAtual.nome, monstroAtual.tribo, monstroAtual.cartaBlank, "monstro");
        }, 1500);
    } else {
        mostrarMensagemScanner("SINAL PERDIDO - A CRIATURA FUGIU!");
        setTimeout(() => {
            document.getElementById("tela-minigame").style.display = "none";
            document.getElementById("tela-mapa").style.display = "flex";
        }, 2000);
    }
}

// ==========================================
// 4. LÓGICA DO RADAR, BIOMAS E SPAWN (ESTILO POKÉMON GO)
// ==========================================

let marcadoresMonstros = [];
let ultimaLatSpawn = 0;
let ultimaLonSpawn = 0;

// Calcula a distância real em metros entre duas coordenadas (Fórmula de Haversine)
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Raio da Terra em metros
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Retorna em metros
}

function criarMarcadorMonstro(latM, lonM, sorteado, ehPassivo = false) {
    let icone = L.icon({ iconUrl: sorteado.iconeMapa, iconSize: [45, 45], iconAnchor: [22, 22] });
    
    let novoMarcador = L.marker([latM, lonM], { 
        icon: icone, 
        opacity: ehPassivo ? 0.8 : 1.0 
    }).addTo(mapaScanner);
    
    novoMarcador.on('click', () => {
        // === NOVA TRAVA DE DISTÂNCIA ===
        if (marcadorJogador) {
            let posJogador = marcadorJogador.getLatLng();
            let distancia = calcularDistancia(posJogador.lat, posJogador.lng, latM, lonM);
            
            // 100 é o raio do seu círculo azul. Se estiver maior, bloqueia!
            if (distancia > 100) {
                mostrarMensagemScanner(`FORA DE ALCANCE! Ande mais ${Math.ceil(distancia - 100)}m para escanear.`);
                return; // Aborta a função e impede o minigame de abrir
            }
        }
        // ===============================

        iniciarMinigame(sorteado);
        mapaScanner.removeLayer(novoMarcador);
        marcadoresMonstros = marcadoresMonstros.filter(m => m !== novoMarcador);
    });
    
    marcadoresMonstros.push(novoMarcador);
}

function spawnMonstrosNaArea(lat, lon, forcarPassivo = false) {
    if (typeof MONSTROS === 'undefined' || MONSTROS.length === 0) return;

    // Filtra pela tribo do Local
    let listaFiltrada = MONSTROS.filter(m => !triboLocalParaViagem || triboLocalParaViagem === "Qualquer" || m.tribo === triboLocalParaViagem);
    if (listaFiltrada.length === 0) listaFiltrada = MONSTROS; 

    let agora = new Date();
    
    // CORREÇÃO: Transforma o nome do local e a hora em um NÚMERO REAL para a matemática não dar zero
    let textoSemente = localParaViagem + agora.getDate() + agora.getHours();
    let sementeBase = 0;
    for (let k = 0; k < textoSemente.length; k++) {
        sementeBase = Math.imul(31, sementeBase) + textoSemente.charCodeAt(k) | 0;
    }
    sementeBase = Math.abs(sementeBase); // Garante que seja positivo
    
    // 1. SPAWN FIXO (Estilo "Ninho" - Igual para todos)
    if (forcarPassivo === false) {
        marcadoresMonstros.forEach(m => mapaScanner.removeLayer(m));
        marcadoresMonstros = [];

        // Agora geramos 6 criaturas BEM espalhadas
        for (let i = 0; i < 6; i++) {
            let sementeUnica = sementeBase + (i * 150); // Multiplicador para não repetir
            
            // Sorteia qual monstro vai aparecer (Agora o Promos aparece!)
            let indexMonstro = Math.floor(sementeRandom(sementeUnica) * listaFiltrada.length);
            const sorteado = listaFiltrada[indexMonstro];
            
            // Espalha as coordenadas (raio de aprox. 1.5km a 2km)
            let offLat = (sementeRandom(sementeUnica + 200) - 0.5) * 0.02;
            let offLon = (sementeRandom(sementeUnica + 300) - 0.5) * 0.02;
            
            criarMarcadorMonstro(lat + offLat, lon + offLon, sorteado, false);
        }
    }

    // 2. SPAWN PASSIVO (Estilo "Caminhada" - Só para você)
    if (forcarPassivo) {
        let sorteioRaridade = Math.random();
        let listaRaridade = listaFiltrada.filter(m => m.raridade >= sorteioRaridade);
        const sorteadoPassivo = listaRaridade.length > 0 ? listaRaridade[Math.floor(Math.random() * listaRaridade.length)] : listaFiltrada[0];

        // Aparece colado em você (aprox. 30 metros)
        let offLat = (Math.random() - 0.5) * 0.0003;
        let offLon = (Math.random() - 0.5) * 0.0003;
        
        criarMarcadorMonstro(lat + offLat, lon + offLon, sorteadoPassivo, true);
        
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        mostrarMensagemScanner("⚠️ UMA CRIATURA SELVAGEM APARECEU!");
    }
}

window.iniciarGPS = function() {
    document.getElementById("tela-detalhe-carta").style.display = "none";
    document.getElementById("painel-viagem").style.display = "none";
    document.getElementById("tela-mapa").style.display = "flex";
    document.getElementById("painel-botoes-fisicos").style.display = "flex";

    document.getElementById("texto-carregando").style.display = "block";
    document.getElementById("meu-mapa").style.display = "none";

    let tempoUltimoSpawn = Date.now();

    watchID = navigator.geolocation.watchPosition((pos) => {
        let lat = pos.coords.latitude; 
        let lon = pos.coords.longitude;

        document.getElementById("texto-carregando").style.display = "none";
        document.getElementById("meu-mapa").style.display = "block";
        document.getElementById("btn-sair-radar").style.display = "block";

        if (!mapaScanner) {
            mapaScanner = L.map('meu-mapa', { zoomControl: false }).setView([lat, lon], 16);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(mapaScanner);
            
            let corRadar = triboLocalParaViagem === "Azul" ? "#00ccff" : "#ff3300"; 
            circuloRadar = L.circle([lat, lon], { color: corRadar, radius: 100, fillOpacity: 0.1 }).addTo(mapaScanner);
            marcadorJogador = L.circleMarker([lat, lon], { radius: 8, fillColor: corRadar, color: "#fff", fillOpacity: 1 }).addTo(mapaScanner);
            
            spawnMonstrosNaArea(lat, lon, false);
            ultimaLatSpawn = lat;
            ultimaLonSpawn = lon;

        } else {
            marcadorJogador.setLatLng([lat, lon]);
            circuloRadar.setLatLng([lat, lon]);
            mapaScanner.panTo([lat, lon]);
            
            let distanciaAndada = calcularDistancia(ultimaLatSpawn, ultimaLonSpawn, lat, lon);
            let tempoPassado = Date.now() - tempoUltimoSpawn;

            // Gera spawn passivo a cada 100m andados OU 3 minutos parado
            if (distanciaAndada > 50 || tempoPassado > 60000) {
                spawnMonstrosNaArea(lat, lon, true); 
                ultimaLatSpawn = lat;
                ultimaLonSpawn = lon;
                tempoUltimoSpawn = Date.now();
            }
        }
    }, (err) => {
        console.error("Erro no GPS: ", err);
        mostrarMensagemScanner("SINAL DE GPS FRACO!");
    }, {
        enableHighAccuracy: true, 
        maximumAge: 10000, 
        timeout: 10000 
    });
};

function escanearLocalAtual() {
    let localExistente = inventario.find(c => c.nome === localParaViagem && c.tipoCarta === "Local");
    if (localExistente) {
        localExistente.quantidade = (localExistente.quantidade || 1) + 1;
    } else {
        let novoLocal = {
            id: Date.now(), 
            nome: localParaViagem, 
            tribo: triboLocalParaViagem || "Qualquer", 
            tipoCarta: "Local", 
            img: imgLocalParaViagem, 
            favorito: false, 
            quantidade: 1, 
            stats: { c: "-", p: "-", s: "-", v: "-", e: "-" } 
        };
        inventario.push(novoLocal);
    }
    salvarAlbumNaNuvem();
    
    let mapaTela = document.getElementById("tela-mapa");
    mapaTela.style.boxShadow = "inset 0 0 50px #4CAF50";
    setTimeout(() => { mapaTela.style.boxShadow = "none"; }, 500);
    
    mostrarMensagemScanner("LOCAL ESCANEADO E SALVO!");
}

// ==========================================
// DESCONEXÃO DO GPS E SAÍDA DO RADAR
// ==========================================
let btnSairRadar = document.getElementById("btn-sair-radar");
if (btnSairRadar) {
    btnSairRadar.onclick = () => {
        if (typeof watchID !== 'undefined' && watchID !== null) {
            navigator.geolocation.clearWatch(watchID);
            console.log("Sinal de GPS encerrado pelo Scanner.");
        }
        location.reload();
    };
}

// ==========================================
// 6. SISTEMA DE MENU E ÁLBUM
// ==========================================
let apps = document.querySelectorAll(".app-icone");
apps.forEach((app, index) => {
    app.onclick = function() {
        if (modoMenu) {
            indexSelecionado = index;
            atualizarSelecao();
            if (index === 0) {
                document.getElementById("tela-menu").style.display = "none";
                document.getElementById("tela-locais").style.display = "flex";
                modoMenu = false;
            } else if (index === 1) {
                abrirAlbum(); 
            } else if (index === 3) {
                abrirSocial(); 
            } else if (index === 4) {
                abrirPerfil();
            } else {
                mostrarMensagemScanner("Módulo em desenvolvimento...");
            }
        }
    };
});

function atualizarSelecao() {
    apps.forEach(app => app.classList.remove("app-selecionado"));
    if(apps[indexSelecionado]) apps[indexSelecionado].classList.add("app-selecionado");
}

function abrirAlbum() {
    document.getElementById("tela-menu").style.display = "none";
    let telaAlbum = document.getElementById("tela-album");
    if(telaAlbum) {
        telaAlbum.style.display = "flex";
        modoMenu = false;
        renderizarListaAlbum(); 
    }
}

document.getElementById("filtro-nome").addEventListener("input", renderizarListaAlbum);
document.getElementById("filtro-tribo").addEventListener("change", renderizarListaAlbum);
document.getElementById("filtro-tipo").addEventListener("change", renderizarListaAlbum); 

function renderizarListaAlbum() {
    const lista = document.getElementById("lista-cartas");
    lista.innerHTML = ""; 
    let termo = document.getElementById("filtro-nome").value.toLowerCase();
    let triboFiltro = document.getElementById("filtro-tribo").value;
    let tipoFiltro = document.getElementById("filtro-tipo").value;

    let filtrados = inventario.filter(item => {
        let bateNome = item.nome.toLowerCase().includes(termo);
        let bateTribo = triboFiltro === "Todas" || (item.tribo && item.tribo === triboFiltro);
        let tipoDaCarta = item.tipoCarta || "Criatura";
        let bateTipo = tipoFiltro === "Todas" || tipoDaCarta === tipoFiltro;
        return bateNome && bateTribo && bateTipo;
    });

    if (filtrados.length === 0) {
        lista.innerHTML = "<p style='font-size: 10px; color: #666; text-align:center; padding: 20px;'>Nenhuma carta encontrada...</p>";
        return;
    }

    filtrados.forEach((item) => {
        let div = document.createElement("div");
        div.style = "background: #112211; border: 1px solid #4CAF50; padding: 8px; border-radius: 8px; display: flex; align-items: center; gap: 10px; position: relative; margin-bottom: 8px;";
        let estrela = item.favorito ? "⭐" : "☆";
        let corEstrela = item.favorito ? "#ffd700" : "#4CAF50";
        let qtd = item.quantidade || 1;
        let detalhesCarta = "";
        
        if (item.tipoCarta === "Local") {
            detalhesCarta = `<div style="font-size: 10px; color: #4CAF50; margin-top: 4px;">TIPO: LOCAL<br><span style="font-weight: bold; color: white;">CÓPIAS NO DECK: ${qtd}</span></div>`;
        } else {
            detalhesCarta = `<div style="font-size: 8.5px; color: #4CAF50; line-height: 1.3;">Energia: ${item.stats.e} | Coragem: ${item.stats.c}<br>Poder: ${item.stats.p} | Sabedoria: ${item.stats.s}<br>Velocidade: ${item.stats.v}</div>`;
        }

        div.innerHTML = `
            <div style="position: absolute; top: 8px; right: 10px; font-size: 16px; cursor: pointer; color: ${corEstrela};" onclick="toggleFavorito(${item.id}, event)">${estrela}</div>
            <img src="${item.img}" style="width: 50px; border-radius: 4px; cursor: pointer;" onclick="verCartaAlbum(${item.id})">
            <div style="text-align: left; cursor: pointer; flex: 1;" onclick="verCartaAlbum(${item.id})">
                <b style="font-size: 13px; color: #fff; display: block; margin-bottom: 4px;">${item.nome}</b>
                ${detalhesCarta}
            </div>
        `;
        lista.appendChild(div);
    });
}

window.toggleFavorito = function(id, event) {
    event.stopPropagation(); 
    let carta = inventario.find(c => c.id === id);
    if(carta) {
        carta.favorito = !carta.favorito;
        salvarAlbumNaNuvem(); // Correção: Aqui ainda estava localStorage
        renderizarListaAlbum(); 
    }
}

window.verCartaAlbum = function(id) {
    let carta = inventario.find(c => c.id === id);
    if(!carta) return;
    cartaVisualizadaId = id; 
    abrirDetalheCarta(carta.nome, carta.tribo, carta.img, "album");
    
    if (carta.tipoCarta === "Local") {
        document.getElementById("camada-stats").style.display = "none";
    } else {
        document.getElementById("camada-stats").style.display = "block";
        document.getElementById("stat-coragem").innerText = carta.stats.c;
        document.getElementById("stat-poder").innerText = carta.stats.p;
        document.getElementById("stat-sabedoria").innerText = carta.stats.s;
        document.getElementById("stat-velocidade").innerText = carta.stats.v;
        document.getElementById("stat-energia").innerText = carta.stats.e;
    }
}

let btnVoltarAlbum = document.getElementById("btn-voltar-album");
if(btnVoltarAlbum) { btnVoltarAlbum.onclick = () => location.reload(); }

// ==========================================
// 7. SISTEMA DE PERFIL DO JOGADOR
// ==========================================
function abrirPerfil() {
    document.getElementById("tela-menu").style.display = "none";
    document.getElementById("tela-perfil").style.display = "flex";
    modoMenu = false;

    document.getElementById("nome-jogador").innerText = perfilJogador.nome + " ✏️";
    
    let hashId = 0; 
    for(let i=0; i<perfilJogador.nome.length; i++) hashId += perfilJogador.nome.charCodeAt(i);
    document.getElementById("id-jogador").innerText = "#" + (hashId * 7).toString().padStart(4, '0').substring(0,4);

    let avatarBox = document.getElementById("avatar-jogador");
    if(perfilJogador.avatar.startsWith("http") || perfilJogador.avatar.startsWith("data:image")) {
        avatarBox.innerHTML = "";
        avatarBox.style.backgroundImage = `url('${perfilJogador.avatar}')`;
    } else {
        avatarBox.style.backgroundImage = "none";
        avatarBox.innerHTML = perfilJogador.avatar;
    }

    document.getElementById("stat-vitorias").innerText = perfilJogador.vitorias;
    document.getElementById("stat-derrotas").innerText = perfilJogador.derrotas;

    let totalCartas = 0, totalCriaturas = 0, totalLocais = 0;
    let totalMagias = 0, totalEquips = 0, totalAtaques = 0;
    let contagemTribos = {};

    inventario.forEach(item => {
        let qtd = item.quantidade || 1;
        totalCartas += qtd;
        
        let tipo = item.tipoCarta || "Criatura";
        if(tipo === "Criatura") totalCriaturas += qtd;
        if(tipo === "Local") totalLocais += qtd;
        if(tipo === "Magia") totalMagias += qtd;
        if(tipo === "Equipamento") totalEquips += qtd;
        if(tipo === "Ataque") totalAtaques += qtd;
        
        if(item.tribo) {
            contagemTribos[item.tribo] = (contagemTribos[item.tribo] || 0) + qtd;
        }
    });

    let triboDominante = "NENHUMA";
    let max = 0;
    for(let tribo in contagemTribos) {
        if(contagemTribos[tribo] > max) {
            max = contagemTribos[tribo];
            triboDominante = tribo.toUpperCase();
        }
    }

    document.getElementById("estatisticas-perfil").innerHTML = `
        <div class="perfil-stats-grid">
            <div class="stat-box">Cartas Totais<span>${totalCartas}</span></div>
            <div class="stat-box">Afinidade<span>${triboDominante}</span></div>
            <div class="stat-box">Criaturas<span>${totalCriaturas}</span></div>
            <div class="stat-box">Locais<span>${totalLocais}</span></div>
            <div class="stat-box">Ataques<span>${totalAtaques}</span></div>
            <div class="stat-box">Magias<span>${totalMagias}</span></div>
            <div class="stat-box">Equips<span>${totalEquips}</span></div>
        </div>
    `;
}

document.getElementById("upload-foto").addEventListener("change", function(event) {
    let file = event.target.files[0];
    if(!file) return;

    let reader = new FileReader();
    reader.onload = function(e) {
        let img = new Image();
        img.onload = function() {
            let canvas = document.createElement("canvas");
            let MAX_WIDTH = 150;
            let MAX_HEIGHT = 150;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            } else {
                if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
            }

            canvas.width = width; canvas.height = height;
            let ctxCanvas = canvas.getContext("2d");
            ctxCanvas.drawImage(img, 0, 0, width, height);

            let base64Comprimido = canvas.toDataURL("image/jpeg", 0.7);
            document.getElementById("input-novo-avatar").value = base64Comprimido;
            mostrarMensagemScanner("FOTO CARREGADA E COMPRIMIDA!");
        }
        img.src = e.target.result;
    }
    reader.readAsDataURL(file);
});

window.abrirModalPerfil = function() {
    document.getElementById("input-novo-nome").value = perfilJogador.nome;
    if(perfilJogador.avatar.startsWith("http") || perfilJogador.avatar.startsWith("data:image")) {
        document.getElementById("input-novo-avatar").value = "";
    } else {
        document.getElementById("input-novo-avatar").value = perfilJogador.avatar === "👤" ? "" : perfilJogador.avatar;
    }
    document.getElementById("modal-editar-perfil").style.display = "flex";
}

window.fecharModalPerfil = function() {
    document.getElementById("modal-editar-perfil").style.display = "none";
}

window.salvarEdicaoPerfil = function() {
    let nNome = document.getElementById("input-novo-nome").value.trim();
    let nAvatar = document.getElementById("input-novo-avatar").value.trim();
    
    if(nNome !== "") perfilJogador.nome = nNome;
    if(nAvatar !== "") perfilJogador.avatar = nAvatar;
    else if (perfilJogador.avatar === "") perfilJogador.avatar = "👤"; 
    
    salvarPerfilNaNuvem(); // Correção: Agora salva os dados de perfil corretamente
    fecharModalPerfil();
    abrirPerfil(); 
}

let btnVoltarPerfil = document.getElementById("btn-voltar-perfil");
if(btnVoltarPerfil) { btnVoltarPerfil.onclick = () => location.reload(); }

// ==========================================
// 8. REDE SOCIAL E TROCAS (EASTER EGG JOHNES)
// ==========================================
function abrirSocial() {
    // 1. MODO LIMPEZA TOTAL: Desliga TODAS as outras telas antes de abrir a Social
    document.getElementById("tela-menu").style.display = "none";
    document.getElementById("tela-mapa").style.display = "none";
    document.getElementById("tela-locais").style.display = "none";
    document.getElementById("tela-album").style.display = "none";
    document.getElementById("tela-perfil").style.display = "none";
    document.getElementById("tela-minigame").style.display = "none";
    document.getElementById("painel-viagem").style.display = "none";

    // 2. LIGA SÓ A TELA SOCIAL
    document.getElementById("tela-social").style.display = "flex";
    document.getElementById("painel-botoes-fisicos").style.display = "flex";
    
    modoMenu = false;
    renderizarAmigos();
}

window.adicionarAmigo = function() {
    let busca = document.getElementById("input-add-amigo").value.trim();
    if(busca.length < 3) { mostrarMensagemScanner("DIGITE UM NOME OU ID VÁLIDO!"); return; }

    // ==========================================
    // 🥚 EASTER EGG: CÓDIGO SECRETO JOHNES MAX
    // ==========================================
    if (busca.toUpperCase() === "#JOHNES") {
        let johnesBase = typeof MONSTROS !== 'undefined' ? MONSTROS.find(m => m.nome === "Johnes") : null;
        if (johnesBase) {
            let johnesMax = {
                id: Date.now(), 
                nome: johnesBase.nome + " (Max)", // Adiciona um selo especial no nome
                tribo: johnesBase.tribo, 
                tipoCarta: "Criatura", 
                img: johnesBase.cartaBlank, 
                favorito: true, // Já vem favoritado por ser épico!
                quantidade: 1,
                stats: {
                    c: johnesBase.statsMax.coragem, 
                    p: johnesBase.statsMax.poder,
                    s: johnesBase.statsMax.sabedoria, 
                    v: johnesBase.statsMax.velocidade, 
                    e: johnesBase.statsMax.energia
                }
            };
            window.inventario.push(johnesMax);
            salvarAlbumNaNuvem();
            document.getElementById("input-add-amigo").value = "";
            mostrarMensagemScanner("EASTER EGG: JOHNES FULL STATUS DESBLOQUEADO!");
            return; // Aborta a busca na nuvem, pois era um código secreto!
        }
    }
    // ==========================================

    document.getElementById("input-add-amigo").value = "Buscando na Nuvem...";

    // Vai na nuvem procurar todos os jogadores
    get(ref(db, 'jogadores')).then((snapshot) => {
        document.getElementById("input-add-amigo").value = "";
        
        if (snapshot.exists()) {
            let todosJogadores = snapshot.val();
            let jogadorEncontrado = null;
            let uidEncontrado = null;
            
            // Verifica se o jogador digitou um ID (começa com # e não é o Easter Egg)
            let isBuscaPorID = busca.startsWith("#");

            // Varredura no banco de dados
            for (let idNuvem in todosJogadores) {
                let jog = todosJogadores[idNuvem];
                
                if (isBuscaPorID) {
                    let hashId = 0;
                    for(let i=0; i<jog.nome.length; i++) hashId += jog.nome.charCodeAt(i);
                    let idVisual = "#" + (hashId * 7).toString().padStart(4, '0').substring(0,4);
                    
                    if (idVisual === busca) {
                        jogadorEncontrado = jog;
                        uidEncontrado = idNuvem;
                        break; 
                    }
                } else {
                    if (jog.nome.toLowerCase() === busca.toLowerCase()) {
                        jogadorEncontrado = jog;
                        uidEncontrado = idNuvem;
                        break; 
                    }
                }
            }

            if (jogadorEncontrado) {
                if (uidEncontrado === uid) { mostrarMensagemScanner("NÃO PODE ADICIONAR A SI MESMO!"); return; }
                
                let jaAmigo = amigos.find(a => a.uid === uidEncontrado);
                if (jaAmigo) { mostrarMensagemScanner("JÁ ESTÁ NA SUA LISTA!"); return; }

                // Cria a "carta de solicitação" para enviar
                let meuPedido = {
                    uid: uid, 
                    nome: perfilJogador.nome,
                    avatar: perfilJogador.avatar
                };

                // Envia direto para a "caixa de entrada" do amigo
                set(ref(db, 'jogadores/' + uidEncontrado + '/pedidos/' + uid), meuPedido)
                    .then(() => mostrarMensagemScanner("PEDIDO ENVIADO PARA " + jogadorEncontrado.nome.toUpperCase() + "!"));
            } else {
                mostrarMensagemScanner("SINAL PERDIDO! JOGADOR OU ID NÃO ENCONTRADO.");
            }
        }
    }).catch(error => {
        document.getElementById("input-add-amigo").value = "";
        mostrarMensagemScanner("ERRO DE CONEXÃO NO RADAR!");
    });
}

function renderizarAmigos() {
    let lista = document.getElementById("lista-amigos"); 
    lista.innerHTML = "";

    // 1. PRIMEIRO: Renderiza os pedidos de amizade pendentes (se alguém te adicionou)
    if (window.pedidosAmizade) {
        for (let idPedido in window.pedidosAmizade) {
            let remetente = window.pedidosAmizade[idPedido];
            let divPedido = document.createElement("div"); 
            divPedido.className = "amigo-item";
            divPedido.style.border = "2px dashed #ffd700"; // Borda dourada para destacar
            
            // O Avatar real (se for imagem URL ou emoji)
            let avatarHTML = remetente.avatar.startsWith("http") || remetente.avatar.startsWith("data:") 
                ? `<div class="amigo-avatar" style="background-image: url('${remetente.avatar}'); background-size: cover; background-position: center; color: transparent;">.</div>`
                : `<div class="amigo-avatar">${remetente.avatar}</div>`;

            divPedido.innerHTML = `
                <div class="amigo-info">
                    ${avatarHTML}
                    <div>
                        <div class="amigo-nome" style="color: #ffd700;">${remetente.nome}</div>
                        <div class="amigo-id">Quer ser seu amigo!</div>
                    </div>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button class="btn-trocar" style="background: #e53935; color: #fff; font-weight: bold; padding: 6px 12px; border-radius: 5px; border:none; cursor: pointer; font-size: 10px;" onclick="recusarAmigo('${idPedido}')">RECUSAR</button>
                    <button class="btn-trocar" style="background: #ffd700; color: #000; font-weight: bold; padding: 6px 12px; border-radius: 5px; border:none; cursor: pointer; font-size: 10px;" onclick="aceitarAmigo('${idPedido}', '${remetente.nome}', '${remetente.avatar}')">ACEITAR</button>
                </div>
            `;
            lista.appendChild(divPedido);
        }
    }

    // 2. DEPOIS: Renderiza os amigos que já estão na sua lista
    if(amigos.length === 0 && !window.pedidosAmizade) { 
        lista.innerHTML = "<p style='color:#666; font-size:10px; margin-top: 20px;'>Nenhum sinal no Radar...</p>"; 
        return; 
    }
    
    amigos.forEach((amigo, i) => {
        let div = document.createElement("div"); 
        div.className = "amigo-item";
        
        let avatarHTML = amigo.avatar.startsWith("http") || amigo.avatar.startsWith("data:") 
            ? `<div class="amigo-avatar" style="background-image: url('${amigo.avatar}'); background-size: cover; background-position: center; color: transparent;">.</div>`
            : `<div class="amigo-avatar">${amigo.avatar}</div>`;

        div.innerHTML = `
            <div class="amigo-info" style="cursor: pointer;" onclick="mostrarPerfilDoAmigo(${i})">
                ${avatarHTML}
                <div>
                    <div class="amigo-nome">${amigo.nome}</div>
                    <div class="amigo-id">Status: Online 🟢</div>
                </div>
            </div>
            <div style="display: flex; gap: 5px;">
                <button class="btn-trocar" style="background: #e53935; color: #fff; font-weight: bold; padding: 6px 8px; border-radius: 5px; border:none; cursor: pointer; font-size: 10px;" onclick="excluirAmigo(${i})">X</button>
                <button class="btn-trocar" style="background: #4CAF50; color: #000; font-weight: bold; padding: 6px 12px; border-radius: 5px; border:none; cursor: pointer; font-size: 10px;" onclick="iniciarTroca(${i})">TROCAR</button>
            </div>
        `;
        lista.appendChild(div);
    });
}

// Função para quando você clica em RECUSAR o convite
window.recusarAmigo = function(uidAmigo) {
    // Apenas apaga o pedido da sua "caixa de entrada" sem adicionar à lista
    set(ref(db, 'jogadores/' + uid + '/pedidos/' + uidAmigo), null);
    mostrarMensagemScanner("SINAL REJEITADO.");
}

// Função para quando você clica em ACEITAR o convite
window.aceitarAmigo = function(uidAmigo, nomeAmigo, avatarAmigo) {
    // 1. Adiciona ele na sua lista
    amigos.push({ uid: uidAmigo, nome: nomeAmigo, avatar: avatarAmigo });
    salvarAmigosNaNuvem();

    // 2. Apaga o pedido da sua "caixa de entrada"
    set(ref(db, 'jogadores/' + uid + '/pedidos/' + uidAmigo), null);

    // 3. (Opcional) Adiciona você na lista dele automaticamente!
    get(ref(db, 'jogadores/' + uidAmigo + '/amigos')).then((snap) => {
        let amigosDele = snap.exists() ? snap.val() : [];
        amigosDele.push({ uid: uid, nome: perfilJogador.nome, avatar: perfilJogador.avatar });
        set(ref(db, 'jogadores/' + uidAmigo + '/amigos'), amigosDele);
    });

    mostrarMensagemScanner(nomeAmigo.toUpperCase() + " AGORA É SEU ALIADO!");
}

// Função para EXCLUIR o amigo da lista
window.excluirAmigo = function(index) {
    let amigoRemovido = amigos[index];
    amigos.splice(index, 1); // Remove da sua lista local
    salvarAmigosNaNuvem();   // Atualiza a nuvem
    
    // Remove você da lista do seu amigo também (Corte definitivo)
    get(ref(db, 'jogadores/' + amigoRemovido.uid + '/amigos')).then((snap) => {
        if (snap.exists()) {
            let amigosDele = snap.val();
            let novaListaDele = amigosDele.filter(a => a.uid !== uid);
            set(ref(db, 'jogadores/' + amigoRemovido.uid + '/amigos'), novaListaDele);
        }
    });
    
    mostrarMensagemScanner("CONEXÃO COM " + amigoRemovido.nome.toUpperCase() + " CORTADA!");
    renderizarAmigos();
}

// Placeholder: Função para ver o perfil do amigo (Faremos na próxima etapa!)
window.mostrarPerfilDoAmigo = function(index) {
    mostrarMensagemScanner("Buscando status de " + amigos[index].nome + " na nuvem...");
    // Na próxima fase vamos abrir uma janelinha com os status reais dele!
}

// Cria a sala e chama o amigo
window.iniciarTroca = function(index) {
    amigoAtualTroca = amigos[index];
    let salaId = uid + "_" + amigoAtualTroca.uid; // ID único da sala
    
    mostrarMensagemScanner("CHAMANDO " + amigoAtualTroca.nome.toUpperCase() + "...");

    // Cria a sala no servidor
    set(ref(db, 'salas_troca/' + salaId), {
        p1: { uid: uid, nome: perfilJogador.nome, carta: null, pronto: false },
        p2: { uid: amigoAtualTroca.uid, nome: amigoAtualTroca.nome, carta: null, pronto: false },
        status: "aberta"
    });

    // Envia o "toca o telefone" pro celular do amigo
    set(ref(db, 'jogadores/' + amigoAtualTroca.uid + '/chamada_troca'), {
        de: uid, nome: perfilJogador.nome, salaId: salaId
    });

    entrarNaSalaDeTroca(salaId, true, amigoAtualTroca.uid, amigoAtualTroca.nome);
}

function entrarNaSalaDeTroca(salaId, isP1, idAmigo, nomeAmigo) {
    // REMOVI O abrirSocial() DAQUI DE DENTRO!
    
    salaTrocaAtual = salaId;
    souP1 = isP1;
    minhaCartaOfertada = null;
    cartaSimuladaAmigo = null;

    document.getElementById("nome-troca-amigo").innerText = "Lobby com " + nomeAmigo;
    document.getElementById("modal-troca").style.display = "flex";
    
    document.getElementById("slot-minha-carta").style.backgroundImage = "none";
    document.getElementById("slot-minha-carta").innerHTML = "+";
    document.getElementById("slot-carta-amigo").style.backgroundImage = "none";
    document.getElementById("slot-carta-amigo").innerHTML = "?";
    
    let btnConf = document.getElementById("btn-confirmar-troca");
    btnConf.disabled = true;
    btnConf.innerText = "CONFIRMAR";
    btnConf.style.background = "#555"; btnConf.style.color = "#222";

    onValue(ref(db, 'salas_troca/' + salaId), (snapshot) => {
        if (!snapshot.exists()) {
            if (document.getElementById("modal-troca").style.display === "flex") {
                fecharTroca();
                mostrarMensagemScanner("A SALA DE TROCA FOI FECHADA.");
            }
            return;
        }

        let sala = snapshot.val();
        
        if (sala.status === "concluida") {
            mostrarMensagemScanner("TROCA ÉPICA CONCLUÍDA!");
            fecharTroca();
            return;
        }

        // CORREÇÃO: Avisos blindados
        if (sala.status === "ocupado" && isP1) {
            mostrarMensagemScanner("O JOGADOR PEDIU PARA ESPERAR!");
            fecharTroca();
            return;
        }
        if (sala.status === "recusado" && isP1) {
            mostrarMensagemScanner("O JOGADOR RECUSOU A TROCA.");
            fecharTroca();
            return;
        }

        let meusDados = isP1 ? sala.p1 : sala.p2;
        let dadosAmigo = isP1 ? sala.p2 : sala.p1;

        let slotAmigo = document.getElementById("slot-carta-amigo");
        if (dadosAmigo.carta) {
            slotAmigo.innerHTML = "";
            slotAmigo.style.backgroundImage = `url('${dadosAmigo.carta.img}')`;
            slotAmigo.style.backgroundSize = "cover";
            cartaSimuladaAmigo = dadosAmigo.carta;
        } else {
            slotAmigo.innerHTML = "?";
            slotAmigo.style.backgroundImage = "none";
            cartaSimuladaAmigo = null;
        }

        if (sala.p1.pronto && sala.p2.pronto && isP1 && sala.status === "aberta") {
            executarTrocaFinal(sala);
        }
    });
}

// Quando você clica no [+] para escolher a sua carta
window.abrirSelecaoTroca = function() {
    document.getElementById("modal-selecao-troca").style.display = "flex";
    let lista = document.getElementById("lista-cartas-troca"); 
    lista.innerHTML = "";
    
    let disponiveis = inventario.filter(c => !c.favorito); 
    if(disponiveis.length === 0) { lista.innerHTML = "<p style='color:#ff5555; font-size:10px; text-align:center;'>Nenhuma carta disponível.</p>"; return; }

    disponiveis.forEach(item => {
        let div = document.createElement("div");
        div.style = "background: #111; border: 1px solid #ff5555; padding: 5px; display: flex; align-items: center; gap: 10px; cursor: pointer;";
        div.onclick = () => selecionarMinhaCartaTroca(item.id);
        div.innerHTML = `<img src="${item.img}" style="width: 40px; border-radius: 3px;"><span style="color: white; font-size: 11px;">${item.nome} (x${item.quantidade || 1})</span>`;
        lista.appendChild(div);
    });
}

// Quando você escolhe a carta, ela vai para a nuvem na hora!
window.selecionarMinhaCartaTroca = function(idCarta) {
    minhaCartaOfertada = inventario.find(c => c.id === idCarta);
    
    // Mostra na sua tela
    let slot = document.getElementById("slot-minha-carta");
    slot.innerHTML = "";
    slot.style.backgroundImage = `url('${minhaCartaOfertada.img}')`;
    slot.style.backgroundSize = "cover";
    
    // Manda pra Nuvem para o amigo ver
    let jogadorKey = souP1 ? 'p1' : 'p2';
    update(ref(db, 'salas_troca/' + salaTrocaAtual + '/' + jogadorKey), { carta: minhaCartaOfertada });
    
    let btnConf = document.getElementById("btn-confirmar-troca");
    btnConf.disabled = false;
    btnConf.style.background = "#4CAF50"; btnConf.style.color = "#000";
    
    fecharSelecaoTroca();
}

window.confirmarTroca = function() {
    if(!minhaCartaOfertada || !cartaSimuladaAmigo) {
        mostrarMensagemScanner("Aguarde a oferta do outro escaneador!"); return;
    }
    
    // Avisa a sala que você está pronto
    let jogadorKey = souP1 ? 'p1' : 'p2';
    update(ref(db, 'salas_troca/' + salaTrocaAtual + '/' + jogadorKey), { pronto: true });
    
    let btnConf = document.getElementById("btn-confirmar-troca");
    btnConf.innerText = "AGUARDANDO O OUTRO...";
    btnConf.disabled = true;
    btnConf.style.background = "#ffd700";
}

// O Servidor faz a troca física das cartas (Só o P1 roda isso para evitar duplicar as cartas)
function executarTrocaFinal(sala) {
    update(ref(db, 'salas_troca/' + salaTrocaAtual), { status: "processando" });

    // Puxa o álbum do Amigo
    get(ref(db, 'jogadores/' + sala.p2.uid + '/album')).then(snap2 => {
        let albumAmigo = snap2.exists() ? snap2.val() : [];
        
        // Remove a carta do amigo do álbum dele
        let c2Index = albumAmigo.findIndex(c => c.id === sala.p2.carta.id);
        if(c2Index > -1) {
            if(albumAmigo[c2Index].quantidade > 1) albumAmigo[c2Index].quantidade--;
            else albumAmigo.splice(c2Index, 1);
        }
        
        // Dá a SUA carta pro amigo
        let cartaDeP1 = {...sala.p1.carta};
        cartaDeP1.id = Date.now() + 1; // ID novo
        cartaDeP1.quantidade = 1;
        albumAmigo.push(cartaDeP1);
        
        // Remove a SUA carta do SEU álbum
        let c1Index = inventario.findIndex(c => c.id === sala.p1.carta.id);
        if(c1Index > -1) {
            if(inventario[c1Index].quantidade > 1) inventario[c1Index].quantidade--;
            else inventario.splice(c1Index, 1);
        }
        
        // Dá a carta do AMIGO pra VOCÊ
        let cartaDeP2 = {...sala.p2.carta};
        cartaDeP2.id = Date.now();
        cartaDeP2.quantidade = 1;
        inventario.push(cartaDeP2);
        
        // Salva tudo na nuvem!
        set(ref(db, 'jogadores/' + sala.p2.uid + '/album'), albumAmigo);
        salvarAlbumNaNuvem();
        
        // Avisa a sala que acabou e destrói ela
        update(ref(db, 'salas_troca/' + salaTrocaAtual), { status: "concluida" });
        setTimeout(() => remove(ref(db, 'salas_troca/' + salaTrocaAtual)), 2000);
    });
}

window.fecharTroca = function() { 
    // CORREÇÃO: Apenas quem iniciou a chamada (P1) tem o poder de deletar a sala da nuvem
    if(salaTrocaAtual && souP1) {
        remove(ref(db, 'salas_troca/' + salaTrocaAtual));
    }
    salaTrocaAtual = null;
    document.getElementById("modal-troca").style.display = "none"; 
}

window.fecharSelecaoTroca = function() { document.getElementById("modal-selecao-troca").style.display = "none"; }

// Ativando o botão Voltar da Aba Social
let btnVoltarSocial = document.getElementById("btn-voltar-social");
if(btnVoltarSocial) { btnVoltarSocial.onclick = () => location.reload(); }

// ==========================================
// 9. BOTÕES FÍSICOS E INICIALIZAÇÃO
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    let sEsq = document.getElementById("seta-esq-local");
    if(sEsq) sEsq.onclick = () => mostrarMensagemScanner("Nenhum outro local desbloqueado!");
    
    let sDir = document.getElementById("seta-dir-local");
    if(sDir) sDir.onclick = () => mostrarMensagemScanner("Nenhum outro local desbloqueado!");
    
    let vMenu = document.getElementById("btn-voltar-menu");
    if(vMenu) vMenu.onclick = () => location.reload();
});

document.getElementById("btn-escanear").onclick = function() {
    if (modoMenu) {
        if (indexSelecionado === 0) {
            document.getElementById("tela-menu").style.display = "none";
            document.getElementById("tela-locais").style.display = "flex";
            modoMenu = false;
        } else if (indexSelecionado === 1) {
            abrirAlbum();
        } else if (indexSelecionado === 3) {
            abrirSocial();
        } else if (indexSelecionado === 4) {
            abrirPerfil();
        }
    } else if (document.getElementById("tela-minigame") && document.getElementById("tela-minigame").style.display === "block") {
        verificarAcerto();
    } else if (document.getElementById("tela-mapa") && document.getElementById("tela-mapa").style.display === "flex") {
        escanearLocalAtual();
    }
};

document.getElementById("btn-dir").onclick = () => { 
    if(modoMenu && indexSelecionado < apps.length - 1) { indexSelecionado++; atualizarSelecao(); } 
};
document.getElementById("btn-esq").onclick = () => { 
    if(modoMenu && indexSelecionado > 0) { indexSelecionado--; atualizarSelecao(); } 
};

document.getElementById("btn-baixo").onclick = () => {
    let tAlbum = document.getElementById("lista-cartas");
    let tPerfil = document.getElementById("tela-perfil");
    let tSocial = document.getElementById("tela-social");
    if (document.getElementById("tela-album").style.display === "flex") tAlbum.scrollBy({ top: 50, behavior: 'smooth' });
    if (document.getElementById("tela-perfil").style.display === "flex") tPerfil.scrollBy({ top: 50, behavior: 'smooth' });
    if (document.getElementById("tela-social").style.display === "flex") tSocial.scrollBy({ top: 50, behavior: 'smooth' });
};

document.getElementById("btn-cima").onclick = () => {
    let tAlbum = document.getElementById("lista-cartas");
    let tPerfil = document.getElementById("tela-perfil");
    let tSocial = document.getElementById("tela-social");
    if (document.getElementById("tela-album").style.display === "flex") tAlbum.scrollBy({ top: -50, behavior: 'smooth' });
    if (document.getElementById("tela-perfil").style.display === "flex") tPerfil.scrollBy({ top: -50, behavior: 'smooth' });
    if (document.getElementById("tela-social").style.display === "flex") tSocial.scrollBy({ top: -50, behavior: 'smooth' });
};

atualizarSelecao();
















