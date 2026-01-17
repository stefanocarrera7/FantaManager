import { useState } from 'react';
import { useLeague } from '../../context/LeagueContext';
import { Users, Search } from 'lucide-react';
import OfferModal from '../market/OfferModal';

const TeamBrowser = () => {
    const { teams, myTeam } = useLeague();
    const [selectedTeamId, setSelectedTeamId] = useState(teams.find(t => t.id !== myTeam?.id)?.id || '');
    const [selectedPlayerForOffer, setSelectedPlayerForOffer] = useState(null);

    const otherTeams = teams.filter(t => t.id !== myTeam?.id);
    const selectedTeam = teams.find(t => t.id === selectedTeamId);

    return (
        <div style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Search size={20} /> Browse Teams
            </h3>

            {/* Team Selector */}
            <div style={{ display: 'flex', overflowX: 'auto', gap: '1rem', paddingBottom: '1rem', marginBottom: '1rem' }}>
                {otherTeams.map(t => (
                    <button
                        key={t.id}
                        className={`glass-card ${selectedTeamId === t.id ? 'active-team' : ''}`}
                        style={{
                            minWidth: '150px', padding: '1rem', cursor: 'pointer', textAlign: 'left',
                            border: selectedTeamId === t.id ? '1px solid var(--color-accent-primary)' : '1px solid var(--glass-border)'
                        }}
                        onClick={() => setSelectedTeamId(t.id)}
                    >
                        <div style={{ fontWeight: 600 }}>{t.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Running Budget: {t.budget}</div>
                    </button>
                ))}
            </div>

            {/* Roster Grid */}
            {selectedTeam && (
                <div className="glass-card">
                    <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                        {selectedTeam.name} - Roster ({selectedTeam.roster.length})
                    </h4>

                    {selectedTeam.roster.length === 0 ? (
                        <p>No players in this team.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                            {selectedTeam.roster.map(player => (
                                <div key={player.id} className="glass-panel" style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{player.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '0.5rem' }}>
                                            <span className="badge badge-sm">{player.role}</span>
                                            <span>{player.team}</span>
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => setSelectedPlayerForOffer(player)}
                                    >
                                        Trade
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {selectedPlayerForOffer && (
                <OfferModal
                    targetPlayer={selectedPlayerForOffer}
                    targetTeamId={selectedTeamId}
                    onClose={() => setSelectedPlayerForOffer(null)}
                />
            )}
        </div>
    );
};

export default TeamBrowser;
