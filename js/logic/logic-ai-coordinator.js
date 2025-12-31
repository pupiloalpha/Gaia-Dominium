// logic-ai-coordinator.js - Coordenador de IA (Versão Corrigida e Integrada)

import { 
  gameState, getCurrentPlayer, getAIPlayer, 
  getPendingNegotiationsForPlayer, setActiveNegotiation,
  clearActiveNegotiation, removePendingNegotiation,
  updateNegotiationStatus, resetNegotiationState,
  setNegotiationTarget, updateNegotiationResource,
  validateNegotiationState, getNegotiationValidationErrors,
  getAllAIPlayers
} from '../state/game-state.js';
import { GAME_CONFIG } from '../state/game-config.js';
import { AIBrain } from './ai-system.js';
import { AIManager } from './ai-manager.js';
import { AIActionService } from './ai-action-service.js';
import { AINegotiationService } from './ai-negotiation-service.js';

export class AICoordinator {
  constructor(gameLogic) {
    this.main = gameLogic;
    this.inProgress = false;
    this.healthMonitor = null;
    this.feedbackHistory = [];
    this.aiManagerInitialized = false;
  }

  // ==================== INICIALIZAÇÃO ====================

  startHealthMonitor() {
    if (this.healthMonitor) clearInterval(this.healthMonitor);
    this.healthMonitor = setInterval(() => this._checkHealth(), 5000);
  }

  initializeAIServices() {
    if (this.aiManagerInitialized) return;
    
    console.log("🤖 Inicializando serviços de IA...");
    
    // Inicializar AIManager global
    if (!window.aiManager) {
      window.aiManager = new AIManager();
      window.aiManager.initialize(gameState.players);
      window.aiManager.startHealthMonitor();
    }
    
    // Inicializar instâncias de IA
    const aiPlayers = gameState.players.filter(p => p.type === 'ai' || p.isAI);
    
    aiPlayers.forEach(player => {
      const ai = this._getAIPlayerForCurrentPlayer();
      if (ai && typeof ai.initializeServices === 'function') {
        ai.initializeServices(this.main);
      }
    });
    
    this.aiManagerInitialized = true;
    console.log(`✅ Serviços de IA inicializados para ${aiPlayers.length} jogador(es)`);
  }

  // ==================== MONITORAMENTO DE SAÚDE ====================

  _checkHealth() {
    if (!this.inProgress) return;
    
    const player = getCurrentPlayer();
    if (!player || (!player.type === 'ai' && !player.isAI)) return;

    // Verificar se há erros recentes demais
    const errors = this.feedbackHistory.filter(f => 
      f.type === 'error' && (Date.now() - f.timestamp) < 5000
    );
    
    if (errors.length > 3) {
      console.warn('⚠️ IA travada com muitos erros. Forçando fim de turno.');
      this.forceAIEndTurn();
    }
  }

  // ==================== OBTENÇÃO DA INSTÂNCIA DA IA ====================

  _getAIPlayerForCurrentPlayer() {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return null;
    
    console.log(`🔍 Buscando IA para jogador ${currentPlayer.id} (${currentPlayer.name})`);
    
    // Priorizar o AIManager global se disponível
    if (window.aiManager && typeof window.aiManager.getAI === 'function') {
      const ai = window.aiManager.getAI(currentPlayer.id);
      if (ai) {
        console.log(`✅ IA encontrada via AIManager: ${ai.personality?.name || 'Sem nome'}`);
        return ai;
      }
    }
    
    // Fallback para window.aiInstances
    if (window.aiInstances && Array.isArray(window.aiInstances)) {
      const ai = window.aiInstances.find(aiInstance => 
        Number(aiInstance.playerId) === Number(currentPlayer.id)
      );
      if (ai) {
        console.log(`✅ IA encontrada via window.aiInstances: ${ai.personality?.name || 'Sem nome'}`);
        return ai;
      }
    }
    
    // Fallback para getAllAIPlayers
    if (typeof getAllAIPlayers === 'function') {
      const allAIs = getAllAIPlayers();
      const ai = allAIs.find(aiInstance => 
        Number(aiInstance.playerId) === Number(currentPlayer.id)
      );
      if (ai) {
        console.log(`✅ IA encontrada via getAllAIPlayers: ${ai.personality?.name || 'Sem nome'}`);
        return ai;
      }
    }
    
    console.warn(`🤖 IA não encontrada para jogador ${currentPlayer.id} (${currentPlayer.name})`);
    return null;
  }

