// ui-modals.js - Gerenciamento de Modais
import { gameState, achievementsState, getCurrentPlayer, addActivityLog } from './game-state.js';
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
} from './game-config.js';
import { getAllManualContent } from './game-manual.js';

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
    'green': { border: 'border-green-500/30', text: 'text-green-300' },
    'blue': { border: 'border-blue-500/30', text: 'text-blue-300' },
    'yellow': { border: 'border-yellow-500/30', text: 'text-yellow-300' },
    'purple': { border: 'border-purple-500/30', text: 'text-purple-300' },
    'red': { border: 'border-red-500/30', text: 'text-red-300' }
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
      <div class="flex items-start gap-3">
        <span class="text-3xl">${config.icon}</span>
        <div class="flex-1">
          <h3 class="font-bold ${colorClass.text} mb-1">${name}</h3>
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
          window.gameLogic.handleBuild(name);
        } else {
          this.showFeedback('Erro ao construir estrutura. Função não encontrada.', 'error');
        }
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

  // ==================== MODAL DE RENDA ====================
  showIncomeModal(player, income) {
    if (!this.modals.income) {
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
    
    this.modals.income.classList.remove('hidden');
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
    this.victoryModalTitle.textContent = 'Vitória!';
    this.victoryModalMessage.textContent = `Parabéns, ${winner.name}! Você venceu Gaia!`;
    this.modals.victory.classList.remove('hidden');
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