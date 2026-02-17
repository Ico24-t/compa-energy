import React, { useState } from 'react'
import { User, MapPin, FileText } from 'lucide-react'
import { useForm } from '../contexts/FormContext'
import { motion } from 'framer-motion'
import { validateCAP, validatePOD, validatePDR } from '../utils/validation'
import { createPreContract, updateLeadStatus } from '../services/api'

// Database comuni italiani essenziale con CAP e province
// Formato: CAP -> [{ nome, provincia }]
const COMUNI_PER_CAP = {
  '00100': [{ nome: 'Roma', provincia: 'RM' }],
  '00118': [{ nome: 'Roma', provincia: 'RM' }],
  '00121': [{ nome: 'Roma', provincia: 'RM' }],
  '00122': [{ nome: 'Roma', provincia: 'RM' }],
  '00141': [{ nome: 'Roma', provincia: 'RM' }],
  '00142': [{ nome: 'Roma', provincia: 'RM' }],
  '00165': [{ nome: 'Roma', provincia: 'RM' }],
  '00185': [{ nome: 'Roma', provincia: 'RM' }],
  '00195': [{ nome: 'Roma', provincia: 'RM' }],
  '20100': [{ nome: 'Milano', provincia: 'MI' }],
  '20121': [{ nome: 'Milano', provincia: 'MI' }],
  '20122': [{ nome: 'Milano', provincia: 'MI' }],
  '20123': [{ nome: 'Milano', provincia: 'MI' }],
  '20124': [{ nome: 'Milano', provincia: 'MI' }],
  '20125': [{ nome: 'Milano', provincia: 'MI' }],
  '20126': [{ nome: 'Milano', provincia: 'MI' }],
  '20127': [{ nome: 'Milano', provincia: 'MI' }],
  '20128': [{ nome: 'Milano', provincia: 'MI' }],
  '20129': [{ nome: 'Milano', provincia: 'MI' }],
  '20130': [{ nome: 'Milano', provincia: 'MI' }],
  '20131': [{ nome: 'Milano', provincia: 'MI' }],
  '20132': [{ nome: 'Milano', provincia: 'MI' }],
  '20133': [{ nome: 'Milano', provincia: 'MI' }],
  '20134': [{ nome: 'Milano', provincia: 'MI' }],
  '20135': [{ nome: 'Milano', provincia: 'MI' }],
  '20136': [{ nome: 'Milano', provincia: 'MI' }],
  '20137': [{ nome: 'Milano', provincia: 'MI' }],
  '20138': [{ nome: 'Milano', provincia: 'MI' }],
  '20139': [{ nome: 'Milano', provincia: 'MI' }],
  '20140': [{ nome: 'Milano', provincia: 'MI' }],
  '20141': [{ nome: 'Milano', provincia: 'MI' }],
  '20142': [{ nome: 'Milano', provincia: 'MI' }],
  '20143': [{ nome: 'Milano', provincia: 'MI' }],
  '20144': [{ nome: 'Milano', provincia: 'MI' }],
  '20145': [{ nome: 'Milano', provincia: 'MI' }],
  '20146': [{ nome: 'Milano', provincia: 'MI' }],
  '20147': [{ nome: 'Milano', provincia: 'MI' }],
  '20148': [{ nome: 'Milano', provincia: 'MI' }],
  '20149': [{ nome: 'Milano', provincia: 'MI' }],
  '20150': [{ nome: 'Milano', provincia: 'MI' }],
  '20151': [{ nome: 'Milano', provincia: 'MI' }],
  '20152': [{ nome: 'Milano', provincia: 'MI' }],
  '20153': [{ nome: 'Milano', provincia: 'MI' }],
  '20154': [{ nome: 'Milano', provincia: 'MI' }],
  '20155': [{ nome: 'Milano', provincia: 'MI' }],
  '20156': [{ nome: 'Milano', provincia: 'MI' }],
  '20157': [{ nome: 'Milano', provincia: 'MI' }],
  '20158': [{ nome: 'Milano', provincia: 'MI' }],
  '20159': [{ nome: 'Milano', provincia: 'MI' }],
  '20160': [{ nome: 'Milano', provincia: 'MI' }],
  '20161': [{ nome: 'Milano', provincia: 'MI' }],
  '20162': [{ nome: 'Milano', provincia: 'MI' }],
  '80100': [{ nome: 'Napoli', provincia: 'NA' }],
  '80121': [{ nome: 'Napoli', provincia: 'NA' }],
  '80122': [{ nome: 'Napoli', provincia: 'NA' }],
  '80123': [{ nome: 'Napoli', provincia: 'NA' }],
  '80124': [{ nome: 'Napoli', provincia: 'NA' }],
  '80125': [{ nome: 'Napoli', provincia: 'NA' }],
  '80126': [{ nome: 'Napoli', provincia: 'NA' }],
  '80127': [{ nome: 'Napoli', provincia: 'NA' }],
  '80128': [{ nome: 'Napoli', provincia: 'NA' }],
  '80129': [{ nome: 'Napoli', provincia: 'NA' }],
  '80130': [{ nome: 'Napoli', provincia: 'NA' }],
  '80131': [{ nome: 'Napoli', provincia: 'NA' }],
  '80132': [{ nome: 'Napoli', provincia: 'NA' }],
  '80133': [{ nome: 'Napoli', provincia: 'NA' }],
  '80134': [{ nome: 'Napoli', provincia: 'NA' }],
  '80135': [{ nome: 'Napoli', provincia: 'NA' }],
  '80136': [{ nome: 'Napoli', provincia: 'NA' }],
  '80137': [{ nome: 'Napoli', provincia: 'NA' }],
  '80138': [{ nome: 'Napoli', provincia: 'NA' }],
  '80139': [{ nome: 'Napoli', provincia: 'NA' }],
  '80140': [{ nome: 'Napoli', provincia: 'NA' }],
  '80141': [{ nome: 'Napoli', provincia: 'NA' }],
  '80142': [{ nome: 'Napoli', provincia: 'NA' }],
  '80143': [{ nome: 'Napoli', provincia: 'NA' }],
  '80144': [{ nome: 'Napoli', provincia: 'NA' }],
  '80145': [{ nome: 'Napoli', provincia: 'NA' }],
  '80146': [{ nome: 'Napoli', provincia: 'NA' }],
  '80147': [{ nome: 'Napoli', provincia: 'NA' }],
  '10100': [{ nome: 'Torino', provincia: 'TO' }],
  '10121': [{ nome: 'Torino', provincia: 'TO' }],
  '10122': [{ nome: 'Torino', provincia: 'TO' }],
  '10123': [{ nome: 'Torino', provincia: 'TO' }],
  '10124': [{ nome: 'Torino', provincia: 'TO' }],
  '10125': [{ nome: 'Torino', provincia: 'TO' }],
  '10126': [{ nome: 'Torino', provincia: 'TO' }],
  '10127': [{ nome: 'Torino', provincia: 'TO' }],
  '10128': [{ nome: 'Torino', provincia: 'TO' }],
  '10129': [{ nome: 'Torino', provincia: 'TO' }],
  '10130': [{ nome: 'Torino', provincia: 'TO' }],
  '10131': [{ nome: 'Torino', provincia: 'TO' }],
  '10132': [{ nome: 'Torino', provincia: 'TO' }],
  '10133': [{ nome: 'Torino', provincia: 'TO' }],
  '10134': [{ nome: 'Torino', provincia: 'TO' }],
  '10135': [{ nome: 'Torino', provincia: 'TO' }],
  '10136': [{ nome: 'Torino', provincia: 'TO' }],
  '10137': [{ nome: 'Torino', provincia: 'TO' }],
  '10138': [{ nome: 'Torino', provincia: 'TO' }],
  '10139': [{ nome: 'Torino', provincia: 'TO' }],
  '10140': [{ nome: 'Torino', provincia: 'TO' }],
  '10141': [{ nome: 'Torino', provincia: 'TO' }],
  '10142': [{ nome: 'Torino', provincia: 'TO' }],
  '10143': [{ nome: 'Torino', provincia: 'TO' }],
  '10144': [{ nome: 'Torino', provincia: 'TO' }],
  '10145': [{ nome: 'Torino', provincia: 'TO' }],
  '10146': [{ nome: 'Torino', provincia: 'TO' }],
  '10147': [{ nome: 'Torino', provincia: 'TO' }],
  '10148': [{ nome: 'Torino', provincia: 'TO' }],
  '10149': [{ nome: 'Torino', provincia: 'TO' }],
  '10150': [{ nome: 'Torino', provincia: 'TO' }],
  '50100': [{ nome: 'Firenze', provincia: 'FI' }],
  '50121': [{ nome: 'Firenze', provincia: 'FI' }],
  '50122': [{ nome: 'Firenze', provincia: 'FI' }],
  '50123': [{ nome: 'Firenze', provincia: 'FI' }],
  '50124': [{ nome: 'Firenze', provincia: 'FI' }],
  '50125': [{ nome: 'Firenze', provincia: 'FI' }],
  '50126': [{ nome: 'Firenze', provincia: 'FI' }],
  '50127': [{ nome: 'Firenze', provincia: 'FI' }],
  '50128': [{ nome: 'Firenze', provincia: 'FI' }],
  '50129': [{ nome: 'Firenze', provincia: 'FI' }],
  '50130': [{ nome: 'Firenze', provincia: 'FI' }],
  '50131': [{ nome: 'Firenze', provincia: 'FI' }],
  '50132': [{ nome: 'Firenze', provincia: 'FI' }],
  '50133': [{ nome: 'Firenze', provincia: 'FI' }],
  '50134': [{ nome: 'Firenze', provincia: 'FI' }],
  '50135': [{ nome: 'Firenze', provincia: 'FI' }],
  '90100': [{ nome: 'Palermo', provincia: 'PA' }],
  '90121': [{ nome: 'Palermo', provincia: 'PA' }],
  '90122': [{ nome: 'Palermo', provincia: 'PA' }],
  '90123': [{ nome: 'Palermo', provincia: 'PA' }],
  '90124': [{ nome: 'Palermo', provincia: 'PA' }],
  '90125': [{ nome: 'Palermo', provincia: 'PA' }],
  '90126': [{ nome: 'Palermo', provincia: 'PA' }],
  '90127': [{ nome: 'Palermo', provincia: 'PA' }],
  '90128': [{ nome: 'Palermo', provincia: 'PA' }],
  '95100': [{ nome: 'Catania', provincia: 'CT' }],
  '95121': [{ nome: 'Catania', provincia: 'CT' }],
  '95122': [{ nome: 'Catania', provincia: 'CT' }],
  '95123': [{ nome: 'Catania', provincia: 'CT' }],
  '95124': [{ nome: 'Catania', provincia: 'CT' }],
  '95125': [{ nome: 'Catania', provincia: 'CT' }],
  '95126': [{ nome: 'Catania', provincia: 'CT' }],
  '40100': [{ nome: 'Bologna', provincia: 'BO' }],
  '40121': [{ nome: 'Bologna', provincia: 'BO' }],
  '40122': [{ nome: 'Bologna', provincia: 'BO' }],
  '40123': [{ nome: 'Bologna', provincia: 'BO' }],
  '40124': [{ nome: 'Bologna', provincia: 'BO' }],
  '40125': [{ nome: 'Bologna', provincia: 'BO' }],
  '40126': [{ nome: 'Bologna', provincia: 'BO' }],
  '40127': [{ nome: 'Bologna', provincia: 'BO' }],
  '40128': [{ nome: 'Bologna', provincia: 'BO' }],
  '40129': [{ nome: 'Bologna', provincia: 'BO' }],
  '40130': [{ nome: 'Bologna', provincia: 'BO' }],
  '40131': [{ nome: 'Bologna', provincia: 'BO' }],
  '40132': [{ nome: 'Bologna', provincia: 'BO' }],
  '40133': [{ nome: 'Bologna', provincia: 'BO' }],
  '40134': [{ nome: 'Bologna', provincia: 'BO' }],
  '40135': [{ nome: 'Bologna', provincia: 'BO' }],
  '40136': [{ nome: 'Bologna', provincia: 'BO' }],
  '40137': [{ nome: 'Bologna', provincia: 'BO' }],
  '40138': [{ nome: 'Bologna', provincia: 'BO' }],
  '40139': [{ nome: 'Bologna', provincia: 'BO' }],
  '16100': [{ nome: 'Genova', provincia: 'GE' }],
  '16121': [{ nome: 'Genova', provincia: 'GE' }],
  '16122': [{ nome: 'Genova', provincia: 'GE' }],
  '16123': [{ nome: 'Genova', provincia: 'GE' }],
  '16124': [{ nome: 'Genova', provincia: 'GE' }],
  '16125': [{ nome: 'Genova', provincia: 'GE' }],
  '16126': [{ nome: 'Genova', provincia: 'GE' }],
  '16127': [{ nome: 'Genova', provincia: 'GE' }],
  '16128': [{ nome: 'Genova', provincia: 'GE' }],
  '16129': [{ nome: 'Genova', provincia: 'GE' }],
  '16130': [{ nome: 'Genova', provincia: 'GE' }],
  '16131': [{ nome: 'Genova', provincia: 'GE' }],
  '16132': [{ nome: 'Genova', provincia: 'GE' }],
  '16133': [{ nome: 'Genova', provincia: 'GE' }],
  '16134': [{ nome: 'Genova', provincia: 'GE' }],
  '16135': [{ nome: 'Genova', provincia: 'GE' }],
  '16136': [{ nome: 'Genova', provincia: 'GE' }],
  '16137': [{ nome: 'Genova', provincia: 'GE' }],
  '16138': [{ nome: 'Genova', provincia: 'GE' }],
  '16139': [{ nome: 'Genova', provincia: 'GE' }],
  '16140': [{ nome: 'Genova', provincia: 'GE' }],
  '16141': [{ nome: 'Genova', provincia: 'GE' }],
  '16142': [{ nome: 'Genova', provincia: 'GE' }],
  '16143': [{ nome: 'Genova', provincia: 'GE' }],
  '16144': [{ nome: 'Genova', provincia: 'GE' }],
  '16145': [{ nome: 'Genova', provincia: 'GE' }],
  '16146': [{ nome: 'Genova', provincia: 'GE' }],
  '16147': [{ nome: 'Genova', provincia: 'GE' }],
  '16148': [{ nome: 'Genova', provincia: 'GE' }],
  '16149': [{ nome: 'Genova', provincia: 'GE' }],
  '16150': [{ nome: 'Genova', provincia: 'GE' }],
  '16151': [{ nome: 'Genova', provincia: 'GE' }],
  '16152': [{ nome: 'Genova', provincia: 'GE' }],
  '16153': [{ nome: 'Genova', provincia: 'GE' }],
  '16154': [{ nome: 'Genova', provincia: 'GE' }],
  '16155': [{ nome: 'Genova', provincia: 'GE' }],
  '16156': [{ nome: 'Genova', provincia: 'GE' }],
  '16157': [{ nome: 'Genova', provincia: 'GE' }],
  '16158': [{ nome: 'Genova', provincia: 'GE' }],
  '16159': [{ nome: 'Genova', provincia: 'GE' }],
  '16160': [{ nome: 'Genova', provincia: 'GE' }],
  '16161': [{ nome: 'Genova', provincia: 'GE' }],
  '16162': [{ nome: 'Genova', provincia: 'GE' }],
  '16163': [{ nome: 'Genova', provincia: 'GE' }],
  '16164': [{ nome: 'Genova', provincia: 'GE' }],
  '16165': [{ nome: 'Genova', provincia: 'GE' }],
  '16166': [{ nome: 'Genova', provincia: 'GE' }],
  '16167': [{ nome: 'Genova', provincia: 'GE' }],
  '16168': [{ nome: 'Genova', provincia: 'GE' }],
}

