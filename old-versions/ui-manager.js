// ui-manager.js - Core da Interface do Usuário
import {
  gameState,
  achievementsState,
  getCurrentPlayer,
  activityLogHistory,
  setAIPlayers,
  getAIPlayer,
  isPlayerAI,
  aiInstances 
 } from './game-state.js';
import { GAME_CONFIG, RESOURCE_ICONS, ACHIEVEMENTS_CONFIG } from './game-config.js';
import { AIFactory, AI_DIFFICULTY_SETTINGS } from './ai-system.js';
import { ModalManager } from './ui-modals.js';
import { NegotiationUI } from './ui-negotiation.js';

// ==================== CONSTANTES DO UI ====================
const PHASE_NAMES = {
  'renda': '💰 Renda',
  'acoes': '⚡ Ações',
  'negociacao': '🤝 Negociação'
};

const LOG_ICONS = {
  'action': '⚡',
  'build': '🏗️',
  'explore': '⛏️',
  'collect': '🌾',
  'negotiate': '🤝',
  'event': '🎴',
  'victory': '🏆',
  'phase': '🔄',
  'turn': '📅',
  'system': '⚙️',
  'income': '💰',
  'default': '📝'
};

const ACTION_COSTS = {
  'explorar': { madeira: 2, agua: 1 },
  'recolher': { madeira: 1 },
  'construir': { madeira: 3, pedra: 2, ouro: 1 },
  'negociar': { ouro: 1 }
};

class UIManager {
  constructor() {
    this.modals = new ModalManager(this);
    this.negotiation = new NegotiationUI(this);
    this.editingIndex = null;
    this.cacheElements();
    this.setupEventListeners();
    this.setupTransparencyControls();

    // Configurar botões de IA após um pequeno delay
    setTimeout(() => {
       this.addAIPlayerButton();
    }, 100);

  }

// ==================== AÇÕES DE IA ====================
  
addAIPlayer(difficulty = 'medium', name = null) {
  if (gameState.players.length >= 4) {
    this.modals.showFeedback('Máximo de 4 jogadores atingido.', 'warning');
    return null;
  }
  
  // Nomes temáticos para IA
  const aiNames = {
    easy: ['Aprendiz de Gaia', 'Novato das Florestas', 'Iniciante dos Pântanos'],
    medium: ['Estrategista das Savanas', 'Planejador das Matas', 'Administrador dos Rios'],
    hard: ['Mestre das Montanhas', 'Sábio das Planícies', 'Arquiteto de Gaia'],
    master: ['Lenda Viva', 'Guardião Ancestral', 'Druida Supremo']
  };
  
  const aiIcons = ['🤖', '👾', '👽', '🎮', '🤯', '🧠', '👑', '⚡'];
  const difficulties = ['easy', 'medium', 'hard', 'master'];
  
  const selectedDifficulty = difficulties.includes(difficulty) ? difficulty : 'medium';
  const nameList = aiNames[selectedDifficulty];
  const aiName = name || nameList[Math.floor(Math.random() * nameList.length)];
  
  const color = GAME_CONFIG.PLAYER_COLORS[gameState.players.length % GAME_CONFIG.PLAYER_COLORS.length];
  
  const player = {
    id: gameState.players.length,
    name: `${aiName}`,
    originalName: aiName,
    icon: aiIcons[gameState.players.length % aiIcons.length],
    color,
    resources: {...GAME_CONFIG.INITIAL_RESOURCES},
    victoryPoints: 0,
    regions: [],
    consecutiveNoActionTurns: 0,
    type: 'ai',
    aiDifficulty: selectedDifficulty,
    isAI: true // Para compatibilidade
  };
  
  gameState.players.push(player);
  
  // Atualizar UI
  this.updatePlayerCountDisplay();
  this.renderRegisteredPlayersList();
  
  const diffName = AI_DIFFICULTY_SETTINGS[selectedDifficulty].name;
  this.modals.showFeedback(`IA ${aiName} adicionada (${diffName})`, 'success');
  
  return player;
}

  cacheElements() {
    // Elementos principais
    this.initialScreen = document.getElementById('initialScreen');
    this.gameNavbar = document.getElementById('gameNavbar');
    this.gameContainer = document.getElementById('gameContainer');
    this.sidebar = document.getElementById('sidebar');
    this.gameMap = document.getElementById('gameMap');
    this.gameFooter = document.getElementById('gameFooter');
    
    // Elementos do sidebar
    this.sidebarPlayerHeader = document.getElementById('sidebarPlayerHeader');
    this.resourceList = document.getElementById('resourceList');
    this.controlledRegions = document.getElementById('controlledRegions');
    
    // Elementos do footer
    this.actionExploreBtn = document.getElementById('actionExplore');
    this.actionCollectBtn = document.getElementById('actionCollect');
    this.actionBuildBtn = document.getElementById('actionBuild');
    this.actionNegotiateBtn = document.getElementById('actionNegotiate');
    this.endTurnBtn = document.getElementById('endTurnBtn');
    this.actionsLeftEl = document.getElementById('actionsLeft');
    this.phaseIndicator = document.getElementById('phaseIndicator');
    
    // Board
    this.boardContainer = document.getElementById('boardContainer');
    
    // Registro de jogadores
    this.playerNameInput = document.getElementById('playerName');
    this.iconSelection = document.getElementById('iconSelection');
    this.addPlayerBtn = document.getElementById('addPlayerBtn');
    this.startGameBtn = document.getElementById('startGameBtn');
    this.registeredPlayersList = document.getElementById('registeredPlayersList');
    this.cancelEditBtn = document.getElementById('cancelEditBtn');
    this.playerCountDisplay = document.getElementById('playerCountDisplay');
    
    // Tooltip
    this.regionTooltip = document.getElementById('regionTooltip');
    this.tooltipTitle = document.getElementById('tooltipTitle');
    this.tooltipBody = document.getElementById('tooltipBody');
    
    // Activity Log elements
    this.activityLog = document.getElementById('activityLog');
    this.logEntries = document.getElementById('logEntries');
    this.logFilterAll = document.getElementById('logFilterAll');
    this.logFilterMine = document.getElementById('logFilterMine');
    this.logFilterEvents = document.getElementById('logFilterEvents');
    
    // Activity Log Sidebar elements
    this.logEntriesSidebar = document.getElementById('logEntriesSidebar');
    this.logFilterAllSidebar = document.getElementById('logFilterAllSidebar');
    this.logFilterMineSidebar = document.getElementById('logFilterMineSidebar');
    this.logFilterEventsSidebar = document.getElementById('logFilterEventsSidebar');
    
    // Header elements
    this.playerHeaderList = document.getElementById('playerHeaderList');
    this.turnInfo = document.getElementById('turnInfo');
  }

