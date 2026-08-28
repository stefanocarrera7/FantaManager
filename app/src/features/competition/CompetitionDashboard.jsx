import { useState } from 'react';
import { useCompetition } from '../../context/CompetitionContext';
import { useLeague } from '../../context/LeagueContext';
import { ChevronLeft, ChevronRight, Trophy, Calendar, Zap, Eye, X, Upload, FileText, CheckCircle, Download, ExternalLink } from 'lucide-react';
import { VoteService } from '../../utils/voteService';
import toast, { Toaster } from 'react-hot-toast';

const roleColors = {
    POR: '#f59e0b',
    DIF: '#3b82f6',
    CEN: '#10b981',
    ATT: '#ef4444'
};

const StandingsTable = ({ standings = {}, teams = [] }) => {
    const sortedIds = Object.keys(standings).sort((a, b) => {
        const statsA = standings[a] || { pts: 0, gf: 0, ga: 0 };
        const statsB = standings[b] || { pts: 0, gf: 0, ga: 0 };
        const diffPts = statsB.pts - statsA.pts;
        if (diffPts !== 0) return diffPts;
        return (statsB.gf - statsB.ga) - (statsA.gf - statsA.ga);
    });

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem' }}>Pos</th>
                        <th style={{ padding: '0.75rem' }}>Squadra</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>PT</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>G</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>V</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>N</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>P</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>GF</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>GS</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>DR</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedIds.map((id, index) => {
                        const team = teams.find(t => t.id === id);
                        const stats = standings[id] || { pts: 0, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
                        return (
                            <tr key={id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                                <td style={{ padding: '0.75rem', fontWeight: 700 }}>{index + 1}</td>
                                <td style={{ padding: '0.75rem', fontWeight: 600 }}>{team?.name || id}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 700, color: 'var(--color-accent-primary)' }}>{stats.pts}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{stats.p}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{stats.w}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{stats.d}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{stats.l}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{stats.gf}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{stats.ga}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center', color: (stats.gf - stats.ga) >= 0 ? 'var(--color-accent-primary)' : '#ef4444' }}>
                                    {(stats.gf - stats.ga) > 0 ? `+${stats.gf - stats.ga}` : stats.gf - stats.ga}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// Match detail breakdown modal
const MatchDetailModal = ({ match, homeTeam, awayTeam, onClose }) => {
    if (!match || !match.result) return null;

    const { homeGoals, awayGoals, homeTotal, awayTotal, evaluatedHome, evaluatedAway } = match.result;

    const renderTeamVotes = (teamName, evalData) => {
        const starters = evalData?.evaluatedStarters || [];
        const bench = evalData?.evaluatedBench || [];

        return (
            <div style={{ flex: 1, minWidth: '320px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{teamName}</h4>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-accent-primary)', fontSize: '1.05rem' }}>
                            Totale: {evalData?.totalPoints} pt
                        </span>
                        {evalData?.defModifier > 0 && (
                            <div style={{ fontSize: '0.75rem', color: '#10b981' }}>
                                +{evalData.defModifier} pt Modificatore Difesa
                            </div>
                        )}
                    </div>
                </div>

                {/* Titolari */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
                        Titolari ({starters.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {starters.map((p, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.4rem 0.6rem',
                                borderRadius: '6px',
                                backgroundColor: p.isSubstitutedIn ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                                border: p.isSubstitutedIn ? '1px dashed #f59e0b' : '1px solid rgba(255, 255, 255, 0.05)',
                                fontSize: '0.85rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        padding: '0.1rem 0.3rem',
                                        borderRadius: '3px',
                                        backgroundColor: roleColors[p.role] || '#888',
                                        color: 'black'
                                    }}>
                                        {p.role}
                                    </span>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                                        {p.isSubstitutedIn && (
                                            <span style={{ fontSize: '0.7rem', color: '#f59e0b', marginLeft: '0.3rem' }}>
                                                (🔁 sub per {p.replacedPlayerName})
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {p.events?.goals > 0 && <span title="Gol">⚽ {p.events.goals}</span>}
                                    {p.events?.assists > 0 && <span title="Assist">👟 {p.events.assists}</span>}
                                    {p.events?.yellowCards > 0 && <span title="Ammonizione">🟨</span>}
                                    {p.events?.redCards > 0 && <span title="Espulsione">🟥</span>}
                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Voto: {p.grade ?? '-'}</span>
                                    <strong style={{ minWidth: '35px', textAlign: 'right', color: (p.fantavote ?? 0) >= 6 ? 'var(--color-accent-primary)' : '#ef4444' }}>
                                        {p.fantavote ?? 0}
                                    </strong>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Panchina & Sostituzioni */}
                {bench.length > 0 && (
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
                            Panchina ({bench.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            {bench.map((p, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.35rem 0.6rem',
                                    borderRadius: '6px',
                                    backgroundColor: p.isSubstitutedOut ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.015)',
                                    border: p.isSubstitutedOut ? '1px dashed rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.03)',
                                    fontSize: '0.8rem',
                                    opacity: p.isSubstitutedOut ? 0.85 : 0.75
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span style={{
                                            fontSize: '0.6rem',
                                            fontWeight: 700,
                                            padding: '0.1rem 0.3rem',
                                            borderRadius: '3px',
                                            backgroundColor: roleColors[p.role] || '#888',
                                            color: 'black'
                                        }}>
                                            {p.role}
                                        </span>
                                        <span style={{ fontWeight: p.isSubstitutedOut ? 500 : 400 }}>
                                            {p.name}
                                        </span>
                                        {p.isSubstitutedOut && (
                                            <span style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 600, marginLeft: '0.2rem' }}>
                                                (⛔ Sostituito da {p.replacedByPlayerName})
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        {p.events?.goals > 0 && <span title="Gol" style={{ fontSize: '0.75rem' }}>⚽ {p.events.goals}</span>}
                                        {p.events?.assists > 0 && <span title="Assist" style={{ fontSize: '0.75rem' }}>👟 {p.events.assists}</span>}
                                        {p.events?.yellowCards > 0 && <span title="Ammonizione">🟨</span>}
                                        {p.events?.redCards > 0 && <span title="Espulsione">🟥</span>}
                                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Voto: {p.grade ?? 'S.V.'}</span>
                                        <span style={{ minWidth: '30px', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                                            {p.fantavote ?? '-'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
        }}>
            <div className="glass-card" style={{
                width: '100%',
                maxWidth: '850px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '2rem',
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--glass-border)',
                position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    <X size={24} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Dettaglio Risultato Partita
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', margin: '0.75rem 0' }}>
                        <h2 style={{ fontSize: '1.75rem', margin: 0 }}>{homeTeam?.name}</h2>
                        <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-accent-primary)' }}>
                            {homeGoals} - {awayGoals}
                        </span>
                        <h2 style={{ fontSize: '1.75rem', margin: 0 }}>{awayTeam?.name}</h2>
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        Punti Totali: {homeTotal} pt vs {awayTotal} pt
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    {renderTeamVotes(homeTeam?.name, evaluatedHome)}
                    {renderTeamVotes(awayTeam?.name, evaluatedAway)}
                </div>
            </div>
        </div>
    );
};

// Official CSV/Excel Import Modal
const ImportVotesModal = ({ matchday, onClose, onVotesImported }) => {
    const [csvText, setCsvText] = useState('');
    const [importing, setImporting] = useState(false);
    const [fileName, setFileName] = useState('');

    const handleImport = async () => {
        if (!csvText.trim()) {
            toast.error('Carica un file Excel/CSV o incolla il testo dei voti.');
            return;
        }

        setImporting(true);
        try {
            const parsed = VoteService.parseOfficialCSV(csvText);
            const count = Object.values(parsed).filter(p => p.played).length;
            if (count === 0) {
                toast.error('Nessun voto valido rilevato nel file o testo inserito.');
                setImporting(false);
                return;
            }

            await VoteService.saveMatchdayVotes(matchday, parsed, '2025/26', 'official_file_import');
            toast.success(`Importati ${count} voti ufficiali con successo per la Giornata ${matchday}!`);
            onVotesImported();
            onClose();
        } catch (e) {
            toast.error('Errore durante l\'importazione: ' + e.message);
        } finally {
            setImporting(false);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFileName(file.name);

        const reader = new FileReader();

        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            reader.onload = async (event) => {
                try {
                    const buffer = event.target.result;
                    const parsed = VoteService.parseOfficialExcel(buffer);
                    const count = Object.values(parsed).filter(p => p.played).length;
                    if (count > 0) {
                        await VoteService.saveMatchdayVotes(matchday, parsed, '2025/26', 'excel_import');
                        toast.success(`Caricati ${count} voti ufficiali da ${file.name}!`);
                        onVotesImported();
                        onClose();
                    } else {
                        toast.error('Nessun voto valido trovato nel file Excel.');
                    }
                } catch (err) {
                    toast.error('Errore nella lettura del file Excel: ' + err.message);
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            reader.onload = (event) => {
                setCsvText(event.target.result);
            };
            reader.readAsText(file);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
        }}>
            <div className="glass-card" style={{
                width: '100%',
                maxWidth: '620px',
                padding: '2rem',
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--glass-border)',
                position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                >
                    <X size={24} />
                </button>

                <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Upload size={20} color="var(--color-accent-primary)" />
                    Importa Voti Ufficiali (Giornata {matchday})
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                    Carica il file ufficiale `.xlsx` o `.csv` scaricato da Fantacalcio.it per assegnare i voti reali ed eventi esatti.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                    <a
                        href="https://www.fantacalcio.it/voti-fantacalcio-serie-a"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', textDecoration: 'none' }}
                    >
                        <ExternalLink size={15} />
                        Scarica Voti da Fantacalcio.it
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
                </div>

                {fileName && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-accent-primary)', marginBottom: '1rem' }}>
                        File selezionato: <strong>{fileName}</strong>
                    </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                    <textarea
                        rows={6}
                        value={csvText}
                        onChange={(e) => setCsvText(e.target.value)}
                        placeholder="Oppure incolla qui il testo del file CSV dei voti ufficiali..."
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            backgroundColor: 'var(--color-bg-primary)',
                            border: '1px solid var(--glass-border)',
                            color: 'white',
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            resize: 'vertical'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button className="btn btn-secondary" onClick={onClose} disabled={importing}>
                        Annulla
                    </button>
                    <button className="btn btn-primary" onClick={handleImport} disabled={importing || !csvText.trim()}>
                        {importing ? 'Importazione...' : 'Salva Voti Ufficiali'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const FixtureList = ({ fixtures = [], currentMatchday, teams = [], onCalculate, isAdmin }) => {
    const [viewMatchday, setViewMatchday] = useState(currentMatchday || 1);
    const [selectedMatchForDetail, setSelectedMatchForDetail] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [calculating, setCalculating] = useState(false);

    if (!fixtures || fixtures.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                Nessuna partita programmata. L'Admin deve avviare la stagione da "Admin Console".
            </div>
        );
    }

    const roundData = fixtures.find(f => f.round === viewMatchday);

    const handlePrev = () => setViewMatchday(curr => Math.max(1, curr - 1));
    const handleNext = () => setViewMatchday(curr => Math.min(fixtures.length, curr + 1));

    const [fetchingOnline, setFetchingOnline] = useState(false);

    const handleCalculateRound = async () => {
        setCalculating(true);
        const res = await onCalculate(viewMatchday);
        setCalculating(false);
        if (res.success) {
            toast.success(`Giornata ${viewMatchday} calcolata con successo con voti ufficiali!`);
        } else {
            toast.error(`Errore nel calcolo: ${res.message}`);
        }
    };

    const handleAutoFetchOnline = async () => {
        setFetchingOnline(true);
        const toastId = toast.loading(`Scaricamento voti online per la Giornata ${viewMatchday}...`);
        try {
            const votes = await VoteService.fetchFromOnlineFeed(viewMatchday);
            if (votes && Object.values(votes).some(p => p.played)) {
                await VoteService.saveMatchdayVotes(viewMatchday, votes, '2025/26', 'online_feed');
                const count = Object.values(votes).filter(p => p.played).length;
                toast.success(`Scaricati con successo ${count} voti ufficiali online!`, { id: toastId });
            } else {
                toast.error(`Impossibile scaricare automaticamente i voti per la Giornata ${viewMatchday}. Puoi scaricarli dal sito ufficiale ed importare il file .xlsx/.csv!`, { id: toastId, duration: 6000 });
                setShowImportModal(true);
            }
        } catch (e) {
            toast.error('Errore durante lo scaricamento online: ' + e.message, { id: toastId });
        } finally {
            setFetchingOnline(false);
        }
    };

    return (
        <div>
            {/* Header with Navigation & Admin Controls */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button onClick={handlePrev} disabled={viewMatchday <= 1} className="btn-icon">
                        <ChevronLeft size={20} />
                    </button>
                    <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Giornata {viewMatchday}</h3>
                    <button onClick={handleNext} disabled={viewMatchday >= fixtures.length} className="btn-icon">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {isAdmin && (
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={handleAutoFetchOnline}
                            disabled={fetchingOnline}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                            title="Tenta lo scaricamento automatico dei voti da feed online e mirror"
                        >
                            <Download size={16} color="var(--color-accent-primary)" />
                            {fetchingOnline ? 'Scaricamento...' : '🌐 Scarica Voti Online'}
                        </button>

                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowImportModal(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                            title="Importa file Excel/CSV scaricato da Fantacalcio.it"
                        >
                            <FileText size={16} />
                            Carica File Voti (.xlsx/.csv)
                        </button>

                        <button
                            className="btn btn-primary"
                            onClick={handleCalculateRound}
                            disabled={calculating}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
                        >
                            <Zap size={16} />
                            {calculating ? 'Calcolo in corso...' : `⚡ Calcola Giornata ${viewMatchday}`}
                        </button>
                    </div>
                )}
            </div>

            {/* Match Cards */}
            <div style={{ display: 'grid', gap: '1rem' }}>
                {roundData?.matches?.map(match => {
                    const homeTeam = teams.find(t => t.id === match.homeTeamId);
                    const awayTeam = teams.find(t => t.id === match.awayTeamId);

                    if (!homeTeam || !awayTeam) return null;

                    return (
                        <div
                            key={match.id}
                            className="glass-panel"
                            style={{
                                padding: '1.25rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                                borderRadius: '12px',
                                border: match.completed ? '1px solid var(--glass-border)' : '1px dashed var(--glass-border)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ flex: 1, textAlign: 'right', fontWeight: 600, fontSize: '1.05rem' }}>
                                    {homeTeam.name}
                                </div>
                                <div style={{
                                    width: '100px',
                                    textAlign: 'center',
                                    fontWeight: 800,
                                    fontSize: match.completed ? '1.5rem' : '1.1rem',
                                    color: match.completed ? 'var(--color-accent-primary)' : 'var(--color-text-muted)'
                                }}>
                                    {match.completed
                                        ? `${match.result.homeGoals} - ${match.result.awayGoals}`
                                        : 'vs'}
                                </div>
                                <div style={{ flex: 1, textAlign: 'left', fontWeight: 600, fontSize: '1.05rem' }}>
                                    {awayTeam.name}
                                </div>
                            </div>

                            {match.completed && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        Fantapunti: {match.result.homeTotal} - {match.result.awayTotal}
                                    </span>
                                    <button
                                        onClick={() => setSelectedMatchForDetail({ match, homeTeam, awayTeam })}
                                        className="btn btn-secondary"
                                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                    >
                                        <Eye size={12} /> Pagelle & Dettagli
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Modals */}
            {selectedMatchForDetail && (
                <MatchDetailModal
                    match={selectedMatchForDetail.match}
                    homeTeam={selectedMatchForDetail.homeTeam}
                    awayTeam={selectedMatchForDetail.awayTeam}
                    onClose={() => setSelectedMatchForDetail(null)}
                />
            )}

            {showImportModal && (
                <ImportVotesModal
                    matchday={viewMatchday}
                    onClose={() => setShowImportModal(false)}
                    onVotesImported={() => {
                        toast.success('Voti aggiornati. Clicca su Calcola Giornata per applicarli.');
                    }}
                />
            )}
        </div>
    );
};

const CompetitionDashboard = () => {
    const { activeCompetition, currentMatchday, actions: { calculateMatchday } } = useCompetition();
    const { teams, currentUser } = useLeague();
    const [activeTab, setActiveTab] = useState('standings');
    const isAdmin = currentUser.role === 'admin';

    if (!activeCompetition) {
        return (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                <Trophy size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                <h3>Nessuna Competizione Attiva</h3>
                <p>Chiedi all'Amministratore di avviare la stagione dalla Console Admin.</p>
            </div>
        );
    }

    return (
        <div>
            <Toaster position="top-right" />

            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 className="text-gradient" style={{ fontSize: '2.5rem', margin: 0 }}>
                        {activeCompetition.name}
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                        Campionato Fantacalcio • Giornata Attuale: {currentMatchday}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className={`btn ${activeTab === 'standings' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('standings')}
                    >
                        <Trophy size={16} style={{ marginRight: '0.5rem' }} />
                        Classifica
                    </button>
                    <button
                        className={`btn ${activeTab === 'fixtures' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('fixtures')}
                    >
                        <Calendar size={16} style={{ marginRight: '0.5rem' }} />
                        Calendario
                    </button>
                </div>
            </header>

            {activeTab === 'standings' && (
                <div className="glass-card">
                    <StandingsTable standings={activeCompetition.standings} teams={teams} />
                </div>
            )}

            {activeTab === 'fixtures' && (
                <div className="glass-card">
                    <FixtureList
                        fixtures={activeCompetition.fixtures}
                        currentMatchday={currentMatchday}
                        teams={teams}
                        onCalculate={calculateMatchday}
                        isAdmin={isAdmin}
                    />
                </div>
            )}
        </div>
    );
};

export default CompetitionDashboard;
