/*
    Conteúdo refatorado do arquivo main.js, aplicando a Fase 1 e Correções (1-5):
    
    Implementação da Fase 2: Experiência do Usuário (UX/UI)
    - 2.1 UX: Detalhes da Região (Pop-up flutuante)
    - 2.2 UX: Custos e Ganhos Visíveis (Tooltips)
    - 2.3 Alerta de Vitória (Modal de Fim de Jogo)

    Implementação da Fase 3.1: Revisão da Lógica de Negociação (Parte 2)
    - Seleção de quantidades exatas para oferta e pedido.
    - Modal para alvo aceitar/recusar.
    - Mitigação de recusa (+1 Madeira).
*/

// ==================== CONFIGURAÇÕES E ESTADO DO JOGO ====================
const GAME_CONFIG = {
    GRID_SIZE: 5,
    INITIAL_RESOURCES: { madeira: 10, pedra: 5, ouro: 3, agua: 5 },
    VICTORY_POINTS: 25,
    BIOMES: ['Floresta Tropical', 'Floresta Temperada', 'Savana', 'Pântano'],
    REGION_NAMES: [
        'Região A', 'Região B', 'Região C', 'Região D', 'Região E',
        'Região F', 'Região G', 'Região H', 'Região I', 'Região J',
        'Região K', 'Região L', 'Região M', 'Região N', 'Região O',
        'Região P', 'Região Q', 'Região R', 'Região S', 'Região T',
        'Região U', 'Região V', 'Região W', 'Região X', 'Região Y'
    ],
    PLAYER_COLORS: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'],
    PLAYER_ICONS: ['🦁', '🐯', '🐻', '🦊', '🐺', '🦅', '🐉', '🦈'],
    
    // === CONFIGURAÇÕES DA FASE 1 ===
    ALL_BIOMES: ['Floresta Tropical', 'Floresta Temperada', 'Savana', 'Pântano'], 
    DIVERSITY_BONUS_PV: 3, 

    STRUCTURE_TYPES: {
        'POSTO_AVANCADO': {
            name: 'Posto Avançado',
            description: 'Aumenta a produção base do bioma em +1. Requer Nível de Exploração 1.',
            cost: { madeira: 3, pedra: 2, agua: 1, ouro: 0 },
            pv_gain: 2, 
            production_boost: 1, 
            bonus_per_turn: { pv: 0, madeira: 0, pedra: 0, ouro: 0, agua: 0 }
        },
        'EDIFICIO_PRINCIPAL': {
            name: 'Edifício Principal',
            description: 'Concede alto PV inicial e +1 PV recorrente por turno. Requer Nível de Exploração 2.',
            cost: { madeira: 5, pedra: 5, ouro: 2, agua: 2 },
            pv_gain: 5,
            production_boost: 0,
            bonus_per_turn: { pv: 1 } 
        },
        'CAMPO_CULTIVO': {
            name: 'Campo de Cultivo',
            description: 'Focado em produção, concede +1 Água e +1 Madeira por turno. Requer Nível de Exploração 1.',
            cost: { madeira: 2, pedra: 0, agua: 2, ouro: 0 },
            pv_gain: 1,
            production_boost: 0,
            bonus_per_turn: { agua: 1, madeira: 1 }
        }
    },

    BIOME_BONUSES: {
        'Floresta Tropical': 'madeira',
        'Floresta Temperada': 'madeira',
        'Savana': 'ouro',
        'Pântano': 'pedra'
    },
    
    // NOVO: DETALHES DE AÇÃO PARA TOOLTIPS (Fase 2.2)
    ACTION_DETAILS: {
        explorar: {
            cost: { madeira: 2, agua: 1 },
            effect: 'Aumenta Nível de Exploração (+1 Renda de Bioma) e concede **1 PV**. Requer Região Própria não explorada.',
        },
        construir: {
            cost: { /* Varia por estrutura */ },
            effect: 'Abre o painel de construção. Custo e bônus variam por estrutura. Requer Região Própria explorada.',
        },
        recolher: {
            cost: { madeira: 1 },
            effect: 'Ganha: +2 Madeira, +2 Pedra, +2 Água, **+1 PV**. Custo: 1 Madeira. (Ação Geral)',
        },
        negociar: {
            cost: { ouro: 1 },
            effect: 'Abre o painel de negociação. Troca de recurso com outro jogador **+1 PV para ambos se aceita**. Custo: 1 Ouro. (Ação Geral)',
        },
    }
};

// ==================== ESTADO DO JOGO ====================
let gameState = {
    players: [],
    regions: [],
    currentPlayerIndex: 0,
    selectedPlayerForResources: 0, 
    turn: 0,
    gameStarted: false,
    selectedRegion: null,
    selectedAction: null,
    negotiationInProgress: false,
    gameOver: false, // NOVO (Fase 2.3)
    
    // Regra 2: Limite de Ações
    actionsTaken: [], 
    actionsLimit: 2,

    // NOVO para Fase 3.1: Proposta de negociação
    proposal: null,
};

