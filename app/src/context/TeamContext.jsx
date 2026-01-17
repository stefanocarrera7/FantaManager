import { createContext, useContext, useState, useMemo } from 'react';
import { useLeague } from './LeagueContext';

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

    const installments = useMemo(() => {
        const tranches = leagueSettings.tranches || [];
        if (tranches.length === 0) return { december: 0, june: 0 };

        // Simple 50/50 split based on User Rule "Fixed dates 31/01 and 01/09"
        // Assuming the total annual salary is split evenly between the two dates.
        const half = Math.ceil(totalSalaries / 2);
        return {
            firstTranche: half,  // 31 Jan
            secondTranche: totalSalaries - half // 1 Sep
        };
    }, [totalSalaries, leagueSettings.tranches]);

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
        budget: effectiveTeam.budget,   // Use real budget
        roster: effectiveTeam.roster,   // Use real roster
        stadium,
        market: {
            phase: marketPhase,
            targetList: transferTargetList,
            leagueTeams: [] // Could expose other teams here if needed
        },
        financials: {
            totalSalaries,
            installments,
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
