// phase-manager.js - Gerenciador de Fases do Jogo
import { addActivityLog } from '../state/game-state.js';
import { UI_CONSTANTS, TURN_PHASES } from '../state/game-config.js';

export class PhaseManager {
  constructor(gameLogic) {
    this.main = gameLogic;
    this.currentPhase = TURN_PHASES.RENDA;
    this.phaseHistory = [];
    this.phaseTimers = new Map();
  }

  // ==================== CONTROLE DE FASES ====================

  getCurrentPhase() {
    return this.currentPhase;
  }

  setCurrentPhase(phase) {
    const oldPhase = this.currentPhase;
    
    if (oldPhase === phase) {
      return phase; // Sem mudança
    }

    // Validar transição
    if (!this._validatePhaseTransition(oldPhase, phase)) {
      console.warn(`Transição de fase inválida: ${oldPhase} -> ${phase}`);
      return this.currentPhase;
    }

    // Registrar mudança
    this.currentPhase = phase;
    this._recordPhaseChange(oldPhase, phase);
    
    // Executar lógica específica da fase
    this._executePhaseLogic(phase);

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

  _validatePhaseTransition(fromPhase, toPhase) {
    // Definir transições válidas
    const validTransitions = {
      [TURN_PHASES.RENDA]: [TURN_PHASES.ACOES],
      [TURN_PHASES.ACOES]: [TURN_PHASES.NEGOCIACAO],
      [TURN_PHASES.NEGOCIACAO]: [TURN_PHASES.RENDA]
    };

    return validTransitions[fromPhase]?.includes(toPhase) || false;
  }

  validateActionForPhase(actionType) {
    const phase = this.currentPhase;
    
    const phaseActions = {
      [TURN_PHASES.RENDA]: [],
      [TURN_PHASES.ACOES]: ['explorar', 'recolher', 'construir', 'disputar'],
      [TURN_PHASES.NEGOCIACAO]: ['negociar']
    };

    return phaseActions[phase]?.includes(actionType) || false;
  }

  getPhaseActions() {
    const phaseActions = {
      [TURN_PHASES.RENDA]: [],
      [TURN_PHASES.ACOES]: ['explorar', 'recolher', 'construir', 'disputar'],
      [TURN_PHASES.NEGOCIACAO]: ['negociar']
    };

    return phaseActions[this.currentPhase] || [];
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

    // Log da mudança de fase
    this._logPhaseChange(phase);
  }

  _handleIncomePhase() {
    console.log(`🔄 Entrando na fase de Renda`);
    
    // Notificar UI
    if (window.uiManager?.gameManager?.updateFooter) {
      setTimeout(() => window.uiManager.gameManager.updateFooter(), 100);
    }
  }

  _handleActionsPhase() {
    console.log(`🔄 Entrando na fase de Ações`);
    
    // Notificar UI
    if (window.uiManager) {
      window.uiManager.updateUI();
      if (window.uiManager.gameManager?.updateFooter) {
        setTimeout(() => window.uiManager.gameManager.updateFooter(), 100);
      }
    }
  }

  _handleNegotiationPhase() {
    console.log(`🔄 Entrando na fase de Negociação`);
    
    // Verificar propostas pendentes
    setTimeout(() => {
      if (window.uiManager?.negotiation?.checkPendingNegotiationsForCurrentPlayer) {
        window.uiManager.negotiation.checkPendingNegotiationsForCurrentPlayer();
      }
    }, 500);

    // Notificar UI
    if (window.uiManager) {
      window.uiManager.updateUI();
      if (window.uiManager.gameManager?.updateFooter) {
        setTimeout(() => window.uiManager.gameManager.updateFooter(), 100);
      }
    }
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
    
    // Limitar histórico
    if (this.phaseHistory.length > 50) {
      this.phaseHistory = this.phaseHistory.slice(0, 50);
    }

    // Registrar timer da fase
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

  // ==================== GETTERS E UTILITÁRIOS ====================

  getPhaseDisplayName(phase = null) {
    const targetPhase = phase || this.currentPhase;
    const phaseNames = UI_CONSTANTS.PHASE_NAMES || {
      [TURN_PHASES.RENDA]: '💰 Renda',
      [TURN_PHASES.ACOES]: '⚡ Ações',
      [TURN_PHASES.NEGOCIACAO]: '🤝 Negociação'
    };

    return phaseNames[targetPhase] || targetPhase;
  }

  getPhaseDuration(phase) {
    const startTime = this.phaseTimers.get(phase);
    if (!startTime) return null;

    return Date.now() - startTime;
  }

  getPhaseStatistics() {
    const phaseCounts = {};
    const phaseDurations = {};

    this.phaseHistory.forEach(entry => {
      phaseCounts[entry.newPhase] = (phaseCounts[entry.newPhase] || 0) + 1;
      
      // Calcular duração se tivermos tempo de início
      const startTime = this.phaseTimers.get(entry.newPhase);
      if (startTime && entry.timestamp) {
        const duration = entry.timestamp - startTime;
        phaseDurations[entry.newPhase] = (phaseDurations[entry.newPhase] || 0) + duration;
      }
    });

    // Calcular médias
    const averages = {};
    Object.keys(phaseDurations).forEach(phase => {
      averages[phase] = phaseDurations[phase] / phaseCounts[phase];
    });

    return {
      totalTransitions: this.phaseHistory.length,
      phaseCounts,
      averageDurations: averages,
      currentPhase: {
        name: this.currentPhase,
        displayName: this.getPhaseDisplayName(),
        duration: this.getPhaseDuration(this.currentPhase)
      }
    };
  }

  // ==================== DEBUG ====================

  getDebugInfo() {
    return {
      currentPhase: this.currentPhase,
      displayName: this.getPhaseDisplayName(),
      allowedActions: this.getPhaseActions(),
      historyLength: this.phaseHistory.length,
      lastTransition: this.phaseHistory[0] || null,
      phaseStatistics: this.getPhaseStatistics()
    };
  }

  getPhaseTimeline() {
    return this.phaseHistory.map(entry => ({
      ...entry,
      displayName: this.getPhaseDisplayName(entry.newPhase)
    }));
  }
}