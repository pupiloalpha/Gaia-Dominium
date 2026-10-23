// game-state.js - Estado do jogo + funções de persistência
import { GAME_CONFIG, DEFAULT_GAME_RULES } from './game-config.js';

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
  currentPhase: 'renda',
  disputeHistory: [],
  totalDisputes: 0,
  successfulDisputes: 0,
  failedDisputes: 0,
  rules: { ...DEFAULT_GAME_RULES },
  saveId: null
};

const ELIMINATION_CONFIG = {
  ELIMINATION_ICON: '💀',
  ELIMINATED_COLOR: '#666666',
  ELIMINATED_OPACITY: 0.5,
  RESURRECTION_COST_PV: 2,
  PENALTY_PV_PERCENTAGE: 0.3, // 30% dos PV atuais
  MIN_PENALTY_PV: 1,
  MAX_PENALTY_PV: 5
};

const INITIAL_ACHIEVEMENTS_STATE = {
  totalExplored: 0,
  totalBuilt: 0,
  totalNegotiations: 0,
  wins: 0,
  unlockedAchievements: [],
  playerAchievements: [],
  totalDisputes: 0,
  successfulDisputes: 0,
  failedDisputes: 0
};

const LOG_HISTORY_LIMIT = 50;
const SAVE_KEY = 'gaia-dominium-save';
const SAVES_LIST_KEY = 'gaia-dominium-saves-list';
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

function getExploreActionType(regionId, playerId) {
  if (regionId === null) return 'none';
  
  const region = gameState.regions[regionId];
  if (!region) return 'none';
  
  if (region.controller === playerId) return 'explore';
  if (region.controller === null) return 'dominate';
  return 'dispute';
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
  if (!gameState.players || gameState.players.length === 0) return false;
  const rules = gameState.rules || DEFAULT_GAME_RULES;
  const condition = rules.victoryCondition || 'pv';
  const targetPV = rules.targetVictoryPoints || GAME_CONFIG.VICTORY_POINTS || 25;

  if (condition === 'pv' || condition === 'all') {
    if (gameState.players.some(p => !p.eliminated && p.victoryPoints >= targetPV)) {
      return true;
    }
  }

  if (condition === 'domination' || condition === 'all') {
    if (gameState.regions && gameState.regions.length > 0 && gameState.regions.every(r => r.controller !== null)) {
      return true;
    }
  }

  if (condition === 'elimination' || condition === 'all') {
    const active = gameState.players.filter(p => !p.eliminated);
    if (active.length === 1 && gameState.players.length > 1) {
      return true;
    }
  }

  return false;
}

function getWinner() {
  if (!gameState.players || gameState.players.length === 0) return null;
  const rules = gameState.rules || DEFAULT_GAME_RULES;
  const condition = rules.victoryCondition || 'pv';
  const targetPV = rules.targetVictoryPoints || GAME_CONFIG.VICTORY_POINTS || 25;

  if (condition === 'pv' || condition === 'all') {
    const pvWinner = gameState.players.find(p => !p.eliminated && p.victoryPoints >= targetPV);
    if (pvWinner) return pvWinner;
  }

  if (condition === 'domination' || condition === 'all') {
    if (gameState.regions && gameState.regions.length > 0 && gameState.regions.every(r => r.controller !== null)) {
      const ranked = [...gameState.players.filter(p => !p.eliminated)].sort((a, b) => {
        if ((b.regions?.length || 0) !== (a.regions?.length || 0)) {
          return (b.regions?.length || 0) - (a.regions?.length || 0);
        }
        return b.victoryPoints - a.victoryPoints;
      });
      if (ranked.length > 0) return ranked[0];
    }
  }

  const active = gameState.players.filter(p => !p.eliminated);
  if (active.length === 1 && gameState.players.length > 1) {
    return active[0];
  }

  return gameState.players.find(p => !p.eliminated && p.victoryPoints >= targetPV) || null;
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
}

