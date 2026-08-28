import { Clock } from 'lucide-react';

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
    const projectedSalaryBudget = financials.projectedSalaryBudget ?? 0;
    const nextSalaryPaymentDate = financials.nextSalaryPaymentDate;
    const nextRestoreDate = financials.nextRestoreDate;
    const restoreTransferAmount = financials.restoreTransferAmount ?? 0;
    const restoreSalaryAmount = financials.restoreSalaryAmount ?? 0;
    const history = financials.history || [];

    const avgSalaryPerPlayer = (totalSalaries / 25).toFixed(1);

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <FinanceCard
                    title="Budget Trasferimenti"
                    amount={transferBudget}
                    subtitle="Disponibile per acquisti"
                    type="positive"
                />
                <FinanceCard
                    title="Monte Ingaggi"
                    amount={salaryBudget}
                    subtitle="Fondo stipendi"
                    type="neutral"
                />
                <FinanceCard
                    title="Stipendi Totali (Stagione)"
                    amount={totalSalaries}
                    subtitle={`Media: ${avgSalaryPerPlayer}M per giocatore`}
                    type="neutral"
                />
                <FinanceCard
                    title="Proiezione Post-Stipendi"
                    amount={projectedSalaryBudget}
                    subtitle="Fondo residuo dopo pagamento"
                    type={projectedSalaryBudget < 0 ? 'negative' : 'positive'}
                />
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Clock size={20} color="var(--color-accent-gold)" />
                    Scadenze e Ripristino Budget
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                    <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: '4px solid var(--color-accent-secondary)' }}>
                        <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Prossimo Pagamento Stipendi</h4>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-accent-secondary)' }}>
                            {totalSalaries} <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>M</span>
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                            Data: {formatDate(nextSalaryPaymentDate)}
                        </p>
                    </div>

                    <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: '4px solid var(--color-accent-primary)' }}>
                        <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Prossimo Restore Budget</h4>
                        <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-accent-primary)' }}>
                            +{restoreTransferAmount} Trasf. | +{restoreSalaryAmount} Ingaggi
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                            Data: {formatDate(nextRestoreDate)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Recent Activity</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {history.length === 0 ? (
                        <p style={{ color: 'var(--color-text-muted)' }}>No financial activity recorded.</p>
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
