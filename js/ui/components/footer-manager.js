// footer-manager.js - Gerenciador do Footer
import { gameState, getCurrentPlayer, getPendingNegotiationsForPlayer } from '../state/game-state.js';
import { RESOURCE_ICONS, GAME_CONFIG } from '../state/game-config.js';
import { FeedbackService } from '../utils/feedback-service.js';

const ACTION_COSTS = {
  'explorar': { madeira: 2, agua: 1 },
  'recolher': { madeira: 1 },
  'construir': { madeira: 3, pedra: 2, ouro: 1 },
  'negociar': { ouro: 1 }
};

const PHASE_NAMES = {
  'renda': '💰 Renda',
  'acoes': '⚡ Ações',
  'negociacao': '🤝 Negociação'
};

export class FooterManager {
  constructor(uiGameManager) {
    this.uiGameManager = uiGameManager;
    this.cacheElements();
  }

  cacheElements() {
    this.actionExploreBtn = document.getElementById('actionExplore');
    this.actionCollectBtn = document.getElementById('actionCollect');
    this.actionBuildBtn = document.getElementById('actionBuild');
    this.actionNegotiateBtn = document.getElementById('actionNegotiate');
    this.endTurnBtn = document.getElementById('endTurnBtn');
    this.actionsLeftEl = document.getElementById('actionsLeft');
    this.phaseIndicator = document.getElementById('phaseIndicator');
  }

  update() {
    // Verificar se o jogo terminou
    if (this.isGameEnded()) {
      this.disableAllActions();
      return;
    }

    const player = getCurrentPlayer();
    const isEliminated = player?.eliminated;

    if (isEliminated) {
      this.handleEliminatedPlayer(player);
      return;
    }

    this.updateActionButtons(player);
    this.updateEndTurnButton(player);
    this.updateActionsLeft();
    this.updatePhaseIndicator();
  }

  isGameEnded() {
    return window.gameLogic?.turnLogic?.gameEnded || false;
  }

  disableAllActions() {
    [this.actionExploreBtn, this.actionCollectBtn, this.actionBuildBtn, this.actionNegotiateBtn, this.endTurnBtn]
      .forEach(b => {
        if (b) {
          b.disabled = true;
          b.classList.add('opacity-30', 'cursor-not-allowed');
        }
      });
    
    if (this.phaseIndicator) {
      this.phaseIndicator.textContent = '🎉 JOGO TERMINADO!';
      this.phaseIndicator.classList.add('text-yellow-400', 'font-bold');
    }
  }

  handleEliminatedPlayer(player) {
    [this.actionExploreBtn, this.actionCollectBtn, this.actionBuildBtn, this.actionNegotiateBtn, this.endTurnBtn]
      .forEach(btn => {
        if (!btn) return;
        
        if (btn === this.actionExploreBtn) {
          if (gameState.selectedRegionId !== null) {
            const region = gameState.regions[gameState.selectedRegionId];
            if (region && region.controller === null) {
              btn.disabled = false;
              btn.classList.remove('opacity-30', 'cursor-not-allowed');
              btn.classList.add('bg-yellow-600');
              btn.textContent = '💀 Ressuscitar';
              btn.title = 'Dominar região neutra para ressuscitar (custo: 2 PV + recursos do bioma)';
            } else {
              btn.disabled = true;
              btn.classList.add('opacity-30', 'cursor-not-allowed');
              btn.textContent = '💀 Ressuscitar';
              btn.title = 'Selecione uma região neutra para ressuscitar';
            }
          } else {
            btn.disabled = true;
            btn.classList.add('opacity-30', 'cursor-not-allowed');
            btn.textContent = '💀 Ressuscitar';
            btn.title = 'Selecione uma região neutra para ressuscitar';
          }
        } else {
          btn.disabled = true;
          btn.classList.add('opacity-30', 'cursor-not-allowed');
          btn.title = 'Jogador eliminado não pode realizar esta ação';
        }
      });
    
    if (this.endTurnBtn) {
      this.endTurnBtn.disabled = false;
      this.endTurnBtn.textContent = 'Passar Turno';
      this.endTurnBtn.title = 'Jogador eliminado pode passar o turno';
    }
  }

