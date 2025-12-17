// ai-system.js - Sistema de Inteligência Artificial para Gaia Dominium

import { 
  GAME_CONFIG, 
  BIOME_INCOME,
  STRUCTURE_COSTS,
  STRUCTURE_INCOME,
  STRUCTURE_EFFECTS,
  EXPLORATION_BONUS
} from '../state/game-config.js';

import { 
  getPendingNegotiationsForPlayer,
  resetNegotiationState,
  setNegotiationTarget,
  updateNegotiationResource,
  validateNegotiationState,
  getNegotiationValidationErrors,
  setActiveNegotiation
} from '../state/game-state.js';

// ==================== CONFIGURAÇÕES ====================

const AI_DIFFICULTY_SETTINGS = {
  easy: {
    name: 'Fácil',
    reactionDelay: 2000,
    decisionAccuracy: 0.6,
    planningDepth: 1,
    memoryTurns: 2,
    aggressionLevel: 0.2,
    resourcePriority: ['madeira', 'agua', 'pedra', 'ouro'],
    avoidNegotiations: false,
    personalityWeights: {
      expansionist: 0.4,
      builder: 0.3,
      economist: 0.2,
      diplomat: 0.1
    }
  },
  medium: {
    name: 'Médio',
    reactionDelay: 1500,
    decisionAccuracy: 0.75,
    planningDepth: 2,
    memoryTurns: 3,
    aggressionLevel: 0.4,
    resourcePriority: ['ouro', 'madeira', 'pedra', 'agua'],
    avoidNegotiations: false,
    personalityWeights: {
      expansionist: 0.3,
      builder: 0.4,
      economist: 0.2,
      diplomat: 0.1
    }
  },
  hard: {
    name: 'Difícil',
    reactionDelay: 1000,
    decisionAccuracy: 0.85,
    planningDepth: 3,
    memoryTurns: 4,
    aggressionLevel: 0.6,
    resourcePriority: ['ouro', 'pedra', 'madeira', 'agua'],
    avoidNegotiations: true,
    personalityWeights: {
      expansionist: 0.3,
      builder: 0.3,
      economist: 0.3,
      diplomat: 0.1
    }
  },
  master: {
    name: 'Mestre',
    reactionDelay: 500,
    decisionAccuracy: 0.95,
    planningDepth: 4,
    memoryTurns: 5,
    aggressionLevel: 0.8,
    resourcePriority: ['ouro', 'pedra', 'agua', 'madeira'],
    avoidNegotiations: true,
    personalityWeights: {
      expansionist: 0.25,
      builder: 0.25,
      economist: 0.25,
      diplomat: 0.25
    },
    adaptiveLearning: true
  }
};

const AI_PERSONALITIES = {
  expansionist: {
    name: 'Expansionista',
    description: 'Foco em controle territorial',
    priorities: [
      { action: 'assume_control', weight: 1.5 },
      { action: 'explore', weight: 1.2 },
      { action: 'build', weight: 0.8 },
      { action: 'collect', weight: 0.7 },
      { action: 'negotiate', weight: 0.3 }
    ],
    preferredBiomes: ['Floresta Tropical', 'Savana'],
    resourceTargets: { madeira: 15, pedra: 10, ouro: 8, agua: 12 }
  },
  builder: {
    name: 'Construtor',
    description: 'Foco em estruturas',
    priorities: [
      { action: 'build', weight: 1.8 },
      { action: 'explore', weight: 1.3 },
      { action: 'collect', weight: 1.0 },
      { action: 'assume_control', weight: 0.7 },
      { action: 'negotiate', weight: 0.4 }
    ],
    preferredBiomes: ['Floresta Temperada', 'Pântano'],
    resourceTargets: { madeira: 20, pedra: 15, ouro: 5, agua: 10 }
  },
  economist: {
    name: 'Economista',
    description: 'Foco em recursos',
    priorities: [
      { action: 'collect', weight: 1.6 },
      { action: 'negotiate', weight: 1.4 },
      { action: 'explore', weight: 1.1 },
      { action: 'assume_control', weight: 0.9 },
      { action: 'build', weight: 0.8 }
    ],
    preferredBiomes: ['Savana', 'Pântano'],
    resourceTargets: { madeira: 12, pedra: 12, ouro: 20, agua: 15 }
  },
  diplomat: {
    name: 'Diplomata',
    description: 'Foco em negociações',
    priorities: [
      { action: 'negotiate', weight: 1.7 },
      { action: 'collect', weight: 1.2 },
      { action: 'explore', weight: 1.0 },
      { action: 'assume_control', weight: 0.6 },
      { action: 'build', weight: 0.9 }
    ],
    preferredBiomes: ['Floresta Tropical', 'Savana'],
    resourceTargets: { madeira: 10, pedra: 8, ouro: 25, agua: 10 }
  }
};

// ==================== CLASSE PRINCIPAL ====================

class AIBrain {
constructor(playerId, difficulty = 'medium') {
    // playerId deve ser o ID real no gameState.players
    this.playerId = Number(playerId); // GARANTIR que é número
    this.difficulty = difficulty;
    this.settings = AI_DIFFICULTY_SETTINGS[difficulty];
    this.personality = this.assignPersonality();
    this.memory = {
        playerStyles: {},
        regionValues: {},
        threatAssessment: {},
        lastActions: [],
        negotiationHistory: []
    };
    this.currentPlan = null;
    this.phase = 'idle';
    
    console.log(`🤖 IA criada com playerId: ${this.playerId} (tipo: ${typeof this.playerId})`);
}

  // ==================== CONFIGURAÇÃO ====================
  
