// main.js - Arquivo principal (módulo carregador)
import { UIManager } from './ui-manager.js';
import { GameLogic } from './game-logic.js';
import { Utils } from './utils.js';

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  // Expor utilitários globalmente
  window.utils = Utils;
  
  // Inicializar UI Manager
  window.uiManager = new UIManager();
  window.uiManager.renderIconSelection();
  window.uiManager.renderManualFromText(); // Isso agora usa o módulo game-manual.js
  
  // Inicializar Game Logic
  window.gameLogic = new GameLogic();
  
  // Setup inicial
  Utils.tryRequestFullscreenOnce();
  
  // Configurar tabs do manual
  setupManualTabs();

  // Configurar modal de conquistas
  setupAchievementsModal();
 
   // Setup de zoom do mapa
  setTimeout(() => {
    Utils.setupMapZoom();
    initializeEnhancedMap(); // ← ADICIONAR ESTA LINHA
  }, 1000);
  
  console.log('Gaia Dominium inicializado com sucesso!');
});

// Função que mostra o mapa na tela
function initializeEnhancedMap() {
  console.log('🗺️ Sistema de mapa aprimorado inicializado');
  
  // Configurar estilo do mapa
  const gameMap = document.getElementById('gameMap');
  if (gameMap) {
    gameMap.style.backgroundImage = "url('gaia-mapa.png')";
    gameMap.style.backgroundSize = 'cover';
    gameMap.style.backgroundPosition = 'center';
    gameMap.style.backgroundRepeat = 'no-repeat';
  }
  
  // Forçar redesenho do mapa
  setTimeout(() => {
    if (window.uiManager && window.uiManager.renderBoard) {
      window.uiManager.renderBoard();
    }
  }, 100);
}

// Função para configurar os tabs do manual (mantida do código original)
function setupManualTabs() {
  const manualTabs = document.querySelectorAll('.manual-tab');
  const manualContents = document.querySelectorAll('.manual-content');
  
  manualTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      // Remove classe active de todos
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

// Modal de Conquistas
function setupAchievementsModal() {
  const achievementsBtn = document.getElementById('achievementsNavBtn');
  const achievementsModal = document.getElementById('achievementsModal');
  
  if (achievementsBtn && achievementsModal) {
    achievementsBtn.addEventListener('click', () => {
      window.uiManager.renderAchievementsModal();
      achievementsModal.classList.remove('hidden');
    });
  }
}
