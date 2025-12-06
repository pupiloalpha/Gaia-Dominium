# Documentação Completa do Projeto: Gaia Dominium

## 1. Introdução ao Projeto

### 1.1. Visão Geral
Gaia Dominium é um jogo de tabuleiro (boardgame) virtualizado em um site web, projetado para simular uma experiência de jogo de estratégia ecológica e expansão territorial. O jogo se passa em um mundo fictício chamado Gaia, fragmentado em 25 regiões após um cataclismo. Os jogadores lideram facções que competem por recursos, constroem estruturas, exploram biomas e negociam para acumular Pontos de Vitória (PV). O objetivo é ser o primeiro a atingir 25 PV, tornando-se o "Guardião de Gaia".

O site é construído como uma aplicação single-page (SPA) usando HTML, CSS e JavaScript puro (sem frameworks como React ou Vue), o que facilita a hospedagem no GitHub Pages. Ele suporta 2-4 jogadores locais (turn-based em um único dispositivo), com mecânicas inspiradas em boardgames clássicos como Catan ou Terraforming Mars: gerenciamento de recursos, exploração, construção, negociação e eventos aleatórios.

Principais features:
- **Mapa Interativo**: Grid 5x5 de regiões com zoom, pan e tooltips.
- **Sistema de Turnos e Fases**: Fases de Renda, Ações e Negociação.
- **Recursos e Biomas**: 4 tipos de recursos (Madeira, Pedra, Ouro, Água) e 4 biomas com rendas variáveis.
- **Ações**: Explorar, Recolher, Construir, Negociar.
- **Estruturas**: 5 tipos com efeitos e limites por região.
- **Eventos Aleatórios**: 15 eventos globais que alteram o jogo (positivos, negativos ou mistos).
- **Conquistas**: 8 conquistas com recompensas que afetam o gameplay.
- **Salvamento Local**: Usa LocalStorage para salvar/carregar jogos.
- **Manual Integrado**: Modal com abas explicando regras e mecânicas.
- **UI Responsiva**: Adaptada para desktop e mobile, com transparência ajustável no mapa.
- **Acessibilidade**: Suporte a prefers-reduced-motion e light mode (via prefers-color-scheme).

O jogo promove estratégia, diplomacia e adaptação, com elementos de RNG (eventos) para replayability. Como entusiasta de boardgames, note-se que o design equilibra luck vs. skill, com foco em decisões táticas em um mapa fixo mas dinâmico via exploração e eventos.

### 1.2. Tecnologias e Dependências
- **HTML5**: Estrutura semântica com modais e grids.
- **CSS3**: Tailwind CSS (via CDN) para estilos rápidos, com customizações em style.css (variáveis CSS, gradients, backdrop-filter para efeitos glassmorphism).
- **JavaScript ES6+**: Módulos nativos (type="module") para organização. Sem dependências externas além de Tailwind e Google Fonts.
- **Armazenamento**: LocalStorage para saves (JSON serializado).
- **Compatibilidade**: Browsers modernos (Chrome, Firefox, Safari). Inclui migration em compatibility.js para saves antigos.
- **Hospedagem**: GitHub Pages – o site é estático, sem backend.

### 1.3. Fluxo Geral do Jogo
1. **Tela Inicial**: Registro de jogadores (2-4), escolha de ícones e nomes.
2. **Início do Jogo**: Distribuição inicial de regiões, fase de Renda.
3. **Turno de Jogador**: 
   - **Renda**: Coleta automática de recursos (modal informativa).
   - **Ações**: 2 ações por turno (Explorar, Recolher, Construir).
   - **Negociação**: Opcional, com outros jogadores.
4. **Fim de Turno**: Avanço para próximo jogador; eventos a cada ~4 turnos.
5. **Vitória**: Primeiro a 25 PV vence; modal de vitória.
6. **Salvamento**: Auto-save a cada 30s; opção de carregar/deletar.

## 2. Estrutura de Arquivos

O projeto segue uma estrutura modular para facilitar manutenção:
- **index.html**: Arquivo principal. Contém markup para tela inicial, modais (manual, eventos, negociação, alertas, vitória), navbar, sidebar, mapa (grid 5x5), footer de ações e scripts modulares.
- **style.css**: Estilos customizados. Define variáveis CSS (:root), resets, z-index hierarchy, modais, layout responsivo (media queries para mobile), utilitários (gaps, texts) e scrollbar customizada.
- **Módulos JavaScript**: Importados via type="module" em index.html. Estrutura inspirada em MVC (Model: game-state, View: ui-manager, Controller: game-logic).

