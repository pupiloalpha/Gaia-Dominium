// logic-turn.js - Gerenciador de Turnos e Fases
import { 
  gameState, 
  achievementsState, 
  addActivityLog, 
  getCurrentPlayer, 
  saveGame, 
  getPendingNegotiationsForPlayer
} from '../state/game-state.js';
import { GAME_CONFIG, BIOME_INCOME, GAME_EVENTS, STRUCTURE_INCOME } from '../state/game-config.js';

export class TurnLogic {
  constructor(gameLogic) {
    this.main = gameLogic;
    this.incomeModalAttempts = 0;
    this.gameEnded = false;
  }

  advancePhase() {
    if (this.gameEnded) {
      this.main.showFeedback('O jogo já terminou!', 'warning');
      return gameState.currentPhase;
    }
    
    const phases = ['renda', 'acoes', 'negociacao'];
    const nextIdx = (phases.indexOf(gameState.currentPhase) + 1) % phases.length;
    gameState.currentPhase = phases[nextIdx];
    
    addActivityLog({ 
      type: 'system', 
      playerName: 'SISTEMA', 
      action: 'Fase alterada', 
      details: gameState.currentPhase, 
      turn: gameState.turn 
    });
    
    if (window.uiManager) { 
      window.uiManager.updateUI(); 
      window.uiManager.updateFooter(); 
    }
    
    return gameState.currentPhase;
  }

  async handleEndTurn() {
  if (this.gameEnded) {
    this.main.showFeedback('O jogo já terminou!', 'warning');
    return;
  }
  
  const currentPlayer = getCurrentPlayer();
  
  // Lógica para IA é interceptada no AI Coordinator
  // MAS se chegarmos aqui, deixamos o fluxo normal continuar
  // O AI Coordinator já deve ter tratado a IA antes
  
  // Fase de Ações → Ir para Negociação
  if (gameState.currentPhase === 'acoes') {
    this.main.negotiationLogic.setupPhase();
    return;
  }

  // Fase de Negociação
  if (gameState.currentPhase === 'negociacao') {
    // VERIFICAÇÃO DE PROPOSTAS PENDENTES (APENAS PARA HUMANOS)
    // IA não precisa desta verificação
    if (!(currentPlayer.type === 'ai' || currentPlayer.isAI)) {
      const pendingNegotiations = getPendingNegotiationsForPlayer(currentPlayer.id);
      
      if (pendingNegotiations.length > 0) {
        const shouldRespond = await this.main.showConfirm(
          '📨 Propostas Pendentes',
          `Você tem ${pendingNegotiations.length} proposta(s) de negociação pendente(s).\n\nDeseja respondê-las agora antes de terminar seu turno?`
        );
        
        if (shouldRespond) {
          if (window.uiManager && window.uiManager.negotiation && window.uiManager.negotiation.showPendingNegotiationsModal) {
            window.uiManager.negotiation.showPendingNegotiationsModal();
          }
          return; // Não finalizar o turno
        }
      }
    }
    
    // Para IA ou humano sem propostas pendentes → Finalizar turno
    this._finalizeTurn(currentPlayer);
  } else if (gameState.currentPhase === 'renda') {
    // Fallback se travar na renda
    this.main.showFeedback('Finalizando renda...', 'info');
    gameState.currentPhase = 'acoes';
    if (window.uiManager) window.uiManager.updateUI();
  }
}

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
    
    // Resetar bônus de turno
    if (this.main.factionLogic) {
      this.main.factionLogic.resetTurnBonuses(currentPlayer);
    }

    // Avançar Jogador
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    
    if (gameState.currentPlayerIndex === 0) {
      gameState.turn += 1;
      this._handleEvents();
    }

    // Resetar para novo jogador
    gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
    gameState.selectedRegionId = null;
    gameState.currentPhase = 'renda';
    gameState.selectedPlayerForSidebar = gameState.currentPlayerIndex;

    const newPlayer = getCurrentPlayer();
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
    
    if (window.uiManager) window.uiManager.updateUI();
    this.main.showFeedback(`Turno de ${newPlayer.name}`, 'info');

    // Gatilho para IA
    if (!this.gameEnded) {
      setTimeout(() => {
        if (newPlayer.type === 'ai' || newPlayer.isAI) {
          if (this.main.aiCoordinator) {
            this.main.aiCoordinator.checkAndExecuteAITurn();
          }
        }
      }, 1000);
    }
    
