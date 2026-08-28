import { useState } from 'react';
import { useLeague } from '../../context/LeagueContext';
import { useCompetition } from '../../context/CompetitionContext';
import { Play, RefreshCw, Trophy, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const CompetitionSetup = () => {
    const { teams } = useLeague();
    const { activeCompetition, actions: { startSeason, resetCompetition } } = useCompetition();
    const [generating, setGenerating] = useState(false);

    const hasFixtures = activeCompetition?.fixtures && activeCompetition.fixtures.length > 0;
    const teamsWithFullRoster = teams.filter(t => t.roster && t.roster.length >= 11).length;
    const isReady = teams.length >= 2;

    const handleStart = async () => {
        if (teams.length < 2) {
            toast.error('Servono almeno 2 squadre per avviare il campionato.');
            return;
        }

        setGenerating(true);
        try {
            await startSeason(activeCompetition?.name || 'Serie A 2025/26', teams);
            toast.success(`Calendario a ${teams.length * 2 - 2} giornate generato con successo!`);
        } catch (e) {
            toast.error('Errore durante l\'avvio: ' + e.message);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Trophy size={22} color="var(--color-accent-primary)" />
                    <h3 style={{ margin: 0 }}>Gestione Stagione & Calendario</h3>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleStart}
                        disabled={generating || teams.length < 2}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}
                    >
                        <Play size={16} />
                        {generating ? 'Generazione...' : (hasFixtures ? `🔄 Rigenera Calendario (${teams.length} Squadre)` : `🏁 Avvia Campionato (${teams.length} Squadre)`)}
                    </button>

                    {hasFixtures && (
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                if (confirm("Sei sicuro di voler azzerare il calendario e la classifica?")) {
                                    resetCompetition();
                                    toast.success("Campionato azzerato.");
                                }
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#ef4444' }}
                        >
                            Azzera Calendario
                        </button>
                    )}
                </div>
            </div>

            {/* Status Checklist */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                padding: '1rem',
                borderRadius: '10px',
                border: '1px solid var(--glass-border)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Users size={20} color={teams.length >= 2 ? 'var(--color-accent-primary)' : '#ef4444'} />
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Squadre Registrate</div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                            {teams.length} {teams.length >= 2 ? '✅' : '⚠️ (minimo 2)'}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CheckCircle size={20} color={teamsWithFullRoster === teams.length ? 'var(--color-accent-primary)' : '#f59e0b'} />
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Rose Pronte (11+ calciatori)</div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                            {teamsWithFullRoster} / {teams.length}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Trophy size={20} color={hasFixtures ? 'var(--color-accent-primary)' : 'var(--color-text-muted)'} />
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Stato Calendario</div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: hasFixtures ? 'var(--color-accent-primary)' : 'var(--color-text-muted)' }}>
                            {hasFixtures ? `${activeCompetition.fixtures.length} Giornate Attive` : 'Non Generato'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompetitionSetup;
