// game-logic.js - VERSÃO COMPLETA E CORRIGIDA
import { 
  gameState, 
  achievementsState, 
  setAchievementsState,
  addActivityLog,
  initializePlayerAchievements,
  checkAchievements,
  updateMaxResources
} from './game-state.js';
import { 
  GAME_CONFIG, 
  RESOURCE_ICONS, 
  BIOME_INCOME, 
  STRUCTURE_INCOME, 
  EXPLORATION_BONUS,
  TURN_PHASES,
  ACHIEVEMENTS_CONFIG,
  STRUCTURE_COSTS,
  STRUCTURE_EFFECTS,
  STRUCTURE_LIMITS
} from './game-config.js';

class GameLogic {
  constructor() {
    this.currentPhase = TURN_PHASES.RENDA;
    gameState.currentPhase = this.currentPhase; // Sincronizar
    this.GAME_EVENTS = this.initializeGameEvents();
  }

  initializeGameEvents() {
    return [
      {
        id: 1,
        name: 'Primavera Abundante',
        icon: '🌺',
        description: 'Florestas florescem com vida nova',
        effect: 'Produção de Madeira +100%',
        duration: 2,
        type: 'positive',
        apply: (state) => {
          state.eventModifiers.madeiraMultiplier = 2.0;
        },
        remove: (state) => {
          state.eventModifiers.madeiraMultiplier = 1.0;
        }
      },
      {
        id: 2,
        name: 'Seca',
        icon: '🌵',
        description: 'Escassez de água afeta todas as regiões',
        effect: 'Produção de Água -50%',
        duration: 2,
        type: 'negative',
        apply: (state) => {
          state.eventModifiers.aguaMultiplier = 0.5;
        },
        remove: (state) => {
          state.eventModifiers.aguaMultiplier = 1.0;
        }
      },
      {
        id: 3,
        name: 'Descoberta de Jazida',
        icon: '💎',
        description: 'Enorme depósito de pedra é descoberto',
        effect: '+2 Pedra para todos, mas -1 PV',
        duration: 0,
        type: 'mixed',
        apply: (state) => {
          state.players.forEach(p => {
            p.resources.pedra += 2;
            p.victoryPoints = Math.max(0, p.victoryPoints - 1);
          });
        }
      },
      {
        id: 4,
        name: 'Tempestade',
        icon: '⛈️',
        description: 'Tempestade violenta atinge Gaia',
        effect: 'Produção de todos recursos -25%',
        duration: 1,
        type: 'negative',
        apply: (state) => {
          state.eventModifiers.madeiraMultiplier = 0.75;
          state.eventModifiers.pedraMultiplier = 0.75;
          state.eventModifiers.ouroMultiplier = 0.75;
          state.eventModifiers.aguaMultiplier = 0.75;
        },
        remove: (state) => {
          state.eventModifiers.madeiraMultiplier = 1.0;
          state.eventModifiers.pedraMultiplier = 1.0;
          state.eventModifiers.ouroMultiplier = 1.0;
          state.eventModifiers.aguaMultiplier = 1.0;
        }
      },
      {
        id: 5,
        name: 'Mercado Aquecido',
        icon: '📈',
        description: 'Demanda por ouro atinge pico histórico',
        effect: 'Negociar não custa Ouro',
        duration: 1,
        type: 'positive',
        apply: (state) => {
          state.eventModifiers.negociacaoGratis = true;
        },
        remove: (state) => {
          state.eventModifiers.negociacaoGratis = false;
        }
      },
      {
        id: 6,
        name: 'Boom Tecnológico',
        icon: '⚙️',
        description: 'Avanços tecnológicos revolucionam construções',
        effect: 'Construir dá +1 PV e +1 Ouro extra',
        duration: 2,
        type: 'mixed',
        apply: (state) => {
          state.eventModifiers.construirBonus = 1;
          state.eventModifiers.construirOuroExtra = 1;
        },
        remove: (state) => {
          state.eventModifiers.construirBonus = 0;
          state.eventModifiers.construirOuroExtra = 0;
        }
      },
      {
        id: 7,
        name: 'Inflação',
        icon: '💰',
        description: 'Custos de construção disparam',
        effect: 'Construir custa +1 de cada recurso',
        duration: 2,
        type: 'negative',
        apply: (state) => {
          state.eventModifiers.construirCustoExtra = true;
        },
        remove: (state) => {
          state.eventModifiers.construirCustoExtra = false;
        }
      },
      {
        id: 8,
        name: 'Tempestade de Areia',
        icon: '🌪️',
        description: 'Ventos fortes afetam produção',
        effect: '+50% Pedra, -50% Madeira',
        duration: 1,
        type: 'mixed',
        apply: (state) => {
          state.eventModifiers.pedraMultiplier = 1.5;
          state.eventModifiers.madeiraMultiplier = 0.5;
        },
        remove: (state) => {
          state.eventModifiers.pedraMultiplier = 1.0;
          state.eventModifiers.madeiraMultiplier = 1.0;
        }
      },
      {
        id: 9,
        name: 'Festival Cultural',
        icon: '🎉',
        description: 'Celebrações unem as facções',
        effect: 'Todos ganham +1 PV',
        duration: 0,
        type: 'positive',
        apply: (state) => {
          state.players.forEach(p => {
            p.victoryPoints += 1;
          });
        }
      },
      {
        id: 10,
        name: 'Enchente',
        icon: '🌊',
        description: 'Chuvas torrenciais inundam regiões',
        effect: '+100% Água, -50% Madeira',
        duration: 1,
        type: 'mixed',
        apply: (state) => {
          state.eventModifiers.aguaMultiplier = 2.0;
          state.eventModifiers.madeiraMultiplier = 0.5;
        },
        remove: (state) => {
          state.eventModifiers.aguaMultiplier = 1.0;
          state.eventModifiers.madeiraMultiplier = 1.0;
        }
      },
      {
        id: 11,
        name: 'Inverno Rigoroso',
        icon: '❄️',
        description: 'Frio extremo afeta produção',
        effect: '-30% Madeira e Água',
        duration: 2,
        type: 'negative',
        apply: (state) => {
          state.eventModifiers.madeiraMultiplier = 0.7;
          state.eventModifiers.aguaMultiplier = 0.7;
        },
        remove: (state) => {
          state.eventModifiers.madeiraMultiplier = 1.0;
          state.eventModifiers.aguaMultiplier = 1.0;
        }
      },
      {
        id: 12,
        name: 'Era da Exploração',
        icon: '🧭',
        description: 'Novas técnicas de exploração são desenvolvidas',
        effect: 'Explorar custa -1 Madeira',
        duration: 2,
        type: 'positive',
        apply: (state) => {
          state.eventModifiers.explorarDesconto = true;
        },
        remove: (state) => {
          state.eventModifiers.explorarDesconto = false;
        }
      },
      {
        id: 13,
        name: 'Paz Diplomática',
        icon: '🕊️',
        description: 'Tratados de paz facilitam negociações',
        effect: 'Negociar dá +2 PV extra',
        duration: 1,
        type: 'mixed',
        apply: (state) => {
          state.eventModifiers.negociacaoPvExtra = 2;
        },
        remove: (state) => {
          state.eventModifiers.negociacaoPvExtra = 0;
        }
      },
      {
        id: 14,
        name: 'Escassez',
        icon: '🆘',
        description: 'Recursos naturais estão escassos',
        effect: 'Recolher dá -25% recursos',
        duration: 2,
        type: 'negative',
        apply: (state) => {
          state.eventModifiers.recolherPenalidade = 0.75;
        },
        remove: (state) => {
          state.eventModifiers.recolherPenalidade = 1.0;
        }
      },
      {
        id: 15,
        name: 'Depressão Econômica',
        icon: '📉',
        description: 'Crise econômica afeta todas as facções',
        effect: '-1 de todos os recursos por turno',
        duration: 1,
        type: 'mixed',
        apply: (state) => {
          state.players.forEach(p => {
            p.resources.madeira = Math.max(0, p.resources.madeira - 1);
            p.resources.pedra = Math.max(0, p.resources.pedra - 1);
            p.resources.ouro = Math.max(0, p.resources.ouro - 1);
            p.resources.agua = Math.max(0, p.resources.agua - 1);
          });
        }
      }
    ];
  }

