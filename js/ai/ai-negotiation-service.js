// ai-negotiation-service.js - Serviço de Negociações para IA
import { 
  getPendingNegotiationsForPlayer,
  resetNegotiationState,
  setNegotiationTarget,
  updateNegotiationResource,
  validateNegotiationState,
  getNegotiationValidationErrors,
  setActiveNegotiation
} from '../state/game-state.js';

export class AINegotiationService {
  constructor(aiBrain) {
    this.aiBrain = aiBrain;
    this.memory = {
      successfulTrades: [],
      failedTrades: [],
      playerRelationships: new Map()
    };
  }

  // ==================== PROCESSAMENTO DE PROPOSTAS ====================

  async processPendingNegotiations(gameState) {
    const player = gameState.players[this.aiBrain.playerId];
    const pending = getPendingNegotiationsForPlayer(this.aiBrain.playerId);
    
    console.log(`🤖 ${player.name} processando ${pending.length} proposta(s) pendente(s)`);
    
    if (pending.length === 0) return { processed: 0, accepted: 0 };
    
    let acceptedCount = 0;
    
    for (const negotiation of pending) {
      try {
        const shouldAccept = this.evaluateProposal(negotiation, gameState);
        
        await this._processSingleNegotiation(negotiation, shouldAccept, gameState);
        
        if (shouldAccept) acceptedCount++;
        
        // Pequeno delay entre processamentos
        await this._delay(this.aiBrain.settings?.reactionDelay || 1000);
        
      } catch (error) {
        console.error(`🤖 Erro ao processar proposta ${negotiation.id}:`, error);
      }
    }
    
    return { processed: pending.length, accepted: acceptedCount };
  }

  evaluateProposal(negotiation, gameState) {
    const myPlayer = gameState.players[this.aiBrain.playerId];
    const theirPlayer = gameState.players[negotiation.initiatorId];
    
    if (!myPlayer || !theirPlayer) return false;
    
    // Análise baseada na personalidade
    switch (this.aiBrain.personality.type) {
      case 'economist':
        return this._evaluateAsEconomist(negotiation, myPlayer, theirPlayer);
      case 'expansionist':
        return this._evaluateAsExpansionist(negotiation, myPlayer, theirPlayer);
      case 'builder':
        return this._evaluateAsBuilder(negotiation, myPlayer, theirPlayer);
      case 'diplomat':
        return this._evaluateAsDiplomat(negotiation, myPlayer, theirPlayer);
      default:
        return this._evaluateAsEconomist(negotiation, myPlayer, theirPlayer);
    }
  }

  _evaluateAsEconomist(negotiation, myPlayer, theirPlayer) {
    const offerValue = this._calculateResourceValue(negotiation.offer);
    const requestValue = this._calculateResourceValue(negotiation.request);
    
    const valueRatio = offerValue > 0 ? requestValue / offerValue : 0;
    const profitMargin = (offerValue - requestValue) / Math.max(1, requestValue);
    
    console.log(`💰 Economista: Oferta=${offerValue}, Solicitação=${requestValue}, Margem=${profitMargin.toFixed(2)}`);
    
    // Aceitar se tiver lucro ou for quase igual
    return profitMargin >= -0.1; // Aceita até 10% de prejuízo
  }

  _evaluateAsExpansionist(negotiation, myPlayer, theirPlayer) {
    let offerValue = 0;
    let requestValue = 0;
    
    // Valorizar regiões oferecidas
    if (negotiation.offer.regions && negotiation.offer.regions.length > 0) {
      offerValue += negotiation.offer.regions.length * 15;
    }
    
    // Penalizar regiões solicitadas
    if (negotiation.request.regions && negotiation.request.regions.length > 0) {
      requestValue += negotiation.request.regions.length * 20;
    }
    
    const resourceValue = this._calculateResourceValue(negotiation.offer) - 
                         this._calculateResourceValue(negotiation.request);
    
    const totalValue = offerValue - requestValue + resourceValue;
    console.log(`🗺️ Expansionista: Valor total=${totalValue}`);
    
    return totalValue > 0;
  }

