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
import { checkAndProcessBudgetEvents, DEFAULT_FINANCE_SETTINGS } from '../utils/budgetProcessor';

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

        // Load competition settings
        const { data: comp } = await supabase
            .from('competitions')
            .select('admin_id, settings')
            .eq('id', competitionId)
            .single();

        // Merge with defaults (in case some settings are missing)
        const settings = { ...DEFAULT_FINANCE_SETTINGS, ...(comp?.settings || {}) };
        setLeagueSettings(settings);

        // Normalize data (backend uses snake_case, frontend uses camelCase)
        let normalizedTeams = leagueTeams.map(t => ({
            ...t,
            id: t.id,
            ownerId: t.owner_id,
            competitionId: t.competition_id,
            transferBudget: t.transfer_budget ?? t.budget ?? 300,
            salaryBudget: t.salary_budget ?? 200,
            budget: t.budget, // Keep for backwards compat
            roster: t.roster || []
        }));

        // --- AUTO-PROCESS BUDGET EVENTS ---
        const isAdmin = comp?.admin_id === user?.id;
        if (isAdmin) {
            // Only admin triggers auto-processing to avoid race conditions
            const result = await checkAndProcessBudgetEvents(competitionId, settings, normalizedTeams);
            if (result.changed) {
                normalizedTeams = result.updatedTeams.map(t => ({
                    ...t,
                    transferBudget: t.transferBudget ?? t.transfer_budget,
                    salaryBudget: t.salaryBudget ?? t.salary_budget
                }));
                setLeagueSettings(result.updatedSettings);
                console.log('[LeagueContext] Budget events processed automatically.');
            }
        }

        setTeams(normalizedTeams);

        // Determine User Role
        if (!user) return;

        const myTeam = normalizedTeams.find(t => t.ownerId === user.id);
        const role = isAdmin ? 'admin' : (myTeam ? 'manager' : 'guest');

        setCurrentUser({ role, teamId: myTeam ? myTeam.id : null });
    };

    const registerTeam = async (competitionId, teamName, ownerId) => {
        // Use league settings for initial budgets
        const newTeam = {
            competition_id: competitionId,
            owner_id: user.id, // Securely use auth user id
            name: teamName,
            budget: leagueSettings.initialTransferBudget + leagueSettings.initialSalaryBudget, // Legacy compat
            transfer_budget: leagueSettings.initialTransferBudget,
            salary_budget: leagueSettings.initialSalaryBudget,
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
            transferBudget: data.transfer_budget,
            salaryBudget: data.salary_budget,
            budget: data.budget,
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

    // League Settings (now loaded from DB via loadLeague)
    const [leagueSettings, setLeagueSettings] = useState(DEFAULT_FINANCE_SETTINGS);

    const updateTeamTransferBudget = async (teamId, newBudget) => {
        const { error } = await supabase
            .from('teams')
            .update({ transfer_budget: parseInt(newBudget) })
            .eq('id', teamId);

        if (!error) {
            setTeams(prev => prev.map(t => t.id === teamId ? { ...t, transferBudget: parseInt(newBudget) } : t));
        } else {
            alert("Failed to update transfer budget: " + error.message);
        }
    };

    const updateTeamSalaryBudget = async (teamId, newBudget) => {
        const { error } = await supabase
            .from('teams')
            .update({ salary_budget: parseInt(newBudget) })
            .eq('id', teamId);

        if (!error) {
            setTeams(prev => prev.map(t => t.id === teamId ? { ...t, salaryBudget: parseInt(newBudget) } : t));
        } else {
            alert("Failed to update salary budget: " + error.message);
        }
    };

    const applyBudgetToAllTeams = async (newTransferBudget, newSalaryBudget) => {
        const { error } = await supabase
            .from('teams')
            .update({
                transfer_budget: parseInt(newTransferBudget),
                salary_budget: parseInt(newSalaryBudget)
            })
            .eq('competition_id', currentCompetitionId);

        if (!error) {
            setTeams(prev => prev.map(t => ({
                ...t,
                transferBudget: parseInt(newTransferBudget),
                salaryBudget: parseInt(newSalaryBudget)
            })));
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
        const updatedTransferBudget = (team.transferBudget ?? team.transfer_budget ?? 0) - parseFloat(auctionPrice);

        // Supabase Update
        const { error } = await supabase
            .from('teams')
            .update({
                roster: updatedRoster,
                transfer_budget: updatedTransferBudget
            })
            .eq('id', teamId);

        if (!error) {
            setTeams(prev => prev.map(t => t.id === teamId
                ? { ...t, roster: updatedRoster, transferBudget: updatedTransferBudget }
                : t
            ));
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
        const updatedTransferBudget = (team.transferBudget ?? team.transfer_budget ?? 0) + refundAmt;

        const { error } = await supabase
            .from('teams')
            .update({
                roster: updatedRoster,
                transfer_budget: updatedTransferBudget
            })
            .eq('id', teamId);

        if (!error) {
            setTeams(prev => prev.map(t => t.id === teamId
                ? { ...t, roster: updatedRoster, transferBudget: updatedTransferBudget }
                : t
            ));
        }
    };

    const updateLeagueSettings = async (newSettings) => {
        const merged = { ...leagueSettings, ...newSettings };
        setLeagueSettings(merged);

        // Persist to competitions.settings
        if (currentCompetitionId) {
            const { error } = await supabase
                .from('competitions')
                .update({ settings: merged })
                .eq('id', currentCompetitionId);

            if (error) {
                console.error('Error saving league settings:', error);
                alert('Failed to save settings: ' + error.message);
            }
        }
    };

    // --- TRADING SYSTEM ---
    const [offers, setOffers] = useState([]);

    const sendOffer = (offer) => {
        const newOffer = { ...offer, id: `off_${Date.now()}`, status: 'pending', date: new Date().toISOString() };
        setOffers(prev => [...prev, newOffer]);
        return newOffer;
    };

    const resolveOffer = (offerId, action) => {
        setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: action === 'cancel' ? 'cancelled' : action } : o));

        if (action !== 'accept') return;

        const targetOffer = offers.find(o => o.id === offerId);
        if (!targetOffer) return;

        const { fromTeamId, toTeamId, type, price, playerInId, playerOutId, loanDetails } = targetOffer;

        setTeams(prevTeams => {
            const fromTeam = prevTeams.find(t => t.id === fromTeamId);
            const toTeam = prevTeams.find(t => t.id === toTeamId);

            if (!fromTeam || !toTeam) return prevTeams;

            const transferPlayer = (teamsList, playerId, sourceId, destId, metadata = {}) => {
                const source = teamsList.find(t => t.id === sourceId);
                const dest = teamsList.find(t => t.id === destId);
                const player = source.roster.find(p => p.id === playerId);
                if (!player) return teamsList;

                const playerToMove = { ...player, ...metadata };
                const newSource = { ...source, roster: source.roster.filter(p => p.id !== playerId) };
                const newDest = { ...dest, roster: [...dest.roster, playerToMove] };

                return teamsList.map(t => {
                    if (t.id === sourceId) return newSource;
                    if (t.id === destId) return newDest;
                    return t;
                });
            };

            let updatedTeams = [...prevTeams];

            // Cash transfers operate on transferBudget
            if (price && price > 0) {
                updatedTeams = updatedTeams.map(t => {
                    if (t.id === fromTeamId) return { ...t, transferBudget: (t.transferBudget || 0) - price };
                    if (t.id === toTeamId) return { ...t, transferBudget: (t.transferBudget || 0) + price };
                    return t;
                });
            }

            if (type === 'purchase') {
                updatedTeams = transferPlayer(updatedTeams, playerInId, toTeamId, fromTeamId);
            } else if (type === 'loan') {
                updatedTeams = transferPlayer(updatedTeams, playerInId, toTeamId, fromTeamId, {
                    loanedFrom: toTeamId,
                    loanDetails: loanDetails
                });
            } else if (type === 'swap') {
                updatedTeams = transferPlayer(updatedTeams, playerInId, toTeamId, fromTeamId);
                updatedTeams = transferPlayer(updatedTeams, playerOutId, fromTeamId, toTeamId);
            }

            return updatedTeams;
        });
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
            updateTeamTransferBudget, // Replaces updateTeamBudget
            updateTeamSalaryBudget,   // NEW
            applyBudgetToAllTeams,    // Updated for dual budgets
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