  // Inicialização do jogo
  initializeGame() {
    this.setupRegions();
    this.distributeInitialRegions();
    
    // Inicializar conquistas para cada jogador
    gameState.players.forEach((player, index) => {
      initializePlayerAchievements(index);
      
      // Contar biomas iniciais
      const playerStats = achievementsState.playerAchievements[index];
      player.regions.forEach(regionId => {
        const region = gameState.regions[regionId];
        playerStats.controlledBiomes.add(region.biome);
      });
    });
    
    gameState.gameStarted = true;
    gameState.turn = 1;
    gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
    gameState.currentPhase = TURN_PHASES.RENDA;
    
    this.applyPlayerIncome(gameState.players[gameState.currentPlayerIndex]);
    
    window.uiManager.updateUI();
    window.uiManager.updateEventBanner();
  }

  setupRegions() {
    gameState.regions = [];
    const total = GAME_CONFIG.GRID_SIZE * GAME_CONFIG.GRID_SIZE;
    
    for (let i = 0; i < total; i++) {
      const biome = GAME_CONFIG.BIOMES[Math.floor(Math.random() * GAME_CONFIG.BIOMES.length)];
      const resources = this.generateResourcesForBiome(biome);
      
      gameState.regions.push({
        id: i,
        name: GAME_CONFIG.REGION_NAMES[i],
        biome,
        explorationLevel: Math.floor(Math.random() * 2),
        resources,
        controller: null,
        structures: []
      });
    }
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
    const indices = [...Array(total).keys()].sort(() => Math.random() - 0.5);
    let idx = 0;
    
    // Limpar regiões dos jogadores
    gameState.players.forEach(p => p.regions = []);
    
    // Distribuir 4 regiões para cada jogador
    for (let p = 0; p < gameState.players.length; p++) {
      for (let r = 0; r < 4 && idx < indices.length; r++) {
        const regionId = indices[idx++];
        gameState.regions[regionId].controller = p;
        gameState.players[p].regions.push(regionId);
      }
    }
  }

