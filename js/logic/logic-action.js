// logic-actions.js - Gerenciador de Ações Físicas (Refatorado)
import { 
  gameState, achievementsState, addActivityLog, getCurrentPlayer,
  clearRegionSelection, getPlayerById 
} from '../state/game-state.js';
import { GAME_CONFIG, RESOURCE_ICONS, STRUCTURE_COSTS, STRUCTURE_EFFECTS } from '../state/game-config.js';

// ==================== HELPERS PRIVADOS ====================
class ActionHelpers {
  static canAffordExplore(player, cost) {
    return Object.entries(cost).every(([k, v]) => (player.resources[k] || 0) >= v);
  }
  
  static canAffordControl(player, regionResources) {
    const pvCost = 2;
    if (player.victoryPoints < pvCost) return false;
    return Object.entries(regionResources).every(([k, v]) => player.resources[k] >= v);
  }
  
  static applyResourceCost(player, cost) {
    Object.entries(cost).forEach(([k, v]) => {
      player.resources[k] = Math.max(0, (player.resources[k] || 0) - v);
    });
  }
  
  static calculateCollectBonus(region, player, factionLogic) {
    let harvestPercent = region.explorationLevel === 3 ? 0.75 : 0.5;
    let factionMsg = '';
    let factionLoot = {};
    
    if (factionLogic) {
      factionLoot = factionLogic.applyCollectBonus(player, region) || {};
    }
    
    return { harvestPercent, factionMsg, factionLoot };
  }
}

export class ActionLogic {
  constructor(gameLogic) {
    this.main = gameLogic;
  }

  // ==================== VALIDAÇÕES ====================
  
  validateAction(actionType) {
    const currentPlayer = getCurrentPlayer();
    const isEliminated = currentPlayer?.eliminated || 
      window.gameState?.isPlayerEliminated?.(currentPlayer?.id);
    
    if (isEliminated && !this._isValidForEliminated(actionType)) {
      this.main.showFeedback('Jogador eliminado só pode dominar regiões neutras para ressuscitar.', 'warning');
      return false;
    }
    
    return this._validateCommonConditions(actionType);
  }
  
  _isValidForEliminated(actionType) {
    return actionType === 'explorar' && gameState.selectedRegionId !== null;
  }
  
  _validateCommonConditions(actionType) {
    if (gameState.actionsLeft <= 0) {
      this.main.showFeedback('Sem ações restantes neste turno.', 'warning');
      return false;
    }
    
    const currentPhase = gameState.currentPhase;
    const allowedInActions = ['explorar', 'recolher', 'construir', 'disputar'];
    
    if (!allowedInActions.includes(actionType) || currentPhase !== 'acoes') {
      if (actionType === 'negociar' && currentPhase === 'negociacao') return true;
      
      this.main.showFeedback(`Ação "${actionType}" não permitida na fase atual (${currentPhase}).`, 'warning');
      return false;
    }
    
    return true;
  }

  consumeAction() {
    gameState.actionsLeft--;
    this._updateUI();
    return true;
  }

  // ==================== AÇÃO DE EXPLORAR ====================
  
  async handleExplore() {
    if (this.main.preventActionIfModalOpen()) return;
    if (!this.validateAction('explorar')) return;
    
    const { region, player } = this._getExploreContext();
    if (!region || !player) return;
    
    if (player.eliminated) {
      await this._handleEliminatedExplore(region, player);
      return;
    }
    
    await this._handleActivePlayerExplore(region, player);
  }
  
  _getExploreContext() {
    if (gameState.selectedRegionId === null) {
      this.main.showFeedback('Selecione uma região primeiro.', 'error');
      return { region: null, player: null };
    }
    
    const region = gameState.regions[gameState.selectedRegionId];
    const player = getCurrentPlayer();
    
    return { region, player };
  }
  
  async _handleEliminatedExplore(region, player) {
    if (region.controller === null) {
      await this._handleResurrection(region, player);
    } else {
      this.main.showFeedback('Jogador eliminado só pode dominar regiões neutras.', 'error');
    }
  }
  
  async _handleActivePlayerExplore(region, player) {
    if (region.controller === null) {
      await this._assumeControl(region, player);
    } else if (region.controller === player.id) {
      await this._exploreRegion(region, player);
    } else {
      await this._initiateDispute(region, player);
    }
  }

  // ==================== SUBAÇÕES DE EXPLORAÇÃO ====================
  