  // ==================== CONTROLE DE TURNO DA IA ====================

  async checkAndExecuteAITurn() {
    if (this.inProgress) {
      console.log('⏸️ IA já está executando');
      return;
    }
    
    const player = getCurrentPlayer();
    
    // Verificar se jogador está eliminado
    if (!player || player.eliminated) {
      console.log(`🤖 Jogador ${player?.name || 'desconhecido'} está eliminado, pulando turno.`);
      
      // Pular turno automaticamente
      setTimeout(() => {
        if (this.main?.turnLogic?.handleEndTurn) {
          this.main.turnLogic.handleEndTurn();
        }
      }, 1000);
      return;
    }
    
    if (!(player.type === 'ai' || player.isAI)) return;

    // Inicializar serviços se necessário
    this.initializeAIServices();
    
    this.inProgress = true;
    console.log(`🤖 Iniciando loop IA para ${player.name} (ID: ${player.id})`);

    try {
      // Usar o AIManager para executar turno (se disponível)
      if (window.aiManager && typeof window.aiManager.executeAITurn === 'function') {
        console.log('🤖 Executando turno via AIManager');
        await window.aiManager.executeAITurn();
      } else {
        // Fallback para o método antigo
        const ai = this._getAIPlayerForCurrentPlayer();
        if (!ai) { 
          console.error(`🤖 IA não encontrada para ${player.name}`);
          this.forceAIEndTurn(); 
          return; 
        }
        await this._runAILoop(ai);
      }
    } catch (error) {
      console.error('🤖 Erro crítico na IA:', error);
      this.forceAIEndTurn();
    } finally {
      this.inProgress = false;
    }
  }

  // ==================== LOOP PRINCIPAL DA IA ====================

  async _runAILoop(ai) {
    const currentPlayer = getCurrentPlayer();
    
    if (!ai) {
      console.error(`🤖 IA não encontrada para ${currentPlayer?.name || 'desconhecido'}`);
      this.forceAIEndTurn();
      return;
    }

    console.log(`🤖 Executando turno para ${currentPlayer.name} (Fase: ${gameState.currentPhase})`);

    try {
      // Executar baseado na fase atual
      switch(gameState.currentPhase) {
        case 'renda':
          // A renda já foi aplicada, avançar para ações
          gameState.currentPhase = 'acoes';
          gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
          await this._delay(1000);
          // Continuar para ações
          await this._executeActions(ai);
          break;
        case 'acoes':
          await this._executeActions(ai);
          // Avançar para negociação
          if (this.main.negotiationLogic) {
            this.main.negotiationLogic.setupPhase();
          }
          await this._delay(1000);
          // Chamar negociação imediatamente
          await this._executeNegotiationPhaseForAI();
          break;
        case 'negociacao':
          await this._executeNegotiationPhaseForAI();
          break;
      }
      
      // Garantir que o turno foi finalizado
      await this._ensureAICompletion();
      
    } catch (error) {
      console.error(`🤖 Erro no loop da IA ${currentPlayer.name}:`, error);
      this.forceAIEndTurn();
    }
  }

  // ==================== EXECUÇÃO DE AÇÕES ====================

