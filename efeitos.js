window.MotorDeEfeitos = {
    "cura_15": function(alvo, conjurador, atualizarTela) {
        console.log("CÉREBRO: Efeito de cura recebido!"); // ADICIONE ESTA LINHA
        
        if (!alvo) {
            console.log("CÉREBRO: Alvo não encontrado!");
            return;
        }
        
        let vidaMaxima = Number(alvo.hpMax || alvo.statsMax.energia);
        alvo.hpAtual = Number(alvo.hpAtual) + 15;
        
        if (alvo.hpAtual > vidaMaxima) {
            alvo.hpAtual = vidaMaxima; 
        }
        
        window.mostrarMensagemScanner(`✨ EFEITO ATIVADO: ${alvo.nome} recuperou 15 de Energia!`);
        if (window.tocarSFX) window.tocarSFX('notificacao');
        atualizarTela();
    }
};
