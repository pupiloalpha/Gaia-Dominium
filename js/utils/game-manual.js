// game-manual.js - Conteúdo do manual do jogo (apenas dados, sem lógica)

const MANUAL_CONTENT = {

// ==================== ABA 1: O JOGO ====================
  'o-jogo': `  
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
        <li><strong>• Recursos:</strong> 🪵 Madeira, 🪨 Pedra, 🪙 Ouro, 💧 Água</li>
        <li><strong>• Biomas:</strong> 🌴 Floresta Tropical, 🌲 Floresta Temperada, 🏜️ Savana, 🌊 Pântano</li>
        <li><strong>• Ações:</strong> Dominar, Explorar, Coletar, Construir, Negociar</li>
        <li><strong>• Eventos Globais:</strong> 15 eventos aleatórios que transformam o jogo</li>
      </ul>
    </div>

    <h4 class="text-base font-semibold text-green-300 mb-2">🏆 Condição de Vitória</h4>
    <div class="bg-green-900/20 border border-green-500/40 rounded-lg p-3">
      <p class="text-sm text-gray-200">
        A primeira facção a atingir <strong class="text-2xl text-yellow-300">25 PV</strong> 
        vence imediatamente e é proclamada <strong class="text-green-300">Guardiã de Gaia</strong>!
      </p>
    </div>
  `,
  
  // ==================== ABA 2: UNIVERSO GAIA ====================
  'gaia': `
    <h3 class="text-xl font-bold text-yellow-300 mb-3">🌍 Universo Gaia</h3>
    
    <div class="relative group mb-5">
      <img src="./assets/images/gaia-mapa.png" alt="Gaia" class="w-full rounded-lg shadow-lg border border-gray-700/50">
      <div class="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black/90 to-transparent rounded-b-lg"></div>
    </div>
    
    <div class="space-y-4">
      <div class="bg-gradient-to-r from-teal-900/30 to-emerald-900/30 border border-teal-500/40 rounded-lg p-4">
        <h4 class="text-base font-bold text-teal-300 mb-2 flex items-center gap-2">
          🌱 A Gênese de Gaia
        </h4>
        <p class="text-sm text-gray-200 leading-relaxed text-justify">
          Gaia é um mundo exuberante, coberto por <strong class="text-green-300">florestas ancestrais</strong> e dotado de uma biodiversidade ímpar, mas é também um planeta de recursos finitos e forças geológicas brutais. 
          Sua topografia varia dramaticamente, das densas Florestas Tropicais às vastas Savanas e Pântanos nebulosos. 
          Essa diversidade gerou os quatro pilares da vida: <span class="text-amber-300">Madeira</span>, <span class="text-gray-300">Pedra</span>, <span class="text-yellow-300">Ouro</span> e <span class="text-blue-300">Água</span>.
        </p>
      </div>

      <div class="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/40 rounded-lg p-4">
        <h4 class="text-base font-bold text-purple-300 mb-2 flex items-center gap-2">
          ⚔️ A Disputa pelo Domínio
        </h4>
        <p class="text-sm text-gray-200 leading-relaxed text-justify">
          A paz é uma lembrança distante. As guerras deram lugar a um conflito estratégico econômico pelo controle de <strong class="text-purple-300">25 regiões táticas</strong>.
          Não se trata apenas de exércitos, mas de construir um <em class="text-white">"motor" de recursos</em> eficiente. 
          A vitória pertence ao estrategista que acumular mais <strong class="text-yellow-300">Pontos de Vitória (PVs)</strong>, provando superioridade na gestão do que Gaia oferece.
        </p>
      </div>
    </div>
  `,
  
  // ==================== ABA 3: AS REGIÕES ====================
  'regioes': `
    <h3 class="text-xl font-bold text-yellow-300 mb-3">Regiões de Gaia</h3>
    
    <p class="text-sm text-gray-200 mb-4">
      Gaia é composta por <strong>25 regiões únicas</strong> (A-Y), cada uma pertencente a um dos quatro biomas principais. Cada uma oferece recursos iniciais e produção por turno.
    </p>

    <h4 class="text-base font-semibold text-green-300 mb-3">Os Quatro Biomas</h4>

    <div class="space-y-3 mb-4">
      <div class="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-500/40 rounded-lg p-3">
        <h5 class="text-sm font-bold text-green-300 mb-2">🌴 Floresta Tropical</h5>
        <p class="text-xs text-gray-200 mb-2">
          Densas e exuberantes, as florestas tropicais são o coração verde de Gaia. Ricas em madeira e com depósitos de ouro escondidos, 
          são ideais para facções que buscam crescimento rápido e diversificação.
        </p>
        <div class="flex gap-2 flex-wrap text-xs">
          <span class="bg-green-800/50 px-2 py-1 rounded">6 🪵 Madeira</span>
          <span class="bg-green-800/50 px-2 py-1 rounded">1 🪨 Pedra</span>
          <span class="bg-green-800/50 px-2 py-1 rounded">3 💧 Água</span>
        </div>
        <p class="text-xs text-teal-300 mt-2">
          <strong>Produção por turno:</strong> +1 🪵 Madeira, +1 💧 Água
        </p>
      </div>

      <div class="bg-gradient-to-r from-teal-900/40 to-cyan-900/40 border border-teal-500/40 rounded-lg p-3">
        <h5 class="text-sm font-bold text-teal-300 mb-2">🌲 Floresta Temperada</h5>
        <p class="text-xs text-gray-200 mb-2">
          Equilibradas e resilientes, as florestas temperadas oferecem produção constante de madeira. 
          São a espinha dorsal econômica para construções e expansões sustentáveis.
        </p>
        <div class="flex gap-2 flex-wrap text-xs">
          <span class="bg-teal-800/50 px-2 py-1 rounded">5 🪵 Madeira</span>
          <span class="bg-teal-800/50 px-2 py-1 rounded">2 🪨 Pedra</span>
          <span class="bg-teal-800/50 px-2 py-1 rounded">2 💧 Água</span>
        </div>
        <p class="text-xs text-teal-300 mt-2">
          <strong>Produção por turno:</strong> +1 🪵 Madeira, +1 💧 Água
        </p>
      </div>

      <div class="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-500/40 rounded-lg p-3">
        <h5 class="text-sm font-bold text-yellow-300 mb-2">🏜️ Savana</h5>
        <p class="text-xs text-gray-200 mb-2">
          Vastas planícies douradas repletas de ouro e água. As savanas são estratégicas para facções que focam em 
          negociações e acumulação de riquezas para ações diplomáticas.
        </p>
        <div class="flex gap-2 flex-wrap text-xs">
          <span class="bg-yellow-800/50 px-2 py-1 rounded">2 🪵 Madeira</span>
          <span class="bg-yellow-800/50 px-2 py-1 rounded">1 🪨 Pedra</span>
          <span class="bg-yellow-800/50 px-2 py-1 rounded">3 🪙 Ouro</span>
          <span class="bg-yellow-800/50 px-2 py-1 rounded">1 💧 Água</span>
        </div>
        <p class="text-xs text-yellow-300 mt-2">
          <strong>Produção por turno:</strong> +1 🪙 Ouro
        </p>
      </div>

      <div class="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/40 rounded-lg p-3">
        <h5 class="text-sm font-bold text-blue-300 mb-2">🌊 Pântano</h5>
        <p class="text-xs text-gray-200 mb-2">
          Misteriosos e ricos em minerais, os pântanos são fontes abundantes de água e pedra. 
          Controlá-los garante acesso aos recursos essenciais para construções avançadas.
        </p>
        <div class="flex gap-2 flex-wrap text-xs">
          <span class="bg-blue-800/50 px-2 py-1 rounded">1 🪵 Madeira</span>
          <span class="bg-blue-800/50 px-2 py-1 rounded">3 🪨 Pedra</span>
          <span class="bg-blue-800/50 px-2 py-1 rounded">4 💧 Água</span>
        </div>
        <p class="text-xs text-blue-300 mt-2">
          <strong>Produção por turno:</strong> +1 🪨 Pedra, +2 💧 Água
        </p>
      </div>
    </div>

    <h4 class="text-base font-semibold text-green-300 mb-3">Os Quatro Recursos</h4>

    <div class="grid grid-cols-2 gap-3">
      <div class="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
        <h5 class="text-sm font-bold text-amber-300 mb-1">🪵 Madeira</h5>
        <p class="text-xs text-gray-300">Recurso mais abundante. Essencial para explorar e construir.</p>
      </div>

      <div class="bg-gray-700/20 border border-gray-500/30 rounded-lg p-3">
        <h5 class="text-sm font-bold text-gray-300 mb-1">🪨 Pedra</h5>
        <p class="text-xs text-gray-300">Material de construção. Crítica para estruturas duradouras.</p>
      </div>

      <div class="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
        <h5 class="text-sm font-bold text-yellow-300 mb-1">🪙 Ouro</h5>
        <p class="text-xs text-gray-300">Recurso diplomático. Usado para negociações e construções avançadas.</p>
      </div>

      <div class="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
        <h5 class="text-sm font-bold text-blue-300 mb-1">💧 Água</h5>
        <p class="text-xs text-gray-300">Fonte de vida. Necessária para exploração e sustentabilidade.</p>
      </div>
    </div>

    <div class="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-3 mt-4">
      <p class="text-xs text-cyan-300">
        <strong>Dica estratégica:</strong> Controlar regiões de biomas variados garante acesso balanceado a todos os recursos. 
        Florestas para madeira, Savanas para ouro, Pântanos para pedra e água.
      </p>
    </div>
  `,
  
  // ==================== ABA 4: AS FACÇÕES ====================
  'faccoes': `
    <h3 class="text-xl font-bold text-yellow-300 mb-3">🎭 As Facções</h3>
    <p class="text-sm text-gray-300 mb-4">Cada facção tem habilidades únicas que definem sua estratégia. Escolha com base no seu estilo de jogo e explore sinergias com biomas e ações.</p>
    
    <div class="space-y-6">
      
      <div class="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/40 rounded-lg p-4 transition hover:bg-green-900/40">
        <img src="./assets/images/faccao-verde.png" alt="Guardiões da Floresta" class="w-full mb-3 rounded border border-green-500/20 shadow-md">
        <div class="border-l-4 border-green-500 pl-3 mb-2">
          <h4 class="text-lg font-bold text-green-300 leading-none">The Sylvan Sentinels</h4>
          <span class="text-xs font-semibold text-green-400 uppercase tracking-wider">Guardiões da Floresta</span>
        </div>
        <p class="text-sm text-gray-200 leading-relaxed text-justify">
          Mestres da natureza, os Guardiões prosperam em florestas, focando em expansão sustentável e produção de madeira. Sua estratégia é de crescimento orgânico, com descontos em exploração e multiplicadores globais para dominar biomas florestais.
        </p>
        <h5 class="text-sm font-bold text-green-300 mt-3 mb-1">Habilidades Especiais</h5>
        <ul class="text-xs text-gray-200 space-y-1 list-disc ml-4">
          <li>Bônus em Florestas: +2 Madeira e +1 Água/Pedra.</li>
          <li>Desconto em Explorar: -1 Madeira.</li>
          <li>Multiplicador Global: +25% na produção de Madeira.</li>
        </ul>
      </div>
      
      <div class="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/40 rounded-lg p-4 transition hover:bg-blue-900/40">
        <img src="./assets/images/faccao-azul.png" alt="Mestres das Águas" class="w-full mb-3 rounded border border-blue-500/20 shadow-md">
        <div class="border-l-4 border-blue-500 pl-3 mb-2">
          <h4 class="text-lg font-bold text-blue-300 leading-none">The Nile Confraternity</h4>
          <span class="text-xs font-semibold text-blue-400 uppercase tracking-wider">Mestres das Águas</span>
        </div>
        <p class="text-sm text-gray-200 leading-relaxed text-justify">
          Especialistas em recursos hídricos, os Mestres das Águas excel em pântanos e negociações. Sua abordagem é diplomática e adaptável, com bônus em exploração e coleta em regiões aquáticas para uma expansão fluida.
        </p>
        <h5 class="text-sm font-bold text-blue-300 mt-3 mb-1">Habilidades Especiais</h5>
        <ul class="text-xs text-gray-200 space-y-1 list-disc ml-4">
          <li>Bônus em Pântanos: +3 Água e +2 Pedra.</li>
          <li>Negociação Grátis: 1 por turno.</li>
          <li>Bônus em Água: +1 ação em exploração e +1 recurso aleatório na coleta.</li>
        </ul>
      </div>
      
      <div class="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/40 rounded-lg p-4 transition hover:bg-red-900/40">
        <img src="./assets/images/faccao-vermelha.png" alt="Construtores da Montanha" class="w-full mb-3 rounded border border-red-500/20 shadow-md">
        <div class="border-l-4 border-red-500 pl-3 mb-2">
          <h4 class="text-lg font-bold text-red-300 leading-none">The Stone Protectorate</h4>
          <span class="text-xs font-semibold text-red-400 uppercase tracking-wider">Construtores da Montanha</span>
        </div>
        <p class="text-sm text-gray-200 leading-relaxed text-justify">
          Focados em mineração e construções robustas, os Construtores dominam savanas com ênfase em defesa e PV de longo prazo. Sua estratégia é construir impérios duráveis, com descontos em pedra e bônus em estruturas.
        </p>
        <h5 class="text-sm font-bold text-red-300 mt-3 mb-1">Habilidades Especiais</h5>
        <ul class="text-xs text-gray-200 space-y-1 list-disc ml-4">
          <li>Bônus em Savanas: +2 Pedra e +2 Ouro.</li>
          <li>Desconto em Construir: -1 Pedra.</li>
          <li>Bônus em Estruturas: +1 PV extra por estrutura.</li>
          <li>Multiplicador Global: +50% na produção de Pedra.</li>
        </ul>
      </div>
      
      <div class="bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-500/40 rounded-lg p-4 transition hover:bg-yellow-900/40">
        <img src="./assets/images/faccao-amarela.png" alt="Barões do Comércio" class="w-full mb-3 rounded border border-yellow-500/20 shadow-md">
        <div class="border-l-4 border-yellow-500 pl-3 mb-2">
          <h4 class="text-lg font-bold text-yellow-300 leading-none">The Golden Syndicate</h4>
          <span class="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Barões do Comércio</span>
        </div>
        <p class="text-sm text-gray-200 leading-relaxed text-justify">
          Mestres do comércio e economia, os Barões acumulam ouro através de negociações e exploração. Sua flexibilidade econômica permite converter riqueza em vantagens, focando em savanas para uma vitória rápida via diplomacia.
        </p>
        <h5 class="text-sm font-bold text-yellow-300 mt-3 mb-1">Habilidades Especiais</h5>
        <ul class="text-xs text-gray-200 space-y-1 list-disc ml-4">
          <li>Bônus em Savanas: +3 Ouro e +1 Água.</li>
          <li>Ouro por Região: +1 Ouro por região controlada.</li>
          <li>Bônus em Negociações: +1 PV por sucesso.</li>
          <li>Desconto em Mercado: 50% de redução.</li>
          <li>Bônus em Exploração: +30% chance de Ouro.</li>
        </ul>
      </div>
    </div>

    <div class="bg-teal-900/20 border border-teal-500/40 rounded-lg p-3 mt-4">
      <h5 class="text-sm font-bold text-teal-300 mb-2">💡 Dicas Estratégicas para Facções</h5>
      <ul class="text-xs text-gray-200 space-y-1">
        <li>• Escolha Verde para expansão precoce em florestas.</li>
        <li>• Azul é ideal para diplomacia e controle de água.</li>
        <li>• Vermelho favorece construções defensivas em savanas.</li>
        <li>• Amarelo acelera vitórias econômicas via ouro e trocas.</li>
      </ul>
    </div>
  `,
  
// ==================== ABA 5: FASES DO JOGO ====================
  'fases': `
    <h3 class="text-xl font-bold text-yellow-300 mb-3">🔄 Fases do Jogo</h3>
    
    <p class="text-sm text-gray-200 mb-4">
      Cada turno em Gaia Dominium é dividido em três fases sequenciais: Renda, Ações e Negociação. 
      Essas fases representam o ciclo de gerenciamento de recursos, expansão e interação com outros jogadores. 
      O jogo avança automaticamente entre fases, garantindo um fluxo dinâmico.
    </p>

    <div class="space-y-4">
      <!-- Fase de Renda -->
      <div class="bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-500/40 rounded-lg p-4">
        <h4 class="text-base font-bold text-yellow-300 mb-2 flex items-center gap-2">
          💰 Fase de Renda
        </h4>
        <p class="text-sm text-gray-200 leading-relaxed text-justify">
          Nesta fase inicial, você recebe recursos automáticos baseados nas regiões que controla, estruturas construídas e eventuais bônus de eventos ou conquistas. 
          É o momento de "acumular os frutos" do seu império, preparando o terreno para as ações subsequentes.
        </p>
        <ul class="text-xs text-gray-300 space-y-1 mt-2 list-disc ml-4">
          <li>Recursos são adicionados diretamente ao seu estoque.</li>
          <li>Eventos globais podem modificar a produção (ex.: multiplicadores ou reduções).</li>
          <li>Duração: Automática, sem ações do jogador.</li>
        </ul>
      </div>

      <!-- Fase de Ações -->
      <div class="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/40 rounded-lg p-4">
        <h4 class="text-base font-bold text-blue-300 mb-2 flex items-center gap-2">
          ⚡ Fase de Ações
        </h4>
        <p class="text-sm text-gray-200 leading-relaxed text-justify">
          A fase principal do turno, onde você executa um número limitado de ações para expandir seu domínio. 
          Escolha sabiamente entre explorar novas regiões, coletar recursos ou construir estruturas, sempre considerando custos e benefícios.
        </p>
        <ul class="text-xs text-gray-300 space-y-1 mt-2 list-disc ml-4">
          <li>Limite: Geralmente 2 ações por turno, consumidas ao realizar tarefas.</li>
          <li>Transição: Avança para a próxima fase quando as ações acabarem ou você optar por encerrar.</li>
          <li>Interação: Selecione regiões no mapa para aplicar ações.</li>
        </ul>
      </div>

      <!-- Fase de Negociação -->
      <div class="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/40 rounded-lg p-4">
        <h4 class="text-base font-bold text-green-300 mb-2 flex items-center gap-2">
          🤝 Fase de Negociação
        </h4>
        <p class="text-sm text-gray-200 leading-relaxed text-justify">
          A fase final, focada em diplomacia. Aqui, você pode propor trocas de recursos ou regiões com outros jogadores (humanos ou IA), 
          fortalecendo alianças ou compensando fraquezas. Negociações custam ouro e devem ser equilibradas.
        </p>
        <ul class="text-xs text-gray-300 space-y-1 mt-2 list-disc ml-4">
          <li>Limite: Uma negociação por turno, pendente de aceitação.</li>
          <li>Resolução: Aceitações executam trocas imediatamente; rejeições podem levar a contraproposições.</li>
          <li>Encerramento: Finaliza o turno após a negociação ou skip.</li>
        </ul>
      </div>
    </div>

    <div class="bg-teal-900/20 border border-teal-500/40 rounded-lg p-3 mt-4">
      <h5 class="text-sm font-bold text-teal-300 mb-2">💡 Dicas para as Fases</h5>
      <ul class="text-xs text-gray-200 space-y-1">
        <li>• Planeje a renda para sustentar ações caras nas fases seguintes.</li>
        <li>• Use ações para expansão precoce e negociação para ajustes finais.</li>
        <li>• Monitore eventos que alteram fases (ex.: bloqueios em negociações).</li>
        <li>• Turnos avançam ciclicamente; foque em eficiência para acumular PV.</li>
      </ul>
    </div>
  `,

  // ==================== ABA 6: AÇÕES ====================
  'acoes': `
    <h3 class="text-xl font-bold text-yellow-300 mb-3">⚡ Ações Disponíveis</h3>
    
    <p class="text-sm text-gray-200 mb-4">
      Cada jogador pode executar até <strong>2 ações únicas por turno</strong>. 
      Escolha estrategicamente baseado no tipo de região (própria, neutra ou inimiga).
    </p>

    <div class="space-y-4">
      <!-- AÇÃO 1: DOMINAR -->
      <div class="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/40 rounded-lg p-4">
        <h4 class="text-base font-bold text-purple-300 mb-2">1️⃣ Dominar 🗺️</h4>
        
        <div class="grid grid-cols-3 gap-2 mb-3 text-xs">
          <div class="bg-purple-800/30 rounded p-2 text-center">
            <p class="font-bold text-purple-300">✅ Neutra</p>
            <p class="text-gray-300">Disponível</p>
          </div>
          <div class="bg-gray-800/30 rounded p-2 text-center">
            <p class="font-bold text-gray-400">❌ Própria</p>
            <p class="text-gray-300">Indisponível</p>
          </div>
          <div class="bg-gray-800/30 rounded p-2 text-center">
            <p class="font-bold text-gray-400">❌ Inimiga</p>
            <p class="text-gray-300">Indisponível</p>
          </div>
        </div>
        
        <p class="text-sm text-gray-200 mb-2">
          Tome controle de uma região neutra gastando <strong>2 PV</strong> e os recursos iniciais da região. 
          Ganhe +1 PV e adicione a região ao seu domínio.
        </p>
        
        <div class="bg-purple-900/20 rounded p-2 text-xs text-purple-200">
          <strong>Dica:</strong> Priorize regiões com biomas que complementem seus recursos atuais.
        </div>
      </div>

      <!-- AÇÃO 2: EXPLORAR -->
      <div class="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/40 rounded-lg p-4">
        <h4 class="text-base font-bold text-blue-300 mb-2">2️⃣ Explorar ⛏️</h4>
        
        <div class="grid grid-cols-3 gap-2 mb-3 text-xs">
          <div class="bg-gray-800/30 rounded p-2 text-center">
            <p class="font-bold text-gray-400">❌ Neutra</p>
            <p class="text-gray-300">Indisponível</p>
          </div>
          <div class="bg-blue-800/30 rounded p-2 text-center">
            <p class="font-bold text-blue-300">✅ Própria</p>
            <p class="text-gray-300">Disponível</p>
          </div>
          <div class="bg-gray-800/30 rounded p-2 text-center">
            <p class="font-bold text-gray-400">❌ Inimiga</p>
            <p class="text-gray-300">Indisponível</p>
          </div>
        </div>
        
        <p class="text-sm text-gray-200 mb-2">
          Aumente o nível de exploração de uma região própria (até nível 3). Ganhe bônus crescentes: 
          recursos extras, +PV e efeitos especiais.
        </p>
        
        <div class="bg-blue-900/20 rounded p-2 text-xs text-blue-200">
          <strong>Dica:</strong> Maximize regiões chave para otimizar sua engine de recursos.
        </div>
      </div>

      <!-- AÇÃO 3: COLETAR -->
      <div class="bg-gradient-to-r from-green-900/30 to-lime-900/30 border border-green-500/40 rounded-lg p-4">
        <h4 class="text-base font-bold text-green-300 mb-2">4️⃣ Coletar 🌾</h4>
        
        <div class="grid grid-cols-3 gap-2 mb-3 text-xs">
          <div class="bg-gray-800/30 rounded p-2 text-center">
            <p class="font-bold text-gray-400">❌ Neutra</p>
            <p class="text-gray-300">Indisponível</p>
          </div>
          <div class="bg-green-800/30 rounded p-2 text-center">
            <p class="font-bold text-green-300">✅ Própria</p>
            <p class="text-gray-300">Disponível</p>
          </div>
          <div class="bg-gray-800/30 rounded p-2 text-center">
            <p class="font-bold text-gray-400">❌ Inimiga</p>
            <p class="text-gray-300">Indisponível</p>
          </div>
        </div>
        
        <p class="text-sm text-gray-200 mb-2">
          Colete 50-75% dos recursos restantes de uma região própria. Ganhe +1 PV e 
          bônus aleatórios baseados no nível de exploração.
        </p>
        
        <div class="bg-green-900/20 rounded p-2 text-xs text-green-200">
          <strong>Dica:</strong> Use após explorar para maximizar ganhos antes da renda.
        </div>
      </div>
      
      <!-- AÇÃO 4: CONSTRUIR -->
      <div class="bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-500/40 rounded-lg p-4">
        <h4 class="text-base font-bold text-orange-300 mb-2">3️⃣ Construir 🏗️</h4>
        
        <div class="grid grid-cols-3 gap-2 mb-3 text-xs">
          <div class="bg-gray-800/30 rounded p-2 text-center">
            <p class="font-bold text-gray-400">❌ Neutra</p>
            <p class="text-gray-300">Indisponível</p>
          </div>
          <div class="bg-orange-800/30 rounded p-2 text-center">
            <p class="font-bold text-orange-300">✅ Própria</p>
            <p class="text-gray-300">Disponível</p>
          </div>
          <div class="bg-gray-800/30 rounded p-2 text-center">
            <p class="font-bold text-gray-400">❌ Inimiga</p>
            <p class="text-gray-300">Indisponível</p>
          </div>
        </div>
        
        <p class="text-sm text-gray-200 mb-2">
          Construa estruturas em regiões próprias para bônus permanentes. Custa recursos variáveis, 
          ganha +PV e efeitos como renda extra.
        </p>
        
        <div class="bg-orange-900/20 rounded p-2 text-xs text-orange-200">
          <strong>Dica:</strong> Escolha estruturas que sinergizem com seu bioma e estratégia.
        </div>
      </div>
    </div>

    <div class="bg-teal-900/20 border border-teal-500/40 rounded-lg p-3 mt-4">
      <h4 class="text-sm font-bold text-teal-300 mb-2">💡 Dicas Gerais para Ações</h4>
      <ul class="text-xs text-gray-200 space-y-1">
        <li>• <strong>Planeje o turno:</strong> Combine ações para otimizar PV e recursos.</li>
        <li>• <strong>Adapte ao evento:</strong> Alguns eventos modificam custos ou bônus.</li>
        <li>• <strong>Monitore rivais:</strong> Expansão agressiva pode bloquear acessos.</li>
        <li>• <strong>Balanceie:</strong> Não esqueça da renda passiva das estruturas.</li>
      </ul>
    </div>
  `,
  
  // ==================== ABA 7: NEGOCIAÇÃO ====================
  'negociacao': `
    <h3 class="text-xl font-bold text-yellow-300 mb-3">🤝 Negociação</h3>
    
    <p class="text-sm text-gray-200 mb-4">
      A negociação é uma ferramenta diplomática poderosa em Gaia Dominium, permitindo trocas de recursos e regiões sem conflito direto. 
      Ela ocorre na fase dedicada "Negociação" (após a fase de Ações), com apenas 1 ação disponível. Custa 1 🪙 Ouro para enviar uma proposta.
    </p>

    <h4 class="text-base font-semibold text-blue-300 mb-3">Fases da Negociação</h4>
    
    <div class="space-y-3 mb-4">
      <div class="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/40 rounded-lg p-3">
        <h5 class="text-sm font-bold text-blue-300 mb-2">1. Preparação da Proposta</h5>
        <p class="text-xs text-gray-200">
          - Selecione um jogador alvo (que tenha pelo menos 1 🪙 Ouro).<br>
          - Defina sua <strong>oferta</strong>: Recursos que você dá (madeira, pedra, ouro, água) e regiões que você controla.<br>
          - Defina sua <strong>solicitação</strong>: Recursos e regiões que você quer receber do alvo.<br>
          - A proposta deve ser válida: Você deve possuir os recursos/regiões oferecidos, e o alvo os solicitados.
        </p>
      </div>
      
      <div class="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/40 rounded-lg p-3">
        <h5 class="text-sm font-bold text-green-300 mb-2">2. Envio da Proposta</h5>
        <p class="text-xs text-gray-200">
          - Confirme e envie (consome 1 🪙 Ouro e sua ação).<br>
          - A proposta fica pendente para o alvo responder no turno dele.<br>
          - Se inválida (ex.: recursos insuficientes), recebe erro e não envia.
        </p>
      </div>
      
      <div class="bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-500/40 rounded-lg p-3">
        <h5 class="text-sm font-bold text-yellow-300 mb-2">3. Resposta do Alvo</h5>
        <p class="text-xs text-gray-200">
          - No turno do alvo, visualize propostas pendentes.<br>
          - Aceite: Troca executada imediatamente; ambos ganham +1 PV.<br>
          - Recuse: Nenhuma mudança.<br>
          - Validação final: Confirma se ambos ainda possuem os itens (ex.: se uma região foi perdida).
        </p>
      </div>
      
      <div class="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/40 rounded-lg p-3">
        <h5 class="text-sm font-bold text-red-300 mb-2">4. Execução da Troca</h5>
        <p class="text-xs text-gray-200">
          - Transfere recursos e atualiza controladores de regiões.<br>
          - Afeta conquistas (ex.: total de negociações para "Diplomata").<br>
          - Notificação para ambos os jogadores.
        </p>
      </div>
    </div>

    <h4 class="text-base font-semibold text-green-300 mb-3">Regras Importantes</h4>
    <ul class="text-xs text-gray-200 space-y-2 mb-4 list-disc ml-4">
      <li><strong>Fase Exclusiva:</strong> Só na fase de Negociação (após Ações).</li>
      <li><strong>Limites:</strong> Máximo 1 proposta por turno; alvo pode responder múltiplas.</li>
      <li><strong>Validação:</strong> IDs numéricos; recursos não excedem possuídos; regiões controladas.</li>
      <li><strong>Efeitos:</strong> +1 PV para cada ao aceitar; contribui para conquistas.</li>
      <li><strong>IA e Jogadores:</strong> IA responde automaticamente baseado em estratégia.</li>
    </ul>

    <div class="bg-teal-900/20 border border-teal-500/40 rounded-lg p-3">
      <h5 class="text-sm font-bold text-teal-300 mb-2">💡 Dicas Estratégicas</h5>
      <ul class="text-xs text-gray-200 space-y-1">
        <li>• Use para equilibrar recursos fracos ou ganhar regiões chave sem custo de PV.</li>
        <li>• Ofereça o que o alvo precisa (ex.: ouro por água) para maior chance de aceitação.</li>
        <li>• Combine com eventos que bonifiquem negociações para +PV extra.</li>
        <li>• Evite em turnos finais se rivais estiverem perto da vitória.</li>
      </ul>
    </div>
  `,
  
  // ==================== ABA 8: ESTRUTURAS ====================
  'estrutura': `
    <h3 class="text-xl font-bold text-yellow-300 mb-3">🏗️ Estruturas</h3>
    
    <p class="text-sm text-gray-200 mb-4">
      Construa estruturas em regiões controladas para ganhar bônus permanentes. 
      Cada estrutura tem custos, efeitos e limites únicos.
    </p>

    <h4 class="text-base font-semibold text-orange-300 mb-3">As Cinco Estruturas</h4>

    <div class="space-y-3 mb-4">
      <div class="bg-gradient-to-r from-orange-900/40 to-red-900/40 border border-orange-500/40 rounded-lg p-3">
        <h5 class="text-sm font-bold text-orange-300 mb-2">Abrigo</h5>
        <p class="text-xs text-gray-200 mb-2">
          Estrutura básica que aumenta a produção de recursos essenciais.
        </p>
        <div class="flex gap-2 flex-wrap text-xs mb-1">
          <span class="bg-orange-800/50 px-2 py-1 rounded">Custo: 3 🪵 2 🪨 1 🪙</span>
        </div>
        <p class="text-xs text-orange-200">
          <strong>Efeito:</strong> +1 🪵 Madeira, +1 💧 Água por turno. +2 PV ao construir.
        </p>
      </div>

      <div class="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/40 rounded-lg p-3">
        <h5 class="text-sm font-bold text-blue-300 mb-2">Torre de Vigia</h5>
        <p class="text-xs text-gray-200 mb-2">
          Aumenta a defesa e concede PV contínuos.
        </p>
        <div class="flex gap-2 flex-wrap text-xs mb-1">
          <span class="bg-blue-800/50 px-2 py-1 rounded">Custo: 2 🪵 3 🪨</span>
        </div>
        <p class="text-xs text-blue-200">
          <strong>Efeito:</strong> +1 PV por turno. Aumenta defesa da região.
        </p>
      </div>

      <div class="bg-gradient-to-r from-yellow-900/40 to-amber-900/40 border border-yellow-500/40 rounded-lg p-3">
        <h5 class="text-sm font-bold text-yellow-300 mb-2">Mercado</h5>
        <p class="text-xs text-gray-200 mb-2">
          Facilita negociações com produção de ouro.
        </p>
        <div class="flex gap-2 flex-wrap text-xs mb-1">
          <span class="bg-yellow-800/50 px-2 py-1 rounded">Custo: 4 🪵 1 🪨 2 💧</span>
        </div>
        <p class="text-xs text-yellow-200">
          <strong>Efeito:</strong> +1 🪙 Ouro por turno.
        </p>
      </div>

      <div class="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/40 rounded-lg p-3">
        <h5 class="text-sm font-bold text-purple-300 mb-2">Laboratório</h5>
        <p class="text-xs text-gray-200 mb-2">
          Avança tecnologia com ouro extra.
        </p>
        <div class="flex gap-2 flex-wrap text-xs mb-1">
          <span class="bg-purple-800/50 px-2 py-1 rounded">Custo: 3 🪨 2 🪙 1 💧</span>
        </div>
        <p class="text-xs text-purple-200">
          <strong>Efeito:</strong> +1 🪙 Ouro por turno.
        </p>
      </div>

      <div class="bg-gradient-to-r from-green-900/40 to-lime-900/40 border border-green-500/40 rounded-lg p-3">
        <h5 class="text-sm font-bold text-green-300 mb-2">Santuário</h5>
        <p class="text-xs text-gray-200 mb-2">
          Gera PV diretos para vitória acelerada.
        </p>
        <div class="flex gap-2 flex-wrap text-xs mb-1">
          <span class="bg-green-800/50 px-2 py-1 rounded">Custo: 3 🪵 2 🪙 2 💧</span>
        </div>
        <p class="text-xs text-green-200">
          <strong>Efeito:</strong> +1 PV por turno.
        </p>
      </div>
    </div>

    <h4 class="text-base font-semibold text-orange-300 mb-3">Regras de Construção</h4>
    <ul class="text-xs text-gray-200 space-y-2 list-disc ml-4 mb-4">
      <li><strong>Fase:</strong> Apenas na fase de Ações.</li>
      <li><strong>Limites:</strong> Uma por tipo por região; máximo global por tipo.</li>
      <li><strong>Custos:</strong> Variam; pague recursos para construir.</li>
      <li><strong>Efeitos:</strong> Permanentes; somam à renda e PV.</li>
      <li><strong>Bônus:</strong> Alguns eventos dão descontos ou PV extra.</li>
    </ul>

    <div class="bg-teal-900/20 border border-teal-500/40 rounded-lg p-3">
      <h5 class="text-sm font-bold text-teal-300 mb-2">💡 Dicas para Construções</h5>
      <ul class="text-xs text-gray-200 space-y-1">
        <li>• Priorize Abrigo em florestas para renda básica.</li>
        <li>• Use Mercado/Laboratório em savanas para ouro diplomático.</li>
        <li>• Construa Santuário em regiões seguras para PV contínuo.</li>
        <li>• Combine com coletar para maximizar retornos.</li>
      </ul>
    </div>
  `,

  // ==================== ABA 9: EVENTOS ====================
'eventos': `
    <h3 class="text-xl font-bold text-yellow-300 mb-3">🎴 Eventos de Gaia</h3>
    
    <div class="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/40 rounded-lg p-4 mb-4">
      <h4 class="text-base font-bold text-purple-300 mb-2">⚡ O Sistema de Eventos</h4>
      <p class="text-sm text-gray-200 leading-relaxed text-justify">
        Gaia é um mundo dinâmico e imprevisível. A cada 4 turnos, um evento global aleatório é ativado, 
        modificando temporariamente as regras do jogo. Eventos podem ser <strong class="text-green-400">positivos</strong>, 
        <strong class="text-red-400">negativos</strong> ou <strong class="text-yellow-400">mistos</strong>, 
        criando oportunidades e desafios únicos para todas as facções.
      </p>
      <div class="mt-3 text-xs text-purple-300">
        <strong>Frequência:</strong> A cada 4 turnos • <strong>Duração:</strong> 1-2 turnos • <strong>Impacto:</strong> Global ou específico
      </div>
    </div>

    <h4 class="text-base font-semibold text-green-300 mb-3">📊 Categorias de Eventos</h4>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
      <div class="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/40 rounded-lg p-3">
        <h5 class="text-sm font-bold text-green-300 mb-2">🌟 Positivos</h5>
        <p class="text-xs text-gray-300 mb-2">
          Eventos que beneficiam todos os jogadores, geralmente aumentando produção ou reduzindo custos.
        </p>
        <div class="text-xs text-green-200 space-y-1">
          <div class="flex items-center gap-1">✅ <span>Primavera Abundante</span></div>
          <div class="flex items-center gap-1">✅ <span>Mercado Aquecido</span></div>
          <div class="flex items-center gap-1">✅ <span>Festival da Colheita</span></div>
        </div>
      </div>

      <div class="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/40 rounded-lg p-3">
        <h5 class="text-sm font-bold text-red-300 mb-2">🌪️ Negativos</h5>
        <p class="text-xs text-gray-300 mb-2">
          Eventos que dificultam o jogo, reduzindo produção ou aumentando custos para todos.
        </p>
        <div class="text-xs text-red-200 space-y-1">
          <div class="flex items-center gap-1">⚠️ <span>Seca</span></div>
          <div class="flex items-center gap-1">⚠️ <span>Tempestade</span></div>
          <div class="flex items-center gap-1">⚠️ <span>Inflação</span></div>
        </div>
      </div>

      <div class="bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-500/40 rounded-lg p-3">
        <h5 class="text-sm font-bold text-yellow-300 mb-2">🔄 Mistos</h5>
        <p class="text-xs text-gray-300 mb-2">
          Eventos com efeitos variados, beneficiando alguns jogadores enquanto prejudicam outros.
        </p>
        <div class="text-xs text-yellow-200 space-y-1">
          <div class="flex items-center gap-1">⚖️ <span>Descoberta de Jazida</span></div>
          <div class="flex items-center gap-1">⚖️ <span>Descoberta Arqueológica</span></div>
          <div class="flex items-center gap-1">⚖️ <span>Boom Tecnológico</span></div>
        </div>
      </div>
    </div>

    <h4 class="text-base font-semibold text-blue-300 mb-3">📜 Catálogo de Eventos</h4>

    <div class="space-y-3 mb-4 max-h-[400px] overflow-y-auto pr-2">
      <!-- Evento 1 -->
      <div class="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-lg p-3">
        <div class="flex items-start gap-3">
          <span class="text-2xl">🌵</span>
          <div class="flex-1">
            <h5 class="text-sm font-bold text-red-300">Seca</h5>
            <p class="text-xs text-gray-300 mb-1">Uma seca severa assola Gaia, reduzindo o abastecimento de água.</p>
            <div class="flex flex-wrap gap-2 mt-2">
              <span class="text-xs px-2 py-1 bg-red-900/30 text-red-300 rounded">Efeito: -50% Água</span>
              <span class="text-xs px-2 py-1 bg-gray-800/50 text-gray-300 rounded">Duração: 2 turnos</span>
              <span class="text-xs px-2 py-1 bg-gray-800/50 text-gray-300 rounded">Tipo: Negativo</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Evento 2 -->
      <div class="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-lg p-3">
        <div class="flex items-start gap-3">
          <span class="text-2xl">⛏️</span>
          <div class="flex-1">
            <h5 class="text-sm font-bold text-yellow-300">Descoberta de Jazida</h5>
            <p class="text-xs text-gray-300 mb-1">Ricas jazidas de ouro são encontradas nas savanas!</p>
            <div class="flex flex-wrap gap-2 mt-2">
              <span class="text-xs px-2 py-1 bg-yellow-900/30 text-yellow-300 rounded">Efeito: +2 Ouro em Savanas</span>
              <span class="text-xs px-2 py-1 bg-gray-800/50 text-gray-300 rounded">Duração: 2 turnos</span>
              <span class="text-xs px-2 py-1 bg-yellow-900/30 text-yellow-300 rounded">Tipo: Misto</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Evento 3 -->
      <div class="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-lg p-3">
        <div class="flex items-start gap-3">
          <span class="text-2xl">🌱</span>
          <div class="flex-1">
            <h5 class="text-sm font-bold text-green-300">Primavera Abundante</h5>
            <p class="text-xs text-gray-300 mb-1">A natureza floresce com vigor renovado!</p>
            <div class="flex flex-wrap gap-2 mt-2">
              <span class="text-xs px-2 py-1 bg-green-900/30 text-green-300 rounded">Efeito: +100% Madeira</span>
              <span class="text-xs px-2 py-1 bg-gray-800/50 text-gray-300 rounded">Duração: 2 turnos</span>
              <span class="text-xs px-2 py-1 bg-green-900/30 text-green-300 rounded">Tipo: Positivo</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Evento 4 -->
      <div class="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-lg p-3">
        <div class="flex items-start gap-3">
          <span class="text-2xl">💰</span>
          <div class="flex-1">
            <h5 class="text-sm font-bold text-green-300">Mercado Aquecido</h5>
            <p class="text-xs text-gray-300 mb-1">A economia está em alta, facilitando negociações.</p>
            <div class="flex flex-wrap gap-2 mt-2">
              <span class="text-xs px-2 py-1 bg-green-900/30 text-green-300 rounded">Efeito: Negociações Gratuitas</span>
              <span class="text-xs px-2 py-1 bg-gray-800/50 text-gray-300 rounded">Duração: 2 turnos</span>
              <span class="text-xs px-2 py-1 bg-green-900/30 text-green-300 rounded">Tipo: Positivo</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Evento 5 -->
      <div class="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-lg p-3">
        <div class="flex items-start gap-3">
          <span class="text-2xl">🏺</span>
          <div class="flex-1">
            <h5 class="text-sm font-bold text-yellow-300">Descoberta Arqueológica</h5>
            <p class="text-xs text-gray-300 mb-1">Artefatos antigos são encontrados!</p>
            <div class="flex flex-wrap gap-2 mt-2">
              <span class="text-xs px-2 py-1 bg-yellow-900/30 text-yellow-300 rounded">Efeito: +3 PV para quem tem mais regiões</span>
              <span class="text-xs px-2 py-1 bg-gray-800/50 text-gray-300 rounded">Duração: Imediato</span>
              <span class="text-xs px-2 py-1 bg-yellow-900/30 text-yellow-300 rounded">Tipo: Misto</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-teal-900/20 border border-teal-500/40 rounded-lg p-3 mt-4">
      <h5 class="text-sm font-bold text-teal-300 mb-2">🎯 Dicas Estratégicas para Eventos</h5>
      <ul class="text-xs text-gray-200 space-y-1">
        <li>• <strong>Planeje com antecedência:</strong> Eventos ocorrem a cada 4 turnos. Prepare-se para possíveis mudanças.</li>
        <li>• <strong>Aproveite eventos positivos:</strong> Em "Mercado Aquecido", negocie mais; em "Primavera Abundante", construa mais.</li>
        <li>• <strong>Mitigue eventos negativos:</strong> Em "Seca", priorize regiões com água; em "Inflação", economize ouro.</li>
        <li>• <strong>Adapte sua estratégia:</strong> Eventos mistos podem virar o jogo. Esteja pronto para mudar de tática.</li>
        <li>• <strong>Observe os biomas:</strong> Alguns eventos afetam biomas específicos. Proteja suas regiões vulneráveis.</li>
      </ul>
    </div>

    <div class="bg-purple-900/20 border border-purple-500/40 rounded-lg p-3 mt-3">
      <h5 class="text-sm font-bold text-purple-300 mb-2">📈 Impacto nos PVs</h5>
      <p class="text-xs text-gray-300">
        Eventos não afetam diretamente os Pontos de Vitória, mas alteram drasticamente a economia do jogo. 
        Um jogador que se adapta melhor aos eventos pode ganhar uma vantagem significativa em recursos, 
        acelerando sua corrida para os 25 PV.
      </p>
    </div>
  `,
  
  // ==================== ABA 10: CONQUISTAS ====================
  'conquistas': `
    <h3 class="text-xl font-bold text-yellow-300 mb-3">🏆 Conquistas</h3>
    
    <p class="text-sm text-gray-200 mb-4">
      Desbloqueie conquistas para bônus permanentes e PV extras. 
      Monitore seu progresso na sidebar.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <!-- Explorador -->
      <div class="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/40 rounded-lg p-4">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-2xl">🗺️</span>
          <div>
            <h5 class="text-sm font-bold text-blue-300">Explorador</h5>
            <p class="text-xs text-gray-300">Explore 10 regiões</p>
          </div>
        </div>
        <div class="text-xs text-blue-200"><strong>Recompensa:</strong> +1 PV por turno</div>
      </div>

      <!-- Construtor -->
      <div class="bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-500/40 rounded-lg p-4">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-2xl">🏗️</span>
          <div>
            <h5 class="text-sm font-bold text-orange-300">Construtor</h5>
            <p class="text-xs text-gray-300">Construa 5 estruturas</p>
          </div>
        </div>
        <div class="text-xs text-orange-200"><strong>Recompensa:</strong> -1 recurso ao construir</div>
      </div>

      <!-- Diplomata -->
      <div class="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/40 rounded-lg p-4">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-2xl">🤝</span>
          <div>
            <h5 class="text-sm font-bold text-green-300">Diplomata</h5>
            <p class="text-xs text-gray-300">Realize 10 negociações</p>
          </div>
        </div>
        <div class="text-xs text-green-200"><strong>Recompensa:</strong> -1 Ouro ao negociar</div>
      </div>

      <!-- Colecionador -->
      <div class="bg-gradient-to-r from-teal-900/30 to-cyan-900/30 border border-teal-500/40 rounded-lg p-4">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-2xl">🌾</span>
          <div>
            <h5 class="text-sm font-bold text-teal-300">Colecionador</h5>
            <p class="text-xs text-gray-300">Colete recursos de 8 regiões diferentes</p>
          </div>
        </div>
        <div class="text-xs text-teal-200"><strong>Recompensa:</strong> +1 recurso ao coletar</div>
      </div>

      <!-- Diversificador -->
      <div class="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/40 rounded-lg p-4">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-2xl">🌍</span>
          <div>
            <h5 class="text-sm font-bold text-purple-300">Diversificador</h5>
            <p class="text-xs text-gray-300">Controle pelo menos 1 região de cada bioma</p>
          </div>
        </div>
        <div class="text-xs text-purple-200"><strong>Recompensa:</strong> +3 PV instantâneos</div>
      </div>

      <!-- Magnata -->
      <div class="bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border border-amber-500/40 rounded-lg p-4">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-2xl">💰</span>
          <div>
            <h5 class="text-sm font-bold text-amber-300">Magnata</h5>
            <p class="text-xs text-gray-300">Acumule 20 de cada recurso simultaneamente</p>
          </div>
        </div>
        <div class="text-xs text-amber-200"><strong>Recompensa:</strong> +10% em todos os recursos</div>
      </div>
    </div>

    <div class="bg-gradient-to-r from-teal-900/30 to-cyan-900/30 border border-teal-500/40 rounded-lg p-4 mt-4">
      <h5 class="text-sm font-bold text-teal-300 mb-2">💡 Dicas para Conquistas</h5>
      <ul class="text-xs text-gray-200 space-y-1">
        <li>• <strong>Foque em uma estratégia:</strong> Se você é agressivo, busque "Explorador". Se prefere construção, "Construtor".</li>
        <li>• <strong>Diversifique:</strong> Controlar diferentes biomas dá acesso a mais recursos e desbloqueia "Diversificador".</li>
        <li>• <strong>Planeje suas ações:</strong> Algumas conquistas requerem múltiplas ações do mesmo tipo em diferentes regiões.</li>
        <li>• <strong>Monitore seu progresso:</strong> A sidebar mostra quanto falta para cada conquista.</li>
      </ul>
    </div>
  `
};

// Função para obter conteúdo de uma aba específica
function getManualContent(tabId) {
  return MANUAL_CONTENT[tabId] || '<p class="text-gray-400">Conteúdo não disponível</p>';
}

// Função para obter todas as abas
function getAllManualContent() {
  return { ...MANUAL_CONTENT };
}

export { MANUAL_CONTENT, getManualContent, getAllManualContent };
