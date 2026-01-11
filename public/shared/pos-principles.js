// POS Principles Generation System
// Extracts actionable principles from year.html and year-review.html data

// Generate principles from both comprehensive and priority data
async function generatePrinciples(yearData, yearReviewData, apiKey, onProgress) {
    if (!apiKey) {
        const key = promptForAPIKey();
        if (!key) throw new Error('API key required to generate principles');
        apiKey = key;
    }

    if (onProgress) onProgress('Building context from your year data...');

    // Build comprehensive context from year.html
    const comprehensiveContext = buildComprehensiveContext(yearData);

    // Build priority context from year-review.html
    const priorityContext = buildPriorityContext(yearReviewData);

    // Build values context from vision.html
    const visionData = getVisionData();
    const valuesContext = buildValuesContext(visionData);

    if (onProgress) onProgress('Analyzing patterns and extracting principles...');

    // Generate comprehensive principles (5-10)
    const comprehensivePrinciples = await generateComprehensivePrinciples(
        comprehensiveContext,
        valuesContext,
        apiKey
    );

    if (onProgress) onProgress('Identifying your top priority principles...');

    // Generate priority principles (1-3)
    const priorityPrinciples = await generatePriorityPrinciples(
        priorityContext,
        comprehensiveContext,
        valuesContext,
        apiKey
    );

    // Save to storage
    const principles = {
        generatedAt: new Date().toISOString(),
        lastRefreshed: new Date().toISOString(),
        comprehensive: comprehensivePrinciples,
        priority: priorityPrinciples,
        userNotes: ''
    };

    savePrinciples(principles);

    if (onProgress) onProgress('Complete! Principles generated successfully.');

    return principles;
}

// Build comprehensive context from year.html
function buildComprehensiveContext(yearData) {
    const retro = yearData.retro || {};
    const planning = yearData.planning || {};

    let context = '=== YEAR RETROSPECTIVE ===\n\n';

    // Theme and story
    if (retro.theme) context += `Year Theme: ${retro.theme}\n`;
    if (retro.oneline) context += `Summary: ${retro.oneline}\n`;
    if (retro.story) context += `Story: ${retro.story}\n`;
    if (retro.bigmove) context += `Big Move of the Year: ${retro.bigmove}\n`;
    context += '\n';

    // Pivot moments (15)
    context += '--- PIVOT MOMENTS ---\n';
    for (let i = 1; i <= 15; i++) {
        const moment = retro[`pivotmoment-${i}`];
        const realize = retro[`pivotrealize-${i}`];
        if (moment) {
            context += `${i}. ${moment}`;
            if (realize) context += ` → Realized: ${realize}`;
            context += '\n';
        }
    }
    context += '\n';

    // Self-abandonment moments (10)
    context += '--- SELF-ABANDONMENT MOMENTS ---\n';
    for (let i = 1; i <= 10; i++) {
        const abandonment = retro[`abandonment-${i}`];
        if (abandonment) {
            context += `${i}. ${abandonment}\n`;
        }
    }
    context += '\n';

    // Mistakes (6)
    context += '--- BIGGEST MISTAKES ---\n';
    for (let i = 1; i <= 6; i++) {
        const mistake = retro[`mistake-${i}`];
        if (mistake) {
            context += `• ${mistake}\n`;
        }
    }
    context += '\n';

    // Achievements (5)
    context += '--- KEY ACHIEVEMENTS ---\n';
    for (let i = 1; i <= 5; i++) {
        const achievement = retro[`achievement-${i}`];
        if (achievement) {
            context += `• ${achievement}\n`;
        }
    }
    context += '\n';

    // Challenges (5)
    context += '--- MAIN CHALLENGES ---\n';
    for (let i = 1; i <= 5; i++) {
        const challenge = retro[`challenge-${i}`];
        if (challenge) {
            context += `• ${challenge}\n`;
        }
    }
    context += '\n';

    // Learnings (5)
    context += '--- KEY LEARNINGS ---\n';
    for (let i = 1; i <= 5; i++) {
        const learning = retro[`learning-${i}`];
        if (learning) {
            context += `• ${learning}\n`;
        }
    }
    context += '\n';

    // Identity upgrades (10)
    context += '--- IDENTITY UPGRADES FOR NEXT YEAR ---\n';
    for (let i = 1; i <= 10; i++) {
        const upgrade = planning[`identity-${i}`];
        if (upgrade) {
            context += `• ${upgrade}\n`;
        }
    }
    context += '\n';

    // Fear to Power
    if (planning['fear-map'] || planning['power-map']) {
        context += '--- FEAR → POWER TRANSFORMATION ---\n';
        context += `Fear: ${planning['fear-map'] || 'Not specified'}\n`;
        context += `Power: ${planning['power-map'] || 'Not specified'}\n\n`;
    }

    // Systems and practices
    if (planning.systems) {
        context += '--- SYSTEMS & PRACTICES ---\n';
        context += `${planning.systems}\n\n`;
    }

    // Transformation ratings
    if (retro.transformation) {
        context += `Overall Transformation Rating: ${retro.transformation}/10\n\n`;
    }

    return context;
}

