import { useState } from 'react';
import { useLeague } from '../../context/LeagueContext';
import { Inbox, Send, RefreshCw, Check, X, Ban } from 'lucide-react';

const OfferCard = ({ offer, isInbox, onAction, teams, showActionButtons }) => {
    const fromTeam = teams.find(t => t.id === offer.fromTeamId);
    const toTeam = teams.find(t => t.id === offer.toTeamId);

    // Find player names (might need full player list if not in roster anymore, but usually they are)
    // We can search in all teams rosters
    const findPlayerName = (pid) => {
        for (const t of teams) {
            const p = t.roster.find(pl => pl.id === pid);
            if (p) return p.name;
        }
        return pid;
    };

    const playerInName = findPlayerName(offer.playerInId);
    const playerOutName = offer.playerOutId ? findPlayerName(offer.playerOutId) : null;

    return (
        <div className="glass-card" style={{ padding: '1rem', marginBottom: '1rem', borderLeft: `4px solid ${offer.status === 'pending' ? 'var(--color-accent-action)' : 'var(--glass-border)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span className="badge badge-sm">{offer.type}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{new Date(offer.date).toLocaleDateString()}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 600 }}>{fromTeam?.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Offered</div>
                </div>
                <div style={{ color: 'var(--color-text-muted)' }}>&rarr;</div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 600 }}>{toTeam?.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Received</div>
                </div>
            </div>

            <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                {offer.type === 'purchase' && (
                    <p><strong>{playerInName}</strong> for <span style={{ color: 'var(--color-accent-primary)' }}>{offer.price} cr</span></p>
                )}
                {offer.type === 'loan' && (
                    <div>
                        <p><strong>{playerInName}</strong> (Loan)</p>
                        <p style={{ fontSize: '0.85rem' }}>Salary Paid by Sender: {offer.loanDetails.salarySplit}%</p>
                        {offer.loanDetails.purchaseRight > 0 && <p style={{ fontSize: '0.85rem' }}>Buy Right: {offer.loanDetails.purchaseRight} cr</p>}
                        {offer.price > 0 && <p style={{ fontSize: '0.85rem' }}>Fee: {offer.price} cr</p>}
                    </div>
                )}
                {offer.type === 'swap' && (
                    <p>Swap <strong>{playerInName}</strong> for <strong>{playerOutName}</strong> {offer.price !== 0 && `+ ${offer.price} cr`}</p>
                )}
            </div>

            <div style={{ marginTop: '0.5rem', textAlign: 'right', fontSize: '0.9rem', fontStyle: 'italic', color: offer.status === 'pending' ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
                Status: {offer.status}
            </div>

            {showActionButtons && offer.status === 'pending' && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                    {isInbox ? (
                        <>
                            <button className="btn btn-sm btn-primary" onClick={() => onAction(offer.id, 'accept')}>
                                <Check size={16} style={{ marginRight: '0.25rem' }} /> Accept
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => onAction(offer.id, 'reject')}>
                                <X size={16} style={{ marginRight: '0.25rem' }} /> Reject
                            </button>
                        </>
                    ) : (
                        <button className="btn btn-sm btn-secondary" onClick={() => onAction(offer.id, 'cancel')}>
                            <Ban size={16} style={{ marginRight: '0.25rem' }} /> Cancel
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const TradeCenter = () => {
    const { myTeam, offers, teams, actions: { resolveOffer } } = useLeague();
    const [activeTab, setActiveTab] = useState('inbox');

    if (!myTeam) return <div>Please select a team context.</div>;

    const inbox = offers.filter(o => o.toTeamId === myTeam.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    const outbox = offers.filter(o => o.fromTeamId === myTeam.id).sort((a, b) => new Date(b.date) - new Date(a.date));

    const activeList = activeTab === 'inbox' ? inbox : outbox;

    return (
        <div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    className={`btn ${activeTab === 'inbox' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('inbox')}
                    style={{ position: 'relative' }}
                >
                    <Inbox size={20} style={{ marginRight: '0.5rem' }} />
                    Inbox
                    {inbox.some(o => o.status === 'pending') && (
                        <span style={{ position: 'absolute', top: '-5px', right: '-5px', width: '10px', height: '10px', backgroundColor: 'var(--color-accent-action)', borderRadius: '50%' }}></span>
                    )}
                </button>
                <button
                    className={`btn ${activeTab === 'outbox' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('outbox')}
                >
                    <Send size={20} style={{ marginRight: '0.5rem' }} />
                    Outbox
                </button>
            </div>

            <div>
                {activeList.length === 0 ? (
                    <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        No offers in {activeTab}.
                    </div>
                ) : (
                    activeList.map(offer => (
                        <OfferCard
                            key={offer.id}
                            offer={offer}
                            isInbox={activeTab === 'inbox'}
                            onAction={resolveOffer}
                            teams={teams}
                            showActionButtons={true}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default TradeCenter;
