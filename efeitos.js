window.MotorDeEfeitos = {
    
    // Efeito do Vidal (ID 15) e Xamã (ID 16): Cura HP
    "cura_15": function(alvo, fullId, atualizarTela) {
        if (!alvo) return;
        let vidaMaxima = Number(alvo.hpMax || alvo.statsMax.energia);
        alvo.hpAtual = Number(alvo.hpAtual) + 15;
        if (alvo.hpAtual > vidaMaxima) alvo.hpAtual = vidaMaxima; 
        
        if (window.salaBatalhaAtual && window.salaBatalhaAtual !== "sala_simulada") {
            window.enviarAcaoRede({ tipo: 'sincronizar_hp', alvo: fullId, novoHp: alvo.hpAtual });
        }
        window.mostrarMensagemScanner(`✨ EFEITO ATIVADO: ${alvo.nome} recuperou 15 de Energia!`);
        if (window.tocarSFX) window.tocarSFX('notificacao');
        atualizarTela();
    },

    // =====================================
    // 🔥 NOVO: Efeito do Johnes (ID 1): Espiar Mão
    // =====================================
    "espiar_mao": function(alvo, fullId, atualizarTela) {
        if (window.salaBatalhaAtual && window.salaBatalhaAtual !== "sala_simulada") {
            // Dispara o ataque hacker pela rede!
            window.mostrarMensagemScanner("🕵️‍♂️ Johnes hackeando o scanner inimigo...");
            window.enviarAcaoRede({ tipo: 'hacker_pedir_mao' });
            if (window.tocarSFX) window.tocarSFX('notificacao');
        } else {
            window.mostrarMensagemScanner("🕵️‍♂️ Johnes: Oponente simulado não possui mão real.");
        }
    }
    
};
