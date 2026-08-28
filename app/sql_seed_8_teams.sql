-- =========================================================================
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

    -- =====================================================================
    -- SQUADRA 1 (Admin): Aura FC
    -- =====================================================================
    SELECT id INTO cur_team_id FROM public.teams WHERE competition_id = target_comp_id AND name = 'Aura FC' LIMIT 1;
    
    IF cur_team_id IS NOT NULL THEN
        UPDATE public.teams
        SET roster = '[{"id":5135,"name":"Guaita","role":"POR","team":"Parma","value":3,"auctionPrice":5,"salary":0.3,"purchaseDate":"2026-08-28T16:11:20.848Z"},{"id":4236,"name":"Muric","role":"POR","team":"Sassuolo","value":11,"auctionPrice":11,"salary":1.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2211,"name":"Silvestri","role":"POR","team":"Cremonese","value":2,"auctionPrice":3,"salary":0.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6803,"name":"Rouhi","role":"DIF","team":"Juventus","value":1,"auctionPrice":1,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4374,"name":"Walukiewicz","role":"DIF","team":"Sassuolo","value":6,"auctionPrice":6,"salary":0.6,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6431,"name":"Paz Y.","role":"DIF","team":"Sassuolo","value":1,"auctionPrice":1,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2120,"name":"Bastoni","role":"DIF","team":"Inter","value":17,"auctionPrice":19,"salary":1.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6893,"name":"Kempf","role":"DIF","team":"Como","value":13,"auctionPrice":15,"salary":1.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6916,"name":"Ahanor","role":"DIF","team":"Atalanta","value":6,"auctionPrice":8,"salary":0.6,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7274,"name":"Zè Pedro","role":"DIF","team":"Cagliari","value":1,"auctionPrice":1,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5835,"name":"Baschirotto","role":"DIF","team":"Cremonese","value":12,"auctionPrice":13,"salary":1.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":27,"name":"Grassi","role":"CEN","team":"Cremonese","value":4,"auctionPrice":5,"salary":0.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4287,"name":"Lobotka","role":"CEN","team":"Napoli","value":7,"auctionPrice":7,"salary":0.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6908,"name":"Atta","role":"CEN","team":"Udinese","value":16,"auctionPrice":16,"salary":1.6,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":1976,"name":"Mazzitelli","role":"CEN","team":"Cagliari","value":7,"auctionPrice":8,"salary":0.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5844,"name":"Thorstvedt","role":"CEN","team":"Sassuolo","value":12,"auctionPrice":12,"salary":1.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6844,"name":"Rowe","role":"CEN","team":"Bologna","value":7,"auctionPrice":8,"salary":0.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5036,"name":"Caqueret","role":"CEN","team":"Como","value":10,"auctionPrice":10,"salary":1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":22,"name":"De Roon","role":"CEN","team":"Atalanta","value":8,"auctionPrice":8,"salary":0.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":531,"name":"Berardi","role":"ATT","team":"Sassuolo","value":21,"auctionPrice":24,"salary":2.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7199,"name":"Kilicsoy","role":"ATT","team":"Cagliari","value":11,"auctionPrice":11,"salary":1.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4730,"name":"Lookman","role":"ATT","team":"Atalanta","value":14,"auctionPrice":17,"salary":1.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6243,"name":"Borrelli","role":"ATT","team":"Cagliari","value":13,"auctionPrice":14,"salary":1.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2038,"name":"Pinamonti","role":"ATT","team":"Sassuolo","value":14,"auctionPrice":15,"salary":1.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7162,"name":"Giovane","role":"ATT","team":"Verona","value":17,"auctionPrice":19,"salary":1.7,"purchaseDate":"2026-08-28T16:11:20.850Z"}]'::jsonb,
            transfer_budget = 163,
            salary_budget = 176.6,
            budget = 339.6
        WHERE id = cur_team_id;
    ELSE
        INSERT INTO public.teams (competition_id, owner_id, name, roster, transfer_budget, salary_budget, budget)
        VALUES (target_comp_id, admin_user_id, 'Aura FC', '[{"id":5135,"name":"Guaita","role":"POR","team":"Parma","value":3,"auctionPrice":5,"salary":0.3,"purchaseDate":"2026-08-28T16:11:20.848Z"},{"id":4236,"name":"Muric","role":"POR","team":"Sassuolo","value":11,"auctionPrice":11,"salary":1.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2211,"name":"Silvestri","role":"POR","team":"Cremonese","value":2,"auctionPrice":3,"salary":0.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6803,"name":"Rouhi","role":"DIF","team":"Juventus","value":1,"auctionPrice":1,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4374,"name":"Walukiewicz","role":"DIF","team":"Sassuolo","value":6,"auctionPrice":6,"salary":0.6,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6431,"name":"Paz Y.","role":"DIF","team":"Sassuolo","value":1,"auctionPrice":1,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2120,"name":"Bastoni","role":"DIF","team":"Inter","value":17,"auctionPrice":19,"salary":1.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6893,"name":"Kempf","role":"DIF","team":"Como","value":13,"auctionPrice":15,"salary":1.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6916,"name":"Ahanor","role":"DIF","team":"Atalanta","value":6,"auctionPrice":8,"salary":0.6,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7274,"name":"Zè Pedro","role":"DIF","team":"Cagliari","value":1,"auctionPrice":1,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5835,"name":"Baschirotto","role":"DIF","team":"Cremonese","value":12,"auctionPrice":13,"salary":1.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":27,"name":"Grassi","role":"CEN","team":"Cremonese","value":4,"auctionPrice":5,"salary":0.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4287,"name":"Lobotka","role":"CEN","team":"Napoli","value":7,"auctionPrice":7,"salary":0.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6908,"name":"Atta","role":"CEN","team":"Udinese","value":16,"auctionPrice":16,"salary":1.6,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":1976,"name":"Mazzitelli","role":"CEN","team":"Cagliari","value":7,"auctionPrice":8,"salary":0.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5844,"name":"Thorstvedt","role":"CEN","team":"Sassuolo","value":12,"auctionPrice":12,"salary":1.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6844,"name":"Rowe","role":"CEN","team":"Bologna","value":7,"auctionPrice":8,"salary":0.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5036,"name":"Caqueret","role":"CEN","team":"Como","value":10,"auctionPrice":10,"salary":1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":22,"name":"De Roon","role":"CEN","team":"Atalanta","value":8,"auctionPrice":8,"salary":0.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":531,"name":"Berardi","role":"ATT","team":"Sassuolo","value":21,"auctionPrice":24,"salary":2.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7199,"name":"Kilicsoy","role":"ATT","team":"Cagliari","value":11,"auctionPrice":11,"salary":1.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4730,"name":"Lookman","role":"ATT","team":"Atalanta","value":14,"auctionPrice":17,"salary":1.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6243,"name":"Borrelli","role":"ATT","team":"Cagliari","value":13,"auctionPrice":14,"salary":1.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2038,"name":"Pinamonti","role":"ATT","team":"Sassuolo","value":14,"auctionPrice":15,"salary":1.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7162,"name":"Giovane","role":"ATT","team":"Verona","value":17,"auctionPrice":19,"salary":1.7,"purchaseDate":"2026-08-28T16:11:20.850Z"}]'::jsonb, 163, 176.6, 339.6)
        RETURNING id INTO cur_team_id;
    END IF;

    -- Formazione Giornata 1 per Aura FC
    INSERT INTO public.lineups (competition_id, team_id, matchday, module, starters, bench, submitted_at)
    VALUES (target_comp_id, cur_team_id, 1, '4-3-3', '[{"id":5135,"name":"Guaita","role":"POR","team":"Parma","value":3},{"id":6803,"name":"Rouhi","role":"DIF","team":"Juventus","value":1},{"id":4374,"name":"Walukiewicz","role":"DIF","team":"Sassuolo","value":6},{"id":6431,"name":"Paz Y.","role":"DIF","team":"Sassuolo","value":1},{"id":2120,"name":"Bastoni","role":"DIF","team":"Inter","value":17},{"id":27,"name":"Grassi","role":"CEN","team":"Cremonese","value":4},{"id":4287,"name":"Lobotka","role":"CEN","team":"Napoli","value":7},{"id":6908,"name":"Atta","role":"CEN","team":"Udinese","value":16},{"id":531,"name":"Berardi","role":"ATT","team":"Sassuolo","value":21},{"id":7199,"name":"Kilicsoy","role":"ATT","team":"Cagliari","value":11},{"id":4730,"name":"Lookman","role":"ATT","team":"Atalanta","value":14}]'::jsonb, '[{"id":4236,"name":"Muric","role":"POR","team":"Sassuolo","value":11},{"id":6893,"name":"Kempf","role":"DIF","team":"Como","value":13},{"id":6916,"name":"Ahanor","role":"DIF","team":"Atalanta","value":6},{"id":1976,"name":"Mazzitelli","role":"CEN","team":"Cagliari","value":7},{"id":5844,"name":"Thorstvedt","role":"CEN","team":"Sassuolo","value":12},{"id":6243,"name":"Borrelli","role":"ATT","team":"Cagliari","value":13},{"id":2038,"name":"Pinamonti","role":"ATT","team":"Sassuolo","value":14}]'::jsonb, now())
    ON CONFLICT (competition_id, team_id, matchday) DO UPDATE SET starters = EXCLUDED.starters, bench = EXCLUDED.bench;

    -- =====================================================================
    -- SQUADRA 2: Real Madrink (Madrink)
    -- =====================================================================
    SELECT id INTO cur_user_id FROM auth.users WHERE email = 'madrink@fantamanager.com' LIMIT 1;
    
    IF cur_user_id IS NULL THEN
        cur_user_id := gen_random_uuid();
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', cur_user_id, 'authenticated', 'authenticated',
            'madrink@fantamanager.com', encrypted_pw, now(),
            '{"provider":"email","providers":["email"]}', '{"username":"Madrink"}', now(), now()
        );

        INSERT INTO auth.identities (
            provider_id, id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            cur_user_id::text, cur_user_id, cur_user_id, jsonb_build_object('sub', cur_user_id, 'email', 'madrink@fantamanager.com'),
            'email', now(), now(), now()
        );

        INSERT INTO public.profiles (id, username)
        VALUES (cur_user_id, 'Madrink')
        ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username;
    END IF;

    -- Crea o aggiorna Team Real Madrink
    SELECT id INTO cur_team_id FROM public.teams WHERE competition_id = target_comp_id AND owner_id = cur_user_id LIMIT 1;
    
    IF cur_team_id IS NOT NULL THEN
        UPDATE public.teams
        SET name = 'Real Madrink',
            roster = '[{"id":6662,"name":"Corvi","role":"POR","team":"Parma","value":10,"auctionPrice":11,"salary":1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4,"name":"Sportiello","role":"POR","team":"Atalanta","value":1,"auctionPrice":3,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2861,"name":"Semper","role":"POR","team":"Pisa","value":10,"auctionPrice":11,"salary":1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6992,"name":"Oyegoke","role":"DIF","team":"Verona","value":1,"auctionPrice":4,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":294,"name":"Rugani","role":"DIF","team":"Juventus","value":2,"auctionPrice":5,"salary":0.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7175,"name":"Joao Mario","role":"DIF","team":"Juventus","value":2,"auctionPrice":3,"salary":0.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2728,"name":"Pellegrini Lu.","role":"DIF","team":"Lazio","value":6,"auctionPrice":7,"salary":0.6,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7156,"name":"Pieragnolo","role":"DIF","team":"Sassuolo","value":1,"auctionPrice":1,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6066,"name":"Posch","role":"DIF","team":"Como","value":9,"auctionPrice":12,"salary":0.9,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6496,"name":"Bartesaghi","role":"DIF","team":"Milan","value":14,"auctionPrice":15,"salary":1.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6870,"name":"Faye","role":"DIF","team":"Cremonese","value":2,"auctionPrice":2,"salary":0.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6020,"name":"Ellertsson","role":"CEN","team":"Genoa","value":10,"auctionPrice":13,"salary":1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":801,"name":"Gagliardini","role":"CEN","team":"Verona","value":7,"auctionPrice":8,"salary":0.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2766,"name":"Zaniolo","role":"CEN","team":"Udinese","value":21,"auctionPrice":22,"salary":2.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7028,"name":"Bernede","role":"CEN","team":"Verona","value":9,"auctionPrice":11,"salary":0.9,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5119,"name":"Samardzic","role":"CEN","team":"Atalanta","value":12,"auctionPrice":14,"salary":1.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6151,"name":"Perrone","role":"CEN","team":"Como","value":16,"auctionPrice":18,"salary":1.6,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2670,"name":"Bailey","role":"CEN","team":"Roma","value":8,"auctionPrice":10,"salary":0.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2606,"name":"Modric","role":"CEN","team":"Milan","value":20,"auctionPrice":20,"salary":2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6001,"name":"Banda","role":"ATT","team":"Lecce","value":12,"auctionPrice":12,"salary":1.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":309,"name":"Dybala","role":"ATT","team":"Roma","value":13,"auctionPrice":15,"salary":1.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6669,"name":"Bonny","role":"ATT","team":"Inter","value":13,"auctionPrice":13,"salary":1.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6435,"name":"Krstovic","role":"ATT","team":"Atalanta","value":18,"auctionPrice":20,"salary":1.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6675,"name":"Dovbyk","role":"ATT","team":"Roma","value":15,"auctionPrice":17,"salary":1.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5585,"name":"Malen","role":"ATT","team":"Roma","value":14,"auctionPrice":16,"salary":1.4,"purchaseDate":"2026-08-28T16:11:20.850Z"}]'::jsonb,
            transfer_budget = 137,
            salary_budget = 175.4,
            budget = 312.4
        WHERE id = cur_team_id;
    ELSE
        INSERT INTO public.teams (competition_id, owner_id, name, roster, transfer_budget, salary_budget, budget)
        VALUES (target_comp_id, cur_user_id, 'Real Madrink', '[{"id":6662,"name":"Corvi","role":"POR","team":"Parma","value":10,"auctionPrice":11,"salary":1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4,"name":"Sportiello","role":"POR","team":"Atalanta","value":1,"auctionPrice":3,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2861,"name":"Semper","role":"POR","team":"Pisa","value":10,"auctionPrice":11,"salary":1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6992,"name":"Oyegoke","role":"DIF","team":"Verona","value":1,"auctionPrice":4,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":294,"name":"Rugani","role":"DIF","team":"Juventus","value":2,"auctionPrice":5,"salary":0.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7175,"name":"Joao Mario","role":"DIF","team":"Juventus","value":2,"auctionPrice":3,"salary":0.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2728,"name":"Pellegrini Lu.","role":"DIF","team":"Lazio","value":6,"auctionPrice":7,"salary":0.6,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7156,"name":"Pieragnolo","role":"DIF","team":"Sassuolo","value":1,"auctionPrice":1,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6066,"name":"Posch","role":"DIF","team":"Como","value":9,"auctionPrice":12,"salary":0.9,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6496,"name":"Bartesaghi","role":"DIF","team":"Milan","value":14,"auctionPrice":15,"salary":1.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6870,"name":"Faye","role":"DIF","team":"Cremonese","value":2,"auctionPrice":2,"salary":0.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6020,"name":"Ellertsson","role":"CEN","team":"Genoa","value":10,"auctionPrice":13,"salary":1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":801,"name":"Gagliardini","role":"CEN","team":"Verona","value":7,"auctionPrice":8,"salary":0.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2766,"name":"Zaniolo","role":"CEN","team":"Udinese","value":21,"auctionPrice":22,"salary":2.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7028,"name":"Bernede","role":"CEN","team":"Verona","value":9,"auctionPrice":11,"salary":0.9,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5119,"name":"Samardzic","role":"CEN","team":"Atalanta","value":12,"auctionPrice":14,"salary":1.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6151,"name":"Perrone","role":"CEN","team":"Como","value":16,"auctionPrice":18,"salary":1.6,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2670,"name":"Bailey","role":"CEN","team":"Roma","value":8,"auctionPrice":10,"salary":0.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2606,"name":"Modric","role":"CEN","team":"Milan","value":20,"auctionPrice":20,"salary":2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6001,"name":"Banda","role":"ATT","team":"Lecce","value":12,"auctionPrice":12,"salary":1.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":309,"name":"Dybala","role":"ATT","team":"Roma","value":13,"auctionPrice":15,"salary":1.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6669,"name":"Bonny","role":"ATT","team":"Inter","value":13,"auctionPrice":13,"salary":1.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6435,"name":"Krstovic","role":"ATT","team":"Atalanta","value":18,"auctionPrice":20,"salary":1.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6675,"name":"Dovbyk","role":"ATT","team":"Roma","value":15,"auctionPrice":17,"salary":1.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5585,"name":"Malen","role":"ATT","team":"Roma","value":14,"auctionPrice":16,"salary":1.4,"purchaseDate":"2026-08-28T16:11:20.850Z"}]'::jsonb, 137, 175.4, 312.4)
        RETURNING id INTO cur_team_id;
    END IF;

    -- Formazione Giornata 1 per Real Madrink
    INSERT INTO public.lineups (competition_id, team_id, matchday, module, starters, bench, submitted_at)
    VALUES (target_comp_id, cur_team_id, 1, '4-3-3', '[{"id":6662,"name":"Corvi","role":"POR","team":"Parma","value":10},{"id":6992,"name":"Oyegoke","role":"DIF","team":"Verona","value":1},{"id":294,"name":"Rugani","role":"DIF","team":"Juventus","value":2},{"id":7175,"name":"Joao Mario","role":"DIF","team":"Juventus","value":2},{"id":2728,"name":"Pellegrini Lu.","role":"DIF","team":"Lazio","value":6},{"id":6020,"name":"Ellertsson","role":"CEN","team":"Genoa","value":10},{"id":801,"name":"Gagliardini","role":"CEN","team":"Verona","value":7},{"id":2766,"name":"Zaniolo","role":"CEN","team":"Udinese","value":21},{"id":6001,"name":"Banda","role":"ATT","team":"Lecce","value":12},{"id":309,"name":"Dybala","role":"ATT","team":"Roma","value":13},{"id":6669,"name":"Bonny","role":"ATT","team":"Inter","value":13}]'::jsonb, '[{"id":4,"name":"Sportiello","role":"POR","team":"Atalanta","value":1},{"id":7156,"name":"Pieragnolo","role":"DIF","team":"Sassuolo","value":1},{"id":6066,"name":"Posch","role":"DIF","team":"Como","value":9},{"id":7028,"name":"Bernede","role":"CEN","team":"Verona","value":9},{"id":5119,"name":"Samardzic","role":"CEN","team":"Atalanta","value":12},{"id":6435,"name":"Krstovic","role":"ATT","team":"Atalanta","value":18},{"id":6675,"name":"Dovbyk","role":"ATT","team":"Roma","value":15}]'::jsonb, now())
    ON CONFLICT (competition_id, team_id, matchday) DO UPDATE SET starters = EXCLUDED.starters, bench = EXCLUDED.bench;

    -- =====================================================================
    -- SQUADRA 3: Dinamo Losca (Losca)
    -- =====================================================================
    SELECT id INTO cur_user_id FROM auth.users WHERE email = 'losca@fantamanager.com' LIMIT 1;
    
    IF cur_user_id IS NULL THEN
        cur_user_id := gen_random_uuid();
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', cur_user_id, 'authenticated', 'authenticated',
            'losca@fantamanager.com', encrypted_pw, now(),
            '{"provider":"email","providers":["email"]}', '{"username":"Losca"}', now(), now()
        );

        INSERT INTO auth.identities (
            provider_id, id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            cur_user_id::text, cur_user_id, cur_user_id, jsonb_build_object('sub', cur_user_id, 'email', 'losca@fantamanager.com'),
            'email', now(), now(), now()
        );

        INSERT INTO public.profiles (id, username)
        VALUES (cur_user_id, 'Losca')
        ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username;
    END IF;

    -- Crea o aggiorna Team Dinamo Losca
    SELECT id INTO cur_team_id FROM public.teams WHERE competition_id = target_comp_id AND owner_id = cur_user_id LIMIT 1;
    
    IF cur_team_id IS NOT NULL THEN
        UPDATE public.teams
        SET name = 'Dinamo Losca',
            roster = '[{"id":5876,"name":"Di Gregorio","role":"POR","team":"Juventus","value":16,"auctionPrice":17,"salary":1.6,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2297,"name":"Rossi F.","role":"POR","team":"Atalanta","value":1,"auctionPrice":3,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":761,"name":"Audero","role":"POR","team":"Cremonese","value":15,"auctionPrice":17,"salary":1.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6537,"name":"Goglichidze","role":"DIF","team":"Udinese","value":2,"auctionPrice":4,"salary":0.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":327,"name":"Patric","role":"DIF","team":"Lazio","value":1,"auctionPrice":1,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7012,"name":"Provstgaard","role":"DIF","team":"Lazio","value":3,"auctionPrice":3,"salary":0.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7202,"name":"Ndiaye","role":"DIF","team":"Parma","value":1,"auctionPrice":2,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6351,"name":"Lamptey","role":"DIF","team":"Fiorentina","value":1,"auctionPrice":4,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4665,"name":"Maripan","role":"DIF","team":"Torino","value":12,"auctionPrice":14,"salary":1.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7011,"name":"Slotsager","role":"DIF","team":"Verona","value":1,"auctionPrice":1,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6977,"name":"Otoa","role":"DIF","team":"Genoa","value":3,"auctionPrice":3,"salary":0.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6684,"name":"Ekkelenkamp","role":"CEN","team":"Udinese","value":12,"auctionPrice":12,"salary":1.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7070,"name":"Sucic P.","role":"CEN","team":"Inter","value":12,"auctionPrice":12,"salary":1.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5318,"name":"Tramoni M.","role":"CEN","team":"Pisa","value":9,"auctionPrice":10,"salary":0.9,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2839,"name":"Sottil","role":"CEN","team":"Lecce","value":11,"auctionPrice":13,"salary":1.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":449,"name":"Vazquez","role":"CEN","team":"Cremonese","value":14,"auctionPrice":14,"salary":1.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5422,"name":"Zalewski","role":"CEN","team":"Atalanta","value":15,"auctionPrice":18,"salary":1.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4404,"name":"Thorsby","role":"CEN","team":"Genoa","value":15,"auctionPrice":15,"salary":1.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":795,"name":"El Shaarawy","role":"CEN","team":"Roma","value":8,"auctionPrice":8,"salary":0.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":505,"name":"Bonazzoli","role":"ATT","team":"Cremonese","value":20,"auctionPrice":21,"salary":2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7071,"name":"Esposito F.P.","role":"ATT","team":"Inter","value":15,"auctionPrice":15,"salary":1.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7023,"name":"Pellegrino M.","role":"ATT","team":"Parma","value":22,"auctionPrice":24,"salary":2.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2499,"name":"Vardy","role":"ATT","team":"Cremonese","value":20,"auctionPrice":22,"salary":2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7127,"name":"Addai","role":"ATT","team":"Como","value":12,"auctionPrice":14,"salary":1.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4436,"name":"Cambiaghi","role":"ATT","team":"Bologna","value":18,"auctionPrice":20,"salary":1.8,"purchaseDate":"2026-08-28T16:11:20.850Z"}]'::jsonb,
            transfer_budget = 133,
            salary_budget = 174.1,
            budget = 307.1
        WHERE id = cur_team_id;
    ELSE
        INSERT INTO public.teams (competition_id, owner_id, name, roster, transfer_budget, salary_budget, budget)
        VALUES (target_comp_id, cur_user_id, 'Dinamo Losca', '[{"id":5876,"name":"Di Gregorio","role":"POR","team":"Juventus","value":16,"auctionPrice":17,"salary":1.6,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2297,"name":"Rossi F.","role":"POR","team":"Atalanta","value":1,"auctionPrice":3,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":761,"name":"Audero","role":"POR","team":"Cremonese","value":15,"auctionPrice":17,"salary":1.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6537,"name":"Goglichidze","role":"DIF","team":"Udinese","value":2,"auctionPrice":4,"salary":0.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":327,"name":"Patric","role":"DIF","team":"Lazio","value":1,"auctionPrice":1,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7012,"name":"Provstgaard","role":"DIF","team":"Lazio","value":3,"auctionPrice":3,"salary":0.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7202,"name":"Ndiaye","role":"DIF","team":"Parma","value":1,"auctionPrice":2,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6351,"name":"Lamptey","role":"DIF","team":"Fiorentina","value":1,"auctionPrice":4,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4665,"name":"Maripan","role":"DIF","team":"Torino","value":12,"auctionPrice":14,"salary":1.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7011,"name":"Slotsager","role":"DIF","team":"Verona","value":1,"auctionPrice":1,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6977,"name":"Otoa","role":"DIF","team":"Genoa","value":3,"auctionPrice":3,"salary":0.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6684,"name":"Ekkelenkamp","role":"CEN","team":"Udinese","value":12,"auctionPrice":12,"salary":1.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7070,"name":"Sucic P.","role":"CEN","team":"Inter","value":12,"auctionPrice":12,"salary":1.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5318,"name":"Tramoni M.","role":"CEN","team":"Pisa","value":9,"auctionPrice":10,"salary":0.9,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2839,"name":"Sottil","role":"CEN","team":"Lecce","value":11,"auctionPrice":13,"salary":1.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":449,"name":"Vazquez","role":"CEN","team":"Cremonese","value":14,"auctionPrice":14,"salary":1.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5422,"name":"Zalewski","role":"CEN","team":"Atalanta","value":15,"auctionPrice":18,"salary":1.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4404,"name":"Thorsby","role":"CEN","team":"Genoa","value":15,"auctionPrice":15,"salary":1.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":795,"name":"El Shaarawy","role":"CEN","team":"Roma","value":8,"auctionPrice":8,"salary":0.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":505,"name":"Bonazzoli","role":"ATT","team":"Cremonese","value":20,"auctionPrice":21,"salary":2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7071,"name":"Esposito F.P.","role":"ATT","team":"Inter","value":15,"auctionPrice":15,"salary":1.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7023,"name":"Pellegrino M.","role":"ATT","team":"Parma","value":22,"auctionPrice":24,"salary":2.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2499,"name":"Vardy","role":"ATT","team":"Cremonese","value":20,"auctionPrice":22,"salary":2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7127,"name":"Addai","role":"ATT","team":"Como","value":12,"auctionPrice":14,"salary":1.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4436,"name":"Cambiaghi","role":"ATT","team":"Bologna","value":18,"auctionPrice":20,"salary":1.8,"purchaseDate":"2026-08-28T16:11:20.850Z"}]'::jsonb, 133, 174.1, 307.1)
        RETURNING id INTO cur_team_id;
    END IF;

    -- Formazione Giornata 1 per Dinamo Losca
    INSERT INTO public.lineups (competition_id, team_id, matchday, module, starters, bench, submitted_at)
    VALUES (target_comp_id, cur_team_id, 1, '4-3-3', '[{"id":5876,"name":"Di Gregorio","role":"POR","team":"Juventus","value":16},{"id":6537,"name":"Goglichidze","role":"DIF","team":"Udinese","value":2},{"id":327,"name":"Patric","role":"DIF","team":"Lazio","value":1},{"id":7012,"name":"Provstgaard","role":"DIF","team":"Lazio","value":3},{"id":7202,"name":"Ndiaye","role":"DIF","team":"Parma","value":1},{"id":6684,"name":"Ekkelenkamp","role":"CEN","team":"Udinese","value":12},{"id":7070,"name":"Sucic P.","role":"CEN","team":"Inter","value":12},{"id":5318,"name":"Tramoni M.","role":"CEN","team":"Pisa","value":9},{"id":505,"name":"Bonazzoli","role":"ATT","team":"Cremonese","value":20},{"id":7071,"name":"Esposito F.P.","role":"ATT","team":"Inter","value":15},{"id":7023,"name":"Pellegrino M.","role":"ATT","team":"Parma","value":22}]'::jsonb, '[{"id":2297,"name":"Rossi F.","role":"POR","team":"Atalanta","value":1},{"id":6351,"name":"Lamptey","role":"DIF","team":"Fiorentina","value":1},{"id":4665,"name":"Maripan","role":"DIF","team":"Torino","value":12},{"id":2839,"name":"Sottil","role":"CEN","team":"Lecce","value":11},{"id":449,"name":"Vazquez","role":"CEN","team":"Cremonese","value":14},{"id":2499,"name":"Vardy","role":"ATT","team":"Cremonese","value":20},{"id":7127,"name":"Addai","role":"ATT","team":"Como","value":12}]'::jsonb, now())
    ON CONFLICT (competition_id, team_id, matchday) DO UPDATE SET starters = EXCLUDED.starters, bench = EXCLUDED.bench;

    -- =====================================================================
    -- SQUADRA 4: Aston Birra (Birra)
    -- =====================================================================
    SELECT id INTO cur_user_id FROM auth.users WHERE email = 'birra@fantamanager.com' LIMIT 1;
    
    IF cur_user_id IS NULL THEN
        cur_user_id := gen_random_uuid();
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', cur_user_id, 'authenticated', 'authenticated',
            'birra@fantamanager.com', encrypted_pw, now(),
            '{"provider":"email","providers":["email"]}', '{"username":"Birra"}', now(), now()
        );

        INSERT INTO auth.identities (
            provider_id, id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            cur_user_id::text, cur_user_id, cur_user_id, jsonb_build_object('sub', cur_user_id, 'email', 'birra@fantamanager.com'),
            'email', now(), now(), now()
        );

        INSERT INTO public.profiles (id, username)
        VALUES (cur_user_id, 'Birra')
        ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username;
    END IF;

    -- Crea o aggiorna Team Aston Birra
    SELECT id INTO cur_team_id FROM public.teams WHERE competition_id = target_comp_id AND owner_id = cur_user_id LIMIT 1;
    
    IF cur_team_id IS NOT NULL THEN
        UPDATE public.teams
        SET name = 'Aston Birra',
            roster = '[{"id":4312,"name":"Maignan","role":"POR","team":"Milan","value":19,"auctionPrice":20,"salary":1.9,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4431,"name":"Carnesecchi","role":"POR","team":"Atalanta","value":17,"auctionPrice":17,"salary":1.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5841,"name":"Svilar","role":"POR","team":"Roma","value":19,"auctionPrice":19,"salary":1.9,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":252,"name":"Biraghi","role":"DIF","team":"Torino","value":3,"auctionPrice":6,"salary":0.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7268,"name":"Rodriguez Ju.","role":"DIF","team":"Cagliari","value":3,"auctionPrice":6,"salary":0.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5851,"name":"Doig","role":"DIF","team":"Sassuolo","value":5,"auctionPrice":7,"salary":0.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7222,"name":"Cham","role":"DIF","team":"Verona","value":2,"auctionPrice":5,"salary":0.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7142,"name":"Esteves T.","role":"DIF","team":"Pisa","value":1,"auctionPrice":1,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7260,"name":"Ziolkowski","role":"DIF","team":"Roma","value":4,"auctionPrice":5,"salary":0.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2273,"name":"Caracciolo A.","role":"DIF","team":"Pisa","value":6,"auctionPrice":9,"salary":0.6,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5701,"name":"Obert","role":"DIF","team":"Cagliari","value":5,"auctionPrice":8,"salary":0.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":333,"name":"Cataldi","role":"CEN","team":"Lazio","value":13,"auctionPrice":15,"salary":1.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5559,"name":"Da Cunha","role":"CEN","team":"Como","value":10,"auctionPrice":13,"salary":1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":530,"name":"Pellegrini Lo.","role":"CEN","team":"Roma","value":15,"auctionPrice":16,"salary":1.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4686,"name":"Fofana Y.","role":"CEN","team":"Milan","value":11,"auctionPrice":13,"salary":1.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2379,"name":"Rabiot","role":"CEN","team":"Milan","value":20,"auctionPrice":22,"salary":2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":827,"name":"Locatelli","role":"CEN","team":"Juventus","value":13,"auctionPrice":15,"salary":1.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6424,"name":"Prati","role":"CEN","team":"Cagliari","value":7,"auctionPrice":9,"salary":0.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2517,"name":"De Bruyne","role":"CEN","team":"Napoli","value":22,"auctionPrice":24,"salary":2.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6434,"name":"Yildiz","role":"ATT","team":"Juventus","value":30,"auctionPrice":30,"salary":3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6060,"name":"Laurientè","role":"ATT","team":"Sassuolo","value":19,"auctionPrice":21,"salary":1.9,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7313,"name":"Ratkov","role":"ATT","team":"Lazio","value":15,"auctionPrice":15,"salary":1.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2678,"name":"Fullkrug","role":"ATT","team":"Milan","value":13,"auctionPrice":16,"salary":1.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5637,"name":"Davis K.","role":"ATT","team":"Udinese","value":24,"auctionPrice":27,"salary":2.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6556,"name":"Noslin","role":"ATT","team":"Lazio","value":12,"auctionPrice":12,"salary":1.2,"purchaseDate":"2026-08-28T16:11:20.850Z"}]'::jsonb,
            transfer_budget = 69,
            salary_budget = 169.2,
            budget = 238.2
        WHERE id = cur_team_id;
    ELSE
        INSERT INTO public.teams (competition_id, owner_id, name, roster, transfer_budget, salary_budget, budget)
        VALUES (target_comp_id, cur_user_id, 'Aston Birra', '[{"id":4312,"name":"Maignan","role":"POR","team":"Milan","value":19,"auctionPrice":20,"salary":1.9,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4431,"name":"Carnesecchi","role":"POR","team":"Atalanta","value":17,"auctionPrice":17,"salary":1.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5841,"name":"Svilar","role":"POR","team":"Roma","value":19,"auctionPrice":19,"salary":1.9,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":252,"name":"Biraghi","role":"DIF","team":"Torino","value":3,"auctionPrice":6,"salary":0.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7268,"name":"Rodriguez Ju.","role":"DIF","team":"Cagliari","value":3,"auctionPrice":6,"salary":0.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5851,"name":"Doig","role":"DIF","team":"Sassuolo","value":5,"auctionPrice":7,"salary":0.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7222,"name":"Cham","role":"DIF","team":"Verona","value":2,"auctionPrice":5,"salary":0.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7142,"name":"Esteves T.","role":"DIF","team":"Pisa","value":1,"auctionPrice":1,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7260,"name":"Ziolkowski","role":"DIF","team":"Roma","value":4,"auctionPrice":5,"salary":0.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2273,"name":"Caracciolo A.","role":"DIF","team":"Pisa","value":6,"auctionPrice":9,"salary":0.6,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5701,"name":"Obert","role":"DIF","team":"Cagliari","value":5,"auctionPrice":8,"salary":0.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":333,"name":"Cataldi","role":"CEN","team":"Lazio","value":13,"auctionPrice":15,"salary":1.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5559,"name":"Da Cunha","role":"CEN","team":"Como","value":10,"auctionPrice":13,"salary":1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":530,"name":"Pellegrini Lo.","role":"CEN","team":"Roma","value":15,"auctionPrice":16,"salary":1.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4686,"name":"Fofana Y.","role":"CEN","team":"Milan","value":11,"auctionPrice":13,"salary":1.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2379,"name":"Rabiot","role":"CEN","team":"Milan","value":20,"auctionPrice":22,"salary":2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":827,"name":"Locatelli","role":"CEN","team":"Juventus","value":13,"auctionPrice":15,"salary":1.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6424,"name":"Prati","role":"CEN","team":"Cagliari","value":7,"auctionPrice":9,"salary":0.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2517,"name":"De Bruyne","role":"CEN","team":"Napoli","value":22,"auctionPrice":24,"salary":2.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6434,"name":"Yildiz","role":"ATT","team":"Juventus","value":30,"auctionPrice":30,"salary":3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6060,"name":"Laurientè","role":"ATT","team":"Sassuolo","value":19,"auctionPrice":21,"salary":1.9,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7313,"name":"Ratkov","role":"ATT","team":"Lazio","value":15,"auctionPrice":15,"salary":1.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2678,"name":"Fullkrug","role":"ATT","team":"Milan","value":13,"auctionPrice":16,"salary":1.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5637,"name":"Davis K.","role":"ATT","team":"Udinese","value":24,"auctionPrice":27,"salary":2.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6556,"name":"Noslin","role":"ATT","team":"Lazio","value":12,"auctionPrice":12,"salary":1.2,"purchaseDate":"2026-08-28T16:11:20.850Z"}]'::jsonb, 69, 169.2, 238.2)
        RETURNING id INTO cur_team_id;
    END IF;

    -- Formazione Giornata 1 per Aston Birra
    INSERT INTO public.lineups (competition_id, team_id, matchday, module, starters, bench, submitted_at)
    VALUES (target_comp_id, cur_team_id, 1, '4-3-3', '[{"id":4312,"name":"Maignan","role":"POR","team":"Milan","value":19},{"id":252,"name":"Biraghi","role":"DIF","team":"Torino","value":3},{"id":7268,"name":"Rodriguez Ju.","role":"DIF","team":"Cagliari","value":3},{"id":5851,"name":"Doig","role":"DIF","team":"Sassuolo","value":5},{"id":7222,"name":"Cham","role":"DIF","team":"Verona","value":2},{"id":333,"name":"Cataldi","role":"CEN","team":"Lazio","value":13},{"id":5559,"name":"Da Cunha","role":"CEN","team":"Como","value":10},{"id":530,"name":"Pellegrini Lo.","role":"CEN","team":"Roma","value":15},{"id":6434,"name":"Yildiz","role":"ATT","team":"Juventus","value":30},{"id":6060,"name":"Laurientè","role":"ATT","team":"Sassuolo","value":19},{"id":7313,"name":"Ratkov","role":"ATT","team":"Lazio","value":15}]'::jsonb, '[{"id":4431,"name":"Carnesecchi","role":"POR","team":"Atalanta","value":17},{"id":7142,"name":"Esteves T.","role":"DIF","team":"Pisa","value":1},{"id":7260,"name":"Ziolkowski","role":"DIF","team":"Roma","value":4},{"id":4686,"name":"Fofana Y.","role":"CEN","team":"Milan","value":11},{"id":2379,"name":"Rabiot","role":"CEN","team":"Milan","value":20},{"id":2678,"name":"Fullkrug","role":"ATT","team":"Milan","value":13},{"id":5637,"name":"Davis K.","role":"ATT","team":"Udinese","value":24}]'::jsonb, now())
    ON CONFLICT (competition_id, team_id, matchday) DO UPDATE SET starters = EXCLUDED.starters, bench = EXCLUDED.bench;

    -- =====================================================================
    -- SQUADRA 5: Paris Saint-Gennar (Gennar)
    -- =====================================================================
    SELECT id INTO cur_user_id FROM auth.users WHERE email = 'gennar@fantamanager.com' LIMIT 1;
    
    IF cur_user_id IS NULL THEN
        cur_user_id := gen_random_uuid();
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', cur_user_id, 'authenticated', 'authenticated',
            'gennar@fantamanager.com', encrypted_pw, now(),
            '{"provider":"email","providers":["email"]}', '{"username":"Gennar"}', now(), now()
        );

        INSERT INTO auth.identities (
            provider_id, id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            cur_user_id::text, cur_user_id, cur_user_id, jsonb_build_object('sub', cur_user_id, 'email', 'gennar@fantamanager.com'),
            'email', now(), now(), now()
        );

        INSERT INTO public.profiles (id, username)
        VALUES (cur_user_id, 'Gennar')
        ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username;
    END IF;

    -- Crea o aggiorna Team Paris Saint-Gennar
    SELECT id INTO cur_team_id FROM public.teams WHERE competition_id = target_comp_id AND owner_id = cur_user_id LIMIT 1;
    
    IF cur_team_id IS NOT NULL THEN
        UPDATE public.teams
        SET name = 'Paris Saint-Gennar',
            roster = '[{"id":2722,"name":"Ravaglia F.","role":"POR","team":"Bologna","value":11,"auctionPrice":12,"salary":1.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":543,"name":"Padelli","role":"POR","team":"Udinese","value":4,"auctionPrice":6,"salary":0.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4360,"name":"Caprile","role":"POR","team":"Cagliari","value":11,"auctionPrice":13,"salary":1.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5812,"name":"Terracciano F.","role":"DIF","team":"Cremonese","value":11,"auctionPrice":13,"salary":1.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6832,"name":"Palestra","role":"DIF","team":"Cagliari","value":15,"auctionPrice":17,"salary":1.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":791,"name":"Sabelli","role":"DIF","team":"Genoa","value":1,"auctionPrice":1,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6046,"name":"Hien","role":"DIF","team":"Atalanta","value":7,"auctionPrice":8,"salary":0.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6900,"name":"Rui Modesto","role":"DIF","team":"Udinese","value":1,"auctionPrice":4,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7143,"name":"Angori","role":"DIF","team":"Pisa","value":9,"auctionPrice":11,"salary":0.9,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":322,"name":"De Vrij","role":"DIF","team":"Inter","value":4,"auctionPrice":5,"salary":0.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2188,"name":"Marusic","role":"DIF","team":"Lazio","value":8,"auctionPrice":9,"salary":0.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":632,"name":"Zaccagni","role":"CEN","team":"Lazio","value":16,"auctionPrice":16,"salary":1.6,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7209,"name":"Sorensen O.","role":"CEN","team":"Parma","value":7,"auctionPrice":10,"salary":0.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2423,"name":"Pulisic","role":"CEN","team":"Milan","value":32,"auctionPrice":35,"salary":3.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5791,"name":"Frendrup","role":"CEN","team":"Genoa","value":9,"auctionPrice":9,"salary":0.9,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4892,"name":"Saelemaekers","role":"CEN","team":"Milan","value":19,"auctionPrice":20,"salary":1.9,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5562,"name":"Thuram K.","role":"CEN","team":"Juventus","value":14,"auctionPrice":17,"salary":1.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5888,"name":"Casadei","role":"CEN","team":"Torino","value":8,"auctionPrice":9,"salary":0.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4973,"name":"McKennie","role":"CEN","team":"Juventus","value":14,"auctionPrice":14,"salary":1.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5500,"name":"Cancellieri","role":"ATT","team":"Lazio","value":14,"auctionPrice":17,"salary":1.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4371,"name":"Raspadori","role":"ATT","team":"Atalanta","value":15,"auctionPrice":16,"salary":1.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4871,"name":"Thuram","role":"ATT","team":"Inter","value":31,"auctionPrice":33,"salary":3.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2061,"name":"Simeone","role":"ATT","team":"Torino","value":20,"auctionPrice":21,"salary":2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4923,"name":"Colombo","role":"ATT","team":"Genoa","value":14,"auctionPrice":17,"salary":1.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4510,"name":"Leao","role":"ATT","team":"Milan","value":30,"auctionPrice":31,"salary":3,"purchaseDate":"2026-08-28T16:11:20.850Z"}]'::jsonb,
            transfer_budget = 56,
            salary_budget = 167.5,
            budget = 223.5
        WHERE id = cur_team_id;
    ELSE
        INSERT INTO public.teams (competition_id, owner_id, name, roster, transfer_budget, salary_budget, budget)
        VALUES (target_comp_id, cur_user_id, 'Paris Saint-Gennar', '[{"id":2722,"name":"Ravaglia F.","role":"POR","team":"Bologna","value":11,"auctionPrice":12,"salary":1.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":543,"name":"Padelli","role":"POR","team":"Udinese","value":4,"auctionPrice":6,"salary":0.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4360,"name":"Caprile","role":"POR","team":"Cagliari","value":11,"auctionPrice":13,"salary":1.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5812,"name":"Terracciano F.","role":"DIF","team":"Cremonese","value":11,"auctionPrice":13,"salary":1.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6832,"name":"Palestra","role":"DIF","team":"Cagliari","value":15,"auctionPrice":17,"salary":1.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":791,"name":"Sabelli","role":"DIF","team":"Genoa","value":1,"auctionPrice":1,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6046,"name":"Hien","role":"DIF","team":"Atalanta","value":7,"auctionPrice":8,"salary":0.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6900,"name":"Rui Modesto","role":"DIF","team":"Udinese","value":1,"auctionPrice":4,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7143,"name":"Angori","role":"DIF","team":"Pisa","value":9,"auctionPrice":11,"salary":0.9,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":322,"name":"De Vrij","role":"DIF","team":"Inter","value":4,"auctionPrice":5,"salary":0.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2188,"name":"Marusic","role":"DIF","team":"Lazio","value":8,"auctionPrice":9,"salary":0.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":632,"name":"Zaccagni","role":"CEN","team":"Lazio","value":16,"auctionPrice":16,"salary":1.6,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7209,"name":"Sorensen O.","role":"CEN","team":"Parma","value":7,"auctionPrice":10,"salary":0.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2423,"name":"Pulisic","role":"CEN","team":"Milan","value":32,"auctionPrice":35,"salary":3.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5791,"name":"Frendrup","role":"CEN","team":"Genoa","value":9,"auctionPrice":9,"salary":0.9,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4892,"name":"Saelemaekers","role":"CEN","team":"Milan","value":19,"auctionPrice":20,"salary":1.9,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5562,"name":"Thuram K.","role":"CEN","team":"Juventus","value":14,"auctionPrice":17,"salary":1.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5888,"name":"Casadei","role":"CEN","team":"Torino","value":8,"auctionPrice":9,"salary":0.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4973,"name":"McKennie","role":"CEN","team":"Juventus","value":14,"auctionPrice":14,"salary":1.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5500,"name":"Cancellieri","role":"ATT","team":"Lazio","value":14,"auctionPrice":17,"salary":1.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4371,"name":"Raspadori","role":"ATT","team":"Atalanta","value":15,"auctionPrice":16,"salary":1.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4871,"name":"Thuram","role":"ATT","team":"Inter","value":31,"auctionPrice":33,"salary":3.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2061,"name":"Simeone","role":"ATT","team":"Torino","value":20,"auctionPrice":21,"salary":2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4923,"name":"Colombo","role":"ATT","team":"Genoa","value":14,"auctionPrice":17,"salary":1.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4510,"name":"Leao","role":"ATT","team":"Milan","value":30,"auctionPrice":31,"salary":3,"purchaseDate":"2026-08-28T16:11:20.850Z"}]'::jsonb, 56, 167.5, 223.5)
        RETURNING id INTO cur_team_id;
    END IF;

    -- Formazione Giornata 1 per Paris Saint-Gennar
    INSERT INTO public.lineups (competition_id, team_id, matchday, module, starters, bench, submitted_at)
    VALUES (target_comp_id, cur_team_id, 1, '4-3-3', '[{"id":2722,"name":"Ravaglia F.","role":"POR","team":"Bologna","value":11},{"id":5812,"name":"Terracciano F.","role":"DIF","team":"Cremonese","value":11},{"id":6832,"name":"Palestra","role":"DIF","team":"Cagliari","value":15},{"id":791,"name":"Sabelli","role":"DIF","team":"Genoa","value":1},{"id":6046,"name":"Hien","role":"DIF","team":"Atalanta","value":7},{"id":632,"name":"Zaccagni","role":"CEN","team":"Lazio","value":16},{"id":7209,"name":"Sorensen O.","role":"CEN","team":"Parma","value":7},{"id":2423,"name":"Pulisic","role":"CEN","team":"Milan","value":32},{"id":5500,"name":"Cancellieri","role":"ATT","team":"Lazio","value":14},{"id":4371,"name":"Raspadori","role":"ATT","team":"Atalanta","value":15},{"id":4871,"name":"Thuram","role":"ATT","team":"Inter","value":31}]'::jsonb, '[{"id":543,"name":"Padelli","role":"POR","team":"Udinese","value":4},{"id":6900,"name":"Rui Modesto","role":"DIF","team":"Udinese","value":1},{"id":7143,"name":"Angori","role":"DIF","team":"Pisa","value":9},{"id":5791,"name":"Frendrup","role":"CEN","team":"Genoa","value":9},{"id":4892,"name":"Saelemaekers","role":"CEN","team":"Milan","value":19},{"id":2061,"name":"Simeone","role":"ATT","team":"Torino","value":20},{"id":4923,"name":"Colombo","role":"ATT","team":"Genoa","value":14}]'::jsonb, now())
    ON CONFLICT (competition_id, team_id, matchday) DO UPDATE SET starters = EXCLUDED.starters, bench = EXCLUDED.bench;

    -- =====================================================================
    -- SQUADRA 6: Borussia Porkmund (Porkmund)
    -- =====================================================================
    SELECT id INTO cur_user_id FROM auth.users WHERE email = 'porkmund@fantamanager.com' LIMIT 1;
    
    IF cur_user_id IS NULL THEN
        cur_user_id := gen_random_uuid();
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', cur_user_id, 'authenticated', 'authenticated',
            'porkmund@fantamanager.com', encrypted_pw, now(),
            '{"provider":"email","providers":["email"]}', '{"username":"Porkmund"}', now(), now()
        );

        INSERT INTO auth.identities (
            provider_id, id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            cur_user_id::text, cur_user_id, cur_user_id, jsonb_build_object('sub', cur_user_id, 'email', 'porkmund@fantamanager.com'),
            'email', now(), now(), now()
        );

        INSERT INTO public.profiles (id, username)
        VALUES (cur_user_id, 'Porkmund')
        ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username;
    END IF;

    -- Crea o aggiorna Team Borussia Porkmund
    SELECT id INTO cur_team_id FROM public.teams WHERE competition_id = target_comp_id AND owner_id = cur_user_id LIMIT 1;
    
    IF cur_team_id IS NOT NULL THEN
        UPDATE public.teams
        SET name = 'Borussia Porkmund',
            roster = '[{"id":6641,"name":"Suzuki","role":"POR","team":"Parma","value":9,"auctionPrice":11,"salary":0.9,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4957,"name":"Montipò","role":"POR","team":"Verona","value":10,"auctionPrice":13,"salary":1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":218,"name":"Perin","role":"POR","team":"Juventus","value":2,"auctionPrice":5,"salary":0.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6632,"name":"Gaspar K.","role":"DIF","team":"Lecce","value":5,"auctionPrice":8,"salary":0.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":49,"name":"Masina","role":"DIF","team":"Torino","value":2,"auctionPrice":3,"salary":0.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2296,"name":"Mancini","role":"DIF","team":"Roma","value":10,"auctionPrice":11,"salary":1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2640,"name":"Kolasinac","role":"DIF","team":"Atalanta","value":5,"auctionPrice":5,"salary":0.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7181,"name":"Wesley","role":"DIF","team":"Roma","value":16,"auctionPrice":17,"salary":1.6,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2263,"name":"Lazzari","role":"DIF","team":"Lazio","value":4,"auctionPrice":6,"salary":0.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5994,"name":"Ebosse","role":"DIF","team":"Verona","value":1,"auctionPrice":3,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4433,"name":"Zortea","role":"DIF","team":"Bologna","value":8,"auctionPrice":11,"salary":0.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4947,"name":"Brescianini","role":"CEN","team":"Fiorentina","value":7,"auctionPrice":7,"salary":0.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2765,"name":"Odgaard","role":"CEN","team":"Bologna","value":18,"auctionPrice":21,"salary":1.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6252,"name":"Folorunsho","role":"CEN","team":"Cagliari","value":9,"auctionPrice":12,"salary":0.9,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4364,"name":"Gaetano","role":"CEN","team":"Cagliari","value":13,"auctionPrice":15,"salary":1.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6815,"name":"Fadera","role":"CEN","team":"Sassuolo","value":10,"auctionPrice":10,"salary":1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4465,"name":"Fagioli","role":"CEN","team":"Fiorentina","value":8,"auctionPrice":9,"salary":0.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2077,"name":"Pasalic","role":"CEN","team":"Atalanta","value":13,"auctionPrice":14,"salary":1.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4711,"name":"Kostic","role":"CEN","team":"Juventus","value":11,"auctionPrice":14,"salary":1.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7017,"name":"Douvikas","role":"ATT","team":"Como","value":22,"auctionPrice":23,"salary":2.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2841,"name":"Vlahovic","role":"ATT","team":"Juventus","value":16,"auctionPrice":18,"salary":1.6,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7001,"name":"N''''Dri","role":"ATT","team":"Lecce","value":11,"auctionPrice":13,"salary":1.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4463,"name":"Esposito Se.","role":"ATT","team":"Cagliari","value":17,"auctionPrice":18,"salary":1.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5455,"name":"Moreo","role":"ATT","team":"Pisa","value":15,"auctionPrice":15,"salary":1.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2137,"name":"Scamacca","role":"ATT","team":"Atalanta","value":22,"auctionPrice":24,"salary":2.2,"purchaseDate":"2026-08-28T16:11:20.850Z"}]'::jsonb,
            transfer_budget = 114,
            salary_budget = 173.6,
            budget = 287.6
        WHERE id = cur_team_id;
    ELSE
        INSERT INTO public.teams (competition_id, owner_id, name, roster, transfer_budget, salary_budget, budget)
        VALUES (target_comp_id, cur_user_id, 'Borussia Porkmund', '[{"id":6641,"name":"Suzuki","role":"POR","team":"Parma","value":9,"auctionPrice":11,"salary":0.9,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4957,"name":"Montipò","role":"POR","team":"Verona","value":10,"auctionPrice":13,"salary":1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":218,"name":"Perin","role":"POR","team":"Juventus","value":2,"auctionPrice":5,"salary":0.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6632,"name":"Gaspar K.","role":"DIF","team":"Lecce","value":5,"auctionPrice":8,"salary":0.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":49,"name":"Masina","role":"DIF","team":"Torino","value":2,"auctionPrice":3,"salary":0.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2296,"name":"Mancini","role":"DIF","team":"Roma","value":10,"auctionPrice":11,"salary":1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2640,"name":"Kolasinac","role":"DIF","team":"Atalanta","value":5,"auctionPrice":5,"salary":0.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7181,"name":"Wesley","role":"DIF","team":"Roma","value":16,"auctionPrice":17,"salary":1.6,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2263,"name":"Lazzari","role":"DIF","team":"Lazio","value":4,"auctionPrice":6,"salary":0.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5994,"name":"Ebosse","role":"DIF","team":"Verona","value":1,"auctionPrice":3,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4433,"name":"Zortea","role":"DIF","team":"Bologna","value":8,"auctionPrice":11,"salary":0.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4947,"name":"Brescianini","role":"CEN","team":"Fiorentina","value":7,"auctionPrice":7,"salary":0.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2765,"name":"Odgaard","role":"CEN","team":"Bologna","value":18,"auctionPrice":21,"salary":1.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6252,"name":"Folorunsho","role":"CEN","team":"Cagliari","value":9,"auctionPrice":12,"salary":0.9,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4364,"name":"Gaetano","role":"CEN","team":"Cagliari","value":13,"auctionPrice":15,"salary":1.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6815,"name":"Fadera","role":"CEN","team":"Sassuolo","value":10,"auctionPrice":10,"salary":1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4465,"name":"Fagioli","role":"CEN","team":"Fiorentina","value":8,"auctionPrice":9,"salary":0.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2077,"name":"Pasalic","role":"CEN","team":"Atalanta","value":13,"auctionPrice":14,"salary":1.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4711,"name":"Kostic","role":"CEN","team":"Juventus","value":11,"auctionPrice":14,"salary":1.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7017,"name":"Douvikas","role":"ATT","team":"Como","value":22,"auctionPrice":23,"salary":2.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2841,"name":"Vlahovic","role":"ATT","team":"Juventus","value":16,"auctionPrice":18,"salary":1.6,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7001,"name":"N''''Dri","role":"ATT","team":"Lecce","value":11,"auctionPrice":13,"salary":1.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4463,"name":"Esposito Se.","role":"ATT","team":"Cagliari","value":17,"auctionPrice":18,"salary":1.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5455,"name":"Moreo","role":"ATT","team":"Pisa","value":15,"auctionPrice":15,"salary":1.5,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2137,"name":"Scamacca","role":"ATT","team":"Atalanta","value":22,"auctionPrice":24,"salary":2.2,"purchaseDate":"2026-08-28T16:11:20.850Z"}]'::jsonb, 114, 173.6, 287.6)
        RETURNING id INTO cur_team_id;
    END IF;

    -- Formazione Giornata 1 per Borussia Porkmund
    INSERT INTO public.lineups (competition_id, team_id, matchday, module, starters, bench, submitted_at)
    VALUES (target_comp_id, cur_team_id, 1, '4-3-3', '[{"id":6641,"name":"Suzuki","role":"POR","team":"Parma","value":9},{"id":6632,"name":"Gaspar K.","role":"DIF","team":"Lecce","value":5},{"id":49,"name":"Masina","role":"DIF","team":"Torino","value":2},{"id":2296,"name":"Mancini","role":"DIF","team":"Roma","value":10},{"id":2640,"name":"Kolasinac","role":"DIF","team":"Atalanta","value":5},{"id":4947,"name":"Brescianini","role":"CEN","team":"Fiorentina","value":7},{"id":2765,"name":"Odgaard","role":"CEN","team":"Bologna","value":18},{"id":6252,"name":"Folorunsho","role":"CEN","team":"Cagliari","value":9},{"id":7017,"name":"Douvikas","role":"ATT","team":"Como","value":22},{"id":2841,"name":"Vlahovic","role":"ATT","team":"Juventus","value":16},{"id":7001,"name":"N''''Dri","role":"ATT","team":"Lecce","value":11}]'::jsonb, '[{"id":4957,"name":"Montipò","role":"POR","team":"Verona","value":10},{"id":7181,"name":"Wesley","role":"DIF","team":"Roma","value":16},{"id":2263,"name":"Lazzari","role":"DIF","team":"Lazio","value":4},{"id":4364,"name":"Gaetano","role":"CEN","team":"Cagliari","value":13},{"id":6815,"name":"Fadera","role":"CEN","team":"Sassuolo","value":10},{"id":4463,"name":"Esposito Se.","role":"ATT","team":"Cagliari","value":17},{"id":5455,"name":"Moreo","role":"ATT","team":"Pisa","value":15}]'::jsonb, now())
    ON CONFLICT (competition_id, team_id, matchday) DO UPDATE SET starters = EXCLUDED.starters, bench = EXCLUDED.bench;

    -- =====================================================================
    -- SQUADRA 7: Atletico MaNonTroppo (Atletico)
    -- =====================================================================
    SELECT id INTO cur_user_id FROM auth.users WHERE email = 'atletico@fantamanager.com' LIMIT 1;
    
    IF cur_user_id IS NULL THEN
        cur_user_id := gen_random_uuid();
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', cur_user_id, 'authenticated', 'authenticated',
            'atletico@fantamanager.com', encrypted_pw, now(),
            '{"provider":"email","providers":["email"]}', '{"username":"Atletico"}', now(), now()
        );

        INSERT INTO auth.identities (
            provider_id, id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            cur_user_id::text, cur_user_id, cur_user_id, jsonb_build_object('sub', cur_user_id, 'email', 'atletico@fantamanager.com'),
            'email', now(), now(), now()
        );

        INSERT INTO public.profiles (id, username)
        VALUES (cur_user_id, 'Atletico')
        ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username;
    END IF;

    -- Crea o aggiorna Team Atletico MaNonTroppo
    SELECT id INTO cur_team_id FROM public.teams WHERE competition_id = target_comp_id AND owner_id = cur_user_id LIMIT 1;
    
    IF cur_team_id IS NOT NULL THEN
        UPDATE public.teams
        SET name = 'Atletico MaNonTroppo',
            roster = '[{"id":133,"name":"Skorupski","role":"POR","team":"Bologna","value":11,"auctionPrice":11,"salary":1.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6966,"name":"Butez","role":"POR","team":"Como","value":18,"auctionPrice":21,"salary":1.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7179,"name":"Israel","role":"POR","team":"Torino","value":2,"auctionPrice":2,"salary":0.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5899,"name":"Gigot","role":"DIF","team":"Lazio","value":1,"auctionPrice":1,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":1891,"name":"Ceccherini","role":"DIF","team":"Cremonese","value":2,"auctionPrice":3,"salary":0.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7125,"name":"Idrissi R.","role":"DIF","team":"Cagliari","value":8,"auctionPrice":8,"salary":0.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5877,"name":"Carlos Augusto","role":"DIF","team":"Inter","value":13,"auctionPrice":16,"salary":1.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7238,"name":"Kouadio","role":"DIF","team":"Fiorentina","value":1,"auctionPrice":1,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5406,"name":"Di Pardo","role":"DIF","team":"Cagliari","value":2,"auctionPrice":5,"salary":0.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7325,"name":"Bozhinov","role":"DIF","team":"Pisa","value":2,"auctionPrice":3,"salary":0.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4502,"name":"Gallo","role":"DIF","team":"Lecce","value":8,"auctionPrice":8,"salary":0.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5589,"name":"Konè M.","role":"CEN","team":"Roma","value":17,"auctionPrice":17,"salary":1.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6398,"name":"Isaksen","role":"CEN","team":"Lazio","value":14,"auctionPrice":15,"salary":1.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5761,"name":"Zhegrova","role":"CEN","team":"Juventus","value":9,"auctionPrice":12,"salary":0.9,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":1870,"name":"Barella","role":"CEN","team":"Inter","value":18,"auctionPrice":20,"salary":1.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5504,"name":"Coulibaly L.","role":"CEN","team":"Lecce","value":12,"auctionPrice":14,"salary":1.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7198,"name":"Piotrowski","role":"CEN","team":"Udinese","value":8,"auctionPrice":9,"salary":0.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4199,"name":"Loftus-Cheek","role":"CEN","team":"Milan","value":13,"auctionPrice":13,"salary":1.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7314,"name":"Taylor K.","role":"CEN","team":"Lazio","value":14,"auctionPrice":14,"salary":1.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6552,"name":"Orban G.","role":"ATT","team":"Verona","value":19,"auctionPrice":20,"salary":1.9,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6646,"name":"Adams C.","role":"ATT","team":"Torino","value":17,"auctionPrice":19,"salary":1.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2097,"name":"Kean","role":"ATT","team":"Fiorentina","value":18,"auctionPrice":20,"salary":1.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6365,"name":"Ferguson E.","role":"ATT","team":"Roma","value":17,"auctionPrice":20,"salary":1.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2764,"name":"Martinez L.","role":"ATT","team":"Inter","value":34,"auctionPrice":35,"salary":3.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5336,"name":"Nzola","role":"ATT","team":"Pisa","value":13,"auctionPrice":15,"salary":1.3,"purchaseDate":"2026-08-28T16:11:20.850Z"}]'::jsonb,
            transfer_budget = 98,
            salary_budget = 170.9,
            budget = 268.9
        WHERE id = cur_team_id;
    ELSE
        INSERT INTO public.teams (competition_id, owner_id, name, roster, transfer_budget, salary_budget, budget)
        VALUES (target_comp_id, cur_user_id, 'Atletico MaNonTroppo', '[{"id":133,"name":"Skorupski","role":"POR","team":"Bologna","value":11,"auctionPrice":11,"salary":1.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6966,"name":"Butez","role":"POR","team":"Como","value":18,"auctionPrice":21,"salary":1.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7179,"name":"Israel","role":"POR","team":"Torino","value":2,"auctionPrice":2,"salary":0.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5899,"name":"Gigot","role":"DIF","team":"Lazio","value":1,"auctionPrice":1,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":1891,"name":"Ceccherini","role":"DIF","team":"Cremonese","value":2,"auctionPrice":3,"salary":0.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7125,"name":"Idrissi R.","role":"DIF","team":"Cagliari","value":8,"auctionPrice":8,"salary":0.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5877,"name":"Carlos Augusto","role":"DIF","team":"Inter","value":13,"auctionPrice":16,"salary":1.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7238,"name":"Kouadio","role":"DIF","team":"Fiorentina","value":1,"auctionPrice":1,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5406,"name":"Di Pardo","role":"DIF","team":"Cagliari","value":2,"auctionPrice":5,"salary":0.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7325,"name":"Bozhinov","role":"DIF","team":"Pisa","value":2,"auctionPrice":3,"salary":0.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4502,"name":"Gallo","role":"DIF","team":"Lecce","value":8,"auctionPrice":8,"salary":0.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5589,"name":"Konè M.","role":"CEN","team":"Roma","value":17,"auctionPrice":17,"salary":1.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6398,"name":"Isaksen","role":"CEN","team":"Lazio","value":14,"auctionPrice":15,"salary":1.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5761,"name":"Zhegrova","role":"CEN","team":"Juventus","value":9,"auctionPrice":12,"salary":0.9,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":1870,"name":"Barella","role":"CEN","team":"Inter","value":18,"auctionPrice":20,"salary":1.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5504,"name":"Coulibaly L.","role":"CEN","team":"Lecce","value":12,"auctionPrice":14,"salary":1.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7198,"name":"Piotrowski","role":"CEN","team":"Udinese","value":8,"auctionPrice":9,"salary":0.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4199,"name":"Loftus-Cheek","role":"CEN","team":"Milan","value":13,"auctionPrice":13,"salary":1.3,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":7314,"name":"Taylor K.","role":"CEN","team":"Lazio","value":14,"auctionPrice":14,"salary":1.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6552,"name":"Orban G.","role":"ATT","team":"Verona","value":19,"auctionPrice":20,"salary":1.9,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6646,"name":"Adams C.","role":"ATT","team":"Torino","value":17,"auctionPrice":19,"salary":1.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2097,"name":"Kean","role":"ATT","team":"Fiorentina","value":18,"auctionPrice":20,"salary":1.8,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":6365,"name":"Ferguson E.","role":"ATT","team":"Roma","value":17,"auctionPrice":20,"salary":1.7,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2764,"name":"Martinez L.","role":"ATT","team":"Inter","value":34,"auctionPrice":35,"salary":3.4,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":5336,"name":"Nzola","role":"ATT","team":"Pisa","value":13,"auctionPrice":15,"salary":1.3,"purchaseDate":"2026-08-28T16:11:20.850Z"}]'::jsonb, 98, 170.9, 268.9)
        RETURNING id INTO cur_team_id;
    END IF;

    -- Formazione Giornata 1 per Atletico MaNonTroppo
    INSERT INTO public.lineups (competition_id, team_id, matchday, module, starters, bench, submitted_at)
    VALUES (target_comp_id, cur_team_id, 1, '4-3-3', '[{"id":133,"name":"Skorupski","role":"POR","team":"Bologna","value":11},{"id":5899,"name":"Gigot","role":"DIF","team":"Lazio","value":1},{"id":1891,"name":"Ceccherini","role":"DIF","team":"Cremonese","value":2},{"id":7125,"name":"Idrissi R.","role":"DIF","team":"Cagliari","value":8},{"id":5877,"name":"Carlos Augusto","role":"DIF","team":"Inter","value":13},{"id":5589,"name":"Konè M.","role":"CEN","team":"Roma","value":17},{"id":6398,"name":"Isaksen","role":"CEN","team":"Lazio","value":14},{"id":5761,"name":"Zhegrova","role":"CEN","team":"Juventus","value":9},{"id":6552,"name":"Orban G.","role":"ATT","team":"Verona","value":19},{"id":6646,"name":"Adams C.","role":"ATT","team":"Torino","value":17},{"id":2097,"name":"Kean","role":"ATT","team":"Fiorentina","value":18}]'::jsonb, '[{"id":6966,"name":"Butez","role":"POR","team":"Como","value":18},{"id":7238,"name":"Kouadio","role":"DIF","team":"Fiorentina","value":1},{"id":5406,"name":"Di Pardo","role":"DIF","team":"Cagliari","value":2},{"id":1870,"name":"Barella","role":"CEN","team":"Inter","value":18},{"id":5504,"name":"Coulibaly L.","role":"CEN","team":"Lecce","value":12},{"id":6365,"name":"Ferguson E.","role":"ATT","team":"Roma","value":17},{"id":2764,"name":"Martinez L.","role":"ATT","team":"Inter","value":34}]'::jsonb, now())
    ON CONFLICT (competition_id, team_id, matchday) DO UPDATE SET starters = EXCLUDED.starters, bench = EXCLUDED.bench;

    -- =====================================================================
    -- SQUADRA 8: Scarsenal (Scarsenal)
    -- =====================================================================
    SELECT id INTO cur_user_id FROM auth.users WHERE email = 'scarsenal@fantamanager.com' LIMIT 1;
    
    IF cur_user_id IS NULL THEN
        cur_user_id := gen_random_uuid();
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', cur_user_id, 'authenticated', 'authenticated',
            'scarsenal@fantamanager.com', encrypted_pw, now(),
            '{"provider":"email","providers":["email"]}', '{"username":"Scarsenal"}', now(), now()
        );

        INSERT INTO auth.identities (
            provider_id, id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            cur_user_id::text, cur_user_id, cur_user_id, jsonb_build_object('sub', cur_user_id, 'email', 'scarsenal@fantamanager.com'),
            'email', now(), now(), now()
        );

        INSERT INTO public.profiles (id, username)
        VALUES (cur_user_id, 'Scarsenal')
        ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username;
    END IF;

    -- Crea o aggiorna Team Scarsenal
    SELECT id INTO cur_team_id FROM public.teams WHERE competition_id = target_comp_id AND owner_id = cur_user_id LIMIT 1;
    
    IF cur_team_id IS NOT NULL THEN
        UPDATE public.teams
        SET name = 'Scarsenal',
            roster = '[{"id":574,"name":"Scuffet","role":"POR","team":"Pisa","value":2,"auctionPrice":3,"salary":0.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4929,"name":"Ciocci","role":"POR","team":"Cagliari","value":1,"auctionPrice":4,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2428,"name":"Sommer","role":"POR","team":"Inter","value":12,"auctionPrice":13,"salary":1.2,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":5168,"name":"Tsimikas","role":"DIF","team":"Roma","value":3,"auctionPrice":5,"salary":0.3,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":4807,"name":"Hermoso","role":"DIF","team":"Roma","value":10,"auctionPrice":11,"salary":1,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":5532,"name":"Bradaric","role":"DIF","team":"Verona","value":5,"auctionPrice":6,"salary":0.5,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":6631,"name":"Ghilardi","role":"DIF","team":"Roma","value":3,"auctionPrice":4,"salary":0.3,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":4317,"name":"N''''Dicka","role":"DIF","team":"Roma","value":6,"auctionPrice":8,"salary":0.6,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":5273,"name":"Estupinan","role":"DIF","team":"Milan","value":3,"auctionPrice":5,"salary":0.3,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":1852,"name":"Spinazzola","role":"DIF","team":"Napoli","value":19,"auctionPrice":20,"salary":1.9,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":2788,"name":"Bremer","role":"DIF","team":"Juventus","value":12,"auctionPrice":15,"salary":1.2,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":5298,"name":"Pobega","role":"CEN","team":"Bologna","value":11,"auctionPrice":12,"salary":1.1,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":779,"name":"Cristante","role":"CEN","team":"Roma","value":12,"auctionPrice":15,"salary":1.2,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":2334,"name":"Leris","role":"CEN","team":"Pisa","value":11,"auctionPrice":12,"salary":1.1,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":6593,"name":"Akinsanmiro","role":"CEN","team":"Pisa","value":8,"auctionPrice":11,"salary":0.8,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":152,"name":"Zielinski","role":"CEN","team":"Inter","value":17,"auctionPrice":18,"salary":1.7,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":5131,"name":"Gilmour","role":"CEN","team":"Napoli","value":7,"auctionPrice":8,"salary":0.7,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":2529,"name":"Mkhitaryan","role":"CEN","team":"Inter","value":7,"auctionPrice":7,"salary":0.7,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":6015,"name":"Berisha M.","role":"CEN","team":"Lecce","value":14,"auctionPrice":17,"salary":1.4,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":5995,"name":"De Ketelaere","role":"ATT","team":"Atalanta","value":17,"auctionPrice":20,"salary":1.7,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":6052,"name":"Hojlund","role":"ATT","team":"Napoli","value":27,"auctionPrice":28,"salary":2.7,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":2531,"name":"Lukaku","role":"ATT","team":"Napoli","value":15,"auctionPrice":15,"salary":1.5,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":5734,"name":"Soulè","role":"ATT","team":"Roma","value":26,"auctionPrice":27,"salary":2.6,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":6572,"name":"Castro S.","role":"ATT","team":"Bologna","value":23,"auctionPrice":23,"salary":2.3,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":7316,"name":"Durosinmi","role":"ATT","team":"Pisa","value":15,"auctionPrice":15,"salary":1.5,"purchaseDate":"2026-08-28T16:11:20.851Z"}]'::jsonb,
            transfer_budget = 98,
            salary_budget = 171.4,
            budget = 269.4
        WHERE id = cur_team_id;
    ELSE
        INSERT INTO public.teams (competition_id, owner_id, name, roster, transfer_budget, salary_budget, budget)
        VALUES (target_comp_id, cur_user_id, 'Scarsenal', '[{"id":574,"name":"Scuffet","role":"POR","team":"Pisa","value":2,"auctionPrice":3,"salary":0.2,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":4929,"name":"Ciocci","role":"POR","team":"Cagliari","value":1,"auctionPrice":4,"salary":0.1,"purchaseDate":"2026-08-28T16:11:20.850Z"},{"id":2428,"name":"Sommer","role":"POR","team":"Inter","value":12,"auctionPrice":13,"salary":1.2,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":5168,"name":"Tsimikas","role":"DIF","team":"Roma","value":3,"auctionPrice":5,"salary":0.3,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":4807,"name":"Hermoso","role":"DIF","team":"Roma","value":10,"auctionPrice":11,"salary":1,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":5532,"name":"Bradaric","role":"DIF","team":"Verona","value":5,"auctionPrice":6,"salary":0.5,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":6631,"name":"Ghilardi","role":"DIF","team":"Roma","value":3,"auctionPrice":4,"salary":0.3,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":4317,"name":"N''''Dicka","role":"DIF","team":"Roma","value":6,"auctionPrice":8,"salary":0.6,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":5273,"name":"Estupinan","role":"DIF","team":"Milan","value":3,"auctionPrice":5,"salary":0.3,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":1852,"name":"Spinazzola","role":"DIF","team":"Napoli","value":19,"auctionPrice":20,"salary":1.9,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":2788,"name":"Bremer","role":"DIF","team":"Juventus","value":12,"auctionPrice":15,"salary":1.2,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":5298,"name":"Pobega","role":"CEN","team":"Bologna","value":11,"auctionPrice":12,"salary":1.1,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":779,"name":"Cristante","role":"CEN","team":"Roma","value":12,"auctionPrice":15,"salary":1.2,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":2334,"name":"Leris","role":"CEN","team":"Pisa","value":11,"auctionPrice":12,"salary":1.1,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":6593,"name":"Akinsanmiro","role":"CEN","team":"Pisa","value":8,"auctionPrice":11,"salary":0.8,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":152,"name":"Zielinski","role":"CEN","team":"Inter","value":17,"auctionPrice":18,"salary":1.7,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":5131,"name":"Gilmour","role":"CEN","team":"Napoli","value":7,"auctionPrice":8,"salary":0.7,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":2529,"name":"Mkhitaryan","role":"CEN","team":"Inter","value":7,"auctionPrice":7,"salary":0.7,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":6015,"name":"Berisha M.","role":"CEN","team":"Lecce","value":14,"auctionPrice":17,"salary":1.4,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":5995,"name":"De Ketelaere","role":"ATT","team":"Atalanta","value":17,"auctionPrice":20,"salary":1.7,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":6052,"name":"Hojlund","role":"ATT","team":"Napoli","value":27,"auctionPrice":28,"salary":2.7,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":2531,"name":"Lukaku","role":"ATT","team":"Napoli","value":15,"auctionPrice":15,"salary":1.5,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":5734,"name":"Soulè","role":"ATT","team":"Roma","value":26,"auctionPrice":27,"salary":2.6,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":6572,"name":"Castro S.","role":"ATT","team":"Bologna","value":23,"auctionPrice":23,"salary":2.3,"purchaseDate":"2026-08-28T16:11:20.851Z"},{"id":7316,"name":"Durosinmi","role":"ATT","team":"Pisa","value":15,"auctionPrice":15,"salary":1.5,"purchaseDate":"2026-08-28T16:11:20.851Z"}]'::jsonb, 98, 171.4, 269.4)
        RETURNING id INTO cur_team_id;
    END IF;

    -- Formazione Giornata 1 per Scarsenal
    INSERT INTO public.lineups (competition_id, team_id, matchday, module, starters, bench, submitted_at)
    VALUES (target_comp_id, cur_team_id, 1, '4-3-3', '[{"id":574,"name":"Scuffet","role":"POR","team":"Pisa","value":2},{"id":5168,"name":"Tsimikas","role":"DIF","team":"Roma","value":3},{"id":4807,"name":"Hermoso","role":"DIF","team":"Roma","value":10},{"id":5532,"name":"Bradaric","role":"DIF","team":"Verona","value":5},{"id":6631,"name":"Ghilardi","role":"DIF","team":"Roma","value":3},{"id":5298,"name":"Pobega","role":"CEN","team":"Bologna","value":11},{"id":779,"name":"Cristante","role":"CEN","team":"Roma","value":12},{"id":2334,"name":"Leris","role":"CEN","team":"Pisa","value":11},{"id":5995,"name":"De Ketelaere","role":"ATT","team":"Atalanta","value":17},{"id":6052,"name":"Hojlund","role":"ATT","team":"Napoli","value":27},{"id":2531,"name":"Lukaku","role":"ATT","team":"Napoli","value":15}]'::jsonb, '[{"id":4929,"name":"Ciocci","role":"POR","team":"Cagliari","value":1},{"id":4317,"name":"N''''Dicka","role":"DIF","team":"Roma","value":6},{"id":5273,"name":"Estupinan","role":"DIF","team":"Milan","value":3},{"id":6593,"name":"Akinsanmiro","role":"CEN","team":"Pisa","value":8},{"id":152,"name":"Zielinski","role":"CEN","team":"Inter","value":17},{"id":5734,"name":"Soulè","role":"ATT","team":"Roma","value":26},{"id":6572,"name":"Castro S.","role":"ATT","team":"Bologna","value":23}]'::jsonb, now())
    ON CONFLICT (competition_id, team_id, matchday) DO UPDATE SET starters = EXCLUDED.starters, bench = EXCLUDED.bench;

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
