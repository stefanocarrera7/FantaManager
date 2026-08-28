import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://vupcjzlatspgkrwjiikg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cGNqemxhdHNwZ2tyd2ppaWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NTk1MDgsImV4cCI6MjA4NDIzNTUwOH0.eWUxlYbn8tPCcT1f53xok1Js84N7UqY-aMlLXs4EgAI';

function loadPlayers() {
    const csvContent = fs.readFileSync(path.join(__dirname, 'src/data/listone.csv'), 'utf8');
    const lines = csvContent.trim().split('\n');
    const headerIdx = lines.findIndex(l => l.toLowerCase().startsWith('id,'));
    const headers = lines[headerIdx].split(',').map(h => h.trim());
    const dataLines = lines.slice(headerIdx + 1);

    const roleMap = { 'P': 'POR', 'D': 'DIF', 'C': 'CEN', 'A': 'ATT' };

    return dataLines.map((line, idx) => {
        const values = line.split(',').map(v => v.trim());
        const row = {};
        headers.forEach((h, i) => row[h] = values[i]);
        if (!row.Id || !row.Nome) return null;

        return {
            id: parseInt(row.Id, 10) || (idx + 1),
            name: row.Nome,
            role: roleMap[row.R] || row.R || 'CEN',
            team: row.Squadra || 'Serie A',
            value: parseInt(row['Qt.A'], 10) || 1
        };
    }).filter(Boolean);
}

function generateRoundRobin(teams) {
    const teamIds = teams.map(t => t.id);
    const workingList = [...teamIds];
    if (workingList.length % 2 !== 0) workingList.push(null);

    const totalRounds = (workingList.length - 1) * 2; // 14 matchdays for 8 teams
    const half = workingList.length / 2;
    const rounds = [];

    for (let r = 0; r < totalRounds; r++) {
        const roundMatches = [];
        const isSecondHalf = r >= (workingList.length - 1);
        const actualR = isSecondHalf ? r - (workingList.length - 1) : r;

        const currentTeams = [workingList[0], ...workingList.slice(1).slice(actualR), ...workingList.slice(1).slice(0, actualR)];

        for (let i = 0; i < half; i++) {
            const t1 = currentTeams[i];
            const t2 = currentTeams[currentTeams.length - 1 - i];

            if (t1 !== null && t2 !== null) {
                const home = isSecondHalf ? t2 : t1;
                const away = isSecondHalf ? t1 : t2;
                roundMatches.push({
                    id: `m_${r + 1}_${i + 1}`,
                    homeTeamId: home,
                    awayTeamId: away,
                    completed: false,
                    result: null
                });
            }
        }

        rounds.push({
            round: r + 1,
            matches: roundMatches
        });
    }

    return rounds;
}

