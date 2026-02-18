import React, { useState, useEffect } from 'react'
import { Phone, Check, X, Loader, Info, AlertCircle } from 'lucide-react'
import { useForm } from '../contexts/FormContext'
import { motion } from 'framer-motion'
import { getAvailableOffers, updateLeadStatus, saveOfferCalculation } from '../services/api'
import { findBestOffer, isCurrentOfferGood, formatCurrency } from '../utils/calculations'
import { validatePhone, formatPhone } from '../utils/validation'

const Step3OfferCalculation = () => {
  const { formData, updateFormData, nextStep, leadId, setLoading, loading } = useForm()
  const [bestOffer, setBestOffer] = useState(null)
  const [noImprovement, setNoImprovement] = useState(false)
  const [phone, setPhone] = useState(formData.telefono || '')
  const [phoneError, setPhoneError] = useState('')
  const [showBreakdown, setShowBreakdown] = useState(false)

  useEffect(() => { calculateOffers() }, [])

  const calculateOffers = async () => {
    setLoading(true)
    try {
      const res = await getAvailableOffers({ tipo_fornitura: formData.tipo_fornitura })
      if (res.success && res.data.length > 0) {
        const consumi = {
          consumo_annuo_kwh: parseFloat(formData.consumo_annuo_kwh) || 0,
          consumo_annuo_smc: parseFloat(formData.consumo_annuo_smc) || 0
        }
        const currentCost = {
          spesa_mensile_attuale: parseFloat(formData.spesa_mensile_attuale),
          spesa_annua_attuale: parseFloat(formData.spesa_mensile_attuale) * 12
        }
        const best = findBestOffer(res.data, consumi, currentCost, formData.tipo_cliente || 'privato')
        if (best && !isCurrentOfferGood(best.calculation)) {
          await saveOfferCalculation({
            lead_id: leadId, offerta_id: best.id,
            spesa_annua_attuale: best.calculation.spesa_annua_attuale,
            spesa_annua_offerta: best.calculation.spesa_annua_offerta,
            risparmio_annuo: best.calculation.risparmio_annuo,
            risparmio_percentuale: best.calculation.risparmio_percentuale,
            tua_commissione: best.calculation.tua_commissione || 0
          })
          setBestOffer(best)
          updateFormData({ offerta_selezionata: best, calcolo_risparmio: best.calculation })
        } else {
          setNoImprovement(true)
          await updateLeadStatus(leadId, 'disinteressato', { note: 'Offerta attuale già ottima' })
        }
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleContinue = async () => {
    if (!validatePhone(phone)) { setPhoneError('Numero di telefono non valido'); return }
    const fp = formatPhone(phone)
    updateFormData({ telefono: fp })
    await updateLeadStatus(leadId, 'telefono_richiesto', { telefono: fp })
    nextStep()
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
      <p className="text-lg text-slate-600">Stiamo calcolando la tua migliore offerta...</p>
    </div>
  )

  if (noImprovement) return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl mx-auto px-4">
      <div className="card text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">La tua offerta è già ottima! 🎉</h2>
        <p className="text-lg text-slate-600 mb-6">
          Al momento non abbiamo offerte più convenienti della tua.<br />
          Ti avviseremo appena avremo qualcosa di meglio!
        </p>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-slate-700">✉️ Ti invieremo una email quando avremo nuove offerte più vantaggiose</p>
        </div>
      </div>
    </motion.div>
  )

  if (!bestOffer) return null

  const calc = bestOffer.calculation
  const det = calc.dettaglio_offerta

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-3xl mx-auto px-4">

      {/* Banner risparmio */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 mb-6 text-white text-center shadow-xl">
        <h2 className="text-xl md:text-2xl font-bold mb-1">🎉 Abbiamo la tua migliore offerta!</h2>
        <p className="text-xs opacity-80 mb-4">Valida per le prossime 48 ore</p>
        <div className="bg-white/20 rounded-xl p-4">
          <p className="text-sm font-medium mb-1">Risparmio annuo stimato</p>
          <p className="text-4xl font-bold">{formatCurrency(calc.risparmio_annuo)}</p>
          <p className="text-sm mt-1">-{calc.risparmio_percentuale.toFixed(1)}% · {formatCurrency(calc.risparmio_mensile)}/mese</p>
        </div>
      </div>

      {/* Confronto */}
      <div className="card mb-6">
        <h3 className="text-lg font-bold text-slate-900 mb-3">Confronto spesa annua</h3>

        {/* ⚠️ Nota IVA prominente */}
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm">
          <span className="text-amber-600 text-lg leading-none mt-0.5">⚠️</span>
          <p className="text-amber-800">
            La <strong>spesa attuale include IVA</strong> e oneri di sistema già pagati nella bolletta.
            La <strong>nuova spesa è IVA esclusa</strong>: aggiungendo IVA ({formData.tipo_cliente === 'privato' ? '10' : '22'}%) il risparmio reale sarà leggermente inferiore.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-xl">
            <X className="w-5 h-5 text-red-600 mx-auto mb-1" />
            <p className="text-xs text-slate-500 mb-1">Spesa attuale <br /><span className="text-red-600 font-semibold">IVA inclusa</span></p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(calc.spesa_annua_attuale)}</p>
            <p className="text-xs text-slate-400 mt-1">{formatCurrency(calc.spesa_mensile_attuale)}/mese</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <Check className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-xs text-slate-500 mb-1">Nuova spesa stimata <br /><span className="text-amber-600 font-semibold">IVA esclusa</span></p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(calc.spesa_annua_offerta)}</p>
            <p className="text-xs text-slate-400 mt-1">{formatCurrency(calc.spesa_mensile_offerta)}/mese</p>
          </div>
        </div>
      </div>

      {/* Dettaglio calcolo */}
      {det && (
        <div className="card mb-6">
          <button type="button" onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full flex items-center justify-between">
            <span className="font-bold text-slate-900 flex items-center gap-2 text-base">
              <Info className="w-5 h-5 text-blue-500" /> Come calcoliamo il risparmio?
            </span>
            <span className="text-blue-600 text-sm">{showBreakdown ? '▲' : '▼'}</span>
          </button>
          {showBreakdown && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-sm">
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3">
                Tutti i valori sotto sono <strong>IVA esclusa</strong>, basati su consumi medi ARERA per {formData.num_persone} {formData.num_persone === '1' ? 'persona' : 'persone'}
              </p>
              {(formData.tipo_fornitura === 'luce' || formData.tipo_fornitura === 'dual') && (
                <Row label={`⚡ Luce (${formData.consumo_annuo_kwh} kWh × ${Number(bestOffer.prezzo_kwh).toFixed(4)} €/kWh)`}
                  val={formatCurrency((parseFloat(formData.consumo_annuo_kwh) || 0) * (parseFloat(bestOffer.prezzo_kwh) || 0))} />
              )}
              {(formData.tipo_fornitura === 'gas' || formData.tipo_fornitura === 'dual') && (
                <Row label={`🔥 Gas (${formData.consumo_annuo_smc} Smc × ${Number(bestOffer.prezzo_smc).toFixed(4)} €/Smc)`}
                  val={formatCurrency((parseFloat(formData.consumo_annuo_smc) || 0) * (parseFloat(bestOffer.prezzo_smc) || 0))} />
              )}
              {det.quotaFissa > 0 && <Row label="📋 Quote fisse annue" val={formatCurrency(det.quotaFissa)} />}
              <Row label="🏛️ Oneri di sistema (stimati)" val={formatCurrency(det.oneriSistema)} />
              {det.bonusAttivazione > 0 && <Row label="🎁 Bonus attivazione" val={`- ${formatCurrency(det.bonusAttivazione)}`} green />}
              <div className="flex justify-between items-center py-2 px-3 bg-green-50 rounded-lg font-bold mt-2">
                <span>Totale stimato (IVA esclusa)</span>
                <span className="text-green-600">{formatCurrency(calc.spesa_annua_offerta)}</span>
              </div>
              <p className="text-xs text-slate-400">* La spesa effettiva dipende dai consumi reali.</p>
            </motion.div>
          )}
        </div>
      )}

      {/* Telefono — solo campo, nessun testo aggiuntivo */}
      <div className="card mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-3">Il tuo numero di telefono *</label>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="tel" value={phone}
            onChange={e => { setPhone(e.target.value); setPhoneError('') }}
            className="input-field pl-12" placeholder="+39 333 1234567" />
        </div>
        {phoneError && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{phoneError}</p>}
      </div>

      <button onClick={handleContinue} className="btn-primary w-full text-base">
        Interessato? Prosegui ›
      </button>
    </motion.div>
  )
}

const Row = ({ label, val, green }) => (
  <div className={`flex justify-between py-2 border-b border-slate-100 last:border-0 ${green ? 'text-green-600' : 'text-slate-700'}`}>
    <span>{label}</span><span className="font-semibold ml-2 text-right">{val}</span>
  </div>
)

export default Step3OfferCalculation
