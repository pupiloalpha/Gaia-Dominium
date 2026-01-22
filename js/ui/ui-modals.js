// ui-modals.js - Gerenciamento de Modais (REFATORADO)
import { gameState, achievementsState, getCurrentPlayer, addActivityLog } from '../state/game-state.js';
import { 
  RESOURCE_ICONS, 
  STRUCTURE_CONFIG,
  ACHIEVEMENTS_CONFIG 
} from '../state/game-config.js';
import { getAllManualContent } from '../utils/game-manual.js';

// ==================== MODAIS ESPECIALIZADOS ====================

class AlertModal {
  constructor(modalManager) {
    this.modalManager = modalManager;
    this.modal = document.getElementById('alertModal');
    this.iconEl = document.getElementById('alertIcon');
    this.titleEl = document.getElementById('alertTitle');
    this.messageEl = document.getElementById('alertMessage');
    this.buttonsEl = document.getElementById('alertButtons');
  }

  show(title, message, type = 'info') {
    const icons = {
      'info': 'ℹ️',
      'warning': '🟡',
      'error': '🔴',
      'success': '🟢'
    };
    
    this.iconEl.textContent = icons[type] || 'ℹ️';
    this.titleEl.textContent = title;
    this.messageEl.textContent = message;
    
    this.buttonsEl.innerHTML = '';
    const ok = document.createElement('button');
    ok.className = 'px-4 py-2 bg-gray-800 border border-white/6 rounded-full text-white';
    ok.textContent = 'OK';
    ok.addEventListener('click', () => this.hide());
    this.buttonsEl.appendChild(ok);
    
    this.modal.classList.remove('hidden');
    setTimeout(() => this.modal.classList.add('show'), 10);
  }

  hide() {
    this.modal.classList.remove('show');
    setTimeout(() => this.modal.classList.add('hidden'), 180);
  }

  async confirm(title, message) {
    return new Promise(resolve => {
      let resolved = false;
      this.iconEl.textContent = '❓';
      this.titleEl.textContent = title;
      this.messageEl.textContent = message;
      this.buttonsEl.innerHTML = '';
      
      const no = document.createElement('button');
      no.className = 'px-4 py-2 bg-gray-800 border border-white/6 rounded-full text-white mr-2';
      no.textContent = 'Não';
      no.addEventListener('click', () => {
        if (resolved) return;
        resolved = true;
        this.hide();
        resolve(false);
      });

      const yes = document.createElement('button');
      yes.className = 'px-4 py-2 bg-green-600 rounded-full text-white';
      yes.textContent = 'Sim';
      yes.addEventListener('click', () => {
        if (resolved) return;
        resolved = true;
        this.hide();
        resolve(true);
      });

      this.buttonsEl.appendChild(no);
      this.buttonsEl.appendChild(yes);
      this.modal.classList.remove('hidden');
      setTimeout(() => this.modal.classList.add('show'), 10);
    });
  }
}

class ManualModal {
  constructor(modalManager) {
    this.modalManager = modalManager;
    this.modal = document.getElementById('manualModal');
    this.tabs = document.querySelectorAll('.manual-tab');
    this.contents = document.querySelectorAll('.manual-content');
    this.setupListeners();
  }

  setupListeners() {
    document.getElementById('manualCloseBtn')?.addEventListener('click', () => this.close());
    this.tabs.forEach(t => t.addEventListener('click', (e) => this.handleTabClick(e)));
  }

  open() {
    this.renderContent();
    this.modal.classList.remove('hidden');
  }

  close() {
    this.modal.classList.add('hidden');
  }

  handleTabClick(e) {
    this.tabs.forEach(t => t.classList.remove('active'));
    e.currentTarget.classList.add('active');
    this.showTab(e.currentTarget.dataset.tab);
  }

  showTab(tabId) {
    this.contents.forEach(c => c.classList.add('hidden'));
    const el = document.getElementById(tabId);
    if (el) el.classList.remove('hidden');
    
    if (tabId === 'tab-eventos') {
      setTimeout(() => this.modalManager.setupEventFilters(), 200);
    }
  }

