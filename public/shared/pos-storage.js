// POS Shared Storage - LocalStorage Manager
// Provides unified access to data across year.html, year-review.html, and dashboard

// Storage keys
const STORAGE_KEYS = {
    YEAR_COMPREHENSIVE: 'yearReset2026',      // year.html data
    YEAR_REVIEW: 'yearReview',                // year-review.html data
    VISION: 'visionData',                     // vision.html data
    PRINCIPLES: 'pos_unified_principles',     // Generated principles
    DECISIONS: 'pos_decision_history',        // Decision history
    DASHBOARD_CONFIG: 'pos_dashboard_config', // Dashboard preferences
    SPRINTS: 'pos_sprints',                   // Sprint data: { sprints: Sprint[] }
    ACTIVE_SPRINT: 'pos_active_sprint'        // Active sprint ID: string
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

// ===== SPRINT STORAGE FUNCTIONS =====

// Get all sprints from localStorage
function getSprints() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.SPRINTS);
        if (!data) {
            return { sprints: [] };
        }
        return JSON.parse(data);
    } catch (e) {
        console.error('Error loading sprints:', e);
        return { sprints: [] };
    }
}

// Save sprints to localStorage
function saveSprints(sprintsData) {
    try {
        localStorage.setItem(STORAGE_KEYS.SPRINTS, JSON.stringify(sprintsData));
        return true;
    } catch (e) {
        console.error('Error saving sprints:', e);
        return false;
    }
}

// Get currently active sprint
function getActiveSprint() {
    try {
        const activeSprintId = localStorage.getItem(STORAGE_KEYS.ACTIVE_SPRINT);
        if (!activeSprintId) return null;

        const sprints = getSprints();
        return sprints.sprints.find(s => s.id === activeSprintId) || null;
    } catch (e) {
        console.error('Error loading active sprint:', e);
        return null;
    }
}

// Set active sprint, mark others as completed
function setActiveSprint(sprintId) {
    try {
        const sprints = getSprints();

        // Mark all other sprints as completed
        sprints.sprints.forEach(s => {
            if (s.id !== sprintId && s.status === 'active') {
                s.status = 'completed';
                s.updatedAt = new Date().toISOString();
            }
        });

        // Set the new active sprint
        const sprint = sprints.sprints.find(s => s.id === sprintId);
        if (sprint) {
            sprint.status = 'active';
            sprint.updatedAt = new Date().toISOString();
        }

        saveSprints(sprints);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SPRINT, sprintId);
        return true;
    } catch (e) {
        console.error('Error setting active sprint:', e);
        return false;
    }
}

