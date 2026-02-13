import emailjs from '@emailjs/browser';

const SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const TEMPLATE_CLIENT = process.env.REACT_APP_EMAILJS_TEMPLATE_CLIENT;
const TEMPLATE_OPERATOR = process.env.REACT_APP_EMAILJS_TEMPLATE_OPERATOR;
const PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

/**
 * Inizializza EmailJS
 */
export const initEmailJS = () => {
  console.log("=== INIT EMAILJS ===");
  console.log("PUBLIC_KEY:", PUBLIC_KEY);

  if (PUBLIC_KEY) {
    emailjs.init(PUBLIC_KEY);
  } else {
    console.error('EmailJS Public Key mancante!');
    alert("ERRORE: PUBLIC_KEY mancante");
  }
};

/**
 * Invia email al cliente con riepilogo offerta (VERSIONE DEBUG)
 */
export const inviaEmailCliente = async (datiCliente, offerta, preContratto) => {
  try {
    console.log("=== INVIO EMAIL CLIENTE ===");
    console.log("SERVICE_ID:", SERVICE_ID);
    console.log("TEMPLATE_CLIENT:", TEMPLATE_CLIENT);

    const templateParams = {
      to_email: datiCliente.email,
      to_name: `${datiCliente.nome} ${datiCliente.cognome}`,
      codice_pratica: preContratto.id.substring(0, 8).toUpperCase(),
      data_richiesta: new Date().toLocaleDateString('it-IT'),
      anno_corrente: new Date().getFullYear()
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_CLIENT,
      templateParams
    );

    console.log("EMAIL CLIENTE INVIATA:", response);
    alert("EMAIL CLIENTE INVIATA CORRETTAMENTE");

    return { success: true, response };

  } catch (error) {
    console.error("ERRORE EMAIL CLIENTE:", error);
    alert("ERRORE EMAIL CLIENTE: " + JSON.stringify(error));
    return { success: false, error: error.message };
  }
};

/**
 * Invia email all'operatore (lasciata invariata per ora)
 */
export const inviaEmailOperatore = async (datiCliente, offerta, preContratto, leadId) => {
  try {
    const templateParams = {
      to_email: offerta.fornitori.email_operatore,
      codice_pratica: preContratto.id.substring(0, 8).toUpperCase(),
      data_richiesta: new Date().toLocaleDateString('it-IT'),
      ora_richiesta: new Date().toLocaleTimeString('it-IT'),
      nome_completo: `${datiCliente.nome} ${datiCliente.cognome}`,
      email_cliente: datiCliente.email,
      telefono_cliente: datiCliente.telefono || 'Non fornito',
      lead_id: leadId
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
 * Invia entrambe le email
 */
export const inviaEmailComplete = async (datiCliente, offerta, preContratto, leadId) => {
  const risultati = {
    cliente: { success: false },
    operatore: { success: false }
  };

  risultati.cliente = await inviaEmailCliente(datiCliente, offerta, preContratto);
  risultati.operatore = await inviaEmailOperatore(datiCliente, offerta, preContratto, leadId);

  const tutteInviate = risultati.cliente.success && risultati.operatore.success;

  return {
    success: tutteInviate,
    risultati,
    message: tutteInviate
      ? 'Email inviate con successo!'
      : 'Alcune email non sono state inviate.'
  };
};
