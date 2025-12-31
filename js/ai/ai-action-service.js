// ai-action-service.js - Serviço de Execução de Ações para IA
import { GAME_CONFIG, STRUCTURE_COSTS } from '../state/game-config.js';

export class AIActionService {
  constructor(aiBrain, gameLogic) {
    this.aiBrain = aiBrain;
    this.gameLogic = gameLogic;
    this.actionQueue = [];
    this.currentAction = null;
  }

  // ==================== EXECUÇÃO DE AÇÕES ====================

  async executeActionPhase(gameState, uiManager) {
    const player = gameState.players[this.aiBrain.playerId];
    if (!player || gameState.actionsLeft <= 0) return false;
    
    console.log(`🤖 ${player.name} executando ação (restantes: ${gameState.actionsLeft})`);
    
    try {
      // Decidir qual ação executar
      const action = this._decideNextAction(gameState);
      if (!action) {
        console.log(`🤖 ${player.name} não encontrou ação válida`);
        gameState.actionsLeft--; // Consumir ação
        return false;
      }
      
      // Validar ação
      const validation = this._validateAction(action, gameState);
      if (!validation.valid) {
        console.log(`🤖 Ação inválida: ${validation.reason}`);
        gameState.actionsLeft--;
        return false;
      }
      
      // Executar ação
      await this._executeAction(action, gameState, uiManager);
      
      return true;
      
    } catch (error) {
      console.error(`🤖 Erro na execução de ação:`, error);
      return false;
    }
  }

  // ==================== DECISÃO DE AÇÕES ====================

  _decideNextAction(gameState) {
    const player = gameState.players[this.aiBrain.playerId];
    const opportunities = this._findActionOpportunities(player, gameState);
    
    if (opportunities.length === 0) return null;
    
    // Ordenar por prioridade
    opportunities.sort((a, b) => b.priority - a.priority);
    
    return opportunities[0];
  }

  _findActionOpportunities(player, gameState) {
    const opportunities = [];
    
    // 1. Oportunidades de expansão
    const expansionOps = this._findExpansionOpportunities(player, gameState);
    opportunities.push(...expansionOps);
    
    // 2. Oportunidades de construção
    const buildOps = this._findBuildOpportunities(player, gameState);
    opportunities.push(...buildOps);
    
    // 3. Oportunidades de coleta
    const collectOps = this._findCollectOpportunities(player, gameState);
    opportunities.push(...collectOps);
    
    // 4. Oportunidades de exploração
    const exploreOps = this._findExploreOpportunities(player, gameState);
    opportunities.push(...exploreOps);
    
    return opportunities;
  }

