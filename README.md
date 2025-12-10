1. Introdução

1.1 Visão Geral do Projeto

Gaia Dominium é um jogo de tabuleiro virtual inspirado em mecânicas de board games, onde jogadores competem pela dominação de regiões em um mundo fictício chamado Gaia. O jogo envolve exploração, coleta de recursos, construção de estruturas, negociação entre jogadores e eventos aleatórios. Ele suporta até 4 jogadores, incluindo jogadores humanos e IAs de diferentes dificuldades.
O site é desenvolvido em JavaScript puro (com módulos ES6), HTML e CSS (utilizando Tailwind CSS para estilização). Ele é hospedado no GitHub Pages, tornando-o acessível via navegador web sem necessidade de servidor backend. O jogo utiliza o LocalStorage para persistência de estados, permitindo salvar e carregar jogos.
Objetivo Principal: Proporcionar uma experiência de jogo de tabuleiro online, com suporte a multiplayer local (turnos alternados no mesmo dispositivo) e IAs para simular oponentes.
Versão do Jogo: Baseada nos arquivos fornecidos, o jogo está em uma versão beta ou de desenvolvimento, com foco em mecânicas principais como fases de turno (renda, ações, negociação), IA coordenada e UI modular.

1.2 Escopo

Funcionalidades Principais: Inicialização do jogo, gerenciamento de turnos, ações (explorar, coletar, construir, negociar), eventos aleatórios, conquistas, IA para jogadores não humanos.
Limitações: Não suporta multiplayer online real-time (apenas local); depende de navegador para execução; sem suporte a mobile otimizado (viewport configurado, mas não responsivo completo).
Tecnologias Utilizadas:
HTML5 para estrutura.
CSS com Tailwind para estilização.
JavaScript ES6+ com módulos para lógica.
LocalStorage para persistência.
Sem dependências externas além de Tailwind (via CDN).

2. Arquitetura do Sistema

2.1 Visão Geral

O sistema é modular, com separação clara entre estado, lógica, UI e configurações. Usa import/export ES6 para dependências.

2.2 Diagrama textual de dependências

gaia-dominium/  (raiz do repositório)
├── index.html          (Página principal - deve ficar na raiz para GitHub Pages)
├── style.css           (Estilos principais - pode ficar na raiz ou mover para /css/)
├── /js/                (Todos os scripts JavaScript, divididos em subpastas por módulo)
│   ├── main.js         (Ponto de entrada principal)
│   ├── /logic/         (Lógica do jogo - ações, turnos, negociação, etc.)
│   │   ├── game-logic.js
│   │   ├── logic-actions.js
│   │   ├── logic-negotiation.js
│   │   ├── logic-turn.js
│   │   ├── logic-ai-coordinator.js
│   │   └── game-logic-old.js  (Versão deprecated - considere renomear ou arquivar em /archive/)
│   ├── /ai/            (Módulos relacionados à IA)
│   │   ├── ai-system.js
│   │   ├── ai-manager.js
│   ├── /ui/            (Módulos de interface do usuário)
│   │   ├── ui-manager.js
│   │   ├── ui-modals.js
│   │   └── ui-negotiation.js
│   ├── /state/         (Estado e configurações do jogo)
│   │   ├── game-state.js
│   │   └── game-config.js
│   ├── /utils/         (Utilitários e manuais)
│   │   ├── utils.js
│   │   └── game-manual.js
├── /css/               (Estilos - opcional, se quiser separar do raiz)
│   └── style.css       (Mover da raiz para aqui, se preferir)
├── /assets/            (Recursos estáticos como imagens e vídeos)
│   ├── /images/        (Imagens do jogo)
│   │   ├── gaia-inicio.png  (Background inicial, mencionado no index.html)
│   │   ├── icons/      (Subpasta para ícones de jogadores, estruturas, etc. - e.g., player-icons.png)
│   │   ├── backgrounds/ (Subpasta para fundos - e.g., biomes-floresta.png, savana.png)
│   │   └── ui/         (Subpasta para elementos UI - e.g., buttons.png, modals-bg.png)
│   └── /videos/        (Vídeos, se houver - e.g., tutoriais ou animações)
│       ├── intro.mp4   (Exemplo: vídeo de introdução ao jogo)
│       └── effects/    (Subpasta para vídeos curtos - e.g., event-rain.mp4 para eventos)
└── README.md           (Documentação do repositório - já existente, opcional)

3. Implantação

GitHub Pages: Hospedar repositório; acessar via URL.
Testes: Em navegadores; verificar saves e IA.

Esta documentação é baseada na análise dos arquivos fornecidos em 010/12/2025. Para atualizações, revise o código fonte.
