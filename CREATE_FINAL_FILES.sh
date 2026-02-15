#!/bin/bash

cd /home/claude/comparatore-energia

# Step 6 - Conferma e invio email
cat > src/components/Step6Confirmation.jsx << 'STEP6'
import React, { useEffect, useState } from 'react'
import { CheckCircle, Mail, Phone, FileText, Loader } from 'lucide-react'
import { useForm } from '../contexts/FormContext'
import { motion } from 'framer-motion'
import { sendBothEmails } from '../services/emailService'
import { updateLeadStatus } from '../services/api'

const Step6Confirmation = () => {
  const { formData, leadCode, leadId, resetForm } = useForm()
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
STEP6

# App.jsx - Componente principale
cat > src/App.jsx << 'APP'
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { FormProvider } from './contexts/FormContext'
import MainForm from './pages/MainForm'
import BillUpload from './pages/BillUpload'
import Header from './components/Header'
import Footer from './components/Footer'

function App() {
  return (
    <Router>
      <FormProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow py-8">
            <Routes>
              <Route path="/" element={<MainForm />} />
              <Route path="/bolletta" element={<BillUpload />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </FormProvider>
    </Router>
  )
}

export default App
APP

# MainForm - Pagina principale con gestione step
cat > src/pages/MainForm.jsx << 'MAINFORM'
import React from 'react'
import { useForm } from '../contexts/FormContext'
import ProgressSteps from '../components/ProgressSteps'
import Step1ClientType from '../components/Step1ClientType'
import Step2Consumption from '../components/Step2Consumption'
import Step3OfferCalculation from '../components/Step3OfferCalculation'
import Step4OfferDetails from '../components/Step4OfferDetails'
import Step5PersonalData from '../components/Step5PersonalData'
import Step6Confirmation from '../components/Step6Confirmation'

const MainForm = () => {
  const { currentStep } = useForm()

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1ClientType />
      case 2:
        return <Step2Consumption />
      case 3:
        return <Step3OfferCalculation />
      case 4:
        return <Step4OfferDetails />
      case 5:
        return <Step5PersonalData />
      case 6:
        return <Step6Confirmation />
      default:
        return <Step1ClientType />
    }
  }

  return (
    <div className="container mx-auto max-w-6xl">
      {currentStep < 6 && <ProgressSteps />}
      {renderStep()}
    </div>
  )
}

export default MainForm
MAINFORM

# Header component
cat > src/components/Header.jsx << 'HEADER'
import React from 'react'
import { Zap } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const Header = () => {
  const location = useLocation()

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-slate-900">
              Comparatore Energia
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Confronta Offerte
            </Link>
            <Link
              to="/bolletta"
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/bolletta' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Carica Bolletta
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header
HEADER

# Footer component
cat > src/components/Footer.jsx << 'FOOTER'
import React from 'react'
import { Mail, Phone, Shield } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-3">Comparatore Energia</h3>
            <p className="text-slate-400 text-sm">
              La soluzione più semplice per confrontare e risparmiare sulle bollette di luce e gas.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">Contatti</h3>
            <div className="space-y-2">
              <a href={`mailto:${import.meta.env.VITE_OPERATOR_EMAIL}`} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
                <Mail className="w-4 h-4" />
                {import.meta.env.VITE_OPERATOR_EMAIL}
              </a>
              <a href={`tel:${import.meta.env.VITE_OPERATOR_PHONE}`} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
                <Phone className="w-4 h-4" />
                {import.meta.env.VITE_OPERATOR_PHONE}
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">Sicurezza</h3>
            <div className="flex items-start gap-2 text-slate-400 text-sm">
              <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>I tuoi dati sono protetti e trattati secondo il GDPR</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
          <p>© {currentYear} Comparatore Energia. Tutti i diritti riservati.</p>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-white transition-colors">Termini e Condizioni</a>
            <a href="/cookie" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
FOOTER

# main.jsx - Entry point
cat > src/main.jsx << 'MAIN'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
MAIN

echo "✓ Tutti i componenti React creati!"

