import emailjs from '@emailjs/browser';

const SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const TEMPLATE_CLIENT = process.env.REACT_APP_EMAILJS_TEMPLATE_CLIENT;
const TEMPLATE_OPERATOR = process.env.REACT_APP_EMAILJS_TEMPLATE_OPERATOR;
const PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

/**
 * Inizializza EmailJS
 */
export const initEmailJS = () => {
  if (PUBLIC_KEY) {
    emailjs.init({
      publicKey: PUBLIC_KEY,
      blockHeadless: false,
      limitRate: {
        throttle: 10000
      }
    });
  } else {
    console.error('EmailJS Public Key mancante!');
  }
};

/**
 * Invia email al cliente con riepilogo offerta
 */
export const inviaEmailCliente = async (datiCliente, offerta, preContratto) => {
  try {
    // Log per debug
    console.log('📱 inviaEmailCliente - Dati ricevuti:', { 
      datiCliente: !!datiCliente, 
      offerta: !!offerta, 
      preContratto: !!preContratto 
    });

    const templateParams = {
      to_email: datiCliente?.email || 'cliente@email.it',
      to_name: `${datiCliente?.nome || ''} ${datiCliente?.cognome || ''}`.trim() || 'Cliente',
      
      // Dati offerta
      fornitore_nome: offerta?.fornitori?.nome || 'Fornitore',
      nome_offerta: offerta?.nome_offerta || 'Offerta',
      tipo_fornitura: formatTipoFornitura(offerta?.tipo_fornitura),
      
      // Risparmio
      risparmio_annuo: formatCurrency(offerta?.risparmioAnnuo),
      risparmio_mensile: formatCurrency(offerta?.risparmioMensile),
      risparmio_percentuale: offerta?.risparmioPercentuale ? offerta.risparmioPercentuale.toFixed(1) : '0',
      
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
      codice_pratica: preContratto?.id ? preContratto.id.substring(0, 8).toUpperCase() : 'PRATICA_' + Date.now(),
      indirizzo_fornitura: datiCliente?.indirizzoFornitura || 'Indirizzo non specificato',
      citta: `${datiCliente?.cap || ''} ${datiCliente?.citta || ''} (${datiCliente?.provincia || ''})`.trim() || 'Città non specificata',
      
      // Footer
      data_richiesta: new Date().toLocaleDateString('it-IT'),
      anno_corrente: new Date().getFullYear()
    };

    console.log('📱 Invio email cliente con parametri:', templateParams);

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_CLIENT,
      templateParams
    );

    console.log('✅ Email cliente inviata:', response);
    return { success: true, response };
  } catch (error) {
    console.error('❌ Errore invio email cliente:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Invia email all'operatore con nuova pratica
 */
export const inviaEmailOperatore = async (datiCliente, offerta, preContratto, leadId) => {
  try {
    // Log per debug
    console.log('📱 inviaEmailOperatore - Dati ricevuti:', { 
      datiCliente: !!datiCliente, 
      offerta: !!offerta, 
      preContratto: !!preContratto,
      leadId 
    });

    const templateParams = {
      to_email: offerta?.fornitori?.email_operatore || 'operatore@email.it',
      
      // Intestazione
      codice_pratica: preContratto?.id ? preContratto.id.substring(0, 8).toUpperCase() : 'PRATICA_' + Date.now(),
      data_richiesta: new Date().toLocaleDateString('it-IT'),
      ora_richiesta: new Date().toLocaleTimeString('it-IT'),
      
      // Dati cliente
      nome_completo: `${datiCliente?.nome || ''} ${datiCliente?.cognome || ''}`.trim() || 'Cliente',
      email_cliente: datiCliente?.email || 'non fornita',
      telefono_cliente: datiCliente?.telefono || 'Non fornito',
      codice_fiscale: datiCliente?.codiceFiscale || 'Non fornito',
      
      // Indirizzo fornitura
      indirizzo_completo: `${datiCliente?.indirizzoFornitura || ''}, ${datiCliente?.cap || ''} ${datiCliente?.citta || ''} (${datiCliente?.provincia || ''})`.trim() || 'Indirizzo non specificato',
      
      // Offerta
      fornitore: offerta?.fornitori?.nome || 'Fornitore',
      nome_offerta: offerta?.nome_offerta || 'Offerta',
      tipo_fornitura: formatTipoFornitura(offerta?.tipo_fornitura),
      
      // Dati tecnici
      codice_pod: datiCliente?.codicePod || 'Non fornito',
      codice_pdr: datiCliente?.codicePdr || 'Non fornito',
      fornitore_attuale: datiCliente?.fornitoreAttuale || 'Non specificato',
      potenza_contrattuale: offerta?.potenza_contrattuale ? `${offerta.potenza_contrattuale} kW` : 'N/A',
      
      // Risparmio
      risparmio_annuo: formatCurrency(offerta?.risparmioAnnuo),
      risparmio_percentuale: offerta?.risparmioPercentuale ? offerta.risparmioPercentuale.toFixed(1) + '%' : '0%',
      spesa_attuale: formatCurrency(offerta?.spesaAttuale),
      spesa_nuova: formatCurrency(offerta?.spesaOfferta),
      
      // Commissione (visibile solo internamente)
      commissione_prevista: formatCurrency(offerta?.commissione),
      
      // Link gestione (da configurare)
      link_pannello: `https://tuodominio.com/admin/leads/${leadId || 'nuovo'}`,
      
      // Note
      note_cliente: datiCliente?.note || 'Nessuna nota aggiuntiva',
      
      // Info sistema
      lead_id: leadId || 'N/D',
      pre_contratto_id: preContratto?.id || 'N/D'
    };

    console.log('📱 Invio email operatore con parametri:', templateParams);

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_OPERATOR,
      templateParams
    );

    console.log('✅ Email operatore inviata:', response);
    return { success: true, response };
  } catch (error) {
    console.error('❌ Errore invio email operatore:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Invia entrambe le email (cliente e operatore)
 */
export const inviaEmailComplete = async (datiCliente, offerta, preContratto, leadId) => {
  console.log('📱 inviaEmailComplete - Inizio procedura');
  
  const risultati = {
    cliente: { success: false },
    operatore: { success: false }
  };

  try {
    // PRIMA L'OPERATORE (più importante)
    console.log('📱 Invio email operatore...');
    risultati.operatore = await inviaEmailOperatore(datiCliente, offerta, preContratto, leadId);
    
    if (risultati.operatore.success) {
      console.log('📱 Email operatore inviata, aspetto 2 secondi...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // POI IL CLIENTE
      console.log('📱 Invio email cliente...');
      risultati.cliente = await inviaEmailCliente(datiCliente, offerta, preContratto);
    } else {
      console.log('📱 Email operatore fallita, provo comunque con cliente');
      risultati.cliente = await inviaEmailCliente(datiCliente, offerta, preContratto);
    }
    
  } catch (error) {
    console.error('❌ Errore generale invio email:', error);
  }

  const tutteInviate = risultati.cliente.success && risultati.operatore.success;
  const almenoOperatore = risultati.operatore.success;

  console.log('📱 Risultato finale:', { tutteInviate, almenoOperatore, risultati });

  return {
    success: tutteInviate,
    risultati,
    message: tutteInviate 
      ? 'Email inviate con successo!'
      : almenoOperatore
        ? 'Operatore notificato, ma email cliente non inviata'
        : 'Alcune email non sono state inviate. Contatta il supporto.'
  };
};

/**
 * Utility functions
 */
function formatCurrency(value) {
  if (value === undefined || value === null || isNaN(value)) return '€ 0,00';
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatTipoFornitura(tipo) {
  const map = {
    'luce': 'Solo Luce',
    'gas': 'Solo Gas',
    'dual': 'Luce + Gas'
  };
  return map[tipo] || tipo || 'Non specificato';
}
