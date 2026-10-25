// ui-players.js - Gestão de Jogadores Humanos e IA
import { gameState } from '../state/game-state.js';
import { GAME_CONFIG, FACTION_ABILITIES, FACTION_CONFIG } from '../state/game-config.js';
import { AI_DIFFICULTY_SETTINGS } from '../ai/ai-system.js';
import { RESOURCE_ICONS } from '../state/game-config.js';
import { getIcon, renderPlayerIcon } from './icons.js';

export class UIPlayersManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.selectedIcon = null;
        this.editingIndex = null;
        this.selectedFactionCard = null;
        
        // Bind methods
        this.selectIcon = this.selectIcon.bind(this);
        this.handleAddPlayer = this.handleAddPlayer.bind(this);
        
        this.cacheElements();
    }

    cacheElements() {
        console.log("🔄 Cacheando elementos de jogadores...");
        
        // Elementos do formulário
        this.playerNameInput = document.getElementById('playerName');
        this.addPlayerBtn = document.getElementById('addPlayerBtn');
        this.cancelEditBtn = document.getElementById('cancelEditBtn');
        this.registeredPlayersList = document.getElementById('registeredPlayersList');
        this.playerCountDisplay = document.getElementById('playerCountDisplay');
        this.startGameBtn = document.getElementById('startGameBtn');
        
        // Elementos de status / feedback do lobby
        this.playerSetupStatusBadge = document.getElementById('playerSetupStatusBadge');
        this.playerSetupStatusText = document.getElementById('playerSetupStatusText');
        this.startGameHint = document.getElementById('startGameHint');
        this.selectedFactionBadge = document.getElementById('selectedFactionBadge');
        
        // Seleção de ícones e facções
        this.iconSelection = document.getElementById('iconSelection');
        this.factionDropdown = document.getElementById('factionDropdown');
        this.factionCardContainer = document.getElementById('factionCardContainer');
        
        console.log("✅ Elementos de jogadores cacheados");
    }

    init() {
        this.populateFactionDropdown();
        this.renderFactionCards();
        this.addAIPlayerButtons();
        this.updatePlayerCountDisplay();
        this.setupFormValidation();
        this.setupFactionDropdownEffects();
        this.setupEventListeners();
    }

    // ==================== SELEÇÃO DE ÍCONES ====================

    renderIconSelection() {
        if (!this.iconSelection) {
            console.error("❌ Elemento iconSelection não encontrado");
            return;
        }
        
        this.iconSelection.innerHTML = '';
        
        GAME_CONFIG.PLAYER_ICONS.forEach(icon => {
            const iconButton = document.createElement('button');
            iconButton.className = 'icon-button flex items-center justify-center p-2 rounded-lg bg-gray-800/80 border border-white/10 hover:border-yellow-400/50 hover:bg-gray-700/80 transition-all cursor-pointer text-gray-200 hover:text-white';
            iconButton.type = 'button';
            iconButton.innerHTML = getIcon(icon, { size: 26 });
            iconButton.title = `Avatar ${icon}`;
            iconButton.dataset.icon = icon;
            
            // Verificar se ícone já está em uso por outros jogadores
            const isUsedByOthers = gameState.players.some((p, index) => {
                if (this.editingIndex !== null && index === this.editingIndex) {
                    return false;
                }
                return p.icon === icon;
            });
            
            if (isUsedByOthers) {
                iconButton.classList.add('disabled');
                iconButton.title = `Avatar ${icon} (já em uso por outro jogador)`;
                iconButton.style.opacity = '0.35';
                iconButton.style.cursor = 'not-allowed';
                iconButton.disabled = true;
            } else {
                iconButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.selectIcon(icon, iconButton);
                });
            }
            
            // Se este é o ícone atualmente selecionado, marque como selecionado
            if (this.selectedIcon === icon) {
                iconButton.classList.add('selected');
                iconButton.style.transform = 'scale(1.1)';
            }
            
            this.iconSelection.appendChild(iconButton);
        });
        
        console.log(`✅ ${GAME_CONFIG.PLAYER_ICONS.length} botões de ícone renderizados`);
    }

    // Renderização das cartas de facção como botões com imagens
    renderFactionCards() {
        if (!this.factionCardContainer) {
            console.error("❌ Elemento factionCardContainer não encontrado");
            return;
        }
        // Limpar container
        this.factionCardContainer.innerHTML = '';
        const configMap = {
            0: FACTION_CONFIG.verde,
            1: FACTION_CONFIG.azul,
            2: FACTION_CONFIG.vermelha,
            3: FACTION_CONFIG.amarela
        };
        Object.entries(FACTION_ABILITIES).forEach(([id, faction]) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'faction-card flex items-center gap-2 p-2 rounded-lg bg-gray-800/80 border border-white/10 hover:border-yellow-400/50 hover:bg-gray-700/80 transition-all cursor-pointer';
            const img = document.createElement('img');
            const cfg = configMap[id];
            img.src = cfg.img;
            img.alt = `Facção ${cfg.name}`;
            img.className = 'w-8 h-8 object-contain rounded';
            btn.appendChild(img);
            const label = document.createElement('div');
            label.textContent = cfg.name;
            label.className = 'text-xs text-gray-200 whitespace-nowrap';
            btn.appendChild(label);
            // Verificar disponibilidade
            const isAvailable = this.isFactionAvailable(id, this.editingIndex);
            if (!isAvailable) {
                btn.disabled = true;
                btn.classList.add('opacity-40', 'cursor-not-allowed');
            }
            // Seleção via clique
            btn.addEventListener('click', () => {
                this.selectFactionCard(id, btn);
            });
            // Seleção via teclado (Enter ou Space)
            btn.tabIndex = 0;
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectFactionCard(id, btn);
                }
            });
            this.factionCardContainer.appendChild(btn);
        });
        console.log(`✅ ${Object.keys(FACTION_ABILITIES).length} cartas de facção renderizadas`);
    }

    // Manipulação de seleção de carta de facção
    selectFactionCard(factionId, element) {
        console.log(`🎯 Selecionando facção: ${FACTION_ABILITIES[factionId].name}`);
        // Desmarcar todas
        document.querySelectorAll('.faction-card.selected').forEach(el => {
            el.classList.remove('selected');
            el.style.transform = '';
        });
        // Atualizar estado interno
        this.selectedFactionCard = factionId;
        // Atualizar dropdown oculto
        if (this.factionDropdown) {
            this.factionDropdown.value = factionId;
            const changeEvent = new Event('change', { bubbles: true });
            this.factionDropdown.dispatchEvent(changeEvent);
        }
        // Marcar visualmente o elemento clicado
        if (element) {
            element.classList.add('selected');
            element.style.transform = 'scale(1.05)';
        }

        // Atualizar badge de facção selecionada
        if (this.selectedFactionBadge) {
            const faction = FACTION_ABILITIES[factionId];
            if (faction) {
                this.selectedFactionBadge.textContent = `✓ ${faction.name}`;
                this.selectedFactionBadge.classList.remove('hidden');
            }
        }
    }
    selectIcon(icon, buttonElement) {
        console.log(`🎯 Selecionando ícone: ${icon}`);

        // Desselecionar todos
        document.querySelectorAll('.icon-button.selected').forEach(btn => {
            btn.classList.remove('selected');
            btn.style.transform = '';
        });

        this.selectedIcon = icon;

        if (buttonElement) {
            buttonElement.classList.add('selected');
            buttonElement.style.transform = 'scale(1.1)';

            // Feedback visual
            buttonElement.animate([
                { transform: 'scale(1)', opacity: 1 },
                { transform: 'scale(1.2)', opacity: 0.8 },
                { transform: 'scale(1.1)', opacity: 1 }
            ], {
                duration: 300,
                easing: 'ease-out'
            });
        }

        // Atualizar display do ícone selecionado
        const selectedIconDisplay = document.getElementById('selectedIconDisplay');
        if (selectedIconDisplay) {
            selectedIconDisplay.innerHTML = getIcon(icon, { size: 24 });
            selectedIconDisplay.style.color = '#fbbf24';
        }

        console.log(`✅ Ícone selecionado: ${icon}`);
    }


    // ==================== DROPDOWN DE FACÇÕES ====================

    populateFactionDropdown() {
    if (!this.factionDropdown) {
        console.error("❌ Elemento factionDropdown não encontrado");
        return;
    }
    
    // Limpar opções exceto o placeholder
    while (this.factionDropdown.options.length > 1) {
        this.factionDropdown.remove(1);
    }
    
    // Adicionar opções com estilo
    Object.entries(FACTION_ABILITIES).forEach(([id, faction]) => {
        const option = document.createElement('option');
        option.value = id;
        option.title = faction.description || `Facção ${faction.name}`;
        option.textContent = faction.name;
        
        // Verificar se facção está disponível (para qualquer jogador)
        // Ao editar, excluímos o jogador atual da verificação
        const isAvailable = this.isFactionAvailable(id, this.editingIndex);
        
        if (!isAvailable) {
            option.disabled = true;
            
            // Descobrir quem está usando esta facção
            const user = gameState.players.find(p => p.faction && p.faction.id === faction.id);
            const userType = user?.isAI ? 'IA' : 'Jogador';
            const userName = user?.name || 'Desconhecido';
            
            option.textContent += ` (em uso por ${userType}: ${userName})`;
            option.style.color = '#9ca3af';
            option.style.fontStyle = 'italic';
            option.style.backgroundColor = 'rgba(156, 163, 175, 0.1)';
        } else {
            option.textContent += ' [Disponível]';
            option.style.color = '#f0f0f0';
            option.style.backgroundColor = 'transparent';
        }
        
        // Adicionar estilo baseado na facção
        option.dataset.factionId = id;
        option.style.padding = '12px 16px';
        option.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
        option.style.borderLeft = `4px solid ${faction.color}`;
        
        this.factionDropdown.appendChild(option);
    });
    
    console.log(`✅ Dropdown de facções preenchido com ${Object.keys(FACTION_ABILITIES).length} opções`);
}

    setupFactionDropdownEffects() {
        if (!this.factionDropdown) return;
        
        const dropdownContainer = this.factionDropdown.closest('.dropdown-container');
        const dropdownIcon = dropdownContainer?.querySelector('.dropdown-icon');
        
        this.factionDropdown.addEventListener('change', () => {
            const selectedValue = this.factionDropdown.value;
            const faction = FACTION_ABILITIES[selectedValue];
            
            if (faction && dropdownIcon) {
                // Atualizar ícone do dropdown com o ícone SVG da facção selecionada
                dropdownIcon.innerHTML = faction.icon || getIcon('faction_forest', { size: 18 });
                
                // Efeito visual de confirmação
                dropdownContainer.style.animation = 'factionSelected 0.5s ease';
                setTimeout(() => {
                    dropdownContainer.style.animation = '';
                }, 500);
            } else if (dropdownIcon) {
                // Resetar ícone se nenhuma facção selecionada
                dropdownIcon.innerHTML = getIcon('faction_forest', { size: 18 });
            }
        });
        
        // Efeito ao abrir o dropdown
        this.factionDropdown.addEventListener('click', () => {
            const dropdownArrow = dropdownContainer?.querySelector('.dropdown-arrow');
            if (dropdownArrow) {
                dropdownArrow.style.transform = 'translateY(-50%) rotate(180deg)';
            }
        });
        
        // Efeito ao perder foco
        this.factionDropdown.addEventListener('blur', () => {
            const dropdownArrow = dropdownContainer?.querySelector('.dropdown-arrow');
            if (dropdownArrow) {
                dropdownArrow.style.transform = 'translateY(-50%)';
            }
        });
    }

    isFactionAvailable(factionId, excludePlayerIndex = null) {
    const faction = FACTION_ABILITIES[factionId];
    if (!faction) return false;
    
    // Verifica se a facção já está sendo usada por QUALQUER jogador (humano ou AI)
    // exceto pelo jogador que estamos editando (se especificado)
    return !gameState.players.some((p, index) => {
        // Pular o jogador que estamos editando (se aplicável)
        if (excludePlayerIndex !== null && index === excludePlayerIndex) {
            return false;
        }
        return p.faction && p.faction.id === faction.id;
    });
}

    // ==================== FORMULÁRIO DE JOGADORES ====================

    setupFormValidation() {
        // Validação visual do ícone
        this.iconSelection?.addEventListener('click', (e) => {
            const iconButton = e.target.closest('.icon-button:not(.disabled)');
            if (iconButton) {
                this.iconSelection.style.border = '';
                this.iconSelection.style.borderRadius = '';
                this.iconSelection.style.padding = '';
            }
        });
        
        // Validação do nome
        this.playerNameInput?.addEventListener('input', () => {
            const name = this.playerNameInput.value.trim();
            if (name.length > 0) {
                this.playerNameInput.style.borderColor = '#10b981';
            } else {
                this.playerNameInput.style.borderColor = '';
            }
        });
        
        // Validação da facção
        this.factionDropdown?.addEventListener('change', () => {
            if (this.factionDropdown.value) {
                this.factionDropdown.style.borderColor = '#10b981';
            } else {
                this.factionDropdown.style.borderColor = '';
            }
        });
    }

    handleAddPlayer() {
    if (this.editingIndex !== null) {
        this.updatePlayer(this.editingIndex);
        return;
    }
    
    // Obter valores
    const name = this.playerNameInput?.value.trim() || '';
    const factionId = this.factionDropdown?.value || this.selectedFactionCard || '';
    
    console.log("🔍 DEBUG handleAddPlayer:");
    console.log("• Nome:", name);
    console.log("• Facção:", factionId);
    
    // VALIDAÇÃO
    if (!name) {
        console.error("❌ Falta nome");
        this.uiManager.modals.showFeedback('Digite um nome para o jogador.', 'error');
        this.playerNameInput?.focus();
        return;
    }
    
    if (!factionId) {
        console.error("❌ Falta facção");
        this.uiManager.modals.showFeedback('Selecione uma facção para o jogador.', 'error');
        return;
    }
    
    // Validar facção disponível (para qualquer jogador)
    if (!this.isFactionAvailable(factionId)) {
        const user = gameState.players.find(p => p.faction && p.faction.id === FACTION_ABILITIES[factionId].id);
        const userType = user?.isAI ? 'IA' : 'Jogador';
        const userName = user?.name || 'Desconhecido';
        
        this.uiManager.modals.showFeedback(`Esta facção já está sendo usada por ${userType}: ${userName}.`, 'error');
        return;
    }
    
    // Limite de jogadores
    if (gameState.players.length >= GAME_CONFIG.MAX_PLAYERS) {
        this.uiManager.modals.showFeedback(`Máximo de ${GAME_CONFIG.MAX_PLAYERS} jogadores atingido.`, 'warning');
        return;
    }
    
    // Criar jogador - ícone é a imagem da facção
    const faction = FACTION_ABILITIES[factionId];
    const color = faction.color || '#9ca3af';
    
    // Buscar imagem do ícone da facção no FACTION_CONFIG
    const configMap = { 0: FACTION_CONFIG.verde, 1: FACTION_CONFIG.azul, 2: FACTION_CONFIG.vermelha, 3: FACTION_CONFIG.amarela };
    const factionImg = configMap[factionId]?.img || '';
    
    const player = {
        id: gameState.players.length,
        name,
        icon: factionImg,
        color,
        resources: {...GAME_CONFIG.INITIAL_RESOURCES},
        victoryPoints: 0,
        regions: [],
        consecutiveNoActionTurns: 0,
        faction,
        turnBonuses: {
            freeNegotiationAvailable: faction.abilities.freeNegotiationPerTurn || 0,
            buildDiscountUsed: false,
            goldPerRegion: faction.abilities.goldPerRegion || 0,
            exploreDiscount: faction.abilities.exploreDiscount || {},
            waterCollectBonus: faction.abilities.waterCollectBonus || 0,
            structurePVBonus: faction.abilities.structurePVBonus || 0,
            negotiationPVBonus: faction.abilities.negotiationPVBonus || 0,
            marketDiscount: faction.abilities.marketDiscount || 0,
            goldExplorationBonus: faction.abilities.goldExplorationBonus || 0
        }
    };
    
    // Adicionar ao estado
    gameState.players.push(player);
    console.log(`✅ Jogador ${name} adicionado como ${faction.name} (cor: ${color})`);
    
    // Resetar formulário
    this.resetAddPlayerForm();
    
    // Atualizar UI
    this.updatePlayerCountDisplay();
    this.renderRegisteredPlayersList();
    this.renderFactionCards();
    this.populateFactionDropdown();
    
    this.uiManager.modals.showFeedback(`${name} adicionado como ${faction.name}!`, 'success');
    
    // Habilitar botão de iniciar se necessário
    if (gameState.players.length >= GAME_CONFIG.MIN_PLAYERS) {
        this.startGameBtn.disabled = false;
    }
}

    resetAddPlayerForm() {
        // Resetar input
        if (this.playerNameInput) {
            this.playerNameInput.value = '';
            this.playerNameInput.focus();
        }
        
        // Resetar seleção de facção (cartas)
        this.selectedFactionCard = null;
        document.querySelectorAll('.faction-card.selected').forEach(btn => {
            btn.classList.remove('selected');
            btn.style.transform = '';
        });
        
        // Resetar badge de facção selecionada
        if (this.selectedFactionBadge) {
            this.selectedFactionBadge.textContent = '';
            this.selectedFactionBadge.classList.add('hidden');
        }

        // Resetar dropdown de facção
        if (this.factionDropdown) {
            this.factionDropdown.selectedIndex = 0;
        }
        
        // Resetar modo de edição
        if (this.editingIndex !== null) {
            this.editingIndex = null;
            this.addPlayerBtn.textContent = '+ Adicionar';
            this.cancelEditBtn.classList.add('hidden');
            this.clearPlayerHighlight();
        }
    }

    // ==================== LISTA DE JOGADORES REGISTRADOS ====================

    renderRegisteredPlayersList() {
    const players = gameState.players;
    const canEdit = !gameState.gameStarted;
    
    const container = this.registeredPlayersList;
    if (!container) return;
    
    // Reset para estrutura inicial se não há jogadores
    if (players.length === 0) {
        // Mostrar todos os 4 slots vazios
        for (let i = 0; i < 4; i++) {
            const slot = container.querySelector(`.player-card[data-index="${i}"]`);
            if (slot) {
                slot.dataset.empty = "true";
                slot.className = "player-card empty";
                slot.innerHTML = `
                    <div class="player-card-inner flex flex-col items-center justify-center h-full p-4 rounded-lg border-2 border-dashed border-gray-600 bg-gray-800/20 transition-all hover:border-gray-500">
                        <div class="text-gray-500 mb-2 flex items-center justify-center">${getIcon('user', { size: 32 })}</div>
                        <div class="text-center">
                            <div class="text-sm font-bold text-gray-500">Slot Vazio</div>
                            <div class="text-xs text-gray-500 mt-1">Adicione um jogador</div>
                        </div>
                    </div>
                `;
            }
        }
        return;
    }
    
    // Atualizar slots com jogadores existentes
    players.forEach((player, index) => {
        const slot = container.querySelector(`.player-card[data-index="${index}"]`);
        if (slot) {
            slot.dataset.empty = "false";
            slot.className = `player-card ${index === this.editingIndex ? 'editing' : ''}`;
            
            const borderColor = player.color || '#9ca3af';
            const bgColor = this.hexToRgba(player.color || '#9ca3af', 0.08);
            
            let actionsHTML = '';
            if (canEdit) {
                const editBtn = player.type !== 'ai' && !player.isAI ? 
                    `<button class="player-card-edit" data-index="${index}" title="Editar">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                    </button>` : '';
                
                actionsHTML = `
                    <div class="player-card-actions flex gap-1 justify-center mt-2">
                        ${editBtn}
                        <button class="player-card-delete" data-index="${index}" title="Remover">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                `;
            }
            
            slot.innerHTML = `
                <div class="player-card-inner flex flex-col items-center justify-between h-full p-3 rounded-lg border-2 transition-all"
                     style="border-color: ${borderColor}; background: ${bgColor};">
                    
                    <!-- Ícone da facção -->
                    <div class="player-card-icon mb-2 relative flex items-center justify-center">
                        ${renderPlayerIcon(player.icon, 40)}
                    </div>
                    
                    <!-- Pontos de Vitória -->
                    <div class="player-card-pv text-xs font-bold text-yellow-300 mb-1 bg-black/30 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        ${player.victoryPoints} ${getIcon('star', { size: 11 })}
                    </div>
                    
                    <!-- Nome do jogador -->
                    <div class="player-card-name text-sm font-bold text-white text-center truncate w-full mb-1">
                        ${player.type === 'ai' || player.isAI 
                            ? `<span class="inline-flex items-center gap-1">${getIcon('bot', { size: 14 })} ${player.name}</span>` 
                            : player.name}
                    </div>
                    
                    <!-- Facção -->
                    <div class="player-card-faction text-xs text-gray-300 text-center truncate w-full flex items-center justify-center gap-1">
                        ${player.faction ? `<span class="inline-flex items-center gap-1">${player.faction.icon || ''} <span>${player.faction.name}</span></span>` : 'Sem facção'}
                    </div>
                    
                    <!-- Ações (se editável) -->
                    ${actionsHTML}
                </div>
            `;
        }
    });
    
    // Preencher slots restantes como vazios
    for (let i = players.length; i < 4; i++) {
        const slot = container.querySelector(`.player-card[data-index="${i}"]`);
        if (slot) {
            slot.dataset.empty = "true";
            slot.className = "player-card empty";
            slot.innerHTML = `
                <div class="player-card-inner flex flex-col items-center justify-center h-full p-4 rounded-lg border-2 border-dashed border-gray-600 bg-gray-800/20 transition-all hover:border-gray-500">
                    <div class="text-gray-500 mb-2 flex items-center justify-center">${getIcon('user', { size: 32 })}</div>
                    <div class="text-center">
                        <div class="text-sm font-bold text-gray-500">Slot Vazio</div>
                        <div class="text-xs text-gray-500 mt-1">Adicione um jogador</div>
                    </div>
                </div>
            `;
        }
    }
    
    if (canEdit) {
        this.setupPlayerActionListeners();
    }
}

