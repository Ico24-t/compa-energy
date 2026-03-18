import React from 'react'
import { Link } from 'react-router-dom'
import { Zap, Heart } from 'lucide-react'

const Footer = () => (
  <footer className="bg-slate-900 text-slate-400 mt-auto">
    <div className="container mx-auto px-4 py-10">

      {/* Top: logo + descrizione */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 pb-8 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-white">e<span className="text-blue-400">Utenti</span></span>
            <p className="text-xs text-slate-500 mt-0.5">Associazione di affiancamento agli utenti</p>
          </div>
        </div>
        <p className="text-sm text-slate-500 max-w-md leading-relaxed">
          eUtenti nasce per affiancare le persone nella quotidianità, aiutandole a orientarsi
          tra offerte, contratti e servizi per migliorare la propria vita. Il servizio di comparazione
          energetica è completamente gratuito.
        </p>
      </div>

      {/* Link legali */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-6">
        <Link to="/privacy-policy" className="text-sm text-slate-400 hover:text-white transition-colors">
          Privacy Policy
        </Link>
        <span className="text-slate-700 hidden md:inline">·</span>
        <Link to="/termini-e-condizioni" className="text-sm text-slate-400 hover:text-white transition-colors">
          Termini e Condizioni
        </Link>
        <span className="text-slate-700 hidden md:inline">·</span>
        <Link to="/cookie-policy" className="text-sm text-slate-400 hover:text-white transition-colors">
          Cookie Policy
        </Link>
      </div>

      {/* Copyright */}
      <div className="text-center text-xs text-slate-600">
        <p>© {new Date().getFullYear()} eUtenti — Tutti i diritti riservati</p>
        <p className="mt-1 flex items-center justify-center gap-1">
          Fatto con <Heart className="w-3 h-3 text-red-500" /> per semplificare la quotidianità
        </p>
      </div>
    </div>
  </footer>
)

export default Footer
