/*
    Conteúdo refatorado do arquivo main.js:
    - Implementação do ícone de informações e separação da lógica de clique.
    - Garantia de que a classe 'text-light' é usada no modal de construção para o tema dark.
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
    selectedPlayerForResources: 0, 
    turn: 0,
    gameStarted: false,
    selectedRegion: null,
    selectedAction: null,
    negotiationInProgress: false,
    
    actionsTaken: [], 
    actionsLimit: 2,
};

// ==================== INICIALIZAÇÃO ====================
function initializeGame() {
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
        gameState.players[i].regions = [];
        
        for (let j = 0; j < regionsPerPlayer; j++) {
            if (regionIndex < gameState.regions.length) {
                gameState.regions[regionIndex].controller = i;
                gameState.players[i].regions.push(regionIndex); 
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

// ==================== INTERFACE DO JOGO (Alterada) ====================
function renderGameMap() {
    const gameMap = document.getElementById('gameMap');
    gameMap.innerHTML = '';
    
    gameState.regions.forEach(region => {
        const regionEl = document.createElement('div');
        regionEl.className = 'region';
        regionEl.dataset.regionId = region.id;
        
        if (region.controller !== null) {
            const player = gameState.players[region.controller];
            
            // Borda e cor semi-transparente para identificação de propriedade (Sem Iluminação)
            regionEl.style.border = `3px solid ${player.color}`;
            regionEl.style.backgroundColor = player.color + '33'; 
            
            if (region.controller === gameState.currentPlayerIndex) {
                regionEl.classList.add('controlled-by-current');
            }
        }
        
        // Destaque de região selecionada - O CSS aplica a iluminação SÓ AQUI
        if (gameState.selectedRegion === region.id) {
            regionEl.classList.add('selected');
        }
        
        const structureIcon = region.structures.length > 0 ? `<div class="structure-icon">🏗️ x${region.structures.length}</div>` : '';
        
        // NOVO: Ícone de Informação 
        const infoIconHtml = `<div class="info-icon" data-region-id="${region.id}">ℹ️</div>`;
        
        regionEl.innerHTML = `
            <div class="region-name">${region.name}</div>
            <div class="region-info">${region.biome}</div>
            <div class="region-info">Nível: ${region.explorationLevel}</div>
            ${structureIcon}
            ${infoIconHtml}
        `;
        
        // NOVO LISTENER: Clique principal SÓ SELECIONA a região para ação
        regionEl.addEventListener('click', (event) => {
            // Se o clique não foi no ícone de info (evitando dupla ação)
            if (!event.target.classList.contains('info-icon')) {
                selectRegion(region.id);
            }
        });
        
        gameMap.appendChild(regionEl);
        
        // NOVO LISTENER: Clique no ícone de informação ABRE O MODAL
        const infoIconEl = regionEl.querySelector('.info-icon');
        if (infoIconEl) {
            infoIconEl.addEventListener('click', (event) => {
                event.stopPropagation(); // Impede que o clique selecione a região
                openRegionDetailsModal(region.id);
            });
        }
    });
}

// selectRegion MODIFICADA: Apenas lida com a seleção/desseleção para ações
function selectRegion(regionId) {
    const region = gameState.regions[regionId];

    // Toggle: se a mesma região for clicada, desmarca.
    if (gameState.selectedRegion === regionId) {
        gameState.selectedRegion = null;
    } else {
        // Se for uma região controlada, marca para ação.
        if (region.controller === gameState.currentPlayerIndex) {
            gameState.selectedRegion = regionId;
        } else {
            // Se for região de outro jogador ou selvagem, não marca para ação.
            gameState.selectedRegion = null;
            showFeedback("Você só pode selecionar suas próprias regiões para ações.", 'warning');
        }
    }
    
    renderGameMap();
    updateActionButtons();
}

// Ação 2.1: Função para abrir o modal de detalhes da região
function openRegionDetailsModal(regionId) {
    const region = gameState.regions[regionId];
    const modalTitle = document.getElementById('regionDetailsModalLabel');
    const modalBody = document.getElementById('regionDetailsContent');

    modalTitle.textContent = `Detalhes: ${region.name} (${region.biome})`;

    const controllerInfo = region.controller !== null
        ? gameState.players[region.controller].icon + ' ' + gameState.players[region.controller].name
        : 'Ninguém (Selvagem)';

    const resourceType = GAME_CONFIG.BIOME_BONUSES[region.biome];
    const currentIncomeBase = region.controller !== null && gameState.players[region.controller].consecutiveNoActionTurns <= 2 ? 1 : 0;

    const structureDetails = region.structures.map(s => {
        const struct = GAME_CONFIG.STRUCTURE_TYPES[s.type];
        
        let bonusText = '';
        if (struct.production_boost > 0) {
            bonusText += `${struct.production_boost} ${resourceType.substring(0, 1).toUpperCase()}${resourceType.substring(1)} | `;
        }
        if (struct.bonus_per_turn.pv > 0) {
            bonusText += `${struct.bonus_per_turn.pv} PV/Turno | `;
        }
        if (struct.bonus_per_turn.madeira > 0 || struct.bonus_per_turn.agua > 0) {
            bonusText += 'Outros Recursos | ';
        }

        return `<li>${struct.name} (Bônus: ${bonusText.slice(0, -3) || 'Nenhum'})</li>`;
    }).join('');

    
    let content = `
        <p><strong>Controlador:</strong> ${controllerInfo}</p>
        <p><strong>Bioma:</strong> ${region.biome} (Recurso Principal: ${resourceType.substring(0, 1).toUpperCase()}${resourceType.substring(1)})</p>
        <p><strong>Nível de Exploração:</strong> ${region.explorationLevel}</p>
        <hr>
        <h6>Produção Estimada (Por Turno):</h6>
        <ul>
            <li>Renda Base do Bioma: ${currentIncomeBase} ${resourceType.substring(0, 1).toUpperCase()}${resourceType.substring(1)} (Suspenso se Passivo)</li>
            <li>Bônus Exploração: ${region.explorationLevel} ${resourceType.substring(0, 1).toUpperCase()}${resourceType.substring(1)}</li>
        </ul>
        <hr>
        <h6>Estruturas Construídas (${region.structures.length}):</h6>
        <ul class="structure-list">${structureDetails || 'Nenhuma'}</ul>
    `;
    
    modalBody.innerHTML = content;
    const modal = new bootstrap.Modal(document.getElementById('regionDetailsModal'));
    modal.show();
}

function updateDisplay() {
    renderGameMap();
    updateResourcesDisplay(); 
    updatePlayersList();
    updateActionButtons(); 
    updateHeaderPlayerList();
}

function updateResourcesDisplay() { /* ... (Mantido o mesmo) ... */
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

