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
    
    // Configurar handlers de fase
    this.phaseHandlers = {
      [TURN_PHASES.RENDA]: this._handleIncomePhase.bind(this),
      [TURN_PHASES.ACOES]: this._handleActionsPhase.bind(this),
      [TURN_PHASES.NEGOCIACAO]: this._handleNegotiationPhase.bind(this)
    };
    
    // Configurar validadores de transição
    this.validTransitions = {
      [TURN_PHASES.RENDA]: [TURN_PHASES.ACOES],
      [TURN_PHASES.ACOES]: [TURN_PHASES.NEGOCIACAO],
      [TURN_PHASES.NEGOCIACAO]: [TURN_PHASES.RENDA]
    };
    
    // Inicializar estado
    this._syncWithGameState();
  }

  // ==================== SINCRONIZAÇÃO ====================

  _syncWithGameState() {
    // Garantir que PhaseManager e gameState estejam sincronizados
    if (gameState.currentPhase && gameState.currentPhase !== this.currentPhase) {
      console.log(`🔄 Sincronizando fase: ${this.currentPhase} -> ${gameState.currentPhase}`);
      this.currentPhase = gameState.currentPhase;
    } else {
      gameState.currentPhase = this.currentPhase;
    }
    
    gameState.actionsLeft = this.actionsLeft;
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

    if (!force && !this._validatePhaseTransition(oldPhase, phase)) {
      console.warn(`Transição de fase inválida: ${oldPhase} -> ${phase}`);
      return this.currentPhase;
    }

    // Atualizar estado interno
    this.currentPhase = phase;
    
    // Sincronizar com gameState
    this._syncWithGameState();
    
    // Registrar mudança
    this._recordPhaseChange(oldPhase, phase);
    
    // Executar lógica da nova fase
    this._executePhaseLogic(phase);
    
    // Disparar evento global
    this._dispatchPhaseChangeEvent(oldPhase, phase);
    
    console.log(`🔄 PhaseManager: Fase alterada ${oldPhase} → ${phase}`);
    return phase;
  }

  _validatePhaseTransition(fromPhase, toPhase) {
    return this.validTransitions[fromPhase]?.includes(toPhase) || false;
  }

  _dispatchPhaseChangeEvent(oldPhase, newPhase) {
    window.dispatchEvent(new CustomEvent('phaseChanged', {
      detail: { 
        oldPhase, 
        newPhase, 
        player: gameState.players[gameState.currentPlayerIndex],
        actionsLeft: this.actionsLeft
      }
    }));
  }

  // ==================== AVANÇO DE FASES ====================

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

  // ==================== LÓGICA DE FASES ====================

  _executePhaseLogic(phase) {
    const handler = this.phaseHandlers[phase];
    if (handler) {
      try {
        handler();
      } catch (error) {
        console.error(`Erro no handler da fase ${phase}:`, error);
      }
    }
    
    // Registrar no log
    this._logPhaseChange(phase);
  }

  _handleIncomePhase() {
    console.log(`💰 PhaseManager: Fase de Renda iniciada`);
    this.resetActions();
    
    // Aplicar renda ao jogador atual
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer && !currentPlayer.eliminated && this.main?.turnLogic) {
      this.main.turnLogic.applyIncome(currentPlayer);
    }
  }

  _handleActionsPhase() {
    console.log(`⚡ PhaseManager: Fase de Ações iniciada`);
    this.resetActions();
  }

  _handleNegotiationPhase() {
    console.log(`🤝 PhaseManager: Fase de Negociação iniciada`);
    this.actionsLeft = 1; // Apenas uma ação de negociação por turno
    this._syncWithGameState();
    
    // Verificar propostas pendentes
    setTimeout(() => {
      if (window.uiManager?.negotiation?.checkPendingNegotiationsForCurrentPlayer) {
        window.uiManager.negotiation.checkPendingNegotiationsForCurrentPlayer();
      }
    }, 500);
  }

  // ==================== GERENCIAMENTO DE AÇÕES ====================

  getRemainingActions() {
    return this.actionsLeft;
  }

  consumeAction() {
    if (this.actionsLeft <= 0) {
      console.warn('Tentativa de consumir ação quando não há ações disponíveis');
      return false;
    }
    
    this.actionsLeft--;
    this._syncWithGameState();
    
    console.log(`📝 Ação consumida. Restam: ${this.actionsLeft}`);
    return this.actionsLeft;
  }

  resetActions() {
    this.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
    this._syncWithGameState();
    console.log(`🔄 Ações resetadas para: ${this.actionsLeft}`);
  }

  // ==================== VALIDAÇÃO ====================

  validateActionForPhase(actionType) {
    const phaseActions = {
      [TURN_PHASES.RENDA]: [],
      [TURN_PHASES.ACOES]: ['explorar', 'recolher', 'construir', 'disputar'],
      [TURN_PHASES.NEGOCIACAO]: ['negociar']
    };
    
    return phaseActions[this.currentPhase]?.includes(actionType) || false;
  }

  canPerformAction(actionType) {
    if (this.actionsLeft <= 0) {
      return { valid: false, reason: 'Sem ações restantes' };
    }
    
    if (!this.validateActionForPhase(actionType)) {
      return { 
        valid: false, 
        reason: `Ação não permitida na fase ${this.getPhaseDisplayName()}` 
      };
    }
    
    return { valid: true, reason: '' };
  }

  // ==================== REGISTRO E LOG ====================

  _recordPhaseChange(oldPhase, newPhase) {
    const phaseEntry = {
      timestamp: Date.now(),
      turn: gameState?.turn || 0,
      oldPhase,
      newPhase,
      player: gameState?.players[gameState?.currentPlayerIndex]?.name || 'Desconhecido',
      actionsLeft: this.actionsLeft
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
        actionsLeft: this.actionsLeft,
        duration: this.phaseTimers.has(this.currentPhase) 
          ? Date.now() - this.phaseTimers.get(this.currentPhase)
          : 0
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
      currentPlayer: gameState?.players[gameState?.currentPlayerIndex]?.name,
      isSynchronized: this.currentPhase === gameState?.currentPhase && 
                     this.actionsLeft === gameState?.actionsLeft
    };
  }
}