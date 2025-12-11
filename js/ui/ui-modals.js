// ui-modals.js - Gerenciamento de Modais
import { gameState, achievementsState, getCurrentPlayer, addActivityLog } from '../state/game-state.js';
import { 
  GAME_CONFIG, 
  RESOURCE_ICONS, 
  BIOME_INCOME,
  BIOME_INITIAL_RESOURCES,
  STRUCTURE_INCOME, 
  STRUCTURE_COSTS,
  STRUCTURE_EFFECTS,
  STRUCTURE_LIMITS,
  EXPLORATION_BONUS,
  EXPLORATION_SPECIAL_BONUS,
  TURN_PHASES,
  ACHIEVEMENTS_CONFIG,
  GAME_EVENTS,
  ACHIEVEMENTS,
  EVENT_CATEGORIES,
  STRUCTURE_CONFIG
} from '../state/game-config.js';
import { getAllManualContent } from '../utils/game-manual.js';

class ModalManager {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.cacheModalElements();
    this.setupModalListeners();
  }

  cacheModalElements() {
    // Cache de TODOS os elementos modais
    this.modals = {
      alert: document.getElementById('alertModal'),
      manual: document.getElementById('manualModal'),
      event: document.getElementById('eventModal'),
      structure: document.getElementById('structureModal'),
      income: document.getElementById('incomeModal'),
      victory: document.getElementById('victoryModal'),
      achievements: null // criado dinamicamente
    };

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

    // Income modal elements
    this.incomeOkBtn = document.getElementById('incomeOkBtn');
    this.incomePlayerName = document.getElementById('incomePlayerName');
    this.incomeResources = document.getElementById('incomeResources');

    // Victory modal
    this.victoryModalTitle = document.getElementById('victoryModalTitle');
    this.victoryModalMessage = document.getElementById('victoryModalMessage');
    this.victoryModalClose = document.getElementById('victoryModalClose');

    // Manual tabs
    this.manualTabs = document.querySelectorAll('.manual-tab');
    this.manualContents = document.querySelectorAll('.manual-content');
  }

  setupModalListeners() {
    // Manual
    document.getElementById('manualCloseBtn')?.addEventListener('click', () => this.closeManual());
    // Manual tabs
    this.manualTabs.forEach(t => t.addEventListener('click', (e) => this.handleManualTabClick(e)));

    // Structure modal
    this.structureModalClose?.addEventListener('click', () => this.closeStructureModal());
    this.modals.structure?.addEventListener('click', (e) => {
      if (e.target === this.modals.structure) {
        this.closeStructureModal();
      }
    });

    // Event modal
    this.eventOkBtn?.addEventListener('click', () => this.closeEventModal());
    this.eventBannerClose?.addEventListener('click', () => this.hideEventBanner());

    // Victory modal
    this.victoryModalClose?.addEventListener('click', () => this.closeVictoryModal());

    // Income modal
    this.incomeOkBtn?.addEventListener('click', () => this.closeIncomeModal());
  }

  // ==================== MODAL GENÉRICO ====================
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
    
    this.modals.alert.classList.remove('hidden');
    setTimeout(() => this.modals.alert.classList.add('show'), 10);
  }

  hideAlert() {
    this.modals.alert.classList.remove('show');
    setTimeout(() => this.modals.alert.classList.add('hidden'), 180);
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
      this.modals.alert.classList.remove('hidden');
      setTimeout(() => this.modals.alert.classList.add('show'), 10);
    });
  }

  showFeedback(message, type = 'info') {
    const t = type === 'error' ? 'Erro' : type === 'success' ? 'Sucesso' : 'Informação';
    this.showAlert(t, message, type);
  }

  // ==================== MODAL DE MANUAL ====================
  openManual() {
    this.renderManualFromText();
    this.modals.manual.classList.remove('hidden');
  }

  closeManual() {
    this.modals.manual.classList.add('hidden');
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
      { id: 'tab-gaia', key: 'gaia' },
      { id: 'tab-regioes', key: 'regioes' },
      { id: 'tab-faccoes', key: 'faccoes' },
      { id: 'tab-fases', key: 'fases' },
      { id: 'tab-acoes', key: 'acoes' },
      { id: 'tab-negociacao', key: 'negociacao' },
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

  // ==================== MODAL DE EVENTOS ====================
  openEventModal(event) {
    if (!event) return;
    
    this.eventIconEl.textContent = event.icon;
    this.eventTitleEl.textContent = event.name;
    this.eventDescriptionEl.textContent = event.description;
    this.eventEffectEl.textContent = `Efeito: ${event.effect}`;
    this.eventDurationEl.textContent = event.duration > 0 
      ? `Duração: ${event.duration} turno(s)` 
      : `Duração: instantâneo`;
    
    this.modals.event.classList.remove('hidden');
  }

  closeEventModal() {
    this.modals.event.classList.add('hidden');
  }

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
      this.showFeedback('Selecione uma região primeiro.', 'error');
      return;
    }
    
    const region = gameState.regions[gameState.selectedRegionId];
    const player = gameState.players[gameState.currentPlayerIndex];
    
    if (region.controller !== player.id) {
      this.showFeedback('Você só pode construir em regiões que controla.', 'error');
      return;
    }
    
    this.structureModalRegion.textContent = `${region.name} (${region.biome})`;
    this.renderStructureOptions(region);
    this.modals.structure.classList.remove('hidden');
  }

  closeStructureModal() {
    this.modals.structure.classList.add('hidden');
  }

  renderStructureOptions(region) {
  this.structureOptions.innerHTML = '';
  
  const colorClasses = {
    'green': { 
        border: 'border-green-500/30', 
        text: 'text-green-100',  // Mais claro
        bg: 'bg-green-900/20',
        icon: 'text-green-300'
    },
    'blue': { 
        border: 'border-blue-500/30', 
        text: 'text-blue-100',
        bg: 'bg-blue-900/20',
        icon: 'text-blue-300'
    },
    'yellow': { 
        border: 'border-yellow-500/30', 
        text: 'text-yellow-100',
        bg: 'bg-yellow-900/20',
        icon: 'text-yellow-300'
    },
    'purple': { 
        border: 'border-purple-500/30', 
        text: 'text-purple-100',
        bg: 'bg-purple-900/20',
        icon: 'text-purple-300'
    },
    'red': { 
        border: 'border-red-500/30', 
        text: 'text-red-100',
        bg: 'bg-red-900/20',
        icon: 'text-red-300'
    }
};
  
  Object.entries(STRUCTURE_CONFIG).forEach(([name, config]) => {
    if (region.structures.includes(name)) {
      return;
    }
    
    const cost = config.cost || {};
    const income = config.income || {};
    const effect = config.effect || {};
    const colorClass = colorClasses[config.color] || colorClasses.green;
    
    const option = document.createElement('div');
    option.className = `bg-gray-800/50 border ${colorClass.border} rounded-xl p-4 hover:bg-gray-700/50 transition cursor-pointer`;
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
  <div class="flex items-start gap-4 p-1">
    <span class="text-4xl ${colorClass.icon} filter drop-shadow-lg">${config.icon}</span>
    <div class="flex-1">
      <h3 class="font-bold ${colorClass.text} mb-2 text-lg tracking-tight">${name}</h3>
      <p class="text-sm text-white/90 mb-3 leading-relaxed">${effect.description || ''}</p>
      
      <div class="mb-3">
        <p class="text-xs font-semibold text-white/80 mb-1">Custo:</p>
        <div class="flex flex-wrap gap-2 mt-1">
          ${Object.entries(cost).map(([resource, amount]) => `
            <span class="text-xs px-3 py-1.5 rounded-lg bg-gray-800/80 text-white font-bold border border-white/10 shadow-md">
              ${amount}${RESOURCE_ICONS[resource]} ${resource}
            </span>
          `).join('')}
        </div>
      </div>
      
      <div class="mb-3">
        <p class="text-xs font-semibold text-white/80 mb-1">Benefícios por turno:</p>
        <div class="flex flex-wrap gap-2 mt-1">
          ${effect.pv ? `
            <span class="text-xs px-3 py-1.5 rounded-lg bg-yellow-900/50 text-yellow-200 font-bold border border-yellow-500/30 shadow-md">
              +${effect.pv} ⭐ PV
            </span>
          ` : ''}
          ${Object.entries(income).map(([resource, amount]) => `
            <span class="text-xs px-3 py-1.5 rounded-lg bg-blue-900/50 text-blue-200 font-bold border border-blue-500/30 shadow-md">
              +${amount}${RESOURCE_ICONS[resource]} ${resource === 'pv' ? 'PV' : resource}
            </span>
          `).join('')}
        </div>
      </div>
      
      ${!canAfford ? 
        '<p class="text-sm text-red-300 font-semibold mt-3 text-center py-1.5 bg-red-900/30 rounded border border-red-500/30">❌ Recursos insuficientes</p>' : 
        '<p class="text-sm text-green-300 font-semibold mt-3 text-center py-1.5 bg-green-900/30 rounded border border-green-500/30 animate-pulse">✅ Clique para construir</p>'
      }
    </div>
  </div>
`;
    
    if (canAfford) {
    option.addEventListener('click', () => {
        // Adicionar feedback visual
        this.addStructureSelectionFeedback(name);
        
        // Pequeno delay para o feedback
        setTimeout(() => {
            this.closeStructureModal();
            
            if (window.gameLogic && window.gameLogic.handleBuild) {
                window.gameLogic.handleBuild(name);
            } else {
                this.showFeedback('Erro ao construir estrutura. Função não encontrada.', 'error');
            }
        }, 300);
    });
}
    
    this.structureOptions.appendChild(option);
  });
  
  if (this.structureOptions.children.length === 0) {
    this.structureOptions.innerHTML = `
      <div class="text-center py-8">
        <p class="text-gray-400">Todas as estruturas já foram construídas nesta região.</p>
      </div>
    `;
  }
}

addStructureSelectionFeedback(structureName) {
    // Encontrar o elemento da estrutura clicada
    const structureElements = document.querySelectorAll('#structureOptions > div');
    structureElements.forEach(el => {
        if (el.querySelector('h3')?.textContent === structureName) {
            // Adicionar efeito visual
            el.classList.add('animate-pulse', 'ring-2', 'ring-yellow-400');
            
            // Remover depois de 1 segundo
            setTimeout(() => {
                el.classList.remove('animate-pulse', 'ring-2', 'ring-yellow-400');
            }, 1000);
            
            // Feedback de áudio (opcional)
            if (typeof Audio !== 'undefined') {
                const clickSound = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQ=');
                clickSound.volume = 0.3;
                clickSound.play().catch(() => {});
            }
        }
    });
}

  // ==================== MODAL DE RENDA ====================

showIncomeModal(player, bonuses) {
  console.log('💰 showIncomeModal chamado para:', player.name);
  
  if (!this.incomeModal) {
    this.incomeModal = document.getElementById('incomeModal');
  }
  
  if (!this.incomeModal) {
    console.error('❌ incomeModal não encontrado no DOM');
    return;
  }
  
  // CORREÇÃO: Usar os IDs corretos do seu HTML
  const playerNameEl = this.incomeModal.querySelector('#incomePlayerName');
  const resourcesEl = this.incomeModal.querySelector('#incomeResources');
  const okBtn = this.incomeModal.querySelector('#incomeOkBtn');
  
  // Configurar nome do jogador
  if (playerNameEl) {
    playerNameEl.textContent = `${player.icon} ${player.name}`;
  }
  
  // Configurar recursos
  if (resourcesEl) {
    let html = '<div class="grid grid-cols-2 gap-3">';
    
    Object.entries(bonuses).forEach(([resource, amount]) => {
      if (amount > 0 && resource !== 'pv') {
        const icon = RESOURCE_ICONS[resource] || '📦';
        const resourceNames = {
          'madeira': 'Madeira',
          'pedra': 'Pedra', 
          'ouro': 'Ouro',
          'agua': 'Água'
        };
        
        html += `
          <div class="flex items-center justify-between p-2 bg-gray-700/50 rounded">
            <span class="text-white flex items-center gap-2">
              <span class="text-lg">${icon}</span>
              <span>${resourceNames[resource] || resource}</span>
            </span>
            <span class="text-green-400 font-bold">+${amount}</span>
          </div>`;
      }
    });
    
    if (bonuses.pv > 0) {
      html += `
        <div class="col-span-2 flex items-center justify-between p-2 bg-yellow-900/30 rounded mt-2">
          <span class="text-white flex items-center gap-2">
            <span class="text-lg">⭐</span>
            <span>Pontos de Vitória</span>
          </span>
          <span class="text-yellow-400 font-bold">+${bonuses.pv}</span>
        </div>`;
    }
    
    html += '</div>';
    
    resourcesEl.innerHTML = html;
  }
  
  // Configurar botão OK
  if (okBtn) {
    // Remover listeners anteriores (para evitar múltiplos bindings)
    const newOkBtn = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    
    // Adicionar novo listener
    document.getElementById('incomeOkBtn').addEventListener('click', () => {
      console.log('✅ Jogador clicou em OK na renda');
      
      // Avançar para fase de ações
      if (window.gameLogic) {
        gameState.currentPhase = 'acoes';
        gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
        
        addActivityLog({
          type: 'phase',
          playerName: player.name,
          action: 'iniciou fase de ações',
          details: '',
          turn: gameState.turn
        });
        
        // Atualizar UI
        if (window.uiManager) {
          window.uiManager.updateUI();
          window.uiManager.updateFooter();
        }
      }
      
      this.closeModal('incomeModal');
    });
  }
  
  // Mostrar modal
  this.showModal('incomeModal');
  console.log('✅ Modal de renda mostrado com sucesso');
}

  closeIncomeModal() {
  if (!this.modals.income) {
    console.error('Elemento incomeModal não encontrado!');
    return;
  }
  
  this.modals.income.classList.add('hidden');
  
  if (gameState.gameStarted) {
    gameState.currentPhase = 'acoes';
    gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
    
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

showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    // Garantir que o modal esteja no topo
    modal.style.zIndex = '9999';
    console.log(`✅ Modal ${modalId} mostrado`);
  } else {
    console.error(`❌ Modal ${modalId} não encontrado`);
  }
}

closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    console.log(`✅ Modal ${modalId} fechado`);
  }
}

  // ==================== MODAL DE CONQUISTAS ====================
renderAchievementsModal() {
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
  const playerStats = achievementsState.playerAchievements[playerIndex] || {
    explored: 0,
    built: 0,
    negotiated: 0,
    collected: 0,
    controlledBiomes: new Set(),
    maxResources: { madeira: 0, pedra: 0, ouro: 0, agua: 0 }
  };
  
  playerNameEl.textContent = `Jogador atual: ${player.name}`;
  
  Object.values(ACHIEVEMENTS_CONFIG).forEach(achievement => {
    const isUnlocked = (achievementsState.unlockedAchievements[playerIndex] || []).includes(achievement.id);
    const card = document.createElement('div');
    card.className = `p-4 rounded-lg border ${isUnlocked ? 'border-yellow-500/50 bg-yellow-900/10' : 'border-gray-700/50 bg-gray-800/30'}`;
    
    let progress = 0;
    let progressText = '';
    
    switch (achievement.type) {
      case 'explored':
        progress = playerStats.explored || 0;
        progressText = `Exploradas: ${progress}/${achievement.requirement}`;
        break;
      case 'built':
        progress = playerStats.built || 0;
        progressText = `Construídas: ${progress}/${achievement.requirement}`;
        break;
      case 'negotiated':
        progress = playerStats.negotiated || 0;
        progressText = `Negociações: ${progress}/${achievement.requirement}`;
        break;
      case 'collected':
        progress = playerStats.collected || 0;
        progressText = `Regiões coletadas: ${progress}/${achievement.requirement}`;
        break;
      case 'biomes':
        progress = playerStats.controlledBiomes?.size || 0;
        progressText = `Biomas: ${progress}/${achievement.requirement}`;
        break;
      case 'resources':
        const resources = playerStats.maxResources || {};
        const resourceCount = Object.values(resources).filter(value => value >= achievement.requirement).length;
        progress = resourceCount;
        progressText = `Recursos: ${progress}/4 com ${achievement.requirement}+`;
        break;
      case 'fastWin':
        progress = gameState.turn;
        progressText = `Turno atual: ${progress}/${achievement.requirement}`;
        break;
      case 'pacifist':
        progress = playerStats.negotiated || 0;
        progressText = progress === 0 ? '✅ Nunca negociou' : `Negociações: ${progress}`;
        break;
      default:
        progressText = isUnlocked ? '✅ Desbloqueado' : '🔒 Bloqueado';
    }
    
    const progressPercent = achievement.requirement > 0 
      ? Math.min(100, (progress / achievement.requirement) * 100)
      : (progress === 0 ? 100 : 0); // Para pacifist
    
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

  // ==================== MODAL DE VITÓRIA ====================

  openVictoryModal(winner) {
    console.log('🏆 Abrindo modal de vitória para:', winner.name);
    
    // Atualizar conteúdo do modal
    if (this.victoryModalTitle) {
        this.victoryModalTitle.textContent = '🏆 VITÓRIA 🏆';
    }
    
    if (this.victoryModalMessage) {
        this.victoryModalMessage.textContent = 
            `Parabéns, ${winner.name}! Você conquistou Gaia com ${winner.victoryPoints} Pontos de Vitória!`;
    }
    
// Atualizar a pontuação
const pointsDisplay = document.getElementById('victoryPointsDisplay');
if (pointsDisplay) {
    pointsDisplay.textContent = winner.victoryPoints;
}

// Configurar botões do modal
const setupVictoryButtons = () => {
    const newGameBtn = document.getElementById('victoryNewGameBtn');
    const closeBtn = document.getElementById('victoryCloseBtn');
    
    if (newGameBtn) {
        newGameBtn.onclick = () => {
            this.modals.victory.classList.add('hidden');
            setTimeout(() => window.location.reload(), 500);
        };
    }
    
    if (closeBtn) {
        closeBtn.onclick = () => {
            this.modals.victory.classList.add('hidden');
        };
    }
};

setupVictoryButtons();

    // Mostrar o modal
    if (this.modals.victory) {
        this.modals.victory.classList.remove('hidden');
        
        // Garantir que esteja no topo de todos os elementos
        this.modals.victory.style.zIndex = '9999';
        
        // Adicionar animação
        setTimeout(() => {
            const modalContent = this.modals.victory.querySelector('.relative');
            if (modalContent) {
                modalContent.classList.add('animate__animated', 'animate__bounceIn');
            }
        }, 100);
        
        // Configurar evento de fechar
        const closeModal = () => {
            this.modals.victory.classList.add('hidden');
            this.modals.victory.style.zIndex = '';
        };
        
        // Atualizar listener do botão de fechar
        const closeBtn = document.getElementById('victoryModalClose');
        if (closeBtn) {
            // Remover listeners antigos
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
            
            // Adicionar novo listener
            document.getElementById('victoryModalClose').addEventListener('click', closeModal);
        }
        
        // Fechar ao clicar no overlay
        this.modals.victory.addEventListener('click', (e) => {
            if (e.target === this.modals.victory) {
                closeModal();
            }
        });
        
        // Desabilitar todas as ações do jogo
        this.disableAllGameActions();
    }
}

// ADICIONE este método para desabilitar ações:

disableAllGameActions() {
    // Desabilitar botões de ação
    const actionButtons = [
        'actionExplore', 'actionCollect', 'actionBuild', 
        'actionNegotiate', 'endTurnBtn'
    ];
    
    actionButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.disabled = true;
            btn.classList.add('opacity-30', 'cursor-not-allowed');
        }
    });
    
    // Desabilitar cliques no mapa
    const boardContainer = document.getElementById('boardContainer');
    if (boardContainer) {
        boardContainer.style.pointerEvents = 'none';
        boardContainer.style.opacity = '0.7';
    }
    
    // Atualizar indicador de fase
    const phaseIndicator = document.getElementById('phaseIndicator');
    if (phaseIndicator) {
        phaseIndicator.textContent = '🎉 JOGO TERMINADO!';
        phaseIndicator.classList.add('text-yellow-400', 'font-bold', 'animate-pulse');
    }
}

  closeVictoryModal() {
    this.modals.victory.classList.add('hidden');
  }

  // ==================== GERENCIAMENTO DE MODAIS ====================
  closeAllModals() {
    Object.values(this.modals).forEach(modal => {
      if (modal) modal.classList.add('hidden');
    });
  }

  isAnyModalOpen() {
    return Object.values(this.modals).some(modal => 
      modal && !modal.classList.contains('hidden')
    );
  }
}

export { ModalManager };