function updatePlayersList() { /* ... (Mantido o mesmo) ... */
    const playerListDisplay = document.getElementById('playerListDisplay');
    playerListDisplay.innerHTML = '';
    
    gameState.players.forEach((player, index) => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-score-item';
        playerItem.dataset.playerIndex = index;
        
        if (index === gameState.currentPlayerIndex) {
            playerItem.classList.add('active-player');
        }
        
        if (gameState.selectedPlayerForResources === index) {
            playerItem.classList.add('viewing-resources');
        }
        
        playerItem.innerHTML = `
            <span>${player.icon} ${player.name}</span>
            <span>${player.victoryPoints} PV</span>
            ${player.hasDiversityBonus ? '<span title="Bônus de Diversidade" class="bonus-indicator">🌟</span>' : ''}
        `;
        
        playerItem.addEventListener('click', () => selectPlayerForResources(index));
        playerListDisplay.appendChild(playerItem);
    });
}

function selectPlayerForResources(playerIndex) { /* ... (Mantido o mesmo) ... */
    const player = gameState.players[playerIndex];
    
    if (gameState.selectedPlayerForResources === playerIndex) {
        gameState.selectedPlayerForResources = gameState.currentPlayerIndex;
    } else {
        gameState.selectedPlayerForResources = playerIndex;
    }
    updatePlayersList();
    
    const modalTitle = document.getElementById('playerResourcesModalLabel');
    const modalBody = document.getElementById('playerResourcesContent');
    const playerActions = playerIndex === gameState.currentPlayerIndex ? gameState.actionsTaken.join(', ') || 'Nenhuma' : 'Turno Encerrado';

    modalTitle.textContent = `Recursos Detalhados de ${player.icon} ${player.name}`;
    
    let content = `
        <p><strong>Pontos de Vitória:</strong> ${player.victoryPoints} PV</p>
        <p><strong>Ações no Turno:</strong> ${playerActions} (${gameState.actionsTaken.length}/${gameState.actionsLimit})</p>
        ${player.consecutiveNoActionTurns > 0 ? `<p class="text-warning">Turnos passivos seguidos: ${player.consecutiveNoActionTurns} (Limite: 2)</p>` : ''}
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

    const modal = new bootstrap.Modal(document.getElementById('playerResourcesModal'));
    modal.show();
}


function updateHeaderPlayerList() { /* ... (Mantido o mesmo) ... */
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

// Ação 2.2: Função para obter detalhes de custo e ganho da ação
function getActionDetails(actionType) { /* ... (Mantido o mesmo) ... */
    let details = { cost: {}, gain: {}, description: '' };

    switch (actionType) {
        case 'explorar':
            details.cost = { madeira: 2, agua: 1 };
            details.gain = { pv: 1 };
            details.description = 'Expande o domínio e aumenta o Nível de Exploração da região.';
            break;
        case 'construir':
            // Exibe o custo mínimo/típico de uma construção
            const minCost = GAME_CONFIG.STRUCTURE_TYPES['CAMPO_CULTIVO'].cost;
            const minPV = GAME_CONFIG.STRUCTURE_TYPES['CAMPO_CULTIVO'].pv_gain;
            
            details.cost = minCost;
            details.gain = { pv: minPV }; 
            details.description = 'Abre modal para selecionar estrutura e custo. PV e bônus variam (começa em +1 PV).';
            break;
        case 'recolher':
            details.cost = { madeira: 1 };
            details.gain = { madeira: 2, pedra: 2, agua: 2, pv: 1 };
            details.description = 'Troca 1 Madeira por um pacote de recursos e PV.';
            break;
        case 'negociar':
            details.cost = { ouro: 1 };
            details.gain = { pv: 1 };
            details.description = 'Inicia negociação com outro jogador. Ouro é gasto mesmo se recusado.';
            break;
    }
    return details;
}

// Ação 2.2: Atualiza o estado dos botões de ação E os tooltips
function updateActionButtons() { /* ... (Mantido o mesmo) ... */
    const player = gameState.players[gameState.currentPlayerIndex];
    const selectedRegion = gameState.selectedRegion !== null ? gameState.regions[gameState.selectedRegion] : null;
    
    const actionsRemaining = gameState.actionsLimit - gameState.actionsTaken.length;

    const actionButtons = [
        { id: 'explorarBtn', action: 'explorar' },
        { id: 'construirBtn', action: 'construir' },
        { id: 'recolherBtn', action: 'recolher' },
        { id: 'negociarBtn', action: 'negociar' }
    ];

    const isActionLimitReached = actionsRemaining <= 0;
    
    if (isActionLimitReached) {
        actionButtons.forEach(btn => document.getElementById(btn.id).disabled = true);
        document.getElementById('endTurnBtn').disabled = false;
        showFeedback(`Limite de ${gameState.actionsLimit} ações por turno atingido. Finalize seu turno.`, 'warning');
        return;
    }

    actionButtons.forEach(btn => {
        const details = getActionDetails(btn.action);
        const element = document.getElementById(btn.id);
        const actionType = btn.action;
        
        let costHtml = Object.keys(details.cost)
            .filter(res => details.cost[res] > 0)
            .map(res => `${details.cost[res]} ${res.substring(0, 1).toUpperCase()}${res.substring(1)}`)
            .join(' | ');
        
        let gainHtml = Object.keys(details.gain)
            .filter(res => details.gain[res] > 0)
            .map(res => `${details.gain[res]} ${res.substring(0, 1).toUpperCase()}${res.substring(1)}`)
            .join(' | ');
            
        let tooltipContent = `<strong>Custo:</strong> ${costHtml || 'Nenhum'}<br><strong>Ganho:</strong> ${gainHtml || 'Nenhum'}<br>${details.description}`;
        
        // Ação 2.2: Atualiza o tooltip
        element.dataset.bsOriginalTitle = tooltipContent;
        
        // Regra 2: Checagem de desativação
        const alreadyTaken = gameState.actionsTaken.includes(actionType);
        let disabled = alreadyTaken;

        switch (actionType) {
            case 'explorar':
                if (!selectedRegion || selectedRegion.controller !== gameState.currentPlayerIndex || 
                    player.resources.madeira < 2 || player.resources.agua < 1) {
                    disabled = true;
                }
                break;
            case 'construir':
                // Checa o custo da mais barata como referência
                const cheapestCost = GAME_CONFIG.STRUCTURE_TYPES['CAMPO_CULTIVO'].cost;
                if (!selectedRegion || selectedRegion.controller !== gameState.currentPlayerIndex || 
                    !checkCosts(player, cheapestCost)) {
                    disabled = true;
                }
                break;
            case 'recolher':
                if (player.resources.madeira < 1) {
                    disabled = true;
                }
                break;
            case 'negociar':
                if (player.resources.ouro < 1) {
                    disabled = true;
                }
                break;
        }
        
        element.disabled = disabled;
    });
    
    document.getElementById('endTurnBtn').disabled = false;
}

// ==================== FUNÇÕES AUXILIARES ====================
function checkCosts(player, costs) { /* ... (Mantido o mesmo) ... */
    for (const resource in costs) {
        if (player.resources[resource.toLowerCase()] < costs[resource]) {
            return false;
        }
    }
    return true;
}

function consumeResources(player, costs) { /* ... (Mantido o mesmo) ... */
    for (const resource in costs) {
        player.resources[resource.toLowerCase()] -= costs[resource];
    }
}

// Ação 2.3: Aplica a renda do turno com feedback detalhado
function applyIncome(player) { /* ... (Mantido o mesmo) ... */
    let totalIncome = {}; 
    let baseIncomeSuspended = player.consecutiveNoActionTurns > 2;
    
    if (baseIncomeSuspended) {
        showFeedback(`Renda base suspensa! Turnos passivos seguidos: ${player.consecutiveNoActionTurns}.`, 'error');
    }

    // 1. Renda Base, Exploração e Produção de Estruturas
    gameState.regions.forEach(region => {
        if (region.controller === player.id) {
            const biome = region.biome;
            const resourceType = GAME_CONFIG.BIOME_BONUSES[biome];
            
            if (resourceType) {
                let income = 0; 
                
                if (!baseIncomeSuspended) {
                    income += 1; // Renda Base (1)
                }
                
                income += region.explorationLevel; // Bônus Exploração

                // Bônus de Produção de Estruturas
                region.structures.forEach(structureEntry => {
                    const structure = GAME_CONFIG.STRUCTURE_TYPES[structureEntry.type];
                    income += structure.production_boost;
                    
                    // Renda de recursos recorrentes (excluindo PV)
                    for (const res in structure.bonus_per_turn) {
                        if (res !== 'pv') {
                            const amount = structure.bonus_per_turn[res];
                            if (amount > 0) {
                                player.resources[res] += amount;
                                totalIncome[res] = (totalIncome[res] || 0) + amount;
                            }
                        }
                    }
                });
                
                if (income > 0) {
                    player.resources[resourceType] += Math.round(income);
                    totalIncome[resourceType] = (totalIncome[resourceType] || 0) + Math.round(income);
                }
            }
            
            // 2. Renda Recorrente de PV de Estruturas
            region.structures.forEach(structureEntry => {
                const structure = GAME_CONFIG.STRUCTURE_TYPES[structureEntry.type];
                if (structure.bonus_per_turn.pv > 0) {
                    const amount = structure.bonus_per_turn.pv;
                    player.victoryPoints += amount;
                    totalIncome['pv'] = (totalIncome['pv'] || 0) + amount;
                }
            });
        }
    });
    
    // Ação 2.3: Feedback de Renda com Emoji e Nomes
    const resourceNames = { madeira: '🌲 Madeira', pedra: '🗿 Pedra', ouro: '💰 Ouro', agua: '💧 Água', pv: '✨ PV Recorrente' };

    let incomeParts = [];
    for (const res in totalIncome) {
        incomeParts.push(`${totalIncome[res]} ${resourceNames[res] || res.substring(0, 1).toUpperCase()}${res.substring(1)}`);
    }

    let feedbackMsg = incomeParts.join(', ');

    showFeedback(`Renda aplicada: ${feedbackMsg}` || "Nenhum ganho neste turno.", 'info');
}

function checkDiversityBonus(player) { /* ... (Mantido o mesmo) ... */
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
function performAction(actionType) { /* ... (Mantido o mesmo) ... */
    const player = gameState.players[gameState.currentPlayerIndex];
    const selectedRegion = gameState.selectedRegion !== null ? gameState.regions[gameState.selectedRegion] : null;

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
            if (!selectedRegion || selectedRegion.controller !== gameState.currentPlayerIndex) {
                showFeedback("Selecione uma região que você controla para construir.", 'error');
                return;
            }
            openBuildModal(player, selectedRegion);
            return; 

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
        gameState.actionsTaken.push(actionType); 
    }

    gameState.selectedRegion = null;
    updateDisplay();
    checkVictoryCondition();
}

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
                        <h5 class="card-title text-light">${structure.name}</h5> 
                        <p class="card-text small text-light-secondary">${structure.description}</p>
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

window.handleBuildSelection = function(structureKey) { /* ... (Mantido o mesmo) ... */
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
    
    gameState.actionsTaken.push('construir'); 
    showFeedback(`${structure.name} construído(a) na Região ${selectedRegion.name}! +${structure.pv_gain} PV.`, 'success');
    
    gameState.selectedRegion = null;
    updateDisplay();
    checkVictoryCondition();
};

function openNegotiationModal() { /* ... (Mantido o mesmo) ... */
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

function initiateNegotiation(targetPlayerId) { /* ... (Mantido o mesmo) ... */
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
    }
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('negotiationModal'));
    modal.hide();
    
    if (gameState.actionsTaken.includes('negociar')) {
        // Nada a fazer, já foi adicionado em performAction
    } else {
        gameState.actionsTaken.push('negociar'); 
    }
    
    updateDisplay();
}

function endTurn() { /* ... (Mantido o mesmo) ... */
    const previousPlayer = gameState.players[gameState.currentPlayerIndex];

    if (gameState.actionsTaken.length === 0) {
        previousPlayer.consecutiveNoActionTurns = (previousPlayer.consecutiveNoActionTurns || 0) + 1;
        
        if (previousPlayer.consecutiveNoActionTurns > 2) {
            showFeedback(`ATENÇÃO: Renda base de ${previousPlayer.icon} ${previousPlayer.name} será suspensa no próximo turno.`, 'error');
        } else if (previousPlayer.consecutiveNoActionTurns === 2) {
            showFeedback(`${previousPlayer.icon} ${previousPlayer.name} atingiu 2 turnos passivos seguidos. Mais um e a renda base será suspensa.`, 'warning');
        }
    } else {
        previousPlayer.consecutiveNoActionTurns = 0;
    }
    
    gameState.turn++;
    
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    
    const player = gameState.players[gameState.currentPlayerIndex];
    
    applyIncome(player);
    
    const diversityBonus = checkDiversityBonus(player);

    if (diversityBonus > 0) {
        player.victoryPoints += diversityBonus;
        showFeedback(`Bônus de Diversidade de Biomas! +${diversityBonus} PV.`, 'success');
    }
    
    gameState.actionsTaken = []; 
    gameState.selectedRegion = null;
    updateDisplay();
    checkVictoryCondition(); 
}

function checkVictoryCondition() { /* ... (Mantido o mesmo) ... */
    const winner = gameState.players.find(p => p.victoryPoints >= GAME_CONFIG.VICTORY_POINTS);
    if (winner) {
        showFeedback(`${winner.icon} ${winner.name} venceu com ${winner.victoryPoints} PV!`, 'success');
        setTimeout(() => location.reload(), 3000);
    }
}

// ==================== INTERFACE ====================
function showFeedback(message, type = 'info') { /* ... (Mantido o mesmo) ... */
    const feedbackEl = document.getElementById('feedbackMessage');
    feedbackEl.innerHTML = message; 
    feedbackEl.className = `${type} show`;
    
    setTimeout(() => {
        feedbackEl.classList.remove('show');
    }, 3000);
}

// ==================== EVENT LISTENERS E INICIALIZAÇÃO ====================
document.getElementById('addPlayerBtn').addEventListener('click', () => { /* ... (Mantido o mesmo) ... */
    const name = document.getElementById('playerName').value.trim();
    const selectedIcon = document.querySelector('.icon-option.selected');
    
    if (!name || !selectedIcon) {
        showFeedback('Preencha nome e selecione um ícone!', 'error');
        return;
    }
    
    if (addPlayer(name, selectedIcon.textContent)) {
        document.getElementById('playerName').value = '';
        selectedIcon.classList.remove('selected');
        showFeedback(`${name} adicionado!`, 'success');
    }
});

document.getElementById('startGameBtn').addEventListener('click', () => { /* ... (Mantido o mesmo) ... */
    gameState.gameStarted = true;
    document.getElementById('initialScreen').classList.add('hidden');
    initializeGame();
});

document.getElementById('explorarBtn').addEventListener('click', () => performAction('explorar'));
document.getElementById('construirBtn').addEventListener('click', () => performAction('construir'));
document.getElementById('recolherBtn').addEventListener('click', () => performAction('recolher'));
document.getElementById('negociarBtn').addEventListener('click', () => performAction('negociar'));
document.getElementById('endTurnBtn').addEventListener('click', endTurn);

document.addEventListener('DOMContentLoaded', () => { /* ... (Mantido o mesmo) ... */
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
    
    // Ação 2.2: Inicialização dos Tooltips do Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        // Permite HTML para a formatação de custo/ganho
        return new bootstrap.Tooltip(tooltipTriggerEl, { html: true, sanitize: false }); 
    });
});