  _evaluateAsBuilder(negotiation, myPlayer, theirPlayer) {
    let value = 0;
    
    // Valorizar materiais de construção
    if (negotiation.offer.pedra) value += negotiation.offer.pedra * 3;
    if (negotiation.offer.madeira) value += negotiation.offer.madeira * 2;
    
    // Penalizar perder materiais de construção
    if (negotiation.request.pedra) value -= negotiation.request.pedra * 4;
    if (negotiation.request.madeira) value -= negotiation.request.madeira * 3;
    
    console.log(`🏗️ Construtor: Valor=${value}`);
    return value > 0;
  }

  _evaluateAsDiplomat(negotiation, myPlayer, theirPlayer) {
    // Diplomata é mais cooperativo
    const relationship = this._getRelationship(negotiation.initiatorId);
    const baseChance = 0.6 + (relationship * 0.1); // 60% base + bônus de relacionamento
    
    // Ajustar baseado no valor
    const resourceValue = this._calculateResourceValue(negotiation.offer) - 
                         this._calculateResourceValue(negotiation.request);
    
    const valueBonus = Math.min(0.3, resourceValue * 0.05);
    const finalChance = Math.min(0.9, baseChance + valueBonus);
    
    console.log(`🤝 Diplomata: Chance=${finalChance.toFixed(2)}, Relacionamento=${relationship}`);
    
    return Math.random() < finalChance;
  }

  // ==================== CRIAÇÃO DE PROPOSTAS ====================

  async createAndSendProposal(gameState) {
    const myPlayer = gameState.players[this.aiBrain.playerId];
    
    if (!myPlayer || myPlayer.resources.ouro < 1 || gameState.actionsLeft <= 0) {
      return false;
    }
    
    const target = this._findBestNegotiationTarget(gameState);
    if (!target) return false;
    
    console.log(`🤖 ${myPlayer.name} criando proposta para ${target.name}`);
    
    const proposal = this._createProposal(myPlayer, target, gameState);
    if (!proposal) return false;
    
    return await this._sendProposal(proposal, target.id, gameState);
  }

  _findBestNegotiationTarget(gameState) {
    const myPlayer = gameState.players[this.aiBrain.playerId];
    const otherPlayers = gameState.players.filter(p => 
      p.id !== this.aiBrain.playerId && 
      p.resources.ouro >= 1 && // Precisa ter ouro para negociar
      !p.eliminated
    );
    
    if (otherPlayers.length === 0) return null;
    
    // Escolher alvo baseado na personalidade
    switch (this.aiBrain.personality.type) {
      case 'expansionist':
        // Prefere jogadores mais fracos
        return otherPlayers.sort((a, b) => a.victoryPoints - b.victoryPoints)[0];
      case 'diplomat':
        // Prefere jogadores com bom relacionamento
        return otherPlayers.sort((a, b) => 
          this._getRelationship(b.id) - this._getRelationship(a.id)
        )[0];
      case 'economist':
        // Prefere jogadores com muitos recursos
        return otherPlayers.sort((a, b) => 
          (b.resources.ouro + b.resources.pedra) - (a.resources.ouro + a.resources.pedra)
        )[0];
      default:
        // Aleatório, mas com viés
        return otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
    }
  }

