// game-logic.js
import { 
  gameState, 
  achievementsState,
  setGameState,
  setAchievementsState,
  addActivityLog,
  updatePlayerResources,
  updatePlayerVictoryPoints,
  updateRegionController,
  updateRegionExploration,
  addStructureToRegion,
  clearRegionSelection,
  getCurrentPlayer,
  setCurrentPhase,
  updateCurrentPlayerIndex,
  resetActions
} from './game-state.js';

import { 
  GAME_CONFIG, 
  RESOURCE_ICONS,
  BIOME_INCOME,
  BIOME_INITIAL_RESOURCES,
  EXPLORATION_BONUS,
  EXPLORATION_SPECIAL_BONUS,
  STRUCTURE_COSTS,
  STRUCTURE_INCOME,
  STRUCTURE_EFFECTS,
  GAME_EVENTS,  // Importar do game-config.js
  ACHIEVEMENTS_CONFIG
} from './game-config.js';

class GameLogic {
  constructor() {
    this.GAME_EVENTS = GAME_EVENTS; // Usar a importação
  }

  // ==================== INICIALIZAÇÃO ====================

initializeGame() {
  this.setupRegions();
  this.distributeInitialRegions();
  
  // Inicializar estado do jogo
  gameState.gameStarted = true;
  gameState.turn = 1;
  gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
  
  // Começar na fase de renda
  gameState.currentPhase = 'renda';
  
  addActivityLog('system', 'SISTEMA', 'Jogo iniciado', '', gameState.turn);
  
  // Aplicar renda inicial (irá mostrar a modal)
  const currentPlayer = getCurrentPlayer();
  
  // Delay para garantir que a UI esteja completamente carregada
  setTimeout(() => {
    this.applyIncomeForPlayer(currentPlayer);
  }, 800);
}

// Adicione este novo método para avançar fases
advancePhase() {
  const phases = ['renda', 'acoes', 'negociacao'];
  const currentIndex = phases.indexOf(gameState.currentPhase);
  const nextIndex = (currentIndex + 1) % phases.length;
  
  gameState.currentPhase = phases[nextIndex];
  
  // Log da mudança de fase
  const phaseNames = {
    'renda': '💰 Renda',
    'acoes': '⚡ Ações',
    'negociacao': '🤝 Negociação'
  };
  
  addActivityLog('system', 'SISTEMA', 'Fase alterada', 
    `Nova fase: ${phaseNames[gameState.currentPhase]}`, gameState.turn);

  // Forçar atualização da UI
  setTimeout(() => {
    if (window.uiManager) {
      window.uiManager.updateUI();
      window.uiManager.updateFooter();
    }
  }, 100);
  
  return gameState.currentPhase;
}

// ==================== CONTROLE DE FASES ====================
isPhaseValidForAction(actionType) {
  const currentPhase = gameState.currentPhase;
  
  // Mapear quais ações são permitidas em cada fase
  const phaseActions = {
    'renda': [], // Nenhuma ação manual na fase de renda
    'acoes': ['explorar', 'recolher', 'construir'],
    'negociacao': ['negociar']
  };
  
  return phaseActions[currentPhase]?.includes(actionType) || false;
}

// Método auxiliar para verificar custos por ação
getActionCost(actionType) {
  const costs = {
    'explorar': { madeira: 2, agua: 1 },
    'recolher': { madeira: 1 },
    'construir': { madeira: 3, pedra: 2, ouro: 1 },
    'negociar': { ouro: 1 }
  };
  return costs[actionType] || {};
}

// Avaliação de recursos do jogador
applyIncomeForCurrentPlayer() {
  const currentPlayer = getCurrentPlayer();
  if (currentPlayer && gameState.currentPhase === 'renda') {
    this.applyIncomeForPlayer(currentPlayer);
  }
}

// Função que gerencia fases corretamente
async handleEndTurn() {
  const currentPlayer = getCurrentPlayer();
  
  // Verificar fase atual
  if (gameState.currentPhase === 'acoes') {
    // Avançar para negociação
    gameState.currentPhase = 'negociacao';
    addActivityLog('phase', 'SISTEMA', 'Fase alterada', 'Ações → Negociação', gameState.turn);
    
  } else if (gameState.currentPhase === 'negociacao') {
    // Finalizar turno e passar para próximo jogador
    const playerCount = gameState.players.length;
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % playerCount;
    
    // Se voltou ao primeiro jogador, incrementar turno
    if (gameState.currentPlayerIndex === 0) {
      gameState.turn += 1;
      this.handleTurnAdvanceForEvents();
    }
    
    // Resetar estado
    gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
    gameState.selectedRegionId = null;
    
    // Iniciar fase de renda para o novo jogador
    gameState.currentPhase = 'renda';
    
    // Atualizar sidebar para jogador atual
    gameState.selectedPlayerForSidebar = gameState.currentPlayerIndex;
    
    // Aplicar renda para novo jogador (irá mostrar a modal)
    const newPlayer = getCurrentPlayer();
    
    // Pequeno delay para garantir que a UI esteja atualizada
    setTimeout(() => {
      this.applyIncomeForPlayer(newPlayer);
    }, 100);
    
    // REMOVIDO: window.utils.showFeedback(`Agora é o turno de ${newPlayer.name}`, 'info');
    addActivityLog('turn', 'SISTEMA', 'Turno iniciado', 
      `Início do turno de ${newPlayer.name}`, gameState.turn);
    
    this.checkVictory();
  }
  
  // Atualizar UI
  setTimeout(() => {
    if (window.uiManager) {
      window.uiManager.updateUI();
      window.uiManager.updateFooter();
    }
  }, 50);
}

