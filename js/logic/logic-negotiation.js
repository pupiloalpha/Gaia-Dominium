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
    
    // 1. Obter custo dinâmico de negociação (Ex: Mestres das Águas têm custo 0 na primeira vez)
    let negCost = 1; // Padrão
    if (this.main.factionLogic) {
        // Apenas verifica o custo, não consome a habilidade ainda
        // Para verificar, usamos o modify mas sabemos que ele não altera estado do player, 
        // apenas retorna o valor.
        negCost = this.main.factionLogic.modifyNegotiationCost(player);
    }

    // 2. Verificar se tem ouro suficiente (mesmo que seja 0)
    if (player.resources.ouro < negCost) { 
      this.main.showFeedback(`Necessário ${negCost} Ouro para negociar.`, 'error'); 
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
    
    // Validação preliminar
    if (!this._validateSendConditions(player, negState)) return false;

    // Confirmação UI
    let confirm = true;
    if (!(player.type === 'ai' || player.isAI)) {
        confirm = await this.main.showConfirm('Enviar Proposta', `Enviar proposta para jogador?`);
    }

    if (!confirm) return false;
    
    // 1. Calcular e Consumir Custo de Negociação
    let negotiationCost = 1;
    if (this.main.factionLogic) {
        // Isso retorna o custo (0 ou 1) e internamente marca a habilidade como usada se for 0
        negotiationCost = this.main.factionLogic.modifyNegotiationCost(player);
    }

    gameState.actionsLeft--;
    player.resources.ouro -= negotiationCost; // Pode ser 0

    const negotiation = this._buildNegotiationObject(player, negState);
    addPendingNegotiation(negotiation);
    
    // Fechar UI
    if (window.uiManager?.negotiation && typeof window.uiManager.negotiation.closeNegotiationModal === 'function') {
        window.uiManager.negotiation.closeNegotiationModal();
    } else {
        document.getElementById('negotiationModal')?.classList.add('hidden');
    }
    
    resetNegotiationState();
    
    // Notificar UI
    if (window.uiManager?.negotiation) {
        setTimeout(() => window.uiManager.negotiation.showNegotiationNotification(negotiation), 500);
    }
     
    const target = gameState.players[negotiation.targetId];
    
    // NOTIFICAR A IA SE O ALVO FOR IA
    if (target.type === 'ai' || target.isAI) {
        console.log(`🤖 Notificando IA ${target.name} sobre nova proposta`);
        
        // Pequeno delay para garantir processamento
        setTimeout(() => {
            if (window.uiManager?.negotiation?.showNegotiationNotification) {
                window.uiManager.negotiation.showNegotiationNotification(negotiation);
            }
        }, 500);
    }
    
    // 2. Aplicar Bônus de Facção (Ex: Mercadores ganham PV ao negociar)
    let bonusMsg = '';
    if (this.main.factionLogic) {
        const bonus = this.main.factionLogic.applyNegotiationBonus(player);
        if (bonus.pv > 0) {
            player.victoryPoints += bonus.pv;
            bonusMsg = ` (+${bonus.pv} PV Facção)`;
        }
    }

    addActivityLog({ 
      type: 'negotiate', 
      playerName: player.name, 
      action: 'enviou proposta para', 
      details: target.name, 
      turn: gameState.turn 
    });
    
    this.main.showFeedback(`Proposta enviada para ${target.name}!${bonusMsg}`, 'success');
    
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
    const initiator = gameState.players[negotiation.initiatorId];

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
            
      // FEEDBACK VISUAL MELHORADO
    const feedbackMsg = `🤝 ${target.name} aceitou a proposta de ${initiator.name}!`;
    this.main.showFeedback(feedbackMsg, 'success');
    
    // Log detalhado no console
    console.log(`✅ NEGOCIAÇÃO ACEITA: ${initiator.name} ↔ ${target.name}`);
    console.log(`📤 Oferecido:`, negotiation.offer);
    console.log(`📥 Recebido:`, negotiation.request);
            
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
        // FEEDBACK VISUAL MELHORADO
    const feedbackMsg = `❌ ${target.name} recusou a proposta de ${initiator.name}.`;
    this.main.showFeedback(feedbackMsg, 'info');
    
    console.log(`❌ NEGOCIAÇÃO RECUSADA: ${initiator.name} → ${target.name}`);
        
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
      // Verificar vitória IMEDIATAMENTE após negociação
      setTimeout(() => {
          if (window.gameLogic?.turnLogic?.checkVictory) {
              window.gameLogic.turnLogic.checkVictory();
          }
      }, 500);
        return true;
    } catch (e) {
        console.error("Erro na troca:", e);
        return false;
    }
  }

  _validateSendConditions(player, negState) {
    if (gameState.currentPhase !== 'negociacao') return false;
    if (gameState.actionsLeft <= 0) return false;

    // Verificação de Ouro agora depende da facção
    let requiredGold = 1;
    if (this.main.factionLogic) {
        // Apenas verifica custo sem modificar estado
        // (Assumindo que modifyNegotiationCost é inteligente ou que fazemos verificação simples aqui)
        // Como modifyNegotiationCost altera o estado (decrementa turnBonus), 
        // aqui apenas verificamos se ele TEM ouro suficiente caso o custo fosse cobrado.
        // Se a lógica da facção diz que custa 0, então requiredGold seria 0.
        // Para simplificar a validação UI, validamos >= 0.
    }
    
    // Nota: A validação estrita de "tem ouro suficiente" é feita no handleNegotiate e handleSendNegotiation
    // com base no retorno exato da factionLogic. Aqui garantimos integridade básica.

    const targetId = Number(negState.targetPlayerId);
    if (isNaN(targetId) || targetId === null || targetId === undefined) { 
        this.main.showFeedback('Selecione um alvo.', 'error'); 
        return false; 
    }
    
    if (!validateNegotiationState()) {
        const errors = getNegotiationValidationErrors();
        
        // Filtramos erro de "Precisa de 1 Ouro" se o custo for 0
        const cost = this.main.factionLogic ? this.main.factionLogic.modifyNegotiationCost(player) : 1;
        const filteredErrors = errors.filter(e => {
            if (cost === 0 && e.includes('Precisa de 1 Ouro')) return false;
            return true;
        });

        if (filteredErrors.length > 0) {
            this.main.showFeedback(filteredErrors[0] || 'Proposta inválida', 'error');
            return false;
        }
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
