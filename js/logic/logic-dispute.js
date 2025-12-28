// logic-dispute.js - Sistema de Disputa Territorial (Refatorado)
import { 
  gameState, 
  achievementsState, 
  addActivityLog, 
  getCurrentPlayer, 
  getPlayerById 
} from '../state/game-state.js';
import { GAME_CONFIG } from '../state/game-config.js';
import { ActionValidator } from './action-validator.js';

export class DisputeLogic {
  constructor(gameLogic) {
    this.main = gameLogic;
    this.validator = new ActionValidator(gameLogic);
  }

  // ==================== VALIDAÇÃO SIMPLIFICADA ====================
  
  validateDispute() {
    const regionId = gameState.selectedRegionId;
    const validation = this.validator.validateAction('disputar', regionId);
    
    if (!validation.valid) {
      this.main.showFeedback(validation.reason, 'error');
      return false;
    }
    
    const player = getCurrentPlayer();
    if (!this.canAffordDispute(player)) {
      this.main.showFeedback('Recursos insuficientes para iniciar disputa.', 'error');
      return false;
    }
    
    return true;
  }

  // ==================== LÓGICA PRINCIPAL ====================
  
  async handleDispute(region, attacker) {
    if (!this.validateDispute()) return;
    
    const defender = getPlayerById(region.controller);
    const disputeData = this.calculateDisputeCosts(attacker, region);
    
    // Verificação final de recursos
    if (!this._canPayDisputeCosts(attacker, disputeData.finalCost)) {
      this.main.showFeedback('Recursos insuficientes para iniciar a disputa.', 'error');
      return;
    }
    
    if (!this.consumeAction()) return;
    
    // Pagar custos
    this._payDisputeCosts(attacker, disputeData.finalCost);
    
    // Determinar resultado
    const success = Math.random() * 100 < disputeData.successChance;
    
    if (success) {
      await this._handleSuccessfulDispute(attacker, defender, region, disputeData);
    } else {
      await this._handleFailedDispute(attacker, defender, region, disputeData);
    }
    
    this._updateRegionVisual(region.id);
    this._finalizeDispute();
    
    if (this.main?.turnLogic?.checkVictory) {
      this.main.turnLogic.checkVictory();
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================
  
  consumeAction() {
    if (gameState.actionsLeft <= 0) return false;
    
    gameState.actionsLeft--;
    
    if (window.uiManager?.gameManager) {
      setTimeout(() => window.uiManager.gameManager.updateFooter(), 10);
    }
    
    return true;
  }
  
  canAffordDispute(player) {
    return player.victoryPoints >= 3 && 
           player.resources.ouro >= 2 &&
           player.resources.madeira >= 1 &&
           player.resources.pedra >= 1;
  }
  
  _canPayDisputeCosts(player, finalCost) {
    if (player.victoryPoints < finalCost.pv) return false;
    
    return Object.entries(finalCost).every(([resource, amount]) => {
      if (resource === 'pv') return true;
      return (player.resources[resource] || 0) >= amount;
    });
  }
  
  _payDisputeCosts(player, finalCost) {
    player.victoryPoints -= finalCost.pv;
    
    Object.entries(finalCost).forEach(([resource, amount]) => {
      if (resource !== 'pv' && amount > 0) {
        player.resources[resource] = Math.max(0, (player.resources[resource] || 0) - amount);
      }
    });
  }

  // ==================== CÁLCULOS DE DISPUTA ====================
  
  calculateDisputeCosts(player, region) {
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
    
    // Bônus por estruturas
    region.structures.forEach(structure => {
      if (structure === 'Torre de Vigia') modifiers.structures += 2;
      if (structure === 'Santuário') modifiers.structures += 1;
    });
    
    // Diferença de PV
    const pvDifference = defender.victoryPoints - player.victoryPoints;
    if (pvDifference > 0) {
      modifiers.defenderAdvantage = Math.floor(pvDifference * 0.1);
    }
    
    // Custo final
    const finalCost = {
      pv: Math.max(1, Math.floor(baseCost.pv + modifiers.exploration + modifiers.structures + modifiers.defenderAdvantage)),
      madeira: baseCost.madeira,
      pedra: baseCost.pedra,
      ouro: baseCost.ouro,
      agua: baseCost.agua
    };
    
    // Aplicar modificadores de facção
    if (this.main.factionLogic) {
      const factionModifier = this.main.factionLogic.modifyDisputeCost(player, finalCost, region);
      Object.assign(finalCost, factionModifier);
    }
    
    // Garantir valores mínimos
    finalCost.pv = Math.max(1, Math.floor(finalCost.pv));
    finalCost.madeira = Math.max(1, Math.floor(finalCost.madeira));
    finalCost.pedra = Math.max(1, Math.floor(finalCost.pedra));
    finalCost.ouro = Math.max(1, Math.floor(finalCost.ouro));
    finalCost.agua = Math.max(0, Math.floor(finalCost.agua));
    
    return {
      baseCost,
      modifiers,
      finalCost,
      successChance: this.calculateSuccessChance(player, defender, region, finalCost)
    };
  }
  
  calculateSuccessChance(attacker, defender, region, disputeCost) {
    let baseChance = 50;
    
    // Fatores positivos
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
    
    // Fatores negativos
    if (region.structures.includes('Torre de Vigia')) baseChance -= 15;
    if (region.structures.includes('Santuário')) baseChance -= 10;
    
    if (pvDiff < 0) {
      baseChance += Math.max(-30, pvDiff * 1.5);
    }
    
    if (this.main.factionLogic) {
      const factionDefense = this.main.factionLogic.getDefenseBonus(defender, region);
      baseChance -= factionDefense;
    }
    
    return Math.max(10, Math.min(90, baseChance));
  }

  // ==================== RESULTADOS DE DISPUTA ====================
  
  async _handleSuccessfulDispute(attacker, defender, region, disputeData) {
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
    
    this.main.showFeedback(`✅ Vitória! Você conquistou ${region.name}! +1 PV`, 'success');
    addActivityLog({
      type: 'dispute',
      playerName: attacker.name,
      action: 'conquistou',
      details: `${region.name} de ${defender.name}`,
      turn: gameState.turn,
      success: true
    });
    
    if (defender.regions.length === 0) {
      this._handlePlayerElimination(defender);
    }
  }
  
  async _handleFailedDispute(attacker, defender, region, disputeData) {
    defender.victoryPoints += 1;
    region.explorationLevel = Math.min(3, region.explorationLevel + 1);
    
    achievementsState.totalDisputes = (achievementsState.totalDisputes || 0) + 1;
    achievementsState.failedDisputes = (achievementsState.failedDisputes || 0) + 1;
    
    this.main.showFeedback(
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
  
  _handlePlayerElimination(player) {
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
        if (victoryCheck.type === 'elimination_victory') {
          this.main.turnLogic._declareVictory(victoryCheck.winner);
        } else if (victoryCheck.type === 'no_winner') {
          this.main.showFeedback(victoryCheck.message, 'warning');
          
          if (window.uiManager?.modals?.showNoWinnerModal) {
            window.uiManager.modals.showNoWinnerModal();
          }
        }
      }
    }
  }

  // ==================== ATUALIZAÇÃO DE UI ====================
  
  _updateRegionVisual(regionId) {
    const cell = document.querySelector(`.board-cell[data-region-id="${regionId}"]`);
    
    if (cell && window.uiManager?.gameManager) {
      const region = gameState.regions[regionId];
      const newCell = window.uiManager.gameManager.createRegionCell(region, regionId);
      
      const parent = cell.parentNode;
      parent.replaceChild(newCell, cell);
      
      newCell.classList.add('region-updated');
      setTimeout(() => {
        newCell.classList.remove('region-updated');
      }, 1000);
    }
  }
  
  _finalizeDispute() {
    if (window.uiManager) {
      window.uiManager.updateUI();
    }
  }
}