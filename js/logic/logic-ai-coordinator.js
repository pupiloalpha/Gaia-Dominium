// logic-ai-coordinator.js - Coordenador de IA
import { gameState, getCurrentPlayer, getAIPlayer, getPendingNegotiationsForPlayer, setActiveNegotiation } from '../state/game-state.js';
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
    
    // Buscar por ID direto no gameState
    let allAIs = [];
    if (typeof getAllAIPlayers === 'function') {
        allAIs = getAllAIPlayers();
    } else if (window.aiInstances) {
        allAIs = window.aiInstances;
    }
    
    // Procurar IA com ID correspondente
    const ai = allAIs.find(aiInstance => {
        // Converter ambos para Number para comparação segura
        const aiId = Number(aiInstance.playerId);
        const playerId = Number(currentPlayer.id);
        return aiId === playerId;
    });
    
    if (!ai) {
        console.warn(`🤖 IA não encontrada para jogador ${currentPlayer.id} (${currentPlayer.name})`);
        console.log('📋 IAs disponíveis:', allAIs.map(a => {
            return {
                id: a.playerId,
                name: a.personality ? a.personality.name : 'Sem nome'
            };
        }));
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

  async _runAILoop(player) {
    const ai = getAIPlayer(player.id);
    if (!ai) { this.forceAIEndTurn(); return; }

    // 1. Fase RENDA (já tratada no TurnLogic, mas se cair aqui, avança)
    if (gameState.currentPhase === 'renda') {
        gameState.currentPhase = 'acoes';
        gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
        await this._delay(1000);
    }

    // 2. Fase AÇÕES
    if (gameState.currentPhase === 'acoes') {
        await this._executeActions(ai);
        // Avançar para negociação
        this.main.negotiationLogic.setupPhase();
        await this._delay(1000);
    }

    // 3. Fase NEGOCIAÇÃO
    if (gameState.currentPhase === 'negociacao') {
        await this._executeNegotiations(ai);
        // Finalizar turno
        this.main.turnLogic.handleEndTurn();
    }
  }

  async _executeActions(ai) {
    while (gameState.actionsLeft > 0) {
        await this._delay(1000);
        try {
            await ai.takeTurn(gameState, window.uiManager);
            if(window.uiManager) window.uiManager.updateUI();
        } catch (e) {
            console.error('Erro ação IA:', e);
            break; // Sai do loop para não travar
        }
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
            window.uiManager.updateFooter();
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
        console.log(`🤖 Avaliando proposta ${negotiation.id} de ${gameState.players[negotiation.initiatorId]?.name}`);
        
        // Avaliar proposta
        const shouldAccept = ai.evaluateNegotiationProposal?.(negotiation, gameState) || false;
        
        console.log(`🤖 Decisão: ${shouldAccept ? '✅ ACEITAR' : '❌ RECUSAR'}`);
        
        // Configurar como negociação ativa
        setActiveNegotiation(negotiation);
        await this._delay(500);
        
        // Responder via gameLogic
        if (window.gameLogic?.handleNegResponse) {
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
        if (window.gameLogic?.handleSendNegotiation) {
            return await window.gameLogic.handleSendNegotiation();
        }
        
        return false;
    } catch (error) {
        console.error('Erro em proposta simples:', error);
        return false;
    }
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
