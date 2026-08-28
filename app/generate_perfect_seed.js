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

function generateRoundRobin(teamNames) {
    const workingList = [...teamNames];
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
                    homeTeamName: home,
                    awayTeamName: away,
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

    const teams = [
        { name: 'Aura FC', email: 'admin@fantamanager.com', username: 'Admin', isAdmin: true },
        { name: 'Real Madrink', email: 'madrink@fantamanager.com', username: 'Madrink' },
        { name: 'Dinamo Losca', email: 'losca@fantamanager.com', username: 'Losca' },
        { name: 'Aston Birra', email: 'birra@fantamanager.com', username: 'Birra' },
        { name: 'Paris Saint-Gennar', email: 'gennar@fantamanager.com', username: 'Gennar' },
        { name: 'Borussia Porkmund', email: 'porkmund@fantamanager.com', username: 'Porkmund' },
        { name: 'Atletico MaNonTroppo', email: 'atletico@fantamanager.com', username: 'Atletico' },
        { name: 'Scarsenal', email: 'scarsenal@fantamanager.com', username: 'Scarsenal' }
    ];

    let porIdx = 0, difIdx = 0, cenIdx = 0, attIdx = 0;
    const teamDataList = [];

    for (let i = 0; i < teams.length; i++) {
        const t = teams[i];
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

        teamDataList.push({
            ...t,
            roster,
            finalTransfer,
            finalSalary,
            starters,
            bench
        });
    }

    let sql = `-- =========================================================================
-- SQL SEED: 8 SQUADRE + 200 CALCIATORI + FORMAZIONI G1 + CALENDARIO
-- Esegui questo script nel SQL Editor di Supabase
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    target_comp_id UUID;
    admin_user_id UUID;
    cur_user_id UUID;
    cur_team_id UUID;
    encrypted_pw TEXT := crypt('Password123!', gen_salt('bf'));
BEGIN
    -- 1. Trova o crea la competizione Signorini
    SELECT id, admin_id INTO target_comp_id, admin_user_id FROM public.competitions WHERE name = 'Signorini' LIMIT 1;

    IF target_comp_id IS NULL THEN
        -- Prendi il primo admin disponibile
        SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@fantamanager.com' LIMIT 1;
        IF admin_user_id IS NULL THEN
            SELECT id INTO admin_user_id FROM auth.users LIMIT 1;
        END IF;

        INSERT INTO public.competitions (name, share_code, admin_id, settings)
        VALUES ('Signorini', 'OGZJF6', admin_user_id, '{}'::jsonb)
        RETURNING id INTO target_comp_id;
    END IF;

    -- 2. Pulizia vecchie formazioni e squadre per questa competizione
    DELETE FROM public.lineups WHERE competition_id = target_comp_id;
    DELETE FROM public.teams WHERE competition_id = target_comp_id AND name != 'Aura FC';
`;

    for (let i = 0; i < teamDataList.length; i++) {
        const t = teamDataList[i];
        const rosterJson = JSON.stringify(t.roster).replace(/'/g, "''");
        const startersJson = JSON.stringify(t.starters).replace(/'/g, "''");
        const benchJson = JSON.stringify(t.bench).replace(/'/g, "''");

        if (t.isAdmin) {
            sql += `
    -- =====================================================================
    -- SQUADRA 1 (Admin): ${t.name}
    -- =====================================================================
    SELECT id INTO cur_team_id FROM public.teams WHERE competition_id = target_comp_id AND name = '${t.name}' LIMIT 1;
    
    IF cur_team_id IS NOT NULL THEN
        UPDATE public.teams
        SET roster = '${rosterJson}'::jsonb,
            transfer_budget = ${t.finalTransfer},
            salary_budget = ${t.finalSalary},
            budget = ${t.finalTransfer + t.finalSalary}
        WHERE id = cur_team_id;
    ELSE
        INSERT INTO public.teams (competition_id, owner_id, name, roster, transfer_budget, salary_budget, budget)
        VALUES (target_comp_id, admin_user_id, '${t.name}', '${rosterJson}'::jsonb, ${t.finalTransfer}, ${t.finalSalary}, ${t.finalTransfer + t.finalSalary})
        RETURNING id INTO cur_team_id;
    END IF;

    -- Formazione Giornata 1 per ${t.name}
    INSERT INTO public.lineups (competition_id, team_id, matchday, module, starters, bench, submitted_at)
    VALUES (target_comp_id, cur_team_id, 1, '4-3-3', '${startersJson}'::jsonb, '${benchJson}'::jsonb, now())
    ON CONFLICT (competition_id, team_id, matchday) DO UPDATE SET starters = EXCLUDED.starters, bench = EXCLUDED.bench;
`;
        } else {
            sql += `
    -- =====================================================================
    -- SQUADRA ${i + 1}: ${t.name} (${t.username})
    -- =====================================================================
    SELECT id INTO cur_user_id FROM auth.users WHERE email = '${t.email}' LIMIT 1;
    
    IF cur_user_id IS NULL THEN
        cur_user_id := gen_random_uuid();
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', cur_user_id, 'authenticated', 'authenticated',
            '${t.email}', encrypted_pw, now(),
            '{"provider":"email","providers":["email"]}', '{"username":"${t.username}"}', now(), now()
        );

        INSERT INTO auth.identities (
            provider_id, id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            cur_user_id::text, cur_user_id, cur_user_id, jsonb_build_object('sub', cur_user_id, 'email', '${t.email}'),
            'email', now(), now(), now()
        );

        INSERT INTO public.profiles (id, username)
        VALUES (cur_user_id, '${t.username}')
        ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username;
    END IF;

    -- Crea o aggiorna Team ${t.name}
    SELECT id INTO cur_team_id FROM public.teams WHERE competition_id = target_comp_id AND owner_id = cur_user_id LIMIT 1;
    
    IF cur_team_id IS NOT NULL THEN
        UPDATE public.teams
        SET name = '${t.name}',
            roster = '${rosterJson}'::jsonb,
            transfer_budget = ${t.finalTransfer},
            salary_budget = ${t.finalSalary},
            budget = ${t.finalTransfer + t.finalSalary}
        WHERE id = cur_team_id;
    ELSE
        INSERT INTO public.teams (competition_id, owner_id, name, roster, transfer_budget, salary_budget, budget)
        VALUES (target_comp_id, cur_user_id, '${t.name}', '${rosterJson}'::jsonb, ${t.finalTransfer}, ${t.finalSalary}, ${t.finalTransfer + t.finalSalary})
        RETURNING id INTO cur_team_id;
    END IF;

    -- Formazione Giornata 1 per ${t.name}
    INSERT INTO public.lineups (competition_id, team_id, matchday, module, starters, bench, submitted_at)
    VALUES (target_comp_id, cur_team_id, 1, '4-3-3', '${startersJson}'::jsonb, '${benchJson}'::jsonb, now())
    ON CONFLICT (competition_id, team_id, matchday) DO UPDATE SET starters = EXCLUDED.starters, bench = EXCLUDED.bench;
`;
        }
    }

    sql += `
    -- =====================================================================
    -- 3. CALENDARIO FIXTURES & CLASSIFICA
    -- =====================================================================
    -- Costruisci fixtures con gli ID reali generati
    DECLARE
        t_ids UUID[];
        t_count INT;
        sched_json JSONB;
        stand_json JSONB := '{}'::jsonb;
        tid UUID;
    BEGIN
        SELECT array_agg(id) INTO t_ids FROM public.teams WHERE competition_id = target_comp_id;
        t_count := array_length(t_ids, 1);

        FOREACH tid IN ARRAY t_ids
        LOOP
            stand_json := stand_json || jsonb_build_object(tid::text, jsonb_build_object('pts', 0, 'p', 0, 'w', 0, 'd', 0, 'l', 0, 'gf', 0, 'ga', 0));
        END LOOP;

        -- Round Robin 14 giornate
        sched_json := jsonb_build_array(
            jsonb_build_object('round', 1, 'matches', jsonb_build_array(
                jsonb_build_object('id', 'm_1_1', 'homeTeamId', t_ids[1], 'awayTeamId', t_ids[8], 'completed', false, 'result', null),
                jsonb_build_object('id', 'm_1_2', 'homeTeamId', t_ids[2], 'awayTeamId', t_ids[7], 'completed', false, 'result', null),
                jsonb_build_object('id', 'm_1_3', 'homeTeamId', t_ids[3], 'awayTeamId', t_ids[6], 'completed', false, 'result', null),
                jsonb_build_object('id', 'm_1_4', 'homeTeamId', t_ids[4], 'awayTeamId', t_ids[5], 'completed', false, 'result', null)
            )),
            jsonb_build_object('round', 2, 'matches', jsonb_build_array(
                jsonb_build_object('id', 'm_2_1', 'homeTeamId', t_ids[8], 'awayTeamId', t_ids[5], 'completed', false, 'result', null),
                jsonb_build_object('id', 'm_2_2', 'homeTeamId', t_ids[6], 'awayTeamId', t_ids[4], 'completed', false, 'result', null),
                jsonb_build_object('id', 'm_2_3', 'homeTeamId', t_ids[7], 'awayTeamId', t_ids[3], 'completed', false, 'result', null),
                jsonb_build_object('id', 'm_2_4', 'homeTeamId', t_ids[1], 'awayTeamId', t_ids[2], 'completed', false, 'result', null)
            )),
            jsonb_build_object('round', 3, 'matches', jsonb_build_array(
                jsonb_build_object('id', 'm_3_1', 'homeTeamId', t_ids[2], 'awayTeamId', t_ids[8], 'completed', false, 'result', null),
                jsonb_build_object('id', 'm_3_2', 'homeTeamId', t_ids[3], 'awayTeamId', t_ids[1], 'completed', false, 'result', null),
                jsonb_build_object('id', 'm_3_3', 'homeTeamId', t_ids[4], 'awayTeamId', t_ids[7], 'completed', false, 'result', null),
                jsonb_build_object('id', 'm_3_4', 'homeTeamId', t_ids[5], 'awayTeamId', t_ids[6], 'completed', false, 'result', null)
            )),
            jsonb_build_object('round', 4, 'matches', jsonb_build_array(
                jsonb_build_object('id', 'm_4_1', 'homeTeamId', t_ids[8], 'awayTeamId', t_ids[6], 'completed', false, 'result', null),
                jsonb_build_object('id', 'm_4_2', 'homeTeamId', t_ids[7], 'awayTeamId', t_ids[5], 'completed', false, 'result', null),
                jsonb_build_object('id', 'm_4_3', 'homeTeamId', t_ids[1], 'awayTeamId', t_ids[4], 'completed', false, 'result', null),
                jsonb_build_object('id', 'm_4_4', 'homeTeamId', t_ids[2], 'awayTeamId', t_ids[3], 'completed', false, 'result', null)
            )),
            jsonb_build_object('round', 5, 'matches', jsonb_build_array(
                jsonb_build_object('id', 'm_5_1', 'homeTeamId', t_ids[3], 'awayTeamId', t_ids[8], 'completed', false, 'result', null),
                jsonb_build_object('id', 'm_5_2', 'homeTeamId', t_ids[4], 'awayTeamId', t_ids[2], 'completed', false, 'result', null),
                jsonb_build_object('id', 'm_5_3', 'homeTeamId', t_ids[5], 'awayTeamId', t_ids[1], 'completed', false, 'result', null),
                jsonb_build_object('id', 'm_5_4', 'homeTeamId', t_ids[6], 'awayTeamId', t_ids[7], 'completed', false, 'result', null)
            )),
            jsonb_build_object('round', 6, 'matches', jsonb_build_array(
                jsonb_build_object('id', 'm_6_1', 'homeTeamId', t_ids[8], 'awayTeamId', t_ids[7], 'completed', false, 'result', null),
                jsonb_build_object('id', 'm_6_2', 'homeTeamId', t_ids[1], 'awayTeamId', t_ids[6], 'completed', false, 'result', null),
                jsonb_build_object('id', 'm_6_3', 'homeTeamId', t_ids[2], 'awayTeamId', t_ids[5], 'completed', false, 'result', null),
                jsonb_build_object('id', 'm_6_4', 'homeTeamId', t_ids[3], 'awayTeamId', t_ids[4], 'completed', false, 'result', null)
            )),
            jsonb_build_object('round', 7, 'matches', jsonb_build_array(
                jsonb_build_object('id', 'm_7_1', 'homeTeamId', t_ids[4], 'awayTeamId', t_ids[8], 'completed', false, 'result', null),
                jsonb_build_object('id', 'm_7_2', 'homeTeamId', t_ids[5], 'awayTeamId', t_ids[3], 'completed', false, 'result', null),
                jsonb_build_object('id', 'm_7_3', 'homeTeamId', t_ids[6], 'awayTeamId', t_ids[2], 'completed', false, 'result', null),
                jsonb_build_object('id', 'm_7_4', 'homeTeamId', t_ids[7], 'awayTeamId', t_ids[1], 'completed', false, 'result', null)
            ))
        );

        UPDATE public.competitions
        SET settings = jsonb_build_object(
            'fixtures', sched_json,
            'standings', stand_json,
            'currentMatchday', 1,
            'initialTransferBudget', 300,
            'initialSalaryBudget', 200,
            'salaryPercentage', 0.1,
            'lastRestoreYear', 2026
        )
        WHERE id = target_comp_id;
    END;

END $$;

NOTIFY pgrst, 'reload schema';
`;

    fs.writeFileSync(path.join(__dirname, 'sql_seed_8_teams.sql'), sql, 'utf8');
    console.log('✅ Generated robust sql_seed_8_teams.sql');
}

generateSQL();

