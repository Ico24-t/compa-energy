import emailjs from '@emailjs/browser';

const SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const TEMPLATE_CLIENT = process.env.REACT_APP_EMAILJS_TEMPLATE_CLIENT;
const TEMPLATE_OPERATOR = process.env.REACT_APP_EMAILJS_TEMPLATE_OPERATOR;
const PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

// Configurazione retry
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 secondi
const TIMEOUT = 30000; // 30 secondi timeout

/**
 * Inizializza EmailJS con configurazione ottimizzata per mobile
 */
export const initEmailJS = () => {
  if (PUBLIC_KEY) {
    emailjs.init({
      publicKey: PUBLIC_KEY,
      blockHeadless: true,
      limitRate: {
        throttle: 10000, // 10 secondi tra richieste
      }
    });
    console.log('✅ EmailJS inizializzato correttamente');
  } else {
    console.error('❌ EmailJS Public Key mancante!');
  }
};

/**
 * Utility: Sleep function per retry
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Utility: Verifica connessione internet
 */
const checkInternetConnection = () => {
  return navigator.onLine;
};

/**
 * Wrapper per invio email con timeout e retry
 */
const sendEmailWithRetry = async (serviceId, templateId, templateParams, retries = MAX_RETRIES) => {
  // Verifica connessione
  if (!checkInternetConnection()) {
    throw new Error('Nessuna connessione internet. Controlla la tua rete.');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📧 Tentativo ${attempt}/${retries} invio email...`);
      
      // Crea promise con timeout
      const emailPromise = emailjs.send(serviceId, templateId, templateParams);
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: email non inviata entro 30 secondi')), TIMEOUT);
      });

      // Race tra invio email e timeout
      const response = await Promise.race([emailPromise, timeoutPromise]);
      
      console.log(`✅ Email inviata con successo! Status: ${response.status}`);
      return { success: true, response, attempt };

    } catch (error) {
      console.error(`❌ Tentativo ${attempt} fallito:`, error.message);
      
      // Se è l'ultimo tentativo, lancia l'errore
      if (attempt === retries) {
        throw new Error(`Impossibile inviare email dopo ${retries} tentativi: ${error.message}`);
      }
      
      // Altrimenti aspetta prima del prossimo tentativo
      console.log(`⏳ Attendo ${RETRY_DELAY / 1000}s prima del prossimo tentativo...`);
      await sleep(RETRY_DELAY * attempt); // Backoff esponenziale
    }
  }
};

/**
 * Invia email al cliente con riepilogo offerta
 */
export const inviaEmailCliente = async (datiCliente, offerta, preContratto) => {
  try {
    // Validazione parametri
    if (!datiCliente?.email) {
      throw new Error('Email cliente mancante');
    }
    if (!SERVICE_ID || !TEMPLATE_CLIENT) {
      throw new Error('Configurazione EmailJS incompleta (SERVICE_ID o TEMPLATE_CLIENT)');
    }

    console.log('📨 Preparazione email cliente per:', datiCliente.email);

    const templateParams = {
      to_email: datiCliente.email,
      to_name: `${datiCliente.nome} ${datiCliente.cognome}`,
      
      // Dati offerta
      fornitore_nome: offerta.fornitori?.nome || 'N/A',
      nome_offerta: offerta.nome_offerta || 'N/A',
      tipo_fornitura: formatTipoFornitura(offerta.tipo_fornitura),
      
      // Risparmio
      risparmio_annuo: formatCurrency(offerta.risparmioAnnuo || 0),
      risparmio_mensile: formatCurrency(offerta.risparmioMensile || 0),
      risparmio_percentuale: (offerta.risparmioPercentuale || 0).toFixed(1),
      
      // Prezzi
      spesa_attuale_annua: formatCurrency(offerta.spesaAttuale || 0),
      spesa_nuova_annua: formatCurrency(offerta.spesaOfferta || 0),
      spesa_nuova_mensile: formatCurrency((offerta.spesaOfferta || 0) / 12),
      
      // Dettagli tecnici
      prezzo_kwh: offerta.prezzo_kwh ? offerta.prezzo_kwh.toFixed(6) + ' €/kWh' : 'N/A',
      prezzo_smc: offerta.prezzo_smc ? offerta.prezzo_smc.toFixed(6) + ' €/Smc' : 'N/A',
      quota_fissa_luce: offerta.quota_fissa_luce_mensile ? formatCurrency(offerta.quota_fissa_luce_mensile) + '/mese' : 'N/A',
      quota_fissa_gas: offerta.quota_fissa_gas_mensile ? formatCurrency(offerta.quota_fissa_gas_mensile) + '/mese' : 'N/A',
      
      // Condizioni
      durata_contratto: offerta.durata_mesi ? `${offerta.durata_mesi} mesi` : 'Indeterminato',
      green_energy: offerta.green_energy ? 'Sì - 100% energia verde' : 'No',
      digitale: offerta.digitale ? 'Sì - Gestione 100% digitale' : 'No',
      bonus_attivazione: offerta.bonus_attivazione ? formatCurrency(offerta.bonus_attivazione) : 'Nessuno',
      
      // Dati cliente
      codice_pratica: preContratto?.id ? preContratto.id.substring(0, 8).toUpperCase() : 'N/A',
      indirizzo_fornitura: datiCliente.indirizzoFornitura || 'N/A',
      citta: `${datiCliente.cap || ''} ${datiCliente.citta || ''} (${datiCliente.provincia || ''})`,
      
      // Footer
      data_richiesta: new Date().toLocaleDateString('it-IT'),
      anno_corrente: new Date().getFullYear()
    };

    const result = await sendEmailWithRetry(SERVICE_ID, TEMPLATE_CLIENT, templateParams);
    
    return { 
      success: true, 
      response: result.response, 
      message: 'Email cliente inviata con successo',
      attempts: result.attempt 
    };

  } catch (error) {
    console.error('❌ Errore critico invio email cliente:', error);
    return { 
      success: false, 
      error: error.message,
      code: 'EMAIL_CLIENT_FAILED'
    };
  }
};

/**
 * Invia email all'operatore con nuova pratica
 */
export const inviaEmailOperatore = async (datiCliente, offerta, preContratto, leadId) => {
  try {
    // Validazione parametri
    if (!offerta?.fornitori?.email_operatore) {
      throw new Error('Email operatore mancante');
    }
    if (!SERVICE_ID || !TEMPLATE_OPERATOR) {
      throw new Error('Configurazione EmailJS incompleta (SERVICE_ID o TEMPLATE_OPERATOR)');
    }

    console.log('📨 Preparazione email operatore per:', offerta.fornitori.email_operatore);

    const templateParams = {
      to_email: offerta.fornitori.email_operatore,
      
      // Intestazione
      codice_pratica: preContratto?.id ? preContratto.id.substring(0, 8).toUpperCase() : 'N/A',
      data_richiesta: new Date().toLocaleDateString('it-IT'),
      ora_richiesta: new Date().toLocaleTimeString('it-IT'),
      
      // Dati cliente
      nome_completo: `${datiCliente.nome || ''} ${datiCliente.cognome || ''}`,
      email_cliente: datiCliente.email || 'N/A',
      telefono_cliente: datiCliente.telefono || 'Non fornito',
      codice_fiscale: datiCliente.codiceFiscale || 'N/A',
      
      // Indirizzo fornitura
      indirizzo_completo: `${datiCliente.indirizzoFornitura || ''}, ${datiCliente.cap || ''} ${datiCliente.citta || ''} (${datiCliente.provincia || ''})`,
      
      // Offerta
      fornitore: offerta.fornitori?.nome || 'N/A',
      nome_offerta: offerta.nome_offerta || 'N/A',
      tipo_fornitura: formatTipoFornitura(offerta.tipo_fornitura),
      
      // Dati tecnici
      codice_pod: datiCliente.codicePod || 'Non fornito',
      codice_pdr: datiCliente.codicePdr || 'Non fornito',
      fornitore_attuale: datiCliente.fornitoreAttuale || 'Non specificato',
      potenza_contrattuale: offerta.potenza_contrattuale ? `${offerta.potenza_contrattuale} kW` : 'N/A',
      
      // Risparmio
      risparmio_annuo: formatCurrency(offerta.risparmioAnnuo || 0),
      risparmio_percentuale: (offerta.risparmioPercentuale || 0).toFixed(1) + '%',
      spesa_attuale: formatCurrency(offerta.spesaAttuale || 0),
      spesa_nuova: formatCurrency(offerta.spesaOfferta || 0),
      
      // Commissione (visibile solo internamente)
      commissione_prevista: formatCurrency(offerta.commissione || 0),
      
      // Link gestione
      link_pannello: `https://tuodominio.com/admin/leads/${leadId || 'unknown'}`,
      
      // Note
      note_cliente: datiCliente.note || 'Nessuna nota aggiuntiva',
      
      // Info sistema
      lead_id: leadId || 'N/A',
      pre_contratto_id: preContratto?.id || 'N/A'
    };

    const result = await sendEmailWithRetry(SERVICE_ID, TEMPLATE_OPERATOR, templateParams);
    
    return { 
      success: true, 
      response: result.response,
      message: 'Email operatore inviata con successo',
      attempts: result.attempt
    };

  } catch (error) {
    console.error('❌ Errore critico invio email operatore:', error);
    return { 
      success: false, 
      error: error.message,
      code: 'EMAIL_OPERATOR_FAILED'
    };
  }
};

