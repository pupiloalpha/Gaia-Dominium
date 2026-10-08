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

    _setButtonContent(btn, icon, text) {
        if (!btn) return;
        const iconEl = btn.querySelector('.action-icon');
        const labelEl = btn.querySelector('.action-label');
        if (iconEl && labelEl) {
            iconEl.textContent = icon;
            labelEl.textContent = text;
        } else {
            btn.innerHTML = `<span class="action-icon">${icon}</span><span class="action-label">${text}</span>`;
        }
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
            this._setButtonContent(this.endTurnBtn, '🔄', 'Passar Turno');
            this.endTurnBtn.title = 'Jogador eliminado pode passar o turno';
        }
    }

    _configureResurrectionButton(btn, player) {
        this._setButtonContent(btn, '💀', 'Ressuscitar');
        if (gameState.selectedRegionId !== null) {
            const region = gameState.regions[gameState.selectedRegionId];
            if (region && region.controller === null) {
                btn.disabled = false;
                btn.classList.remove('opacity-30', 'cursor-not-allowed');
                btn.classList.add('bg-purple-600');
                btn.title = 'Dominar região neutra para ressuscitar (custo: 2 PV + recursos do bioma)';
            } else {
                btn.disabled = true;
                btn.classList.add('opacity-30', 'cursor-not-allowed');
                btn.title = 'Selecione uma região neutra para ressuscitar';
            }
        } else {
            btn.disabled = true;
            btn.classList.add('opacity-30', 'cursor-not-allowed');
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
            this._setButtonContent(this.endTurnBtn, '⏳', 'Não iniciado');
        }
    }

    _updatePhaseIndicator() {
        if (this.phaseIndicator) {
            const phaseName = PHASE_NAMES[gameState.currentPhase] || 'Renda';
            this.phaseIndicator.textContent = `Fase: ${phaseName}`;
            this.uiGameManager?.uiManager?.mobileManager?.updateForCurrentPhase?.(phaseName);
        }
    }

    _updateActionButtons(player) {
        const regionId = gameState.selectedRegionId;
        const currentPhase = gameState.currentPhase || 'renda';
        const isActionPhase = currentPhase === 'acoes';
        const isNegotiationPhase = currentPhase === 'negociacao';
        const baseEnabled = gameState.actionsLeft > 0;
        
        if (regionId === null || regionId === undefined) {
            this._resetExploreButtonAppearance();
            this._setButtonContent(this.actionExploreBtn, '⛏️', 'Explorar');
            this._setButtonContent(this.actionCollectBtn, '🌾', 'Coletar');
            this._setButtonContent(this.actionBuildBtn, '🏗️', 'Construir');
            [this.actionExploreBtn, this.actionCollectBtn, this.actionBuildBtn]
                .forEach(btn => { 
                    if (btn) {
                        btn.disabled = true;
                        btn.classList.add('opacity-50', 'cursor-not-allowed');
                    }
                });
        } else {
            const region = gameState.regions[regionId];
            if (!region) return;
            
            // Usar validação centralizada para todos os botões
            this._updateExploreButton(region, player, isActionPhase, baseEnabled);
            this._updateCollectButton(region, player, isActionPhase, baseEnabled);
            this._updateBuildButton(region, player, isActionPhase, baseEnabled);
        }
        
        this._updateNegotiateButton(player, isNegotiationPhase, baseEnabled);
    }

    _updateExploreButton(region, player, isActionPhase, baseEnabled) {
        if (!this.actionExploreBtn) return;
        
        // Resetar aparência primeiro
        this._resetExploreButtonAppearance();
        
        // Verificar se há região selecionada
        if (!region) {
            this.actionExploreBtn.disabled = true;
            this.actionExploreBtn.title = 'Selecione uma região primeiro';
            this._setButtonContent(this.actionExploreBtn, '⛏️', 'Explorar');
            return;
        }
        
        // Usar validação centralizada do GameLogic
        const validation = window.gameLogic?.getActionValidation?.('explore');
        
        if (!isActionPhase) {
            this.actionExploreBtn.disabled = true;
            this.actionExploreBtn.title = 'Ação permitida apenas na fase de Ações (⚡).';
            this._setButtonContent(this.actionExploreBtn, '⛏️', 'Explorar');
            return;
        }
        
        // CORREÇÃO CRÍTICA: Verificar validação primeiro
        if (!validation) {
            this.actionExploreBtn.disabled = true;
            this.actionExploreBtn.title = 'Validação não disponível';
            this._setButtonContent(this.actionExploreBtn, '⛏️', 'Explorar');
            return;
        }
        
        // CORREÇÃO: Verificar se há ações disponíveis
        if (gameState.actionsLeft <= 0) {
            this.actionExploreBtn.disabled = true;
            this.actionExploreBtn.title = 'Sem ações disponíveis';
            this._setButtonContent(this.actionExploreBtn, '⛏️', 'Explorar');
            return;
        }
        
        // Configurar botão baseado no tipo de ação
        this.actionExploreBtn.disabled = !validation.valid;
        
        if (!validation.valid) {
            this.actionExploreBtn.title = validation.reason || 'Ação não disponível';
            this._setButtonContent(this.actionExploreBtn, '⛏️', 'Explorar');
            return;
        }
        
        // CORREÇÃO: Apenas mudar texto e classe se a ação for válida
        switch(validation.type) {
            case 'resurrect':
                this._setButtonContent(this.actionExploreBtn, '💀', 'Ressuscitar');
                this.actionExploreBtn.classList.add('bg-purple-600');
                this.actionExploreBtn.title = 'Dominar região neutra para ressuscitar (custo: 2 PV + recursos do bioma)';
                break;
            case 'dominate':
                this._setButtonContent(this.actionExploreBtn, '🏴', 'Dominar');
                this.actionExploreBtn.classList.add('bg-yellow-600');
                this.actionExploreBtn.title = 'Dominar região neutra (custo: 2 PV + recursos do bioma)';
                break;
            case 'explore':
                this._setButtonContent(this.actionExploreBtn, '⛏️', 'Explorar');
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
                
                this._setButtonContent(this.actionExploreBtn, '⚔️', 'Disputar');
                this.actionExploreBtn.classList.add('bg-red-600');
                this.actionExploreBtn.title = `Disputar ${region.name} de ${enemyPlayer.name}\n${costInfo}\nChance: ${Math.round(disputeData.successChance)}%`;
                break;
            default:
                this._setButtonContent(this.actionExploreBtn, '⛏️', 'Explorar');
                this.actionExploreBtn.classList.add('bg-gray-600');
                this.actionExploreBtn.title = 'Ação não disponível';
        }
        
        // Remover classes de desabilitado se o botão estiver habilitado
        if (!this.actionExploreBtn.disabled) {
            this.actionExploreBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    _resetExploreButtonAppearance() {
        if (!this.actionExploreBtn) return;
        const colorClasses = ['bg-green-600', 'bg-yellow-600', 'bg-red-600', 'bg-purple-600', 'bg-gray-600'];
        colorClasses.forEach(cls => {
            this.actionExploreBtn.classList.remove(cls);
        });
    }

    _updateCollectButton(region, player, isActionPhase, baseEnabled) {
        if (!this.actionCollectBtn) return;
        this._setButtonContent(this.actionCollectBtn, '🌾', 'Coletar');
        
        // Usar validação centralizada do GameLogic
        const validation = window.gameLogic?.getActionValidation?.('collect');
        const isOwnRegion = region.controller === player.id;
        const hasExploration = region.explorationLevel > 0;
        
        if (!isActionPhase) {
            this.actionCollectBtn.disabled = true;
            this.actionCollectBtn.title = 'Ação permitida apenas na fase de Ações (⚡).';
            return;
        }
        
        // Determinar estado do botão usando validação centralizada
        if (validation && validation.valid) {
            this.actionCollectBtn.disabled = false;
            this.actionCollectBtn.title = `Coletar recursos (custo: 1 🪵 Madeira)\nNível de exploração: ${region.explorationLevel}⭐`;
            this.actionCollectBtn.classList.remove('bg-gray-600', 'opacity-50', 'cursor-not-allowed');
            this.actionCollectBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
        } else {
            this.actionCollectBtn.disabled = true;
            
            // Configurar tooltip informativo baseado na validação
            if (!isOwnRegion) {
                this.actionCollectBtn.title = 'Você não controla esta região';
            } else if (!hasExploration) {
                this.actionCollectBtn.title = 'Explore a região primeiro (nível > 0)';
            } else if (validation && validation.reason) {
                this.actionCollectBtn.title = validation.reason;
            } else {
                this.actionCollectBtn.title = 'Não é possível coletar nesta região';
            }
            
            this.actionCollectBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            this.actionCollectBtn.classList.add('bg-gray-600', 'opacity-50', 'cursor-not-allowed');
        }
    }

    _updateBuildButton(region, player, isActionPhase, baseEnabled) {
        if (!this.actionBuildBtn) return;
        this._setButtonContent(this.actionBuildBtn, '🏗️', 'Construir');
        
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
        this._setButtonContent(this.actionNegotiateBtn, '🤝', 'Negociar');
        
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
        
        // Limpar classes de cor dinâmicas
        const colorClasses = ['bg-blue-600', 'bg-yellow-600', 'bg-green-600', 'bg-gray-600', 'bg-rose-600', 'hover:bg-blue-700', 'hover:bg-yellow-700', 'hover:bg-green-700', 'animate-pulse', 'cursor-not-allowed'];
        colorClasses.forEach(cls => this.endTurnBtn.classList.remove(cls));
        
        switch(gameState.currentPhase) {
            case 'acoes':
                this.endTurnBtn.disabled = false;
                this._setButtonContent(this.endTurnBtn, '⚡', 'Ir para Negociação');
                this.endTurnBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
                this.endTurnBtn.title = 'Avançar para fase de negociação';
                break;
            case 'negociacao':
                this.endTurnBtn.disabled = false;
                
                if (hasPending) {
                    this._setButtonContent(this.endTurnBtn, '📬', `Terminar Turno (${pendingNegotiations.length})`);
                    this.endTurnBtn.classList.add('bg-yellow-600', 'hover:bg-yellow-700', 'animate-pulse');
                    this.endTurnBtn.title = `Você tem ${pendingNegotiations.length} proposta(s) de negociação pendente(s). Clique para verificar antes de terminar o turno.`;
                } else {
                    this._setButtonContent(this.endTurnBtn, '🔄', 'Terminar Turno');
                    this.endTurnBtn.classList.add('bg-green-600', 'hover:bg-green-700');
                    this.endTurnBtn.title = 'Finalizar seu turno e passar para o próximo jogador';
                }
                break;
            case 'renda':
                this.endTurnBtn.disabled = true;
                this._setButtonContent(this.endTurnBtn, '⏳', 'Aguardando...');
                this.endTurnBtn.classList.add('bg-gray-600', 'cursor-not-allowed');
                this.endTurnBtn.title = 'Aguardando aplicação da renda';
                break;
            default:
                this.endTurnBtn.disabled = false;
                this._setButtonContent(this.endTurnBtn, '🔄', 'Terminar Turno');
                this.endTurnBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
                this.endTurnBtn.title = 'Finalizar fase atual';
        }
    }
}