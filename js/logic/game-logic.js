// game-logic.js - Fachada Principal (REFATORADO)
import { ActionLogic } from './logic-actions.js';
import { FactionLogic } from './logic-factions.js';
import { NegotiationLogic } from './logic-negotiation.js';
import { DisputeLogic } from './logic-dispute.js';
import { TurnLogic } from './logic-turn.js';
import { AICoordinator } from './logic-ai-coordinator.js';
import { gameState, addActivityLog, getCurrentPlayer, saveGame, getPlayerById } from '../state/game-state.js';
import { GAME_CONFIG, UI_CONSTANTS, STRUCTURE_COSTS } from '../state/game-config.js';

// Desestruturação das constantes de UI
const { ACTION_COSTS } = UI_CONSTANTS;

class GameLogic {
  constructor() {
    // Inicializar submódulos
    this.actionsLogic = new ActionLogic(this);
    this.negotiationLogic = new NegotiationLogic(this);
    this.turnLogic = new TurnLogic(this);
    this.aiCoordinator = new AICoordinator(this);
    this.factionLogic = new FactionLogic(this);
    this.disputeLogic = new DisputeLogic(this);
    
    this.feedbackHistory = [];
    this.disputeUI = null; // Será injetado pela UI
    
    // Expor métodos importantes globalmente
    this._exposeToGlobal();
  }

  // Expor métodos necessários para a UI
  _exposeToGlobal() {
    if (typeof window !== 'undefined') {
      window.gameLogic = this;
      window.handleDispute = this.handleDispute.bind(this);
    }
  }

  // ==================== MÉTODOS DE VALIDAÇÃO REFATORADOS ====================

  // Validação centralizada de ações - REFATORADO
  getActionValidation(actionType, playerId = null, context = {}) {
    const player = playerId ? getPlayerById(playerId) : getCurrentPlayer();
    if (!player) return { valid: false, reason: 'Jogador não encontrado' };
    
    const isEliminated = player.eliminated;
    const currentPhase = gameState.currentPhase;
    const hasActions = gameState.actionsLeft > 0;
    const regionId = context.regionId || gameState.selectedRegionId;
    const region = regionId !== null ? gameState.regions[regionId] : null;
    
    // Mapeamento de tipos de ação - CORRIGIDO: 'collect' → 'coletar'
    const actionMap = {
      'explore': 'explorar',
      'collect': 'coletar',  // CORREÇÃO: 'coletar' (era 'recolher')
      'build': 'construir',
      'negotiate': 'negociar',
      'dispute': 'disputar',
      'dominate': 'dominar'
    };
    
    // Normalizar ação
    const normalizedAction = actionMap[actionType] || actionType;
    
    // Validações baseadas no tipo de ação
    switch(normalizedAction) {
      case 'explorar':
        return this._validateExploreAction(player, region, isEliminated, hasActions, currentPhase);
        
      case 'coletar':  // CORREÇÃO: Usar 'coletar' consistentemente
        return this._validateCollectAction(player, region, isEliminated, hasActions, currentPhase);
        
      case 'construir':
        return this._validateBuildAction(player, region, isEliminated, hasActions, currentPhase, context);
        
      case 'negociar':
        return this._validateNegotiateAction(player, isEliminated, hasActions, currentPhase);
        
      case 'disputar':
        return this._validateDisputeAction(player, region, isEliminated, hasActions, currentPhase);
        
      case 'dominar':
        return this._validateDominateAction(player, region, isEliminated, hasActions, currentPhase);
        
      default:
        console.error(`❌ Ação não reconhecida: ${actionType} (normalizada: ${normalizedAction})`);
        return { valid: false, reason: `Ação '${actionType}' não reconhecida pelo sistema` };
    }
  }

  // ==================== MÉTODOS DE VALIDAÇÃO PRIVADOS ====================

