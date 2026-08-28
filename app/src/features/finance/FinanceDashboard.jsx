import { Clock, Banknote, Users, Sparkles } from 'lucide-react';

const formatDate = (date) => {
    if (!date) return 'N/D';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return 'N/D';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

const FinanceCard = ({ title, amount, subtitle, type = 'neutral' }) => {
    const getColor = () => {
        if (type === 'positive') return 'var(--color-accent-primary)';
        if (type === 'negative') return 'var(--color-accent-secondary)';
        return 'var(--color-text-primary)';
    };

    return (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{title}</p>
            <h3 style={{ fontSize: '2rem', fontWeight: 700, color: getColor() }}>
                {amount} <span style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>M</span>
            </h3>
            {subtitle && <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.8, color: 'var(--color-text-secondary)' }}>{subtitle}</p>}
        </div>
    );
};

const FinanceDashboard = ({ transferBudget = 0, salaryBudget = 0, financials = {} }) => {
    const totalSalaries = financials.totalSalaries ?? 0;
    const nextRestoreDate = financials.nextRestoreDate;
    const restoreTransferAmount = financials.restoreTransferAmount ?? 0;
    const restoreSalaryAmount = financials.restoreSalaryAmount ?? 0;
    const history = financials.history || [];

    return (
        <div>
            {/* Top Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <FinanceCard
                    title="Budget Trasferimenti"
                    amount={transferBudget}
                    subtitle="Disponibile per acquisti e scambi"
                    type="positive"
                />
                <FinanceCard
                    title="Monte Ingaggi Residuo"
                    amount={salaryBudget}
                    subtitle="Spazio salariale disponibile in rosa"
                    type={salaryBudget < 0 ? 'negative' : 'positive'}
                />
                <FinanceCard
                    title="Stipendi Impegnati Totali"
                    amount={totalSalaries}
                    subtitle="Detratti in tempo reale ad ogni acquisto"
                    type="neutral"
                />
            </div>

            {/* Pre-Auction Restore Banner */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Clock size={20} color="var(--color-accent-primary)" />
                    Ripristino Budget Annuale (Pre-Asta)
                </h3>

                <div style={{ padding: '1.25rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: '4px solid var(--color-accent-primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h4 style={{ fontWeight: 600, margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>Prossimo Incremento Budget</h4>
                            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                Data prevista: <strong style={{ color: 'white' }}>{formatDate(nextRestoreDate)}</strong> (Prima dell'asta estiva)
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-accent-primary)' }}>
                                +{restoreTransferAmount} M Trasferimenti
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-accent-secondary)' }}>
                                +{restoreSalaryAmount} M Monte Ingaggi
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Activity */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Storico Finanziario</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {history.length === 0 ? (
                        <p style={{ color: 'var(--color-text-muted)' }}>Nessun movimento finanziario straordinario registrato.</p>
                    ) : (
                        history.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderBottom: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{item.date}</span>
                                    <span>{item.description}</span>
                                </div>
                                <span style={{
                                    fontWeight: 600,
                                    color: item.type === 'credit' ? 'var(--color-accent-primary)' : 'var(--color-accent-secondary)'
                                }}>
                                    {item.amount > 0 ? '+' : ''}{item.amount} M
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default FinanceDashboard;
