/* main.js — Atualizado com:
   - Regiões com mesmo fundo do painel lateral
   - Tooltip estilizado no hover para detalhes de região
   - showAlert + showConfirm (Promise) global, substituindo alert()/confirm()
   - UI completa de negociação (criação, envio, resposta, aceitação/recusa)
   - Integração com regras do manual v2.0
*/

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

/* Sistema de Eventos Aleatórios */
const GAME_EVENTS = [
  {
    id: 'seca',
    name: 'Seca',
    icon: '🌵',
    description: 'Uma seca severa assola Gaia.',
    effect: 'Produção de Água reduzida em 50%',
    duration: 2,
    apply: (state) => {
      // Aplicado durante a fase de renda
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
    effect: '+1 Madeira adicional ao Recolher',
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
    description: 'Artefatos antigos são encontrados!',
    effect: '+3 PV para quem tem mais regiões',
    duration: 1,
    apply: (state) => {
      // Efeito instantâneo
      let maxRegions = 0;
      let winner = null;
      state.players.forEach(p => {
        if (p.regions.length > maxRegions) {
          maxRegions = p.regions.length;
          winner = p;
        }
      });
      if (winner) {
        winner.victoryPoints += 3;
        showFeedback(`${winner.name} recebeu +3 PV pela Descoberta Arqueológica!`, 'success');
        refreshUIAfterStateChange();
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
    effect: 'Recolher dá +2 recursos aleatórios bônus',
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
      showFeedback('Depressão Econômica: Todos perderam 2 Ouro!', 'warning');
      refreshUIAfterStateChange();
    },
    remove: (state) => {}
  }
];

const RESOURCE_ICONS = {
  madeira: '🪵',
  pedra: '🪨', 
  ouro: '🪙',
  agua: '💧'
};

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

// Estado de conquistas
let achievementsState = {
  totalExplored: 0,
  totalBuilt: 0,
  totalNegotiations: 0,
  wins: 0
};


let gameState = {
  players: [],
  regions: [],
  currentPlayerIndex: 0,
  selectedPlayerForSidebar: 0,
  turn: 0,
  actionsLeft: GAME_CONFIG.ACTIONS_PER_TURN,
  gameStarted: false,
  selectedRegionId: null,
  pendingNegotiation: null, // holds negotiation object while awaiting response
  currentEvent: null,        // Evento atual ativo
  eventTurnsLeft: 0,         // Turnos restantes do evento
  eventModifiers: {},        // Modificadores ativos do evento
  turnsUntilNextEvent: 4    // Contador para próximo evento
};

/* ---------------- Dom elements ---------------- */
const initialScreenEl = document.getElementById('initialScreen');
const addPlayerBtn = document.getElementById('addPlayerBtn');
const startGameBtn = document.getElementById('startGameBtn');
const playerNameInput = document.getElementById('playerName');
const iconSelectionEl = document.getElementById('iconSelection');
const registeredPlayersListEl = document.getElementById('registeredPlayersList');
const playerCountDisplayEl = document.getElementById('playerCountDisplay');

const gameNavbar = document.getElementById('gameNavbar');
const playerHeaderList = document.getElementById('playerHeaderList');
const turnInfo = document.getElementById('turnInfo');

const gameContainer = document.getElementById('gameContainer');
const sidebarEl = document.getElementById('sidebar');
const sidebarPlayerHeader = document.getElementById('sidebarPlayerHeader');
const resourceListEl = document.getElementById('resourceList');
const scoreBlockEl = document.getElementById('scoreBlock');
const controlledRegionsEl = document.getElementById('controlledRegions');

const boardContainer = document.getElementById('boardContainer');
const gameMap = document.getElementById('gameMap');
const regionTooltip = document.getElementById('regionTooltip');
const tooltipTitle = document.getElementById('tooltipTitle');
const tooltipBody = document.getElementById('tooltipBody');

const gameFooter = document.getElementById('gameFooter');
const actionExploreBtn = document.getElementById('actionExplore');
const actionCollectBtn = document.getElementById('actionCollect');
const actionBuildBtn = document.getElementById('actionBuild');
const actionNegotiateBtn = document.getElementById('actionNegotiate');
const actionsLeftEl = document.getElementById('actionsLeft');
const endTurnBtn = document.getElementById('endTurnBtn');

const manualIcon = document.getElementById('manualIcon'); // O ícone flutuante original
const manualIconNavbar = document.getElementById('manualIconNavbar'); // O novo ícone na navbar
const manualModal = document.getElementById('manualModal');
const manualCloseBtn = document.getElementById('manualCloseBtn');
const manualTabs = document.querySelectorAll('.manual-tab');
const manualContents = document.querySelectorAll('.manual-content');

/* Alert / Confirm modal elements */
const alertModalEl = document.getElementById('alertModal');
const alertIconEl = document.getElementById('alertIcon');
const alertTitleEl = document.getElementById('alertTitle');
const alertMessageEl = document.getElementById('alertMessage');
const alertButtonsEl = document.getElementById('alertButtons');

/* Negotiation modals */
const negotiationModal = document.getElementById('negotiationModal');
const negTargetSelect = document.getElementById('negTarget');
const offerRegionsDiv = document.getElementById('offerRegions');
const reqRegionsDiv = document.getElementById('reqRegions');
const negSendBtn = document.getElementById('negSendBtn');
const negCancelBtn = document.getElementById('negCancelBtn');

const negResponseModal = document.getElementById('negResponseModal');
const negResponseTitle = document.getElementById('negResponseTitle');
const negResponseBody = document.getElementById('negResponseBody');
const negAcceptBtn = document.getElementById('negAcceptBtn');
const negDeclineBtn = document.getElementById('negDeclineBtn');

// Activity Log elements
const activityLog = document.getElementById('activityLog');
const logEntries = document.getElementById('logEntries');
const logFilterAll = document.getElementById('logFilterAll');
const logFilterMine = document.getElementById('logFilterMine');
const logFilterEvents = document.getElementById('logFilterEvents');

// Activity Log Sidebar elements
const logEntriesSidebar = document.getElementById('logEntriesSidebar');
const logFilterAllSidebar = document.getElementById('logFilterAllSidebar');
const logFilterMineSidebar = document.getElementById('logFilterMineSidebar');
const logFilterEventsSidebar = document.getElementById('logFilterEventsSidebar');

// Achievements elements
const achievementsList = document.getElementById('achievementsList');

// Victory Modal elements
const victoryModal = document.getElementById('victoryModal');
const victoryModalTitle = document.getElementById('victoryModalTitle');
const victoryModalMessage = document.getElementById('victoryModalMessage');
const victoryModalClose = document.getElementById('victoryModalClose');

/* ---------------- Initialization ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  // populate icon options
  GAME_CONFIG.PLAYER_ICONS.forEach(ico=>{
    const el = document.createElement('div');
    el.className = 'icon-option';
    el.textContent = ico;
    el.title = `Ícone ${ico}`;
    el.addEventListener('click', ()=> {
      document.querySelectorAll('.icon-option').forEach(e=>e.classList.remove('selected'));
      el.classList.add('selected');
    });
    iconSelectionEl.appendChild(el);
  });

  renderManualFromText();

 // ATUALIZAÇÃO 1.1: Garantir que o ícone flutuante funcione na tela inicial
 if (manualIcon) {
    manualIcon.addEventListener('click', ()=> openManual());
  }

  // O ícone da navbar só existe na tela de jogo, e o listener dele será ativado
  // quando ele for visível (aqui mantido, mas o foco é o flutuante agora)
  if (manualIconNavbar) { 
    manualIconNavbar.addEventListener('click', ()=> openManual());
  }
  manualCloseBtn.addEventListener('click', ()=> closeManual());

  // Removendo a repetição e garantindo que os listeners dos tabs funcionem
  manualTabs.forEach(t => t.addEventListener('click', handleManualTabClick));
  if (manualTabs[0]) { manualTabs[0].classList.add('active'); showManualTab(manualTabs[0].dataset.tab); }

  // Alert modal default OK handler placeholder; will be set per showAlert/showConfirm
  // Negotiation UI hooks
  document.getElementById('negSendBtn').addEventListener('click', handleSendNegotiation);
  document.getElementById('negCancelBtn').addEventListener('click', ()=> negotiationModal.classList.add('hidden'));
  negAcceptBtn.addEventListener('click', ()=> handleNegResponse(true));
  negDeclineBtn.addEventListener('click', ()=> handleNegResponse(false));

  tryRequestFullscreenOnce();
});

/* ---------------- Global Alert / Confirm API ---------------- */
/**
 * showAlert(title, message, type)
 * type: 'info'|'warning'|'error'|'success'
 */
function showAlert(title, message, type='info'){
  let icon = 'ℹ️';
  if (type === 'warning') icon = '🟡';
  if (type === 'error') icon = '🔴';
  if (type === 'success') icon = '🟢';
  alertIconEl.textContent = icon;
  alertTitleEl.textContent = title;
  alertMessageEl.textContent = message;
  // set buttons: simple OK
  alertButtonsEl.innerHTML = '';
  const ok = document.createElement('button');
  ok.className = 'px-4 py-2 bg-gray-800 border border-white/6 rounded-full text-white';
  ok.textContent = 'OK';
  ok.addEventListener('click', hideAlert);
  alertButtonsEl.appendChild(ok);
  alertModalEl.classList.remove('hidden');
  setTimeout(()=> alertModalEl.classList.add('show'), 10);
}
function hideAlert(){ alertModalEl.classList.remove('show'); setTimeout(()=> alertModalEl.classList.add('hidden'), 180); }

/**
 * showConfirm(title, message) -> Promise<boolean>
 * We inject two buttons Yes/No and resolve promise when clicked.
 */
function showConfirm(title, message){
  return new Promise(resolve => {
    let resolved = false;
    alertIconEl.textContent = '❓';
    alertTitleEl.textContent = title;
    alertMessageEl.textContent = message;
    alertButtonsEl.innerHTML = '';
    const no = document.createElement('button');
    no.className = 'px-4 py-2 bg-gray-800 border border-white/6 rounded-full text-white mr-2';
    no.textContent = 'Não';
    no.addEventListener('click', ()=> { if (resolved) return; resolved = true; hideAlert(); resolve(false); });

    const yes = document.createElement('button');
    yes.className = 'px-4 py-2 bg-green-600 rounded-full text-white';
    yes.textContent = 'Sim';
    yes.addEventListener('click', ()=> { if (resolved) return; resolved = true; hideAlert(); resolve(true); });

    alertButtonsEl.appendChild(no);
    alertButtonsEl.appendChild(yes);
    alertModalEl.classList.remove('hidden');
    setTimeout(()=> alertModalEl.classList.add('show'), 10);
  });
}

// ------- EVENT MODAL UI -------
const eventModalEl = document.getElementById('eventModal');
const eventIconEl = document.getElementById('eventIcon');
const eventTitleEl = document.getElementById('eventTitle');
const eventDescriptionEl = document.getElementById('eventDescription');
const eventEffectEl = document.getElementById('eventEffect');
const eventDurationEl = document.getElementById('eventDuration');
const eventOkBtn = document.getElementById('eventOkBtn');
// Event Banner elements
const eventBanner = document.getElementById('eventBanner');
const eventBannerContent = document.getElementById('eventBannerContent');
const eventBannerIcon = document.getElementById('eventBannerIcon');
const eventBannerTitle = document.getElementById('eventBannerTitle');
const eventBannerTurns = document.getElementById('eventBannerTurns');
const eventBannerEffect = document.getElementById('eventBannerEffect');
const eventBannerClose = document.getElementById('eventBannerClose');

function openEventModal(ev) {
  if (!ev) return;
  eventIconEl.textContent = ev.icon;
  eventTitleEl.textContent = ev.name;
  eventDescriptionEl.textContent = ev.description;
  eventEffectEl.textContent = `Efeito: ${ev.effect}`;
  eventDurationEl.textContent = ev.duration > 0 
    ? `Duração: ${ev.duration} turno(s)` 
    : `Duração: instantâneo`;

  eventModalEl.classList.remove('hidden');
}

function closeEventModal() {
  eventModalEl.classList.add('hidden');
}

// ------- EVENT BANNER -------
function showEventBanner(event) {
  if (!event) return;
  
  // Definir conteúdo
  eventBannerIcon.textContent = event.icon;
  eventBannerTitle.textContent = event.name;
  eventBannerTurns.textContent = `${gameState.eventTurnsLeft} turno${gameState.eventTurnsLeft > 1 ? 's' : ''} restante${gameState.eventTurnsLeft > 1 ? 's' : ''}`;
  eventBannerEffect.textContent = event.effect;
  
  // Determinar categoria e cor
  const category = getEventCategory(event.id);
  
  // Resetar classes e adicionar nova categoria
  eventBanner.className = 'mb-3 p-3 rounded-lg border animate-pulse-slow';
  eventBanner.classList.add(`event-${category}`);
  
  // Ajustar cor do texto
  if (category === 'positive') {
    eventBannerTitle.className = 'text-xs font-bold flex-1 text-green-300';
    eventBannerEffect.className = 'text-xs mb-1 text-green-200';
  } else if (category === 'negative') {
    eventBannerTitle.className = 'text-xs font-bold flex-1 text-red-300';
    eventBannerEffect.className = 'text-xs mb-1 text-red-200';
  } else if (category === 'neutral') {
    eventBannerTitle.className = 'text-xs font-bold flex-1 text-yellow-300';
    eventBannerEffect.className = 'text-xs mb-1 text-yellow-200';
  } else {
    eventBannerTitle.className = 'text-xs font-bold flex-1 text-purple-300';
    eventBannerEffect.className = 'text-xs mb-1 text-purple-200';
  }
  
  // Mostrar banner
  eventBanner.classList.remove('hidden');
}

function hideEventBanner() {
  eventBanner.classList.add('hidden');
}

function updateEventBanner() {
  if (gameState.currentEvent && gameState.eventTurnsLeft > 0) {
    showEventBanner(gameState.currentEvent);
  } else {
    hideEventBanner();
  }
}

function getEventCategory(eventId) {
  const positive = ['primavera', 'mercado', 'festival', 'exploracao', 'enchente'];
  const negative = ['seca', 'tempestade', 'inflacao', 'escassez_pedra', 'areia', 'depressao'];
  const mixed = ['jazida', 'inverno', 'tecnologia', 'arqueologia'];
  
  if (positive.includes(eventId)) return 'positive';
  if (negative.includes(eventId)) return 'negative';
  if (mixed.includes(eventId)) return 'mixed';
  return 'neutral';
}

// Listener do botão de fechar
eventBannerClose?.addEventListener('click', () => {
  hideEventBanner();
});


// Listener do botão "Entendi"
eventOkBtn?.addEventListener('click', () => {
  closeEventModal();
});

victoryModalClose?.addEventListener('click', () => {
  victoryModal.classList.add('hidden');
});


/* Small wrapper for compatibility */
function showFeedback(message, type='info'){ const t = type === 'error' ? 'Erro' : type === 'success' ? 'Sucesso' : 'Informação'; showAlert(t, message, type); }

/* ---------------- Fullscreen helper ---------------- */
function tryRequestFullscreenOnce(){
  const el = document.documentElement;
  if (el.requestFullscreen) el.requestFullscreen().catch(()=>{});
  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  document.body.addEventListener('click', ()=> { if (!document.fullscreenElement) tryRequestFullscreenOnce(); }, {once:true});
}

/* ---------------- Player registration & start ---------------- */
function updatePlayerCountDisplay(){
  playerCountDisplayEl.textContent = `${gameState.players.length}/4 Jogadores Registrados`;
  registeredPlayersListEl.innerHTML = gameState.players.length === 0 ? `<div class="text-sm text-gray-300 p-3">Nenhum jogador cadastrado.</div>` :
    gameState.players.map(p=>`<div class="flex items-center gap-2 p-2 bg-white/3 rounded-lg" style="border-left:4px solid ${p.color}"><div class="text-2xl">${p.icon}</div><div class="text-sm font-medium">${p.name}</div></div>`).join('');
  startGameBtn.disabled = gameState.players.length < 2;
}

addPlayerBtn.addEventListener('click', ()=>{
  const name = playerNameInput.value.trim();
  const selected = document.querySelector('.icon-option.selected');
  if (!name || !selected){ showFeedback('Informe o nome e selecione um ícone.', 'error'); return; }
  if (gameState.players.length >= 4){ showFeedback('Máximo de 4 jogadores atingido.', 'warning'); return; }
  const color = GAME_CONFIG.PLAYER_COLORS[gameState.players.length % GAME_CONFIG.PLAYER_COLORS.length];
  const p = { id: gameState.players.length, name, icon: selected.textContent.trim(), color, resources: {...GAME_CONFIG.INITIAL_RESOURCES}, victoryPoints:0, regions:[], consecutiveNoActionTurns:0 };
  gameState.players.push(p);
  playerNameInput.value = '';
  selected.classList.remove('selected');
  updatePlayerCountDisplay();
  // showFeedback(`${p.name} adicionado com sucesso!`, 'success'); // REMOVIDO conforme solicitado
});

startGameBtn.addEventListener('click', ()=>{
  if (gameState.players.length < 2){ showFeedback('São necessários ao menos 2 jogadores.', 'error'); return; }
  initialScreenEl.style.display = 'none';
  gameNavbar.classList.remove('hidden'); gameContainer.classList.remove('hidden'); sidebarEl.classList.remove('hidden'); gameMap.classList.remove('hidden'); gameFooter.classList.remove('hidden');
  document.body.classList.add('game-active');

  if (manualIcon) manualIcon.classList.add('hidden'); // Oculta o flutuante na tela de jogo

  setupRegions(); distributeInitialRegions(); renderAll();
  gameState.gameStarted = true; gameState.turn = 1; gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
  updateTurnInfo(); updateFooter();
});

/* ---------------- Regions (setup/distribute) ---------------- */
function setupRegions(){
  gameState.regions = [];
  const total = GAME_CONFIG.GRID_SIZE * GAME_CONFIG.GRID_SIZE;
  for (let i=0;i<total;i++){
    const biome = GAME_CONFIG.BIOMES[Math.floor(Math.random()*GAME_CONFIG.BIOMES.length)];
    const resources = generateResourcesForBiome(biome);
    gameState.regions.push({ id:i, name: GAME_CONFIG.REGION_NAMES[i], biome, explorationLevel: Math.floor(Math.random()*2), resources, controller: null, structures: [] });
  }
}
function generateResourcesForBiome(biome){
  switch(biome){
    case 'Floresta Tropical': return { madeira:6, pedra:1, ouro:0, agua:3 };
    case 'Floresta Temperada': return { madeira:5, pedra:2, ouro:0, agua:2 };
    case 'Savana': return { madeira:2, pedra:1, ouro:3, agua:1 };
    case 'Pântano': return { madeira:1, pedra:3, ouro:0, agua:4 };
    default: return { madeira:2, pedra:2, ouro:1, agua:1 };
  }
}
function distributeInitialRegions(){
  const total = gameState.regions.length;
  const indices = [...Array(total).keys()].sort(()=>Math.random()-0.5);
  let idx = 0;
  for (let p=0;p<gameState.players.length;p++) gameState.players[p].regions = [];
  for (let p=0;p<gameState.players.length;p++){
    for (let r=0;r<4 && idx<indices.length;r++){
      const rid = indices[idx++];
      gameState.regions[rid].controller = p;
      gameState.players[p].regions.push(rid);
    }
  }
}

/* ---------------- Rendering ---------------- */
function renderAll(){ renderHeaderPlayers(); renderBoard(); renderSidebar(gameState.selectedPlayerForSidebar); updateEventBanner(); }

// Função utilitária para atualizar toda a UI após mudança de estado
function refreshUIAfterStateChange() {
  renderHeaderPlayers();
  renderBoard();
  renderSidebar(gameState.selectedPlayerForSidebar);
  updateFooter();
}

// Sistema de Logs de Atividade
let activityLogHistory = [];

// Função para adicionar log
function addActivityLog(type, playerName, action, details = '', turn = gameState.turn) {
  const timestamp = new Date().toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const logEntry = {
    id: Date.now(),
    timestamp,
    turn,
    type,
    playerName,
    action,
    details,
    isEvent: type === 'event',
    isMine: playerName === gameState.players[gameState.currentPlayerIndex]?.name
  };
  
  activityLogHistory.unshift(logEntry);
  activityLogHistory = activityLogHistory.slice(0, 15); // Manter apenas últimas 15 entradas
  
  renderActivityLog();
  scrollLogToTop();
}

// Função para renderizar logs
function renderActivityLog(filter = 'all') {
  // Renderizar no painel principal (se existir)
  if (logEntries) {
    logEntries.innerHTML = '';
    const filteredLogs = activityLogHistory.filter(log => {
      if (filter === 'mine') return log.isMine;
      if (filter === 'events') return log.isEvent;
      return true;
    });
    
    filteredLogs.forEach(log => {
      const entry = document.createElement('div');
      entry.className = `log-entry ${log.type}`;
      
      let icon = '';
      switch(log.type) {
        case 'action': icon = '⚡'; break;
        case 'build': icon = '🏗️'; break;
        case 'explore': icon = '⛏️'; break;
        case 'collect': icon = '🌾'; break;
        case 'negotiate': icon = '🤝'; break;
        case 'event': icon = '🎴'; break;
        case 'victory': icon = '🏆'; break;
        default: icon = '📝';
      }
      
      entry.innerHTML = `
        <span class="log-entry-icon">${icon}</span>
        <div class="log-entry-text">
          <span class="log-entry-player">${log.playerName}</span> ${log.action} 
          <span class="text-gray-400">${log.details}</span>
        </div>
        <span class="log-entry-turn">T${log.turn}</span>
      `;
      
      logEntries.appendChild(entry);
    });
  }
  
  // Renderizar no sidebar
  if (logEntriesSidebar) {
    logEntriesSidebar.innerHTML = '';
    const filteredLogs = activityLogHistory.filter(log => {
      if (filter === 'mine') return log.isMine;
      if (filter === 'events') return log.isEvent;
      return true;
    });
    
    filteredLogs.forEach(log => {
      const entry = document.createElement('div');
      entry.className = 'flex items-center gap-1';
      
      let icon = '';
      switch(log.type) {
        case 'action': icon = '⚡'; break;
        case 'build': icon = '🏗️'; break;
        case 'explore': icon = '⛏️'; break;
        case 'collect': icon = '🌾'; break;
        case 'negotiate': icon = '🤝'; break;
        case 'event': icon = '🎴'; break;
        case 'victory': icon = '🏆'; break;
        default: icon = '📝';
      }
      
      entry.innerHTML = `
        <span class="text-xs">${icon}</span>
        <span class="truncate">${log.playerName} ${log.action} ${log.details}</span>
        <span class="ml-auto text-[9px] text-gray-500">T${log.turn}</span>
      `;
      
      logEntriesSidebar.appendChild(entry);
    });
  }
  
  // Atualizar filtros visuais
  document.querySelectorAll('.log-filter-sidebar').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
}

// Função para scroll automático
function scrollLogToTop() {
  const logContainer = logEntries.parentElement;
  if (logContainer) {
    logContainer.scrollTop = 0;
  }
}

// Listeners dos filtros
logFilterAll?.addEventListener('click', () => renderActivityLog('all'));
logFilterMine?.addEventListener('click', () => renderActivityLog('mine'));
logFilterEvents?.addEventListener('click', () => renderActivityLog('events'));
// Listeners dos filtros do sidebar
logFilterAllSidebar?.addEventListener('click', () => renderActivityLog('all'));
logFilterMineSidebar?.addEventListener('click', () => renderActivityLog('mine'));
logFilterEventsSidebar?.addEventListener('click', () => renderActivityLog('events'));

// Função utilitária para limpar seleção de região
function clearRegionSelection() {
  gameState.selectedRegionId = null;
  document.querySelectorAll('.board-cell').forEach(c => c.classList.remove('region-selected'));
}



function renderHeaderPlayers(){
  playerHeaderList.innerHTML = gameState.players.map((p,i)=>
    `<button data-index="${i}" class="px-3 py-1 rounded-lg ${i===gameState.currentPlayerIndex ? 'ring-2 ring-yellow-300' : 'bg-white/5'} text-white text-sm flex items-center gap-2">
      <div class="text-xl">${p.icon}</div>
      <div>
        <div class="font-medium">${p.name}</div>
        <div class="text-xs text-yellow-400">${p.victoryPoints} PV</div> </div>
    </button>`).join('');
  playerHeaderList.querySelectorAll('button').forEach(btn=> btn.addEventListener('click', ()=>{ const idx = Number(btn.dataset.index); gameState.selectedPlayerForSidebar = idx; renderSidebar(idx); }));
}
function renderBoard(){
  boardContainer.innerHTML = '';
  gameState.regions.forEach(region=>{
    const cell = document.createElement('div');
    cell.className = 'board-cell';
    if (region.controller !== null) cell.classList.add('controlled'); else cell.classList.add('neutral');
    cell.dataset.regionId = region.id;

    // Converter hex para RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [255, 255, 255];
}

// Adicionar cor do jogador
if (region.controller !== null) {
  const player = gameState.players[region.controller];
  const rgb = hexToRgb(player.color);
  cell.style.setProperty('--player-rgb', rgb.join(', '));
  cell.style.setProperty('--player-color', player.color);
}


    const header = document.createElement('div'); header.className = 'flex items-center justify-between';
    header.innerHTML = `<div><div class="text-xs font-semibold leading-tight">${region.name}</div><div class="text-[10px] text-gray-400">${region.biome}</div></div><div class="text-xs">${region.explorationLevel}⭐</div>`;

    const res = document.createElement('div'); res.className = 'mt-1 flex items-center gap-1.5 text-base';
    Object.entries(region.resources).forEach(([k,v])=>{ 
      const span = document.createElement('span'); 
      span.className='flex items-center gap-0.5'; 
      span.innerHTML = `${RESOURCE_ICONS[k]}<span class="text-xs font-medium">${v}</span>`; 
      res.appendChild(span); 
    });

    const footer = document.createElement('div'); footer.className = 'flex items-center justify-between mt-3 text-sm';
    footer.innerHTML = `<div>${region.controller !== null ? gameState.players[region.controller].icon+' '+gameState.players[region.controller].name : '<span class="text-gray-400">Neutro</span>'}</div><div>${region.structures.length?region.structures.join(', '):'—'}</div>`;

    cell.appendChild(header); cell.appendChild(res); cell.appendChild(footer);

    // Hover tooltip behavior
    cell.addEventListener('mouseenter', (ev)=> showRegionTooltip(region, ev.currentTarget));
    cell.addEventListener('mousemove', (ev)=> positionTooltip(ev.currentTarget));
    cell.addEventListener('mouseleave', hideRegionTooltip);

        // Click seleciona/desseleciona região - SEM delay, feedback visual imediato
    cell.addEventListener('click', (e)=> {
        e.stopPropagation(); // Previne bubbling
        const regionId = Number(cell.dataset.regionId);
        
        // Toggle: Se clicar na região já selecionada, desseleciona
        if (gameState.selectedRegionId === regionId) {
            gameState.selectedRegionId = null;
            cell.classList.remove('region-selected');
        } else {
            // Seleciona nova região
            gameState.selectedRegionId = regionId;
            document.querySelectorAll('.board-cell').forEach(c => c.classList.remove('region-selected'));
            cell.classList.add('region-selected');
        }
        
        renderSidebar(gameState.selectedPlayerForSidebar);
        updateFooter(); 
    });

    boardContainer.appendChild(cell);
  });
}

function refreshUIAfterStateChange() {
  renderHeaderPlayers();
  renderBoard();
  renderSidebar(gameState.selectedPlayerForSidebar);
  updateFooter();
}


/* ---------------- Tooltip handlers (hover) ---------------- */
function showRegionTooltip(region, targetEl){
  tooltipTitle.textContent = `${region.name} — ${region.biome}`;
  const owner = region.controller !== null ? `${gameState.players[region.controller].icon} ${gameState.players[region.controller].name}` : 'Neutro';
  const structures = region.structures.length ? region.structures.join(', ') : '—';
  tooltipBody.innerHTML = `
    <div class="text-xs text-gray-300">Exploração: <strong>${region.explorationLevel}</strong></div>
    <div class="text-xs text-gray-300 mt-1">Controlado por: <strong>${owner}</strong></div>
    <div class="text-xs text-gray-300 mt-1">Estruturas: <strong>${structures}</strong></div>
    <div class="text-xs text-gray-300 mt-2">Recursos:</div>
    <div class="mt-1">${Object.entries(region.resources).map(([k,v])=>`<span class="badge mr-1">${k}: ${v}</span>`).join('')}</div>
  `;
  // show and position
  regionTooltip.classList.remove('hidden'); regionTooltip.classList.add('visible');
  positionTooltip(targetEl);
}
function positionTooltip(targetEl){
  const rect = targetEl.getBoundingClientRect();
  const tooltipRect = regionTooltip.getBoundingClientRect();

  // 1. Tentar posicionar no topo (mantido para compatibilidade vertical)
  const top = (rect.top - tooltipRect.height - 8) > 10 ? rect.top - tooltipRect.height - 8 : rect.bottom + 8;

  // 2. Priorizar POSICIONAMENTO À ESQUERDA da região, centralizado verticalmente na largura da região.
  let left = rect.left - tooltipRect.width - 8; // Tenta à esquerda
  
  // 3. Se não houver espaço à esquerda (i.e., perto da borda esquerda da tela)
  if (left < 10) {
    // Reposiciona para a direita da região
    left = rect.right + 8;
    // Se ainda assim não couber (ou se estiver muito perto da borda direita da tela), centraliza no topo da região
    if (left + tooltipRect.width > window.innerWidth - 10) {
        left = Math.min(window.innerWidth - tooltipRect.width - 10, Math.max(10, rect.left + (rect.width/2) - (tooltipRect.width/2)));
    }
  }

  regionTooltip.style.top = `${top + window.scrollY}px`;
  regionTooltip.style.left = `${left + window.scrollX}px`;
}
function hideRegionTooltip(){
  regionTooltip.classList.add('hidden'); regionTooltip.classList.remove('visible');
}

/* ---------------- Sidebar ---------------- */
function renderSidebar(playerIndex){
  const p = gameState.players[playerIndex];
  if(!p) return;
  
  // Header compacto com cor do jogador
  const isCurrentPlayer = playerIndex === gameState.currentPlayerIndex;
  const playerColorStyle = `border-left: 4px solid ${p.color}`;

  sidebarPlayerHeader.innerHTML = `
    <div class="flex items-center gap-3 p-2 rounded-lg" style="${playerColorStyle}; background: rgba(${hexToRgb(p.color)}, 0.05);">
      <div class="text-3xl">${p.icon}</div>
      <div class="flex-1">
        <div class="text-base font-semibold text-white">${p.name}</div>
        <div class="text-xs text-gray-300">Jogador ${p.id+1} ${isCurrentPlayer ? '• 🎮 TURNO' : ''}</div>
      </div>
      <div class="text-2xl font-bold text-yellow-400">${p.victoryPoints} PV</div>
    </div>
  `;
  
   // Sistema de conquistas
   renderAchievements();

  // Recursos compactos com ícones (sem padding extra)
  resourceListEl.innerHTML = Object.entries(p.resources).map(([k,v])=>
    `<li class="flex justify-between items-center py-0.5">
      <span class="text-sm text-gray-200 flex items-center gap-1.5">
        <span class="text-base">${RESOURCE_ICONS[k]}</span>
        <span class="capitalize">${k}</span>
      </span>
      <span class="text-sm font-bold text-white">${v}</span>
    </li>`
  ).join('');
  
  // Limpar score duplicado
  scoreBlockEl.textContent = '';
  
  // Regiões agrupadas por bioma - APENAS LETRAS
  if (p.regions.length > 0) {
    const regionsByBiome = {};
    p.regions.forEach(rid => {
      const region = gameState.regions[rid];
      if (!regionsByBiome[region.biome]) {
        regionsByBiome[region.biome] = [];
      }
      regionsByBiome[region.biome].push(region);
    });
    
    const biomeEmojis = {
      'Floresta Tropical': '🌴',
      'Floresta Temperada': '🌲',
      'Savana': '🏜️',
      'Pântano': '🌊'
    };
    
    controlledRegionsEl.innerHTML = Object.entries(regionsByBiome).map(([biome, regions]) => {
      // Extrair apenas a letra da região (ex: "Região A" -> "A")
      const regionLetters = regions.map(r => r.name.split(' ').pop());
      
      return `
      <div class="mb-2">
        <div class="text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1">
          <span>${biomeEmojis[biome] || '🗺️'}</span>
          <span>${biome}</span>
          <span class="text-yellow-400">(${regions.length})</span>
        </div>
        <div class="flex flex-wrap gap-1">
          ${regionLetters.map(letter => `
            <span class="text-xs font-medium bg-white/5 px-1.5 py-0.5 rounded border border-white/10" style="border-left: 3px solid ${p.color}">
              ${letter}
            </span>
          `).join('')}
        </div>
      </div>
      `;
    }).join('');
  } else {
    controlledRegionsEl.innerHTML = `<div class="text-sm text-gray-400 italic">Nenhuma região controlada</div>`;
  }
}

function renderAchievements() {
  if (!achievementsList) return;
  
  achievementsList.innerHTML = '';
  
  ACHIEVEMENTS.forEach(achievement => {
    const unlocked = achievement.condition(achievementsState);
    achievement.unlocked = unlocked;
    
    if (!unlocked) return; // Não exibir conquistas não conquistadas
    
    const item = document.createElement('div');
    item.className = `achievement achievement-unlocked`;
    
    item.innerHTML = `
      <span class="achievement-icon">${achievement.icon}</span>
      <div class="achievement-info">
        <div class="achievement-name">${achievement.name}</div>
        <div class="achievement-desc">${achievement.description}</div>
      </div>
    `;
    
    achievementsList.appendChild(item);
  });
}

// Função auxiliar para converter hex para RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 255, 255';
}

