// ai-strategy-service.js - Serviço de Estratégias para IA
import { GAME_CONFIG } from '../state/game-config.js';

export class AIStrategyService {
  constructor(aiBrain) {
    this.aiBrain = aiBrain;
    this.strategyHistory = [];
    this.adaptationLevel = 0;
  }

  // ==================== ANÁLISE ESTRATÉGICA ====================

  analyzeGameState(gameState) {
    const player = gameState.players[this.aiBrain.playerId];
    
    return {
      playerStatus: this._analyzePlayerStatus(player, gameState),
      threatAssessment: this._assessThreats(player, gameState),
      resourceAnalysis: this._analyzeResources(player, gameState),
      positionalAdvantage: this._calculatePositionalAdvantage(player, gameState),
      winConditions: this._identifyWinConditions(player, gameState)
    };
  }

  _analyzePlayerStatus(player, gameState) {
    const regions = player.regions.map(id => gameState.regions[id]).filter(r => r);
    
    return {
      victoryPoints: player.victoryPoints,
      regionCount: regions.length,
      avgExploration: regions.reduce((sum, r) => sum + r.explorationLevel, 0) / Math.max(1, regions.length),
      structureCount: regions.reduce((sum, r) => sum + r.structures.length, 0),
      controlledBiomes: [...new Set(regions.map(r => r.biome))],
      resourceBalance: { ...player.resources },
      productionCapacity: this._calculateProductionCapacity(regions)
    };
  }

  _assessThreats(player, gameState) {
    const threats = [];
    const myScore = player.victoryPoints;
    
    gameState.players.forEach((p, idx) => {
      if (idx === this.aiBrain.playerId) return;
      
      const threatScore = this._calculateThreatScore(player, p, gameState);
      
      if (threatScore > 0) {
        threats.push({
          playerId: idx,
          name: p.name,
          threatScore,
          isLeading: p.victoryPoints > myScore + 3,
          borderPressure: this._calculateBorderPressure(player.regions, p.regions, gameState),
          resourceAdvantage: this._compareResources(p.resources, player.resources)
        });
      }
    });
    
    return threats.sort((a, b) => b.threatScore - a.threatScore);
  }

  _analyzeResources(player, gameState) {
    const targets = this.aiBrain.personality.resourceTargets || {};
    const analysis = {};
    
    Object.keys(targets).forEach(resource => {
      const target = targets[resource];
      const current = player.resources[resource] || 0;
      const deficit = Math.max(0, target - current);
      const urgency = deficit / target;
      
      analysis[resource] = {
        current,
        target,
        deficit,
        urgency,
        priority: urgency * this._getResourcePriority(resource)
      };
    });
    
    return analysis;
  }

  _calculatePositionalAdvantage(player, gameState) {
    if (player.regions.length === 0) return 0;
    
    const gridSize = GAME_CONFIG.GRID_SIZE;
    let advantage = 0;
    
    // Centro de massa das regiões
    let totalRow = 0, totalCol = 0;
    player.regions.forEach(regionId => {
      totalRow += Math.floor(regionId / gridSize);
      totalCol += regionId % gridSize;
    });
    
    const centerRow = totalRow / player.regions.length;
    const centerCol = totalCol / player.regions.length;
    
    // Distância do centro do mapa (estar no centro é vantajoso)
    const mapCenter = (gridSize - 1) / 2;
    const distanceFromCenter = Math.abs(centerRow - mapCenter) + Math.abs(centerCol - mapCenter);
    advantage += (gridSize - distanceFromCenter) * 0.5;
    
    // Agrupamento das regiões (estar agrupado é defensivamente vantajoso)
    const clusterScore = this._calculateClusterScore(player.regions, gridSize);
    advantage += clusterScore * 0.3;
    
    return advantage;
  }

  _identifyWinConditions(player, gameState) {
    const conditions = [];
    const totalPlayers = gameState.players.length;
    const myPosition = this._getPlayerPosition(player, gameState);
    
    // Condição: Pontos de Vitória
    if (player.victoryPoints >= GAME_CONFIG.VICTORY_POINTS * 0.7) {
      conditions.push({
        type: 'victory_points',
        progress: player.victoryPoints / GAME_CONFIG.VICTORY_POINTS,
        priority: 1.0
      });
    }
    
    // Condição: Domínio Territorial
    const totalRegions = gameState.regions.length;
    const regionShare = player.regions.length / totalRegions;
    if (regionShare > 0.3) {
      conditions.push({
        type: 'territorial_dominance',
        progress: regionShare,
        priority: 0.8
      });
    }
    
    // Condição: Supremacia Econômica
    const totalResources = Object.values(player.resources).reduce((a, b) => a + b, 0);
    const avgResources = gameState.players.reduce((sum, p) => 
      sum + Object.values(p.resources).reduce((a, b) => a + b, 0), 0) / totalPlayers;
    
    if (totalResources > avgResources * 1.5) {
      conditions.push({
        type: 'economic_supremacy',
        progress: totalResources / (avgResources * 2),
        priority: 0.7
      });
    }
    
    // Condição por Personalidade
    conditions.push(...this._getPersonalityWinConditions(player, gameState));
    
    return conditions.sort((a, b) => b.priority - a.priority);
  }

