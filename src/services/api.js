import { supabase } from './supabase'

/**
 * LEADS - Gestione dei potenziali clienti
 */

export const createLead = async (leadData) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .insert([{
        email: leadData.email,
        tipo_cliente: leadData.tipo_cliente,
        stato: 'solo_email',
        origine: leadData.origine || 'form_manuale',
        dispositivo: leadData.dispositivo || 'mobile',
        privacy_acconsentito: leadData.privacy_acconsentito || false,
        marketing_acconsentito: leadData.marketing_acconsentito || false,
        data_consenso: new Date().toISOString(),
        fonte_utm: leadData.fonte_utm,
        campagna_utm: leadData.campagna_utm,
        medium_utm: leadData.medium_utm,
        user_agent: navigator.userAgent,
        ip_address: leadData.ip_address
      }])
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Errore creazione lead:', error)
    return { success: false, error: error.message }
  }
}

export const updateLeadStatus = async (leadId, newStatus, additionalData = {}) => {
  try {
    const updateData = {
      stato: newStatus,
      data_ultimo_contatto: new Date().toISOString(),
      ...additionalData
    }

    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', leadId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Errore aggiornamento lead:', error)
    return { success: false, error: error.message }
  }
}

export const getLeadByEmail = async (email) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return { success: true, data: data || null }
  } catch (error) {
    console.error('Errore ricerca lead:', error)
    return { success: false, error: error.message }
  }
}

/**
 * CONSUMI - Gestione dati di consumo
 */

export const saveConsumption = async (consumptionData) => {
  try {
    const { data, error } = await supabase
      .from('consumi_cliente')
      .insert([consumptionData])
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Errore salvataggio consumi:', error)
    return { success: false, error: error.message }
  }
}

/**
 * OFFERTE - Recupero offerte disponibili
 */

export const getAvailableOffers = async (filters = {}) => {
  try {
    let query = supabase
      .from('offerte')
      .select(`
        *,
        fornitori (
          id,
          nome,
          logo_url,
          sito_web,
          rating_fornitore,
          tempo_attivazione_medio
        ),
        commissioni (
          tipo_commissione,
          importo_fisso,
          percentuale,
          bonus_dual,
          bonus_verde
        )
      `)
      .eq('visibile', true)
      .lte('data_inizio', new Date().toISOString().split('T')[0])
      .or(`data_fine.is.null,data_fine.gte.${new Date().toISOString().split('T')[0]}`)

    // Applica filtri
    if (filters.tipo_fornitura) {
      query = query.eq('tipo_fornitura', filters.tipo_fornitura)
    }

    query = query.order('priorita_visualizzazione', { ascending: false })

    const { data, error } = await query

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Errore recupero offerte:', error)
    return { success: false, error: error.message }
  }
}

export const getOfferById = async (offerId) => {
  try {
    const { data, error } = await supabase
      .from('offerte')
      .select(`
        *,
        fornitori (
          id,
          nome,
          logo_url,
          sito_web,
          rating_fornitore,
          tempo_attivazione_medio,
          email_operatore,
          telefono_operatore
        ),
        commissioni (
          tipo_commissione,
          importo_fisso,
          percentuale,
          bonus_dual,
          bonus_verde,
          bonus_attivazione_rapida
        )
      `)
      .eq('id', offerId)
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Errore recupero offerta:', error)
    return { success: false, error: error.message }
  }
}

/**
 * CALCOLO OFFERTA - Salva calcoli e commissioni
 */

export const saveOfferCalculation = async (calculationData) => {
  try {
    const { data, error } = await supabase
      .from('calcolo_offerta')
      .insert([calculationData])
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Errore salvataggio calcolo:', error)
    return { success: false, error: error.message }
  }
}

/**
 * PRE-CONTRATTI - Gestione dati anagrafici e contratti
 */

export const createPreContract = async (contractData) => {
  try {
    const { data, error } = await supabase
      .from('pre_contratti')
      .insert([{
        ...contractData,
        stato: 'bozza'
      }])
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Errore creazione pre-contratto:', error)
    return { success: false, error: error.message }
  }
}

export const updatePreContract = async (contractId, updates) => {
  try {
    const { data, error } = await supabase
      .from('pre_contratti')
      .update(updates)
      .eq('id', contractId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Errore aggiornamento pre-contratto:', error)
    return { success: false, error: error.message }
  }
}

/**
 * UTILITIES - Funzioni di supporto
 */

export const trackDeviceInfo = () => {
  const ua = navigator.userAgent
  let dispositivo = 'desktop'
  
  if (/mobile/i.test(ua)) dispositivo = 'mobile'
  else if (/tablet/i.test(ua)) dispositivo = 'tablet'
  
  return {
    dispositivo,
    user_agent: ua
  }
}

export const getUTMParams = () => {
  const params = new URLSearchParams(window.location.search)
  return {
    fonte_utm: params.get('utm_source') || null,
    campagna_utm: params.get('utm_campaign') || null,
    medium_utm: params.get('utm_medium') || null
  }
}