  renderContent() {
    const content = getAllManualContent();
    const tabs = [
      { id: 'tab-o-jogo', key: 'o-jogo' },
      { id: 'tab-gaia', key: 'gaia' },
      { id: 'tab-regioes', key: 'regioes' },
      { id: 'tab-faccoes', key: 'faccoes' },
      { id: 'tab-fases', key: 'fases' },
      { id: 'tab-acoes', key: 'acoes' },
      { id: 'tab-negociacao', key: 'negociacao' },
      { id: 'tab-estrutura', key: 'estrutura' },
      { id: 'tab-eventos', key: 'eventos' },
      { id: 'tab-conquistas', key: 'conquistas' }
    ];
    
    tabs.forEach(tab => {
      const element = document.getElementById(tab.id);
      if (element) {
        element.innerHTML = content[tab.key] || '<p class="text-gray-400">Conteúdo não disponível</p>';
      }
    });
  }
}

class EventModal {
  constructor(modalManager) {
    this.modalManager = modalManager;
    this.modal = document.getElementById('eventModal');
    this.banner = document.getElementById('eventBanner');
    this.setupListeners();
  }

  setupListeners() {
    document.getElementById('eventOkBtn')?.addEventListener('click', () => this.close());
    document.getElementById('eventBannerClose')?.addEventListener('click', () => this.hideBanner());
  }

  open(event) {
    if (!event) return;
    
    document.getElementById('eventIcon').textContent = event.icon;
    document.getElementById('eventTitle').textContent = event.name;
    document.getElementById('eventDescription').textContent = event.description;
    document.getElementById('eventEffect').textContent = `Efeito: ${event.effect}`;
    document.getElementById('eventDuration').textContent = 
      event.duration > 0 ? `Duração: ${event.duration} turno(s)` : `Duração: instantâneo`;
    
    this.modal.classList.remove('hidden');
  }

  close() {
    this.modal.classList.add('hidden');
  }

  updateBanner() {
    if (gameState.currentEvent && gameState.eventTurnsLeft > 0) {
      const event = gameState.currentEvent;
      const category = this.getCategory(event.id);
      
      document.getElementById('eventBannerIcon').textContent = event.icon;
      document.getElementById('eventBannerTitle').textContent = event.name;
      document.getElementById('eventBannerTurns').textContent = 
        `${gameState.eventTurnsLeft} turno${gameState.eventTurnsLeft > 1 ? 's' : ''} restante${gameState.eventTurnsLeft > 1 ? 's' : ''}`;
      document.getElementById('eventBannerEffect').textContent = event.effect;
      
      this.banner.className = `hidden mb-3 p-3 rounded-lg border animate-pulse-slow event-${category}`;
      this.banner.classList.remove('hidden');
    } else {
      this.hideBanner();
    }
  }

  hideBanner() {
    this.banner.classList.add('hidden');
  }

  getCategory(eventId) {
    const positive = ['primavera', 'mercado', 'festival', 'exploracao', 'enchente'];
    const negative = ['seca', 'tempestade', 'inflacao', 'escassez_pedra', 'areia', 'depressao'];
    const mixed = ['jazida', 'inverno', 'tecnologia', 'arqueologia'];
    
    if (positive.includes(eventId)) return 'positive';
    if (negative.includes(eventId)) return 'negative';
    if (mixed.includes(eventId)) return 'mixed';
    return 'neutral';
  }
}

class StructureModal {
  constructor(modalManager) {
    this.modalManager = modalManager;
    this.modal = document.getElementById('structureModal');
    this.setupListeners();
  }

