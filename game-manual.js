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
        <li><strong>• Recursos:</strong> 🪵 Madeira, 🪨 Pedra, 💰 Ouro, 💧 Água</li>
        <li><strong>• Biomas:</strong> 🌴 Floresta Tropical, 🌲 Floresta Temperada, 🏜️ Savana, 🌊 Pântano</li>
        <li><strong>• Ações:</strong> Assumir Domínio, Explorar, Construir, Recolher, Negociar</li>
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
  
  // ==================== ABA 2: REGIÕES DE GAIA ====================
  'regioes': `
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
  `,
  
  // ==================== ABA 3: REGRAS DO JOGO ====================
  'regras': `
    <h3 class="text-xl font-bold text-yellow-300 mb-3">⚖️ Regras do Jogo</h3>

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

    <h4 class="text-base font-semibold text-green-300 mb-2">🎴 Eventos Globais (15 tipos)</h4>
  <p class="text-sm text-gray-200 mb-3">
    A cada <strong>4 turnos completos</strong>, um evento global aleatório é disparado, 
    afetando todos os jogadores por <strong>1 a 2 turnos</strong> (ou imediatamente).
  </p>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
    <div class="bg-green-900/20 border border-green-500/30 rounded p-2">
      <p class="text-xs font-bold text-green-300">✅ Positivos (4)</p>
      <ul class="text-xs text-gray-300 space-y-1 mt-1">
        <li>• 🌺 Primavera Abundante: +100% Madeira</li>
        <li>• 📈 Mercado Aquecido: Negociar 0 Ouro</li>
        <li>• 🎉 Festival Cultural: +1 PV todos</li>
        <li>• 🧭 Era da Exploração: Explorar -1 Madeira</li>
      </ul>
    </div>
    <div class="bg-red-900/20 border border-red-500/30 rounded p-2">
      <p class="text-xs font-bold text-red-300">❌ Negativos (5)</p>
      <ul class="text-xs text-gray-300 space-y-1 mt-1">
        <li>• 🌵 Seca: -50% Água</li>
        <li>• ⛈️ Tempestade: -25% todos recursos</li>
        <li>• 💰 Inflação: Construir +1 custo</li>
        <li>• ❄️ Inverno Rigoroso: -30% Madeira/Água</li>
        <li>• 🆘 Escassez: Recolher -25%</li>
      </ul>
    </div>
    <div class="bg-purple-900/20 border border-purple-500/30 rounded p-2">
      <p class="text-xs font-bold text-purple-300">⚡ Mistos (6)</p>
      <ul class="text-xs text-gray-300 space-y-1 mt-1">
        <li>• 💎 Descoberta de Jazida: +2 Pedra, -1 PV</li>
        <li>• ⚙️ Boom Tecnológico: Construir +1 PV, +1 Ouro</li>
        <li>• 🌪️ Tempestade de Areia: +50% Pedra, -50% Madeira</li>
        <li>• 🌊 Enchente: +100% Água, -50% Madeira</li>
        <li>• 🕊️ Paz Diplomática: Negociar +2 PV</li>
        <li>• 📉 Depressão Econômica: -1 todos recursos</li>
      </ul>
    </div>
  </div>

    <h4 class="text-base font-semibold text-green-300 mb-2">🏆 Condições de Vitória</h4>
    <div class="bg-green-900/20 border border-green-500/40 rounded-lg p-3 mb-3">
      <p class="text-sm text-gray-200">
        <strong>Primeira facção a atingir 25 PV vence imediatamente!</strong>
      </p>
    </div>

    <h4 class="text-base font-semibold text-orange-300 mb-2">⚠️ Penalidades</h4>
    <div class="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
      <p class="text-xs text-gray-200">
        Se um jogador passar <strong>3 turnos consecutivos sem realizar ações</strong>, 
        sua <strong>renda base por biomas é suspensa</strong> no próximo turno (estruturas continuam produzindo).
      </p>
    </div>
  `,
  
  // ==================== ABA 4: AÇÕES ====================
  'acoes': `
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
  `,
  
  // ==================== ABA 5: ESTRUTURAS ====================
  'estrutura': `
  <h3 class="text-xl font-bold text-yellow-300 mb-3">🏗️ Sistema de Estruturas</h3>

  <p class="text-sm text-gray-200 mb-4">
    Gaia Dominium agora possui <strong>5 tipos de estruturas</strong> que você pode construir em regiões controladas. 
    Cada estrutura tem custos, benefícios e efeitos únicos que podem alterar drasticamente sua estratégia.
  </p>

  <h4 class="text-base font-semibold text-green-300 mb-3">🏠 Tipos de Estruturas</h4>

  <div class="space-y-4">
    <!-- Abrigo -->
    <div class="bg-gradient-to-r from-orange-900/30 to-amber-900/30 border border-orange-500/40 rounded-xl p-4">
      <div class="flex items-start gap-3 mb-3">
        <span class="text-3xl">🛖</span>
        <div class="flex-1">
          <h5 class="text-lg font-bold text-orange-300">Abrigo</h5>
          <p class="text-sm text-gray-300">Estrutura básica para sustentar sua população.</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <p class="font-semibold text-orange-300 mb-1">Custo de Construção:</p>
          <div class="flex gap-2">
            <span class="px-2 py-1 bg-gray-800/50 rounded">3🪵</span>
            <span class="px-2 py-1 bg-gray-800/50 rounded">2🪨</span>
            <span class="px-2 py-1 bg-gray-800/50 rounded">1💰</span>
          </div>
          <p class="text-xs text-yellow-300 mt-1">(Desconto: -1🪨 em regiões nível 2+)</p>
        </div>
        <div>
          <p class="font-semibold text-green-300 mb-1">Benefícios:</p>
          <ul class="text-xs text-gray-300 space-y-1">
            <li>• +2 PV imediato</li>
            <li>• +0.5🪵 por turno</li>
            <li>• +0.5💧 por turno</li>
            <li>• Base para expansão</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Torre de Vigia -->
    <div class="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/40 rounded-xl p-4">
      <div class="flex items-start gap-3 mb-3">
        <span class="text-3xl">🏯</span>
        <div class="flex-1">
          <h5 class="text-lg font-bold text-blue-300">Torre de Vigia</h5>
          <p class="text-sm text-gray-300">Defesa estratégica e vigilância territorial.</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <p class="font-semibold text-blue-300 mb-1">Custo de Construção:</p>
          <div class="flex gap-2">
            <span class="px-2 py-1 bg-gray-800/50 rounded">2🪵</span>
            <span class="px-2 py-1 bg-gray-800/50 rounded">3🪨</span>
          </div>
        </div>
        <div>
          <p class="font-semibold text-green-300 mb-1">Benefícios:</p>
          <ul class="text-xs text-gray-300 space-y-1">
            <li>• +1 PV imediato</li>
            <li>• +1 PV por turno</li>
            <li>• Aumenta defesa da região</li>
            <li>• Fornece visão estratégica</li>
            <li>• Dificulta negociações hostis inimigas</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Mercado -->
    <div class="bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-500/40 rounded-xl p-4">
      <div class="flex items-start gap-3 mb-3">
        <span class="text-3xl">🏪</span>
        <div class="flex-1">
          <h5 class="text-lg font-bold text-yellow-300">Mercado</h5>
          <p class="text-sm text-gray-300">Centro econômico para comércio e negociações.</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <p class="font-semibold text-yellow-300 mb-1">Custo de Construção:</p>
          <div class="flex gap-2">
            <span class="px-2 py-1 bg-gray-800/50 rounded">4🪵</span>
            <span class="px-2 py-1 bg-gray-800/50 rounded">1🪨</span>
            <span class="px-2 py-1 bg-gray-800/50 rounded">2💧</span>
          </div>
        </div>
        <div>
          <p class="font-semibold text-green-300 mb-1">Benefícios:</p>
          <ul class="text-xs text-gray-300 space-y-1">
            <li>• +1 PV imediato</li>
            <li>• +1💰 por turno</li>
            <li>• Reduz custo de negociação em 1 Ouro</li>
            <li>• Aumenta eficiência de trocas</li>
            <li>• Atrai eventos comerciais positivos</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Laboratório -->
    <div class="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/40 rounded-xl p-4">
      <div class="flex items-start gap-3 mb-3">
        <span class="text-3xl">🔬</span>
        <div class="flex-1">
          <h5 class="text-lg font-bold text-purple-300">Laboratório</h5>
          <p class="text-sm text-gray-300">Centro de pesquisa para avanços tecnológicos.</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <p class="font-semibold text-purple-300 mb-1">Custo de Construção:</p>
          <div class="flex gap-2">
            <span class="px-2 py-1 bg-gray-800/50 rounded">3🪨</span>
            <span class="px-2 py-1 bg-gray-800/50 rounded">2💰</span>
            <span class="px-2 py-1 bg-gray-800/50 rounded">1💧</span>
          </div>
        </div>
        <div>
          <p class="font-semibold text-green-300 mb-1">Benefícios:</p>
          <ul class="text-xs text-gray-300 space-y-1">
            <li>• +1 PV imediato</li>
            <li>• +0.5💰 por turno</li>
            <li>• +15% chance de descoberta rara ao explorar</li>
            <li>• Aumenta eficiência de construções futuras</li>
            <li>• Desbloqueia tecnologias avançadas</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Santuário -->
    <div class="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/40 rounded-xl p-4">
      <div class="flex items-start gap-3 mb-3">
        <span class="text-3xl">🛐</span>
        <div class="flex-1">
          <h5 class="text-lg font-bold text-green-300">Santuário</h5>
          <p class="text-sm text-gray-300">Local sagrado para espiritualidade e lealdade.</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <p class="font-semibold text-green-300 mb-1">Custo de Construção:</p>
          <div class="flex gap-2">
            <span class="px-2 py-1 bg-gray-800/50 rounded">3🪵</span>
            <span class="px-2 py-1 bg-gray-800/50 rounded">2💰</span>
            <span class="px-2 py-1 bg-gray-800/50 rounded">2💧</span>
          </div>
        </div>
        <div>
          <p class="font-semibold text-green-300 mb-1">Benefícios:</p>
          <ul class="text-xs text-gray-300 space-y-1">
            <li>• +3 PV imediato</li>
            <li>• +0.5 PV por turno</li>
            <li>• Aumenta lealdade das regiões adjacentes</li>
            <li>• Reduz chance de rebelião</li>
            <li>• Atrai eventos espirituais positivos</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <h4 class="text-base font-semibold text-green-300 mb-3 mt-6">🎯 Estratégias por Tipo de Estrutura</h4>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
    <div class="bg-gray-800/30 border border-gray-600/30 rounded-lg p-3">
      <h5 class="text-sm font-bold text-orange-300 mb-2">🛖 Abrigo (Básico)</h5>
      <p class="text-xs text-gray-300">Construa em todas as regiões para garantir produção constante de recursos básicos.</p>
      <p class="text-xs text-green-300 mt-2"><strong>Melhor para:</strong> Jogadores iniciantes, expansão rápida</p>
    </div>

    <div class="bg-gray-800/30 border border-gray-600/30 rounded-lg p-3">
      <h5 class="text-sm font-bold text-blue-300 mb-2">🏯 Torre de Vigia (Defensivo)</h5>
      <p class="text-xs text-gray-300">Construa em regiões fronteiriças para proteger seu território e ganhar PV constante.</p>
      <p class="text-xs text-green-300 mt-2"><strong>Melhor para:</strong> Jogadores defensivos, controle territorial</p>
    </div>

    <div class="bg-gray-800/30 border border-gray-600/30 rounded-lg p-3">
      <h5 class="text-sm font-bold text-yellow-300 mb-2">🏪 Mercado (Econômico)</h5>
      <p class="text-xs text-gray-300">Construa em regiões centrais para maximizar ouro e melhorar negociações.</p>
      <p class="text-xs text-green-300 mt-2"><strong>Melhor para:</strong> Diplomacia, jogadores econômicos</p>
    </div>

    <div class="bg-gray-800/30 border border-gray-600/30 rounded-lg p-3">
      <h5 class="text-sm font-bold text-purple-300 mb-2">🔬 Laboratório (Tecnológico)</h5>
      <p class="text-xs text-gray-300">Construa em regiões com alto nível de exploração para maximizar descobertas.</p>
      <p class="text-xs text-green-300 mt-2"><strong>Melhor para:</strong> Jogadores agressivos, exploração</p>
    </div>
  </div>

  <div class="bg-gradient-to-r from-teal-900/30 to-cyan-900/30 border border-teal-500/40 rounded-xl p-4">
    <h5 class="text-sm font-bold text-teal-300 mb-2">💡 Dicas Avançadas de Construção</h5>
    <ul class="text-xs text-gray-200 space-y-2">
      <li><strong>• Combinações Sinérgicas:</strong> Mercado + Laboratório = produção massiva de ouro. Torre de Vigia + Santuário = defesa inexpugnável.</li>
      <li><strong>• Timing:</strong> Construa Abrigos primeiro para estabilidade, depois estruturas especializadas.</li>
      <li><strong>• Localização:</strong> Construa Mercados em Savanas (ouro natural) e Laboratórios em Pântanos (pedra natural).</li>
      <li><strong>• Limitações:</strong> Cada região pode ter apenas uma de cada tipo de estrutura. Planeje com sabedoria!</li>
      <li><strong>• Eventos:</strong> Alguns eventos globais afetam estruturas específicas (ex: "Boom Tecnológico" beneficia Laboratórios).</li>
    </ul>
  </div>

  <div class="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mt-4">
    <p class="text-xs text-yellow-300">
      <strong>⚠️ Nota:</strong> Para construir, selecione uma região controlada, clique em "Construir" no rodapé e escolha a estrutura desejada no modal.
    </p>
  </div>
`,
  
  // ==================== ABA 6: CONQUISTAS ====================
