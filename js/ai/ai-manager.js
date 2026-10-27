// ai-manager.js - Sistema centralizado de gerenciamento de IA

import { 
  gameState,
  getCurrentPlayer,
  getAIPlayer,
  getPendingNegotiationsForPlayer,
  setActiveNegotiation,
  clearActiveNegotiation,
  removePendingNegotiation,
  updateNegotiationStatus,
  resetNegotiationState,
  setNegotiationTarget,
  updateNegotiationResource,
  validateNegotiationState,
  getNegotiationValidationErrors
} from '../state/game-state.js';

import { AIBrain } from './ai-system.js';
import { GAME_CONFIG } from '../state/game-config.js';

class AIManager {
  constructor() {
    this.aiTurnInProgress = false;
    this.aiHealthMonitor = null;
    this.feedbackHistory = [];
    this.lastFeedback = null;
    this.aiInstances = new Map();
  }

  // ==================== INICIALIZAÇÃO ====================

  initialize(players) {
    players.forEach((player, index) => {
      if (player.type === 'ai' || player.isAI) {
        const difficulty = player.aiDifficulty || 'medium';
        const ai = new AIBrain(index, difficulty);
        this.aiInstances.set(index, ai);
        console.log(`🤖 IA inicializada: ${player.name} (${difficulty})`);
      }
    });
  }

  getAI(playerIndex) {
    return this.aiInstances.get(playerIndex);
  }

  // ==================== CONTROLE DE TURNOS ====================

  shouldExecuteAI() {
    if (this.aiTurnInProgress) {
      console.log('⏸️ IA já está executando');
      return false;
    }

    const currentPlayer = getCurrentPlayer();
    const isAI = currentPlayer && (currentPlayer.type === 'ai' || currentPlayer.isAI);
    
    if (!isAI) {
      console.log(`⏸️ Não é turno de IA. Jogador: ${currentPlayer?.name}`);
      return false;
    }

    return true;
  }

  async executeAITurn() {
    if (!this.shouldExecuteAI()) return;

    this.aiTurnInProgress = true;
    const startTime = Date.now();
    const MAX_TURN_TIME = 30000;

    try {
      const currentPlayer = getCurrentPlayer();
      const ai = this.getAI(gameState.currentPlayerIndex);
      
      if (!ai) {
        console.warn(`🤖 Instância de IA não encontrada para ${currentPlayer.name}`);
        this.handleAIError();
        return;
      }

      console.log(`🤖 Executando turno para ${currentPlayer.name} (Fase: ${gameState.currentPhase})`);

      // Executar baseado na fase atual
      switch(gameState.currentPhase) {
        case 'renda':
          await this.handleIncomePhaseAI(currentPlayer);
          break;
        case 'acoes':
          await this.handleActionsPhaseAI(ai);
          break;
        case 'negociacao':
          await this.handleNegotiationPhaseAI(ai);
          break;
      }

      // Verificar se o turno deve terminar
      if (this.shouldEndAITurn()) {
        await this.completeAITurn();
      }

    } catch (error) {
      console.error('🤖 Erro no turno da IA:', error);
      this.handleAIError();
    } finally {
      this.aiTurnInProgress = false;
      
      // Verificar timeout
      const elapsed = Date.now() - startTime;
      if (elapsed > MAX_TURN_TIME) {
        console.warn(`⚠️ Turno de IA demorou muito: ${elapsed}ms`);
      }
    }
  }

  // ==================== FASES DA IA ====================

  async handleIncomePhaseAI(player) {
    console.log(`🤖 ${player.name} na fase de renda - avançando...`);
    
    // Simular espera da renda
    await this.delay(1000);
    
    // Avançar para fase de ações
    gameState.currentPhase = 'acoes';
    gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN; // FIX: era hardcoded 3, deve ser 2
    
    // Atualizar UI
    if (window.uiManager) {
      window.uiManager.updateUI();
      if (window.uiManager.gameManager) {
       window.uiManager.gameManager.updateFooter();
      }
    }
    
    // Executar ações imediatamente
    const ai = this.getAI(gameState.currentPlayerIndex);
    if (ai) {
      await this.handleActionsPhaseAI(ai);
    }
  }

