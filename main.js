/*
    Conteúdo COMPLETO e ATUALIZADO do arquivo main.js
    
    MODIFICAÇÕES DESTA FASE:
    1. CORREÇÃO DE BOTÕES (updateActionButtons): Os botões 'explorar' e 'construir' são agora desabilitados (propriedade 'disabled') se nenhuma região estiver selecionada.
    2. MANUAL EM ABAS (renderManualContent): Refatoração para preencher as 3 abas solicitadas (Apresentação, Ações, Informações Adicionais).
    3. CORREÇÃO DE FLUXO E DISPLAY (CSS): A cor do seletor de região foi delegada ao CSS (.region.selected) para garantir a cor branca.
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
    
    // DETALHES DE AÇÃO PARA TOOLTIPS 
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
            effect: 'Abre o painel de negociação para troca de recursos e **regiões** com outro jogador. Custo: 1 Ouro. (Ação Geral)',
        },
    },
    
    // CUSTO PARA EXPLORAR ÁREA NEUTRA (PV + Recursos)
    EXPLORE_NEUTRAL_COST: { madeira: 2, agua: 1, pv: 2 }, 
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
    selectedAction: null, // Não será mais usado neste novo fluxo
    negotiationInProgress: false,
    gameOver: false,
    
    // Regra 2: Limite de Ações
    actionsTaken: [], 
    actionsLimit: 2,
};

// ==================== ELEMENTOS DA UI ====================
const gameMapEl = document.getElementById('gameMap');
const regionDetailsPopupEl = document.getElementById('regionDetailsPopup');

// ==================== FUNÇÕES AUXILIARES COM PV (Item 2.2) ====================
function showFeedback(message, type) {
    const feedbackEl = document.getElementById('feedbackMessage');
    feedbackEl.textContent = message;
    feedbackEl.className = `show ${type}`;
    setTimeout(() => {
        feedbackEl.classList.remove('show');
    }, 3000);
}

// Função que checa custos, incluindo PV
function checkCosts(player, costs) {
    for (const resource in costs) {
        if (resource === 'pv') {
            if (player.victoryPoints < costs.pv) {
                return false;
            }
        } else if (player.resources[resource] < costs[resource]) {
            return false;
        }
    }
    return true;
}

// Função que consome recursos, incluindo PV
function consumeResources(player, costs) {
    for (const resource in costs) {
        if (resource === 'pv') {
            player.victoryPoints -= costs.pv;
        } else {
            player.resources[resource] -= costs[resource];
        }
    }
}

// ==================== INICIALIZAÇÃO ====================
function initializeGame() {
    gameState.players.forEach(p => p.consecutiveNoActionTurns = 0);
    createRegions();
    distributeRegions();
    updateDisplay();
    // Renderiza o manual na inicialização (Novo Item 5)
    renderManualContent(); 
}

function createRegions() {
    gameState.regions = [];
    for (let i = 0; i < GAME_CONFIG.GRID_SIZE * GAME_CONFIG.GRID_SIZE; i++) {
        let regionName = GAME_CONFIG.REGION_NAMES[i];
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

// Distribui 4 regiões fixas por jogador
function distributeRegions() {
    const totalRegions = GAME_CONFIG.GRID_SIZE * GAME_CONFIG.GRID_SIZE;
    const regionsPerPlayer = 4; // Fixo em 4, conforme solicitado
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
    // As regiões restantes ficam descontroladas (controller: null) e prontas para serem exploradas 
}

// ==================== GERENCIAMENTO DE JOGADORES ====================
function addPlayer(name, icon) {
    if (gameState.players.length >= 4) {
        showFeedback('Máximo de 4 jogadores atingido!', 'error');
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
        consecutiveNoActionTurns: 0,
        regions: [] 
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
    if (gameState.gameOver) return;
    
    const player = gameState.players[gameState.currentPlayerIndex];
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
    
    // Define o jogador do turno como o jogador visualizado por padrão
    gameState.selectedPlayerForResources = gameState.currentPlayerIndex;

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
    if (gameState.gameOver) {
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
    
    // NOVO: Verifica se a região é obrigatória e se foi selecionada (Correção do fluxo de 2-etapas)
    if (['explorar', 'construir'].includes(actionType) && !selectedRegion) {
        showFeedback(`Selecione uma região no mapa antes de executar a ação de ${actionType.toUpperCase()}.`, 'error');
        return; 
    }
    
    const regionIsControlledByCurrent = selectedRegion && selectedRegion.controller === gameState.currentPlayerIndex;
    const regionIsNeutral = selectedRegion && selectedRegion.controller === null;

    switch (actionType) {
        case 'explorar':
            // 1. Checa se já está explorada (Exploração 1+), o que impede nova exploração
            if (selectedRegion.explorationLevel > 0) {
                 showFeedback("Esta região já foi explorada (Exploração: 1+).", 'warning');
                 return;
            }
            
            // 2. Regra de Controle: Tem que ser sua região inexplorada (level 0) OU neutra
            if (!regionIsControlledByCurrent && !regionIsNeutral) {
                const controllerName = selectedRegion.controller !== null ? gameState.players[selectedRegion.controller].name : 'Neutra';
                showFeedback(`Você só pode explorar regiões neutras ou suas próprias regiões inexploradas. A região selecionada é de ${controllerName}.`, 'error');
                return;
            }

            let costs = GAME_CONFIG.ACTION_DETAILS.explorar.cost;
            let feedbackMsg = 'Região própria explorada! +1 PV e renda bônus por turno!';

            if (regionIsNeutral) {
                costs = GAME_CONFIG.EXPLORE_NEUTRAL_COST;
                feedbackMsg = 'Região neutra explorada e dominada! +1 PV e renda bônus por turno!';
            }
            
            const costDescription = Object.entries(costs).map(([r, c]) => `${c} ${r.substring(0, 1).toUpperCase()}`).join(', ');

            if (checkCosts(player, costs)) {
                consumeResources(player, costs);
                selectedRegion.explorationLevel += 1;
                player.victoryPoints += 1;
                
                if (regionIsNeutral) {
                    // Assume o controle da região neutra
                    selectedRegion.controller = player.id;
                    player.regions.push(selectedRegion.id);
                }
                
                showFeedback(feedbackMsg, 'success');
                actionSuccess = true;
            } else {
                showFeedback(`Recursos insuficientes. Necessário: ${costDescription}.`, 'error');
            }
            break;

        case 'construir': 
            // 1. Revalida a posse
            if (!regionIsControlledByCurrent) {
                showFeedback("A construção só pode ser feita em uma região que você controla.", 'error');
                return;
            }
            // 2. Revalida o nível de exploração (mínimo 1 para construir)
            if (selectedRegion.explorationLevel < 1) {
                 showFeedback("A região precisa de pelo menos 1 Nível de Exploração para construir.", 'error');
                 return;
            }

            // Abre o modal para seleção da estrutura
            openBuildModal(player, selectedRegion);
            
            // Limpa a seleção da região para não confundir o usuário
            gameState.selectedRegion = null; 
            updateDisplay();
            
            // A ação 'construir' só será marcada como realizada (actionsTaken.push) dentro de 
            // handleBuildSelection, após a confirmação da construção no modal.
            return; 

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
                const costDescription = Object.entries(gatherCosts).map(([r, c]) => `${c} ${r.substring(0, 1).toUpperCase()}`).join(', ');
                showFeedback(`Recursos insuficientes. Necessário: ${costDescription}.`, 'error');
            }
            break;

        case 'negociar':
            const negotiateCosts = GAME_CONFIG.ACTION_DETAILS.negociar.cost;
            if (gameState.players.length < 2) {
                showFeedback('Mínimo de 2 jogadores para negociar!', 'error');
                return;
            }
            if (checkCosts(player, negotiateCosts)) {
                player.resources.ouro -= 1; // Custo de ouro consumido imediatamente
                openNegotiationPlayerSelect(); // Abre modal de seleção
                // A ação só é marcada como realizada após a negociação ser de fato efetuada
                // (no executeResourceTrade ou executeRegionTrade), onde a actionSuccess é feita.
                return;
            } else {
                const costDescription = Object.entries(negotiateCosts).map(([r, c]) => `${c} ${r.substring(0, 1).toUpperCase()}`).join(', ');
                showFeedback(`Recursos insuficientes. Necessário: ${costDescription}.`, 'error');
            }
            return;
    }

    if (actionSuccess) {
        gameState.actionsTaken.push(actionType);
        // Se o jogador realizou qualquer ação, o contador de inatividade é zerado
        player.consecutiveNoActionTurns = 0;
    }
    
    // Limpa a região selecionada após uma ação bem sucedida que não abriu um modal
    if (actionSuccess && selectedRegion) {
        gameState.selectedRegion = null;
    }
    
    updateDisplay();
    checkVictoryCondition();
}

function endTurn() {
    if (gameState.gameOver) return;
    
    const player = gameState.players[gameState.currentPlayerIndex];
    
    // Se não realizou ações, incrementa o contador de inatividade
    if (gameState.actionsTaken.length === 0) {
        player.consecutiveNoActionTurns++;
        showFeedback(`Nenhuma ação realizada. Passividade: ${player.consecutiveNoActionTurns}/3.`, 'warning');
    } else {
        player.consecutiveNoActionTurns = 0; // Se realizou, zera
    }
    
    // Passa para o próximo jogador
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    gameState.turn++;
    
    startTurn();
}

// ==================== CONDIÇÃO DE VITÓRIA ====================
function checkVictoryCondition() {
    if (gameState.gameOver) return;
    
    const winner = gameState.players.find(p => p.victoryPoints >= GAME_CONFIG.VICTORY_POINTS);
    
    if (winner) {
        gameState.gameOver = true;
        
        const victoryContent = document.getElementById('victoryContent');
        victoryContent.innerHTML = `
            <h2>Parabéns, ${winner.icon} ${winner.name}!</h2>
            <p>Você atingiu ${winner.victoryPoints} Pontos de Vitória e dominou Gaia!</p>
            <p class="text-secondary">O jogo terminou no Turno ${gameState.turn}.</p>
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('victoryModal'));
        modal.show();
    }
}

// ==================== FUNÇÕES GERAIS DE DISPLAY ====================
function updateDisplay() {
    updatePlayerHeaderList();
    updatePlayerListDisplay();
    // Garante que o display de recursos use o jogador selecionado
    updateResourcesDisplay(gameState.players[gameState.selectedPlayerForResources]);
    renderGameMap();
    updateActionButtons();
    document.getElementById('turnoDisplay').textContent = gameState.turn;
}

// NOVO: Adiciona a lógica do título do jogador (Correção do Problema 2)
function updateResourcesDisplay(player) {
    const resourcesEl = document.getElementById('recursosDisplay');
    const titleEl = document.getElementById('recursosTitle'); // Assumindo este elemento existe no HTML
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // 1. Atualiza o Título
    if (titleEl) {
        if (player.id === currentPlayer.id) { 
            // Se o jogador visualizado é o jogador atual
            titleEl.innerHTML = `Recursos: ${player.icon} ${player.name} (Seu Turno)`;
            titleEl.style.color = player.color;
        } else {
            // Se for outro jogador
            titleEl.innerHTML = `Recursos: ${player.icon} ${player.name}`;
            titleEl.style.color = player.color;
        }
    }
    
    // 2. Atualiza os Recursos
    resourcesEl.innerHTML = `
        <div class="resource-item">
            <span class="label">⭐ PV:</span>
            <span class="value">${player.victoryPoints}</span>
        </div>
        ${Object.keys(player.resources).map(res => `
            <div class="resource-item">
                <span class="label">${res.substring(0, 1).toUpperCase()}: ${res.charAt(0).toUpperCase() + res.slice(1)}</span>
                <span class="value">${player.resources[res]}</span>
            </div>
        `).join('')}
    `;
}

function updatePlayerHeaderList() {
    const listEl = document.getElementById('playerHeaderList');
    listEl.innerHTML = gameState.players.map((player, index) => `
        <span class="header-player-item ${index === gameState.currentPlayerIndex ? 'active-player-header' : ''}" 
              onclick="gameState.selectedPlayerForResources = ${player.id}; updateDisplay()"
              style="color: ${player.color}; border-color: ${player.color};">
            ${player.icon} ${player.name} (${player.victoryPoints} PV)
        </span>
    `).join('');
}

function updatePlayerListDisplay() {
    const listEl = document.getElementById('playerListDisplay');
    listEl.innerHTML = gameState.players.map(player => `
        <div class="player-score-item ${player.id === gameState.currentPlayerIndex ? 'active-player' : ''}" 
             onclick="gameState.selectedPlayerForResources = ${player.id}; updateDisplay()">
            <span style="color: ${player.color};">
                ${player.icon} ${player.name}
            </span>
            <span>${player.victoryPoints} PV</span>
        </div>
    `).join('');
}

// Lógica de Ativação/Inativação de Botões (Item 1)
function updateActionButtons() {
    const actionDetails = GAME_CONFIG.ACTION_DETAILS;
    const currentActions = gameState.actionsTaken;
    const isRegionSelected = gameState.selectedRegion !== null;
    
    // Habilitar / Desabilitar botões de ação e definir tooltips
    Object.keys(actionDetails).forEach(action => {
        const btn = document.getElementById(`${action}Btn`);
        const details = actionDetails[action];
        
        // Desabilita se a ação já foi tomada ou o jogo acabou
        let isDisabled = currentActions.includes(action) || gameState.gameOver;
        
        // Se for uma ação regional ('explorar' ou 'construir') e nenhuma região estiver selecionada, desabilita (Item 1)
        if (['explorar', 'construir'].includes(action) && !isRegionSelected) {
             // Ação regional SÓ é possível se houver seleção.
             isDisabled = true; // CORREÇÃO: Força a inatividade se não houver região selecionada.
             btn.classList.toggle('no-selection-hint', !currentActions.includes(action));
        } else {
             btn.classList.remove('no-selection-hint');
        }

        btn.disabled = isDisabled; // Aplica o estado de inatividade

        // Cria a string de custo para o tooltip
        let costString = '';
        if (action === 'explorar') {
            const ownCost = Object.entries(details.cost).map(([r, c]) => `${c} ${r.substring(0, 1).toUpperCase()}`).join(', ');
            const neutralCost = Object.entries(GAME_CONFIG.EXPLORE_NEUTRAL_COST).map(([r, c]) => `${c} ${r.substring(0, 1).toUpperCase()}`).join(', ');
            costString = `Custo (Própria): ${ownCost}. Custo (Neutra): ${neutralCost}.`;
        } else {
            const cost = Object.entries(details.cost).map(([r, c]) => `${c} ${r.substring(0, 1).toUpperCase()}`).join(', ');
            costString = `Custo: ${cost || 'Nenhum'}.`;
        }
        
        // Define o tooltip
        btn.setAttribute('title', `${costString} | Efeito: ${details.effect.replace(/\*\*(.*?)\*\*/g, '$1')}`);
    });
    
    // Botão de Finalizar Turno
    const endTurnBtn = document.getElementById('endTurnBtn');
    endTurnBtn.disabled = gameState.gameOver;
}


// ==================== FUNÇÕES DE CONSTRUÇÃO ====================

function openBuildModal(player, region) {
    const buildOptionsContent = document.getElementById('buildOptionsContent');
    let content = `<p>Região Selecionada: <strong>${region.name} (${region.biome})</strong> (Exploração: ${region.explorationLevel})</p><hr>`;
    content += `<div class="row row-cols-1 row-cols-md-3 g-4">`;

    // Filtra estruturas que podem ser construídas (limites e requisitos)
    const availableStructures = Object.entries(GAME_CONFIG.STRUCTURE_TYPES).filter(([type, details]) => {
        // Regra 1: Uma região só pode ter 1 Edifício Principal
        if (type === 'EDIFICIO_PRINCIPAL' && region.structures.some(s => s.type === 'EDIFICIO_PRINCIPAL')) {
            return false;
        }
        // Regra 2: Uma região só pode ter no máximo 3 estruturas totais
        if (region.structures.length >= 3) {
            return false;
        }
        // Regra 3: Nível de exploração mínimo
        const requiredExploration = type === 'EDIFICIO_PRINCIPAL' ? 2 : 1;
        if (region.explorationLevel < requiredExploration) {
            return false;
        }
        return true;
    });


    if (availableStructures.length === 0) {
        content += `<p class="text-warning col-12">Não há mais estruturas disponíveis para construir nesta região, ou o nível de exploração é insuficiente.</p>`;
    } else {
        availableStructures.forEach(([typeKey, structure]) => {
            const canAfford = checkCosts(player, structure.cost);
            const costsDisplay = Object.keys(structure.cost).filter(r => structure.cost[r] > 0).map(r => 
                `<span class="resource-cost">${structure.cost[r]} ${r.substring(0, 1).toUpperCase()}</span>`
            ).join('');

            content += `
                <div class="col">
                    <div class="card build-option p-3 ${!canAfford ? 'disabled' : ''}" 
                         onclick="${canAfford ? `handleBuildSelection(${region.id}, '${typeKey}')` : `showFeedback('Recursos insuficientes para ${structure.name}.', 'error')`}">
                        <div class="card-body">
                            <h5 class="card-title">${structure.name}</h5>
                            <p class="card-text">${structure.description}</p>
                            <p class="card-text"><strong>Ganha:</strong> ${structure.pv_gain} PV (Inicial)</p>
                            <p class="card-text"><strong>Custo:</strong> ${costsDisplay || 'N/A'}</p>
                            ${!canAfford ? '<p class="text-danger">Recursos Insuficientes</p>' : ''}
                        </div>
                    </div>
                </div>
            `;
        });
    }


    content += `</div>`;
    buildOptionsContent.innerHTML = content;

    const modal = new bootstrap.Modal(document.getElementById('buildModal'));
    modal.show();
}

function handleBuildSelection(regionId, structureType) {
    const player = gameState.players[gameState.currentPlayerIndex];
    const region = gameState.regions[regionId];
    const structure = GAME_CONFIG.STRUCTURE_TYPES[structureType];
    
    // Última checagem de custo e regras
    if (!checkCosts(player, structure.cost)) {
        showFeedback('Tentativa de construção falhou: Recursos insuficientes.', 'error');
        return;
    }
    
    // Regras adicionais (garantia)
    const requiredExploration = structureType === 'EDIFICIO_PRINCIPAL' ? 2 : 1;
    if (region.structures.some(s => s.type === 'EDIFICIO_PRINCIPAL') && structureType === 'EDIFICIO_PRINCIPAL' || region.explorationLevel < requiredExploration) {
         showFeedback('Regra de construção violada (estrutura ou exploração).', 'error');
         return;
    }


    finalizeBuild(player, region, structure, structureType);
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('buildModal'));
    modal.hide();
    
    // Marca a ação como feita (agora de forma centralizada após a confirmação)
    gameState.actionsTaken.push('construir');
    player.consecutiveNoActionTurns = 0;
    
    updateDisplay();
    checkVictoryCondition();
}

function finalizeBuild(player, region, structure, structureType) {
    consumeResources(player, structure.cost);
    
    // Adiciona a estrutura à região
    region.structures.push({
        type: structureType
    });
    
    // Adiciona PV inicial
    player.victoryPoints += structure.pv_gain;
    
    player.structures += 1;
    showFeedback(`Construído ${structure.name} em ${region.name}!`, 'success');
}

// ==================== FUNÇÕES DE INTERAÇÃO UI (Pop-up de Detalhes) ====================

// Guarda o ID da região sobre a qual o mouse está.
let hoveredRegionId = null; 
// Guarda a posição do mouse para o Pop-up
let mouseX = 0; 
let mouseY = 0; 

function handleMouseMove(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
    
    if (hoveredRegionId !== null) {
        updateRegionDetailsPopupPosition();
    }
}

function updateRegionDetailsPopupPosition() {
    const popup = document.getElementById('regionDetailsPopup');
    
    // Evita que o pop-up saia da tela
    let x = mouseX + 15;
    let y = mouseY + 15;
    
    // Ajusta se estiver muito à direita
    if (x + popup.offsetWidth > window.innerWidth) {
        x = mouseX - popup.offsetWidth - 15;
    }
    // Ajusta se estiver muito embaixo
    if (y + popup.offsetHeight > window.innerHeight) {
        y = mouseY - popup.offsetHeight - 15;
    }

    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
}


function showRegionDetails(regionId, event) {
    if (gameState.gameOver) return;

    const region = gameState.regions[regionId];
    hoveredRegionId = regionId;
    
    // Apenas mostra detalhes se não houver um clique em andamento
    if (gameState.selectedRegion !== regionId) { 
        const controller = region.controller !== null ? gameState.players[region.controller] : { icon: '❓', name: 'Neutro', color: 'gray' };
        
        let structuresHtml = 'Nenhuma';
        if (region.structures.length > 0) {
            structuresHtml = region.structures.map(s => GAME_CONFIG.STRUCTURE_TYPES[s.type].name).join(', ');
        }
        
        const biomeBonus = GAME_CONFIG.BIOME_BONUSES[region.biome];
        
        let content = `
            <div class="popup-title">${region.name}</div>
            <div class="popup-info-item">Dono: <strong>${controller.icon} ${controller.name}</strong></div>
            <div class="popup-info-item">Bioma: <strong>${region.biome}</strong></div>
            <div class="popup-info-item">Renda Bônus: <strong>${biomeBonus ? biomeBonus.toUpperCase() : 'N/A'}</strong></div>
            <div class="popup-info-item">Exploração: <strong>${region.explorationLevel}</strong></div>
            <div class="popup-info-item">Estruturas: <strong>${structuresHtml}</strong></div>
        `;
        
        const popup = document.getElementById('regionDetailsPopup');
        popup.innerHTML = content;
        popup.classList.add('show');
        
        // Inicializa a posição
        mouseX = event.clientX;
        mouseY = event.clientY;
        updateRegionDetailsPopupPosition();
    }
}

function hideRegionDetails() {
    hoveredRegionId = null;
    document.getElementById('regionDetailsPopup').classList.remove('show');
}


// NOVO FLUXO: Apenas SELECIONA a região (Problema 1)
function handleRegionClick(regionId) {
    if (gameState.gameOver) return;
    
    const region = gameState.regions[regionId];
    const player = gameState.players[gameState.currentPlayerIndex];
    
    // 1. Região já selecionada: Desseleciona
    if (gameState.selectedRegion === regionId) {
        gameState.selectedRegion = null;
    } 
    // 2. Região válida para seleção: Seleciona
    else if (region.controller === player.id || region.controller === null) { 
         gameState.selectedRegion = regionId;
    } 
    // 3. Região inválida: Feedback
    else {
         showFeedback(`Região de ${gameState.players[region.controller].icon} ${gameState.players[region.controller].name}. Não pode ser selecionada.`, 'warning');
    }
    
    renderGameMap();
    updateActionButtons();
}

function renderGameMap() {
    gameMapEl.innerHTML = '';
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    gameState.regions.forEach(region => {
        const regionEl = document.createElement('div');
        regionEl.className = 'region';
        
        // Cor da região (Baseado no player-color ou cinza se neutra)
        if (region.controller !== null) {
            const player = gameState.players[region.controller];
            regionEl.style.backgroundColor = player.color;
            regionEl.style.color = '#1a1a1a'; // Texto escuro em fundo colorido
            regionEl.style.setProperty('--region-border-color', player.color); // Para borda pulsante
        }
        
        // Aplica a classe 'selected' que o CSS estilizará com a borda branca (Item 2)
        if (region.id === gameState.selectedRegion) {
            regionEl.classList.add('selected');
        }
        
        if (region.controller === gameState.currentPlayerIndex) {
            regionEl.classList.add('controlled-by-current');
        } else if (region.controller === null) {
            regionEl.style.backgroundColor = '#444'; // Cor neutra
        }

        let content = `<span class="region-title">${region.name}</span>`;
        if (region.controller !== null) {
            content += `<span class="region-owner">${gameState.players[region.controller].icon}</span>`;
        } else {
            content += `<span class="region-owner text-dark">NEUTRA</span>`;
        }
        content += `<span class="region-biome">${region.biome}</span>`;
        
        if (region.explorationLevel > 0) {
             content += `<span class="region-level">Exploração: ${region.explorationLevel}</span>`;
        }
        
        if (region.structures.length > 0) {
            const structureCount = region.structures.length;
            content += `<span class="region-structures">🛠️ x${structureCount}</span>`;
        }

        regionEl.innerHTML = content;
        
        regionEl.dataset.regionId = region.id;
        regionEl.addEventListener('click', () => handleRegionClick(region.id));
        // Tooltip: Ouve os eventos de mouse
        regionEl.addEventListener('mouseenter', (event) => showRegionDetails(region.id, event));
        regionEl.addEventListener('mouseleave', hideRegionDetails);
        
        gameMapEl.appendChild(regionEl);
    });
}


// Negociação de Regiões

function openNegotiationPlayerSelect() {
    const player = gameState.players[gameState.currentPlayerIndex];
    const otherPlayers = gameState.players.filter(p => p.id !== player.id);
    let content = '<h6>Selecione um jogador para negociar recursos ou regiões:</h6>';
    content += '<div class="row">';
    otherPlayers.forEach(targetPlayer => { 
        content += `
            <div class="col-md-6 mb-3">
                <button class="btn btn-primary w-100" onclick="renderRegionTradeContent(${targetPlayer.id})">
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

