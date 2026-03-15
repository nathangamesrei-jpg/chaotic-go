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
let cartaSimuladaAmigo = null;

// ==========================================
// 🎵 GERENCIADOR DE ÁUDIO MESTRE
// ==========================================
const AUDIO = {
    menu: new Audio('audio/scaner-menu.mp3'),
    mapa: new Audio('audio/drento-dos-locais.mp3'),
    lobby: new Audio('audio/dentro-do-trocas.mp3'),
    minigameCriatura: new Audio('audio/scanear-criaturas.mp3'),
    minigameMugic: new Audio('audio/scanear-mugic.mp3'),
    viajar: new Audio('audio/entrando-nos-locais.mp3'),
    bau: new Audio('audio/animacao-bau.mp3'),
    spawn: new Audio('audio/aparicao-de-criatura.mp3'),
    notificacao: new Audio('audio/notificacao-troca.mp3')
};

// Configuração das Músicas em Loop e Volume (Ajuste os números se ficar alto/baixo)
AUDIO.menu.loop = true; AUDIO.menu.volume = 0.3;
AUDIO.mapa.loop = true; AUDIO.mapa.volume = 0.3;
AUDIO.lobby.loop = true; AUDIO.lobby.volume = 0.3;
AUDIO.minigameCriatura.loop = true; AUDIO.minigameCriatura.volume = 0.4;
AUDIO.minigameMugic.loop = true; AUDIO.minigameMugic.volume = 0.4;

// Função de Efeitos Rápidos (SFX)
window.tocarSFX = function(nome) {
    if(AUDIO[nome]) {
        AUDIO[nome].currentTime = 0;
        AUDIO[nome].play().catch(() => {});
    }
};

// Função Inteligente do DJ (Troca a música sem encavalar duas ao mesmo tempo)
window.mudarMusicaFundo = function(novaMusica) {
    let musicas = ['menu', 'mapa', 'lobby', 'minigameCriatura', 'minigameMugic'];
    musicas.forEach(m => {
        if(AUDIO[m]) { AUDIO[m].pause(); AUDIO[m].currentTime = 0; }
    });
    if(novaMusica && AUDIO[novaMusica]) {
        AUDIO[novaMusica].play().catch(() => {});
    }
};

