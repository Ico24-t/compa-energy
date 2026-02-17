import React, { useState } from 'react'
import { Zap, Flame, Layers, Users, Mail, AlertCircle } from 'lucide-react'
import { useForm } from '../contexts/FormContext'
import { motion } from 'framer-motion'
import { validateEmail } from '../utils/validation'
import { createLead, saveConsumption } from '../services/api'

// Consumi medi ARERA per numero di persone in casa
const CONSUMI_LUCE = { 1: 1500, 2: 2200, 3: 2700, 4: 3200, 5: 3800 }

// Consumi medi gas per uso prevalente
const CONSUMI_GAS = {
  cucina: 300,
  riscaldamento: 1200,
  acqua_calda: 1800
}

const Step2Consumption = () => {
  const { formData, updateFormData, nextStep, setLoading, setError, setLeadId, setLeadCode } = useForm()
  const [errors, setErrors] = useState({})

  // Stato locale per i nuovi campi
  const [persone, setPersone] = useState(formData.persone_casa || 2)
  const [spesaMensileLuce, setSpesaMensileLuce] = useState(formData.spesa_mensile_luce || '')
  const [spesaMensileGas, setSpesaMensileGas] = useState(formData.spesa_mensile_gas || '')
  const [usoGas, setUsoGas] = useState(formData.uso_gas || '')

  const serviceTypes = [
    { id: 'luce', label: 'Solo Luce', icon: Zap, color: 'text-yellow-500', gradient: 'from-yellow-400 to-orange-400' },
    { id: 'gas', label: 'Solo Gas', icon: Flame, color: 'text-blue-500', gradient: 'from-blue-400 to-cyan-400' },
    { id: 'dual', label: 'Luce + Gas', icon: Layers, color: 'text-purple-500', gradient: 'from-purple-400 to-pink-400' }
  ]

  const usiGas = [
    { id: 'cucina', label: 'Solo cucina', desc: '~300 Smc/anno' },
    { id: 'riscaldamento', label: 'Riscaldamento + cucina', desc: '~1.200 Smc/anno' },
    { id: 'acqua_calda', label: 'Anche acqua calda sanitaria', desc: '~1.800 Smc/anno' }
  ]

  const validate = () => {
    const newErrors = {}

    if (!formData.tipo_fornitura) {
      newErrors.tipo_fornitura = 'Seleziona il tipo di servizio'
    }

    if (formData.tipo_fornitura === 'luce' || formData.tipo_fornitura === 'dual') {
      if (!spesaMensileLuce || isNaN(spesaMensileLuce) || Number(spesaMensileLuce) <= 0) {
        newErrors.spesa_luce = 'Inserisci la spesa mensile per la luce'
      }
    }

    if (formData.tipo_fornitura === 'gas' || formData.tipo_fornitura === 'dual') {
      if (!spesaMensileGas || isNaN(spesaMensileGas) || Number(spesaMensileGas) <= 0) {
        newErrors.spesa_gas = 'Inserisci la spesa mensile per il gas'
      }
      if (!usoGas) {
        newErrors.uso_gas = "Seleziona l'uso prevalente del gas"
      }
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Email non valida'
    }

    if (!formData.privacy_acconsentito) {
      newErrors.privacy = 'Devi accettare la privacy policy'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    // Calcola consumi stimati dalle selezioni
    const consumoKwh = CONSUMI_LUCE[Math.min(persone, 5)] || CONSUMI_LUCE[5]
    const consumoSmc = CONSUMI_GAS[usoGas] || 0
    const spesaLuce = Number(spesaMensileLuce) || 0
    const spesaGas = Number(spesaMensileGas) || 0
    const spesaMensileAttuale = spesaLuce + spesaGas

    setLoading(true)
    setError(null)

    try {
      // Crea lead nel DB (identico all'originale)
      const leadResult = await createLead({
        ...formData,
        origine: 'form_manuale'
      })

      if (!leadResult.success) throw new Error(leadResult.error)

      setLeadId(leadResult.data.id)
      setLeadCode(leadResult.data.codice_univoco)

      // Salva consumi (compatibile con la tabella consumi_cliente esistente)
      const consumptionResult = await saveConsumption({
        lead_id: leadResult.data.id,
        tipo_fornitura: formData.tipo_fornitura,
        potenza_contrattuale: null, // non raccolta con il nuovo flusso
        consumo_annuo_kwh: (formData.tipo_fornitura === 'luce' || formData.tipo_fornitura === 'dual')
          ? consumoKwh : null,
        consumo_annuo_smc: (formData.tipo_fornitura === 'gas' || formData.tipo_fornitura === 'dual')
          ? consumoSmc : null,
        spesa_mensile_attuale: spesaMensileAttuale,
        spesa_annua_attuale: spesaMensileAttuale * 12,
        tipo_tariffa: formData.tipo_tariffa || 'monoraria'
      })

      if (!consumptionResult.success) throw new Error(consumptionResult.error)

      // Salva in formData per gli step successivi
      updateFormData({
        persone_casa: persone,
        spesa_mensile_luce: spesaLuce,
        spesa_mensile_gas: spesaGas,
        spesa_mensile_attuale: spesaMensileAttuale,
        spesa_annua_attuale: spesaMensileAttuale * 12,
        uso_gas: usoGas,
        consumo_annuo_kwh: (formData.tipo_fornitura === 'luce' || formData.tipo_fornitura === 'dual')
          ? consumoKwh : null,
        consumo_annuo_smc: (formData.tipo_fornitura === 'gas' || formData.tipo_fornitura === 'dual')
          ? consumoSmc : null,
      })

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
          La tua fornitura energetica ⚡
        </h2>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* TIPO SERVIZIO */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Cosa vuoi confrontare? *
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
                    className={`relative p-4 rounded-xl transition-all duration-200 overflow-hidden
                      ${isSelected ? 'ring-4 ring-blue-500 ring-opacity-60 shadow-lg scale-105' : 'hover:shadow-md border-2 border-slate-200'}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} ${isSelected ? 'opacity-90' : 'opacity-70'}`} />
                    <div className="relative text-white text-center">
                      <Icon className="w-8 h-8 mx-auto mb-2" />
                      <span className="text-sm font-semibold">{service.label}</span>
                    </div>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    )}
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

          {/* SLIDER PERSONE */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-4">
              <Users className="inline w-4 h-4 mr-1" />
              Quante persone vivono in casa? *
            </label>
            <div className="text-center mb-4">
              <span className="text-6xl font-bold text-blue-600">
                {persone}{persone === 5 ? '+' : ''}
              </span>
              <p className="text-slate-500 text-sm mt-1">
                {persone === 1 ? 'persona' : 'persone'}
                {formData.tipo_fornitura && (formData.tipo_fornitura === 'luce' || formData.tipo_fornitura === 'dual') && (
                  <span className="ml-2 text-blue-600 font-medium">
                    → ~{(CONSUMI_LUCE[Math.min(persone, 5)] || CONSUMI_LUCE[5]).toLocaleString()} kWh/anno stimati
                  </span>
                )}
              </p>
            </div>
            <div className="px-4">
              <input
                type="range"
                min="1"
                max="5"
                value={persone}
                onChange={e => setPersone(Number(e.target.value))}
                className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-sm text-slate-500 mt-2 px-1">
                <span>1</span><span>2</span><span>3</span><span>4</span><span>5+</span>
              </div>
            </div>
          </div>

          {/* SPESA MENSILE LUCE */}
          {(formData.tipo_fornitura === 'luce' || formData.tipo_fornitura === 'dual') && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Zap className="inline w-4 h-4 mr-1 text-yellow-500" />
                Quanto paghi di luce al mese? *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">€</span>
                <input
                  type="number"
                  min="0"
                  placeholder="es. 80"
                  value={spesaMensileLuce}
                  onChange={e => {
                    setSpesaMensileLuce(e.target.value)
                    setErrors(prev => ({ ...prev, spesa_luce: null }))
                  }}
                  className="input-field pl-10 text-lg"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Guarda la tua ultima bolletta della luce</p>
              {errors.spesa_luce && <p className="mt-1 text-sm text-red-600">{errors.spesa_luce}</p>}
            </motion.div>
          )}

          {/* SPESA MENSILE GAS + USO GAS */}
          {(formData.tipo_fornitura === 'gas' || formData.tipo_fornitura === 'dual') && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Flame className="inline w-4 h-4 mr-1 text-blue-500" />
                  Quanto paghi di gas al mese? *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">€</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="es. 60"
                    value={spesaMensileGas}
                    onChange={e => {
                      setSpesaMensileGas(e.target.value)
                      setErrors(prev => ({ ...prev, spesa_gas: null }))
                    }}
                    className="input-field pl-10 text-lg"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Guarda la tua ultima bolletta del gas</p>
                {errors.spesa_gas && <p className="mt-1 text-sm text-red-600">{errors.spesa_gas}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  A cosa serve principalmente il gas? *
                </label>
                <div className="space-y-2">
                  {usiGas.map(uso => (
                    <button
                      key={uso.id}
                      type="button"
                      onClick={() => {
                        setUsoGas(uso.id)
                        setErrors(prev => ({ ...prev, uso_gas: null }))
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all
                        ${usoGas === uso.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}
                    >
                      <span className="font-medium text-slate-800">{uso.label}</span>
                      <span className="text-sm text-slate-500">{uso.desc}</span>
                    </button>
                  ))}
                </div>
                {errors.uso_gas && <p className="mt-2 text-sm text-red-600">{errors.uso_gas}</p>}
              </div>
            </motion.div>
          )}

          {/* EMAIL */}
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

          {/* PRIVACY */}
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
            Calcola risparmio →
          </button>
        </form>
      </div>
    </motion.div>
  )
}

export default Step2Consumption
