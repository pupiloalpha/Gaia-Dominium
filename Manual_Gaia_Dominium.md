# Manual do Jogo: Gaia Dominium

## Índice

- [Introdução ao Jogo](#introdução-ao-jogo)
  - [O Tema de Gaia](#o-tema-de-gaia)
  - [Objetivo do Jogo](#objetivo-do-jogo)
  - [Componentes Virtuais](#componentes-virtuais)
- [Setup (Configuração Inicial)](#setup-configuração-inicial)
- [Jogabilidade: Estrutura de uma Rodada](#jogabilidade-estrutura-de-uma-rodada)
  - [Fases do Turno](#fases-do-turno)
- [Ações Detalhadas](#ações-detalhadas)
- [Recursos e Biomas](#recursos-e-biomas)
  - [Recursos](#recursos)
  - [Biomas](#biomas)
- [Eventos Aleatórios](#eventos-aleatórios)
- [Conquistas](#conquistas)
- [Fim de Jogo e Vitória](#fim-de-jogo-e-vitória)
- [Perguntas Frequentes (FAQ)](#perguntas-frequentes-faq)
- [Índice de Referências](#índice-de-referências)

Bem-vindo ao **Gaia Dominium**, um jogo de estratégia épico onde você assume o comando de uma facção lendária em um mundo fragmentado e repleto de mistérios. Imagine um planeta outrora próspero, Gaia, agora dilacerado por um cataclismo cósmico. Florestas exuberantes, savanas douradas e pântanos sombrios clamam por restauração. Como líder de uma das quatro facções ancestrais, você deve explorar territórios inóspitos, gerenciar recursos preciosos, erguer estruturas imponentes e forjar alianças – ou rivalidades – para reivindicar o domínio supremo. Com elementos de gerenciamento de recursos, construção de impérios e diplomacia tensa, Gaia Dominium combina a profundidade estratégica de um Eurogame com a emoção imprevisível de eventos aleatórios e interações diretas entre jogadores.

Este manual guiará você pela jornada de reconstruir Gaia. Prepare-se para uma aventura onde cada decisão pode alterar o equilíbrio do mundo – e o destino da vitória!

## Introdução ao Jogo

Esta seção apresenta os conceitos fundamentais do jogo, incluindo sua temática, objetivos e componentes. Ela serve como uma visão geral para novos jogadores, ajudando a contextualizar o universo de Gaia e preparar para as mecânicas principais, garantindo que você entenda o "porquê" e o "como" antes de mergulhar nas regras detalhadas.

### O Tema de Gaia
Esta subseção descreve o cenário narrativo do jogo, explicando o mundo de Gaia e as facções envolvidas. Seu conteúdo foca na lore, como o cataclismo que fragmentou o planeta e o papel das facções na restauração, proporcionando imersão e motivação para as ações estratégicas.

Gaia era um paraíso ecológico, um planeta vivo pulsando com energia natural. Mas um cataclismo devastador – talvez uma colisão estelar ou uma rebelião das forças da natureza – fragmentou o mundo em **25 regiões isoladas**, cada uma com seu bioma único e recursos escassos. Agora, quatro facções emergem das cinzas: os Guardiões da Floresta, os Senhores das Savanas, os Mestres dos Pântanos e os Exploradores das Montanhas. Cada facção busca restaurar o equilíbrio, expandir seu domínio e acumular **Pontos de Vitória (PV)** para se tornar o Guardião Supremo de Gaia.

### Objetivo do Jogo
Aqui, é explicado o propósito central da partida, incluindo como vencer e a duração estimada. O conteúdo detalha os Pontos de Vitória como métrica de progresso e enfatiza a natureza competitiva, ajudando os jogadores a alinharem suas estratégias desde o início.

Seu objetivo é ser o primeiro a acumular **25 Pontos de Vitória (PV)**. Os PV representam o progresso de sua facção na restauração de Gaia – através de exploração, construções, negociações e conquistas. O jogo termina imediatamente quando um jogador atinge ou ultrapassa 25 PV, proclamando-o o vencedor!

### Componentes Virtuais
Esta parte lista os elementos digitais do jogo, como mapa e recursos. Seu conteúdo descreve cada componente e sua função na interface, facilitando a familiarização com a versão online e destacando como eles substituem peças físicas de um boardgame tradicional.

Como um jogo digital, todos os componentes são gerenciados pela interface:
- **Mapa de Gaia**: Uma grade 5x5 com 25 regiões (A a Y), cada uma com bioma, recursos iniciais e status de controle.
- **Cartas de Facção**: Ícones personalizáveis (ex.: 🦁, 🐯) e cores para cada jogador.
- **Recursos**: 🪵 Madeira, 🪨 Pedra, 🪙 Ouro, 💧 Água – rastreados na sidebar.
- **Estruturas**: 5 tipos construíveis (Abrigo, Torre de Vigia, Mercado, Laboratório, Santuário).
- **Eventos Aleatórios**: 15 eventos globais que afetam todos os jogadores.
- **Conquistas**: 8 conquistas desbloqueáveis com recompensas.
- **Interface**: Navbar para jogadores, sidebar para detalhes, footer para ações, modais para eventos e negociações.

## Setup (Configuração Inicial)

Esta seção orienta sobre como preparar e iniciar uma partida, passo a passo. Seu conteúdo cobre a adição de jogadores, distribuição inicial e salvamento, garantindo que todos os participantes comecem em igualdade e entendam as mecânicas de setup digital.

1. **Acessando o Jogo**: Abra o site no navegador. A tela inicial exibe opções para adicionar jogadores.
2. **Adicionando Jogadores**:
   - Clique em "Adicionar Jogador".
   - Insira o nome da facção (ex.: "Guardiões Verdes").
   - Escolha um ícone (de uma seleção de animais míticos: 🦁, 🐯, etc.).
   - Repita para 2-4 jogadores.
   - O jogo atribui cores automáticas (verde, azul, vermelho, amarelo).
3. **Iniciando a Partida**:
   - Clique em "Iniciar Jogo" quando todos os jogadores estiverem registrados.
   - O mapa é gerado: 25 regiões distribuídas aleatoriamente entre biomas.
   - Cada jogador começa com recursos iniciais: 🪵10 Madeira, 🪨5 Pedra, 🪙3 Ouro, 💧5 Água.
   - Regiões iniciais são distribuídas: Cada jogador controla uma região neutra aleatória.
   - O primeiro jogador é selecionado aleatoriamente.
4. **Salvamento e Carregamento**: O jogo salva automaticamente no LocalStorage do navegador. Ao recarregar, pergunte se deseja carregar o save existente ou iniciar novo.

**Dica Inicial**: Explore o manual (ícone de livro na tela inicial) para abas detalhadas sobre regras, ações e estratégias.

## Jogabilidade: Estrutura de uma Rodada

Esta seção explica o fluxo geral do jogo, focando na progressão de turnos e fases. Seu conteúdo delineia como as rodadas se desenrolam, incluindo dicas para gerenciamento, preparando os jogadores para a dinâmica cíclica e interativa.

Cada rodada representa um ciclo de restauração em Gaia. Os turnos são alternados entre jogadores, divididos em **3 fases principais**: Renda, Ações e Negociação. O jogo prossegue até que um jogador atinja 25 PV.

### Fases do Turno
Aqui, são detalhadas as três fases principais de cada turno, com mecânicas específicas. O conteúdo descreve o que ocorre em cada uma, incluindo cálculos e transições, ajudando a compreender o ritmo do jogo e a importância de cada etapa.

1. **Fase de Renda (💰)**:
   - **O que acontece**: Você recebe recursos automáticos de suas regiões controladas e estruturas.
   - **Cálculo da Renda**:
     - **Por Bioma**: Cada região controlada gera renda baseada no bioma (ex.: Floresta Tropical: 🪵1 Madeira, 💧1.5 Água).
     - **Por Estruturas**: Adicione bônus de estruturas (ex.: Mercado: +1 🪙 Ouro).
     - **Modificadores**: Eventos globais podem alterar multiplicadores (ex.: Seca reduz Água em 50%).
   - **Modal de Renda**: Uma janela pop-up exibe os bônus detalhados. Confirme para prosseguir.
   - **Duração**: Automática, mas você pode revisar os cálculos.

2. **Fase de Ações (⚡)**:
   - **Ações Disponíveis**: Você tem **2 ações por turno** (pode ser modificado por conquistas ou eventos).
   - **Seleção**: Clique em uma região no mapa para selecioná-la (destacada). Em seguida, escolha uma ação no footer.
   - **Custo e Limites**: Cada ação consome recursos e uma "ação restante". Se ações acabarem, avance para a próxima fase.
   - **Ações Detalhadas**: Veja a seção "Ações" abaixo.

3. **Fase de Negociação (🤝)**:
   - **O que acontece**: Opcional, mas essencial para interações. Proponha trocas de recursos ou regiões com outros jogadores.
   - **Limites**: Máximo de 1 negociação por turno (custa 1 🪙 Ouro).
   - **Processo**: Selecione o alvo, ofereça/solicite itens via modal. O alvo responde (aceita/rejeita).
   - **Bônus**: Ambas as partes ganham +1 PV se aceito.

**Avanço de Turno**: Após a Negociação, o turno passa para o próximo jogador. Quando todos jogarem, o turno global avança, possivelmente triggerando um **Evento Aleatório** (a cada 4 turnos).

**Dicas de Jogabilidade**:
- Monitore a sidebar para recursos, regiões controladas e progresso de conquistas.
- Use o zoom/pan no mapa (Ctrl + roda do mouse) para navegar.
- Atalhos: Números 1-4 para ações rápidas.

## Ações Detalhadas

Esta seção aprofunda as mecânicas de cada ação disponível, incluindo custos e efeitos. Seu conteúdo lista e explica cada uma individualmente, com estratégias, facilitando a referência rápida durante o jogo.

Todas as ações requerem uma região selecionada e custam recursos específicos. Elas geram PV e avançam seu império.

1. **Explorar (🗺️)**:
   Esta ação foca na investigação de regiões, com detalhes sobre níveis e bônus. O conteúdo explica os custos, efeitos progressivos e contribuições para conquistas, enfatizando sua importância para expansão inicial.

   - **Custo**: 🪵2 Madeira, 💧1 Água.
   - **Efeito**: Aumenta o nível de exploração de uma região controlada (máx. 3 níveis).
     - Nível 1: +25% renda, +1 recurso aleatório ao recolher.
     - Nível 2: +50% renda, 20% chance de +1 🪙 Ouro, desconto em construções.
     - Nível 3: +100% renda, +1 PV a cada 3 turnos, +0.5 bônus em coletas.
   - **PV Ganho**: +1 PV.
   - **Estratégia**: Ideal para maximizar renda em regiões chave. Contribui para a conquista "Explorador".

2. **Recolher (🌾)**:
   Aqui, é descrita a coleta de recursos imediatos, com exemplos por bioma. O conteúdo cobre custos, efeitos e ligações com conquistas, destacando seu papel em gerenciamento de estoques.

   - **Custo**: 🪵1 Madeira.
   - **Efeito**: Colete recursos imediatos da região (baseados no bioma + nível de exploração).
     - Ex.: Savana: Alto em 🪙 Ouro, baixo em 🪵 Madeira.
   - **PV Ganho**: +1 PV.
   - **Estratégia**: Use para acumular estoques rápidos. Contribui para "Colecionador".

3. **Construir (🏗️)**:
   Esta ação detalha a ereção de estruturas, listando tipos e custos. O conteúdo explica efeitos, limites e bônus de PV, posicionando-a como mecânica de "engine building" para ganhos de longo prazo.

   - **Custo**: Varia por estrutura (ex.: Abrigo: 🪵3, 🪨2, 🪙1).
   - **Efeito**: Erga uma estrutura em uma região controlada (limite de 1 por tipo por região).
     - **Abrigo**: +0.5 🪵 Madeira e 💧 Água na renda; +2 PV.
     - **Torre de Vigia**: +1 PV na renda; aumenta defesa.
     - **Mercado**: +1 🪙 Ouro; reduz custo de negociações.
     - **Laboratório**: +0.5 🪙 Ouro; +15% chance de descobertas raras.
     - **Santuário**: +0.5 PV na renda; +3 PV, bônus em regiões adjacentes.
   - **PV Ganho**: +2 PV (mais bônus da estrutura).
   - **Estratégia**: Foque em engine building. Contribui para "Construtor".

4. **Negociar (🤝)**:
   Esta ação cobre interações diplomáticas, com processo de proposta. O conteúdo descreve custos, bônus mútuos e contribuições para conquistas, enfatizando o aspecto social e estratégico.

   - **Custo**: 🪙1 Ouro.
   - **Efeito**: Proponha trocas (recursos ou regiões). Se aceito, ambos ganham +1 PV.
   - **Estratégia**: Use para equilibrar recursos ou expandir território. Contribui para "Diplomata".

**Regras Gerais de Ações**:
- Ações só podem ser realizadas em regiões controladas (exceto assumir domínio inicial).
- Se sem ações restantes, avance automaticamente.
- Eventos podem bloquear ou bonificar ações.

## Recursos e Biomas

Esta seção explora os elementos econômicos do jogo, divididos em recursos e biomas. Seu conteúdo explica sua aquisição, uso e influência estratégica, ajudando os jogadores a planejarem sua economia.

### Recursos
Aqui, são listados os quatro recursos principais, com usos e fontes. O conteúdo detalha sua importância em ações e construções, orientando sobre gerenciamento para evitar escassez.

- **🪵 Madeira**: Essencial para construções e explorações (abundante em florestas).
- **🪨 Pedra**: Para estruturas duráveis (comum em pântanos).
- **🪙 Ouro**: Moeda para negociações e compras (rico em savanas).
- **💧 Água**: Vital para sustento e crescimento (alto em pântanos e florestas tropicais).

Inicie com quantidades limitadas; gerencie para evitar escassez.

### Biomas
Esta subseção descreve os quatro biomas, com rendas e estratégias associadas. O conteúdo destaca bônus de diversidade e exemplos, promovendo a expansão equilibrada.

Cada região pertence a um bioma, influenciando renda e recursos iniciais:
- **🌴 Floresta Tropical**: Alta em 🪵 Madeira e 💧 Água; ideal para crescimento rápido.
- **🌲 Floresta Temperada**: Balanceada em 🪵 Madeira e 🪨 Pedra; versátil.
- **🏜️ Savana**: Rica em 🪙 Ouro; foco em comércio.
- **🌊 Pântano**: Alta em 💧 Água e 🪨 Pedra; defensiva.

Controlar biomas diversificados ativa bônus (ex.: +3 PV por diversidade).

## Eventos Aleatórios

Esta seção aborda os elementos imprevisíveis do jogo, como triggers e tipos de eventos. Seu conteúdo lista categorias e exemplos, preparando os jogadores para adaptações estratégicas.

A cada 4 turnos, Gaia "desperta" com um evento aleatório dos 15 disponíveis:
- **Positivos**: Ex.: "Primavera" (+50% Madeira para todos).
- **Negativos**: Ex.: "Seca" (-50% Água por 2 turnos).
- **Misturados**: Ex.: "Jazida" (+ Ouro, mas risco de perda).

Eventos duram 1-3 turnos e afetam globalmente. Uma modal avisa no início do turno.

## Conquistas

Aqui, são apresentadas as 8 conquistas, com requisitos e recompensas. O conteúdo explica o rastreamento e dicas, incentivando metas secundárias para vantagens competitivas.

Desbloqueie 8 conquistas para bônus permanentes:
- **Explorador**: Explore 10 regiões (+1 PV por turno).
- **Construtor**: Construa 5 estruturas (-1 custo em construções).
- **Diplomata**: 10 negociações (-1 🪙 em negociações).
- **Colecionador**: Recolha de 8 regiões (+1 recurso em coletas).
- **Diversificador**: Controle 1 de cada bioma (+3 PV).
- **Magnata**: 20 de cada recurso (+10% renda).
- **Vencedor Rápido**: Vença em <15 turnos (multiplicador de vitória).
- **Pacifista**: Vença sem negociações (+5 PV pacíficos).

Progresso é rastreado na sidebar. Desbloqueios dão ícones e recompensas imediatas.

## Fim de Jogo e Vitória

Esta seção finaliza as regras, cobrindo condições de término e variantes. Seu conteúdo explica pontuação, empates e dicas avançadas, encerrando o manual com orientação para múltiplas partidas.

- **Condição de Vitória**: Primeiro a 25 PV vence. Uma modal de vitória aparece!
- **Pontuação Alternativa**: Se empate, compare regiões controladas ou recursos.
- **Variantes**: Para jogos curtos, reduza PV para 15. Para experts, ative mais eventos.

**Dicas Finais para Mestres de Gaia**:
- Balance exploração e construção nos primeiros turnos.
- Negocie com sabedoria – alianças podem virar traições.
- Diversifique biomas para resiliência contra eventos.
- Monitore conquistas para bônus decisivos.

Aventure-se em Gaia Dominium e forje seu legado! Se precisar de ajuda, consulte o manual no jogo ou experimente uma partida teste. Boa sorte, Guardião! 🌍🏆

## Perguntas Frequentes (FAQ)

Esta seção responde a dúvidas comuns dos jogadores, baseada em mecânicas e interface do jogo. Seu conteúdo aborda questões sobre setup, regras, estratégias e problemas técnicos, servindo como recurso rápido para resolver confusões sem reler o manual inteiro.

- **Como inicio uma partida com amigos?**  
  Adicione até 4 jogadores na tela inicial, escolhendo nomes e ícones. O jogo é local (no mesmo navegador), então passe o dispositivo ou use em tela compartilhada. Para multiplayer remoto, considere ferramentas de compartilhamento de tela.

- **O que acontece se eu não tiver recursos suficientes para uma ação?**  
  A interface bloqueará a ação, mostrando uma mensagem de erro. Planeje sua renda e use negociações para adquirir o necessário. Lembre-se: ações custam recursos específicos, mas você pode pular turnos se preso.

- **Como funcionam os eventos aleatórios?**  
  Eles triggeram a cada 4 turnos globais e afetam todos. Uma modal aparece com descrição e duração. Adapte sua estratégia – por exemplo, estoque Água antes de uma Seca.

- **Posso desfazer uma ação ou negociação?**  
  Não, ações são finais uma vez confirmadas. Salve manualmente (via botão no navbar) antes de decisões arriscadas, ou recarregue um save anterior.

- **O jogo suporta mais de 4 jogadores?**  
  Não, limitado a 2-4 para equilíbrio. Para grupos maiores, divida em múltiplas partidas ou use variantes personalizadas.

- **Como vejo o progresso de conquistas?**  
  Na sidebar, há uma seção dedicada mostrando contadores (ex.: regiões exploradas). Desbloqueios ativam bônus automáticos e notificações.

- **O que fazer se o jogo travar ou não salvar?**  
  Limpe o cache do navegador ou verifique o LocalStorage. Se persistir, relate no repositório GitHub. O jogo salva a cada 30 segundos durante a partida.

- **Há modo single-player?**  
  Sim, jogue contra bots implícitos (o jogo simula turnos neutros), mas é otimizado para multiplayer humano.

- **Como resetar uma partida?**  
  Na tela inicial, escolha "Novo Jogo" ao carregar, ou limpe o LocalStorage manualmente no navegador.

- **Qual a diferença entre regiões neutras e controladas?**  
  Neutras não geram renda até exploradas/conquistadas. Controladas dão renda e permitem ações; conquiste via exploração ou negociação.

## Índice de Referências

Esta seção funciona como um glossário, listando termos chave do jogo com definições breves e referências a seções relevantes. Seu conteúdo ajuda na navegação rápida, apontando para explicações detalhadas e facilitando consultas durante o jogo.

- **Ações**: Mecânicas principais do turno, como Explorar ou Construir. - [Ações Detalhadas](#ações-detalhadas)
- **Biomas**: Tipos de regiões (ex.: Floresta Tropical) que afetam renda. - [Biomas](#biomas)
- **Conquistas**: Objetivos secundários com recompensas permanentes. - [Conquistas](#conquistas)
- **Eventos Aleatórios**: Ocorrências globais imprevisíveis. - [Eventos Aleatórios](#eventos-aleatórios)
- **Facções**: Grupos jogáveis (2-4 jogadores) com ícones e cores. - [O Tema de Gaia](#o-tema-de-gaia)
- **Fases do Turno**: Divisões de cada rodada (Renda, Ações, Negociação). - [Fases do Turno](#fases-do-turno)
- **Gaia**: O planeta fragmentado, cenário do jogo. - [O Tema de Gaia](#o-tema-de-gaia)
- **Pontos de Vitória (PV)**: Métrica para vencer (25 para vitória). - [Objetivo do Jogo](#objetivo-do-jogo)
- **Recursos**: Itens gerenciáveis (Madeira, Pedra, Ouro, Água). - [Recursos](#recursos)
- **Regiões**: 25 áreas do mapa (A-Y) para controle. - [Componentes Virtuais](#componentes-virtuais)
- **Salvamento**: Armazenamento automático no navegador. - [Setup (Configuração Inicial)](#setup-configuração-inicial)
- **Sidebar**: Painel lateral para recursos e progresso. - [Componentes Virtuais](#componentes-virtuais)
- **Vitória**: Condições de fim de jogo e variantes. - [Fim de Jogo e Vitória](#fim-de-jogo-e-vitória)
