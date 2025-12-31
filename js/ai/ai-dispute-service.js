// ai-dispute-service.js - Serviço de Disputas para IA
import { GAME_CONFIG } from '../state/game-config.js';

export class AIDisputeService {
  constructor(disputeLogic) {
    this.disputeLogic = disputeLogic;
  }

  // ==================== AVALIAÇÃO DE DISPUTAS ====================
  
  evaluateDisputeOpportunities(player, gameState, aiPersonality) {
    const rawOpportunities = this.disputeLogic.getDisputeOpportunities(player, gameState);
    
    return rawOpportunities
      .map(opp => ({
        ...opp,
        score: this._applyPersonalityModifiers(opp.score, aiPersonality),
        risk: this._calculateRisk(player, opp.disputeData)
      }))
      .filter(opp => opp.validation === 'ready')
      .sort((a, b) => b.score - a.score);
  }
  
  _applyPersonalityModifiers(baseScore, personality) {
    const multipliers = {
      expansionist: 1.5,
      builder: 0.7,
      economist: 1.0,
      diplomat: 0.5
    };
    
    return baseScore * (multipliers[personality.type] || 1.0);
  }
  
  _calculateRisk(player, disputeData) {
    const costTotal = Object.values(disputeData.finalCost).reduce((a, b) => a + b, 0);
    const playerResourceTotal = Object.values(player.resources).reduce((a, b) => a + b, 0);
    
    return (costTotal / playerResourceTotal) * 100;
  }

  // ==================== DECISÃO DE DISPUTA ====================
  
  shouldExecuteDispute(player, opportunities, difficulty) {
    if (opportunities.length === 0) return false;
    
    const thresholds = {
      easy: 50,
      medium: 40,
      hard: 30,
      master: 25
    };
    
    const bestOpportunity = opportunities[0];
    const threshold = thresholds[difficulty] || 40;
    
    return bestOpportunity.score >= threshold && bestOpportunity.risk < 70;
  }
  
  getBestDisputeTarget(opportunities) {
    if (opportunities.length === 0) return null;
    
    return opportunities.reduce((best, current) => {
      if (current.score > best.score) return current;
      if (current.score === best.score && current.risk < best.risk) return current;
      return best;
    });
  }

  // ==================== VALIDAÇÃO ====================
  
  validateDisputeAction(player, regionId, gameState) {
    const region = gameState.regions[regionId];
    if (!region) return { valid: false, reason: 'Região não existe' };
    
    if (region.controller === null) {
      return { valid: false, reason: 'Região não tem dono (use assume_control)' };
    }
    
    if (region.controller === player.id) {
      return { valid: false, reason: 'Você já controla essa região' };
    }
    
    const disputeData = this.disputeLogic.calculateDisputeCosts(player, region);
    
    if (player.victoryPoints < disputeData.finalCost.pv) {
      return { valid: false, reason: `PV insuficientes (precisa ${disputeData.finalCost.pv})` };
    }
    
    const canPay = Object.entries(disputeData.finalCost).every(([resource, amount]) => {
      if (resource === 'pv') return true;
      return (player.resources[resource] || 0) >= amount;
    });
    
    if (!canPay) {
      return { valid: false, reason: 'Recursos insuficientes para disputar' };
    }
    
    return { valid: true, reason: '' };
  }
  
  // ==================== ESTATÍSTICAS ====================
  
  getDisputeStatistics(player, gameState) {
    const opportunities = this.disputeLogic.getDisputeOpportunities(player, gameState);
    const validOpportunities = opportunities.filter(opp => opp.validation === 'ready');
    
    return {
      totalOpportunities: opportunities.length,
      validOpportunities: validOpportunities.length,
      averageSuccessChance: validOpportunities.length > 0 ? 
        validOpportunities.reduce((sum, opp) => sum + opp.disputeData.successChance, 0) / validOpportunities.length : 0,
      bestTarget: validOpportunities.length > 0 ? validOpportunities[0] : null,
      canAffordAny: validOpportunities.length > 0
    };
  }
}