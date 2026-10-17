// ui-players.js - Gestão de Jogadores Humanos e IA
import { gameState } from '../state/game-state.js';
import { GAME_CONFIG, FACTION_ABILITIES } from '../state/game-config.js';
import { AI_DIFFICULTY_SETTINGS } from '../ai/ai-system.js';
import { RESOURCE_ICONS } from '../state/game-config.js';
import { getIcon } from './icons.js';

export class UIPlayersManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.selectedIcon = null;
        this.editingIndex = null;
        
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
        
        // Seleção de ícones e facções
        this.iconSelection = document.getElementById('iconSelection');
        this.factionDropdown = document.getElementById('factionDropdown');
        
        console.log("✅ Elementos de jogadores cacheados");
    }

    init() {
        this.renderIconSelection();
        this.populateFactionDropdown();
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
            iconButton.className = 'icon-button';
            iconButton.type = 'button';
            iconButton.innerHTML = icon;
            iconButton.title = `Ícone ${icon}`;
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
                iconButton.title = `Ícone ${icon} (já em uso por outro jogador)`;
                iconButton.style.opacity = '0.4';
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
            selectedIconDisplay.textContent = icon;
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
        option.textContent = `${faction.icon || '🏛️'} ${faction.name}`;
        
        // Verificar se facção está disponível (para qualquer jogador)
        // Ao editar, excluímos o jogador atual da verificação
        const isAvailable = this.isFactionAvailable(id, this.editingIndex);
        
        if (!isAvailable) {
            option.disabled = true;
            
            // Descobrir quem está usando esta facção
            const user = gameState.players.find(p => p.faction && p.faction.id === faction.id);
            const userType = user?.isAI ? 'IA' : 'Jogador';
            const userName = user?.name || 'Desconhecido';
            
            option.textContent += ` ✗ (usado por ${userType}: ${userName})`;
            option.style.color = '#9ca3af';
            option.style.fontStyle = 'italic';
            option.style.backgroundColor = 'rgba(156, 163, 175, 0.1)';
        } else {
            // Adicionar emoji indicador de disponibilidade
            option.textContent += ' ✓';
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
                // Atualizar ícone do dropdown com o ícone da facção selecionada
                dropdownIcon.textContent = faction.icon || '🏛️';
                
                // Efeito visual de confirmação
                dropdownContainer.style.animation = 'factionSelected 0.5s ease';
                setTimeout(() => {
                    dropdownContainer.style.animation = '';
                }, 500);
            } else if (dropdownIcon) {
                // Resetar ícone se nenhuma facção selecionada
                dropdownIcon.textContent = '🏛️';
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
    const icon = this.selectedIcon;
    const factionId = this.factionDropdown?.value || '';
    
    console.log("🔍 DEBUG handleAddPlayer:");
    console.log("• Nome:", name);
    console.log("• Ícone:", icon);
    console.log("• Facção:", factionId);
    
    // VALIDAÇÃO
    if (!name) {
        console.error("❌ Falta nome");
        this.uiManager.modals.showFeedback('Digite um nome para o jogador.', 'error');
        this.playerNameInput?.focus();
        return;
    }
    
    if (!icon) {
        console.error("❌ Falta ícone");
        this.uiManager.modals.showFeedback('Selecione um ícone para o jogador.', 'error');
        return;
    }
    
    if (!factionId) {
        console.error("❌ Falta facção");
        this.uiManager.modals.showFeedback('Selecione uma facção para o jogador.', 'error');
        this.factionDropdown?.focus();
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
    
    // Ícone único
    const iconUsed = gameState.players.some(p => p.icon === icon);
    if (iconUsed) {
        this.uiManager.modals.showFeedback('Este ícone já está sendo usado por outro jogador.', 'error');
        return;
    }
    
    // Criar jogador
    const faction = FACTION_ABILITIES[factionId];
    
    // USAR A COR DA FACÇÃO
    const color = faction.color || '#9ca3af';
    
    const player = {
        id: gameState.players.length,
        name,
        icon,
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
    this.renderIconSelection();
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
        
        // Resetar seleção de ícone
        this.selectedIcon = null;
        document.querySelectorAll('.icon-button.selected').forEach(btn => {
            btn.classList.remove('selected');
            btn.style.transform = '';
        });
        
        // Resetar display do ícone selecionado
        const selectedIconDisplay = document.getElementById('selectedIconDisplay');
        if (selectedIconDisplay) {
            selectedIconDisplay.textContent = '❌';
            selectedIconDisplay.style.color = '';
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
                    
                    <!-- Ícone do jogador -->
                    <div class="player-card-icon text-3xl mb-2 relative" style="color: ${borderColor}">
                        ${player.icon}
                        ${player.type === 'ai' || player.isAI ? 
                            `<span class="absolute -top-1 -right-1 bg-purple-600 rounded-full p-1 inline-flex items-center justify-center">${getIcon('bot', { size: 12 })}</span>` : 
                            ''}
                    </div>
                    
                    <!-- Pontos de Vitória -->
                    <div class="player-card-pv text-xs font-bold text-yellow-300 mb-1 bg-black/30 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        ${player.victoryPoints} ${getIcon('star', { size: 11 })}
                    </div>
                    
                    <!-- Nome do jogador -->
                    <div class="player-card-name text-sm font-bold text-white text-center truncate w-full mb-1">
                        ${player.name}
                    </div>
                    
                    <!-- Facção -->
                    <div class="player-card-faction text-xs text-gray-300 text-center truncate w-full">
                        ${player.faction ? `${player.faction.icon || '🏛️'} ${player.faction.name}` : 'Sem facção'}
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
        
        // Selecionar ícone
        this.selectedIcon = player.icon;
        document.querySelectorAll('.icon-button').forEach(btn => {
            if (btn.textContent === player.icon) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
        
        // Selecionar facção no dropdown
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
        
        if (gameState.players.length <= 2) {
            this.uiManager.modals.showFeedback('É necessário pelo menos 2 jogadores para iniciar o jogo.', 'error');
            return;
        }
        
        const player = gameState.players[index];
        const confirmed = await this.uiManager.modals.showConfirm(
            'Remover Jogador',
            `Tem certeza que deseja remover "${player.name}" (${player.icon})?`
        );
        
        if (!confirmed) return;
        
        gameState.players.splice(index, 1);
        gameState.players.forEach((p, i) => {
            p.id = i;
        });
        
        this.updatePlayerCountDisplay();
        this.renderRegisteredPlayersList();
        this.uiManager.modals.showFeedback(`Jogador ${player.name} removido com sucesso!`, 'success');
    }

    updatePlayer(index) {
    const name = this.playerNameInput.value.trim();
    const icon = this.selectedIcon;
    const factionId = this.factionDropdown?.value;
    
    if (!name || !icon || !factionId) {
        this.uiManager.modals.showFeedback('Preencha todos os campos.', 'error');
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
    
    // Validar ícone único (exceto para o próprio jogador)
    const iconUsed = gameState.players.some((p, i) => 
        i !== index && p.icon === icon
    );
    
    if (iconUsed) {
        this.uiManager.modals.showFeedback('Este ícone já está sendo usado por outro jogador.', 'error');
        return;
    }
    
    // Atualizar jogador
    const faction = FACTION_ABILITIES[factionId];
    
    gameState.players[index] = {
        ...gameState.players[index],
        name,
        icon,
        color: faction.color, // ATUALIZAR COR DA FACÇÃO
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
    this.populateFactionDropdown();
    
    this.uiManager.modals.showFeedback(`${name} atualizado como ${faction.name}!`, 'success');
}

    updatePlayerCountDisplay() {
        const count = gameState.players.length;
        const display = document.getElementById('playerCountDisplay');
        
        if (display) {
            display.textContent = count;
        }
        
        // Atualizar estado do botão iniciar
        if (this.startGameBtn) {
            const minPlayers = GAME_CONFIG.MIN_PLAYERS || 2;
            this.startGameBtn.disabled = count < minPlayers;
            
            if (count < minPlayers) {
                this.startGameBtn.title = `Adicione mais ${minPlayers - count} jogador(es)`;
            } else {
                this.startGameBtn.title = 'Iniciar jogo';
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
    
    const aiIcon = '🤖';
    
    const player = {
        id: gameState.players.length,
        name: aiName,
        icon: aiIcon,
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
    this.renderIconSelection();
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
            <button class="ai-button-compact easy" data-diff="easy" title="IA Fácil">
                🤖 Fácil
            </button>
            <button class="ai-button-compact medium" data-diff="medium" title="IA Média">
                🤖 Média
            </button>
            <button class="ai-button-compact hard" data-diff="hard" title="IA Difícil">
                🤖 Difícil
            </button>
            <button class="ai-button-compact master" data-diff="master" title="IA Mestre">
                🤖 Mestre
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
        // Início do jogo
        this.addPlayerBtn?.addEventListener('click', () => this.handleAddPlayer());
        this.cancelEditBtn?.addEventListener('click', () => this.cancelEdit());
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