// Função para retirar a seleção das regiões após executar uma ação
function clearRegionSelection() {
  gameState.selectedRegionId = null;
  document.querySelectorAll('.board-cell').forEach(c => c.classList.remove('region-selected'));
}

/* ---------------- Turn & Actions ---------------- */
function updateTurnInfo(){
  const current = gameState.players[gameState.currentPlayerIndex];
  turnInfo.textContent = `Turno: ${gameState.turn} • Jogador: ${current ? current.name: '—'}`;
  actionsLeftEl.textContent = `Ações restantes: ${gameState.actionsLeft}`;
  playerHeaderList.querySelectorAll('button').forEach((btn, idx)=> {
    if (idx === gameState.currentPlayerIndex) btn.classList.add('ring-2','ring-yellow-300'); else btn.classList.remove('ring-2','ring-yellow-300');
  });
}
function consumeAction(){ if (gameState.actionsLeft <= 0){ showFeedback('Sem ações restantes neste turno.', 'warning'); return false; } gameState.actionsLeft--; updateTurnInfo(); updateFooter(); return true; }

/* Explore (async because uses showConfirm) */
actionExploreBtn.addEventListener('click', async ()=>{
  if (gameState.selectedRegionId === null){
    showFeedback('Selecione uma região primeiro.', 'error');
    return;
  }
  
  const region = gameState.regions[gameState.selectedRegionId];
  const player = gameState.players[gameState.currentPlayerIndex];
  
  // Verifica se é região neutra (não dominada)
  if (region.controller === null) {
    // ASSUMIR DOMÍNIO
    const cost = region.resources; // Custo é os recursos do bioma
    const pvCost = 2;
    
    // Verificar se tem PV suficiente
    if (player.victoryPoints < pvCost) {
      showFeedback(`Você precisa de ${pvCost} PV para assumir domínio desta região.`, 'error');
      return;
    }
    
    // Verificar se tem recursos suficientes
    const canPay = Object.entries(cost).every(([k,v]) => player.resources[k] >= v);
    if (!canPay) {
      const needed = Object.entries(cost).map(([k,v]) => `${k}: ${v}`).join(', ');
      showFeedback(`Recursos insuficientes. Necessário: ${needed}`, 'error');
      return;
    }
    
    // Confirmar ação
    const resourceList = Object.entries(cost).map(([k,v]) => `${RESOURCE_ICONS[k]}${v}`).join(' ');
    const ok = await showConfirm(
      'Assumir Domínio', 
      `Custo: ${pvCost} PV + ${resourceList}\n\nDeseja assumir o controle de ${region.name}?`
    );
    if (!ok) return;
    
    if (!consumeAction()) return;
    
    // Pagar custos
    player.victoryPoints -= pvCost;
    Object.entries(cost).forEach(([k,v]) => player.resources[k] -= v);
    
    // Assumir controle
    region.controller = gameState.currentPlayerIndex;
    player.regions.push(gameState.selectedRegionId);
    
    showFeedback(`${region.name} agora está sob seu controle! -${pvCost} PV`, 'success');
    // Registrar no log
    addActivityLog('explore', player.name, 'assumiu domínio de', region.name, gameState.turn);
  } else if (region.controller === gameState.currentPlayerIndex) {
    // EXPLORAR (região própria)
    const cost = GAME_CONFIG.ACTION_DETAILS.explorar.cost;
    const canPay = Object.entries(cost).every(([k,v]) => player.resources[k] >= v);
    
    if (!canPay) {
      showFeedback('Recursos insuficientes para explorar.', 'error');
      return;
    }
    
    if (!consumeAction()) return;
    
    // Pagar custo
    Object.entries(cost).forEach(([k,v]) => player.resources[k] -= v);
    
    // Explorar
    region.explorationLevel = Math.min(3, region.explorationLevel + 1);
    player.victoryPoints += 1;
    
    if (Math.random() < 0.10){ 
      player.resources.ouro += 1; 
      showFeedback('Descoberta Rara! +1 Ouro', 'success'); 
    } else {
      showFeedback(`${region.name} explorada. Nível: ${region.explorationLevel}⭐`, 'success');
    }

    // Após explorar uma região
    achievementsState.totalExplored++;
    renderAchievements();

    // Registrar no log
    const desc = Math.random() < 0.10 ? 'explorou (Descoberta Rara!)' : `explorou (Nível ${region.explorationLevel})`;
    addActivityLog('explore', player.name, desc, region.name, gameState.turn);
    
  } else {
    showFeedback('Você não pode explorar regiões de outros jogadores.', 'error');
    return;
  }
  clearRegionSelection();
  refreshUIAfterStateChange();
});


