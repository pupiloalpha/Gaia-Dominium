// ui-footer-manager.js - Gerenciamento do Footer (REFATORADO)
import { gameState, getCurrentPlayer, getPendingNegotiationsForPlayer } from '../state/game-state.js';
import { RESOURCE_ICONS, UI_CONSTANTS } from '../state/game-config.js';

// Desestruturação das constantes de UI
const { ACTION_COSTS, PHASE_NAMES } = UI_CONSTANTS;

export class FooterManager {
  constructor(uiGameManager) {
    this.uiGameManager = uiGameManager;
    this.cacheFooterElements();
  }

  cacheFooterElements() {
    this.actionExploreBtn = document.getElementById('actionExplore');
    this.actionCollectBtn = document.getElementById('actionCollect');
    this.actionBuildBtn = document.getElementById('actionBuild');
    this.actionNegotiateBtn = document.getElementById('actionNegotiate');
    this.endTurnBtn = document.getElementById('endTurnBtn');
    this.actionsLeftEl = document.getElementById('actionsLeft');
    this.phaseIndicator = document.getElementById('phaseIndicator');
  }

  updateFooter() {
    if (this._isGameEnded()) {
      this._disableAllActions();
      return;
    }

    const player = getCurrentPlayer();
    const isEliminated = player?.eliminated;
    
    if (isEliminated) {
      this._handleEliminatedPlayerFooter(player);
      return;
    }
    
    if (!gameState.gameStarted) {
      this._handleGameNotStarted();
      return;
    }
    
    this._updatePhaseIndicator();
    this._updateActionButtons(player);
    this._updateActionsCounter();
    this._updateEndTurnButton(player);
  }

  _isGameEnded() {
    return this.uiGameManager.gameEnded || 
           (window.gameLogic && window.gameLogic.turnLogic && window.gameLogic.turnLogic.gameEnded);
  }

