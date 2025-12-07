// main.js - Ponto de entrada modular do Gaia Dominium

/* Estrutura de módulos javascript
*  1. main.js - Arquivo principal do código javascript
*  2. game-state.js - Estado do jogo
*  3. game-config.js - Constantes e configurações
*  4. ui-manager.js - Renderização da interface
*  5. game-logic.js - Lógica de ações, turnos, eventos
*  6. utils.js - Funções utilitárias
*  7. game-manual.js - Manual do jogo
*  8. bridge.js - Ponte de ligação entre os módulos
*  9. compatibility.js - Arquivo que analisa as versões do jogo salvas */


// ==================== IMPORTAÇÕES DE MÓDULOS ====================
import { UIManager } from './ui-manager.js';
import { GameLogic } from './game-logic.js';
import { Utils } from './utils.js';
import { 
  gameState, 
  achievementsState,
  getGameState,
  setGameState,
  addActivityLog,
  incrementAchievement,
  getCurrentPlayer,
  initializeGame,
  getActivityLogHistory,
  setActivityLogHistory
} from './game-state.js';
import { getAllManualContent } from './game-manual.js';

// ==================== INICIALIZAÇÃO GLOBAL ====================
// Expor objetos essenciais globalmente para compatibilidade
window.GaiaDominium = {
  modules: {},
  state: {},
  utils: null,
  ui: null,
  logic: null
};

// Tornar a função loadGame global
window.loadGame = loadGame;

// ==================== FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Gaia Dominium - Inicializando...');
  
  // 1. Inicializar sistema de utilidades
  window.utils = Utils;
  window.GaiaDominium.utils = Utils;
  
  // 2. Inicializar gerenciador de UI
  window.uiManager = new UIManager();
  window.GaiaDominium.ui = window.uiManager;
  
  // 3. Inicializar lógica do jogo
  window.gameLogic = new GameLogic();
  window.GaiaDominium.logic = window.gameLogic;
  
  // Expor método advancePhase globalmente
  window.advancePhase = () => window.gameLogic.advancePhase();

  // 4. Expor estado do jogo globalmente
  window.gameState = gameState;
  window.GaiaDominium.state.game = gameState;
  window.GaiaDominium.state.achievements = achievementsState;
  
  // 5. Expor funções de estado úteis
  window.getGameState = getGameState;
  window.setGameState = setGameState;
  window.addActivityLog = addActivityLog;
  window.getCurrentPlayer = getCurrentPlayer;
  window.initializeGame = initializeGame;
  
  // 6. Configurar elementos da interface
  setupInitialUI();
  
  // 7. Configurar eventos globais
  setupGlobalEventListeners();
  
  // 8. Configurar sistemas auxiliares (INCLUINDO VERIFICAÇÃO DE SAVE)
  setupAuxiliarySystems();
  
  // 9. Verificar save após um curto delay
  setTimeout(() => {
    checkForSavedGame();
  }, 1500);
  
  console.log('✅ Gaia Dominium - Inicialização completa!');
});

// ==================== FUNÇÕES DE CONFIGURAÇÃO ====================
function setupInitialUI() {
  // Renderizar seleção de ícones e manual
  if (window.uiManager) {
    window.uiManager.renderIconSelection();
    window.uiManager.renderManualFromText();
  }
  
  // Ativar primeira aba do manual por padrão
  setTimeout(() => {
    const firstTab = document.querySelector('.manual-tab');
    if (firstTab) {
      firstTab.classList.add('active');
      const firstTabId = firstTab.dataset.tab;
      const firstContent = document.getElementById(firstTabId);
      if (firstContent) {
        firstContent.classList.remove('hidden');
      }
    }
  }, 100);
}

