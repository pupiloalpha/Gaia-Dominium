// logic-ai-coordinator.js - Coordenador Unificado de IA
import { 
  gameState, getCurrentPlayer, getAllAIPlayers, getActivePlayers
} from '../state/game-state.js';

export class AICoordinator {
  constructor(gameLogic) {
    this.main = gameLogic;
    this.inProgress = false;
    this.healthMonitor = null;
    this.feedbackHistory = [];
    this.aiInstances = new Map();
    this.MAX_TURN_TIME = 30000;
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

  _createAIBrain(playerId, difficulty) {
    // Usar o AIBrain existente do sistema
    const ai = window.aiSystem?.createAI?.(playerId, difficulty) || {
      playerId,
      difficulty,
      takeTurn: async () => { console.log('🤖 Turno de IA simulado'); }
    };
    
    return ai;
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
      
      // Executar baseado na fase atual
      await this._executePhaseAI(currentPlayer, ai);
      
      // Verificar conclusão
      await this._ensureAITurnCompletion(currentPlayer);
      
    } catch (error) {
      console.error('🤖 Erro no turno da IA:', error);
      this._handleAIError();
    } finally {
      this.inProgress = false;
      
      const elapsed = Date.now() - startTime;
      if (elapsed > this.MAX_TURN_TIME) {
        console.warn(`⚠️ Turno de IA demorou muito: ${elapsed}ms`);
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
    }
  }

  async _handleIncomePhaseAI(player) {
    console.log(`🤖 ${player.name} na fase de renda`);
    await this._delay(1000);
    
    // Avançar para fase de ações
    this.main.coordinator?.setCurrentPhase('acoes');
  }

  async _handleActionsPhaseAI(player, ai) {
  const totalActions = this.main.coordinator?.getRemainingActions() || 0;
  
  // Mostrar início das ações
  this._showAIFeedback(`🤖 ${player.name} começando ${totalActions} ação(ões)...`, 'info');
  
  let actionCount = 0;
  
  // Executar ações enquanto houver disponíveis
  while (this.main.coordinator?.getRemainingActions() > 0) {
    actionCount++;
    
    // Pequeno delay entre ações
    await this._delay(1200);
    
    try {
      // Mostrar ação atual
      this._showAIFeedback(`🤖 ${player.name} executando ação ${actionCount}/${totalActions}`, 'info');
      
      // Executar ação
      const success = await ai.executeActionPhase?.(window.gameState, window.uiManager);
      
      if (success !== false) {
        // Consumir ação
        this.main.coordinator?.consumeAction();
        
        // Atualizar UI após cada ação
        this._updateUI();
        
        // Feedback da ação
        this._showAIFeedback(`✅ ${player.name} completou ação ${actionCount}`, 'success');
      } else {
        this._showAIFeedback(`⚠️ ${player.name} não pôde executar ação ${actionCount}`, 'warning');
        break;
      }
      
    } catch (error) {
      console.error(`🤖 Erro na ação da IA:`, error);
      this._showAIFeedback(`❌ Erro na ação de ${player.name}`, 'error');
      break;
    }
  }
  
  // Feedback final
  if (actionCount > 0) {
    this._showAIFeedback(`✅ ${player.name} completou ${actionCount} ação(ões)`, 'success');
  } else {
    this._showAIFeedback(`⚠️ ${player.name} não executou ações`, 'warning');
  }
  
  // Avançar para negociação se ainda houver ações
  if (this.main.coordinator?.getRemainingActions() > 0) {
    this._setupNegotiationPhase();
  }
}

  async _handleNegotiationPhaseAI(player, ai) {
    console.log(`🤖 ${player.name} na fase de negociação`);
    
    try {
      // Processar propostas pendentes
      if (ai.processPendingNegotiations) {
        await ai.processPendingNegotiations(gameState);
        await this._delay(1000);
      }
      
      // Enviar proposta se possível
      if (this.main.coordinator?.getRemainingActions() > 0 && player.resources.ouro >= 1) {
        await this._sendAINegotiationProposal(ai, player);
      }
      
    } catch (error) {
      console.error(`🤖 Erro na negociação da IA:`, error);
    }
  }

  // ==================== GERENCIAMENTO DE NEGOCIAÇÃO ====================

  async _sendAINegotiationProposal(ai, player) {
    const target = this._findNegotiationTarget(player);
    if (!target) {
      console.log(`🤖 ${player.name} não encontrou alvo para negociação`);
      return;
    }

    console.log(`🤖 ${player.name} enviando proposta para ${target.name}`);
    
    // Usar o serviço de negociação da IA
    if (ai.negotiationService?._createProposal) {
      const proposal = ai.negotiationService._createProposal(player, target, gameState);
      if (proposal && ai.negotiationService._sendProposal) {
        await ai.negotiationService._sendProposal(proposal, target.id, gameState);
      }
    }
  }

  _findNegotiationTarget(currentPlayer) {
    const otherPlayers = gameState.players.filter(p => 
      p.id !== currentPlayer.id && 
      p.resources.ouro >= 1 &&
      !p.eliminated
    );
    
    if (otherPlayers.length === 0) return null;
    
    // Priorizar jogadores com menos PV
    return otherPlayers.sort((a, b) => a.victoryPoints - b.victoryPoints)[0];
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
        this.forceAIEndTurn();
      }
    }, 5000);
  }

  // ==================== CONCLUSÃO DE TURNO ====================

  async _ensureAITurnCompletion(player) {
    // Se não há mais ações, finalizar turno
    if (this.main.coordinator?.getRemainingActions() <= 0) {
      console.log(`🤖 ${player.name} finalizando turno`);
      
      if (this.main.turnLogic?.handleEndTurn) {
        await this.main.turnLogic.handleEndTurn();
      }
    }
  }

  _setupNegotiationPhase() {
    this.main.coordinator?.setCurrentPhase('negociacao');
    this.main.coordinator?.consumeAction(); // Usar a ação de negociação
    
    console.log(`🤖 ${getCurrentPlayer()?.name} entrou na fase de negociação`);
  }

  // ==================== CONTROLE DE ERROS ====================

  _handleAIError() {
    console.log('🤖 Lidando com erro da IA');
    this.forceAIEndTurn();
  }

  forceAIEndTurn() {
    console.log('🚨 Forçando término do turno da IA');
    this.inProgress = false;
    
    if (this.main.turnLogic?.handleEndTurn) {
      this.main.turnLogic.handleEndTurn();
    }
  }

  captureFeedback(message, type) {
    this.feedbackHistory.push({ message, type, timestamp: Date.now() });
    if (this.feedbackHistory.length > 10) this.feedbackHistory.shift();
    
    console.log(`📝 Feedback IA [${type}]: ${message}`);
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
  if (window.addActivityLog) {
    window.addActivityLog({
      type: 'ai_action',
      playerName: '🤖 IA',
      action: message,
      details: '',
      turn: window.gameState?.turn || 0,
      isEvent: true
    });
  }
  
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
  }
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
        difficulty: ai.difficulty
      } : null,
      feedbackHistory: this.feedbackHistory.length,
      totalAIInstances: this.aiInstances.size
    };
  }
}
