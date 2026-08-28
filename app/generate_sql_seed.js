import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
            name: row.Nome.replace(/'/g, "''"),
            role: roleMap[row.R] || row.R || 'CEN',
            team: (row.Squadra || 'Serie A').replace(/'/g, "''"),
            value: parseInt(row['Qt.A'], 10) || 1
        };
    }).filter(Boolean);
}

function generateRoundRobin(teamUuids) {
    const workingList = [...teamUuids];
    const totalRounds = (workingList.length - 1) * 2;
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

function generateSQL() {
    const allPlayers = loadPlayers();
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
        { name: 'Aura FC', teamId: 'f2e4982b-dca8-44a4-8b87-3ac6bd6569b1', userId: '494b5e38-c4ca-4f72-896e-58615d451e1f', email: 'admin@fantamanager.com', username: 'Admin' },
        { name: 'Real Madrink', teamId: '11111111-1111-1111-1111-111111111111', userId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', email: 'madrink@fantamanager.com', username: 'Madrink' },
        { name: 'Dinamo Losca', teamId: '22222222-2222-2222-2222-222222222222', userId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', email: 'losca@fantamanager.com', username: 'Losca' },
        { name: 'Aston Birra', teamId: '33333333-3333-3333-3333-333333333333', userId: 'cccccccc-cccc-cccc-cccc-cccccccccccc', email: 'birra@fantamanager.com', username: 'Birra' },
        { name: 'Paris Saint-Gennar', teamId: '44444444-4444-4444-4444-444444444444', userId: 'dddddddd-dddd-dddd-dddd-dddddddddddd', email: 'gennar@fantamanager.com', username: 'Gennar' },
        { name: 'Borussia Porkmund', teamId: '55555555-5555-5555-5555-555555555555', userId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', email: 'porkmund@fantamanager.com', username: 'Porkmund' },
        { name: 'Atletico MaNonTroppo', teamId: '66666666-6666-6666-6666-666666666666', userId: 'ffffffff-ffff-ffff-ffff-ffffffffffff', email: 'atletico@fantamanager.com', username: 'Atletico' },
        { name: 'Scarsenal', teamId: '77777777-7777-7777-7777-777777777777', userId: '99999999-9999-9999-9999-999999999999', email: 'scarsenal@fantamanager.com', username: 'Scarsenal' }
    ];

    let sql = `-- =========================================================================
-- SQL SEED: 8 Squadre Complete + 25 Calciatori Ciascuna + Formazioni Giornata 1
-- Esegui questo script nel SQL Editor di Supabase
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Rimuovi vecchie squadre e formazioni di test (tranne Admin)
DELETE FROM public.lineups WHERE competition_id = 'dcb460bf-5deb-47e2-84cf-6b96fd05bc01';
DELETE FROM public.teams WHERE competition_id = 'dcb460bf-5deb-47e2-84cf-6b96fd05bc01' AND id != 'f2e4982b-dca8-44a4-8b87-3ac6bd6569b1';

-- 2. Crea i 7 Manager con email confermata
`;

    for (let i = 1; i < teamConfigs.length; i++) {
        const c = teamConfigs[i];
        sql += `
-- Manager ${c.username}
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '${c.userId}',
    'authenticated',
    'authenticated',
    '${c.email}',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"${c.username}"}',
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
    id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
    '${c.userId}',
    '${c.userId}',
    jsonb_build_object('sub', '${c.userId}', 'email', '${c.email}'),
    'email',
    now(),
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, username, created_at)
VALUES ('${c.userId}', '${c.username}', now())
ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username;
`;
    }

    sql += `\n-- 3. Inserisci le 8 Squadre con Rose Complete da 25 Giocatori ciascuna\n`;

    let porIdx = 0, difIdx = 0, cenIdx = 0, attIdx = 0;
    const allTeamLineups = [];

    for (let i = 0; i < teamConfigs.length; i++) {
        const c = teamConfigs[i];
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

        allTeamLineups.push({
            teamId: c.teamId,
            starters,
            bench
        });

        const rosterJson = JSON.stringify(roster).replace(/'/g, "''");

        if (i === 0) {
            sql += `
-- Aggiornamento Aura FC
UPDATE public.teams
SET name = '${c.name}',
    roster = '${rosterJson}'::jsonb,
    transfer_budget = ${finalTransfer},
    salary_budget = ${finalSalary},
    budget = ${finalTransfer + finalSalary}
WHERE id = '${c.teamId}';
`;
        } else {
            sql += `
-- Inserimento Squadra ${c.name}
INSERT INTO public.teams (
    id, competition_id, owner_id, name, roster, transfer_budget, salary_budget, budget, created_at
) VALUES (
    '${c.teamId}',
    'dcb460bf-5deb-47e2-84cf-6b96fd05bc01',
    '${c.userId}',
    '${c.name}',
    '${rosterJson}'::jsonb,
    ${finalTransfer},
    ${finalSalary},
    ${finalTransfer + finalSalary},
    now()
) ON CONFLICT (id) DO UPDATE SET
    roster = EXCLUDED.roster,
    transfer_budget = EXCLUDED.transfer_budget,
    salary_budget = EXCLUDED.salary_budget,
    budget = EXCLUDED.budget;
`;
        }
    }

    sql += `\n-- 4. Inserimento Formazioni Giornata 1 per tutte le 8 squadre\n`;

    for (const l of allTeamLineups) {
        const startersJson = JSON.stringify(l.starters).replace(/'/g, "''");
        const benchJson = JSON.stringify(l.bench).replace(/'/g, "''");

        sql += `
INSERT INTO public.lineups (
    competition_id, team_id, matchday, module, starters, bench, submitted_at
) VALUES (
    'dcb460bf-5deb-47e2-84cf-6b96fd05bc01',
    '${l.teamId}',
    1,
    '4-3-3',
    '${startersJson}'::jsonb,
    '${benchJson}'::jsonb,
    now()
) ON CONFLICT (competition_id, team_id, matchday) DO UPDATE SET
    starters = EXCLUDED.starters,
    bench = EXCLUDED.bench;
`;
    }

    // Fixtures & Standings
    const teamUuids = teamConfigs.map(t => t.teamId);
    const fixtures = generateRoundRobin(teamUuids);
    const standings = {};
    teamUuids.forEach(id => {
        standings[id] = { pts: 0, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
    });

    const settingsJson = JSON.stringify({
        fixtures,
        standings,
        currentMatchday: 1,
        initialTransferBudget: 300,
        initialSalaryBudget: 200,
        salaryPercentage: 0.1,
        lastRestoreYear: 2026
    }).replace(/'/g, "''");

    sql += `\n-- 5. Aggiornamento Calendario (14 Giornate) e Classifica nella Competizione\n`;
    sql += `
UPDATE public.competitions
SET settings = '${settingsJson}'::jsonb
WHERE id = 'dcb460bf-5deb-47e2-84cf-6b96fd05bc01';

-- 6. Ricarica cache schema
NOTIFY pgrst, 'reload schema';
`;

    fs.writeFileSync(path.join(__dirname, 'sql_seed_8_teams.sql'), sql, 'utf8');
    console.log('✅ SQL script sql_seed_8_teams.sql generated successfully!');
}

generateSQL();

