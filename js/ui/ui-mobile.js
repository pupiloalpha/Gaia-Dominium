// ui-mobile.js - Gerenciador de Experiência Mobile (Setup & Jogo)
import { gameState, getCurrentPlayer } from '../state/game-state.js';
import { RESOURCE_ICONS } from '../state/game-config.js';

export class UIMobileManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.isMobile = window.innerWidth <= 768;
        
        // Estado local
        this.activeBottomSheet = false;
        
        // Referências aos elementos criados
        this.mobileOverlay = null;
        this.bottomSheet = null;
        this.sheetContent = null;
    }

    init() {
        if (!this.isMobile) return;

        console.log("📱 Modo Mobile Detectado: Inicializando adaptações completas...");

        // 1. Injetar CSS global (serve para Setup e Jogo)
        this.injectMobileStyles();

        // 2. Criar estrutura base do jogo (Sheets, Overlay)
        // Criamos isso cedo para estar pronto quando o jogo começar
        this.createMobileElements();

        // 3. Verificar qual tela está ativa e adaptar
        this.checkAndAdaptCurrentScreen();

        // 4. Ouvinte para mudança de fase (Setup -> Jogo)
        // Monitoramos o botão de iniciar para aplicar correções finais
        const startBtn = document.getElementById('startGameBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                setTimeout(() => this.adaptGameScreen(), 500);
            });
        }
    }

    checkAndAdaptCurrentScreen() {
        const setupScreen = document.getElementById('setupScreen');
        const gameContainer = document.getElementById('gameContainer');

        if (setupScreen && !setupScreen.classList.contains('hidden')) {
            this.adaptSetupScreen();
        } else if (gameContainer && !gameContainer.classList.contains('hidden')) {
            this.adaptGameScreen();
        }
    }

    // =========================================================================
    // 🎨 GESTÃO DA TELA DE CADASTRO (SETUP)
    // =========================================================================

    adaptSetupScreen() {
        console.log("📱 Adaptando Tela de Cadastro...");
        
        // Ajustar container principal para não cortar conteúdo
        const setupContainer = document.querySelector('#setupScreen .bg-gray-800');
        if (setupContainer) {
            setupContainer.classList.remove('max-w-4xl');
            setupContainer.classList.add('w-full', 'min-h-screen', 'rounded-none', 'flex', 'flex-col');
            // Remove bordas e arredondamentos para parecer app nativo
            setupContainer.style.border = 'none';
            setupContainer.style.borderRadius = '0';
        }

        // Ajustar Grid de Ícones para ser responsivo e scrollável horizontalmente ou grid menor
        const iconSelection = document.getElementById('iconSelection');
        if (iconSelection) {
            iconSelection.classList.remove('grid-cols-6', 'gap-4');
            iconSelection.classList.add('grid-cols-4', 'gap-2', 'overflow-y-auto', 'max-h-40', 'p-1');
        }

        // Ajustar botões de dificuldade de IA para grid
        const aiButtonsContainer = document.querySelector('.flex.gap-2.mb-4'); // Onde os botões de IA são injetados
        if (aiButtonsContainer) {
            aiButtonsContainer.classList.remove('flex', 'flex-row');
            aiButtonsContainer.classList.add('grid', 'grid-cols-3', 'gap-2');
        }

        // Ajustar Inputs para evitar zoom automático do iOS (font-size 16px)
        const inputs = document.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.style.fontSize = '16px'; // Previne zoom no iPhone
        });
    }

    // =========================================================================
    // 🎮 GESTÃO DA TELA DE JOGO
    // =========================================================================

    adaptGameScreen() {
        console.log("📱 Adaptando Tela de Jogo...");

        const navbar = document.getElementById('gameNavbar');
        if (navbar) navbar.classList.add('mobile-navbar-compact');
        
        const container = document.getElementById('gameContainer');
        if (container) container.style.paddingBottom = '100px';

        this.setupTouchOptimization();
        this.overrideGameBehaviors();
    }

    injectMobileStyles() {
        const styleId = 'gaia-mobile-styles';
        if (document.getElementById(styleId)) return;

        const css = `
            /* --- GERAL MOBILE --- */
            body {
                overscroll-behavior-y: none; /* Previne pull-to-refresh acidental */
            }

            /* --- TELA DE SETUP --- */
            /* Melhorar botões de seleção de ícone */
            .icon-option {
                width: 100% !important;
                height: 50px !important;
                font-size: 1.5rem !important;
            }
            
            /* Botões de Ação Grandes */
            #addPlayerBtn, #startGameBtn {
                padding: 16px !important;
                font-size: 1.1rem !important;
            }

            /* --- TELA DE JOGO --- */
            #mobile-overlay {
                transition: opacity 0.3s ease;
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
            }
            
            #mobile-bottom-sheet {
                box-shadow: 0 -5px 25px rgba(0,0,0,0.8);
                transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                padding-bottom: env(safe-area-inset-bottom, 20px);
            }

            .sheet-open { transform: translateY(0) !important; }
            .sheet-closed { transform: translateY(100%) !important; }

            .mobile-navbar-compact { padding: 0.5rem !important; }
            .mobile-navbar-compact h1 { font-size: 1rem !important; }

            @media (max-width: 768px) {
                /* Esconder elementos Desktop */
                #sidebar { display: none !important; }
                #regionTooltip { display: none !important; }
                
                /* Mapa */
                .board-cell { min-height: 80px; }
                
                /* Rodapé Fixo */
                #gameFooter {
                    bottom: 0 !important;
                    left: 0 !important;
                    transform: none !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    border-radius: 12px 12px 0 0 !important;
                    border: none !important;
                    border-top: 1px solid rgba(255,255,255,0.1) !important;
                    padding-bottom: env(safe-area-inset-bottom, 10px) !important;
                    z-index: 80 !important;
                }
                
                .action-btn {
                    flex-direction: column;
                    gap: 2px;
                    font-size: 0.7rem !important;
                    padding: 8px 4px !important;
                }
            }
        `;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
    }

    createMobileElements() {
        // Evita criar duplicado
        if (document.getElementById('mobile-bottom-sheet')) return;

        // Overlay
        this.mobileOverlay = document.createElement('div');
        this.mobileOverlay.id = 'mobile-overlay';
        this.mobileOverlay.className = 'fixed inset-0 bg-black/70 z-[90] hidden opacity-0';
        this.mobileOverlay.addEventListener('click', () => this.closeSheet());
        document.body.appendChild(this.mobileOverlay);

        // Bottom Sheet
        this.bottomSheet = document.createElement('div');
        this.bottomSheet.id = 'mobile-bottom-sheet';
        this.bottomSheet.className = 'fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-yellow-500/30 rounded-t-2xl z-[100] transform translate-y-full max-h-[85vh] overflow-y-auto sheet-closed';
        this.bottomSheet.innerHTML = `
            <div class="sticky top-0 bg-gray-900 z-10 pt-3 pb-2 w-full flex justify-center border-b border-white/5" onclick="this.parentElement.dispatchEvent(new Event('closeSheet'))">
                <div class="w-12 h-1.5 bg-gray-700 rounded-full"></div>
            </div>
            <div id="mobile-sheet-content" class="p-4"></div>
        `;
        
        // Listener para fechar ao clicar na barra superior
        this.bottomSheet.addEventListener('closeSheet', () => this.closeSheet());
        document.body.appendChild(this.bottomSheet);
        
        this.sheetContent = this.bottomSheet.querySelector('#mobile-sheet-content');

        // FAB Menu (Hamburger)
        const menuFab = document.createElement('button');
        menuFab.id = 'mobile-menu-fab';
        menuFab.className = 'fixed top-16 right-4 z-40 w-12 h-12 bg-gray-800/90 backdrop-blur border border-yellow-500/30 rounded-full shadow-lg flex items-center justify-center text-xl text-yellow-400 active:scale-95 transition-transform hidden';
        
        // Verifica se bootstrap icons está carregado
        const hasIcons = document.querySelector('link[href*="bootstrap-icons"]');
        menuFab.innerHTML = hasIcons ? '<i class="bi bi-list"></i>' : '☰';
        
        menuFab.onclick = () => this.openMenuSheet();
        document.body.appendChild(menuFab);

        // Mostrar o FAB apenas quando entrar no jogo
        const observer = new MutationObserver((mutations) => {
            const gameContainer = document.getElementById('gameContainer');
            if (gameContainer && !gameContainer.classList.contains('hidden')) {
                menuFab.classList.remove('hidden');
            } else {
                menuFab.classList.add('hidden');
            }
        });
        observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
    }

    // =========================================================================
