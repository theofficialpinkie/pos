// POS Shared Storage - LocalStorage Manager
// Provides unified access to data across year.html, year-review.html, and dashboard

// Storage keys
const STORAGE_KEYS = {
    YEAR_COMPREHENSIVE: 'yearReset2026',      // year.html data
    YEAR_REVIEW: 'yearReview',                // year-review.html data
    VISION: 'visionData',                     // vision.html data
    PRINCIPLES: 'pos_unified_principles',     // Generated principles
    DECISIONS: 'pos_decision_history',        // Decision history
    DASHBOARD_CONFIG: 'pos_dashboard_config'  // Dashboard preferences
};

// Get year.html comprehensive data
function getYearData() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.YEAR_COMPREHENSIVE);
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.error('Error loading year data:', e);
        return {};
    }
}

// Get year-review.html reflection data
function getYearReviewData() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.YEAR_REVIEW);
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.error('Error loading year review data:', e);
        return {};
    }
}

// Get vision.html data
function getVisionData() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.VISION);
        if (!data) {
            return {
                oneliner: '',
                values: [],
                boundaries: [],
                principles: [],
                routines: [],
                uplevel: []
            };
        }
        return JSON.parse(data);
    } catch (e) {
        console.error('Error loading vision data:', e);
        return {
            oneliner: '',
            values: [],
            boundaries: [],
            principles: [],
            routines: [],
            uplevel: []
        };
    }
}

// Get principles (with default structure)
function getPrinciples() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.PRINCIPLES);
        if (!data) {
            return {
                generatedAt: null,
                lastRefreshed: null,
                comprehensive: [],
                priority: [],
                userNotes: ''
            };
        }
        return JSON.parse(data);
    } catch (e) {
        console.error('Error loading principles:', e);
        return {
            generatedAt: null,
            lastRefreshed: null,
            comprehensive: [],
            priority: [],
            userNotes: ''
        };
    }
}

// Save principles
function savePrinciples(principles) {
    try {
        localStorage.setItem(STORAGE_KEYS.PRINCIPLES, JSON.stringify(principles));
        return true;
    } catch (e) {
        console.error('Error saving principles:', e);
        return false;
    }
}

// Get decision history
function getDecisions() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.DECISIONS);
        if (!data) {
            return { decisions: [] };
        }
        return JSON.parse(data);
    } catch (e) {
        console.error('Error loading decisions:', e);
        return { decisions: [] };
    }
}

// Save a decision to history
function saveDecision(decision) {
    try {
        const history = getDecisions();

        // Add new decision with generated ID
        decision.id = decision.id || `dec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        decision.timestamp = decision.timestamp || new Date().toISOString();

        history.decisions.unshift(decision); // Add to beginning

        // Keep only last 50 decisions
        if (history.decisions.length > 50) {
            history.decisions = history.decisions.slice(0, 50);
        }

        localStorage.setItem(STORAGE_KEYS.DECISIONS, JSON.stringify(history));
        return decision.id;
    } catch (e) {
        console.error('Error saving decision:', e);
        return null;
    }
}

// Get weighted principles (combines comprehensive + priority with weights)
function getWeightedPrinciples() {
    const principles = getPrinciples();

    const weighted = [
        ...principles.comprehensive.map(p => ({ ...p, weight: 1.0, source: 'comprehensive' })),
        ...principles.priority.map(p => ({ ...p, weight: 2.5, source: 'priority' }))
    ];

    // Sort by weight descending (priority first)
    weighted.sort((a, b) => b.weight - a.weight);

    return weighted;
}

// Edit a principle by ID
function editPrinciple(principleId, newText) {
    const principles = getPrinciples();

    // Search in comprehensive
    const compIndex = principles.comprehensive.findIndex(p => p.id === principleId);
    if (compIndex !== -1) {
        principles.comprehensive[compIndex].text = newText;
        principles.comprehensive[compIndex].userEdited = true;
        savePrinciples(principles);
        return true;
    }

    // Search in priority
    const prioIndex = principles.priority.findIndex(p => p.id === principleId);
    if (prioIndex !== -1) {
        principles.priority[prioIndex].text = newText;
        principles.priority[prioIndex].userEdited = true;
        savePrinciples(principles);
        return true;
    }

    return false;
}

// Delete a principle by ID
function deletePrinciple(principleId) {
    const principles = getPrinciples();

    principles.comprehensive = principles.comprehensive.filter(p => p.id !== principleId);
    principles.priority = principles.priority.filter(p => p.id !== principleId);

    savePrinciples(principles);
    return true;
}

// Add a custom principle
function addCustomPrinciple(text, category = 'comprehensive', weight = 1.0) {
    const principles = getPrinciples();

    const newPrinciple = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: text,
        source: 'user-added',
        sourceFields: [],
        weight: weight,
        category: category,
        userEdited: true
    };

    if (category === 'priority' || weight > 1.0) {
        principles.priority.push(newPrinciple);
    } else {
        principles.comprehensive.push(newPrinciple);
    }

    savePrinciples(principles);
    return newPrinciple.id;
}

// Check if principles exist
function principlesExist() {
    const principles = getPrinciples();
    return principles.comprehensive.length > 0 || principles.priority.length > 0;
}

// Check if data exists for dashboard
function hasYearData() {
    const yearData = getYearData();
    const reviewData = getYearReviewData();
    return (
        (yearData.retro && Object.keys(yearData.retro).length > 0) ||
        (yearData.planning && Object.keys(yearData.planning).length > 0) ||
        (reviewData.reflection && Object.keys(reviewData.reflection).length > 0) ||
        (reviewData.planning && Object.keys(reviewData.planning).length > 0)
    );
}

// Get dashboard config
function getDashboardConfig() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.DASHBOARD_CONFIG);
        return data ? JSON.parse(data) : {
            lastVisit: null,
            onboardingComplete: false
        };
    } catch (e) {
        return {
            lastVisit: null,
            onboardingComplete: false
        };
    }
}

// Save dashboard config
function saveDashboardConfig(config) {
    try {
        localStorage.setItem(STORAGE_KEYS.DASHBOARD_CONFIG, JSON.stringify(config));
        return true;
    } catch (e) {
        console.error('Error saving dashboard config:', e);
        return false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        STORAGE_KEYS,
        getYearData,
        getYearReviewData,
        getVisionData,
        getPrinciples,
        savePrinciples,
        getDecisions,
        saveDecision,
        getWeightedPrinciples,
        editPrinciple,
        deletePrinciple,
        addCustomPrinciple,
        principlesExist,
        hasYearData,
        getDashboardConfig,
        saveDashboardConfig
    };
}
