// ui-dispute.js - Interface para Disputas Territoriais (REFATORADO COM CORREÇÕES)
import { gameState, getCurrentPlayer, getPlayerById } from '../state/game-state.js';
import { RESOURCE_ICONS } from '../state/game-config.js';
import { getIcon } from './icons.js';

export class DisputeUI {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.cacheElements();
    this.currentDisputeData = null;
    
    // Expor métodos globalmente para acesso direto
    this._exposeToGlobal();
  }

  // Expor métodos para acesso global
  _exposeToGlobal() {
    if (typeof window !== 'undefined') {
      window.openDisputeModal = this.openDisputeModal.bind(this);
      window.disputeUI = this;
    }
  }

  cacheElements() {
    // Modal de confirmação de disputa
    this.disputeModal = document.getElementById('disputeModal');
    if (!this.disputeModal) {
      this.createDisputeModal();
    }

    // Modal de resultado de disputa
    this.disputeResultModal = document.getElementById('disputeResultModal');
    if (!this.disputeResultModal) {
      this.createDisputeResultModal();
    }
  }

  createDisputeModal() {
    // Criar o modal de confirmação de disputa
    const modal = document.createElement('div');
    modal.id = 'disputeModal';
    modal.className = 'hidden fixed inset-0 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <!-- Overlay de fundo -->
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
      
      <!-- Container do modal -->
      <div class="relative z-50 w-full max-w-2xl bg-gray-900 border-2 border-red-600/30 rounded-2xl shadow-2xl overflow-hidden">
        <!-- Cabeçalho -->
        <div class="bg-gradient-to-r from-red-900/40 to-gray-900 p-6 border-b border-red-500/20">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-2xl font-bold text-red-300 flex items-center gap-3">
                <span class="inline-flex items-center text-red-400">${getIcon('disputar', { size: 28 })}</span>
                <span>Disputa Territorial</span>
              </h2>
              <p id="disputeRegionName" class="text-gray-300 text-sm mt-2"></p>
            </div>
            <button id="disputeModalClose" 
                    class="text-gray-400 hover:text-white text-2xl hover:bg-red-700/20 w-10 h-10 rounded-full flex items-center justify-center transition">
              ✖
            </button>
          </div>
        </div>
        
        <!-- Conteúdo -->
        <div class="p-6">
          <div id="disputeModalContent" class="space-y-6">
            <!-- Conteúdo dinâmico será inserido aqui -->
          </div>

          <!-- Rodapé com botões -->
          <div class="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-700/50">
            <button id="disputeCancelBtn" 
                    class="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition duration-200 transform hover:scale-105 active:scale-95">
              Cancelar
            </button>
            <button id="disputeConfirmBtn" 
                    class="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg text-white font-semibold transition duration-200 transform hover:scale-105 active:scale-95 shadow-lg shadow-red-600/30 flex items-center gap-2">
              ${getIcon('disputar', { size: 18 })} Iniciar Disputa
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    this.disputeModal = modal;

    // Event listeners
    document.getElementById('disputeModalClose').addEventListener('click', () => this.closeDisputeModal());
    document.getElementById('disputeCancelBtn').addEventListener('click', () => this.closeDisputeModal());
    document.getElementById('disputeConfirmBtn').addEventListener('click', () => this.confirmDispute());
  }

  createDisputeResultModal() {
    // Criar o modal de resultado de disputa
    const modal = document.createElement('div');
    modal.id = 'disputeResultModal';
    modal.className = 'hidden fixed inset-0 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <!-- Overlay de fundo -->
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
      
      <!-- Container do modal -->
      <div id="disputeResultContainer" class="relative z-50 w-full max-w-2xl bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        <!-- Cabeçalho -->
        <div id="disputeResultHeader" class="p-6 border-b">
          <div class="flex justify-between items-center">
            <h2 id="disputeResultTitle" class="text-2xl font-bold"></h2>
            <button id="disputeResultClose" 
                    class="text-gray-400 hover:text-white text-2xl hover:bg-gray-700/20 w-10 h-10 rounded-full flex items-center justify-center transition">
              ✖
            </button>
          </div>
        </div>
        
        <!-- Conteúdo -->
        <div class="p-6">
          <div id="disputeResultContent" class="space-y-6">
            <!-- Conteúdo dinâmico será inserido aqui -->
          </div>

          <!-- Rodapé -->
          <div class="flex justify-end mt-8 pt-6 border-t border-gray-700/50">
            <button id="disputeResultOkBtn" 
                    class="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition duration-200 transform hover:scale-105 active:scale-95">
              Continuar
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    this.disputeResultModal = modal;

    // Event listeners
    document.getElementById('disputeResultClose').addEventListener('click', () => this.closeDisputeResultModal());
    document.getElementById('disputeResultOkBtn').addEventListener('click', () => this.closeDisputeResultModal());
  }

  // Método para abrir modal de disputa (com dados pré-calculados opcionais)
  openDisputeModal(regionId, preCalculatedData = null) {
    console.log('📋 Abrindo modal de disputa para região:', regionId);
    
    const region = gameState.regions[regionId];
    const defender = getPlayerById(region.controller);
    const attacker = getCurrentPlayer();

    if (!region || !defender || !attacker) {
      console.error('❌ Dados de disputa inválidos:', { region, defender, attacker });
      this.uiManager.modals.showFeedback('Dados de disputa inválidos.', 'error');
      return;
    }

    // Calcular ou usar dados pré-calculados
    let disputeData;
    if (preCalculatedData) {
      disputeData = preCalculatedData;
      console.log('📋 Usando dados pré-calculados');
    } else {
      try {
        // Tentar obter dados do disputeLogic
        const gameLogic = window.gameLogic;
        if (gameLogic && gameLogic.disputeLogic) {
          disputeData = gameLogic.disputeLogic.getDisputeData(regionId, attacker.id);
        } else {
          // Fallback: cálculo direto
          console.warn('⚠️ disputeLogic não disponível, usando cálculo direto');
          disputeData = this._calculateDisputeDataDirectly(region, attacker, defender);
        }
      } catch (error) {
        console.warn('⚠️ Erro ao calcular custos de disputa:', error);
        disputeData = this._getDefaultDisputeData(region, attacker, defender);
      }
    }

    if (!disputeData) {
      console.error('❌ Não foi possível obter dados da disputa');
      this.uiManager.modals.showFeedback('Erro ao calcular custos da disputa.', 'error');
      return;
    }

    document.getElementById('disputeRegionName').textContent = 
      `Região: ${region.name} (${region.biome}) • Controlada por: ${defender.name}`;

    const content = document.getElementById('disputeModalContent');
    content.innerHTML = `
      <div class="space-y-6">
        <!-- Seção: Custos -->
        <div class="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
          <h3 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span class="inline-flex items-center text-yellow-400">${getIcon('ouro', { size: 18 })}</span>
            <span>Custos da Disputa</span>
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div class="bg-gray-900/50 p-3 rounded-lg">
              <div class="text-gray-400 text-sm">Pontos de Vitória</div>
              <div class="text-yellow-400 font-bold text-xl flex items-center gap-1">${disputeData.finalCost.pv} ${getIcon('star', { size: 16 })}</div>
            </div>
            <div class="bg-gray-900/50 p-3 rounded-lg">
              <div class="text-gray-400 text-sm">Madeira</div>
              <div class="text-green-400 font-bold text-xl flex items-center gap-1">${disputeData.finalCost.madeira} ${RESOURCE_ICONS.madeira}</div>
            </div>
            <div class="bg-gray-900/50 p-3 rounded-lg">
              <div class="text-gray-400 text-sm">Pedra</div>
              <div class="text-gray-300 font-bold text-xl flex items-center gap-1">${disputeData.finalCost.pedra} ${RESOURCE_ICONS.pedra}</div>
            </div>
            <div class="bg-gray-900/50 p-3 rounded-lg">
              <div class="text-gray-400 text-sm">Ouro</div>
              <div class="text-yellow-300 font-bold text-xl flex items-center gap-1">${disputeData.finalCost.ouro} ${RESOURCE_ICONS.ouro}</div>
            </div>
            ${disputeData.finalCost.agua > 0 ? `
            <div class="bg-gray-900/50 p-3 rounded-lg">
              <div class="text-gray-400 text-sm">Água</div>
              <div class="text-blue-400 font-bold text-xl flex items-center gap-1">${disputeData.finalCost.agua} ${RESOURCE_ICONS.agua}</div>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Seção: Chance de Sucesso -->
        <div class="bg-blue-900/20 p-5 rounded-xl border border-blue-700/30">
          <h3 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span class="inline-flex items-center text-blue-400">${getIcon('explorar', { size: 18 })}</span>
            <span>Chance de Sucesso</span>
          </h3>
          <div class="space-y-4">
            <div class="flex items-center gap-4">
              <div class="w-full bg-gray-800 rounded-full h-6 overflow-hidden">
                <div id="disputeChanceBar" 
                     class="h-6 rounded-full transition-all duration-1000 ease-out ${disputeData.successChance >= 70 ? 'bg-green-500' : disputeData.successChance >= 40 ? 'bg-yellow-500' : 'bg-red-500'}" 
                     style="width: ${disputeData.successChance}%">
                </div>
              </div>
              <span id="disputeChanceText" class="text-2xl font-bold text-white min-w-[80px]">
                ${Math.round(disputeData.successChance)}%
              </span>
            </div>
            <div class="text-sm ${disputeData.successChance >= 70 ? 'text-green-300' : disputeData.successChance >= 40 ? 'text-yellow-300' : 'text-red-300'} font-medium">
              ${disputeData.successChance >= 70 ? 'Alta chance de sucesso!' : 
                disputeData.successChance >= 40 ? 'Chance moderada.' : 
                'Baixa chance. Considere fortalecer-se primeiro.'}
            </div>
          </div>
        </div>

        <!-- Seção: Riscos -->
        <div class="bg-red-900/10 p-5 rounded-xl border border-red-700/20">
          <h3 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span class="inline-flex items-center text-red-400">${getIcon('alerta', { size: 18 })}</span>
            <span>Riscos da Disputa</span>
          </h3>
          <ul class="space-y-2 text-gray-300">
            <li class="flex items-start gap-2">
              <span class="text-red-400">•</span>
              <span>Em caso de falha, você perde <strong>todos os recursos</strong> gastos.</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-red-400">•</span>
              <span>O defensor <strong>ganha 1 PV</strong> por defender com sucesso.</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-red-400">•</span>
              <span>A região pode sofrer danos (<strong>nível de exploração reduzido</strong>).</span>
            </li>
          </ul>
        </div>

        <!-- Seção: Status do Atacante -->
        <div class="bg-gray-800/30 p-4 rounded-lg">
          <div class="text-sm text-gray-400 mb-2">Seu status atual:</div>
          <div class="flex flex-wrap gap-3">
            <div class="text-xs px-3 py-1 bg-gray-700/50 rounded-full">
              PV: <span class="text-yellow-400 font-bold">${attacker.victoryPoints}</span>
            </div>
            ${Object.entries(attacker.resources || {}).filter(([key, value]) => value > 0).map(([key, value]) => `
              <div class="text-xs px-3 py-1 bg-gray-700/50 rounded-full">
                ${RESOURCE_ICONS[key]} <span class="font-bold">${value}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Armazenar dados da disputa
    this.currentDisputeData = {
      regionId,
      region,
      attacker,
      defender,
      disputeData
    };

    const confirmBtn = document.getElementById('disputeConfirmBtn');
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      confirmBtn.title = `Iniciar disputa por ${region.name}`;
    }
    
    // Mostrar modal com animação
    this.disputeModal.classList.remove('hidden');
    this.uiManager.setModalMode(true);
    
    // Animar barra de progresso
    setTimeout(() => {
      const chanceBar = document.getElementById('disputeChanceBar');
      if (chanceBar) {
        chanceBar.style.transition = 'width 1.5s ease-out';
      }
    }, 100);
  }

  // Métodos auxiliares para cálculo de dados
  _calculateDisputeDataDirectly(region, attacker, defender) {
    // Cálculo simplificado para fallback
    const baseCost = {
      pv: 3,
      madeira: 2,
      pedra: 2,
      ouro: 3,
      agua: 1
    };
    
    const pvDiff = attacker.victoryPoints - defender.victoryPoints;
    let chance = 50;
    
    if (pvDiff > 0) chance += Math.min(20, pvDiff * 2);
    if (pvDiff < 0) chance += Math.max(-30, pvDiff * 1.5);
    
    return {
      finalCost: baseCost,
      successChance: Math.max(10, Math.min(90, chance))
    };
  }
  
  _getDefaultDisputeData(region, attacker, defender) {
    return {
      finalCost: {
        pv: 3,
        madeira: 2,
        pedra: 2,
        ouro: 3,
        agua: 1
      },
      successChance: 50
    };
  }

  // Fechar modais
  closeDisputeModal() {
    this.disputeModal.classList.add('hidden');
    this.uiManager.setModalMode(false);
    this.currentDisputeData = null;
  }

  closeDisputeResultModal() {
    this.disputeResultModal.classList.add('hidden');
    this.uiManager.setModalMode(false);
  }

  // Confirmar disputa - MÉTODO REFATORADO
  async confirmDispute() {
    if (!this.currentDisputeData) {
      console.error('❌ Nenhum dado de disputa disponível');
      this.uiManager.modals.showFeedback('Dados da disputa não encontrados.', 'error');
      return;
    }

    const { region, attacker, defender } = this.currentDisputeData;
    
    console.log('✅ Confirmando disputa:', {
      region: region.name,
      attacker: attacker.name,
      defender: defender.name
    });
    
    // Fechar modal de confirmação
    this.closeDisputeModal();
    
    // Pequeno delay para UI
    setTimeout(async () => {
      try {
        // Executar a disputa através da fachada
        const gameLogic = window.gameLogic;
        
        if (!gameLogic) {
          throw new Error('GameLogic não disponível');
        }
        
        if (typeof gameLogic.handleDispute !== 'function') {
          throw new Error('Método handleDispute não disponível');
        }
        
        console.log('🎮 Chamando GameLogic.handleDispute...');
        
        // Passar skipValidation como true pois já validamos no modal
        const success = await gameLogic.handleDispute(region, attacker, true);
        
        // Mostrar resultado
        if (success !== undefined && success !== null) {
          console.log('🎮 Disputa executada com sucesso, mostrando resultado...');
          this.showDisputeResult(success, region, attacker, defender);
        } else {
          console.warn('⚠️ Disputa retornou resultado indefinido');
        }
      } catch (error) {
        console.error('❌ Erro ao executar disputa:', error);
        
        // Mensagem de erro específica
        let errorMessage = 'Erro ao processar disputa.';
        if (error.message) {
          errorMessage = error.message;
        } else if (error.includes) {
          errorMessage = error;
        }
        
        this.uiManager.modals.showFeedback(errorMessage, 'error');
        
        // Tentar recriar o modal com dados atualizados
        setTimeout(() => {
          this.openDisputeModal(region.id);
        }, 1000);
      }
    }, 300);
  }

  // Método para mostrar resultado da disputa
  showDisputeResult(success, region, attacker, defender, rewards = {}) {
    console.log('🏆 Mostrando resultado da disputa:', {
      success,
      region: region.name,
      attacker: attacker.name,
      defender: defender.name
    });
    
    // Chamar o modal de resultado existente
    this.openDisputeResultModal(success, region, attacker, defender, rewards);
    
    // Atualizar visual da região usando método centralizado
    this._updateRegionCell(region.id);
  }

  // NOVO MÉTODO: Atualizar célula de região usando método centralizado
  _updateRegionCell(regionId) {
    console.log('🔄 Atualizando visual da região via método centralizado:', regionId);
    
    // Usar método centralizado do UIGameManager se disponível
    if (window.updateRegionCell && typeof window.updateRegionCell === 'function') {
      return window.updateRegionCell(regionId);
    }
    
    // Fallback: usar UI Manager se disponível
    if (this.uiManager && this.uiManager.gameManager && this.uiManager.gameManager.updateRegionCell) {
      return this.uiManager.gameManager.updateRegionCell(regionId);
    }
    
    console.warn('⚠️ Não foi possível atualizar a célula: método centralizado não disponível');
    return false;
  }
  
  // Mostrar resultado da disputa
  openDisputeResultModal(success, region, attacker, defender, rewards = {}) {
    const title = document.getElementById('disputeResultTitle');
    const header = document.getElementById('disputeResultHeader');
    const container = document.getElementById('disputeResultContainer');

    if (success) {
      title.textContent = 'Vitória na Disputa!';
      header.className = 'p-6 border-b bg-gradient-to-r from-green-900/40 to-gray-900';
      container.className = 'relative z-50 w-full max-w-2xl bg-gray-900 border-2 border-green-600/30 rounded-2xl shadow-2xl overflow-hidden';
    } else {
      title.textContent = 'Disputa Falhou';
      header.className = 'p-6 border-b bg-gradient-to-r from-red-900/40 to-gray-900';
      container.className = 'relative z-50 w-full max-w-2xl bg-gray-900 border-2 border-red-600/30 rounded-2xl shadow-2xl overflow-hidden';
    }

    const content = document.getElementById('disputeResultContent');
    content.innerHTML = `
      <div class="space-y-6">
        <!-- Banner de resultado -->
        <div class="text-center py-4 ${success ? 'bg-green-900/20' : 'bg-red-900/20'} rounded-xl">
          <div class="text-6xl mb-4 flex items-center justify-center">${success ? getIcon('trophy', { size: 64, className: 'text-yellow-400' }) : getIcon('skull', { size: 64, className: 'text-red-400' })}</div>
          <h3 class="text-xl font-bold text-white">${region.name}</h3>
          <p class="text-gray-300 mt-2">${success ? 
            `Você conquistou a região de <strong class="text-yellow-300">${defender.name}</strong>!` : 
            `Você falhou em conquistar a região de <strong class="text-yellow-300">${defender.name}</strong>.`}
          </p>
        </div>

        ${success ? `
          <!-- Recompensas -->
          <div class="bg-green-900/10 p-5 rounded-xl border border-green-700/30">
            <h4 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span class="inline-flex items-center text-green-400">${getIcon('trophy', { size: 18 })}</span>
              <span>Recompensas da Conquista</span>
            </h4>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-gray-300">Pontos de Vitória:</span>
                <span class="text-yellow-400 font-bold text-xl flex items-center gap-1">+1 ${getIcon('star', { size: 16 })}</span>
              </div>
              ${rewards.resources ? `
              <div class="flex items-center justify-between">
                <span class="text-gray-300">Recursos saqueados:</span>
                <span class="text-green-400 font-bold">${rewards.resources}</span>
              </div>
              ` : ''}
              ${rewards.structures ? `
              <div class="flex items-center justify-between">
                <span class="text-gray-300">Estruturas capturadas:</span>
                <span class="text-blue-400 font-bold">${rewards.structures}</span>
              </div>
              ` : ''}
            </div>
          </div>
        ` : `
          <!-- Perdas -->
          <div class="bg-red-900/10 p-5 rounded-xl border border-red-700/30">
            <h4 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span class="inline-flex items-center text-red-400">${getIcon('skull', { size: 18 })}</span>
              <span>Consequências da Derrota</span>
            </h4>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-gray-300">Recursos perdidos:</span>
                <span class="text-red-400 font-bold">Todos os gastos na disputa</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-300">Bônus do defensor:</span>
                <span class="text-yellow-400 font-bold flex items-center gap-1">${defender.name} ganhou +1 ${getIcon('star', { size: 14 })} PV</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-300">Dano à região:</span>
                <span class="text-orange-400 font-bold">Nível de exploração reduzido</span>
              </div>
            </div>
          </div>
        `}

        <!-- Status Atual -->
        <div class="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
          <h4 class="text-lg font-semibold text-white mb-4">Status Atual dos Jogadores</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Atacante -->
            <div class="bg-gray-900/50 p-4 rounded-lg">
              <div class="text-sm text-gray-400 mb-2">${attacker.name}</div>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-gray-300">Pontos de Vitória:</span>
                  <span class="text-yellow-400 font-bold flex items-center gap-1">${attacker.victoryPoints} ${getIcon('star', { size: 14 })}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-300">Regiões controladas:</span>
                  <span class="text-blue-400 font-bold">${attacker.regions.length}</span>
                </div>
              </div>
            </div>
            
            <!-- Defensor -->
            <div class="bg-gray-900/50 p-4 rounded-lg">
              <div class="text-sm text-gray-400 mb-2">${defender.name}</div>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-300">Pontos de Vitória:</span>
                  <span class="text-yellow-400 font-bold">${defender.victoryPoints} ⭐</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-300">Regiões controladas:</span>
                  <span class="text-blue-400 font-bold">${defender.regions.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Mostrar modal
    this.disputeResultModal.classList.remove('hidden');
    this.uiManager.setModalMode(true);
  }
  
  // Método para atualização dinâmica de custos
  updateDisputeCosts(regionId, attackerId) {
    if (!window.gameLogic?.disputeLogic) {
      console.warn('⚠️ disputeLogic não disponível para atualização de custos');
      return null;
    }
    
    const disputeData = window.gameLogic.disputeLogic.getDisputeData(regionId, attackerId);
    if (!disputeData) return null;
    
    // Atualizar UI com novos custos
    const chanceBar = document.getElementById('disputeChanceBar');
    const chanceText = document.getElementById('disputeChanceText');
    
    if (chanceBar && chanceText) {
      chanceBar.style.width = `${disputeData.successChance}%`;
      chanceText.textContent = `${Math.round(disputeData.successChance)}%`;
      
      // Atualizar classe de cor baseada na chance
      chanceBar.className = `h-6 rounded-full transition-all duration-1000 ease-out ${
        disputeData.successChance >= 70 ? 'bg-green-500' : 
        disputeData.successChance >= 40 ? 'bg-yellow-500' : 'bg-red-500'
      }`;
    }
    
    return disputeData;
  }
}