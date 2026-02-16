import React, { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Loader, CheckCircle, AlertCircle, User, Briefcase, Building2 } from 'lucide-react'
import Tesseract from 'tesseract.js'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { createLead, saveConsumption, getAvailableOffers } from '../services/api'
import { findBestOffer, formatCurrency } from '../utils/calculations'
import { validateEmail, validatePhone, formatPhone } from '../utils/validation'

const BillUpload = () => {
  const navigate = useNavigate()
  
  // Stato generale
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Step 1
  const [tipoCliente, setTipoCliente] = useState('')
  const [file, setFile] = useState(null)
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    privacy_acconsentito: false,
    marketing_acconsentito: false
  })
  
  // Step 2
  const [ocrProgress, setOcrProgress] = useState(0)
  const [extractedData, setExtractedData] = useState(null)
  const [ocrText, setOcrText] = useState('')
  const [bestOffer, setBestOffer] = useState(null)
  const [leadId, setLeadId] = useState(null)
  const [leadCode, setLeadCode] = useState(null)
  
  // Step 3
  const [anagraficaData, setAnagraficaData] = useState({
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
    note_cliente: ''
  })
  
  const [errors, setErrors] = useState({})

  const clientTypes = [
    { id: 'privato', label: 'Privato', icon: User, color: 'from-blue-500 to-blue-600' },
    { id: 'p_iva', label: 'Partita IVA', icon: Briefcase, color: 'from-purple-500 to-purple-600' },
    { id: 'azienda', label: 'Azienda', icon: Building2, color: 'from-emerald-500 to-emerald-600' }
  ]

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
      setError(null)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 10485760
  })

  const validateStep1 = () => {
    const newErrors = {}
    
    if (!tipoCliente) newErrors.tipoCliente = 'Seleziona il tipo di cliente'
    if (!file) newErrors.file = 'Carica una bolletta'
    if (!formData.nome) newErrors.nome = 'Nome obbligatorio'
    if (!formData.cognome) newErrors.cognome = 'Cognome obbligatorio'
    if (!validateEmail(formData.email)) newErrors.email = 'Email non valida'
    if (!validatePhone(formData.telefono)) newErrors.telefono = 'Telefono non valido'
    if (!formData.privacy_acconsentito) newErrors.privacy = 'Devi accettare la privacy policy'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const uploadFileToStorage = async (file, leadId) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${leadId}_${Date.now()}.${fileExt}`
      const filePath = `${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${fileName}`

      const { data, error } = await supabase.storage
        .from('bollette')
        .upload(filePath, file)

      if (error) throw error

      const { data: { signedUrl } } = await supabase.storage
        .from('bollette')
        .createSignedUrl(filePath, 31536000)

      return { success: true, url: signedUrl, path: filePath }
    } catch (error) {
      console.error('Errore upload file:', error)
      return { success: false, error: error.message }
    }
  }

  const processOCR = async (file) => {
    try {
      setOcrProgress(0)
      
      const result = await Tesseract.recognize(
        file,
        'ita',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100))
            }
          }
        }
      )

      const text = result.data.text
      setOcrText(text)
      
      const extracted = extractBillData(text)
      
      return {
        success: true,
        text,
        data: extracted,
        confidence: result.data.confidence / 100
      }
    } catch (error) {
      console.error('Errore OCR:', error)
      return { success: false, error: error.message }
    }
  }

  const extractBillData = (text) => {
    const patterns = {
      consumoKwh: /consumo.*?(\d{1,6})\s*kwh/i,
      consumoSmc: /consumo.*?(\d{1,6})\s*smc/i,
      importoMensile: /€\s*(\d{1,4}[.,]\d{2})|(\d{1,4}[.,]\d{2})\s*€/i,
      potenza: /potenza.*?(\d+[.,]?\d*)\s*kw/i,
      pod: /(IT\d{3}E\d{8})/i,
      pdr: /(\d{14})/,
      fornitore: /(enel|eni|a2a|edison|acea|iren|hera|estra)/i,
      indirizzo: /via|viale|piazza|corso\s+[a-z\s]+\d+/i,
      cap: /\b(\d{5})\b/,
      citta: /(napoli|roma|milano|torino|palermo|genova|bologna|firenze|bari|catania|venezia)/i
    }

    const extracted = {}

    const kwhMatch = text.match(patterns.consumoKwh)
    if (kwhMatch) extracted.consumo_annuo_kwh = parseInt(kwhMatch[1])

    const smcMatch = text.match(patterns.consumoSmc)
    if (smcMatch) extracted.consumo_annuo_smc = parseInt(smcMatch[1])

    const importoMatch = text.match(patterns.importoMensile)
    if (importoMatch) {
      const amount = (importoMatch[1] || importoMatch[2]).replace(',', '.')
      extracted.spesa_mensile_attuale = parseFloat(amount)
    }

    const potenzaMatch = text.match(patterns.potenza)
    if (potenzaMatch) extracted.potenza_contrattuale = parseFloat(potenzaMatch[1].replace(',', '.'))

    const podMatch = text.match(patterns.pod)
    if (podMatch) extracted.codice_pod = podMatch[1]

    const pdrMatch = text.match(patterns.pdr)
    if (pdrMatch) extracted.codice_pdr = pdrMatch[1]

    const fornitoreMatch = text.match(patterns.fornitore)
    if (fornitoreMatch) extracted.fornitore_attuale = fornitoreMatch[1].toUpperCase()

    const indirizzoMatch = text.match(patterns.indirizzo)
    if (indirizzoMatch) extracted.indirizzo_fornitura = indirizzoMatch[0]

    const capMatch = text.match(patterns.cap)
    if (capMatch) extracted.cap = capMatch[1]

    const cittaMatch = text.match(patterns.citta)
    if (cittaMatch) {
      extracted.citta = cittaMatch[1].charAt(0).toUpperCase() + cittaMatch[1].slice(1).toLowerCase()
    }

    if (extracted.consumo_annuo_kwh && extracted.consumo_annuo_smc) {
      extracted.tipo_fornitura = 'dual'
    } else if (extracted.consumo_annuo_kwh) {
      extracted.tipo_fornitura = 'luce'
    } else if (extracted.consumo_annuo_smc) {
      extracted.tipo_fornitura = 'gas'
    }

    return Object.keys(extracted).length > 0 ? extracted : null
  }

  const calculateBestOffer = async (extractedData) => {
    try {
      const offersResult = await getAvailableOffers({
        tipo_fornitura: extractedData.tipo_fornitura
      })

      if (offersResult.success && offersResult.data.length > 0) {
        const consumption = {
          consumo_annuo_kwh: extractedData.consumo_annuo_kwh || 0,
          consumo_annuo_smc: extractedData.consumo_annuo_smc || 0
        }
        
        const currentCost = {
          spesa_mensile_attuale: extractedData.spesa_mensile_attuale || 0,
          spesa_annua_attuale: (extractedData.spesa_mensile_attuale || 0) * 12
        }

        const best = findBestOffer(offersResult.data, consumption, currentCost)
        return best
      }
      
      return null
    } catch (error) {
      console.error('Errore calcolo offerta:', error)
      return null
    }
  }

  const handleSubmitStep1 = async () => {
    if (!validateStep1()) return

    setLoading(true)
    setError(null)

    try {
      const leadResult = await createLead({
        email: formData.email,
        telefono: formatPhone(formData.telefono),
        tipo_cliente: tipoCliente,
        stato: 'upload_bolletta',
        origine: 'upload_bolletta',
        privacy_acconsentito: formData.privacy_acconsentito,
        marketing_acconsentito: formData.marketing_acconsentito
      })

      if (!leadResult.success) throw new Error(leadResult.error)

      const newLeadId = leadResult.data.id
      const newLeadCode = leadResult.data.codice_univoco
      setLeadId(newLeadId)
      setLeadCode(newLeadCode)

      const uploadResult = await uploadFileToStorage(file, newLeadId)
      if (!uploadResult.success) throw new Error('Errore upload file')

      const ocrResult = await processOCR(file)
      
      const { error: bollettaError } = await supabase
        .from('bollette_caricate')
        .insert([{
          lead_id: newLeadId,
          file_url: uploadResult.url,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          ocr_status: ocrResult.success ? 'success' : 'failed',
          ocr_confidence: ocrResult.confidence || 0,
          testo_completo: ocrResult.text || '',
          dati_estratti: ocrResult.data || {},
          processed_at: new Date().toISOString()
        }])

      if (bollettaError) throw bollettaError

      if (ocrResult.success && ocrResult.data) {
        setExtractedData(ocrResult.data)
        
        if (ocrResult.data.tipo_fornitura) {
          await saveConsumption({
            lead_id: newLeadId,
            tipo_fornitura: ocrResult.data.tipo_fornitura,
            potenza_contrattuale: ocrResult.data.potenza_contrattuale || null,
            consumo_annuo_kwh: ocrResult.data.consumo_annuo_kwh || null,
            consumo_annuo_smc: ocrResult.data.consumo_annuo_smc || null,
            spesa_mensile_attuale: ocrResult.data.spesa_mensile_attuale || null,
            spesa_annua_attuale: (ocrResult.data.spesa_mensile_attuale || 0) * 12
          })
        }

        const best = await calculateBestOffer(ocrResult.data)
        setBestOffer(best)
        
        setAnagraficaData(prev => ({
          ...prev,
          indirizzo_fornitura: ocrResult.data.indirizzo_fornitura || '',
          cap: ocrResult.data.cap || '',
          citta: ocrResult.data.citta || '',
          codice_pod: ocrResult.data.codice_pod || '',
          codice_pdr: ocrResult.data.codice_pdr || '',
          fornitore_attuale: ocrResult.data.fornitore_attuale || ''
        }))

        setCurrentStep(2)
      } else {
        throw new Error('OCR non riuscito. Ti contatteremo per gestire manualmente la richiesta.')
      }

    } catch (err) {
      setError(err.message)
      console.error('Errore:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleProceedWithOffer = () => {
    setCurrentStep(3)
  }

  const handleAbandon = () => {
    navigate('/')
  }

  const handleSubmitAnagrafica = async () => {
    const newErrors = {}
    if (!anagraficaData.codice_fiscale) newErrors.codice_fiscale = 'Codice fiscale obbligatorio'
    if (!anagraficaData.data_nascita) newErrors.data_nascita = 'Data nascita obbligatoria'
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)

    try {
      // 1. Aggiorna lead con telefono
      await supabase
        .from('leads')
        .update({ 
          telefono: formatPhone(formData.telefono),
          telefono_verificato: false,
          stato: 'dati_anagrafici'
        })
        .eq('id', leadId)

      // 2. Salva pre-contratto con data_invio
      const { error: contractError } = await supabase
        .from('pre_contratti')
        .insert([{
          lead_id: leadId,
          offerta_id: bestOffer?.id || null,
          nome: formData.nome,
          cognome: formData.cognome,
          ...anagraficaData,
          stato: 'inviato',
          data_invio: new Date().toISOString()
        }])

      if (contractError) throw contractError

      // 3. Aggiorna stato finale lead
      await supabase
        .from('leads')
        .update({ stato: 'pre_contratto' })
        .eq('id', leadId)

      navigate('/grazie', {
        state: {
          leadCode,
          fromUpload: true
        }
      })

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-3">
                Carica la tua bolletta 📄
              </h1>
              <p className="text-lg text-slate-600">
                Analizzeremo automaticamente i tuoi consumi
              </p>
            </div>

            <div className="card space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  1. Chi sei? *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {clientTypes.map((type) => {
                    const Icon = type.icon
                    const isSelected = tipoCliente === type.id
                    
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          setTipoCliente(type.id)
                          setErrors(prev => ({ ...prev, tipoCliente: null }))
                        }}
                        className={`
                          relative p-4 rounded-xl transition-all duration-200
                          ${isSelected 
                            ? 'ring-4 ring-blue-500 ring-opacity-50 shadow-lg' 
                            : 'hover:shadow-md'
                          }
                        `}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${type.color} opacity-90 rounded-xl`} />
                        <div className="relative text-white">
                          <Icon className="w-8 h-8 mx-auto mb-2" />
                          <span className="text-sm font-semibold">{type.label}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
                {errors.tipoCliente && (
                  <p className="mt-2 text-sm text-red-600">{errors.tipoCliente}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  2. Carica la bolletta *
                </label>
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                    ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'}
                    ${file ? 'bg-green-50 border-green-500' : ''}
                  `}
                >
                  <input {...getInputProps()} />
                  {!file ? (
                    <>
                      <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600 mb-1">
                        {isDragActive ? 'Rilascia qui...' : 'Trascina qui la bolletta'}
                      </p>
                      <p className="text-sm text-slate-500">
                        oppure clicca per selezionare (PDF, JPG, PNG - max 10MB)
                      </p>
                    </>
                  ) : (
                    <>
                      <FileText className="w-12 h-12 text-green-600 mx-auto mb-3" />
                      <p className="text-green-700 font-medium">{file.name}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setFile(null)
                        }}
                        className="text-sm text-red-600 underline mt-2"
                      >
                        Rimuovi
                      </button>
                    </>
                  )}
                </div>
                {errors.file && (
                  <p className="mt-2 text-sm text-red-600">{errors.file}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  3. I tuoi dati
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Nome *"
                      value={formData.nome}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, nome: e.target.value }))
                        setErrors(prev => ({ ...prev, nome: null }))
                      }}
                      className="input-field"
                    />
                    {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome}</p>}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Cognome *"
                      value={formData.cognome}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, cognome: e.target.value }))
                        setErrors(prev => ({ ...prev, cognome: null }))
                      }}
                      className="input-field"
                    />
                    {errors.cognome && <p className="mt-1 text-sm text-red-600">{errors.cognome}</p>}
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Email *"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, email: e.target.value }))
                        setErrors(prev => ({ ...prev, email: null }))
                      }}
                      className="input-field"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="Telefono *"
                      value={formData.telefono}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, telefono: e.target.value }))
                        setErrors(prev => ({ ...prev, telefono: null }))
                      }}
                      className="input-field"
                    />
                    {errors.telefono && <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.privacy_acconsentito}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, privacy_acconsentito: e.target.checked }))
                      setErrors(prev => ({ ...prev, privacy: null }))
                    }}
                    className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">
                    Accetto l'<a href="/privacy" target="_blank" className="text-blue-600 underline">informativa sulla privacy</a> *
                  </span>
                </label>
                {errors.privacy && <p className="text-sm text-red-600">{errors.privacy}</p>}
                
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.marketing_acconsentito}
                    onChange={(e) => setFormData(prev => ({ ...prev, marketing_acconsentito: e.target.checked }))}
                    className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">
                    Acconsento a ricevere comunicazioni commerciali
                  </span>
                </label>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmitStep1}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Analisi in corso... {ocrProgress}%
                  </>
                ) : (
                  'Prosegui'
                )}
              </button>
            </div>
          </motion.div>
        )}

        {currentStep === 2 && extractedData && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-3">
                Bolletta analizzata! ✅
              </h1>
              <p className="text-lg text-slate-600">
                Ecco i dati estratti dalla tua bolletta
              </p>
            </div>

            <div className="card space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  📊 Dati estratti dalla bolletta
                </h3>
                <div className="space-y-3">
                  {extractedData.tipo_fornitura && (
                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">Tipo fornitura:</span>
                      <span className="font-bold text-slate-900 capitalize">
                        {extractedData.tipo_fornitura === 'dual' ? 'Luce + Gas' : extractedData.tipo_fornitura}
                      </span>
                    </div>
                  )}
                  
                  {extractedData.consumo_annuo_kwh && (
                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">Consumo Luce:</span>
                      <span className="font-bold text-slate-900">{extractedData.consumo_annuo_kwh.toLocaleString()} kWh/anno</span>
                    </div>
                  )}
                  
                  {extractedData.consumo_annuo_smc && (
                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">Consumo Gas:</span>
                      <span className="font-bold text-slate-900">{extractedData.consumo_annuo_smc.toLocaleString()} Smc/anno</span>
                    </div>
                  )}
                  
                  {extractedData.spesa_mensile_attuale && (
                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">Spesa mensile attuale:</span>
                      <span className="font-bold text-red-600">{formatCurrency(extractedData.spesa_mensile_attuale)}</span>
                    </div>
                  )}
                  
                  {extractedData.potenza_contrattuale && (
                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">Potenza:</span>
                      <span className="font-bold text-slate-900">{extractedData.potenza_contrattuale} kW</span>
                    </div>
                  )}
                  
                  {extractedData.codice_pod && (
                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">Codice POD:</span>
                      <span className="font-mono text-sm font-bold text-slate-900">{extractedData.codice_pod}</span>
                    </div>
                  )}
                  
                  {extractedData.codice_pdr && (
                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">Codice PDR:</span>
                      <span className="font-mono text-sm font-bold text-slate-900">{extractedData.codice_pdr}</span>
                    </div>
                  )}
                  
                  {extractedData.fornitore_attuale && (
                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">Fornitore attuale:</span>
                      <span className="font-bold text-slate-900">{extractedData.fornitore_attuale}</span>
                    </div>
                  )}
                  
                  {extractedData.indirizzo_fornitura && (
                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">Indirizzo:</span>
                      <span className="font-bold text-slate-900">{extractedData.indirizzo_fornitura}</span>
                    </div>
                  )}
                  
                  {extractedData.citta && (
                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">Città:</span>
                      <span className="font-bold text-slate-900">
                        {extractedData.citta} {extractedData.cap && `(${extractedData.cap})`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    💡 <strong>Suggerimento:</strong> Verifica che i dati siano corretti. Potrai modificarli nel prossimo step se necessario.
                  </p>
                </div>
              </div>

              {bestOffer && bestOffer.calculation && bestOffer.calculation.conveniente && (
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">🎉 La tua migliore offerta!</h3>
                  <div className="text-center my-6">
                    <p className="text-lg mb-2">Risparmio annuo stimato</p>
                    <p className="text-5xl font-bold mb-2">
                      {formatCurrency(bestOffer.calculation.risparmio_annuo)}
                    </p>
                    <p className="text-lg opacity-90">
                      (-{bestOffer.calculation.risparmio_percentuale.toFixed(1)}%)
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur rounded-lg p-4 mt-4">
                    <p className="text-sm font-medium mb-1">Fornitore proposto:</p>
                    <p className="text-xl font-bold">{bestOffer.fornitori?.nome}</p>
                    <p className="text-sm mt-2 opacity-90">{bestOffer.nome_offerta}</p>
                  </div>
                </div>
              )}

              {bestOffer && bestOffer.calculation && !bestOffer.calculation.conveniente && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <CheckCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-center text-slate-900 mb-2">
                    La tua offerta attuale è già ottima! 👍
                  </h3>
                  <p className="text-center text-slate-600">
                    Al momento non abbiamo offerte più vantaggiose.<br />
                    Ti avviseremo quando ne avremo di migliori!
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleAbandon}
                  className="btn-secondary flex-1"
                >
                  Non ora, grazie
                </button>
                {bestOffer && bestOffer.calculation && bestOffer.calculation.conveniente && (
                  <button
                    onClick={handleProceedWithOffer}
                    className="btn-primary flex-1"
                  >
                    Procedi con questa offerta →
                  </button>
                )}
              </div>

              <div className="text-center">
                <p className="text-sm text-slate-500">
                  I tuoi dati sono stati salvati. Potrai tornare in qualsiasi momento.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-3">
                Completa i tuoi dati
              </h1>
              <p className="text-lg text-slate-600">
                Ultimi dettagli per finalizzare la richiesta
              </p>
            </div>

            <div className="card space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h4 className="font-semibold text-green-900 mb-2">✓ Dati già acquisiti:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-green-700">Nome:</span>
                    <span className="ml-2 font-medium">{formData.nome} {formData.cognome}</span>
                  </div>
                  <div>
                    <span className="text-green-700">Email:</span>
                    <span className="ml-2 font-medium">{formData.email}</span>
                  </div>
                  <div>
                    <span className="text-green-700">Telefono:</span>
                    <span className="ml-2 font-medium">{formData.telefono}</span>
                  </div>
                  <div>
                    <span className="text-green-700">Tipo:</span>
                    <span className="ml-2 font-medium capitalize">{tipoCliente}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">📝 Dati anagrafici</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Codice Fiscale *
                    </label>
                    <input
                      type="text"
                      value={anagraficaData.codice_fiscale}
                      onChange={(e) => {
                        setAnagraficaData(prev => ({ ...prev, codice_fiscale: e.target.value.toUpperCase() }))
                        setErrors(prev => ({ ...prev, codice_fiscale: null }))
                      }}
                      className="input-field uppercase"
                      maxLength={16}
                      placeholder="RSSMRA80A01H501Z"
                    />
                    {errors.codice_fiscale && <p className="mt-1 text-sm text-red-600">{errors.codice_fiscale}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Data di nascita *
                    </label>
                    <input
                      type="date"
                      value={anagraficaData.data_nascita}
                      onChange={(e) => {
                        setAnagraficaData(prev => ({ ...prev, data_nascita: e.target.value }))
                        setErrors(prev => ({ ...prev, data_nascita: null }))
                      }}
                      className="input-field"
                    />
                    {errors.data_nascita && <p className="mt-1 text-sm text-red-600">{errors.data_nascita}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Luogo di nascita
                    </label>
                    <input
                      type="text"
                      value={anagraficaData.luogo_nascita}
                      onChange={(e) => setAnagraficaData(prev => ({ ...prev, luogo_nascita: e.target.value }))}
                      className="input-field"
                      placeholder="Napoli"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">📍 Indirizzo fornitura</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Indirizzo completo
                    </label>
                    <input
                      type="text"
                      value={anagraficaData.indirizzo_fornitura}
                      onChange={(e) => setAnagraficaData(prev => ({ ...prev, indirizzo_fornitura: e.target.value }))}
                      className="input-field"
                      placeholder="Via/Piazza, numero civico"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">CAP</label>
                      <input
                        type="text"
                        value={anagraficaData.cap}
                        onChange={(e) => setAnagraficaData(prev => ({ ...prev, cap: e.target.value }))}
                        className="input-field"
                        maxLength={5}
                        placeholder="80100"
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Città</label>
                      <input
                        type="text"
                        value={anagraficaData.citta}
                        onChange={(e) => setAnagraficaData(prev => ({ ...prev, citta: e.target.value }))}
                        className="input-field"
                        placeholder="Napoli"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Prov.</label>
                      <input
                        type="text"
                        value={anagraficaData.provincia}
                        onChange={(e) => setAnagraficaData(prev => ({ ...prev, provincia: e.target.value.toUpperCase() }))}
                        className="input-field uppercase"
                        maxLength={2}
                        placeholder="NA"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">🔧 Codici fornitura</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(extractedData?.tipo_fornitura === 'luce' || extractedData?.tipo_fornitura === 'dual') && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Codice POD (Luce)
                      </label>
                      <input
                        type="text"
                        value={anagraficaData.codice_pod}
                        onChange={(e) => setAnagraficaData(prev => ({ ...prev, codice_pod: e.target.value.toUpperCase() }))}
                        className="input-field uppercase font-mono text-sm"
                        placeholder="IT001E12345678"
                      />
                    </div>
                  )}

                  {(extractedData?.tipo_fornitura === 'gas' || extractedData?.tipo_fornitura === 'dual') && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Codice PDR (Gas)
                      </label>
                      <input
                        type="text"
                        value={anagraficaData.codice_pdr}
                        onChange={(e) => setAnagraficaData(prev => ({ ...prev, codice_pdr: e.target.value }))}
                        className="input-field font-mono text-sm"
                        placeholder="12345678901234"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Fornitore attuale
                    </label>
                    <input
                      type="text"
                      value={anagraficaData.fornitore_attuale}
                      onChange={(e) => setAnagraficaData(prev => ({ ...prev, fornitore_attuale: e.target.value }))}
                      className="input-field"
                      placeholder="Es. ENEL, ENI..."
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Note aggiuntive
                </label>
                <textarea
                  value={anagraficaData.note_cliente}
                  onChange={(e) => setAnagraficaData(prev => ({ ...prev, note_cliente: e.target.value }))}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Eventuali richieste o informazioni..."
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmitAnagrafica}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Invio in corso...
                  </>
                ) : (
                  'Invia richiesta offerta'
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default BillUpload