function renderRegionTradeContent(targetPlayerId) {
    const player = gameState.players[gameState.currentPlayerIndex];
    const targetPlayer = gameState.players[targetPlayerId];
    
    // Filtra regiões que não têm estruturas (para simplificar a negociação inicial)
    const playerRegions = gameState.regions.filter(r => r.controller === player.id && r.structures.length === 0);
    const targetRegions = gameState.regions.filter(r => r.controller === targetPlayerId && r.structures.length === 0);

    // Esconde o modal de seleção e mostra o de negociação de regiões 
    const modalSelect = bootstrap.Modal.getInstance(document.getElementById('negotiationModal'));
    modalSelect.hide();
    
    const tradeModalEl = document.getElementById('regionTradeModal');
    const tradeContentEl = document.getElementById('regionTradeContent');
    
    let content = `
        <p class="text-center">Proposta de Troca de Regiões com <strong>${targetPlayer.icon} ${targetPlayer.name}</strong></p>
        <div class="row">
            <div class="col-6">
                <h6>Sua Região a OFERECER:</h6>
                <select id="offerRegion" class="form-select bg-dark text-white">
                    <option value="">-- Selecione uma região --</option>
                    ${playerRegions.map(r => `<option value="${r.id}">${r.name} (${r.biome})</option>`).join('')}
                </select>
                <p class="text-warning mt-2">${playerRegions.length === 0 ? '⚠️ Você não possui regiões disponíveis para troca.' : ''}</p>
            </div>
            <div class="col-6">
                <h6>Região a SOLICITAR de ${targetPlayer.name}:</h6>
                <select id="requestRegion" class="form-select bg-dark text-white">
                    <option value="">-- Selecione uma região --</option>
                    ${targetRegions.map(r => `<option value="${r.id}">${r.name} (${r.biome})</option>`).join('')}
                </select>
                <p class="text-warning mt-2">${targetRegions.length === 0 ? `⚠️ ${targetPlayer.name} não possui regiões disponíveis para troca.` : ''}</p>
            </div>
        </div>
        <p class="text-center text-info mt-3">Para simplificar: O sucesso da troca é automático e concede 1 PV a ambos.</p>
        <div class="d-grid gap-2 mt-3">
            <button class="btn btn-success" id="executeTradeBtn" onclick="executeRegionTrade(${targetPlayerId})" disabled>Propor e Executar Troca</button>
        </div>
    `;

    tradeContentEl.innerHTML = content;
    const modalTrade = new bootstrap.Modal(tradeModalEl);
    modalTrade.show();
    
    // Habilita o botão de troca se ambas as regiões forem selecionadas
    const offerSelect = document.getElementById('offerRegion');
    const requestSelect = document.getElementById('requestRegion');
    const executeBtn = document.getElementById('executeTradeBtn');
    
    function checkTradeSelection() {
        executeBtn.disabled = !(offerSelect.value && requestSelect.value);
    }
    
    offerSelect.addEventListener('change', checkTradeSelection);
    requestSelect.addEventListener('change', checkTradeSelection);
}