  // ==================== PLANEJAMENTO ESTRATÉGICO ====================

  generateStrategicPlan(analysis, gameState) {
    const player = gameState.players[this.aiBrain.playerId];
    const plan = {
      primaryGoal: this._determinePrimaryGoal(analysis),
      secondaryGoals: [],
      immediateActions: [],
      longTermStrategy: '',
      riskAssessment: this._assessRisk(player, analysis, gameState)
    };
    
    // Definir metas secundárias
    plan.secondaryGoals = this._determineSecondaryGoals(analysis);
    
    // Definir ações imediatas
    plan.immediateActions = this._determineImmediateActions(analysis, gameState);
    
    // Definir estratégia de longo prazo
    plan.longTermStrategy = this._determineLongTermStrategy(analysis);
    
    this.strategyHistory.push({
      turn: gameState.turn,
      plan,
      analysis,
      timestamp: Date.now()
    });
    
    return plan;
  }

  _determinePrimaryGoal(analysis) {
    // Escolher objetivo baseado na personalidade e situação
    const winConditions = analysis.winConditions;
    if (winConditions.length > 0 && winConditions[0].progress > 0.5) {
      return `Focar em ${winConditions[0].type.replace('_', ' ')}`;
    }
    
    const threats = analysis.threatAssessment;
    if (threats.length > 0 && threats[0].threatScore > 0.7) {
      return `Neutralizar ameaça de ${threats[0].name}`;
    }
    
    // Objetivo padrão por personalidade
    switch (this.aiBrain.personality.type) {
      case 'expansionist':
        return 'Expandir território';
      case 'builder':
        return 'Desenvolver infraestrutura';
      case 'economist':
        return 'Acumular recursos';
      case 'diplomat':
        return 'Fortalecer relações';
      default:
        return 'Consolidar posição';
    }
  }

  _determineSecondaryGoals(analysis) {
    const goals = [];
    
    // Baseado em deficiências de recursos
    const resourceAnalysis = analysis.resourceAnalysis;
    Object.entries(resourceAnalysis).forEach(([resource, data]) => {
      if (data.urgency > 0.5) {
        goals.push(`Obter mais ${resource}`);
      }
    });
    
    // Baseado em ameaças
    const threats = analysis.threatAssessment;
    if (threats.length > 0) {
      goals.push(`Monitorar ${threats[0].name}`);
    }
    
    // Limitar a 3 metas secundárias
    return goals.slice(0, 3);
  }

  _determineImmediateActions(analysis, gameState) {
    const actions = [];
    const player = gameState.players[this.aiBrain.playerId];
    
    // 1. Se recursos críticos estão baixos
    const resourceAnalysis = analysis.resourceAnalysis;
    const criticalResources = Object.entries(resourceAnalysis)
      .filter(([_, data]) => data.urgency > 0.7)
      .map(([resource]) => resource);
    
    if (criticalResources.length > 0) {
      actions.push(`Priorizar obtenção de ${criticalResources[0]}`);
    }
    
    // 2. Se está sob ameaça
    const threats = analysis.threatAssessment;
    if (threats.length > 0 && threats[0].threatScore > 0.8) {
      actions.push('Reforçar defesas');
    }
    
    // 3. Se tem oportunidade de expansão
    if (player.regions.length < 4) {
      actions.push('Expandir para regiões neutras');
    }
    
    // 4. Se está perto da vitória
    if (player.victoryPoints >= GAME_CONFIG.VICTORY_POINTS * 0.8) {
      actions.push('Proteger pontos de vitória');
    }
    
    return actions;
  }

  _determineLongTermStrategy(analysis) {
    const personality = this.aiBrain.personality.type;
    
    const strategies = {
      expansionist: 'Conquistar territórios chave e isolar oponentes',
      builder: 'Desenvolver uma rede de estruturas sinérgicas',
      economist: 'Estabelecer monopólio em recursos valiosos',
      diplomat: 'Formar alianças e controlar o comércio'
    };
    
    return strategies[personality] || 'Adaptar-se às condições do jogo';
  }

