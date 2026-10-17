// logic-turn.js - Gerenciador de Turnos e Fases (CORRIGIDO)
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
      if (window.uiManager.gameManager) {
            window.uiManager.gameManager.updateFooter();
      }
    }
    
    return gameState.currentPhase;
  }

  // Método auxiliar para verificar se jogador pode realizar ações
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
  
  async handleEndTurn() {
    if (this.gameEnded) {
      this.main.showFeedback('O jogo já terminou!', 'warning');
      return;
    }
    
    const currentPlayer = getCurrentPlayer();

    // VERIFICAÇÃO: Se jogador está eliminado ou não pode fazer ações, forçar término
    if (currentPlayer.eliminated || !this._canPlayerTakeActions(currentPlayer)) {
      console.log(`🔄 ${currentPlayer.name} não pode realizar ações, forçando término do turno`);
      this._finalizeTurn(currentPlayer);
      return;
    }
    
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
    
    // Resetar bônus de turno (facções)
    if (this.main.factionLogic) {
      this.main.factionLogic.resetTurnBonuses(currentPlayer);
    }

    // USAR FUNÇÃO getNextActivePlayer para pular jogadores eliminados
    gameState.currentPlayerIndex = window.gameState?.getNextActivePlayer?.(gameState.currentPlayerIndex) || 
      (gameState.currentPlayerIndex + 1) % gameState.players.length;
    
    // Se voltou ao mesmo jogador, significa que só há um jogador ativo
    if (gameState.currentPlayerIndex === gameState.currentPlayerIndex) {
      // Isso significa que há apenas um jogador ativo - vitória por eliminação
      const activePlayers = window.gameState?.getActivePlayers?.() || gameState.players.filter(p => !p.eliminated);
      
      if (activePlayers.length === 1) {
        const winner = activePlayers[0];
        this._declareVictory(winner);
        return;
      }
    }

    if (gameState.currentPlayerIndex === 0) {
      gameState.turn += 1;
      this._handleEvents();
    }

    // RESETAR ESTADO PARA NOVO JOGADOR - ORDEM CRÍTICA
    gameState.currentPhase = 'renda'; // 1º: Definir fase como renda
    gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
    gameState.selectedRegionId = null;
    gameState.selectedPlayerForSidebar = gameState.currentPlayerIndex;

    const newPlayer = getCurrentPlayer();
    
    console.log(`🔄 Passando turno para ${newPlayer.name} | Fase: ${gameState.currentPhase}`);
    
    // Se o jogador está eliminado, não aplicar renda
    if (newPlayer.eliminated) {
      this.main.showFeedback(`${newPlayer.name} está eliminado. Pulando turno...`, 'info');
      
      // Avançar novamente após delay
      setTimeout(() => {
        this._finalizeTurn(newPlayer);
      }, 1000);
      return;
    }
    
    // Aplicar renda ao novo jogador (se não estiver eliminado)
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
    if (window.uiManager) {
      window.uiManager.updateUI();
      if (window.uiManager.gameManager) {
        window.uiManager.gameManager.updateFooter();
      }
    }
    
    this.main.showFeedback(`Turno de ${newPlayer.name}`, 'info');

    // GATILHO CRÍTICO PARA IA
    if (!this.gameEnded) {
      setTimeout(() => {
        const nextPlayer = getCurrentPlayer();
        
        // Se o próximo jogador for IA, iniciar seu turno (se não estiver eliminado)
        if (nextPlayer && !nextPlayer.eliminated && (nextPlayer.type === 'ai' || nextPlayer.isAI)) {
          console.log(`🤖 Iniciando turno da IA: ${nextPlayer.name}`);
          
          // Ativar modal de feedback e bloqueio para a IA
          window.aiFeedbackModal?.startAITurn(nextPlayer);
          
          // Pequeno delay para UI atualizar
          setTimeout(() => {
            if (this.main.aiCoordinator) {
              this.main.aiCoordinator.checkAndExecuteAITurn();
            } else if (window.aiCoordinator) {
              window.aiCoordinator.checkAndExecuteAITurn();
            }
          }, 1500);
        } else {
          // Próximo jogador é humano - desbloquear controles e fechar modal
          window.aiFeedbackModal?.endAITurn(nextPlayer);
        }
      }, 1000);
    }
    
    saveGame();
  }
  
  applyIncome(player) {
    if (this.gameEnded) return;
    
    console.log(`💰 Aplicando renda para ${player.name} | Fase: ${gameState.currentPhase} | Jogador Atual: ${gameState.currentPlayerIndex}`);
    
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

        // Notificar renda no feedback modal da IA
        const resList = [];
        if (bonuses.madeira > 0) resList.push(`+${bonuses.madeira} Madeira`);
        if (bonuses.pedra > 0) resList.push(`+${bonuses.pedra} Pedra`);
        if (bonuses.ouro > 0) resList.push(`+${bonuses.ouro} Ouro`);
        if (bonuses.agua > 0) resList.push(`+${bonuses.agua} Água`);
        if (bonuses.pv > 0) resList.push(`+${bonuses.pv} PV`);

        window.aiFeedbackModal?.addActionNotification({
          title: 'Fase de Renda',
          description: resList.length > 0 ? `Renda recebida: ${resList.join(', ')}` : 'Renda de turno coletada.',
          icon: 'moedas',
          type: 'income'
        });

        if (!this.gameEnded) {
          setTimeout(() => {
            if (this.main.aiCoordinator) {
              this.main.aiCoordinator.checkAndExecuteAITurn();
            }
          }, 1000);
        }
      } else {
        // PARA HUMANO: Verificação dupla com delay maior
        setTimeout(() => {
          // VERIFICAÇÃO CRÍTICA DE SEGURANÇA
          const currentPhase = gameState.currentPhase;
          const currentPlayerId = gameState.currentPlayerIndex;
          
          if (currentPhase === 'renda' && currentPlayerId === player.id) {
            console.log(`✅ Abrindo modal de renda para ${player.name}`);
            
            if(window.uiManager && window.uiManager.modals && window.uiManager.modals.showIncomeModal) {
              window.uiManager.modals.showIncomeModal(player, bonuses);
            } else {
              // Fallback
              gameState.currentPhase = 'acoes';
              if(window.uiManager) window.uiManager.updateUI();
            }
          } else {
            console.warn(`⚠️ Modal de renda cancelado: Fase=${currentPhase} (esperado: renda), JogadorID=${player.id}, JogadorAtual=${currentPlayerId}`);
            
            // Se não estamos na fase correta, corrigir automaticamente
            if (currentPhase !== 'renda' && currentPlayerId === player.id) {
              console.log(`🔄 Corrigindo fase para 'renda' para jogador ${player.name}`);
              gameState.currentPhase = 'renda';
              
              // Tentar novamente após pequeno delay
              setTimeout(() => {
                if (gameState.currentPhase === 'renda' && gameState.currentPlayerIndex === player.id) {
                  if(window.uiManager && window.uiManager.modals && window.uiManager.modals.showIncomeModal) {
                    window.uiManager.modals.showIncomeModal(player, bonuses);
                  }
                }
              }, 200);
            }
          }
        }, 800); // Delay aumentado para garantir estabilidade
      }
    } else {
      console.log(`⏭️ Renda não aplicada: Player=${player.id}, CurrentPlayer=${gameState.currentPlayerIndex}, Phase=${gameState.currentPhase}`);
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
    
    // Verificar vitória por pontos
    const winner = gameState.players.find(p => p.victoryPoints >= GAME_CONFIG.VICTORY_POINTS);
    if (winner) {
      console.log(`🎉 Vitória detectada: ${winner.name} com ${winner.victoryPoints} PV`);
      this._declareVictory(winner);
      this._stopGameAfterVictory();
      return;
    }
    
    // Verificar vitória por eliminação
    const activePlayers = window.gameState?.getActivePlayers?.() || 
      gameState.players.filter(p => !p.eliminated);
    
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

  _getNextActivePlayer(startIndex) {
    const players = gameState.players;
    let nextIndex = (startIndex + 1) % players.length;
    let attempts = 0;
    
    // Procurar próximo jogador não eliminado
    while (attempts < players.length) {
      if (!players[nextIndex].eliminated) {
        return nextIndex;
      }
      nextIndex = (nextIndex + 1) % players.length;
      attempts++;
    }
    
    // Se todos eliminados, retornar -1
    return -1;
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
      if (window.uiManager.gameManager) {
        window.uiManager.gameManager.updateFooter();
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
      
      const phaseIndicator = document.getElementById('phaseIndicator');
      if (phaseIndicator) {
        phaseIndicator.textContent = '🎉 JOGO TERMINADO! 🎉';
        phaseIndicator.classList.add('text-yellow-400', 'font-bold');
      }
      
      window.uiManager.updateUI();
    }
  }
}