/* FUNÇÃO DO BOTÃO RECOLHER */
actionCollectBtn.addEventListener('click', () => {
  if (gameState.selectedRegionId === null) {
    showFeedback('Selecione uma região para recolher.', 'error');
    return;
  }

  if (!consumeAction()) {
    showFeedback('Sem ações restantes neste turno.', 'warning');
    return;
  }

  const region = gameState.regions[gameState.selectedRegionId];
  const player = gameState.players[gameState.currentPlayerIndex];

  // Validação: região deve ser controlada pelo jogador E ter exploração > 0
  if (region.controller !== player.id) {
    showFeedback('Você não controla essa região.', 'error');
    return;
  }

  if (region.explorationLevel === 0) {
    showFeedback('Você deve explorar a região antes de recolher.', 'warning');
    return;
  }

  // ✅ RECOLHER RECURSOS
  let harvestPercent = 0.5;

  // Bônus de exploração nível 1: +1 recurso aleatório
  if (region.explorationLevel >= 1) {
    const resourceTypes = Object.keys(region.resources).filter(k => region.resources[k] > 0);
    if (resourceTypes.length > 0) {
      const randomRes = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
      player.resources[randomRes] += 1;
      showFeedback(`Bônus de exploração: +1 ${randomRes}!`, 'info');
    }
  }

  // Bônus de exploração nível 3: +50% recursos (75% total)
  if (region.explorationLevel === 3) {
    harvestPercent = 0.75;
    showFeedback('Recolha potencializada! +50% recursos.', 'info');
  }

  // Bônus de evento: Festival da Colheita
  if (gameState.eventModifiers.festivalBonus) {
    const resourceTypes = ['madeira', 'pedra', 'ouro', 'agua'];
    const bonus1 = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
    const bonus2 = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
    player.resources[bonus1] += 2;
    player.resources[bonus2] += 2;
    showFeedback(`Festival! +2 ${bonus1} e +2 ${bonus2}!`, 'success');
  }

  // Bônus de evento: Inverno Rigoroso
  if (gameState.eventModifiers.coletaBonus) {
    Object.keys(gameState.eventModifiers.coletaBonus).forEach(res => {
      player.resources[res] += gameState.eventModifiers.coletaBonus[res];
    });
    showFeedback('Inverno rigoroso torna a coleta mais valiosa!', 'info');
  }

  // Coleta normal
  Object.keys(region.resources).forEach(k => {
    const amount = Math.max(0, Math.floor(region.resources[k] * harvestPercent));
    player.resources[k] += amount;
    region.resources[k] = Math.max(0, region.resources[k] - amount);
  });

  player.victoryPoints += 1;
  showFeedback(`Recursos recolhidos de ${region.name}. +1 PV`, 'success');
  
  // Registrar no log
  addActivityLog('collect', player.name, 'recolheu recursos', region.name, gameState.turn);

  // Limpar seleção e atualizar UI
  clearRegionSelection();
  refreshUIAfterStateChange();
});


