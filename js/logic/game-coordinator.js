// game-coordinator.js - Coordenador Simplificado de Turnos
import { gameState, getCurrentPlayer, addActivityLog } from '../state/game-state.js';
import { PhaseManager } from './phase-manager.js';

export class GameCoordinator {
  constructor(gameLogic) {
    this.main = gameLogic;
    this.phaseManager = new PhaseManager(gameLogic);
  }

  // ==================== CONTROLE DE FASES (DELEGADO) ====================

  getCurrentPhase() {
    return this.phaseManager.getCurrentPhase();
  }

  setCurrentPhase(phase) {
    return this.phaseManager.setCurrentPhase(phase);
  }

  advancePhase() {
    return this.phaseManager.advancePhase();
  }

  // ==================== VALIDAÇÃO DE FASES ====================

  isActionAllowedInPhase(actionType) {
    return this.phaseManager.validateActionForPhase(actionType);
  }

  // ==================== CONTROLE DE TURNOS ====================

  startPlayerTurn(player) {
    if (!player) return false;
    
    console.log(`▶️ Iniciando turno de ${player.name} (Turno ${gameState.turn})`);
    
    // Resetar fase e ações
    this.phaseManager.setCurrentPhase('renda');
    this.phaseManager.resetActions();
    
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
    return this.phaseManager.getRemainingActions();
  }

  consumeAction() {
    return this.phaseManager.consumeAction();
  }

  // ==================== SELEÇÃO DE REGIÕES ====================

  selectRegion(regionId) {
    if (regionId === null || regionId === undefined) {
      gameState.selectedRegionId = null;
      return null;
    }
    
    const region = gameState.regions[regionId];
    if (!region) {
      console.warn(`Tentativa de selecionar região inexistente: ${regionId}`);
      return false;
    }
    
    gameState.selectedRegionId = regionId;
    return regionId;
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

  // ==================== DEBUG ====================

  getDebugInfo() {
    return {
      currentPhase: this.getCurrentPhase(),
      remainingActions: this.getRemainingActions(),
      currentPlayer: this.getCurrentPlayer()?.name || 'Nenhum',
      selectedRegion: gameState.selectedRegionId,
      turn: gameState.turn,
      phaseManager: this.phaseManager.getDebugInfo()
    };
  }
}