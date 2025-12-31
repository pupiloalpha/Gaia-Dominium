// logic-dispute.js - Sistema de Disputa Territorial (Refatorado)
import { 
  gameState, 
  achievementsState, 
  addActivityLog, 
  getCurrentPlayer, 
  getPlayerById,
  addDisputeRecord
} from '../state/game-state.js';
import { GAME_CONFIG, STRUCTURE_EFFECTS } from '../state/game-config.js';

// ==================== SERVIÇO DE CÁLCULO ====================
class DisputeCalculator {
  static calculateCosts(player, region, factionLogic = null) {
    const defender = getPlayerById(region.controller);
    const baseCost = {
      pv: 3,
      madeira: 2,
      pedra: 2,
      ouro: 3,
      agua: 1
    };

    let modifiers = {
      exploration: Math.floor(region.explorationLevel * 0.5),
      structures: 0,
      defenderAdvantage: 0
    };

    region.structures.forEach(structure => {
      if (structure === 'Torre de Vigia') modifiers.structures += 2;
      else if (structure === 'Santuário') modifiers.structures += 1;
    });

    const pvDifference = defender.victoryPoints - player.victoryPoints;
    if (pvDifference > 0) {
      modifiers.defenderAdvantage = Math.floor(pvDifference * 0.1);
    }

    const finalCost = {
      pv: Math.max(1, Math.floor(baseCost.pv + modifiers.exploration + modifiers.structures + modifiers.defenderAdvantage)),
      madeira: baseCost.madeira,
      pedra: baseCost.pedra,
      ouro: baseCost.ouro,
      agua: baseCost.agua
    };

    if (factionLogic) {
      const factionModifier = factionLogic.modifyDisputeCost(player, finalCost, region);
      Object.assign(finalCost, factionModifier);
    }

    finalCost.pv = Math.max(1, Math.floor(finalCost.pv));
    finalCost.madeira = Math.max(1, Math.floor(finalCost.madeira));
    finalCost.pedra = Math.max(1, Math.floor(finalCost.pedra));
    finalCost.ouro = Math.max(1, Math.floor(finalCost.ouro));
    finalCost.agua = Math.max(0, Math.floor(finalCost.agua));

    return {
      baseCost,
      modifiers,
      finalCost,
      successChance: this.calculateSuccessChance(player, defender, region, finalCost, factionLogic)
    };
  }

  static calculateSuccessChance(attacker, defender, region, disputeCost, factionLogic = null) {
    let baseChance = 50;

    const pvDiff = attacker.victoryPoints - defender.victoryPoints;
    if (pvDiff > 0) {
      baseChance += Math.min(20, pvDiff * 2);
    }

    const resourceBonus = Math.min(15, 
      (disputeCost.madeira - 1) * 2 +
      (disputeCost.pedra - 1) * 2 +
      (disputeCost.ouro - 1) * 3 +
      disputeCost.agua * 1
    );
    baseChance += resourceBonus;

    if (region.explorationLevel > 0) {
      baseChance += region.explorationLevel * 5;
    }

    if (region.structures.includes('Torre de Vigia')) baseChance -= 15;
    if (region.structures.includes('Santuário')) baseChance -= 10;

    if (pvDiff < 0) {
      baseChance += Math.max(-30, pvDiff * 1.5);
    }

    if (factionLogic) {
      const factionDefense = factionLogic.getDefenseBonus(defender, region);
      baseChance -= factionDefense;
    }

    return Math.max(10, Math.min(90, baseChance));
  }
}

// ==================== SERVIÇO DE EXECUÇÃO ====================
class DisputeExecutor {
  static async executeSuccessfulDispute(attacker, defender, region, disputeData, gameLogic) {
    defender.regions = defender.regions.filter(id => id !== region.id);
    attacker.regions.push(region.id);
    region.controller = attacker.id;
    region.explorationLevel = Math.max(0, region.explorationLevel - 1);

    if (region.structures.length > 0) {
      region.structures = region.structures.filter(() => Math.random() > 0.5);
    }

    attacker.victoryPoints += 1;
    achievementsState.totalDisputes = (achievementsState.totalDisputes || 0) + 1;
    achievementsState.successfulDisputes = (achievementsState.successfulDisputes || 0) + 1;

    gameLogic.main.showFeedback(`✅ Vitória! Você conquistou ${region.name}! +1 PV`, 'success');
    addActivityLog({
      type: 'dispute',
      playerName: attacker.name,
      action: 'conquistou',
      details: `${region.name} de ${defender.name}`,
      turn: gameState.turn,
      success: true
    });

    if (defender.regions.length === 0) {
      this._handlePlayerElimination(defender, gameLogic);
    }
    
    this._updateRegionVisual(region.id);
  }

