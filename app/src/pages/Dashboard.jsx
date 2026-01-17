import { useTeam } from '../context/TeamContext';
import { useCompetition } from '../context/CompetitionContext';
import { Trophy, Users, Wallet } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
            backgroundColor: `hsl(${color})`,
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'hsl(var(--color-bg-primary))'
        }}>
            <Icon size={24} />
        </div>
        <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{title}</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</h3>
        </div>
    </div>
);

const Dashboard = () => {
    const { teamName, budget, stats } = useTeam();
    const { activeCompetition } = useCompetition();

    return (
        <div>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                    Welcome back, <span className="text-gradient">{teamName}</span>
                </h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>Season 2025/26 - {activeCompetition?.name}</p>

                {/* SHARE CODE DISPLAY */}
                <div style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--color-bg-primary)', border: '1px solid var(--color-accent-gold)', borderRadius: '8px' }}>
                    <Users size={16} color="var(--color-accent-gold)" />
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Invite Friends:</span>
                    <strong style={{ letterSpacing: '2px', fontSize: '1.1rem' }}>{activeCompetition?.shareCode}</strong>
                </div>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                <StatCard
                    title="Season Budget"
                    value={`${budget} M`}
                    icon={Wallet}
                    color="var(--color-accent-primary)"
                />
                <StatCard
                    title="Squad Size"
                    value={`${stats.totalPlayers} / 25`}
                    icon={Users}
                    color="var(--color-accent-action)"
                />
                <StatCard
                    title="League Position"
                    value="-"
                    icon={Trophy}
                    color="var(--color-accent-secondary)"
                />
            </div>

            <div className="glass-card">
                <h3 style={{ marginBottom: '1rem' }}>Recent Activity</h3>
                <p style={{ color: 'var(--color-text-muted)' }}>No recent activity.</p>
            </div>
        </div>
    );
};

export default Dashboard;
