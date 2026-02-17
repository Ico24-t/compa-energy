import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, ChevronRight, ChevronLeft } from 'lucide-react'
import { useForm } from '../contexts/FormContext'
import { cercaPerCAP, cercaProvinciaPerCitta } from '../utils/comuni'

const Step5PersonalData = ({ onNext, onPrev }) => {
  const { formData, updateFormData } = useForm()

  const [nome, setNome] = useState(formData.nome || '')
  const [cognome, setCognome] = useState(formData.cognome || '')
  const [indirizzo, setIndirizzo] = useState(formData.indirizzo_fornitura || '')
  const [cap, setCap] = useState(formData.cap || '')
  const [citta, setCitta] = useState(formData.citta || '')
  const [provincia, setProvincia] = useState(formData.provincia || '')
  const [note, setNote] = useState(formData.note_cliente || '')
  const [privacyAccettata, setPrivacyAccettata] = useState(formData.privacy_acconsentito || false)
  const [marketingAccettato, setMarketingAccettato] = useState(formData.marketing_acconsentito || false)

  // Suggerimenti CAP
  const [suggerimentiCap, setSuggerimentiCap] = useState([])
  const [capNonTrovato, setCapNonTrovato] = useState(false)

  const [errors, setErrors] = useState({})

  // Handler CAP
  const handleCapChange = (value) => {
    setCap(value)
    setCapNonTrovato(false)
    setSuggerimentiCap([])

    if (value.length === 5) {
      const risultati = cercaPerCAP(value)
      if (risultati.length === 1) {
        // Un solo comune → autocompila
        setCitta(risultati[0].nome)
        setProvincia(risultati[0].provincia)
      } else if (risultati.length > 1) {
        // Più comuni → mostra lista
        setSuggerimentiCap(risultati)
        setCitta('')
        setProvincia('')
      } else {
        // CAP non trovato
        setCapNonTrovato(true)
        setCitta('')
        setProvincia('')
      }
    } else {
      setCitta('')
      setProvincia('')
    }
  }

  // Selezione comune dalla lista
  const handleSelezionaCitta = (comune) => {
    setCitta(comune.nome)
    setProvincia(comune.provincia)
    setSuggerimentiCap([])
  }

  // Handler città (senza CAP)
  const handleCittaChange = (value) => {
    setCitta(value)
    if (value.length >= 3) {
      const prov = cercaProvinciaPerCitta(value)
      if (prov) setProvincia(prov)
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!nome.trim()) newErrors.nome = 'Nome obbligatorio'
    if (!cognome.trim()) newErrors.cognome = 'Cognome obbligatorio'
    if (!privacyAccettata) newErrors.privacy = 'Devi accettare la privacy policy'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validate()) return

    updateFormData({
      nome: nome.trim(),
      cognome: cognome.trim(),
      indirizzo_fornitura: indirizzo.trim(),
      cap,
      citta: citta.trim(),
      provincia: provincia.trim(),
      note_cliente: note.trim(),
      privacy_acconsentito: privacyAccettata,
      marketing_acconsentito: marketingAccettato
    })

    onNext()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-2">
          I tuoi dati 📋
        </h2>
        <p className="text-slate-600">Quasi fatto! Solo gli ultimi dettagli</p>
      </div>

      {/* Recap email e telefono già acquisiti */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-green-800 mb-2">✓ Già acquisiti:</p>
        <div className="flex flex-wrap gap-4 text-sm text-green-700">
          <span>📧 {formData.email}</span>
          {formData.telefono && <span>📞 {formData.telefono}</span>}
        </div>
      </div>

      <div className="card space-y-6">

        {/* NOME E COGNOME */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nome *</label>
            <input
              type="text"
              placeholder="Mario"
              value={nome}
              onChange={e => {
                setNome(e.target.value)
                setErrors(prev => ({ ...prev, nome: null }))
              }}
              className="input-field"
            />
            {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Cognome *</label>
            <input
              type="text"
              placeholder="Rossi"
              value={cognome}
              onChange={e => {
                setCognome(e.target.value)
                setErrors(prev => ({ ...prev, cognome: null }))
              }}
              className="input-field"
            />
            {errors.cognome && <p className="mt-1 text-sm text-red-600">{errors.cognome}</p>}
          </div>
        </div>

        {/* INDIRIZZO */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <MapPin className="inline w-4 h-4 mr-1" />
            Indirizzo fornitura
          </label>
          <input
            type="text"
            placeholder="Via/Piazza, numero civico"
            value={indirizzo}
            onChange={e => setIndirizzo(e.target.value)}
            className="input-field"
          />
        </div>

        {/* CAP → CITTÀ → PROVINCIA */}
        <div className="space-y-4">
          {/* CAP */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">CAP</label>
            <input
              type="text"
              placeholder="es. 80100"
              value={cap}
              onChange={e => handleCapChange(e.target.value.replace(/\D/g, '').slice(0, 5))}
              className="input-field"
              maxLength={5}
            />

            {/* Avviso CAP non trovato */}
            {capNonTrovato && (
              <p className="mt-2 text-sm text-amber-600">
                ⚠️ CAP non riconosciuto. Inserisci la città manualmente.
              </p>
            )}

            {/* Lista suggerimenti */}
            {suggerimentiCap.length > 1 && (
              <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <p className="px-3 py-2 text-xs text-slate-500 bg-slate-50 border-b">
                  Seleziona la tua città:
                </p>
                {suggerimentiCap.map((comune, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelezionaCitta(comune)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0 flex justify-between items-center"
                  >
                    <span className="font-medium text-slate-800">{comune.nome}</span>
                    <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">{comune.provincia}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CITTÀ E PROVINCIA */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Città</label>
              <input
                type="text"
                placeholder="Napoli"
                value={citta}
                onChange={e => handleCittaChange(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Provincia</label>
              <input
                type="text"
                placeholder="NA"
                value={provincia}
                onChange={e => setProvincia(e.target.value.toUpperCase().slice(0, 2))}
                className="input-field uppercase text-center font-mono font-bold"
                maxLength={2}
                readOnly={!!provincia && !!citta}
              />
            </div>
          </div>
        </div>

        {/* NOTE */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Note aggiuntive <span className="text-slate-400 font-normal">(facoltativo)</span>
          </label>
          <textarea
            placeholder="Eventuali richieste o informazioni utili..."
            value={note}
            onChange={e => setNote(e.target.value)}
            className="input-field resize-none"
            rows={3}
          />
        </div>

        {/* PRIVACY */}
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={privacyAccettata}
              onChange={e => {
                setPrivacyAccettata(e.target.checked)
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
              checked={marketingAccettato}
              onChange={e => setMarketingAccettato(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">
              Acconsento a ricevere comunicazioni commerciali
            </span>
          </label>
        </div>

      </div>

      {/* NAVIGAZIONE */}
      <div className="flex gap-4">
        <button onClick={onPrev} className="btn-secondary flex items-center gap-2">
          <ChevronLeft className="w-5 h-5" /> Indietro
        </button>
        <button onClick={handleNext} className="btn-primary flex-1 flex items-center justify-center gap-2">
          Invia richiesta <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  )
}

export default Step5PersonalData
