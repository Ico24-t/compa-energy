import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { FormProvider } from './contexts/FormContext'
import MainForm from './pages/MainForm'
import BillUpload from './pages/BillUpload'
import AdminApp from './pages/AdminApp'
import Header from './components/Header'
import Footer from './components/Footer'

// Wrapper che mostra Header/Footer solo fuori dall'admin
const Layout = ({ children }) => {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  if (isAdmin) return <>{children}</>

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-8">{children}</main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <Router>
      <FormProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<MainForm />} />
            <Route path="/bolletta" element={<BillUpload />} />
            <Route path="/admin" element={<AdminApp />} />
            <Route path="/admin/*" element={<AdminApp />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </FormProvider>
    </Router>
  )
}

export default App