  _disableAllActions() {
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

  _handleEliminatedPlayerFooter(player) {
    [this.actionExploreBtn, this.actionCollectBtn, this.actionBuildBtn, this.actionNegotiateBtn, this.endTurnBtn]
      .forEach(btn => {
        if (btn) {
          if (btn === this.actionExploreBtn) {
            this._configureResurrectionButton(btn, player);
          } else {
            btn.disabled = true;
            btn.classList.add('opacity-30', 'cursor-not-allowed');
            btn.title = 'Jogador eliminado não pode realizar esta ação';
          }
        }
      });
    
    if (this.endTurnBtn) {
      this.endTurnBtn.disabled = false;
      this.endTurnBtn.textContent = 'Passar Turno';
      this.endTurnBtn.title = 'Jogador eliminado pode passar o turno';
    }
  }

  _configureResurrectionButton(btn, player) {
    if (gameState.selectedRegionId !== null) {
      const region = gameState.regions[gameState.selectedRegionId];
      if (region && region.controller === null) {
        btn.disabled = false;
        btn.classList.remove('opacity-30', 'cursor-not-allowed');
        btn.classList.add('bg-purple-600');
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
  }

  _handleGameNotStarted() {
    [this.actionExploreBtn, this.actionCollectBtn, this.actionBuildBtn, this.actionNegotiateBtn]
      .forEach(b => {
        if (b) b.disabled = true;
      });
    
    if (this.endTurnBtn) {
      this.endTurnBtn.disabled = true;
      this.endTurnBtn.textContent = 'Jogo não iniciado';
    }
  }

  _updatePhaseIndicator() {
    if (this.phaseIndicator) {
      this.phaseIndicator.textContent = `Fase: ${PHASE_NAMES[gameState.currentPhase] || 'Renda'}`;
    }
  }

  _updateActionButtons(player) {
    const regionId = gameState.selectedRegionId;
    const currentPhase = gameState.currentPhase || 'renda';
    const isActionPhase = currentPhase === 'acoes';
    const isNegotiationPhase = currentPhase === 'negociacao';
    const baseEnabled = gameState.actionsLeft > 0;
    
    if (regionId === null || regionId === undefined) {
      [this.actionExploreBtn, this.actionCollectBtn, this.actionBuildBtn]
        .forEach(btn => { if (btn) btn.disabled = true; });
    } else {
      const region = gameState.regions[regionId];
      if (!region) return;
      
      // Usar validação centralizada para todos os botões
      this._updateExploreButton(region, player, isActionPhase, baseEnabled);
      this._updateCollectButton(region, player, isActionPhase, baseEnabled); // CORREÇÃO APLICADA
      this._updateBuildButton(region, player, isActionPhase, baseEnabled);
    }
    
    this._updateNegotiateButton(player, isNegotiationPhase, baseEnabled);
  }

  _updateExploreButton(region, player, isActionPhase, baseEnabled) {
    if (!this.actionExploreBtn) return;
    
    // Usar validação centralizada do GameLogic
    const validation = window.gameLogic?.getActionValidation?.('explore');
    
    if (!isActionPhase) {
      this.actionExploreBtn.disabled = true;
      this.actionExploreBtn.title = 'Ação permitida apenas na fase de Ações (⚡).';
      return;
    }
    
    if (!validation || !validation.valid) {
      this.actionExploreBtn.disabled = true;
      this.actionExploreBtn.title = validation?.reason || 'Ação não disponível';
      return;
    }
    
    // Configurar botão baseado no tipo de ação
    this.actionExploreBtn.disabled = false;
    
    switch(validation.type) {
      case 'resurrect':
        this.actionExploreBtn.textContent = '💀 Ressuscitar';
        this.actionExploreBtn.classList.remove('bg-green-600', 'bg-yellow-600', 'bg-red-600');
        this.actionExploreBtn.classList.add('bg-purple-600');
        this.actionExploreBtn.title = 'Dominar região neutra para ressuscitar (custo: 2 PV + recursos do bioma)';
        break;
      case 'dominate':
        this.actionExploreBtn.textContent = 'Dominar';
        this.actionExploreBtn.classList.remove('bg-green-600', 'bg-red-600', 'bg-purple-600');
        this.actionExploreBtn.classList.add('bg-yellow-600');
        this.actionExploreBtn.title = 'Dominar região neutra (custo: 2 PV + recursos do bioma)';
        break;
      case 'explore':
        this.actionExploreBtn.textContent = 'Explorar';
        this.actionExploreBtn.classList.remove('bg-yellow-600', 'bg-red-600', 'bg-purple-600');
        this.actionExploreBtn.classList.add('bg-green-600');
        this.actionExploreBtn.title = 'Explorar região própria (custo: recursos)';
        break;
      case 'dispute':
        const enemyPlayer = gameState.players[region.controller];
        const disputeData = validation.data;
        let costInfo = `Custo: ${disputeData.finalCost.pv} PV, `;
        Object.entries(disputeData.finalCost).forEach(([res, amt]) => {
          if (res !== 'pv' && amt > 0) {
            costInfo += `${amt}${RESOURCE_ICONS[res]} ${res}, `;
          }
        });
        costInfo = costInfo.slice(0, -2);
        
        this.actionExploreBtn.textContent = 'Disputar';
        this.actionExploreBtn.classList.remove('bg-green-600', 'bg-yellow-600', 'bg-purple-600');
        this.actionExploreBtn.classList.add('bg-red-600');
        this.actionExploreBtn.title = `Disputar ${region.name} de ${enemyPlayer.name}\n${costInfo}\nChance: ${Math.round(disputeData.successChance)}%`;
        break;
      default:
        this.actionExploreBtn.disabled = true;
        this.actionExploreBtn.textContent = 'Explorar';
        this.actionExploreBtn.title = 'Ação não disponível';
    }
  }

  _updateCollectButton(region, player, isActionPhase, baseEnabled) {
    if (!this.actionCollectBtn) return;
    
    // Usar validação centralizada do GameLogic - CORREÇÃO APLICADA
    const validation = window.gameLogic?.getActionValidation?.('collect');
    const isOwnRegion = region.controller === player.id;
    const hasExploration = region.explorationLevel > 0;
    
    if (!isActionPhase) {
      this.actionCollectBtn.disabled = true;
      this.actionCollectBtn.title = 'Ação permitida apenas na fase de Ações (⚡).';
      return;
    }
    
    // Verificar se jogador pode coletar (tem madeira para custo)
    const canAfford = player.resources.madeira >= 1;
    
    // Determinar estado do botão
    this.actionCollectBtn.disabled = !baseEnabled || !isOwnRegion || !hasExploration || !canAfford || !validation?.valid;
    
    // Configurar tooltip informativo
    if (!isOwnRegion) {
      this.actionCollectBtn.title = 'Você não controla esta região';
    } else if (!hasExploration) {
      this.actionCollectBtn.title = 'Explore a região primeiro (nível > 0)';
    } else if (!canAfford) {
      this.actionCollectBtn.title = 'Necessário 1 🪵 Madeira para coletar';
    } else if (!validation?.valid) {
      this.actionCollectBtn.title = validation?.reason || 'Não é possível coletar';
    } else {
      this.actionCollectBtn.title = `Coletar recursos (custo: 1 🪵 Madeira)\nNível de exploração: ${region.explorationLevel}⭐`;
    }
    
    // Ajustar aparência do botão
    if (this.actionCollectBtn.disabled) {
      this.actionCollectBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
      this.actionCollectBtn.classList.add('bg-gray-600', 'opacity-50', 'cursor-not-allowed');
    } else {
      this.actionCollectBtn.classList.remove('bg-gray-600', 'opacity-50', 'cursor-not-allowed');
      this.actionCollectBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
    }
  }

  _updateBuildButton(region, player, isActionPhase, baseEnabled) {
    if (!this.actionBuildBtn) return;
    
    const validation = window.gameLogic?.getActionValidation?.('build');
    const isOwnRegion = region.controller === player.id;
    
    if (!isActionPhase) {
      this.actionBuildBtn.disabled = true;
      this.actionBuildBtn.title = 'Ação permitida apenas na fase de Ações (⚡).';
      return;
    }
    
    this.actionBuildBtn.disabled = !baseEnabled || !isOwnRegion || !validation?.valid;
    this.actionBuildBtn.title = validation?.reason || 'Construir estrutura';
    
    // Ajustar aparência do botão
    if (this.actionBuildBtn.disabled) {
      this.actionBuildBtn.classList.remove('bg-orange-600', 'hover:bg-orange-700');
      this.actionBuildBtn.classList.add('bg-gray-600', 'opacity-50', 'cursor-not-allowed');
    } else {
      this.actionBuildBtn.classList.remove('bg-gray-600', 'opacity-50', 'cursor-not-allowed');
      this.actionBuildBtn.classList.add('bg-orange-600', 'hover:bg-orange-700');
    }
  }

  _updateNegotiateButton(player, isNegotiationPhase, baseEnabled) {
    if (!this.actionNegotiateBtn) return;
    
    if (isNegotiationPhase) {
      const validation = window.gameLogic?.getActionValidation?.('negotiate');
      
      this.actionNegotiateBtn.disabled = !validation?.valid;
      
      if (!validation?.valid) {
        this.actionNegotiateBtn.title = validation?.reason || 'Negociação não disponível';
        this.actionNegotiateBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
        this.actionNegotiateBtn.classList.add('bg-gray-600', 'opacity-50', 'cursor-not-allowed');
      } else {
        this.actionNegotiateBtn.title = 'Abrir negociação (custo: 1 🪙 Ouro)';
        this.actionNegotiateBtn.classList.remove('bg-gray-600', 'opacity-50', 'cursor-not-allowed');
        this.actionNegotiateBtn.classList.add('bg-green-600', 'hover:bg-green-700');
      }
    } else {
      this.actionNegotiateBtn.disabled = true;
      this.actionNegotiateBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
      this.actionNegotiateBtn.classList.add('bg-gray-600', 'opacity-50', 'cursor-not-allowed');
      this.actionNegotiateBtn.title = 'Disponível apenas na fase de negociação';
    }
  }

  _updateActionsCounter() {
    if (this.actionsLeftEl) {
      this.actionsLeftEl.textContent = `Ações restantes: ${gameState.actionsLeft}`;
      
      // Destaque visual quando ações estão acabando
      if (gameState.actionsLeft === 1) {
        this.actionsLeftEl.classList.add('text-yellow-300', 'font-bold', 'animate-pulse');
      } else if (gameState.actionsLeft === 0) {
        this.actionsLeftEl.classList.add('text-red-400', 'font-bold');
        this.actionsLeftEl.classList.remove('text-yellow-300', 'animate-pulse');
      } else {
        this.actionsLeftEl.classList.remove('text-yellow-300', 'text-red-400', 'font-bold', 'animate-pulse');
      }
    }
  }

  _updateEndTurnButton(player) {
    if (!this.endTurnBtn) return;
    
    const pendingNegotiations = getPendingNegotiationsForPlayer(player.id);
    const hasPending = pendingNegotiations.length > 0;
    
    switch(gameState.currentPhase) {
      case 'acoes':
        this.endTurnBtn.disabled = false;
        this.endTurnBtn.textContent = 'Ir para Negociação';
        this.endTurnBtn.className = 'px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold transition';
        this.endTurnBtn.title = 'Avançar para fase de negociação';
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
        this.endTurnBtn.className = 'px-4 py-2 bg-gray-600 rounded-md text-white font-semibold cursor-not-allowed';
        this.endTurnBtn.title = 'Aguardando aplicação da renda';
        break;
      default:
        this.endTurnBtn.disabled = false;
        this.endTurnBtn.textContent = 'Terminar Turno';
        this.endTurnBtn.className = 'px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold transition';
        this.endTurnBtn.title = 'Finalizar fase atual';
    }
  }
}