/**
 * Generates a Round Robin schedule (Berger Tables).
 * matches: Array of arrays of rounds.
 * Each round is an array of matches: { home: teamId, away: teamId }
 * 
 * @param {Array} teams - Array of team objects or IDs.
 * @param {boolean} doubleRound - If true, generates return legs (Home/Away swap).
 * @returns {Array} - Array of Rounds, where each Round is an array of Matches.
 */
export const generateFixtures = (teams, doubleRound = true) => {
    if (teams.length < 2) return [];

    // If odd number of teams, add a dummy 'BYE' team (implied by array length check usually, but let's handle IDs)
    // For simplicity, we assume the caller handles the 'dummy' if needed, or we just use ghost matches.
    // Standard Berger table algorithm works best with even number of teams.
    // If odd, one team rests each round.

    let schedulingTeams = [...teams];
    if (teams.length % 2 !== 0) {
        schedulingTeams.push({ id: 'BYE', name: 'Bye' }); // Dummy team
    }

    const numTeams = schedulingTeams.length;
    const numRounds = numTeams - 1;
    const halfSize = numTeams / 2;

    const rounds = [];

    const teamIndices = schedulingTeams.map((_, i) => i);
    // Remove the first team index, it stays fixed in Berger algorithm
    // We will rotate the rest.
    // Actually, a simpler array rotation method:
    // Teams: [0, 1, 2, 3]
    // Fix 0. Rotate [1, 2, 3].

    // Standard implementation:
    let pivot = schedulingTeams[0];
    let others = schedulingTeams.slice(1);

    for (let roundIndex = 0; roundIndex < numRounds; roundIndex++) {
        const roundMatches = [];

        // Match with pivot
        // In even rounds, Pivot is Home? Or alternate?
        // Standard Berger: 
        // Last element of 'others' plays against Pivot.
        // But let's use a simpler known cyclic algorithm.

        const lastIdx = others.length - 1;

        let home, away;
        // Alternate home/away for the pivot team
        if (roundIndex % 2 === 0) {
            home = pivot;
            away = others[lastIdx];
        } else {
            home = others[lastIdx];
            away = pivot;
        }

        if (home.id !== 'BYE' && away.id !== 'BYE') {
            roundMatches.push({ home: home.id, away: away.id });
        }

        // Match the rest of the array
        for (let i = 0; i < (others.length - 1) / 2; i++) {
            const t1 = others[i];
            const t2 = others[lastIdx - 1 - i]; // Pair from ends inwards

            // Alternating Home/Away logic for these pairs is tricky to get perfect "Home/Away/Home/Away" balance
            // but for simple Round Robin, simpler is consistent.
            // Usually: 
            if (roundIndex % 2 === 0) {
                roundMatches.push({ home: t1.id, away: t2.id });
            } else {
                roundMatches.push({ home: t2.id, away: t1.id });
            }
        }

        rounds.push(roundMatches);

        // Rotate 'others' array: move last element to start
        others.unshift(others.pop());
    }

    if (doubleRound) {
        // Generate return legs (Rounds N to 2N-1)
        // Just invert Home/Away of the first N-1 rounds
        const returnRounds = rounds.map(round =>
            round.map(match => ({ home: match.away, away: match.home }))
        );
        return [...rounds, ...returnRounds];
    }

    return rounds;
};