  _validateExploreAction(player, region, isEliminated, hasActions, currentPhase) {
    if (!hasActions) return { valid: false, reason: 'Sem ações restantes' };
    if (currentPhase !== 'acoes') return { valid: false, reason: 'Ação permitida apenas na fase de Ações' };
    if (!region) return { valid: false, reason: 'Selecione uma região primeiro' };
    
    if (isEliminated) {
      // Jogador eliminado só pode dominar regiões neutras
      return this._validateEliminatedPlayerExplore(player, region);
    }
    
    // Jogador ativo
    if (region.controller === null) {
      return this._validateDominateAction(player, region, false, hasActions, currentPhase);
    } else if (region.controller === player.id) {
      return this._validateOwnRegionExplore(player, region);
    } else {
      return this._validateEnemyRegionDispute(player, region);
    }
  }

  _validateEliminatedPlayerExplore(player, region) {
    if (region.controller !== null) {
      return { valid: false, reason: 'Jogador eliminado só pode dominar regiões neutras' };
    }
    
    // Verificar recursos para ressurreição
    const pvCost = window.gameState?.ELIMINATION_CONFIG?.RESURRECTION_COST_PV || 2;
    if (player.victoryPoints < pvCost) {
      return { valid: false, reason: `Necessário ${pvCost} PV para ressuscitar` };
    }
    
    const canPay = Object.entries(region.resources).every(([k, v]) => (player.resources[k] || 0) >= v);
    if (!canPay) return { valid: false, reason: 'Recursos insuficientes para ressuscitar' };
    
    return { valid: true, type: 'resurrect', action: 'explorar' };
  }

  _validateOwnRegionExplore(player, region) {
    const cost = GAME_CONFIG.ACTION_DETAILS.explorar.cost;
    const modifiedCost = this.factionLogic?.modifyExploreCost(player, cost) || cost;
    const canPay = Object.entries(modifiedCost).every(([k, v]) => (player.resources[k] || 0) >= v);
    
    if (!canPay) return { valid: false, reason: 'Recursos insuficientes para explorar' };
    return { valid: true, type: 'explore', action: 'explorar' };
  }

  _validateEnemyRegionDispute(player, region) {
    if (!this.disputeLogic) {
      return { valid: false, reason: 'Sistema de disputa não disponível' };
    }
    
    const disputeData = this.disputeLogic.calculateDisputeCosts(player, region);
    const finalCost = disputeData.finalCost;
    const canPay = Object.entries(finalCost).every(([resource, amount]) => {
      if (resource === 'pv') return player.victoryPoints >= amount;
      return (player.resources[resource] || 0) >= amount;
    });
    
    if (!canPay) return { valid: false, reason: 'Recursos insuficientes para disputar' };
    return { valid: true, type: 'dispute', action: 'explorar', data: disputeData };
  }

  _validateCollectAction(player, region, isEliminated, hasActions, currentPhase) {
    if (!hasActions) return { valid: false, reason: 'Sem ações restantes' };
    if (currentPhase !== 'acoes') return { valid: false, reason: 'Ação permitida apenas na fase de Ações' };
    if (!region) return { valid: false, reason: 'Selecione uma região primeiro' };
    if (isEliminated) return { valid: false, reason: 'Jogador eliminado não pode coletar' };
    if (region.controller !== player.id) return { valid: false, reason: 'Você não controla esta região' };
    if (region.explorationLevel === 0) return { valid: false, reason: 'Região precisa ser explorada primeiro' };
    
    // CORREÇÃO CRÍTICA: Usar 'coletar' em vez de 'recolher'
    const collectCost = GAME_CONFIG.ACTION_DETAILS.coletar.cost;
    const canPayCollect = Object.entries(collectCost).every(([k, v]) => (player.resources[k] || 0) >= v);
    if (!canPayCollect) return { valid: false, reason: 'Recursos insuficientes para coletar' };
    
    return { valid: true, type: 'collect', action: 'coletar' };
  }