function getPendingNegotiationsForPlayer(playerId) {
    const numericPlayerId = Number(playerId);
    console.log(`📋 Buscando propostas para jogador ID: ${numericPlayerId}`);
    
    if (!gameState.pendingNegotiations) {
        gameState.pendingNegotiations = [];
        return [];
    }
    
    // Primeiro fazer limpeza
    cleanupNegotiations();
    
    // Filtrar negociações pendentes para este jogador
    const pending = gameState.pendingNegotiations.filter(neg => {
        const targetId = Number(neg.targetId);
        const matches = targetId === numericPlayerId && neg.status === 'pending';
        
        if (matches) {
            console.log(`✅ Proposta ${neg.id} destinada a jogador ${numericPlayerId}`);
        }
        
        return matches;
    });
    
    // Ordenar por timestamp (mais antigas primeiro)
    pending.sort((a, b) => a.timestamp - b.timestamp);
    
    console.log(`📋 Encontradas ${pending.length} propostas para jogador ${numericPlayerId}`);
    
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

// Função para registrar disputa de regiões
function addDisputeRecord(attackerId, defenderId, regionId, success, costs) {
  if (!gameState.disputeHistory) gameState.disputeHistory = [];
  
  gameState.disputeHistory.push({
    id: Date.now(),
    attackerId,
    defenderId,
    regionId,
    success,
    costs,
    turn: gameState.turn,
    timestamp: new Date().toISOString()
  });
  
  // Limitar histórico
  if (gameState.disputeHistory.length > 100) {
    gameState.disputeHistory = gameState.disputeHistory.slice(-100);
  }
}

// ==================== REGRAS DO JOGO ====================

function getGameRules() {
  return { ...(gameState.rules || DEFAULT_GAME_RULES) };
}

function setGameRules(newRules) {
  gameState.rules = {
    ...DEFAULT_GAME_RULES,
    ...(gameState.rules || {}),
    ...newRules
  };
  if (gameState.rules.targetVictoryPoints) {
    GAME_CONFIG.VICTORY_POINTS = gameState.rules.targetVictoryPoints;
  }
  return gameState.rules;
}

// ==================== PERSISTÊNCIA & GERENCIADOR DE SAVES ====================

function getSavedGamesListRaw() {
  try {
    const raw = localStorage.getItem(SAVES_LIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Erro ao ler lista de saves:', e);
    return [];
  }
}

function getSavedGamesList() {
  const list = getSavedGamesListRaw();

  // Compatibilidade: verificar se existe save legado em SAVE_KEY que ainda não está na lista
  try {
    const legacyRaw = localStorage.getItem(SAVE_KEY);
    if (legacyRaw) {
      const legacyData = JSON.parse(legacyRaw);
      if (legacyData && legacyData.gameState) {
        const legacyId = legacyData.gameState.saveId || 'save_legacy';
        const alreadyInList = list.some(s => s.id === legacyId);
        if (!alreadyInList) {
          const players = legacyData.gameState.players || [];
          const legacyEntry = {
            id: legacyId,
            name: 'Partida Salva',
            timestamp: legacyData.timestamp || new Date().toISOString(),
            turn: legacyData.gameState.turn || 1,
            playersCount: players.length,
            players: players.map(p => ({
              id: p.id,
              name: p.name,
              color: p.color,
              icon: p.icon,
              factionName: p.faction?.name || 'Facção',
              victoryPoints: p.victoryPoints || 0,
              regionsCount: p.regions ? p.regions.length : 0,
              isAI: !!(p.type === 'ai' || p.isAI),
              eliminated: !!p.eliminated
            })),
            rules: legacyData.gameState.rules || { ...DEFAULT_GAME_RULES },
            data: legacyData
          };
          list.unshift(legacyEntry);
          localStorage.setItem(SAVES_LIST_KEY, JSON.stringify(list));
        }
      }
    }
  } catch (e) {
    console.warn('Erro ao verificar compatibilidade de save legado:', e);
  }

  // Ordenar por data mais recente primeiro
  list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return list;
}

function saveGame(customName = null) {
  try {
    if (!gameState.saveId) {
      gameState.saveId = `save_${Date.now()}`;
    }

    const saveData = {
      gameState: getGameState(),
      achievementsState: getAchievementsState(),
      activityLogHistory: getActivityLogHistory(),
      timestamp: new Date().toISOString(),
      version: SAVE_VERSION
    };

    const playersSummary = (gameState.players || []).map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      icon: p.icon,
      factionName: p.faction?.name || 'Facção',
      victoryPoints: p.victoryPoints || 0,
      regionsCount: p.regions ? p.regions.length : 0,
      isAI: !!(p.type === 'ai' || p.isAI),
      eliminated: !!p.eliminated
    }));

    const saveEntry = {
      id: gameState.saveId,
      name: customName || `Partida ${gameState.saveId.slice(-4)} (Turno ${gameState.turn})`,
      timestamp: new Date().toISOString(),
      turn: gameState.turn,
      playersCount: gameState.players.length,
      players: playersSummary,
      rules: { ...(gameState.rules || DEFAULT_GAME_RULES) },
      data: saveData
    };

    const savesList = getSavedGamesListRaw();
    const existingIndex = savesList.findIndex(s => s.id === gameState.saveId);
    if (existingIndex >= 0) {
      savesList[existingIndex] = saveEntry;
    } else {
      savesList.unshift(saveEntry);
    }

    localStorage.setItem(SAVES_LIST_KEY, JSON.stringify(savesList));
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    console.log(`💾 Jogo salvo com sucesso (Slot: ${gameState.saveId})`);
    return true;
  } catch (error) {
    console.error('Erro ao salvar jogo:', error);
    return false;
  }
}