 // Configura as regiões no mapa
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
    
    gameState.players.forEach(p => p.regions = []);
    
    for (let p = 0; p < gameState.players.length; p++) {
      for (let r = 0; r < 4 && idx < indices.length; r++) {
        const regionId = indices[idx++];
        gameState.regions[regionId].controller = p;
        gameState.players[p].regions.push(regionId);
      }
    }
  }

  // ==================== SISTEMA DE AÇÕES ====================
  performAction(actionType = null) {
  // Verificar se está na fase correta para esta ação
  if (actionType && !this.isPhaseValidForAction(actionType)) {
    window.utils.showFeedback(`Ação "${actionType}" não permitida na fase atual.`, 'warning');
    return false;
  }
  
  if (gameState.actionsLeft <= 0) {
    window.utils.showFeedback('Sem ações restantes neste turno.', 'warning');
    return false;
  }
  
  // Atualizar UI imediatamente
  if (window.uiManager && window.uiManager.updateFooter) {
    setTimeout(() => window.uiManager.updateFooter(), 10);
  }

  gameState.actionsLeft--;
  return true;
}

  // ==================== EXPLORAR / ASSUMIR DOMÍNIO ====================
  async handleExplore() {
  // Verificar se está na fase correta
  if (!this.isPhaseValidForAction('explorar')) {
    window.utils.showFeedback('Ação não permitida nesta fase. Vá para fase de Ações.', 'warning');
    return;
  }
  
  if (gameState.selectedRegionId === null) {
    window.utils.showFeedback('Selecione uma região primeiro.', 'error');
    return;
  }
  
  const region = gameState.regions[gameState.selectedRegionId];
  const player = gameState.players[gameState.currentPlayerIndex];
  
  if (region.controller === null) {
    // ASSUMIR DOMÍNIO
    const cost = region.resources;
    const pvCost = 2;
    
    if (player.victoryPoints < pvCost) {
      window.utils.showFeedback(`Você precisa de ${pvCost} PV para assumir domínio desta região.`, 'error');
      return;
    }
    
    const canPay = Object.entries(cost).every(([k,v]) => player.resources[k] >= v);
    if (!canPay) {
      const needed = Object.entries(cost).map(([k,v]) => `${k}: ${v}`).join(', ');
      window.utils.showFeedback(`Recursos insuficientes. Necessário: ${needed}`, 'error');
      return;
    }
    
    const resourceList = Object.entries(cost).map(([k,v]) => `${RESOURCE_ICONS[k]}${v}`).join(' ');
    const ok = await window.utils.showConfirm(
      'Assumir Domínio', 
      `Custo: ${pvCost} PV + ${resourceList}\n\nDeseja assumir o controle de ${region.name}?`
    );
    
    if (!ok) return;
    if (!this.performAction('explorar')) return;
    
    player.victoryPoints -= pvCost;
    Object.entries(cost).forEach(([k,v]) => player.resources[k] -= v);
    
    region.controller = gameState.currentPlayerIndex;
    player.regions.push(gameState.selectedRegionId);
    
    window.utils.showFeedback(`${region.name} agora está sob seu controle! -${pvCost} PV`, 'success');
    addActivityLog('explore', player.name, 'assumiu domínio de', region.name, gameState.turn);
    
  } else if (region.controller === gameState.currentPlayerIndex) {
    // EXPLORAR (região própria)
    if (!this.canAffordAction('explorar')) {
      window.utils.showFeedback('Recursos insuficientes para explorar.', 'error');
      return;
    }
    
    if (!this.performAction('explorar')) return;
    
    // Pagar custo da ação
    const cost = GAME_CONFIG.ACTION_DETAILS.explorar.cost;
    Object.entries(cost).forEach(([k,v]) => player.resources[k] -= v);
    
    region.explorationLevel = Math.min(3, region.explorationLevel + 1);
    player.victoryPoints += 1;
    
    if (Math.random() < 0.10) { 
      player.resources.ouro += 1; 
      window.utils.showFeedback('Descoberta Rara! +1 Ouro', 'success'); 
    } else {
      window.utils.showFeedback(`${region.name} explorada. Nível: ${region.explorationLevel}⭐`, 'success');
    }
    
    achievementsState.totalExplored++;
    
    const desc = Math.random() < 0.10 ? 'explorou (Descoberta Rara!)' : `explorou (Nível ${region.explorationLevel})`;
    addActivityLog('explore', player.name, desc, region.name, gameState.turn);
    
  } else {
    window.utils.showFeedback('Você não pode explorar regiões de outros jogadores.', 'error');
    return;
  }
  
  this.clearRegionSelection();
  this.checkVictory();
  window.uiManager.refreshUIAfterStateChange();

// No final de cada método de ação (handleExplore, handleCollect, etc.), adicione:
if (window.uiManager && window.uiManager.updateFooter) {
  setTimeout(() => window.uiManager.updateFooter(), 100);
}
}

  // ==================== RECOLHER ====================
  handleCollect() {

    // Verificar se está na fase correta
    if (!this.isPhaseValidForAction('recolher')) {
      window.utils.showFeedback('Ação não permitida nesta fase. Vá para fase de Ações.', 'warning');
      return;
    }

    if (gameState.selectedRegionId === null) {
      window.utils.showFeedback('Selecione uma região para recolher.', 'error');
      return;
    }

    if (!this.performAction()) {
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

    // Custo da ação
    const cost = GAME_CONFIG.ACTION_DETAILS.recolher.cost;
    Object.entries(cost).forEach(([k,v]) => player.resources[k] -= v);

    // Lógica de recolha
    let harvestPercent = 0.5;

    // Bônus de exploração nível 1
    if (region.explorationLevel >= 1) {
      const resourceTypes = Object.keys(region.resources).filter(k => region.resources[k] > 0);
      if (resourceTypes.length > 0) {
        const randomRes = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
        player.resources[randomRes] += 1;
        window.utils.showFeedback(`Bônus de exploração: +1 ${randomRes}!`, 'info');
      }
    }

    // Bônus de exploração nível 3
    if (region.explorationLevel === 3) {
      harvestPercent = 0.75;
      window.utils.showFeedback('Recolha potencializada! +50% recursos.', 'info');
    }

    // Bônus de evento: Festival da Colheita
    if (gameState.eventModifiers.festivalBonus) {
      const resourceTypes = ['madeira', 'pedra', 'ouro', 'agua'];
      const bonus1 = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
      const bonus2 = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
      player.resources[bonus1] += 2;
      player.resources[bonus2] += 2;
      window.utils.showFeedback(`Festival! +2 ${bonus1} e +2 ${bonus2}!`, 'success');
    }

    // Bônus de evento: Inverno Rigoroso
    if (gameState.eventModifiers.coletaBonus) {
      Object.keys(gameState.eventModifiers.coletaBonus).forEach(res => {
        player.resources[res] += gameState.eventModifiers.coletaBonus[res];
      });
      window.utils.showFeedback('Inverno rigoroso torna a coleta mais valiosa!', 'info');
    }

    // Coleta normal
    Object.keys(region.resources).forEach(k => {
      const amount = Math.max(0, Math.floor(region.resources[k] * harvestPercent));
      player.resources[k] += amount;
      region.resources[k] = Math.max(0, region.resources[k] - amount);
    });

    player.victoryPoints += 1;
    window.utils.showFeedback(`Recursos recolhidos de ${region.name}. +1 PV`, 'success');
    
    addActivityLog('collect', player.name, 'recolheu recursos', region.name, gameState.turn);

    this.clearRegionSelection();
    this.checkVictory();
    window.uiManager.refreshUIAfterStateChange();

// No final de cada método de ação (handleExplore, handleCollect, etc.), adicione:
if (window.uiManager && window.uiManager.updateFooter) {
  setTimeout(() => window.uiManager.updateFooter(), 100);
}
  }

  // ==================== CONSTRUIR ====================

handleBuild(structureType = 'Abrigo') {

  // Verificar se está na fase correta
  if (!this.isPhaseValidForAction('construir')) {
    window.utils.showFeedback('Ação não permitida nesta fase. Vá para fase de Ações.', 'warning');
    return;
  }

  if (gameState.selectedRegionId === null) {
    window.utils.showFeedback('Selecione uma região para construir.', 'error');
    return;
  }
  
  const region = gameState.regions[gameState.selectedRegionId];
  const player = gameState.players[gameState.currentPlayerIndex];
  
  // Verificar se o jogador controla a região
  if (region.controller !== player.id) {
    window.utils.showFeedback('Você só pode construir em regiões que controla.', 'error');
    return;
  }
  
  // Obter custo da estrutura
  const cost = STRUCTURE_COSTS[structureType];
  if (!cost) {
    window.utils.showFeedback('Estrutura não encontrada.', 'error');
    return;
  }
  
  // Verificar se já existe essa estrutura na região
  if (region.structures.includes(structureType)) {
    window.utils.showFeedback(`Esta região já possui um ${structureType}.`, 'error');
    return;
  }
  
  // Verificar se o jogador pode pagar
  const canPay = Object.entries(cost).every(([k,v]) => player.resources[k] >= v);
  if (!canPay) {
    window.utils.showFeedback('Recursos insuficientes para construir.', 'error');
    return;
  }
  
  if (!this.performAction()) return;
  
  // Pagar custo
  Object.entries(cost).forEach(([k,v]) => { 
    player.resources[k] -= v; 
  });

  // Adicionar estrutura à região
  region.structures.push(structureType);
  
  // Obter benefícios da estrutura
  const effect = STRUCTURE_EFFECTS[structureType] || {};
  const income = STRUCTURE_INCOME[structureType] || {};
  
  // Aplicar benefícios imediatos (PV)
  let pvGain = effect.pv || 0;
  
  // Bônus de evento (Boom Tecnológico)
  if (gameState.eventModifiers.construirBonus) {
    pvGain += gameState.eventModifiers.construirBonus;
  }
  
  player.victoryPoints += pvGain;
  
  window.utils.showFeedback(`Construído ${structureType} em ${region.name}. +${pvGain} PV.`, 'success');

  // Atualizar conquistas
  achievementsState.totalBuilt++;
  
  addActivityLog('build', player.name, `construiu ${structureType}`, region.name, gameState.turn);
  
  this.clearRegionSelection();
  this.checkVictory();
  window.uiManager.refreshUIAfterStateChange();

// No final de cada método de ação (handleExplore, handleCollect, etc.), adicione:
if (window.uiManager && window.uiManager.updateFooter) {
  setTimeout(() => window.uiManager.updateFooter(), 100);
}
}

  // ==================== NEGOCIAR ====================
  handleNegotiate() {

    // Verificar se está na fase correta
    if (!this.isPhaseValidForAction('negociar')) {
      window.utils.showFeedback('Negociação só é permitida na fase de Negociação.', 'warning');
      return;
    }

    if (!this.performAction()) return;
    // A UI será tratada pelo ui-manager.js
    // O custo de 1 Ouro é deduzido no envio da negociação
  }

  // ==================== SISTEMA DE TURNOS ====================
  async handleEndTurn() {
  const currentPlayer = getCurrentPlayer();
  
  // Se estiver na fase de ações, avance para negociação
  if (gameState.currentPhase === 'acoes') {
    this.advancePhase();
    window.utils.showFeedback(`${currentPlayer.name} entrou na fase de negociação`, 'info');
    addActivityLog('phase', 'SISTEMA', 'Fase alterada', 'Ações → Negociação', gameState.turn);
    return;
  }
  
  // Se estiver na fase de negociação, termine o turno
  if (gameState.currentPhase === 'negociacao') {
    // Registrar término do turno
    addActivityLog('turn', 'SISTEMA', 'Turno finalizado', 
      `${currentPlayer.name} completou o turno`, gameState.turn);
    
    // Avançar jogador
    const playerCount = gameState.players.length;
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % playerCount;
    
    // Se voltou ao primeiro jogador, incrementa o turno
    if (gameState.currentPlayerIndex === 0) {
      gameState.turn += 1;
      this.handleTurnAdvanceForEvents();
    }
    
    // Resetar estado para novo jogador
    gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
    gameState.selectedRegionId = null;
    gameState.currentPhase = 'renda';
    setCurrentPhase('renda');
    
    // Atualizar sidebar para o jogador atual
    gameState.selectedPlayerForSidebar = gameState.currentPlayerIndex;
    
    // Aplicar renda para o novo jogador (isso automaticamente avança para fase de ações)
    const newPlayer = getCurrentPlayer();
    this.applyIncomeForPlayer(newPlayer);
    
    addActivityLog('turn', 'SISTEMA', 'Turno iniciado', 
      `Turno de ${newPlayer.name} começou`, gameState.turn);
    
    this.checkVictory();
    
    // Forçar atualização da UI
    if (window.uiManager) {
      window.uiManager.updateUI();
    }
    
    window.utils.showFeedback(`Agora é o turno de ${newPlayer.name}`, 'info');
  } else {
    // Se estiver na fase de renda, avisar para aguardar
    window.utils.showFeedback('Aguarde a fase de renda terminar...', 'info');
  }
}

  handleTurnAdvanceForEvents() {
    // Atualizar duração do evento atual
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
    }

    // Contar até o próximo evento
    if (!gameState.currentEvent) {
      gameState.turnsUntilNextEvent -= 1;
      if (gameState.turnsUntilNextEvent <= 0) {
        this.triggerRandomEvent();
        gameState.turnsUntilNextEvent = 4;
      }
    }
  }

