// POS Decision Engine
// Helps users make big decisions aligned with their principles

class DecisionEngine {
    constructor() {
        this.currentStep = 1;
        this.decision = {
            decision: '',
            firstInstinct: '',
            biggestFear: '',
            aiQuestions: [],
            userAnswers: [],
            analysis: null,
            recommendation: null,
            selfAbandonmentCheck: null
        };
        this.init();
    }

    init() {
        this.createModal();
        this.attachEvents();
    }

    createModal() {
        const modalHTML = `
            <div class="pos-modal-overlay" id="pos-decision-modal">
                <div class="pos-modal" style="max-width: 700px;">
                    <div class="pos-modal-header">
                        <h2 id="pos-decision-title">Make a Big Decision</h2>
                    </div>
                    <div class="pos-modal-body" id="pos-decision-body">
                        <!-- Dynamic content -->
                    </div>
                    <div class="pos-modal-footer" id="pos-decision-footer">
                        <!-- Dynamic buttons -->
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    attachEvents() {
        const overlay = document.getElementById('pos-decision-modal');
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
            }
        });
    }

    open() {
        this.currentStep = 1;
        this.decision = {
            decision: '',
            firstInstinct: '',
            biggestFear: '',
            aiQuestions: [],
            userAnswers: [],
            analysis: null,
            recommendation: null,
            selfAbandonmentCheck: null
        };
        this.renderStep1();
        document.getElementById('pos-decision-modal').classList.add('active');
    }

    close() {
        document.getElementById('pos-decision-modal').classList.remove('active');
    }

    renderStep1() {
        const body = document.getElementById('pos-decision-body');
        const footer = document.getElementById('pos-decision-footer');

        document.getElementById('pos-decision-title').textContent = 'Make a Big Decision';

        body.innerHTML = `
            <div class="pos-form-group">
                <label class="pos-form-label">What decision are you facing?</label>
                <textarea
                    class="pos-textarea"
                    id="pos-input-decision"
                    placeholder="e.g., Should I take the NYC job offer? Should I start my own business?"
                >${this.decision.decision}</textarea>
            </div>

            <div class="pos-form-group">
                <label class="pos-form-label">What's your first instinct?</label>
                <textarea
                    class="pos-textarea"
                    id="pos-input-instinct"
                    placeholder="What does your gut tell you? Be honest."
                    style="min-height: 80px;"
                >${this.decision.firstInstinct}</textarea>
            </div>

            <div class="pos-form-group">
                <label class="pos-form-label">What's your biggest fear about this decision?</label>
                <textarea
                    class="pos-textarea"
                    id="pos-input-fear"
                    placeholder="What keeps you up at night thinking about this?"
                    style="min-height: 80px;"
                >${this.decision.biggestFear}</textarea>
            </div>
        `;

        footer.innerHTML = `
            <button class="pos-btn pos-btn-secondary" onclick="posDecisionEngine.close()">Cancel</button>
            <button class="pos-btn pos-btn-primary" onclick="posDecisionEngine.proceedToStep2()">
                Analyze with AI →
            </button>
        `;
    }

    async proceedToStep2() {
        // Collect input
        this.decision.decision = document.getElementById('pos-input-decision').value.trim();
        this.decision.firstInstinct = document.getElementById('pos-input-instinct').value.trim();
        this.decision.biggestFear = document.getElementById('pos-input-fear').value.trim();

        // Validate
        if (!this.decision.decision) {
            alert('Please describe the decision you\'re facing.');
            return;
        }

        // Check for principles
        if (!principlesExist()) {
            const generate = confirm('You need principles to use the decision engine.\n\nGenerate principles now from your year data?');
            if (generate) {
                this.close();
                // Navigate to dashboard to generate principles
                window.location.href = 'year-dashboard.html';
            }
            return;
        }

        // Generate custom questions
        this.currentStep = 2;
        await this.generateQuestions();
    }

    async generateQuestions() {
        const body = document.getElementById('pos-decision-body');
        const footer = document.getElementById('pos-decision-footer');

        document.getElementById('pos-decision-title').textContent = 'Answer These Questions';

        body.innerHTML = `
            <p class="pos-text-secondary" style="margin-bottom: 24px;">
                To give you the best guidance, I need to understand your decision better.
                Please answer these questions:
            </p>
            <div style="text-align: center; padding: 40px;">
                <div class="pos-loading" style="width: 40px; height: 40px; border-width: 3px; border-top-color: var(--poppy-primary);"></div>
                <p style="margin-top: 16px; color: var(--text-secondary);">Generating custom questions...</p>
            </div>
        `;

        footer.innerHTML = '';

        try {
            const apiKey = getAPIKey() || promptForAPIKey();
            if (!apiKey) {
                throw new Error('API key required');
            }

            // Get weighted principles, values, and goals
            const principles = getWeightedPrinciples();
            const visionData = getVisionData();
            const values = visionData.values.filter(v => v && v.trim()).slice(0, 5);

            // Get goals from year data
            const yearData = getYearData();
            const planning = yearData.planning || {};
            const goals = [];
            const bigGoal = planning.bigmove || planning['goal-1'] || '';
            if (bigGoal) goals.push(bigGoal);
            for (let i = 1; i <= 5; i++) {
                const goal = planning[`goal-${i}`];
                if (goal && goal !== bigGoal && goal.trim()) {
                    goals.push(goal);
                }
            }

            // Build values context
            let valuesText = '';
            if (values.length > 0) {
                valuesText = `\n\nTheir core values:\n${values.map((v, i) => `${i + 1}. ${v}`).join('\n')}`;
            }

            // Build goals context
            let goalsText = '';
            if (goals.length > 0) {
                goalsText = `\n\nTheir 2026 goals (CRITICAL - decisions should align with these):\n${goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}`;
            }

            // Build prompt
            const systemMessage = `You are a decision coach helping someone make an important life decision based on their goals, values, and principles.`;

            const userPrompt = `The person is facing this decision:
"${this.decision.decision}"

Their first instinct: "${this.decision.firstInstinct || 'Not specified'}"
Their biggest fear: "${this.decision.biggestFear || 'Not specified'}"
${goalsText}
${valuesText}

Their guiding principles (weighted by importance):
${principles.map((p, i) => `${i + 1}. [Weight: ${p.weight}x] ${p.text}`).join('\n')}

Generate THE ONE MOST POWERFUL QUESTION that will help them make this decision. This question should:
- Cut to the core of what really matters
- Surface the key tension between instinct and fear
- Reference their most relevant principles
- Force them to confront what they're avoiding
- Be impossible to answer superficially

Return ONLY valid JSON:
{
  "questions": [
    "The one most powerful question here"
  ]
}`;

            const response = await callOpenAI(userPrompt, systemMessage, { maxTokens: 1000 });
            const data = parseAIJSON(response);

            this.decision.aiQuestions = data.questions || [];
            this.renderStep2Questions();

        } catch (error) {
            console.error('Error generating questions:', error);
            body.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--error);">
                    <p><strong>Error generating questions</strong></p>
                    <p style="margin-top: 8px; font-size: 14px;">${error.message}</p>
                </div>
            `;
            footer.innerHTML = `
                <button class="pos-btn pos-btn-secondary" onclick="posDecisionEngine.renderStep1()">← Back</button>
                <button class="pos-btn pos-btn-primary" onclick="posDecisionEngine.generateQuestions()">Try Again</button>
            `;
        }
    }

    renderStep2Questions() {
        const body = document.getElementById('pos-decision-body');
        const footer = document.getElementById('pos-decision-footer');

        let questionsHTML = '';
        this.decision.aiQuestions.forEach((q, i) => {
            questionsHTML += `
                <div class="pos-form-group">
                    <label class="pos-form-label">${i + 1}. ${q}</label>
                    <textarea
                        class="pos-textarea"
                        id="pos-answer-${i}"
                        placeholder="Your answer..."
                        style="min-height: 80px;"
                    >${this.decision.userAnswers[i] || ''}</textarea>
                </div>
            `;
        });

        body.innerHTML = `
            <p class="pos-text-secondary" style="margin-bottom: 24px;">
                These questions will help surface what really matters:
            </p>
            ${questionsHTML}
        `;

        footer.innerHTML = `
            <button class="pos-btn pos-btn-secondary" onclick="posDecisionEngine.renderStep1()">← Back</button>
            <button class="pos-btn pos-btn-primary" onclick="posDecisionEngine.proceedToStep3()">
                Get Recommendation →
            </button>
        `;
    }

    async proceedToStep3() {
        // Collect answers
        this.decision.userAnswers = [];
        for (let i = 0; i < this.decision.aiQuestions.length; i++) {
            const answer = document.getElementById(`pos-answer-${i}`).value.trim();
            this.decision.userAnswers.push(answer);
        }

        // Generate analysis
        this.currentStep = 3;
        await this.generateAnalysis();
    }

    async generateAnalysis() {
        const body = document.getElementById('pos-decision-body');
        const footer = document.getElementById('pos-decision-footer');

        document.getElementById('pos-decision-title').textContent = 'Your Guidance';

        body.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div class="pos-loading" style="width: 40px; height: 40px; border-width: 3px; border-top-color: var(--poppy-primary);"></div>
                <p style="margin-top: 16px; color: var(--text-secondary);">Analyzing your decision...</p>
            </div>
        `;

        footer.innerHTML = '';

        try {
            const apiKey = getAPIKey();
            const principles = getWeightedPrinciples();
            const visionData = getVisionData();
            const values = visionData.values.filter(v => v && v.trim()).slice(0, 5);

            // Get goals from year data
            const yearData = getYearData();
            const planning = yearData.planning || {};
            const goals = [];
            const bigGoal = planning.bigmove || planning['goal-1'] || '';
            if (bigGoal) goals.push(bigGoal);
            for (let i = 1; i <= 5; i++) {
                const goal = planning[`goal-${i}`];
                if (goal && goal !== bigGoal && goal.trim()) {
                    goals.push(goal);
                }
            }

            // Build values context
            let valuesText = '';
            if (values.length > 0) {
                valuesText = `\n\nTheir core values:\n${values.map((v, i) => `${i + 1}. ${v}`).join('\n')}`;
            }

            // Build goals context
            let goalsText = '';
            if (goals.length > 0) {
                goalsText = `\n\nTheir 2026 goals (CRITICAL - decisions should align with these):\n${goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}`;
            }

            const systemMessage = `You are a thoughtful decision coach. Analyze the decision based on the person's GOALS (most important), values, and principles, and provide clear, actionable guidance.`;

            const userPrompt = `Decision: "${this.decision.decision}"

First instinct: "${this.decision.firstInstinct || 'Not specified'}"
Biggest fear: "${this.decision.biggestFear || 'Not specified'}"
${goalsText}
${valuesText}

Their guiding principles (weighted by importance):
${principles.map((p, i) => `${i + 1}. [${p.weight}x] ${p.text}`).join('\n')}

Questions and answers:
${this.decision.aiQuestions.map((q, i) => `Q${i + 1}: ${q}\nA${i + 1}: ${this.decision.userAnswers[i] || 'Not answered'}`).join('\n\n')}

Provide:
1. **Analysis**: How this decision aligns (or conflicts) with their 2026 GOALS (most critical), core values, and weighted principles. Be specific and reference actual goals, values, and principles.
2. **Recommendation**: Give a CLEAR, DIRECT answer (Yes or No). No conditional answers. Make a call based primarily on whether this advances their goals.
3. **Self-Abandonment Check**: Is this decision aligned with who they want to be (their goals and values)? Or does it contradict them?

IMPORTANT: Be decisive. Give a clear Yes or No, not a conditional. They need clarity, not more options. GOALS should be the primary deciding factor, followed by values and principles.

Return ONLY valid JSON:
{
  "analysis": "Detailed analysis referencing specific principles...",
  "recommendation": "Yes / No",
  "actionSteps": "If Yes, what are the 2-3 immediate next steps. If No, what should they do instead.",
  "selfAbandonmentCheck": "Aligned / Warning",
  "selfAbandonmentReasoning": "Why this is or isn't self-abandonment"
}`;

            const response = await callOpenAI(userPrompt, systemMessage, { maxTokens: 1500 });
            const data = parseAIJSON(response);

            this.decision.analysis = data.analysis;
            this.decision.recommendation = data.recommendation;
            this.decision.actionSteps = data.actionSteps;
            this.decision.selfAbandonmentCheck = data.selfAbandonmentCheck;
            this.decision.selfAbandonmentReasoning = data.selfAbandonmentReasoning;

            this.renderStep3Results();

        } catch (error) {
            console.error('Error generating analysis:', error);
            body.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--error);">
                    <p><strong>Error analyzing decision</strong></p>
                    <p style="margin-top: 8px; font-size: 14px;">${error.message}</p>
                </div>
            `;
            footer.innerHTML = `
                <button class="pos-btn pos-btn-secondary" onclick="posDecisionEngine.renderStep2Questions()">← Back</button>
                <button class="pos-btn pos-btn-primary" onclick="posDecisionEngine.generateAnalysis()">Try Again</button>
            `;
        }
    }

    renderStep3Results() {
        const body = document.getElementById('pos-decision-body');
        const footer = document.getElementById('pos-decision-footer');

        const isAligned = this.decision.selfAbandonmentCheck === 'Aligned';
        const checkIcon = isAligned ? '✓' : '⚠️';
        const checkColor = isAligned ? 'var(--success)' : 'var(--warning)';

        body.innerHTML = `
            <div style="background: ${this.decision.recommendation === 'Yes' ? 'var(--poppy-light)' : '#f5f5f5'}; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 8px; font-size: 24px; font-weight: 700;">
                    ${this.decision.recommendation}
                </h3>
            </div>

            <div style="margin-bottom: 24px;">
                <h4 style="margin: 0 0 12px; font-size: 16px; font-weight: 600;">Analysis</h4>
                <p style="line-height: 1.6; color: var(--text);">${this.decision.analysis}</p>
            </div>

            ${this.decision.actionSteps ? `
            <div style="margin-bottom: 24px; background: #f9f9f9; padding: 20px; border-radius: 8px;">
                <h4 style="margin: 0 0 12px; font-size: 16px; font-weight: 600;">Next Steps</h4>
                <p style="line-height: 1.6; color: var(--text);">${this.decision.actionSteps}</p>
            </div>
            ` : ''}

            <div style="border-top: 1px solid var(--border); padding-top: 24px;">
                <h4 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 24px;">${checkIcon}</span>
                    Self-Abandonment Check
                </h4>
                <p style="line-height: 1.6; color: var(--text);">
                    <strong style="color: ${checkColor};">${this.decision.selfAbandonmentCheck}</strong>
                    ${this.decision.selfAbandonmentReasoning ? ` - ${this.decision.selfAbandonmentReasoning}` : ''}
                </p>
            </div>
        `;

        footer.innerHTML = `
            <button class="pos-btn pos-btn-secondary" onclick="posDecisionEngine.close()">Close</button>
            <button class="pos-btn pos-btn-primary" onclick="posDecisionEngine.saveDecision()">
                Save Decision
            </button>
        `;
    }

    saveDecision() {
        const decisionId = saveDecision(this.decision);
        if (decisionId) {
            alert('Decision saved to your history!');
            this.close();
        } else {
            alert('Error saving decision. Please try again.');
        }
    }
}

// Initialize global instance
let posDecisionEngine;

if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        posDecisionEngine = new DecisionEngine();
    });

    // Make it globally accessible
    window.posDecisionEngine = posDecisionEngine;
}
