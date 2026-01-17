import { useState } from 'react';
import { useLeague } from '../../context/LeagueContext';
import { X } from 'lucide-react';

const OfferModal = ({ targetPlayer, targetTeamId, onClose }) => {
    const { myTeam, actions: { sendOffer } } = useLeague();
    const [type, setType] = useState('purchase'); // purchase, loan, swap

    // Form State
    const [price, setPrice] = useState(''); // Cash offered
    const [salarySplit, setSalarySplit] = useState(100); // % paid by ME (sender) for Loan
    const [purchaseRight, setPurchaseRight] = useState(''); // Optional right to buy
    const [playerOutId, setPlayerOutId] = useState(''); // For Swap

    if (!myTeam) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        const offer = {
            fromTeamId: myTeam.id,
            toTeamId: targetTeamId,
            playerInId: targetPlayer.id,
            type,
            price: parseFloat(price) || 0,
            playerOutId: type === 'swap' ? playerOutId : null,
            loanDetails: type === 'loan' ? {
                salarySplit: parseInt(salarySplit),
                purchaseRight: parseFloat(purchaseRight) || 0
            } : null
        };

        sendOffer(offer);
        alert('Offer Sent!');
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(5px)'
        }}>
            <div className="glass-card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                    <X size={24} />
                </button>

                <h3 className="text-gradient" style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Make an Offer</h3>

                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Target</p>
                    <h4 style={{ fontSize: '1.2rem' }}>{targetPlayer.name}</h4>
                    <span className="badge badge-primary">{targetPlayer.role}</span>
                    <span style={{ marginLeft: '1rem' }}>Value: {targetPlayer.value} cr</span>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Trade Type */}
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label>Offer Type</label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            {['purchase', 'loan', 'swap'].map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    className={`btn ${type === t ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setType(t)}
                                    style={{ flex: 1, textTransform: 'capitalize' }}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Purchase Fields */}
                    {type === 'purchase' && (
                        <div className="form-group">
                            <label>Cash Offer (Credits)</label>
                            <input
                                type="number"
                                className="input-field"
                                style={{ width: '100%', marginTop: '0.5rem' }}
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                placeholder={`Min value: ${targetPlayer.value}`}
                                required
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                Your Budget: {myTeam.budget} cr
                            </p>
                        </div>
                    )}

                    {/* Loan Fields */}
                    {type === 'loan' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Salary You Pay (%)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                                    <input
                                        type="range"
                                        min="0" max="100"
                                        value={salarySplit}
                                        onChange={e => setSalarySplit(e.target.value)}
                                        style={{ flex: 1 }}
                                    />
                                    <span style={{ width: '50px', textAlign: 'right' }}>{salarySplit}%</span>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    You will pay {Math.round(targetPlayer.salary * (salarySplit / 100) * 10) / 10} cr of their {targetPlayer.salary} cr salary.
                                </p>
                            </div>
                            <div className="form-group">
                                <label>Purchase Right (Optional)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    style={{ width: '100%', marginTop: '0.5rem' }}
                                    value={purchaseRight}
                                    onChange={e => setPurchaseRight(e.target.value)}
                                    placeholder="Redemption Price..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Loan Fee (Immediate Cash)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    style={{ width: '100%', marginTop: '0.5rem' }}
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    )}

                    {/* Swap Fields */}
                    {type === 'swap' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Select Player to Swap</label>
                                <select
                                    className="input-field"
                                    style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}
                                    value={playerOutId}
                                    onChange={e => setPlayerOutId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Choose Player --</option>
                                    {myTeam.roster.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.role}) - Val: {p.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Cash Adjustment (You Pay)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    style={{ width: '100%', marginTop: '0.5rem' }}
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    placeholder="Can be negative to Request cash"
                                />
                            </div>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '2rem' }}>
                        Send Offer
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OfferModal;