  async _executeActions(ai) {
    const maxIterations = 20; // Limite máximo para evitar loop infinito
    let iterations = 0;
    
    while (gameState.actionsLeft > 0 && iterations < maxIterations && !this.main.turnLogic.gameEnded) {
      iterations++;
      await this._delay(800);
      
      try {
        // 1. Verificar se ainda é turno da IA
        const currentPlayer = getCurrentPlayer();
        if (!currentPlayer || currentPlayer.type !== 'ai' || currentPlayer.eliminated) {
          console.log(`🤖 Turno não é mais da IA ${currentPlayer?.name}, parando execução`);
          break;
        }
        
        // 2. Verificar disputas primeiro
        const shouldDispute = this._shouldAIDispute(ai);
        
        if (shouldDispute) {
          await this._executeAIDispute(ai);
        } else {
          // 3. Executar ação normal da IA
          // Verificar se a IA pode realizar alguma ação
          const canTakeAnyAction = this._canAITakeAnyAction(ai);
          
          if (canTakeAnyAction) {
            // Usar AIActionService se disponível
            if (ai.actionService && typeof ai.actionService.executeActionPhase === 'function') {
              await ai.actionService.executeActionPhase(gameState, window.uiManager);
            } else if (typeof ai.takeTurn === 'function') {
              await ai.takeTurn(gameState, window.uiManager);
            } else {
              console.warn(`🤖 ${currentPlayer.name} não tem método de ação disponível`);
              if (gameState.actionsLeft > 0) {
                gameState.actionsLeft--;
              }
            }
          } else {
            // Se não pode fazer nada, decrementar ação e continuar
            console.log(`🤖 ${currentPlayer.name} não pode realizar nenhuma ação, passando...`);
            if (gameState.actionsLeft > 0) {
              gameState.actionsLeft--;
            }
          }
        }
        
        // 4. Atualizar UI
        if (window.uiManager) {
          window.uiManager.updateUI();
          if (window.uiManager.gameManager) {
            window.uiManager.gameManager.updateFooter();
          }
        }
        
      } catch (error) {
        console.error('🤖 Erro na ação da IA:', error);
        // Em caso de erro, decrementar ação para evitar loop
        if (gameState.actionsLeft > 0) {
          gameState.actionsLeft--;
        }
        break;
      }
    }
    
    // Se excedeu o limite de iterações, forçar término
    if (iterations >= maxIterations) {
      console.warn(`⚠️ IA ${getCurrentPlayer()?.name} excedeu limite de iterações, forçando término`);
      this.forceAIEndTurn();
    }
  }

  // ==================== VERIFICAÇÃO DE DISPUTA ====================

  _shouldAIDispute(ai) {
    const currentPlayer = getCurrentPlayer();
    
    // Verificar condições básicas
    if (!currentPlayer || gameState.actionsLeft <= 0) return false;
    
    // Verificar recursos
    if (currentPlayer.victoryPoints < 3 || currentPlayer.resources.ouro < 2) {
      return false;
    }
    
    // Usar método do AIBrain se disponível
    if (typeof ai.findDisputeOpportunities === 'function') {
      const opportunities = ai.findDisputeOpportunities(currentPlayer, gameState);
      if (opportunities.length > 0) {
        const threshold = ai.getDisputeThreshold ? ai.getDisputeThreshold() : 40;
        return opportunities[0].score >= threshold;
      }
    }
    
    return false;
  }

  async _executeAIDispute(ai) {
    const currentPlayer = getCurrentPlayer();
    
    try {
      // Encontrar melhor disputa
      const opportunities = typeof ai.findDisputeOpportunities === 'function' ? 
        ai.findDisputeOpportunities(currentPlayer, gameState) : [];
      
      if (opportunities.length === 0) {
        console.log(`🤖 ${currentPlayer.name} não encontrou oportunidades de disputa`);
        return;
      }
      
      const bestDispute = opportunities[0];
      const region = gameState.regions[bestDispute.regionId];
      
      // VALIDAÇÃO RIGOROSA: Verificar se pode pagar a disputa
      if (window.gameLogic?.disputeLogic) {
        const disputeData = window.gameLogic.disputeLogic.calculateDisputeCosts(currentPlayer, region);
        const finalCost = disputeData.finalCost;
        
        // Verificar PV
        if (currentPlayer.victoryPoints < finalCost.pv) {
          console.log(`🤖 ${currentPlayer.name} não tem PV suficientes para disputa`);
          return;
        }
        
        // Verificar recursos
        const canPay = Object.entries(finalCost).every(([resource, amount]) => {
          if (resource === 'pv') return true; // Já verificado
          return (currentPlayer.resources[resource] || 0) >= amount;
        });
        
        if (!canPay) {
          console.log(`🤖 ${currentPlayer.name} não tem recursos para disputa`);
          return;
        }
      }
      
      console.log(`🤖 ${currentPlayer.name} iniciando disputa contra região ${bestDispute.regionId}`);
      
      // Configurar região
      gameState.selectedRegionId = bestDispute.regionId;
      await this._delay(800);
      
      // Executar disputa
      if (window.gameLogic?.handleDispute) {
        await window.gameLogic.handleDispute();
      } else if (window.gameLogic?.disputeLogic?.handleDispute) {
        await window.gameLogic.disputeLogic.handleDispute(region, currentPlayer);
      }
      
    } catch (error) {
      console.error(`🤖 Erro na disputa da IA ${currentPlayer.name}:`, error);
      // Não consumir ação se houve erro
      return;
    }
  }

