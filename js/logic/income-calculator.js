// income-calculator.js - Calculadora de Renda do Jogo
import { 
  GAME_CONFIG, 
  BIOME_INCOME,
  STRUCTURE_INCOME,
  EXPLORATION_BONUS,
  EXPLORATION_SPECIAL_BONUS
} from '../state/game-config.js';

export class IncomeCalculator {
  constructor(gameLogic) {
    this.main = gameLogic;
  }

  // ==================== CÁLCULO DE RENDA ====================

  calculatePlayerIncome(player, gameState) {
    const income = { 
      madeira: 0, 
      pedra: 0, 
      ouro: 0, 
      agua: 0, 
      pv: 0 
    };

    // 1. Renda das regiões controladas
    player.regions.forEach(regionId => {
      const regionIncome = this._calculateRegionIncome(regionId, player, gameState);
      this._addIncome(income, regionIncome);
    });

    // 2. Bônus de diversidade de biomas
    const diversityBonus = this._calculateDiversityBonus(player, gameState);
    if (diversityBonus > 0) {
      income.pv += diversityBonus;
    }

    // 3. Bônus de facção
    if (this.main.factionLogic) {
      const factionBonus = this._applyFactionBonuses(player, income, gameState);
      this._addIncome(income, factionBonus);
    }

    // 4. Modificadores de evento
    if (this.main.eventManager) {
      this._applyEventModifiers(player, income, gameState);
    }

    return income;
  }

  _calculateRegionIncome(regionId, player, gameState) {
    const region = gameState.regions[regionId];
    if (!region) return {};

    const income = { 
      madeira: 0, 
      pedra: 0, 
      ouro: 0, 
      agua: 0, 
      pv: 0 
    };

    // A. Base do bioma
    const biomeBase = BIOME_INCOME[region.biome] || {};
    Object.keys(biomeBase).forEach(resource => {
      income[resource] += biomeBase[resource] || 0;
    });

    // B. Multiplicador de exploração
    const explorationMultiplier = EXPLORATION_BONUS[region.explorationLevel] || 1;
    ['madeira', 'pedra', 'ouro', 'agua'].forEach(resource => {
      income[resource] = Math.floor(income[resource] * explorationMultiplier);
    });

    // C. Bônus de exploração especial
    if (EXPLORATION_SPECIAL_BONUS[region.explorationLevel]) {
      const specialBonus = EXPLORATION_SPECIAL_BONUS[region.explorationLevel];
      
      if (specialBonus.collectBonus) {
        ['madeira', 'pedra', 'ouro', 'agua'].forEach(resource => {
          income[resource] = Math.floor(income[resource] * (1 + specialBonus.collectBonus));
        });
      }
    }

    // D. Estruturas
    region.structures.forEach(structure => {
      const structureIncome = STRUCTURE_INCOME[structure] || {};
      Object.entries(structureIncome).forEach(([key, value]) => {
        if (key === 'pv') {
          income.pv += value;
        } else {
          income[key] += value;
        }
      });
    });

    // E. Bônus de facção específica para bioma
    if (this.main.factionLogic) {
      const factionBiomeBonus = this._calculateFactionBiomeBonus(player, region);
      this._addIncome(income, factionBiomeBonus);
    }

    return income;
  }

  // ==================== BÔNUS DE DIVERSIDADE ====================

  _calculateDiversityBonus(player, gameState) {
    if (player.regions.length < 2) return 0;

    const biomes = new Set();
    player.regions.forEach(regionId => {
      const region = gameState.regions[regionId];
      if (region) {
        biomes.add(region.biome);
      }
    });

    // +1 PV por bioma único além do primeiro
    const uniqueBiomes = biomes.size;
    if (uniqueBiomes >= 4) {
      return GAME_CONFIG.DIVERSITY_BONUS_PV || 3;
    } else if (uniqueBiomes >= 3) {
      return 2;
    } else if (uniqueBiomes >= 2) {
      return 1;
    }

    return 0;
  }

  // ==================== FACÇÕES ====================

  _applyFactionBonuses(player, income, gameState) {
    if (!this.main.factionLogic) return {};

    const factionBonus = { 
      madeira: 0, 
      pedra: 0, 
      ouro: 0, 
      agua: 0, 
      pv: 0 
    };

    const bonuses = this.main.factionLogic.applyFactionBonuses(player);
    if (!bonuses || !bonuses.production) return factionBonus;

    // Aplicar bônus de produção
    Object.entries(bonuses.production).forEach(([resource, amount]) => {
      if (amount < 1 && amount > 0) {
        // Multiplicador (ex: +25%)
        factionBonus[resource] = Math.floor(income[resource] * amount);
      } else {
        // Bônus fixo
        factionBonus[resource] += amount;
      }
    });

    return factionBonus;
  }

