import { useState } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import TradeCenter from './TradeCenter';
import TeamBrowser from '../teams/TeamBrowser';

const MarketDashboard = () => {
    return (
        <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem' }}>Trade Center</h2>

            {/* Main Content: Trade Center & Team Browser */}
            <div style={{ marginBottom: '3rem' }}>
                <TradeCenter />
                <TeamBrowser />
            </div>

            {/* Info Section */}
            <div className="glass-card" style={{ marginTop: '2rem', padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <AlertCircle className="text-blue-500" size={24} style={{ flexShrink: 0 }} />
                <div>
                    <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Trading Rules</h4>
                    <ul style={{ paddingLeft: '1.25rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <li><strong>Purchases:</strong> Buy players directly with your budget.</li>
                        <li><strong>Loans:</strong> Borrow players. You can negotiate salary split and purchase rights.</li>
                        <li><strong>Swaps:</strong> Exchange players with other teams (plus cash adjustment).</li>
                        <li><strong>Salaries:</strong> When acquiring a player, you inherit their salary responsibility unless it's a split-salary loan.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default MarketDashboard;