  setupListeners() {
    document.getElementById('structureModalClose')?.addEventListener('click', () => this.close());
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });
  }

  open() {
    if (gameState.selectedRegionId === null) {
      this.modalManager.showFeedback('Selecione uma região primeiro.', 'error');
      return;
    }
    
    const region = gameState.regions[gameState.selectedRegionId];
    const player = getCurrentPlayer();
    
    if (region.controller !== player.id) {
      this.modalManager.showFeedback('Você só pode construir em regiões que controla.', 'error');
      return;
    }
    
    document.getElementById('structureModalRegion').textContent = `${region.name} (${region.biome})`;
    this.renderOptions(region);
    this.modal.classList.remove('hidden');
  }

  close() {
    this.modal.classList.add('hidden');
  }

  renderOptions(region) {
    const player = getCurrentPlayer();
    const container = document.getElementById('structureOptions');
    
    if (player.eliminated) {
      container.innerHTML = this.getEliminatedPlayerHTML();
      return;
    }
    
    container.innerHTML = '';
    
    Object.entries(STRUCTURE_CONFIG).forEach(([name, config]) => {
      if (region.structures.includes(name)) return;
      
      const option = this.createOption(name, config, region, player);
      container.appendChild(option);
    });
    
    if (container.children.length === 0) {
      container.innerHTML = this.getNoStructuresHTML();
    }
  }

  createOption(name, config, region, player) {
    const cost = config.cost || {};
    const income = config.income || {};
    const effect = config.effect || {};
    const colorClass = this.getColorClass(config.color);
    const canAfford = this.canAfford(player, cost);
    
    const option = document.createElement('div');
    option.className = `bg-gray-800/50 border ${colorClass.border} rounded-xl p-4 hover:bg-gray-700/50 transition cursor-pointer`;
    option.dataset.structure = name;
    
    if (!canAfford) {
      option.classList.add('opacity-50');
      option.style.cursor = 'not-allowed';
    }
    
    option.innerHTML = this.getOptionHTML(name, config, cost, income, effect, colorClass, canAfford);
    
    if (canAfford) {
      option.addEventListener('click', () => {
        this.addSelectionFeedback(name);
        setTimeout(() => {
          this.close();
          if (window.gameLogic?.handleBuild) {
            window.gameLogic.handleBuild(name);
          } else {
            this.modalManager.showFeedback('Erro ao construir estrutura.', 'error');
          }
        }, 300);
      });
    }
    
    return option;
  }

  getOptionHTML(name, config, cost, income, effect, colorClass, canAfford) {
    return `
      <div class="flex items-start gap-4 p-1">
        <span class="text-4xl ${colorClass.icon}">${config.icon}</span>
        <div class="flex-1">
          <h3 class="font-bold ${colorClass.text} mb-2 text-lg">${name}</h3>
          <p class="text-sm text-white/90 mb-3">${effect.description || ''}</p>
          
          <div class="mb-3">
            <p class="text-xs font-semibold text-white/80 mb-1">Custo:</p>
            <div class="flex flex-wrap gap-2 mt-1">
              ${Object.entries(cost).map(([resource, amount]) => `
                <span class="text-xs px-3 py-1.5 rounded-lg bg-gray-800/80 text-white font-bold border border-white/10">
                  ${amount}${RESOURCE_ICONS[resource]} ${resource}
                </span>
              `).join('')}
            </div>
          </div>
          
          <div class="mb-3">
            <p class="text-xs font-semibold text-white/80 mb-1">Benefícios:</p>
            <div class="flex flex-wrap gap-2 mt-1">
              ${effect.pv ? `
                <span class="text-xs px-3 py-1.5 rounded-lg bg-yellow-900/50 text-yellow-200 font-bold border border-yellow-500/30">
                  +${effect.pv} ⭐ PV
                </span>
              ` : ''}
              ${Object.entries(income).map(([resource, amount]) => `
                <span class="text-xs px-3 py-1.5 rounded-lg bg-blue-900/50 text-blue-200 font-bold border border-blue-500/30">
                  +${amount}${RESOURCE_ICONS[resource]}
                </span>
              `).join('')}
            </div>
          </div>
          
          ${!canAfford ? 
            '<p class="text-sm text-red-300 font-semibold mt-3 text-center py-1.5 bg-red-900/30 rounded border border-red-500/30">❌ Recursos insuficientes</p>' : 
            '<p class="text-sm text-green-300 font-semibold mt-3 text-center py-1.5 bg-green-900/30 rounded border border-green-500/30">✅ Clique para construir</p>'
          }
        </div>
      </div>
    `;
  }

  getColorClass(color) {
    const classes = {
      'green': { border: 'border-green-500/30', text: 'text-green-100', icon: 'text-green-300' },
      'blue': { border: 'border-blue-500/30', text: 'text-blue-100', icon: 'text-blue-300' },
      'yellow': { border: 'border-yellow-500/30', text: 'text-yellow-100', icon: 'text-yellow-300' },
      'purple': { border: 'border-purple-500/30', text: 'text-purple-100', icon: 'text-purple-300' },
      'red': { border: 'border-red-500/30', text: 'text-red-100', icon: 'text-red-300' }
    };
    return classes[color] || classes.green;
  }

  canAfford(player, cost) {
    return Object.entries(cost).every(([resource, amount]) => 
      player.resources[resource] >= amount
    );
  }

  addSelectionFeedback(structureName) {
    const elements = document.querySelectorAll('#structureOptions > div');
    elements.forEach(el => {
      if (el.querySelector('h3')?.textContent === structureName) {
        el.classList.add('animate-pulse', 'ring-2', 'ring-yellow-400');
        setTimeout(() => el.classList.remove('animate-pulse', 'ring-2', 'ring-yellow-400'), 1000);
      }
    });
  }

  getEliminatedPlayerHTML() {
    return `
      <div class="text-center py-8">
        <p class="text-gray-400">💀 Jogador eliminado não pode construir.</p>
        <p class="text-sm text-gray-500 mt-2">Para ressuscitar: domine uma região neutra</p>
      </div>
    `;
  }

  getNoStructuresHTML() {
    return `<div class="text-center py-8"><p class="text-gray-400">Todas as estruturas já foram construídas nesta região.</p></div>`;
  }
}

