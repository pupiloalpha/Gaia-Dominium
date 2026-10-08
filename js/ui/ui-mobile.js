// ui-mobile.js - Gerenciador de Experiência Mobile (Bottom Sheet & Menu Tátil)
import { gameState, getCurrentPlayer } from '../state/game-state.js';
import { RESOURCE_ICONS } from '../state/game-config.js';

export class UIMobileManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.isMobile = this.detectMobile();
        
        // Estado
        this.activeSheet = false;
        this.currentRegionId = null;
        this.gameStarted = false;
        this.menuButton = null;
        this.overlay = null;
        this.bottomSheet = null;
        this.sheetContent = null;
        
        console.log(`📱 Mobile Manager: ${this.isMobile ? 'Ativo' : 'Inativo'}`);
    }

    // ==================== DETECÇÃO ====================
    detectMobile() {
        const isMobileWidth = window.innerWidth <= 768;
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        return isMobileWidth || (isMobileWidth && isTouchDevice);
    }

    // ==================== INICIALIZAÇÃO ====================
    init() {
        if (!this.isMobile) return;
        
        console.log('📱 Inicializando componentes mobile (Bottom Sheet e Menu)...');
        
        // 1. Criar elementos mobile (overlay, bottom sheet, menu flutuante)
        this.createMobileElements();
        
        // 2. Configurar interações de toque (toque longo para detalhes de região)
        this.setupRegionTouch();
        
        // 3. Configurar listeners de redimensionamento e teclas
        this.setupEventListeners();
        
        console.log('✅ Mobile Manager inicializado sem loops concorrentes');
    }

    // ==================== CRIAÇÃO DOS ELEMENTOS MOBILE ====================
    createMobileElements() {
        this.createMobileOverlay();
        this.createFloatingMenu();
    }
    
    createMobileOverlay() {
        if (document.getElementById('gaia-mobile-overlay')) {
            this.overlay = document.getElementById('gaia-mobile-overlay');
            this.bottomSheet = document.getElementById('gaia-mobile-sheet');
            this.sheetContent = document.getElementById('gaia-sheet-content');
            return;
        }
        
        // Overlay de fundo
        this.overlay = document.createElement('div');
        this.overlay.id = 'gaia-mobile-overlay';
        this.overlay.addEventListener('click', () => this.closeSheet());
        document.body.appendChild(this.overlay);
        
        // Bottom Sheet Container
        this.bottomSheet = document.createElement('div');
        this.bottomSheet.id = 'gaia-mobile-sheet';
        
        // Alça superior da gaveta (Handle para puxar/fechar)
        const handle = document.createElement('div');
        handle.innerHTML = '<div style="width:42px;height:4px;background:rgba(255,255,255,0.3);border-radius:2px;margin:14px auto 10px auto;cursor:pointer;"></div>';
        handle.addEventListener('click', () => this.closeSheet());
        this.bottomSheet.appendChild(handle);
        
        // Container do conteúdo dinâmico
        this.sheetContent = document.createElement('div');
        this.sheetContent.id = 'gaia-sheet-content';
        this.sheetContent.style.padding = '0 16px 20px 16px';
        this.bottomSheet.appendChild(this.sheetContent);
        
        document.body.appendChild(this.bottomSheet);
    }
    
    createFloatingMenu() {
        if (document.getElementById('gaia-mobile-menu')) {
            this.menuButton = document.getElementById('gaia-mobile-menu');
            return;
        }
        
        this.menuButton = document.createElement('button');
        this.menuButton.id = 'gaia-mobile-menu';
        this.menuButton.setAttribute('aria-label', 'Menu do Jogador');
        this.menuButton.textContent = '☰';
        this.menuButton.title = 'Perfil e Recursos';
        this.menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showMobileMenu();
        });
        
        document.body.appendChild(this.menuButton);
    }

    // ==================== LIFECYCLE HOOKS ====================
    onGameStart() {
        this.gameStarted = true;
        this.closeSheet();
        if (this.menuButton) {
            this.menuButton.style.display = 'flex';
        }
    }

    updateForCurrentPhase(phaseText = '') {
        if (!this.menuButton) return;
        const isNegotiation = phaseText.toLowerCase().includes('negociação');
        if (isNegotiation) {
            this.menuButton.style.background = 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
        } else {
            this.menuButton.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
        }
    }

    updateUI() {
        // Se a sheet de perfil do jogador estiver aberta, atualiza os dados
        if (this.activeSheet && this.currentRegionId === null) {
            this.showMobileMenu(true);
        }
    }

    // ==================== INTERAÇÕES DE TOQUE (LONG PRESS) ====================
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
            }, 450);
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
        const regionId = parseInt(cell.dataset.regionId, 10);
        if (isNaN(regionId) || !gameState.regions?.[regionId]) return;
        
        const region = gameState.regions[regionId];
        this.currentRegionId = regionId;
        
        // Sincronizar região selecionada no gameState
        gameState.selectedRegionId = regionId;
        
        // Atualizar visual da célula selecionada
        document.querySelectorAll('.board-cell').forEach(c => c.classList.remove('region-selected'));
        cell.classList.add('region-selected');
        
        // Atualizar footer
        if (this.uiManager?.gameManager?.footerManager) {
            this.uiManager.gameManager.footerManager.updateFooter();
        }
        
        this.showRegionSheet(region);
        
        // Feedback háptico
        if (navigator.vibrate) {
            try { navigator.vibrate(40); } catch (_) {}
        }
    }

    // ==================== BOTTOM SHEET: REGIÃO ====================
    showRegionSheet(region) {
        if (!region) return;
        
        this.currentRegionId = region.id;
        const owner = region.controller !== null ? gameState.players[region.controller] : null;
        const currentPlayer = getCurrentPlayer();
        const isOwnRegion = owner && owner.id === currentPlayer?.id;
        
        const resourcesHTML = Object.entries(region.resources || {})
            .filter(([_, val]) => val > 0)
            .map(([key, val]) => `
                <div style="display:flex;flex-direction:column;align-items:center;padding:10px;background:rgba(255,255,255,0.06);border-radius:10px;min-width:65px;">
                    <span style="font-size:24px;">${RESOURCE_ICONS[key] || '📦'}</span>
                    <span style="font-weight:bold;font-size:16px;margin-top:4px;color:#fff;">${val}</span>
                    <span style="font-size:10px;color:rgba(255,255,255,0.7);margin-top:2px;text-transform:capitalize;">${key}</span>
                </div>
            `).join('');

        let controllerLabel = '<span style="color:#9ca3af;">🏳️ Região Neutra</span>';
        if (owner) {
            controllerLabel = `<span style="color:${owner.color};font-weight:bold;">${owner.icon} ${owner.name}</span>`;
        }

        const structuresHTML = region.structures && region.structures.length > 0 
            ? region.structures.map(s => `<span style="display:inline-block;padding:2px 8px;background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.3);border-radius:6px;font-size:11px;color:#fde047;margin:2px;">🏗️ ${s}</span>`).join('')
            : '<span style="color:rgba(255,255,255,0.4);font-size:12px;font-style:italic;">Nenhuma estrutura</span>';

        const actionType = region.controller === null ? 'dominate' : (isOwnRegion ? 'explore' : 'dispute');
        const actionLabel = region.controller === null ? 'Dominar' : (isOwnRegion ? 'Explorar' : 'Disputar');
        const actionIcon = region.controller === null ? '🏴' : (isOwnRegion ? '⛏️' : '⚔️');
        const actionColor = region.controller === null ? '#d97706' : (isOwnRegion ? '#2563eb' : '#dc2626');
        
        const content = `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:12px;">
                <div>
                    <h3 style="font-size:18px;font-weight:bold;color:#fbbf24;margin-bottom:2px;">${region.name}</h3>
                    <div style="font-size:12px;color:rgba(255,255,255,0.7);">Bioma: ${region.biome} • Exploração: ${region.explorationLevel} ⭐</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:12px;">${controllerLabel}</div>
                </div>
            </div>
            
            <div style="margin-bottom:14px;">
                <h4 style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.9);margin-bottom:8px;">Recursos Produzidos</h4>
                <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;">
                    ${resourcesHTML || '<div style="color:rgba(255,255,255,0.4);font-size:12px;font-style:italic;">Nenhum recurso</div>'}
                </div>
            </div>

            <div style="margin-bottom:16px;">
                <h4 style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.9);margin-bottom:6px;">Estruturas</h4>
                <div>${structuresHTML}</div>
            </div>
            
            <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:14px;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
                    <button onclick="window.uiManager.mobileManager.executeRegionAction('${actionType}', ${region.id})"
                            style="padding:10px;background:${actionColor};border:none;border-radius:10px;color:white;font-weight:bold;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px;min-height:44px;cursor:pointer;">
                        <span>${actionIcon}</span>
                        <span>${actionLabel}</span>
                    </button>
                    
                    <button onclick="window.uiManager.mobileManager.executeRegionAction('collect', ${region.id})"
                            style="padding:10px;background:#059669;border:none;border-radius:10px;color:white;font-weight:bold;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px;min-height:44px;cursor:pointer;${!isOwnRegion ? 'opacity:0.4;cursor:not-allowed;' : ''}"
                            ${!isOwnRegion ? 'disabled' : ''}>
                        <span>🌾</span>
                        <span>Coletar</span>
                    </button>
                </div>
                
                <button onclick="window.uiManager.mobileManager.executeRegionAction('build', ${region.id})"
                        style="width:100%;padding:10px;background:linear-gradient(135deg,#f59e0b,#d97706);border:none;border-radius:10px;color:white;font-weight:bold;font-size:13px;display:flex;justify-content:center;align-items:center;gap:6px;min-height:44px;cursor:pointer;${!isOwnRegion ? 'opacity:0.4;cursor:not-allowed;' : ''}"
                        ${!isOwnRegion ? 'disabled' : ''}>
                    <span>🏗️</span>
                    <span>Construir Estrutura</span>
                </button>
            </div>
        `;
        
        this.sheetContent.innerHTML = content;
        this.openSheet();
    }
    
    executeRegionAction(action, regionId) {
        this.currentRegionId = regionId;
        gameState.selectedRegionId = regionId;
        
        const region = gameState.regions[regionId];
        const player = getCurrentPlayer();
        
        if (!region || !player) {
            console.error('❌ Região ou jogador não encontrados');
            return;
        }
        
        this.closeSheet();
        
        switch(action) {
            case 'explore':
                window.gameLogic.handleExplore();
                break;
            case 'collect':
                window.gameLogic.handleCollect();
                break;
            case 'build':
                if (window.uiManager?.modals?.openStructureModal) {
                    window.uiManager.modals.openStructureModal();
                }
                break;
            case 'dominate':
                if (window.uiManager?.disputeUI) {
                    window.uiManager.disputeUI.openDominationModal(region);
                } else {
                    window.gameLogic.handleExplore();
                }
                break;
            case 'dispute':
                if (window.uiManager?.disputeUI) {
                    window.uiManager.disputeUI.openDisputeModal(regionId);
                }
                break;
        }
    }
    
    // ==================== BOTTOM SHEET: MENU / PERFIL DO JOGADOR ====================
    showMobileMenu(isUpdate = false) {
        if (this.activeSheet && !isUpdate) {
            this.closeSheet();
            return;
        }
        
        const currentPlayer = getCurrentPlayer();
        if (!currentPlayer) return;
        
        this.currentRegionId = null;
        const currentPhase = gameState.currentPhase || '';
        const isNegotiationPhase = currentPhase.toLowerCase().includes('negociacao') || currentPhase.toLowerCase().includes('negociação');
        
        const resourcesHTML = Object.entries(currentPlayer.resources || {})
            .map(([key, val]) => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(0,0,0,0.3);border-radius:8px;margin-bottom:6px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:18px;">${RESOURCE_ICONS[key] || '📦'}</span>
                        <span style="color:rgba(255,255,255,0.9);font-size:13px;text-transform:capitalize;">${key}</span>
                    </div>
                    <span style="font-weight:bold;color:white;font-size:16px;">${val}</span>
                </div>
            `).join('');
        
        const content = `
            <div style="padding:4px 0;">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.1);">
                    <span style="font-size:36px;">${currentPlayer.icon}</span>
                    <div>
                        <div style="font-size:18px;font-weight:bold;color:white;">${currentPlayer.name}</div>
                        <div style="color:${currentPlayer.color};font-size:12px;margin-bottom:4px;">${currentPlayer.faction?.name || 'Sem facção'}</div>
                        <div style="background:rgba(245,158,11,0.2);color:#f59e0b;padding:2px 8px;border-radius:8px;font-weight:bold;font-size:13px;display:inline-block;">
                            ${currentPlayer.victoryPoints} Pontos de Vitória (PV)
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom:16px;">
                    <div style="font-size:14px;font-weight:bold;color:#fbbf24;margin-bottom:8px;">📦 Recursos Atuais</div>
                    <div style="max-height:160px;overflow-y:auto;">
                        ${resourcesHTML}
                    </div>
                </div>
                
                ${isNegotiationPhase ? `
                <button onclick="window.uiManager.mobileManager.handleNegotiate()"
                        style="width:100%;padding:12px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);border:none;border-radius:10px;color:white;font-weight:bold;font-size:14px;display:flex;justify-content:center;align-items:center;gap:8px;margin-bottom:10px;min-height:44px;cursor:pointer;">
                    <span style="font-size:18px;">🤝</span>
                    <span>Criar Proposta de Negociação</span>
                </button>
                ` : ''}
                
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <button onclick="window.gameLogic.handleEndTurn(); window.uiManager.mobileManager.closeSheet();"
                            style="padding:10px;background:linear-gradient(135deg,#10b981,#059669);border:none;border-radius:10px;color:white;font-weight:bold;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px;min-height:44px;cursor:pointer;">
                        <span>🔄</span>
                        <span>Passar Turno</span>
                    </button>
                    
                    <button onclick="window.uiManager.modals.openManual(); window.uiManager.mobileManager.closeSheet();"
                            style="padding:10px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border:none;border-radius:10px;color:white;font-weight:bold;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px;min-height:44px;cursor:pointer;">
                        <span>📖</span>
                        <span>Manual</span>
                    </button>
                </div>
            </div>
        `;
        
        this.sheetContent.innerHTML = content;
        if (!isUpdate) {
            this.openSheet();
        }
    }

    handleNegotiate() {
        this.closeSheet();
        if (this.uiManager?.negotiation?.openNegotiationModal) {
            this.uiManager.negotiation.openNegotiationModal();
        }
    }
    
    // ==================== CONTROLE DE ABERTURA / FECHAMENTO DA GAVETA ====================
    openSheet() {
        if (!this.overlay || !this.bottomSheet) return;
        this.activeSheet = true;
        this.overlay.classList.add('active');
        this.bottomSheet.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    
    closeSheet() {
        if (!this.activeSheet || !this.overlay || !this.bottomSheet) return;
        
        this.bottomSheet.classList.remove('open');
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        this.activeSheet = false;
        this.currentRegionId = null;
    }

    // ==================== EVENT LISTENERS ====================
    setupEventListeners() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const newIsMobile = this.detectMobile();
                if (newIsMobile !== this.isMobile) {
                    this.isMobile = newIsMobile;
                    if (this.menuButton) {
                        this.menuButton.style.display = this.isMobile ? 'flex' : 'none';
                    }
                }
            }, 200);
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeSheet) {
                e.preventDefault();
                this.closeSheet();
            }
        });
    }
}

// Exportar instância e classe globalmente
window.GaiaMobileManager = UIMobileManager;