// Create new sprint with auto-generated ID
function createSprint(sprintData) {
    try {
        const sprints = getSprints();

        const newSprint = {
            id: `sprint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: sprintData.name || '',
            description: sprintData.description || '',

            // Execution-focused fields
            bigMove: sprintData.bigMove || '',
            workGoals: sprintData.workGoals || [],
            lifeGoals: sprintData.lifeGoals || [],
            uplevelActions: sprintData.uplevelActions || [],
            goalActions: sprintData.goalActions || [],
            lifeUplevelActions: sprintData.lifeUplevelActions || [],
            simplicityCheck: sprintData.simplicityCheck || '',
            metrics: sprintData.metrics || [],
            excitement: sprintData.excitement || '',

            status: 'active',
            startDate: sprintData.startDate || '',
            endDate: sprintData.endDate || '',
            durationWeeks: sprintData.durationWeeks || 0,
            uplevelIds: sprintData.uplevelIds || [],
            milestones: (sprintData.milestones || []).map((m, i) => ({
                id: `milestone_${Date.now()}_${i}`,
                text: m.text || m,
                category: m.category || 'general',
                completed: m.completed || false,
                completedDate: m.completedDate || null,
                weeklyGoalLinks: m.weeklyGoalLinks || []
            })),
            weeklyCommitments: sprintData.weeklyCommitments || [],
            philosophy: sprintData.philosophy || '',
            progress: {
                milestonesCompleted: 0,
                milestonesTotal: (sprintData.milestones || []).length,
                weeklyGoalsCompleted: 0,
                weeklyGoalsTotal: 0,
                percentComplete: 0
            },
            retrospective: {
                retroId: null,
                completedDate: null
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdFrom: sprintData.createdFrom || null
        };

        sprints.sprints.push(newSprint);
        saveSprints(sprints);
        setActiveSprint(newSprint.id);

        return newSprint.id;
    } catch (e) {
        console.error('Error creating sprint:', e);
        return null;
    }
}

// Update sprint and recalculate progress
function updateSprint(sprintId, updates) {
    try {
        const sprints = getSprints();
        const sprint = sprints.sprints.find(s => s.id === sprintId);

        if (!sprint) {
            console.error('Sprint not found:', sprintId);
            return false;
        }

        // Apply updates
        Object.assign(sprint, updates);
        sprint.updatedAt = new Date().toISOString();

        // Recalculate progress
        if (sprint.milestones) {
            const milestonesCompleted = sprint.milestones.filter(m => m.completed).length;
            const milestonesTotal = sprint.milestones.length;

            // Count weekly goal links
            let weeklyGoalsTotal = 0;
            let weeklyGoalsCompleted = 0;
            sprint.milestones.forEach(m => {
                if (m.weeklyGoalLinks && m.weeklyGoalLinks.length > 0) {
                    weeklyGoalsTotal += m.weeklyGoalLinks.length;
                    m.weeklyGoalLinks.forEach(link => {
                        // Check if the linked goal is completed
                        const weekKey = link.weekKey;
                        const goalId = link.goalId;
                        const dashboardState = JSON.parse(localStorage.getItem(`dashboardState-${weekKey}`) || '{}');
                        if (dashboardState.goals) {
                            const goal = dashboardState.goals.find(g => g.id === goalId);
                            if (goal && goal.completed) {
                                weeklyGoalsCompleted++;
                            }
                        }
                    });
                }
            });

            sprint.progress = {
                milestonesCompleted,
                milestonesTotal,
                weeklyGoalsCompleted,
                weeklyGoalsTotal,
                percentComplete: milestonesTotal > 0
                    ? Math.round((milestonesCompleted / milestonesTotal) * 100)
                    : 0
            };
        }

        saveSprints(sprints);
        return true;
    } catch (e) {
        console.error('Error updating sprint:', e);
        return false;
    }
}

// Toggle milestone completion
function toggleMilestone(sprintId, milestoneId) {
    try {
        const sprints = getSprints();
        const sprint = sprints.sprints.find(s => s.id === sprintId);

        if (!sprint) return false;

        const milestone = sprint.milestones.find(m => m.id === milestoneId);
        if (!milestone) return false;

        milestone.completed = !milestone.completed;
        milestone.completedDate = milestone.completed ? new Date().toISOString() : null;

        updateSprint(sprintId, { milestones: sprint.milestones });
        return true;
    } catch (e) {
        console.error('Error toggling milestone:', e);
        return false;
    }
}

// Link weekly goal to milestone
function linkGoalToMilestone(sprintId, milestoneId, weekKey, goalId) {
    try {
        const sprints = getSprints();
        const sprint = sprints.sprints.find(s => s.id === sprintId);

        if (!sprint) return false;

        const milestone = sprint.milestones.find(m => m.id === milestoneId);
        if (!milestone) return false;

        // Check if link already exists
        const existingLink = milestone.weeklyGoalLinks.find(
            l => l.weekKey === weekKey && l.goalId === goalId
        );

        if (!existingLink) {
            milestone.weeklyGoalLinks.push({ weekKey, goalId });
            updateSprint(sprintId, { milestones: sprint.milestones });
        }

        return true;
    } catch (e) {
        console.error('Error linking goal to milestone:', e);
        return false;
    }
}

// Update sprint progress from weekly task completion
function updateSprintProgressFromWeekly(weekKey) {
    try {
        const sprints = getSprints();

        // Update progress for all sprints that have links to this week
        sprints.sprints.forEach(sprint => {
            const hasLinksToThisWeek = sprint.milestones.some(m =>
                m.weeklyGoalLinks.some(l => l.weekKey === weekKey)
            );

            if (hasLinksToThisWeek) {
                updateSprint(sprint.id, {});
            }
        });

        return true;
    } catch (e) {
        console.error('Error updating sprint progress:', e);
        return false;
    }
}

// Link uplevel to sprint
function linkUplevelToSprint(sprintId, uplevelIndex) {
    try {
        const sprints = getSprints();
        const sprint = sprints.sprints.find(s => s.id === sprintId);

        if (!sprint) return false;

        const uplevelId = `uplevel_${uplevelIndex}`;
        if (!sprint.uplevelIds.includes(uplevelId)) {
            sprint.uplevelIds.push(uplevelId);
            updateSprint(sprintId, { uplevelIds: sprint.uplevelIds });
        }

        return true;
    } catch (e) {
        console.error('Error linking uplevel to sprint:', e);
        return false;
    }
}

// Get all sprints for an uplevel
function getSprintsForUplevel(uplevelIndex) {
    try {
        const sprints = getSprints();
        const uplevelId = `uplevel_${uplevelIndex}`;

        return sprints.sprints.filter(s => s.uplevelIds.includes(uplevelId));
    } catch (e) {
        console.error('Error getting sprints for uplevel:', e);
        return [];
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
        saveDashboardConfig,
        // Sprint functions
        getSprints,
        saveSprints,
        getActiveSprint,
        setActiveSprint,
        createSprint,
        updateSprint,
        toggleMilestone,
        linkGoalToMilestone,
        updateSprintProgressFromWeekly,
        linkUplevelToSprint,
        getSprintsForUplevel
    };
}
