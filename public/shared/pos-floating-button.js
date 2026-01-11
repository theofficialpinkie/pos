// POS Floating Button - Decision Engine Trigger
// Injects a floating "Big Decision" button on every POS page

(function() {
    'use strict';

    // Check if already initialized
    if (window.POS_FLOATING_BUTTON_INITIALIZED) {
        return;
    }
    window.POS_FLOATING_BUTTON_INITIALIZED = true;

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        // Load required dependencies
        loadDependencies();

        // Create floating button
        createFloatingButton();
    }

    function loadDependencies() {
        // Load CSS if not already loaded
        if (!document.querySelector('link[href*="pos-unified.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'styles/pos-unified.css';
            document.head.appendChild(link);
        }

        // Load storage.js if not already loaded
        if (!document.querySelector('script[src*="pos-storage.js"]')) {
            const script = document.createElement('script');
            script.src = 'shared/pos-storage.js';
            document.head.appendChild(script);
        }

        // Load API.js if not already loaded
        if (!document.querySelector('script[src*="pos-api.js"]')) {
            const script = document.createElement('script');
            script.src = 'shared/pos-api.js';
            document.head.appendChild(script);
        }

        // Load decision engine if not already loaded
        if (!document.querySelector('script[src*="pos-decision-engine.js"]')) {
            const script = document.createElement('script');
            script.src = 'shared/pos-decision-engine.js';
            document.head.appendChild(script);
        }
    }

    function createFloatingButton() {
        // Check if button already exists
        if (document.getElementById('pos-floating-btn')) {
            return;
        }

        // Create button HTML
        const button = document.createElement('button');
        button.id = 'pos-floating-btn';
        button.className = 'pos-floating-decision';
        button.setAttribute('aria-label', 'Make a big decision');
        button.innerHTML = `
            🧠
            <span class="pos-button-label">Big Decision</span>
        `;

        // Add click handler
        button.addEventListener('click', openDecisionEngine);

        // Append to body
        document.body.appendChild(button);
    }

    function openDecisionEngine() {
        // Ensure decision engine is initialized
        if (!window.posDecisionEngine) {
            console.error('Decision engine not initialized yet');
            // Try to initialize it
            window.posDecisionEngine = new DecisionEngine();
        }

        // Wait a tick to ensure it's ready
        setTimeout(() => {
            if (window.posDecisionEngine) {
                window.posDecisionEngine.open();
            } else {
                alert('Decision engine is loading. Please try again in a moment.');
            }
        }, 100);
    }

})();
