// game-logic.js - Fachada Principal (Refatorada)
import { ActionLogic } from './logic-actions.js';
import { FactionLogic } from './logic-factions.js';
import { NegotiationLogic } from './logic-negotiation.js';
import { DisputeLogic } from './logic-dispute.js';
import { TurnLogic } from './logic-turn.js';
import { EventManager } from './event-manager.js';
import { IncomeCalculator } from './income-calculator.js';
import { PhaseManager } from './phase-manager.js';
import { AICoordinator } from './logic-ai-coordinator.js';
import { GameInitializer } from './game-initializer.js';
import { GameCoordinator } from './game-coordinator.js';
import { ValidationService } from './validation-service.js';
import { GameUtils } from './game-utils.js';
import { gameState, addActivityLog, getCurrentPlayer, saveGame } from '../state/game-state.js';

class GameLogic {

constructor() {
  console.log("🎮 GameLogic inicializando...");
  
  // Inicializar serviços principais
  this.initializer = new GameInitializer();
  this.coordinator = new GameCoordinator(this);
  this.validator = new ValidationService(this);
  this.utils = GameUtils;
  
  // Inicializar submódulos de lógica
  this.actionsLogic = new ActionLogic(this);
  this.negotiationLogic = new NegotiationLogic(this);
  
  // Inicializar serviços do TurnLogic
  this.eventManager = new EventManager(this);
  this.incomeCalculator = new IncomeCalculator(this);
  
  // Inicializar TurnLogic com serviços injetados
  this.turnLogic = new TurnLogic(this);
  this.turnLogic.eventManager = this.eventManager;
  this.turnLogic.incomeCalculator = this.incomeCalculator;
  this.turnLogic.phaseManager = this.phaseManager;

  // Obter PhaseManager do coordinator
  this.phaseManager = this.coordinator.phaseManager;
  this.turnLogic.phaseManager = this.phaseManager;
  
  // Inicializar demais módulos
  this.aiCoordinator = new AICoordinator(this);
  this.factionLogic = new FactionLogic(this);
  this.disputeLogic = new DisputeLogic(this);
  
  this.feedbackHistory = [];
  
  console.log("✅ GameLogic inicializado com todos os serviços");
}

  // ==================== INICIALIZAÇÃO (FACHADA) ====================

  initializeGame() {
    console.log("🎮 Inicializando jogo via GameLogic...");
    
    // Delegar para o initializer
    const success = this.initializer.initializeGame();
    
    if (!success) {
      this.showFeedback('Erro ao inicializar o jogo', 'error');
      return false;
    }
    
    // Iniciar monitor de IA
    this.aiCoordinator.startHealthMonitor();
    
    // Aplicar renda inicial ao jogador atual via PhaseManager
    // O PhaseManager já aplicará a renda quando a fase for processada
    
    // Não é necessário timeout de segurança - o fluxo é gerenciado pelo PhaseManager
    
    return true;
  }

  // ==================== AÇÕES DO JOGADOR (FACHADA) ====================

  handleExplore() { 
    const validation = this.validator.validateAction('explorar');
    if (!validation.valid) {
      this.showFeedback(validation.reason, 'error');
      return;
    }
    this.actionsLogic.handleExplore(); 
  }
  
  handleCollect() { 
    const validation = this.validator.validateAction('recolher');
    if (!validation.valid) {
      this.showFeedback(validation.reason, 'error');
      return;
    }
    this.actionsLogic.handleCollect(); 
  }
  
  handleBuild(type) { 
    const validation = this.validator.validateAction('construir', { structureType: type });
    if (!validation.valid) {
      this.showFeedback(validation.reason, 'error');
      return;
    }
    this.actionsLogic.handleBuild(type); 
  }

  async handleDispute(region, attacker) {
    if (!this.disputeLogic) {
      this.showFeedback('Sistema de disputa não inicializado.', 'error');
      return null;
    }
    
    // Se região não for fornecida, usar a selecionada
    if (!region && gameState.selectedRegionId !== null) {
      region = gameState.regions[gameState.selectedRegionId];
    }
    
    // Se atacante não for fornecido, usar jogador atual
    if (!attacker) {
      attacker = getCurrentPlayer();
    }
    
    if (!region || !attacker) {
      this.showFeedback('Dados insuficientes para disputa.', 'error');
      return null;
    }
    
    // Validar disputa
    const validation = this.validator.validateAction('disputar', {
      player: attacker,
      regionId: region.id
    });
    
    if (!validation.valid) {
      this.showFeedback(validation.reason, 'error');
      return null;
    }
    
    return await this.disputeLogic.handleDispute(region, attacker);
  }
  
  performAction(type) { 
    return this.actionsLogic.consumeAction(); 
  }

