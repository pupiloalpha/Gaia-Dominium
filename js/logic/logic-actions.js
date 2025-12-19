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
  // Adicionar 'disputar' às ações permitidas
  const allowedInActions = ['explorar', 'recolher', 'construir', 'disputar'];
  
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
    if (window.uiManager && window.uiManager.gameManager) {
         setTimeout(() => window.uiManager.gameManager.updateFooter(), 10);
    }
    
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

  // Método para disputar territórios
async handleContest() {
  if (this.main.preventActionIfModalOpen()) return;
  if (!this.validateAction('disputar')) return;

  if (gameState.selectedRegionId === null) {
    this.main.showFeedback('Selecione uma região primeiro.', 'error');
    return;
  }

  const region = gameState.regions[gameState.selectedRegionId];
  const player = getCurrentPlayer();

  // Verificar se a região está sob controle de outro jogador
  if (region.controller === null) {
    this.main.showFeedback('Esta região não está dominada por nenhum jogador. Use a ação Explorar para assumir o domínio.', 'error');
    return;
  }

  if (region.controller === player.id) {
    this.main.showFeedback('Você já controla esta região.', 'error');
    return;
  }

  const defender = gameState.players[region.controller];
  
  // Calcular custo base
  let cost = { ...GAME_CONFIG.ACTION_DETAILS.disputar.cost };
  const pvCost = GAME_CONFIG.ACTION_DETAILS.disputar.pv;

  // Aplicar descontos de facção se existirem
  if (this.main.factionLogic) {
    cost = this.modifyContestCost(player, cost);
  }

  // Verificar se pode pagar
  const canPay = Object.entries(cost).every(([k, v]) => (player.resources[k] || 0) >= v) && 
                 player.victoryPoints >= pvCost;

  if (!canPay) {
    this.main.showFeedback('Recursos ou PV insuficientes para disputar território.', 'error');
    return;
  }

  // Calcular chance de sucesso
  const successChance = this.calculateContestSuccessChance(player, defender, region);
  
  // Mostrar confirmação com detalhes
  const confirm = await this.main.showConfirm(
    'Disputar Território',
    `Deseja gastar ${JSON.stringify(cost)} recursos e ${pvCost} PV para disputar ${region.name}?\n\n` +
    `Defensor: ${defender.name}\n` +
    `Chance de sucesso: ${Math.round(successChance * 100)}%\n` +
    `Recompensa: ${region.name} + Estruturas (se houver)\n` +
    `Risco: Perder todos os recursos investidos`
  );

  if (!confirm) return;

  if (!this.consumeAction()) return;

  // Pagar custos
  Object.entries(cost).forEach(([k, v]) => player.resources[k] -= v);
  player.victoryPoints -= pvCost;

  // Determinar sucesso
  const success = Math.random() < successChance;

  if (success) {
    // Transferir região
    this.transferRegionControl(region, player, defender);
    
    // Bônus de facção
    let bonusMsg = '';
    if (this.main.factionLogic) {
      const factionBonus = this.main.factionLogic.applyContestBonus(player, region);
      if (factionBonus) {
        Object.entries(factionBonus).forEach(([k, v]) => {
          player.resources[k] = (player.resources[k] || 0) + v;
          bonusMsg += ` (+${v} ${k} Facção)`;
        });
      }
    }

    this.main.showFeedback(`🏆 Vitória! Você conquistou ${region.name}${bonusMsg}`, 'success');
    addActivityLog({
      type: 'contest',
      playerName: player.name,
      action: 'conquistou',
      details: `${region.name} de ${defender.name}`,
      turn: gameState.turn
    });

    // Penalidade para o defensor
    defender.victoryPoints = Math.max(0, defender.victoryPoints - 2);
    this.main.showFeedback(`${defender.name} perdeu 2 PV pela derrota.`, 'info');

  } else {
    // Falha na disputa
    this.main.showFeedback(`❌ Disputa falhou! ${defender.name} manteve o controle de ${region.name}.`, 'error');
    addActivityLog({
      type: 'contest',
      playerName: player.name,
      action: 'falhou em conquistar',
      details: `${region.name} de ${defender.name}`,
      turn: gameState.turn
    });

    // Bônus de defesa para o defensor
    defender.victoryPoints += 1;
    this.main.showFeedback(`${defender.name} ganhou 1 PV pela defesa bem-sucedida.`, 'info');
  }

  this._finalizeAction();
}

