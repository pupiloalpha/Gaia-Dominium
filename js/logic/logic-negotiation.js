// logic-negotiation.js - Lógica de Negociação
import { 
  gameState, achievementsState, addActivityLog, getCurrentPlayer,
  addPendingNegotiation, removePendingNegotiation, clearActiveNegotiation,
  updateNegotiationStatus, getNegotiationState, resetNegotiationState,
  validateNegotiationState, getNegotiationValidationErrors, updateRegionController,
  getPendingNegotiationsForPlayer
} from '../state/game-state.js';

export class NegotiationLogic {
  constructor(gameLogic) {
    this.main = gameLogic;
  }

  handleNegotiate() {
    if (gameState.currentPhase !== 'negociacao') {
      this.main.showFeedback('Negociação permitida apenas na fase de Negociação.', 'warning');
      return;
    }
    
    const player = getCurrentPlayer();
    if (player.resources.ouro < 1) { 
      this.main.showFeedback('Necessário 1 Ouro.', 'error'); 
      return; 
    }
    if (gameState.actionsLeft <= 0) { 
      this.main.showFeedback('Sem ações restantes.', 'warning'); 
      return; 
    }
    
    if (window.uiManager?.negotiation) {
      window.uiManager.negotiation.openNegotiationModal();
    }
  }

  setupPhase() {
    gameState.currentPhase = 'negociacao';
    gameState.actionsLeft = 1;
    
    // Pequeno delay para garantir que o estado atualizou antes da IA checar
    setTimeout(() => {
      if (window.uiManager?.negotiation?.checkPendingNegotiationsForCurrentPlayer) {
        window.uiManager.negotiation.checkPendingNegotiationsForCurrentPlayer();
      }
    }, 800);

    if (window.uiManager) {
      window.uiManager.updateUI();
      window.uiManager.updateFooter();
    }
    
    addActivityLog({ 
      type: 'phase', 
      playerName: 'SISTEMA', 
      action: 'Fase alterada', 
      details: 'Ações -> Negociação', 
      turn: gameState.turn 
    });
  }

  async handleSendNegotiation() {
    const player = getCurrentPlayer();
    const negState = getNegotiationState();
    
    if (!this._validateSendConditions(player, negState)) return false;

    // Para IA, pulamos a confirmação visual se não houver UI ou se for turno de IA
    let confirm = true;
    if (!(player.type === 'ai' || player.isAI)) {
        confirm = await this.main.showConfirm('Enviar Proposta', `Enviar proposta para jogador?`);
    }

    if (!confirm) return false;
    
    // Consumir custos
    gameState.actionsLeft--;
    player.resources.ouro -= 1;

    const negotiation = this._buildNegotiationObject(player, negState);
    addPendingNegotiation(negotiation);
    
    // Fechar UI
    if (window.uiManager?.negotiation && typeof window.uiManager.negotiation.closeNegotiationModal === 'function') {
        window.uiManager.negotiation.closeNegotiationModal();
    } else {
        document.getElementById('negotiationModal')?.classList.add('hidden');
    }
    
    resetNegotiationState();
    
    // Notificar UI (apenas se não for IA jogando contra IA em background rápido)
    if (window.uiManager?.negotiation) {
        setTimeout(() => window.uiManager.negotiation.showNegotiationNotification(negotiation), 500);
    }
    
    const target = gameState.players[negotiation.targetId];
    addActivityLog({ 
      type: 'negotiate', 
      playerName: player.name, 
      action: 'enviou proposta para', 
      details: target.name, 
      turn: gameState.turn 
    });
    this.main.showFeedback(`Proposta enviada para ${target.name}!`, 'success');
    
    achievementsState.totalNegotiations++;
    if(window.uiManager) window.uiManager.updateFooter();
    
    return true;
  }

  async handleResponse(accepted) {
    const negotiation = gameState.activeNegotiation;
    if (!negotiation) {
        console.warn("Tentativa de responder sem negociação ativa");
        return;
    }

    const target = gameState.players[negotiation.targetId];
    const currentPlayer = getCurrentPlayer();

    // CORREÇÃO: Converter ambos para Number para comparação consistente
    const currentPlayerId = Number(currentPlayer.id);
    const targetId = Number(target.id);
    const negotiationTargetId = Number(negotiation.targetId);

    if (currentPlayerId !== negotiationTargetId) {
        console.error(`Erro de permissão: Current(${currentPlayerId}) !== NegotiationTarget(${negotiationTargetId})`);
        console.log('Detalhes da negociação:', {
          negotiationId: negotiation.id,
          initiatorId: negotiation.initiatorId,
          targetId: negotiation.targetId,
          currentPlayer: {
            id: currentPlayer.id,
            name: currentPlayer.name,
            type: currentPlayer.type
          },
          targetPlayer: {
            id: target.id,
            name: target.name,
            type: target.type
          }
        });
        this.main.showFeedback('Apenas o destinatário pode responder.', 'error');
        return;
    }

    if (accepted) {
        const validation = this._validateExecution(negotiation);
        if (!validation.valid) {
            this.main.showFeedback(validation.message, 'error');
            return;
        }

        if (this._executeTrade(negotiation)) {
            updateNegotiationStatus(negotiation.id, 'accepted');
            this.main.showFeedback('Proposta aceita! Troca realizada.', 'success');
            
            const initiator = gameState.players[negotiation.initiatorId];
            addActivityLog({ 
              type: 'negotiate', 
              playerName: target.name, 
              action: 'aceitou proposta de', 
              details: initiator.name, 
              turn: gameState.turn 
            });
            
            // Verificar vitória após negociação bem-sucedida
            this.main.turnLogic.checkVictory();
        }
    } else {
        updateNegotiationStatus(negotiation.id, 'rejected');
        this.main.showFeedback('Proposta recusada.', 'info');
        
        const initiator = gameState.players[negotiation.initiatorId];
        addActivityLog({ 
          type: 'negotiate', 
          playerName: target.name, 
          action: 'recusou proposta de', 
          details: initiator.name, 
          turn: gameState.turn 
        });
    }

    if (window.uiManager?.negotiation) window.uiManager.negotiation.closeNegResponseModal();
    
    removePendingNegotiation(negotiation.id);
    clearActiveNegotiation();
    
    if (window.uiManager) {
        setTimeout(() => window.uiManager.updateUI(), 300);
    }
  }