  async handleActionsPhaseAI(ai) {
    const player = getCurrentPlayer();
    console.log(`🤖 ${player.name} executando ações (${gameState.actionsLeft} restantes)`);

    // Executar ações enquanto houver ações disponíveis
    while (gameState.actionsLeft > 0) {
      try {
        // Pequeno delay entre ações
        await this.delay(800);
        
        // Executar uma ação usando o AIBrain (takeTurn é o método correto do AIBrain)
        const actionTaken = await ai.takeTurn(gameState, window.uiManager);
        
        // Se a IA não executou nenhuma ação, decrementar para evitar loop infinito
        if (!actionTaken && gameState.actionsLeft > 0) {
          console.log(`🤖 ${player.name} sem ação disponível, decrementando...`);
          gameState.actionsLeft--;
        }
        
        // Atualizar UI
        if (window.uiManager) {
          window.uiManager.updateUI();
          if (window.uiManager.gameManager) {
            window.uiManager.gameManager.updateFooter();
          }
        }
        
      } catch (error) {
        console.error(`🤖 Erro na ação da IA:`, error);
        if (gameState.actionsLeft > 0) gameState.actionsLeft--;
        break;
      }
    }

    // Quando terminar ações, avançar para negociação
    console.log(`🤖 ${player.name} terminou ações`);
    await this.delay(1000);
    
    // Avançar para fase de negociação
    this.setupNegotiationPhase();
  }

async handleNegotiationPhaseAI(ai) {
    const player = getCurrentPlayer();
    console.log(`🤖 ${player.name} (${ai.personality.type}) na fase de negociação`);
    
    try {
        // 1. PROCESSAR PROPOSTAS PENDENTES usando método direto
        if (ai.processPendingNegotiations) {
            console.log(`🤖 Processando propostas pendentes para ${player.name}...`);
            await ai.processPendingNegotiations(gameState);
            await this.delay(1000);
        } else {
            console.log(`⚠️ IA ${player.name} não tem método processPendingNegotiations`);
        }
        
        // 2. DEPOIS: Enviar proposta se possível
        if (gameState.actionsLeft > 0 && player.resources.ouro >= 1) {
            console.log(`🤖 ${player.name} pode enviar proposta`);
            await this.sendAINegotiationProposal(ai);
        }
        
        // 3. Terminar fase
        console.log(`🤖 ${player.name} terminou negociação`);
        
        // Chamar o término do turno
        if (window.gameLogic?.turnLogic?.handleEndTurn) {
            window.gameLogic.turnLogic.handleEndTurn();
        }
        
    } catch (error) {
        console.error(`🤖 Erro na negociação da IA ${player.name}:`, error);
        
        // Em caso de erro, forçar término do turno
        if (window.gameLogic?.turnLogic?.handleEndTurn) {
            window.gameLogic.turnLogic.handleEndTurn();
        }
    }
}
  
  // ==================== NEGOCIAÇÃO ====================

  async sendAINegotiationProposal(ai) {
    const currentPlayer = getCurrentPlayer();
    
    // Encontrar alvo apropriado
    const target = this.findNegotiationTarget(currentPlayer);
    if (!target) {
      console.log(`🤖 ${currentPlayer.name} não encontrou alvo para negociação`);
      return;
    }

    console.log(`🤖 ${currentPlayer.name} enviando proposta para ${target.name}`);
    
    // Configurar proposta usando o AIBrain
    const proposal = ai.createNegotiationProposal(currentPlayer, target, gameState);
    
    if (!proposal) {
      console.log(`🤖 ${currentPlayer.name} não conseguiu criar proposta`);
      return;
    }

    // Configurar estado da negociação
    resetNegotiationState();
    setNegotiationTarget(target.id);
    
    // Configurar oferta e solicitação
    Object.keys(proposal.offer).forEach(resource => {
      if (proposal.offer[resource] > 0) {
        updateNegotiationResource('offer', resource, proposal.offer[resource]);
      }
    });
    
    Object.keys(proposal.request).forEach(resource => {
      if (proposal.request[resource] > 0) {
        updateNegotiationResource('request', resource, proposal.request[resource]);
      }
    });

    // Validar e enviar
    if (validateNegotiationState()) {
      if (window.gameLogic?.handleSendNegotiation) {
        await window.gameLogic.handleSendNegotiation();
      }
    } else {
      console.log(`🤖 Proposta inválida de ${currentPlayer.name}`);
      const errors = getNegotiationValidationErrors();
      console.log('Erros:', errors);
    }
  }

