/**
 * STIME CONSUMI ARERA PER NUMERO PERSONE IN FAMIGLIA
 * Usate solo come fallback quando l'utente non conosce i propri consumi
 * Fonte: ARERA - Autorità di Regolazione per Energia Reti e Ambiente
 */
export const CONSUMI_ARERA = {
  1: { kwh: 1200, smc: 400 },
  2: { kwh: 1800, smc: 700 },
  3: { kwh: 2500, smc: 900 },
  4: { kwh: 3200, smc: 1100 },
  5: { kwh: 4000, smc: 1400 }
}

/**
 * PREZZI MEDI DI MERCATO per stima consumi da importo bolletta
 * Usati solo come fallback quando non si conosce il consumo reale
 * Fonte: stime medie mercato italiano 2026
 */
const PREZZO_MEDIO_MERCATO = {
  kwh: 0.28,   // €/kWh comprensivo di oneri e IVA
  smc: 1.15    // €/Smc comprensivo di oneri e IVA
}

/**
 * ONERI DI SISTEMA MEDI STIMATI (€/anno)
 */
const ONERI_SISTEMA = {
  luce: 180,
  gas: 120,
  dual: 300
}

/**
 * IVA applicabile per tipo cliente
 */
const ALIQUOTA_IVA = {
  privato: 0.10,
  p_iva: 0.22,
  azienda: 0.22
}

/**
 * Annualizza un consumo del periodo in base ai mesi coperti dalla bolletta
 * Es: 221 smc in 2 mesi → 221 / 2 * 12 = 1326 smc/anno
 *
 * @param {number} consumoPeriodo - Consumo rilevato nella bolletta
 * @param {number} mesiPeriodo - Durata del periodo in mesi (1-12)
 * @returns {number} consumo annualizzato
 */
export const annualizzaConsumi = (consumoPeriodo, mesiPeriodo) => {
  const mesi = Math.max(1, Math.min(12, mesiPeriodo || 2))
  return Math.round((consumoPeriodo / mesi) * 12)
}

/**
 * Stima il consumo annuo a partire dall'importo della bolletta
 * Applica riduzione del 20% rispetto al valore stimato (prudenziale)
 * Usata come fallback quando l'utente non conosce il consumo reale
 *
 * @param {number} importoBolletta - Importo totale bolletta (€)
 * @param {number} mesiPeriodo - Durata del periodo in mesi
 * @param {'luce'|'gas'|'dual'} tipo - Tipo di fornitura
 * @returns {{ kwh: number, smc: number }}
 */
export const stimaConsumoDaImporto = (importoBolletta, mesiPeriodo, tipo) => {
  const mesi = Math.max(1, Math.min(12, mesiPeriodo || 2))
  const importoAnnuo = (importoBolletta / mesi) * 12

  // Stima grezza dal prezzo medio di mercato
  const kwh_grezzo = tipo !== 'gas' ? importoAnnuo / PREZZO_MEDIO_MERCATO.kwh : 0
  const smc_grezzo = tipo !== 'luce' ? importoAnnuo / PREZZO_MEDIO_MERCATO.smc : 0

  // Applica riduzione del 20% (stima prudenziale come suggerito)
  return {
    kwh: Math.round(kwh_grezzo * 0.80),
    smc: Math.round(smc_grezzo * 0.80)
  }
}

/**
 * Restituisce la stima dei consumi annui in base al numero di persone
 * Mantenuta per compatibilità ma usata solo come fallback di ultimo livello
 *
 * @param {number|string} numPersone - Numero persone (1-5)
 * @returns {{ kwh: number, smc: number }}
 */
export const stimaConsumiDaPersone = (numPersone) => {
  const n = Math.min(parseInt(numPersone) || 2, 5)
  return CONSUMI_ARERA[n] || CONSUMI_ARERA[2]
}

/**
 * Risolve i consumi annui da usare nel calcolo offerta
 * Priorità: 1) consumo reale annualizzato → 2) stima da importo → 3) stima da persone
 *
 * @param {object} params
 * @param {number} params.consumoPeriodo_kwh - Consumo kWh dalla bolletta (0 se non disponibile)
 * @param {number} params.consumoPeriodo_smc - Consumo Smc dalla bolletta (0 se non disponibile)
 * @param {number} params.mesiPeriodo - Durata periodo bolletta in mesi
 * @param {number} params.importoBolletta - Importo totale bolletta
 * @param {'luce'|'gas'|'dual'} params.tipoFornitura
 * @param {number} params.numPersone - Numero persone (fallback)
 * @returns {{ kwh: number, smc: number, fonte: string }}
 */
