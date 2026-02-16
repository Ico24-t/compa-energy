import React, { useEffect, useState } from 'react'
import { CheckCircle, Mail, Phone, FileText, Loader } from 'lucide-react'
import { useForm } from '../contexts/FormContext'
import { motion } from 'framer-motion'
import { sendBothEmails } from '../services/emailService'
import { updateLeadStatus } from '../services/api'

const Step6Confirmation = () => {
  const { formData, leadCode, leadId, resetForm } = useForm()
  useEffect(() => {
  console.log('=== DEBUG EMAILJS ===')
  console.log('Service ID:', import.meta.env.VITE_EMAILJS_SERVICE_ID)
  console.log('Template Cliente:', import.meta.env.VITE_EMAILJS_TEMPLATE_ID_CLIENTE)
  console.log('Template Azienda:', import.meta.env.VITE_EMAILJS_TEMPLATE_ID_AZIENDA)
  console.log('Public Key:', import.meta.env.VITE_EMAILJS_PUBLIC_KEY ? 'SET' : 'MISSING')
}, [])
  const [sending, setSending] = useState(true)
  const [emailsSent, setEmailsSent] = useState(false)

  useEffect(() => {
    sendConfirmationEmails()
  }, [])

  const sendConfirmationEmails = async () => {
    try {
      const emailData = {
        ...formData,
        codice_univoco: leadCode,
        fornitore_nome: formData.offerta_selezionata?.fornitori?.nome,
        descrizione_offerta: formData.offerta_selezionata?.descrizione_completa,
        ...formData.calcolo_risparmio
      }

      await sendBothEmails(emailData)
      await updateLeadStatus(leadId, 'inviato_operatore')
      
      setEmailsSent(true)
    } catch (error) {
      console.error('Errore invio email:', error)
    } finally {
      setSending(false)
    }
  }

  if (sending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader className="w-16 h-16 text-blue-600 animate-spin mb-4" />
        <p className="text-lg font-medium text-slate-700">Invio richiesta in corso...</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl mx-auto px-4"
    >
      <div className="card text-center">
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
        <p className="text-lg text-slate-600 mb-8">
          La tua richiesta è stata inviata con successo
        </p>

        {/* Codice pratica */}
        <div className="bg-blue-50 rounded-xl p-6 mb-8">
          <p className="text-sm text-slate-600 mb-2">Il tuo codice pratica</p>
          <p className="text-3xl font-bold text-blue-600 font-mono">{leadCode}</p>
          <p className="text-sm text-slate-600 mt-2">Conservalo per future comunicazioni</p>
        </div>

        {/* Prossimi passi */}
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
                Riceverai un'email con tutti i dettagli dell'offerta selezionata
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
                <h4 className="font-semibold text-slate-900">Chiamata dell'operatore</h4>
              </div>
              <p className="text-sm text-slate-600">
                Un nostro operatore ti contatterà entro 24 ore per verificare i dati e rispondere alle tue domande
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
              3
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-slate-900">Attivazione contratto</h4>
              </div>
              <p className="text-sm text-slate-600">
                Se confermi, procederemo con l'attivazione del tuo nuovo contratto
              </p>
            </div>
          </div>
        </div>

        {/* Info contatto */}
        <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl p-6 mb-6">
          <p className="text-sm text-slate-700 mb-2">Hai domande?</p>
          <p className="font-semibold text-slate-900">{import.meta.env.VITE_OPERATOR_PHONE}</p>
          <p className="text-sm text-slate-600">{import.meta.env.VITE_OPERATOR_EMAIL}</p>
        </div>

        <button
          onClick={resetForm}
          className="btn-secondary w-full"
        >
          Nuova richiesta
        </button>
      </div>
    </motion.div>
  )
}

export default Step6Confirmation
