// ui-negotiation.js - Sistema Completo de Negociação
import { 
  gameState, 
  getCurrentPlayer,
  getNegotiationState,
  setNegotiationTarget,
  updateNegotiationResource,
  updateNegotiationRegions,
  resetNegotiationState,
  validateNegotiationState,
  getNegotiationValidationErrors,
  setActiveNegotiation,
  clearActiveNegotiation,
  getPendingNegotiationsForPlayer,
  addActivityLog
} from '../state/game-state.js';
import { RESOURCE_ICONS } from '../state/game-config.js';

class NegotiationUI {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.uiManager.negotiation = this;
    this.uiManager.negotiationUI = this;
    this.cacheElements();
    this.setupListeners();
  }

  cacheElements() {
    this.negotiationModal = document.getElementById('negotiationModal');
    this.negResponseModal = document.getElementById('negResponseModal');
    this.negTargetSelect = document.getElementById('negTarget');
    this.offerRegionsDiv = document.getElementById('offerRegions');
    this.reqRegionsDiv = document.getElementById('reqRegions');
    this.negSendBtn = document.getElementById('negSendBtn');
    this.negCancelBtn = document.getElementById('negCancelBtn');
    this.negResponseTitle = document.getElementById('negResponseTitle');
    this.negResponseBody = document.getElementById('negResponseBody');
    this.negAcceptBtn = document.getElementById('negAcceptBtn');
    this.negDeclineBtn = document.getElementById('negDeclineBtn');
    
    this.offerResourcesContainer = document.getElementById('offerResourcesContainer');
    this.requestResourcesContainer = document.getElementById('requestResourcesContainer');
  }

  setupListeners() {
    this.negCancelBtn?.addEventListener('click', (e) => this.closeNegotiationModal(e));
    this.negTargetSelect?.addEventListener('change', () => this.onTargetChange());
  }

  // Helper consistente para ler targetId do select
  getParsedTargetId() {
    if (!this.negTargetSelect) return NaN;
    const raw = this.negTargetSelect.value;
    if (raw === '' || raw === null || typeof raw === 'undefined') return NaN;
    const id = Number(raw);
    return Number.isInteger(id) ? id : NaN;
  }

  // ==================== MÉTODOS PRINCIPAIS ====================

  openNegotiationModal() {
    console.log('Abrindo modal de negociação - resetando estado');
    
    // 1. Resetar estado completamente
    resetNegotiationState();
    
    // 2. Configurar modo modal
    this.uiManager.setModalMode(true);
    
    const initiator = getCurrentPlayer();
    
    // 3. Verificar se jogador atual tem 1+ ouro
    if (!initiator || (initiator.resources.ouro || 0) < 1) {
      this.uiManager.modals.showFeedback('Você precisa de pelo menos 1 🪙 Ouro para enviar uma proposta.', 'warning');
      this.uiManager.setModalMode(false);
      return;
    }
    
    // 4. Limpar todos os campos da UI
    this.clearAllNegotiationFields();
    
    // 5. Preencher seleção de alvo apenas com jogadores que têm 1+ ouro
    if (this.negTargetSelect) {
      this.negTargetSelect.innerHTML = '<option value="">Selecione um jogador...</option>';
    }
    let hasValidTargets = false;
    
    gameState.players.forEach(p => {
      if (p.id !== initiator.id && (p.resources.ouro || 0) >= 1) {
        const opt = document.createElement('option');
        opt.value = String(p.id);
        opt.textContent = `${p.icon} ${p.name} (${p.resources.ouro}🪙)`;
        this.negTargetSelect.appendChild(opt);
        hasValidTargets = true;
      }
    });
    
    if (!hasValidTargets) {
      this.uiManager.modals.showFeedback('Nenhum outro jogador com 1+ 🪙 Ouro disponível para negociar.', 'warning');
      this.uiManager.setModalMode(false);
      return;
    }
    
    // 6. Configurar evento de mudança no select (já ligado em setupListeners, mas garantir comportamento)
    this.negTargetSelect.onchange = () => {
      const targetId = this.getParsedTargetId();
      if (!isNaN(targetId)) {
        setNegotiationTarget(targetId);
        this.populateReqRegions(); // Atualizar regiões do alvo
        this.populateNegotiationControls(); // reconstruir controles de request com limites corretos
        this.updateNegotiationUI();
      } else {
        // Limpar estado caso selecione placeholder
        setNegotiationTarget(null);
        this.clearAllNegotiationFields();
        this.updateNegotiationUI();
      }
    };
    
    // 7. Configurar botão de envio
    const sendBtn = document.getElementById('negSendBtn');
    if (sendBtn) {
      sendBtn.onclick = (e) => {
        e.preventDefault();
        this.handleSendNegotiation(e);
      };
    }
    
    // 8. Configurar botão de cancelar
    const cancelBtn = document.getElementById('negCancelBtn');
    if (cancelBtn) {
      cancelBtn.onclick = (e) => {
        e.preventDefault();
        this.closeNegotiationModal();
      };
    }
    
    // 9. Configurar sliders de recursos
    // this.setupResourceSliders();
    this.populateNegotiationControls(); // Cria sliders, zera valores e listeners
    this.populateRegionControls();    // Cria checkboxes e desmarca todos
    
    // 10. Mostrar modal
    if (this.negotiationModal) {
      this.negotiationModal.classList.remove('hidden');
      console.log('Modal de negociação aberto com estado limpo');
    }
  }

  setupResourceSliders() {
    const initiator = getCurrentPlayer();
    
    // Configurar sliders de oferta
    ['madeira', 'pedra', 'ouro', 'agua'].forEach(resource => {
      const slider = document.querySelector(`#offerResourcesContainer input[data-resource="${resource}"]`);
      if (slider) {
        slider.max = initiator ? (initiator.resources[resource] || 0) : 0;
        slider.value = 0;
        slider.oninput = (e) => {
          const value = parseInt(e.target.value) || 0;
          updateNegotiationResource('offer', resource, value);
          this.updateNegotiationUI();
          this.validateNegotiation();
        };
      }
    });
    
    // Configurar sliders de solicitação (serão atualizados quando o alvo mudar)
    this.updateRequestSliders();
  }

  // Atualizar sliders de solicitação com base no alvo selecionado (uso do helper)
  updateRequestSliders() {
    const targetId = this.getParsedTargetId();
    const targetPlayer = !isNaN(targetId) ? gameState.players.find(p => p.id === targetId) : null;
    
    if (!targetPlayer) return;
    
    ['madeira', 'pedra', 'ouro', 'agua'].forEach(resource => {
      const slider = document.querySelector(`#requestResourcesContainer input[data-resource="${resource}"]`);
      if (slider) {
        slider.max = targetPlayer.resources[resource] || 0;
        slider.value = 0;
        slider.oninput = (e) => {
          const value = parseInt(e.target.value) || 0;
          updateNegotiationResource('request', resource, value);
          this.updateNegotiationUI();
          this.validateNegotiation();
        };
      }
    });
  }

  populateRegionControls() {
    const initiator = getCurrentPlayer();
    
    // Preencher regiões oferecidas - SEMPRE começar limpo
    if (this.offerRegionsDiv) {
      this.offerRegionsDiv.innerHTML = '';
      (initiator?.regions || []).forEach(rid => {
        const region = gameState.regions[rid];
        if (!region) return;
        
        const chkWrap = document.createElement('label');
        chkWrap.className = 'flex items-center gap-2 p-2 bg-gray-800/60 rounded cursor-pointer hover:bg-gray-700/60';
        
        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.value = String(rid);
        chk.className = 'rounded negotiation-checkbox';
        chk.dataset.type = 'offer';
        chk.dataset.region = String(rid);
        
        // SEMPRE começar desmarcado (limpo)
        chk.checked = false;
        
        chk.addEventListener('change', (e) => {
          const regionId = Number(e.target.value);
          const currentRegions = [...getNegotiationState().offerRegions];
          let newRegions;
          
          if (e.target.checked) {
            newRegions = [...currentRegions, regionId];
          } else {
            newRegions = currentRegions.filter(id => id !== regionId);
          }
          
          updateNegotiationRegions('offerRegions', newRegions);
          this.updateNegotiationUI(); // ATUALIZA RESUMO
          this.validateNegotiation();
        });
        
        const span = document.createElement('span');
        span.className = 'text-sm text-white';
        span.textContent = `${region.name} (${region.biome})`;
        
        chkWrap.appendChild(chk);
        chkWrap.appendChild(span);
        this.offerRegionsDiv.appendChild(chkWrap);
      });
    }
    
    // Preencher regiões solicitadas - SEMPRE começar limpo
    this.populateReqRegions();
  }
   
  createResourceControl(type, resourceKey, maxValue, currentValue = 0) {
    const control = document.createElement('div');
    control.className = 'flex flex-col gap-1 mb-2';
    
    control.innerHTML = `
      <div class="flex justify-between items-center">
        <label class="text-sm text-gray-300 flex items-center gap-1">
          <span class="text-lg">${RESOURCE_ICONS[resourceKey]}</span>
          <span class="capitalize">${resourceKey}</span>
        </label>
        <span class="text-white font-bold" id="${type}_${resourceKey}_value">${currentValue}</span>
      </div>
      <div class="flex items-center gap-2">
        <button class="decrease-btn px-2 py-1 bg-gray-700 rounded text-white disabled:opacity-30" 
                data-type="${type}" data-resource="${resourceKey}">-</button>
        <input type="range" min="0" max="${maxValue}" value="${currentValue}" 
               class="flex-1 negotiation-slider" 
               data-type="${type}" data-resource="${resourceKey}">
        <button class="increase-btn px-2 py-1 bg-gray-700 rounded text-white disabled:opacity-30" 
                data-type="${type}" data-resource="${resourceKey}">+</button>
      </div>
    `;
    
    return control;
  }

  setupResourceControlListeners() {
    // Sliders
    document.querySelectorAll('.negotiation-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const type = e.target.dataset.type;
        const resource = e.target.dataset.resource;
        const value = parseInt(e.target.value) || 0;
        
        updateNegotiationResource(type, resource, value);
        
        // Atualiza valor exibido
        const valueEl = document.getElementById(`${type}_${resource}_value`);
        if (valueEl) valueEl.textContent = value;
        
        this.updateNegotiationUI(); // Atualiza toda a UI, incluindo o resumo
        this.validateNegotiation();
      });
    });
    
    // Botões +/-
    document.querySelectorAll('.increase-btn, .decrease-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.target.dataset.type;
        const resource = e.target.dataset.resource;
        const isIncrease = e.target.classList.contains('increase-btn');
        
        const current = getNegotiationState()[type][resource] || 0;
        const max = this.getResourceMax(type, resource);
        const newValue = isIncrease ? Math.min(current + 1, max) : Math.max(current - 1, 0);
        
        updateNegotiationResource(type, resource, newValue);
        
        // Atualiza slider e valor
        const slider = document.querySelector(`.negotiation-slider[data-type="${type}"][data-resource="${resource}"]`);
        if (slider) slider.value = newValue;
        
        const valueEl = document.getElementById(`${type}_${resource}_value`);
        if (valueEl) valueEl.textContent = newValue;
        
        this.updateNegotiationUI(); // Atualiza toda a UI, incluindo o resumo
        this.validateNegotiation();
      });
    });
  }

  adjustNegotiationResource(resourceKey, type, delta) {
    // Obtém estado atual
    const negotiationState = getNegotiationState();
    const current = negotiationState[type][resourceKey] || 0;
    
    // Calcula máximo disponível
    let max = 0;
    if (type === 'offer') {
      const currentPlayer = getCurrentPlayer();
      max = currentPlayer.resources[resourceKey] || 0;
    } else {
      // Para request, precisa do jogador alvo
      const targetId = this.getParsedTargetId();
      if (!isNaN(targetId)) {
        const targetPlayer = gameState.players.find(p => p.id === targetId);
        if (targetPlayer) {
          max = targetPlayer.resources[resourceKey] || 0;
        }
      }
    }
    
    // Calcula novo valor (limitado entre 0 e max)
    const newValue = Math.max(0, Math.min(max, current + delta));
    
    // Atualiza estado
    updateNegotiationResource(type, resourceKey, newValue);
    
    // Atualiza UI
    this.updateNegotiationUI();
    this.validateNegotiation();
  }

  resetNegotiationUI() {
    // Resetar estado
    resetNegotiationState();
    
    // Limpar containers de recursos
    const offerContainer = document.getElementById('offerResourcesContainer');
    const requestContainer = document.getElementById('requestResourcesContainer');
    if (offerContainer) offerContainer.innerHTML = '';
    if (requestContainer) requestContainer.innerHTML = '';
    
    // Limpar checkboxes de regiões
    if (this.offerRegionsDiv) {
      this.offerRegionsDiv.innerHTML = '';
    }
    if (this.reqRegionsDiv) {
      this.reqRegionsDiv.innerHTML = '';
    }
    
    // Atualizar controles (após reset)
    this.populateNegotiationControls();
    this.populateRegionControls();
    
    // Atualizar UI e resumo
    this.updateNegotiationUI();
    this.updateNegotiationSummary();
    this.validateNegotiation();
    
    // Garantir que o botão de envio esteja no estado correto
    const sendBtn = document.getElementById('negSendBtn');
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
      sendBtn.classList.add('bg-gray-600');
    }
  }

  updateNegotiationUI() {
    const negotiationState = getNegotiationState();
    const currentPlayer = getCurrentPlayer();
    const targetId = this.getParsedTargetId();
    const targetPlayer = !isNaN(targetId) ? gameState.players.find(p => p.id === targetId) : null;
    
    // Atualiza todos os controles visuais
    ['madeira', 'pedra', 'ouro', 'agua'].forEach(resource => {
      // Para oferta
      const offerValue = negotiationState.offer[resource] || 0;
      const offerMax = currentPlayer ? currentPlayer.resources[resource] || 0 : 0;
      const offerValueEl = document.getElementById(`offer_${resource}_value`);
      if (offerValueEl) {
        offerValueEl.textContent = offerValue;
        // Atualiza botões
        const offerDecreaseBtn = offerValueEl.previousElementSibling;
        const offerIncreaseBtn = offerValueEl.nextElementSibling;
        if (offerDecreaseBtn) offerDecreaseBtn.disabled = offerValue <= 0;
        if (offerIncreaseBtn) offerIncreaseBtn.disabled = offerValue >= offerMax;
      }
      
      // Para solicitação
      const requestValue = negotiationState.request[resource] || 0;
      const requestMax = targetPlayer ? targetPlayer.resources[resource] || 0 : 0;
      const requestValueEl = document.getElementById(`request_${resource}_value`);
      if (requestValueEl) {
        requestValueEl.textContent = requestValue;
        // Atualiza botões
        const requestDecreaseBtn = requestValueEl.previousElementSibling;
        const requestIncreaseBtn = requestValueEl.nextElementSibling;
        if (requestDecreaseBtn) requestDecreaseBtn.disabled = requestValue <= 0;
        if (requestIncreaseBtn) requestIncreaseBtn.disabled = requestValue >= requestMax;
      }
    });
    
    // Atualizar informações dos jogadores
    this.updateNegotiationInfo();
    
    // ATUALIZAR RESUMO DA PROPOSTA
    this.updateNegotiationSummary();
    
    // Atualizar tooltip de erro no botão de envio
    const sendBtn = document.getElementById('negSendBtn');
    if (sendBtn) {
      const errors = getNegotiationValidationErrors();
      sendBtn.title = errors && errors.length > 0 ? errors.join('\n') : 'Pronto para enviar!';
    }
  }

  updateNegotiationInfo() {
    const currentPlayer = getCurrentPlayer();
    const targetId = this.getParsedTargetId();
    const targetPlayer = !isNaN(targetId) ? gameState.players.find(p => p.id === targetId) : null;
    
    // Atualiza informações do jogador atual (oferta)
    if (currentPlayer) {
      const offerInfo = Object.entries(currentPlayer.resources)
        .map(([key, value]) => `${value}${RESOURCE_ICONS[key]}`)
        .join(' ');
      const offerInfoEl = document.getElementById('offerResourcesInfo');
      if (offerInfoEl) offerInfoEl.textContent = offerInfo;
    }
    
    // Atualiza informações do jogador alvo (solicitação)
    if (targetPlayer) {
      const targetNameEl = document.getElementById('targetPlayerName');
      if (targetNameEl) targetNameEl.textContent = targetPlayer.name;
      
      const requestInfo = Object.entries(targetPlayer.resources)
        .map(([key, value]) => `${value}${RESOURCE_ICONS[key]}`)
        .join(' ');
      const requestInfoEl = document.getElementById('requestResourcesInfo');
      if (requestInfoEl) requestInfoEl.textContent = requestInfo;
    } else {
      const targetNameEl = document.getElementById('targetPlayerName');
      if (targetNameEl) targetNameEl.textContent = 'Ninguém';
      const requestInfoEl = document.getElementById('requestResourcesInfo');
      if (requestInfoEl) requestInfoEl.textContent = '—';
    }
  }

  populateNegotiationControls() {
    const offerContainer = document.getElementById('offerResourcesContainer');
    const requestContainer = document.getElementById('requestResourcesContainer');
    
    if (!offerContainer || !requestContainer) return;
    
    // Limpa containers
    offerContainer.innerHTML = '';
    requestContainer.innerHTML = '';
    
    const currentPlayer = getCurrentPlayer();
    const targetId = this.getParsedTargetId();
    const targetPlayer = !isNaN(targetId) ? gameState.players.find(p => p.id === targetId) : null;
    
    // Garantir que os valores atuais não excedam os máximos
    const currentState = getNegotiationState();
    
    // Cria controles para oferta (recursos do jogador atual)
    ['madeira', 'pedra', 'ouro', 'agua'].forEach(resource => {
      const max = currentPlayer ? currentPlayer.resources[resource] || 0 : 0;
      const current = Math.min(currentState.offer[resource] || 0, max); // FORÇA limite
      updateNegotiationResource('offer', resource, current); // Atualiza estado
      
      const control = this.createResourceControl('offer', resource, max, current);
      offerContainer.appendChild(control);
    });
    
    // Cria controles para solicitação (recursos do alvo)
    ['madeira', 'pedra', 'ouro', 'agua'].forEach(resource => {
      const max = targetPlayer ? targetPlayer.resources[resource] || 0 : 0;
      const current = Math.min(currentState.request[resource] || 0, max); // FORÇA limite
      updateNegotiationResource('request', resource, current); // Atualiza estado
      
      const control = this.createResourceControl('request', resource, max, current);
      requestContainer.appendChild(control);
    });
    
    // Configurar listeners para os novos controles
    this.setupResourceControlListeners();
  }

  setupNegotiationControlListeners() {
    // Sliders
    document.querySelectorAll('.negotiation-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const type = e.target.dataset.type;
        const resource = e.target.dataset.resource;
        const value = parseInt(e.target.value) || 0;
        
        updateNegotiationResource(type, resource, value);
        
        // Atualiza valor exibido
        const valueEl = document.getElementById(`${type}_${resource}_value`);
        if (valueEl) valueEl.textContent = value;
        
        this.validateNegotiation();
      });
    });
    
    // Botões +/-
    document.querySelectorAll('.increase-btn, .decrease-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.target.dataset.type;
        const resource = e.target.dataset.resource;
        const isIncrease = e.target.classList.contains('increase-btn');
        
        const current = getNegotiationState()[type][resource] || 0;
        const max = this.getResourceMax(type, resource);
        const newValue = isIncrease ? Math.min(current + 1, max) : Math.max(current - 1, 0);
        
        updateNegotiationResource(type, resource, newValue);
        
        // Atualiza slider e valor
        const slider = document.querySelector(`.negotiation-slider[data-type="${type}"][data-resource="${resource}"]`);
        if (slider) slider.value = newValue;
        
        const valueEl = document.getElementById(`${type}_${resource}_value`);
        if (valueEl) valueEl.textContent = newValue;
        
        this.validateNegotiation();
      });
    });
  }

  // Auxiliar consistente para obter máximo de recurso dependendo do tipo
  getResourceMax(type, resource) {
    if (type === 'offer') {
      const player = getCurrentPlayer();
      return player ? player.resources[resource] || 0 : 0;
    } else {
      const targetId = this.getParsedTargetId();
      const targetPlayer = !isNaN(targetId) ? gameState.players.find(p => p.id === targetId) : null;
      return targetPlayer ? targetPlayer.resources[resource] || 0 : 0;
    }
  }

  populateReqRegions() {
    const targetId = this.getParsedTargetId();
    if (isNaN(targetId)) return;
    
    const target = gameState.players.find(p => p.id === targetId);
    if (!target) return;
    
    if (this.reqRegionsDiv) {
      this.reqRegionsDiv.innerHTML = '';
      
      (target.regions || []).forEach(rid => {
        const region = gameState.regions[rid];
        const chkWrap = document.createElement('label');
        chkWrap.className = 'flex items-center gap-2 p-2 bg-gray-800/60 rounded cursor-pointer hover:bg-gray-700/60';
        
        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.value = String(rid);
        chk.className = 'rounded negotiation-checkbox';
        chk.dataset.type = 'request';
        chk.dataset.region = String(rid);
        
        chk.addEventListener('change', (e) => {
          const regionId = Number(e.target.value);
          const currentRegions = [...getNegotiationState().requestRegions];
          let newRegions;
          
          if (e.target.checked) {
            newRegions = [...currentRegions, regionId];
          } else {
            newRegions = currentRegions.filter(id => id !== regionId);
          }
          
          updateNegotiationRegions('requestRegions', newRegions);
          this.updateNegotiationUI(); // ATUALIZA RESUMO
          this.validateNegotiation();
        });
        
        const span = document.createElement('span');
        span.className = 'text-sm text-white';
        span.textContent = `${region.name} (${region.biome})`;
        
        chkWrap.appendChild(chk);
        chkWrap.appendChild(span);
        this.reqRegionsDiv.appendChild(chkWrap);
      });
    }
    
    // Atualizar UI dos controles de recursos
    this.updateNegotiationUI(); // ATUALIZA RESUMO
    this.validateNegotiation();
  }

  onTargetChange() {
    const targetId = this.getParsedTargetId();
    if (isNaN(targetId)) return;
    
    // Atualizar o alvo na negociação
    setNegotiationTarget(targetId);
    
    // Resetar COMPLETAMENTE a UI
    this.clearAllNegotiationFields();
    
    // Reconstruir controles para o novo alvo
    this.populateNegotiationControls();
    this.populateRegionControls();
    this.updateNegotiationUI();
    this.updateNegotiationSummary();
    
    // Garantir botão desabilitado
    const sendBtn = document.getElementById('negSendBtn');
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
      sendBtn.classList.add('bg-gray-600');
      sendBtn.title = 'Adicione algo na oferta ou solicitação';
    }
  }

  updateNegotiationSummary() {
    const summaryEl = document.getElementById('negotiationSummary');
    if (!summaryEl) return;
    
    const negotiationState = getNegotiationState();
    const initiator = getCurrentPlayer();
    const targetId = this.getParsedTargetId();
    const targetPlayer = !isNaN(targetId) ? gameState.players.find(p => p.id === targetId) : null;
    
    let offerItems = [];
    let requestItems = [];
    
    // Coletar recursos oferecidos
    Object.entries(negotiationState.offer).forEach(([resource, amount]) => {
      if (amount > 0) {
        offerItems.push(`${amount} ${RESOURCE_ICONS[resource] || resource}`);
      }
    });
    
    // Coletar regiões oferecidas
    if (negotiationState.offerRegions && negotiationState.offerRegions.length > 0) {
      const regionCount = negotiationState.offerRegions.length;
      offerItems.push(`${regionCount} região${regionCount > 1 ? 'ões' : ''}`);
    }
    
    // Coletar recursos solicitados
    Object.entries(negotiationState.request).forEach(([resource, amount]) => {
      if (amount > 0) {
        requestItems.push(`${amount} ${RESOURCE_ICONS[resource] || resource}`);
      }
    });
    
    // Coletar regiões solicitadas
    if (negotiationState.requestRegions && negotiationState.requestRegions.length > 0) {
      const regionCount = negotiationState.requestRegions.length;
      requestItems.push(`${regionCount} região${regionCount > 1 ? 'ões' : ''}`);
    }
    
    // Criar texto do resumo
    const offerText = offerItems.length > 0 ? offerItems.join(', ') : 'Nada oferecido';
    const requestText = requestItems.length > 0 ? requestItems.join(', ') : 'Nada solicitado';
    
    // Adicionar informações dos jogadores
    const targetName = targetPlayer ? targetPlayer.name : 'Ninguém';
    const initiatorName = initiator ? initiator.name : 'Você';
    
    summaryEl.innerHTML = `
      <div class="mb-2">
        <div class="text-xs text-gray-400 mb-1">De: <span class="text-green-300">${initiatorName}</span></div>
        <div class="text-xs text-gray-400">Para: <span class="text-red-300">${targetName}</span></div>
      </div>
      <div class="text-green-300 text-sm font-semibold">🎁 Oferta: ${offerText}</div>
      <div class="text-red-300 text-sm font-semibold mt-2">📥 Solicitação: ${requestText}</div>
      <div class="mt-2 text-xs text-gray-400">
        Custo: 1 🪙 Ouro • ${gameState.actionsLeft} ação(ões) restante(s)
      </div>
    `;
  }

  // ==================== VALIDAÇÃO ====================
   
  validateNegotiation() {
    const currentPlayer = getCurrentPlayer();
    const targetId = this.getParsedTargetId();
    
    // Verificações básicas
    if (isNaN(targetId)) {
      this.updateSendButton(false, 'Selecione um jogador para negociar');
      return false;
    }
    
    if (!currentPlayer || (currentPlayer.resources.ouro || 0) < 1) {
      this.updateSendButton(false, 'Você precisa de 1 🪙 Ouro para enviar proposta');
      return false;
    }
    
    if (gameState.actionsLeft <= 0) {
      this.updateSendButton(false, 'Sem ações restantes');
      return false;
    }
    
    // Verificar se há conteúdo na proposta
    const negotiationState = getNegotiationState();
    const hasOffer = Object.values(negotiationState.offer).some(v => v > 0) || 
                     (negotiationState.offerRegions && negotiationState.offerRegions.length > 0);
    const hasRequest = Object.values(negotiationState.request).some(v => v > 0) || 
                       (negotiationState.requestRegions && negotiationState.requestRegions.length > 0);
    
    if (!hasOffer && !hasRequest) {
      this.updateSendButton(false, 'Adicione algo na oferta ou solicitação');
      return false;
    }
    
    // Se chegou aqui, pode enviar
    this.updateSendButton(true, 'Enviar proposta (custa 1 Ouro)');
    return true;
  }

  updateSendButton(enabled, tooltip = '') {
    const sendBtn = document.getElementById('negSendBtn');
    if (!sendBtn) return;
    
    sendBtn.disabled = !enabled;
    sendBtn.title = tooltip;
    
    if (enabled) {
      sendBtn.classList.remove('bg-gray-600');
      sendBtn.classList.add('bg-green-600', 'hover:bg-green-700');
    } else {
      sendBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
      sendBtn.classList.add('bg-gray-600');
    }
  }

  // ==================== ENVIO DE PROPOSTA ====================
  
  handleSendNegotiation(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Verificar se o modal ainda está aberto
    const modal = document.getElementById('negotiationModal');
    if (!modal || modal.classList.contains('hidden')) {
      return;
    }

    // Verificar validação usando o método local
    if (!this.validateNegotiation()) {
      const errorMessage = document.getElementById('negSendBtn')?.title || 'Proposta inválida';
      this.uiManager.modals.showFeedback(errorMessage, 'error');
      return;
    }
    
    // Verificar gameLogic
    if (!window.gameLogic) {
      this.uiManager.modals.showFeedback('Sistema de jogo não carregado', 'error');
      return;
    }
    
    if (typeof window.gameLogic.handleSendNegotiation !== 'function') {
      this.uiManager.modals.showFeedback('Função de envio não disponível', 'error');
      return;
    }
    
    try {
      const result = window.gameLogic.handleSendNegotiation();
      
      // Se retornou false, não fechar o modal automaticamente
      if (result === false) {
        return;
      } else {
        this.closeNegotiationModal();
      }
    } catch (error) {
      this.uiManager.modals.showFeedback(`Erro: ${error.message}`, 'error');
    }
  }

  setupEnhancedNegotiationListeners() {
    // Configurar botão de envio com verificação robusta
    const sendBtn = document.getElementById('negSendBtn');
    if (sendBtn) {
      // Remover todos os listeners anteriores
      const newSendBtn = sendBtn.cloneNode(true);
      sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
  
      // Adicionar novo listener direto
      document.getElementById('negSendBtn').addEventListener('click', (e) => this.handleSendNegotiation(e));
    }
  }

  // ==================== RESPOSTA À PROPOSTA ====================
  
  presentNegotiationToTarget(neg) {
    if (!neg) {
      console.error('Negociação não fornecida para presentNegotiationToTarget');
      return;
    }
    
    this.uiManager.setModalMode(true);
    
    const initiator = gameState.players.find(p => p.id === neg.initiatorId);
    const target = gameState.players.find(p => p.id === neg.targetId);
    
    if (!initiator || !target) {
      this.uiManager.modals.showFeedback('Erro interno na negociação. Jogador não encontrado.', 'error');
      this.uiManager.setModalMode(false);
      return;
    }

    setActiveNegotiation(neg);
    
    const summary = [];
    
    const offerResources = ['madeira','pedra','ouro','agua']
      .map(k => neg.offer[k] ? `${neg.offer[k]} ${RESOURCE_ICONS[k]}` : null)
      .filter(x => x);
    
    if (offerResources.length > 0 || (neg.offer.regions && neg.offer.regions.length > 0)) {
      summary.push(`<div class="mb-3"><strong class="text-green-400">${initiator.icon} ${initiator.name} oferece:</strong></div>`);
      
      if (offerResources.length > 0) {
        summary.push(`<div class="mb-2 text-sm">${offerResources.join(' • ')}</div>`);
      }
      
      if (neg.offer.regions && neg.offer.regions.length > 0) {
        const regionNames = neg.offer.regions.map(r => 
          gameState.regions[r]?.name || `Região ${String.fromCharCode(65 + r)}`
        );
        summary.push(`<div class="mb-2 text-sm"><span class="text-yellow-300">Regiões:</span> ${regionNames.join(', ')}</div>`);
      }
    } else {
      summary.push(`<div class="mb-2 text-sm text-gray-400">Sem oferta de recursos ou regiões.</div>`);
    }

    const requestResources = ['madeira','pedra','ouro','agua']
      .map(k => neg.request[k] ? `${neg.request[k]} ${RESOURCE_ICONS[k]}` : null)
      .filter(x => x);
    
    if (requestResources.length > 0 || (neg.request.regions && neg.request.regions.length > 0)) {
      summary.push(`<div class="mt-4 mb-3"><strong class="text-red-400">Solicita em troca:</strong></div>`);
      
      if (requestResources.length > 0) {
        summary.push(`<div class="mb-2 text-sm">${requestResources.join(' • ')}</div>`);
      }
      
      if (neg.request.regions && neg.request.regions.length > 0) {
        const regionNames = neg.request.regions.map(r => 
          gameState.regions[r]?.name || `Região ${String.fromCharCode(65 + r)}`
        );
        summary.push(`<div class="mb-2 text-sm"><span class="text-yellow-300">Regiões:</span> ${regionNames.join(', ')}</div>`);
      }
    } else {
      summary.push(`<div class="mt-4 mb-2 text-sm text-gray-400">Sem solicitação de recursos ou regiões.</div>`);
    }

    summary.push(`<div class="mt-4 pt-3 border-t border-white/10 text-xs text-gray-400">
      Turno: ${neg.turn} • Enviado em: ${new Date(neg.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
    </div>`);

    this.negResponseTitle.textContent = `📨 Proposta de ${initiator.icon} ${initiator.name}`;
    this.negResponseBody.innerHTML = summary.join('');
    
    this.negResponseModal.classList.remove('hidden');
    
    this.setupNegotiationResponseListeners();
  }

  setupNegotiationResponseListeners() {
    // Remover listeners anteriores se existirem
    if (this.negAcceptBtn) {
      this.negAcceptBtn.replaceWith(this.negAcceptBtn.cloneNode(true));
      this.negAcceptBtn = document.getElementById('negAcceptBtn');
    }
    
    if (this.negDeclineBtn) {
      this.negDeclineBtn.replaceWith(this.negDeclineBtn.cloneNode(true));
      this.negDeclineBtn = document.getElementById('negDeclineBtn');
    }
    
    // Adicionar novos listeners com once:true para evitar múltiplos bindings
    this.negAcceptBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (window.gameLogic && window.gameLogic.handleNegResponse) {
        window.gameLogic.handleNegResponse(true);
      } else {
        console.error('handleNegResponse não encontrado');
      }
    }, { once: true });
    
    this.negDeclineBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (window.gameLogic && window.gameLogic.handleNegResponse) {
        window.gameLogic.handleNegResponse(false);
      } else {
        console.error('handleNegResponse não encontrado');
      }
    }, { once: true });
  }

  clearAllNegotiationFields() {
    // Resetar estado
    resetNegotiationState();
    
    // Limpar todos os containers
    const ids = [
      'offerResourcesContainer',
      'requestResourcesContainer',
      'offerRegions', 
      'reqRegions',
      'negotiationSummary'
    ];
    
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '';
    });
    
    // Resetar valores dos sliders (se existirem)
    document.querySelectorAll('.negotiation-slider').forEach(slider => {
      slider.value = 0;
      // atualizar max caso necessário será feito quando os controles forem recriados
    });
    
    // Resetar valores exibidos
    ['madeira', 'pedra', 'ouro', 'agua'].forEach(resource => {
      const offerValueEl = document.getElementById(`offer_${resource}_value`);
      if (offerValueEl) offerValueEl.textContent = '0';
      
      const requestValueEl = document.getElementById(`request_${resource}_value`);
      if (requestValueEl) requestValueEl.textContent = '0';
    });
    
    // Resetar checkboxes manualmente
    document.querySelectorAll('.negotiation-checkbox').forEach(chk => {
      chk.checked = false;
    });
  }

  // ==================== NOTIFICAÇÕES ====================
  
  showNegotiationNotification(negotiation) {
    const targetPlayer = gameState.players[negotiation.targetId];
    const initiatorPlayer = gameState.players[negotiation.initiatorId];
    
    if (!targetPlayer || !initiatorPlayer) return;
    
    const existingNotification = document.getElementById(`negotiation-notification-${negotiation.id}`);
    if (existingNotification) return;
    
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 z-[90] bg-gray-900/95 border-l-4 border-yellow-500 rounded-lg p-4 shadow-xl max-w-sm animate-slide-in-right';
    notification.id = `negotiation-notification-${negotiation.id}`;
    notification.style.backdropFilter = 'blur(10px)';
    
    const offerSummary = this.getNegotiationSummary(negotiation);
    
    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <span class="text-2xl">🤝</span>
        <div class="flex-1">
          <h4 class="font-semibold text-white">Nova Proposta Recebida!</h4>
          <p class="text-sm text-gray-300 mt-1">
            <span class="text-yellow-300">${initiatorPlayer.icon} ${initiatorPlayer.name}</span> enviou uma proposta
          </p>
          <div class="mt-2 text-xs text-gray-400">
            ${offerSummary}
          </div>
          <div class="mt-3 flex gap-2">
            <button data-action="view" data-negotiation-id="${negotiation.id}" 
                    class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white notification-action-btn">
              Ver Proposta
            </button>
            <button data-action="dismiss" data-negotiation-id="${negotiation.id}" 
                    class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300 notification-action-btn">
              Fechar
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    this.setupNotificationListeners(notification, negotiation.id);
    
    setTimeout(() => {
      this.dismissNotification(negotiation.id);
    }, 30000);
    
    if (targetPlayer.id === gameState.currentPlayerIndex) {
      addActivityLog({
        type: 'negotiate',
        playerName: initiatorPlayer.name,
        action: 'enviou proposta para',
        details: targetPlayer.name,
        turn: gameState.turn,
        isEvent: false,
        isMine: false
      });
    }
  }

  getNegotiationSummary(negotiation) {
    const offerItems = [];
    const requestItems = [];
    
    Object.entries(negotiation.offer).forEach(([key, value]) => {
      if (value > 0 && key !== 'regions' && key !== 'pv') {
        offerItems.push(`${value} ${RESOURCE_ICONS[key] || key}`);
      }
    });
    
    if (negotiation.offer.regions && negotiation.offer.regions.length > 0) {
      offerItems.push(`${negotiation.offer.regions.length} região(ões)`);
    }
    
    Object.entries(negotiation.request).forEach(([key, value]) => {
      if (value > 0 && key !== 'regions' && key !== 'pv') {
        requestItems.push(`${value} ${RESOURCE_ICONS[key] || key}`);
      }
    });
    
    if (negotiation.request.regions && negotiation.request.regions.length > 0) {
      requestItems.push(`${negotiation.request.regions.length} região(ões)`);
    }
    
    let summary = '';
    if (offerItems.length > 0) {
      summary += `<div class="mt-1"><span class="text-green-400">Oferece:</span> ${offerItems.join(', ')}</div>`;
    }
    if (requestItems.length > 0) {
      summary += `<div class="mt-1"><span class="text-red-400">Solicita:</span> ${requestItems.join(', ')}</div>`;
    }
    
    return summary || 'Proposta vazia';
  }

  setupNotificationListeners(notificationElement, negotiationId) {
    const buttons = notificationElement.querySelectorAll('.notification-action-btn');
    
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = button.dataset.action;
        const id = button.dataset.negotiationId;
        
        if (action === 'view') {
          this.viewNegotiation(id);
        } else if (action === 'dismiss') {
          this.dismissNotification(id);
        }
      });
    });
  }

  viewNegotiation(negotiationId) {
    if (!gameState.pendingNegotiations) {
      gameState.pendingNegotiations = [];
      return;
    }
    
    const negotiation = gameState.pendingNegotiations.find(n => n.id === negotiationId);
    if (!negotiation) {
      this.uiManager.modals.showFeedback('Proposta não encontrada.', 'error');
      return;
    }
    
    const currentPlayer = getCurrentPlayer();
    if (currentPlayer.id !== negotiation.targetId) {
      this.uiManager.modals.showFeedback('Esta proposta não é para você.', 'warning');
      return;
    }
    
    setActiveNegotiation(negotiation);
    
    this.presentNegotiationToTarget(negotiation);
    this.dismissNotification(negotiationId);
  }

  dismissNotification(negotiationId) {
    const notification = document.getElementById(`negotiation-notification-${negotiationId}`);
    if (notification) {
      notification.remove();
    }
  }

  // ==================== GERENCIAMENTO ====================

  closeNegotiationModal() {
    console.log('Fechando modal de negociação');
    
    if (this.negotiationModal) {
      this.negotiationModal.classList.add('hidden');
    }
    
    // GARANTIR que o modo modal seja desativado
    if (this.uiManager && this.uiManager.setModalMode) {
      this.uiManager.setModalMode(false);
    }
    
    // Resetar completamente o estado
    resetNegotiationState();
    
    // Limpar todos os campos
    this.clearAllNegotiationFields();
  }

  closeNegResponseModal() {
    console.log('Fechando modal de resposta à negociação');
    
    if (this.negResponseModal) {
      this.negResponseModal.classList.add('hidden');
    }
    
    // GARANTIR que o modo modal seja desativado
    if (this.uiManager && this.uiManager.setModalMode) {
      this.uiManager.setModalMode(false);
    }
  }

  checkPendingNegotiationsForCurrentPlayer() {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return;
    
    const pendingNegotiations = getPendingNegotiationsForPlayer(currentPlayer.id);
    
    if (pendingNegotiations.length > 0) {
      this.showPendingNegotiationsSummary(pendingNegotiations.length);
      
      pendingNegotiations.forEach(negotiation => {
        this.showNegotiationNotification(negotiation);
      });
    }
  }

  showPendingNegotiationsSummary(count) {
    const existingSummary = document.getElementById('pending-negotiations-summary');
    if (existingSummary) {
      existingSummary.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'fixed top-24 right-4 z-[89] bg-blue-900/80 border border-blue-500 rounded-lg p-3 shadow-lg max-w-sm';
    notification.id = 'pending-negotiations-summary';
    
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-xl">📨</span>
        <div>
          <p class="text-sm text-white font-medium">
            Você tem ${count} proposta(s) pendente(s)
          </p>
          <button id="showAllNegotiationsBtn" 
                  class="text-xs text-blue-300 hover:text-blue-200 underline mt-1">
            Ver todas
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    document.getElementById('showAllNegotiationsBtn')?.addEventListener('click', () => {
      this.showPendingNegotiationsModal();
      notification.remove();
    });
    
    setTimeout(() => {
      notification.remove();
    }, 15000);
  }

  showPendingNegotiationsModal() {
    const currentPlayer = getCurrentPlayer();
    const pendingNegotiations = getPendingNegotiationsForPlayer(currentPlayer.id);
    
    if (pendingNegotiations.length === 0) {
      this.uiManager.modals.showFeedback('Nenhuma proposta pendente.', 'info');
      return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-6';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/70"></div>
      <div class="relative w-full max-w-2xl bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl text-yellow-300 font-semibold">📨 Propostas Pendentes</h2>
          <button id="closePendingModalBtn" class="text-gray-300 hover:text-white text-xl">✖</button>
        </div>
        <div class="space-y-3 max-h-[50vh] overflow-y-auto p-2">
          ${pendingNegotiations.map(negotiation => {
            const initiator = gameState.players[negotiation.initiatorId];
            const offerSummary = this.getNegotiationSummary(negotiation);
            
            return `
              <div class="p-4 bg-gray-800/50 rounded-lg border border-white/5 hover:bg-gray-700/50 transition">
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <h3 class="font-semibold text-white flex items-center gap-2">
                      ${initiator.icon} ${initiator.name}
                    </h3>
                    <div class="text-sm text-gray-300 mt-2">
                      ${offerSummary}
                    </div>
                    <p class="text-xs text-gray-400 mt-2">
                      Turno ${negotiation.turn} • ${new Date(negotiation.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <button data-negotiation-id="${negotiation.id}" 
                          class="view-negotiation-btn ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white">
                    Responder
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="mt-6 text-center">
          <button id="closeAllPendingBtn" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300">
            Fechar
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('closePendingModalBtn')?.addEventListener('click', () => {
      modal.remove();
    });
    
    document.getElementById('closeAllPendingBtn')?.addEventListener('click', () => {
      modal.remove();
    });
    
    modal.querySelectorAll('.view-negotiation-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const negotiationId = e.currentTarget.dataset.negotiationId;
        modal.remove();
        this.viewNegotiation(negotiationId);
      });
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
}

export { NegotiationUI };
