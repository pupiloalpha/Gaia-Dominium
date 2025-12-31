// game-logic.js - Fachada Principal (ATUALIZADO)
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
    this.phaseManager = new PhaseManager(this); // Instanciar diretamente
    
    // Inicializar TurnLogic
    this.turnLogic = new TurnLogic(this);
    
    // Inicializar IA ANTES de outros serviços
    this.aiCoordinator = new AICoordinator(this);
    
    // Inicializar demais módulos
    this.factionLogic = new FactionLogic(this);
    this.disputeLogic = new DisputeLogic(this);
    
    this.feedbackHistory = [];
    
    console.log("✅ GameLogic inicializado com todos os serviços");
  }

  // ==================== INICIALIZAÇÃO ====================

  initializeGame() {
    console.log("🎮 Inicializando jogo via GameLogic...");
    
    // Delegar para o initializer
    const success = this.initializer.initializeGame();
    
    if (!success) {
      this.showFeedback('Erro ao inicializar o jogo', 'error');
      return false;
    }
    
    // Configurar IA com jogadores
    if (gameState.players && this.aiCoordinator) {
      this.aiCoordinator.initialize(gameState.players);
    }
    
    // Iniciar monitor de IA
    if (this.aiCoordinator?.startHealthMonitor) {
      this.aiCoordinator.startHealthMonitor();
    }
    
    // Aplicar renda inicial ao jogador atual
    const currentPlayer = getCurrentPlayer();
    if (currentPlayer) {
      this.turnLogic.applyIncome(currentPlayer);
    }
    
    // Configurar timeout de segurança
    setTimeout(() => {
      if (gameState.currentPhase === 'renda') {
        this.coordinator.setCurrentPhase('acoes');
        this._updateUI();
      }
    }, 5000);
    
    // Notificar início do jogo
    this.showFeedback('Jogo inicializado!', 'success');
    
    return true;
  }

  // ==================== CONTROLE DE IA ====================

  handleAITurn() {
    if (!this.aiCoordinator) {
      console.error('❌ AICoordinator não inicializado');
      return;
    }
    
    // Verificar se é realmente turno de IA
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer || !(currentPlayer.type === 'ai' || currentPlayer.isAI)) {
      console.log('⏸️ Não é turno de IA');
      return;
    }
    
    this.aiCoordinator.checkAndExecuteAITurn();
  }
  
  checkAndExecuteAITurn() {
    this.handleAITurn();
  }
  
  forceAIEndTurn() {
    if (this.aiCoordinator) {
      this.aiCoordinator.forceAIEndTurn();
    }
  }

  // ==================== GETTERS IMPORTANTES ====================

  getRemainingActions() {
    return this.coordinator?.getRemainingActions() || 0;
  }

  getCurrentPhase() {
    return this.coordinator?.getCurrentPhase() || 'renda';
  }

  // ==================== UTILITÁRIOS ====================

  showFeedback(message, type = 'info') {
    // Registrar no histórico
    this.feedbackHistory.push({ message, type, timestamp: Date.now() });
    if (this.feedbackHistory.length > 20) this.feedbackHistory.shift();
    
    // Capturar feedback na IA
    if (this.aiCoordinator?.captureFeedback) {
      this.aiCoordinator.captureFeedback(message, type);
    }
    
    // Mostrar na UI
    if (window.uiManager?.modals?.showFeedback) {
      window.uiManager.modals.showFeedback(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
    
    // Atualizar UI imediatamente
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