// ==================== ELEMENTOS DA UI ====================
const gameMapEl = document.getElementById('gameMap');
const regionDetailsPopupEl = document.getElementById('regionDetailsPopup'); // NOVO (Fase 2.1)

// ==================== FUNÇÕES AUXILIARES ====================
function showFeedback(message, type) {
    const feedbackEl = document.getElementById('feedbackMessage');
    feedbackEl.textContent = message;
    feedbackEl.className = `show ${type}`;
    setTimeout(() => {
        feedbackEl.classList.remove('show');
    }, 3000);
}

function checkCosts(player, costs) {
    for (const resource in costs) {
        if (player.resources[resource] < costs[resource]) {
            return false;
        }
    }
    return true;
}

function consumeResources(player, costs) {
    for (const resource in costs) {
        player.resources[resource] -= costs[resource];
    }
}

// ==================== INICIALIZAÇÃO ====================
function initializeGame() {
    gameState.players.forEach(p => p.consecutiveNoActionTurns = 0);
    createRegions();
    distributeRegions();
    updateDisplay();
    // NOVO: Renderiza o manual de estruturas na inicialização (UX)
    renderStructuresManual();
}

function createRegions() {
    gameState.regions = [];
    for (let i = 0; i < GAME_CONFIG.GRID_SIZE * GAME_CONFIG.GRID_SIZE; i++) {
        // Encontra um nome de região disponível
        let regionName = GAME_CONFIG.REGION_NAMES[i];
        
        // Atribui um bioma aleatório
        let biome = GAME_CONFIG.BIOMES[Math.floor(Math.random() * GAME_CONFIG.BIOMES.length)];

        gameState.regions.push({
            id: i,
            name: regionName,
            biome: biome,
            controller: null,
            explorationLevel: 0,
            structures: []
        });
    }
}

function distributeRegions() {
    const totalRegions = GAME_CONFIG.GRID_SIZE * GAME_CONFIG.GRID_SIZE;
    const regionsPerPlayer = Math.floor(totalRegions / gameState.players.length);
    let regionIndex = 0;
    
    // Embaralha o array de regiões para distribuição mais justa
    const shuffledRegions = [...Array(totalRegions).keys()].sort(() => Math.random() - 0.5);

    for (let i = 0; i < gameState.players.length; i++) {
        gameState.players[i].regions = [];
        
        for (let j = 0; j < regionsPerPlayer; j++) {
            if (regionIndex < totalRegions) {
                const regionId = shuffledRegions[regionIndex];
                gameState.regions[regionId].controller = i;
                gameState.players[i].regions.push(regionId);
                regionIndex++;
            }
        }
    }
    // As regiões restantes ficam descontroladas (controller: null)
}

// ==================== GERENCIAMENTO DE JOGADORES ====================
function addPlayer(name, icon) {
    if (gameState.players.length >= 4) {
        showFeedback('Máximo de 4 jogadores!', 'error');
        return false;
    }
    
    // Garante que a cor e o ícone não se repitam
    const usedColors = gameState.players.map(p => p.color);
    const availableColors = GAME_CONFIG.PLAYER_COLORS.filter(c => !usedColors.includes(c));
    const color = availableColors[0] || GAME_CONFIG.PLAYER_COLORS[gameState.players.length];

    gameState.players.push({
        id: gameState.players.length,
        name: name,
        icon: icon,
        color: color,
        resources: { ...GAME_CONFIG.INITIAL_RESOURCES },
        victoryPoints: 0,
        structures: 0,
        hasDiversityBonus: false,
        consecutiveNoActionTurns: 0 
    });
    
    updatePlayerCountDisplay();
    return true;
}

function updatePlayerCountDisplay() {
    document.getElementById('playerCountDisplay').textContent = 
        `${gameState.players.length}/4 Jogadores Registrados`;
    
    const startBtn = document.getElementById('startGameBtn');
    startBtn.disabled = gameState.players.length < 2;
}

// ==================== FLUXO DO TURNO ====================

function startTurn() {
    if (gameState.gameOver) return; // NOVO: Não inicia turno se o jogo acabou
    
    const player = gameState.players[gameState.currentPlayerIndex];
    
    // Regra 3: Suspensão de renda base por inatividade
    const baseIncomeSuspended = player.consecutiveNoActionTurns >= 3;
    
    applyAutomaticIncome(player, baseIncomeSuspended);
    
    // Resetar estado de turno
    gameState.actionsTaken = [];
    gameState.selectedRegion = null;
    gameState.selectedAction = null;
    
    // Mensagem de início de turno
    if (baseIncomeSuspended) {
         showFeedback(`${player.icon} ${player.name}'s Turno! (Renda Base Suspensa por Inatividade)`, 'warning');
    } else {
         showFeedback(`${player.icon} ${player.name}'s Turno!`, 'info');
    }
    
    updateDisplay();
}

