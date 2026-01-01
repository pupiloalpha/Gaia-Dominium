// logic-ai-coordinator.js - Coordenador Unificado de IA (Refatorado)
import { 
  gameState, 
  getCurrentPlayer, 
  getAllAIPlayers, 
  getActivePlayers,
  addActivityLog,
  getPendingNegotiationsForPlayer
} from '../state/game-state.js';

export class AICoordinator {
  constructor(gameLogic) {
    this.main = gameLogic;
    this.inProgress = false;
    this.healthMonitor = null;
    this.feedbackHistory = [];
    this.aiInstances = new Map();
    this.actionLogs = [];
    this.MAX_TURN_TIME = 30000;
    this.currentPhaseAction = null;
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
    const startTime = Date.now();

    try {
      const ai = this.aiInstances.get(gameState.currentPlayerIndex);
      
      if (!ai) {
        console.warn(`🤖 Instância de IA não encontrada para ${currentPlayer.name}`);
        this._handleAIError();
        return;
      }

      console.log(`🤖 Executando turno para ${currentPlayer.name}`);
      this.logAIAction(currentPlayer.id, `Iniciou turno na fase: ${gameState.currentPhase}`);
      
      // Executar baseado na fase atual
      await this._executePhaseAI(currentPlayer, ai);
      
      // Verificar conclusão
      await this._ensureAITurnCompletion(currentPlayer);
      
    } catch (error) {
      console.error('🤖 Erro no turno da IA:', error);
      this.logAIAction(currentPlayer.id, `Erro: ${error.message}`, 'error');
      this._handleAIError();
    } finally {
      this.inProgress = false;
      
      const elapsed = Date.now() - startTime;
      if (elapsed > this.MAX_TURN_TIME) {
        console.warn(`⚠️ Turno de IA demorou muito: ${elapsed}ms`);
        this.logAIAction(currentPlayer.id, `Turno demorado: ${elapsed}ms`, 'warning');
      }
    }
  }