// Build priority context from year-review.html
function buildPriorityContext(yearReviewData) {
    const reflection = yearReviewData.reflection || {};
    const planning = yearReviewData.planning || {};

    let context = '=== HIGH-PRIORITY REFLECTION ===\n\n';

    if (reflection.rating) {
        context += `Year Rating: ${reflection.rating}/10\n\n`;
    }

    if (reflection.bigMoment) {
        context += `PIVOTAL MOMENT (Most Important):\n${reflection.bigMoment}\n\n`;
    }

    if (reflection.wins && reflection.wins.length > 0) {
        context += '--- TOP 3 WINS TO CARRY FORWARD ---\n';
        reflection.wins.forEach((win, i) => {
            if (win) context += `${i + 1}. ${win}\n`;
        });
        context += '\n';
    }

    if (reflection.learnings && reflection.learnings.length > 0) {
        context += '--- TOP 3 LEARNINGS ---\n';
        reflection.learnings.forEach((learning, i) => {
            if (learning) context += `${i + 1}. ${learning}\n`;
        });
        context += '\n';
    }

    if (reflection.letGo && reflection.letGo.length > 0) {
        context += '--- TOP 3 THINGS TO LET GO ---\n';
        reflection.letGo.forEach((item, i) => {
            if (item) context += `${i + 1}. ${item}\n`;
        });
        context += '\n';
    }

    if (planning.vision) {
        context += `VISION FOR NEXT YEAR:\n${planning.vision}\n\n`;
    }

    if (planning.committedMove) {
        context += `COMMITTED BIG MOVE:\n${planning.committedMove.name}\n`;
        if (planning.committedMove.why) {
            context += `Why: ${planning.committedMove.why}\n`;
        }
        context += '\n';
    }

    return context;
}

// Build values context from vision.html
function buildValuesContext(visionData) {
    let context = '=== CORE VALUES & VISION ===\n\n';

    if (visionData.oneliner) {
        context += `One-Line Vision: ${visionData.oneliner}\n\n`;
    }

    if (visionData.values && visionData.values.length > 0) {
        context += '--- CORE VALUES ---\n';
        visionData.values.forEach((value, i) => {
            if (value && value.trim()) context += `${i + 1}. ${value}\n`;
        });
        context += '\n';
    }

    if (visionData.principles && visionData.principles.length > 0) {
        context += '--- EXISTING PRINCIPLES (from vision.html) ---\n';
        visionData.principles.forEach((principle, i) => {
            if (principle && principle.trim()) context += `${i + 1}. ${principle}\n`;
        });
        context += '\n';
    }

    if (visionData.boundaries && visionData.boundaries.length > 0) {
        context += '--- BOUNDARIES ---\n';
        visionData.boundaries.forEach((boundary, i) => {
            if (boundary && boundary.trim()) context += `${i + 1}. ${boundary}\n`;
        });
        context += '\n';
    }

    return context;
}

// Generate comprehensive principles (5-10)
async function generateComprehensivePrinciples(context, valuesContext, apiKey) {
    const systemMessage = `You are an expert life coach specializing in extracting actionable principles from personal reflections.

IMPORTANT: Principles are fundamental truths that serve as the foundation for behavior that gets you what you want out of life.

Good principles are:
- Actionable (not just aspirational)
- Based on actual patterns in the user's experiences
- Specific and memorable
- Forward-looking (guide future decisions)
- MUST align with the person's stated core values

Examples:
✓ GOOD: "Design your environment before trying to change your habits"
✓ GOOD: "Surround yourself with people who challenge your limitations"
✓ GOOD: "Small consistent actions compound faster than big sporadic efforts"

✗ BAD: "Be more authentic" (too vague, aspirational)
✗ BAD: "Work harder" (not specific, no insight)
✗ BAD: "Believe in yourself" (platitude, not actionable)`;

    const userPrompt = `Based on this person's comprehensive year retrospective and core values, extract 5-10 powerful PRINCIPLES that will guide their next year.

Look for:
- Patterns in their pivot moments and realizations
- Lessons from their mistakes and challenges
- Wisdom from their achievements and learnings
- Identity shifts they're making
- Their fear-to-power transformation
- How their experiences connect to their stated values

${valuesContext}

${context}

IMPORTANT: The principles MUST align with their stated core values. Reference their values when relevant.

Return ONLY valid JSON in this exact format:
{
  "principles": [
    {
      "text": "Principle statement here",
      "reasoning": "Why this principle emerged from the data and how it connects to their values",
      "sourceFields": ["pivotmoment-3", "mistake-1"],
      "category": "foundation|growth|warning"
    }
  ]
}`;

    try {
        const response = await callOpenAI(userPrompt, systemMessage, { maxTokens: 2500 });
        const data = parseAIJSON(response);

        // Add IDs and structure
        return data.principles.map((p, i) => ({
            id: `comp_${Date.now()}_${i}`,
            text: p.text,
            source: 'year.html',
            sourceFields: p.sourceFields || [],
            weight: 1.0,
            category: p.category || 'foundation',
            reasoning: p.reasoning || '',
            userEdited: false
        }));
    } catch (error) {
        console.error('Error generating comprehensive principles:', error);
        throw new Error('Failed to generate comprehensive principles: ' + error.message);
    }
}