function applyAutomaticIncome(player, baseIncomeSuspended) {
    const totalIncome = {};
    
    // 1. Renda Base + Bônus de Bioma + Bônus de Exploração/Estrutura
    player.regions.forEach(regionId => {
        const region = gameState.regions[regionId];
        const resourceType = GAME_CONFIG.BIOME_BONUSES[region.biome];
        
        if (resourceType) {
            let income = 0;
            
            // Renda Base (suspensa se passiva > 2)
            if (!baseIncomeSuspended) {
                income += 1;
            }
            
            // Bônus de Exploração (Não suspenso)
            income += region.explorationLevel; 
            
            // Bônus de Produção de Estruturas (Não suspenso)
            region.structures.forEach(structureEntry => {
                const structure = GAME_CONFIG.STRUCTURE_TYPES[structureEntry.type];
                income += structure.production_boost;
            });
            
            if (income > 0) {
                // Arredonda para o inteiro mais próximo (ou use Math.floor/ceil dependendo da regra)
                player.resources[resourceType] += Math.round(income); 
                totalIncome[resourceType] = (totalIncome[resourceType] || 0) + Math.round(income);
            }
        }
        
        // 2. Renda Recorrente de Estruturas (PV ou outros recursos fixos) - Não suspenso
        region.structures.forEach(structureEntry => {
            const structure = GAME_CONFIG.STRUCTURE_TYPES[structureEntry.type];
            if (structure.bonus_per_turn) {
                for (const resource in structure.bonus_per_turn) {
                    const amount = structure.bonus_per_turn[resource];
                    if (amount > 0) {
                        if (resource === 'pv') {
                            player.victoryPoints += amount;
                            totalIncome['PV Recorrente'] = (totalIncome['PV Recorrente'] || 0) + amount;
                        } else if (player.resources.hasOwnProperty(resource)) {
                            player.resources[resource] += amount;
                            totalIncome[resource] = (totalIncome[resource] || 0) + amount;
                        }
                    }
                }
            }
        });
    });
    
    // 3. Checa Bônus de Diversidade
    const diversityPV = checkDiversityBonus(player);
    if (diversityPV > 0) {
        player.victoryPoints += diversityPV;
        totalIncome['PV Diversidade'] = (totalIncome['PV Diversidade'] || 0) + diversityPV;
    }
    
    let feedbackMsg = "Renda aplicada: ";
    // Converte totalIncome para uma string amigável
    const incomeParts = [];
    for (const res in totalIncome) {
        incomeParts.push(`${totalIncome[res]} ${res.toUpperCase()}`);
    }
    
    showFeedback(feedbackMsg + (incomeParts.join(', ') || "Nenhum ganho neste turno."), 'info');
}

// Checa o Bônus de Diversidade
function checkDiversityBonus(player) {
    if (player.hasDiversityBonus) return 0;
    
    const controlledBiomes = new Set();
    gameState.regions.forEach(region => {
        if (region.controller === player.id) {
            controlledBiomes.add(region.biome);
        }
    });

    if (controlledBiomes.size === GAME_CONFIG.ALL_BIOMES.length) {
        player.hasDiversityBonus = true;
        return GAME_CONFIG.DIVERSITY_BONUS_PV;
    }
    return 0;
}

function performAction(actionType) {
    if (gameState.gameOver) { // NOVO (Fase 2.3)
        showFeedback("O jogo acabou!", 'error');
        return;
    }
    
    const player = gameState.players[gameState.currentPlayerIndex];
    let actionSuccess = false;

    // Regra 2: Verifica limite de ações
    if (gameState.actionsTaken.length >= gameState.actionsLimit) {
        showFeedback(`Limite de ${gameState.actionsLimit} ações por turno atingido. Finalize seu turno.`, 'warning');
        return;
    }
    
    // Regra 2: Verifica se a ação já foi realizada
    if (gameState.actionsTaken.includes(actionType)) {
        showFeedback(`Ação "${actionType}" já realizada neste turno.`, 'warning');
        return;
    }

    switch (actionType) {
        case 'explorar':
            const region = gameState.regions[gameState.selectedRegion];
            if (region && region.controller === gameState.currentPlayerIndex && region.explorationLevel < 2) {
                const costs = GAME_CONFIG.ACTION_DETAILS.explorar.cost;
                if (checkCosts(player, costs)) {
                    consumeResources(player, costs);
                    region.explorationLevel += 1;
                    player.victoryPoints += 1;
                    actionSuccess = true;
                    showFeedback(`Região ${region.name} explorada! Nível: ${region.explorationLevel}. +1 PV.`, 'success');
                } else {
                    showFeedback('Recursos insuficientes para explorar.', 'error');
                }
            } else {
                showFeedback('Selecione uma região própria não explorada ao máximo.', 'error');
            }
            break;
        case 'construir':
            if (gameState.selectedRegion !== null) {
                openBuildModal(player, gameState.regions[gameState.selectedRegion]);
            } else {
                showFeedback('Selecione uma região própria para construir.', 'error');
            }
            return; // Não push action aqui; push em handleBuildSelection se sucesso
        case 'recolher':
            const gatherCosts = GAME_CONFIG.ACTION_DETAILS.recolher.cost;
            if (checkCosts(player, gatherCosts)) {
                consumeResources(player, gatherCosts);
                player.resources.madeira += 2;
                player.resources.pedra += 2;
                player.resources.agua += 2;
                player.victoryPoints += 1;
                actionSuccess = true;
                showFeedback('Recursos recolhidos! +2 M, +2 P, +2 A, +1 PV.', 'success');
            } else {
                showFeedback('Recursos insuficientes para recolher.', 'error');
            }
            break;
        case 'negociar':
            const negotiateCosts = GAME_CONFIG.ACTION_DETAILS.negociar.cost;
            if (checkCosts(player, negotiateCosts)) {
                consumeResources(player, negotiateCosts);
                openProposalModal(); // NOVO para Fase 3.1
                return; // Não push action aqui; push se aceita
            } else {
                showFeedback('Recursos insuficientes para negociar.', 'error');
            }
            break;
    }

    if (actionSuccess) {
        gameState.actionsTaken.push(actionType);
        player.consecutiveNoActionTurns = 0;
        gameState.selectedRegion = null;
        updateDisplay();
        checkVictoryCondition();
    }
}

