// ui-manager.js - Core da Interface do Usuário (Corrigido)
import {
    gameState,
    getCurrentPlayer
} from '../state/game-state.js';
import { GAME_CONFIG } from '../state/game-config.js';
import { AIManager } from '../ai/ai-manager.js';
import { ModalManager } from '../ui/ui-modals.js';
import { NegotiationUI } from '../ui/ui-negotiation.js';
import { UIPlayersManager } from '../ui/ui-players.js';
import { UIGameManager } from '../ui/ui-game.js';
import { UIMobileManager } from '../ui/ui-mobile.js';
import { DisputeUI } from '../ui/ui-dispute.js';

export class UIManager {
    constructor(gameLogic = null) {
        this.gameLogic = gameLogic;
        this.aiManager = null;
        this.initialized = false;
        
        // Inicializar componentes básicos primeiro
        this.modals = new ModalManager(this);
        this.negotiation = new NegotiationUI(this);
        this.playersManager = new UIPlayersManager(this);
        this.disputeUI = new DisputeUI(this);
        
        // gameManager será inicializado após cache
        this.gameManager = null;
        this.mobileManager = new UIMobileManager(this);
        
        this.preloadCriticalAssets();
        
        // Inicializar após DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initUI());
        } else {
            setTimeout(() => this.initUI(), 100);
        }
    }

    preloadCriticalAssets() {
        // Preload de imagens críticas
        const criticalImages = [
            './assets/images/gaia-inicio.png',
            './assets/images/gaia-mapa.png'
        ];
        
        criticalImages.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }

    initUI() {
        if (this.initialized) return;
        
        this.cacheElements();
        
        // Inicializar gameManager DEPOIS do cache
        this.gameManager = new UIGameManager(this);
        
        // Inicializar componentes na ordem correta
        this.playersManager.init();
        this.gameManager.init();
        this.setupGlobalEventListeners();
        this.mobileManager.init();

        // Garantir que o footer seja atualizado
        setTimeout(() => {
            if (this.gameManager && this.gameManager.footerManager) {
                this.gameManager.footerManager.updateFooter();
            }
        }, 500);
        
        this.initialized = true;
        console.log("✅ UI Manager inicializado completamente");
    }

    cacheElements() {
        console.log("🔄 Cacheando elementos principais...");
        
        // Elementos principais
        this.startGameBtn = document.getElementById('startGameBtn');
        this.initialScreen = document.getElementById('initialScreen');
        this.gameNavbar = document.getElementById('gameNavbar');
        this.gameContainer = document.getElementById('gameContainer');
        this.sidebar = document.getElementById('sidebar');
        this.gameMap = document.getElementById('gameMap');
        this.gameFooter = document.getElementById('gameFooter');
        
        // Verificar elementos críticos
        if (!this.gameMap) {
            console.error("❌ gameMap não encontrado no DOM!");
        }
        
        if (!this.boardContainer) {
            console.warn("⚠️ boardContainer não encontrado inicialmente, será criado por UIGameManager");
        }
        
        console.log("✅ Elementos principais cacheados");
    }

    // ... resto do código permanece igual, apenas ajustando a inicialização
}