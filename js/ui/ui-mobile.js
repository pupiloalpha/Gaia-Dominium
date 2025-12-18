// ui-mobile.js - Gerenciador de Interface Mobile Otimizado
export class MobileManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.isMobile = this.detectMobile();
        this.sidebarVisible = false;
        this.initialScreenVisible = true;
        
        // Bind methods
        this.toggleSidebar = this.toggleSidebar.bind(this);
        this.setupMobileGestures = this.setupMobileGestures.bind(this);
        this.addSidebarToggleButton = this.addSidebarToggleButton.bind(this);
    }

    detectMobile() {
        // Detecção mais precisa de dispositivos móveis
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        const mobileRegex = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i;
        const isMobileUserAgent = mobileRegex.test(userAgent);
        const isSmallScreen = window.innerWidth <= 768;
        
        return (isMobileUserAgent || (isTouchDevice && isSmallScreen));
    }

    init() {
        if (!this.isMobile) return;

        console.log("📱 Inicializando gerenciador mobile otimizado...");
        
        // Apenas ajustes iniciais, não adicionar botão de sidebar ainda
        this.adjustUIForMobile();
        
        // Configurar gestos para o mapa (se já existir)
        if (document.getElementById('mapViewport')) {
            this.setupMobileGestures();
        }
        
        // Prevenir zoom com double-tap
        this.preventDoubleTapZoom();
        
        // Configurar event listeners específicos para mobile
        this.setupMobileEventListeners();
        
        // Configurar orientação
        this.setupOrientationHandling();
    }

    setupOrientationHandling() {
        // Debounce para evitar múltiplas execuções
        let orientationTimeout;
        const handleOrientationChange = () => {
            clearTimeout(orientationTimeout);
            orientationTimeout = setTimeout(() => {
                this.handleOrientationChange();
            }, 250);
        };
        
        window.addEventListener('resize', handleOrientationChange);
        window.addEventListener('orientationchange', handleOrientationChange);
        
        // Executar inicialmente
        setTimeout(() => this.handleOrientationChange(), 100);
    }

    handleOrientationChange() {
        if (!this.isMobile) return;
        
        const isPortrait = window.innerHeight > window.innerWidth;
        const body = document.body;
        
        // Remover classes anteriores
        body.classList.remove('mobile-landscape', 'mobile-portrait');
        
        // Adicionar classe apropriada
        if (isPortrait) {
            body.classList.add('mobile-portrait');
            console.log("📱 Modo retrato ativado");
        } else {
            body.classList.add('mobile-landscape');
            console.log("📱 Modo paisagem ativado");
        }
        
        // Ajustar interface específica
        this.adjustUIForMobile();
        
        // Ajustar footer para orientação
        this.adjustFooterForOrientation();
    }

    adjustFooterForOrientation() {
        const footer = document.getElementById('gameFooter');
        if (!footer) return;
        
        const isPortrait = window.innerHeight > window.innerWidth;
        
        if (isPortrait) {
            // Modo retrato: footer mais compacto
            footer.classList.add('mobile-portrait');
            footer.classList.remove('mobile-landscape');
        } else {
            // Modo paisagem: footer pode ser mais largo
            footer.classList.add('mobile-landscape');
            footer.classList.remove('mobile-portrait');
        }
    }

    setupGameInterface() {
        console.log("🎮 Configurando interface mobile para jogo...");
        
        // Agora sim, adicionar botão de toggle para a sidebar
        this.addSidebarToggleButton();
        
        // Reconfigurar gestos para o mapa (agora o mapa deve existir)
        this.setupMobileGestures();
        
        // Configurar footer para mobile
        this.setupMobileFooter();
        
        // Marcar que a tela inicial não está mais visível
        this.initialScreenVisible = false;
    }

    addSidebarToggleButton() {
        // Verificar se o botão já existe
        if (document.getElementById('mobileSidebarToggle')) return;
        
        // Verificar se estamos na tela do jogo
        const gameContainer = document.getElementById('gameContainer');
        if (!gameContainer || gameContainer.classList.contains('hidden')) {
            console.log("⚠️ Não adicionando botão de sidebar - jogo não iniciado");
            return;
        }

        // Criar botão para mostrar/ocultar a sidebar
        const toggleButton = document.createElement('button');
        toggleButton.id = 'mobileSidebarToggle';
        toggleButton.className = 'mobile-sidebar-toggle';
        toggleButton.innerHTML = '📊';
        toggleButton.title = 'Mostrar/ocultar painel lateral';
        toggleButton.setAttribute('aria-label', 'Alternar painel lateral');
        
        // Posicionar no canto superior direito
        toggleButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border: 2px solid rgba(255, 255, 255, 0.3);
            color: white;
            font-size: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
            cursor: pointer;
            transition: all 0.3s ease;
        `;

        // Adicionar ao body
        document.body.appendChild(toggleButton);

        // Adicionar evento de clique
        toggleButton.addEventListener('click', this.toggleSidebar);

        // Fechar a sidebar ao clicar fora
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            if (this.sidebarVisible && 
                sidebar && 
                !sidebar.contains(e.target) && 
                !e.target.closest('#mobileSidebarToggle')) {
                this.hideSidebar();
            }
        });
        
        console.log("✅ Botão de sidebar mobile adicionado");
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        if (this.sidebarVisible) {
            this.hideSidebar();
        } else {
            this.showSidebar();
        }
    }

    showSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;
        
        sidebar.classList.add('active');
        this.sidebarVisible = true;
        
        // Adicionar overlay para fechar ao tocar fora
        this.addSidebarOverlay();
        
        // Atualizar conteúdo da sidebar
        if (this.uiManager.gameManager) {
            this.uiManager.gameManager.renderSidebar();
        }
        
        console.log("📊 Sidebar mobile mostrada");
    }

    hideSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;
        
        sidebar.classList.remove('active');
        this.sidebarVisible = false;
        this.removeSidebarOverlay();
        
        console.log("📊 Sidebar mobile ocultada");
    }

    addSidebarOverlay() {
        // Remover overlay existente
        this.removeSidebarOverlay();
        
        // Criar overlay
        const overlay = document.createElement('div');
        overlay.id = 'mobileSidebarOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(2px);
            z-index: 998;
            animation: fadeIn 0.3s ease;
        `;
        
        // Fechar sidebar ao clicar no overlay
        overlay.addEventListener('click', () => this.hideSidebar());
        
        document.body.appendChild(overlay);
    }

    removeSidebarOverlay() {
        const overlay = document.getElementById('mobileSidebarOverlay');
        if (overlay) {
            overlay.remove();
        }
    }

    setupMobileGestures() {
        const mapViewport = document.getElementById('mapViewport');
        const mapTransform = document.getElementById('mapTransform');

        if (!mapViewport || !mapTransform) {
            console.log("⚠️ Elementos do mapa não encontrados para gestos");
            return;
        }

        console.log("👆 Configurando gestos mobile para o mapa");

        let startX = 0, startY = 0;
        let currentX = 0, currentY = 0;
        let scale = 1;
        let lastTouchDistance = 0;
        let isPinching = false;

        // Configurar eventos de toque
        mapViewport.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                // Dois dedos: iniciar zoom
                isPinching = true;
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                lastTouchDistance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );
            } else if (e.touches.length === 1 && !isPinching) {
                // Um dedo: iniciar pan
                startX = e.touches[0].clientX - currentX;
                startY = e.touches[0].clientY - currentY;
            }
        }, { passive: true });

        mapViewport.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                // Zoom com pinch
                e.preventDefault();
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const touchDistance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );

                if (lastTouchDistance > 0) {
                    const scaleChange = touchDistance / lastTouchDistance;
                    scale = Math.min(Math.max(scale * scaleChange, 0.5), 3);
                    mapTransform.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;
                }

                lastTouchDistance = touchDistance;
            } else if (e.touches.length === 1 && !isPinching) {
                // Pan
                e.preventDefault();
                currentX = e.touches[0].clientX - startX;
                currentY = e.touches[0].clientY - startY;
                mapTransform.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;
            }
        }, { passive: false });

        mapViewport.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) {
                isPinching = false;
                lastTouchDistance = 0;
            }
        }, { passive: true });

        // Adicionar controles de zoom (botões) apenas se não existirem
        if (!document.querySelector('.mobile-zoom-controls')) {
            this.addZoomControls();
        }
    }

    addZoomControls() {
        const controls = document.createElement('div');
        controls.className = 'mobile-zoom-controls';
        controls.innerHTML = `
            <button class="zoom-in" aria-label="Zoom In">➕</button>
            <button class="zoom-out" aria-label="Zoom Out">➖</button>
            <button class="zoom-reset" aria-label="Reset Zoom">🔄</button>
        `;

        const gameMap = document.getElementById('gameMap');
        if (gameMap) {
            gameMap.appendChild(controls);

            // Adicionar eventos
            controls.querySelector('.zoom-in').addEventListener('click', () => {
                this.adjustZoom(1.2);
            });

            controls.querySelector('.zoom-out').addEventListener('click', () => {
                this.adjustZoom(0.8);
            });

            controls.querySelector('.zoom-reset').addEventListener('click', () => {
                this.resetZoom();
            });
        }
    }

    adjustZoom(factor) {
        const mapTransform = document.getElementById('mapTransform');
        if (!mapTransform) return;

        // Obter a escala atual
        const transform = mapTransform.style.transform;
        let scale = 1;
        let translateX = 0, translateY = 0;

        // Extrair valores de translate e scale
        const scaleMatch = transform.match(/scale\(([^)]+)\)/);
        const translateMatch = transform.match(/translate\(([^)]+)\)/);

        if (scaleMatch) scale = parseFloat(scaleMatch[1]);
        if (translateMatch) {
            const [x, y] = translateMatch[1].split(',').map(v => parseFloat(v));
            translateX = x || 0;
            translateY = y || 0;
        }

        // Aplicar novo scale
        scale *= factor;
        scale = Math.min(Math.max(scale, 0.5), 3);

        mapTransform.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }

    resetZoom() {
        const mapTransform = document.getElementById('mapTransform');
        if (mapTransform) {
            mapTransform.style.transform = 'translate(0px, 0px) scale(1)';
        }
    }

    adjustUIForMobile() {
        if (!this.isMobile) return;
        
        console.log("📱 Ajustando UI para mobile...");
        
        // Adicionar classe mobile ao body
        document.body.classList.add('mobile-device');
        
        // Ajustar a tela inicial para mobile
        this.adjustInitialScreenForMobile();
        
        // Ajustar modais
        this.setupModalsForMobile();
    }

    adjustInitialScreenForMobile() {
        const initialScreen = document.getElementById('initialScreen');
        if (!initialScreen) return;
        
        console.log("🎨 Ajustando tela inicial para mobile");
        
        // Adicionar classe específica
        initialScreen.classList.add('mobile-initial-screen');
        
        // Reorganizar layout da tela inicial
        this.rearrangeInitialScreenLayout();
    }

    rearrangeInitialScreenLayout() {
        // 1. Ícones em grid 3 colunas (sempre)
        const iconSelection = document.getElementById('iconSelection');
        if (iconSelection) {
            iconSelection.style.display = 'grid';
            iconSelection.style.gridTemplateColumns = 'repeat(3, 1fr)';
            iconSelection.style.gap = '8px';
            iconSelection.style.margin = '8px 0';
        }
        
        // 2. Botões em linha (3 botões)
        const addPlayerBtn = document.getElementById('addPlayerBtn');
        const cancelEditBtn = document.getElementById('cancelEditBtn');
        const startGameBtn = document.getElementById('startGameBtn');
        
        if (addPlayerBtn && startGameBtn) {
            // Encontrar o container dos botões
            const buttonContainer = addPlayerBtn.parentElement;
            if (buttonContainer) {
                buttonContainer.style.display = 'flex';
                buttonContainer.style.flexDirection = 'row';
                buttonContainer.style.gap = '8px';
                buttonContainer.style.width = '100%';
                buttonContainer.style.marginTop = '8px';
                
                // Ajustar largura dos botões
                addPlayerBtn.style.flex = '1';
                startGameBtn.style.flex = '1';
                
                if (cancelEditBtn) {
                    cancelEditBtn.style.flex = '1';
                }
            }
        }
        
        // 3. Botões de IA em linha
        const aiButtonsContainer = document.getElementById('aiButtonsContainer');
        if (aiButtonsContainer) {
            aiButtonsContainer.style.display = 'flex';
            aiButtonsContainer.style.flexWrap = 'wrap';
            aiButtonsContainer.style.gap = '6px';
            aiButtonsContainer.style.justifyContent = 'center';
        }
    }

    setupMobileFooter() {
        const footer = document.getElementById('gameFooter');
        if (!footer) return;
        
        console.log("👣 Configurando footer mobile");
        
        // Adicionar classe específica
        footer.classList.add('mobile-footer');
        
        // Reorganizar footer para mobile
        this.rearrangeFooterForMobile();
    }

    rearrangeFooterForMobile() {
        const footer = document.getElementById('gameFooter');
        if (!footer) return;
        
        // Encontrar o container de ações
        const actionContainer = footer.querySelector('div:first-child');
        if (!actionContainer) return;
        
        // Reorganizar para scroll horizontal
        actionContainer.style.display = 'flex';
        actionContainer.style.flexDirection = 'row';
        actionContainer.style.overflowX = 'auto';
        actionContainer.style.overflowY = 'hidden';
        actionContainer.style.gap = '8px';
        actionContainer.style.padding = '8px';
        actionContainer.style.scrollbarWidth = 'thin';
        actionContainer.style.scrollbarColor = 'rgba(251, 191, 36, 0.5) rgba(30, 41, 59, 0.3)';
        
        // Garantir que os botões não quebrem linha
        const actionButtons = actionContainer.querySelectorAll('.action-btn');
        actionButtons.forEach(btn => {
            btn.style.flexShrink = '0';
            btn.style.whiteSpace = 'nowrap';
        });
        
        // Ajustar container de ações restantes e botão de término
        const bottomContainer = footer.querySelector('div:last-child');
        if (bottomContainer) {
            bottomContainer.style.display = 'flex';
            bottomContainer.style.justifyContent = 'space-between';
            bottomContainer.style.alignItems = 'center';
            bottomContainer.style.padding = '8px';
            bottomContainer.style.borderTop = '1px solid rgba(255, 255, 255, 0.1)';
        }
        
        // Ajustar botão de término
        const endTurnBtn = document.getElementById('endTurnBtn');
        if (endTurnBtn) {
            endTurnBtn.style.padding = '8px 16px';
            endTurnBtn.style.fontSize = '14px';
            endTurnBtn.style.whiteSpace = 'nowrap';
        }
    }

    setupModalsForMobile() {
        // Fechar modais ao tocar no overlay
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('touchstart', (e) => {
                if (e.target === overlay) {
                    overlay.classList.add('hidden');
                }
            }, { passive: true });
        });
        
        // Ajustar modais para mobile
        document.querySelectorAll('.modal-content-container').forEach(modal => {
            modal.classList.add('mobile-modal');
        });
    }

    preventDoubleTapZoom() {
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
    }

    setupMobileEventListeners() {
        // Redirecionar eventos de hover para clique em mobile
        document.querySelectorAll('.board-cell').forEach(cell => {
            cell.addEventListener('touchstart', (e) => {
                if (e.cancelable) {
                    e.preventDefault();
                }
                // Simular clique após um pequeno delay para evitar conflitos
                setTimeout(() => {
                    cell.click();
                }, 50);
            }, { passive: false });
        });

        // Melhorar a experiência de entrada em formulários
        document.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('focus', () => {
                // Scroll suave para o campo de entrada
                setTimeout(() => {
                    input.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center',
                        inline: 'nearest'
                    });
                }, 300);
            });
        });
        
        // Prevenir bounce/scrolling em modais
        document.querySelectorAll('.modal-content').forEach(modal => {
            modal.addEventListener('touchmove', (e) => {
                if (modal.scrollHeight <= modal.clientHeight) {
                    e.preventDefault();
                }
            }, { passive: false });
        });
    }

    // Método para limpar/remover elementos mobile quando necessário
    cleanup() {
        // Remover botão de sidebar
        const sidebarToggle = document.getElementById('mobileSidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.remove();
        }
        
        // Remover overlay
        this.removeSidebarOverlay();
        
        // Remover controles de zoom
        const zoomControls = document.querySelector('.mobile-zoom-controls');
        if (zoomControls) {
            zoomControls.remove();
        }
        
        // Remover classes mobile
        document.body.classList.remove('mobile-device', 'mobile-landscape', 'mobile-portrait');
        
        console.log("🧹 Mobile Manager limpo");
    }
}