// NOVO para Fase 3.1: Modal para criar proposta
function openProposalModal() {
    const player = gameState.players[gameState.currentPlayerIndex];
    const otherPlayers = gameState.players.filter(p => p.id !== player.id);
    const resourceOptions = ['madeira', 'pedra', 'ouro', 'agua'].map(res => `<option value="${res}">${res.charAt(0).toUpperCase() + res.slice(1)}</option>`).join('');

    let content = `
        <h6>Selecione o jogador alvo:</h6>
        <select id="targetSelect">
            ${otherPlayers.map(p => `<option value="${p.id}">${p.icon} ${p.name}</option>`).join('')}
        </select>
        <h6>O que oferecer:</h6>
        <select id="offerResource">${resourceOptions}</select>
        <input type="number" id="offerAmount" min="1" placeholder="Quantidade">
        <h6>O que pedir:</h6>
        <select id="requestResource">${resourceOptions}</select>
        <input type="number" id="requestAmount" min="1" placeholder="Quantidade">
        <button class="btn btn-primary mt-2" onclick="submitProposal()">Enviar Proposta</button>
    `;

    document.getElementById('negotiationContent').innerHTML = content;
    const modal = new bootstrap.Modal(document.getElementById('negotiationModal'));
    modal.show();
}

// NOVO para Fase 3.1: Submeter proposta
function submitProposal() {
    const player = gameState.players[gameState.currentPlayerIndex];
    const targetId = parseInt(document.getElementById('targetSelect').value);
    const offerRes = document.getElementById('offerResource').value;
    const offerAmt = parseInt(document.getElementById('offerAmount').value);
    const reqRes = document.getElementById('requestResource').value;
    const reqAmt = parseInt(document.getElementById('requestAmount').value);

    if (isNaN(offerAmt) || offerAmt < 1 || player.resources[offerRes] < offerAmt) {
        showFeedback('Oferta inválida ou insuficiente.', 'error');
        return;
    }
    if (isNaN(reqAmt) || reqAmt < 1) {
        showFeedback('Pedido inválido.', 'error');
        return;
    }

    gameState.proposal = {
        from: gameState.currentPlayerIndex,
        to: targetId,
        offer: { resource: offerRes, amount: offerAmt },
        request: { resource: reqRes, amount: reqAmt }
    };

    bootstrap.Modal.getInstance(document.getElementById('negotiationModal')).hide();
    openAcceptanceModal();
}

// NOVO para Fase 3.1: Modal para aceitar/recusar
function openAcceptanceModal() {
    const proposal = gameState.proposal;
    const fromPlayer = gameState.players[proposal.from];
    const toPlayer = gameState.players[proposal.to];

    showFeedback(`Atenção, ${toPlayer.name}! Responda à proposta de ${fromPlayer.name}.`, 'info');

    let content = `
        <h6>Proposta de ${fromPlayer.icon} ${fromPlayer.name}:</h6>
        <p>Oferece: ${proposal.offer.amount} ${proposal.offer.resource.charAt(0).toUpperCase() + proposal.offer.resource.slice(1)}</p>
        <p>Em troca de: ${proposal.request.amount} ${proposal.request.resource.charAt(0).toUpperCase() + proposal.request.resource.slice(1)}</p>
        <button class="btn btn-success" onclick="acceptProposal()">Aceitar</button>
        <button class="btn btn-danger" onclick="rejectProposal()">Recusar</button>
    `;

    document.getElementById('negotiationContent').innerHTML = content;
    const modal = new bootstrap.Modal(document.getElementById('negotiationModal'));
    modal.show();
}

