// board-renderer.js - Componente de Renderização do Tabuleiro
import { gameState, getCurrentPlayer } from '../state/game-state.js';
import { RESOURCE_ICONS } from '../state/game-config.js';

export class BoardRenderer {
  constructor(uiGameManager) {
    this.uiGameManager = uiGameManager;
    this.boardContainer = document.getElementById('boardContainer');
    this.regionTooltip = document.getElementById('regionTooltip');
    this.tooltipTitle = document.getElementById('tooltipTitle');
    this.tooltipBody = document.getElementById('tooltipBody');
  }

  render() {
    if (!this.boardContainer) {
      console.error("❌ boardContainer não disponível.");
      return;
    }
    
    this.boardContainer.innerHTML = '';
    gameState.regions.forEach((region, index) => {
      const cell = this.createRegionCell(region, index);
      this.boardContainer.appendChild(cell);
    });
  }

  createRegionCell(region, index) {
    const cell = document.createElement('div');
    cell.className = 'board-cell';
    cell.dataset.regionId = region.id;
    cell.dataset.region = String.fromCharCode(65 + region.id);

    // Verificar se o controlador está eliminado
    if (region.controller !== null) {
      const controllerPlayer = gameState.players[region.controller];
      if (controllerPlayer && controllerPlayer.eliminated) {
        cell.classList.add('eliminated-controlled');
      }
    }

    // Adicionar classes baseadas no estado
    if (region.controller === gameState.currentPlayerIndex) {
      cell.classList.add('player-owned');
    }

    if (region.controller === null) {
      cell.classList.add('neutral-available');
    }

    // Verificar se há ações disponíveis nesta região
    const currentPlayer = getCurrentPlayer();
    if (currentPlayer && region.controller === currentPlayer.id && region.explorationLevel > 0) {
      cell.classList.add('action-available');
      cell.classList.add('clickable');
    }

    if (gameState.actionsLeft > 0) {
      const actionCounter = document.createElement('div');
      actionCounter.className = 'action-counter';
      actionCounter.textContent = `${gameState.actionsLeft}A`;
      cell.appendChild(actionCounter);
    }

    if (region.controller !== null) {
      cell.classList.add('controlled');
      const player = gameState.players[region.controller];
      const rgb = this.hexToRgb(player.color);
      cell.style.setProperty('--player-rgb', rgb.join(', '));
      cell.style.setProperty('--player-color', player.color);
    } else {
      cell.classList.add('neutral');
    }
    
    const header = document.createElement('div');
    header.className = 'flex items-start justify-between mb-1';
    header.innerHTML = `
      <div>
        <div class="text-xs font-bold text-white leading-tight">${region.name}</div>
        <div class="text-[9px] text-gray-300 mt-0.5">${region.biome}</div>
      </div>
      <div class="text-xs text-yellow-300 font-bold flex items-center gap-0.5">
        ${region.explorationLevel}<span class="text-[10px]">⭐</span>
      </div>
    `;
    
    const resourcesLine = document.createElement('div');
    resourcesLine.className = 'flex items-center justify-between gap-1 mt-1';
    
    const resourceOrder = ['madeira', 'pedra', 'ouro', 'agua'];
    const resourcePairs = [];
    
    resourceOrder.forEach(key => {
      const value = region.resources[key] || 0;
      if (value > 0) {
        resourcePairs.push({
          icon: RESOURCE_ICONS[key],
          value: value,
          key: key
        });
      }
    });
    
    resourcePairs.forEach((resource, idx) => {
      const pair = document.createElement('div');
      pair.className = 'flex items-center gap-0.5 flex-1 justify-center';
      pair.innerHTML = `
        <span class="text-xs">${resource.icon}</span>
        <span class="text-xs font-bold text-white">${resource.value}</span>
      `;
      resourcesLine.appendChild(pair);
    });
    
    if (resourcePairs.length === 0) {
      const placeholder = document.createElement('div');
      placeholder.className = 'text-[9px] text-gray-400 italic flex-1 text-center';
      placeholder.textContent = 'Sem recursos';
      resourcesLine.appendChild(placeholder);
    }
    
    const footer = document.createElement('div');
    footer.className = 'flex items-center justify-between mt-2 pt-1 border-t border-white/5';
    
    const controller = region.controller !== null 
      ? gameState.players[region.controller].icon
      : '<span class="text-gray-400 text-xs">🏳️</span>';

    let structureDisplay = '—';
    if (region.structures.length > 0) {
      const structureIcons = {
        'Abrigo': '🛖',
        'Torre de Vigia': '🏯',
        'Mercado': '🏪',
        'Laboratório': '🔬',
        'Santuário': '🛐'
      };
      
      structureDisplay = structureIcons[region.structures[0]] || '🏗️';
      if (region.structures.length > 1) {
        structureDisplay += `+${region.structures.length - 1}`;
      }
    }

    footer.innerHTML = `
      <div class="text-xs font-medium text-white">${controller}</div>
      <div class="text-xs">${structureDisplay}</div>
    `;
    
    cell.appendChild(header);
    cell.appendChild(resourcesLine);
    cell.appendChild(footer);
    
    cell.addEventListener('click', (e) => {
      e.stopPropagation();
      
      const regionId = Number(cell.dataset.regionId);
      
      // Verificar se não está clicando em um modal
      const clickedInModal = e.target.closest('[id$="Modal"]') || 
                            e.target.closest('#negotiationModal') || 
                            e.target.closest('#negResponseModal');
      
      if (clickedInModal) return;
      
      // Alternar seleção
      if (gameState.selectedRegionId === regionId) {
        gameState.selectedRegionId = null;
        cell.classList.remove('region-selected');
      } else {
        const previousSelected = gameState.selectedRegionId;
        gameState.selectedRegionId = regionId;
        
        if (previousSelected !== null) {
          const prevCell = document.querySelector(`.board-cell[data-region-id="${previousSelected}"]`);
          if (prevCell) prevCell.classList.remove('region-selected');
        }
        
        cell.classList.add('region-selected');
      }
      
      // Atualizar sidebar e footer
      if (this.uiGameManager.sidebarRenderer) {
        this.uiGameManager.sidebarRenderer.render(gameState.selectedPlayerForSidebar);
      }
      if (this.uiGameManager.footerManager) {
        this.uiGameManager.footerManager.update();
      }
    });
    
    // Tooltip events
    cell.addEventListener('mouseenter', (e) => this.showRegionTooltip(region, e.currentTarget));
    cell.addEventListener('mousemove', (e) => this.positionTooltip(e.currentTarget));
    cell.addEventListener('mouseleave', () => this.hideRegionTooltip());
    
    return cell;
  }

