// ui-game.js - Interface do Jogo (Versão Simplificada)
import { gameState } from '../state/game-state.js';
import { FeedbackService } from '../utils/feedback-service.js';
import { BoardRenderer } from '../ui/components/board-renderer.js';
import { SidebarRenderer } from '../ui/components/sidebar-renderer.js';
import { FooterManager } from '../ui/components/footer-manager.js';

export class UIGameManager {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.boardRenderer = new BoardRenderer(this);
    this.sidebarRenderer = new SidebarRenderer(this);
    this.footerManager = new FooterManager(this);
    this.cacheElements();
  }

  cacheElements() {
    // Elementos principais apenas
    this.playerHeaderList = document.getElementById('playerHeaderList');
    this.turnInfo = document.getElementById('turnInfo');
  }

  init() {
    this.setupEventListeners();
    this.setupTransparencyControls();
  }

  updateUI() {
    this.renderHeaderPlayers();
    this.boardRenderer.render();
    this.sidebarRenderer.render(gameState.selectedPlayerForSidebar);
    this.footerManager.update();
    this.updateTurnInfo();
  }

  renderHeaderPlayers() {
    if (!this.playerHeaderList) return;
    
    this.playerHeaderList.innerHTML = gameState.players.map((p, i) => {
      const isCurrent = i === gameState.currentPlayerIndex;
      const isEliminated = p.eliminated;
      
      let buttonClass = 'px-3 py-1 rounded-lg text-white text-sm flex items-center gap-2 ';
      let content = '';
      
      if (isEliminated) {
        buttonClass += 'bg-gray-800/50 opacity-50 cursor-not-allowed ';
        content = `
          <div class="text-xl">💀</div>
          <div>
            <div class="font-medium line-through">${p.name}</div>
            <div class="text-xs text-gray-300">ELIMINADO</div>
          </div>
        `;
      } else if (isCurrent) {
        buttonClass += 'ring-2 ring-yellow-300 bg-white/5 ';
        content = `
          <div class="text-xl">${p.icon}</div>
          <div>
            <div class="font-medium">${p.name}</div>
            <div class="text-xs text-yellow-400">${p.victoryPoints} PV</div>
          </div>
        `;
      } else {
        buttonClass += 'bg-white/5 ';
        content = `
          <div class="text-xl">${p.icon}</div>
          <div>
            <div class="font-medium">${p.name}</div>
            <div class="text-xs text-yellow-400">${p.victoryPoints} PV</div>
          </div>
        `;
      }
      
      return `<button data-index="${i}" class="${buttonClass}" ${isEliminated ? 'disabled' : ''}>
        ${content}
      </button>`;
    }).join('');
  }

  updateTurnInfo() {
    if (this.turnInfo) {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      this.turnInfo.textContent = `Turno: ${gameState.turn} • Jogador: ${currentPlayer?.name || '—'}`;
    }
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
        FeedbackService.showFeedback(`Transparência ajustada para ${value}%`, 'info');
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
      resetBtn.addEventListener('click', () => this.resetTransparency());
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
      FeedbackService.showFeedback('Transparência resetada para o padrão (15%)', 'info');
    }
  }

  clearRegionSelection() {
    gameState.selectedRegionId = null;
    document.querySelectorAll('.board-cell').forEach(c => {
      c.classList.remove('region-selected');
    });
  }

  setupEventListeners() {
    // Navegação entre jogadores
    if (this.playerHeaderList) {
      this.playerHeaderList.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-index]');
        if (button) {
          const idx = Number(button.dataset.index);
          gameState.selectedPlayerForSidebar = idx;
          this.sidebarRenderer.render(idx);
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
        this.footerManager.update();
        this.sidebarRenderer.render(gameState.selectedPlayerForSidebar);
      }
    });
  }

  getUiManager() {
    return this.uiManager;
  }

  isMobile() {
    return window.innerWidth <= 768;
  }
}