// NOVO para Fase 3.1: Aceitar proposta
function acceptProposal() {
    const proposal = gameState.proposal;
    const fromPlayer = gameState.players[proposal.from];
    const toPlayer = gameState.players[proposal.to];

    if (toPlayer.resources[proposal.request.resource] >= proposal.request.amount && fromPlayer.resources[proposal.offer.resource] >= proposal.offer.amount) {
        fromPlayer.resources[proposal.offer.resource] -= proposal.offer.amount;
        toPlayer.resources[proposal.request.resource] -= proposal.request.amount;
        fromPlayer.resources[proposal.request.resource] += proposal.request.amount;
        toPlayer.resources[proposal.offer.resource] += proposal.offer.amount;

        fromPlayer.victoryPoints += 1;
        toPlayer.victoryPoints += 1;

        showFeedback('Proposta aceita! +1 PV para ambos.', 'success');
        gameState.actionsTaken.push('negociar');
        gameState.players[proposal.from].consecutiveNoActionTurns = 0;
    } else {
        showFeedback('Recursos insuficientes para aceitar a proposta.', 'error');
    }

    bootstrap.Modal.getInstance(document.getElementById('negotiationModal')).hide();
    gameState.proposal = null;
    updateDisplay();
    checkVictoryCondition();
}

// NOVO para Fase 3.1: Recusar proposta (com mitigação)
function rejectProposal() {
    const proposal = gameState.proposal;
    const fromPlayer = gameState.players[proposal.from];

    fromPlayer.resources['madeira'] += 1; // Mitigação (Fase 2.4 integrada)

    showFeedback('Proposta recusada. +1 Madeira para o proponente como compensação.', 'info');

    bootstrap.Modal.getInstance(document.getElementById('negotiationModal')).hide();
    gameState.proposal = null;
    updateDisplay();
    checkVictoryCondition();
}

function endTurn() {
    if (gameState.gameOver) return;

    const player = gameState.players[gameState.currentPlayerIndex];

    if (gameState.actionsTaken.length === 0) {
        player.consecutiveNoActionTurns += 1;
        if (player.consecutiveNoActionTurns >= 3) {
            showFeedback('Aviso: Renda base suspensa no próximo turno por inatividade!', 'warning');
        }
    } else {
        player.consecutiveNoActionTurns = 0;
    }

    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    gameState.turn += 1;
    startTurn();
}

function checkVictoryCondition() {
    const winner = gameState.players.find(p => p.victoryPoints >= GAME_CONFIG.VICTORY_POINTS);
    if (winner) {
        gameState.gameOver = true;
        showVictoryModal(winner);
    }
}

function showVictoryModal(winner) {
    document.getElementById('victoryContent').innerHTML = `
        <p>${winner.icon} ${winner.name} conquistou Gaia com ${winner.victoryPoints} PVs!</p>
        <p>Pontuação Final:</p>
        <ul>
            ${gameState.players.map(p => `<li>${p.icon} ${p.name}: ${p.victoryPoints} PV</li>`).join('')}
        </ul>
    `;
    const modal = new bootstrap.Modal(document.getElementById('victoryModal'));
    modal.show();
}

// ==================== ATUALIZAÇÃO DA UI ====================
function updateDisplay() {
    updateResourcesDisplay();
    updatePlayerHeaderList();
    updatePlayerListDisplay();
    updateMapDisplay();
    updateActionButtons();
    document.getElementById('turnoDisplay').textContent = gameState.turn;
}

function updateResourcesDisplay() {
    const player = gameState.players[gameState.currentPlayerIndex];
    if (!player) return;

    let html = '';
    for (const res in player.resources) {
        html += `
            <div class="resource-item">
                <span class="label">${res.charAt(0).toUpperCase()}:</span>
                <span class="value">${player.resources[res]}</span>
            </div>
        `;
    }
    html += `
        <div class="resource-item">
            <span class="label">PV:</span>
            <span class="value">${player.victoryPoints}</span>
        </div>
    `;
    document.getElementById('recursosDisplay').innerHTML = html;
}

function updatePlayerHeaderList() {
    let html = '';
    gameState.players.forEach(p => {
        const isActive = p.id === gameState.currentPlayerIndex ? 'active-player-header' : '';
        const isSelected = p.id === gameState.selectedPlayerForResources ? 'selected-player' : '';
        html += `
            <span class="header-player-item ${isActive} ${isSelected}" onclick="viewPlayerResources(${p.id})">
                ${p.icon} ${p.name}: ${p.victoryPoints} PV
            </span>
        `;
    });
    document.getElementById('playerHeaderList').innerHTML = html;
}

function updatePlayerListDisplay() {
    let html = '';
    gameState.players.forEach(p => {
        const isActive = p.id === gameState.currentPlayerIndex ? 'active-player' : '';
        const isViewing = p.id === gameState.selectedPlayerForResources ? 'viewing-resources' : '';
        html += `
            <div class="player-score-item ${isActive} ${isViewing}" onclick="viewPlayerResources(${p.id})">
                <span>${p.icon} ${p.name}</span>
                <span>${p.victoryPoints} PV</span>
            </div>
        `;
    });
    document.getElementById('playerListDisplay').innerHTML = html;
}

