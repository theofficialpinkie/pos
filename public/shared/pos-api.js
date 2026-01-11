// POS Shared API - OpenAI Integration
// Manages API keys and provides unified OpenAI API access across all POS features

const API_KEY_STORAGE = 'pos_openai_key';

// Simple encryption for API key storage (base64)
function simpleEncrypt(text) {
    return btoa(unescape(encodeURIComponent(text)));
}

function simpleDecrypt(encoded) {
    return decodeURIComponent(escape(atob(encoded)));
}

// Save API key with encryption
function saveAPIKey(key) {
    const encrypted = simpleEncrypt(key);
    localStorage.setItem(API_KEY_STORAGE, encrypted);
}

// Get decrypted API key from storage
function getAPIKey() {
    const encrypted = localStorage.getItem(API_KEY_STORAGE);
    if (encrypted) {
        try {
            return simpleDecrypt(encrypted);
        } catch (e) {
            // If decryption fails, clear the corrupted key
            localStorage.removeItem(API_KEY_STORAGE);
            return null;
        }
    }
    return null;
}

// Prompt user for API key with option to reuse existing
function promptForAPIKey() {
    const existingKey = getAPIKey();
    if (existingKey) {
        const masked = existingKey.substring(0, 7) + '...' + existingKey.substring(existingKey.length - 4);
        const useExisting = confirm(`Use existing API key (${masked})?\n\nClick OK to use it, or Cancel to enter a new one.`);
        if (useExisting) return existingKey;
    }
    const newKey = prompt('Enter your OpenAI API key:\n\n(It will be encrypted and stored locally)');
    if (newKey && newKey.trim()) {
        saveAPIKey(newKey.trim());
        return newKey.trim();
    }
    return null;
}

// Unified OpenAI API wrapper
async function callOpenAI(userPrompt, systemMessage = 'You are a helpful assistant.', options = {}) {
    const apiKey = getAPIKey();
    if (!apiKey) {
        throw new Error('API key required. Please set your OpenAI API key.');
    }

    const model = options.model || 'gpt-4o-mini';
    const temperature = options.temperature || 0.7;
    const maxTokens = options.maxTokens || 2000;

    const messages = [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userPrompt }
    ];

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: temperature,
                max_tokens: maxTokens
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'OpenAI API error');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI API call failed:', error);
        throw error;
    }
}

// Parse JSON response from AI (handles markdown code blocks)
function parseAIJSON(response) {
    try {
        // Try direct parse first
        return JSON.parse(response);
    } catch (e) {
        // Try extracting from markdown code block
        const jsonMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[1]);
        }
        // Try finding first { to last }
        const firstBrace = response.indexOf('{');
        const lastBrace = response.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            return JSON.parse(response.substring(firstBrace, lastBrace + 1));
        }
        throw new Error('Could not parse JSON from AI response');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        simpleEncrypt,
        simpleDecrypt,
        saveAPIKey,
        getAPIKey,
        promptForAPIKey,
        callOpenAI,
        parseAIJSON
    };
}