  // Sistema de renda
  calculatePlayerIncome(player) {
  let income = { madeira: 0, pedra: 0, ouro: 0, agua: 0 };
  let pvIncome = 0;
  
  player.regions.forEach(regionId => {
    const region = gameState.regions[regionId];
    
    // Renda base do bioma (valores inteiros)
    const biomeIncome = BIOME_INCOME[region.biome] || {};
    Object.keys(biomeIncome).forEach(resource => {
      income[resource] += biomeIncome[resource];
    });
    
    // Bônus de exploração (soma inteira, não multiplicação)
    const explorationBonus = EXPLORATION_BONUS[region.explorationLevel] || 0;
    if (explorationBonus > 0) {
      Object.keys(income).forEach(resource => {
        income[resource] += explorationBonus;
      });
    }
    
    // Renda das estruturas (valores inteiros)
    region.structures.forEach(structure => {
      if (STRUCTURE_INCOME[structure]) {
        Object.keys(STRUCTURE_INCOME[structure]).forEach(resource => {
          if (resource === 'pv') {
            pvIncome += STRUCTURE_INCOME[structure][resource];
          } else {
            income[resource] += STRUCTURE_INCOME[structure][resource];
          }
        });
      }
    });
  });
  
  // Aplicar modificadores de eventos (arredondando para inteiros)
  if (gameState.eventModifiers.madeiraMultiplier) {
    income.madeira = Math.round(income.madeira * gameState.eventModifiers.madeiraMultiplier);
  }
  if (gameState.eventModifiers.aguaMultiplier) {
    income.agua = Math.round(income.agua * gameState.eventModifiers.aguaMultiplier);
  }
  if (gameState.eventModifiers.pedraMultiplier) {
    income.pedra = Math.round(income.pedra * gameState.eventModifiers.pedraMultiplier);
  }
  if (gameState.eventModifiers.ouroMultiplier) {
    income.ouro = Math.round(income.ouro * gameState.eventModifiers.ouroMultiplier);
  }
  
  // Garantir que não há decimais
  Object.keys(income).forEach(resource => {
    income[resource] = Math.max(0, Math.round(income[resource]));
  });
  
  return { resources: income, pv: Math.round(pvIncome) };
}

