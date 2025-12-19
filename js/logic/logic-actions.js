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

  // Método para disputar território
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
  
  // Verificar se tem recursos para disputa padrão
  const standardCost = { ...GAME_CONFIG.ACTION_DETAILS.disputar.cost };
  const standardPvCost = GAME_CONFIG.ACTION_DETAILS.disputar.pv;
  
  const hasResourcesForStandard = Object.entries(standardCost).every(([k, v]) => 
    (player.resources[k] || 0) >= v
  ) && player.victoryPoints >= standardPvCost;

  // Verificar se tem recursos mínimos para dados
  const diceCost = { ...DICE_SYSTEM.DICE_COST };
  const dicePvCost = DICE_SYSTEM.DICE_PV_COST;
  
  const hasResourcesForDice = Object.entries(diceCost).every(([k, v]) => 
    (player.resources[k] || 0) >= v
  ) && player.victoryPoints >= dicePvCost;

  if (!hasResourcesForStandard && !hasResourcesForDice) {
    this.main.showFeedback(
      `Recursos insuficientes para qualquer tipo de disputa.\n` +
      `Disputa padrão: ${JSON.stringify(standardCost)} + ${standardPvCost} PV\n` +
      `Disputa com dados: ${JSON.stringify(diceCost)} + ${dicePvCost} PV`,
      'error'
    );
    return;
  }

  // Oferecer escolha se tiver recursos para ambos
  let useDiceSystem = !hasResourcesForStandard;
  
  if (hasResourcesForStandard && hasResourcesForDice) {
    const choice = await this.main.showChoice(
      'Método de Disputa',
      `Como deseja disputar ${region.name}?\n\n` +
      `👑 Disputa Estratégica (${JSON.stringify(standardCost)} + ${standardPvCost} PV)\n` +
      `- Chance baseada em PV, recursos e estratégia\n` +
      `- Maior controle sobre o resultado\n\n` +
      `🎲 Disputa de Sorte (${JSON.stringify(diceCost)} + ${dicePvCost} PV)\n` +
      `- Resolvido com dados virtuais\n` +
      `- Qualquer um pode vencer, independente de poder\n` +
      `- Baseado puramente em sorte`,
      ['estratégia', 'sorte']
    );
    
    if (choice === null) return; // Usuário cancelou
    useDiceSystem = (choice === 'sorte');
  }

  if (useDiceSystem) {
    await this._handleDiceContest(player, defender, region, diceCost, dicePvCost);
  } else {
    await this._handleStandardContest(player, defender, region, standardCost, standardPvCost);
  }

  this._finalizeAction();
}

