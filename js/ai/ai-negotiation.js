// ai-negotiation.js - Módulo para gerenciar negociações da AI
import { 
    gameState, 
    getPendingNegotiationsForPlayer,
    addPendingNegotiation,
    removePendingNegotiation,
    updateNegotiationStatus,
    addActivityLog
} from '../state/game-state.js';

export class AINegotiationSystem {
    constructor(gameLogic) {
        this.main = gameLogic;
    }

    async processTurn(aiPlayer) {
        console.log(`🤖 [IA-NEG] Iniciando turno de negociação para: ${aiPlayer.name}`);

        // 1. Responder a propostas recebidas (PRIORIDADE)
        await this.handleIncomingProposals(aiPlayer);

        // 2. Tentar enviar propostas (Se tiver Ouro e Ações)
        // Relaxei a condição: Se tiver >= 1 Ouro E Ações > 0
        if (gameState.actionsLeft > 0 && (aiPlayer.resources.ouro || 0) >= 1) {
            await this.initiateProposal(aiPlayer);
        } else {
            console.log(`🤖 [IA-NEG] Sem recursos para propor. Ouro: ${aiPlayer.resources.ouro}, Ações: ${gameState.actionsLeft}`);
        }
    }

    // =========================================================================
    // 1. RECEBENDO PROPOSTAS
    // =========================================================================

    async handleIncomingProposals(aiPlayer) {
        // IMPORTANTE: Converter ID para Number para garantir compatibilidade
        const myId = Number(aiPlayer.id);
        const allPending = getPendingNegotiationsForPlayer(myId);
        
        // Criamos uma cópia do array para evitar erros ao remover itens dentro do loop
        const pendingList = [...allPending]; 

        if (pendingList.length > 0) {
            console.log(`🤖 [IA-NEG] Analisando ${pendingList.length} propostas recebidas.`);
        }

        for (const negotiation of pendingList) {
            try {
                // Validação de segurança
                if (!this.isValidTransaction(negotiation)) {
                    this.rejectProposal(negotiation, "Recursos insuficientes do remetente");
                    continue;
                }

                const initiator = gameState.players[negotiation.initiatorId];
                
                // Avaliação
                const decision = this.evaluateProposal(aiPlayer, negotiation, initiator);

                if (decision.accepted) {
                    console.log(`🤖 [IA-NEG] ACEITOU proposta de ${initiator.name}`);
                    this.executeTrade(negotiation);
                } else {
                    console.log(`🤖 [IA-NEG] RECUSOU proposta de ${initiator.name}`);
                    this.rejectProposal(negotiation, "Valor insuficiente");
                }
                
                // Pequeno delay para processamento visual não travar
                await new Promise(r => setTimeout(r, 300));

            } catch (error) {
                console.error("Erro ao processar proposta na IA:", error);
            }
        }
    }

    evaluateProposal(aiPlayer, negotiation, initiator) {
        // IA Aceita quase tudo para testes se não for prejuízo absurdo
        const gainValue = this.calculateValue(negotiation.offer);
        const costValue = this.calculateValue(negotiation.request);

        console.log(`🤖 [IA-EVAL] Ganho: ${gainValue} | Custo: ${costValue}`);

        // Lógica de Personalidade Simplificada:
        // Se Ganho >= 80% do Custo, aceita (IA amigável para movimentar o jogo)
        const threshold = 0.8; 

        return { accepted: gainValue >= (costValue * threshold) };
    }

    calculateValue(resourcesObj) {
        // Pesos: Ouro vale muito, Recursos básicos valem normal
        const weights = { madeira: 1, agua: 1.5, pedra: 2, ouro: 4, regions: 15 };
        let value = 0;
        
        ['madeira', 'pedra', 'ouro', 'agua'].forEach(r => {
            if (resourcesObj[r]) value += (resourcesObj[r] * weights[r]);
        });
        
        // Valoriza regiões
        if (resourcesObj.regions && Array.isArray(resourcesObj.regions)) {
            value += resourcesObj.regions.length * weights.regions;
        }
        
        return value;
    }

    // =========================================================================
    // 2. ENVIANDO PROPOSTAS
    // =========================================================================

    async initiateProposal(aiPlayer) {
        // Encontrar alvos que tenham ouro (para poderem aceitar futuras trocas) ou recursos
        const targets = gameState.players.filter(p => p.id !== aiPlayer.id);
        
        if (targets.length === 0) return;

        // Escolhe alvo aleatório
        const target = targets[Math.floor(Math.random() * targets.length)];

        // Gera proposta
        const content = this.generateSmartProposal(aiPlayer, target);

        if (content) {
            this.sendProposal(aiPlayer, target, content);
        } else {
            console.log(`🤖 [IA-NEG] Não encontrou troca interessante com ${target.name}`);
        }
    }

