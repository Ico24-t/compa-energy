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
    emailjs.init(PUBLIC_KEY);
  } else {
    console.error('EmailJS Public Key mancante!');
  }
};

/**
 * Invia email al cliente con riepilogo offerta
 */
export const inviaEmailCliente = async (datiCliente, offerta, preContratto) => {
  try {
    const templateParams = {
      to_email: datiCliente.email,
      to_name: `${datiCliente.nome} ${datiCliente.cognome}`,
      
      // Dati offerta
      fornitore_nome: offerta.fornitori.nome,
      nome_offerta: offerta.nome_offerta,
      tipo_fornitura: formatTipoFornitura(offerta.tipo_fornitura),
      
      // Risparmio
      risparmio_annuo: formatCurrency(offerta.risparmioAnnuo),
      risparmio_mensile: formatCurrency(offerta.risparmioMensile),
      risparmio_percentuale: offerta.risparmioPercentuale.toFixed(1),
      
      // Prezzi
      spesa_attuale_annua: formatCurrency(offerta.spesaAttuale),
      spesa_nuova_annua: formatCurrency(offerta.spesaOfferta),
      spesa_nuova_mensile: formatCurrency(offerta.spesaOfferta / 12),
      
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
      codice_pratica: preContratto.id.substring(0, 8).toUpperCase(),
      indirizzo_fornitura: datiCliente.indirizzoFornitura,
      citta: `${datiCliente.cap} ${datiCliente.citta} (${datiCliente.provincia})`,
      
      // Footer
      data_richiesta: new Date().toLocaleDateString('it-IT'),
      anno_corrente: new Date().getFullYear()
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_CLIENT,
      templateParams
    );

    console.log('Email cliente inviata:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Errore invio email cliente:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Invia email all'operatore con nuova pratica
 */
export const inviaEmailOperatore = async (datiCliente, offerta, preContratto, leadId) => {
  try {
    const templateParams = {
      to_email: offerta.fornitori.email_operatore,
      
      // Intestazione
      codice_pratica: preContratto.id.substring(0, 8).toUpperCase(),
      data_richiesta: new Date().toLocaleDateString('it-IT'),
      ora_richiesta: new Date().toLocaleTimeString('it-IT'),
      
      // Dati cliente
      nome_completo: `${datiCliente.nome} ${datiCliente.cognome}`,
      email_cliente: datiCliente.email,
      telefono_cliente: datiCliente.telefono || 'Non fornito',
      codice_fiscale: datiCliente.codiceFiscale,
      
      // Indirizzo fornitura
      indirizzo_completo: `${datiCliente.indirizzoFornitura}, ${datiCliente.cap} ${datiCliente.citta} (${datiCliente.provincia})`,
      
      // Offerta
      fornitore: offerta.fornitori.nome,
      nome_offerta: offerta.nome_offerta,
      tipo_fornitura: formatTipoFornitura(offerta.tipo_fornitura),
      
      // Dati tecnici
      codice_pod: datiCliente.codicePod || 'Non fornito',
      codice_pdr: datiCliente.codicePdr || 'Non fornito',
      fornitore_attuale: datiCliente.fornitoreAttuale || 'Non specificato',
      potenza_contrattuale: offerta.potenza_contrattuale ? `${offerta.potenza_contrattuale} kW` : 'N/A',
      
      // Risparmio
      risparmio_annuo: formatCurrency(offerta.risparmioAnnuo),
      risparmio_percentuale: offerta.risparmioPercentuale.toFixed(1) + '%',
      spesa_attuale: formatCurrency(offerta.spesaAttuale),
      spesa_nuova: formatCurrency(offerta.spesaOfferta),
      
      // Commissione (visibile solo internamente)
      commissione_prevista: formatCurrency(offerta.commissione),
      
      // Link gestione (da configurare)
      link_pannello: `https://tuodominio.com/admin/leads/${leadId}`,
      
      // Note
      note_cliente: datiCliente.note || 'Nessuna nota aggiuntiva',
      
      // Info sistema
      lead_id: leadId,
      pre_contratto_id: preContratto.id
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_OPERATOR,
      templateParams
    );

    console.log('Email operatore inviata:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Errore invio email operatore:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Invia entrambe le email (cliente e operatore)
 */
export const inviaEmailComplete = async (datiCliente, offerta, preContratto, leadId) => {
  const risultati = {
    cliente: { success: false },
    operatore: { success: false }
  };

  // Invia email cliente
  risultati.cliente = await inviaEmailCliente(datiCliente, offerta, preContratto);
  
  // Invia email operatore
  risultati.operatore = await inviaEmailOperatore(datiCliente, offerta, preContratto, leadId);

  const tutteInviate = risultati.cliente.success && risultati.operatore.success;

  return {
    success: tutteInviate,
    risultati,
    message: tutteInviate 
      ? 'Email inviate con successo!'
      : 'Alcune email non sono state inviate. Contatta il supporto.'
  };
};

/**
 * Utility functions
 */
function formatCurrency(value) {
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