  // ==================== ADAPTAÇÃO E APRENDIZADO ====================

  adaptStrategy(previousResults, gameState) {
    if (!this.aiBrain.settings.adaptiveLearning) return;
    
    // Aumentar nível de adaptação
    this.adaptationLevel = Math.min(1.0, this.adaptationLevel + 0.05);
    
    // Analisar resultados anteriores
    const lastStrategy = this.strategyHistory[this.strategyHistory.length - 1];
    if (!lastStrategy) return;
    
    // Ajustar com base no sucesso
    const successRate = this._calculateSuccessRate();
    
    if (successRate < 0.3) {
      // Estratégia não está funcionando, mudar abordagem
      this._changeApproach();
    }
    
    // Aprender com oponentes bem-sucedidos
    this._learnFromOpponents(gameState);
  }

  _calculateSuccessRate() {
    const recent = this.strategyHistory.slice(-5);
    if (recent.length === 0) return 0.5;
    
    // Calcular taxa de sucesso baseada em resultados (simplificado)
    return recent.filter(s => s.plan.immediateActions.length > 0).length / recent.length;
  }

  _changeApproach() {
    console.log(`🤖 ${this.aiBrain.personality.name} mudando abordagem estratégica`);
    
    // Alternar entre focos
    const approaches = ['aggressive', 'defensive', 'economic', 'diplomatic'];
    const currentApproach = this._getCurrentApproach();
    const newApproach = approaches.find(a => a !== currentApproach) || 'balanced';
    
    this._applyStrategicAdjustment(newApproach);
  }

  _learnFromOpponents(gameState) {
    const player = gameState.players[this.aiBrain.playerId];
    
    // Encontrar jogador mais bem-sucedido
    let bestPlayer = null;
    let bestScore = -Infinity;
    
    gameState.players.forEach((p, idx) => {
      if (idx === this.aiBrain.playerId) return;
      
      const score = p.victoryPoints * 2 + p.regions.length * 0.5;
      if (score > bestScore) {
        bestScore = score;
        bestPlayer = p;
      }
    });
    
    if (bestPlayer) {
      // Analisar estratégia do oponente bem-sucedido
      this._analyzeSuccessfulStrategy(bestPlayer, gameState);
    }
  }

  // ==================== UTILITÁRIOS ====================

  _calculateProductionCapacity(regions) {
    let capacity = { madeira: 0, pedra: 0, ouro: 0, agua: 0 };
    
    regions.forEach(region => {
      const base = GAME_CONFIG.BIOME_INCOME?.[region.biome] || {};
      const explorationBonus = GAME_CONFIG.EXPLORATION_BONUS?.[region.explorationLevel] || 1;
      
      Object.keys(capacity).forEach(resource => {
        capacity[resource] += (base[resource] || 0) * explorationBonus;
      });
      
      region.structures?.forEach(structure => {
        const income = GAME_CONFIG.STRUCTURE_INCOME?.[structure] || {};
        Object.keys(capacity).forEach(resource => {
          capacity[resource] += income[resource] || 0;
        });
      });
    });
    
    return capacity;
  }

  _calculateThreatScore(myPlayer, otherPlayer, gameState) {
    let score = 0;
    
    // Diferença de PV
    score += (otherPlayer.victoryPoints - myPlayer.victoryPoints) * 0.5;
    
    // Diferença territorial
    const territoryDiff = otherPlayer.regions.length - myPlayer.regions.length;
    score += territoryDiff * 0.3;
    
    // Proximidade das regiões
    const borderPressure = this._calculateBorderPressure(myPlayer.regions, otherPlayer.regions, gameState);
    score += borderPressure * 0.2;
    
    return Math.max(0, score);
  }

  _calculateBorderPressure(myRegions, theirRegions, gameState) {
    const gridSize = GAME_CONFIG.GRID_SIZE;
    let pressure = 0;
    
    myRegions.forEach(myId => {
      theirRegions.forEach(theirId => {
        const distance = this._calculateRegionDistance(myId, theirId, gridSize);
        if (distance <= 2) {
          pressure += (3 - distance) * 0.5; // Quanto mais perto, mais pressão
        }
      });
    });
    
    return pressure;
  }

  _calculateRegionDistance(id1, id2, gridSize) {
    const row1 = Math.floor(id1 / gridSize);
    const col1 = id1 % gridSize;
    const row2 = Math.floor(id2 / gridSize);
    const col2 = id2 % gridSize;
    
    return Math.abs(row1 - row2) + Math.abs(col1 - col2);
  }

