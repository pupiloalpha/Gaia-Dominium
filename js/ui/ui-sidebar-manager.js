// ui-sidebar-manager.js - Gerenciamento da Sidebar
import { gameState, achievementsState } from '../state/game-state.js';
import { RESOURCE_ICONS, ACHIEVEMENTS_CONFIG } from '../state/game-config.js';
import { Utils } from '../utils/utils.js';
import { BIOME_EMOJIS } from './ui-constants.js';

export class SidebarManager {
    constructor(uiGameManager) {
        this.uiGameManager = uiGameManager;
        this.cacheSidebarElements();
    }

    cacheSidebarElements() {
        this.sidebarPlayerHeader = document.getElementById('sidebarPlayerHeader');
        this.resourceList = document.getElementById('resourceList');
        this.controlledRegions = document.getElementById('controlledRegions');
        this.achievementsList = document.getElementById('achievementsList');
    }

    renderSidebar(playerIndex = gameState.selectedPlayerForSidebar) {
        const player = gameState.players[playerIndex];
        if (!player) return;
        
        this._renderPlayerHeader(player);
        this._renderPlayerResources(player);
        this._renderControlledRegions(player);
        this._renderAchievementsInSidebar(playerIndex);
    }

    _renderPlayerHeader(player) {
        const isCurrentPlayer = player.id === gameState.currentPlayerIndex;
        const isEliminated = player.eliminated;
        const faction = player.faction;
        const factionColor = player.color;
        
        this.sidebarPlayerHeader.innerHTML = `
            <div class="flex items-center gap-3 p-2 rounded-lg" 
                 style="border-left: 4px solid ${isEliminated ? '#666666' : player.color}; 
                        background: rgba(${Utils.hexToRgb(isEliminated ? '#666666' : player.color).join(', ')}, 0.05)">
                <div class="text-3xl">${isEliminated ? '💀' : player.icon}</div>
                <div class="flex-1">
                    <div class="text-base font-semibold ${isEliminated ? 'text-gray-400 line-through' : 'text-white'}">
                        ${player.name} ${isEliminated ? '(ELIMINADO)' : ''}
                    </div>
                    <div class="text-xs text-gray-300 mb-1">
                        Jogador ${player.id + 1} ${isCurrentPlayer && !isEliminated ? '• 🎮 TURNO' : ''}
                        ${isEliminated ? '• 💀 ELIMINADO' : ''}
                    </div>
                    ${faction && !isEliminated ? `
                    <div class="text-xs font-medium flex items-center gap-1" style="color: ${factionColor}">
                        <span class="text-sm">${faction.icon || '🏛️'}</span>
                        <span>${faction.name}</span>
                    </div>
                    ` : ''}
                    ${isEliminated ? `
                    <div class="text-xs text-yellow-300 mt-1 flex items-center gap-1">
                        <span>⚡ Para ressuscitar:</span>
                        <span>Domine uma região neutra (custo: 2 PV + recursos do bioma)</span>
                    </div>
                    ` : ''}
                </div>
                <div class="text-2xl font-bold ${isEliminated ? 'text-gray-400' : 'text-yellow-400'}">
                    ${player.victoryPoints} PV
                </div>
            </div>
        `;
    }

    _renderPlayerResources(player) {
        const isEliminated = player.eliminated;
        this.resourceList.innerHTML = Object.entries(player.resources)
            .map(([key, value]) => `
                <li class="flex justify-between items-center py-0.5 ${isEliminated ? 'opacity-50' : ''}">
                    <span class="text-sm ${isEliminated ? 'text-gray-400' : 'text-gray-200'} flex items-center gap-1.5">
                        <span class="text-base">${RESOURCE_ICONS[key]}</span>
                        <span class="capitalize">${key}</span>
                    </span>
                    <span class="text-sm font-bold ${isEliminated ? 'text-gray-400' : 'text-white'}">${value}</span>
                </li>
            `).join('');
    }

    _renderControlledRegions(player) {
        if (player.regions.length === 0) {
            this.controlledRegions.innerHTML = `
                <div class="text-sm text-gray-400 italic">Nenhuma região controlada</div>
            `;
            return;
        }
        
        const regionsByBiome = {};
        player.regions.forEach(regionId => {
            const region = gameState.regions[regionId];
            if (!regionsByBiome[region.biome]) {
                regionsByBiome[region.biome] = [];
            }
            regionsByBiome[region.biome].push(region);
        });
        
        this.controlledRegions.innerHTML = Object.entries(regionsByBiome)
            .map(([biome, regions]) => {
                const regionLetters = regions.map(r => r.name.split(' ').pop());
                return `
                    <div class="mb-2">
                        <div class="text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1">
                            <span>${BIOME_EMOJIS[biome] || '🗺️'}</span>
                            <span>${biome}</span>
                            <span class="text-yellow-400">(${regions.length})</span>
                        </div>
                        <div class="flex flex-wrap gap-1">
                            ${regionLetters.map(letter => `
                                <span class="text-xs font-medium bg-white/5 px-1.5 py-0.5 rounded border border-white/10" 
                                      style="border-left: 3px solid ${player.color}">
                                    ${letter}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('');
    }

    _renderAchievementsInSidebar(playerIndex) {
        if (!this.achievementsList || !achievementsState) return;

        if (typeof achievementsState === 'undefined' || !achievementsState.playerAchievements) {
            this.achievementsList.innerHTML = '<p class="text-xs text-gray-400">Carregando conquistas...</p>';
            return;
        }
        
        const unlocked = achievementsState.unlockedAchievements?.[playerIndex] || [];
        
        if (unlocked.length === 0) {
            this.achievementsList.innerHTML = '<p class="text-xs text-gray-400">Nenhuma conquista ainda</p>';
            return;
        }
        
        let html = '';
        const achievementsToShow = unlocked.slice(0, 3);
        
        achievementsToShow.forEach(achievementId => {
            let achievement;
            for (const key in ACHIEVEMENTS_CONFIG) {
                if (ACHIEVEMENTS_CONFIG[key].id === achievementId) {
                    achievement = ACHIEVEMENTS_CONFIG[key];
                    break;
                }
            }
            
            if (achievement) {
                html += `
                    <div class="flex items-center gap-2 p-2 bg-gray-800/30 rounded border border-yellow-500/20">
                        <span class="text-lg">${achievement.icon}</span>
                        <div class="text-xs">
                            <div class="text-yellow-300 font-semibold">${achievement.name}</div>
                            <div class="text-gray-400 truncate">${achievement.description}</div>
                        </div>
                    </div>
                `;
            }
        });
        
        if (unlocked.length > 3) {
            html += `<div class="text-center text-xs text-gray-500 mt-1">
                +${unlocked.length - 3} mais conquistas
            </div>`;
        }
        
        this.achievementsList.innerHTML = html;
    }
}