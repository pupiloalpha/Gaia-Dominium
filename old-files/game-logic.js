// game-logic.js - Lógica de turnos, ações e eventos

import { 
  gameState, 
  achievementsState,
  setGameState,
  setAchievementsState,
  addActivityLog,
  updatePlayerResources,
  updatePlayerVictoryPoints,
  updateRegionController,
  updateRegionExploration,
  addStructureToRegion,
  clearRegionSelection,
  getCurrentPlayer,
  setCurrentPhase,
  updateCurrentPlayerIndex,
  resetActions,
  addPendingNegotiation,
  getPendingNegotiationsForPlayer,
  removePendingNegotiation,
  setActiveNegotiation,
  clearActiveNegotiation,
  updateNegotiationStatus,
  getPlayerById,
  setSelectedRegion,
  getNegotiationState,
  validateNegotiationState,
  getNegotiationValidationErrors,
  resetNegotiationState,
  setNegotiationTarget,
  updateNegotiationResource,
  updateNegotiationRegions,
  saveGame // Adicionado para auto-save
} from './game-state.js';

import { 
  GAME_CONFIG, 
  RESOURCE_ICONS,
  BIOME_INCOME,
  BIOME_INITIAL_RESOURCES,
  EXPLORATION_BONUS,
  EXPLORATION_SPECIAL_BONUS,
  STRUCTURE_COSTS,
  STRUCTURE_INCOME,
  STRUCTURE_EFFECTS,
  GAME_EVENTS,
  ACHIEVEMENTS_CONFIG
} from './game-config.js';

class GameLogic {
  constructor() {
    this.GAME_EVENTS = GAME_EVENTS;
    this.incomeModalAttempts = 0;
  }

  getNegotiationState() {
    return getNegotiationState();
  }

  updateNegotiationResource(type, resourceKey, value) {
    updateNegotiationResource(type, resourceKey, value);
  }

  updateNegotiationRegions(type, regionIds) {
    updateNegotiationRegions(type, regionIds);
  }

  setNegotiationTarget(targetId) {
    setNegotiationTarget(targetId);
  }

  validateCurrentNegotiation() {
    return validateNegotiationState();
  }

  // ==================== INICIALIZAÇÃO ====================

  initializeGame() {
    this.setupRegions();
    this.distributeInitialRegions();
    
    // Inicializar estado do jogo
    gameState.gameStarted = true;
    gameState.turn = 1;
    gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
    
    // Começar na fase de renda
    gameState.currentPhase = 'renda';
    
    addActivityLog({
      type: 'system',
      playerName: 'SISTEMA',
      action: 'Jogo iniciado',
      details: '',
      turn: gameState.turn
    });
    
    // Aplicar renda inicial (irá mostrar a modal)
    const currentPlayer = getCurrentPlayer();
    
    // Delay maior para garantir que a UI esteja completamente carregada
    setTimeout(() => {
      this.applyIncomeForPlayer(currentPlayer);
    }, 1200);
  }

  // Adicione este novo método para avançar fases
  advancePhase() {
    const phases = ['renda', 'acoes', 'negociacao'];
    const currentIndex = phases.indexOf(gameState.currentPhase);
    const nextIndex = (currentIndex + 1) % phases.length;
    
    gameState.currentPhase = phases[nextIndex];
    
    // Log da mudança de fase
    const phaseNames = {
      'renda': '💰 Renda',
      'acoes': '⚡ Ações',
      'negociacao': '🤝 Negociação'
    };
    
    addActivityLog({
      type: 'system',
      playerName: 'SISTEMA',
      action: 'Fase alterada',
      details: `Nova fase: ${phaseNames[gameState.currentPhase]}`,
      turn: gameState.turn
    });

    // Forçar atualização da UI
    setTimeout(() => {
      if (window.uiManager) {
        window.uiManager.updateUI();
        window.uiManager.updateFooter();
      }
    }, 100);
    
    return gameState.currentPhase;
  }

  // ==================== CONTROLE DE FASES ====================

  isPhaseValidForAction(actionType) {
    // Verificar se é uma ação de negociação
    if (actionType === 'negociar') {
      return gameState.currentPhase === 'negociacao';
    }
    
    // Para outras ações, verificar se não está na fase de negociação
    if (gameState.currentPhase === 'negociacao') {
      return false; // Nenhuma ação além de negociar é permitida
    }
    
    const currentPhase = gameState.currentPhase;
    
    // Mapear quais ações são permitidas em cada fase
    const phaseActions = {
      'renda': [], // Nenhuma ação manual na fase de renda
      'acoes': ['explorar', 'recolher', 'construir'],
      'negociacao': ['negociar']
    };
    
    const isValid = phaseActions[currentPhase]?.includes(actionType) || false;
    console.log(`Validação: fase=${currentPhase}, ação=${actionType}, válido=${isValid}`); // Debug
    return isValid;
  }

  // Método auxiliar para verificar custos por ação
  getActionCost(actionType) {
    const costs = {
      'explorar': { madeira: 2, agua: 1 },
      'recolher': { madeira: 1 },
      'construir': { madeira: 3, pedra: 2, ouro: 1 },
      'negociar': { ouro: 1 }
    };
    return costs[actionType] || {};
  }

  // Avaliação de recursos do jogador
  applyIncomeForCurrentPlayer() {
    const currentPlayer = getCurrentPlayer();
    if (currentPlayer && gameState.currentPhase === 'renda') {
      this.applyIncomeForPlayer(currentPlayer);
    }
  }

  // Função de gestão de recursos por bioma
  generateResourcesForBiome(biome) {
    switch(biome) {
      case 'Floresta Tropical': return { madeira:6, pedra:1, ouro:0, agua:3 };
      case 'Floresta Temperada': return { madeira:5, pedra:2, ouro:0, agua:2 };
      case 'Savana': return { madeira:2, pedra:1, ouro:3, agua:1 };
      case 'Pântano': return { madeira:1, pedra:3, ouro:0, agua:4 };
      default: return { madeira:2, pedra:2, ouro:1, agua:1 };
    }
  }