Outros arquivos:
- Imagens: gaia-inicio.png (background inicial), gaia-mapa.png (mapa do jogo) – referenciados no HTML/CSS.

## 3. Descrição dos Módulos JavaScript

### 3.1. main.js (Ponto de Entrada)
- **Propósito**: Inicializa o app, importa módulos, configura listeners globais e expõe objetos no window para compatibilidade.
- **Funções Principais**:
  - `setupInitialUI()`: Renderiza seleção de ícones e manual.
  - `setupGlobalEventListeners()`: Listeners para modais, teclas (ESC, ações numéricas).
  - `setupAuxiliarySystems()`: Configura zoom/pan no mapa, conquistas, transparência, logs.
  - `saveGame()`: Serializa gameState e achievementsState no LocalStorage.
  - `loadGame(data)`: Deserializa, migra dados (via compatibility.js), atualiza UI.
  - Auto-save: Intervalo de 30s.
- **Integrações**: Chama métodos de UIManager e GameLogic; lida com saves.

### 3.2. game-state.js (Estado do Jogo – Model)
- **Propósito**: Armazena e gerencia estado centralizado (imutável externamente via getters/setters).
- **Estruturas de Dados**:
  - `gameState`: Objeto com players[], regions[], turn, actionsLeft, phases, events, etc.
  - `achievementsState`: Contadores (explored, built) e unlocked por jogador.
  - `activityLogHistory`: Array de logs (id, timestamp, turn, type, player, action).
- **Funções Principais**:
  - Getters: `getGameState()`, `getCurrentPlayer()`, `getSelectedRegion()`.
  - Setters: `setGameState(newState)`, `setCurrentPhase(phase)`.
  - Manipulação: `addActivityLog(entry)`, `updatePlayerResources(index, resources)`, `updateRegionController(id, playerId)`, `addStructureToRegion(id, structure)`.
  - Verificações: `canPlayerAfford(index, cost)`, `hasPlayerWon()`.
  - Inicialização: `initializeGame(playersData)` – Reseta estado, adiciona jogadores.
- **Notas**: Usa spread operators para imutabilidade; regions são array de objetos com bioma, recursos, explorationLevel, structures.

### 3.3. game-config.js (Constantes e Configurações)
- **Propósito**: Centraliza configs imutáveis, ícones e dados estáticos.
- **Principais Constantes**:
  - `GAME_CONFIG`: Grid size (5), icons/colors, initial resources, victory (25 PV), actions per turn (2), costs.
  - `RESOURCE_ICONS`: Emojis para recursos.
  - `BIOME_INCOME` / `BIOME_INITIAL_RESOURCES`: Por bioma (ex: Floresta Tropical: alta água/madeira).
  - `STRUCTURE_*`: Costs, income, effects, limits (ex: Abrigo: +PV, Mercado: +Ouro).
  - `EXPLORATION_BONUS`: Multiplicadores por nível (0-3).
  - `TURN_PHASES`: Renda, Ações, Negociação.
  - `GAME_EVENTS`: Array de 15 eventos (name, effect, duration, apply/remove functions).
  - `ACHIEVEMENTS_CONFIG`: 8 conquistas com id, requirement, type, reward.
- **Notas**: Exporta tudo para uso em outros módulos.

### 3.4. ui-manager.js (Renderização da Interface – View)
- **Propósito**: Manipula DOM, renderiza estados e lida com interações UI.
- **Funções Principais**:
  - Construtor: Cache de elementos, setup de listeners.
  - Renderização: `renderBoard()` (gera grid de células), `renderSidebar(index)` (recursos/regiões), `renderHeaderPlayers()` (navbar com PV/icons).
  - Modais: `showIncomeModal(player, bonuses)`, `showBuildModal(region)`, `showNegotiationModal(target)`, `showEventModal(ev)`.
  - Atualizações: `updateUI()` (chama renders), `updateFooter()` (ações restantes, fase).
  - Interações: `handleRegionClick(id)` (seleciona região), `renderIconSelection()` (opções de ícones).
  - Feedback: `showAlert(title, msg, type)`, `showConfirm(title, msg)` (Promise-based).
- **Notas**: Usa templates HTML dinâmicos; integra com game-logic para ações (ex: validar custos antes de executar).

