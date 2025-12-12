// ui-manager.js - Core da Interface do Usuário
import {
  gameState,
  achievementsState,
  getCurrentPlayer,
  activityLogHistory,
  setAIPlayers,
  getAIPlayer,
  isPlayerAI,
  aiInstances,
  getPendingNegotiationsForPlayer 
 } from '../state/game-state.js';
import { GAME_CONFIG, RESOURCE_ICONS, ACHIEVEMENTS_CONFIG, FACTION_ABILITIES } from '../state/game-config.js';
import { AIFactory, AI_DIFFICULTY_SETTINGS } from '../ai/ai-system.js';
import { ModalManager } from '../ui/ui-modals.js';
import { NegotiationUI } from '../ui/ui-negotiation.js';

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

// ==================== INICIALIZAÇÃO DE DROPDOWNS ====================

initDropdowns() {
  console.log("🔄 Inicializando dropdowns...");
  
  // Garantir que os elementos existem
  this.factionDropdown = document.getElementById('factionDropdown');
  
  if (!this.factionDropdown) {
    console.error("❌ Elemento factionDropdown não encontrado!");
    return;
  }
  
  console.log("✅ Dropdowns encontrados, preenchendo opções...");
  
  // Preencher dropdowns
  this.populateFactionDropdown();
  
  // Adicionar botões de IA
  this.addAIPlayerButtons();
  
  // Atualizar contador
  this.updatePlayerCountDisplay();
}

// ==================== DROPDOWN DE FACÇÕES ====================

populateFactionDropdown() {
  if (!this.factionDropdown) {
    console.error("❌ Elemento factionDropdown não encontrado");
    return;
  }
  
  // Limpar opções exceto o placeholder
  while (this.factionDropdown.options.length > 1) {
    this.factionDropdown.remove(1);
  }
  
  // Adicionar opções com estilo
  Object.entries(FACTION_ABILITIES).forEach(([id, faction]) => {
    const option = document.createElement('option');
    option.value = id;
    option.title = faction.description || `Facção ${faction.name}`;
    option.textContent = `${faction.icon || '🏛️'} ${faction.name}`;
    
    // Verificar se facção está disponível
    const isAvailable = this.isFactionAvailable(id);
    
    if (!isAvailable) {
      option.disabled = true;
      option.textContent += ' ✗ (em uso)';
      option.style.color = '#9ca3af';
      option.style.fontStyle = 'italic';
    } else {
      // Adicionar emoji indicador de disponibilidade
      option.textContent += ' ✓';
    }
    
    // Adicionar estilo baseado na facção
    option.dataset.factionId = id;
    option.style.padding = '12px 16px';
    option.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
    
    this.factionDropdown.appendChild(option);
  });
  
  console.log(`✅ Dropdown de facções preenchido com ${Object.keys(FACTION_ABILITIES).length} opções`);
}

// Adicione este método para melhorar a experiência de seleção de facção
setupFactionDropdownEffects() {
  if (!this.factionDropdown) return;
  
  const dropdownContainer = this.factionDropdown.closest('.dropdown-container');
  const dropdownIcon = dropdownContainer?.querySelector('.dropdown-icon');
  
  this.factionDropdown.addEventListener('change', () => {
    const selectedValue = this.factionDropdown.value;
    const faction = FACTION_ABILITIES[selectedValue];
    
    if (faction && dropdownIcon) {
      // Atualizar ícone do dropdown com o ícone da facção selecionada
      dropdownIcon.textContent = faction.icon || '🏛️';
      
      // Efeito visual de confirmação
      dropdownContainer.style.animation = 'factionSelected 0.5s ease';
      setTimeout(() => {
        dropdownContainer.style.animation = '';
      }, 500);
    } else if (dropdownIcon) {
      // Resetar ícone se nenhuma facção selecionada
      dropdownIcon.textContent = '🏛️';
    }
  });
  
  // Efeito ao abrir o dropdown
  this.factionDropdown.addEventListener('click', () => {
    const dropdownArrow = dropdownContainer?.querySelector('.dropdown-arrow');
    if (dropdownArrow) {
      dropdownArrow.style.transform = 'translateY(-50%) rotate(180deg)';
    }
  });
  
  // Efeito ao perder foco
  this.factionDropdown.addEventListener('blur', () => {
    const dropdownArrow = dropdownContainer?.querySelector('.dropdown-arrow');
    if (dropdownArrow) {
      dropdownArrow.style.transform = 'translateY(-50%)';
    }
  });
}

isFactionAvailable(factionId) {
  const faction = FACTION_ABILITIES[factionId];
  if (!faction) return false;
  
  // Facção está disponível se não estiver sendo usada por jogador humano
  return !gameState.players.some(p => 
    p.faction && p.faction.id === faction.id && !p.isAI
  );
}

constructor() {
  this.modals = new ModalManager(this);
  this.negotiation = new NegotiationUI(this);
  this.editingIndex = null;
  this.selectedIcon = null;
  
  // BINDING CRÍTICO: Vincular métodos ao contexto atual
  this.selectIcon = this.selectIcon.bind(this);
  this.handleAddPlayer = this.handleAddPlayer.bind(this);
  this.renderIconSelection = this.renderIconSelection.bind(this);
  
  this.cacheElements();
  
  // Inicializar após um pequeno delay
  setTimeout(() => {
    this.initUI();
  }, 100);
}


