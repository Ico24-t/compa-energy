import React, { createContext, useContext, useState, useEffect } from 'react'
import { trackDeviceInfo, getUTMParams } from '../services/api'

const FormContext = createContext()

export const useForm = () => {
  const context = useContext(FormContext)
  if (!context) throw new Error('useForm deve essere usato all\'interno di FormProvider')
  return context
}

const INITIAL_FORM_DATA = () => ({
  // Step 1
  tipo_cliente: '',

  // Step 2
  tipo_fornitura: '',
  num_persone: '',
  potenza_contrattuale: '',
  consumo_annuo_kwh: '',
  consumo_annuo_smc: '',
  spesa_mensile_attuale: '',
  tipo_tariffa: 'monoraria',
  email: '',

  // Step 3
  telefono: '',

  // Step 4 (popolato dal sistema)
  offerta_selezionata: null,
  calcolo_risparmio: null,

  // Step 5
  nome: '',
  cognome: '',
  codice_fiscale: '',
  indirizzo_fornitura: '',
  cap: '',
  citta: '',
  provincia: '',
  codice_pod: '',
  codice_pdr: '',
  fornitore_attuale: '',
  tipo_contratto_attuale: '',
  note_cliente: '',

  // Privacy
  privacy_acconsentito: false,
  marketing_acconsentito: false,

  // Tracking
  ...trackDeviceInfo(),
  ...getUTMParams(),
  origine: 'form_manuale'
})

export const FormProvider = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [leadId, setLeadId] = useState(null)
  const [leadCode, setLeadCode] = useState(null)
  const [formData, setFormData] = useState(INITIAL_FORM_DATA())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Recupera dati salvati dal localStorage al mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('eutenti_form_data')
      if (saved) {
        const parsed = JSON.parse(saved)
        setFormData(prev => ({ ...prev, ...parsed.formData }))
        setCurrentStep(parsed.currentStep || 1)
        setLeadId(parsed.leadId || null)
        setLeadCode(parsed.leadCode || null)
      }
    } catch (e) {
      console.error('Errore recupero dati salvati:', e)
      localStorage.removeItem('eutenti_form_data')
    }
  }, [])

  // Salva nel localStorage ad ogni modifica
  useEffect(() => {
    try {
      localStorage.setItem('eutenti_form_data', JSON.stringify({
        formData,
        currentStep,
        leadId,
        leadCode
      }))
    } catch (e) {
      console.error('Errore salvataggio dati:', e)
    }
  }, [formData, currentStep, leadId, leadCode])

  const updateFormData = (data) => {
    setFormData(prev => ({ ...prev, ...data }))
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

  // ✅ FIX: Reset completo — pulisce localStorage e riporta allo step 1
  const resetForm = () => {
    const freshData = INITIAL_FORM_DATA()
    setFormData(freshData)
    setCurrentStep(1)
    setLeadId(null)
    setLeadCode(null)
    setError(null)
    setLoading(false)
    try {
      localStorage.removeItem('eutenti_form_data')
    } catch {}
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