  assignPersonality() {
    const weights = this.settings.personalityWeights;
    const rand = Math.random();
    let cumulative = 0;
    
    for (const [type, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (rand <= cumulative) {
        return { type, ...AI_PERSONALITIES[type] };
      }
    }
    
    return { type: 'expansionist', ...AI_PERSONALITIES.expansionist };
  }

  // ==================== TURNO PRINCIPAL ====================
  
  async takeTurn(gameState, uiManager) {
    console.log(`🤖 [${new Date().toLocaleTimeString()}] ${this.personality.name} iniciando turno`);
    
    if (gameState.currentPlayerIndex !== this.playerId) {
      console.log(`⏸️ Não é turno desta IA. Jogador atual: ${gameState.currentPlayerIndex}, IA: ${this.playerId}`);
      return false;
    }
    
    this.phase = 'planning';
    
    try {
      this.clearFeedbackHistory();
      
      const analysis = this.analyzeGameState(gameState);
      this.currentPlan = this.generateActionPlan(analysis, gameState);
      
      if (!this.currentPlan || this.currentPlan.actions.length === 0) {
        console.log('🤖 Nenhuma ação disponível no plano');
        this.phase = 'no_actions';
        return false;
      }
      
      console.log(`🤖 Plano gerado com ${this.currentPlan.actions.length} ações`);
      
      await this.executePlan(this.currentPlan, gameState, uiManager);
      
      this.phase = 'completed';
      return true;
      
    } catch (error) {
      console.error('🤖 ERRO em takeTurn:', error);
      this.phase = 'error';
      
      setTimeout(() => {
        if (window.gameLogic?.forceAIEndTurn) {
          window.gameLogic.forceAIEndTurn();
        }
      }, 1000);
      
      return false;
    }
  }

  // ==================== ANÁLISE DO ESTADO ====================
  
  analyzeGameState(gameState) {
    const player = gameState.players[this.playerId];
    return {
      playerStatus: this.analyzePlayerStatus(player, gameState),
      threatLevel: this.calculateThreatLevel(player, gameState),
      resourceNeeds: this.calculateResourceNeeds(player),
      expansionOpportunities: this.findExpansionOpportunities(player, gameState),
      buildOpportunities: this.findBuildOpportunities(player, gameState),
      negotiationTargets: this.findNegotiationTargets(player, gameState)
    };
  }
  
  analyzePlayerStatus(player, gameState) {
    const regions = player.regions.map(id => gameState.regions[id]);
    
    return {
      victoryPoints: player.victoryPoints,
      resourceBalance: { ...player.resources },
      regionCount: regions.length,
      explorationLevels: regions.map(r => r.explorationLevel).reduce((a, b) => a + b, 0) / regions.length || 0,
      structureCount: regions.reduce((sum, r) => sum + r.structures.length, 0),
      controlledBiomes: [...new Set(regions.map(r => r.biome))],
      avgResourceProduction: this.calculateAverageProduction(regions)
    };
  }
  
  calculateAverageProduction(regions) {
    let total = { madeira: 0, pedra: 0, ouro: 0, agua: 0 };
    
    regions.forEach(region => {
      const base = BIOME_INCOME[region.biome] || {};
      const explorationBonus = EXPLORATION_BONUS ? EXPLORATION_BONUS[region.explorationLevel] || 1 : 1;
      
      Object.keys(total).forEach(resource => {
        total[resource] += (base[resource] || 0) * explorationBonus;
      });
      
      region.structures?.forEach(structure => {
        const income = STRUCTURE_INCOME ? STRUCTURE_INCOME[structure] || {} : {};
        Object.keys(total).forEach(resource => {
          total[resource] += income[resource] || 0;
        });
      });
    });
    
    return total;
  }
  
  calculateThreatLevel(player, gameState) {
    const threats = [];
    const myScore = player.victoryPoints;
    
    gameState.players.forEach((p, idx) => {
      if (idx === this.playerId) return;
      
      const threatScore = (p.victoryPoints - myScore) * 0.5;
      const regionThreat = Math.max(0, p.regions.length - player.regions.length) * 0.3;
      const resourceThreat = this.compareResources(p.resources, player.resources);
      
      if (threatScore > 0 || regionThreat > 0) {
        threats.push({
          playerId: idx,
          score: threatScore + regionThreat + resourceThreat,
          isLeading: p.victoryPoints > myScore + 3,
          borderRegions: this.findBorderRegions(player.regions, p.regions, gameState)
        });
      }
    });
    
    return threats.sort((a, b) => b.score - a.score);
  }
  
  compareResources(resA, resB) {
    const resources = ['madeira', 'pedra', 'ouro', 'agua'];
    let advantage = 0;
    
    resources.forEach(res => {
      if (resA[res] > resB[res] * 1.5) advantage += 0.2;
    });
    
    return advantage;
  }
  
  findBorderRegions(myRegions, theirRegions, gameState) {
    const borders = [];
    const gridSize = GAME_CONFIG.GRID_SIZE;
    
    myRegions.forEach(myId => {
      theirRegions.forEach(theirId => {
        const row1 = Math.floor(myId / gridSize);
        const col1 = myId % gridSize;
        const row2 = Math.floor(theirId / gridSize);
        const col2 = theirId % gridSize;
        
        if (Math.abs(row1 - row2) <= 1 && Math.abs(col1 - col2) <= 1) {
          borders.push({ 
            myRegion: myId, 
            theirRegion: theirId, 
            distance: Math.abs(row1 - row2) + Math.abs(col1 - col2) 
          });
        }
      });
    });
    
    return borders;
  }
  
  calculateResourceNeeds(player) {
    const needs = {};
    const targets = this.personality.resourceTargets;
    
    Object.keys(targets).forEach(resource => {
      const target = targets[resource];
      const current = player.resources[resource] || 0;
      needs[resource] = Math.max(0, target - current) / target;
    });
    
    return needs;
  }
  
  findExpansionOpportunities(player, gameState) {
    const opportunities = [];
    const gridSize = GAME_CONFIG.GRID_SIZE;
    
    player.regions.forEach(controlledId => {
      const row = Math.floor(controlledId / gridSize);
      const col = controlledId % gridSize;
      
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          
          const newRow = row + dr;
          const newCol = col + dc;
          
          if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
            const regionId = newRow * gridSize + newCol;
            const region = gameState.regions[regionId];
            
            if (region.controller !== null) continue;
            
            const canPay = Object.entries(region.resources).every(([res, amount]) => 
              player.resources[res] >= amount
            );
            
            if (!canPay) continue;
            
            const biomePref = this.personality.preferredBiomes.includes(region.biome) ? 1.2 : 1.0;
            const resourceValue = Object.values(region.resources).reduce((a, b) => a + b, 0);
            const distancePenalty = (Math.abs(dr) + Math.abs(dc)) * 0.1;
            
            opportunities.push({
              regionId,
              biome: region.biome,
              resources: region.resources,
              score: (resourceValue * biomePref) - distancePenalty,
              adjacentTo: controlledId,
              canAfford: true,
              validation: 'ready'
            });
          }
        }
      }
    });
    
    return opportunities.sort((a, b) => b.score - a.score);
  }
  
  findBuildOpportunities(player, gameState) {
    const opportunities = [];
    
    player.regions.forEach(regionId => {
      const region = gameState.regions[regionId];
      
      Object.keys(STRUCTURE_COSTS).forEach(structure => {
        if (region.structures.includes(structure)) return;
        
        const cost = STRUCTURE_COSTS[structure];
        const canAfford = Object.entries(cost).every(([res, amount]) => 
          player.resources[res] >= amount
        );
        
        if (canAfford) {
          const income = STRUCTURE_INCOME[structure] || {};
          const effect = STRUCTURE_EFFECTS ? STRUCTURE_EFFECTS[structure] : {};
          const pvBonus = effect?.pv || 0;
          
          let score = pvBonus * 3;
          Object.entries(income).forEach(([res, amount]) => {
            score += amount * (this.personality.resourceTargets[res] ? 2 : 1);
          });
          
          if ((structure === 'Mercado' && region.biome === 'Savana') ||
              (structure === 'Laboratório' && region.biome === 'Pântano')) {
            score *= 1.3;
          }
          
          opportunities.push({
            regionId,
            structure,
            cost,
            income,
            pvBonus,
            score
          });
        }
      });
    });
    
    return opportunities.sort((a, b) => b.score - a.score);
  }
  
  findNegotiationTargets(player, gameState) {
    if (this.settings.avoidNegotiations && Math.random() > 0.3) return [];
    
    const targets = [];
    const myResources = player.resources;
    
    gameState.players.forEach((p, idx) => {
      if (idx === this.playerId) return;
      
      const theirResources = p.resources;
      const possibleTrades = [];
      
      Object.keys(myResources).forEach(res => {
        const myNeed = this.calculateResourceNeeds(player)[res];
        const theirSurplus = theirResources[res] - (myResources[res] || 0);
        
        if (myNeed > 0.3 && theirSurplus > 5) {
          possibleTrades.push({
            resource: res,
            direction: 'receive',
            amount: Math.min(Math.floor(theirSurplus * 0.3), 5),
            value: myNeed * theirSurplus
          });
        }
      });
      
      if (possibleTrades.length > 0) {
        targets.push({
          playerId: idx,
          name: p.name,
          possibleTrades,
          relationship: this.memory.negotiationHistory.filter(n => n.partner === idx).length,
          score: possibleTrades.reduce((sum, t) => sum + t.value, 0)
        });
      }
    });
    
    return targets.sort((a, b) => b.score - a.score);
  }

  // ==================== PLANEJAMENTO ====================
  
  generateActionPlan(analysis, gameState) {
    const player = gameState.players[this.playerId];
    const actions = [];
    let remainingActions = gameState.actionsLeft;
    
    const priorities = [...this.personality.priorities];
    
    if (analysis.threatLevel.length > 0 && analysis.threatLevel[0].score > 0.7) {
      priorities.find(p => p.action === 'assume_control').weight *= 1.5;
      priorities.find(p => p.action === 'build').weight *= 1.2;
    }
    
    if (Object.values(analysis.resourceNeeds).some(need => need > 0.7)) {
      priorities.find(p => p.action === 'collect').weight *= 1.4;
      priorities.find(p => p.action === 'explore').weight *= 1.2;
    }
    
    priorities.sort((a, b) => b.weight - a.weight);
    
    priorities.forEach(priority => {
      if (remainingActions <= 0) return;
      
      switch (priority.action) {
        case 'assume_control':
          if (analysis.expansionOpportunities.length > 0) {
            const bestRegion = analysis.expansionOpportunities[0];
            if (this.canAffordControl(player, bestRegion)) {
              actions.push({
                type: 'assume_control',
                regionId: bestRegion.regionId,
                priority: priority.weight,
                description: `Assumir controle de ${gameState.regions[bestRegion.regionId].name}`
              });
              remainingActions--;
            }
          }
          break;
          
        case 'explore':
          if (player.regions.length > 0) {
            const regionToExplore = this.chooseRegionToExplore(player, gameState);
            if (regionToExplore && this.canAffordExplore(player)) {
              actions.push({
                type: 'explore',
                regionId: regionToExplore,
                priority: priority.weight,
                description: `Explorar ${gameState.regions[regionToExplore].name}`
              });
              remainingActions--;
            }
          }
          break;
          
        case 'build':
          if (analysis.buildOpportunities.length > 0) {
            const bestBuild = analysis.buildOpportunities[0];
            actions.push({
              type: 'build',
              regionId: bestBuild.regionId,
              structure: bestBuild.structure,
              priority: priority.weight,
              description: `Construir ${bestBuild.structure} em ${gameState.regions[bestBuild.regionId].name}`
            });
            remainingActions--;
          }
          break;
          
        case 'collect':
          if (player.regions.length > 0) {
            const regionToCollect = this.chooseRegionToCollect(player, gameState);
            if (regionToCollect && this.canAffordCollect(player)) {
              actions.push({
                type: 'collect',
                regionId: regionToCollect,
                priority: priority.weight,
                description: `Recolher recursos de ${gameState.regions[regionToCollect].name}`
              });
              remainingActions--;
            }
          }
          break;
          
        case 'negotiate':
          if (analysis.negotiationTargets.length > 0 && remainingActions >= 1) {
            const target = analysis.negotiationTargets[0];
            if (this.settings.difficulty !== 'master' || Math.random() > 0.5) {
              actions.push({
                type: 'negotiate',
                targetPlayerId: target.playerId,
                priority: priority.weight,
                description: `Negociar com ${target.name}`
              });
              remainingActions--;
            }
          }
          break;
      }
    });
    
    while (remainingActions > 0 && player.regions.length > 0) {
      const randomRegion = player.regions[Math.floor(Math.random() * player.regions.length)];
      if (this.canAffordExplore(player)) {
        actions.push({
          type: 'explore',
          regionId: randomRegion,
          priority: 0.5,
          description: `Explorar ${gameState.regions[randomRegion].name} (fallback)`
        });
        remainingActions--;
      } else {
        break;
      }
    }
    
    return {
      actions,
      analysis,
      turnGoals: this.generateTurnGoals(analysis)
    };
  }
  
  chooseRegionToExplore(player, gameState) {
    let bestRegion = null;
    let lowestLevel = 4;
    
    player.regions.forEach(regionId => {
      const region = gameState.regions[regionId];
      const canExplore = player.resources.madeira >= 2 && player.resources.agua >= 1;
      
      if (canExplore && region.explorationLevel < lowestLevel) {
        lowestLevel = region.explorationLevel;
        bestRegion = regionId;
      }
    });
    
    return bestRegion;
  }
  
  chooseRegionToCollect(player, gameState) {
    let bestRegion = null;
    let bestScore = -1;
    
    player.regions.forEach(regionId => {
      const region = gameState.regions[regionId];
      const canCollect = region.explorationLevel > 0 && player.resources.madeira >= 1;
      
      if (canCollect) {
        const resourceTotal = Object.values(region.resources).reduce((a, b) => a + b, 0);
        const score = resourceTotal * (1 + region.explorationLevel * 0.3);
        
        if (score > bestScore) {
          bestScore = score;
          bestRegion = regionId;
        }
      }
    });
    
    return bestRegion;
  }
  
  canAffordControl(player, regionInfo) {
    const cost = regionInfo.resources;
    const pvCost = 2;
    
    if (player.victoryPoints < pvCost) return false;
    
    return Object.entries(cost).every(([res, amount]) => 
      player.resources[res] >= amount
    );
  }
  
  canAffordExplore(player) {
    return player.resources.madeira >= 2 && player.resources.agua >= 1;
  }
  
  canAffordCollect(player) {
    return player.resources.madeira >= 1;
  }
  
  generateTurnGoals(analysis) {
    const goals = [];
    
    if (analysis.playerStatus.victoryPoints < 15) {
      goals.push('Aumentar Pontos de Vitória');
    }
    
    if (analysis.playerStatus.regionCount < 5) {
      goals.push('Expandir território');
    }
    
    if (analysis.threatLevel.some(t => t.isLeading)) {
      goals.push('Reduzir vantagem do líder');
    }
    
    return goals.length > 0 ? goals : ['Consolidar posição'];
  }
  
  addDecisionNoise(analysis) {
    const noiseLevel = 1 - this.settings.decisionAccuracy;
    
    if (noiseLevel > 0) {
      analysis.expansionOpportunities.forEach(opp => {
        opp.score *= (1 + (Math.random() - 0.5) * noiseLevel);
      });
      
      analysis.buildOpportunities.forEach(opp => {
        opp.score *= (1 + (Math.random() - 0.5) * noiseLevel);
      });
      
      analysis.expansionOpportunities.sort((a, b) => b.score - a.score);
      analysis.buildOpportunities.sort((a, b) => b.score - a.score);
    }
    
    return analysis;
  }

  // ==================== EXECUÇÃO ====================
  
  async executePlan(plan, gameState, uiManager) {
    console.log(`🤖 Executando plano com ${plan.actions.length} ações`);
    
    for (const action of plan.actions) {
      if (gameState.actionsLeft <= 0) {
        console.log('🤖 Sem ações restantes');
        break;
      }
      
      console.log(`🤖 Ação: ${action.description} (Ações restantes: ${gameState.actionsLeft})`);
      
      await this.delay(this.settings.reactionDelay);
      
      try {
        await this.executeAction(action, gameState, uiManager);
        
        if (window.gameLogic?.performAction) {
          window.gameLogic.performAction(action.type);
        }
        
        this.memory.lastActions.push({
          turn: gameState.turn,
          action: action.type,
          success: true
        });
        
      } catch (error) {
        console.error(`🤖 Erro na ação ${action.type}:`, error);
      }
    }
    
    console.log(`🤖 Plano executado. Ações restantes: ${gameState.actionsLeft}`);
  }
  
  async executeAction(action, gameState, uiManager) {
    const player = gameState.players[this.playerId];
    
    if (!this.validateActionForPhase(action.type, gameState)) {
      console.log(`🤖 Ação ${action.type} inválida para fase ${gameState.currentPhase}`);
      throw new Error(`Ação inválida para fase ${gameState.currentPhase}`);
    }
    
    const requiresRegion = ['assume_control', 'explore', 'build', 'collect'].includes(action.type);
    if (requiresRegion && action.regionId === undefined) {
      console.log('❌ Ação requer região selecionada');
      throw new Error('Região não selecionada');
    }
    
    if (requiresRegion && !gameState.regions[action.regionId]) {
      console.log('❌ Região não existe');
      throw new Error('Região inválida');
    }
    
    if (requiresRegion) {
      console.log(`🤖 Selecionando região ${action.regionId}`);
      gameState.selectedRegionId = action.regionId;
      await this.delay(300);
    }
    
    console.log(`🤖 Executando ação: ${action.description}`);
    
    try {
      switch (action.type) {
        case 'assume_control':
          if (window.gameLogic?.handleExplore) {
            await window.gameLogic.handleExplore();
          }
          break;
          
        case 'explore':
          if (window.gameLogic?.handleExplore) {
            await window.gameLogic.handleExplore();
          }
          break;
          
        case 'build':
          if (window.gameLogic?.handleBuild) {
            await window.gameLogic.handleBuild(action.structure);
          }
          break;
          
        case 'collect':
          if (window.gameLogic?.handleCollect) {
            await window.gameLogic.handleCollect();
          }
          break;
          
        case 'negotiate':
          if (window.gameLogic?.handleNegotiate) {
            await window.gameLogic.handleNegotiate();
          }
          break;
      }
      
      await this.delay(500);
      console.log(`✅ Ação ${action.type} executada`);
      
    } catch (error) {
      console.error(`❌ Erro na execução da ação ${action.type}:`, error);
      throw error;
    }
  }
  
  validateActionForPhase(actionType, gameState) {
    const currentPhase = gameState.currentPhase;
    
    const phaseActions = {
      'renda': [],
      'acoes': ['assume_control', 'explore', 'build', 'collect'],
      'negociacao': ['negotiate']
    };
    
    if (!phaseActions[currentPhase]?.includes(actionType)) {
      console.log(`❌ Ação "${actionType}" não permitida na fase "${currentPhase}"`);
      return false;
    }
    
    if (gameState.actionsLeft <= 0) {
      console.log('❌ Sem ações restantes');
      return false;
    }
    
    const player = gameState.players[this.playerId];
    switch(actionType) {
      case 'assume_control':
        return player.victoryPoints >= 2;
        
      case 'explore':
        return player.resources.madeira >= 2 && player.resources.agua >= 1;
        
      case 'collect':
        return player.resources.madeira >= 1;
        
      case 'build':
        return true;
        
      case 'negotiate':
        return player.resources.ouro >= 1;
        
      default:
        return false;
    }
  }
  
  validateRegionAction(action, gameState) {
    const player = gameState.players[this.playerId];
    const region = gameState.regions[action.regionId];
    
    if (!region) {
      return { valid: false, reason: 'Região não existe' };
    }
    
    if (action.type !== 'assume_control') {
      if (region.controller !== this.playerId) {
        return { valid: false, reason: 'Você não controla essa região' };
      }
    }
    
    switch(action.type) {
      case 'assume_control':
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
          return { valid: false, reason: 'Recursos insuficientes para assumir domínio' };
        }
        break;
        
      case 'explore':
        if (region.controller !== player.id) {
          return { valid: false, reason: 'Região não é sua' };
        }
        if (player.resources.madeira < 2 || player.resources.agua < 1) {
          return { valid: false, reason: 'Recursos insuficientes para explorar' };
        }
        break;
        
      case 'collect':
        if (region.controller !== player.id) {
          return { valid: false, reason: 'Região não é sua' };
        }
        if (region.explorationLevel <= 0) {
          return { valid: false, reason: 'Região não explorada (nível 0)' };
        }
        if (player.resources.madeira < 1) {
          return { valid: false, reason: 'Madeira insuficiente para recolher' };
        }
        break;
        
      case 'build':
        if (region.controller !== player.id) {
          return { valid: false, reason: 'Região não é sua' };
        }
        if (region.structures.includes(action.structure)) {
          return { valid: false, reason: 'Estrutura já existe na região' };
        }
        const cost = STRUCTURE_COSTS[action.structure];
        if (!cost) {
          return { valid: false, reason: 'Estrutura inválida' };
        }
        const canAfford = Object.entries(cost).every(([res, amount]) => 
          player.resources[res] >= amount
        );
        if (!canAfford) {
          return { valid: false, reason: 'Recursos insuficientes para construir' };
        }
        break;
    }
    
    return { valid: true, reason: '' };
  }

  // ==================== NEGOCIAÇÃO ====================
  
  async handleNegotiationPhase(gameState, uiManager) {
    console.log(`🤖 ${this.personality.name} processando fase de negociação`);
    
    const player = gameState.players[this.playerId];
    const pending = getPendingNegotiationsForPlayer(this.playerId);
    
    if (pending.length > 0) {
      console.log(`🤖 Tem ${pending.length} proposta(s) pendente(s)`);
      
      for (const negotiation of pending) {
        const shouldAccept = this.evaluateNegotiationProposal(negotiation, gameState);
        
        if (shouldAccept) {
          console.log('🤖 Aceitando proposta');
          this.acceptNegotiation(negotiation);
        } else {
          console.log('🤖 Recusando proposta');
          this.rejectNegotiation(negotiation);
        }
        
        await this.delay(1000);
      }
    }
    
    if (gameState.actionsLeft > 0 && player.resources.ouro >= 1) {
      console.log('🤖 Preparando para enviar proposta');
      await this.sendNegotiationProposal(gameState);
    }
    
    if (gameState.actionsLeft === 0 || player.resources.ouro < 1) {
      console.log('🤖 Terminando fase de negociação');
      return 'end_turn';
    }
    
    return 'continue';
  }