  // Função que faz a distribuição de regiões por jogadores no inicio do jogo
  distributeInitialRegions() {
    const total = gameState.regions.length;
    const indices = [...Array(total).keys()].sort(() => Math.random() - 0.5);
    let idx = 0;
    
    gameState.players.forEach(p => p.regions = []);
    
    for (let p = 0; p < gameState.players.length; p++) {
      for (let r = 0; r < 4 && idx < indices.length; r++) {
        const regionId = indices[idx++];
        gameState.regions[regionId].controller = p;
        gameState.players[p].regions.push(regionId);
      }
    }
  }

  // ==================== SISTEMA DE AÇÕES ====================

  performAction(actionType = null) {
    // Verificar se está na fase correta para esta ação
    if (actionType && !this.isPhaseValidForAction(actionType)) {
      this.showFeedback(`Ação "${actionType}" não permitida na fase atual.`, 'warning');
      return false;
    }
    
    if (gameState.actionsLeft <= 0) {
      this.showFeedback('Sem ações restantes neste turno.', 'warning');
      return false;
    }
    
    // Atualizar UI imediatamente
    if (window.uiManager && window.uiManager.updateFooter) {
      setTimeout(() => window.uiManager.updateFooter(), 10);
    }

    gameState.actionsLeft--;
    return true;
  }

  // ==================== EXPLORAR / ASSUMIR DOMÍNIO ====================

  async handleExplore() {
    // VERIFICAÇÃO CRÍTICA - bloquear se modal está aberta
    if (this.preventActionIfModalOpen()) {
      return;
    }

    // Verificar se está na fase correta
    if (!this.isPhaseValidForAction('explorar')) {
      this.showFeedback('Ação não permitida nesta fase. Vá para fase de Ações.', 'warning');
      return;
    }
    
    if (gameState.selectedRegionId === null) {
      this.showFeedback('Selecione uma região primeiro.', 'error');
      return;
    }
    
    const region = gameState.regions[gameState.selectedRegionId];
    const player = gameState.players[gameState.currentPlayerIndex];
    
    if (region.controller === null) {
      // ASSUMIR DOMÍNIO
      const cost = region.resources;
      const pvCost = 2;
      
      if (player.victoryPoints < pvCost) {
        this.showFeedback(`Você precisa de ${pvCost} PV para assumir domínio desta região.`, 'error');
        return;
      }
      
      const canPay = Object.entries(cost).every(([k,v]) => player.resources[k] >= v);
      if (!canPay) {
        const needed = Object.entries(cost).map(([k,v]) => `${k}: ${v}`).join(', ');
        this.showFeedback(`Recursos insuficientes. Necessário: ${needed}`, 'error');
        return;
      }
      
      const resourceList = Object.entries(cost).map(([k,v]) => `${RESOURCE_ICONS[k]}${v}`).join(' ');
      const ok = await this.showConfirm(
        'Assumir Domínio', 
        `Custo: ${pvCost} PV + ${resourceList}\n\nDeseja assumir o controle de ${region.name}?`
      );
      
      if (!ok) return;
      if (!this.performAction('explorar')) return;
      
      player.victoryPoints -= pvCost;
      Object.entries(cost).forEach(([k,v]) => player.resources[k] -= v);
      
      region.controller = gameState.currentPlayerIndex;
      player.regions.push(gameState.selectedRegionId);
      
      this.showFeedback(`${region.name} agora está sob seu controle! -${pvCost} PV`, 'success');
      
      addActivityLog({
        type: 'explore',
        playerName: player.name,
        action: 'assumiu domínio de',
        details: region.name,
        turn: gameState.turn
      });

      
    } else if (region.controller === gameState.currentPlayerIndex) {
      // EXPLORAR (região própria)
      if (!this.canAffordAction('explorar')) {
        this.showFeedback('Recursos insuficientes para explorar.', 'error');
        return;
      }
      
      if (!this.performAction('explorar')) return;
      
      // Pagar custo da ação
      const cost = GAME_CONFIG.ACTION_DETAILS.explorar.cost;
      Object.entries(cost).forEach(([k,v]) => player.resources[k] -= v);
      
      region.explorationLevel = Math.min(3, region.explorationLevel + 1);
      player.victoryPoints += 1;
      
      if (Math.random() < 0.10) { 
        player.resources.ouro += 1; 
        this.showFeedback('Descoberta Rara! +1 Ouro', 'success'); 
      } else {
        this.showFeedback(`${region.name} explorada. Nível: ${region.explorationLevel}⭐`, 'success');
      }
      
      achievementsState.totalExplored++;
      
      const desc = Math.random() < 0.10 ? 'explorou (Descoberta Rara!)' : `explorou (Nível ${region.explorationLevel})`;

      addActivityLog({
        type: 'explore',
        playerName: player.name,
        action: desc,
        details: region.name,
        turn: gameState.turn
      });
      
    } else {
      this.showFeedback('Você não pode explorar regiões de outros jogadores.', 'error');
      return;
    }
    
    this.clearRegionSelection();
    this.checkVictory();
    
    // Atualizar UI
    if (window.uiManager) {
      window.uiManager.updateUI();
      window.uiManager.updateFooter();
    }

    // No final de cada método de ação (handleExplore, handleCollect, etc.), adicione:
    if (window.uiManager && window.uiManager.updateFooter) {
      setTimeout(() => window.uiManager.updateFooter(), 100);
    }
  }

  // ==================== RECOLHER ====================

