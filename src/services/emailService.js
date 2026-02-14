import emailjs from '@emailjs/browser';

// Variabili d'ambiente con debug
console.log('📧 Inizializzazione EmailJS...');
console.log('📧 PUBLIC_KEY presente:', !!process.env.REACT_APP_EMAILJS_PUBLIC_KEY);
console.log('📧 SERVICE_ID presente:', !!process.env.REACT_APP_EMAILJS_SERVICE_ID);
console.log('📧 TEMPLATE_CLIENT presente:', !!process.env.REACT_APP_EMAILJS_TEMPLATE_CLIENT);
console.log('📧 TEMPLATE_OPERATOR presente:', !!process.env.REACT_APP_EMAILJS_TEMPLATE_OPERATOR);

const SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const TEMPLATE_CLIENT = process.env.REACT_APP_EMAILJS_TEMPLATE_CLIENT;
const TEMPLATE_OPERATOR = process.env.REACT_APP_EMAILJS_TEMPLATE_OPERATOR;
const PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

/**
 * Inizializza EmailJS con gestione errori migliorata
 */
export const initEmailJS = () => {
  try {
    if (!PUBLIC_KEY) {
      console.error('❌ EmailJS Public Key mancante! Verifica le variabili d\'ambiente');
      return false;
    }
    
    emailjs.init(PUBLIC_KEY);
    console.log('✅ EmailJS inizializzato correttamente');
    return true;
  } catch (error) {
    console.error('❌ Errore inizializzazione EmailJS:', error);
    return false;
  }
};

/**
 * Verifica che tutti i parametri EmailJS siano configurati
 */
export const checkEmailJSConfig = () => {
  const config = {
    PUBLIC_KEY: !!PUBLIC_KEY,
    SERVICE_ID: !!SERVICE_ID,
    TEMPLATE_CLIENT: !!TEMPLATE_CLIENT,
    TEMPLATE_OPERATOR: !!TEMPLATE_OPERATOR
  };
  
  const isComplete = Object.values(config).every(Boolean);
  
  if (!isComplete) {
    console.warn('⚠️ Configurazione EmailJS incompleta:', config);
  }
  
  return { isComplete, config };
};

/**
 * Invia email al cliente con riepilogo offerta
 */
export const inviaEmailCliente = async (datiCliente, offerta, preContratto) => {
  try {
    // Verifica configurazione
    const { isComplete } = checkEmailJSConfig();
    if (!isComplete) {
      throw new Error('Configurazione EmailJS mancante');
    }
    
    if (!datiCliente.email) {
      throw new Error('Email cliente mancante');
    }
    
    console.log('📧 Invio email cliente a:', datiCliente.email);
    
    const templateParams = {
      to_email: datiCliente.email,
      to_name: `${datiCliente.nome} ${datiCliente.cognome}`,
      
      // Dati offerta
      fornitore_nome: offerta.fornitori?.nome || 'Fornitore',
      nome_offerta: offerta.nome_offerta || 'Offerta personalizzata',
      tipo_fornitura: formatTipoFornitura(offerta.tipo_fornitura),
      
      // Risparmio
      risparmio_annuo: formatCurrency(offerta.risparmioAnnuo || 0),
      risparmio_mensile: formatCurrency((offerta.risparmioAnnuo || 0) / 12),
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
      indirizzo_fornitura: datiCliente.indirizzoFornitura || 'Non specificato',
      citta: datiCliente.cap && datiCliente.citta ? `${datiCliente.cap} ${datiCliente.citta} (${datiCliente.provincia || ''})` : 'Non specificato',
      
      // Footer
      data_richiesta: new Date().toLocaleDateString('it-IT'),
      anno_corrente: new Date().getFullYear()
    };

    console.log('📧 Invio con parametri:', { templateId: TEMPLATE_CLIENT, serviceId: SERVICE_ID });
    
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_CLIENT,
      templateParams
    );

    console.log('✅ Email cliente inviata:', response);
    return { success: true, response };
  } catch (error) {
    console.error('❌ Errore invio email cliente:', error);
    
    // Messaggi di errore più chiari
    let errorMessage = 'Errore nell\'invio dell\'email. ';
    if (error.text) {
      errorMessage += error.text;
    } else if (error.message) {
      errorMessage += error.message;
    }
    
    return { 
      success: false, 
      error: errorMessage,
      details: error
    };
  }
};

/**
 * Invia email all'operatore con nuova pratica
 */