/* FUNÇÃO DO BOTÃO CONSTRUIR */
actionBuildBtn.addEventListener('click', ()=> {
  if(gameState.selectedRegionId === null){ showFeedback('Selecione uma região para construir.', 'error'); return; }
  if(!consumeAction()) return;
  
  const region = gameState.regions[gameState.selectedRegionId];
  const player = gameState.players[gameState.currentPlayerIndex];
  
  // Custo base
  let cost = {madeira:3, pedra:2, ouro:1};
  
  // ⭐ BÔNUS DE EXPLORAÇÃO NÍVEL 2: -1 Pedra
  const explLevel = region.explorationLevel || 0;
  if (explLevel >= 2) {
    cost.pedra = Math.max(0, cost.pedra - 1);
    showFeedback('Desconto de exploração: -1 Pedra!', 'info');
  }
  
  const canPay = Object.entries(cost).every(([k,v])=>player.resources[k]>=v);
  if(!canPay){ showFeedback('Recursos insuficientes para construir.', 'error'); return; }
  
  Object.entries(cost).forEach(([k,v]) => { player.resources[k]-=v; });

  region.structures.push('Abrigo'); region.controller = gameState.currentPlayerIndex;
  if (!player.regions.includes(region.id)) player.regions.push(region.id);
    let pvGain = 2;
  
  // Bônus de evento (Boom Tecnológico)
  if (gameState.eventModifiers.construirBonus) {
    pvGain += gameState.eventModifiers.construirBonus;
  }
  
  player.victoryPoints += pvGain;
  showFeedback(`Construído Abrigo em ${region.name}. +${pvGain} PV.`, 'success');

  // Após construir uma estrutura
  achievementsState.totalBuilt++;
  renderAchievements();

  // Registrar no log
  addActivityLog('build', player.name, 'construiu Abrigo', region.name, gameState.turn);  

  clearRegionSelection();
  refreshUIAfterStateChange();
});

/* ---------------- Negotiation UI (complete) ---------------- */
/* Open negotiation modal for current player */
actionNegotiateBtn.addEventListener('click', ()=> {
  if (!consumeAction()) return; // negotiation costs 1 ouro later, but action consumes an action slot
  openNegotiationModal();
  updateFooter(); // Adicionado updateFooter aqui
});

/* Populate negotiation modal */
function openNegotiationModal(){
  const initiator = gameState.players[gameState.currentPlayerIndex];
  // populate targets (other players)
  negTargetSelect.innerHTML = '';
  gameState.players.forEach(p => {
    if (p.id !== initiator.id) {
      const opt = document.createElement('option'); opt.value = p.id; opt.textContent = `${p.icon} ${p.name}`; negTargetSelect.appendChild(opt);
    }
  });
  if (negTargetSelect.options.length === 0){ showFeedback('Nenhum outro jogador disponível para negociar.', 'warning'); return; }

  // populate offerRegions with initiator's regions
  offerRegionsDiv.innerHTML = '';
  initiator.regions.forEach(rid => {
    const chkWrap = document.createElement('label');
    chkWrap.className = 'flex items-center gap-2 p-2 bg-gray-800/60 rounded';
    const chk = document.createElement('input'); chk.type = 'checkbox'; chk.value = rid;
    const span = document.createElement('span'); span.className = 'text-sm'; span.textContent = `${gameState.regions[rid].name} (${gameState.regions[rid].biome})`;
    chkWrap.appendChild(chk); chkWrap.appendChild(span); offerRegionsDiv.appendChild(chkWrap);
  });

  // populate reqRegions with target's regions (refreshed on target change)
  populateReqRegions();

  negotiationModal.classList.remove('hidden');
}

/* when target changes, show their regions as selectable requested regions */
negTargetSelect && negTargetSelect.addEventListener('change', populateReqRegions);
function populateReqRegions(){
  const targetId = Number(negTargetSelect.value);
  reqRegionsDiv.innerHTML = '';
  const target = gameState.players.find(p => p.id === targetId);
  if (!target) return;
  target.regions.forEach(rid=>{
    const chkWrap = document.createElement('label');
    chkWrap.className = 'flex items-center gap-2 p-2 bg-gray-800/60 rounded';
    const chk = document.createElement('input'); chk.type = 'checkbox'; chk.value = rid;
    const span = document.createElement('span'); span.className = 'text-sm'; span.textContent = `${gameState.regions[rid].name} (${gameState.regions[rid].biome})`;
    chkWrap.appendChild(chk); chkWrap.appendChild(span); reqRegionsDiv.appendChild(chkWrap);
  });
}

/* Handle send negotiation: build negotiation object and present to target */
async function handleSendNegotiation(){
  const initiator = gameState.players[gameState.currentPlayerIndex];
  const targetId = Number(negTargetSelect.value);
  const target = gameState.players.find(p=>p.id === targetId);
  if (!target){ showFeedback('Selecione um jogador válido.', 'error'); return; }

  // gather offered resources
  const offer = {
    madeira: Number(document.getElementById('offer_madeira').value || 0),
    pedra: Number(document.getElementById('offer_pedra').value || 0),
    ouro: Number(document.getElementById('offer_ouro').value || 0),
    agua: Number(document.getElementById('offer_agua').value || 0),
    regions: Array.from(offerRegionsDiv.querySelectorAll('input[type="checkbox"]:checked')).map(c=>Number(c.value))
  };
  const request = {
    madeira: Number(document.getElementById('req_madeira').value || 0),
    pedra: Number(document.getElementById('req_pedra').value || 0),
    ouro: Number(document.getElementById('req_ouro').value || 0),
    agua: Number(document.getElementById('req_agua').value || 0),
    regions: Array.from(reqRegionsDiv.querySelectorAll('input[type="checkbox"]:checked')).map(c=>Number(c.value))
  };

  // Validate initiator has offered resources and owns offered regions
  const sufficientResources = ['madeira','pedra','ouro','agua'].every(k => offer[k] <= initiator.resources[k]);
  const ownsAllRegions = offer.regions.every(rid => initiator.regions.includes(rid));
  if (!sufficientResources){ showFeedback('Você não possui os recursos que está oferecendo.', 'error'); return; }
  if (!ownsAllRegions){ showFeedback('Você não controla todas as regiões que está oferecendo.', 'error'); return; }

  // Validate target has resources/regions requested
  const targetHasResources = ['madeira','pedra','ouro','agua'].every(k => request[k] <= target.resources[k]);
  const targetOwnsRegions = request.regions.every(rid => target.regions.includes(rid));
  if (!targetHasResources && !targetOwnsRegions){
    // it's allowed to request only resources OR regions, but if requesting some, ensure target can satisfy at least something
    // We'll not block here; target will decide when receiving (but we should at least warn if requesting resources > target has)
  }

  // Build negotiation object
  const negotiation = {
    initiatorId: initiator.id,
    targetId: target.id,
    offer, request,
    timestamp: Date.now()
  };

  // Store pending negotiation to allow response handling
  gameState.pendingNegotiation = negotiation;

  // Charge cost of negotiation attempt (1 Ouro) only after attempt? Manual: cost obligatory at initiation - deduct now
  if (initiator.resources.ouro < 1){ showFeedback('Custo de negociação: 1 Ouro. Você não tem suficiente.', 'error'); negotiationModal.classList.add('hidden'); return; }
  initiator.resources.ouro -= 1;

  negotiationModal.classList.add('hidden');
  updateFooter(); // Adicionado updateFooter

  // Present negotiation to target via response modal
  presentNegotiationToTarget(negotiation);
}