canAffordAction(actionType) {
    const player = gameState.players[gameState.currentPlayerIndex];
    const cost = GAME_CONFIG.ACTION_DETAILS[actionType]?.cost || {};
    
    return Object.entries(cost).every(([resource, amount]) => {
      return (player.resources[resource] || 0) >= amount;
    });
  }

  // ==================== RENDA AUTOMÁTICA ====================

  applyIncomeForPlayer(player) {
  const bonuses = { madeira: 0, pedra: 0, ouro: 0, agua: 0, pv: 0 };
  
  player.regions.forEach(regionId => {
    const region = gameState.regions[regionId];
    if (!region) return;
    
    // Produção base por bioma
    let biomeProd = { madeira: 0, pedra: 0, ouro: 0, agua: 0 };
    
    switch(region.biome) {
      case 'Floresta Tropical':
        biomeProd.madeira = 1;
        biomeProd.agua = 1.5;
        break;
      case 'Floresta Temperada':
        biomeProd.madeira = 1.5;
        biomeProd.pedra = 0.5;
        break;
      case 'Savana':
        biomeProd.ouro = 1.5;
        biomeProd.agua = 0.5;
        break;
      case 'Pântano':
        biomeProd.agua = 2;
        biomeProd.pedra = 1;
        break;
    }
    
    // Multiplicadores de eventos
    if (gameState.eventModifiers.madeiraMultiplier) {
      biomeProd.madeira *= gameState.eventModifiers.madeiraMultiplier;
    }
    if (gameState.eventModifiers.aguaMultiplier) {
      biomeProd.agua *= gameState.eventModifiers.aguaMultiplier;
    }
    if (gameState.eventModifiers.pedraMultiplier) {
      biomeProd.pedra *= gameState.eventModifiers.pedraMultiplier;
    }
    
    // Bloquear savanas se evento ativo
    if (gameState.eventModifiers.savanaBloqueada && region.biome === 'Savana') {
      biomeProd = { madeira: 0, pedra: 0, ouro: 0, agua: 0 };
    }
    
    // Bônus de pântano em enchente
    if (gameState.eventModifiers.pantanoBonus && region.biome === 'Pântano') {
      biomeProd.agua *= gameState.eventModifiers.pantanoBonus;
      biomeProd.pedra *= gameState.eventModifiers.pantanoBonus;
    }
    
    // Bônus de savana (descoberta de jazida)
    if (gameState.eventModifiers.savanaBonus && region.biome === 'Savana') {
      biomeProd.ouro += gameState.eventModifiers.savanaBonus;
    }
    
    // Bônus de exploração
    const explLevel = region.explorationLevel || 0;
    let explMultiplier = 1.0;
    
    switch(explLevel) {
      case 1:
        explMultiplier = 1.25;
        break;
      case 2:
        explMultiplier = 1.50;
        // 20% chance de +1 Ouro
        if (Math.random() < 0.20) {
          bonuses.ouro += 1;
        }
        break;
      case 3:
        explMultiplier = 2.00;
        break;
    }
    
    // Aplicar multiplicador de exploração
    Object.keys(biomeProd).forEach(k => {
      biomeProd[k] *= explMultiplier;
    });
    
    // Acumular bônus
    Object.keys(biomeProd).forEach(k => {
      bonuses[k] += biomeProd[k];
    });
    
    // Produção de estruturas
    if (!gameState.eventModifiers.structuresDisabled && region.structures && region.structures.length > 0) {
      region.structures.forEach(struct => {
        if (struct === 'Abrigo') {
          bonuses.madeira += 0.5;
          bonuses.agua += 0.5;
        } else if (struct === 'Mercado') {
          bonuses.ouro += 1;
        } else if (struct === 'Laboratório') {
          bonuses.ouro += 0.5;
        } else if (struct === 'Torre de Vigia') {
          bonuses.pv += 1;
        } else if (struct === 'Santuário') {
          bonuses.pv += 0.5;
        }
      });
    }
  });
  
  // Arredondar valores para inteiros
  Object.keys(bonuses).forEach(k => {
    bonuses[k] = Math.floor(bonuses[k]);
  });
  
  // Aplicar bônus ao jogador ANTES de mostrar a modal
  Object.keys(bonuses).forEach(k => {
    if (k !== 'pv') {
      player.resources[k] = (player.resources[k] || 0) + bonuses[k];
    } else {
      player.victoryPoints += bonuses[k];
    }
  });
  
  // IMPORTANTE: Mostrar modal de renda apenas se for o jogador atual E estiver na fase de renda
  if (player.id === gameState.currentPlayerIndex && gameState.currentPhase === 'renda') {
    console.log('Mostrando modal de renda para:', player.name);
    
    // Pequeno delay para garantir que a UI esteja pronta
    setTimeout(() => {
      if (window.uiManager && window.uiManager.showIncomeModal) {
        window.uiManager.showIncomeModal(player, bonuses);
      } else {
        console.error('uiManager ou showIncomeModal não disponível');
      }
    }, 300);
  }
  
  return bonuses;
}

