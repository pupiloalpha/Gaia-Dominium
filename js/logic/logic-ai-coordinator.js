// logic-ai-coordinator.js - Coordenador de IA (Atualizado)
import { 
  gameState, getCurrentPlayer, getAllAIPlayers
} from '../state/game-state.js';

export class AICoordinator {
  constructor(gameLogic) {
    this.main = gameLogic;
    this.inProgress = false;
    this.healthMonitor = null;
    this.feedbackHistory = [];
  }

  startHealthMonitor() {
    if (this.healthMonitor) clearInterval(this.healthMonitor);
    
    this.healthMonitor = setInterval(() => {
      if (!this.inProgress) return;
      
      // Verificar se a IA está travada
      const recentActions = this.feedbackHistory.filter(f => 
        (Date.now() - f.timestamp) < 10000
      );
      
      const recentErrors = recentActions.filter(f => f.type === 'error');
      
      if (recentErrors.length > 3) {
        console.warn('⚠️ IA com muitos erros recentes - forçando término');
        this.forceAIEndTurn();
      }
    }, 5000);
  }

  async checkAndExecuteAITurn() {
    if (this.inProgress) {
      console.log('⏸️ IA já está executando');
      return;
    }
    
    const currentPlayer = getCurrentPlayer();
    
    // Verificar se jogador está eliminado
    if (!currentPlayer || currentPlayer.eliminated) {
      console.log(`🤖 Jogador ${currentPlayer?.name || 'desconhecido'} está eliminado, pulando turno.`);
      
      setTimeout(() => {
        if (this.main?.turnLogic?.handleEndTurn) {
          this.main.turnLogic.handleEndTurn();
        }
      }, 1000);
      return;
    }
    
    if (!(currentPlayer.type === 'ai' || currentPlayer.isAI)) {
      console.log(`⏸️ Não é turno de IA. Jogador: ${currentPlayer?.name}`);
      return;
    }

    this.inProgress = true;
    console.log(`🤖 Iniciando turno da IA: ${currentPlayer.name} (ID: ${currentPlayer.id})`);

    try {
      // Obter instância da IA
      const ai = this._getAIPlayerForCurrentPlayer();
      if (!ai) { 
        console.error(`🤖 IA não encontrada para ${currentPlayer.name}`);
        this.forceAIEndTurn(); 
        return; 
      }

      // Garantir que serviços estão inicializados
      if (!ai.negotiationService && this.main.gameLogic) {
        ai.initializeServices(this.main.gameLogic);
      }

      // Executar turno
      await ai.takeTurn(gameState, window.uiManager);
      
      // Verificar se precisa finalizar
      await this._ensureAICompletion(ai);
      
    } catch (e) {
      console.error('Erro crítico na IA:', e);
      this.forceAIEndTurn();
    } finally {
      this.inProgress = false;
    }
  }

  _getAIPlayerForCurrentPlayer() {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return null;
    
    const allAIs = getAllAIPlayers();
    if (!Array.isArray(allAIs)) return null;
    
    return allAIs.find(aiInstance => {
      const aiId = Number(aiInstance.playerId);
      const playerId = Number(currentPlayer.id);
      return aiId === playerId;
    });
  }
  
  async _ensureAICompletion(ai) {
    console.log(`🤖 Verificando conclusão do turno da IA...`);
    
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer || !(currentPlayer.type === 'ai' || currentPlayer.isAI)) {
      console.log(`🤖 Não é mais turno de IA, ignorando...`);
      return;
    }
    
    // Se ainda estiver na fase de negociação e sem ações, finalizar
    if (gameState.currentPhase === 'negociacao' && gameState.actionsLeft <= 0) {
      console.log(`🤖 ${currentPlayer.name} sem ações na negociação, finalizando...`);
      this.forceAIEndTurn();
      return;
    }
    
    // Se a IA não tem ouro para negociar, finalizar
    if (gameState.currentPhase === 'negociacao' && currentPlayer.resources.ouro < 1) {
      console.log(`🤖 ${currentPlayer.name} sem ouro para negociar, finalizando...`);
      this.forceAIEndTurn();
      return;
    }
    
    // Timeout de segurança
    setTimeout(() => {
      if (this.inProgress) {
        console.warn(`⚠️ Timeout de segurança para IA ${currentPlayer.name}, forçando término`);
        this.forceAIEndTurn();
      }
    }, 15000);
  }

  captureFeedback(message, type) {
    this.feedbackHistory.push({ message, type, timestamp: Date.now() });
    if (this.feedbackHistory.length > 10) this.feedbackHistory.shift();
    
    console.log(`📝 Feedback IA [${type}]: ${message}`);
  }

  forceAIEndTurn() {
    console.log('🚨 Forçando término do turno da IA');
    this.inProgress = false;
    
    if (this.main?.turnLogic?.handleEndTurn) {
      this.main.turnLogic.handleEndTurn();
    }
  }

  // ==================== DEBUG ====================
  
  getDebugInfo() {
    const currentPlayer = getCurrentPlayer();
    const ai = this._getAIPlayerForCurrentPlayer();
    
    return {
      inProgress: this.inProgress,
      currentPlayer: currentPlayer?.name,
      currentPhase: gameState.currentPhase,
      actionsLeft: gameState.actionsLeft,
      aiInstance: ai ? ai.getDebugInfo() : null,
      feedbackHistory: this.feedbackHistory.length
    };
  }
}