  applyPlayerIncome(player) {
  const { resources, pv } = this.calculatePlayerIncome(player);
  
  // Adicionar recursos (agora inteiros)
  Object.keys(resources).forEach(resource => {
    player.resources[resource] += Math.round(resources[resource]);
  });
  
  // Adicionar PV por turno das estruturas
  if (pv > 0) {
    player.victoryPoints += Math.round(pv);
  }
  
  // Atualizar recursos máximos para conquista Magnata
  updateMaxResources(player.id);
  
  // Verificar conquistas baseadas em recursos
  const newAchievements = checkAchievements(player.id);
  if (newAchievements.length > 0) {
    newAchievements.forEach(achievementName => {
      window.utils.showFeedback(`🎉 Conquista Desbloqueada: ${achievementName}!`, 'success');
      
      addActivityLog({
        type: 'achievement',
        playerName: player.name,
        action: 'desbloqueou conquista',
        details: achievementName,
        isEvent: false,
        isMine: true
      });
    });
  }
  
  // Retornar os valores para feedback
  return { resources, pv };
}

  // Sistema de ações
  canAffordAction(actionType) {
    const player = gameState.players[gameState.currentPlayerIndex];
    let cost = { ...GAME_CONFIG.ACTION_DETAILS[actionType]?.cost } || {};
    
    // Aplicar modificadores de evento
    if (actionType === 'negociar' && gameState.eventModifiers.negociacaoGratis) {
      cost.ouro = 0;
    }
    
    if (actionType === 'construir') {
      if (gameState.eventModifiers.construirCustoExtra) {
        cost.madeira = (cost.madeira || 0) + 1;
        cost.pedra = (cost.pedra || 0) + 1;
      }
      if (gameState.eventModifiers.construirCustoOuroExtra) {
        cost.ouro = (cost.ouro || 0) + 1;
      }
    }
    
    if (actionType === 'explorar' && gameState.eventModifiers.explorarDesconto) {
      cost.madeira = Math.max(0, (cost.madeira || 0) - 1);
    }
    
    return Object.entries(cost).every(([resource, amount]) => {
      return (player.resources[resource] || 0) >= amount;
    });
  }

  checkPhaseRestriction(actionType) {
    if (gameState.currentPhase !== TURN_PHASES.ACOES) {
      const phaseNames = {
        [TURN_PHASES.RENDA]: 'Renda (recursos automáticos)',
        [TURN_PHASES.ACOES]: 'Ações',
        [TURN_PHASES.NEGOCIACAO]: 'Negociação'
      };
      
      window.utils.showFeedback(
        `Ação "${actionType}" só pode ser realizada na fase de Ações. Fase atual: ${phaseNames[gameState.currentPhase]}`,
        'warning'
      );
      return false;
    }
    return true;
  }

  consumeAction() {
    if (gameState.actionsLeft <= 0) {
      window.utils.showFeedback('Sem ações restantes neste turno.', 'warning');
      return false;
    }
    
    gameState.actionsLeft--;
    window.uiManager.updateFooter();
    return true;
  }

  handleExplore() {
    if (!this.checkPhaseRestriction('Explorar/Assumir Domínio')) return;
    
    if (gameState.selectedRegionId === null) {
      window.utils.showFeedback('Selecione uma região primeiro.', 'error');
      return;
    }
    
    const region = gameState.regions[gameState.selectedRegionId];
    const player = gameState.players[gameState.currentPlayerIndex];
    
    if (region.controller === null) {
      this.handleAssumeDomain(region, player);
    } else if (region.controller === player.id) {
      this.handleExploreOwnRegion(region, player);
    } else {
      window.utils.showFeedback('Você não pode explorar regiões de outros jogadores.', 'error');
    }
  }

  handleAssumeDomain(region, player) {
    const cost = region.resources;
    const pvCost = 2;
    
    if (player.victoryPoints < pvCost) {
      window.utils.showFeedback(`Você precisa de ${pvCost} PV para assumir domínio desta região.`, 'error');
      return;
    }
    
    const canPay = Object.entries(cost).every(([key, value]) => player.resources[key] >= value);
    if (!canPay) {
      const needed = Object.entries(cost).map(([k, v]) => `${k}: ${v}`).join(', ');
      window.utils.showFeedback(`Recursos insuficientes. Necessário: ${needed}`, 'error');
      return;
    }
    
    if (!this.consumeAction()) return;
    
    player.victoryPoints -= pvCost;
    Object.entries(cost).forEach(([key, value]) => {
      player.resources[key] -= value;
    });
    
    region.controller = player.id;
    player.regions.push(region.id);
    
    // Atualizar biomas controlados
    const playerStats = achievementsState.playerAchievements[player.id];
    if (playerStats) {
      playerStats.controlledBiomes.add(region.biome);
      checkAchievements(player.id);
    }
    
    window.utils.showFeedback(`${region.name} agora está sob seu controle! -${pvCost} PV`, 'success');
    addActivityLog({
      type: 'explore',
      playerName: player.name,
      action: 'assumiu domínio de',
      details: region.name,
      isEvent: false,
      isMine: true
    });
    
    this.clearRegionSelection();
    this.checkVictory();
    window.uiManager.updateUI();
  }

