import listoneCsv from '../data/listone.csv?raw';
import { parseCSV } from './csvParser';

// Load and parse data immediately
const allPlayers = parseCSV(listoneCsv);

export const performSearch = (query, role, budget) => {
    let results = allPlayers;

    if (query) {
        results = results.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
    }

    if (role && role !== 'ALL') {
        results = results.filter(p => p.role === role);
    }

    // Filter out players out of budget? Optional
    // results = results.filter(p => p.value <= budget);

    // Limit results for performance if query is empty
    if (!query && role === 'ALL') {
        return results.slice(0, 50);
    }

    return results;
};
