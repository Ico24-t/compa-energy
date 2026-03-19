import React, { useState } from 'react'
import { Zap, Flame, TrendingUp, Mail, AlertCircle } from 'lucide-react'
import { useForm } from '../contexts/FormContext'
import { motion } from 'framer-motion'
import { validateEmail } from '../utils/validation'
import { createLead, saveConsumption } from '../services/api'

const serviceTypes = [
  { id: 'luce', label: 'Solo Luce', icon: Zap, color: 'text-yellow-500' },
  { id: 'gas', label: 'Solo Gas', icon: Flame, color: 'text-orange-500' },
  { id: 'dual', label: 'Luce + Gas', icon: TrendingUp, color: 'text-blue-500' }
]

const Step2Consumption = () => {
  const { formData, updateFormData, nextStep, setLoading, setError, setLeadId, setLeadCode } = useForm()
  const [errors, setErrors] = useState({})

  const mostraKwh = formData.tipo_fornitura === 'luce' || formData.tipo_fornitura === 'dual'
  const mostraSmc = formData.tipo_fornitura === 'gas' || formData.tipo_fornitura === 'dual'

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!formData.tipo_fornitura) errs.tipo_fornitura = 'Seleziona il tipo di servizio'
    if (!formData.spesa_mensile_attuale) errs.spesa_mensile_attuale = 'Inserisci la spesa mensile'
    if (mostraKwh && !formData.consumo_annuo_kwh) errs.consumo_kwh = 'Inserisci il consumo annuo di luce'
    if (mostraSmc && !formData.consumo_annuo_smc) errs.consumo_smc = 'Inserisci il consumo annuo di gas'
    if (!validateEmail(formData.email)) errs.email = 'Email non valida'
    if (!formData.privacy_acconsentito) errs.privacy = 'Devi accettare la privacy policy'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true); setError(null)
    try {
      let ipAddress = null
      try { ipAddress = (await (await fetch('https://api.ipify.org?format=json')).json()).ip } catch {}

      const leadRes = await createLead({ ...formData, ip_address: ipAddress, origine: 'form_manuale' })
      if (!leadRes.success) throw new Error(leadRes.error)
      setLeadId(leadRes.data.id)
      setLeadCode(leadRes.data.codice_univoco)

      const consumRes = await saveConsumption({
        lead_id: leadRes.data.id,
        tipo_fornitura: formData.tipo_fornitura,
        potenza_contrattuale: formData.potenza_contrattuale ? parseFloat(formData.potenza_contrattuale) : null,
        consumo_annuo_kwh: mostraKwh ? parseFloat(formData.consumo_annuo_kwh) : 0,
        consumo_annuo_smc: mostraSmc ? parseFloat(formData.consumo_annuo_smc) : 0,
        spesa_mensile_attuale: parseFloat(formData.spesa_mensile_attuale),
        spesa_annua_attuale: parseFloat(formData.spesa_mensile_attuale) * 12,
        tipo_tariffa: 'monoraria'
      })
      if (!consumRes.success) throw new Error(consumRes.error)

      // Aggiorna il context con i consumi reali inseriti dall'utente
      // così Step3 può usarli direttamente per il calcolo offerta
      updateFormData({
        consumo_annuo_kwh: mostraKwh ? formData.consumo_annuo_kwh : '0',
        consumo_annuo_smc: mostraSmc ? formData.consumo_annuo_smc : '0',
        spesa_annua_attuale: (parseFloat(formData.spesa_mensile_attuale) * 12).toString(),
      })

      nextStep()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
                const Icon = s.icon
                const sel = formData.tipo_fornitura === s.id
                return (
                  <button key={s.id} type="button"
                    onClick={() => {
                      updateFormData({ tipo_fornitura: s.id, consumo_annuo_kwh: '', consumo_annuo_smc: '' })
                      setErrors(p => ({ ...p, tipo_fornitura: null, consumo_kwh: null, consumo_smc: null }))
                    }}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${sel ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-200 hover:border-blue-300'}`}>
                    <Icon className={`w-6 h-6 md:w-7 md:h-7 mx-auto mb-1 ${s.color}`} />
                    <span className="text-xs md:text-sm font-semibold block leading-tight">{s.label}</span>
                  </button>
                )
              })}
            </div>
            {errors.tipo_fornitura && <Err msg={errors.tipo_fornitura} />}
          </div>

          {/* Consumo annuo — appare solo dopo aver scelto il tipo */}
          {formData.tipo_fornitura && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Consumo annuo *
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Trovi il valore aggregato annuo nella sezione "consumi" della tua bolletta
                </p>

                <div className={`grid gap-3 ${mostraKwh && mostraSmc ? 'grid-cols-2' : 'grid-cols-1 max-w-xs'}`}>
                  {mostraKwh && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-yellow-500" /> Energia elettrica
                      </label>
                      <div className="relative">
                        <input
                          type="number" step="1" min="0"
                          value={formData.consumo_annuo_kwh}
                          onChange={e => { updateFormData({ consumo_annuo_kwh: e.target.value }); setErrors(p => ({ ...p, consumo_kwh: null })) }}
                          className="input-field pr-14"
                          placeholder="Es. 1800"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">kWh/a</span>
                      </div>
                      {errors.consumo_kwh && <Err msg={errors.consumo_kwh} />}
                    </div>
                  )}

                  {mostraSmc && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-orange-500" /> Gas naturale
                      </label>
                      <div className="relative">
                        <input
                          type="number" step="1" min="0"
                          value={formData.consumo_annuo_smc}
                          onChange={e => { updateFormData({ consumo_annuo_smc: e.target.value }); setErrors(p => ({ ...p, consumo_smc: null })) }}
                          className="input-field pr-14"
                          placeholder="Es. 1000"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">Smc/a</span>
                      </div>
                      {errors.consumo_smc && <Err msg={errors.consumo_smc} />}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Spesa mensile attuale */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Quanto spendi mediamente al mese? * <span className="text-slate-400 font-normal">(IVA inclusa)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">€</span>
              <input
                type="number" step="0.01" min="0"
                value={formData.spesa_mensile_attuale}
                onChange={e => { updateFormData({ spesa_mensile_attuale: e.target.value }); setErrors(p => ({ ...p, spesa_mensile_attuale: null })) }}
                className="input-field pl-10"
                placeholder="Es. 120.00"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">Importo medio mensile comprensivo di tutti gli oneri</p>
            {errors.spesa_mensile_attuale && <Err msg={errors.spesa_mensile_attuale} />}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email *</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email" value={formData.email}
                onChange={e => { updateFormData({ email: e.target.value }); setErrors(p => ({ ...p, email: null })) }}
                className="input-field pl-12"
                placeholder="tuaemail@esempio.it"
              />
            </div>
            {errors.email && <Err msg={errors.email} />}
          </div>

          {/* Privacy */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.privacy_acconsentito}
                onChange={e => { updateFormData({ privacy_acconsentito: e.target.checked }); setErrors(p => ({ ...p, privacy: null })) }}
                className="mt-0.5 w-5 h-5 rounded border-slate-300 text-blue-600 flex-shrink-0" />
              <span className="text-sm text-slate-700">
                Accetto l'<a href="/privacy-policy" target="_blank" className="text-blue-600 underline">informativa sulla privacy</a> *
              </span>
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
