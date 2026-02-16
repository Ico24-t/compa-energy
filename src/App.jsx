import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { FormProvider } from './contexts/FormContext'
import MainForm from './pages/MainForm'
import BillUpload from './pages/BillUpload'
import ThankYou from './pages/ThankYou'
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
              <Route path="/grazie" element={<ThankYou />} />
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
