import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Le variabili d\'ambiente di Supabase non sono configurate correttamente')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper per gestire gli errori di Supabase
export const handleSupabaseError = (error) => {
  if (error) {
    console.error('Errore Supabase:', error)
    return {
      success: false,
      error: error.message || 'Si è verificato un errore'
    }
  }
  return { success: true }
}
