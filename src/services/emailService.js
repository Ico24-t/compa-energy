import emailjs from 'emailjs-com'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_CLIENTE = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_CLIENTE
const TEMPLATE_AZIENDA = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_AZIENDA
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

// Inizializza EmailJS una sola volta
emailjs.init(PUBLIC_KEY)

/**
 * Formatta un importo in euro
 */
const eur = (val) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val || 0)

/**
 * Invia email al CLIENTE
 * Assicurarsi che nel template EmailJS siano presenti le variabili:
 *   {{to_name}}, {{to_email}}, {{codice_pratica}},
 *   {{fornitore_nome}}, {{nome_offerta}}, {{descrizione_offerta}},
 *   {{risparmio_annuo}}, {{risparmio_mensile}}, {{risparmio_percentuale}},
 *   {{spesa_attuale_annua}}, {{spesa_nuova_annua}},
 *   {{spesa_attuale_mensile}}, {{spesa_nuova_mensile}},
 *   {{numero_persone}}, {{tipo_fornitura}},
 *   {{operatore_telefono}}, {{operatore_email}}
 */
export const sendCustomerEmail = async (data) => {
  const templateParams = {
    to_name: `${data.nome || ''} ${data.cognome || ''}`.trim() || 'Cliente',
    to_email: data.email,
    codice_pratica: data.codice_univoco,

    // Offerta
    fornitore_nome: data.fornitore_nome,
    nome_offerta: data.nome_offerta,
    descrizione_offerta: data.descrizione_offerta,
    tipo_fornitura: data.tipo_fornitura?.toUpperCase() || '',
    numero_persone: data.num_persone || '',

    // Confronto spese - formato leggibile
    spesa_attuale_mensile: eur(data.spesa_mensile_attuale_calc),
    spesa_attuale_annua: eur(data.spesa_annua_attuale),
    spesa_nuova_mensile: eur(data.spesa_mensile_offerta),
    spesa_nuova_annua: eur(data.spesa_annua_offerta),

    // Risparmio
    risparmio_annuo: eur(data.risparmio_annuo),
    risparmio_mensile: eur(data.risparmio_mensile),
    risparmio_percentuale: `${(data.risparmio_percentuale || 0).toFixed(1)}%`,

    // Contatti operatore
    operatore_telefono: import.meta.env.VITE_OPERATOR_PHONE,
    operatore_email: import.meta.env.VITE_OPERATOR_EMAIL
  }

  return emailjs.send(SERVICE_ID, TEMPLATE_CLIENTE, templateParams, PUBLIC_KEY)
}

/**
 * Invia email all'OPERATORE/AZIENDA
 * Assicurarsi che nel template EmailJS siano presenti le variabili:
 *   {{codice_pratica}}, {{cliente_nome}}, {{cliente_email}}, {{cliente_telefono}},
 *   {{tipo_cliente}}, {{tipo_fornitura}}, {{numero_persone}},
 *   {{spesa_mensile_attuale}}, {{spesa_annua_attuale}},
 *   {{fornitore_nome}}, {{nome_offerta}},
 *   {{risparmio_annuo}}, {{risparmio_percentuale}},
 *   {{spesa_annua_offerta}}, {{commissione_totale}},
 *   {{indirizzo_fornitura}}, {{cap}}, {{citta}}, {{provincia}},
 *   {{codice_pod}}, {{codice_pdr}},
 *   {{fornitore_attuale}}, {{note_cliente}}
 */
export const sendOperatorEmail = async (data) => {
  const templateParams = {
    codice_pratica: data.codice_univoco,

    // Cliente
    cliente_nome: `${data.nome || ''} ${data.cognome || ''}`.trim(),
    cliente_email: data.email,
    cliente_telefono: data.telefono,
    tipo_cliente: data.tipo_cliente?.toUpperCase() || 'PRIVATO',
    tipo_fornitura: data.tipo_fornitura?.toUpperCase() || '',
    numero_persone: data.num_persone || '',

    // Spesa attuale
    spesa_mensile_attuale: eur(data.spesa_mensile_attuale_calc),
    spesa_annua_attuale: eur(data.spesa_annua_attuale),

    // Offerta proposta
    fornitore_nome: data.fornitore_nome,
    nome_offerta: data.nome_offerta,
    spesa_annua_offerta: eur(data.spesa_annua_offerta),
    risparmio_annuo: eur(data.risparmio_annuo),
    risparmio_percentuale: `${(data.risparmio_percentuale || 0).toFixed(1)}%`,

    // Commissione operatore
    commissione_totale: eur(data.tua_commissione),

    // Anagrafica e fornitura
    indirizzo_fornitura: data.indirizzo_fornitura || '',
    cap: data.cap || '',
    citta: data.citta || '',
    provincia: data.provincia || '',
    codice_pod: data.codice_pod || 'Non fornito',
    codice_pdr: data.codice_pdr || 'Non fornito',
    fornitore_attuale: data.fornitore_attuale || 'Non specificato',
    note_cliente: data.note_cliente || 'Nessuna nota'
  }

  return emailjs.send(SERVICE_ID, TEMPLATE_AZIENDA, templateParams, PUBLIC_KEY)
}

/**
 * Invia entrambe le email in parallelo
 */
export const sendBothEmails = async (data) => {
  const results = await Promise.allSettled([
    sendCustomerEmail(data),
    sendOperatorEmail(data)
  ])

  const errors = results
    .filter(r => r.status === 'rejected')
    .map(r => r.reason?.text || r.reason?.message || 'Errore sconosciuto')

  if (errors.length > 0) {
    console.error('Errori invio email:', errors)
    // Non blocchiamo il flusso se una email fallisce, logghiamo solo
  }

  return results
}
