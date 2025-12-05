// ui-manager.js - Gerenciamento de interface do usuário

import { 
  gameState, 
  achievementsState,
  getGameState,
  setGameState,
  addActivityLog,
  incrementAchievement,
  updatePlayerResources,
  updatePlayerVictoryPoints,
  updateRegionController,
  getCurrentPlayer,
  clearRegionSelection,
  consumeAction,
  resetActions,
  canPlayerAfford
} from './game-state.js';

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
    this.activityLogHistory = [];
    this.cacheElements();
    this.setupEventListeners();

    // Garantir que o gameState seja acessível globalmente para compatibilidade
    window.gameState = gameState;
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
    this.cancelEditBtn = document.getElementById('cancelEditBtn');
    this.editingIndex = null; // Inicializa como propriedade da classe
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
    this.achievementsNavBtn = document.getElementById('achievementsNavBtn');
    this.eventModal = document.getElementById('eventModal');
    this.negotiationModal = document.getElementById('negotiationModal');
    this.negResponseModal = document.getElementById('negResponseModal');
    this.alertModal = document.getElementById('alertModal');
    this.victoryModal = document.getElementById('victoryModal');
    this.victoryModalTitle = document.getElementById('victoryModalTitle');
    this.victoryModalMessage = document.getElementById('victoryModalMessage');
    this.victoryModalClose = document.getElementById('victoryModalClose');
    
    // Alert modal elements
    this.alertIconEl = document.getElementById('alertIcon');
    this.alertTitleEl = document.getElementById('alertTitle');
    this.alertMessageEl = document.getElementById('alertMessage');
    this.alertButtonsEl = document.getElementById('alertButtons');
    
    // Event modal elements
    this.eventIconEl = document.getElementById('eventIcon');
    this.eventTitleEl = document.getElementById('eventTitle');
    this.eventDescriptionEl = document.getElementById('eventDescription');
    this.eventEffectEl = document.getElementById('eventEffect');
    this.eventDurationEl = document.getElementById('eventDuration');
    this.eventOkBtn = document.getElementById('eventOkBtn');
    
    // Event banner
    this.eventBanner = document.getElementById('eventBanner');
    this.eventBannerIcon = document.getElementById('eventBannerIcon');
    this.eventBannerTitle = document.getElementById('eventBannerTitle');
    this.eventBannerTurns = document.getElementById('eventBannerTurns');
    this.eventBannerEffect = document.getElementById('eventBannerEffect');
    this.eventBannerClose = document.getElementById('eventBannerClose');
    
    // Structure modal
    this.structureModal = document.getElementById('structureModal');
    this.structureModalClose = document.getElementById('structureModalClose');
    this.structureModalRegion = document.getElementById('structureModalRegion');
    this.structureOptions = document.getElementById('structureOptions');
    
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
    
    // Negotiation modal elements
    this.negTargetSelect = document.getElementById('negTarget');
    this.offerRegionsDiv = document.getElementById('offerRegions');
    this.reqRegionsDiv = document.getElementById('reqRegions');
    this.negSendBtn = document.getElementById('negSendBtn');
    this.negCancelBtn = document.getElementById('negCancelBtn');
    this.negResponseTitle = document.getElementById('negResponseTitle');
    this.negResponseBody = document.getElementById('negResponseBody');
    this.negAcceptBtn = document.getElementById('negAcceptBtn');
    this.negDeclineBtn = document.getElementById('negDeclineBtn');
    
    // Header elements
    this.playerHeaderList = document.getElementById('playerHeaderList');
    this.turnInfo = document.getElementById('turnInfo');
    
    // Manual tabs
    this.manualTabs = document.querySelectorAll('.manual-tab');
    this.manualContents = document.querySelectorAll('.manual-content');
  }

  setupEventListeners() {
    // Player registration
    this.addPlayerBtn?.addEventListener('click', () => this.handleAddPlayer());
    this.cancelEditBtn?.addEventListener('click', () => this.cancelEdit());
    this.startGameBtn?.addEventListener('click', () => this.handleStartGame());
    
    // Action buttons
    this.actionExploreBtn?.addEventListener('click', () => window.gameLogic.handleExplore());
    this.actionCollectBtn?.addEventListener('click', () => window.gameLogic.handleCollect());
    this.actionBuildBtn?.addEventListener('click', () => this.openStructureModal());
    this.actionNegotiateBtn?.addEventListener('click', () => window.gameLogic.handleNegotiate());
    this.endTurnBtn?.addEventListener('click', () => window.gameLogic.handleEndTurn());
    
    // Manual
    document.getElementById('manualIcon')?.addEventListener('click', () => this.openManual());
    document.getElementById('manualIconNavbar')?.addEventListener('click', () => this.openManual());
    document.getElementById('manualCloseBtn')?.addEventListener('click', () => this.closeManual());
    
    // Manual tabs
    this.manualTabs.forEach(t => t.addEventListener('click', (e) => this.handleManualTabClick(e)));
    
    // Structure modal
    this.structureModalClose?.addEventListener('click', () => this.closeStructureModal());
    
    // Fechar modal ao clicar fora
    this.structureModal?.addEventListener('click', (e) => {
      if (e.target === this.structureModal) {
        this.closeStructureModal();
      }
    });
    
    // Achievements modal
    //this.achievementsNavBtn?.addEventListener('click', () => this.renderAchievementsModal());
    // Adicione ESTE listener com log de depuração:
  console.log('Configurando achievementsNavBtn:', this.achievementsNavBtn);
  if (this.achievementsNavBtn) {
    this.achievementsNavBtn.addEventListener('click', () => {
      console.log('Botão de conquistas clicado!');
      this.renderAchievementsModal();
    });
  } else {
    console.error('achievementsNavBtn não encontrado!');
  }

    // Event modal
    this.eventOkBtn?.addEventListener('click', () => this.closeEventModal());
    this.eventBannerClose?.addEventListener('click', () => this.hideEventBanner());
    
    // Victory modal
    this.victoryModalClose?.addEventListener('click', () => this.closeVictoryModal());
    
    // Negotiation modals
    this.negSendBtn?.addEventListener('click', () => window.gameLogic.handleSendNegotiation());
    this.negCancelBtn?.addEventListener('click', () => this.closeNegotiationModal());
    this.negAcceptBtn?.addEventListener('click', () => window.gameLogic.handleNegResponse(true));
    this.negDeclineBtn?.addEventListener('click', () => window.gameLogic.handleNegResponse(false));
    this.negTargetSelect?.addEventListener('change', () => this.populateReqRegions());
    
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

// Adicionar listener para tecla ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && this.editingIndex !== null) {
    e.preventDefault();
    this.cancelEdit();
  }
});
  }

  // ==================== PLAYER REGISTRATION ====================
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
      <div class="flex items-center gap-2 p-2 bg-white/10 rounded-lg border border-white/10" 
           style="border-left:4px solid ${p.color}">
        <div class="text-2xl text-white">${p.icon}</div>
        <div class="text-sm font-medium text-white">${p.name}</div>
      </div>
    `).join('');
  }
  
  this.startGameBtn.disabled = count < 2;
}

  // ui-manager.js - Substitua handleAddPlayer
handleAddPlayer() {
  // Se estiver em modo de edição, atualiza o jogador
  if (this.editingIndex !== null) {
    this.updatePlayer(this.editingIndex);
    return;
  }
  
  const name = this.playerNameInput.value.trim();
  const selected = document.querySelector('.icon-option.selected');
  
  if (!name || !selected) {
    this.showFeedback('Informe o nome e selecione um ícone.', 'error');
    return;
  }
  
  if (gameState.players.length >= 4) {
    this.showFeedback('Máximo de 4 jogadores atingido.', 'warning');
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
  
  // Limpar e atualizar UI
  this.resetAddPlayerForm();
  this.updatePlayerCountDisplay();
  this.renderRegisteredPlayersList();
  
  this.showFeedback(`Jogador ${name} adicionado com sucesso!`, 'success');
}

resetAddPlayerForm() {
  this.playerNameInput.value = '';
  document.querySelectorAll('.icon-option.selected').forEach(el => {
    el.classList.remove('selected');
  });
}

renderRegisteredPlayersList() {
  const players = gameState.players;
  const canEdit = !gameState.gameStarted; // Só pode editar antes do jogo começar
  
  if (players.length === 0) {
    this.registeredPlayersList.innerHTML = `
      <div class="text-sm text-gray-300 p-3 text-center italic">
        Nenhum jogador cadastrado.
        <div class="text-xs text-gray-400 mt-1">Adicione pelo menos 2 jogadores</div>
      </div>
    `;
    return;
  }
  
  this.registeredPlayersList.innerHTML = players.map((p, index) => `
    <div class="player-card group flex items-center justify-between gap-2 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
         style="border-left: 4px solid ${p.color}">
      <div class="flex items-center gap-3 flex-1">
        <div class="text-3xl">${p.icon}</div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-white truncate">${p.name}</div>
          <div class="text-xs text-gray-400">
            Jogador ${index + 1} • ${p.victoryPoints} PV
          </div>
        </div>
      </div>
      
      ${canEdit ? `
      <div class="player-actions flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button class="edit-player-btn p-2 rounded-md hover:bg-white/10 transition" 
                data-index="${index}"
                title="Editar jogador">
          <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </button>
        <button class="delete-player-btn p-2 rounded-md hover:bg-white/10 transition" 
                data-index="${index}"
                title="Remover jogador">
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
  // Editar jogador
  this.registeredPlayersList.querySelectorAll('.edit-player-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.index);
      this.editPlayer(index);
    });
  });
  
  // Excluir jogador
  this.registeredPlayersList.querySelectorAll('.delete-player-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.index);
      this.deletePlayer(index);
    });
  });
}

// ui-manager.js - Substitua o método editPlayer existente
editPlayer(index) {
  if (gameState.gameStarted) {
    this.showFeedback('Não é possível editar jogadores após o início do jogo.', 'warning');
    return;
  }
  
  const player = gameState.players[index];
  if (!player) return;
  
  // Salvar índice do jogador sendo editado
  this.editingIndex = index;
  
  // Preencher formulário com dados do jogador
  this.playerNameInput.value = player.name;
  this.playerNameInput.focus();
  
  // Selecionar ícone correspondente
  document.querySelectorAll('.icon-option').forEach(iconEl => {
    const iconText = iconEl.textContent.trim();
    if (iconText === player.icon) {
      iconEl.classList.add('selected');
      // Rolar para o ícone selecionado
      iconEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      iconEl.classList.remove('selected');
    }
  });
  
  // Alterar botão "Adicionar" para "Atualizar"
  this.addPlayerBtn.textContent = 'Atualizar Jogador';
  this.addPlayerBtn.classList.remove('bg-green-600');
  this.addPlayerBtn.classList.add('bg-blue-600');
  
  // Mostrar botão "Cancelar"
  this.cancelEditBtn.classList.remove('hidden');
  
  // Destacar o jogador sendo editado na lista
  this.highlightPlayerBeingEdited(index);
  
  this.showFeedback(`Editando ${player.name}. Altere os dados e clique em "Atualizar Jogador".`, 'info');
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

// ui-manager.js - Adicione este método após editPlayer
cancelEdit() {
  // Restaurar botão "Adicionar"
  this.addPlayerBtn.textContent = 'Adicionar';
  this.addPlayerBtn.classList.remove('bg-blue-600');
  this.addPlayerBtn.classList.add('bg-green-600');
  
  // Esconder botão "Cancelar"
  this.cancelEditBtn.classList.add('hidden');
  
  // Limpar formulário
  this.playerNameInput.value = '';
  this.playerNameInput.blur();
  
  // Limpar seleção de ícones
  document.querySelectorAll('.icon-option.selected').forEach(el => {
    el.classList.remove('selected');
  });
  
  // Remover destaque da lista
  this.clearPlayerHighlight();
  
  // Resetar índice de edição
  this.editingIndex = null;
  
  this.showFeedback('Edição cancelada.', 'info');
}

clearPlayerHighlight() {
  document.querySelectorAll('.player-card').forEach(card => {
    card.classList.remove('ring-2', 'ring-blue-500');
    card.style.transform = '';
  });
}

// ui-manager.js - Substitua updatePlayer
updatePlayer(index) {
  const name = this.playerNameInput.value.trim();
  const selected = document.querySelector('.icon-option.selected');
  
  if (!name || !selected) {
    this.showFeedback('Informe o nome e selecione um ícone.', 'error');
    return;
  }
  
  const newIcon = selected.textContent.trim();
  
  // Verificar se o novo ícone já está sendo usado por outro jogador
  const isIconUsed = gameState.players.some((p, i) => i !== index && p.icon === newIcon);
  if (isIconUsed) {
    this.showFeedback('Este ícone já está sendo usado por outro jogador.', 'error');
    return;
  }
  
  // Atualizar jogador
  gameState.players[index] = {
    ...gameState.players[index],
    name,
    icon: newIcon
    // Mantém a cor original
  };
  
  // Finalizar modo de edição
  this.cancelEdit();
  
  // Atualizar UI
  this.updatePlayerCountDisplay();
  this.renderRegisteredPlayersList();
  
  this.showFeedback(`Jogador ${name} atualizado com sucesso!`, 'success');
}

async deletePlayer(index) {
  if (gameState.gameStarted) {
    this.showFeedback('Não é possível remover jogadores após o início do jogo.', 'warning');
    return;
  }
  
  if (gameState.players.length <= 2) {
    this.showFeedback('É necessário pelo menos 2 jogadores para iniciar o jogo.', 'error');
    return;
  }
  
  const player = gameState.players[index];
  const confirmed = await this.showConfirm(
    'Remover Jogador',
    `Tem certeza que deseja remover "${player.name}" (${player.icon})?`
  );
  
  if (!confirmed) return;
  
  // Remover jogador
  gameState.players.splice(index, 1);
  
  // Reindexar IDs
  gameState.players.forEach((p, i) => {
    p.id = i;
  });
  
  // Atualizar UI
  this.updatePlayerCountDisplay();
  this.renderRegisteredPlayersList();
  
  this.showFeedback(`Jogador ${player.name} removido com sucesso!`, 'success');
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
    this.setupAchievementsButton();
  }


  // ==================== REFRESH UI ====================
  refreshUIAfterStateChange() {
    this.updateUI();
  }

resetInitialScreen() {
  this.playerNameInput.value = '';
  document.querySelectorAll('.icon-option.selected').forEach(el => {
    el.classList.remove('selected');
  });
  this.updatePlayerCountDisplay();
  this.renderRegisteredPlayersList();
}

// ui-manager.js - Atualizar refreshInitialScreen
refreshInitialScreen() {
  // Cancelar qualquer edição em andamento
  if (this.editingIndex !== null) {
    this.cancelEdit();
  }
  
  this.updatePlayerCountDisplay();
  this.renderRegisteredPlayersList();
}

  // ==================== RENDERIZAÇÃO PRINCIPAL ====================
  updateUI() {
    this.renderHeaderPlayers();
    this.renderBoard();
    this.renderSidebar(gameState.selectedPlayerForSidebar);
    this.updateFooter();
    this.updateTurnInfo();
    this.updateEventBanner();
    this.renderActivityLog();
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
    
    // Os event listeners são gerenciados no setupEventListeners
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
    
    // Conteúdo da célula
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between';
    header.innerHTML = `
      <div>
        <div class="text-xs font-semibold leading-tight">${region.name}</div>
        <div class="text-[10px] text-gray-400">${region.biome}</div>
      </div>
      <div class="text-xs">${region.explorationLevel}⭐</div>
    `;
    
    const resources = document.createElement('div');
    resources.className = 'mt-1 flex items-center gap-1.5 text-base';
    Object.entries(region.resources).forEach(([key, value]) => {
      const span = document.createElement('span');
      span.className = 'flex items-center gap-0.5';
      span.innerHTML = `${RESOURCE_ICONS[key]}<span class="text-xs font-medium">${value}</span>`;
      resources.appendChild(span);
    });
    
    const footer = document.createElement('div');
    footer.className = 'flex items-center justify-between mt-3 text-sm';
    const controller = region.controller !== null 
      ? `${gameState.players[region.controller].icon} ${gameState.players[region.controller].name}`
      : '<span class="text-gray-400">Neutro</span>';

    // Mostrar estruturas com ícones
    const structureIcons = {
      'Abrigo': '🛖',
      'Torre de Vigia': '🏯',
      'Mercado': '🏪',
      'Laboratório': '🔬',
      'Santuário': '🛐'
    };

    const structureDisplay = region.structures.length 
      ? region.structures.map(s => structureIcons[s] || s).join(' ')
      : '—';

    footer.innerHTML = `
      <div>${controller}</div>
      <div class="text-lg">${structureDisplay}</div>
    `;
    
    cell.appendChild(header);
    cell.appendChild(resources);
    cell.appendChild(footer);
    
    // Event listeners
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
    
    // Activity Log no sidebar
    this.renderActivityLog('all');

// INDICADOR DE FASE - ATUALIZADO
  const turnPhaseIndicator = document.getElementById('turnPhaseIndicator');
  if (turnPhaseIndicator) {
    const phaseNames = {
      'renda': '💰 Renda',
      'acoes': '⚡ Ações', 
      'negociacao': '🤝 Negociação'
    };
    turnPhaseIndicator.textContent = phaseNames[gameState.currentPhase] || 'Renda';
  }
  }

  // ==================== ACTIVITY LOG ====================
  addActivityLog(type, playerName, action, details = '', turn = gameState.turn) {
    const timestamp = new Date().toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const logEntry = {
      id: Date.now(),
      timestamp,
      turn,
      type,
      playerName,
      action,
      details,
      isEvent: type === 'event',
      isMine: playerName === gameState.players[gameState.currentPlayerIndex]?.name
    };
    
    this.activityLogHistory.unshift(logEntry);
    this.activityLogHistory = this.activityLogHistory.slice(0, 15); // Manter apenas últimas 15 entradas
    
    this.renderActivityLog();
    this.scrollLogToTop();
  }

  renderActivityLog(filter = 'all') {
    // Renderizar no painel principal (se existir)
    if (this.logEntries) {
      this.logEntries.innerHTML = '';
      const filteredLogs = this.activityLogHistory.filter(log => {
        if (filter === 'mine') return log.isMine;
        if (filter === 'events') return log.isEvent;
        return true;
      });
      
      filteredLogs.forEach(log => {
        const entry = document.createElement('div');
        entry.className = `log-entry ${log.type}`;
        
        let icon = '';
        switch(log.type) {
          case 'action': icon = '⚡'; break;
          case 'build': icon = '🏗️'; break;
          case 'explore': icon = '⛏️'; break;
          case 'collect': icon = '🌾'; break;
          case 'negotiate': icon = '🤝'; break;
          case 'event': icon = '🎴'; break;
          case 'victory': icon = '🏆'; break;
          default: icon = '📝';
        }
        
        entry.innerHTML = `
          <span class="log-entry-icon">${icon}</span>
          <div class="log-entry-text">
            <span class="log-entry-player">${log.playerName}</span> ${log.action} 
            <span class="text-gray-400">${log.details}</span>
          </div>
          <span class="log-entry-turn">T${log.turn}</span>
        `;
        
        this.logEntries.appendChild(entry);
      });
    }
    
    // Renderizar no sidebar
    if (this.logEntriesSidebar) {
      this.logEntriesSidebar.innerHTML = '';
      const filteredLogs = this.activityLogHistory.filter(log => {
        if (filter === 'mine') return log.isMine;
        if (filter === 'events') return log.isEvent;
        return true;
      });
      
      filteredLogs.forEach(log => {
        const entry = document.createElement('div');
        entry.className = 'flex items-center gap-1';
        
        let icon = '';
        switch(log.type) {
          case 'action': icon = '⚡'; break;
          case 'build': icon = '🏗️'; break;
          case 'explore': icon = '⛏️'; break;
          case 'collect': icon = '🌾'; break;
          case 'negotiate': icon = '🤝'; break;
          case 'event': icon = '🎴'; break;
          case 'victory': icon = '🏆'; break;
          default: icon = '📝';
        }
        
        entry.innerHTML = `
          <span class="text-xs">${icon}</span>
          <span class="truncate">${log.playerName} ${log.action} ${log.details}</span>
          <span class="ml-auto text-[9px] text-gray-500">T${log.turn}</span>
        `;
        
        this.logEntriesSidebar.appendChild(entry);
      });
    }
    
    // Atualizar filtros visuais
    document.querySelectorAll('.log-filter-sidebar').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
  }

  scrollLogToTop() {
    const logContainer = this.logEntries?.parentElement;
    if (logContainer) {
      logContainer.scrollTop = 0;
    }
  }

  // ==================== ACHIEVEMENTS MODAL ====================
  renderAchievementsModal() {
    console.log('renderAchievementsModal() chamada');

    // Criar modal se não existir
    let modal = document.getElementById('achievementsModal');
    
    if (!modal) {
      console.log('Criando modal de conquistas...');
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

   // MOSTRAR O MODAL
      modal.classList.remove('hidden');

      // Configurar botão de fechar (se não configurado)
      const closeBtn = document.getElementById('achievementsModalClose');
     if (closeBtn && !closeBtn.hasListener) {
       closeBtn.addEventListener('click', () => {
         modal.classList.add('hidden');
       });
       closeBtn.hasListener = true;
     }
  }

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

setupAchievementsButton() {
  // Tentar encontrar o botão novamente (útil se a navbar foi escondida inicialmente)
  this.achievementsNavBtn = document.getElementById('achievementsNavBtn');
  
  if (this.achievementsNavBtn && !this.achievementsNavBtn.hasAchievementListener) {
    console.log('Configurando listener do achievementsNavBtn dinamicamente');
    this.achievementsNavBtn.addEventListener('click', () => {
      console.log('Botão de conquistas clicado!');
      this.renderAchievementsModal();
    });
    this.achievementsNavBtn.hasAchievementListener = true;
  }
}

  // ==================== TURN PHASE ====================
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

  updateTurnInfo() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (this.turnInfo) {
      this.turnInfo.textContent = `Turno: ${gameState.turn} • Jogador: ${currentPlayer?.name || '—'}`;
    }
  }

  // ==================== FOOTER & ACTIONS ====================
  // ui-manager.js - Atualize o método updateFooter()

updateFooter() {
  const player = gameState.players[gameState.currentPlayerIndex];
  const regionId = gameState.selectedRegionId;
  
  if (!player || !gameState.gameStarted) {
    [this.actionExploreBtn, this.actionCollectBtn, this.actionBuildBtn, this.actionNegotiateBtn]
      .forEach(b => b.disabled = true);
    this.actionsLeftEl.textContent = `Ações restantes: ${gameState.actionsLeft}`;
    return;
  }
  
  // VERIFICAÇÃO DE FASE - RESTRINGIR AÇÕES POR FASE
  const isActionPhase = gameState.currentPhase === 'acoes';
  const isNegotiationPhase = gameState.currentPhase === 'negociacao';
  
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
    this.actionExploreBtn.disabled = !baseEnabled || !isActionPhase || !hasEnoughPV || !canPayBiome;
    this.actionExploreBtn.textContent = 'Assumir Domínio';
  } else if (isOwnRegion) {
    const canAfford = window.gameLogic.canAffordAction('explorar');
    this.actionExploreBtn.disabled = !baseEnabled || !isActionPhase || !canAfford;
    this.actionExploreBtn.textContent = 'Explorar';
  } else {
    this.actionExploreBtn.disabled = true;
    this.actionExploreBtn.textContent = 'Explorar';
  }
  
  // Atualizar outros botões com verificação de fase
  this.actionBuildBtn.disabled = !baseEnabled || !isActionPhase || isNeutral || isEnemyRegion || 
                                 !window.gameLogic.canAffordAction('construir');
  this.actionCollectBtn.disabled = !baseEnabled || !isActionPhase || isNeutral || isEnemyRegion || 
                                   !window.gameLogic.canAffordAction('recolher');
  this.actionNegotiateBtn.disabled = !baseEnabled || !isNegotiationPhase || isNeutral || 
                                     !window.gameLogic.canAffordAction('negociar');
  
  // Atualizar contadores
  this.actionsLeftEl.textContent = `Ações restantes: ${gameState.actionsLeft}`;
  
  // Atualizar indicador de fase DINÂMICO
  const phaseNames = {
    'renda': '💰 Renda',
    'acoes': '⚡ Ações',
    'negociacao': '🤝 Negociação'
  };
  
  // Atualizar no topo
  if (this.phaseIndicator) {
    this.phaseIndicator.textContent = `Fase: ${phaseNames[gameState.currentPhase] || 'Renda'}`;
  }
  
  // Atualizar no sidebar
  const turnPhaseIndicator = document.getElementById('turnPhaseIndicator');
  if (turnPhaseIndicator) {
    turnPhaseIndicator.textContent = phaseNames[gameState.currentPhase] || 'Renda';
  }
  
  // Atualizar texto do botão de término do turno baseado na fase
  if (this.endTurnBtn) {
    if (gameState.currentPhase === 'acoes') {
      this.endTurnBtn.textContent = 'Ir para Negociação';
    } else if (gameState.currentPhase === 'negociacao') {
      this.endTurnBtn.textContent = 'Terminar Turno';
    } else {
      this.endTurnBtn.textContent = 'Término do Turno';
    }
  }
}


  // ==================== TOOLTIP FUNCTIONS ====================
  showRegionTooltip(region, targetEl) {
    const owner = region.controller !== null 
      ? `${gameState.players[region.controller].icon} ${gameState.players[region.controller].name}`
      : 'Neutro';
    const structures = region.structures.length ? region.structures.join(', ') : 'Nenhuma';
    
    this.tooltipTitle.textContent = `${region.name} — ${region.biome}`;
    this.tooltipBody.innerHTML = `
      <div class="text-xs text-gray-300">Exploração <strong>${region.explorationLevel}⭐</strong></div>
      <div class="text-xs text-gray-300 mt-1">Controlado por <strong>${owner}</strong></div>
      <div class="text-xs text-gray-300 mt-1">Estruturas <strong>${structures}</strong></div>
      <div class="text-xs text-gray-300 mt-2">Recursos</div>
      <div class="mt-1 flex flex-col gap-1">
        ${Object.entries(region.resources)
          .map(([key, value]) => `
            <div class="flex items-center gap-1.5">
              <span class="text-base">${RESOURCE_ICONS[key]}</span>
              <span class="text-xs font-medium">${value}</span>
            </div>
          `).join('')}
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

  // ==================== UTILITIES ====================
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [255, 255, 255];
  }

  clearRegionSelection() {
    gameState.selectedRegionId = null;
    document.querySelectorAll('.board-cell').forEach(c => c.classList.remove('region-selected'));
  }

  // ==================== MANUAL ====================
  openManual() {
    this.manualModal.classList.remove('hidden');
  }

  closeManual() {
    this.manualModal.classList.add('hidden');
  }

  handleManualTabClick(e) {
    this.manualTabs.forEach(t => t.classList.remove('active'));
    e.currentTarget.classList.add('active');
    this.showManualTab(e.currentTarget.dataset.tab);
  }

  showManualTab(tabId) {
    this.manualContents.forEach(c => c.classList.add('hidden'));
    const el = document.getElementById(tabId);
    if (el) el.classList.remove('hidden');
  }

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

  // ==================== EVENT SYSTEM ====================
  updateEventBanner() {
  if (gameState.currentEvent && gameState.eventTurnsLeft > 0) {
    this.eventBannerIcon.textContent = gameState.currentEvent.icon;
    this.eventBannerTitle.textContent = gameState.currentEvent.name;
    this.eventBannerTurns.textContent = 
      `${gameState.eventTurnsLeft} turno${gameState.eventTurnsLeft > 1 ? 's' : ''} restante${gameState.eventTurnsLeft > 1 ? 's' : ''}`;
    this.eventBannerEffect.textContent = gameState.currentEvent.effect;
    
    // Remover classes de tipo anteriores
    this.eventBanner.classList.remove('event-positive', 'event-negative', 'event-mixed', 'event-neutral');
    
    // Determinar categoria
    let category = 'neutral';
    if (gameState.currentEvent.id && this.getEventCategory) {
      category = this.getEventCategory(gameState.currentEvent.id);
    } else if (gameState.currentEvent.type) {
      category = gameState.currentEvent.type;
    }
    
    this.eventBanner.classList.add(`event-${category}`);
    
    // ADICIONAR ESTILOS INLINE PARA GARANTIR TEXTO BRANCO
    this.eventBannerTitle.style.color = '#ffffff';
    this.eventBannerTitle.style.fontWeight = 'bold';
    this.eventBannerTitle.style.textShadow = '0 1px 3px rgba(0, 0, 0, 0.8)';
    
    this.eventBannerEffect.style.color = 'rgba(255, 255, 255, 0.95)';
    this.eventBannerEffect.style.fontWeight = '500';
    this.eventBannerEffect.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.7)';
    
    this.eventBannerTurns.style.color = '#ffffff';
    this.eventBannerTurns.style.fontWeight = '600';
    this.eventBannerTurns.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    
    this.eventBannerIcon.style.color = '#ffffff';
    this.eventBannerIcon.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.5)';
    
    this.eventBanner.classList.remove('hidden');
  } else {
    this.eventBanner.classList.add('hidden');
  }
}

  hideEventBanner() {
    this.eventBanner.classList.add('hidden');
  }

  openEventModal(event) {
    if (!event) return;
    
    this.eventIconEl.textContent = event.icon;
    this.eventTitleEl.textContent = event.name;
    this.eventDescriptionEl.textContent = event.description;
    this.eventEffectEl.textContent = `Efeito: ${event.effect}`;
    this.eventDurationEl.textContent = event.duration > 0 
      ? `Duração: ${event.duration} turno(s)` 
      : `Duração: instantâneo`;
    
    this.eventModal.classList.remove('hidden');
  }

  closeEventModal() {
    this.eventModal.classList.add('hidden');
  }

  getEventCategory(eventId) {
    const positive = ['primavera', 'mercado', 'festival', 'exploracao', 'enchente'];
    const negative = ['seca', 'tempestade', 'inflacao', 'escassez_pedra', 'areia', 'depressao'];
    const mixed = ['jazida', 'inverno', 'tecnologia', 'arqueologia'];
    
    if (positive.includes(eventId)) return 'positive';
    if (negative.includes(eventId)) return 'negative';
    if (mixed.includes(eventId)) return 'mixed';
    return 'neutral';
  }

  updateEventModal(event) {
    if (this.eventIconEl) this.eventIconEl.textContent = event.icon;
    if (this.eventTitleEl) this.eventTitleEl.textContent = event.name;
    if (this.eventDescriptionEl) this.eventDescriptionEl.textContent = event.description;
    if (this.eventEffectEl) this.eventEffectEl.textContent = `Efeito: ${event.effect}`;
    if (this.eventDurationEl) {
      const durationText = event.duration === 0 ? 'Imediato' : `${event.duration} turno(s)`;
      this.eventDurationEl.textContent = `Duração: ${durationText}`;
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

  // ==================== STRUCTURE MODAL ====================
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
    
    // Verificar se a função existe (PASSO 4)
    if (window.gameLogic && window.gameLogic.handleBuild) {
      console.log(`Construindo ${structure.name}`);
      window.gameLogic.handleBuild(structure.name);
    } else if (window.gameLogic && window.gameLogic.handleBuildStructure) {
      // Fallback para compatibilidade
      console.log(`Construindo ${structure.name} (usando handleBuildStructure)`);
      window.gameLogic.handleBuildStructure(structure.name);
    } else {
      console.error('Nenhuma função de construção encontrada em gameLogic');
      window.utils.showFeedback('Erro ao construir estrutura. Função não encontrada.', 'error');
    }
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

  // ==================== NEGOTIATION MODAL ====================
  openNegotiationModal() {
    const initiator = gameState.players[gameState.currentPlayerIndex];
    
    // Populate targets (other players)
    this.negTargetSelect.innerHTML = '';
    gameState.players.forEach(p => {
      if (p.id !== initiator.id) {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.icon} ${p.name}`;
        this.negTargetSelect.appendChild(opt);
      }
    });
    
    if (this.negTargetSelect.options.length === 0) {
      window.utils.showFeedback('Nenhum outro jogador disponível para negociar.', 'warning');
      return;
    }

    // Populate offerRegions with initiator's regions
    this.offerRegionsDiv.innerHTML = '';
    initiator.regions.forEach(rid => {
      const chkWrap = document.createElement('label');
      chkWrap.className = 'flex items-center gap-2 p-2 bg-gray-800/60 rounded';
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.value = rid;
      const span = document.createElement('span');
      span.className = 'text-sm';
      span.textContent = `${gameState.regions[rid].name} (${gameState.regions[rid].biome})`;
      chkWrap.appendChild(chk);
      chkWrap.appendChild(span);
      this.offerRegionsDiv.appendChild(chkWrap);
    });

    // Populate reqRegions with target's regions
    this.populateReqRegions();

    this.negotiationModal.classList.remove('hidden');
  }

  populateReqRegions() {
    const targetId = Number(this.negTargetSelect.value);
    this.reqRegionsDiv.innerHTML = '';
    const target = gameState.players.find(p => p.id === targetId);
    if (!target) return;
    
    target.regions.forEach(rid => {
      const chkWrap = document.createElement('label');
      chkWrap.className = 'flex items-center gap-2 p-2 bg-gray-800/60 rounded';
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.value = rid;
      const span = document.createElement('span');
      span.className = 'text-sm';
      span.textContent = `${gameState.regions[rid].name} (${gameState.regions[rid].biome})`;
      chkWrap.appendChild(chk);
      chkWrap.appendChild(span);
      this.reqRegionsDiv.appendChild(chkWrap);
    });
  }

  closeNegotiationModal() {
    this.negotiationModal.classList.add('hidden');
  }

  presentNegotiationToTarget(neg) {
    const initiator = gameState.players.find(p => p.id === neg.initiatorId);
    const target = gameState.players.find(p => p.id === neg.targetId);
    if (!initiator || !target) {
      window.utils.showFeedback('Erro interno na negociação.', 'error');
      return;
    }

    // Render body summary
    const summary = [];
    if (Object.values(neg.offer).some(v => v > 0) || (neg.offer.regions && neg.offer.regions.length)) {
      summary.push(`<div class="mb-2"><strong>${initiator.icon} ${initiator.name}</strong> oferece:</div>`);
      if (neg.offer.regions && neg.offer.regions.length) {
        summary.push(`<div class="mb-1 text-sm">Regiões: ${neg.offer.regions.map(r => gameState.regions[r].name).join(', ')}</div>`);
      }
      summary.push(`<div class="text-sm">Recursos: ${['madeira','pedra','ouro','agua'].map(k => `${k}:${neg.offer[k]}`).join(' • ')}</div>`);
    } else {
      summary.push(`<div class="text-sm">Sem oferta de recursos ou regiões.</div>`);
    }

    if (Object.values(neg.request).some(v => v > 0) || (neg.request.regions && neg.request.regions.length)) {
      summary.push(`<div class="mt-3 mb-2"><strong>Solicita:</strong></div>`);
      if (neg.request.regions && neg.request.regions.length) {
        summary.push(`<div class="mb-1 text-sm">Regiões: ${neg.request.regions.map(r => gameState.regions[r].name).join(', ')}</div>`);
      }
      summary.push(`<div class="text-sm">Recursos: ${['madeira','pedra','ouro','agua'].map(k => `${k}:${neg.request[k]}`).join(' • ')}</div>`);
    } else {
      summary.push(`<div class="text-sm mt-2">Sem solicitação de recursos/ regiões.</div>`);
    }

    this.negResponseTitle.textContent = `Proposta de ${initiator.icon} ${initiator.name}`;
    this.negResponseBody.innerHTML = summary.join('');
    this.negResponseModal.classList.remove('hidden');
  }

  // ==================== VICTORY MODAL ====================
  openVictoryModal(winner) {
    this.victoryModalTitle.textContent = 'Vitória!';
    this.victoryModalMessage.textContent = `Parabéns, ${winner.name}! Você venceu Gaia!`;
    this.victoryModal.classList.remove('hidden');
  }

  closeVictoryModal() {
    this.victoryModal.classList.add('hidden');
  }

  // ==================== ALERT MODAL ====================
  showAlert(title, message, type = 'info') {
    let icon = 'ℹ️';
    if (type === 'warning') icon = '🟡';
    if (type === 'error') icon = '🔴';
    if (type === 'success') icon = '🟢';
    
    this.alertIconEl.textContent = icon;
    this.alertTitleEl.textContent = title;
    this.alertMessageEl.textContent = message;
    
    // Set buttons: simple OK
    this.alertButtonsEl.innerHTML = '';
    const ok = document.createElement('button');
    ok.className = 'px-4 py-2 bg-gray-800 border border-white/6 rounded-full text-white';
    ok.textContent = 'OK';
    ok.addEventListener('click', () => this.hideAlert());
    this.alertButtonsEl.appendChild(ok);
    
    this.alertModal.classList.remove('hidden');
    setTimeout(() => this.alertModal.classList.add('show'), 10);
  }

  hideAlert() {
    this.alertModal.classList.remove('show');
    setTimeout(() => this.alertModal.classList.add('hidden'), 180);
  }

  showConfirm(title, message) {
    return new Promise(resolve => {
      let resolved = false;
      this.alertIconEl.textContent = '❓';
      this.alertTitleEl.textContent = title;
      this.alertMessageEl.textContent = message;
      this.alertButtonsEl.innerHTML = '';
      
      const no = document.createElement('button');
      no.className = 'px-4 py-2 bg-gray-800 border border-white/6 rounded-full text-white mr-2';
      no.textContent = 'Não';
      no.addEventListener('click', () => {
        if (resolved) return;
        resolved = true;
        this.hideAlert();
        resolve(false);
      });

      const yes = document.createElement('button');
      yes.className = 'px-4 py-2 bg-green-600 rounded-full text-white';
      yes.textContent = 'Sim';
      yes.addEventListener('click', () => {
        if (resolved) return;
        resolved = true;
        this.hideAlert();
        resolve(true);
      });

      this.alertButtonsEl.appendChild(no);
      this.alertButtonsEl.appendChild(yes);
      this.alertModal.classList.remove('hidden');
      setTimeout(() => this.alertModal.classList.add('show'), 10);
    });
  }

  showFeedback(message, type = 'info') {
    const t = type === 'error' ? 'Erro' : type === 'success' ? 'Sucesso' : 'Informação';
    this.showAlert(t, message, type);
  }
}

// Exportar para uso global
export { UIManager };