    saveGame();
  }

  applyIncome(player) {
    if (this.gameEnded) return;
    
    const bonuses = { madeira: 0, pedra: 0, ouro: 0, agua: 0, pv: 0 };
    
    player.regions.forEach(rid => {
      const region = gameState.regions[rid];
      if(!region) return;

      // Base
      let prod = this._calculateBiomeProduction(region);
      
      // Estruturas
      region.structures.forEach(st => {
        const inc = STRUCTURE_INCOME[st] || {};
        Object.keys(inc).forEach(k => prod[k] = (prod[k] || 0) + inc[k]);
        if (st === 'Torre de Vigia' || st === 'Santuário') bonuses.pv++;
      });

      // Somar
      Object.keys(prod).forEach(k => bonuses[k] += prod[k]);
    });

    // Calcular bônus de facção
    if (this.main.factionLogic) {
      const factionBonuses = this.main.factionLogic.applyFactionBonuses(player);
      
      if (factionBonuses && factionBonuses.production) {
        Object.entries(factionBonuses.production).forEach(([res, amount]) => {
          if (amount < 1 && amount > 0) { 
            bonuses[res] = Math.floor((bonuses[res] || 0) * (1 + amount));
          } else {
            bonuses[res] = (bonuses[res] || 0) + Math.floor(amount);
          }
        });
      }
    }

    // Aplicar
    Object.keys(bonuses).forEach(k => {
      if(k === 'pv') {
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

    // Se o jogo terminou durante a renda, cancelar
    if (this.gameEnded) {
      console.log('⏹️ Jogo terminado durante renda - cancelando avanço de fase');
      return;
    }

    // Modal UI ou Auto-Skip para IA
    if (player.id === gameState.currentPlayerIndex && gameState.currentPhase === 'renda') {
      if (player.type === 'ai' || player.isAI) {
        // IA pula modal
        gameState.currentPhase = 'acoes';
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
          if(window.uiManager && window.uiManager.modals && window.uiManager.modals.showIncomeModal) {
            window.uiManager.modals.showIncomeModal(player, bonuses);
          }
          else {
            // Fallback
            gameState.currentPhase = 'acoes';
            if(window.uiManager) window.uiManager.updateUI();
          }
        }, 500);
      }
    }
  }

  _calculateBiomeProduction(region) {
    let prod = { madeira:0, pedra:0, ouro:0, agua:0 };
    
    if(region.biome === 'Floresta Tropical') { 
      prod.madeira=1; 
      prod.agua=1; 
    }
    else if(region.biome === 'Floresta Temperada') { 
      prod.madeira=1; 
    }
    else if(region.biome === 'Savana') { 
      prod.ouro=1; 
    }
    else if(region.biome === 'Pântano') { 
      prod.agua=2; 
      prod.pedra=1; 
    }
    
    // Multiplicador Exploração
    let mult = region.explorationLevel === 1 ? 1.25 : (region.explorationLevel >= 2 ? 1.5 : 1);
    Object.keys(prod).forEach(k => prod[k] = Math.floor(prod[k] * mult));
    return prod;
  }

  _handleEvents() {
    if (this.gameEnded) return;
    
    // Reduz duração evento atual
    if (gameState.currentEvent) {
      gameState.eventTurnsLeft--;
      if (gameState.eventTurnsLeft <= 0) {
        if(gameState.currentEvent.remove) gameState.currentEvent.remove(gameState);
        gameState.currentEvent = null;
        gameState.eventModifiers = {};
        this.main.showFeedback('Evento global terminou.', 'info');
      }
    }
    // Novo evento
    if (!gameState.currentEvent) {
      gameState.turnsUntilNextEvent--;
      if (gameState.turnsUntilNextEvent <= 0) {
        this.triggerRandomEvent();
        gameState.turnsUntilNextEvent = 4;
      }
    }
  }

  triggerRandomEvent() {
    if (this.gameEnded) return;
    
    if (!GAME_EVENTS || !GAME_EVENTS.length) return;
    const ev = GAME_EVENTS[Math.floor(Math.random() * GAME_EVENTS.length)];
    
    if (ev.duration > 1) {
      gameState.currentEvent = ev;
      gameState.eventTurnsLeft = ev.duration;
      gameState.eventModifiers = {};
    }
    if(ev.apply) ev.apply(gameState);
    
    addActivityLog({ 
      type: 'event', 
      playerName: 'GAIA', 
      action: 'evento', 
      details: ev.name, 
      turn: gameState.turn 
    });
    this.main.showFeedback(`Evento: ${ev.name}`, 'info');
  }

  checkVictory() {
    if (this.gameEnded) return;
    
    const winner = gameState.players.find(p => p.victoryPoints >= GAME_CONFIG.VICTORY_POINTS);
    if (winner) {
      console.log(`🎉 Vitória detectada: ${winner.name} com ${winner.victoryPoints} PV`);
      this._declareVictory(winner);
      this._stopGameAfterVictory();
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
      if (window.uiManager && window.uiManager.modals && window.uiManager.modals.openVictoryModal) {
        window.uiManager.modals.openVictoryModal(winner);
      } else {
        this.main.showFeedback(victoryMessage, 'success');
      }
    }, 1000);
    
    this._disableGameActions();
    saveGame();
  }

  _stopGameAfterVictory() {
    gameState.gameStarted = false;
    this.gameEnded = true;
    
    if (window.uiManager) {
      window.uiManager.updateUI();
      window.uiManager.updateFooter();
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
      
      const phaseIndicator = document.getElementById('phaseIndicator');
      if (phaseIndicator) {
        phaseIndicator.textContent = '🎉 JOGO TERMINADO! 🎉';
        phaseIndicator.classList.add('text-yellow-400', 'font-bold');
      }
      
      window.uiManager.updateUI();
    }
  }
}
