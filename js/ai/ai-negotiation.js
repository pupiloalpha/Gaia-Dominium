import { 
    gameState, 
    getCurrentPlayer,
    getPendingNegotiationsForPlayer,
    addPendingNegotiation,
    removePendingNegotiation,
    updateNegotiationStatus,
    addActivityLog,
    updateRegionController,
    achievementsState
} from '../state/game-state.js';

import { GAME_CONFIG } from '../state/game-config.js';

export class AINegotiationSystem {
    constructor(gameLogic) {
        this.main = gameLogic;
    }

    /**
     * Ponto de entrada principal chamado pelo Coordenador de IA
     */
    async processTurn(aiPlayer) {
        // 1. Responder a propostas pendentes (Prioridade)
        await this.handleIncomingProposals(aiPlayer);

        // 2. Tentar iniciar uma nova negociação (Se tiver recursos e ações)
        if (gameState.actionsLeft > 0 && aiPlayer.resources.ouro >= 1) {
            await this.initiateProposal(aiPlayer);
        }
    }

    // =========================================================================
    // LÓGICA DE RESPOSTA (RECEBER PROPOSTAS)
    // =========================================================================

    async handleIncomingProposals(aiPlayer) {
        const pending = getPendingNegotiationsForPlayer(aiPlayer.id);
        
        for (const negotiation of pending) {
            // Validar se a proposta ainda é válida (recursos ainda existem?)
            if (!this.isValidTransaction(negotiation)) {
                this.rejectProposal(negotiation, "Inválida (recursos insuficientes)");
                continue;
            }

            const initiator = gameState.players[negotiation.initiatorId];
            const decision = this.evaluateProposal(aiPlayer, negotiation, initiator);

            if (decision.accepted) {
                this.executeTrade(negotiation);
                console.log(`🤖 IA ${aiPlayer.name} ACEITOU proposta de ${initiator.name}`);
            } else {
                this.rejectProposal(negotiation, "IA recusou baseada em valor");
                console.log(`🤖 IA ${aiPlayer.name} RECUSOU proposta de ${initiator.name}`);
            }
            
            // Pequeno delay para não travar a thread se houver muitas
            await new Promise(r => setTimeout(r, 200));
        }
    }

    /**
     * O "Cérebro" da avaliação. Retorna true/false baseado na personalidade.
     */
    evaluateProposal(aiPlayer, negotiation, initiator) {
        // Calcular valor da Oferta (o que a IA ganha)
        const gainValue = this.calculateValue(aiPlayer, negotiation.offer);
        
        // Calcular valor da Demanda (o que a IA perde)
        const costValue = this.calculateValue(aiPlayer, negotiation.request);

        // Fatores de personalidade (simplificado para eficiência)
        let threshold = 1.0; // Neutro: Aceita se ganho >= perda

        // Se a IA precisa muito de um recurso específico que está sendo ofertado
        if (this.needsResources(aiPlayer, negotiation.offer)) {
            threshold = 0.8; // Aceita mesmo perdendo um pouco de valor
        }

        // Se o iniciador está ganhando o jogo, a IA é mais exigente
        if (initiator.victoryPoints > aiPlayer.victoryPoints + 3) {
            threshold = 1.5; // Exige 50% de lucro para aceitar
        }

        const isGoodDeal = gainValue >= (costValue * threshold);
        return { accepted: isGoodDeal };
    }

    calculateValue(player, resourcesObj) {
        // Pesos base
        const weights = { madeira: 1, agua: 1.5, pedra: 2, ouro: 3, regions: 10 };
        
        let value = 0;
        ['madeira', 'pedra', 'ouro', 'agua'].forEach(r => {
            if (resourcesObj[r]) value += resourcesObj[r] * weights[r];
        });
        
        if (resourcesObj.regions) {
            value += resourcesObj.regions.length * weights.regions;
        }
        
        return value;
    }

    needsResources(player, offer) {
        // Exemplo: Se tem menos de 2 de algo e a oferta contém isso
        return ['madeira', 'agua'].some(r => player.resources[r] < 2 && offer[r] > 0);
    }

    // =========================================================================
    // LÓGICA DE CRIAÇÃO (ENVIAR PROPOSTAS)
    // =========================================================================

