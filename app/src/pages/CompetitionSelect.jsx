import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useCompetition } from '../context/CompetitionContext';
import { useLeague } from '../context/LeagueContext';
import { useAuth } from '../context/AuthContext';
import { Trophy, Users, ArrowRight, Copy, Search, PlusCircle, Shield } from 'lucide-react';

const CompetitionSelect = () => {
    const { actions } = useCompetition();
    const { actions: leagueActions } = useLeague();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [mode, setMode] = useState('menu'); // 'menu', 'create', 'join'
    const [joinCode, setJoinCode] = useState('');
    const [compName, setCompName] = useState('');
    const [teamName, setTeamName] = useState(''); // NEW
    const [error, setError] = useState('');

    // If already in a competition, go to dashboard
    const { activeCompetition } = useCompetition();
    if (activeCompetition) {
        // Can't use navigate in render, but can return Navigate component or use useEffect
        // Let's use early return with Navigate for cleaner render logic
        return <Navigate to="/dashboard" replace />;
    }

    const handleCreate = (e) => {
        e.preventDefault();

        // 1. Create Competition (Pass current user as Admin)
        const comp = actions.createCompetition(compName || 'My League', user.username);

        // 2. Create User's Team in this Competition
        const teamRes = leagueActions.registerTeam(comp.id, teamName, user.username);

        if (teamRes.success) {
            // 3. Load the League
            leagueActions.loadLeague(comp.id);
            navigate('/dashboard');
        } else {
            setError(teamRes.message);
        }
    };

    const handleJoin = (e) => {
        e.preventDefault();

        // 1. Join Competition (Verify Code)
        const res = actions.joinCompetition(joinCode);

        if (res.success) {
            // 2. Create Team
            const teamRes = leagueActions.registerTeam(res.competition.id, teamName, user.username);

            if (teamRes.success) {
                // 3. Load League
                leagueActions.loadLeague(res.competition.id);
                navigate('/dashboard');
            } else {
                setError(teamRes.message);
            }
        } else {
            setError(res.message);
        }
    };

    return (
        <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-primary)' }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '3rem', textAlign: 'center' }}>

                {mode === 'menu' && (
                    <>
                        <Trophy size={48} style={{ color: 'var(--color-accent-gold)', marginBottom: '1rem' }} />
                        <h1 style={{ marginBottom: '2rem', fontFamily: 'var(--font-family-header)', color: 'var(--color-accent-primary)' }}>Choose Your Path</h1>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <button
                                onClick={() => setMode('join')}
                                className="glass-card"
                                style={{
                                    padding: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem',
                                    border: '1px solid var(--color-accent-primary)', background: 'white',
                                    transition: 'transform 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <Users size={24} color="var(--color-accent-primary)" />
                                <div style={{ textAlign: 'left' }}>
                                    <h3 style={{ margin: 0, color: 'var(--color-accent-primary)' }}>Join Existing League</h3>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Enter a code to join a friend's league</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setMode('create')}
                                className="glass-card"
                                style={{
                                    padding: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem',
                                    background: 'var(--color-accent-primary)', color: 'white', border: 'none',
                                    transition: 'transform 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <PlusCircle size={24} color="white" />
                                <div style={{ textAlign: 'left' }}>
                                    <h3 style={{ margin: 0, color: 'white' }}>Create New League</h3>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>Start a fresh competition as Admin</p>
                                </div>
                            </button>
                        </div>
                    </>
                )}

                {mode === 'join' && (
                    <form onSubmit={handleJoin}>
                        <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-accent-primary)' }}>Join League</h2>
                        {error && <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', textAlign: 'left' }}>League Code</label>
                            <input
                                type="text"
                                placeholder="Enter 6-Character Code"
                                className="input-field"
                                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.2rem', textTransform: 'uppercase' }}
                                value={joinCode}
                                onChange={e => setJoinCode(e.target.value)}
                                maxLength={6}
                                required
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>Your Team Name</label>
                            <div style={{ position: 'relative' }}>
                                <Shield size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="e.g. Real Madrid"
                                    className="input-field"
                                    style={{ width: '100%', paddingLeft: '40px' }}
                                    value={teamName}
                                    onChange={e => setTeamName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="button" onClick={() => { setMode('menu'); setError('') }} className="btn btn-secondary" style={{ flex: 1 }}>Back</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Join League</button>
                        </div>
                    </form>
                )}

                {mode === 'create' && (
                    <form onSubmit={handleCreate}>
                        <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-accent-primary)' }}>New League</h2>

                        <div className="form-group" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>League Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Serie A 2024"
                                className="input-field"
                                value={compName}
                                onChange={e => setCompName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>Your Team Name</label>
                            <div style={{ position: 'relative' }}>
                                <Shield size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="e.g. Real Madrid"
                                    className="input-field"
                                    style={{ width: '100%', paddingLeft: '40px' }}
                                    value={teamName}
                                    onChange={e => setTeamName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="button" onClick={() => setMode('menu')} className="btn btn-secondary" style={{ flex: 1 }}>Back</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create & Start</button>
                        </div>
                    </form>
                )}

            </div>
        </div>
    );
};

export default CompetitionSelect;
