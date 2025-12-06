// utils.js - Versão corrigida com sintaxe apropriada

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
  
  // Função para atualizar toda a UI após mudança de estado
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
  
  // Função para limpar seleção de região
  clearRegionSelection(gameState) {
    // Não será tratado aqui agora
  },
  
  // Função para converter hex para RGB (usada no renderSidebar)
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
      : '255, 255, 255';
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
    
    if (!mapViewport || !mapTransform) return;
    
    let currentZoom = 1;
    const minZoom = 0.5;
    const maxZoom = 3;
    const zoomStep = 0.1;
    let isDragging = false;
    let startX, startY;
    let translateX = 0, translateY = 0;
    
    // Aplicar transformações
    const applyTransform = () => {
      mapTransform.style.transform = `
        translate(${translateX}px, ${translateY}px)
        scale(${currentZoom})
      `;
    };
    
    // Zoom com scroll
    mapViewport.addEventListener('wheel', (e) => {
      // Permitir scroll normal se Ctrl não estiver pressionado
      if (!e.ctrlKey && !e.metaKey) return;
      
      e.preventDefault();
      
      const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
      const newZoom = Math.max(minZoom, Math.min(maxZoom, currentZoom + delta));
      
      if (newZoom !== currentZoom) {
        // Ajustar a posição de tradução para zoom no cursor
        const rect = mapViewport.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const zoomRatio = newZoom / currentZoom;
        
        // Ajustar a posição para zoom no ponto do cursor
        translateX = x - (x - translateX) * zoomRatio;
        translateY = y - (y - translateY) * zoomRatio;
        
        currentZoom = newZoom;
        applyTransform();
      }
    }, { passive: false });
    
    // Sistema de arrastar (pan)
    mapViewport.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // Apenas botão esquerdo
      
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
      applyTransform();
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
      mapViewport.style.cursor = 'grab';
    });
    
    // Zoom com teclado
    document.addEventListener('keydown', (e) => {
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
      // Reset com 0
      if (e.key === '0') {
        e.preventDefault();
        currentZoom = 1;
        translateX = 0;
        translateY = 0;
        applyTransform();
      }
    });
    
    // Configurar cursor inicial
    mapViewport.style.cursor = 'grab';
    
    console.log('🎮 Sistema de zoom/pan configurado');
  },

  // ==================== NOVAS FUNÇÕES ADICIONADAS ====================
  
  showSaveLoadModal() {
    return new Promise(resolve => {
      const modal = document.getElementById('saveLoadModal');
      const yesBtn = document.getElementById('saveLoadYesBtn');
      const noBtn = document.getElementById('saveLoadNoBtn');
      const deleteBtn = document.getElementById('saveLoadDeleteBtn');
      
      if (!modal) {
        resolve({ action: 'new' });
        return;
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
      deleteBtn.onclick = () => {
        if (confirm('Tem certeza? Esta ação é irreversível!')) {
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
  
  // Nova função para verificar e oferecer carregamento
  async checkAndOfferLoad() {
  try {
    const saved = localStorage.getItem('gaia-dominium-save');
    if (!saved) return { hasSave: false };
    
    const data = JSON.parse(saved);
    
    const response = await this.showSaveLoadModal();
    
    switch (response.action) {
      case 'load':
        // Carregar o jogo
        window.loadGame(data);
        return { hasSave: true, data: data, load: true };
      case 'delete':
        localStorage.removeItem('gaia-dominium-save');
        this.showFeedback('Save excluído com sucesso!', 'success');
        return { hasSave: false };
      default:
        return { hasSave: true, data: data, load: false };
    }
  } catch (error) {
    console.error('Erro ao verificar save:', error);
    return { hasSave: false };
  }
}
  // FIM do objeto Utils - NÃO ADICIONE VÍRGULA AQUI
};

export { Utils };
