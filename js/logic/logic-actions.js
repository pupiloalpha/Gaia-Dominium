// logic-actions.js - Gerenciador de Ações Físicas (Refatorado)
import { 
  gameState, achievementsState, addActivityLog, 
  getCurrentPlayer, clearRegionSelection 
} from '../state/game-state.js';
import { GAME_CONFIG, STRUCTURE_COSTS, STRUCTURE_EFFECTS } from '../state/game-config.js';
import { ActionValidator } from './action-validator.js';

export class ActionLogic {
  constructor(gameLogic) {
    this.main = gameLogic;
    this.validator = new ActionValidator(gameLogic);
  }

  // ==================== VALIDAÇÃO SIMPLIFICADA ====================
  
  validateAction(actionType) {
    const regionId = gameState.selectedRegionId;
    const validation = this.validator.validateAction(actionType, regionId);
    
    if (!validation.valid && this.main?.showFeedback) {
      this.main.showFeedback(validation.reason, 'error');
    }
    
    return validation.valid;
  }
  
  validateResources(actionType) {
    const player = getCurrentPlayer();
    const regionId = gameState.selectedRegionId;
    
    return this.validator.canAffordAction(player, actionType, regionId);
  }

  // ==================== AÇÕES PRINCIPAIS ====================
  
  async handleExplore() {
    if (this.main?.preventActionIfModalOpen?.()) return;
    if (!this.validateAction('explorar')) return;
    if (!this.validateResources('explorar')) {
      this.main.showFeedback('Recursos insuficientes.', 'error');
      return;
    }
    
    if (!this.consumeAction()) return;
    
    const region = gameState.regions[gameState.selectedRegionId];
    const player = getCurrentPlayer();
    
    if (region.controller === null) {
      await this._assumeControl(region, player);
    } else if (region.controller === player.id) {
      await this._exploreRegion(region, player);
    } else {
      await this._initiateDispute(region, player);
    }
  }
  
  async handleCollect() {
    if (this.main?.preventActionIfModalOpen?.()) return;
    if (!this.validateAction('recolher')) return;
    if (!this.validateResources('recolher')) {
      this.main.showFeedback('Recursos insuficientes.', 'error');
      return;
    }
    
    if (!this.consumeAction()) return;
    
    await this._collectResources();
  }
  
