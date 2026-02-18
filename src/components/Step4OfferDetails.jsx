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

  const fornitore = offer.fornitori || {}

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-3xl mx-auto px-4"
    >
      {/* Header con logo fornitore */}
      <div className="card mb-6 text-center">
        {/* Logo fornitore con fallback testo */}
        <div className="h-16 flex items-center justify-center mb-4">
          {fornitore.logo_url ? (
            <img
              src={fornitore.logo_url}
              alt={fornitore.nome}
              className="h-14 max-w-[180px] object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
          ) : null}
          <div
            style={{ display: fornitore.logo_url ? 'none' : 'flex' }}
            className="h-14 px-6 bg-blue-100 rounded-xl items-center justify-center"
          >
            <span className="text-xl font-bold text-blue-700">{fornitore.nome}</span>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-1">
          {offer.nome_offerta}
        </h1>
        <p className="text-slate-500 text-sm">{fornitore.nome}</p>

        {/* Rating stelle */}
        {fornitore.rating_fornitore > 0 && (
          <div className="flex items-center justify-center gap-1 mt-3">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className={`w-5 h-5 ${i < Math.floor(fornitore.rating_fornitore) ? 'text-yellow-400' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="text-sm font-medium text-slate-600 ml-1">
              {fornitore.rating_fornitore.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Risparmio highlight */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 mb-6 text-white text-center">
        <p className="text-lg font-medium mb-2">Il tuo risparmio annuo</p>
        <p className="text-5xl font-bold mb-2">{formatCurrency(calculation.risparmio_annuo)}</p>
        <p className="text-sm opacity-90">
          Risparmi il {calculation.risparmio_percentuale.toFixed(1)}% · {formatCurrency(calculation.risparmio_mensile)}/mese
        </p>
      </div>

      {/* Dettagli offerta */}
      <div className="card mb-6">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Caratteristiche dell'offerta</h3>

        <div className="space-y-4">
          {offer.descrizione_completa && (
            <p className="text-slate-700">{offer.descrizione_completa}</p>
          )}

          {/* Prezzi energia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {offer.prezzo_kwh && (
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-slate-600 mb-1">Prezzo Luce</p>
                <p className="text-2xl font-bold text-blue-600">{Number(offer.prezzo_kwh).toFixed(4)} €/kWh</p>
              </div>
            )}
            {offer.prezzo_smc && (
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-slate-600 mb-1">Prezzo Gas</p>
                <p className="text-2xl font-bold text-orange-600">{Number(offer.prezzo_smc).toFixed(4)} €/Smc</p>
              </div>
            )}
          </div>

          {/* Caratteristiche */}
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
              {offer.durata_mesi > 0 && (
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

      {/* Costi fissi mensili */}
      {(offer.quota_fissa_luce_mensile > 0 || offer.quota_fissa_gas_mensile > 0) && (
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
        <p className="text-center text-slate-700 font-medium mb-4">
          Vuoi procedere con questa offerta?
        </p>
        <button onClick={handleContinue} className="btn-primary w-full flex items-center justify-center gap-2 text-lg">
          Clicca qui e ottieni l'offerta
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  )
}

export default Step4OfferDetails
