/**
 * TEST DI CONFIGURAZIONE
 * Copia e incolla questo INTERO file nella console del browser (F12)
 * Oppure importalo e chiama testConfig()
 */

export async function testConfig() {
  console.log('%c🔍 TEST CONFIGURAZIONE COMPARATORE', 'background: blue; color: white; font-size: 16px; padding: 5px;');
  console.log('=====================================\n');
  
  // 1. Info dispositivo
  console.log('%c📱 INFORMAZIONI DISPOSITIVO:', 'font-weight: bold');
  console.log('User Agent:', navigator.userAgent);
  console.log('Mobile:', /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? '✅ SÌ' : '❌ NO');
  console.log('Online:', navigator.onLine ? '✅' : '❌');
  console.log('Lingua:', navigator.language);
  console.log('URL:', window.location.href);
  console.log('Cookie abilitati:', navigator.cookieEnabled ? '✅' : '❌');
  
  // 2. Variabili d'ambiente (tenta di leggerle)
  console.log('\n%c🔧 VARIABILI D\'AMBIENTE:', 'font-weight: bold');
  
  const envVars = [
    'REACT_APP_SUPABASE_URL',
    'REACT_APP_SUPABASE_ANON_KEY',
    'REACT_APP_EMAILJS_PUBLIC_KEY',
    'REACT_APP_EMAILJS_SERVICE_ID',
    'REACT_APP_EMAILJS_TEMPLATE_CLIENT',
    'REACT_APP_EMAILJS_TEMPLATE_OPERATOR'
  ];
  
  // Metodo 1: process.env (funziona in sviluppo)
  if (typeof process !== 'undefined' && process.env) {
    console.log('📦 process.env disponibile');
    envVars.forEach(varName => {
      const value = process.env[varName];
      console.log(`${varName}: ${value ? '✅ ' + value.substring(0, 10) + '...' : '❌ NON TROVATA'}`);
    });
  } else {
    console.log('❌ process.env NON disponibile');
  }
  
  // Metodo 2: window.__ENV (per Cloudflare)
  if (window.__ENV) {
    console.log('\n📦 window.__ENV disponibile:');
    envVars.forEach(varName => {
      const value = window.__ENV[varName];
      console.log(`${varName}: ${value ? '✅' : '❌'}`);
    });
  }
  
  // 3. Test connessione Supabase
  console.log('\n%c🔌 TEST CONNESSIONE SUPABASE:', 'font-weight: bold');
  
  try {
    // Prova a ottenere l'URL Supabase
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || window.__ENV?.REACT_APP_SUPABASE_URL;
    
    if (!supabaseUrl) {
      console.log('❌ URL Supabase non trovato');
    } else {
      console.log('URL Supabase:', supabaseUrl);
      
      // Test CORS con fetch semplice
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'HEAD',
          mode: 'cors',
          headers: {
            'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY || window.__ENV?.REACT_APP_SUPABASE_ANON_KEY || ''
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('✅ Supabase raggiungibile! Status:', response.status);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.log('❌ Errore connessione Supabase:', fetchError.message);
        if (fetchError.message.includes('CORS')) {
          console.log('%c⚠️ PROBABILE PROBLEMA CORS! Configura gli URL in Supabase → Authentication → URL Configuration', 'color: orange');
        }
      }
    }
  } catch (e) {
    console.log('❌ Errore nel test Supabase:', e.message);
  }
  
  // 4. Test EmailJS
  console.log('\n%c📧 TEST EMAILJS:', 'font-weight: bold');
  
  try {
    // Prova a caricare EmailJS dinamicamente
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    
    console.log('✅ Libreria EmailJS caricata');
    
    const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || window.__ENV?.REACT_APP_EMAILJS_PUBLIC_KEY;
    if (publicKey) {
      emailjs.init(publicKey);
      console.log('✅ EmailJS inizializzato con public key');
    } else {
      console.log('❌ Public Key EmailJS non trovata');
    }
    
    // Test service
    const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID || window.__ENV?.REACT_APP_EMAILJS_SERVICE_ID;
    console.log('Service ID:', serviceId ? '✅' : '❌');
    
  } catch (e) {
    console.log('❌ Errore EmailJS:', e.message);
  }
  
  // 5. Test localStorage (importante per offline)
  console.log('\n%c💾 TEST LOCALSTORAGE:', 'font-weight: bold');
  try {
    localStorage.setItem('test', 'ok');
    localStorage.removeItem('test');
    console.log('✅ localStorage funzionante');
  } catch (e) {
    console.log('❌ localStorage NON funzionante:', e.message);
  }
  
  // 6. Riepilogo
  console.log('\n%c📊 RIEPILOGO:', 'font-weight: bold; font-size: 14px');
  console.log('%cSe vedi ❌ su Supabase o EmailJS, il problema è lì', 'color: orange');
  console.log('%cSe vedi ✅ su tutto ma non funziona, potrebbe essere CORS', 'color: orange');
  console.log('%cSe vedi ❌ su tutte le variabili, il problema è su Cloudflare', 'color: red');
  
  console.log('\n✅ Test completato!');
  console.log('%c📌 Ora verifica su Cloudflare: Pages → Settings → Environment variables', 'color: blue');
}

// Auto-esegui se chiamato direttamente
if (typeof window !== 'undefined' && window.__TEST_MODE__) {
  testConfig();
}

export default testConfig;
