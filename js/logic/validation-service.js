// validation-service.js - Serviço de Validações do Jogo
import { gameState, getCurrentPlayer, getPlayerById } from '../state/game-state.js';
import { GAME_CONFIG, UI_CONSTANTS } from '../state/game-config.js';

export class ValidationService {
  constructor(gameLogic) {
    this.main = gameLogic;
  }

  // ==================== VALIDAÇÃO DE AÇÕES ====================

  validateAction(actionType, options = {}) {
    const player = options.player || getCurrentPlayer();
    const regionId = options.regionId || gameState.selectedRegionId;
    
    // Validações básicas
    const basicChecks = this._validateBasicChecks(actionType, player);
    if (!basicChecks.valid) return basicChecks;
    
    // Validações específicas por ação
    switch(actionType) {
      case 'explorar':
        return this._validateExploreAction(player, regionId);
      case 'recolher':
        return this._validateCollectAction(player, regionId);
      case 'construir':
        return this._validateBuildAction(player, regionId, options.structureType);
      case 'negociar':
        return this._validateNegotiateAction(player);
      case 'disputar':
        return this._validateDisputeAction(player, regionId);
      default:
        return { valid: false, reason: `Tipo de ação desconhecida: ${actionType}` };
    }
  }

  _validateBasicChecks(actionType, player) {
    // Verificar se jogador existe
    if (!player) {
      return { valid: false, reason: 'Jogador não encontrado' };
    }
    
    // Verificar se jogador está eliminado
    if (player.eliminated && !this._isValidForEliminated(actionType)) {
      return { valid: false, reason: 'Jogador eliminado não pode realizar esta ação' };
    }
    
    // Verificar se tem ações restantes
    if (gameState.actionsLeft <= 0) {
      return { valid: false, reason: 'Sem ações restantes neste turno' };
    }
    
    // Verificar fase atual
    if (!this.main.coordinator?.isActionAllowedInPhase(actionType)) {
      const currentPhase = gameState.currentPhase;
      return { valid: false, reason: `Ação não permitida na fase "${currentPhase}"` };
    }
    
    return { valid: true, reason: '' };
  }

  _isValidForEliminated(actionType) {
    return actionType === 'explorar' && gameState.selectedRegionId !== null;
  }

  // ==================== VALIDAÇÕES ESPECÍFICAS ====================

  _validateExploreAction(player, regionId) {
    if (regionId === null) {
      return { valid: false, reason: 'Selecione uma região primeiro' };
    }
    
    const region = gameState.regions[regionId];
    if (!region) {
      return { valid: false, reason: 'Região não encontrada' };
    }
    
    // Verificar recursos para explorar região própria
    if (region.controller === player.id) {
      const cost = GAME_CONFIG.ACTION_DETAILS.explorar?.cost || {};
      const modifiedCost = this.main.factionLogic?.modifyExploreCost?.(player, cost) || cost;
      
      const canAfford = Object.entries(modifiedCost).every(([resource, amount]) => {
        return (player.resources[resource] || 0) >= amount;
      });
      
      if (!canAfford) {
        return { valid: false, reason: 'Recursos insuficientes para explorar' };
      }
    }
    
    return { valid: true, reason: '' };
  }

  _validateCollectAction(player, regionId) {
    if (regionId === null) {
      return { valid: false, reason: 'Selecione uma região' };
    }
    
    const region = gameState.regions[regionId];
    if (!region) {
      return { valid: false, reason: 'Região não encontrada' };
    }
    
    if (region.controller !== player.id) {
      return { valid: false, reason: 'Você não controla essa região' };
    }
    
    if (region.explorationLevel === 0) {
      return { valid: false, reason: 'Necessário explorar antes de recolher' };
    }
    
    const cost = GAME_CONFIG.ACTION_DETAILS.recolher?.cost || {};
    const canAfford = Object.entries(cost).every(([resource, amount]) => {
      return (player.resources[resource] || 0) >= amount;
    });
    
    if (!canAfford) {
      return { valid: false, reason: 'Recursos insuficientes para recolher' };
    }
    
    return { valid: true, reason: '' };
  }

