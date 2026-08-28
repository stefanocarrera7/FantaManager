import { useTeam } from '../context/TeamContext';
import FinanceDashboard from '../features/finance/FinanceDashboard';

const Finance = () => {
    const { transferBudget, salaryBudget, financials } = useTeam();

    return (
        <div>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                    Financial <span className="text-gradient">Overview</span>
                </h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>Manage budget, salaries and payments</p>
            </header>

            <FinanceDashboard
                transferBudget={transferBudget}
                salaryBudget={salaryBudget}
                financials={financials}
            />
        </div>
    );
};

export default Finance;
