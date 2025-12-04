// ui-manager.js - Gerenciamento de interface do usuário

import { gameState, achievementsState } from './game-state.js';

import { 
  GAME_CONFIG, 
  RESOURCE_ICONS, 
  TURN_PHASES, 
  ACHIEVEMENTS_CONFIG,
  STRUCTURE_COSTS,
  STRUCTURE_INCOME,
  STRUCTURE_EFFECTS,
  STRUCTURE_LIMITS
} from './game-config.js';

import { getAllManualContent } from './game-manual.js';

class UIManager {
  constructor() {
    this.cacheElements();
    this.setupEventListeners();
  }

  cacheElements() {
    // Elementos principais
    this.initialScreen = document.getElementById('initialScreen');
    this.gameNavbar = document.getElementById('gameNavbar');
    this.gameContainer = document.getElementById('gameContainer');
    this.gameMap = document.getElementById('gameMap');
    this.gameFooter = document.getElementById('gameFooter');
    
    // Player registration
    this.addPlayerBtn = document.getElementById('addPlayerBtn');
    this.startGameBtn = document.getElementById('startGameBtn');
    this.playerNameInput = document.getElementById('playerName');
    this.iconSelection = document.getElementById('iconSelection');
    this.registeredPlayersList = document.getElementById('registeredPlayersList');
    this.playerCountDisplay = document.getElementById('playerCountDisplay');
    
    // Sidebar
    this.sidebar = document.getElementById('sidebar');
    this.sidebarPlayerHeader = document.getElementById('sidebarPlayerHeader');
    this.resourceList = document.getElementById('resourceList');
    this.controlledRegions = document.getElementById('controlledRegions');
    
    // Map
    this.boardContainer = document.getElementById('boardContainer');
    this.regionTooltip = document.getElementById('regionTooltip');
    this.tooltipTitle = document.getElementById('tooltipTitle');
    this.tooltipBody = document.getElementById('tooltipBody');
    
    // Footer actions
    this.actionExploreBtn = document.getElementById('actionExplore');
    this.actionCollectBtn = document.getElementById('actionCollect');
    this.actionBuildBtn = document.getElementById('actionBuild');
    this.actionNegotiateBtn = document.getElementById('actionNegotiate');
    this.actionsLeftEl = document.getElementById('actionsLeft');
    this.endTurnBtn = document.getElementById('endTurnBtn');
    this.phaseIndicator = document.getElementById('phaseIndicator');
    
    // Modais
    this.manualModal = document.getElementById('manualModal');
    this.eventModal = document.getElementById('eventModal');
    this.negotiationModal = document.getElementById('negotiationModal');
    this.negResponseModal = document.getElementById('negResponseModal');
    this.alertModal = document.getElementById('alertModal');
    this.victoryModal = document.getElementById('victoryModal');
    
    // Event banner
    this.eventBanner = document.getElementById('eventBanner');
    this.eventBannerIcon = document.getElementById('eventBannerIcon');
    this.eventBannerTitle = document.getElementById('eventBannerTitle');
    this.eventBannerTurns = document.getElementById('eventBannerTurns');
    this.eventBannerEffect = document.getElementById('eventBannerEffect');

// Structure modal
this.structureModal = document.getElementById('structureModal');
this.structureModalClose = document.getElementById('structureModalClose');
this.structureModalRegion = document.getElementById('structureModalRegion');
this.structureOptions = document.getElementById('structureOptions');
  }

  setupEventListeners() {
    // Player registration
    this.addPlayerBtn?.addEventListener('click', () => this.handleAddPlayer());
    this.startGameBtn?.addEventListener('click', () => this.handleStartGame());
    
    // Action buttons
    this.actionExploreBtn?.addEventListener('click', () => window.gameLogic.handleExplore());
    this.actionCollectBtn?.addEventListener('click', () => window.gameLogic.handleCollect());
    this.actionBuildBtn?.addEventListener('click', () => window.gameLogic.handleBuild());
    this.actionNegotiateBtn?.addEventListener('click', () => window.gameLogic.handleNegotiate());
    this.endTurnBtn?.addEventListener('click', () => window.gameLogic.handleEndTurn());
    
    // Manual
    document.getElementById('manualIcon')?.addEventListener('click', () => this.openManual());
    document.getElementById('manualIconNavbar')?.addEventListener('click', () => this.openManual());
    document.getElementById('manualCloseBtn')?.addEventListener('click', () => this.closeManual());
    
// Structure modal
this.structureModalClose?.addEventListener('click', () => this.closeStructureModal());
this.actionBuildBtn?.addEventListener('click', () => this.openStructureModal());

// Fechar modal ao clicar fora
this.structureModal?.addEventListener('click', (e) => {
  if (e.target === this.structureModal) {
    this.closeStructureModal();
  }
});

    // Victory modal
    document.getElementById('victoryModalClose')?.addEventListener('click', () => {
      this.victoryModal.classList.add('hidden');
    });
  }