  static async executeFailedDispute(attacker, defender, region, disputeData, gameLogic) {
    defender.victoryPoints += 1;
    region.explorationLevel = Math.min(3, region.explorationLevel + 1);

    achievementsState.totalDisputes = (achievementsState.totalDisputes || 0) + 1;
    achievementsState.failedDisputes = (achievementsState.failedDisputes || 0) + 1;

    gameLogic.main.showFeedback(
      `❌ Falha! ${defender.name} defendeu ${region.name}. -1 PV para você, +1 PV para ${defender.name}`, 
      'error'
    );
    
    addActivityLog({
      type: 'dispute',
      playerName: attacker.name,
      action: 'falhou em conquistar',
      details: `${region.name} de ${defender.name}`,
      turn: gameState.turn,
      success: false
    });
  }

  static _handlePlayerElimination(player, gameLogic) {
    const eliminated = window.gameState?.eliminatePlayer?.(player.id);
    
    if (eliminated) {
      addActivityLog({
        type: 'elimination',
        playerName: 'SISTEMA',
        action: 'eliminou',
        details: `${player.name} (perdeu todas as regiões)`,
        turn: gameState.turn,
        isEvent: true
      });

      const victoryCheck = window.gameState?.checkEliminationVictory?.();
      if (victoryCheck) {
        this._handleEliminationVictory(victoryCheck, gameLogic);
      }
    }
  }

  static _handleEliminationVictory(victoryCheck, gameLogic) {
    if (victoryCheck.type === 'elimination_victory') {
      gameLogic.main.turnLogic._declareVictory(victoryCheck.winner);
    } else if (victoryCheck.type === 'no_winner') {
      gameLogic.main.showFeedback(victoryCheck.message, 'warning');
      if (window.uiManager?.modals?.showNoWinnerModal) {
        window.uiManager.modals.showNoWinnerModal();
      }
    }
  }

  static _updateRegionVisual(regionId) {
    const cell = document.querySelector(`.board-cell[data-region-id="${regionId}"]`);
    if (cell && window.uiManager && window.uiManager.gameManager) {
      const region = gameState.regions[regionId];
      const newCell = window.uiManager.gameManager.createRegionCell(region, regionId);
      
      const parent = cell.parentNode;
      parent.replaceChild(newCell, cell);
      
      newCell.classList.add('region-updated');
      setTimeout(() => newCell.classList.remove('region-updated'), 1000);
    }
  }
}

// ==================== CLASSE PRINCIPAL (FACHADA) ====================
export class DisputeLogic {
  constructor(gameLogic) {
    this.main = gameLogic;
    this.calculator = DisputeCalculator;
    this.executor = DisputeExecutor;
  }

  // ==================== VALIDAÇÃO ====================
  
  validateDispute() {
    const currentPhase = gameState.currentPhase;
    if (currentPhase !== 'acoes') {
      this.main.showFeedback('Disputas só podem ser realizadas na fase de ações.', 'warning');
      return false;
    }

    if (gameState.actionsLeft <= 0) {
      this.main.showFeedback('Sem ações restantes neste turno.', 'warning');
      return false;
    }

    if (gameState.selectedRegionId === null) {
      this.main.showFeedback('Selecione uma região para disputar.', 'error');
      return false;
    }

    const region = gameState.regions[gameState.selectedRegionId];
    const currentPlayer = getCurrentPlayer();

    if (region.controller === null) {
      this.main.showFeedback('Esta região não possui dominador.', 'error');
      return false;
    }

    if (region.controller === currentPlayer.id) {
      this.main.showFeedback('Você já domina esta região.', 'error');
      return false;
    }

    if (!this.canAffordDispute(currentPlayer)) {
      this.main.showFeedback('Recursos insuficientes para iniciar disputa.', 'error');
      return false;
    }

    return true;
  }

  // ==================== CÁLCULOS ====================
  
  calculateDisputeCosts(player, region) {
    return this.calculator.calculateCosts(player, region, this.main.factionLogic);
  }

  calculateSuccessChance(player, defender, region, disputeCost) {
    return this.calculator.calculateSuccessChance(
      player, defender, region, disputeCost, this.main.factionLogic
    );
  }

  canAffordDispute(player) {
    return player.victoryPoints >= 3 && 
           player.resources.ouro >= 2 &&
           player.resources.madeira >= 1 &&
           player.resources.pedra >= 1;
  }

  // ==================== EXECUÇÃO PRINCIPAL ====================
  
