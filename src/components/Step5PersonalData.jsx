import React, { useState, useRef } from 'react'
import { User, MapPin, FileText } from 'lucide-react'
import { useForm } from '../contexts/FormContext'
import { motion } from 'framer-motion'
import { validateCodiceFiscale, validateCAP, validatePOD, validatePDR } from '../utils/validation'
import { createPreContract, updateLeadStatus } from '../services/api'

const Step5PersonalData = () => {
  const { formData, updateFormData, nextStep, leadId, setLoading } = useForm()
  const [errors, setErrors] = useState({})
  const [capLoading, setCapLoading] = useState(false)
  const capTimer = useRef(null)

  // ── Autocompilazione CAP ────────────────────────────────────────────────────
  const lookupCap = async (cap) => {
    if (cap.length !== 5) return
    setCapLoading(true)
    try {
      // API pubblica italiana per CAP → comune + provincia
      const res = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${cap}&country=it&format=json&limit=1`)
      if (res.ok) {
        const data = await res.json()
        if (data.length > 0) {
          // display_name formato: "comune, provincia, regione, Italia"
          const parts = data[0].display_name.split(',').map(s => s.trim())
          if (parts.length >= 2) {
            updateFormData({ citta: parts[0] })
            // La provincia non è nel risultato Nominatim in modo affidabile,
            // la ricaviamo dalla seconda parte se è sigla (2 caratteri)
            if (parts[1] && parts[1].length === 2) {
              updateFormData({ provincia: parts[1].toUpperCase() })
            }
          }
        }
      }
    } catch { /* silenzioso */ }
    finally { setCapLoading(false) }
  }

  // ── Autocompilazione Città → Provincia ─────────────────────────────────────
  const lookupCitta = async (citta) => {
    if (citta.length < 3) return
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(citta)}&country=it&format=json&limit=1`)
      if (res.ok) {
        const data = await res.json()
        if (data.length > 0 && data[0].display_name) {
          const parts = data[0].display_name.split(',').map(s => s.trim())
          // cerca la sigla provincia (2 lettere maiuscole)
          const prov = parts.find(p => /^[A-Z]{2}$/.test(p))
          if (prov) updateFormData({ provincia: prov })
          // Se il CAP è vuoto, prova a compilarlo dal postcode
          if (!formData.cap && data[0].postcode) {
            updateFormData({ cap: data[0].postcode.slice(0, 5) })
          }
        }
      }
    } catch { /* silenzioso */ }
  }

  const handleCapChange = (val) => {
    const v = val.replace(/\D/g, '').slice(0, 5)
    updateFormData({ cap: v })
    setErrors(p => ({ ...p, cap: null }))
    clearTimeout(capTimer.current)
    if (v.length === 5) capTimer.current = setTimeout(() => lookupCap(v), 500)
  }

  const handleCittaBlur = (val) => {
    if (val.length >= 3) lookupCitta(val)
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!formData.nome) errs.nome = 'Campo obbligatorio'
    if (!formData.cognome) errs.cognome = 'Campo obbligatorio'
    if (!formData.codice_fiscale) errs.codice_fiscale = 'Campo obbligatorio'
    if (!formData.indirizzo_fornitura) errs.indirizzo_fornitura = 'Campo obbligatorio'
    if (!formData.cap) errs.cap = 'Campo obbligatorio'
    if (!formData.citta) errs.citta = 'Campo obbligatorio'
    if (!formData.provincia) errs.provincia = 'Campo obbligatorio'
    if (formData.codice_fiscale && !validateCodiceFiscale(formData.codice_fiscale)) errs.codice_fiscale = 'Codice fiscale non valido'
    if (formData.cap && !validateCAP(formData.cap)) errs.cap = 'CAP non valido'
    if (formData.codice_pod && !validatePOD(formData.codice_pod)) errs.codice_pod = 'Formato POD non valido'
    if (formData.codice_pdr && !validatePDR(formData.codice_pdr)) errs.codice_pdr = 'PDR: 14 cifre'

    if (Object.keys(errs).length) { setErrors(errs); window.scrollTo({ top: 0, behavior: 'smooth' }); return }

    setLoading(true)
    try {
      const res = await createPreContract({
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
      if (!res.success) throw new Error(res.error)
      await updateLeadStatus(leadId, 'dati_anagrafici')
      nextStep()
    } catch (err) {
      console.error(err)
      setErrors({ submit: 'Si è verificato un errore. Riprova.' })
    } finally { setLoading(false) }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-3xl mx-auto px-4">
      <div className="card">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-2">I tuoi dati</h2>
        <p className="text-slate-600 mb-6">Compila i campi per finalizzare la richiesta</p>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Dati personali */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
              <User className="w-5 h-5 text-blue-600" /> Dati Personali
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <F label="Nome *" error={errors.nome}>
                <input type="text" value={formData.nome || ''} className="input-field"
                  onChange={e => { updateFormData({ nome: e.target.value }); setErrors(p => ({ ...p, nome: null })) }} />
              </F>
              <F label="Cognome *" error={errors.cognome}>
                <input type="text" value={formData.cognome || ''} className="input-field"
                  onChange={e => { updateFormData({ cognome: e.target.value }); setErrors(p => ({ ...p, cognome: null })) }} />
              </F>
              <F label="Codice Fiscale *" error={errors.codice_fiscale} full>
                <input type="text" value={formData.codice_fiscale || ''} maxLength={16}
                  className="input-field uppercase"
                  onChange={e => { updateFormData({ codice_fiscale: e.target.value.toUpperCase() }); setErrors(p => ({ ...p, codice_fiscale: null })) }} />
              </F>
            </div>
          </section>

          {/* Indirizzo fornitura */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
              <MapPin className="w-5 h-5 text-blue-600" /> Indirizzo di Fornitura
            </h3>
            <div className="space-y-4">
              <F label="Indirizzo completo *" error={errors.indirizzo_fornitura}>
                <input type="text" value={formData.indirizzo_fornitura || ''} className="input-field"
                  placeholder="Via/Piazza e numero civico"
                  onChange={e => { updateFormData({ indirizzo_fornitura: e.target.value }); setErrors(p => ({ ...p, indirizzo_fornitura: null })) }} />
              </F>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* CAP con autocompilazione */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    CAP * {capLoading && <span className="text-xs text-blue-500 animate-pulse">↻</span>}
                  </label>
                  <input type="text" value={formData.cap || ''} maxLength={5} className="input-field"
                    onChange={e => handleCapChange(e.target.value)} />
                  {errors.cap && <p className="mt-1 text-xs text-red-600">{errors.cap}</p>}
                </div>

                {/* Città — autocompilata dal CAP o compilazione libera */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Città *</label>
                  <input type="text" value={formData.citta || ''} className="input-field"
                    onChange={e => { updateFormData({ citta: e.target.value }); setErrors(p => ({ ...p, citta: null })) }}
                    onBlur={e => handleCittaBlur(e.target.value)} />
                  {errors.citta && <p className="mt-1 text-xs text-red-600">{errors.citta}</p>}
                </div>

                {/* Provincia — autocompilata */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Prov. *</label>
                  <input type="text" value={formData.provincia || ''} maxLength={2}
                    className="input-field uppercase"
                    onChange={e => { updateFormData({ provincia: e.target.value.toUpperCase() }); setErrors(p => ({ ...p, provincia: null })) }} />
                  {errors.provincia && <p className="mt-1 text-xs text-red-600">{errors.provincia}</p>}
                </div>
              </div>
            </div>
          </section>

          {/* Fornitura attuale */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
              <FileText className="w-5 h-5 text-blue-600" /> Fornitura Attuale
            </h3>
            <div className="space-y-4">
              {(formData.tipo_fornitura === 'luce' || formData.tipo_fornitura === 'dual') && (
                <F label="Codice POD (Luce)" sub="opzionale" error={errors.codice_pod}>
                  <input type="text" value={formData.codice_pod || ''} className="input-field uppercase"
                    placeholder="IT001E12345678"
                    onChange={e => { updateFormData({ codice_pod: e.target.value.toUpperCase() }); setErrors(p => ({ ...p, codice_pod: null })) }} />
                </F>
              )}
              {(formData.tipo_fornitura === 'gas' || formData.tipo_fornitura === 'dual') && (
                <F label="Codice PDR (Gas)" sub="opzionale" error={errors.codice_pdr}>
                  <input type="text" value={formData.codice_pdr || ''} className="input-field"
                    placeholder="14 cifre"
                    onChange={e => { updateFormData({ codice_pdr: e.target.value }); setErrors(p => ({ ...p, codice_pdr: null })) }} />
                </F>
              )}
              <F label="Fornitore Attuale" sub="opzionale">
                <input type="text" value={formData.fornitore_attuale || ''} className="input-field"
                  placeholder="Es. Enel, Eni, A2A…"
                  onChange={e => updateFormData({ fornitore_attuale: e.target.value })} />
              </F>
            </div>
          </section>

          {/* Note */}
          <F label="Note aggiuntive" sub="opzionale">
            <textarea value={formData.note_cliente || ''} className="input-field resize-none" rows={3}
              placeholder="Eventuali richieste o informazioni aggiuntive…"
              onChange={e => updateFormData({ note_cliente: e.target.value })} />
          </F>

          {errors.submit && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{errors.submit}</div>}

          <button type="submit" className="btn-primary w-full text-base">Invia e ottieni l'offerta</button>
        </form>
      </div>
    </motion.div>
  )
}

const F = ({ label, sub, error, children, full }) => (
  <div className={full ? 'md:col-span-2' : ''}>
    <label className="block text-sm font-semibold text-slate-700 mb-2">
      {label} {sub && <span className="text-slate-400 font-normal">— {sub}</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
)

export default Step5PersonalData