  // ==================== NEGOCIAÇÃO ====================

  async _executeNegotiations(ai) {
    console.log(`🤖 ${ai.personality?.name || 'IA'} processando negociações`);
    
    const currentPlayer = getCurrentPlayer();
    
    // 1. PRIMEIRO: Processar propostas recebidas (se houver)
    const pending = getPendingNegotiationsForPlayer(currentPlayer.id);
    console.log(`📨 ${currentPlayer.name} tem ${pending.length} proposta(s) pendente(s)`);
    
    if (pending.length > 0) {
      console.log(`🤖 Processando ${pending.length} proposta(s) pendente(s)`);
      
      // Usar o método CORRETO do AIBrain (se disponível)
      if (typeof ai.processPendingNegotiations === 'function') {
        await ai.processPendingNegotiations(gameState);
      } else {
        // Fallback: processar manualmente
        for (const negotiation of pending) {
          await this._processSingleNegotiation(ai, negotiation);
          await this._delay(800);
        }
      }
      
      // Atualizar UI após processar propostas
      if (window.uiManager) {
        window.uiManager.updateUI();
        if (window.uiManager.gameManager) {
          window.uiManager.gameManager.updateFooter();
        }
      }
      
      await this._delay(1000);
    }
    
    // 2. DEPOIS: Enviar proposta (se possível)
    if (gameState.actionsLeft > 0 && currentPlayer.resources.ouro >= 1) {
      console.log(`🤖 ${currentPlayer.name} pode enviar proposta`);
      
      await this._delay(1200);
      
      try {
        // Chamar método CORRETO de envio
        let success = false;
        
        if (typeof ai.sendNegotiationProposal === 'function') {
          success = await ai.sendNegotiationProposal(gameState);
        } else if (typeof ai.createAndSendProposal === 'function') {
          success = await ai.createAndSendProposal(gameState);
        } else {
          console.warn(`🤖 IA ${currentPlayer.name} não tem método de envio de proposta`);
          success = await this._sendSimpleProposal(ai, currentPlayer, gameState);
        }
        
        console.log(`🤖 Proposta enviada: ${success ? '✅ SUCESSO' : '❌ FALHA'}`);
        
        if (success && gameState.actionsLeft > 0) {
          gameState.actionsLeft--;
        }
        
      } catch (error) {
        console.error(`🤖 Erro ao enviar proposta:`, error);
      }
    } else {
      console.log(`🤖 ${currentPlayer.name} não pode enviar proposta (ações: ${gameState.actionsLeft}, ouro: ${currentPlayer.resources.ouro})`);
    }
    
    // 3. Sinalizar término da fase
    console.log(`🤖 ${currentPlayer.name} terminou fase de negociação`);
    return 'end_turn';
  }

  async _processSingleNegotiation(ai, negotiation) {
    try {
      const initiator = gameState.players[negotiation.initiatorId];
      const initiatorName = initiator ? initiator.name : 'Desconhecido';
      console.log(`🤖 Avaliando proposta ${negotiation.id} de ${initiatorName}`);
      
      // Avaliar proposta
      let shouldAccept = false;
      if (typeof ai.evaluateNegotiationProposal === 'function') {
        shouldAccept = ai.evaluateNegotiationProposal(negotiation, gameState);
      } else {
        // Fallback: aceitar aleatoriamente
        shouldAccept = Math.random() > 0.5;
      }
      
      console.log(`🤖 Decisão: ${shouldAccept ? '✅ ACEITAR' : '❌ RECUSAR'}`);
      
      // Configurar como negociação ativa
      setActiveNegotiation(negotiation);
      await this._delay(500);
      
      // Responder via gameLogic
      if (window.gameLogic && typeof window.gameLogic.handleNegResponse === 'function') {
        window.gameLogic.handleNegResponse(shouldAccept);
      }
      
      // Registrar no histórico
      if (ai.memory && ai.memory.negotiationHistory) {
        ai.memory.negotiationHistory.push({
          turn: gameState.turn,
          partner: negotiation.initiatorId,
          accepted: shouldAccept,
          timestamp: Date.now()
        });
      }
      
      await this._delay(500);
      
    } catch (error) {
      console.error(`🤖 Erro ao processar proposta ${negotiation.id}:`, error);
    }
  }

