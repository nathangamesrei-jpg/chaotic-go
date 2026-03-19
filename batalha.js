// ==========================================
// MOTOR DA MINI-CARTA (DROME)
// ==========================================
function desenharMiniCarta(criaturaObj) {
    // Valores padrão (Carta Vazia)
    let nome = "Vazio";
    let img = "";
    let hpAtual = 0;
    let contadores = 0;
    let c = 0, p = 0, s = 0, v = 0;
    let elems = [];
    let corTribo = "transparent";
    let pct = 0;
    let corHp = '#444';

    // Se tiver criatura, substitui os dados
    if (criaturaObj) {
        nome = criaturaObj.nome;
        img = criaturaObj.cartaBlank; // Puxa a arte grande da carta
        
        let hpMax = criaturaObj.hpMax || criaturaObj.statsMax?.energia || 0;
        hpAtual = criaturaObj.hpAtual !== undefined ? criaturaObj.hpAtual : hpMax;
        contadores = criaturaObj.contadores !== undefined ? criaturaObj.contadores : (criaturaObj.fichasHabilidade || 0);
        
        c = criaturaObj.coragem || criaturaObj.statsMax?.coragem || 0;
        p = criaturaObj.poder || criaturaObj.statsMax?.poder || 0;
        s = criaturaObj.sabedoria || criaturaObj.statsMax?.sabedoria || 0;
        v = criaturaObj.velocidade || criaturaObj.statsMax?.velocidade || 0;
        elems = criaturaObj.elementos || [];
        
        // Cor da bolinha da Tribo
        const triboColors = {'Azul': '#29b6f6', 'Vermelho': '#ef5350', 'Amarelo': '#ffee58', 'Verde': '#66bb6a', 'Ciano': '#00bcd4', 'Cinza': '#9e9e9e'};
        corTribo = triboColors[criaturaObj.tribo] || '#9e9e9e';

        // Lógica da barra de vida
        pct = Math.max(0, Math.min(100, (hpAtual / hpMax) * 100));
        corHp = 'lime';
        if (pct <= 50) corHp = 'orange';
        if (pct <= 20) corHp = 'red';
    }

    // Gera os heptágonos no topo
    let heptagonos = '';
    for (let i = 0; i < contadores; i++) {
        heptagonos += `<div class="mini-contador"></div>`;
    }

    // Retorna o HTML idêntico ao design pedido
    return `
        <div class="mini-card-wrapper">
            <div class="mini-counters-container">${heptagonos}</div>
            <div class="mini-card-body">
                <div class="mini-top-row">
                    <div class="mini-art" style="${img ? `background-image: url('${img}');` : ''}">${!img ? '🛡️' : ''}</div>
                    <div class="mini-hp-bar">
                        <div class="mini-hp-fill" style="height: ${pct}%; background-color: ${corHp};"></div>
                        <span class="mini-hp-text">${hpAtual}</span>
                    </div>
                </div>
                <div class="mini-stats-band">
                    <div class="mini-stat-item"><span>❤️</span><b>${c}</b></div>
                    <div class="mini-stat-item"><span>⚡</span><b>${p}</b></div>
                    <div class="mini-stat-item"><span>👁️</span><b>${s}</b></div>
                    <div class="mini-stat-item"><span>💨</span><b>${v}</b></div>
                    <div class="mini-elements-box">
                        <div class="mini-el ${elems.includes('Fogo') ? 'fogo' : ''}"></div>
                        <div class="mini-el ${elems.includes('Ar') ? 'ar' : ''}"></div>
                        <div class="mini-el ${elems.includes('Terra') ? 'terra' : ''}"></div>
                        <div class="mini-el ${elems.includes('Agua') ? 'agua' : ''}"></div>
                    </div>
                </div>
                <div class="mini-name-band">${nome}</div>
                ${criaturaObj ? `<div class="mini-tribe-badge" style="background-color: ${corTribo}; border: 1px solid #fff;"></div>` : ''}
            </div>
        </div>
    `;
}

// --------------------------------------------------
// TESTE PRÁTICO: Preenchendo todos os slots
// --------------------------------------------------
const johnesTeste = {
    nome: "Johnes",
    tribo: "Azul",
    fichasHabilidade: 2,
    elementos: ["Terra"],
    cartaBlank: "cartas/criaturas/azul/johnes.jpg", // Arte oficial
    statsMax: { coragem: 50, poder: 40, sabedoria: 60, velocidade: 30, energia: 45 }
};

setTimeout(() => {
    // Coloca o Johnes na linha de frente (Meio)
    document.getElementById('jog-c2').innerHTML = desenharMiniCarta(johnesTeste);
    
    // Preenche o resto com o molde vazio para você ver como fica!
    const slotsVazios = ['jog-c1', 'jog-c3', 'jog-c4', 'jog-c5', 'jog-c6'];
    slotsVazios.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.innerHTML = desenharMiniCarta(null);
    });
}, 500);