  handleExploreOwnRegion(region, player) {
    if (!this.checkPhaseRestriction('Explorar')) return;
    
    const cost = GAME_CONFIG.ACTION_DETAILS.explorar.cost;
    
    if (!this.canAffordAction('explorar')) {
      window.utils.showFeedback('Recursos insuficientes para explorar.', 'error');
      return;
    }
    
    if (!this.consumeAction()) return;
    
    Object.entries(cost).forEach(([key, value]) => {
      player.resources[key] -= value;
    });
    
    region.explorationLevel = Math.min(3, region.explorationLevel + 1);
    player.victoryPoints += 1;
    
    if (Math.random() < 0.10) {
      player.resources.ouro += 1;
      window.utils.showFeedback('Descoberta Rara! +1 Ouro', 'success');
      addActivityLog({
        type: 'explore',
        playerName: player.name,
        action: 'explorou (Descoberta Rara!)',
        details: region.name,
        isEvent: false,
        isMine: true
      });
    } else {
      window.utils.showFeedback(`${region.name} explorada. Nível: ${region.explorationLevel}⭐`, 'success');
      addActivityLog({
        type: 'explore',
        playerName: player.name,
        action: `explorou (Nível ${region.explorationLevel})`,
        details: region.name,
        isEvent: false,
        isMine: true
      });
    }
    
    achievementsState.totalExplored++;
    setAchievementsState(achievementsState);
    
    const playerId = player.id;
    const playerStats = achievementsState.playerAchievements[playerId];
    if (playerStats) {
      playerStats.explored++;
    }
    
    const newAchievements = checkAchievements(playerId);
    if (newAchievements.length > 0) {
      newAchievements.forEach(achievementName => {
        window.utils.showFeedback(`🎉 Conquista Desbloqueada: ${achievementName}!`, 'success');
        
        addActivityLog({
          type: 'achievement',
          playerName: player.name,
          action: 'desbloqueou conquista',
          details: achievementName,
          isEvent: false,
          isMine: true
        });
      });
    }
    
    this.clearRegionSelection();
    this.checkVictory();
    window.uiManager.updateUI();
  }

  handleCollect() {
    if (!this.checkPhaseRestriction('Recolher')) return;
    
    if (gameState.selectedRegionId === null) {
      window.utils.showFeedback('Selecione uma região para recolher.', 'error');
      return;
    }
    
    if (!this.consumeAction()) {
      window.utils.showFeedback('Sem ações restantes neste turno.', 'warning');
      return;
    }
    
    const region = gameState.regions[gameState.selectedRegionId];
    const player = gameState.players[gameState.currentPlayerIndex];
    
    if (region.controller !== player.id) {
      window.utils.showFeedback('Você não controla essa região.', 'error');
      return;
    }
    
    if (region.explorationLevel === 0) {
      window.utils.showFeedback('Você deve explorar a região antes de recolher.', 'warning');
      return;
    }
    
    const cost = GAME_CONFIG.ACTION_DETAILS.recolher.cost;
    Object.entries(cost).forEach(([key, value]) => {
      player.resources[key] -= value;
    });
    
    let harvestPercent = 0.5;
    
    if (gameState.eventModifiers.recolherPenalidade) {
      harvestPercent *= gameState.eventModifiers.recolherPenalidade;
    }
    
    if (region.explorationLevel >= 1) {
      const resourceTypes = Object.keys(region.resources).filter(k => region.resources[k] > 0);
      if (resourceTypes.length > 0) {
        const randomRes = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
        player.resources[randomRes] += 1;
        window.utils.showFeedback(`Bônus de exploração: +1 ${randomRes}!`, 'info');
      }
    }
    
    if (region.explorationLevel === 3) {
      harvestPercent = 0.75;
      window.utils.showFeedback('Recolha potencializada! +50% recursos.', 'info');
    }
    
    Object.keys(region.resources).forEach(key => {
      const amount = Math.max(0, Math.floor(region.resources[key] * harvestPercent));
      player.resources[key] += amount;
      region.resources[key] = Math.max(0, region.resources[key] - amount);
    });
    
    player.victoryPoints += 1;
    window.utils.showFeedback(`Recursos recolhidos de ${region.name}. +1 PV`, 'success');
    
    const playerId = player.id;
    const playerStats = achievementsState.playerAchievements[playerId];
    if (playerStats) {
      playerStats.collected++;
    }
    
    const newAchievements = checkAchievements(playerId);
    if (newAchievements.length > 0) {
      newAchievements.forEach(achievementName => {
        window.utils.showFeedback(`🎉 Conquista Desbloqueada: ${achievementName}!`, 'success');
        
        addActivityLog({
          type: 'achievement',
          playerName: player.name,
          action: 'desbloqueou conquista',
          details: achievementName,
          isEvent: false,
          isMine: true
        });
      });
    }
    
    addActivityLog({
      type: 'collect',
      playerName: player.name,
      action: 'recolheu recursos',
      details: region.name,
      isEvent: false,
      isMine: true
    });
    
    this.clearRegionSelection();
    this.checkVictory();
    window.uiManager.updateUI();
  }

