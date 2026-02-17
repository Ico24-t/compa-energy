import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Loader, CheckCircle, AlertCircle } from 'lucide-react'
import Tesseract from 'tesseract.js'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useForm } from '../contexts/FormContext'

const BillUpload = () => {
  const navigate = useNavigate()
  const { updateFormData } = useForm()
  const [file, setFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [extractedData, setExtractedData] = useState(null)
  const [error, setError] = useState(null)

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
      setError(null)
      processImage(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.pdf']
    },
    maxFiles: 1,
    maxSize: 10485760 // 10MB
  })

  const processImage = async (imageFile) => {
    setProcessing(true)
    setProgress(0)
    setError(null)

    try {
      const result = await Tesseract.recognize(
        imageFile,
        'ita',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100))
            }
          }
        }
      )

      const text = result.data.text
      const data = extractBillData(text)
      
      if (data) {
        setExtractedData(data)
        updateFormData({
          origine: 'upload_bolletta',
          ...data
        })
      } else {
        setError('Non sono riuscito a estrarre i dati dalla bolletta. Prova con un\'immagine più chiara o inserisci i dati manualmente.')
      }
    } catch (err) {
      console.error('Errore OCR:', err)
      setError('Errore durante l\'elaborazione dell\'immagine. Riprova.')
    } finally {
      setProcessing(false)
    }
  }

  const extractBillData = (text) => {
    // Regex patterns per estrarre dati comuni dalle bollette italiane
    const patterns = {
      consumoKwh: /consumo.*?(\d{1,5})\s*kwh/i,
      consumoSmc: /consumo.*?(\d{1,5})\s*smc/i,
      importo: /€\s*(\d{1,4}[.,]\d{2})|(\d{1,4}[.,]\d{2})\s*€/i,
      potenza: /potenza.*?(\d+[.,]?\d*)\s*kw/i,
      pod: /(IT\d{3}E\d{8})/i,
      pdr: /(\d{14})/
    }

    const extracted = {}

    // Estrai consumi luce
    const kwhMatch = text.match(patterns.consumoKwh)
    if (kwhMatch) {
      extracted.consumo_annuo_kwh = kwhMatch[1]
    }

    // Estrai consumi gas
    const smcMatch = text.match(patterns.consumoSmc)
    if (smcMatch) {
      extracted.consumo_annuo_smc = smcMatch[1]
    }

    // Estrai importo
    const importoMatch = text.match(patterns.importo)
    if (importoMatch) {
      const amount = (importoMatch[1] || importoMatch[2]).replace(',', '.')
      extracted.spesa_mensile_attuale = amount
    }

    // Estrai potenza
    const potenzaMatch = text.match(patterns.potenza)
    if (potenzaMatch) {
      extracted.potenza_contrattuale = potenzaMatch[1].replace(',', '.')
    }

    // Estrai POD
    const podMatch = text.match(patterns.pod)
    if (podMatch) {
      extracted.codice_pod = podMatch[1]
    }

    // Estrai PDR
    const pdrMatch = text.match(patterns.pdr)
    if (pdrMatch) {
      extracted.codice_pdr = pdrMatch[1]
    }

    // Determina tipo fornitura
    if (extracted.consumo_annuo_kwh && extracted.consumo_annuo_smc) {
      extracted.tipo_fornitura = 'dual'
    } else if (extracted.consumo_annuo_kwh) {
      extracted.tipo_fornitura = 'luce'
    } else if (extracted.consumo_annuo_smc) {
      extracted.tipo_fornitura = 'gas'
    }

    return Object.keys(extracted).length > 0 ? extracted : null
  }

  const handleContinue = () => {
    navigate('/')
  }

  return (
    <div className="container mx-auto max-w-4xl px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-3">
          Carica la tua bolletta
        </h1>
        <p className="text-lg text-slate-600">
          Estrarremo automaticamente i dati per calcolare il tuo risparmio
        </p>
      </motion.div>

      {!file && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          {...getRootProps()}
          className={`
            card cursor-pointer transition-all duration-300 text-center p-12
            ${isDragActive ? 'border-blue-500 border-4 bg-blue-50 scale-105' : 'border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/30'}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            {isDragActive ? 'Rilascia qui la bolletta' : 'Trascina qui la tua bolletta'}
          </h3>
          <p className="text-slate-600 mb-4">
            oppure clicca per selezionare un file
          </p>
          <p className="text-sm text-slate-500">
            Formati supportati: JPG, PNG, PDF (max 10MB)
          </p>
        </motion.div>
      )}

      {processing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card text-center"
        >
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Elaborazione in corso...
          </h3>
          <p className="text-slate-600 mb-4">
            Stiamo leggendo la tua bolletta
          </p>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <motion.div
              className="bg-blue-600 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-sm text-slate-500 mt-2">{progress}%</p>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card border-red-200 bg-red-50"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-1">
                Errore nell'elaborazione
              </h3>
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => {
                  setFile(null)
                  setError(null)
                }}
                className="btn-secondary mt-4"
              >
                Riprova
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {extractedData && !processing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <h3 className="text-2xl font-bold text-slate-900">
              Dati estratti con successo!
            </h3>
          </div>

          <div className="space-y-4">
            {extractedData.tipo_fornitura && (
              <div className="flex justify-between items-center py-2 border-b border-slate-200">
                <span className="text-slate-600">Tipo fornitura:</span>
                <span className="font-semibold text-slate-900 capitalize">{extractedData.tipo_fornitura}</span>
              </div>
            )}
            {extractedData.consumo_annuo_kwh && (
              <div className="flex justify-between items-center py-2 border-b border-slate-200">
                <span className="text-slate-600">Consumo Luce:</span>
                <span className="font-semibold text-slate-900">{extractedData.consumo_annuo_kwh} kWh</span>
              </div>
            )}
            {extractedData.consumo_annuo_smc && (
              <div className="flex justify-between items-center py-2 border-b border-slate-200">
                <span className="text-slate-600">Consumo Gas:</span>
                <span className="font-semibold text-slate-900">{extractedData.consumo_annuo_smc} Smc</span>
              </div>
            )}
            {extractedData.spesa_mensile_attuale && (
              <div className="flex justify-between items-center py-2 border-b border-slate-200">
                <span className="text-slate-600">Spesa:</span>
                <span className="font-semibold text-slate-900">€ {extractedData.spesa_mensile_attuale}</span>
              </div>
            )}
            {extractedData.potenza_contrattuale && (
              <div className="flex justify-between items-center py-2 border-b border-slate-200">
                <span className="text-slate-600">Potenza:</span>
                <span className="font-semibold text-slate-900">{extractedData.potenza_contrattuale} kW</span>
              </div>
            )}
            {extractedData.codice_pod && (
              <div className="flex justify-between items-center py-2 border-b border-slate-200">
                <span className="text-slate-600">Codice POD:</span>
                <span className="font-semibold text-slate-900 font-mono text-sm">{extractedData.codice_pod}</span>
              </div>
            )}
            {extractedData.codice_pdr && (
              <div className="flex justify-between items-center py-2 border-b border-slate-200">
                <span className="text-slate-600">Codice PDR:</span>
                <span className="font-semibold text-slate-900 font-mono text-sm">{extractedData.codice_pdr}</span>
              </div>
            )}
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={() => {
                setFile(null)
                setExtractedData(null)
              }}
              className="btn-secondary flex-1"
            >
              Carica un'altra bolletta
            </button>
            <button
              onClick={handleContinue}
              className="btn-primary flex-1"
            >
              Continua con questi dati
            </button>
          </div>
        </motion.div>
      )}

      {!file && !processing && (
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 font-medium underline"
          >
            Preferisci inserire i dati manualmente?
          </button>
        </div>
      )}
    </div>
  )
}

export default BillUpload