    async initiateProposal(aiPlayer) {
        // 1. Encontrar um alvo (alguém que tenha ouro e não seja o líder disparado)
        const targets = gameState.players.filter(p => p.id !== aiPlayer.id && p.resources.ouro >= 1);
        if (targets.length === 0) return;

        // Escolhe um alvo aleatório ou estratégico
        const target = targets[Math.floor(Math.random() * targets.length)];

        // 2. Montar proposta baseada no que a IA tem sobrando e o que precisa
        const proposal = this.generateSmartProposal(aiPlayer, target);

        if (proposal) {
            // 3. Efetivar o envio (Bypassing UI)
            this.sendProposal(aiPlayer, target, proposal);
        }
    }

    generateSmartProposal(aiPlayer, target) {
        // Lógica simplificada: Vender excedente por Ouro ou trocar recurso por recurso
        const surplus = Object.keys(aiPlayer.resources).find(k => k !== 'ouro' && aiPlayer.resources[k] > 4);
        const need = Object.keys(aiPlayer.resources).find(k => k !== 'ouro' && aiPlayer.resources[k] < 2);

        if (surplus) {
            // Tenta vender 2 do excedente por 1 Ouro
            return {
                offer: { [surplus]: 2 },
                request: { ouro: 1 }
            };
        }
        
        if (need && target.resources[need] > 3) {
            // Tenta comprar o que precisa pagando com o que tem mais (ou ouro)
            const payWith = Object.keys(aiPlayer.resources).reduce((a, b) => aiPlayer.resources[a] > aiPlayer.resources[b] ? a : b);
            return {
                offer: { [payWith]: 2 },
                request: { [need]: 1 }
            };
        }

        return null; // Não encontrou troca interessante
    }

    // =========================================================================
    // EXECUÇÃO DIRETA (BYPASS UI)
    // =========================================================================

    executeTrade(negotiation) {
        // Reutiliza a lógica robusta de troca do LogicNegotiation, mas sem validações de UI
        // Precisamos injetar a negociação no estado ativo temporariamente ou chamar o método privado se acessível
        // Como _executeTrade é um método da classe NegotiationLogic, acessamos via this.main
        
        if (this.main.negotiationLogic._executeTrade(negotiation)) {
            updateNegotiationStatus(negotiation.id, 'accepted');
            removePendingNegotiation(negotiation.id);
            
            const initiator = gameState.players[negotiation.initiatorId];
            const target = gameState.players[negotiation.targetId];

            addActivityLog({ 
                type: 'negotiate', 
                playerName: target.name, // A IA é o target aqui
                action: 'aceitou proposta de', 
                details: initiator.name, 
                turn: gameState.turn 
            });

            this.main.showFeedback(`🤖 ${target.name} aceitou a proposta de ${initiator.name}!`, 'success');
        }
    }

    rejectProposal(negotiation, reason) {
        updateNegotiationStatus(negotiation.id, 'rejected');
        removePendingNegotiation(negotiation.id);
        
        const initiator = gameState.players[negotiation.initiatorId];
        const target = gameState.players[negotiation.targetId]; // A IA

        // Só notifica se o iniciador for humano (para não spamar log de IA x IA)
        const initiatorIsHuman = !(initiator.type === 'ai' || initiator.isAI);
        
        if (initiatorIsHuman) {
             this.main.showFeedback(`${target.name} recusou sua proposta.`, 'info');
        }
    }

    sendProposal(initiator, target, content) {
        // Consumir custo
        let cost = 1;
        if (this.main.factionLogic) cost = this.main.factionLogic.modifyNegotiationCost(initiator);
        
        initiator.resources.ouro -= cost;
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
        
        addActivityLog({ 
            type: 'negotiate', 
            playerName: initiator.name, 
            action: 'enviou proposta para', 
            details: target.name, 
            turn: gameState.turn 
        });

        // Se o alvo for Humano, mostra notificação
        if (!(target.type === 'ai' || target.isAI)) {
            if (window.uiManager?.negotiation) {
                window.uiManager.negotiation.showNegotiationNotification(negotiation);
            }
        }
    }

    isValidTransaction(negotiation) {
        // Verifica se quem enviou ainda tem os recursos (pode ter gasto no turno de outro jogador ou evento)
        const initiator = gameState.players[negotiation.initiatorId];
        
        // Verifica recursos simples
        const hasResources = ['madeira', 'pedra', 'ouro', 'agua'].every(r => 
            (initiator.resources[r] || 0) >= (negotiation.offer[r] || 0)
        );
        
        if (!hasResources) return false;

        // Verifica regiões (se ainda controla)
        if (negotiation.offer.regions) {
            const controlsRegions = negotiation.offer.regions.every(rid => initiator.regions.includes(rid));
            if (!controlsRegions) return false;
        }

        return true;
    }
}
