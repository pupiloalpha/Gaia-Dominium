// logic-turn.js - Gerenciador de Turnos Simplificado (Refatorado)
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
    this.incomeApplied = false;
    this.turnTimeout = null;
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
    
    const currentPhase = gameState.currentPhase;
    console.log(`⏹️ TurnLogic: Finalizando turno na fase: ${currentPhase}`);
    
    // Processar baseado na fase atual
    const result = await this._processPhaseCompletion(currentPhase, currentPlayer);
    
    if (result === 'continue') {
      // Avançar para próxima fase
      this._advanceToNextPhase(currentPhase);
    } else if (result === 'complete') {
      // Finalizar turno completamente
      this._finalizePlayerTurn(currentPlayer);
    }
  }

  async _processPhaseCompletion(phase, player) {
    switch(phase) {
      case 'renda':
        // Sempre avançar da renda para ações
        return 'continue';
        
      case 'acoes':
        // Verificar se ainda há ações disponíveis
        if (gameState.actionsLeft > 0) {
          const confirm = await this.main.showConfirm(
            'Avançar para Negociação',
            `Você ainda tem ${gameState.actionsLeft} ação(ões) disponível(is).\n\nDeseja avançar para a fase de negociação mesmo assim?`
          );
          return confirm ? 'continue' : 'cancel';
        }
        return 'continue';
        
      case 'negociacao':
        // Verificar propostas pendentes
        const pendingNegotiations = getPendingNegotiationsForPlayer(player.id);
        
        if (pendingNegotiations.length > 0 && !(player.type === 'ai' || player.isAI)) {
          const shouldRespond = await this.main.showConfirm(
            '📨 Propostas Pendentes',
            `Você tem ${pendingNegotiations.length} proposta(s) de negociação pendente(s).\n\nDeseja respondê-las agora?`
          );
          
          if (shouldRespond) {
            if (window.uiManager?.negotiation?.showPendingNegotiationsModal) {
              window.uiManager.negotiation.showPendingNegotiationsModal();
            }
            return 'cancel';
          }
        }
        return 'complete';
        
      default:
        console.warn(`Fase desconhecida: ${phase}, forçando finalização`);
        return 'complete';
    }
  }

  _advanceToNextPhase(currentPhase) {
    const nextPhase = this._getNextPhase(currentPhase);
    
    if (nextPhase && this.main.coordinator) {
      this.main.coordinator.setCurrentPhase(nextPhase);
      this.main.showFeedback(`Fase de ${this._getPhaseDisplayName(nextPhase)} iniciada!`, 'info');
    }
  }

  _getNextPhase(currentPhase) {
    const phases = ['renda', 'acoes', 'negociacao'];
    const currentIndex = phases.indexOf(currentPhase);
    
    if (currentIndex === -1) return 'renda';
    
    return phases[(currentIndex + 1) % phases.length];
  }

  _getPhaseDisplayName(phase) {
    const names = {
      'renda': 'Renda',
      'acoes': 'Ações',
      'negociacao': 'Negociação'
    };
    return names[phase] || phase;
  }

  // ==================== FINALIZAÇÃO DE TURNO ====================

  _finalizePlayerTurn(player) {
    console.log(`⏹️ TurnLogic: Finalizando turno de ${player.name}`);
    
    // Verificar vitória antes de finalizar
    this.checkVictory();
    
    if (this.gameEnded) {
      return;
    }
    
    addActivityLog({
      type: 'turn',
      playerName: 'SISTEMA',
      action: 'Turno finalizado',
      details: player.name,
      turn: gameState.turn
    });
    
    // Resetar bônus de turno
    if (this.main.factionLogic) {
      this.main.factionLogic.resetTurnBonuses(player);
    }

    // Avançar para próximo jogador
    this._advanceToNextPlayer(player);
  }

  _advanceToNextPlayer(currentPlayer) {
    // Limpar timeout se existir
    if (this.turnTimeout) {
      clearTimeout(this.turnTimeout);
      this.turnTimeout = null;
    }
    
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
      this.turnTimeout = setTimeout(() => this._advanceToNextPlayer(newPlayer), 1000);
      return;
    }
    
    addActivityLog({
      type: 'turn',
      playerName: 'SISTEMA',
      action: 'Turno iniciado',
      details: newPlayer.name,
      turn: gameState.turn
    });
    
    // Verificar vitória novamente
    this.checkVictory();
    
    // Notificar UI
    this._updateGameUI();
    
    this.main.showFeedback(`Turno de ${newPlayer.name}`, 'info');

    // Iniciar turno da IA se necessário
    this._startAITurnIfNeeded(newPlayer);
    
    saveGame();
  }

  _resetPlayerTurn() {
    // Resetar flag de renda aplicada
    this.incomeApplied = false;
    
    // Resetar fase para renda via coordinator
    if (this.main.coordinator) {
      this.main.coordinator.setCurrentPhase('renda');
      this.main.coordinator.clearRegionSelection();
    }
  }

  _startAITurnIfNeeded(player) {
    if (this.gameEnded) return;
    
    // Pequeno delay para garantir que a UI esteja atualizada
    setTimeout(() => {
      if (player && !player.eliminated && (player.type === 'ai' || player.isAI)) {
        console.log(`🤖 TurnLogic: Iniciando turno da IA: ${player.name}`);
        
        this.turnTimeout = setTimeout(() => {
          if (this.main.aiCoordinator) {
            this.main.aiCoordinator.checkAndExecuteAITurn();
          }
        }, 1500);
      }
    }, 1000);
  }

  // ==================== RENDA ====================

  applyIncome(player) {
    if (this.gameEnded || this.incomeApplied) return;
    
    // Marcar que a renda foi aplicada
    this.incomeApplied = true;
    
    let bonuses = { madeira: 0, pedra: 0, ouro: 0, agua: 0, pv: 0 };
    
    // Usar o IncomeCalculator se disponível
    if (this.main.incomeCalculator) {
      bonuses = this.main.incomeCalculator.calculatePlayerIncome(player, gameState);
    } else {
      // Fallback para cálculo básico
      bonuses = this._calculateBasicIncome(player);
    }
    
    // Aplicar bônus
    this._applyIncomeBonuses(player, bonuses);
    
    // Verificar vitória IMEDIATAMENTE
    if (player.victoryPoints >= GAME_CONFIG.VICTORY_POINTS) {
      console.log(`🎯 Vitória na renda: ${player.name} atingiu ${player.victoryPoints} PV`);
      this._declareVictory(player);
      return;
    }

    // Log da renda
    addActivityLog({
      type: 'income',
      playerName: player.name,
      action: 'recebeu renda',
      details: `+${bonuses.pv} PV, Recursos: ${JSON.stringify(bonuses)}`,
      turn: gameState.turn
    });

    // Modal de renda para humanos
    if (player.id === gameState.currentPlayerIndex && 
        this.main.coordinator?.getCurrentPhase() === 'renda' &&
        !(player.type === 'ai' || player.isAI)) {
      
      setTimeout(() => {
        if (window.uiManager?.modals?.showIncomeModal) {
          window.uiManager.modals.showIncomeModal(player, bonuses);
        } else {
          // Fallback: avançar para fase de ações após 2 segundos
          setTimeout(() => {
            if (this.main.coordinator) {
              this.main.coordinator.setCurrentPhase('acoes');
              this.main.showFeedback('Renda aplicada! Fase de Ações iniciada.', 'info');
            }
          }, 2000);
        }
      }, 500);
    } else if (player.type === 'ai' || player.isAI) {
      // IA: log apenas
      console.log(`🤖 ${player.name} recebeu renda: ${JSON.stringify(bonuses)}`);
      
      // Avançar para fase de ações após pequeno delay
      setTimeout(() => {
        if (this.main.coordinator) {
          this.main.coordinator.setCurrentPhase('acoes');
        }
      }, 1000);
    }
  }

  _calculateBasicIncome(player) {
    const bonuses = { madeira: 2, pedra: 1, ouro: 1, agua: 2, pv: 1 };
    
    // Adicionar bônus por região
    player.regions.forEach(regionId => {
      const region = gameState.regions[regionId];
      if (!region) return;
      
      switch(region.biome) {
        case 'Floresta Tropical':
        case 'Floresta Temperada':
          bonuses.madeira += 1;
          break;
        case 'Savana':
          bonuses.ouro += 1;
          break;
        case 'Pântano':
          bonuses.agua += 2;
          bonuses.pedra += 1;
          break;
      }
    });
    
    return bonuses;
  }

  _applyIncomeBonuses(player, bonuses) {
    Object.keys(bonuses).forEach(k => {
      if (k === 'pv') {
        player.victoryPoints += bonuses[k];
      } else {
        player.resources[k] = (player.resources[k] || 0) + bonuses[k];
      }
    });
  }

  // ==================== VITÓRIA ====================

  checkVictory() {
    if (this.gameEnded) return;
    
    // Verificar vitória por pontos
    const winner = gameState.players.find(p => p.victoryPoints >= GAME_CONFIG.VICTORY_POINTS);
    if (winner) {
      console.log(`🎉 Vitória detectada: ${winner.name} com ${winner.victoryPoints} PV`);
      this._declareVictory(winner);
      return;
    }
    
    // Verificar vitória por eliminação
    const activePlayers = getActivePlayers?.() || gameState.players.filter(p => !p.eliminated);
    
    if (activePlayers.length === 1) {
      const eliminationWinner = activePlayers[0];
      console.log(`🎉 Vitória por eliminação: ${eliminationWinner.name} é o único jogador ativo`);
      this._declareVictory(eliminationWinner);
      return;
    }
    
    if (activePlayers.length === 0) {
      console.log('💀 Todos os jogadores foram eliminados!');
      this.gameEnded = true;
      
      if (window.uiManager?.modals?.showNoWinnerModal) {
        window.uiManager.modals.showNoWinnerModal();
      }
      
      this._disableGameActions();
    }
  }

  _declareVictory(winner) {
    this.gameEnded = true;
    
    // Limpar timeout
    if (this.turnTimeout) {
      clearTimeout(this.turnTimeout);
      this.turnTimeout = null;
    }
    
    const victoryMessage = `${winner.name} venceu o jogo com ${winner.victoryPoints} PV!`;
    this.main.showFeedback(victoryMessage, 'success');
    
    addActivityLog({
      type: 'victory',
      playerName: winner.name,
      action: '🏆 VENCEU O JOGO 🏆',
      details: victoryMessage,
      turn: gameState.turn
    });
    
    setTimeout(() => {
      if (window.uiManager?.modals?.openVictoryModal) {
        window.uiManager.modals.openVictoryModal(winner);
      }
    }, 1000);
    
    this._disableGameActions();
    saveGame();
  }

  // ==================== EVENTOS GLOBAIS ====================

  _handleGlobalEvents() {
    // Atualizar eventos globais
    if (this.main.eventManager) {
      this.main.eventManager.updateEventTurn(gameState);
    }
  }

  // ==================== UTILITÁRIOS ====================

  _updateGameUI() {
    if (window.uiManager) {
      window.uiManager.updateUI();
      if (window.uiManager.gameManager) {
        setTimeout(() => window.uiManager.gameManager.updateFooter(), 100);
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
      incomeApplied: this.incomeApplied,
      currentTurn: gameState.turn,
      currentPlayer: getCurrentPlayer()?.name,
      currentPhase: gameState.currentPhase,
      activePlayers: getActivePlayers?.()?.length || gameState.players.filter(p => !p.eliminated).length,
      turnTimeout: !!this.turnTimeout
    };
  }
}