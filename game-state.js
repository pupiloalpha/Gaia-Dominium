// game-state.js - Gerenciamento de estado do jogo
import { GAME_CONFIG } from './game-config.js';

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
  turnsUntilNextEvent: 4,
  currentPhase: 'renda' 
};

let activityLogHistory = [];

let achievementsState = {
  // Contadores globais
  totalExplored: 0,
  totalBuilt: 0,
  totalNegotiations: 0,
  totalCollected: 0,
  wins: 0,
  fastestWin: Infinity,
  
  // Contadores por jogador
  playerAchievements: {}, // Será inicializado quando os jogadores forem criados
  
  // Conquistas desbloqueadas por jogador
  unlockedAchievements: {} // {playerId: ['achievementId1', 'achievementId2']}
};

// Inicializar conquistas do jogador
function initializePlayerAchievements(playerId) {
  if (!achievementsState.playerAchievements[playerId]) {
    achievementsState.playerAchievements[playerId] = {
      explored: 0,
      built: 0,
      negotiated: 0,
      collected: 0,
      controlledBiomes: new Set(),
      maxResources: { madeira: 0, pedra: 0, ouro: 0, agua: 0 }
    };
  }
  
  if (!achievementsState.unlockedAchievements[playerId]) {
    achievementsState.unlockedAchievements[playerId] = [];
  }
}

// Verificar conquistas
function checkAchievements(playerId) {
  const player = gameState.players[playerId];
  const playerStats = achievementsState.playerAchievements[playerId];
  const unlocked = achievementsState.unlockedAchievements[playerId] || [];
  const newAchievements = [];
  
  // Explorador - Explore 10 regiões
  if (playerStats.explored >= 10 && !unlocked.includes('explorador')) {
    unlocked.push('explorador');
    newAchievements.push('Explorador');
  }
  
  // Construtor - Construa 5 estruturas
  if (playerStats.built >= 5 && !unlocked.includes('construtor')) {
    unlocked.push('construtor');
    newAchievements.push('Construtor');
  }
  
  // Diplomata - Realize 10 negociações
  if (playerStats.negotiated >= 10 && !unlocked.includes('diplomata')) {
    unlocked.push('diplomata');
    newAchievements.push('Diplomata');
  }
  
  // Colecionador - Recolha de 8 regiões diferentes
  if (playerStats.collected >= 8 && !unlocked.includes('colecionador')) {
    unlocked.push('colecionador');
    newAchievements.push('Colecionador');
  }
  
  // Diversificador - Controle 1 região de cada bioma
  if (playerStats.controlledBiomes.size >= 4 && !unlocked.includes('diversificador')) {
    unlocked.push('diversificador');
    newAchievements.push('Diversificador');
  }
  
  // Magnata - Acumule 20 de cada recurso
  const hasAllResources = Object.values(playerStats.maxResources)
    .every(value => value >= 20);
  if (hasAllResources && !unlocked.includes('magnata')) {
    unlocked.push('magnata');
    newAchievements.push('Magnata');
  }
  
  return newAchievements;
}

// Atualizar recursos máximos
function updateMaxResources(playerId) {
  const player = gameState.players[playerId];
  const playerStats = achievementsState.playerAchievements[playerId];
  
  if (!playerStats) return;
  
  Object.keys(player.resources).forEach(resource => {
    if (player.resources[resource] > playerStats.maxResources[resource]) {
      playerStats.maxResources[resource] = player.resources[resource];
    }
  });
}

// Getters
function getGameState() { return { ...gameState }; }
function getAchievementsState() { return { ...achievementsState }; }
function getCurrentPhase() { return currentPhase; }

// Setters com validação
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

function addActivityLog(entry) {
  activityLogHistory.unshift({
    ...entry,
    id: Date.now(),
    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    turn: gameState.turn
  });
  activityLogHistory = activityLogHistory.slice(0, 15); // Manter apenas últimas 15
}

function getActivityLogs(filter = 'all') {
  return activityLogHistory.filter(log => {
    if (filter === 'mine') return log.isMine;
    if (filter === 'events') return log.isEvent;
    return true;
  });
}

// Exportações
export {
  gameState,
  achievementsState,
  activityLogHistory,
  getGameState,
  getAchievementsState,
  getCurrentPhase,
  setGameState,
  setAchievementsState,
  setCurrentPhase,
  getCurrentPlayer,
  getSelectedRegion,
  addActivityLog,
  getActivityLogs,
  initializePlayerAchievements,
  checkAchievements,
  updateMaxResources
};
