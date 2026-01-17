import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

const FinanceCard = ({ title, amount, subtitle, type = 'neutral' }) => {
    const getColor = () => {
        if (type === 'positive') return 'var(--color-accent-secondary)';
        if (type === 'negative') return 'var(--color-accent-primary)'; // Gold/Red
        return 'var(--color-text-primary)';
    };

    return (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{title}</p>
            <h3 style={{ fontSize: '2rem', fontWeight: 700, color: getColor() }}>
                {amount} <span style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>M</span>
            </h3>
            {subtitle && <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.8 }}>{subtitle}</p>}
        </div>
    );
};

const FinanceDashboard = ({ budget, financials, projectedBudget }) => {
    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <FinanceCard
                    title="Current Budget"
                    amount={budget}
                    subtitle="Available for transfers"
                    type="positive"
                />
                <FinanceCard
                    title="Projected Budget"
                    amount={projectedBudget}
                    subtitle="After planned salary payments"
                    type={projectedBudget < 0 ? 'negative' : 'neutral'}
                />
                <FinanceCard
                    title="Total Wages (Season)"
                    amount={financials.totalSalaries}
                    subtitle={`Avg: ${(financials.totalSalaries / 25).toFixed(1)}M per player`}
                    type="negative"
                />
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Clock size={20} className="text-blue-500" />
                    Payment Schedule
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: '4px solid var(--color-accent-action)' }}>
                        <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>December Installment</h4>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{financials.installments.december} <span style={{ fontSize: '0.9rem' }}>M</span></p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Due: 31/12/2025</p>
                    </div>

                    <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: '4px solid var(--color-accent-secondary)' }}>
                        <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>June Installment</h4>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{financials.installments.june} <span style={{ fontSize: '0.9rem' }}>M</span></p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Due: 30/06/2026</p>
                    </div>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Recent Activity</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {financials.history.length === 0 ? (
                        <p style={{ color: 'var(--color-text-muted)' }}>No financial activity recorded.</p>
                    ) : (
                        financials.history.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderBottom: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{item.date}</span>
                                    <span>{item.description}</span>
                                </div>
                                <span style={{
                                    fontWeight: 600,
                                    color: item.type === 'credit' ? 'var(--color-accent-secondary)' : 'var(--color-accent-primary)'
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