function setupGlobalEventListeners() {
  // Configurar tabs do manual
  setupManualTabs();
  
  // Configurar botão de vitória
  const victoryCloseBtn = document.getElementById('victoryModalClose');
  if (victoryCloseBtn) {
    victoryCloseBtn.addEventListener('click', () => {
      const modal = document.getElementById('victoryModal');
      if (modal) modal.classList.add('hidden');
    });
  }
  
  // Configurar botão de evento
  const eventOkBtn = document.getElementById('eventOkBtn');
  if (eventOkBtn) {
    eventOkBtn.addEventListener('click', () => {
      const modal = document.getElementById('eventModal');
      if (modal) modal.classList.add('hidden');
    });
  }
  
  // Configurar teclas de atalho
  document.addEventListener('keydown', (e) => {
    // Fechar modais com ESC
    if (e.key === 'Escape') {
      const activeModals = document.querySelectorAll('.modal:not(.hidden)');
      activeModals.forEach(modal => {
        if (modal.id !== 'initialScreen') {
          modal.classList.add('hidden');
        }
      });
    }
    
   // Atalhos numéricos para ações (1-5)
if (e.key >= '1' && e.key <= '5' && window.gameState?.gameStarted) {
  const index = parseInt(e.key) - 1;
  
  // Verificar se temos ações disponíveis
  if (window.gameState.actionsLeft <= 0) {
    window.utils?.showFeedback('Sem ações restantes neste turno.', 'warning');
    return;
  }
  
  // Mapear teclas para ações
  switch(index) {
    case 0: // Tecla 1 - Explorar
      if (window.gameLogic && typeof window.gameLogic.handleExplore === 'function') {
        window.gameLogic.handleExplore();
      }
      break;
    case 1: // Tecla 2 - Recolher
      if (window.gameLogic && typeof window.gameLogic.handleCollect === 'function') {
        window.gameLogic.handleCollect();
      }
      break;
    case 2: // Tecla 3 - Construir
      if (window.uiManager && typeof window.uiManager.openStructureModal === 'function') {
        window.uiManager.openStructureModal();
      }
      break;
    case 3: // Tecla 4 - Negociar
      if (window.gameLogic && typeof window.gameLogic.handleNegotiate === 'function') {
        window.gameLogic.handleNegotiate();
      }
      break;
    case 4: // Tecla 5 - Terminar Turno
      if (window.gameLogic && typeof window.gameLogic.handleEndTurn === 'function') {
        window.gameLogic.handleEndTurn();
      }
      break;
  }
}

  // Tecla 'P' para avançar fase (debug/desenvolvimento)
if (e.key === 'p' || e.key === 'P') {
  e.preventDefault();
  if (window.gameState?.gameStarted && window.gameLogic?.advancePhase) {
    const newPhase = window.gameLogic.advancePhase();
    window.utils?.showFeedback(`Fase avançada para: ${newPhase}`, 'info');
    window.uiManager?.refreshUIAfterStateChange();
  }
}
  });
}

function setupAuxiliarySystems() {
  // Tentar entrar em tela cheia
  setTimeout(() => {
    Utils.tryRequestFullscreenOnce();
  }, 500);
  
  // Configurar zoom do mapa
  setTimeout(() => {
    Utils.setupMapZoom();
  }, 1000);
  
  // Verificar se há estado salvo (com delay maior)
  setTimeout(() => {
    checkForSavedGame();
  }, 2000); // Aumentado para 2 segundos
}

async function checkForSavedGame() {
  // Esperar mais tempo para garantir que tudo está carregado
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  if (!window.utils || !window.utils.checkAndOfferLoad) {
    console.warn('Utils não disponível ainda, tentando novamente...');
    setTimeout(checkForSavedGame, 500);
    return;
  }
  
  try {
    const result = await window.utils.checkAndOfferLoad();
    
    if (result.hasSave && result.load && result.data) {
      console.log('🎮 Carregando jogo salvo...');
      loadGame(result.data);
    } else if (result.hasSave && !result.load) {
      console.log('🎮 Usuário optou por novo jogo');
      // Limpar save se optou por novo jogo
      localStorage.removeItem('gaia-dominium-save');
      setTimeout(() => {
        window.uiManager?.showFeedback('Novo jogo iniciado!', 'info');
      }, 500);
    } else if (!result.hasSave) {
      console.log('🎮 Nenhum jogo salvo encontrado');
    }
  } catch (error) {
    console.error('Erro ao verificar save:', error);
  }
}