async _handleDiceContest(attacker, defender, region, cost, pvCost) {
  // Calcular bônus para cada jogador
  const attackerBonus = this.calculateDiceBonus(attacker, true, region);
  const defenderBonus = this.calculateDiceBonus(defender, false, region);
  
  // Mostrar confirmação com detalhes
  const confirm = await this.main.showConfirm(
    'Disputa de Sorte 🎲',
    `Deseja gastar ${JSON.stringify(cost)} recursos e ${pvCost} PV para disputar ${region.name} em um lance de dados?\n\n` +
    `🎯 Atacante (${attacker.name}):\n` +
    `- Bônus: +${attackerBonus}\n` +
    `- Regiões: ${attacker.regions.length} (+${attacker.regions.length * DICE_SYSTEM.ATTACKER_DICE_BONUS_PER_REGION})\n\n` +
    `🛡️ Defensor (${defender.name}):\n` +
    `- Bônus: +${defenderBonus}\n` +
    `- Estruturas: ${region.structures.length} (+${region.structures.length * DICE_SYSTEM.DEFENDER_DICE_BONUS_PER_STRUCTURE})\n\n` +
    `Regras:\n` +
    `• Cada jogador lança 1d6 (1-6)\n` +
    `• Adiciona seu bônus ao resultado\n` +
    `• Maior valor vence a região\n` +
    `• Empate: ambos lançam novamente`
  );

  if (!confirm) return;
  
  if (!this.consumeAction()) return;

  // Pagar custos
  Object.entries(cost).forEach(([k, v]) => attacker.resources[k] -= v);
  attacker.victoryPoints -= pvCost;

  // Rolagem de dados
  let attackerRoll, defenderRoll;
  let round = 1;
  let winner = null;
  
  do {
    // Rolagem base
    attackerRoll = this.rollDice() + attackerBonus;
    defenderRoll = this.rollDice() + defenderBonus;
    
    // Aplicar modificadores de evento
    if (gameState.eventModifiers.diceBonus) {
      attackerRoll += gameState.eventModifiers.diceBonus;
      defenderRoll += gameState.eventModifiers.diceBonus;
    }
    
    // Aplicar bônus de facção
    if (this.main.factionLogic) {
      const attackerFactionBonus = this.main.factionLogic.getDiceBonus(attacker);
      const defenderFactionBonus = this.main.factionLogic.getDiceBonus(defender);
      
      attackerRoll += attackerFactionBonus;
      defenderRoll += defenderFactionBonus;
    }
    
    // Garantir valores mínimos e máximos
    attackerRoll = Math.max(1, Math.min(20, attackerRoll));
    defenderRoll = Math.max(1, Math.min(20, defenderRoll));
    
    // Determinar vencedor
    if (attackerRoll > defenderRoll) {
      winner = 'attacker';
    } else if (defenderRoll > attackerRoll) {
      winner = 'defender';
    }
    
    // Log da rodada
    const roundMsg = `🎲 Rodada ${round}: ${attacker.name} → ${attackerRoll} | ${defender.name} → ${defenderRoll}`;
    addActivityLog({
      type: 'dice',
      playerName: 'SISTEMA',
      action: 'rolagem de dados',
      details: roundMsg,
      turn: gameState.turn
    });
    
    round++;
    
  } while (winner === null && round <= 3); // Máximo de 3 rodadas
  
  // Se ainda empatou após 3 rodadas, vence o defensor (vantagem da defesa)
  if (winner === null) {
    winner = 'defender';
    this.main.showFeedback(`🤝 Empate após ${round-1} rodadas! Vantagem para o defensor.`, 'warning');
  }
  
  // Processar resultado
  if (winner === 'attacker') {
    // Conquista bem-sucedida
    this.transferRegionControl(region, attacker, defender);
    
    // Bônus especial por vitória com dados
    const diceVictoryBonus = this.calculateDiceVictoryBonus(attacker, defenderRoll, attackerRoll);
    if (diceVictoryBonus.pv > 0) {
      attacker.victoryPoints += diceVictoryBonus.pv;
    }
    if (diceVictoryBonus.resources) {
      Object.entries(diceVictoryBonus.resources).forEach(([k, v]) => {
        attacker.resources[k] = (attacker.resources[k] || 0) + v;
      });
    }
    
    this.main.showFeedback(
      `🎲 VITÓRIA POR SORTE! ${attacker.name} conquistou ${region.name}!\n` +
      `Resultado: ${attackerRoll} vs ${defenderRoll}\n` +
      (diceVictoryBonus.pv > 0 ? `+${diceVictoryBonus.pv} PV de bônus!` : ''),
      'success'
    );
    
    addActivityLog({
      type: 'contest',
      playerName: attacker.name,
      action: 'conquistou via dados',
      details: `${region.name} (${attackerRoll} vs ${defenderRoll})`,
      turn: gameState.turn
    });
    
    // Penalidade mínima para defensor (já perdeu a região)
    defender.victoryPoints = Math.max(0, defender.victoryPoints - 1);
    
  } else {
    // Defesa bem-sucedida
    this.main.showFeedback(
      `🛡️ DEFESA BEM-SUCEDIDA! ${defender.name} manteve ${region.name}!\n` +
      `Resultado: ${attackerRoll} vs ${defenderRoll}`,
      'info'
    );
    
    addActivityLog({
      type: 'contest',
      playerName: attacker.name,
      action: 'falhou na disputa de dados',
      details: `${region.name} (${attackerRoll} vs ${defenderRoll})`,
      turn: gameState.turn
    });
    
    // Bônus de defesa
    defender.victoryPoints += 2;
    this.main.showFeedback(`${defender.name} ganhou 2 PV pela defesa heroica!`, 'success');
    
    // Penalidade adicional para atacante (perdeu a aposta)
    attacker.victoryPoints = Math.max(0, attacker.victoryPoints - 1);
  }
}

// Métodos auxiliares para o sistema de dados
rollDice(sides = DICE_SYSTEM.DICE_SIDES) {
  return Math.floor(Math.random() * sides) + 1;
}

calculateDiceBonus(player, isAttacker, region = null) {
  let bonus = 0;
  
  // Bônus base por região (para atacante)
  if (isAttacker) {
    const regionBonus = player.regions.length * DICE_SYSTEM.ATTACKER_DICE_BONUS_PER_REGION;
    bonus += Math.min(regionBonus, DICE_SYSTEM.MAX_DICE_BONUS);
  }
  
  // Bônus por estruturas defensivas (para defensor)
  if (!isAttacker && region && region.structures) {
    const structureBonus = region.structures.length * DICE_SYSTEM.DEFENDER_DICE_BONUS_PER_STRUCTURE;
    bonus += Math.min(structureBonus, DICE_SYSTEM.MAX_DICE_BONUS);
  }
  
  // Bônus por PV (menor influência)
  const pvBonus = player.victoryPoints * 0.01; // 1% por PV
  bonus += Math.min(pvBonus, 0.1); // Máximo 10%
  
  return Math.round(bonus * 10) / 10; // Arredonda para 1 casa decimal
}

