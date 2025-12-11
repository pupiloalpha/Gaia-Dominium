// logic-actions.js - Gerenciador de Ações Físicas
import { 
  gameState, achievementsState, addActivityLog, 
  getCurrentPlayer, clearRegionSelection 
} from '../state/game-state.js';
import { GAME_CONFIG, RESOURCE_ICONS, STRUCTURE_COSTS, STRUCTURE_EFFECTS, STRUCTURE_INCOME } from '../state/game-config.js';

export class ActionLogic {
  constructor(gameLogic) {
    this.main = gameLogic; // Referência ao GameLogic principal para callbacks
  }

  // Validação centralizada de fase
  validateAction(actionType) {
    if (gameState.actionsLeft <= 0) {
      this.main.showFeedback('Sem ações restantes neste turno.', 'warning');
      return false;
    }

    const currentPhase = gameState.currentPhase;
    // Ações permitidas apenas na fase de ações
    const allowedInActions = ['explorar', 'recolher', 'construir'];
    
    if (!allowedInActions.includes(actionType) || currentPhase !== 'acoes') {
      // Se tentar negociar, valida fase negociação
      if (actionType === 'negociar' && currentPhase === 'negociacao') return true;
      
      this.main.showFeedback(`Ação "${actionType}" não permitida na fase atual (${currentPhase}).`, 'warning');
      return false;
    }
    return true;
  }

  consumeAction() {
    gameState.actionsLeft--;
    if (window.uiManager?.updateFooter) setTimeout(() => window.uiManager.updateFooter(), 10);
    return true;
  }

  async handleExplore() {
    if (this.main.preventActionIfModalOpen()) return;
    if (!this.validateAction('explorar')) return;
    
    if (gameState.selectedRegionId === null) {
      this.main.showFeedback('Selecione uma região primeiro.', 'error');
      return;
    }
    
    const region = gameState.regions[gameState.selectedRegionId];
    const player = getCurrentPlayer();
    
    if (region.controller === null) {
      await this._assumeControl(region, player);
    } else if (region.controller === player.id) {
      await this._exploreRegion(region, player);
    } else {
      this.main.showFeedback('Você não pode explorar regiões de outros jogadores.', 'error');
    }
    
    this._finalizeAction();
  }

  async _assumeControl(region, player) {
    const pvCost = 2;
    if (player.victoryPoints < pvCost) {
      this.main.showFeedback(`Precisa de ${pvCost} PV para assumir domínio.`, 'error');
      return;
    }
    
    const canPay = Object.entries(region.resources).every(([k,v]) => player.resources[k] >= v);
    if (!canPay) {
      this.main.showFeedback(`Recursos insuficientes.`, 'error');
      return;
    }
    
    const confirm = await this.main.showConfirm('Assumir Domínio', `Gastar ${pvCost} PV e recursos para dominar ${region.name}?`);
    if (!confirm || !this.consumeAction()) return;
    
    player.victoryPoints -= pvCost;
    Object.entries(region.resources).forEach(([k,v]) => player.resources[k] -= v);
    
    region.controller = player.id;
    player.regions.push(region.id);
    
    this.main.showFeedback(`${region.name} dominada! -${pvCost} PV`, 'success');
    addActivityLog({ type: 'explore', playerName: player.name, action: 'assumiu domínio de', details: region.name, turn: gameState.turn });
  }

  async _exploreRegion(region, player) {
    if (!this.main.canAffordAction('explorar')) {
      this.main.showFeedback('Recursos insuficientes.', 'error');
      return;
    }
    
    if (!this.consumeAction()) return;
    
    const cost = GAME_CONFIG.ACTION_DETAILS.explorar.cost;
    Object.entries(cost).forEach(([k,v]) => player.resources[k] -= v);
    
    region.explorationLevel = Math.min(3, region.explorationLevel + 1);
    player.victoryPoints += 1;
    achievementsState.totalExplored++;
    
    const bonus = Math.random() < 0.10;
    if (bonus) { player.resources.ouro += 1; this.main.showFeedback('Descoberta Rara! +1 Ouro', 'success'); }
    else { this.main.showFeedback(`${region.name} explorada. Nível: ${region.explorationLevel}⭐`, 'success'); }
    
    addActivityLog({ type: 'explore', playerName: player.name, action: bonus ? 'explorou (Raro!)' : 'explorou', details: region.name, turn: gameState.turn });
  }