  // Player registration UI
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

  updatePlayerCountDisplay() {
    const count = gameState.players.length;
    this.playerCountDisplay.textContent = `${count}/4 Jogadores Registrados`;
    
    if (count === 0) {
      this.registeredPlayersList.innerHTML = `
        <div class="text-sm text-gray-300 p-3">Nenhum jogador cadastrado.</div>
      `;
    } else {
      this.registeredPlayersList.innerHTML = gameState.players.map(p => `
        <div class="flex items-center gap-2 p-2 bg-white/3 rounded-lg" 
             style="border-left:4px solid ${p.color}">
          <div class="text-2xl">${p.icon}</div>
          <div class="text-sm font-medium">${p.name}</div>
        </div>
      `).join('');
    }
    
    this.startGameBtn.disabled = count < 2;
  }

  handleAddPlayer() {
    const name = this.playerNameInput.value.trim();
    const selected = document.querySelector('.icon-option.selected');
    
    if (!name || !selected) {
      window.utils.showFeedback('Informe o nome e selecione um ícone.', 'error');
      return;
    }
    
    if (gameState.players.length >= 4) {
      window.utils.showFeedback('Máximo de 4 jogadores atingido.', 'warning');
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
    this.playerNameInput.value = '';
    selected.classList.remove('selected');
    this.updatePlayerCountDisplay();
  }

  handleStartGame() {
    if (gameState.players.length < 2) {
      window.utils.showFeedback('São necessários ao menos 2 jogadores.', 'error');
      return;
    }
    
    this.initialScreen.style.display = 'none';
    this.gameNavbar.classList.remove('hidden');
    this.gameContainer.classList.remove('hidden');
    this.sidebar.classList.remove('hidden');
    this.gameMap.classList.remove('hidden');
    this.gameFooter.classList.remove('hidden');
    
    document.getElementById('manualIcon')?.classList.add('hidden');
    
    window.gameLogic.initializeGame();
    this.updateUI();
  }

  // Renderização principal
  updateUI() {
    this.renderHeaderPlayers();
    this.renderBoard();
    this.renderSidebar(gameState.selectedPlayerForSidebar);
    this.updateFooter();
    this.updateTurnInfo();
  }

  renderHeaderPlayers() {
    const playerHeaderList = document.getElementById('playerHeaderList');
    if (!playerHeaderList) return;
    
    playerHeaderList.innerHTML = gameState.players.map((p, i) => `
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
    
    playerHeaderList.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.index);
        gameState.selectedPlayerForSidebar = idx;
        this.renderSidebar(idx);
      });
    });
  }

  // Define as bordas do mapa
  renderBoard() {
  // Use boardOverlay em vez de boardContainer
  const boardContainer = document.getElementById('boardOverlay');
  if (!boardContainer) return;
  
  boardContainer.innerHTML = '';
  
  gameState.regions.forEach((region, index) => {
    const cell = this.createRegionCell(region, index);
    boardContainer.appendChild(cell);
  });
}

  // Cria as regiões no mapa
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
    cell.style.setProperty('--player-color', this.rgbToRgba(rgb, 0.8));
  }
  
  // Estilização baseada no controlador
  if (region.controller !== null) {
    cell.classList.add('controlled');
    const player = gameState.players[region.controller];
    const rgb = this.hexToRgb(player.color);
    cell.style.setProperty('--player-rgb', rgb.join(', '));
    cell.style.setProperty('--player-color', player.color);
  } else {
    cell.classList.add('neutral');
  }
  
  // CONTEÚDO MINIMALISTA - APENAS INFORMAÇÕES ESSENCIAIS
  
  // Header: Nome da região e nível de exploração
  const header = document.createElement('div');
  header.className = 'flex items-center justify-between mb-1';
  header.innerHTML = `
    <div class="text-xs font-semibold leading-tight">${String.fromCharCode(65 + region.id)}</div>
    <div class="text-xs bg-black/30 px-1 py-0.5 rounded">${region.explorationLevel}⭐</div>
  `;
  
  // Recursos: Apenas ícones (sem números)
  const resources = document.createElement('div');
  resources.className = 'flex items-center justify-center gap-1 mb-2';
  
  // Mostrar apenas ícones dos recursos disponíveis
  Object.entries(region.resources).forEach(([key, value]) => {
    if (value > 0) {
      const span = document.createElement('span');
      span.className = 'text-base';
      span.innerHTML = RESOURCE_ICONS[key];
      span.title = `${value} ${key}`; // Tooltip nativo
      resources.appendChild(span);
    }
  });
  
  // Footer: Controlador e estruturas (ícones apenas)
  const footer = document.createElement('div');
  footer.className = 'flex items-center justify-between text-xs';
  
  const controller = region.controller !== null 
    ? `<span class="opacity-80">${gameState.players[region.controller].icon}</span>`
    : '<span class="opacity-50">○</span>';
  
  // Ícones de estruturas
  const structureIcons = {
    'Abrigo': '🛖',
    'Torre de Vigia': '🏯',
    'Mercado': '🏪',
    'Laboratório': '🔬',
    'Santuário': '🛐'
  };
  
  const structureDisplay = region.structures.length 
    ? region.structures.map(s => structureIcons[s] || '□').join('')
    : '—';
  
  footer.innerHTML = `
    <div>${controller}</div>
    <div class="text-sm opacity-90">${structureDisplay}</div>
  `;
  
  cell.appendChild(header);
  cell.appendChild(resources);
  cell.appendChild(footer);
  
  // Event listeners mantidos
  cell.addEventListener('mouseenter', (e) => this.showRegionTooltip(region, e.currentTarget));
  cell.addEventListener('mousemove', (e) => this.positionTooltip(e.currentTarget));
  cell.addEventListener('mouseleave', () => this.hideRegionTooltip());
  
  cell.addEventListener('click', (e) => {
    e.stopPropagation();
    const regionId = Number(cell.dataset.regionId);
    
    if (gameState.selectedRegionId === regionId) {
      gameState.selectedRegionId = null;
      cell.classList.remove('region-selected');
    } else {
      gameState.selectedRegionId = regionId;
      document.querySelectorAll('.board-cell').forEach(c => c.classList.remove('region-selected'));
      cell.classList.add('region-selected');
    }
    
    this.renderSidebar(gameState.selectedPlayerForSidebar);
    this.updateFooter();
  });
  
  return cell;
}
  
// Ajustes das Regiões controladas
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

  // Confere as conquistas do Jogador
renderAchievements() {
  const achievementsList = document.getElementById('achievementsList');
  if (!achievementsList) return;
  
  achievementsList.innerHTML = '';
  
  // Obter jogador atual
  const playerIndex = gameState.selectedPlayerForSidebar;
  const player = gameState.players[playerIndex];
  if (!player) return;
  
  const unlockedAchievements = achievementsState.unlockedAchievements[playerIndex] || [];
  const playerStats = achievementsState.playerAchievements[playerIndex];
  
  // Converter ACHIEVEMENTS_CONFIG para array
  const achievementsArray = Object.values(ACHIEVEMENTS_CONFIG);
  
  // Renderizar todas as conquistas
  achievementsArray.forEach(achievement => {
    const isUnlocked = unlockedAchievements.includes(achievement.id);
    
    const item = document.createElement('div');
    item.className = `achievement ${isUnlocked ? 'achievement-unlocked' : 'achievement-locked'}`;
    
    // Determinar progresso
    let progress = 0;
    let progressText = '';
    
    switch (achievement.type) {
      case 'explored':
        progress = playerStats?.explored || 0;
        progressText = `${progress}/${achievement.requirement} regiões exploradas`;
        break;
      case 'built':
        progress = playerStats?.built || 0;
        progressText = `${progress}/${achievement.requirement} estruturas construídas`;
        break;
      case 'negotiated':
        progress = playerStats?.negotiated || 0;
        progressText = `${progress}/${achievement.requirement} negociações`;
        break;
      case 'collected':
        progress = playerStats?.collected || 0;
        progressText = `${progress}/${achievement.requirement} regiões coletadas`;
        break;
      case 'biomes':
        progress = playerStats?.controlledBiomes?.size || 0;
        progressText = `${progress}/${achievement.requirement} biomas diferentes`;
        break;
      case 'resources':
        const resourceCount = Object.values(playerStats?.maxResources || {})
          .filter(value => value >= achievement.requirement).length;
        progress = resourceCount;
        progressText = `${progress}/4 recursos com ${achievement.requirement}+`;
        break;
      default:
        progressText = isUnlocked ? 'Desbloqueado' : 'Bloqueado';
    }
    
    const progressPercent = Math.min(100, (progress / achievement.requirement) * 100);
    
    item.innerHTML = `
      <span class="achievement-icon text-xl">${achievement.icon}</span>
      <div class="achievement-info flex-1">
        <div class="achievement-name ${isUnlocked ? 'text-yellow-300' : 'text-gray-400'} font-semibold">
          ${achievement.name}
          ${isUnlocked ? ' ✓' : ''}
        </div>
        <div class="achievement-desc text-xs ${isUnlocked ? 'text-green-300' : 'text-gray-500'}">
          ${achievement.description}
        </div>
        <div class="achievement-progress mt-1">
          <div class="w-full bg-gray-700 rounded-full h-1.5">
            <div class="bg-green-500 h-1.5 rounded-full" style="width: ${progressPercent}%"></div>
          </div>
          <div class="text-xs text-gray-400 mt-0.5">${progressText}</div>
        </div>
      </div>
    `;
    
    achievementsList.appendChild(item);
  });
}

// Gerencia e atualiza o painel lateral do jogo
renderSidebar(playerIndex) {
    const player = gameState.players[playerIndex];
    if (!player) return;
    
    const isCurrentPlayer = playerIndex === gameState.currentPlayerIndex;
    
    // Header do jogador
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
    
    // Recursos
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
    
    // Regiões controladas
    this.renderControlledRegions(player);
    
    // Conquistas
    this.renderAchievements();
    
    // Adicionar botão para abrir modal de conquistas
    const achievementsSection = document.getElementById('achievementsList').parentElement;
    if (achievementsSection) {
      const viewAllBtn = document.createElement('button');
      viewAllBtn.className = 'text-xs text-yellow-400 hover:text-yellow-300 mt-2';
      viewAllBtn.textContent = 'Ver todas as conquistas →';
      viewAllBtn.addEventListener('click', () => this.renderAchievementsModal());
      
      achievementsSection.appendChild(viewAllBtn);
    }    

    // Fase do turno
    this.renderTurnPhase();
  }

// Modal para mostrar as conquistas do Jogador
renderAchievementsModal() {
  // Criar modal se não existir
  let modal = document.getElementById('achievementsModal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'achievementsModal';
    modal.className = 'hidden fixed inset-0 z-[110] flex items-center justify-center p-6';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/70"></div>
      <div class="relative w-full max-w-4xl bg-gray-900/95 backdrop-blur-md border border-yellow-500/30 rounded-2xl shadow-xl p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl text-yellow-300 font-semibold">🏆 Conquistas</h2>
          <button id="achievementsModalClose" class="text-gray-300 hover:text-white text-xl">✖</button>
        </div>
        <div id="achievementsModalContent" class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto"></div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Adicionar event listener
    document.getElementById('achievementsModalClose')?.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }
  
  // Preencher conteúdo
  const content = document.getElementById('achievementsModalContent');
  if (!content) return;
  
  content.innerHTML = '';
  
  // Obter jogador atual
  const playerIndex = gameState.selectedPlayerForSidebar;
  const unlockedAchievements = achievementsState.unlockedAchievements[playerIndex] || [];
  const playerStats = achievementsState.playerAchievements[playerIndex];
  
  Object.values(ACHIEVEMENTS_CONFIG).forEach(achievement => {
    const isUnlocked = unlockedAchievements.includes(achievement.id);
    
    const card = document.createElement('div');
    card.className = `p-4 rounded-lg border ${isUnlocked ? 'border-yellow-500/50 bg-yellow-900/10' : 'border-gray-700/50 bg-gray-800/30'}`;
    
    // Determinar progresso
    let progress = 0;
    let progressText = '';
    
    switch (achievement.type) {
      case 'explored':
        progress = playerStats?.explored || 0;
        progressText = `Exploradas: ${progress}/${achievement.requirement}`;
        break;
      case 'built':
        progress = playerStats?.built || 0;
        progressText = `Construídas: ${progress}/${achievement.requirement}`;
        break;
      case 'negotiated':
        progress = playerStats?.negotiated || 0;
        progressText = `Negociações: ${progress}/${achievement.requirement}`;
        break;
      case 'collected':
        progress = playerStats?.collected || 0;
        progressText = `Regiões coletadas: ${progress}/${achievement.requirement}`;
        break;
      case 'biomes':
        progress = playerStats?.controlledBiomes?.size || 0;
        const biomesList = playerStats?.controlledBiomes ? Array.from(playerStats.controlledBiomes).join(', ') : 'Nenhum';
        progressText = `Biomas: ${progress}/${achievement.requirement} (${biomesList})`;
        break;
      case 'resources':
        const resources = playerStats?.maxResources || {};
        progressText = `
          Madeira: ${resources.madeira || 0}/${achievement.requirement}<br>
          Pedra: ${resources.pedra || 0}/${achievement.requirement}<br>
          Ouro: ${resources.ouro || 0}/${achievement.requirement}<br>
          Água: ${resources.agua || 0}/${achievement.requirement}
        `;
        break;
      default:
        progressText = isUnlocked ? '✅ Desbloqueado' : '🔒 Bloqueado';
    }
    
    card.innerHTML = `
      <div class="flex items-start gap-3">
        <span class="text-2xl">${achievement.icon}</span>
        <div class="flex-1">
          <h3 class="font-bold ${isUnlocked ? 'text-yellow-300' : 'text-gray-300'}">
            ${achievement.name}
            ${isUnlocked ? '<span class="text-green-400 ml-2">✓</span>' : ''}
          </h3>
          <p class="text-sm text-gray-300 mt-1">${achievement.description}</p>
          <div class="mt-2 text-xs text-gray-400">${progressText.replace('<br>', '<br>')}</div>
          ${isUnlocked ? `
            <div class="mt-2 text-xs text-green-300">
              <strong>Recompensa:</strong> ${this.getAchievementRewardText(achievement)}
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    content.appendChild(card);
  });
}

// Função auxiliar para texto da recompensa
getAchievementRewardText(achievement) {
  const rewards = {
    'explorador': '+1 PV por turno',
    'construtor': '-1 recurso ao construir',
    'diplomata': '-1 Ouro ao negociar',
    'colecionador': '+1 recurso ao recolher',
    'diversificador': '+3 PV instantâneos',
    'magnata': '+10% em todos os recursos',
    'vencedor_rapido': 'Título especial',
    'pacifista': '+5 PV instantâneos'
  };
  
  return rewards[achievement.id] || 'Recompensa especial';
}

// Atualização informações ao final do turno do Jogador
  renderTurnPhase() {
    const turnPhaseIndicator = document.getElementById('turnPhaseIndicator');
    if (!turnPhaseIndicator) return;
    
    const phaseNames = {
      'renda': '💰 Renda',
      'acoes': '⚡ Ações',
      'negociacao': '🤝 Negociação'
    };
    
    turnPhaseIndicator.textContent = phaseNames[TURN_PHASES.RENDA] || 'Renda';
  }

  // Atualiza a barra de botões de ações do jogo
  updateFooter() {
    const player = gameState.players[gameState.currentPlayerIndex];
    const regionId = gameState.selectedRegionId;
    
    // Validações básicas
    if (!player || !gameState.gameStarted) {
      [this.actionExploreBtn, this.actionCollectBtn, this.actionBuildBtn, this.actionNegotiateBtn]
        .forEach(b => b.disabled = true);
      this.actionsLeftEl.textContent = `Ações restantes: ${gameState.actionsLeft}`;
      return;
    }
    
    if (regionId === null || regionId === undefined) {
      [this.actionExploreBtn, this.actionCollectBtn, this.actionBuildBtn, this.actionNegotiateBtn]
        .forEach(b => b.disabled = true);
      this.actionsLeftEl.textContent = `Ações restantes: ${gameState.actionsLeft}`;
      return;
    }
    
    const region = gameState.regions[regionId];
    if (!region) {
      [this.actionExploreBtn, this.actionCollectBtn, this.actionBuildBtn, this.actionNegotiateBtn]
        .forEach(b => b.disabled = true);
      return;
    }
    
    const baseEnabled = gameState.actionsLeft > 0;
    const isOwnRegion = region.controller === player.id;
    const isNeutral = region.controller === null;
    const isEnemyRegion = region.controller !== null && region.controller !== player.id;
    
    // Atualizar botão Explorar/Assumir Domínio
    if (isNeutral) {
      const hasEnoughPV = player.victoryPoints >= 2;
      const canPayBiome = Object.entries(region.resources)
        .every(([key, value]) => player.resources[key] >= value);
      this.actionExploreBtn.disabled = !baseEnabled || !hasEnoughPV || !canPayBiome;
      this.actionExploreBtn.textContent = 'Assumir Domínio';
    } else if (isOwnRegion) {
      const canAfford = window.gameLogic.canAffordAction('explorar');
      this.actionExploreBtn.disabled = !baseEnabled || !canAfford;
      this.actionExploreBtn.textContent = 'Explorar';
    } else {
      this.actionExploreBtn.disabled = true;
      this.actionExploreBtn.textContent = 'Explorar';
    }
    
    // Atualizar outros botões
    this.actionBuildBtn.disabled = !baseEnabled || isNeutral || isEnemyRegion || 
                                   !window.gameLogic.canAffordAction('construir');
    this.actionCollectBtn.disabled = !baseEnabled || isNeutral || isEnemyRegion || 
                                     !window.gameLogic.canAffordAction('recolher');
    this.actionNegotiateBtn.disabled = !baseEnabled || !isEnemyRegion || 
                                       !window.gameLogic.canAffordAction('negociar');
    
    // Atualizar contadores
    this.actionsLeftEl.textContent = `Ações restantes: ${gameState.actionsLeft}`;
    
    // Atualizar fase
    const phaseNames = {
      'renda': '💰 Renda',
      'acoes': '⚡ Ações',
      'negociacao': '🤝 Negociação'
    };
    this.phaseIndicator.textContent = `Fase: ${phaseNames[TURN_PHASES.RENDA] || 'Renda'}`;
  }

  updateTurnInfo() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const turnInfo = document.getElementById('turnInfo');
    if (turnInfo) {
      turnInfo.textContent = `Turno: ${gameState.turn} • Jogador: ${currentPlayer?.name || '—'}`;
    }
  }

  // Tooltip functions
  // Na função showRegionTooltip, substitua TODO o conteúdo atual:
showRegionTooltip(region, targetEl) {
  const owner = region.controller !== null 
    ? `${gameState.players[region.controller].icon} ${gameState.players[region.controller].name}`
    : '<span class="text-gray-400">Região Neutra</span>';
  
  // IMPORTANTE: Adicione estas importações no topo do arquivo se não existirem
  // ou garanta que as constantes estão disponíveis
  const BIOME_INCOME = {
    'Floresta Tropical': { madeira: 1, ouro: 0.5, agua: 1.5 },
    'Floresta Temperada': { madeira: 1.5, pedra: 0.5, agua: 1 },
    'Savana': { madeira: 0.5, ouro: 1.5, agua: 0.5 },
    'Pântano': { pedra: 1, agua: 2 }
  };
  
  const EXPLORATION_BONUS = {
    0: 0,
    1: 0.25,
    2: 0.5,
    3: 1.0
  };
  
  // Calcular produção da região
  let production = [];
  const biomeIncome = BIOME_INCOME[region.biome] || {};
  Object.entries(biomeIncome).forEach(([resource, value]) => {
    if (value > 0) {
      const multiplier = 1 + (EXPLORATION_BONUS[region.explorationLevel] || 0);
      const finalValue = (value * multiplier).toFixed(1);
      production.push(`+${finalValue}${RESOURCE_ICONS[resource]}`);
    }
  });
  
  // Produção das estruturas
  let structureProduction = [];
  region.structures.forEach(structure => {
    if (STRUCTURE_INCOME[structure]) {
      Object.entries(STRUCTURE_INCOME[structure]).forEach(([resource, value]) => {
        if (resource === 'pv') {
          structureProduction.push(`+${value} PV`);
        } else if (value > 0) {
          structureProduction.push(`+${value}${RESOURCE_ICONS[resource]}`);
        }
      });
    }
  });
  
  this.tooltipTitle.textContent = `${region.name} — ${region.biome}`;
  this.tooltipBody.innerHTML = `
    <div class="space-y-3">
      <!-- Status -->
      <div class="flex items-center justify-between">
        <span class="text-xs text-gray-300">Domínio</span>
        <span class="text-xs font-medium">${owner}</span>
      </div>
      
      <div class="flex items-center justify-between">
        <span class="text-xs text-gray-300">Exploração</span>
        <span class="text-xs font-medium text-yellow-300">${region.explorationLevel} ⭐</span>
      </div>
      
      <!-- Recursos disponíveis -->
      <div>
        <div class="text-xs text-gray-300 mb-1">Recursos disponíveis</div>
        <div class="grid grid-cols-2 gap-1">
          ${Object.entries(region.resources)
            .filter(([_, value]) => value > 0)
            .map(([key, value]) => `
              <div class="flex items-center justify-between text-xs">
                <span class="flex items-center gap-1">
                  <span class="text-base">${RESOURCE_ICONS[key]}</span>
                  <span>${key}</span>
                </span>
                <span class="font-bold">${value}</span>
              </div>
            `).join('')}
        </div>
      </div>
      
      <!-- Produção por turno -->
      ${production.length > 0 || structureProduction.length > 0 ? `
      <div>
        <div class="text-xs text-gray-300 mb-1">Produção por turno</div>
        <div class="flex flex-wrap gap-1">
          ${production.map(p => `
            <span class="text-xs px-2 py-0.5 bg-green-900/30 rounded">${p}</span>
          `).join('')}
          ${structureProduction.map(p => `
            <span class="text-xs px-2 py-0.5 bg-blue-900/30 rounded">${p}</span>
          `).join('')}
        </div>
      </div>
      ` : ''}
      
      <!-- Estruturas -->
      ${region.structures.length > 0 ? `
        <div>
          <div class="text-xs text-gray-300 mb-1">Estruturas</div>
          <div class="flex flex-wrap gap-1">
            ${region.structures.map(s => `
              <span class="text-xs px-2 py-0.5 bg-purple-900/30 rounded">${s}</span>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <!-- Dicas de ação -->
      <div class="pt-2 border-t border-gray-700/50">
        <div class="text-xs text-cyan-300">
          <strong>💡 Dica:</strong> Clique para selecionar e usar ações no rodapé
        </div>
      </div>
    </div>
  `;
  
  // CORREÇÃO: Remover 'hidden' e adicionar 'visible' corretamente
  this.regionTooltip.classList.remove('hidden');
  this.positionTooltip(targetEl);
}

  positionTooltip(targetEl) {
  const rect = targetEl.getBoundingClientRect();
  const tooltipRect = this.regionTooltip.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Posição inicial: à direita da célula
  let left = rect.right + 10;
  let top = rect.top + window.scrollY;
  
  // Se não couber à direita, posicionar à esquerda
  if (left + tooltipRect.width > viewportWidth) {
    left = rect.left - tooltipRect.width - 10;
  }
  
  // Ajustar verticalmente para não sair da tela
  if (top + tooltipRect.height > viewportHeight) {
    top = viewportHeight - tooltipRect.height - 10;
  }
  
  if (top < 10) {
    top = 10;
  }
  
  this.regionTooltip.style.left = `${left}px`;
  this.regionTooltip.style.top = `${top}px`;
  
  // Garantir que está visível
  this.regionTooltip.style.opacity = '1';
  this.regionTooltip.style.visibility = 'visible';
}

 hideRegionTooltip() {
  this.regionTooltip.style.opacity = '0';
  this.regionTooltip.style.visibility = 'hidden';
}

  // Utilitários
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [255, 255, 255];
  }

  rgbToRgba(rgbArray, alpha = 0.3) {
    return `rgba(${rgbArray.join(', ')}, ${alpha})`;
  }

  // Manual
  openManual() {
    this.manualModal.classList.remove('hidden');
  }

  closeManual() {
    this.manualModal.classList.add('hidden');
  }

  // Event Banner
  updateEventBanner() {
  if (gameState.currentEvent && gameState.eventTurnsLeft > 0) {
    this.eventBannerIcon.textContent = gameState.currentEvent.icon;
    this.eventBannerTitle.textContent = gameState.currentEvent.name;
    this.eventBannerTurns.textContent = 
      `${gameState.eventTurnsLeft} turno${gameState.eventTurnsLeft > 1 ? 's' : ''} restante${gameState.eventTurnsLeft > 1 ? 's' : ''}`;
    this.eventBannerEffect.textContent = gameState.currentEvent.effect;
    
    // Remover classes de tipo anteriores
    this.eventBanner.classList.remove('event-positive', 'event-negative', 'event-mixed', 'event-neutral');
    // Adicionar classe baseada no tipo
    if (gameState.currentEvent.type) {
      this.eventBanner.classList.add(`event-${gameState.currentEvent.type}`);
    }
    
    this.eventBanner.classList.remove('hidden');
  } else {
    this.eventBanner.classList.add('hidden');
  }
}

// Carrega os dados do Manual do Jogo
renderManualFromText() {
  const manualContent = getAllManualContent();
  
  // Lista de todas as abas disponíveis
  const tabs = [
    { id: 'tab-o-jogo', key: 'o-jogo' },
    { id: 'tab-regioes', key: 'regioes' },
    { id: 'tab-regras', key: 'regras' },
    { id: 'tab-acoes', key: 'acoes' },
    { id: 'tab-estrutura', key: 'estrutura' },
    { id: 'tab-conquistas', key: 'conquistas' }
  ];
  
  // Preenche cada aba se o elemento existir
  tabs.forEach(tab => {
    const element = document.getElementById(tab.id);
    if (element) {
      element.innerHTML = manualContent[tab.key] || '<p class="text-gray-400">Conteúdo não disponível</p>';
    } else {
      console.warn(`Elemento ${tab.id} não encontrado no DOM.`);
    }
  });
}

// Nova função para atualizar modal de evento com cores
updateEventModal(event) {
  const eventIcon = document.getElementById('eventIcon');
  const eventTitle = document.getElementById('eventTitle');
  const eventDescription = document.getElementById('eventDescription');
  const eventEffect = document.getElementById('eventEffect');
  const eventDuration = document.getElementById('eventDuration');
  
  if (eventIcon) eventIcon.textContent = event.icon;
  if (eventTitle) eventTitle.textContent = event.name;
  if (eventDescription) eventDescription.textContent = event.description;
  if (eventEffect) eventEffect.textContent = `Efeito: ${event.effect}`;
  if (eventDuration) {
    const durationText = event.duration === 0 ? 'Imediato' : `${event.duration} turno(s)`;
    eventDuration.textContent = `Duração: ${durationText}`;
  }
  
  // Encontrar o elemento .relative dentro do modal
  const modalContent = document.querySelector('#eventModal .relative');
  if (modalContent) {
    // Remover classes anteriores
    modalContent.classList.remove('event-positive', 'event-negative', 'event-mixed', 'event-neutral');
    // Adicionar classe baseada no tipo
    if (event.type) {
      modalContent.classList.add(`event-${event.type}`);
    }
  }
}

openStructureModal() {
  if (gameState.selectedRegionId === null) {
    window.utils.showFeedback('Selecione uma região primeiro.', 'error');
    return;
  }
  
  const region = gameState.regions[gameState.selectedRegionId];
  const player = gameState.players[gameState.currentPlayerIndex];
  
  // Verificar se o jogador controla a região
  if (region.controller !== player.id) {
    window.utils.showFeedback('Você só pode construir em regiões que controla.', 'error');
    return;
  }
  
  this.structureModalRegion.textContent = `${region.name} (${region.biome})`;
  this.renderStructureOptions(region);
  this.structureModal.classList.remove('hidden');
}

closeStructureModal() {
  this.structureModal.classList.add('hidden');
}

renderStructureOptions(region) {
  this.structureOptions.innerHTML = '';
  
  const structures = [
    { id: 'Abrigo', name: 'Abrigo', icon: '🛖', color: 'orange' },
    { id: 'Torre de Vigia', name: 'Torre de Vigia', icon: '🏯', color: 'blue' },
    { id: 'Mercado', name: 'Mercado', icon: '🏪', color: 'yellow' },
    { id: 'Laboratório', name: 'Laboratório', icon: '🔬', color: 'purple' },
    { id: 'Santuário', name: 'Santuário', icon: '🛐', color: 'green' }
  ];
  
  structures.forEach(structure => {
    // Verificar se já existe essa estrutura na região
    if (region.structures.includes(structure.name)) {
      return; // Não mostrar estrutura já construída
    }
    
    const cost = STRUCTURE_COSTS[structure.name] || {};
    const income = STRUCTURE_INCOME[structure.name] || {};
    const effect = STRUCTURE_EFFECTS[structure.name] || {};
    
    const option = document.createElement('div');
    option.className = `bg-gray-800/50 border border-${structure.color}-500/30 rounded-xl p-4 hover:bg-gray-700/50 transition cursor-pointer`;
    option.dataset.structure = structure.name;
    
    // Verificar se o jogador pode pagar
    const player = gameState.players[gameState.currentPlayerIndex];
    const canAfford = Object.entries(cost).every(([resource, amount]) => 
      player.resources[resource] >= amount
    );
    
    if (!canAfford) {
      option.classList.add('opacity-50');
      option.style.cursor = 'not-allowed';
    }
    
    option.innerHTML = `
      <div class="flex items-start gap-3">
        <span class="text-3xl">${structure.icon}</span>
        <div class="flex-1">
          <h3 class="font-bold text-${structure.color}-300 mb-1">${structure.name}</h3>
          <p class="text-xs text-gray-300 mb-2">${effect.description || ''}</p>
          
          <div class="mb-2">
            <p class="text-xs font-semibold text-gray-400">Custo:</p>
            <div class="flex flex-wrap gap-1 mt-1">
              ${Object.entries(cost).map(([resource, amount]) => `
                <span class="text-xs px-2 py-1 rounded bg-gray-700/50">
                  ${amount}${RESOURCE_ICONS[resource]}
                </span>
              `).join('')}
            </div>
          </div>
          
          <div class="mb-2">
            <p class="text-xs font-semibold text-gray-400">Benefícios:</p>
            <div class="flex flex-wrap gap-1 mt-1">
              ${effect.pv ? `<span class="text-xs px-2 py-1 rounded bg-green-900/30">+${effect.pv} PV</span>` : ''}
              ${Object.entries(income).map(([resource, amount]) => `
                <span class="text-xs px-2 py-1 rounded bg-blue-900/30">
                  +${amount}${resource === 'pv' ? ' PV' : RESOURCE_ICONS[resource]} por turno
                </span>
              `).join('')}
            </div>
          </div>
          
          ${!canAfford ? 
            '<p class="text-xs text-red-300 mt-2">Recursos insuficientes</p>' : 
            '<p class="text-xs text-green-300 mt-2">Clique para construir</p>'
          }
        </div>
      </div>
    `;
    
    if (canAfford) {
      option.addEventListener('click', () => {
        this.closeStructureModal();
        window.gameLogic.handleBuildStructure(structure.name);
      });
    }
    
    this.structureOptions.appendChild(option);
  });
  
  // Se nenhuma estrutura disponível
  if (this.structureOptions.children.length === 0) {
    this.structureOptions.innerHTML = `
      <div class="col-span-3 text-center py-8">
        <p class="text-gray-400">Todas as estruturas já foram construídas nesta região.</p>
      </div>
    `;
  }
}

}

// Exportar para uso global
export { UIManager };
