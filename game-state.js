// game-state.js - Gerenciamento de estado do jogo completo
import { GAME_CONFIG } from './game-config.js';

// Estado do jogo
let gameState = {
  players: [],
  regions: [],
  currentPlayerIndex: 0,
  selectedPlayerForSidebar: 0,
  turn: 0,
  actionsLeft: GAME_CONFIG.ACTIONS_PER_TURN,
  gameStarted: false,
  selectedRegionId: null,
  pendingNegotiation: null,
  currentEvent: null,
  eventTurnsLeft: 0,
  eventModifiers: {},
  turnsUntilNextEvent: 4
};

// Sistema de conquistas - atualizado para refletir o original
let achievementsState = {
  totalExplored: 0,
  totalBuilt: 0,
  totalNegotiations: 0,
  wins: 0,
  unlockedAchievements: [], // Array por jogador: [[id1, id2], [id1], ...]
  playerAchievements: []    // Array por jogador: [{explored:0, built:0, ...}, ...]
};

// Log de atividades
let activityLogHistory = [];

// Fase atual do jogo
let currentPhase = 'renda';

// Getters
function getGameState() { 
  return { ...gameState }; 
}

function getAchievementsState() { 
  return { ...achievementsState }; 
}

function getCurrentPhase() { 
  return currentPhase; 
}

function getActivityLogs() {
  return [...activityLogHistory];
}

// Setters
function setGameState(newState) {
  Object.keys(newState).forEach(key => {
    if (gameState.hasOwnProperty(key)) {
      gameState[key] = newState[key];
    }
  });
}

function setAchievementsState(newState) {
  Object.keys(newState).forEach(key => {
    if (achievementsState.hasOwnProperty(key)) {
      achievementsState[key] = newState[key];
    }
  });
}

function setCurrentPhase(phase) {
  currentPhase = phase;
}

// Funções auxiliares de estado
function getCurrentPlayer() {
  return gameState.players[gameState.currentPlayerIndex];
}

function getSelectedRegion() {
  return gameState.selectedRegionId !== null 
    ? gameState.regions[gameState.selectedRegionId] 
    : null;
}

function getPlayerById(id) {
  return gameState.players.find(p => p.id === id);
}

// Funções de manipulação do estado
function addActivityLog(entry) {
  activityLogHistory.unshift({
    ...entry,
    id: Date.now(),
    timestamp: new Date().toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    turn: gameState.turn
  });
  
  // Manter apenas últimas 15 entradas
  if (activityLogHistory.length > 15) {
    activityLogHistory = activityLogHistory.slice(0, 15);
  }
}

function incrementAchievement(achievementType, amount = 1) {
  if (achievementsState.hasOwnProperty(achievementType)) {
    achievementsState[achievementType] += amount;
  }
}

function clearRegionSelection() {
  gameState.selectedRegionId = null;
}

function updateCurrentPlayerIndex() {
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  
  // Se voltou ao primeiro jogador, incrementa o turno
  if (gameState.currentPlayerIndex === 0) {
    gameState.turn += 1;
  }
}

function resetActions() {
  gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
}

function consumeAction() {
  if (gameState.actionsLeft > 0) {
    gameState.actionsLeft--;
    return true;
  }
  return false;
}

function setSelectedRegion(regionId) {
  gameState.selectedRegionId = regionId;
}

function setSelectedPlayerForSidebar(playerIndex) {
  gameState.selectedPlayerForSidebar = playerIndex;
}

function addPlayer(player) {
  gameState.players.push(player);
}

function updatePlayerResources(playerIndex, resources) {
  const player = gameState.players[playerIndex];
  if (player) {
    Object.keys(resources).forEach(resource => {
      if (player.resources[resource] !== undefined) {
        player.resources[resource] += resources[resource];
        // Garantir que não fique negativo
        player.resources[resource] = Math.max(0, player.resources[resource]);
      }
    });
  }
}

function updatePlayerVictoryPoints(playerIndex, points) {
  const player = gameState.players[playerIndex];
  if (player) {
    player.victoryPoints += points;
    // Garantir que não fique negativo
    player.victoryPoints = Math.max(0, player.victoryPoints);
  }
}

function updateRegionController(regionId, playerId) {
  const region = gameState.regions[regionId];
  if (region) {
    // Remover da lista do jogador anterior
    if (region.controller !== null) {
      const oldPlayer = gameState.players[region.controller];
      if (oldPlayer) {
        oldPlayer.regions = oldPlayer.regions.filter(id => id !== regionId);
      }
    }
    
    // Atualizar controlador
    region.controller = playerId;
    
    // Adicionar à lista do novo jogador
    if (playerId !== null) {
      const newPlayer = gameState.players[playerId];
      if (newPlayer && !newPlayer.regions.includes(regionId)) {
        newPlayer.regions.push(regionId);
      }
    }
  }
}

