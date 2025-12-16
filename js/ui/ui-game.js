// ui-game.js - Interface do Jogo (Navbar, Sidebar, Board, Footer)
import {
    gameState,
    achievementsState,
    getCurrentPlayer,
    activityLogHistory,
    getPendingNegotiationsForPlayer
} from '../state/game-state.js';
import { GAME_CONFIG, RESOURCE_ICONS, ACHIEVEMENTS_CONFIG } from '../state/game-config.js';

const LOG_ICONS = {
    'action': '⚡',
    'build': '🏗️',
    'explore': '⛏️',
    'collect': '🌾',
    'negotiate': '🤝',
    'event': '🎴',
    'victory': '🏆',
    'phase': '🔄',
    'turn': '📅',
    'system': '⚙️',
    'income': '💰',
    'default': '📝'
};

const PHASE_NAMES = {
    'renda': '💰 Renda',
    'acoes': '⚡ Ações',
    'negociacao': '🤝 Negociação'
};

const ACTION_COSTS = {
    'explorar': { madeira: 2, agua: 1 },
    'recolher': { madeira: 1 },
    'construir': { madeira: 3, pedra: 2, ouro: 1 },
    'negociar': { ouro: 1 }
};

export class UIGameManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.cacheElements();
    }

    cacheElements() {
        console.log("🔄 Cacheando elementos do jogo...");
        
        // Elementos principais
        this.initialScreen = document.getElementById('initialScreen');
        this.gameNavbar = document.getElementById('gameNavbar');
        this.gameContainer = document.getElementById('gameContainer');
        this.sidebar = document.getElementById('sidebar');
        this.gameMap = document.getElementById('gameMap');
        this.gameFooter = document.getElementById('gameFooter');
        
        // Container do tabuleiro - ESSENCIAL
        this.boardContainer = document.getElementById('boardContainer');
        
        // Elementos da interface do jogo
        this.playerHeaderList = document.getElementById('playerHeaderList');
        this.sidebarPlayerHeader = document.getElementById('sidebarPlayerHeader');
        this.resourceList = document.getElementById('resourceList');
        this.controlledRegions = document.getElementById('controlledRegions');
        this.achievementsList = document.getElementById('achievementsList');
        
        // Botões de ação
        this.actionExploreBtn = document.getElementById('actionExplore');
        this.actionCollectBtn = document.getElementById('actionCollect');
        this.actionBuildBtn = document.getElementById('actionBuild');
        this.actionNegotiateBtn = document.getElementById('actionNegotiate');
        this.endTurnBtn = document.getElementById('endTurnBtn');
        
        // Elementos de informação
        this.actionsLeftEl = document.getElementById('actionsLeft');
        this.phaseIndicator = document.getElementById('phaseIndicator');
        this.turnInfo = document.getElementById('turnInfo');
        
        // Elementos do log de atividades
        this.logEntriesSidebar = document.getElementById('logEntriesSidebar');
        this.logFilterAllSidebar = document.getElementById('logFilterAllSidebar');
        this.logFilterMineSidebar = document.getElementById('logFilterMineSidebar');
        this.logFilterEventsSidebar = document.getElementById('logFilterEventsSidebar');
        
        // Tooltip
        this.regionTooltip = document.getElementById('regionTooltip');
        this.tooltipTitle = document.getElementById('tooltipTitle');
        this.tooltipBody = document.getElementById('tooltipBody');
        
        console.log("✅ Elementos do jogo cacheados:", {
            boardContainer: !!this.boardContainer,
            playerHeaderList: !!this.playerHeaderList,
            sidebarPlayerHeader: !!this.sidebarPlayerHeader
        });
    }

    init() {
        this.setupEventListeners();
        this.setupTransparencyControls();
    }

    // ==================== RENDERIZAÇÃO DO JOGO ====================

    updateUI() {
        this.renderHeaderPlayers();
        this.renderBoard();
        this.renderSidebar(gameState.selectedPlayerForSidebar);
        this.updateFooter();
        this.updateTurnInfo();
        this.updatePhaseIndicator();
        this.renderActivityLog();
    }

    renderHeaderPlayers() {
        if (!this.playerHeaderList) return;
        
        this.playerHeaderList.innerHTML = gameState.players.map((p, i) => `
            <button data-index="${i}" 
                    class="px-3 py-1 rounded-lg ${i === gameState.currentPlayerIndex ? 'ring-2 ring-yellow-300' : 'bg-white/5'} 
                           text-white text-sm flex items-center gap-2">
                <div class="text-xl">${p.icon}</div>
                <div>
                    <div class="font-medium">${p.name}</div>
                    <div class="text-xs text-yellow-400">${p.victoryPoints} PV</div>
                </div>
            </button>
        `).join('');
    }

    renderBoard() {
        // VERIFICAÇÃO DE SEGURANÇA
        if (!this.boardContainer) {
            console.error("❌ boardContainer não disponível. Tentando recachear...");
            this.boardContainer = document.getElementById('boardContainer');
            
            if (!this.boardContainer) {
                console.error("❌ boardContainer ainda não encontrado após recache!");
                return;
            }
        }
        
        this.boardContainer.innerHTML = '';
        gameState.regions.forEach((region, index) => {
            const cell = this.createRegionCell(region, index);
            this.boardContainer.appendChild(cell);
        });
    }

    createRegionCell(region, index) {
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.dataset.regionId = region.id;
        cell.dataset.region = String.fromCharCode(65 + region.id);
        
        // Adicionar classes baseadas no estado
        if (region.controller === gameState.currentPlayerIndex) {
            cell.classList.add('player-owned');
        }

        if (region.controller === null) {
            cell.classList.add('neutral-available');
        }

        // Verificar se há ações disponíveis nesta região
        const currentPlayer = getCurrentPlayer();
        if (currentPlayer && region.controller === currentPlayer.id && region.explorationLevel > 0) {
            cell.classList.add('action-available');
            cell.classList.add('clickable');
        }

        // Adicionar contador de ações disponíveis (se aplicável)
        if (gameState.actionsLeft > 0) {
            const actionCounter = document.createElement('div');
            actionCounter.className = 'action-counter';
            actionCounter.textContent = `${gameState.actionsLeft}A`;
            cell.appendChild(actionCounter);
        }

        if (region.controller !== null) {
            cell.classList.add('controlled');
            const player = gameState.players[region.controller];
            const rgb = this.hexToRgb(player.color);
            cell.style.setProperty('--player-rgb', rgb.join(', '));
            cell.style.setProperty('--player-color', player.color);
        } else {
            cell.classList.add('neutral');
        }
        
        const header = document.createElement('div');
        header.className = 'flex items-start justify-between mb-1';
        header.innerHTML = `
            <div>
                <div class="text-xs font-bold text-white leading-tight">${region.name}</div>
                <div class="text-[9px] text-gray-300 mt-0.5">${region.biome}</div>
            </div>
            <div class="text-xs text-yellow-300 font-bold flex items-center gap-0.5">
                ${region.explorationLevel}<span class="text-[10px]">⭐</span>
            </div>
        `;
        
        const resourcesLine = document.createElement('div');
        resourcesLine.className = 'flex items-center justify-between gap-1 mt-1';
        
        const resourceOrder = ['madeira', 'pedra', 'ouro', 'agua'];
        const resourcePairs = [];
        
        resourceOrder.forEach(key => {
            const value = region.resources[key] || 0;
            if (value > 0) {
                resourcePairs.push({
                    icon: RESOURCE_ICONS[key],
                    value: value,
                    key: key
                });
            }
        });
        
        resourcePairs.forEach((resource, idx) => {
            const pair = document.createElement('div');
            pair.className = 'flex items-center gap-0.5 flex-1 justify-center';
            pair.innerHTML = `
                <span class="text-xs">${resource.icon}</span>
                <span class="text-xs font-bold text-white">${resource.value}</span>
            `;
            resourcesLine.appendChild(pair);
        });
        
        if (resourcePairs.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.className = 'text-[9px] text-gray-400 italic flex-1 text-center';
            placeholder.textContent = 'Sem recursos';
            resourcesLine.appendChild(placeholder);
        }
        
        const footer = document.createElement('div');
        footer.className = 'flex items-center justify-between mt-2 pt-1 border-t border-white/5';
        
        const controller = region.controller !== null 
            ? gameState.players[region.controller].icon
            : '<span class="text-gray-400 text-xs">🏳️</span>';

        let structureDisplay = '—';
        if (region.structures.length > 0) {
            const structureIcons = {
                'Abrigo': '🛖',
                'Torre de Vigia': '🏯',
                'Mercado': '🏪',
                'Laboratório': '🔬',
                'Santuário': '🛐'
            };
            
            structureDisplay = structureIcons[region.structures[0]] || '🏗️';
            if (region.structures.length > 1) {
                structureDisplay += `+${region.structures.length - 1}`;
            }
        }

        footer.innerHTML = `
            <div class="text-xs font-medium text-white">${controller}</div>
            <div class="text-xs">${structureDisplay}</div>
        `;
        
        cell.appendChild(header);
        cell.appendChild(resourcesLine);
        cell.appendChild(footer);
        
        cell.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const regionId = Number(cell.dataset.regionId);
            
            // Verificar se não está clicando em um modal
            const clickedInModal = e.target.closest('[id$="Modal"]') || 
                                e.target.closest('#negotiationModal') || 
                                e.target.closest('#negResponseModal');
            
            if (clickedInModal) return;
            
            // Alternar seleção
            if (gameState.selectedRegionId === regionId) {
                gameState.selectedRegionId = null;
                cell.classList.remove('region-selected');
            } else {
                const previousSelected = gameState.selectedRegionId;
                gameState.selectedRegionId = regionId;
                
                if (previousSelected !== null) {
                    const prevCell = document.querySelector(`.board-cell[data-region-id="${previousSelected}"]`);
                    if (prevCell) prevCell.classList.remove('region-selected');
                }
                
                cell.classList.add('region-selected');
            }
            
            this.renderSidebar(gameState.selectedPlayerForSidebar);
            this.updateFooter();
        });
        
        // Tooltip events
        cell.addEventListener('mouseenter', (e) => this.showRegionTooltip(region, e.currentTarget));
        cell.addEventListener('mousemove', (e) => this.positionTooltip(e.currentTarget));
        cell.addEventListener('mouseleave', () => this.hideRegionTooltip());
        
        return cell;
    }

    renderSidebar(playerIndex = gameState.selectedPlayerForSidebar) {
    const player = gameState.players[playerIndex];
    if (!player) return;
    
    const isCurrentPlayer = playerIndex === gameState.currentPlayerIndex;
    const faction = player.faction;
    const factionColor = player.color; // Usar a cor do jogador (da facção)
    
    this.sidebarPlayerHeader.innerHTML = `
        <div class="flex items-center gap-3 p-2 rounded-lg" 
             style="border-left: 4px solid ${player.color}; background: rgba(${this.hexToRgb(player.color).join(', ')}, 0.05)">
            <div class="text-3xl">${player.icon}</div>
            <div class="flex-1">
                <div class="text-base font-semibold text-white">${player.name}</div>
                <div class="text-xs text-gray-300 mb-1">
                    Jogador ${player.id + 1} ${isCurrentPlayer ? '• 🎮 TURNO' : ''}
                </div>
                ${faction ? `
                <div class="text-xs font-medium flex items-center gap-1" style="color: ${factionColor}">
                    <span class="text-sm">${faction.icon || '🏛️'}</span>
                    <span>${faction.name}</span>
                </div>
                ` : '<div class="text-xs text-gray-400">Sem facção</div>'}
            </div>
            <div class="text-2xl font-bold text-yellow-400">${player.victoryPoints} PV</div>
        </div>
    `;
    
    this.resourceList.innerHTML = Object.entries(player.resources)
        .map(([key, value]) => `
            <li class="flex justify-between items-center py-0.5">
                <span class="text-sm text-gray-200 flex items-center gap-1.5">
                    <span class="text-base">${RESOURCE_ICONS[key]}</span>
                    <span class="capitalize">${key}</span>
                </span>
                <span class="text-sm font-bold text-white">${value}</span>
                </li>
            `).join('');
    
    this.renderControlledRegions(player);
    this.renderAchievementsInSidebar(playerIndex);
    this.renderActivityLog('all');
}

    renderAchievementsInSidebar(playerIndex) {
        const achievementsList = document.getElementById('achievementsList');
        if (!achievementsList || !achievementsState) return;

        // Verificação de segurança
        if (typeof achievementsState === 'undefined' || !achievementsState.playerAchievements) {
            achievementsList.innerHTML = '<p class="text-xs text-gray-400">Carregando conquistas...</p>';
            return;
        }
        
        const playerStats = achievementsState.playerAchievements?.[playerIndex] || {
            explored: 0,
            built: 0,
            negotiated: 0,
            collected: 0,
            controlledBiomes: new Set(),
            maxResources: { madeira: 0, pedra: 0, ouro: 0, agua: 0 }
        };
        
        const unlocked = achievementsState.unlockedAchievements?.[playerIndex] || [];
        
        if (unlocked.length === 0) {
            achievementsList.innerHTML = '<p class="text-xs text-gray-400">Nenhuma conquista ainda</p>';
            return;
        }
        
        let html = '';
        const achievementsToShow = unlocked.slice(0, 3);
        
        achievementsToShow.forEach(achievementId => {
            // Encontrar a conquista pelo ID
            let achievement;
            for (const key in ACHIEVEMENTS_CONFIG) {
                if (ACHIEVEMENTS_CONFIG[key].id === achievementId) {
                    achievement = ACHIEVEMENTS_CONFIG[key];
                    break;
                }
            }
            
            if (achievement) {
                html += `
                    <div class="flex items-center gap-2 p-2 bg-gray-800/30 rounded border border-yellow-500/20">
                        <span class="text-lg">${achievement.icon}</span>
                        <div class="text-xs">
                            <div class="text-yellow-300 font-semibold">${achievement.name}</div>
                            <div class="text-gray-400 truncate">${achievement.description}</div>
                        </div>
                    </div>
                `;
            }
        });
        
        if (unlocked.length > 3) {
            html += `<div class="text-center text-xs text-gray-500 mt-1">
                +${unlocked.length - 3} mais conquistas
            </div>`;
        }
        
        achievementsList.innerHTML = html;
    }

    renderControlledRegions(player) {
        if (player.regions.length === 0) {
            this.controlledRegions.innerHTML = `
                <div class="text-sm text-gray-400 italic">Nenhuma região controlada</div>
            `;
            return;
        }
        
        const regionsByBiome = {};
        player.regions.forEach(regionId => {
            const region = gameState.regions[regionId];
            if (!regionsByBiome[region.biome]) {
                regionsByBiome[region.biome] = [];
            }
            regionsByBiome[region.biome].push(region);
        });
        
        const biomeEmojis = {
            'Floresta Tropical': '🌴',
            'Floresta Temperada': '🌲',
            'Savana': '🏜️',
            'Pântano': '🌊'
        };
        
        this.controlledRegions.innerHTML = Object.entries(regionsByBiome)
            .map(([biome, regions]) => {
                const regionLetters = regions.map(r => r.name.split(' ').pop());
                return `
                    <div class="mb-2">
                        <div class="text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1">
                            <span>${biomeEmojis[biome] || '🗺️'}</span>
                            <span>${biome}</span>
                            <span class="text-yellow-400">(${regions.length})</span>
                        </div>
                        <div class="flex flex-wrap gap-1">
                            ${regionLetters.map(letter => `
                                <span class="text-xs font-medium bg-white/5 px-1.5 py-0.5 rounded border border-white/10" 
                                      style="border-left: 3px solid ${player.color}">
                                    ${letter}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('');
    }

    updateFooter() {
        // Se o jogo terminou, desabilitar tudo
        if (this.gameEnded || (window.gameLogic && window.gameLogic.turnLogic && window.gameLogic.turnLogic.gameEnded)) {
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
            return;
        }

        if (!gameState.gameStarted) {
            [this.actionExploreBtn, this.actionCollectBtn, this.actionBuildBtn, this.actionNegotiateBtn]
                .forEach(b => {
                    if (b) b.disabled = true;
                });
            
            if (this.endTurnBtn) {
                this.endTurnBtn.disabled = true;
                this.endTurnBtn.textContent = 'Jogo não iniciado';
            }
            return;
        }
        
        const player = gameState.players[gameState.currentPlayerIndex];
        const regionId = gameState.selectedRegionId;
        const currentPhase = gameState.currentPhase || 'renda';
        const isActionPhase = currentPhase === 'acoes';
        const isNegotiationPhase = currentPhase === 'negociacao';
        
        this.updatePhaseIndicator();
        
        if (!player) return;
        
        const baseEnabled = gameState.actionsLeft > 0;
        
        // Botão Explorar
        if (regionId === null || regionId === undefined) {
            if (this.actionExploreBtn) this.actionExploreBtn.disabled = true;
            if (this.actionCollectBtn) this.actionCollectBtn.disabled = true;
            if (this.actionBuildBtn) this.actionBuildBtn.disabled = true;
        } else {
            const region = gameState.regions[regionId];
            if (!region) return;
            
            const isOwnRegion = region.controller === player.id;
            const isNeutral = region.controller === null;
            const canCollect = isOwnRegion && region.explorationLevel > 0;
            
            const actionExploreCost = ACTION_COSTS['explorar'];
            let exploreReason = '';

            if (!isActionPhase) {
                exploreReason = 'Ação permitida apenas na fase de Ações (⚡).';
            } else if (regionId == null) {
                exploreReason = 'Selecione uma região para Explorar ou Assumir Domínio.';
            } else if (isNeutral) {
                // Lógica para Assumir Domínio
                const hasEnoughPV = player.victoryPoints >= 2;
                const canPayBiome = Object.entries(region.resources)
                    .every(([key, value]) => player.resources[key] >= value);

                if (this.actionExploreBtn) {
                    this.actionExploreBtn.disabled = !baseEnabled || !hasEnoughPV || !canPayBiome;
                    this.actionExploreBtn.textContent = 'Assumir Domínio';
                    
                    if (this.actionExploreBtn.disabled) {
                        if (!hasEnoughPV) exploreReason = 'Requer 2 PVs (Pontos de Vitória).';
                        else if (!canPayBiome) exploreReason = 'Recursos de Bioma insuficientes.';
                    }
                }
            } else if (isOwnRegion) {
                // Lógica para Explorar - GRATUITO em regiões próprias!
                if (this.actionExploreBtn) {
                    this.actionExploreBtn.disabled = !baseEnabled;
                    this.actionExploreBtn.textContent = 'Explorar';
                    this.actionExploreBtn.title = 'Explorar região própria (ação gratuita)';
                }
            } else {
                // Não é neutro, nem sua região.
                if (this.actionExploreBtn) {
                    this.actionExploreBtn.disabled = true;
                    this.actionExploreBtn.textContent = 'Explorar';
                    exploreReason = `Região controlada por ${gameState.players[region.controller].name}.`;
                }
            }

            // Aplica a dica visual (tooltip)
            if (this.actionExploreBtn) {
                this.actionExploreBtn.title = exploreReason;
            }
            
            if (this.actionBuildBtn) {
                this.actionBuildBtn.disabled = !baseEnabled || !isActionPhase || !isOwnRegion || 
                                            !this.canPlayerAffordAction('construir', player);
            }
            
            if (this.actionCollectBtn) {
                this.actionCollectBtn.disabled = !baseEnabled || !isActionPhase || !canCollect || 
                                            !this.canPlayerAffordAction('recolher', player);
            }
        }
        
        // Botão Negociar (só disponível na fase de negociação)
        if (this.actionNegotiateBtn) {
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
        
        // Atualizar contador de ações
        if (this.actionsLeftEl) {
            this.actionsLeftEl.textContent = `Ações restantes: ${gameState.actionsLeft}`;
        }
        
        // Botão Terminar Turno
        if (this.endTurnBtn) {
            const currentPlayer = getCurrentPlayer();
            const pendingNegotiations = getPendingNegotiationsForPlayer(currentPlayer.id);
            const hasPending = pendingNegotiations.length > 0;
            
            switch(gameState.currentPhase) {
                case 'acoes':
                    this.endTurnBtn.disabled = false;
                    this.endTurnBtn.textContent = 'Ir para Negociação';
                    this.endTurnBtn.className = 'px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold transition';
                    break;
                case 'negociacao':
                    this.endTurnBtn.disabled = false;
                    
                    // Indicador visual de propostas pendentes
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
    }

    updatePhaseIndicator() {
        if (this.phaseIndicator) {
            this.phaseIndicator.textContent = `Fase: ${PHASE_NAMES[gameState.currentPhase] || 'Renda'}`;
        }
    }

    updateTurnInfo() {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        if (this.turnInfo) {
            this.turnInfo.textContent = `Turno: ${gameState.turn} • Jogador: ${currentPlayer?.name || '—'}`;
        }
    }

    canPlayerAffordAction(actionType, player) {
        const cost = ACTION_COSTS[actionType] || {};
        return Object.entries(cost).every(([resource, amount]) => {
            return (player.resources[resource] || 0) >= amount;
        });
    }

    // ==================== LOG DE ATIVIDADES ====================

    renderActivityLog(filter = 'all') {
        const logs = activityLogHistory;
        
        if (this.logEntriesSidebar) {
            this.logEntriesSidebar.innerHTML = '';
            
            const filteredLogs = logs.filter(log => {
                const currentPlayer = getCurrentPlayer();
                if (!currentPlayer) return true;
                
                const isCurrentPlayer = log.playerName === currentPlayer.name;
                
                if (filter === 'mine') return isCurrentPlayer;
                if (filter === 'events') return log.type === 'event';
                return true;
            });
            
            filteredLogs.forEach(log => {
                const entry = document.createElement('div');
                entry.className = 'flex items-center gap-1 text-xs';
                
                const icon = LOG_ICONS[log.type] || LOG_ICONS.default;
                const currentPlayer = getCurrentPlayer();
                const isCurrentPlayer = currentPlayer && log.playerName === currentPlayer.name;
                
                entry.innerHTML = `
                    <span class="text-xs">${icon}</span>
                    <span class="truncate ${isCurrentPlayer ? 'text-yellow-300 font-semibold' : 'text-gray-300'}">
                        ${log.playerName || ''} ${log.action || ''} ${log.details || ''}
                    </span>
                    <span class="ml-auto text-[9px] text-gray-500">T${log.turn || 0}</span>
                `;
                
                this.logEntriesSidebar.appendChild(entry);
            });
        }
        
        document.querySelectorAll('.log-filter-sidebar').forEach(btn => {
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // ==================== TOOLTIP ====================

    showRegionTooltip(region, targetEl) {
        const owner = region.controller !== null 
            ? `${gameState.players[region.controller].icon} ${gameState.players[region.controller].name}`
            : 'Neutro';
        const structures = region.structures.length ? region.structures.join(', ') : 'Nenhuma';
        
        this.tooltipTitle.textContent = `${region.name} — ${region.biome}`;
        this.tooltipBody.innerHTML = `
            <div class="tooltip-section">
                <div class="tooltip-section-title">Informações</div>
                <div class="text-xs text-gray-300">
                    <div class="flex justify-between">
                        <span>Exploração:</span>
                        <span class="font-bold">${region.explorationLevel}⭐</span>
                    </div>
                    <div class="flex justify-between mt-1">
                        <span>Controlado por:</span>
                        <span class="font-bold">${owner}</span>
                    </div>
                    <div class="flex justify-between mt-1">
                        <span>Estruturas:</span>
                        <span class="font-bold">${structures}</span>
                    </div>
                </div>
            </div>
            
            <div class="tooltip-section mt-3">
                <div class="tooltip-section-title">Recursos</div>
                <div class="flex items-center justify-between gap-3 mt-1">
                    ${Object.entries(region.resources)
                        .filter(([key, value]) => value > 0)
                        .map(([key, value]) => `
                            <div class="flex items-center gap-1">
                                <span class="text-base">${RESOURCE_ICONS[key]}</span>
                                <span class="text-xs font-bold text-white">${value}</span>
                            </div>
                        `).join('')}
                    ${Object.values(region.resources).filter(v => v > 0).length === 0 ? 
                        '<span class="text-xs text-gray-400">Sem recursos</span>' : ''}
                </div>
            </div>
        `;
        
        this.regionTooltip.classList.remove('hidden');
        this.regionTooltip.classList.add('visible');
        this.positionTooltip(targetEl);
    }

    positionTooltip(targetEl) {
        const rect = targetEl.getBoundingClientRect();
        const tooltipRect = this.regionTooltip.getBoundingClientRect();
        
        // Posição centralizada acima da célula por padrão
        let top = rect.top - tooltipRect.height - 10;
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        
        // Ajuste para garantir que a tooltip não saia da tela
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;
        
        // Ajuste horizontal
        if (left < 10) {
            left = 10;
        } else if (left + tooltipRect.width > viewportWidth - 10) {
            left = viewportWidth - tooltipRect.width - 10;
        }
        
        // Ajuste vertical - se não couber acima, coloca abaixo
        if (top < 10) {
            top = rect.bottom + 10;
            // Se também não couber abaixo, ajusta para dentro da tela
            if (top + tooltipRect.height > viewportHeight - 10) {
                top = viewportHeight - tooltipRect.height - 10;
            }
        } else if (top + tooltipRect.height > viewportHeight - 10) {
            // Se não couber acima, coloca abaixo
            top = rect.bottom + 10;
        }
        
        // Aplica a posição com scroll
        this.regionTooltip.style.top = (top + scrollY) + 'px';
        this.regionTooltip.style.left = (left + scrollX) + 'px';
        
        // Garante que a tooltip esteja visível
        this.regionTooltip.style.zIndex = '1000';
    }

    hideRegionTooltip() {
        this.regionTooltip.classList.add('hidden');
        this.regionTooltip.classList.remove('visible');
    }

    // ==================== UTILITÁRIOS ====================

    setupTransparencyControls() {
        const transparencySlider = document.getElementById('cellTransparencySlider');
        const transparencyValue = document.getElementById('transparencyValue');

        if (transparencySlider && transparencyValue) {
            const updateTransparency = (value) => {
                const opacity = value / 100;
                const blur = Math.max(0.5, 2 - (opacity * 3)) + 'px';
                
                document.documentElement.style.setProperty('--cell-bg-opacity', opacity);
                document.documentElement.style.setProperty('--cell-blur', blur);
                transparencyValue.textContent = `${value}%`;
                
                transparencyValue.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    transparencyValue.style.transform = 'scale(1)';
                }, 150);
            };
            
            transparencySlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                updateTransparency(value);
            });
            
            transparencySlider.addEventListener('change', (e) => {
                const value = parseInt(e.target.value);
                localStorage.setItem('gaia-cell-transparency', value);

                this.uiManager.modals.showFeedback(`Transparência ajustada para ${value}%`, 'info');
            });
            
            setTimeout(() => {
                const savedTransparency = localStorage.getItem('gaia-cell-transparency');
                if (savedTransparency) {
                    const value = parseInt(savedTransparency);
                    if (value >= 5 && value <= 50) {
                        transparencySlider.value = value;
                        updateTransparency(value);
                    }
                }
            }, 1000);
        }

        const resetBtn = document.getElementById('resetTransparencyBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetTransparency();
            });
        }
    }

    resetTransparency() {
        const transparencySlider = document.getElementById('cellTransparencySlider');
        const transparencyValue = document.getElementById('transparencyValue');
        
        if (transparencySlider && transparencyValue) {
            transparencySlider.value = 15;
            
            document.documentElement.style.setProperty('--cell-bg-opacity', '0.15');
            document.documentElement.style.setProperty('--cell-blur', '1px');
            
            transparencyValue.textContent = '15%';
            
            localStorage.removeItem('gaia-cell-transparency');
            
            this.uiManager.modals.showFeedback('Transparência resetada para o padrão (15%)', 'info');
        }
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [255, 255, 255];
    }

    clearRegionSelection() {
        gameState.selectedRegionId = null;
        document.querySelectorAll('.board-cell').forEach(c => {
            c.classList.remove('region-selected');
        });
    }

    // ==================== EVENT LISTENERS ====================

    setupEventListeners() {
        // Ações principais (delegam para game-logic.js)
        this.actionExploreBtn?.addEventListener('click', () => window.gameLogic.handleExplore());
        this.actionCollectBtn?.addEventListener('click', () => window.gameLogic.handleCollect());
        this.endTurnBtn?.addEventListener('click', () => window.gameLogic.handleEndTurn());
        
        // Ações principais (que estão em ui-modals.js)
        this.actionNegotiateBtn?.addEventListener('click', () => this.uiManager.negotiation.openNegotiationModal());
        this.actionBuildBtn?.addEventListener('click', () => this.uiManager.modals.openStructureModal());

        // Navegação
        document.getElementById('manualIcon')?.addEventListener('click', () => this.uiManager.modals.openManual());
        document.getElementById('manualIconNavbar')?.addEventListener('click', () => this.uiManager.modals.openManual());
        document.getElementById('achievementsNavBtn')?.addEventListener('click', () => this.uiManager.modals.renderAchievementsModal());

        // Activity Log filters
        this.logFilterAllSidebar?.addEventListener('click', () => this.renderActivityLog('all'));
        this.logFilterMineSidebar?.addEventListener('click', () => this.renderActivityLog('mine'));
        this.logFilterEventsSidebar?.addEventListener('click', () => this.renderActivityLog('events'));
        
        // Header player buttons
        if (this.playerHeaderList) {
            this.playerHeaderList.addEventListener('click', (e) => {
                const button = e.target.closest('button[data-index]');
                if (button) {
                    const idx = Number(button.dataset.index);
                    gameState.selectedPlayerForSidebar = idx;
                    this.renderSidebar(idx);
                }
            });
        }

        // Listener global para desselecionar regiões
        document.addEventListener('click', (e) => {
            const isRegionCell = e.target.closest('.board-cell');
            const isActionButton = e.target.closest('.action-btn, #endTurnBtn');
            const isGameFooter = e.target.closest('#gameFooter');
            const isModal = e.target.closest('[id$="Modal"]');
            const isStructureOption = e.target.closest('.structure-option');
            
            if (!isRegionCell && !isActionButton && !isGameFooter && !isModal && 
                !isStructureOption && gameState.selectedRegionId !== null) {
                
                this.clearRegionSelection();
                this.updateFooter();
                this.renderSidebar(gameState.selectedPlayerForSidebar);
            }
        });

        // Tecla ESC para cancelar edição
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.uiManager.playersManager.editingIndex !== null) {
                e.preventDefault();
                this.uiManager.playersManager.cancelEdit();
            }
        });

        // Atalho para debug (Ctrl+Shift+I)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                const panel = document.getElementById('aiDebugPanel');
                panel.classList.toggle('hidden');
                if (!panel.classList.contains('hidden') && window.aiDebugUpdate) {
                    window.aiDebugUpdate();
                }
            }
        });
    }
}
