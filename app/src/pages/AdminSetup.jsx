import { useState, useEffect } from 'react';
import { useLeague } from '../context/LeagueContext';
import {
    performSearch,
    getAllPlayers,
    syncListoneFromOnline,
    updatePlayerDatabase,
    resetListoneToDefault
} from '../utils/playerDatabase';
import { parseListone } from '../utils/csvParser';
import {
    Settings,
    Save,
    Search,
    UserPlus,
    Trash2,
    Calendar,
    RefreshCw,
    DownloadCloud,
    Upload,
    Database,
    CheckCircle,
    RotateCcw,
    ExternalLink,
    Sliders,
    Calculator,
    Dices,
    Sparkles
} from 'lucide-react';
import CompetitionSetup from '../features/competition/CompetitionSetup';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

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

    // Listone State
    const [allPlayersList, setAllPlayersList] = useState(getAllPlayers());
    const [syncingListone, setSyncingListone] = useState(false);
    const [listoneMeta, setListoneMeta] = useState(() => {
        try {
            const saved = localStorage.getItem('fanta_listone_meta');
            return saved ? JSON.parse(saved) : { total: allPlayersList.length, source: 'Listone Base 2025/26' };
        } catch {
            return { total: allPlayersList.length, source: 'Listone Base 2025/26' };
        }
    });

    const refreshListoneStats = () => {
        const players = getAllPlayers();
        setAllPlayersList([...players]);
        try {
            const saved = localStorage.getItem('fanta_listone_meta');
            if (saved) setListoneMeta(JSON.parse(saved));
        } catch {}
    };

    // Online Auto-Sync Handler
    const handleOnlineSync = async () => {
        setSyncingListone(true);
        const res = await syncListoneFromOnline();
        setSyncingListone(false);

        if (res.success) {
            refreshListoneStats();
            toast.success(`Listone sincronizzato online con successo! (${res.count} calciatori caricati)`);
        } else {
            toast.error(res.message || 'Errore durante la sincronizzazione online');
        }
    };

    // File Upload Handler (.xlsx or .csv)
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            reader.onload = async (event) => {
                try {
                    const buffer = event.target.result;
                    const parsed = parseListone(buffer);
                    if (parsed.length > 0) {
                        await updatePlayerDatabase(parsed, `File Excel: ${file.name}`);
                        refreshListoneStats();
                        toast.success(`Caricati ${parsed.length} calciatori da ${file.name}!`);
                    } else {
                        toast.error('Nessun calciatore valido trovato nel file Excel.');
                    }
                } catch (err) {
                    toast.error('Errore nella lettura del file Excel: ' + err.message);
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            reader.onload = async (event) => {
                try {
                    const text = event.target.result;
                    const parsed = parseListone(text);
                    if (parsed.length > 0) {
                        await updatePlayerDatabase(parsed, `File CSV: ${file.name}`);
                        refreshListoneStats();
                        toast.success(`Caricati ${parsed.length} calciatori da ${file.name}!`);
                    } else {
                        toast.error('Nessun calciatore valido trovato nel file CSV.');
                    }
                } catch (err) {
                    toast.error('Errore nella lettura del file CSV: ' + err.message);
                }
            };
            reader.readAsText(file);
        }
    };

    const handleResetListone = () => {
        if (confirm('Vuoi ripristinare il listone predefinito originale?')) {
            resetListoneToDefault();
            refreshListoneStats();
            toast.success('Listone ripristinato ai valori predefiniti.');
        }
    };

    const handleAutoPopulateCurrentRosters = async () => {
        if (!teams || teams.length === 0) {
            toast.error('Nessuna squadra registrata nella lega.');
            return;
        }

        if (!confirm(`Vuoi assegnare 25 calciatori estratti dal listone attualmente attivo a tutte le ${teams.length} squadre e creare le loro formazioni per la Giornata 1?`)) {
            return;
        }

        const toastId = toast.loading('Assegnazione calciatori e formazioni in corso...');

        try {
            const currentPlayers = getAllPlayers();
            const por = currentPlayers.filter(p => p.role === 'POR');
            const dif = currentPlayers.filter(p => p.role === 'DIF');
            const cen = currentPlayers.filter(p => p.role === 'CEN');
            const att = currentPlayers.filter(p => p.role === 'ATT');

            const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
            const shuffledPor = shuffle(por);
            const shuffledDif = shuffle(dif);
            const shuffledCen = shuffle(cen);
            const shuffledAtt = shuffle(att);

            let porIdx = 0, difIdx = 0, cenIdx = 0, attIdx = 0;

            const salaryPerc = settingsForm.salaryPercentage || 0.1;
            const initialTransfer = settingsForm.initialTransferBudget || 300;
            const initialSalary = settingsForm.initialSalaryBudget || 200;

            for (const team of teams) {
                const teamPor = shuffledPor.slice(porIdx, porIdx + 3); porIdx += 3;
                const teamDif = shuffledDif.slice(difIdx, difIdx + 8); difIdx += 8;
                const teamCen = shuffledCen.slice(cenIdx, cenIdx + 8); cenIdx += 8;
                const teamAtt = shuffledAtt.slice(attIdx, attIdx + 6); attIdx += 6;

                const rosterRaw = [...teamPor, ...teamDif, ...teamCen, ...teamAtt];
                let totalAuctionPrice = 0;
                let totalSalaries = 0;

                const roster = rosterRaw.map(p => {
                    const auctionPrice = Math.max(1, p.value + Math.floor(Math.random() * 4));
                    const salary = Math.round((p.value * salaryPerc) * 10) / 10;
                    totalAuctionPrice += auctionPrice;
                    totalSalaries += salary;

                    return {
                        id: p.id,
                        name: p.name,
                        role: p.role,
                        team: p.team,
                        value: p.value,
                        auctionPrice: auctionPrice,
                        salary: salary,
                        purchaseDate: new Date().toISOString()
                    };
                });

                const finalTransfer = Math.max(10, initialTransfer - totalAuctionPrice + 120);
                const finalSalary = Math.round((initialSalary - totalSalaries) * 10) / 10;

                // 1. Update team in Supabase
                await supabase
                    .from('teams')
                    .update({
                        roster,
                        transfer_budget: finalTransfer,
                        salary_budget: finalSalary,
                        budget: finalTransfer + finalSalary
                    })
                    .eq('id', team.id);

                // 2. Save matchday 1 lineup
                const starters = [
                    teamPor[0],
                    ...teamDif.slice(0, 4),
                    ...teamCen.slice(0, 3),
                    ...teamAtt.slice(0, 3)
                ];

                const bench = [
                    teamPor[1] || teamPor[0],
                    ...teamDif.slice(4, 6),
                    ...teamCen.slice(3, 5),
                    ...teamAtt.slice(3, 5)
                ];

                await supabase
                    .from('lineups')
                    .upsert([{
                        competition_id: team.competitionId || team.competition_id,
                        team_id: team.id,
                        matchday: 1,
                        module: '4-3-3',
                        starters,
                        bench,
                        submitted_at: new Date().toISOString()
                    }], { onConflict: 'competition_id,team_id,matchday' });
            }

            // Reload league teams in state
            const targetCompId = teams[0]?.competitionId || teams[0]?.competition_id;
            if (targetCompId) {
                await actions.loadLeague(targetCompId);
            }

            toast.success(`Rose e formazioni della Giornata 1 create con successo per tutte le ${teams.length} squadre dal listone attivo!`, { id: toastId });
        } catch (err) {
            console.error('Error auto-populating rosters:', err);
            toast.error('Errore durante la generazione delle rose: ' + err.message, { id: toastId });
        }
    };

    // Handlers
    const handleSettingsSave = async () => {
        if (
            settingsForm.initialTransferBudget !== leagueSettings.initialTransferBudget ||
            settingsForm.initialSalaryBudget !== leagueSettings.initialSalaryBudget
        ) {
            const shouldReset = window.confirm(
                'Hai modificato i budget iniziali. Vuoi RESETTARE i budget di tutte le squadre della lega a questi nuovi importi?'
            );
            if (shouldReset) {
                await actions.applyBudgetToAllTeams(
                    settingsForm.initialTransferBudget,
                    settingsForm.initialSalaryBudget
                );
            }
        }

        await actions.updateLeagueSettings(settingsForm);
        toast.success('Impostazioni salvate con successo!');
    };

    const handleSearch = () => {
        const results = performSearch(searchQuery, 'ALL', 1000);
        setSearchResults(results);
    };

    const handleAddPlayer = (player) => {
        if (!auctionPrice || auctionPrice <= 0) {
            alert('Inserisci un prezzo d\'asta valido');
            return;
        }
        actions.updateTeamRoster(selectedTeam, player, auctionPrice);
        setAuctionPrice('');
        setSearchQuery('');
        setSearchResults([]);
        toast.success(`${player.name} assegnato a ${teams.find(t => t.id === selectedTeam)?.name}`);
    };

    const handleRemovePlayer = (teamId, playerId) => {
        actions.removePlayerFromTeam(teamId, playerId);
    };

    // Counts by role
    const porCount = allPlayersList.filter(p => p.role === 'POR').length;
    const difCount = allPlayersList.filter(p => p.role === 'DIF').length;
    const cenCount = allPlayersList.filter(p => p.role === 'CEN').length;
    const attCount = allPlayersList.filter(p => p.role === 'ATT').length;

    return (
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Toaster position="top-right" />

            <h2 className="text-gradient" style={{ marginBottom: '2rem' }}>Admin Console</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                {/* Competition Setup */}
                <div style={{ gridColumn: '1 / -1' }}>
                    <CompetitionSetup />
                </div>

                {/* Listone Management Section */}
                <div className="glass-card" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Database size={22} color="var(--color-accent-primary)" />
                            <h3 style={{ margin: 0 }}>Listone & Quotazioni Ufficiali</h3>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <a
                                href="https://www.fantacalcio.it/quotazioni-fantacalcio"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', textDecoration: 'none' }}
                                title="Scarica il file ufficiale Excel/CSV dal sito di Fantacalcio.it"
                            >
                                <ExternalLink size={15} />
                                Scarica da Fantacalcio.it
                            </a>

                            <label className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer', margin: 0 }}>
                                <Upload size={16} />
                                📁 Carica File (.xlsx / .csv)
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.csv,.txt"
                                    onChange={handleFileUpload}
                                    style={{ display: 'none' }}
                                />
                            </label>

                            <button
                                className="btn btn-secondary"
                                onClick={handleOnlineSync}
                                disabled={syncingListone}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                                title="Tenta la sincronizzazione da repository e feed aperti"
                            >
                                <DownloadCloud size={15} />
                                {syncingListone ? 'Scaricamento...' : 'Feed Mirror'}
                            </button>

                            <button
                                className="btn btn-secondary"
                                onClick={handleResetListone}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}
                                title="Ripristina listone originale"
                            >
                                <RotateCcw size={15} />
                                Reset
                            </button>

                            <button
                                className="btn btn-primary"
                                onClick={handleAutoPopulateCurrentRosters}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', backgroundColor: '#8b5cf6' }}
                                title="Assegna 25 calciatori estratti dal listone attualmente attivo a tutte le squadre"
                            >
                                <Dices size={16} />
                                Popola Rose (Listone Attuale)
                            </button>
                        </div>
                    </div>

                    {/* Stats overview */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '1rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        padding: '1rem',
                        borderRadius: '10px',
                        border: '1px solid var(--glass-border)',
                        marginBottom: '1rem'
                    }}>
                        <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Totale Calciatori</span>
                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-accent-primary)' }}>
                                {allPlayersList.length}
                            </div>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Ripartizione Ruoli</span>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.2rem' }}>
                                <span style={{ color: '#f59e0b' }}>POR: {porCount}</span> •{' '}
                                <span style={{ color: '#3b82f6' }}>DIF: {difCount}</span> •{' '}
                                <span style={{ color: '#10b981' }}>CEN: {cenCount}</span> •{' '}
                                <span style={{ color: '#ef4444' }}>ATT: {attCount}</span>
                            </div>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Sorgente Attiva</span>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', marginTop: '0.2rem' }}>
                                {listoneMeta.source || 'Listone Fantacalcio.it'}
                            </div>
                        </div>
                    </div>
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
                            <label>Percentuale Stipendio Giocatori</label>
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
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <RefreshCw size={16} /> Data Restore Pre-Asta (Mese / Giorno)
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    placeholder="Mese (1-12)"
                                    value={settingsForm.restoreDate?.month ?? ''}
                                    onChange={(e) => setSettingsForm({
                                        ...settingsForm,
                                        restoreDate: {
                                            ...settingsForm.restoreDate,
                                            month: parseInt(e.target.value) || 1
                                        }
                                    })}
                                    className="input-field"
                                    style={{ flex: 1, padding: '0.5rem' }}
                                />
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    placeholder="Giorno (1-31)"
                                    value={settingsForm.restoreDate?.day ?? ''}
                                    onChange={(e) => setSettingsForm({
                                        ...settingsForm,
                                        restoreDate: {
                                            ...settingsForm.restoreDate,
                                            day: parseInt(e.target.value) || 1
                                        }
                                    })}
                                    className="input-field"
                                    style={{ flex: 1, padding: '0.5rem' }}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Incremento Restore Trasferimenti</label>
                            <input
                                type="number"
                                value={settingsForm.restoreTransferAmount ?? ''}
                                onChange={(e) => setSettingsForm({ ...settingsForm, restoreTransferAmount: parseInt(e.target.value) || 0 })}
                                className="input-field"
                                style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Incremento Restore Monte Ingaggi</label>
                            <input
                                type="number"
                                value={settingsForm.restoreSalaryAmount ?? ''}
                                onChange={(e) => setSettingsForm({ ...settingsForm, restoreSalaryAmount: parseInt(e.target.value) || 0 })}
                                className="input-field"
                                style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                            />
                        </div>
                    </div>

                    <button className="btn btn-primary" onClick={handleSettingsSave} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Save size={18} /> Salva Impostazioni Finanziarie
                    </button>
                </div>

                {/* Regolamento & Impostazioni di Calcolo */}
                <div className="glass-card" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <Calculator size={20} color="var(--color-accent-primary)" />
                        <h3 style={{ margin: 0 }}>Regolamento & Impostazioni di Calcolo Punteggi</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="form-group">
                            <label>Giornata Serie A di Inizio Lega</label>
                            <input
                                type="number"
                                min="1"
                                max="38"
                                value={settingsForm.startSerieAMatchday ?? 1}
                                onChange={(e) => setSettingsForm({ ...settingsForm, startSerieAMatchday: parseInt(e.target.value) || 1 })}
                                className="input-field"
                                style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                            />
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'block' }}>
                                Es. se la lega parte alla 3ª di Serie A, la Giornata 1 userà i voti della 3ª di Serie A.
                            </span>
                        </div>

                        <div className="form-group">
                            <label>Numero Max Sostituzioni Panchina</label>
                            <select
                                value={settingsForm.scoringRules?.maxSubstitutions ?? 5}
                                onChange={(e) => setSettingsForm({
                                    ...settingsForm,
                                    scoringRules: {
                                        ...(settingsForm.scoringRules || {}),
                                        maxSubstitutions: parseInt(e.target.value)
                                    }
                                })}
                                style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', borderRadius: '8px', backgroundColor: 'var(--color-bg-primary)', color: 'white', border: '1px solid var(--glass-border)' }}
                            >
                                <option value={3}>3 Sostituzioni</option>
                                <option value={5}>5 Sostituzioni (Standard)</option>
                                <option value={7}>7 Sostituzioni</option>
                                <option value={11}>Illimitate (fino a 11)</option>
                            </select>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'block' }}>
                                Entra il primo panchinaro dello stesso ruolo con voto valido.
                            </span>
                        </div>

                        <div className="form-group">
                            <label>Soglia Primo Gol (Fantapunti)</label>
                            <input
                                type="number"
                                value={settingsForm.scoringRules?.goalThreshold ?? 66}
                                onChange={(e) => setSettingsForm({
                                    ...settingsForm,
                                    scoringRules: {
                                        ...(settingsForm.scoringRules || {}),
                                        goalThreshold: parseFloat(e.target.value) || 66
                                    }
                                })}
                                className="input-field"
                                style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Fascia Gol Successivi (+pt)</label>
                            <input
                                type="number"
                                value={settingsForm.scoringRules?.goalStep ?? 6}
                                onChange={(e) => setSettingsForm({
                                    ...settingsForm,
                                    scoringRules: {
                                        ...(settingsForm.scoringRules || {}),
                                        goalStep: parseFloat(e.target.value) || 6
                                    }
                                })}
                                className="input-field"
                                style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontWeight: 600 }}>
                                <input
                                    type="checkbox"
                                    checked={settingsForm.scoringRules?.defenseModifierEnabled ?? false}
                                    onChange={(e) => setSettingsForm({
                                        ...settingsForm,
                                        scoringRules: {
                                            ...(settingsForm.scoringRules || {}),
                                            defenseModifierEnabled: e.target.checked
                                        }
                                    })}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                Abilita Modificatore di Difesa (Media Portiere + Migliori 3 Difensori con almeno 4 DIF schierati)
                            </label>
                        </div>

                        <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontWeight: 600 }}>
                                <input
                                    type="checkbox"
                                    checked={settingsForm.enableVoteSimulation ?? false}
                                    onChange={(e) => setSettingsForm({
                                        ...settingsForm,
                                        enableVoteSimulation: e.target.checked
                                    })}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                Modalità Sandbox / Simulazione Voti di Test
                            </label>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '0.3rem', marginLeft: '2rem' }}>
                                Se disattivata (consigliato per la stagione ufficiale), l'app calcola solo le giornate con voti reali pubblicati/caricati e blocca il calcolo per le giornate future non ancora giocate.
                            </span>
                        </div>
                    </div>

                    {/* Bonus Malus Grid */}
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>Bonus & Malus di Gioco</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Gol Segnato</label>
                            <input
                                type="number"
                                step="0.5"
                                value={settingsForm.scoringRules?.baseGoal ?? 3}
                                onChange={(e) => setSettingsForm({ ...settingsForm, scoringRules: { ...(settingsForm.scoringRules || {}), baseGoal: parseFloat(e.target.value) } })}
                                className="input-field"
                                style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Assist</label>
                            <input
                                type="number"
                                step="0.5"
                                value={settingsForm.scoringRules?.assist ?? 1}
                                onChange={(e) => setSettingsForm({ ...settingsForm, scoringRules: { ...(settingsForm.scoringRules || {}), assist: parseFloat(e.target.value) } })}
                                className="input-field"
                                style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Rigore Parato</label>
                            <input
                                type="number"
                                step="0.5"
                                value={settingsForm.scoringRules?.penaltySaved ?? 3}
                                onChange={(e) => setSettingsForm({ ...settingsForm, scoringRules: { ...(settingsForm.scoringRules || {}), penaltySaved: parseFloat(e.target.value) } })}
                                className="input-field"
                                style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Rigore Sbagliato</label>
                            <input
                                type="number"
                                step="0.5"
                                value={settingsForm.scoringRules?.penaltyMissed ?? -3}
                                onChange={(e) => setSettingsForm({ ...settingsForm, scoringRules: { ...(settingsForm.scoringRules || {}), penaltyMissed: parseFloat(e.target.value) } })}
                                className="input-field"
                                style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Ammonizione</label>
                            <input
                                type="number"
                                step="0.5"
                                value={settingsForm.scoringRules?.yellowCard ?? -0.5}
                                onChange={(e) => setSettingsForm({ ...settingsForm, scoringRules: { ...(settingsForm.scoringRules || {}), yellowCard: parseFloat(e.target.value) } })}
                                className="input-field"
                                style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Espulsione</label>
                            <input
                                type="number"
                                step="0.5"
                                value={settingsForm.scoringRules?.redCard ?? -1}
                                onChange={(e) => setSettingsForm({ ...settingsForm, scoringRules: { ...(settingsForm.scoringRules || {}), redCard: parseFloat(e.target.value) } })}
                                className="input-field"
                                style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Gol Subito (POR)</label>
                            <input
                                type="number"
                                step="0.5"
                                value={settingsForm.scoringRules?.concededGoal ?? -1}
                                onChange={(e) => setSettingsForm({ ...settingsForm, scoringRules: { ...(settingsForm.scoringRules || {}), concededGoal: parseFloat(e.target.value) } })}
                                className="input-field"
                                style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Portiere Imbattuto</label>
                            <input
                                type="number"
                                step="0.5"
                                value={settingsForm.scoringRules?.cleanSheetGK ?? 1}
                                onChange={(e) => setSettingsForm({ ...settingsForm, scoringRules: { ...(settingsForm.scoringRules || {}), cleanSheetGK: parseFloat(e.target.value) } })}
                                className="input-field"
                                style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}
                            />
                        </div>
                    </div>

                    <button className="btn btn-primary" onClick={handleSettingsSave} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Save size={18} /> Salva Regolamento di Calcolo
                    </button>
                </div>

                {/* Roster Management / Player Search */}
                <div className="glass-card" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <UserPlus size={20} />
                            <h3 style={{ margin: 0 }}>Gestione Rose & Asta</h3>
                        </div>

                        <button
                            className="btn btn-secondary"
                            onClick={handleAutoPopulateCurrentRosters}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                        >
                            <Sparkles size={16} color="var(--color-accent-primary)" />
                            🎲 Riempi Rose & Schiera G1 (Tutte le Squadre)
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '240px' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Seleziona Squadra:</label>
                            <select
                                value={selectedTeam}
                                onChange={(e) => setSelectedTeam(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', backgroundColor: 'var(--color-bg-primary)', color: 'white', border: '1px solid var(--glass-border)' }}
                            >
                                {teams.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} (Trasf: {t.transferBudget ?? t.transfer_budget ?? 0} | Ingaggi: {t.salaryBudget ?? t.salary_budget ?? 0})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedTeam && (
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                                <button
                                    className="btn btn-secondary"
                                    style={{ fontSize: '0.8rem' }}
                                    onClick={() => {
                                        const current = teams.find(t => t.id === selectedTeam);
                                        const newB = prompt("Nuovo Budget Trasferimenti per " + current?.name, current?.transferBudget ?? current?.transfer_budget ?? 300);
                                        if (newB !== null) actions.updateTeamTransferBudget(selectedTeam, parseInt(newB));
                                    }}
                                >
                                    Modifica Trasf.
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    style={{ fontSize: '0.8rem' }}
                                    onClick={() => {
                                        const current = teams.find(t => t.id === selectedTeam);
                                        const newB = prompt("Nuovo Monte Ingaggi per " + current?.name, current?.salaryBudget ?? current?.salary_budget ?? 200);
                                        if (newB !== null) actions.updateTeamSalaryBudget(selectedTeam, parseInt(newB));
                                    }}
                                >
                                    Modifica Ingaggi
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Search & Add Player */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <input
                            type="text"
                            placeholder="Cerca calciatore per nome..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="input-field"
                            style={{ flex: 1, padding: '0.5rem' }}
                        />
                        <button className="btn btn-primary" onClick={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Search size={16} /> Cerca
                        </button>
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.5rem', marginBottom: '1.5rem' }}>
                            {searchResults.map(p => (
                                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div>
                                        <strong>{p.name}</strong> ({p.role}) - {p.team} | Quot: {p.value}cr
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <input
                                            type="number"
                                            placeholder="Prezzo Asta"
                                            value={auctionPrice}
                                            onChange={(e) => setAuctionPrice(e.target.value)}
                                            style={{ width: '100px', padding: '0.3rem', borderRadius: '4px', backgroundColor: 'var(--color-bg-primary)', color: 'white', border: '1px solid var(--glass-border)' }}
                                        />
                                        <button className="btn btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.85rem' }} onClick={() => handleAddPlayer(p)}>
                                            Aggiungi
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Current Roster View */}
                    <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                        Rosa Attuale: {teams.find(t => t.id === selectedTeam)?.name} ({teams.find(t => t.id === selectedTeam)?.roster?.length || 0} giocatori)
                    </h4>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', marginTop: '0.5rem', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ padding: '0.5rem' }}>Ruolo</th>
                                    <th>Nome</th>
                                    <th>Squadra</th>
                                    <th>Quot.</th>
                                    <th>Prezzo Asta</th>
                                    <th>Stipendio</th>
                                    <th style={{ textAlign: 'center' }}>Azione</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teams.find(t => t.id === selectedTeam)?.roster?.map(p => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '0.5rem', fontWeight: 600 }}>{p.role}</td>
                                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                                        <td style={{ color: 'var(--color-text-muted)' }}>{p.team}</td>
                                        <td>{p.value} cr</td>
                                        <td style={{ color: 'var(--color-accent-secondary)', fontWeight: 600 }}>{p.auctionPrice} cr</td>
                                        <td style={{ color: 'var(--color-accent-primary)', fontWeight: 600 }}>{p.salary} cr</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button onClick={() => handleRemovePlayer(selectedTeam, p.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Rimuovi calciatore">
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
        </div>
    );
};

export default AdminSetup;
