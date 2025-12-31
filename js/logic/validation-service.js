// validation-service.js - Serviço de Validações Unificado
import { gameState, getCurrentPlayer, getPlayerById } from '../state/game-state.js';
import { GAME_CONFIG, TURN_PHASES } from '../state/game-config.js';

export class ValidationService {
  constructor(gameLogic) {
    this.main = gameLogic;
  }

  // ==================== VALIDAÇÃO COMPLETA DE AÇÃO ====================

  validateAction(actionType, options = {}) {
    const player = options.player || getCurrentPlayer();
    const regionId = options.regionId || gameState.selectedRegionId;
    
    // 1. Validações básicas
    const basicResult = this._validateBasicChecks(actionType, player);
    if (!basicResult.valid) return basicResult;
    
    // 2. Validação de fase
    const phaseResult = this._validatePhase(actionType);
    if (!phaseResult.valid) return phaseResult;
    
    // 3. Validações específicas por ação
    switch(actionType) {
      case 'explorar':
        return this._validateExplore(player, regionId);
      case 'recolher':
        return this._validateCollect(player, regionId);
      case 'construir':
        return this._validateBuild(player, regionId, options.structureType);
      case 'negociar':
        return this._validateNegotiate(player);
      case 'disputar':
        return this._validateDispute(player, regionId);
      default:
        return { valid: false, reason: `Tipo de ação desconhecida: ${actionType}` };
    }
  }

  _validateBasicChecks(actionType, player) {
    if (!player) {
      return { valid: false, reason: 'Jogador não encontrado' };
    }
    
    if (player.eliminated && !this._isActionAllowedForEliminated(actionType)) {
      return { valid: false, reason: 'Jogador eliminado não pode realizar esta ação' };
    }
    
    if (gameState.actionsLeft <= 0) {
      return { valid: false, reason: 'Sem ações restantes neste turno' };
    }
    
    return { valid: true, reason: '' };
  }

  _validatePhase(actionType) {
    const currentPhase = gameState.currentPhase;
    const phaseActions = {
      [TURN_PHASES.RENDA]: [],
      [TURN_PHASES.ACOES]: ['explorar', 'recolher', 'construir', 'disputar'],
      [TURN_PHASES.NEGOCIACAO]: ['negociar']
    };
    
    if (!phaseActions[currentPhase]?.includes(actionType)) {
      return { 
        valid: false, 
        reason: `Ação "${actionType}" não permitida na fase "${currentPhase}"` 
      };
    }
    
    return { valid: true, reason: '' };
  }

  _isActionAllowedForEliminated(actionType) {
    // Jogadores eliminados só podem dominar regiões neutras
    return actionType === 'explorar' && gameState.selectedRegionId !== null;
  }

  // ==================== VALIDAÇÕES ESPECÍFICAS ====================

  _validateExplore(player, regionId) {
    if (regionId === null) {
      return { valid: false, reason: 'Selecione uma região primeiro' };
    }
    
    const region = gameState.regions[regionId];
    if (!region) {
      return { valid: false, reason: 'Região não encontrada' };
    }
    
    // Verificar recursos para explorar
    const cost = GAME_CONFIG.ACTION_DETAILS.explorar?.cost || {};
    const modifiedCost = this.main.factionLogic?.modifyExploreCost?.(player, cost) || cost;
    
    const canAfford = Object.entries(modifiedCost).every(([resource, amount]) => {
      return (player.resources[resource] || 0) >= amount;
    });
    
    if (!canAfford) {
      return { valid: false, reason: 'Recursos insuficientes para explorar' };
    }
    
    return { valid: true, reason: '' };
  }

  _validateCollect(player, regionId) {
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

  _validateBuild(player, regionId, structureType = 'Abrigo') {
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

  _validateNegotiate(player) {
    if (player.resources.ouro < 1) {
      return { valid: false, reason: 'Necessário 1 Ouro para negociar' };
    }
    
    return { valid: true, reason: '' };
  }

  _validateDispute(player, regionId) {
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
    
    // Verificar recursos mínimos para disputa
    if (player.victoryPoints < 3 || player.resources.ouro < 2) {
      return { valid: false, reason: 'Recursos insuficientes para iniciar disputa' };
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

  // ==================== GETTERS DE STATUS ====================

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
      canPerformActions: {
        explorar: this.validateAction('explorar').valid,
        recolher: this.validateAction('recolher').valid,
        construir: this.validateAction('construir', { structureType: 'Abrigo' }).valid,
        negociar: this.validateAction('negociar').valid,
        disputar: this.validateAction('disputar').valid
      }
    };
  }
}