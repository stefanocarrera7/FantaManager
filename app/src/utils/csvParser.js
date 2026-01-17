export const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');

    // Find the header line. It usually starts with "Id" or "Codice"
    // In our case, line 1 is metadata, line 2 is header.
    // We'll search for the line starting with "Id" to be safe.
    const headerIndex = lines.findIndex(line => line.toLowerCase().startsWith('id,'));

    if (headerIndex === -1) {
        console.error("Could not find CSV header");
        return [];
    }

    const headers = lines[headerIndex].split(',').map(h => h.trim());
    const dataLines = lines.slice(headerIndex + 1);

    const players = dataLines.map(line => {
        // Handle CSV lines that might end with empty commas
        const values = line.split(',').map(v => v.trim());

        // Map to object
        const player = {};
        headers.forEach((header, index) => {
            player[header] = values[index];
        });

        // Skip invalid lines
        if (!player.Id) return null;

        // Role Mapping (P, D, C, A -> POR, DIF, CEN, ATT)
        const roleMap = {
            'P': 'POR',
            'D': 'DIF',
            'C': 'CEN',
            'A': 'ATT'
        };

        return {
            id: player.Id,
            name: player.Nome,
            role: roleMap[player.R] || player.R, // Map or keep original if unknown
            team: player.Squadra,
            value: parseInt(player['Qt.A'], 10) || 1, // Fallback to 1 if parsing fails
            originalRole: player.RM // Mantras role if needed later
        };
    }).filter(p => p !== null);

    return players;
};
