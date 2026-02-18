import React from 'react'
import { User, Briefcase, Building2 } from 'lucide-react'
import { useForm } from '../contexts/FormContext'
import { motion } from 'framer-motion'

const clientTypes = [
  { id: 'privato', label: 'Privato', icon: User, description: 'Per uso domestico', color: 'from-blue-500 to-blue-600' },
  { id: 'p_iva', label: 'Partita IVA', icon: Briefcase, description: 'Professionista', color: 'from-purple-500 to-purple-600' },
  { id: 'azienda', label: 'Azienda', icon: Building2, description: 'Impresa', color: 'from-emerald-500 to-emerald-600' }
]

const Step1ClientType = () => {
  const { formData, updateFormData, nextStep } = useForm()

  const handleSelect = (type) => {
    updateFormData({ tipo_cliente: type })
    setTimeout(() => nextStep(), 300)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto px-4"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-3">Iniziamo!</h1>
        <p className="text-lg text-slate-600">Sei un privato o un'azienda?</p>
      </div>

      {/* Su mobile: 3 colonne affiancate e compatte. Su desktop: più alte */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        {clientTypes.map((type, i) => {
          const Icon = type.icon
          const isSelected = formData.tipo_cliente === type.id
          return (
            <motion.button
              key={type.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              onClick={() => handleSelect(type.id)}
              className={`relative overflow-hidden rounded-2xl transition-all duration-300 transform
                py-5 px-2 md:py-10 md:px-6
                ${isSelected ? 'shadow-2xl scale-105 ring-4 ring-blue-500/50' : 'shadow-lg hover:shadow-xl hover:scale-105'}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${type.color}`} />
              <div className="relative text-white">
                <Icon className="w-8 h-8 md:w-16 md:h-16 mx-auto mb-2 md:mb-4" strokeWidth={1.5} />
                <h3 className="text-sm md:text-2xl font-bold mb-0.5 md:mb-2 leading-tight">{type.label}</h3>
                <p className="text-xs md:text-base text-white/90 leading-tight">{type.description}</p>
              </div>
              {isSelected && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute top-2 right-2 bg-white rounded-full p-0.5">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </motion.div>
              )}
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

export default Step1ClientType