calculateDiceVictoryBonus(winner, loserRoll, winnerRoll) {
  const bonus = { pv: 0, resources: {} };
  const difference = winnerRoll - loserRoll;
  
  // Bônus por diferença significativa
  if (difference >= 5) {
    bonus.pv = 2;
    bonus.resources = { ouro: 1 };
    this.main.showFeedback('🎯 Vitória esmagadora! Bônus extra concedido.', 'success');
  } else if (difference >= 3) {
    bonus.pv = 1;
  }
  
  // Bônus por "sorte crítica" (rolagem máxima)
  if (winnerRoll >= 18) {
    bonus.pv += 1;
    bonus.resources.madeira = (bonus.resources.madeira || 0) + 1;
    bonus.resources.pedra = (bonus.resources.pedra || 0) + 1;
    this.main.showFeedback('✨ SORTE CRÍTICA! Recursos extras encontrados!', 'success');
  }
  
  return bonus;
}

// Método de disputa padrão (modificado para referência)
async _handleStandardContest(attacker, defender, region, cost, pvCost) {
  // Calcular chance de sucesso
  const successChance = this.calculateContestSuccessChance(attacker, defender, region);
  
  // Mostrar confirmação com detalhes
  const confirm = await this.main.showConfirm(
    'Disputa Estratégica 👑',
    `Deseja gastar ${JSON.stringify(cost)} recursos e ${pvCost} PV para disputar ${region.name}?\n\n` +
    `Defensor: ${defender.name}\n` +
    `Chance de sucesso: ${Math.round(successChance * 100)}%\n` +
    `Fatores considerados:\n` +
    `• Diferença de PV: ${attacker.victoryPoints - defender.victoryPoints}\n` +
    `• Nível de exploração: ${region.explorationLevel}\n` +
    `• Estruturas defensivas: ${region.structures.includes('Torre de Vigia') ? 'Sim' : 'Não'}\n` +
    `• Eventos ativos: ${gameState.currentEvent ? gameState.currentEvent.name : 'Nenhum'}`
  );

  if (!confirm) return;

  if (!this.consumeAction()) return;

  // Pagar custos
  Object.entries(cost).forEach(([k, v]) => attacker.resources[k] -= v);
  attacker.victoryPoints -= pvCost;

  // Determinar sucesso
  const success = Math.random() < successChance;

  if (success) {
    // Transferir região
    this.transferRegionControl(region, attacker, defender);
    
    // Bônus de facção
    let bonusMsg = '';
    if (this.main.factionLogic) {
      const factionBonus = this.main.factionLogic.applyContestBonus(attacker, region);
      if (factionBonus) {
        Object.entries(factionBonus).forEach(([k, v]) => {
          attacker.resources[k] = (attacker.resources[k] || 0) + v;
          bonusMsg += ` (+${v} ${k} Facção)`;
        });
      }
    }

    this.main.showFeedback(`🏆 Vitória Estratégica! Você conquistou ${region.name}${bonusMsg}`, 'success');
    addActivityLog({
      type: 'contest',
      playerName: attacker.name,
      action: 'conquistou estrategicamente',
      details: `${region.name} de ${defender.name}`,
      turn: gameState.turn
    });

    // Penalidade para o defensor
    defender.victoryPoints = Math.max(0, defender.victoryPoints - 2);
    this.main.showFeedback(`${defender.name} perdeu 2 PV pela derrota estratégica.`, 'info');

  } else {
    // Falha na disputa
    this.main.showFeedback(`❌ Disputa falhou! ${defender.name} manteve o controle de ${region.name}.`, 'error');
    addActivityLog({
      type: 'contest',
      playerName: attacker.name,
      action: 'falhou em conquistar',
      details: `${region.name} de ${defender.name}`,
      turn: gameState.turn
    });

    // Bônus de defesa para o defensor
    defender.victoryPoints += 1;
    this.main.showFeedback(`${defender.name} ganhou 1 PV pela defesa bem-sucedida.`, 'info');
  }
}

// Atualizar o método transferRegionControl para log apropriado
transferRegionControl(region, newController, oldController) {
  // Remover região do defensor
  oldController.regions = oldController.regions.filter(id => id !== region.id);
  
  // Adicionar ao atacante
  region.controller = newController.id;
  newController.regions.push(region.id);
  
  // Registrar mudança de controle
  region.lastController = oldController.id;
  region.conquestTurn = gameState.turn;
  
  // Manter estruturas (benefício para conquistador)
  if (region.structures.length > 0) {
    this.main.showFeedback(`🏗️ Estruturas mantidas: ${region.structures.join(', ')}`, 'info');
  }
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