  _createProposal(myPlayer, targetPlayer, gameState) {
    const proposal = {
      offer: { madeira: 0, pedra: 0, ouro: 0, agua: 0 },
      request: { madeira: 0, pedra: 0, ouro: 0, agua: 0 }
    };
    
    const myResources = myPlayer.resources;
    const theirResources = targetPlayer.resources;
    
    // Análise de necessidades
    const myNeeds = this._analyzeResourceNeeds(myPlayer, gameState);
    const theirNeeds = this._analyzeResourceNeeds(targetPlayer, gameState);
    
    // Criar proposta baseada na personalidade
    switch (this.aiBrain.personality.type) {
      case 'economist':
        this._createEconomistProposal(proposal, myResources, theirResources, myNeeds, theirNeeds);
        break;
      case 'expansionist':
        this._createExpansionistProposal(proposal, myPlayer, targetPlayer, gameState);
        break;
      case 'builder':
        this._createBuilderProposal(proposal, myResources, theirResources, myNeeds);
        break;
      case 'diplomat':
        this._createDiplomatProposal(proposal, myResources, theirResources);
        break;
    }
    
    // Validar que a proposta não está vazia
    const hasOffer = Object.values(proposal.offer).some(v => v > 0);
    const hasRequest = Object.values(proposal.request).some(v => v > 0);
    
    if (!hasOffer && !hasRequest) {
      console.log('🤖 Proposta vazia, criando proposta padrão...');
      this._createDefaultProposal(proposal, myResources, theirResources);
    }
    
    // Garantir que não está oferecendo mais do que tem
    Object.keys(proposal.offer).forEach(resource => {
      if (proposal.offer[resource] > (myResources[resource] || 0)) {
        proposal.offer[resource] = Math.max(0, myResources[resource] || 0);
      }
    });
    
    return proposal;
  }

  _createEconomistProposal(proposal, myResources, theirResources, myNeeds, theirNeeds) {
    // Oferecer recursos que temos em excesso por recursos que precisamos
    const excessResources = this._findExcessResources(myResources, 10);
    const neededResources = this._findNeededResources(myNeeds);
    
    if (excessResources.length > 0 && neededResources.length > 0) {
      const offerResource = excessResources[0];
      const requestResource = neededResources[0];
      
      if (offerResource !== requestResource) {
        const offerAmount = Math.min(3, Math.floor(myResources[offerResource] * 0.2));
        const requestAmount = Math.min(3, Math.floor(theirResources[requestResource] * 0.2));
        
        if (offerAmount > 0 && requestAmount > 0) {
          proposal.offer[offerResource] = offerAmount;
          proposal.request[requestResource] = requestAmount;
        }
      }
    }
  }

  _createExpansionistProposal(proposal, myPlayer, targetPlayer, gameState) {
    // Se tiver muitas regiões, pode oferecer uma menos valiosa
    if (myPlayer.regions.length > 6 && targetPlayer.regions.length < 5) {
      const regionToOffer = this._findLeastValuableRegion(myPlayer.regions, gameState);
      if (regionToOffer !== null) {
        proposal.offer.regions = [regionToOffer];
        proposal.request.ouro = 3;
      }
    } else {
      // Troca normal de recursos
      if (myPlayer.resources.ouro > 4 && targetPlayer.resources.pedra > 6) {
        proposal.offer.ouro = 2;
        proposal.request.pedra = 3;
      }
    }
  }

  _createBuilderProposal(proposal, myResources, theirResources, myNeeds) {
    // Construtor quer pedra e madeira
    if (myResources.madeira > 12 && theirResources.pedra > 8) {
      proposal.offer.madeira = Math.min(4, Math.floor(myResources.madeira * 0.15));
      proposal.request.pedra = Math.min(3, Math.floor(theirResources.pedra * 0.15));
    } else if (myResources.ouro > 3 && theirResources.madeira > 10) {
      proposal.offer.ouro = 1;
      proposal.request.madeira = Math.min(3, Math.floor(theirResources.madeira * 0.2));
    }
  }

  _createDiplomatProposal(proposal, myResources, theirResources) {
    // Diplomata faz trocas equilibradas
    const resources = ['madeira', 'pedra', 'ouro', 'agua'];
    const availableResources = resources.filter(r => myResources[r] > 5);
    
    if (availableResources.length > 0) {
      const resource = availableResources[0];
      const amount = Math.min(2, Math.floor(myResources[resource] * 0.1));
      
      proposal.offer[resource] = amount;
      
      // Solicitar algo de valor similar
      const theirAvailable = resources.filter(r => theirResources[r] > 5 && r !== resource);
      if (theirAvailable.length > 0) {
        proposal.request[theirAvailable[0]] = amount;
      }
    }
  }

