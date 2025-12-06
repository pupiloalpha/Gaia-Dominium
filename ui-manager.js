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
    this.hasLoadedGameBeenProcessed = false;
    this.isBuilding = false;
    this.cacheElements();
    this.setupEventListeners();
    this.incomeModal = document.getElementById('incomeModal');
    this.incomeOkBtn = document.getElementById('incomeOkBtn');
    this.incomePlayerName = document.getElementById('incomePlayerName');
    this.incomeResources = document.getElementById('incomeResources');

    // Garantir que o gameState seja acessível globalmente para compatibilidade
    window.gameState = gameState;
  }

  // Verifica os recursos do jogador
  canPlayerAffordAction(actionType, player) {
    const costs = {
      'explorar': { madeira: 2, agua: 1 },
      'recolher': { madeira: 1 },
      'construir': { madeira: 3, pedra: 2, ouro: 1 },
      'negociar': { ouro: 1 }
    };
  
    const cost = costs[actionType] || {};
    return Object.entries(cost).every(([resource, amount]) => {
      return (player.resources[resource] || 0) >= amount;
    });
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
    
    // Modal de Renda
    this.incomeOkBtn?.addEventListener('click', () => this.closeIncomeModal());

    // Structure modal
    this.structureModalClose?.addEventListener('click', () => this.closeStructureModal());
    
    // Fechar modal ao clicar fora
    this.structureModal?.addEventListener('click', (e) => {
      if (e.target === this.structureModal) {
        this.closeStructureModal();
      }
    });


// Controle de transparência das regiões no mapa
// Controle de transparência
const transparencySlider = document.getElementById('cellTransparencySlider');
const transparencyValue = document.getElementById('transparencyValue');

if (transparencySlider && transparencyValue) {
  // Função para atualizar transparência
  const updateTransparency = (value) => {
    // Converter para decimal (5% -> 0.05, 50% -> 0.5)
    const opacity = value / 100;
    
    // Calcular blur proporcional (mais opaco = menos blur)
    const blur = Math.max(0.5, 2 - (opacity * 3)) + 'px';
    
    // Atualizar variáveis CSS
    document.documentElement.style.setProperty('--cell-bg-opacity', opacity);
    document.documentElement.style.setProperty('--cell-blur', blur);
    
    // Atualizar valor exibido
    transparencyValue.textContent = `${value}%`;
    
    // Adicionar efeito visual ao valor
    transparencyValue.style.transform = 'scale(1.1)';
    setTimeout(() => {
      transparencyValue.style.transform = 'scale(1)';
    }, 150);
  };
  
  // Event listener para mudanças no slider
  transparencySlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    updateTransparency(value);
  });
  
  // Event listener para mudanças por clique/arrasto
  transparencySlider.addEventListener('change', (e) => {
    const value = parseInt(e.target.value);
    
    // Salvar preferência do usuário
    localStorage.setItem('gaia-cell-transparency', value);
    
    // Feedback visual
    window.utils.showFeedback(`Transparência ajustada para ${value}%`, 'info');
  });
  
  // Carregar preferência salva ao iniciar
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

