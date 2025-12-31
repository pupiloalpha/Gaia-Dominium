// logic-ai-coordinator.js - Coordenador Unificado de IA (ATUALIZADO)
import { 
  gameState, getCurrentPlayer, getAllAIPlayers, getActivePlayers,
  addActivityLog
} from '../state/game-state.js';

export class AICoordinator {
  constructor(gameLogic) {
    this.main = gameLogic;
    this.inProgress = false;
    this.healthMonitor = null;
    this.feedbackHistory = [];
    this.aiInstances = new Map();
    this.MAX_TURN_TIME = 30000;
    this.currentAIActions = 0;
  }

  // ==================== INICIALIZAÇÃO ====================

  initialize(players) {
    players.forEach((player, index) => {
      if (player.type === 'ai' || player.isAI) {
        const ai = this._createAIBrain(index, player.aiDifficulty || 'medium');
        this.aiInstances.set(index, ai);
        console.log(`🤖 IA inicializada: ${player.name}`);
      }
    });
    
    this.startHealthMonitor();
  }

  // ==================== CONTROLE DE TURNOS ====================

  async checkAndExecuteAITurn() {
    if (this.inProgress) {
      console.log('⏸️ IA já está executando');
      return;
    }
    
    const currentPlayer = getCurrentPlayer();
    
    if (!this._shouldExecuteAI(currentPlayer)) {
      return;
    }

    this.inProgress = true;
    this.currentAIActions = 0;
    const startTime = Date.now();

    try {
      const ai = this.aiInstances.get(gameState.currentPlayerIndex);
      
      if (!ai) {
        console.warn(`🤖 Instância de IA não encontrada para ${currentPlayer.name}`);
        this._handleAIError();
        return;
      }

      console.log(`🤖 Executando turno para ${currentPlayer.name} (Fase: ${gameState.currentPhase})`);
      
      // Notificar início do turno da IA
      this._showAIFeedback(`🤖 Turno de ${currentPlayer.name} iniciado`, 'info');
      
      // Executar baseado na fase atual
      await this._executePhaseAI(currentPlayer, ai);
      
    } catch (error) {
      console.error('🤖 Erro no turno da IA:', error);
      this._handleAIError();
    } finally {
      this.inProgress = false;
      
      const elapsed = Date.now() - startTime;
      if (elapsed > this.MAX_TURN_TIME) {
        console.warn(`⚠️ Turno de IA demorou muito: ${elapsed}ms`);
      }
      
      // Atualizar UI final
      this._updateUI();
    }
  }

  // ==================== EXECUÇÃO POR FASE ====================

  async _executePhaseAI(player, ai) {
    const currentPhase = gameState.currentPhase;
    
    switch(currentPhase) {
      case 'renda':
        await this._handleIncomePhaseAI(player);
        break;
      case 'acoes':
        await this._handleActionsPhaseAI(player, ai);
        break;
      case 'negociacao':
        await this._handleNegotiationPhaseAI(player, ai);
        break;
      default:
        console.warn(`🤖 Fase desconhecida para IA: ${currentPhase}`);
    }
  }

  async _handleIncomePhaseAI(player) {
    this._showAIFeedback(`🤖 ${player.name} recebendo renda...`, 'info');
    await this._delay(1500);
    
    // Avançar para fase de ações
    this.main.coordinator?.setCurrentPhase('acoes');
    this._updateUI();
  }

  async _handleActionsPhaseAI(player, ai) {
    const totalActions = this.main.coordinator?.getRemainingActions() || 0;
    this._showAIFeedback(`🤖 ${player.name} executando ${totalActions} ações...`, 'info');
    
    // Executar ações enquanto houver disponíveis
    while (this.main.coordinator?.getRemainingActions() > 0) {
      this.currentAIActions++;
      
      // Pequeno delay entre ações
      await this._delay(1200);
      
      try {
        // Mostrar ação atual
        this._showAIFeedback(`🤖 ${player.name} executando ação ${this.currentAIActions}/${totalActions}`, 'info');
        
        // Executar ação
        const success = await ai.takeTurn?.(gameState, window.uiManager);
        
        if (success) {
          // Consumir ação
          this.main.coordinator?.consumeAction();
          
          // Atualizar UI após cada ação
          this._updateUI();
          
          // Feedback da ação
          this._showAIFeedback(`🤖 ${player.name} completou ação ${this.currentAIActions}`, 'success');
        } else {
          this._showAIFeedback(`🤖 ${player.name} não pôde executar ação`, 'warning');
          break;
        }
        
      } catch (error) {
        console.error(`🤖 Erro na ação da IA:`, error);
        this._showAIFeedback(`🤖 Erro na ação de ${player.name}`, 'error');
        break;
      }
    }
    
    // Avançar para negociação se ainda houver ações
    if (this.main.coordinator?.getRemainingActions() > 0) {
      this._setupNegotiationPhase();
    } else {
      this._showAIFeedback(`🤖 ${player.name} completou todas as ações`, 'success');
    }
  }

