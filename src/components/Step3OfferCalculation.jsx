import React, { useState, useEffect } from 'react'
import { Phone, Check, X, Loader, Info } from 'lucide-react'
import { useForm } from '../contexts/FormContext'
import { motion } from 'framer-motion'
import { getAvailableOffers, updateLeadStatus } from '../services/api'
import { findBestOffer, isCurrentOfferGood, formatCurrency } from '../utils/calculations'
import { validatePhone, formatPhone } from '../utils/validation'

const Step3OfferCalculation = () => {
  const { formData, updateFormData, nextStep, leadId, setLoading, loading } = useForm()
  const [bestOffer, setBestOffer] = useState(null)
  const [noImprovement, setNoImprovement] = useState(false)
  const [phone, setPhone] = useState(formData.telefono || '')
  const [phoneError, setPhoneError] = useState('')
  const [showBreakdown, setShowBreakdown] = useState(false)

  useEffect(() => {
    calculateOffers()
  }, [])

  const calculateOffers = async () => {
    setLoading(true)
    try {
      const offersResult = await getAvailableOffers({
        tipo_fornitura: formData.tipo_fornitura
      })

      if (offersResult.success && offersResult.data.length > 0) {
        const consumi = {
          consumo_annuo_kwh: parseFloat(formData.consumo_annuo_kwh) || 0,
          consumo_annuo_smc: parseFloat(formData.consumo_annuo_smc) || 0
        }

        const currentCost = {
          spesa_mensile_attuale: parseFloat(formData.spesa_mensile_attuale),
          spesa_annua_attuale: parseFloat(formData.spesa_mensile_attuale) * 12
        }

        const best = findBestOffer(
          offersResult.data,
          consumi,
          currentCost,
          formData.tipo_cliente || 'privato'
        )

        if (best && !isCurrentOfferGood(best.calculation)) {
          setBestOffer(best)
          updateFormData({
            offerta_selezionata: best,
            calcolo_risparmio: best.calculation
          })
        } else {
          setNoImprovement(true)
          await updateLeadStatus(leadId, 'disinteressato', {
            note: 'Offerta attuale già ottima'
          })
        }
      }
    } catch (error) {
      console.error('Errore calcolo offerte:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = async () => {
    if (!validatePhone(phone)) {
      setPhoneError('Numero di telefono non valido')
      return
    }

    const formattedPhone = formatPhone(phone)
    updateFormData({ telefono: formattedPhone })

    await updateLeadStatus(leadId, 'telefono_richiesto', {
      telefono: formattedPhone
    })

    nextStep()
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-lg text-slate-600">Stiamo calcolando la tua migliore offerta...</p>
      </div>
    )
  }

  if (noImprovement) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl mx-auto px-4"
      >
        <div className="card text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
            La tua offerta è già ottima! 🎉
          </h2>
          <p className="text-lg text-slate-600 mb-6">
            Al momento non abbiamo offerte più convenienti della tua.<br />
            Ti avviseremo appena avremo qualcosa di meglio!
          </p>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-slate-700">
              ✉️ Ti invieremo una email quando avremo nuove offerte più vantaggiose
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  if (!bestOffer) return null

  const calc = bestOffer.calculation
  const dettaglio = calc.dettaglio_offerta

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto px-4"
    >
      {/* Banner risparmio */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 mb-6 text-white text-center shadow-xl">
        <h2 className="text-xl md:text-2xl font-bold mb-2">
          🎉 Abbiamo la tua migliore offerta!
        </h2>
        <p className="text-sm opacity-90">Valida per le prossime 48 ore</p>
        <div className="mt-4 bg-white/20 backdrop-blur rounded-xl p-4">
          <p className="text-sm font-medium mb-1">Risparmio annuo stimato</p>
          <p className="text-4xl font-bold">{formatCurrency(calc.risparmio_annuo)}</p>
          <p className="text-sm mt-1">(-{calc.risparmio_percentuale.toFixed(1)}%)</p>
          <p className="text-xs mt-2 opacity-80">
            ovvero {formatCurrency(calc.risparmio_mensile)} al mese
          </p>
        </div>
      </div>

      {/* Confronto spesa */}
      <div className="card mb-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Confronto spesa annua</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-xl">
            <X className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600 mb-1">Spesa attuale</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(calc.spesa_annua_attuale)}</p>
            <p className="text-xs text-slate-500 mt-1">{formatCurrency(calc.spesa_mensile_attuale)}/mese</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <Check className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600 mb-1">Nuova spesa stimata</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(calc.spesa_annua_offerta)}</p>
            <p className="text-xs text-slate-500 mt-1">{formatCurrency(calc.spesa_mensile_offerta)}/mese</p>
          </div>
        </div>
      </div>

      {/* Breakdown calcolo dettagliato */}
      {dettaglio && (
        <div className="card mb-6">
          <button
            type="button"
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full flex items-center justify-between text-left"
          >
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500" />
              Come è calcolata la nuova spesa?
            </h3>
            <span className="text-blue-600 text-sm font-medium">
              {showBreakdown ? 'Nascondi ▲' : 'Mostra dettaglio ▼'}
            </span>
          </button>

          {showBreakdown && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-2 border-t border-slate-100 pt-4"
            >
              <p className="text-xs text-slate-500 mb-3">
                Il calcolo si basa sui consumi medi stimati ARERA per {formData.num_persone} {formData.num_persone === '1' ? 'persona' : 'persone'} e include IVA e oneri di sistema.
              </p>

              <div className="space-y-2 text-sm">
                {/* Costo energia */}
                {(formData.tipo_fornitura === 'luce' || formData.tipo_fornitura === 'dual') && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-600">
                      ⚡ Energia luce ({formData.consumo_annuo_kwh} kWh × {bestOffer.prezzo_kwh?.toFixed(4)} €/kWh)
                    </span>
                    <span className="font-semibold">
                      {formatCurrency((parseFloat(formData.consumo_annuo_kwh) || 0) * (parseFloat(bestOffer.prezzo_kwh) || 0))}
                    </span>
                  </div>
                )}
                {(formData.tipo_fornitura === 'gas' || formData.tipo_fornitura === 'dual') && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-600">
                      🔥 Energia gas ({formData.consumo_annuo_smc} Smc × {bestOffer.prezzo_smc?.toFixed(4)} €/Smc)
                    </span>
                    <span className="font-semibold">
                      {formatCurrency((parseFloat(formData.consumo_annuo_smc) || 0) * (parseFloat(bestOffer.prezzo_smc) || 0))}
                    </span>
                  </div>
                )}

                {/* Quota fissa */}
                {dettaglio.quotaFissa > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-600">📋 Quota fissa annua</span>
                    <span className="font-semibold">{formatCurrency(dettaglio.quotaFissa)}</span>
                  </div>
                )}

                {/* Oneri sistema */}
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">🏛️ Oneri di sistema (stimati)</span>
                  <span className="font-semibold">{formatCurrency(dettaglio.oneriSistema)}</span>
                </div>

                {/* Bonus attivazione */}
                {dettaglio.bonusAttivazione > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-green-600">🎁 Bonus attivazione</span>
                    <span className="font-semibold text-green-600">- {formatCurrency(dettaglio.bonusAttivazione)}</span>
                  </div>
                )}

                {/* IVA */}
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">
                    🧾 IVA ({(dettaglio.aliquotaIva * 100).toFixed(0)}%)
                  </span>
                  <span className="font-semibold">{formatCurrency(dettaglio.iva)}</span>
                </div>

                {/* Totale */}
                <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-3 mt-2">
                  <span className="font-bold text-slate-900">Totale annuo stimato</span>
                  <span className="font-bold text-green-600 text-lg">{formatCurrency(calc.spesa_annua_offerta)}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-3">
                * I valori sono stime basate su consumi medi. La spesa effettiva dipenderà dai consumi reali e dalle condizioni di mercato.
              </p>
            </motion.div>
          )}
        </div>
      )}

      {/* Dettagli offerta */}
      <div className="card mb-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Dettagli dell'offerta</h3>
        <div className="space-y-3">
          {bestOffer.green_energy && (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              <span className="font-medium">Energia 100% verde</span>
            </div>
          )}
          {bestOffer.digitale && (
            <div className="flex items-center gap-2 text-blue-600">
              <Check className="w-5 h-5" />
              <span className="font-medium">Gestione digitale con app</span>
            </div>
          )}
          {bestOffer.bonus_attivazione > 0 && (
            <div className="flex items-center gap-2 text-purple-600">
              <Check className="w-5 h-5" />
              <span className="font-medium">Bonus attivazione: {formatCurrency(bestOffer.bonus_attivazione)}</span>
            </div>
          )}
          <div className="pt-3 border-t border-slate-200">
            <p className="text-sm text-slate-600">{bestOffer.descrizione_breve}</p>
          </div>
        </div>
      </div>

      {/* Richiesta telefono */}
      <div className="card mb-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          Per proseguire, inserisci il tuo numero
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Ti contatteremo per finalizzare l'offerta e rispondere alle tue domande
        </p>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value)
              setPhoneError('')
            }}
            className="input-field pl-12"
            placeholder="+39 123 456 7890"
          />
        </div>
        {phoneError && (
          <p className="mt-2 text-sm text-red-600">{phoneError}</p>
        )}
      </div>

      <button onClick={handleContinue} className="btn-primary w-full">
        Interessato? Prosegui
      </button>
    </motion.div>
  )
}

export default Step3OfferCalculation