function viewPlayerResources(playerId) {
    gameState.selectedPlayerForResources = playerId;
    const player = gameState.players[playerId];
    let content = `<h6>${player.icon} ${player.name} - Recursos:</h6>`;
    for (const res in player.resources) {
        content += `<div class="resource-list-item"><span>${res.charAt(0).toUpperCase()}:</span> <strong>${player.resources[res]}</strong></div>`;
    }
    content += `<div class="resource-list-item"><span>PV:</span> <strong>${player.victoryPoints}</strong></div>`;
    document.getElementById('playerResourcesContent').innerHTML = content;
    const modal = new bootstrap.Modal(document.getElementById('playerResourcesModal'));
    modal.show();
    updateDisplay();
}

function updateMapDisplay() {
    gameMapEl.innerHTML = '';
    gameState.regions.forEach(region => {
        const regionEl = document.createElement('div');
        regionEl.className = 'region';
        regionEl.dataset.regionId = region.id;
        if (region.controller !== null) {
            regionEl.style.borderColor = gameState.players[region.controller].color;
            if (region.controller === gameState.currentPlayerIndex) {
                regionEl.classList.add('controlled-by-current');
                regionEl.style.setProperty('--region-border-color', gameState.players[region.controller].color);
            }
        }
        if (gameState.selectedRegion === region.id) regionEl.classList.add('selected');

        let structuresHtml = region.structures.map(s => `<div class="structure-icon">${GAME_CONFIG.STRUCTURE_TYPES[s.type].name}</div>`).join('');

        regionEl.innerHTML = `
            <span class="region-name">${region.name}</span>
            <span class="region-info">Bioma: ${region.biome}</span>
            <span class="region-info">Exploração: ${region.explorationLevel}</span>
            ${structuresHtml}
        `;

        regionEl.addEventListener('click', () => selectRegion(region.id));
        gameMapEl.appendChild(regionEl);
    });
}

function selectRegion(regionId) {
    gameState.selectedRegion = regionId;
    updateDisplay();
}

function handleMouseMove(event) {
    const target = event.target.closest('.region');
    if (target) {
        const regionId = parseInt(target.dataset.regionId);
        const region = gameState.regions[regionId];
        let popupHtml = `<span class="popup-title">${region.name} (${region.biome})</span>`;
        popupHtml += `<div class="popup-info-item"><strong>Controlador:</strong> ${region.controller !== null ? gameState.players[region.controller].name : 'Nenhum'}</div>`;
        popupHtml += `<div class="popup-info-item"><strong>Exploração:</strong> ${region.explorationLevel}</div>`;
        if (region.structures.length > 0) {
            popupHtml += `<div class="popup-info-item"><strong>Estruturas:</strong> ${region.structures.map(s => GAME_CONFIG.STRUCTURE_TYPES[s.type].name).join(', ')}</div>`;
        }
        regionDetailsPopupEl.innerHTML = popupHtml;
        regionDetailsPopupEl.style.left = `${event.clientX + 10}px`;
        regionDetailsPopupEl.style.top = `${event.clientY + 10}px`;
        regionDetailsPopupEl.classList.add('show');
    } else {
        regionDetailsPopupEl.classList.remove('show');
    }
}