    generateSmartProposal(aiPlayer, target) {
        // Lógica Agressiva: Tenta vender qualquer coisa que tenha > 2
        const resources = ['madeira', 'pedra', 'agua']; // Não vende ouro facilmente
        
        // 1. Tenta VENDER (IA tem sobrando)
        const surplus = resources.find(k => (aiPlayer.resources[k] || 0) > 2);
        
        if (surplus) {
            // Oferece 2 do excedente por 1 Ouro
            return {
                offer: { [surplus]: 2 },
                request: { ouro: 1 }
            };
        }

        // 2. Tenta COMPRAR (IA tem pouco)
        const need = resources.find(k => (aiPlayer.resources[k] || 0) < 2);
        if (need && (target.resources[need] || 0) > 1) {
            // Tenta pagar com o recurso que tem mais
            const payWith = resources.reduce((a, b) => (aiPlayer.resources[a]||0) > (aiPlayer.resources[b]||0) ? a : b);
            
            // Só propõe se tiver como pagar
            if ((aiPlayer.resources[payWith] || 0) >= 2) {
                return {
                    offer: { [payWith]: 2 },
                    request: { [need]: 1 }
                };
            }
        }

        // 3. Fallback: Proposta aleatória para teste (1 Madeira por 1 Agua se tiver)
        if (aiPlayer.resources.madeira >= 1 && target.resources.agua >= 1) {
             return { offer: { madeira: 1 }, request: { agua: 1 } };
        }

        return null; 
    }

    sendProposal(initiator, target, content) {
        // Consumir custo
        let cost = 1;
        if (this.main.factionLogic) {
             cost = this.main.factionLogic.modifyNegotiationCost(initiator);
        }
        
        initiator.resources.ouro = Math.max(0, initiator.resources.ouro - cost);
        gameState.actionsLeft--;

        const negotiation = {
            id: 'neg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            initiatorId: Number(initiator.id),
            targetId: Number(target.id),
            offer: { madeira: 0, pedra: 0, ouro: 0, agua: 0, regions: [], ...content.offer },
            request: { madeira: 0, pedra: 0, ouro: 0, agua: 0, regions: [], ...content.request },
            timestamp: Date.now(),
            turn: gameState.turn,
            status: 'pending'
        };

        addPendingNegotiation(negotiation);
        
        console.log(`🤖 [IA-NEG] Enviou proposta para ${target.name}:`, negotiation);

        addActivityLog({ 
            type: 'negotiate', 
            playerName: initiator.name, 
            action: 'enviou proposta para', 
            details: target.name, 
            turn: gameState.turn 
        });

        // NOTIFICAÇÃO PARA O JOGADOR HUMANO
        // Se o alvo não for IA, mostra na tela
        if (!(target.type === 'ai' || target.isAI)) {
            if (window.uiManager && window.uiManager.negotiation) {
                window.uiManager.negotiation.showNegotiationNotification(negotiation);
            }
        }
    }

    // =========================================================================
    // EXECUÇÃO E UTILITÁRIOS
    // =========================================================================

    executeTrade(negotiation) {
        // Chama a lógica central de troca
        // O método _executeTrade do NegotiationLogic deve ser acessado via main
        if (this.main.negotiationLogic && typeof this.main.negotiationLogic._executeTrade === 'function') {
            const success = this.main.negotiationLogic._executeTrade(negotiation);
            
            if (success) {
                updateNegotiationStatus(negotiation.id, 'accepted');
                removePendingNegotiation(negotiation.id);
                
                // Feedback visual se o player humano estiver envolvido
                const targetIsHuman = !gameState.players[negotiation.targetId].isAI;
                const initiatorIsHuman = !gameState.players[negotiation.initiatorId].isAI;

                if (targetIsHuman || initiatorIsHuman) {
                    this.main.showFeedback(`Troca realizada entre ${gameState.players[negotiation.initiatorId].name} e ${gameState.players[negotiation.targetId].name}`, 'success');
                }
            }
        } else {
            console.error("CRÍTICO: Não foi possível acessar _executeTrade em NegotiationLogic");
        }
    }

    rejectProposal(negotiation, reason) {
        updateNegotiationStatus(negotiation.id, 'rejected');
        removePendingNegotiation(negotiation.id);
        console.log(`🤖 [IA-NEG] Proposta rejeitada: ${reason}`);
    }

    isValidTransaction(negotiation) {
        const initiator = gameState.players[negotiation.initiatorId];
        if (!initiator) return false;

        // Verifica se o iniciador ainda tem os recursos ofertados
        const hasResources = ['madeira', 'pedra', 'ouro', 'agua'].every(r => 
            (initiator.resources[r] || 0) >= (negotiation.offer[r] || 0)
        );
        
        return hasResources;
    }
}
