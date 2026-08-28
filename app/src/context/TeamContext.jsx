import { createContext, useContext, useState, useMemo } from 'react';
import { useLeague } from './LeagueContext';
import { getNextEventDate } from '../utils/budgetProcessor';

const TeamContext = createContext();

export const useTeam = () => {
    const context = useContext(TeamContext);
    if (!context) {
        throw new Error('useTeam must be used within a TeamProvider');
    }
    return context;
};

export const TeamProvider = ({ children }) => {
    // Consume Global League Data
    const { myTeam, leagueSettings, currentUser } = useLeague();

    // Fallback if no team (e.g. admin mode with no team selected, or user not assigned)
    const effectiveTeam = myTeam || {
        name: currentUser.role === 'admin' ? 'Admin View' : 'No Team Assigned',
        transferBudget: 0,
        salaryBudget: 0,
        budget: 0,
        roster: []
    };

    const [teamName, setTeamName] = useState(effectiveTeam.name);
    const [stadium, setStadium] = useState({ name: 'Stadio Olimpico', owned: false, level: 1 });

    // Market State (Client interaction)
    const [marketPhase, setMarketPhase] = useState('open');
    const [transferTargetList, setTransferTargetList] = useState([]);

    // Derived Financials
    const totalSalaries = effectiveTeam.roster.reduce((sum, p) => sum + (p.salary || 0), 0);

    // Next pre-auction restore date
    const nextRestoreDate = useMemo(() => {
        return getNextEventDate(leagueSettings.restoreDate);
    }, [leagueSettings.restoreDate]);

    // Actions
    // Note: Most "Write" actions like Buying players are now handled by LeagueContext/Admin.
    // User actions here might be limited to "Trading" or "Releasing" which we'll add later.

    const addToTargetList = (player) => {
        if (!transferTargetList.find(p => p.id === player.id)) {
            setTransferTargetList([...transferTargetList, player]);
        }
    };

    const removeFromTargetList = (playerId) => {
        setTransferTargetList(transferTargetList.filter(p => p.id !== playerId));
    };

    const value = {
        teamName: effectiveTeam.name, // Use real name from LeagueContext
        transferBudget: effectiveTeam.transferBudget ?? effectiveTeam.transfer_budget ?? 0,
        salaryBudget: effectiveTeam.salaryBudget ?? effectiveTeam.salary_budget ?? 0,
        budget: effectiveTeam.budget ?? 0, // Legacy compat
        roster: effectiveTeam.roster,   // Use real roster
        stadium,
        market: {
            phase: marketPhase,
            targetList: transferTargetList,
            leagueTeams: [] // Could expose other teams here if needed
        },
        financials: {
            totalSalaries,
            nextRestoreDate,
            restoreTransferAmount: leagueSettings.restoreTransferAmount || 0,
            restoreSalaryAmount: leagueSettings.restoreSalaryAmount || 0,
            history: [] // To be implemented
        },
        stats: {
            totalPlayers: effectiveTeam.roster.length,
            gkCount: effectiveTeam.roster.filter(p => p.role === 'POR').length,
        },
        actions: {
            setTeamName,
            setMarketPhase,
            addToTargetList,
            removeFromTargetList,
            // addPlayer and removePlayer removed/deprecated in favor of Admin actions
        }
    };

    return (
        <TeamContext.Provider value={value}>
            {children}
        </TeamContext.Provider>
    );
};
