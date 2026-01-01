// turn-phase-manager.js - Gerenciador Unificado de Turnos e Fases
import { 
  gameState, 
  addActivityLog, 
  getCurrentPlayer,
  getPendingNegotiationsForPlayer,
  getActivePlayers,
  getNextActivePlayer,
  saveGame,
  clearRegionSelection
} from '../state/game-state.js';
import { GAME_CONFIG, TURN_PHASES, UI_CONSTANTS } from '../state/game-config.js';

export class TurnPhaseManager {
  constructor(gameLogic) {
    this.main = gameLogic;
    this.currentPhase = gameState.currentPhase || TURN_PHASES.RENDA;
    this.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
    this.gameEnded = false;
    this.incomeApplied = false;
    this.phaseHistory = [];
    this.turnTimeout = null;
    
    this._syncWithGameState();
    this.setupEventListeners();
  }

  // ==================== CONFIGURAÇÃO ====================

  setupEventListeners() {
    window.addEventListener('phaseChanged', (event) => {
      this.handleExternalPhaseChange(event.detail);
    });
  }

  handleExternalPhaseChange({ oldPhase, newPhase, player }) {
    console.log(`🔄 Fase externa alterada: ${oldPhase} → ${newPhase} para ${player?.name}`);
    this._updateUI();
  }

  _syncWithGameState() {
    gameState.currentPhase = this.currentPhase;
    gameState.actionsLeft = this.actionsLeft;
  }

  // ==================== CONTROLE DE FASES ====================

  getCurrentPhase() {
    return this.currentPhase;
  }

  setCurrentPhase(phase, force = false) {
    const oldPhase = this.currentPhase;
    
    if (oldPhase === phase && !force) {
      return phase;
    }

    // Validar transição
    if (!force && !this._isValidTransition(oldPhase, phase)) {
      console.warn(`Transição inválida: ${oldPhase} -> ${phase}`);
      return this.currentPhase;
    }

    // Atualizar estado
    this.currentPhase = phase;
    this._syncWithGameState();
    
    // Executar lógica da fase
    this._executePhaseLogic(phase, oldPhase);
    
    // Registrar e notificar
    this._recordPhaseChange(oldPhase, phase);
    this._notifyPhaseChange(oldPhase, phase);
    
    console.log(`🔄 TurnPhaseManager: ${oldPhase} → ${phase}`);
    return phase;
  }

  _isValidTransition(fromPhase, toPhase) {
    const validTransitions = {
      [TURN_PHASES.RENDA]: [TURN_PHASES.ACOES],
      [TURN_PHASES.ACOES]: [TURN_PHASES.NEGOCIACAO],
      [TURN_PHASES.NEGOCIACAO]: [TURN_PHASES.RENDA]
    };
    return validTransitions[fromPhase]?.includes(toPhase) || false;
  }

  _executePhaseLogic(newPhase, oldPhase) {
    // Resetar ações para certas fases
    if (newPhase === TURN_PHASES.RENDA || newPhase === TURN_PHASES.ACOES) {
      this.resetActions();
    } else if (newPhase === TURN_PHASES.NEGOCIACAO) {
      this.actionsLeft = 1;
      this._syncWithGameState();
    }
    
    // Lógica específica por fase
    switch(newPhase) {
      case TURN_PHASES.RENDA:
        this._handleIncomePhase();
        break;
      case TURN_PHASES.ACOES:
        this._handleActionsPhase();
        break;
      case TURN_PHASES.NEGOCIACAO:
        this._handleNegotiationPhase();
        break;
    }
    
    this._logPhaseChange(newPhase);
  }

  advancePhase() {
    const phases = Object.values(TURN_PHASES);
    const currentIndex = phases.indexOf(this.currentPhase);
    const nextIndex = (currentIndex + 1) % phases.length;
    return this.setCurrentPhase(phases[nextIndex]);
  }

  // ==================== LÓGICA DE FASES ====================