class IncomeModal {
  constructor(modalManager) {
    this.modalManager = modalManager;
    this.modal = document.getElementById('incomeModal');
    this.setupListeners();
  }

  setupListeners() {
    const okBtn = this.modal?.querySelector('#incomeOkBtn');
    if (okBtn) {
      const newBtn = okBtn.cloneNode(true);
      okBtn.parentNode.replaceChild(newBtn, okBtn);
      newBtn.addEventListener('click', () => this.close());
    }
  }

  show(player, bonuses) {
    if (gameState.currentPhase !== 'renda' || gameState.currentPlayerIndex !== player.id) {
      this.close();
      gameState.currentPhase = 'acoes';
      if (window.uiManager) window.uiManager.updateUI();
      return;
    }
    
    if (player.eliminated) {
      console.log(`💰 Jogador ${player.name} eliminado, pulando renda.`);
      return;
    }
    
    this.modalManager.uiManager.setModalMode(true);
    
    document.getElementById('incomePlayerName').textContent = `${player.icon} ${player.name}`;
    document.getElementById('incomeResources').innerHTML = this.getResourcesHTML(bonuses);
    
    this.modal.classList.remove('hidden');
  }

  getResourcesHTML(bonuses) {
    let html = '<div class="grid grid-cols-2 gap-3">';
    
    Object.entries(bonuses).forEach(([resource, amount]) => {
      if (amount > 0 && resource !== 'pv' && RESOURCE_ICONS[resource]) {
        const resourceNames = {
          'madeira': 'Madeira',
          'pedra': 'Pedra', 
          'ouro': 'Ouro',
          'agua': 'Água'
        };
        
        html += `
          <div class="flex items-center justify-between p-2 bg-gray-700/50 rounded">
            <span class="text-white flex items-center gap-2">
              <span class="text-lg">${RESOURCE_ICONS[resource]}</span>
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
    return html;
  }

  close() {
    this.modal.classList.add('hidden');
    this.modalManager.uiManager.setModalMode(false);
    
    if (gameState.gameStarted && gameState.currentPhase === 'renda') {
      gameState.currentPhase = 'acoes';
      gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
      
      const currentPlayer = getCurrentPlayer();
      if (currentPlayer) {
        addActivityLog({
          type: 'phase',
          playerName: currentPlayer.name,
          action: 'iniciou fase de ações',
          turn: gameState.turn
        });
      }
      
      setTimeout(() => {
        if (window.uiManager) window.uiManager.updateUI();
      }, 100);
    }
  }
}

class VictoryModal {
  constructor(modalManager) {
    this.modalManager = modalManager;
    this.modal = document.getElementById('victoryModal');
    this.setupListeners();
  }

  setupListeners() {
    const closeBtn = document.getElementById('victoryModalClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
    
    const newGameBtn = document.getElementById('victoryNewGameBtn');
    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => {
        this.saveStatistics();
        this.close();
        setTimeout(() => window.location.reload(), 500);
      });
    }
  }

  open(winner) {
    document.getElementById('victoryPlayerName').textContent = winner.name;
    document.getElementById('victoryPointsDisplay').textContent = winner.victoryPoints;
    document.getElementById('victoryTurnCount').textContent = gameState.turn;
    
    this.modal.classList.remove('hidden');
    this.modalManager.disableAllGameActions();
    this.createConfettiEffect();
  }

  close() {
    this.modal.classList.add('hidden');
    this.clearConfetti();
  }

  createConfettiEffect() {
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.innerHTML = '✨';
        confetti.style.position = 'fixed';
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.top = '-50px';
        confetti.style.fontSize = `${Math.random() * 20 + 10}px`;
        confetti.style.color = ['#fbbf24', '#f59e0b', '#d97706', '#fde68a'][Math.floor(Math.random() * 4)];
        confetti.style.zIndex = '9998';
        confetti.style.pointerEvents = 'none';
        
        document.body.appendChild(confetti);
        
        confetti.animate([
          { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
          { transform: `translateY(${window.innerHeight + 100}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
        ], { duration: Math.random() * 2000 + 1000 });
        
        setTimeout(() => confetti.remove(), 3000);
      }, i * 30);
    }
  }

  clearConfetti() {
    document.querySelectorAll('div').forEach(el => {
      if (el.innerHTML === '✨' && el.style.position === 'fixed') {
        el.remove();
      }
    });
  }

  saveStatistics() {
    try {
      const stats = {
        winner: getCurrentPlayer().name,
        victoryPoints: getCurrentPlayer().victoryPoints,
        turn: gameState.turn,
        timestamp: new Date().toISOString(),
        players: gameState.players.map(p => ({
          name: p.name,
          points: p.victoryPoints,
          regions: p.regions.length
        }))
      };
      
      const existing = JSON.parse(localStorage.getItem('gaia_victory_stats') || '[]');
      existing.push(stats);
      if (existing.length > 10) existing.shift();
      localStorage.setItem('gaia_victory_stats', JSON.stringify(existing));
    } catch (error) {
      console.warn('⚠️ Não foi possível salvar estatísticas:', error);
    }
  }
}

