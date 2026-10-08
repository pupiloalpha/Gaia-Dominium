// ui-manager.js - Core da Interface do Usuário (Coordenador)
import {
    gameState,
    achievementsState,
    getCurrentPlayer,
    activityLogHistory,
    setAIPlayers,
    getAIPlayer,
    isPlayerAI,
    aiInstances,
    getPendingNegotiationsForPlayer
} from '../state/game-state.js';
import { GAME_CONFIG, RESOURCE_ICONS, ACHIEVEMENTS_CONFIG, FACTION_ABILITIES } from '../state/game-config.js';
import { AIFactory, AI_DIFFICULTY_SETTINGS } from '../ai/ai-system.js';
import { ModalManager } from '../ui/ui-modals.js';
import { NegotiationUI } from '../ui/ui-negotiation.js';
import { UIPlayersManager } from '../ui/ui-players.js';
import { UIGameManager } from '../ui/ui-game.js';
import { UIMobileManager } from '../ui/ui-mobile.js';
import { DisputeUI } from '../ui/ui-dispute.js';
import { AIBlockingManager } from './ui-ai-blocking.js';

class UIManager {
    constructor() {
        this.modals = new ModalManager(this);
        this.negotiation = new NegotiationUI(this);
        this.playersManager = new UIPlayersManager(this);
        this.gameManager = new UIGameManager(this);
        this.mobileManager = new UIMobileManager(this);
        this.disputeUI = new DisputeUI(this);
        this.aiBlockingManager = new AIBlockingManager(this);
        window.aiBlockingManager = this.aiBlockingManager;
        
        this.cacheElements();
        
        // Preload de recursos críticos
        this.preloadCriticalAssets();
        
        // Inicializar após um pequeno delay
        setTimeout(() => {
            this.initUI();
        }, 100);
    }
