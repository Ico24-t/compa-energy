import React, { createContext, useContext, useState, useEffect } from 'react'
import { trackDeviceInfo, getUTMParams } from '../services/api'

const FormContext = createContext()

export const useForm = () => {
  const context = useContext(FormContext)
  if (!context) {
    throw new Error('useForm deve essere usato all\'interno di FormProvider')
  }
  return context
}

export const FormProvider = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [leadId, setLeadId] = useState(null)
  const [leadCode, setLeadCode] = useState(null)
  
  const [formData, setFormData] = useState({
    // Step 1 - Tipo cliente
    tipo_cliente: '',
    
    // Step 2 - Consumi e contatti
    tipo_fornitura: '',
    potenza_contrattuale: '',
    consumo_annuo_kwh: '',
    consumo_annuo_smc: '',
    spesa_mensile_attuale: '',
    tipo_tariffa: 'monoraria',
    email: '',
    
    // Step 3 - Telefono
    telefono: '',
    
    // Step 4 - Offerta selezionata (viene popolato dal sistema)
    offerta_selezionata: null,
    calcolo_risparmio: null,
    
    // Step 5 - Dati anagrafici
    nome: '',
    cognome: '',
    codice_fiscale: '',
    data_nascita: '',
    luogo_nascita: '',
    indirizzo_fornitura: '',
    cap: '',
    citta: '',
    provincia: '',
    codice_pod: '',
    codice_pdr: '',
    fornitore_attuale: '',
    note_cliente: '',
    
    // Privacy
    privacy_acconsentito: false,
    marketing_acconsentito: false,
    
    // Tracking
    ...trackDeviceInfo(),
    ...getUTMParams(),
    origine: 'form_manuale'
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Salva stato nel localStorage per recupero in caso di refresh
  useEffect(() => {
    const savedData = localStorage.getItem('comparatore_form_data')
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setFormData(prev => ({ ...prev, ...parsed }))
        setCurrentStep(parsed.currentStep || 1)
        setLeadId(parsed.leadId || null)
        setLeadCode(parsed.leadCode || null)
      } catch (e) {
        console.error('Errore recupero dati salvati:', e)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('comparatore_form_data', JSON.stringify({
      ...formData,
      currentStep,
      leadId,
      leadCode
    }))
  }, [formData, currentStep, leadId, leadCode])

  const updateFormData = (data) => {
    setFormData(prev => ({
      ...prev,
      ...data
    }))
  }

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 6))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goToStep = (step) => {
    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => {
    setFormData({
      tipo_cliente: '',
      tipo_fornitura: '',
      potenza_contrattuale: '',
      consumo_annuo_kwh: '',
      consumo_annuo_smc: '',
      spesa_mensile_attuale: '',
      tipo_tariffa: 'monoraria',
      email: '',
      telefono: '',
      offerta_selezionata: null,
      calcolo_risparmio: null,
      nome: '',
      cognome: '',
      codice_fiscale: '',
      data_nascita: '',
      luogo_nascita: '',
      indirizzo_fornitura: '',
      cap: '',
      citta: '',
      provincia: '',
      codice_pod: '',
      codice_pdr: '',
      fornitore_attuale: '',
      note_cliente: '',
      privacy_acconsentito: false,
      marketing_acconsentito: false,
      ...trackDeviceInfo(),
      ...getUTMParams(),
      origine: 'form_manuale'
    })
    setCurrentStep(1)
    setLeadId(null)
    setLeadCode(null)
    localStorage.removeItem('comparatore_form_data')
  }

  const value = {
    currentStep,
    formData,
    leadId,
    leadCode,
    loading,
    error,
    setLeadId,
    setLeadCode,
    updateFormData,
    nextStep,
    prevStep,
    goToStep,
    resetForm,
    setLoading,
    setError
  }

  return (
    <FormContext.Provider value={value}>
      {children}
    </FormContext.Provider>
  )
}
