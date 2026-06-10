// ==========================================
// CÉREBRO DE EFEITOS (O Dicionário de Mágicas)
// ==========================================

window.MotorDeEfeitos = {
    
    // Efeito do Vidal: Cura 15 pontos de HP
    "cura_15": function(alvo, fullId, atualizarTela) {
        
        if (!alvo) return; // Se não tiver alvo, cancela
        
        // Descobre qual é o limite de vida dessa carta
        let vidaMaxima = Number(alvo.hpMax || alvo.statsMax.energia);
        
        // Soma a vida
        alvo.hpAtual = Number(alvo.hpAtual) + 15;
        
        // Se a cura passar do máximo, trava no limite!
        if (alvo.hpAtual > vidaMaxima) {
            alvo.hpAtual = vidaMaxima; 
        }
        
        // 🌐 AVISA A NUVEM: "A vida deste slot mudou na rede!"
        if (window.salaBatalhaAtual && window.salaBatalhaAtual !== "sala_simulada") {
            window.enviarAcaoRede({ tipo: 'sincronizar_hp', alvo: fullId, novoHp: alvo.hpAtual });
        }
        
        // Avisa na tela do jogador atual
        window.mostrarMensagemScanner(`✨ EFEITO ATIVADO: ${alvo.nome} recuperou 15 de Energia!`);
        if (window.tocarSFX) window.tocarSFX('notificacao');
        
        // Redesenha a tela local
        atualizarTela();
    }
    
};
