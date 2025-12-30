// ui-region-renderer.js - Renderização de células do tabuleiro
import { gameState } from '../state/game-state.js';
import { RESOURCE_ICONS } from '../state/game-config.js';
import { Utils } from '../utils/utils.js';

export class RegionRenderer {
    constructor(uiGameManager) {
        this.uiGameManager = uiGameManager;
    }

    createRegionCell(region, index) {
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.dataset.regionId = region.id;
        cell.dataset.region = String.fromCharCode(65 + region.id);

        this._applyRegionStyles(cell, region);
        this._buildRegionContent(cell, region);
        this._attachRegionEventListeners(cell, region);
        
        return cell;
    }

    _applyRegionStyles(cell, region) {
        // VERIFICAÇÃO DE ELIMINAÇÃO DO CONTROLADOR
        if (region.controller !== null) {
            const controllerPlayer = gameState.players[region.controller];
            if (controllerPlayer && controllerPlayer.eliminated) {
                cell.classList.add('eliminated-controlled');
            }
        }
        
        if (region.controller === gameState.currentPlayerIndex) {
            cell.classList.add('player-owned');
        }

        if (region.controller === null) {
            cell.classList.add('neutral-available');
        }

        const currentPlayer = this.uiGameManager.getCurrentPlayer?.();
        if (currentPlayer && region.controller === currentPlayer.id && region.explorationLevel > 0) {
            cell.classList.add('action-available', 'clickable');
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
            const rgb = Utils.hexToRgb(player.color);
            cell.style.setProperty('--player-rgb', rgb.join(', '));
            cell.style.setProperty('--player-color', player.color);
        } else {
            cell.classList.add('neutral');
        }
    }

    _buildRegionContent(cell, region) {
        const header = this._createRegionHeader(region);
        const resourcesLine = this._createResourcesLine(region);
        const footer = this._createRegionFooter(region);
        
        cell.appendChild(header);
        cell.appendChild(resourcesLine);
        cell.appendChild(footer);
    }

    _createRegionHeader(region) {
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
        return header;
    }

    _createResourcesLine(region) {
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
        
        resourcePairs.forEach((resource) => {
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
        
        return resourcesLine;
    }

    _createRegionFooter(region) {
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
        
        return footer;
    }

    _attachRegionEventListeners(cell, region) {
        cell.addEventListener('click', (e) => this._handleRegionClick(e, cell, region));
        
        // Tooltip events - delegados para o UIGameManager
        cell.addEventListener('mouseenter', (e) => this.uiGameManager.showRegionTooltip?.(region, e.currentTarget));
        cell.addEventListener('mousemove', (e) => this.uiGameManager.positionTooltip?.(e.currentTarget));
        cell.addEventListener('mouseleave', () => this.uiGameManager.hideRegionTooltip?.());
    }

    _handleRegionClick(e, cell, region) {
        e.stopPropagation();
        
        const regionId = Number(cell.dataset.regionId);
        const clickedInModal = e.target.closest('[id$="Modal"]') || 
                              e.target.closest('#negotiationModal') || 
                              e.target.closest('#negResponseModal');
        
        if (clickedInModal) return;
        
        this._toggleRegionSelection(regionId, cell);
        if (this.uiGameManager && this.uiGameManager.footerManager) {
            this.uiGameManager.footerManager.updateFooter();
        }
    
        if (this.uiGameManager && this.uiGameManager.sidebarManager) {
            this.uiGameManager.sidebarManager.renderSidebar(gameState.selectedPlayerForSidebar);
        }
    }

    _toggleRegionSelection(regionId, cell) {
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
    }
}
