// turn-logic.js - Gerenciador de Turnos (Refatorado)
import { 
  gameState, 
  achievementsState, 
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
    this.incomeModalAttempts = 0;
    this.gameEnded = false;
    
    // Serviços (serão injetados)
    this.eventManager = null;
    this.incomeCalculator = null;
    this.phaseManager = null;
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
      this._finalizeTurn(currentPlayer);
      return;
    }
    
    // Verificar se jogador pode realizar ações
    if (!this._canPlayerTakeActions(currentPlayer)) {
      console.log(`🔄 ${currentPlayer.name} não pode realizar ações, forçando término do turno`);
      this._finalizeTurn(currentPlayer);
      return;
    }
    
    // Lógica baseada na fase atual
    const currentPhase = this.phaseManager?.getCurrentPhase() || 'renda';
    
    switch (currentPhase) {
      case 'acoes':
        this._setupNegotiationPhase();
        return;
        
      case 'negociacao':
        await this._handleNegotiationEnd(currentPlayer);
        return;
        
      case 'renda':
        // Fallback se travar na renda
        this.main.showFeedback('Finalizando renda...', 'info');
        this.phaseManager?.setCurrentPhase('acoes');
        if (window.uiManager) window.uiManager.updateUI();
        break;
    }
  }

  async _handleNegotiationEnd(currentPlayer) {
    // Verificar propostas pendentes (apenas para humanos)
    if (!(currentPlayer.type === 'ai' || currentPlayer.isAI)) {
      const pendingNegotiations = getPendingNegotiationsForPlayer(currentPlayer.id);
      
      if (pendingNegotiations.length > 0) {
        const shouldRespond = await this.main.showConfirm(
          '📨 Propostas Pendentes',
          `Você tem ${pendingNegotiations.length} proposta(s) de negociação pendente(s).\n\nDeseja respondê-las agora antes de terminar seu turno?`
        );
        
        if (shouldRespond) {
          if (window.uiManager?.negotiation?.showPendingNegotiationsModal) {
            window.uiManager.negotiation.showPendingNegotiationsModal();
          }
          return; // Não finalizar o turno
        }
      }
    }
    
    // Para IA ou humano sem propostas pendentes → Finalizar turno
    this._finalizeTurn(currentPlayer);
  }

  _setupNegotiationPhase() {
    this.phaseManager?.setCurrentPhase('negociacao');
    gameState.actionsLeft = 1;
    
    // Notificar UI
    if (window.uiManager?.negotiation) {
      setTimeout(() => {
        if (window.uiManager.negotiation.checkPendingNegotiationsForCurrentPlayer) {
          window.uiManager.negotiation.checkPendingNegotiationsForCurrentPlayer();
        }
      }, 800);
    }
    
    // Atualizar UI
    this._updateGameUI();
  }

  // ==================== FINALIZAÇÃO DE TURNO ====================

  _finalizeTurn(currentPlayer) {
    // Verificar vitória antes de finalizar
    this.checkVictory();
    
    if (this.gameEnded) {
      return;
    }
    
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

    // Obter próximo jogador ativo
    const nextPlayerIndex = getNextActivePlayer?.(gameState.currentPlayerIndex) || 
      (gameState.currentPlayerIndex + 1) % gameState.players.length;
    
    // Se voltou ao mesmo jogador, verificar vitória por eliminação
    if (nextPlayerIndex === gameState.currentPlayerIndex) {
      const activePlayers = getActivePlayers?.() || gameState.players.filter(p => !p.eliminated);
      
      if (activePlayers.length === 1) {
        const winner = activePlayers[0];
        this._declareVictory(winner);
        return;
      }
    }

    // Atualizar índice do jogador
    gameState.currentPlayerIndex = nextPlayerIndex;
    
    // Incrementar turno se voltou ao jogador 0
    if (gameState.currentPlayerIndex === 0) {
      gameState.turn += 1;
      this._handleTurnEvents();
    }

    // Resetar estado para novo jogador
    this._resetPlayerTurn();
    
    const newPlayer = getCurrentPlayer();
    
    // Se o jogador está eliminado, pular turno
    if (newPlayer.eliminated) {
      this.main.showFeedback(`${newPlayer.name} está eliminado. Pulando turno...`, 'info');
      
      // Avançar novamente após delay
      setTimeout(() => {
        this._finalizeTurn(newPlayer);
      }, 1000);
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
    
    // Atualizar UI
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
            } else if (window.aiCoordinator) {
              window.aiCoordinator.checkAndExecuteAITurn();
            }
          }, 1500);
        }
      }, 1000);
    }
    
    saveGame();
  }

  _resetPlayerTurn() {
    gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
    gameState.selectedRegionId = null;
    this.phaseManager?.setCurrentPhase('renda');
    gameState.selectedPlayerForSidebar = gameState.currentPlayerIndex;
  }

  _handleTurnEvents() {
    // Atualizar eventos
    if (this.eventManager) {
      this.eventManager.updateEventTurn(gameState);
    }
  }

  // ==================== RENDA ====================

  applyIncome(player) {
    if (this.gameEnded) return;
    
    let bonuses = { madeira: 0, pedra: 0, ouro: 0, agua: 0, pv: 0 };
    
    // Usar o IncomeCalculator se disponível
    if (this.incomeCalculator) {
      bonuses = this.incomeCalculator.calculatePlayerIncome(player, gameState);
    } else {
      // Fallback para cálculo básico
      bonuses = this._calculateBasicIncome(player);
    }
    
    // Aplicar bônus
    this._applyIncomeBonuses(player, bonuses);
    
    // Se o jogo terminou durante a renda, cancelar
    if (this.gameEnded) {
      console.log('⏹️ Jogo terminado durante renda - cancelando avanço de fase');
      return;
    }

    // Modal UI ou Auto-Skip para IA
    if (player.id === gameState.currentPlayerIndex && this.phaseManager?.getCurrentPhase() === 'renda') {
      this._handleIncomePresentation(player, bonuses);
    }
  }

  _calculateBasicIncome(player) {
    // Cálculo básico de renda (fallback)
    const bonuses = { madeira: 2, pedra: 1, ouro: 1, agua: 2, pv: 1 };
    
    // Adicionar bônus por região
    player.regions.forEach(regionId => {
      const region = gameState.regions[regionId];
      if (!region) return;
      
      // Base do bioma
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
      
      // Multiplicador de exploração
      const explorationBonus = region.explorationLevel || 0;
      if (explorationBonus > 0) {
        bonuses.madeira = Math.floor(bonuses.madeira * (1 + explorationBonus * 0.25));
        bonuses.pedra = Math.floor(bonuses.pedra * (1 + explorationBonus * 0.25));
        bonuses.ouro = Math.floor(bonuses.ouro * (1 + explorationBonus * 0.25));
        bonuses.agua = Math.floor(bonuses.agua * (1 + explorationBonus * 0.25));
      }
    });
    
    return bonuses;
  }

  _applyIncomeBonuses(player, bonuses) {
    Object.keys(bonuses).forEach(k => {
      if (k === 'pv') {
        player.victoryPoints += bonuses[k];
        
        // Verificar vitória IMEDIATAMENTE
        if (player.victoryPoints >= GAME_CONFIG.VICTORY_POINTS) {
          console.log(`🎯 Vitória na renda: ${player.name} atingiu ${player.victoryPoints} PV`);
          this._declareVictory(player);
          this._stopGameAfterVictory();
          return;
        }
      } else {
        player.resources[k] = (player.resources[k] || 0) + bonuses[k];
      }
    });
  }

  _handleIncomePresentation(player, bonuses) {
    if (player.type === 'ai' || player.isAI) {
      // IA pula modal
      this.phaseManager?.setCurrentPhase('acoes');
      gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
      
      if (!this.gameEnded) {
        setTimeout(() => {
          if (this.main.aiCoordinator) {
            this.main.aiCoordinator.checkAndExecuteAITurn();
          }
        }, 1000);
      }
    } else {
      setTimeout(() => {
        if (window.uiManager?.modals?.showIncomeModal) {
          window.uiManager.modals.showIncomeModal(player, bonuses);
        } else {
          // Fallback
          this.phaseManager?.setCurrentPhase('acoes');
          if (window.uiManager) window.uiManager.updateUI();
        }
      }, 500);
    }
  }

  // ==================== VITÓRIA ====================

  checkVictory() {
    if (this.gameEnded) return;
    
    // Verificar vitória por pontos
    const winner = gameState.players.find(p => p.victoryPoints >= GAME_CONFIG.VICTORY_POINTS);
    if (winner) {
      console.log(`🎉 Vitória detectada: ${winner.name} com ${winner.victoryPoints} PV`);
      this._declareVictory(winner);
      this._stopGameAfterVictory();
      return;
    }
    
    // Verificar vitória por eliminação
    const activePlayers = getActivePlayers?.() || gameState.players.filter(p => !p.eliminated);
    
    if (activePlayers.length === 1) {
      const eliminationWinner = activePlayers[0];
      console.log(`🎉 Vitória por eliminação: ${eliminationWinner.name} é o único jogador ativo`);
      this._declareVictory(eliminationWinner);
      this._stopGameAfterVictory();
      return;
    }
    
    if (activePlayers.length === 0) {
      // Todos os jogadores eliminados
      console.log('💀 Todos os jogadores foram eliminados!');
      this.gameEnded = true;
      
      // Mostrar modal de fim de jogo sem vencedor
      if (window.uiManager?.modals?.showNoWinnerModal) {
        window.uiManager.modals.showNoWinnerModal();
      } else {
        this.main.showFeedback('Todos os jogadores foram eliminados! Jogo terminou sem vencedor.', 'warning');
      }
      
      this._disableGameActions();
      return;
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
    
    if (achievementsState && achievementsState.wins !== undefined) {
      achievementsState.wins++;
    }
    
    setTimeout(() => {
      if (window.uiManager?.modals?.openVictoryModal) {
        window.uiManager.modals.openVictoryModal(winner);
      } else {
        this.main.showFeedback(victoryMessage, 'success');
      }
    }, 1000);
    
    this._disableGameActions();
    saveGame();
  }

  // ==================== UTILITÁRIOS ====================

  _canPlayerTakeActions(player) {
    if (!player || player.eliminated) return false;
    
    // Verificar se tem recursos para alguma ação
    const hasBasicResources = 
      player.resources.madeira >= 1 || 
      player.resources.pedra >= 1 || 
      player.resources.ouro >= 1 ||
      player.victoryPoints >= 2;
    
    // Verificar se controla regiões exploráveis
    const hasExplorableRegions = player.regions.some(regionId => {
      const region = gameState.regions[regionId];
      return region && region.explorationLevel < 3;
    });
    
    return hasBasicResources || hasExplorableRegions;
  }

  _stopGameAfterVictory() {
    gameState.gameStarted = false;
    this.gameEnded = true;
    
    this._updateGameUI();
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
      
      const phaseIndicator = document.getElementById('phaseIndicator');
      if (phaseIndicator) {
        phaseIndicator.textContent = '🎉 JOGO TERMINADO! 🎉';
        phaseIndicator.classList.add('text-yellow-400', 'font-bold');
      }
      
      this._updateGameUI();
    }
  }

  _updateGameUI() {
    if (window.uiManager) {
      window.uiManager.updateUI();
      if (window.uiManager.gameManager) {
        setTimeout(() => window.uiManager.gameManager.updateFooter(), 100);
      }
    }
  }

  // ==================== GETTERS PARA COMPATIBILIDADE ====================

  getCurrentPhase() {
    return this.phaseManager?.getCurrentPhase() || 'renda';
  }

  setCurrentPhase(phase) {
    return this.phaseManager?.setCurrentPhase(phase) || phase;
  }

  advancePhase() {
    return this.phaseManager?.advancePhase() || 'renda';
  }

  // ==================== DEBUG ====================

  getDebugInfo() {
    return {
      gameEnded: this.gameEnded,
      currentTurn: gameState.turn,
      currentPlayer: getCurrentPlayer()?.name,
      activePlayers: getActivePlayers?.()?.length || gameState.players.filter(p => !p.eliminated).length,
      eventManager: this.eventManager?.getDebugInfo(),
      phaseManager: this.phaseManager?.getDebugInfo(),
      incomeCalculator: this.incomeCalculator?.getDebugInfo(getCurrentPlayer(), gameState)
    };
  }
}