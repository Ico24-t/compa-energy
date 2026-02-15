import emailjs from 'emailjs-com'

const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
const customerTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_CUSTOMER
const operatorTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_OPERATOR
const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

// Inizializza EmailJS
emailjs.init(publicKey)

/**
 * Invia email al cliente con l'offerta
 */
export const sendCustomerEmail = async (data) => {
  try {
    const templateParams = {
      to_email: data.email,
      customer_name: data.nome || 'Cliente',
      offer_type: data.tipo_fornitura === 'dual' ? 'Luce + Gas' : 
                  data.tipo_fornitura === 'luce' ? 'Luce' : 'Gas',
      annual_savings: data.risparmio_annuo?.toFixed(2) || '0',
      current_cost: data.spesa_annua_attuale?.toFixed(2) || '0',
      new_cost: data.spesa_annua_offerta?.toFixed(2) || '0',
      supplier_name: data.fornitore_nome || '',
      offer_details: data.descrizione_offerta || '',
      lead_code: data.codice_univoco || ''
    }

    const response = await emailjs.send(
      serviceId,
      customerTemplateId,
      templateParams
    )

    console.log('Email cliente inviata con successo:', response)
    return { success: true, response }
  } catch (error) {
    console.error('Errore invio email cliente:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Invia email all'operatore con i dati del lead
 */
export const sendOperatorEmail = async (data) => {
  try {
    const templateParams = {
      to_email: import.meta.env.VITE_OPERATOR_EMAIL,
      lead_code: data.codice_univoco || '',
      customer_name: `${data.nome || ''} ${data.cognome || ''}`.trim() || 'Non fornito',
      customer_email: data.email || '',
      customer_phone: data.telefono || 'Non fornito',
      customer_type: data.tipo_cliente === 'privato' ? 'Privato' : 
                     data.tipo_cliente === 'p_iva' ? 'P.IVA' : 'Azienda',
      service_type: data.tipo_fornitura === 'dual' ? 'Luce + Gas' : 
                    data.tipo_fornitura === 'luce' ? 'Luce' : 'Gas',
      annual_consumption_kwh: data.consumo_annuo_kwh || 'N/A',
      annual_consumption_smc: data.consumo_annuo_smc || 'N/A',
      current_monthly_cost: data.spesa_mensile_attuale || 'N/A',
      annual_savings: data.risparmio_annuo?.toFixed(2) || '0',
      supplier_name: data.fornitore_nome || '',
      address: data.indirizzo_fornitura || 'Non fornito',
      city: data.citta || '',
      province: data.provincia || '',
      notes: data.note_cliente || 'Nessuna nota',
      created_at: new Date().toLocaleString('it-IT')
    }

    const response = await emailjs.send(
      serviceId,
      operatorTemplateId,
      templateParams
    )

    console.log('Email operatore inviata con successo:', response)
    return { success: true, response }
  } catch (error) {
    console.error('Errore invio email operatore:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Invia entrambe le email (cliente + operatore)
 */
export const sendBothEmails = async (data) => {
  const customerResult = await sendCustomerEmail(data)
  const operatorResult = await sendOperatorEmail(data)

  return {
    success: customerResult.success && operatorResult.success,
    customerEmail: customerResult,
    operatorEmail: operatorResult
  }
}
