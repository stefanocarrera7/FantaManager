import { useTeam } from '../../context/TeamContext';
import PlayerCard from './PlayerCard';

const RoleSection = ({ title, players, limit, currentCount }) => {
    return (
        <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{title}</h3>
                <span style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: currentCount > limit ? 'var(--color-accent-secondary)' : 'var(--color-text-muted)',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px'
                }}>
                    {currentCount} / {limit}
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {players.map(player => (
                    <PlayerCard key={player.id} player={player} />
                ))}
                {players.length === 0 && (
                    <div className="glass-card" style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', borderStyle: 'dashed' }}>
                        No players in this role
                    </div>
                )}
            </div>
        </div>
    );
};

const RosterList = () => {
    const { roster } = useTeam();

    // Group Players
    const goalkeepers = roster.filter(p => p.role === 'POR');
    const defenders = roster.filter(p => p.role === 'DIF');
    const midfielders = roster.filter(p => p.role === 'CEN');
    const attackers = roster.filter(p => p.role === 'ATT');

    // Custom limits based on standard Fantacalcio or user specified
    // User said "3 Goalkeepers and 22 Players". I'll assume 22 is total outfield for now, but usually it's split.
    // I will just show total count of others for now or assume standard 8-8-6 split if not specified.
    // "Implement a roster limit of 3 Goalkeepers and 22 Players" -> 3 GK, 22 Others.

    return (
        <div>
            <RoleSection title="Portieri (GK)" players={goalkeepers} limit={3} currentCount={goalkeepers.length} />
            <RoleSection title="Difensori (DEF)" players={defenders} limit={8} currentCount={defenders.length} />
            <RoleSection title="Centrocampisti (MID)" players={midfielders} limit={8} currentCount={midfielders.length} />
            <RoleSection title="Attaccanti (ATT)" players={attackers} limit={6} currentCount={attackers.length} />

            {/* Total Capacity Check */}
            <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="text-gradient" style={{ fontWeight: 700 }}>
                    Total Squad: {roster.length} / 25
                </p>
            </div>
        </div>
    );
};

export default RosterList;
