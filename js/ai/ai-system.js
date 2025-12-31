// ai-system.js - Sistema de Inteligência Artificial (Refatorado)
import { AI_DIFFICULTY_SETTINGS, AI_PERSONALITIES } from './ai-config.js';
import { AINegotiationService } from './ai-negotiation-service.js';
import { AIActionService } from './ai-action-service.js';
import { AIStrategyService } from './ai-strategy-service.js';
import { AIDisputeService } from './ai-dispute-service.js';

export class AIBrain {
  constructor(playerId, difficulty = 'medium', gameLogic = null) {
    this.playerId = Number(playerId);
    this.difficulty = difficulty;
    this.settings = AI_DIFFICULTY_SETTINGS[difficulty] || AI_DIFFICULTY_SETTINGS.medium;
    this.personality = this._assignPersonality();
    this.gameLogic = gameLogic;
    
    // Inicializar serviços
    this.negotiationService = null;
    this.actionService = null;
    this.strategyService = null;
    this.disputeService = null;
    
    // Memória
    this.memory = {
      playerStyles: {},
      regionValues: {},
      lastActions: [],
      negotiationHistory: []
    };
    
    this.currentPlan = null;
    this.phase = 'idle';
    this.initialized = false;
    
    console.log(`🤖 IA criada: ID ${this.playerId}, Dificuldade ${difficulty}, Personalidade ${this.personality.type}`);
  }

  // ==================== INICIALIZAÇÃO ====================
  
  initialize(gameLogic = null) {
    if (this.initialized) return;
    
    if (gameLogic) this.gameLogic = gameLogic;
    
    this.negotiationService = new AINegotiationService(this);
    this.actionService = new AIActionService(this, this.gameLogic);
    this.strategyService = new AIStrategyService(this);
    
    // Inicializar disputeService apenas se gameLogic.disputeLogic estiver disponível
    if (this.gameLogic?.disputeLogic) {
      this.disputeService = new AIDisputeService(this.gameLogic.disputeLogic);
    }
    
    this.initialized = true;
    console.log(`🤖 Serviços da IA inicializados para jogador ${this.playerId}`);
  }
  