  showRegionTooltip(region, targetEl) {
    const owner = region.controller !== null 
      ? `${gameState.players[region.controller].icon} ${gameState.players[region.controller].name}`
      : 'Neutro';
    const structures = region.structures.length ? region.structures.join(', ') : 'Nenhuma';
    
    this.tooltipTitle.textContent = `${region.name} — ${region.biome}`;
    this.tooltipBody.innerHTML = `
      <div class="tooltip-section">
        <div class="tooltip-section-title">Informações</div>
        <div class="text-xs text-gray-300">
          <div class="flex justify-between">
            <span>Exploração:</span>
            <span class="font-bold">${region.explorationLevel}⭐</span>
          </div>
          <div class="flex justify-between mt-1">
            <span>Controlado por:</span>
            <span class="font-bold">${owner}</span>
          </div>
          <div class="flex justify-between mt-1">
            <span>Estruturas:</span>
            <span class="font-bold">${structures}</span>
          </div>
        </div>
      </div>
      
      <div class="tooltip-section mt-3">
        <div class="tooltip-section-title">Recursos</div>
        <div class="flex items-center justify-between gap-3 mt-1">
          ${Object.entries(region.resources)
            .filter(([key, value]) => value > 0)
            .map(([key, value]) => `
              <div class="flex items-center gap-1">
                <span class="text-base">${RESOURCE_ICONS[key]}</span>
                <span class="text-xs font-bold text-white">${value}</span>
              </div>
            `).join('')}
          ${Object.values(region.resources).filter(v => v > 0).length === 0 ? 
            '<span class="text-xs text-gray-400">Sem recursos</span>' : ''}
        </div>
      </div>
    `;
    
    this.regionTooltip.classList.remove('hidden');
    this.regionTooltip.classList.add('visible');
    this.positionTooltip(targetEl);
  }

  positionTooltip(targetEl) {
    const rect = targetEl.getBoundingClientRect();
    const tooltipRect = this.regionTooltip.getBoundingClientRect();
    
    // Posição centralizada acima da célula por padrão
    let top = rect.top - tooltipRect.height - 10;
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    
    // Ajuste para garantir que a tooltip não saia da tela
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    
    // Ajuste horizontal
    if (left < 10) {
      left = 10;
    } else if (left + tooltipRect.width > viewportWidth - 10) {
      left = viewportWidth - tooltipRect.width - 10;
    }
    
    // Ajuste vertical - se não couber acima, coloca abaixo
    if (top < 10) {
      top = rect.bottom + 10;
      // Se também não couber abaixo, ajusta para dentro da tela
      if (top + tooltipRect.height > viewportHeight - 10) {
        top = viewportHeight - tooltipRect.height - 10;
      }
    } else if (top + tooltipRect.height > viewportHeight - 10) {
      // Se não couber acima, coloca abaixo
      top = rect.bottom + 10;
    }
    
    // Aplica a posição com scroll
    this.regionTooltip.style.top = (top + scrollY) + 'px';
    this.regionTooltip.style.left = (left + scrollX) + 'px';
    
    // Garante que a tooltip esteja visível
    this.regionTooltip.style.zIndex = '1000';
  }

  hideRegionTooltip() {
    this.regionTooltip.classList.add('hidden');
    this.regionTooltip.classList.remove('visible');
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [255, 255, 255];
  }
}