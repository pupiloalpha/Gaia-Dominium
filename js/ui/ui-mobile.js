// ui-mobile.js - Adaptador Mobile Puro (Sem modificar HTML/CSS original)
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
        
        // Cache de elementos
        this.elements = {};
        
        console.log(`📱 Mobile Manager: ${this.isMobile ? 'Ativo' : 'Inativo'}`);
    }

    // ==================== DETECÇÃO INTELLIGENTE ====================
    
    detectMobile() {
        // Detecção robusta de mobile
        const isMobileWidth = window.innerWidth <= 768;
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        return isMobileWidth && (isTouchDevice || isMobileUserAgent);
    }

    // ==================== INICIALIZAÇÃO CONTROLADA ====================
    
    init() {
        if (!this.isMobile) {
            console.log('📱 Dispositivo não móvel, adaptações desativadas');
            return;
        }
        
        console.log('📱 Iniciando adaptações mobile puramente via JS...');
        
        // 1. Observar mudanças no DOM para adaptar dinamicamente
        this.setupDOMObserver();
        
        // 2. Adaptar a tela atual imediatamente
        this.adaptCurrentScreen();
        
        // 3. Criar elementos móveis (sem interferir no DOM existente)
        this.createMobileOverlay();
        
        // 4. Configurar eventos globais otimizados
        this.setupGlobalEvents();
        
        console.log('✅ Adaptador mobile inicializado');
    }

    // ==================== OBSERVADOR DE DOM (INTELLIGENTE) ====================
    
    setupDOMObserver() {
        // Observar mudanças no DOM para adaptar dinamicamente
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'attributes') {
                    setTimeout(() => this.adaptCurrentScreen(), 100);
                }
            });
        });
        
        // Observar apenas mudanças estruturais principais
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
        });
    }

    // ==================== ADAPTAÇÃO DA TELA DE CADASTRO (PURA JS) ====================
    
    adaptSetupScreen() {
        if (this.setupAdapted) return;
        
        const setupScreen = document.getElementById('initialScreen');
        if (!setupScreen) return;
        
        console.log('📱 Adaptando tela de cadastro para mobile...');
        
        // Aplicar estilos inline apenas para mobile (não modifica CSS original)
        this.applyMobileStyles(setupScreen, {
            'padding': '10px',
            'align-items': 'flex-start',
            'overflow-y': 'auto',
            '-webkit-overflow-scrolling': 'touch'
        });
        
        // Adaptar o modal de jogador
        const playerModal = setupScreen.querySelector('.player-modal');
        if (playerModal) {
            this.applyMobileStyles(playerModal, {
                'width': '100%',
                'max-width': '100%',
                'margin-top': '10px',
                'margin-bottom': '80px'
            });
            
            // Reestruturar o layout usando flexbox via JS
            this.restructureSetupLayout(playerModal);
        }
        
        // Garantir que inputs sejam tocáveis
        this.optimizeTouchTargets(setupScreen);
        
        this.setupAdapted = true;
        console.log('✅ Tela de cadastro adaptada');
    }
    
    restructureSetupLayout(modal) {
        // Primeira linha: converter para coluna
        const firstRow = modal.children[0];
        if (firstRow) {
            this.applyMobileStyles(firstRow, {
                'display': 'flex',
                'flex-direction': 'column',
                'gap': '12px'
            });
            
            // Ajustar inputs e botões
            const children = Array.from(firstRow.children);
            children.forEach((child, index) => {
                if (child.querySelector('input, select')) {
                    this.applyMobileStyles(child, {
                        'width': '100%'
                    });
                    
                    const input = child.querySelector('input, select');
                    if (input) {
                        this.applyMobileStyles(input, {
                            'font-size': '16px',
                            'min-height': '44px',
                            'padding': '12px'
                        });
                    }
                }
                
                // Container de botões: grid 2x2
                if (child.querySelector('#addPlayerBtn, #cancelEditBtn')) {
                    this.applyMobileStyles(child, {
                        'display': 'grid',
                        'grid-template-columns': '1fr 1fr',
                        'gap': '8px',
                        'width': '100%'
                    });
                }
                
                // Botão iniciar jogo
                const startBtn = child.querySelector('#startGameBtn');
                if (startBtn) {
                    this.applyMobileStyles(startBtn, {
                        'grid-column': 'span 2',
                        'width': '100%',
                        'padding': '14px',
                        'font-size': '15px'
                    });
                }
            });
        }
        
        // Segunda linha: ícones e IA
        const secondRow = modal.children[1];
        if (secondRow) {
            this.applyMobileStyles(secondRow, {
                'flex-direction': 'column',
                'gap': '15px',
                'padding-top': '15px',
                'margin-top': '15px',
                'border-top': '1px solid rgba(255,255,255,0.1)'
            });
            
            // Container de ícones: scroll horizontal
            const iconContainer = secondRow.querySelector('#iconSelection');
            if (iconContainer) {
                this.applyMobileStyles(iconContainer, {
                    'display': 'flex',
                    'flex-wrap': 'nowrap',
                    'overflow-x': 'auto',
                    'gap': '8px',
                    'padding-bottom': '10px',
                    '-webkit-overflow-scrolling': 'touch'
                });
                
                // Botões de ícone maiores
                iconContainer.querySelectorAll('.icon-button').forEach(btn => {
                    this.applyMobileStyles(btn, {
                        'min-width': '60px',
                        'min-height': '60px',
                        'font-size': '24px',
                        'flex-shrink': '0'
                    });
                });
            }
            
            // Botões de IA: grid 2x2
            const aiContainer = secondRow.querySelector('#aiButtonsContainer');
            if (aiContainer) {
                this.applyMobileStyles(aiContainer, {
                    'display': 'grid',
                    'grid-template-columns': 'repeat(2, 1fr)',
                    'gap': '8px',
                    'width': '100%'
                });
                
                aiContainer.querySelectorAll('.ai-button-compact').forEach(btn => {
                    this.applyMobileStyles(btn, {
                        'padding': '10px 8px',
                        'min-height': '44px',
                        'text-align': 'center'
                    });
                });
            }
        }
        
        // Lista de jogadores: uma coluna
        const playersList = modal.querySelector('#registeredPlayersList');
        if (playersList) {
            this.applyMobileStyles(playersList, {
                'grid-template-columns': '1fr',
                'gap': '10px',
                'max-height': '300px',
                'overflow-y': 'auto',
                '-webkit-overflow-scrolling': 'touch'
            });
        }
    }

    // ==================== ADAPTAÇÃO DA TELA DE JOGO ====================
    
    adaptGameScreen() {
        if (this.gameAdapted) return;
        
        console.log('📱 Adaptando tela de jogo para mobile...');
        
        // Esconder elementos desktop
        this.hideDesktopElements();
        
        // Otimizar interface do jogo
        this.optimizeGameUI();
        
        // Substituir tooltip por bottom sheet
        this.replaceTooltipWithSheet();
        
        this.gameAdapted = true;
        console.log('✅ Tela de jogo adaptada');
    }
    
    hideDesktopElements() {
        // Esconder elementos não essenciais no mobile
        const elementsToHide = ['#sidebar', '#regionTooltip'];
        elementsToHide.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) el.style.display = 'none';
        });
    }
    
    optimizeGameUI() {
        // Ajustar footer para mobile
        const footer = document.getElementById('gameFooter');
        if (footer) {
            this.applyMobileStyles(footer, {
                'bottom': '0',
                'left': '0',
                'transform': 'none',
                'width': '100%',
                'max-width': '100%',
                'border-radius': '12px 12px 0 0',
                'border-top': '1px solid rgba(255,255,255,0.1)'
            });
            
            // Ajustar botões de ação
            footer.querySelectorAll('.action-btn').forEach(btn => {
                this.applyMobileStyles(btn, {
                    'flex-direction': 'column',
                    'gap': '2px',
                    'font-size': '11px',
                    'padding': '8px 4px',
                    'min-height': '44px'
                });
            });
        }
        
        // Ajustar células do board
        document.querySelectorAll('.board-cell').forEach(cell => {
            this.applyMobileStyles(cell, {
                'min-height': '80px',
                'padding': '6px'
            });
        });
        
        // Adicionar botão de menu flutuante
        this.addFloatingMenuButton();
    }

    // ==================== OVERLAY E SHEETS (ELEGANTE) ====================
    
    createMobileOverlay() {
        // Criar overlay transparente
        this.overlay = document.createElement('div');
        this.overlay.id = 'gaia-mobile-overlay';
        this.applyMobileStyles(this.overlay, {
            'position': 'fixed',
            'inset': '0',
            'background': 'rgba(0,0,0,0.7)',
            'backdrop-filter': 'blur(4px)',
            'z-index': '9990',
            'opacity': '0',
            'visibility': 'hidden',
            'transition': 'opacity 0.3s ease'
        });
        document.body.appendChild(this.overlay);
        
        // Criar bottom sheet
        this.bottomSheet = document.createElement('div');
        this.bottomSheet.id = 'gaia-mobile-sheet';
        this.applyMobileStyles(this.bottomSheet, {
            'position': 'fixed',
            'bottom': '0',
            'left': '0',
            'right': '0',
            'background': 'rgb(17,24,39)',
            'border-top': '1px solid rgba(251,191,36,0.3)',
            'border-radius': '20px 20px 0 0',
            'z-index': '9991',
            'transform': 'translateY(100%)',
            'transition': 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            'max-height': '85vh',
            'overflow-y': 'auto',
            'box-shadow': '0 -10px 40px rgba(0,0,0,0.5)'
        });
        
        // Handle do sheet
        const sheetHandle = document.createElement('div');
        sheetHandle.innerHTML = '<div style="width:40px;height:4px;background:rgba(255,255,255,0.3);border-radius:2px;margin:16px auto;"></div>';
        this.bottomSheet.appendChild(sheetHandle);
        
        // Container de conteúdo
        this.sheetContent = document.createElement('div');
        this.sheetContent.id = 'gaia-sheet-content';
        this.sheetContent.style.padding = '0 20px 30px';
        this.bottomSheet.appendChild(this.sheetContent);
        
        document.body.appendChild(this.bottomSheet);
        
        // Eventos de fechamento
        this.overlay.addEventListener('click', () => this.closeSheet());
        sheetHandle.addEventListener('click', () => this.closeSheet());
    }
    
    openSheet(content, title = '') {
        if (this.activeSheet) return;
        
        this.activeSheet = true;
        this.sheetContent.innerHTML = content;
        
        // Mostrar
        this.overlay.style.visibility = 'visible';
        setTimeout(() => {
            this.overlay.style.opacity = '1';
            this.bottomSheet.style.transform = 'translateY(0)';
        }, 10);
        
        // Prevenir scroll do body
        document.body.style.overflow = 'hidden';
    }
    
    closeSheet() {
        this.bottomSheet.style.transform = 'translateY(100%)';
        this.overlay.style.opacity = '0';
        
        setTimeout(() => {
            this.overlay.style.visibility = 'hidden';
            this.sheetContent.innerHTML = '';
            document.body.style.overflow = '';
            this.activeSheet = false;
        }, 300);
    }

    // ==================== SUBSTITUIÇÃO DO TOOLTIP ====================
    
    replaceTooltipWithSheet() {
        // Interceptar eventos de hover e converter para toque
        document.addEventListener('click', (e) => {
            const cell = e.target.closest('.board-cell');
            if (!cell || this.activeSheet) return;
            
            e.stopPropagation();
            const regionId = cell.dataset.regionId;
            if (!regionId || !window.gameState?.regions) return;
            
            const region = window.gameState.regions[parseInt(regionId)];
            if (region) {
                this.showRegionSheet(region);
            }
        }, { capture: true });
    }
    
    showRegionSheet(region) {
        const owner = region.controller !== null 
            ? window.gameState.players[region.controller] 
            : null;
        
        const resources = Object.entries(region.resources)
            .filter(([_, val]) => val > 0)
            .map(([key, val]) => `
                <div style="display:flex;flex-direction:column;align-items:center;padding:8px;background:rgba(255,255,255,0.05);border-radius:8px;">
                    <span style="font-size:24px;">${RESOURCE_ICONS[key]}</span>
                    <span style="font-weight:bold;margin-top:4px;">${val}</span>
                    <span style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px;">${key}</span>
                </div>
            `).join('');
        
        const content = `
            <div style="margin-bottom:20px;">
                <h3 style="font-size:24px;font-weight:bold;color:white;margin-bottom:8px;">
                    ${region.name}
                    <span style="font-size:14px;color:rgba(255,255,255,0.7);background:rgba(0,0,0,0.3);padding:4px 8px;border-radius:6px;margin-left:8px;">
                        ${region.biome}
                    </span>
                </h3>
                <div style="display:flex;align-items:center;gap:8px;color:rgba(255,255,255,0.7);font-size:14px;">
                    <span>Controlado por:</span>
                    <span style="color:${owner?.color || '#9ca3af'};font-weight:bold;">
                        ${owner?.icon || '🏳️'} ${owner?.name || 'Neutro'}
                    </span>
                </div>
            </div>
            
            <div style="margin-bottom:24px;">
                <h4 style="font-size:16px;font-weight:bold;color:#fbbf24;margin-bottom:12px;">Recursos</h4>
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
                    ${resources || '<div style="grid-column:span 4;text-align:center;color:rgba(255,255,255,0.5);padding:16px;">Sem recursos</div>'}
                </div>
            </div>
            
            <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:20px;">
                <h4 style="font-size:14px;font-weight:bold;color:rgba(255,255,255,0.7);margin-bottom:16px;text-align:center;">Ações</h4>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <button onclick="window.gameLogic.handleExplore(); window.uiManager.mobileManager.closeSheet();"
                            style="padding:16px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border:none;border-radius:12px;color:white;font-weight:bold;font-size:16px;display:flex;flex-direction:column;align-items:center;gap:4px;">
                        ⛏️ <span style="font-size:12px;">Explorar</span>
                    </button>
                    <button onclick="window.gameLogic.handleCollect(); window.uiManager.mobileManager.closeSheet();"
                            style="padding:16px;background:linear-gradient(135deg,#10b981,#059669);border:none;border-radius:12px;color:white;font-weight:bold;font-size:16px;display:flex;flex-direction:column;align-items:center;gap:4px;">
                        🌾 <span style="font-size:12px;">Coletar</span>
                    </button>
                </div>
                <button onclick="window.uiManager.modals.openStructureModal(); window.uiManager.mobileManager.closeSheet();"
                        style="width:100%;padding:16px;margin-top:12px;background:linear-gradient(135deg,#f59e0b,#d97706);border:none;border-radius:12px;color:white;font-weight:bold;font-size:16px;display:flex;justify-content:center;gap:8px;">
                    🏗️ Construir
                </button>
            </div>
        `;
        
        this.openSheet(content, region.name);
    }

    // ==================== UTILITÁRIOS ELEGANTES ====================
    
    applyMobileStyles(element, styles) {
        if (!element) return;
        
        Object.entries(styles).forEach(([prop, value]) => {
            element.style[prop] = value;
        });
    }
    
    optimizeTouchTargets(container) {
        // Garantir que todos os elementos interativos sejam tocáveis
        container.querySelectorAll('button, input, select, .icon-button').forEach(el => {
            this.applyMobileStyles(el, {
                'min-height': '44px',
                'min-width': '44px'
            });
        });
    }
    
    addFloatingMenuButton() {
        if (document.getElementById('gaia-mobile-menu')) return;
        
        const menuBtn = document.createElement('button');
        menuBtn.id = 'gaia-mobile-menu';
        this.applyMobileStyles(menuBtn, {
            'position': 'fixed',
            'top': '20px',
            'right': '20px',
            'width': '52px',
            'height': '52px',
            'background': 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
            'border': '2px solid rgba(255,255,255,0.3)',
            'border-radius': '50%',
            'z-index': '9980',
            'display': 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'font-size': '24px',
            'color': 'white',
            'box-shadow': '0 4px 20px rgba(59,130,246,0.4)'
        });
        menuBtn.textContent = '☰';
        menuBtn.addEventListener('click', () => this.showMobileMenu());
        
        document.body.appendChild(menuBtn);
    }
    
    showMobileMenu() {
        const currentPlayer = getCurrentPlayer();
        if (!currentPlayer) return;
        
        const content = `
            <div style="padding:16px 0;">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
                    <span style="font-size:36px;">${currentPlayer.icon}</span>
                    <div>
                        <div style="font-size:20px;font-weight:bold;color:white;">${currentPlayer.name}</div>
                        <div style="color:${currentPlayer.color};font-size:14px;">${currentPlayer.faction?.name || 'Sem facção'}</div>
                        <div style="background:rgba(245,158,11,0.2);color:#f59e0b;padding:4px 8px;border-radius:6px;font-weight:bold;margin-top:4px;display:inline-block;">
                            ${currentPlayer.victoryPoints} PV
                        </div>
                    </div>
                </div>
                
                <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin-bottom:16px;">
                    <div style="font-size:16px;font-weight:bold;color:#fbbf24;margin-bottom:12px;">📦 Recursos</div>
                    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">
                        ${Object.entries(currentPlayer.resources || {}).map(([key, val]) => `
                            <div style="display:flex;justify-content:space-between;padding:8px;background:rgba(0,0,0,0.3);border-radius:6px;">
                                <span style="color:rgba(255,255,255,0.9);">${RESOURCE_ICONS[key]} ${key}</span>
                                <span style="font-weight:bold;color:white;">${val}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <button onclick="window.gameLogic.handleEndTurn(); window.uiManager.mobileManager.closeSheet();"
                            style="padding:14px;background:linear-gradient(135deg,#10b981,#059669);border:none;border-radius:10px;color:white;font-weight:bold;font-size:14px;">
                        🔄 Turno
                    </button>
                    <button onclick="window.uiManager.modals.openManual(); window.uiManager.mobileManager.closeSheet();"
                            style="padding:14px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border:none;border-radius:10px;color:white;font-weight:bold;font-size:14px;">
                        📖 Manual
                    </button>
                </div>
            </div>
        `;
        
        this.openSheet(content, 'Menu');
    }

    // ==================== CONTROLE DE TELAS ====================
    
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
    
    setupGlobalEvents() {
        // Readaptar ao redimensionar
        window.addEventListener('resize', () => {
            this.isMobile = this.detectMobile();
            if (this.isMobile) this.adaptCurrentScreen();
        });
        
        // Interceptar botão iniciar para garantir adaptação
        const startBtn = document.getElementById('startGameBtn');
        if (startBtn) {
            const originalClick = startBtn.onclick;
            startBtn.addEventListener('click', () => {
                setTimeout(() => {
                    this.gameAdapted = false;
                    this.adaptCurrentScreen();
                }, 1000);
            });
        }
    }
}

// Expor globalmente para acesso fácil
window.GaiaMobileManager = UIMobileManager;