import { createClient } from '@supabase/supabase-js';

// Access Environment Variables using Vite's import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase Environment Variables! Check .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
