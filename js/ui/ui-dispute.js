// ui-dispute.js - Interface para Disputas Territoriais (APENAS DISPUTA)
import { gameState, getCurrentPlayer, getPlayerById } from '../state/game-state.js';
import { RESOURCE_ICONS } from '../state/game-config.js';

export class DisputeUI {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.cacheElements();
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

        // NÃO CRIAR MODAL DE DOMINAÇÃO - remover esta parte
    }

    createDisputeModal() {
        // Criar o modal de confirmação de disputa
        const modal = document.createElement('div');
        modal.id = 'disputeModal';
        modal.className = 'hidden fixed inset-0 z-[110] flex items-center justify-center p-6';
        modal.innerHTML = `
            <div class="absolute inset-0 bg-black/70"></div>
            <div class="relative w-full max-w-md bg-gray-900/95 backdrop-blur-md border border-red-500/30 rounded-2xl shadow-xl p-6" style="background-color: rgba(17, 24, 39, 0.98) !important;">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-2xl text-red-300 font-semibold">⚔️ Disputa Territorial</h2>
                        <p id="disputeRegionName" class="text-gray-300 text-sm"></p>
                    </div>
                    <button id="disputeModalClose" class="text-gray-300 hover:text-white text-xl">✖</button>
                </div>
                
                <div id="disputeModalContent" class="space-y-4">
                    <!-- Conteúdo será preenchido dinamicamente -->
                </div>

                <div class="flex justify-end gap-3 mt-6">
                    <button id="disputeCancelBtn" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white">Cancelar</button>
                    <button id="disputeConfirmBtn" class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white">Iniciar Disputa</button>
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
        modal.className = 'hidden fixed inset-0 z-[110] flex items-center justify-center p-6';
        modal.innerHTML = `
            <div class="absolute inset-0 bg-black/70"></div>
            <div class="relative w-full max-w-md bg-gray-900/95 backdrop-blur-md border rounded-2xl shadow-xl p-6" style="background-color: rgba(17, 24, 39, 0.98) !important;">
                <div class="flex justify-between items-center mb-6">
                    <h2 id="disputeResultTitle" class="text-2xl font-semibold">Resultado da Disputa</h2>
                    <button id="disputeResultClose" class="text-gray-300 hover:text-white text-xl">✖</button>
                </div>
                
                <div id="disputeResultContent" class="space-y-4">
                    <!-- Conteúdo será preenchido dinamicamente -->
                </div>

                <div class="flex justify-end mt-6">
                    <button id="disputeResultOkBtn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this.disputeResultModal = modal;

        // Event listeners
        document.getElementById('disputeResultClose').addEventListener('click', () => this.closeDisputeResultModal());
        document.getElementById('disputeResultOkBtn').addEventListener('click', () => this.closeDisputeResultModal());
    }

    // Método para abrir modal de disputa (regiões inimigas)
    openDisputeModal(regionId) {
        const region = gameState.regions[regionId];
        const defender = getPlayerById(region.controller);
        const attacker = getCurrentPlayer();

        if (!region || !defender || !attacker) {
            console.error('❌ Dados de disputa inválidos');
            return;
        }

        // Calcular custos e chance de sucesso
        let disputeData;
        try {
            disputeData = window.gameLogic.disputeLogic.calculateDisputeCosts(attacker, region);
        } catch (error) {
            console.warn('⚠️ Erro ao calcular custos de disputa:', error);
            // Fallback
            disputeData = {
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

        document.getElementById('disputeRegionName').textContent = `Região: ${region.name} (Controlada por ${defender.name})`;

        const content = document.getElementById('disputeModalContent');
        content.innerHTML = `
            <div class="space-y-4">
                <div class="bg-gray-800 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold text-white mb-2">Custos da Disputa</h3>
                    <div class="grid grid-cols-2 gap-2">
                        <div class="text-gray-300">PV: <span class="text-yellow-400 font-bold">${disputeData.finalCost.pv} ⭐</span></div>
                        <div class="text-gray-300">Madeira: <span class="text-green-400 font-bold">${disputeData.finalCost.madeira} ${RESOURCE_ICONS.madeira}</span></div>
                        <div class="text-gray-300">Pedra: <span class="text-gray-400 font-bold">${disputeData.finalCost.pedra} ${RESOURCE_ICONS.pedra}</span></div>
                        <div class="text-gray-300">Ouro: <span class="text-yellow-300 font-bold">${disputeData.finalCost.ouro} ${RESOURCE_ICONS.ouro}</span></div>
                        ${disputeData.finalCost.agua > 0 ? `<div class="text-gray-300">Água: <span class="text-blue-400 font-bold">${disputeData.finalCost.agua} ${RESOURCE_ICONS.agua}</span></div>` : ''}
                    </div>
                </div>

                <div class="bg-blue-900/30 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold text-white mb-2">Chance de Sucesso</h3>
                    <div class="flex items-center">
                        <div class="w-full bg-gray-700 rounded-full h-6">
                            <div id="disputeChanceBar" class="bg-green-600 h-6 rounded-full" style="width: ${disputeData.successChance}%"></div>
                        </div>
                        <span id="disputeChanceText" class="ml-4 text-2xl font-bold text-white">${Math.round(disputeData.successChance)}%</span>
                    </div>
                    <p class="text-sm text-gray-300 mt-2">
                        ${disputeData.successChance >= 70 ? 'Alta chance de sucesso!' : 
                          disputeData.successChance >= 40 ? 'Chance moderada.' : 
                          'Baixa chance. Considere fortalecer-se primeiro.'}
                    </p>
                </div>

                <div class="bg-red-900/20 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold text-white mb-2">Riscos</h3>
                    <ul class="text-sm text-gray-300 list-disc list-inside">
                        <li>Em caso de falha, você perde os recursos gastos.</li>
                        <li>O defensor ganha 1 PV por defender com sucesso.</li>
                        <li>A região pode sofrer danos (nível de exploração reduzido).</li>
                    </ul>
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

        // Mostrar modal
        this.disputeModal.classList.remove('hidden');
        this.uiManager.setModalMode(true);
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

    // Confirmar disputa - CORREÇÃO CRÍTICA
    confirmDispute() {
        if (!this.currentDisputeData) return;

        const { region, attacker } = this.currentDisputeData;
        
        if (!region || !attacker) {
            console.error('❌ Dados de disputa incompletos');
            this.uiManager.modals.showFeedback('Erro ao processar disputa', 'error');
            return;
        }

        // Fechar modal de confirmação
        this.closeDisputeModal();

        // Executar disputa
        if (window.gameLogic && window.gameLogic.disputeLogic && window.gameLogic.disputeLogic.handleDispute) {
            // Chamar a lógica de disputa com os parâmetros CORRETOS
            window.gameLogic.disputeLogic.handleDispute(region, attacker);
        } else {
            console.error('❌ Sistema de disputa não disponível');
            this.uiManager.modals.showFeedback('Erro ao processar disputa', 'error');
        }
    }

    // Mostrar resultado da disputa
    openDisputeResultModal(success, region, attacker, defender, rewards = {}) {
        const title = document.getElementById('disputeResultTitle');
        const modalContent = this.disputeResultModal.querySelector('.relative');

        if (success) {
            title.textContent = '✅ Disputa Vitoriosa!';
            modalContent.classList.add('border-green-500/30');
            modalContent.classList.remove('border-red-500/30');
        } else {
            title.textContent = '❌ Disputa Falhou!';
            modalContent.classList.add('border-red-500/30');
            modalContent.classList.remove('border-green-500/30');
        }

        const content = document.getElementById('disputeResultContent');
        content.innerHTML = `
            <div class="space-y-4">
                <div class="text-center">
                    <div class="text-4xl mb-2">${success ? '🏆' : '💀'}</div>
                    <h3 class="text-xl font-bold text-white">${region.name}</h3>
                    <p class="text-gray-300">${success ? `Você conquistou a região de ${defender.name}!` : `Você falhou em conquistar a região de ${defender.name}.`}</p>
                </div>

                ${success ? `
                    <div class="bg-green-900/30 p-4 rounded-lg">
                        <h4 class="text-lg font-semibold text-white mb-2">Recompensas</h4>
                        <ul class="text-gray-300">
                            <li>+1 PV pela conquista</li>
                            ${rewards.resources ? `<li>Recursos saqueados: ${rewards.resources}</li>` : ''}
                            ${rewards.structures ? `<li>Estruturas capturadas: ${rewards.structures}</li>` : ''}
                        </ul>
                    </div>
                ` : `
                    <div class="bg-red-900/30 p-4 rounded-lg">
                        <h4 class="text-lg font-semibold text-white mb-2">Perdas</h4>
                        <ul class="text-gray-300">
                            <li>Você perdeu os recursos gastos na disputa.</li>
                            <li>${defender.name} ganhou 1 PV por defender a região.</li>
                        </ul>
                    </div>
                `}

                <div class="bg-gray-800 p-4 rounded-lg">
                    <h4 class="text-lg font-semibold text-white mb-2">Status Atual</h4>
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <div class="text-gray-300">Seus PV: <span class="text-yellow-400 font-bold">${attacker.victoryPoints} ⭐</span></div>
                        <div class="text-gray-300">PV de ${defender.name}: <span class="text-yellow-400 font-bold">${defender.victoryPoints} ⭐</span></div>
                        <div class="text-gray-300">Suas regiões: <span class="text-blue-400 font-bold">${attacker.regions.length}</span></div>
                        <div class="text-gray-300">Regiões de ${defender.name}: <span class="text-blue-400 font-bold">${defender.regions.length}</span></div>
                    </div>
                </div>
            </div>
        `;

        this.disputeResultModal.classList.remove('hidden');
        this.uiManager.setModalMode(true);
    }
}