  _validateBuildAction(player, region, isEliminated, hasActions, currentPhase, context) {
    if (!hasActions) return { valid: false, reason: 'Sem ações restantes' };
    if (currentPhase !== 'acoes') return { valid: false, reason: 'Ação permitida apenas na fase de Ações' };
    if (!region) return { valid: false, reason: 'Selecione uma região primeiro' };
    if (isEliminated) return { valid: false, reason: 'Jogador eliminado não pode construir' };
    if (region.controller !== player.id) return { valid: false, reason: 'Você não controla esta região' };
    
    // Se tiver estrutura específica no contexto, validar custo
    if (context.structureType) {
      const structureCost = STRUCTURE_COSTS[context.structureType];
      if (!structureCost) return { valid: false, reason: `Estrutura '${context.structureType}' não reconhecida` };
      
      const canPayBuild = Object.entries(structureCost).every(([k, v]) => (player.resources[k] || 0) >= v);
      if (!canPayBuild) return { valid: false, reason: 'Recursos insuficientes para construir' };
    }
    
    return { valid: true, type: 'build', action: 'construir' };
  }

  _validateNegotiateAction(player, isEliminated, hasActions, currentPhase) {
    if (!hasActions) return { valid: false, reason: 'Sem ações restantes' };
    if (currentPhase !== 'negociacao') return { valid: false, reason: 'Negociação permitida apenas na fase de Negociação' };
    if (isEliminated) return { valid: false, reason: 'Jogador eliminado não pode negociar' };
    
    const negCost = this.factionLogic?.getNegotiationCost(player) || 1;
    if (player.resources.ouro < negCost) return { valid: false, reason: `Necessário ${negCost} Ouro para negociar` };
    
    return { valid: true, type: 'negotiate', action: 'negociar' };
  }

  _validateDisputeAction(player, region, isEliminated, hasActions, currentPhase) {
    if (!hasActions) return { valid: false, reason: 'Sem ações restantes' };
    if (currentPhase !== 'acoes') return { valid: false, reason: 'Disputa permitida apenas na fase de Ações' };
    if (!region) return { valid: false, reason: 'Selecione uma região primeiro' };
    if (isEliminated) return { valid: false, reason: 'Jogador eliminado não pode disputar' };
    if (region.controller === null) return { valid: false, reason: 'Região neutra (use Dominar)' };
    if (region.controller === player.id) return { valid: false, reason: 'Você já controla esta região' };
    
    if (!this.disputeLogic) {
      return { valid: false, reason: 'Sistema de disputa não disponível' };
    }
    
    const disputeData = this.disputeLogic.calculateDisputeCosts(player, region);
    const finalCost = disputeData.finalCost;
    const canPay = Object.entries(finalCost).every(([resource, amount]) => {
      if (resource === 'pv') return player.victoryPoints >= amount;
      return (player.resources[resource] || 0) >= amount;
    });
    
    if (!canPay) return { valid: false, reason: 'Recursos insuficientes para disputar' };
    return { valid: true, type: 'dispute', action: 'disputar', data: disputeData };
  }

  _validateDominateAction(player, region, isEliminated, hasActions, currentPhase) {
    if (!hasActions) return { valid: false, reason: 'Sem ações restantes' };
    if (currentPhase !== 'acoes') return { valid: false, reason: 'Ação permitida apenas na fase de Ações' };
    if (!region) return { valid: false, reason: 'Selecione uma região primeiro' };
    if (region.controller !== null) return { valid: false, reason: 'Região já está controlada' };
    
    if (isEliminated) {
      // Jogador eliminado tentando ressuscitar
      const pvCost = window.gameState?.ELIMINATION_CONFIG?.RESURRECTION_COST_PV || 2;
      if (player.victoryPoints < pvCost) {
        return { valid: false, reason: `Necessário ${pvCost} PV para ressuscitar` };
      }
    } else {
      // Jogador ativo tentando dominar
      const pvCost = 2;
      if (player.victoryPoints < pvCost) {
        return { valid: false, reason: `Necessário ${pvCost} PV para dominar` };
      }
    }
    
    const canPay = Object.entries(region.resources).every(([k, v]) => (player.resources[k] || 0) >= v);
    if (!canPay) return { valid: false, reason: 'Recursos insuficientes para dominar' };
    
    return { valid: true, type: 'dominate', action: 'dominar' };
  }

