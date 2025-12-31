// phase-manager.js - Gerenciador Consolidado de Fases (Refatorado)
import { 
  gameState, 
  addActivityLog,
  setCurrentPhase as setGameStatePhase,
  getCurrentPhase as getGameStatePhase
} from '../state/game-state.js';
import { UI_CONSTANTS, TURN_PHASES, GAME_CONFIG } from '../state/game-config.js';

export class PhaseManager {
  constructor(gameLogic) {
    this.main = gameLogic;
    this.currentPhase = getGameStatePhase() || TURN_PHASES.RENDA;
    this.phaseHistory = [];
    this.phaseTimers = new Map();
    this.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
    this.phaseCallbacks = {
      [TURN_PHASES.RENDA]: this._handleIncomePhase.bind(this),
      [TURN_PHASES.ACOES]: this._handleActionsPhase.bind(this),
      [TURN_PHASES.NEGOCIACAO]: this._handleNegotiationPhase.bind(this)
    };
  }

  // ==================== CONTROLE DE FASES ====================

  getCurrentPhase() {
    return this.currentPhase;
  }

  setCurrentPhase(phase, force = false) {
    const oldPhase = this.currentPhase;
    
    if (oldPhase === phase && !force) {
      return phase;
    }

    if (!force && !this.validatePhaseTransition(oldPhase, phase)) {
      console.warn(`Transição de fase inválida: ${oldPhase} -> ${phase}`);
      return this.currentPhase;
    }

    this.currentPhase = phase;
    gameState.currentPhase = phase;
    setGameStatePhase(phase);
    
    this._recordPhaseChange(oldPhase, phase);
    this._executePhaseLogic(phase);
    this._logPhaseChange(phase);
    
    // Disparar evento global de mudança de fase
    window.dispatchEvent(new CustomEvent('phaseChanged', {
      detail: { oldPhase, newPhase: phase, player: gameState.players[gameState.currentPlayerIndex] }
    }));
    
    console.log(`🔄 Fase alterada: ${oldPhase} → ${phase}`);
    return phase;
  }