  handleCollect() {
    // VERIFICAÇÃO CRÍTICA - bloquear se modal está aberta
    if (this.preventActionIfModalOpen()) {
      return;
    }

    // Verificar se está na fase correta
    if (!this.isPhaseValidForAction('recolher')) {
      this.showFeedback('Ação não permitida nesta fase. Vá para fase de Ações.', 'warning');
      return;
    }

    if (gameState.selectedRegionId === null) {
      this.showFeedback('Selecione uma região para recolher.', 'error');
      return;
    }

    if (!this.performAction('recolher')) {
      this.showFeedback('Sem ações restantes neste turno.', 'warning');
      return;
    }

    const region = gameState.regions[gameState.selectedRegionId];
    const player = gameState.players[gameState.currentPlayerIndex];

    if (region.controller !== gameState.currentPlayerIndex) {
      this.showFeedback('Você não controla essa região.', 'error');
      return;
    }

    if (region.explorationLevel === 0) {
      this.showFeedback('Você deve explorar a região antes de recolher.', 'warning');
      return;
    }

    // Custo da ação
    const cost = GAME_CONFIG.ACTION_DETAILS.recolher.cost;
    Object.entries(cost).forEach(([k,v]) => player.resources[k] -= v);

    // Lógica de recolha
    let harvestPercent = 0.5;

    // Bônus de exploração nível 1
    if (region.explorationLevel >= 1) {
      const resourceTypes = Object.keys(region.resources).filter(k => region.resources[k] > 0);
      if (resourceTypes.length > 0) {
        const randomRes = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
        player.resources[randomRes] += 1;
        this.showFeedback(`Bônus de exploração: +1 ${randomRes}!`, 'info');
      }
    }

    // Bônus de exploração nível 3
    if (region.explorationLevel === 3) {
      harvestPercent = 0.75;
      this.showFeedback('Recolha potencializada! +50% recursos.', 'info');
    }

    // Bônus de evento: Festival da Colheita
    if (gameState.eventModifiers.festivalBonus) {
      const resourceTypes = ['madeira', 'pedra', 'ouro', 'agua'];
      const bonus1 = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
      const bonus2 = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
      player.resources[bonus1] += 2;
      player.resources[bonus2] += 2;
      this.showFeedback(`Festival! +2 ${bonus1} e +2 ${bonus2}!`, 'success');
    }

    // Bônus de evento: Inverno Rigoroso
    if (gameState.eventModifiers.coletaBonus) {
      Object.keys(gameState.eventModifiers.coletaBonus).forEach(res => {
        player.resources[res] += gameState.eventModifiers.coletaBonus[res];
      });
      this.showFeedback('Inverno rigoroso torna a coleta mais valiosa!', 'info');
    }

    // Coleta normal
    Object.keys(region.resources).forEach(k => {
      const amount = Math.max(0, Math.floor(region.resources[k] * harvestPercent));
      player.resources[k] += amount;
      region.resources[k] = Math.max(0, region.resources[k] - amount);
    });

    player.victoryPoints += 1;
    this.showFeedback(`Recursos recolhidos de ${region.name}. +1 PV`, 'success');
    
    addActivityLog({
      type: 'collect',
      playerName: player.name,
      action: 'recolheu recursos',
      details: region.name,
      turn: gameState.turn
    });

    this.clearRegionSelection();
    this.checkVictory();
    
    // Atualizar UI
    if (window.uiManager) {
      window.uiManager.updateUI();
      window.uiManager.updateFooter();
    }

    // No final de cada método de ação (handleExplore, handleCollect, etc.), adicione:
    if (window.uiManager && window.uiManager.updateFooter) {
      setTimeout(() => window.uiManager.updateFooter(), 100);
    }
  }

  // ==================== CONSTRUIR ====================

  handleBuild(structureType = 'Abrigo') {
    // Verificar se está na fase correta
    if (!this.isPhaseValidForAction('construir')) {
      this.showFeedback('Ação não permitida nesta fase. Vá para fase de Ações.', 'warning');
      return;
    }

    if (gameState.selectedRegionId === null) {
      this.showFeedback('Selecione uma região para construir.', 'error');
      return;
    }
    
    const region = gameState.regions[gameState.selectedRegionId];
    const player = gameState.players[gameState.currentPlayerIndex];
    
    // Verificar se o jogador controla a região
    if (region.controller !== gameState.currentPlayerIndex) {
      this.showFeedback('Você só pode construir em regiões que controla.', 'error');
      return;
    }
    
    // Obter custo da estrutura
    const cost = STRUCTURE_COSTS[structureType];
    if (!cost) {
      this.showFeedback('Estrutura não encontrada.', 'error');
      return;
    }
    
    // Verificar se já existe essa estrutura na região
    if (region.structures.includes(structureType)) {
      this.showFeedback(`Esta região já possui um ${structureType}.`, 'error');
      return;
    }
    
    // Verificar se o jogador pode pagar
    const canPay = Object.entries(cost).every(([k,v]) => player.resources[k] >= v);
    if (!canPay) {
      this.showFeedback('Recursos insuficientes para construir.', 'error');
      return;
    }
    
    if (!this.performAction('construir')) return;
    
    // Pagar custo
    Object.entries(cost).forEach(([k,v]) => { 
      player.resources[k] -= v; 
    });

    // Adicionar estrutura à região
    region.structures.push(structureType);
    
    // Obter benefícios da estrutura
    const effect = STRUCTURE_EFFECTS[structureType] || {};
    const income = STRUCTURE_INCOME[structureType] || {};
    
    // Aplicar benefícios imediatos (PV)
    let pvGain = effect.pv || 0;
    
    // Bônus de evento (Boom Tecnológico)
    if (gameState.eventModifiers.construirBonus) {
      pvGain += gameState.eventModifiers.construirBonus;
    }
    
    player.victoryPoints += pvGain;
    
    this.showFeedback(`Construído ${structureType} em ${region.name}. +${pvGain} PV.`, 'success');

    // Atualizar conquistas
    achievementsState.totalBuilt++;
    
    addActivityLog({
      type: 'build',
      playerName: player.name,
      action: `construiu ${structureType}`,
      details: region.name,
      turn: gameState.turn
    });
    
    this.clearRegionSelection();
    this.checkVictory();
    
    // Atualizar UI
    if (window.uiManager) {
      window.uiManager.updateUI();
      window.uiManager.updateFooter();
    }

    // No final de cada método de ação (handleExplore, handleCollect, etc.), adicione:
    if (window.uiManager && window.uiManager.updateFooter) {
      setTimeout(() => window.uiManager.updateFooter(), 100);
    }
  }

  // ==================== NEGOCIAR ====================

