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
    
    showFeedback(feedbackMsg + (incomeParts.join(', ') || "Nenhum ganho neste turno."), '