function executeRegionTrade(targetPlayerId) {
    const offerRegionId = parseInt(document.getElementById('offerRegion').value);
    const requestRegionId = parseInt(document.getElementById('requestRegion').value);
    
    if (isNaN(offerRegionId) || isNaN(requestRegionId)) {
        showFeedback("Selecione ambas as regiões para a troca.", 'error');
        return;
    }

    const player = gameState.players[gameState.currentPlayerIndex];
    const targetPlayer = gameState.players[targetPlayerId];
    const offeredRegion = gameState.regions[offerRegionId];
    const requestedRegion = gameState.regions[requestRegionId];
    
    // 1. Atualiza o controle das regiões
    offeredRegion.controller = targetPlayerId;
    requestedRegion.controller = player.id;
    
    // 2. Atualiza as listas de regiões dos jogadores
    player.regions = player.regions.filter(id => id !== offerRegionId);
    player.regions.push(requestRegionId);
    
    targetPlayer.regions = targetPlayer.regions.filter(id => id !== requestRegionId);
    targetPlayer.regions.push(offerRegionId);
    
    // 3. Bônus de PV e feedback
    player.victoryPoints += 1;
    targetPlayer.victoryPoints += 1;
    
    showFeedback(`Troca de regiões realizada! ${offeredRegion.name} por ${requestedRegion.name}. +1 PV para ambos!`, 'success');
    
    const tradeModal = bootstrap.Modal.getInstance(document.getElementById('regionTradeModal'));
    tradeModal.hide();
    
    // Marca a ação de Negociar como feita
    gameState.actionsTaken.push('negociar'); 
    player.consecutiveNoActionTurns = 0;
    
    updateDisplay();
    checkVictoryCondition();
}

