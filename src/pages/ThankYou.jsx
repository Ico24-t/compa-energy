import React from 'react'
import { CheckCircle, Mail, Phone } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const ThankYou = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { leadCode, fromUpload } = location.state || {}

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
        >
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        </motion.div>

        <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-3">
          Richiesta Inviata! 🎉
        </h1>
        
        {fromUpload && (
          <p className="text-lg text-slate-600 mb-8">
            Abbiamo analizzato la tua bolletta con successo
          </p>
        )}

        {leadCode && (
          <div className="bg-blue-50 rounded-xl p-6 mb-8">
            <p className="text-sm text-slate-600 mb-2">Il tuo codice pratica</p>
            <p className="text-3xl font-bold text-blue-600 font-mono">{leadCode}</p>
            <p className="text-sm text-slate-600 mt-2">Conservalo per future comunicazioni</p>
          </div>
        )}

        <div className="text-left space-y-4 mb-8">
          <h3 className="text-xl font-bold text-slate-900 mb-4 text-center">Cosa succede ora?</h3>
          
          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
              1
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-slate-900">Email di conferma</h4>
              </div>
              <p className="text-sm text-slate-600">
                Riceverai un'email con tutti i dettagli dell'offerta
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
              2
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Phone className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-slate-900">Chiamata operatore</h4>
              </div>
              <p className="text-sm text-slate-600">
                Un nostro operatore ti contatterà entro 24-48 ore
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
              3
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-slate-900">Attivazione contratto</h4>
              </div>
              <p className="text-sm text-slate-600">
                Procederemo con l'attivazione dopo la tua conferma
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl p-6 mb-6">
          <p className="text-sm text-slate-700 mb-2">Hai domande?</p>
          <p className="font-semibold text-slate-900">{import.meta.env.VITE_OPERATOR_PHONE}</p>
          <p className="text-sm text-slate-600">{import.meta.env.VITE_OPERATOR_EMAIL}</p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="btn-secondary w-full"
        >
          Torna alla home
        </button>
      </motion.div>
    </div>
  )
}

export default ThankYou