// 1º Clique liga o motor do jogo
document.body.addEventListener('click', () => {
    let telaMapa = document.getElementById("tela-mapa").style.display === "flex";
    let telaMini = document.getElementById("tela-minigame").style.display === "block";
    let telaMugic = document.getElementById("modal-mugic-mini") && document.getElementById("modal-mugic-mini").style.display === "flex";
    let telaLobby = document.getElementById("modal-troca") && document.getElementById("modal-troca").style.display === "flex";

    if(AUDIO.menu.paused && !telaMapa && !telaMini && !telaMugic && !telaLobby) {
        mudarMusicaFundo('menu');
    }
}, { once: true });
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
            tocarSFX('notificacao');
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

    // 1. SALVA OS DADOS NO COFRE ANTES DE APAGAR A CHAMADA!
    let idDaSala = chamadaPendente.salaId;
    let idDoAmigo = chamadaPendente.de;
    let nomeDoAmigo = chamadaPendente.nome;

    if (resposta === 'aceitar') {
        // MUDA PARA A TELA SOCIAL PRIMEIRO
        abrirSocial(); 
        
        // AGORA USA OS DADOS SALVOS NO COFRE (Não dá mais erro!)
        setTimeout(() => {
            entrarNaSalaDeTroca(idDaSala, false, idDoAmigo, nomeDoAmigo);
        }, 150); 
        
    } else if (resposta === 'esperar') {
        // Envia o status para a nuvem usando o ID seguro
        update(ref(db, 'salas_troca/' + idDaSala), { status: "ocupado" });
        mostrarMensagemScanner("Aviso de 'Aguarde' enviado!");
        
    } else if (resposta === 'recusar') {
        update(ref(db, 'salas_troca/' + idDaSala), { status: "recusado" });
        mostrarMensagemScanner("Chamada rejeitada.");
    }
    
    // 2. Agora sim podemos limpar a chamada pendente com segurança
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
   // ==========================================
    // ==========================================
    // 🃏 INTERCEPTADOR DE MONTAGEM DE DECK
    // ==========================================
    if (window.slotSelecionadoAtual !== null) {
        let slot = window.slotSelecionadoAtual;

        // SE FOR UM SLOT DE IMAGEM (Criatura, Equipamento, Magia)
        if (!slot.classList.contains('pilha-cartas')) {
            // (Substitua "imagemUrl" pela palavra certa que está na sua função original, ex: "imagem", "img")
            slot.style.backgroundImage = `url('${imagemUrl}')`; 
            slot.style.backgroundSize = 'cover';
            slot.style.backgroundPosition = 'center';
            slot.innerHTML = ''; // Limpa qualquer emoji/texto dentro do slot
        } 
        // SE FOR UMA PILHA (Ataques ou Locais)
        else {
            let contador = slot.querySelector('.contador-cartas');
            if(contador) {
                // Truque visual: Pega o número atual e soma 1 (só pra gente ver funcionando)
                let valores = contador.innerText.split('/');
                let atual = parseInt(valores[0]);
                let max = parseInt(valores[1]);
                
                if (atual < max) {
                    atual++;
                    contador.innerText = `${atual}/${max}`;
                    contador.style.color = "#00ffff"; // Muda a cor para ciano pra avisar que preencheu
                }
            }
        }

        // FECHA O ÁLBUM E VOLTA PRA OFICINA
        document.getElementById('tela-album').style.display = 'none';
        document.getElementById('tela-decks').style.display = 'flex';
        
        // LIMPA A MEMÓRIA DO SCANNER
        window.slotSelecionadoAtual = null;
        let tituloAlbum = document.querySelector('#tela-album .titulo-tela');
        if(tituloAlbum) tituloAlbum.innerText = "MINHA COLEÇÃO";

        return; // 🛑 PARA A FUNÇÃO DE INSPEÇÃO AQUI!
    }
    // ==========================================
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
        tocarSFX('viajar'); 
        mudarMusicaFundo('mapa'); 
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
    mudarMusicaFundo('mapa');
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
    mudarMusicaFundo('minigameCriatura');
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
            if (distancia > 10000) {
                mostrarMensagemScanner(`FORA DE ALCANCE! Ande mais ${Math.ceil(distancia - 10000)}m para escanear.`);
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

// ==========================================
// SISTEMA DE LOOT: BAÚS E MUGICS (VISUAIS UPGRADED)
// ==========================================

// Servidor CDN Público liberado para Desenvolvedores (Estilo 3D)
const IMG_BAU_TEXTURIZADO = "https://img.icons8.com/fluency/96/treasure-chest.png";
const IMG_MUGIC_TEXTURIZADO = "https://img.icons8.com/fluency/96/musical-notes.png";

window.criarMarcadorItem = function(latM, lonM, tipoNode) {
    // Usamos L.icon com as imagens externas para alta qualidade visual
    let iconeItem = L.icon({
        iconUrl: tipoNode === 'bau' ? IMG_BAU_TEXTURIZADO : IMG_MUGIC_TEXTURIZADO,
        iconSize: [45, 45], 
        iconAnchor: [22, 22],
        popupAnchor: [1, -34],
        className: tipoNode === 'bau' ? 'icone-bau-glow' : 'icone-mugic-glow'
    });

    let novoMarcador = L.marker([latM, lonM], { icon: iconeItem }).addTo(mapaScanner);
    
    // Adicionamos animação de pulso e contorno via CSS
    if (!document.getElementById('css-icones-loot')) {
        let style = document.createElement('style');
        style.id = 'css-icones-loot';
        style.innerHTML = `
            .icone-bau-glow { filter: drop-shadow(0 0 5px #ff5555) drop-shadow(0 0 10px #ff5555); transition: 0.2s; }
            .icone-mugic-glow { filter: drop-shadow(0 0 5px #00ffff) drop-shadow(0 0 10px #00ffff); transition: 0.2s; }
            .icone-bau-glow:hover, .icone-mugic-glow:hover { transform: scale(1.15) rotate(5deg); }
        `;
        document.head.appendChild(style);
    }

    novoMarcador.on('click', () => {
        // Trava de Distância (Você tem que estar a menos de 100m)
        if (marcadorJogador) {
            let pos = marcadorJogador.getLatLng();
            let dist = calcularDistancia(pos.lat, pos.lng, latM, lonM);
            if (dist > 1000000) {
                mostrarMensagemScanner(`FORA DE ALCANCE! Aproxime-se mais ${Math.ceil(dist - 1000000)}m.`);
                return;
            }
        }

        // Abre o Node!
        if (tipoNode === 'bau') {
            abrirBauDeLoot();
            mapaScanner.removeLayer(novoMarcador);
        } else if (tipoNode === 'mugic') {
            // Em breve: abriremos o Mini-game de Música aqui!
            // Por enquanto, já dá a magia direto.
            abrirLootMugic();
            mapaScanner.removeLayer(novoMarcador);
        }
    });

    marcadoresMonstros.push(novoMarcador); // Usa a mesma lista para ser apagado quando andar
}

// ==========================================
// O MOTOR CINEMÁTICO DE DROP DO BAÚ
// ==========================================
function abrirBauDeLoot() {
    tocarSFX('bau');
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 
    
    // 1. O Sorteador de Destino (Calcula o loot primeiro)
    let qtdItens = Math.floor(Math.random() * 6) + 1; 
    let lootGanho = [];

    for (let i = 0; i < qtdItens; i++) {
        let sorteioCategoria = Math.random();
        let categoriaAlvo = [];
        
        if (sorteioCategoria < 0.50) categoriaAlvo = typeof LOCAIS_DB !== 'undefined' ? LOCAIS_DB : [];
        else if (sorteioCategoria < 0.80) categoriaAlvo = typeof ATAQUES !== 'undefined' ? ATAQUES : [];
        else categoriaAlvo = typeof EQUIPAMENTOS !== 'undefined' ? EQUIPAMENTOS : [];
        
        if (categoriaAlvo.length === 0) categoriaAlvo = typeof LOCAIS_DB !== 'undefined' ? LOCAIS_DB : [];
        if (categoriaAlvo.length === 0) continue; 

        let sorteioRaridade = Math.random();
        let itensPossiveis = categoriaAlvo.filter(item => item.raridade >= sorteioRaridade);
        let itemSorteado = itensPossiveis.length > 0 ? itensPossiveis[Math.floor(Math.random() * itensPossiveis.length)] : categoriaAlvo[0]; 
            
        lootGanho.push(itemSorteado);
    }
    
    if (lootGanho.length === 0) { mostrarMensagemScanner("O Baú estava vazio..."); return; }

    // 2. Constrói a Tela de Animação do Baú (Só cria se não existir)
    if (!document.getElementById("modal-bau-animado")) {
        let modalCSS = document.createElement('style');
        modalCSS.innerHTML = `
            @keyframes shakeLoot { 0%{transform:rotate(0deg);} 25%{transform:rotate(-15deg) scale(1.1);} 50%{transform:rotate(15deg) scale(1.1);} 75%{transform:rotate(-15deg) scale(1.1);} 100%{transform:rotate(0deg) scale(1);} }
            .shaking-bau { animation: shakeLoot 0.3s infinite; }
            @keyframes popInCard { 0%{transform:scale(0); opacity:0;} 80%{transform:scale(1.1); opacity:1;} 100%{transform:scale(1); opacity:1;} }
            .pop-card { animation: popInCard 0.4s ease-out forwards; }
        `;
        document.head.appendChild(modalCSS);

        let modal = document.createElement("div");
        modal.id = "modal-bau-animado";
        modal.style.cssText = "display:none; position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,10,0,0.95); z-index:9999; flex-direction:column; align-items:center; justify-content:center; padding:20px; box-sizing:border-box;";
        document.getElementById("tela-jogo").appendChild(modal);
    }

    let modal = document.getElementById("modal-bau-animado");
    modal.style.display = "flex";
    
    // Reseta o visual para a animação inicial
    modal.innerHTML = `
        <p id="titulo-bau" style="color:#ffd700; font-weight:bold; font-size:16px; margin-bottom:20px; text-shadow: 0 0 10px #ffd700; letter-spacing: 2px;">DECODIFICANDO BAÚ...</p>
        <img id="img-bau-animacao" class="shaking-bau" src="https://img.icons8.com/fluency/96/treasure-chest.png" style="width:120px; height:120px; filter:drop-shadow(0 0 20px #ffd700);">
        <div id="grid-loot" style="display:none; flex-wrap:wrap; justify-content:center; gap:15px; margin-top:30px; width:100%; max-height:280px; overflow-y:auto;"></div>
        <button id="btn-coletar-bau" style="display:none; margin-top:30px; background:#4CAF50; color:#000; font-weight:bold; border:2px solid #2e7d32; padding:12px 30px; border-radius:8px; cursor:pointer; font-size:14px; box-shadow:0 0 15px #4CAF50;">COLETAR TUDO</button>
    `;

    // 3. A Mágica: Treme por 2 segundos e depois revela as cartas!
    setTimeout(() => {
        if (navigator.vibrate) navigator.vibrate(200); // Batida forte ao abrir
        document.getElementById("img-bau-animacao").classList.remove("shaking-bau");
        document.getElementById("img-bau-animacao").src = "https://img.icons8.com/fluency/96/open-box.png"; // Muda a foto para baú aberto
        document.getElementById("titulo-bau").innerText = "LOOT ENCONTRADO!";
        document.getElementById("titulo-bau").style.color = "#4CAF50";
        
        let grid = document.getElementById("grid-loot");
        grid.style.display = "flex";
        grid.innerHTML = "";
        
        // Faz cada carta "pular" na tela uma de cada vez (staggering effect)
        lootGanho.forEach((item, index) => {
            let delay = index * 200; // Atrasa o pulo de cada carta em 200ms
            let corBorda = item.tipoCarta === 'Local' ? '#00ccff' : '#ff5555';
            if(item.tipoCarta === 'Equipamento') corBorda = '#ffd700';
            
            grid.innerHTML += `
                <div class="pop-card" style="display:flex; flex-direction:column; align-items:center; width:80px; opacity:0; animation-delay:${delay}ms;">
                    <img src="${item.img}" style="width:75px; border-radius:5px; border:2px solid ${corBorda}; box-shadow: 0 0 10px ${corBorda};">
                    <p style="color:#fff; font-size:9px; text-align:center; margin-top:5px; font-weight:bold; line-height:1.2;">${item.nome}</p>
                </div>
            `;
        });

        let btnColetar = document.getElementById("btn-coletar-bau");
        btnColetar.style.display = "block";
        btnColetar.onclick = () => {
            // Guarda no inventário usando nosso empilhador de quantidades
            lootGanho.forEach((itemSorteado, i) => {
                let itemExistente = window.inventario.find(c => c.nome === itemSorteado.nome && c.tipoCarta === itemSorteado.tipoCarta);
                if (itemExistente) itemExistente.quantidade = (itemExistente.quantidade || 1) + 1;
                else {
                    let novo = {...itemSorteado}; novo.id = Date.now() + i; novo.quantidade = 1;
                    window.inventario.push(novo);
                }
            });
            salvarAlbumNaNuvem();
            modal.style.display = "none"; // Fecha a tela
            mostrarMensagemScanner("ITENS ARMAZENADOS NO ÁLBUM!");
        };
    }, 1800); 
}

// ==========================================
// O NOVO MINIGAME DE MUGIC: "SINTONIA DE RITMO" (HARD MODE)
// ==========================================
let loopSintoniaMugic;

function abrirLootMugic() {
    mudarMusicaFundo('minigameMugic');
    if (typeof MAGIAS === 'undefined' || MAGIAS.length === 0) { mostrarMensagemScanner("Banco de Magias Vazio!"); return; }
    
    if (!document.getElementById("modal-mugic-mini")) {
        let modal = document.createElement("div");
        modal.id = "modal-mugic-mini";
        modal.style.cssText = "display:none; position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,20,30,0.98); z-index:9999; flex-direction:column; align-items:center; justify-content:center; padding:20px; box-sizing:border-box;";
        document.getElementById("tela-jogo").appendChild(modal);
    }

    let modal = document.getElementById("modal-mugic-mini");
    modal.style.display = "flex";
    
    // Variáveis do modo Hard!
    let acertosAtuais = 0;
    let targetWidth = 18; // Barra verde mais fina (18% da tela)
    let targetPos = Math.floor(Math.random() * (100 - targetWidth)); // Posição inicial aleatória
    let gameAtivo = true;
    let pos = 0;
    let dir = 2.5; // Velocidade inicial do cursor

    modal.innerHTML = `
        <img src="https://img.icons8.com/fluency/96/musical-notes.png" style="width:70px; margin-bottom:20px; filter:drop-shadow(0 0 15px #00ffff);">
        <p id="titulo-mugic" style="color:#00ffff; font-weight:bold; font-size:18px; margin-bottom:5px; text-shadow: 0 0 10px #00ffff; text-align:center; letter-spacing: 1px;">SINTONIA MUGIC</p>
        <p id="sub-mugic" style="color:#aaa; font-size:11px; margin-bottom:30px; text-align:center; width:80%;">ACERTOS: <span id="contador-acertos" style="color:#0f0; font-weight:bold; font-size:14px;">0/3</span><br>Toque quando o cursor passar no verde!</p>
        
        <div style="width:90%; height:40px; background:#111; border:2px solid #00ffff; border-radius:20px; position:relative; overflow:hidden; box-shadow: inset 0 0 15px #000;">
            <div id="zona-verde-mugic" style="position:absolute; top:0; left:${targetPos}%; width:${targetWidth}%; height:100%; background:rgba(0,255,0,0.4); border-left:3px solid #0f0; border-right:3px solid #0f0; transition: left 0.15s ease-in-out;"></div>
            <div id="cursor-mugic" style="position:absolute; top:0; left:0%; width:15px; height:100%; background:#fff; box-shadow:0 0 15px #fff; border-radius:5px;"></div>
        </div>
        
        <div id="resultado-mugic" style="margin-top:30px; display:none; flex-direction:column; align-items:center;">
            <img id="img-magia-ganha" src="" style="width:90px; border-radius:5px; border:3px solid #00ffff; box-shadow:0 0 20px #00ffff;">
            <p id="nome-magia-ganha" style="color:#fff; font-size:14px; margin-top:10px; font-weight:bold; letter-spacing: 1px;"></p>
        </div>
        
        <button id="btn-sair-mugic" style="display:none; margin-top:25px; background:#00ffff; color:#000; font-weight:bold; border:none; padding:12px 30px; border-radius:8px; cursor:pointer; font-size:14px; box-shadow:0 0 15px #00ffff;">GUARDAR CÓDIGO</button>
    `;

    let cursor = document.getElementById("cursor-mugic");
    let zonaVerde = document.getElementById("zona-verde-mugic");
    let contador = document.getElementById("contador-acertos");

    clearInterval(loopSintoniaMugic);
    loopSintoniaMugic = setInterval(() => {
        if (!gameAtivo) return;
        pos += dir;
        if (pos >= 95) dir = -Math.abs(dir); // Bateu na direita
        if (pos <= 0) dir = Math.abs(dir);   // Bateu na esquerda
        cursor.style.left = pos + "%";
    }, 16);

    modal.onclick = function(e) {
        if (e.target.id === 'btn-sair-mugic') return; 
        if (!gameAtivo) return;
        
        let margemErro = 1; // Folga mínima de 1% para não ser injusto
        
        // Verifica se clicou dentro da Zona Verde
        if (pos >= (targetPos - margemErro) && pos <= (targetPos + targetWidth + margemErro)) {
            // ACERTOU O BEAT!
            acertosAtuais++;
            contador.innerText = acertosAtuais + "/3";
            cursor.style.background = "#0f0"; // Pisca verde
            setTimeout(() => { if(gameAtivo) cursor.style.background = "#fff"; }, 150);

            if (acertosAtuais >= 3) {
                // VITÓRIA FINAL (Cumpriu os 3 acertos)
                gameAtivo = false;
                clearInterval(loopSintoniaMugic);
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                
                document.getElementById("titulo-mugic").innerText = "SINTONIA PERFEITA!";
                document.getElementById("titulo-mugic").style.color = "#0f0";
                document.getElementById("sub-mugic").style.display = "none";
                zonaVerde.style.display = "none"; // Some a barrinha

                // Roda a roleta e dá o Loot
                let sorteioRaridade = Math.random();
                let magiasPossiveis = MAGIAS.filter(item => item.raridade >= sorteioRaridade);
                let magiaSorteada = magiasPossiveis.length > 0 ? magiasPossiveis[Math.floor(Math.random() * magiasPossiveis.length)] : MAGIAS[0];
                
                document.getElementById("img-magia-ganha").src = magiaSorteada.img;
                document.getElementById("nome-magia-ganha").innerText = magiaSorteada.nome;
                document.getElementById("resultado-mugic").style.display = "flex";
                
                let btn = document.getElementById("btn-sair-mugic");
                btn.style.display = "block";
                btn.onclick = () => {
                    let itemExistente = window.inventario.find(c => c.nome === magiaSorteada.nome && c.tipoCarta === "Magia");
                    if (itemExistente) itemExistente.quantidade = (itemExistente.quantidade || 1) + 1;
                    else { let novo = {...magiaSorteada}; novo.id = Date.now(); novo.quantidade = 1; window.inventario.push(novo); }
                    
                    salvarAlbumNaNuvem();
                    modal.style.display = "none";
                    mostrarMensagemScanner("MAGIA SALVA NO ÁLBUM!");
                };

            } else {
                // PASSOU DE FASE (Muda a zona de lugar e acelera o cursor)
                if (navigator.vibrate) navigator.vibrate(50);
                targetPos = Math.floor(Math.random() * (100 - targetWidth)); // Sorteia novo local
                zonaVerde.style.left = targetPos + "%";
                dir = dir > 0 ? dir + 0.8 : dir - 0.8; // Acelera a bolinha para ficar mais difícil!
            }

        } else {
            // ERROU O TEMPO! GAME OVER
            gameAtivo = false;
            clearInterval(loopSintoniaMugic);
            cursor.style.background = "#f00"; // Fica vermelho
            if (navigator.vibrate) navigator.vibrate(400); 
            
            document.getElementById("titulo-mugic").innerText = "SINAL PERDIDO...";
            document.getElementById("titulo-mugic").style.color = "#f00";
            document.getElementById("sub-mugic").innerHTML = "Você não conseguiu captar a frequência.<br>Acertos: " + acertosAtuais;
            document.getElementById("sub-mugic").style.color = "#ff5555";
            
            setTimeout(() => {
                modal.style.display = "none";
            }, 2500);
        }
    };
}

window.spawnMonstrosNaArea = function(lat, lon, forcarPassivo = false) {
    // Trava de segurança inicial
    if (typeof MONSTROS === 'undefined' || MONSTROS.length === 0) return;

    // 1. Acha as regras oficiais deste Local no banco de dados
    let regrasLocal = typeof LOCAIS_DB !== 'undefined' ? LOCAIS_DB.find(l => l.nome === localParaViagem) : null;
    let triboRegra = regrasLocal ? regrasLocal.triboNativa : "Qualquer";
    let elementoRegra = regrasLocal ? (regrasLocal.elementoNativo || null) : null;

    // 2. O FILTRO INTELIGENTE: Checa Tribo E Elemento ao mesmo tempo!
    let listaFiltrada = MONSTROS.filter(m => {
        let triboOK = (triboRegra === "Qualquer" || m.tribo === triboRegra);
        let elementoOK = (!elementoRegra || (m.elementos && m.elementos.includes(elementoRegra)));
        return triboOK && elementoOK;
    });

    // Segurança: Se não existir nenhum monstro no jogo com essa regra, spawna todos para o mapa não quebrar vazio
    if (listaFiltrada.length === 0) listaFiltrada = MONSTROS; 

    let agora = new Date();
    // CORREÇÃO: Transforma o nome do local e a hora em um NÚMERO REAL para a matemática não dar zero
    let textoSemente = localParaViagem + agora.getDate() + agora.getHours();
    let sementeBase = 0;
    for (let k = 0; k < textoSemente.length; k++) {
        sementeBase = Math.imul(31, sementeBase) + textoSemente.charCodeAt(k) | 0;
    }
    sementeBase = Math.abs(sementeBase); // Garante que seja positivo
    
    // 1. SPAWN FIXO (Estilo "Ninho" e "Escala Regional Balanceada")
    if (forcarPassivo === false) {
        marcadoresMonstros.forEach(m => mapaScanner.removeLayer(m));
        marcadoresMonstros = [];

        // RECALIBRADO: 50 itens num raio de aproximadamente 5km (multiplier 0.05).
        for (let i = 0; i < 50; i++) {
            let sementeUnica = sementeBase + (i * 150); 
            
            // Multiplicador 0.05 garante espalhamento de ±2.5km
            let offLat = (sementeRandom(sementeUnica + 200) - 0.5) * 0.05;
            let offLon = (sementeRandom(sementeUnica + 300) - 0.5) * 0.05;
            
            let roletaTipo = sementeRandom(sementeUnica + 400); // Rola de 0.0 a 1.0
            
            if (roletaTipo < 0.2) {
                // 20% de chance de ser um Baú
                criarMarcadorItem(lat + offLat, lon + offLon, 'bau');
            } else if (roletaTipo < 0.3) {
                // 10% de chance de ser um Símbolo Mugic
                criarMarcadorItem(lat + offLat, lon + offLon, 'mugic');
            } else {
                // 70% de chance de ser Criatura (O código original do monstro)
                let indexMonstro = Math.floor(sementeRandom(sementeUnica) * listaFiltrada.length);
                const sorteado = listaFiltrada[indexMonstro];
                criarMarcadorMonstro(lat + offLat, lon + offLon, sorteado, false);
            }
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
        tocarSFX('spawn');
        mostrarMensagemScanner("⚠️ UMA CRIATURA SELVAGEM APARECEU!");
    }
}
// ==========================================
// 4. LÓGICA DO RADAR, CÂMERA LIVRE E GIROSCÓPIO
// ==========================================
let seguirJogador = true; // Controla se o mapa segue você ou não

// Função para ler a Bússola do celular e girar a Seta
function lidarComGiroscopio(event) {
    let angulo = 0;
    // iOS usa webkitCompassHeading, Android usa alpha
    if (event.webkitCompassHeading) {
        angulo = event.webkitCompassHeading;
    } else if (event.alpha !== null) {
        // O Android inverte os graus, precisamos calcular o oposto
        angulo = Math.abs(event.alpha - 360); 
    }

    // Acha a Seta no mapa e aplica o giro em tempo real!
    let seta = document.getElementById("icone-seta-jogador");
    if (seta) {
        seta.style.transform = `rotate(${angulo}deg)`;
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
    seguirJogador = true; // Ao abrir o mapa, ele foca em você

    // Pede permissão para usar o Giroscópio (Obrigatório para segurança dos iPhones novos)
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(permissionState => {
            if (permissionState === 'granted') {
                window.addEventListener('deviceorientation', lidarComGiroscopio);
            }
        }).catch(console.error);
    } else {
        // Ativação para Android e aparelhos comuns
        window.addEventListener('deviceorientationabsolute', lidarComGiroscopio);
        window.addEventListener('deviceorientation', lidarComGiroscopio);
    }

    watchID = navigator.geolocation.watchPosition((pos) => {
        let lat = pos.coords.latitude; 
        let lon = pos.coords.longitude;

        document.getElementById("texto-carregando").style.display = "none";
        document.getElementById("meu-mapa").style.display = "block";
        document.getElementById("btn-sair-radar").style.display = "block";

        if (!mapaScanner) {
            // Inicia o mapa
            mapaScanner = L.map('meu-mapa', { zoomControl: false }).setView([lat, lon], 17);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(mapaScanner);
            
            // 🛑 SISTEMA DE CÂMERA LIVRE: Se arrastar o mapa, solta a trava!
            mapaScanner.on('dragstart', () => {
                seguirJogador = false;
                let btnCentro = document.getElementById("btn-recentralizar");
                if(btnCentro) btnCentro.style.display = "flex"; // Mostra o botão de voltar
            });

            // Cria o botão de Recentralizar (Fica escondido até você puxar o mapa)
            let btnCentro = document.createElement("button");
            btnCentro.id = "btn-recentralizar";
            btnCentro.innerHTML = "📍";
            btnCentro.style = "display: none; position: absolute; bottom: 20px; right: 20px; z-index: 1000; background: #111; color: #4CAF50; border: 2px solid #4CAF50; border-radius: 50%; width: 45px; height: 45px; font-size: 20px; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 0 15px rgba(0,0,0,0.8);";
            btnCentro.onclick = () => {
                seguirJogador = true;
                if(marcadorJogador) mapaScanner.flyTo(marcadorJogador.getLatLng(), 17);
                btnCentro.style.display = "none";
            };
            document.getElementById("tela-mapa").appendChild(btnCentro);
            
            // Círculo Azul de Alcance
            let corRadar = triboLocalParaViagem === "Azul" ? "#00ccff" : "#ff3300"; 
            circuloRadar = L.circle([lat, lon], { color: corRadar, radius: 1000000, fillOpacity: 0.1 }).addTo(mapaScanner);
            
            // 🧭 NOVA SETA 3D VETORIAL
            const svgSeta = `<svg viewBox="0 0 100 100" id="icone-seta-jogador" style="width: 100%; height: 100%; transform: rotate(0deg); transform-origin: center; transition: transform 0.1s ease-out;"><polygon points="50,5 90,90 50,70 10,90" fill="#ff3300" stroke="#fff" stroke-width="3" filter="drop-shadow(0px 4px 4px rgba(0,0,0,0.5))"/></svg>`;
            
            let divIconSeta = L.divIcon({
                html: svgSeta,
                className: '', // Vazio para não bugar o fundo
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });

            marcadorJogador = L.marker([lat, lon], { icon: divIconSeta }).addTo(mapaScanner);
            
            spawnMonstrosNaArea(lat, lon, false);
            ultimaLatSpawn = lat;
            ultimaLonSpawn = lon;

        } else {
            marcadorJogador.setLatLng([lat, lon]);
            circuloRadar.setLatLng([lat, lon]);
            
            // Só move a câmera para você se a Trava não foi quebrada arrastando
            if (seguirJogador) {
                mapaScanner.panTo([lat, lon]);
            }
            
            let distanciaAndada = calcularDistancia(ultimaLatSpawn, ultimaLonSpawn, lat, lon);
            let tempoPassado = Date.now() - tempoUltimoSpawn;

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
        
        // A NOVA REGRA VISUAL: Ele sabe quem tem Status e quem tem Quantidade!
        let tipoParaEmpilhar = ["Local", "Magia", "Ataque", "Equipamento"];
        
        if (tipoParaEmpilhar.includes(item.tipoCarta)) {
            // Cartas empilháveis mostram a Quantidade
            detalhesCarta = `<div style="font-size: 10px; color: #4CAF50; margin-top: 4px;">TIPO: ${item.tipoCarta.toUpperCase()}<br><span style="font-weight: bold; color: white;">CÓPIAS NO DECK: ${qtd}</span></div>`;
        } else {
            // Criaturas mostram os Status únicos de DNA
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

let btnVoltarAlbum = document.getElementById('btn-voltar-album');
if(btnVoltarAlbum) {
    btnVoltarAlbum.onclick = () => {
        // Se estava escolhendo carta pro Deck, cancela e volta pra Oficina
        if (window.slotSelecionadoAtual !== null) {
            window.slotSelecionadoAtual = null; // Limpa a memória
            document.getElementById('tela-album').style.display = 'none';
            document.getElementById('tela-decks').style.display = 'flex';
            
            let tituloAlbum = document.querySelector('#tela-album .titulo-tela');
            if(tituloAlbum) tituloAlbum.innerText = "MINHA COLEÇÃO";
        } 
        // Se era só uma visita normal ao álbum, volta pro Menu Principal
        else {
            document.getElementById('tela-album').style.display = 'none';
            document.getElementById('tela-menu').style.display = 'flex';
        }
    };
}

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

// Função para ver o perfil do amigo em tempo real!
window.mostrarPerfilDoAmigo = function(index) {
    let amigo = amigos[index];
    mostrarMensagemScanner("Acessando dados de " + amigo.nome.toUpperCase() + "...");
    
    // Conecta na pasta pessoal do amigo na nuvem
    get(ref(db, 'jogadores/' + amigo.uid)).then((snapshot) => {
        if (snapshot.exists()) {
            let dadosAmigo = snapshot.val();
            
            // Preenche o nome
            document.getElementById("nome-amigo-modal").innerText = dadosAmigo.nome;
            
            // Preenche o Avatar (suporta Emojis e Fotos com compressão)
            let avatarBox = document.getElementById("avatar-amigo-modal");
            if (dadosAmigo.avatar && (dadosAmigo.avatar.startsWith("http") || dadosAmigo.avatar.startsWith("data:"))) {
                avatarBox.innerHTML = "";
                avatarBox.style.backgroundImage = `url('${dadosAmigo.avatar}')`;
            } else {
                avatarBox.style.backgroundImage = "none";
                avatarBox.innerHTML = dadosAmigo.avatar || "👤";
            }

            // Preenche as estatísticas de batalha
            document.getElementById("vitorias-amigo-modal").innerText = dadosAmigo.vitorias || 0;
            document.getElementById("derrotas-amigo-modal").innerText = dadosAmigo.derrotas || 0;
            
            // Exibe a tela hacker!
            document.getElementById("modal-perfil-amigo").style.display = "flex";
            
        } else {
            mostrarMensagemScanner("SINAL PERDIDO! Dados corrompidos.");
        }
    }).catch(error => {
        mostrarMensagemScanner("ERRO DE COMUNICAÇÃO NO RADAR!");
    });
}

// O botão de fechar a inspeção
window.fecharPerfilAmigo = function() {
    document.getElementById("modal-perfil-amigo").style.display = "none";
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

window.trocaEmAndamento = false; // O Cadeado Global

function entrarNaSalaDeTroca(salaId, isP1, idAmigo, nomeAmigo) {
    mudarMusicaFundo('lobby');
    salaTrocaAtual = salaId;
    souP1 = isP1;
    minhaCartaOfertada = null;
    cartaSimuladaAmigo = null;
    window.trocaEmAndamento = false; // Destranca o cadeado ao entrar

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
        slotAmigo.style.position = "relative";
        slotAmigo.onclick = null; 
        
        if (dadosAmigo.carta) {
            cartaSimuladaAmigo = dadosAmigo.carta;
            slotAmigo.innerHTML = `<div style="position:absolute; top: -8px; right: -8px; background: #000; border: 1px solid #4CAF50; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 11px; z-index: 10;">🔍</div>`;
            slotAmigo.style.backgroundImage = `url('${dadosAmigo.carta.img}')`;
            slotAmigo.style.backgroundSize = "cover";
            slotAmigo.style.cursor = "pointer";
            slotAmigo.onclick = () => inspecionarCartaTroca(cartaSimuladaAmigo);
            
        } else {
            slotAmigo.innerHTML = "?";
            slotAmigo.style.backgroundImage = "none";
            slotAmigo.style.cursor = "default";
            cartaSimuladaAmigo = null;
        }

        // CADEADO ATIVADO: Só roda a matemática UMA VEZ!
        if (sala.p1.pronto && sala.p2.pronto && isP1 && sala.status === "aberta" && !window.trocaEmAndamento) {
            window.trocaEmAndamento = true; // Tranca a porta!
            executarTrocaFinal(sala);
        }
    });
}
// Função para Inspecionar Cartas dentro do Lobby de Troca
window.inspecionarCartaTroca = function(carta) {
    if(!carta) return;
    abrirDetalheCarta(carta.nome, carta.tribo, carta.img, "inspecao_troca");
    
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
        
        let qtd = item.quantidade || 1;
        let detalhesCarta = "";
        
        // Puxa os stats para mostrar na tela de escolha!
        if (item.tipoCarta === "Local") {
            detalhesCarta = `<div style="font-size: 9px; color: #4CAF50; margin-top: 2px;">TIPO: LOCAL | CÓPIAS: ${qtd}</div>`;
        } else {
            detalhesCarta = `<div style="font-size: 8px; color: #4CAF50; line-height: 1.2; margin-top: 2px;">E:${item.stats.e} | C:${item.stats.c} | P:${item.stats.p} | S:${item.stats.s} | V:${item.stats.v}</div>`;
        }

        div.innerHTML = `
            <img src="${item.img}" style="width: 40px; border-radius: 3px;">
            <div style="text-align: left; flex: 1;">
                <span style="color: white; font-size: 11px; font-weight: bold;">${item.nome}</span>
                ${detalhesCarta}
            </div>
        `;
        lista.appendChild(div);
    });
}

// Quando você escolhe a carta, ela vai para a nuvem na hora!
window.selecionarMinhaCartaTroca = function(idCarta) {
    minhaCartaOfertada = inventario.find(c => c.id === idCarta);
    
    let slot = document.getElementById("slot-minha-carta");
    slot.style.position = "relative";
    
    // Adiciona uma Lupa no canto. Clicar nela inspeciona a carta!
    slot.innerHTML = `<div onclick="event.stopPropagation(); inspecionarCartaTroca(minhaCartaOfertada)" style="position:absolute; top: -8px; right: -8px; background: #000; border: 1px solid #ff5555; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 11px; z-index: 10;">🔍</div>`;
    
    slot.style.backgroundImage = `url('${minhaCartaOfertada.img}')`;
    slot.style.backgroundSize = "cover";
    
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

function executarTrocaFinal(sala) {
    update(ref(db, 'salas_troca/' + salaTrocaAtual), { status: "processando" });

    // A REGRA DE OURO: Quais cartas podem ser empilhadas? (Tudo, menos Criatura!)
    const podeEmpilhar = (tipo) => ["Local", "Magia", "Ataque", "Equipamento"].includes(tipo);

    // Puxa o álbum do Amigo (P2)
    get(ref(db, 'jogadores/' + sala.p2.uid + '/album')).then(snap2 => {
        let albumAmigo = snap2.exists() ? snap2.val() : [];

        // 1. REMOVE A CARTA DO AMIGO (P2) DA NUVEM DELE
        let c2Index = albumAmigo.findIndex(c => c.id === sala.p2.carta.id);
        if(c2Index > -1) {
            if(albumAmigo[c2Index].quantidade > 1) { albumAmigo[c2Index].quantidade--; }
            else { albumAmigo.splice(c2Index, 1); }
        }

        // 2. REMOVE A SUA CARTA (P1) DA SUA NUVEM
        let meuAlbum = [...window.inventario]; 
        let c1Index = meuAlbum.findIndex(c => c.id === sala.p1.carta.id);
        if(c1Index > -1) {
            if(meuAlbum[c1Index].quantidade > 1) { meuAlbum[c1Index].quantidade--; }
            else { meuAlbum.splice(c1Index, 1); }
        }

        // 3. DÁ A SUA CARTA PARA O AMIGO (P2)
        if (podeEmpilhar(sala.p1.carta.tipoCarta)) {
            // Procura se o amigo já tem essa carta específica
            let cartaExistente = albumAmigo.find(c => c.nome === sala.p1.carta.nome && c.tipoCarta === sala.p1.carta.tipoCarta);
            if (cartaExistente) { cartaExistente.quantidade = (cartaExistente.quantidade || 1) + 1; }
            else {
                let nova = {...sala.p1.carta}; nova.id = Date.now() + 10; nova.quantidade = 1; albumAmigo.push(nova);
            }
        } else {
            // É criatura, então cria uma única com DNA/Stats próprios
            let nova = {...sala.p1.carta}; nova.id = Date.now() + 10; nova.quantidade = 1; albumAmigo.push(nova);
        }

        // 4. DÁ A CARTA DO AMIGO PARA VOCÊ (P1)
        if (podeEmpilhar(sala.p2.carta.tipoCarta)) {
            // Procura se você já tem essa carta específica
            let cartaExistente = meuAlbum.find(c => c.nome === sala.p2.carta.nome && c.tipoCarta === sala.p2.carta.tipoCarta);
            if (cartaExistente) { cartaExistente.quantidade = (cartaExistente.quantidade || 1) + 1; }
            else {
                let nova = {...sala.p2.carta}; nova.id = Date.now() + 20; nova.quantidade = 1; meuAlbum.push(nova);
            }
        } else {
            // É criatura, então cria uma única com DNA/Stats próprios
            let nova = {...sala.p2.carta}; nova.id = Date.now() + 20; nova.quantidade = 1; meuAlbum.push(nova);
        }

        // SALVA AS DUAS CONTAS NA NUVEM!
        set(ref(db, 'jogadores/' + sala.p2.uid + '/album'), albumAmigo); 
        window.inventario = meuAlbum; 
        salvarAlbumNaNuvem(); 

        // ENCERRA E DESTRÓI A SALA
        update(ref(db, 'salas_troca/' + salaTrocaAtual), { status: "concluida" });
        setTimeout(() => {
            remove(ref(db, 'salas_troca/' + salaTrocaAtual));
            window.trocaEmAndamento = false; // Destranca a porta pro futuro
        }, 2000);
    });
}

window.fecharTroca = function() { 
    mudarMusicaFundo('menu');
    if(salaTrocaAtual && souP1) { remove(ref(db, 'salas_troca/' + salaTrocaAtual)); }
    salaTrocaAtual = null;
    window.trocaEmAndamento = false; // Garante o reset do cadeado
    document.getElementById("modal-troca").style.display = "none"; 
}

window.fecharSelecaoTroca = function() { document.getElementById("modal-selecao-troca").style.display = "none"; }

// Ativando o botão Voltar da Aba Social
let btnVoltarSocial = document.getElementById("btn-voltar-social");
if(btnVoltarSocial) { btnVoltarSocial.onclick = () => location.reload(); }

// ==========================================
// 9. CARROSSEL DINÂMICO E BOTÕES FÍSICOS
// ==========================================
let locaisDesbloqueados = [];
let indiceLocalAtual = 0;

// O Motor que constrói a tela de seleção de lugares
window.renderizarCarrosselLocais = function() {
    let locaisUnicos = {};
    window.inventario.forEach(item => {
        if (item.tipoCarta === "Local") {
            locaisUnicos[item.nome] = item;
        }
    });
    locaisDesbloqueados = Object.values(locaisUnicos);

    if (locaisDesbloqueados.length === 0) return;

    if (indiceLocalAtual >= locaisDesbloqueados.length) indiceLocalAtual = 0;
    if (indiceLocalAtual < 0) indiceLocalAtual = locaisDesbloqueados.length - 1;

    let localAtual = locaisDesbloqueados[indiceLocalAtual];

    let container = document.querySelector(".carrossel-cartas");
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center;">
            <p style="color: #4CAF50; font-weight: bold; margin-bottom: 15px; font-size: 15px; text-shadow: 0 0 5px #000; text-align: center; font-family: monospace; letter-spacing: 1px;">
                ${localAtual.nome.toUpperCase()}
            </p>
            <div class="carta-local-real" onclick="abrirDetalheCarta('${localAtual.nome}', '${localAtual.tribo}', '${localAtual.img}', 'local')">
                <img src="${localAtual.img}" alt="Carta ${localAtual.nome}">
            </div>
        </div>
    `;
}

// Configura as setinhas verdes da tela de Locais
document.addEventListener("DOMContentLoaded", () => {
    let sEsq = document.getElementById("seta-esq-local");
    if(sEsq) {
        sEsq.onclick = () => {
            if (locaisDesbloqueados.length <= 1) { mostrarMensagemScanner("Nenhum outro local desbloqueado!"); return; }
            if (navigator.vibrate) navigator.vibrate(50);
            indiceLocalAtual--;
            renderizarCarrosselLocais();
        };
    }
    
    let sDir = document.getElementById("seta-dir-local");
    if(sDir) {
        sDir.onclick = () => {
            if (locaisDesbloqueados.length <= 1) { mostrarMensagemScanner("Nenhum outro local desbloqueado!"); return; }
            if (navigator.vibrate) navigator.vibrate(50);
            indiceLocalAtual++;
            renderizarCarrosselLocais();
        };
    }
    
    let vMenu = document.getElementById("btn-voltar-menu");
    if(vMenu) vMenu.onclick = () => location.reload();
});

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
                renderizarCarrosselLocais(); 
            } else if (index === 1) {
                abrirAlbum();
            } else if (index === 2) {
                mostrarMensagemScanner("Drome em manutenção..."); 
            } else if (index === 3) {
                abrirSocial();
            } else if (index === 4) {
                abrirPerfil();
            } else if (index === 5) {
                abrirOficinaDecks(); // <--- NOSSA NOVA TELA AQUI!
            }
        }
    };
});

// A função que liga a tela e o botão de voltar da Oficina
window.abrirOficinaDecks = function() {
    document.getElementById("tela-menu").style.display = "none";
    document.getElementById("tela-decks").style.display = "flex";
    modoMenu = false;
    
    if(typeof mudarMusicaFundo === 'function') mudarMusicaFundo('menu'); 
};


// ==========================================
// 📚 LÓGICA DO MANUAL DE REGRAS (LIVRO ANIMADO)
// ==========================================

// Função para Abrir o Modal do Livro
window.abrirLivroRegras = function() {
    let modal = document.getElementById("modal-livro-regras");
    if(modal) {
        modal.classList.remove("escondido"); // Mostra o modal
        tocarSFX('notificacao'); // Toca o som de notificação (opcional)
        // Reinicia para a primeira página ao abrir
        let paginas = document.querySelectorAll(".pagina");
        paginas.forEach((p, index) => {
            p.classList.remove("pagina-ativa", "pagina-anterior");
            if(index === 0) p.classList.add("pagina-ativa");
            else p.classList.add("pagina-proxima");
        });
        window.paginaAtualLivro = 0; // Controla a página atual globalmente
    }
};

// Função para Fechar o Modal do Livro
window.fecharLivroRegras = function() {
    let modal = document.getElementById("modal-livro-regras");
    if(modal) {
        modal.classList.add("escondido"); // Esconde o modal
        mudarMusicaFundo('menu'); // Toca a música do menu (opcional)
    }
};

// Função Inteligente para Mudar Página
window.mudarPaginaLivro = function(direcao) {
    let paginas = document.querySelectorAll(".pagina");
    let numPaginas = paginas.length;
    let novaPagina = window.paginaAtualLivro + direcao;

    // Impede de ir além da primeira ou última página
    if(novaPagina < 0 || novaPagina >= numPaginas) return;

    // Aplica as classes CSS para animação de virada
    paginas.forEach((p, index) => {
        p.classList.remove("pagina-ativa", "pagina-anterior", "pagina-proxima");
        
        if(index === novaPagina) {
            p.classList.add("pagina-ativa"); // A página que está sendo lida
        } else if(index < novaPagina) {
            p.classList.add("pagina-anterior"); // Páginas que já foram viradas
        } else {
            p.classList.add("pagina-proxima"); // Páginas que ainda não foram lidas
        }
    });

    window.paginaAtualLivro = novaPagina; // Atualiza o índice da página atual
    tocarSFX('viajar'); // Toca o som de virar página (opcional, use o mesmo som de 'viajar')
};

// Adiciona os Ouvintes de Evento (onclick)
if(document.getElementById("btn-help-decks")) {
    document.getElementById("btn-help-decks").onclick = () => abrirLivroRegras();
}

if(document.getElementById("btn-close-livro")) {
    document.getElementById("btn-close-livro").onclick = () => fecharLivroRegras();
}

if(document.getElementById("btn-pagina-anterior")) {
    document.getElementById("btn-pagina-anterior").onclick = () => mudarPaginaLivro(-1);
}

if(document.getElementById("btn-pagina-proxima")) {
    document.getElementById("btn-pagina-proxima").onclick = () => mudarPaginaLivro(1);
}

// ==========================================
// ⚙️ LÓGICA DO TABULEIRO DE DECKS
// ==========================================

// 1. Botão de Sair da Oficina
let btnSairOficina = document.getElementById("btn-voltar-decks");
if (btnSairOficina) {
    btnSairOficina.addEventListener("click", function() {
        document.getElementById("tela-decks").style.display = "none";
        document.getElementById("tela-menu").style.display = "flex";
        
        // Opcional: Tocar musiquinha do menu se você tiver!
        // mudarMusicaFundo('menu'); 
    });
}
let seletorModo = document.getElementById("seletor-modo-deck");
if(seletorModo) {
    seletorModo.addEventListener("change", function() {
        let modo = this.value; // Pega o que você escolheu (6x6, 3x3 ou 1x1)
        
        let linha3 = document.querySelector(".linha-3"); // Fileira de trás (3 slots)
        let linha2 = document.querySelector(".linha-2"); // Fileira do meio (2 slots)
        let mugics = document.querySelectorAll(".slot-mugic-heptagono"); // Pega todos os 6 mugics

        // MODO 6x6 (Mostra tudo)
        if(modo === "6x6") {
            linha3.classList.remove("escondido");
            linha2.classList.remove("escondido");
            mugics.forEach(m => m.classList.remove("escondido"));
        } 
        // MODO 3x3 RÁPIDO (Referência 2-1)
        else if(modo === "3x3") {
            linha3.classList.add("escondido");   // Some com os 3 de trás
            linha2.classList.remove("escondido"); // Mantém os 2 do meio
            
            // Varre os Mugics e esconde os que passarem do número 3
            mugics.forEach((m, index) => {
                if(index >= 3) m.classList.add("escondido");
                else m.classList.remove("escondido");
            });
        } 
        // MODO 1x1 DUELO
        else if(modo === "1x1") {
            linha3.classList.add("escondido"); // Some com os 3 de trás
            linha2.classList.add("escondido"); // Some com os 2 do meio
            
            // Varre os Mugics e deixa apenas o PRIMEIRO
            mugics.forEach((m, index) => {
                if(index >= 1) m.classList.add("escondido");
                else m.classList.remove("escondido");
            });
        }
    });
}

function atualizarSelecao() {
    apps.forEach(app => app.classList.remove("app-selecionado"));
    if(apps[indexSelecionado]) apps[indexSelecionado].classList.add("app-selecionado");
}

document.getElementById("btn-escanear").onclick = function() {
    if (modoMenu) {
        if (indexSelecionado === 0) {
            document.getElementById("tela-menu").style.display = "none";
            document.getElementById("tela-locais").style.display = "flex";
            modoMenu = false;
            renderizarCarrosselLocais(); 
        } else if (indexSelecionado === 1) {
            abrirAlbum();
        } else if (indexSelecionado === 2) {
            mostrarMensagemScanner("Drome em manutenção...");
        } else if (indexSelecionado === 3) {
            abrirSocial();
        } else if (indexSelecionado === 4) {
            abrirPerfil();
        } else if (indexSelecionado === 5) {
            abrirOficinaDecks(); 
        } else {
            mostrarMensagemScanner("Módulo em desenvolvimento...");
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
// ==========================================
// 🃏 SISTEMA DE MONTAGEM DE DECK (ETAPA 1: A PONTE)
// ==========================================

// Variável global para o Scanner lembrar qual buraco você quer preencher
window.slotSelecionadoAtual = null; 

// 1. Ouvintes de Clique nas Criaturas
document.querySelectorAll('.slot-criatura').forEach(slot => {
    slot.addEventListener('click', function() {
        prepararSelecaoDeck('Criatura', this);
    });
});

// 2. Ouvintes de Clique nos Equipamentos
document.querySelectorAll('.slot-equipamento').forEach(slot => {
    slot.addEventListener('click', function(event) {
        event.stopPropagation(); // 🛡️ Evita clicar na criatura sem querer!
        prepararSelecaoDeck('Equipamento', this);
    });
});

// 3. Ouvintes de Clique nos Mugics
document.querySelectorAll('.slot-mugic-heptagono').forEach(slot => {
    slot.addEventListener('click', function() {
        prepararSelecaoDeck('Magia', this);
    });
});

// 4. Ouvintes de Clique nas Pilhas (Ataques e Locais)
let btnPilhaAtaques = document.getElementById('pilha-ataques');
if(btnPilhaAtaques) {
    btnPilhaAtaques.addEventListener('click', () => prepararSelecaoDeck('Ataque', btnPilhaAtaques));
}

let btnPilhaLocais = document.getElementById('pilha-locais');
if(btnPilhaLocais) {
    btnPilhaLocais.addEventListener('click', () => prepararSelecaoDeck('Local', btnPilhaLocais));
}

// 🎯 Função Mágica que liga a Oficina ao Álbum
function prepararSelecaoDeck(tipoDesejado, elementoSlot) {
    window.slotSelecionadoAtual = elementoSlot; // Grava o slot na memória
    
    // Esconde a Oficina e mostra o Álbum
    document.getElementById('tela-decks').style.display = 'none';
    document.getElementById('tela-album').style.display = 'flex';
    
    // Muda o título do álbum para você saber o que está escolhendo
    let tituloAlbum = document.querySelector('#tela-album .titulo-tela');
    if(tituloAlbum) tituloAlbum.innerText = "SELECIONE: " + tipoDesejado.toUpperCase();
    
    // Força o Filtro do álbum a mostrar só o tipo certo!
    let selectTipo = document.getElementById('filtro-tipo');
    if(selectTipo) {
        selectTipo.value = tipoDesejado;
        selectTipo.dispatchEvent(new Event('change')); // Avisa o sistema que o filtro mudou
    }
}