/**
 * Invia entrambe le email (cliente e operatore) con gestione errori migliorata
 */
export const inviaEmailComplete = async (datiCliente, offerta, preContratto, leadId) => {
  console.log('🚀 Inizio invio email complete...');
  
  const risultati = {
    cliente: { success: false, message: 'Non ancora inviata' },
    operatore: { success: false, message: 'Non ancora inviata' }
  };

  try {
    // STEP 1: Invia email cliente
    console.log('📧 STEP 1/2: Invio email cliente...');
    risultati.cliente = await inviaEmailCliente(datiCliente, offerta, preContratto);
    
    if (risultati.cliente.success) {
      console.log(`✅ Email cliente inviata (${risultati.cliente.attempts} tentativi)`);
    } else {
      console.warn('⚠️ Email cliente non inviata:', risultati.cliente.error);
    }

    // STEP 2: Invia email operatore
    console.log('📧 STEP 2/2: Invio email operatore...');
    risultati.operatore = await inviaEmailOperatore(datiCliente, offerta, preContratto, leadId);
    
    if (risultati.operatore.success) {
      console.log(`✅ Email operatore inviata (${risultati.operatore.attempts} tentativi)`);
    } else {
      console.warn('⚠️ Email operatore non inviata:', risultati.operatore.error);
    }

    // Verifica risultati
    const tutteInviate = risultati.cliente.success && risultati.operatore.success;
    const almenoUnaInviata = risultati.cliente.success || risultati.operatore.success;

    let message = '';
    if (tutteInviate) {
      message = '✅ Tutte le email sono state inviate con successo!';
    } else if (almenoUnaInviata) {
      message = '⚠️ Alcune email sono state inviate. Contatteremo comunque il cliente.';
    } else {
      message = '❌ Errore nell\'invio delle email. I dati sono stati salvati e ti contatteremo.';
    }

    return {
      success: tutteInviate, // Solo true se ENTRAMBE inviate
      partial: almenoUnaInviata && !tutteInviate, // True se almeno una inviata
      risultati,
      message,
      details: {
        clienteInviata: risultati.cliente.success,
        operatoreInviata: risultati.operatore.success
      }
    };

  } catch (error) {
    console.error('❌ Errore generale invio email:', error);
    return {
      success: false,
      partial: false,
      risultati,
      message: 'Errore tecnico nell\'invio delle email. I dati sono stati comunque salvati.',
      error: error.message
    };
  }
};

/**
 * Utility functions
 */
function formatCurrency(value) {
  if (value === null || value === undefined) return '€ 0,00';
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
}

function formatTipoFornitura(tipo) {
  const map = {
    'luce': 'Solo Luce',
    'gas': 'Solo Gas',
    'dual': 'Luce + Gas'
  };
  return map[tipo] || tipo;
}