  handleNegotiate() {
    console.log('Fase atual ao tentar negociar:', gameState.currentPhase);
    
    if (gameState.currentPhase !== 'negociacao') {
      this.showFeedback('Negociação só é permitida na fase de Negociação.', 'warning');
      return;
    }
    
    const player = getCurrentPlayer();
    
    if (player.resources.ouro < 1) {
      this.showFeedback('Você precisa de 1 Ouro para negociar.', 'error');
      return;
    }
    
    if (gameState.actionsLeft <= 0) {
      this.showFeedback('Sem ações restantes para negociar.', 'warning');
      return;
    }
    
    // CHAMAR O NOVO MÓDULO DIRETAMENTE
    console.log('Chamando novo modal de negociação');
    
    if (window.uiManager) {
      // Chamar o método de negociação através do novo módulo
      if (window.uiManager.negotiation && typeof window.uiManager.negotiation.openNegotiationModal === 'function') {
        window.uiManager.negotiation.openNegotiationModal();
      } else {
        console.error('Negotiation UI não disponível');
        this.showFeedback('Sistema de negociação não carregado', 'error');
      }
    } else {
      console.error('UI Manager não disponível');
    }
  }

  // Garantir funções para negociação
  setupNegotiationPhase() {
    gameState.currentPhase = 'negociacao';
    gameState.actionsLeft = 1;
    
    const currentPlayer = getCurrentPlayer();
    
    // Verificar propostas pendentes para o jogador atual
    setTimeout(() => {
      if (window.uiManager && window.uiManager.negotiation && window.uiManager.negotiation.checkPendingNegotiationsForCurrentPlayer) {
        window.uiManager.negotiation.checkPendingNegotiationsForCurrentPlayer();
      }
    }, 800);
    
    // Atualizar UI para mostrar fase de negociação
    if (window.uiManager) {
      window.uiManager.updateUI();
      window.uiManager.updateFooter();
    }
    
    // Registrar mudança de fase
    addActivityLog({
      type: 'phase',
      playerName: 'SISTEMA',
      action: 'Fase alterada',
      details: 'Ações → Negociação',
      turn: gameState.turn
    });
    
    this.showFeedback(`${currentPlayer.name} entrou na fase de negociação.`, 'info');
  }

  // Enviar porposta de negociação
  async handleSendNegotiation() {
    console.log('🔄 Iniciando envio de proposta de negociação');
    
    const player = getCurrentPlayer();
    const negotiationState = getNegotiationState();
    console.log('Estado da negociação:', negotiationState);
    
    // Verificações básicas
    if (gameState.currentPhase !== 'negociacao') {
      console.log('❌ Fase incorreta:', gameState.currentPhase);
      this.showFeedback('Negociação só é permitida na fase de Negociação.', 'warning');
      return false;
    }
    
    if (gameState.actionsLeft <= 0) {
      console.log('❌ Sem ações restantes');
      this.showFeedback('Sem ações restantes para negociar.', 'warning');
      return false;
    }
    
    if (player.resources.ouro < 1) {
      console.log('❌ Sem ouro suficiente');
      this.showFeedback('Você precisa de 1 Ouro para negociar.', 'error');
      return false;
    }
    
    if (!negotiationState.targetPlayerId) {
       console.log('❌ Alvo não definido');
      this.showFeedback('Selecione um jogador alvo.', 'error');
      return false;
    }
    
    const targetPlayer = gameState.players.find(p => p.id === negotiationState.targetPlayerId);
    if (!targetPlayer) {
      this.showFeedback('Jogador alvo inválido.', 'error');
      return false;
    }
    
    // Validar proposta usando o estado atual
    console.log('Validando estado de negociação:', negotiationState);
    const isValid = validateNegotiationState();
    
    if (!isValid) {
      const errors = getNegotiationValidationErrors();
      const errorMessage = errors.length > 0 ? errors[0] : 'Proposta inválida';
      this.showFeedback(errorMessage, 'error');
      return false;
    }
    
    // Confirmar envio
    const confirm = await this.showConfirm(
      'Enviar Proposta',
      `Enviar proposta para ${targetPlayer.name}?\n\nA proposta será enviada e aguardará resposta.`
    );
    
    if (!confirm) {
      console.log('Usuário cancelou envio');
      return false;
    }
    
    // CONSUMIR AÇÃO E OURO APENAS AQUI
    console.log('Consumindo ação e ouro para negociação');
    
    // Consumir ação
    if (!this.performAction('negociar')) {
      this.showFeedback('Erro ao consumir ação.', 'error');
      return false;
    }
    
    // Consumir ouro
    player.resources.ouro -= 1;
    
    // Criar objeto de negociação com ID único
    const negotiation = {
      id: 'neg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      initiatorId: player.id,
      targetId: targetPlayer.id,
      offer: {
        madeira: negotiationState.offer.madeira || 0,
        pedra: negotiationState.offer.pedra || 0,
        ouro: negotiationState.offer.ouro || 0,
        agua: negotiationState.offer.agua || 0,
        regions: negotiationState.offerRegions || []
      },
      request: {
        madeira: negotiationState.request.madeira || 0,
        pedra: negotiationState.request.pedra || 0,
        ouro: negotiationState.request.ouro || 0,
        agua: negotiationState.request.agua || 0,
        regions: negotiationState.requestRegions || []
      },
      timestamp: Date.now(),
      turn: gameState.turn,
      status: 'pending'
    };
    
    console.log('Proposta criada:', negotiation);
    
    // Adicionar à lista de propostas pendentes
    try {
      addPendingNegotiation(negotiation);
      console.log('Proposta adicionada às pendentes');
    } catch (error) {
      console.error('Erro ao adicionar proposta pendente:', error);
      this.showFeedback('Erro ao enviar proposta.', 'error');
      return false;
    }
    
    // Fechar modal de criação
    if (window.uiManager && window.uiManager.negotiation && window.uiManager.negotiation.closeNegotiationModal) {
      window.uiManager.negotiation.closeNegotiationModal();
    } else {
      // Fallback
      const modal = document.getElementById('negotiationModal');
      if (modal) modal.classList.add('hidden');
      document.body.classList.remove('modal-active');
    }
    
    // Resetar estado da negociação
    resetNegotiationState();
    
    // Mostrar notificação para o destinatário
    if (window.uiManager && window.uiManager.negotiation && window.uiManager.negotiation.showNegotiationNotification) {
      setTimeout(() => {
        window.uiManager.negotiation.showNegotiationNotification(negotiation);
      }, 500);
    }
    
    // Registrar envio no log
    addActivityLog({
      type: 'negotiate',
      playerName: player.name,
      action: 'enviou proposta para',
      details: `${targetPlayer.name}`,
      turn: gameState.turn
    });
    
    // Mostrar feedback para o remetente
    this.showFeedback(`✅ Proposta enviada para ${targetPlayer.name}! Aguardando resposta.`, 'success');
    
    // Atualizar UI
    if (window.uiManager) {
      window.uiManager.updateUI();
      window.uiManager.updateFooter();
    }
    
    // Atualizar conquistas
    achievementsState.totalNegotiations++;
    if (achievementsState.playerAchievements[player.id]) {
      achievementsState.playerAchievements[player.id].negotiated = 
        (achievementsState.playerAchievements[player.id].negotiated || 0) + 1;
    }
    
    console.log('✅ Proposta enviada com sucesso!');
    return true;
  }

