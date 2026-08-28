import { ArrowUp, ArrowDown, UserMinus } from 'lucide-react';

const roleColors = {
    POR: '#f59e0b',
    DIF: '#3b82f6',
    CEN: '#10b981',
    ATT: '#ef4444'
};

const LineupBench = ({ bench = [], onRemoveBench, onMoveUp, onMoveDown, isLocked }) => {
    return (
        <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Panchina ({bench.length} giocatori)</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Ordine di subentro dall'alto in basso
                </span>
            </div>

            {bench.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
                    Nessun giocatore in panchina. Seleziona i panchinari dalla rosa.
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {bench.map((player, idx) => (
                        <div
                            key={player.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.6rem 0.8rem',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid var(--glass-border)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    color: 'var(--color-text-muted)',
                                    width: '20px'
                                }}>
                                    #{idx + 1}
                                </span>
                                <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    padding: '0.15rem 0.4rem',
                                    borderRadius: '4px',
                                    backgroundColor: roleColors[player.role] || '#888',
                                    color: 'black'
                                }}>
                                    {player.role}
                                </span>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{player.name}</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>({player.team})</span>
                            </div>

                            {!isLocked && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <button
                                        onClick={() => onMoveUp(idx)}
                                        disabled={idx === 0}
                                        className="btn btn-secondary"
                                        style={{ padding: '0.2rem 0.4rem', opacity: idx === 0 ? 0.3 : 1 }}
                                        title="Sposta su"
                                    >
                                        <ArrowUp size={14} />
                                    </button>
                                    <button
                                        onClick={() => onMoveDown(idx)}
                                        disabled={idx === bench.length - 1}
                                        className="btn btn-secondary"
                                        style={{ padding: '0.2rem 0.4rem', opacity: idx === bench.length - 1 ? 0.3 : 1 }}
                                        title="Sposta giù"
                                    >
                                        <ArrowDown size={14} />
                                    </button>
                                    <button
                                        onClick={() => onRemoveBench(player.id)}
                                        className="btn btn-secondary"
                                        style={{ padding: '0.2rem 0.4rem', color: '#ef4444' }}
                                        title="Rimuovi dalla panchina"
                                    >
                                        <UserMinus size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LineupBench;