  handleCollect() {
    if (this.main.preventActionIfModalOpen()) return;
    if (!this.validateAction('recolher')) return;

    if (gameState.selectedRegionId === null) { this.main.showFeedback('Selecione uma região.', 'error'); return; }

    const region = gameState.regions[gameState.selectedRegionId];
    const player = getCurrentPlayer();

    if (region.controller !== player.id) { this.main.showFeedback('Você não controla essa região.', 'error'); return; }
    if (region.explorationLevel === 0) { this.main.showFeedback('Necessário explorar antes.', 'warning'); return; }
    if (!this.main.canAffordAction('recolher')) { this.main.showFeedback('Recursos insuficientes.', 'error'); return; }

    if (!this.consumeAction()) return;

    // Custo
    const cost = GAME_CONFIG.ACTION_DETAILS.recolher.cost;
    Object.entries(cost).forEach(([k,v]) => player.resources[k] -= v);

    // Lógica de coleta
    let harvestPercent = region.explorationLevel === 3 ? 0.75 : 0.5;
    
    // Bônus Eventos e Nível
    if (region.explorationLevel >= 1) {
       const types = Object.keys(region.resources).filter(k => region.resources[k] > 0);
       if (types.length) player.resources[types[Math.floor(Math.random() * types.length)]] += 1;
    }

    Object.keys(region.resources).forEach(k => {
      const amount = Math.max(0, Math.floor(region.resources[k] * harvestPercent));
      player.resources[k] += amount;
      region.resources[k] = Math.max(0, region.resources[k] - amount);
    });

    player.victoryPoints += 1;
    this.main.showFeedback(`Recursos recolhidos. +1 PV`, 'success');
    addActivityLog({ type: 'collect', playerName: player.name, action: 'recolheu recursos', details: region.name, turn: gameState.turn });
    
    this._finalizeAction();
  }

  handleBuild(structureType = 'Abrigo') {
    if (!this.validateAction('construir')) return;
    if (gameState.selectedRegionId === null) { this.main.showFeedback('Selecione uma região.', 'error'); return; }
    
    const region = gameState.regions[gameState.selectedRegionId];
    const player = getCurrentPlayer();
    
    if (region.controller !== player.id) { this.main.showFeedback('Região não controlada.', 'error'); return; }
    if (region.structures.includes(structureType)) { this.main.showFeedback('Estrutura já existe.', 'error'); return; }
    
    const cost = STRUCTURE_COSTS[structureType];
    const canPay = Object.entries(cost).every(([k,v]) => player.resources[k] >= v);
    
    if (!canPay) { this.main.showFeedback('Recursos insuficientes.', 'error'); return; }
    if (!this.consumeAction()) return;
    
    Object.entries(cost).forEach(([k,v]) => player.resources[k] -= v);
    region.structures.push(structureType);
    
    const pvGain = (STRUCTURE_EFFECTS[structureType]?.pv || 0) + (gameState.eventModifiers.construirBonus || 0);
    player.victoryPoints += pvGain;
    achievementsState.totalBuilt++;
    
    this.main.showFeedback(`Construído ${structureType}. +${pvGain} PV.`, 'success');
    addActivityLog({ type: 'build', playerName: player.name, action: `construiu ${structureType}`, details: region.name, turn: gameState.turn });
    
    this._finalizeAction();
  }

  _finalizeAction() {
    clearRegionSelection();
    this.main.turnLogic.checkVictory();
    if (window.uiManager) {
      window.uiManager.updateUI();
      setTimeout(() => window.uiManager.updateFooter(), 100);
    }
  }
}