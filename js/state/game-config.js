// game-config.js - Configurações do jogo
import { getIcon } from '../ui/icons.js';

const GAME_CONFIG = {
  GRID_SIZE: 5,
  PLAYER_ICONS: ['leao', 'tigre', 'urso', 'raposa', 'lobo', 'aguia', 'dragao', 'tubarao'],
  PLAYER_COLORS: ['#166A38', '#1E40AF', '#991B1B', '#A16207'],
  BIOMES: ['Floresta Tropical','Floresta Temperada','Savana','Pântano'],
  REGION_NAMES: Array.from({length:25}, (_,i)=>`Região ${String.fromCharCode(65+i)}`),
  INITIAL_RESOURCES: { madeira:10, pedra:5, ouro:3, agua:5 },
  VICTORY_POINTS: 25,
  DIVERSITY_BONUS_PV: 3,
  ACTIONS_PER_TURN: 2,
  ACTION_DETAILS: {
    explorar: { cost:{madeira:1, agua:1}, pv:1 },
    construir: { cost:{madeira:3, pedra:2, ouro:1}, pv:2 },
    disputar: { cost:{madeira:2, pedra:2, ouro:3, agua:1}, pv:3 },
    coletar: { cost:{madeira:1}, pv:1 },
    negociar: { cost:{ouro:1}, pv:1 }
  },
  TURNS_UNTIL_NEXT_EVENT: 4,
  INITIAL_EVENT_MODIFIERS: {},
  EVENT_TURNS_LEFT: 0,
  CONSECUTIVE_NO_ACTION_LIMIT: 3,
  MAX_PLAYERS: 4,
  MIN_PLAYERS: 2
};

const DEFAULT_GAME_RULES = {
  targetVictoryPoints: 25,
  victoryCondition: 'pv', // 'pv' | 'domination' | 'elimination' | 'all'
  eventFrequency: 'normal' // 'normal' | 'every_round'
};

const VICTORY_POINTS_OPTIONS = [25, 50, 75, 100];

const VICTORY_CONDITION_OPTIONS = [
  {
    id: 'pv',
    name: 'Pontos de Vitória (PV)',
    description: 'Vence o primeiro jogador a atingir a meta estipulada de PV.',
    icon: 'trofeu'
  },
  {
    id: 'domination',
    name: 'Dominação Total do Mapa',
    description: 'O jogo prossegue até que todas as 25 regiões estejam dominadas. Vence quem controlar o maior número de regiões (desempate por PV).',
    icon: 'dominar'
  },
  {
    id: 'elimination',
    name: 'Sobrevivência / Eliminação',
    description: 'O jogo só termina quando todos os adversários forem eliminados. Vence o último jogador sobrevivente.',
    icon: 'skull'
  },
  {
    id: 'all',
    name: 'Misto (Qualquer Condição)',
    description: 'Termina imediatamente assim que qualquer condição ocorrer: meta de PV, todas as 25 regiões dominadas ou eliminação dos rivais.',
    icon: 'lightning'
  }
];

const EVENT_FREQUENCY_OPTIONS = [
  {
    id: 'normal',
    name: 'Ritmo Padrão',
    description: 'Um novo evento global ocorre a cada 4 rodadas.',
    icon: 'turn'
  },
  {
    id: 'every_round',
    name: 'Evento a Cada Rodada (Caos)',
    description: 'Um novo evento global afeta Gaia no início de cada rodada.',
    icon: 'lightning'
  }
];

const RESOURCE_ICONS = {
  madeira: getIcon('madeira', { size: 16 }),
  pedra: getIcon('pedra', { size: 16 }), 
  ouro: getIcon('ouro', { size: 16 }),
  agua: getIcon('agua', { size: 16 })
};

const BIOME_INCOME = {
  'Floresta Tropical': { madeira: 1, pedra: 0, ouro: 0, agua: 1 },
  'Floresta Temperada': { madeira: 1, pedra: 0, ouro: 0, agua: 1 },
  'Savana': { madeira: 0, pedra: 0, ouro: 1, agua: 0 },
  'Pântano': { madeira: 0, pedra: 1, ouro: 0, agua: 2 }
};

const BIOME_INITIAL_RESOURCES = {
  'Floresta Tropical': { madeira: 6, pedra: 1, ouro: 0, agua: 3 },
  'Floresta Temperada': { madeira: 5, pedra: 2, ouro: 0, agua: 2 },
  'Savana': { madeira: 2, pedra: 1, ouro: 3, agua: 1 },
  'Pântano': { madeira: 1, pedra: 3, ouro: 0, agua: 4 }
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
  'Abrigo': 1,
  'Torre de Vigia': 1,
  'Mercado': 1,
  'Laboratório': 1,
  'Santuário': 1
};

