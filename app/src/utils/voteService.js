import { supabase } from '../lib/supabase';
import { calculatePlayerScore } from './scoringEngine';
import { getAllPlayers } from './playerDatabase';
import * as XLSX from 'xlsx';

/**
 * Normalizes Italian player names for reliable cross-dataset matching
 * (e.g. "MARTINEZ L." -> "lautaro martinez", "KVARATSKHELIA" -> "kvaratskhelia")
 */
export const normalizePlayerName = (name) => {
    if (!name) return '';
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]/g, ' ')       // Replace punctuation with space
        .trim();
};

/**
 * Service to fetch, scrape, import, and cache official Fantacalcio grades for any matchday.
 */
export const VoteService = {
    /**
     * Gets official votes for a specific matchday.
     * Order of resolution:
     * 1. Supabase database cache (table `matchday_votes`)
     * 2. Live online feed / Web Scraping fetcher
     * 3. Statistical realistic generation (deterministic fallback)
     */
    getMatchdayVotes: async (matchday, season = '2025/26', forceRefresh = false, allowSimulation = false) => {
        // 1. Try Supabase Cache
        if (!forceRefresh) {
            const { data: cached } = await supabase
                .from('matchday_votes')
                .select('*')
                .eq('matchday', matchday)
                .eq('season', season)
                .single();

            if (cached && cached.votes && Object.keys(cached.votes).length > 0) {
                console.log(`[VoteService] Loaded votes for matchday ${matchday} from Supabase cache`);
                return cached.votes;
            }
        }

        // 2. Try online feed / web scraping
        try {
            console.log(`[VoteService] Attempting to fetch live votes for matchday ${matchday}...`);
            const feedVotes = await VoteService.fetchFromOnlineFeed(matchday);
            if (feedVotes && Object.keys(feedVotes).length > 0) {
                await VoteService.saveMatchdayVotes(matchday, feedVotes, season, 'online_feed');
                return feedVotes;
            }
        } catch (feedError) {
            console.warn('[VoteService] Online feed fetch failed:', feedError.message);
        }

        // 3. Fallback only if simulation mode is explicitly enabled by Admin
        if (allowSimulation) {
            console.log(`[VoteService] Simulation mode enabled: generating test votes for matchday ${matchday}`);
            const fallbackVotes = VoteService.generateFallbackVotes(matchday);
            await VoteService.saveMatchdayVotes(matchday, fallbackVotes, season, 'fallback_engine');
            return fallbackVotes;
        }

        // Real season mode: no votes available yet for future matchdays
        console.warn(`[VoteService] No official votes available yet for Serie A matchday ${matchday}`);
        return null;
    },

    /**
     * Returns the direct official URL to the Fantacalcio.it matchday votes page.
     */
    getOfficialUrl: (matchday, season = '2025-26') => {
        return `https://www.fantacalcio.it/voti-fantacalcio-serie-a/${season}/${matchday}`;
    },

    /**
     * Attempts to fetch real matchday data from official Fantacalcio.it and open feeds.
     */
    fetchFromOnlineFeed: async (matchday, season = '2025-26') => {
        const allPlayers = getAllPlayers();
        const playerMap = new Map();
        allPlayers.forEach(p => {
            playerMap.set(normalizePlayerName(p.name), p);
            playerMap.set(p.id.toString(), p);
        });

        const targetUrl = `https://www.fantacalcio.it/voti-fantacalcio-serie-a/${season}/${matchday}`;

        // List of candidate proxies and mirrors
        const candidateEndpoints = [
            `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
            `https://raw.githubusercontent.com/openfootball/serie-a/master/2025-26/giornata-${matchday}.json`,
            `https://api.fantamanager.app/v1/votes/serie-a/${matchday}`
        ];

        for (const endpoint of candidateEndpoints) {
            try {
                const response = await fetch(endpoint, {
                    headers: { 'Accept': 'application/json, text/html, */*' }
                });

                if (response.ok) {
                    const contentType = response.headers.get('content-type') || '';
                    if (contentType.includes('json') || endpoint.endsWith('.json')) {
                        const rawData = await response.json();
                        const parsed = VoteService.parseFeedData(rawData, allPlayers, playerMap);
                        if (Object.values(parsed).some(p => p.played)) return parsed;
                    } else {
                        const html = await response.text();
                        const parsed = VoteService.parseFantacalcioHTML(html, allPlayers, playerMap);
                        if (Object.values(parsed).some(p => p.played)) return parsed;
                    }
                }
            } catch (err) {
                console.warn(`[VoteService] Error fetching from ${endpoint}:`, err.message);
            }
        }

        return null;
    },

    /**
     * Parses official Fantacalcio.it HTML page tables to extract real player grades and match events.
     */
    parseFantacalcioHTML: (htmlText, allPlayers, playerMap) => {
        const votes = {};
        if (!htmlText || typeof htmlText !== 'string') return votes;

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');

            // Find all vote tables or player rows
            const rows = doc.querySelectorAll('tr, .player-row, .table-row');

            rows.forEach(row => {
                const text = row.innerText || row.textContent || '';
                if (!text || text.length < 5) return;

                // Match player name and vote
                const cells = Array.from(row.querySelectorAll('td, th, .cell, span')).map(c => c.textContent.trim());
                if (cells.length < 2) return;

                // Search for matching player in cells
                let matchedPlayer = null;
                for (const cell of cells) {
                    const norm = normalizePlayerName(cell);
                    if (norm.length > 2) {
                        matchedPlayer = playerMap.get(norm) || allPlayers.find(p => norm && normalizePlayerName(p.name) === norm);
                        if (matchedPlayer) break;
                    }
                }

                if (matchedPlayer) {
                    // Extract numeric grade (e.g. 6.5, 7, 5.5)
                    let grade = null;
                    for (const cell of cells) {
                        const clean = cell.replace(',', '.').trim();
                        const num = parseFloat(clean);
                        if (!isNaN(num) && num >= 1 && num <= 10 && (num * 2) % 1 === 0) {
                            grade = num;
                            break;
                        }
                    }

                    // Extract events (goals, assists, cards)
                    const rowHtml = row.innerHTML.toLowerCase();
                    const goals = (rowHtml.match(/gol|goal|icon-gol|⚽/g) || []).length;
                    const assists = (rowHtml.match(/assist|icon-assist|👟/g) || []).length;
                    const yellowCards = (rowHtml.match(/ammonit|yellow|🟨/g) || []).length;
                    const redCards = (rowHtml.match(/espuls|red|🟥/g) || []).length;

                    if (grade !== null) {
                        const events = {
                            goals,
                            assists,
                            yellowCards,
                            redCards,
                            goalsConceded: matchedPlayer.role === 'POR' ? 0 : 0,
                            cleanSheet: matchedPlayer.role === 'POR'
                        };

                        const score = calculatePlayerScore(grade, events, matchedPlayer.role);
                        votes[matchedPlayer.id] = {
                            playerId: matchedPlayer.id,
                            name: matchedPlayer.name,
                            role: matchedPlayer.role,
                            team: matchedPlayer.team,
                            played: true,
                            grade: score.grade,
                            bonus: score.bonus,
                            fantavote: score.total,
                            events
                        };
                    }
                }
            });
        } catch (e) {
            console.error('[VoteService] DOM parsing error:', e);
        }

        // Fill remaining players from listone as DNP
        allPlayers.forEach(player => {
            if (!votes[player.id]) {
                votes[player.id] = {
                    playerId: player.id,
                    name: player.name,
                    role: player.role,
                    team: player.team,
                    played: false,
                    grade: null,
                    bonus: 0,
                    fantavote: null,
                    events: {}
                };
            }
        });

        return votes;
    },

    /**
     * Parses external feed JSON data and maps it to player IDs from listone.csv
     */
    parseFeedData: (rawData, allPlayers, playerMap) => {
        const votes = {};

        const playerItems = Array.isArray(rawData) ? rawData : (rawData.players || rawData.voti || []);

        playerItems.forEach(item => {
            const rawName = item.name || item.nome || item.calciatore;
            const normName = normalizePlayerName(rawName);
            const matchedPlayer = playerMap.get(normName) || allPlayers.find(p => normName.includes(normalizePlayerName(p.name)));

            if (matchedPlayer) {
                const grade = parseFloat(item.grade || item.voto || item.vote) || null;
                const events = {
                    goals: parseInt(item.goals || item.gf || item.gol || 0),
                    assists: parseInt(item.assists || item.ass || 0),
                    yellowCards: parseInt(item.yellowCards || item.amm || 0),
                    redCards: parseInt(item.redCards || item.esp || 0),
                    penaltiesScored: parseInt(item.penaltiesScored || item.rc || 0),
                    penaltiesMissed: parseInt(item.penaltiesMissed || item.rs || 0),
                    penaltiesSaved: parseInt(item.penaltiesSaved || item.rp || 0),
                    goalsConceded: parseInt(item.goalsConceded || item.gs || 0),
                    cleanSheet: item.cleanSheet || (matchedPlayer.role === 'POR' && parseInt(item.goalsConceded || item.gs || 0) === 0)
                };

                const score = grade ? calculatePlayerScore(grade, events, matchedPlayer.role) : { grade: null, bonus: 0, total: null };

                votes[matchedPlayer.id] = {
                    playerId: matchedPlayer.id,
                    name: matchedPlayer.name,
                    role: matchedPlayer.role,
                    team: matchedPlayer.team,
                    played: grade !== null,
                    grade: score.grade,
                    bonus: score.bonus,
                    fantavote: score.total,
                    events
                };
            }
        });

        allPlayers.forEach(player => {
            if (!votes[player.id]) {
                votes[player.id] = {
                    playerId: player.id,
                    name: player.name,
                    role: player.role,
                    team: player.team,
                    played: false,
                    grade: null,
                    bonus: 0,
                    fantavote: null,
                    events: {}
                };
            }
        });

        return votes;
    },

    /**
     * Parses official Fantacalcio.it CSV export text or raw table.
     */
    parseOfficialCSV: (csvText) => {
        if (!csvText) return {};
        const lines = csvText.trim().split('\n');
        const rows = lines.map(l => l.split(/[;,|\t]/).map(c => c.trim().replace(/^["']|["']$/g, '')));
        return VoteService.parseRows(rows);
    },

    /**
     * Parses official Fantacalcio.it Excel (.xlsx / .xls) buffer.
     * Supports multi-sheet files ('Fantacalcio', 'Statistico', 'Italia').
     */
    parseOfficialExcel: (arrayBuffer) => {
        try {
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            // Prefer 'Fantacalcio' sheet (official standard redazione)
            const sheetName = workbook.SheetNames.find(s => s.toLowerCase() === 'fantacalcio') || workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            return VoteService.parseRows(rows);
        } catch (e) {
            console.error('[VoteService] Excel parsing error:', e);
            throw new Error('Impossibile leggere il file Excel dei voti: ' + e.message);
        }
    },

    /**
     * Universal row matrix parser for Fantacalcio.it data format.
     */
    parseRows: (rows = []) => {
        const allPlayers = getAllPlayers();
        const playerMap = new Map();
        allPlayers.forEach(p => {
            playerMap.set(normalizePlayerName(p.name), p);
            playerMap.set(p.id.toString(), p);
            playerMap.set(p.id, p);
        });

        // 1. Locate header row
        const headerRowIdx = rows.findIndex(r => r && Array.isArray(r) && r.some(c => typeof c === 'string' && (c.toLowerCase().includes('voto') || c.toLowerCase().includes('cod'))));

        if (headerRowIdx === -1) {
            console.warn('[VoteService] Header row not found in rows matrix');
            return {};
        }

        const headers = rows[headerRowIdx].map(h => typeof h === 'string' ? h.toLowerCase().trim() : '');

        const idIdx = headers.findIndex(h => h.includes('cod') || h === 'id');
        const roleIdx = headers.findIndex(h => h.includes('ruolo') || h === 'r');
        const nameIdx = headers.findIndex(h => h.includes('nome') || h.includes('calciatore'));
        const votoIdx = headers.findIndex(h => h.includes('voto'));
        const gfIdx = headers.findIndex(h => h === 'gf' || h.includes('gol fatto') || h.includes('gol fatti') || h === 'gol');
        const gsIdx = headers.findIndex(h => h === 'gs' || h.includes('gol subito') || h.includes('gol subiti'));
        const rpIdx = headers.findIndex(h => h === 'rp' || h.includes('rigore parato'));
        const rsIdx = headers.findIndex(h => h === 'rs' || h.includes('rigore sbagliato'));
        const auIdx = headers.findIndex(h => h === 'au' || h.includes('autogol') || h.includes('aut'));
        const ammIdx = headers.findIndex(h => h.includes('amm'));
        const espIdx = headers.findIndex(h => h.includes('esp'));
        const assIdx = headers.findIndex(h => h.includes('ass'));

        const votes = {};

        const parseNum = (val) => {
            if (val === undefined || val === null || val === '') return 0;
            if (typeof val === 'number') return val;
            const clean = val.toString().replace('*', '').replace(',', '.').trim();
            const n = parseFloat(clean);
            return isNaN(n) ? 0 : n;
        };

        for (let i = headerRowIdx + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !Array.isArray(row) || row.length < 4) continue;

            const rawId = row[idIdx];
            const rawName = row[nameIdx];
            if (!rawId || !rawName || typeof rawName !== 'string') continue;

            let gradeRaw = row[votoIdx];
            let grade = null;

            if (typeof gradeRaw === 'number') {
                grade = gradeRaw;
            } else if (typeof gradeRaw === 'string') {
                const clean = gradeRaw.replace('*', '').replace(',', '.').trim().toLowerCase();
                if (clean !== 's.v.' && clean !== 'sv' && clean !== '-' && clean !== '' && !isNaN(parseFloat(clean))) {
                    grade = parseFloat(clean);
                }
            }

            const events = {
                goals: gfIdx !== -1 ? parseNum(row[gfIdx]) : 0,
                goalsConceded: gsIdx !== -1 ? parseNum(row[gsIdx]) : 0,
                penaltiesSaved: rpIdx !== -1 ? parseNum(row[rpIdx]) : 0,
                penaltiesMissed: rsIdx !== -1 ? parseNum(row[rsIdx]) : 0,
                ownGoals: auIdx !== -1 ? parseNum(row[auIdx]) : 0,
                yellowCards: ammIdx !== -1 ? parseNum(row[ammIdx]) : 0,
                redCards: espIdx !== -1 ? parseNum(row[espIdx]) : 0,
                assists: assIdx !== -1 ? parseNum(row[assIdx]) : 0,
                cleanSheet: false
            };

            // Match player by ID first, then by normalized name
            const idKey = rawId.toString().trim();
            const normName = normalizePlayerName(rawName);
            const matched = playerMap.get(idKey) || playerMap.get(normName) || allPlayers.find(p => normName && normalizePlayerName(p.name) === normName);

            if (matched) {
                if (matched.role === 'POR' && events.goalsConceded === 0 && grade !== null) {
                    events.cleanSheet = true;
                }

                const score = grade !== null ? calculatePlayerScore(grade, events, matched.role) : { grade: null, bonus: 0, total: null };

                votes[matched.id] = {
                    playerId: matched.id,
                    name: matched.name,
                    role: matched.role,
                    team: matched.team,
                    played: grade !== null,
                    grade: score.grade,
                    bonus: score.bonus,
                    fantavote: score.total,
                    events
                };
            }
        }

        // Fill remaining players from listone as DNP
        allPlayers.forEach(player => {
            if (!votes[player.id]) {
                votes[player.id] = {
                    playerId: player.id,
                    name: player.name,
                    role: player.role,
                    team: player.team,
                    played: false,
                    grade: null,
                    bonus: 0,
                    fantavote: null,
                    events: {}
                };
            }
        });

        return votes;
    },

    /**
     * Deterministic statistical fallback generator for testing or simulation.
     */
    generateFallbackVotes: (matchday) => {
        const players = getAllPlayers();
        const generatedVotes = {};

        players.forEach(player => {
            const seed = (player.id * 31 + matchday * 97) % 100;
            const didPlay = seed < 75;

            if (!didPlay) {
                generatedVotes[player.id] = {
                    playerId: player.id,
                    name: player.name,
                    role: player.role,
                    team: player.team,
                    played: false,
                    grade: null,
                    fantavote: null,
                    events: {}
                };
                return;
            }

            const gradeBase = 5.5 + ((seed % 20) / 10);
            const grade = Math.round(gradeBase * 2) / 2;

            const events = {
                goals: 0,
                assists: 0,
                yellowCards: 0,
                redCards: 0,
                penaltiesScored: 0,
                penaltiesMissed: 0,
                penaltiesSaved: 0,
                goalsConceded: 0,
                cleanSheet: false
            };

            if (player.role === 'ATT') {
                if (seed > 60) events.goals = seed > 72 ? 2 : 1;
                if (seed > 50 && seed <= 60) events.assists = 1;
                if (seed < 15) events.yellowCards = 1;
            } else if (player.role === 'CEN') {
                if (seed > 68) events.goals = 1;
                if (seed > 52 && seed <= 68) events.assists = 1;
                if (seed < 22) events.yellowCards = 1;
            } else if (player.role === 'DIF') {
                if (seed > 72) events.goals = 1;
                if (seed > 65 && seed <= 72) events.assists = 1;
                if (seed < 28) events.yellowCards = 1;
                if (seed === 7) events.redCards = 1;
            } else if (player.role === 'POR') {
                const conceded = seed % 3;
                events.goalsConceded = conceded;
                if (conceded === 0) events.cleanSheet = true;
                if (seed === 50) events.penaltiesSaved = 1;
            }

            const score = calculatePlayerScore(grade, events, player.role);

            generatedVotes[player.id] = {
                playerId: player.id,
                name: player.name,
                role: player.role,
                team: player.team,
                played: true,
                grade: score.grade,
                bonus: score.bonus,
                fantavote: score.total,
                events
            };
        });

        return generatedVotes;
    },

    /**
     * Saves votes to Supabase cache.
     */
    saveMatchdayVotes: async (matchday, votes, season = '2025/26', source = 'manual') => {
        try {
            await supabase
                .from('matchday_votes')
                .upsert([{
                    matchday,
                    season,
                    votes,
                    calculated_at: new Date().toISOString()
                }], { onConflict: 'matchday,season' });
        } catch (e) {
            console.error('Error saving votes to Supabase:', e);
        }
    }
};
