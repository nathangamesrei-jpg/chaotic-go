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
    // =====================================
    // 🔥 NOVO: Efeito do Xamã (ID 16): Cura 10
    // =====================================
    "cura_10": function(alvo, fullId, atualizarTela) {
        if (!alvo) return;
        let vidaMaxima = Number(alvo.hpMax || alvo.statsMax.energia);
        alvo.hpAtual = Number(alvo.hpAtual) + 10;
        if (alvo.hpAtual > vidaMaxima) alvo.hpAtual = vidaMaxima; 
        
        if (window.salaBatalhaAtual && window.salaBatalhaAtual !== "sala_simulada") {
            window.enviarAcaoRede({ tipo: 'sincronizar_hp', alvo: fullId, novoHp: alvo.hpAtual });
        }
        window.mostrarMensagemScanner(`✨ EFEITO ATIVADO: ${alvo.nome} recuperou 10 de Energia!`);
        if (window.tocarSFX) window.tocarSFX('notificacao');
        atualizarTela();
    },
    // =====================================
    // 🔥 NOVO: MUGIC - Canção da Criação
    // =====================================
    "cancao_criacao": function(alvo, fullId, atualizarTela, contexto) {
        if (!alvo || !contexto || !contexto.origem) return;

        let conjurador = null;
        if (contexto.origem.startsWith('jog-')) conjurador = window.campoJogador ? window.campoJogador[contexto.origem.replace('jog-', '')] : null;
        if (contexto.origem.startsWith('op-')) conjurador = window.campoOponente ? window.campoOponente[contexto.origem.replace('op-', '')] : null;

        // O sistema já descontou 1 ficha na hora de mirar. 
        // Para pagar o efeito duplo (3 fichas totais), ele precisa ter pelo menos mais 2 sobrando agora!
        let fichasRestantes = conjurador ? conjurador.fichasHabilidade : 0;
        let podePagarExtra = fichasRestantes >= 2;

        window.pausarCronometro();

        const modalHTML = `
            <div class="modal-overlay" id="overlay-cancao" style="z-index: 10000000; background: rgba(0,0,0,0.95); display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <div class="modal-content-fichas" style="text-align: center; border: 3px solid #00bcd4; background: #111; padding: 25px; border-radius: 10px; max-width: 380px;">
                    <h2 style="color: #00bcd4; font-family: 'Arial Black', sans-serif; margin-bottom: 10px;">🎵 CANÇÃO DA CRIAÇÃO</h2>
                    <p style="color: #fff; font-size: 13px; margin-bottom: 15px;">Escolha os elementos para <b>${alvo.nome}</b>:</p>
                    
                    <div style="margin-bottom: 15px; padding: 10px; background: #222; border-radius: 8px; border: 1px solid #444; text-align: left;">
                        <label style="color: #ffd700; font-weight: bold; cursor: pointer; display: block; margin-bottom: 10px; font-size: 14px;">
                            <input type="radio" name="opcao_cancao" value="1" checked onchange="window.atualizarLimiteCancao(1)" style="transform: scale(1.3); margin-right: 8px;"> 
                            1 Elemento (Custo Padrão: 1 Ficha)
                        </label>
                        <label style="color: ${podePagarExtra ? '#ffd700' : '#555'}; font-weight: bold; cursor: ${podePagarExtra ? 'pointer' : 'not-allowed'}; display: block; font-size: 14px;">
                            <input type="radio" name="opcao_cancao" value="2" ${!podePagarExtra ? 'disabled' : ''} onchange="window.atualizarLimiteCancao(2)" style="transform: scale(1.3); margin-right: 8px;"> 
                            2 Elementos (Pagar +2 Fichas extras)
                        </label>
                    </div>

                    <div id="cancao-checkboxes" style="display: flex; gap: 10px; justify-content: center; font-size: 16px; margin-bottom: 25px; flex-wrap: wrap;">
                        <label style="cursor:pointer; background:#222; border:2px solid red; border-radius:8px; padding:8px; display:flex; align-items:center; gap:5px;"><input type="checkbox" value="Fogo" class="cancao-cb"> 🔥</label>
                        <label style="cursor:pointer; background:#222; border:2px solid blue; border-radius:8px; padding:8px; display:flex; align-items:center; gap:5px;"><input type="checkbox" value="Água" class="cancao-cb"> 🌊</label>
                        <label style="cursor:pointer; background:#222; border:2px solid brown; border-radius:8px; padding:8px; display:flex; align-items:center; gap:5px;"><input type="checkbox" value="Terra" class="cancao-cb"> ⛰️</label>
                        <label style="cursor:pointer; background:#222; border:2px solid gray; border-radius:8px; padding:8px; display:flex; align-items:center; gap:5px;"><input type="checkbox" value="Ar" class="cancao-cb"> ☁️</label>
                    </div>
                    
                    <button class="btn-acao-modal" style="background:#222; border-color: #00bcd4; color: #00bcd4; font-size: 16px; width: 100%;" onclick="window.confirmarCancaoCriacao('${fullId}', '${contexto.origem}')">CONJURAR MAGIA</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        window.limiteCancao = 1;
        window.atualizarLimiteCancao = function(limite) {
            window.limiteCancao = limite;
            let marcados = document.querySelectorAll('.cancao-cb:checked');
            if (marcados.length > limite) {
                marcados.forEach(cb => cb.checked = false); 
            }
        };

        document.querySelectorAll('.cancao-cb').forEach(cb => {
            cb.addEventListener('change', function() {
                let marcados = document.querySelectorAll('.cancao-cb:checked').length;
                if (marcados > window.limiteCancao) {
                    this.checked = false; 
                }
            });
        });
    },
};


