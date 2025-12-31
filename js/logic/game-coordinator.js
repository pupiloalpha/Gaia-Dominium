// game-coordinator.js - Coordenador Simplificado de Turnos (Refatorado)
import { 
  gameState, 
  getCurrentPlayer, 
  addActivityLog,
  setSelectedRegion,
  clearRegionSelection as clearRegionSelectionState
} from '../state/game-state.js';
import { PhaseManager } from './phase-manager.js';

export class GameCoordinator {
  constructor(gameLogic) {
    this.main = gameLogic;
    this.phaseManager = new PhaseManager(gameLogic);
    this.setupPhaseEventListeners();
  }

  // ==================== CONFIGURAÇÃO DE EVENTOS ====================

  setupPhaseEventListeners() {
    window.addEventListener('phaseChanged', (event) => {
      this.handlePhaseChange(event.detail);
    });
  }

  handlePhaseChange({ oldPhase, newPhase, player }) {
    console.log(`🔄 GameCoordinator: Fase alterada ${oldPhase} → ${newPhase} para ${player?.name}`);
    
    // Atualizar UI quando a fase mudar
    setTimeout(() => {
      if (window.uiManager) {
        window.uiManager.updateUI();
        if (window.uiManager.gameManager && window.uiManager.gameManager.footerManager) {
          window.uiManager.gameManager.footerManager.updateFooter();
        }
      }
    }, 100);
  }

  // ==================== CONTROLE DE FASES (DELEGADO) ====================

  getCurrentPhase() {
    return this.phaseManager.getCurrentPhase();
  }

  setCurrentPhase(phase) {
    const result = this.phaseManager.setCurrentPhase(phase);
    
    // Forçar atualização do gameState
    if (gameState) {
      gameState.currentPhase = result;
    }
    
    return result;
  }

  advancePhase() {
    const result = this.phaseManager.advancePhase();
    
    // Forçar atualização do gameState
    if (gameState) {
      gameState.currentPhase = result;
    }
    
    return result;
  }

  // ==================== VALIDAÇÃO DE FASES ====================

  isActionAllowedInPhase(actionType) {
    return this.phaseManager.validateActionForPhase(actionType);
  }

  // ==================== CONTROLE DE TURNOS ====================

  startPlayerTurn(player) {
    if (!player) return false;
    
    console.log(`▶️ GameCoordinator: Iniciando turno de ${player.name} (Turno ${gameState.turn})`);
    
    // Resetar fase para renda
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
    
    console.log(`⏹️ GameCoordinator: Finalizando turno de ${player.name}`);
    
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
      clearRegionSelectionState();
      return null;
    }
    
    const region = gameState.regions[regionId];
    if (!region) {
      console.warn(`Tentativa de selecionar região inexistente: ${regionId}`);
      return false;
    }
    
    setSelectedRegion(regionId);
    return regionId;
  }

  clearRegionSelection() {
    clearRegionSelectionState();
    return true;
  }

  // ==================== UTILITÁRIOS ====================

  getCurrentPlayer() {
    return getCurrentPlayer();
  }

  isCurrentPlayerAI() {
    const player = this.getCurrentPlayer();
    return player && (player.type === 'ai' || player.isAI);
  }

  // ==================== MÉTODOS DE AJUDA ====================

  forcePhaseUpdate() {
    // Forçar sincronização entre PhaseManager e gameState
    const currentPhase = this.getCurrentPhase();
    if (gameState && gameState.currentPhase !== currentPhase) {
      console.log(`🔄 Forçando sincronização de fase: ${gameState.currentPhase} → ${currentPhase}`);
      gameState.currentPhase = currentPhase;
    }
    
    // Forçar atualização da UI
    if (window.uiManager) {
      window.uiManager.updateUI();
    }
  }

  // ==================== DEBUG ====================

  getDebugInfo() {
    return {
      currentPhase: this.getCurrentPhase(),
      gameStatePhase: gameState.currentPhase,
      remainingActions: this.getRemainingActions(),
      gameStateActionsLeft: gameState.actionsLeft,
      currentPlayer: this.getCurrentPlayer()?.name || 'Nenhum',
      selectedRegion: gameState.selectedRegionId,
      turn: gameState.turn,
      phaseManager: this.phaseManager.getDebugInfo(),
      isSynchronized: this.getCurrentPhase() === gameState.currentPhase
    };
  }
}