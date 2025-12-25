// ui-mobile.js - Adaptador Mobile Corrigido
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
        
        // Forçar mobile se menor que 768px
        return isMobileWidth || (isMobileWidth && isTouchDevice);
    }

    // ==================== INICIALIZAÇÃO ====================
    
    init() {
        if (!this.isMobile) return;
        
        console.log('📱 Iniciando adaptações mobile (sistema de sheets)...');
        
        // 1. Injetar estilos críticos (com correção para cadastro)
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
        const styleId = 'gaia-mobile-corrected';
        if (document.getElementById(styleId)) return;
        
        const css = `
            /* === MOBILE CORRECTED STYLES === */
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
                
                /* 2. TELA DE CADASTRO EM COLUNA (CORREÇÃO) */
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
                
                /* CORREÇÃO CRÍTICA: Layout de cadastro em coluna */
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
                
                /* 4. Aumentar área de toque para células */
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
                
                /* 5. Indicador visual para região selecionada (mobile) */
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
                
                /* 6. Menu flutuante mobile (FAB do sidebar) */
                #gaia-mobile-menu {
                    position: fixed !important;
                    top: 70px !important;
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
                    box-shadow: 0 4px 20px rgba(59,130,246,0.4) !important;
                    cursor: pointer !important;
                    transition: all 0.3s ease !important;
                    touch-action: manipulation !important;
                }
                
                /* 7. Botão flutuante para região selecionada */
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
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
                    cursor: pointer !important;
                    touch-action: manipulation !important;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }
                
                #mobile-region-fab:active {
                    transform: scale(0.9) !important;
                }
                
                /* 8. Sheet mobile */
                #gaia-mobile-overlay {
                    position: fixed !important;
                    inset: 0 !important;
                    background: rgba(0,0,0,0.7) !important;
                    backdrop-filter: blur(4px) !important;
                    z-index: 9995 !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                    transition: opacity 0.3s ease !important;
                }
                
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
                    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
                    max-height: 70vh !important;
                    overflow-y: auto !important;
                    box-shadow: 0 -10px 40px rgba(0,0,0,0.5) !important;
                    -webkit-overflow-scrolling: touch !important;
                }
                
                .sheet-open { transform: translateY(0) !important; }
                .sheet-closed { transform: translateY(100%) !important; }
                
                /* 9. Botões maiores na sheet */
                #gaia-sheet-content button {
                    min-height: 52px !important;
                    font-size: 16px !important;
                }
                
                /* 10. Ajustes gerais para touch */
                input, select, textarea, button, .icon-button {
                    min-height: 44px !important;
                    min-width: 44px !important;
                    font-size: 16px !important;
                    touch-action: manipulation !important;
                }
                
                /* 11. Feedback visual para ações indisponíveis */
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
                
                #gaia-mobile-menu {
                    top: 60px !important;
                    right: 10px !important;
                    width: 45px !important;
                    height: 45px !important;
                    font-size: 20px !important;
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
        setInterval(() => {
            const checkFooter = document.getElementById('gameFooter');
            if (checkFooter && checkFooter.style.display !== 'none') {
                checkFooter.style.display = 'none';
                console.log('🛡️ Footer original bloqueado (mobile)');
            }
        }, 1000);
    }

    // ==================== CRIAÇÃO DOS ELEMENTOS MOBILE ====================
    
    createMobileElements() {
        // 1. Overlay para sheets
        this.createMobileOverlay();
        
        // 2. Menu flutuante (FAB do sidebar)
        this.createFloatingMenu();
        
        // 3. Botão flutuante para região selecionada
        this.createRegionFAB();
    }
    
    createMobileOverlay() {
        if (document.getElementById('gaia-mobile-overlay')) return;
        
        this.overlay = document.createElement('div');
        this.overlay.id = 'gaia-mobile-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(4px);
            z-index: 9995;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease;
        `;
        this.overlay.addEventListener('click', () => this.closeSheet());
        document.body.appendChild(this.overlay);
        
        // Bottom Sheet
        this.bottomSheet = document.createElement('div');
        this.bottomSheet.id = 'gaia-mobile-sheet';
        this.bottomSheet.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgb(17,24,39);
            border-top: 1px solid rgba(251,191,36,0.3);
            border-radius: 20px 20px 0 0;
            z-index: 9996;
            transform: translateY(100%);
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            max-height: 70vh;
            overflow-y: auto;
            box-shadow: 0 -10px 40px rgba(0,0,0,0.5);
            -webkit-overflow-scrolling: touch;
        `;
        
        // Handle para arrastar
        const handle = document.createElement('div');
        handle.style.cssText = 'padding: 16px 0 8px; touch-action: none; cursor: grab;';
        handle.innerHTML = '<div style="width:40px;height:4px;background:rgba(255,255,255,0.3);border-radius:2px;margin:0 auto;"></div>';
        this.bottomSheet.appendChild(handle);
        
        this.sheetContent = document.createElement('div');
        this.sheetContent.id = 'gaia-sheet-content';
        this.sheetContent.style.cssText = 'padding: 0 20px 30px;';
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
        this.menuButton.innerHTML = '☰';
        this.menuButton.title = 'Menu Mobile';
        this.menuButton.style.cssText = `
            position: fixed;
            top: 70px;
            right: 15px;
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg,#3b82f6,#1d4ed8);
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            z-index: 9980;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
            box-shadow: 0 4px 20px rgba(59,130,246,0.4);
            cursor: pointer;
            transition: all 0.3s ease;
            touch-action: manipulation;
        `;
        
        this.menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.showMobileMenu();
        });
        
        this.menuButton.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            this.menuButton.style.transform = 'scale(0.9)';
        });
        
        this.menuButton.addEventListener('touchend', (e) => {
            e.stopPropagation();
            this.menuButton.style.transform = 'scale(1)';
            this.showMobileMenu();
        });
        
        document.body.appendChild(this.menuButton);
    }
    
    createRegionFAB() {
        if (document.getElementById('mobile-region-fab')) return;
        
        this.regionFAB = document.createElement('button');
        this.regionFAB.id = 'mobile-region-fab';
        this.regionFAB.innerHTML = '📍';
        this.regionFAB.title = 'Região selecionada - Toque para ver detalhes';
        this.regionFAB.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 15px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border: 2px solid white;
            color: white;
            font-size: 24px;
            z-index: 9990;
            display: none;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            cursor: pointer;
            touch-action: manipulation;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        
        this.regionFAB.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.currentRegionId !== null) {
                const region = gameState.regions[this.currentRegionId];
                if (region) {
                    // Mostrar sheet
                    this.showRegionSheet(region);
                }
            }
        });
        
        this.regionFAB.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            this.regionFAB.style.transform = 'scale(0.9)';
        });
        
        this.regionFAB.addEventListener('touchend', (e) => {
            e.stopPropagation();
            this.regionFAB.style.transform = 'scale(1)';
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
        // Observar quando o jogo começa/termina
        const checkGameStarted = () => {
            const gameContainer = document.getElementById('gameContainer');
            const isGameStarted = gameContainer && !gameContainer.classList.contains('hidden');
            
            if (isGameStarted !== this.gameStarted) {
                this.gameStarted = isGameStarted;
                this.handleGameStateChange(isGameStarted);
            }
        };
        
        // Verificar a cada 500ms
        const intervalId = setInterval(checkGameStarted, 500);
        
        // Também observar mudanças no DOM
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
        
        // Parar intervalo quando a página for descarregada
        window.addEventListener('beforeunload', () => {
            clearInterval(intervalId);
            observer.disconnect();
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
            this.menuButton.style.background = 'linear-gradient(135deg,#3b82f6,#1d4ed8)';
        }
        
        // Esconder FAB de região
        if (this.regionFAB) {
            this.regionFAB.style.display = 'none';
        }
        
        // Garantir que overlay/sheet estejam fechados
        this.closeSheet();
        
        // Adaptar tela de cadastro (já feito pelo CSS)
        console.log('📱 Tela de cadastro ativa (layout coluna)');
    }
    
    showGameInterface() {
        console.log('📱 Tela de jogo ativa');
        
        // Tela de jogo - mostrar menu button e FAB
        if (this.menuButton) {
            this.menuButton.style.display = 'flex';
            this.menuButton.style.top = '70px';
            this.menuButton.style.right = '15px';
            
            // Verificar fase para cor do botão
            const phaseElement = document.getElementById('phaseIndicator');
            if (phaseElement) {
                const phaseText = phaseElement.textContent || '';
                const isNegotiation = phaseText.includes('Negociação');
                this.menuButton.style.background = isNegotiation 
                    ? 'linear-gradient(135deg,#8b5cf6,#7c3aed)' 
                    : 'linear-gradient(135deg,#3b82f6,#1d4ed8)';
            }
        }
        
        // Mostrar FAB se houver região selecionada
        this.updateRegionFAB();
        
        // Configurar interações do jogo
        this.setupGameInteractions();
        
        // Sincronizar seleção inicial
        setTimeout(() => {
            this.syncRegionSelection();
        }, 1000);
    }

    // ==================== ADAPTAÇÃO DA TELA DE CADASTRO ====================
    
    optimizeTouchElements() {
        // Esta função é chamada pelo CSS agora
        console.log('📱 Elementos touch otimizados');
    }

    // ==================== INTERAÇÕES DO JOGO ====================
    
    setupGameInteractions() {
        console.log('📱 Configurando interações do jogo');
        
        // Configurar toque longo para regiões
        this.setupRegionTouch();
        
        // Sincronizar seleção periodicamente
        this.setupSyncInterval();
    }
    
    setupRegionTouch() {
        console.log('📱 Configurando toque longo para regiões');
        
        let touchTimer = null;
        let touchStartElement = null;
        let touchStartTime = 0;
        
        document.addEventListener('touchstart', (e) => {
            const cell = e.target.closest('.board-cell');
            if (!cell) return;
            
            touchStartElement = cell;
            touchStartTime = Date.now();
            touchTimer = setTimeout(() => {
                if (touchStartElement === cell) {
                    this.handleLongPressOnCell(cell);
                }
            }, 500);
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            clearTimeout(touchTimer);
            
            // Se foi um toque rápido (não longo), tratar como clique normal
            if (touchStartElement && Date.now() - touchStartTime < 500) {
                const cell = e.target.closest('.board-cell');
                if (cell && window.gameLogic && window.gameLogic.handleCellClick) {
                    // Delegar para o handler original
                    const regionId = parseInt(cell.dataset.regionId);
                    if (!isNaN(regionId)) {
                        // Simular clique normal
                        this.currentRegionId = regionId;
                        gameState.selectedRegionId = regionId;
                        this.syncRegionSelection();
                    }
                }
            }
            
            touchStartElement = null;
            touchStartTime = 0;
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            clearTimeout(touchTimer);
            touchStartElement = null;
        }, { passive: true });
    }
    
    handleLongPressOnCell(cell) {
        const regionId = parseInt(cell.dataset.regionId);
        if (isNaN(regionId) || !window.gameState?.regions?.[regionId]) {
            console.error('❌ Região inválida para toque longo');
            return;
        }
        
        const region = window.gameState.regions[regionId];
        console.log(`📱 Toque longo na região ${regionId}: ${region.name}`);
        
        this.currentRegionId = regionId;
        
        // Sincronizar com gameState
        if (window.gameState) {
            window.gameState.selectedRegionId = regionId;
            
            // Limpar seleções anteriores
            document.querySelectorAll('.board-cell').forEach(c => {
                c.classList.remove('region-selected-mobile');
            });
            
            // Adicionar classe de seleção mobile
            cell.classList.add('region-selected-mobile');
            
            // Forçar atualização da UI
            if (this.uiManager && this.uiManager.gameManager) {
                this.uiManager.gameManager.updateFooter();
                this.uiManager.gameManager.renderSidebar(gameState.selectedPlayerForSidebar);
            }
        }
        
        this.showRegionSheet(region);
        
        // Feedback tátil melhorado
        if (navigator.vibrate) {
            try {
                navigator.vibrate([50, 30, 50]);
            } catch (e) {
                console.log('📱 Vibração não suportada');
            }
        }
        
        // Feedback visual
        cell.style.transform = 'scale(0.95)';
        setTimeout(() => {
            cell.style.transform = '';
        }, 200);
    }
    
    setupSyncInterval() {
        // Sincronizar seleção periodicamente
        setInterval(() => {
            this.syncRegionSelection();
        }, 1000);
    }
    
    syncRegionSelection() {
        // Sincronizar currentRegionId com gameState
        if (gameState.selectedRegionId !== null && 
            gameState.selectedRegionId !== this.currentRegionId) {
            this.currentRegionId = gameState.selectedRegionId;
            console.log(`📱 Sincronizando seleção: ${this.currentRegionId}`);
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
            if (this.regionFAB.style.display !== 'flex') {
                this.regionFAB.style.display = 'flex';
                
                // Animar entrada
                this.regionFAB.style.opacity = '0';
                this.regionFAB.style.transform = 'translateY(20px) scale(0.8)';
                
                setTimeout(() => {
                    this.regionFAB.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                    this.regionFAB.style.opacity = '1';
                    this.regionFAB.style.transform = 'translateY(0) scale(1)';
                }, 10);
            }
        } else {
            this.regionFAB.style.display = 'none';
        }
    }

    // ==================== SHEETS ====================
    
    showRegionSheet(region) {
        if (!region || this.activeSheet) return;
        
        console.log(`📱 Mostrando sheet para região: ${region.name}`);
        this.activeSheet = 'region';
        
        const owner = region.controller !== null ? gameState.players[region.controller] : null;
        const currentPlayer = getCurrentPlayer();
        const isOwnRegion = owner && owner.id === currentPlayer?.id;
        const canCollect = isOwnRegion && region.explorationLevel > 0;
        const canBuild = isOwnRegion;
        
        // Recursos disponíveis
        const resourcesHTML = Object.entries(region.resources)
            .filter(([_, val]) => val > 0)
            .map(([key, val]) => `
                <div style="display:flex;flex-direction:column;align-items:center;padding:12px;background:rgba(255,255,255,0.05);border-radius:12px;min-width:70px;flex:1;">
                    <span style="font-size:28px;">${RESOURCE_ICONS[key] || '📦'}</span>
                    <span style="font-weight:bold;font-size:18px;margin-top:8px;">${val}</span>
                    <span style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:4px;text-transform:capitalize">${key}</span>
                </div>
            `).join('');
        
        // Determinar ação principal
        let primaryAction = 'explore';
        let primaryActionText = 'Explorar';
        let primaryActionIcon = '⛏️';
        let primaryActionDisabled = false;
        
        if (region.controller === null) {
            primaryAction = 'dominate';
            primaryActionText = 'Dominar';
            primaryActionIcon = '👑';
            
            // Verificar se pode dominar
            if (currentPlayer) {
                const hasEnoughPV = currentPlayer.victoryPoints >= 2;
                const canPayBiome = Object.entries(region.resources)
                    .every(([key, value]) => (currentPlayer.resources[key] || 0) >= value);
                
                primaryActionDisabled = !hasEnoughPV || !canPayBiome;
            }
        } else if (!isOwnRegion) {
            primaryActionDisabled = true;
            primaryActionText = 'Controlada';
            primaryActionIcon = '🚫';
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
            ` : '<div style="margin-bottom:20px;text-align:center;color:rgba(255,255,255,0.5);font-style:italic;">Nenhum recurso disponível</div>'}
            
            <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:16px;">
                <h3 style="font-size:14px;font-weight:bold;color:rgba(255,255,255,0.9);margin-bottom:12px;text-align:center;">Ações Disponíveis</h3>
                
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <button onclick="window.uiManager.mobileManager.executeRegionAction('${primaryAction}', ${region.id})"
                            style="padding:14px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border:none;border-radius:12px;color:white;font-weight:bold;font-size:14px;display:flex;flex-direction:column;align-items:center;gap:4px;${primaryActionDisabled ? 'opacity:0.5;cursor:not-allowed;' : ''}"
                            ${primaryActionDisabled ? 'disabled' : ''}>
                        <span style="font-size:20px;">${primaryActionIcon}</span>
                        <span style="font-size:12px;">${primaryActionText}</span>
                    </button>
                    
                    <button onclick="window.uiManager.mobileManager.executeRegionAction('collect', ${region.id})"
                            style="padding:14px;background:linear-gradient(135deg,#10b981,#059669);border:none;border-radius:12px;color:white;font-weight:bold;font-size:14px;display:flex;flex-direction:column;align-items:center;gap:4px;${!canCollect ? 'opacity:0.5;cursor:not-allowed;' : ''}"
                            ${!canCollect ? 'disabled' : ''}>
                        <span style="font-size:20px;">🌾</span>
                        <span style="font-size:12px;">Coletar</span>
                    </button>
                </div>
                
                <button onclick="window.uiManager.mobileManager.executeRegionAction('build', ${region.id})"
                        style="width:100%;padding:14px;margin-top:10px;background:linear-gradient(135deg,#f59e0b,#d97706);border:none;border-radius:12px;color:white;font-weight:bold;font-size:14px;display:flex;justify-content:center;align-items:center;gap:8px;${!canBuild ? 'opacity:0.5;cursor:not-allowed;' : ''}"
                        ${!canBuild ? 'disabled' : ''}>
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
    
    executeRegionAction(action, regionId) {
        console.log(`📱 Executando ação: ${action} na região ${regionId}`);
        
        // Garantir que a região está selecionada
        this.currentRegionId = regionId;
        if (window.gameState) {
            window.gameState.selectedRegionId = regionId;
        }
        
        // Executar ação apropriada
        switch(action) {
            case 'explore':
            case 'dominate':
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
        if (!currentPlayer) {
            console.error('❌ Jogador atual não disponível para menu');
            return;
        }
        
        console.log(`📱 Mostrando menu mobile para: ${currentPlayer.name}`);
        this.activeSheet = 'menu';
        
        // Verificar fase atual
        const phaseElement = document.getElementById('phaseIndicator');
        const currentPhase = phaseElement?.textContent || '';
        const isNegotiationPhase = currentPhase.includes('Negociação');
        
        // Recursos do jogador
        const resourcesHTML = Object.entries(currentPlayer.resources || {})
            .map(([key, val]) => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:rgba(0,0,0,0.3);border-radius:8px;margin-bottom:6px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:18px;">${RESOURCE_ICONS[key] || '📦'}</span>
                        <span style="color:rgba(255,255,255,0.9);font-size:13px;text-transform:capitalize">${key}</span>
                    </div>
                    <span style="font-weight:bold;color:white;font-size:16px;">${val}</span>
                </div>
            `).join('');
        
        const content = `
            <div style="padding:8px 0;">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.1);">
                    <span style="font-size:40px;">${currentPlayer.icon || '👤'}</span>
                    <div>
                        <div style="font-size:20px;font-weight:bold;color:white;margin-bottom:4px;">${currentPlayer.name}</div>
                        <div style="color:${currentPlayer.color || '#9ca3af'};font-size:14px;margin-bottom:6px;">${currentPlayer.faction?.name || 'Sem facção'}</div>
                        <div style="background:rgba(245,158,11,0.2);color:#f59e0b;padding:4px 10px;border-radius:10px;font-weight:bold;font-size:16px;display:inline-block;">
                            ${currentPlayer.victoryPoints || 0} PV
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom:20px;">
                    <div style="font-size:16px;font-weight:bold;color:#fbbf24;margin-bottom:10px;">📦 Recursos</div>
                    <div style="max-height:180px;overflow-y:auto;">
                        ${resourcesHTML || '<div style="text-align:center;color:rgba(255,255,255,0.5);font-style:italic;">Nenhum recurso</div>'}
                    </div>
                </div>
                
                ${isNegotiationPhase ? `
                <button onclick="window.uiManager.mobileManager.openNegotiation()"
                        style="width:100%;padding:14px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);border:none;border-radius:12px;color:white;font-weight:bold;font-size:15px;display:flex;justify-content:center;align-items:center;gap:10px;margin-bottom:12px;">
                    <span style="font-size:20px;">🤝</span>
                    <span>Abrir Negociação</span>
                </button>
                ` : ''}
                
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <button onclick="window.uiManager.mobileManager.endTurn()"
                            style="padding:12px;background:linear-gradient(135deg,#10b981,#059669);border:none;border-radius:10px;color:white;font-weight:bold;font-size:14px;display:flex;flex-direction:column;align-items:center;gap:4px;">
                        <span style="font-size:20px;">🔄</span>
                        <span>Terminar Turno</span>
                    </button>
                    
                    <button onclick="window.uiManager.mobileManager.openManual()"
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
    
    openNegotiation() {
        if (window.uiManager?.negotiation?.openNegotiationModal) {
            window.uiManager.negotiation.openNegotiationModal();
            this.closeSheet();
        } else {
            console.error('❌ Negociação não disponível');
        }
    }
    
    endTurn() {
        if (window.gameLogic && window.gameLogic.handleEndTurn) {
            window.gameLogic.handleEndTurn();
            this.closeSheet();
        } else {
            console.error('❌ EndTurn não disponível');
        }
    }
    
    openManual() {
        if (window.uiManager?.modals?.openManual) {
            window.uiManager.modals.openManual();
            this.closeSheet();
        } else {
            console.error('❌ Manual não disponível');
        }
    }
    
    openSheet() {
        if (this.activeSheet) return;
        
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
        
        console.log('📱 Sheet aberto');
    }
    
    closeSheet() {
        if (!this.activeSheet) return;
        
        this.bottomSheet.style.transform = 'translateY(100%)';
        this.overlay.style.opacity = '0';
        
        setTimeout(() => {
            this.overlay.style.visibility = 'hidden';
            this.sheetContent.innerHTML = '';
            document.body.style.overflow = '';
            this.activeSheet = null;
            
            // Restaurar FAB se necessário
            if (this.gameStarted) {
                setTimeout(() => {
                    this.updateRegionFAB();
                }, 350);
            }
        }, 300);
        
        console.log('📱 Sheet fechado');
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
                        console.log('📱 Modo mobile ativado por redimensionamento');
                        this.injectMobileStyles();
                        this.hideOriginalFooter();
                        this.adaptCurrentScreen();
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
        
        // Prevenir conflito com cliques normais
        document.addEventListener('click', (e) => {
            if (this.activeSheet && !e.target.closest('#gaia-mobile-sheet')) {
                this.closeSheet();
            }
        }, true);
    }
    
    adaptCurrentScreen() {
        const setupScreen = document.getElementById('initialScreen');
        const gameScreen = document.getElementById('gameContainer');
        
        if (setupScreen && !setupScreen.classList.contains('hidden')) {
            this.showSetupInterface();
        } else if (gameScreen && !gameScreen.classList.contains('hidden')) {
            this.showGameInterface();
        } else {
            console.log('📱 Tela atual: indefinida');
        }
    }
}

// Expor globalmente para acesso
window.GaiaMobileManager = UIMobileManager;