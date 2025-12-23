// ui-mobile.js - Gerenciador de Experiência Mobile
import { gameState } from '../state/game-state.js';
import { RESOURCE_ICONS } from '../state/game-config.js';

export class UIMobileManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.isMobile = window.innerWidth <= 768;
        this.activeBottomSheet = null;
        
        // Elementos Mobile Específicos
        this.mobileOverlay = null;
        this.bottomSheet = null;
    }

    init() {
        if (!this.isMobile) return;

        console.log("📱 Inicializando Modo Mobile...");
        this.injectMobileStyles();
        this.createMobileStructure();
        this.setupTouchEvents();
        this.reorganizeLayout();
        this.overrideTooltipBehavior();
    }

    // Cria a estrutura base para Bottom Sheets e overlays
    createMobileStructure() {
        // Overlay escuro para quando abrir menus
        this.mobileOverlay = document.createElement('div');
        this.mobileOverlay.id = 'mobile-overlay';
        this.mobileOverlay.className = 'hidden fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm transition-opacity duration-300 opacity-0';
        this.mobileOverlay.addEventListener('click', () => this.closeAllSheets());
        document.body.appendChild(this.mobileOverlay);

        // Container Genérico de Bottom Sheet
        this.bottomSheet = document.createElement('div');
        this.bottomSheet.id = 'mobile-bottom-sheet';
        this.bottomSheet.className = 'fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-yellow-500/30 rounded-t-2xl z-[70] transform translate-y-full transition-transform duration-300 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] max-h-[80vh] overflow-y-auto';
        this.bottomSheet.innerHTML = `
            <div class="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mb-4"></div>
            <div id="mobile-sheet-content"></div>
        `;
        document.body.appendChild(this.bottomSheet);

        // Botão Flutuante de Menu (Substitui Sidebar)
        const menuFab = document.createElement('button');
        menuFab.id = 'mobile-menu-fab';
        menuFab.className = 'fixed top-20 right-4 z-40 w-12 h-12 bg-gray-800 border border-white/20 rounded-full shadow-lg flex items-center justify-center text-xl text-yellow-400 active:scale-95 transition-transform';
        menuFab.innerHTML = '☰';
        menuFab.onclick = () => this.openSidebarAsSheet();
        document.body.appendChild(menuFab);
    }

    // Move elementos do DOM original para posições mobile-friendly
    reorganizeLayout() {
        // Mover o Navbar para ser menos intrusivo ou fixo
        const navbar = document.getElementById('gameNavbar');
        if (navbar) {
            navbar.classList.add('mobile-compact-nav');
        }

        // Ajustar Footer para ser sticky bottom real
        const footer = document.getElementById('gameFooter');
        if (footer) {
            footer.classList.remove('bottom-4', 'rounded-lg', 'left-1/2', '-translate-x-1/2', 'max-w-4xl');
            footer.classList.add('bottom-0', 'left-0', 'right-0', 'rounded-t-xl', 'border-t', 'border-white/10', 'bg-gray-900/95');
            // Remove bordas laterais e inferiores para colar na tela
            footer.style.width = '100%';
            footer.style.maxWidth = '100%';
        }
    }

    // Intercepta a lógica de tooltip do ui-game.js
    overrideTooltipBehavior() {
        // Monkey patch no método showRegionTooltip do gameManager
        const originalShowTooltip = this.uiManager.gameManager.showRegionTooltip.bind(this.uiManager.gameManager);
        
        // Substituímos o método original
        this.uiManager.gameManager.showRegionTooltip = (region, targetEl) => {
            if (this.isMobile) {
                // Em mobile, abrimos o Bottom Sheet em vez do tooltip flutuante
                this.showRegionDetailsSheet(region);
            } else {
                // Em desktop, mantém comportamento normal
                originalShowTooltip(region, targetEl);
            }
        };

        // Desativa o hideRegionTooltip no mobile para não fechar o sheet acidentalmente
        const originalHideTooltip = this.uiManager.gameManager.hideRegionTooltip.bind(this.uiManager.gameManager);
        this.uiManager.gameManager.hideRegionTooltip = () => {
            if (!this.isMobile) originalHideTooltip();
        };
    }

    // Exibe detalhes da região no Bottom Sheet
    showRegionDetailsSheet(region) {
        const owner = region.controller !== null 
            ? `${gameState.players[region.controller].icon} ${gameState.players[region.controller].name}`
            : '<span class="text-gray-400">Neutro</span>';
        
        const resourcesHtml = Object.entries(region.resources)
            .filter(([_, val]) => val > 0)
            .map(([key, val]) => `
                <div class="flex flex-col items-center p-2 bg-gray-800 rounded border border-white/5">
                    <span class="text-xl mb-1">${RESOURCE_ICONS[key]}</span>
                    <span class="font-bold text-white">${val}</span>
                    <span class="text-[10px] text-gray-400 uppercase">${key}</span>
                </div>
            `).join('');

        const content = `
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-bold text-yellow-400">${region.name}</h3>
                    <p class="text-sm text-gray-400">${region.biome}</p>
                </div>
                <div class="bg-gray-800 px-3 py-1 rounded-full text-sm border border-white/10">
                    ${owner}
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="bg-gray-800/50 p-3 rounded-lg">
                    <div class="text-xs text-gray-500 mb-1">Exploração</div>
                    <div class="text-lg font-bold text-white flex items-center gap-1">
                        ${region.explorationLevel} <span class="text-yellow-500">⭐</span>
                    </div>
                </div>
                <div class="bg-gray-800/50 p-3 rounded-lg">
                    <div class="text-xs text-gray-500 mb-1">Estruturas</div>
                    <div class="text-sm font-medium text-white">
                        ${region.structures.length ? region.structures.join(', ') : 'Nenhuma'}
                    </div>
                </div>
            </div>

            <div class="mb-6">
                <h4 class="text-sm font-bold text-gray-300 mb-2">Recursos Disponíveis</h4>
                <div class="grid grid-cols-4 gap-2">
                    ${resourcesHtml || '<p class="text-gray-500 text-sm col-span-4">Sem recursos</p>'}
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <button onclick="window.gameLogic.handleExplore()" class="py-3 bg-blue-600 rounded-lg text-white font-bold shadow-lg active:scale-95 transition-transform">
                    Explorar / Dominar
                </button>
                <button onclick="window.gameLogic.handleCollect()" class="py-3 bg-green-600 rounded-lg text-white font-bold shadow-lg active:scale-95 transition-transform">
                    Coletar
                </button>
            </div>
            <div class="mt-2 text-center text-xs text-gray-500">
                Toque fora para fechar
            </div>
        `;

        this.openSheet(content);
    }

    // Abre o conteúdo da Sidebar (Recursos, Logs) no Sheet
    openSidebarAsSheet() {
        // Clona os elementos da sidebar original para não quebrar referências de eventos
        const resourceList = document.getElementById('resourceList').cloneNode(true);
        const logEntries = document.getElementById('logEntriesSidebar').cloneNode(true);
        const achievements = document.getElementById('achievementsList').cloneNode(true);
        const playerInfo = document.getElementById('sidebarPlayerHeader').innerHTML;

        const content = `
            <div class="mb-4 border-b border-white/10 pb-4">
                ${playerInfo}
            </div>
            
            <div class="mb-6">
                <h4 class="text-yellow-400 font-bold mb-2 text-lg">Seus Recursos</h4>
                <ul class="grid grid-cols-2 gap-2 text-sm">
                    ${resourceList.innerHTML}
                </ul>
            </div>

            <div class="mb-6">
                <h4 class="text-gray-300 font-bold mb-2">Histórico Recente</h4>
                <div class="bg-gray-800 rounded p-2 max-h-40 overflow-y-auto">
                    ${logEntries.innerHTML}
                </div>
            </div>

            <div class="mb-4">
                <h4 class="text-gray-300 font-bold mb-2">Conquistas</h4>
                <div class="space-y-2">
                    ${achievements.innerHTML}
                </div>
            </div>
        `;

        this.openSheet(content);
    }

    openSheet(htmlContent) {
        const contentContainer = document.getElementById('mobile-sheet-content');
        if (contentContainer) {
            contentContainer.innerHTML = htmlContent;
            this.bottomSheet.classList.remove('translate-y-full');
            
            this.mobileOverlay.classList.remove('hidden');
            // Pequeno delay para permitir a transição de opacidade
            requestAnimationFrame(() => {
                this.mobileOverlay.classList.remove('opacity-0');
            });
            
            this.activeBottomSheet = true;
        }
    }

    closeAllSheets() {
        if (!this.bottomSheet) return;
        
        this.bottomSheet.classList.add('translate-y-full');
        this.mobileOverlay.classList.add('opacity-0');
        
        setTimeout(() => {
            this.mobileOverlay.classList.add('hidden');
        }, 300);
        
        this.activeBottomSheet = false;
        
        // Limpar seleção visual no mapa se desejar
        // this.uiManager.gameManager.clearRegionSelection();
    }

    setupTouchEvents() {
        // Melhorar resposta ao toque no mapa
        const map = document.getElementById('gameMap');
        if(map) {
            map.style.touchAction = 'none'; // Previne scroll do browser ao arrastar mapa
            // Implementação futura: lógica de Pan/Zoom customizada com touch events
        }
    }

    injectMobileStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Ajustes Mobile Injetados */
            .mobile-compact-nav {
                padding: 0.5rem !important;
            }
            .mobile-compact-nav h1 {
                font-size: 1rem !important;
            }
            
            /* Ajuste de células do grid para toque */
            .board-cell {
                min-height: 80px !important; /* Mais alto para caber o dedo */
            }
            
            /* Esconder scrollbar no sheet */
            #mobile-bottom-sheet::-webkit-scrollbar {
                width: 4px;
            }
            #mobile-bottom-sheet::-webkit-scrollbar-thumb {
                background-color: rgba(255,255,255,0.2);
                border-radius: 4px;
            }

            /* Ajustes no Footer Mobile */
            #gameFooter .action-btn {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-size: 0.7rem !important;
                padding: 8px 2px !important;
                height: 50px;
            }
            
            /* Ícones SVG para os botões do footer (opcional, via CSS content) */
        `;
        document.head.appendChild(style);
    }
}