// Generate priority principles (1-3)
async function generatePriorityPrinciples(priorityContext, comprehensiveContext, valuesContext, apiKey) {
    const systemMessage = `You are an expert life coach specializing in extracting the MOST IMPORTANT principles from personal reflections.

IMPORTANT: Principles are fundamental truths that serve as the foundation for behavior that gets you what you want out of life.

You are identifying the 1-3 HIGHEST PRIORITY principles - the non-negotiables that will have the biggest impact on this person's next year. These MUST align with their core values.`;

    const userPrompt = `Based on this person's high-priority reflection (their most important moment, top wins, and key learnings) and their core values, extract 1-3 PRIORITY PRINCIPLES.

These should be the MOST IMPORTANT principles - the ones that will have the biggest impact if followed consistently.

${valuesContext}

PRIORITY REFLECTION:
${priorityContext}

COMPREHENSIVE CONTEXT (for additional insight):
${comprehensiveContext}

IMPORTANT: The priority principles MUST deeply align with their stated core values. These are their non-negotiables.

Return ONLY valid JSON in this exact format:
{
  "principles": [
    {
      "text": "Priority principle statement",
      "reasoning": "Why this is THE most important and how it connects to their core values",
      "sourceFields": ["bigMoment", "win-1"],
      "urgency": "critical"
    }
  ]
}

Extract 1-3 principles maximum. These will be weighted 2.5x more heavily in decision-making.`;

    try {
        const response = await callOpenAI(userPrompt, systemMessage, { maxTokens: 1500 });
        const data = parseAIJSON(response);

        // Add IDs and structure
        return data.principles.map((p, i) => ({
            id: `priority_${Date.now()}_${i}`,
            text: p.text,
            source: 'year-review.html',
            sourceFields: p.sourceFields || [],
            weight: 2.5,
            category: 'priority',
            reasoning: p.reasoning || '',
            urgency: p.urgency || 'high',
            userEdited: false
        }));
    } catch (error) {
        console.error('Error generating priority principles:', error);
        throw new Error('Failed to generate priority principles: ' + error.message);
    }
}

// Refresh principles (re-generate with latest data including vision values)
async function refreshPrinciples(onProgress) {
    const yearData = getYearData();
    const yearReviewData = getYearReviewData();
    const apiKey = getAPIKey() || promptForAPIKey();

    if (!apiKey) {
        throw new Error('API key required to refresh principles');
    }

    // Get current principles to preserve user edits
    const currentPrinciples = getPrinciples();
    const userEditedTexts = new Set();

    currentPrinciples.comprehensive.forEach(p => {
        if (p.userEdited) userEditedTexts.add(p.text);
    });
    currentPrinciples.priority.forEach(p => {
        if (p.userEdited) userEditedTexts.add(p.text);
    });

    // Generate new principles (now includes vision.html values)
    const newPrinciples = await generatePrinciples(yearData, yearReviewData, apiKey, onProgress);

    // Merge back user-edited principles that aren't in new set
    currentPrinciples.comprehensive.forEach(p => {
        if (p.userEdited && !newPrinciples.comprehensive.some(np => np.text === p.text)) {
            newPrinciples.comprehensive.push(p);
        }
    });

    currentPrinciples.priority.forEach(p => {
        if (p.userEdited && !newPrinciples.priority.some(np => np.text === p.text)) {
            newPrinciples.priority.push(p);
        }
    });

    return newPrinciples;
}

// Export for use in HTML
if (typeof window !== 'undefined') {
    window.POS = window.POS || {};
    window.POS.Principles = {
        generatePrinciples,
        refreshPrinciples
    };
}
