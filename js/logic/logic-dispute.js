// logic-dispute.js - Sistema de Disputa Territorial (REFATORADO COM CORREÇÕES)
import { 
  gameState, 
  achievementsState, 
  addActivityLog, 
  getCurrentPlayer, 
  getPlayerById,
  ELIMINATION_CONFIG,
  recordPlayerAchievementProgress,
  checkAndUnlockAchievements,
  hasAchievement
} from '../state/game-state.js';
import { GAME_CONFIG, STRUCTURE_EFFECTS, BIOME_INITIAL_RESOURCES } from '../state/game-config.js';

export class DisputeLogic {
  constructor(gameLogic) {
    this.main = gameLogic;
    this.lastCalculatedCosts = null; // Cache para custos calculados
    this.cacheTimestamp = null; // Timestamp do cache
  }

  // Validação da ação de disputa
  validateDispute() {
    if (gameState.turn <= 1) {
      this.main.showFeedback('Disputas territoriais não são permitidas na primeira rodada.', 'warning');
      return false;
    }

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

  // Calcular custos de disputa (Alinhado com a mecânica do Android GameEngine.kt)
  calculateDisputeCosts(player, region) {
    console.log('⚔️ Calculando custos de disputa para:', {
      player: player.name,
      region: region.name,
      controller: region.controller
    });
    
    const defender = getPlayerById(region.controller);
    if (!defender) {
      console.error('❌ Defensor não encontrado para região:', region);
      return null;
    }

    // Custo dinâmico de PV e proteção da Torre de Vigia
    const hasWatchtower = region.structures?.includes('Torre de Vigia');
    const watchtowerBonus = hasWatchtower ? 2 : 0;
    const dynamicPvCost = Math.max(1, Math.floor(1 + ((region.explorationLevel || 0) * 0.5) + watchtowerBonus));

    // Custos de recursos baseados no bioma da região com multiplicador de inflação
    const initialRes = BIOME_INITIAL_RESOURCES[region.biome] || { madeira: 2, pedra: 1, ouro: 1, agua: 1 };
    const inflationMult = gameState.eventModifiers?.inflacaoMultiplier || 
                          (gameState.currentEvent?.id === 'inflacao' ? 1.5 : 1.0);

    const baseCost = {
      pv: dynamicPvCost,
      madeira: Math.max(0, Math.floor((initialRes.madeira || 0) * inflationMult)),
      pedra: Math.max(0, Math.floor((initialRes.pedra || 0) * inflationMult)),
      ouro: Math.max(0, Math.floor((initialRes.ouro || 0) * inflationMult)),
      agua: Math.max(0, Math.floor((initialRes.agua || 0) * inflationMult))
    };

    let modifiers = {
      exploration: (region.explorationLevel || 0) * 0.5,
      watchtowerBonus,
      hasWatchtower
    };

    const finalCost = { ...baseCost };

    // Aplicar modificadores de facção
    if (this.main.factionLogic) {
      const factionModifier = this.main.factionLogic.modifyDisputeCost(player, finalCost, region);
      if (factionModifier) Object.assign(finalCost, factionModifier);
    }

    // Garantir valores inteiros
    finalCost.pv = Math.max(1, Math.floor(finalCost.pv));
    finalCost.madeira = Math.max(0, Math.floor(finalCost.madeira));
    finalCost.pedra = Math.max(0, Math.floor(finalCost.pedra));
    finalCost.ouro = Math.max(0, Math.floor(finalCost.ouro));
    finalCost.agua = Math.max(0, Math.floor(finalCost.agua));

    const successChance = this.calculateSuccessChance(player, defender, region, finalCost);

    return {
      baseCost,
      modifiers,
      finalCost,
      successChance,
      regionId: region.id,
      attackerId: player.id,
      defenderId: defender.id,
      timestamp: Date.now()
    };
  }

  // Calcular chance de sucesso
  calculateSuccessChance(attacker, defender, region, disputeCost) {
    let baseChance = 75; // 75% base para recompensar planejamento e investimento de recursos

    // Fatores que aumentam a chance:
    // 1. Diferença de PV a favor do atacante
    const pvDiff = attacker.victoryPoints - defender.victoryPoints;
    if (pvDiff > 0) {
      baseChance += Math.min(15, pvDiff * 1.5);
    }

    // 2. Nível de exploração ajuda no reconhecimento do terreno
    if (region.explorationLevel > 0) {
      baseChance += region.explorationLevel * 3;
    }

    // 3. Estruturas defensivas reduzem a chance se tiver Torre de Vigia
    if (region.structures?.includes('Torre de Vigia')) {
      baseChance -= 15;
    }

    // 4. Bônus de facção do defensor
    if (this.main.factionLogic) {
      const factionDefense = this.main.factionLogic.getDefenseBonus(defender, region) || 0;
      baseChance -= factionDefense;
    }

    // 5. Bônus de conquistas
    if (hasAchievement(attacker.id, 'senhor_guerra')) {
      baseChance += 15;
    }
    if (hasAchievement(defender.id, 'conquistador')) {
      baseChance -= 10;
    }

    return Math.max(35, Math.min(95, Math.round(baseChance)));
  }

  // Verificar se jogador pode pagar custos de disputa
  canAffordDispute(player, region = null) {
    if (gameState.turn <= 1) return false;
    if (!region) {
      return player.victoryPoints >= 1;
    }
    const hasWatchtower = region.structures?.includes('Torre de Vigia');
    const pvCost = Math.max(1, Math.floor(1 + ((region.explorationLevel || 0) * 0.5) + (hasWatchtower ? 2 : 0)));
    if (player.victoryPoints < pvCost) return false;

    const initialRes = BIOME_INITIAL_RESOURCES[region.biome] || { madeira: 1, pedra: 1, ouro: 1, agua: 1 };
    return (player.resources.madeira || 0) >= (initialRes.madeira || 0) &&
           (player.resources.pedra || 0) >= (initialRes.pedra || 0) &&
           (player.resources.ouro || 0) >= (initialRes.ouro || 0) &&
           (player.resources.agua || 0) >= (initialRes.agua || 0);
  }

  // Executar disputa para receber região e jogador - MÉTODO PRINCIPAL REFATORADO
  async handleDispute(region, attacker, skipValidation = false) {
    console.log('⚔️ Iniciando disputa:', {
      regionId: region.id,
      regionName: region.name,
      attackerId: attacker.id,
      attackerName: attacker.name,
      skipValidation
    });

    // Se skipValidation for true, pular validações (útil quando chamado da UI)
    if (!skipValidation) {
      const currentPhase = gameState.currentPhase;
      if (currentPhase !== 'acoes') {
        const errorMsg = 'Disputas só podem ser realizadas na fase de ações.';
        console.error('❌', errorMsg);
        throw new Error(errorMsg);
      }

      if (gameState.actionsLeft <= 0) {
        const errorMsg = 'Sem ações restantes neste turno.';
        console.error('❌', errorMsg);
        throw new Error(errorMsg);
      }

      if (attacker.eliminated) {
        const errorMsg = 'Jogador eliminado não pode disputar.';
        console.error('❌', errorMsg);
        throw new Error(errorMsg);
      }
    }
    
    const defender = getPlayerById(region.controller);
    if (!defender) {
      const errorMsg = `Defensor da região ${region.name} não encontrado.`;
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }
    
    // Calcular custos (usar cache se disponível e recente)
    let disputeData;
    const CACHE_VALIDITY_MS = 5000; // 5 segundos
    
    if (this.lastCalculatedCosts && 
        this.lastCalculatedCosts.regionId === region.id &&
        this.lastCalculatedCosts.attackerId === attacker.id &&
        this.cacheTimestamp && 
        (Date.now() - this.cacheTimestamp) < CACHE_VALIDITY_MS) {
      disputeData = this.lastCalculatedCosts.data;
      console.log('⚔️ Usando cache de custos (recente)');
    } else {
      console.log('⚔️ Calculando novos custos (cache expirado ou inexistente)');
      disputeData = this.calculateDisputeCosts(attacker, region);
      if (!disputeData) {
        const errorMsg = 'Não foi possível calcular os custos da disputa.';
        console.error('❌', errorMsg);
        throw new Error(errorMsg);
      }
      
      // Armazenar em cache com timestamp
      this.lastCalculatedCosts = {
        regionId: region.id,
        attackerId: attacker.id,
        data: disputeData
      };
      this.cacheTimestamp = Date.now();
    }
    
    // VERIFICAÇÃO FINAL DE RECURSOS
    const finalCost = disputeData.finalCost;
    const canPay = Object.entries(finalCost).every(([resource, amount]) => {
      if (resource === 'pv') {
        return attacker.victoryPoints >= amount;
      }
      return (attacker.resources[resource] || 0) >= amount;
    });
    
    if (!canPay) {
      const errorMsg = 'Recursos insuficientes para iniciar a disputa.';
      console.error('❌', errorMsg, { finalCost, attackerResources: attacker.resources });
      throw new Error(errorMsg);
    }
    
    // Consumir ação
    if (!this.consumeAction()) {
      const errorMsg = 'Não foi possível consumir ação para disputa.';
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }
    
    // Pagar custos
    console.log('⚔️ Pagando custos da disputa:', finalCost);
    attacker.victoryPoints -= finalCost.pv;
    Object.entries(finalCost).forEach(([resource, amount]) => {
      if (resource !== 'pv' && amount > 0) {
        const currentAmount = attacker.resources[resource] || 0;
        attacker.resources[resource] = Math.max(0, currentAmount - amount);
        console.log(`  - ${resource}: ${currentAmount} -> ${attacker.resources[resource]}`);
      }
    });
    // Determinar resultado
    const success = Math.random() * 100 < disputeData.successChance;
    console.log(`⚔️ Resultado da disputa: ${success ? 'VITÓRIA' : 'DERROTA'} (chance: ${disputeData.successChance}%)`);
    
    if (success) {
      await this._handleSuccessfulDispute(attacker, defender, region, disputeData);
    } else {
      await this._handleFailedDispute(attacker, defender, region, disputeData);
    }
    
    // Limpar cache após execução
    this.lastCalculatedCosts = null;
    this.cacheTimestamp = null;
    
    // Atualizar visual da região usando método centralizado
    this._updateRegionCell(region.id);
    
    // Verificar vitória
    this.main.turnLogic.checkVictory();
    
    return success;
  }
  
  // Método auxiliar para consumir ação
  consumeAction() {
    if (gameState.actionsLeft <= 0) {
      console.error('❌ Sem ações para consumir');
      return false;
    }
    
    gameState.actionsLeft--;
    console.log(`⚔️ Ação consumida. Ações restantes: ${gameState.actionsLeft}`);
    
    if (window.uiManager && window.uiManager.gameManager) {
      setTimeout(() => {
        if (window.uiManager.gameManager.updateFooter) {
          window.uiManager.gameManager.updateFooter();
        }
      }, 10);
    }
    
    return true;
  }
  
  // Método para obter dados de disputa sem executar
  getDisputeData(regionId, attackerId) {
    console.log('⚔️ Obtendo dados de disputa para:', { regionId, attackerId });
    
    const region = gameState.regions[regionId];
    const attacker = getPlayerById(attackerId);
    
    if (!region || !attacker) {
      console.error('❌ Região ou atacante não encontrados');
      return null;
    }
    
    const disputeData = this.calculateDisputeCosts(attacker, region);
    if (!disputeData) return null;
    
    // Armazenar em cache
    this.lastCalculatedCosts = {
      regionId: region.id,
      attackerId: attacker.id,
      data: disputeData
    };
    this.cacheTimestamp = Date.now();
    
    return disputeData;
  }
  
  // Processar disputa bem-sucedida
  async _handleSuccessfulDispute(attacker, defender, region, disputeData) {
    console.log(`🏆 Disputa bem-sucedida! ${attacker.name} conquistou ${region.name} de ${defender.name}`);
    
    // Remover região do defensor
    defender.regions = defender.regions.filter(id => id !== region.id);
    
    // Adicionar região ao atacante
    attacker.regions.push(region.id);
    
    // Atualizar controlador
    region.controller = attacker.id;
    
    // Ajuste (como no Android GameEngine.kt): mantém o nível de exploração e as estruturas intactas!
    // Conquistar um território desenvolvido preserva seu valor econômico e estratégico.
    
    // Proteção da Torre de Vigia (como no Android GameEngine.kt):
    // Sem Torre de Vigia, o defensor perde 1 PV. Com Torre de Vigia, a perda de PV do defensor é anulada.
    const hasWatchtower = region.structures?.includes('Torre de Vigia');
    const defenderPvLoss = hasWatchtower ? 0 : 1;
    if (defenderPvLoss > 0) {
      defender.victoryPoints = Math.max(0, defender.victoryPoints - defenderPvLoss);
    }

    // Bônus de conquista
    attacker.victoryPoints += 1; // Bônus por conquista
    recordPlayerAchievementProgress(attacker.id, 'dispute_win');
    checkAndUnlockAchievements(attacker.id);
    checkAndUnlockAchievements(defender.id);

    // Log
    const defenseMsg = hasWatchtower ? ' (Torre de Vigia evitou perda de PV do defensor)' : ' (-1 PV para o defensor)';
    this.main.showFeedback(`✅ Vitória! Você conquistou ${region.name}! +1 PV${defenseMsg}`, 'success');
    addActivityLog({
      type: 'dispute',
      playerName: attacker.name,
      action: 'conquistou',
      details: `${region.name} de ${defender.name}${defenseMsg}`,
      turn: gameState.turn,
      success: true
    });

    // Verificar se defensor ficou sem regiões
    if (defender.regions.length === 0) {
      console.log(`💀 Defensor ${defender.name} ficou sem regiões, eliminando...`);
      this._handlePlayerElimination(defender);
    }
  }

  // NOVO MÉTODO: Atualizar célula de região usando método centralizado
  _updateRegionCell(regionId) {
    console.log('🔄 Atualizando visual da região via método centralizado:', regionId);
    
    // Usar método centralizado do UIGameManager se disponível
    if (window.updateRegionCell && typeof window.updateRegionCell === 'function') {
      return window.updateRegionCell(regionId);
    }
    
    // Fallback: usar UI Manager se disponível
    if (window.uiManager && window.uiManager.gameManager && window.uiManager.gameManager.updateRegionCell) {
      return window.uiManager.gameManager.updateRegionCell(regionId);
    }
    
    // Fallback extremo: tentar atualizar diretamente
    console.warn('⚠️ Método centralizado não disponível, usando fallback direto');
    try {
      const region = gameState.regions[regionId];
      if (!region) return false;
      
      const cell = document.querySelector(`.board-cell[data-region-id="${regionId}"]`);
      if (cell && window.uiManager && window.uiManager.gameManager && window.uiManager.gameManager.regionRenderer) {
        const newCell = window.uiManager.gameManager.regionRenderer.createRegionCell(region, regionId);
        const parent = cell.parentNode;
        parent.replaceChild(newCell, cell);
        return true;
      }
    } catch (error) {
      console.error('❌ Erro no fallback de atualização de região:', error);
    }
    
    return false;
  }

  // Processar disputa falhada
  async _handleFailedDispute(attacker, defender, region, disputeData) {
    console.log(`❌ Disputa falhou! ${attacker.name} não conseguiu conquistar ${region.name}`);
    
    // [BALANCE] Defensor NÃO ganha PV por defesa bem-sucedida (era +1 PV, removia o risco assimétrico)
    // O risco já foi pago pelo atacante em PV ao iniciar a disputa

    // Devolver 50% dos recursos pagos ao atacante (apenas recursos, não PV)
    if (disputeData && disputeData.finalCost) {
      const refundResources = {};
      Object.entries(disputeData.finalCost).forEach(([resource, amount]) => {
        if (resource !== 'pv' && amount > 0) {
          const refund = Math.floor(amount * 0.5);
          if (refund > 0) {
            attacker.resources[resource] = (attacker.resources[resource] || 0) + refund;
            refundResources[resource] = refund;
          }
        }
      });
      if (Object.keys(refundResources).length > 0) {
        console.log(`⚔️ Reembolso de 50% ao atacante:`, refundResources);
      }
    }

    // A região ganha bônus defensivo por ter sido defendida com sucesso
    region.explorationLevel = Math.min(3, region.explorationLevel + 1);

    recordPlayerAchievementProgress(attacker.id, 'dispute_loss');
    checkAndUnlockAchievements(defender.id);

    // Log
    this.main.showFeedback(`❌ Falha! ${defender.name} defendeu ${region.name}. 50% dos recursos foram devolvidos.`, 'error');
    addActivityLog({
      type: 'dispute',
      playerName: attacker.name,
      action: 'falhou em conquistar',
      details: `${region.name} de ${defender.name}`,
      turn: gameState.turn,
      success: false
    });
  }

  // Eliminar jogador sem regiões dominadas
  _handlePlayerElimination(player) {
    console.log(`💀 Eliminando jogador ${player.name} (sem regiões)`);
    
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