  findNegotiationTarget(currentPlayer) {
    // Encontrar jogadores com recursos para negociar
    const otherPlayers = gameState.players.filter(p => 
      p.id !== currentPlayer.id && 
      p.resources.ouro >= 1 // Precisa ter ouro para negociar
    );
    
    if (otherPlayers.length === 0) return null;
    
    // Priorizar jogadores com menos PV (mais prováveis de aceitar)
    return otherPlayers.sort((a, b) => a.victoryPoints - b.victoryPoints)[0];
  }

  // Adicionar após o método findNegotiationTarget
  // (Este segundo bloco handleActionsPhaseAI inclui lógica de disputa territorial)

async handleActionsPhaseAIWithDispute(ai) {
  const player = getCurrentPlayer();
  console.log(`🤖 ${player.name} executando ações com suporte a disputa (${gameState.actionsLeft} restantes)`);

  // Executar ações enquanto houver ações disponíveis
  while (gameState.actionsLeft > 0) {
    try {
      // Pequeno delay entre ações
      await this.delay(800);
      
      // Verificar se há disputas antes de executar ação padrão
      const shouldDispute = this.shouldExecuteDispute(ai, gameState);
      
      if (shouldDispute) {
        console.log(`🤖 ${player.name} decidiu disputar território`);
        await this.executeDisputeAI(ai);
      } else {
        // Executar uma ação usando o AIBrain (método correto é takeTurn)
        const actionTaken = await ai.takeTurn(gameState, window.uiManager);
        if (!actionTaken && gameState.actionsLeft > 0) gameState.actionsLeft--;
      }
      
      // Atualizar UI
      if (window.uiManager) {
        window.uiManager.updateUI();
        if (window.uiManager.gameManager) {
          window.uiManager.gameManager.updateFooter();
        }
      }
      
    } catch (error) {
      console.error(`🤖 Erro na ação da IA:`, error);
      if (gameState.actionsLeft > 0) gameState.actionsLeft--;
      break;
    }
  }

  // Quando terminar ações, avançar para negociação
  console.log(`🤖 ${player.name} terminou ações`);
  await this.delay(1000);
  
  // Avançar para fase de negociação
  this.setupNegotiationPhase();
}

// Novo método para avaliar disputa
shouldExecuteDispute(ai, gameState) {
  const player = getCurrentPlayer();
  
  // Verificar se a IA pode disputar
  if (player.victoryPoints < 3 || 
      player.resources.ouro < 2 || 
      gameState.actionsLeft <= 0) {
    return false;
  }
  
  // Usar a lógica do AIBrain para avaliar disputas
  if (ai.findDisputeOpportunities) {
    const opportunities = ai.findDisputeOpportunities(player, gameState);
    if (opportunities.length > 0) {
      const bestOpportunity = opportunities[0];
      
      // Verificar se atende ao threshold baseado na dificuldade
      const threshold = ai.getDisputeThreshold ? ai.getDisputeThreshold() : 40;
      return bestOpportunity.score >= threshold;
    }
  }
  
  return false;
}

// Método para executar disputa
async executeDisputeAI(ai) {
  const player = getCurrentPlayer();
  
  try {
    // Encontrar melhor oportunidade de disputa
    const opportunities = ai.findDisputeOpportunities(player, gameState);
    if (opportunities.length === 0) return;
    
    const bestOpportunity = opportunities[0];
    
    console.log(`🤖 ${player.name} disputando região ${bestOpportunity.regionId} de ${gameState.players[bestOpportunity.defenderId].name}`);
    
    // Configurar região selecionada
    gameState.selectedRegionId = bestOpportunity.regionId;
    await this.delay(500);
    
    // Executar disputa
    if (window.gameLogic?.handleDispute) {
      await window.gameLogic.handleDispute();
    }
    
  } catch (error) {
    console.error(`🤖 Erro ao executar disputa:`, error);
  }
}
  
  // ==================== CONTROLE DE SAÚDE ====================

