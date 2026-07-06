// ui-ai-feedback.js - Sistema de Feedback não-interativo para turnos da IA
// Mostra apenas o que a IA está fazendo, SEM botões ou possibilidade de clique

import { gameState, getCurrentPlayer } from '../state/game-state.js';

class AIFeedbackDisplay {
  constructor() {
    this.container = null;
    this.messageQueue = [];
    this.isDisplaying = false;
    this.displayTimeout = null;
    this.initContainer();
  }

  initContainer() {
    // Criar container de feedback da IA (não-interativo)
    this.container = document.createElement('div');
    this.container.id = 'aiFeedbackContainer';
    this.container.className = `
      fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
      z-40 pointer-events-none
    `;
    this.container.innerHTML = `
      <div id="aiFeedbackBox" class="hidden">
        <div class="bg-gradient-to-b from-purple-900/95 to-purple-800/95 backdrop-blur-md border-2 border-purple-400/50 rounded-2xl shadow-2xl p-6 max-w-md">
          <div class="text-center">
            <div id="aiFeedbackIcon" class="text-5xl mb-3">🤖</div>
            <div id="aiFeedbackTitle" class="text-lg font-bold text-purple-200 mb-2"></div>
            <div id="aiFeedbackMessage" class="text-purple-100 text-sm leading-relaxed"></div>
            <!-- Sem botões! Apenas exibição -->
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.container);
  }

  /**
   * Exibe mensagem de IA (não-interativa)
   * Auto-desaparece após 3-4 segundos
   */
  showAIAction(title, message, icon = '🤖', duration = 3000) {
    const player = getCurrentPlayer();
    
    // Apenas mostrar durante turno de IA
    if (!player || (player.type !== 'ai' && !player.isAI)) {
      return;
    }

    const box = document.getElementById('aiFeedbackBox');
    const titleEl = document.getElementById('aiFeedbackTitle');
    const messageEl = document.getElementById('aiFeedbackMessage');
    const iconEl = document.getElementById('aiFeedbackIcon');

    iconEl.textContent = icon;
    titleEl.textContent = title;
    messageEl.textContent = message;

    // Mostrar com animação
    box.classList.remove('hidden');
    box.classList.add('animate-fade-in');

    // Auto-ocultar após duração
    if (this.displayTimeout) clearTimeout(this.displayTimeout);
    this.displayTimeout = setTimeout(() => {
      this.hideAIFeedback();
    }, duration);
  }

  /**
   * Ocultar feedback
   */
  hideAIFeedback() {
    const box = document.getElementById('aiFeedbackBox');
    if (box) {
      box.classList.add('hidden');
      box.classList.remove('animate-fade-in');
    }
  }

  /**
   * Sequência de ações da IA (fila de mensagens)
   */
  queueAIAction(title, message, icon = '🤖', duration = 2500) {
    this.messageQueue.push({ title, message, icon, duration });
    this.processQueue();
  }

  /**
   * Processar fila de mensagens
   */
  processQueue() {
    if (this.isDisplaying || this.messageQueue.length === 0) {
      return;
    }

    this.isDisplaying = true;
    const action = this.messageQueue.shift();

    this.showAIAction(action.title, action.message, action.icon, action.duration);

    // Aguardar duração para próxima mensagem
    setTimeout(() => {
      this.isDisplaying = false;
      this.processQueue();
    }, action.duration + 200);
  }

  /**
   * Limpar fila
   */
  clearQueue() {
    this.messageQueue = [];
    this.isDisplaying = false;
  }
}

// Exportar instância singleton
export const aiFeedback = new AIFeedbackDisplay();
export { AIFeedbackDisplay };