const STRUCTURE_CONFIG = {
  'Abrigo': {
    icon: getIcon('abrigo', { size: 32 }),
    color: 'green',
    cost: STRUCTURE_COSTS['Abrigo'],
    income: STRUCTURE_INCOME['Abrigo'],
    effect: STRUCTURE_EFFECTS['Abrigo']
  },
  'Torre de Vigia': {
    icon: getIcon('torreVigia', { size: 32 }),
    color: 'blue',
    cost: STRUCTURE_COSTS['Torre de Vigia'],
    income: STRUCTURE_INCOME['Torre de Vigia'],
    effect: STRUCTURE_EFFECTS['Torre de Vigia']
  },
  'Mercado': {
    icon: getIcon('mercado', { size: 32 }),
    color: 'yellow',
    cost: STRUCTURE_COSTS['Mercado'],
    income: STRUCTURE_INCOME['Mercado'],
    effect: STRUCTURE_EFFECTS['Mercado']
  },
  'Laboratório': {
    icon: getIcon('laboratorio', { size: 32 }),
    color: 'purple',
    cost: STRUCTURE_COSTS['Laboratório'],
    income: STRUCTURE_INCOME['Laboratório'],
    effect: STRUCTURE_EFFECTS['Laboratório']
  },
  'Santuário': {
    icon: getIcon('santuario', { size: 32 }),
    color: 'red',
    cost: STRUCTURE_COSTS['Santuário'],
    income: STRUCTURE_INCOME['Santuário'],
    effect: STRUCTURE_EFFECTS['Santuário']
  }
};

const EXPLORATION_BONUS = {
  0: 1.0,
  1: 1.25,
  2: 1.5,
  3: 2.0
};

const EXPLORATION_SPECIAL_BONUS = {
  1: { description: "+1 recurso aleatório ao coletar" },
  2: { 
    description: "20% chance de +1 Ouro na renda",
    buildDiscount: { pedra: 1 }
  },
  3: { 
    description: "+1 PV a cada 3 turnos",
    collectBonus: 0.5
  }
};

const TURN_PHASES = {
  RENDA: 'renda',
  ACOES: 'acoes',
  NEGOCIACAO: 'negociacao'
};