### 3.5. game-logic.js (Lógica de Ações, Turnos, Eventos – Controller)
- **Propósito**: Implementa regras do jogo, valida ações e atualiza estado.
- **Funções Principais**:
  - `initializeGame()`: Setup regiões, distribui iniciais, aplica renda inicial.
  - Fases/Turnos: `advancePhase()`, `handleEndTurn()` (avança jogador/turno, triggers events).
  - Ações: `performExplore(region)`, `performCollect(region)`, `performBuild(region, structure)`, `performNegotiate(offer, target)`.
  - Renda: `applyIncomeForPlayer(player)` (calcula bonuses, mostra modal).
  - Eventos: `triggerRandomEvent()` (seleciona/aplica evento).
  - Validações: `isPhaseValidForAction(type)`, `validateNegotiationOffer(offer, player)`.
  - Vitória: `checkVictory()` (verifica 25 PV).
- **Notas**: Integra com state e UI; aplica modifiers de eventos/conquistas.

### 3.6. utils.js (Funções Utilitárias)
- **Propósito**: Helpers genéricos para UI e lógica.
- **Funções Principais**:
  - Modais: `showAlert(title, msg, type)`, `showConfirm(title, msg)` (Promise).
  - UI: `refreshUIAfterStateChange(...)` (chama renders), `hexToRgb(hex)`.
  - Mapa: `setupMapZoomPan()` (wheel/mouse para zoom/drag).
  - Saves: `showSaveLoadModal()` (Promise para load/new/delete), `checkAndOfferLoad()`.
- **Notas**: Expõe fullscreen toggle; lida com saves iniciais.

### 3.7. game-manual.js (Manual do Jogo)
- **Propósito**: Conteúdo estático para o manual (HTML strings).
- **Estruturas**: `MANUAL_CONTENT` – Objeto com HTML por aba (o-jogo, regioes, regras, etc.).
- **Funções**: `getManualContent(tabId)`, `getAllManualContent()`.
- **Notas**: Renderizado via UIManager em modal com tabs.

### 3.8. bridge.js (Ponte de Ligação)
- **Propósito**: Importa e exporta módulos para acesso unificado; expõe no window.
- **Notas**: Facilita integração em main.js.

### 3.9. compatibility.js (Análise de Versões)
- **Propósito**: Migra saves antigos adicionando campos faltantes (ex: eventModifiers).
- **Funções**: `migrateSaveData(data)` – Adiciona defaults.

## 4. Mecânicas do Jogo

- **Recursos**: Gerados por biomas/estruturas; usados em ações/negociações.
- **Exploração**: Níveis 0-3; bonuses crescentes (multiplicadores, specials como +Ouro).
- **Construção**: 5 estruturas por região (limites); efeitos como +PV ou reduções de custo.
- **Negociação**: Troca recursos/regiões; +1 PV para ambos se aceita.
- **Eventos**: Trigger a cada 4 turnos; duram 1-3 turnos; alteram multipliers ou causam perdas.
- **Conquistas**: Progresso por jogador; desbloqueiam rewards (ex: +PV/turno para Explorador).
- **Fases por Turno**: Renda (auto), Ações (2), Negociação (opcional).
- **Balanceamento**: Custos equilibrados; diversidade de biomas incentiva expansão.

## 5. Como Jogar / Funcionalidades

- **Registro**: Adicione 2-4 jogadores; edite/exclua.
- **Mapa**: Clique em regiões para ações; hover para tooltip (bioma, recursos, estruturas).
- **Sidebar**: Mostra jogador selecionado; ajusta transparência do grid.
- **Footer**: Botões de ações; indicador de fase/ações restantes.
- **Modais**: Manual (tabs), Eventos (descrição), Negociação (formulários), Renda (bonuses).
- **Teclas**: 1-4 para ações; +/- para zoom; ESC fecha modais.
- **Mobile**: Layout stackado; botões menores.

## 6. Considerações Técnicas

- **Performance**: DOM manipulations otimizadas; renders condicionais.
- **Debug**: Console logs extensos; exposto no window para inspeção.
- **Extensibilidade**: Adicione eventos/conquistas em game-config.js.
- **Limitações**: Multiplayer local apenas; sem IA (jogadores humanos alternam).
- **Melhorias Sugeridas**: Adicionar IA simples; multiplayer online via WebSockets; mais biomas/estruturas.
- **Versão**: 1.0.0 (de saves); migração em compatibility.js.

Esta documentação cobre o essencial; para detalhes, consulte os códigos-fonte. Como sênior dev, recomendo testes unitários em JS para lógica crítica (ex: renda calculation).