function updateActionButtons() {
    const player = gameState.players[gameState.currentPlayerIndex];
    const selectedRegion = gameState.selectedRegion !== null ? gameState.regions[gameState.selectedRegion] : null;

    const explored = gameState.actionsTaken.includes('explorar');
    const built = gameState.actionsTaken.includes('construir');
    const gathered = gameState.actionsTaken.includes('recolher');
    const negotiated = gameState.actionsTaken.includes('negociar');

    // Explorar: 2 Madeira, 1 Água
    const explorarBtn = document.getElementById('explorarBtn');
    const canExplore = !explored && selectedRegion && selectedRegion.controller === gameState.currentPlayerIndex && selectedRegion.explorationLevel < 2 && checkCosts(player, GAME_CONFIG.ACTION_DETAILS.explorar.cost);
    explorarBtn.disabled = !canExplore;
    explorarBtn.title = `Custo: ${GAME_CONFIG.ACTION_DETAILS.explorar.cost.madeira} M, ${GAME_CONFIG.ACTION_DETAILS.explorar.cost.agua} A. Efeito: ${GAME_CONFIG.ACTION_DETAILS.explorar.effect}`;

    // Construir: Abre modal, mas o custo mais alto é 5 P, 5 M, 2 O, 2 A
    const construirBtn = document.getElementById('construirBtn');
    const canBuild = !built && selectedRegion && selectedRegion.controller === gameState.currentPlayerIndex && selectedRegion.explorationLevel > 0;
    construirBtn.disabled = !canBuild;
    construirBtn.title = `Efeito: ${GAME_CONFIG.ACTION_DETAILS.construir.effect}`;
    if (canBuild) {
        // Exibe o custo máximo para o tooltip
        const maxCosts = { madeira: 5, pedra: 5, ouro: 2, agua: 2 };
        construirBtn.title = `Custo Máx: ${maxCosts.madeira} M, ${maxCosts.pedra} P, ${maxCosts.ouro} O, ${maxCosts.agua} A. Efeito: ${GAME_CONFIG.ACTION_DETAILS.construir.effect}`;
    }

    // Recolher: 1 Madeira
    const recolherBtn = document.getElementById('recolherBtn');
    const canGather = !gathered && checkCosts(player, GAME_CONFIG.ACTION_DETAILS.recolher.cost);
    recolherBtn.disabled = !canGather;
    recolherBtn.title = `Custo: ${GAME_CONFIG.ACTION_DETAILS.recolher.cost.madeira} M. Efeito: ${GAME_CONFIG.ACTION_DETAILS.recolher.effect}`;
    
    // Negociar: 1 Ouro
    const negociarBtn = document.getElementById('negociarBtn');
    const canNegotiate = !negotiated && checkCosts(player, GAME_CONFIG.ACTION_DETAILS.negociar.cost);
    negociarBtn.disabled = !canNegotiate;
    negociarBtn.title = `Custo: ${GAME_CONFIG.ACTION_DETAILS.negociar.cost.ouro} O. Efeito: ${GAME_CONFIG.ACTION_DETAILS.negociar.effect}`;

    document.getElementById('endTurnBtn').disabled = false; // Sempre pode finalizar o turno
}

// Regra 5: Abre o modal de construção
function openBuildModal(player, region) {
    const structureTypes = GAME_CONFIG.STRUCTURE_TYPES;
    const buildOptionsContent = document.getElementById('buildOptionsContent');
    buildOptionsContent.innerHTML = '';
    
    if (region.explorationLevel === 0) {
        buildOptionsContent.innerHTML = `<p class="text-warning">⚠️ A região ${region.name} precisa ser explorada (Nível > 0) antes de construir estruturas.</p>`;
        const modal = new bootstrap.Modal(document.getElementById('buildModal'));
        modal.show();
        return;
    }
    
    let optionsHtml = '<div class="row">';
    for (const key in structureTypes) {
        const structure = structureTypes[key];
        const canAfford = checkCosts(player, structure.cost);
        const disabledClass = canAfford ? '' : 'disabled opacity-50';
        
        // Verifica requisito de exploração (simples: 1 para posto/campo, 2 para principal)
        let requirement = 0;
        if (key === 'POSTO_AVANCADO' || key === 'CAMPO_CULTIVO') requirement = 1;
        if (key === 'EDIFICIO_PRINCIPAL') requirement = 2;
        
        const meetsRequirement = region.explorationLevel >= requirement;
        const reqDisabledClass = meetsRequirement ? '' : 'disabled opacity-50';
        const reqMessage = meetsRequirement ? '' : `Requer Exploração Nível ${requirement}.`;

        const costsHtml = Object.keys(structure.cost)
            .filter(res => structure.cost[res] > 0)
            .map(res => `<span class="resource-cost">${structure.cost[res]} ${res.substring(0, 1).toUpperCase()}</span>`)
            .join(' | ');

        const isFullyDisabled = !canAfford || !meetsRequirement;

        optionsHtml += `
            <div class="col-md-4 mb-3">
                <div class="card build-option ${isFullyDisabled ? 'disabled' : ''}" 
                     data-structure-key="${key}" 
                     ${isFullyDisabled ? 'style="pointer-events: none;"' : ''} 
                     onclick="${isFullyDisabled ? 'void(0)' : `handleBuildSelection('${key}')`}">
                    <div class="card-body">
                        <h5 class="card-title">${structure.name}</h5>
                        <p class="card-text small">${structure.description}</p>
                        <p class="card-text small mb-1"><strong>Custo:</strong> ${costsHtml || 'Nenhum'}</p>
                        <p class="card-text small text-success"><strong>Ganha:</strong> ${structure.pv_gain} PV (Inicial)</p>
                        <p class="card-text small text-info"><strong>Renda Extra:</strong> +${structure.production_boost} Renda Bioma | ${Object.keys(structure.bonus_per_turn).filter(r => structure.bonus_per_turn[r] > 0).map(r => `+${structure.bonus_per_turn[r]} ${r.toUpperCase()}`).join(', ') || 'Nenhum'}</p>
                        <p class="card-text small text-danger">${reqMessage}</p>
                        ${!canAfford ? '<p class="text-danger small mt-2">Recursos Insuficientes</p>' : ''}
                    </div>
                </div>
            </div>
        `;
    }
    optionsHtml += '</div>';
    buildOptionsContent.innerHTML = optionsHtml;

    const modal = new bootstrap.Modal(document.getElementById('buildModal'));
    modal.show();
}