// Adicionar métodos auxiliares
calculateContestSuccessChance(attacker, defender, region) {
  let baseChance = 0.5; // 50% base
  
  // Fator 1: Diferença de PV
  const pvDiff = attacker.victoryPoints - defender.victoryPoints;
  baseChance += (pvDiff * 0.02); // 2% por PV de diferença
  
  // Fator 2: Nível de exploração da região
  baseChance += (region.explorationLevel * 0.05); // 5% por nível
  
  // Fator 3: Presença de estruturas de defesa
  if (region.structures.includes('Torre de Vigia')) {
    baseChance -= 0.15; // -15% com torre
  }
  
  // Fator 4: Eventos ativos
  if (gameState.eventModifiers.disputaBonus) {
    baseChance += gameState.eventModifiers.disputaBonus;
  }
  
  // Fator 5: Bônus de facção
  if (this.main.factionLogic) {
    const factionMod = this.main.factionLogic.getContestChanceModifier(attacker);
    baseChance += factionMod;
  }
  
  // Limites: 20% a 80%
  return Math.max(0.2, Math.min(0.8, baseChance));
}

transferRegionControl(region, newController, oldController) {
  // Remover região do defensor
  oldController.regions = oldController.regions.filter(id => id !== region.id);
  
  // Adicionar ao atacante
  region.controller = newController.id;
  newController.regions.push(region.id);
  
  // Manter estruturas (benefício para conquistador)
  this.main.showFeedback(`Estruturas mantidas: ${region.structures.join(', ') || 'Nenhuma'}`, 'info');
}

