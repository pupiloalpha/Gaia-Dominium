/*
    Conteúdo refatorado do arquivo main.js, aplicando a Fase 1 e Correções (1-5):
    
    Implementação da Fase 2: Experiência do Usuário (UX/UI)
    - 2.1 UX: Detalhes da Região (Pop-up flutuante)
    - 2.2 UX: Custos e Ganhos Visíveis (Tooltips)
    - 2.3 Alerta de Vitória (Modal de Fim de Jogo)
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
            effect: 'Abre o painel de negociação. Troca de recurso aleatória com outro jogador **+1 PV para ambos**. Custo: 1 Ouro. (Ação Geral)',
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
        showFeedback(`Você já realizou a ação "${actionType.toUpperCase()}" neste turno.`, 'warning');
        return;
    }

    const selectedRegion = gameState.selectedRegion !== null ? gameState.regions[gameState.selectedRegion] : null;

    switch (actionType) {
        case 'explorar':
            const exploreCosts = GAME_CONFIG.ACTION_DETAILS.explorar.cost;
            if (!selectedRegion || selectedRegion.controller !== gameState.currentPlayerIndex) {
                 showFeedback("Selecione uma região que você controla para explorar.", 'error');
                 return;
            }
            if (selectedRegion.explorationLevel > 0) {
                 showFeedback("Esta região já foi explorada.", 'warning');
                 return;
            }
            if (checkCosts(player, exploreCosts)) {
                consumeResources(player, exploreCosts);
                selectedRegion.explorationLevel += 1;
                player.victoryPoints += 1;
                showFeedback('Região explorada! +1 PV e renda bônus por turno!', 'success');
                actionSuccess = true;
            } else {
                showFeedback(`Recursos insuficientes. Necessário: ${Object.entries(exploreCosts).map(([r, c]) => `${c} ${r.substring(0, 1).toUpperCase()}`).join(', ')}.`, 'error');
            }
            break;

        case 'construir': 
            if (!selectedRegion || selectedRegion.controller !== gameState.currentPlayerIndex) {
                showFeedback("Selecione uma região que você controla para construir.", 'error');
                return;
            }
            openBuildModal(player, selectedRegion);
            return; // Espera a seleção do modal

        case 'recolher':
            const gatherCosts = GAME_CONFIG.ACTION_DETAILS.recolher.cost;
            if (checkCosts(player, gatherCosts)) {
                 consumeResources(player, gatherCosts);
                 player.resources.madeira += 2;
                 player.resources.pedra += 2;
                 player.resources.agua += 2;
                 player.victoryPoints += 1;
                 showFeedback('Recursos recolhidos! +1 PV', 'success');
                 actionSuccess = true;
            } else {
                showFeedback(`Recursos insuficientes. Necessário: ${Object.entries(gatherCosts).map(([r, c]) => `${c} ${r.substring(0, 1).toUpperCase()}`).join(', ')}.`, 'error');
            }
            break;

        case 'negociar':
            const negotiateCosts = GAME_CONFIG.ACTION_DETAILS.negociar.cost;
            if (checkCosts(player, negotiateCosts)) {
                player.resources.ouro -= 1; // Custo de ouro consumido imediatamente
                openNegotiationModal();
                actionSuccess = true;
            } else {
                showFeedback(`Recursos insuficientes. Necessário: ${Object.entries(negotiateCosts).map(([r, c]) => `${c} ${r.substring(0, 1).toUpperCase()}`).join(', ')}.`, 'error');
            }
            break;
    }

    if (actionSuccess) {
        gameState.actionsTaken.push(actionType);
        // Regra 3: Se o jogador realizou qualquer ação, o contador de inatividade é zerado
        player.consecutiveNoActionTurns = 0;
    }
    
    gameState.selectedRegion = null;
    updateDisplay();
    checkVictoryCondition();
}

function endTurn() {
    if (gameState.gameOver) return; // NOVO (Fase 2.3)
    
    const player = gameState.players[gameState.currentPlayerIndex];
    
    // Regra 3: Se não realizou ações, incrementa o contador de inatividade
    if (gameState.actionsTaken.length === 0) {
        player.consecutiveNoActionTurns++;
        showFeedback(`Nenhuma ação realizada. Passividade: ${player.consecutiveNoActionTurns}/3.`, 'warning');
    }
    
    // Passa para o próximo jogador
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    gameState.turn++;
    
    startTurn();
}

// ==================== CONDIÇÃO DE VITÓRIA (Fase 2.3) ====================
function checkVictoryCondition() {
    if (gameState.gameOver) return;
    
    const winner = gameState.players.find(p => p.victoryPoints >= GAME_CONFIG.VICTORY_POINTS);
    
    if (winner) {
        gameState.gameOver = true;
        
        const victoryContent = document.getElementById('victoryContent');
        victoryContent.innerHTML = `
            <h2>Parabéns, ${winner.icon} ${winner.name}!</h2>
            <p>Você atingiu **${winner.victoryPoints} Pontos de Vitória** e dominou Gaia!</p>
            <p>O jogo durou **${gameState.turn} turnos**.</p>
            <hr>
            <h6>Placar Final:</h6>
            <ul>
                ${gameState.players.map(p => `<li>${p.icon} ${p.name}: ${p.victoryPoints} PV</li>`).join('')}
            </ul>
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('victoryModal'));
        modal.show();
    }
}


// ==================== INTERFACE DO JOGO ====================
function renderGameMap() {
    gameMapEl.innerHTML = '';
    
    gameState.regions.forEach(region => {
        const regionEl = document.createElement('div');
        regionEl.className = 'region';
        regionEl.dataset.regionId = region.id;
        
        const isControlled = region.controller !== null;
        
        if (isControlled) {
            const player = gameState.players[region.controller];
            regionEl.style.border = `3px solid ${player.color}`;
            regionEl.style.backgroundColor = player.color + '33';
            
            if (region.controller === gameState.currentPlayerIndex) {
                // Adiciona a variável CSS para a animação de pulso na região do jogador atual
                regionEl.style.setProperty('--region-border-color', player.color);
                regionEl.classList.add('controlled-by-current');
            }
        }
        
        if (gameState.selectedRegion === region.id) {
            regionEl.classList.add('selected');
        }
        
        // Exibição de estruturas (para UX)
        const structureIcon = region.structures.length > 0 ? 
            `<div class="structure-icon" title="${region.structures.length} Estrutura(s)">🏗️ x${region.structures.length}</div>` : '';
        
        const controllerName = isControlled ? gameState.players[region.controller].name : 'Ninguém';
        const controllerIcon = isControlled ? gameState.players[region.controller].icon : '⚪';

        regionEl.innerHTML = `
            <div class="region-name">${region.name}</div>
            <div class="region-info">${region.biome}</div>
            <div class="region-info">${controllerIcon} ${controllerName}</div>
            <div class="region-info">Exploração: ${region.explorationLevel}</div>
            ${structureIcon}
        `;
        
        regionEl.addEventListener('click', () => selectRegion(region.id));
        // NOVO: Eventos para Pop-up de Detalhes (Fase 2.1)
        regionEl.addEventListener('mouseover', (e) => showRegionDetails(region.id, e));
        regionEl.addEventListener('mouseout', hideRegionDetails);
        
        gameMapEl.appendChild(regionEl);
    });
}

// NOVO: Funções para o Pop-up de Detalhes da Região (Fase 2.1)
function handleMouseMove(event) {
    // Apenas move o pop-up se ele estiver visível
    if (regionDetailsPopupEl.classList.contains('show')) {
        // Move o pop-up ligeiramente para a direita e abaixo do cursor
        regionDetailsPopupEl.style.left = `${event.pageX + 15}px`;
        regionDetailsPopupEl.style.top = `${event.pageY + 15}px`;

        // Ajuste para evitar que o pop-up saia da tela
        const rect = regionDetailsPopupEl.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Ajuste horizontal
        if (rect.right > viewportWidth - 20) {
            regionDetailsPopupEl.style.left = `${event.pageX - rect.width - 15}px`;
        }
        // Ajuste vertical (opcional, pois o mapa geralmente é menor que a viewport)
        if (rect.bottom > viewportHeight - 20) {
            regionDetailsPopupEl.style.top = `${event.pageY - rect.height - 15}px`;
        }
    }
}

function showRegionDetails(regionId, event) {
    const region = gameState.regions[regionId];
    const isControlled = region.controller !== null;
    const controller = isControlled ? gameState.players[region.controller] : null;
    
    let structuresInfo = 'Nenhuma';
    if (region.structures.length > 0) {
        const counts = region.structures.reduce((acc, s) => {
            acc[s.type] = (acc[s.type] || 0) + 1;
            return acc;
        }, {});
        structuresInfo = Object.entries(counts)
            .map(([type, count]) => `${GAME_CONFIG.STRUCTURE_TYPES[type].name} (x${count})`)
            .join(', ');
    }

    const biomeBonus = GAME_CONFIG.BIOME_BONUSES[region.biome];
    let productionBoost = 0;
    let recurrentBonus = [];
    
    region.structures.forEach(s => {
        const struct = GAME_CONFIG.STRUCTURE_TYPES[s.type];
        productionBoost += struct.production_boost;
        for (const res in struct.bonus_per_turn) {
            if (struct.bonus_per_turn[res] > 0) {
                recurrentBonus.push(`+${struct.bonus_per_turn[res]} ${res.toUpperCase()}`);
            }
        }
    });
    
    const recurrentInfo = recurrentBonus.length > 0 ? recurrentBonus.join(', ') : 'Nenhum';

    regionDetailsPopupEl.innerHTML = `
        <div class="popup-title">${region.name} (${region.biome})</div>
        <div class="popup-info-item"><strong>Controlador:</strong> ${controller ? controller.icon + ' ' + controller.name : 'Ninguém'}</div>
        <div class="popup-info-item"><strong>Nível Exploração:</strong> ${region.explorationLevel}</div>
        <hr style="margin: 5px 0;">
        <div class="popup-info-item"><strong>Renda Base (+1):</strong> ${biomeBonus.substring(0, 1).toUpperCase()}${biomeBonus.substring(1)}</div>
        <div class="popup-info-item"><strong>Bônus Exploração:</strong> +${region.explorationLevel} ${biomeBonus.substring(0, 1).toUpperCase()}${biomeBonus.substring(1)}</div>
        <div class="popup-info-item"><strong>Bônus Estruturas:</strong> +${productionBoost} ${biomeBonus.substring(0, 1).toUpperCase()}${biomeBonus.substring(1)}</div>
        <div class="popup-info-item"><strong>Recorrente:</strong> ${recurrentInfo}</div>
        <hr style="margin: 5px 0;">
        <div class="popup-info-item"><strong>Estruturas:</strong> ${structuresInfo}</div>
    `;
    
    // Posicionamento inicial (será ajustado pelo handleMouseMove)
    regionDetailsPopupEl.style.left = `${event.pageX + 15}px`;
    regionDetailsPopupEl.style.top = `${event.pageY + 15}px`;
    regionDetailsPopupEl.classList.add('show');
}

function hideRegionDetails() {
    regionDetailsPopupEl.classList.remove('show');
}


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
            showFeedback(`Você só pode selecionar regiões que você controla para ações. Região de ${gameState.players[region.controller].icon} ${gameState.players[region.controller].name}.`, 'warning');
        }
    }
    
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
    const player = gameState.players[playerIndex];
    
    if (gameState.selectedPlayerForResources === playerIndex) {
        gameState.selectedPlayerForResources = gameState.currentPlayerIndex;
    } else {
        gameState.selectedPlayerForResources = playerIndex;
    }
    updatePlayersList();
    
    const modalTitle = document.getElementById('playerResourcesModalLabel');
    const modalBody = document.getElementById('playerResourcesContent');
    
    // Lista de estruturas do jogador
    let playerStructures = {};
    gameState.regions.forEach(region => {
        if (region.controller === playerIndex) {
            region.structures.forEach(s => {
                playerStructures[s.type] = (playerStructures[s.type] || 0) + 1;
            });
        }
    });

    const structuresHtml = Object.entries(playerStructures)
        .map(([type, count]) => `<li>${GAME_CONFIG.STRUCTURE_TYPES[type].name} (x${count})</li>`)
        .join('');
        
    const playerActions = playerIndex === gameState.currentPlayerIndex ? gameState.actionsTaken.join(', ') || 'Nenhuma' : 'Turno Encerrado';


    modalTitle.textContent = `Recursos Detalhados de ${player.icon} ${player.name}`;
    
    let content = `
        <p><strong>Pontos de Vitória:</strong> <span class="text-primary fw-bold">${player.victoryPoints} PV</span></p>
        <p><strong>Ações no Turno:</strong> ${playerActions} (${gameState.actionsTaken.length}/${gameState.actionsLimit})</p>
        ${player.consecutiveNoActionTurns > 0 ? `<p class="text-warning">Turnos passivos seguidos: ${player.consecutiveNoActionTurns}</p>` : ''}
        <hr>
        <h6>Recursos:</h6>
        <ul>
            <li class="resource-list-item"><span>🌲 Madeira:</span> <strong>${player.resources.madeira}</strong></li>
            <li class="resource-list-item"><span>🗿 Pedra:</span> <strong>${player.resources.pedra}</strong></li>
            <li class="resource-list-item"><span>💰 Ouro:</span> <strong>${player.resources.ouro}</strong></li>
            <li class="resource-list-item"><span>💧 Água:</span> <strong>${player.resources.agua}</strong></li>
        </ul>
        <hr>
        <p><strong>Regiões Controladas:</strong> ${player.regions ? player.regions.length : 0}</p>
        <p class="text-success">${player.hasDiversityBonus ? '🌟 Bônus de Diversidade Adquirido' : 'Bônus de Diversidade Pendente'}</p>
        <h6>Estruturas:</h6>
        <ul>
            ${structuresHtml || '<li>Nenhuma Estrutura Construída</li>'}
        </ul>
    `;
    
    modalBody.innerHTML = content;

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

// Atualiza o estado dos botões de ação e adiciona tooltips (Fase 2.2)
function updateActionButtons() {
    const player = gameState.players[gameState.currentPlayerIndex];
    const selectedRegion = gameState.selectedRegion !== null ? gameState.regions[gameState.selectedRegion] : null;
    const actionsRemaining = gameState.actionsLimit - gameState.actionsTaken.length;
    const isActionLimitReached = actionsRemaining <= 0 || gameState.gameOver; // NOVO: Bloqueia se o jogo acabou

    const explorarBtn = document.getElementById('explorarBtn');
    const construirBtn = document.getElementById('construirBtn');
    const recolherBtn = document.getElementById('recolherBtn');
    const negociarBtn = document.getElementById('negociarBtn');
    const endTurnBtn = document.getElementById('endTurnBtn');
    
    // Regra 2: Bloqueia todos os botões de ação se o limite for atingido ou jogo acabou
    if (isActionLimitReached && !gameState.gameOver) {
        explorarBtn.disabled = construirBtn.disabled = recolherBtn.disabled = negociarBtn.disabled = true;
        endTurnBtn.disabled = false;
        showFeedback(`Limite de ${gameState.actionsLimit} ações por turno atingido. Finalize seu turno.`, 'warning');
        return;
    } else if (gameState.gameOver) { // Jogo acabou
        explorarBtn.disabled = construirBtn.disabled = recolherBtn.disabled = negociarBtn.disabled = endTurnBtn.disabled = true;
        return;
    }
    
    // Funções auxiliares para checar se a ação já foi feita (Regra 2)
    const explored = gameState.actionsTaken.includes('explorar');
    const built = gameState.actionsTaken.includes('construir');
    const gathered = gameState.actionsTaken.includes('recolher');
    const negotiated = gameState.actionsTaken.includes('negociar');

    // Explorar: 2 Madeira + 1 Água
    const canExplore = !explored && selectedRegion && selectedRegion.controller === gameState.currentPlayerIndex && selectedRegion.explorationLevel === 0 && checkCosts(player, GAME_CONFIG.ACTION_DETAILS.explorar.cost);
    explorarBtn.disabled = !canExplore;
    explorarBtn.title = `Custo: ${GAME_CONFIG.ACTION_DETAILS.explorar.cost.madeira} M, ${GAME_CONFIG.ACTION_DETAILS.explorar.cost.agua} A. Efeito: ${GAME_CONFIG.ACTION_DETAILS.explorar.effect}`;

    // Construir: Abre modal, mas o custo mais alto é 5 P, 5 M, 2 O, 2 A
    const canBuild = !built && selectedRegion && selectedRegion.controller === gameState.currentPlayerIndex && selectedRegion.explorationLevel > 0;
    construirBtn.disabled = !canBuild;
    construirBtn.title = `Efeito: ${GAME_CONFIG.ACTION_DETAILS.construir.effect}`;
    if (canBuild) {
        // Exibe o custo máximo para o tooltip
        const maxCosts = { madeira: 5, pedra: 5, ouro: 2, agua: 2 };
        construirBtn.title = `Custo Máx: ${maxCosts.madeira} M, ${maxCosts.pedra} P, ${maxCosts.ouro} O, ${maxCosts.agua} A. Efeito: ${GAME_CONFIG.ACTION_DETAILS.construir.effect}`;
    }

    // Recolher: 1 Madeira
    const canGather = !gathered && checkCosts(player, GAME_CONFIG.ACTION_DETAILS.recolher.cost);
    recolherBtn.disabled = !canGather;
    recolherBtn.title = `Custo: ${GAME_CONFIG.ACTION_DETAILS.recolher.cost.madeira} M. Efeito: ${GAME_CONFIG.ACTION_DETAILS.recolher.effect}`;
    
    // Negociar: 1 Ouro
    const canNegotiate = !negotiated && checkCosts(player, GAME_CONFIG.ACTION_DETAILS.negociar.cost);
    negociarBtn.disabled = !canNegotiate;
    negociarBtn.title = `Custo: ${GAME_CONFIG.ACTION_DETAILS.negociar.cost.ouro} O. Efeito: ${GAME_CONFIG.ACTION_DETAILS.negociar.effect}`;

    endTurnBtn.disabled = false; // Sempre pode finalizar o turno
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

// Abre o modal de negociação
function openNegotiationModal() {
    const player = gameState.players[gameState.currentPlayerIndex];
    const otherPlayers = gameState.players.filter(p => p.id !== player.id);

    let content = '<h6>Selecione um jogador para tentar negociar:</h6>';
    content += '<div class="row">';
    
    otherPlayers.forEach(targetPlayer => {
        // Simplesmente mostra o jogador, a negociação é aleatória no `initiateNegotiation`
        content += `
            <div class="col-md-6 mb-3">
                <button class="btn btn-secondary w-100" onclick="initiateNegotiation(${targetPlayer.id})">
                    ${targetPlayer.icon} ${targetPlayer.name}
                </button>
            </div>
        `;
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
    
    // Seleciona um recurso para oferecer e um para receber (aleatório)
    const offerType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
    const receiveType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
    
    // Verifica se ambos têm o recurso para a troca 1:1
    if (player.resources[offerType] > 0 && targetPlayer.resources[receiveType] > 0) {
        // Executa a troca
        player.resources[offerType]--;
        targetPlayer.resources[receiveType]--;
        player.resources[receiveType]++;
        targetPlayer.resources[offerType]++;
        
        // Ganho de PV por negociação
        player.victoryPoints += 1;
        targetPlayer.victoryPoints += 1;
        
        showFeedback(`Negociação bem-sucedida com ${targetPlayer.icon} ${targetPlayer.name}: ${offerType.toUpperCase()} por ${receiveType.toUpperCase()}! +1 PV para ambos.`, 'success');
    } else {
        showFeedback(`Negociação falhou. Um dos jogadores não tinha os recursos para a troca.`, 'error');
        // Não reverte o custo de Ouro, pois a ação de negociar foi tentada.
    }
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('negotiationModal'));
    modal.hide();
    
    updateDisplay();
    checkVictoryCondition();
}

// NOVO: Adiciona a renderização do manual de estruturas (UX)
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
