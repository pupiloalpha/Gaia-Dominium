// game-state.js - Estado do jogo + funções de persistência
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
  activeNegotiation: null,
  currentPhase: 'renda'
};

const INITIAL_ACHIEVEMENTS_STATE = {
  totalExplored: 0,
  totalBuilt: 0,
  totalNegotiations: 0,
  wins: 0,
  unlockedAchievements: [],
  playerAchievements: []
};

const LOG_HISTORY_LIMIT = 50;
const SAVE_KEY = 'gaia-dominium-save';
const SAVE_VERSION = '1.0.0';

// ==================== CONSTANTES DE NEGOCIAÇÃO ====================
const NEGOTIATION_INITIAL_STATE = {
  offer: { madeira: 0, pedra: 0, ouro: 0, agua: 0 },
  request: { madeira: 0, pedra: 0, ouro: 0, agua: 0 },
  offerRegions: [],
  requestRegions: [],
  targetPlayerId: null,
  isValid: false,
  validationErrors: []
};

// ==================== VARIÁVEIS DE ESTADO ====================
let gameState = { ...INITIAL_STATE };
let achievementsState = { ...INITIAL_ACHIEVEMENTS_STATE };
let activityLogHistory = [];
let negotiationState = { ...NEGOTIATION_INITIAL_STATE };

// Sistema de IA (será carregado dinamicamente)
let aiInstances = [];

// ==================== GETTERS ====================
function getGameState() { 
  return { ...gameState }; 
}

function getAchievementsState() { 
  return { ...achievementsState }; 
}