  _handleIncomePhase() {
    console.log(`💰 Fase de Renda iniciada`);
    
    const player = getCurrentPlayer();
    if (player && !player.eliminated && this.main?.turnLogic) {
      // Marcar que a renda será aplicada
      this.incomeApplied = true;
      
      // Aplicar renda via IncomeCalculator
      if (this.main.incomeCalculator) {
        const income = this.main.incomeCalculator.calculatePlayerIncome(player, gameState);
        
        // Aplicar recursos
        Object.entries(income).forEach(([resource, amount]) => {
          if (resource === 'pv') {
            player.victoryPoints += amount;
          } else {
            player.resources[resource] = (player.resources[resource] || 0) + amount;
          }
        });
        
        // Log da renda
        addActivityLog({
          type: 'income',
          playerName: player.name,
          action: 'recebeu renda',
          details: `+${income.pv} PV`,
          turn: gameState.turn
        });
        
        // Verificar vitória imediatamente
        if (player.victoryPoints >= GAME_CONFIG.VICTORY_POINTS) {
          this._declareVictory(player);
          return;
        }
      }
      
      // Mostrar modal para jogadores humanos
      if (!(player.type === 'ai' || player.isAI)) {
        setTimeout(() => {
          if (window.uiManager?.modals?.showIncomeModal) {
            window.uiManager.modals.showIncomeModal(player, {});
          } else {
            // Fallback: avançar após delay
            setTimeout(() => this.advancePhase(), 2000);
          }
        }, 500);
      } else {
        // IA: avançar após pequeno delay
        setTimeout(() => this.advancePhase(), 1000);
      }
    } else {
      // Jogador eliminado: avançar direto
      setTimeout(() => this.advancePhase(), 500);
    }
  }

  _handleActionsPhase() {
    console.log(`⚡ Fase de Ações iniciada`);
    this.resetActions();
  }

  _handleNegotiationPhase() {
    console.log(`🤝 Fase de Negociação iniciada`);
    
    // Verificar propostas pendentes
    setTimeout(() => {
      if (window.uiManager?.negotiation?.checkPendingNegotiationsForCurrentPlayer) {
        window.uiManager.negotiation.checkPendingNegotiationsForCurrentPlayer();
      }
    }, 500);
  }

  // ==================== CONTROLE DE TURNOS ====================

  async endTurn() {
    if (this.gameEnded) {
      this.main.showFeedback('O jogo já terminou!', 'warning');
      return;
    }
    
    const player = getCurrentPlayer();
    
    if (player.eliminated) {
      this._skipPlayerTurn(player);
      return;
    }
    
    // Processar fase atual
    const result = await this._processCurrentPhase(player);
    
    if (result === 'continue') {
      this.advancePhase();
    } else if (result === 'complete') {
      this._finalizePlayerTurn(player);
    }
  }

  async _processCurrentPhase(player) {
    switch(this.currentPhase) {
      case TURN_PHASES.RENDA:
        // Renda já foi processada, sempre avançar
        return 'continue';
        
      case TURN_PHASES.ACOES:
        // Verificar se ainda há ações
        if (this.actionsLeft > 0 && !(player.type === 'ai' || player.isAI)) {
          const confirm = await this.main.showConfirm(
            'Avançar para Negociação',
            `Você ainda tem ${this.actionsLeft} ação(ões).\n\nDeseja avançar mesmo assim?`
          );
          return confirm ? 'continue' : 'cancel';
        }
        return 'continue';
        
      case TURN_PHASES.NEGOCIACAO:
        // Verificar propostas pendentes
        const pending = getPendingNegotiationsForPlayer(player.id);
        if (pending.length > 0 && !(player.type === 'ai' || player.isAI)) {
          const respond = await this.main.showConfirm(
            'Propostas Pendentes',
            `Você tem ${pending.length} proposta(s) de negociação.\n\nDeseja respondê-las agora?`
          );
          if (respond) {
            window.uiManager?.negotiation?.showPendingNegotiationsModal?.();
            return 'cancel';
          }
        }
        return 'complete';
        
      default:
        return 'complete';
    }
  }