modifyContestCost(player, baseCost) {
  if (!player.faction) return baseCost;
  
  const modifiedCost = { ...baseCost };
  const faction = player.faction;
  
  // Facção com bônus militar
  if (faction.abilities.contestDiscount) {
    Object.keys(faction.abilities.contestDiscount).forEach(resource => {
      const discount = faction.abilities.contestDiscount[resource];
      if (modifiedCost[resource]) {
        modifiedCost[resource] = Math.max(0, modifiedCost[resource] - discount);
      }
    });
  }
  
  return modifiedCost;
}
  
  async _exploreRegion(region, player) {
    // 1. Obter custo base e aplicar descontos de facção (ex: Druidas)
    let cost = { ...GAME_CONFIG.ACTION_DETAILS.explorar.cost };
    
    if (this.main.factionLogic) {
      cost = this.main.factionLogic.modifyExploreCost(player, cost);
    }
    
    // 2. Verificar se pode pagar o custo DESCONTADO
    const canPay = Object.entries(cost).every(([k, v]) => (player.resources[k] || 0) >= v);

    if (!canPay) {
      this.main.showFeedback('Recursos insuficientes.', 'error');
      return;
    }
    
    if (!this.consumeAction()) return;
    
    // 3. Pagar o custo descontado
    Object.entries(cost).forEach(([k,v]) => player.resources[k] -= v);
    
    region.explorationLevel = Math.min(3, region.explorationLevel + 1);
    player.victoryPoints += 1;
    achievementsState.totalExplored++;
    
    // 4. Lógica de Bônus de Facção (Ex: Chance extra de ouro ou madeira em floresta)
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
        this.main.showFeedback(`${region.name} explorada. Nível: ${region.explorationLevel}⭐${bonusMsg}`, 'success'); 
    }
    
    addActivityLog({ 
        type: 'explore', 
        playerName: player.name, 
        action: rareFind ? 'explorou (Raro!)' : 'explorou', 
        details: `${region.name}${bonusMsg}`, 
        turn: gameState.turn 
    });
  }

  handleCollect() {
    if (this.main.preventActionIfModalOpen()) return;
    if (!this.validateAction('recolher')) return;

    if (gameState.selectedRegionId === null) { this.main.showFeedback('Selecione uma região.', 'error'); return; }

    const region = gameState.regions[gameState.selectedRegionId];
    const player = getCurrentPlayer();

    if (region.controller !== player.id) { this.main.showFeedback('Você não controla essa região.', 'error'); return; }
    if (region.explorationLevel === 0) { this.main.showFeedback('Necessário explorar antes.', 'warning'); return; }
    
    // Ação de recolher padrão não tem custo variável de facção, mas validamos custo base
    if (!this.main.canAffordAction('recolher')) { this.main.showFeedback('Recursos insuficientes.', 'error'); return; }

    if (!this.consumeAction()) return;

    const cost = GAME_CONFIG.ACTION_DETAILS.recolher.cost;
    Object.entries(cost).forEach(([k,v]) => player.resources[k] -= v);

    // Lógica Base de Coleta
    let harvestPercent = region.explorationLevel === 3 ? 0.75 : 0.5;
    
    // Bônus Padrão (Eventos e Nível)
    if (region.explorationLevel >= 1) {
       const types = Object.keys(region.resources).filter(k => region.resources[k] > 0);
       if (types.length) player.resources[types[Math.floor(Math.random() * types.length)]] += 1;
    }

    // Coleta dos recursos da região
    Object.keys(region.resources).forEach(k => {
      const amount = Math.max(0, Math.floor(region.resources[k] * harvestPercent));
      player.resources[k] += amount;
      region.resources[k] = Math.max(0, region.resources[k] - amount);
    });

    // 1. Aplicar Bônus de Facção (Ex: Navegadores em Pântano)
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

  handleBuild(structureType = 'Abrigo') {
    if (!this.validateAction('construir')) return;
    if (gameState.selectedRegionId === null) { this.main.showFeedback('Selecione uma região.', 'error'); return; }
    
    const region = gameState.regions[gameState.selectedRegionId];
    const player = getCurrentPlayer();
    
    if (region.controller !== player.id) { this.main.showFeedback('Região não controlada.', 'error'); return; }
    if (region.structures.includes(structureType)) { this.main.showFeedback('Estrutura já existe.', 'error'); return; }
    
    // 1. Calcular Custo com Desconto de Facção (Ex: Construtores da Montanha)
    let cost = { ...STRUCTURE_COSTS[structureType] }; // Cópia segura
    if (this.main.factionLogic) {
        cost = this.main.factionLogic.modifyBuildCost(player, cost);
    }
    
    // 2. Verificar pagamento com custo descontado
    const canPay = Object.entries(cost).every(([k,v]) => (player.resources[k] || 0) >= v);
    
    if (!canPay) { this.main.showFeedback('Recursos insuficientes.', 'error'); return; }
    if (!this.consumeAction()) return;
    
    // 3. Pagar
    Object.entries(cost).forEach(([k,v]) => player.resources[k] -= v);
    region.structures.push(structureType);
    
    // 4. Calcular PV (Base + Eventos + Facção)
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
    addActivityLog({ type: 'build', playerName: player.name, action: `construiu ${structureType}`, details: region.name, turn: gameState.turn });
    
    this._finalizeAction();
  }

  _finalizeAction() {
    clearRegionSelection();
    this.main.turnLogic.checkVictory();
    if (window.uiManager) {
      window.uiManager.updateUI();
      if (window.uiManager.gameManager) {
          setTimeout(() => window.uiManager.gameManager.updateFooter(), 100);
      }    
    }
  }
}
