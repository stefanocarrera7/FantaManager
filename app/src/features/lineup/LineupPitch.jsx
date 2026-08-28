import { UserMinus, Shield } from 'lucide-react';

const roleColors = {
    POR: '#f59e0b',
    DIF: '#3b82f6',
    CEN: '#10b981',
    ATT: '#ef4444'
};

const LineupPitch = ({ module, starters = [], onRemoveStarter, onSelectSlot, selectedSlot, isLocked }) => {
    // Break starters into role rows
    const porList = starters.filter(p => p.role === 'POR');
    const difList = starters.filter(p => p.role === 'DIF');
    const cenList = starters.filter(p => p.role === 'CEN');
    const attList = starters.filter(p => p.role === 'ATT');

    // Expected counts from module string e.g. "4-3-3"
    const [numDif, numCen, numAtt] = module.split('-').map(Number);

    const renderSlotRow = (currentPlayers, targetCount, role, rowLabel) => {
        const slots = [];
        for (let i = 0; i < targetCount; i++) {
            const player = currentPlayers[i];
            const isCurrentSlotSelected = selectedSlot?.role === role && selectedSlot?.index === i;

            slots.push(
                <div
                    key={`${role}-${i}`}
                    onClick={() => !isLocked && onSelectSlot({ role, index: i, currentPlayer: player })}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '90px',
                        padding: '0.4rem',
                        borderRadius: '10px',
                        backgroundColor: player ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.1)',
                        border: isCurrentSlotSelected
                            ? '2px solid var(--color-accent-primary)'
                            : player
                            ? `1px solid ${roleColors[role]}`
                            : '1px dashed rgba(255, 255, 255, 0.3)',
                        cursor: isLocked ? 'default' : 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: player ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : 'none',
                        position: 'relative'
                    }}
                >
                    {player ? (
                        <>
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: roleColors[role],
                                color: 'black',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '0.2rem'
                            }}>
                                {role}
                            </div>
                            <span style={{
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: 'white',
                                textAlign: 'center',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '80px'
                            }}>
                                {player.name}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                {player.team} • {player.value}cr
                            </span>

                            {!isLocked && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveStarter(player.id);
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: '-6px',
                                        right: '-6px',
                                        background: '#ef4444',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '18px',
                                        height: '18px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        cursor: 'pointer'
                                    }}
                                    title="Rimuovi"
                                >
                                    <UserMinus size={11} />
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <Shield size={20} color={roleColors[role]} style={{ opacity: 0.6, marginBottom: '0.2rem' }} />
                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                                + {role}
                            </span>
                        </>
                    )}
                </div>
            );
        }

        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                width: '100%',
                margin: '0.5rem 0'
            }}>
                {slots}
            </div>
        );
    };

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '560px',
            minHeight: '520px',
            margin: '0 auto',
            borderRadius: '16px',
            background: 'linear-gradient(180deg, #15803d 0%, #166534 50%, #14532d 100%)',
            border: '3px solid rgba(255, 255, 255, 0.4)',
            padding: '1.5rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5), 0 10px 25px rgba(0,0,0,0.3)',
            overflow: 'hidden'
        }}>
            {/* Field markings */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '5%',
                right: '5%',
                height: '2px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '100px',
                height: '100px',
                transform: 'translate(-50%, -50%)',
                border: '2px solid rgba(255,255,255,0.2)',
                borderRadius: '50%',
                pointerEvents: 'none'
            }} />

            {/* Attackers row */}
            {renderSlotRow(attList, numAtt, 'ATT', 'Attacco')}

            {/* Midfielders row */}
            {renderSlotRow(cenList, numCen, 'CEN', 'Centrocampo')}

            {/* Defenders row */}
            {renderSlotRow(difList, numDif, 'DIF', 'Difesa')}

            {/* Goalkeeper row */}
            {renderSlotRow(porList, 1, 'POR', 'Porta')}
        </div>
    );
};

export default LineupPitch;