async handlePendingNegotiations(pendingNegotiations, gameState) {
    console.log(`🤖 ${this.personality.name} analisando ${pendingNegotiations.length} propostas pendentes`);
    
    if (!pendingNegotiations || pendingNegotiations.length === 0) {
        console.log('🤖 Nenhuma proposta pendente para processar');
        return;
    }
    
    // ENCONTRAR ID DO JOGADOR ATUAL (IA) CORRETAMENTE
    const myPlayer = gameState.players[this.playerId];
    if (!myPlayer) {
        console.error(`🤖 Jogador IA com ID ${this.playerId} não encontrado`);
        return;
    }
    
    const myPlayerId = Number(myPlayer.id);
    console.log(`🤖 IA ID: ${myPlayerId} (nome: ${myPlayer.name})`);
    
    // Filtrar apenas propostas DESTINADAS a esta IA
    const relevantNegotiations = pendingNegotiations.filter(negotiation => {
        // Verificar se a negociação está pendente
        if (negotiation.status !== 'pending') return false;
        
        // Converter IDs para número para comparação consistente
        const negotiationTargetId = Number(negotiation.targetId);
        return negotiationTargetId === myPlayerId;
    });
    
    console.log(`🤖 ${relevantNegotiations.length} proposta(s) relevantes para ${this.personality.name}`);
    
    if (relevantNegotiations.length === 0) {
        console.log('🤖 Nenhuma proposta destinada a este jogador');
        return;
    }
    
    // Processar cada proposta com delay
    for (const negotiation of relevantNegotiations) {
        try {
            console.log(`🤖 Processando proposta ${negotiation.id} de ${gameState.players[negotiation.initiatorId]?.name}`);
            
            // Pequeno delay para simular pensamento
            await this.delay(this.settings.reactionDelay);
            
            const shouldAccept = this.evaluateNegotiationProposal(negotiation, gameState);
            
            if (shouldAccept) {
                console.log(`🤖 ${this.personality.name} ACEITANDO proposta`);
                await this.acceptNegotiation(negotiation);
            } else {
                console.log(`🤖 ${this.personality.name} RECUSANDO proposta`);
                await this.rejectNegotiation(negotiation);
            }
            
            // Registrar no histórico
            this.memory.negotiationHistory.push({
                turn: gameState.turn,
                partner: negotiation.initiatorId,
                accepted: shouldAccept,
                proposal: negotiation
            });
            
        } catch (error) {
            console.error(`🤖 Erro ao processar proposta ${negotiation.id}:`, error);
        }
    }
}