cacheElements() {
  console.log("🔄 Cacheando elementos do DOM...");
  
  // Elementos principais
  this.initialScreen = document.getElementById('initialScreen');
  this.gameNavbar = document.getElementById('gameNavbar');
  this.gameContainer = document.getElementById('gameContainer');
  this.sidebar = document.getElementById('sidebar');
  this.gameMap = document.getElementById('gameMap');
  this.gameFooter = document.getElementById('gameFooter');
  
  // Container do tabuleiro - ESSENCIAL
  this.boardContainer = document.getElementById('boardContainer');
  
  // Elementos do formulário
  this.playerNameInput = document.getElementById('playerName');
  this.addPlayerBtn = document.getElementById('addPlayerBtn');
  this.startGameBtn = document.getElementById('startGameBtn');
  this.registeredPlayersList = document.getElementById('registeredPlayersList');
  this.cancelEditBtn = document.getElementById('cancelEditBtn');
  this.playerCountDisplay = document.getElementById('playerCountDisplay');
  
  // Seleção de ícones e facções
  this.iconSelection = document.getElementById('iconSelection');
  this.factionDropdown = document.getElementById('factionDropdown');
  
  // Elementos da interface do jogo (que existem no HTML)
  this.playerHeaderList = document.getElementById('playerHeaderList');
  this.sidebarPlayerHeader = document.getElementById('sidebarPlayerHeader');
  this.resourceList = document.getElementById('resourceList');
  this.controlledRegions = document.getElementById('controlledRegions');
  this.achievementsList = document.getElementById('achievementsList');
  
  // Botões de ação (usando IDs corretos do HTML)
  this.actionExploreBtn = document.getElementById('actionExplore');
  this.actionCollectBtn = document.getElementById('actionCollect');
  this.actionBuildBtn = document.getElementById('actionBuild');
  this.actionNegotiateBtn = document.getElementById('actionNegotiate');
  this.endTurnBtn = document.getElementById('endTurnBtn');
  
  // Elementos de informação
  this.actionsLeftEl = document.getElementById('actionsLeft');
  this.phaseIndicator = document.getElementById('phaseIndicator');
  this.turnInfo = document.getElementById('turnInfo');
  
  // Elementos do log de atividades (apenas os que existem)
  this.logEntriesSidebar = document.getElementById('logEntriesSidebar');
  this.logFilterAllSidebar = document.getElementById('logFilterAllSidebar');
  this.logFilterMineSidebar = document.getElementById('logFilterMineSidebar');
  this.logFilterEventsSidebar = document.getElementById('logFilterEventsSidebar');
  
  // Tooltip
  this.regionTooltip = document.getElementById('regionTooltip');
  this.tooltipTitle = document.getElementById('tooltipTitle');
  this.tooltipBody = document.getElementById('tooltipBody');
  
  console.log("✅ Elementos cacheados:", {
    boardContainer: !!this.boardContainer, // CRÍTICO
    iconSelection: !!this.iconSelection,
    factionDropdown: !!this.factionDropdown,
    playerNameInput: !!this.playerNameInput,
    playerHeaderList: !!this.playerHeaderList,
    sidebarPlayerHeader: !!this.sidebarPlayerHeader,
    actionExploreBtn: !!this.actionExploreBtn,
    actionCollectBtn: !!this.actionCollectBtn,
    actionBuildBtn: !!this.actionBuildBtn,
    actionNegotiateBtn: !!this.actionNegotiateBtn,
    endTurnBtn: !!this.endTurnBtn,
    boardContainerExists: !!this.boardContainer // Verificação extra
  });
  
  // Debug: se boardContainer não existe, mostrar erro
  if (!this.boardContainer) {
    console.error("❌ CRÍTICO: boardContainer não encontrado!");
    console.error("   Procure por #boardContainer no HTML");
  }
}


initUI() {
  this.renderIconSelection();
  this.populateFactionDropdown();
  this.addAIPlayerButtons();
  this.updatePlayerCountDisplay();
  this.setupEventListeners();
  this.setupTransparencyControls();
  this.setupFormValidation();
  this.setupFactionDropdownEffects();
}

// ==================== AÇÕES DE IA ====================
  
