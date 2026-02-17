import React, { useState } from 'react'
import { Zap, Flame, Gauge, TrendingUp, Mail, AlertCircle } from 'lucide-react'
import { useForm } from '../contexts/FormContext'
import { motion } from 'framer-motion'
import { validateEmail } from '../utils/validation'
import { createLead, saveConsumption } from '../services/api'

const Step2Consumption = () => {
  const { formData, updateFormData, nextStep, setLoading, setError, setLeadId, setLeadCode } = useForm()
  const [errors, setErrors] = useState({})

  const serviceTypes = [
    { id: 'luce', label: 'Solo Luce', icon: Zap, color: 'text-yellow-500' },
    { id: 'gas', label: 'Solo Gas', icon: Flame, color: 'text-orange-500' },
    { id: 'dual', label: 'Luce + Gas', icon: TrendingUp, color: 'text-blue-500' }
  ]

  const powerOptions = [
    { value: '3', label: '3 kW' },
    { value: '4.5', label: '4,5 kW' },
    { value: '6', label: '6 kW' },
    { value: '10', label: '10 kW' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const newErrors = {}
    
    if (!formData.tipo_fornitura) newErrors.tipo_fornitura = 'Seleziona il tipo di servizio'
    if (!formData.spesa_mensile_attuale) newErrors.spesa_mensile_attuale = 'Inserisci la spesa mensile'
    if (!validateEmail(formData.email)) newErrors.email = 'Email non valida'
    if (!formData.privacy_acconsentito) newErrors.privacy = 'Devi accettare la privacy policy'
    
    if ((formData.tipo_fornitura === 'luce' || formData.tipo_fornitura === 'dual') && !formData.potenza_contrattuale) {
      newErrors.potenza_contrattuale = 'Seleziona la potenza'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const leadResult = await createLead({
        ...formData,
        origine: 'form_manuale'
      })
      
      if (!leadResult.success) throw new Error(leadResult.error)
      
      setLeadId(leadResult.data.id)
      setLeadCode(leadResult.data.codice_univoco)
      
      const consumptionResult = await saveConsumption({
        lead_id: leadResult.data.id,
        tipo_fornitura: formData.tipo_fornitura,
        potenza_contrattuale: formData.potenza_contrattuale ? parseFloat(formData.potenza_contrattuale) : null,
        consumo_annuo_kwh: formData.consumo_annuo_kwh ? parseFloat(formData.consumo_annuo_kwh) : null,
        consumo_annuo_smc: formData.consumo_annuo_smc ? parseFloat(formData.consumo_annuo_smc) : null,
        spesa_mensile_attuale: parseFloat(formData.spesa_mensile_attuale),
        spesa_annua_attuale: parseFloat(formData.spesa_mensile_attuale) * 12,
        tipo_tariffa: formData.tipo_tariffa
      })
      
      if (!consumptionResult.success) throw new Error(consumptionResult.error)
      
      nextStep()
    } catch (err) {
      setError(err.message)
      console.error('Errore salvataggio dati:', err)
    } finally {
      setLoading(false)
    }
  }

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

          {/* Potenza (solo per luce o dual) */}
          {(formData.tipo_fornitura === 'luce' || formData.tipo_fornitura === 'dual') && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Potenza contatore *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {powerOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      updateFormData({ potenza_contrattuale: option.value })
                      setErrors(prev => ({ ...prev, potenza_contrattuale: null }))
                    }}
                    className={`
                      p-3 rounded-lg border-2 font-medium transition-all
                      ${formData.potenza_contrattuale === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {errors.potenza_contrattuale && (
                <p className="mt-2 text-sm text-red-600">{errors.potenza_contrattuale}</p>
              )}
            </div>
          )}

          {/* Consumi (opzionali) */}
          {(formData.tipo_fornitura === 'luce' || formData.tipo_fornitura === 'dual') && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Consumo annuo luce (kWh) <span className="text-slate-400 font-normal">- opzionale</span>
              </label>
              <input
                type="number"
                value={formData.consumo_annuo_kwh}
                onChange={(e) => updateFormData({ consumo_annuo_kwh: e.target.value })}
                className="input-field"
                placeholder="Es. 2500"
              />
            </div>
          )}

          {(formData.tipo_fornitura === 'gas' || formData.tipo_fornitura === 'dual') && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Consumo annuo gas (Smc) <span className="text-slate-400 font-normal">- opzionale</span>
              </label>
              <input
                type="number"
                value={formData.consumo_annuo_smc}
                onChange={(e) => updateFormData({ consumo_annuo_smc: e.target.value })}
                className="input-field"
                placeholder="Es. 1000"
              />
            </div>
          )}

          {/* Spesa mensile */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Quanto spendi al mese? * <span className="text-slate-400 font-normal">(circa)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">€</span>
              <input
                type="number"
                step="0.01"
                value={formData.spesa_mensile_attuale}
                onChange={(e) => {
                  updateFormData({ spesa_mensile_attuale: e.target.value })
                  setErrors(prev => ({ ...prev, spesa_mensile_attuale: null }))
                }}
                className="input-field pl-10"
                placeholder="100.00"
              />
            </div>
            {errors.spesa_mensile_attuale && (
              <p className="mt-2 text-sm text-red-600">{errors.spesa_mensile_attuale}</p>
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
              <p className="mt-2 text-sm text-red-600">{errors.email}</p>
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
              <p className="mt-2 text-sm text-red-600">{errors.privacy}</p>
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