function updateRegionExploration(regionId, level) {
  const region = gameState.regions[regionId];
  if (region) {
    region.explorationLevel = Math.max(0, Math.min(3, level));
  }
}

function addStructureToRegion(regionId, structure) {
  const region = gameState.regions[regionId];
  if (region && !region.structures.includes(structure)) {
    region.structures.push(structure);
  }
}

function setCurrentEvent(event) {
  gameState.currentEvent = event;
  if (event) {
    gameState.eventTurnsLeft = event.duration;
  } else {
    gameState.eventTurnsLeft = 0;
  }
}

function updateEventTurnsLeft() {
  if (gameState.eventTurnsLeft > 0) {
    gameState.eventTurnsLeft--;
    
    // Se acabou o evento, limpar
    if (gameState.eventTurnsLeft <= 0) {
      gameState.currentEvent = null;
      gameState.eventModifiers = {};
    }
  }
}

function updateTurnsUntilNextEvent() {
  if (gameState.turnsUntilNextEvent > 0) {
    gameState.turnsUntilNextEvent--;
  }
}

function resetTurnsUntilNextEvent() {
  gameState.turnsUntilNextEvent = 4;
}

function setPendingNegotiation(negotiation) {
  gameState.pendingNegotiation = negotiation;
}

function clearPendingNegotiation() {
  gameState.pendingNegotiation = null;
}

// Funções para verificação de estado
function hasPlayerWon() {
  return gameState.players.some(p => p.victoryPoints >= GAME_CONFIG.VICTORY_POINTS);
}

function getWinner() {
  return gameState.players.find(p => p.victoryPoints >= GAME_CONFIG.VICTORY_POINTS);
}

function canPlayerAfford(playerIndex, cost) {
  const player = gameState.players[playerIndex];
  if (!player) return false;
  
  return Object.entries(cost).every(([resource, amount]) => {
    return (player.resources[resource] || 0) >= amount;
  });
}

// Função para inicializar o jogo
function initializeGame(playersData) {
  // Resetar estado
  gameState = {
    players: [],
    regions: [],
    currentPlayerIndex: 0,
    selectedPlayerForSidebar: 0,
    turn: 1,
    actionsLeft: GAME_CONFIG.ACTIONS_PER_TURN,
    gameStarted: true,
    selectedRegionId: null,
    pendingNegotiation: null,
    currentEvent: null,
    eventTurnsLeft: 0,
    eventModifiers: {},
    turnsUntilNextEvent: 4
  };
  
  // Adicionar jogadores
  playersData.forEach((playerData, index) => {
    gameState.players.push({
      id: index,
      name: playerData.name,
      icon: playerData.icon,
      color: GAME_CONFIG.PLAYER_COLORS[index % GAME_CONFIG.PLAYER_COLORS.length],
      resources: { ...GAME_CONFIG.INITIAL_RESOURCES },
      victoryPoints: 0,
      regions: [],
      consecutiveNoActionTurns: 0
    });
  });

  // Inicializar conquistas por jogador
  achievementsState.unlockedAchievements = [];
  achievementsState.playerAchievements = [];
  gameState.players.forEach(() => {
    achievementsState.unlockedAchievements.push([]);
    achievementsState.playerAchievements.push({
      explored: 0,
      built: 0,
      negotiated: 0,
      collected: 0,
      controlledBiomes: new Set(),
      maxResources: { madeira: 0, pedra: 0, ouro: 0, agua: 0 }
    });
  });
}

// Exportações
export {
  gameState,
  achievementsState,
  activityLogHistory,
  currentPhase,
  
  // Getters
  getGameState,
  getAchievementsState,
  getCurrentPhase,
  getActivityLogs,
  getCurrentPlayer,
  getSelectedRegion,
  getPlayerById,
  
  // Setters
  setGameState,
  setAchievementsState,
  setCurrentPhase,
  
  // Manipulação de estado
  addActivityLog,
  incrementAchievement,
  clearRegionSelection,
  updateCurrentPlayerIndex,
  resetActions,
  consumeAction,
  setSelectedRegion,
  setSelectedPlayerForSidebar,
  addPlayer,
  updatePlayerResources,
  updatePlayerVictoryPoints,
  updateRegionController,
  updateRegionExploration,
  addStructureToRegion,
  setCurrentEvent,
  updateEventTurnsLeft,
  updateTurnsUntilNextEvent,
  resetTurnsUntilNextEvent,
  setPendingNegotiation,
  clearPendingNegotiation,
  
  // Verificações
  hasPlayerWon,
  getWinner,
  canPlayerAfford,
  
  // Inicialização
  initializeGame
};