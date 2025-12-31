// event-manager.js - Gerenciador de Eventos Aleatórios
import { GAME_EVENTS, EVENT_CATEGORIES } from '../state/game-config.js';
import { addActivityLog } from '../state/game-state.js';

export class EventManager {
  constructor(gameLogic) {
    this.main = gameLogic;
    this.currentEvent = null;
    this.eventTurnsLeft = 0;
    this.turnsUntilNextEvent = 4;
    this.eventModifiers = {};
    this.eventHistory = [];
  }

  // ==================== CONTROLE DE EVENTOS ====================

  triggerRandomEvent(gameState) {
    console.log('🎴 EventManager: Verificando evento aleatório...');
    
    if (this.currentEvent || !GAME_EVENTS || GAME_EVENTS.length === 0) {
      return null;
    }

    // Escolher evento baseado em categoria
    const event = this._selectEventByCategory();
    if (!event) return null;

    this.currentEvent = event;
    this.eventTurnsLeft = event.duration || 2;
    
    // Aplicar efeito do evento
    if (event.apply) {
      event.apply({ 
        eventModifiers: this.eventModifiers,
        players: gameState.players,
        gameState: gameState
      });
    }

    // Registrar no histórico
    this.eventHistory.push({
      id: event.id,
      name: event.name,
      turn: gameState.turn,
      duration: event.duration
    });

    // Limitar histórico
    if (this.eventHistory.length > 20) {
      this.eventHistory.shift();
    }

    // Log do evento
    addActivityLog({
      type: 'event',
      playerName: 'GAIA',
      action: 'evento',
      details: event.name,
      turn: gameState.turn,
      isEvent: true
    });

    console.log(`🎴 Evento ativado: ${event.name} (duração: ${event.duration} turnos)`);
    return event;
  }

  _selectEventByCategory() {
    const availableEvents = [...GAME_EVENTS];
    
    // Evitar eventos muito recentes
    const recentEvents = this.eventHistory.slice(-3).map(e => e.id);
    const filteredEvents = availableEvents.filter(event => 
      !recentEvents.includes(event.id)
    );

    const eventsToUse = filteredEvents.length > 0 ? filteredEvents : availableEvents;
    
    // Balancear categorias (evitar muitos eventos negativos seguidos)
    const lastEvents = this.eventHistory.slice(-2);
    const negativeCount = lastEvents.filter(e => 
      EVENT_CATEGORIES.NEGATIVE.includes(e.id)
    ).length;

    let eligibleEvents = eventsToUse;
    
    if (negativeCount >= 2) {
      // Dar preferência para eventos não negativos
      eligibleEvents = eventsToUse.filter(event => 
        !EVENT_CATEGORIES.NEGATIVE.includes(event.id)
      );
      
      if (eligibleEvents.length === 0) {
        eligibleEvents = eventsToUse; // Usar todos se não houver opções
      }
    }

    // Selecionar aleatoriamente
    const randomIndex = Math.floor(Math.random() * eligibleEvents.length);
    return eligibleEvents[randomIndex];
  }

  // ==================== ATUALIZAÇÃO DE EVENTOS ====================

  updateEventTurn(gameState) {
    if (this.currentEvent) {
      this.eventTurnsLeft--;
      
      if (this.eventTurnsLeft <= 0) {
        this.endCurrentEvent(gameState);
      }
    } else {
      this.turnsUntilNextEvent--;
      
      if (this.turnsUntilNextEvent <= 0) {
        this.triggerRandomEvent(gameState);
        this.turnsUntilNextEvent = 4; // Resetar contador
      }
    }
  }

  endCurrentEvent(gameState) {
    if (!this.currentEvent) return;

    console.log(`🎴 Finalizando evento: ${this.currentEvent.name}`);

    // Remover efeito do evento
    if (this.currentEvent.remove) {
      this.currentEvent.remove({ 
        eventModifiers: this.eventModifiers,
        players: gameState.players,
        gameState: gameState
      });
    }

    // Resetar modificadores
    this.eventModifiers = {};
    this.currentEvent = null;
    this.eventTurnsLeft = 0;

    // Notificação
    if (this.main.showFeedback) {
      this.main.showFeedback('Evento global terminou.', 'info');
    }
  }

  // ==================== APLICAÇÃO DE MODIFICADORES ====================

  applyEventModifier(resource, baseAmount) {
    if (!this.eventModifiers || baseAmount === 0) {
      return baseAmount;
    }

    // Aplicar multiplicadores
    const multiplierKey = `${resource}Multiplier`;
    if (this.eventModifiers[multiplierKey]) {
      return Math.floor(baseAmount * this.eventModifiers[multiplierKey]);
    }

    // Aplicar bônus fixos
    const bonusKey = `${resource}Bonus`;
    if (this.eventModifiers[bonusKey]) {
      return baseAmount + this.eventModifiers[bonusKey];
    }

    return baseAmount;
  }

  applyCollectionBonus(player, region) {
    if (!this.eventModifiers) return null;

    const bonuses = {};

    // Bônus de festival
    if (this.eventModifiers.festivalBonus) {
      const resourceTypes = Object.keys(region.resources).filter(k => region.resources[k] > 0);
      if (resourceTypes.length > 0) {
        const randomResource = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
        bonuses[randomResource] = 2;
      }
    }

    // Bônus de inverno
    if (this.eventModifiers.coletaBonus) {
      Object.entries(this.eventModifiers.coletaBonus).forEach(([resource, amount]) => {
        bonuses[resource] = (bonuses[resource] || 0) + amount;
      });
    }

    return Object.keys(bonuses).length > 0 ? bonuses : null;
  }

  // ==================== GETTERS E UTILITÁRIOS ====================

  getCurrentEvent() {
    return this.currentEvent ? { ...this.currentEvent } : null;
  }

  getEventModifiers() {
    return { ...this.eventModifiers };
  }

  isEventActive(eventId) {
    return this.currentEvent && this.currentEvent.id === eventId;
  }

  getEventStatus() {
    return {
      active: !!this.currentEvent,
      currentEvent: this.currentEvent ? this.currentEvent.name : null,
      turnsLeft: this.eventTurnsLeft,
      nextEventIn: this.turnsUntilNextEvent,
      modifiers: { ...this.eventModifiers }
    };
  }

  // ==================== DEBUG E ESTATÍSTICAS ====================

  getEventStatistics() {
    const categoryCounts = {
      POSITIVE: 0,
      NEGATIVE: 0,
      MIXED: 0
    };

    this.eventHistory.forEach(event => {
      if (EVENT_CATEGORIES.POSITIVE.includes(event.id)) categoryCounts.POSITIVE++;
      else if (EVENT_CATEGORIES.NEGATIVE.includes(event.id)) categoryCounts.NEGATIVE++;
      else categoryCounts.MIXED++;
    });

    return {
      totalEvents: this.eventHistory.length,
      categoryCounts,
      lastEvent: this.eventHistory[this.eventHistory.length - 1] || null,
      currentEvent: this.currentEvent ? this.currentEvent.name : 'Nenhum'
    };
  }

  getDebugInfo() {
    return {
      currentEvent: this.currentEvent?.name || 'Nenhum',
      turnsLeft: this.eventTurnsLeft,
      turnsUntilNext: this.turnsUntilNextEvent,
      activeModifiers: Object.keys(this.eventModifiers).length,
      eventHistory: this.eventHistory.length
    };
  }
}