export const inviaEmailOperatore = async (datiCliente, offerta, preContratto, leadId) => {
  try {
    // Verifica configurazione
    const { isComplete } = checkEmailJSConfig();
    if (!isComplete) {
      throw new Error('Configurazione EmailJS mancante');
    }
    
    const emailOperatore = offerta.fornitori?.email_operatore;
    if (!emailOperatore) {
      console.warn('⚠️ Email operatore non disponibile, salto invio');
      return { success: true, skipped: true }; // Non bloccare il flusso
    }
    
    console.log('📧 Invio email operatore a:', emailOperatore);
    
    const templateParams = {
      to_email: emailOperatore,
      
      // Intestazione
      codice_pratica: preContratto?.id ? preContratto.id.substring(0, 8).toUpperCase() : 'N/A',
      data_richiesta: new Date().toLocaleDateString('it-IT'),
      ora_richiesta: new Date().toLocaleTimeString('it-IT'),
      
      // Dati cliente
      nome_completo: `${datiCliente.nome || ''} ${datiCliente.cognome || ''}`.trim() || 'Non specificato',
      email_cliente: datiCliente.email || 'Non fornita',
      telefono_cliente: datiCliente.telefono || 'Non fornito',
      codice_fiscale: datiCliente.codiceFiscale || 'Non fornito',
      
      // Indirizzo fornitura
      indirizzo_completo: datiCliente.indirizzoFornitura ? 
        `${datiCliente.indirizzoFornitura}, ${datiCliente.cap || ''} ${datiCliente.citta || ''} (${datiCliente.provincia || ''})`.trim() : 
        'Non specificato',
      
      // Offerta
      fornitore: offerta.fornitori?.nome || 'Fornitore',
      nome_offerta: offerta.nome_offerta || 'Offerta personalizzata',
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
      link_pannello: leadId ? `https://tuodominio.com/admin/leads/${leadId}` : '#',
      
      // Note
      note_cliente: datiCliente.note || 'Nessuna nota aggiuntiva',
      
      // Info sistema
      lead_id: leadId || 'N/A',
      pre_contratto_id: preContratto?.id || 'N/A'
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_OPERATOR,
      templateParams
    );

    console.log('✅ Email operatore inviata:', response);
    return { success: true, response };
  } catch (error) {
    console.error('❌ Errore invio email operatore:', error);
    
    // Non bloccare il flusso se l'email all'operatore fallisce
    return { 
      success: false, 
      error: error.message,
      skipped: true 
    };
  }
};

/**
 * Invia entrambe le email (cliente e operatore) con fallback
 */
export const inviaEmailComplete = async (datiCliente, offerta, preContratto, leadId) => {
  const risultati = {
    cliente: { success: false },
    operatore: { success: false }
  };

  console.log('📧 Invio email complete per lead:', leadId);
  
  // Verifica connessione internet
  if (!navigator.onLine) {
    console.error('❌ Nessuna connessione internet');
    return {
      success: false,
      message: 'Nessuna connessione internet. Le email verranno inviate automaticamente quando tornerai online.',
      offline: true
    };
  }

  try {
    // Invia email cliente (obbligatoria)
    if (datiCliente.email) {
      risultati.cliente = await inviaEmailCliente(datiCliente, offerta, preContratto);
    } else {
      console.error('❌ Email cliente mancante');
      risultati.cliente.error = 'Email cliente non fornita';
    }
    
    // Invia email operatore (opzionale)
    risultati.operatore = await inviaEmailOperatore(datiCliente, offerta, preContratto, leadId);

    const emailClienteOk = risultati.cliente.success;
    const tutteInviate = emailClienteOk && risultati.operatore.success;

    return {
      success: emailClienteOk, // Almeno l'email cliente è stata inviata
      risultati,
      message: emailClienteOk 
        ? 'Email inviate con successo!'
        : 'Errore nell\'invio delle email. I dati sono stati salvati.',
      offline: false
    };
  } catch (error) {
    console.error('❌ Errore critico invio email:', error);
    return {
      success: false,
      error: error.message,
      risultati,
      offline: false
    };
  }
};

/**
 * Utility functions
 */
function formatCurrency(value) {
  if (value === undefined || value === null) return '€0,00';
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatTipoFornitura(tipo) {
  if (!tipo) return 'Non specificato';
  const map = {
    'luce': 'Solo Luce',
    'gas': 'Solo Gas',
    'dual': 'Luce + Gas'
  };
  return map[tipo] || tipo;
}
