/**
 * Calcola il risparmio annuo confrontando offerta attuale con nuova offerta
 */
export const calculateSavings = (currentCost, offerDetails, consumption) => {
  try {
    // Calcola costo annuo con la nuova offerta
    let newAnnualCost = 0

    if (offerDetails.tipo_fornitura === 'luce' || offerDetails.tipo_fornitura === 'dual') {
      const kwhCost = (consumption.consumo_annuo_kwh || 0) * (offerDetails.prezzo_kwh || 0)
      const fixedCostLuce = (offerDetails.quota_fissa_luce_mensile || 0) * 12
      newAnnualCost += kwhCost + fixedCostLuce
    }

    if (offerDetails.tipo_fornitura === 'gas' || offerDetails.tipo_fornitura === 'dual') {
      const smcCost = (consumption.consumo_annuo_smc || 0) * (offerDetails.prezzo_smc || 0)
      const fixedCostGas = (offerDetails.quota_fissa_gas_mensile || 0) * 12
      newAnnualCost += smcCost + fixedCostGas
    }

    // Sottrai bonus attivazione se presente
    if (offerDetails.bonus_attivazione) {
      newAnnualCost -= offerDetails.bonus_attivazione
    }

    const currentAnnualCost = currentCost.spesa_annua_attuale || (currentCost.spesa_mensile_attuale * 12)
    const savings = currentAnnualCost - newAnnualCost
    const savingsPercentage = currentAnnualCost > 0 ? (savings / currentAnnualCost) * 100 : 0

    return {
      spesa_annua_attuale: parseFloat(currentAnnualCost.toFixed(2)),
      spesa_annua_offerta: parseFloat(newAnnualCost.toFixed(2)),
      risparmio_annuo: parseFloat(savings.toFixed(2)),
      risparmio_percentuale: parseFloat(savingsPercentage.toFixed(2)),
      conveniente: savings > 0
    }
  } catch (error) {
    console.error('Errore calcolo risparmio:', error)
    return null
  }
}

/**
 * Calcola la commissione per l'operatore
 */
export const calculateCommission = (offerDetails, calculation) => {
  try {
    const commission = offerDetails.commissioni?.[0]
    if (!commission) return 0

    let totalCommission = 0

    // Commissione base
    if (commission.tipo_commissione === 'fissa') {
      totalCommission = commission.importo_fisso || 0
    } else if (commission.tipo_commissione === 'percentuale') {
      totalCommission = (calculation.spesa_annua_offerta * (commission.percentuale || 0)) / 100
    } else if (commission.tipo_commissione === 'mista') {
      const fixed = commission.importo_fisso || 0
      const percentage = (calculation.spesa_annua_offerta * (commission.percentuale || 0)) / 100
      totalCommission = fixed + percentage
    }

    // Bonus aggiuntivi
    if (offerDetails.tipo_fornitura === 'dual' && commission.bonus_dual) {
      totalCommission += commission.bonus_dual
    }

    if (offerDetails.green_energy && commission.bonus_verde) {
      totalCommission += commission.bonus_verde
    }

    // Applica min/max se definiti
    if (commission.minimo_garantito && totalCommission < commission.minimo_garantito) {
      totalCommission = commission.minimo_garantito
    }

    if (commission.massimo && totalCommission > commission.massimo) {
      totalCommission = commission.massimo
    }

    return parseFloat(totalCommission.toFixed(2))
  } catch (error) {
    console.error('Errore calcolo commissione:', error)
    return 0
  }
}

/**
 * Trova la migliore offerta basandosi su risparmio e commissione
 */
export const findBestOffer = (offers, consumption, currentCost) => {
  if (!offers || offers.length === 0) return null

  const evaluatedOffers = offers.map(offer => {
    const calculation = calculateSavings(currentCost, offer, consumption)
    const commission = calculateCommission(offer, calculation)

    return {
      ...offer,
      calculation,
      commission,
      score: calculation.risparmio_annuo * 0.7 + commission * 0.3 // 70% risparmio cliente, 30% commissione
    }
  })

  // Ordina per score decrescente
  evaluatedOffers.sort((a, b) => b.score - a.score)

  return evaluatedOffers[0]
}

/**
 * Verifica se l'offerta attuale è già ottima (risparmio < soglia)
 */
export const isCurrentOfferGood = (savings, threshold = 50) => {
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

/**
 * Valida i dati di consumo
 */
export const validateConsumption = (consumption) => {
  const errors = []

  if (consumption.tipo_fornitura === 'luce' || consumption.tipo_fornitura === 'dual') {
    if (!consumption.consumo_annuo_kwh || consumption.consumo_annuo_kwh <= 0) {
      errors.push('Consumo annuo luce non valido')
    }
    if (!consumption.potenza_contrattuale || consumption.potenza_contrattuale <= 0) {
      errors.push('Potenza contrattuale non valida')
    }
  }

  if (consumption.tipo_fornitura === 'gas' || consumption.tipo_fornitura === 'dual') {
    if (!consumption.consumo_annuo_smc || consumption.consumo_annuo_smc <= 0) {
      errors.push('Consumo annuo gas non valido')
    }
  }

  if (!consumption.spesa_mensile_attuale || consumption.spesa_mensile_attuale <= 0) {
    errors.push('Spesa mensile non valida')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Genera stima consumo basato su spesa (fallback)
 */
export const estimateConsumptionFromCost = (monthlyCost, serviceType) => {
  const avgPriceKwh = 0.25 // €/kWh medio
  const avgPriceSmc = 1.00 // €/Smc medio
  const avgFixedCost = 20 // € fissi mensili medi

  const variableCost = monthlyCost - avgFixedCost
  
  if (serviceType === 'luce') {
    return {
      consumo_annuo_kwh: Math.round((variableCost / avgPriceKwh) * 12),
      consumo_annuo_smc: null
    }
  } else if (serviceType === 'gas') {
    return {
      consumo_annuo_kwh: null,
      consumo_annuo_smc: Math.round((variableCost / avgPriceSmc) * 12)
    }
  } else { // dual
    return {
      consumo_annuo_kwh: Math.round((variableCost * 0.6 / avgPriceKwh) * 12),
      consumo_annuo_smc: Math.round((variableCost * 0.4 / avgPriceSmc) * 12)
    }
  }
}
