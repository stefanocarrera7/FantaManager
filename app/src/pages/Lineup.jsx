import { useState, useEffect } from 'react';
import { useTeam } from '../context/TeamContext';
import { useCompetition } from '../context/CompetitionContext';
import { useLeague } from '../context/LeagueContext';
import LineupPitch from '../features/lineup/LineupPitch';
import LineupBench from '../features/lineup/LineupBench';
import {
    MODULES,
    getMatchdayDeadline,
    isLineupSubmissionOpen,
    getTimeUntilDeadline,
    getTeamLineup,
    saveTeamLineup
} from '../utils/lineupService';
import { Shield, Clock, Save, Lock, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const roleColors = {
    POR: '#f59e0b',
    DIF: '#3b82f6',
    CEN: '#10b981',
    ATT: '#ef4444'
};

const Lineup = () => {
    const { roster, teamName } = useTeam();
    const { activeCompetition, currentMatchday } = useCompetition();
    const { currentUser, myTeam } = useLeague();

    const [module, setModule] = useState('4-3-3');
    const [starters, setStarters] = useState([]);
    const [bench, setBench] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null); // { role, index }
    const [rosterFilter, setRosterFilter] = useState('ALL');
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);

    // Deadline countdown state
    const [matchInfo, setMatchInfo] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState({ expired: false, text: '' });
    const isLocked = !isLineupSubmissionOpen(activeCompetition, currentMatchday);

    // 1. Calculate deadline and update timer
    useEffect(() => {
        if (!activeCompetition) return;
        const info = getMatchdayDeadline(activeCompetition, currentMatchday);
        setMatchInfo(info);

        const updateTimer = () => {
            setTimeRemaining(getTimeUntilDeadline(info.deadline));
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [activeCompetition, currentMatchday]);

    // 2. Load existing lineup from Supabase
    useEffect(() => {
        const loadSavedLineup = async () => {
            if (!activeCompetition || !myTeam?.id) return;

            const saved = await getTeamLineup(activeCompetition.id, myTeam.id, currentMatchday);
            if (saved) {
                if (saved.module && MODULES[saved.module]) {
                    setModule(saved.module);
                }
                if (Array.isArray(saved.starters)) setStarters(saved.starters);
                if (Array.isArray(saved.bench)) setBench(saved.bench);
                if (saved.submitted_at) setLastSaved(new Date(saved.submitted_at).toLocaleTimeString());
                if (saved.isFallback) {
                    toast.success('Formazione recuperata dall\'ultima giornata valida!');
                }
            }
        };
        loadSavedLineup();
    }, [activeCompetition, myTeam?.id, currentMatchday]);

    // Handle module change: prune excess starters if new module has fewer in a role
    const handleModuleChange = (newModule) => {
        setModule(newModule);
        const reqs = MODULES[newModule];
        if (!reqs) return;

        // Ensure we don't exceed allowed count per role
        const newStarters = [];
        const newBench = [...bench];

        ['POR', 'DIF', 'CEN', 'ATT'].forEach(role => {
            const roleStarters = starters.filter(p => p.role === role);
            const allowed = reqs[role];
            const kept = roleStarters.slice(0, allowed);
            const excess = roleStarters.slice(allowed);

            newStarters.push(...kept);
            // Move excess to bench if not already there
            excess.forEach(p => {
                if (!newBench.some(b => b.id === p.id)) {
                    newBench.push(p);
                }
            });
        });

        setStarters(newStarters);
        setBench(newBench);
    };

    // Remove starter -> moves to bench
    const handleRemoveStarter = (playerId) => {
        const player = starters.find(p => p.id === playerId);
        if (!player) return;
        setStarters(prev => prev.filter(p => p.id !== playerId));
        if (!bench.some(p => p.id === playerId)) {
            setBench(prev => [...prev, player]);
        }
    };

    // Remove from bench
    const handleRemoveBench = (playerId) => {
        setBench(prev => prev.filter(p => p.id !== playerId));
    };

    // Move bench player up
    const handleMoveUp = (index) => {
        if (index <= 0) return;
        setBench(prev => {
            const next = [...prev];
            const temp = next[index - 1];
            next[index - 1] = next[index];
            next[index] = temp;
            return next;
        });
    };

    // Move bench player down
    const handleMoveDown = (index) => {
        if (index >= bench.length - 1) return;
        setBench(prev => {
            const next = [...prev];
            const temp = next[index + 1];
            next[index + 1] = next[index];
            next[index] = temp;
            return next;
        });
    };

    // Add player from pool: either into selected slot or onto bench/starters
    const handleAssignPlayer = (player) => {
        if (isLocked) return;

        const isAlreadyStarter = starters.some(p => p.id === player.id);
        const isAlreadyBench = bench.some(p => p.id === player.id);

        if (isAlreadyStarter) {
            toast.error(`${player.name} è già tra i titolari`);
            return;
        }

        const reqs = MODULES[module];
        const currentCountInRole = starters.filter(p => p.role === player.role).length;
        const maxInRole = reqs[player.role];

        // If target slot is selected, assign to that role slot
        if (currentCountInRole < maxInRole) {
            // Remove from bench if moving to starter
            if (isAlreadyBench) {
                setBench(prev => prev.filter(p => p.id !== player.id));
            }
            setStarters(prev => [...prev, player]);
            toast.success(`${player.name} inserito nei titolari`);
        } else {
            // Starters full for this role -> add to bench
            if (!isAlreadyBench) {
                setBench(prev => [...prev, player]);
                toast.success(`${player.name} inserito in panchina`);
            } else {
                toast.error(`${player.name} è già in panchina`);
            }
        }
    };

    // Save Lineup to DB
    const handleSaveLineup = async () => {
        if (isLocked) {
            toast.error('Il tempo limite per la consegna è scaduto.');
            return;
        }

        if (starters.length !== 11) {
            toast.error(`Devi schierare esattamente 11 titolari (attualmente: ${starters.length})`);
            return;
        }

        if (!activeCompetition?.id || !myTeam?.id) {
            toast.error('Errore: nessuna competizione o squadra attiva.');
            return;
        }

        setSaving(true);
        const res = await saveTeamLineup(
            activeCompetition.id,
            myTeam.id,
            currentMatchday,
            module,
            starters,
            bench
        );
        setSaving(false);

        if (res.success) {
            setLastSaved(new Date().toLocaleTimeString());
            toast.success('Formazione salvata con successo!');
        } else {
            toast.error('Errore durante il salvataggio: ' + res.message);
        }
    };

    // Filter roster pool
    const filteredRoster = roster.filter(player => {
        if (rosterFilter === 'ALL') return true;
        return player.role === rosterFilter;
    });

    return (
        <div>
            <Toaster position="top-right" />

            {/* Header with Title and Deadline */}
            <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>
                        Schiera <span className="text-gradient">Formazione</span>
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                        Giornata {currentMatchday} (Serie A: G{matchInfo?.serieAMatchday || currentMatchday}) • {teamName}
                    </p>
                </div>

                {/* Deadline Banner */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '12px',
                    backgroundColor: isLocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    border: `1px solid ${isLocked ? '#ef4444' : 'var(--color-accent-primary)'}`
                }}>
                    {isLocked ? <Lock size={24} color="#ef4444" /> : <Clock size={24} color="var(--color-accent-primary)" />}
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {matchInfo ? `Prima Partita: ${matchInfo.firstMatch} (${matchInfo.description})` : 'Chiusura Consegna'}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: isLocked ? '#ef4444' : 'white', marginTop: '0.1rem' }}>
                            {timeRemaining.text}
                        </div>
                    </div>
                </div>
            </header>

            {/* Controls Bar: Module Selector & Save Action */}
            <div className="glass-card" style={{
                padding: '1rem 1.5rem',
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Modulo Tattico:</span>
                    <select
                        value={module}
                        onChange={(e) => handleModuleChange(e.target.value)}
                        disabled={isLocked}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'white',
                            border: '1px solid var(--glass-border)',
                            fontWeight: 700,
                            cursor: isLocked ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {Object.keys(MODULES).map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {lastSaved && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <CheckCircle size={14} color="var(--color-accent-primary)" /> Salvata alle {lastSaved}
                        </span>
                    )}

                    <button
                        className="btn btn-primary"
                        onClick={handleSaveLineup}
                        disabled={isLocked || saving}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 1.5rem',
                            opacity: isLocked ? 0.5 : 1
                        }}
                    >
                        <Save size={18} />
                        {saving ? 'Salvataggio...' : 'Consegna Formazione'}
                    </button>
                </div>
            </div>

            {/* Main Grid: Pitch + Bench on Left, Roster Pool on Right */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 340px', gap: '1.5rem', alignItems: 'start' }}>

                {/* Left Column: Pitch & Bench */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <LineupPitch
                        module={module}
                        starters={starters}
                        onRemoveStarter={handleRemoveStarter}
                        onSelectSlot={setSelectedSlot}
                        selectedSlot={selectedSlot}
                        isLocked={isLocked}
                    />

                    <LineupBench
                        bench={bench}
                        onRemoveBench={handleRemoveBench}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        isLocked={isLocked}
                    />
                </div>

                {/* Right Column: Roster Pool */}
                <div className="glass-card" style={{ padding: '1.25rem', position: 'sticky', top: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Rosa ({roster.length})</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-accent-primary)', fontWeight: 600 }}>
                            {starters.length}/11 Titolari
                        </span>
                    </div>

                    {/* Role Filter Tabs */}
                    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
                        {['ALL', 'POR', 'DIF', 'CEN', 'ATT'].map(role => (
                            <button
                                key={role}
                                onClick={() => setRosterFilter(role)}
                                className={`btn ${rosterFilter === role ? 'btn-primary' : 'btn-secondary'}`}
                                style={{
                                    flex: 1,
                                    fontSize: '0.75rem',
                                    padding: '0.35rem 0.2rem',
                                    backgroundColor: rosterFilter === role ? undefined : 'rgba(255,255,255,0.05)'
                                }}
                            >
                                {role}
                            </button>
                        ))}
                    </div>

                    {/* Player list */}
                    <div style={{ maxHeight: '580px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingRight: '0.25rem' }}>
                        {filteredRoster.map(player => {
                            const isStarter = starters.some(p => p.id === player.id);
                            const isBenchPlayer = bench.some(p => p.id === player.id);

                            return (
                                <div
                                    key={player.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.5rem 0.6rem',
                                        borderRadius: '8px',
                                        backgroundColor: isStarter
                                            ? 'rgba(16, 185, 129, 0.1)'
                                            : isBenchPlayer
                                            ? 'rgba(245, 158, 11, 0.1)'
                                            : 'rgba(255, 255, 255, 0.03)',
                                        border: isStarter
                                            ? '1px solid rgba(16, 185, 129, 0.3)'
                                            : isBenchPlayer
                                            ? '1px solid rgba(245, 158, 11, 0.3)'
                                            : '1px solid rgba(255, 255, 255, 0.05)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            padding: '0.1rem 0.3rem',
                                            borderRadius: '4px',
                                            backgroundColor: roleColors[player.role],
                                            color: 'black'
                                        }}>
                                            {player.role}
                                        </span>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{player.name}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                                {player.team} • Qt: {player.value}
                                            </div>
                                        </div>
                                    </div>

                                    {!isLocked && (
                                        <div>
                                            {isStarter ? (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-primary)', fontWeight: 600 }}>
                                                    Titolare
                                                </span>
                                            ) : isBenchPlayer ? (
                                                <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>
                                                    Panchina
                                                </span>
                                            ) : (
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                                    onClick={() => handleAssignPlayer(player)}
                                                >
                                                    <Plus size={12} /> Schiera
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Lineup;

