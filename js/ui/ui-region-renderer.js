// ui-region-renderer.js - Renderização de células do tabuleiro (Corrigido)
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
        cell.dataset.region = String.fromCharCode(65 + (region.id % 26)); // A-Z

        this._applyRegionStyles(cell, region);
        this._buildRegionContent(cell, region);
        this._attachRegionEventListeners(cell, region);
        
        return cell;
    }

    _applyRegionStyles(cell, region) {
        // Classes base
        cell.classList.add('relative', 'rounded-lg', 'p-2', 'text-white', 'transition-all', 
                          'duration-300', 'border', 'border-white/10', 'min-h-[100px]');
        
        // Verificar se região tem controlador
        if (region.controller !== null && region.controller !== undefined) {
            const controllerPlayer = gameState.players[region.controller];
            if (controllerPlayer) {
                if (controllerPlayer.eliminated) {
                    cell.classList.add('eliminated-controlled', 'opacity-60');
                } else {
                    cell.classList.add('controlled');
                    const rgb = Utils.hexToRgb(controllerPlayer.color);
                    cell.style.setProperty('--player-rgb', rgb.join(', '));
                    cell.style.setProperty('--player-color', controllerPlayer.color);
                    cell.style.backgroundColor = `rgba(${rgb.join(', ')}, 0.1)`;
                    cell.style.borderLeftColor = controllerPlayer.color;
                    cell.style.borderLeftWidth = '4px';
                }
                
                // Marcar se é do jogador atual
                if (region.controller === gameState.currentPlayerIndex) {
                    cell.classList.add('player-owned');
                    cell.classList.add('ring-2', 'ring-yellow-400/50');
                }
            }
        } else {
            // Região neutra
            cell.classList.add('neutral-available', 'neutral');
            cell.style.backgroundColor = 'rgba(75, 85, 99, 0.2)';
        }

        // Marcar se está selecionada
        if (gameState.selectedRegionId === region.id) {
            cell.classList.add('region-selected');
            cell.classList.add('ring-2', 'ring-blue-400', 'scale-[1.02]');
        }

        // Adicionar contador de ações se houver ações disponíveis
        if (gameState.actionsLeft > 0) {
            const actionCounter = document.createElement('div');
            actionCounter.className = 'absolute top-1 right-1 text-xs bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center';
            actionCounter.textContent = `${gameState.actionsLeft}`;
            cell.appendChild(actionCounter);
        }
    }

    _buildRegionContent(cell, region) {
        // Header com nome e bioma
        const header = document.createElement('div');
        header.className = 'flex items-start justify-between mb-1';
        header.innerHTML = `
            <div class="flex-1">
                <div class="text-xs font-bold text-white leading-tight truncate">${region.name || 'Região'}</div>
                <div class="text-[9px] text-gray-300 mt-0.5">${region.biome || 'Bioma'}</div>
            </div>
            <div class="text-xs text-yellow-300 font-bold flex items-center gap-0.5">
                ${region.explorationLevel || 0}<span class="text-[10px]">⭐</span>
            </div>
        `;
        cell.appendChild(header);

        // Linha de recursos
        const resourcesLine = document.createElement('div');
        resourcesLine.className = 'flex items-center justify-between gap-1 mt-2';
        
        const resourceOrder = ['madeira', 'pedra', 'ouro', 'agua'];
        let hasResources = false;
        
        resourceOrder.forEach(key => {
            const value = region.resources?.[key] || 0;
            if (value > 0) {
                hasResources = true;
                const pair = document.createElement('div');
                pair.className = 'flex items-center gap-0.5 flex-1 justify-center';
                pair.innerHTML = `
                    <span class="text-xs">${RESOURCE_ICONS[key] || '📦'}</span>
                    <span class="text-xs font-bold text-white">${value}</span>
                `;
                resourcesLine.appendChild(pair);
            }
        });
        
        if (!hasResources) {
            const placeholder = document.createElement('div');
            placeholder.className = 'text-[9px] text-gray-400 italic flex-1 text-center';
            placeholder.textContent = 'Sem recursos';
            resourcesLine.appendChild(placeholder);
        }
        
        cell.appendChild(resourcesLine);

        // Footer com controlador e estruturas
        const footer = document.createElement('div');
        footer.className = 'flex items-center justify-between mt-2 pt-1 border-t border-white/5';
        
        const controller = region.controller !== null && region.controller !== undefined
            ? gameState.players[region.controller]?.icon || '❓'
            : '<span class="text-gray-400 text-xs">🏳️</span>';

        let structureDisplay = '—';
        if (region.structures && region.structures.length > 0) {
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
        
        cell.appendChild(footer);
    }

    _attachRegionEventListeners(cell, region) {
        cell.addEventListener('click', (e) => this._handleRegionClick(e, cell, region));
        
        // Tooltip events
        cell.addEventListener('mouseenter', (e) => {
            if (this.uiGameManager?.showRegionTooltip) {
                this.uiGameManager.showRegionTooltip(region, e.currentTarget);
            }
        });
        
        cell.addEventListener('mouseleave', () => {
            if (this.uiGameManager?.hideRegionTooltip) {
                this.uiGameManager.hideRegionTooltip();
            }
        });
    }

    _handleRegionClick(e, cell, region) {
        e.stopPropagation();
        
        const regionId = Number(cell.dataset.regionId);
        const clickedInModal = e.target.closest('[id$="Modal"]') || 
                              e.target.closest('#negotiationModal') || 
                              e.target.closest('#negResponseModal');
        
        if (clickedInModal) return;
        
        this._toggleRegionSelection(regionId, cell);
        
        // Atualizar UI
        if (this.uiGameManager?.footerManager?.updateFooter) {
            this.uiGameManager.footerManager.updateFooter();
        }
    
        if (this.uiGameManager?.sidebarManager?.renderSidebar) {
            this.uiGameManager.sidebarManager.renderSidebar(gameState.selectedPlayerForSidebar);
        }
    }

    _toggleRegionSelection(regionId, cell) {
        if (gameState.selectedRegionId === regionId) {
            gameState.selectedRegionId = null;
            cell.classList.remove('region-selected', 'ring-2', 'ring-blue-400', 'scale-[1.02]');
        } else {
            const previousSelected = gameState.selectedRegionId;
            gameState.selectedRegionId = regionId;
            
            if (previousSelected !== null) {
                const prevCell = document.querySelector(`.board-cell[data-region-id="${previousSelected}"]`);
                if (prevCell) {
                    prevCell.classList.remove('region-selected', 'ring-2', 'ring-blue-400', 'scale-[1.02]');
                }
            }
            
            cell.classList.add('region-selected', 'ring-2', 'ring-blue-400', 'scale-[1.02]');
        }
    }
}