  async _assumeControl(region, player) {
    if (player.eliminated) {
      return await this._handleResurrection(region, player);
    }
    
    if (!ActionHelpers.canAffordControl(player, region.resources)) {
      this.main.showFeedback('Recursos insuficientes para assumir domínio.', 'error');
      return;
    }
    
    const confirm = await this.main.showConfirm(
      'Assumir Domínio', 
      `Gastar 2 PV e recursos para dominar ${region.name}?`
    );
    
    if (!confirm || !this.consumeAction()) return;
    
    player.victoryPoints -= 2;
    ActionHelpers.applyResourceCost(player, region.resources);
    
    region.controller = player.id;
    player.regions.push(region.id);
    
    this.main.showFeedback(`${region.name} dominada! -2 PV`, 'success');
    addActivityLog({ 
      type: 'explore', 
      playerName: player.name, 
      action: 'assumiu domínio de', 
      details: region.name, 
      turn: gameState.turn 
    });
    
    this._finalizeAction();
  }
  
  async _initiateDispute(region, player) {
    if (this.main.turnLogic?.gameEnded) {
      this.main.showFeedback('O jogo já terminou!', 'warning');
      return;
    }
    
    if (region.controller === player.id) {
      this.main.showFeedback('Você já controla esta região.', 'error');
      return;
    }
    
    if (this.main.disputeLogic) {
      await this.main.disputeLogic.handleDispute(region, player);
      this._finalizeAction();
    } else {
      this.main.showFeedback('Sistema de disputa não disponível.', 'error');
      gameState.actionsLeft++;
    }
  }
  
  async _handleResurrection(region, player) {
    const resurrectionCostPV = window.gameState?.ELIMINATION_CONFIG?.RESURRECTION_COST_PV || 2;
    
    if (player.victoryPoints < resurrectionCostPV) {
      this.main.showFeedback(
        `Precisa de ${resurrectionCostPV} PV para ressuscitar dominando uma região.`,
        'error'
      );
      return;
    }
    
    if (!ActionHelpers.canAffordControl(player, region.resources)) {
      this.main.showFeedback('Recursos insuficientes para ressuscitar.', 'error');
      return;
    }
    
    const confirm = await this.main.showConfirm(
      '💀 Ressuscitar', 
      `Gastar ${resurrectionCostPV} PV e recursos para dominar ${region.name} e voltar ao jogo?`
    );
    
    if (!confirm || !this.consumeAction()) return;
    
    const resurrected = window.gameState?.resurrectPlayer?.(player.id, region.id);
    
    if (resurrected) {
      player.victoryPoints -= resurrectionCostPV;
      ActionHelpers.applyResourceCost(player, region.resources);
      
      this.main.showFeedback(`${player.name} ressuscitou dominando ${region.name}!`, 'success');
      addActivityLog({ 
        type: 'resurrection', 
        playerName: player.name, 
        action: 'ressuscitou dominando', 
        details: region.name, 
        turn: gameState.turn 
      });
      
      this._finalizeAction();
    } else {
      this.main.showFeedback('Não foi possível ressuscitar. Verifique os requisitos.', 'error');
    }
  }

  async _exploreRegion(region, player) {
    let cost = { ...GAME_CONFIG.ACTION_DETAILS.explorar.cost };
    
    if (this.main.factionLogic) {
      cost = this.main.factionLogic.modifyExploreCost(player, cost);
    }
    
    if (!ActionHelpers.canAffordExplore(player, cost)) {
      this.main.showFeedback('Recursos insuficientes.', 'error');
      return;
    }
    
    if (!this.consumeAction()) return;
    
    ActionHelpers.applyResourceCost(player, cost);
    region.explorationLevel = Math.min(3, region.explorationLevel + 1);
    player.victoryPoints += 1;
    achievementsState.totalExplored++;
    
    const { bonusMsg } = this._applyExplorationBonuses(player, region);
    this._logExplorationResult(region, player, bonusMsg);
    
    this._finalizeAction();
  }
  
  _applyExplorationBonuses(player, region) {
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
      bonusMsg += ' (Raro!)';
    }
    
