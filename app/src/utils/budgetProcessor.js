import { supabase } from '../lib/supabase';

/**
 * Budget Processor Utility
 * 
 * Handles annual pre-auction budget restore events.
 * 
 * Rule:
 * 1. When a league is created, the current year is already active and teams start with their configured initial budgets.
 * 2. Restore ONLY triggers in subsequent years (when currentYear > lastRestoreYear) once the restore date arrives.
 * 3. Budgets are NEVER altered on page reload.
 */

/**
 * Determines if a recurring annual date has passed for a NEW year.
 * @param {{ month: number, day: number }} dateConfig - Month (1-12) and day
 * @param {number|null} lastProcessedYear - The last year this event was processed
 * @returns {boolean}
 */
const shouldProcess = (dateConfig, lastProcessedYear) => {
    if (!dateConfig || !dateConfig.month || !dateConfig.day) return false;

    // If never initialized, we do NOT process (initial season starts with admin budgets)
    if (!lastProcessedYear) return false;

    const now = new Date();
    const currentYear = now.getFullYear();

    // Only process if we are in a NEW calendar year after the last processed year
    if (currentYear <= lastProcessedYear) return false;

    const eventDate = new Date(currentYear, dateConfig.month - 1, dateConfig.day);
    return now >= eventDate;
};

/**
 * Calculates the total salaries for a team's roster.
 * @param {Array} roster - Array of player objects with `salary` field
 * @returns {number}
 */
export const calculateTotalSalaries = (roster) => {
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

    if (now < eventThisYear) {
        return eventThisYear;
    }
    return new Date(currentYear + 1, dateConfig.month - 1, dateConfig.day);
};

/**
 * Main check-on-load function.
 * Checks whether the annual pre-auction budget restore needs to be processed.
 * 
 * @param {string} competitionId - The competition UUID
 * @param {object} settings - The competition settings JSONB object
 * @param {Array} teams - Array of team objects
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

    // 1. Initialize lastRestoreYear on first load without incrementing budgets
    if (!updatedSettings.lastRestoreYear) {
        updatedSettings.lastRestoreYear = currentYear;
        changed = true;
    }

    // 2. Pre-Auction Restore (only in future years)
    if (shouldProcess(settings.restoreDate, settings.lastRestoreYear)) {
        console.log(`[BudgetProcessor] Processing pre-auction budget restore for year ${currentYear}`);

        const restoreTransfer = settings.restoreTransferAmount || 0;
        const restoreSalary = settings.restoreSalaryAmount || 0;

        for (let i = 0; i < updatedTeams.length; i++) {
            const team = updatedTeams[i];
            const currentTransfer = team.transferBudget ?? team.transfer_budget ?? 0;
            const currentSalary = team.salaryBudget ?? team.salary_budget ?? 0;

            const newTransferBudget = currentTransfer + restoreTransfer;
            const newSalaryBudget = currentSalary + restoreSalary;

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

    // 3. Persist updated settings to Supabase if changed
    if (changed) {
        await supabase
            .from('competitions')
            .update({ settings: updatedSettings })
            .eq('id', competitionId);
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
    restoreDate: { month: 8, day: 1 }, // 1 Agosto (Pre-Asta)
    restoreTransferAmount: 300,
    restoreSalaryAmount: 200,
    lastRestoreYear: new Date().getFullYear() // Default to current year
};
