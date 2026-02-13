import emailjs from '@emailjs/browser';

const SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const TEMPLATE_CLIENT = process.env.REACT_APP_EMAILJS_TEMPLATE_CLIENT;
const TEMPLATE_OPERATOR = process.env.REACT_APP_EMAILJS_TEMPLATE_OPERATOR;
const PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

// Timeout più lunghi per mobile
const MOBILE_TIMEOUT = 30000; // 30 secondi
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY = 2000;

/**
 * Inizializza EmailJS con configurazione ottimizzata per mobile
 */
export const initEmailJS = () => {
  if (PUBLIC_KEY) {
    emailjs.init({
      publicKey: PUBLIC_KEY,
      blockHeadless: false,
      limitRate: {
        throttle: 10000 // 10 secondi tra un invio e l'altro
      }
    });
    
    // Log per debug (solo in sviluppo)
    if (process.env.NODE_ENV === 'development') {
      console.log('EmailJS inizializzato con chiave pubblica');
    }
  } else {
    console.error('EmailJS Public Key mancante! Controlla le variabili d\'ambiente');
  }
};

/**
 * Utility per eseguire una Promise con timeout
 */
const withTimeout = (promise, timeoutMs, errorMessage) => {
  let timeoutId;
  
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage || `Timeout dopo ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => {
    clearTimeout(timeoutId);
  });
};

/**
 * Utility per retry con exponential backoff
 */
const retryOperation = async (operation, maxRetries = RETRY_ATTEMPTS) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`Tentativo ${attempt + 1} fallito:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: aspetta sempre più tempo tra un tentativo e l'altro
      const delay = RETRY_DELAY * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Invia email al cliente con riepilogo offerta
 */
export const inviaEmailCliente = async (datiCliente, offerta, preContratto) => {
  // Validazione input
  if (!datiCliente?.email) {
    console.error('Email cliente mancante');
    return { success: false, error: 'Email cliente non fornita' };
  }

  try {
    const templateParams = {
      to_email: datiCliente.email,
      to_name: `${datiCliente.nome || ''} ${datiCliente.cognome || ''}`.trim() || 'Cliente',
      
      // Dati offerta
      fornitore_nome: offerta?.fornitori?.nome || 'N/D',
      nome_offerta: offerta?.nome_offerta || 'N/D',
      tipo_fornitura: formatTipoFornitura(offerta?.tipo_fornitura),
      
      // Risparmio
      risparmio_annuo: formatCurrency(offerta?.risparmioAnnuo),
      risparmio_mensile: formatCurrency(offerta?.risparmioMensile),
      risparmio_percentuale: offerta?.risparmioPercentuale?.toFixed(1) || '0',
      
      // Prezzi
      spesa_attuale_annua: formatCurrency(offerta?.spesaAttuale),
      spesa_nuova_annua: formatCurrency(offerta?.spesaOfferta),
      spesa_nuova_mensile: formatCurrency(offerta?.spesaOfferta ? offerta.spesaOfferta / 12 : 0),
      
      // Dettagli tecnici
      prezzo_kwh: offerta?.prezzo_kwh ? offerta.prezzo_kwh.toFixed(6) + ' €/kWh' : 'N/A',
      prezzo_smc: offerta?.prezzo_smc ? offerta.prezzo_smc.toFixed(6) + ' €/Smc' : 'N/A',
      quota_fissa_luce: offerta?.quota_fissa_luce_mensile ? formatCurrency(offerta.quota_fissa_luce_mensile) + '/mese' : 'N/A',
      quota_fissa_gas: offerta?.quota_fissa_gas_mensile ? formatCurrency(offerta.quota_fissa_gas_mensile) + '/mese' : 'N/A',
      
      // Condizioni
      durata_contratto: offerta?.durata_mesi ? `${offerta.durata_mesi} mesi` : 'Indeterminato',
      green_energy: offerta?.green_energy ? 'Sì - 100% energia verde' : 'No',
      digitale: offerta?.digitale ? 'Sì - Gestione 100% digitale' : 'No',
      bonus_attivazione: offerta?.bonus_attivazione ? formatCurrency(offerta.bonus_attivazione) : 'Nessuno',
      
      // Dati cliente
      codice_pratica: preContratto?.id ? preContratto.id.substring(0, 8).toUpperCase() : 'N/D',
      indirizzo_fornitura: datiCliente.indirizzoFornitura || 'N/D',
      citta: `${datiCliente.cap || ''} ${datiCliente.citta || ''} (${datiCliente.provincia || ''})`.trim() || 'N/D',
      
      // Footer
      data_richiesta: new Date().toLocaleDateString('it-IT'),
      anno_corrente: new Date().getFullYear()
    };

    console.log('Tentativo invio email cliente a:', datiCliente.email);

    const sendEmail = async () => {
      return await withTimeout(
        emailjs.send(SERVICE_ID, TEMPLATE_CLIENT, templateParams),
        MOBILE_TIMEOUT,
        'Timeout invio email cliente'
      );
    };

    const response = await retryOperation(sendEmail);
    
    console.log('✅ Email cliente inviata con successo:', response.status);
    return { success: true, response };
    
  } catch (error) {
    console.error('❌ Errore invio email cliente:', {
      message: error.message,
      text: error.text,
      status: error.status
    });
    
    // Log per debug
    if (process.env.NODE_ENV === 'development') {
      console.log('Template params:', templateParams);
    }
    
    return { 
      success: false, 
      error: error.message || 'Errore durante l\'invio dell\'email',
      details: error
    };
  }
};

/**
 * Invia email all'operatore con nuova pratica
 */
export const inviaEmailOperatore = async (datiCliente, offerta, preContratto, leadId) => {
  try {
    if (!offerta?.fornitori?.email_operatore) {
      console.error('Email operatore mancante');
      return { success: false, error: 'Email operatore non configurata' };
    }

    const templateParams = {
      to_email: offerta.fornitori.email_operatore,
      
      // Intestazione
      codice_pratica: preContratto?.id ? preContratto.id.substring(0, 8).toUpperCase() : 'N/D',
      data_richiesta: new Date().toLocaleDateString('it-IT'),
      ora_richiesta: new Date().toLocaleTimeString('it-IT'),
      
      // Dati cliente
      nome_completo: `${datiCliente.nome || ''} ${datiCliente.cognome || ''}`.trim() || 'N/D',
      email_cliente: datiCliente.email || 'N/D',
      telefono_cliente: datiCliente.telefono || 'Non fornito',
      codice_fiscale: datiCliente.codiceFiscale || 'N/D',
      
      // Indirizzo fornitura
      indirizzo_completo: `${datiCliente.indirizzoFornitura || ''}, ${datiCliente.cap || ''} ${datiCliente.citta || ''} (${datiCliente.provincia || ''})`.trim() || 'N/D',
      
      // Offerta
      fornitore: offerta?.fornitori?.nome || 'N/D',
      nome_offerta: offerta?.nome_offerta || 'N/D',
      tipo_fornitura: formatTipoFornitura(offerta?.tipo_fornitura),
      
      // Dati tecnici
      codice_pod: datiCliente.codicePod || 'Non fornito',
      codice_pdr: datiCliente.codicePdr || 'Non fornito',
      fornitore_attuale: datiCliente.fornitoreAttuale || 'Non specificato',
      potenza_contrattuale: offerta?.potenza_contrattuale ? `${offerta.potenza_contrattuale} kW` : 'N/A',
      
      // Risparmio
      risparmio_annuo: formatCurrency(offerta?.risparmioAnnuo),
      risparmio_percentuale: offerta?.risparmioPercentuale?.toFixed(1) + '%' || '0%',
      spesa_attuale: formatCurrency(offerta?.spesaAttuale),
      spesa_nuova: formatCurrency(offerta?.spesaOfferta),
      
      // Commissione
      commissione_prevista: formatCurrency(offerta?.commissione),
      
      // Link gestione
      link_pannello: `https://tuodominio.com/admin/leads/${leadId}`,
      
      // Note
      note_cliente: datiCliente.note || 'Nessuna nota aggiuntiva',
      
      // Info sistema
      lead_id: leadId || 'N/D',
      pre_contratto_id: preContratto?.id || 'N/D',
      
      // User agent per debug
      user_agent: navigator?.userAgent || 'N/D'
    };

    console.log('Tentativo invio email operatore');

    const sendEmail = async () => {
      return await withTimeout(
        emailjs.send(SERVICE_ID, TEMPLATE_OPERATOR, templateParams),
        MOBILE_TIMEOUT,
        'Timeout invio email operatore'
      );
    };

    const response = await retryOperation(sendEmail);
    
    console.log('✅ Email operatore inviata con successo:', response.status);
    return { success: true, response };
    
  } catch (error) {
    console.error('❌ Errore invio email operatore:', {
      message: error.message,
      text: error.text,
      status: error.status
    });
    
    return { 
      success: false, 
      error: error.message || 'Errore durante l\'invio dell\'email',
      details: error
    };
  }
};

/**
 * Invia entrambe le email con gestione migliorata
 */
export const inviaEmailComplete = async (datiCliente, offerta, preContratto, leadId) => {
  const risultati = {
    cliente: { success: false },
    operatore: { success: false }
  };

  try {
    // Invia prima email cliente (più importante)
    console.log('📧 Invio email in corso...');
    
    risultati.cliente = await inviaEmailCliente(datiCliente, offerta, preContratto);
    
    if (risultati.cliente.success) {
      console.log('📧 Email cliente inviata, attendo prima di inviare all\'operatore...');
      // Aspetta 3 secondi per evitare rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Invia email operatore
    risultati.operatore = await inviaEmailOperatore(datiCliente, offerta, preContratto, leadId);
    
  } catch (error) {
    console.error('❌ Errore generale invio email:', error);
  }

  const tutteInviate = risultati.cliente.success && risultati.operatore.success;
  const almenoUna = risultati.cliente.success || risultati.operatore.success;

  // Messaggio personalizzato basato sul risultato
  let message = '';
  if (tutteInviate) {
    message = '✅ Email inviate con successo! Riceverai una conferma via email.';
  } else if (risultati.cliente.success) {
    message = '⚠️ Email cliente inviata, ma non è stato possibile contattare l\'operatore. Verrai contattato a breve.';
  } else if (risultati.operatore.success) {
    message = '⚠️ L\'operatore è stato notificato, ma non è stato possibile inviare la conferma al cliente.';
  } else {
    message = '❌ Nessuna email è stata inviata. Verifica la tua connessione e riprova.';
  }

  return {
    success: tutteInviate,
    successPartial: almenoUna,
    risultati,
    message
  };
};

/**
 * Utility functions (invariate)
 */
function formatCurrency(value) {
  if (value === undefined || value === null) return 'N/D';
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatTipoFornitura(tipo) {
  const map = {
    'luce': '⚡ Solo Luce',
    'gas': '🔥 Solo Gas',
    'dual': '⚡🔥 Luce + Gas'
  };
  return map[tipo] || tipo || 'N/D';
}

// Aggiungi anche una funzione di test per debug
export const testEmailConfig = async () => {
  console.log('🔧 Test configurazione EmailJS:', {
    serviceId: SERVICE_ID ? '✅ Configurato' : '❌ Mancante',
    templateClient: TEMPLATE_CLIENT ? '✅ Configurato' : '❌ Mancante',
    templateOperator: TEMPLATE_OPERATOR ? '✅ Configurato' : '❌ Mancante',
    publicKey: PUBLIC_KEY ? '✅ Configurato' : '❌ Mancante'
  });
  
  return {
    configured: !!(SERVICE_ID && TEMPLATE_CLIENT && TEMPLATE_OPERATOR && PUBLIC_KEY)
  };
};
