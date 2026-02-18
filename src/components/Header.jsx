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
              eUtenti - Energia
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