  handleBuild() {
    if (!this.checkPhaseRestriction('Construir')) return;
    window.uiManager.openStructureModal();
  }

  handleBuildStructure(structureType) {
    if (gameState.selectedRegionId === null) {
      window.utils.showFeedback('Selecione uma região primeiro.', 'error');
      return;
    }
    
    if (!this.consumeAction()) return;
    
    const region = gameState.regions[gameState.selectedRegionId];
    const player = gameState.players[gameState.currentPlayerIndex];
    
    if (region.controller === null) {
      region.controller = player.id;
      player.regions.push(region.id);
      window.utils.showFeedback(`Assumiu controle de ${region.name}.`, 'info');
    } else if (region.controller !== player.id) {
      window.utils.showFeedback('Você não controla essa região.', 'error');
      return;
    }
    
    if (region.structures.includes(structureType)) {
      window.utils.showFeedback(`Esta região já tem uma ${structureType}.`, 'error');
      return;
    }
    
    const limit = STRUCTURE_LIMITS[structureType];
    const currentCount = region.structures.filter(s => s === structureType).length;
    if (currentCount >= limit) {
      window.utils.showFeedback(`Limite de ${structureType}s atingido nesta região.`, 'error');
      return;
    }
    
    let cost = { ...STRUCTURE_COSTS[structureType] };
    
    if (region.explorationLevel >= 2 && cost.pedra) {
      cost.pedra = Math.max(0, cost.pedra - 1);
      window.utils.showFeedback('Desconto de exploração: -1 Pedra!', 'info');
    }
    
    const canPay = Object.entries(cost).every(([key, value]) => player.resources[key] >= value);
    if (!canPay) {
      const needed = Object.entries(cost)
        .map(([k, v]) => `${v}${RESOURCE_ICONS[k] || k}`)
        .join(', ');
      window.utils.showFeedback(`Recursos insuficientes para ${structureType}. Necessário: ${needed}`, 'error');
      return;
    }
    
    Object.entries(cost).forEach(([key, value]) => {
      player.resources[key] -= value;
    });
    
    region.structures.push(structureType);
    
    let pvGain = STRUCTURE_EFFECTS[structureType]?.pv || 0;
    
    if (gameState.eventModifiers.construirBonus) {
      pvGain += gameState.eventModifiers.construirBonus;
    }
    
    player.victoryPoints += pvGain;
    
    let specialEffect = '';
    switch(structureType) {
      case 'Laboratório':
        specialEffect = 'Chance de descoberta rara aumentada em 15%';
        break;
      case 'Mercado':
        specialEffect = 'Negociações futuras custam 1 Ouro a menos';
        break;
      case 'Torre de Vigia':
        specialEffect = 'Defesa aumentada contra negociações hostis';
        break;
      case 'Santuário':
        specialEffect = 'Bônus de lealdade para regiões adjacentes';
        break;
    }
    
    window.utils.showFeedback(
      `Construído ${structureType} em ${region.name}. +${pvGain} PV. ${specialEffect}`,
      'success'
    );
    
    achievementsState.totalBuilt++;
    setAchievementsState(achievementsState);
    
    const playerId = player.id;
    const playerStats = achievementsState.playerAchievements[playerId];
    if (playerStats) {
      playerStats.built++;
    }
    
    const newAchievements = checkAchievements(playerId);
    if (newAchievements.length > 0) {
      newAchievements.forEach(achievementName => {
        window.utils.showFeedback(`🎉 Conquista Desbloqueada: ${achievementName}!`, 'success');
        addActivityLog({
          type: 'achievement',
          playerName: player.name,
          action: 'desbloqueou conquista',
          details: achievementName,
          isEvent: false,
          isMine: true
        });
      });
    }
    
    addActivityLog({
      type: 'build',
      playerName: player.name,
      action: `construiu ${structureType}`,
      details: region.name,
      isEvent: false,
      isMine: true
    });
    
    this.clearRegionSelection();
    this.checkVictory();
    window.uiManager.updateUI();
  }

