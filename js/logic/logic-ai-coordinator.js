// logic-ai-coordinator.js - Coordenador de IA

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

export class AICoordinator {
  constructor(gameLogic) {
    this.main = gameLogic;
    this.inProgress = false;
    this.healthMonitor = null;
    this.feedbackHistory = [];
  }

  startHealthMonitor() {
    if (this.healthMonitor) clearInterval(this.healthMonitor);
    this.healthMonitor = setInterval(() => this._checkHealth(), 5000);
  }

  _checkHealth() {
    if (!this.inProgress) return;
    const player = getCurrentPlayer();
    if (!player || (!player.type === 'ai' && !player.isAI)) return;

    // Se tiver erros recentes demais
    const errors = this.feedbackHistory.filter(f => f.type === 'error' && (Date.now() - f.timestamp) < 5000);
    if (errors.length > 3) {
        console.warn('⚠️ IA travada com erros. Forçando fim de turno.');
        this.forceAIEndTurn();
    }
  }

  // FUNÇÃO helper para obter IA correta
_getAIPlayerForCurrentPlayer() {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return null;
    
    console.log(`🔍 Buscando IA para jogador ${currentPlayer.id} (${currentPlayer.name})`);
    
    // Usar a função importada
    let allAIs = [];
    if (typeof getAllAIPlayers === 'function') {
        allAIs = getAllAIPlayers();
        console.log(`🤖 ${allAIs.length} IA(s) disponíveis via função`);
    } else if (window.aiInstances) {
        allAIs = window.aiInstances;
        console.log(`🤖 ${allAIs.length} IA(s) disponíveis via window`);
    }
    
    // Log detalhado das IAs disponíveis
    console.log('📋 Lista de IAs disponíveis:', allAIs.map(ai => ({
        id: ai.playerId,
        name: ai.personality?.name || 'Sem nome',
        difficulty: ai.difficulty
    })));
    
    // Buscar IA correspondente
    const ai = allAIs.find(aiInstance => {
        const aiId = Number(aiInstance.playerId);
        const playerId = Number(currentPlayer.id);
        console.log(`🔍 Comparando: IA ${aiId} vs Jogador ${playerId}`);
        return aiId === playerId;
    });
    
    if (!ai) {
        console.warn(`🤖 IA não encontrada para jogador ${currentPlayer.id} (${currentPlayer.name})`);
        console.log('Tipo do jogador:', currentPlayer.type, 'isAI:', currentPlayer.isAI);
    } else {
        console.log(`✅ IA encontrada: ${ai.personality?.name || 'Sem nome'}`);
    }
    
    return ai;
}
  
async checkAndExecuteAITurn() {
    if (this.inProgress) return;
    const player = getCurrentPlayer();
    if (!player || (!player.type === 'ai' && !player.isAI)) return;

    this.inProgress = true;
    console.log(`🤖 Iniciando loop IA para ${player.name} (ID: ${player.id})`);

    try {
        // USAR a nova função helper
        const ai = this._getAIPlayerForCurrentPlayer();
        if (!ai) { 
            console.error(`🤖 IA não encontrada para ${player.name}`);
            this.forceAIEndTurn(); 
            return; 
        }

        await this._runAILoop(ai); // Passar a instância da IA
    } catch (e) {
        console.error('Erro crítico IA:', e);
        this.forceAIEndTurn();
    } finally {
        this.inProgress = false;
    }
}

