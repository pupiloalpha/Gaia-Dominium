// ui-mobile.js - Adaptador Mobile Completo (Footer gerenciado)
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
        
        console.log(`📱 Mobile Manager: ${this.isMobile ? 'Ativo' : 'Inativo'}`);
    }

    // ==================== DETECÇÃO ====================
    
    detectMobile() {
        const isMobileWidth = window.innerWidth <= 768;
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Para desenvolvimento: forçar mobile se menor que 768px
        if (isMobileWidth) return true;
        
        return isMobileWidth && isTouchDevice;
    }

    // ==================== INICIALIZAÇÃO ====================
    
    init() {
        if (!this.isMobile) return;
        
        console.log('📱 Iniciando adaptações mobile...');
        
        // 1. Injetar estilos críticos primeiro
        this.injectMobileStyles();
        
        // 2. Esconder footer original IMEDIATAMENTE
        this.hideOriginalFooter();
        
        // 3. Configurar observador de estado do jogo
        this.setupGameStateObserver();
        
        // 4. Aguardar carregamento
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }
    
    initialize() {
        try {
            // 1. Criar elementos mobile
            this.createMobileElements();
            
            // 2. Adaptar tela atual
            this.adaptCurrentScreen();
            
            // 3. Configurar eventos
            this.setupEventListeners();
            
            console.log('✅ Mobile Manager inicializado');
        } catch (error) {
            console.error('❌ Erro na inicialização mobile:', error);
        }
    }

    // ==================== ESTILOS MOBILE ====================
    
    injectMobileStyles() {
        const styleId = 'gaia-mobile-core';
        if (document.getElementById(styleId)) return;
        
        const css = `
            /* === MOBILE CORE STYLES === */
            @media (max-width: 768px) {
                /* 1. SEMPRE ocultar footer original em mobile */
                #gameFooter {
                    display: none !important;
                }
                
                /* 2. Tela de cadastro responsiva */
                #initialScreen {
                    padding: 10px !important;
                    align-items: flex-start !important;
                    overflow-y: auto !important;
                    -webkit-overflow-scrolling: touch !important;
                }
                
                .player-modal {
                    width: 100% !important;
                    max-width: 100% !important;
                    border-radius: 12px !important;
                    padding: 15px !important;
                    margin: 10px 0 80px 0 !important;
                }
                
                .player-modal > div:first-child {
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 12px !important;
                }
                
                #playerName, .faction-dropdown {
                    width: 100% !important;
                    font-size: 16px !important;
                    min-height: 44px !important;
                    padding: 12px !important;
                }
                
                .player-modal > div:first-child > div:nth-child(3) {
                    display: grid !important;
                    grid-template-columns: 1fr 1fr !important;
                    gap: 8px !important;
                    width: 100% !important;
                }
                
                #startGameBtn {
                    grid-column: span 2 !important;
                    width: 100% !important;
                    padding: 16px !important;
                    font-size: 16px !important;
                    min-height: 55px !important;
                    margin-top: 8px !important;
                }
                
                .player-modal > div:nth-child(2) {
                    flex-direction: column !important;
                    gap: 15px !important;
                    padding-top: 15px !important;
                    margin-top: 15px !important;
                    border-top: 1px solid rgba(255,255,255,0.1) !important;
                }
                
                #iconSelection {
                    display: flex !important;
                    flex-wrap: nowrap !important;
                    overflow-x: auto !important;
                    gap: 8px !important;
                    padding-bottom: 10px !important;
                    -webkit-overflow-scrolling: touch !important;
                }
                
                .icon-button {
                    min-width: 60px !important;
                    min-height: 60px !important;
                    font-size: 24px !important;
                    flex-shrink: 0 !important;
                }
                
                #aiButtonsContainer {
                    display: grid !important;
                    grid-template-columns: repeat(2, 1fr) !important;
                    gap: 8px !important;
                    width: 100% !important;
                }
                
                .ai-button-compact {
                    padding: 12px 8px !important;
                    min-height: 44px !important;
                    text-align: center !important;
                }
                
                #registeredPlayersList {
                    grid-template-columns: 1fr !important;
                    gap: 10px !important;
                    max-height: 300px !important;
                    overflow-y: auto !important;
                    margin-top: 15px !important;
                    -webkit-overflow-scrolling: touch !important;
                }
                
                /* 3. Tela de jogo - ajustes */
                #gameContainer {
                    padding-bottom: 100px !important;
                }
                
                /* 4. Bottom Sheet Mobile */
                #gaia-mobile-overlay {
                    transition: opacity 0.3s ease !important;
                    backdrop-filter: blur(4px) !important;
                    z-index: 9990 !important;
                }
                
                #gaia-mobile-sheet {
                    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
                    box-shadow: 0 -10px 40px rgba(0,0,0,0.5) !important;
                    z-index: 9991 !important;
                }
                
                .sheet-open { transform: translateY(0) !important; }
                .sheet-closed { transform: translateY(100%) !important; }
                
                /* 5. Menu flutuante mobile */
                #gaia-mobile-menu {
                    z-index: 9980 !important;
                }
                
                /* 6. Barra de ações mobile (NOVA) */
                #gaia-mobile-action-bar {
                    z-index: 8000 !important;
                    transition: transform 0.3s ease !important;
                }
                
                /* 7. Ajustes gerais */
                .board-cell {
                    min-height: 80px !important;
                    padding: 8px !important;
                }
                
                input, select, textarea {
                    font-size: 16px !important;
                }
                
                button, .icon-button {
                    touch-action: manipulation !important;
                    min-height: 44px !important;
                    min-width: 44px !important;
                }
            }
            
            /* iPhone SE e telas pequenas */
            @media (max-width: 375px) {
                .action-btn {
                    font-size: 10px !important;
                    padding: 6px 2px !important;
                }
            }
        `;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ==================== CONTROLE DO FOOTER ORIGINAL ====================
    
    hideOriginalFooter() {
        // Método AGGRESSIVO para garantir que o footer original NUNCA apareça no mobile
        const footer = document.getElementById('gameFooter');
        if (footer) {
            footer.style.display = 'none';
            footer.style.visibility = 'hidden';
            footer.style.opacity = '0';
            footer.style.pointerEvents = 'none';
            footer.style.position = 'absolute';
            footer.style.zIndex = '-1000';
        }
        
        // Monitorar continuamente para prevenir reaparecimento
        setInterval(() => {
            const checkFooter = document.getElementById('gameFooter');
            if (checkFooter && checkFooter.style.display !== 'none') {
                checkFooter.style.display = 'none';
            }
        }, 1000);
    }

    // ==================== CRIAÇÃO DOS ELEMENTOS MOBILE ====================
    
    createMobileElements() {
        // 1. Overlay para sheets
        this.createMobileOverlay();
        
        // 2. Menu flutuante
        this.createFloatingMenu();
        
        // 3. Barra de ações mobile (APENAS durante o jogo)
        this.createMobileActionBar();
    }
    
    createMobileOverlay() {
        if (document.getElementById('gaia-mobile-overlay')) return;
        
        this.overlay = document.createElement('div');
        this.overlay.id = 'gaia-mobile-overlay';
        Object.assign(this.overlay.style, {
            position: 'fixed',
            inset: '0',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: '9990',
            opacity: '0',
            visibility: 'hidden',
            transition: 'opacity 0.3s ease'
        });
        this.overlay.addEventListener('click', () => this.closeSheet());
        document.body.appendChild(this.overlay);
        
        // Bottom Sheet
        this.bottomSheet = document.createElement('div');
        this.bottomSheet.id = 'gaia-mobile-sheet';
        Object.assign(this.bottomSheet.style, {
            position: 'fixed',
            bottom: '0',
            left: '0',
            right: '0',
            background: 'rgb(17,24,39)',
            borderTop: '1px solid rgba(251,191,36,0.3)',
            borderRadius: '20px 20px 0 0',
            zIndex: '9991',
            transform: 'translateY(100%)',
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.5)'
        });
        
        const handle = document.createElement('div');
        handle.innerHTML = '<div style="width:40px;height:4px;background:rgba(255,255,255,0.3);border-radius:2px;margin:16px auto;"></div>';
        handle.addEventListener('click', () => this.closeSheet());
        this.bottomSheet.appendChild(handle);
        
        this.sheetContent = document.createElement('div');
        this.sheetContent.id = 'gaia-sheet-content';
        this.sheetContent.style.padding = '0 20px 30px';
        this.bottomSheet.appendChild(this.sheetContent);
        
        document.body.appendChild(this.bottomSheet);
    }
    
    createFloatingMenu() {
        if (document.getElementById('gaia-mobile-menu')) return;
        
        this.menuButton = document.createElement('button');
        this.menuButton.id = 'gaia-mobile-menu';
        this.updateMenuButtonStyle();
        this.menuButton.textContent = '☰';
        this.menuButton.title = 'Menu Mobile';
        this.menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showMobileMenu();
        });
        
        document.body.appendChild(this.menuButton);
    }
    
    updateMenuButtonStyle(phase = '') {
        if (!this.menuButton) return;
        
        const isNegotiation = phase.includes('Negociação');
        const bgColor = isNegotiation 
            ? 'linear-gradient(135deg,#8b5cf6,#7c3aed)' 
            : 'linear-gradient(135deg,#3b82f6,#1d4ed8)';
        
        Object.assign(this.menuButton.style, {
            position: 'fixed',
            top: '15px',
            right: '15px',
            width: '50px',
            height: '50px',
            background: bgColor,
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '50%',
            zIndex: '9980',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: 'white',
            boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
        });
    }
    
    createMobileActionBar() {
        if (document.getElementById('gaia-mobile-action-bar')) return;
        
        const actionBar = document.createElement('div');
        actionBar.id = 'gaia-mobile-action-bar';
        Object.assign(actionBar.style, {
            position: 'fixed',
            bottom: '0',
            left: '0',
            right: '0',
            background: 'rgba(11,13,15,0.95)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            padding: '12px 15px',
            zIndex: '8000',
            display: 'none', // Começa oculta
            flexDirection: 'column',
            gap: '8px'
        });
        
        // Container principal
        const mainContainer = document.createElement('div');
        mainContainer.style.cssText = 'display: flex; justify-content: space-between; align-items: center; gap: 8px; width: 100%;';
        
        // Container de ações (4 botões)
        const actionsContainer = document.createElement('div');
        actionsContainer.style.cssText = 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; width: 70%;';
        
        // Botões de ação
        const actions = [
            { id: 'mobile-explore', icon: '⛏️', text: 'Explorar', color: '#3b82f6' },
            { id: 'mobile-collect', icon: '🌾', text: 'Coletar', color: '#10b981' },
            { id: 'mobile-build', icon: '🏗️', text: 'Construir', color: '#f59e0b' },
            { id: 'mobile-negotiate', icon: '🤝', text: 'Negociar', color: '#8b5cf6' }
        ];
        
        actions.forEach(action => {
            const button = document.createElement('button');
            button.id = action.id;
            button.innerHTML = `<span style="font-size:16px;">${action.icon}</span><br><span style="font-size:9px;">${action.text}</span>`;
            button.style.cssText = `
                padding: 8px 4px;
                background: rgba(255,255,255,0.02);
                border: 1px solid rgba(255,255,255,0.04);
                border-radius: 8px;
                color: white;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 2px;
                min-height: 44px;
                font-size: 11px;
                transition: all 0.2s ease;
            `;
            
            button.addEventListener('click', () => {
                switch(action.id) {
                    case 'mobile-explore':
                        this.handleExplore();
                        break;
                    case 'mobile-collect':
                        this.handleCollect();
                        break;
                    case 'mobile-build':
                        this.handleBuild();
                        break;
                    case 'mobile-negotiate':
                        this.handleNegotiate();
                        break;
                }
            });
            
            actionsContainer.appendChild(button);
        });
        
        // Botão Terminar Turno
        const endTurnBtn = document.createElement('button');
        endTurnBtn.id = 'mobile-end-turn';
        endTurnBtn.innerHTML = '🔄<br><span style="font-size:9px;">Terminar</span>';
        endTurnBtn.style.cssText = `
            width: 30%;
            padding: 10px 8px;
            background: linear-gradient(135deg,#ef4444,#dc2626);
            border: none;
            border-radius: 10px;
            color: white;
            font-weight: bold;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
            min-height: 44px;
            font-size: 11px;
            white-space: nowrap;
        `;
        endTurnBtn.addEventListener('click', () => window.gameLogic.handleEndTurn());
        
        mainContainer.appendChild(actionsContainer);
        mainContainer.appendChild(endTurnBtn);
        actionBar.appendChild(mainContainer);
        
        // Contador de ações
        const actionsCounter = document.createElement('div');
        actionsCounter.id = 'mobile-actions-counter';
        actionsCounter.style.cssText = 'text-align: center; font-size: 10px; color: rgba(255,255,255,0.7); margin-top: 4px;';
        actionsCounter.textContent = 'Ações: 2';
        actionBar.appendChild(actionsCounter);
        
        document.body.appendChild(actionBar);
        this.mobileActionBar = actionBar;
    }

    // ==================== GERENCIAMENTO DE TELAS ====================
    
    setupGameStateObserver() {
        // Observar quando o jogo começa/termina
        const checkGameStarted = () => {
            const gameContainer = document.getElementById('gameContainer');
            const isGameStarted = gameContainer && !gameContainer.classList.contains('hidden');
            
            if (isGameStarted !== this.gameStarted) {
                this.gameStarted = isGameStarted;
                this.handleGameStateChange(isGameStarted);
            }
        };
        
        // Verificar periodicamente
        setInterval(checkGameStarted, 500);
        
        // Observar mutações no DOM
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.id === 'gameContainer' || target.id === 'initialScreen') {
                        checkGameStarted();
                    }
                }
            });
        });
        
        observer.observe(document.body, {
            attributes: true,
            subtree: true,
            attributeFilter: ['class']
        });
    }
    
    handleGameStateChange(isGameStarted) {
        console.log(`📱 Estado do jogo: ${isGameStarted ? 'INICIADO' : 'NÃO INICIADO'}`);
        
        if (isGameStarted) {
            this.showGameInterface();
        } else {
            this.showSetupInterface();
        }
    }
    
    showSetupInterface() {
        // Tela de cadastro - mostrar menu button, esconder action bar
        if (this.menuButton) {
            this.menuButton.style.display = 'flex';
            this.menuButton.style.top = '15px';
            this.menuButton.style.right = '15px';
        }
        
        if (this.mobileActionBar) {
            this.mobileActionBar.style.display = 'none';
        }
        
        // Garantir que overlay/sheet estejam fechados
        this.closeSheet();
        
        // Adaptar tela de cadastro
        this.adaptSetupScreen();
    }
    
    showGameInterface() {
        // Tela de jogo - mostrar menu button E action bar
        if (this.menuButton) {
            this.menuButton.style.display = 'flex';
            this.menuButton.style.top = '70px'; // Mais baixo para não atrapalhar navbar
            this.menuButton.style.right = '15px';
        }
        
        if (this.mobileActionBar) {
            this.mobileActionBar.style.display = 'flex';
            this.mobileActionBar.style.transform = 'translateY(0)';
        }
        
        // Configurar interações do jogo
        this.setupGameInteractions();
        
        // Atualizar fase atual
        this.updateForCurrentPhase();
    }

    // ==================== ADAPTAÇÃO DA TELA DE CADASTRO ====================
    
    adaptSetupScreen() {
        // Garantir que elementos interativos sejam tocáveis
        this.optimizeTouchElements();
    }
    
    optimizeTouchElements() {
        document.querySelectorAll('#initialScreen button, #initialScreen input, #initialScreen select, #initialScreen .icon-button').forEach(el => {
            if (el.offsetHeight < 44) el.style.minHeight = '44px';
            if (el.offsetWidth < 44) el.style.minWidth = '44px';
            el.style.touchAction = 'manipulation';
        });
    }

    // ==================== INTERAÇÕES DO JOGO ====================
    
    setupGameInteractions() {
        // Configurar toque longo para regiões
        this.setupRegionTouch();
        
        // Monitorar fase do jogo
        this.setupPhaseMonitor();
        
        // Monitorar seleção de região
        this.setupRegionSelectionMonitor();
    }
    
    setupRegionTouch() {
        let touchTimer = null;
        let touchStartElement = null;
        
        document.addEventListener('touchstart', (e) => {
            const cell = e.target.closest('.board-cell');
            if (!cell) return;
            
            touchStartElement = cell;
            touchTimer = setTimeout(() => {
                if (touchStartElement === cell) {
                    this.handleLongPressOnCell(cell);
                }
            }, 500);
        }, { passive: true });
        
        document.addEventListener('touchend', () => {
            clearTimeout(touchTimer);
            touchStartElement = null;
        }, { passive: true });
        
        document.addEventListener('touchmove', () => {
            clearTimeout(touchTimer);
            touchStartElement = null;
        }, { passive: true });
    }
    
    handleLongPressOnCell(cell) {
        const regionId = parseInt(cell.dataset.regionId);
        if (!window.gameState?.regions?.[regionId]) return;
        
        const region = window.gameState.regions[regionId];
        this.currentRegionId = regionId;
        
        // Definir região selecionada no gameState
        if (window.gameState) {
            window.gameState.selectedRegionId = regionId;
        }
        
        this.showRegionSheet(region);
        
        // Feedback tátil
        if (navigator.vibrate) navigator.vibrate(50);
    }
    
    setupPhaseMonitor() {
        // Observar mudanças na fase do jogo
        const phaseObserver = new MutationObserver(() => {
            const phaseElement = document.getElementById('phaseIndicator');
            if (phaseElement) {
                this.updateForCurrentPhase(phaseElement.textContent);
            }
        });
        
        const phaseElement = document.getElementById('phaseIndicator');
        if (phaseElement) {
            phaseObserver.observe(phaseElement, {
                characterData: true,
                childList: true,
                subtree: true
            });
        }
    }
    
    updateForCurrentPhase(phaseText = '') {
        // Atualizar menu button
        this.updateMenuButtonStyle(phaseText);
        
        // Atualizar barra de ações
        this.updateActionBarForPhase(phaseText);
        
        // Atualizar contador de ações
        this.updateActionsCounter();
    }
    
    updateActionBarForPhase(phaseText) {
        if (!this.mobileActionBar) return;
        
        const isNegotiationPhase = phaseText.includes('Negociação');
        const negotiateBtn = document.getElementById('mobile-negotiate');
        
        if (negotiateBtn) {
            if (isNegotiationPhase) {
                negotiateBtn.style.opacity = '1';
                negotiateBtn.style.pointerEvents = 'auto';
                negotiateBtn.title = 'Abrir negociação';
            } else {
                negotiateBtn.style.opacity = '0.5';
                negotiateBtn.style.pointerEvents = 'none';
                negotiateBtn.title = 'Disponível apenas na fase de negociação';
            }
        }
    }
    
    updateActionsCounter() {
        if (!this.mobileActionBar || !window.gameState) return;
        
        const counter = document.getElementById('mobile-actions-counter');
        if (counter) {
            counter.textContent = `Ações: ${window.gameState.actionsLeft || 0}`;
            
            // Destaque visual se poucas ações
            if (window.gameState.actionsLeft <= 1) {
                counter.style.color = '#ef4444';
                counter.style.fontWeight = 'bold';
            } else {
                counter.style.color = 'rgba(255,255,255,0.7)';
                counter.style.fontWeight = 'normal';
            }
        }
    }
    
    setupRegionSelectionMonitor() {
        // Observar quando uma região é selecionada (para atualizar botões)
        const observer = new MutationObserver(() => {
            this.updateActionButtons();
        });
        
        // Observar todas as células do board
        document.querySelectorAll('.board-cell').forEach(cell => {
            observer.observe(cell, { attributes: true, attributeFilter: ['class'] });
        });
    }
    
    updateActionButtons() {
        // Atualizar estado dos botões baseado na região selecionada
        if (!window.gameState || !this.currentRegionId) return;
        
        const region = window.gameState.regions[this.currentRegionId];
        if (!region) return;
        
        const currentPlayer = getCurrentPlayer();
        const isOwnRegion = region.controller === currentPlayer?.id;
        const canCollect = isOwnRegion && region.explorationLevel > 0;
        const canBuild = isOwnRegion;
        
        const collectBtn = document.getElementById('mobile-collect');
        const buildBtn = document.getElementById('mobile-build');
        
        if (collectBtn) {
            collectBtn.disabled = !canCollect;
            collectBtn.style.opacity = canCollect ? '1' : '0.5';
        }
        
        if (buildBtn) {
            buildBtn.disabled = !canBuild;
            buildBtn.style.opacity = canBuild ? '1' : '0.5';
        }
    }

    // ==================== HANDLERS DE AÇÕES ====================
    
    handleExplore() {
        if (!window.gameLogic || !window.gameLogic.handleExplore) {
            console.error('❌ handleExplore não disponível');
            return;
        }
        
        if (this.currentRegionId === null) {
            this.showRegionSelectionPrompt();
            return;
        }
        
        window.gameLogic.handleExplore();
        this.closeSheet();
    }
    
    handleCollect() {
        if (!window.gameLogic || !window.gameLogic.handleCollect) {
            console.error('❌ handleCollect não disponível');
            return;
        }
        
        if (this.currentRegionId === null) {
            this.showRegionSelectionPrompt();
            return;
        }
        
        window.gameLogic.handleCollect();
        this.closeSheet();
    }
    
    handleBuild() {
        if (!window.uiManager?.modals?.openStructureModal) {
            console.error('❌ openStructureModal não disponível');
            return;
        }
        
        if (this.currentRegionId === null) {
            this.showRegionSelectionPrompt();
            return;
        }
        
        // Garantir que a região está selecionada
        if (window.gameState) {
            window.gameState.selectedRegionId = this.currentRegionId;
        }
        
        window.uiManager.modals.openStructureModal();
        this.closeSheet();
    }
    
    handleNegotiate() {
        if (!window.uiManager?.negotiation?.openNegotiationModal) {
            console.error('❌ openNegotiationModal não disponível');
            return;
        }
        
        window.uiManager.negotiation.openNegotiationModal();
        this.closeSheet();
    }
    
    showRegionSelectionPrompt() {
        if (this.uiManager?.modals?.showFeedback) {
            this.uiManager.modals.showFeedback('Selecione uma região primeiro!', 'warning');
        } else {
            alert('📱 Toque e segure em uma região para selecioná-la.');
        }
    }

    // ==================== SHEETS ====================
    
    showRegionSheet(region) {
        if (!region || this.activeSheet) return;
        
        this.activeSheet = true;
        
        const owner = region.controller !== null ? gameState.players[region.controller] : null;
        const currentPlayer = getCurrentPlayer();
        const isOwnRegion = owner && owner.id === currentPlayer?.id;
        
        const resourcesHTML = Object.entries(region.resources)
            .filter(([_, val]) => val > 0)
            .map(([key, val]) => `
                <div style="display:flex;flex-direction:column;align-items:center;padding:12px;background:rgba(255,255,255,0.05);border-radius:12px;min-width:70px;">
                    <span style="font-size:28px;">${RESOURCE_ICONS[key]}</span>
                    <span style="font-weight:bold;font-size:18px;margin-top:8px;">${val}</span>
                    <span style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:4px;">${key}</span>
                </div>
            `).join('');
        
        const content = `
            <div style="margin-bottom:20px;">
                <h2 style="font-size:22px;font-weight:bold;color:white;margin-bottom:8px;">
                    ${region.name}
                    <span style="font-size:14px;color:#fbbf24;background:rgba(251,191,36,0.1);padding:4px 8px;border-radius:12px;margin-left:8px;">
                        ${region.biome}
                    </span>
                </h2>
                
                <div style="display:flex;align-items:center;gap:8px;margin-top:12px;">
                    <span style="font-size:14px;color:rgba(255,255,255,0.7);">Controlado por:</span>
                    <span style="font-size:15px;font-weight:bold;color:${owner?.color || '#9ca3af'}">
                        ${owner?.icon || '🏳️'} ${owner?.name || 'Neutro'}
                    </span>
                </div>
                
                <div style="display:flex;align-items:center;gap:12px;margin-top:12px;">
                    <div style="display:flex;align-items:center;gap:4px;background:rgba(0,0,0,0.3);padding:6px 10px;border-radius:8px;">
                        <span style="color:#f59e0b;font-size:18px;">⭐</span>
                        <span style="font-weight:bold;color:white;font-size:16px;">${region.explorationLevel}</span>
                        <span style="font-size:11px;color:rgba(255,255,255,0.5);">Nível</span>
                    </div>
                    
                    ${region.structures.length > 0 ? `
                    <div style="display:flex;align-items:center;gap:4px;background:rgba(59,130,246,0.2);padding:6px 10px;border-radius:8px;">
                        <span style="color:#93c5fd;font-size:18px;">🏗️</span>
                        <span style="font-weight:bold;color:white;font-size:13px;">${region.structures[0]}</span>
                        ${region.structures.length > 1 ? `<span style="font-size:10px;color:rgba(255,255,255,0.5);">+${region.structures.length-1}</span>` : ''}
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div style="margin-bottom:20px;">
                <h3 style="font-size:16px;font-weight:bold;color:#fbbf24;margin-bottom:12px;">Recursos Disponíveis</h3>
                <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:8px;">
                    ${resourcesHTML || `
                    <div style="text-align:center;padding:20px;color:rgba(255,255,255,0.5);font-style:italic;width:100%;">
                        Nenhum recurso disponível
                    </div>
                    `}
                </div>
            </div>
            
            <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:16px;">
                <h3 style="font-size:14px;font-weight:bold;color:rgba(255,255,255,0.9);margin-bottom:12px;text-align:center;">Ações</h3>
                
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <button onclick="window.uiManager.mobileManager.executeAction('explore', ${region.id})"
                            style="padding:14px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border:none;border-radius:12px;color:white;font-weight:bold;font-size:14px;display:flex;flex-direction:column;align-items:center;gap:4px;">
                        <span style="font-size:20px;">⛏️</span>
                        <span style="font-size:12px;">${region.controller === null ? 'Dominar' : 'Explorar'}</span>
                    </button>
                    
                    <button onclick="window.uiManager.mobileManager.executeAction('collect', ${region.id})"
                            style="padding:14px;background:linear-gradient(135deg,#10b981,#059669);border:none;border-radius:12px;color:white;font-weight:bold;font-size:14px;display:flex;flex-direction:column;align-items:center;gap:4px;${!isOwnRegion ? 'opacity:0.5;cursor:not-allowed;' : ''}"
                            ${!isOwnRegion ? 'disabled' : ''}>
                        <span style="font-size:20px;">🌾</span>
                        <span style="font-size:12px;">Coletar</span>
                    </button>
                </div>
                
                <button onclick="window.uiManager.mobileManager.executeAction('build', ${region.id})"
                        style="width:100%;padding:14px;margin-top:10px;background:linear-gradient(135deg,#f59e0b,#d97706);border:none;border-radius:12px;color:white;font-weight:bold;font-size:14px;display:flex;justify-content:center;align-items:center;gap:8px;${!isOwnRegion ? 'opacity:0.5;cursor:not-allowed;' : ''}"
                        ${!isOwnRegion ? 'disabled' : ''}>
                    <span style="font-size:20px;">🏗️</span>
                    <span>Construir</span>
                </button>
            </div>
        `;
        
        this.sheetContent.innerHTML = content;
        this.openSheet();
    }
    
    executeAction(action, regionId) {
        this.currentRegionId = regionId;
        
        if (window.gameState) {
            window.gameState.selectedRegionId = regionId;
        }
        
        switch(action) {
            case 'explore':
                this.handleExplore();
                break;
            case 'collect':
                this.handleCollect();
                break;
            case 'build':
                this.handleBuild();
                break;
        }
    }
    
    showMobileMenu() {
        if (this.activeSheet) return;
        
        const currentPlayer = getCurrentPlayer();
        if (!currentPlayer) return;
        
        // Verificar fase atual
        const phaseElement = document.getElementById('phaseIndicator');
        const currentPhase = phaseElement?.textContent || '';
        const isNegotiationPhase = currentPhase.includes('Negociação');
        
        const resourcesHTML = Object.entries(currentPlayer.resources || {})
            .map(([key, val]) => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:rgba(0,0,0,0.3);border-radius:8px;margin-bottom:6px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:18px;">${RESOURCE_ICONS[key]}</span>
                        <span style="color:rgba(255,255,255,0.9);font-size:13px;">${key}</span>
                    </div>
                    <span style="font-weight:bold;color:white;font-size:16px;">${val}</span>
                </div>
            `).join('');
        
        const content = `
            <div style="padding:8px 0;">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.1);">
                    <span style="font-size:40px;">${currentPlayer.icon}</span>
                    <div>
                        <div style="font-size:20px;font-weight:bold;color:white;margin-bottom:4px;">${currentPlayer.name}</div>
                        <div style="color:${currentPlayer.color};font-size:14px;margin-bottom:6px;">${currentPlayer.faction?.name || 'Sem facção'}</div>
                        <div style="background:rgba(245,158,11,0.2);color:#f59e0b;padding:4px 10px;border-radius:10px;font-weight:bold;font-size:16px;display:inline-block;">
                            ${currentPlayer.victoryPoints} PV
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom:20px;">
                    <div style="font-size:16px;font-weight:bold;color:#fbbf24;margin-bottom:10px;">📦 Recursos</div>
                    <div style="max-height:180px;overflow-y:auto;">
                        ${resourcesHTML}
                    </div>
                </div>
                
                ${isNegotiationPhase ? `
                <button onclick="window.uiManager.mobileManager.handleNegotiate()"
                        style="width:100%;padding:14px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);border:none;border-radius:12px;color:white;font-weight:bold;font-size:15px;display:flex;justify-content:center;align-items:center;gap:10px;margin-bottom:12px;">
                    <span style="font-size:20px;">🤝</span>
                    <span>Abrir Negociação</span>
                </button>
                ` : ''}
                
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <button onclick="window.gameLogic.handleEndTurn(); window.uiManager.mobileManager.closeSheet();"
                            style="padding:12px;background:linear-gradient(135deg,#10b981,#059669);border:none;border-radius:10px;color:white;font-weight:bold;font-size:14px;display:flex;flex-direction:column;align-items:center;gap:4px;">
                        <span style="font-size:20px;">🔄</span>
                        <span>Terminar Turno</span>
                    </button>
                    
                    <button onclick="window.uiManager.modals.openManual(); window.uiManager.mobileManager.closeSheet();"
                            style="padding:12px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border:none;border-radius:10px;color:white;font-weight:bold;font-size:14px;display:flex;flex-direction:column;align-items:center;gap:4px;">
                        <span style="font-size:20px;">📖</span>
                        <span>Manual</span>
                    </button>
                </div>
            </div>
        `;
        
        this.sheetContent.innerHTML = content;
        this.openSheet();
    }
    
    openSheet() {
        this.activeSheet = true;
        this.overlay.style.visibility = 'visible';
        setTimeout(() => {
            this.overlay.style.opacity = '1';
            this.bottomSheet.style.transform = 'translateY(0)';
        }, 10);
        document.body.style.overflow = 'hidden';
        
        // Ocultar action bar temporariamente
        if (this.mobileActionBar) {
            this.mobileActionBar.style.transform = 'translateY(100%)';
        }
    }
    
    closeSheet() {
        if (!this.activeSheet) return;
        
        this.bottomSheet.style.transform = 'translateY(100%)';
        this.overlay.style.opacity = '0';
        
        setTimeout(() => {
            this.overlay.style.visibility = 'hidden';
            this.sheetContent.innerHTML = '';
            document.body.style.overflow = '';
            this.activeSheet = false;
            
            // Restaurar action bar
            if (this.mobileActionBar && this.gameStarted) {
                this.mobileActionBar.style.transform = 'translateY(0)';
            }
        }, 300);
    }

    // ==================== EVENT LISTENERS ====================
    
    setupEventListeners() {
        // Redimensionamento
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const newIsMobile = this.detectMobile();
                if (newIsMobile !== this.isMobile) {
                    this.isMobile = newIsMobile;
                    if (this.isMobile) {
                        this.injectMobileStyles();
                        this.hideOriginalFooter();
                    }
                }
            }, 250);
        });
        
        // Tecla ESC para fechar sheet
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeSheet) {
                e.preventDefault();
                this.closeSheet();
            }
        });
    }
    
    adaptCurrentScreen() {
        // Adaptação automática baseada na tela atual
        const setupScreen = document.getElementById('initialScreen');
        const gameScreen = document.getElementById('gameContainer');
        
        if (setupScreen && !setupScreen.classList.contains('hidden')) {
            this.showSetupInterface();
        } else if (gameScreen && !gameScreen.classList.contains('hidden')) {
            this.showGameInterface();
        }
    }
}

// Expor globalmente
window.GaiaMobileManager = UIMobileManager;