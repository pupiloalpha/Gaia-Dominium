// ui-ai-blocking.js - Gerenciador de bloqueio de UI durante turnos da IA

export class AIBlockingManager {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.isBlocked = false;
    this.blockOverlay = null;
    this.setupBlockingLayer();
  }

  setupBlockingLayer() {
    const existing = document.getElementById('aiBlockingOverlay');
    if (existing) {
      this.blockOverlay = existing;
      return;
    }

    this.blockOverlay = document.createElement('div');
    this.blockOverlay.id = 'aiBlockingOverlay';
    this.blockOverlay.className = 'hidden fixed inset-0 z-[103] cursor-not-allowed';
    this.blockOverlay.style.backgroundColor = 'transparent';
    this.blockOverlay.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
    });
    this.blockOverlay.addEventListener('contextmenu', (e) => {
      e.stopPropagation();
      e.preventDefault();
    });
    document.body.appendChild(this.blockOverlay);
  }

  blockUI(playerName = 'IA') {
    if (this.isBlocked) return;

    this.isBlocked = true;
    this.blockOverlay?.classList.remove('hidden');
    this.showAIThinkingModal(playerName);
    this.disableGameButtons();
    this.disableMapInteractions();

    console.log(`🔒 UI bloqueada para turno da IA: ${playerName}`);
  }

  unblockUI() {
    if (!this.isBlocked) return;

    this.isBlocked = false;
    this.blockOverlay?.classList.add('hidden');
    this.hideAIThinkingModal();
    this.enableGameButtons();
    this.enableMapInteractions();

    console.log('🔓 UI desbloqueada');
  }

  showAIThinkingModal(playerName) {
    const modal = document.getElementById('aiThinkingModal');
    const nameEl = document.getElementById('aiThinkingPlayerName');
    if (modal && nameEl) {
      nameEl.textContent = playerName;
      modal.classList.remove('hidden');
    }
  }

  hideAIThinkingModal() {
    const modal = document.getElementById('aiThinkingModal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  updateAIStatus(status, icon = '⏳') {
    const statusIcon = document.getElementById('aiStatusIcon');
    const statusText = document.getElementById('aiStatusText');
    if (statusIcon) statusIcon.textContent = icon;
    if (statusText) statusText.textContent = status;
  }

  disableGameButtons() {
    const actionButtons = ['actionExplore', 'actionCollect', 'actionBuild', 'actionNegotiate', 'endTurnBtn'];
    actionButtons.forEach((btnId) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
        btn.style.pointerEvents = 'none';
      }
    });

    const floatingButtons = ['manualIcon', 'manualIconNavbar', 'achievementsNavBtn', 'toggleAIDebug'];
    floatingButtons.forEach((btnId) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.style.pointerEvents = 'none';
        btn.classList.add('opacity-50');
      }
    });
  }

  enableGameButtons() {
    const actionButtons = ['actionExplore', 'actionCollect', 'actionBuild', 'actionNegotiate', 'endTurnBtn'];
    actionButtons.forEach((btnId) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        btn.style.pointerEvents = '';
      }
    });

    const floatingButtons = ['manualIcon', 'manualIconNavbar', 'achievementsNavBtn', 'toggleAIDebug'];
    floatingButtons.forEach((btnId) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.style.pointerEvents = '';
        btn.classList.remove('opacity-50');
      }
    });
  }

  disableMapInteractions() {
    const mapContainer = document.getElementById('gameMap');
    const boardContainer = document.getElementById('boardContainer');

    if (mapContainer) {
      mapContainer.style.pointerEvents = 'none';
      mapContainer.classList.add('opacity-60');
    }

    if (boardContainer) {
      boardContainer.style.pointerEvents = 'none';
    }

    document.querySelectorAll('[data-region-id]').forEach((cell) => {
      cell.style.pointerEvents = 'none';
    });
  }

  enableMapInteractions() {
    const mapContainer = document.getElementById('gameMap');
    const boardContainer = document.getElementById('boardContainer');

    if (mapContainer) {
      mapContainer.style.pointerEvents = '';
      mapContainer.classList.remove('opacity-60');
    }

    if (boardContainer) {
      boardContainer.style.pointerEvents = '';
    }

    document.querySelectorAll('[data-region-id]').forEach((cell) => {
      cell.style.pointerEvents = '';
    });
  }

  isUIBlocked() {
    return this.isBlocked;
  }
}