  // MÉTODOS DE RESPOSTA NEGOCIAÇÃO

  async handleNegResponse(accepted) {
    console.log('handleNegResponse chamado com:', accepted);
    
    const negotiation = gameState.activeNegotiation;
    
    if (!negotiation) {
      console.log('Nenhuma negociação ativa encontrada');
      this.showFeedback('Nenhuma negociação ativa para responder.', 'error');
      return;
    }
    
    const initiator = gameState.players[negotiation.initiatorId];
    const target = gameState.players[negotiation.targetId];
    const currentPlayer = getCurrentPlayer();
    
    console.log('Detalhes da negociação:', {
      initiator: initiator?.name,
      target: target?.name,
      currentPlayer: currentPlayer?.name,
      negotiationId: negotiation.id
    });
    
    // Verificar se é o jogador correto respondendo
    if (currentPlayer.id !== target.id) {
      console.log('Jogador incorreto tentando responder:', currentPlayer.name);
      this.showFeedback('Apenas o destinatário pode responder a esta proposta.', 'error');
      return;
    }
    
    if (accepted) {
      console.log('Aceitando negociação:', negotiation.id);
      
      // Validar novamente antes de executar
      const canExecute = this.validateNegotiationBeforeExecution(negotiation);
      if (!canExecute.valid) {
        this.showFeedback(canExecute.message, 'error');
        return;
      }
      
      // Executar a negociação
      const success = this.executeNegotiation(negotiation);
      
      if (success) {
        console.log('Negociação executada com sucesso');
        
        // Atualizar status da negociação
        updateNegotiationStatus(negotiation.id, 'accepted');
        
        // Registrar aceitação no log
        addActivityLog({
          type: 'negotiate',
          playerName: target.name,
          action: 'aceitou proposta de',
          details: `${initiator.name}`,
          turn: gameState.turn,
          isEvent: false,
          isMine: true
        });
        
        // Log para o iniciador também
        addActivityLog({
          type: 'negotiate', 
          playerName: initiator.name,
          action: 'teve proposta aceita por',
          details: `${target.name}`,
          turn: gameState.turn,
          isEvent: false,
          isMine: (initiator.id === gameState.currentPlayerIndex)
        });
        
        this.showFeedback(`✅ Proposta aceita! Troca realizada com sucesso. +1 PV para ambos.`, 'success');
      } else {
        this.showFeedback('Erro ao processar a negociação.', 'error');
        // Não remover a negociação se houve erro
        return;
      }
    } else {
      console.log('Recusando negociação:', negotiation.id);
      
      // Atualizar status da negociação
      updateNegotiationStatus(negotiation.id, 'rejected');
      
      // Registrar recusa no log
      addActivityLog({
        type: 'negotiate',
        playerName: target.name,
        action: 'recusou proposta de',
        details: `${initiator.name}`,
        turn: gameState.turn,
        isEvent: false,
        isMine: true
      });
      
      this.showFeedback('❌ Proposta recusada.', 'info');
    }
    
  // Fechar modal
  if (window.uiManager && window.uiManager.negotiation) {
    window.uiManager.negotiation.closeNegResponseModal();
  } else {
    // Fallback manual
    const modal = document.getElementById('negResponseModal');
    if (modal) modal.classList.add('hidden');
    
    // Garantir que o modo modal seja desativado
    if (window.uiManager && window.uiManager.setModalMode) {
      window.uiManager.setModalMode(false);
    }
  }
    
    // Remover da lista de pendentes
    removePendingNegotiation(negotiation.id);
    
    // Limpar negociação ativa
    clearActiveNegotiation();
    
    console.log('Negociação processada, estado atual:', {
      activeNegotiation: gameState.activeNegotiation,
      pendingCount: gameState.pendingNegotiations?.length || 0
    });
    
    // Atualizar UI
    if (window.uiManager) {
      setTimeout(() => {
        window.uiManager.updateUI();
        window.uiManager.updateFooter();
      }, 300);
    }
  }

  // =============== MÉTODOS AUXILIARES PARA NEGOCIAÇÃO ====================

  validateNegotiationBeforeExecution(negotiation) {
    const initiator = gameState.players[negotiation.initiatorId];
    const target = gameState.players[negotiation.targetId];
    
    if (!initiator || !target) {
      return { valid: false, message: 'Jogadores não encontrados.' };
    }
    
    // Verificar recursos do iniciador
    const initiatorResourcesValid = ['madeira', 'pedra', 'ouro', 'agua'].every(k => 
      (negotiation.offer[k] || 0) <= (initiator.resources[k] || 0)
    );
    
    if (!initiatorResourcesValid) {
      return { valid: false, message: 'O iniciador não possui mais os recursos oferecidos.' };
    }
    
    // Verificar regiões do iniciador
    const initiatorRegionsValid = negotiation.offer.regions.every(rid => 
      initiator.regions.includes(rid)
    );
    
    if (!initiatorRegionsValid) {
      return { valid: false, message: 'O iniciador não controla mais as regiões oferecidas.' };
    }
    
    // Verificar recursos do alvo
    const targetResourcesValid = ['madeira', 'pedra', 'ouro', 'agua'].every(k => 
      (negotiation.request[k] || 0) <= (target.resources[k] || 0)
    );
    
    if (!targetResourcesValid) {
      return { valid: false, message: 'O alvo não possui mais os recursos solicitados.' };
    }
    
    // Verificar regiões do alvo
    const targetRegionsValid = negotiation.request.regions.every(rid => 
      target.regions.includes(rid)
    );
    
    if (!targetRegionsValid) {
      return { valid: false, message: 'O alvo não controla mais as regiões solicitadas.' };
    }
    
    return { valid: true, message: 'Negociação válida.' };
  }

