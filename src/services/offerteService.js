import { supabase } from './supabaseClient';

/**
 * Crea un nuovo lead nel database
 */
export const createLead = async (leadData) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .insert([{
        email: leadData.email,
        tipo_cliente: leadData.tipoCliente,
        stato: 'solo_email',
        origine: 'form_manuale',
        dispositivo: getDeviceType(),
        privacy_acconsentito: true,
        marketing_acconsentito: leadData.marketingConsent || false,
        data_consenso: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Errore creazione lead:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Salva i consumi del cliente
 */
export const saveConsumi = async (leadId, consumiData) => {
  try {
    const { data, error } = await supabase
      .from('consumi_cliente')
      .insert([{
        lead_id: leadId,
        tipo_fornitura: consumiData.tipoFornitura,
        potenza_contrattuale: consumiData.potenzaContatore,
        consumo_annuo_kwh: consumiData.consumoAnnuoKwh || 0,
        consumo_annuo_smc: consumiData.consumoAnnuoSmc || 0,
        spesa_mensile_attuale: consumiData.spesaMensile,
        spesa_annua_attuale: consumiData.spesaMensile * 12
      }])
      .select()
      .single();

    if (error) throw error;

    // Aggiorna stato lead
    await supabase
      .from('leads')
      .update({ stato: 'dati_consumi' })
      .eq('id', leadId);

    return { success: true, data };
  } catch (error) {
    console.error('Errore salvataggio consumi:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calcola la migliore offerta per il lead
 */
export const calcolaMiglioreOfferta = async (leadId, consumiData) => {
  try {
    // Recupera offerte attive
    const { data: offerte, error: offerteError } = await supabase
      .from('offerte')
      .select(`
        *,
        fornitori (
          id,
          nome,
          logo_url,
          email_operatore
        ),
        commissioni (
          importo_fisso,
          percentuale,
          bonus_dual
        )
      `)
      .eq('visibile', true)
      .eq('tipo_fornitura', consumiData.tipoFornitura)
      .lte('data_inizio', new Date().toISOString().split('T')[0])
      .or(`data_fine.is.null,data_fine.gte.${new Date().toISOString().split('T')[0]}`)
      .order('priorita_visualizzazione', { ascending: true });

    if (offerteError) throw offerteError;

    if (!offerte || offerte.length === 0) {
      return { success: false, message: 'Nessuna offerta disponibile al momento' };
    }

    // Calcola il risparmio per ogni offerta
    const offerte CalcolateConRisparmio = offerte.map(offerta => {
      const spesaAttuale = consumiData.spesaMensile * 12;
      let spesaOfferta = 0;

      if (consumiData.tipoFornitura === 'luce') {
        const consumoKwh = consumiData.consumoAnnuoKwh || (consumiData.spesaMensile * 12) / 0.25;
        spesaOfferta = (consumoKwh * offerta.prezzo_kwh * 1.22) + 
                       (offerta.quota_fissa_luce_mensile * 12 * 1.22);
      } else if (consumiData.tipoFornitura === 'gas') {
        const consumoSmc = consumiData.consumoAnnuoSmc || (consumiData.spesaMensile * 12) / 1.20;
        spesaOfferta = (consumoSmc * offerta.prezzo_smc * 1.22) + 
                       (offerta.quota_fissa_gas_mensile * 12 * 1.22);
      } else if (consumiData.tipoFornitura === 'dual') {
        const consumoKwh = consumiData.consumoAnnuoKwh || (consumiData.spesaMensile * 6) / 0.25;
        const consumoSmc = consumiData.consumoAnnuoSmc || (consumiData.spesaMensile * 6) / 1.20;
        spesaOfferta = (consumoKwh * offerta.prezzo_kwh * 1.22) + 
                       (consumoSmc * offerta.prezzo_smc * 1.22) +
                       ((offerta.quota_fissa_luce_mensile + offerta.quota_fissa_gas_mensile) * 12 * 1.22);
      }

      const risparmioAnnuo = spesaAttuale - spesaOfferta;
      const risparmioPercentuale = spesaAttuale > 0 ? (risparmioAnnuo / spesaAttuale * 100) : 0;

      const commissione = (offerta.commissioni?.[0]?.importo_fisso || 0) +
                         ((offerta.commissioni?.[0]?.percentuale || 0) * 0.01 * spesaAttuale) +
                         (consumiData.tipoFornitura === 'dual' ? (offerta.commissioni?.[0]?.bonus_dual || 0) : 0);

      return {
        ...offerta,
        spesaAttuale,
        spesaOfferta,
        risparmioAnnuo,
        risparmioPercentuale,
        risparmioMensile: risparmioAnnuo / 12,
        commissione,
        punteggio: (risparmioAnnuo * 0.7) + (commissione * 0.3)
      };
    });

    // Ordina per punteggio e prendi la migliore
    offerteCalcolateConRisparmio.sort((a, b) => b.punteggio - a.punteggio);
    const miglioreOfferta = offerteCalcolateConRisparmio[0];

    // Salva il calcolo nel database
    await supabase
      .from('calcolo_offerta')
      .insert([{
        lead_id: leadId,
        offerta_id: miglioreOfferta.id,
        spesa_annua_attuale: miglioreOfferta.spesaAttuale,
        spesa_annua_offerta: miglioreOfferta.spesaOfferta,
        risparmio_annuo: miglioreOfferta.risparmioAnnuo,
        risparmio_percentuale: miglioreOfferta.risparmioPercentuale,
        tua_commissione: miglioreOfferta.commissione
      }]);

    return { 
      success: true, 
      offerta: miglioreOfferta,
      isMigliorativa: miglioreOfferta.risparmioAnnuo > 50 // Soglia minima di risparmio
    };
  } catch (error) {
    console.error('Errore calcolo offerta:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Aggiorna il lead con il telefono
 */
export const updateLeadTelefono = async (leadId, telefono) => {
  try {
    const { error } = await supabase
      .from('leads')
      .update({ 
        telefono,
        stato: 'telefono_richiesto'
      })
      .eq('id', leadId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Errore aggiornamento telefono:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Crea un pre-contratto con tutti i dati anagrafici
 */
export const createPreContratto = async (leadId, offertaId, anagraficaData) => {
  try {
    const { data, error } = await supabase
      .from('pre_contratti')
      .insert([{
        lead_id: leadId,
        offerta_id: offertaId,
        nome: anagraficaData.nome,
        cognome: anagraficaData.cognome,
        codice_fiscale: anagraficaData.codiceFiscale,
        data_nascita: anagraficaData.dataNascita,
        luogo_nascita: anagraficaData.luogoNascita,
        indirizzo_fornitura: anagraficaData.indirizzoFornitura,
        cap: anagraficaData.cap,
        citta: anagraficaData.citta,
        provincia: anagraficaData.provincia,
        codice_pod: anagraficaData.codicePod,
        codice_pdr: anagraficaData.codicePdr,
        fornitore_attuale: anagraficaData.fornitoreAttuale,
        tipo_contratto_attuale: anagraficaData.tipoContrattoAttuale,
        stato: 'bozza',
        note_cliente: anagraficaData.note
      }])
      .select()
      .single();

    if (error) throw error;

    // Aggiorna stato lead
    await supabase
      .from('leads')
      .update({ stato: 'pre_contratto' })
      .eq('id', leadId);

    return { success: true, data };
  } catch (error) {
    console.error('Errore creazione pre-contratto:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Marca il pre-contratto come inviato
 */
export const confermaInvioPreContratto = async (preContrattoId, leadId) => {
  try {
    await supabase
      .from('pre_contratti')
      .update({ 
        stato: 'inviato',
        data_invio: new Date().toISOString()
      })
      .eq('id', preContrattoId);

    await supabase
      .from('leads')
      .update({ stato: 'inviato_operatore' })
      .eq('id', leadId);

    return { success: true };
  } catch (error) {
    console.error('Errore conferma invio:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Utility: Rileva tipo dispositivo
 */
function getDeviceType() {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}
