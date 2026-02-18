import React from 'react'
import { Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Solo il nome del sito — cliccabile per tornare all'inizio */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-slate-900">
              e<span className="text-blue-600">Utenti</span>
            </span>
          </Link>
          {/* Nessuna navigazione aggiuntiva */}
        </div>
      </div>
    </header>
  )
}

export default Header