  _calculateFactionBiomeBonus(player, region) {
    if (!this.main.factionLogic) return {};

    const faction = this.main.factionLogic.getPlayerFaction(player);
    if (!faction || !faction.abilities || !faction.abilities.biomeBonus) {
      return {};
    }

    const biomeBonus = faction.abilities.biomeBonus[region.biome];
    return biomeBonus || {};
  }

  // ==================== EVENTOS ====================

  _applyEventModifiers(player, income, gameState) {
    const eventManager = this.main.eventManager;
    if (!eventManager) return;

    // Aplicar modificadores de evento a cada recurso
    ['madeira', 'pedra', 'ouro', 'agua'].forEach(resource => {
      income[resource] = eventManager.applyEventModifier(resource, income[resource]);
    });

    // Bônus específicos de evento
    const eventModifiers = eventManager.getEventModifiers();
    
    if (eventModifiers.savanaBonus && this._playerControlsBiome(player, 'Savana', gameState)) {
      income.ouro += eventModifiers.savanaBonus;
    }

    if (eventModifiers.pantanoBonus && this._playerControlsBiome(player, 'Pântano', gameState)) {
      const pantanoRegions = player.regions.filter(id => 
        gameState.regions[id]?.biome === 'Pântano'
      );
      pantanoRegions.forEach(() => {
        income.agua = Math.floor(income.agua * eventModifiers.pantanoBonus);
      });
    }

    // Penalidades
    if (eventModifiers.savanaBloqueada && this._playerControlsBiome(player, 'Savana', gameState)) {
      income.ouro = 0;
    }
  }

  _playerControlsBiome(player, biome, gameState) {
    return player.regions.some(regionId => {
      const region = gameState.regions[regionId];
      return region && region.biome === biome;
    });
  }

  // ==================== UTILITÁRIOS ====================

  _addIncome(total, addition) {
    Object.keys(addition).forEach(key => {
      if (total[key] !== undefined) {
        total[key] += addition[key] || 0;
      }
    });
  }

  // ==================== FORMATAÇÃO ====================

  formatIncomeBreakdown(player, gameState) {
    const breakdown = {
      regions: [],
      total: { madeira: 0, pedra: 0, ouro: 0, agua: 0, pv: 0 }
    };

    player.regions.forEach(regionId => {
      const region = gameState.regions[regionId];
      if (!region) return;

      const regionIncome = this._calculateRegionIncome(regionId, player, gameState);
      
      breakdown.regions.push({
        name: region.name,
        biome: region.biome,
        explorationLevel: region.explorationLevel,
        structures: region.structures,
        income: regionIncome
      });

      this._addIncome(breakdown.total, regionIncome);
    });

    // Adicionar bônus de diversidade
    const diversityBonus = this._calculateDiversityBonus(player, gameState);
    if (diversityBonus > 0) {
      breakdown.diversityBonus = diversityBonus;
      breakdown.total.pv += diversityBonus;
    }

    // Adicionar resumo
    breakdown.summary = this._createIncomeSummary(breakdown.total, player);

    return breakdown;
  }

  _createIncomeSummary(totalIncome, player) {
    const summaries = [];
    
    if (totalIncome.madeira > 0) summaries.push(`${totalIncome.madeira} 🪵`);
    if (totalIncome.pedra > 0) summaries.push(`${totalIncome.pedra} 🪨`);
    if (totalIncome.ouro > 0) summaries.push(`${totalIncome.ouro} 🪙`);
    if (totalIncome.agua > 0) summaries.push(`${totalIncome.agua} 💧`);
    if (totalIncome.pv > 0) summaries.push(`${totalIncome.pv} ⭐`);
    
    return summaries.join(', ');
  }

  // ==================== DEBUG ====================

  getDebugInfo(player, gameState) {
    if (!player) return {};

    const income = this.calculatePlayerIncome(player, gameState);
    const breakdown = this.formatIncomeBreakdown(player, gameState);

    return {
      totalIncome: income,
      regionCount: player.regions.length,
      diversityBonus: this._calculateDiversityBonus(player, gameState),
      breakdownRegions: breakdown.regions.length,
      summary: breakdown.summary
    };
  }
}