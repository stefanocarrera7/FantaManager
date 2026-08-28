import { useState, useEffect } from 'react';
import { useLeague } from '../context/LeagueContext';
import { performSearch } from '../utils/playerDatabase';
import { Settings, Save, Search, UserPlus, Trash2, Calendar, RefreshCw } from 'lucide-react';
import CompetitionSetup from '../features/competition/CompetitionSetup';

const AdminSetup = () => {
    const { leagueSettings, teams, actions, currentUser } = useLeague();

    // Auth Check
    if (currentUser.role !== 'admin') {
        return <div className="glass-card" style={{ padding: '2rem' }}>Access Denied. Admin only.</div>;
    }

    // Settings State
    const [settingsForm, setSettingsForm] = useState(leagueSettings);

    useEffect(() => {
        if (leagueSettings) {
            setSettingsForm(leagueSettings);
        }
    }, [leagueSettings]);

    // Player Add State
    const [selectedTeam, setSelectedTeam] = useState(teams[0]?.id || '');

    useEffect(() => {
        if (!selectedTeam && teams.length > 0) {
            setSelectedTeam(teams[0].id);
        }
    }, [teams, selectedTeam]);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [auctionPrice, setAuctionPrice] = useState('');

    // Handlers
    const handleSettingsSave = async () => {
        // Check if initial budgets changed
        if (
            settingsForm.initialTransferBudget !== leagueSettings.initialTransferBudget ||
            settingsForm.initialSalaryBudget !== leagueSettings.initialSalaryBudget
        ) {
            const confirmReset = window.confirm(
                'Hai cambiato i budget iniziali. Vuoi RESETTARE tutte le squadre a questi importi?'
            );
            if (confirmReset) {
                await actions.applyBudgetToAllTeams(
                    settingsForm.initialTransferBudget,
                    settingsForm.initialSalaryBudget
                );
            }
        }

        await actions.updateLeagueSettings(settingsForm);
        alert('Settings Saved');
    };

    const handleSearch = () => {
        const results = performSearch(searchQuery, 'ALL', 1000);
        setSearchResults(results);
    };

    const handleAddPlayer = (player) => {
        if (!auctionPrice || auctionPrice <= 0) {
            alert('Please enter a valid Auction Price');
            return;
        }
        actions.updateTeamRoster(selectedTeam, player, auctionPrice);
        setAuctionPrice('');
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleRemovePlayer = (teamId, playerId) => {
        actions.removePlayerFromTeam(teamId, playerId);
    };

    return (
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 className="text-gradient" style={{ marginBottom: '2rem' }}>Admin Console</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                {/* Competition Setup */}
                <div style={{ gridColumn: '1 / -1' }}>
                    <CompetitionSetup />
                </div>

                {/* Impostazioni Finanziarie */}
                <div className="glass-card" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <Settings size={20} />
                        <h3>Impostazioni Finanziarie</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="form-group">
                            <label>Budget Trasferimenti Iniziale</label>
                            <input
                                type="number"
                                value={settingsForm.initialTransferBudget ?? ''}
                                onChange={(e) => setSettingsForm({ ...settingsForm, initialTransferBudget: parseInt(e.target.value) || 0 })}
                                className="input-field"
                                style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Monte Ingaggi Iniziale</label>
                            <input
                                type="number"
                                value={settingsForm.initialSalaryBudget ?? ''}
                                onChange={(e) => setSettingsForm({ ...settingsForm, initialSalaryBudget: parseInt(e.target.value) || 0 })}
                                className="input-field"
                                style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Salary Percentage (0.10 = 10%)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={settingsForm.salaryPercentage ?? ''}
                                onChange={(e) => setSettingsForm({ ...settingsForm, salaryPercentage: parseFloat(e.target.value) || 0 })}
                                className="input-field"
                                style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                            />
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Calendar size={16} /> Data Pagamento Stipendi
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Mese (1-12)</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="12"
                                        value={settingsForm.salaryPaymentDate?.month ?? ''}
                                        onChange={(e) => setSettingsForm({
                                            ...settingsForm,
                                            salaryPaymentDate: {
                                                ...(settingsForm.salaryPaymentDate || {}),
                                                month: parseInt(e.target.value) || 1
                                            }
                                        })}
                                        className="input-field"
                                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Giorno (1-31)</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={settingsForm.salaryPaymentDate?.day ?? ''}
                                        onChange={(e) => setSettingsForm({
                                            ...settingsForm,
                                            salaryPaymentDate: {
                                                ...(settingsForm.salaryPaymentDate || {}),
                                                day: parseInt(e.target.value) || 1
                                            }
                                        })}
                                        className="input-field"
                                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <RefreshCw size={16} /> Data Restore (Pre-Asta)
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Mese (1-12)</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="12"
                                        value={settingsForm.restoreDate?.month ?? ''}
                                        onChange={(e) => setSettingsForm({
                                            ...settingsForm,
                                            restoreDate: {
                                                ...(settingsForm.restoreDate || {}),
                                                month: parseInt(e.target.value) || 1
                                            }
                                        })}
                                        className="input-field"
                                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Giorno (1-31)</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={settingsForm.restoreDate?.day ?? ''}
                                        onChange={(e) => setSettingsForm({
                                            ...settingsForm,
                                            restoreDate: {
                                                ...(settingsForm.restoreDate || {}),
                                                day: parseInt(e.target.value) || 1
                                            }
                                        })}
                                        className="input-field"
                                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Importo Restore Trasferimenti</label>
                            <input
                                type="number"
                                value={settingsForm.restoreTransferAmount ?? ''}
                                onChange={(e) => setSettingsForm({ ...settingsForm, restoreTransferAmount: parseInt(e.target.value) || 0 })}
                                className="input-field"
                                style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Importo Restore Monte Ingaggi</label>
                            <input
                                type="number"
                                value={settingsForm.restoreSalaryAmount ?? ''}
                                onChange={(e) => setSettingsForm({ ...settingsForm, restoreSalaryAmount: parseInt(e.target.value) || 0 })}
                                className="input-field"
                                style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                            />
                        </div>
                    </div>

                    <button className="btn btn-primary" onClick={handleSettingsSave}>
                        <Save size={16} /> Save Settings
                    </button>
                </div>

                {/* Roster Management */}
                <div className="glass-card" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <UserPlus size={20} />
                        <h3>Roster Management (Post-Auction)</h3>
                    </div>

                    {/* Team Selector & Budget Edit */}
                    <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select
                            value={selectedTeam}
                            onChange={(e) => setSelectedTeam(e.target.value)}
                            style={{ padding: '0.5rem', flex: 1, minWidth: '250px', backgroundColor: 'var(--color-bg-surface)', color: 'white', border: '1px solid var(--glass-border)' }}
                        >
                            {teams.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.name} (Trasf: {t.transferBudget ?? t.transfer_budget ?? 0} | Ingaggi: {t.salaryBudget ?? t.salary_budget ?? 0})
                                </option>
                            ))}
                        </select>
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                const t = teams.find(x => x.id === selectedTeam);
                                const currentB = t?.transferBudget ?? t?.transfer_budget ?? 0;
                                const newB = prompt("Enter new transfer budget for " + (t ? t.name : ''), currentB);
                                if (newB !== null && !isNaN(newB) && newB.trim() !== '') {
                                    actions.updateTeamTransferBudget(selectedTeam, parseInt(newB));
                                } else if (newB !== null) {
                                    alert('Invalid number');
                                }
                            }}
                        >
                            Edit Trasf.
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                const t = teams.find(x => x.id === selectedTeam);
                                const currentB = t?.salaryBudget ?? t?.salary_budget ?? 0;
                                const newB = prompt("Enter new salary budget for " + (t ? t.name : ''), currentB);
                                if (newB !== null && !isNaN(newB) && newB.trim() !== '') {
                                    actions.updateTeamSalaryBudget(selectedTeam, parseInt(newB));
                                } else if (newB !== null) {
                                    alert('Invalid number');
                                }
                            }}
                        >
                            Edit Ingaggi
                        </button>
                    </div>

                    {/* Search & Add */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <input
                            type="text"
                            placeholder="Search listone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            style={{ flex: 1, padding: '0.5rem' }}
                        />
                        <button className="btn btn-primary" onClick={handleSearch}><Search size={16} /></button>
                    </div>

                    {/* Results */}
                    {searchResults.length > 0 && (
                        <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '2rem', border: '1px solid var(--glass-border)', padding: '0.5rem' }}>
                            {searchResults.map(p => (
                                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <span>{p.name} ({p.role}) - {p.team} - Qt: {p.value}</span>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            type="number"
                                            placeholder="Auction Price"
                                            value={auctionPrice}
                                            onChange={(e) => setAuctionPrice(e.target.value)}
                                            style={{ width: '100px', padding: '0.2rem' }}
                                        />
                                        <button className="btn btn-primary" onClick={() => handleAddPlayer(p)}>Add</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Current Roster View */}
                    <h4>Current Roster for {teams.find(t => t.id === selectedTeam)?.name}</h4>
                    <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid white' }}>
                                <th>Role</th>
                                <th>Name</th>
                                <th>Team</th>
                                <th>Quot.</th>
                                <th>Paid</th>
                                <th>Salary</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teams.find(t => t.id === selectedTeam)?.roster.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '0.5rem' }}>{p.role}</td>
                                    <td>{p.name}</td>
                                    <td>{p.team}</td>
                                    <td>{p.value}</td>
                                    <td style={{ color: 'var(--color-accent-secondary)' }}>{p.auctionPrice}</td>
                                    <td style={{ color: 'var(--color-accent-primary)' }}>{p.salary}</td>
                                    <td>
                                        <button onClick={() => handleRemovePlayer(selectedTeam, p.id)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                </div>
            </div>
        </div>
    );
};

export default AdminSetup;
