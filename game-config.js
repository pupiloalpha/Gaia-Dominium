// game-config.js - Configurações do jogo
const GAME_CONFIG = {
  GRID_SIZE: 5,
  PLAYER_ICONS: ['🦁','🐯','🐻','🦊','🐺','🦅','🐉','🦈'],
  PLAYER_COLORS: ['#166A38', '#1E40AF', '#991B1B', '#A16207'],
  BIOMES: ['Floresta Tropical','Floresta Temperada','Savana','Pântano'],
  REGION_NAMES: Array.from({length:25}, (_,i)=>`Região ${String.fromCharCode(65+i)}`),
  INITIAL_RESOURCES: { madeira:10, pedra:5, ouro:3, agua:5 },
  VICTORY_POINTS: 25,
  DIVERSITY_BONUS_PV: 3,
  ACTIONS_PER_TURN: 2,
  ACTION_DETAILS: {
    explorar: { cost:{madeira:2, agua:1}, pv:1 },
    construir: { cost:{madeira:3, pedra:2, ouro:1}, pv:2 },
    recolher: { cost:{madeira:1}, pv:1 },
    negociar: { cost:{ouro:1}, pv:1 }
  }
};

const RESOURCE_ICONS = {
  madeira: '🪵',
  pedra: '🪨', 
  ouro: '🪙',
  agua: '💧'
};

const BIOME_INCOME = {
  'Floresta Tropical': { madeira: 1, pedra: 0, ouro: 1, agua: 2 },
  'Floresta Temperada': { madeira: 2, pedra: 1, ouro: 0, agua: 1 },
  'Savana': { madeira: 1, pedra: 0, ouro: 2, agua: 1 },
  'Pântano': { madeira: 0, pedra: 1, ouro: 0, agua: 2 }
};

const STRUCTURE_INCOME = {
  'Abrigo': { madeira: 1, agua: 1 },
  'Torre de Vigia': { pv: 1 },
  'Mercado': { ouro: 1 },
  'Laboratório': { ouro: 1 },
  'Santuário': { pv: 1 }
};

const STRUCTURE_COSTS = {
  'Abrigo': { madeira: 3, pedra: 2, ouro: 1 },
  'Torre de Vigia': { madeira: 2, pedra: 3 },
  'Mercado': { madeira: 4, pedra: 1, agua: 2 },
  'Laboratório': { pedra: 3, ouro: 2, agua: 1 },
  'Santuário': { madeira: 3, ouro: 2, agua: 2 }
};

const STRUCTURE_EFFECTS = {
  'Abrigo': { pv: 2 },
  'Torre de Vigia': { 
    pv: 1,
    description: 'Aumenta defesa da região e fornece visão estratégica'
  },
  'Mercado': { 
    pv: 1,
    description: 'Reduz custo de negociação em 1 Ouro e aumenta produção de ouro'
  },
  'Laboratório': { 
    pv: 1,
    description: 'Aumenta chance de descoberta rara em 15% ao explorar'
  },
  'Santuário': { 
    pv: 3,
    description: 'Fornece bônus de PV e aumenta lealdade das regiões adjacentes'
  }
};

const STRUCTURE_LIMITS = {
  'Abrigo': 1, // Máximo 1 por região
  'Torre de Vigia': 1,
  'Mercado': 1,
  'Laboratório': 1,
  'Santuário': 1
};

const EXPLORATION_BONUS = {
  0: 0,
  1: 0,    // Reduzido para não gerar decimais
  2: 1,    // +1 recurso extra
  3: 2     // +2 recursos extras
};

const TURN_PHASES = {
  RENDA: 'renda',
  ACOES: 'acoes',
  NEGOCIACAO: 'negociacao'
};

// game-config.js - ADICIONE antes do último export

const ACHIEVEMENTS_CONFIG = {
  EXPLORER: {
    id: 'explorador',
    name: 'Explorador',
    description: 'Explore 10 regiões',
    icon: '🗺️',
    requirement: 10,
    type: 'explored',
    reward: { pvPerTurn: 1 }
  },
  BUILDER: {
    id: 'construtor', 
    name: 'Construtor',
    description: 'Construa 5 estruturas',
    icon: '🏗️',
    requirement: 5,
    type: 'built',
    reward: { buildCostReduction: 1 }
  },
  DIPLOMAT: {
    id: 'diplomata',
    name: 'Diplomata',
    description: 'Realize 10 negociações',
    icon: '🤝',
    requirement: 10,
    type: 'negotiated',
    reward: { negotiateCostReduction: 1 }
  },
  COLLECTOR: {
    id: 'colecionador',
    name: 'Colecionador',
    description: 'Recolha recursos de 8 regiões diferentes',
    icon: '🌾',
    requirement: 8,
    type: 'collected',
    reward: { collectBonus: 1 }
  },
  DIVERSIFIER: {
    id: 'diversificador',
    name: 'Diversificador',
    description: 'Controle pelo menos 1 região de cada bioma',
    icon: '🌍',
    requirement: 4,
    type: 'biomes',
    reward: { pvBonus: 3 }
  },
  TYCOON: {
    id: 'magnata',
    name: 'Magnata',
    description: 'Acumule 20 de cada recurso simultaneamente',
    icon: '💰',
    requirement: 20,
    type: 'resources',
    reward: { resourceMultiplier: 0.1 }
  },
  FAST_WINNER: {
    id: 'vencedor_rapido',
    name: 'Vencedor Rápido',
    description: 'Vença o jogo em menos de 15 turnos',
    icon: '⚡',
    requirement: 15,
    type: 'fastWin',
    reward: { victoryMultiplier: 1 }
  },
  PACIFIST: {
    id: 'pacifista',
    name: 'Pacifista',
    description: 'Vença sem nunca ter negociado',
    icon: '🕊️',
    requirement: 0,
    type: 'pacifist',
    reward: { peacefulBonus: 5 }
  }
};

export { 
  GAME_CONFIG, 
  RESOURCE_ICONS, 
  BIOME_INCOME, 
  STRUCTURE_INCOME, 
  EXPLORATION_BONUS,
  TURN_PHASES,
  ACHIEVEMENTS_CONFIG,
  STRUCTURE_COSTS,
  STRUCTURE_EFFECTS,
  STRUCTURE_LIMITS
};
