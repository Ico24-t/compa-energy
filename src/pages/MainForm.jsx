import React, { useState, useEffect } from 'react'
import { RefreshCw, FileImage, ClipboardList, ChevronRight, Zap } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from '../contexts/FormContext'
import ProgressSteps from '../components/ProgressSteps'
import Step1ClientType from '../components/Step1ClientType'
import Step2Consumption from '../components/Step2Consumption'
import Step3OfferCalculation from '../components/Step3OfferCalculation'
import Step4OfferDetails from '../components/Step4OfferDetails'
import Step5PersonalData from '../components/Step5PersonalData'
import Step6Confirmation from '../components/Step6Confirmation'

// Opzioni scelta percorso — stesso stile di Step1ClientType
const scelte = [
  {
    id: 'bolletta',
    label: 'Carica bolletta',
    icon: FileImage,
    description: 'Automatico e veloce',
    color: 'from-blue-500 to-blue-600',
    badge: '⚡ Consigliato'
  },
  {
    id: 'manuale',
    label: 'Compila i campi',
    icon: ClipboardList,
    description: 'Guida passo passo',
    color: 'from-purple-500 to-purple-600',
    badge: null
  }
]

// ── Step 0: scelta percorso ───────────────────────────────────────────────────
const Step0Scelta = ({ onScegliManuale }) => {
  const navigate = useNavigate()

  const handleScelta = (id) => {
    if (id === 'bolletta') navigate('/bolletta')
    else onScegliManuale()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto px-4"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-3">
          Trova la tua offerta migliore
        </h1>
        <p className="text-lg text-slate-600">Come preferisci procedere?</p>
      </div>

      {/* Stessa griglia di Step1ClientType: 2 colonne affiancate anche su mobile */}
      <div className="grid grid-cols-2 gap-3 md:gap-6 max-w-lg mx-auto">
        {scelte.map((s, i) => {
          const Icon = s.icon
          return (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              onClick={() => handleScelta(s.id)}
              className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 transform py-5 px-2 md:py-10 md:px-6"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${s.color}`} />
              <div className="relative text-white">
                <Icon className="w-8 h-8 md:w-16 md:h-16 mx-auto mb-2 md:mb-4" strokeWidth={1.5} />
                <h3 className="text-sm md:text-2xl font-bold mb-0.5 md:mb-2 leading-tight">{s.label}</h3>
                <p className="text-xs md:text-base text-white/90 leading-tight">{s.description}</p>
                {s.badge && (
                  <span className="inline-block mt-1.5 bg-white/20 text-white text-[10px] md:text-xs font-semibold px-2 py-0.5 rounded-full">
                    {s.badge}
                  </span>
                )}
              </div>
            </motion.button>
          )
        })}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-slate-500">🔒 I tuoi dati sono al sicuro e protetti</p>
      </div>
    </motion.div>
  )
}

// ── MainForm ──────────────────────────────────────────────────────────────────
const MainForm = () => {
  const { currentStep, resetForm } = useForm()
  const [percorso, setPercorso] = useState(null)
  const location = useLocation()

  // Quando si torna alla home (navigazione da logo o link), resetta tutto
  useEffect(() => {
    setPercorso(null)
    resetForm()
  }, [location.key])

  const handleReset = () => {
    setPercorso(null)
    resetForm()
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1ClientType />
      case 2: return <Step2Consumption />
      case 3: return <Step3OfferCalculation />
      case 4: return <Step4OfferDetails />
      case 5: return <Step5PersonalData />
      case 6: return <Step6Confirmation />
      default: return <Step1ClientType />
    }
  }

  // Step 0 — scelta percorso
  if (!percorso) {
    return <Step0Scelta onScegliManuale={() => setPercorso('manuale')} />
  }

  // Percorso manuale — flusso esistente invariato
  return (
    <div className="container mx-auto max-w-6xl">
      {currentStep > 1 && currentStep < 6 && <ProgressSteps />}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      {currentStep > 1 && currentStep < 6 && (
        <div className="text-center mt-8 pb-4">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Ricomincia dall'inizio
          </button>
        </div>
      )}
    </div>
  )
}

export default MainForm
