import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'

const AdminApp = () => {
  const [admin, setAdmin] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Controlla se c'è già una sessione attiva
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user?.email) {
        const { data } = await supabase
          .from('admin_pannello')
          .select('*')
          .eq('email', session.user.email)
          .eq('bloccato', false)
          .single()
        if (data) setAdmin(data)
      }
      setChecking(false)
    })
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (!admin) {
    return <AdminLogin onLogin={setAdmin} />
  }

  return <AdminDashboard admin={admin} onLogout={() => setAdmin(null)} />
}

export default AdminApp
