// utils.js - Funções utilitárias
const Utils = {
  // Alert/Confirm system
  showAlert(title, message, type = 'info') {
    const alertModal = document.getElementById('alertModal');
    const alertIcon = document.getElementById('alertIcon');
    const alertTitle = document.getElementById('alertTitle');
    const alertMessage = document.getElementById('alertMessage');
    const alertButtons = document.getElementById('alertButtons');
    
    if (!alertModal) return;
    
    let icon = 'ℹ️';
    if (type === 'warning') icon = '🟡';
    if (type === 'error') icon = '🔴';
    if (type === 'success') icon = '🟢';
    
    alertIcon.textContent = icon;
    alertTitle.textContent = title;
    alertMessage.textContent = message;
    
    // Clear buttons
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
        resolve(false);
        return;
      }
      
      alertIcon.textContent = '❓';
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

  showFeedbackWithCallback(title, message, type = 'info', callback) {
  return new Promise(resolve => {
    const alertModal = document.getElementById('alertModal');
    const alertIcon = document.getElementById('alertIcon');
    const alertTitle = document.getElementById('alertTitle');
    const alertMessage = document.getElementById('alertMessage');
    const alertButtons = document.getElementById('alertButtons');
    
    if (!alertModal) {
      resolve();
      return;
    }
    
    let icon = 'ℹ️';
    if (type === 'warning') icon = '🟡';
    if (type === 'error') icon = '🔴';
    if (type === 'success') icon = '🟢';
    
    alertIcon.textContent = icon;
    alertTitle.textContent = title;
    alertMessage.textContent = message;
    
    // Clear buttons
    alertButtons.innerHTML = '';
    
    const okButton = document.createElement('button');
    okButton.className = 'px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-full text-white transition';
    okButton.textContent = 'OK';
    okButton.addEventListener('click', () => {
      this.hideAlert();
      if (callback) callback();
      resolve();
    });
    
    alertButtons.appendChild(okButton);
    alertModal.classList.remove('hidden');
    
    setTimeout(() => alertModal.classList.add('show'), 10);
  });
},
  
  // Fullscreen helper
  tryRequestFullscreenOnce() {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    }
    
    document.body.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        this.tryRequestFullscreenOnce();
      }
    }, { once: true });
  },
  
  // Setup map zoom
setupMapZoom() {
  const mapViewport = document.getElementById('mapViewport');
  const mapTransform = document.getElementById('mapTransform');
  const mapImageContainer = document.getElementById('mapImageContainer');
  const boardOverlay = document.getElementById('boardOverlay');
  
  if (!mapViewport || !mapTransform || !mapImageContainer) return;
  
  let currentZoom = 1;
  const minZoom = 0.7;
  const maxZoom = 2.5;
  const zoomStep = 0.1;
  let isDragging = false;
  let startX, startY;
  let translateX = 0, translateY = 0;
  
  // Mostrar controles
  document.getElementById('zoomControls')?.classList.remove('hidden');
  document.getElementById('miniMapIndicator')?.classList.remove('hidden');
  
  // Aplicar transformação apenas no container (imagem e overlay juntos)
  const applyTransform = () => {
    const transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
    mapTransform.style.transform = transform;
    
    // Atualizar indicadores
    updateIndicators();
  };
  
  // Atualizar indicadores
  const updateIndicators = () => {
    const positionEl = document.getElementById('mapPosition');
    const zoomLevelEl = document.getElementById('zoomLevel');
    
    if (positionEl) {
      positionEl.textContent = `${Math.round(translateX)}px, ${Math.round(translateY)}px`;
    }
    
    if (zoomLevelEl) {
      zoomLevelEl.textContent = `${Math.round(currentZoom * 100)}%`;
    }
  };
  
  // Zoom com scroll (Ctrl + scroll)
  mapViewport.addEventListener('wheel', (e) => {
    if (!e.ctrlKey) return;
    
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
    const oldZoom = currentZoom;
    currentZoom = Math.max(minZoom, Math.min(maxZoom, currentZoom + delta));
    
    if (currentZoom !== oldZoom) {
      // Calcular zoom centrado no cursor
      const rect = mapViewport.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const zoomRatio = currentZoom / oldZoom;
      
      // Ajustar posição para zoom no ponto do cursor
      translateX = x - (x - translateX) * zoomRatio;
      translateY = y - (y - translateY) * zoomRatio;
      
      // Limitar movimento
      const maxTranslate = 200;
      translateX = Math.max(-maxTranslate, Math.min(maxTranslate, translateX));
      translateY = Math.max(-maxTranslate, Math.min(maxTranslate, translateY));
      
      applyTransform();
    }
  }, { passive: false });
  
  // Sistema de arrastar
  mapViewport.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    mapViewport.style.cursor = 'grabbing';
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    
    // Limitar movimento
    const maxTranslate = 200;
    translateX = Math.max(-maxTranslate, Math.min(maxTranslate, translateX));
    translateY = Math.max(-maxTranslate, Math.min(maxTranslate, translateY));
    
    applyTransform();
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
    mapViewport.style.cursor = 'grab';
  });
  
  // Controles de botão
  document.getElementById('zoomIn')?.addEventListener('click', () => {
    currentZoom = Math.min(maxZoom, currentZoom + zoomStep);
    applyTransform();
  });
  
  document.getElementById('zoomOut')?.addEventListener('click', () => {
    currentZoom = Math.max(minZoom, currentZoom - zoomStep);
    applyTransform();
  });
  
  document.getElementById('resetZoom')?.addEventListener('click', () => {
    currentZoom = 1;
    translateX = 0;
    translateY = 0;
    applyTransform();
  });
  
  // Atalhos de teclado
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        currentZoom = Math.min(maxZoom, currentZoom + zoomStep);
        applyTransform();
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        currentZoom = Math.max(minZoom, currentZoom - zoomStep);
        applyTransform();
      }
      if (e.key === '0') {
        e.preventDefault();
        currentZoom = 1;
        translateX = 0;
        translateY = 0;
        applyTransform();
      }
    }
    
    // Reset com R
    if (e.key === 'r' || e.key === 'R') {
      currentZoom = 1;
      translateX = 0;
      translateY = 0;
      applyTransform();
    }
  });
  
  // Inicializar
  applyTransform();
  mapViewport.style.cursor = 'grab';
}
  
};

export { Utils };