function getCurrentPhase() { 
  return gameState.currentPhase || 'renda'; 
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

function getNegotiationState() {
  return { ...negotiationState };
}

function canPlayerNegotiate(playerId) {
  const player = getPlayerById(playerId);
  if (!player) return false;
  
  if (player.resources.ouro < 1) return false;
  if (gameState.currentPhase !== 'negociacao') return false;
  if (gameState.actionsLeft <= 0) return false;
  
  return true;
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
  gameState.currentPhase = phase;
}

function setActivityLogHistory(logs) {
  activityLogHistory = Array.isArray(logs) ? [...logs] : [];
}

function setNegotiationState(newState) {
  Object.keys(newState).forEach(key => {
    if (negotiationState.hasOwnProperty(key)) {
      if (typeof negotiationState[key] === 'object' && !Array.isArray(negotiationState[key])) {
        negotiationState[key] = { ...negotiationState[key], ...newState[key] };
      } else {
        negotiationState[key] = newState[key];
      }
    }
  });
}

function resetNegotiationState() {
  negotiationState = { ...NEGOTIATION_INITIAL_STATE };
}

function updateNegotiationResource(type, resource, amount) {
  if (negotiationState[type] && negotiationState[type][resource] !== undefined) {
    negotiationState[type][resource] = Math.max(0, amount);
  }
}

function updateNegotiationRegions(type, regionIds) {
  if (negotiationState[type] !== undefined) {
    negotiationState[type] = Array.isArray(regionIds) ? [...regionIds] : regionIds;
  }
}

function setNegotiationTarget(targetPlayerId) {
  // Normaliza o valor: armazena Number inteiro ou null
  if (targetPlayerId === null || typeof targetPlayerId === 'undefined') {
    negotiationState.targetPlayerId = null;
    return;
  }
  // Se for string vazia ou não-numérico -> null
  if (targetPlayerId === '' || Number.isNaN(Number(targetPlayerId))) {
    negotiationState.targetPlayerId = null;
    return;
  }
  const num = Number(targetPlayerId);
  // Se não for inteiro válido, armazenar null (proteção)
  negotiationState.targetPlayerId = Number.isInteger(num) ? num : null;
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

function setAIPlayers(aiPlayers) {
  aiInstances = aiPlayers;
}

function getAIPlayer(playerId) {
  return aiInstances.find(ai => ai.playerId === playerId);
}

function isPlayerAI(playerId) {
  const player = gameState.players[playerId];
  return player && (player.type === 'ai' || player.isAI);
}

// Função para obter todas as instâncias de IA
function getAllAIPlayers() {
  return aiInstances;
}

// Função para limpar negociações antigas ou processadas
function cleanupNegotiations() {
  const now = Date.now();
  const MAX_NEGOTIATION_AGE = 300000; // 5 minutos
  
  // Limpar negociações muito antigas
  gameState.pendingNegotiations = gameState.pendingNegotiations.filter(neg => {
    const age = now - neg.timestamp;
    const shouldKeep = age < MAX_NEGOTIATION_AGE && neg.status === 'pending';
    
    if (!shouldKeep) {
      console.log(`🧹 Removendo negociação antiga: ${neg.id} (idade: ${age}ms, status: ${neg.status})`);
    }
    
    return shouldKeep;
  });
  
  // Garantir que não há IDs duplicados
  const uniqueIds = new Set();
  gameState.pendingNegotiations = gameState.pendingNegotiations.filter(neg => {
    if (uniqueIds.has(neg.id)) {
      console.log(`🧹 Removendo negociação duplicada: ${neg.id}`);
      return false;
    }
    uniqueIds.add(neg.id);
    return true;
  });
  
  console.log(`🧹 Limpeza de negociações: ${gameState.pendingNegotiations.length} permanecem`);
}

function setPendingNegotiation(negotiation) {
  gameState.pendingNegotiation = negotiation;
}

function clearPendingNegotiation() {
  gameState.pendingNegotiation = null;
}

function validateNegotiationState() {
  const errors = [];
  const initiator = getCurrentPlayer();
  const target = negotiationState.targetPlayerId !== null 
    ? getPlayerById(negotiationState.targetPlayerId)
    : null;
  
  if (!initiator || !target) {
    errors.push('Jogadores não identificados');
    negotiationState.isValid = false;
    negotiationState.validationErrors = errors;
    return false;
  }
  
  Object.entries(negotiationState.offer).forEach(([resource, amount]) => {
    if (amount > 0 && amount > (initiator.resources[resource] || 0)) {
      errors.push(`Você não tem ${amount} ${resource} para oferecer`);
    }
  });
  
  Object.entries(negotiationState.request).forEach(([resource, amount]) => {
    if (amount > 0 && amount > (target.resources[resource] || 0)) {
      errors.push(`${target.name} não tem ${amount} ${resource} para trocar`);
    }
  });
  
  negotiationState.offerRegions.forEach(regionId => {
    if (!initiator.regions.includes(regionId)) {
      const regionName = gameState.regions[regionId]?.name || `Região ${regionId}`;
      errors.push(`Você não controla a região oferecida: ${regionName}`);
    }
  });
  
  negotiationState.requestRegions.forEach(regionId => {
    if (!target.regions.includes(regionId)) {
      const regionName = gameState.regions[regionId]?.name || `Região ${regionId}`;
      errors.push(`${target.name} não controla a região solicitada: ${regionName}`);
    }
  });
  
  const totalOffer = Object.values(negotiationState.offer).reduce((a, b) => a + b, 0) + 
                     negotiationState.offerRegions.length;
  const totalRequest = Object.values(negotiationState.request).reduce((a, b) => a + b, 0) + 
                       negotiationState.requestRegions.length;
  
  if (totalOffer === 0 && totalRequest === 0) {
    errors.push('A proposta deve incluir oferta ou solicitação');
  }
  
  if (initiator.resources.ouro < 1) {
    errors.push('Você precisa de 1 Ouro para negociar');
  }
  
  if (gameState.actionsLeft <= 0) {
    errors.push('Sem ações restantes para negociar');
  }
  
  negotiationState.validationErrors = errors;
  negotiationState.isValid = errors.length === 0;
  
  return negotiationState.isValid;
}

function getNegotiationValidationErrors() {
  return [...negotiationState.validationErrors];
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
  // Verificar se já existe
  const exists = gameState.pendingNegotiations.some(neg => neg.id === negotiation.id);
  
  if (exists) {
    console.warn(`⚠️ Negociação ${negotiation.id} já existe, atualizando`);
    // Atualizar existente
    const index = gameState.pendingNegotiations.findIndex(neg => neg.id === negotiation.id);
    gameState.pendingNegotiations[index] = negotiation;
  } else {
    // Adicionar nova
    gameState.pendingNegotiations.push(negotiation);
  }
  
  console.log(`📨 Negociação ${negotiation.id} adicionada/atualizada. Total: ${gameState.pendingNegotiations.length}`);
)

function getPendingNegotiationsForPlayer(playerId) {
  // CORREÇÃO: Garantir que playerId seja número
  const numericPlayerId = Number(playerId);
  
  if (isNaN(numericPlayerId)) {
    console.error(`❌ ID de jogador inválido: ${playerId}`);
    return [];
  }
  
  // Primeiro fazer limpeza
  cleanupNegotiations();
  
  if (!gameState.pendingNegotiations) {
    gameState.pendingNegotiations = [];
  }
  
  // Filtrar negociações pendentes para este jogador
  const pending = gameState.pendingNegotiations.filter(neg => {
    // CORREÇÃO: Converter ambos para número
    const targetId = Number(neg.targetId);
    return targetId === numericPlayerId && neg.status === 'pending';
  });
  
  // Ordenar por timestamp (mais antigas primeiro)
  pending.sort((a, b) => a.timestamp - b.timestamp);
  
  console.log(`📨 Jogador ${numericPlayerId} tem ${pending.length} proposta(s) pendente(s)`);
  return pending;
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

// ==================== PERSISTÊNCIA ====================

function saveGame() {
  try {
    const saveData = {
      gameState: getGameState(),
      achievementsState: getAchievementsState(),
      activityLogHistory: getActivityLogHistory(),
      timestamp: new Date().toISOString(),
      version: SAVE_VERSION
    };
    
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    console.log('💾 Jogo salvo:', saveData);
    return true;
  } catch (error) {
    console.error('Erro ao salvar jogo:', error);
    return false;
  }
}

function loadGame(saveData) {
  try {
    if (!saveData || !saveData.gameState) {
      throw new Error('Dados de save inválidos');
    }
    
    setGameState(saveData.gameState);
    
    if (saveData.achievementsState) {
      setAchievementsState(saveData.achievementsState);
    }
    
    if (saveData.activityLogHistory) {
      setActivityLogHistory(saveData.activityLogHistory);
    }
    
    // GARANTIR que gameStarted seja true
    if (!gameState.gameStarted) {
      gameState.gameStarted = true;
    }
    
    console.log('🎮 Jogo carregado:', saveData);
    return true;
  } catch (error) {
    console.error('Erro ao carregar jogo:', error);
    return false;
  }
}

function hasSavedGame() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

function getSavedGame() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Erro ao ler save:', error);
    return null;
  }
}

function deleteSavedGame() {
  localStorage.removeItem(SAVE_KEY);
  return true;
}

// Função de compatibilidade para migrar saves antigos
function migrateSaveData(data) {
  if (!data.version) {
    // Adicionar campos que podem faltar em saves antigos
    if (!data.gameState.selectedPlayerForSidebar) {
      data.gameState.selectedPlayerForSidebar = 0;
    }
    
    if (!data.gameState.eventModifiers) {
      data.gameState.eventModifiers = {};
    }
    
    if (!data.achievementsState) {
      data.achievementsState = {
        totalExplored: 0,
        totalBuilt: 0,
        totalNegotiations: 0,
        wins: 0,
        unlockedAchievements: [],
        playerAchievements: []
      };
    }
    
    data.version = SAVE_VERSION;
  }
  
  return data;
}

// ==================== INICIALIZAÇÃO DO JOGO ====================
function initializeGame(playersData) {
  gameState = { ...INITIAL_STATE };
  achievementsState = { ...INITIAL_ACHIEVEMENTS_STATE };
  activityLogHistory = [];
  negotiationState = { ...NEGOTIATION_INITIAL_STATE };
  
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
  gameState.currentPhase = 'renda';
}

// ==================== EXPORTAÇÕES ====================
export {
  gameState,
  achievementsState,
  activityLogHistory,
  negotiationState,
  
  // Getters
  getGameState,
  getAchievementsState,
  getCurrentPhase,
  getActivityLogs,
  getActivityLogHistory,
  getCurrentPlayer,
  getSelectedRegion,
  getPlayerById,
  getNegotiationState,
  canPlayerNegotiate,
  getNegotiationValidationErrors,
  
  // Setters
  setGameState,
  setAchievementsState,
  setCurrentPhase,
  setActivityLogHistory,
  setNegotiationState,
  resetNegotiationState,
  updateNegotiationResource,
  updateNegotiationRegions,
  setNegotiationTarget,
  validateNegotiationState,
  
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
  
  // Persistência
  saveGame,
  loadGame,
  hasSavedGame,
  getSavedGame,
  deleteSavedGame,
  migrateSaveData,
  
 // Exportações IA
  aiInstances,
  setAIPlayers,
  getAIPlayer,
  isPlayerAI,
  getAllAIPlayers,

  // Inicialização
  initializeGame
};
