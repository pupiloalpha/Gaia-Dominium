// game-coordinator.js - Coordenador de Fases e Turnos
import { gameState, getCurrentPlayer, addActivityLog } from '../state/game-state.js';
import { GAME_CONFIG, UI_CONSTANTS } from '../state/game-config.js';

export class GameCoordinator {
  constructor(gameLogic) {
    this.main = gameLogic;
    this.currentPhase = 'renda';
    this.phaseHistory = [];
  }

  // ==================== CONTROLE DE FASES ====================

  getCurrentPhase() {
    return gameState.currentPhase || 'renda';
  }

  setCurrentPhase(phase) {
    const oldPhase = gameState.currentPhase;
    gameState.currentPhase = phase;
    
    this.phaseHistory.push({
      turn: gameState.turn,
      from: oldPhase,
      to: phase,
      timestamp: Date.now()
    });
    
    // Limitar histórico
    if (this.phaseHistory.length > 100) {
      this.phaseHistory = this.phaseHistory.slice(-100);
    }
    
    this._logPhaseChange(oldPhase, phase);
    return phase;
  }

  _logPhaseChange(oldPhase, newPhase) {
    const phaseNames = UI_CONSTANTS.PHASE_NAMES || {
      'renda': '💰 Renda',
      'acoes': '⚡ Ações',
      'negociacao': '🤝 Negociação'
    };
    
    addActivityLog({
      type: 'phase',
      playerName: 'SISTEMA',
      action: 'Fase alterada',
      details: `${phaseNames[oldPhase] || oldPhase} → ${phaseNames[newPhase] || newPhase}`,
      turn: gameState.turn
    });
  }

  // ==================== AVANÇO DE FASES ====================

  advancePhase() {
    const phases = ['renda', 'acoes', 'negociacao'];
    const currentIndex = phases.indexOf(this.getCurrentPhase());
    
    if (currentIndex === -1) {
      console.warn(`Fase desconhecida: ${this.getCurrentPhase()}, resetando para 'renda'`);
      return this.setCurrentPhase('renda');
    }
    
    const nextIndex = (currentIndex + 1) % phases.length;
    const nextPhase = phases[nextIndex];
    
    return this.setCurrentPhase(nextPhase);
  }

  // ==================== VALIDAÇÃO DE FASES ====================

  isActionAllowedInPhase(actionType) {
    const phase = this.getCurrentPhase();
    
    const phaseActions = {
      'renda': [],
      'acoes': ['explorar', 'recolher', 'construir', 'disputar'],
      'negociacao': ['negociar']
    };
    
    return phaseActions[phase]?.includes(actionType) || false;
  }

  validatePhaseTransition(fromPhase, toPhase) {
    const validTransitions = {
      'renda': ['acoes'],
      'acoes': ['negociacao'],
      'negociacao': ['renda']
    };
    
    return validTransitions[fromPhase]?.includes(toPhase) || false;
  }

  // ==================== CONTROLE DE TURNOS ====================

  startPlayerTurn(player) {
    if (!player) return false;
    
    console.log(`▶️ Iniciando turno de ${player.name} (Turno ${gameState.turn})`);
    
    // Resetar ações para o turno
    gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
    gameState.selectedRegionId = null;
    
    // Iniciar na fase de renda
    this.setCurrentPhase('renda');
    
    addActivityLog({
      type: 'turn',
      playerName: 'SISTEMA',
      action: 'Turno iniciado',
      details: player.name,
      turn: gameState.turn
    });
    
    return true;
  }

  endPlayerTurn(player) {
    if (!player) return false;
    
    console.log(`⏹️ Finalizando turno de ${player.name}`);
    
    addActivityLog({
      type: 'turn',
      playerName: 'SISTEMA',
      action: 'Turno finalizado',
      details: player.name,
      turn: gameState.turn
    });
    
    return true;
  }

  // ==================== GERENCIAMENTO DE AÇÕES ====================

  getRemainingActions() {
    return gameState.actionsLeft || 0;
  }

  consumeAction() {
    if (gameState.actionsLeft <= 0) return false;
    
    gameState.actionsLeft--;
    this._updateUI();
    
    return gameState.actionsLeft;
  }

  resetActions() {
    const oldCount = gameState.actionsLeft;
    gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
    
    if (oldCount !== gameState.actionsLeft) {
      console.log(`🔄 Ações resetadas: ${oldCount} → ${gameState.actionsLeft}`);
    }
    
    return gameState.actionsLeft;
  }

  // ==================== SELEÇÃO DE REGIÕES ====================

  selectRegion(regionId) {
    const oldSelection = gameState.selectedRegionId;
    
    if (regionId === null || regionId === undefined) {
      gameState.selectedRegionId = null;
    } else {
      // Validar se a região existe
      const region = gameState.regions[regionId];
      if (!region) {
        console.warn(`Tentativa de selecionar região inexistente: ${regionId}`);
        return false;
      }
      gameState.selectedRegionId = regionId;
    }
    
    if (oldSelection !== gameState.selectedRegionId) {
      console.log(`📍 Região selecionada: ${gameState.selectedRegionId} (anterior: ${oldSelection})`);
    }
    
    return gameState.selectedRegionId;
  }

  clearRegionSelection() {
    return this.selectRegion(null);
  }

  // ==================== UTILITÁRIOS ====================

  getCurrentPlayer() {
    return getCurrentPlayer();
  }

  isCurrentPlayerAI() {
    const player = this.getCurrentPlayer();
    return player && (player.type === 'ai' || player.isAI);
  }

  _updateUI() {
    if (window.uiManager) {
      window.uiManager.updateUI();
      if (window.uiManager.gameManager) {
        setTimeout(() => window.uiManager.gameManager.updateFooter(), 10);
      }
    }
  }

  // ==================== DEBUG E ESTATÍSTICAS ====================

  getDebugInfo() {
    return {
      currentPhase: this.getCurrentPhase(),
      remainingActions: this.getRemainingActions(),
      currentPlayer: this.getCurrentPlayer()?.name || 'Nenhum',
      selectedRegion: gameState.selectedRegionId,
      turn: gameState.turn,
      phaseHistory: this.phaseHistory.length,
      isAI: this.isCurrentPlayerAI()
    };
  }

  getPhaseStatistics() {
    const phaseCounts = {};
    this.phaseHistory.forEach(entry => {
      phaseCounts[entry.to] = (phaseCounts[entry.to] || 0) + 1;
    });
    
    return {
      totalTransitions: this.phaseHistory.length,
      phaseCounts,
      averageTransitionsPerTurn: this.phaseHistory.length / Math.max(1, gameState.turn)
    };
  }
}