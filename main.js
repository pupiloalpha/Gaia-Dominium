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
  PLAYER_COLORS: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'],
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

let gameState = {
  players: [],
  regions: [],
  currentPlayerIndex: 0,
  selectedPlayerForSidebar: 0,
  turn: 0,
  actionsLeft: GAME_CONFIG.ACTIONS_PER_TURN,
  gameStarted: false,
  selectedRegionId: null,
  pendingNegotiation: null // holds negotiation object while awaiting response
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
function renderAll(){ renderHeaderPlayers(); renderBoard(); renderSidebar(gameState.selectedPlayerForSidebar); }
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

    // Adicionar cor sutil do jogador nas regiões controladas
    if (region.controller !== null) {
      const player = gameState.players[region.controller];
      cell.style.borderLeft = `4px solid ${player.color}`;
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


// Função auxiliar para converter hex para RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 255, 255';
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
    
    if (Math.random() < 0.1) {
      player.resources.ouro += 1;
      showFeedback('Descoberta rara! +1 Ouro', 'success');
    } else {
      showFeedback(`${region.name} explorada. Nível: ${region.explorationLevel}⭐`, 'success');
    }
  } else {
    showFeedback('Você não pode explorar regiões de outros jogadores.', 'error');
    return;
  }
  
  renderAll();
  updateFooter();
});


/* Collect */
actionCollectBtn.addEventListener('click', ()=>{
  if (gameState.selectedRegionId === null){ showFeedback('Selecione uma região para coletar.', 'error'); return; }
  if (!consumeAction()) return;
  const region = gameState.regions[gameState.selectedRegionId];
  const player = gameState.players[gameState.currentPlayerIndex];
  if (region.controller === gameState.currentPlayerIndex || region.explorationLevel > 0){
    Object.keys(region.resources).forEach(k=>{
      const amount = Math.max(0, Math.floor(region.resources[k] * 0.5));
      player.resources[k] += amount;
      region.resources[k] = Math.max(0, region.resources[k] - amount);
    });
    player.victoryPoints += 1;
    showFeedback(`Coleta realizada de ${region.name}.`, 'success');
    renderBoard(); renderSidebar(gameState.selectedPlayerForSidebar);
  } else showFeedback('Região não explorada nem controlada — explore antes de coletar.', 'warning');
  updateFooter(); // Adicionado updateFooter
});