export const risolviConsumi = ({
  consumoPeriodo_kwh = 0,
  consumoPeriodo_smc = 0,
  mesiPeriodo = 2,
  importoBolletta = 0,
  tipoFornitura = 'dual',
  numPersone = 2
}) => {
  // 1. Consumo reale dalla bolletta → annualizza
  if (consumoPeriodo_kwh > 0 || consumoPeriodo_smc > 0) {
    return {
      kwh: consumoPeriodo_kwh > 0 ? annualizzaConsumi(consumoPeriodo_kwh, mesiPeriodo) : 0,
      smc: consumoPeriodo_smc > 0 ? annualizzaConsumi(consumoPeriodo_smc, mesiPeriodo) : 0,
      fonte: 'bolletta_reale'
    }
  }

  // 2. Stima da importo bolletta (riduzione 20%)
  if (importoBolletta > 0) {
    const stime = stimaConsumoDaImporto(importoBolletta, mesiPeriodo, tipoFornitura)
    return { ...stime, fonte: 'stima_importo' }
  }

  // 3. Fallback: stima da numero persone ARERA
  const stime = stimaConsumiDaPersone(numPersone)
  return { ...stime, fonte: 'stima_persone' }
}

/**
 * Calcola il costo annuo stimato con la nuova offerta
 */
export const calcolaCostoOfferta = (offerta, consumi, tipoCliente = 'privato') => {
  const iva = ALIQUOTA_IVA[tipoCliente] || 0.10
  let costoEnergia = 0
  let quotaFissa = 0
  let oneri = 0

  if (offerta.tipo_fornitura === 'luce' || offerta.tipo_fornitura === 'dual') {
    const kwh = parseFloat(consumi.consumo_annuo_kwh) || 0
    costoEnergia += kwh * (parseFloat(offerta.prezzo_kwh) || 0)
    quotaFissa += (parseFloat(offerta.quota_fissa_luce_mensile) || 0) * 12
    oneri += offerta.tipo_fornitura === 'dual' ? ONERI_SISTEMA.dual : ONERI_SISTEMA.luce
  }

  if (offerta.tipo_fornitura === 'gas' || offerta.tipo_fornitura === 'dual') {
    const smc = parseFloat(consumi.consumo_annuo_smc) || 0
    costoEnergia += smc * (parseFloat(offerta.prezzo_smc) || 0)
    quotaFissa += (parseFloat(offerta.quota_fissa_gas_mensile) || 0) * 12
    if (offerta.tipo_fornitura === 'gas') oneri += ONERI_SISTEMA.gas
  }

  const bonusAttivazione = parseFloat(offerta.bonus_attivazione) || 0
  const imponibile = costoEnergia + quotaFissa + oneri - bonusAttivazione
  const baseIva = costoEnergia + quotaFissa
  const importoIva = baseIva * iva
  const totaleAnnuo = Math.max(0, imponibile + importoIva)

  return {
    costoEnergia: parseFloat(costoEnergia.toFixed(2)),
    quotaFissa: parseFloat(quotaFissa.toFixed(2)),
    oneriSistema: parseFloat(oneri.toFixed(2)),
    bonusAttivazione: parseFloat(bonusAttivazione.toFixed(2)),
    imponibile: parseFloat(imponibile.toFixed(2)),
    iva: parseFloat(importoIva.toFixed(2)),
    aliquotaIva: iva,
    totaleAnnuo: parseFloat(totaleAnnuo.toFixed(2)),
    totaleMensile: parseFloat((totaleAnnuo / 12).toFixed(2))
  }
}

/**
 * Calcola il risparmio annuo confrontando spesa attuale con nuova offerta
 */
