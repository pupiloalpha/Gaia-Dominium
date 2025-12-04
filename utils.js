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
// setupMapZoom - VERSÃO APRIMORADA
setupMapZoom() {
  const mapViewport = document.getElementById('mapViewport');
  const mapTransform = document.getElementById('mapTransform');
  const zoomControls = document.getElementById('zoomControls');
  const miniMapIndicator = document.getElementById('miniMapIndicator');
  
  if (!mapViewport || !mapTransform) return;
  
  let currentZoom = 1;
  const minZoom = 0.5;
  const maxZoom = 3;
  const zoomStep = 0.1;
  let isDragging = false;
  let startX, startY;
  let translateX = 0, translateY = 0;
  
  // Inicializar controles visíveis
  if (zoomControls) zoomControls.classList.remove('hidden');
  if (miniMapIndicator) miniMapIndicator.classList.remove('hidden');
  
  // Aplicar transformações
  const applyTransform = () => {
    mapTransform.style.transform = 
      `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
    
    // Atualizar indicadores
    updateIndicators();
  };
  
  // Atualizar indicadores
  const updateIndicators = () => {
    if (miniMapIndicator) {
      document.getElementById('zoomLevel').textContent = 
        `${Math.round(currentZoom * 100)}%`;
      document.getElementById('mapPosition').textContent = 
        `${Math.round(translateX)}px, ${Math.round(translateY)}px`;
    }
  };
  
  // Zoom com scroll
  mapViewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
    const oldZoom = currentZoom;
    currentZoom = Math.max(minZoom, Math.min(maxZoom, currentZoom + delta));
    
    if (currentZoom !== oldZoom) {
      // Zoom no ponto do cursor
      const rect = mapViewport.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calcular nova posição para zoom centrado no cursor
      const zoomRatio = currentZoom / oldZoom;
      translateX = mouseX - (mouseX - translateX) * zoomRatio;
      translateY = mouseY - (mouseY - translateY) * zoomRatio;
      
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
    mapViewport.classList.add('grabbing');
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    
    // Limitar movimento para não sair muito dos limites
    const maxMove = 300;
    translateX = Math.max(-maxMove, Math.min(maxMove, translateX));
    translateY = Math.max(-maxMove, Math.min(maxMove, translateY));
    
    applyTransform();
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
    mapViewport.style.cursor = 'grab';
    mapViewport.classList.remove('grabbing');
  });
  
  // Controles de zoom por botão
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
      switch(e.key) {
        case '+':
        case '=':
          e.preventDefault();
          currentZoom = Math.min(maxZoom, currentZoom + zoomStep);
          applyTransform();
          break;
        case '-':
        case '_':
          e.preventDefault();
          currentZoom = Math.max(minZoom, currentZoom - zoomStep);
          applyTransform();
          break;
        case '0':
          e.preventDefault();
          currentZoom = 1;
          translateX = 0;
          translateY = 0;
          applyTransform();
          break;
      }
    }
    
    // Tecla R para reset
    if (e.key === 'r' || e.key === 'R') {
      currentZoom = 1;
      translateX = 0;
      translateY = 0;
      applyTransform();
    }
  });
  
  // Touch events para dispositivos móveis
  let touchStartDistance = 0;
  let touchStartZoom = 1;
  
  mapViewport.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      touchStartDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      touchStartZoom = currentZoom;
    } else if (e.touches.length === 1) {
      // Drag
      isDragging = true;
      startX = e.touches[0].clientX - translateX;
      startY = e.touches[0].clientY - translateY;
    }
  }, { passive: true });
  
  mapViewport.addEventListener('touchmove', (e) => {
    e.preventDefault();
    
    if (e.touches.length === 2) {
      // Pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      if (touchStartDistance > 0) {
        const zoomFactor = currentDistance / touchStartDistance;
        currentZoom = Math.max(minZoom, Math.min(maxZoom, touchStartZoom * zoomFactor));
        applyTransform();
      }
    } else if (e.touches.length === 1 && isDragging) {
      // Drag
      translateX = e.touches[0].clientX - startX;
      translateY = e.touches[0].clientY - startY;
      applyTransform();
    }
  }, { passive: false });
  
  mapViewport.addEventListener('touchend', () => {
    isDragging = false;
    touchStartDistance = 0;
  });
  
  // Inicializar
  applyTransform();
  mapViewport.style.cursor = 'grab';
}

};

export { Utils };
