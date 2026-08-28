/**
 * Official Serie A Matchday Kickoff Schedules.
 * Contains the kickoff time of the FIRST match of each matchday (l'anticipo).
 * Lineup submission deadline is strictly 5 minutes prior to this kickoff.
 */

export const SERIE_A_SCHEDULE = {
    1: {
        firstMatch: 'Milan - Venezia',
        kickoff: '2026-08-28T20:45:00', // Venerdì ore 20:45
        description: 'Venerdì 28 Agosto, 20:45'
    },
    2: {
        firstMatch: 'Inter - Lecce',
        kickoff: '2026-09-04T18:30:00',
        description: 'Venerdì 4 Settembre, 18:30'
    },
    3: {
        firstMatch: 'Juventus - Roma',
        kickoff: '2026-09-18T20:45:00',
        description: 'Venerdì 18 Settembre, 20:45'
    },
    4: {
        firstMatch: 'Napoli - Bologna',
        kickoff: '2026-09-25T15:00:00',
        description: 'Sabato 25 Settembre, 15:00'
    },
    5: {
        firstMatch: 'Atalanta - Como',
        kickoff: '2026-10-02T20:45:00',
        description: 'Venerdì 2 Ottobre, 20:45'
    },
    6: {
        firstMatch: 'Lazio - Torino',
        kickoff: '2026-10-16T15:00:00',
        description: 'Sabato 16 Ottobre, 15:00'
    },
    7: {
        firstMatch: 'Fiorentina - Milan',
        kickoff: '2026-10-23T20:45:00',
        description: 'Venerdì 23 Ottobre, 20:45'
    },
    8: {
        firstMatch: 'Roma - Inter',
        kickoff: '2026-10-30T20:45:00',
        description: 'Venerdì 30 Ottobre, 20:45'
    },
    9: {
        firstMatch: 'Juventus - Lazio',
        kickoff: '2026-11-06T18:00:00',
        description: 'Sabato 6 Novembre, 18:00'
    },
    10: {
        firstMatch: 'Napoli - Milan',
        kickoff: '2026-11-20T20:45:00',
        description: 'Venerdì 20 Novembre, 20:45'
    }
};

/**
 * Gets matchday kickoff info with fallback to standard schedule if beyond matchday 10.
 */
export const getSerieAMatchdayInfo = (matchday) => {
    if (SERIE_A_SCHEDULE[matchday]) {
        return SERIE_A_SCHEDULE[matchday];
    }

    // Dynamic standard fallback: calculate based on matchday week
    const baseDate = new Date('2026-08-28T20:45:00');
    const targetDate = new Date(baseDate.getTime() + (matchday - 1) * 7 * 24 * 60 * 60 * 1000);

    return {
        firstMatch: 'Anticipo Giornata ' + matchday,
        kickoff: targetDate.toISOString(),
        description: targetDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    };
};

