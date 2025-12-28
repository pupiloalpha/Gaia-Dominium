// feedback-service.js - Serviço Unificado de Feedback
class FeedbackService {
    static alertTypes = {
        INFO: 'info',
        SUCCESS: 'success',
        WARNING: 'warning',
        ERROR: 'error'
    };

    static showAlert(title, message, type = 'info') {
        const modal = document.getElementById('alertModal');
        if (!modal) {
            console.warn('Modal de alerta não encontrado');
            return this._fallbackAlert(title, message, type);
        }

        const icon = this._getIconForType(type);
        const alertIcon = document.getElementById('alertIcon');
        const alertTitle = document.getElementById('alertTitle');
        const alertMessage = document.getElementById('alertMessage');
        const alertButtons = document.getElementById('alertButtons');

        if (alertIcon) alertIcon.textContent = icon;
        if (alertTitle) alertTitle.textContent = title;
        if (alertMessage) alertMessage.textContent = message;

        this._setupAlertButtons(alertButtons, () => this.hideAlert());

        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('show'), 10);

        return new Promise(resolve => {
            this._currentAlertResolver = resolve;
        });
    }

    static showConfirm(title, message) {
        return new Promise(resolve => {
            const modal = document.getElementById('alertModal');
            if (!modal) {
                resolve(confirm(`${title}\n\n${message}`));
                return;
            }

            const alertIcon = document.getElementById('alertIcon');
            const alertTitle = document.getElementById('alertTitle');
            const alertMessage = document.getElementById('alertMessage');
            const alertButtons = document.getElementById('alertButtons');

            if (alertIcon) alertIcon.textContent = '❓';
            if (alertTitle) alertTitle.textContent = title;
            if (alertMessage) alertMessage.textContent = message;

            let resolved = false;
            
            this._setupConfirmButtons(alertButtons, 
                () => { if (!resolved) { resolved = true; this.hideAlert(); resolve(false); } },
                () => { if (!resolved) { resolved = true; this.hideAlert(); resolve(true); } }
            );

            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.add('show'), 10);
        });
    }

    static showFeedback(message, type = 'info') {
        const title = this._getTitleForType(type);
        return this.showAlert(title, message, type);
    }

    static hideAlert() {
        const modal = document.getElementById('alertModal');
        if (!modal) return;

        modal.classList.remove('show');
        setTimeout(() => {
            modal.classList.add('hidden');
            if (this._currentAlertResolver) {
                this._currentAlertResolver();
                this._currentAlertResolver = null;
            }
        }, 180);
    }

    // Métodos privados
    static _getIconForType(type) {
        const icons = {
            'info': 'ℹ️',
            'warning': '🟡',
            'error': '🔴',
            'success': '🟢'
        };
        return icons[type] || icons.info;
    }

    static _getTitleForType(type) {
        const titles = {
            'info': 'Informação',
            'warning': 'Aviso',
            'error': 'Erro',
            'success': 'Sucesso'
        };
        return titles[type] || 'Informação';
    }

    static _setupAlertButtons(container, onConfirm) {
        if (!container) return;

        container.innerHTML = '';
        const button = document.createElement('button');
        button.className = 'px-4 py-2 bg-gray-800 border border-white/6 rounded-full text-white';
        button.textContent = 'OK';
        button.addEventListener('click', onConfirm);
        container.appendChild(button);
    }

    static _setupConfirmButtons(container, onCancel, onConfirm) {
        if (!container) return;

        container.innerHTML = '';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'px-4 py-2 bg-gray-800 border border-white/6 rounded-full text-white mr-2';
        cancelBtn.textContent = 'Não';
        cancelBtn.addEventListener('click', onCancel);
        
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'px-4 py-2 bg-green-600 rounded-full text-white';
        confirmBtn.textContent = 'Sim';
        confirmBtn.addEventListener('click', onConfirm);
        
        container.appendChild(cancelBtn);
        container.appendChild(confirmBtn);
    }

    static _fallbackAlert(title, message, type) {
        const style = {
            'info': 'color: blue;',
            'warning': 'color: orange;',
            'error': 'color: red;',
            'success': 'color: green;'
        }[type] || '';
        
        console.log(`%c${title}: ${message}`, style);
        alert(`${title}: ${message}`);
    }
}

export { FeedbackService };