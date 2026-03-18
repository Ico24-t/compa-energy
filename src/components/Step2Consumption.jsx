import React, { useState } from 'react'
import { Zap, Flame, TrendingUp, Mail, AlertCircle, Info } from 'lucide-react'
import { useForm } from '../contexts/FormContext'
import { motion } from 'framer-motion'
import { validateEmail } from '../utils/validation'
import { createLead, saveConsumption } from '../services/api'
import { risolviConsumi } from '../utils/calculations'

const serviceTypes = [
  { id: 'luce', label: 'Solo Luce', icon: Zap, color: 'text-yellow-500' },
  { id: 'gas', label: 'Solo Gas', icon: Flame, color: 'text-orange-500' },
  { id: 'dual', label: 'Luce + Gas', icon: TrendingUp, color: 'text-blue-500' }
]

const mesiOptions = [
  { value: '1', label: '1 mese' },
  { value: '2', label: '2 mesi' },
  { value: '3', label: '3 mesi' },
  { value: '4', label: '4 mesi' },
  { value: '6', label: '6 mesi' },
  { value: '12', label: '12 mesi' },
]

const Step2Consumption = () => {
  const { formData, updateFormData, nextStep, setLoading, setError, setLeadId, setLeadCode } = useForm()
  const [errors, setErrors] = useState({})

  // Campi consumo periodo
  const [consumoKwh, setConsumoKwh] = useState('')
  const [consumoSmc, setConsumoSmc] = useState('')
  const [mesiPeriodo, setMesiPeriodo] = useState('2')
  const [nonSoIlConsumo, setNonSoIlConsumo] = useState(false)

  // Calcola preview consumi annualizzati in tempo reale
  const previewConsumi = () => {
    const kwh = parseFloat(consumoKwh) || 0
    const smc = parseFloat(consumoSmc) || 0
    const importo = parseFloat(formData.spesa_mensile_attuale) || 0
    const mesi = parseInt(mesiPeriodo) || 2

    return risolviConsumi({
      consumoPeriodo_kwh: kwh,
      consumoPeriodo_smc: smc,
      mesiPeriodo: mesi,
      importoBolletta: nonSoIlConsumo ? importo : 0,
      tipoFornitura: formData.tipo_fornitura || 'dual',
      numPersone: 2
    })
  }

  const preview = formData.tipo_fornitura ? previewConsumi() : null

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!formData.tipo_fornitura) errs.tipo_fornitura = 'Seleziona il tipo di servizio'
    if (!formData.spesa_mensile_attuale) errs.spesa_mensile_attuale = 'Inserisci l\'importo della bolletta'
    if (!validateEmail(formData.email)) errs.email = 'Email non valida'
    if (!formData.privacy_acconsentito) errs.privacy = 'Devi accettare la privacy policy'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true); setError(null)
    try {
      let ipAddress = null
      try { ipAddress = (await (await fetch('https://api.ipify.org?format=json')).json()).ip } catch {}

      const leadRes = await createLead({ ...formData, ip_address: ipAddress, origine: 'form_manuale' })
      if (!leadRes.success) throw new Error(leadRes.error)
      setLeadId(leadRes.data.id)
      setLeadCode(leadRes.data.codice_univoco)

      // Risolvi consumi con la nuova logica
      const kwh = parseFloat(consumoKwh) || 0
      const smc = parseFloat(consumoSmc) || 0
      const importo = parseFloat(formData.spesa_mensile_attuale) || 0
      const mesi = parseInt(mesiPeriodo) || 2

      const consumiRisolti = risolviConsumi({
        consumoPeriodo_kwh: kwh,
        consumoPeriodo_smc: smc,
        mesiPeriodo: mesi,
        importoBolletta: nonSoIlConsumo ? importo : 0,
        tipoFornitura: formData.tipo_fornitura,
        numPersone: 2
      })

      const consumRes = await saveConsumption({
        lead_id: leadRes.data.id,
        tipo_fornitura: formData.tipo_fornitura,
        potenza_contrattuale: formData.potenza_contrattuale ? parseFloat(formData.potenza_contrattuale) : null,
        consumo_annuo_kwh: consumiRisolti.kwh,
        consumo_annuo_smc: consumiRisolti.smc,
        spesa_mensile_attuale: importo,
        spesa_annua_attuale: importo * 12,
        tipo_tariffa: 'monoraria'
      })
      if (!consumRes.success) throw new Error(consumRes.error)

      updateFormData({
        consumo_annuo_kwh: consumiRisolti.kwh.toString(),
        consumo_annuo_smc: consumiRisolti.smc.toString(),
        spesa_annua_attuale: (importo * 12).toString(),
        fonte_consumi: consumiRisolti.fonte
      })
      nextStep()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const mostraKwh = formData.tipo_fornitura === 'luce' || formData.tipo_fornitura === 'dual'
  const mostraSmc = formData.tipo_fornitura === 'gas' || formData.tipo_fornitura === 'dual'

  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-3xl mx-auto px-4">
      <div className="card">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-6">I tuoi consumi</h2>
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Tipo servizio */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Che servizio ti interessa? *</label>
            <div className="grid grid-cols-3 gap-2">
              {serviceTypes.map(s => {
                const Icon = s.icon
                const sel = formData.tipo_fornitura === s.id
                return (
                  <button key={s.id} type="button"
                    onClick={() => { updateFormData({ tipo_fornitura: s.id }); setErrors(p => ({ ...p, tipo_fornitura: null })) }}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${sel ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-200 hover:border-blue-300'}`}>
                    <Icon className={`w-6 h-6 md:w-7 md:h-7 mx-auto mb-1 ${s.color}`} />
                    <span className="text-xs md:text-sm font-semibold block leading-tight">{s.label}</span>
                  </button>
                )
              })}
            </div>
            {errors.tipo_fornitura && <Err msg={errors.tipo_fornitura} />}
          </div>

          {/* Importo bolletta + durata periodo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Importo bolletta * <span className="text-slate-400 font-normal">(IVA incl.)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">€</span>
                <input type="number" step="0.01" min="0" value={formData.spesa_mensile_attuale}
                  onChange={e => { updateFormData({ spesa_mensile_attuale: e.target.value }); setErrors(p => ({ ...p, spesa_mensile_attuale: null })) }}
                  className="input-field pl-10" placeholder="Es. 212.34" />
              </div>
              {errors.spesa_mensile_attuale && <Err msg={errors.spesa_mensile_attuale} />}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Periodo coperto</label>
              <select value={mesiPeriodo} onChange={e => setMesiPeriodo(e.target.value)}
                className="input-field w-full">
                {mesiOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Consumo del periodo */}
          {formData.tipo_fornitura && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-700">
                  Consumo riportato in bolletta
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-500">
                  <input type="checkbox" checked={nonSoIlConsumo}
                    onChange={e => setNonSoIlConsumo(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                  Non lo conosco
                </label>
              </div>

              {!nonSoIlConsumo ? (
                <div className="grid grid-cols-2 gap-3">
                  {mostraKwh && (
                    <div className="relative">
                      <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500" />
                      <input type="number" step="1" min="0" value={consumoKwh}
                        onChange={e => setConsumoKwh(e.target.value)}
                        className="input-field pl-9" placeholder="Es. 450 kWh" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">kWh</span>
                    </div>
                  )}
                  {mostraSmc && (
                    <div className="relative">
                      <Flame className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                      <input type="number" step="1" min="0" value={consumoSmc}
                        onChange={e => setConsumoSmc(e.target.value)}
                        className="input-field pl-9" placeholder="Es. 221 Smc" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Smc</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Stimeremo il consumo dall'importo della bolletta applicando una riduzione del 20% per un calcolo prudenziale.
                </div>
              )}

              {/* Preview consumi annualizzati */}
              {preview && (preview.kwh > 0 || preview.smc > 0) && (
                <div className={`mt-3 rounded-xl p-3 border text-xs ${
                  preview.fonte === 'bolletta_reale' ? 'bg-green-50 border-green-200' :
                  preview.fonte === 'stima_importo' ? 'bg-amber-50 border-amber-200' :
                  'bg-blue-50 border-blue-100'
                }`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {preview.fonte === 'bolletta_reale' && <span className="text-green-700 font-bold">✅ Consumo reale annualizzato:</span>}
                    {preview.fonte === 'stima_importo' && <span className="text-amber-700 font-bold">📊 Stima da importo (–20%):</span>}
                    {preview.fonte === 'stima_persone' && <span className="text-blue-700 font-bold">📊 Stima ARERA:</span>}
                  </div>
                  <div className="flex gap-4">
                    {mostraKwh && preview.kwh > 0 && (
                      <span className="text-slate-700">⚡ <strong>{preview.kwh.toLocaleString('it-IT')} kWh/anno</strong></span>
                    )}
                    {mostraSmc && preview.smc > 0 && (
                      <span className="text-slate-700">🔥 <strong>{preview.smc.toLocaleString('it-IT')} Smc/anno</strong></span>
                    )}
                  </div>
                  {preview.fonte === 'bolletta_reale' && (
                    <p className="text-green-600 mt-1">Calcolato dal consumo reale del periodo ({mesiPeriodo} {parseInt(mesiPeriodo) === 1 ? 'mese' : 'mesi'})</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email *</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="email" value={formData.email}
                onChange={e => { updateFormData({ email: e.target.value }); setErrors(p => ({ ...p, email: null })) }}
                className="input-field pl-12" placeholder="tuaemail@esempio.it" />
            </div>
            {errors.email && <Err msg={errors.email} />}
          </div>

          {/* Privacy */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.privacy_acconsentito}
                onChange={e => { updateFormData({ privacy_acconsentito: e.target.checked }); setErrors(p => ({ ...p, privacy: null })) }}
                className="mt-0.5 w-5 h-5 rounded border-slate-300 text-blue-600 flex-shrink-0" />
              <span className="text-sm text-slate-700">
                Accetto l'<a href="/privacy-policy" target="_blank" className="text-blue-600 underline">informativa sulla privacy</a> *
              </span>
            </label>
            {errors.privacy && <Err msg={errors.privacy} />}
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.marketing_acconsentito}
                onChange={e => updateFormData({ marketing_acconsentito: e.target.checked })}
                className="mt-0.5 w-5 h-5 rounded border-slate-300 text-blue-600 flex-shrink-0" />
              <span className="text-sm text-slate-700">Acconsento a ricevere comunicazioni commerciali</span>
            </label>
          </div>

          <button type="submit" className="btn-primary w-full">Continua e scopri l'offerta</button>
        </form>
      </div>
    </motion.div>
  )
}

const Err = ({ msg }) => (
  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
    <AlertCircle className="w-4 h-4 flex-shrink-0" />{msg}
  </p>
)

export default Step2Consumption
