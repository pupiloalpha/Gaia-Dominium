// bridge.js - Conecta todos os módulos
import { 
  gameState, 
  achievementsState,
  getGameState,
  setGameState,
  addActivityLog,
  // ... todas as outras exportações do game-state.js
} from './game-state.js';

import { GameLogic } from './game-logic.js';
import { UIManager } from './ui-manager.js';
import { Utils } from './utils.js';

// Exportar tudo para acesso global
export {
  gameState,
  achievementsState,
  getGameState,
  setGameState,
  addActivityLog,
  GameLogic,
  UIManager,
  Utils
};

// Expor no objeto global para compatibilidade
window.GaiaDominium = {
  gameState,
  achievementsState,
  utils: Utils,
  gameLogic: null,
  uiManager: null
};