// Sistema de Eventos Aleatórios
const GAME_EVENTS = [
  {
    id: 'seca',
    name: 'Seca',
    icon: '🌵',
    description: 'Uma seca severa assola Gaia.',
    effect: 'Produção de Água reduzida em 50%',
    duration: 2,
    apply: (state) => {
      state.eventModifiers.aguaMultiplier = 0.5;
    },
    remove: (state) => {
      delete state.eventModifiers.aguaMultiplier;
    }
  },
  {
    id: 'jazida',
    name: 'Descoberta de Jazida',
    icon: '⛏️',
    description: 'Ricas jazidas de ouro foram encontradas nas savanas!',
    effect: '+2 Ouro por turno para quem controla Savana',
    duration: 2,
    apply: (state) => {
      state.eventModifiers.savanaBonus = 2;
    },
    remove: (state) => {
      delete state.eventModifiers.savanaBonus;
    }
  },
  {
    id: 'tempestade',
    name: 'Tempestade',
    icon: '🌪️',
    description: 'Uma tempestade violenta paralisa as construções.',
    effect: 'Estruturas não produzem recursos',
    duration: 2,
    apply: (state) => {
      state.eventModifiers.structuresDisabled = true;
    },
    remove: (state) => {
      delete state.eventModifiers.structuresDisabled;
    }
  },
  {
    id: 'primavera',
    name: 'Primavera Abundante',
    icon: '🌱',
    description: 'A natureza floresce com vigor renovado!',
    effect: '+100% produção de Madeira',
    duration: 2,
    apply: (state) => {
      state.eventModifiers.madeiraMultiplier = 2.0;
    },
    remove: (state) => {
      delete state.eventModifiers.madeiraMultiplier;
    }
  },
  {
    id: 'mercado',
    name: 'Mercado Aquecido',
    icon: '💰',
    description: 'A economia está em alta, facilitando negociações.',
    effect: 'Negociações custam 0 Ouro',
    duration: 2,
    apply: (state) => {
      state.eventModifiers.negociacaoGratis = true;
    },
    remove: (state) => {
      delete state.eventModifiers.negociacaoGratis;
    }
  },
  {
    id: 'inverno',
    name: 'Inverno Rigoroso',
    icon: '❄️',
    description: 'O frio intenso torna a coleta mais valiosa.',
    effect: '+1 Madeira adicional ao Coletar',
    duration: 2,
    apply: (state) => {
      state.eventModifiers.coletaBonus = { madeira: 1 };
    },
    remove: (state) => {
      delete state.eventModifiers.coletaBonus;
    }
  },
  {
    id: 'arqueologia',
    name: 'Descoberta Arqueológica',
    icon: '🏺',
    description: 'Artefatos antigos são encontrados nas terras menos exploradas!',
    effect: '+3 PV para quem controla menos regiões (equalizador)',
    duration: 1,
    apply: (state) => {
      let minRegions = Infinity;
      let targetPlayer = null;
      state.players.forEach(p => {
        if (!p.eliminated && p.regions.length < minRegions) {
          minRegions = p.regions.length;
          targetPlayer = p;
        }
      });
      if (targetPlayer) {
        targetPlayer.victoryPoints += 3;
      }
    },
    remove: (state) => {}
  },
  {
    id: 'inflacao',
    name: 'Inflação',
    icon: '📈',
    description: 'Os preços sobem drasticamente.',
    effect: 'Todas as ações custam +1 Ouro adicional',
    duration: 2,
    apply: (state) => {
      state.eventModifiers.custoOuroExtra = 1;
    },
    remove: (state) => {
      delete state.eventModifiers.custoOuroExtra;
    }
  },
  {
    id: 'tecnologia',
    name: 'Boom Tecnológico',
    icon: '🔬',
    description: 'Avanços tecnológicos facilitam construções.',
    effect: 'Construir dá +1 PV extra',
    duration: 2,
    apply: (state) => {
      state.eventModifiers.construirBonus = 1;
    },
    remove: (state) => {
      delete state.eventModifiers.construirBonus;
    }
  },
  {
    id: 'escassez_pedra',
    name: 'Escassez de Pedra',
    icon: '🪨',
    description: 'Pedreiras estão exaustas.',
    effect: '-50% produção de Pedra',
    duration: 2,
    apply: (state) => {
      state.eventModifiers.pedraMultiplier = 0.5;
    },
    remove: (state) => {
      delete state.eventModifiers.pedraMultiplier;
    }
  },
  {
    id: 'festival',
    name: 'Festival da Colheita',
    icon: '🎉',
    description: 'Celebrações trazem abundância!',
    effect: 'Coletar dá +2 recursos aleatórios bônus',
    duration: 2,
    apply: (state) => {
      state.eventModifiers.festivalBonus = true;
    },
    remove: (state) => {
      delete state.eventModifiers.festivalBonus;
    }
  },
  {
    id: 'areia',
    name: 'Tempestade de Areia',
    icon: '🏜️',
    description: 'Areia cobre as savanas.',
    effect: 'Savanas não produzem recursos',
    duration: 2,
    apply: (state) => {
      state.eventModifiers.savanaBloqueada = true;
    },
    remove: (state) => {
      delete state.eventModifiers.savanaBloqueada;
    }
  },
  {
    id: 'enchente',
    name: 'Enchente',
    icon: '🌊',
    description: 'Águas sobem nos pântanos.',
    effect: 'Pântanos produzem o dobro',
    duration: 2,
    apply: (state) => {
      state.eventModifiers.pantanoBonus = 2.0;
    },
    remove: (state) => {
      delete state.eventModifiers.pantanoBonus;
    }
  },
  {
    id: 'exploracao',
    name: 'Era da Exploração',
    icon: '🗺️',
    description: 'Espírito aventureiro toma conta!',
    effect: 'Explorar custa -1 Madeira',
    duration: 2,
    apply: (state) => {
      state.eventModifiers.explorarDesconto = 1;
    },
    remove: (state) => {
      delete state.eventModifiers.explorarDesconto;
    }
  },
  {
    id: 'depressao',
    name: 'Depressão Econômica',
    icon: '📉',
    description: 'A economia entra em colapso.',
    effect: 'Todos perdem 2 Ouro imediatamente',
    duration: 1,
    apply: (state) => {
      state.players.forEach(p => {
        p.resources.ouro = Math.max(0, p.resources.ouro - 2);
      });
    },
    remove: (state) => {}
  }
];