  setupEventListeners() {
    // Início do jogo
    this.addPlayerBtn?.addEventListener('click', () => this.handleAddPlayer());
    this.startGameBtn?.addEventListener('click', () => this.handleStartGame());
    this.cancelEditBtn?.addEventListener('click', () => this.cancelEdit());
    
    // Ações principais (delegam para game-logic.js)
    this.actionExploreBtn?.addEventListener('click', () => window.gameLogic.handleExplore());
    this.actionCollectBtn?.addEventListener('click', () => window.gameLogic.handleCollect());
    this.endTurnBtn?.addEventListener('click', () => window.gameLogic.handleEndTurn());
    
    // Ações principais (que estão em ui-modals.js)
    this.actionNegotiateBtn?.addEventListener('click', () => this.negotiation.openNegotiationModal ());
    this.actionBuildBtn?.addEventListener('click', () => this.modals.openStructureModal ());

    // Navegação
    document.getElementById('manualIcon')?.addEventListener('click', () => this.modals.openManual());
    document.getElementById('manualIconNavbar')?.addEventListener('click', () => this.modals.openManual());
    document.getElementById('achievementsNavBtn')?.addEventListener('click', () => this.modals.renderAchievementsModal());

    // Activity Log filters
    this.logFilterAll?.addEventListener('click', () => this.renderActivityLog('all'));
    this.logFilterMine?.addEventListener('click', () => this.renderActivityLog('mine'));
    this.logFilterEvents?.addEventListener('click', () => this.renderActivityLog('events'));
    this.logFilterAllSidebar?.addEventListener('click', () => this.renderActivityLog('all'));
    this.logFilterMineSidebar?.addEventListener('click', () => this.renderActivityLog('mine'));
    this.logFilterEventsSidebar?.addEventListener('click', () => this.renderActivityLog('events'));
    
    // Header player buttons
    if (this.playerHeaderList) {
      this.playerHeaderList.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-index]');
        if (button) {
          const idx = Number(button.dataset.index);
          gameState.selectedPlayerForSidebar = idx;
          this.renderSidebar(idx);
        }
      });
    }

    // Listener global para desselecionar regiões
    document.addEventListener('click', (e) => {
      const isRegionCell = e.target.closest('.board-cell');
      const isActionButton = e.target.closest('.action-btn, #endTurnBtn');
      const isGameFooter = e.target.closest('#gameFooter');
      const isModal = e.target.closest('[id$="Modal"]');
      const isStructureOption = e.target.closest('.structure-option');
      
      if (!isRegionCell && !isActionButton && !isGameFooter && !isModal && 
          !isStructureOption && gameState.selectedRegionId !== null) {
        
        this.clearRegionSelection();
        this.updateFooter();
        this.renderSidebar(gameState.selectedPlayerForSidebar);
      }
    });

    // Tecla ESC para cancelar edição
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.editingIndex !== null) {
        e.preventDefault();
        this.cancelEdit();
      }
    });

  // Atalho para debug (Ctrl+Shift+I)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      const panel = document.getElementById('aiDebugPanel');
      panel.classList.toggle('hidden');
      if (!panel.classList.contains('hidden') && window.aiDebugUpdate) {
        window.aiDebugUpdate();
      }
    }
  });


  }

initializeSafely() {
  try {
    // Verificar se achievementsState existe
    if (typeof achievementsState === 'undefined') {
      console.warn('achievementsState não definida, inicializando...');
      // Podemos tentar carregar do localStorage ou usar fallback
      if (window.getAchievementsState) {
        const state = window.getAchievementsState();
        if (state) {
          window.achievementsState = state;
        }
      }
    }
    
    // Verificar se ACHIEVEMENTS_CONFIG existe
    if (typeof ACHIEVEMENTS_CONFIG === 'undefined') {
      console.error('ACHIEVEMENTS_CONFIG não está disponível');
      return;
    }
    
    return true;
  } catch (error) {
    console.error('Erro na inicialização segura:', error);
    return false;
  }
}

  // ==================== MÉTODOS PRINCIPAIS ====================
  
  updateUI() {
    this.renderHeaderPlayers();
    this.renderBoard();
    this.renderSidebar(gameState.selectedPlayerForSidebar);
    this.updateFooter();
    this.updateTurnInfo();
    this.modals.updateEventBanner();
    this.renderActivityLog();
    this.updatePhaseIndicator();
  }

  renderHeaderPlayers() {
    if (!this.playerHeaderList) return;
    
    this.playerHeaderList.innerHTML = gameState.players.map((p, i) => `
      <button data-index="${i}" 
              class="px-3 py-1 rounded-lg ${i === gameState.currentPlayerIndex ? 'ring-2 ring-yellow-300' : 'bg-white/5'} 
                     text-white text-sm flex items-center gap-2">
        <div class="text-xl">${p.icon}</div>
        <div>
          <div class="font-medium">${p.name}</div>
          <div class="text-xs text-yellow-400">${p.victoryPoints} PV</div>
        </div>
      </button>
    `).join('');
  }

  renderBoard() {
    this.boardContainer.innerHTML = '';
    gameState.regions.forEach((region, index) => {
      const cell = this.createRegionCell(region, index);
      this.boardContainer.appendChild(cell);
    });
  }

  createRegionCell(region, index) {
    const cell = document.createElement('div');
    cell.className = 'board-cell';
    cell.dataset.regionId = region.id;
    cell.dataset.region = String.fromCharCode(65 + region.id);
    
    if (region.controller !== null) {
      cell.classList.add('controlled');
      const player = gameState.players[region.controller];
      const rgb = this.hexToRgb(player.color);
      cell.style.setProperty('--player-rgb', rgb.join(', '));
      cell.style.setProperty('--player-color', player.color);
    } else {
      cell.classList.add('neutral');
    }
    
    const header = document.createElement('div');
    header.className = 'flex items-start justify-between mb-1';
    header.innerHTML = `
      <div>
        <div class="text-xs font-bold text-white leading-tight">${region.name}</div>
        <div class="text-[9px] text-gray-300 mt-0.5">${region.biome}</div>
      </div>
      <div class="text-xs text-yellow-300 font-bold flex items-center gap-0.5">
        ${region.explorationLevel}<span class="text-[10px]">⭐</span>
      </div>
    `;
    
    const resourcesLine = document.createElement('div');
    resourcesLine.className = 'flex items-center justify-between gap-1 mt-1';
    
    const resourceOrder = ['madeira', 'pedra', 'ouro', 'agua'];
    const resourcePairs = [];
    
    resourceOrder.forEach(key => {
      const value = region.resources[key] || 0;
      if (value > 0) {
        resourcePairs.push({
          icon: RESOURCE_ICONS[key],
          value: value,
          key: key
        });
      }
    });
    
    resourcePairs.forEach((resource, idx) => {
      const pair = document.createElement('div');
      pair.className = 'flex items-center gap-0.5 flex-1 justify-center';
      pair.innerHTML = `
        <span class="text-xs">${resource.icon}</span>
        <span class="text-xs font-bold text-white">${resource.value}</span>
      `;
      resourcesLine.appendChild(pair);
    });
    
    if (resourcePairs.length === 0) {
      const placeholder = document.createElement('div');
      placeholder.className = 'text-[9px] text-gray-400 italic flex-1 text-center';
      placeholder.textContent = 'Sem recursos';
      resourcesLine.appendChild(placeholder);
    }
    
    const footer = document.createElement('div');
    footer.className = 'flex items-center justify-between mt-2 pt-1 border-t border-white/5';
    
    const controller = region.controller !== null 
      ? gameState.players[region.controller].icon
      : '<span class="text-gray-400 text-xs">🏳️</span>';

    let structureDisplay = '—';
    if (region.structures.length > 0) {
      const structureIcons = {
        'Abrigo': '🛖',
        'Torre de Vigia': '🏯',
        'Mercado': '🏪',
        'Laboratório': '🔬',
        'Santuário': '🛐'
      };
      
      structureDisplay = structureIcons[region.structures[0]] || '🏗️';
      if (region.structures.length > 1) {
        structureDisplay += `+${region.structures.length - 1}`;
      }
    }

    footer.innerHTML = `
      <div class="text-xs font-medium text-white">${controller}</div>
      <div class="text-xs">${structureDisplay}</div>
    `;
    
    cell.appendChild(header);
    cell.appendChild(resourcesLine);
    cell.appendChild(footer);
    
    cell.addEventListener('click', (e) => {
      e.stopPropagation();
      
      const regionId = Number(cell.dataset.regionId);
      
      // Verificar se não está clicando em um modal
      const clickedInModal = e.target.closest('[id$="Modal"]') || 
                            e.target.closest('#negotiationModal') || 
                            e.target.closest('#negResponseModal');
      
      if (clickedInModal) return;
      
      // Alternar seleção
      if (gameState.selectedRegionId === regionId) {
        gameState.selectedRegionId = null;
        cell.classList.remove('region-selected');
      } else {
        const previousSelected = gameState.selectedRegionId;
        gameState.selectedRegionId = regionId;
        
        if (previousSelected !== null) {
          const prevCell = document.querySelector(`.board-cell[data-region-id="${previousSelected}"]`);
          if (prevCell) prevCell.classList.remove('region-selected');
        }
        
        cell.classList.add('region-selected');
      }
      
      this.renderSidebar(gameState.selectedPlayerForSidebar);
      this.updateFooter();
    });
    
    // Tooltip events
    cell.addEventListener('mouseenter', (e) => this.showRegionTooltip(region, e.currentTarget));
    cell.addEventListener('mousemove', (e) => this.positionTooltip(e.currentTarget));
    cell.addEventListener('mouseleave', () => this.hideRegionTooltip());
    
    return cell;
  }

  renderSidebar(playerIndex = gameState.selectedPlayerForSidebar) {
  const player = gameState.players[playerIndex];
  if (!player) return;
  
  const isCurrentPlayer = playerIndex === gameState.currentPlayerIndex;
  
  this.sidebarPlayerHeader.innerHTML = `
    <div class="flex items-center gap-3 p-2 rounded-lg" 
         style="border-left: 4px solid ${player.color}; background: rgba(${this.hexToRgb(player.color).join(', ')}, 0.05)">
      <div class="text-3xl">${player.icon}</div>
      <div class="flex-1">
        <div class="text-base font-semibold text-white">${player.name}</div>
        <div class="text-xs text-gray-300">
          Jogador ${player.id + 1} ${isCurrentPlayer ? '• 🎮 TURNO' : ''}
        </div>
      </div>
      <div class="text-2xl font-bold text-yellow-400">${player.victoryPoints} PV</div>
    </div>
  `;
    
    this.resourceList.innerHTML = Object.entries(player.resources)
      .map(([key, value]) => `
        <li class="flex justify-between items-center py-0.5">
          <span class="text-sm text-gray-200 flex items-center gap-1.5">
            <span class="text-base">${RESOURCE_ICONS[key]}</span>
            <span class="capitalize">${key}</span>
          </span>
          <span class="text-sm font-bold text-white">${value}</span>
        </li>
      `).join('');
    
    this.renderControlledRegions(player);
    this.renderAchievementsInSidebar(playerIndex);
    this.renderActivityLog('all');
  }