  _findExpansionOpportunities(player, gameState) {
    const opportunities = [];
    const gridSize = GAME_CONFIG.GRID_SIZE;
    
    player.regions.forEach(controlledId => {
      const row = Math.floor(controlledId / gridSize);
      const col = controlledId % gridSize;
      
      // Verificar regiões adjacentes
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          
          const newRow = row + dr;
          const newCol = col + dc;
          
          if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
            const regionId = newRow * gridSize + newCol;
            const region = gameState.regions[regionId];
            
            if (region.controller !== null) continue;
            
            // Verificar se pode pagar
            const canAfford = Object.entries(region.resources).every(([res, amount]) => 
              player.resources[res] >= amount
            ) && player.victoryPoints >= 2;
            
            if (canAfford) {
              const biomeBonus = this.aiBrain.personality.preferredBiomes.includes(region.biome) ? 1.2 : 1.0;
              const resourceValue = Object.values(region.resources).reduce((a, b) => a + b, 0);
              const distancePenalty = (Math.abs(dr) + Math.abs(dc)) * 0.1;
              
              opportunities.push({
                type: 'assume_control',
                regionId,
                priority: (resourceValue * biomeBonus - distancePenalty) * 
                         this._getPersonalityMultiplier('assume_control'),
                description: `Assumir controle de ${region.name}`
              });
            }
          }
        }
      }
    });
    
    return opportunities;
  }

  _findBuildOpportunities(player, gameState) {
    const opportunities = [];
    
    player.regions.forEach(regionId => {
      const region = gameState.regions[regionId];
      if (!region) return;
      
      Object.keys(STRUCTURE_COSTS).forEach(structure => {
        if (region.structures.includes(structure)) return;
        
        const cost = STRUCTURE_COSTS[structure];
        const canAfford = Object.entries(cost).every(([res, amount]) => 
          player.resources[res] >= amount
        );
        
        if (canAfford) {
          const pvBonus = window.STRUCTURE_EFFECTS?.[structure]?.pv || 0;
          const resourceIncome = window.STRUCTURE_INCOME?.[structure] || {};
          
          let score = pvBonus * 3;
          Object.entries(resourceIncome).forEach(([res, amount]) => {
            score += amount * (this.aiBrain.personality.resourceTargets[res] ? 2 : 1);
          });
          
          // Bônus por sinergia com bioma
          if ((structure === 'Mercado' && region.biome === 'Savana') ||
              (structure === 'Laboratório' && region.biome === 'Pântano')) {
            score *= 1.3;
          }
          
          opportunities.push({
            type: 'build',
            regionId,
            structure,
            priority: score * this._getPersonalityMultiplier('build'),
            description: `Construir ${structure} em ${region.name}`
          });
        }
      });
    });
    
    return opportunities;
  }

  _findCollectOpportunities(player, gameState) {
    const opportunities = [];
    
    player.regions.forEach(regionId => {
      const region = gameState.regions[regionId];
      if (!region || region.explorationLevel === 0) return;
      
      // Verificar se pode pagar o custo
      if (player.resources.madeira < 1) return;
      
      const resourceValue = Object.values(region.resources).reduce((a, b) => a + b, 0);
      const explorationBonus = region.explorationLevel * 0.3;
      
      opportunities.push({
        type: 'collect',
        regionId,
        priority: (resourceValue * (1 + explorationBonus)) * 
                 this._getPersonalityMultiplier('collect'),
        description: `Recolher recursos de ${region.name}`
      });
    });
    
    return opportunities;
  }

  _findExploreOpportunities(player, gameState) {
    const opportunities = [];
    
    player.regions.forEach(regionId => {
      const region = gameState.regions[regionId];
      if (!region || region.explorationLevel >= 3) return;
      
      // Verificar se pode pagar o custo
      if (player.resources.madeira < 2 || player.resources.agua < 1) return;
      
      const currentLevel = region.explorationLevel;
      const levelBonus = (3 - currentLevel) * 0.5; // Priorizar níveis mais baixos
      
      opportunities.push({
        type: 'explore',
        regionId,
        priority: (1 + levelBonus) * this._getPersonalityMultiplier('explore'),
        description: `Explorar ${region.name} (Nível ${currentLevel} → ${currentLevel + 1})`
      });
    });
    
    return opportunities;
  }

  _getPersonalityMultiplier(actionType) {
    const personality = this.aiBrain.personality.type;
    const multipliers = {
      'expansionist': {
        'assume_control': 1.5,
        'dispute': 1.3,
        'explore': 1.2,
        'build': 0.8,
        'collect': 0.7
      },
      'builder': {
        'build': 1.8,
        'explore': 1.3,
        'collect': 1.0,
        'assume_control': 0.7
      },
      'economist': {
        'collect': 1.6,
        'explore': 1.1,
        'assume_control': 0.9,
        'build': 0.8
      },
      'diplomat': {
        'collect': 1.2,
        'explore': 1.0,
        'assume_control': 0.6,
        'build': 0.9
      }
    };
    
    return multipliers[personality]?.[actionType] || 1.0;
  }

  // ==================== VALIDAÇÃO ====================

  _validateAction(action, gameState) {
    const player = gameState.players[this.aiBrain.playerId];
    
    if (!player || gameState.actionsLeft <= 0) {
      return { valid: false, reason: 'Sem ações disponíveis' };
    }
    
    switch (action.type) {
      case 'assume_control':
        return this._validateAssumeControl(action, player, gameState);
      case 'explore':
        return this._validateExplore(action, player, gameState);
      case 'collect':
        return this._validateCollect(action, player, gameState);
      case 'build':
        return this._validateBuild(action, player, gameState);
      default:
        return { valid: false, reason: `Tipo de ação desconhecido: ${action.type}` };
    }
  }

  _validateAssumeControl(action, player, gameState) {
    const region = gameState.regions[action.regionId];
    if (!region) return { valid: false, reason: 'Região não existe' };
    
    if (region.controller !== null) {
      return { valid: false, reason: 'Região já tem dono' };
    }
    
    if (player.victoryPoints < 2) {
      return { valid: false, reason: 'PV insuficientes (precisa 2)' };
    }
    
    const canPay = Object.entries(region.resources).every(([res, amount]) => 
      player.resources[res] >= amount
    );
    
    if (!canPay) {
      return { valid: false, reason: 'Recursos insuficientes' };
    }
    
    return { valid: true, reason: '' };
  }

  _validateExplore(action, player, gameState) {
    const region = gameState.regions[action.regionId];
    if (!region) return { valid: false, reason: 'Região não existe' };
    
    if (region.controller !== player.id) {
      return { valid: false, reason: 'Região não controlada' };
    }
    
    if (player.resources.madeira < 2 || player.resources.agua < 1) {
      return { valid: false, reason: 'Recursos insuficientes para explorar' };
    }
    
    return { valid: true, reason: '' };
  }

  _validateCollect(action, player, gameState) {
    const region = gameState.regions[action.regionId];
    if (!region) return { valid: false, reason: 'Região não existe' };
    
    if (region.controller !== player.id) {
      return { valid: false, reason: 'Região não controlada' };
    }
    
    if (region.explorationLevel === 0) {
      return { valid: false, reason: 'Região não explorada' };
    }
    
    if (player.resources.madeira < 1) {
      return { valid: false, reason: 'Madeira insuficiente para recolher' };
    }
    
    return { valid: true, reason: '' };
  }

  _validateBuild(action, player, gameState) {
    const region = gameState.regions[action.regionId];
    if (!region) return { valid: false, reason: 'Região não existe' };
    
    if (region.controller !== player.id) {
      return { valid: false, reason: 'Região não controlada' };
    }
    
    if (region.structures.includes(action.structure)) {
      return { valid: false, reason: 'Estrutura já existe' };
    }
    
    const cost = STRUCTURE_COSTS[action.structure];
    if (!cost) return { valid: false, reason: 'Estrutura inválida' };
    
    const canAfford = Object.entries(cost).every(([res, amount]) => 
      player.resources[res] >= amount
    );
    
    if (!canAfford) {
      return { valid: false, reason: 'Recursos insuficientes para construir' };
    }
    
    return { valid: true, reason: '' };
  }

  // ==================== EXECUÇÃO ====================

  async _executeAction(action, gameState, uiManager) {
    console.log(`🤖 Executando ação: ${action.description}`);
    
    // Configurar região selecionada
    gameState.selectedRegionId = action.regionId;
    await this._delay(300);
    
    try {
      switch (action.type) {
        case 'assume_control':
        case 'explore':
          if (window.gameLogic?.handleExplore) {
            await window.gameLogic.handleExplore();
          }
          break;
          
        case 'collect':
          if (window.gameLogic?.handleCollect) {
            await window.gameLogic.handleCollect();
          }
          break;
          
        case 'build':
          if (window.gameLogic?.handleBuild) {
            await window.gameLogic.handleBuild(action.structure);
          }
          break;
      }
      
      console.log(`✅ Ação ${action.type} executada com sucesso`);
      return true;
      
    } catch (error) {
      console.error(`❌ Erro na execução da ação ${action.type}:`, error);
      return false;
    }
  }

  // ==================== GERENCIAMENTO DE DISPUTAS ====================

  async executeDisputeAction(disputeOpportunity, gameState) {
    console.log(`🤖 Executando disputa: ${disputeOpportunity.description}`);
    
    try {
      gameState.selectedRegionId = disputeOpportunity.regionId;
      await this._delay(500);
      
      if (window.gameLogic?.handleDispute) {
        await window.gameLogic.handleDispute();
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error(`❌ Erro na execução da disputa:`, error);
      return false;
    }
  }

  // ==================== UTILITÁRIOS ====================

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== ESTATÍSTICAS ====================

  getActionStatistics() {
    return {
      queueLength: this.actionQueue.length,
      currentAction: this.currentAction,
      totalExecuted: this.actionQueue.filter(a => a.executed).length
    };
  }
}