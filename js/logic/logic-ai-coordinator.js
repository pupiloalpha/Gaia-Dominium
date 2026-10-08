// logic-ai-coordinator.js - Coordenador de IA

import { 
  gameState, getCurrentPlayer, getAIPlayer, 
  getPendingNegotiationsForPlayer, setActiveNegotiation,
  clearActiveNegotiation, removePendingNegotiation,
  updateNegotiationStatus, resetNegotiationState,
  setNegotiationTarget, updateNegotiationResource,
  validateNegotiationState, getNegotiationValidationErrors,
  getAllAIPlayers
} from '../state/game-state.js';
import { GAME_CONFIG } from '../state/game-config.js';

export class AICoordinator {
  constructor(gameLogic) {
    this.main = gameLogic;
    this.inProgress = false;
    this.healthMonitor = null;
    this.feedbackHistory = [];
  }

  _getAIBlockingManager() {
    if (window.uiManager?.aiBlockingManager) {
      return window.uiManager.aiBlockingManager;
    }

    if (window.aiBlockingManager) {
      return window.aiBlockingManager;
    }

    return null;
  }

  _blockAIUI(playerName = 'IA') {
    const blocker = this._getAIBlockingManager();
    if (!blocker) return;

    blocker.blockUI(playerName);
    blocker.updateAIStatus('Avaliando estratégia', '🤖');
  }

  _unblockAIUI() {
    const blocker = this._getAIBlockingManager();
    if (!blocker) return;

    blocker.unblockUI();
  }

  startHealthMonitor() {
    if (this.healthMonitor) clearInterval(this.healthMonitor);
    this.healthMonitor = setInterval(() => this._checkHealth(), 5000);
  }

  _checkHealth() {
    if (!this.inProgress) return;
    const player = getCurrentPlayer();
    if (!player || (!player.type === 'ai' && !player.isAI)) return;

    // Se tiver erros recentes demais
    const errors = this.feedbackHistory.filter(f => f.type === 'error' && (Date.now() - f.timestamp) < 5000);
    if (errors.length > 3) {
        console.warn('⚠️ IA travada com erros. Forçando fim de turno.');
        this.forceAIEndTurn();
    }
  }

  // FUNÇÃO helper para obter IA correta
_getAIPlayerForCurrentPlayer() {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return null;
    
    console.log(`🔍 Buscando IA para jogador ${currentPlayer.id} (${currentPlayer.name})`);
    
    // Usar a função importada
    let allAIs = [];
    if (typeof getAllAIPlayers === 'function') {
        allAIs = getAllAIPlayers();
        console.log(`🤖 ${allAIs.length} IA(s) disponíveis via função`);
    } else if (window.aiInstances) {
        allAIs = window.aiInstances;
        console.log(`🤖 ${allAIs.length} IA(s) disponíveis via window`);
    }
    
    // Log detalhado das IAs disponíveis
    console.log('📋 Lista de IAs disponíveis:', allAIs.map(ai => ({
        id: ai.playerId,
        name: ai.personality?.name || 'Sem nome',
        difficulty: ai.difficulty
    })));
    
    // Buscar IA correspondente
    const ai = allAIs.find(aiInstance => {
        const aiId = Number(aiInstance.playerId);
        const playerId = Number(currentPlayer.id);
        console.log(`🔍 Comparando: IA ${aiId} vs Jogador ${playerId}`);
        return aiId === playerId;
    });
    
    if (!ai) {
        console.warn(`🤖 IA não encontrada para jogador ${currentPlayer.id} (${currentPlayer.name})`);
        console.log('Tipo do jogador:', currentPlayer.type, 'isAI:', currentPlayer.isAI);
    } else {
        console.log(`✅ IA encontrada: ${ai.personality?.name || 'Sem nome'}`);
    }
    
    return ai;
}
  
async checkAndExecuteAITurn() {
    if (this.inProgress) return;
    const player = getCurrentPlayer();

  // Verificar se jogador está eliminado
  if (!player || player.eliminated) {
    console.log(`🤖 Jogador ${player?.name || 'desconhecido'} está eliminado, pulando turno.`);
    
    // Pular turno automaticamente
    setTimeout(() => {
      if (this.main?.turnLogic?.handleEndTurn) {
        this.main.turnLogic.handleEndTurn();
      }
    }, 1000);
    return;
  }
    
    if (!(player.type === 'ai' || player.isAI)) return;

    this.inProgress = true;
    this._blockAIUI(player.name);
    console.log(`🤖 Iniciando loop IA para ${player.name} (ID: ${player.id})`);

    try {
        // USAR a nova função helper
        const ai = this._getAIPlayerForCurrentPlayer();
        if (!ai) { 
            console.error(`🤖 IA não encontrada para ${player.name}`);
            this.forceAIEndTurn(); 
            return; 
        }

        await this._runAILoop(ai); // Passar a instância da IA
    } catch (e) {
        console.error('Erro crítico IA:', e);
        this.forceAIEndTurn();
    } finally {
        this.inProgress = false;
        this._unblockAIUI();
    }
}
