// logic-turn.js - Gerenciador de Turnos (ATUALIZADO)
import { 
  gameState, 
  addActivityLog, 
  getCurrentPlayer,
  getPendingNegotiationsForPlayer,
  saveGame,
  getActivePlayers,
  getNextActivePlayer
} from '../state/game-state.js';
import { GAME_CONFIG } from '../state/game-config.js';

export class TurnLogic {
  constructor(gameLogic) {
    this.main = gameLogic;
    this.gameEnded = false;
    this.lastPlayerType = null; // Rastrear tipo do último jogador
  }

  // ==================== CONTROLE DE TURNOS ====================

  async handleEndTurn() {
    if (this.gameEnded) {
      this.main.showFeedback('O jogo já terminou!', 'warning');
      return;
    }
    
    const currentPlayer = getCurrentPlayer();

    // Verificar se jogador está eliminado
    if (currentPlayer.eliminated) {
      console.log(`🔄 ${currentPlayer.name} está eliminado, pulando turno.`);
      this._advanceToNextPlayer(currentPlayer);
      return;
    }
    
    // Verificar pendências na negociação (apenas humanos)
    if (!(currentPlayer.type === 'ai' || currentPlayer.isAI)) {
      const pendingNegotiations = getPendingNegotiationsForPlayer(currentPlayer.id);
      
      if (pendingNegotiations.length > 0) {
        const shouldRespond = await this.main.showConfirm(
          '📨 Propostas Pendentes',
          `Você tem ${pendingNegotiations.length} proposta(s) de negociação pendente(s).\n\nDeseja respondê-las agora?`
        );
        
        if (shouldRespond) {
          if (window.uiManager?.negotiation?.showPendingNegotiationsModal) {
            window.uiManager.negotiation.showPendingNegotiationsModal();
          }
          return; // Aguardar resposta
        }
      }
    }
    
    // Finalizar turno e avançar
    this._finalizeTurn(currentPlayer);
  }

  // ==================== FINALIZAÇÃO DE TURNO ====================

  _finalizeTurn(currentPlayer) {
    // Armazenar tipo do jogador atual
    this.lastPlayerType = currentPlayer.type === 'ai' || currentPlayer.isAI ? 'ai' : 'human';
    
    console.log(`⏹️ Finalizando turno de ${currentPlayer.name} (${this.lastPlayerType})`);
    
    addActivityLog({
      type: 'turn',
      playerName: 'SISTEMA',
      action: 'Turno finalizado',
      details: currentPlayer.name,
      turn: gameState.turn
    });
    
    // Resetar bônus de turno (facções)
    if (this.main.factionLogic) {
      this.main.factionLogic.resetTurnBonuses(currentPlayer);
    }

    // Avançar para próximo jogador
    this._advanceToNextPlayer(currentPlayer);
  }

  _advanceToNextPlayer(currentPlayer) {
    // Obter próximo jogador ativo
    const nextPlayerIndex = getNextActivePlayer?.(gameState.currentPlayerIndex) || 
      (gameState.currentPlayerIndex + 1) % gameState.players.length;
    
    // Verificar vitória por eliminação
    if (nextPlayerIndex === gameState.currentPlayerIndex) {
      const activePlayers = getActivePlayers?.() || gameState.players.filter(p => !p.eliminated);
      
      if (activePlayers.length === 1) {
        const winner = activePlayers[0];
        this._declareVictory(winner);
        return;
      }
    }

    // Atualizar jogador atual
    gameState.currentPlayerIndex = nextPlayerIndex;
    
    // Incrementar turno se voltou ao jogador 0
    if (gameState.currentPlayerIndex === 0) {
      gameState.turn += 1;
      this._handleGlobalEvents();
    }

    // Resetar estado para novo jogador
    this._resetPlayerTurn();
    
    const newPlayer = getCurrentPlayer();
    
    // Se o jogador está eliminado, pular turno novamente
    if (newPlayer.eliminated) {
      this.main.showFeedback(`${newPlayer.name} está eliminado. Pulando turno...`, 'info');
      setTimeout(() => this._advanceToNextPlayer(newPlayer), 1000);
      return;
    }
    
    // Aplicar renda ao novo jogador
    this.applyIncome(newPlayer);

    addActivityLog({
      type: 'turn',
      playerName: 'SISTEMA',
      action: 'Turno iniciado',
      details: newPlayer.name,
      turn: gameState.turn
    });
    
    // Verificar vitória novamente
    this.checkVictory();
    
    // Notificar mudança de jogador
    this._notifyPlayerChange(currentPlayer, newPlayer);
    
    // GATILHO PARA IA
    if (!this.gameEnded) {
      setTimeout(() => {
        if (newPlayer && !newPlayer.eliminated && (newPlayer.type === 'ai' || newPlayer.isAI)) {
          console.log(`🤖 Iniciando turno da IA: ${newPlayer.name}`);
          
          // Pequeno delay antes de iniciar IA
          setTimeout(() => {
            if (this.main.aiCoordinator) {
              this.main.aiCoordinator.checkAndExecuteAITurn();
            }
          }, 2000);
        }
      }, 1000);
    }
    
    saveGame();
  }