  // Método auxiliar para mostrar proposta atual
  showActiveNegotiation() {
    const negotiation = gameState.activeNegotiation;
    if (!negotiation || !window.uiManager) return;
    
    if (window.uiManager.negotiation && window.uiManager.negotiation.presentNegotiationToTarget) {
      window.uiManager.negotiation.presentNegotiationToTarget(negotiation);
    }
  }

  validateNegotiationOffer(offer, player) {
    const sufficientResources = ['madeira','pedra','ouro','agua'].every(k => offer[k] <= player.resources[k]);
    const ownsAllRegions = offer.regions.every(rid => player.regions.includes(rid));
    
    if (!sufficientResources) return 'Você não possui os recursos que está oferecendo.';
    if (!ownsAllRegions) return 'Você não controla todas as regiões que está oferecendo.';
    return null;
  }

  executeNegotiation(negotiation) {
    try {
      console.log('Executando negociação:', negotiation.id);
      
      const initiator = gameState.players[negotiation.initiatorId];
      const target = gameState.players[negotiation.targetId];
      
      if (!initiator || !target) {
        console.error('Jogadores não encontrados');
        return false;
      }
      
      // Transferir recursos do iniciador para o alvo
      ['madeira', 'pedra', 'ouro', 'agua'].forEach(k => {
        const offerAmt = negotiation.offer[k] || 0;
        const reqAmt = negotiation.request[k] || 0;
        
        // Iniciador dá, alvo recebe
        if (offerAmt > 0) {
          initiator.resources[k] -= offerAmt;
          target.resources[k] += offerAmt;
          console.log(`Recurso ${k}: ${initiator.name} -> ${target.name}: ${offerAmt}`);
        }
        
        // Alvo dá, iniciador recebe
        if (reqAmt > 0) {
          target.resources[k] -= reqAmt;
          initiator.resources[k] += reqAmt;
          console.log(`Recurso ${k}: ${target.name} -> ${initiator.name}: ${reqAmt}`);
        }
      });
      
      // Transferir regiões oferecidas
      if (negotiation.offer.regions && negotiation.offer.regions.length > 0) {
        negotiation.offer.regions.forEach(regionId => {
          // Remover do iniciador
          initiator.regions = initiator.regions.filter(id => id !== regionId);
          // Adicionar ao alvo
          if (!target.regions.includes(regionId)) {
            target.regions.push(regionId);
          }
          // Atualizar controlador da região
          updateRegionController(regionId, target.id);
          console.log(`Região ${regionId}: ${initiator.name} -> ${target.name}`);
        });
      }
      
      // Transferir regiões solicitadas
      if (negotiation.request.regions && negotiation.request.regions.length > 0) {
        negotiation.request.regions.forEach(regionId => {
          // Remover do alvo
          target.regions = target.regions.filter(id => id !== regionId);
          // Adicionar ao iniciador
          if (!initiator.regions.includes(regionId)) {
            initiator.regions.push(regionId);
          }
          // Atualizar controlador da região
          updateRegionController(regionId, initiator.id);
          console.log(`Região ${regionId}: ${target.name} -> ${initiator.name}`);
        });
      }
      
      // Pontos de vitória para ambos
      initiator.victoryPoints += 1;
      target.victoryPoints += 1;
      console.log(`PV: ${initiator.name} +1, ${target.name} +1`);
      
      // Atualizar conquistas
      achievementsState.totalNegotiations++;
      
      // Atualizar estatísticas por jogador
      if (achievementsState.playerAchievements) {
        if (achievementsState.playerAchievements[initiator.id]) {
          achievementsState.playerAchievements[initiator.id].negotiated = 
            (achievementsState.playerAchievements[initiator.id].negotiated || 0) + 1;
        }
        if (achievementsState.playerAchievements[target.id]) {
          achievementsState.playerAchievements[target.id].negotiated = 
            (achievementsState.playerAchievements[target.id].negotiated || 0) + 1;
        }
      }
      
      console.log('Negociação executada com sucesso');
      return true;
      
    } catch (error) {
      console.error('Erro ao executar negociação:', error);
      return false;
    }
  }

  // ==================== SISTEMA DE TURNOS ====================

  // Função que gerencia fases corretamente
  async handleEndTurn() {
    console.log('handleEndTurn chamado. Fase atual:', gameState.currentPhase);
    const currentPlayer = getCurrentPlayer();
    
    // Verificar se há propostas pendentes não respondidas
    const pendingNegotiations = getPendingNegotiationsForPlayer(currentPlayer.id);
    if (pendingNegotiations.length > 0 && gameState.currentPhase === 'negociacao') {
      const confirm = await this.showConfirm(
        'Propostas Pendentes',
        `Você tem ${pendingNegotiations.length} proposta(s) de negociação pendente(s).\nDeseja visualizá-las antes de terminar o turno?`
      );
      
      if (confirm && window.uiManager && window.uiManager.negotiation) {
        window.uiManager.negotiation.showPendingNegotiationsModal();
        return; // Não terminar turno ainda
      }
    }
    
    // Se estiver na fase de ações, avance para negociação
    if (gameState.currentPhase === 'acoes') {
      console.log('Avançando de Ações para Negociação');
      // Avançar para negociação
      this.setupNegotiationPhase();
      return;
    }
    
    // Se estiver na fase de negociação, termine o turno
    if (gameState.currentPhase === 'negociacao') {
      console.log('Finalizando turno na fase de Negociação');
      // Registrar término do turno
      addActivityLog({
        type: 'turn',
        playerName: 'SISTEMA',
        action: 'Turno finalizado',
        details: `${currentPlayer.name} completou o turno`,
        turn: gameState.turn
      });
      
      // Avançar jogador
      const playerCount = gameState.players.length;
      gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % playerCount;
      
      // Se voltou ao primeiro jogador, incrementa o turno
      if (gameState.currentPlayerIndex === 0) {
        gameState.turn += 1;
        this.handleTurnAdvanceForEvents();
      }
      
      // Resetar estado para novo jogador
      gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
      gameState.selectedRegionId = null;
      gameState.currentPhase = 'renda';
      
      // Atualizar sidebar para o jogador atual
      gameState.selectedPlayerForSidebar = gameState.currentPlayerIndex;
      
      // Aplicar renda para o novo jogador
      const newPlayer = getCurrentPlayer();
      this.applyIncomeForPlayer(newPlayer);
      
      // Log CORRIGIDO:
      addActivityLog({
        type: 'turn',
        playerName: 'SISTEMA',
        action: 'Turno iniciado',
        details: `Turno de ${newPlayer.name} começou`,
        turn: gameState.turn
      });
      
      this.checkVictory();
      
      // Forçar atualização da UI
      if (window.uiManager) {
        window.uiManager.updateUI();
      }
      
      this.showFeedback(`Agora é o turno de ${newPlayer.name}`, 'info');
    } else {
      // Se estiver na fase de renda, avisar para aguardar
      this.showFeedback('Aguarde a fase de renda terminar...', 'info');
    }
  }