export const calculateSavings = (currentCost, offerta, consumi, tipoCliente = 'privato') => {
  try {
    const spesaAttuale = parseFloat(currentCost.spesa_annua_attuale) ||
      (parseFloat(currentCost.spesa_mensile_attuale) * 12)

    const dettaglioOfferta = calcolaCostoOfferta(offerta, consumi, tipoCliente)
    const spesaNuova = dettaglioOfferta.totaleAnnuo
    const risparmio = spesaAttuale - spesaNuova
    const risparmioPercentuale = spesaAttuale > 0 ? (risparmio / spesaAttuale) * 100 : 0

    return {
      spesa_annua_attuale: parseFloat(spesaAttuale.toFixed(2)),
      spesa_mensile_attuale: parseFloat((spesaAttuale / 12).toFixed(2)),
      spesa_annua_offerta: spesaNuova,
      spesa_mensile_offerta: dettaglioOfferta.totaleMensile,
      risparmio_annuo: parseFloat(risparmio.toFixed(2)),
      risparmio_mensile: parseFloat((risparmio / 12).toFixed(2)),
      risparmio_percentuale: parseFloat(risparmioPercentuale.toFixed(2)),
      conveniente: risparmio > 0,
      dettaglio_offerta: dettaglioOfferta
    }
  } catch (error) {
    console.error('Errore calcolo risparmio:', error)
    return null
  }
}

/**
 * Calcola la commissione totale per l'operatore
 */
export const calculateCommission = (offerta, calculation) => {
  try {
    const commission = offerta.commissioni?.[0]
    if (!commission) return { totale: 0, dettaglio: {} }

    let base = 0, bonusDual = 0, bonusVerde = 0, bonusRapida = 0

    if (commission.tipo_commissione === 'fissa') {
      base = parseFloat(commission.importo_fisso) || 0
    } else if (commission.tipo_commissione === 'percentuale') {
      base = ((calculation?.spesa_annua_offerta || 0) * (parseFloat(commission.percentuale) || 0)) / 100
    } else if (commission.tipo_commissione === 'mista') {
      base = (parseFloat(commission.importo_fisso) || 0) +
        ((calculation?.spesa_annua_offerta || 0) * (parseFloat(commission.percentuale) || 0)) / 100
    }

    if (offerta.tipo_fornitura === 'dual' && commission.bonus_dual)
      bonusDual = parseFloat(commission.bonus_dual) || 0
    if (offerta.green_energy && commission.bonus_verde)
      bonusVerde = parseFloat(commission.bonus_verde) || 0
    if (commission.bonus_attivazione_rapida)
      bonusRapida = parseFloat(commission.bonus_attivazione_rapida) || 0

    let totale = base + bonusDual + bonusVerde + bonusRapida

    if (commission.minimo_garantito && totale < parseFloat(commission.minimo_garantito))
      totale = parseFloat(commission.minimo_garantito)
    if (commission.massimo && totale > parseFloat(commission.massimo))
      totale = parseFloat(commission.massimo)

    return {
      totale: parseFloat(totale.toFixed(2)),
      dettaglio: {
        base: parseFloat(base.toFixed(2)),
        bonus_dual: parseFloat(bonusDual.toFixed(2)),
        bonus_verde: parseFloat(bonusVerde.toFixed(2)),
        bonus_rapida: parseFloat(bonusRapida.toFixed(2))
      }
    }
  } catch (error) {
    console.error('Errore calcolo commissione:', error)
    return { totale: 0, dettaglio: {} }
  }
}

/**
 * Trova la migliore offerta basandosi su risparmio cliente e commissione operatore
 * Score: 70% risparmio cliente + 30% commissione
 */
export const findBestOffer = (offerte, consumi, currentCost, tipoCliente = 'privato') => {
  if (!offerte || offerte.length === 0) return null

  const valutate = offerte.map(offerta => {
    const calculation = calculateSavings(currentCost, offerta, consumi, tipoCliente)
    if (!calculation) return null

    const commissioneResult = calculateCommission(offerta, calculation)
    return {
      ...offerta,
      calculation: {
        ...calculation,
        tua_commissione: commissioneResult.totale,
        dettaglio_commissione: commissioneResult.dettaglio
      },
      score: (calculation.risparmio_annuo * 0.7) + (commissioneResult.totale * 0.3)
    }
  }).filter(Boolean)

  if (valutate.length === 0) return null
  valutate.sort((a, b) => b.score - a.score)
  return valutate[0]
}

export const isCurrentOfferGood = (savings, threshold = 50) => {
  if (!savings) return true
  return savings.risparmio_annuo < threshold || savings.risparmio_percentuale < 5
}

export const formatCurrency = (value) => new Intl.NumberFormat('it-IT', {
  style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2
}).format(value || 0)

export const formatPercentage = (value) => `${(value || 0).toFixed(1)}%`