  advancePhase() {
    const phases = Object.values(TURN_PHASES);
    const currentIndex = phases.indexOf(this.currentPhase);
    
    if (currentIndex === -1) {
      console.warn(`Fase desconhecida: ${this.currentPhase}, resetando para 'renda'`);
      return this.setCurrentPhase(TURN_PHASES.RENDA, true);
    }
    
    const nextIndex = (currentIndex + 1) % phases.length;
    return this.setCurrentPhase(phases[nextIndex]);
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

  // ==================== GERENCIAMENTO DE AÇÕES ====================

  getRemainingActions() {
    return this.actionsLeft;
  }

  consumeAction() {
    if (this.actionsLeft <= 0) return false;
    this.actionsLeft--;
    
    // Atualizar gameState
    if (gameState) {
      gameState.actionsLeft = this.actionsLeft;
    }
    
    return this.actionsLeft;
  }

  resetActions() {
    const oldCount = this.actionsLeft;
    this.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
    
    // Atualizar gameState
    if (gameState) {
      gameState.actionsLeft = this.actionsLeft;
    }
    
    if (oldCount !== this.actionsLeft) {
      console.log(`🔄 Ações resetadas: ${oldCount} → ${this.actionsLeft}`);
    }
    
    return this.actionsLeft;
  }

  // ==================== LÓGICA DE FASE ====================

  _executePhaseLogic(phase) {
    const handler = this.phaseCallbacks[phase];
    if (handler) {
      handler();
    } else {
      console.warn(`⚠️ Nenhum handler para fase: ${phase}`);
    }
  }

  _handleIncomePhase() {
    console.log(`💰 Iniciando fase de Renda para ${gameState.players[gameState.currentPlayerIndex]?.name}`);
    this.resetActions();
    
    // Aplicar renda imediatamente
    if (this.main && this.main.turnLogic) {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (currentPlayer && !currentPlayer.eliminated) {
        this.main.turnLogic.applyIncome(currentPlayer);
      }
    }
    
    // Para humanos, mostrar modal de renda
    if (gameState.currentPlayerIndex !== undefined) {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (currentPlayer && !currentPlayer.eliminated && 
          !(currentPlayer.type === 'ai' || currentPlayer.isAI)) {
        
        // Pequeno delay para garantir que a UI esteja atualizada
        setTimeout(() => {
          if (window.uiManager?.modals?.showIncomeModal) {
            // O modal de renda será mostrado pelo TurnLogic
            console.log(`💰 Mostrando modal de renda para ${currentPlayer.name}`);
          }
        }, 300);
      }
    }
  }

  _handleActionsPhase() {
    console.log(`⚡ Iniciando fase de Ações para ${gameState.players[gameState.currentPlayerIndex]?.name}`);
    this.resetActions();
  }

  _handleNegotiationPhase() {
    console.log(`🤝 Iniciando fase de Negociação para ${gameState.players[gameState.currentPlayerIndex]?.name}`);
    this.actionsLeft = 1; // Apenas uma ação de negociação por turno
    
    // Atualizar gameState
    if (gameState) {
      gameState.actionsLeft = this.actionsLeft;
    }
    
    // Notificar sistema de negociação
    if (this.main && this.main.negotiationLogic) {
      this.main.negotiationLogic.setupPhase();
    }
    
    // Verificar propostas pendentes
    setTimeout(() => {
      if (window.uiManager?.negotiation?.checkPendingNegotiationsForCurrentPlayer) {
        window.uiManager.negotiation.checkPendingNegotiationsForCurrentPlayer();
      }
    }, 500);
  }

  // ==================== REGISTRO E LOG ====================

  _recordPhaseChange(oldPhase, newPhase) {
    const phaseEntry = {
      timestamp: Date.now(),
      turn: gameState?.turn || 0,
      oldPhase,
      newPhase,
      player: gameState?.players[gameState?.currentPlayerIndex]?.name || 'Desconhecido'
    };

    this.phaseHistory.unshift(phaseEntry);
    
    if (this.phaseHistory.length > 50) {
      this.phaseHistory = this.phaseHistory.slice(0, 50);
    }

    this.phaseTimers.set(newPhase, Date.now());
  }

  _logPhaseChange(phase) {
    const phaseNames = UI_CONSTANTS.PHASE_NAMES || {
      [TURN_PHASES.RENDA]: '💰 Renda',
      [TURN_PHASES.ACOES]: '⚡ Ações',
      [TURN_PHASES.NEGOCIACAO]: '🤝 Negociação'
    };

    const playerName = gameState?.players[gameState?.currentPlayerIndex]?.name || 'SISTEMA';
    
    addActivityLog({
      type: 'phase',
      playerName: 'SISTEMA',
      action: 'Fase alterada',
      details: `${phaseNames[phase] || phase} para ${playerName}`,
      turn: gameState?.turn || 0
    });
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

  getPhaseStatistics() {
    const phaseCounts = {};
    this.phaseHistory.forEach(entry => {
      phaseCounts[entry.newPhase] = (phaseCounts[entry.newPhase] || 0) + 1;
    });

    return {
      totalTransitions: this.phaseHistory.length,
      phaseCounts,
      currentPhase: {
        name: this.currentPhase,
        displayName: this.getPhaseDisplayName(),
        actionsLeft: this.actionsLeft
      }
    };
  }

  // ==================== DEBUG ====================

  getDebugInfo() {
    return {
      currentPhase: this.currentPhase,
      gameStatePhase: gameState?.currentPhase,
      displayName: this.getPhaseDisplayName(),
      actionsLeft: this.actionsLeft,
      gameStateActionsLeft: gameState?.actionsLeft,
      historyLength: this.phaseHistory.length,
      lastTransition: this.phaseHistory[0] || null,
      currentPlayer: gameState?.players[gameState?.currentPlayerIndex]?.name
    };
  }
}