// utils.js - Funções utilitárias + helpers de UI
import { getIcon } from '../ui/icons.js';

const Utils = {
  // ==================== SISTEMA DE ALERT/CONFIRM ====================
  showAlert(title, message, type = 'info') {
    const alertModal = document.getElementById('alertModal');
    const alertIcon = document.getElementById('alertIcon');
    const alertTitle = document.getElementById('alertTitle');
    const alertMessage = document.getElementById('alertMessage');
    const alertButtons = document.getElementById('alertButtons');
    
    if (!alertModal) {
      console.warn('Modal de alerta não encontrado');
      alert(`${title}: ${message}`);
      return;
    }
    
    const iconMap = {
      'info': 'info',
      'warning': 'alerta',
      'error': 'cross',
      'success': 'check'
    };
    
    alertIcon.innerHTML = getIcon(iconMap[type] || 'info', { size: 36 });
    alertTitle.textContent = title;
    alertMessage.textContent = message;
    
    alertButtons.innerHTML = '';
    
    const okButton = document.createElement('button');
    okButton.className = 'px-4 py-2 bg-gray-800 border border-white/6 rounded-full text-white';
    okButton.textContent = 'OK';
    okButton.addEventListener('click', () => this.hideAlert());
    
    alertButtons.appendChild(okButton);
    alertModal.classList.remove('hidden');
    
    setTimeout(() => alertModal.classList.add('show'), 10);
  },
  
  hideAlert() {
    const alertModal = document.getElementById('alertModal');
    alertModal?.classList.remove('show');
    setTimeout(() => alertModal?.classList.add('hidden'), 180);
  },
  
  showConfirm(title, message) {
    return new Promise(resolve => {
      const alertModal = document.getElementById('alertModal');
      const alertIcon = document.getElementById('alertIcon');
      const alertTitle = document.getElementById('alertTitle');
      const alertMessage = document.getElementById('alertMessage');
      const alertButtons = document.getElementById('alertButtons');
      
      if (!alertModal) {
        resolve(confirm(`${title}\n\n${message}`));
        return;
      }
      
      alertIcon.innerHTML = getIcon('question', { size: 36 });
      alertTitle.textContent = title;
      alertMessage.textContent = message;
      
      alertButtons.innerHTML = '';
      
      let resolved = false;
      
      const noButton = document.createElement('button');
      noButton.className = 'px-4 py-2 bg-gray-800 border border-white/6 rounded-full text-white mr-2';
      noButton.textContent = 'Não';
      noButton.addEventListener('click', () => {
        if (resolved) return;
        resolved = true;
        this.hideAlert();
        resolve(false);
      });
      
      const yesButton = document.createElement('button');
      yesButton.className = 'px-4 py-2 bg-green-600 rounded-full text-white';
      yesButton.textContent = 'Sim';
      yesButton.addEventListener('click', () => {
        if (resolved) return;
        resolved = true;
        this.hideAlert();
        resolve(true);
      });
      
      alertButtons.appendChild(noButton);
      alertButtons.appendChild(yesButton);
      
      alertModal.classList.remove('hidden');
      setTimeout(() => alertModal.classList.add('show'), 10);
    });
  },
  
  showFeedback(message, type = 'info') {
    const title = type === 'error' ? 'Erro' : 
                  type === 'success' ? 'Sucesso' : 
                  type === 'warning' ? 'Aviso' : 'Informação';
    this.showAlert(title, message, type);
  },

  // ==================== HELPERS DE UI ====================
  refreshUIAfterStateChange(renderHeaderPlayers, renderBoard, renderSidebar, updateFooter, selectedPlayerIndex) {
    if (typeof renderHeaderPlayers === 'function') {
      renderHeaderPlayers();
    }
    if (typeof renderBoard === 'function') {
      renderBoard();
    }
    if (typeof renderSidebar === 'function' && typeof selectedPlayerIndex !== 'undefined') {
      renderSidebar(selectedPlayerIndex);
    }
    if (typeof updateFooter === 'function') {
      updateFooter();
    }
  },
  
  clearRegionSelection() {
    if (window.gameState) {
      window.gameState.selectedRegionId = null;
    }
    document.querySelectorAll('.board-cell').forEach(c => c.classList.remove('region-selected'));
  },
  
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] 
      : [255, 255, 255];
  },
  
  hexToRgbString(hex) {
    const rgb = this.hexToRgb(hex);
    return rgb.join(', ');
  },

  // ==================== SISTEMA DE FULLSCREEN ====================