  _finalizePlayerTurn(player) {
    console.log(`⏹️ Finalizando turno de ${player.name}`);
    
    // Verificar vitória
    this._checkVictory();
    if (this.gameEnded) return;
    
    // Resetar bônus de facção
    if (this.main.factionLogic) {
      this.main.factionLogic.resetTurnBonuses(player);
    }
    
    // Avançar para próximo jogador
    this._advanceToNextPlayer(player);
  }

  _skipPlayerTurn(player) {
    console.log(`⏭️ Pulando turno de ${player.name} (eliminado)`);
    this._advanceToNextPlayer(player);
  }

  _advanceToNextPlayer(currentPlayer) {
    // Limpar timeout anterior
    if (this.turnTimeout) {
      clearTimeout(this.turnTimeout);
      this.turnTimeout = null;
    }
    
    // Encontrar próximo jogador ativo
    let nextIndex = getNextActivePlayer?.(gameState.currentPlayerIndex) || 
                   (gameState.currentPlayerIndex + 1) % gameState.players.length;
    
    // Verificar vitória por eliminação
    const activePlayers = getActivePlayers?.();
    if (activePlayers?.length === 1) {
      this._declareVictory(activePlayers[0]);
      return;
    }
    
    // Atualizar jogador atual
    gameState.currentPlayerIndex = nextIndex;
    
    // Incrementar turno global se voltou ao jogador 0
    if (gameState.currentPlayerIndex === 0) {
      gameState.turn += 1;
      
      // Atualizar eventos globais
      if (this.main.eventManager) {
        this.main.eventManager.updateEventTurn(gameState);
      }
    }
    
    // Resetar para novo turno
    this._resetForNewTurn();
    
    const newPlayer = getCurrentPlayer();
    
    // Pular jogadores eliminados
    if (newPlayer.eliminated) {
      this.main.showFeedback(`${newPlayer.name} está eliminado. Pulando turno...`, 'info');
      this.turnTimeout = setTimeout(() => this._advanceToNextPlayer(newPlayer), 1000);
      return;
    }
    
    // Registrar início do turno
    addActivityLog({
      type: 'turn',
      playerName: 'SISTEMA',
      action: 'Turno iniciado',
      details: newPlayer.name,
      turn: gameState.turn
    });
    
    // Atualizar UI
    this._updateUI();
    this.main.showFeedback(`Turno de ${newPlayer.name}`, 'info');
    
    // Iniciar turno da IA se necessário
    this._startAITurnIfNeeded(newPlayer);
    
    // Salvar jogo
    saveGame();
  }

  _resetForNewTurn() {
    this.incomeApplied = false;
    this.currentPhase = TURN_PHASES.RENDA;
    this.resetActions();
    this._syncWithGameState();
    
    // Limpar seleções
    clearRegionSelection();
    gameState.selectedRegionId = null;
  }

  // ==================== GERENCIAMENTO DE AÇÕES ====================

  getRemainingActions() {
    return this.actionsLeft;
  }

  consumeAction() {
    if (this.actionsLeft <= 0) {
      console.warn('Tentativa de consumir ação sem ações disponíveis');
      return false;
    }
    
    this.actionsLeft--;
    this._syncWithGameState();
    
    console.log(`📝 Ação consumida. Restam: ${this.actionsLeft}`);
    return this.actionsLeft;
  }

  resetActions() {
    this.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
    this._syncWithGameState();
    console.log(`🔄 Ações resetadas: ${this.actionsLeft}`);
  }

  validateActionForPhase(actionType) {
    const phaseActions = {
      [TURN_PHASES.RENDA]: [],
      [TURN_PHASES.ACOES]: ['explorar', 'recolher', 'construir', 'disputar'],
      [TURN_PHASES.NEGOCIACAO]: ['negociar']
    };
    
    return phaseActions[this.currentPhase]?.includes(actionType) || false;
  }

  // ==================== VITÓRIA ====================

