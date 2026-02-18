/**
 * STIME CONSUMI ARERA PER NUMERO PERSONE IN FAMIGLIA
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
 * ONERI DI SISTEMA MEDI STIMATI (€/anno)
 * Comprendono: oneri generali di sistema, trasporto e gestione contatore
 * Fonte: stime medie mercato italiano 2026
 */
const ONERI_SISTEMA = {
  luce: 180,  // €/anno medi per uso domestico 3kW
  gas: 120,   // €/anno medi per uso domestico
  dual: 300   // €/anno medi combinati
}

/**
 * IVA applicabile per tipo cliente
 */
const ALIQUOTA_IVA = {
  privato: 0.10,   // 10% domestico
  p_iva: 0.22,     // 22% non domestico
  azienda: 0.22    // 22% non domestico
}

/**
 * Restituisce la stima dei consumi annui in base al numero di persone
 * @param {number|string} numPersone - Numero persone (1-5, dove 5 = 5+)
 * @returns {{ kwh: number, smc: number }}
 */
export const stimaConsumiDaPersone = (numPersone) => {
  const n = Math.min(parseInt(numPersone) || 2, 5)
  return CONSUMI_ARERA[n] || CONSUMI_ARERA[2]
}

/**
 * Calcola il costo annuo stimato con la nuova offerta
 * Include: energia variabile + quota fissa + oneri sistema stimati + IVA
 *
 * @param {object} offerta - Dati offerta dal DB
 * @param {object} consumi - { consumo_annuo_kwh, consumo_annuo_smc }
 * @param {string} tipoCliente - 'privato' | 'p_iva' | 'azienda'
 * @returns {object} dettaglio costi
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
    // Oneri già inclusi nel dual sopra, aggiungi solo per gas puro
    if (offerta.tipo_fornitura === 'gas') {
      oneri += ONERI_SISTEMA.gas
    }
  }

  // Sottrai bonus attivazione (spalmato sul primo anno)
  const bonusAttivazione = parseFloat(offerta.bonus_attivazione) || 0

  // Imponibile prima di IVA
  const imponibile = costoEnergia + quotaFissa + oneri - bonusAttivazione

  // IVA sul solo imponibile energetico (quota fissa + energia), non sugli oneri generali
  // Per semplicità applichiamo IVA su energia + quota fissa
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
 *
 * @param {object} currentCost - { spesa_mensile_attuale, spesa_annua_attuale }
 * @param {object} offerta - Dati offerta dal DB
 * @param {object} consumi - { consumo_annuo_kwh, consumo_annuo_smc }
 * @param {string} tipoCliente - 'privato' | 'p_iva' | 'azienda'
 * @returns {object} calcolo completo
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
      // Breakdown dettagliato per mostrarlo all'utente
      dettaglio_offerta: dettaglioOfferta
    }
  } catch (error) {
    console.error('Errore calcolo risparmio:', error)
    return null
  }
}

/**
 * Calcola la commissione totale per l'operatore
 * Include tutti i bonus: base + dual + verde + attivazione rapida
 *
 * @param {object} offerta - Dati offerta con commissioni[]
 * @param {object} calculation - Risultato di calculateSavings
 * @returns {object} { totale, dettaglio }
 */
export const calculateCommission = (offerta, calculation) => {
  try {
    const commission = offerta.commissioni?.[0]
    if (!commission) return { totale: 0, dettaglio: {} }

    let base = 0
    let bonusDual = 0
    let bonusVerde = 0
    let bonusRapida = 0

    // Commissione base
    if (commission.tipo_commissione === 'fissa') {
      base = parseFloat(commission.importo_fisso) || 0
    } else if (commission.tipo_commissione === 'percentuale') {
      base = ((calculation?.spesa_annua_offerta || 0) * (parseFloat(commission.percentuale) || 0)) / 100
    } else if (commission.tipo_commissione === 'mista') {
      const fixed = parseFloat(commission.importo_fisso) || 0
      const perc = ((calculation?.spesa_annua_offerta || 0) * (parseFloat(commission.percentuale) || 0)) / 100
      base = fixed + perc
    }

    // Bonus dual (se offerta dual)
    if (offerta.tipo_fornitura === 'dual' && commission.bonus_dual) {
      bonusDual = parseFloat(commission.bonus_dual) || 0
    }

    // Bonus energia verde
    if (offerta.green_energy && commission.bonus_verde) {
      bonusVerde = parseFloat(commission.bonus_verde) || 0
    }

    // Bonus attivazione rapida
    if (commission.bonus_attivazione_rapida) {
      bonusRapida = parseFloat(commission.bonus_attivazione_rapida) || 0
    }

    let totale = base + bonusDual + bonusVerde + bonusRapida

    // Applica min/max se definiti
    if (commission.minimo_garantito && totale < parseFloat(commission.minimo_garantito)) {
      totale = parseFloat(commission.minimo_garantito)
    }
    if (commission.massimo && totale > parseFloat(commission.massimo)) {
      totale = parseFloat(commission.massimo)
    }

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
 *
 * @param {Array} offerte - Lista offerte dal DB
 * @param {object} consumi - { consumo_annuo_kwh, consumo_annuo_smc }
 * @param {object} currentCost - { spesa_mensile_attuale, spesa_annua_attuale }
 * @param {string} tipoCliente - 'privato' | 'p_iva' | 'azienda'
 * @returns {object|null} migliore offerta con calcoli
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

/**
 * Verifica se l'offerta attuale è già ottima
 * Soglia: risparmio < €50/anno O < 5%
 *
 * @param {object} savings - Risultato di calculateSavings
 * @param {number} threshold - Soglia minima risparmio in €
 * @returns {boolean}
 */
export const isCurrentOfferGood = (savings, threshold = 50) => {
  if (!savings) return true
  return savings.risparmio_annuo < threshold || savings.risparmio_percentuale < 5
}

/**
 * Formatta valuta in euro
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0)
}

/**
 * Formatta percentuale
 */
export const formatPercentage = (value) => {
  return `${(value || 0).toFixed(1)}%`
}