  async _sendSimpleProposal(ai, player, gameState) {
    try {
      // Encontrar alvo
      const otherPlayers = gameState.players.filter(p => 
        p.id !== player.id && p.resources.ouro >= 1
      );
      
      if (otherPlayers.length === 0) return false;
      
      const target = otherPlayers[0]; // Primeiro alvo disponível
      
      // Criar proposta simples
      const proposal = {
        offer: { madeira: 1, pedra: 0, ouro: 0, agua: 1 },
        request: { madeira: 0, pedra: 1, ouro: 0, agua: 0 }
      };
      
      // Configurar estado
      resetNegotiationState();
      setNegotiationTarget(target.id);
      
      // Configurar recursos
      updateNegotiationResource('offer', 'madeira', 1);
      updateNegotiationResource('offer', 'agua', 1);
      updateNegotiationResource('request', 'pedra', 1);
      
      // Enviar
      if (window.gameLogic && typeof window.gameLogic.handleSendNegotiation === 'function') {
        return await window.gameLogic.handleSendNegotiation();
      }
      
      return false;
    } catch (error) {
      console.error('Erro em proposta simples:', error);
      return false;
    }
  }

  async _executeNegotiationPhaseForAI() {
    try {
      const currentPlayer = getCurrentPlayer();
      const ai = this._getAIPlayerForCurrentPlayer();
      
      if (!ai) {
        console.error(`🤖 IA não encontrada para ${currentPlayer.name}, forçando término`);
        this.forceAIEndTurn();
        return;
      }
      
      // VERIFICAÇÃO DE SEGURANÇA: Se jogador está eliminado, pular
      if (currentPlayer.eliminated) {
        console.log(`🤖 ${currentPlayer.name} está eliminado, pulando negociação`);
        this.forceAIEndTurn();
        return;
      }
      
      console.log(`🤖 ${currentPlayer.name} (${ai.personality?.type || 'IA'}) iniciando fase de negociação`);
      console.log(`📊 Status: Ações: ${gameState.actionsLeft}, Ouro: ${currentPlayer.resources.ouro}`);
      
      // Usar AINegotiationService se disponível
      if (ai.negotiationService && typeof ai.negotiationService.processPendingNegotiations === 'function') {
        console.log('🤖 Usando AINegotiationService para processar negociações');
        
        // 1. Processar propostas pendentes
        await ai.negotiationService.processPendingNegotiations(gameState);
        
        // 2. Enviar proposta se possível
        if (gameState.actionsLeft > 0 && currentPlayer.resources.ouro >= 1) {
          await ai.negotiationService.createAndSendProposal(gameState);
        }
      } else {
        // Fallback para método antigo
        await this._executeNegotiations(ai);
      }
      
      // 3. Finalizar fase de negociação
      console.log(`🤖 ${currentPlayer.name} finalizando fase de negociação...`);
      
      // Atualizar UI
      if (window.uiManager) {
        window.uiManager.updateUI();
      }
      
      // Pequeno delay antes de finalizar
      await this._delay(2000);
      
      // Finalizar turno
      if (this.main?.turnLogic?.handleEndTurn) {
        await this.main.turnLogic.handleEndTurn();
      } else if (window.gameLogic?.handleEndTurn) {
        await window.gameLogic.handleEndTurn();
      }
      
    } catch (error) {
      console.error(`🤖 Erro na negociação da IA:`, error);
      this.forceAIEndTurn();
    }
  }

  // ==================== VERIFICAÇÃO DE CONCLUSÃO ====================

  async _ensureAICompletion() {
    console.log(`🤖 Garantindo conclusão do turno da IA...`);
    
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer || !(currentPlayer.type === 'ai' || currentPlayer.isAI)) {
      console.log(`🤖 Não é turno de IA, ignorando...`);
      return;
    }
    