  _compareResources(resA, resB) {
    let advantage = 0;
    const resources = ['madeira', 'pedra', 'ouro', 'agua'];
    
    resources.forEach(res => {
      if ((resA[res] || 0) > (resB[res] || 0) * 1.5) {
        advantage += 0.25;
      }
    });
    
    return advantage;
  }

  _getResourcePriority(resource) {
    const priorities = {
      'ouro': 1.0,
      'pedra': 0.8,
      'madeira': 0.7,
      'agua': 0.6
    };
    
    return priorities[resource] || 0.5;
  }

  _calculateClusterScore(regionIds, gridSize) {
    if (regionIds.length <= 1) return 1.0;
    
    let totalDistance = 0;
    let comparisons = 0;
    
    for (let i = 0; i < regionIds.length; i++) {
      for (let j = i + 1; j < regionIds.length; j++) {
        totalDistance += this._calculateRegionDistance(regionIds[i], regionIds[j], gridSize);
        comparisons++;
      }
    }
    
    const avgDistance = totalDistance / Math.max(1, comparisons);
    const maxDistance = gridSize * 2; // Distância máxima possível
    
    // Quanto menor a distância média, maior o score de cluster
    return 1.0 - (avgDistance / maxDistance);
  }

  _getPlayerPosition(player, gameState) {
    const positions = gameState.players
      .map((p, idx) => ({ id: idx, score: p.victoryPoints }))
      .sort((a, b) => b.score - a.score);
    
    return positions.findIndex(p => p.id === this.aiBrain.playerId) + 1;
  }

  _getPersonalityWinConditions(player, gameState) {
    const conditions = [];
    
    switch (this.aiBrain.personality.type) {
      case 'expansionist':
        if (player.regions.length >= gameState.regions.length * 0.4) {
          conditions.push({
            type: 'territorial_control',
            progress: player.regions.length / (gameState.regions.length * 0.4),
            priority: 0.9
          });
        }
        break;
      case 'builder':
        const totalStructures = player.regions.reduce((sum, id) => 
          sum + gameState.regions[id].structures.length, 0
        );
        if (totalStructures >= 8) {
          conditions.push({
            type: 'infrastructure',
            progress: totalStructures / 8,
            priority: 0.9
          });
        }
        break;
    }
    
    return conditions;
  }

  _assessRisk(player, analysis, gameState) {
    let risk = 0;
    
    // Risco de ataque
    const threats = analysis.threatAssessment;
    if (threats.length > 0) {
      risk += threats[0].threatScore * 0.3;
    }
    
    // Risco de recursos
    const resourceAnalysis = analysis.resourceAnalysis;
    const criticalResources = Object.values(resourceAnalysis).filter(r => r.urgency > 0.8);
    risk += criticalResources.length * 0.2;
    
    // Risco posicional
    if (analysis.positionalAdvantage < 0.3) {
      risk += 0.2;
    }
    
    return Math.min(1.0, risk);
  }

  _getCurrentApproach() {
    const lastPlan = this.strategyHistory[this.strategyHistory.length - 1];
    if (!lastPlan) return 'balanced';
    
    const { primaryGoal } = lastPlan.plan;
    
    if (primaryGoal.includes('neutralizar') || primaryGoal.includes('atacar')) {
      return 'aggressive';
    } else if (primaryGoal.includes('proteger') || primaryGoal.includes('defesa')) {
      return 'defensive';
    } else if (primaryGoal.includes('recursos') || primaryGoal.includes('econ')) {
      return 'economic';
    } else if (primaryGoal.includes('relações') || primaryGoal.includes('diplom')) {
      return 'diplomatic';
    }
    
    return 'balanced';
  }

  _applyStrategicAdjustment(approach) {
    console.log(`🤖 Aplicando abordagem ${approach}`);
    
    // Ajustar pesos de decisão baseado na abordagem
    // (implementação específica depende do sistema de decisão)
  }

  _analyzeSuccessfulStrategy(successfulPlayer, gameState) {
    // Analisar padrões do jogador bem-sucedido
    console.log(`🤖 Analisando estratégia de ${successfulPlayer.name}`);
    
    // Poderia extrair padrões como:
    // - Proporção de construções vs expansão
    // - Foco em certos biomas
    // - Padrões de negociação
  }

  // ==================== ESTATÍSTICAS ====================

  getStrategyStatistics() {
    return {
      totalPlans: this.strategyHistory.length,
      adaptationLevel: this.adaptationLevel,
      recentPlans: this.strategyHistory.slice(-3).map(p => ({
        turn: p.turn,
        primaryGoal: p.plan.primaryGoal
      })),
      successRate: this._calculateSuccessRate()
    };
  }
}