'conquistas': `
  <h3 class="text-xl font-bold text-yellow-300 mb-3">🏆 Sistema de Conquistas</h3>
  
  <p class="text-sm text-gray-200 mb-4">
    Ao longo do jogo, você pode desbloquear conquistas que recompensam suas ações estratégicas. 
    Cada conquista traz benefícios especiais e um título exclusivo.
  </p>

  <h4 class="text-base font-semibold text-green-300 mb-3">🎯 Conquistas Disponíveis</h4>

  <div class="space-y-4">
    <!-- Explorador -->
    <div class="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/40 rounded-lg p-4">
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
    <div class="bg-gradient-to-r from-orange-900/30 to-amber-900/30 border border-orange-500/40 rounded-lg p-4">
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
    <div class="bg-gradient-to-r from-yellow-900/30 to-yellow-800/30 border border-yellow-500/40 rounded-lg p-4">
      <div class="flex items-center gap-3 mb-2">
        <span class="text-2xl">🌾</span>
        <div>
          <h5 class="text-sm font-bold text-yellow-300">Colecionador</h5>
          <p class="text-xs text-gray-300">Recolha recursos de 8 regiões diferentes</p>
        </div>
      </div>
      <div class="text-xs text-yellow-200"><strong>Recompensa:</strong> +1 recurso ao recolher</div>
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