// ==================== MODAL MANAGER PRINCIPAL ====================

class ModalManager {
  constructor(uiManager) {
    this.uiManager = uiManager;
    
    // Inicializar modais especializados
    this.alert = new AlertModal(this);
    this.manual = new ManualModal(this);
    this.event = new EventModal(this);
    this.structure = new StructureModal(this);
    this.income = new IncomeModal(this);
    this.victory = new VictoryModal(this);
    
    // Cache de modais
    this.modals = {
      alert: document.getElementById('alertModal'),
      manual: document.getElementById('manualModal'),
      event: document.getElementById('eventModal'),
      structure: document.getElementById('structureModal'),
      income: document.getElementById('incomeModal'),
      victory: document.getElementById('victoryModal'),
      dispute: document.getElementById('disputeModal'),
      disputeResult: document.getElementById('disputeResultModal')
    };
  }

  // ==================== MÉTODOS DE INTERFACE (mantidos para compatibilidade) ====================

  showAlert(title, message, type = 'info') {
    this.alert.show(title, message, type);
  }

  hideAlert() {
    this.alert.hide();
  }

  showConfirm(title, message) {
    return this.alert.confirm(title, message);
  }

  showFeedback(message, type = 'info') {
    const title = type === 'error' ? 'Erro' : 
                  type === 'success' ? 'Sucesso' : 
                  type === 'warning' ? 'Aviso' : 'Informação';
    this.showAlert(title, message, type);
  }

  openManual() {
    this.manual.open();
  }

  closeManual() {
    this.manual.close();
  }

  openEventModal(event) {
    this.event.open(event);
  }

  closeEventModal() {
    this.event.close();
  }

  updateEventBanner() {
    this.event.updateBanner();
  }

  hideEventBanner() {
    this.event.hideBanner();
  }

  openStructureModal() {
    this.structure.open();
  }

  closeStructureModal() {
    this.structure.close();
  }

  showIncomeModal(player, bonuses) {
    this.income.show(player, bonuses);
  }

  closeIncomeModal() {
    this.income.close();
  }

  openVictoryModal(winner) {
    this.victory.open(winner);
  }

  closeVictoryModal() {
    this.victory.close();
  }

  // ==================== MÉTODOS ESPECÍFICOS (mantidos) ====================

  setupEventFilters() {
    const setup = () => {
      const filterButtons = document.querySelectorAll('.event-filter-btn');
      const eventCards = document.querySelectorAll('.event-card');
      
      if (filterButtons.length === 0 || eventCards.length === 0) {
        setTimeout(setup, 100);
        return;
      }
      
      filterButtons.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
      });
      
