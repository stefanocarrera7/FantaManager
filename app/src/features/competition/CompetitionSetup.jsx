import { useLeague } from '../../context/LeagueContext';
import { useCompetition } from '../../context/CompetitionContext';
import { Play } from 'lucide-react';

const CompetitionSetup = () => {
    const { teams } = useLeague();
    const { activeCompetition, actions: { createCompetition, resetCompetition } } = useCompetition();

    const teamsWithFullRoster = teams.filter(t => t.roster.length >= 25).length;
    const canStart = teams.length >= 2 && teamsWithFullRoster === teams.length;
    // For testing/MVP, maybe relax the 25 player rule or allow override? 
    // Let's stick to a warning or just checking if they have SOME players (e.g. > 11) for now to ease testing.
    const validRosterCount = teams.filter(t => t.roster.length >= 15).length;
    const isReady = validRosterCount === teams.length && teams.length % 2 === 0;

    const handleStart = () => {
        if (!isReady) {
            if (!confirm("Not all teams have valid rosters (15+ players) or odd number of teams. Start anyway (will include Bye)?")) return;
        }
        createCompetition('Serie A 2025/26');
    };

    if (activeCompetition) {
        return (
            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Competition Active</h2>
                <p>The season is currently underway.</p>
                <div style={{ marginTop: '2rem' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => {
                            if (confirm("Are you sure you want to reset the entire competition? Statistics will be lost.")) {
                                resetCompetition();
                            }
                        }}
                    >
                        Reset Competition (Dangerous)
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Season Setup</h2>

            <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>Pre-flight Checks</h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                        <span>Teams Registered</span>
                        <span style={{ color: teams.length >= 2 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                            {teams.length} / {teams.length % 2 === 0 ? 'Even' : 'Odd (Bye needed)'}
                        </span>
                    </li>
                    <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                        <span>Rosters Ready (15+ players)</span>
                        <span style={{ color: validRosterCount === teams.length ? 'var(--color-success)' : 'var(--color-warning)' }}>
                            {validRosterCount} / {teams.length}
                        </span>
                    </li>
                </ul>
            </div>

            <button
                className="btn btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                onClick={handleStart}
            >
                <Play size={20} />
                Generate Fixtures & Start Season
            </button>
        </div>
    );
};

export default CompetitionSetup;