/* Present negotiation to target player */
function presentNegotiationToTarget(neg){
  const initiator = gameState.players.find(p=>p.id === neg.initiatorId);
  const target = gameState.players.find(p=>p.id === neg.targetId);
  if (!initiator || !target){ showFeedback('Erro interno na negociação.', 'error'); return; }

  // render body summary
  const summary = [];
  if (Object.values(neg.offer).some(v=>v>0) || (neg.offer.regions && neg.offer.regions.length)){
    summary.push(`<div class="mb-2"><strong>${initiator.icon} ${initiator.name}</strong> oferece:</div>`);
    if (neg.offer.regions && neg.offer.regions.length) summary.push(`<div class="mb-1 text-sm">Regiões: ${neg.offer.regions.map(r=>gameState.regions[r].name).join(', ')}</div>`);
    summary.push(`<div class="text-sm">Recursos: ${['madeira','pedra','ouro','agua'].map(k=>`${k}:${neg.offer[k]}`).join(' • ')}</div>`);
  } else summary.push(`<div class="text-sm">Sem oferta de recursos ou regiões.</div>`);

  if (Object.values(neg.request).some(v=>v>0) || (neg.request.regions && neg.request.regions.length)){
    summary.push(`<div class="mt-3 mb-2"><strong>Solicita:</strong></div>`);
    if (neg.request.regions && neg.request.regions.length) summary.push(`<div class="mb-1 text-sm">Regiões: ${neg.request.regions.map(r=>gameState.regions[r].name).join(', ')}</div>`);
    summary.push(`<div class="text-sm">Recursos: ${['madeira','pedra','ouro','agua'].map(k=>`${k}:${neg.request[k]}`).join(' • ')}</div>`);
  } else summary.push(`<div class="text-sm mt-2">Sem solicitação de recursos/ regiões.</div>`);

  negResponseTitle.textContent = `Proposta de ${initiator.icon} ${initiator.name}`;
  negResponseBody.innerHTML = summary.join('');
  negResponseModal.classList.remove('hidden');
}

/* Handle target response */
function handleNegResponse(accepted){
  const negotiation = gameState.pendingNegotiation;
  if (!negotiation){ showFeedback('Nenhuma negociação pendente.', 'error'); negResponseModal.classList.add('hidden'); return; }
  const initiator = gameState.players.find(p=>p.id === negotiation.initiatorId);
  const target = gameState.players.find(p=>p.id === negotiation.targetId);

  if (accepted){
    // Validate both still have required resources/regions
    const initiatorHas = ['madeira','pedra','ouro','agua'].every(k => negotiatorHas(initiator, negotiation.offer, k));
    const targetHas = ['madeira','pedra','ouro','agua'].every(k => negotiatorHas(target, negotiation.request, k));
    const initiatorOwnsRegions = negotiation.offer.regions.every(rid => initiator.regions.includes(rid));
    const targetOwnsRegions = negotiation.request.regions.every(rid => target.regions.includes(rid));

    if (!initiatorHas || !initiatorOwnsRegions){ showFeedback('Oferta inválida no momento (recursos/ regiões do ofertante mudaram).', 'error'); negResponseModal.classList.add('hidden'); return; }
    if (!targetHas || !targetOwnsRegions){ showFeedback('Você não possui os recursos/regiões solicitadas.', 'error'); negResponseModal.classList.add('hidden'); return; }

    // Execute transfer: initiator -> target (offer), target -> initiator (request)
    ['madeira','pedra','ouro','agua'].forEach(k=>{
      const offerAmt = negotiation.offer[k] || 0;
      const reqAmt = negotiation.request[k] || 0;
      initiator.resources[k] -= offerAmt;
      target.resources[k] += offerAmt;

      target.resources[k] -= reqAmt;
      initiator.resources[k] += reqAmt;
    });

    // Transfer regions ownership
    negotiation.offer.regions.forEach(rid=>{
      // remove region from initiator and add to target
      initiator.regions = initiator.regions.filter(x=>x!==rid);
      target.regions.push(rid);
      gameState.regions[rid].controller = target.id;
    });
    negotiation.request.regions.forEach(rid=>{
      target.regions = target.regions.filter(x=>x!==rid);
      initiator.regions.push(rid);
      gameState.regions[rid].controller = initiator.id;
    });

    // Award PV to both
    initiator.victoryPoints += 1;
    target.victoryPoints += 1;

    showFeedback('Negociação aceita — troca realizada. Ambos ganham +1 PV.', 'success');
    
    // Após concluir negociação
    achievementsState.totalNegotiations++;
    renderAchievements();

    // Registrar no log
    addActivityLog('negotiate', `${initiator.name} e ${target.name}`, 'negociaram com sucesso', 'troca realizada', gameState.turn);

    clearRegionSelection();
    refreshUIAfterStateChange();

  } else {
    // refused: initiator already paid 1 ouro at initiation per rules
    showFeedback('Negociação recusada. O custo (1 Ouro) foi pago.', 'warning');
  }

  // clear pending negotiation
  gameState.pendingNegotiation = null;
  negResponseModal.classList.add('hidden');
  renderAll();
}

function negotiatorHas(player, obj, key){
  return (obj[key] || 0) <= (player.resources[key] || 0);
}

