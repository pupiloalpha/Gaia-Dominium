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
    console.log(`⏹️ Tentativa de finalizar turno na fase: ${currentPhase}`);
    
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
    
    // Processar baseado na fase atual
    switch(currentPhase) {
      case 'renda':
        // Avançar para fase de ações
        this.main.coordinator?.setCurrentPhase('acoes');
        this.main.showFeedback('Fase de Ações iniciada!', 'info');
        break;
        
      case 'acoes':
        // Verificar se ainda há ações disponíveis
        if (gameState.actionsLeft > 0) {
          const confirm = await this.main.showConfirm(
            'Avançar para Negociação',
            `Você ainda tem ${gameState.actionsLeft} ação(ões) disponível(is).\n\nDeseja avançar para a fase de negociação mesmo assim?`
          );
          
          if (!confirm) return;
        }
        
        // Avançar para fase de negociação
        this.main.coordinator?.setCurrentPhase('negociacao');
        this.main.showFeedback('Fase de Negociação iniciada!', 'info');
        break;
        
      case 'negociacao':
        // Finalizar turno
        this._finalizeTurn(currentPlayer);
        break;
        
      default:
        console.warn(`Fase desconhecida: ${currentPhase}, forçando finalização`);
        this._finalizeTurn(currentPlayer);
    }
  }

  // ==================== FINALIZAÇÃO DE TURNO ====================

  _finalizeTurn(currentPlayer) {
    // Verificar vitória antes de finalizar
    this.checkVictory();
    
    if (this.gameEnded) {
      return;
    }
    
    console.log(`⏹️ Finalizando turno de ${currentPlayer.name}`);
    
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
    
    // Notificar UI
    this._updateGameUI();
    
    this.main.showFeedback(`Turno de ${newPlayer.name}`, 'info');

    // GATILHO PARA IA
    if (!this.gameEnded) {
      setTimeout(() => {
        const nextPlayer = getCurrentPlayer();
        
        if (nextPlayer && !nextPlayer.eliminated && (nextPlayer.type === 'ai' || nextPlayer.isAI)) {
          console.log(`🤖 Iniciando turno da IA: ${nextPlayer.name}`);
          
          setTimeout(() => {
            if (this.main.aiCoordinator) {
              this.main.aiCoordinator.checkAndExecuteAITurn();
            }
          }, 1500);
        }
      }, 1000);
    }
    
    saveGame();
  }

  _resetPlayerTurn() {
    // Resetar flag de renda aplicada
    this.incomeApplied = false;
    
    // Resetar fase para renda
    this.main.coordinator?.setCurrentPhase('renda');
    this.main.coordinator?.clearRegionSelection();
  }

  _handleGlobalEvents() {
    // Atualizar eventos globais
    if (this.main.eventManager) {
      this.main.eventManager.updateEventTurn(gameState);
    }
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
            this.main.coordinator?.setCurrentPhase('acoes');
            this.main.showFeedback('Renda aplicada! Fase de Ações iniciada.', 'info');
          }, 2000);
        }
      }, 500);
    } else if (player.type === 'ai' || player.isAI) {
      // IA: log apenas
      console.log(`🤖 ${player.name} recebeu renda: ${JSON.stringify(bonuses)}`);
      
      // Avançar para fase de ações após pequeno delay
      setTimeout(() => {
        this.main.coordinator?.setCurrentPhase('acoes');
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
      activePlayers: getActivePlayers?.()?.length || gameState.players.filter(p => !p.eliminated).length
    };
  }
}