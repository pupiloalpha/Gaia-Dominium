/*
    Copie e cole aqui todo o conteúdo JavaScript 
    que estava dentro da tag <script> do seu arquivo GaiaDominium.2.html.
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
            PLAYER_ICONS: ['🦁', '🐯', '🐻', '🦊', '🐺', '🦅', '🐉', '🦈']
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
                structures: 0
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
                    regionEl.style.setProperty('--region-border-color', player.color);
                    regionEl.style.backgroundColor = player.color + '33';
                    
                    if (region.controller === gameState.currentPlayerIndex) {
                        regionEl.classList.add('controlled-by-current');
                    }
                }
                
                if (gameState.selectedRegion === region.id) {
                    regionEl.classList.add('selected');
                }
                
                regionEl.innerHTML = `
                    <div class="region-name">${region.name}</div>
                    <div class="region-info">${region.biome}</div>
                    <div class="region-info">Nível: ${region.explorationLevel}</div>
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
            
            // Construir: 3 Madeira + 2 Pedra + 1 Ouro
            document.getElementById('construirBtn').disabled = 
                !selectedRegion || selectedRegion.controller !== gameState.currentPlayerIndex || 
                player.resources.madeira < 3 || player.resources.pedra < 2 || player.resources.ouro < 1;
            
            // Recolher: 1 Madeira
            document.getElementById('recolherBtn').disabled = 
                player.resources.madeira < 1;
            
            // Negociar: 1 Ouro
            document.getElementById('negociarBtn').disabled = 
                player.resources.ouro < 1;
            
            // Finalizar Turno: sempre disponível
            document.getElementById('endTurnBtn').disabled = false;
        }

        // ==================== AÇÕES DO JOGO ====================
        function performAction(actionType) {
            const player = gameState.players[gameState.currentPlayerIndex];
            const selectedRegion = gameState.selectedRegion !== null ? gameState.regions[gameState.selectedRegion] : null;
            
            switch(actionType) {
                case 'explorar':
                    if (selectedRegion && selectedRegion.controller === gameState.currentPlayerIndex) {
                        player.resources.madeira -= 2;
                        player.resources.agua -= 1;
                        selectedRegion.explorationLevel++;
                        player.victoryPoints += 1;
                        showFeedback('Região explorada! +1 PV', 'success');
                    }
                    break;
                    
                case 'construir':
                    if (selectedRegion && selectedRegion.controller === gameState.currentPlayerIndex) {
                        player.resources.madeira -= 3;
                        player.resources.pedra -= 2;
                        player.resources.ouro -= 1;
                        selectedRegion.structures.push('estrutura');
                        player.structures++;
                        player.victoryPoints += 2;
                        showFeedback('Estrutura construída! +2 PV', 'success');
                    }
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
            gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
            gameState.selectedPlayerForResources = gameState.currentPlayerIndex; // Resetar visualização de recursos
            
            // Adicionar renda
            const player = gameState.players[gameState.currentPlayerIndex];
            const controlledRegions = gameState.regions.filter(r => r.controller === gameState.currentPlayerIndex);
            
            player.resources.madeira += controlledRegions.length;
            
            gameState.selectedRegion = null;
            updateDisplay();
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
