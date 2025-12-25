// ui-mobile.js - Adaptador Mobile Otimizado (Sistema de Sheets Unificado)
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
        this.sheetStartY = 0;
        this.sheetCurrentY = 0;
        
        console.log(`📱 Mobile Manager: ${this.isMobile ? 'Ativo' : 'Inativo'}`);
    }

    // ==================== DETECÇÃO ====================
    
    detectMobile() {
        const isMobileWidth = window.innerWidth <= 768;
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Forçar mobile se menor que 768px (para desenvolvimento)
        return isMobileWidth || (isMobileWidth && isTouchDevice);
    }

    // ==================== INICIALIZAÇÃO ====================
    
    init() {
        if (!this.isMobile) return;
        
        console.log('📱 Iniciando adaptações mobile (sistema de sheets)...');
        
        // 1. Injetar estilos críticos
        this.injectMobileStyles();
        
        // 2. Esconder footer original permanentemente
        this.hideOriginalFooter();
        
        // 3. Criar elementos mobile
        this.createMobileElements();
        
        // 4. Configurar observador de estado do jogo
        this.setupGameStateObserver();
        
        // 5. Configurar eventos
        this.setupEventListeners();
        
        // 6. Adaptar tela atual
        this.adaptCurrentScreen();
        
        console.log('✅ Mobile Manager inicializado (sistema de sheets)');
    }

    // ==================== ESTILOS MOBILE ====================
    
    injectMobileStyles() {
        const styleId = 'gaia-mobile-optimized';
        if (document.getElementById(styleId)) return;
        
        const css = `
            /* === MOBILE OPTIMIZED STYLES === */
            @media (max-width: 768px) {
                /* 1. SEMPRE ocultar footer original */
                #gameFooter {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                    position: absolute !important;
                    z-index: -1000 !important;
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
                
                /* 3. Aumentar área de toque para células */
                .board-cell {
                    min-height: 100px !important;
                    padding: 10px !important;
                    -webkit-tap-highlight-color: transparent;
                    touch-action: manipulation;
                }
                
                .board-cell:active {
                    transition: transform 0.1s !important;
                    transform: scale(0.98) !important;
                }
                
                /* 4. Indicador visual para região selecionada (mobile) */
                .region-selected-mobile {
                    animation: mobileRegionPulse 2s infinite !important;
                    border: 3px solid #fbbf24 !important;
                    box-shadow: 0 0 20px rgba(251, 191, 36, 0.5) !important;
                    z-index: 100 !important;
                }
                
                @keyframes mobileRegionPulse {
                    0%, 100% { border-color: #fbbf24; }
                    50% { border-color: #fcd34d; }
                }
                
                /* 5. Menu flutuante mobile */
                #gaia-mobile-menu {
                    z-index: 9980 !important;
                }
                
                /* 6. Botão flutuante para região selecionada */
                #mobile-region-fab {
                    z-index: 9990 !important;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }
                
                #mobile-region-fab:active {
                    transform: scale(0.9) !important;
                }
                
                /* 7. Sheet mobile */
                #gaia-mobile-overlay {
                    transition: opacity 0.3s ease !important;
                    backdrop-filter: blur(4px) !important;
                    z-index: 9995 !important;
                }
                
                #gaia-mobile-sheet {
                    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
                    box-shadow: 0 -10px 40px rgba(0,0,0,0.5) !important;
                    z-index: 9996 !important;
                    max-height: 70vh !important;
                    border-radius: 20px 20px 0 0 !important;
                    overflow-y: auto !important;
                    -webkit-overflow-scrolling: touch !important;
                }
                
                .sheet-open { transform: translateY(0) !important; }
                .sheet-closed { transform: translateY(100%) !important; }
                
                /* 8. Botões maiores na sheet */
                #gaia-sheet-content button {
                    min-height: 52px !important;
                    font-size: 16px !important;
                }
                
                /* 9. Ajustes gerais para touch */
                input, select, textarea, button, .icon-button {
                    min-height: 44px !important;
                    min-width: 44px !important;
                    font-size: 16px !important;
                    touch-action: manipulation !important;
                }
                
                /* 10. Feedback visual para ações indisponíveis */
                button:disabled {
                    opacity: 0.5 !important;
                    transform: scale(0.95) !important;
                    filter: grayscale(0.7) !important;
                }
            }
            
            /* iPhone SE e telas pequenas */
            @media (max-width: 375px) {
                .board-cell {
                    min-height: 90px !important;
                    padding: 8px !important;
                }
                
                #gaia-mobile-sheet {
                    max-height: 65vh !important;
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
        const footer = document.getElementById('gameFooter');
        if (footer) {
            footer.style.display = 'none';
            footer.style.visibility = 'hidden';
            footer.style.opacity = '0';
            footer.style.pointerEvents = 'none';
            footer.style.position = 'absolute';
            footer.style.zIndex = '-1000';
        }
        
        // Monitorar para prevenir reaparecimento
        const observer = new MutationObserver(() => {
            const checkFooter = document.getElementById('gameFooter');
            if (checkFooter && checkFooter.style.display !== 'none') {
                checkFooter.style.display = 'none';
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    }

    // ==================== CRIAÇÃO DOS ELEMENTOS MOBILE ====================
    
    createMobileElements() {
        // 1. Overlay para sheets
        this.createMobileOverlay();
        
        // 2. Menu flutuante
        this.createFloatingMenu();
        
        // 3. Botão flutuante para região selecionada
        this.createRegionFAB();
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
            zIndex: '9995',
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
            zIndex: '9996',
            transform: 'translateY(100%)',
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            maxHeight: '70vh',
            overflowY: 'auto',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
            WebkitOverflowScrolling: 'touch'
        });
        
        // Handle para arrastar
        const handle = document.createElement('div');
        handle.style.cssText = 'padding: 16px 0 8px; touch-action: none;';
        handle.innerHTML = '<div style="width:40px;height:4px;background:rgba(255,255,255,0.3);border-radius:2px;margin:0 auto;"></div>';
        this.bottomSheet.appendChild(handle);
        
        this.sheetContent = document.createElement('div');
        this.sheetContent.id = 'gaia-sheet-content';
        this.sheetContent.style.padding = '0 20px 30px';
        this.bottomSheet.appendChild(this.sheetContent);
        
        // Configurar gestos de arrastar
        this.setupSheetGestures(handle);
        
        document.body.appendChild(this.bottomSheet);
    }
    
    setupSheetGestures(handle) {
        handle.addEventListener('touchstart', (e) => {
            this.sheetStartY = e.touches[0].clientY;
            this.sheetCurrentY = this.sheetStartY;
        }, { passive: true });
        
        handle.addEventListener('touchmove', (e) => {
            if (!this.activeSheet) return;
            
            this.sheetCurrentY = e.touches[0].clientY;
            const diff = this.sheetCurrentY - this.sheetStartY;
            
            if (diff > 0) { // Arrastando para baixo
                this.bottomSheet.style.transform = `translateY(${diff}px)`;
            }
        }, { passive: true });
        
        handle.addEventListener('touchend', () => {
            if (!this.activeSheet) return;
            
            const diff = this.sheetCurrentY - this.sheetStartY;
            
            if (diff > 100) { // Arrastou mais de 100px para baixo
                this.closeSheet();
            } else {
                this.bottomSheet.style.transform = 'translateY(0)';
            }
            
            this.sheetStartY = 0;
            this.sheetCurrentY = 0;
        }, { passive: true });
    }
    
    createFloatingMenu() {
        if (document.getElementById('gaia-mobile-menu')) return;
        
        this.menuButton = document.createElement('button');
        this.menuButton.id = 'gaia-mobile-menu';
        this.updateMenuButtonStyle();
        this.menuButton.innerHTML = '☰';
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
            transition: 'all 0.3s ease',
            touchAction: 'manipulation'
        });
    }
    
    createRegionFAB() {
        if (document.getElementById('mobile-region-fab')) return;
        
        this.regionFAB = document.createElement('button');
        this.regionFAB.id = 'mobile-region-fab';
        this.regionFAB.innerHTML = '📍';
        this.regionFAB.title = 'Região selecionada - Toque para ver detalhes';
        
        Object.assign(this.regionFAB.style, {
            position: 'fixed',
            bottom: '80px',
            right: '15px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            border: '2px solid white',
            color: 'white',
            fontSize: '24px',
            zIndex: '9990',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            touchAction: 'manipulation',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        });
        
        this.regionFAB.addEventListener('click', () => {
            if (this.currentRegionId !== null) {
                const region = gameState.regions[this.currentRegionId];
                if (region) {
                    // Rolar para a célula
                    const cell = document.querySelector(`[data-region-id="${this.currentRegionId}"]`);
                    if (cell) {
                        cell.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center',
                            inline: 'center'
                        });
                        
                        // Feedback visual
                        cell.classList.add('region-selected-mobile');
                        setTimeout(() => {
                            cell.classList.remove('region-selected-mobile');
                        }, 1000);
                    }
                    
                    // Mostrar sheet
                    this.showRegionSheet(region);
                }
            }
        });
        
        this.regionFAB.addEventListener('touchstart', () => {
            this.regionFAB.style.transform = 'scale(0.9)';
        });
        
        this.regionFAB.addEventListener('touchend', () => {
            this.regionFAB.style.transform = 'scale(1)';
        });
        
        document.body.appendChild(this.regionFAB);
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
        const observer = new MutationObserver(() => {
            checkGameStarted();
            this.syncRegionSelection(); // Sincronizar seleção quando DOM mudar
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
        // Tela de cadastro - mostrar menu button
        if (this.menuButton) {
            this.menuButton.style.display = 'flex';
            this.menuButton.style.top = '15px';
            this.menuButton.style.right = '15px';
        }
        
        // Esconder FAB de região
        if (this.regionFAB) {
            this.regionFAB.style.display = 'none';
        }
        
        // Garantir que overlay/sheet estejam fechados
        this.closeSheet();
        
        // Adaptar tela de cadastro
        this.adaptSetupScreen();
    }
    
    showGameInterface() {
        // Tela de jogo - mostrar menu button e FAB
        if (this.menuButton) {
            this.menuButton.style.display = 'flex';
            this.menuButton.style.top = '70px';
            this.menuButton.style.right = '15px';
        }
        
        // Mostrar FAB se houver região selecionada
        this.updateRegionFAB();
        
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
        
        // Sincronizar com gameState
        if (window.gameState) {
            window.gameState.selectedRegionId = regionId;
            this.uiManager.gameManager.clearRegionSelection();
            
            // Adicionar classe de seleção mobile
            document.querySelectorAll('.board-cell').forEach(c => {
                c.classList.remove('region-selected-mobile');
            });
            cell.classList.add('region-selected-mobile');
        }
        
        this.showRegionSheet(region);
        
        // Feedback tátil melhorado
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        
        // Feedback visual
        cell.style.transform = 'scale(0.95)';
        setTimeout(() => {
            cell.style.transform = '';
        }, 200);
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
    }
    
    setupRegionSelectionMonitor() {
        // Observar quando uma região é selecionada
        const observer = new MutationObserver(() => {
            this.syncRegionSelection();
        });
        
        // Observar todas as células do board
        document.querySelectorAll('.board-cell').forEach(cell => {
            observer.observe(cell, { 
                attributes: true, 
                attributeFilter: ['class', 'data-region-id'] 
            });
        });
    }
    
    syncRegionSelection() {
        // Sincronizar currentRegionId com gameState
        if (gameState.selectedRegionId !== null && 
            gameState.selectedRegionId !== this.currentRegionId) {
            this.currentRegionId = gameState.selectedRegionId;
        }
        
        // Atualizar visual da célula selecionada
        document.querySelectorAll('.board-cell').forEach(cell => {
            cell.classList.remove('region-selected-mobile');
        });
        
        if (this.currentRegionId !== null) {
            const selectedCell = document.querySelector(`[data-region-id="${this.currentRegionId}"]`);
            if (selectedCell) {
                selectedCell.classList.add('region-selected-mobile');
            }
        }
        
        // Atualizar FAB
        this.updateRegionFAB();
    }
    
    updateRegionFAB() {
        if (!this.regionFAB) return;
        
        const shouldShow = this.currentRegionId !== null && 
                          gameState.selectedRegionId === this.currentRegionId &&
                          this.gameStarted;
        
        if (shouldShow) {
            this.regionFAB.style.display = 'flex';
            
            // Animar entrada
            this.regionFAB.style.opacity = '0';
            this.regionFAB.style.transform = 'translateY(20px) scale(0.8)';
            
            setTimeout(() => {
                this.regionFAB.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                this.regionFAB.style.opacity = '1';
                this.regionFAB.style.transform = 'translateY(0) scale(1)';
            }, 10);
        } else {
            this.regionFAB.style.display = 'none';
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
                <div style="display:flex;flex-direction:column;align-items:center;padding:12px;background:rgba(255,255,255,0.05);border-radius:12px;min-width:70px;flex:1;">
                    <span style="font-size:28px;">${RESOURCE_ICONS[key]}</span>
                    <span style="font-weight:bold;font-size:18px;margin-top:8px;">${val}</span>
                    <span style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:4px;text-transform:capitalize">${key}</span>
                </div>
            `).join('');
        
        // Determinar ação principal
        let primaryAction = 'explorar';
        let primaryActionText = 'Explorar';
        let primaryActionDisabled = false;
        
        if (region.controller === null) {
            primaryAction = 'dominar';
            primaryActionText = 'Dominar';
            
            // Verificar se pode dominar
            const player = currentPlayer;
            const hasEnoughPV = player?.victoryPoints >= 2;
            const canPayBiome = Object.entries(region.resources)
                .every(([key, value]) => (player?.resources[key] || 0) >= value);
            
            primaryActionDisabled = !hasEnoughPV || !canPayBiome;
        } else if (!isOwnRegion) {
            primaryActionDisabled = true;
            primaryActionText = 'Controlada';
        }
        
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
            
            ${resourcesHTML ? `
            <div style="margin-bottom:20px;">
                <h3 style="font-size:16px;font-weight:bold;color:#fbbf24;margin-bottom:12px;">Recursos Disponíveis</h3>
                <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:8px;-webkit-overflow-scrolling:touch;">
                    ${resourcesHTML}
                </div>
            </div>
            ` : ''}
            
            <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:16px;">
                <h3 style="font-size:14px;font-weight:bold;color:rgba(255,255,255,0.9);margin-bottom:12px;text-align:center;">Ações Disponíveis</h3>
                
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <button onclick="window.uiManager.mobileManager.executeAction('${primaryAction}', ${region.id})"
                            style="padding:14px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border:none;border-radius:12px;color:white;font-weight:bold;font-size:14px;display:flex;flex-direction:column;align-items:center;gap:4px;${primaryActionDisabled ? 'opacity:0.5;cursor:not-allowed;' : ''}"
                            ${primaryActionDisabled ? 'disabled' : ''}>
                        <span style="font-size:20px;">${primaryAction === 'dominar' ? '👑' : '⛏️'}</span>
                        <span style="font-size:12px;">${primaryActionText}</span>
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
                
                <div style="margin-top:12px;text-align:center;">
                    <button onclick="window.uiManager.mobileManager.closeSheet()"
                            style="width:100%;padding:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:rgba(255,255,255,0.7);font-size:13px;">
                        Fechar
                    </button>
                </div>
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
            case 'explorar':
            case 'dominar':
                if (window.gameLogic && window.gameLogic.handleExplore) {
                    window.gameLogic.handleExplore();
                }
                break;
            case 'collect':
                if (window.gameLogic && window.gameLogic.handleCollect) {
                    window.gameLogic.handleCollect();
                }
                break;
            case 'build':
                if (window.uiManager?.modals?.openStructureModal) {
                    window.uiManager.modals.openStructureModal();
                }
                break;
        }
        
        this.closeSheet();
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
                        <span style="color:rgba(255,255,255,0.9);font-size:13px;text-transform:capitalize">${key}</span>
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
                
                <div style="margin-top:12px;text-align:center;">
                    <button onclick="window.uiManager.mobileManager.closeSheet()"
                            style="width:100%;padding:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:rgba(255,255,255,0.7);font-size:13px;">
                        Fechar
                    </button>
                </div>
            </div>
        `;
        
        this.sheetContent.innerHTML = content;
        this.openSheet();
    }
    
    handleNegotiate() {
        if (window.uiManager?.negotiation?.openNegotiationModal) {
            window.uiManager.negotiation.openNegotiationModal();
            this.closeSheet();
        }
    }
    
    openSheet() {
        if (this.activeSheet) return;
        
        this.activeSheet = true;
        this.overlay.style.visibility = 'visible';
        
        setTimeout(() => {
            this.overlay.style.opacity = '1';
            this.bottomSheet.style.transform = 'translateY(0)';
        }, 10);
        
        document.body.style.overflow = 'hidden';
        
        // Esconder FAB temporariamente
        if (this.regionFAB) {
            this.regionFAB.style.display = 'none';
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
            
            // Restaurar FAB se necessário
            this.updateRegionFAB();
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
        
        // Toque fora do sheet para fechar (no overlay já configurado)
        
        // Sincronizar seleção periodicamente
        setInterval(() => {
            this.syncRegionSelection();
        }, 1000);
    }
    
    adaptCurrentScreen() {
        const setupScreen = document.getElementById('initialScreen');
        const gameScreen = document.getElementById('gameContainer');
        
        if (setupScreen && !setupScreen.classList.contains('hidden')) {
            this.showSetupInterface();
        } else if (gameScreen && !gameScreen.classList.contains('hidden')) {
            this.showGameInterface();
        }
    }
}

// Expor globalmente para acesso
window.GaiaMobileManager = UIMobileManager;