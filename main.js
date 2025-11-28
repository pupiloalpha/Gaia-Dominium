/*
    Conteúdo refatorado do arquivo main.js, aplicando a Fase 1:
    - Estruturas definidas (Ação 1.2).
    - Renda refinada com bônus de exploração e estruturas (Ação 1.3).
    - Bônus de Diversidade de Biomas implementado (Ação 1.1).
    - Melhoria visual de regiões controladas (Ação 1.4 - via JS).
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
    
    // === NOVAS CONFIGURAÇÕES DA FASE 1 ===
    // Ação 1.1: Bônus de Diversidade
    ALL_BIOMES: ['Floresta Tropical', 'Floresta Temperada', 'Savana', 'Pântano'], 
    DIVERSITY_BONUS_PV: 3, 

    // Ação 1.2: Tipos de Estruturas
    STRUCTURE_TYPES: {
        'POSTO_AVANCADO': {
            name: 'Posto Avançado',
            description: 'Aumenta a produção base do bioma em +1.',
            cost: { madeira: 3, pedra: 2, agua: 1, ouro: 0 },
            pv_gain: 2, 
            production_boost: 1, // Bônus fixo para o recurso principal do bioma
            bonus_per_turn: { pv: 0, madeira: 0, pedra: 0, ouro: 0, agua: 0 }
        },
        'EDIFICIO_PRINCIPAL': {
            name: 'Edifício Principal',
            description: 'Concede alto PV e PV recorrente.',
            cost: { madeira: 5, pedra: 5, ouro: 2, agua: 2 },
            pv_gain: 5,
            production_boost: 0,
            bonus_per_turn: { pv: 1 } // +1 PV por turno
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

    // Mapeamento Bioma -> Recurso Principal (necessário para renda)
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
    negotiationInProgress: false
};

// ==================== INICIALIZAÇÃO ====================
function initializeGame() {
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
        for (let j = 0; j < regionsPerPlayer; j++) {
            if (regionIndex < gameState.regions.length) {
                gameState.regions[regionIndex].controller = i;
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
        hasDiversityBonus: false // Ação 1.1: Novo flag para bônus único
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

function selectRegion(regionId) {
    gameState.selectedRegion = gameState.selectedRegion === regionId ? null : regionId;
    renderGameMap();
    updateActionButtons();
}

function updateDisplay() {
    renderGameMap();
    updateResourcesDisplay();
    updatePlayersList();
    updateActionButtons();
    updateHeaderPlayerList();
}

function updateResourcesDisplay() {
    const player = gameState.players[gameState.selectedPlayerForResources];
    const recursosDisplay = document.getElementById('recursosDisplay');
    const recursosTitle = document.getElementById('recursosTitle');
    
    // Atualizar título
    if (gameState.selectedPlayerForResources === gameState.currentPlayerIndex) {
        recursosTitle.textContent = `Recursos (${player.icon} ${player.name})`;
    } else {
        recursosTitle.textContent = `Recursos (${player.icon} ${player.name}) - Visualizando`;
    }
    
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
        
        // Se for o jogador selecionado para visualizar recursos
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

function selectPlayerForResources(playerIndex) {
    // Toggle: se clicar no mesmo, desseleciona
    if (gameState.selectedPlayerForResources === playerIndex) {
        gameState.selectedPlayerForResources = gameState.currentPlayerIndex;
    } else {
        gameState.selectedPlayerForResources = playerIndex;
    }
    updateDisplay();
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

function updateActionButtons() {
    const player = gameState.players[gameState.currentPlayerIndex];
    const selectedRegion = gameState.selectedRegion !== null ? gameState.regions[gameState.selectedRegion] : null;
    
    // Explorar: 2 Madeira + 1 Água
    document.getElementById('explorarBtn').disabled = 
        !selectedRegion || selectedRegion.controller !== gameState.currentPlayerIndex || 
        player.resources.madeira < 2 || player.resources.agua < 1;
    
    // Construir: 3 Madeira + 2 Pedra + 1 Ouro (Baseado na estrutura mais cara original)
    // OBS: Na Fase 2, esta checagem será aprimorada.
    document.getElementById('construirBtn').disabled = 
        !selectedRegion || selectedRegion.controller !== gameState.currentPlayerIndex || 
        player.resources.madeira < 5 || player.resources.pedra < 5 || player.resources.ouro < 2 || player.resources.agua < 2;
    
    // Recolher: 1 Madeira
    document.getElementById('recolherBtn').disabled = 
        player.resources.madeira < 1;
    
    // Negociar: 1 Ouro
    document.getElementById('negociarBtn').disabled = 
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

// Aplica a renda do turno (Ação 1.3)
function applyIncome(player) {
    let totalIncome = {}; // Para feedback futuro
    
    // 1. Renda Base de Biomas, Bônus de Exploração e Bônus de Produção de Estruturas
    gameState.regions.forEach(region => {
        if (region.controller === player.id) {
            const biome = region.biome;
            const resourceType = GAME_CONFIG.BIOME_BONUSES[biome];
            
            if (resourceType) {
                // Renda Base (1 por região)
                let income = 1; 
                // Bônus de Exploração (1 unidade de bônus por nível. No original, explorationLevel++.)
                income += region.explorationLevel; 

                // Bônus de Produção de Estruturas (production_boost)
                region.structures.forEach(structureEntry => {
                    const structure = GAME_CONFIG.STRUCTURE_TYPES[structureEntry.type];
                    income += structure.production_boost;
                });
                
                // Aplica a renda
                player.resources[resourceType] += Math.round(income);
                // (Para feedback)
                totalIncome[resourceType] = (totalIncome[resourceType] || 0) + Math.round(income);
            }
            
            // 2. Renda Recorrente de Estruturas (PV ou outros recursos fixos)
            region.structures.forEach(structureEntry => {
                const structure = GAME_CONFIG.STRUCTURE_TYPES[structureEntry.type];
                if (structure.bonus_per_turn) {
                    for (const resource in structure.bonus_per_turn) {
                        const amount = structure.bonus_per_turn[resource];
                        if (amount > 0) {
                            if (resource === 'pv') {
                                player.victoryPoints += amount;
                                // (Para feedback)
                                totalIncome['PV Recorrente'] = (totalIncome['PV Recorrente'] || 0) + amount;
                            } else if (player.resources.hasOwnProperty(resource)) {
                                player.resources[resource] += amount;
                                // (Para feedback)
                                totalIncome[resource] = (totalIncome[resource] || 0) + amount;
                            }
                        }
                    }
                }
            });
        }
    });
    
    // Feedback de Renda (melhorado na Fase 2, aqui é apenas um sumário)
    let feedbackMsg = "Renda de Biomas e Estruturas recebida: ";
    for (const res in totalIncome) {
        feedbackMsg += `${totalIncome[res]} ${res}, `;
    }
    showFeedback(feedbackMsg.slice(0, -2), 'info');
}

// Checa o Bônus de Diversidade (Ação 1.1)
function checkDiversityBonus(player) {
    if (player.hasDiversityBonus) return 0; 
    
    const controlledBiomes = new Set();
    
    // Coleta biomas das regiões controladas
    gameState.regions.forEach(region => {
        if (region.controller === player.id) {
            controlledBiomes.add(region.biome);
        }
    });

    // Se o número de biomas únicos for igual ao total
    if (controlledBiomes.size === GAME_CONFIG.ALL_BIOMES.length) {
        player.hasDiversityBonus = true; // Marca como obtido (bônus único)
        return GAME_CONFIG.DIVERSITY_BONUS_PV;
    }
    
    return 0;
}

// ==================== AÇÕES DO JOGO ====================
function performAction(actionType) {
    const player = gameState.players[gameState.currentPlayerIndex];
    const selectedRegion = gameState.selectedRegion !== null ? gameState.regions[gameState.selectedRegion] : null;
    
    switch(actionType) {
        case 'explorar':
            if (selectedRegion && selectedRegion.controller === gameState.currentPlayerIndex) {
                // Checagem de custo já está em updateActionButtons, mas mantemos o consumo aqui
                player.resources.madeira -= 2;
                player.resources.agua -= 1;
                selectedRegion.explorationLevel++;
                player.victoryPoints += 1;
                showFeedback('Região explorada! +1 PV', 'success');
            }
            break;
            
        case 'construir':
            // === Lógica de seleção e aplicação de estruturas (Ação 1.2) ===
            if (!selectedRegion || selectedRegion.controller !== gameState.currentPlayerIndex) {
                showFeedback("Selecione uma região que você controla para construir.", 'error');
                return;
            }
            
            const structureTypes = GAME_CONFIG.STRUCTURE_TYPES;
            
            // Prompt simples para MVP.
            let structureOptions = Object.keys(structureTypes).map(key => `${key} (${structureTypes[key].name})`).join(', ');
            const structureTypeInput = prompt(`Qual estrutura construir? Digite uma das opções: ${structureOptions}`);
            
            if (!structureTypeInput) {
                showFeedback("Construção cancelada.", 'info');
                return;
            }

            const structureKey = structureTypeInput.toUpperCase();
            const structure = structureTypes[structureKey];

            if (!structure) {
                showFeedback("Tipo de estrutura inválido.", 'error');
                return;
            }
            
            // 1. Verificar Custos
            if (!checkCosts(player, structure.cost)) {
                showFeedback(`Recursos insuficientes para construir ${structure.name}.`, 'error');
                return;
            }
            
            // 2. Aplicar Custos
            consumeResources(player, structure.cost); 
            
            // 3. Adicionar Estrutura e Ganho de PV Imediato
            selectedRegion.structures.push({ type: structureKey, name: structure.name }); 
            player.structures++;
            player.victoryPoints += structure.pv_gain; 
            
            // 4. Finalizar
            showFeedback(`${structure.name} construído(a) na Região ${selectedRegion.name}! +${structure.pv_gain} PV.`, 'success');
            // Fim Ação 1.2
            break;
            
        case 'recolher':
            player.resources.madeira -= 1;
            player.resources.madeira += 2;
            player.resources.pedra += 2;
            player.resources.agua += 2;
            player.victoryPoints += 1;
            showFeedback('Recursos recolhidos! +1 PV', 'success');
            break;
            
        case 'negociar':
            player.resources.ouro -= 1;
            openNegotiationModal();
            break;
    }
    
    gameState.selectedRegion = null;
    updateDisplay();
    checkVictoryCondition();
}

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
    
    // Simples: oferecer 1 recurso por 1 recurso
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
    }
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('negotiationModal'));
    modal.hide();
    
    updateDisplay();
}

function endTurn() {
    gameState.turn++;
    
    // Passar o turno (o jogador atual será o próximo na lista)
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    gameState.selectedPlayerForResources = gameState.currentPlayerIndex; // Resetar visualização de recursos
    
    const player = gameState.players[gameState.currentPlayerIndex];
    
    // === Aplicar Renda e Bônus de Estruturas (Ação 1.3) ===
    applyIncome(player);
    
    // === Aplicar Bônus de Diversidade (Ação 1.1) ===
    const diversityBonus = checkDiversityBonus(player);

    if (diversityBonus > 0) {
        player.victoryPoints += diversityBonus;
        showFeedback(`Bônus de Diversidade de Biomas! +${diversityBonus} PV.`, 'success');
    }
    
    gameState.selectedRegion = null;
    updateDisplay();
    checkVictoryCondition(); // Checa vitória após renda/bônus
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