  async handleDispute(region, attacker) {
    if (gameState.actionsLeft <= 0) {
      this.main.showFeedback('Sem ações restantes neste turno.', 'warning');
      return;
    }
    
    if (attacker.eliminated) {
      this.main.showFeedback('Jogador eliminado não pode disputar.', 'error');
      return;
    }
    
    const defender = getPlayerById(region.controller);
    const disputeData = this.calculateDisputeCosts(attacker, region);
    
    if (attacker.victoryPoints < disputeData.finalCost.pv) {
      this.main.showFeedback(`PV insuficientes para iniciar a disputa (necessário: ${disputeData.finalCost.pv}).`, 'error');
      return;
    }
    
    const canPay = Object.entries(disputeData.finalCost).every(([resource, amount]) => {
      if (resource === 'pv') return true;
      return (attacker.resources[resource] || 0) >= amount;
    });
    
    if (!canPay) {
      this.main.showFeedback('Recursos insuficientes para iniciar a disputa.', 'error');
      return;
    }
    
    if (!this._consumeAction()) return;
    
    this._payDisputeCosts(attacker, disputeData.finalCost);
    
    const success = Math.random() * 100 < disputeData.successChance;
    
    if (success) {
      await this.executor.executeSuccessfulDispute(attacker, defender, region, disputeData, this);
    } else {
      await this.executor.executeFailedDispute(attacker, defender, region, disputeData, this);
    }
    
    this._finalizeDispute();
    this.main.turnLogic?.checkVictory();
  }

  // ==================== MÉTODOS AUXILIARES ====================
  
  _consumeAction() {
    if (gameState.actionsLeft <= 0) return false;
    
    gameState.actionsLeft--;
    this._updateUI();
    return true;
  }
  
  _payDisputeCosts(player, finalCost) {
    player.victoryPoints -= finalCost.pv;
    Object.entries(finalCost).forEach(([resource, amount]) => {
      if (resource !== 'pv' && amount > 0) {
        player.resources[resource] = Math.max(0, (player.resources[resource] || 0) - amount);
      }
    });
  }
  
  _finalizeDispute() {
    gameState.selectedRegionId = null;
    addDisputeRecord(
      getCurrentPlayer().id,
      gameState.regions[gameState.selectedRegionId]?.controller,
      gameState.selectedRegionId,
      true,
      {}
    );
  }
  
  _updateUI() {
    if (window.uiManager && window.uiManager.gameManager) {
      setTimeout(() => window.uiManager.gameManager.updateFooter(), 10);
    }
  }
  
  // ==================== MÉTODOS PARA IA ====================
  
  getDisputeOpportunities(player, gameState) {
    const opportunities = [];
    const gridSize = GAME_CONFIG.GRID_SIZE;
    
    player.regions.forEach(controlledId => {
      const row = Math.floor(controlledId / gridSize);
      const col = controlledId % gridSize;
      
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          
          const newRow = row + dr;
          const newCol = col + dc;
          
          if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
            const regionId = newRow * gridSize + newCol;
            const region = gameState.regions[regionId];
            
            if (!region || region.controller === null || region.controller === player.id) continue;
            
            const defender = gameState.players[region.controller];
            const disputeData = this.calculateDisputeCosts(player, region);
            const score = this._evaluateDisputeScore(player, defender, region, disputeData);
            
            opportunities.push({
              regionId,
              defenderId: defender.id,
              disputeData,
              score,
              validation: this._validateDisputeForAI(player, region, disputeData)
            });
          }
        }
      }
    });
    
    return opportunities.sort((a, b) => b.score - a.score);
  }
  
  _evaluateDisputeScore(player, defender, region, disputeData) {
    let score = 0;
    
    const regionValue = this._calculateRegionValue(region);
    score += regionValue * 2;
    score += disputeData.successChance * 0.5;
    
    if (player.regions.length < 4) score += 20;
    if (defender.victoryPoints > player.victoryPoints + 5) score += 15;
    
    const resourceCost = Object.values(disputeData.finalCost).reduce((a, b) => a + b, 0);
    score -= resourceCost * 0.3;
    
    return score;
  }
  
  _calculateRegionValue(region) {
    let value = 0;
    
    Object.values(region.resources).forEach(resource => {
      value += resource;
    });
    
    if (region.structures.length > 0) {
      value += region.structures.length * 5;
    }
    
    value += region.explorationLevel * 3;
    
    return value;
  }
  
  _validateDisputeForAI(player, region, disputeData) {
    if (player.victoryPoints < disputeData.finalCost.pv) return 'insufficient_pv';
    
    const canPay = Object.entries(disputeData.finalCost).every(([resource, amount]) => {
      if (resource === 'pv') return true;
      return (player.resources[resource] || 0) >= amount;
    });
    
    return canPay ? 'ready' : 'insufficient_resources';
  }
}