/* ---------------- Manual rendering (kept same) ---------------- */
function renderManualFromText(){
  const tabO = document.getElementById('tab-o-jogo');
  const tabRegioes = document.getElementById('tab-regioes');
  const tabRegras = document.getElementById('tab-regras');
  const tabAcoes = document.getElementById('tab-acoes');
  const tabEstrutura = document.getElementById('tab-estrutura');

  // ==================== ABA 1: O JOGO ====================
  tabO.innerHTML = `
    <h3 class="text-xl font-bold text-yellow-300 mb-3">🌍 Bem-vindo a Gaia Dominium</h3>
    
    <div class="bg-gradient-to-r from-teal-900/30 to-green-900/30 border border-teal-500/30 rounded-lg p-4 mb-4">
      <h4 class="text-base font-semibold text-teal-300 mb-2">A História de Gaia</h4>
      <p class="text-sm text-gray-200 leading-relaxed">
        Gaia era um mundo próspero, onde florestas exuberantes, savanas douradas e pântanos misteriosos coexistiam em harmonia. 
        Mas um cataclismo devastador quebrou esse equilíbrio. Agora, <strong class="text-yellow-300">25 regiões fragmentadas</strong> 
        aguardam restauração, cada uma rica em recursos naturais mas carente de liderança.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
      <div class="bg-gray-800/40 border border-gray-600/30 rounded-lg p-3">
        <h5 class="text-sm font-semibold text-cyan-300 mb-2">🎭 As Quatro Facções</h5>
        <p class="text-xs text-gray-300">
          Quatro facções emergem das cinzas, cada uma com sua visão única para reconstruir Gaia. 
          Você lidera uma delas na corrida pela supremacia ecológica e estratégica.
        </p>
      </div>
      
      <div class="bg-gray-800/40 border border-gray-600/30 rounded-lg p-3">
        <h5 class="text-sm font-semibold text-purple-300 mb-2">🗺️ 25 Regiões</h5>
        <p class="text-xs text-gray-300">
          De <strong>A</strong> a <strong>Y</strong>, cada região possui bioma único, recursos distintos 
          e potencial ilimitado para expansão e exploração.
        </p>
      </div>
    </div>

    <h4 class="text-base font-semibold text-green-300 mt-4 mb-2">🎯 Sua Missão</h4>
    <p class="text-sm text-gray-200 mb-3">
      <strong class="text-yellow-300">Acumule 25 Pontos de Vitória (PV)</strong> através de exploração estratégica, 
      construção inteligente, gestão de recursos e diplomacia calculada.
    </p>

    <div class="bg-yellow-900/20 border border-yellow-500/40 rounded-lg p-3 mb-4">
      <h5 class="text-sm font-bold text-yellow-300 mb-1">⚡ Elementos do Jogo</h5>
      <ul class="text-xs text-gray-200 space-y-1 ml-4">
        <li><strong>• Recursos:</strong> 🪵 Madeira, 🪨 Pedra, 💰 Ouro, 💧 Água</li>
        <li><strong>• Biomas:</strong> 🌴 Floresta Tropical, 🌲 Floresta Temperada, 🏜️ Savana, 🌊 Pântano</li>
        <li><strong>• Ações:</strong> Assumir Domínio, Explorar, Construir, Recolher, Negociar</li>
        <li><strong>• Eventos Globais:</strong> 15 eventos aleatórios que transformam o jogo</li>
      </ul>
    </div>

    <h4 class="text-base font-semibold text-green-300 mb-2">🏆 Condição de Vitória</h4>
    <div class="bg-green-900/20 border border-green-500/40 rounded-lg p-3">
      <p class="text-sm text-gray-200">
        A primeira facção a atingir <strong class="text-2xl text-yellow-300">${GAME_CONFIG.VICTORY_POINTS} PV</strong> 
        vence imediatamente e é proclamada <strong class="text-green-300">Guardiã de Gaia</strong>!
      </p>
    </div>
  `;

  // ==================== ABA 2: REGIÕES DE GAIA ====================
  tabRegioes.innerHTML = `
    <h3 class="text-xl font-bold text-yellow-300 mb-3">Regiões de Gaia</h3>
    
    <p class="text-sm text-gray-200 mb-4">
      Gaia é composta por <strong>25 regiões únicas</strong> (A-Y), cada uma pertencente a um dos quatro biomas principais. 
      Cada bioma possui características, recursos e estratégias distintas.
    </p>

    <h4 class="text-base font-semibold text-green-300 mb-3">Os Quatro Biomas</h4>

    <div class="space-y-3 mb-4">
      <div class="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-500/40 rounded-lg p-3">
        <h5 class="text-sm font-bold text-green-300 mb-2">Floresta Tropical</h5>
        <p class="text-xs text-gray-200 mb-2">
          Densas e exuberantes, as florestas tropicais são o coração verde de Gaia. Ricas em madeira e com depósitos de ouro escondidos, 
          são ideais para facções que buscam crescimento rápido e diversificação.
        </p>
        <div class="flex gap-2 flex-wrap text-xs">
          <span class="bg-green-800/50 px-2 py-1 rounded">6 Madeira</span>
          <span class="bg-green-800/50 px-2 py-1 rounded">1 Pedra</span>
          <span class="bg-green-800/50 px-2 py-1 rounded">3 Água</span>
        </div>
        <p class="text-xs text-teal-300 mt-2">
          <strong>Produção:</strong> +1 Madeira, +0.5 Ouro por turno
        </p>
      </div>

      <div class="bg-gradient-to-r from-teal-900/40 to-cyan-900/40 border border-teal-500/40 rounded-lg p-3">
        <h5 class="text-sm font-bold text-teal-300 mb-2">Floresta Temperada</h5>
        <p class="text-xs text-gray-200 mb-2">
          Equilibradas e resilientes, as florestas temperadas oferecem produção constante de madeira. 
          São a espinha dorsal econômica para construções e expansões sustentáveis.
        </p>
        <div class="flex gap-2 flex-wrap text-xs">
          <span class="bg-teal-800/50 px-2 py-1 rounded">5 Madeira</span>
          <span class="bg-teal-800/50 px-2 py-1 rounded">2 Pedra</span>
          <span class="bg-teal-800/50 px-2 py-1 rounded">2 Água</span>
        </div>
        <p class="text-xs text-teal-300 mt-2">
          <strong>Produção:</strong> +1.5 Madeira por turno
        </p>
      </div>

      <div class="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-500/40 rounded-lg p-3">
        <h5 class="text-sm font-bold text-yellow-300 mb-2">Savana</h5>
        <p class="text-xs text-gray-200 mb-2">
          Vastas planícies douradas repletas de ouro e água. As savanas são estratégicas para facções que focam em 
          negociações e acumulação de riquezas para ações diplomáticas.
        </p>
        <div class="flex gap-2 flex-wrap text-xs">
          <span class="bg-yellow-800/50 px-2 py-1 rounded">2 Madeira</span>
          <span class="bg-yellow-800/50 px-2 py-1 rounded">1 Pedra</span>
          <span class="bg-yellow-800/50 px-2 py-1 rounded">3 Ouro</span>
          <span class="bg-yellow-800/50 px-2 py-1 rounded">1 Água</span>
        </div>
        <p class="text-xs text-yellow-300 mt-2">
          <strong>Produção:</strong> +1.5 Madeira, +1 Água por turno
        </p>
      </div>

      <div class="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/40 rounded-lg p-3">
        <h5 class="text-sm font-bold text-blue-300 mb-2">Pântano</h5>
        <p class="text-xs text-gray-200 mb-2">
          Misteriosos e ricos em minerais, os pântanos são fontes abundantes de água e pedra. 
          Controlá-los garante acesso aos recursos essenciais para construções avançadas.
        </p>
        <div class="flex gap-2 flex-wrap text-xs">
          <span class="bg-blue-800/50 px-2 py-1 rounded">1 Madeira</span>
          <span class="bg-blue-800/50 px-2 py-1 rounded">3 Pedra</span>
          <span class="bg-blue-800/50 px-2 py-1 rounded">4 Água</span>
        </div>
        <p class="text-xs text-blue-300 mt-2">
          <strong>Produção:</strong> +1 Água, +0.5 Pedra por turno
        </p>
      </div>
    </div>

    <h4 class="text-base font-semibold text-green-300 mb-3">Os Quatro Recursos</h4>

    <div class="grid grid-cols-2 gap-3">
      <div class="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
        <h5 class="text-sm font-bold text-amber-300 mb-1">Madeira</h5>
        <p class="text-xs text-gray-300">Recurso mais abundante. Essencial para explorar e construir.</p>
      </div>

      <div class="bg-gray-700/20 border border-gray-500/30 rounded-lg p-3">
        <h5 class="text-sm font-bold text-gray-300 mb-1">Pedra</h5>
        <p class="text-xs text-gray-300">Material de construção. Crítica para estruturas duradouras.</p>
      </div>

      <div class="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
        <h5 class="text-sm font-bold text-yellow-300 mb-1">Ouro</h5>
        <p class="text-xs text-gray-300">Recurso diplomático. Usado para negociações e construções.</p>
      </div>

      <div class="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
        <h5 class="text-sm font-bold text-blue-300 mb-1">Água</h5>
        <p class="text-xs text-gray-300">Fonte de vida. Necessária para exploração e sustentabilidade.</p>
      </div>
    </div>

    <div class="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-3 mt-4">
      <p class="text-xs text-cyan-300">
        <strong>Dica estratégica:</strong> Controlar regiões de biomas variados garante acesso balanceado a todos os recursos. 
        Florestas para madeira, Savanas para ouro, Pântanos para pedra e água.
      </p>
    </div>
  `;

    // ==================== ABA 3: REGRAS DO JOGO ====================
  tabRegras.innerHTML = `
    <h3 class="text-xl font-bold text-yellow-300 mb-3"⚖️ Regras do Jogo</h3>

    <h4 class="text-base font-semibold text-green-300 mb-2">🎬 Preparação</h4>
    <ol class="list-decimal ml-5 text-sm text-gray-200 space-y-1 mb-4">
      <li>Cada jogador escolhe uma facção (ícone e nome)</li>
      <li>Todos começam com <strong>10🪵, 5🪨, 3💰, 5💧</strong> e <strong>0 PV</strong></li>
      <li>25 regiões são distribuídas aleatoriamente entre os jogadores</li>
      <li>O primeiro jogador é determinado aleatoriamente</li>
    </ol>

    <h4 class="text-base font-semibold text-green-300 mb-2">🔄 Estrutura do Turno</h4>
    <div class="bg-gray-800/40 border border-gray-600/30 rounded-lg p-3 mb-4">
      <table class="w-full text-sm text-gray-200">
        <thead>
          <tr class="text-left border-b border-gray-600">
            <th class="pb-2 pr-3">Fase</th>
            <th class="pb-2">O que acontece</th>
          </tr>
        </thead>
        <tbody class="text-xs">
          <tr class="border-b border-gray-700">
            <td class="py-2 pr-3 font-semibold text-teal-300">1. Renda Automática</td>
            <td class="py-2">Recursos são adicionados automaticamente baseados em regiões, estruturas e níveis de exploração</td>
          </tr>
          <tr class="border-b border-gray-700">
            <td class="py-2 pr-3 font-semibold text-cyan-300">2. Ações (até 2)</td>
            <td class="py-2">Execute até <strong>2 ações únicas</strong> (não repetíveis no mesmo turno)</td>
          </tr>
          <tr class="border-b border-gray-700">
            <td class="py-2 pr-3 font-semibold text-purple-300">3. Negociação (opcional)</td>
            <td class="py-2">Após ações, você pode propor uma negociação com outro jogador</td>
          </tr>
          <tr>
            <td class="py-2 pr-3 font-semibold text-orange-300">4. Passar Turno</td>
            <td class="py-2">Finaliza seu turno e passa para o próximo jogador</td>
          </tr>
        </tbody>
      </table>
    </div>

<h4 class="text-base font-semibold text-green-300 mb-2">🏆 Conquistas</h4>
<p class="text-sm text-gray-200 mb-3">
  Ao longo do jogo, você pode desbloquear conquistas que recompensam suas ações estratégicas. 
  Cada conquista traz um título que aparece apenas quando você a obtém.
</p>

<div class="grid grid-cols-2 gap-3 mb-4">
  <div class="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-500/40 rounded-lg p-3">
    <h5 class="text-sm font-bold text-green-300 mb-2">🗺️ Explorador</h5>
    <p class="text-xs text-gray-200 mb-2">
      Explore 10 regiões para desbloquear este título.
    </p>
    <p class="text-xs text-green-300 mt-2"><strong>Benefício:</strong> +1 PV por turno</p>
  </div>

  <div class="bg-gradient-to-r from-teal-900/40 to-cyan-900/40 border border-teal-500/40 rounded-lg p-3">
    <h5 class="text-sm font-bold text-teal-300 mb-2">🏗️ Construtor</h5>
    <p class="text-xs text-gray-200 mb-2">
      Construa 5 estruturas para desbloquear este título.
    </p>
    <p class="text-xs text-teal-300 mt-2"><strong>Benefício:</strong> -1 recurso ao construir</p>
  </div>

  <div class="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-500/40 rounded-lg p-3">
    <h5 class="text-sm font-bold text-yellow-300 mb-2">🤝 Diplomata</h5>
    <p class="text-xs text-gray-200 mb-2">
      Realize 10 negociações para desbloquear este título.
    </p>
    <p class="text-xs text-yellow-300 mt-2"><strong>Benefício:</strong> -1 Ouro ao negociar</p>
  </div>

  <div class="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/40 rounded-lg p-3">
    <h5 class="text-sm font-bold text-blue-300 mb-2">🏆 Guardião de Gaia</h5>
    <p class="text-xs text-gray-200 mb-2">
      Vencer uma partida para desbloquear este título.
    </p>
    <p class="text-xs text-blue-300 mt-2"><strong>Benefício:</strong> +2 PV por turno</p>
  </div>
</div>

    <h4 class="text-base font-semibold text-green-300 mb-2">⭐ Níveis de Exploração</h4>
    <p class="text-sm text-gray-200 mb-3">
      Cada região possui um nível de exploração de <strong>0 a 3 estrelas</strong>. 
      O nível aumenta ao usar a ação <strong>Explorar</strong> em regiões que você controla.
    </p>

    <div class="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg p-3 mb-4">
      <h5 class="text-sm font-bold text-purple-300 mb-2">Benefícios por Nível</h5>
      <div class="space-y-2 text-xs text-gray-200">
        <div class="flex items-start gap-2">
          <span class="font-bold text-gray-400 min-w-[60px]">Nível 0:</span>
          <span>Produção base do bioma</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="font-bold text-yellow-300 min-w-[60px]">Nível 1 ⭐:</span>
          <span><strong>+25% produção</strong> | Recolher ganha +1 recurso aleatório</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="font-bold text-yellow-300 min-w-[60px]">Nível 2 ⭐⭐:</span>
          <span><strong>+50% produção</strong> | Construir custa -1 Pedra | 20% chance de +1 Ouro na renda</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="font-bold text-yellow-300 min-w-[60px]">Nível 3 ⭐⭐⭐:</span>
          <span><strong>+100% produção</strong> | Recolher ganha +50% recursos | +1 PV bônus a cada 3 turnos</span>
        </div>
      </div>
    </div>

    <h4 class="text-base font-semibold text-green-300 mb-2">🎴 Eventos Globais</h4>
    <p class="text-sm text-gray-200 mb-3">
      A cada <strong>4 turnos completos</strong>, um evento global aleatório é disparado, afetando todos os jogadores por <strong>1 a 2 turnos</strong>.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
      <div class="bg-green-900/20 border border-green-500/30 rounded p-2">
        <p class="text-xs font-bold text-green-300">✅ Positivos</p>
        <p class="text-xs text-gray-300">Primavera, Mercado Aquecido, Festival, Era da Exploração</p>
      </div>
      <div class="bg-red-900/20 border border-red-500/30 rounded p-2">
        <p class="text-xs font-bold text-red-300">❌ Negativos</p>
        <p class="text-xs text-gray-300">Seca, Tempestade, Inflação, Escassez, Tempestade de Areia, Depressão</p>
      </div>
      <div class="bg-purple-900/20 border border-purple-500/30 rounded p-2">
        <p class="text-xs font-bold text-purple-300">⚡ Mistos</p>
        <p class="text-xs text-gray-300">Descoberta de Jazida, Inverno Rigoroso, Boom Tecnológico, Enchente</p>
      </div>
    </div>

    <h4 class="text-base font-semibold text-green-300 mb-2">🏆 Condições de Vitória</h4>
    <div class="bg-green-900/20 border border-green-500/40 rounded-lg p-3 mb-3">
      <p class="text-sm text-gray-200">
        <strong>Primeira facção a atingir ${GAME_CONFIG.VICTORY_POINTS} PV vence imediatamente!</strong>
      </p>
    </div>

    <h4 class="text-base font-semibold text-orange-300 mb-2">⚠️ Penalidades</h4>
    <div class="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
      <p class="text-xs text-gray-200">
        Se um jogador passar <strong>3 turnos consecutivos sem realizar ações</strong>, 
        sua <strong>renda base por biomas é suspensa</strong> no próximo turno (estruturas continuam produzindo).
      </p>
    </div>
  `;

  // ==================== ABA 4: AÇÕES ====================
  tabAcoes.innerHTML = `
    <h3 class="text-xl font-bold text-yellow-300 mb-3">⚡ Ações Disponíveis</h3>
    
    <p class="text-sm text-gray-200 mb-4">
      Cada jogador pode executar até <strong>2 ações únicas por turno</strong>. 
      Escolha estrategicamente baseado no tipo de região (própria, neutra ou inimiga).
    </p>

    <div class="space-y-4">
      <!-- AÇÃO 1: ASSUMIR DOMÍNIO -->
      <div class="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/40 rounded-lg p-4">
        <h4 class="text-base font-bold text-purple-300 mb-2">1️⃣ Assumir Domínio 🗺️</h4>
        
        <div class="grid grid-cols-3 gap-2 mb-3 text-xs">
          <div class="bg-purple-800/30 rounded p-2 text-center">
            <p class="font-bold text-purple-300">✅ Neutra</p>
            <p class="text-gray-300">Disponível</p>
          </div>
          <div class="bg-gray-800/30 rounded p-2 text-center">
            <p class="font-bold text-gray-400">❌ Própria</p>
            <p class="text-gray-400">Não permitido</p>
          </div>
          <div class="bg-gray-800/30 rounded p-2 text-center">
            <p class="font-bold text-gray-400">❌ Inimiga</p>
            <p class="text-gray-400">Não permitido</p>
          </div>
        </div>

        <p class="text-sm text-gray-200 mb-2"><strong>Custo:</strong> 2 PV + Recursos do bioma</p>
        <div class="text-xs text-gray-300 mb-2">
          <p>• Floresta Tropical: 6🪵 + 1🪨 + 3💧</p>
          <p>• Floresta Temperada: 5🪵 + 2🪨 + 2💧</p>
          <p>• Savana: 2🪵 + 1🪨 + 3💰 + 1💧</p>
          <p>• Pântano: 1🪵 + 3🪨 + 4💧</p>
        </div>
        <p class="text-sm text-green-300"><strong>Efeito:</strong> Assume controle total da região neutra</p>
        <p class="text-xs text-cyan-300 mt-2"><strong>💡 Dica:</strong> Priorize biomas que complementam sua estratégia</p>
      </div>

      <!-- AÇÃO 2: EXPLORAR -->
      <div class="bg-gradient-to-r from-teal-900/30 to-cyan-900/30 border border-teal-500/40 rounded-lg p-4">
        <h4 class="text-base font-bold text-teal-300 mb-2">2️⃣ Explorar ⛏️</h4>
        
        <div class="grid grid-cols-3 gap-2 mb-3 text-xs">
          <div class="bg-teal-800/30 rounded p-2 text-center">
            <p class="font-bold text-teal-300">✅ Própria</p>
            <p class="text-gray-300">Disponível</p>
          </div>
          <div class="bg-gray-800/30 rounded p-2 text-center">
            <p class="font-bold text-gray-400">❌ Neutra</p>
            <p class="text-gray-400">Use Assumir Domínio</p>
          </div>
          <div class="bg-gray-800/30 rounded p-2 text-center">
            <p class="font-bold text-gray-400">❌ Inimiga</p>
            <p class="text-gray-400">Não permitido</p>
          </div>
        </div>

        <p class="text-sm text-gray-200 mb-1"><strong>Custo:</strong> 2🪵 + 1💧</p>
        <p class="text-sm text-green-300 mb-1"><strong>Efeito:</strong> +1 PV | Aumenta nível de exploração (máx 3)</p>
        <p class="text-xs text-yellow-300 mb-2"><strong>Bônus:</strong> 10% chance de Descoberta Rara (+1💰)</p>
        <p class="text-xs text-cyan-300"><strong>💡 Dica:</strong> Foque em regiões estratégicas. Nível 3 dá +100% produção!</p>
      </div>

      <!-- AÇÃO 3: CONSTRUIR -->
      <div class="bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-500/40 rounded-lg p-4">
        <h4 class="text-base font-bold text-orange-300 mb-2">3️⃣ Construir 🏗️</h4>
        
        <div class="grid grid-cols-3 gap-2 mb-3 text-xs">
          <div class="bg-orange-800/30 rounded p-2 text-center">
            <p class="font-bold text-orange-300">✅ Própria</p>
            <p class="text-gray-300">Disponível</p>
          </div>
          <div class="bg-orange-800/30 rounded p-2 text-center">
            <p class="font-bold text-orange-300">✅ Neutra</p>
            <p class="text-gray-300">Assume controle</p>
          </div>
          <div class="bg-gray-800/30 rounded p-2 text-center">
            <p class="font-bold text-gray-400">❌ Inimiga</p>
            <p class="text-gray-400">Não permitido</p>
          </div>
        </div>

        <p class="text-sm text-gray-200 mb-1"><strong>Custo:</strong> 3🪵 + 2🪨 + 1💰 (Desconto: -1🪨 em regiões nível 2+)</p>
        <p class="text-sm text-green-300 mb-1"><strong>Efeito:</strong> +2 PV | Estrutura "Abrigo" construída</p>
        <p class="text-xs text-yellow-300 mb-2"><strong>Produção:</strong> +0.5🪵 e +0.5💧 por turno</p>
        <p class="text-xs text-cyan-300"><strong>💡 Dica:</strong> Construa em regiões de alto nível para maximizar retorno</p>
      </div>

      <!-- AÇÃO 4: RECOLHER -->
      <div class="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/40 rounded-lg p-4">
        <h4 class="text-base font-bold text-green-300 mb-2">4️⃣ Recolher 🌾</h4>
        
        <div class="grid grid-cols-3 gap-2 mb-3 text-xs">
          <div class="bg-green-800/30 rounded p-2 text-center">
            <p class="font-bold text-green-300">✅ Própria</p>
            <p class="text-gray-300">Disponível</p>
          </div>
          <div class="bg-green-800/30 rounded p-2 text-center">
            <p class="font-bold text-green-300">✅ Neutra</p>
            <p class="text-gray-300">Se exploração > 0</p>
          </div>
          <div class="bg-gray-800/30 rounded p-2 text-center">
            <p class="font-bold text-gray-400">❌ Inimiga</p>
            <p class="text-gray-400">Não permitido</p>
          </div>
        </div>

        <p class="text-sm text-gray-200 mb-1"><strong>Custo:</strong> 1🪵</p>
        <p class="text-sm text-green-300 mb-1"><strong>Efeito:</strong> +1 PV | Retira 50% dos recursos da região</p>
        <p class="text-xs text-yellow-300 mb-2"><strong>Bônus Nível 1:</strong> +1 recurso aleatório | <strong>Nível 3:</strong> +50% coleta (75% total)</p>
        <p class="text-xs text-cyan-300"><strong>💡 Dica:</strong> Recolha após eventos que aumentam recursos disponíveis</p>
      </div>

      <!-- AÇÃO 5: NEGOCIAR -->
      <div class="bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-500/40 rounded-lg p-4">
        <h4 class="text-base font-bold text-yellow-300 mb-2">5️⃣ Negociar 🤝</h4>
        
        <div class="grid grid-cols-3 gap-2 mb-3 text-xs">
          <div class="bg-gray-800/30 rounded p-2 text-center">
            <p class="font-bold text-gray-400">❌ Própria</p>
            <p class="text-gray-400">Use outras ações</p>
          </div>
          <div class="bg-gray-800/30 rounded p-2 text-center">
            <p class="font-bold text-gray-400">❌ Neutra</p>
            <p class="text-gray-400">Não negociável</p>
          </div>
          <div class="bg-yellow-800/30 rounded p-2 text-center">
            <p class="font-bold text-yellow-300">✅ Inimiga</p>
            <p class="text-gray-300">Disponível</p>
          </div>
        </div>

        <p class="text-sm text-gray-200 mb-1"><strong>Custo:</strong> 1💰 (pago ao iniciar negociação)</p>
        <p class="text-sm text-green-300 mb-2"><strong>Efeito:</strong> Ambos ganham +1 PV se aceitar | Troca recursos e/ou regiões</p>
        
        <div class="bg-yellow-900/20 rounded p-2 mb-2">
          <p class="text-xs font-bold text-yellow-300 mb-1">📋 Passo a Passo:</p>
          <ol class="text-xs text-gray-300 space-y-1 ml-3">
            <li>1. Selecione região inimiga e clique "Negociar"</li>
            <li>2. Escolha jogador alvo</li>
            <li>3. Defina recursos/regiões a oferecer e solicitar</li>
            <li>4. Envie proposta (1💰 é pago)</li>
            <li>5. Aguarde resposta do outro jogador</li>
          </ol>
        </div>
        
        <p class="text-xs text-cyan-300"><strong>💡 Dica:</strong> Negocie quando precisar de recursos específicos ou para bloquear oponentes</p>
      </div>
    </div>
  `;

  // ==================== ABA 5: ESTRUTURAS ====================
  tabEstrutura.innerHTML = `
    <h3 class="text-xl font-bold text-yellow-300 mb-3">🏗️ Estruturas e Estratégias</h3>

    <h4 class="text-base font-semibold text-green-300 mb-2">🏠 Estrutura: Abrigo</h4>
    <div class="bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-500/40 rounded-lg p-4 mb-4">
      <p class="text-sm text-gray-200 mb-2">
        Atualmente, <strong>Abrigo</strong> é a única estrutura disponível no jogo. 
        Ela representa a base da civilização em cada região.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div>
          <p class="font-bold text-orange-300 mb-1">Custo de Construção:</p>
          <p class="text-gray-300">3🪵 + 2🪨 + 1💰</p>
          <p class="text-yellow-300 text-xs mt-1">(Desconto: -1🪨 em regiões nível 2+)</p>
        </div>
        <div>
          <p class="font-bold text-green-300 mb-1">Benefícios:</p>
          <p class="text-gray-300">+2 PV imediato</p>
          <p class="text-gray-300">+0.5🪵 por turno</p>
          <p class="text-gray-300">+0.5💧 por turno</p>
        </div>
      </div>
    </div>

    <h4 class="text-base font-semibold text-green-300 mb-2">📊 Produção de Recursos</h4>
    <div class="bg-gray-800/40 border border-gray-600/30 rounded-lg p-3 mb-4">
      <p class="text-sm text-gray-200 mb-3">
        A produção total de cada região depende de <strong>3 fatores</strong>:
      </p>
      <ol class="text-sm text-gray-200 space-y-2 ml-4">
        <li><strong>1. Bioma base:</strong> Cada bioma tem produção natural de recursos</li>
        <li><strong>2. Nível de exploração:</strong> Multiplicador de 1.0x (nível 0) até 2.0x (nível 3)</li>
        <li><strong>3. Estruturas:</strong> Abrigos adicionam +0.5🪵 e +0.5💧 por turno</li>
      </ol>
    </div>

    <div class="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-3 mb-4">
      <h5 class="text-sm font-bold text-cyan-300 mb-2">📈 Exemplo de Crescimento</h5>
      <div class="text-xs text-gray-200 space-y-1">
        <p><strong>Floresta Tropical sem exploração:</strong> 1🪵 + 0.5💰 por turno</p>
        <p><strong>Floresta Tropical nível 2 + Abrigo:</strong></p>
        <p class="ml-3">• (1🪵 + 0.5💰) × 1.5 + 0.5🪵 + 0.5💧 = <strong>2🪵 + 0.75💰 + 0.5💧</strong></p>
        <p><strong>Floresta Tropical nível 3 + Abrigo:</strong></p>
        <p class="ml-3">• (1🪵 + 0.5💰) × 2.0 + 0.5🪵 + 0.5💧 = <strong>2.5🪵 + 1💰 + 0.5💧</strong></p>
      </div>
    </div>

    <h4 class="text-base font-semibold text-green-300 mb-3">🎯 Estratégias Avançadas</h4>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
      <!-- Estratégia 1 -->
      <div class="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
        <h5 class="text-sm font-bold text-purple-300 mb-2">⚡ Rush de Exploração</h5>
        <p class="text-xs text-gray-300 mb-2">
          Foque em <strong>explorar rapidamente</strong> suas regiões até nível 3 antes de construir.
        </p>
        <p class="text-xs text-purple-200"><strong>Vantagem:</strong> Dobra produção passiva cedo</p>
        <p class="text-xs text-gray-400"><strong>Risco:</strong> Menos PV imediato de construções</p>
      </div>

      <!-- Estratégia 2 -->
      <div class="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
        <h5 class="text-sm font-bold text-orange-300 mb-2">🏗️ Renda Passiva</h5>
        <p class="text-xs text-gray-300 mb-2">
          Construa <strong>Abrigos em todas as regiões</strong> para gerar fluxo constante de recursos.
        </p>
        <p class="text-xs text-orange-200"><strong>Vantagem:</strong> Sustentabilidade longa</p>
        <p class="text-xs text-gray-400"><strong>Risco:</strong> Alto custo inicial (6🪵 + 4🪨 + 2💰 para 2 abrigos)</p>
      </div>

      <!-- Estratégia 3 -->
      <div class="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
        <h5 class="text-sm font-bold text-green-300 mb-2">🌍 Diversificação</h5>
        <p class="text-xs text-gray-300 mb-2">
          Controle <strong>pelo menos 1 região de cada bioma</strong> para garantir acesso a todos os recursos.
        </p>
        <p class="text-xs text-green-200"><strong>Vantagem:</strong> Flexibilidade máxima</p>
        <p class="text-xs text-gray-400"><strong>Risco:</strong> Dificulta especialização</p>
      </div>

      <!-- Estratégia 4 -->
      <div class="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
        <h5 class="text-sm font-bold text-yellow-300 mb-2">🚀 Rush de PV</h5>
        <p class="text-xs text-gray-300 mb-2">
          Maximize ações que dão <strong>PV imediato</strong> (Construir +2, Explorar +1, Negociar +1).
        </p>
        <p class="text-xs text-yellow-200"><strong>Vantagem:</strong> Vitória rápida se bem executado</p>
        <p class="text-xs text-gray-400"><strong>Risco:</strong> Economia frágil</p>
      </div>
    </div>

    <div class="bg-gradient-to-r from-teal-900/30 to-cyan-900/30 border border-teal-500/40 rounded-lg p-4">
      <h5 class="text-sm font-bold text-teal-300 mb-2">💡 Dicas Avançadas</h5>
      <ul class="text-xs text-gray-200 space-y-2">
        <li><strong>• Sincronia:</strong> Construa estruturas APÓS explorar a região até nível 2 para aproveitar desconto de -1🪨</li>
        <li><strong>• Timing:</strong> Observe eventos globais. Primavera Abundante (+100% madeira) é ideal para recolher</li>
        <li><strong>• Controle:</strong> Regiões nível 3 dão +1 PV a cada 3 turnos automaticamente. Invista cedo!</li>
        <li><strong>• Negociação:</strong> Use negociações para obter recursos críticos e bloquear oponentes de biomas estratégicos</li>
      </ul>
    </div>
  `;
}