// Inicia a fase de renda  
startIncomePhase() {
  const currentPlayer = getCurrentPlayer();
  if (!currentPlayer) return;
  
  console.log('Iniciando fase de renda para:', currentPlayer.name);
  
  // Garantir que estamos na fase de renda
  gameState.currentPhase = 'renda';
  
  // Aplicar renda (que mostrará a modal)
  this.applyIncomeForPlayer(currentPlayer);
}

  // ==================== EVENTOS ALEATÓRIOS ====================
  triggerRandomEvent() {
    if (!this.GAME_EVENTS || this.GAME_EVENTS.length === 0) return;
    
    const ev = this.GAME_EVENTS[Math.floor(Math.random() * this.GAME_EVENTS.length)];
    
    // Se o evento for instantâneo
    if (ev.duration === 1) {
      ev.apply(gameState);
      gameState.currentEvent = null;
      gameState.eventTurnsLeft = 0;
      return;
    }

    // Reset modifiers anteriores
    if (gameState.currentEvent && typeof gameState.currentEvent.remove === 'function') {
      gameState.currentEvent.remove(gameState);
    }

    gameState.currentEvent = ev;
    gameState.eventTurnsLeft = ev.duration;
    gameState.eventModifiers = {};
    
    // Aplica modificadores
    if (typeof ev.apply === 'function') {
      ev.apply(gameState);
    }

    addActivityLog('event', 'GAIA', `disparou evento: ${ev.name}`, ev.description, gameState.turn);
  }

  // ==================== UTILITÁRIOS ====================
  clearRegionSelection() {
    gameState.selectedRegionId = null;
  }

  checkVictory() {
    const winner = gameState.players.find(p => p.victoryPoints >= GAME_CONFIG.VICTORY_POINTS);
    if (winner) {
      window.utils.showFeedback(`${winner.name} venceu o jogo!`, 'success');
      
      // Atualizar conquistas
      achievementsState.wins++;
      setAchievementsState(achievementsState);
      
      addActivityLog('victory', winner.name, 'venceu o jogo!', `${winner.victoryPoints} PV`, gameState.turn);
    }
  }

  // ==================== MÉTODOS PARA NEGOCIAÇÃO ====================
  validateNegotiationOffer(offer, player) {
    const sufficientResources = ['madeira','pedra','ouro','agua'].every(k => offer[k] <= player.resources[k]);
    const ownsAllRegions = offer.regions.every(rid => player.regions.includes(rid));
    
    if (!sufficientResources) return 'Você não possui os recursos que está oferecendo.';
    if (!ownsAllRegions) return 'Você não controla todas as regiões que está oferecendo.';
    return null;
  }

  executeNegotiation(negotiation) {
    const initiator = gameState.players.find(p => p.id === negotiation.initiatorId);
    const target = gameState.players.find(p => p.id === negotiation.targetId);
    
    if (!initiator || !target) return false;
    
    // Transferir recursos
    ['madeira','pedra','ouro','agua'].forEach(k => {
      const offerAmt = negotiation.offer[k] || 0;
      const reqAmt = negotiation.request[k] || 0;
      
      initiator.resources[k] -= offerAmt;
      target.resources[k] += offerAmt;
      
      target.resources[k] -= reqAmt;
      initiator.resources[k] += reqAmt;
    });
    
    // Transferir regiões
    negotiation.offer.regions.forEach(rid => {
      initiator.regions = initiator.regions.filter(x => x !== rid);
      target.regions.push(rid);
      gameState.regions[rid].controller = target.id;
    });
    
    negotiation.request.regions.forEach(rid => {
      target.regions = target.regions.filter(x => x !== rid);
      initiator.regions.push(rid);
      gameState.regions[rid].controller = initiator.id;
    });
    
    // Pontos de vitória
    initiator.victoryPoints += 1;
    target.victoryPoints += 1;
    
    // Atualizar conquistas
    achievementsState.totalNegotiations++;

    window.uiManager.refreshUIAfterStateChange();
    
    return true;
  }
}

export { GameLogic };