// Funções de Construção
function handleBuildSelection(structureKey) {
    const player = gameState.players[gameState.currentPlayerIndex];
    const region = gameState.regions[gameState.selectedRegion];
    const structure = GAME_CONFIG.STRUCTURE_TYPES[structureKey];
    
    // Reverifica custos e requisitos de exploração
    let requirement = 0;
    if (structureKey === 'POSTO_AVANCADO' || structureKey === 'CAMPO_CULTIVO') requirement = 1;
    if (structureKey === 'EDIFICIO_PRINCIPAL') requirement = 2;
    
    if (region.explorationLevel < requirement) {
        showFeedback(`Erro: Requer nível de exploração ${requirement} para construir ${structure.name}.`, 'error');
        return;
    }
    
    if (checkCosts(player, structure.cost)) {
        consumeResources(player, structure.cost);
        region.structures.push({ type: structureKey });
        player.victoryPoints += structure.pv_gain;
        gameState.actionsTaken.push('construir');
        player.consecutiveNoActionTurns = 0; // Zera passividade
        
        showFeedback(`${structure.name} construído na região ${region.name}! +${structure.pv_gain} PV.`, 'success');
        
        // Esconde o modal e atualiza
        const modal = bootstrap.Modal.getInstance(document.getElementById('buildModal'));
        modal.hide();
        gameState.selectedRegion = null;
        updateDisplay();
        checkVictoryCondition();
    } else {
        showFeedback('Recursos insuficientes para esta construção.', 'error');
    }
}

// NOVO: Renderiza o manual de estruturas (UX)
function renderStructuresManual() {
    const structuresManualContent = document.getElementById('structuresManualContent');
    const structureTypes = GAME_CONFIG.STRUCTURE_TYPES;
    
    let html = '<h6>Detalhes das Estruturas e seus Efeitos:</h6><ul>';
    for (const key in structureTypes) {
        const structure = structureTypes[key];
        const costsHtml = Object.keys(structure.cost)
            .filter(res => structure.cost[res] > 0)
            .map(res => `${structure.cost[res]} ${res.substring(0, 1).toUpperCase()}`)
            .join(', ');
        
        let recurrent = '';
        const recurrentKeys = Object.keys(structure.bonus_per_turn).filter(r => structure.bonus_per_turn[r] > 0);
        if (recurrentKeys.length > 0) {
            recurrent = recurrentKeys.map(r => `+${structure.bonus_per_turn[r]} ${r.toUpperCase()}`).join(', ');
        }

        html += `
            <li style="margin-bottom: 15px;">
                <strong>${structure.name}:</strong> ${structure.description}
                <ul>
                    <li><strong>Custo:</strong> ${costsHtml || 'Nenhum'}</li>
                    <li><strong>Ganho Inicial:</strong> ${structure.pv_gain} PV</li>
                    <li><strong>Bônus de Renda:</strong> +${structure.production_boost} Renda Bioma.</li>
                    <li><strong>Renda Recorrente:</strong> ${recurrent || 'Nenhum'} por turno.</li>
                </ul>
            </li>
        `;
    }
    html += '</ul>';
    structuresManualContent.innerHTML = html;
}

// ==================== EVENT LISTENERS ====================
document.getElementById('addPlayerBtn').addEventListener('click', () => {
    const name = document.getElementById('playerName').value.trim();
    const selectedIconEl = document.querySelector('.icon-option.selected');
    const icon = selectedIconEl ? selectedIconEl.textContent : null;

    if (!name || !icon) {
        showFeedback('Preencha nome e selecione um ícone.', 'error');
        return;
    }

    if (addPlayer(name, icon)) {
        document.getElementById('playerName').value = '';
        selectedIconEl.classList.remove('selected');
        showFeedback(`${name} adicionado!`, 'success');
    }
});

document.getElementById('startGameBtn').addEventListener('click', () => {
    gameState.gameStarted = true;
    document.getElementById('initialScreen').classList.add('hidden');
    initializeGame();
    // Inicia o primeiro turno após a inicialização
    startTurn();
});

document.getElementById('explorarBtn').addEventListener('click', () => performAction('explorar'));
document.getElementById('construirBtn').addEventListener('click', () => performAction('construir'));
document.getElementById('recolherBtn').addEventListener('click', () => performAction('recolher'));
document.getElementById('negociarBtn').addEventListener('click', () => performAction('negociar'));
document.getElementById('endTurnBtn').addEventListener('click', endTurn);

// ==================== INICIALIZAÇÃO DA PÁGINA ====================
document.addEventListener('DOMContentLoaded', () => {
    // Gerar ícones
    const iconSelection = document.getElementById('iconSelection');
    GAME_CONFIG.PLAYER_ICONS.forEach(icon => {
        const iconOption = document.createElement('div');
        iconOption.className = 'icon-option';
        iconOption.textContent = icon;
        iconOption.addEventListener('click', () => {
            document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
            iconOption.classList.add('selected');
        });
        iconSelection.appendChild(iconOption);
    });
});
