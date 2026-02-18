import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Loader, CheckCircle, AlertCircle, Mail, Phone, ChevronRight, RefreshCw } from 'lucide-react'
import Tesseract from 'tesseract.js'
import { motion, AnimatePresence } from 'framer-motion'
import { validateEmail, validatePhone, formatPhone } from '../utils/validation'
import { createLead, saveConsumption, markPreContractAsSent, updateLeadStatus, saveOfferCalculation } from '../services/api'
import { getAvailableOffers } from '../services/api'
import { findBestOffer, formatCurrency, stimaConsumiDaPersone } from '../utils/calculations'
import { sendBothEmails } from '../services/emailService'

// Fasi del flusso bolletta
const FASE = {
  UPLOAD: 'upload',
  ELABORAZIONE: 'elaborazione',
  CONTATTI: 'contatti',
  OFFERTA: 'offerta',
  RINGRAZIAMENTO: 'ringraziamento',
  ERRORE: 'errore',
  OFFERTA_BUONA: 'offerta_buona'
}

const BillUpload = () => {
  const [fase, setFase] = useState(FASE.UPLOAD)
  const [progress, setProgress] = useState(0)
  const [erroreMsg, setErroreMsg] = useState('')
  const [datiEstratti, setDatiEstratti] = useState({})
  const [bestOffer, setBestOffer] = useState(null)
  const [leadId, setLeadId] = useState(null)
  const [leadCode, setLeadCode] = useState(null)

  // Contatti
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [telErr, setTelErr] = useState('')

  // ─────────────────────────────────────────
  // OCR e estrazione dati
  // ─────────────────────────────────────────
  const onDrop = useCallback(async (files) => {
    if (!files.length) return
    setFase(FASE.ELABORAZIONE)
    setProgress(0)

    try {
      const result = await Tesseract.recognize(files[0], 'ita', {
        logger: (m) => {
          if (m.status === 'recognizing text') setProgress(Math.round(m.progress * 100))
        }
      })
      const testo = result.data.text
      const estratti = estraiDatiBolletta(testo)
      setDatiEstratti(estratti)
      setFase(FASE.CONTATTI)
    } catch {
      setErroreMsg('Errore durante la lettura della bolletta. Riprova con un\'immagine più nitida.')
      setFase(FASE.ERRORE)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 10485760
  })

  const estraiDatiBolletta = (testo) => {
    const estratti = {}

    // Nome e cognome (es: "ROSSI MARIO" o "MARIO ROSSI")
    const nomeMatch = testo.match(/intestatario[:\s]+([A-ZÀÈÌÒÙ]{2,}\s+[A-ZÀÈÌÒÙ]{2,}(?:\s+[A-ZÀÈÌÒÙ]{2,})?)/i)
      || testo.match(/([A-ZÀÈÌÒÙ]{2,}\s+[A-ZÀÈÌÒÙ]{2,})\n.*?(?:via|corso|piazza|viale)/i)
    if (nomeMatch) {
      const parti = nomeMatch[1].trim().split(/\s+/)
      if (parti.length >= 2) {
        estratti.cognome = parti[0]
        estratti.nome = parti.slice(1).join(' ')
      }
    }

    // Indirizzo fornitura
    const indirizzoMatch = testo.match(/(via|corso|piazza|viale|largo|strada)\s+[^\n,]{3,40}[,\s]+\d{1,5}/i)
    if (indirizzoMatch) estratti.indirizzo_fornitura = indirizzoMatch[0].trim()

    // CAP (5 cifre precedute da spazio o virgola)
    const capMatch = testo.match(/[\s,](\d{5})[\s,]/)
    if (capMatch) estratti.cap = capMatch[1]

    // Città e provincia (es: "TARANTO TA" o "74121 TARANTO TA")
    const cittaMatch = testo.match(/\d{5}\s+([A-ZÀÈÌÒÙ][A-ZÀÈÌÒÙa-zàèìòù\s]{2,20})\s+([A-Z]{2})\b/)
    if (cittaMatch) {
      estratti.citta = cittaMatch[1].trim()
      estratti.provincia = cittaMatch[2]
    }

    // Fornitore attuale
    const fornitori = ['enel', 'eni', 'a2a', 'edison', 'illumia', 'sorgenia', 'acea', 'hera', 'iren', 'e.on']
    for (const f of fornitori) {
      if (testo.toLowerCase().includes(f)) {
        estratti.fornitore_attuale = f.toUpperCase()
        break
      }
    }

    // Spesa (importo più grande trovato vicino a €)
    const importiMatch = [...testo.matchAll(/€\s*(\d{1,4}[.,]\d{2})|(\d{1,4}[.,]\d{2})\s*€/g)]
    if (importiMatch.length) {
      const importi = importiMatch.map(m => parseFloat((m[1] || m[2]).replace(',', '.')))
      estratti.spesa_mensile_attuale = Math.max(...importi).toFixed(2)
    }

    // POD
    const podMatch = testo.match(/(IT\d{3}E\d{8,10})/i)
    if (podMatch) estratti.codice_pod = podMatch[1].toUpperCase()

    // PDR
    const pdrMatch = testo.match(/\b(\d{14})\b/)
    if (pdrMatch) estratti.codice_pdr = pdrMatch[1]

    // Potenza
    const potenzaMatch = testo.match(/potenza.*?(\d+[.,]?\d*)\s*kw/i)
    if (potenzaMatch) estratti.potenza_contrattuale = potenzaMatch[1].replace(',', '.')

    // Tipo fornitura (ipotizzato da POD/PDR)
    if (estratti.codice_pod && estratti.codice_pdr) estratti.tipo_fornitura = 'dual'
    else if (estratti.codice_pod) estratti.tipo_fornitura = 'luce'
    else if (estratti.codice_pdr) estratti.tipo_fornitura = 'gas'
    else estratti.tipo_fornitura = 'luce' // default

    return estratti
  }

  // ─────────────────────────────────────────
  // Salvataggio contatti e calcolo offerta
  // ─────────────────────────────────────────
  const handleContatti = async () => {
    let ok = true
    if (!validateEmail(email)) { setEmailErr('Email non valida'); ok = false }
    if (!validatePhone(telefono)) { setTelErr('Numero non valido'); ok = false }
    if (!ok) return

    setFase(FASE.ELABORAZIONE)
    setProgress(0)

    try {
      // IP reale
      let ipAddress = null
      try {
        const r = await fetch('https://api.ipify.org?format=json')
        const d = await r.json()
        ipAddress = d.ip
      } catch {}

      // Crea lead
      const leadRes = await createLead({
        email,
        telefono: formatPhone(telefono),
        tipo_cliente: 'privato',
        origine: 'upload_bolletta',
        privacy_acconsentito: true,
        ip_address: ipAddress
      })
      if (!leadRes.success) throw new Error(leadRes.error)

      const lid = leadRes.data.id
      const lcode = leadRes.data.codice_univoco
      setLeadId(lid)
      setLeadCode(lcode)

      // Stima consumi (default 2 persone se non estratti)
      const stime = stimaConsumiDaPersone(2)
      const consumi = {
        consumo_annuo_kwh: datiEstratti.consumo_annuo_kwh ? parseFloat(datiEstratti.consumo_annuo_kwh) : stime.kwh,
        consumo_annuo_smc: datiEstratti.consumo_annuo_smc ? parseFloat(datiEstratti.consumo_annuo_smc) : stime.smc
      }

      // Salva consumi
      await saveConsumption({
        lead_id: lid,
        tipo_fornitura: datiEstratti.tipo_fornitura || 'luce',
        potenza_contrattuale: datiEstratti.potenza_contrattuale ? parseFloat(datiEstratti.potenza_contrattuale) : null,
        consumo_annuo_kwh: consumi.consumo_annuo_kwh,
        consumo_annuo_smc: consumi.consumo_annuo_smc,
        spesa_mensile_attuale: parseFloat(datiEstratti.spesa_mensile_attuale) || 0,
        spesa_annua_attuale: (parseFloat(datiEstratti.spesa_mensile_attuale) || 0) * 12,
        tipo_tariffa: 'monoraria'
      })

      // Trova migliore offerta
      const offersRes = await getAvailableOffers({ tipo_fornitura: datiEstratti.tipo_fornitura || 'luce' })
      if (!offersRes.success || !offersRes.data.length) throw new Error('Nessuna offerta disponibile')

      const currentCost = {
        spesa_mensile_attuale: parseFloat(datiEstratti.spesa_mensile_attuale) || 0,
        spesa_annua_attuale: (parseFloat(datiEstratti.spesa_mensile_attuale) || 0) * 12
      }

      const best = findBestOffer(offersRes.data, consumi, currentCost, 'privato')

      if (!best || best.calculation.risparmio_annuo < 50) {
        await updateLeadStatus(lid, 'disinteressato', { note: 'Offerta già ottima - da bolletta' })
        setFase(FASE.OFFERTA_BUONA)
        return
      }

      // Salva calcolo
      await saveOfferCalculation({
        lead_id: lid,
        offerta_id: best.id,
        spesa_annua_attuale: best.calculation.spesa_annua_attuale,
        spesa_annua_offerta: best.calculation.spesa_annua_offerta,
        risparmio_annuo: best.calculation.risparmio_annuo,
        risparmio_percentuale: best.calculation.risparmio_percentuale,
        tua_commissione: best.calculation.tua_commissione || 0
      })

      await updateLeadStatus(lid, 'offerta_vista', { telefono: formatPhone(telefono) })

      setBestOffer(best)
      setFase(FASE.OFFERTA)
    } catch (err) {
      console.error(err)
      setErroreMsg('Si è verificato un errore. Riprova.')
      setFase(FASE.ERRORE)
    }
  }

  // ─────────────────────────────────────────
  // Conferma offerta → ringraziamento
  // ─────────────────────────────────────────
  const handleConfermaOfferta = async () => {
    setFase(FASE.ELABORAZIONE)
    try {
      const emailData = {
        nome: datiEstratti.nome || '',
        cognome: datiEstratti.cognome || '',
        email,
        telefono: formatPhone(telefono),
        codice_univoco: leadCode,
        tipo_cliente: 'privato',
        tipo_fornitura: datiEstratti.tipo_fornitura || 'luce',
        num_persone: '2',
        fornitore_nome: bestOffer.fornitori?.nome || '',
        nome_offerta: bestOffer.nome_offerta || '',
        descrizione_offerta: bestOffer.descrizione_breve || '',
        spesa_mensile_attuale_calc: parseFloat(datiEstratti.spesa_mensile_attuale) || 0,
        spesa_annua_attuale: bestOffer.calculation.spesa_annua_attuale,
        spesa_mensile_offerta: bestOffer.calculation.spesa_mensile_offerta,
        spesa_annua_offerta: bestOffer.calculation.spesa_annua_offerta,
        risparmio_annuo: bestOffer.calculation.risparmio_annuo,
        risparmio_mensile: bestOffer.calculation.risparmio_mensile,
        risparmio_percentuale: bestOffer.calculation.risparmio_percentuale,
        tua_commissione: bestOffer.calculation.tua_commissione || 0,
        indirizzo_fornitura: datiEstratti.indirizzo_fornitura || '',
        cap: datiEstratti.cap || '',
        citta: datiEstratti.citta || '',
        provincia: datiEstratti.provincia || '',
        codice_pod: datiEstratti.codice_pod || '',
        codice_pdr: datiEstratti.codice_pdr || '',
        fornitore_attuale: datiEstratti.fornitore_attuale || ''
      }

      await sendBothEmails(emailData)
      await updateLeadStatus(leadId, 'inviato_operatore')
      await markPreContractAsSent(leadId)

      setFase(FASE.RINGRAZIAMENTO)
    } catch (err) {
      console.error(err)
      setFase(FASE.RINGRAZIAMENTO) // vai comunque al ringraziamento
    }
  }

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">

      <AnimatePresence mode="wait">

        {/* ── UPLOAD ── */}
        {fase === FASE.UPLOAD && (
          <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display font-bold text-slate-900 mb-3">Carica la tua bolletta</h1>
              <p className="text-slate-600">Estrarremo automaticamente i dati e calcoleremo il risparmio</p>
            </div>
            <div
              {...getRootProps()}
              className={`card cursor-pointer text-center p-12 border-2 border-dashed transition-all duration-300
                ${isDragActive ? 'border-blue-500 bg-blue-50 scale-105' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/30'}`}
            >
              <input {...getInputProps()} />
              <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {isDragActive ? 'Rilascia qui la bolletta' : 'Trascina qui la tua bolletta'}
              </h3>
              <p className="text-slate-600 mb-4">oppure clicca per selezionare un file</p>
              <p className="text-sm text-slate-500">JPG, PNG, PDF · max 10MB</p>
            </div>
          </motion.div>
        )}

        {/* ── ELABORAZIONE ── */}
        {fase === FASE.ELABORAZIONE && (
          <motion.div key="elab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card text-center">
            <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Elaborazione in corso…</h3>
            {progress > 0 && (
              <>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <motion.div className="bg-blue-600 h-full rounded-full" style={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                </div>
                <p className="text-sm text-slate-500 mt-2">{progress}%</p>
              </>
            )}
          </motion.div>
        )}

        {/* ── CONTATTI ── */}
        {fase === FASE.CONTATTI && (
          <motion.div key="contatti" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="card mb-4">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-7 h-7 text-green-600" />
                <h3 className="text-xl font-bold text-slate-900">Dati estratti dalla bolletta</h3>
              </div>
              <div className="space-y-2 text-sm">
                {datiEstratti.nome && <Row label="Intestatario" value={`${datiEstratti.nome} ${datiEstratti.cognome || ''}`} />}
                {datiEstratti.tipo_fornitura && <Row label="Tipo fornitura" value={datiEstratti.tipo_fornitura.toUpperCase()} />}
                {datiEstratti.spesa_mensile_attuale && <Row label="Importo bolletta" value={`€ ${datiEstratti.spesa_mensile_attuale}`} />}
                {datiEstratti.indirizzo_fornitura && <Row label="Indirizzo" value={datiEstratti.indirizzo_fornitura} />}
                {datiEstratti.cap && <Row label="CAP / Città" value={`${datiEstratti.cap} ${datiEstratti.citta || ''} ${datiEstratti.provincia || ''}`} />}
                {datiEstratti.fornitore_attuale && <Row label="Fornitore attuale" value={datiEstratti.fornitore_attuale} />}
                {datiEstratti.codice_pod && <Row label="Codice POD" value={datiEstratti.codice_pod} mono />}
                {datiEstratti.codice_pdr && <Row label="Codice PDR" value={datiEstratti.codice_pdr} mono />}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Dove ti mandiamo l'offerta?</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="email" value={email} onChange={e => { setEmail(e.target.value); setEmailErr('') }}
                      className="input-field pl-12" placeholder="tuaemail@esempio.it" />
                  </div>
                  {emailErr && <p className="mt-1 text-sm text-red-600">{emailErr}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Telefono *</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="tel" value={telefono} onChange={e => { setTelefono(e.target.value); setTelErr('') }}
                      className="input-field pl-12" placeholder="+39 333 1234567" />
                  </div>
                  {telErr && <p className="mt-1 text-sm text-red-600">{telErr}</p>}
                </div>
                <button onClick={handleContatti} className="btn-primary w-full flex items-center justify-center gap-2">
                  Calcola il mio risparmio <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── OFFERTA ── */}
        {fase === FASE.OFFERTA && bestOffer && (
          <motion.div key="offerta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Banner risparmio */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 mb-6 text-white text-center shadow-xl">
              <h2 className="text-xl font-bold mb-2">🎉 Abbiamo trovato la tua offerta migliore!</h2>
              <div className="bg-white/20 rounded-xl p-4 mt-3">
                <p className="text-sm font-medium mb-1">Risparmio annuo stimato</p>
                <p className="text-4xl font-bold">{formatCurrency(bestOffer.calculation.risparmio_annuo)}</p>
                <p className="text-sm mt-1">(-{bestOffer.calculation.risparmio_percentuale.toFixed(1)}% · {formatCurrency(bestOffer.calculation.risparmio_mensile)}/mese)</p>
              </div>
            </div>

            {/* Dettagli offerta */}
            <div className="card mb-6">
              {bestOffer.fornitori?.logo_url && (
                <img src={bestOffer.fornitori.logo_url} alt={bestOffer.fornitori.nome}
                  className="h-12 object-contain mb-4" onError={e => e.target.style.display = 'none'} />
              )}
              <h3 className="text-xl font-bold text-slate-900 mb-1">{bestOffer.nome_offerta}</h3>
              <p className="text-slate-500 text-sm mb-4">{bestOffer.fornitori?.nome}</p>
              <p className="text-slate-700">{bestOffer.descrizione_breve}</p>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-3 bg-red-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Spesa attuale/anno</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(bestOffer.calculation.spesa_annua_attuale)}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Nuova spesa/anno</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(bestOffer.calculation.spesa_annua_offerta)}</p>
                </div>
              </div>

              {/* Dati estratti da bolletta precompilati */}
              {(datiEstratti.indirizzo_fornitura || datiEstratti.codice_pod) && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Dati dalla bolletta</p>
                  <div className="space-y-1 text-sm">
                    {datiEstratti.indirizzo_fornitura && <p className="text-slate-600">📍 {datiEstratti.indirizzo_fornitura}, {datiEstratti.cap} {datiEstratti.citta}</p>}
                    {datiEstratti.codice_pod && <p className="text-slate-600 font-mono text-xs">POD: {datiEstratti.codice_pod}</p>}
                    {datiEstratti.codice_pdr && <p className="text-slate-600 font-mono text-xs">PDR: {datiEstratti.codice_pdr}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="card bg-blue-50 border-2 border-blue-200 text-center">
              <p className="text-slate-700 font-medium mb-4">Vuoi procedere con questa offerta?</p>
              <button onClick={handleConfermaOfferta} className="btn-primary w-full flex items-center justify-center gap-2">
                Sì, voglio questa offerta <ChevronRight className="w-5 h-5" />
              </button>
              <button onClick={() => setFase(FASE.UPLOAD)} className="mt-3 text-sm text-slate-500 underline">
                Carica un'altra bolletta
              </button>
            </div>
          </motion.div>
        )}

        {/* ── OFFERTA GIÀ BUONA ── */}
        {fase === FASE.OFFERTA_BUONA && (
          <motion.div key="buona" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="card text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-3">La tua offerta è già ottima! 🎉</h2>
            <p className="text-slate-600 mb-6">Al momento non abbiamo offerte più convenienti della tua. Ti avviseremo quando ne avremo una migliore.</p>
            <button onClick={() => { setFase(FASE.UPLOAD); setDatiEstratti({}) }}
              className="btn-secondary flex items-center gap-2 mx-auto">
              <RefreshCw className="w-4 h-4" /> Ricomincia
            </button>
          </motion.div>
        )}

        {/* ── RINGRAZIAMENTO ── */}
        {fase === FASE.RINGRAZIAMENTO && (
          <motion.div key="grazie" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="card text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-display font-bold text-slate-900 mb-3">Richiesta inviata! 🎉</h1>
            {leadCode && (
              <div className="bg-blue-50 rounded-xl p-5 mb-6">
                <p className="text-sm text-slate-600 mb-1">Codice pratica</p>
                <p className="text-3xl font-bold text-blue-600 font-mono">{leadCode}</p>
              </div>
            )}
            <div className="text-left space-y-3 mb-6">
              <StepInfo n="1" titolo="Email di conferma" desc="Riceverai i dettagli dell'offerta via email" />
              <StepInfo n="2" titolo="Chiamata operatore" desc="Ti contatteremo entro 24 ore" />
              <StepInfo n="3" titolo="Attivazione" desc="Se confermi, attiviamo il tuo nuovo contratto" />
            </div>
            <p className="text-sm text-slate-500">
              Per info: <strong>{import.meta.env.VITE_OPERATOR_PHONE}</strong>
            </p>
          </motion.div>
        )}

        {/* ── ERRORE ── */}
        {fase === FASE.ERRORE && (
          <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="card border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-1">Si è verificato un errore</h3>
                <p className="text-red-700 mb-4">{erroreMsg}</p>
                <button onClick={() => { setFase(FASE.UPLOAD); setDatiEstratti({}) }} className="btn-secondary">
                  Riprova
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}

// Componenti helper
const Row = ({ label, value, mono }) => (
  <div className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
    <span className="text-slate-500">{label}</span>
    <span className={`font-semibold text-slate-900 ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
  </div>
)

const StepInfo = ({ n, titolo, desc }) => (
  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
    <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{n}</div>
    <div>
      <p className="font-semibold text-slate-900 text-sm">{titolo}</p>
      <p className="text-xs text-slate-500">{desc}</p>
    </div>
  </div>
)

export default BillUpload