createEmptyPlayerCard(index) {
    const card = document.createElement('div');
    card.className = 'player-card empty';
    card.dataset.index = index;
    card.dataset.empty = "true";
    card.innerHTML = `
        <div class="player-card-inner flex flex-col items-center justify-center h-full p-4 rounded-lg border-2 border-dashed border-gray-600 bg-gray-800/20 transition-all hover:border-gray-500">
            <div class="text-gray-500 mb-2 flex items-center justify-center">${getIcon('user', { size: 32 })}</div>
            <div class="text-center">
                <div class="text-sm font-bold text-gray-500">Slot Vazio</div>
                <div class="text-xs text-gray-500 mt-1">Adicione um jogador</div>
            </div>
        </div>
    `;
    return card;
}

    setupPlayerActionListeners() {
    // Botões de edição
    this.registeredPlayersList.querySelectorAll('.player-card-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(e.currentTarget.dataset.index);
            this.editPlayer(index);
        });
    });
    
    // Botões de remoção
    this.registeredPlayersList.querySelectorAll('.player-card-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(e.currentTarget.dataset.index);
            this.deletePlayer(index);
        });
    });
}

    editPlayer(index) {
        if (gameState.gameStarted) {
            this.uiManager.modals.showFeedback('Não é possível editar jogadores após o início do jogo.', 'warning');
            return;
        }
        
        const player = gameState.players[index];
        if (!player) return;
        
        this.editingIndex = index;
        
        // Preencher campos
        this.playerNameInput.value = player.name;
        
        // Selecionar facção no dropdown e nas cartas
        if (player.faction && this.factionDropdown) {
            const factionId = Object.keys(FACTION_ABILITIES).find(
                id => FACTION_ABILITIES[id].id === player.faction.id
            );
            
            if (factionId) {
                for (let i = 0; i < this.factionDropdown.options.length; i++) {
                    if (this.factionDropdown.options[i].value === factionId) {
                        this.factionDropdown.selectedIndex = i;
                        break;
                    }
                }
                // Selecionar carta correspondente
                this.selectedFactionCard = factionId;
                document.querySelectorAll('.faction-card').forEach((card, idx) => {
                    if (String(idx) === String(factionId)) {
                        card.classList.add('selected');
                        card.style.transform = 'scale(1.05)';
                    } else {
                        card.classList.remove('selected');
                        card.style.transform = '';
                    }
                });
            }
        }
        
        // Atualizar UI
        this.addPlayerBtn.textContent = '🔄 Atualizar';
        this.cancelEditBtn.classList.remove('hidden');
        this.highlightPlayerBeingEdited(index);
        
        this.uiManager.modals.showFeedback(`Editando ${player.name}. Altere os dados e clique em "Atualizar".`, 'info');
    }

    highlightPlayerBeingEdited(index) {
    this.registeredPlayersList.querySelectorAll('.player-card').forEach((card, i) => {
        if (i === index) {
            card.classList.add('editing');
            card.style.transform = 'scale(1.05)';
            card.style.zIndex = '10';
        } else {
            card.classList.remove('editing');
            card.style.transform = '';
            card.style.zIndex = '';
        }
    });
}

    cancelEdit() {
        this.addPlayerBtn.textContent = 'Adicionar';
        this.addPlayerBtn.classList.remove('bg-blue-600');
        this.addPlayerBtn.classList.add('bg-green-600');
        this.cancelEditBtn.classList.add('hidden');
        this.playerNameInput.value = '';
        this.playerNameInput.blur();
        
        document.querySelectorAll('.icon-option.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Limpar seleção de facção
        this.selectedFaction = null;
        document.querySelectorAll('.faction-option.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        this.clearPlayerHighlight();
        this.editingIndex = null;
        this.uiManager.modals.showFeedback('Edição cancelada.', 'info');
    }

    clearPlayerHighlight() {
    this.registeredPlayersList.querySelectorAll('.player-card').forEach(card => {
        card.classList.remove('editing');
        card.style.transform = '';
        card.style.zIndex = '';
    });
}

    async deletePlayer(index) {
        if (gameState.gameStarted) {
            this.uiManager.modals.showFeedback('Não é possível remover jogadores após o início do jogo.', 'warning');
            return;
        }
        
        const player = gameState.players[index];
        const confirmed = await this.uiManager.modals.showConfirm(
            'Remover Jogador',
            `Tem certeza que deseja remover "${player.name}"?`
        );
        
        if (!confirmed) return;
        
        gameState.players.splice(index, 1);
        gameState.players.forEach((p, i) => {
            p.id = i;
        });
        
        this.updatePlayerCountDisplay();
        this.renderRegisteredPlayersList();
        this.renderFactionCards();
        this.populateFactionDropdown();
        this.uiManager.modals.showFeedback(`Jogador ${player.name} removido com sucesso!`, 'success');
    }

    updatePlayer(index) {
    const name = this.playerNameInput.value.trim();
    const icon = this.selectedIcon;
    const factionId = this.factionDropdown?.value;
    
    if (!name || !factionId) {
        this.uiManager.modals.showFeedback('Preencha o nome e selecione uma facção.', 'error');
        return;
    }
    
    // Validar facção disponível (exceto para o próprio jogador)
    if (!this.isFactionAvailable(factionId, index)) {
        const user = gameState.players.find(p => p.faction && p.faction.id === FACTION_ABILITIES[factionId].id);
        const userType = user?.isAI ? 'IA' : 'Jogador';
        const userName = user?.name || 'Desconhecido';
        
        this.uiManager.modals.showFeedback(`Esta facção já está sendo usada por ${userType}: ${userName}.`, 'error');
        return;
    }
    
    // Atualizar jogador - ícone é a imagem da facção
    const faction = FACTION_ABILITIES[factionId];
    const configMap = { 0: FACTION_CONFIG.verde, 1: FACTION_CONFIG.azul, 2: FACTION_CONFIG.vermelha, 3: FACTION_CONFIG.amarela };
    const factionImg = configMap[factionId]?.img || '';
    
    gameState.players[index] = {
        ...gameState.players[index],
        name,
        icon: factionImg,
        color: faction.color,
        faction,
        turnBonuses: {
            freeNegotiationAvailable: faction.abilities.freeNegotiationPerTurn || 0,
            buildDiscountUsed: false,
            goldPerRegion: faction.abilities.goldPerRegion || 0,
            exploreDiscount: faction.abilities.exploreDiscount || {},
            waterCollectBonus: faction.abilities.waterCollectBonus || 0,
            structurePVBonus: faction.abilities.structurePVBonus || 0,
            negotiationPVBonus: faction.abilities.negotiationPVBonus || 0,
            marketDiscount: faction.abilities.marketDiscount || 0,
            goldExplorationBonus: faction.abilities.goldExplorationBonus || 0
        }
    };
    
    // Finalizar edição
    this.cancelEdit();
    
    // Atualizar UI
    this.updatePlayerCountDisplay();
    this.renderRegisteredPlayersList();
    this.renderFactionCards();
    this.populateFactionDropdown();
    
    this.uiManager.modals.showFeedback(`${name} atualizado como ${faction.name}!`, 'success');
}

    updatePlayerCountDisplay() {
        const count = gameState.players.length;
        const minPlayers = GAME_CONFIG.MIN_PLAYERS || 2;
        
        if (this.playerCountDisplay) {
            this.playerCountDisplay.textContent = count;
        }
        
        const remaining = Math.max(0, minPlayers - count);
        
        // Atualizar badge de status no cabeçalho da mesa
        if (this.playerSetupStatusBadge && this.playerSetupStatusText) {
            if (count < minPlayers) {
                this.playerSetupStatusBadge.className = 'text-[11px] font-semibold px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 flex items-center gap-1.5';
                this.playerSetupStatusText.textContent = remaining === 1 ? 'Falta 1 jogador' : `Faltam ${remaining} jogadores`;
            } else {
                this.playerSetupStatusBadge.className = 'text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 flex items-center gap-1.5';
                this.playerSetupStatusText.textContent = `${count} jogadores prontos!`;
            }
        }
        
        // Atualizar dica de status do botão Iniciar Partida
        if (this.startGameHint) {
            if (count === 0) {
                this.startGameHint.textContent = 'Cadastre ao menos 2 jogadores para liberar a partida.';
                this.startGameHint.className = 'text-xs text-gray-400';
            } else if (count < minPlayers) {
                this.startGameHint.textContent = 'Adicione mais 1 jogador (humano ou IA) para liberar o início.';
                this.startGameHint.className = 'text-xs text-yellow-300/90 font-medium';
            } else {
                this.startGameHint.textContent = `Tudo pronto com ${count} jogadores! Clique em Iniciar Partida.`;
                this.startGameHint.className = 'text-xs text-green-300 font-medium';
            }
        }
        
        // Atualizar estado e estilos do botão iniciar
        if (this.startGameBtn) {
            const isReady = count >= minPlayers;
            this.startGameBtn.disabled = !isReady;
            
            if (!isReady) {
                this.startGameBtn.title = `Adicione mais ${remaining} jogador(es) para iniciar`;
                this.startGameBtn.classList.remove('ring-4', 'ring-blue-400/30', 'animate-pulse');
            } else {
                this.startGameBtn.title = 'Tudo pronto! Clique para iniciar a partida';
                this.startGameBtn.classList.add('ring-4', 'ring-blue-400/30');
            }
        }
    }

    // ==================== SISTEMA DE IA ====================

    addAIPlayer(difficulty = 'medium', name = null) {
    if (gameState.players.length >= GAME_CONFIG.MAX_PLAYERS) {
        this.uiManager.modals.showFeedback('Máximo de 4 jogadores atingido.', 'warning');
        return null;
    }
    
    // Encontrar facções realmente disponíveis (não usadas por nenhum jogador)
    const availableFactions = Object.entries(FACTION_ABILITIES)
        .filter(([id, faction]) => this.isFactionAvailable(id));
    
    if (availableFactions.length === 0) {
        this.uiManager.modals.showFeedback('Todas as facções estão em uso. Não é possível adicionar mais jogadores.', 'error');
        return null;
    }
    
    // Escolher facção aleatória entre as disponíveis
    const randomFaction = availableFactions[Math.floor(Math.random() * availableFactions.length)];
    const factionId = randomFaction[0];
    const faction = randomFaction[1];
    
    // Nomes baseados na facção
    const aiNamesByFaction = {
        '0': ['Druida Ancestral', 'Guardião das Matas', 'Protetor da Floresta'],
        '1': ['Senhor das Marés', 'Mestre dos Rios', 'Comandante dos Mares'],
        '2': ['Arquiteto das Montanhas', 'Mestre das Pedreiras', 'Escultor de Rochas'],
        '3': ['Magnata do Comércio', 'Barão das Caravanas', 'Mestre dos Mercados']
    };
    
    const nameList = aiNamesByFaction[factionId] || ['IA Estratégica'];
    const aiName = name || nameList[Math.floor(Math.random() * nameList.length)];
    
    // USAR A COR DA FACÇÃO
    const color = faction.color || '#9ca3af';
    
    // Buscar imagem do ícone da facção no FACTION_CONFIG
    const configMap = { 0: FACTION_CONFIG.verde, 1: FACTION_CONFIG.azul, 2: FACTION_CONFIG.vermelha, 3: FACTION_CONFIG.amarela };
    const factionImg = configMap[factionId]?.img || '';
    
    const player = {
        id: gameState.players.length,
        name: aiName,
        icon: factionImg,
        color,
        resources: {...GAME_CONFIG.INITIAL_RESOURCES},
        victoryPoints: 0,
        regions: [],
        consecutiveNoActionTurns: 0,
        type: 'ai',
        aiDifficulty: difficulty,
        isAI: true,
        faction,
        turnBonuses: {
            freeNegotiationAvailable: faction.abilities.freeNegotiationPerTurn || 0,
            buildDiscountUsed: false,
            goldPerRegion: faction.abilities.goldPerRegion || 0,
            exploreDiscount: faction.abilities.exploreDiscount || {},
            waterCollectBonus: faction.abilities.waterCollectBonus || 0,
            structurePVBonus: faction.abilities.structurePVBonus || 0,
            negotiationPVBonus: faction.abilities.negotiationPVBonus || 0,
            marketDiscount: faction.abilities.marketDiscount || 0,
            goldExplorationBonus: faction.abilities.goldExplorationBonus || 0
        }
    };
    
    gameState.players.push(player);
    
    // Atualizar UI
    this.updatePlayerCountDisplay();
    this.renderRegisteredPlayersList();
    this.renderFactionCards();
    this.populateFactionDropdown();
    
    const diffName = AI_DIFFICULTY_SETTINGS[difficulty]?.name || difficulty;
    this.uiManager.modals.showFeedback(`IA ${aiName} adicionada como ${faction.name} (${diffName})`, 'success');
    
    // Habilitar botão de iniciar se necessário
    if (gameState.players.length >= GAME_CONFIG.MIN_PLAYERS) {
        this.startGameBtn.disabled = false;
    }
    
    return player;
}

    addAIPlayerButtons() {
        const container = document.getElementById('aiButtonsContainer');
        if (!container) {
            console.error("❌ Container de botões de IA não encontrado");
            return;
        }
        
        container.innerHTML = `
            <button class="ai-button-compact easy inline-flex items-center gap-1.5 justify-center" data-diff="easy" title="IA Fácil">
                ${getIcon('bot', { size: 14 })} Fácil
            </button>
            <button class="ai-button-compact medium inline-flex items-center gap-1.5 justify-center" data-diff="medium" title="IA Média">
                ${getIcon('bot', { size: 14 })} Média
            </button>
            <button class="ai-button-compact hard inline-flex items-center gap-1.5 justify-center" data-diff="hard" title="IA Difícil">
                ${getIcon('bot', { size: 14 })} Difícil
            </button>
            <button class="ai-button-compact master inline-flex items-center gap-1.5 justify-center" data-diff="master" title="IA Mestre">
                ${getIcon('bot', { size: 14 })} Mestre
            </button>
        `;
        
        // Adicionar event listeners
        container.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const diff = e.currentTarget.dataset.diff;
                this.addAIPlayer(diff);
            });
        });
        
        console.log("✅ Botões de IA adicionados");
    }

    // ==================== EVENT LISTENERS ====================

    setupEventListeners() {
        // Ações de cadastro
        this.addPlayerBtn?.addEventListener('click', () => this.handleAddPlayer());
        this.cancelEditBtn?.addEventListener('click', () => this.cancelEdit());
        
        // Tecla Enter no campo de nome para agilizar o cadastro
        this.playerNameInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleAddPlayer();
            }
        });
    }

    hexToRgba(hex, alpha) {
    // Remove o hash se presente
    hex = hex.replace(/^#/, '');
    
    // Parse os valores RGB
    let r, g, b;
    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
    } else {
        return 'rgba(156, 163, 175, 0.08)'; // Fallback
    }
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}
