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
  initializeGame
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
  
  // 8. Configurar sistemas auxiliares
  setupAuxiliarySystems();
  
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
      const actions = [
        window.gameLogic?.handleExplore,
        window.gameLogic?.handleCollect,
        () => window.uiManager?.openStructureModal(),
        window.gameLogic?.handleNegotiate,
        window.gameLogic?.handleEndTurn
      ];
      
      const index = parseInt(e.key) - 1;
      if (actions[index] && window.gameState.actionsLeft > 0) {
        actions[index]();
      }
    }

  // Tecla 'p' para avançar fase (debug/desenvolvimento)
  if (e.key === 'p' && window.gameState?.gameStarted) {
    if (window.gameLogic?.advancePhase) {
      const newPhase = window.gameLogic.advancePhase();
      window.uiManager?.showFeedback(`Fase avançada: ${newPhase}`, 'info');
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
  
  // Verificar se há estado salvo
  checkForSavedGame();
}

async function checkForSavedGame() {
  // Esperar um pouco para garantir que a UI está carregada
  await new Promise(resolve => setTimeout(resolve, 800));
  
  if (!window.utils) {
    console.warn('Utils não disponível ainda');
    return;
  }
  
  const result = await window.utils.checkAndOfferLoad();
  
  if (result.hasSave && result.load && result.data) {
    console.log('🎮 Carregando jogo salvo...');
    loadGame(result.data);
  } else if (result.hasSave && !result.load) {
    console.log('🎮 Usuário optou por novo jogo');
    // Mostrar feedback apenas se houve save
    setTimeout(() => {
      window.uiManager?.showFeedback('Novo jogo iniciado!', 'info');
    }, 500);
  }
}

function loadGame(data) {
  try {
    // Atualizar estado do jogo
    setGameState(data.gameState);
    
    // Atualizar conquistas
    if (data.achievementsState) {
      // Buscar a função setAchievementsState do módulo
      import('./game-state.js').then(module => {
        if (module.setAchievementsState) {
          module.setAchievementsState(data.achievementsState);
        }
      }).catch(err => {
        console.error('Erro ao importar módulo:', err);
      });
    }
    
    // ATUALIZAÇÃO CRÍTICA: Atualizar a tela inicial
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
        
        // Atualizar UI completa do jogo
        window.uiManager.updateUI();
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
    const saveData = {
      gameState: getGameState(),
      achievementsState: window.GaiaDominium.state.achievements,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    
    localStorage.setItem('gaia-dominium-save', JSON.stringify(saveData));
    console.log('💾 Jogo salvo:', saveData);
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