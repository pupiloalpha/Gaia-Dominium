// logic-factions.js - Sistema de Habilidades por Facção
import { gameState, getCurrentPlayer, addActivityLog } from '../state/game-state.js';
import { FACTION_ABILITIES } from '../state/game-config.js';

class FactionLogic {
  constructor(gameLogic) {
    this.main = gameLogic;
  }

  // ==================== APLICAÇÃO DE HABILIDADES ====================

  applyFactionBonuses(player) {
    if (!player.faction) return;
    
    const bonuses = {
      production: {},
      discounts: {},
      special: []
    };

    // 1. Bônus de bioma
    this.applyBiomeBonuses(player, bonuses);
    
    // 2. Multiplicadores globais
    this.applyGlobalMultipliers(player, bonuses);
    
    // 3. Bônus especiais
    this.applySpecialAbilities(player, bonuses);
    
    return bonuses;
  }

  applyBiomeBonuses(player, bonuses) {
    const faction = player.faction;
    if (!faction.abilities.biomeBonus) return;
    
    player.regions.forEach(regionId => {
      const region = gameState.regions[regionId];
      if (!region) return;
      
      const biomeBonus = faction.abilities.biomeBonus[region.biome];
      if (biomeBonus) {
        Object.keys(biomeBonus).forEach(resource => {
          bonuses.production[resource] = (bonuses.production[resource] || 0) + biomeBonus[resource];
        });
        
        // Registrar no log
        addActivityLog({
          type: 'faction',
          playerName: player.name,
          action: 'recebeu bônus de bioma',
          details: `${region.biome}: +${JSON.stringify(biomeBonus)}`,
          turn: gameState.turn
        });
      }
    });
  }

  applyGlobalMultipliers(player, bonuses) {
    const faction = player.faction;
    if (!faction.abilities.globalProductionMultiplier) return;
    
    Object.keys(faction.abilities.globalProductionMultiplier).forEach(resource => {
      const multiplier = faction.abilities.globalProductionMultiplier[resource];
      // Multiplicador será aplicado durante cálculo de renda
      bonuses.production[resource] = (bonuses.production[resource] || 0) + multiplier;
    });
  }

  applySpecialAbilities(player, bonuses) {
    const faction = player.faction;
    
    // Mercadores do Deserto: Ouro por região
    if (faction.abilities.goldPerRegion) {
      const goldBonus = player.regions.length * faction.abilities.goldPerRegion;
      bonuses.production.ouro = (bonuses.production.ouro || 0) + goldBonus;
    }
    
    // Navegadores dos Mares: Coleta bônus em água
    if (faction.abilities.waterCollectBonus) {
      bonuses.special.push('waterCollectBonus');
    }
    
    // Construtores da Montanha: Bônus de PV em estruturas
    if (faction.abilities.structurePVBonus) {
      bonuses.special.push('structurePVBonus');
    }
  }

  // ==================== MODIFICAÇÃO DE AÇÕES ====================

  modifyExploreCost(player, baseCost) {
    if (!player.faction) return baseCost;
    
    const modifiedCost = { ...baseCost };
    const faction = player.faction;
    
    // Druidas da Floresta: -1 Madeira para explorar
    if (faction.abilities.exploreDiscount) {
      Object.keys(faction.abilities.exploreDiscount).forEach(resource => {
        const discount = faction.abilities.exploreDiscount[resource];
        if (modifiedCost[resource]) {
          modifiedCost[resource] = Math.max(0, modifiedCost[resource] - discount);
        }
      });
    }
    
    return modifiedCost;
  }

  modifyBuildCost(player, baseCost) {
    if (!player.faction) return baseCost;
    
    const modifiedCost = { ...baseCost };
    const faction = player.faction;
    
    // Construtores da Montanha: -1 Pedra para construir
    if (faction.abilities.buildDiscount) {
      Object.keys(faction.abilities.buildDiscount).forEach(resource => {
        const discount = faction.abilities.buildDiscount[resource];
        if (modifiedCost[resource]) {
          modifiedCost[resource] = Math.max(0, modifiedCost[resource] - discount);
        }
      });
    }
    
    return modifiedCost;
  }