  async handleBuild(structureType = 'Abrigo') {
    if (!this.validateAction('construir')) return;
    if (!this.validateResources('construir')) {
      this.main.showFeedback('Recursos insuficientes.', 'error');
      return;
    }
    
    if (!this.consumeAction()) return;
    
    await this._buildStructure(structureType);
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
  
  // ==================== LÓGICA ESPECÍFICA (simplificada) ====================
  
  async _assumeControl(region, player) {
    const pvCost = 2;
    
    if (player.victoryPoints < pvCost) {
      this.main.showFeedback(`Precisa de ${pvCost} PV para assumir domínio.`, 'error');
      return;
    }
    
    const canPay = Object.entries(region.resources).every(([k,v]) => 
      (player.resources[k] || 0) >= v
    );
    
    if (!canPay) {
      this.main.showFeedback('Recursos insuficientes.', 'error');
      return;
    }
    
    const confirm = await this.main.showConfirm(
      'Assumir Domínio', 
      `Gastar ${pvCost} PV e recursos para dominar ${region.name}?`
    );
    
    if (!confirm) return;
    
    // Efetivar pagamento
    player.victoryPoints -= pvCost;
    Object.entries(region.resources).forEach(([k,v]) => {
      player.resources[k] = Math.max(0, (player.resources[k] || 0) - v);
    });
    
    // Atualizar controle
    region.controller = player.id;
    player.regions.push(region.id);
    
    this.main.showFeedback(`${region.name} dominada! -${pvCost} PV`, 'success');
    addActivityLog({ 
      type: 'explore', 
      playerName: player.name, 
      action: 'assumiu domínio de', 
      details: region.name, 
      turn: gameState.turn 
    });
    
    this._finalizeAction();
  }
  
  async _exploreRegion(region, player) {
    let cost = { ...GAME_CONFIG.ACTION_DETAILS.explorar.cost };
    
    if (this.main.factionLogic) {
      cost = this.main.factionLogic.modifyExploreCost(player, cost);
    }
    
    // Pagar custo
    Object.entries(cost).forEach(([k,v]) => {
      player.resources[k] = Math.max(0, (player.resources[k] || 0) - v);
    });
    
    region.explorationLevel = Math.min(3, region.explorationLevel + 1);
    player.victoryPoints += 1;
    achievementsState.totalExplored++;
    
    // Aplicar bônus de facção
    let bonusMsg = '';
    if (this.main.factionLogic) {
      const factionBonus = this.main.factionLogic.applyExploreBonus(player, region);
      if (factionBonus) {
        Object.entries(factionBonus).forEach(([k, v]) => {
          player.resources[k] = (player.resources[k] || 0) + v;
          bonusMsg += ` (+${v} ${k} Facção)`;
        });
      }
    }
    
    const rareFind = Math.random() < 0.10;
    if (rareFind) { 
      player.resources.ouro += 1; 
      this.main.showFeedback(`Descoberta Rara! +1 Ouro${bonusMsg}`, 'success'); 
    } else { 
      this.main.showFeedback(
        `${region.name} explorada. Nível: ${region.explorationLevel}⭐${bonusMsg}`, 
        'success'
      ); 
    }
    
    addActivityLog({ 
      type: 'explore', 
      playerName: player.name, 
      action: rareFind ? 'explorou (Raro!)' : 'explorou', 
      details: `${region.name}${bonusMsg}`, 
      turn: gameState.turn 
    });
    
    this._finalizeAction();
  }
  
  async _initiateDispute(region, player) {
    if (this.main.disputeLogic) {
      await this.main.disputeLogic.handleDispute(region, player);
    } else {
      this.main.showFeedback('Sistema de disputa não disponível.', 'error');
      gameState.actionsLeft++; // Devolver ação
    }
  }
  
  async _collectResources() {
    const region = gameState.regions[gameState.selectedRegionId];
    const player = getCurrentPlayer();
    
    const cost = GAME_CONFIG.ACTION_DETAILS.recolher.cost;
    Object.entries(cost).forEach(([k,v]) => {
      player.resources[k] = Math.max(0, (player.resources[k] || 0) - v);
    });
    
    // Lógica de coleta
    let harvestPercent = region.explorationLevel === 3 ? 0.75 : 0.5;
    
    if (region.explorationLevel >= 1) {
      const types = Object.keys(region.resources).filter(k => region.resources[k] > 0);
      if (types.length) {
        const randomResource = types[Math.floor(Math.random() * types.length)];
        player.resources[randomResource] += 1;
      }
    }
    
    // Coleta principal
    Object.keys(region.resources).forEach(k => {
      const amount = Math.max(0, Math.floor(region.resources[k] * harvestPercent));
      player.resources[k] += amount;
      region.resources[k] = Math.max(0, region.resources[k] - amount);
    });
    
    // Bônus de facção
    let factionMsg = '';
    if (this.main.factionLogic) {
      const factionLoot = this.main.factionLogic.applyCollectBonus(player, region);
      if (factionLoot) {
        Object.entries(factionLoot).forEach(([k, v]) => {
          player.resources[k] = (player.resources[k] || 0) + v;
          factionMsg += ` +${v} ${k} (Facção)`;
        });
      }
    }
    
    player.victoryPoints += 1;
    this.main.showFeedback(`Recolhido. +1 PV${factionMsg}`, 'success');
    addActivityLog({ 
      type: 'collect', 
      playerName: player.name, 
      action: 'recolheu recursos', 
      details: `${region.name}${factionMsg}`, 
      turn: gameState.turn 
    });
    
    this._finalizeAction();
  }
  
  async _buildStructure(structureType) {
    const region = gameState.regions[gameState.selectedRegionId];
    const player = getCurrentPlayer();
    
    // Calcular custo
    let cost = { ...STRUCTURE_COSTS[structureType] };
    if (this.main.factionLogic) {
      cost = this.main.factionLogic.modifyBuildCost(player, cost);
    }
    
    // Pagar
    Object.entries(cost).forEach(([k,v]) => {
      player.resources[k] = Math.max(0, (player.resources[k] || 0) - v);
    });
    
    region.structures.push(structureType);
    
    // Calcular PV
    let pvBonus = 0;
    if (this.main.factionLogic) {
      pvBonus = this.main.factionLogic.applyBuildBonus(player, structureType).pv || 0;
    }
    
    const pvGain = (STRUCTURE_EFFECTS[structureType]?.pv || 0) + 
                   (gameState.eventModifiers.construirBonus || 0) + 
                   pvBonus;
    
    player.victoryPoints += pvGain;
    achievementsState.totalBuilt++;
    
    this.main.showFeedback(`Construído ${structureType}. +${pvGain} PV.`, 'success');
    addActivityLog({ 
      type: 'build', 
      playerName: player.name, 
      action: `construiu ${structureType}`, 
      details: region.name, 
      turn: gameState.turn 
    });
    
    this._finalizeAction();
  }

  // ==================== FINALIZAÇÃO ====================
  
  _finalizeAction() {
    clearRegionSelection();
    
    if (this.main?.turnLogic?.checkVictory) {
      this.main.turnLogic.checkVictory();
    }
    
    if (window.uiManager) {
      window.uiManager.updateUI();
      if (window.uiManager.gameManager) {
        setTimeout(() => window.uiManager.gameManager.updateFooter(), 100);
      }    
    }
  }
}