renderAchievementsInSidebar(playerIndex) {
  const achievementsList = document.getElementById('achievementsList');
  if (!achievementsList || !achievementsState) return;

  // Verificação de segurança
  if (typeof achievementsState === 'undefined' || !achievementsState.playerAchievements) {
    achievementsList.innerHTML = '<p class="text-xs text-gray-400">Carregando conquistas...</p>';
    return;
  }
  
  const playerStats = achievementsState.playerAchievements?.[playerIndex] || {
    explored: 0,
    built: 0,
    negotiated: 0,
    collected: 0,
    controlledBiomes: new Set(),
    maxResources: { madeira: 0, pedra: 0, ouro: 0, agua: 0 }
  };
  
  const unlocked = achievementsState.unlockedAchievements?.[playerIndex] || [];
  
  if (unlocked.length === 0) {
    achievementsList.innerHTML = '<p class="text-xs text-gray-400">Nenhuma conquista ainda</p>';
    return;
  }
  
  let html = '';
  const achievementsToShow = unlocked.slice(0, 3);
  
  achievementsToShow.forEach(achievementId => {
    // Encontrar a conquista pelo ID
    let achievement;
    for (const key in ACHIEVEMENTS_CONFIG) {
      if (ACHIEVEMENTS_CONFIG[key].id === achievementId) {
        achievement = ACHIEVEMENTS_CONFIG[key];
        break;
      }
    }
    
    if (achievement) {
      html += `
        <div class="flex items-center gap-2 p-2 bg-gray-800/30 rounded border border-yellow-500/20">
          <span class="text-lg">${achievement.icon}</span>
          <div class="text-xs">
            <div class="text-yellow-300 font-semibold">${achievement.name}</div>
            <div class="text-gray-400 truncate">${achievement.description}</div>
          </div>
        </div>
      `;
    }
  });
  
  if (unlocked.length > 3) {
    html += `<div class="text-center text-xs text-gray-500 mt-1">
      +${unlocked.length - 3} mais conquistas
    </div>`;
  }
  
  achievementsList.innerHTML = html;
}

  renderControlledRegions(player) {
    if (player.regions.length === 0) {
      this.controlledRegions.innerHTML = `
        <div class="text-sm text-gray-400 italic">Nenhuma região controlada</div>
      `;
      return;
    }
    
    const regionsByBiome = {};
    player.regions.forEach(regionId => {
      const region = gameState.regions[regionId];
      if (!regionsByBiome[region.biome]) {
        regionsByBiome[region.biome] = [];
      }
      regionsByBiome[region.biome].push(region);
    });
    
    const biomeEmojis = {
      'Floresta Tropical': '🌴',
      'Floresta Temperada': '🌲',
      'Savana': '🏜️',
      'Pântano': '🌊'
    };
    
    this.controlledRegions.innerHTML = Object.entries(regionsByBiome)
      .map(([biome, regions]) => {
        const regionLetters = regions.map(r => r.name.split(' ').pop());
        return `
          <div class="mb-2">
            <div class="text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1">
              <span>${biomeEmojis[biome] || '🗺️'}</span>
              <span>${biome}</span>
              <span class="text-yellow-400">(${regions.length})</span>
            </div>
            <div class="flex flex-wrap gap-1">
              ${regionLetters.map(letter => `
                <span class="text-xs font-medium bg-white/5 px-1.5 py-0.5 rounded border border-white/10" 
                      style="border-left: 3px solid ${player.color}">
                  ${letter}
                </span>
              `).join('')}
            </div>
          </div>
        `;
      }).join('');
  }

  updateFooter() {
  if (!gameState.gameStarted) {
    [this.actionExploreBtn, this.actionCollectBtn, this.actionBuildBtn, this.actionNegotiateBtn]
      .forEach(b => {
        if (b) b.disabled = true;
      });
    
    if (this.endTurnBtn) {
      this.endTurnBtn.disabled = true;
      this.endTurnBtn.textContent = 'Jogo não iniciado';
    }
    return;
  }
  
  const player = gameState.players[gameState.currentPlayerIndex];
  const regionId = gameState.selectedRegionId;
  const currentPhase = gameState.currentPhase || 'renda';
  const isActionPhase = currentPhase === 'acoes';
  const isNegotiationPhase = currentPhase === 'negociacao';
  
  this.updatePhaseIndicator();
  
  if (!player) return;
  
  const baseEnabled = gameState.actionsLeft > 0;
  
  // Botão Explorar
  if (regionId === null || regionId === undefined) {
    if (this.actionExploreBtn) this.actionExploreBtn.disabled = true;
    if (this.actionCollectBtn) this.actionCollectBtn.disabled = true;
    if (this.actionBuildBtn) this.actionBuildBtn.disabled = true;
  } else {
    const region = gameState.regions[regionId];
    if (!region) return;
    
    const isOwnRegion = region.controller === player.id;
    const isNeutral = region.controller === null;
    const canCollect = isOwnRegion && region.explorationLevel > 0;
    
    if (isNeutral) {
      const hasEnoughPV = player.victoryPoints >= 2;
      const canPayBiome = Object.entries(region.resources)
        .every(([key, value]) => player.resources[key] >= value);
      if (this.actionExploreBtn) {
        this.actionExploreBtn.disabled = !baseEnabled || !isActionPhase || !hasEnoughPV || !canPayBiome;
        this.actionExploreBtn.textContent = 'Assumir Domínio';
      }
    } else if (isOwnRegion) {
      const canAfford = this.canPlayerAffordAction('explorar', player);
      if (this.actionExploreBtn) {
        this.actionExploreBtn.disabled = !baseEnabled || !isActionPhase || !canAfford;
        this.actionExploreBtn.textContent = 'Explorar';
      }
    } else {
      if (this.actionExploreBtn) {
        this.actionExploreBtn.disabled = true;
        this.actionExploreBtn.textContent = 'Explorar';
      }
    }
    
    if (this.actionBuildBtn) {
      this.actionBuildBtn.disabled = !baseEnabled || !isActionPhase || !isOwnRegion || 
                                     !this.canPlayerAffordAction('construir', player);
    }
    
    if (this.actionCollectBtn) {
      this.actionCollectBtn.disabled = !baseEnabled || !isActionPhase || !canCollect || 
                                   !this.canPlayerAffordAction('recolher', player);
    }
  }
  
  // Botão Negociar (só disponível na fase de negociação)
  if (this.actionNegotiateBtn) {
    if (isNegotiationPhase) {
      const hasGold = player.resources.ouro >= 1;
      const hasActions = gameState.actionsLeft > 0;
      
      this.actionNegotiateBtn.disabled = !hasGold || !hasActions;
      
      if (!hasGold) {
        this.actionNegotiateBtn.title = 'Necessita 1 Ouro';
      } else if (!hasActions) {
        this.actionNegotiateBtn.title = 'Sem ações restantes';
      } else {
        this.actionNegotiateBtn.title = 'Abrir negociação';
      }
      
      this.actionNegotiateBtn.classList.remove('bg-gray-600', 'opacity-50');
      this.actionNegotiateBtn.classList.add('bg-green-600');
    } else {
      this.actionNegotiateBtn.disabled = true;
      this.actionNegotiateBtn.classList.remove('bg-green-600');
      this.actionNegotiateBtn.classList.add('bg-gray-600', 'opacity-50');
      this.actionNegotiateBtn.title = 'Disponível apenas na fase de negociação';
    }
  }
  
  // Atualizar contador de ações
  if (this.actionsLeftEl) {
    this.actionsLeftEl.textContent = `Ações restantes: ${gameState.actionsLeft}`;
  }
  
  // Botão Terminar Turno
  if (this.endTurnBtn) {
    switch(currentPhase) {
      case 'acoes':
        this.endTurnBtn.disabled = false;
        this.endTurnBtn.textContent = 'Ir para Negociação';
        this.endTurnBtn.className = 'px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold transition';
        break;
      case 'negociacao':
        this.endTurnBtn.disabled = false;
        this.endTurnBtn.textContent = 'Terminar Turno';
        this.endTurnBtn.className = 'px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-semibold transition';
        break;
      case 'renda':
        this.endTurnBtn.disabled = true;
        this.endTurnBtn.textContent = 'Aguardando...';
        this.endTurnBtn.className = 'px-4 py-2 bg-gray-600 rounded-md text-white font-semibold';
        break;
      default:
        this.endTurnBtn.disabled = false;
        this.endTurnBtn.textContent = 'Terminar Turno';
        this.endTurnBtn.className = 'px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold transition';
    }
  }
}

  updatePhaseIndicator() {
    if (this.phaseIndicator) {
      this.phaseIndicator.textContent = `Fase: ${PHASE_NAMES[gameState.currentPhase] || 'Renda'}`;
    }
  }

  updateTurnInfo() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (this.turnInfo) {
      this.turnInfo.textContent = `Turno: ${gameState.turn} • Jogador: ${currentPlayer?.name || '—'}`;
    }
  }

  canPlayerAffordAction(actionType, player) {
    const cost = ACTION_COSTS[actionType] || {};
    return Object.entries(cost).every(([resource, amount]) => {
      return (player.resources[resource] || 0) >= amount;
    });
  }

  // ==================== REGISTRO DE JOGADORES ====================
  
  renderIconSelection() {
    this.iconSelection.innerHTML = '';
    GAME_CONFIG.PLAYER_ICONS.forEach(icon => {
      const el = document.createElement('div');
      el.className = 'icon-option';
      el.textContent = icon;
      el.title = `Ícone ${icon}`;
      el.addEventListener('click', () => {
        document.querySelectorAll('.icon-option').forEach(e => e.classList.remove('selected'));
        el.classList.add('selected');
      });
      this.iconSelection.appendChild(el);
    });
  }

  handleAddPlayer() {
    if (this.editingIndex !== null) {
      this.updatePlayer(this.editingIndex);
      return;
    }
    
    const name = this.playerNameInput.value.trim();
    const selected = document.querySelector('.icon-option.selected');
    
    if (!name || !selected) {
      this.modals.showFeedback('Informe o nome e selecione um ícone.', 'error');
      return;
    }
    
    if (gameState.players.length >= 4) {
      this.modals.showFeedback('Máximo de 4 jogadores atingido.', 'warning');
      return;
    }
    
    const color = GAME_CONFIG.PLAYER_COLORS[gameState.players.length % GAME_CONFIG.PLAYER_COLORS.length];
    const player = {
      id: gameState.players.length,
      name,
      icon: selected.textContent.trim(),
      color,
      resources: {...GAME_CONFIG.INITIAL_RESOURCES},
      victoryPoints: 0,
      regions: [],
      consecutiveNoActionTurns: 0
    };
    
    gameState.players.push(player);
    this.resetAddPlayerForm();
    this.updatePlayerCountDisplay();
    this.renderRegisteredPlayersList();
    this.modals.showFeedback(`Jogador ${name} adicionado com sucesso!`, 'success');
  }

  resetAddPlayerForm() {
    this.playerNameInput.value = '';
    document.querySelectorAll('.icon-option.selected').forEach(el => {
      el.classList.remove('selected');
    });
  }

  renderRegisteredPlayersList() {
    const players = gameState.players;
    const canEdit = !gameState.gameStarted;
    
    if (players.length === 0) {
      this.registeredPlayersList.innerHTML = `
        <div class="text-sm text-gray-300 p-3 text-center italic">
          Nenhum jogador cadastrado.
          <div class="text-xs text-gray-400 mt-1">Adicione pelo menos 2 jogadores</div>
        </div>
      `;
      return;
    }
    
    // Na função renderRegisteredPlayersList, modifique o template do jogador para:
this.registeredPlayersList.innerHTML = players.map((p, index) => `
  <div class="player-card group flex items-center justify-between gap-2 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
       style="border-left: 4px solid ${p.color}">
    <div class="flex items-center gap-3 flex-1">
      <div class="text-3xl">${p.icon}</div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-semibold text-white truncate">
          ${p.name}
          ${p.type === 'ai' ? `<span class="text-xs ml-1 px-1.5 py-0.5 rounded ${this.getAIDifficultyClass(p.aiDifficulty)}">IA</span>` : ''}
        </div>
        <div class="text-xs text-gray-400">
          Jogador ${index + 1} • ${p.victoryPoints} PV
          ${p.type === 'ai' ? ` • ${AI_DIFFICULTY_SETTINGS[p.aiDifficulty].name}` : ''}
        </div>
      </div>
    </div>
    
    ${canEdit ? `
    <div class="player-actions flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      ${p.type !== 'ai' ? `
      <button class="edit-player-btn p-2 rounded-md hover:bg-white/10 transition" 
              data-index="${index}"
              title="Editar jogador">
        <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
      </button>
      ` : ''}
      
      <button class="delete-player-btn p-2 rounded-md hover:bg-white/10 transition" 
              data-index="${index}"
              title="${p.type === 'ai' ? 'Remover IA' : 'Remover jogador'}">
        <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
    </div>
    ` : ''}
  </div>
`).join('');
  
  // Adicionar event listeners se puder editar
  if (canEdit) {
    this.setupPlayerActionListeners();
  }
}

  setupPlayerActionListeners() {
    this.registeredPlayersList.querySelectorAll('.edit-player-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        this.editPlayer(index);
      });
    });
    
    this.registeredPlayersList.querySelectorAll('.delete-player-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        this.deletePlayer(index);
      });
    });
  }

  editPlayer(index) {
    if (gameState.gameStarted) {
      this.modals.showFeedback('Não é possível editar jogadores após o início do jogo.', 'warning');
      return;
    }
    
    const player = gameState.players[index];
    if (!player) return;
    
    this.editingIndex = index;
    this.playerNameInput.value = player.name;
    this.playerNameInput.focus();
    
    document.querySelectorAll('.icon-option').forEach(iconEl => {
      const iconText = iconEl.textContent.trim();
      if (iconText === player.icon) {
        iconEl.classList.add('selected');
        iconEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        iconEl.classList.remove('selected');
      }
    });
    
    this.addPlayerBtn.textContent = 'Atualizar Jogador';
    this.addPlayerBtn.classList.remove('bg-green-600');
    this.addPlayerBtn.classList.add('bg-blue-600');
    this.cancelEditBtn.classList.remove('hidden');
    this.highlightPlayerBeingEdited(index);
    
    this.modals.showFeedback(`Editando ${player.name}. Altere os dados e clique em "Atualizar Jogador".`, 'info');
  }

  highlightPlayerBeingEdited(index) {
    document.querySelectorAll('.player-card').forEach((card, i) => {
      if (i === index) {
        card.classList.add('ring-2', 'ring-blue-500');
        card.style.transform = 'translateY(-2px)';
      } else {
        card.classList.remove('ring-2', 'ring-blue-500');
        card.style.transform = '';
      }
    });
  }

  cancelEdit() {
    this.addPlayerBtn.textContent = 'Adicionar';
    this.addPlayerBtn.classList.remove('bg-blue-600');
    this.addPlayerBtn.classList.add('bg-green-600');
    this.cancelEditBtn.classList.add('hidden');
    this.playerNameInput.value = '';
    this.playerNameInput.blur();
    
    document.querySelectorAll('.icon-option.selected').forEach(el => {
      el.classList.remove('selected');
    });
    
    this.clearPlayerHighlight();
    this.editingIndex = null;
    this.modals.showFeedback('Edição cancelada.', 'info');
  }

  clearPlayerHighlight() {
    document.querySelectorAll('.player-card').forEach(card => {
      card.classList.remove('ring-2', 'ring-blue-500');
      card.style.transform = '';
    });
  }

  async deletePlayer(index) {
    if (gameState.gameStarted) {
      this.modals.showFeedback('Não é possível remover jogadores após o início do jogo.', 'warning');
      return;
    }
    
    if (gameState.players.length <= 2) {
      this.modals.showFeedback('É necessário pelo menos 2 jogadores para iniciar o jogo.', 'error');
      return;
    }
    
    const player = gameState.players[index];
    const confirmed = await this.modals.showConfirm(
      'Remover Jogador',
      `Tem certeza que deseja remover "${player.name}" (${player.icon})?`
    );
    
    if (!confirmed) return;
    
    gameState.players.splice(index, 1);
    gameState.players.forEach((p, i) => {
      p.id = i;
    });
    
    this.updatePlayerCountDisplay();
    this.renderRegisteredPlayersList();
    this.modals.showFeedback(`Jogador ${player.name} removido com sucesso!`, 'success');
  }

  updatePlayer(index) {
    const name = this.playerNameInput.value.trim();
    const selected = document.querySelector('.icon-option.selected');
    
    if (!name || !selected) {
      this.modals.showFeedback('Informe o nome e selecione um ícone.', 'error');
      return;
    }
    
    const newIcon = selected.textContent.trim();
    const isIconUsed = gameState.players.some((p, i) => i !== index && p.icon === newIcon);
    if (isIconUsed) {
      this.modals.showFeedback('Este ícone já está sendo usado por outro jogador.', 'error');
      return;
    }
    
    gameState.players[index] = {
      ...gameState.players[index],
      name,
      icon: newIcon
    };
    
    this.cancelEdit();
    this.updatePlayerCountDisplay();
    this.renderRegisteredPlayersList();
    this.modals.showFeedback(`Jogador ${name} atualizado com sucesso!`, 'success');
  }

  handleStartGame() {
  if (gameState.players.length < 2) {
    this.modals.showFeedback('São necessários ao menos 2 jogadores.', 'error');
    return;
  }
  
  // Ocultar tela de cadastro e mostrar interface do jogo
  this.initialScreen.style.display = 'none';
  this.gameNavbar.classList.remove('hidden');
  this.gameContainer.classList.remove('hidden');
  this.sidebar.classList.remove('hidden');
  this.gameMap.classList.remove('hidden');
  this.gameFooter.classList.remove('hidden');
  
  document.getElementById('manualIcon')?.classList.add('hidden');
  
  window.gameLogic.initializeGame();

  // Inicializar sistema de IA
  this.initializeAISystem();

  // Adicionar listener para botão de debug da IA
  this.setupAIDebugButton();

  this.updateUI();
}

// ==================== SISTEMA DE IA ====================

initializeAISystem() {
  console.log('🤖 Inicializando sistema de IA...');
  
  // Identificar jogadores IA
  const aiPlayers = gameState.players
    .map((player, index) => {
      if (player.type === 'ai') {
        return { 
          index, 
          difficulty: player.aiDifficulty || 'medium',
          name: player.name
        };
      }
      return null;
    })
    .filter(Boolean);
  
  if (aiPlayers.length === 0) {
    console.log('🤖 Nenhum jogador IA encontrado');
    return;
  }
  
  console.log(`🤖 Encontrados ${aiPlayers.length} jogadores IA:`, aiPlayers);
  
  try {
    // Criar instâncias de IA
    const aiInstances = aiPlayers.map(({ index, difficulty }) => {
      const ai = AIFactory.createAI(index, difficulty);
      console.log(`🤖 IA criada para jogador ${index} (${difficulty}): ${ai.personality.name}`);
      return ai;
    });
    
    // Registrar IAs no estado do jogo
    setAIPlayers(aiInstances);
    
    // Adicionar evento de debug
    window.aiDebugUpdate = () => this.updateAIDebugPanel();
    
    // Se o primeiro jogador for IA, iniciar turno após delay
    if (aiPlayers.some(p => p.index === gameState.currentPlayerIndex)) {
      console.log('🤖 Primeiro jogador é IA, aguardando início...');
      
      // Pequeno delay para UI carregar
      setTimeout(() => {
        if (window.gameLogic && window.gameLogic.checkAndExecuteAITurn) {
          console.log('🤖 Iniciando turno da IA...');
          window.gameLogic.checkAndExecuteAITurn();
        }
      }, 2000);
    }
    
    // CORREÇÃO: Use this.modals.showFeedback em vez de this.showFeedback
    this.modals.showFeedback(`Sistema de IA inicializado com ${aiInstances.length} jogadores`, 'info');
    
  } catch (error) {
    console.error('🤖 Erro ao inicializar IA:', error);
    // CORREÇÃO: Use this.modals.showFeedback em vez de this.showFeedback
    this.modals.showFeedback('Erro ao inicializar sistema de IA', 'error');
  }
}

addAIPlayerButton() {
  // Criar container para botões de IA
  const aiButtonContainer = document.createElement('div');
  aiButtonContainer.className = 'mt-4 border-t border-white/10 pt-4';
  aiButtonContainer.innerHTML = `
    <div class="text-sm text-gray-300 mb-2">Adicionar Jogadores IA:</div>
    <div class="flex flex-wrap gap-2">
      <button class="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-medium transition" data-diff="easy">
        + IA Fácil
      </button>
      <button class="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition" data-diff="medium">
        + IA Média
      </button>
      <button class="px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white text-sm font-medium transition" data-diff="hard">
        + IA Difícil
      </button>
      <button class="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium transition" data-diff="master">
        + IA Mestre
      </button>
    </div>
  `;
  
  // Adicionar container após a lista de jogadores
  const playersList = document.getElementById('registeredPlayersList');
  if (playersList && playersList.parentNode) {
    playersList.parentNode.insertBefore(aiButtonContainer, playersList.nextSibling);
    
    // CORREÇÃO: Capturar referência ao this atual
    const self = this;
    
    // Adicionar event listeners
    aiButtonContainer.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const diff = e.currentTarget.dataset.diff;
        if (self.addAIPlayer) {
          self.addAIPlayer(diff);
        } else {
          console.error('addAIPlayer não está definido em', self);
        }
      });
    });
  }
}

// Adicione este método auxiliar
getRecommendedDifficulty(personality) {
  const recommendations = {
    'expansionist': 'medium',
    'builder': 'medium',
    'economist': 'hard',
    'diplomat': 'hard'
  };
  return recommendations[personality] || 'medium';
}

// Adicione método para IA aleatória
addRandomAIPlayer() {
  const difficulties = ['easy', 'medium', 'hard', 'master'];
  const personalities = Object.keys(AI_PERSONALITIES);
  
  const randomDiff = difficulties[Math.floor(Math.random() * difficulties.length)];
  const randomPersonality = personalities[Math.floor(Math.random() * personalities.length)];
  
  this.addAIPlayer(randomDiff, null, randomPersonality);
}

addMultipleAIPlayers(count) {
  const added = [];
  const difficulties = ['easy', 'medium', 'hard', 'master'];
  
  for (let i = 0; i < count; i++) {
    if (gameState.players.length >= 4) break;
    const difficulty = difficulties[Math.min(i, difficulties.length - 1)];
    added.push(this.addAIPlayer(difficulty));
  }
  
  return added;
}

addAIPlayerButton() {
  // Criar container para botões de IA
  const aiButtonContainer = document.createElement('div');
  aiButtonContainer.className = 'mt-4 border-t border-white/10 pt-4';
  aiButtonContainer.innerHTML = `
    <div class="text-sm text-gray-300 mb-2">Adicionar Jogadores IA:</div>
    <div class="flex flex-wrap gap-2">
      <button class="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-medium transition" data-diff="easy">
        + IA Fácil
      </button>
      <button class="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition" data-diff="medium">
        + IA Média
      </button>
      <button class="px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white text-sm font-medium transition" data-diff="hard">
        + IA Difícil
      </button>
      <button class="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium transition" data-diff="master">
        + IA Mestre
      </button>
    </div>
  `;
  
  // Adicionar container após a lista de jogadores
  const playersList = document.getElementById('registeredPlayersList');
  if (playersList && playersList.parentNode) {
    playersList.parentNode.insertBefore(aiButtonContainer, playersList.nextSibling);
    
    // Adicionar event listeners
    aiButtonContainer.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const diff = e.currentTarget.dataset.diff;
        this.addAIPlayer(diff);
      });
    });
  }
}

setupAIDebugButton() {
  // Criar botão de debug da IA (apenas em desenvolvimento)
  const debugBtn = document.createElement('button');
  debugBtn.id = 'toggleAIDebug';
  debugBtn.className = 'fixed bottom-4 right-4 z-40 p-2 bg-purple-600 rounded-full text-white shadow-lg hover:bg-purple-700 transition';
  debugBtn.textContent = '🤖';
  debugBtn.title = 'Debug IA (Ctrl+Shift+I)';
  debugBtn.addEventListener('click', () => {
    const panel = document.getElementById('aiDebugPanel');
    if (panel) {
      panel.classList.toggle('hidden');
      if (!panel.classList.contains('hidden')) {
        this.updateAIDebugPanel();
      }
    }
  });
  
  document.body.appendChild(debugBtn);
} 

updateAIDebugPanel() {
  const debugContent = document.getElementById('aiDebugContent');
  if (!debugContent) return;
  
  let html = '';
  
  // Cabeçalho
  const aiPlayers = gameState.players.filter(p => p.type === 'ai' || p.isAI);
  const currentPlayer = getCurrentPlayer();
  const isAITurn = currentPlayer && (currentPlayer.type === 'ai' || currentPlayer.isAI);
  
  html += `<div class="mb-4">
    <div class="flex justify-between items-center mb-2">
      <div class="text-sm font-bold text-purple-300">🤖 Monitor de IA</div>
      <div class="text-xs text-gray-400">${new Date().toLocaleTimeString()}</div>
    </div>
    <div class="text-xs text-gray-300 mb-3">
      Jogadores IA: ${aiPlayers.length} | Turno: ${gameState.turn} | Fase: ${gameState.currentPhase}
      ${isAITurn ? ` | <span class="text-yellow-300">🎮 Turno da IA</span>` : ''}
    </div>
  </div>`;
  
  // Controles de debug
  html += `<div class="mb-4 p-2 bg-gray-800/50 rounded">
    <div class="text-xs font-semibold text-gray-300 mb-2">Controles</div>
    <div class="flex flex-wrap gap-2">
      <button onclick="window.gameLogic?.checkAndExecuteAITurn?.()" 
              class="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded">
        Executar IA
      </button>
      <button onclick="window.gameLogic?.completeAITurn?.()" 
              class="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 rounded">
        Forçar Término
      </button>
      <button onclick="window.gameLogic?.handleEndTurn?.()" 
              class="px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 rounded">
        Passar Turno
      </button>
      <button onclick="document.getElementById('aiDebugPanel').classList.add('hidden')" 
              class="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 rounded">
        Fechar
      </button>
    </div>
  </div>`;
  
  // Status de cada IA
  aiPlayers.forEach((player, idx) => {
    const ai = getAIPlayer(player.id);
    if (ai) {
      const debugInfo = ai.getDebugInfo?.() || {};
      const isCurrent = gameState.currentPlayerIndex === player.id;
      const statusColor = isCurrent ? 'text-yellow-300' : 'text-gray-300';
      const bgColor = isCurrent ? 'bg-purple-900/40' : 'bg-gray-800/30';
      
      html += `<div class="mb-3 p-3 rounded-lg border ${isCurrent ? 'border-purple-500/50' : 'border-gray-700/50'} ${bgColor}">
        <div class="flex justify-between items-start mb-2">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-lg">${player.icon}</span>
              <span class="text-sm font-bold ${statusColor}">
                ${player.name} ${isCurrent ? '🎮' : ''}
              </span>
            </div>
            <div class="text-xs text-gray-400 mt-1">
              ${ai.personality?.name || 'Sem personalidade'} • ${ai.difficulty || 'N/A'}
            </div>
          </div>
          <div class="flex flex-col items-end">
            <span class="text-xs px-2 py-1 rounded ${this.getAIDifficultyClass(player.aiDifficulty)}">
              ${player.aiDifficulty || 'medium'}
            </span>
            <span class="text-xs text-gray-400 mt-1">${player.victoryPoints} PV</span>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div class="text-gray-500">Fase:</div>
            <div class="text-gray-300 font-medium">${debugInfo.phase || 'idle'}</div>
          </div>
          <div>
            <div class="text-gray-500">Regiões:</div>
            <div class="text-gray-300 font-medium">${player.regions.length}</div>
          </div>
          <div>
            <div class="text-gray-500">Ações Memória:</div>
            <div class="text-gray-300 font-medium">${debugInfo.memory?.lastActions || 0}</div>
          </div>
          <div>
            <div class="text-gray-500">Negociações:</div>
            <div class="text-gray-300 font-medium">${debugInfo.memory?.negotiationHistory?.length || 0}</div>
          </div>
        </div>
        
        ${debugInfo.currentPlan ? `
        <div class="mt-2 pt-2 border-t border-gray-700/50">
          <div class="text-xs text-gray-500 mb-1">Plano Atual:</div>
          <div class="text-xs text-gray-300">
            ${debugInfo.currentPlan.actions?.length || 0} ações planejadas
          </div>
          <div class="text-xs text-gray-400 mt-1">
            ${debugInfo.currentPlan.turnGoals?.join(', ') || 'Sem metas'}
          </div>
        </div>
        ` : ''}
        
        <div class="mt-2 pt-2 border-t border-gray-700/50">
          <div class="text-xs text-gray-500">Recursos:</div>
          <div class="flex flex-wrap gap-1 mt-1">
            ${Object.entries(player.resources || {}).map(([res, val]) => `
              <span class="text-xs px-1.5 py-0.5 rounded bg-gray-700/50">
                ${val}${RESOURCE_ICONS[res] || '📦'}
              </span>
            `).join('')}
          </div>
        </div>
      </div>`;
    }
  });
  
  // Status do jogo
  html += `<div class="mt-4 pt-3 border-t border-white/10">
    <div class="text-xs font-bold text-gray-300 mb-2">📊 Status do Jogo</div>
    <div class="grid grid-cols-2 gap-3 text-xs">
      <div class="p-2 bg-gray-800/30 rounded">
        <div class="text-gray-500">Fase Atual</div>
        <div class="text-lg font-bold text-yellow-300">${gameState.currentPhase}</div>
      </div>
      <div class="p-2 bg-gray-800/30 rounded">
        <div class="text-gray-500">Ações Restantes</div>
        <div class="text-lg font-bold ${gameState.actionsLeft > 0 ? 'text-green-300' : 'text-red-300'}">
          ${gameState.actionsLeft}
        </div>
      </div>
      <div class="p-2 bg-gray-800/30 rounded">
        <div class="text-gray-500">Turno</div>
        <div class="text-lg font-bold text-white">${gameState.turn}</div>
      </div>
      <div class="p-2 bg-gray-800/30 rounded">
        <div class="text-gray-500">Próximo Jogador</div>
        <div class="text-lg font-bold text-blue-300">
          ${gameState.players[(gameState.currentPlayerIndex + 1) % gameState.players.length]?.name || '—'}
        </div>
      </div>
    </div>
    
    <div class="mt-3 p-2 bg-gray-800/20 rounded text-xs">
      <div class="text-gray-400 mb-1">Evento Atual:</div>
      <div class="text-gray-300">
        ${gameState.currentEvent ? 
          `${gameState.currentEvent.name} (${gameState.eventTurnsLeft} turnos)` : 
          'Nenhum evento ativo'}
      </div>
    </div>
  </div>`;
  
  debugContent.innerHTML = html;
  
  // Auto-refresh do painel
  setTimeout(() => {
    if (!document.getElementById('aiDebugPanel')?.classList.contains('hidden')) {
      this.updateAIDebugPanel();
    }
  }, 2000);
}

getAIDifficultyClass(difficulty) {
  const classes = {
    easy: 'ai-easy',
    medium: 'ai-medium', 
    hard: 'ai-hard',
    master: 'ai-master'
  };
  return classes[difficulty] || 'ai-medium';
}


  updatePlayerCountDisplay() {
    const count = gameState.players.length;
    this.playerCountDisplay.textContent = `${count}/4 Jogadores Registrados`;
    
    if (count === 0) {
      this.registeredPlayersList.innerHTML = `
        <div class="text-sm text-gray-300 p-3">Nenhum jogador cadastrado.</div>
      `;
    } else {
      this.registeredPlayersList.innerHTML = gameState.players.map(p => `
        <div class="flex items-center gap-2 p-2 bg-white/10 rounded-lg border border-white/10" 
             style="border-left:4px solid ${p.color}">
          <div class="text-2xl text-white">${p.icon}</div>
          <div class="text-sm font-medium text-white">${p.name}</div>
        </div>
      `).join('');
    }
    
    this.startGameBtn.disabled = count < 2;
  }

  // ==================== LOG DE ATIVIDADES ====================
  renderActivityLog(filter = 'all') {
    const logs = activityLogHistory;
    
    if (this.logEntries) {
      this.logEntries.innerHTML = '';
      
      const filteredLogs = logs.filter(log => {
        const currentPlayer = getCurrentPlayer();
        if (!currentPlayer) return true;
        
        const isCurrentPlayer = log.playerName === currentPlayer.name;
        
        if (filter === 'mine') return isCurrentPlayer;
        if (filter === 'events') return log.type === 'event';
        return true;
      });
      
      filteredLogs.forEach(log => {
        const entry = document.createElement('div');
        entry.className = 'log-entry ' + (log.type || '');
        
        const icon = LOG_ICONS[log.type] || LOG_ICONS.default;
        const currentPlayer = getCurrentPlayer();
        const isCurrentPlayer = currentPlayer && log.playerName === currentPlayer.name;
        
        entry.innerHTML = `
          <span class="log-entry-icon">${icon}</span>
          <div class="log-entry-text">
            <span class="log-entry-player ${isCurrentPlayer ? 'text-yellow-300' : ''}">${log.playerName || ''}</span> ${log.action || ''} 
            <span class="text-gray-400">${log.details || ''}</span>
          </div>
          <span class="log-entry-turn">T${log.turn || 0}</span>
        `;
        
        this.logEntries.appendChild(entry);
      });
    }
    
    if (this.logEntriesSidebar) {
      this.logEntriesSidebar.innerHTML = '';
      
      const filteredLogs = logs.filter(log => {
        const currentPlayer = getCurrentPlayer();
        if (!currentPlayer) return true;
        
        const isCurrentPlayer = log.playerName === currentPlayer.name;
        
        if (filter === 'mine') return isCurrentPlayer;
        if (filter === 'events') return log.type === 'event';
        return true;
      });
      
      filteredLogs.forEach(log => {
        const entry = document.createElement('div');
        entry.className = 'flex items-center gap-1 text-xs';
        
        const icon = LOG_ICONS[log.type] || LOG_ICONS.default;
        const currentPlayer = getCurrentPlayer();
        const isCurrentPlayer = currentPlayer && log.playerName === currentPlayer.name;
        
        entry.innerHTML = `
          <span class="text-xs">${icon}</span>
          <span class="truncate ${isCurrentPlayer ? 'text-yellow-300 font-semibold' : 'text-gray-300'}">
            ${log.playerName || ''} ${log.action || ''} ${log.details || ''}
          </span>
          <span class="ml-auto text-[9px] text-gray-500">T${log.turn || 0}</span>
        `;
        
        this.logEntriesSidebar.appendChild(entry);
      });
    }
    
    document.querySelectorAll('.log-filter-sidebar').forEach(btn => {
      if (btn.dataset.filter === filter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  scrollLogToTop() {
    const logContainer = this.logEntries?.parentElement;
    if (logContainer) {
      logContainer.scrollTop = 0;
    }
  }

  // ==================== TOOLTIP ====================
  showRegionTooltip(region, targetEl) {
    const owner = region.controller !== null 
      ? `${gameState.players[region.controller].icon} ${gameState.players[region.controller].name}`
      : 'Neutro';
    const structures = region.structures.length ? region.structures.join(', ') : 'Nenhuma';
    
    this.tooltipTitle.textContent = `${region.name} — ${region.biome}`;
    this.tooltipBody.innerHTML = `
      <div class="tooltip-section">
        <div class="tooltip-section-title">Informações</div>
        <div class="text-xs text-gray-300">
          <div class="flex justify-between">
            <span>Exploração:</span>
            <span class="font-bold">${region.explorationLevel}⭐</span>
          </div>
          <div class="flex justify-between mt-1">
            <span>Controlado por:</span>
            <span class="font-bold">${owner}</span>
          </div>
          <div class="flex justify-between mt-1">
            <span>Estruturas:</span>
            <span class="font-bold">${structures}</span>
          </div>
        </div>
      </div>
      
      <div class="tooltip-section mt-3">
        <div class="tooltip-section-title">Recursos</div>
        <div class="flex items-center justify-between gap-3 mt-1">
          ${Object.entries(region.resources)
            .filter(([key, value]) => value > 0)
            .map(([key, value]) => `
              <div class="flex items-center gap-1">
                <span class="text-base">${RESOURCE_ICONS[key]}</span>
                <span class="text-xs font-bold text-white">${value}</span>
              </div>
            `).join('')}
          ${Object.values(region.resources).filter(v => v > 0).length === 0 ? 
            '<span class="text-xs text-gray-400">Sem recursos</span>' : ''}
        </div>
      </div>
    `;
    
    this.regionTooltip.classList.remove('hidden');
    this.regionTooltip.classList.add('visible');
    this.positionTooltip(targetEl);
  }

  positionTooltip(targetEl) {
    const rect = targetEl.getBoundingClientRect();
    const tooltipRect = this.regionTooltip.getBoundingClientRect();
    
    let top = rect.top + 8;
    let left = rect.left - tooltipRect.width - 10;
    
    if (left < 10) {
      left = rect.right + 10;
    }
    
    const bottomOverflow = top + tooltipRect.height - window.innerHeight;
    if (bottomOverflow > 0) {
      top = window.innerHeight - tooltipRect.height - 10;
    }
    
    this.regionTooltip.style.top = (top + window.scrollY) + 'px';
    this.regionTooltip.style.left = (left + window.scrollX) + 'px';
  }

  hideRegionTooltip() {
    this.regionTooltip.classList.add('hidden');
    this.regionTooltip.classList.remove('visible');
  }

  // ==================== UTILITÁRIOS ====================
  setupTransparencyControls() {
    const transparencySlider = document.getElementById('cellTransparencySlider');
    const transparencyValue = document.getElementById('transparencyValue');

    if (transparencySlider && transparencyValue) {
      const updateTransparency = (value) => {
        const opacity = value / 100;
        const blur = Math.max(0.5, 2 - (opacity * 3)) + 'px';
        
        document.documentElement.style.setProperty('--cell-bg-opacity', opacity);
        document.documentElement.style.setProperty('--cell-blur', blur);
        transparencyValue.textContent = `${value}%`;
        
        transparencyValue.style.transform = 'scale(1.1)';
        setTimeout(() => {
          transparencyValue.style.transform = 'scale(1)';
        }, 150);
      };
      
      transparencySlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        updateTransparency(value);
      });
      
      transparencySlider.addEventListener('change', (e) => {
        const value = parseInt(e.target.value);
        localStorage.setItem('gaia-cell-transparency', value);
// Botões de IA na tela inicial
      this.addAIPlayerButton();

        this.modals.showFeedback(`Transparência ajustada para ${value}%`, 'info');
      });
      
      setTimeout(() => {
        const savedTransparency = localStorage.getItem('gaia-cell-transparency');
        if (savedTransparency) {
          const value = parseInt(savedTransparency);
          if (value >= 5 && value <= 50) {
            transparencySlider.value = value;
            updateTransparency(value);
          }
        }
      }, 1000);
    }

    const resetBtn = document.getElementById('resetTransparencyBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetTransparency();
      });
    }
  }

  resetTransparency() {
    const transparencySlider = document.getElementById('cellTransparencySlider');
    const transparencyValue = document.getElementById('transparencyValue');
    
    if (transparencySlider && transparencyValue) {
      transparencySlider.value = 15;
      
      document.documentElement.style.setProperty('--cell-bg-opacity', '0.15');
      document.documentElement.style.setProperty('--cell-blur', '1px');
      
      transparencyValue.textContent = '15%';
      
      localStorage.removeItem('gaia-cell-transparency');
      
      this.modals.showFeedback('Transparência resetada para o padrão (15%)', 'info');
    }
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [255, 255, 255];
  }

  setModalMode(enabled) {
    if (enabled) {
      document.body.classList.add('modal-active');
      if (this.boardContainer) {
        this.boardContainer.style.pointerEvents = 'none';
      }
    } else {
      document.body.classList.remove('modal-active');
      if (this.boardContainer) {
        this.boardContainer.style.pointerEvents = 'auto';
      }
      setTimeout(() => this.updateFooter(), 50);
    }
  }

  clearRegionSelection() {
    gameState.selectedRegionId = null;
    document.querySelectorAll('.board-cell').forEach(c => {
      c.classList.remove('region-selected');
    });
  }
}

export { UIManager };