// Lookup CAP -> comuni
const cercaPerCAP = (cap) => COMUNI_PER_CAP[cap] || []

const Step5PersonalData = () => {
  const { formData, updateFormData, nextStep, leadId, setLoading } = useForm()
  const [errors, setErrors] = useState({})
  const [suggerimentiCAP, setSuggerimentiCAP] = useState([])
  const [capNonTrovato, setCapNonTrovato] = useState(false)

  // Gestione autocomplete CAP
  const handleCAPChange = (value) => {
    updateFormData({ cap: value, citta: '', provincia: '' })
    setCapNonTrovato(false)
    setSuggerimentiCAP([])

    if (value.length === 5 && /^\d{5}$/.test(value)) {
      const comuni = cercaPerCAP(value)
      if (comuni.length === 1) {
        // Un solo comune: autofill
        updateFormData({ cap: value, citta: comuni[0].nome, provincia: comuni[0].provincia })
      } else if (comuni.length > 1) {
        // Più comuni: mostra lista
        setSuggerimentiCAP(comuni)
      } else {
        // CAP non trovato: campi liberi
        setCapNonTrovato(true)
      }
    }
  }

  const selezionaComune = (comune) => {
    updateFormData({ citta: comune.nome, provincia: comune.provincia })
    setSuggerimentiCAP([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newErrors = {}
    if (!formData.nome) newErrors.nome = 'Campo obbligatorio'
    if (!formData.cognome) newErrors.cognome = 'Campo obbligatorio'
    if (!formData.indirizzo_fornitura) newErrors.indirizzo_fornitura = 'Campo obbligatorio'
    if (!formData.cap) newErrors.cap = 'Campo obbligatorio'
    if (!formData.citta) newErrors.citta = 'Campo obbligatorio'
    if (!formData.provincia) newErrors.provincia = 'Campo obbligatorio'

    if (formData.cap && !validateCAP(formData.cap)) {
      newErrors.cap = 'CAP non valido'
    }

    if (formData.codice_pod && !validatePOD(formData.codice_pod)) {
      newErrors.codice_pod = 'Codice POD non valido'
    }

    if (formData.codice_pdr && !validatePDR(formData.codice_pdr)) {
      newErrors.codice_pdr = 'Codice PDR non valido'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)

    try {
      // Salva pre-contratto nel DB (identico all'originale)
      const contractResult = await createPreContract({
        lead_id: leadId,
        offerta_id: formData.offerta_selezionata?.id,
        nome: formData.nome,
        cognome: formData.cognome,
        codice_fiscale: formData.codice_fiscale?.toUpperCase() || null,
        data_nascita: formData.data_nascita || null,
        luogo_nascita: formData.luogo_nascita || null,
        indirizzo_fornitura: formData.indirizzo_fornitura,
        cap: formData.cap,
        citta: formData.citta,
        provincia: formData.provincia,
        codice_pod: formData.codice_pod || null,
        codice_pdr: formData.codice_pdr || null,
        fornitore_attuale: formData.fornitore_attuale || null,
        note_cliente: formData.note_cliente || null
      })

      if (!contractResult.success) throw new Error(contractResult.error)

      await updateLeadStatus(leadId, 'dati_anagrafici')

      nextStep()
    } catch (error) {
      console.error('Errore salvataggio anagrafica:', error)
      setErrors({ submit: 'Si è verificato un errore. Riprova.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-3xl mx-auto px-4"
    >
      <div className="card">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-2">
          I tuoi dati
        </h2>

        {/* Recap email e telefono già acquisiti */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6 flex flex-wrap gap-4">
          <div className="text-sm">
            <span className="text-slate-500">Email: </span>
            <span className="font-medium text-slate-800">{formData.email}</span>
          </div>
          <div className="text-sm">
            <span className="text-slate-500">Telefono: </span>
            <span className="font-medium text-slate-800">{formData.telefono}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* DATI PERSONALI */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
              <User className="w-5 h-5" />
              Dati Personali
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nome *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => updateFormData({ nome: e.target.value })}
                  className="input-field"
                />
                {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Cognome *</label>
                <input
                  type="text"
                  value={formData.cognome}
                  onChange={(e) => updateFormData({ cognome: e.target.value })}
                  className="input-field"
                />
                {errors.cognome && <p className="mt-1 text-sm text-red-600">{errors.cognome}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Codice Fiscale <span className="text-slate-400 font-normal">- opzionale</span>
                </label>
                <input
                  type="text"
                  value={formData.codice_fiscale}
                  onChange={(e) => updateFormData({ codice_fiscale: e.target.value.toUpperCase() })}
                  className="input-field"
                  maxLength={16}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Data di Nascita <span className="text-slate-400 font-normal">- opzionale</span>
                </label>
                <input
                  type="date"
                  value={formData.data_nascita}
                  onChange={(e) => updateFormData({ data_nascita: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* INDIRIZZO FORNITURA con CAP autocomplete */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
              <MapPin className="w-5 h-5" />
              Indirizzo di Fornitura
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Indirizzo completo *</label>
                <input
                  type="text"
                  value={formData.indirizzo_fornitura}
                  onChange={(e) => updateFormData({ indirizzo_fornitura: e.target.value })}
                  className="input-field"
                  placeholder="Via/Piazza, numero civico"
                />
                {errors.indirizzo_fornitura && <p className="mt-1 text-sm text-red-600">{errors.indirizzo_fornitura}</p>}
              </div>

              {/* CAP con autocomplete */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">CAP *</label>
                <input
                  type="text"
                  value={formData.cap}
                  onChange={(e) => handleCAPChange(e.target.value)}
                  className="input-field"
                  maxLength={5}
                  placeholder="es. 20100"
                />
                {errors.cap && <p className="mt-1 text-sm text-red-600">{errors.cap}</p>}

                {/* Lista comuni se CAP ha più risultati */}
                {suggerimentiCAP.length > 0 && (
                  <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden">
                    <p className="px-3 py-2 text-xs text-slate-500 bg-slate-50">Seleziona il tuo comune:</p>
                    {suggerimentiCAP.map((comune, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selezionaComune(comune)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-t border-slate-100 text-sm font-medium text-slate-800 transition-colors"
                      >
                        {comune.nome} <span className="text-slate-400">({comune.provincia})</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* CAP non trovato */}
                {capNonTrovato && (
                  <p className="mt-2 text-sm text-amber-600">
                    CAP non trovato nel database. Inserisci manualmente città e provincia.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Città *</label>
                  <input
                    type="text"
                    value={formData.citta}
                    onChange={(e) => updateFormData({ citta: e.target.value })}
                    className="input-field"
                    readOnly={suggerimentiCAP.length === 0 && !capNonTrovato && formData.citta !== ''}
                  />
                  {errors.citta && <p className="mt-1 text-sm text-red-600">{errors.citta}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Prov *</label>
                  <input
                    type="text"
                    value={formData.provincia}
                    onChange={(e) => updateFormData({ provincia: e.target.value.toUpperCase() })}
                    className="input-field"
                    maxLength={2}
                  />
                  {errors.provincia && <p className="mt-1 text-sm text-red-600">{errors.provincia}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* DATI FORNITURA ATTUALE */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
              <FileText className="w-5 h-5" />
              Fornitura Attuale <span className="text-sm font-normal text-slate-400 ml-1">- opzionale</span>
            </h3>
            <div className="space-y-4">
              {(formData.tipo_fornitura === 'luce' || formData.tipo_fornitura === 'dual') && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Codice POD (Luce) <span className="text-slate-400 font-normal">- opzionale</span>
                  </label>
                  <input
                    type="text"
                    value={formData.codice_pod}
                    onChange={(e) => updateFormData({ codice_pod: e.target.value.toUpperCase() })}
                    className="input-field"
                    placeholder="IT001E12345678"
                  />
                  {errors.codice_pod && <p className="mt-1 text-sm text-red-600">{errors.codice_pod}</p>}
                </div>
              )}
              {(formData.tipo_fornitura === 'gas' || formData.tipo_fornitura === 'dual') && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Codice PDR (Gas) <span className="text-slate-400 font-normal">- opzionale</span>
                  </label>
                  <input
                    type="text"
                    value={formData.codice_pdr}
                    onChange={(e) => updateFormData({ codice_pdr: e.target.value })}
                    className="input-field"
                    placeholder="14 cifre"
                  />
                  {errors.codice_pdr && <p className="mt-1 text-sm text-red-600">{errors.codice_pdr}</p>}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Fornitore Attuale <span className="text-slate-400 font-normal">- opzionale</span>
                </label>
                <input
                  type="text"
                  value={formData.fornitore_attuale}
                  onChange={(e) => updateFormData({ fornitore_attuale: e.target.value })}
                  className="input-field"
                  placeholder="Es. Enel, Eni, A2A..."
                />
              </div>
            </div>
          </div>

          {/* NOTE */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Note aggiuntive <span className="text-slate-400 font-normal">- opzionale</span>
            </label>
            <textarea
              value={formData.note_cliente}
              onChange={(e) => updateFormData({ note_cliente: e.target.value })}
              className="input-field resize-none"
              rows={3}
              placeholder="Eventuali richieste o informazioni aggiuntive..."
            />
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {errors.submit}
            </div>
          )}

          <button type="submit" className="btn-primary w-full">
            Invia richiesta offerta →
          </button>
        </form>
      </div>
    </motion.div>
  )
}

export default Step5PersonalData
