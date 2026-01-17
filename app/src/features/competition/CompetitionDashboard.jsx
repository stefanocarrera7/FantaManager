import { useState } from 'react';
import { useCompetition } from '../../context/CompetitionContext';
import { useLeague } from '../../context/LeagueContext';
import { ChevronLeft, ChevronRight, Trophy, Calendar } from 'lucide-react';
import { GradeService, calculatePlayerScore } from '../../utils/scoringEngine';

const StandingsTable = ({ standings, teams }) => {
    const sortedIds = Object.keys(standings).sort((a, b) => {
        const diffPts = standings[b].pts - standings[a].pts;
        if (diffPts !== 0) return diffPts;
        return (standings[b].gf - standings[b].ga) - (standings[a].gf - standings[a].ga);
    });

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem' }}>Pos</th>
                        <th style={{ padding: '0.75rem' }}>Team</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Pts</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>P</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>W</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>D</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>L</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>GF</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>GA</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedIds.map((id, index) => {
                        const team = teams.find(t => t.id === id);
                        const stats = standings[id];
                        return (
                            <tr key={id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                                <td style={{ padding: '0.75rem' }}>{index + 1}</td>
                                <td style={{ padding: '0.75rem', fontWeight: 600 }}>{team?.name || id}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 700, color: 'var(--color-accent-primary)' }}>{stats.pts}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{stats.p}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{stats.w}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{stats.d}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{stats.l}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{stats.gf}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{stats.ga}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

const FixtureList = ({ fixtures, currentMatchday, teams, onResultSubmit }) => {
    const [viewMatchday, setViewMatchday] = useState(currentMatchday);

    // Safety check for empty matches
    if (!fixtures || fixtures.length === 0) return <div>No fixtures scheduled.</div>;

    const roundData = fixtures.find(f => f.round === viewMatchday);

    const handlePrev = () => setViewMatchday(curr => Math.max(1, curr - 1));
    const handleNext = () => setViewMatchday(curr => Math.min(fixtures.length, curr + 1));

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <button onClick={handlePrev} disabled={viewMatchday <= 1} className="btn-icon">
                    <ChevronLeft size={20} />
                </button>
                <h3 style={{ margin: 0 }}>Matchday {viewMatchday}</h3>
                <button onClick={handleNext} disabled={viewMatchday >= fixtures.length} className="btn-icon">
                    <ChevronRight size={20} />
                </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {roundData?.matches.map(match => {
                    const homeTeam = teams.find(t => t.id === match.homeTeamId);
                    const awayTeam = teams.find(t => t.id === match.awayTeamId);

                    if (!homeTeam || !awayTeam) return null;

                    return (
                        <div key={match.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>{homeTeam.name}</div>
                                <div style={{ width: '60px', textAlign: 'center', fontWeight: 700, fontSize: '1.2rem' }}>
                                    {match.completed
                                        ? `${match.result.homeGoals} - ${match.result.awayGoals}`
                                        : 'vs'}
                                </div>
                                <div style={{ flex: 1, textAlign: 'left', fontWeight: 600 }}>{awayTeam.name}</div>
                            </div>

                            {match.completed && (
                                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    FPS: {match.result.homeTotal} - {match.result.awayTotal}
                                </div>
                            )}

                            {!match.completed && (
                                <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                                    <button
                                        className="btn btn-sm"
                                        style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}
                                        onClick={() => {
                                            // Quick Sim for testing
                                            const homePerf = GradeService.generateRandomPerformance();
                                            const awayPerf = GradeService.generateRandomPerformance();
                                            // Mocking "Team" score as sum of 11 players approx 
                                            // Let's just generate a TOTAL score for the TEAM directly for this MVP step
                                            // Standard team scores range: 60 to 90
                                            const homeScore = 60 + Math.random() * 30;
                                            const awayScore = 60 + Math.random() * 30;

                                            onResultSubmit(match.id, { totalPoints: homeScore }, { totalPoints: awayScore });
                                        }}
                                    >
                                        Simulate Result
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const CompetitionDashboard = () => {
    const { activeCompetition, currentMatchday, actions: { processMatchResult } } = useCompetition();
    const { teams } = useLeague();
    const [activeTab, setActiveTab] = useState('standings');

    if (!activeCompetition) {
        return (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                <Trophy size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                <h3>No Active Competition</h3>
                <p>Please ask the Administrator to set up the season.</p>
            </div>
        );
    }

    return (
        <div>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="text-gradient" style={{ fontSize: '2rem' }}>{activeCompetition.name}</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className={`btn ${activeTab === 'standings' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('standings')}
                    >
                        <Trophy size={16} style={{ marginRight: '0.5rem' }} />
                        Standings
                    </button>
                    <button
                        className={`btn ${activeTab === 'fixtures' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('fixtures')}
                    >
                        <Calendar size={16} style={{ marginRight: '0.5rem' }} />
                        Fixtures
                    </button>
                </div>
            </header>

            {activeTab === 'standings' && (
                <div className="glass-card">
                    <StandingsTable standings={activeCompetition.standings} teams={teams} />
                </div>
            )}

            {activeTab === 'fixtures' && (
                <div className="glass-card">
                    <FixtureList
                        fixtures={activeCompetition.fixtures}
                        currentMatchday={currentMatchday}
                        teams={teams}
                        onResultSubmit={processMatchResult}
                    />
                </div>
            )}
        </div>
    );
};

export default CompetitionDashboard;
