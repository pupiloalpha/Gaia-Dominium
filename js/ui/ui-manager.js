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

class UIManager {
    constructor() {
        this.modals = new ModalManager(this);
        this.negotiation = new NegotiationUI(this);
        this.playersManager = new UIPlayersManager(this);
        this.gameManager = new UIGameManager(this);
        
        this.cacheElements();
        
        // Inicializar após um pequeno delay
        setTimeout(() => {
            this.initUI();
        }, 100);
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
        
        console.log("✅ Elementos principais cacheados");
    }

    initUI() {
        this.playersManager.init();
        this.gameManager.init();
        this.setupGlobalEventListeners();
    }

    // ==================== INICIALIZAÇÃO DO JOGO ====================

    handleStartGame() {
        if (gameState.players.length < 2) {
            this.modals.showFeedback('São necessários ao menos 2 jogadores.', 'error');
            return;
        }
        
        // Ocultar tela de cadastro e mostrar interface do jogo
        this.initialScreen.style.display = 'none';
        this.gameNavbar.classList.remove('hidden');
        this.gameContainer.classList.remove('hidden');
        this.sidebar.classList.remove('hidden');
        this.gameMap.classList.remove('hidden');
        this.gameFooter.classList.remove('hidden');
        
        document.getElementById('manualIcon')?.classList.add('hidden');
        
        window.gameLogic.initializeGame();

        // Inicializar sistema de IA
        this.initializeAISystem();

        // Adicionar listener para botão de debug da IA
        this.setupAIDebugButton();

        this.updateUI();
    }

    // ==================== SISTEMA DE IA ====================

    initializeAISystem() {
        console.log('🤖 Inicializando sistema de IA...');
        
        // Identificar jogadores IA
        const aiPlayers = gameState.players
            .map((player, index) => {
                if (player.type === 'ai') {
                    return { 
                        index, 
                        difficulty: player.aiDifficulty || 'medium',
                        name: player.name
                    };
                }
                return null;
            })
            .filter(Boolean);
        
        if (aiPlayers.length === 0) {
            console.log('🤖 Nenhum jogador IA encontrado');
            return;
        }
        
        console.log(`🤖 Encontrados ${aiPlayers.length} jogadores IA:`, aiPlayers);
        
        try {
            // Criar instâncias de IA
            const aiInstances = aiPlayers.map(({ index, difficulty }) => {
                const ai = AIFactory.createAI(index, difficulty);
                console.log(`🤖 IA criada para jogador ${index} (${difficulty}): ${ai.personality.name}`);
                return ai;
            });
            
            // Registrar IAs no estado do jogo
            setAIPlayers(aiInstances);
            
            // Adicionar evento de debug
            window.aiDebugUpdate = () => this.updateAIDebugPanel();
            
            // Se o primeiro jogador for IA, iniciar turno após delay
            if (aiPlayers.some(p => p.index === gameState.currentPlayerIndex)) {
                console.log('🤖 Primeiro jogador é IA, aguardando início...');
                
                // Pequeno delay para UI carregar
                setTimeout(() => {
                    if (window.gameLogic && window.gameLogic.checkAndExecuteAITurn) {
                        console.log('🤖 Iniciando turno da IA...');
                        window.gameLogic.checkAndExecuteAITurn();
                    }
                }, 2000);
            }
            
            this.modals.showFeedback(`Sistema de IA inicializado com ${aiInstances.length} jogadores`, 'info');
            
        } catch (error) {
            console.error('🤖 Erro ao inicializar IA:', error);
            this.modals.showFeedback('Erro ao inicializar sistema de IA', 'error');
        }
    }

    setupAIDebugButton() {
        // Criar botão de debug da IA (apenas em desenvolvimento)
        const debugBtn = document.createElement('button');
        debugBtn.id = 'toggleAIDebug';
        debugBtn.className = 'fixed bottom-4 right-4 z-40 p-2 bg-purple-600 rounded-full text-white shadow-lg hover:bg-purple-700 transition';
        debugBtn.textContent = '🤖';
        debugBtn.title = 'Debug IA (Ctrl+Shift+I)';
        debugBtn.addEventListener('click', () => {
            const panel = document.getElementById('aiDebugPanel');
            if (panel) {
                panel.classList.toggle('hidden');
                if (!panel.classList.contains('hidden')) {
                    this.updateAIDebugPanel();
                }
            }
        });
        
        document.body.appendChild(debugBtn);
    }