function saveCurrentGame(customTitle = null) {
  return saveGame(customTitle);
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

    if (saveData.gameState.rules) {
      gameState.rules = { ...DEFAULT_GAME_RULES, ...saveData.gameState.rules };
      if (gameState.rules.targetVictoryPoints) {
        GAME_CONFIG.VICTORY_POINTS = gameState.rules.targetVictoryPoints;
      }
    }
    
    // GARANTIR que gameStarted seja true
    if (!gameState.gameStarted) {
      gameState.gameStarted = true;
    }
    
    console.log('🎮 Jogo carregado com sucesso:', saveData);
    return true;
  } catch (error) {
    console.error('Erro ao carregar jogo:', error);
    return false;
  }
}

function loadSavedGameById(saveId) {
  const saves = getSavedGamesList();
  const entry = saves.find(s => s.id === saveId);
  if (!entry || !entry.data) {
    console.error(`Save com id ${saveId} não encontrado.`);
    return false;
  }
  const migrated = migrateSaveData(entry.data);
  const success = loadGame(migrated);
  if (success) {
    gameState.saveId = entry.id;
    localStorage.setItem(SAVE_KEY, JSON.stringify(entry.data));
  }
  return success;
}

function deleteSavedGameById(saveId) {
  try {
    let saves = getSavedGamesListRaw();
    saves = saves.filter(s => s.id !== saveId);
    localStorage.setItem(SAVES_LIST_KEY, JSON.stringify(saves));

    const legacy = localStorage.getItem(SAVE_KEY);
    if (legacy) {
      try {
        const legData = JSON.parse(legacy);
        if (legData?.gameState?.saveId === saveId || saveId === 'save_legacy') {
          localStorage.removeItem(SAVE_KEY);
        }
      } catch (e) {
        localStorage.removeItem(SAVE_KEY);
      }
    }
    return true;
  } catch (error) {
    console.error(`Erro ao excluir save ${saveId}:`, error);
    return false;
  }
}

function hasSavedGame() {
  const list = getSavedGamesList();
  return list.length > 0;
}