  // ==================== RESET DE TURNO ====================

  _resetPlayerTurn() {
    const newPlayer = getCurrentPlayer();
    const playerId = newPlayer?.id;
    
    console.log(`🔄 Resetando turno para ${newPlayer?.name || 'jogador desconhecido'}`);
    
    // Resetar fase para 'renda'
    this.main.coordinator?.setCurrentPhase('renda');
    
    // Resetar ações especificamente para este jogador
    if (this.main.coordinator?.phaseManager) {
      this.main.coordinator.phaseManager.resetActions(playerId);
    }
    
    // Limpar seleção de região
    this.main.coordinator?.clearRegionSelection();
    
    // Resetar estado da negociação
    if (gameState) {
      gameState.selectedRegionId = null;
      gameState.pendingNegotiation = null;
    }
    
    console.log(`✅ Turno resetado: ${newPlayer?.name} tem ${this.main.coordinator?.getRemainingActions()} ações`);
  }

  // ==================== NOTIFICAÇÃO DE MUDANÇA ====================

  _notifyPlayerChange(oldPlayer, newPlayer) {
    // Atualizar UI imediatamente
    this._updateGameUI();
    
    // Feedback específico baseado no tipo de jogador
    if (newPlayer.type === 'ai' || newPlayer.isAI) {
      this.main.showFeedback(`🤖 Turno de ${newPlayer.name}`, 'info');
    } else {
      this.main.showFeedback(`🎮 Sua vez, ${newPlayer.name}!`, 'success');
      
      // Se vinha de uma IA, garantir que ações estão disponíveis
      if (this.lastPlayerType === 'ai') {
        const actionsLeft = this.main.coordinator?.getRemainingActions() || 0;
        this.main.showFeedback(`Você tem ${actionsLeft} ações disponíveis`, 'info');
      }
    }
  }

  // ==================== ATUALIZAÇÃO DE UI ====================

  _updateGameUI() {
    // Atualização imediata da interface
    if (window.uiManager) {
      window.uiManager.updateUI();
      
      // Forçar atualização do footer
      if (window.uiManager.gameManager?.updateFooter) {
        setTimeout(() => {
          window.uiManager.gameManager.updateFooter();
          
          // Atualizar também o indicador de fase
          const phaseIndicator = document.getElementById('phaseIndicator');
          if (phaseIndicator && this.main.coordinator) {
            const phaseName = this.main.coordinator.phaseManager?.getPhaseDisplayName();
            if (phaseName) {
              phaseIndicator.textContent = phaseName;
            }
          }
        }, 50);
      }
    }
  }

  _disableGameActions() {
    if (window.uiManager) {
      const actionButtons = [
        'actionExplore', 'actionCollect', 'actionBuild', 
        'actionNegotiate', 'endTurnBtn'
      ];
      
      actionButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
          btn.disabled = true;
          btn.classList.add('opacity-50', 'cursor-not-allowed');
        }
      });
      
      this._updateGameUI();
    }
  }

  // ==================== DEBUG ====================

  getDebugInfo() {
    return {
      gameEnded: this.gameEnded,
      currentTurn: gameState.turn,
      currentPlayer: getCurrentPlayer()?.name,
      activePlayers: getActivePlayers?.()?.length || gameState.players.filter(p => !p.eliminated).length
    };
  }
}