evaluateNegotiationProposal(negotiation, gameState) {
    // VALIDAÇÃO CRÍTICA: Verificar se a proposta é para esta IA
    if (!negotiation || !gameState) {
        console.log('🤖 Proposta ou estado inválido');
        return false;
    }
    
    // Converter IDs para Number para comparação segura
    const negotiationTargetId = Number(negotiation.targetId);
    const myPlayerId = Number(this.playerId);
    
    console.log(`🤖 Verificando proposta: Destino=${negotiationTargetId}, Eu=${myPlayerId}`);
    
    // VERIFICAÇÃO ESSENCIAL: A proposta é para mim?
    if (negotiationTargetId !== myPlayerId) {
        console.log(`🤖 Esta proposta não é para mim (${myPlayerId}). Destino: ${negotiationTargetId}`);
        return false;
    }
    
    const myPlayer = gameState.players[myPlayerId];
    const theirPlayer = gameState.players[negotiation.initiatorId];
    
    if (!myPlayer || !theirPlayer) {
        console.log('🤖 Jogador não encontrado');
        return false;
    }
    
    // Verificar se a proposta ainda está pendente
    if (negotiation.status !== 'pending') {
        console.log(`🤖 Proposta já processada (status: ${negotiation.status})`);
        return false;
    }
    
    console.log(`🤖 ${this.personality.name} avaliando proposta de ${theirPlayer.name}`);
    
    switch (this.personality.type) {
        case 'economist':
            return this.evaluateAsEconomist(negotiation, myPlayer, theirPlayer);
        case 'expansionist':
            return this.evaluateAsExpansionist(negotiation, myPlayer, theirPlayer);
        case 'builder':
            return this.evaluateAsBuilder(negotiation, myPlayer, theirPlayer);
        case 'diplomat':
            return this.evaluateAsDiplomat(negotiation, myPlayer, theirPlayer);
        default:
            return this.evaluateAsEconomist(negotiation, myPlayer, theirPlayer);
    }
}
  
  evaluateAsEconomist(negotiation, myPlayer, theirPlayer) {
    let offerValue = 0;
    let requestValue = 0;
    
    ['madeira', 'pedra', 'ouro', 'agua'].forEach(resource => {
      if (negotiation.offer[resource]) {
        const weight = resource === 'ouro' ? 3 : resource === 'pedra' ? 2 : 1;
        offerValue += negotiation.offer[resource] * weight;
      }
    });
    
    ['madeira', 'pedra', 'ouro', 'agua'].forEach(resource => {
      if (negotiation.request[resource]) {
        const weight = resource === 'ouro' ? 3 : resource === 'pedra' ? 2 : 1;
        requestValue += negotiation.request[resource] * weight;
      }
    });
    
    console.log(`💰 Avaliação economista: Oferta=${offerValue}, Solicitação=${requestValue}`);
    return offerValue >= requestValue;
  }
  
  evaluateAsExpansionist(negotiation, myPlayer, theirPlayer) {
    let offerValue = 0;
    
    if (negotiation.offer.regions && negotiation.offer.regions.length > 0) {
      offerValue += negotiation.offer.regions.length * 10;
      console.log(`🗺️ Expansionista valoriza ${negotiation.offer.regions.length} região(ões) oferecida(s)`);
    }
    
    if (negotiation.request.regions && negotiation.request.regions.length > 0) {
      offerValue -= negotiation.request.regions.length * 15;
      console.log(`🗺️ Expansionista penaliza ${negotiation.request.regions.length} região(ões) solicitada(s)`);
    }
    
    const resourceValue = this.evaluateResourceValue(negotiation);
    const totalValue = offerValue + resourceValue;
    console.log(`🗺️ Avaliação expansionista: Valor total=${totalValue}`);
    
    return totalValue > 0;
  }
  
  evaluateAsBuilder(negotiation, myPlayer, theirPlayer) {
    let offerValue = 0;
    
    if (negotiation.offer.pedra && negotiation.offer.pedra > 0) {
      offerValue += negotiation.offer.pedra * 3;
      console.log(`🏗️ Construtor valoriza pedra: +${negotiation.offer.pedra * 3}`);
    }
    
    if (negotiation.offer.madeira && negotiation.offer.madeira > 0) {
      offerValue += negotiation.offer.madeira * 2;
      console.log(`🏗️ Construtor valoriza madeira: +${negotiation.offer.madeira * 2}`);
    }
    
    if (negotiation.request.pedra && negotiation.request.pedra > 0) {
      offerValue -= negotiation.request.pedra * 4;
      console.log(`🏗️ Construtor penaliza pedra solicitada: -${negotiation.request.pedra * 4}`);
    }
    
    console.log(`🏗️ Avaliação construtor: Valor=${offerValue}`);
    return offerValue > 0;
  }
  
  evaluateAsDiplomat(negotiation, myPlayer, theirPlayer) {
    const randomFactor = Math.random();
    let acceptanceChance = 0.6;
    
    const resourceValue = this.evaluateResourceValue(negotiation);
    if (resourceValue >= 0) {
      acceptanceChance += 0.2;
    }
    
    if (theirPlayer.victoryPoints < myPlayer.victoryPoints) {
      acceptanceChance += 0.1;
    }
    
    console.log(`🤝 Diplomata: chance de aceitar=${acceptanceChance.toFixed(2)}`);
    return randomFactor < acceptanceChance;
  }
  
  evaluateResourceValue(negotiation) {
    let offerValue = 0;
    let requestValue = 0;
    
    ['madeira', 'pedra', 'ouro', 'agua'].forEach(resource => {
      if (negotiation.offer[resource]) {
        const weight = resource === 'ouro' ? 3 : resource === 'pedra' ? 2 : 1;
        offerValue += negotiation.offer[resource] * weight;
      }
    });
    
    ['madeira', 'pedra', 'ouro', 'agua'].forEach(resource => {
      if (negotiation.request[resource]) {
        const weight = resource === 'ouro' ? 3 : resource === 'pedra' ? 2 : 1;
        requestValue += negotiation.request[resource] * weight;
      }
    });
    
    return offerValue - requestValue;
  }


  // MÉTODO para processar propostas