  handleNegotiate() {
    if (!this.checkPhaseRestriction('Negociar')) return;
    if (!this.consumeAction()) return;
    document.getElementById('negotiationModal')?.classList.remove('hidden');
    window.uiManager.updateFooter();
  }

  async handleEndTurn() {
  const player = gameState.players[gameState.currentPlayerIndex];
  
  switch (gameState.currentPhase) { // Usar gameState.currentPhase diretamente
    case TURN_PHASES.RENDA:
      // Aplicar renda e obter valores
      const income = this.applyPlayerIncome(player);
      
      // Feedback da renda
      const incomeText = Object.entries(income.resources)
        .filter(([_, amount]) => amount > 0)
        .map(([resource, amount]) => `+${Math.round(amount)} ${resource}`)
        .join(', ');
      
      const feedbackMessages = [];
      if (incomeText) {
        feedbackMessages.push(`Recursos: ${incomeText}`);
      }
      if (income.pv > 0) {
        feedbackMessages.push(`+${Math.round(income.pv)} PV de estruturas`);
      }
      
      if (feedbackMessages.length > 0) {
        // Mostrar feedback e mudar fase após fechar
        await window.utils.showFeedbackWithCallback(
          'Renda Recebida',
          `${player.name} recebeu: ${feedbackMessages.join(' | ')}`,
          'success',
          () => {
            // Mudar para fase de ações após fechar o modal
            gameState.currentPhase = TURN_PHASES.ACOES;
            gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
            
            addActivityLog({
              type: 'phase',
              playerName: player.name,
              action: 'avançou para fase de Ações',
              details: '',
              isEvent: false,
              isMine: true
            });
            
            window.uiManager.updateUI();
            window.utils.showFeedback(`${player.name} agora está na fase de Ações. Você tem ${gameState.actionsLeft} ações.`, 'info');
          }
        );
      } else {
        // Se não houve renda, mudar direto
        gameState.currentPhase = TURN_PHASES.ACOES;
        gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
        window.uiManager.updateUI();
      }
      break;
      
    case TURN_PHASES.ACOES:
      if (gameState.actionsLeft > 0) {
        const confirm = await window.utils.showConfirm(
          'Ações Restantes',
          `Você ainda tem ${gameState.actionsLeft} ação(ões) não utilizada(s). Deseja realmente avançar?`
        );
        
        if (!confirm) return;
      }
      
      gameState.currentPhase = TURN_PHASES.NEGOCIACAO;
      
      addActivityLog({
        type: 'phase',
        playerName: player.name,
        action: 'avançou para fase de Negociação',
        details: '',
        isEvent: false,
        isMine: true
      });
      
      window.uiManager.updateUI();
      window.utils.showFeedback('Fase: Negociação. Você pode propor trocas com outros jogadores.', 'info');
      break;
      
    case TURN_PHASES.NEGOCIACAO:
      gameState.currentPhase = TURN_PHASES.RENDA;
      gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
      
      if (gameState.currentPlayerIndex === 0) {
        gameState.turn++;
        gameState.turnsUntilNextEvent--;
        achievementsState.fastestWin = Math.min(achievementsState.fastestWin, gameState.turn);
        
        if (gameState.turnsUntilNextEvent <= 0) {
          this.triggerRandomEvent();
          gameState.turnsUntilNextEvent = 4;
        }
      }
      
      gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
      gameState.selectedRegionId = null;
      this.clearRegionSelection();
      this.updateEventDuration();
      
      addActivityLog({
        type: 'turn',
        playerName: 'SISTEMA',
        action: `Turno ${gameState.turn} iniciado`,
        details: `Jogador atual: ${gameState.players[gameState.currentPlayerIndex]?.name}`,
        isEvent: false,
        isMine: false
      });
      
      window.uiManager.updateUI();
      window.utils.showFeedback(
        `Turno do ${gameState.players[gameState.currentPlayerIndex]?.name}. Fase: Renda`,
        'success'
      );
      break;
  }
}