  // ==================== INICIALIZAÇÃO DO JOGO ====================

  initializeGame() {
    console.log("🎮 Inicializando lógica do jogo...");
    
    // 1. Configurar o Mapa
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
            if (window.uiManager.gameManager) {
              window.uiManager.gameManager.updateFooter();
            }
          }
        }
      }, 5000);
    }, 1500);
  }

  // ==================== GERAÇÃO DO MAPA ====================

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

  // MÉTODO DE DISPUTA REFATORADO
  async handleDispute(region, attacker, skipValidation = false) {
    console.log('🎮 GameLogic.handleDispute chamado', { 
      regionId: region?.id, 
      attackerId: attacker?.id,
      skipValidation 
    });
    
    if (!this.disputeLogic) {
      const errorMsg = 'Sistema de disputa não inicializado.';
      console.error('❌', errorMsg);
      this.showFeedback(errorMsg, 'error');
      return null;
    }
    
    // Verificar se já temos a região
    if (!region && gameState.selectedRegionId !== null) {
      region = gameState.regions[gameState.selectedRegionId];
      console.log('🎮 Região obtida do selectedRegionId:', region?.id);
    }
    
    // Obter atacante se não fornecido
    if (!attacker) {
      attacker = getCurrentPlayer();
      console.log('🎮 Atacante obtido do currentPlayer:', attacker?.id);
    }
    
    if (!region || !attacker) {
      const errorMsg = 'Dados insuficientes para disputa.';
      console.error('❌', errorMsg, { region, attacker });
      this.showFeedback(errorMsg, 'error');
      return null;
    }
    
    try {
      console.log('🎮 Chamando DisputeLogic.handleDispute...');
      const result = await this.disputeLogic.handleDispute(region, attacker, skipValidation);
      console.log('🎮 Disputa executada com sucesso:', result);
      
      // ATUALIZAR FOOTER APÓS DISPUTA
      setTimeout(() => {
        if (window.uiManager && window.uiManager.gameManager && window.uiManager.gameManager.footerManager) {
          window.uiManager.gameManager.footerManager.updateFooter();
        }
      }, 100);
      
      return result;
    } catch (error) {
      console.error('❌ Erro em GameLogic.handleDispute:', error);
      this.showFeedback(`Erro na disputa: ${error.message}`, 'error');
      return null;
    }
  }
  
  handleDominate() {
    return this.actionsLogic.handleDominate();
  }
  
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
  handleAITurn() { this.aiCoordinator.checkAndExecuteAITurn(); }
  checkAndExecuteAITurn() { this.aiCoordinator.checkAndExecuteAITurn(); }
  forceAIEndTurn() { this.aiCoordinator.forceAIEndTurn(); }
  
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

    // Usar validação centralizada
    const validation = this.getActionValidation(actionType);
    return validation.valid;
  }

  preventActionIfModalOpen() {
    const modal = document.getElementById('negotiationModal');
    const responseModal = document.getElementById('negResponseModal');
    const disputeModal = document.getElementById('disputeModal');
    return (modal && !modal.classList.contains('hidden')) || 
           (responseModal && !responseModal.classList.contains('hidden')) ||
           (disputeModal && !disputeModal.classList.contains('hidden'));
  }
  
  // Auto-save wrapper
  autoSave() {
    if (gameState?.gameStarted) saveGame();
  }

  // Injetar referência da UI de disputa - MÉTODO CRÍTICO
  setDisputeUI(disputeUI) {
    console.log('🎮 DisputeUI injetado no GameLogic');
    this.disputeUI = disputeUI;
    
    // Expor o disputeUI globalmente para acesso direto
    if (typeof window !== 'undefined') {
      window.disputeUI = disputeUI;
    }
  }
  
  // Método auxiliar para UI acessar o disputeLogic
  getDisputeLogic() {
    return this.disputeLogic;
  }
}

export { GameLogic };