async processPendingNegotiations(gameState) {
    console.log(`🤖 ${this.personality.name} verificando propostas pendentes`);
    
    const myPlayer = gameState.players[this.playerId];
    if (!myPlayer) {
        console.error(`🤖 Jogador IA ${this.playerId} não encontrado`);
        return;
    }
    
    // Obter propostas PENDENTES para este jogador
    const pendingNegotiations = getPendingNegotiationsForPlayer(this.playerId);
    
    console.log(`🤖 ${myPlayer.name} encontrou ${pendingNegotiations.length} proposta(s) pendente(s)`);
    
    if (pendingNegotiations.length === 0) {
        return;
    }
    
    // Processar cada proposta
    for (const negotiation of pendingNegotiations) {
        try {
            const initiator = gameState.players[negotiation.initiatorId];
            const initiatorName = initiator ? initiator.name : 'Desconhecido';
            console.log(`🤖 ${myPlayer.name} avaliando proposta de ${initiatorName}`);
            
            // Pequeno delay para simular pensamento
            await this.delay(this.settings.reactionDelay);
            
            // VERIFICAR SE A PROPOSTA É VÁLIDA
            if (negotiation.status !== 'pending') {
                console.log(`🤖 Proposta ${negotiation.id} já processada (status: ${negotiation.status})`);
                continue;
            }
            
            // AVALIAR proposta
            const shouldAccept = this.evaluateNegotiationProposal(negotiation, gameState);
            
            console.log(`🤖 ${myPlayer.name} decidiu: ${shouldAccept ? 'ACEITAR' : 'RECUSAR'}`);
            
            // Responder
            if (shouldAccept) {
                await this.acceptNegotiation(negotiation);
            } else {
                await this.rejectNegotiation(negotiation);
            }
            
            // Registrar no histórico
            this.memory.negotiationHistory.push({
                turn: gameState.turn,
                partner: negotiation.initiatorId,
                accepted: shouldAccept,
                timestamp: Date.now()
            });
            
            // Pequeno delay entre propostas
            await this.delay(800);
            
        } catch (error) {
            console.error(`🤖 Erro ao processar proposta ${negotiation.id}:`, error);
        }
    }
    
    console.log(`🤖 ${myPlayer.name} finalizou processamento de propostas`);
}
  