    return { bonusMsg, rareFind };
  }
  
  _logExplorationResult(region, player, bonusMsg) {
    const rareFind = bonusMsg.includes('Raro');
    const message = rareFind ? 
      `Descoberta Rara! +1 Ouro${bonusMsg.replace(' (Raro!)', '')}` : 
      `${region.name} explorada. Nível: ${region.explorationLevel}⭐${bonusMsg}`;
    
    this.main.showFeedback(message, 'success');
    
    addActivityLog({ 
      type: 'explore', 
      playerName: player.name, 
      action: rareFind ? 'explorou (Raro!)' : 'explorou', 
      details: `${region.name}${bonusMsg}`, 
      turn: gameState.turn 
    });
  }

  // ==================== AÇÃO DE COLETAR ====================
  
  handleCollect() {
    if (this.main.preventActionIfModalOpen()) return;
    if (!this.validateAction('recolher')) return;

    const { region, player } = this._getCollectContext();
    if (!region || !player) return;

    if (!this.consumeAction()) return;

    const cost = GAME_CONFIG.ACTION_DETAILS.recolher.cost;
    ActionHelpers.applyResourceCost(player, cost);

    const { harvestPercent, factionLoot } = ActionHelpers.calculateCollectBonus(
      region, player, this.main.factionLogic
    );

    this._collectRegionResources(region, player, harvestPercent, factionLoot);
    this._applyCollectBonuses(player, region, factionLoot);
    
    this._finalizeAction();
  }
  
  _getCollectContext() {
    if (gameState.selectedRegionId === null) { 
      this.main.showFeedback('Selecione uma região.', 'error'); 
      return { region: null, player: null };
    }

    const region = gameState.regions[gameState.selectedRegionId];
    const player = getCurrentPlayer();

    if (region.controller !== player.id) { 
      this.main.showFeedback('Você não controla essa região.', 'error'); 
      return { region: null, player: null };
    }
    
    if (region.explorationLevel === 0) { 
      this.main.showFeedback('Necessário explorar antes.', 'warning'); 
      return { region: null, player: null };
    }
    
    return { region, player };
  }
  
  _collectRegionResources(region, player, harvestPercent, factionLoot) {
    Object.keys(region.resources).forEach(k => {
      const amount = Math.max(0, Math.floor(region.resources[k] * harvestPercent));
      player.resources[k] += amount;
      region.resources[k] = Math.max(0, region.resources[k] - amount);
    });
    
    if (region.explorationLevel >= 1) {
      const types = Object.keys(region.resources).filter(k => region.resources[k] > 0);
      if (types.length) {
        player.resources[types[Math.floor(Math.random() * types.length)]] += 1;
      }
    }
  }
  
  _applyCollectBonuses(player, region, factionLoot) {
    let factionMsg = '';
    
    if (factionLoot && Object.keys(factionLoot).length > 0) {
      Object.entries(factionLoot).forEach(([k, v]) => {
        player.resources[k] = (player.resources[k] || 0) + v;
        factionMsg += ` +${v} ${k} (Facção)`;
      });
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
  }

  // ==================== AÇÃO DE CONSTRUIR ====================
  
  handleBuild(structureType = 'Abrigo') {
    if (!this.validateAction('construir')) return;
    
    const { region, player } = this._getBuildContext(structureType);
    if (!region || !player) return;

    const cost = this._calculateBuildCost(structureType, player);
    if (!ActionHelpers.canAffordExplore(player, cost)) { 
      this.main.showFeedback('Recursos insuficientes.', 'error'); 
      return; 
    }
    
    if (!this.consumeAction()) return;

    ActionHelpers.applyResourceCost(player, cost);
    region.structures.push(structureType);
    
    const pvGain = this._calculateBuildPV(structureType, player);
    player.victoryPoints += pvGain;
    achievementsState.totalBuilt++;
    
    this._logBuildResult(structureType, region, player, pvGain);
    this._finalizeAction();
  }
  
  _getBuildContext(structureType) {
    if (gameState.selectedRegionId === null) { 
      this.main.showFeedback('Selecione uma região.', 'error'); 
      return { region: null, player: null };
    }
    
    const region = gameState.regions[gameState.selectedRegionId];
    const player = getCurrentPlayer();
    
    if (region.controller !== player.id) { 
      this.main.showFeedback('Região não controlada.', 'error'); 
      return { region: null, player: null };
    }
    
    if (region.structures.includes(structureType)) { 
      this.main.showFeedback('Estrutura já existe.', 'error'); 
      return { region: null, player: null };
    }
    
    return { region, player };
  }
  
  _calculateBuildCost(structureType, player) {
    let cost = { ...STRUCTURE_COSTS[structureType] };
    if (this.main.factionLogic) {
      cost = this.main.factionLogic.modifyBuildCost(player, cost);
    }
    return cost;
  }
  
  _calculateBuildPV(structureType, player) {
    let pvBonus = 0;
    if (this.main.factionLogic) {
      pvBonus = this.main.factionLogic.applyBuildBonus(player, structureType).pv || 0;
    }

    return (STRUCTURE_EFFECTS[structureType]?.pv || 0) + 
           (gameState.eventModifiers.construirBonus || 0) + 
           pvBonus;
  }
  
  _logBuildResult(structureType, region, player, pvGain) {
    this.main.showFeedback(`Construído ${structureType}. +${pvGain} PV.`, 'success');
    addActivityLog({ 
      type: 'build', 
      playerName: player.name, 
      action: `construiu ${structureType}`, 
      details: region.name, 
      turn: gameState.turn 
    });
  }

  // ==================== UTILITÁRIOS ====================
  
  _finalizeAction() {
    clearRegionSelection();
    this.main.turnLogic?.checkVictory();
    this._updateUI();
  }
  
  _updateUI() {
    if (window.uiManager) {
      window.uiManager.updateUI();
      if (window.uiManager.gameManager) {
        setTimeout(() => window.uiManager.gameManager.updateFooter(), 100);
      }
    }
  }
}