  // Configura as regiões no mapa
  setupRegions() {
    gameState.regions = [];
    const total = GAME_CONFIG.GRID_SIZE * GAME_CONFIG.GRID_SIZE;
    
    for (let i = 0; i < total; i++) {
      const biome = GAME_CONFIG.BIOMES[Math.floor(Math.random() * GAME_CONFIG.BIOMES.length)];
      const resources = this.generateResourcesForBiome(biome);
      
      gameState.regions.push({
        id: i,
        name: GAME_CONFIG.REGION_NAMES[i],
        biome,
        explorationLevel: Math.floor(Math.random() * 2),
        resources,
        controller: null,
        structures: []
      });
    }
  }

  handleTurnAdvanceForEvents() {
    // Atualizar duração do evento atual
    if (gameState.currentEvent && gameState.eventTurnsLeft > 0) {
      gameState.eventTurnsLeft -= 1;
      if (gameState.eventTurnsLeft <= 0) {
        if (typeof gameState.currentEvent.remove === 'function') {
          gameState.currentEvent.remove(gameState);
        }
        gameState.currentEvent = null;
        gameState.eventModifiers = {};
        this.showFeedback('O evento global terminou.', 'info');
      }
    }

    // Contar até o próximo evento
    if (!gameState.currentEvent) {
      gameState.turnsUntilNextEvent -= 1;
      if (gameState.turnsUntilNextEvent <= 0) {
        this.triggerRandomEvent();
        gameState.turnsUntilNextEvent = 4;
      }
    }
  }

  canAffordAction(actionType) {
    const player = gameState.players[gameState.currentPlayerIndex];
    const cost = GAME_CONFIG.ACTION_DETAILS[actionType]?.cost || {};
    
    return Object.entries(cost).every(([resource, amount]) => {
      return (player.resources[resource] || 0) >= amount;
    });
  }

  // ==================== RENDA AUTOMÁTICA ====================

  applyIncomeForPlayer(player) {
  const bonuses = { madeira: 0, pedra: 0, ouro: 0, agua: 0, pv: 0 };
  
  player.regions.forEach(regionId => {
    const region = gameState.regions[regionId];
    if (!region) return;
    
    // Produção base por bioma (valores inteiros)
    let biomeProd = { madeira: 0, pedra: 0, ouro: 0, agua: 0 };
    
    switch(region.biome) {
      case 'Floresta Tropical':
        biomeProd.madeira = 1;
        biomeProd.agua = 1;
        break;
      case 'Floresta Temperada':
        biomeProd.madeira = 1;
        biomeProd.pedra = 0;
        break;
      case 'Savana':
        biomeProd.ouro = 1;
        biomeProd.agua = 0;
        break;
      case 'Pântano':
        biomeProd.agua = 2;
        biomeProd.pedra = 1;
        break;
    }
      
      // Multiplicadores de eventos
      if (gameState.eventModifiers.madeiraMultiplier) {
        biomeProd.madeira *= gameState.eventModifiers.madeiraMultiplier;
      }
      if (gameState.eventModifiers.aguaMultiplier) {
        biomeProd.agua *= gameState.eventModifiers.aguaMultiplier;
      }
      if (gameState.eventModifiers.pedraMultiplier) {
        biomeProd.pedra *= gameState.eventModifiers.pedraMultiplier;
      }
      
      // Bloquear savanas se evento ativo
      if (gameState.eventModifiers.savanaBloqueada && region.biome === 'Savana') {
        biomeProd = { madeira: 0, pedra: 0, ouro: 0, agua: 0 };
      }
      
      // Bônus de pântano em enchente
      if (gameState.eventModifiers.pantanoBonus && region.biome === 'Pântano') {
        biomeProd.agua *= gameState.eventModifiers.pantanoBonus;
        biomeProd.pedra *= gameState.eventModifiers.pantanoBonus;
      }
      
      // Bônus de savana (descoberta de jazida)
      if (gameState.eventModifiers.savanaBonus && region.biome === 'Savana') {
        biomeProd.ouro += gameState.eventModifiers.savanaBonus;
      }
      
      // Bônus de exploração
      const explLevel = region.explorationLevel || 0;
      let explMultiplier = 1.0;
      
      switch(explLevel) {
        case 1:
          explMultiplier = 1.25;
          break;
        case 2:
          explMultiplier = 1.50;
          // 20% chance de +1 Ouro
          if (Math.random() < 0.20) {
            bonuses.ouro += 1;
          }
          break;
        case 3:
          explMultiplier = 2.00;
          break;
      }
      
      // Aplicar multiplicador de exploração (convertendo para inteiro)
    Object.keys(biomeProd).forEach(k => {
      biomeProd[k] = Math.floor(biomeProd[k] * explMultiplier);
    });
    
    // Acumular bônus
    Object.keys(biomeProd).forEach(k => {
      bonuses[k] += biomeProd[k];
    });
    
    // Produção de estruturas (valores inteiros)
    if (!gameState.eventModifiers.structuresDisabled && region.structures && region.structures.length > 0) {
      region.structures.forEach(struct => {
        if (struct === 'Abrigo') {
          bonuses.madeira += 1;
          bonuses.agua += 1;
        } else if (struct === 'Mercado') {
          bonuses.ouro += 1;
        } else if (struct === 'Laboratório') {
          bonuses.ouro += 1;
        } else if (struct === 'Torre de Vigia') {
          bonuses.pv += 1;
        } else if (struct === 'Santuário') {
          bonuses.pv += 1;
        }
      });
    }
  });
  
  // Aplicar bônus ao jogador (já são inteiros)
  Object.keys(bonuses).forEach(k => {
    if (k !== 'pv') {
      player.resources[k] = (player.resources[k] || 0) + bonuses[k];
    } else {
      player.victoryPoints += bonuses[k];
    }
  });
    
    // IMPORTANTE: Mostrar modal de renda apenas se for o jogador atual E estiver na fase de renda
    if (player.id === gameState.currentPlayerIndex && gameState.currentPhase === 'renda') {
      console.log('Mostrando modal de renda para:', player.name);
      
      // Resetar tentativas
      this.incomeModalAttempts = 0;
      
      // Tentar mostrar a modal com retry
      this.tryShowIncomeModal(player, bonuses);
    }
    
    return bonuses;
  }

