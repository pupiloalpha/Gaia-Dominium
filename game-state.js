// game-state.js - Gerenciamento de estado do jogo completo
import { GAME_CONFIG } from './game-config.js';

// ==================== CONSTANTES DE CONFIGURAÇÃO ====================
const INITIAL_STATE = {
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
  turnsUntilNextEvent: 4,
  pendingNegotiations: [],
  activeNegotiation: null
};

const INITIAL_ACHIEVEMENTS_STATE = {
  totalExplored: 0,
  totalBuilt: 0,
  totalNegotiations: 0,
  wins: 0,
  unlockedAchievements: [], // Array por jogador: [[id1, id2], [id1], ...]
  playerAchievements: []    // Array por jogador: [{explored:0, built:0, ...}, ...]
};

const LOG_HISTORY_LIMIT = 15;

// ==================== VARIÁVEIS DE ESTADO ====================
let gameState = { ...INITIAL_STATE };
let achievementsState = { ...INITIAL_ACHIEVEMENTS_STATE };
let activityLogHistory = [];
let currentPhase = 'renda'; // Fase atual: 'renda', 'acoes', 'negociacao'

// ==================== GETTERS ====================
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

function getActivityLogHistory() {
  return [...activityLogHistory];
}

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

// ==================== SETTERS ====================
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

function setActivityLogHistory(logs) {
  activityLogHistory = Array.isArray(logs) ? [...logs] : [];
}

// ==================== MANIPULAÇÃO DE ESTADO ====================
function addActivityLog(entry) {
  const logEntry = {
    ...entry,
    id: Date.now(),
    timestamp: new Date().toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    turn: entry.turn || gameState.turn,
    isEvent: entry.isEvent !== undefined ? entry.isEvent : entry.type === 'event',
    isMine: entry.isMine !== undefined ? entry.isMine : 
            (entry.playerName === gameState.players[gameState.currentPlayerIndex]?.name)
  };
  
  activityLogHistory.unshift(logEntry);
  
  if (activityLogHistory.length > LOG_HISTORY_LIMIT) {
    activityLogHistory = activityLogHistory.slice(0, LOG_HISTORY_LIMIT);
  }
  
  return logEntry;
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
        player.resources[resource] = Math.max(0, player.resources[resource]);
      }
    });
  }
}

function updatePlayerVictoryPoints(playerIndex, points) {
  const player = gameState.players[playerIndex];
  if (player) {
    player.victoryPoints += points;
    player.victoryPoints = Math.max(0, player.victoryPoints);
  }
}

function updateRegionController(regionId, playerId) {
  const region = gameState.regions[regionId];
  if (region) {
    if (region.controller !== null) {
      const oldPlayer = gameState.players[region.controller];
      if (oldPlayer) {
        oldPlayer.regions = oldPlayer.regions.filter(id => id !== regionId);
      }
    }
    
    region.controller = playerId;
    
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

// ==================== VERIFICAÇÕES DE ESTADO ====================
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

// ==================== GESTÃO DE NEGOCIAÇÕES ====================
function addPendingNegotiation(negotiation) {
  if (!gameState.pendingNegotiations) {
    gameState.pendingNegotiations = [];
  }
  gameState.pendingNegotiations.push(negotiation);
  return negotiation;
}

function getPendingNegotiationsForPlayer(playerId) {
  if (!gameState.pendingNegotiations) {
    gameState.pendingNegotiations = [];
  }
  return gameState.pendingNegotiations.filter(
    negotiation => negotiation.targetId === playerId && negotiation.status === 'pending'
  );
}

function removePendingNegotiation(negotiationId) {
  if (!gameState.pendingNegotiations) {
    gameState.pendingNegotiations = [];
  }
  gameState.pendingNegotiations = gameState.pendingNegotiations.filter(
    n => n.id !== negotiationId
  );
}

function setActiveNegotiation(negotiation) {
  gameState.activeNegotiation = negotiation;
}

function clearActiveNegotiation() {
  gameState.activeNegotiation = null;
}

function updateNegotiationStatus(negotiationId, status) {
  if (!gameState.pendingNegotiations) {
    gameState.pendingNegotiations = [];
  }
  
  const negotiation = gameState.pendingNegotiations.find(n => n.id === negotiationId);
  if (negotiation) {
    negotiation.status = status;
    return negotiation;
  }
  return null;
}

// ==================== INICIALIZAÇÃO DO JOGO ====================
function initializeGame(playersData) {
  gameState = { ...INITIAL_STATE };
  
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

  gameState.gameStarted = true;
  gameState.turn = 1;
  gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
  gameState.currentPlayerIndex = 0;
  gameState.selectedPlayerForSidebar = 0;
  gameState.turnsUntilNextEvent = 4;
  currentPhase = 'renda';
}

// ==================== EXPORTAÇÕES ====================
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
  getActivityLogHistory,
  getCurrentPlayer,
  getSelectedRegion,
  getPlayerById,
  
  // Setters
  setGameState,
  setAchievementsState,
  setCurrentPhase,
  setActivityLogHistory,
  
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
  
  // Funções de negociação
  addPendingNegotiation,
  getPendingNegotiationsForPlayer,
  removePendingNegotiation,
  setActiveNegotiation,
  clearActiveNegotiation,
  updateNegotiationStatus,
  
  // Verificações
  hasPlayerWon,
  getWinner,
  canPlayerAfford,
  
  // Inicialização
  initializeGame
};
