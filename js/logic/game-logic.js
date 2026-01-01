// game-logic.js - Fachada Principal Simplificada
import { ActionLogic } from './logic-actions.js';
import { FactionLogic } from './logic-factions.js';
import { NegotiationLogic } from './logic-negotiation.js';
import { DisputeLogic } from './logic-dispute.js';
import { TurnPhaseManager } from './turn-phase-manager.js';
import { EventManager } from './event-manager.js';
import { IncomeCalculator } from './income-calculator.js';
import { AICoordinator } from './logic-ai-coordinator.js';
import { GameInitializer } from './game-initializer.js';
import { ValidationService } from './validation-service.js';
import { GameUtils } from './game-utils.js';
import { gameState, getCurrentPlayer, saveGame } from '../state/game-state.js';

class GameLogic {
  constructor() {
    console.log("🎮 GameLogic inicializando...");
    
    // Inicializar serviços
    this.initializer = new GameInitializer();
    this.validator = new ValidationService(this);
    this.utils = GameUtils;
    
    // Inicializar lógicas especializadas
    this.actionsLogic = new ActionLogic(this);
    this.negotiationLogic = new NegotiationLogic(this);
    this.disputeLogic = new DisputeLogic(this);
    this.factionLogic = new FactionLogic(this);
    
    // Inicializar serviços
    this.eventManager = new EventManager(this);
    this.incomeCalculator = new IncomeCalculator(this);
    this.aiCoordinator = new AICoordinator(this);
    
    // Inicializar gerenciador principal de turnos/fases
    this.turnManager = new TurnPhaseManager(this);
    
    this.feedbackHistory = [];
    
    console.log("✅ GameLogic inicializado");
  }

  // ==================== INICIALIZAÇÃO ====================

  initializeGame() {
    console.log("🎮 Inicializando jogo via GameLogic...");
    
    const success = this.initializer.initializeGame();
    
    if (!success) {
      this.showFeedback('Erro ao inicializar o jogo', 'error');
      return false;
    }
    
    // Iniciar monitor de IA
    this.aiCoordinator.startHealthMonitor();
    
    return true;
  }

  // ==================== AÇÕES (DELEGAÇÃO) ====================

  handleExplore() { 
    this.actionsLogic.handleExplore(); 
  }
  
  handleCollect() { 
    this.actionsLogic.handleCollect(); 
  }
  
  handleBuild(type) { 
    this.actionsLogic.handleBuild(type); 
  }
  
  handleNegotiate() { 
    this.negotiationLogic.handleNegotiate(); 
  }
  
  async handleDispute(region, attacker) {
    return await this.disputeLogic.handleDispute(region, attacker);
  }
  
  // ==================== TURNO E FASES ====================

  handleEndTurn() { 
    this.turnManager.endTurn(); 
  }
  
  advancePhase() { 
    return this.turnManager.advancePhase(); 
  }
  
  getRemainingActions() {
    return this.turnManager.getRemainingActions();
  }
  
  getCurrentPhase() {
    return this.turnManager.getCurrentPhase();
  }

  // ==================== IA ====================

  handleAITurn() { 
    this.aiCoordinator.checkAndExecuteAITurn(); 
  }
  
  checkAndExecuteAITurn() { 
    this.aiCoordinator.checkAndExecuteAITurn(); 
  }
  
  forceAIEndTurn() { 
    this.aiCoordinator.forceAIEndTurn(); 
  }

  // ==================== GETTERS ====================

  getCurrentPlayer() {
    return getCurrentPlayer();
  }

  isCurrentPlayerAI() {
    const player = this.getCurrentPlayer();
    return player && (player.type === 'ai' || player.isAI);
  }

  // ==================== VALIDAÇÕES ====================

  canAffordAction(actionType) {
    const player = getCurrentPlayer();
    
    if (player?.eliminated) {
      return actionType === 'explorar' && gameState.selectedRegionId !== null;
    }
    
    const validation = this.validator.validateAction(actionType);
    return validation.valid;
  }

  // ==================== FEEDBACK E UI ====================

  showFeedback(message, type = 'info') {
    this.feedbackHistory.push({ message, type, timestamp: Date.now() });
    if (this.feedbackHistory.length > 20) this.feedbackHistory.shift();
    
    this.aiCoordinator?.captureFeedback?.(message, type);
    
    if (window.uiManager?.modals?.showFeedback) {
      window.uiManager.modals.showFeedback(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
    
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

  // ==================== UTILITÁRIOS ====================

  _updateUI() {
    if (window.uiManager) {
      window.uiManager.updateUI();
      if (window.uiManager.gameManager) {
        setTimeout(() => window.uiManager.gameManager.updateFooter(), 100);
      }
    }
  }

  autoSave() {
    if (gameState?.gameStarted) saveGame();
  }

  // ==================== DEBUG ====================

  getDebugInfo() {
    return {
      turnManager: this.turnManager?.getDebugInfo?.() || {},
      actionsLeft: this.getRemainingActions(),
      currentPhase: this.getCurrentPhase(),
      currentPlayer: this.getCurrentPlayer()?.name,
      selectedRegion: gameState.selectedRegionId,
      feedbackHistory: this.feedbackHistory.length
    };
  }
}

export { GameLogic };