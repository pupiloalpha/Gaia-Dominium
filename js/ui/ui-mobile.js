// ui-mobile.js - Gerenciador de Experiência Mobile (UX/UI Decorator)
import { gameState, getCurrentPlayer } from '../state/game-state.js';
import { RESOURCE_ICONS } from '../state/game-config.js';

export class UIMobileManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        // Detecção simples de mobile (largura < 768px)
        this.isMobile = window.innerWidth <= 768;
        
        // Estado local
        this.activeBottomSheet = false;
        
        // Referências aos elementos criados
        this.mobileOverlay = null;
        this.bottomSheet = null;
        this.sheetContent = null;
    }

    /**
     * Inicializa o sistema mobile apenas se estiver em tela pequena
     */
    init() {
        if (!this.isMobile) return;

        console.log("📱 Modo Mobile Detectado: Inicializando adaptações...");

        // 1. Injetar CSS específico para mobile
        this.injectMobileStyles();

        // 2. Criar estrutura do DOM (Bottom Sheet, Overlay, FAB)
        this.createMobileElements();

        // 3. Reorganizar layout existente
        this.adaptExistingLayout();

        // 4. Substituir comportamentos de Desktop (Tooltips -> Sheets)
        this.overrideDesktopBehaviors();

        // 5. Configurar eventos de toque
        this.setupTouchOptimization();
    }

    /**
     * Injeta estilos CSS críticos para a interface mobile
     * Evita ter que editar o style.css massivo
     */
    injectMobileStyles() {
        const styleId = 'gaia-mobile-styles';
        if (document.getElementById(styleId)) return;

        const css = `
            /* --- Mobile Overlay & Sheet --- */
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

            .sheet-open {
                transform: translateY(0) !important;
            }

            .sheet-closed {
                transform: translateY(100%) !important;
            }

            /* --- Adaptações de Layout --- */
            .mobile-navbar-compact {
                padding: 0.5rem !important;
            }
            .mobile-navbar-compact h1 {
                font-size: 1rem !important;
            }

            /* Esconder elementos desktop */
            @media (max-width: 768px) {
                #sidebar { display: none !important; }
                #regionTooltip { display: none !important; }
                
                /* Melhorar área de toque */
                .board-cell { min-height: 80px; }
                
                /* Footer fixo e colado */
                #gameFooter {
                    bottom: 0 !important;
                    left: 0 !important;
                    transform: none !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    border-radius: 12px 12px 0 0 !important;
                    border-left: 0 !important;
                    border-right: 0 !important;
                    border-bottom: 0 !important;
                    padding-bottom: env(safe-area-inset-bottom, 10px) !important;
                    z-index: 80 !important; /* Acima do mapa, abaixo do sheet */
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

    /**
     * Cria os elementos DOM necessários para a UI Mobile
     */
    createMobileElements() {
        // Overlay (Fundo escuro)
        this.mobileOverlay = document.createElement('div');
        this.mobileOverlay.id = 'mobile-overlay';
        this.mobileOverlay.className = 'fixed inset-0 bg-black/70 z-[90] hidden opacity-0';
        this.mobileOverlay.addEventListener('click', () => this.closeSheet());
        document.body.appendChild(this.mobileOverlay);

        // Bottom Sheet (Painel deslizante)
        this.bottomSheet = document.createElement('div');
        this.bottomSheet.id = 'mobile-bottom-sheet';
        this.bottomSheet.className = 'fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-yellow-500/30 rounded-t-2xl z-[100] transform translate-y-full max-h-[85vh] overflow-y-auto sheet-closed';
        this.bottomSheet.innerHTML = `
            <div class="sticky top-0 bg-gray-900 z-10 pt-3 pb-2 w-full flex justify-center border-b border-white/5" id="sheet-handle">
                <div class="w-12 h-1.5 bg-gray-700 rounded-full"></div>
            </div>
            <div id="mobile-sheet-content" class="p-4"></div>
        `;
        document.body.appendChild(this.bottomSheet);
        this.sheetContent = this.bottomSheet.querySelector('#mobile-sheet-content');

        // Botão FAB para Menu (Substitui Sidebar)
        // Posicionado no topo direito, abaixo da navbar
        const menuFab = document.createElement('button');
        menuFab.id = 'mobile-menu-fab';
        menuFab.className = 'fixed top-16 right-4 z-40 w-12 h-12 bg-gray-800/90 backdrop-blur border border-yellow-500/30 rounded-full shadow-lg flex items-center justify-center text-xl text-yellow-400 active:scale-95 transition-transform';
        menuFab.innerHTML = '<i class="bi bi-list"></i>'; // Usando Bootstrap Icons ou emoji '☰'
        menuFab.onclick = () => this.openMenuSheet();
        
        // Se bootstrap icons não carregar, fallback para texto
        if(!document.querySelector('link[href*="bootstrap-icons"]')) {
            menuFab.innerHTML = '☰';
        }
        
        document.body.appendChild(menuFab);
    }

    /**
     * Ajusta classes de elementos existentes para melhor visualização
     */
    adaptExistingLayout() {
        const navbar = document.getElementById('gameNavbar');
        if (navbar) navbar.classList.add('mobile-navbar-compact');
        
        // Garante que o container do jogo tenha padding para o footer
        const container = document.getElementById('gameContainer');
        if (container) container.style.paddingBottom = '100px';
    }

    /**
     * Intercepta a lógica de Tooltip do UIGameManager
     * Em vez de mostrar tooltip flutuante, abre o Bottom Sheet
     */
    overrideDesktopBehaviors() {
        const gameMgr = this.uiManager.gameManager;

        // Salva referência original (opcional, caso queira reverter)
        const originalShowTooltip = gameMgr.showRegionTooltip.bind(gameMgr);

        // Substitui a função
        gameMgr.showRegionTooltip = (region, targetEl) => {
            // No mobile, ignoramos o tooltip hover e usamos o clique
            // Mas se a lógica do jogo chamar tooltip explicitamente, redirecionamos
            // Nota: Geralmente mobile usa 'click' para selecionar. 
            // Vamos garantir que a seleção de região abra o Sheet.
        };

        // Intercepta o clique na célula (que já existe no ui-game.js)
        // Adicionamos um listener global para capturar seleção de região e abrir detalhes
        document.addEventListener('click', (e) => {
            const cell = e.target.closest('.board-cell');
            if (cell && cell.dataset.regionId) {
                const region = gameState.regions[parseInt(cell.dataset.regionId)];
                // Pequeno delay para permitir que a lógica de seleção do jogo ocorra primeiro
                setTimeout(() => this.openRegionSheet(region), 50);
            }
        });
    }

    /**
     * Abre o Bottom Sheet com detalhes da região
     */
    openRegionSheet(region) {
        if (!region) return;

        const ownerPlayer = region.controller !== null ? gameState.players[region.controller] : null;
        const ownerName = ownerPlayer ? ownerPlayer.name : 'Neutro';
        const ownerIcon = ownerPlayer ? ownerPlayer.icon : '🏳️';
        const ownerColor = ownerPlayer ? ownerPlayer.color : '#9ca3af';

        // Renderiza recursos
        const resourcesHtml = Object.entries(region.resources)
            .filter(([_, val]) => val > 0)
            .map(([key, val]) => `
                <div class="flex flex-col items-center justify-center p-2 bg-gray-800 rounded-lg border border-white/5">
                    <span class="text-2xl mb-1">${RESOURCE_ICONS[key]}</span>
                    <span class="font-bold text-white">${val}</span>
                    <span class="text-[10px] text-gray-400 uppercase tracking-wider">${key}</span>
                </div>
            `).join('');

        // Define conteúdo HTML
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
                    <div class="text-sm font-medium text-white">
                        Região ID #${region.id}
                    </div>
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
                        <span>⛏️</span> Explorar / Dominar
                    </button>
                    <button id="mobile-btn-collect" class="py-3 px-4 bg-green-600 hover:bg-green-700 rounded-xl text-white font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                        <span>🌾</span> Coletar
                    </button>
                </div>
                <button id="mobile-btn-build" class="w-full mt-3 py-3 px-4 bg-yellow-600 hover:bg-yellow-700 rounded-xl text-white font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                    <span>🏗️</span> Construir Estrutura
                </button>
            </div>
            
            <div class="h-6"></div> `;

        this.openSheet(content);

        // Bind events dos botões criados
        setTimeout(() => {
            document.getElementById('mobile-btn-explore')?.addEventListener('click', () => {
                this.closeSheet();
                window.gameLogic.handleExplore();
            });
            document.getElementById('mobile-btn-collect')?.addEventListener('click', () => {
                this.closeSheet();
                window.gameLogic.handleCollect();
            });
            document.getElementById('mobile-btn-build')?.addEventListener('click', () => {
                this.closeSheet();
                this.uiManager.modals.openStructureModal();
            });
        }, 100);
    }

    /**
     * Abre o Bottom Sheet com o Menu (Recursos, Logs, Infos)
     * Substitui a Sidebar desktop
     */
    openMenuSheet() {
        const currentPlayer = getCurrentPlayer();
        const playerColor = currentPlayer ? currentPlayer.color : '#fff';
        
        // Clona conteúdos existentes para manter consistência
        const resourceListHTML = document.getElementById('resourceList')?.innerHTML || '';
        const logEntriesHTML = document.getElementById('logEntriesSidebar')?.innerHTML || '';
        const achievementsHTML = document.getElementById('achievementsList')?.innerHTML || '';

        const content = `
            <div class="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <div class="text-4xl">${currentPlayer.icon}</div>
                <div>
                    <h3 class="text-xl font-bold text-white">${currentPlayer.name}</h3>
                    <p class="text-sm" style="color: ${playerColor}">${currentPlayer.faction?.name || 'Sem facção'}</p>
                    <div class="mt-1 inline-block bg-yellow-500/20 text-yellow-300 text-xs px-2 py-0.5 rounded font-bold border border-yellow-500/30">
                        ${currentPlayer.victoryPoints} Pontos de Vitória
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                <div class="bg-gray-800/40 p-4 rounded-xl border border-white/5">
                    <h4 class="text-yellow-400 font-bold mb-3 flex items-center gap-2">
                        📦 Seus Recursos
                    </h4>
                    <ul class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        ${resourceListHTML}
                    </ul>
                </div>

                <div>
                    <h4 class="text-gray-300 font-bold mb-2 flex items-center gap-2">
                        📜 Histórico Recente
                    </h4>
                    <div class="bg-black/30 rounded-lg p-3 max-h-40 overflow-y-auto border border-white/5 text-xs text-gray-300">
                        ${logEntriesHTML || '<p class="text-gray-500 italic">Sem atividades recentes.</p>'}
                    </div>
                </div>

                <div>
                    <h4 class="text-gray-300 font-bold mb-2 flex items-center gap-2">
                        🏆 Conquistas
                    </h4>
                    <div class="space-y-2">
                        ${achievementsHTML}
                    </div>
                </div>
            </div>
            
             <div class="h-6"></div> `;

        this.openSheet(content);
    }

    /**
     * Lógica genérica para abrir o sheet
     */
    openSheet(htmlContent) {
        if (!this.bottomSheet || !this.sheetContent) return;

        this.sheetContent.innerHTML = htmlContent;
        
        // Mostrar overlay
        this.mobileOverlay.classList.remove('hidden');
        // Hack para forçar reflow e permitir transição CSS
        void this.mobileOverlay.offsetWidth; 
        this.mobileOverlay.classList.remove('opacity-0');

        // Subir sheet
        this.bottomSheet.classList.remove('sheet-closed');
        this.bottomSheet.classList.add('sheet-open');

        this.activeBottomSheet = true;
    }

    /**
     * Fecha o sheet atual
     */
    closeSheet() {
        if (!this.bottomSheet) return;

        // Descer sheet
        this.bottomSheet.classList.remove('sheet-open');
        this.bottomSheet.classList.add('sheet-closed');

        // Esconder overlay
        this.mobileOverlay.classList.add('opacity-0');
        
        // Aguardar transição para esconder display
        setTimeout(() => {
            this.mobileOverlay.classList.add('hidden');
            this.activeBottomSheet = false;
        }, 300);
    }

    /**
     * Otimizações básicas de toque
     */
    setupTouchOptimization() {
        // Prevenir zoom acidental com duplo toque
        // Nota: O meta viewport user-scalable=yes foi definido no HTML, 
        // então controlamos via touch-action onde necessário
        const map = document.getElementById('gameMap');
        if (map) {
            // Permite pan mas evita comportamentos padrão do browser
            map.style.touchAction = 'none'; 
        }
    }
}
