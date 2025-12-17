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

  async checkAndExecuteAITurn() {
    if (this.inProgress) return;
    const player = getCurrentPlayer();
    if (!player || (!player.type === 'ai' && !player.isAI)) return;

    this.inProgress = true;
    console.log(`🤖 Iniciando loop IA para ${player.name}`);

    try {
        await this._runAILoop(player);
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
    console.log(`🤖 ${ai.personality.name} processando negociações`);
    
    // 1. Processar propostas PENDENTES (destinadas à IA)
    const currentPlayer = getCurrentPlayer();
    const currentPlayerId = Number(currentPlayer.id);
    
    const pending = getPendingNegotiationsForPlayer(currentPlayerId);
    console.log(`🤖 ${currentPlayer.name} tem ${pending.length} proposta(s) pendente(s)`);
    
    if (pending.length > 0 && ai.handlePendingNegotiations) {
        await ai.handlePendingNegotiations(pending, gameState);
        await this._delay(1000); // Dar tempo para processar
    }
    
    // 2. Enviar nova proposta (se possível)
    if (gameState.actionsLeft > 0 && currentPlayer.resources.ouro >= 1) {
        console.log(`🤖 ${currentPlayer.name} tentando enviar proposta`);
        
        // Pequeno delay antes de enviar nova proposta
        await this._delay(1500);
        
        if (ai.sendNegotiationProposal) {
            try {
                const success = await ai.sendNegotiationProposal(gameState);
                if (success) {
                    console.log(`✅ ${currentPlayer.name} enviou proposta com sucesso`);
                }
            } catch (error) {
                console.error(`❌ Erro ao enviar proposta:`, error);
            }
        }
    }
    
    // 3. Se não há ações ou não tem ouro, finalizar turno
    if (gameState.actionsLeft === 0 || currentPlayer.resources.ouro < 1) {
        console.log(`🤖 ${currentPlayer.name} terminou negociação`);
        return 'end_turn';
    }
    
    return 'continue';
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
