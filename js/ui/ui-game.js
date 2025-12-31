// ui-game.js - Interface do Jogo (Corrigido)
import {
    gameState,
    getCurrentPlayer,
    activityLogHistory
} from '../state/game-state.js';
import { GAME_CONFIG, RESOURCE_ICONS, UI_CONSTANTS } from '../state/game-config.js';
import { Utils } from '../utils/utils.js';
import { RegionRenderer } from './ui-region-renderer.js';
import { SidebarManager } from './ui-sidebar-manager.js';
import { FooterManager } from './ui-footer-manager.js';

// Desestruturação das constantes de UI
const { LOG_ICONS, PHASE_NAMES, ACTION_COSTS } = UI_CONSTANTS;

export class UIGameManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.boardContainer = null;
        this.cacheElements();
        this.initializeComponents();
    }

    initializeComponents() {
        this.regionRenderer = new RegionRenderer(this);
        this.sidebarManager = new SidebarManager(this);
        this.footerManager = new FooterManager(this);
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
        
        // Container do tabuleiro - CRÍTICO
        this.boardContainer = document.getElementById('boardContainer');
        
        // Se não existir, criar dinamicamente
        if (!this.boardContainer && this.gameMap) {
            console.log("⚠️ boardContainer não encontrado, criando dinamicamente...");
            this.boardContainer = document.createElement('div');
            this.boardContainer.id = 'boardContainer';
            this.boardContainer.className = 'board-container';
            this.gameMap.appendChild(this.boardContainer);
        }
        
        // Elementos da interface do jogo
        this.playerHeaderList = document.getElementById('playerHeaderList');
        
        // Elementos do log de atividades
        this.logEntriesSidebar = document.getElementById('logEntriesSidebar');
        this.logFilterAllSidebar = document.getElementById('logFilterAllSidebar');
        this.logFilterMineSidebar = document.getElementById('logFilterMineSidebar');
        this.logFilterEventsSidebar = document.getElementById('logFilterEventsSidebar');
        
        // Tooltip
        this.regionTooltip = document.getElementById('regionTooltip');
        this.tooltipTitle = document.getElementById('tooltipTitle');
        this.tooltipBody = document.getElementById('tooltipBody');
        
        // Elementos de informação
        this.turnInfo = document.getElementById('turnInfo');
        
        console.log("✅ Elementos do jogo cacheados:", {
            boardContainer: !!this.boardContainer,
            gameMap: !!this.gameMap,
            playerHeaderList: !!this.playerHeaderList
        });
    }

    init() {
        this.setupEventListeners();
        this.setupTransparencyControls();
        this.ensureBoardContainer();
    }

    // ==================== RENDERIZAÇÃO DO JOGO ====================

    updateUI() {
        this.renderHeaderPlayers();
        this.renderBoard();
        if (this.sidebarManager) {
            this.sidebarManager.renderSidebar(gameState.selectedPlayerForSidebar);
        }
        if (this.footerManager) {
            this.footerManager.updateFooter();
        }
        this.updateTurnInfo();
        this.renderActivityLog();
    }
    
    ensureBoardContainer() {
        if (!this.boardContainer && this.gameMap) {
            this.boardContainer = document.createElement('div');
            this.boardContainer.id = 'boardContainer';
            this.boardContainer.className = 'board-container';
            this.gameMap.appendChild(this.boardContainer);
            console.log("✅ boardContainer criado dinamicamente");
        }
    }
    
    renderHeaderPlayers() {
        if (!this.playerHeaderList) return;
        
        this.playerHeaderList.innerHTML = gameState.players.map((p, i) => {
            const isCurrent = i === gameState.currentPlayerIndex;
            const isEliminated = p.eliminated;
            
            let buttonClass = 'px-3 py-1 rounded-lg text-white text-sm flex items-center gap-2 ';
            let content = '';
            
            if (isEliminated) {
                buttonClass += 'bg-gray-800/50 opacity-50 cursor-not-allowed ';
                content = `
                    <div class="text-xl">💀</div>
                    <div>
                        <div class="font-medium line-through">${p.name}</div>
                        <div class="text-xs text-gray-300">ELIMINADO</div>
                    </div>
                `;
            } else if (isCurrent) {
                buttonClass += 'ring-2 ring-yellow-300 bg-white/5 ';
                content = `
                    <div class="text-xl">${p.icon}</div>
                    <div>
                        <div class="font-medium">${p.name}</div>
                        <div class="text-xs text-yellow-400">${p.victoryPoints} PV</div>
                    </div>
                `;
            } else {
                buttonClass += 'bg-white/5 ';
                content = `
                    <div class="text-xl">${p.icon}</div>
                    <div>
                        <div class="font-medium">${p.name}</div>
                        <div class="text-xs text-yellow-400">${p.victoryPoints} PV</div>
                    </div>
                `;
            }
            
            return `<button data-index="${i}" class="${buttonClass}" ${isEliminated ? 'disabled' : ''}>
                ${content}
            </button>`;
        }).join('');
    }

    renderBoard() {
        if (!this.boardContainer) {
            console.error("❌ boardContainer não disponível. Tentando recriar...");
            this.ensureBoardContainer();
            
            if (!this.boardContainer) {
                console.error("❌ Não foi possível criar boardContainer!");
                return;
            }
        }
        
        // Limpar tabuleiro
        this.boardContainer.innerHTML = '';
        
        // Verificar se há regiões para renderizar
        if (!gameState.regions || gameState.regions.length === 0) {
            console.error("❌ Não há regiões no gameState para renderizar!");
            return;
        }
        
        // Criar grade do tabuleiro
        const gridSize = GAME_CONFIG.GRID_SIZE || 8;
        this.boardContainer.style.display = 'grid';
        this.boardContainer.style.gridTemplateColumns = `repeat(${gridSize}, minmax(0, 1fr))`;
        this.boardContainer.style.gap = '2px';
        this.boardContainer.style.padding = '8px';
        
        console.log(`🎮 Renderizando ${gameState.regions.length} regiões em grade ${gridSize}x${gridSize}`);
        
        // Renderizar cada região
        gameState.regions.forEach((region, index) => {
            try {
                const cell = this.regionRenderer.createRegionCell(region, index);
                if (cell) {
                    this.boardContainer.appendChild(cell);
                }
            } catch (error) {
                console.error(`❌ Erro ao renderizar região ${index}:`, error);
            }
        });
        
        console.log(`✅ Tabuleiro renderizado com ${this.boardContainer.children.length} células`);
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
    
    handleExploreWithContext() {
        if (gameState.selectedRegionId === null) {
            this.uiManager.modals.showFeedback('Selecione uma região primeiro.', 'error');
            return;
        }
        
        const region = gameState.regions[gameState.selectedRegionId];
        const player = getCurrentPlayer();
        
        if (!region || !player) {
            this.uiManager.modals.showFeedback('Região ou jogador inválido.', 'error');
            return;
        }
        
        // Verificar se jogador está eliminado
        if (player.eliminated) {
            // Jogador eliminado só pode dominar regiões neutras
            if (region.controller === null) {
                if (window.gameLogic?.handleExplore) {
                    window.gameLogic.handleExplore();
                }
            } else {
                this.uiManager.modals.showFeedback('Jogador eliminado só pode dominar regiões neutras.', 'error');
            }
            return;
        }
        
        if (region.controller === null) {
            // Região neutra - dominar diretamente
            if (window.gameLogic?.handleExplore) {
                window.gameLogic.handleExplore();
            }
        } else if (region.controller === player.id) {
            // Região própria - explorar diretamente
            if (window.gameLogic?.handleExplore) {
                window.gameLogic.handleExplore();
            }
        } else {
            // Região inimiga - abrir modal de disputa
            this.uiManager.disputeUI.openDisputeModal(region.id);
        }
    }
    
    // ==================== LOG DE ATIVIDADES ====================

    renderActivityLog(filter = 'all') {
        const logs = activityLogHistory || [];
        
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
        if (!this.regionTooltip || !this.tooltipTitle || !this.tooltipBody) {
            return;
        }
        
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
        if (!this.regionTooltip) return;
        
        const rect = targetEl.getBoundingClientRect();
        const tooltipRect = this.regionTooltip.getBoundingClientRect();
        
        let top = rect.top - tooltipRect.height - 10;
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;
        
        if (left < 10) {
            left = 10;
        } else if (left + tooltipRect.width > viewportWidth - 10) {
            left = viewportWidth - tooltipRect.width - 10;
        }
        
        if (top < 10) {
            top = rect.bottom + 10;
            if (top + tooltipRect.height > viewportHeight - 10) {
                top = viewportHeight - tooltipRect.height - 10;
            }
        } else if (top + tooltipRect.height > viewportHeight - 10) {
            top = rect.bottom + 10;
        }
        
        this.regionTooltip.style.top = (top + scrollY) + 'px';
        this.regionTooltip.style.left = (left + scrollX) + 'px';
        this.regionTooltip.style.zIndex = '1000';
    }

    hideRegionTooltip() {
        if (this.regionTooltip) {
            this.regionTooltip.classList.add('hidden');
            this.regionTooltip.classList.remove('visible');
        }
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

    isMobile() {
        return window.innerWidth <= 768;
    }
    
    clearRegionSelection() {
        gameState.selectedRegionId = null;
        document.querySelectorAll('.board-cell').forEach(c => {
            c.classList.remove('region-selected');
        });
    }

    // ==================== EVENT LISTENERS ====================

    setupEventListeners() {
        // Delegar para o footerManager
        if (this.footerManager) {
            this.footerManager.actionExploreBtn?.addEventListener('click', () => this.handleExploreWithContext());
            this.footerManager.actionCollectBtn?.addEventListener('click', () => window.gameLogic?.handleCollect?.());
            this.footerManager.endTurnBtn?.addEventListener('click', () => window.gameLogic?.handleEndTurn?.());
            this.footerManager.actionNegotiateBtn?.addEventListener('click', () => this.uiManager.negotiation?.openNegotiationModal?.());
            this.footerManager.actionBuildBtn?.addEventListener('click', () => this.uiManager.modals?.openStructureModal?.());
        }
        
        // Navegação
        document.getElementById('manualIcon')?.addEventListener('click', () => this.uiManager.modals?.openManual?.());
        document.getElementById('manualIconNavbar')?.addEventListener('click', () => this.uiManager.modals?.openManual?.());
        document.getElementById('achievementsNavBtn')?.addEventListener('click', () => this.uiManager.modals?.renderAchievementsModal?.());

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
                    this.sidebarManager?.renderSidebar?.(idx);
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
                this.footerManager?.updateFooter?.();
                this.sidebarManager?.renderSidebar?.(gameState.selectedPlayerForSidebar);
            }
        });

        // Tecla ESC para cancelar edição
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.uiManager.playersManager?.editingIndex !== null) {
                e.preventDefault();
                this.uiManager.playersManager.cancelEdit();
            }
        });

        // Atalho para debug (Ctrl+Shift+I)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                const panel = document.getElementById('aiDebugPanel');
                if (panel) {
                    panel.classList.toggle('hidden');
                    if (!panel.classList.contains('hidden') && window.aiDebugUpdate) {
                        window.aiDebugUpdate();
                    }
                }
            }
        });
    }
    
    // Métodos de compatibilidade
    updateFooter() {
        if (this.footerManager) {
            this.footerManager.updateFooter();
        }
    }
    
    renderSidebar(playerIndex = gameState.selectedPlayerForSidebar) {
        if (this.sidebarManager) {
            this.sidebarManager.renderSidebar(playerIndex);
        }
    }
}