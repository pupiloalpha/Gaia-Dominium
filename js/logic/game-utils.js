// game-utils.js - Utilitários do Jogo
import { GAME_CONFIG, UI_CONSTANTS } from '../state/game-config.js';

export class GameUtils {
  // ==================== MANIPULAÇÃO DE RECURSOS ====================

  static addResources(player, resources) {
    if (!player || !resources) return player;
    
    Object.keys(resources).forEach(resource => {
      if (player.resources[resource] !== undefined) {
        player.resources[resource] += resources[resource];
      } else {
        player.resources[resource] = resources[resource];
      }
    });
    
    return player;
  }

  static subtractResources(player, resources) {
    if (!player || !resources) return player;
    
    Object.keys(resources).forEach(resource => {
      if (player.resources[resource] !== undefined) {
        player.resources[resource] = Math.max(0, player.resources[resource] - resources[resource]);
      }
    });
    
    return player;
  }

  static hasResources(player, resources) {
    if (!player || !resources) return false;
    
    return Object.keys(resources).every(resource => {
      return (player.resources[resource] || 0) >= resources[resource];
    });
  }

  // ==================== FORMATAÇÃO ====================

  static formatResourceAmount(resource, amount) {
    const icons = GAME_CONFIG.RESOURCE_ICONS || {};
    const icon = icons[resource] || '';
    
    return `${icon} ${amount} ${resource}`;
  }

  static formatActionCost(actionType) {
    const costs = UI_CONSTANTS.ACTION_COSTS || {};
    const actionCost = costs[actionType];
    
    if (!actionCost) return '';
    
    return Object.entries(actionCost)
      .map(([resource, amount]) => this.formatResourceAmount(resource, amount))
      .join(', ');
  }

  static formatPlayerStatus(player) {
    if (!player) return 'Desconhecido';
    
    const statusIcons = UI_CONSTANTS.PLAYER_STATUS || {};
    
    if (player.eliminated) {
      return `${statusIcons.ELIMINATED || '💀'} ${player.name}`;
    }
    
    // Verificar se é o jogador atual
    const isCurrent = window.gameState?.currentPlayerIndex === player.id;
    if (isCurrent) {
      return `${statusIcons.CURRENT_TURN || '🎮'} ${player.name}`;
    }
    
    return `${statusIcons.DEFAULT || '🏹'} ${player.name}`;
  }

  // ==================== CÁLCULOS ====================

  static calculateDistance(regionId1, regionId2, gridSize = GAME_CONFIG.GRID_SIZE) {
    if (regionId1 === null || regionId2 === null) return Infinity;
    
    const row1 = Math.floor(regionId1 / gridSize);
    const col1 = regionId1 % gridSize;
    const row2 = Math.floor(regionId2 / gridSize);
    const col2 = regionId2 % gridSize;
    
    return Math.abs(row1 - row2) + Math.abs(col1 - col2);
  }

  static calculateAdjacentRegions(regionId, gridSize = GAME_CONFIG.GRID_SIZE) {
    const adjacent = [];
    const row = Math.floor(regionId / gridSize);
    const col = regionId % gridSize;
    
    // Direções: cima, direita, baixo, esquerda
    const directions = [
      [-1, 0], [0, 1], [1, 0], [0, -1]
    ];
    
    directions.forEach(([dr, dc]) => {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
        adjacent.push(newRow * gridSize + newCol);
      }
    });
    
    return adjacent;
  }

  // ==================== RANDOM ====================

  static getRandomElement(array) {
    if (!array || array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
  }

  static getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static getRandomResourceWeighted() {
    const resources = ['madeira', 'pedra', 'ouro', 'agua'];
    const weights = [0.4, 0.3, 0.2, 0.1]; // madeira mais comum, ouro mais raro
    
    const rand = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < resources.length; i++) {
      cumulative += weights[i];
      if (rand <= cumulative) {
        return resources[i];
      }
    }
    
    return resources[0];
  }

  // ==================== VALIDAÇÃO ====================

  static isValidRegionId(regionId) {
    return regionId !== null && 
           regionId !== undefined && 
           Number.isInteger(regionId) && 
           regionId >= 0;
  }

  static isValidPlayerId(playerId) {
    return playerId !== null && 
           playerId !== undefined && 
           Number.isInteger(playerId) && 
           playerId >= 0;
  }

  // ==================== TEMPO ====================

  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // ==================== DEBUG ====================

  static logPerformance(label, startTime) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    
    if (duration > 100) {
      console.warn(`⚠️ ${label} demorou ${duration.toFixed(2)}ms (acima de 100ms)`);
    }
    
    return duration;
  }

  static createBenchmark(fn, iterations = 1000) {
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const averageTime = totalTime / iterations;
    
    return {
      totalTime,
      averageTime,
      iterations,
      opsPerSecond: 1000 / averageTime
    };
  }
}