  _validateBuildAction(player, regionId, structureType = 'Abrigo') {
    if (regionId === null) {
      return { valid: false, reason: 'Selecione uma região' };
    }
    
    const region = gameState.regions[regionId];
    if (!region) {
      return { valid: false, reason: 'Região não encontrada' };
    }
    
    if (region.controller !== player.id) {
      return { valid: false, reason: 'Região não controlada' };
    }
    
    if (region.structures.includes(structureType)) {
      return { valid: false, reason: 'Estrutura já existe na região' };
    }
    
    const structureConfig = window.STRUCTURE_CONFIG?.[structureType];
    if (!structureConfig) {
      return { valid: false, reason: `Tipo de estrutura desconhecido: ${structureType}` };
    }
    
    const cost = structureConfig.cost || {};
    const modifiedCost = this.main.factionLogic?.modifyBuildCost?.(player, cost) || cost;
    
    const canAfford = Object.entries(modifiedCost).every(([resource, amount]) => {
      return (player.resources[resource] || 0) >= amount;
    });
    
    if (!canAfford) {
      return { valid: false, reason: 'Recursos insuficientes para construir' };
    }
    
    return { valid: true, reason: '' };
  }

  _validateNegotiateAction(player) {
    if (gameState.currentPhase !== 'negociacao') {
      return { valid: false, reason: 'Negociação permitida apenas na fase de Negociação' };
    }
    
    const negCost = this.main.factionLogic?.modifyNegotiationCost?.(player) || 1;
    
    if (player.resources.ouro < negCost) {
      return { valid: false, reason: `Necessário ${negCost} Ouro para negociar` };
    }
    
    return { valid: true, reason: '' };
  }

  _validateDisputeAction(player, regionId) {
    if (regionId === null) {
      return { valid: false, reason: 'Selecione uma região para disputar' };
    }
    
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
    
    // Usar disputeLogic se disponível
    if (this.main.disputeLogic?.canAffordDispute) {
      if (!this.main.disputeLogic.canAffordDispute(player)) {
        return { valid: false, reason: 'Recursos insuficientes para iniciar disputa' };
      }
    } else {
      // Fallback básico
      if (player.victoryPoints < 3 || player.resources.ouro < 2) {
        return { valid: false, reason: 'Recursos insuficientes para iniciar disputa' };
      }
    }
    
    return { valid: true, reason: '' };
  }

  // ==================== VALIDAÇÃO DE RECURSOS ====================

  canPlayerAfford(player, cost) {
    if (!player || !cost) return false;
    
    return Object.entries(cost).every(([resource, amount]) => {
      return (player.resources[resource] || 0) >= amount;
    });
  }

  // ==================== VALIDAÇÃO DE JOGADOR ====================

  isPlayerActive(playerId) {
    const player = getPlayerById(playerId);
    return player && !player.eliminated;
  }

  // ==================== VALIDAÇÃO DE REGIÃO ====================

  isRegionControlledBy(regionId, playerId) {
    const region = gameState.regions[regionId];
    return region && region.controller === playerId;
  }

  // ==================== VALIDAÇÃO DE ESTRUTURA ====================

  canBuildStructureInRegion(regionId, structureType) {
    const region = gameState.regions[regionId];
    if (!region) return false;
    
    // Verificar se a estrutura já existe
    if (region.structures.includes(structureType)) return false;
    
    // Verificar limites de estrutura
    const structureLimits = window.STRUCTURE_LIMITS || {};
    if (structureLimits[structureType]) {
      const player = getCurrentPlayer();
      const playerStructures = player.regions.reduce((count, rid) => {
        const r = gameState.regions[rid];
        return count + (r.structures.includes(structureType) ? 1 : 0);
      }, 0);
      
      if (playerStructures >= structureLimits[structureType]) {
        return false;
      }
    }
    
    return true;
  }

  // ==================== DEBUG E RELATÓRIOS ====================

  getValidationReport() {
    const currentPlayer = getCurrentPlayer();
    
    return {
      player: {
        name: currentPlayer?.name,
        isEliminated: currentPlayer?.eliminated || false,
        actionsLeft: gameState.actionsLeft,
        resources: currentPlayer?.resources || {}
      },
      phase: gameState.currentPhase,
      selectedRegion: gameState.selectedRegionId,
      canAffordActions: {
        explorar: this.validateAction('explorar').valid,
        recolher: this.validateAction('recolher').valid,
        construir: this.validateAction('construir', { structureType: 'Abrigo' }).valid,
        negociar: this.validateAction('negociar').valid,
        disputar: this.validateAction('disputar').valid
      }
    };
  }
}