function executeResourceTrade(targetPlayerId) {
    // Esta função precisaria de uma interface separada (que não está no arquivo) para ser chamada
    // Assumimos que a lógica de Negociar cobre ambos (recursos e regiões).
    
    // O custo de ouro já foi consumido na performAction('negociar')
    // ... Implementação real de troca de recursos ...

    // Exemplo de marcação de sucesso:
    // gameState.actionsTaken.push('negociar'); 
    // player.consecutiveNoActionTurns = 0;
    
    // updateDisplay();
    // checkVictoryCondition();
}


// Refatorado para as 3 abas do manual (Item 4)
function renderManualContent() {
    // ----------------------------------------------------
    // TAB 3: Informações Adicionais (Estruturas, Biomas, Recursos)
    // ----------------------------------------------------
    const structuresHtml = Object.keys(GAME_CONFIG.STRUCTURE_TYPES).map(key => {
        const s = GAME_CONFIG.STRUCTURE_TYPES[key];
        const costs = Object.keys(s.cost).filter(r => s.cost[r] > 0).map(r => `${s.cost[r]} ${r.substring(0, 1).toUpperCase()}`).join(' | ');
        const bonuses = Object.keys(s.bonus_per_turn).filter(r => s.bonus_per_turn[r] > 0).map(r => `+${s.bonus_per_turn[r]} ${r.substring(0, 1).toUpperCase()}`).join(' | ');
        
        return `
            <li>
                <strong>${s.name} (+${s.pv_gain} PV inicial)</strong>: ${s.description}<br>
                Custo: ${costs || 'N/A'}. Bônus Recorrente: ${bonuses || 'Nenhum'}.
            </li>
        `;
    }).join('');
    
    const biomesHtml = Object.keys(GAME_CONFIG.BIOME_BONUSES).map(biome => {
        const bonus = GAME_CONFIG.BIOME_BONUSES[biome];
        return `<li><strong>${biome}</strong>: Renda bônus de ${bonus.toUpperCase()} por turno.</li>`;
    }).join('');
    
    document.getElementById('manualConteudoInfo').innerHTML = `
        <h4 class="text-primary">Distribuição e Controle de Regiões</h4>
        <p>Cada jogador inicia o jogo controlando **4 regiões** aleatórias no mapa. Regiões neutras podem ser exploradas/dominadas.</p>

        <h4 class="text-primary mt-4">Estruturas Disponíveis</h4>
        <ul class="list-unstyled">${structuresHtml}</ul>
        
        <h4 class="text-primary mt-4">Recursos (Madeira, Pedra, Ouro, Água)</h4>
        <p>Recursos são usados para explorar, construir e negociar. PV são obtidos por meio de exploração, construção, bônus de diversidade e ações específicas.</p>
        
        <h4 class="text-primary mt-4">Biomas e Renda</h4>
        <ul class="list-unstyled">${biomesHtml}</ul>
        <p>Bônus de Diversidade: O jogador que controlar pelo menos uma região de cada bioma recebe um bônus único de **${GAME_CONFIG.DIVERSITY_BONUS_PV} PV**.</p>
    `;

    // ----------------------------------------------------
    // TAB 2: Ações do Jogador (Explorar, Construir, Recolher, Negociar)
    // ----------------------------------------------------
    document.getElementById('manualConteudoAcoes').innerHTML = Object.keys(GAME_CONFIG.ACTION_DETAILS).map(key => {
        const action = GAME_CONFIG.ACTION_DETAILS[key];
        let costDisplay = Object.keys(action.cost).filter(r => action.cost[r] > 0).map(r => `${action.cost[r]} ${r.substring(0, 1).toUpperCase()}`).join(' | ');
        
        // Adiciona o custo de exploração neutra
        if (key === 'explorar') {
            const neutralCostDisplay = Object.keys(GAME_CONFIG.EXPLORE_NEUTRAL_COST).filter(r => GAME_CONFIG.EXPLORE_NEUTRAL_COST[r] > 0).map(r => `${GAME_CONFIG.EXPLORE_NEUTRAL_COST[r]} ${r.substring(0, 1).toUpperCase()}`).join(' | ');
            costDisplay = `<span class="text-info">(Própria: ${costDisplay})</span> | <span class="text-warning">(Neutra: ${neutralCostDisplay})</span>`;
        }
        
        return `
            <h5 class="mt-3 text-success">${key.toUpperCase()}</h5>
            <p><strong>Custo:</strong> ${costDisplay || 'Nenhum ou variável'}</p>
            <p><strong>Efeito:</strong> ${action.effect.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
            <hr>
        `;
    }).join('');

    // ----------------------------------------------------
    // TAB 1: Apresentação e Fases
    // ----------------------------------------------------
    document.getElementById('manualConteudoApresentacao').innerHTML = `
        <h4 class="text-primary">Visão Geral</h4>
        <p>Gaia Dominium é um jogo de estratégia *multiplayer* local por turnos, onde o objetivo é alcançar **${GAME_CONFIG.VICTORY_POINTS} Pontos de Vitória (PV)** através da expansão territorial, coleta de recursos e construção de estruturas.</p>
        
        <h4 class="text-primary mt-4">Fases de Um Turno</h4>
        <ol>
            <li><strong>Fase de Renda:</strong> O sistema calcula e adiciona recursos (Madeira, Pedra, Ouro, Água) e PV recorrentes baseados nas suas regiões, nível de exploração e estruturas.</li>
            <li><strong>Fase de Ação:</strong> O jogador ativo pode executar até **duas ações** modulares (Explorar, Construir, Recolher, Negociar). Cada tipo de ação só pode ser realizada uma vez por turno.</li>
            <li><strong>Fase de Finalização:</strong> O jogador finaliza o turno, e o jogo passa para o próximo jogador, verificando a condição de vitória.</li>
        </ol>
        <p class="text-warning mt-3">⚠️ **Passividade:** Se um jogador não realizar nenhuma ação por 3 turnos consecutivos, ele tem a **renda base** de suas regiões suspensa.</p>
    `;
}

