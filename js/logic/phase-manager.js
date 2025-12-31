// phase-manager.js - Gerenciador Consolidado de Fases (ATUALIZADO)
import { gameState, addActivityLog } from '../state/game-state.js';
import { UI_CONSTANTS, TURN_PHASES, GAME_CONFIG } from '../state/game-config.js';

export class PhaseManager {
  constructor(gameLogic) {
    this.main = gameLogic;
    this.currentPhase = TURN_PHASES.RENDA;
    this.phaseHistory = [];
    this.phaseTimers = new Map();
    
    // Sincronizar com gameState
    this._syncWithGameState();
  }

  // ==================== SINCRONIZAÇÃO DE ESTADO ====================

  _syncWithGameState() {
    // Inicializar sincronização
    if (gameState) {
      gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
      gameState.currentPhase = this.currentPhase;
    }
  }

  // ==================== CONTROLE DE FASES ====================

  getCurrentPhase() {
    return this.currentPhase;
  }

  setCurrentPhase(phase) {
    const oldPhase = this.currentPhase;
    
    if (oldPhase === phase) {
      return phase;
    }

    if (!this.validatePhaseTransition(oldPhase, phase)) {
      console.warn(`Transição de fase inválida: ${oldPhase} -> ${phase}`);
      return this.currentPhase;
    }

    this.currentPhase = phase;
    
    // Sincronizar com gameState
    if (gameState) {
      gameState.currentPhase = phase;
    }
    
    this._recordPhaseChange(oldPhase, phase);
    this._executePhaseLogic(phase);
    this._logPhaseChange(phase);
    this._updateUI();

    return phase;
  }

  // ==================== CONTROLE DE AÇÕES ====================

  getRemainingActions() {
    return gameState?.actionsLeft || 0;
  }

  consumeAction() {
    if (this.getRemainingActions() <= 0) return false;
    
    if (gameState) {
      gameState.actionsLeft--;
    }
    
    this._updateUI();
    return this.getRemainingActions();
  }

  resetActions(playerId = null) {
    const oldCount = this.getRemainingActions();
    const newCount = GAME_CONFIG.ACTIONS_PER_TURN;
    
    if (gameState) {
      gameState.actionsLeft = newCount;
    }
    
    if (oldCount !== newCount) {
      console.log(`🔄 Ações resetadas para ${playerId ? `jogador ${playerId}` : 'geral'}: ${oldCount} → ${newCount}`);
    }
    
    this._updateUI();
    return newCount;
  }

  // ==================== LÓGICA DE FASE ====================

  _executePhaseLogic(phase) {
    switch (phase) {
      case TURN_PHASES.RENDA:
        this._handleIncomePhase();
        break;
      case TURN_PHASES.ACOES:
        this._handleActionsPhase();
        break;
      case TURN_PHASES.NEGOCIACAO:
        this._handleNegotiationPhase();
        break;
    }
  }

  _handleIncomePhase() {
    console.log(`🔄 Entrando na fase de Renda`);
    this.resetActions();
    
    // Mostrar feedback para jogador humano
    const currentPlayer = gameState?.players[gameState?.currentPlayerIndex];
    if (currentPlayer && !currentPlayer.isAI) {
      this.main?.showFeedback('Fase de Renda - Recolha seus recursos!', 'info');
    }
  }

  _handleActionsPhase() {
    console.log(`🔄 Entrando na fase de Ações`);
    this.resetActions();
    
    // Mostrar feedback
    const actionsLeft = this.getRemainingActions();
    this.main?.showFeedback(`Fase de Ações - ${actionsLeft} ações disponíveis`, 'info');
  }

  _handleNegotiationPhase() {
    console.log(`🔄 Entrando na fase de Negociação`);
    
    // Apenas uma ação de negociação por turno
    if (gameState) {
      gameState.actionsLeft = 1;
    }
    
    // Verificar propostas pendentes
    setTimeout(() => {
      if (window.uiManager?.negotiation?.checkPendingNegotiationsForCurrentPlayer) {
        window.uiManager.negotiation.checkPendingNegotiationsForCurrentPlayer();
      }
    }, 500);

    this.main?.showFeedback('Fase de Negociação - Você pode negociar com outros jogadores', 'info');
  }

  // ==================== ATUALIZAÇÃO DE UI ====================

  _updateUI() {
    // Atualizar interface imediatamente
    if (window.uiManager) {
      window.uiManager.updateUI();
      
      // Forçar atualização do footer
      if (window.uiManager.gameManager?.updateFooter) {
        window.uiManager.gameManager.updateFooter();
      }
    }
  }

  // ==================== VALIDAÇÃO ====================

  validatePhaseTransition(fromPhase, toPhase) {
    const validTransitions = {
      [TURN_PHASES.RENDA]: [TURN_PHASES.ACOES],
      [TURN_PHASES.ACOES]: [TURN_PHASES.NEGOCIACAO],
      [TURN_PHASES.NEGOCIACAO]: [TURN_PHASES.RENDA]
    };
    return validTransitions[fromPhase]?.includes(toPhase) || false;
  }

  validateActionForPhase(actionType) {
    const phaseActions = {
      [TURN_PHASES.RENDA]: [],
      [TURN_PHASES.ACOES]: ['explorar', 'recolher', 'construir', 'disputar'],
      [TURN_PHASES.NEGOCIACAO]: ['negociar']
    };
    return phaseActions[this.currentPhase]?.includes(actionType) || false;
  }

  // ==================== UTILITÁRIOS ====================

  getPhaseDisplayName(phase = null) {
    const targetPhase = phase || this.currentPhase;
    const phaseNames = UI_CONSTANTS.PHASE_NAMES || {
      [TURN_PHASES.RENDA]: '💰 Renda',
      [TURN_PHASES.ACOES]: '⚡ Ações',
      [TURN_PHASES.NEGOCIACAO]: '🤝 Negociação'
    };
    return phaseNames[targetPhase] || targetPhase;
  }

  // ==================== DEBUG ====================

  getDebugInfo() {
    return {
      currentPhase: this.currentPhase,
      displayName: this.getPhaseDisplayName(),
      actionsLeft: this.getRemainingActions(),
      gameStateSynced: gameState?.actionsLeft === this.getRemainingActions(),
      gameStatePhase: gameState?.currentPhase
    };
  }
}