// 🎮 SOBRESCRITA DE COMPORTAMENTOS (CORRIGIDO)
// =========================================================================

overrideGameBehaviors() {
    const gameMgr = this.uiManager.gameManager;

    // Desativar Tooltip nativo apenas em mobile
    gameMgr.showRegionTooltip = () => {};
    
    // REMOVER O EVENT LISTENER GLOBAL PROBLEMÁTICO
    // Em vez disso, vamos modificar o comportamento das células existentes
    
    // Aguardar o board ser renderizado
    setTimeout(() => {
        const boardCells = document.querySelectorAll('.board-cell');
        
        boardCells.forEach(cell => {
            // Salvar o listener original
            const originalClick = cell.onclick;
            
            // Substituir por nossa versão mobile-friendly
            cell.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Primeiro, executar o comportamento original (se existir)
                if (originalClick && typeof originalClick === 'function') {
                    originalClick.call(cell, e);
                }
                
                // Depois, abrir o sheet mobile (se não for um modal ou ação)
                const regionId = cell.dataset.regionId;
                if (regionId && !e.target.closest('[id$="Modal"]')) {
                    const region = gameState.regions[parseInt(regionId)];
                    if (region) {
                        setTimeout(() => this.openRegionSheet(region), 100);
                    }
                }
            }, { once: false }); // Permitir múltiplos handlers
        });
    }, 1000); // Aguardar o jogo inicializar
    
    // Otimizar performance no mobile
    this.setupTouchOptimization();
}

    // =========================================================================
    // 📄 CONTEÚDO DOS SHEETS (Igual à versão anterior)
    // =========================================================================

    openRegionSheet(region) {
        // VERIFICAÇÃO DE SEGURANÇA
    if (!region || !this.activeBottomSheet) {
        console.warn("📱 Tentativa de abrir sheet inválida ou já aberta");
        return;
    }

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
                    <span class="text-[10px] text-gray-400 uppercase tracking-wider">${key}</span>
                </div>
            `).join('');

        const content = `
            <div class="flex justify-between items-start mb-5">
                <div>
                    <h3 class="text-2xl font-bold text-white flex items-center gap-2">
                        ${region.name}
                        <span class="text-sm font-normal text-gray-400 bg-gray-800 px-2 py-0.5 rounded border border-white/10">${region.biome}</span>
                    </h3>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-xs text-gray-400">Controlado por:</span>
                        <span class="flex items-center gap-1 text-sm font-bold" style="color: ${ownerColor}">
                            ${ownerIcon} ${ownerName}
                        </span>
                    </div>
                </div>
                <div class="flex flex-col items-end">
                    <span class="text-2xl font-bold text-yellow-400 flex items-center gap-1">
                        ${region.explorationLevel} <span class="text-sm">⭐</span>
                    </span>
                    <span class="text-[10px] text-gray-500">Nível Exploração</span>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3 mb-5">
                <div class="bg-gray-800/60 p-3 rounded-xl border border-white/5">
                    <div class="text-xs text-gray-500 mb-1 uppercase">Estruturas</div>
                    <div class="text-sm font-medium text-white">
                        ${region.structures.length ? region.structures.join(', ') : 'Nenhuma estrutura'}
                    </div>
                </div>
                 <div class="bg-gray-800/60 p-3 rounded-xl border border-white/5">
                    <div class="text-xs text-gray-500 mb-1 uppercase">Coordenada</div>
                    <div class="text-sm font-medium text-white">ID #${region.id}</div>
                </div>
            </div>

            <div class="mb-6">
                <h4 class="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wide">Recursos Disponíveis</h4>
                <div class="grid grid-cols-4 gap-2">
                    ${resourcesHtml || '<div class="col-span-4 text-center text-gray-500 py-2 italic">Sem recursos naturais</div>'}
                </div>
            </div>

            <div class="pt-4 border-t border-white/10">
                <h4 class="text-xs font-bold text-gray-500 mb-3 uppercase text-center">Ações Rápidas</h4>
                <div class="grid grid-cols-2 gap-3">
                    <button id="mobile-btn-explore" class="py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                        <span>⛏️</span> Explorar
                    </button>
                    <button id="mobile-btn-collect" class="py-3 px-4 bg-green-600 hover:bg-green-700 rounded-xl text-white font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                        <span>🌾</span> Coletar
                    </button>
                </div>
                <button id="mobile-btn-build" class="w-full mt-3 py-3 px-4 bg-yellow-600 hover:bg-yellow-700 rounded-xl text-white font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                    <span>🏗️</span> Construir Estrutura
                </button>
            </div>
            <div class="h-6"></div>
        `;

        this.openSheet(content);

        // Bind events dos botões criados
        setTimeout(() => {
            const btnExplore = document.getElementById('mobile-btn-explore');
            const btnCollect = document.getElementById('mobile-btn-collect');
            const btnBuild = document.getElementById('mobile-btn-build');

            if(btnExplore) btnExplore.onclick = () => { this.closeSheet(); window.gameLogic.handleExplore(); };
            if(btnCollect) btnCollect.onclick = () => { this.closeSheet(); window.gameLogic.handleCollect(); };
            if(btnBuild) btnBuild.onclick = () => { this.closeSheet(); this.uiManager.modals.openStructureModal(); };
        }, 100);
    }

    openMenuSheet() {
        const currentPlayer = getCurrentPlayer();
        const playerColor = currentPlayer ? currentPlayer.color : '#fff';
        
        const resourceListHTML = document.getElementById('resourceList')?.innerHTML || '';
        const logEntriesHTML = document.getElementById('logEntriesSidebar')?.innerHTML || '';
        
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
                    <h4 class="text-yellow-400 font-bold mb-3 flex items-center gap-2">📦 Seus Recursos</h4>
                    <ul class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">${resourceListHTML}</ul>
                </div>
                <div>
                    <h4 class="text-gray-300 font-bold mb-2 flex items-center gap-2">📜 Histórico Recente</h4>
                    <div class="bg-black/30 rounded-lg p-3 max-h-40 overflow-y-auto border border-white/5 text-xs text-gray-300">
                        ${logEntriesHTML || '<p class="text-gray-500 italic">Sem atividades recentes.</p>'}
                    </div>
                </div>
            </div>
            <div class="h-6"></div>
        `;

        this.openSheet(content);
    }

    openSheet(htmlContent) {
        if (!this.bottomSheet || !this.sheetContent) return;
        this.sheetContent.innerHTML = htmlContent;
        this.mobileOverlay.classList.remove('hidden');
        void this.mobileOverlay.offsetWidth; 
        this.mobileOverlay.classList.remove('opacity-0');
        this.bottomSheet.classList.remove('sheet-closed');
        this.bottomSheet.classList.add('sheet-open');
        this.activeBottomSheet = true;
    }

    closeSheet() {
    if (!this.bottomSheet) return;
    
    // Fechar animação
    this.bottomSheet.classList.remove('sheet-open');
    this.bottomSheet.classList.add('sheet-closed');
    this.mobileOverlay.classList.add('opacity-0');
    
    // Resetar estado após animação
    setTimeout(() => {
        this.mobileOverlay.classList.add('hidden');
        this.activeBottomSheet = false;
        this.sheetContent.innerHTML = ''; // Limpar conteúdo
    }, 300);
}

    setupTouchOptimization() {
        const map = document.getElementById('gameMap');
        if (map) map.style.touchAction = 'none'; 
    }
}
