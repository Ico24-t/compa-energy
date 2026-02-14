import { createClient } from '@supabase/supabase-js';

// Debug per vedere se le variabili d'ambiente sono caricate
console.log('🔧 Ambiente:', {
  NODE_ENV: process.env.NODE_ENV,
  hasUrl: !!process.env.REACT_APP_SUPABASE_URL,
  hasKey: !!process.env.REACT_APP_SUPABASE_ANON_KEY,
  urlPrefix: process.env.REACT_APP_SUPABASE_URL ? process.env.REACT_APP_SUPABASE_URL.substring(0, 15) + '...' : 'mancante',
  isMobile: /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
});

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Fallback per debugging - NON USARE IN PRODUZIONE
// Questi sono solo per test, vanno rimossi!
const FALLBACK_URL = 'https://tuo-progetto.supabase.co'; // SOSTITUISCI CON IL TUO URL REALE
const FALLBACK_KEY = 'tua_chiave'; // SOSTITUISCI CON LA TUA CHIAVE REALE

// Usa fallback solo se in sviluppo e mancano le variabili
const finalUrl = supabaseUrl || (process.env.NODE_ENV === 'development' ? FALLBACK_URL : null);
const finalKey = supabaseAnonKey || (process.env.NODE_ENV === 'development' ? FALLBACK_KEY : null);

if (!finalUrl || !finalKey) {
  console.error('❌ Configurazione Supabase mancante! Verifica il file .env o le variabili d\'ambiente su Cloudflare');
  
  // Mostra un errore più chiaro in produzione
  if (process.env.NODE_ENV === 'production') {
    console.error('🚨 Le variabili d\'ambiente non sono state caricate correttamente su Cloudflare Pages!');
    console.error('📌 Verifica che REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY siano impostate in Cloudflare Dashboard → Pages → Settings → Environment variables');
  }
}

export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'sb-comparatore-auth-token'
  },
  global: {
    headers: {
      'x-application-name': 'comparatore-energia'
    }
  },
  // Aggiungi timeout per evitare attese infinite su connessioni lente
  realtime: {
    timeout: 30000
  },
  db: {
    schema: 'public'
  }
});

// Helper per testare la connessione
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('fornitori')
      .select('count', { count: 'exact', head: true });
    
    if (error) throw error;
    console.log('✅ Connessione Supabase attiva');
    return { success: true };
  } catch (error) {
    console.error('❌ Errore connessione Supabase:', error);
    return { success: false, error: error.message };
  }
};

// Helper per gestire gli errori
export const handleSupabaseError = (error) => {
  console.error('Errore Supabase:', error);
  
  if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
    return 'Problema di connessione internet. Verifica la tua connessione e riprova.';
  }
  
  if (error.code === 'PGRST301') {
    return 'Errore di connessione al database. Riprova più tardi.';
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'Si è verificato un errore. Riprova più tardi.';
};
