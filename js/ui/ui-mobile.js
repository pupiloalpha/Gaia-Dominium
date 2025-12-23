// ui-mobile.js - Gerenciador de Experiência Mobile (Setup & Jogo) - VERSÃO CORRIGIDA
import { gameState, getCurrentPlayer } from '../state/game-state.js';
import { RESOURCE_ICONS } from '../state/game-config.js';

export class UIMobileManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.isMobile = window.innerWidth <= 768;
        
        // Estado local
        this.activeBottomSheet = false;
        this.initialized = false;
        this.initializationAttempts = 0;
        
        console.log("📱 Mobile Manager criado. isMobile:", this.isMobile);
    }

    init() {
        if (!this.isMobile) {
            console.log("📱 Não é mobile, saindo.");
            return;
        }

        console.log("📱 Iniciando adaptações mobile...");
        
        // Estratégia: esperar que o DOM esteja COMPLETAMENTE carregado
        if (document.readyState === 'complete') {
            this.safeInitialize();
        } else {
            document.addEventListener('DOMContentLoaded', () => this.safeInitialize());
            // Fallback para garantir
            setTimeout(() => this.safeInitialize(), 1000);
        }
    }

    safeInitialize() {
        if (this.initialized || this.initializationAttempts > 3) {
            console.log("📱 Já inicializado ou muitas tentativas, saindo.");
            return;
        }
        
        this.initializationAttempts++;
        console.log(`📱 Tentativa de inicialização ${this.initializationAttempts}`);
        
        try {
            // 1. Primeiro, injetar estilos críticos
            this.injectMobileStyles();
            
            // 2. Aguardar mais um pouco para garantir que outros módulos carregaram
            setTimeout(() => {
                try {
                    // 3. Criar elementos mobile (somente estrutura básica)
                    this.createBasicMobileElements();
                    
                    // 4. Configurar listener para o botão iniciar (SE EXISTIR)
                    this.setupStartButtonListener();
                    
                    // 5. Marcar como inicializado
                    this.initialized = true;
                    console.log("✅ Mobile Manager inicializado com sucesso!");
                    
                } catch (innerError) {
                    console.error("📱 Erro na fase 2 da inicialização:", innerError);
                }
            }, 500);
            
        } catch (error) {
            console.error("📱 Erro na inicialização mobile:", error);
            
            // Tentar novamente se menos de 3 tentativas
            if (this.initializationAttempts < 3) {
                setTimeout(() => this.safeInitialize(), 1000);
            }
        }
    }

    injectMobileStyles() {
        const styleId = 'gaia-mobile-styles';
        if (document.getElementById(styleId)) return;

        console.log("📱 Injetando estilos mobile...");
        
        const css = `
            /* --- GERAL MOBILE --- */
            @media (max-width: 768px) {
                body {
                    overscroll-behavior-y: none;
                    -webkit-tap-highlight-color: transparent;
                }
                
                /* Esconder sidebar e tooltip */
                #sidebar, #regionTooltip { 
                    display: none !important; 
                }
                
                /* Ajustar footer */
                #gameFooter {
                    bottom: 0 !important;
                    left: 0 !important;
                    transform: none !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    border-radius: 12px 12px 0 0 !important;
                    border: none !important;
                    border-top: 1px solid rgba(255,255,255,0.1) !important;
                }
                
                /* Ajustar botões de ação */
                .action-btn {
                    flex-direction: column;
                    gap: 2px;
                    font-size: 0.7rem !important;
                    padding: 8px 4px !important;
                    min-height: 44px;
                }
                
                /* Ajustar células do board */
                .board-cell {
                    min-height: 80px;
                    padding: 6px !important;
                }
                
                .board-cell .text-xs {
                    font-size: 10px !important;
                }
                
                /* Overlay mobile */
                #mobile-overlay {
                    transition: opacity 0.3s ease;
                    backdrop-filter: blur(4px);
                    -webkit-backdrop-filter: blur(4px);
                }
                
                /* Bottom sheet */
                #mobile-bottom-sheet {
                    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    box-shadow: 0 -5px 25px rgba(0,0,0,0.8);
                }
                
                .sheet-open { transform: translateY(0) !important; }
                .sheet-closed { transform: translateY(100%) !important; }
            }
        `;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
        console.log("✅ Estilos mobile injetados.");
    }

    createBasicMobileElements() {
        console.log("📱 Criando elementos básicos mobile...");
        
        // Só criar se não existirem
        if (document.getElementById('mobile-overlay')) {
            console.log("📱 Elementos já existem.");
            this.mobileOverlay = document.getElementById('mobile-overlay');
            this.bottomSheet = document.getElementById('mobile-bottom-sheet');
            this.sheetContent = document.getElementById('mobile-sheet-content');
            return;
        }
        
        try {
            // 1. Overlay
            this.mobileOverlay = document.createElement('div');
            this.mobileOverlay.id = 'mobile-overlay';
            this.mobileOverlay.className = 'fixed inset-0 bg-black/70 z-[90] hidden opacity-0';
            document.body.appendChild(this.mobileOverlay);
            
            // 2. Bottom Sheet
            this.bottomSheet = document.createElement('div');
            this.bottomSheet.id = 'mobile-bottom-sheet';
            this.bottomSheet.className = 'fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-yellow-500/30 rounded-t-2xl z-[100] transform translate-y-full max-h-[85vh] overflow-y-auto sheet-closed';
            this.bottomSheet.innerHTML = `
                <div class="sticky top-0 bg-gray-900 z-10 pt-3 pb-2 w-full flex justify-center border-b border-white/5" onclick="document.getElementById('mobile-bottom-sheet').classList.add('sheet-closed'); document.getElementById('mobile-overlay').classList.add('hidden');">
                    <div class="w-12 h-1.5 bg-gray-700 rounded-full"></div>
                </div>
                <div id="mobile-sheet-content" class="p-4"></div>
            `;
            document.body.appendChild(this.bottomSheet);
            
            this.sheetContent = document.getElementById('mobile-sheet-content');
            
            console.log("✅ Elementos básicos criados.");
            
        } catch (error) {
            console.error("❌ Erro ao criar elementos mobile:", error);
        }
    }

    setupStartButtonListener() {
        const startBtn = document.getElementById('startGameBtn');
        
        if (!startBtn) {
            console.warn("📱 Botão iniciar não encontrado. Tentando novamente em 1s...");
            setTimeout(() => this.setupStartButtonListener(), 1000);
            return;
        }
        
        console.log("📱 Botão iniciar encontrado, configurando listener...");
        
        // Remover listeners anteriores para evitar duplicação
        const newStartBtn = startBtn.cloneNode(true);
        startBtn.parentNode.replaceChild(newStartBtn, startBtn);
        
        // Adicionar novo listener
        newStartBtn.addEventListener('click', () => {
            console.log("📱 Botão iniciar clicado!");
            // Delay maior para garantir que o jogo tenha iniciado
            setTimeout(() => {
                this.activateGameMode();
            }, 1000);
        });
    }

    activateGameMode() {
        console.log("📱 Ativando modo jogo mobile...");
        
        try {
            // 1. Configurar otimização de toque
            this.setupTouchOptimization();
            
            // 2. Adicionar botão de menu flutuante
            this.addMobileMenuButton();
            
            // 3. Configurar listeners para células do board (quando disponíveis)
            this.setupBoardCellListeners();
            
            console.log("✅ Modo jogo ativado.");
            
        } catch (error) {
            console.error("❌ Erro ao ativar modo jogo:", error);
        }
    }

    setupTouchOptimization() {
        console.log("📱 Configurando otimização de toque...");
        
        // Não bloquear touch action - isso causa problemas
        const map = document.getElementById('gameMap');
        if (map) {
            map.style.touchAction = 'auto';
        }
        
        // Prevenir zoom duplo em botões
        document.querySelectorAll('button').forEach(btn => {
            btn.style.touchAction = 'manipulation';
        });
    }

    addMobileMenuButton() {
        if (document.getElementById('mobile-menu-fab')) return;
        
        console.log("📱 Adicionando botão de menu mobile...");
        
        const menuFab = document.createElement('button');
        menuFab.id = 'mobile-menu-fab';
        menuFab.className = 'fixed top-20 right-4 z-40 w-12 h-12 bg-gray-800/90 backdrop-blur border border-yellow-500/30 rounded-full shadow-lg flex items-center justify-center text-xl text-yellow-400 active:scale-95 transition-transform';
        menuFab.innerHTML = '☰';
        menuFab.onclick = () => this.openMenuSheet();
        
        document.body.appendChild(menuFab);
    }

    setupBoardCellListeners() {
        console.log("📱 Configurando listeners para células...");
        
        // Tentar configurar após 2 segundos (tempo para o board ser renderizado)
        setTimeout(() => {
            const cells = document.querySelectorAll('.board-cell');
            console.log(`📱 Encontradas ${cells.length} células`);
            
            if (cells.length === 0) {
                console.warn("📱 Nenhuma célula encontrada. Tentando novamente em 2s...");
                setTimeout(() => this.setupBoardCellListeners(), 2000);
                return;
            }
            
            cells.forEach(cell => {
                // Remover listeners anteriores
                cell.removeEventListener('click', this.handleCellClick);
                
                // Adicionar novo listener
                cell.addEventListener('click', (e) => this.handleCellClick(e));
            });
            
            console.log(`✅ ${cells.length} células configuradas.`);
            
        }, 2000);
    }

    handleCellClick(e) {
        e.stopPropagation();
        
        const cell = e.currentTarget;
        const regionId = cell.dataset.regionId;
        
        if (!regionId) return;
        
        console.log("📱 Célula clicada, ID:", regionId);
        
        // Verificar se existe gameState
        if (!window.gameState || !window.gameState.regions) {
            console.warn("📱 gameState não disponível ainda");
            return;
        }
        
        const region = window.gameState.regions[parseInt(regionId)];
        if (region) {
            this.openRegionSheet(region);
        }
    }

    openRegionSheet(region) {
        console.log("📱 Abrindo sheet para região:", region?.name);
        
        if (!region || this.activeBottomSheet) {
            console.warn("📱 Sheet já aberto ou região inválida");
            return;
        }
        
        this.activeBottomSheet = true;
        
        const ownerPlayer = region.controller !== null ? gameState.players[region.controller] : null;
        const ownerName = ownerPlayer ? ownerPlayer.name : 'Neutro';
        const ownerIcon = ownerPlayer ? ownerPlayer.icon : '🏳️';
        const ownerColor = ownerPlayer ? ownerPlayer.color : '#9ca3af';

        const resourcesHtml = Object.entries(region.resources)
            .filter(([_, val]) => val > 0)
            .map(([key, val]) => `
                <div class="flex flex-col items-center justify-center p-2 bg-gray-800 rounded-lg border border-white/5">
                    <span class="text-2xl mb-1">${RESOURCE_ICONS[key]}</span>
                    <span class="font-bold text-white">${val}</span>
                    <span class="text-[10px] text-gray-400 uppercase">${key}</span>
                </div>
            `).join('');

        const content = `
            <div class="flex justify-between items-start mb-5">
                <div>
                    <h3 class="text-2xl font-bold text-white flex items-center gap-2">
                        ${region.name}
                        <span class="text-sm font-normal text-gray-400 bg-gray-800 px-2 py-0.5 rounded">${region.biome}</span>
                    </h3>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-xs text-gray-400">Controlado por:</span>
                        <span class="flex items-center gap-1 text-sm font-bold" style="color: ${ownerColor}">
                            ${ownerIcon} ${ownerName}
                        </span>
                    </div>
                </div>
            </div>

            <div class="mb-6">
                <h4 class="text-sm font-bold text-gray-300 mb-3">📦 Recursos Disponíveis</h4>
                <div class="grid grid-cols-4 gap-2">
                    ${resourcesHtml || '<div class="col-span-4 text-center text-gray-500 py-2 italic">Sem recursos naturais</div>'}
                </div>
            </div>

            <div class="pt-4 border-t border-white/10">
                <h4 class="text-xs font-bold text-gray-500 mb-3 text-center">Ações Rápidas</h4>
                <div class="grid grid-cols-2 gap-3">
                    <button onclick="window.gameLogic?.handleExplore?.(); document.getElementById('mobile-bottom-sheet').classList.add('sheet-closed');" 
                            class="py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-bold shadow-lg">
                        ⛏️ Explorar
                    </button>
                    <button onclick="window.gameLogic?.handleCollect?.(); document.getElementById('mobile-bottom-sheet').classList.add('sheet-closed');" 
                            class="py-3 px-4 bg-green-600 hover:bg-green-700 rounded-xl text-white font-bold shadow-lg">
                        🌾 Coletar
                    </button>
                </div>
                <button onclick="window.uiManager?.modals?.openStructureModal?.(); document.getElementById('mobile-bottom-sheet').classList.add('sheet-closed');" 
                        class="w-full mt-3 py-3 px-4 bg-yellow-600 hover:bg-yellow-700 rounded-xl text-white font-bold shadow-lg">
                    🏗️ Construir
                </button>
            </div>
        `;

        // Mostrar sheet
        this.sheetContent.innerHTML = content;
        this.mobileOverlay.classList.remove('hidden');
        setTimeout(() => {
            this.mobileOverlay.classList.remove('opacity-0');
            this.bottomSheet.classList.remove('sheet-closed');
            this.bottomSheet.classList.add('sheet-open');
        }, 10);
        
        // Configurar fechamento
        this.mobileOverlay.onclick = () => this.closeSheet();
    }

    openMenuSheet() {
        const currentPlayer = getCurrentPlayer();
        if (!currentPlayer) return;
        
        const playerColor = currentPlayer.color || '#fff';
        
        const content = `
            <div class="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <div class="text-4xl">${currentPlayer.icon}</div>
                <div>
                    <h3 class="text-xl font-bold text-white">${currentPlayer.name}</h3>
                    <p class="text-sm" style="color: ${playerColor}">${currentPlayer.faction?.name || 'Sem facção'}</p>
                    <div class="mt-1 inline-block bg-yellow-500/20 text-yellow-300 text-xs px-2 py-0.5 rounded font-bold border border-yellow-500/30">
                        ${currentPlayer.victoryPoints} VP
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                <div class="bg-gray-800/40 p-4 rounded-xl border border-white/5">
                    <h4 class="text-yellow-400 font-bold mb-3">📦 Seus Recursos</h4>
                    <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        ${Object.entries(currentPlayer.resources || {}).map(([key, val]) => `
                            <div class="flex justify-between">
                                <span class="text-gray-200">${RESOURCE_ICONS[key]} ${key}</span>
                                <span class="font-bold text-white">${val}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div>
                    <h4 class="text-gray-300 font-bold mb-2">🎮 Controles</h4>
                    <div class="grid grid-cols-2 gap-2">
                        <button onclick="window.gameLogic?.handleEndTurn?.(); this.closeSheet();" 
                                class="py-2 px-3 bg-green-600 rounded-lg text-white">
                            🔄 Terminar Turno
                        </button>
                        <button onclick="window.uiManager?.modals?.openManual?.(); this.closeSheet();" 
                                class="py-2 px-3 bg-blue-600 rounded-lg text-white">
                            📖 Manual
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.sheetContent.innerHTML = content;
        this.mobileOverlay.classList.remove('hidden');
        setTimeout(() => {
            this.mobileOverlay.classList.remove('opacity-0');
            this.bottomSheet.classList.remove('sheet-closed');
            this.bottomSheet.classList.add('sheet-open');
        }, 10);
        
        this.mobileOverlay.onclick = () => this.closeSheet();
    }

    closeSheet() {
        if (!this.bottomSheet) return;
        
        this.bottomSheet.classList.remove('sheet-open');
        this.bottomSheet.classList.add('sheet-closed');
        this.mobileOverlay.classList.add('opacity-0');
        
        setTimeout(() => {
            this.mobileOverlay.classList.add('hidden');
            this.activeBottomSheet = false;
            this.sheetContent.innerHTML = '';
        }, 300);
    }
}
