/**
 * Default Scoring Rules for standard Italian Fantacalcio
 */
export const DEFAULT_SCORING_RULES = {
    startSerieAMatchday: 1,
    maxSubstitutions: 5,
    goalThreshold: 66,
    goalStep: 6,
    defenseModifierEnabled: false,
    baseGoal: 3,
    penaltyGoal: 3,
    assist: 1,
    cleanSheetGK: 1,
    penaltySaved: 3,
    penaltyMissed: -3,
    ownGoal: -2,
    yellowCard: -0.5,
    redCard: -1,
    concededGoal: -1,
};

/**
 * Calculates the total fantasy score for an individual player performance.
 */
export const calculatePlayerScore = (grade, events = {}, role = 'POR', customRules = {}) => {
    const rules = { ...DEFAULT_SCORING_RULES, ...customRules };
    let bonus = 0;

    bonus += (events.goals || 0) * (rules.baseGoal ?? 3);
    bonus += (events.penaltiesScored || 0) * (rules.penaltyGoal ?? 3);
    bonus += (events.assists || 0) * (rules.assist ?? 1);
    bonus += (events.penaltiesSaved || 0) * (rules.penaltySaved ?? 3);
    bonus += (events.penaltiesMissed || 0) * (rules.penaltyMissed ?? -3);
    bonus += (events.ownGoals || 0) * (rules.ownGoal ?? -2);
    bonus += (events.yellowCards || 0) * (rules.yellowCard ?? -0.5);
    bonus += (events.redCards || 0) * (rules.redCard ?? -1);
    bonus += (events.goalsConceded || 0) * (rules.concededGoal ?? -1);

    if (role === 'POR' && events.cleanSheet) {
        bonus += (rules.cleanSheetGK ?? 1);
    }

    const numericGrade = parseFloat(grade) || 0;

    return {
        grade: numericGrade,
        bonus: Math.round(bonus * 10) / 10,
        total: Math.round((numericGrade + bonus) * 10) / 10
    };
};

/**
 * Converts fantasy points into goals based on configured bands.
 * Default:
 * < 66: 0 goals
 * 66 - 71.5: 1 goal
 * 72 - 77.5: 2 goals
 * 78 - 83.5: 3 goals ...
 */
export const calculateGoalsFromPoints = (fantasyPoints, threshold = 66, step = 6) => {
    if (!fantasyPoints || fantasyPoints < threshold) return 0;
    const diff = fantasyPoints - threshold;
    return 1 + Math.floor(diff / step);
};

/**
 * Calculates Defense Modifier if enabled (needs at least 4 rated defenders and 1 rated goalkeeper)
 */
export const calculateDefenseModifier = (starters = []) => {
    const gk = starters.find(p => p.role === 'POR' && p.grade > 0);
    const defs = starters.filter(p => p.role === 'DIF' && p.grade > 0);

    if (!gk || defs.length < 4) return 0;

    // Sort defenders by grade descending and take best 3
    const best3Defs = [...defs].sort((a, b) => b.grade - a.grade).slice(0, 3);
    const avg = (gk.grade + best3Defs.reduce((s, d) => s + d.grade, 0)) / 4;

    if (avg >= 7.0) return 6;
    if (avg >= 6.5) return 3;
    if (avg >= 6.0) return 1;
    return 0;
};

/**
 * Evaluates a team's lineup against official matchday votes,
 * performing classic automatic substitutions for missing/unvoted starters.
 * 
 * Rules:
 * 1. For each missing starter (S.V. or !played), search the bench in priority order.
 * 2. The first bench player OF THE SAME ROLE with a valid grade subenters.
 * 3. Each bench player can be used only once.
 * 4. Maximum substitutions limit is respected.
 */
