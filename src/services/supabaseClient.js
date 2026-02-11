import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Configurazione Supabase mancante! Verifica il file .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper per gestire gli errori
export const handleSupabaseError = (error) => {
  console.error('Errore Supabase:', error);
  if (error.message) {
    return error.message;
  }
  return 'Si è verificato un errore. Riprova più tardi.';
};
