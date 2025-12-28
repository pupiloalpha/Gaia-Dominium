// game-logic.js - Fachada Principal (Atualizado)
import { ActionLogic } from './logic-actions.js';
import { FactionLogic } from './logic-factions.js';
import { NegotiationLogic } from './logic-negotiation.js';
import { DisputeLogic } from './logic-dispute.js';
import { TurnLogic } from './logic-turn.js';
import { AICoordinator } from './logic-ai-coordinator.js';
import { ActionValidator } from './action-validator.js'; // NOVA IMPORT
import { gameState, addActivityLog, getCurrentPlayer, saveGame } from '../state/game-state.js';
import { GAME_CONFIG } from '../state/game-config.js';

class GameLogic {
  constructor() {
    // Inicializar submódulos
    this.actionsLogic = new ActionLogic(this);
    this.negotiationLogic = new NegotiationLogic(this);
    this.turnLogic = new TurnLogic(this);
    this.aiCoordinator = new AICoordinator(this);
    this.factionLogic = new FactionLogic(this);
    this.disputeLogic = new DisputeLogic(this);
    this.validator = new ActionValidator(this); // NOVO VALIDADOR
    
    this.feedbackHistory = [];
  }

  // ==================== MÉTODOS DE FACADE ====================
  
  // Ações Físicas
  handleExplore() { this.actionsLogic.handleExplore(); }
  handleCollect() { this.actionsLogic.handleCollect(); }
  handleBuild(type) { this.actionsLogic.handleBuild(type); }
  
  async handleDispute(region, attacker) {
    if (!this.disputeLogic) {
      this.showFeedback('Sistema de disputa não inicializado.', 'error');
      return null;
    }
    
    if (!region && gameState.selectedRegionId !== null) {
      region = gameState.regions[gameState.selectedRegionId];
    }
    
    if (!attacker) {
      attacker = getCurrentPlayer();
    }
    
    if (!region || !attacker) {
      this.showFeedback('Dados insuficientes para disputa.', 'error');
      return null;
    }
    
    return await this.disputeLogic.handleDispute(region, attacker);
  }
  
  // Negociação
  handleNegotiate() { this.negotiationLogic.handleNegotiate(); }
  handleSendNegotiation() { return this.negotiationLogic.handleSendNegotiation(); }
  handleNegResponse(accepted) { this.negotiationLogic.handleResponse(accepted); }
  executeNegotiation(neg) { return this.negotiationLogic._executeTrade(neg); }
  
  // Turno e Fases
  handleEndTurn() { this.turnLogic.handleEndTurn(); }
  advancePhase() { return this.turnLogic.advancePhase(); }
  applyIncomeForPlayer(player) { this.turnLogic.applyIncome(player); }
  
  // IA Bridge
  handleAITurn() { this.aiCoordinator.checkAndExecuteAITurn(); }
  checkAndExecuteAITurn() { this.aiCoordinator.checkAndExecuteAITurn(); }
  forceAIEndTurn() { this.aiCoordinator.forceAIEndTurn(); }

  // ==================== MÉTODOS DE UTILIDADE ====================
  
  // VALIDAÇÃO SIMPLIFICADA USANDO O NOVO VALIDADOR
  canAffordAction(actionType) {
    const player = getCurrentPlayer();
    return this.validator.canAffordAction(player, actionType, gameState.selectedRegionId);
  }
  
  validatePlayerAction(playerId, actionType) {
    const player = getPlayerById(playerId);
    if (!player) return false;
    
    const validation = this.validator.validatePlayerState(player, actionType);
    return validation.valid;
  }
  
  preventActionIfModalOpen() {
    const modal = document.getElementById('negotiationModal');
    const responseModal = document.getElementById('negResponseModal');
    return (modal && !modal.classList.contains('hidden')) || 
           (responseModal && !responseModal.classList.contains('hidden'));
  }

  // ==================== FEEDBACK E UI ====================
  
  showFeedback(message, type = 'info') {
    if (this.aiCoordinator?.captureFeedback) {
      this.aiCoordinator.captureFeedback(message, type);
    }
    
    if (window.uiManager?.modals?.showFeedback) {
      window.uiManager.modals.showFeedback(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  async showConfirm(title, message) {
    if (window.uiManager?.modals?.showConfirm) {
      return await window.uiManager.modals.showConfirm(title, message);
    }
    return confirm(message);
  }
  
  autoSave() {
    if (gameState?.gameStarted) saveGame();
  }
  
  // ==================== GETTERS ÚTEIS ====================
  
  getStructureCost(structureType) {
    const costs = {
      'Abrigo': { madeira: 3, pedra: 2, ouro: 1 },
      'Torre de Vigia': { madeira: 2, pedra: 3 },
      'Mercado': { madeira: 4, pedra: 1, agua: 2 },
      'Laboratório': { pedra: 3, ouro: 2, agua: 1 },
      'Santuário': { madeira: 3, ouro: 2, agua: 2 }
    };
    return costs[structureType] || {};
  }
}

export { GameLogic };