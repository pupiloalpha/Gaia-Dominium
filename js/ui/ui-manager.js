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

class UIManager {
    constructor() {
    this.modals = new ModalManager(this);
    this.negotiation = new NegotiationUI(this);
    this.playersManager = new UIPlayersManager(this);
    this.gameManager = new UIGameManager(this);
    this.mobileManager = new UIMobileManager(this);
    this.disputeUI = new DisputeUI(this);
    
    this.cacheElements();
    
    // Preload de recursos críticos
    this.preloadCriticalAssets();
    
    // Inicializar após um pequeno delay
    setTimeout(() => {
        this.initUI();
    }, 100);
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
    
    // Preload de vídeo
    const video = document.createElement('video');
    video.preload = 'auto';
    video.src = './assets/videos/gaia-video-inicio.mp4';
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

        // Inicializar mobile por último para que possa sobrescrever/adaptar o que foi criado
        this.mobileManager.init();
    }

    // ==================== INICIALIZAÇÃO DO JOGO ====================

    handleStartGame() {
    if (gameState.players.length < 2) {
        this.modals.showFeedback('São necessários ao menos 2 jogadores.', 'error');
        return;
    }

    // Inicializar sistema de eliminação
  if (!gameState.eliminatedPlayers) {
    gameState.eliminatedPlayers = [];
  }
  
  // Garantir que nenhum jogador comece eliminado
  gameState.players.forEach(player => {
    player.eliminated = false;
    player.eliminatedTurn = null;
  });
        
    console.log('🚀 Iniciando jogo - Escondendo tela inicial...');
    
    // 1. FORÇAR que a tela inicial fique completamente invisível
    if (this.initialScreen) {
        this.initialScreen.classList.add('hidden');
        this.initialScreen.style.display = 'none';
        this.initialScreen.style.visibility = 'hidden';
        this.initialScreen.style.opacity = '0';
        this.initialScreen.style.pointerEvents = 'none';
        this.initialScreen.style.position = 'absolute'; // Remove do fluxo
        this.initialScreen.style.zIndex = '-1000'; // Coloca atrás de tudo
        this.initialScreen.setAttribute('data-game-started', 'true');
    }
    
    // 2. Garantir que elementos do jogo fiquem visíveis
    const gameElements = [
        this.gameNavbar,
        this.gameContainer,
        this.sidebar,
        this.gameMap,
        this.gameFooter
    ];
    
    gameElements.forEach(el => {
        if (el) {
            el.classList.remove('hidden');
            el.style.display = ''; // Reseta para CSS padrão
            el.style.visibility = 'visible';
            el.style.opacity = '1';
            el.style.pointerEvents = 'auto';
        }
    });
    
    // 3. Ocultar ícone manual da barra de navegação
    document.getElementById('manualIcon')?.classList.add('hidden');
    
    // 4. Inicializar jogo com pequeno delay para garantir renderização
    setTimeout(() => {
        window.gameLogic.initializeGame();
        
        // 5. Inicializar sistema de IA
        this.initializeAISystem();
        
        // 6. Adicionar listener para botão de debug da IA
        this.setupAIDebugButton();
        
        this.updateUI();
        
        // 7. Verificação final - garantir que tela inicial não volte
        setTimeout(() => {
            if (this.initialScreen && !this.initialScreen.classList.contains('hidden')) {
                console.warn('⚠️ Tela inicial reapareceu! Forçando ocultação...');
                this.initialScreen.classList.add('hidden');
                this.initialScreen.style.display = 'none';
            }
        }, 1000);
        
        // 8. Registrar evento para monitoramento
        window.addEventListener('resize', () => this.preventInitialScreenReturn());
        
    }, 100);
    
    console.log('✅ Jogo iniciado com sucesso');
}

preventInitialScreenReturn() {
    // Monitora continuamente para prevenir reaparecimento
    if (!gameState.gameStarted) return;
    
    const initialScreen = document.getElementById('initialScreen');
    if (initialScreen && !initialScreen.classList.contains('hidden')) {
        console.warn('🛡️ Prevenindo retorno da tela inicial...');
        initialScreen.classList.add('hidden');
        initialScreen.style.display = 'none';
        initialScreen.style.visibility = 'hidden';
    }
    
    // Garantir que elementos do jogo permaneçam visíveis
    const requiredElements = [
        'gameNavbar', 'gameContainer', 'sidebar', 
        'gameMap', 'gameFooter', 'boardContainer'
    ];
    
    requiredElements.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.classList.contains('hidden')) {
            console.warn(`⚠️ Elemento ${id} está oculto! Reexibindo...`);
            el.classList.remove('hidden');
        }
    });
}


    // ==================== SISTEMA DE IA ====================