// Botão de reset
const resetBtn = document.getElementById('resetTransparencyBtn');
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    this.resetTransparency();
  });
}

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

    document.addEventListener('click', (e) => {

      // Se estamos no meio de uma construção, NÃO desselecionar
  if (this.isBuilding) {
    return;
  }
  // Lista de elementos que NÃO devem desselecionar região
  const noDeselectSelectors = [
    '.board-cell',                    // Células do mapa
    '.action-button',                 // Botões de ação
    '#endTurnBtn',                    // Botão de término de turno
    '.modal',                         // Qualquer modal
    '.modal-content',                 // Conteúdo de modal
    '#structureModal',                // Modal de estruturas
    '#structureModal *',              // Qualquer coisa dentro do modal de estruturas
    '#structureOptions',              // Opções de estrutura
    '#structureOptions *',            // Qualquer coisa dentro das opções
    '.structure-option',              // Opções de estrutura (se houver classe)
    '#regionTooltip',                 // Tooltip de região
    '#regionTooltip *',               // Qualquer coisa dentro do tooltip
    '#sidebar',                       // Sidebar
    '#sidebar *',                     // Qualquer coisa na sidebar
    '#gameFooter',                    // Footer do jogo
    '#gameFooter *',                  // Qualquer coisa no footer
    '#manualIcon',                    // Ícone do manual
    '#achievementsNavBtn',            // Botão de conquistas
    '.icon-option',                   // Opções de ícone
    '#playerName',                    // Campo de nome do jogador
    '#addPlayerBtn',                  // Botão adicionar jogador
    '#startGameBtn'                   // Botão iniciar jogo
  ];
  
  // Verificar se o clique foi em um elemento que NÃO desseleciona
  let shouldNotDeselect = false;
  
  for (const selector of noDeselectSelectors) {
    if (e.target.closest(selector)) {
      shouldNotDeselect = true;
      break;
    }
  }
  
  // Se clicou fora de elementos protegidos E há uma região selecionada
  if (!shouldNotDeselect && gameState.selectedRegionId !== null) {
    // Desselecionar região
    gameState.selectedRegionId = null;
    document.querySelectorAll('.board-cell').forEach(c => c.classList.remove('region-selected'));
    
    // Atualizar UI
    this.updateFooter();
    this.renderSidebar(gameState.selectedPlayerForSidebar);
    
    console.log('🗺️ Região desselecionada (clique fora)');
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
  // Verificar se é um jogo carregado
  if (gameState.gameStarted && !this.hasLoadedGameBeenProcessed) {
    this.checkAndFixLoadedState();
    this.restoreUIFromLoadedGame();
    this.hasLoadedGameBeenProcessed = true;
  }
  
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
    
    // Os event listeners são gerenciados no setupEventListeners
  }

  renderBoard() {
    this.boardContainer.innerHTML = '';
    
    gameState.regions.forEach((region, index) => {
      const cell = this.createRegionCell(region, index);
      this.boardContainer.appendChild(cell);
    });
  }

  // Função que formata as células no mapa
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
  
  // CABEÇALHO COMPACTO
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
  
  // LINHA ÚNICA DE RECURSOS
  const resourcesLine = document.createElement('div');
  resourcesLine.className = 'flex items-center justify-between gap-1 mt-1';
  
  // Ordenar recursos para consistência
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
  
  // Distribuir em linha única com espaçamento igual
  resourcePairs.forEach((resource, idx) => {
    const pair = document.createElement('div');
    pair.className = 'flex items-center gap-0.5 flex-1 justify-center';
    pair.innerHTML = `
      <span class="text-xs">${resource.icon}</span>
      <span class="text-xs font-bold text-white">${resource.value}</span>
    `;
    resourcesLine.appendChild(pair);
  });
  
  // Se não houver recursos, mostrar placeholder
  if (resourcePairs.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.className = 'text-[9px] text-gray-400 italic flex-1 text-center';
    placeholder.textContent = 'Sem recursos';
    resourcesLine.appendChild(placeholder);
  }
  
  // FOOTER COMPACTO
  const footer = document.createElement('div');
  footer.className = 'flex items-center justify-between mt-2 pt-1 border-t border-white/5';
  
  const controller = region.controller !== null 
    ? gameState.players[region.controller].icon
    : '<span class="text-gray-400 text-xs">🏳️</span>';

  // Estruturas compactas
  const structureIcons = {
    'Abrigo': '🛖',
    'Torre de Vigia': '🏯',
    'Mercado': '🏪',
    'Laboratório': '🔬',
    'Santuário': '🛐'
  };

  let structureDisplay = '—';
  if (region.structures.length > 0) {
    // Mostrar apenas primeira estrutura
    structureDisplay = structureIcons[region.structures[0]] || '🏗️';
    if (region.structures.length > 1) {
      structureDisplay += `+${region.structures.length - 1}`;
    }
  }

  footer.innerHTML = `
    <div class="text-xs font-medium text-white">${controller}</div>
    <div class="text-xs">${structureDisplay}</div>
  `;
  
  // Montar célula
  cell.appendChild(header);
  cell.appendChild(resourcesLine);
  cell.appendChild(footer);
  
  // Event listeners
  cell.addEventListener('mouseenter', (e) => this.showRegionTooltip(region, e.currentTarget));
  cell.addEventListener('mousemove', (e) => this.positionTooltip(e.currentTarget));
  cell.addEventListener('mouseleave', () => this.hideRegionTooltip());
  
  cell.addEventListener('click', (e) => {
    e.stopPropagation();
    const regionId = Number(cell.dataset.regionId);
    
    // Toggle selection
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

  // Adicione este método para garantir seleção durante construção:
forceSelectionDuringBuild(regionId) {
  // Salvar o ID original
  const originalRegionId = gameState.selectedRegionId;
  
  // Forçar seleção
  gameState.selectedRegionId = regionId;
  
  // Garantir visualmente
  document.querySelectorAll('.board-cell').forEach(cell => {
    const cellRegionId = Number(cell.dataset.regionId);
    if (cellRegionId === regionId) {
      cell.classList.add('region-selected');
    } else {
      cell.classList.remove('region-selected');
    }
  });
  
  // Restaurar após construção (com timeout)
  setTimeout(() => {
    if (this.isBuilding) {
      // Ainda construindo, manter seleção
      return;
    }
    // Se não estiver mais construindo, restaurar seleção original
    if (originalRegionId !== regionId) {
      gameState.selectedRegionId = originalRegionId;
    }
  }, 100);
}

// Atualiza fase do jogador no turno
updatePhaseIndicator() {
  const phaseIndicator = document.getElementById('phaseIndicator');
  if (!phaseIndicator) return;
  
  const phaseNames = {
    'renda': '💰 Renda',
    'acoes': '⚡ Ações',
    'negociacao': '🤝 Negociação'
  };
  
  phaseIndicator.textContent = `Fase: ${phaseNames[gameState.currentPhase] || 'Renda'}`;
}

// Carrega as conquistas do jogador
  renderAchievements() {
  const achievementsList = document.getElementById('achievementsList');
  if (!achievementsList) return;
  
  achievementsList.innerHTML = '';
  
  const playerIndex = gameState.selectedPlayerForSidebar;
  const player = gameState.players[playerIndex];
  if (!player) return;
  
  const unlockedAchievements = achievementsState.unlockedAchievements[playerIndex] || [];
  const playerStats = achievementsState.playerAchievements[playerIndex];
  
  const achievementsArray = Object.values(ACHIEVEMENTS_CONFIG);
  
  // Filtrar conquistas com progresso > 0
  const achievementsWithProgress = achievementsArray.filter(achievement => {
    let progress = 0;
    
    switch (achievement.type) {
      case 'explored':
        progress = playerStats?.explored || 0;
        break;
      case 'built':
        progress = playerStats?.built || 0;
        break;
      case 'negotiated':
        progress = playerStats?.negotiated || 0;
        break;
      case 'collected':
        progress = playerStats?.collected || 0;
        break;
      case 'biomes':
        progress = playerStats?.controlledBiomes?.size || 0;
        break;
      case 'resources':
        const resources = playerStats?.maxResources || {};
        progress = Object.values(resources).filter(value => value >= achievement.requirement).length;
        break;
      default:
        progress = 0;
    }
    
    return progress > 0;
  });
  
  // Se não houver conquistas com progresso, mostrar mensagem
  if (achievementsWithProgress.length === 0) {
    achievementsList.innerHTML = `
      <div class="text-xs text-gray-400 italic p-2 text-center">
        Nenhuma conquista em progresso ainda
      </div>
    `;
    return;
  }
  
  // Renderizar apenas conquistas com progresso
  achievementsWithProgress.forEach(achievement => {
    const isUnlocked = unlockedAchievements.includes(achievement.id);
    
    const item = document.createElement('div');
    item.className = `achievement ${isUnlocked ? 'achievement-unlocked' : ''}`;
    
    // Determinar progresso
    let progress = 0;
    let progressText = '';
    
    switch (achievement.type) {
      case 'explored':
        progress = playerStats?.explored || 0;
        progressText = `${progress}/${achievement.requirement}`;
        break;
      case 'built':
        progress = playerStats?.built || 0;
        progressText = `${progress}/${achievement.requirement}`;
        break;
      case 'negotiated':
        progress = playerStats?.negotiated || 0;
        progressText = `${progress}/${achievement.requirement}`;
        break;
      case 'collected':
        progress = playerStats?.collected || 0;
        progressText = `${progress}/${achievement.requirement}`;
        break;
      case 'biomes':
        progress = playerStats?.controlledBiomes?.size || 0;
        progressText = `${progress}/${achievement.requirement}`;
        break;
      case 'resources':
        const resources = playerStats?.maxResources || {};
        progress = Object.values(resources).filter(value => value >= achievement.requirement).length;
        progressText = `${progress}/4 recursos`;
        break;
    }
    
    const progressPercent = Math.min(100, (progress / achievement.requirement) * 100);
    
    item.innerHTML = `
      <span class="achievement-icon text-xl">${achievement.icon}</span>
      <div class="achievement-info flex-1">
        <div class="achievement-name ${isUnlocked ? 'text-yellow-300' : 'text-gray-300'} font-semibold text-xs">
          ${achievement.name}
          ${isUnlocked ? ' ✓' : ''}
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

// Carrega os dados do jogador no painel lateral
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

 // ==================== INCOME MODAL ====================
showIncomeModal(player, income) {
  console.log('showIncomeModal executado para:', player.name);
  
  if (!this.incomeModal) {
    console.error('Elemento incomeModal não encontrado!');
    return;
  }
  
  // Configurar texto melhorado
  const turnText = gameState.turn > 1 ? `Turno ${gameState.turn}` : 'Início do Jogo';
  this.incomePlayerName.innerHTML = `
    <span class="text-yellow-300 font-bold">${player.name}</span><br>
    <span class="text-sm text-gray-300">${turnText} • Fase de Renda</span>
  `;
  
  // Limpar recursos anteriores
  this.incomeResources.innerHTML = '';
  
  // Verificar se há recursos para mostrar
  const hasResources = Object.values(income).some(value => value > 0);
  
  if (!hasResources) {
    const noResources = document.createElement('div');
    noResources.className = 'text-center py-4 text-gray-400';
    noResources.textContent = 'Nenhum recurso recebido neste turno';
    this.incomeResources.appendChild(noResources);
  } else {
    // Adicionar cada recurso recebido
    const resourcesToShow = [
      { key: 'madeira', label: 'Madeira', icon: '🪵' },
      { key: 'pedra', label: 'Pedra', icon: '🪨' },
      { key: 'ouro', label: 'Ouro', icon: '🪙' },
      { key: 'agua', label: 'Água', icon: '💧' },
      { key: 'pv', label: 'Pontos de Vitória', icon: '⭐' }
    ];
    
    resourcesToShow.forEach(({ key, label, icon }) => {
      const amount = income[key] || 0;
      if (amount > 0) {
        const resourceEl = document.createElement('div');
        resourceEl.className = 'flex items-center justify-between py-2 border-b border-gray-700/50';
        resourceEl.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="text-xl">${icon}</span>
            <span class="text-gray-200">${label}</span>
          </div>
          <span class="text-lg font-bold ${key === 'pv' ? 'text-yellow-400' : 'text-green-400'}">+${amount}</span>
        `;
        this.incomeResources.appendChild(resourceEl);
      }
    });
  }
  
  // Adicionar mensagem de rodapé
  const footerMsg = document.createElement('div');
  footerMsg.className = 'mt-4 text-center text-xs text-gray-400';
  footerMsg.textContent = 'Clique em OK para iniciar suas ações';
  this.incomeResources.appendChild(footerMsg);
  
  // Remover hidden e mostrar modal
  this.incomeModal.classList.remove('hidden');
  console.log('Modal de renda exibida para', player.name);
}

setupIncomeModalListeners() {
  // Encontrar botão novamente (pode ter sido recriado)
  const incomeOkBtn = document.getElementById('incomeOkBtn');
  
  if (!incomeOkBtn) {
    console.error('Botão incomeOkBtn não encontrado após recriação');
    return;
  }
  
  // Remover todos os event listeners existentes
  const newIncomeOkBtn = incomeOkBtn.cloneNode(true);
  incomeOkBtn.parentNode.replaceChild(newIncomeOkBtn, incomeOkBtn);
  
  // Adicionar novo listener
  newIncomeOkBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Botão OK do modal de renda clicado via setupIncomeModalListeners');
    
    if (this.closeIncomeModal) {
      this.closeIncomeModal();
    } else {
      console.error('Método closeIncomeModal não disponível');
      
      // Fallback: fechar modal e avançar fase manualmente
      const modal = document.getElementById('incomeModal');
      if (modal) modal.classList.add('hidden');
      
      if (window.gameState) {
        window.gameState.currentPhase = 'acoes';
        if (window.uiManager) {
          window.uiManager.updateUI();
          window.uiManager.updateFooter();
        }
      }
    }
  });
  
  // Atualizar referência
  this.incomeOkBtn = newIncomeOkBtn;
  
  console.log('Event listeners do modal de renda configurados com sucesso');
}

