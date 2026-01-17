import { createContext, useContext, useState, useEffect } from 'react';
import { useLeague } from './LeagueContext';
import { generateFixtures } from '../utils/scheduler';
import { calculatePlayerScore } from '../utils/scoringEngine';
import { supabase } from '../lib/supabase';

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
        const savedComp = localStorage.getItem('fanta_competition');
        return savedComp ? JSON.parse(savedComp) : null;
    });
    const [currentMatchday, setCurrentMatchday] = useState(1);

    // Save to local storage on change (CACHE ONLY)
    // We still keep this for "active session state" to survive refreshes without refetching everything immediately
    useEffect(() => {
        if (activeCompetition) {
            localStorage.setItem('fanta_competition', JSON.stringify(activeCompetition));
            leagueActions.loadLeague(activeCompetition.id);
        }
    }, [activeCompetition]);

    // Validation Effect (Guest check) - Kept same
    useEffect(() => {
        if (activeCompetition && currentUser.role === 'guest') {
            console.log("User is guest in active competition. Resetting...");
            resetCompetition();
        }
    }, [activeCompetition, currentUser.role]);

    // HELPERS
    const createCompetition = async (name = 'Serie A', adminId) => {
        // Generate Share Code
        const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const fixturesRaw = generateFixtures([]); // Empty initially
        const fixtures = fixturesRaw.map((roundMatches, idx) => ({
            round: idx + 1,
            matches: []
        }));

        const newComp = {
            name,
            share_code: shareCode,
            admin_id: adminId, // Supabase Auth ID
            settings: {},
            status: 'active'
        };

        const { data, error } = await supabase
            .from('competitions')
            .insert([newComp])
            .select()
            .single();

        if (error) {
            console.error('Error creating competition:', error);
            return null; // Handle error in UI
        }

        // Remap to frontend structure if needed, or use raw data
        const mappedComp = {
            ...data,
            id: data.id,
            shareCode: data.share_code,
            adminId: data.admin_id,
            standings: {}, // JSONB col?
            fixtures: fixtures // JSONB col?
        };

        setActiveCompetition(mappedComp);
        setCurrentMatchday(1);
        return mappedComp;
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
            standings: {}, // Fetch or init
            fixtures: [] // Fetch or init
        };

        setActiveCompetition(mappedComp);
        setCurrentMatchday(1);
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
                standings: {},
                fixtures: []
            };
            setActiveCompetition(mappedComp);
            return { success: true };
        }
        return { success: false, message: 'Competition not found' };
    };

    /**
     * Converts fantasy points to goals.
     * Standard bands:
     * < 66: 0 goals
     * 66-71.5: 1 goal
     * 72-77.5: 2 goals
     * 78-83.5: 3 goals
     * ... (intervals of 6 points, often 4 points after 3rd goal depending on league rules).
     * Used simplified standard:
     * 66 = 1 goal.
     * +6 points = +1 goal.
     */
    const calculateGoals = (fantasyPoints) => {
        if (fantasyPoints < 66) return 0;
        const diff = fantasyPoints - 66;
        return 1 + Math.floor(diff / 6);
    };

    const processMatchResult = (matchId, homeData, awayData) => {
        // homeData / awayData = { totalPoints: 72.5, lineup: [...] }

        // Calculate goals
        const homeGoals = calculateGoals(homeData.totalPoints);
        const awayGoals = calculateGoals(awayData.totalPoints);

        // Update Competition State
        setActiveCompetition(prev => {
            const newComp = { ...prev };

            // 1. Update Match Status
            let matchFound = false;
            let roundIdx = -1;

            newComp.fixtures.forEach((round, rIdx) => {
                const match = round.matches.find(m => m.id === matchId);
                if (match) {
                    match.completed = true;
                    match.result = {
                        homeGoals,
                        awayGoals,
                        homeTotal: homeData.totalPoints,
                        awayTotal: awayData.totalPoints
                    };
                    matchFound = true;
                    roundIdx = rIdx;
                }
            });

            if (!matchFound) return prev;

            // 2. Update Standings
            // Need to recalculate ALL standings to be safe, OR incremental update.
            // Incremental is faster.
            const match = newComp.fixtures[roundIdx].matches.find(m => m.id === matchId);
            const homeId = match.homeTeamId;
            const awayId = match.awayTeamId;

            const updateStats = (id, gf, ga) => {
                const stats = newComp.standings[id];
                stats.p += 1;
                stats.gf += gf;
                stats.ga += ga;
                if (gf > ga) { stats.w += 1; stats.pts += 3; }
                else if (gf === ga) { stats.d += 1; stats.pts += 1; }
                else { stats.l += 1; }
            };

            updateStats(homeId, homeGoals, awayGoals);
            updateStats(awayId, awayGoals, homeGoals);

            return newComp;
        });
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
            joinCompetition,
            switchCompetition, // NEW
            processMatchResult,
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