export const evaluateTeamLineup = (starters = [], bench = [], matchdayVotes = {}, customRules = {}) => {
    const rules = { ...DEFAULT_SCORING_RULES, ...customRules };
    const maxSubs = rules.maxSubstitutions ?? 5;
    const threshold = rules.goalThreshold ?? 66;
    const step = rules.goalStep ?? 6;

    let subCount = 0;
    const usedBenchIds = new Set();
    const evaluatedStarters = [];
    const substitutions = [];

    if (!starters || starters.length === 0) {
        return {
            totalPoints: 0,
            goals: 0,
            evaluatedStarters: [],
            substitutions: []
        };
    }

    // 1. Process Starters with Classic Substitution Rule
    starters.forEach(starter => {
        const playerVote = matchdayVotes[starter.id];
        const didPlay = playerVote && playerVote.played && playerVote.grade !== null && playerVote.grade > 0;

        if (didPlay) {
            evaluatedStarters.push({
                ...starter,
                grade: playerVote.grade,
                bonus: playerVote.bonus || 0,
                fantavote: playerVote.fantavote ?? playerVote.grade,
                events: playerVote.events || {},
                isSubstituted: false
            });
        } else {
            // Starter did NOT play / got S.V. -> Find first bench sub of same role
            let subFound = null;

            if (subCount < maxSubs) {
                for (let i = 0; i < bench.length; i++) {
                    const benchPlayer = bench[i];
                    if (benchPlayer.role === starter.role && !usedBenchIds.has(benchPlayer.id)) {
                        const benchVote = matchdayVotes[benchPlayer.id];
                        if (benchVote && benchVote.played && benchVote.grade !== null && benchVote.grade > 0) {
                            subFound = {
                                ...benchPlayer,
                                grade: benchVote.grade,
                                bonus: benchVote.bonus || 0,
                                fantavote: benchVote.fantavote ?? benchVote.grade,
                                events: benchVote.events || {},
                                isSubstitutedIn: true,
                                replacedPlayerName: starter.name
                            };
                            usedBenchIds.add(benchPlayer.id);
                            subCount++;
                            break;
                        }
                    }
                }
            }

            if (subFound) {
                evaluatedStarters.push(subFound);
                substitutions.push({
                    out: starter,
                    in: subFound
                });
            } else {
                // No valid sub -> 0 points
                evaluatedStarters.push({
                    ...starter,
                    grade: 0,
                    bonus: 0,
                    fantavote: 0,
                    events: {},
                    isSubstituted: false,
                    noVote: true
                });
            }
        }
    });

    // 2. Evaluate Bench Players:
    // A) Starters who were replaced (did not play) move to the bench list with substituted out badge
    const replacedStarters = substitutions.map(subMatch => {
        const starterVote = matchdayVotes[subMatch.out.id];
        return {
            ...subMatch.out,
            grade: starterVote?.grade !== undefined && starterVote?.grade !== null ? starterVote.grade : (starterVote?.played ? 'S.V.' : 'S.V.'),
            bonus: 0,
            fantavote: '-',
            events: starterVote?.events || {},
            isSubstitutedOut: true,
            replacedByPlayerName: subMatch.in.name
        };
    });

    // B) Bench players who did NOT sub in (stayed on bench)
    const remainingBench = (bench || [])
        .filter(benchPlayer => !usedBenchIds.has(benchPlayer.id))
        .map(benchPlayer => {
            const benchVote = matchdayVotes[benchPlayer.id];
            return {
                ...benchPlayer,
                grade: benchVote?.grade !== undefined && benchVote?.grade !== null ? benchVote.grade : (benchVote?.played ? 'S.V.' : '-'),
                bonus: benchVote?.bonus || 0,
                fantavote: benchVote?.fantavote !== undefined && benchVote?.fantavote !== null ? benchVote.fantavote : (benchVote?.played ? (benchVote?.grade || 0) : '-'),
                events: benchVote?.events || {},
                isSubstitutedIn: false,
                isSubstitutedOut: false
            };
        });

    const evaluatedBench = [...replacedStarters, ...remainingBench];

    // 3. Sum base fantasy points
    let rawTotal = evaluatedStarters.reduce((sum, p) => sum + (typeof p.fantavote === 'number' ? p.fantavote : 0), 0);

    // 4. Apply Defense Modifier if enabled
    let defModifier = 0;
    if (rules.defenseModifierEnabled) {
        defModifier = calculateDefenseModifier(evaluatedStarters);
        rawTotal += defModifier;
    }

    const totalPoints = Math.round(rawTotal * 10) / 10;
    const goals = calculateGoalsFromPoints(totalPoints, threshold, step);

    return {
        totalPoints,
        goals,
        evaluatedStarters,
        evaluatedBench,
        substitutions,
        defModifier
    };
};
