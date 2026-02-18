import React, { useState } from 'react'
import { Zap, Flame, TrendingUp, Mail, AlertCircle, Users } from 'lucide-react'
import { useForm } from '../contexts/FormContext'
import { motion } from 'framer-motion'
import { validateEmail } from '../utils/validation'
import { createLead, saveConsumption } from '../services/api'
import { stimaConsumiDaPersone } from '../utils/calculations'

const serviceTypes = [
  { id: 'luce', label: 'Solo Luce', icon: Zap, color: 'text-yellow-500' },
  { id: 'gas', label: 'Solo Gas', icon: Flame, color: 'text-orange-500' },
  { id: 'dual', label: 'Luce + Gas', icon: TrendingUp, color: 'text-blue-500' }
]

// Numeri grandi, testo sotto molto piccolo — tutto dentro la cella su mobile
const personeOptions = [
  { value: '1', label: '1', sub: 'pers.' },
  { value: '2', label: '2', sub: 'pers.' },
  { value: '3', label: '3', sub: 'pers.' },
  { value: '4', label: '4', sub: 'pers.' },
  { value: '5', label: '5+', sub: 'pers.' }
]

const Step2Consumption = () => {
  const { formData, updateFormData, nextStep, setLoading, setError, setLeadId, setLeadCode } = useForm()
  const [errors, setErrors] = useState({})

  const handlePersoneChange = (value) => {
    const stime = stimaConsumiDaPersone(value)
    updateFormData({ num_persone: value, consumo_annuo_kwh: stime.kwh.toString(), consumo_annuo_smc: stime.smc.toString() })
    setErrors(p => ({ ...p, num_persone: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!formData.tipo_fornitura) errs.tipo_fornitura = 'Seleziona il tipo di servizio'
    if (!formData.num_persone) errs.num_persone = 'Seleziona il numero di persone'
    if (!formData.spesa_mensile_attuale) errs.spesa_mensile_attuale = 'Inserisci la spesa mensile'
    if (!validateEmail(formData.email)) errs.email = 'Email non valida'
    if (!formData.privacy_acconsentito) errs.privacy = 'Devi accettare la privacy policy'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true); setError(null)
    try {
      let ipAddress = null
      try { ipAddress = (await (await fetch('https://api.ipify.org?format=json')).json()).ip } catch {}

      const leadRes = await createLead({ ...formData, ip_address: ipAddress, origine: 'form_manuale' })
      if (!leadRes.success) throw new Error(leadRes.error)
      setLeadId(leadRes.data.id); setLeadCode(leadRes.data.codice_univoco)

      const stime = stimaConsumiDaPersone(formData.num_persone)
      const consumRes = await saveConsumption({
        lead_id: leadRes.data.id, tipo_fornitura: formData.tipo_fornitura,
        potenza_contrattuale: formData.potenza_contrattuale ? parseFloat(formData.potenza_contrattuale) : null,
        consumo_annuo_kwh: stime.kwh, consumo_annuo_smc: stime.smc,
        spesa_mensile_attuale: parseFloat(formData.spesa_mensile_attuale),
        spesa_annua_attuale: parseFloat(formData.spesa_mensile_attuale) * 12,
        tipo_tariffa: 'monoraria'
      })
      if (!consumRes.success) throw new Error(consumRes.error)
      updateFormData({ consumo_annuo_kwh: stime.kwh.toString(), consumo_annuo_smc: stime.smc.toString() })
      nextStep()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const stime = formData.num_persone ? stimaConsumiDaPersone(formData.num_persone) : null

  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-3xl mx-auto px-4">
      <div className="card">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-6">I tuoi consumi</h2>
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Tipo servizio */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Che servizio ti interessa? *</label>
            <div className="grid grid-cols-3 gap-2">
              {serviceTypes.map(s => {
                const Icon = s.icon; const sel = formData.tipo_fornitura === s.id
                return (
                  <button key={s.id} type="button"
                    onClick={() => { updateFormData({ tipo_fornitura: s.id }); setErrors(p => ({ ...p, tipo_fornitura: null })) }}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${sel ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-200 hover:border-blue-300'}`}>
                    <Icon className={`w-6 h-6 md:w-7 md:h-7 mx-auto mb-1 ${s.color}`} />
                    <span className="text-xs md:text-sm font-semibold block leading-tight">{s.label}</span>
                  </button>
                )
              })}
            </div>
            {errors.tipo_fornitura && <Err msg={errors.tipo_fornitura} />}
          </div>

          {/* Numero persone */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
              <Users className="w-4 h-4" /> Quante persone vivono in casa? *
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {personeOptions.map(opt => {
                const sel = formData.num_persone === opt.value
                return (
                  <button key={opt.value} type="button" onClick={() => handlePersoneChange(opt.value)}
                    className={`py-2.5 rounded-xl border-2 transition-all text-center ${sel ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-blue-300 text-slate-700'}`}>
                    <span className="block text-lg font-bold leading-none">{opt.label}</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5 leading-none">{opt.sub}</span>
                  </button>
                )
              })}
            </div>
            {errors.num_persone && <Err msg={errors.num_persone} />}
            {stime && formData.tipo_fornitura && (
              <div className="mt-3 bg-blue-50 rounded-xl p-3 border border-blue-100 text-xs">
                <span className="font-semibold text-blue-700">📊 Stima ARERA: </span>
                {(formData.tipo_fornitura === 'luce' || formData.tipo_fornitura === 'dual') && <span className="text-slate-700 mr-3">⚡ <strong>{stime.kwh.toLocaleString('it-IT')} kWh/anno</strong></span>}
                {(formData.tipo_fornitura === 'gas' || formData.tipo_fornitura === 'dual') && <span className="text-slate-700">🔥 <strong>{stime.smc.toLocaleString('it-IT')} Smc/anno</strong></span>}
              </div>
            )}
          </div>

          {/* Spesa mensile */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Quanto spendi al mese? * <span className="text-slate-400 font-normal">(IVA inclusa)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">€</span>
              <input type="number" step="0.01" min="0" value={formData.spesa_mensile_attuale}
                onChange={e => { updateFormData({ spesa_mensile_attuale: e.target.value }); setErrors(p => ({ ...p, spesa_mensile_attuale: null })) }}
                className="input-field pl-10" placeholder="Es. 120.00" />
            </div>
            <p className="mt-1 text-xs text-slate-500">Inserisci il totale della bolletta comprensivo di tutti gli oneri</p>
            {errors.spesa_mensile_attuale && <Err msg={errors.spesa_mensile_attuale} />}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email *</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="email" value={formData.email}
                onChange={e => { updateFormData({ email: e.target.value }); setErrors(p => ({ ...p, email: null })) }}
                className="input-field pl-12" placeholder="tuaemail@esempio.it" />
            </div>
            {errors.email && <Err msg={errors.email} />}
          </div>

          {/* Privacy */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.privacy_acconsentito}
                onChange={e => { updateFormData({ privacy_acconsentito: e.target.checked }); setErrors(p => ({ ...p, privacy: null })) }}
                className="mt-0.5 w-5 h-5 rounded border-slate-300 text-blue-600 flex-shrink-0" />
              <span className="text-sm text-slate-700">Accetto l'<a href="/privacy" target="_blank" className="text-blue-600 underline">informativa sulla privacy</a> *</span>
            </label>
            {errors.privacy && <Err msg={errors.privacy} />}
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.marketing_acconsentito}
                onChange={e => updateFormData({ marketing_acconsentito: e.target.checked })}
                className="mt-0.5 w-5 h-5 rounded border-slate-300 text-blue-600 flex-shrink-0" />
              <span className="text-sm text-slate-700">Acconsento a ricevere comunicazioni commerciali</span>
            </label>
          </div>

          <button type="submit" className="btn-primary w-full">Continua e scopri l'offerta</button>
        </form>
      </div>
    </motion.div>
  )
}

const Err = ({ msg }) => (
  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
    <AlertCircle className="w-4 h-4 flex-shrink-0" />{msg}
  </p>
)

export default Step2Consumption