  startHealthMonitor() {
    if (this.aiHealthMonitor) {
      clearInterval(this.aiHealthMonitor);
    }
    
    this.aiHealthMonitor = setInterval(() => {
      if (!this.aiTurnInProgress) return;
      
      const currentPlayer = getCurrentPlayer();
      if (!currentPlayer || !(currentPlayer.type === 'ai' || currentPlayer.isAI)) {
        return;
      }
      
      // Verificar se a IA está travada
      const recentActions = this.feedbackHistory.filter(f => 
        (Date.now() - f.timestamp) < 10000
      );
      
      const recentErrors = recentActions.filter(f => f.type === 'error');
      
      if (recentErrors.length > 3) {
        console.warn('⚠️ IA com muitos erros recentes - forçando término');
        this.forceEndTurn();
      }
    }, 5000);
  }

  // ==================== UTILITÁRIOS ====================

  setupNegotiationPhase() {
    gameState.currentPhase = 'negociacao';
    gameState.actionsLeft = 1;
    
    const currentPlayer = getCurrentPlayer();
    
    // Verificar propostas pendentes
    setTimeout(() => {
      if (window.uiManager?.negotiation?.checkPendingNegotiationsForCurrentPlayer) {
        window.uiManager.negotiation.checkPendingNegotiationsForCurrentPlayer();
      }
    }, 800);
    
    // Atualizar UI
    if (window.uiManager) {
      window.uiManager.updateUI();
      if (window.uiManager.gameManager) {
        window.uiManager.gameManager.updateFooter();
      }
    }
    
    console.log(`🤖 ${currentPlayer.name} entrou na fase de negociação`);
  }

  shouldEndAITurn() {
    const currentPlayer = getCurrentPlayer();
    
    if (!currentPlayer || !(currentPlayer.type === 'ai' || currentPlayer.isAI)) {
      return false;
    }
    
    // Se não tem ações, terminar
    if (gameState.actionsLeft <= 0) {
      return true;
    }
    
    // Se está na fase de negociação e não tem ouro, terminar
    if (gameState.currentPhase === 'negociacao' && currentPlayer.resources.ouro < 1) {
      return true;
    }
    
    // Se houve muitos erros, terminar
    const recentErrors = this.feedbackHistory.filter(f => 
      f.type === 'error' && (Date.now() - f.timestamp) < 5000
    );
    
    if (recentErrors.length > 3) {
      return true;
    }
    
    return false;
  }

  async completeAITurn() {
    console.log('🤖 Completando turno da IA');
    await this.delay(500);
    
    if (window.gameLogic?.handleEndTurn) {
      await window.gameLogic.handleEndTurn();
    }
  }

  forceEndTurn() {
    console.log('🚨 Forçando término do turno da IA');
    
    const playerCount = gameState.players.length;
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % playerCount;
    
    if (gameState.currentPlayerIndex === 0) {
      gameState.turn += 1;
    }
    
    gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN; // FIX: era hardcoded 3
    gameState.selectedRegionId = null;
    gameState.currentPhase = 'renda';
    
    // Aplicar renda para o novo jogador
    const newPlayer = getCurrentPlayer();
    if (newPlayer && window.gameLogic?.applyIncomeForPlayer) {
      window.gameLogic.applyIncomeForPlayer(newPlayer);
    }
    
    // Atualizar UI
    if (window.uiManager) {
      window.uiManager.updateUI();
    }
    
    this.aiTurnInProgress = false;
  }

  handleAIError() {
    console.log('🤖 Lidando com erro da IA');
    this.forceEndTurn();
  }

  captureFeedback(message, type) {
    this.lastFeedback = { message, type, timestamp: Date.now() };
    this.feedbackHistory.push(this.lastFeedback);
    
    // Manter apenas os últimos 10 feedbacks
    if (this.feedbackHistory.length > 10) {
      this.feedbackHistory.shift();
    }
    
    console.log(`📝 Feedback IA [${type}]: ${message}`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== DEBUG ====================

  getDebugInfo() {
    const currentPlayer = getCurrentPlayer();
    const ai = currentPlayer ? this.getAI(currentPlayer.id) : null;
    
    return {
      aiTurnInProgress: this.aiTurnInProgress,
      currentPlayer: currentPlayer?.name,
      currentPhase: gameState.currentPhase,
      actionsLeft: gameState.actionsLeft,
      aiInstance: ai ? {
        personality: ai.personality?.type,
        difficulty: ai.difficulty,
        phase: ai.phase
      } : null,
      feedbackHistory: this.feedbackHistory.length
    };
  }
}

export { AIManager };
