// game-initializer.js - Serviço de Inicialização do Jogo
import { GAME_CONFIG } from '../state/game-config.js';
import { gameState, getCurrentPlayer, addActivityLog } from '../state/game-state.js';

export class GameInitializer {
  constructor() {
    console.log("🎮 GameInitializer inicializado");
  }

  // ==================== CONFIGURAÇÃO DO MAPA ====================

  setupRegions() {
    gameState.regions = [];
    const total = GAME_CONFIG.GRID_SIZE * GAME_CONFIG.GRID_SIZE;
    
    for (let i = 0; i < total; i++) {
      const biome = this._getRandomBiome();
      const resources = this._generateResourcesForBiome(biome);
      
      gameState.regions.push({
        id: i,
        name: GAME_CONFIG.REGION_NAMES[i] || `Região ${i}`,
        biome,
        explorationLevel: Math.floor(Math.random() * 2),
        resources,
        controller: null,
        structures: []
      });
    }
    
    console.log(`🗺️ ${total} regiões geradas.`);
    return gameState.regions;
  }

  _getRandomBiome() {
    const biomes = GAME_CONFIG.BIOMES;
    return biomes[Math.floor(Math.random() * biomes.length)];
  }

  _generateResourcesForBiome(biome) {
    switch(biome) {
      case 'Floresta Tropical': return { madeira:6, pedra:1, ouro:0, agua:3 };
      case 'Floresta Temperada': return { madeira:5, pedra:2, ouro:0, agua:2 };
      case 'Savana': return { madeira:2, pedra:1, ouro:3, agua:1 };
      case 'Pântano': return { madeira:1, pedra:3, ouro:0, agua:4 };
      default: return { madeira:2, pedra:2, ouro:1, agua:1 };
    }
  }

  // ==================== DISTRIBUIÇÃO INICIAL ====================

  distributeInitialRegions() {
    const total = gameState.regions.length;
    const indices = [...Array(total).keys()].sort(() => Math.random() - 0.5);
    let idx = 0;
    
    // Limpar regiões anteriores dos jogadores
    gameState.players.forEach(p => p.regions = []);
    
    // Distribuir 4 regiões para cada jogador
    for (let p = 0; p < gameState.players.length; p++) {
      for (let r = 0; r < 4 && idx < indices.length; r++) {
        const regionId = indices[idx++];
        gameState.regions[regionId].controller = p;
        gameState.players[p].regions.push(regionId);
      }
    }
    
    console.log("🗺️ Regiões iniciais distribuídas.");
    return gameState.players.map(p => ({
      player: p.name,
      regions: p.regions.length
    }));
  }

  // ==================== INICIALIZAÇÃO COMPLETA ====================

  initializeGame() {
    console.log("🎮 GameInitializer: Iniciando jogo...");
    
    try {
      // 1. Configurar Mapa
      this.setupRegions();
      
      // 2. Distribuir Regiões Iniciais
      this.distributeInitialRegions();
      
      // 3. Configurar Estado Inicial
      gameState.gameStarted = true;
      gameState.turn = 1;
      gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
      gameState.currentPhase = 'renda';
      gameState.currentPlayerIndex = 0;
      gameState.selectedPlayerForSidebar = 0;
      
      // 4. Registrar Log
      addActivityLog({
        type: 'system',
        playerName: 'SISTEMA',
        action: 'Jogo iniciado',
        details: '',
        turn: gameState.turn
      });
      
      console.log("✅ GameInitializer: Jogo inicializado com sucesso");
      return true;
      
    } catch (error) {
      console.error("❌ GameInitializer: Erro na inicialização:", error);
      return false;
    }
  }

  // ==================== VALIDAÇÃO DE INICIALIZAÇÃO ====================

  validateGameState() {
    const errors = [];
    
    if (!gameState.players || gameState.players.length < GAME_CONFIG.MIN_PLAYERS) {
      errors.push(`Número insuficiente de jogadores (mínimo: ${GAME_CONFIG.MIN_PLAYERS})`);
    }
    
    if (!gameState.regions || gameState.regions.length === 0) {
      errors.push('Nenhuma região configurada');
    }
    
    if (gameState.turn < 1) {
      errors.push('Turno inválido');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // ==================== REINICIALIZAÇÃO ====================

  resetGame() {
    console.log("🔄 GameInitializer: Resetando jogo...");
    
    // Preservar configuração de jogadores
    const players = [...gameState.players];
    
    // Resetar estado do jogo
    gameState.regions = [];
    gameState.turn = 1;
    gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
    gameState.currentPhase = 'renda';
    gameState.currentPlayerIndex = 0;
    gameState.selectedRegionId = null;
    gameState.selectedPlayerForSidebar = 0;
    
    // Resetar jogadores
    gameState.players = players.map(p => ({
      ...p,
      resources: { ...GAME_CONFIG.INITIAL_RESOURCES },
      victoryPoints: 0,
      regions: [],
      consecutiveNoActionTurns: 0,
      eliminated: false,
      eliminatedTurn: null
    }));
    
    return gameState.players;
  }
}
