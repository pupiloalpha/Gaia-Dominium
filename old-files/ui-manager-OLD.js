// ui-manager.js - Gerenciamento de interface do usuário

// ==================== IMPORTS ====================
import { 
  gameState, 
  achievementsState,
  getGameState,
  setGameState,
  addActivityLog,
  activityLogHistory,
  incrementAchievement,
  updatePlayerResources,
  updatePlayerVictoryPoints,
  updateRegionController,
  getCurrentPlayer,
  clearRegionSelection,
  consumeAction,
  resetActions,
  canPlayerAfford,
  addPendingNegotiation,
  getPendingNegotiationsForPlayer,
  removePendingNegotiation,
  setActiveNegotiation,
  clearActiveNegotiation,
  updateNegotiationStatus,
  getNegotiationState,
  setNegotiationState,
  resetNegotiationState,
  updateNegotiationResource,
  updateNegotiationRegions,
  setNegotiationTarget,
  validateNegotiationState,
  getNegotiationValidationErrors
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

const STRUCTURE_CONFIG = {
  'Abrigo': { icon: '🛖', color: 'orange' },
  'Torre de Vigia': { icon: '🏯', color: 'blue' },
  'Mercado': { icon: '🏪', color: 'yellow' },
  'Laboratório': { icon: '🔬', color: 'purple' },
  'Santuário': { icon: '🛐', color: 'green' }
};

const ACTION_COSTS = {
  'explorar': { madeira: 2, agua: 1 },
  'recolher': { madeira: 1 },
  'construir': { madeira: 3, pedra: 2, ouro: 1 },
  'negociar': { ouro: 1 }
};

// ==================== CLASSE UI MANAGER ====================
class UIManager {
  constructor() {
    this.hasLoadedGameBeenProcessed = false;
    this.editingIndex = null;
    this.hasSetupNegotiationListeners = false;
    this.cacheElements();
    this.setupEventListeners();
    this.setupIncomeModalListeners();

    // Conectar ao GameCore
    if (window.GaiaDominium.gameCore) {
      window.GaiaDominium.gameCore.setUIManager(this);
    }
    
    // Garantir que o gameState seja acessível globalmente para compatibilidade
    window.gameState = gameState;

// Debug global para negociação
window.debugNegotiation = () => {
  console.log('=== DEBUG NEGOCIAÇÃO ===');
  console.log('gameState.currentPhase:', gameState.currentPhase);
  console.log('gameState.actionsLeft:', gameState.actionsLeft);
  console.log('Negotiation State:', getNegotiationState());
  console.log('Current Player:', getCurrentPlayer());
  console.log('UI Manager:', this);
  console.log('gameLogic disponível:', !!window.gameLogic);
  console.log('handleSendNegotiation:', window.gameLogic?.handleSendNegotiation);
  
  // Testar validação
  const isValid = validateNegotiationState();
  console.log('Validação:', isValid);
  console.log('Erros:', getNegotiationValidationErrors());
};
  }

  // ==================== INICIALIZAÇÃO ====================
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
    this.structureModal = document.getElementById('structureModal');
    this.incomeModal = document.getElementById('incomeModal');
    
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
    
    // Income modal elements
    this.incomeOkBtn = document.getElementById('incomeOkBtn');
    this.incomePlayerName = document.getElementById('incomePlayerName');
    this.incomeResources = document.getElementById('incomeResources');
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

    // Controle de transparência
    this.setupTransparencyControls();
    
    // Achievements modal
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
    this.negSendBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Botão de envio de proposta clicado (listener básico)');
  
      // Chamar diretamente o método do gameLogic
      if (window.gameLogic && typeof window.gameLogic.handleSendNegotiation === 'function') {
        window.gameLogic.handleSendNegotiation();
      } else {
        console.error('gameLogic ou handleSendNegotiation não disponível');
        window.utils.showFeedback('Erro ao enviar proposta. Tente novamente.', 'error');
      }
    });

    this.negCancelBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.closeNegotiationModal();
    });

    this.negTargetSelect?.addEventListener('change', () => {
      // Atualizar estado com novo alvo
      const targetId = parseInt(this.negTargetSelect.value);
      if (setNegotiationTarget) {
        setNegotiationTarget(targetId);
      }
      
      // Atualizar UI
      this.populateReqRegions();
      this.updateNegotiationUI();
      this.validateNegotiation();
    });
    
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

    // Listener global para desselecionar regiões - VERSÃO CORRIGIDA
    document.addEventListener('click', (e) => {
      // Verificar se clique NÃO é em célula, botão de ação ou footer
      const isRegionCell = e.target.closest('.board-cell');
      const isActionButton = e.target.closest('.action-btn, #endTurnBtn');
      const isGameFooter = e.target.closest('#gameFooter');
      const isModal = e.target.closest('[id$="Modal"]');
      const isStructureOption = e.target.closest('.structure-option');
      
      // Se clicou fora de todos esses elementos E há uma região selecionada
      if (!isRegionCell && !isActionButton && !isGameFooter && !isModal && 
          !isStructureOption && gameState.selectedRegionId !== null) {
        
        console.log('Clique fora - desselecionando região:', gameState.selectedRegionId);
        
        // Desselecionar região
        document.querySelectorAll('.board-cell').forEach(c => {
          c.classList.remove('region-selected');
        });
        gameState.selectedRegionId = null;
        
        // Atualizar UI
        this.updateFooter();
        this.renderSidebar(gameState.selectedPlayerForSidebar);
      }
    });

    // Adicionar listener para tecla ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.editingIndex !== null) {
        e.preventDefault();
        this.cancelEdit();
      }
    });
  }

  // ==================== MÉTODOS DE NEGOCIAÇÃO VISUAL ====================