  _createDefaultProposal(proposal, myResources, theirResources) {
    // Proposta padrão: madeira por água
    if (myResources.madeira > 3 && theirResources.agua > 3) {
      proposal.offer.madeira = 2;
      proposal.request.agua = 2;
    } else if (myResources.pedra > 2 && theirResources.madeira > 3) {
      proposal.offer.pedra = 1;
      proposal.request.madeira = 2;
    }
  }

  // ==================== UTILITÁRIOS ====================

  async _processSingleNegotiation(negotiation, shouldAccept, gameState) {
    setActiveNegotiation(negotiation);
    
    await this._delay(500);
    
    if (window.gameLogic?.handleNegResponse) {
      window.gameLogic.handleNegResponse(shouldAccept);
    }
    
    // Atualizar relacionamento
    this._updateRelationship(negotiation.initiatorId, shouldAccept);
    
    // Registrar na memória
    this.memory[shouldAccept ? 'successfulTrades' : 'failedTrades'].push({
      partner: negotiation.initiatorId,
      turn: gameState.turn,
      timestamp: Date.now()
    });
  }

  async _sendProposal(proposal, targetId, gameState) {
    resetNegotiationState();
    setNegotiationTarget(targetId);
    
    // Configurar recursos
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
    
    // Validar
    if (!validateNegotiationState()) {
      const errors = getNegotiationValidationErrors();
      console.log(`🤖 Proposta inválida:`, errors);
      return false;
    }
    
    // Enviar
    if (window.gameLogic?.handleSendNegotiation) {
      return await window.gameLogic.handleSendNegotiation();
    }
    
    return false;
  }

  _calculateResourceValue(offer) {
    const weights = {
      'ouro': 3.0,
      'pedra': 2.0,
      'madeira': 1.5,
      'agua': 1.0
    };
    
    let value = 0;
    Object.keys(offer).forEach(resource => {
      if (resource !== 'regions' && offer[resource]) {
        value += (offer[resource] || 0) * (weights[resource] || 1);
      }
    });
    
    // Valor de regiões
    if (offer.regions && offer.regions.length > 0) {
      value += offer.regions.length * 10;
    }
    
    return value;
  }

  _analyzeResourceNeeds(player, gameState) {
    const needs = {};
    const targets = this.aiBrain.personality.resourceTargets || {};
    
    Object.keys(targets).forEach(resource => {
      const target = targets[resource] || 10;
      const current = player.resources[resource] || 0;
      needs[resource] = Math.max(0, target - current) / target;
    });
    
    return needs;
  }

  _findExcessResources(resources, threshold = 10) {
    return Object.keys(resources).filter(resource => 
      (resources[resource] || 0) > threshold
    );
  }

  _findNeededResources(needs) {
    return Object.entries(needs)
      .filter(([_, need]) => need > 0.3)
      .sort((a, b) => b[1] - a[1])
      .map(([resource]) => resource);
  }

  _findLeastValuableRegion(regionIds, gameState) {
    if (regionIds.length === 0) return null;
    
    let minValue = Infinity;
    let minRegion = null;
    
    regionIds.forEach(regionId => {
      const region = gameState.regions[regionId];
      if (!region) return;
      
      const value = Object.values(region.resources).reduce((a, b) => a + b, 0);
      if (value < minValue) {
        minValue = value;
        minRegion = regionId;
      }
    });
    
    return minRegion;
  }

  _getRelationship(playerId) {
    return this.memory.playerRelationships.get(playerId) || 0;
  }

  _updateRelationship(playerId, accepted) {
    const current = this._getRelationship(playerId);
    const change = accepted ? 0.1 : -0.05;
    const newValue = Math.max(-1, Math.min(1, current + change));
    
    this.memory.playerRelationships.set(playerId, newValue);
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== ESTATÍSTICAS ====================

  getNegotiationStats() {
    return {
      totalProposals: this.memory.successfulTrades.length + this.memory.failedTrades.length,
      accepted: this.memory.successfulTrades.length,
      rejected: this.memory.failedTrades.length,
      acceptanceRate: this.memory.successfulTrades.length / 
        Math.max(1, this.memory.successfulTrades.length + this.memory.failedTrades.length),
      relationships: Array.from(this.memory.playerRelationships.entries())
    };
  }
}