  // ==================== NEGOCIAÇÃO (FACHADA) ====================

  handleNegotiate() { 
    const validation = this.validator.validateAction('negociar');
    if (!validation.valid) {
      this.showFeedback(validation.reason, 'error');
      return;
    }
    this.negotiationLogic.handleNegotiate(); 
  }
  
  handleSendNegotiation() { 
    return this.negotiationLogic.handleSendNegotiation(); 
  }
  
  handleNegResponse(accepted) { 
    this.negotiationLogic.handleResponse(accepted); 
  }
  
  executeNegotiation(neg) { 
    return this.negotiationLogic._executeTrade(neg); 
  }

  // ==================== TURNO E FASES (FACHADA) ====================

  handleEndTurn() { 
    this.turnLogic.handleEndTurn(); 
  }
  
  advancePhase() { 
    return this.coordinator.advancePhase(); 
  }
  
  applyIncomeForPlayer(player) { 
    this.turnLogic.applyIncome(player); 
  }

  // ==================== IA (FACHADA) ====================

  handleAITurn() { 
    this.aiCoordinator.checkAndExecuteAITurn(); 
  }
  
  checkAndExecuteAITurn() { 
    this.aiCoordinator.checkAndExecuteAITurn(); 
  }
  
  forceAIEndTurn() { 
    this.aiCoordinator.forceAIEndTurn(); 
  }

  // ==================== GETTERS IMPORTANTES ====================

getRemainingActions() {
  return this.coordinator?.getRemainingActions() || 0;
}

getCurrentPhase() {
  return this.coordinator?.getCurrentPhase() || 'renda';
}

isCurrentPlayerAI() {
  const player = this.getCurrentPlayer();
  return player && (player.type === 'ai' || player.isAI);
}

  // ==================== VALIDAÇÕES (FACHADA) ====================

  canAffordAction(actionType) {
    const player = getCurrentPlayer();
    
    // Verificar se jogador está eliminado
    if (player?.eliminated) {
      return actionType === 'explorar' && gameState.selectedRegionId !== null;
    }
    
    // Usar o validator
    const validation = this.validator.validateAction(actionType);
    return validation.valid;
  }

  validatePlayerAction(playerId, actionType) {
    const player = getPlayerById(playerId);
    
    if (!player) return false;
    
    // Verificar se jogador está eliminado
    if (player.eliminated) {
      return actionType === 'dominate' || actionType === 'explorar';
    }
    
    return true;
  }
  
  // ==================== UTILITÁRIOS (FACHADA) ====================

  showFeedback(message, type = 'info') {
  // Registrar no histórico
  this.feedbackHistory.push({ message, type, timestamp: Date.now() });
  if (this.feedbackHistory.length > 20) this.feedbackHistory.shift();
  
  // Capturar feedback na IA
  this.aiCoordinator?.captureFeedback?.(message, type);
  
  // Mostrar na UI
  if (window.uiManager?.modals?.showFeedback) {
    window.uiManager.modals.showFeedback(message, type);
  } else {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
  
  // ATUALIZAÇÃO CRÍTICA: Forçar atualização da UI
  this._updateUI();
}

  async showConfirm(title, message) {
    if (window.uiManager?.modals?.showConfirm) {
      return await window.uiManager.modals.showConfirm(title, message);
    }
    return confirm(message);
  }
  
  preventActionIfModalOpen() {
    const modal = document.getElementById('negotiationModal');
    const responseModal = document.getElementById('negResponseModal');
    return (modal && !modal.classList.contains('hidden')) || 
           (responseModal && !responseModal.classList.contains('hidden'));
  }
  
  // ==================== PERSISTÊNCIA (FACHADA) ====================

  autoSave() {
    if (gameState?.gameStarted) saveGame();
  }

  // ==================== GETTERS ÚTEIS ====================

  getGameState() {
    return { ...gameState };
  }

  getCurrentPlayer() {
    return getCurrentPlayer();
  }

  getValidationReport() {
    return this.validator.getValidationReport();
  }

  getDebugInfo() {
    return {
      coordinator: this.coordinator.getDebugInfo(),
      initializer: this.initializer.validateGameState(),
      actionsLeft: this.coordinator.getRemainingActions(),
      selectedRegion: gameState.selectedRegionId,
      feedbackHistory: this.feedbackHistory.length
    };
  }

  // ==================== MÉTODOS DE ATUALIZAÇÃO ====================

  _updateUI() {
    if (window.uiManager) {
      window.uiManager.updateUI();
      if (window.uiManager.gameManager) {
        setTimeout(() => window.uiManager.gameManager.updateFooter(), 100);
      }
    }
  }
}

export { GameLogic };