tryRequestFullscreenOnce() {
  // Só tentar fullscreen se houver interação do usuário
  const requestFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen && !document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else if (el.webkitRequestFullscreen && !document.webkitFullscreenElement) {
      el.webkitRequestFullscreen();
    }
  };
  
  // Aguardar interação do usuário
  document.body.addEventListener('click', requestFullscreen, { once: true });
},

  // Estado de pan para evitar cliques acidentais
  _isMapPanning: false,
  _mapZoomInitialized: false,
  isMapPanning() {
    return this._isMapPanning;
  },

  // ==================== SISTEMA DE ZOOM E PAN DO MAPA (TOUCH + DESKTOP) ====================
  setupMapZoom() {
    const mapViewport = document.getElementById('mapViewport');
    const mapTransform = document.getElementById('mapTransform');
    
    if (!mapViewport || !mapTransform) return;
    if (this._mapZoomInitialized) return;
    this._mapZoomInitialized = true;
    
    // Configurar propriedades de aceleração de hardware
    mapTransform.style.transformOrigin = '0 0';
    mapTransform.style.willChange = 'transform';
    
    let currentZoom = 1;
    const minZoom = 0.6;
    const maxZoom = 2.8;
    const zoomStep = 0.25;
    
    let translateX = 0;
    let translateY = 0;
    
    // Variáveis de arrasto com mouse
    let isMouseDragging = false;
    let mouseStartX = 0, mouseStartY = 0;
    let initialMouseX = 0, initialMouseY = 0;
    
    // Variáveis de toque
    let isTouchPanning = false;
    let touchStartX = 0, touchStartY = 0;
    let initialTouchX = 0, initialTouchY = 0;
    
    // Variáveis de pinça (Pinch-to-zoom)
    let isPinching = false;
    let initialPinchDist = 0;
    let initialPinchZoom = 1;
    let pinchMidX = 0, pinchMidY = 0;
    let pinchInitialTranslateX = 0, pinchInitialTranslateY = 0;
    
    // Variáveis de Double Tap
    let lastTapTime = 0;
    let lastTapX = 0, lastTapY = 0;

    // Timer para limpar estado de panning
    let panningClearTimer = null;
    const setPanningActive = (active, delay = 0) => {
      if (panningClearTimer) {
        clearTimeout(panningClearTimer);
        panningClearTimer = null;
      }
      if (active) {
        Utils._isMapPanning = true;
      } else if (delay > 0) {
        panningClearTimer = setTimeout(() => {
          Utils._isMapPanning = false;
        }, delay);
      } else {
        Utils._isMapPanning = false;
      }
    };

    // Restrição de limites para que o tabuleiro não fuja da tela
    const clampTransform = () => {
      const vw = mapViewport.clientWidth;
      const vh = mapViewport.clientHeight;
      if (!vw || !vh) return;

      if (currentZoom <= 1) {
        const slackX = Math.max(30, vw * 0.1);
        const slackY = Math.max(30, vh * 0.1);
        translateX = Math.max(-slackX, Math.min(slackX, translateX));
        translateY = Math.max(-slackY, Math.min(slackY, translateY));
      } else {
        const minX = vw * (1 - currentZoom) - 40;
        const maxX = 40;
        const minY = vh * (1 - currentZoom) - 40;
        const maxY = 40;
        translateX = Math.max(minX, Math.min(maxX, translateX));
        translateY = Math.max(minY, Math.min(maxY, translateY));
      }
    };

    // Aplicação das transformações CSS
    const applyTransform = (smooth = false) => {
      clampTransform();
      if (smooth) {
        mapTransform.style.transition = 'transform 0.26s cubic-bezier(0.16, 1, 0.3, 1)';
      } else {
        mapTransform.style.transition = 'none';
      }
      mapTransform.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
    };

    // Zoom focalizado em um ponto (x, y) relativo ao viewport
    const zoomAtPoint = (targetZoom, focalX, focalY, smooth = true) => {
      const clampedZoom = Math.max(minZoom, Math.min(maxZoom, targetZoom));
      if (Math.abs(clampedZoom - currentZoom) < 0.001) return;

      const zoomRatio = clampedZoom / currentZoom;
      translateX = focalX - (focalX - translateX) * zoomRatio;
      translateY = focalY - (focalY - translateY) * zoomRatio;
      currentZoom = clampedZoom;
      applyTransform(smooth);
    };

    // Reset para 100%
    const resetTransform = () => {
      currentZoom = 1;
      translateX = 0;
      translateY = 0;
      applyTransform(true);
    };

    // ==================== TOUCH ENGINE (MOBILE) ====================
    mapViewport.addEventListener('touchstart', (e) => {
      const now = Date.now();
      
      // 1. Gesto de 2 dedos: PINCH TO ZOOM
      if (e.touches.length === 2) {
        isPinching = true;
        isTouchPanning = false;
        setPanningActive(true);

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialPinchDist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        initialPinchZoom = currentZoom;

        const rect = mapViewport.getBoundingClientRect();
        pinchMidX = ((touch1.clientX + touch2.clientX) / 2) - rect.left;
        pinchMidY = ((touch1.clientY + touch2.clientY) / 2) - rect.top;
        pinchInitialTranslateX = translateX;
        pinchInitialTranslateY = translateY;
        return;
      }

      // 2. Gesto de 1 dedo: PAN ou DOUBLE-TAP
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = mapViewport.getBoundingClientRect();
        const clientX = touch.clientX;
        const clientY = touch.clientY;

        // Detecção de Double Tap (< 300ms e proximidade < 30px)
        const timeDiff = now - lastTapTime;
        const distDiff = Math.hypot(clientX - lastTapX, clientY - lastTapY);
        
        if (timeDiff < 300 && distDiff < 30) {
          lastTapTime = 0; // Consumido
          setPanningActive(true, 150);
          const focalX = clientX - rect.left;
          const focalY = clientY - rect.top;
          
          if (currentZoom > 1.15) {
            resetTransform();
          } else {
            zoomAtPoint(1.8, focalX, focalY, true);
          }
          return;
        }

        lastTapTime = now;
        lastTapX = clientX;
        lastTapY = clientY;

        isTouchPanning = false;
        touchStartX = clientX - translateX;
        touchStartY = clientY - translateY;
        initialTouchX = clientX;
        initialTouchY = clientY;
      }
    }, { passive: false });

    mapViewport.addEventListener('touchmove', (e) => {
      // 1. PINCH ZOOM ATIVO
      if (isPinching && e.touches.length >= 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        
        if (initialPinchDist > 0) {
          const pinchRatio = currentDist / initialPinchDist;
          const newZoom = Math.max(minZoom, Math.min(maxZoom, initialPinchZoom * pinchRatio));
          
          translateX = pinchMidX - (pinchMidX - pinchInitialTranslateX) * (newZoom / initialPinchZoom);
          translateY = pinchMidY - (pinchMidY - pinchInitialTranslateY) * (newZoom / initialPinchZoom);
          currentZoom = newZoom;
          applyTransform(false);
          setPanningActive(true);
        }
        return;
      }

      // 2. TOUCH PAN ATIVO (1 dedo)
      if (e.touches.length === 1 && !isPinching) {
        const touch = e.touches[0];
        const moveDist = Math.hypot(touch.clientX - initialTouchX, touch.clientY - initialTouchY);
        
        if (moveDist > 6) {
          isTouchPanning = true;
          setPanningActive(true);
          e.preventDefault(); // Previne scroll da página enquanto arrasta o tabuleiro
          
          translateX = touch.clientX - touchStartX;
          translateY = touch.clientY - touchStartY;
          applyTransform(false);
        }
      }
    }, { passive: false });

    mapViewport.addEventListener('touchend', (e) => {
      if (isPinching) {
        if (e.touches.length < 2) {
          isPinching = false;
          setPanningActive(false, 150);
        }
      }
      if (isTouchPanning) {
        isTouchPanning = false;
        setPanningActive(false, 150);
      }
    }, { passive: true });

    mapViewport.addEventListener('touchcancel', () => {
      isPinching = false;
      isTouchPanning = false;
      setPanningActive(false, 100);
    }, { passive: true });

    // ==================== MOUSE DRAG & WHEEL (DESKTOP) ====================
    mapViewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = mapViewport.getBoundingClientRect();
      const focalX = e.clientX - rect.left;
      const focalY = e.clientY - rect.top;
      
      const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
      zoomAtPoint(currentZoom + delta, focalX, focalY, true);
    }, { passive: false });

    mapViewport.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // Apenas botão esquerdo
      isMouseDragging = true;
      mouseStartX = e.clientX - translateX;
      mouseStartY = e.clientY - translateY;
      initialMouseX = e.clientX;
      initialMouseY = e.clientY;
      mapViewport.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isMouseDragging) return;
      const moveDist = Math.hypot(e.clientX - initialMouseX, e.clientY - initialMouseY);
      if (moveDist > 5) {
        setPanningActive(true);
        translateX = e.clientX - mouseStartX;
        translateY = e.clientY - mouseStartY;
        applyTransform(false);
      }
    });

    document.addEventListener('mouseup', () => {
      if (isMouseDragging) {
        isMouseDragging = false;
        mapViewport.style.cursor = 'grab';
        setPanningActive(false, 120);
      }
    });

    // ==================== BOTÕES FLUTUANTES (+ / - / RESET) ====================
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const zoomResetBtn = document.getElementById('zoomResetBtn');

    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = mapViewport.getBoundingClientRect();
        zoomAtPoint(currentZoom + zoomStep, rect.width / 2, rect.height / 2, true);
      });
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = mapViewport.getBoundingClientRect();
        zoomAtPoint(currentZoom - zoomStep, rect.width / 2, rect.height / 2, true);
      });
    }

    if (zoomResetBtn) {
      zoomResetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetTransform();
      });
    }

    // ==================== ATALHOS DE TECLADO (+, -, 0) ====================
    document.addEventListener('keydown', (e) => {
      // Ignorar se estiver digitando em campo de texto
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
      
      const rect = mapViewport.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomAtPoint(currentZoom + zoomStep, centerX, centerY, true);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomAtPoint(currentZoom - zoomStep, centerX, centerY, true);
      } else if (e.key === '0') {
        e.preventDefault();
        resetTransform();
      }
    });
    
    mapViewport.style.cursor = 'grab';
  },

  // ==================== SISTEMA DE SAVE/LOAD ====================
  async checkAndOfferLoad() {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const saves = window.getSavedGamesList ? window.getSavedGamesList() : [];
      let data = null;
      let saveId = null;
      let latestSave = null;

      if (saves && saves.length > 0) {
        latestSave = saves[0];
        data = latestSave.data;
        saveId = latestSave.id;
      } else {
        const saved = localStorage.getItem('gaia-dominium-save');
        if (!saved) {
          if (window.uiManager?.modals?.savedGames?.updateSavesCountBadge) {
            window.uiManager.modals.savedGames.updateSavesCountBadge();
          }
          return { hasSave: false };
        }
        try {
          data = JSON.parse(saved);
          saveId = data?.gameState?.saveId || 'save_legacy';
          latestSave = {
            id: saveId,
            name: 'Partida Salva',
            timestamp: data?.timestamp || new Date().toISOString(),
            turn: data?.gameState?.turn || 1,
            playersCount: data?.gameState?.players?.length || 0,
            players: data?.gameState?.players || [],
            rules: data?.gameState?.rules || {},
            data: data
          };
        } catch (e) {
          return { hasSave: false };
        }
      }
      
      const response = await this.showSaveLoadModal(latestSave, saves.length || 1);
      
      switch (response.action) {
        case 'load':
          return { hasSave: true, data: data, load: true, saveId };
        case 'view_all':
          if (window.uiManager?.modals?.openSavedGames) {
            window.uiManager.modals.openSavedGames();
          }
          return { hasSave: true, data: data, load: false, saveId, viewAll: true };
        case 'delete':
          if (saveId && window.deleteSavedGameById) {
            window.deleteSavedGameById(saveId);
          } else {
            localStorage.removeItem('gaia-dominium-save');
          }
          if (window.uiManager?.modals?.savedGames?.updateSavesCountBadge) {
            window.uiManager.modals.savedGames.updateSavesCountBadge();
          }
          this.showFeedback('Save excluído com sucesso!', 'success');
          const remainingSaves = window.getSavedGamesList ? window.getSavedGamesList() : [];
          return { hasSave: remainingSaves.length > 0, remainingCount: remainingSaves.length };
        default:
          if (window.uiManager?.modals?.savedGames?.updateSavesCountBadge) {
            window.uiManager.modals.savedGames.updateSavesCountBadge();
          }
          return { hasSave: true, data: data, load: false, saveId };
      }
    } catch (error) {
      console.error('Erro ao verificar save:', error);
      return { hasSave: false };
    }
  },
  
  showSaveLoadModal(latestSave = null, totalCount = 1) {
    return new Promise(resolve => {
      const modal = document.getElementById('saveLoadModal');
      const yesBtn = document.getElementById('saveLoadYesBtn');
      const noBtn = document.getElementById('saveLoadNoBtn');
      const deleteBtn = document.getElementById('saveLoadDeleteBtn');
      const viewAllBtn = document.getElementById('saveLoadViewAllBtn');
      const titleEl = document.getElementById('saveLoadTitle');
      const subtitleEl = document.getElementById('saveLoadSubtitle');
      const promptEl = document.getElementById('saveLoadPrompt');
      const detailsCard = document.getElementById('saveLoadDetailsCard');
      
      if (!modal) {
        resolve({ action: 'new' });
        return;
      }
      
      // Atualizar títulos coerentes com a quantidade de saves
      if (titleEl) {
        titleEl.textContent = totalCount > 1 
          ? `${totalCount} Jogos Salvos Encontrados` 
          : 'Jogo Salvo Encontrado';
      }
      
      if (subtitleEl) {
        subtitleEl.textContent = totalCount > 1 
          ? `Você possui ${totalCount} partidas salvas registradas.` 
          : 'Encontramos 1 partida salva registrada.';
      }

      if (promptEl) {
        promptEl.textContent = totalCount > 1
          ? 'Deseja retomar a partida mais recente?'
          : 'Deseja carregá-la e continuar de onde parou?';
      }

      // Renderizar o card com dados coerentes da partida salva
      if (detailsCard && latestSave) {
        const dateStr = latestSave.timestamp ? new Date(latestSave.timestamp).toLocaleString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }) : 'Data recente';

        const rules = latestSave.rules || {};
        let ruleBadge = `${rules.targetVictoryPoints || 25} PV`;
        if (rules.victoryCondition === 'domination') ruleBadge = 'Dominação Total';
        else if (rules.victoryCondition === 'elimination') ruleBadge = 'Eliminação';
        else if (rules.victoryCondition === 'all') ruleBadge = 'Modo Misto';

        const players = latestSave.players || [];
        const playersHtml = players.map(p => `
          <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-gray-900/90 border border-white/5 text-[11px]">
            <span class="w-2 h-2 rounded-full" style="background-color: ${p.color || '#fbbf24'}"></span>
            <span class="font-medium text-white truncate max-w-[90px]">${p.name}</span>
            <span class="text-yellow-400 font-bold">${p.victoryPoints ?? 0} PV</span>
            ${p.isAI ? '<span class="text-[9px] px-1 rounded bg-purple-900/60 text-purple-300">IA</span>' : ''}
          </div>
        `).join('');

        detailsCard.innerHTML = `
          <div class="flex items-center justify-between gap-2 mb-2">
            <h4 class="text-sm font-bold text-white truncate">${latestSave.name || 'Partida Salva'}</h4>
            <div class="flex items-center gap-1.5 flex-shrink-0">
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                Turno ${latestSave.turn || 1}
              </span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                ${ruleBadge}
              </span>
            </div>
          </div>
          <div class="text-[11px] text-gray-400 mb-2.5 flex items-center gap-2">
            <span>📅 ${dateStr}</span>
            <span>•</span>
            <span>👥 ${latestSave.playersCount || players.length} jogadores</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            ${playersHtml}
          </div>
        `;
        detailsCard.classList.remove('hidden');
      } else if (detailsCard) {
        detailsCard.classList.add('hidden');
      }

      // Botão para ver todos os saves quando há mais de 1
      if (viewAllBtn) {
        if (totalCount > 1) {
          viewAllBtn.textContent = `Ver Todos os Jogos Salvos (${totalCount})`;
          viewAllBtn.classList.remove('hidden');
        } else {
          viewAllBtn.classList.add('hidden');
        }
      }
      
      let resolved = false;
      
      const handleResolve = (action) => {
        if (resolved) return;
        resolved = true;
        this.hideSaveLoadModal();
        resolve({ action });
      };
      
      yesBtn.onclick = () => handleResolve('load');
      noBtn.onclick = () => handleResolve('new');
      if (viewAllBtn) {
        viewAllBtn.onclick = () => handleResolve('view_all');
      }
      deleteBtn.onclick = async () => {
        let confirmed = false;
        if (window.uiManager?.modals?.showConfirm) {
          confirmed = await window.uiManager.modals.showConfirm(
            'Excluir Jogo Salvo',
            'Tem certeza que deseja excluir esta partida salva? Essa ação não pode ser desfeita.'
          );
        } else {
          confirmed = window.confirm('Tem certeza que deseja excluir esta partida salva? Essa ação não pode ser desfeita.');
        }
        if (confirmed) {
          handleResolve('delete');
        }
      };
      
      modal.classList.remove('hidden');
      setTimeout(() => modal.classList.add('show'), 10);
    });
  },
  
  hideSaveLoadModal() {
    const modal = document.getElementById('saveLoadModal');
    modal?.classList.remove('show');
    setTimeout(() => modal?.classList.add('hidden'), 180);
  },

  // ==================== UTILITÁRIOS GERAIS ====================
  formatNumber(num) {
    return num.toLocaleString('pt-BR');
  },
  
  capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },
  
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },
  
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

export { Utils };