createResourceControl(resourceKey, resourceName, maxAmount, currentAmount, type) {
  const control = document.createElement('div');
  control.className = 'resource-control flex flex-col p-2 bg-gray-800/60 rounded border border-gray-700';
  
  const label = document.createElement('label');
  label.className = 'text-xs text-gray-300 mb-1 flex items-center gap-1';
  label.innerHTML = `${RESOURCE_ICONS[resourceKey]} ${resourceName} (máx: ${maxAmount})`;
  
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = 0;
  slider.max = maxAmount;
  slider.value = currentAmount;
  slider.className = 'w-full';
  
  const valueSpan = document.createElement('span');
  valueSpan.className = 'text-white font-bold text-center mt-1';
  valueSpan.id = `${type}_${resourceKey}_value`;
  valueSpan.textContent = currentAmount;
  
  let current = currentAmount;  // Rastreia o valor atual dinamicamente
  
  slider.addEventListener('input', (e) => {
    const newValue = parseInt(e.target.value);
    const delta = newValue - current;
    this.adjustNegotiationResource(resourceKey, type, delta);
    current = newValue;
    valueSpan.textContent = newValue;
  });
  
  control.appendChild(label);
  control.appendChild(slider);
  control.appendChild(valueSpan);
  
  return control;
}

  adjustNegotiationResource(resourceKey, type, delta) {
    // Obtém estado atual
    const negotiationState = getNegotiationState();
    const current = negotiationState[type][resourceKey] || 0;
    
    // Calcula máximo disponível
    let max = 0;
    if (type === 'offer') {
      const currentPlayer = getCurrentPlayer();
      max = currentPlayer.resources[resourceKey] || 0;
    } else {
      // Para request, precisa do jogador alvo
      const targetSelect = document.getElementById('negTarget');
      const targetId = targetSelect ? parseInt(targetSelect.value) : null;
      if (targetId !== null) {
        const targetPlayer = gameState.players.find(p => p.id === targetId);
        if (targetPlayer) {
          max = targetPlayer.resources[resourceKey] || 0;
        }
      }
    }
    
    // Calcula novo valor (limitado entre 0 e max)
    const newValue = Math.max(0, Math.min(max, current + delta));
    
    // Atualiza estado
    updateNegotiationResource(type, resourceKey, newValue);
    
    // Atualiza UI
    this.updateNegotiationUI();
    this.validateNegotiation();
    
    console.log(`Negociação ${type}.${resourceKey}: ${current} → ${newValue} (max: ${max})`);
  }

  updateNegotiationUI() {
    const negotiationState = getNegotiationState();
    const currentPlayer = getCurrentPlayer();
    const targetSelect = document.getElementById('negTarget');
    const targetId = targetSelect ? parseInt(targetSelect.value) : null;
    const targetPlayer = targetId !== null ? gameState.players.find(p => p.id === targetId) : null;
    
    // Atualiza todos os controles visuais
    ['madeira', 'pedra', 'ouro', 'agua'].forEach(resource => {
      // Para oferta
      const offerValue = negotiationState.offer[resource] || 0;
      const offerMax = currentPlayer ? currentPlayer.resources[resource] || 0 : 0;
      const offerValueEl = document.getElementById(`offer_${resource}_value`);
      if (offerValueEl) {
        offerValueEl.textContent = offerValue;
        // Atualiza botões
        const offerDecreaseBtn = offerValueEl.previousElementSibling;
        const offerIncreaseBtn = offerValueEl.nextElementSibling;
        if (offerDecreaseBtn) offerDecreaseBtn.disabled = offerValue <= 0;
        if (offerIncreaseBtn) offerIncreaseBtn.disabled = offerValue >= offerMax;
      }
      
      // Para solicitação
      const requestValue = negotiationState.request[resource] || 0;
      const requestMax = targetPlayer ? targetPlayer.resources[resource] || 0 : 0;
      const requestValueEl = document.getElementById(`request_${resource}_value`);
      if (requestValueEl) {
        requestValueEl.textContent = requestValue;
        // Atualiza botões
        const requestDecreaseBtn = requestValueEl.previousElementSibling;
        const requestIncreaseBtn = requestValueEl.nextElementSibling;
        if (requestDecreaseBtn) requestDecreaseBtn.disabled = requestValue <= 0;
        if (requestIncreaseBtn) requestIncreaseBtn.disabled = requestValue >= requestMax;
      }
    });
    
    // Atualiza informações dos jogadores
    this.updateNegotiationInfo();

// Atualizar Resumo da Proposta
const summaryEl = document.getElementById('negotiationSummary');
if (summaryEl) {
  let offerText = 'Oferece: ';
  let requestText = 'Solicita: ';
  
  // Coletar ofertas e solicitações (baseado no estado de negociação)
  Object.entries(getNegotiationState().offer).forEach(([key, val]) => {
    if (val > 0 && key !== 'regions') offerText += `${val} ${RESOURCE_ICONS[key]}, `;
  });
  if (getNegotiationState().offer.regions?.length > 0) offerText += `${getNegotiationState().offer.regions.length} regiões`;
  
  Object.entries(getNegotiationState().request).forEach(([key, val]) => {
    if (val > 0 && key !== 'regions') requestText += `${val} ${RESOURCE_ICONS[key]}, `;
  });
  if (getNegotiationState().request.regions?.length > 0) requestText += `${getNegotiationState().request.regions.length} regiões`;
  
  summaryEl.innerHTML = `
    <div class="text-green-300">${offerText || 'Nada oferecido'}</div>
    <div class="text-red-300 mt-1">${requestText || 'Nada solicitado'}</div>
  `;
}

// Atualizar tooltip de erro no botão de envio
const sendBtn = document.getElementById('negSendBtn');
if (sendBtn) {
  const errors = getNegotiationValidationErrors();
  sendBtn.title = errors.length > 0 ? errors.join('\n') : 'Pronto para enviar!';
}
  }

  updateNegotiationInfo() {
    const currentPlayer = getCurrentPlayer();
    const targetSelect = document.getElementById('negTarget');
    const targetId = targetSelect ? parseInt(targetSelect.value) : null;
    const targetPlayer = targetId !== null ? gameState.players.find(p => p.id === targetId) : null;
    
    // Atualiza informações do jogador atual (oferta)
    if (currentPlayer) {
      const offerInfo = Object.entries(currentPlayer.resources)
        .map(([key, value]) => `${value}${RESOURCE_ICONS[key]}`)
        .join(' ');
      const offerInfoEl = document.getElementById('offerResourcesInfo');
      if (offerInfoEl) offerInfoEl.textContent = offerInfo;
    }
    
    // Atualiza informações do jogador alvo (solicitação)
    if (targetPlayer) {
      const targetNameEl = document.getElementById('targetPlayerName');
      if (targetNameEl) targetNameEl.textContent = targetPlayer.name;
      
      const requestInfo = Object.entries(targetPlayer.resources)
        .map(([key, value]) => `${value}${RESOURCE_ICONS[key]}`)
        .join(' ');
      const requestInfoEl = document.getElementById('requestResourcesInfo');
      if (requestInfoEl) requestInfoEl.textContent = requestInfo;
    } else {
      const targetNameEl = document.getElementById('targetPlayerName');
      if (targetNameEl) targetNameEl.textContent = 'Ninguém';
      const requestInfoEl = document.getElementById('requestResourcesInfo');
      if (requestInfoEl) requestInfoEl.textContent = '—';
    }
  }

  validateNegotiation() {
    const currentPlayer = getCurrentPlayer();
    const targetSelect = document.getElementById('negTarget');
    const targetId = targetSelect ? parseInt(targetSelect.value) : null;
    
    if (!targetId || targetId === currentPlayer.id) {
      this.updateSendButton(false, 'Selecione um jogador diferente de você');
      return false;
    }
    
    const isValid = validateNegotiationState();
    const errors = getNegotiationValidationErrors();
    
    if (isValid) {
      this.updateSendButton(true, 'Enviar proposta (custa 1 Ouro)');
    } else {
      const errorMessage = errors.length > 0 ? errors[0] : 'Proposta inválida';
      this.updateSendButton(false, errorMessage);
    }
    
    return isValid;
  }

  updateSendButton(enabled, tooltip = '') {
    const sendBtn = document.getElementById('negSendBtn');
    if (!sendBtn) return;
    
    sendBtn.disabled = !enabled;
    sendBtn.title = tooltip;
    
    if (enabled) {
      sendBtn.classList.remove('bg-gray-600');
      sendBtn.classList.add('bg-green-600', 'hover:bg-green-700');
    } else {
      sendBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
      sendBtn.classList.add('bg-gray-600');
    }
  }

  populateNegotiationControls() {
    const offerContainer = document.getElementById('offerResourcesContainer');
    const requestContainer = document.getElementById('requestResourcesContainer');
    
    if (!offerContainer || !requestContainer) return;
    
    // Limpa containers
    offerContainer.innerHTML = '';
    requestContainer.innerHTML = '';
    
    const resourceNames = {
      madeira: 'Madeira',
      pedra: 'Pedra',
      ouro: 'Ouro',
      agua: 'Água'
    };
    
    // Cria controles para oferta
    Object.entries(resourceNames).forEach(([key, name]) => {
      const currentPlayer = getCurrentPlayer();
      const max = currentPlayer ? currentPlayer.resources[key] || 0 : 0;
      const current = 0; // Inicia com 0
      
      const control = this.createResourceControl(key, name, max, current, 'offer');
      offerContainer.appendChild(control);
    });
    
    // Cria controles para solicitação (inicialmente com máximo 0)
    Object.entries(resourceNames).forEach(([key, name]) => {
      const control = this.createResourceControl(key, name, 0, 0, 'request');
      requestContainer.appendChild(control);
    });
  }

  // Novo Modal de Negociação
  openNegotiationModalNew() {
    console.log('Abrindo modal de negociação com controles visuais');
    
    // Resetar estado
    resetNegotiationState();
    
    // Configurar modal
    document.body.classList.add('modal-active');
    gameState.selectedRegionId = null;
    document.querySelectorAll('.board-cell').forEach(c => c.classList.remove('region-selected'));
    
    const initiator = getCurrentPlayer();
    
    // Preencher seleção de alvo
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
      document.body.classList.remove('modal-active');
      return;
    }
    
    // Selecionar primeiro jogador por padrão
    if (this.negTargetSelect.options.length > 0) {
      this.negTargetSelect.value = this.negTargetSelect.options[0].value;
      setNegotiationTarget(parseInt(this.negTargetSelect.value));
    }
    
    // Preencher controles visuais
    this.populateNegotiationControls();
    
    // Configurar regiões oferecidas
    this.offerRegionsDiv.innerHTML = '';
    initiator.regions.forEach(rid => {
      const region = gameState.regions[rid];
      const chkWrap = document.createElement('label');
      chkWrap.className = 'flex items-center gap-2 p-2 bg-gray-800/60 rounded cursor-pointer hover:bg-gray-700/60';
      
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.value = rid;
      chk.className = 'rounded negotiation-checkbox';
      chk.dataset.type = 'offer';
      chk.dataset.region = rid;
      chk.addEventListener('change', (e) => {
        const regionId = parseInt(e.target.value);
        const currentRegions = [...getNegotiationState().offerRegions];
        let newRegions;
        
        if (e.target.checked) {
          newRegions = [...currentRegions, regionId];
        } else {
          newRegions = currentRegions.filter(id => id !== regionId);
        }
        
        updateNegotiationRegions('offerRegions', newRegions);
        this.validateNegotiation();
      });
      
      const span = document.createElement('span');
      span.className = 'text-sm text-white';
      span.textContent = `${region.name} (${region.biome})`;
      
      chkWrap.appendChild(chk);
      chkWrap.appendChild(span);
      this.offerRegionsDiv.appendChild(chkWrap);
    });
    
    // Preencher regiões solicitadas (será atualizado quando mudar alvo)
    this.populateReqRegions();
    
    // Atualizar UI inicial
    this.updateNegotiationUI();
    this.validateNegotiation();
        // Configurar listeners aprimorados APÓS criar todos os elementos
        this.setupEnhancedNegotiationListeners();
    
    // Mostrar modal
    this.negotiationModal.classList.remove('hidden');
  }

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
        window.utils.showFeedback(`Transparência ajustada para ${value}%`, 'info');
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

  // ==================== GERENCIAMENTO DE JOGADORES ====================
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

  handleAddPlayer() {
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
      this.showFeedback('Não é possível editar jogadores após o início do jogo.', 'warning');
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
    this.showFeedback('Edição cancelada.', 'info');
  }

  clearPlayerHighlight() {
    document.querySelectorAll('.player-card').forEach(card => {
      card.classList.remove('ring-2', 'ring-blue-500');
      card.style.transform = '';
    });
  }

  updatePlayer(index) {
    const name = this.playerNameInput.value.trim();
    const selected = document.querySelector('.icon-option.selected');
    
    if (!name || !selected) {
      this.showFeedback('Informe o nome e selecione um ícone.', 'error');
      return;
    }
    
    const newIcon = selected.textContent.trim();
    const isIconUsed = gameState.players.some((p, i) => i !== index && p.icon === newIcon);
    if (isIconUsed) {
      this.showFeedback('Este ícone já está sendo usado por outro jogador.', 'error');
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
    
    gameState.players.splice(index, 1);
    gameState.players.forEach((p, i) => {
      p.id = i;
    });
    
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

  // ==================== ATUALIZAÇÃO DA UI ====================
  refreshUIAfterStateChange() {
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

  refreshInitialScreen() {
    if (this.editingIndex !== null) {
      this.cancelEdit();
    }
    
    this.updatePlayerCountDisplay();
    this.renderRegisteredPlayersList();
  }

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

  // ==================== RENDERIZAÇÃO DO TABULEIRO ====================
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
      
      if (clickedInModal) {
        console.log('Clique bloqueado - está em modal');
        return;
      }
      
      console.log('Clique na região:', regionId, 'Seleção atual:', gameState.selectedRegionId);
      
      // Alternar seleção SIMPLES
      if (gameState.selectedRegionId === regionId) {
        // Desselecionar
        gameState.selectedRegionId = null;
        cell.classList.remove('region-selected');
        console.log('Região desselecionada:', regionId);
      } else {
        // Selecionar nova região
        const previousSelected = gameState.selectedRegionId;
        gameState.selectedRegionId = regionId;
        
        // Remover seleção anterior
        if (previousSelected !== null) {
          const prevCell = document.querySelector(`.board-cell[data-region-id="${previousSelected}"]`);
          if (prevCell) prevCell.classList.remove('region-selected');
        }
        
        // Adicionar seleção atual
        cell.classList.add('region-selected');
        console.log('Região selecionada:', regionId);
      }
      
      // Atualizar sidebar e footer
      this.renderSidebar(gameState.selectedPlayerForSidebar);
      this.updateFooter();
    });
    
    // Tooltip events
    cell.addEventListener('mouseenter', (e) => this.showRegionTooltip(region, e.currentTarget));
    cell.addEventListener('mousemove', (e) => this.positionTooltip(e.currentTarget));
    cell.addEventListener('mouseleave', () => this.hideRegionTooltip());
    
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

  updatePhaseIndicator() {
    const phaseIndicator = document.getElementById('phaseIndicator');
    if (!phaseIndicator) return;
    phaseIndicator.textContent = `Fase: ${PHASE_NAMES[gameState.currentPhase] || 'Renda'}`;
  }

  // ==================== PAINEL LATERAL (SIDEBAR) ====================
  renderSidebar(playerIndex) {
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
    this.renderAchievements();
    this.renderActivityLog('all');

    const turnPhaseIndicator = document.getElementById('turnPhaseIndicator');
    if (turnPhaseIndicator) {
      turnPhaseIndicator.textContent = PHASE_NAMES[gameState.currentPhase] || 'Renda';
    }
  }

  // ==================== CONQUISTAS ====================
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
    
    if (achievementsWithProgress.length === 0) {
      achievementsList.innerHTML = `
        <div class="text-xs text-gray-400 italic p-2 text-center">
          Nenhuma conquista em progresso ainda
        </div>
      `;
      return;
    }
    
    achievementsWithProgress.forEach(achievement => {
      const isUnlocked = unlockedAchievements.includes(achievement.id);
      const item = document.createElement('div');
      item.className = `achievement ${isUnlocked ? 'achievement-unlocked' : ''}`;
      
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
    
    const content = document.getElementById('achievementsModalContent');
    const playerNameEl = document.getElementById('achievementsPlayerName');
    if (!content || !playerNameEl) return;
    
    content.innerHTML = '';
    
    const playerIndex = gameState.currentPlayerIndex;
    const player = gameState.players[playerIndex];
    const unlockedAchievements = achievementsState.unlockedAchievements[playerIndex] || [];
    const playerStats = achievementsState.playerAchievements[playerIndex];
    
    playerNameEl.textContent = `Jogador atual: ${player.name}`;
    
    Object.values(ACHIEVEMENTS_CONFIG).forEach(achievement => {
      const isUnlocked = unlockedAchievements.includes(achievement.id);
      const card = document.createElement('div');
      card.className = `p-4 rounded-lg border ${isUnlocked ? 'border-yellow-500/50 bg-yellow-900/10' : 'border-gray-700/50 bg-gray-800/30'}`;
      
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

    modal.classList.remove('hidden');
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

  // ==================== MODAL DE RENDA ====================
  showIncomeModal(player, income) {
    console.log('showIncomeModal executado para:', player.name);
    
    if (!this.incomeModal) {
      console.error('Elemento incomeModal não encontrado!');
      return;
    }
    
    const turnText = gameState.turn > 1 ? `Turno ${gameState.turn}` : 'Início do Jogo';
    this.incomePlayerName.innerHTML = `
      <span class="text-yellow-300 font-bold">${player.name}</span><br>
      <span class="text-sm text-gray-300">${turnText} • Fase de Renda</span>
    `;
    
    this.incomeResources.innerHTML = '';
    
    const hasResources = Object.values(income).some(value => value > 0);
    
    if (!hasResources) {
      const noResources = document.createElement('div');
      noResources.className = 'text-center py-4 text-gray-400';
      noResources.textContent = 'Nenhum recurso recebido neste turno';
      this.incomeResources.appendChild(noResources);
    } else {
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
    
    const footerMsg = document.createElement('div');
    footerMsg.className = 'mt-4 text-center text-xs text-gray-400';
    footerMsg.textContent = 'Clique em OK para iniciar suas ações';
    this.incomeResources.appendChild(footerMsg);
    
    this.incomeModal.classList.remove('hidden');
    console.log('Modal de renda exibida para', player.name);
  }

  setupIncomeModalListeners() {
    const incomeOkBtn = document.getElementById('incomeOkBtn');
    
    if (!incomeOkBtn) {
      console.error('Botão incomeOkBtn não encontrado após recriação');
      return;
    }
    
    incomeOkBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Botão OK do modal de renda clicado via setupIncomeModalListeners');
      this.closeIncomeModal();
    });
  }

  closeIncomeModal() {
    console.log('Método closeIncomeModal chamado');
    
    if (!this.incomeModal) {
      console.error('Elemento incomeModal não encontrado!');
      return;
    }
    
    this.incomeModal.classList.add('hidden');
    console.log('Modal de renda fechado');
    
    if (gameState.gameStarted) {
      gameState.currentPhase = 'acoes';
      gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
      
      console.log('Fase alterada para: ações, ações restantes:', gameState.actionsLeft);
      
      setTimeout(() => {
        if (window.uiManager) {
          window.uiManager.updateUI();
          window.uiManager.updateFooter();
        }
      }, 50);
      
      const currentPlayer = getCurrentPlayer();
      if (currentPlayer) {
        addActivityLog({
          type: 'phase',
          playerName: currentPlayer.name,
          action: 'iniciou fase de ações',
          details: '',
          turn: gameState.turn
        });
      }
    }
  }

  // ==================== INFORMAÇÕES DE TURNO ====================
  renderTurnPhase() {
    const turnPhaseIndicator = document.getElementById('turnPhaseIndicator');
    if (!turnPhaseIndicator) return;
    turnPhaseIndicator.textContent = PHASE_NAMES[TURN_PHASES.RENDA] || 'Renda';
  }

  updateTurnInfo() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (this.turnInfo) {
      this.turnInfo.textContent = `Turno: ${gameState.turn} • Jogador: ${currentPlayer?.name || '—'}`;
    }
  }

  checkAndFixLoadedState() {
    if (gameState.gameStarted) {
      if (gameState.currentPlayerIndex === undefined || gameState.currentPlayerIndex === null) {
        gameState.currentPlayerIndex = 0;
      }
      
      if (!gameState.currentPhase) {
        gameState.currentPhase = 'renda';
      }
      
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
    if (gameState.gameStarted) {
      const elementsToShow = [
        'gameNavbar', 'gameContainer', 'sidebar', 'gameMap', 'gameFooter'
      ];
      
      elementsToShow.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('hidden');
      });
      
      const initialScreen = document.getElementById('initialScreen');
      if (initialScreen) initialScreen.style.display = 'none';
      
      const manualIcon = document.getElementById('manualIcon');
      if (manualIcon) manualIcon.classList.add('hidden');
      
      this.updateUI();
      this.updateFooter();
      this.renderBoard();
      this.renderHeaderPlayers();
      this.renderSidebar(gameState.selectedPlayerForSidebar);
      
      console.log('UI restaurada do jogo salvo');
    }
  }

  // ==================== RODAPÉ E AÇÕES ====================
  canPlayerAffordAction(actionType, player) {
    const cost = ACTION_COSTS[actionType] || {};
    return Object.entries(cost).every(([resource, amount]) => {
      return (player.resources[resource] || 0) >= amount;
    });
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
    
    if (regionId === null || regionId === undefined) {
      if (this.actionExploreBtn) this.actionExploreBtn.disabled = true;
      if (this.actionCollectBtn) this.actionCollectBtn.disabled = true;
      if (this.actionBuildBtn) this.actionBuildBtn.disabled = true;
      if (this.actionNegotiateBtn) this.actionNegotiateBtn.disabled = !isNegotiationPhase || !baseEnabled;
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
      
      if (this.actionNegotiateBtn) {
        if (currentPhase === 'negociacao') {
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
    }
    
    if (this.actionsLeftEl) {
      this.actionsLeftEl.textContent = `Ações restantes: ${gameState.actionsLeft}`;
    }
    
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

  prepareNegotiationPhase() {
    if (this.actionExploreBtn) this.actionExploreBtn.disabled = true;
    if (this.actionCollectBtn) this.actionCollectBtn.disabled = true;
    if (this.actionBuildBtn) this.actionBuildBtn.disabled = true;
    
    if (this.actionNegotiateBtn) {
      const player = getCurrentPlayer();
      this.actionNegotiateBtn.disabled = (player.resources.ouro < 1);
      this.actionNegotiateBtn.classList.remove('bg-gray-600', 'opacity-50');
      this.actionNegotiateBtn.classList.add('bg-green-600');
    }
    
    const actionsLeftEl = document.getElementById('actionsLeft');
    if (actionsLeftEl) {
      actionsLeftEl.textContent = 'Ação de negociação disponível';
    }
  }

  enableNegotiationOnly() {
    if (this.actionExploreBtn) this.actionExploreBtn.disabled = true;
    if (this.actionCollectBtn) this.actionCollectBtn.disabled = true;
    if (this.actionBuildBtn) this.actionBuildBtn.disabled = true;
    
    if (this.actionNegotiateBtn && gameState.actionsLeft > 0) {
      const player = getCurrentPlayer();
      this.actionNegotiateBtn.disabled = player.resources.ouro < 1;
    }
  }

  updateEndTurnButton(currentPhase) {
    if (!this.endTurnBtn) return;
    
    this.endTurnBtn.disabled = (currentPhase === 'renda');
    
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
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [255, 255, 255];
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
      
      window.utils.showFeedback('Transparência resetada para o padrão (15%)', 'info');
    }
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

  enableModalMode() {
    document.body.classList.add('modal-open');
    if (this.actionExploreBtn) this.actionExploreBtn.disabled = true;
    if (this.actionCollectBtn) this.actionCollectBtn.disabled = true;
    if (this.actionBuildBtn) this.actionBuildBtn.disabled = true;
    if (this.actionNegotiateBtn) this.actionNegotiateBtn.disabled = true;
    if (this.endTurnBtn) this.endTurnBtn.disabled = true;
  }

  disableModalMode() {
    document.body.classList.remove('modal-open');
    setTimeout(() => {
      if (window.uiManager) {
        window.uiManager.updateFooter();
      }
    }, 100);
  }

  clearRegionSelection() {
    gameState.selectedRegionId = null;
    document.querySelectorAll('.board-cell').forEach(c => {
      c.classList.remove('region-selected');
    });
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
    
    const tabs = [
      { id: 'tab-o-jogo', key: 'o-jogo' },
      { id: 'tab-regioes', key: 'regioes' },
      { id: 'tab-regras', key: 'regras' },
      { id: 'tab-acoes', key: 'acoes' },
      { id: 'tab-estrutura', key: 'estrutura' },
      { id: 'tab-conquistas', key: 'conquistas' }
    ];
    
    tabs.forEach(tab => {
      const element = document.getElementById(tab.id);
      if (element) {
        element.innerHTML = manualContent[tab.key] || '<p class="text-gray-400">Conteúdo não disponível</p>';
      } else {
        console.warn(`Elemento ${tab.id} não encontrado no DOM.`);
      }
    });
  }

  // ==================== SISTEMA DE EVENTOS ====================
  updateEventBanner() {
    if (gameState.currentEvent && gameState.eventTurnsLeft > 0) {
      this.eventBannerIcon.textContent = gameState.currentEvent.icon;
      this.eventBannerTitle.textContent = gameState.currentEvent.name;
      this.eventBannerTurns.textContent = 
        `${gameState.eventTurnsLeft} turno${gameState.eventTurnsLeft > 1 ? 's' : ''} restante${gameState.eventTurnsLeft > 1 ? 's' : ''}`;
      this.eventBannerEffect.textContent = gameState.currentEvent.effect;
      
      this.eventBanner.classList.remove('event-positive', 'event-negative', 'event-mixed', 'event-neutral');
      
      let category = 'neutral';
      if (gameState.currentEvent.id && this.getEventCategory) {
        category = this.getEventCategory(gameState.currentEvent.id);
      } else if (gameState.currentEvent.type) {
        category = gameState.currentEvent.type;
      }
      
      this.eventBanner.classList.add(`event-${category}`);
      
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
    
    const modalContent = document.querySelector('#eventModal .relative');
    if (modalContent) {
      modalContent.classList.remove('event-positive', 'event-negative', 'event-mixed', 'event-neutral');
      if (event.type) {
        modalContent.classList.add(`event-${event.type}`);
      }
    }
  }

  // ==================== MODAL DE ESTRUTURAS ====================
  openStructureModal() {
    if (gameState.selectedRegionId === null) {
      window.utils.showFeedback('Selecione uma região primeiro.', 'error');
      return;
    }
    
    const region = gameState.regions[gameState.selectedRegionId];
    const player = gameState.players[gameState.currentPlayerIndex];
    
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
    
    Object.entries(STRUCTURE_CONFIG).forEach(([name, config]) => {
      if (region.structures.includes(name)) {
        return;
      }
      
      const cost = STRUCTURE_COSTS[name] || {};
      const income = STRUCTURE_INCOME[name] || {};
      const effect = STRUCTURE_EFFECTS[name] || {};
      
      const option = document.createElement('div');
      option.className = `bg-gray-800/50 border border-${config.color}-500/30 rounded-xl p-4 hover:bg-gray-700/50 transition cursor-pointer`;
      option.dataset.structure = name;
      
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
          <span class="text-3xl">${config.icon}</span>
          <div class="flex-1">
            <h3 class="font-bold text-${config.color}-300 mb-1">${name}</h3>
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
          
          if (window.gameLogic && window.gameLogic.handleBuild) {
            console.log(`Construindo ${name}`);
            window.gameLogic.handleBuild(name);
          } else if (window.gameLogic && window.gameLogic.handleBuildStructure) {
            console.log(`Construindo ${name} (usando handleBuildStructure)`);
            window.gameLogic.handleBuildStructure(name);
          } else {
            console.error('Nenhuma função de construção encontrada em gameLogic');
            window.utils.showFeedback('Erro ao construir estrutura. Função não encontrada.', 'error');
          }
        });
      }
      
      this.structureOptions.appendChild(option);
    });
    
    if (this.structureOptions.children.length === 0) {
      this.structureOptions.innerHTML = `
        <div class="col-span-3 text-center py-8">
          <p class="text-gray-400">Todas as estruturas já foram construídas nesta região.</p>
        </div>
      `;
    }
  }

  // ==================== MODAIS DE NEGOCIAÇÃO ====================
  openNegotiationModal() {
    console.log('🔧 Abrindo NOVO modal de negociação com controles visuais');
    
    // Resetar estado
    if (resetNegotiationState) {
      resetNegotiationState();
    } else {
      console.warn('resetNegotiationState não disponível');
    }
    
    // Configurar modal
    document.body.classList.add('modal-active');
    gameState.selectedRegionId = null;
    document.querySelectorAll('.board-cell').forEach(c => c.classList.remove('region-selected'));
    
    const initiator = getCurrentPlayer();
    
    // Preencher seleção de alvo
    if (!this.negTargetSelect) {
      console.error('Elemento negTargetSelect não encontrado');
      return;
    }
    
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
      document.body.classList.remove('modal-active');
      return;
    }
    
    // Selecionar primeiro jogador por padrão
    if (this.negTargetSelect.options.length > 0) {
      this.negTargetSelect.value = this.negTargetSelect.options[0].value;
      if (setNegotiationTarget) {
        setNegotiationTarget(parseInt(this.negTargetSelect.value));
      }
    }
    
    // Preencher controles visuais - CRÍTICO
    console.log('Criando controles visuais...');
    this.populateNegotiationControls();
    
    // Configurar regiões oferecidas
    if (this.offerRegionsDiv) {
      this.offerRegionsDiv.innerHTML = '';
      initiator.regions.forEach(rid => {
        const region = gameState.regions[rid];
        if (!region) return;
        
        const chkWrap = document.createElement('label');
        chkWrap.className = 'flex items-center gap-2 p-2 bg-gray-800/60 rounded cursor-pointer hover:bg-gray-700/60';
        
        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.value = rid;
        chk.className = 'rounded negotiation-checkbox';
        chk.dataset.type = 'offer';
        chk.dataset.region = rid;
        
        chk.addEventListener('change', (e) => {
          const regionId = parseInt(e.target.value);
          let currentRegions = [];
          if (getNegotiationState) {
            currentRegions = [...getNegotiationState().offerRegions];
          }
          
          let newRegions;
          if (e.target.checked) {
            newRegions = [...currentRegions, regionId];
          } else {
            newRegions = currentRegions.filter(id => id !== regionId);
          }
          
          if (updateNegotiationRegions) {
            updateNegotiationRegions('offerRegions', newRegions);
          }
          
          if (this.validateNegotiation) {
            this.validateNegotiation();
          }
        });
        
        const span = document.createElement('span');
        span.className = 'text-sm text-white';
        span.textContent = `${region.name} (${region.biome})`;
        
        chkWrap.appendChild(chk);
        chkWrap.appendChild(span);
        this.offerRegionsDiv.appendChild(chkWrap);
      });
    }
    
    // Preencher regiões solicitadas
    if (this.populateReqRegions && typeof this.populateReqRegions === 'function') {
      this.populateReqRegions();
    }
    
    // Atualizar UI inicial
    if (this.updateNegotiationUI && typeof this.updateNegotiationUI === 'function') {
      this.updateNegotiationUI();
    }
    
    if (this.validateNegotiation && typeof this.validateNegotiation === 'function') {
      this.validateNegotiation();
    }
    
    this.setupEnhancedNegotiationListeners();

    // Mostrar modal
    if (this.negotiationModal) {
      this.negotiationModal.classList.remove('hidden');
      console.log('✅ Modal de negociação aberto com controles visuais');
    } else {
      console.error('Elemento negotiationModal não encontrado');
    }
  }

  setupEnhancedNegotiationListeners() {
      console.log('🔧 Configurando listeners aprimorados para negociação');
  
      // Configurar botão de envio com verificação robusta
      const sendBtn = document.getElementById('negSendBtn');
      if (sendBtn) {
        // Remover todos os listeners anteriores
        const newSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
    
        // Adicionar novo listener direto
        document.getElementById('negSendBtn').addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          console.log('🎯 Botão de envio aprimorado clicado');
      
          // Verificar se o modal ainda está aberto
          const modal = document.getElementById('negotiationModal');
          if (!modal || modal.classList.contains('hidden')) {
             console.log('Modal fechado, ignorando clique');
            return;
          }
      
      // Verificar validação usando o método local
      if (!this.validateNegotiation()) {
        const errorMessage = document.getElementById('negSendBtn')?.title || 'Proposta inválida';
        console.log('Validação falhou:', errorMessage);
        window.utils.showFeedback(errorMessage, 'error');
        return;
      }
      
      // Verificar gameLogic
      if (!window.gameLogic) {
        console.error('window.gameLogic não disponível');
        window.utils.showFeedback('Sistema de jogo não carregado', 'error');
        return;
      }
      
      if (typeof window.gameLogic.handleSendNegotiation !== 'function') {
        console.error('handleSendNegotiation não é uma função');
        window.utils.showFeedback('Função de envio não disponível', 'error');
        return;
      }
      
      try {
        console.log('📤 Chamando handleSendNegotiation...');
        // Chamar diretamente com o contexto correto
        const result = await window.gameLogic.handleSendNegotiation();
        console.log('Resultado do envio:', result);
        
        // Se retornou false, não fechar o modal automaticamente
        if (result === false) {
          console.log('Envio falhou, mantendo modal aberto');
        }
      } catch (error) {
        console.error('❌ Erro ao enviar proposta:', error);
        window.utils.showFeedback(`Erro: ${error.message}`, 'error');
      }
    });
    
    console.log('✅ Listener aprimorado configurado para negSendBtn');
  } else {
    console.error('❌ Botão negSendBtn não encontrado para configurar listener');
  }
}

  populateReqRegions() {
    const targetId = parseInt(this.negTargetSelect.value);
    this.reqRegionsDiv.innerHTML = '';
    
    if (isNaN(targetId)) return;
    
    const target = gameState.players.find(p => p.id === targetId);
    if (!target) return;
    
    // Atualizar estado com o alvo selecionado
    setNegotiationTarget(targetId);
    
    target.regions.forEach(rid => {
      const region = gameState.regions[rid];
      const chkWrap = document.createElement('label');
      chkWrap.className = 'flex items-center gap-2 p-2 bg-gray-800/60 rounded cursor-pointer hover:bg-gray-700/60';
      
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.value = rid;
      chk.className = 'rounded negotiation-checkbox';
      chk.dataset.type = 'request';
      chk.dataset.region = rid;
      chk.addEventListener('change', (e) => {
        const regionId = parseInt(e.target.value);
        const currentRegions = [...getNegotiationState().requestRegions];
        let newRegions;
        
        if (e.target.checked) {
          newRegions = [...currentRegions, regionId];
        } else {
          newRegions = currentRegions.filter(id => id !== regionId);
        }
        
        updateNegotiationRegions('requestRegions', newRegions);
        this.validateNegotiation();
      });
      
      const span = document.createElement('span');
      span.className = 'text-sm text-white';
      span.textContent = `${region.name} (${region.biome})`;
      
      chkWrap.appendChild(chk);
      chkWrap.appendChild(span);
      this.reqRegionsDiv.appendChild(chkWrap);
    });
    
    // Atualizar UI dos controles de recursos (para atualizar máximos)
    this.updateNegotiationUI();
    this.validateNegotiation();
  }

  closeNegotiationModal() {
    this.negotiationModal.classList.add('hidden');
    document.body.classList.remove('modal-active');
    window.GaiaDominium.gameCore?.endNegotiation();
  }

  // Método presentNegotiationToTarget corrigido
  presentNegotiationToTarget(neg) {
    if (!neg) {
      console.error('Negociação não fornecida para presentNegotiationToTarget');
      return;
    }
    
    this.setModalMode(true);
    
    const initiator = gameState.players.find(p => p.id === neg.initiatorId);
    const target = gameState.players.find(p => p.id === neg.targetId);
    
    if (!initiator || !target) {
      window.utils.showFeedback('Erro interno na negociação. Jogador não encontrado.', 'error');
      this.setModalMode(false);
      return;
    }

    if (typeof setActiveNegotiation === 'function') {
      setActiveNegotiation(neg);
    } else {
      console.warn('setActiveNegotiation não disponível, usando fallback');
      gameState.activeNegotiation = neg;
    }
    
    const summary = [];
    
    const offerResources = ['madeira','pedra','ouro','agua']
      .map(k => neg.offer[k] ? `${neg.offer[k]} ${RESOURCE_ICONS[k]}` : null)
      .filter(x => x);
    
    if (offerResources.length > 0 || (neg.offer.regions && neg.offer.regions.length > 0)) {
      summary.push(`<div class="mb-3"><strong class="text-green-400">${initiator.icon} ${initiator.name} oferece:</strong></div>`);
      
      if (offerResources.length > 0) {
        summary.push(`<div class="mb-2 text-sm">${offerResources.join(' • ')}</div>`);
      }
      
      if (neg.offer.regions && neg.offer.regions.length > 0) {
        const regionNames = neg.offer.regions.map(r => 
          gameState.regions[r]?.name || `Região ${String.fromCharCode(65 + r)}`
        );
        summary.push(`<div class="mb-2 text-sm"><span class="text-yellow-300">Regiões:</span> ${regionNames.join(', ')}</div>`);
      }
    } else {
      summary.push(`<div class="mb-2 text-sm text-gray-400">Sem oferta de recursos ou regiões.</div>`);
    }

    const requestResources = ['madeira','pedra','ouro','agua']
      .map(k => neg.request[k] ? `${neg.request[k]} ${RESOURCE_ICONS[k]}` : null)
      .filter(x => x);
    
    if (requestResources.length > 0 || (neg.request.regions && neg.request.regions.length > 0)) {
      summary.push(`<div class="mt-4 mb-3"><strong class="text-red-400">Solicita em troca:</strong></div>`);
      
      if (requestResources.length > 0) {
        summary.push(`<div class="mb-2 text-sm">${requestResources.join(' • ')}</div>`);
      }
      
      if (neg.request.regions && neg.request.regions.length > 0) {
        const regionNames = neg.request.regions.map(r => 
          gameState.regions[r]?.name || `Região ${String.fromCharCode(65 + r)}`
        );
        summary.push(`<div class="mb-2 text-sm"><span class="text-yellow-300">Regiões:</span> ${regionNames.join(', ')}</div>`);
      }
    } else {
      summary.push(`<div class="mt-4 mb-2 text-sm text-gray-400">Sem solicitação de recursos ou regiões.</div>`);
    }

    summary.push(`<div class="mt-4 pt-3 border-t border-white/10 text-xs text-gray-400">
      Turno: ${neg.turn} • Enviado em: ${new Date(neg.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
    </div>`);

    this.negResponseTitle.textContent = `📨 Proposta de ${initiator.icon} ${initiator.name}`;
    this.negResponseBody.innerHTML = summary.join('');
    
    this.negResponseModal.classList.remove('hidden');
    
    this.setupNegotiationResponseListeners();
    
    console.log('Modal de resposta de negociação aberto');
  }

  // CORREÇÃO CRÍTICA: Método setupNegotiationResponseListeners corrigido
  setupNegotiationResponseListeners() {
    console.log('Configurando listeners de resposta de negociação');
    
    // Remover listeners anteriores se existirem
    if (this.negAcceptBtn) {
      this.negAcceptBtn.replaceWith(this.negAcceptBtn.cloneNode(true));
      this.negAcceptBtn = document.getElementById('negAcceptBtn');
    }
    
    if (this.negDeclineBtn) {
      this.negDeclineBtn.replaceWith(this.negDeclineBtn.cloneNode(true));
      this.negDeclineBtn = document.getElementById('negDeclineBtn');
    }
    
    // Adicionar novos listeners com once:true para evitar múltiplos bindings
    this.negAcceptBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Botão ACEITAR clicado (listener funcional)');
      
      if (window.gameLogic && window.gameLogic.handleNegResponse) {
        window.gameLogic.handleNegResponse(true);
      } else {
        console.error('handleNegResponse não encontrado');
      }
    }, { once: true });
    
    this.negDeclineBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Botão RECUSAR clicado (listener funcional)');
      
      if (window.gameLogic && window.gameLogic.handleNegResponse) {
        window.gameLogic.handleNegResponse(false);
      } else {
        console.error('handleNegResponse não encontrado');
      }
    }, { once: true });
  }

  closeNegResponseModal() {
    console.log('Fechando modal de resposta de negociação');
    
    if (this.negResponseModal) {
      this.negResponseModal.classList.add('hidden');
    }
    
    this.setModalMode(false);
    
    if (typeof clearActiveNegotiation === 'function') {
      clearActiveNegotiation();
    } else {
      gameState.activeNegotiation = null;
    }
  }

  showNegotiationNotification(negotiation) {
    const targetPlayer = gameState.players[negotiation.targetId];
    const initiatorPlayer = gameState.players[negotiation.initiatorId];
    
    if (!targetPlayer || !initiatorPlayer) return;
    
    const existingNotification = document.getElementById(`negotiation-notification-${negotiation.id}`);
    if (existingNotification) return;
    
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 z-[90] bg-gray-900/95 border-l-4 border-yellow-500 rounded-lg p-4 shadow-xl max-w-sm animate-slide-in-right';
    notification.id = `negotiation-notification-${negotiation.id}`;
    notification.style.backdropFilter = 'blur(10px)';
    
    const offerSummary = this.getNegotiationSummary(negotiation);
    
    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <span class="text-2xl">🤝</span>
        <div class="flex-1">
          <h4 class="font-semibold text-white">Nova Proposta Recebida!</h4>
          <p class="text-sm text-gray-300 mt-1">
            <span class="text-yellow-300">${initiatorPlayer.icon} ${initiatorPlayer.name}</span> enviou uma proposta
          </p>
          <div class="mt-2 text-xs text-gray-400">
            ${offerSummary}
          </div>
          <div class="mt-3 flex gap-2">
            <button data-action="view" data-negotiation-id="${negotiation.id}" 
                    class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white notification-action-btn">
              Ver Proposta
            </button>
            <button data-action="dismiss" data-negotiation-id="${negotiation.id}" 
                    class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300 notification-action-btn">
              Fechar
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    this.setupNotificationListeners(notification, negotiation.id);
    
    setTimeout(() => {
      this.dismissNotification(negotiation.id);
    }, 30000);
    
    if (targetPlayer.id === gameState.currentPlayerIndex) {
      addActivityLog({
        type: 'negotiate',
        playerName: initiatorPlayer.name,
        action: 'enviou proposta para',
        details: targetPlayer.name,
        turn: gameState.turn,
        isEvent: false,
        isMine: false
      });
    }
  }

  getNegotiationSummary(negotiation) {
    const offerItems = [];
    const requestItems = [];
    
    Object.entries(negotiation.offer).forEach(([key, value]) => {
      if (value > 0 && key !== 'regions' && key !== 'pv') {
        offerItems.push(`${value} ${RESOURCE_ICONS[key] || key}`);
      }
    });
    
    if (negotiation.offer.regions && negotiation.offer.regions.length > 0) {
      offerItems.push(`${negotiation.offer.regions.length} região(ões)`);
    }
    
    Object.entries(negotiation.request).forEach(([key, value]) => {
      if (value > 0 && key !== 'regions' && key !== 'pv') {
        requestItems.push(`${value} ${RESOURCE_ICONS[key] || key}`);
      }
    });
    
    if (negotiation.request.regions && negotiation.request.regions.length > 0) {
      requestItems.push(`${negotiation.request.regions.length} região(ões)`);
    }
    
    let summary = '';
    if (offerItems.length > 0) {
      summary += `<div class="mt-1"><span class="text-green-400">Oferece:</span> ${offerItems.join(', ')}</div>`;
    }
    if (requestItems.length > 0) {
      summary += `<div class="mt-1"><span class="text-red-400">Solicita:</span> ${requestItems.join(', ')}</div>`;
    }
    
    return summary || 'Proposta vazia';
  }

  setupNotificationListeners(notificationElement, negotiationId) {
    const buttons = notificationElement.querySelectorAll('.notification-action-btn');
    
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = button.dataset.action;
        const id = button.dataset.negotiationId;
        
        if (action === 'view') {
          this.viewNegotiation(id);
        } else if (action === 'dismiss') {
          this.dismissNotification(id);
        }
      });
    });
  }

  viewNegotiation(negotiationId) {
    if (!gameState.pendingNegotiations) {
      gameState.pendingNegotiations = [];
      return;
    }
    
    const negotiation = gameState.pendingNegotiations.find(n => n.id === negotiationId);
    if (!negotiation) {
      window.utils.showFeedback('Proposta não encontrada.', 'error');
      return;
    }
    
    const currentPlayer = getCurrentPlayer();
    if (currentPlayer.id !== negotiation.targetId) {
      window.utils.showFeedback('Esta proposta não é para você.', 'warning');
      return;
    }
    
    if (typeof setActiveNegotiation === 'function') {
      setActiveNegotiation(negotiation);
    }
    
    this.presentNegotiationToTarget(negotiation);
    this.dismissNotification(negotiationId);
  }

  dismissNotification(negotiationId) {
    const notification = document.getElementById(`negotiation-notification-${negotiationId}`);
    if (notification) {
      notification.remove();
    }
  }

  checkPendingNegotiationsForCurrentPlayer() {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return;
    
    const pendingNegotiations = getPendingNegotiationsForPlayer(currentPlayer.id);
    
    if (pendingNegotiations.length > 0) {
      this.showPendingNegotiationsSummary(pendingNegotiations.length);
      
      pendingNegotiations.forEach(negotiation => {
        this.showNegotiationNotification(negotiation);
      });
    }
  }

  showPendingNegotiationsSummary(count) {
    const existingSummary = document.getElementById('pending-negotiations-summary');
    if (existingSummary) {
      existingSummary.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'fixed top-24 right-4 z-[89] bg-blue-900/80 border border-blue-500 rounded-lg p-3 shadow-lg max-w-sm';
    notification.id = 'pending-negotiations-summary';
    
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-xl">📨</span>
        <div>
          <p class="text-sm text-white font-medium">
            Você tem ${count} proposta(s) pendente(s)
          </p>
          <button id="showAllNegotiationsBtn" 
                  class="text-xs text-blue-300 hover:text-blue-200 underline mt-1">
            Ver todas
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    document.getElementById('showAllNegotiationsBtn')?.addEventListener('click', () => {
      this.showPendingNegotiationsModal();
      notification.remove();
    });
    
    setTimeout(() => {
      notification.remove();
    }, 15000);
  }

  showPendingNegotiationsModal() {
    const currentPlayer = getCurrentPlayer();
    const pendingNegotiations = getPendingNegotiationsForPlayer(currentPlayer.id);
    
    if (pendingNegotiations.length === 0) {
      window.utils.showFeedback('Nenhuma proposta pendente.', 'info');
      return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-6';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/70"></div>
      <div class="relative w-full max-w-2xl bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl text-yellow-300 font-semibold">📨 Propostas Pendentes</h2>
          <button id="closePendingModalBtn" class="text-gray-300 hover:text-white text-xl">✖</button>
        </div>
        <div class="space-y-3 max-h-[50vh] overflow-y-auto p-2">
          ${pendingNegotiations.map(negotiation => {
            const initiator = gameState.players[negotiation.initiatorId];
            const offerSummary = this.getNegotiationSummary(negotiation);
            
            return `
              <div class="p-4 bg-gray-800/50 rounded-lg border border-white/5 hover:bg-gray-700/50 transition">
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <h3 class="font-semibold text-white flex items-center gap-2">
                      ${initiator.icon} ${initiator.name}
                    </h3>
                    <div class="text-sm text-gray-300 mt-2">
                      ${offerSummary}
                    </div>
                    <p class="text-xs text-gray-400 mt-2">
                      Turno ${negotiation.turn} • ${new Date(negotiation.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <button data-negotiation-id="${negotiation.id}" 
                          class="view-negotiation-btn ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white">
                    Responder
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="mt-6 text-center">
          <button id="closeAllPendingBtn" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300">
            Fechar
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('closePendingModalBtn')?.addEventListener('click', () => {
      modal.remove();
    });
    
    document.getElementById('closeAllPendingBtn')?.addEventListener('click', () => {
      modal.remove();
    });
    
    modal.querySelectorAll('.view-negotiation-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const negotiationId = e.currentTarget.dataset.negotiationId;
        modal.remove();
        this.viewNegotiation(negotiationId);
      });
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  getNegotiationDetails(negotiation) {
    const initiator = gameState.players[negotiation.initiatorId];
    const target = gameState.players[negotiation.targetId];
    
    const offerDetails = [];
    const requestDetails = [];
    
    Object.entries(negotiation.offer).forEach(([key, value]) => {
      if (value > 0 && key !== 'regions') {
        offerDetails.push(`${value} ${RESOURCE_ICONS[key] || key}`);
      }
    });
    
    if (negotiation.offer.regions && negotiation.offer.regions.length > 0) {
      const regionNames = negotiation.offer.regions.map(rid => 
        gameState.regions[rid]?.name || `Região ${rid}`
      );
      offerDetails.push(`Regiões: ${regionNames.join(', ')}`);
    }
    
    Object.entries(negotiation.request).forEach(([key, value]) => {
      if (value > 0 && key !== 'regions') {
        requestDetails.push(`${value} ${RESOURCE_ICONS[key] || key}`);
      }
    });
    
    if (negotiation.request.regions && negotiation.request.regions.length > 0) {
      const regionNames = negotiation.request.regions.map(rid => 
        gameState.regions[rid]?.name || `Região ${rid}`
      );
      requestDetails.push(`Regiões: ${regionNames.join(', ')}`);
    }
    
    return {
      initiator,
      target,
      offerDetails: offerDetails.length > 0 ? offerDetails : ['Nada'],
      requestDetails: requestDetails.length > 0 ? requestDetails : ['Nada']
    };
  }

  // ==================== MODAL DE VITÓRIA ====================
  openVictoryModal(winner) {
    this.victoryModalTitle.textContent = 'Vitória!';
    this.victoryModalMessage.textContent = `Parabéns, ${winner.name}! Você venceu Gaia!`;
    this.victoryModal.classList.remove('hidden');
  }

  closeVictoryModal() {
    this.victoryModal.classList.add('hidden');
  }

  // ==================== MODAL DE ALERTA ====================
  showAlert(title, message, type = 'info') {
    let icon = 'ℹ️';
    if (type === 'warning') icon = '🟡';
    if (type === 'error') icon = '🔴';
    if (type === 'success') icon = '🟢';
    
    this.alertIconEl.textContent = icon;
    this.alertTitleEl.textContent = title;
    this.alertMessageEl.textContent = message;
    
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
