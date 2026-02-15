import React from 'react'
import { Check } from 'lucide-react'
import { useForm } from '../contexts/FormContext'

const ProgressSteps = () => {
  const { currentStep } = useForm()

  const steps = [
    { number: 1, label: 'Profilo' },
    { number: 2, label: 'Consumi' },
    { number: 3, label: 'Offerta' },
    { number: 4, label: 'Dettagli' },
    { number: 5, label: 'Anagrafica' },
    { number: 6, label: 'Conferma' }
  ]

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 px-4">
      <div className="relative">
        {/* Linea di connessione */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200">
          <div 
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step) => {
            const isCompleted = currentStep > step.number
            const isActive = currentStep === step.number
            const isInactive = currentStep < step.number

            return (
              <div key={step.number} className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    font-semibold text-sm transition-all duration-300 z-10
                    ${isCompleted ? 'bg-green-500 text-white scale-100' : ''}
                    ${isActive ? 'bg-blue-600 text-white scale-110 shadow-lg' : ''}
                    ${isInactive ? 'bg-slate-100 text-slate-400 border-2 border-slate-300' : ''}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <span 
                  className={`
                    mt-2 text-xs font-medium hidden sm:block transition-colors duration-300
                    ${isActive ? 'text-blue-600' : ''}
                    ${isCompleted ? 'text-green-600' : ''}
                    ${isInactive ? 'text-slate-400' : ''}
                  `}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Progress percentage su mobile */}
      <div className="mt-4 sm:hidden text-center">
        <span className="text-sm font-medium text-slate-600">
          Passo {currentStep} di {steps.length}
        </span>
        <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default ProgressSteps
