// logic-dispute.js - Sistema de Disputa Territorial
import { 
  gameState, 
  achievementsState, 
  addActivityLog, 
  getCurrentPlayer, 
  getPlayerById 
} from '../state/game-state.js';
import { GAME_CONFIG, STRUCTURE_EFFECTS } from '../state/game-config.js';

export class DisputeLogic {
  constructor(gameLogic) {
    this.main = gameLogic;
  }

  // Validação da ação de disputa
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

    // Verificar custos básicos
    if (!this.canAffordDispute(currentPlayer)) {
      this.main.showFeedback('Recursos insuficientes para iniciar disputa.', 'error');
      return false;
    }

    return true;
  }

  // Calcular custos de disputa
  calculateDisputeCosts(player, region) {
    const defender = getPlayerById(region.controller);
    const baseCost = {
      pv: 3, // Custo base em pontos de vitória
      madeira: 2,
      pedra: 2,
      ouro: 3,
      agua: 1
    };

    // Modificadores baseados na região - USAR Math.floor para valores inteiros
    let modifiers = {
      exploration: Math.floor(region.explorationLevel * 0.5), // Arredondar para baixo
      structures: 0,
      defenderAdvantage: 0
    };

    // Bônus por estruturas defensivas
    region.structures.forEach(structure => {
      if (structure === 'Torre de Vigia') {
        modifiers.structures += 2;
      } else if (structure === 'Santuário') {
        modifiers.structures += 1;
      }
    });

    // Diferença de PV entre jogadores - USAR Math.floor
    const pvDifference = defender.victoryPoints - player.victoryPoints;
    if (pvDifference > 0) {
      modifiers.defenderAdvantage = Math.floor(pvDifference * 0.1);
    }

    // Custo final - USAR Math.max para garantir inteiros
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

    // Garantir valores mínimos e inteiros
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

  // Calcular chance de sucesso
  calculateSuccessChance(attacker, defender, region, disputeCost) {
    let baseChance = 50; // 50% base

    // Fatores que aumentam a chance:
    // 1. Diferença de PV a favor do atacante
    const pvDiff = attacker.victoryPoints - defender.victoryPoints;
    if (pvDiff > 0) {
      baseChance += Math.min(20, pvDiff * 2); // +2% por PV de vantagem, até 20%
    }

    // 2. Recursos gastos acima do mínimo
    const resourceBonus = Math.min(15, 
      (disputeCost.madeira - 1) * 2 +
      (disputeCost.pedra - 1) * 2 +
      (disputeCost.ouro - 1) * 3 +
      disputeCost.agua * 1
    );
    baseChance += resourceBonus;

    // 3. Nível de exploração (conhecer a região ajuda)
    if (region.explorationLevel > 0) {
      baseChance += region.explorationLevel * 5; // +5% por nível
    }

    // Fatores que diminuem a chance:
    // 1. Estruturas defensivas
    if (region.structures.includes('Torre de Vigia')) {
      baseChance -= 15;
    }
    if (region.structures.includes('Santuário')) {
      baseChance -= 10;
    }

    // 2. Diferença de PV a favor do defensor
    if (pvDiff < 0) {
      baseChance += Math.max(-30, pvDiff * 1.5); // -1.5% por PV de desvantagem
    }

    // 3. Bônus de facção do defensor
    if (this.main.factionLogic) {
      const factionDefense = this.main.factionLogic.getDefenseBonus(defender, region);
      baseChance -= factionDefense;
    }

    // Limites
    return Math.max(10, Math.min(90, baseChance));
  }

  // Verificar se pode pagar a disputa
  canAffordDispute(player) {
    // Verificação básica - custos serão calculados precisamente depois
    return player.victoryPoints >= 3 && 
           player.resources.ouro >= 2 &&
           player.resources.madeira >= 1 &&
           player.resources.pedra >= 1;
  }

  // Executar disputa para receber região e jogador
async handleDispute(region, attacker) {
    // Verificar se o jogo já terminou
    if (this.main.turnLogic && this.main.turnLogic.gameEnded) {
        this.main.showFeedback('O jogo já terminou!', 'warning');
        return;
    }
    
    // Verificar ações restantes
    if (gameState.actionsLeft <= 0) {
        this.main.showFeedback('Sem ações restantes neste turno.', 'warning');
        return;
    }
    
    // Verificar se a região ainda é válida para disputa
    if (region.controller === null || region.controller === attacker.id) {
        this.main.showFeedback('Esta região não pode ser disputada.', 'error');
        return;
    }
    
  // Calcular custos e chances
  const disputeData = this.calculateDisputeCosts(attacker, region);
  const defender = getPlayerById(region.controller);
  
  // Modal de confirmação
  const confirmMessage = `
    <div class="space-y-2">
      <p class="font-semibold">Disputar ${region.name} com ${defender.name}?</p>
      <div class="bg-gray-800 p-3 rounded">
        <p class="text-sm">Custos da Disputa:</p>
        <div class="grid grid-cols-2 gap-1 text-sm mt-1">
          <div>PV: ${disputeData.finalCost.pv} ⭐</div>
          <div>Madeira: ${disputeData.finalCost.madeira} 🪵</div>
          <div>Pedra: ${disputeData.finalCost.pedra} 🪨</div>
          <div>Ouro: ${disputeData.finalCost.ouro} 🪙</div>
          ${disputeData.finalCost.agua > 0 ? `<div>Água: ${disputeData.finalCost.agua} 💧</div>` : ''}
        </div>
      </div>
      <div class="bg-blue-900/30 p-3 rounded">
        <p class="text-sm">Chance de Sucesso:</p>
        <div class="flex items-center mt-1">
          <div class="w-full bg-gray-700 rounded-full h-4">
            <div class="bg-green-600 h-4 rounded-full" style="width: ${disputeData.successChance}%"></div>
          </div>
          <span class="ml-2 font-bold">${Math.round(disputeData.successChance)}%</span>
        </div>
        <p class="text-xs mt-2 text-gray-300">
          ${disputeData.successChance >= 70 ? 'Alta chance de sucesso!' : 
            disputeData.successChance >= 40 ? 'Chance moderada.' : 
            'Baixa chance - considere fortalecer-se primeiro.'}
        </p>
      </div>
      <p class="text-xs text-yellow-300">Atenção: Em caso de falha, você perde os recursos gastos!</p>
    </div>
  `;

  const confirmed = await this.main.showConfirm(
    '🗡️ Disputa Territorial', 
    confirmMessage
  );

  if (!confirmed) {
    // Se cancelar, devolver a ação
    gameState.actionsLeft++;
    return;
  }

  // Pagar custos
  attacker.victoryPoints -= disputeData.finalCost.pv;
  Object.entries(disputeData.finalCost).forEach(([resource, amount]) => {
    if (resource !== 'pv' && amount > 0) {
      attacker.resources[resource] = Math.max(0, (attacker.resources[resource] || 0) - amount);
    }
  });

  // Determinar resultado
  const success = Math.random() * 100 < disputeData.successChance;
  
  if (success) {
    await this._handleSuccessfulDispute(attacker, defender, region, disputeData);
  } else {
    await this._handleFailedDispute(attacker, defender, region, disputeData);
  }
  
  // Atualizar visual da região IMEDIATAMENTE
  this._updateRegionVisual(region.id);
  
  // Verificar vitória
  this._finalizeDispute();

  // Verificar vitória
  this.main.turnLogic.checkVictory();
}

  // Processar disputa bem-sucedida
  async _handleSuccessfulDispute(attacker, defender, region, disputeData) {
    // Remover região do defensor
    defender.regions = defender.regions.filter(id => id !== region.id);
    
    // Adicionar região ao atacante
    attacker.regions.push(region.id);
    
    // Atualizar controlador
    region.controller = attacker.id;
    
    // Reduzir nível de exploração (dano durante a disputa)
    region.explorationLevel = Math.max(0, region.explorationLevel - 1);
    
    // Manter estruturas? 50% chance de cada estrutura sobreviver
    if (region.structures.length > 0) {
      region.structures = region.structures.filter(() => Math.random() > 0.5);
    }

    // Bônus de conquista
    attacker.victoryPoints += 1; // Bônus por conquista
    achievementsState.totalDisputes = (achievementsState.totalDisputes || 0) + 1;
    achievementsState.successfulDisputes = (achievementsState.successfulDisputes || 0) + 1;

    // Log
    this.main.showFeedback(`✅ Vitória! Você conquistou ${region.name}! +1 PV`, 'success');
    addActivityLog({
      type: 'dispute',
      playerName: attacker.name,
      action: 'conquistou',
      details: `${region.name} de ${defender.name}`,
      turn: gameState.turn,
      success: true
    });

    // Verificar se defensor ficou sem regiões
    if (defender.regions.length === 0) {
      this._handlePlayerElimination(defender);
    }
  }

_updateRegionVisual(regionId) {
  const cell = document.querySelector(`.board-cell[data-region-id="${regionId}"]`);
  if (cell && window.uiManager && window.uiManager.gameManager) {
    // Remover e recriar a célula
    const region = gameState.regions[regionId];
    const newCell = window.uiManager.gameManager.createRegionCell(region, regionId);
    
    // Substituir a célula antiga
    const parent = cell.parentNode;
    parent.replaceChild(newCell, cell);
    
    // Adicionar animação de atualização
    newCell.classList.add('region-updated');
    setTimeout(() => {
      newCell.classList.remove('region-updated');
    }, 1000);
  }
}

  // Processar disputa falhada
  async _handleFailedDispute(attacker, defender, region, disputeData) {
    // Defensor ganha 1 PV por defender com sucesso
    defender.victoryPoints += 1;
    
    // A região pode ganhar bônus defensivo
    region.explorationLevel = Math.min(3, region.explorationLevel + 1);

    achievementsState.totalDisputes = (achievementsState.totalDisputes || 0) + 1;
    achievementsState.failedDisputes = (achievementsState.failedDisputes || 0) + 1;

    // Log
    this.main.showFeedback(`❌ Falha! ${defender.name} defendeu ${region.name}. -1 PV para você, +1 PV para ${defender.name}`, 'error');
    addActivityLog({
      type: 'dispute',
      playerName: attacker.name,
      action: 'falhou em conquistar',
      details: `${region.name} de ${defender.name}`,
      turn: gameState.turn,
      success: false
    });
  }

  // Eliminar jogador sem regiões
_handlePlayerElimination(player) {
  // Usar a função do game-state para eliminar
  const eliminated = window.gameState?.eliminatePlayer?.(player.id);
  
  if (eliminated) {
    // A função eliminatePlayer já aplica penalidades e atualiza o estado
    // Agora vamos registrar no log
    addActivityLog({
      type: 'elimination',
      playerName: 'SISTEMA',
      action: 'eliminou',
      details: `${player.name} (perdeu todas as regiões)`,
      turn: gameState.turn,
      isEvent: true
    });
    
    // Verificar vitória por eliminação
    const victoryCheck = window.gameState?.checkEliminationVictory?.();
    
    if (victoryCheck) {
      if (victoryCheck.type === 'elimination_victory') {
        // Declarar vitória do jogador restante
        this.main.turnLogic._declareVictory(victoryCheck.winner);
      } else if (victoryCheck.type === 'no_winner') {
        // Todos eliminados - mostrar modal especial
        this.main.showFeedback(victoryCheck.message, 'warning');
        
        if (window.uiManager?.modals?.showNoWinnerModal) {
          window.uiManager.modals.showNoWinnerModal();
        }
      }
    }
  }
  
  // Mostrar feedback
  const penalty = Math.max(
    ELIMINATION_CONFIG.MIN_PENALTY_PV,
    Math.min(
      ELIMINATION_CONFIG.MAX_PENALTY_PV,
      Math.floor(player.victoryPoints * ELIMINATION_CONFIG.PENALTY_PV_PERCENTAGE)
    )
  );
  
  this.main.showFeedback(
    `💀 ${player.name} foi eliminado! -${penalty} PV de penalidade.`,
    'warning'
  );
}
}
