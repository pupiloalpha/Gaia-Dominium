// main.js - Ponto de entrada modular do Gaia Dominium

/* Estrutura de módulos javascript
*  1. main.js - Arquivo principal do código javascript
*  2. game-state.js - Estado do jogo
*  3. game-config.js - Constantes e configurações
*  4. ui-manager.js - Renderização da interface (CORE)
*  5. ui-modals.js - Gerenciamento de todos os modais
*  6. ui-negotiation.js - Sistema de negociação
*  7. game-logic.js - Lógica de ações, turnos, eventos
*  8. utils.js - Funções utilitárias
*  9. game-manual.js - Manual do jogo */

// main.js - Arquivo principal e inicialização

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
  getCurrentPlayer,
  initializeGame,
  saveGame,
  loadGame,
  hasSavedGame,
  getSavedGame,
  migrateSaveData
} from './game-state.js';

// ==================== INICIALIZAÇÃO GLOBAL ====================
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
  
  // 2. Inicializar gerenciador de UI (agora inclui modais e negociação)
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
  window.saveGame = saveGame;
  window.loadGame = loadGame;
  
  // 6. Configurar elementos da interface
  setupInitialUI();
  
  // 7. Configurar eventos globais
  setupGlobalEventListeners();
  
  // 8. Configurar sistemas auxiliares
  setupAuxiliarySystems();
  
  // 9. Verificar save após um curto delay
  setTimeout(() => {
    checkForSavedGame();
  }, 1500);
  
  console.log('✅ Gaia Dominium - Inicialização completa!');
});

// ==================== FUNÇÕES DE CONFIGURAÇÃO ====================
function setupInitialUI() {
  if (window.uiManager && window.uiManager.renderIconSelection) {
    window.uiManager.renderIconSelection();
  }
}

function setupGlobalEventListeners() {
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
      
      if (window.gameState.actionsLeft <= 0) {
        window.utils?.showFeedback('Sem ações restantes neste turno.', 'warning');
        return;
      }
      
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
          if (window.uiManager?.modals && typeof window.uiManager.modals.openStructureModal === 'function') {
            window.uiManager.modals.openStructureModal();
          }
          break;
        case 3: // Tecla 4 - Negociar
          if (window.uiManager?.negotiation && typeof window.uiManager.negotiation.openNegotiationModal === 'function') {
            window.uiManager.negotiation.openNegotiationModal();
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
        window.uiManager?.refreshUIAfterStateChange?.();
      }
    }
  });
}

function setupAuxiliarySystems() {
  // Configurar zoom do mapa
  setTimeout(() => {
    Utils.setupMapZoom();
  }, 1000);
}

async function checkForSavedGame() {
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
      
      const migratedData = migrateSaveData(result.data);
      loadGame(migratedData);
      
      // CORREÇÃO: Ocultar tela de cadastro e mostrar interface do jogo
      hideInitialScreenAndShowGameUI();
      
      // Atualizar a UI após carregar
      setTimeout(() => {
        if (window.uiManager) {
          window.uiManager.updateUI();
          window.uiManager.updateFooter();
          
          if (window.uiManager.modals?.showFeedback) {
            window.uiManager.modals.showFeedback('Jogo carregado com sucesso!', 'success');
          }
        }
      }, 300);
    } else if (result.hasSave && !result.load) {
      console.log('🎮 Usuário optou por novo jogo');
      localStorage.removeItem('gaia-dominium-save');
      setTimeout(() => {
        if (window.uiManager?.modals?.showFeedback) {
          window.uiManager.modals.showFeedback('Novo jogo iniciado!', 'info');
        }
      }, 500);
    } else if (!result.hasSave) {
      console.log('🎮 Nenhum jogo salvo encontrado');
    }
  } catch (error) {
    console.error('Erro ao verificar save:', error);
  }
}

function hideInitialScreenAndShowGameUI() {
  const initialScreen = document.getElementById('initialScreen');
  const gameNavbar = document.getElementById('gameNavbar');
  const gameContainer = document.getElementById('gameContainer');
  const sidebar = document.getElementById('sidebar');
  const gameMap = document.getElementById('gameMap');
  const gameFooter = document.getElementById('gameFooter');
  const manualIcon = document.getElementById('manualIcon');
  
  // Ocultar tela de cadastro
  if (initialScreen) {
    initialScreen.style.display = 'none';
  }
  
  // Mostrar interface do jogo
  if (gameNavbar) gameNavbar.classList.remove('hidden');
  if (gameContainer) gameContainer.classList.remove('hidden');
  if (sidebar) sidebar.classList.remove('hidden');
  if (gameMap) gameMap.classList.remove('hidden');
  if (gameFooter) gameFooter.classList.remove('hidden');
  if (manualIcon) manualIcon.classList.add('hidden');
  
  console.log('✅ Interface do jogo carregada após save');
}

window.showGameInterface = () => {
  hideInitialScreenAndShowGameUI();
  if (window.uiManager) {
    window.uiManager.updateUI();
    window.uiManager.updateFooter();
  }
};

// ==================== AUTO-SAVE ====================
// Salvar automaticamente a cada 30 segundos durante o jogo
setInterval(() => {
  if (window.gameState?.gameStarted) {
    saveGame();
  }
}, 30000);
