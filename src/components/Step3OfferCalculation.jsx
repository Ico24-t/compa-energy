import React, { useState, useEffect } from 'react'
import { Phone, TrendingDown, Check, X, Loader } from 'lucide-react'
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
        // Usa i consumi stimati calcolati dallo Step2 (da slider persone e uso gas)
        const consumption = {
          consumo_annuo_kwh: parseFloat(formData.consumo_annuo_kwh) || 0,
          consumo_annuo_smc: parseFloat(formData.consumo_annuo_smc) || 0
        }

        const currentCost = {
          spesa_mensile_attuale: parseFloat(formData.spesa_mensile_attuale),
          spesa_annua_attuale: parseFloat(formData.spesa_mensile_attuale) * 12
        }

        const best = findBestOffer(offersResult.data, consumption, currentCost)

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
        <div className="mt-4 flex gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    )
  }

  // NON CONVENIENTE - offerta attuale già ottima
  if (noImprovement) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl mx-auto px-4"
      >
        <div className="card text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-4">
            La tua offerta è già ottima! 👍
          </h2>
          <p className="text-lg text-slate-600 mb-6 leading-relaxed">
            Dopo aver analizzato i tuoi consumi, la tua tariffa attuale
            risulta già <strong>competitiva</strong> rispetto alle offerte
            disponibili sul mercato.
          </p>
          <div className="bg-blue-50 rounded-xl p-6 mb-6">
            <p className="text-blue-800 font-medium">
              💡 Il mercato energetico cambia continuamente.
            </p>
            <p className="text-blue-700 text-sm mt-2">
              Ti avviseremo via email non appena avremo offerte più vantaggiose per te.
            </p>
          </div>
          <p className="text-slate-500 text-sm">
            Grazie per aver utilizzato il nostro comparatore!
          </p>
        </div>
      </motion.div>
    )
  }

  if (!bestOffer) return null

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
          <p className="text-4xl font-bold">
            {formatCurrency(bestOffer.calculation.risparmio_annuo)}
          </p>
          <p className="text-sm mt-1">
            (-{bestOffer.calculation.risparmio_percentuale.toFixed(1)}%)
          </p>
        </div>
      </div>

      {/* Confronto costi */}
      <div className="card mb-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Confronto spesa annua</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-xl">
            <X className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600 mb-1">Spesa attuale</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(bestOffer.calculation.spesa_annua_attuale)}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <Check className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600 mb-1">Nuova spesa</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(bestOffer.calculation.spesa_annua_offerta)}
            </p>
          </div>
        </div>
      </div>

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
        Sono interessato, prosegui →
      </button>
    </motion.div>
  )
}

export default Step3OfferCalculation