  _assignPersonality() {
    const weights = this.settings.personalityWeights;
    const rand = Math.random();
    let cumulative = 0;
    
    for (const [type, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (rand <= cumulative) {
        return { type, ...AI_PERSONALITIES[type] };
      }
    }
    
    return { type: 'expansionist', ...AI_PERSONALITIES.expansionist };
  }

  // ==================== TURNO PRINCIPAL ====================
  
  async takeTurn(gameState, uiManager) {
    if (gameState.currentPlayerIndex !== this.playerId) {
      console.log(`⏸️ Não é turno desta IA. Jogador atual: ${gameState.currentPlayerIndex}, IA: ${this.playerId}`);
      return false;
    }
    
    if (!this.initialized) {
      console.warn(`🤖 IA não inicializada para jogador ${this.playerId}, inicializando agora...`);
      this.initialize();
    }
    
    this.phase = 'planning';
    
    try {
      // 1. Análise Estratégica
      const analysis = this.strategyService.analyzeGameState(gameState);
      
      // 2. Geração de Plano
      this.currentPlan = this.strategyService.generateStrategicPlan(analysis, gameState);
      
      console.log(`🤖 Plano estratégico: ${this.currentPlan.primaryGoal}`);
      
      // 3. Execução Baseada na Fase
      await this._executePhase(gameState, uiManager, analysis);
      
      this.phase = 'completed';
      return true;
      
    } catch (error) {
      console.error('🤖 ERRO em takeTurn:', error);
      this.phase = 'error';
      
      // Tenta terminar o turno em caso de erro
      setTimeout(() => {
        if (this.gameLogic?.forceAIEndTurn) {
          this.gameLogic.forceAIEndTurn();
        } else if (window.gameLogic?.forceAIEndTurn) {
          window.gameLogic.forceAIEndTurn();
        }
      }, 1000);
      
      return false;
    }
  }
  
  async _executePhase(gameState, uiManager, analysis) {
    switch (gameState.currentPhase) {
      case 'renda':
        await this._handleIncomePhase(gameState);
        break;
      case 'acoes':
        await this._handleActionsPhase(gameState, uiManager, analysis);
        break;
      case 'negociacao':
        await this._handleNegotiationPhase(gameState);
        break;
      default:
        console.warn(`🤖 Fase desconhecida: ${gameState.currentPhase}`);
    }
  }

  // ==================== FASES DO JOGO ====================
  
  async _handleIncomePhase(gameState) {
    console.log(`🤖 Processando fase de renda...`);
    await this._delay(1000);
    
    // A renda já foi aplicada, avançar para ações
    if (this.gameLogic?.coordinator) {
      this.gameLogic.coordinator.setCurrentPhase('acoes');
      this.gameLogic.coordinator.resetActions();
    } else if (window.gameLogic?.coordinator) {
      window.gameLogic.coordinator.setCurrentPhase('acoes');
      window.gameLogic.coordinator.resetActions();
    }
  }
  
  async _handleActionsPhase(gameState, uiManager, analysis) {
    console.log(`🤖 Executando fase de ações (${gameState.actionsLeft} ações restantes)`);
    
    // Verificar disputas primeiro (se houver serviço de disputa)
    if (this.disputeService && gameState.actionsLeft > 0) {
      const player = gameState.players[this.playerId];
      const disputeOps = this.disputeService.evaluateDisputeOpportunities(
        player, 
        gameState,
        this.personality
      );
      
      if (disputeOps.length > 0 && this._shouldExecuteDispute(disputeOps)) {
        await this._executeDisputeAction(disputeOps[0], gameState);
      }
    }
    
    // Executar ações normais
    while (gameState.actionsLeft > 0 && this.actionService) {
      await this.actionService.executeActionPhase(gameState, uiManager);
      await this._delay(800);
    }
    
    console.log(`🤖 Fase de ações concluída`);
  }
  
  async _handleNegotiationPhase(gameState) {
    console.log(`🤖 Executando fase de negociação`);
    
    // Processar propostas pendentes
    if (this.negotiationService) {
      await this.negotiationService.processPendingNegotiations(gameState);
    }
    
    // Enviar proposta se possível
    if (gameState.actionsLeft > 0 && gameState.players[this.playerId].resources.ouro >= 1) {
      if (this.negotiationService) {
        await this.negotiationService.createAndSendProposal(gameState);
      }
    }
    
    console.log(`🤖 Fase de negociação concluída`);
  }

  // ==================== DISPUTAS ====================
  
  _shouldExecuteDispute(opportunities) {
    if (opportunities.length === 0) return false;
    
    const bestOpportunity = opportunities[0];
    const threshold = this._getDisputeThreshold();
    
    return bestOpportunity.score >= threshold && bestOpportunity.risk < 70;
  }
  
  async _executeDisputeAction(opportunity, gameState) {
    if (!this.actionService) return;
    
    await this.actionService.executeDisputeAction(opportunity, gameState);
  }
  
  _getDisputeThreshold() {
    const thresholds = {
      easy: 50,
      medium: 40,
      hard: 30,
      master: 25
    };
    return thresholds[this.difficulty] || 40;
  }

  // ==================== MÉTODOS DE INTERFACE (Compatibilidade) ====================
  
  async processPendingNegotiations(gameState) {
    if (!this.negotiationService) return { processed: 0, accepted: 0 };
    return await this.negotiationService.processPendingNegotiations(gameState);
  }
  
  async createAndSendProposal(gameState) {
    if (!this.negotiationService) return false;
    return await this.negotiationService.createAndSendProposal(gameState);
  }
  
  evaluateNegotiationProposal(negotiation, gameState) {
    if (!this.negotiationService) return false;
    return this.negotiationService.evaluateProposal(negotiation, gameState);
  }
  
  async executeActionPhase(gameState, uiManager) {
    if (!this.actionService) return false;
    return await this.actionService.executeActionPhase(gameState, uiManager);
  }
  
  findDisputeOpportunities(player, gameState) {
    if (!this.disputeService) return [];
    return this.disputeService.evaluateDisputeOpportunities(player, gameState, this.personality);
  }
  
  sendNegotiationProposal(gameState) {
    return this.createAndSendProposal(gameState);
  }

  // ==================== UTILITÁRIOS ====================
  
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== DEBUG E ESTATÍSTICAS ====================
  
  getDebugInfo() {
    return {
      playerId: this.playerId,
      difficulty: this.difficulty,
      personality: this.personality.type,
      phase: this.phase,
      initialized: this.initialized,
      services: {
        negotiation: !!this.negotiationService,
        action: !!this.actionService,
        strategy: !!this.strategyService,
        dispute: !!this.disputeService
      },
      memory: {
        lastActions: this.memory.lastActions.length,
        negotiationHistory: this.memory.negotiationHistory.length
      },
      currentPlan: this.currentPlan ? {
        primaryGoal: this.currentPlan.primaryGoal,
        riskAssessment: this.currentPlan.riskAssessment
      } : null
    };
  }
  
  getServiceStatistics() {
    return {
      negotiation: this.negotiationService?.getNegotiationStats() || {},
      action: this.actionService?.getActionStatistics() || {},
      strategy: this.strategyService?.getStrategyStatistics() || {}
    };
  }
}

// ==================== FÁBRICA ====================

export class AIFactory {
  static createAI(playerId, difficulty = 'medium', gameLogic = null) {
    return new AIBrain(playerId, difficulty, gameLogic);
  }
  
  static createAIPlayers(count, startIndex = 0, gameLogic = null) {
    const difficulties = ['easy', 'medium', 'hard', 'master'];
    const aiPlayers = [];
    
    for (let i = 0; i < count; i++) {
      const difficulty = difficulties[Math.min(i, difficulties.length - 1)];
      aiPlayers.push(this.createAI(startIndex + i, difficulty, gameLogic));
    }
    
    return aiPlayers;
  }
}

export { AI_DIFFICULTY_SETTINGS, AI_PERSONALITIES };