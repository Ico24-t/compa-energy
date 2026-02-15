import React, { useState } from 'react'
import { User, MapPin, FileText, Home } from 'lucide-react'
import { useForm } from '../contexts/FormContext'
import { motion } from 'framer-motion'
import { validateForm, validateCodiceFiscale, validateCAP, validatePOD, validatePDR } from '../utils/validation'
import { createPreContract, updateLeadStatus } from '../services/api'

const Step5PersonalData = () => {
  const { formData, updateFormData, nextStep, leadId, setLoading } = useForm()
  const [errors, setErrors] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const requiredFields = ['nome', 'cognome', 'codice_fiscale', 'data_nascita', 
                           'indirizzo_fornitura', 'cap', 'citta', 'provincia']
    
    const validation = validateForm(formData, requiredFields)
    
    if (!validateCodiceFiscale(formData.codice_fiscale)) {
      validation.errors.codice_fiscale = 'Codice fiscale non valido'
      validation.isValid = false
    }
    
    if (!validateCAP(formData.cap)) {
      validation.errors.cap = 'CAP non valido'
      validation.isValid = false
    }
    
    if (formData.codice_pod && !validatePOD(formData.codice_pod)) {
      validation.errors.codice_pod = 'Codice POD non valido'
      validation.isValid = false
    }
    
    if (formData.codice_pdr && !validatePDR(formData.codice_pdr)) {
      validation.errors.codice_pdr = 'Codice PDR non valido'
      validation.isValid = false
    }
    
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }
    
    setLoading(true)
    
    try {
      const contractResult = await createPreContract({
        lead_id: leadId,
        offerta_id: formData.offerta_selezionata.id,
        nome: formData.nome,
        cognome: formData.cognome,
        codice_fiscale: formData.codice_fiscale.toUpperCase(),
        data_nascita: formData.data_nascita,
        luogo_nascita: formData.luogo_nascita,
        indirizzo_fornitura: formData.indirizzo_fornitura,
        cap: formData.cap,
        citta: formData.citta,
        provincia: formData.provincia,
        codice_pod: formData.codice_pod || null,
        codice_pdr: formData.codice_pdr || null,
        fornitore_attuale: formData.fornitore_attuale,
        note_cliente: formData.note_cliente
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
        <p className="text-slate-600 mb-6">
          Ultimi passaggi per ricevere la tua offerta personalizzata
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dati personali */}
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">Codice Fiscale *</label>
                <input
                  type="text"
                  value={formData.codice_fiscale}
                  onChange={(e) => updateFormData({ codice_fiscale: e.target.value.toUpperCase() })}
                  className="input-field"
                  maxLength={16}
                />
                {errors.codice_fiscale && <p className="mt-1 text-sm text-red-600">{errors.codice_fiscale}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Data di Nascita *</label>
                <input
                  type="date"
                  value={formData.data_nascita}
                  onChange={(e) => updateFormData({ data_nascita: e.target.value })}
                  className="input-field"
                />
                {errors.data_nascita && <p className="mt-1 text-sm text-red-600">{errors.data_nascita}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Luogo di Nascita</label>
                <input
                  type="text"
                  value={formData.luogo_nascita}
                  onChange={(e) => updateFormData({ luogo_nascita: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Indirizzo fornitura */}
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">CAP *</label>
                  <input
                    type="text"
                    value={formData.cap}
                    onChange={(e) => updateFormData({ cap: e.target.value })}
                    className="input-field"
                    maxLength={5}
                  />
                  {errors.cap && <p className="mt-1 text-sm text-red-600">{errors.cap}</p>}
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Città *</label>
                  <input
                    type="text"
                    value={formData.citta}
                    onChange={(e) => updateFormData({ citta: e.target.value })}
                    className="input-field"
                  />
                  {errors.citta && <p className="mt-1 text-sm text-red-600">{errors.citta}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Provincia *</label>
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

          {/* Dati fornitura attuale */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
              <FileText className="w-5 h-5" />
              Fornitura Attuale
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

          {/* Note */}
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
            Invia richiesta offerta
          </button>
        </form>
      </div>
    </motion.div>
  )
}

export default Step5PersonalData
