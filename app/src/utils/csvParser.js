import * as XLSX from 'xlsx';

/**
 * Role mapping from standard Italian Fantacalcio notation to internal roles
 */
const ROLE_MAP = {
    'P': 'POR',
    'POR': 'POR',
    'D': 'DIF',
    'DIF': 'DIF',
    'C': 'CEN',
    'CEN': 'CEN',
    'A': 'ATT',
    'ATT': 'ATT'
};

/**
 * Parses official Fantacalcio CSV or XLSX text/buffer into standard player objects.
 */
export const parseListone = (input) => {
    if (!input) return [];

    // 1. If ArrayBuffer / Binary (from .xlsx file)
    if (input instanceof ArrayBuffer || (typeof input === 'object' && input.byteLength)) {
        try {
            const workbook = XLSX.read(input, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            return parseMatrixData(jsonData);
        } catch (e) {
            console.error('Error parsing XLSX workbook:', e);
            return [];
        }
    }

    // 2. If CSV String
    if (typeof input === 'string') {
        const lines = input.trim().split('\n');

        // Find header row (starts with "Id" or "R" or "Nome")
        const headerIndex = lines.findIndex(line => {
            const l = line.toLowerCase();
            return l.startsWith('id') || l.includes('ruolo') || l.includes('squadra');
        });

        if (headerIndex === -1) {
            console.error('Could not find CSV header in input');
            return [];
        }

        // Determine delimiter (comma or semicolon)
        const delimiter = lines[headerIndex].includes(';') ? ';' : ',';

        const matrix = lines.slice(headerIndex).map(line =>
            line.split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ''))
        );

        return parseMatrixData(matrix);
    }

    return [];
};

/**
 * Parses 2D array of rows from Excel or CSV
 */
const parseMatrixData = (rows) => {
    if (!rows || rows.length < 2) return [];

    // Find the header row (contains 'id' or 'nome' or 'r')
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(5, rows.length); i++) {
        const rowStr = rows[i].map(c => String(c).toLowerCase()).join(' ');
        if (rowStr.includes('nome') && (rowStr.includes('squadra') || rowStr.includes('r') || rowStr.includes('id'))) {
            headerRowIdx = i;
            break;
        }
    }

    if (headerRowIdx === -1) headerRowIdx = 0;

    const headers = rows[headerRowIdx].map(h => String(h || '').trim());
    const dataRows = rows.slice(headerRowIdx + 1);

    // Map column indices
    const idIdx = headers.findIndex(h => /^id$/i.test(h) || /^codice$/i.test(h));
    const roleIdx = headers.findIndex(h => /^r$/i.test(h) || /^ruolo$/i.test(h));
    const nameIdx = headers.findIndex(h => /^nome$/i.test(h) || /^calciatore$/i.test(h));
    const teamIdx = headers.findIndex(h => /^squadra$/i.test(h) || /^team$/i.test(h) || /^sq$/i.test(h));
    const valueIdx = headers.findIndex(h => /qt\.?\s*a/i.test(h) || /^valore$/i.test(h) || /^quotazione$/i.test(h) || /^fvm$/i.test(h));
    const initialValIdx = headers.findIndex(h => /qt\.?\s*i/i.test(h) || /^quotazione iniziale$/i.test(h));

    const players = [];

    dataRows.forEach((row, rowNum) => {
        if (!row || row.length === 0) return;

        const name = nameIdx !== -1 ? String(row[nameIdx] || '').trim() : '';
        if (!name || name.toLowerCase() === 'nome') return;

        const id = idIdx !== -1 && row[idIdx] ? parseInt(row[idIdx], 10) : (rowNum + 1);
        const rawRole = roleIdx !== -1 ? String(row[roleIdx] || '').trim().toUpperCase() : 'CEN';
        const team = teamIdx !== -1 ? String(row[teamIdx] || '').trim() : 'Serie A';
        const rawVal = valueIdx !== -1 ? String(row[valueIdx] || '').replace(',', '.') : '1';
        const value = Math.max(1, parseInt(rawVal, 10) || 1);

        const rawInitVal = initialValIdx !== -1 ? String(row[initialValIdx] || '').replace(',', '.') : rawVal;
        const initialValue = Math.max(1, parseInt(rawInitVal, 10) || value);

        players.push({
            id: Number.isFinite(id) ? id : (rowNum + 1),
            name: name,
            role: ROLE_MAP[rawRole] || 'CEN',
            team: team,
            value: value,
            initialValue: initialValue
        });
    });

    return players;
};

export const parseCSV = (csvText) => parseListone(csvText);