addAIPlayer(difficulty = 'medium', name = null) {
  if (gameState.players.length >= 4) {
    this.modals.showFeedback('Máximo de 4 jogadores atingido.', 'warning');
    return null;
  }
  
  // Encontrar facção disponível
  const availableFactions = Object.entries(FACTION_ABILITIES)
    .filter(([id, faction]) => {
      return this.isFactionAvailable(id);
    });
  
  if (availableFactions.length === 0) {
    this.modals.showFeedback('Todas as facções estão em uso. Adicione um jogador humano primeiro.', 'error');
    return null;
  }
  
  // Escolher facção aleatória
  const randomFaction = availableFactions[Math.floor(Math.random() * availableFactions.length)];
  const factionId = randomFaction[0];
  const faction = randomFaction[1];
  
  // Nomes baseados na facção
  const aiNamesByFaction = {
    '0': ['Druida Ancestral', 'Guardião das Matas', 'Protetor da Floresta'],
    '1': ['Senhor das Marés', 'Mestre dos Rios', 'Comandante dos Mares'],
    '2': ['Arquiteto das Montanhas', 'Mestre das Pedreiras', 'Escultor de Rochas'],
    '3': ['Magnata do Comércio', 'Barão das Caravanas', 'Mestre dos Mercados']
  };
  
  const nameList = aiNamesByFaction[factionId] || ['IA Estratégica'];
  const aiName = name || nameList[Math.floor(Math.random() * nameList.length)];
  
  const color = GAME_CONFIG.PLAYER_COLORS[gameState.players.length % GAME_CONFIG.PLAYER_COLORS.length];
  const aiIcon = '🤖';
  
  const player = {
    id: gameState.players.length,
    name: aiName,
    icon: aiIcon,
    color,
    resources: {...GAME_CONFIG.INITIAL_RESOURCES},
    victoryPoints: 0,
    regions: [],
    consecutiveNoActionTurns: 0,
    type: 'ai',
    aiDifficulty: difficulty,
    isAI: true,
    faction,
    turnBonuses: {
      freeNegotiationAvailable: faction.abilities.freeNegotiationPerTurn || 0,
      buildDiscountUsed: false,
      goldPerRegion: faction.abilities.goldPerRegion || 0
    }
  };
  
  gameState.players.push(player);
  
  // Atualizar UI
  this.updatePlayerCountDisplay();
  this.renderRegisteredPlayersList();
  this.renderIconSelection(); // Atualizar disponibilidade de ícones
  this.populateFactionDropdown(); // Atualizar disponibilidade de facções
  
  const diffName = AI_DIFFICULTY_SETTINGS[difficulty]?.name || difficulty;
  this.modals.showFeedback(`IA ${aiName} adicionada como ${faction.name} (${diffName})`, 'success');
  
  // Habilitar botão de iniciar se necessário
  if (gameState.players.length >= GAME_CONFIG.MIN_PLAYERS) {
    this.startGameBtn.disabled = false;
  }
  
  return player;
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

// ==================== SELEÇÃO DE ÍCONES ====================

// NOVA VERSÃO do método renderIconSelection:
renderIconSelection() {
  if (!this.iconSelection) {
    console.error("❌ Elemento iconSelection não encontrado");
    return;
  }
  
  this.iconSelection.innerHTML = '';
  
  GAME_CONFIG.PLAYER_ICONS.forEach(icon => {
    const iconButton = document.createElement('button');
    iconButton.className = 'icon-button';
    iconButton.type = 'button';
    iconButton.innerHTML = icon;
    iconButton.title = `Ícone ${icon}`;
    iconButton.dataset.icon = icon; // Adiciona dataset para fácil identificação
    
    // Verificar se ícone já está em uso por outros jogadores
    const isUsedByOthers = gameState.players.some((p, index) => {
      // Se estamos editando, ignorar o jogador atual
      if (this.editingIndex !== null && index === this.editingIndex) {
        return false;
      }
      return p.icon === icon;
    });
    
    if (isUsedByOthers) {
      iconButton.classList.add('disabled');
      iconButton.title = `Ícone ${icon} (já em uso por outro jogador)`;
      iconButton.style.opacity = '0.4';
      iconButton.style.cursor = 'not-allowed';
      iconButton.disabled = true;
    } else {
      // Adicionar event listener CORRETAMENTE
      iconButton.addEventListener('click', (e) => {
        console.log(`🎯 Clique no ícone: ${icon}`);
        this.selectIcon(icon, iconButton);
      });
      
      // Marcar que tem listener (para debug)
      iconButton.__hasClickListener = true;
    }
    
    // Se este é o ícone atualmente selecionado, marque como selecionado
    if (this.selectedIcon === icon) {
      iconButton.classList.add('selected');
      iconButton.style.transform = 'scale(1.1)';
    }
    
    this.iconSelection.appendChild(iconButton);
  });
  
  console.log(`✅ ${GAME_CONFIG.PLAYER_ICONS.length} botões de ícone renderizados`);
  this.debugIconState(); // Debug temporário
}


// Substitua COMPLETAMENTE o método selectIcon() pelo seguinte:
selectIcon(icon, buttonElement) {
  console.log(`🎯 Método selectIcon chamado com ícone: ${icon}`);
  console.log(`📌 this.selectedIcon antes: ${this.selectedIcon}`);
  
  // Desselecionar todos
  document.querySelectorAll('.icon-button.selected').forEach(btn => {
    btn.classList.remove('selected');
    btn.style.transform = '';
  });
  
  // ATUALIZAR: Garantir que a propriedade está sendo atualizada
  this.selectedIcon = icon;
  console.log(`📌 this.selectedIcon depois: ${this.selectedIcon}`);
  
  if (buttonElement) {
    buttonElement.classList.add('selected');
    buttonElement.style.transform = 'scale(1.1)';
    
    // Feedback visual
    buttonElement.animate([
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.2)', opacity: 0.8 },
      { transform: 'scale(1.1)', opacity: 1 }
    ], {
      duration: 300,
      easing: 'ease-out'
    });
  }
  
  // Atualizar display do ícone selecionado
  const selectedIconDisplay = document.getElementById('selectedIconDisplay');
  if (selectedIconDisplay) {
    selectedIconDisplay.textContent = icon;
    selectedIconDisplay.style.color = '#fbbf24';
  }
  
  console.log(`✅ Ícone selecionado: ${icon}, this.selectedIcon: ${this.selectedIcon}`);
}

