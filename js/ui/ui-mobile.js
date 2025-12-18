// ui-mobile.js - Gerenciador de Interface Mobile
export class MobileManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.isMobile = this.detectMobile();
        this.sidebarVisible = false;
        
        // Bind methods
        this.toggleSidebar = this.toggleSidebar.bind(this);
        this.setupMobileGestures = this.setupMobileGestures.bind(this);
        this.addSidebarToggleButton = this.addSidebarToggleButton.bind(this);
    }

    detectMobile() {
        return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    init() {
        if (!this.isMobile) return;

        console.log("📱 Inicializando gerenciador mobile...");

        // Adicionar botão de toggle para a sidebar
        this.addSidebarToggleButton();

        // Configurar gestos para o mapa
        this.setupMobileGestures();

        // Ajustar a interface para mobile
        this.adjustUIForMobile();

        // Prevenir zoom com double-tap
        this.preventDoubleTapZoom();

        // Configurar event listeners específicos para mobile
        this.setupMobileEventListeners();
    }

    addSidebarToggleButton() {
        // Criar botão para mostrar/ocultar a sidebar
        const toggleButton = document.createElement('button');
        toggleButton.id = 'mobileSidebarToggle';
        toggleButton.className = 'sidebar-toggle';
        toggleButton.innerHTML = '📊';
        toggleButton.title = 'Mostrar/ocultar painel lateral';
        toggleButton.setAttribute('aria-label', 'Alternar painel lateral');

        // Adicionar ao body
        document.body.appendChild(toggleButton);

        // Adicionar evento de clique
        toggleButton.addEventListener('click', this.toggleSidebar);

        // Fechar a sidebar ao clicar fora
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            if (this.sidebarVisible && 
                !sidebar.contains(e.target) && 
                !e.target.closest('#mobileSidebarToggle')) {
                this.hideSidebar();
            }
        });
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
        sidebar.classList.add('active');
        this.sidebarVisible = true;
        
        // Atualizar conteúdo da sidebar
        if (this.uiManager.gameManager) {
            this.uiManager.gameManager.renderSidebar();
        }
    }

    hideSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('active');
        this.sidebarVisible = false;
    }

    setupMobileGestures() {
        const mapViewport = document.getElementById('mapViewport');
        const mapTransform = document.getElementById('mapTransform');

        if (!mapViewport || !mapTransform) return;

        let startX = 0, startY = 0;
        let currentX = 0, currentY = 0;
        let scale = 1;
        let lastTouchDistance = 0;

        // Configurar eventos de toque
        mapViewport.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                // Dois dedos: iniciar zoom
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                lastTouchDistance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );
            } else if (e.touches.length === 1) {
                // Um dedo: iniciar pan
                startX = e.touches[0].clientX - currentX;
                startY = e.touches[0].clientY - currentY;
            }
        });

        mapViewport.addEventListener('touchmove', (e) => {
            e.preventDefault();

            if (e.touches.length === 2) {
                // Zoom com pinch
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
            } else if (e.touches.length === 1) {
                // Pan
                currentX = e.touches[0].clientX - startX;
                currentY = e.touches[0].clientY - startY;
                mapTransform.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;
            }
        });

        mapViewport.addEventListener('touchend', () => {
            lastTouchDistance = 0;
        });

        // Adicionar controles de zoom (botões)
        this.addZoomControls();
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
        // Ajustes específicos da interface para mobile
        const initialScreen = document.getElementById('initialScreen');
        if (initialScreen) {
            initialScreen.classList.add('mobile');
        }

        // Ajustar o footer para mobile
        const gameFooter = document.getElementById('gameFooter');
        if (gameFooter) {
            gameFooter.classList.add('mobile');
        }

        // Ajustar modais
        this.setupModalsForMobile();
    }

    setupModalsForMobile() {
        // Fechar modais ao tocar no overlay (exceto se tocar no conteúdo)
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('touchstart', (e) => {
                if (e.target === overlay) {
                    overlay.classList.add('hidden');
                }
            });
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
                e.preventDefault();
                cell.click();
            });
        });

        // Melhorar a experiência de entrada em formulários
        document.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('focus', () => {
                // Scroll suave para o campo de entrada
                setTimeout(() => {
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
        });
    }

    // Método para atualizar a interface quando a orientação muda
    handleOrientationChange() {
        if (this.isMobile) {
            console.log("Orientação alterada, ajustando interface...");
            
            // Recálculos de layout podem ser feitos aqui
            if (window.innerWidth > window.innerHeight) {
                // Modo paisagem
                document.body.classList.add('landscape');
                document.body.classList.remove('portrait');
            } else {
                // Modo retrato
                document.body.classList.add('portrait');
                document.body.classList.remove('landscape');
            }
            
            // Reaplicar estilos se necessário
            this.adjustUIForMobile();
        }
    }
}