  modifyNegotiationCost(player) {
    if (!player.faction) return 1; // Custo padrão: 1 Ouro
    
    const faction = player.faction;
    
    // Navegadores dos Mares: Primeira negociação gratuita por turno
    if (faction.abilities.freeNegotiationPerTurn && 
        player.turnBonuses.freeNegotiationAvailable > 0) {
      player.turnBonuses.freeNegotiationAvailable--;
      addActivityLog({
        type: 'faction',
        playerName: player.name,
        action: 'usou negociação gratuita',
        details: `Restantes: ${player.turnBonuses.freeNegotiationAvailable}`,
        turn: gameState.turn
      });
      return 0;
    }
    
    return 1;
  }

  getNegotiationCost(player) {
  if (!player.faction) return 1;
  if (player.turnBonuses?.freeNegotiationAvailable > 0) return 0;
  return 1;
}
consumeNegotiationCost(player) {
  const cost = this.getNegotiationCost(player);
  if (cost === 0 && player.turnBonuses && player.turnBonuses.freeNegotiationAvailable > 0) {
    player.turnBonuses.freeNegotiationAvailable--;
    addActivityLog({ /* ... */});
  }
  return cost;
}

  // ==================== BÔNUS EM AÇÕES ====================

  applyExploreBonus(player, region) {
    if (!player.faction) return null;
    
    const faction = player.faction;
    const bonus = {};
    
    // Druidas da Floresta: +1 Madeira ao explorar florestas
    if (faction.abilities.exploreDiscount && 
        (region.biome === 'Floresta Tropical' || region.biome === 'Floresta Temperada')) {
      bonus.madeira = 1;
    }
    
    // Mercadores do Deserto: Chance extra de ouro
    if (faction.abilities.goldExplorationBonus && Math.random() < faction.abilities.goldExplorationBonus) {
      bonus.ouro = 1;
      this.main.showFeedback(`${player.name} encontrou ouro extra (habilidade de facção)!`, 'success');
    }
    
    return Object.keys(bonus).length > 0 ? bonus : null;
  }

  applyCollectBonus(player, region) {
    if (!player.faction) return null;
    
    const faction = player.faction;
    const bonus = {};
    
    // Navegadores dos Mares: Bônus em regiões com água
    if (faction.abilities.waterCollectBonus && 
        (region.biome === 'Pântano' || region.resources.agua > 2)) {
      // Adiciona 1 recurso aleatório da região
      const availableResources = Object.keys(region.resources)
        .filter(r => region.resources[r] > 0);
      
      if (availableResources.length > 0) {
        const randomResource = availableResources[Math.floor(Math.random() * availableResources.length)];
        bonus[randomResource] = 1;
      }
    }
    
    return Object.keys(bonus).length > 0 ? bonus : null;
  }

  applyBuildBonus(player, structureType) {
    if (!player.faction) return { pv: 0 };
    
    const faction = player.faction;
    const bonus = { pv: 0 };
    
    // Construtores da Montanha: +1 PV por estrutura
    if (faction.abilities.structurePVBonus) {
      bonus.pv = faction.abilities.structurePVBonus;
    }
    
    return bonus;
  }

  applyNegotiationBonus(player) {
    if (!player.faction) return { pv: 0 };
    
    const faction = player.faction;
    const bonus = { pv: 0 };
    
    // Mercadores do Deserto: +1 PV por negociação bem-sucedida
    if (faction.abilities.negotiationPVBonus) {
      bonus.pv = faction.abilities.negotiationPVBonus;
    }
    
    return bonus;
  }

  // ==================== RESET DE TURNO ====================

  resetTurnBonuses(player) {
    if (!player.faction) return;
    
    const faction = player.faction;
    
    // Resetar contadores de habilidades por turno
    player.turnBonuses = {
      freeNegotiationAvailable: faction.abilities.freeNegotiationPerTurn || 0,
      buildDiscountUsed: false
    };
  }

  // ==================== UI E INFORMAÇÕES ====================

  getFactionInfo(playerIndex) {
    const player = gameState.players[playerIndex];
    if (!player || !player.faction) return null;
    
    return {
      name: player.faction.name,
      description: player.faction.description,
      abilities: player.faction.abilities,
      color: player.color,
      currentBonuses: player.turnBonuses
    };
  }

  getFactionSummary() {
    return gameState.players.map((player, index) => ({
      playerName: player.name,
      faction: player.faction?.name || 'Sem facção',
      abilities: player.faction?.abilities ? Object.keys(player.faction.abilities) : [],
      color: player.color
    }));
  }
}

export { FactionLogic };
