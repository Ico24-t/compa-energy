import React from 'react'
import { RefreshCw } from 'lucide-react'
import { useForm } from '../contexts/FormContext'
import ProgressSteps from '../components/ProgressSteps'
import Step1ClientType from '../components/Step1ClientType'
import Step2Consumption from '../components/Step2Consumption'
import Step3OfferCalculation from '../components/Step3OfferCalculation'
import Step4OfferDetails from '../components/Step4OfferDetails'
import Step5PersonalData from '../components/Step5PersonalData'
import Step6Confirmation from '../components/Step6Confirmation'

const MainForm = () => {
  const { currentStep, resetForm } = useForm()

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

  return (
    <div className="container mx-auto max-w-6xl">
      {/* Barra progresso solo negli step intermedi */}
      {currentStep > 1 && currentStep < 6 && <ProgressSteps />}

      {renderStep()}

      {/* ✅ FIX: Pulsante "Ricomincia" sempre visibile negli step 2-5
          Permette all'utente di uscire anche se il sistema mostra "offerta già ottima"
          o se si blocca in qualsiasi stato intermedio */}
      {currentStep > 1 && currentStep < 6 && (
        <div className="text-center mt-8 pb-4">
          <button
            onClick={resetForm}
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
