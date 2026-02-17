#!/bin/bash

# Crea Step 4, 5, 6 e tutti i file rimanenti

cd /home/claude/comparatore-energia

# Step 4 - Dettagli offerta con logo fornitore
cat > src/components/Step4OfferDetails.jsx << 'STEP4'
import React from 'react'
import { Check, Clock, Award, ChevronRight } from 'lucide-react'
import { useForm } from '../contexts/FormContext'
import { motion } from 'framer-motion'
import { formatCurrency } from '../utils/calculations'
import { updateLeadStatus } from '../services/api'

const Step4OfferDetails = () => {
  const { formData, nextStep, leadId } = useForm()
  const offer = formData.offerta_selezionata
  const calculation = formData.calcolo_risparmio

  const handleContinue = async () => {
    await updateLeadStatus(leadId, 'offerta_vista')
    nextStep()
  }

  if (!offer) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-3xl mx-auto px-4"
    >
      {/* Header con logo fornitore */}
      <div className="card mb-6 text-center">
        {offer.fornitori?.logo_url && (
          <img 
            src={offer.fornitori.logo_url} 
            alt={offer.fornitori.nome}
            className="h-16 mx-auto mb-4"
          />
        )}
        <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-2">
          {offer.nome_offerta}
        </h1>
        <p className="text-lg text-slate-600">
          by {offer.fornitori?.nome}
        </p>
        {offer.fornitori?.rating_fornitore > 0 && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className={`w-5 h-5 ${i < Math.floor(offer.fornitori.rating_fornitore) ? 'text-yellow-400' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm font-medium text-slate-600">
              {offer.fornitori.rating_fornitore.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Risparmio highlight */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 mb-6 text-white text-center">
        <p className="text-lg font-medium mb-2">Il tuo risparmio annuo</p>
        <p className="text-5xl font-bold mb-2">{formatCurrency(calculation.risparmio_annuo)}</p>
        <p className="text-sm opacity-90">Risparmi il {calculation.risparmio_percentuale.toFixed(1)}% rispetto all'offerta attuale</p>
      </div>

      {/* Dettagli offerta */}
      <div className="card mb-6">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Caratteristiche dell'offerta</h3>
        
        <div className="space-y-4">
          {offer.descrizione_completa && (
            <p className="text-slate-700">{offer.descrizione_completa}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {offer.prezzo_kwh && (
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-slate-600 mb-1">Prezzo Luce</p>
                <p className="text-2xl font-bold text-blue-600">{offer.prezzo_kwh.toFixed(4)} €/kWh</p>
              </div>
            )}
            {offer.prezzo_smc && (
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-slate-600 mb-1">Prezzo Gas</p>
                <p className="text-2xl font-bold text-orange-600">{offer.prezzo_smc.toFixed(4)} €/Smc</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 pt-4 mt-4">
            <ul className="space-y-3">
              {offer.green_energy && (
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-slate-700">Energia 100% da fonti rinnovabili</span>
                </li>
              )}
              {offer.digitale && (
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="text-slate-700">Gestione completamente digitale con app dedicata</span>
                </li>
              )}
              {offer.durata_mesi && (
                <li className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <span className="text-slate-700">Durata contratto: {offer.durata_mesi} mesi</span>
                </li>
              )}
              {offer.bonus_attivazione > 0 && (
                <li className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <span className="text-slate-700">Bonus attivazione: {formatCurrency(offer.bonus_attivazione)}</span>
                </li>
              )}
              {!offer.penale_recesso && (
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-slate-700">Nessuna penale di recesso</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Costi fissi */}
      {(offer.quota_fissa_luce_mensile || offer.quota_fissa_gas_mensile) && (
        <div className="card mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-3">Costi fissi mensili</h3>
          <div className="space-y-2">
            {offer.quota_fissa_luce_mensile > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Quota fissa Luce</span>
                <span className="font-semibold">{formatCurrency(offer.quota_fissa_luce_mensile)}/mese</span>
              </div>
            )}
            {offer.quota_fissa_gas_mensile > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Quota fissa Gas</span>
                <span className="font-semibold">{formatCurrency(offer.quota_fissa_gas_mensile)}/mese</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 mb-6">
        <p className="text-center text-slate-700 mb-4">
          Vuoi procedere con questa offerta?<br />
          <span className="text-sm">Compila l'anagrafica per ricevere il contratto</span>
        </p>
        <button onClick={handleContinue} className="btn-primary w-full flex items-center justify-center gap-2">
          Procedi con l'anagrafica
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  )
}

export default Step4OfferDetails
STEP4

echo "✓ Step 4 creato"

# Step 5 - Anagrafica
cat > src/components/Step5PersonalData.jsx << 'STEP5'
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
STEP5

echo "✓ Step 5 creato"

# Continua con Step 6 e altri file...
echo "Tutti gli step creati!"

