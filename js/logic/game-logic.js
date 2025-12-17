// game-logic.js - Fachada Principal
import { ActionLogic } from './logic-actions.js';
import { FactionLogic } from './logic-factions.js';
import { NegotiationLogic } from './logic-negotiation.js';
import { TurnLogic } from './logic-turn.js';
import { AICoordinator } from './logic-ai-coordinator.js';
import { gameState, addActivityLog, getCurrentPlayer, saveGame } from '../state/game-state.js';
import { GAME_CONFIG } from '../state/game-config.js'; // Importação essencial para configurar o mapa

class GameLogic {
  constructor() {
    // Inicializar submódulos
    this.actionsLogic = new ActionLogic(this);
    this.negotiationLogic = new NegotiationLogic(this);
    this.turnLogic = new TurnLogic(this);
    this.aiCoordinator = new AICoordinator(this);
    this.factionLogic = new FactionLogic(this);
    
    this.feedbackHistory = []; // Compatibilidade com logs antigos
  }

  // ==================== INICIALIZAÇÃO DO JOGO ====================

  initializeGame() {
    console.log("🎮 Inicializando lógica do jogo...");
    
    // 1. Configurar o Mapa (Isso estava faltando)
    this.setupRegions();
    
    // 2. Distribuir Regiões Iniciais
    this.distributeInitialRegions();
    
    // 3. Configurar Estado Inicial
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
    
    // 4. Iniciar Monitor de IA
    this.aiCoordinator.startHealthMonitor();
    
    // 5. Aplicar Renda Inicial
    const currentPlayer = getCurrentPlayer();
    
    // Pequeno delay para garantir que a UI carregou o DOM novo
    setTimeout(() => {
        this.turnLogic.applyIncome(currentPlayer);
        
        // Fallback de segurança
        setTimeout(() => {
            if (gameState.currentPhase === 'renda') {
                gameState.currentPhase = 'acoes';
                gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
                if (window.uiManager) {
                    window.uiManager.updateUI();
                    window.uiManager.updateFooter();
                }
            }
        }, 5000);
    }, 1500);
  }

  // ==================== GERAÇÃO DO MAPA (Restaurado) ====================

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
        explorationLevel: Math.floor(Math.random() * 2), // 0 ou 1 inicial
        resources,
        controller: null,
        structures: []
      });
    }
    console.log(`🗺️ ${total} regiões geradas.`);
  }

  generateResourcesForBiome(biome) {
    switch(biome) {
      case 'Floresta Tropical': return { madeira:6, pedra:1, ouro:0, agua:3 };
      case 'Floresta Temperada': return { madeira:5, pedra:2, ouro:0, agua:2 };
      case 'Savana': return { madeira:2, pedra:1, ouro:3, agua:1 };
      case 'Pântano': return { madeira:1, pedra:3, ouro:0, agua:4 };
      default: return { madeira:2, pedra:2, ouro:1, agua:1 };
    }
  }

  distributeInitialRegions() {
    const total = gameState.regions.length;
    // Embaralhar índices
    const indices = [...Array(total).keys()].sort(() => Math.random() - 0.5);
    let idx = 0;
    
    // Limpar regiões anteriores dos jogadores
    gameState.players.forEach(p => p.regions = []);
    
    // Distribuir 4 regiões para cada jogador
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

  // Ações Físicas
  handleExplore() { this.actionsLogic.handleExplore(); }
  handleCollect() { this.actionsLogic.handleCollect(); }
  handleBuild(type) { this.actionsLogic.handleBuild(type); }
  performAction(type) { return this.actionsLogic.consumeAction(); }
  
  // Negociação
  handleNegotiate() { this.negotiationLogic.handleNegotiate(); }
  handleSendNegotiation() { return this.negotiationLogic.handleSendNegotiation(); }
  handleNegResponse(accepted) { this.negotiationLogic.handleResponse(accepted); }
  executeNegotiation(neg) { return this.negotiationLogic._executeTrade(neg); }

  // Turno e Fases
  handleEndTurn() { this.turnLogic.handleEndTurn(); }
  advancePhase() { return this.turnLogic.advancePhase(); }
  applyIncomeForPlayer(player) { this.turnLogic.applyIncome(player); }
  
  // IA Bridge
  handleAITurn() { this.aiCoordinator.checkAndExecuteAITurn(); } // Compatibilidade com main.js
  checkAndExecuteAITurn() { this.aiCoordinator.checkAndExecuteAITurn(); }
  forceAIEndTurn() { this.aiCoordinator.forceAIEndTurn(); }

async executeAITurnIfNeeded() {
  const currentPlayer = getCurrentPlayer();
  
  // Verificar se o jogador atual é IA
  if (currentPlayer && (currentPlayer.type === 'ai' || currentPlayer.isAI)) {
    console.log(`🤖 É turno da IA: ${currentPlayer.name}`);
    
    // Pequeno delay antes de iniciar
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Executar turno da IA
    if (this.aiCoordinator) {
      await this.aiCoordinator.checkAndExecuteAITurn();
    } else {
      console.error('❌ AICoordinator não disponível');
    }
  }
}
  
  // Utils de Feedback (Centralizado)
  showFeedback(message, type = 'info') {
    this.aiCoordinator.captureFeedback(message, type);
    if (window.uiManager?.modals?.showFeedback) {
      window.uiManager.modals.showFeedback(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  async showConfirm(title, message) {
    if (window.uiManager?.modals?.showConfirm) {
      return await window.uiManager.modals.showConfirm(title, message);
    }
    return confirm(message);
  }
  
  canAffordAction(actionType) {
    const player = getCurrentPlayer();
    let cost = GAME_CONFIG.ACTION_DETAILS[actionType]?.cost || {};

    // Verificar descontos de facção
    if (actionType === 'explorar') {
      cost = this.factionLogic.modifyExploreCost(player, cost);
    } else if (actionType === 'construir') {
      // Nota: Para construção genérica na UI, usamos custo base. 
      // A verificação real ocorre dentro do handleBuild com o tipo específico.
    } else if (actionType === 'negociar') {
       const negCost = this.factionLogic.modifyNegotiationCost(player);
       return player.resources.ouro >= negCost;
    }

    return Object.entries(cost).every(([resource, amount]) => {
      return (player.resources[resource] || 0) >= amount;
    });
  }
  
  preventActionIfModalOpen() {
    const modal = document.getElementById('negotiationModal');
    const responseModal = document.getElementById('negResponseModal');
    return (modal && !modal.classList.contains('hidden')) || 
           (responseModal && !responseModal.classList.contains('hidden'));
  }
  
  // Auto-save wrapper
  autoSave() {
    if (gameState?.gameStarted) saveGame();
  }
}

export { GameLogic };