  _checkVictory() {
    if (this.gameEnded) return;
    
    // Vitória por pontos
    const winner = gameState.players.find(p => p.victoryPoints >= GAME_CONFIG.VICTORY_POINTS);
    if (winner) {
      this._declareVictory(winner);
      return;
    }
    
    // Vitória por eliminação
    const activePlayers = getActivePlayers?.();
    if (activePlayers?.length === 1) {
      this._declareVictory(activePlayers[0]);
      return;
    }
    
    if (activePlayers?.length === 0) {
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
    
    if (this.turnTimeout) {
      clearTimeout(this.turnTimeout);
      this.turnTimeout = null;
    }
    
    const message = `${winner.name} venceu o jogo com ${winner.victoryPoints} PV!`;
    this.main.showFeedback(message, 'success');
    
    addActivityLog({
      type: 'victory',
      playerName: winner.name,
      action: '🏆 VENCEU O JOGO 🏆',
      details: message,
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

  _startAITurnIfNeeded(player) {
    if (this.gameEnded) return;
    
    setTimeout(() => {
      if (player && !player.eliminated && (player.type === 'ai' || player.isAI)) {
        console.log(`🤖 Iniciando turno da IA: ${player.name}`);
        
        this.turnTimeout = setTimeout(() => {
          if (this.main.aiCoordinator) {
            this.main.aiCoordinator.checkAndExecuteAITurn();
          }
        }, 1500);
      }
    }, 1000);
  }

  _recordPhaseChange(oldPhase, newPhase) {
    this.phaseHistory.unshift({
      timestamp: Date.now(),
      turn: gameState.turn,
      oldPhase,
      newPhase,
      player: getCurrentPlayer()?.name,
      actionsLeft: this.actionsLeft
    });
    
    if (this.phaseHistory.length > 50) {
      this.phaseHistory = this.phaseHistory.slice(0, 50);
    }
  }

  _notifyPhaseChange(oldPhase, newPhase) {
    window.dispatchEvent(new CustomEvent('phaseChanged', {
      detail: { 
        oldPhase, 
        newPhase, 
        player: getCurrentPlayer(),
        actionsLeft: this.actionsLeft
      }
    }));
  }

  _logPhaseChange(phase) {
    const phaseNames = UI_CONSTANTS.PHASE_NAMES || {
      [TURN_PHASES.RENDA]: '💰 Renda',
      [TURN_PHASES.ACOES]: '⚡ Ações',
      [TURN_PHASES.NEGOCIACAO]: '🤝 Negociação'
    };
    
    addActivityLog({
      type: 'phase',
      playerName: 'SISTEMA',
      action: 'Fase alterada',
      details: `${phaseNames[phase] || phase} para ${getCurrentPlayer()?.name}`,
      turn: gameState.turn
    });
  }

  _updateUI() {
    if (window.uiManager) {
      window.uiManager.updateUI();
      setTimeout(() => window.uiManager.gameManager?.updateFooter?.(), 100);
    }
  }

  _disableGameActions() {
    if (window.uiManager) {
      const buttons = ['actionExplore', 'actionCollect', 'actionBuild', 'actionNegotiate', 'endTurnBtn'];
      buttons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
          btn.disabled = true;
          btn.classList.add('opacity-50', 'cursor-not-allowed');
        }
      });
      this._updateUI();
    }
  }

  // ==================== DEBUG ====================

  getDebugInfo() {
    return {
      currentPhase: this.currentPhase,
      gameStatePhase: gameState.currentPhase,
      actionsLeft: this.actionsLeft,
      gameStateActionsLeft: gameState.actionsLeft,
      gameEnded: this.gameEnded,
      incomeApplied: this.incomeApplied,
      currentPlayer: getCurrentPlayer()?.name,
      turn: gameState.turn,
      phaseHistoryLength: this.phaseHistory.length,
      isSynchronized: this.currentPhase === gameState.currentPhase && 
                     this.actionsLeft === gameState.actionsLeft
    };
  }
}