async function run() {
    const allPlayers = loadPlayers();
    console.log(`Loaded ${allPlayers.length} players from listone.csv`);

    const por = allPlayers.filter(p => p.role === 'POR');
    const dif = allPlayers.filter(p => p.role === 'DIF');
    const cen = allPlayers.filter(p => p.role === 'CEN');
    const att = allPlayers.filter(p => p.role === 'ATT');

    const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
    const shuffledPor = shuffle(por);
    const shuffledDif = shuffle(dif);
    const shuffledCen = shuffle(cen);
    const shuffledAtt = shuffle(att);

    const teamConfigs = [
        { name: 'Aura FC', email: 'admin@fantamanager.com', password: 'AdminFanta2026!', username: 'Admin' },
        { name: 'Real Madrink', email: 'madrink@fantamanager.com', password: 'Password123!', username: 'Madrink' },
        { name: 'Dinamo Losca', email: 'losca@fantamanager.com', password: 'Password123!', username: 'Losca' },
        { name: 'Aston Birra', email: 'birra@fantamanager.com', password: 'Password123!', username: 'Birra' },
        { name: 'Paris Saint-Gennar', email: 'gennar@fantamanager.com', password: 'Password123!', username: 'Gennar' },
        { name: 'Borussia Porkmund', email: 'porkmund@fantamanager.com', password: 'Password123!', username: 'Porkmund' },
        { name: 'Atletico MaNonTroppo', email: 'atletico@fantamanager.com', password: 'Password123!', username: 'Atletico' },
        { name: 'Scarsenal', email: 'scarsenal@fantamanager.com', password: 'Password123!', username: 'Scarsenal' }
    ];

    // Find Signorini comp as admin
    const adminClient = createClient(supabaseUrl, supabaseKey);
    await adminClient.auth.signInWithPassword({
        email: 'admin@fantamanager.com',
        password: 'AdminFanta2026!'
    });

    const { data: comps } = await adminClient
        .from('competitions')
        .select('*')
        .eq('name', 'Signorini');

    const comp = comps[0];
    const compId = comp.id;
    console.log(`Found Competition "${comp.name}" (ID: ${compId})`);

    const teamsToUse = [];
    let porIdx = 0, difIdx = 0, cenIdx = 0, attIdx = 0;

    for (let i = 0; i < teamConfigs.length; i++) {
        const cfg = teamConfigs[i];

        // Create individual client for this user to satisfy RLS
        const client = createClient(supabaseUrl, supabaseKey);

        // Sign in or Sign up
        let authRes = await client.auth.signInWithPassword({ email: cfg.email, password: cfg.password });
        if (authRes.error) {
            await client.auth.signUp({
                email: cfg.email,
                password: cfg.password,
                options: { data: { username: cfg.username } }
            });
            authRes = await client.auth.signInWithPassword({ email: cfg.email, password: cfg.password });
        }

        const user = authRes.data.user;
        if (!user) {
            console.error(`Failed to auth user ${cfg.email}:`, authRes.error?.message);
            continue;
        }

        // Build distinct 25-man roster
        const teamPor = shuffledPor.slice(porIdx, porIdx + 3); porIdx += 3;
        const teamDif = shuffledDif.slice(difIdx, difIdx + 8); difIdx += 8;
        const teamCen = shuffledCen.slice(cenIdx, cenIdx + 8); cenIdx += 8;
        const teamAtt = shuffledAtt.slice(attIdx, attIdx + 6); attIdx += 6;

        const rosterRaw = [...teamPor, ...teamDif, ...teamCen, ...teamAtt];
        let totalAuctionPrice = 0;
        let totalSalaries = 0;

        const roster = rosterRaw.map(p => {
            const auctionPrice = Math.max(1, p.value + Math.floor(Math.random() * 4));
            const salary = Math.round((p.value * 0.1) * 10) / 10;
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

        const initialTransfer = 300;
        const initialSalary = 200;
        const finalTransfer = Math.max(10, initialTransfer - totalAuctionPrice + 120);
        const finalSalary = Math.round((initialSalary - totalSalaries) * 10) / 10;

        // Check if team exists
        const { data: existingList } = await client
            .from('teams')
            .select('*')
            .eq('competition_id', compId)
            .eq('owner_id', user.id);

        let activeTeam = null;

        if (existingList && existingList.length > 0) {
            const existing = existingList[0];
            const { data: updated } = await client
                .from('teams')
                .update({
                    name: cfg.name,
                    roster: roster,
                    transfer_budget: finalTransfer,
                    salary_budget: finalSalary,
                    budget: finalTransfer + finalSalary
                })
                .eq('id', existing.id)
                .select()
                .single();
            activeTeam = updated || existing;
            console.log(`Updated team ${cfg.name} (ID: ${activeTeam.id})`);
        } else {
            const { data: created, error: createErr } = await client
                .from('teams')
                .insert([{
                    competition_id: compId,
                    owner_id: user.id,
                    name: cfg.name,
                    roster: roster,
                    transfer_budget: finalTransfer,
                    salary_budget: finalSalary,
                    budget: finalTransfer + finalSalary
                }])
                .select()
                .single();

            if (createErr) {
                console.error(`Error creating team ${cfg.name}:`, createErr);
            } else {
                activeTeam = created;
                console.log(`Created team ${cfg.name} (ID: ${activeTeam.id})`);
            }
        }

        if (activeTeam) {
            teamsToUse.push(activeTeam);

            // Now insert valid Matchday 1 lineup for this team!
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

            const { data: lineupData, error: lineupErr } = await client
                .from('lineups')
                .upsert([{
                    competition_id: compId,
                    team_id: activeTeam.id,
                    matchday: 1,
                    module: '4-3-3',
                    starters: starters,
                    bench: bench,
                    submitted_at: new Date().toISOString()
                }], { onConflict: 'competition_id,team_id,matchday' })
                .select()
                .single();

            if (lineupErr) {
                console.error(`❌ Lineup error for ${cfg.name}:`, lineupErr.message);
            } else {
                console.log(`✅ Formazione salvata per ${cfg.name} (11 titolari, ${bench.length} panchinari)`);
            }
        }
    }

    console.log(`\nTotal teams initialized: ${teamsToUse.length}`);

    // Update competition fixtures & standings
    const fixtures = generateRoundRobin(teamsToUse);
    const standings = {};
    teamsToUse.forEach(t => {
        standings[t.id] = { pts: 0, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
    });

    const updatedSettings = {
        ...(comp.settings || {}),
        fixtures,
        standings,
        currentMatchday: 1,
        initialTransferBudget: 300,
        initialSalaryBudget: 200,
        salaryPercentage: 0.1,
        lastRestoreYear: 2026
    };

    await adminClient
        .from('competitions')
        .update({ settings: updatedSettings })
        .eq('id', compId);

    console.log(`\n🏆 Stagione configurata: ${fixtures.length} giornate generate per 8 squadre.`);
}

run();

