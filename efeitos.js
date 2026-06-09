// ==========================================
// CÉREBRO DE EFEITOS (O Dicionário de Mágicas)
// ==========================================

window.MotorDeEfeitos = {
    
    // Efeito do Vidal: Cura 15 pontos de HP
    "cura_15": function(alvo, conjurador, atualizarTela) {
        
        if (!alvo) return; // Se não tiver alvo, cancela
        
        // Descobre qual é o limite de vida dessa carta
        let vidaMaxima = Number(alvo.hpMax || alvo.statsMax.energia);
        
        // Soma a vida usando Number para o computador não confundir matemática com texto
        alvo.hpAtual = Number(alvo.hpAtual) + 15;
        
        // Se a cura passar do máximo, trava no limite!
        if (alvo.hpAtual > vidaMaxima) {
            alvo.hpAtual = vidaMaxima; 
        }
        
        // Avisa na tela
        window.mostrarMensagemScanner(`✨ EFEITO ATIVADO: ${alvo.nome} recuperou 15 de Energia!`);
        if (window.tocarSFX) window.tocarSFX('notificacao');
        
        // Manda o tabuleiro se redesenhar com a vida cheia!
        atualizarTela();
    }
    
};