  updateActionButtons(player) {
    if (!gameState.gameStarted) {
      [this.actionExploreBtn, this.actionCollectBtn, this.actionBuildBtn, this.actionNegotiateBtn]
        .forEach(b => { if (b) b.disabled = true; });
      
      if (this.endTurnBtn) {
        this.endTurnBtn.disabled = true;
        this.endTurnBtn.textContent = 'Jogo não iniciado';
      }
      return;
    }

    const regionId = gameState.selectedRegionId;
    const currentPhase = gameState.currentPhase || 'renda';
    const isActionPhase = currentPhase === 'acoes';
    const isNegotiationPhase = currentPhase === 'negociacao';
    
    const baseEnabled = gameState.actionsLeft > 0;

    // Botão Explorar/Dominar/Disputar
    if (regionId === null || regionId === undefined) {
      if (this.actionExploreBtn) this.actionExploreBtn.disabled = true;
      if (this.actionCollectBtn) this.actionCollectBtn.disabled = true;
      if (this.actionBuildBtn) this.actionBuildBtn.disabled = true;
    } else {
      const region = gameState.regions[regionId];
      if (!region) return;
      
      const isOwnRegion = region.controller === player.id;
      const isNeutral = region.controller === null;
      const isEnemyRegion = !isOwnRegion && !isNeutral;
      const canCollect = isOwnRegion && region.explorationLevel > 0;
      
      this.updateExploreButton(player, region, baseEnabled, isActionPhase, isOwnRegion, isNeutral, isEnemyRegion);
      this.updateCollectButton(baseEnabled, isActionPhase, canCollect, player);
      this.updateBuildButton(baseEnabled, isActionPhase, isOwnRegion, player);
    }

    // Botão Negociar
    this.updateNegotiateButton(player, isNegotiationPhase, baseEnabled);
  }

  updateExploreButton(player, region, baseEnabled, isActionPhase, isOwnRegion, isNeutral, isEnemyRegion) {
    if (!this.actionExploreBtn) return;

    let exploreReason = '';

    if (!isActionPhase) {
      exploreReason = 'Ação permitida apenas na fase de Ações (⚡).';
      this.actionExploreBtn.disabled = true;
      return;
    }

    if (isNeutral) {
      // Lógica para Dominar
      const hasEnoughPV = player.victoryPoints >= 2;
      const canPayBiome = Object.entries(region.resources)
        .every(([key, value]) => player.resources[key] >= value);

      this.actionExploreBtn.disabled = !baseEnabled || !hasEnoughPV || !canPayBiome;
      this.actionExploreBtn.textContent = 'Dominar';
      this.actionExploreBtn.classList.remove('bg-green-600', 'bg-red-600');
      this.actionExploreBtn.classList.add('bg-yellow-600');
      this.actionExploreBtn.title = 'Dominar região neutra (custo: 2 PV + recursos do bioma)';
      
      if (this.actionExploreBtn.disabled) {
        if (!hasEnoughPV) exploreReason = 'Requer 2 PVs (Pontos de Vitória).';
        else if (!canPayBiome) exploreReason = 'Recursos de Bioma insuficientes.';
      }
    } else if (isOwnRegion) {
      // Lógica para Explorar
      this.actionExploreBtn.disabled = !baseEnabled;
      this.actionExploreBtn.textContent = 'Explorar';
      this.actionExploreBtn.classList.remove('bg-yellow-600', 'bg-red-600');
      this.actionExploreBtn.classList.add('bg-green-600');
      this.actionExploreBtn.title = 'Explorar região própria (ação gratuita)';
    } else if (isEnemyRegion) {
      // Lógica para Disputar
      this.updateDisputeButton(player, region, baseEnabled);
    } else {
      this.actionExploreBtn.disabled = true;
      this.actionExploreBtn.textContent = 'Explorar';
      exploreReason = `Região controlada por ${gameState.players[region.controller].name}.`;
    }

    if (exploreReason) {
      this.actionExploreBtn.title = exploreReason;
    }
  }