  _shouldExecuteAI(player) {
    if (!player) return false;
    if (player.eliminated) return false;
    
    const isAI = player.type === 'ai' || player.isAI;
    if (!isAI) {
      console.log(`⏸️ Não é turno de IA. Jogador: ${player.name}`);
      return false;
    }
    
    return true;
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
        this.logAIAction(player.id, `Fase desconhecida: ${currentPhase}`, 'warning');
    }
  }

  async _handleIncomePhaseAI(player) {
    console.log(`🤖 ${player.name} na fase de renda`);
    this.logAIAction(player.id, 'Processando fase de renda');
    
    // A renda já foi aplicada pelo TurnLogic
    // Pequeno delay para simular processamento
    await this._delay(1500);
    
    // Avançar para fase de ações
    this.main.coordinator?.setCurrentPhase('acoes');
    this.logAIAction(player.id, 'Avançou para fase de ações');
    
    // Feedback visual
    this.main.showFeedback(`${player.name} (IA) processou renda e avançou para ações`, 'info');
  }

  async _handleActionsPhaseAI(player, ai) {
    console.log(`🤖 ${player.name} executando ações`);
    this.logAIAction(player.id, 'Iniciando fase de ações');
    
    // Executar até esgotar ações ou atingir limite
    let actionCount = 0;
    const maxActions = this.main.coordinator?.getRemainingActions() || 0;
    
    while (this.main.coordinator?.getRemainingActions() > 0 && actionCount < maxActions) {
      await this._delay(800);
      
      try {
        this.logAIAction(player.id, `Executando ação (${this.main.coordinator?.getRemainingActions()} restantes)`);
        await ai.takeTurn?.(gameState, window.uiManager);
        actionCount++;
      } catch (error) {
        console.error(`🤖 Erro na ação da IA:`, error);
        this.logAIAction(player.id, `Erro na ação: ${error.message}`, 'error');
        break;
      }
      
      // Atualizar contador de ações
      if (this.main.coordinator) {
        this.main.coordinator.consumeAction();
      }
    }
    
    // Avançar para negociação se ainda houver ações no coordinator
    if (this.main.coordinator?.getRemainingActions() <= 0) {
      this._setupNegotiationPhase();
      this.logAIAction(player.id, 'Finalizou ações, avançando para negociação');
    }
  }

  async _handleNegotiationPhaseAI(player, ai) {
    console.log(`🤖 ${player.name} na fase de negociação`);
    this.logAIAction(player.id, 'Iniciando fase de negociação');
    
    try {
      // Processar propostas pendentes
      const pendingNegotiations = getPendingNegotiationsForPlayer(player.id);
      if (pendingNegotiations.length > 0) {
        this.logAIAction(player.id, `Processando ${pendingNegotiations.length} proposta(s) pendente(s)`);
        
        if (ai.processPendingNegotiations) {
          await ai.processPendingNegotiations(gameState);
          this.logAIAction(player.id, 'Propostas processadas');
        }
        
        await this._delay(1000);
      }
      
      // Enviar proposta se possível
      if (this.main.coordinator?.getRemainingActions() > 0 && player.resources.ouro >= 1) {
        await this._sendAINegotiationProposal(ai, player);
      } else {
        this.logAIAction(player.id, 'Sem ações ou recursos para negociar');
      }
      
      // Consumir ação de negociação
      if (this.main.coordinator?.getRemainingActions() > 0) {
        this.main.coordinator.consumeAction();
      }
      
    } catch (error) {
      console.error(`🤖 Erro na negociação da IA:`, error);
      this.logAIAction(player.id, `Erro na negociação: ${error.message}`, 'error');
    }
  }

  // ==================== CONCLUSÃO DE TURNO ====================

  async _ensureAITurnCompletion(player) {
    // Verificar se o turno deve ser finalizado
    const currentPhase = gameState.currentPhase;
    
    // Se não há mais ações na fase atual, avançar ou finalizar
    if (this.main.coordinator?.getRemainingActions() <= 0) {
      if (currentPhase === 'negociacao') {
        // Na fase de negociação, finalizar turno
        console.log(`🤖 ${player.name} finalizando turno`);
        this.logAIAction(player.id, 'Finalizando turno da IA');
        
        if (this.main.turnLogic?.handleEndTurn) {
          await this.main.turnLogic.handleEndTurn();
        }
      } else if (currentPhase === 'acoes') {
        // Na fase de ações, avançar para negociação
        this._setupNegotiationPhase();
      }
    } else {
      this.logAIAction(player.id, `Ainda há ${this.main.coordinator?.getRemainingActions()} ação(ões)`);
    }
  }

  _setupNegotiationPhase() {
    if (this.main.coordinator) {
      this.main.coordinator.setCurrentPhase('negociacao');
      console.log(`🤖 ${getCurrentPlayer()?.name} entrou na fase de negociação`);
      this.logAIAction(getCurrentPlayer()?.id, 'Entrou na fase de negociação');
      
      // Disparar execução da IA na nova fase
      setTimeout(() => {
        this.checkAndExecuteAITurn();
      }, 1000);
    }
  }

  // ==================== GERENCIAMENTO DE NEGOCIAÇÃO ====================

  async _sendAINegotiationProposal(ai, player) {
    const target = this._findNegotiationTarget(player);
    if (!target) {
      console.log(`🤖 ${player.name} não encontrou alvo para negociação`);
      this.logAIAction(player.id, 'Nenhum alvo adequado para negociação encontrado');
      return;
    }

    console.log(`🤖 ${player.name} enviando proposta para ${target.name}`);
    this.logAIAction(player.id, `Enviando proposta para ${target.name}`);
    
    // Usar o serviço de negociação da IA
    if (ai.negotiationService?._createProposal) {
      const proposal = ai.negotiationService._createProposal(player, target, gameState);
      if (proposal && ai.negotiationService._sendProposal) {
        await ai.negotiationService._sendProposal(proposal, target.id, gameState);
        this.logAIAction(player.id, `Proposta enviada para ${target.name}`);
        
        // Feedback visual
        this.main.showFeedback(`${player.name} (IA) enviou proposta para ${target.name}`, 'info');
      }
    }
  }

  _findNegotiationTarget(currentPlayer) {
    const otherPlayers = gameState.players.filter(p => 
      p.id !== currentPlayer.id && 
      !p.eliminated
    );
    
    if (otherPlayers.length === 0) return null;
    
    // Priorizar jogadores com menos PV ou recursos interessantes
    return otherPlayers.sort((a, b) => {
      // Primeiro por PV (menos PV primeiro)
      if (a.victoryPoints !== b.victoryPoints) {
        return a.victoryPoints - b.victoryPoints;
      }
      // Depois por quantidade de ouro (menos ouro primeiro)
      return (a.resources.ouro || 0) - (b.resources.ouro || 0);
    })[0];
  }

  // ==================== CONTROLE DE SAÚDE ====================

  startHealthMonitor() {
    if (this.healthMonitor) clearInterval(this.healthMonitor);
    
    this.healthMonitor = setInterval(() => {
      if (!this.inProgress) return;
      
      // Verificar se a IA está travada
      const recentErrors = this.feedbackHistory.filter(f => 
        f.type === 'error' && (Date.now() - f.timestamp) < 10000
      );
      
      if (recentErrors.length > 3) {
        console.warn('⚠️ IA com muitos erros recentes - forçando término');
        this.logAIAction(gameState.currentPlayerIndex, 'Muitos erros, forçando término', 'error');
        this.forceAIEndTurn();
      }
    }, 5000);
  }

  // ==================== LOGGING DE IA ====================

  logAIAction(playerId, message, type = 'info') {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;
    
    const logEntry = {
      timestamp: Date.now(),
      playerId,
      playerName: player.name,
      message,
      type,
      phase: gameState.currentPhase,
      turn: gameState.turn,
      actionsLeft: this.main.coordinator?.getRemainingActions() || 0
    };
    
    this.actionLogs.unshift(logEntry);
    if (this.actionLogs.length > 50) this.actionLogs.pop();
    
    // Registrar no log de atividades global se for importante
    if (type === 'error' || message.includes('importante') || message.includes('finalizou')) {
      addActivityLog({
        type: 'ai',
        playerName: player.name,
        action: 'ação de IA',
        details: message,
        turn: gameState.turn,
        isEvent: type === 'error'
      });
    }
    
    console.log(`🤖 [${type.toUpperCase()}] ${player.name}: ${message}`);
  }

  // ==================== CONTROLE DE ERROS ====================

  _handleAIError() {
    console.log('🤖 Lidando com erro da IA');
    this.logAIAction(gameState.currentPlayerIndex, 'Erro detectado, forçando término', 'error');
    this.forceAIEndTurn();
  }

  forceAIEndTurn() {
    console.log('🚨 Forçando término do turno da IA');
    this.inProgress = false;
    
    if (this.main.turnLogic?.handleEndTurn) {
      this.main.turnLogic.handleEndTurn();
    }
    
    this.logAIAction(gameState.currentPlayerIndex, 'Turno forçado a terminar', 'warning');
  }

  captureFeedback(message, type) {
    this.feedbackHistory.push({ message, type, timestamp: Date.now() });
    if (this.feedbackHistory.length > 10) this.feedbackHistory.shift();
    
    console.log(`📝 Feedback IA [${type}]: ${message}`);
  }

  // ==================== UTILITÁRIOS ====================

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
        difficulty: ai.difficulty,
        personality: ai.personality?.name,
        actionCount: this.actionLogs.filter(log => log.playerId === ai.playerId).length
      } : null,
      actionLogs: this.actionLogs.length,
      recentActions: this.actionLogs.slice(0, 3),
      totalAIInstances: this.aiInstances.size
    };
  }
}