      const refreshedButtons = document.querySelectorAll('.event-filter-btn');
      
      const resetAllButtons = () => {
        refreshedButtons.forEach(btn => {
          btn.classList.remove('active', 'bg-blue-600', 'bg-green-600', 'bg-red-600', 'bg-yellow-600', 'text-white');
          btn.classList.add('bg-gray-800', 'text-gray-300');
          btn.style.cssText = '';
        });
      };
      
      const applyFilter = (filterType) => {
        eventCards.forEach(card => {
          card.style.transition = 'opacity 0.3s ease';
          if (filterType === 'all') {
            card.style.display = 'block';
            setTimeout(() => card.style.opacity = '1', 10);
          } else {
            const hasCategory = card.classList.contains(`category-${filterType}`);
            card.style.opacity = hasCategory ? '1' : '0';
            setTimeout(() => card.style.display = hasCategory ? 'block' : 'none', 300);
          }
        });
      };
      
      refreshedButtons.forEach(btn => {
        btn.addEventListener('click', function() {
          resetAllButtons();
          this.classList.remove('bg-gray-800', 'text-gray-300');
          
          const colors = {
            'filterAll': 'bg-blue-600',
            'filterPositive': 'bg-green-600',
            'filterNegative': 'bg-red-600',
            'filterMixed': 'bg-yellow-600'
          };
          
          if (colors[this.id]) this.classList.add(colors[this.id], 'text-white');
          this.classList.add('active');
          
          const filterType = this.id.replace('filter', '').toLowerCase();
          applyFilter(filterType);
          
          this.style.transform = 'scale(0.95)';
          setTimeout(() => this.style.transform = 'scale(1)', 150);
        });
      });
      