  _executeTrade(negotiation) {
    try {
        const initiator = gameState.players[negotiation.initiatorId];
        const target = gameState.players[negotiation.targetId];

        // CORREÇÃO: Garantir que os IDs são números
        const initiatorId = Number(initiator.id);
        const targetId = Number(target.id);

        console.log(`Executando troca: ${initiator.name} (${initiatorId}) ↔ ${target.name} (${targetId})`);

        ['madeira', 'pedra', 'ouro', 'agua'].forEach(k => {
            const offer = negotiation.offer[k] || 0;
            const req = negotiation.request[k] || 0;
            
            // Transferência segura
            initiator.resources[k] = Math.max(0, (initiator.resources[k] || 0) - offer);
            target.resources[k] = (target.resources[k] || 0) + offer;
            
            target.resources[k] = Math.max(0, (target.resources[k] || 0) - req);
            initiator.resources[k] = (initiator.resources[k] || 0) + req;
        });

        const transferRegion = (list, from, to) => {
            if (!list || !Array.isArray(list)) return;
            list.forEach(rid => {
                from.regions = from.regions.filter(id => id !== rid);
                if (!to.regions.includes(rid)) to.regions.push(rid);
                updateRegionController(rid, to.id);
            });
        };

        transferRegion(negotiation.offer.regions, initiator, target);
        transferRegion(negotiation.request.regions, target, initiator);

        initiator.victoryPoints++;
        target.victoryPoints++;
        achievementsState.totalNegotiations++;

        console.log('Troca concluída com sucesso');
        return true;
    } catch (e) {
        console.error("Erro na troca:", e);
        return false;
    }
  }

  _validateSendConditions(player, negState) {
    if (gameState.currentPhase !== 'negociacao') return false;
    if (gameState.actionsLeft <= 0) return false;
    if (player.resources.ouro < 1) return false;
    
    // Verificação explícita de null/undefined
    // CORREÇÃO: Converter para Number para comparação consistente
    const targetId = Number(negState.targetPlayerId);
    if (isNaN(targetId) || targetId === null || targetId === undefined) { 
        this.main.showFeedback('Selecione um alvo.', 'error'); 
        return false; 
    }
    
    if (!validateNegotiationState()) {
        const errors = getNegotiationValidationErrors();
        this.main.showFeedback(errors[0] || 'Proposta inválida', 'error');
        return false;
    }
    return true;
  }

  _buildNegotiationObject(player, negState) {
    // CORREÇÃO: Garantir que todos os IDs são números
    const negotiation = {
        id: 'neg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        initiatorId: Number(player.id),
        targetId: Number(negState.targetPlayerId),
        offer: { ...negState.offer, regions: [...(negState.offerRegions || [])] },
        request: { ...negState.request, regions: [...(negState.requestRegions || [])] },
        timestamp: Date.now(),
        turn: gameState.turn,
        status: 'pending'
    };
    
    console.log('Negociação criada:', negotiation);
    return negotiation;
  }

  _validateExecution(negotiation) {
    const initiator = gameState.players[negotiation.initiatorId];
    const target = gameState.players[negotiation.targetId];
    
    const checkRes = (p, list) => ['madeira','pedra','ouro','agua'].every(k => (list[k]||0) <= (p.resources[k]||0));
    
    // Verificação segura de regiões
    const checkReg = (p, list) => {
        if (!list || !list.length) return true;
        return list.every(rid => p.regions.includes(rid));
    };

    if (!checkRes(initiator, negotiation.offer)) {
      return { valid: false, message: 'Iniciador não possui recursos suficientes.' };
    }
    if (!checkReg(initiator, negotiation.offer.regions)) {
      return { valid: false, message: 'Iniciador perdeu controle da região.' };
    }
    if (!checkRes(target, negotiation.request)) {
      return { valid: false, message: 'Alvo não possui recursos suficientes.' };
    }
    if (!checkReg(target, negotiation.request.regions)) {
      return { valid: false, message: 'Alvo perdeu controle da região.' };
    }

    return { valid: true };
  }
}