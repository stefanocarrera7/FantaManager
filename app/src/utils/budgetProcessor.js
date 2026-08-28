import { supabase } from '../lib/supabase';

/**
 * Budget Processor Utility
 * 
 * Checks if salary payment or budget restore events should be triggered
 * based on admin-configured dates, and processes them automatically.
 * 
 * Uses a "check-on-load" pattern: every time a competition is loaded,
 * this function verifies if any financial events have passed since last processing.
 * Events recur every year automatically.
 */

/**
 * Determines if a recurring annual date has passed this year
 * and hasn't been processed yet.
 * @param {{ month: number, day: number }} dateConfig - Month (1-12) and day
 * @param {number|null} lastProcessedYear - The last year this event was processed
 * @returns {boolean}
 */
const shouldProcess = (dateConfig, lastProcessedYear) => {
    if (!dateConfig || !dateConfig.month || !dateConfig.day) return false;

    const now = new Date();
    const currentYear = now.getFullYear();
    const eventDate = new Date(currentYear, dateConfig.month - 1, dateConfig.day);

    // Event date has passed this year AND we haven't processed it this year
    return now >= eventDate && (lastProcessedYear === null || lastProcessedYear < currentYear);
};

/**
 * Calculates the total salaries for a team's roster.
 * @param {Array} roster - Array of player objects with `salary` field
 * @returns {number}
 */
const calculateTotalSalaries = (roster) => {
    if (!roster || !Array.isArray(roster)) return 0;
    return roster.reduce((sum, p) => sum + (p.salary || 0), 0);
};

/**
 * Gets the next occurrence of a recurring annual date.
 * @param {{ month: number, day: number }} dateConfig
 * @returns {Date|null}
 */
export const getNextEventDate = (dateConfig) => {
    if (!dateConfig || !dateConfig.month || !dateConfig.day) return null;

    const now = new Date();
    const currentYear = now.getFullYear();
    const eventThisYear = new Date(currentYear, dateConfig.month - 1, dateConfig.day);

    // If the event hasn't happened yet this year, it's this year
    // Otherwise, it's next year
    if (now < eventThisYear) {
        return eventThisYear;
    }
    return new Date(currentYear + 1, dateConfig.month - 1, dateConfig.day);
};

/**
 * Main check-on-load function.
 * Checks whether salary payments or budget restores need to be processed,
 * and applies them to all teams in the competition.
 * 
 * @param {string} competitionId - The competition UUID
 * @param {object} settings - The competition settings JSONB object
 * @param {Array} teams - Array of team objects (with roster, transfer_budget, salary_budget)
 * @returns {{ updatedTeams: Array, updatedSettings: object, changed: boolean }}
 */
export const checkAndProcessBudgetEvents = async (competitionId, settings, teams) => {
    if (!settings || !teams || teams.length === 0) {
        return { updatedTeams: teams, updatedSettings: settings, changed: false };
    }

    let changed = false;
    let updatedSettings = { ...settings };
    let updatedTeams = teams.map(t => ({ ...t }));
    const currentYear = new Date().getFullYear();

    // --- 1. SALARY PAYMENT CHECK ---
    if (shouldProcess(settings.salaryPaymentDate, settings.lastSalaryPaymentYear)) {
        console.log(`[BudgetProcessor] Processing salary payments for year ${currentYear}`);

        for (let i = 0; i < updatedTeams.length; i++) {
            const team = updatedTeams[i];
            const totalSalaries = calculateTotalSalaries(team.roster);
            const newSalaryBudget = (team.salaryBudget || team.salary_budget || 0) - totalSalaries;

            updatedTeams[i] = {
                ...team,
                salaryBudget: newSalaryBudget,
                salary_budget: newSalaryBudget
            };

            // Persist to DB
            const { error } = await supabase
                .from('teams')
                .update({ salary_budget: newSalaryBudget })
                .eq('id', team.id);

            if (error) {
                console.error(`[BudgetProcessor] Error updating salary_budget for team ${team.id}:`, error);
            }
        }

        updatedSettings.lastSalaryPaymentYear = currentYear;
        changed = true;
    }

    // --- 2. BUDGET RESTORE CHECK ---
    if (shouldProcess(settings.restoreDate, settings.lastRestoreYear)) {
        console.log(`[BudgetProcessor] Processing budget restore for year ${currentYear}`);

        const restoreTransfer = settings.restoreTransferAmount || 0;
        const restoreSalary = settings.restoreSalaryAmount || 0;

        for (let i = 0; i < updatedTeams.length; i++) {
            const team = updatedTeams[i];
            const newTransferBudget = (team.transferBudget || team.transfer_budget || 0) + restoreTransfer;
            const newSalaryBudget = (team.salaryBudget || team.salary_budget || 0) + restoreSalary;

            updatedTeams[i] = {
                ...team,
                transferBudget: newTransferBudget,
                transfer_budget: newTransferBudget,
                salaryBudget: newSalaryBudget,
                salary_budget: newSalaryBudget
            };

            // Persist to DB
            const { error } = await supabase
                .from('teams')
                .update({
                    transfer_budget: newTransferBudget,
                    salary_budget: newSalaryBudget
                })
                .eq('id', team.id);

            if (error) {
                console.error(`[BudgetProcessor] Error updating budgets for team ${team.id}:`, error);
            }
        }

        updatedSettings.lastRestoreYear = currentYear;
        changed = true;
    }

    // --- 3. PERSIST UPDATED SETTINGS ---
    if (changed) {
        const { error } = await supabase
            .from('competitions')
            .update({ settings: updatedSettings })
            .eq('id', competitionId);

        if (error) {
            console.error('[BudgetProcessor] Error updating competition settings:', error);
        }
    }

    return { updatedTeams, updatedSettings, changed };
};

/**
 * Default competition financial settings.
 */
export const DEFAULT_FINANCE_SETTINGS = {
    salaryPercentage: 0.1,
    initialTransferBudget: 300,
    initialSalaryBudget: 200,
    salaryPaymentDate: { month: 1, day: 31 },   // 31 Gennaio
    restoreDate: { month: 8, day: 1 },            // 1 Agosto
    restoreTransferAmount: 300,
    restoreSalaryAmount: 200,
    lastSalaryPaymentYear: null,
    lastRestoreYear: null
};