// Sistema de Conquistas
const ACHIEVEMENTS = [
  {
    id: 'explorador',
    name: 'Explorador',
    description: 'Explore 10 regiões',
    icon: '🗺️',
    condition: (state) => state.totalExplored >= 10,
    unlocked: false
  },
  {
    id: 'construtor',
    name: 'Construtor',
    description: 'Construa 5 estruturas',
    icon: '🏗️',
    condition: (state) => state.totalBuilt >= 5,
    unlocked: false
  },
  {
    id: 'diplomata',
    name: 'Diplomata',
    description: 'Realize 10 negociações',
    icon: '🤝',
    condition: (state) => state.totalNegotiations >= 10,
    unlocked: false
  },
  {
    id: 'guardiao',
    name: 'Guardião de Gaia',
    description: 'Vencer uma partida',
    icon: '🏆',
    condition: (state) => state.wins > 0,
    unlocked: false
  }
];

const EVENT_CATEGORIES = {
  POSITIVE: ['primavera', 'mercado', 'festival', 'exploracao', 'enchente'],
  NEGATIVE: ['seca', 'tempestade', 'inflacao', 'escassez_pedra', 'areia', 'depressao'],
  MIXED: ['jazida', 'inverno', 'tecnologia', 'arqueologia']
};

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
    description: 'Colete recursos de 8 regiões diferentes',
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
  },
  WARLORD: {
    id: 'senhor_guerra',
    name: 'Senhor da Guerra',
    description: 'Vença 5 disputas territoriais',
    icon: '⚔️',
    requirement: 5,
    type: 'disputes',
    reward: { disputeSuccessBonus: 0.1 }
  },
  CONQUEROR: {
    id: 'conquistador',
    name: 'Conquistador',
    description: 'Controle 10 regiões simultaneamente',
    icon: '🏹',
    requirement: 10,
    type: 'regions',
    reward: { regionDefenseBonus: 2 }
  }
};

