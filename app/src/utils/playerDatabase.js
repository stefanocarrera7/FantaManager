import listoneCsv from '../data/listone.csv?raw';
import { parseListone } from './csvParser';
import { supabase } from '../lib/supabase';

// 1. Initial bundle listone
const defaultPlayers = parseListone(listoneCsv);

// 2. In-memory active players state
let activePlayers = [...defaultPlayers];

// 3. Try to load cached custom listone from localStorage
try {
    const saved = localStorage.getItem('fanta_custom_listone');
    if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
            activePlayers = parsed;
        }
    }
} catch (e) {
    console.error('Error loading custom listone from localStorage:', e);
}

/**
 * Returns all active players in the database
 */
export const getAllPlayers = () => activePlayers;

/**
 * Performs search on active players
 */
export const performSearch = (query, role, budget) => {
    let results = activePlayers;

    if (query) {
        results = results.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
    }

    if (role && role !== 'ALL') {
        results = results.filter(p => p.role === role);
    }

    if (budget && budget > 0) {
        results = results.filter(p => p.value <= budget);
    }

    // Limit results for performance if query is empty
    if (!query && role === 'ALL') {
        return results.slice(0, 50);
    }

    return results;
};

/**
 * Updates the active player database and persists to localStorage and optionally Supabase
 */
export const updatePlayerDatabase = async (newPlayers, source = 'manual_update', competitionId = null) => {
    if (!Array.isArray(newPlayers) || newPlayers.length === 0) return false;

    activePlayers = [...newPlayers];

    try {
        localStorage.setItem('fanta_custom_listone', JSON.stringify(newPlayers));
        localStorage.setItem('fanta_listone_meta', JSON.stringify({
            total: newPlayers.length,
            updatedAt: new Date().toISOString(),
            source
        }));

        // Optional: Save to competition settings in Supabase if competitionId provided
        if (competitionId) {
            await supabase
                .from('competitions')
                .update({
                    settings: {
                        listoneMeta: {
                            total: newPlayers.length,
                            updatedAt: new Date().toISOString(),
                            source
                        }
                    }
                })
                .eq('id', competitionId);
        }

        return true;
    } catch (e) {
        console.error('Error saving updated listone:', e);
        return false;
    }
};

/**
 * Fetches latest official listone from online mirror / open data endpoint
 */
export const syncListoneFromOnline = async () => {
    const onlineUrls = [
        'https://raw.githubusercontent.com/andregri/fantacalcio-voti-live/main/Quotazioni_Fantacalcio.csv',
        'https://raw.githubusercontent.com/openfootball/serie-a/master/quotazioni.csv'
    ];

    for (const url of onlineUrls) {
        try {
            const response = await fetch(url, { headers: { 'Accept': 'text/plain, text/csv' } });
            if (response.ok) {
                const text = await response.text();
                const players = parseListone(text);
                if (players.length > 100) {
                    await updatePlayerDatabase(players, 'online_sync (' + url + ')');
                    return { success: true, count: players.length, source: url };
                }
            }
        } catch (e) {
            console.warn(`Failed to sync listone from ${url}:`, e.message);
        }
    }

    return { success: false, message: 'Impossibile contattare i feed online. Puoi caricare il file .xlsx o .csv manualmente.' };
};

/**
 * Resets listone back to default bundled dataset
 */
export const resetListoneToDefault = () => {
    activePlayers = [...defaultPlayers];
    localStorage.removeItem('fanta_custom_listone');
    localStorage.removeItem('fanta_listone_meta');
    return activePlayers;
};