function getSavedGame() {
  try {
    const list = getSavedGamesList();
    if (list.length > 0) {
      return list[0].data;
    }
    const saved = localStorage.getItem(SAVE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Erro ao ler save:', error);
    return null;
  }
}

function deleteSavedGame() {
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem(SAVES_LIST_KEY);
  return true;
}

// Função de compatibilidade para migrar saves antigos
function migrateSaveData(data) {
  if (!data) return data;
  if (!data.gameState) return data;

  if (!data.gameState.rules) {
    data.gameState.rules = { ...DEFAULT_GAME_RULES };
  }

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

// ==================== FUNÇÕES DE ELIMINAÇÃO ====================

// Função para marcar um jogador como eliminado
function eliminatePlayer(playerId) {
  const player = getPlayerById(playerId);
  if (!player || player.eliminated) return false;
  
  // Calcular penalidade de PV
  const penalty = Math.max(
    ELIMINATION_CONFIG.MIN_PENALTY_PV,
    Math.min(
      ELIMINATION_CONFIG.MAX_PENALTY_PV,
      Math.floor(player.victoryPoints * ELIMINATION_CONFIG.PENALTY_PV_PERCENTAGE)
    )
  );
  
  // Aplicar penalidade
  player.victoryPoints = Math.max(0, player.victoryPoints - penalty);
  
  // Marcar como eliminado
  player.eliminated = true;
  player.eliminatedTurn = gameState.turn;
  
  // Limpar regiões (já deveriam estar vazias, mas por segurança)
  player.regions.forEach(regionId => {
    const region = gameState.regions[regionId];
    if (region && region.controller === playerId) {
      region.controller = null;
    }
  });
  player.regions = [];
  
  // Se for IA, desativar
  if (player.type === 'ai' || player.isAI) {
    const ai = getAIPlayer(playerId);
    if (ai && ai.deactivate) {
      ai.deactivate();
    }
  }
  
  // Adicionar ao histórico de eliminações
  if (!gameState.eliminatedPlayers) {
    gameState.eliminatedPlayers = [];
  }
  gameState.eliminatedPlayers.push({
    playerId,
    turn: gameState.turn,
    penalty
  });
  
  // Verificar se o jogo terminou por eliminação
  checkEliminationVictory();
  
  return true;
}

// Função para ressuscitar um jogador
function resurrectPlayer(playerId, regionId) {
  const player = getPlayerById(playerId);
  const region = gameState.regions[regionId];
  
  if (!player || !player.eliminated || !region || region.controller !== null) {
    return false;
  }
  
  // Verificar se o jogador pode pagar o custo de ressurreição
  const pvCost = ELIMINATION_CONFIG.RESURRECTION_COST_PV;
  const resourceCost = region.resources;
  
  if (player.victoryPoints < pvCost) return false;
  
  const canPay = Object.entries(resourceCost).every(([resource, amount]) => 
    (player.resources[resource] || 0) >= amount
  );
  
  if (!canPay) return false;
  
  // Pagar custos
  player.victoryPoints -= pvCost;
  Object.entries(resourceCost).forEach(([resource, amount]) => {
    player.resources[resource] = Math.max(0, (player.resources[resource] || 0) - amount);
  });
  
  // Remover status de eliminado
  player.eliminated = false;
  delete player.eliminatedTurn;
  
  // Adicionar região
  region.controller = playerId;
  player.regions.push(regionId);
  
  // Remover da lista de eliminados
  if (gameState.eliminatedPlayers) {
    gameState.eliminatedPlayers = gameState.eliminatedPlayers.filter(
      p => p.playerId !== playerId
    );
  }
  
  // Se for IA, reativar
  if (player.type === 'ai' || player.isAI) {
    const ai = getAIPlayer(playerId);
    if (ai && ai.activate) {
      ai.activate();
    }
  }
  
  return true;
}

// Função para verificar vitória por eliminação
function checkEliminationVictory() {
  if (gameState.gameEndedByElimination) return;
  
  // Contar jogadores ativos (não eliminados)
  const activePlayers = gameState.players.filter(p => !p.eliminated);
  
  if (activePlayers.length === 0) {
    // Todos os jogadores foram eliminados
    gameState.gameEndedByElimination = true;
    return { type: 'no_winner', message: 'Todos os jogadores foram eliminados!' };
  }
  
  if (activePlayers.length === 1) {
    // Apenas um jogador restante - vencedor por eliminação
    gameState.gameEndedByElimination = true;
    return { 
      type: 'elimination_victory', 
      winner: activePlayers[0],
      message: `${activePlayers[0].name} venceu por eliminação!`
    };
  }
  
  return null;
}

// Função para verificar se um jogador está eliminado
function isPlayerEliminated(playerId) {
  const player = getPlayerById(playerId);
  return player ? player.eliminated : false;
}

// Função para obter jogadores ativos
function getActivePlayers() {
  return gameState.players.filter(p => !p.eliminated);
}

// Função para obter o próximo jogador ativo
function getNextActivePlayer(currentIndex) {
  if (!gameState.players.length) return 0;
  
  let nextIndex = (currentIndex + 1) % gameState.players.length;
  let attempts = 0;
  
  // Procurar próximo jogador não eliminado
  while (gameState.players[nextIndex].eliminated && attempts < gameState.players.length) {
    nextIndex = (nextIndex + 1) % gameState.players.length;
    attempts++;
  }
  
  // Se todos estão eliminados, retornar o atual
  if (gameState.players[nextIndex].eliminated) {
    return currentIndex;
  }
  
  return nextIndex;
}

// Função para verificar se ação é permitida para jogador eliminado
function canEliminatedPlayerAct(playerId, actionType) {
  const player = getPlayerById(playerId);
  if (!player || !player.eliminated) return true;
  
  // Jogadores eliminados só podem dominar regiões neutras (ressuscitar)
  return actionType === 'dominate' || actionType === 'explorar';
}

// ==================== INICIALIZAÇÃO DO JOGO ====================

function initializeGame(playersData) {
  gameState = { ...INITIAL_STATE };
  gameState.eliminatedPlayers = [];
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
      consecutiveNoActionTurns: 0,
      eliminated: false,
      eliminatedTurn: null
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

// Função para verificar se ação pode ser realizada
function canPerformAction(playerId, actionType, context = {}) {
  const player = getPlayerById(playerId);
  if (!player) return { can: false, reason: 'Jogador não encontrado' };
  
  const isEliminated = player.eliminated;
  const currentPhase = gameState.currentPhase;
  const hasActions = gameState.actionsLeft > 0;
  
  // Verificações básicas
  if (isEliminated && !['dominate', 'resurrect'].includes(actionType)) {
    return { can: false, reason: 'Jogador eliminado' };
  }
  
  if (!hasActions) {
    return { can: false, reason: 'Sem ações restantes' };
  }
  
  // Verificações específicas por ação
  switch(actionType) {
    case 'explore':
    case 'collect':
    case 'build':
      if (currentPhase !== 'acoes') {
        return { can: false, reason: 'Ação permitida apenas na fase de Ações' };
      }
      break;
    case 'negotiate':
      if (currentPhase !== 'negociacao') {
        return { can: false, reason: 'Negociação permitida apenas na fase de Negociação' };
      }
      break;
    case 'dispute':
      if (currentPhase !== 'acoes') {
        return { can: false, reason: 'Disputa permitida apenas na fase de Ações' };
      }
      if (!context.regionId) {
        return { can: false, reason: 'Região não especificada' };
      }
      const region = gameState.regions[context.regionId];
      if (!region) {
        return { can: false, reason: 'Região não encontrada' };
      }
      if (region.controller === playerId) {
        return { can: false, reason: 'Você já controla esta região' };
      }
      if (region.controller === null) {
        return { can: false, reason: 'Região neutra (use Dominar)' };
      }
      break;
  }
  
  return { can: true, reason: '' };
}

// Função para consumir ação com validação
function consumeActionWithValidation(playerId, actionType) {
  const validation = canPerformAction(playerId, actionType);
  if (!validation.can) {
    return { success: false, reason: validation.reason };
  }
  
  if (consumeAction()) {
    return { success: true, reason: 'Ação consumida' };
  } else {
    return { success: false, reason: 'Falha ao consumir ação' };
  }
}

// Função para obter estado resumido do jogo
function getGameSummary() {
  return {
    turn: gameState.turn,
    phase: gameState.currentPhase,
    actionsLeft: gameState.actionsLeft,
    currentPlayer: gameState.players[gameState.currentPlayerIndex]?.name,
    players: gameState.players.map(p => ({
      id: p.id,
      name: p.name,
      victoryPoints: p.victoryPoints,
      regions: p.regions.length,
      eliminated: p.eliminated,
      resources: { ...p.resources }
    })),
    regions: {
      total: gameState.regions.length,
      controlled: gameState.regions.filter(r => r.controller !== null).length,
      neutral: gameState.regions.filter(r => r.controller === null).length
    }
  };
}

// ==================== EXPORTAÇÕES ====================
export {
  gameState,
  achievementsState,
  activityLogHistory,
  negotiationState,
  addDisputeRecord,
  
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
  getExploreActionType,
  
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
  
  // Persistência e Saves
  saveGame,
  saveCurrentGame,
  loadGame,
  hasSavedGame,
  getSavedGame,
  deleteSavedGame,
  migrateSaveData,
  getSavedGamesList,
  loadSavedGameById,
  deleteSavedGameById,
  
  // Regras
  getGameRules,
  setGameRules,
  
 // Exportações IA
  aiInstances,
  setAIPlayers,
  getAIPlayer,
  isPlayerAI,
  getAllAIPlayers,

  // Novas funções de eliminação
  eliminatePlayer,
  resurrectPlayer,
  checkEliminationVictory,
  isPlayerEliminated,
  getActivePlayers,
  getNextActivePlayer,
  canEliminatedPlayerAct,
  
  // Constante de configuração
  ELIMINATION_CONFIG,

  // Novas funções
  canPerformAction,
  consumeActionWithValidation,
  getGameSummary,

  // Inicialização
  initializeGame
};