    // Se ainda estiver na fase de negociação e sem ações, finalizar
    if (gameState.currentPhase === 'negociacao' && gameState.actionsLeft <= 0) {
      console.log(`🤖 ${currentPlayer.name} sem ações na negociação, finalizando...`);
      this.forceAIEndTurn();
      return;
    }
    
    // Se a IA não tem ouro para negociar, finalizar
    if (gameState.currentPhase === 'negociacao' && currentPlayer.resources.ouro < 1) {
      console.log(`🤖 ${currentPlayer.name} sem ouro para negociar, finalizando...`);
      this.forceAIEndTurn();
      return;
    }
    
    // Timeout de segurança
    setTimeout(() => {
      if (this.inProgress) {
        console.warn(`⚠️ Timeout de segurança para IA ${currentPlayer.name}, forçando término`);
        this.forceAIEndTurn();
      }
    }, 15000);
  }

  // ==================== MÉTODOS AUXILIARES ====================

  _canAITakeAnyAction(ai) {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return false;
    
    // Verificar se tem ações restantes
    if (gameState.actionsLeft <= 0) return false;
    
    // Verificar se tem recursos para alguma ação básica
    const hasResourcesForAnyAction = 
      currentPlayer.resources.ouro >= 1 || 
      currentPlayer.resources.madeira >= 1 ||
      currentPlayer.resources.pedra >= 1 ||
      currentPlayer.victoryPoints >= 2;
    
    return hasResourcesForAnyAction;
  }

  captureFeedback(message, type) {
    this.feedbackHistory.push({ message, type, timestamp: Date.now() });
    if (this.feedbackHistory.length > 10) this.feedbackHistory.shift();
    
    // IA reage a erros
    if (type === 'error' && this.inProgress) {
      console.log('🤖 IA percebeu erro:', message);
      // Lógica simples de recuperação: Se erro for de seleção, tenta limpar
      if (message.includes('Selecione')) gameState.selectedRegionId = null;
    }
  }

  forceAIEndTurn() {
    this.inProgress = false;
    
    // Usar o TurnLogic do main se disponível
    if (this.main?.turnLogic?.handleEndTurn) {
      this.main.turnLogic.handleEndTurn();
    } 
    // Fallback para AIManager
    else if (window.aiManager && typeof window.aiManager.forceEndTurn === 'function') {
      window.aiManager.forceEndTurn();
    }
    // Fallback para gameLogic global
    else if (window.gameLogic && typeof window.gameLogic.handleEndTurn === 'function') {
      window.gameLogic.handleEndTurn();
    }
    // Último fallback
    else {
      console.warn('⚠️ Método forceAIEndTurn: Nenhum handler de término encontrado');
      // Forçar avanço manual do turno
      const playerCount = gameState.players.length;
      gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % playerCount;
      
      if (gameState.currentPlayerIndex === 0) {
        gameState.turn += 1;
      }
      
      gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
      gameState.currentPhase = 'renda';
      
      // Atualizar UI
      if (window.uiManager) {
        window.uiManager.updateUI();
      }
    }
  }

  _delay(ms) { 
    return new Promise(resolve => setTimeout(resolve, ms)); 
  }

  // ==================== LIMPEZA ====================

  cleanup() {
    if (this.healthMonitor) {
      clearInterval(this.healthMonitor);
      this.healthMonitor = null;
    }
    
    if (window.aiManager && window.aiManager.aiHealthMonitor) {
      clearInterval(window.aiManager.aiHealthMonitor);
    }
    
    this.inProgress = false;
    this.feedbackHistory = [];
    this.aiManagerInitialized = false;
    
    console.log('🧹 AICoordinator limpo');
  }

  // ==================== DEBUG ====================

  getDebugInfo() {
    const currentPlayer = getCurrentPlayer();
    const ai = this._getAIPlayerForCurrentPlayer();
    
    return {
      inProgress: this.inProgress,
      currentPlayer: currentPlayer?.name,
      aiFound: !!ai,
      aiPersonality: ai?.personality?.type,
      feedbackHistory: this.feedbackHistory.length,
      aiManagerInitialized: this.aiManagerInitialized,
      gamePhase: gameState.currentPhase,
      actionsLeft: gameState.actionsLeft
    };
  }
}