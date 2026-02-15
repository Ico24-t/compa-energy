import React from 'react'
import { User, Briefcase, Building2 } from 'lucide-react'
import { useForm } from '../contexts/FormContext'
import { motion } from 'framer-motion'

const Step1ClientType = () => {
  const { formData, updateFormData, nextStep } = useForm()

  const clientTypes = [
    {
      id: 'privato',
      label: 'Privato',
      icon: User,
      description: 'Per uso domestico',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'p_iva',
      label: 'Partita IVA',
      icon: Briefcase,
      description: 'Professionista',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'azienda',
      label: 'Azienda',
      icon: Building2,
      description: 'Impresa',
      color: 'from-emerald-500 to-emerald-600'
    }
  ]

  const handleSelect = (type) => {
    updateFormData({ tipo_cliente: type })
    // Auto-avanza dopo una breve pausa per feedback visivo
    setTimeout(() => {
      nextStep()
    }, 300)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto px-4"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-3">
          Iniziamo! 👋
        </h1>
        <p className="text-lg text-slate-600">
          Sei un privato o un'azienda?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {clientTypes.map((type, index) => {
          const Icon = type.icon
          const isSelected = formData.tipo_cliente === type.id

          return (
            <motion.button
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => handleSelect(type.id)}
              className={`
                relative overflow-hidden rounded-2xl p-6 md:p-8 
                transition-all duration-300 transform
                ${isSelected 
                  ? 'shadow-2xl scale-105 ring-4 ring-blue-500 ring-opacity-50' 
                  : 'shadow-lg hover:shadow-xl hover:scale-105'
                }
              `}
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${type.color} opacity-${isSelected ? '100' : '90'}`} />
              
              {/* Content */}
              <div className="relative text-white">
                <Icon className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4" strokeWidth={1.5} />
                <h3 className="text-xl md:text-2xl font-bold mb-2">
                  {type.label}
                </h3>
                <p className="text-sm md:text-base text-white/90">
                  {type.description}
                </p>
              </div>

              {/* Check indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 bg-white rounded-full p-1"
                >
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-500">
          🔒 I tuoi dati sono al sicuro e protetti
        </p>
      </div>
    </motion.div>
  )
}

export default Step1ClientType