  // Sistema de eventos
  triggerRandomEvent() {
    if (this.GAME_EVENTS.length === 0) return;
    
    const ev = this.GAME_EVENTS[Math.floor(Math.random() * this.GAME_EVENTS.length)];
    
    if (gameState.currentEvent && typeof gameState.currentEvent.remove === 'function') {
      gameState.currentEvent.remove(gameState);
    }
    
    gameState.currentEvent = ev;
    gameState.eventTurnsLeft = ev.duration;
    gameState.eventModifiers = {};
    
    if (typeof ev.apply === 'function') {
      ev.apply(gameState);
    }
    
    addActivityLog({
      type: 'event',
      playerName: 'GAIA',
      action: `disparou evento: ${ev.name}`,
      details: ev.description,
      isEvent: true,
      isMine: false
    });
    
    document.getElementById('eventModal')?.classList.remove('hidden');
    
    setTimeout(() => {
      window.uiManager.updateEventBanner();
    }, 100);
  }

  updateEventDuration() {
    if (gameState.currentEvent && gameState.eventTurnsLeft > 0) {
      gameState.eventTurnsLeft -= 1;
      
      if (gameState.eventTurnsLeft <= 0) {
        if (typeof gameState.currentEvent.remove === 'function') {
          gameState.currentEvent.remove(gameState);
        }
        gameState.currentEvent = null;
        gameState.eventModifiers = {};
        window.utils.showFeedback('O evento global terminou.', 'info');
      }
      
      window.uiManager.updateEventBanner();
    }
  }

  // Utilitários
  clearRegionSelection() {
    gameState.selectedRegionId = null;
    document.querySelectorAll('.board-cell').forEach(c => c.classList.remove('region-selected'));
  }

  checkVictory() {
    const winner = gameState.players.find(p => p.victoryPoints >= GAME_CONFIG.VICTORY_POINTS);
    if (winner) {
      window.utils.showFeedback(`${winner.name} venceu o jogo!`, 'success');
      
      document.getElementById('actionExplore')?.setAttribute('disabled', 'true');
      document.getElementById('actionCollect')?.setAttribute('disabled', 'true');
      document.getElementById('actionBuild')?.setAttribute('disabled', 'true');
      document.getElementById('actionNegotiate')?.setAttribute('disabled', 'true');
      document.getElementById('endTurnBtn')?.setAttribute('disabled', 'true');
      
      document.getElementById('victoryModal')?.classList.remove('hidden');
      document.getElementById('victoryModalTitle').textContent = 'Vitória!';
      document.getElementById('victoryModalMessage').textContent = 
        `Parabéns, ${winner.name}! Você venceu Gaia!`;
      
      achievementsState.wins++;
      setAchievementsState(achievementsState);
      
      addActivityLog({
        type: 'victory',
        playerName: winner.name,
        action: 'venceu o jogo!',
        details: `${winner.victoryPoints} PV`,
        isEvent: false,
        isMine: winner.id === gameState.currentPlayerIndex
      });
    }
  }

  updatePlayerBiomes(playerId) {
    const player = gameState.players[playerId];
    const playerStats = achievementsState.playerAchievements[playerId];
    
    if (!playerStats) return;
    
    playerStats.controlledBiomes.clear();
    
    player.regions.forEach(regionId => {
      const region = gameState.regions[regionId];
      playerStats.controlledBiomes.add(region.biome);
    });
    
    const newAchievements = checkAchievements(playerId);
    if (newAchievements.length > 0) {
      newAchievements.forEach(achievementName => {
        window.utils.showFeedback(`🎉 Conquista Desbloqueada: ${achievementName}!`, 'success');
        
        addActivityLog({
          type: 'achievement',
          playerName: player.name,
          action: 'desbloqueou conquista',
          details: achievementName,
          isEvent: false,
          isMine: true
        });
      });
    }
  }
}

export { GameLogic };