closeIncomeModal() {
  console.log('Método closeIncomeModal chamado');
  
  if (!this.incomeModal) {
    console.error('Elemento incomeModal não encontrado!');
    return;
  }
  
  // Fechar modal
  this.incomeModal.classList.add('hidden');
  console.log('Modal de renda fechado');
  
  // Garantir que estamos mudando para fase de ações
  if (gameState.gameStarted) {
    gameState.currentPhase = 'acoes';
    gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
    
    console.log('Fase alterada para: ações, ações restantes:', gameState.actionsLeft);
    
    // Atualizar interface
    setTimeout(() => {
      if (window.uiManager) {
        window.uiManager.updateUI();
        window.uiManager.updateFooter();
      }
    }, 50);
    
    // Registrar no log de atividades
    const currentPlayer = getCurrentPlayer();
    if (currentPlayer) {
      addActivityLog('phase', currentPlayer.name, 'iniciou fase de ações', '', gameState.turn);
    }
    
  }
}

  // ==================== ACHIEVEMENTS MODAL ====================
  renderAchievementsModal() {
  console.log('renderAchievementsModal() chamada');

  let modal = document.getElementById('achievementsModal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'achievementsModal';
    modal.className = 'hidden fixed inset-0 z-[110] flex items-center justify-center p-6';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/70"></div>
      <div class="relative w-full max-w-4xl bg-gray-900/95 backdrop-blur-md border border-yellow-500/30 rounded-2xl shadow-xl p-6">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h2 class="text-2xl text-yellow-300 font-semibold">🏆 Conquistas</h2>
            <p id="achievementsPlayerName" class="text-gray-300 text-sm"></p>
          </div>
          <button id="achievementsModalClose" class="text-gray-300 hover:text-white text-xl">✖</button>
        </div>
        <div id="achievementsModalContent" class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  // Preencher conteúdo
  const content = document.getElementById('achievementsModalContent');
  const playerNameEl = document.getElementById('achievementsPlayerName');
  if (!content || !playerNameEl) return;
  
  content.innerHTML = '';
  
  // Usar o jogador ATUAL (do turno), não o selecionado no sidebar
  const playerIndex = gameState.currentPlayerIndex;
  const player = gameState.players[playerIndex];
  const unlockedAchievements = achievementsState.unlockedAchievements[playerIndex] || [];
  const playerStats = achievementsState.playerAchievements[playerIndex];
  
  // Mostrar nome do jogador
  playerNameEl.textContent = `Jogador atual: ${player.name}`;
  
  // Renderizar TODAS as conquistas
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
        const biomesList = playerStats?.controlledBiomes ? 
          Array.from(playerStats.controlledBiomes).join(', ') || 'Nenhum' : 'Nenhum';
        progressText = `Biomas: ${progress}/${achievement.requirement}`;
        break;
      case 'resources':
        const resources = playerStats?.maxResources || {};
        const resourceCount = Object.values(resources).filter(value => value >= achievement.requirement).length;
        progress = resourceCount;
        progressText = `Recursos: ${progress}/4 com ${achievement.requirement}+`;
        break;
      default:
        progressText = isUnlocked ? '✅ Desbloqueado' : '🔒 Bloqueado';
    }
    
    const progressPercent = Math.min(100, (progress / achievement.requirement) * 100);
    
    card.innerHTML = `
      <div class="flex items-start gap-3">
        <span class="text-2xl">${achievement.icon}</span>
        <div class="flex-1">
          <h3 class="font-bold ${isUnlocked ? 'text-yellow-300' : 'text-gray-300'}">
            ${achievement.name}
            ${isUnlocked ? '<span class="text-green-400 ml-2">✓</span>' : ''}
          </h3>
          <p class="text-sm text-gray-300 mt-1">${achievement.description}</p>
          
          <div class="mt-3">
            <div class="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progresso</span>
              <span>${progressPercent.toFixed(0)}%</span>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-2">
              <div class="bg-green-500 h-2 rounded-full" style="width: ${progressPercent}%"></div>
            </div>
            <div class="text-xs text-gray-400 mt-1">${progressText}</div>
          </div>
          
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

  // Configurar botão de fechar
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

checkAndFixLoadedState() {
  // Verificar se há inconsistências no estado carregado
  if (gameState.gameStarted) {
    // Garantir que há um jogador atual
    if (gameState.currentPlayerIndex === undefined || gameState.currentPlayerIndex === null) {
      gameState.currentPlayerIndex = 0;
    }
    
    // Garantir que há fase definida
    if (!gameState.currentPhase) {
      gameState.currentPhase = 'renda';
    }
    
    // Garantir que há ações definidas
    if (gameState.actionsLeft === undefined) {
      gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
    }
    
    console.log('Estado verificado e corrigido:', {
      playerIndex: gameState.currentPlayerIndex,
      phase: gameState.currentPhase,
      actions: gameState.actionsLeft
    });
  }
}

restoreUIFromLoadedGame() {
  // Garantir que todos os elementos estejam visíveis
  if (gameState.gameStarted) {
    // Mostrar elementos do jogo
    const elementsToShow = [
      'gameNavbar', 'gameContainer', 'sidebar', 'gameMap', 'gameFooter'
    ];
    
    elementsToShow.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('hidden');
    });
    
    // Esconder tela inicial e ícone do manual
    const initialScreen = document.getElementById('initialScreen');
    if (initialScreen) initialScreen.style.display = 'none';
    
    const manualIcon = document.getElementById('manualIcon');
    if (manualIcon) manualIcon.classList.add('hidden');
    
    // Atualizar UI completamente
    this.updateUI();
    this.updateFooter();
    this.renderBoard();
    this.renderHeaderPlayers();
    this.renderSidebar(gameState.selectedPlayerForSidebar);
    
    console.log('UI restaurada do jogo salvo');
  }
}

  // ==================== FOOTER & ACTIONS ====================

updateFooter() {
  // Verificar se o jogo está ativo
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
  
  // Usar a fase atual corretamente
  const currentPhase = gameState.currentPhase || 'renda';
  const isActionPhase = currentPhase === 'acoes';
  const isNegotiationPhase = currentPhase === 'negociacao';
  
  // DEFINIR phaseNames AQUI NO INÍCIO DO MÉTODO
  const phaseNames = {
    'renda': '💰 Renda',
    'acoes': '⚡ Ações',
    'negociacao': '🤝 Negociação'
  };
  
  // Atualizar indicador de fase na navbar
  this.updatePhaseIndicator();
  
  // Se não houver jogador atual, sair
  if (!player) return;
  
  const baseEnabled = gameState.actionsLeft > 0;
  
  // Configurar botões baseado na fase
  if (regionId === null || regionId === undefined) {
    // Sem região selecionada
    if (this.actionExploreBtn) this.actionExploreBtn.disabled = true;
    if (this.actionCollectBtn) this.actionCollectBtn.disabled = true;
    if (this.actionBuildBtn) this.actionBuildBtn.disabled = true;
    if (this.actionNegotiateBtn) this.actionNegotiateBtn.disabled = !isNegotiationPhase || !baseEnabled;
  } else {
    const region = gameState.regions[regionId];
    if (!region) return;
    
    const isOwnRegion = region.controller === player.id;
    const isNeutral = region.controller === null;
    
    // Botão Explorar/Assumir Domínio
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
    
    // Outros botões
    if (this.actionBuildBtn) {
      this.actionBuildBtn.disabled = !baseEnabled || !isActionPhase || !isOwnRegion || 
                                     !this.canPlayerAffordAction('construir', player);
    }
    
    if (this.actionCollectBtn) {
      this.actionCollectBtn.disabled = !baseEnabled || !isActionPhase || !isOwnRegion || 
                                       !this.canPlayerAffordAction('recolher', player);
    }
    
    if (this.actionNegotiateBtn) {
      this.actionNegotiateBtn.disabled = !baseEnabled || !isNegotiationPhase || 
                                         !this.canPlayerAffordAction('negociar', player);
    }
  }
  
  // Atualizar contador de ações (SOMENTE ações, sem fase)
  if (this.actionsLeftEl) {
    this.actionsLeftEl.textContent = `Ações restantes: ${gameState.actionsLeft}`;
  }
  
  // Atualizar botão de término de turno
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

// Método auxiliar para atualizar o botão de término de turno
updateEndTurnButton(currentPhase) {
  if (!this.endTurnBtn) return;
  
  // Sempre habilitar o botão, exceto na fase de renda
  this.endTurnBtn.disabled = (currentPhase === 'renda');
  
  // Definir texto baseado na fase atual
  switch(currentPhase) {
    case 'acoes':
      this.endTurnBtn.textContent = 'Ir para Negociação';
      this.endTurnBtn.classList.remove('bg-red-600', 'bg-green-600');
      this.endTurnBtn.classList.add('bg-blue-600');
      break;
    case 'negociacao':
      this.endTurnBtn.textContent = 'Terminar Turno';
      this.endTurnBtn.classList.remove('bg-blue-600', 'bg-red-600');
      this.endTurnBtn.classList.add('bg-green-600');
      break;
    default:
      this.endTurnBtn.textContent = 'Aguardando...';
      this.endTurnBtn.classList.remove('bg-blue-600', 'bg-green-600');
      this.endTurnBtn.classList.add('bg-red-600');
      this.endTurnBtn.disabled = true;
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

  // ==================== UTILITIES ====================
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [255, 255, 255];
  }

// Função para resetar transparência ao padrão
resetTransparency() {
  const transparencySlider = document.getElementById('cellTransparencySlider');
  const transparencyValue = document.getElementById('transparencyValue');
  
  if (transparencySlider && transparencyValue) {
    transparencySlider.value = 15;
    
    // Atualizar variáveis CSS
    document.documentElement.style.setProperty('--cell-bg-opacity', '0.15');
    document.documentElement.style.setProperty('--cell-blur', '1px');
    
    // Atualizar valor exibido
    transparencyValue.textContent = '15%';
    
    // Remover preferência salva
    localStorage.removeItem('gaia-cell-transparency');
    
    window.utils.showFeedback('Transparência resetada para o padrão (15%)', 'info');
  }
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
  if (gameState.selectedRegionId === null || gameState.selectedRegionId === undefined) {
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
  
  // ATIVAR FLAG - estamos em processo de construção
  this.isBuilding = true;
  
  this.structureModalRegion.textContent = `${region.name} (${region.biome})`;
  this.renderStructureOptions(region);
  this.structureModal.classList.remove('hidden');
  
  console.log('🏗️ Modal de construção aberto. Flag isBuilding:', this.isBuilding);
}
  closeStructureModal() {
  this.isBuilding = false; // <-- RESETAR FLAG
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
  option.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log(`🏗️ Clicou para construir ${structure.name}`);
    
    // Forçar seleção antes de fechar modal
    this.forceSelectionDuringBuild(region.id);
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
