// ui-mobile.js - Adaptador Mobile Elegante (Com seleção funcionando)
import { gameState, getCurrentPlayer } from '../state/game-state.js';
import { RESOURCE_ICONS } from '../state/game-config.js';

export class UIMobileManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.isMobile = this.detectMobile();
        
        // Estado
        this.activeSheet = null;
        this.setupAdapted = false;
        this.gameAdapted = false;
        this.touchStart = { x: 0, y: 0 };
        
        console.log(`📱 Mobile Manager: ${this.isMobile ? 'Ativo' : 'Inativo'}`);
    }

    // ==================== DETECÇÃO ====================
    
    detectMobile() {
        return window.innerWidth <= 768 && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }

    // ==================== INICIALIZAÇÃO ====================
    
    init() {
        if (!this.isMobile) return;
        
        console.log('📱 Iniciando adaptações mobile...');
        
        // 1. Aguardar carregamento completo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeAdaptations());
        } else {
            this.initializeAdaptations();
        }
        
        // 2. Configurar observador para mudanças dinâmicas
        this.setupMutationObserver();
    }
    
    initializeAdaptations() {
        try {
            // Adaptar baseado na tela atual
            this.adaptCurrentScreen();
            
            // Criar overlay mobile (somente para jogo)
            this.createMobileOverlay();
            
            // Configurar eventos globais otimizados
            this.setupGlobalEventListeners();
            
            console.log('✅ Adaptações mobile inicializadas');
        } catch (error) {
            console.error('❌ Erro na inicialização mobile:', error);
        }
    }

    // ==================== ADAPTAÇÃO DA TELA DE CADASTRO ====================
    
    adaptSetupScreen() {
        if (this.setupAdapted) return;
        
        const setupScreen = document.getElementById('initialScreen');
        if (!setupScreen || setupScreen.classList.contains('hidden')) return;
        
        console.log('📱 Adaptando tela de cadastro...');
        
        // Aplicar estilos responsivos via JS
        this.applyResponsiveStyles();
        
        // Otimizar elementos interativos para toque
        this.optimizeTouchElements();
        
        this.setupAdapted = true;
    }
    
    applyResponsiveStyles() {
        // Estilos específicos para mobile
        const styleId = 'gaia-mobile-responsive';
        if (document.getElementById(styleId)) return;
        
        const css = `
            @media (max-width: 768px) {
                /* Tela de cadastro */
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
                    margin-top: 10px !important;
                    margin-bottom: 80px !important;
                }
                
                /* Primeira linha - layout colunar */
                .player-modal > div:first-child {
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 12px !important;
                }
                
                /* Inputs maiores */
                #playerName, .faction-dropdown {
                    width: 100% !important;
                    font-size: 16px !important;
                    min-height: 44px !important;
                    padding: 12px !important;
                }
                
                /* Container de botões - grid */
                .player-modal > div:first-child > div:nth-child(3) {
                    display: grid !important;
                    grid-template-columns: 1fr 1fr !important;
                    gap: 8px !important;
                    width: 100% !important;
                }
                
                /* Botão iniciar - destaque */
                #startGameBtn {
                    grid-column: span 2 !important;
                    width: 100% !important;
                    padding: 16px !important;
                    font-size: 16px !important;
                    min-height: 55px !important;
                    margin-top: 8px !important;
                }
                
                /* Segunda linha - coluna */
                .player-modal > div:nth-child(2) {
                    flex-direction: column !important;
                    gap: 15px !important;
                    padding-top: 15px !important;
                    margin-top: 15px !important;
                    border-top: 1px solid rgba(255,255,255,0.1) !important;
                }
                
                /* Ícones - scroll horizontal */
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
                
                /* IA - grid 2x2 */
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
                
                /* Lista de jogadores - uma coluna */
                #registeredPlayersList {
                    grid-template-columns: 1fr !important;
                    gap: 10px !important;
                    max-height: 300px !important;
                    overflow-y: auto !important;
                    margin-top: 15px !important;
                    -webkit-overflow-scrolling: touch !important;
                }
                
                /* Tela de jogo */
                #gameContainer {
                    padding-bottom: 100px !important;
                }
                
                #sidebar, #regionTooltip {
                    display: none !important;
                }
                
                #gameFooter {
                    bottom: 0 !important;
                    left: 0 !important;
                    transform: none !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    border-radius: 12px 12px 0 0 !important;
                    border-top: 1px solid rgba(255,255,255,0.1) !important;
                    padding-bottom: env(safe-area-inset-bottom, 10px) !important;
                }
                
                .action-btn {
                    flex-direction: column !important;
                    gap: 2px !important;
                    font-size: 11px !important;
                    padding: 8px 4px !important;
                    min-height: 44px !important;
                }
                
                .board-cell {
                    min-height: 80px !important;
                    padding: 6px !important;
                }
                
                /* Overlay mobile */
                #gaia-mobile-overlay {
                    transition: opacity 0.3s ease !important;
                    backdrop-filter: blur(4px) !important;
                }
                
                /* Bottom sheet */
                #gaia-mobile-sheet {
                    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
                    box-shadow: 0 -10px 40px rgba(0,0,0,0.5) !important;
                }
                
                .sheet-open {
                    transform: translateY(0) !important;
                }
                
                .sheet-closed {
                    transform: translateY(100%) !important;
                }
            }
        `;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
    }
    
    optimizeTouchElements() {
        // Garantir que todos os elementos interativos sejam tocáveis
        document.querySelectorAll('button, input, select, .icon-button').forEach(el => {
            el.style.minHeight = '44px';
            el.style.minWidth = '44px';
            el.style.touchAction = 'manipulation';
        });
    }

    // ==================== ADAPTAÇÃO DA TELA DE JOGO ====================
    
    adaptGameScreen() {
        if (this.gameAdapted) return;
        
        const gameScreen = document.getElementById('gameContainer');
        if (!gameScreen || gameScreen.classList.contains('hidden')) return;
        
        console.log('📱 Adaptando tela de jogo...');
        
        // Substituir tooltip por bottom sheet (não interfere com seleção)
        this.setupMobileSheetInteraction();
        
        // Adicionar botão de menu flutuante
        this.addFloatingMenuButton();
        
        this.gameAdapted = true;
    }
    
    setupMobileSheetInteraction() {
        // Configurar interação de toque longo para abrir sheet
        // Isso NÃO interfere com o clique normal de seleção
        
        let touchTimer;
        let longPressDetected = false;
        
        document.addEventListener('touchstart', (e) => {
            const cell = e.target.closest('.board-cell');
            if (!cell) return;
            
            // Registrar ponto de toque
            this.touchStart = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
                time: Date.now()
            };
            
            // Timer para toque longo
            longPressDetected = false;
            touchTimer = setTimeout(() => {
                longPressDetected = true;
                this.handleLongPressOnCell(cell);
            }, 500); // 500ms para toque longo
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            // Se mover muito, cancelar toque longo
            if (!this.touchStart.x || longPressDetected) return;
            
            const dx = Math.abs(e.touches[0].clientX - this.touchStart.x);
            const dy = Math.abs(e.touches[0].clientY - this.touchStart.y);
            
            if (dx > 10 || dy > 10) {
                clearTimeout(touchTimer);
            }
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            clearTimeout(touchTimer);
            
            // Se foi toque longo, já tratamos
            if (longPressDetected) {
                longPressDetected = false;
                return;
            }
            
            // Verificar se foi um toque simples em uma célula
            const cell = e.target.closest('.board-cell');
            if (!cell || this.activeSheet) return;
            
            // Verificar movimento (para evitar confundir com scroll)
            const dx = Math.abs(e.changedTouches[0].clientX - this.touchStart.x);
            const dy = Math.abs(e.changedTouches[0].clientY - this.touchStart.y);
            
            if (dx < 10 && dy < 10 && Date.now() - this.touchStart.time < 300) {
                // Toque simples - NÃO interferir, deixar o clique normal acontecer
                // O sistema de seleção original irá processar
                console.log('📱 Toque simples detectado - seleção funcionando');
            }
        }, { passive: true });
    }
    
    handleLongPressOnCell(cell) {
        if (this.activeSheet || !cell.dataset.regionId) return;
        
        const regionId = parseInt(cell.dataset.regionId);
        if (!window.gameState?.regions?.[regionId]) return;
        
        const region = window.gameState.regions[regionId];
        this.showRegionSheet(region);
        
        // Adicionar feedback tátil (se disponível)
        if (window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }
    }

    // ==================== BOTTOM SHEET ELEGANTE ====================
    
    createMobileOverlay() {
        if (document.getElementById('gaia-mobile-overlay')) return;
        
        // Overlay
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
        
        // Handle
        const handle = document.createElement('div');
        handle.style.cssText = 'padding: 16px; display: flex; justify-content: center; cursor: pointer;';
        handle.innerHTML = '<div style="width:40px;height:4px;background:rgba(255,255,255,0.3);border-radius:2px;"></div>';
        handle.addEventListener('click', () => this.closeSheet());
        this.bottomSheet.appendChild(handle);
        
        // Conteúdo
        this.sheetContent = document.createElement('div');
        this.sheetContent.id = 'gaia-sheet-content';
        this.sheetContent.style.padding = '0 20px 30px';
        this.bottomSheet.appendChild(this.sheetContent);
        
        document.body.appendChild(this.bottomSheet);
        
        // Fechar ao clicar no overlay
        this.overlay.addEventListener('click', () => this.closeSheet());
    }
    
    showRegionSheet(region) {
        if (!region || this.activeSheet) return;
        
        this.activeSheet = true;
        
        const owner = region.controller !== null ? gameState.players[region.controller] : null;
        
        const resourcesHTML = Object.entries(region.resources)
            .filter(([_, val]) => val > 0)
            .map(([key, val]) => `
                <div style="display:flex;flex-direction:column;align-items:center;padding:12px;background:rgba(255,255,255,0.05);border-radius:12px;min-width:70px;">
                    <span style="font-size:28px;">${RESOURCE_ICONS[key]}</span>
                    <span style="font-weight:bold;font-size:18px;margin-top:8px;">${val}</span>
                    <span style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:4px;text-transform:uppercase;">${key}</span>
                </div>
            `).join('');
        
        const content = `
            <div style="margin-bottom:24px;">
                <h2 style="font-size:24px;font-weight:bold;color:white;margin-bottom:8px;display:flex;align-items:center;gap:8px;">
                    ${region.name}
                    <span style="font-size:14px;color:#fbbf24;background:rgba(251,191,36,0.1);padding:4px 12px;border-radius:20px;border:1px solid rgba(251,191,36,0.3);">
                        ${region.biome}
                    </span>
                </h2>
                
                <div style="display:flex;align-items:center;gap:8px;margin-top:12px;">
                    <span style="font-size:14px;color:rgba(255,255,255,0.7);">Controlado por:</span>
                    <span style="font-size:16px;font-weight:bold;color:${owner?.color || '#9ca3af'}">
                        ${owner?.icon || '🏳️'} ${owner?.name || 'Neutro'}
                    </span>
                </div>
                
                <div style="display:flex;align-items:center;gap:12px;margin-top:12px;">
                    <div style="display:flex;align-items:center;gap:4px;background:rgba(0,0,0,0.3);padding:6px 12px;border-radius:8px;">
                        <span style="color:#f59e0b;font-size:20px;">⭐</span>
                        <span style="font-weight:bold;color:white;font-size:18px;">${region.explorationLevel}</span>
                        <span style="font-size:12px;color:rgba(255,255,255,0.5);">Nível</span>
                    </div>
                    
                    ${region.structures.length > 0 ? `
                    <div style="display:flex;align-items:center;gap:4px;background:rgba(59,130,246,0.2);padding:6px 12px;border-radius:8px;">
                        <span style="color:#93c5fd;font-size:20px;">🏗️</span>
                        <span style="font-weight:bold;color:white;font-size:14px;">${region.structures[0]}</span>
                        ${region.structures.length > 1 ? `<span style="font-size:11px;color:rgba(255,255,255,0.5);">+${region.structures.length-1}</span>` : ''}
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div style="margin-bottom:28px;">
                <h3 style="font-size:18px;font-weight:bold;color:#fbbf24;margin-bottom:16px;">Recursos Disponíveis</h3>
                <div style="display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;-webkit-overflow-scrolling:touch;">
                    ${resourcesHTML || `
                    <div style="text-align:center;padding:24px;color:rgba(255,255,255,0.5);font-style:italic;width:100%;">
                        Nenhum recurso disponível
                    </div>
                    `}
                </div>
            </div>
            
            <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:20px;">
                <h3 style="font-size:16px;font-weight:bold;color:rgba(255,255,255,0.9);margin-bottom:16px;text-align:center;">Ações Disponíveis</h3>
                
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
                    <button onclick="window.gameLogic.handleExplore(); window.uiManager.mobileManager.closeSheet();"
                            style="padding:18px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border:none;border-radius:14px;color:white;font-weight:bold;font-size:16px;display:flex;flex-direction:column;align-items:center;gap:6px;touch-action:manipulation;">
                        <span style="font-size:24px;">⛏️</span>
                        <span style="font-size:14px;">Explorar</span>
                    </button>
                    
                    <button onclick="window.gameLogic.handleCollect(); window.uiManager.mobileManager.closeSheet();"
                            style="padding:18px;background:linear-gradient(135deg,#10b981,#059669);border:none;border-radius:14px;color:white;font-weight:bold;font-size:16px;display:flex;flex-direction:column;align-items:center;gap:6px;touch-action:manipulation;">
                        <span style="font-size:24px;">🌾</span>
                        <span style="font-size:14px;">Coletar</span>
                    </button>
                </div>
                
                <button onclick="window.uiManager.modals.openStructureModal(); window.uiManager.mobileManager.closeSheet();"
                        style="width:100%;padding:18px;background:linear-gradient(135deg,#f59e0b,#d97706);border:none;border-radius:14px;color:white;font-weight:bold;font-size:16px;display:flex;justify-content:center;align-items:center;gap:10px;touch-action:manipulation;">
                    <span style="font-size:24px;">🏗️</span>
                    <span>Construir Estrutura</span>
                </button>
            </div>
        `;
        
        this.sheetContent.innerHTML = content;
        
        // Animar abertura
        this.overlay.style.visibility = 'visible';
        setTimeout(() => {
            this.overlay.style.opacity = '1';
            this.bottomSheet.style.transform = 'translateY(0)';
        }, 10);
        
        // Prevenir scroll do body
        document.body.style.overflow = 'hidden';
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
        }, 300);
    }

    // ==================== MENU FLUTUANTE ====================
    
    addFloatingMenuButton() {
        if (document.getElementById('gaia-mobile-menu')) return;
        
        const menuBtn = document.createElement('button');
        menuBtn.id = 'gaia-mobile-menu';
        Object.assign(menuBtn.style, {
            position: 'fixed',
            top: '80px',
            right: '20px',
            width: '56px',
            height: '56px',
            background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '50%',
            zIndex: '9980',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            color: 'white',
            boxShadow: '0 6px 24px rgba(59,130,246,0.4)',
            cursor: 'pointer',
            touchAction: 'manipulation'
        });
        menuBtn.textContent = '☰';
        menuBtn.addEventListener('click', () => this.showMobileMenu());
        
        document.body.appendChild(menuBtn);
    }
    
    showMobileMenu() {
        if (this.activeSheet) return;
        
        const currentPlayer = getCurrentPlayer();
        if (!currentPlayer) return;
        
        const resourcesHTML = Object.entries(currentPlayer.resources || {})
            .map(([key, val]) => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:rgba(0,0,0,0.3);border-radius:10px;margin-bottom:8px;">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span style="font-size:20px;">${RESOURCE_ICONS[key]}</span>
                        <span style="color:rgba(255,255,255,0.9);font-size:14px;text-transform:capitalize;">${key}</span>
                    </div>
                    <span style="font-weight:bold;color:white;font-size:18px;">${val}</span>
                </div>
            `).join('');
        
        const content = `
            <div style="padding:8px 0;">
                <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.1);">
                    <span style="font-size:48px;">${currentPlayer.icon}</span>
                    <div>
                        <div style="font-size:22px;font-weight:bold;color:white;margin-bottom:4px;">${currentPlayer.name}</div>
                        <div style="color:${currentPlayer.color};font-size:15px;margin-bottom:8px;">${currentPlayer.faction?.name || 'Sem facção'}</div>
                        <div style="background:linear-gradient(135deg,rgba(245,158,11,0.2),rgba(217,119,6,0.2));color:#f59e0b;padding:6px 14px;border-radius:12px;font-weight:bold;font-size:18px;display:inline-block;border:1px solid rgba(245,158,11,0.3);">
                            ${currentPlayer.victoryPoints} PV
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom:24px;">
                    <div style="font-size:18px;font-weight:bold;color:#fbbf24;margin-bottom:12px;">📦 Recursos</div>
                    <div style="max-height:200px;overflow-y:auto;">
                        ${resourcesHTML}
                    </div>
                </div>
                
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
                    <button onclick="window.gameLogic.handleEndTurn(); window.uiManager.mobileManager.closeSheet();"
                            style="padding:16px;background:linear-gradient(135deg,#10b981,#059669);border:none;border-radius:12px;color:white;font-weight:bold;font-size:15px;display:flex;flex-direction:column;align-items:center;gap:6px;">
                        <span style="font-size:24px;">🔄</span>
                        <span>Terminar Turno</span>
                    </button>
                    
                    <button onclick="window.uiManager.modals.openManual(); window.uiManager.mobileManager.closeSheet();"
                            style="padding:16px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border:none;border-radius:12px;color:white;font-weight:bold;font-size:15px;display:flex;flex-direction:column;align-items:center;gap:6px;">
                        <span style="font-size:24px;">📖</span>
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
    }

    // ==================== UTILITÁRIOS ====================
    
    adaptCurrentScreen() {
        const setupScreen = document.getElementById('initialScreen');
        const gameScreen = document.getElementById('gameContainer');
        
        if (setupScreen && !setupScreen.classList.contains('hidden')) {
            this.adaptSetupScreen();
            this.gameAdapted = false;
        } else if (gameScreen && !gameScreen.classList.contains('hidden')) {
            this.adaptGameScreen();
            this.setupAdapted = false;
        }
    }
    
    setupMutationObserver() {
        // Observar mudanças no DOM para reaplicar adaptações
        const observer = new MutationObserver(() => {
            this.adaptCurrentScreen();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });
    }
    
    setupGlobalEventListeners() {
        // Readaptar ao redimensionar
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.isMobile = this.detectMobile();
                if (this.isMobile) this.adaptCurrentScreen();
            }, 250);
        });
        
        // Interceptar botão iniciar para garantir adaptação
        const startBtn = document.getElementById('startGameBtn');
        if (startBtn) {
            const originalHandler = startBtn.onclick;
            startBtn.addEventListener('click', (e) => {
                if (originalHandler) originalHandler.call(startBtn, e);
                setTimeout(() => {
                    this.gameAdapted = false;
                    this.adaptCurrentScreen();
                }, 1000);
            });
        }
    }
}