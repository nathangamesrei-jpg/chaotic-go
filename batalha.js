// Função que "desenha" a mini-carta dentro de um slot
function desenharMiniCarta(criaturaObj) {
    // Se não tiver criatura no objeto, retorna vazio
    if (!criaturaObj) return '';

    // 1. Calcula a porcentagem de vida para a barra
    const hpPorcentagem = Math.max(0, Math.min(100, (criaturaObj.hpAtual / criaturaObj.hpMax) * 100));
    
    // 2. Define a cor da barra de vida
    let corHp = 'lime';
    if (hpPorcentagem <= 50) corHp = 'orange';
    if (hpPorcentagem <= 20) corHp = 'red';

    // 3. Gera os heptágonos (Contadores) dinamicamente
    let contadoresHTML = '';
    for (let i = 0; i < criaturaObj.contadores; i++) {
        contadoresHTML += `<div class="mini-contador"></div>`;
    }

    // 4. Monta o HTML final da carta combinando tudo
    return `
        <div class="mini-carta-batalha">
            <div class="mini-counters-box">
                ${contadoresHTML}
            </div>

            <div class="mini-meio">
                <div class="mini-arte" style="background-image: url('${criaturaObj.imagem}')"></div>
                <div class="mini-hp-bar">
                    <div class="mini-hp-fill" style="height: ${hpPorcentagem}%; background-color: ${corHp};"></div>
                    <div class="mini-hp-text">${criaturaObj.hpAtual}</div>
                </div>
            </div>

            <div class="mini-base">
                <div class="mini-status-row">
                    <div class="mini-icones-status">
                        <span>❤️ ${criaturaObj.coragem}</span>
                        <span>⚡ ${criaturaObj.poder}</span>
                        <span>👁️ ${criaturaObj.sabedoria}</span>
                        <span>💨 ${criaturaObj.velocidade}</span>
                    </div>
                    <div class="mini-elementos">
                        <div class="mini-el ${criaturaObj.elementos.includes('Fogo') ? 'fogo' : ''}"></div>
                        <div class="mini-el ${criaturaObj.elementos.includes('Ar') ? 'ar' : ''}"></div>
                        <div class="mini-el ${criaturaObj.elementos.includes('Terra') ? 'terra' : ''}"></div>
                        <div class="mini-el ${criaturaObj.elementos.includes('Agua') ? 'agua' : ''}"></div>
                    </div>
                </div>
                <div class="mini-nome-row">
                    <span>${criaturaObj.nome}</span>
                    <div class="mini-tribo-circle" style="background-color: ${criaturaObj.corTribo}"></div>
                </div>
            </div>
        </div>
    `;
}
// 2. Criando o Johnes para o teste (Adaptado da sua database)
const johnesTeste = {
    nome: "Johnes",
    imagem: "cartas/icones/johnes_perfil.png", // Usando a arte de perfil dele
    hpMax: 45,      // Puxado de statsMax.energia
    hpAtual: 45,    // Vida cheia no início
    contadores: 2,  // Puxado de fichasHabilidade
    coragem: 50, 
    poder: 40, 
    sabedoria: 60, 
    velocidade: 30, 
    elementos: ["Terra"], 
    corTribo: '#29b6f6' // Código de cor para a Tribo Azul
};

// 3. Injetando no slot 1 do Jogador
setTimeout(() => {
    const slotC1 = document.getElementById('jog-c1');
    if(slotC1) {
        slotC1.innerHTML = desenharMiniCarta(johnesTeste);
    }
}, 500);
