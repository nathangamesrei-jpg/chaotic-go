// ==========================================
// CÉREBRO DE EFEITOS (O Dicionário de Mágicas)
// ==========================================

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

    // Efeito do Johnes (ID 1): Espiar Mão
    "espiar_mao": function(alvo, fullId, atualizarTela) {
        if (window.salaBatalhaAtual && window.salaBatalhaAtual !== "sala_simulada") {
            window.mostrarMensagemScanner("🕵️‍♂️ Johnes hackeando o scanner inimigo...");
            window.enviarAcaoRede({ tipo: 'hacker_pedir_mao' });
            if (window.tocarSFX) window.tocarSFX('notificacao');
        } else {
            window.mostrarMensagemScanner("🕵️‍♂️ Johnes: Oponente simulado não possui mão real.");
        }
    },

    // Efeito do Frador (ID 6): Causa 25 de Dano
    "dano_25": function(alvo, fullId, atualizarTela) {
        if (!alvo) return;
        alvo.hpAtual = Number(alvo.hpAtual) - 25;
        let morreu = false;
        if (alvo.hpAtual <= 0) { alvo.hpAtual = 0; morreu = true; }

        if (window.salaBatalhaAtual && window.salaBatalhaAtual !== "sala_simulada") {
            window.enviarAcaoRede({ tipo: 'sincronizar_hp', alvo: fullId, novoHp: alvo.hpAtual });
        }

        window.mostrarMensagemScanner(`🔥 IMPACTO! ${alvo.nome} sofreu 25 de dano pelo efeito!`);
        if (window.tocarSFX) window.tocarSFX('notificacao'); 
        atualizarTela();

        if (morreu) {
            setTimeout(() => {
                if (typeof window.encerrarCombateMorte === 'function') window.encerrarCombateMorte(fullId);
            }, 800); 
        }
    },

    // =====================================
    // 🔥 NOVO: Efeito do Alakazaz (ID 3): Doar Ficha
    // =====================================
    "doar_ficha": function(alvo, fullId, atualizarTela) {
        if (!alvo) return;

        // Regra do Alakazaz: Só pode doar para seus PRÓPRIOS campeões
        if (alvo.dono !== 'jogador') {
            window.mostrarMensagemScanner("❌ Ação Invalida: Você só pode doar fichas para campeões aliados!");
            return;
        }

        // Dá +1 ficha para o aliado escolhido
        alvo.fichasHabilidade = Number(alvo.fichasHabilidade) + 1;

        // 🌐 AVISA A NUVEM: "A quantidade de fichas desse slot mudou!"
        if (window.salaBatalhaAtual && window.salaBatalhaAtual !== "sala_simulada") {
            window.enviarAcaoRede({ tipo: 'sincronizar_fichas', alvo: fullId, qtd: alvo.fichasHabilidade });
        }

        window.mostrarMensagemScanner(`✨ Ficha doada! ${alvo.nome} recebeu +1 Ficha de Habilidade!`);
        if (window.tocarSFX) window.tocarSFX('notificacao');
        atualizarTela();
    },
    // =====================================
    // 🔥 NOVO: Efeito do Guru (ID 8): Doar Elemento
    // =====================================
    "guru_elemento": function(alvo, fullId, atualizarTela, contexto) {
        if (!alvo || !contexto || !contexto.elementoExtra) return;

        let elementoDado = contexto.elementoExtra;
        
        // Se a criatura ainda não tiver a lista de elementos, cria uma vazia
        if (!alvo.elementos) alvo.elementos = [];

        // Verifica se a criatura já tem esse elemento. Se não tiver, adiciona!
        if (!alvo.elementos.includes(elementoDado)) {
            alvo.elementos.push(elementoDado);
        }

        // 🌐 AVISA A NUVEM: "Os elementos desse monstro mudaram!"
        if (window.salaBatalhaAtual && window.salaBatalhaAtual !== "sala_simulada") {
            window.enviarAcaoRede({ tipo: 'sincronizar_elementos', alvo: fullId, elementos: alvo.elementos });
        }

        window.mostrarMensagemScanner(`✨ Efeito Concluído! ${alvo.nome} ganhou o elemento ${elementoDado}!`);
        if (window.tocarSFX) window.tocarSFX('notificacao');
        atualizarTela();
    },
    // =====================================
    // 🔥 NOVO: Efeito do Lion (ID 11): Aumentar Energia
    // =====================================
    "aumenta_energia_10": function(alvo, fullId, atualizarTela) {
        // Agora o alvo é o próprio Lion!
        if (!alvo) return;

        // Forçamos o JavaScript a usar "Number()" para ele somar matematicamente em vez de colar o texto!
        alvo.hpMax = Number(alvo.hpMax || alvo.statsMax.energia) + 10;
        alvo.hpAtual = Number(alvo.hpAtual) + 10;

        // 🌐 AVISA A NUVEM (Mandamos o HP atual e o Máximo para a barra do inimigo sincronizar)
        if (window.salaBatalhaAtual && window.salaBatalhaAtual !== "sala_simulada") {
            window.enviarAcaoRede({ 
                tipo: 'sincronizar_hp', 
                alvo: fullId, 
                novoHp: alvo.hpAtual, 
                novoMax: alvo.hpMax // <- O segredo de expansão da barra tá aqui!
            });
        }

        window.mostrarMensagemScanner(`🦁 ROAR! A energia de ${alvo.nome} aumentou para ${alvo.hpAtual}!`);
        if (window.tocarSFX) window.tocarSFX('notificacao');
        atualizarTela();
    },
    // =====================================
    // 🔥 NOVO: Efeito da Naty (ID 12): Resetar Memória
    // =====================================
    "resetar_naty": function(alvo, fullId, atualizarTela) {
        if (!alvo) return;
        
        // Zera a memória de batalhas e tira os elementos velhos
        alvo.batalhasRealizadas = 0;
        alvo.elementos = []; 
        
        // 🌐 AVISA A NUVEM: "Ela resetou os elementos!"
        if (window.salaBatalhaAtual && window.salaBatalhaAtual !== "sala_simulada") {
            window.enviarAcaoRede({ tipo: 'sincronizar_elementos', alvo: fullId, elementos: alvo.elementos });
        }

        window.mostrarMensagemScanner(`🌟 A memória de ${alvo.nome} foi renovada! Ela ganhará os 4 elementos na próxima luta!`);
        if (window.tocarSFX) window.tocarSFX('notificacao');
        atualizarTela();
    },
};


