import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompetition } from '../context/CompetitionContext';
import { useLeague } from '../context/LeagueContext';
import { Trophy, Users, PlusCircle, ArrowRight, LogOut, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

const MyLeagues = () => {
    const { user, logout } = useAuth();
    const { actions } = useCompetition(); // Switch/Join/Create
    const { actions: leagueActions } = useLeague();
    const navigate = useNavigate();

    const [myLeagues, setMyLeagues] = useState([]);

    useEffect(() => {
        if (!user) return;

        const fetchMyLeagues = async () => {
            // Fetch teams joined by me, and join with competition info
            const { data: myTeams, error } = await supabase
                .from('teams')
                .select(`
                    *,
                    competitions (
                        id, name, share_code, admin_id
                    )
                `)
                .eq('owner_id', user.id);

            if (error) {
                console.error("Error fetching leagues:", error);
                return;
            }

            const leagues = myTeams.map(team => ({
                competition: {
                    id: team.competitions.id,
                    name: team.competitions.name,
                    shareCode: team.competitions.share_code,
                    adminId: team.competitions.admin_id
                },
                myTeam: {
                    name: team.name,
                    id: team.id
                }
            }));

            setMyLeagues(leagues);
        };

        fetchMyLeagues();
    }, [user]);

    const handleSelectLeague = async (comp) => {
        const res = await actions.switchCompetition(comp.id);
        if (res.success) {
            await leagueActions.loadLeague(comp.id); // Also good practice to await this
            navigate('/dashboard');
        } else {
            alert('Error loading league: ' + res.message);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={{ minHeight: '100vh', padding: '2rem', backgroundColor: 'var(--color-bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            {/* Header */}
            <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="logo-text" style={{ fontSize: '1.5rem' }}>FantaManager</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Logged in as <strong style={{ color: 'white' }}>{user?.username}</strong></span>
                    <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem' }} title="Logout">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>

            <div style={{ width: '100%', maxWidth: '800px' }}>
                <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>My Leagues</h1>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>Select a league to manage or join a new one.</p>

                {/* League List */}
                <div style={{ display: 'grid', gap: '1rem', marginBottom: '3rem' }}>
                    {myLeagues.length > 0 ? (
                        myLeagues.map(({ competition, myTeam }) => (
                            <div
                                key={competition.id}
                                className="glass-card"
                                style={{
                                    padding: '1.5rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    borderLeft: `4px solid var(--color-accent-primary)`
                                }}
                                onClick={() => handleSelectLeague(competition)}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.3rem', marginBottom: '0.3rem' }}>{competition.name}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <Shield size={14} /> {myTeam.name}
                                        </span>
                                        <span>•</span>
                                        <span>Role: {competition.adminId === user?.username ? 'Admin' : 'Manager'}</span>
                                    </div>
                                </div>
                                <ArrowRight size={24} color="var(--color-accent-primary)" />
                            </div>
                        ))
                    ) : (
                        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                            <Trophy size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>You haven't joined any leagues yet.</p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <button
                        className="glass-card"
                        onClick={() => navigate('/select-competition')} // Re-using select competition for "New" flow
                        style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', textAlign: 'center' }}
                    >
                        <PlusCircle size={32} color="var(--color-accent-primary)" />
                        <span style={{ fontWeight: 600 }}>Create / Join New League</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Start fresh or use a code</span>
                    </button>
                    {/* Placeholder for future features or just filler */}
                </div>
            </div>
        </div>
    );
};

export default MyLeagues;