  async _runAILoop() {
    const currentPlayer = getCurrentPlayer();
    const ai = this._getAIPlayerForCurrentPlayer();
    
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
                await this.handleIncomePhaseAI(currentPlayer);
                break;
            case 'acoes':
                await this._executeActions(ai);
                // Avançar para negociação
                this.main.negotiationLogic.setupPhase();
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

async _executeActions(ai) {
  while (gameState.actionsLeft > 0) {
    await this._delay(1000);
    try {
      // Verificar disputas antes de ação normal
      const shouldDispute = this._shouldAIDispute(ai);
      
      if (shouldDispute) {
        await this._executeAIDispute(ai);
      } else {
        await ai.takeTurn(gameState, window.uiManager);
      }
      
      if(window.uiManager) window.uiManager.updateUI();
    } catch (e) {
      console.error('Erro ação IA:', e);
      break;
    }
  }
}

// Método para avaliar disputa
_shouldAIDispute(ai) {
  const currentPlayer = getCurrentPlayer();
  
  // Verificar condições básicas
  if (!currentPlayer || gameState.actionsLeft <= 0) return false;
  
  // Verificar recursos
  if (currentPlayer.victoryPoints < 3 || 
      currentPlayer.resources.ouro < 2) {
    return false;
  }
  
  // Usar método do AIBrain se disponível
  if (ai.findDisputeOpportunities) {
    const opportunities = ai.findDisputeOpportunities(currentPlayer, gameState);
    if (opportunities.length > 0) {
      const threshold = ai.getDisputeThreshold ? ai.getDisputeThreshold() : 40;
      return opportunities[0].score >= threshold;
    }
  }
  
  return false;
}

// Método para executar disputa da IA
async _executeAIDispute(ai) {
  const currentPlayer = getCurrentPlayer();
  
  try {
    // Encontrar melhor disputa
    const opportunities = ai.findDisputeOpportunities(currentPlayer, gameState);
    if (opportunities.length === 0) return;
    
    const bestDispute = opportunities[0];
    
    console.log(`🤖 ${currentPlayer.name} iniciando disputa contra região ${bestDispute.regionId}`);
    
    // Configurar região
    gameState.selectedRegionId = bestDispute.regionId;
    await this._delay(800);
    
    // Executar disputa
    if (window.gameLogic?.handleDispute) {
      await window.gameLogic.handleDispute();
    }
    
  } catch (error) {
    console.error(`🤖 Erro na disputa:`, error);
  }
}

async _executeNegotiations(ai) {
    console.log(`🤖 ${ai.personality?.name || 'IA'} processando negociações`);
    
    const currentPlayer = getCurrentPlayer();
    
    // 1. PRIMEIRO: Processar propostas recebidas (se houver)
    const pending = getPendingNegotiationsForPlayer(currentPlayer.id);
    console.log(`📨 ${currentPlayer.name} tem ${pending.length} proposta(s) pendente(s)`);
    
    if (pending.length > 0) {
        console.log(`🤖 Processando ${pending.length} proposta(s) pendente(s)`);
        
        // Usar o método CORRETO do AIBrain (se disponível)
        if (ai.processPendingNegotiations) {
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
            
            if (ai.sendNegotiationProposal) {
                success = await ai.sendNegotiationProposal(gameState);
            } else if (ai.createAndSendProposal) {
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

// ADICIONAR função auxiliar para processar negociação individual
async _processSingleNegotiation(ai, negotiation) {
    try {
        const initiator = gameState.players[negotiation.initiatorId];
        const initiatorName = initiator ? initiator.name : 'Desconhecido';
        console.log(`🤖 Avaliando proposta ${negotiation.id} de ${initiatorName}`);
        
        // Avaliar proposta
        let shouldAccept = false;
        if (ai.evaluateNegotiationProposal) {
            shouldAccept = ai.evaluateNegotiationProposal(negotiation, gameState);
        }
        
        console.log(`🤖 Decisão: ${shouldAccept ? '✅ ACEITAR' : '❌ RECUSAR'}`);
        
        // Configurar como negociação ativa
        setActiveNegotiation(negotiation);
        await this._delay(500);
        
        // Responder via gameLogic
        if (window.gameLogic && window.gameLogic.handleNegResponse) {
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
  
// ADICIONAR função auxiliar para envio simples
async _sendSimpleProposal(ai, player, gameState) {
    try {
        // Encontrar alvo
        const otherPlayers = gameState.players.filter(p => 
            p.id !== player.id && 
            p.resources.ouro >= 1
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
        if (window.gameLogic && window.gameLogic.handleSendNegotiation) {
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
        
        console.log(`🤖 ${currentPlayer.name} (${ai.personality?.type || 'IA'}) iniciando fase de negociação`);
        console.log(`📊 Status: Ações: ${gameState.actionsLeft}, Ouro: ${currentPlayer.resources.ouro}`);
        
        // 1. Processar propostas pendentes
        const pending = getPendingNegotiationsForPlayer(currentPlayer.id);
        console.log(`📨 ${pending.length} proposta(s) pendente(s) para ${currentPlayer.name}`);
        
        if (pending.length > 0) {
            console.log(`🤖 Processando ${pending.length} proposta(s) pendente(s)`);
            
            // Pequeno delay para simulação
            await this._delay(2000);
            
            if (ai.processPendingNegotiations) {
                const result = await ai.processPendingNegotiations(gameState);
                console.log(`🤖 Resultado do processamento: ${result}`);
            } else {
                // Fallback: Processar manualmente
                for (const negotiation of pending) {
                    console.log(`🤖 Avaliando proposta ${negotiation.id}...`);
                    
                    // Pequeno delay entre avaliações
                    await this._delay(1500);
                    
                    const shouldAccept = ai.evaluateNegotiationProposal ? 
                        ai.evaluateNegotiationProposal(negotiation, gameState) : 
                        Math.random() > 0.5;
                    
                    setActiveNegotiation(negotiation);
                    
                    if (shouldAccept) {
                        console.log(`🤖 Aceitando proposta`);
                        if (window.gameLogic?.handleNegResponse) {
                            window.gameLogic.handleNegResponse(true);
                            await this._delay(1000);
                        }
                    } else {
                        console.log(`🤖 Recusando proposta`);
                        if (window.gameLogic?.handleNegResponse) {
                            window.gameLogic.handleNegResponse(false);
                            await this._delay(1000);
                        }
                    }
                    
                    // Pequena pausa entre negociações
                    await this._delay(1000);
                }
            }
        } else {
            console.log(`🤖 Nenhuma proposta pendente para ${currentPlayer.name}`);
        }
        
        // 2. Verificar se ainda pode enviar proposta
        if (gameState.actionsLeft > 0 && currentPlayer.resources.ouro >= 1) {
            console.log(`🤖 ${currentPlayer.name} pode enviar proposta, verificando alvos...`);
            
            // Verificar se há alvos válidos
            const validTargets = gameState.players.filter(p => 
                p.id !== currentPlayer.id && 
                p.resources.ouro >= 1
            );
            
            if (validTargets.length > 0) {
                console.log(`🤖 ${validTargets.length} alvo(s) válido(s) encontrado(s)`);
                
                // Pequeno delay para decisão
                await this._delay(2000);
                
                if (ai.createAndSendProposal) {
                    const success = await ai.createAndSendProposal(gameState);
                    console.log(`🤖 Proposta enviada: ${success ? '✅' : '❌'}`);
                } else if (ai.sendNegotiationProposal) {
                    const success = await ai.sendNegotiationProposal(gameState);
                    console.log(`🤖 Proposta enviada: ${success ? '✅' : '❌'}`);
                } else {
                    console.log(`🤖 ${currentPlayer.name} não tem método de envio de proposta`);
                    // Se não tem método, decrementa ação e termina
                    if (gameState.actionsLeft > 0) {
                        gameState.actionsLeft--;
                    }
                }
            } else {
                console.log(`🤖 Nenhum alvo válido para ${currentPlayer.name} (todos sem ouro?)`);
                // Se não há alvos, decrementa ação
                if (gameState.actionsLeft > 0) {
                    gameState.actionsLeft--;
                }
            }
        } else {
            console.log(`🤖 ${currentPlayer.name} não pode enviar proposta (ações: ${gameState.actionsLeft}, ouro: ${currentPlayer.resources.ouro})`);
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
    this.main.turnLogic.handleEndTurn();
  }

  _delay(ms) { return new Promise(r => setTimeout(r, ms)); }
}
