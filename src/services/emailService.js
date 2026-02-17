import emailjs from 'emailjs-com'

const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
const customerTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_CLIENTE
const operatorTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_AZIENDA
const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

// Inizializza EmailJS
emailjs.init(publicKey)

/**
 * Invia email al cliente con l'offerta
 */
export const sendCustomerEmail = async (data) => {
  try {
    const offerta = data.offerta_selezionata || {}
    const calcolo = data.calcolo_risparmio || {}
    
    const templateParams = {
      // Email destinatario - FONDAMENTALE!
      to_email: data.email,
      
      // Subject
      provider_name: offerta.fornitori?.nome || data.fornitore_nome || '',
      savings_annual: calcolo.risparmio_annuo?.toFixed(2) || '0',
      
      // Saluto
      to_name: data.nome || 'Cliente',
      
      // Risparmio
      risparmio_annuo: `€ ${calcolo.risparmio_annuo?.toFixed(2) || '0'}`,
      risparmio_percentuale: calcolo.risparmio_percentuale?.toFixed(1) || '0',
      risparmio_mensile: `€ ${(calcolo.risparmio_annuo / 12)?.toFixed(2) || '0'}`,
      
      // Dettagli Offerta
      fornitore_nome: offerta.fornitori?.nome || data.fornitore_nome || '',
      nome_offerta: offerta.nome_offerta || '',
      tipo_fornitura: data.tipo_fornitura === 'dual' ? 'Luce + Gas' : 
                      data.tipo_fornitura === 'luce' ? 'Luce' : 'Gas',
      
      // Confronto Spese
      spesa_attuale_mensile: `€ ${data.spesa_mensile_attuale || '0'}`,
      spesa_attuale_annua: `€ ${calcolo.spesa_annua_attuale?.toFixed(2) || '0'}`,
      spesa_nuova_mensile: `€ ${(calcolo.spesa_annua_offerta / 12)?.toFixed(2) || '0'}`,
      spesa_nuova_annua: `€ ${calcolo.spesa_annua_offerta?.toFixed(2) || '0'}`,
      
      // Tariffe
      prezzo_kwh: offerta.prezzo_kwh ? `€ ${offerta.prezzo_kwh.toFixed(4)}/kWh` : 'N/A',
      prezzo_smc: offerta.prezzo_smc ? `€ ${offerta.prezzo_smc.toFixed(4)}/Smc` : 'N/A',
      quota_fissa_luce: offerta.quota_fissa_luce_mensile ? `€ ${offerta.quota_fissa_luce_mensile.toFixed(2)}/mese` : 'N/A',
      quota_fissa_gas: offerta.quota_fissa_gas_mensile ? `€ ${offerta.quota_fissa_gas_mensile.toFixed(2)}/mese` : 'N/A',
      
      // Vantaggi
      green_energy: offerta.green_energy ? 'Energia 100% verde' : 'Energia tradizionale',
      digitale: offerta.digitale ? 'Gestione digitale con app' : 'Gestione tradizionale',
      durata_contratto: offerta.durata_mesi ? `${offerta.durata_mesi} mesi` : 'Non specificato',
      bonus_attivazione: offerta.bonus_attivazione ? `€ ${offerta.bonus_attivazione.toFixed(2)}` : 'Nessun bonus',
      
      // Dati Cliente
      indirizzo_fornitura: data.indirizzo_fornitura || 'Non fornito',
      citta: data.citta ? `${data.citta} (${data.provincia || ''})` : 'Non fornito',
      codice_pratica: data.codice_univoco || '',
      
      // Date
      data_richiesta: new Date().toLocaleDateString('it-IT'),
      anno_corrente: new Date().getFullYear()
    }

    const response = await emailjs.send(
      serviceId,
      customerTemplateId,
      templateParams
    )

    console.log('✅ Email cliente inviata con successo:', response)
    return { success: true, response }
  } catch (error) {
    console.error('❌ Errore invio email cliente:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Invia email all'operatore con i dati del lead
 */
export const sendOperatorEmail = async (data) => {
  try {
    const offerta = data.offerta_selezionata || {}
    const calcolo = data.calcolo_risparmio || {}
    const now = new Date()
    
    const templateParams = {
      // Subject
      lead_code: data.codice_univoco || '',
      
      // Codice Pratica
      codice_pratica: data.codice_univoco || '',
      data_richiesta: now.toLocaleDateString('it-IT'),
      ora_richiesta: now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      
      // Dati Cliente
      nome_completo: `${data.nome || ''} ${data.cognome || ''}`.trim() || 'Non fornito',
      email_cliente: data.email || '',
      telefono_cliente: data.telefono || 'Non fornito',
      codice_fiscale: data.codice_fiscale || 'Non fornito',
      indirizzo_completo: data.indirizzo_fornitura 
        ? `${data.indirizzo_fornitura}, ${data.cap || ''} ${data.citta || ''} (${data.provincia || ''})`
        : 'Non fornito',
      
      // Offerta Proposta
      fornitore: offerta.fornitori?.nome || data.fornitore_nome || 'Non specificato',
      nome_offerta: offerta.nome_offerta || 'Non specificato',
      tipo_fornitura: data.tipo_fornitura === 'dual' ? 'Luce + Gas' : 
                      data.tipo_fornitura === 'luce' ? 'Luce' : 'Gas',
      
      // Risparmio
      risparmio_annuo: `€ ${calcolo.risparmio_annuo?.toFixed(2) || '0'}`,
      risparmio_percentuale: `${calcolo.risparmio_percentuale?.toFixed(1) || '0'}%`,
      
      // Commissione
      commissione_prevista: calcolo.tua_commissione 
        ? `€ ${calcolo.tua_commissione.toFixed(2)}` 
        : 'Da calcolare',
      
      // Dati Tecnici
      codice_pod: data.codice_pod || 'Non fornito',
      codice_pdr: data.codice_pdr || 'Non fornito',
      fornitore_attuale: data.fornitore_attuale || 'Non specificato',
      potenza_contrattuale: data.potenza_contrattuale ? `${data.potenza_contrattuale} kW` : 'Non fornito',
      spesa_attuale: calcolo.spesa_annua_attuale 
        ? `€ ${calcolo.spesa_annua_attuale.toFixed(2)}/anno (€ ${data.spesa_mensile_attuale || 0}/mese)`
        : 'Non fornito',
      spesa_nuova: calcolo.spesa_annua_offerta 
        ? `€ ${calcolo.spesa_annua_offerta.toFixed(2)}/anno (€ ${(calcolo.spesa_annua_offerta / 12).toFixed(2)}/mese)`
        : 'Non calcolato',
      
      // Note
      note_cliente: data.note_cliente || 'Nessuna nota aggiuntiva',
      
      // Link e IDs
      link_pannello: import.meta.env.VITE_APP_URL 
        ? `${import.meta.env.VITE_APP_URL}/admin/leads/${data.codice_univoco || ''}`
        : '#',
      lead_id: data.leadId || 'N/A',
      pre_contratto_id: data.preContrattoId || 'N/A'
    }

    const response = await emailjs.send(
      serviceId,
      operatorTemplateId,
      templateParams
    )

    console.log('✅ Email operatore inviata con successo:', response)
    return { success: true, response }
  } catch (error) {
    console.error('❌ Errore invio email operatore:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Invia entrambe le email (cliente + operatore)
 */
export const sendBothEmails = async (data) => {
  console.log('📧 Inizio invio email...')
  
  const customerResult = await sendCustomerEmail(data)
  const operatorResult = await sendOperatorEmail(data)

  const success = customerResult.success && operatorResult.success
  
  console.log('📊 Risultato invio:', {
    cliente: customerResult.success ? '✅' : '❌',
    operatore: operatorResult.success ? '✅' : '❌'
  })

  return {
    success,
    customerEmail: customerResult,
    operatorEmail: operatorResult
  }
}
