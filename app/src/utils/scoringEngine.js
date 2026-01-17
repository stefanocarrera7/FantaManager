/**
 * Scoring Rules for standard Fantacalcio
 */
const SCORING_RULES = {
    baseGoal: 3,
    penaltyGoal: 3, // Usually same as goal, but sometimes distinction is made
    assist: 1,
    cleanSheetGK: 1, // Only GK usually
    penaltySaved: 3,
    penaltyMissed: -3,
    ownGoal: -2,
    yellowCard: -0.5,
    redCard: -1,
    concededGoal: -1,
};

/**
 * Calculates the total fantasy score for a player performance.
 * @param {number} grade - The vote/grade (voto) given to the player (e.g. 6.5)
 * @param {Object} events - Object containing event counts
 * @param {string} role - Player role (P, D, C, A) - handled as needed for clean sheets etc.
 */
export const calculatePlayerScore = (grade, events = {}, role = 'P') => {
    let bonus = 0;

    bonus += (events.goals || 0) * SCORING_RULES.baseGoal;
    bonus += (events.penaltiesScored || 0) * SCORING_RULES.penaltyGoal;
    bonus += (events.assists || 0) * SCORING_RULES.assist;
    bonus += (events.penaltiesSaved || 0) * SCORING_RULES.penaltySaved;
    bonus += (events.penaltiesMissed || 0) * SCORING_RULES.penaltyMissed;
    bonus += (events.ownGoals || 0) * SCORING_RULES.ownGoal;
    bonus += (events.yellowCards || 0) * SCORING_RULES.yellowCard;
    bonus += (events.redCards || 0) * SCORING_RULES.redCard;
    bonus += (events.goalsConceded || 0) * SCORING_RULES.concededGoal;

    // Clean sheet bonus often only applies to GK ('P' in Italian usually POR)
    if (role === 'POR' && (events.cleanSheet)) {
        bonus += SCORING_RULES.cleanSheetGK;
    }

    // Ensure grade is a number
    const numericGrade = parseFloat(grade) || 0;

    // Total
    return {
        grade: numericGrade,
        bonus: bonus,
        total: numericGrade + bonus
    };
};

/**
 * Service to fetch or generate grades.
 * Currently a Mock Service for manual input/random generation.
 */
export const GradeService = {
    /**
     * Get grades for a specific matchday (real or mocked).
     * @param {number} matchday 
     * @param {Array} playerIds - List of player IDs to fetch
     */
    fetchGrades: async (matchday, playerIds) => {
        // MOCK IMPLEMENTATION
        // Returns a map: { playerId: { grade: 6.0, events: {...} } }

        // This is where real scraping would happen (via a backend proxy).
        // For now, we return empty so the UI can prompt for Manual Entry,
        // OR we can return random data for testing if requested.

        return {};
    },

    /**
     * Helper to generate a random performance for testing
     */
    generateRandomPerformance: () => {
        const base = 5 + Math.random() * 3; // 5 to 8
        const grade = Math.round(base * 2) / 2; // Round to nearest 0.5

        // Random simple events
        const events = {};
        if (Math.random() > 0.8) events.goals = 1;
        if (Math.random() > 0.9) events.yellowCards = 1;

        return { grade, events };
    }
};