// ==================== HABILIDADES DAS FACÇÕES ====================
const FACTION_ABILITIES = {
  // Facção Verde - "Guardiões da Floresta"
  0: {
    id: 'forest_guardians',
    name: 'Guardiões da Floresta',
    color: '#166A38',
    icon: getIcon('faction_forest', { size: 18 }),
    description: 'Mestres da natureza e biomas florestais',
    abilities: {
      // Bônus permanente em Florestas Tropicais e Temperadas
      biomeBonus: {
        'Floresta Tropical': { madeira: 2, agua: 1 },
        'Floresta Temperada': { madeira: 2, pedra: 1 }
      },
      // Explorar custa -1 Madeira
      exploreDiscount: { madeira: 1 },
      // +25% produção de Madeira em todas as regiões
      globalProductionMultiplier: { madeira: 0.25 }
    }
  },
  
  // Facção Azul - "Mestres das Águas"
  1: {
    id: 'water_masters',
    name: 'Mestres das Águas',
    color: '#1E40AF',
    icon: getIcon('faction_water', { size: 18 }),
    description: 'Exploradores dos recursos hídricos e costeiros',
    abilities: {
      // Bônus permanente em Pântanos
      biomeBonus: {
        'Pântano': { agua: 3, pedra: 2 }
      },
      // Negociação custa 0 Ouro (primeira por turno)
      freeNegotiationPerTurn: 1,
      // +1 Ação extra ao explorar regiões com água
      exploreWaterBonus: true,
      // Coleta em regiões com água dá +1 recurso aleatório
      waterCollectBonus: 1
    }
  },
  
  // Facção Vermelha - "Construtores da Montanha"
  2: {
    id: 'mountain_builders',
    name: 'Construtores da Montanha',
    color: '#991B1B',
    icon: getIcon('faction_mountain', { size: 18 }),
    description: 'Mestres em mineração e construções robustas',
    abilities: {
      // Bônus permanente em Savanas (consideradas áridas/montanhosas)
      biomeBonus: {
        'Savana': { pedra: 2, ouro: 2 }
      },
      // Construir custa -1 Pedra
      buildDiscount: { pedra: 1 },
      // Estruturas dão +1 PV extra
      structurePVBonus: 1,
      // [BALANCE] +30% produção de Pedra (era 0.5/+50%, muito forte vs Verde +25% madeira)
      globalProductionMultiplier: { pedra: 0.3 }
    }
  },
  
  // Facção Amarela - "Barões do Comércio"
  3: {
    id: 'merchants_barons',
    name: 'Barões do Comércio',
    color: '#A16207',
    icon: getIcon('faction_trade', { size: 18 }),
    description: 'Especialistas em comércio e economia',
    abilities: {
      // Bônus permanente em Savanas
      biomeBonus: {
        'Savana': { ouro: 3, agua: 1 }
      },
      // [BALANCE] +1 Ouro a cada 2 regiões controladas por turno (rebalanceado de 1 para 0.5)
      goldPerRegion: 0.5,
      // Negociações bem-sucedidas dão +1 PV
      negotiationPVBonus: 1,
      // Custo de mercado reduzido em 50%
      marketDiscount: 0.5,
      // +30% chance de encontrar Ouro ao explorar
      goldExplorationBonus: 0.3
    }
  }
};
export const FACTION_CONFIG = {
  amarela: { id: 'amarela', name: 'Barões do Comércio', img: 'assets/images/faccao_amarela_icone.webp', abilities: FACTION_ABILITIES[3] },
  azul:    { id: 'azul',    name: 'Mestres das Águas', img: 'assets/images/faccao_azul_icone.webp',    abilities: FACTION_ABILITIES[1] },
  verde:   { id: 'verde',   name: 'Guardiões da Floresta', img: 'assets/images/faccao_verde_icone.webp',   abilities: FACTION_ABILITIES[0] },
  vermelha:{ id: 'vermelha',name: 'Construtores da Montanha', img: 'assets/images/faccao_vermelha_icone.webp', abilities: FACTION_ABILITIES[2] }
};
// ==================== CONSTANTES DE UI ====================
const UI_CONSTANTS = {
  LOG_ICONS: {
    'action': getIcon('lightning', { size: 14 }),
    'build': getIcon('construir', { size: 14 }),
    'explore': getIcon('explorar', { size: 14 }),
    'collect': getIcon('coletar', { size: 14 }),
    'negotiate': getIcon('negociar', { size: 14 }),
    'event': getIcon('evento', { size: 14 }),
    'victory': getIcon('trofeu', { size: 14 }),
    'phase': getIcon('turn', { size: 14 }),
    'turn': getIcon('turn', { size: 14 }),
    'system': getIcon('gear', { size: 14 }),
    'income': getIcon('ouro', { size: 14 }),
    'default': getIcon('scroll', { size: 14 })
  },
  
  PHASE_NAMES: {
    'renda': `${getIcon('ouro', { size: 14 })} Renda`,
    'acoes': `${getIcon('lightning', { size: 14 })} Ações`,
    'negociacao': `${getIcon('negociar', { size: 14 })} Negociação`
  },
  
  ACTION_COSTS: {
    'explorar': { madeira: 1, agua: 1 },
    'coletar': { madeira: 1 },
    'construir': { madeira: 3, pedra: 2, ouro: 1 },
    'negociar': { ouro: 1 }
  },
  
  BIOME_EMOJIS: {
    'Floresta Tropical': getIcon('tropical', { size: 16 }),
    'Floresta Temperada': getIcon('temperada', { size: 16 }),
    'Savana': getIcon('savana', { size: 16 }),
    'Pântano': getIcon('pantano', { size: 16 })
  },
  
  STRUCTURE_ICONS: {
    'Abrigo': getIcon('abrigo', { size: 16 }),
    'Torre de Vigia': getIcon('torreVigia', { size: 16 }),
    'Mercado': getIcon('mercado', { size: 16 }),
    'Laboratório': getIcon('laboratorio', { size: 16 }),
    'Santuário': getIcon('santuario', { size: 16 })
  },
  
  PLAYER_STATUS: {
    ELIMINATED: `${getIcon('skull', { size: 14 })} ELIMINADO`,
    CURRENT_TURN: `${getIcon('turn', { size: 14 })} TURNO`,
    DEFAULT: `${getIcon('star', { size: 14 })} ATIVO`
  }
};

// EXPOSTAÇÃO DE TODAS AS INFORMAÇÕES
export { 
  GAME_CONFIG, 
  RESOURCE_ICONS, 
  BIOME_INCOME,
  BIOME_INITIAL_RESOURCES,
  STRUCTURE_INCOME, 
  STRUCTURE_COSTS,
  STRUCTURE_EFFECTS,
  STRUCTURE_LIMITS,
  STRUCTURE_CONFIG,
  EXPLORATION_BONUS,
  EXPLORATION_SPECIAL_BONUS,
  TURN_PHASES,
  ACHIEVEMENTS_CONFIG,
  GAME_EVENTS,
  ACHIEVEMENTS,
  EVENT_CATEGORIES,
  FACTION_ABILITIES,
  UI_CONSTANTS,
  DEFAULT_GAME_RULES,
  VICTORY_POINTS_OPTIONS,
  VICTORY_CONDITION_OPTIONS,
  EVENT_FREQUENCY_OPTIONS
};