    updateAIDebugPanel() {
        const debugContent = document.getElementById('aiDebugContent');
        if (!debugContent) return;
        
        let html = '';
        
        // Cabeçalho
        const aiPlayers = gameState.players.filter(p => p.type === 'ai' || p.isAI);
        const currentPlayer = getCurrentPlayer();
        const isAITurn = currentPlayer && (currentPlayer.type === 'ai' || currentPlayer.isAI);
        
        html += `<div class="mb-4">
            <div class="flex justify-between items-center mb-2">
                <div class="text-sm font-bold text-purple-300">🤖 Monitor de IA</div>
                <div class="text-xs text-gray-400">${new Date().toLocaleTimeString()}</div>
            </div>
            <div class="text-xs text-gray-300 mb-3">
                Jogadores IA: ${aiPlayers.length} | Turno: ${gameState.turn} | Fase: ${gameState.currentPhase}
                ${isAITurn ? ` | <span class="text-yellow-300">🎮 Turno da IA</span>` : ''}
            </div>
        </div>`;
        
        // Controles de debug
        html += `<div class="mb-4 p-2 bg-gray-800/50 rounded">
            <div class="text-xs font-semibold text-gray-300 mb-2">Controles</div>
            <div class="flex flex-wrap gap-2">
                <button onclick="window.gameLogic?.checkAndExecuteAITurn?.()" 
                        class="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded">
                    Executar IA
                </button>
                <button onclick="window.gameLogic?.completeAITurn?.()" 
                        class="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 rounded">
                    Forçar Término
                </button>
                <button onclick="window.gameLogic?.handleEndTurn?.()" 
                        class="px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 rounded">
                    Passar Turno
                </button>
                <button onclick="document.getElementById('aiDebugPanel').classList.add('hidden')" 
                        class="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 rounded">
                    Fechar
                </button>
            </div>
        </div>`;
        
        // Status de cada IA
        aiPlayers.forEach((player, idx) => {
            const ai = getAIPlayer(player.id);
            if (ai) {
                const debugInfo = ai.getDebugInfo?.() || {};
                const isCurrent = gameState.currentPlayerIndex === player.id;
                const statusColor = isCurrent ? 'text-yellow-300' : 'text-gray-300';
                const bgColor = isCurrent ? 'bg-purple-900/40' : 'bg-gray-800/30';
                
                html += `<div class="mb-3 p-3 rounded-lg border ${isCurrent ? 'border-purple-500/50' : 'border-gray-700/50'} ${bgColor}">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="text-lg">${player.icon}</span>
                                <span class="text-sm font-bold ${statusColor}">
                                    ${player.name} ${isCurrent ? '🎮' : ''}
                                </span>
                            </div>
                            <div class="text-xs text-gray-400 mt-1">
                                ${ai.personality?.name || 'Sem personalidade'} • ${ai.difficulty || 'N/A'}
                            </div>
                        </div>
                        <div class="flex flex-col items-end">
                            <span class="text-xs px-2 py-1 rounded ${this.getAIDifficultyClass(player.aiDifficulty)}">
                                ${player.aiDifficulty || 'medium'}
                            </span>
                            <span class="text-xs text-gray-400 mt-1">${player.victoryPoints} PV</span>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <div class="text-gray-500">Fase:</div>
                            <div class="text-gray-300 font-medium">${debugInfo.phase || 'idle'}</div>
                        </div>
                        <div>
                            <div class="text-gray-500">Regiões:</div>
                            <div class="text-gray-300 font-medium">${player.regions.length}</div>
                        </div>
                        <div>
                            <div class="text-gray-500">Ações Memória:</div>
                            <div class="text-gray-300 font-medium">${debugInfo.memory?.lastActions || 0}</div>
                        </div>
                        <div>
                            <div class="text-gray-500">Negociações:</div>
                            <div class="text-gray-300 font-medium">${debugInfo.memory?.negotiationHistory?.length || 0}</div>
                        </div>
                    </div>
                    
                    ${debugInfo.currentPlan ? `
                    <div class="mt-2 pt-2 border-t border-gray-700/50">
                        <div class="text-xs text-gray-500 mb-1">Plano Atual:</div>
                        <div class="text-xs text-gray-300">
                            ${debugInfo.currentPlan.actions?.length || 0} ações planejadas
                        </div>
                        <div class="text-xs text-gray-400 mt-1">
                            ${debugInfo.currentPlan.turnGoals?.join(', ') || 'Sem metas'}
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="mt-2 pt-2 border-t border-gray-700/50">
                        <div class="text-xs text-gray-500">Recursos:</div>
                        <div class="flex flex-wrap gap-1 mt-1">
                            ${Object.entries(player.resources || {}).map(([res, val]) => `
                                <span class="text-xs px-1.5 py-0.5 rounded bg-gray-700/50">
                                    ${val}${RESOURCE_ICONS[res] || '📦'}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                </div>`;
            }
        });
        
        // Status do jogo
        html += `<div class="mt-4 pt-3 border-t border-white/10">
            <div class="text-xs font-bold text-gray-300 mb-2">📊 Status do Jogo</div>
            <div class="grid grid-cols-2 gap-3 text-xs">
                <div class="p-2 bg-gray-800/30 rounded">
                    <div class="text-gray-500">Fase Atual</div>
                    <div class="text-lg font-bold text-yellow-300">${gameState.currentPhase}</div>
                </div>
                <div class="p-2 bg-gray-800/30 rounded">
                    <div class="text-gray-500">Ações Restantes</div>
                    <div class="text-lg font-bold ${gameState.actionsLeft > 0 ? 'text-green-300' : 'text-red-300'}">
                        ${gameState.actionsLeft}
                    </div>
                </div>
                <div class="p-2 bg-gray-800/30 rounded">
                    <div class="text-gray-500">Turno</div>
                    <div class="text-lg font-bold text-white">${gameState.turn}</div>
                </div>
                <div class="p-2 bg-gray-800/30 rounded">
                    <div class="text-gray-500">Próximo Jogador</div>
                    <div class="text-lg font-bold text-blue-300">
                        ${gameState.players[(gameState.currentPlayerIndex + 1) % gameState.players.length]?.name || '—'}
                    </div>
                </div>
            </div>
            
            <div class="mt-3 p-2 bg-gray-800/20 rounded text-xs">
                <div class="text-gray-400 mb-1">Evento Atual:</div>
                <div class="text-gray-300">
                    ${gameState.currentEvent ? 
                    `${gameState.currentEvent.name} (${gameState.eventTurnsLeft} turnos)` : 
                    'Nenhum evento ativo'}
                </div>
            </div>
        </div>`;
        
        debugContent.innerHTML = html;
        
        // Auto-refresh do painel
        setTimeout(() => {
            if (!document.getElementById('aiDebugPanel')?.classList.contains('hidden')) {
                this.updateAIDebugPanel();
            }
        }, 2000);
    }

    getAIDifficultyClass(difficulty) {
        const classes = {
            easy: 'ai-easy',
            medium: 'ai-medium', 
            hard: 'ai-hard',
            master: 'ai-master'
        };
        return classes[difficulty] || 'ai-medium';
    }

    // ==================== MÉTODOS PRINCIPAIS ====================

    updateUI() {
        this.gameManager.updateUI();
    }

    setModalMode(enabled) {
        if (enabled) {
            document.body.classList.add('modal-active');
            if (this.gameManager.boardContainer) {
                this.gameManager.boardContainer.style.pointerEvents = 'none';
            }
        } else {
            document.body.classList.remove('modal-active');
            if (this.gameManager.boardContainer) {
                this.gameManager.boardContainer.style.pointerEvents = 'auto';
            }
            // Pequeno delay para garantir que a UI seja atualizada
    setTimeout(() => {
      if (this.gameManager && this.gameManager.updateFooter) {
        this.gameManager.updateFooter();
      }
    }, 50);
        }
    }

    // ==================== EVENT LISTENERS GLOBAIS ====================

    setupGlobalEventListeners() {
        // Botão iniciar jogo
        this.startGameBtn?.addEventListener('click', () => this.handleStartGame());
    }

    // ==================== UTILITÁRIOS ====================

    initializeSafely() {
        try {
            // Verificar se achievementsState existe
            if (typeof achievementsState === 'undefined') {
                console.warn('achievementsState não definida, inicializando...');
                // Podemos tentar carregar do localStorage ou usar fallback
                if (window.getAchievementsState) {
                    const state = window.getAchievementsState();
                    if (state) {
                        window.achievementsState = state;
                    }
                }
            }
            
            // Verificar se ACHIEVEMENTS_CONFIG existe
            if (typeof ACHIEVEMENTS_CONFIG === 'undefined') {
                console.error('ACHIEVEMENTS_CONFIG não está disponível');
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Erro na inicialização segura:', error);
            return false;
        }
    }
}

export { UIManager };