/* Build */
actionBuildBtn.addEventListener('click', ()=>{
  if (gameState.selectedRegionId === null){ showFeedback('Selecione uma região para construir.', 'error'); return; }
  if (!consumeAction()) return;
  const region = gameState.regions[gameState.selectedRegionId];
  const player = gameState.players[gameState.currentPlayerIndex];
  const cost = { madeira:3, pedra:2, ouro:1 };
  const canPay = Object.entries(cost).every(([k,v])=>player.resources[k] >= v);
  if (!canPay){ showFeedback('Recursos insuficientes para construir.', 'error'); return; }
  Object.entries(cost).forEach(([k,v])=> player.resources[k]-=v );
  region.structures.push('Abrigo'); region.controller = gameState.currentPlayerIndex;
  if (!player.regions.includes(region.id)) player.regions.push(region.id);
  player.victoryPoints += 2;
  showFeedback(`Construído Abrigo em ${region.name}. +2 PV.`, 'success');
  renderBoard(); renderSidebar(gameState.selectedPlayerForSidebar); updateFooter(); // Adicionado updateFooter
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
  const tabRegras = document.getElementById('tab-regras');
  const tabAcoes = document.getElementById('tab-acoes');
  const tabEstrutura = document.getElementById('tab-estrutura');

  tabO.innerHTML = `
    <h3 class="text-lg font-semibold text-yellow-300 mb-2">Visão Geral</h3>
    <p class="text-gray-200 leading-relaxed">Gaia Dominium é um jogo digital estratégico que mistura engine-building, gerenciamento de recursos e diplomacia. Cada jogador representa uma facção que busca restaurar e dominar biomas, acumulando Pontos de Vitória (PV). A versão 2.0 integra negociação de áreas e um sistema de renda/produção robusto.</p>

    <h4 class="text-sm font-semibold text-green-300 mt-4">Componentes Principais</h4>
    <ul class="list-disc ml-6 text-gray-200">
      <li>Facções com cores e ícones</li>
      <li>Mapa 5×5 (25 regiões)</li>
      <li>Recursos: Madeira, Pedra, Ouro, Água</li>
      <li>Sistema de Ações modulares</li>
    </ul>

    <h4 class="text-sm font-semibold text-green-300 mt-4">Preparação</h4>
    <ol class="ml-6 text-gray-200 list-decimal">
      <li>Cada jogador escolhe facção e recebe 10 Madeira, 5 Pedra, 3 Ouro, 5 Água e 0 PV.</li>
      <li>Regiões são distribuídas (equilibrado ou aleatório).</li>
      <li>Turno inicial determinado aleatoriamente.</li>
    </ol>
  `;

  tabRegras.innerHTML = `
    <h3 class="text-lg font-semibold text-yellow-300 mb-2">Estrutura de Jogo & Fases</h3>
    <p class="text-gray-200">Cada turno possui fases fixas que garantem equilíbrio e previsibilidade estratégica.</p>
    <table class="w-full text-gray-200 mt-3">
      <thead><tr class="text-left"><th>Fase</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="pr-4 align-top font-semibold">Fase 1 — Renda Automática</td><td>Renda calculada com base em regiões controladas, níveis de exploração e estruturas. Recursos atualizados automaticamente.</td></tr>
        <tr><td class="pr-4 align-top font-semibold">Fase 2 — Ações</td><td>O jogador pode executar até <strong>2 ações únicas</strong> por turno (não repetíveis no mesmo turno).</td></tr>
        <tr><td class="pr-4 align-top font-semibold">Fase 3 — Negociação</td><td>Após ações, o jogador pode iniciar uma negociação com outro jogador (troca de recursos e/ou regiões).</td></tr>
        <tr><td class="pr-4 align-top font-semibold">Fase 4 — Passar Turno</td><td>Finaliza o turno e passa para o próximo jogador; renda do próximo é aplicada na Fase 1.</td></tr>
      </tbody>
    </table>

    <h4 class="text-sm font-semibold text-green-300 mt-3">Penalidade por Passividade</h4>
    <p class="text-gray-200">Se um jogador passar o turno sem realizar ações por 3 turnos consecutivos, sua renda base por biomas é suspensa no próximo turno (estruturas continuam produzindo).</p>
  `;

  tabAcoes.innerHTML = `
    <h3 class="text-lg font-semibold text-yellow-300 mb-2">Ações Modulares</h3>
    <p class="text-gray-200">Cada ação tem custo, efeito e momento ideal de uso.</p>

        <h4 class="text-sm font-semibold text-green-300 mt-3">1) Assumir Domínio (Regiões Neutras)</h4>
    <p class="text-gray-200"><strong>Custo:</strong> 2 PV + Recursos do bioma da região<br>
    <strong>Efeito:</strong> Assume o controle de uma região neutra (não dominada). Os recursos necessários variam por bioma:<br>
    • Floresta Tropical: 6 Madeira, 1 Pedra, 3 Água<br>
    • Floresta Temperada: 5 Madeira, 2 Pedra, 2 Água<br>
    • Savana: 2 Madeira, 1 Pedra, 3 Ouro, 1 Água<br>
    • Pântano: 1 Madeira, 3 Pedra, 4 Água<br>
    <strong>Disponível apenas para:</strong> Regiões neutras.</p>

    <h4 class="text-sm font-semibold text-green-300 mt-3">2) Explorar (Regiões Próprias)</h4>
    <p class="text-gray-200"><strong>Custo:</strong> 2 Madeira + 1 Água<br>
    <strong>Efeito:</strong> +1 PV; aumenta nível de exploração da região; próximas colheitas +50% recursos; 10% de chance de Descoberta Rara (+1 Ouro).<br>
    <strong>Disponível para:</strong> Regiões que você já controla.</p>

        <h4 class="text-sm font-semibold text-green-300 mt-3">3) Construir</h4>
    <p class="text-gray-200"><strong>Custo:</strong> 3 Madeira + 2 Pedra + 1 Ouro<br>
    <strong>Efeito:</strong> Constrói estrutura; +2 PV; região produz +1 recurso por turno; desbloqueia bônus especiais.</p>

    <h4 class="text-sm font-semibold text-green-300 mt-3">4) Recolher</h4>
    <p class="text-gray-200"><strong>Custo:</strong> 1 Madeira<br>
    <strong>Efeito:</strong> Retira recursos das regiões controladas; +1 PV; pode gerar Ouro se houver estrutura de mineração.</p>

    <h4 class="text-sm font-semibold text-green-300 mt-3">5) Negociar</h4>
    <p class="text-gray-200"><strong>Custo:</strong> 1 Ouro<br>
    <strong>Efeito:</strong> Inicia proposta para trocar recursos e/ou regiões; ambas as partes ganham +1 PV se aceitarem.</p>

    <h4 class="text-sm font-semibold text-green-300 mt-3">6) Finalizar Turno</h4>
    <p class="text-gray-200">Passa o turno e reseta condições para o próximo jogador.</p>
  `;

  tabEstrutura.innerHTML = `
    <h3 class="text-lg font-semibold text-yellow-300 mb-2">Biomas, Produção e PV</h3>
    <p class="text-gray-200">Biomas possuem perfis de produção distintos e dão bônus fixos por turno.</p>

    <ul class="list-disc ml-6 text-gray-200">
      <li><strong>Floresta Tropical:</strong> +1 Madeira/turno, +0.5 Ouro/turno</li>
      <li><strong>Floresta Temperada:</strong> +1.5 Madeira/turno</li>
      <li><strong>Savana:</strong> +1.5 Madeira/turno, +1 Água/turno</li>
      <li><strong>Pântano:</strong> +1 Água/turno, +0.5 Pedra/turno</li>
    </ul>

    <h4 class="text-sm font-semibold text-green-300 mt-3">Pontos de Vitória</h4>
    <p class="text-gray-200">PV são obtidos por ações como explorar (+1), construir (+2), recolher (+1), negociações bem-sucedidas (+1 ambos), entre outros bônus.</p>

    <h4 class="text-sm font-semibold text-green-300 mt-3">Objetivo</h4>
    <p class="text-gray-200">Primeira facção a atingir <strong>${GAME_CONFIG.VICTORY_POINTS} PV</strong> vence.</p>
  `;
}

function openManual(){ manualModal.classList.remove('hidden'); }
function closeManual(){ manualModal.classList.add('hidden'); }
function handleManualTabClick(e){ manualTabs.forEach(t=>t.classList.remove('active')); e.currentTarget.classList.add('active'); showManualTab(e.currentTarget.dataset.tab); }
function showManualTab(tabId){ manualContents.forEach(c=> c.classList.add('hidden')); const el = document.getElementById(tabId); if (el) el.classList.remove('hidden'); }

/* ---------------- End turn & footer update ---------------- */
endTurnBtn.addEventListener('click', ()=> {
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  gameState.turn += (gameState.currentPlayerIndex === 0) ? 1 : 0;
  gameState.actionsLeft = GAME_CONFIG.ACTIONS_PER_TURN;
  gameState.selectedRegionId = null;

  // Remover a seleção visual de TODAS as células ao passar o turno
  document.querySelectorAll('.board-cell').forEach(c=>c.classList.remove('region-selected'));

  // ✅ CORREÇÃO DO BUG: Atualizar painel lateral para mostrar o jogador atual
  gameState.selectedPlayerForSidebar = gameState.currentPlayerIndex;

  updateTurnInfo(); updateFooter(); renderAll();
  showFeedback(`Agora é o turno de ${gameState.players[gameState.currentPlayerIndex].name}`, 'info');
});


/**
 * Verifica se o jogador atual pode pagar o custo de uma ação
 * @param {object} cost - Objeto com os custos da ação
 * @returns {boolean} - true se puder pagar, false caso contrário
 */
function canPlayerAfford(cost) {
  const player = gameState.players[gameState.currentPlayerIndex];
  if (!player) return false;
  return Object.entries(cost).every(([k, v]) => player.resources[k] >= v);
}

function updateFooter(){
    const player = gameState.players[gameState.currentPlayerIndex];
    const regionId = gameState.selectedRegionId;
    const region = regionId !== null ? gameState.regions[regionId] : null;
    
    // Condição base: O jogo deve estar iniciado e o jogador deve ter ações restantes
    const baseEnabled = gameState.actionsLeft > 0 && gameState.gameStarted;
    
    // Desabilitar todos se o jogo não estiver iniciado, não houver jogador, ou se nenhuma região foi selecionada.
    if (!player || !gameState.gameStarted || regionId === null) {
        [actionExploreBtn, actionCollectBtn, actionBuildBtn, actionNegotiateBtn].forEach(b=>b.disabled = true);
        actionsLeftEl.textContent = `Ações restantes: ${gameState.actionsLeft}`;
        return;
    }

    const isOwnRegion = region.controller === player.id;
    const isNeutral = region.controller === null;
    const isEnemy = region.controller !== -1 && region.controller !== player.id;

    // --- LÓGICA DE HABILITAÇÃO DOS BOTÕES ---

    // 1. Botão EXPLORAR: Habilitado apenas em regiões Neutras ou Próprias (para explorar o entorno?)
    // Adaptado para a regra: Ações específicas para regiões próprias/neutras, só Negociar para inimigas.
        // Botão EXPLORAR: 
    // - Em regiões NEUTRAS: Assumir Domínio (precisa 2 PV + recursos do bioma)
    // - Em regiões PRÓPRIAS: Explorar (precisa recursos de exploração)
    if (isNeutral) {
      // Verificar se pode assumir domínio (2 PV + recursos do bioma)
      const hasEnoughPV = player.victoryPoints >= 2;
      const canPayBiome = Object.entries(region.resources).every(([k,v]) => player.resources[k] >= v);
      actionExploreBtn.disabled = !baseEnabled || !hasEnoughPV || !canPayBiome;
    } else if (isOwnRegion) {
      // Verificar se pode explorar
      actionExploreBtn.disabled = !baseEnabled || !canPlayerAfford(GAME_CONFIG.ACTION_DETAILS.explorar.cost);
    } else {
      // Regiões inimigas não podem ser exploradas
      actionExploreBtn.disabled = true;
    }
  
    // 2. Botão CONSTRUIR: Habilitado apenas em regiões Próprias ou Neutras
    actionBuildBtn.disabled = !baseEnabled || isEnemy || !canPlayerAfford(GAME_CONFIG.ACTION_DETAILS.construir.cost);

    // 3. Botão COLETAR (RECOLHER): Habilitado apenas em regiões Próprias ou Neutras
    actionCollectBtn.disabled = !baseEnabled || isEnemy || !canPlayerAfford(GAME_CONFIG.ACTION_DETAILS.recolher.cost);

    // 4. Botão NEGOCIAR: Habilitado para Regiões de OUTRO Jogador (Inimigas)
    actionNegotiateBtn.disabled = !baseEnabled || !isEnemy || !canPlayerAfford(GAME_CONFIG.ACTION_DETAILS.negociar.cost);
    
    // Exceção: Se a negociação for permitida em regiões próprias/neutras, remova a condição `!isEnemy`. 
    // Assumindo a regra: "Somente o botão negociar" para inimigas, e "botões específicos" para neutras/próprias.

    actionsLeftEl.textContent = `Ações restantes: ${gameState.actionsLeft}`;

  // Atualizar texto do botão Explorar baseado no contexto
  const selectedRegion = regionId !== null ? gameState.regions[regionId] : null;
  if (selectedRegion) {
    if (selectedRegion.controller === null) {
      actionExploreBtn.textContent = 'Assumir Domínio';
    } else if (selectedRegion.controller === player.id) {
      actionExploreBtn.textContent = 'Explorar';
    } else {
      actionExploreBtn.textContent = 'Explorar';
    }
  } else {
    actionExploreBtn.textContent = 'Explorar';
  }

}

/* ---------------- Utilities / expose ---------------- */
window.gameState = gameState;
window.renderAll = renderAll;