function openManual(){ manualModal.classList.remove('hidden'); }
function closeManual(){ manualModal.classList.add('hidden'); }
function handleManualTabClick(e){ manualTabs.forEach(t=>t.classList.remove('active')); e.currentTarget.classList.add('active'); showManualTab(e.currentTarget.dataset.tab); }
function showManualTab(tabId){ manualContents.forEach(c=> c.classList.add('hidden')); const el = document.getElementById(tabId); if (el) el.classList.remove('hidden'); }

/* ---------------- End turn & footer update ---------------- */
endTurnBtn.addEventListener('click', ()=> {
  // Avança jogador / turno
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;

  // APLICAR RENDA AUTOMÁTICA PARA O PRÓXIMO JOGADOR
  const nextPlayer = gameState.players[gameState.currentPlayerIndex];
  applyIncomeForPlayer(nextPlayer);

  const cycled = (gameState.currentPlayerIndex === 0);
  if (cycled) {
    gameState.turn += 1;

    // Atualizar contador de eventos apenas quando fecha uma rodada completa
    handleTurnAdvanceForEvents();
  }

  gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
  gameState.selectedRegionId = null;

  // Remover a seleção visual de TODAS as células ao passar o turno
  document.querySelectorAll('.board-cell').forEach(c=>c.classList.remove('region-selected'));

  // Atualizar painel lateral para mostrar o jogador atual
  gameState.selectedPlayerForSidebar = gameState.currentPlayerIndex;

  updateTurnInfo(); 
  refreshUIAfterStateChange();
  checkVictory();

  showFeedback(`Agora é o turno de ${gameState.players[gameState.currentPlayerIndex].name}`, 'info');
});

