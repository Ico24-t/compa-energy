import React, { useState } from 'react'
import { RefreshCw, ClipboardList, FileImage, ChevronRight, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from '../contexts/FormContext'
import ProgressSteps from '../components/ProgressSteps'
import Step1ClientType from '../components/Step1ClientType'
import Step2Consumption from '../components/Step2Consumption'
import Step3OfferCalculation from '../components/Step3OfferCalculation'
import Step4OfferDetails from '../components/Step4OfferDetails'
import Step5PersonalData from '../components/Step5PersonalData'
import Step6Confirmation from '../components/Step6Confirmation'

// ── Step 0: scelta percorso ───────────────────────────────────────────────────
const Step0Scelta = ({ onScegliManuale }) => {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="container mx-auto max-w-3xl px-4 py-8"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-200">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Trova la tua offerta migliore
        </h1>
        <p className="text-slate-500 text-lg">
          Come preferisci procedere?
        </p>
      </div>

      {/* Card scelta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Opzione A: carica bolletta */}
        <motion.button
          whileHover={{ y: -4, shadow: '0 20px 40px rgba(0,0,0,0.1)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/bolletta')}
          className="group relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-7 text-left shadow-xl shadow-blue-200 overflow-hidden"
        >
          {/* Decorazione sfondo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-6 -translate-x-6" />

          <div className="relative">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-5">
              <FileImage className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Carica la bolletta
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed mb-5">
              Scatta una foto o carica il PDF della tua bolletta. Estraiamo i dati automaticamente e calcoliamo il risparmio in pochi secondi.
            </p>
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <span>⚡ Il più veloce</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">Consigliato</span>
            </div>
            <div className="flex items-center gap-1.5 mt-4 text-white/80 text-xs font-medium group-hover:text-white transition-colors">
              Inizia subito <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </motion.button>

        {/* Opzione B: compila manualmente */}
        <motion.button
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={onScegliManuale}
          className="group bg-white rounded-2xl p-7 text-left shadow-sm border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -translate-y-8 translate-x-8" />

          <div className="relative">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-5 group-hover:bg-blue-50 transition-colors">
              <ClipboardList className="w-6 h-6 text-slate-600 group-hover:text-blue-600 transition-colors" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Compila i campi
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-5">
              Inserisci manualmente i tuoi consumi e i dati della fornitura. Ideale se non hai la bolletta a portata di mano.
            </p>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <span>📋 Compilazione guidata</span>
            </div>
            <div className="flex items-center gap-1.5 mt-4 text-slate-400 text-xs font-medium group-hover:text-blue-600 transition-colors">
              Procedi <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </motion.button>
      </div>

      {/* Note privacy */}
      <p className="text-center text-xs text-slate-400 mt-8">
        🔒 I tuoi dati sono al sicuro. Non li condividiamo con terze parti senza il tuo consenso.
      </p>
    </motion.div>
  )
}

// ── MainForm ──────────────────────────────────────────────────────────────────
const MainForm = () => {
  const { currentStep, resetForm } = useForm()
  const [percorso, setPercorso] = useState(null) // null = step0, 'manuale' = form normale

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
    return (
      <Step0Scelta
        onScegliManuale={() => setPercorso('manuale')}
      />
    )
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
        <div className="text-center mt-8 pb-4 flex items-center justify-center gap-4">
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