// ==================== EVENT LISTENERS (Item 1) ====================

document.getElementById('addPlayerBtn').addEventListener('click', () => {
    const name = document.getElementById('playerName').value.trim();
    const selectedIconEl = document.querySelector('.icon-option.selected');
    const icon = selectedIconEl ? selectedIconEl.textContent : null;

    // Item 1: Feedback para input vazio
    if (!name || !icon) {
        showFeedback('Preencha nome e selecione um ícone.', 'error');
        return;
    }

    if (addPlayer(name, icon)) {
        document.getElementById('playerName').value = '';
        document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
        // Item 1: Feedback de sucesso
        showFeedback(`${name} adicionado com sucesso!`, 'success');
    }
});

document.getElementById('startGameBtn').addEventListener('click', () => {
    gameState.gameStarted = true;
    document.getElementById('initialScreen').classList.add('hidden');
    initializeGame();
    // Inicia o primeiro turno após a inicialização
    startTurn();
});

// Ações agora chamam performAction, que verifica a seleção da região.
document.getElementById('explorarBtn').addEventListener('click', () => performAction('explorar'));
document.getElementById('construirBtn').addEventListener('click', () => performAction('construir'));

// Ações gerais continuam inalteradas.
document.getElementById('recolherBtn').addEventListener('click', () => performAction('recolher'));
document.getElementById('negociarBtn').addEventListener('click', () => performAction('negociar'));
document.getElementById('endTurnBtn').addEventListener('click', endTurn);

// Ouve o movimento do mouse para o pop-up de detalhes da região
document.addEventListener('mousemove', handleMouseMove);


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