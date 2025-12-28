// action-validator.js - Validador Centralizado de Ações
import { 
  gameState, 
  getCurrentPlayer, 
  getPlayerById 
} from '../state/game-state.js';
import { GAME_CONFIG, STRUCTURE_COSTS } from '../state/game-config.js';

class ActionValidator {
  constructor(gameLogic = null) {
    this.main = gameLogic;
  }

  // ==================== VALIDAÇÕES BÁSICAS ====================
  
  validatePhase(actionType, currentPhase) {
    const allowedInActions = ['explorar', 'recolher', 'construir', 'disputar'];
    
    if (actionType === 'negociar') {
      return currentPhase === 'negociacao';
    }
    
    return allowedInActions.includes(actionType) && currentPhase === 'acoes';
  }
  
  hasActionsLeft() {
    return gameState.actionsLeft > 0;
  }
  
  validatePlayerState(player, actionType) {
    if (!player) return { valid: false, reason: 'Jogador não encontrado' };
    
    // Verificação de eliminação
    if (player.eliminated) {
      const allowedActions = ['explorar', 'dominate'];
      return {
        valid: allowedActions.includes(actionType),
        reason: 'Jogador eliminado só pode dominar regiões neutras'
      };
    }
    
    return { valid: true, reason: '' };
  }

  // ==================== VALIDAÇÕES ESPECÍFICAS ====================
  
  validateExplore(regionId, player) {
    if (regionId === null) {
      return { valid: false, reason: 'Selecione uma região primeiro' };
    }
    
    const region = gameState.regions[regionId];
    if (!region) {
      return { valid: false, reason: 'Região não encontrada' };
    }
    
    // Jogador eliminado só pode dominar regiões neutras
    if (player.eliminated) {
      if (region.controller !== null) {
        return { valid: false, reason: 'Jogador eliminado só pode dominar regiões neutras' };
      }
      return { valid: true, reason: '' };
    }
    
    return { valid: true, reason: '' };
  }
  
  validateCollect(regionId, player) {
    const region = gameState.regions[regionId];
    
    if (!region) {
      return { valid: false, reason: 'Região não encontrada' };
    }
    
    if (region.controller !== player.id) {
      return { valid: false, reason: 'Você não controla essa região' };
    }
    
    if (region.explorationLevel === 0) {
      return { valid: false, reason: 'Necessário explorar antes' };
    }
    
    return { valid: true, reason: '' };
  }
  
  validateBuild(regionId, player, structureType) {
    const region = gameState.regions[regionId];
    
    if (!region) {
      return { valid: false, reason: 'Região não encontrada' };
    }
    
    if (region.controller !== player.id) {
      return { valid: false, reason: 'Região não controlada' };
    }
    
    if (region.structures.includes(structureType)) {
      return { valid: false, reason: 'Estrutura já existe' };
    }
    
    return { valid: true, reason: '' };
  }
  
  validateDispute(regionId, player) {
    const region = gameState.regions[regionId];
    
    if (!region) {
      return { valid: false, reason: 'Região não encontrada' };
    }
    
    if (region.controller === null) {
      return { valid: false, reason: 'Esta região não possui dominador' };
    }
    
    if (region.controller === player.id) {
      return { valid: false, reason: 'Você já domina esta região' };
    }
    
    return { valid: true, reason: '' };
  }
  
  validateNegotiation(player) {
    if (gameState.currentPhase !== 'negociacao') {
      return { valid: false, reason: 'Negociação permitida apenas na fase de Negociação' };
    }
    
    if (player.resources.ouro < 1) {
      return { valid: false, reason: 'Necessário 1 Ouro para negociar' };
    }
    
    return { valid: true, reason: '' };
  }

  // ==================== VALIDAÇÃO COMPLETA ====================
  
  validateAction(actionType, regionId = null, structureType = null) {
    const currentPlayer = getCurrentPlayer();
    const currentPhase = gameState.currentPhase;
    
    // 1. Validações básicas
    const phaseValidation = this.validatePhase(actionType, currentPhase);
    if (!phaseValidation) {
      return {
        valid: false,
        reason: `Ação "${actionType}" não permitida na fase atual (${currentPhase})`
      };
    }
    
    if (!this.hasActionsLeft()) {
      return { valid: false, reason: 'Sem ações restantes neste turno' };
    }
    
    // 2. Validação do estado do jogador
    const playerValidation = this.validatePlayerState(currentPlayer, actionType);
    if (!playerValidation.valid) {
      return playerValidation;
    }
    
    // 3. Validações específicas por ação
    switch (actionType) {
      case 'explorar':
        return this.validateExplore(regionId, currentPlayer);
      
      case 'recolher':
        return this.validateCollect(regionId, currentPlayer);
      
      case 'construir':
        return this.validateBuild(regionId, currentPlayer, structureType);
      
      case 'disputar':
        return this.validateDispute(regionId, currentPlayer);
      
      case 'negociar':
        return this.validateNegotiation(currentPlayer);
      
      default:
        return { valid: true, reason: '' };
    }
  }
  
  // ==================== VALIDAÇÕES DE RECURSOS ====================
  
  canAffordAction(player, actionType, regionId = null, structureType = null) {
    let cost = {};
    
    switch (actionType) {
      case 'explorar':
        cost = { ...GAME_CONFIG.ACTION_DETAILS.explorar.cost };
        // Aplicar descontos de facção se disponível
        if (this.main?.factionLogic) {
          cost = this.main.factionLogic.modifyExploreCost(player, cost);
        }
        break;
      
      case 'recolher':
        cost = GAME_CONFIG.ACTION_DETAILS.recolher.cost;
        break;
      
      case 'construir':
        if (structureType) {
          const baseCost = STRUCTURE_COSTS[structureType];
          if (baseCost) {
            cost = { ...baseCost };
            if (this.main?.factionLogic) {
              cost = this.main.factionLogic.modifyBuildCost(player, cost);
            }
          }
        }
        break;
      
      case 'negociar':
        const negCost = this.main?.factionLogic?.getNegotiationCost(player) || 1;
        return player.resources.ouro >= negCost;
        
      case 'disputar':
        // Custo dinâmico - validado pelo disputeLogic
        return true;
    }
    
    return Object.entries(cost).every(([resource, amount]) => {
      return (player.resources[resource] || 0) >= amount;
    });
  }
}

export { ActionValidator };