// Adicione este método após o método selectIcon
setupFormValidation() {
  // Validação visual do ícone
  this.iconSelection?.addEventListener('click', (e) => {
    const iconButton = e.target.closest('.icon-button:not(.disabled)');
    if (iconButton) {
      // Remover erro visual se existir
      this.iconSelection.style.border = '';
      this.iconSelection.style.borderRadius = '';
      this.iconSelection.style.padding = '';
    }
  });
  
  // Validação do nome
  this.playerNameInput?.addEventListener('input', () => {
    const name = this.playerNameInput.value.trim();
    if (name.length > 0) {
      this.playerNameInput.style.borderColor = '#10b981';
    } else {
      this.playerNameInput.style.borderColor = '';
    }
  });
  
  // Validação da facção
  this.factionDropdown?.addEventListener('change', () => {
    if (this.factionDropdown.value) {
      this.factionDropdown.style.borderColor = '#10b981';
    } else {
      this.factionDropdown.style.borderColor = '';
    }
  });
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

// ==================== DROPDOWN DE FACÇÕES ====================

renderFactionDropdown() {
  if (!this.factionDropdown) return;
  
  // Manter apenas o placeholder
  while (this.factionDropdown.options.length > 1) {
    this.factionDropdown.remove(1);
  }
  
  // Adicionar opções
  Object.entries(FACTION_ABILITIES).forEach(([id, faction]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = `${faction.icon || '⚔️'} ${faction.name}`;
    
    // Marcar como desabilitado se já estiver em uso por humano
    const isTaken = gameState.players.some(p => 
      p.faction && p.faction.id === faction.id && !p.isAI
    );
    
    if (isTaken) {
      option.disabled = true;
      option.textContent += ' (ocupada)';
      option.style.color = '#6b7280';
    }
    
    this.factionDropdown.appendChild(option);
  });
}

// Função auxiliar para verificar se facção está disponível
isFactionAvailable(factionId) {
  const faction = FACTION_ABILITIES[factionId];
  if (!faction) return false;
  
  return !gameState.players.some(p => 
    p.faction && p.faction.id === faction.id && !p.isAI
  );
}

renderFactionSelection() {
  const factionSelection = document.getElementById('factionSelection');
  if (!factionSelection) return;
  
  factionSelection.innerHTML = '';
  
  Object.entries(FACTION_ABILITIES).forEach(([id, faction]) => {
    const factionEl = document.createElement('div');
    factionEl.className = 'faction-option';
    factionEl.dataset.factionId = id;
    factionEl.innerHTML = `
      <div class="faction-icon" style="color: ${faction.color}">${this.getFactionIcon(id)}</div>
      <div class="faction-name">${faction.name}</div>
      <div class="faction-desc">${faction.description}</div>
    `;
    
    // Verificar se facção já está em uso
    const isTaken = gameState.players.some(p => p.faction && p.faction.id === faction.id);
    if (isTaken) {
      factionEl.classList.add('disabled');
      factionEl.title = `${faction.name} já selecionada por outro jogador`;
    } else {
      factionEl.title = `Clique para selecionar ${faction.name}`;
      factionEl.addEventListener('click', () => this.selectFaction(id, factionEl));
    }
    
    factionSelection.appendChild(factionEl);
  });
}

// Método para selecionar facção
selectFaction(factionId, element) {
  const faction = FACTION_ABILITIES[factionId];
  if (!faction) return;
  
  // Verificar se já está selecionada
  if (this.selectedFaction === factionId) {
    this.selectedFaction = null;
    document.querySelectorAll('.faction-option.selected').forEach(el => {
      el.classList.remove('selected');
    });
    return;
  }
  
  // Desselecionar todas
  document.querySelectorAll('.faction-option.selected').forEach(el => {
    el.classList.remove('selected');
  });
  
  // Selecionar nova
  this.selectedFaction = factionId;
  element.classList.add('selected');
  
  // Feedback
  this.modals.showFeedback(`${faction.name} selecionada!`, 'success');
}

// Método auxiliar para ícones de facção
getFactionIcon(factionId) {
  const icons = {
    '0': '🦌', // Guardiões da Floresta
    '1': '🌊', // Mestres das Águas
    '2': '⛰️', // Construtores da Montanha
    '3': '💰'  // Barões do Comércio
  };
  return icons[factionId] || '🏛️';
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
  // VERIFICAÇÃO DE SEGURANÇA
  if (!this.boardContainer) {
    console.error("❌ boardContainer não disponível. Tentando recachear...");
    this.boardContainer = document.getElementById('boardContainer');
    
    if (!this.boardContainer) {
      console.error("❌ boardContainer ainda não encontrado após recache!");
      return; // Sai do método para evitar erro
    }
  }
  
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
    
// Adicionar classes baseadas no estado
if (region.controller === gameState.currentPlayerIndex) {
    cell.classList.add('player-owned');
}

if (region.controller === null) {
    cell.classList.add('neutral-available');
}

// Verificar se há ações disponíveis nesta região
const currentPlayer = getCurrentPlayer();
if (currentPlayer && region.controller === currentPlayer.id && region.explorationLevel > 0) {
    cell.classList.add('action-available');
    cell.classList.add('clickable');
}

// Adicionar contador de ações disponíveis (se aplicável)
if (gameState.actionsLeft > 0) {
    const actionCounter = document.createElement('div');
    actionCounter.className = 'action-counter';
    actionCounter.textContent = `${gameState.actionsLeft}A`;
    cell.appendChild(actionCounter);
}

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
  const faction = player.faction;
  const factionColor = faction?.color || '#9ca3af';
  
  this.sidebarPlayerHeader.innerHTML = `
    <div class="flex items-center gap-3 p-2 rounded-lg" 
         style="border-left: 4px solid ${player.color}; background: rgba(${this.hexToRgb(player.color).join(', ')}, 0.05)">
      <div class="text-3xl">${player.icon}</div>
      <div class="flex-1">
        <div class="text-base font-semibold text-white">${player.name}</div>
        <div class="text-xs text-gray-300 mb-1">
          Jogador ${player.id + 1} ${isCurrentPlayer ? '• 🎮 TURNO' : ''}
        </div>
        ${faction ? `
        <div class="text-xs font-medium flex items-center gap-1" style="color: ${factionColor}">
          <span class="text-sm">${faction.icon || '🏛️'}</span>
          <span>${faction.name}</span>
        </div>
        ` : '<div class="text-xs text-gray-400">Sem facção</div>'}
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
// Se o jogo terminou, desabilitar tudo
if (this.gameEnded || (window.gameLogic && window.gameLogic.turnLogic && window.gameLogic.turnLogic.gameEnded)) {
    [this.actionExploreBtn, this.actionCollectBtn, this.actionBuildBtn, this.actionNegotiateBtn, this.endTurnBtn]
        .forEach(b => {
            if (b) {
                b.disabled = true;
                b.classList.add('opacity-30', 'cursor-not-allowed');
            }
        });
    
    if (this.phaseIndicator) {
        this.phaseIndicator.textContent = '🎉 JOGO TERMINADO!';
        this.phaseIndicator.classList.add('text-yellow-400', 'font-bold');
    }
    return;
}

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
    
    const actionExploreCost = ACTION_COSTS['explorar'];
let exploreReason = '';

if (!isActionPhase) {
    exploreReason = 'Ação permitida apenas na fase de Ações (⚡).';
} else if (!regionId) {
    exploreReason = 'Selecione uma região para Explorar ou Assumir Domínio.';
} else if (isNeutral) {
    // Lógica para Assumir Domínio
    const hasEnoughPV = player.victoryPoints >= 2;
    const canPayBiome = Object.entries(region.resources)
        .every(([key, value]) => player.resources[key] >= value);

    if (this.actionExploreBtn) {
        this.actionExploreBtn.disabled = !baseEnabled || !hasEnoughPV || !canPayBiome;
        this.actionExploreBtn.textContent = 'Assumir Domínio';
        
        if (this.actionExploreBtn.disabled) {
            if (!hasEnoughPV) exploreReason = 'Requer 2 PVs (Pontos de Vitória).';
            else if (!canPayBiome) exploreReason = 'Recursos de Bioma insuficientes.';
        }
    }
} else if (isOwnRegion) {
    // Lógica para Explorar
    const canAfford = this.canPlayerAffordAction('explorar', player);
    
    if (this.actionExploreBtn) {
        this.actionExploreBtn.disabled = !baseEnabled || !canAfford;
        this.actionExploreBtn.textContent = 'Explorar';
        
        if (this.actionExploreBtn.disabled) {
             exploreReason = `Requer: ${actionExploreCost.madeira}${RESOURCE_ICONS['madeira']}, ${actionExploreCost.agua}${RESOURCE_ICONS['agua']}`;
        }
    }
} else {
    // Não é neutro, nem sua região.
    if (this.actionExploreBtn) {
        this.actionExploreBtn.disabled = true;
        this.actionExploreBtn.textContent = 'Explorar';
        exploreReason = `Região controlada por ${gameState.players[region.controller].name}.`;
    }
}

// Aplica a dica visual (tooltip)
if (this.actionExploreBtn) {
    this.actionExploreBtn.title = exploreReason;
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
    const currentPlayer = getCurrentPlayer();
    const pendingNegotiations = getPendingNegotiationsForPlayer(currentPlayer.id);
    const hasPending = pendingNegotiations.length > 0;
    
    switch(gameState.currentPhase) {
      case 'acoes':
        this.endTurnBtn.disabled = false;
        this.endTurnBtn.textContent = 'Ir para Negociação';
        this.endTurnBtn.className = 'px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold transition';
        break;
      case 'negociacao':
        this.endTurnBtn.disabled = false;
        
        // Indicador visual de propostas pendentes
        if (hasPending) {
          this.endTurnBtn.textContent = `Terminar Turno (${pendingNegotiations.length} pendente(s))`;
          this.endTurnBtn.className = 'px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-md text-white font-semibold transition animate-pulse';
          this.endTurnBtn.title = `Você tem ${pendingNegotiations.length} proposta(s) de negociação pendente(s). Clique para verificar antes de terminar o turno.`;
        } else {
          this.endTurnBtn.textContent = 'Terminar Turno';
          this.endTurnBtn.className = 'px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-semibold transition';
          this.endTurnBtn.title = 'Finalizar seu turno e passar para o próximo jogador';
        }
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
  if (!this.iconSelection) {
    console.error("❌ Elemento iconSelection não encontrado");
    return;
  }
  
  this.iconSelection.innerHTML = '';
  
  // Guardar referência ao contexto atual (this) da instância
  const self = this;
  
  GAME_CONFIG.PLAYER_ICONS.forEach(icon => {
    const iconButton = document.createElement('button');
    iconButton.className = 'icon-button';
    iconButton.type = 'button';
    iconButton.innerHTML = icon;
    iconButton.title = `Ícone ${icon}`;
    iconButton.dataset.icon = icon;
    
    // Verificar se ícone já está em uso por outros jogadores
    const isUsedByOthers = gameState.players.some((p, index) => {
      // Se estamos editando, ignorar o jogador atual
      if (self.editingIndex !== null && index === self.editingIndex) {
        return false;
      }
      return p.icon === icon;
    });
    
    if (isUsedByOthers) {
      iconButton.classList.add('disabled');
      iconButton.title = `Ícone ${icon} (já em uso por outro jogador)`;
      iconButton.style.opacity = '0.4';
      iconButton.style.cursor = 'not-allowed';
      iconButton.disabled = true;
    } else {
      // Usar arrow function para manter o contexto
      iconButton.addEventListener('click', (e) => {
        console.log(`🎯 Clique no ícone: ${icon}`);
        e.stopPropagation();
        e.preventDefault();
        
        // Chamar usando self (referência guardada)
        self.selectIcon(icon, iconButton);
      });
    }
    
    // Se este é o ícone atualmente selecionado, marque como selecionado
    if (self.selectedIcon === icon) {
      iconButton.classList.add('selected');
      iconButton.style.transform = 'scale(1.1)';
    }
    
    this.iconSelection.appendChild(iconButton);
  });
  
  console.log(`✅ ${GAME_CONFIG.PLAYER_ICONS.length} botões de ícone renderizados`);
}

  handleAddPlayer() {
  if (this.editingIndex !== null) {
    this.updatePlayer(this.editingIndex);
    return;
  }
  
  // Obter valores - ADICIONE DEBUG AQUI
  const name = this.playerNameInput?.value.trim() || '';
  const icon = this.selectedIcon;
  const factionId = this.factionDropdown?.value || '';
  
  console.log("🔍 DEBUG handleAddPlayer:");
  console.log("• Nome:", name);
  console.log("• Ícone (this.selectedIcon):", icon);
  console.log("• Tipo do ícone:", typeof icon);
  console.log("• Facção:", factionId);
  console.log("• this:", this);
  console.log("• this.selectedIcon === null?", this.selectedIcon === null);
  console.log("• this.selectedIcon === undefined?", this.selectedIcon === undefined);
  
  // VALIDAÇÃO COM DEBUG MELHORADO
  if (!name) {
    console.error("❌ Falta nome");
    this.modals.showFeedback('Digite um nome para o jogador.', 'error');
    this.playerNameInput?.focus();
    return;
  }
  
  if (!icon) {
    console.error("❌ Falta ícone - estado atual:");
    console.error("  - this.selectedIcon:", this.selectedIcon);
    console.error("  - Botões selecionados:", document.querySelectorAll('.icon-button.selected').length);
    
    // Mostrar qual botão está selecionado visualmente
    const selectedButtons = document.querySelectorAll('.icon-button.selected');
    if (selectedButtons.length > 0) {
      console.error("  - Primeiro botão selecionado:", selectedButtons[0].textContent);
    }
    
    this.modals.showFeedback('Selecione um ícone para o jogador.', 'error');
    
    return;
  }
  
  if (!factionId) {
    console.error("❌ Falta facção");
    this.modals.showFeedback('Selecione uma facção para o jogador.', 'error');
    this.factionDropdown?.focus();
    return;
  }
  
  // Validar facção disponível
  if (!this.isFactionAvailable(factionId)) {
    this.modals.showFeedback('Esta facção já está sendo usada por outro jogador humano.', 'error');
    return;
  }
  
  // Limite de jogadores
  if (gameState.players.length >= GAME_CONFIG.MAX_PLAYERS) {
    this.modals.showFeedback(`Máximo de ${GAME_CONFIG.MAX_PLAYERS} jogadores atingido.`, 'warning');
    return;
  }
  
  // Ícone único
  const iconUsed = gameState.players.some(p => p.icon === icon);
  if (iconUsed) {
    this.modals.showFeedback('Este ícone já está sendo usado por outro jogador.', 'error');
    return;
  }
  
  // Criar jogador
  const faction = FACTION_ABILITIES[factionId];
  const color = GAME_CONFIG.PLAYER_COLORS[gameState.players.length % GAME_CONFIG.PLAYER_COLORS.length];
  
  const player = {
    id: gameState.players.length,
    name,
    icon,
    color,
    resources: {...GAME_CONFIG.INITIAL_RESOURCES},
    victoryPoints: 0,
    regions: [],
    consecutiveNoActionTurns: 0,
    faction,
    turnBonuses: {
      freeNegotiationAvailable: faction.abilities.freeNegotiationPerTurn || 0,
      buildDiscountUsed: false,
      goldPerRegion: faction.abilities.goldPerRegion || 0,
      exploreDiscount: faction.abilities.exploreDiscount || {},
      waterCollectBonus: faction.abilities.waterCollectBonus || 0,
      structurePVBonus: faction.abilities.structurePVBonus || 0,
      negotiationPVBonus: faction.abilities.negotiationPVBonus || 0,
      marketDiscount: faction.abilities.marketDiscount || 0,
      goldExplorationBonus: faction.abilities.goldExplorationBonus || 0
    }
  };
  
  // Adicionar ao estado
  gameState.players.push(player);
  console.log(`✅ Jogador ${name} adicionado como ${faction.name}`);
  
  // Resetar formulário
  this.resetAddPlayerForm();
  
  // Atualizar UI
  this.updatePlayerCountDisplay();
  this.renderRegisteredPlayersList();
  this.renderIconSelection(); // Atualizar disponibilidade de ícones
  this.populateFactionDropdown(); // Atualizar disponibilidade de facções
  
  this.modals.showFeedback(`${name} adicionado como ${faction.name}!`, 'success');
  
  // Habilitar botão de iniciar se necessário
  if (gameState.players.length >= GAME_CONFIG.MIN_PLAYERS) {
    this.startGameBtn.disabled = false;
  }
}

// Função auxiliar para resetar formulário
resetAddPlayerForm() {
  // Resetar input
  if (this.playerNameInput) {
    this.playerNameInput.value = '';
    this.playerNameInput.focus();
  }
  
  // Resetar seleção de ícone
  this.selectedIcon = null;
  document.querySelectorAll('.icon-button.selected').forEach(btn => {
    btn.classList.remove('selected');
    btn.style.transform = '';
  });
  
  // Resetar display do ícone selecionado
  const selectedIconDisplay = document.getElementById('selectedIconDisplay');
  if (selectedIconDisplay) {
    selectedIconDisplay.textContent = '❌';
    selectedIconDisplay.style.color = '';
  }
  
  // Resetar dropdown de facção
  if (this.factionDropdown) {
    this.factionDropdown.selectedIndex = 0;
  }
  
  // Resetar modo de edição
  if (this.editingIndex !== null) {
    this.editingIndex = null;
    this.addPlayerBtn.textContent = '+ Adicionar';
    this.cancelEditBtn.classList.add('hidden');
    this.clearPlayerHighlight();
  }
}

  renderRegisteredPlayersList() {
  const players = gameState.players;
  const canEdit = !gameState.gameStarted;
  
  if (players.length === 0) {
    this.registeredPlayersList.innerHTML = `
      <div class="col-span-2 text-center py-8 text-gray-400">
        <div class="text-3xl mb-3">👤</div>
        <p class="text-sm">Nenhum jogador adicionado</p>
        <p class="text-xs mt-2 text-gray-500">Adicione jogadores para começar a partida</p>
      </div>
    `;
    return;
  }
  
  this.registeredPlayersList.innerHTML = players.map((p, index) => `
    <div class="player-card-horizontal ${index === this.editingIndex ? 'editing' : ''}"
         style="border-left-color: ${p.color};">
      <div class="player-info-horizontal">
        <div class="player-icon-horizontal">${p.icon}</div>
        <div class="player-details-horizontal">
          <div class="player-name-horizontal">${p.name}</div>
          <div class="player-faction-horizontal">
            ${p.faction ? `
              <span class="faction-badge" style="background: ${p.faction.color}15; border-color: ${p.faction.color}30;">
                ${p.faction.icon || '⚔️'} ${p.faction.name}
              </span>
            ` : ''}
            ${p.type === 'ai' ? `<span class="ai-badge-horizontal">🤖 ${p.aiDifficulty}</span>` : ''}
          </div>
        </div>
      </div>
      
      <div class="player-stats-horizontal">
        <span class="text-yellow-400 font-semibold">${p.victoryPoints} PV</span>
      </div>
      
      ${canEdit ? `
      <div class="player-actions-horizontal">
        ${p.type !== 'ai' ? `
        <button class="edit-player-btn" data-index="${index}" title="Editar jogador">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </button>
        ` : ''}
        
        <button class="delete-player-btn" data-index="${index}" 
                title="${p.type === 'ai' ? 'Remover IA' : 'Remover jogador'}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
      ` : ''}
    </div>
  `).join('');
  
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
  
  // Preencher campos
  this.playerNameInput.value = player.name;
  
  // Selecionar ícone
  this.selectedIcon = player.icon;
  document.querySelectorAll('.icon-button').forEach(btn => {
    if (btn.textContent === player.icon) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });
  
  // Selecionar facção no dropdown
  if (player.faction && this.factionDropdown) {
    const factionId = Object.keys(FACTION_ABILITIES).find(
      id => FACTION_ABILITIES[id].id === player.faction.id
    );
    
    if (factionId) {
      for (let i = 0; i < this.factionDropdown.options.length; i++) {
        if (this.factionDropdown.options[i].value === factionId) {
          this.factionDropdown.selectedIndex = i;
          break;
        }
      }
    }
  }
  
  // Atualizar UI
  this.addPlayerBtn.textContent = '🔄 Atualizar';
  this.cancelEditBtn.classList.remove('hidden');
  this.highlightPlayerBeingEdited(index);
  
  this.modals.showFeedback(`Editando ${player.name}. Altere os dados e clique em "Atualizar".`, 'info');
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
  
  // ADICIONAR: Limpar seleção de facção
  this.selectedFaction = null;
  document.querySelectorAll('.faction-option.selected').forEach(el => {
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
  const icon = this.selectedIcon;
  const factionId = this.factionDropdown?.value;
  
  if (!name || !icon || !factionId) {
    this.modals.showFeedback('Preencha todos os campos.', 'error');
    return;
  }
  
  // Validar facção disponível (exceto para o próprio jogador)
  if (!this.isFactionAvailable(factionId) && 
      gameState.players[index].faction?.id !== FACTION_ABILITIES[factionId]?.id) {
    this.modals.showFeedback('Esta facção já está sendo usada por outro jogador humano.', 'error');
    return;
  }
  
  // Validar ícone único (exceto para o próprio jogador)
  const iconUsed = gameState.players.some((p, i) => 
    i !== index && p.icon === icon
  );
  
  if (iconUsed) {
    this.modals.showFeedback('Este ícone já está sendo usado por outro jogador.', 'error');
    return;
  }
  
  // Atualizar jogador
  const faction = FACTION_ABILITIES[factionId];
  
  gameState.players[index] = {
    ...gameState.players[index],
    name,
    icon,
    faction,
    turnBonuses: {
      freeNegotiationAvailable: faction.abilities.freeNegotiationPerTurn || 0,
      buildDiscountUsed: false,
      goldPerRegion: faction.abilities.goldPerRegion || 0,
      exploreDiscount: faction.abilities.exploreDiscount || {},
      waterCollectBonus: faction.abilities.waterCollectBonus || 0,
      structurePVBonus: faction.abilities.structurePVBonus || 0,
      negotiationPVBonus: faction.abilities.negotiationPVBonus || 0,
      marketDiscount: faction.abilities.marketDiscount || 0,
      goldExplorationBonus: faction.abilities.goldExplorationBonus || 0
    }
  };
  
  // Finalizar edição
  this.cancelEdit();
  
  // Atualizar UI
  this.updatePlayerCountDisplay();
  this.renderRegisteredPlayersList();
  this.renderFactionDropdown();
  
  this.modals.showFeedback(`${name} atualizado como ${faction.name}!`, 'success');
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
    
    // Use this.modals.showFeedback em vez de this.showFeedback
    this.modals.showFeedback(`Sistema de IA inicializado com ${aiInstances.length} jogadores`, 'info');
    
  } catch (error) {
    console.error('🤖 Erro ao inicializar IA:', error);
    // CORREÇÃO: Use this.modals.showFeedback em vez de this.showFeedback
    this.modals.showFeedback('Erro ao inicializar sistema de IA', 'error');
  }
}

// ==================== BOTÕES DE IA ====================

addAIPlayerButtons() {
  const container = document.getElementById('aiButtonsContainer');
  if (!container) {
    console.error("❌ Container de botões de IA não encontrado");
    return;
  }
  
  container.innerHTML = `
    <button class="ai-button-compact easy" data-diff="easy" title="IA Fácil">
      🤖 Fácil
    </button>
    <button class="ai-button-compact medium" data-diff="medium" title="IA Média">
      🤖 Média
    </button>
    <button class="ai-button-compact hard" data-diff="hard" title="IA Difícil">
      🤖 Difícil
    </button>
    <button class="ai-button-compact master" data-diff="master" title="IA Mestre">
      🤖 Mestre
    </button>
  `;
  
  // Adicionar event listeners
  container.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const diff = e.currentTarget.dataset.diff;
      this.addAIPlayer(diff);
    });
  });
  
  console.log("✅ Botões de IA adicionados");
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
  const display = document.getElementById('playerCountDisplay');
  
  if (display) {
    display.textContent = count;
  }
  
  // Atualizar estado do botão iniciar
  if (this.startGameBtn) {
    const minPlayers = GAME_CONFIG.MIN_PLAYERS || 2;
    this.startGameBtn.disabled = count < minPlayers;
    
    if (count < minPlayers) {
      this.startGameBtn.title = `Adicione mais ${minPlayers - count} jogador(es)`;
    } else {
      this.startGameBtn.title = 'Iniciar jogo';
    }
  }
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
  
  // Posição centralizada acima da célula por padrão
  let top = rect.top - tooltipRect.height - 10;
  let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
  
  // Ajuste para garantir que a tooltip não saia da tela
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;
  
  // Ajuste horizontal
  if (left < 10) {
    left = 10;
  } else if (left + tooltipRect.width > viewportWidth - 10) {
    left = viewportWidth - tooltipRect.width - 10;
  }
  
  // Ajuste vertical - se não couber acima, coloca abaixo
  if (top < 10) {
    top = rect.bottom + 10;
    // Se também não couber abaixo, ajusta para dentro da tela
    if (top + tooltipRect.height > viewportHeight - 10) {
      top = viewportHeight - tooltipRect.height - 10;
    }
  } else if (top + tooltipRect.height > viewportHeight - 10) {
    // Se não couber acima, coloca abaixo
    top = rect.bottom + 10;
  }
  
  // Aplica a posição com scroll
  this.regionTooltip.style.top = (top + scrollY) + 'px';
  this.regionTooltip.style.left = (left + scrollX) + 'px';
  
  // Garante que a tooltip esteja visível
  this.regionTooltip.style.zIndex = '1000';
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