function handleTurnAdvanceForEvents() {
  // 1. Atualizar duração do evento atual
  if (gameState.currentEvent && gameState.eventTurnsLeft > 0) {
    gameState.eventTurnsLeft -= 1;
    if (gameState.eventTurnsLeft <= 0) {
      // Remover efeitos
      if (typeof gameState.currentEvent.remove === 'function') {
        gameState.currentEvent.remove(gameState);
      }
      gameState.currentEvent = null;
      gameState.eventModifiers = {};
      showFeedback('O evento global terminou.', 'info');
      updateEventBanner(); // ← ADICIONAR ESTA LINHA
    } else {
      updateEventBanner(); // ← ADICIONAR ESTA LINHA
    }
  }


  // 2. Contar até o próximo evento
  if (!gameState.currentEvent) {
    gameState.turnsUntilNextEvent -= 1;
    if (gameState.turnsUntilNextEvent <= 0) {
      triggerRandomEvent();
      // Resetar contador (ex: próximo evento em 4 rodadas completas)
      gameState.turnsUntilNextEvent = 4;
    }
  }
}

// Sistema de renda automática com bônus de exploração
function applyIncomeForPlayer(player) {
  const bonuses = { madeira: 0, pedra: 0, ouro: 0, agua: 0 };
  
  player.regions.forEach(regionId => {
    const region = gameState.regions[regionId];
    if (!region) return;
    
    // Produção base por bioma
    let biomeProd = { madeira: 0, pedra: 0, ouro: 0, agua: 0 };
    
    switch(region.biome) {
      case 'Floresta Tropical':
        biomeProd.madeira = 1;
        biomeProd.ouro = 0.5;
        break;
      case 'Floresta Temperada':
        biomeProd.madeira = 1.5;
        break;
      case 'Savana':
        biomeProd.madeira = 1.5;
        biomeProd.agua = 1;
        break;
      case 'Pântano':
        biomeProd.agua = 1;
        biomeProd.pedra = 0.5;
        break;
    }
    
    // Aplicar multiplicadores de eventos globais
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
      biomeProd.madeira = 0;
      biomeProd.agua = 0;
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
    
    // ⭐ BÔNUS DE EXPLORAÇÃO ⭐
    const explLevel = region.explorationLevel || 0;
    let explMultiplier = 1.0;
    
    switch(explLevel) {
      case 1:
        explMultiplier = 1.25; // +25%
        break;
      case 2:
        explMultiplier = 1.50; // +50%
        // 20% chance de +1 Ouro
        if (Math.random() < 0.20) {
          bonuses.ouro += 1;
        }
        break;
      case 3:
        explMultiplier = 2.00; // +100%
        break;
    }
    
    // Aplicar multiplicador de exploração
    Object.keys(biomeProd).forEach(k => {
      biomeProd[k] *= explMultiplier;
    });
    
    // Acumular bônus
    Object.keys(biomeProd).forEach(k => {
      bonuses[k] += biomeProd[k];
    });
    
    // Produção de estruturas (se não bloqueadas por tempestade)
    if (!gameState.eventModifiers.structuresDisabled && region.structures && region.structures.length > 0) {
      region.structures.forEach(struct => {
        if (struct === 'Abrigo') {
          bonuses.madeira += 0.5;
          bonuses.agua += 0.5;
        }
      });
    }
  });
  
  // Aplicar bônus ao jogador
  Object.keys(bonuses).forEach(k => {
    player.resources[k] = Math.floor(player.resources[k] + bonuses[k]);
  });
  
  // Bônus de PV para regiões nível 3 (a cada 3 turnos)
  if (gameState.turn % 3 === 0) {
    const level3Regions = player.regions.filter(rid => {
      const r = gameState.regions[rid];
      return r && r.explorationLevel === 3;
    });
    
    if (level3Regions.length > 0) {
      player.victoryPoints += level3Regions.length;
      showFeedback(`${player.name} ganhou +${level3Regions.length} PV de regiões nível 3!`, 'success');
    }
  }
}

function triggerRandomEvent() {
  if (!GAME_EVENTS || GAME_EVENTS.length === 0) return;
  // Escolher evento aleatório
  const ev = GAME_EVENTS[Math.floor(Math.random() * GAME_EVENTS.length)];
  
  // Se o evento tiver efeito instantâneo (duration 1 e só apply), aplica e não mantém ativo
  if (ev.duration === 1 && (!ev.effect || ev.id === 'arqueologia' || ev.id === 'depressao')) {
    ev.apply(gameState);
    gameState.currentEvent = null;
    gameState.eventTurnsLeft = 0;
    openEventModal(ev);
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

  // Registrar evento no log
  addActivityLog('event', 'GAIA', `disparou evento: ${ev.name}`, ev.description, gameState.turn);

  openEventModal(ev);
  
  // Atualizar banner após fechar modal
  setTimeout(() => {
    updateEventBanner();
  }, 100);
}


function canPlayerAfford(cost){
  const p = gameState.players[gameState.currentPlayerIndex];
  
  return Object.entries(cost).every(([resource, amount]) => {
    const has = p.resources[resource] || 0;
    const needed = amount;
    return has >= needed;
  });
}

function updateFooter(){

  const player = gameState.players[gameState.currentPlayerIndex];
  const regionId = gameState.selectedRegionId;
  
  // Validação robusta
  if (!player) {
    [actionExploreBtn, actionCollectBtn, actionBuildBtn, actionNegotiateBtn].forEach(b => b.disabled = true);
    actionsLeftEl.textContent = `Ações restantes: ${gameState.actionsLeft}`;
    return;
  }
  
  if (!gameState.gameStarted) {
    [actionExploreBtn, actionCollectBtn, actionBuildBtn, actionNegotiateBtn].forEach(b => b.disabled = true);
    actionsLeftEl.textContent = `Ações restantes: ${gameState.actionsLeft}`;
    return;
  }
  
  if (regionId === null || regionId === undefined) {
    [actionExploreBtn, actionCollectBtn, actionBuildBtn, actionNegotiateBtn].forEach(b => b.disabled = true);
    actionsLeftEl.textContent = `Ações restantes: ${gameState.actionsLeft}`;
    return;
  }
  
  const region = gameState.regions[regionId];
  
  if (!region) {
    [actionExploreBtn, actionCollectBtn, actionBuildBtn, actionNegotiateBtn].forEach(b => b.disabled = true);
    actionsLeftEl.textContent = `Ações restantes: ${gameState.actionsLeft}`;
    return;
  }
  
  // Condição base
  const baseEnabled = gameState.actionsLeft > 0;
  
  // Classificação da região
  const isOwnRegion   = region.controller === player.id;
  const isNeutral     = region.controller === null;
  const isEnemyRegion = region.controller !== null && region.controller !== player.id;


  // --- LÓGICA DE HABILITAÇÃO DOS BOTÕES ---

  // 1. EXPLORAR / ASSUMIR DOMÍNIO
  if (isNeutral) {
    // Assumir Domínio: 2 PV + recursos do bioma
    const hasEnoughPV = player.victoryPoints >= 2;
    const canPayBiome = Object.entries(region.resources).every(([k,v]) => player.resources[k] >= v);
    actionExploreBtn.disabled = !baseEnabled || !hasEnoughPV || !canPayBiome;
    actionExploreBtn.textContent = 'Assumir Domínio';
  } else if (isOwnRegion) {
    // Explorar região própria
    const canAfford = canPlayerAfford(GAME_CONFIG.ACTION_DETAILS.explorar.cost);
    actionExploreBtn.disabled = !baseEnabled || !canAfford;
    actionExploreBtn.textContent = 'Explorar';
  } else {
    // Regiões inimigas não podem ser exploradas
    actionExploreBtn.disabled = true;
    actionExploreBtn.textContent = 'Explorar';
  }

  // 2. CONSTRUIR: apenas em próprias (neutras precisam assumir domínio primeiro)
  try {
    const canAffordBuild = canPlayerAfford(GAME_CONFIG.ACTION_DETAILS.construir.cost);
    actionBuildBtn.disabled = !baseEnabled || isNeutral || isEnemyRegion || !canAffordBuild;
  } catch (e) {
    actionBuildBtn.disabled = true;
  }

  // 3. RECOLHER: apenas em próprias (neutras precisam assumir domínio primeiro)
  try {
    const canAffordCollect = canPlayerAfford(GAME_CONFIG.ACTION_DETAILS.recolher.cost);
    actionCollectBtn.disabled = !baseEnabled || isNeutral || isEnemyRegion || !canAffordCollect;
  } catch (e) {
    actionCollectBtn.disabled = true;
  }

  // 4. NEGOCIAR: apenas com regiões de outro jogador (inimiga)
  try {
    const canAffordNeg = canPlayerAfford(GAME_CONFIG.ACTION_DETAILS.negociar.cost);
    actionNegotiateBtn.disabled = !baseEnabled || !isEnemyRegion || !canAffordNeg;
  } catch (e) {
    actionNegotiateBtn.disabled = true;
  }

  // Atualizar contador de ações
  actionsLeftEl.textContent = `Ações restantes: ${gameState.actionsLeft}`;
  
}

function checkVictory() {
  const winner = gameState.players.find(p => p.victoryPoints >= GAME_CONFIG.VICTORY_POINTS);
  if (winner) {
    showFeedback(`${winner.name} venceu o jogo!`, 'success');
    // Aqui você pode adicionar lógica para encerrar o jogo
    // Desabilita ações
    actionExploreBtn.disabled = true;
    actionCollectBtn.disabled = true;
    actionBuildBtn.disabled = true;
    actionNegotiateBtn.disabled = true;
    endTurnBtn.disabled = true;
    // Mostra modal de vitória
    openVictoryModal(winner);
  }
}

function openVictoryModal(winner) {
  victoryModalTitle.textContent = 'Vitória!';
  victoryModalMessage.textContent = `Parabéns, ${winner.name}! Você venceu Gaia!`;
  victoryModal.classList.remove('hidden');
}

/* ---------------- Utilities / expose ---------------- */
window.gameState = gameState;
window.renderAll = renderAll;
