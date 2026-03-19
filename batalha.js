// ==========================================
// MOTOR DA MINI-CARTA (DROME)
// ==========================================
function desenharMiniCarta(criaturaObj) {
    let nome = "";
    let img = "";
    let hpAtual = 0;
    let contadores = 0;
    let c = 0, p = 0, s = 0, v = 0;
    let elems = [];
    let corTribo = "transparent";
    let pct = 0;
    let corHp = '#444';

    if (criaturaObj) {
        nome = criaturaObj.nome;
        img = criaturaObj.cartaBlank; 
        
        let hpMax = criaturaObj.hpMax || criaturaObj.statsMax?.energia || 0;
        hpAtual = criaturaObj.hpAtual !== undefined ? criaturaObj.hpAtual : hpMax;
        contadores = criaturaObj.contadores !== undefined ? criaturaObj.contadores : (criaturaObj.fichasHabilidade || 0);
        
        c = criaturaObj.coragem || criaturaObj.statsMax?.coragem || 0;
        p = criaturaObj.poder || criaturaObj.statsMax?.poder || 0;
        s = criaturaObj.sabedoria || criaturaObj.statsMax?.sabedoria || 0;
        v = criaturaObj.velocidade || criaturaObj.statsMax?.velocidade || 0;
        elems = criaturaObj.elementos || [];
        
        const triboColors = {'Azul': '#29b6f6', 'Vermelho': '#ef5350', 'Amarelo': '#ffee58', 'Verde': '#66bb6a', 'Ciano': '#00bcd4', 'Cinza': '#9e9e9e'};
        corTribo = triboColors[criaturaObj.tribo] || '#9e9e9e';

        pct = Math.max(0, Math.min(100, (hpAtual / hpMax) * 100));
        corHp = 'lime';
        if (pct <= 50) corHp = 'orange';
        if (pct <= 20) corHp = 'red';
    }

    let heptagonos = '';
    for (let i = 0; i < contadores; i++) {
        heptagonos += `<div class="mini-contador"></div>`;
    }

    return `
        <div class="mini-card-wrapper">
            <div class="mini-counters-container">${heptagonos}</div>
            <div class="mini-card-body">
                <div class="mini-top-row">
                    <div class="mini-art" style="${img ? `background-image: url('${img}');` : ''}"></div>
                    <div class="mini-hp-bar">
                        <div class="mini-hp-fill" style="height: ${pct}%; background-color: ${corHp};"></div>
                        <span class="mini-hp-text">${hpAtual > 0 ? hpAtual : ''}</span>
                    </div>
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

                <div class="mini-name-band" style="color: ${criaturaObj ? '#000' : 'transparent'}">${criaturaObj ? nome : '-'}</div>
                ${criaturaObj ? `<div class="mini-tribe-badge" style="background-color: ${corTribo}; border: 1px solid #fff;"></div>` : ''}
            </div>
        </div>
    `;
}

// --------------------------------------------------
// TESTE PRÁTICO CORRIGIDO (Oponente também preenchido)
// --------------------------------------------------
const johnesTeste = {
    nome: "Johnes",
    tribo: "Azul",
    fichasHabilidade: 2,
    elementos: ["Terra"],
    cartaBlank: "cartas/criaturas/azul/johnes.jpg",
    statsMax: { coragem: 50, poder: 40, sabedoria: 60, velocidade: 30, energia: 45 }
};

setTimeout(() => {
    // 1. Coloca o Johnes no seu slot do meio
    const slotC2 = document.getElementById('jog-c2');
    if(slotC2) slotC2.innerHTML = desenharMiniCarta(johnesTeste);
    
    // 2. Preenche todos os outros slots (Jogador E Oponente) com a carta cinza vazia!
    const slotsVazios = [
        'jog-c1', 'jog-c3', 'jog-c4', 'jog-c5', 'jog-c6',
        'op-c1', 'op-c2', 'op-c3', 'op-c4', 'op-c5', 'op-c6'
    ];
    
    slotsVazios.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.innerHTML = desenharMiniCarta(null);
    });
}, 500);
