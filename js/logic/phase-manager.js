// phase-manager.js - Gerenciador Consolidado de Fases
import { addActivityLog } from '../state/game-state.js';
import { UI_CONSTANTS, TURN_PHASES, GAME_CONFIG } from '../state/game-config.js';

export class PhaseManager {
  constructor(gameLogic) {
    this.main = gameLogic;
    this.currentPhase = TURN_PHASES.RENDA;
    this.phaseHistory = [];
    this.phaseTimers = new Map();
    this.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
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
    this._recordPhaseChange(oldPhase, phase);
    this._executePhaseLogic(phase);
    this._logPhaseChange(phase);

    return phase;
  }

  advancePhase() {
    const phases = Object.values(TURN_PHASES);
    const currentIndex = phases.indexOf(this.currentPhase);
    
    if (currentIndex === -1) {
      console.warn(`Fase desconhecida: ${this.currentPhase}, resetando para 'renda'`);
      return this.setCurrentPhase(TURN_PHASES.RENDA);
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
    return this.actionsLeft;
  }

  resetActions() {
    const oldCount = this.actionsLeft;
    this.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
    
    if (oldCount !== this.actionsLeft) {
      console.log(`🔄 Ações resetadas: ${oldCount} → ${this.actionsLeft}`);
    }
    
    return this.actionsLeft;
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
  }

  _handleActionsPhase() {
    console.log(`🔄 Entrando na fase de Ações`);
    this.resetActions();
  }

  _handleNegotiationPhase() {
    console.log(`🔄 Entrando na fase de Negociação`);
    this.actionsLeft = 1; // Apenas uma ação de negociação por turno
  }

  // ==================== REGISTRO E LOG ====================

  _recordPhaseChange(oldPhase, newPhase) {
    const phaseEntry = {
      timestamp: Date.now(),
      turn: window.gameState?.turn || 0,
      oldPhase,
      newPhase,
      player: window.gameState?.players[window.gameState?.currentPlayerIndex]?.name || 'Desconhecido'
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

    addActivityLog({
      type: 'phase',
      playerName: 'SISTEMA',
      action: 'Fase alterada',
      details: phaseNames[phase] || phase,
      turn: window.gameState?.turn || 0
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
      displayName: this.getPhaseDisplayName(),
      actionsLeft: this.actionsLeft,
      historyLength: this.phaseHistory.length,
      lastTransition: this.phaseHistory[0] || null
    };
  }
}