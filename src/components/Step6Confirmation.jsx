import React, { useEffect, useState } from 'react'
import { CheckCircle, Mail, Phone, FileText, Loader } from 'lucide-react'
import { useForm } from '../contexts/FormContext'
import { motion } from 'framer-motion'
import { sendBothEmails } from '../services/emailService'
import { updateLeadStatus, markPreContractAsSent } from '../services/api'

const Step6Confirmation = () => {
  const { formData, leadCode, leadId, resetForm } = useForm()
  const [sending, setSending] = useState(true)
  const [emailsSent, setEmailsSent] = useState(false)

  useEffect(() => {
    sendConfirmationEmails()
  }, [])

  const sendConfirmationEmails = async () => {
    try {
      const offerta = formData.offerta_selezionata || {}
      const calcolo = formData.calcolo_risparmio || {}

      const emailData = {
        ...formData,
        codice_univoco: leadCode,
        fornitore_nome: offerta.fornitori?.nome || '',
        nome_offerta: offerta.nome_offerta || '',
        descrizione_offerta: offerta.descrizione_completa || offerta.descrizione_breve || '',
        // Campi calcolo esplicitati per i template
        risparmio_annuo: calcolo.risparmio_annuo || 0,
        risparmio_mensile: calcolo.risparmio_mensile || 0,
        risparmio_percentuale: calcolo.risparmio_percentuale || 0,
        spesa_annua_attuale: calcolo.spesa_annua_attuale || 0,
        spesa_mensile_attuale_calc: calcolo.spesa_mensile_attuale || parseFloat(formData.spesa_mensile_attuale) || 0,
        spesa_annua_offerta: calcolo.spesa_annua_offerta || 0,
        spesa_mensile_offerta: calcolo.spesa_mensile_offerta || 0,
        tua_commissione: calcolo.tua_commissione || 0
      }

      // Invia entrambe le email
      await sendBothEmails(emailData)

      // Aggiorna stato lead
      await updateLeadStatus(leadId, 'inviato_operatore')

      // ✅ FIX: Aggiorna stato pre-contratto a 'inviato' con data_invio
      await markPreContractAsSent(leadId)

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
          Richiesta Inviata! 
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

        <button onClick={resetForm} className="btn-secondary w-full">
          Nuova richiesta
        </button>
      </div>
    </motion.div>
  )
}

export default Step6Confirmation
