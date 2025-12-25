// ui-mobile.js - Sistema Mobile Corrigido
import { gameState, getCurrentPlayer } from '../state/game-state.js';
import { RESOURCE_ICONS } from '../state/game-config.js';

export class UIMobileManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.isMobile = this.detectMobile();
        
        // Estado
        this.activeSheet = null;
        this.currentRegionId = null;
        this.gameStarted = false;
        this.menuButton = null;
        this.regionFAB = null;
        
        // Controle de toque
        this.touchStartTime = 0;
        this.touchStartElement = null;
        this.touchTimer = null;
        
        console.log(`📱 Mobile Manager: ${this.isMobile ? 'Ativo' : 'Inativo'}`);
    }

    // ==================== DETECÇÃO ====================
    
    detectMobile() {
        return window.innerWidth <= 768;
    }

    // ==================== INICIALIZAÇÃO ====================
    
    init() {
        if (!this.isMobile) return;
        
        console.log('📱 Iniciando adaptações mobile...');
        
        // 1. Injetar estilos críticos
        this.injectMobileStyles();
        
        // 2. Esconder footer original
        this.hideOriginalFooter();
        
        // 3. Criar elementos mobile
        this.createMobileElements();
        
        // 4. Configurar observador de estado
        this.setupGameStateObserver();
        
        // 5. Configurar eventos
        this.setupEventListeners();
        
        console.log('✅ Mobile Manager inicializado');
    }

    // ==================== ESTILOS MOBILE ====================
    
    injectMobileStyles() {
        const styleId = 'gaia-mobile-final';
        if (document.getElementById(styleId)) return;
        
        const css = `
            /* === MOBILE FINAL STYLES === */
            @media (max-width: 768px) {
                /* 1. Footer original oculto */
                #gameFooter {
                    display: none !important;
                }
                
                /* 2. Tela de cadastro em coluna */
                #initialScreen {
                    padding: 10px !important;
                    align-items: flex-start !important;
                    overflow-y: auto !important;
                }
                
                .player-modal {
                    width: 100% !important;
                    max-width: 100% !important;
                    border-radius: 12px !important;
                    padding: 15px !important;
                }
                
                /* Layout em coluna */
                .player-modal > div:first-child {
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 12px !important;
                }
                
                #playerName, .faction-dropdown {
                    width: 100% !important;
                    min-height: 44px !important;
                }
                
                .player-modal > div:first-child > div:nth-child(3) {
                    display: grid !important;
                    grid-template-columns: 1fr 1fr !important;
                    gap: 8px !important;
                }
                
                #startGameBtn {
                    grid-column: span 2 !important;
                    width: 100% !important;
                    padding: 16px !important;
                }
                
                /* 3. Menu flutuante (FAB) */
                #gaia-mobile-menu {
                    position: fixed !important;
                    top: 15px !important;
                    right: 15px !important;
                    width: 50px !important;
                    height: 50px !important;
                    background: linear-gradient(135deg,#3b82f6,#1d4ed8) !important;
                    border: 2px solid rgba(255,255,255,0.3) !important;
                    border-radius: 50% !important;
                    z-index: 9980 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    font-size: 24px !important;
                    color: white !important;
                    cursor: pointer !important;
                    box-shadow: 0 4px 20px rgba(59,130,246,0.4) !important;
                }
                
                /* 4. Botão flutuante para região */
                #mobile-region-fab {
                    position: fixed !important;
                    bottom: 80px !important;
                    right: 15px !important;
                    width: 56px !important;
                    height: 56px !important;
                    border-radius: 50% !important;
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
                    border: 2px solid white !important;
                    color: white !important;
                    font-size: 24px !important;
                    z-index: 9990 !important;
                    display: none !important;
                    align-items: center !important;
                    justify-content: center !important;
                    cursor: pointer !important;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
                }
                
                /* 5. Overlay do sheet */
                #gaia-mobile-overlay {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    background: rgba(0,0,0,0.7) !important;
                    z-index: 9995 !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                    transition: opacity 0.3s ease !important;
                }
                
                /* 6. Bottom sheet */
                #gaia-mobile-sheet {
                    position: fixed !important;
                    bottom: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    background: rgb(17,24,39) !important;
                    border-top: 1px solid rgba(251,191,36,0.3) !important;
                    border-radius: 20px 20px 0 0 !important;
                    z-index: 9996 !important;
                    transform: translateY(100%) !important;
                    transition: transform 0.3s ease !important;
                    max-height: 70vh !important;
                    overflow-y: auto !important;
                }
                
                /* 7. Indicador de região selecionada */
                .region-selected-mobile {
                    border: 3px solid #fbbf24 !important;
                    box-shadow: 0 0 20px rgba(251, 191, 36, 0.5) !important;
                    animation: pulse 2s infinite !important;
                }
                
                @keyframes pulse {
                    0%, 100% { border-color: #fbbf24; box-shadow: 0 0 20px rgba(251, 191, 36, 0.5); }
                    50% { border-color: #fcd34d; box-shadow: 0 0 30px rgba(251, 191, 36, 0.8); }
                }
            }
        `;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ==================== CONTROLE DO FOOTER ====================
    
    hideOriginalFooter() {
        const footer = document.getElementById('gameFooter');
        if (footer) {
            footer.style.display = 'none';
        }
    }

    // ==================== ELEMENTOS MOBILE ====================
    
    createMobileElements() {
        this.createOverlay();
        this.createFloatingMenu();
        this.createRegionFAB();
    }
    
    createOverlay() {
        if (document.getElementById('gaia-mobile-overlay')) return;
        
        // Overlay
        this.overlay = document.createElement('div');
        this.overlay.id = 'gaia-mobile-overlay';
        this.overlay.addEventListener('click', () => this.closeSheet());
        document.body.appendChild(this.overlay);
        
        // Bottom Sheet
        this.bottomSheet = document.createElement('div');
        this.bottomSheet.id = 'gaia-mobile-sheet';
        
        // Handle
        const handle = document.createElement('div');
        handle.style.cssText = 'padding: 16px 0; text-align: center;';
        handle.innerHTML = '<div style="width: 40px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; margin: 0 auto;"></div>';
        this.bottomSheet.appendChild(handle);
        
        // Content
        this.sheetContent = document.createElement('div');
        this.sheetContent.id = 'gaia-sheet-content';
        this.sheetContent.style.cssText = 'padding: 0 20px 30px;';
        this.bottomSheet.appendChild(this.sheetContent);
        
        document.body.appendChild(this.bottomSheet);
    }
    
    createFloatingMenu() {
        if (document.getElementById('gaia-mobile-menu')) return;
        
        this.menuButton = document.createElement('button');
        this.menuButton.id = 'gaia-mobile-menu';
        this.menuButton.innerHTML = '☰';
        this.menuButton.title = 'Menu do Jogo';
        
        this.menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showMobileMenu();
        });
        
        document.body.appendChild(this.menuButton);
    }
    
    createRegionFAB() {
        if (document.getElementById('mobile-region-fab')) return;
        
        this.regionFAB = document.createElement('button');
        this.regionFAB.id = 'mobile-region-fab';
        this.regionFAB.innerHTML = '📍';
        this.regionFAB.title = 'Abrir região selecionada';
        
        this.regionFAB.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.currentRegionId !== null) {
                const region = gameState.regions[this.currentRegionId];
                if (region) {
                    this.showRegionSheet(region);
                }
            }
        });
        
        document.body.appendChild(this.regionFAB);
    }

    // ==================== GERENCIAMENTO DE TELAS ====================
    
    setupGameStateObserver() {
        // Verificar estado inicial
        this.checkGameState();
        
        // Verificar periodicamente
        setInterval(() => this.checkGameState(), 1000);
        
        // Observar mudanças no DOM
        const observer = new MutationObserver(() => {
            this.checkGameState();
        });
        
        observer.observe(document.body, {
            attributes: true,
            subtree: true,
            attributeFilter: ['class']
        });
    }
    
    checkGameState() {
        const gameContainer = document.getElementById('gameContainer');
        const wasStarted = this.gameStarted;
        this.gameStarted = gameContainer && !gameContainer.classList.contains('hidden');
        
        if (this.gameStarted !== wasStarted) {
            if (this.gameStarted) {
                this.onGameStart();
            } else {
                this.onGameStop();
            }
        }
        
        // Atualizar FAB
        this.updateRegionFAB();
    }
    
    onGameStart() {
        console.log('📱 Jogo iniciado');
        this.setupTouchInteractions();
        if (this.menuButton) this.menuButton.style.display = 'flex';
    }
    
    onGameStop() {
        console.log('📱 Jogo parado');
        if (this.menuButton) this.menuButton.style.display = 'flex';
        if (this.regionFAB) this.regionFAB.style.display = 'none';
        this.closeSheet();
    }
    
    setupTouchInteractions() {
        // Configurar toque para regiões
        const boardContainer = document.getElementById('boardContainer');
        if (!boardContainer) return;
        
        // Limpar eventos anteriores
        boardContainer.removeEventListener('touchstart', this.handleTouchStart);
        boardContainer.removeEventListener('touchend', this.handleTouchEnd);
        boardContainer.removeEventListener('touchmove', this.handleTouchMove);
        
        // Adicionar novos eventos
        this.handleTouchStart = this.onTouchStart.bind(this);
        this.handleTouchEnd = this.onTouchEnd.bind(this);
        this.handleTouchMove = this.onTouchMove.bind(this);
        
        boardContainer.addEventListener('touchstart', this.handleTouchStart, { passive: true });
        boardContainer.addEventListener('touchend', this.handleTouchEnd, { passive: true });
        boardContainer.addEventListener('touchmove', this.handleTouchMove, { passive: true });
    }
    
    onTouchStart(e) {
        const cell = e.target.closest('.board-cell');
        if (!cell) return;
        
        this.touchStartTime = Date.now();
        this.touchStartElement = cell;
        
        // Iniciar timer para toque longo
        this.touchTimer = setTimeout(() => {
            if (this.touchStartElement === cell) {
                this.handleLongPress(cell);
            }
        }, 600); // 600ms para toque longo
    }
    
    onTouchEnd(e) {
        clearTimeout(this.touchTimer);
        
        const cell = e.target.closest('.board-cell');
        if (!cell || !this.touchStartElement) return;
        
        const touchDuration = Date.now() - this.touchStartTime;
        
        // Toque curto (clique normal) - menos de 300ms
        if (touchDuration < 300 && this.touchStartElement === cell) {
            // Deixar o clique normal ser tratado pelo ui-game.js
            return;
        }
        
        this.touchStartElement = null;
        this.touchStartTime = 0;
    }
    
    onTouchMove() {
        clearTimeout(this.touchTimer);
        this.touchStartElement = null;
    }
    
    handleLongPress(cell) {
        const regionId = parseInt(cell.dataset.regionId);
        if (isNaN(regionId)) return;
        
        console.log(`📱 Toque longo na região ${regionId}`);
        
        // Sincronizar seleção
        this.currentRegionId = regionId;
        gameState.selectedRegionId = regionId;
        
        // Atualizar UI
        this.updateRegionSelection(cell);
        
        // Mostrar sheet
        const region = gameState.regions[regionId];
        if (region) {
            this.showRegionSheet(region);
        }
        
        // Feedback tátil
        if (navigator.vibrate) {
            try {
                navigator.vibrate(50);
            } catch (e) {
                // Ignorar erro de vibração
            }
        }
        
        // Limpar estado de toque
        this.touchStartElement = null;
        clearTimeout(this.touchTimer);
    }
    
    updateRegionSelection(selectedCell = null) {
        // Remover seleção anterior
        document.querySelectorAll('.board-cell').forEach(cell => {
            cell.classList.remove('region-selected-mobile');
        });
        
        // Adicionar seleção à célula atual
        if (selectedCell) {
            selectedCell.classList.add('region-selected-mobile');
        } else if (this.currentRegionId !== null) {
            const cell = document.querySelector(`[data-region-id="${this.currentRegionId}"]`);
            if (cell) cell.classList.add('region-selected-mobile');
        }
        
        // Atualizar FAB
        this.updateRegionFAB();
    }
    
    updateRegionFAB() {
        if (!this.regionFAB) return;
        
        const shouldShow = this.currentRegionId !== null && 
                          this.gameStarted &&
                          gameState.regions[this.currentRegionId];
        
        if (shouldShow) {
            this.regionFAB.style.display = 'flex';
        } else {
            this.regionFAB.style.display = 'none';
        }
    }

    // ==================== SHEETS ====================
    
    showRegionSheet(region) {
        if (!region || this.activeSheet) return;
        
        this.activeSheet = 'region';
        
        const owner = region.controller !== null ? gameState.players[region.controller] : null;
        const currentPlayer = getCurrentPlayer();
        const isOwnRegion = owner && owner.id === currentPlayer?.id;
        
        // Determinar ação principal
        let mainAction = 'explore';
        let mainActionText = 'Explorar';
        let mainActionIcon = '⛏️';
        let mainActionDisabled = false;
        
        if (region.controller === null) {
            mainAction = 'dominate';
            mainActionText = 'Dominar';
            mainActionIcon = '👑';
            
            if (currentPlayer) {
                const hasEnoughPV = currentPlayer.victoryPoints >= 2;
                const canPayBiome = Object.entries(region.resources)
                    .every(([key, value]) => (currentPlayer.resources[key] || 0) >= value);
                
                mainActionDisabled = !hasEnoughPV || !canPayBiome;
            }
        } else if (!isOwnRegion) {
            mainActionDisabled = true;
            mainActionText = 'Controlada';
            mainActionIcon = '🚫';
        }
        
        // Construir conteúdo
        const content = `
            <div style="padding-bottom: 20px;">
                <h2 style="margin: 0 0 8px 0; font-size: 22px; color: white;">
                    ${region.name}
                    <span style="font-size: 14px; color: #fbbf24; background: rgba(251,191,36,0.1); padding: 4px 8px; border-radius: 12px; margin-left: 8px;">
                        ${region.biome}
                    </span>
                </h2>
                
                <div style="display: flex; align-items: center; gap: 12px; margin: 12px 0;">
                    <div style="display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.3); padding: 6px 10px; border-radius: 8px;">
                        <span style="color: #f59e0b; font-size: 18px;">⭐</span>
                        <span style="font-weight: bold; color: white; font-size: 16px;">${region.explorationLevel}</span>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <span style="font-size: 14px; color: rgba(255,255,255,0.7);">Controlada por:</span>
                        <span style="font-weight: bold; color: ${owner?.color || '#9ca3af'}; font-size: 15px;">
                            ${owner?.icon || '🏳️'} ${owner?.name || 'Neutro'}
                        </span>
                    </div>
                </div>
                
                <div style="margin: 16px 0;">
                    <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #fbbf24;">Recursos</h3>
                    <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px;">
                        ${Object.entries(region.resources)
                            .filter(([_, val]) => val > 0)
                            .map(([key, val]) => `
                                <div style="display: flex; flex-direction: column; align-items: center; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 12px; min-width: 70px;">
                                    <span style="font-size: 28px;">${RESOURCE_ICONS[key] || '📦'}</span>
                                    <span style="font-weight: bold; font-size: 18px; margin-top: 8px;">${val}</span>
                                    <span style="font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 4px; text-transform: capitalize">${key}</span>
                                </div>
                            `).join('') || 
                            '<div style="text-align: center; color: rgba(255,255,255,0.5); font-style: italic; width: 100%;">Nenhum recurso</div>'
                        }
                    </div>
                </div>
                
                <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 14px; color: rgba(255,255,255,0.9); text-align: center;">Ações</h3>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <button onclick="window.uiManager.mobileManager.executeAction('${mainAction}', ${region.id})"
                                style="padding: 14px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border: none; border-radius: 12px; color: white; font-weight: bold; font-size: 14px; display: flex; flex-direction: column; align-items: center; gap: 4px; ${mainActionDisabled ? 'opacity: 0.5; cursor: not-allowed;' : ''}"
                                ${mainActionDisabled ? 'disabled' : ''}>
                            <span style="font-size: 20px;">${mainActionIcon}</span>
                            <span style="font-size: 12px;">${mainActionText}</span>
                        </button>
                        
                        <button onclick="window.uiManager.mobileManager.executeAction('collect', ${region.id})"
                                style="padding: 14px; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 12px; color: white; font-weight: bold; font-size: 14px; display: flex; flex-direction: column; align-items: center; gap: 4px; ${!isOwnRegion ? 'opacity: 0.5; cursor: not-allowed;' : ''}"
                                ${!isOwnRegion ? 'disabled' : ''}>
                            <span style="font-size: 20px;">🌾</span>
                            <span style="font-size: 12px;">Coletar</span>
                        </button>
                    </div>
                    
                    <button onclick="window.uiManager.mobileManager.executeAction('build', ${region.id})"
                            style="width: 100%; padding: 14px; margin-top: 10px; background: linear-gradient(135deg, #f59e0b, #d97706); border: none; border-radius: 12px; color: white; font-weight: bold; font-size: 14px; display: flex; justify-content: center; align-items: center; gap: 8px; ${!isOwnRegion ? 'opacity: 0.5; cursor: not-allowed;' : ''}"
                            ${!isOwnRegion ? 'disabled' : ''}>
                        <span style="font-size: 20px;">🏗️</span>
                        <span>Construir</span>
                    </button>
                </div>
            </div>
        `;
        
        this.sheetContent.innerHTML = content;
        this.openSheet();
    }
    
    showMobileMenu() {
        if (this.activeSheet) return;
        
        const currentPlayer = getCurrentPlayer();
        if (!currentPlayer) return;
        
        this.activeSheet = 'menu';
        
        // Verificar fase
        const phaseElement = document.getElementById('phaseIndicator');
        const isNegotiationPhase = phaseElement?.textContent?.includes('Negociação') || false;
        
        const content = `
            <div style="padding: 20px 0;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                    <span style="font-size: 40px;">${currentPlayer.icon}</span>
                    <div>
                        <div style="font-size: 20px; font-weight: bold; color: white;">${currentPlayer.name}</div>
                        <div style="color: ${currentPlayer.color}; font-size: 14px;">${currentPlayer.faction?.name || 'Sem facção'}</div>
                        <div style="background: rgba(245,158,11,0.2); color: #f59e0b; padding: 4px 10px; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block; margin-top: 4px;">
                            ${currentPlayer.victoryPoints} PV
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="font-size: 16px; color: #fbbf24; margin-bottom: 10px;">Recursos</h3>
                    <div style="max-height: 150px; overflow-y: auto;">
                        ${Object.entries(currentPlayer.resources || {})
                            .map(([key, val]) => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 8px; margin-bottom: 6px;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="font-size: 18px;">${RESOURCE_ICONS[key] || '📦'}</span>
                                        <span style="color: rgba(255,255,255,0.9); font-size: 13px;">${key}</span>
                                    </div>
                                    <span style="font-weight: bold; color: white; font-size: 16px;">${val}</span>
                                </div>
                            `).join('')}
                    </div>
                </div>
                
                ${isNegotiationPhase ? `
                <button onclick="window.uiManager.mobileManager.openNegotiation()"
                        style="width: 100%; padding: 14px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); border: none; border-radius: 12px; color: white; font-weight: bold; font-size: 15px; display: flex; justify-content: center; align-items: center; gap: 10px; margin-bottom: 12px;">
                    <span style="font-size: 20px;">🤝</span>
                    <span>Abrir Negociação</span>
                </button>
                ` : ''}
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <button onclick="window.uiManager.mobileManager.endTurn()"
                            style="padding: 12px; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 10px; color: white; font-weight: bold; font-size: 14px; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                        <span style="font-size: 20px;">🔄</span>
                        <span>Terminar Turno</span>
                    </button>
                    
                    <button onclick="window.uiManager.mobileManager.openManual()"
                            style="padding: 12px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border: none; border-radius: 10px; color: white; font-weight: bold; font-size: 14px; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                        <span style="font-size: 20px;">📖</span>
                        <span>Manual</span>
                    </button>
                </div>
            </div>
        `;
        
        this.sheetContent.innerHTML = content;
        this.openSheet();
    }
    
    executeAction(action, regionId) {
        console.log(`📱 Executando ação: ${action} na região ${regionId}`);
        
        // Garantir que a região está selecionada
        this.currentRegionId = regionId;
        gameState.selectedRegionId = regionId;
        
        switch(action) {
            case 'explore':
            case 'dominate':
                if (window.gameLogic?.handleExplore) {
                    window.gameLogic.handleExplore();
                }
                break;
            case 'collect':
                if (window.gameLogic?.handleCollect) {
                    window.gameLogic.handleCollect();
                }
                break;
            case 'build':
                if (this.uiManager?.modals?.openStructureModal) {
                    this.uiManager.modals.openStructureModal();
                }
                break;
        }
        
        this.closeSheet();
    }
    
    openNegotiation() {
        if (this.uiManager?.negotiation?.openNegotiationModal) {
            this.uiManager.negotiation.openNegotiationModal();
            this.closeSheet();
        }
    }
    
    endTurn() {
        if (window.gameLogic?.handleEndTurn) {
            window.gameLogic.handleEndTurn();
            this.closeSheet();
        }
    }
    
    openManual() {
        if (this.uiManager?.modals?.openManual) {
            this.uiManager.modals.openManual();
            this.closeSheet();
        }
    }
    
    openSheet() {
        this.overlay.style.visibility = 'visible';
        this.overlay.style.opacity = '1';
        this.bottomSheet.style.transform = 'translateY(0)';
        document.body.style.overflow = 'hidden';
    }
    
    closeSheet() {
        this.bottomSheet.style.transform = 'translateY(100%)';
        this.overlay.style.opacity = '0';
        
        setTimeout(() => {
            this.overlay.style.visibility = 'hidden';
            this.sheetContent.innerHTML = '';
            document.body.style.overflow = '';
            this.activeSheet = null;
        }, 300);
    }

    // ==================== EVENT LISTENERS ====================
    
    setupEventListeners() {
        // Redimensionamento
        window.addEventListener('resize', () => {
            const newIsMobile = this.detectMobile();
            if (newIsMobile !== this.isMobile) {
                this.isMobile = newIsMobile;
                if (this.isMobile) {
                    this.injectMobileStyles();
                    this.hideOriginalFooter();
                }
            }
        });
        
        // Tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeSheet) {
                this.closeSheet();
            }
        });
        
        // Sincronizar seleção periodicamente
        setInterval(() => {
            if (this.gameStarted && gameState.selectedRegionId !== this.currentRegionId) {
                this.currentRegionId = gameState.selectedRegionId;
                this.updateRegionSelection();
            }
        }, 500);
    }
}

// Expor globalmente
window.GaiaMobileManager = UIMobileManager;