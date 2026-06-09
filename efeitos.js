// ==========================================
// CÉREBRO DE EFEITOS (O Dicionário de Mágicas)
// ==========================================

window.MotorDeEfeitos = {
    
    // Efeito do Vidal: Cura 15 pontos de HP
    "cura_15": function(idDoAlvo) {
        
        // 1. Acha quem é a criatura que vai receber a cura
        let alvo = obterCriaturaNoSlot(idDoAlvo);
        if (!alvo) return; // Se não tiver alvo, cancela
        
        // 2. Calcula a cura sem deixar passar da vida máxima!
        let vidaMaxima = alvo.hpMax || alvo.statsMax.energia;
        alvo.hpAtual += 15;
        
        if (alvo.hpAtual > vidaMaxima) {
            alvo.hpAtual = vidaMaxima; // Trava no limite
        }
        
        // 3. Avisa na tela e atualiza o tabuleiro
        window.mostrarMensagemScanner(`✨ EFEITO ATIVADO: ${alvo.nome} recuperou 15 de Energia!`);
        if(window.tocarSFX) window.tocarSFX('notificacao');
        
        // Atualiza os desenhos na tela para a barra de HP encher
        if(typeof atualizarTelaBatalha === 'function') atualizarTelaBatalha();
    }
    
    // No futuro, os próximos efeitos (como o do Frador) entrarão aqui embaixo!
};