  updateDisputeButton(player, region, baseEnabled) {
    const enemyPlayer = gameState.players[region.controller];
    let canAffordDispute = false;
    let disputeCostInfo = '';
    
    if (window.gameLogic?.disputeLogic) {
      const disputeData = window.gameLogic.disputeLogic.calculateDisputeCosts(player, region);
      const finalCost = disputeData.finalCost;
      
      canAffordDispute = Object.entries(finalCost).every(([resource, amount]) => {
        if (resource === 'pv') {
          if (player.victoryPoints < amount) {
            disputeCostInfo = `Necessário ${amount} PV (você tem: ${player.victoryPoints})`;
            return false;
          }
          return true;
        }
        if ((player.resources[resource] || 0) < amount) {
          disputeCostInfo = `Necessário ${amount} ${RESOURCE_ICONS[resource]} ${resource} (você tem: ${player.resources[resource] || 0})`;
          return false;
        }
        return true;
      });
      
      if (canAffordDispute) {
        disputeCostInfo = `Custo: ${finalCost.pv} PV, `;
        Object.entries(finalCost).forEach(([res, amt]) => {
          if (res !== 'pv' && amt > 0) {
            disputeCostInfo += `${amt}${RESOURCE_ICONS[res]} ${res}, `;
          }
        });
        disputeCostInfo = disputeCostInfo.slice(0, -2);
      }
    }
    
    this.actionExploreBtn.disabled = !baseEnabled || !canAffordDispute;
    this.actionExploreBtn.textContent = 'Disputar';
    this.actionExploreBtn.classList.remove('bg-green-600', 'bg-yellow-600');
    this.actionExploreBtn.classList.add(canAffordDispute ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600');
    this.actionExploreBtn.title = canAffordDispute ? 
      `Disputar ${region.name} de ${enemyPlayer.name}\n${disputeCostInfo}` : 
      `Recursos insuficientes para disputar\n${disputeCostInfo}`;
    
    if (!canAffordDispute) {
      this.actionExploreBtn.classList.add('opacity-70', 'cursor-not-allowed');
    } else {
      this.actionExploreBtn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
  }

  updateCollectButton(baseEnabled, isActionPhase, canCollect, player) {
    if (!this.actionCollectBtn) return;
    
    this.actionCollectBtn.disabled = !baseEnabled || !isActionPhase || !canCollect || 
      !this.canPlayerAffordAction('recolher', player);
  }

  updateBuildButton(baseEnabled, isActionPhase, isOwnRegion, player) {
    if (!this.actionBuildBtn) return;
    
    this.actionBuildBtn.disabled = !baseEnabled || !isActionPhase || !isOwnRegion || 
      !this.canPlayerAffordAction('construir', player);
  }

  updateNegotiateButton(player, isNegotiationPhase, baseEnabled) {
    if (!this.actionNegotiateBtn) return;
    
    if (isNegotiationPhase) {
      const hasGold = player.resources.ouro >= 1;
      const hasActions = gameState.actionsLeft > 0;
      
      this.actionNegotiateBtn.disabled = !hasGold || !hasActions;
      
      if (!hasGold) {
        this.actionNegotiateBtn.title = 'Necessita 1 Ouro';
      } else if (!hasActions) {
        this.actionNegotiateBtn.title = 'Sem ações restantes';
      } else {
        this.actionNegotiateBtn.title = 'Abrir negociação';
      }
      
      this.actionNegotiateBtn.classList.remove('bg-gray-600', 'opacity-50');
      this.actionNegotiateBtn.classList.add('bg-green-600');
    } else {
      this.actionNegotiateBtn.disabled = true;
      this.actionNegotiateBtn.classList.remove('bg-green-600');
      this.actionNegotiateBtn.classList.add('bg-gray-600', 'opacity-50');
      this.actionNegotiateBtn.title = 'Disponível apenas na fase de negociação';
    }
  }

  updateEndTurnButton(player) {
    if (!this.endTurnBtn) return;

    const pendingNegotiations = getPendingNegotiationsForPlayer(player.id);
    const hasPending = pendingNegotiations.length > 0;
    
    switch(gameState.currentPhase) {
      case 'acoes':
        this.endTurnBtn.disabled = false;
        this.endTurnBtn.textContent = 'Ir para Negociação';
        this.endTurnBtn.className = 'px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold transition';
        break;
      case 'negociacao':
        this.endTurnBtn.disabled = false;
        
        if (hasPending) {
          this.endTurnBtn.textContent = `Terminar Turno (${pendingNegotiations.length} pendente(s))`;
          this.endTurnBtn.className = 'px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-md text-white font-semibold transition animate-pulse';
          this.endTurnBtn.title = `Você tem ${pendingNegotiations.length} proposta(s) de negociação pendente(s). Clique para verificar antes de terminar o turno.`;
        } else {
          this.endTurnBtn.textContent = 'Terminar Turno';
          this.endTurnBtn.className = 'px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-semibold transition';
          this.endTurnBtn.title = 'Finalizar seu turno e passar para o próximo jogador';
        }
        break;
      case 'renda':
        this.endTurnBtn.disabled = true;
        this.endTurnBtn.textContent = 'Aguardando...';
        this.endTurnBtn.className = 'px-4 py-2 bg-gray-600 rounded-md text-white font-semibold';
        break;
      default:
        this.endTurnBtn.disabled = false;
        this.endTurnBtn.textContent = 'Terminar Turno';
        this.endTurnBtn.className = 'px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold transition';
    }
  }

  updateActionsLeft() {
    if (this.actionsLeftEl) {
      this.actionsLeftEl.textContent = `Ações restantes: ${gameState.actionsLeft}`;
    }
  }

  updatePhaseIndicator() {
    if (this.phaseIndicator) {
      this.phaseIndicator.textContent = `Fase: ${PHASE_NAMES[gameState.currentPhase] || 'Renda'}`;
    }
  }

  canPlayerAffordAction(actionType, player) {
    const cost = ACTION_COSTS[actionType] || {};
    return Object.entries(cost).every(([resource, amount]) => {
      return (player.resources[resource] || 0) >= amount;
    });
  }

  handleExploreWithContext() {
    if (gameState.selectedRegionId === null) {
      FeedbackService.showFeedback('Selecione uma região primeiro.', 'error');
      return;
    }
    
    const region = gameState.regions[gameState.selectedRegionId];
    const player = getCurrentPlayer();
    
    if (player.eliminated) {
      if (region.controller === null) {
        window.gameLogic.handleExplore();
      } else {
        FeedbackService.showFeedback('Jogador eliminado só pode dominar regiões neutras.', 'error');
      }
      return;
    }
    
    if (region.controller === null) {
      window.gameLogic.handleExplore();
    } else if (region.controller === player.id) {
      window.gameLogic.handleExplore();
    } else {
      this.uiGameManager.getUiManager().disputeUI.openDisputeModal(region.id);
    }
  }
}