// ==================== CARREGAR JOGO SALVO ====================
function loadGame(data) {
  try {
    // Atualizar estado do jogo
    setGameState(data.gameState);
    
    // Atualizar conquistas
    if (data.achievementsState) {
      import('./game-state.js').then(module => {
        if (module.setAchievementsState) {
          module.setAchievementsState(data.achievementsState);
        }
      }).catch(err => {
        console.error('Erro ao importar módulo:', err);
      });
    }
    
    // Atualizar logs de atividade
    if (data.activityLogHistory) {
      import('./game-state.js').then(module => {
        if (module.setActivityLogHistory) {
          module.setActivityLogHistory(data.activityLogHistory);
        } else {
          console.warn('setActivityLogHistory não disponível no módulo');
        }
      }).catch(err => {
        console.error('Erro ao importar módulo para logs:', err);
      });
    }
    
    // Atualizar a tela inicial
    if (window.uiManager) {
      // Forçar atualização da tela inicial
      window.uiManager.refreshInitialScreen();
      
      // Se o jogo já estava em andamento, esconder tela inicial e mostrar jogo
      if (data.gameState.gameStarted) {
        document.getElementById('initialScreen').style.display = 'none';
        document.getElementById('gameNavbar').classList.remove('hidden');
        document.getElementById('gameContainer').classList.remove('hidden');
        document.getElementById('sidebar').classList.remove('hidden');
        document.getElementById('gameMap').classList.remove('hidden');
        document.getElementById('gameFooter').classList.remove('hidden');
        document.getElementById('manualIcon')?.classList.add('hidden');
        
        // Restaurar o estado correto da fase
        if (data.gameState.currentPhase) {
          window.gameState.currentPhase = data.gameState.currentPhase;
          
          // Se estiver na fase de negociação, configurar botões apropriadamente
          if (data.gameState.currentPhase === 'negociacao') {
            setTimeout(() => {
              if (window.gameLogic && window.gameLogic.setupNegotiationPhase) {
                window.gameLogic.setupNegotiationPhase();
              }
            }, 100);
          }
          // Se estiver na fase de renda, aplicar renda
          else if (data.gameState.currentPhase === 'renda') {
            setTimeout(() => {
              if (window.gameLogic) {
                window.gameLogic.applyIncomeForCurrentPlayer();
              }
            }, 100);
          }
        }
        
        // Atualizar UI completa do jogo
        setTimeout(() => {
          if (window.uiManager) {
            window.uiManager.updateUI();
            window.uiManager.updateFooter();
            window.uiManager.renderBoard();
            window.uiManager.renderHeaderPlayers();
            window.uiManager.renderSidebar(gameState.selectedPlayerForSidebar);
            
            // Renderizar logs carregados
            window.uiManager.renderActivityLog('all');
          }
        }, 150);
      }
      
      window.uiManager.showFeedback('Jogo carregado com sucesso!', 'success');
    }
    
    console.log('🎮 Jogo carregado:', data);
  } catch (error) {
    console.error('Erro ao carregar jogo:', error);
    window.uiManager?.showFeedback('Erro ao carregar jogo salvo', 'error');
  }
}

// ==================== FUNÇÕES DE CONFIGURAÇÃO DE UI ====================
function setupManualTabs() {
  const manualTabs = document.querySelectorAll('.manual-tab');
  const manualContents = document.querySelectorAll('.manual-content');
  
  if (!manualTabs.length) return;
  
  manualTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      // Remove classe active de todas as tabs
      manualTabs.forEach(t => t.classList.remove('active'));
      manualContents.forEach(c => c.classList.add('hidden'));
      
      // Adiciona ao tab clicado
      e.currentTarget.classList.add('active');
      
      // Mostra conteúdo correspondente
      const tabId = e.currentTarget.dataset.tab;
      const contentEl = document.getElementById(tabId);
      if (contentEl) {
        contentEl.classList.remove('hidden');
      }
    });
  });
  
  // Ativar primeiro tab por padrão
  if (manualTabs[0]) {
    manualTabs[0].classList.add('active');
    const firstTabId = manualTabs[0].dataset.tab;
    const firstContent = document.getElementById(firstTabId);
    if (firstContent) {
      firstContent.classList.remove('hidden');
    }
  }
}


// ==================== FUNÇÕES DE SALVAMENTO ====================
function saveGame() {
  try {
    // Importar dinamicamente para garantir acesso às funções
    import('./game-state.js').then(module => {
      const saveData = {
        gameState: getGameState(),
        achievementsState: { ...window.GaiaDominium.state.achievements },
        activityLogHistory: module.getActivityLogHistory ? module.getActivityLogHistory() : [],
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
      
      localStorage.setItem('gaia-dominium-save', JSON.stringify(saveData));
      console.log('💾 Jogo salvo:', saveData);
    }).catch(error => {
      console.error('Erro ao importar módulo para salvar:', error);
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar jogo:', error);
    return false;
  }
}

// ==================== EXPORTAÇÕES (para testes) ====================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    setupInitialUI,
    setupGlobalEventListeners,
    setupAuxiliarySystems,
    setupManualTabs,
    setupAchievementsModal,
    saveGame,
    loadGame
  };
}

// ==================== AUTO-SAVE ====================
// Salvar automaticamente a cada 30 segundos durante o jogo
setInterval(() => {
  if (window.gameState?.gameStarted) {
    saveGame();
  }
}, 30000);