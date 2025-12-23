// ui-mobile.js - Adaptador Mobile Completo (Comunicação com sistema original)
import { gameState, getCurrentPlayer } from '../state/game-state.js';
import { RESOURCE_ICONS } from '../state/game-config.js';

export class UIMobileManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.isMobile = this.detectMobile();
        
        // Estado
        this.activeSheet = null;
        this.currentRegionId = null;
        this.originalFooterVisible = true;
        
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
        
        // 1. Aguardar carregamento
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }
    
    initialize() {
        try {
            // 1. Injetar estilos mobile (mínimo necessário)
            this.injectMobileStyles();
            
            // 2. Observar mudanças no DOM para adaptação dinâmica
            this.setupDOMObserver();
            
            // 3. Criar elementos mobile
            this.createMobileElements();
            
            // 4. Configurar integração com sistema original
            this.setupIntegration();
            
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
                /* 1. Tela de cadastro responsiva */
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
                
                /* 2. Tela de jogo */
                #gameContainer {
                    padding-bottom: 100px !important;
                }
                
                /* 3. Footer original - OTIMIZADO */
                #gameFooter {
                    bottom: 0 !important;
                    left: 0 !important;
                    transform: none !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    border-radius: 12px 12px 0 0 !important;
                    border-top: 1px solid rgba(255,255,255,0.1) !important;
                    padding: 10px 15px !important;
                    z-index: 8000 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 8px !important;
                }
                
                #gameFooter .flex {
                    flex-direction: row !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    gap: 8px !important;
                    width: 100% !important;
                }
                
                #gameFooter .flex > div:first-child {
                    display: grid !important;
                    grid-template-columns: repeat(4, 1fr) !important;
                    gap: 6px !important;
                    width: 70% !important;
                }
                
                .action-btn {
                    padding: 8px 4px !important;
                    font-size: 11px !important;
                    min-height: 40px !important;
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                    justify-content: center !important;
                    gap: 2px !important;
                    text-align: center !important;
                }
                
                #endTurnBtn {
                    width: 30% !important;
                    padding: 10px 8px !important;
                    font-size: 12px !important;
                    min-height: 40px !important;
                    white-space: nowrap !important;
                }
                
                #actionsLeft {
                    display: none !important;
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
                
                /* 5. Menu flutuante */
                #gaia-mobile-menu {
                    z-index: 9980 !important;
                }
                
                /* 6. Ajustes gerais */
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
                
                #endTurnBtn {
                    font-size: 11px !important;
                    padding: 8px 6px !important;
                }
            }
            
            /* Para telas muito pequenas, esconder texto dos botões */
            @media (max-width: 320px) {
                .action-btn span:not(.icon) {
                    display: none !important;
                }
                
                .action-btn {
                    font-size: 14px !important;
                }
                
                #endTurnBtn span {
                    display: block !important;
                }
            }
        `;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ==================== INTEGRAÇÃO COM SISTEMA ORIGINAL ====================
    
    setupIntegration() {
        // 1. Integrar com sistema de seleção de regiões
        this.integrateRegionSelection();
        
        // 2. Integrar com sistema de fases
        this.integratePhaseSystem();
        
        // 3. Integrar com sistema de modais
        this.integrateModalSystem();
        
        // 4. Monitorar footer original
        this.monitorOriginalFooter();
    }
    
    integrateRegionSelection() {
        // Usar MutationObserver para detectar quando uma região é selecionada
        this.regionObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const cell = mutation.target;
                    if (cell.classList.contains('board-cell')) {
                        const regionId = parseInt(cell.dataset.regionId);
                        if (cell.classList.contains('region-selected')) {
                            this.currentRegionId = regionId;
                            console.log(`📱 Região ${regionId} selecionada`);
                        }
                    }
                }
            });
        });
        
        // Observar todas as células do board
        document.querySelectorAll('.board-cell').forEach(cell => {
            this.regionObserver.observe(cell, { attributes: true });
        });
        
        // Também observar adição de novas células (quando o board é recriado)
        const boardObserver = new MutationObserver(() => {
            document.querySelectorAll('.board-cell').forEach(cell => {
                this.regionObserver.observe(cell, { attributes: true });
            });
        });
        
        boardObserver.observe(document.getElementById('boardContainer') || document.body, {
            childList: true,
            subtree: true
        });
    }
    
    integratePhaseSystem() {
        // Monitorar mudanças de fase do jogo
        this.phaseObserver = new MutationObserver(() => {
            const phaseIndicator = document.getElementById('phaseIndicator');
            if (phaseIndicator) {
                const currentPhase = phaseIndicator.textContent;
                this.updateMobileInterfaceForPhase(currentPhase);
            }
        });
        
        this.phaseObserver.observe(document.getElementById('phaseIndicator') || document.body, {
            characterData: true,
            subtree: true,
            childList: true
        });
    }
    
    updateMobileInterfaceForPhase(phase) {
        // Atualizar menu mobile baseado na fase
        const menuBtn = document.getElementById('gaia-mobile-menu');
        if (menuBtn && phase) {
            const isNegotiationPhase = phase.includes('Negociação');
            if (isNegotiationPhase) {
                menuBtn.style.background = 'linear-gradient(135deg,#8b5cf6,#7c3aed)';
                menuBtn.title = 'Fase de Negociação ativa';
            } else {
                menuBtn.style.background = 'linear-gradient(135deg,#3b82f6,#1d4ed8)';
                menuBtn.title = 'Menu Mobile';
            }
        }
    }
    
    integrateModalSystem() {
        // Sobrescrever abertura de modais para garantir compatibilidade mobile
        const originalOpenStructureModal = window.uiManager?.modals?.openStructureModal;
        if (originalOpenStructureModal) {
            window.uiManager.modals.openStructureModal = () => {
                // Garantir que há uma região selecionada
                if (this.currentRegionId === null) {
                    window.uiManager.modals.showFeedback('Selecione uma região primeiro!', 'warning');
                    return;
                }
                
                // Chamar modal original
                originalOpenStructureModal.call(window.uiManager.modals);
            };
        }
        
        // Monitorar abertura/fechamento de modais para ajustar interface
        const modalObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const modal = mutation.target;
                    const isModal = modal.id && modal.id.includes('Modal');
                    if (isModal) {
                        const isVisible = !modal.classList.contains('hidden');
                        this.toggleFooterVisibility(!isVisible);
                    }
                }
            });
        });
        
        // Observar todos os modais conhecidos
        ['structureModal', 'negotiationModal', 'eventModal', 'incomeModal'].forEach(id => {
            const modal = document.getElementById(id);
            if (modal) {
                modalObserver.observe(modal, { attributes: true });
            }
        });
    }
    
    toggleFooterVisibility(visible) {
        const footer = document.getElementById('gameFooter');
        if (footer) {
            footer.style.display = visible ? 'block' : 'none';
            this.originalFooterVisible = visible;
        }
    }
    
    monitorOriginalFooter() {
        // Garantir que o footer original esteja visível quando necessário
        const footer = document.getElementById('gameFooter');
        if (footer) {
            // Verificar periodicamente se o footer está visível
            setInterval(() => {
                if (this.originalFooterVisible && footer.style.display === 'none') {
                    footer.style.display = 'block';
                }
            }, 1000);
        }
    }

    // ==================== INTERAÇÃO MOBILE ====================
    
    createMobileElements() {
        // 1. Overlay
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
        
        // 2. Bottom Sheet
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
        
        // Handle do sheet
        const handle = document.createElement('div');
        handle.innerHTML = `
            <div style="width:40px;height:4px;background:rgba(255,255,255,0.3);border-radius:2px;margin:16px auto;"></div>
        `;
        this.bottomSheet.appendChild(handle);
        
        // Conteúdo
        this.sheetContent = document.createElement('div');
        this.sheetContent.id = 'gaia-sheet-content';
        this.sheetContent.style.padding = '0 20px 30px';
        this.bottomSheet.appendChild(this.sheetContent);
        
        document.body.appendChild(this.bottomSheet);
        
        // 3. Menu flutuante
        this.createFloatingMenu();
        
        // 4. Configurar interações de toque
        this.setupTouchInteractions();
    }
    
    createFloatingMenu() {
        const menuBtn = document.createElement('button');
        menuBtn.id = 'gaia-mobile-menu';
        Object.assign(menuBtn.style, {
            position: 'fixed',
            top: '70px',
            right: '15px',
            width: '50px',
            height: '50px',
            background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '50%',
            zIndex: '9980',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: 'white',
            boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
            cursor: 'pointer'
        });
        menuBtn.textContent = '☰';
        menuBtn.title = 'Menu Mobile';
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showMobileMenu();
        });
        
        document.body.appendChild(menuBtn);
    }
    
    setupTouchInteractions() {
        let touchStartTime = 0;
        let touchStartElement = null;
        
        // Tocar para selecionar, segurar para menu
        document.addEventListener('touchstart', (e) => {
            const cell = e.target.closest('.board-cell');
            if (!cell) return;
            
            touchStartTime = Date.now();
            touchStartElement = cell;
            
            // Temporizador para toque longo
            this.longPressTimer = setTimeout(() => {
                if (touchStartElement === cell) {
                    this.handleLongPressOnCell(cell);
                }
            }, 500);
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            clearTimeout(this.longPressTimer);
            
            const cell = e.target.closest('.board-cell');
            if (!cell || cell !== touchStartElement) return;
            
            const touchDuration = Date.now() - touchStartTime;
            
            if (touchDuration < 200) {
                // Toque rápido - seleção normal (deixa o sistema original lidar)
                console.log('📱 Toque rápido - selecionando região');
                // Não fazemos nada, o clique normal será processado
            }
            
            touchStartElement = null;
        }, { passive: true });
        
        document.addEventListener('touchmove', () => {
            clearTimeout(this.longPressTimer);
            touchStartElement = null;
        }, { passive: true });
    }
    
    handleLongPressOnCell(cell) {
        const regionId = parseInt(cell.dataset.regionId);
        if (!window.gameState?.regions?.[regionId]) return;
        
        const region = window.gameState.regions[regionId];
        this.showRegionSheet(region);
        
        // Feedback tátil
        if (navigator.vibrate) navigator.vibrate(50);
    }

    // ==================== SHEETS ====================
    
    showRegionSheet(region) {
        if (!region || this.activeSheet) return;
        
        this.activeSheet = true;
        
        const owner = region.controller !== null ? gameState.players[region.controller] : null;
        const currentPlayer = getCurrentPlayer();
        const isOwnRegion = owner && owner.id === currentPlayer?.id;
        
        // Verificar ações disponíveis
        const canExplore = isOwnRegion || region.controller === null;
        const canCollect = isOwnRegion && region.explorationLevel > 0;
        const canBuild = isOwnRegion;
        
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
                    <button onclick="this.setRegionForAction(${region.id}); window.gameLogic.handleExplore(); window.uiManager.mobileManager.closeSheet();"
                            style="padding:18px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border:none;border-radius:14px;color:white;font-weight:bold;font-size:16px;display:flex;flex-direction:column;align-items:center;gap:6px;${!canExplore ? 'opacity:0.5;cursor:not-allowed;' : ''}"
                            ${!canExplore ? 'disabled' : ''}>
                        <span style="font-size:24px;">⛏️</span>
                        <span style="font-size:14px;">${region.controller === null ? 'Dominar' : 'Explorar'}</span>
                    </button>
                    
                    <button onclick="this.setRegionForAction(${region.id}); window.gameLogic.handleCollect(); window.uiManager.mobileManager.closeSheet();"
                            style="padding:18px;background:linear-gradient(135deg,#10b981,#059669);border:none;border-radius:14px;color:white;font-weight:bold;font-size:16px;display:flex;flex-direction:column;align-items:center;gap:6px;${!canCollect ? 'opacity:0.5;cursor:not-allowed;' : ''}"
                            ${!canCollect ? 'disabled' : ''}>
                        <span style="font-size:24px;">🌾</span>
                        <span style="font-size:14px;">Coletar</span>
                    </button>
                </div>
                
                <button onclick="this.setRegionForAction(${region.id}); window.uiManager.modals.openStructureModal(); window.uiManager.mobileManager.closeSheet();"
                        style="width:100%;padding:18px;background:linear-gradient(135deg,#f59e0b,#d97706);border:none;border-radius:14px;color:white;font-weight:bold;font-size:16px;display:flex;justify-content:center;align-items:center;gap:10px;${!canBuild ? 'opacity:0.5;cursor:not-allowed;' : ''}"
                        ${!canBuild ? 'disabled' : ''}>
                    <span style="font-size:24px;">🏗️</span>
                    <span>Construir Estrutura</span>
                </button>
            </div>
        `;
        
        this.sheetContent.innerHTML = content;
        this.openSheet();
        
        // Adicionar método auxiliar ao botão
        this.sheetContent.querySelectorAll('button').forEach(btn => {
            btn.setRegionForAction = (regionId) => {
                if (window.gameState) {
                    window.gameState.selectedRegionId = regionId;
                    this.currentRegionId = regionId;
                }
            };
        });
    }
    
    showMobileMenu() {
        if (this.activeSheet) return;
        
        const currentPlayer = getCurrentPlayer();
        if (!currentPlayer) return;
        
        // Verificar fase atual
        const phaseIndicator = document.getElementById('phaseIndicator');
        const currentPhase = phaseIndicator?.textContent || '';
        const isNegotiationPhase = currentPhase.includes('Negociação');
        
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
                
                ${isNegotiationPhase ? `
                <button onclick="window.uiManager.negotiation.openNegotiationModal(); window.uiManager.mobileManager.closeSheet();"
                        style="width:100%;padding:18px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);border:none;border-radius:14px;color:white;font-weight:bold;font-size:16px;display:flex;justify-content:center;align-items:center;gap:10px;margin-bottom:16px;">
                    <span style="font-size:24px;">🤝</span>
                    <span>Abrir Negociação</span>
                </button>
                ` : ''}
                
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
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
        
        // Ocultar footer original temporariamente
        this.toggleFooterVisibility(false);
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
            
            // Restaurar footer original
            this.toggleFooterVisibility(true);
        }, 300);
    }

    // ==================== UTILITÁRIOS ====================
    
    setupDOMObserver() {
        // Observar mudanças no DOM para reaplicar adaptações
        const observer = new MutationObserver(() => {
            this.adaptCurrentScreen();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
        });
    }
    
    adaptCurrentScreen() {
        const setupScreen = document.getElementById('initialScreen');
        const gameScreen = document.getElementById('gameContainer');
        
        if (setupScreen && !setupScreen.classList.contains('hidden')) {
            // Tela de cadastro ativa
            this.optimizeTouchElements();
        } else if (gameScreen && !gameScreen.classList.contains('hidden')) {
            // Tela de jogo ativa
            this.ensureFooterVisible();
        }
    }
    
    optimizeTouchElements() {
        // Garantir que elementos interativos sejam tocáveis
        document.querySelectorAll('button, input, select, .icon-button').forEach(el => {
            if (el.offsetHeight < 44) el.style.minHeight = '44px';
            if (el.offsetWidth < 44) el.style.minWidth = '44px';
        });
    }
    
    ensureFooterVisible() {
        const footer = document.getElementById('gameFooter');
        if (footer && footer.style.display === 'none' && this.originalFooterVisible) {
            footer.style.display = 'block';
        }
    }
}

// Expor globalmente
window.GaiaMobileManager = UIMobileManager;