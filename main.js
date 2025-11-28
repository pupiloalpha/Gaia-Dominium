/*
    Conteúdo refatorado do arquivo main.js, aplicando a Fase 1 e Correções (1-5):
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
            description: 'Aumenta a produção base do bioma em +1.',
            cost: { madeira: 3, pedra: 2, agua: 1, ouro: 0 },
            pv_gain: 2, 
            production_boost: 1, 
            bonus_per_turn: { pv: 0, madeira: 0, pedra: 0, ouro: 0, agua: 0 }
        },
        'EDIFICIO_PRINCIPAL': {
            name: 'Edifício Principal',
            description: 'Concede alto PV e PV recorrente.',
            cost: { madeira: 5, pedra: 5, ouro: 2, agua: 2 },
            pv_gain: 5,
            production_boost: 0,
            bonus_per_turn: { pv: 1 } 
        },
        'CAMPO_CULTIVO': {
            name: 'Campo de Cultivo',
            description: 'Focado em produção de Água e Madeira.',
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
    }
};

// ==================== ESTADO DO JOGO ====================
let gameState = {
    players: [],
    regions: [],
    currentPlayerIndex: 0,
    selectedPlayerForResources: 0, // Mantido, mas a UI foca no modal
    turn: 0,
    gameStarted: false,
    selectedRegion: null,
    selectedAction: null,
    negotiationInProgress: false,
    
    // Regra 2: Limite de Ações
    actionsTaken: [], // Armazena as ações feitas no turno (ex: ['explorar', 'construir'])
    actionsLimit: 2,
};

// ==================== INICIALIZAÇÃO ====================
function initializeGame() {
    // Garante que todos os jogadores tenham o contador de turno sem ação
    gameState.players.forEach(p => p.consecutiveNoActionTurns = 0);
    createRegions();
    distributeRegions();
    updateDisplay();
}

function createRegions() {
    gameState.regions = [];
    for (let i = 0; i < GAME_CONFIG.GRID_SIZE * GAME_CONFIG.GRID_SIZE; i++) {
        gameState.regions.push({
            id: i,
            name: GAME_CONFIG.REGION_NAMES[i],
            biome: GAME_CONFIG.BIOMES[Math.floor(Math.random() * GAME_CONFIG.BIOMES.length)],
            controller: null,
            explorationLevel: 0,
            structures: []
        });
    }
}

function distributeRegions() {
    const regionsPerPlayer = Math.floor((GAME_CONFIG.GRID_SIZE * GAME_CONFIG.GRID_SIZE) / gameState.players.length);
    let regionIndex = 0;
    
    for (let i = 0; i < gameState.players.length; i++) {
        // Inicializa o array de regiões controladas por jogador
        gameState.players[i].regions = [];
        
        for (let j = 0; j < regionsPerPlayer; j++) {
            if (regionIndex < gameState.regions.length) {
                gameState.regions[regionIndex].controller = i;
                gameState.players[i].regions.push(regionIndex); // Adiciona a lista de regiões
                regionIndex++;
            }
        }
    }
}

// ==================== GERENCIAMENTO DE JOGADORES ====================
function addPlayer(name, icon) {
    if (gameState.players.length >= 4) {
        showFeedback('Máximo de 4 jogadores!', 'error');
        return false;
    }
    
    gameState.players.push({
        id: gameState.players.length,
        name: name,
        icon: icon,
        color: GAME_CONFIG.PLAYER_COLORS[gameState.players.length],
        resources: { ...GAME_CONFIG.INITIAL_RESOURCES },
        victoryPoints: 0,
        structures: 0,
        hasDiversityBonus: false,
        consecutiveNoActionTurns: 0 // Regra 3: Contador de turnos sem ação
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

// ==================== INTERFACE DO JOGO ====================
function renderGameMap() {
    const gameMap = document.getElementById('gameMap');
    gameMap.innerHTML = '';
    
    gameState.regions.forEach(region => {
        const regionEl = document.createElement('div');
        regionEl.className = 'region';
        regionEl.dataset.regionId = region.id;
        
        if (region.controller !== null) {
            const player = gameState.players[region.controller];
            
            // Ação 1.4: Adicionar borda e cor mais visível
            regionEl.style.border = `3px solid ${player.color}`;
            regionEl.style.backgroundColor = player.color + '33';
            
            if (region.controller === gameState.currentPlayerIndex) {
                regionEl.classList.add('controlled-by-current');
            }
        }
        
        // Regra 4: Destaque de região selecionada
        if (gameState.selectedRegion === region.id) {
            regionEl.classList.add('selected');
        }
        
        // Exibição de estruturas (para UX)
        const structureIcon = region.structures.length > 0 ? `<div class="structure-icon">🏗️ x${region.structures.length}</div>` : '';
        
        regionEl.innerHTML = `
            <div class="region-name">${region.name}</div>
            <div class="region-info">${region.biome}</div>
            <div class="region-info">Nível: ${region.explorationLevel}</div>
            ${structureIcon}
        `;
        
        regionEl.addEventListener('click', () => selectRegion(region.id));
        gameMap.appendChild(regionEl);
    });
}

// Regra 4: Destaque e seleção de região
function selectRegion(regionId) {
    const region = gameState.regions[regionId];
    // Apenas pode selecionar regiões que controla
    if (region.controller === gameState.currentPlayerIndex) {
        gameState.selectedRegion = gameState.selectedRegion === regionId ? null : regionId;
    } else {
        // Permite desmarcar a região se for a mesma, mesmo que não seja sua (para limpar o destaque)
        if (gameState.selectedRegion === regionId) {
            gameState.selectedRegion = null;
        } else {
             // Não permite selecionar regiões de outros jogadores para ações
            showFeedback('Você só pode selecionar regiões que você controla para ações.', 'warning');
        }
    }
    
    renderGameMap();
    updateActionButtons();
}

function updateDisplay() {
    renderGameMap();
    updateResourcesDisplay(); // Foco no jogador atual
    updatePlayersList();
    updateActionButtons();
    updateHeaderPlayerList();
}

function updateResourcesDisplay() {
    // Regra 1: Foca apenas nos recursos do jogador do turno
    const player = gameState.players[gameState.currentPlayerIndex];
    const recursosDisplay = document.getElementById('recursosDisplay');
    const recursosTitle = document.getElementById('recursosTitle');
    
    recursosTitle.textContent = `Seus Recursos (${player.icon} ${player.name})`;
    
    recursosDisplay.innerHTML = `
        <div class="resource-item">
            <span class="label">🌲 Madeira:</span>
            <span class="value">${player.resources.madeira}</span>
        </div>
        <div class="resource-item">
            <span class="label">🗿 Pedra:</span>
            <span class="value">${player.resources.pedra}</span>
        </div>
        <div class="resource-item">
            <span class="label">💰 Ouro:</span>
            <span class="value">${player.resources.ouro}</span>
        </div>
        <div class="resource-item">
            <span class="label">💧 Água:</span>
            <span class="value">${player.resources.agua}</span>
        </div>
    `;
    
    document.getElementById('turnoDisplay').textContent = gameState.turn;
}

function updatePlayersList() {
    const playerListDisplay = document.getElementById('playerListDisplay');
    playerListDisplay.innerHTML = '';
    
    gameState.players.forEach((player, index) => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-score-item';
        playerItem.dataset.playerIndex = index;
        
        if (index === gameState.currentPlayerIndex) {
            playerItem.classList.add('active-player');
        }
        
        // Regra 1: Mantemos a classe 'viewing-resources' para estilo diferente
        if (gameState.selectedPlayerForResources === index) {
            playerItem.classList.add('viewing-resources');
        }
        
        playerItem.innerHTML = `
            <span>${player.icon} ${player.name}</span>
            <span>${player.victoryPoints} PV</span>
            ${player.hasDiversityBonus ? '<span title="Bônus de Diversidade" class="bonus-indicator">🌟</span>' : ''}
        `;
        
        // Regra 1: Ao clicar, abre o modal de recursos detalhados
        playerItem.addEventListener('click', () => selectPlayerForResources(index));
        playerListDisplay.appendChild(playerItem);
    });
}

// Regra 1: Abre o modal de recursos detalhados
function selectPlayerForResources(playerIndex) {
    const player = gameState.players[playerIndex];
    
    // Atualiza a seleção visual na lista lateral (Regra 1)
    if (gameState.selectedPlayerForResources === playerIndex) {
        gameState.selectedPlayerForResources = gameState.currentPlayerIndex;
    } else {
        gameState.selectedPlayerForResources = playerIndex;
    }
    updatePlayersList();
    
    // Prepara o conteúdo do modal
    const modalTitle = document.getElementById('playerResourcesModalLabel');
    const modalBody = document.getElementById('playerResourcesContent');
    const playerActions = playerIndex === gameState.currentPlayerIndex ? gameState.actionsTaken.join(', ') || 'Nenhuma' : 'Turno Encerrado';


    modalTitle.textContent = `Recursos Detalhados de ${player.icon} ${player.name}`;
    
    let content = `
        <p><strong>Pontos de Vitória:</strong> ${player.victoryPoints} PV</p>
        <p><strong>Ações no Turno:</strong> ${playerActions} (${gameState.actionsTaken.length}/${gameState.actionsLimit})</p>
        ${player.consecutiveNoActionTurns > 0 ? `<p class="text-warning">Turnos passivos seguidos: ${player.consecutiveNoActionTurns}</p>` : ''}
        <hr>
        <h6>Recursos:</h6>
        <ul>
            <li>🌲 Madeira: ${player.resources.madeira}</li>
            <li>🗿 Pedra: ${player.resources.pedra}</li>
            <li>💰 Ouro: ${player.resources.ouro}</li>
            <li>💧 Água: ${player.resources.agua}</li>
        </ul>
        <hr>
        <p><strong>Regiões Controladas:</strong> ${player.regions ? player.regions.length : 0}</p>
        ${player.hasDiversityBonus ? '<p class="text-success">🌟 Bônus de Diversidade Adquirido</p>' : ''}
    `;
    
    modalBody.innerHTML = content;

    // Mostra o modal
    const modal = new bootstrap.Modal(document.getElementById('playerResourcesModal'));
    modal.show();
}


function updateHeaderPlayerList() {
    const playerHeaderList = document.getElementById('playerHeaderList');
    playerHeaderList.innerHTML = '';
    
    gameState.players.forEach((player, index) => {
        const playerItem = document.createElement('span');
        playerItem.className = 'header-player-item';
        if (index === gameState.currentPlayerIndex) {
            playerItem.classList.add('active-player-header');
        }
        
        playerItem.textContent = `${player.icon} ${player.name}`;
        playerHeaderList.appendChild(playerItem);
    });
}

// Regra 2: Atualiza o estado dos botões de ação
function updateActionButtons() {
    const player = gameState.players[gameState.currentPlayerIndex];
    const selectedRegion = gameState.selectedRegion !== null ? gameState.regions[gameState.selectedRegion] : null;
    
    const actionsRemaining = gameState.actionsLimit - gameState.actionsTaken.length;

    // Condição base para bloquear ações
    const isActionLimitReached = actionsRemaining <= 0;
    
    // Regra 2: Bloqueia todos os botões de ação se o limite for atingido
    if (isActionLimitReached) {
        document.getElementById('explorarBtn').disabled = true;
        document.getElementById('construirBtn').disabled = true;
        document.getElementById('recolherBtn').disabled = true;
        document.getElementById('negociarBtn').disabled = true;
        document.getElementById('endTurnBtn').disabled = false;
        showFeedback(`Limite de ${gameState.actionsLimit} ações por turno atingido. Finalize seu turno.`, 'warning');
        return;
    }
    
    // Funções auxiliares para checar se a ação já foi feita (Regra 2)
    const explored = gameState.actionsTaken.includes('explorar');
    const built = gameState.actionsTaken.includes('construir');
    const gathered = gameState.actionsTaken.includes('recolher');
    const negotiated = gameState.actionsTaken.includes('negociar');

    // Explorar: 2 Madeira + 1 Água
    document.getElementById('explorarBtn').disabled = 
        explored || // Já fez esta ação
        !selectedRegion || selectedRegion.controller !== gameState.currentPlayerIndex || 
        player.resources.madeira < 2 || player.resources.agua < 1;
    
    // Construir: Custos mais altos (para bloquear - usando o mais caro)
    document.getElementById('construirBtn').disabled = 
        built || // Já fez esta ação
        !selectedRegion || selectedRegion.controller !== gameState.currentPlayerIndex || 
        player.resources.madeira < 5 || player.resources.pedra < 5 || player.resources.ouro < 2 || player.resources.agua < 2;
    
    // Recolher: 1 Madeira
    document.getElementById('recolherBtn').disabled = 
        gathered || // Já fez esta ação
        player.resources.madeira < 1;
    
    // Negociar: 1 Ouro
    document.getElementById('negociarBtn').disabled = 
        negotiated || // Já fez esta ação
        player.resources.ouro < 1;
    
    // Finalizar Turno: sempre disponível
    document.getElementById('endTurnBtn').disabled = false;
}

// ==================== FUNÇÕES AUXILIARES ====================

// Verifica se o jogador pode pagar os custos
function checkCosts(player, costs) {
    for (const resource in costs) {
        if (player.resources[resource.toLowerCase()] < costs[resource]) {
            return false;
        }
    }
    return true;
}

// Consome os recursos do jogador
function consumeResources(player, costs) {
    for (const resource in costs) {
        player.resources[resource.toLowerCase()] -= costs[resource];
    }
}

// Aplica a renda do turno
function applyIncome(player) {
    let totalIncome = {}; 
    let baseIncomeSuspended = player.consecutiveNoActionTurns > 2;
    
    if (baseIncomeSuspended) {
        showFeedback(`Renda base suspensa! Turnos passivos seguidos: ${player.consecutiveNoActionTurns}.`, 'error');
    }

    // 1. Renda Base de Biomas, Bônus de Exploração e Bônus de Produção de Estruturas
    gameState.regions.forEach(region => {
        if (region.controller === player.id) {
            const biome = region.biome;
            const resourceType = GAME_CONFIG.BIOME_BONUSES[biome];
            
            if (resourceType) {
                let income = 0; 
                
                // Renda Base (suspensa se passiva > 2)
                if (!baseIncomeSuspended) {
                    income += 1; 
                }
                
                // Bônus de Exploração (não suspenso)
                income += region.explorationLevel; 

                // Bônus de Produção de Estruturas (não suspenso)
                region.structures.forEach(structureEntry => {
                    const structure = GAME_CONFIG.STRUCTURE_TYPES[structureEntry.type];
                    income += structure.production_boost;
                });
                
                if (income > 0) {
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
        }
    });
    
    let feedbackMsg = "Renda aplicada: ";
    for (const res in totalIncome) {
        feedbackMsg += `${totalIncome[res]} ${res}, `;
    }
    showFeedback(feedbackMsg.slice(0, -2) || "Nenhum ganho neste turno.", 'info');
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

// ==================== AÇÕES DO JOGO ====================
function performAction(actionType) {
    const player = gameState.players[gameState.currentPlayerIndex];
    const selectedRegion = gameState.selectedRegion !== null ? gameState.regions[gameState.selectedRegion] : null;

    // Regra 2: Checar se a ação já foi feita ou se o limite foi atingido (Redundante, mas garante a regra)
    if (gameState.actionsTaken.includes(actionType)) {
        showFeedback(`Você já realizou a ação '${actionType}' neste turno. Escolha outra ação.`, 'error');
        return;
    }

    if (gameState.actionsTaken.length >= gameState.actionsLimit && actionType !== 'endTurn') {
        showFeedback(`Limite de ${gameState.actionsLimit} ações por turno atingido. Finalize seu turno.`, 'error');
        return;
    }
    
    let actionSuccess = false;

    switch(actionType) {
        case 'explorar':
            if (selectedRegion && selectedRegion.controller === gameState.currentPlayerIndex &&
                player.resources.madeira >= 2 && player.resources.agua >= 1) {
                
                consumeResources(player, { madeira: 2, agua: 1 });
                selectedRegion.explorationLevel++;
                player.victoryPoints += 1;
                showFeedback('Região explorada! +1 PV', 'success');
                actionSuccess = true;
            } else if (!selectedRegion || selectedRegion.controller !== gameState.currentPlayerIndex) {
                 showFeedback("Selecione uma região que você controla para explorar.", 'error');
            }
            break;
            
        case 'construir':
            // Lógica de construção é movida para o modal (Regra 5)
            if (!selectedRegion || selectedRegion.controller !== gameState.currentPlayerIndex) {
                showFeedback("Selecione uma região que você controla para construir.", 'error');
                return;
            }
            openBuildModal(player, selectedRegion);
            return; // Espera a seleção do modal

        case 'recolher':
            if (player.resources.madeira >= 1) {
                consumeResources(player, { madeira: 1 });
                player.resources.madeira += 2;
                player.resources.pedra += 2;
                player.resources.agua += 2;
                player.victoryPoints += 1;
                showFeedback('Recursos recolhidos! +1 PV', 'success');
                actionSuccess = true;
            }
            break;
            
        case 'negociar':
            if (player.resources.ouro >= 1) {
                player.resources.ouro -= 1;
                openNegotiationModal();
                actionSuccess = true;
            }
            break;
    }
    
    if (actionSuccess) {
        gameState.actionsTaken.push(actionType); // Regra 2: Registra a ação
    }

    gameState.selectedRegion = null;
    updateDisplay();
    checkVictoryCondition();
}

// Regra 5: Abre o modal de construção
function openBuildModal(player, region) {
    const structureTypes = GAME_CONFIG.STRUCTURE_TYPES;
    const buildOptionsContent = document.getElementById('buildOptionsContent');
    buildOptionsContent.innerHTML = '';
    
    let optionsHtml = '<div class="row">';
    
    for (const key in structureTypes) {
        const structure = structureTypes[key];
        const canAfford = checkCosts(player, structure.cost);
        const disabledClass = canAfford ? '' : 'disabled opacity-50';
        
        const costsHtml = Object.keys(structure.cost)
            .filter(res => structure.cost[res] > 0)
            .map(res => `<span class="resource-cost">${structure.cost[res]} ${res.substring(0, 1).toUpperCase()}${res.substring(1)}</span>`)
            .join(' | ');

        optionsHtml += `
            <div class="col-md-4 mb-3">
                <div class="card build-option ${disabledClass}" 
                     data-structure-key="${key}" ${!canAfford ? 'style="pointer-events: none;"' : ''}
                     onclick="${canAfford ? `handleBuildSelection('${key}')` : 'void(0)'}">
                    <div class="card-body">
                        <h5 class="card-title">${structure.name}</h5>
                        <p class="card-text small">${structure.description}</p>
                        <p class="card-text text-success"><strong>+${structure.pv_gain} PV</strong> (Instantâneo)</p>
                        <p class="card-text text-info"><strong>Bônus/Turno:</strong> ${structure.bonus_per_turn.pv || 0} PV</p>
                        <hr>
                        <p class="card-text text-danger"><strong>Custo:</strong> ${costsHtml || 'Nenhum'}</p>
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

// Regra 5: Trata a seleção no modal
window.handleBuildSelection = function(structureKey) {
    const modal = bootstrap.Modal.getInstance(document.getElementById('buildModal'));
    modal.hide();

    const player = gameState.players[gameState.currentPlayerIndex];
    const selectedRegion = gameState.regions[gameState.selectedRegion];
    const structure = GAME_CONFIG.STRUCTURE_TYPES[structureKey];

    if (!structure) return;
    
    if (!checkCosts(player, structure.cost)) {
        showFeedback(`Recursos insuficientes para construir ${structure.name}. Tente novamente.`, 'error');
        return;
    }
    
    consumeResources(player, structure.cost); 
    
    selectedRegion.structures.push({ type: structureKey, name: structure.name }); 
    player.structures++;
    player.victoryPoints += structure.pv_gain; 
    
    gameState.actionsTaken.push('construir'); // Regra 2: Adiciona a ação
    showFeedback(`${structure.name} construído(a) na Região ${selectedRegion.name}! +${structure.pv_gain} PV.`, 'success');
    
    gameState.selectedRegion = null;
    updateDisplay();
    checkVictoryCondition();
};

function openNegotiationModal() {
    const player = gameState.players[gameState.currentPlayerIndex];
    const otherPlayers = gameState.players.filter((p, i) => i !== gameState.currentPlayerIndex);
    
    let content = '<p>Selecione um jogador para negociar:</p>';
    content += '<div class="negotiation-resources">';
    
    otherPlayers.forEach(otherPlayer => {
        content += `<button class="resource-badge" onclick="initiateNegotiation(${otherPlayer.id})">${otherPlayer.icon} ${otherPlayer.name}</button>`;
    });
    
    content += '</div>';
    
    document.getElementById('negotiationContent').innerHTML = content;
    const modal = new bootstrap.Modal(document.getElementById('negotiationModal'));
    modal.show();
}

function initiateNegotiation(targetPlayerId) {
    const player = gameState.players[gameState.currentPlayerIndex];
    const targetPlayer = gameState.players[targetPlayerId];
    
    const resourceTypes = ['madeira', 'pedra', 'ouro', 'agua'];
    const offerType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
    const receiveType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
    
    if (player.resources[offerType] > 0 && targetPlayer.resources[receiveType] > 0) {
        player.resources[offerType]--;
        targetPlayer.resources[receiveType]--;
        player.resources[receiveType]++;
        targetPlayer.resources[offerType]++;
        
        player.victoryPoints += 1;
        targetPlayer.victoryPoints += 1;
        
        showFeedback(`Negociação bem-sucedida! +1 PV para ambos`, 'success');
    } else {
        showFeedback(`Negociação falhou. Recursos insuficientes.`, 'error');
        // Não reverte o custo de Ouro, pois a ação foi tentada.
    }
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('negotiationModal'));
    modal.hide();
    
    // updateDisplay é chamado ao final de performAction('negociar')
}

function endTurn() {
    // Regra 3: Checagem de limite de turnos sem ação do jogador que está FINALIZANDO
    const previousPlayer = gameState.players[gameState.currentPlayerIndex];

    if (gameState.actionsTaken.length === 0) {
        previousPlayer.consecutiveNoActionTurns = (previousPlayer.consecutiveNoActionTurns || 0) + 1;
        
        if (previousPlayer.consecutiveNoActionTurns >= 2) {
            showFeedback(`${previousPlayer.icon} ${previousPlayer.name} atingiu 2 turnos passivos seguidos. Se finalizar sem ação novamente (3º), a renda base será suspensa.`, 'warning');
        }
    } else {
        previousPlayer.consecutiveNoActionTurns = 0;
    }
    
    gameState.turn++;
    
    // Passar o turno
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    
    const player = gameState.players[gameState.currentPlayerIndex];
    
    // === Aplicar Renda e Bônus de Estruturas (Ação 1.3) ===
    applyIncome(player);
    
    // === Aplicar Bônus de Diversidade (Ação 1.1) ===
    const diversityBonus = checkDiversityBonus(player);

    if (diversityBonus > 0) {
        player.victoryPoints += diversityBonus;
        showFeedback(`Bônus de Diversidade de Biomas! +${diversityBonus} PV.`, 'success');
    }
    
    gameState.actionsTaken = []; // Regra 2: Resetar ações para o novo turno
    gameState.selectedRegion = null;
    updateDisplay();
    checkVictoryCondition(); 
}

function checkVictoryCondition() {
    const winner = gameState.players.find(p => p.victoryPoints >= GAME_CONFIG.VICTORY_POINTS);
    if (winner) {
        showFeedback(`${winner.icon} ${winner.name} venceu com ${winner.victoryPoints} PV!`, 'success');
        setTimeout(() => location.reload(), 3000);
    }
}

// ==================== INTERFACE ====================
function showFeedback(message, type = 'info') {
    const feedbackEl = document.getElementById('feedbackMessage');
    feedbackEl.textContent = message;
    feedbackEl.className = `${type} show`;
    
    setTimeout(() => {
        feedbackEl.classList.remove('show');
    }, 3000);
}

// ==================== EVENT LISTENERS ====================
document.getElementById('addPlayerBtn').addEventListener('click', () => {
    const name = document.getElementById('playerName').value.trim();
    const selectedIcon = document.querySelector('.icon-option.selected');
    
    if (!name) {
        showFeedback('Digite um nome!', 'error');
        return;
    }
    
    if (!selectedIcon) {
        showFeedback('Selecione um ícone!', 'error');
        return;
    }
    
    if (addPlayer(name, selectedIcon.textContent)) {
        document.getElementById('playerName').value = '';
        selectedIcon.classList.remove('selected');
        showFeedback(`${name} adicionado!`, 'success');
    }
});

document.getElementById('startGameBtn').addEventListener('click', () => {
    gameState.gameStarted = true;
    document.getElementById('initialScreen').classList.add('hidden');
    initializeGame();
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