// ADICIONAR método auxiliar para criar e enviar proposta
async createAndSendProposal(gameState) {
    try {
        const myPlayer = gameState.players[this.playerId];
        
        // Verificar condições básicas
        if (!myPlayer || myPlayer.resources.ouro < 1 || gameState.actionsLeft <= 0) {
            return false;
        }
        
        // Encontrar alvo
        const target = this.findNegotiationTarget(gameState);
        if (!target) {
            console.log(`🤖 ${myPlayer.name} não encontrou alvo para negociação`);
            return false;
        }
        
        console.log(`🤖 ${myPlayer.name} enviando proposta para ${target.name}`);
        
        // Criar proposta usando método existente
        const proposal = this.createNegotiationProposal(myPlayer, target, gameState);
        if (!proposal) {
            console.log(`🤖 ${myPlayer.name} não conseguiu criar proposta`);
            return false;
        }
        
        // Configurar estado de negociação
        resetNegotiationState();
        setNegotiationTarget(target.id);
        
        // Configurar oferta
        Object.keys(proposal.offer).forEach(resource => {
            if (resource !== 'regions' && proposal.offer[resource] > 0) {
                updateNegotiationResource('offer', resource, proposal.offer[resource]);
            }
        });
        
        // Configurar solicitação
        Object.keys(proposal.request).forEach(resource => {
            if (resource !== 'regions' && proposal.request[resource] > 0) {
                updateNegotiationResource('request', resource, proposal.request[resource]);
            }
        });
        
        // Configurar regiões (se houver)
        if (proposal.offer.regions && proposal.offer.regions.length > 0) {
            updateNegotiationRegions('offerRegions', proposal.offer.regions);
        }
        
        if (proposal.request.regions && proposal.request.regions.length > 0) {
            updateNegotiationRegions('requestRegions', proposal.request.regions);
        }
        
        // Validar
        if (!validateNegotiationState()) {
            console.log(`🤖 Proposta inválida de ${myPlayer.name}`);
            return false;
        }
        
        // Enviar via gameLogic
        if (window.gameLogic?.handleSendNegotiation) {
            return await window.gameLogic.handleSendNegotiation();
        }
        
        return false;
        
    } catch (error) {
        console.error(`🤖 Erro em createAndSendProposal:`, error);
        return false;
    }
}
  
  async sendNegotiationProposal(gameState) {
    console.log(`🤖 ${this.personality.name} preparando proposta de negociação`);
    
    const myPlayer = gameState.players[this.playerId];
    
    if (!myPlayer) {
      console.log(`🤖 Jogador não encontrado`);
      return false;
    }
    
    if (myPlayer.resources.ouro < 1) {
      console.log(`🤖 Sem ouro para negociar (${myPlayer.resources.ouro} ouro)`);
      return false;
    }
    
    const target = this.findNegotiationTarget(gameState);
    if (!target) {
      console.log(`🤖 Nenhum alvo encontrado para negociação`);
      return false;
    }
    
    console.log(`🤖 Alvo selecionado: ${target.name}`);
    
    const proposal = this.createNegotiationProposal(myPlayer, target, gameState);
    
    if (!proposal) {
      console.log(`🤖 Não foi possível criar proposta`);
      return false;
    }
    
    console.log(`🤖 Proposta criada:`, proposal);
    
    resetNegotiationState();
    setNegotiationTarget(target.id);
    
    Object.keys(proposal.offer).forEach(resource => {
      if (proposal.offer[resource] > 0) {
        updateNegotiationResource('offer', resource, proposal.offer[resource]);
      }
    });
    
    Object.keys(proposal.request).forEach(resource => {
      if (proposal.request[resource] > 0) {
        updateNegotiationResource('request', resource, proposal.request[resource]);
      }
    });
    
    if (!validateNegotiationState()) {
      console.log(`🤖 Proposta inválida`);
      const errors = getNegotiationValidationErrors();
      console.log(`Erros:`, errors);
      resetNegotiationState();
      return false;
    }
    
    console.log(`🤖 Proposta validada, enviando...`);
    
    try {
      if (window.gameLogic?.handleSendNegotiation) {
        const success = await window.gameLogic.handleSendNegotiation();
        console.log(`🤖 Proposta enviada: ${success ? 'SUCESSO' : 'FALHA'}`);
        return success;
      }
    } catch (error) {
      console.error(`🤖 Erro ao enviar proposta:`, error);
      return false;
    }
    
    return false;
  }
  
  findNegotiationTarget(gameState) {
    const myPlayer = gameState.players[this.playerId];
    const otherPlayers = gameState.players.filter(p => 
      p.id !== this.playerId && 
      p.resources.ouro >= 1
    );
    
    if (otherPlayers.length === 0) {
      return null;
    }
    
    otherPlayers.sort((a, b) => a.victoryPoints - b.victoryPoints);
    return otherPlayers[0];
  }
  