  // Método para tentar mostrar a modal com retry
  tryShowIncomeModal(player, bonuses) {
    if (this.incomeModalAttempts >= 5) {
      console.error('Falha ao mostrar modal de renda após 5 tentativas');
      // Fallback: mostrar feedback simples
      this.showFeedback(`${player.name} recebeu renda. Iniciando ações.`, 'info');
      
      // Avançar para fase de ações mesmo sem modal
      gameState.currentPhase = 'acoes';
      gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
      
      setTimeout(() => {
        if (window.uiManager) {
          window.uiManager.updateUI();
          window.uiManager.updateFooter();
        }
      }, 50);
      
      addActivityLog({
        type: 'phase',
        playerName: player.name,
        action: 'iniciou fase de ações',
        details: '',
        turn: gameState.turn
      });
      
      return;
    }
    
    // Pequeno delay para garantir que a UI esteja pronta
    setTimeout(() => {
      if (window.uiManager && window.uiManager.modals && typeof window.uiManager.modals.showIncomeModal === 'function') {
        console.log('Modal de renda disponível, mostrando...');
        window.uiManager.modals.showIncomeModal(player, bonuses);
      } else {
        console.log(`Tentativa ${this.incomeModalAttempts + 1}: uiManager ou showIncomeModal não disponível, tentando novamente...`);
        this.incomeModalAttempts++;
        this.tryShowIncomeModal(player, bonuses);
      }
    }, 300 + (this.incomeModalAttempts * 200)); // Aumenta o delay a cada tentativa
  }

  // Inicia a fase de renda  
  startIncomePhase() {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return;
    
    console.log('Iniciando fase de renda para:', currentPlayer.name);
    
    // Garantir que estamos na fase de renda
    gameState.currentPhase = 'renda';
    
    // Aplicar renda (que mostrará a modal)
    this.applyIncomeForPlayer(currentPlayer);
  }

  // ==================== EVENTOS ALEATÓRIOS ====================

  triggerRandomEvent() {
    if (!this.GAME_EVENTS || this.GAME_EVENTS.length === 0) return;
    
    const ev = this.GAME_EVENTS[Math.floor(Math.random() * this.GAME_EVENTS.length)];
    
    // Se o evento for instantâneo
    if (ev.duration === 1) {
      ev.apply(gameState);
      gameState.currentEvent = null;
      gameState.eventTurnsLeft = 0;
      return;
    }

    // Reset modifiers anteriores
    if (gameState.currentEvent && typeof gameState.currentEvent.remove === 'function') {
      gameState.currentEvent.remove(gameState);
    }

    gameState.currentEvent = ev;
    gameState.eventTurnsLeft = ev.duration;
    gameState.eventModifiers = {};
    
    // Aplica modificadores
    if (typeof ev.apply === 'function') {
      ev.apply(gameState);
    }

    addActivityLog({
      type: 'event',
      playerName: 'GAIA',
      action: `disparou evento: ${ev.name}`,
      details: ev.description,
      turn: gameState.turn
    });
    
    // Mostrar feedback sobre o evento
    this.showFeedback(`Evento global: ${ev.name}`, 'info');
  }

  // ==================== UTILITÁRIOS ====================

  clearRegionSelection() {
    gameState.selectedRegionId = null;
  }

  checkVictory() {
    const winner = gameState.players.find(p => p.victoryPoints >= GAME_CONFIG.VICTORY_POINTS);
    if (winner) {
      this.showFeedback(`${winner.name} venceu o jogo!`, 'success');
      
      // Atualizar conquistas
      achievementsState.wins++;
      setAchievementsState(achievementsState);
      
      addActivityLog({
        type: 'victory',
        playerName: winner.name,
        action: 'venceu o jogo!',
        details: `${winner.victoryPoints} PV`,
        turn: gameState.turn
      });
    }
  }

  // Função auxiliar para bloquear ações quando modal está aberta
  preventActionIfModalOpen() {
    // Verificar se há modal de negociação aberta
    const negotiationModal = document.getElementById('negotiationModal');
    const negResponseModal = document.getElementById('negResponseModal');
    
    if ((negotiationModal && !negotiationModal.classList.contains('hidden')) ||
        (negResponseModal && !negResponseModal.classList.contains('hidden'))) {
      console.log('Evento bloqueado - modal de negociação aberta');
      return true;
    }
    return false;
  }

  // Métodos auxiliares de UI (para compatibilidade)
  showFeedback(message, type = 'info') {
    if (window.uiManager && window.uiManager.modals && typeof window.uiManager.modals.showFeedback === 'function') {
      window.uiManager.modals.showFeedback(message, type);
    } else {
      // Fallback simples
      console.log(`${type}: ${message}`);
      alert(`${type.toUpperCase()}: ${message}`);
    }
  }

  async showConfirm(title, message) {
    if (window.uiManager && window.uiManager.modals && typeof window.uiManager.modals.showConfirm === 'function') {
      return await window.uiManager.modals.showConfirm(title, message);
    } else {
      // Fallback simples
      return confirm(`${title}\n\n${message}`);
    }
  }

// NO FINAL DA CLASSE, ADICIONE:
  autoSave() {
    if (gameState?.gameStarted) {
      saveGame();
    }
  }
}

export { GameLogic };
