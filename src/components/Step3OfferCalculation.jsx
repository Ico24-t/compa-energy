import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingDown, CheckCircle, Phone, Loader, ChevronRight, ChevronLeft, Heart } from 'lucide-react'
import { useForm } from '../contexts/FormContext'
import { getAvailableOffers, saveConsumption, updateLeadStatus } from '../services/api'
import { findBestOffer, calculateSavings, formatCurrency } from '../utils/calculations'
import { validatePhone, formatPhone } from '../utils/validation'

const Step3OfferCalculation = () => {
  const { formData, updateFormData, nextStep, prevStep } = useForm()

  const [loading, setLoading] = useState(true)
  const [conveniente, setConveniente] = useState(null)
  const [bestOffer, setBestOffer] = useState(null)
  const [calcolo, setCalcolo] = useState(null)
  const [telefono, setTelefono] = useState(formData.telefono || '')
  const [errTelefono, setErrTelefono] = useState('')

  useEffect(() => {
    calcolaOfferta()
  }, [])

  const calcolaOfferta = async () => {
    setLoading(true)
    try {
      // Salva consumi nel DB
      if (formData.leadId) {
        await saveConsumption({
          lead_id: formData.leadId,
          tipo_fornitura: formData.tipo_fornitura,
          consumo_annuo_kwh: formData.consumo_annuo_kwh,
          consumo_annuo_smc: formData.consumo_annuo_smc,
          spesa_mensile_attuale: formData.spesa_mensile_attuale,
          spesa_annua_attuale: formData.spesa_annua_attuale
        })
      }

      // Cerca offerte disponibili
      const offersResult = await getAvailableOffers({
        tipo_fornitura: formData.tipo_fornitura
      })

      if (offersResult.success && offersResult.data.length > 0) {
        const best = findBestOffer(
          offersResult.data,
          {
            consumo_annuo_kwh: formData.consumo_annuo_kwh || 0,
            consumo_annuo_smc: formData.consumo_annuo_smc || 0
          },
          {
            spesa_mensile_attuale: formData.spesa_mensile_attuale || 0,
            spesa_annua_attuale: formData.spesa_annua_attuale || 0
          }
        )

        if (best && best.calculation) {
          setBestOffer(best)
          setCalcolo(best.calculation)
          setConveniente(best.calculation.conveniente)

          updateFormData({
            offerta_selezionata: best,
            calcolo_risparmio: best.calculation,
            fornitore_nome: best.fornitori?.nome
          })

          // Aggiorna stato lead
          if (formData.leadId) {
            await updateLeadStatus(formData.leadId,
              best.calculation.conveniente ? 'offerta_calcolata' : 'non_conveniente'
            )
          }
        }
      }
    } catch (err) {
      console.error('Errore calcolo offerta:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (!validatePhone(telefono)) {
      setErrTelefono('Inserisci un numero di telefono valido')
      return
    }
    updateFormData({ telefono: formatPhone(telefono) })
    nextStep()
  }

  // LOADING
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-20"
      >
        <Loader className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Stiamo calcolando...</h2>
        <p className="text-slate-600">Analizziamo le migliori offerte per te</p>
        <div className="mt-6 flex justify-center gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </motion.div>
    )
  }

  // NON CONVENIENTE
  if (!conveniente) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="card text-center">
          <Heart className="w-20 h-20 text-blue-400 mx-auto mb-6" />

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
              Ti consigliamo di ricontrollare tra qualche mese quando
              potrebbero essere disponibili offerte più vantaggiose.
            </p>
          </div>

          <p className="text-slate-500 text-sm">
            Grazie per aver utilizzato il nostro comparatore!
          </p>
        </div>

        <button onClick={prevStep} className="btn-secondary w-full flex items-center justify-center gap-2">
          <ChevronLeft className="w-5 h-5" /> Torna indietro
        </button>
      </motion.div>
    )
  }

  // CONVENIENTE - Mostra risparmio e chiedi telefono
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-2">
          Abbiamo trovato un'offerta migliore! 🎉
        </h2>
        <p className="text-slate-600">Ecco quanto potresti risparmiare</p>
      </div>

      {/* Card risparmio */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-8 text-white text-center">
        <TrendingDown className="w-12 h-12 mx-auto mb-4 opacity-90" />
        <p className="text-lg mb-2 opacity-90">Risparmio annuo stimato</p>
        <p className="text-6xl font-bold mb-2">
          {formatCurrency(calcolo?.risparmio_annuo || 0)}
        </p>
        <p className="text-xl opacity-90">
          -{calcolo?.risparmio_percentuale?.toFixed(1)}% rispetto ad ora
        </p>
        <p className="text-base mt-3 opacity-80">
          ovvero {formatCurrency((calcolo?.risparmio_annuo || 0) / 12)} al mese
        </p>
      </div>

      {/* Confronto spese */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center border-2 border-red-100">
          <p className="text-sm text-slate-500 mb-1">Spesa attuale</p>
          <p className="text-2xl font-bold text-red-500">
            {formatCurrency(formData.spesa_mensile_attuale || 0)}
          </p>
          <p className="text-xs text-slate-400">al mese</p>
        </div>
        <div className="card text-center border-2 border-green-200">
          <p className="text-sm text-slate-500 mb-1">Con nuova offerta</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency((calcolo?.spesa_annua_offerta || 0) / 12)}
          </p>
          <p className="text-xs text-slate-400">al mese</p>
        </div>
      </div>

      {/* Fornitore */}
      {bestOffer && (
        <div className="card flex items-center gap-4">
          {bestOffer.fornitori?.logo_url && (
            <img
              src={bestOffer.fornitori.logo_url}
              alt={bestOffer.fornitori.nome}
              className="w-16 h-16 object-contain rounded-lg"
              onError={e => { e.target.style.display = 'none' }}
            />
          )}
          <div>
            <p className="text-sm text-slate-500">Offerta proposta</p>
            <p className="font-bold text-slate-900">{bestOffer.fornitori?.nome}</p>
            <p className="text-sm text-blue-600">{bestOffer.nome_offerta}</p>
          </div>
          <CheckCircle className="w-8 h-8 text-green-500 ml-auto flex-shrink-0" />
        </div>
      )}

      {/* Telefono */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Phone className="w-6 h-6 text-blue-600" />
          <div>
            <p className="font-semibold text-slate-900">Un nostro operatore ti ricontatterà</p>
            <p className="text-sm text-slate-500">Per completare la richiesta lascia il tuo numero</p>
          </div>
        </div>
        <input
          type="tel"
          placeholder="+39 333 123 4567"
          value={telefono}
          onChange={e => {
            setTelefono(e.target.value)
            setErrTelefono('')
          }}
          className="input-field"
        />
        {errTelefono && <p className="mt-2 text-sm text-red-600">{errTelefono}</p>}
      </div>

      {/* Navigazione */}
      <div className="flex gap-4">
        <button onClick={prevStep} className="btn-secondary flex items-center gap-2">
          <ChevronLeft className="w-5 h-5" /> Indietro
        </button>
        <button onClick={handleNext} className="btn-primary flex-1 flex items-center justify-center gap-2">
          Voglio questa offerta! <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  )
}

export default Step3OfferCalculation
