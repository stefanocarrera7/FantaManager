import { supabase } from '../lib/supabase';
import { getSerieAMatchdayInfo } from '../data/serieaSchedule';

/**
 * Supported tactical modules and their role requirements:
 * role counts: { POR: 1, DIF: D, CEN: C, ATT: A }
 */
export const MODULES = {
    '3-4-3': { POR: 1, DIF: 3, CEN: 4, ATT: 3 },
    '3-5-2': { POR: 1, DIF: 3, CEN: 5, ATT: 2 },
    '4-3-3': { POR: 1, DIF: 4, CEN: 3, ATT: 3 },
    '4-4-2': { POR: 1, DIF: 4, CEN: 4, ATT: 2 },
    '4-5-1': { POR: 1, DIF: 4, CEN: 5, ATT: 1 },
    '5-3-2': { POR: 1, DIF: 5, CEN: 3, ATT: 2 },
    '5-4-1': { POR: 1, DIF: 5, CEN: 4, ATT: 1 },
    '4-2-3-1': { POR: 1, DIF: 4, CEN: 5, ATT: 1 },
};

/**
 * Calculates deadline and kickoff info for a matchday based on the official Serie A calendar.
 * Rule: exactly 5 minutes before the kickoff of the first match of the matchday.
 */
export const getMatchdayDeadline = (competition, leagueMatchday = 1) => {
    const startSerieA = competition?.settings?.startSerieAMatchday || 1;
    const serieAMatchday = Math.max(1, (leagueMatchday || 1) + startSerieA - 1);

    // 1. Check if competition settings has an explicit custom deadline override
    const customDeadlines = competition?.settings?.matchdayDeadlines || {};
    if (customDeadlines[leagueMatchday]) {
        const kickoff = new Date(customDeadlines[leagueMatchday]);
        const deadline = new Date(kickoff.getTime() - 5 * 60 * 1000);
        return {
            deadline,
            kickoff,
            serieAMatchday,
            firstMatch: 'Anticipo configurato',
            description: kickoff.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
        };
    }

    // 2. Fetch from real Serie A schedule using mapped serieAMatchday
    const matchInfo = getSerieAMatchdayInfo(serieAMatchday);
    const kickoff = new Date(matchInfo.kickoff);
    const deadline = new Date(kickoff.getTime() - 5 * 60 * 1000); // 5 minutes before kickoff

    return {
        deadline,
        kickoff,
        serieAMatchday,
        firstMatch: matchInfo.firstMatch,
        description: matchInfo.description
    };
};

/**
 * Checks if lineup submission is currently open for the given matchday.
 */
export const isLineupSubmissionOpen = (competition, matchday) => {
    if (competition?.settings?.allowLineupAlways) return true;

    const { deadline } = getMatchdayDeadline(competition, matchday);
    return new Date() < deadline;
};

/**
 * Formats time remaining until deadline.
 */
export const getTimeUntilDeadline = (deadlineDate) => {
    const now = new Date();
    const diff = deadlineDate - now;
    if (diff <= 0) return { expired: true, text: 'Scadenza superata (Formazione bloccata)' };

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours >= 24) {
        const days = Math.floor(hours / 24);
        const remHours = hours % 24;
        return { expired: false, text: `${days}g ${remHours}h ${minutes}m ${seconds}s alla chiusura` };
    }

    if (hours > 0) {
        return { expired: false, text: `${hours}h ${minutes}m ${seconds}s alla chiusura` };
    }

    return { expired: false, text: `${minutes}m ${seconds}s alla chiusura` };
};

/**
 * Loads a team's lineup for a matchday from Supabase.
 * If none exists for the current matchday, tries to fallback to previous matchday.
 */
export const getTeamLineup = async (competitionId, teamId, matchday) => {
    if (!competitionId || !teamId) return null;

    // 1. Try to fetch for current matchday
    const { data, error } = await supabase
        .from('lineups')
        .select('*')
        .eq('competition_id', competitionId)
        .eq('team_id', teamId)
        .eq('matchday', matchday)
        .single();

    if (data && !error) {
        return data;
    }

    // 2. Fallback: If matchday > 1, fetch previous matchday's lineup as template
    if (matchday > 1) {
        const { data: prevData } = await supabase
            .from('lineups')
            .select('*')
            .eq('competition_id', competitionId)
            .eq('team_id', teamId)
            .lt('matchday', matchday)
            .order('matchday', { ascending: false })
            .limit(1)
            .single();

        if (prevData) {
            return {
                ...prevData,
                isFallback: true,
                matchday // Keep current requested matchday
            };
        }
    }

    return null;
};

/**
 * Saves a team's lineup to Supabase.
 */
export const saveTeamLineup = async (competitionId, teamId, matchday, module, starters, bench) => {
    const payload = {
        competition_id: competitionId,
        team_id: teamId,
        matchday,
        module,
        starters,
        bench,
        submitted_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('lineups')
        .upsert([payload], { onConflict: 'competition_id,team_id,matchday' })
        .select()
        .single();

    if (error) {
        console.error('Error saving lineup:', error);
        return { success: false, message: error.message };
    }

    return { success: true, data };
};
