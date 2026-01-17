import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const LeagueContext = createContext();

export const useLeague = () => {
    const context = useContext(LeagueContext);
    if (!context) {
        throw new Error('useLeague must be used within a LeagueProvider');
    }
    return context;
};

import { supabase } from '../lib/supabase';

// ... imports

export const LeagueProvider = ({ children }) => {
    const { user } = useAuth();
    const [teams, setTeams] = useState([]);
    const [currentCompetitionId, setCurrentCompetitionId] = useState(null);

    // Initial Load - Clear state if no user
    useEffect(() => {
        if (!user) {
            setTeams([]);
            setCurrentUser({ role: 'guest', teamId: null });
            setCurrentCompetitionId(null);
        }
    }, [user]);

    // Load Teams for a specific Competition
    const loadLeague = async (competitionId) => {
        setCurrentCompetitionId(competitionId);

        const { data: leagueTeams, error } = await supabase
            .from('teams')
            .select('*')
            .eq('competition_id', competitionId);

        if (error) {
            console.error('Error loading league teams:', error);
            return;
        }

        // Normalize data (backend uses snake_case, frontend uses camelCase)
        const normalizedTeams = leagueTeams.map(t => ({
            ...t,
            id: t.id,
            ownerId: t.owner_id,
            competitionId: t.competition_id,
            budget: t.budget,
            roster: t.roster || []
        }));

        setTeams(normalizedTeams);

        // Determine User Role
        if (!user) return;

        // Check Admin Status (Need to fetch Comp admin_id if not passed, assuming AuthContext might have role later?)
        // Optimizing: We rely on CompetitionContext storing the Admin ID, 
        // OR we just fetch the competition details here once.
        const { data: comp } = await supabase.from('competitions').select('admin_id').eq('id', competitionId).single();
        const isAdmin = comp?.admin_id === user.id;

        const myTeam = normalizedTeams.find(t => t.ownerId === user.id);
        const role = isAdmin ? 'admin' : (myTeam ? 'manager' : 'guest');

        setCurrentUser({ role, teamId: myTeam ? myTeam.id : null });
    };

    const registerTeam = async (competitionId, teamName, ownerId) => {
        // Backend enforces uniqueness via Unique Constraint on (competition_id, owner_id)
        const newTeam = {
            competition_id: competitionId,
            owner_id: user.id, // Securely use auth user id
            name: teamName,
            budget: 500,
            roster: []
        };

        const { data, error } = await supabase
            .from('teams')
            .insert([newTeam])
            .select()
            .single();

        if (error) {
            return { success: false, message: error.message }; // Likely "Unique Violation"
        }

        const normalizedTeam = {
            ...data,
            id: data.id,
            ownerId: data.owner_id,
            competitionId: data.competition_id,
            roster: []
        };

        setTeams(prev => [...prev, normalizedTeam]);
        setCurrentUser({ role: 'manager', teamId: normalizedTeam.id });

        return { success: true, team: normalizedTeam };
    };

    // Helper to sync changes to DB (Optimistic Update + Background Save)
    const updateTeamsState = (newTeams) => {
        setTeams(newTeams);
        // We need to identify WHICH team changed to update DB efficiently, 
        // OR just rely on specific actions calling update.
        // For now, this generic setter is mostly used by local mutations.
        // Ideally we replace usages of `updateTeamsState` with specific async actions.
    };

    // Current User State
    const [currentUser, setCurrentUser] = useState({ role: 'guest', teamId: null });

    // League Settings (Local state for now, ideally in DB)
    const [leagueSettings, setLeagueSettings] = useState({
        salaryPercentage: 0.1,
        totalBudget: 500
    });

    const updateTeamBudget = async (teamId, newBudget) => {
        const { error } = await supabase
            .from('teams')
            .update({ budget: parseInt(newBudget) })
            .eq('id', teamId);

        if (!error) {
            setTeams(prev => prev.map(t => t.id === teamId ? { ...t, budget: parseInt(newBudget) } : t));
        } else {
            alert("Failed to update budget: " + error.message);
        }
    };

    const applyBudgetToAllTeams = async (newBudget) => {
        const { error } = await supabase
            .from('teams')
            .update({ budget: parseInt(newBudget) })
            .eq('competition_id', currentCompetitionId);

        if (!error) {
            setTeams(prev => prev.map(t => ({ ...t, budget: parseInt(newBudget) })));
        } else {
            alert("Failed to reset budgets: " + error.message);
        }
    };

    const updateTeamRoster = async (teamId, player, auctionPrice) => {
        // Optimistic check (frontend only)
        const isPlayerAlreadyAssigned = teams.some(t => t.roster.some(p => p.id === player.id));
        if (isPlayerAlreadyAssigned) {
            alert(`Player ${player.name} is already assigned to a team.`);
            return;
        }

        const team = teams.find(t => t.id === teamId);
        if (!team) return;

        const rawSalary = player.value * leagueSettings.salaryPercentage;
        const salary = Math.round(rawSalary * 10) / 10;

        const newPlayer = {
            ...player,
            auctionPrice: parseFloat(auctionPrice),
            salary: salary,
            purchaseDate: new Date().toISOString()
        };

        const updatedRoster = [...team.roster, newPlayer];
        const updatedBudget = team.budget - parseFloat(auctionPrice);

        // Supabase Update
        const { error } = await supabase
            .from('teams')
            .update({
                roster: updatedRoster,
                budget: updatedBudget
            })
            .eq('id', teamId);

        if (!error) {
            setTeams(prev => prev.map(t => t.id === teamId ? { ...t, roster: updatedRoster, budget: updatedBudget } : t));
        } else {
            alert("Error updating roster: " + error.message);
        }
    };

    const removePlayerFromTeam = async (teamId, playerId) => {
        const team = teams.find(t => t.id === teamId);
        if (!team) return;

        const playerToRemove = team.roster.find(p => p.id === playerId);
        const refundAmt = playerToRemove ? playerToRemove.auctionPrice : 0;

        const updatedRoster = team.roster.filter(p => p.id !== playerId);
        const updatedBudget = team.budget + refundAmt;

        const { error } = await supabase
            .from('teams')
            .update({
                roster: updatedRoster,
                budget: updatedBudget
            })
            .eq('id', teamId);

        if (!error) {
            setTeams(prev => prev.map(t => t.id === teamId ? { ...t, roster: updatedRoster, budget: updatedBudget } : t));
        }
    };

    // Derived: Get Current User Team
    const myTeam = currentUser.teamId ? teams.find(t => t.id === currentUser.teamId) : null;

    const value = {
        leagueSettings,
        teams,
        currentUser,
        myTeam,
        offers, // Exposed
        actions: {
            setCurrentUser,
            updateTeamRoster,
            removePlayerFromTeam,
            updateLeagueSettings,
            setTeams: updateTeamsState, // expose wrapped setter
            loadLeague,
            registerTeam,
            updateTeamBudget, // NEW
            applyBudgetToAllTeams, // NEW: Reset all
            sendOffer, // Exposed
            resolveOffer // Exposed
        }
    };

    return (
        <LeagueContext.Provider value={value}>
            {children}
        </LeagueContext.Provider>
    );
};