  async _handleNegotiationPhaseAI(player, ai) {
    this._showAIFeedback(`🤖 ${player.name} na fase de negociação`, 'info');
    
    try {
      // Processar propostas pendentes
      if (ai.processPendingNegotiations) {
        this._showAIFeedback(`🤖 ${player.name} processando propostas...`, 'info');
        await ai.processPendingNegotiations(gameState);
        await this._delay(1000);
      }
      
      // Enviar proposta se possível
      if (this.main.coordinator?.getRemainingActions() > 0 && player.resources.ouro >= 1) {
        this._showAIFeedback(`🤖 ${player.name} preparando proposta...`, 'info');
        await this._sendAINegotiationProposal(ai, player);
      }
      
      // Consumir ação de negociação
      if (this.main.coordinator?.getRemainingActions() > 0) {
        this.main.coordinator?.consumeAction();
      }
      
    } catch (error) {
      console.error(`🤖 Erro na negociação da IA:`, error);
    }
    
    this._showAIFeedback(`🤖 ${player.name} completou negociação`, 'success');
  }

  // ==================== FEEDBACK E UI ====================

  _showAIFeedback(message, type = 'info') {
    // Mostrar feedback na interface
    if (this.main?.showFeedback) {
      this.main.showFeedback(message, type);
    } else if (window.uiManager?.modals?.showFeedback) {
      window.uiManager.modals.showFeedback(message, type);
    }
    
    // Registrar no log de atividades
    addActivityLog({
      type: 'ai_action',
      playerName: '🤖 IA',
      action: message,
      details: '',
      turn: gameState.turn,
      isEvent: true
    });
    
    console.log(`🤖 [${type.toUpperCase()}] ${message}`);
  }

  _updateUI() {
    // Forçar atualização imediata da interface
    if (window.uiManager) {
      window.uiManager.updateUI();
      
      // Atualizar footer especificamente
      if (window.uiManager.gameManager?.updateFooter) {
        setTimeout(() => {
          window.uiManager.gameManager.updateFooter();
        }, 50);
      }
      
      // Atualizar mapa
      if (window.uiManager.mapManager?.renderRegions) {
        setTimeout(() => {
          window.uiManager.mapManager.renderRegions();
        }, 100);
      }
    }
  }

  // ==================== CONTROLE DE NEGOCIAÇÃO ====================

  _setupNegotiationPhase() {
    this._showAIFeedback(`🤖 Avançando para fase de negociação`, 'info');
    
    // Avançar fase
    this.main.coordinator?.setCurrentPhase('negociacao');
    
    // Resetar ações para 1 (apenas negociação)
    if (this.main.coordinator?.phaseManager) {
      this.main.coordinator.phaseManager.resetActions();
    }
    
    this._updateUI();
  }

  // ==================== CONCLUSÃO DE TURNO ====================

  async _ensureAITurnCompletion(player) {
    // Verificar se todas as ações foram usadas
    if (this.main.coordinator?.getRemainingActions() <= 0) {
      this._showAIFeedback(`🤖 ${player.name} finalizando turno...`, 'info');
      
      // Pequeno delay antes de finalizar
      await this._delay(1000);
      
      // Finalizar turno
      if (this.main.turnLogic?.handleEndTurn) {
        await this.main.turnLogic.handleEndTurn();
      }
    }
  }

  // ==================== UTILITÁRIOS ====================

  _shouldExecuteAI(player) {
    if (!player) return false;
    if (player.eliminated) return false;
    
    const isAI = player.type === 'ai' || player.isAI;
    if (!isAI) {
      console.log(`⏸️ Não é turno de IA. Jogador: ${player.name}`);
      return false;
    }
    
    // Verificar se o jogo está em andamento
    if (!gameState.gameStarted) {
      console.log('⏸️ Jogo não iniciado');
      return false;
    }
    
    return true;
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== DEBUG ====================

  getDebugInfo() {
    const currentPlayer = getCurrentPlayer();
    const ai = currentPlayer ? this.aiInstances.get(currentPlayer.id) : null;
    
    return {
      inProgress: this.inProgress,
      currentPlayer: currentPlayer?.name,
      currentPhase: gameState.currentPhase,
      actionsLeft: this.main.coordinator?.getRemainingActions() || 0,
      aiInstance: ai ? {
        playerId: ai.playerId,
        difficulty: ai.difficulty
      } : null,
      feedbackHistory: this.feedbackHistory.length,
      totalAIInstances: this.aiInstances.size
    };
  }
}
