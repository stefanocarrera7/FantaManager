import { User, Shield, Zap, Target } from 'lucide-react';

const RoleIcon = ({ role }) => {
    switch (role) {
        case 'POR': return <Shield size={18} className="text-yellow-500" />; // Gk
        case 'DIF': return <Shield size={18} className="text-green-500" />; // Def
        case 'CEN': return <Zap size={18} className="text-blue-500" />; // Mid
        case 'ATT': return <Target size={18} className="text-red-500" />; // Att
        default: return <User size={18} />;
    }
};

const getRoleColor = (role) => {
    switch (role) {
        case 'POR': return 'var(--color-accent-primary)'; // Gold
        case 'DIF': return '#10B981'; // Green
        case 'CEN': return '#3B82F6'; // Blue
        case 'ATT': return '#EF4444'; // Red
        default: return 'gray';
    }
};

const PlayerCard = ({ player }) => {
    const roleColor = getRoleColor(player.role);
    const isGrey = player.status === 'grey';

    return (
        <div className="glass-card" style={{
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderLeft: `4px solid ${isGrey ? 'var(--color-text-muted)' : roleColor}`,
            opacity: isGrey ? 0.6 : 1,
            filter: isGrey ? 'grayscale(0.8)' : 'none',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: isGrey ? 'var(--color-text-muted)' : roleColor
                }}>
                    {player.role}
                </div>
                <div>
                    <h4 style={{ fontWeight: 600, fontSize: '1.1rem', textDecoration: isGrey ? 'line-through' : 'none' }}>{player.name}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{player.team}</p>
                </div>
            </div>

            <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--color-accent-primary)' }}>
                    Paid: {player.auctionPrice} <span style={{ fontSize: '0.8rem' }}>cr</span>
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    <span>Qt: {player.value}</span> | <span>Sal: {player.salary}</span>
                </div>
            </div>
        </div>
    );
};

export default PlayerCard;
