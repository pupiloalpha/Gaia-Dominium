// game-logic.js - Fachada Simplificada
import { ActionLogic } from './logic-actions.js';
import { FactionLogic } from './logic-factions.js';
import { NegotiationLogic } from './logic-negotiation.js';
import { DisputeLogic } from './logic-dispute.js';
import { TurnLogic } from './logic-turn.js';
import { AICoordinator } from './logic-ai-coordinator.js';
import { ActionValidator } from './action-validator.js';
import { gameState, addActivityLog, getCurrentPlayer, saveGame } from '../state/game-state.js';
import { GAME_CONFIG } from '../state/game-config.js';
import { FeedbackService } from '../utils/feedback-service.js';

class GameLogic {
  constructor() {
    this.actionsLogic = new ActionLogic(this);
    this.negotiationLogic = new NegotiationLogic(this);
    this.turnLogic = new TurnLogic(this);
    this.aiCoordinator = new AICoordinator(this);
    this.factionLogic = new FactionLogic(this);
    this.disputeLogic = new DisputeLogic(this);
    this.validator = new ActionValidator(this);
  }

  // ==================== INICIALIZAÇÃO DO JOGO ====================

  initializeGame() {
    console.log("🎮 Inicializando lógica do jogo...");
    
    this.setupRegions();
    this.distributeInitialRegions();
    
    gameState.gameStarted = true;
    gameState.turn = 1;
    gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
    gameState.currentPhase = 'renda';
    
    addActivityLog({
      type: 'system',
      playerName: 'SISTEMA',
      action: 'Jogo iniciado',
      details: '',
      turn: gameState.turn
    });
    
    this.aiCoordinator.startHealthMonitor();
    const currentPlayer = getCurrentPlayer();
    
    setTimeout(() => {
      this.turnLogic.applyIncome(currentPlayer);
      
      setTimeout(() => {
        if (gameState.currentPhase === 'renda') {
          gameState.currentPhase = 'acoes';
          gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
          if (window.uiManager) {
            window.uiManager.updateUI();
          }
        }
      }, 5000);
    }, 1500);
  }

  setupRegions() {
    gameState.regions = [];
    const total = GAME_CONFIG.GRID_SIZE * GAME_CONFIG.GRID_SIZE;
    
    for (let i = 0; i < total; i++) {
      const biome = GAME_CONFIG.BIOMES[Math.floor(Math.random() * GAME_CONFIG.BIOMES.length)];
      const resources = this.generateResourcesForBiome(biome);
      
      gameState.regions.push({
        id: i,
        name: GAME_CONFIG.REGION_NAMES[i] || `Região ${i}`,
        biome,
        explorationLevel: Math.floor(Math.random() * 2),
        resources,
        controller: null,
        structures: []
      });
    }
    console.log(`🗺️ ${total} regiões geradas.`);
  }

  generateResourcesForBiome(biome) {
    const resourceMap = {
      'Floresta Tropical': { madeira:6, pedra:1, ouro:0, agua:3 },
      'Floresta Temperada': { madeira:5, pedra:2, ouro:0, agua:2 },
      'Savana': { madeira:2, pedra:1, ouro:3, agua:1 },
      'Pântano': { madeira:1, pedra:3, ouro:0, agua:4 }
    };
    return resourceMap[biome] || { madeira:2, pedra:2, ouro:1, agua:1 };
  }

  distributeInitialRegions() {
    const total = gameState.regions.length;
    const indices = [...Array(total).keys()].sort(() => Math.random() - 0.5);
    let idx = 0;
    
    gameState.players.forEach(p => p.regions = []);
    
    for (let p = 0; p < gameState.players.length; p++) {
      for (let r = 0; r < 4 && idx < indices.length; r++) {
        const regionId = indices[idx++];
        gameState.regions[regionId].controller = p;
        gameState.players[p].regions.push(regionId);
      }
    }
    console.log("🗺️ Regiões iniciais distribuídas.");
  }

  // ==================== DELEGAÇÃO (FACHADA) ====================

  handleExplore() { this.actionsLogic.handleExplore(); }
  handleCollect() { this.actionsLogic.handleCollect(); }
  handleBuild(type) { this.actionsLogic.handleBuild(type); }

  async handleDispute(region, attacker) {
    if (!this.disputeLogic) {
      FeedbackService.showFeedback('Sistema de disputa não inicializado.', 'error');
      return null;
    }
    
    if (!region && gameState.selectedRegionId !== null) {
      region = gameState.regions[gameState.selectedRegionId];
    }
    
    if (!attacker) {
      attacker = getCurrentPlayer();
    }
    
    if (!region || !attacker) {
      FeedbackService.showFeedback('Dados insuficientes para disputa.', 'error');
      return null;
    }
    
    return await this.disputeLogic.handleDispute(region, attacker);
  }
  
  performAction(type) { return this.actionsLogic.consumeAction(); }
  
  handleNegotiate() { this.negotiationLogic.handleNegotiate(); }
  handleSendNegotiation() { return this.negotiationLogic.handleSendNegotiation(); }
  handleNegResponse(accepted) { this.negotiationLogic.handleResponse(accepted); }
  executeNegotiation(neg) { return this.negotiationLogic._executeTrade(neg); }

  handleEndTurn() { this.turnLogic.handleEndTurn(); }
  advancePhase() { return this.turnLogic.advancePhase(); }
  applyIncomeForPlayer(player) { this.turnLogic.applyIncome(player); }
  
  handleAITurn() { this.aiCoordinator.checkAndExecuteAITurn(); }
  checkAndExecuteAITurn() { this.aiCoordinator.checkAndExecuteAITurn(); }
  forceAIEndTurn() { this.aiCoordinator.forceAIEndTurn(); }
  
  // ==================== UTILITÁRIOS ====================

  showFeedback(message, type = 'info') {
    this.aiCoordinator.captureFeedback(message, type);
    FeedbackService.showFeedback(message, type);
  }

  async showConfirm(title, message) {
    return await FeedbackService.showConfirm(title, message);
  }
  
  canAffordAction(actionType) {
    const player = getCurrentPlayer();
    
    if (player?.eliminated) {
      return actionType === 'explorar' && gameState.selectedRegionId !== null;
    }
    
    return this.validator.canAffordAction(player, actionType, gameState.selectedRegionId);
  }

  preventActionIfModalOpen() {
    const modal = document.getElementById('negotiationModal');
    const responseModal = document.getElementById('negResponseModal');
    return (modal && !modal.classList.contains('hidden')) || 
           (responseModal && !responseModal.classList.contains('hidden'));
  }
  
  autoSave() {
    if (gameState?.gameStarted) saveGame();
  }
}

export { GameLogic };