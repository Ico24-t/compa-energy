import React, { useState, useContext } from 'react'
import { motion } from 'framer-motion'
import { Zap, Flame, Layers, Users, Euro, ChevronRight, ChevronLeft } from 'lucide-react'
import { FormContext } from '../contexts/FormContext'

// Tabella consumi medi ARERA per numero persone
const CONSUMI_LUCE = {
  1: 1500, 2: 2200, 3: 2700, 4: 3200, 5: 3800
}

// Tabella consumi medi gas per uso
const CONSUMI_GAS = {
  cucina: 300,
  riscaldamento: 1200,
  acqua_calda: 1800
}

const Step2Consumption = ({ onNext, onPrev }) => {
  const { formData, updateFormData } = useContext(FormContext)

  const [tipoFornitura, setTipoFornitura] = useState(formData.tipo_fornitura || '')
  const [persone, setPersone] = useState(formData.persone_casa || 2)
  const [spesaMensileLuce, setSpesaMensileLuce] = useState(formData.spesa_mensile_luce || '')
  const [spesaMensileGas, setSpesaMensileGas] = useState(formData.spesa_mensile_gas || '')
  const [usoGas, setUsoGas] = useState(formData.uso_gas || '')
  const [email, setEmail] = useState(formData.email || '')
  const [errors, setErrors] = useState({})

  const forniture = [
    { id: 'luce', label: 'Solo Luce', icon: Zap, color: 'from-yellow-400 to-orange-400' },
    { id: 'gas', label: 'Solo Gas', icon: Flame, color: 'from-blue-400 to-cyan-400' },
    { id: 'dual', label: 'Luce + Gas', icon: Layers, color: 'from-purple-400 to-pink-400' }
  ]

  const usiGas = [
    { id: 'cucina', label: 'Solo cucina', desc: '~300 Smc/anno' },
    { id: 'riscaldamento', label: 'Riscaldamento + cucina', desc: '~1.200 Smc/anno' },
    { id: 'acqua_calda', label: 'Anche acqua calda sanitaria', desc: '~1.800 Smc/anno' }
  ]

  const validate = () => {
    const newErrors = {}
    if (!tipoFornitura) newErrors.tipoFornitura = 'Seleziona il tipo di fornitura'
    if (tipoFornitura === 'luce' || tipoFornitura === 'dual') {
      if (!spesaMensileLuce || isNaN(spesaMensileLuce) || Number(spesaMensileLuce) <= 0)
        newErrors.spesaLuce = 'Inserisci la spesa mensile luce'
    }
    if (tipoFornitura === 'gas' || tipoFornitura === 'dual') {
      if (!spesaMensileGas || isNaN(spesaMensileGas) || Number(spesaMensileGas) <= 0)
        newErrors.spesaGas = 'Inserisci la spesa mensile gas'
      if (!usoGas) newErrors.usoGas = 'Seleziona l\'uso prevalente del gas'
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = 'Inserisci un\'email valida'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validate()) return

    // Calcola consumi stimati
    const consumoKwh = CONSUMI_LUCE[Math.min(persone, 5)] || CONSUMI_LUCE[5]
    const consumoSmc = CONSUMI_GAS[usoGas] || 0
    const spesaMensileAttuale = (Number(spesaMensileLuce) || 0) + (Number(spesaMensileGas) || 0)

    updateFormData({
      tipo_fornitura: tipoFornitura,
      persone_casa: persone,
      spesa_mensile_luce: Number(spesaMensileLuce) || 0,
      spesa_mensile_gas: Number(spesaMensileGas) || 0,
      spesa_mensile_attuale: spesaMensileAttuale,
      spesa_annua_attuale: spesaMensileAttuale * 12,
      uso_gas: usoGas,
      consumo_annuo_kwh: (tipoFornitura === 'luce' || tipoFornitura === 'dual') ? consumoKwh : null,
      consumo_annuo_smc: (tipoFornitura === 'gas' || tipoFornitura === 'dual') ? consumoSmc : null,
      email
    })

    onNext()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-2">
          La tua fornitura energetica ⚡
        </h2>
        <p className="text-slate-600">Pochi dati per trovare la migliore offerta per te</p>
      </div>

      <div className="card space-y-8">

        {/* TIPO FORNITURA */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Cosa vuoi confrontare? *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {forniture.map(f => {
              const Icon = f.icon
              const selected = tipoFornitura === f.id
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setTipoFornitura(f.id)
                    setErrors(prev => ({ ...prev, tipoFornitura: null }))
                  }}
                  className={`relative p-4 rounded-xl transition-all duration-200 ${selected ? 'ring-4 ring-blue-500 ring-opacity-50 shadow-lg scale-105' : 'hover:shadow-md'}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-90 rounded-xl`} />
                  <div className="relative text-white text-center">
                    <Icon className="w-8 h-8 mx-auto mb-2" />
                    <span className="text-sm font-semibold">{f.label}</span>
                  </div>
                  {selected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          {errors.tipoFornitura && <p className="mt-2 text-sm text-red-600">{errors.tipoFornitura}</p>}
        </div>

        {/* SLIDER PERSONE */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-4">
            <Users className="inline w-4 h-4 mr-1" />
            Quante persone vivono in casa? *
          </label>

          {/* Numero grande */}
          <div className="text-center mb-4">
            <span className="text-6xl font-bold text-blue-600">
              {persone}{persone === 5 ? '+' : ''}
            </span>
            <p className="text-slate-500 text-sm mt-1">
              {persone === 1 ? 'persona' : 'persone'}
              {tipoFornitura && (tipoFornitura === 'luce' || tipoFornitura === 'dual') && (
                <span className="ml-2 text-blue-600 font-medium">
                  → ~{(CONSUMI_LUCE[Math.min(persone, 5)] || CONSUMI_LUCE[5]).toLocaleString()} kWh/anno stimati
                </span>
              )}
            </p>
          </div>

          {/* Slider */}
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
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5+</span>
            </div>
          </div>
        </div>

        {/* SPESA MENSILE LUCE */}
        {(tipoFornitura === 'luce' || tipoFornitura === 'dual') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
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
                  setErrors(prev => ({ ...prev, spesaLuce: null }))
                }}
                className="input-field pl-10 text-lg"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Guarda la tua ultima bolletta della luce</p>
            {errors.spesaLuce && <p className="mt-1 text-sm text-red-600">{errors.spesaLuce}</p>}
          </motion.div>
        )}

        {/* SPESA MENSILE GAS */}
        {(tipoFornitura === 'gas' || tipoFornitura === 'dual') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
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
                  setErrors(prev => ({ ...prev, spesaGas: null }))
                }}
                className="input-field pl-10 text-lg"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Guarda la tua ultima bolletta del gas</p>
            {errors.spesaGas && <p className="mt-1 text-sm text-red-600">{errors.spesaGas}</p>}

            {/* USO GAS */}
            <div className="mt-4">
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
                      setErrors(prev => ({ ...prev, usoGas: null }))
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      usoGas === uso.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <span className="font-medium text-slate-800">{uso.label}</span>
                    <span className="text-sm text-slate-500">{uso.desc}</span>
                  </button>
                ))}
              </div>
              {errors.usoGas && <p className="mt-2 text-sm text-red-600">{errors.usoGas}</p>}
            </div>
          </motion.div>
        )}

        {/* EMAIL */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            La tua email *
          </label>
          <input
            type="email"
            placeholder="mario.rossi@email.it"
            value={email}
            onChange={e => {
              setEmail(e.target.value)
              setErrors(prev => ({ ...prev, email: null }))
            }}
            className="input-field"
          />
          <p className="text-xs text-slate-500 mt-1">Ti invieremo il riepilogo dell'offerta</p>
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

      </div>

      {/* NAVIGAZIONE */}
      <div className="flex gap-4">
        <button onClick={onPrev} className="btn-secondary flex items-center gap-2">
          <ChevronLeft className="w-5 h-5" /> Indietro
        </button>
        <button onClick={handleNext} className="btn-primary flex-1 flex items-center justify-center gap-2">
          Calcola risparmio <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  )
}

export default Step2Consumption