initializeAISystem() {
    console.log('🤖 Inicializando sistema de IA...');
    
    // Log de todos os jogadores
    console.log('👥 Lista completa de jogadores:', gameState.players.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        isAI: p.isAI,
        aiDifficulty: p.aiDifficulty
    })));
    
    const aiPlayers = gameState.players
        .map((player, index) => {

            // Ignorar jogadores eliminados
          if (player.eliminated) {
              console.log(`🚫 Ignorando jogador eliminado: ${player.name}`);
               return null;
          }
            console.log(`🔍 Verificando jogador ${index}: ${player.name}`, {
                type: player.type,
                isAI: player.isAI,
                aiDifficulty: player.aiDifficulty
            });
            
            if (player.type === 'ai' || player.isAI === true) {
                return { 
                    index: player.id,
                    difficulty: player.aiDifficulty || 'medium',
                    name: player.name,
                    playerObject: player
                };
            }
            return null;
        })
        .filter(Boolean);
    
    console.log(`🎯 ${aiPlayers.length} jogador(es) IA ativos identificados:`, aiPlayers);
  
  if (aiPlayers.length === 0) {
    console.log('🤖 Nenhum jogador IA ativo encontrado.');
    return;
  }
    
    try {
        const aiInstances = aiPlayers.map(({ index, difficulty }) => {
            console.log(`🤖 Criando IA para jogador ID: ${index} (${difficulty})...`);
            
            // Verificar se o índice é válido
            if (index === undefined || index === null) {
                console.error(`❌ Índice inválido para IA: ${index}`);
                return null;
            }
            
            const ai = AIFactory.createAI(index, difficulty);
            console.log(`✅ IA criada: ${ai.personality.name} (ID: ${ai.playerId}, Dif: ${difficulty})`);
            return ai;
        }).filter(Boolean); // Filtrar nulos
        
        console.log(`✅ ${aiInstances.length} instância(s) de IA criadas`);
        
        // Log detalhado de cada IA
        aiInstances.forEach((ai, idx) => {
            console.log(`   ${idx + 1}. ${ai.personality.name} - Jogador ID: ${ai.playerId}`);
        });
        
        // Registrar IAs no estado do jogo
        setAIPlayers(aiInstances);
        
        // Expor globalmente
        window.aiInstances = aiInstances;
        
        // Adicionar ao gameState para acesso fácil
        gameState.aiInstances = aiInstances;
        
        console.log('🤖 IAs registradas e expostas globalmente');
        
        // Verificar se o primeiro jogador é IA
        const firstPlayer = gameState.players[gameState.currentPlayerIndex];
        const isFirstPlayerAI = firstPlayer && (firstPlayer.type === 'ai' || firstPlayer.isAI);
        
        if (isFirstPlayerAI) {
            console.log(`🤖 Primeiro jogador é IA: ${firstPlayer.name}, iniciando em 3 segundos...`);
            
            setTimeout(() => {
                if (window.gameLogic && window.gameLogic.checkAndExecuteAITurn) {
                    console.log('🤖 Iniciando turno da primeira IA...');
                    window.gameLogic.checkAndExecuteAITurn();
                } else {
                    console.error('❌ gameLogic ou checkAndExecuteAITurn não disponível');
                }
            }, 3000);
        } else {
            console.log(`🤖 Primeiro jogador é humano: ${firstPlayer?.name}`);
        }
        
        this.modals.showFeedback(`Sistema de IA inicializado com ${aiInstances.length} jogador(es)`, 'info');
        
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
