// ui-ai-feedback.js - Modal de Feedback para Turnos da IA com Bloqueio de Interações
// Exibe as ações e notificações dos jogadores IA em tempo real e bloqueia interações na UI.

import { getIcon, renderPlayerIcon } from './icons.js';

class AIFeedbackModal {
  constructor() {
    this.container = null;
    this.overlay = null;
    this.isBlockedState = false;
    this.currentAIPlayer = null;
    this.actionsHistory = [];
    this.hideTimeout = null;
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initContainer());
    } else {
      this.initContainer();
    }
  }

  initContainer() {
    if (document.getElementById('aiFeedbackOverlay')) {
      this.overlay = document.getElementById('aiFeedbackOverlay');
      return;
    }

    this.overlay = document.createElement('div');
    this.overlay.id = 'aiFeedbackOverlay';
    this.overlay.className = 'hidden fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm select-none transition-opacity duration-300';
    
    this.overlay.addEventListener('click', (e) => e.stopPropagation());
    this.overlay.addEventListener('mousedown', (e) => e.stopPropagation());
    this.overlay.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: false });

    this.overlay.innerHTML = `
      <div id="aiFeedbackModalCard" class="relative w-full max-w-lg bg-gray-900 border-2 border-purple-500/40 rounded-2xl shadow-2xl p-6 text-white transform transition-all duration-300 scale-95 opacity-0">
        <div class="absolute -top-px left-10 right-10 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
        <div class="flex items-center gap-4 mb-4 pb-4 border-b border-white/10">
          <div class="relative">
            <div id="aiAvatarBadge" class="w-14 h-14 rounded-2xl bg-purple-900/80 border-2 border-purple-400/60 flex items-center justify-center text-3xl shadow-lg ring-4 ring-purple-500/20 animate-pulse">
              ${getIcon('robo', { size: 32 })}
            </div>
            <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-yellow-500 border-2 border-gray-900 flex items-center justify-center text-[10px] text-gray-950 font-bold shadow">
              IA
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <h3 id="aiPlayerName" class="text-xl font-bold text-white truncate tracking-wide">
                Jogador IA
              </h3>
              <span id="aiTurnPhaseBadge" class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-800/80 border border-purple-400/40 text-purple-200 shadow-sm flex items-center gap-1.5 whitespace-nowrap">
                <span class="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
                <span id="aiTurnPhaseText">Fase de Ações</span>
              </span>
            </div>
            <div class="flex items-center gap-2 mt-1">
              <span id="aiFactionBadge" class="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-300 font-medium truncate flex items-center gap-1">
                Facção
              </span>
              <span id="aiTurnCounterBadge" class="text-xs text-yellow-400/90 font-medium">
                Turno 1
              </span>
            </div>
          </div>
        </div>

        <div class="mb-4 bg-purple-950/60 border border-purple-500/30 rounded-xl p-4 shadow-inner relative overflow-hidden">
          <div class="flex items-start gap-3">
            <div id="aiCurrentActionIcon" class="w-10 h-10 rounded-xl bg-purple-800/70 border border-purple-400/40 flex items-center justify-center text-purple-300 flex-shrink-0 mt-0.5 shadow">
              ${getIcon('lightning', { size: 22 })}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-0.5">
                <span class="text-xs uppercase tracking-wider text-purple-300 font-semibold flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
                  Ação Atual
                </span>
                <span id="aiActionsLeftCount" class="text-xs text-yellow-300 font-bold"></span>
              </div>
              <h4 id="aiCurrentActionTitle" class="text-base font-bold text-yellow-300 truncate">
                Planejando jogada...
              </h4>
              <p id="aiCurrentActionDesc" class="text-xs text-purple-100/90 mt-0.5 leading-relaxed">
                A IA está analisando o tabuleiro e decidindo o próximo movimento.
              </p>
            </div>
          </div>
          <div class="mt-3 w-full bg-purple-900/50 rounded-full h-1.5 overflow-hidden">
            <div class="bg-gradient-to-r from-purple-400 via-yellow-400 to-purple-400 h-1.5 rounded-full animate-pulse w-full"></div>
          </div>
        </div>

        <div class="mb-4">
          <div class="flex items-center justify-between mb-2 px-1">
            <span class="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              ${getIcon('scroll', { size: 14 })}
              Ações Realizadas na Rodada
            </span>
            <span id="aiActionsCount" class="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
              0 ações
            </span>
          </div>
          <div id="aiActionsFeed" class="max-h-44 overflow-y-auto space-y-1.5 pr-1 text-xs">
            <div class="text-center py-4 text-gray-400 italic text-xs">
              Aguardando início das ações...
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
          <div class="flex items-center gap-2">
            <span class="text-yellow-400 flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
            </span>
            <span class="text-gray-300 font-medium">Controles bloqueados durante a vez da IA</span>
          </div>
          <span class="text-[11px] text-purple-300/80 font-mono">Modo Espectador</span>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
  }

  _isGameOver() {
    return !!(window.gameLogic?.turnLogic?.gameEnded || (typeof gameState !== 'undefined' && gameState.gameStarted === false));
  }

  forceClose() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    if (this.overlay) {
      this.overlay.classList.add('hidden');
    }
    const card = document.getElementById('aiFeedbackModalCard');
    if (card) {
      card.classList.remove('scale-100', 'opacity-100');
      card.classList.add('scale-95', 'opacity-0');
    }
    this.isBlockedState = false;
    document.body.classList.remove('ai-turn-active');
  }

  close() {
    this.forceClose();
  }

  startAITurn(player) {
    if (this._isGameOver()) {
      console.log('🛑 Jogo finalizado. startAITurn cancelado.');
      this.forceClose();
      return;
    }
    if (!this.overlay) this.initContainer();
    if (!player) player = getCurrentPlayer();
    if (!player) return;

    this.currentAIPlayer = player;
    this.isBlockedState = true;
    this.actionsHistory = [];

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    document.body.classList.add('ai-turn-active');

    if (window.uiManager?.modals?.closeAllModals) {
      // Fechar todos os modais, mas excluir o overlay da IA para não causar recursão
      window.uiManager.modals.closeAllModals('aiFeedbackOverlay');
    }

    const nameEl = document.getElementById('aiPlayerName');
    const avatarBadge = document.getElementById('aiAvatarBadge');
    const factionBadge = document.getElementById('aiFactionBadge');
    const turnCounterBadge = document.getElementById('aiTurnCounterBadge');
    const turnPhaseText = document.getElementById('aiTurnPhaseText');
    const currentActionTitle = document.getElementById('aiCurrentActionTitle');
    const currentActionDesc = document.getElementById('aiCurrentActionDesc');
    const currentActionIcon = document.getElementById('aiCurrentActionIcon');
    const feed = document.getElementById('aiActionsFeed');
    const actionsCount = document.getElementById('aiActionsCount');
    const actionsLeftCount = document.getElementById('aiActionsLeftCount');

    if (nameEl) nameEl.textContent = player.name || 'Jogador IA';
    if (avatarBadge) {
      avatarBadge.innerHTML = renderPlayerIcon(player.icon, 32);
      if (player.color) {
        avatarBadge.style.borderColor = player.color;
        avatarBadge.style.boxShadow = `0 0 15px ${player.color}40`;
      }
    }
    if (factionBadge) {
      factionBadge.textContent = player.faction?.name || 'Sem Facção';
      if (player.color) {
        factionBadge.style.color = player.color;
      }
    }
    if (turnCounterBadge) {
      turnCounterBadge.textContent = `Turno ${gameState.turn || 1}`;
    }
    if (turnPhaseText) {
      turnPhaseText.textContent = this._formatPhaseName(gameState.currentPhase);
    }
    if (actionsLeftCount) {
      actionsLeftCount.textContent = `${gameState.actionsLeft ?? 2} Ações`;
    }

    if (currentActionTitle) currentActionTitle.textContent = 'Iniciando turno...';
    if (currentActionDesc) currentActionDesc.textContent = `${player.name} está analisando o estado atual de Gaia Dominium.`;
    if (currentActionIcon) currentActionIcon.innerHTML = getIcon('robo', { size: 22 });
    if (feed) feed.innerHTML = '';
    if (actionsCount) actionsCount.textContent = '0 ações';

    this.overlay.classList.remove('hidden');
    const card = document.getElementById('aiFeedbackModalCard');
    if (card) {
      requestAnimationFrame(() => {
        card.classList.remove('scale-95', 'opacity-0');
        card.classList.add('scale-100', 'opacity-100');
      });
    }

    if (window.uiManager?.gameManager?.footerManager?.updateFooter) {
      window.uiManager.gameManager.footerManager.updateFooter();
    }
  }

  addActionNotification(actionData) {
    if (this._isGameOver()) return;
    if (!this.overlay) this.initContainer();

    let title = 'Ação da IA';
    let description = '';
    let iconName = 'robo';
    let type = 'info';

    if (typeof actionData === 'string') {
      description = actionData;
      title = this._inferTitleFromMessage(actionData);
      iconName = this._inferIconFromMessage(actionData);
    } else if (actionData && typeof actionData === 'object') {
      title = actionData.title || title;
      description = actionData.description || actionData.message || '';
      iconName = actionData.icon || this._inferIconFromMessage(description);
      type = actionData.type || 'info';
    }

    const actionItem = {
      id: Date.now() + Math.random(),
      title,
      description,
      iconName,
      type,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    this.actionsHistory.push(actionItem);

    const currentActionTitle = document.getElementById('aiCurrentActionTitle');
    const currentActionDesc = document.getElementById('aiCurrentActionDesc');
    const currentActionIcon = document.getElementById('aiCurrentActionIcon');
    const actionsLeftCount = document.getElementById('aiActionsLeftCount');
    const turnPhaseText = document.getElementById('aiTurnPhaseText');

    if (currentActionTitle) currentActionTitle.textContent = title;
    if (currentActionDesc) currentActionDesc.textContent = description;
    if (currentActionIcon) {
      currentActionIcon.innerHTML = getIcon(iconName, { size: 22 }) || getIcon('lightning', { size: 22 });
    }
    if (actionsLeftCount && typeof gameState.actionsLeft !== 'undefined') {
      actionsLeftCount.textContent = `${gameState.actionsLeft} Ações`;
    }
    if (turnPhaseText) {
      turnPhaseText.textContent = this._formatPhaseName(gameState.currentPhase);
    }

    this._appendActionToFeed(actionItem);
  }

  _appendActionToFeed(actionItem) {
    const feed = document.getElementById('aiActionsFeed');
    const countEl = document.getElementById('aiActionsCount');
    if (!feed) return;

    if (countEl) {
      countEl.textContent = `${this.actionsHistory.length} ${this.actionsHistory.length === 1 ? 'ação' : 'ações'}`;
    }

    const itemEl = document.createElement('div');
    itemEl.className = 'flex items-center gap-2.5 p-2 rounded-lg bg-gray-800/80 border border-white/5 animate-fade-in transition-all';
    
    const colorMap = {
      explore: 'text-green-400 bg-green-950/60 border-green-500/30',
      dominate: 'text-yellow-400 bg-yellow-950/60 border-yellow-500/30',
      collect: 'text-amber-400 bg-amber-950/60 border-amber-500/30',
      build: 'text-blue-400 bg-blue-950/60 border-blue-500/30',
      dispute: 'text-red-400 bg-red-950/60 border-red-500/30',
      negotiation: 'text-indigo-400 bg-indigo-950/60 border-indigo-500/30',
      income: 'text-yellow-300 bg-yellow-950/60 border-yellow-500/30',
      endTurn: 'text-purple-300 bg-purple-950/60 border-purple-500/30'
    };

    const colorClass = colorMap[actionItem.type] || 'text-purple-300 bg-purple-950/60 border-purple-500/30';
    const iconSvg = getIcon(actionItem.iconName, { size: 16 }) || getIcon('bot', { size: 16 });

    itemEl.innerHTML = `
      <div class="w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 ${colorClass}">
        ${iconSvg}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-1">
          <span class="font-bold text-gray-200 truncate">${actionItem.title}</span>
          <span class="text-[10px] text-gray-400">${actionItem.time}</span>
        </div>
        <p class="text-[11px] text-gray-300 truncate">${actionItem.description}</p>
      </div>
    `;

    feed.appendChild(itemEl);
    feed.scrollTop = feed.scrollHeight;
  }

  updatePhase(phaseName) {
    if (this._isGameOver()) {
      this.forceClose();
      return;
    }
    const turnPhaseText = document.getElementById('aiTurnPhaseText');
    if (turnPhaseText) {
      turnPhaseText.textContent = this._formatPhaseName(phaseName);
    }
  }

  endAITurn(nextPlayer) {
    if (this._isGameOver()) {
      this.forceClose();
      return;
    }
    const card = document.getElementById('aiFeedbackModalCard');
    const currentActionTitle = document.getElementById('aiCurrentActionTitle');
    const currentActionDesc = document.getElementById('aiCurrentActionDesc');
    const currentActionIcon = document.getElementById('aiCurrentActionIcon');

    if (nextPlayer && (nextPlayer.type === 'ai' || nextPlayer.isAI) && !nextPlayer.eliminated) {
      if (currentActionTitle) currentActionTitle.textContent = 'Passando para a próxima IA...';
      if (currentActionDesc) currentActionDesc.textContent = `Turno concluído. Iniciando turno de ${nextPlayer.name}.`;
      if (currentActionIcon) currentActionIcon.innerHTML = getIcon('endTurn', { size: 22 });

      setTimeout(() => {
        this.startAITurn(nextPlayer);
      }, 700);
      return;
    }

    const playerName = nextPlayer ? nextPlayer.name : 'sua';
    if (currentActionTitle) currentActionTitle.textContent = 'Turno da IA finalizado!';
    if (currentActionDesc) currentActionDesc.textContent = `É a vez do jogador ${playerName}! Controles reabilitados.`;
    if (currentActionIcon) currentActionIcon.innerHTML = getIcon('check', { size: 22 });

    if (this.hideTimeout) clearTimeout(this.hideTimeout);
    this.hideTimeout = setTimeout(() => {
      if (card) {
        card.classList.remove('scale-100', 'opacity-100');
        card.classList.add('scale-95', 'opacity-0');
      }

      setTimeout(() => {
        if (this.overlay) {
          this.overlay.classList.add('hidden');
        }
        this.isBlockedState = false;
        document.body.classList.remove('ai-turn-active');

        if (window.uiManager?.updateUI) {
          window.uiManager.updateUI();
        } else if (window.uiManager?.gameManager?.updateUI) {
          window.uiManager.gameManager.updateUI();
        }
      }, 300);
    }, 900);
  }

  /**
   * Verifica se o overlay do modal está atualmente visível na tela.
   * Fonte de verdade visual para saber se o bloqueio deve ser considerado.
   */
  isVisible() {
    return !!(this.overlay && !this.overlay.classList.contains('hidden'));
  }

  /**
   * CORRIGIDO: só considera bloqueado se o overlay estiver realmente visível.
   * Isso evita que isBlockedState "preso" em true (por qualquer razão) impeça
   * o jogador humano de interagir após o turno da IA terminar.
   */
  isBlocked() {
    if (this._isGameOver()) return false;
    if (!this.isVisible()) return false;
    return this.isBlockedState;
  }

  _formatPhaseName(phase) {
    const names = {
      'renda': 'Fase de Renda',
      'acoes': 'Fase de Ações',
      'negociacao': 'Fase de Negociação'
    };
    return names[phase] || phase || 'Fase de Ações';
  }

  _inferTitleFromMessage(message) {
    const m = (message || '').toLowerCase();
    if (m.includes('dominada') || m.includes('dominar') || m.includes('domínio')) return 'Domínio de Região';
    if (m.includes('explorada') || m.includes('explorou') || m.includes('explorar')) return 'Exploração';
    if (m.includes('coletou') || m.includes('recolheu') || m.includes('coletar')) return 'Coleta de Recursos';
    if (m.includes('construiu') || m.includes('construir') || m.includes('estrutura')) return 'Construção';
    if (m.includes('disputa') || m.includes('disputar')) return 'Disputa Territorial';
    if (m.includes('negociação') || m.includes('proposta')) return 'Negociação';
    if (m.includes('renda')) return 'Renda Coletada';
    if (m.includes('finalizou') || m.includes('fim')) return 'Fim do Turno';
    return 'Ação da IA';
  }

  _inferIconFromMessage(message) {
    const m = (message || '').toLowerCase();
    if (m.includes('dominada') || m.includes('dominar') || m.includes('domínio')) return 'dominar';
    if (m.includes('explorada') || m.includes('explorou') || m.includes('explorar')) return 'explorar';
    if (m.includes('coletou') || m.includes('recolheu') || m.includes('coletar')) return 'coletar';
    if (m.includes('construiu') || m.includes('construir') || m.includes('estrutura')) return 'construir';
    if (m.includes('disputa') || m.includes('disputar')) return 'disputar';
    if (m.includes('negociação') || m.includes('proposta')) return 'negociar';
    if (m.includes('renda')) return 'moedas';
    if (m.includes('finalizou') || m.includes('fim')) return 'endTurn';
    return 'bot';
  }
}

export const aiFeedbackModal = new AIFeedbackModal();
if (typeof window !== 'undefined') {
  window.aiFeedbackModal = aiFeedbackModal;
}
export { AIFeedbackModal };