createNegotiationProposal(myPlayer, targetPlayer, gameState) {
    console.log(`🤖 ${this.personality.name} criando proposta para ${targetPlayer.name}`);
    
    const proposal = {
        offer: { madeira: 0, pedra: 0, ouro: 0, agua: 0, regions: [] },
        request: { madeira: 0, pedra: 0, ouro: 0, agua: 0, regions: [] }
    };
    
    // Analisar necessidades e recursos
    const myNeeds = this.calculateResourceNeeds(myPlayer);
    const theirResources = targetPlayer.resources;
    const myResources = myPlayer.resources;
    
    // Estratégia baseada na personalidade
    switch (this.personality.type) {
        case 'economist':
            // Oferecer recursos que tenho em excesso, pedir recursos que preciso
            if (myResources.madeira > 15 && theirResources.ouro > 5) {
                proposal.offer.madeira = Math.min(5, Math.floor(myResources.madeira * 0.2));
                proposal.request.ouro = Math.min(2, Math.floor(theirResources.ouro * 0.3));
            } else if (myResources.pedra > 10 && theirResources.agua > 6) {
                proposal.offer.pedra = Math.min(3, Math.floor(myResources.pedra * 0.2));
                proposal.request.agua = Math.min(3, Math.floor(theirResources.agua * 0.3));
            } else {
                // Proposta padrão equilibrada
                proposal.offer.madeira = Math.min(3, Math.floor(myResources.madeira * 0.15));
                proposal.request.pedra = Math.min(2, Math.floor(theirResources.pedra * 0.2));
            }
            break;
            
        case 'expansionist':
            // Oferecer recursos por território
            if (myPlayer.regions.length > targetPlayer.regions.length) {
                // Tenho mais regiões, posso oferecer uma
                if (myPlayer.regions.length > 6 && targetPlayer.regions.length < 5) {
                    const regionToOffer = myPlayer.regions[0]; // Primeira região
                    proposal.offer.regions = [regionToOffer];
                    proposal.request.ouro = 3;
                }
            } else {
                // Pedir recursos para expansão
                proposal.offer.ouro = Math.min(2, Math.floor(myResources.ouro * 0.3));
                proposal.request.pedra = Math.min(3, Math.floor(theirResources.pedra * 0.25));
            }
            break;
            
        case 'builder':
            // Trocar madeira por pedra
            if (myResources.madeira > 12 && theirResources.pedra > 8) {
                proposal.offer.madeira = Math.min(4, Math.floor(myResources.madeira * 0.2));
                proposal.request.pedra = Math.min(2, Math.floor(theirResources.pedra * 0.2));
            } else if (myResources.ouro > 4 && theirResources.madeira > 10) {
                proposal.offer.ouro = Math.min(1, Math.floor(myResources.ouro * 0.25));
                proposal.request.madeira = Math.min(3, Math.floor(theirResources.madeira * 0.2));
            }
            break;
            
        case 'diplomat':
            // Proposta balanceada para construir relações
            const resources = ['madeira', 'pedra', 'ouro', 'agua'];
            const myExcess = resources.filter(r => myResources[r] > 10);
            const theirExcess = resources.filter(r => theirResources[r] > 10);
            
            if (myExcess.length > 0 && theirExcess.length > 0) {
                const offerRes = myExcess[0];
                const requestRes = theirExcess[0];
                
                if (offerRes !== requestRes) {
                    proposal.offer[offerRes] = Math.min(3, Math.floor(myResources[offerRes] * 0.15));
                    proposal.request[requestRes] = Math.min(3, Math.floor(theirResources[requestRes] * 0.15));
                }
            } else {
                // Troca simples
                proposal.offer.madeira = 2;
                proposal.request.agua = 2;
            }
            break;
            
        default:
            // Proposta padrão
            proposal.offer.madeira = Math.min(2, Math.floor(myResources.madeira * 0.1));
            proposal.request.agua = Math.min(2, Math.floor(theirResources.agua * 0.1));
    }
    
    // Garantir que não está oferecendo mais do que tem
    Object.keys(proposal.offer).forEach(resource => {
        if (resource !== 'regions') {
            proposal.offer[resource] = Math.min(
                proposal.offer[resource], 
                myResources[resource] || 0
            );
        }
    });
    
    // Garantir que não está pedindo mais do que o alvo tem
    Object.keys(proposal.request).forEach(resource => {
        if (resource !== 'regions') {
            proposal.request[resource] = Math.min(
                proposal.request[resource], 
                theirResources[resource] || 0
            );
        }
    });
    
    // Verificar se a proposta tem conteúdo
    const hasOffer = Object.values(proposal.offer).some(v => v > 0) || 
                    (proposal.offer.regions && proposal.offer.regions.length > 0);
    const hasRequest = Object.values(proposal.request).some(v => v > 0) || 
                      (proposal.request.regions && proposal.request.regions.length > 0);
    
    if (!hasOffer && !hasRequest) {
        console.log(`🤖 Proposta vazia, cancelando`);
        return null;
    }
    
    console.log(`🤖 Proposta criada:`, proposal);
    return proposal;
}
  
  async acceptNegotiation(negotiation) {
  return new Promise((resolve) => {
    setActiveNegotiation(negotiation);
    
    setTimeout(() => {
      if (window.gameLogic?.handleNegResponse) {
        window.gameLogic.handleNegResponse(true);
      }
      resolve();
    }, 500);
  });
}
  
  async rejectNegotiation(negotiation) {
  return new Promise((resolve) => {
    setActiveNegotiation(negotiation);
    
    setTimeout(() => {
      if (window.gameLogic?.handleNegResponse) {
        window.gameLogic.handleNegResponse(false);
      }
      resolve();
    }, 500);
  });
}
  
  getResourceWeight(resource) {
    const weights = {
      'ouro': 3.0,
      'pedra': 2.0,
      'madeira': 1.5,
      'agua': 1.0
    };
    return weights[resource] || 1.0;
  }
  
  calculateRegionValue(regionIds, gameState) {
    let totalValue = 0;
    
    regionIds.forEach(regionId => {
      const region = gameState.regions[regionId];
      if (region) {
        const biomeValue = this.getBiomeValue(region.biome);
        const resourceValue = Object.values(region.resources).reduce((a, b) => a + b, 0) * 0.5;
        const explorationValue = region.explorationLevel * 2;
        const structureValue = region.structures.length * 3;
        
        totalValue += biomeValue + resourceValue + explorationValue + structureValue;
      }
    });
    
    return totalValue / Math.max(1, regionIds.length);
  }
  
  getBiomeValue(biome) {
    const values = {
      'Savana': 4,
      'Pântano': 3,
      'Floresta Tropical': 2,
      'Floresta Temperada': 2
    };
    return values[biome] || 1;
  }
  
  evaluateEconomicTrade(offerValue, requestValue) {
    const profitMargin = (offerValue - requestValue) / requestValue;
    
    if (profitMargin > 0.5) return 1.2;
    if (profitMargin > 0) return 1.0;
    if (profitMargin > -0.2) return 0.8;
    return 0.5;
  }

  // ==================== UTILITÁRIOS ====================
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  clearFeedbackHistory() {
    if (window.gameLogic) {
      window.gameLogic.feedbackHistory = [];
      window.gameLogic.lastFeedback = null;
    }
  }
  
  getDebugInfo() {
    return {
      playerId: this.playerId,
      difficulty: this.difficulty,
      personality: this.personality.type,
      phase: this.phase,
      memory: {
        lastActions: this.memory.lastActions.length,
        negotiationHistory: this.memory.negotiationHistory.length
      },
      currentPlan: this.currentPlan ? {
        actionCount: this.currentPlan.actions.length,
        goals: this.currentPlan.turnGoals
      } : null
    };
  }
}

// ==================== FÁBRICA DE IA ====================

class AIFactory {
  static createAI(playerId, difficulty = 'medium') {
    return new AIBrain(playerId, difficulty);
  }
  
  static createAIPlayers(count, startIndex = 0) {
    const difficulties = ['easy', 'medium', 'hard', 'master'];
    const aiPlayers = [];
    
    for (let i = 0; i < count; i++) {
      const difficulty = difficulties[Math.min(i, difficulties.length - 1)];
      aiPlayers.push(this.createAI(startIndex + i, difficulty));
    }
    
    return aiPlayers;
  }
}

export { AIBrain, AIFactory, AI_DIFFICULTY_SETTINGS, AI_PERSONALITIES };
