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
