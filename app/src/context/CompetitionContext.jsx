import { createContext, useContext, useState, useEffect } from 'react';
import { useLeague } from './LeagueContext';
import { generateFixtures } from '../utils/scheduler';
import { calculatePlayerScore, evaluateTeamLineup } from '../utils/scoringEngine';
import { VoteService } from '../utils/voteService';
import { getTeamLineup } from '../utils/lineupService';
import { supabase } from '../lib/supabase';
import { DEFAULT_FINANCE_SETTINGS } from '../utils/budgetProcessor';

const CompetitionContext = createContext();

export const useCompetition = () => {
    const context = useContext(CompetitionContext);
    if (!context) {
        throw new Error('useCompetition must be used within a CompetitionProvider');
    }
    return context;
};

export const CompetitionProvider = ({ children }) => {
    const { teams, currentUser, actions: leagueActions } = useLeague();

    const [activeCompetition, setActiveCompetition] = useState(() => {
        try {
            const savedComp = localStorage.getItem('fanta_competition');
            if (savedComp) {
                const parsed = JSON.parse(savedComp);
                return {
                    ...parsed,
                    fixtures: parsed.fixtures || parsed.settings?.fixtures || [],
                    standings: parsed.standings || parsed.settings?.standings || {},
                    currentMatchday: parsed.currentMatchday || parsed.settings?.currentMatchday || 1
                };
            }
        } catch (e) {
            console.error('Error parsing cached competition:', e);
        }
        return null;
    });
    const [currentMatchday, setCurrentMatchday] = useState(1);

    // Refresh competition from DB on mount / competition change
    useEffect(() => {
        if (!activeCompetition?.id) return;

        const refreshComp = async () => {
            const { data, error } = await supabase
                .from('competitions')
                .select('*')
                .eq('id', activeCompetition.id)
                .single();

            if (data && !error) {
                const fresh = {
                    ...data,
                    id: data.id,
                    shareCode: data.share_code,
                    adminId: data.admin_id,
                    standings: data.settings?.standings || {},
                    fixtures: data.settings?.fixtures || [],
                    currentMatchday: data.settings?.currentMatchday || 1
                };
                setActiveCompetition(fresh);
                setCurrentMatchday(fresh.currentMatchday);
                localStorage.setItem('fanta_competition', JSON.stringify(fresh));
            }
        };

        refreshComp();
        leagueActions.loadLeague(activeCompetition.id);
    }, [activeCompetition?.id]);

    // Validation Effect (Guest check)
    useEffect(() => {
        if (activeCompetition && currentUser.role === 'guest') {
            console.log("User is guest in active competition. Resetting...");
            resetCompetition();
        }
    }, [activeCompetition, currentUser.role]);

    // HELPERS
    const createCompetition = async (name = 'Serie A', adminId) => {
        console.log("Creating competition:", { name, adminId });

        const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const newComp = {
            name,
            share_code: shareCode,
            admin_id: adminId,
            settings: { ...DEFAULT_FINANCE_SETTINGS, fixtures: [], standings: {}, currentMatchday: 1 }
        };

        const { data, error } = await supabase
            .from('competitions')
            .insert([newComp])
            .select()
            .single();

        if (error) {
            console.error('Error creating competition (Supabase):', error);
            return null;
        }

        const mappedComp = {
            ...data,
            id: data.id,
            shareCode: data.share_code,
            adminId: data.admin_id,
            standings: data.settings?.standings || {},
            fixtures: data.settings?.fixtures || []
        };

        setActiveCompetition(mappedComp);
        setCurrentMatchday(1);
        return mappedComp;
    };

    const startSeason = async (name = 'Serie A 2025/26', teamsList = []) => {
        const rawRounds = generateFixtures(teamsList, true);
        const fixtures = rawRounds.map((roundMatches, idx) => ({
            round: idx + 1,
            completed: false,
            matches: roundMatches.map((m, mIdx) => ({
                id: `m_${idx + 1}_${mIdx + 1}`,
                homeTeamId: m.home,
                awayTeamId: m.away,
                completed: false,
                result: null
            }))
        }));

        const standings = {};
        teamsList.forEach(t => {
            standings[t.id] = { pts: 0, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
        });

        const newSettings = {
            ...(activeCompetition?.settings || DEFAULT_FINANCE_SETTINGS),
            fixtures,
            standings,
            currentMatchday: 1
        };

        const updatedComp = {
            ...activeCompetition,
            fixtures,
            standings,
            currentMatchday: 1,
            settings: newSettings
        };

        setActiveCompetition(updatedComp);
        setCurrentMatchday(1);

        if (activeCompetition?.id) {
            await supabase
                .from('competitions')
                .update({ settings: newSettings })
                .eq('id', activeCompetition.id);
        }

        return updatedComp;
    };

    const joinCompetition = async (code) => {
        const { data, error } = await supabase
            .from('competitions')
            .select('*')
            .eq('share_code', code.toUpperCase())
            .single();

        if (error || !data) {
            return { success: false, message: 'Invalid Competition Code' };
        }

        const mappedComp = {
            ...data,
            id: data.id,
            shareCode: data.share_code,
            adminId: data.admin_id,
            standings: data.settings?.standings || {},
            fixtures: data.settings?.fixtures || []
        };

        setActiveCompetition(mappedComp);
        setCurrentMatchday(data.settings?.currentMatchday || 1);
        return { success: true, competition: mappedComp };
    };

    const switchCompetition = async (competitionId) => {
        const { data, error } = await supabase
            .from('competitions')
            .select('*')
            .eq('id', competitionId)
            .single();

        if (data) {
            const mappedComp = {
                ...data,
                id: data.id,
                shareCode: data.share_code,
                adminId: data.admin_id,
                standings: data.settings?.standings || {},
                fixtures: data.settings?.fixtures || []
            };
            setActiveCompetition(mappedComp);
            setCurrentMatchday(data.settings?.currentMatchday || 1);
            return { success: true };
        }
        return { success: false, message: 'Competition not found' };
    };

    /**
     * Admin Action: Automatically calculates matchday results using official votes & lineups.
     */
    const calculateMatchday = async (matchday) => {
        if (!activeCompetition) return { success: false, message: 'Nessuna competizione attiva' };

        const startSerieA = activeCompetition?.settings?.startSerieAMatchday || 1;
        const serieAMatchday = Math.max(1, matchday + startSerieA - 1);
        const scoringRules = activeCompetition?.settings?.scoringRules || {};
        const allowSimulation = activeCompetition?.settings?.enableVoteSimulation ?? false;

        console.log(`[CalculateMatchday] Calculating League Round ${matchday} using Serie A Round ${serieAMatchday} votes (allowSimulation: ${allowSimulation})...`);

        // 1. Fetch or generate matchday votes for the corresponding Serie A matchday
        const matchdayVotes = await VoteService.getMatchdayVotes(serieAMatchday, '2025/26', false, allowSimulation);

        if (!matchdayVotes || Object.keys(matchdayVotes).length === 0) {
            return {
                success: false,
                message: `I voti ufficiali della Giornata ${serieAMatchday} di Serie A non sono ancora disponibili. Le partite reali non sono ancora state disputate o i voti ufficiali non sono stati ancora pubblicati/caricati!`
            };
        }

        // 2. Find round in fixtures
        const roundObj = activeCompetition.fixtures.find(f => f.round === matchday);
        if (!roundObj) return { success: false, message: `Giornata ${matchday} non trovata nei calendari` };

        // 3. For each match, load lineups, evaluate scoring, execute substitutions
        const updatedMatches = [];
        const updatedStandings = { ...(activeCompetition.standings || {}) };

        for (const match of roundObj.matches) {
            // Load home lineup
            const homeLineup = await getTeamLineup(activeCompetition.id, match.homeTeamId, matchday);
            const homeStarters = homeLineup?.starters || [];
            const homeBench = homeLineup?.bench || [];
            const homeEval = evaluateTeamLineup(homeStarters, homeBench, matchdayVotes, scoringRules);

            // Load away lineup
            const awayLineup = await getTeamLineup(activeCompetition.id, match.awayTeamId, matchday);
            const awayStarters = awayLineup?.starters || [];
            const awayBench = awayLineup?.bench || [];
            const awayEval = evaluateTeamLineup(awayStarters, awayBench, matchdayVotes, scoringRules);

            const evaluatedMatch = {
                ...match,
                completed: true,
                result: {
                    homeGoals: homeEval.goals,
                    awayGoals: awayEval.goals,
                    homeTotal: homeEval.totalPoints,
                    awayTotal: awayEval.totalPoints,
                    evaluatedHome: homeEval,
                    evaluatedAway: awayEval
                }
            };
            updatedMatches.push(evaluatedMatch);

            // Update Standings
            const updateStats = (teamId, gf, ga) => {
                if (!updatedStandings[teamId]) {
                    updatedStandings[teamId] = { pts: 0, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
                }
                const s = updatedStandings[teamId];
                s.p += 1;
                s.gf += gf;
                s.ga += ga;
                if (gf > ga) { s.w += 1; s.pts += 3; }
                else if (gf === ga) { s.d += 1; s.pts += 1; }
                else { s.l += 1; }
            };

            updateStats(match.homeTeamId, homeEval.goals, awayEval.goals);
            updateStats(match.awayTeamId, awayEval.goals, homeEval.goals);
        }

        // 4. Update competition state
        const updatedFixtures = activeCompetition.fixtures.map(f =>
            f.round === matchday ? { ...f, matches: updatedMatches, completed: true } : f
        );

        const nextMatchdayNum = Math.min(updatedFixtures.length, matchday + 1);

        const newSettings = {
            ...(activeCompetition.settings || {}),
            fixtures: updatedFixtures,
            standings: updatedStandings,
            currentMatchday: nextMatchdayNum
        };

        const updatedComp = {
            ...activeCompetition,
            fixtures: updatedFixtures,
            standings: updatedStandings,
            currentMatchday: nextMatchdayNum,
            settings: newSettings
        };

        setActiveCompetition(updatedComp);
        setCurrentMatchday(nextMatchdayNum);

        // 5. Persist to Supabase
        await supabase
            .from('competitions')
            .update({ settings: newSettings })
            .eq('id', activeCompetition.id);

        return { success: true, matches: updatedMatches };
    };

    const nextMatchday = () => {
        setCurrentMatchday(prev => prev + 1);
    };

    const resetCompetition = () => {
        setActiveCompetition(null);
        setCurrentMatchday(1);
        localStorage.removeItem('fanta_competition');
    };

    const value = {
        activeCompetition,
        currentMatchday,
        actions: {
            createCompetition,
            startSeason,
            joinCompetition,
            switchCompetition,
            calculateMatchday,
            nextMatchday,
            resetCompetition
        }
    };

    return (
        <CompetitionContext.Provider value={value}>
            {children}
        </CompetitionContext.Provider>
    );
};