      const allBtn = document.getElementById('filterAll');
      if (allBtn) {
        resetAllButtons();
        allBtn.classList.remove('bg-gray-800', 'text-gray-300');
        allBtn.classList.add('bg-blue-600', 'text-white', 'active');
        applyFilter('all');
      }
    };
    
    setTimeout(setup, 200);
  }

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
      
      document.getElementById('achievementsModalClose').addEventListener('click', () => {
        modal.classList.add('hidden');
      });
    }
    
    const content = document.getElementById('achievementsModalContent');
    const playerNameEl = document.getElementById('achievementsPlayerName');
    if (!content || !playerNameEl) return;
    
    const player = getCurrentPlayer();
    const playerStats = achievementsState.playerAchievements[player.id] || {
      explored: 0,
      built: 0,
      negotiated: 0,
      collected: 0,
      controlledBiomes: new Set(),
      maxResources: { madeira: 0, pedra: 0, ouro: 0, agua: 0 }
    };
    
    playerNameEl.textContent = `Jogador atual: ${player.name}`;
    content.innerHTML = '';
    
    Object.values(ACHIEVEMENTS_CONFIG).forEach(achievement => {
      const isUnlocked = (achievementsState.unlockedAchievements[player.id] || []).includes(achievement.id);
      const progress = this.calculateAchievementProgress(achievement, playerStats);
      
      const card = document.createElement('div');
      card.className = `p-4 rounded-lg border ${isUnlocked ? 'border-yellow-500/50 bg-yellow-900/10' : 'border-gray-700/50 bg-gray-800/30'}`;
      card.innerHTML = this.getAchievementCardHTML(achievement, isUnlocked, progress);
      content.appendChild(card);
    });
    
    modal.classList.remove('hidden');
  }

  calculateAchievementProgress(achievement, playerStats) {
    switch (achievement.type) {
      case 'explored': return { value: playerStats.explored || 0, text: `Exploradas: ${playerStats.explored}/${achievement.requirement}` };
      case 'built': return { value: playerStats.built || 0, text: `Construídas: ${playerStats.built}/${achievement.requirement}` };
      case 'negotiated': return { value: playerStats.negotiated || 0, text: `Negociações: ${playerStats.negotiated}/${achievement.requirement}` };
      case 'collected': return { value: playerStats.collected || 0, text: `Regiões coletadas: ${playerStats.collected}/${achievement.requirement}` };
      case 'biomes': return { value: playerStats.controlledBiomes?.size || 0, text: `Biomas: ${playerStats.controlledBiomes?.size}/${achievement.requirement}` };
      case 'resources': 
        const resourceCount = Object.values(playerStats.maxResources || {}).filter(v => v >= achievement.requirement).length;
        return { value: resourceCount, text: `Recursos: ${resourceCount}/4 com ${achievement.requirement}+` };
      case 'fastWin': return { value: gameState.turn, text: `Turno atual: ${gameState.turn}/${achievement.requirement}` };
      case 'pacifist': return { value: playerStats.negotiated || 0, text: playerStats.negotiated === 0 ? '✅ Nunca negociou' : `Negociações: ${playerStats.negotiated}` };
      default: return { value: 0, text: '' };
    }
  }

  getAchievementCardHTML(achievement, isUnlocked, progress) {
    const percent = achievement.requirement > 0 ? Math.min(100, (progress.value / achievement.requirement) * 100) : 100;
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
    
    return `
      <div class="flex items-start gap-3">
        <span class="text-2xl">${achievement.icon}</span>
        <div class="flex-1">
          <h3 class="font-bold ${isUnlocked ? 'text-yellow-300' : 'text-gray-300'}">
            ${achievement.name} ${isUnlocked ? '<span class="text-green-400 ml-2">✓</span>' : ''}
          </h3>
          <p class="text-sm text-gray-300 mt-1">${achievement.description}</p>
          
          <div class="mt-3">
            <div class="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progresso</span>
              <span>${percent.toFixed(0)}%</span>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-2">
              <div class="bg-green-500 h-2 rounded-full" style="width: ${percent}%"></div>
            </div>
            <div class="text-xs text-gray-400 mt-1">${progress.text}</div>
          </div>
          
          ${isUnlocked ? `
            <div class="mt-2 text-xs text-green-300">
              <strong>Recompensa:</strong> ${rewards[achievement.id] || 'Recompensa especial'}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  showNoWinnerModal() {
    let modal = document.getElementById('noWinnerModal');
    
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'noWinnerModal';
      modal.className = 'hidden fixed inset-0 z-[110] flex items-center justify-center p-6';
      modal.innerHTML = `
        <div class="absolute inset-0 bg-black/80"></div>
        <div class="relative w-full max-w-2xl bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-2xl shadow-xl p-8">
          <div class="text-center">
            <div class="text-6xl mb-4">💀</div>
            <h2 class="text-3xl text-white font-bold mb-4">FIM DE JOGO</h2>
            <p class="text-xl text-gray-300 mb-6">Todos os jogadores foram eliminados!</p>
            
            <div class="bg-gray-800/50 p-6 rounded-lg mb-6">
              <h3 class="text-lg font-semibold text-white mb-4">Resumo do Jogo</h3>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-gray-400">Turno final:</span>
                  <span class="text-white font-bold">${gameState.turn}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Duração:</span>
                  <span class="text-white font-bold">${gameState.turn} turnos</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Jogadores eliminados:</span>
                  <span class="text-white font-bold">${gameState.players.length}</span>
                </div>
              </div>
            </div>
            
            <div class="flex justify-center gap-4">
              <button id="noWinnerCloseBtn" class="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition">
                Fechar
              </button>
              <button id="noWinnerNewGameBtn" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition">
                Novo Jogo
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      document.getElementById('noWinnerCloseBtn').addEventListener('click', () => modal.classList.add('hidden'));
      document.getElementById('noWinnerNewGameBtn').addEventListener('click', () => {
        modal.classList.add('hidden');
        setTimeout(() => window.location.reload(), 500);
      });
    }
    
    modal.classList.remove('hidden');
  }

  disableAllGameActions() {
    ['actionExplore', 'actionCollect', 'actionBuild', 'actionNegotiate', 'endTurnBtn'].forEach(btnId => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.disabled = true;
        btn.classList.add('opacity-30', 'cursor-not-allowed');
      }
    });
    
    const boardContainer = document.getElementById('boardContainer');
    if (boardContainer) {
      boardContainer.style.pointerEvents = 'none';
      boardContainer.style.opacity = '0.7';
    }
    
    const phaseIndicator = document.getElementById('phaseIndicator');
    if (phaseIndicator) {
      phaseIndicator.textContent = '🎉 JOGO TERMINADO!';
      phaseIndicator.classList.add('text-yellow-400', 'font-bold', 'animate-pulse');
    }
  }

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