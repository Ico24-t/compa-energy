import React, { useState } from 'react'
import { Zap, Flame, TrendingUp, Mail, AlertCircle, Users } from 'lucide-react'
import { useForm } from '../contexts/FormContext'
import { motion } from 'framer-motion'
import { validateEmail } from '../utils/validation'
import { createLead, saveConsumption } from '../services/api'
import { stimaConsumiDaPersone, CONSUMI_ARERA } from '../utils/calculations'

const Step2Consumption = () => {
  const { formData, updateFormData, nextStep, setLoading, setError, setLeadId, setLeadCode } = useForm()
  const [errors, setErrors] = useState({})

  const serviceTypes = [
    { id: 'luce', label: 'Solo Luce', icon: Zap, color: 'text-yellow-500' },
    { id: 'gas', label: 'Solo Gas', icon: Flame, color: 'text-orange-500' },
    { id: 'dual', label: 'Luce + Gas', icon: TrendingUp, color: 'text-blue-500' }
  ]

  const personeOptions = [
    { value: '1', label: '1 persona' },
    { value: '2', label: '2 persone' },
    { value: '3', label: '3 persone' },
    { value: '4', label: '4 persone' },
    { value: '5', label: '5 o più' }
  ]

  const handlePersoneChange = (value) => {
    const stime = stimaConsumiDaPersone(value)
    updateFormData({
      num_persone: value,
      consumo_annuo_kwh: stime.kwh.toString(),
      consumo_annuo_smc: stime.smc.toString()
    })
    setErrors(prev => ({ ...prev, num_persone: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newErrors = {}

    if (!formData.tipo_fornitura) newErrors.tipo_fornitura = 'Seleziona il tipo di servizio'
    if (!formData.num_persone) newErrors.num_persone = 'Seleziona il numero di persone'
    if (!formData.spesa_mensile_attuale) newErrors.spesa_mensile_attuale = 'Inserisci la spesa mensile'
    if (!validateEmail(formData.email)) newErrors.email = 'Email non valida'
    if (!formData.privacy_acconsentito) newErrors.privacy = 'Devi accettare la privacy policy'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Recupera IP reale prima di creare il lead
      let ipAddress = null
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json')
        const ipData = await ipRes.json()
        ipAddress = ipData.ip
      } catch {
        console.warn('IP non recuperabile')
      }

      const leadResult = await createLead({
        ...formData,
        ip_address: ipAddress,
        origine: 'form_manuale'
      })

      if (!leadResult.success) throw new Error(leadResult.error)

      setLeadId(leadResult.data.id)
      setLeadCode(leadResult.data.codice_univoco)

      // Consumi stimati da numero persone
      const stime = stimaConsumiDaPersone(formData.num_persone)

      const consumptionResult = await saveConsumption({
        lead_id: leadResult.data.id,
        tipo_fornitura: formData.tipo_fornitura,
        potenza_contrattuale: formData.potenza_contrattuale ? parseFloat(formData.potenza_contrattuale) : null,
        consumo_annuo_kwh: stime.kwh,
        consumo_annuo_smc: stime.smc,
        spesa_mensile_attuale: parseFloat(formData.spesa_mensile_attuale),
        spesa_annua_attuale: parseFloat(formData.spesa_mensile_attuale) * 12,
        tipo_tariffa: formData.tipo_tariffa || 'monoraria'
      })

      if (!consumptionResult.success) throw new Error(consumptionResult.error)

      // Aggiorna formData con i consumi stimati
      updateFormData({
        consumo_annuo_kwh: stime.kwh.toString(),
        consumo_annuo_smc: stime.smc.toString()
      })

      nextStep()
    } catch (err) {
      setError(err.message)
      console.error('Errore salvataggio dati:', err)
    } finally {
      setLoading(false)
    }
  }

  // Mostra la stima corrente se è stata selezionata
  const stimeAttuali = formData.num_persone ? stimaConsumiDaPersone(formData.num_persone) : null

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="w-full max-w-3xl mx-auto px-4"
    >
      <div className="card">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-6">
          I tuoi consumi
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Tipo servizio */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Che servizio ti interessa? *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {serviceTypes.map((service) => {
                const Icon = service.icon
                const isSelected = formData.tipo_fornitura === service.id
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                      updateFormData({ tipo_fornitura: service.id })
                      setErrors(prev => ({ ...prev, tipo_fornitura: null }))
                    }}
                    className={`
                      p-4 rounded-xl border-2 transition-all duration-200
                      ${isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-slate-200 hover:border-blue-300'
                      }
                    `}
                  >
                    <Icon className={`w-8 h-8 mx-auto mb-2 ${service.color}`} />
                    <span className="text-sm font-semibold">{service.label}</span>
                  </button>
                )
              })}
            </div>
            {errors.tipo_fornitura && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {errors.tipo_fornitura}
              </p>
            )}
          </div>

          {/* Numero persone */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Quante persone vivono in casa? *
            </label>
            <div className="grid grid-cols-5 gap-2">
              {personeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handlePersoneChange(opt.value)}
                  className={`
                    p-3 rounded-xl border-2 font-semibold text-sm transition-all duration-200
                    ${formData.num_persone === opt.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:border-blue-300 text-slate-700'
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {errors.num_persone && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {errors.num_persone}
              </p>
            )}

            {/* Mostra stima consumi */}
            {stimeAttuali && formData.tipo_fornitura && (
              <div className="mt-3 bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-semibold text-blue-700 mb-2">
                  📊 Stima consumi annui (fonte ARERA)
                </p>
                <div className="flex gap-4 flex-wrap">
                  {(formData.tipo_fornitura === 'luce' || formData.tipo_fornitura === 'dual') && (
                    <span className="text-sm text-slate-700">
                      ⚡ Luce: <strong>{stimeAttuali.kwh.toLocaleString('it-IT')} kWh/anno</strong>
                    </span>
                  )}
                  {(formData.tipo_fornitura === 'gas' || formData.tipo_fornitura === 'dual') && (
                    <span className="text-sm text-slate-700">
                      🔥 Gas: <strong>{stimeAttuali.smc.toLocaleString('it-IT')} Smc/anno</strong>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Spesa mensile attuale */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Quanto spendi al mese? * <span className="text-slate-400 font-normal">(importo in bolletta, IVA inclusa)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">€</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.spesa_mensile_attuale}
                onChange={(e) => {
                  updateFormData({ spesa_mensile_attuale: e.target.value })
                  setErrors(prev => ({ ...prev, spesa_mensile_attuale: null }))
                }}
                className="input-field pl-10"
                placeholder="Es. 120.00"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Inserisci l'importo totale della bolletta, comprensivo di IVA e tutti gli oneri
            </p>
            {errors.spesa_mensile_attuale && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {errors.spesa_mensile_attuale}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Email * <span className="text-slate-400 font-normal">(per ricevere l'offerta)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  updateFormData({ email: e.target.value })
                  setErrors(prev => ({ ...prev, email: null }))
                }}
                className="input-field pl-12"
                placeholder="tuaemail@esempio.it"
              />
            </div>
            {errors.email && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {errors.email}
              </p>
            )}
          </div>

          {/* Privacy */}
          <div className="bg-slate-50 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.privacy_acconsentito}
                onChange={(e) => {
                  updateFormData({ privacy_acconsentito: e.target.checked })
                  setErrors(prev => ({ ...prev, privacy: null }))
                }}
                className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">
                Accetto l'<a href="/privacy" target="_blank" className="text-blue-600 underline">informativa sulla privacy</a> e il trattamento dei miei dati personali *
              </span>
            </label>
            {errors.privacy && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {errors.privacy}
              </p>
            )}

            <label className="flex items-start gap-3 cursor-pointer mt-3">
              <input
                type="checkbox"
                checked={formData.marketing_acconsentito}
                onChange={(e) => updateFormData({ marketing_acconsentito: e.target.checked })}
                className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">
                Acconsento a ricevere comunicazioni commerciali
              </span>
            </label>
          </div>

          <button type="submit" className="btn-primary w-full">
            Continua e scopri l'offerta
          </button>
        </form>
      </div>
    </motion.div>
  )
}

export default Step2Consumption
