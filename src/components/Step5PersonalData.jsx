import React, { useState, useCallback } from 'react'
import { User, MapPin, FileText } from 'lucide-react'
import { useForm } from '../contexts/FormContext'
import { motion } from 'framer-motion'
import { validateCodiceFiscale, validateCAP, validatePOD, validatePDR } from '../utils/validation'
import { createPreContract, updateLeadStatus } from '../services/api'

// Debounce semplice per non chiamare API ad ogni tasto
const useDebounce = (fn, delay) => {
  const timer = React.useRef(null)
  return useCallback((...args) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(...args), delay)
  }, [fn, delay])
}

const Step5PersonalData = () => {
  const { formData, updateFormData, nextStep, leadId, setLoading } = useForm()
  const [errors, setErrors] = useState({})
  const [capLoading, setCapLoading] = useState(false)

  // Autocompilazione CAP → città + provincia via API pubblica
  const cercaCap = async (cap) => {
    if (cap.length !== 5) return
    setCapLoading(true)
    try {
      const res = await fetch(`https://axqvoqvbfjpaamphztgd.functions.supabase.co/cap-lookup?cap=${cap}`)
      if (res.ok) {
        const data = await res.json()
        if (data.citta && data.provincia) {
          updateFormData({ citta: data.citta, provincia: data.provincia })
        }
      } else {
        // Fallback: API gratuita codici postali italiani
        const r2 = await fetch(`https://geocode.maps.co/search?postalcode=${cap}&country=IT&format=json`)
        if (r2.ok) {
          const d2 = await r2.json()
          if (d2.length > 0) {
            const display = d2[0].display_name || ''
            const parti = display.split(',').map(s => s.trim())
            if (parti.length >= 2) {
              updateFormData({ citta: parti[0] })
            }
          }
        }
      }
    } catch {
      // silenzioso - il campo rimane editabile manualmente
    } finally {
      setCapLoading(false)
    }
  }

  const debouncedCercaCap = useDebounce(cercaCap, 600)

  const handleCapChange = (val) => {
    const v = val.replace(/\D/g, '').slice(0, 5)
    updateFormData({ cap: v })
    setErrors(prev => ({ ...prev, cap: null }))
    if (v.length === 5) debouncedCercaCap(v)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newErrors = {}
    if (!formData.nome) newErrors.nome = 'Campo obbligatorio'
    if (!formData.cognome) newErrors.cognome = 'Campo obbligatorio'
    if (!formData.codice_fiscale) newErrors.codice_fiscale = 'Campo obbligatorio'
    if (!formData.indirizzo_fornitura) newErrors.indirizzo_fornitura = 'Campo obbligatorio'
    if (!formData.cap) newErrors.cap = 'Campo obbligatorio'
    if (!formData.citta) newErrors.citta = 'Campo obbligatorio'
    if (!formData.provincia) newErrors.provincia = 'Campo obbligatorio'

    if (formData.codice_fiscale && !validateCodiceFiscale(formData.codice_fiscale)) {
      newErrors.codice_fiscale = 'Codice fiscale non valido'
    }
    if (formData.cap && !validateCAP(formData.cap)) {
      newErrors.cap = 'CAP non valido (5 cifre)'
    }
    if (formData.codice_pod && !validatePOD(formData.codice_pod)) {
      newErrors.codice_pod = 'Formato POD non valido (es. IT001E12345678)'
    }
    if (formData.codice_pdr && !validatePDR(formData.codice_pdr)) {
      newErrors.codice_pdr = 'Il PDR deve avere 14 cifre'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setLoading(true)
    try {
      const contractResult = await createPreContract({
        lead_id: leadId,
        offerta_id: formData.offerta_selezionata?.id,
        nome: formData.nome.trim(),
        cognome: formData.cognome.trim(),
        codice_fiscale: formData.codice_fiscale.toUpperCase(),
        indirizzo_fornitura: formData.indirizzo_fornitura.trim(),
        cap: formData.cap,
        citta: formData.citta.trim(),
        provincia: formData.provincia.toUpperCase().slice(0, 2),
        codice_pod: formData.codice_pod || null,
        codice_pdr: formData.codice_pdr || null,
        fornitore_attuale: formData.fornitore_attuale || null,
        tipo_contratto_attuale: formData.tipo_contratto_attuale || null,
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-3xl mx-auto px-4">
      <div className="card">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-2">
          I tuoi dati
        </h2>
        <p className="text-slate-600 mb-6">Compila i campi per finalizzare la richiesta</p>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Dati Personali ── */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
              <User className="w-5 h-5 text-blue-600" /> Dati Personali
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nome *" error={errors.nome}>
                <input type="text" value={formData.nome || ''} className="input-field"
                  onChange={e => { updateFormData({ nome: e.target.value }); setErrors(p => ({ ...p, nome: null })) }} />
              </Field>
              <Field label="Cognome *" error={errors.cognome}>
                <input type="text" value={formData.cognome || ''} className="input-field"
                  onChange={e => { updateFormData({ cognome: e.target.value }); setErrors(p => ({ ...p, cognome: null })) }} />
              </Field>
              <Field label="Codice Fiscale *" error={errors.codice_fiscale} className="md:col-span-2">
                <input type="text" value={formData.codice_fiscale || ''} maxLength={16}
                  className="input-field uppercase"
                  onChange={e => { updateFormData({ codice_fiscale: e.target.value.toUpperCase() }); setErrors(p => ({ ...p, codice_fiscale: null })) }} />
              </Field>
            </div>
          </section>

          {/* ── Indirizzo Fornitura ── */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
              <MapPin className="w-5 h-5 text-blue-600" /> Indirizzo di Fornitura
            </h3>
            <div className="space-y-4">
              <Field label="Indirizzo completo *" error={errors.indirizzo_fornitura}>
                <input type="text" value={formData.indirizzo_fornitura || ''} className="input-field"
                  placeholder="Via/Piazza e numero civico"
                  onChange={e => { updateFormData({ indirizzo_fornitura: e.target.value }); setErrors(p => ({ ...p, indirizzo_fornitura: null })) }} />
              </Field>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* CAP con autocompilazione */}
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    CAP * {capLoading && <span className="text-xs text-blue-500 ml-1">↻</span>}
                  </label>
                  <input type="text" value={formData.cap || ''} maxLength={5}
                    className="input-field"
                    onChange={e => handleCapChange(e.target.value)} />
                  {errors.cap && <p className="mt-1 text-xs text-red-600">{errors.cap}</p>}
                </div>

                {/* Città — autocompilata dal CAP */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Città *</label>
                  <input type="text" value={formData.citta || ''} className="input-field"
                    onChange={e => { updateFormData({ citta: e.target.value }); setErrors(p => ({ ...p, citta: null })) }} />
                  {errors.citta && <p className="mt-1 text-xs text-red-600">{errors.citta}</p>}
                </div>

                {/* Provincia — autocompilata dal CAP */}
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Prov. *</label>
                  <input type="text" value={formData.provincia || ''} maxLength={2}
                    className="input-field uppercase"
                    onChange={e => { updateFormData({ provincia: e.target.value.toUpperCase() }); setErrors(p => ({ ...p, provincia: null })) }} />
                  {errors.provincia && <p className="mt-1 text-xs text-red-600">{errors.provincia}</p>}
                </div>
              </div>
            </div>
          </section>

          {/* ── Fornitura Attuale ── */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
              <FileText className="w-5 h-5 text-blue-600" /> Fornitura Attuale
            </h3>
            <div className="space-y-4">
              {(formData.tipo_fornitura === 'luce' || formData.tipo_fornitura === 'dual') && (
                <Field label="Codice POD (Luce)" sublabel="opzionale" error={errors.codice_pod}>
                  <input type="text" value={formData.codice_pod || ''} className="input-field uppercase"
                    placeholder="IT001E12345678"
                    onChange={e => { updateFormData({ codice_pod: e.target.value.toUpperCase() }); setErrors(p => ({ ...p, codice_pod: null })) }} />
                </Field>
              )}
              {(formData.tipo_fornitura === 'gas' || formData.tipo_fornitura === 'dual') && (
                <Field label="Codice PDR (Gas)" sublabel="opzionale" error={errors.codice_pdr}>
                  <input type="text" value={formData.codice_pdr || ''} className="input-field"
                    placeholder="14 cifre"
                    onChange={e => { updateFormData({ codice_pdr: e.target.value }); setErrors(p => ({ ...p, codice_pdr: null })) }} />
                </Field>
              )}
              <Field label="Fornitore Attuale" sublabel="opzionale">
                <input type="text" value={formData.fornitore_attuale || ''} className="input-field"
                  placeholder="Es. Enel, Eni, A2A…"
                  onChange={e => updateFormData({ fornitore_attuale: e.target.value })} />
              </Field>
            </div>
          </section>

          {/* ── Note ── */}
          <Field label="Note aggiuntive" sublabel="opzionale">
            <textarea value={formData.note_cliente || ''} className="input-field resize-none" rows={3}
              placeholder="Eventuali richieste o informazioni aggiuntive…"
              onChange={e => updateFormData({ note_cliente: e.target.value })} />
          </Field>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{errors.submit}</div>
          )}

          <button type="submit" className="btn-primary w-full text-lg">
            Invia e Ottieni l'offerta
          </button>
        </form>
      </div>
    </motion.div>
  )
}

// Componente Field helper
const Field = ({ label, sublabel, error, children, className = '' }) => (
  <div className={className}>
    <label className="block text-sm font-semibold text-slate-700 mb-2">
      {label} {sublabel && <span className="text-slate-400 font-normal">- {sublabel}</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
)

export default Step5PersonalData
