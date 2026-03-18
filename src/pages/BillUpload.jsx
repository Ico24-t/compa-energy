import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Loader, CheckCircle, AlertCircle, Mail, Phone, ChevronRight, RefreshCw, User, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { validateEmail, validatePhone, formatPhone } from '../utils/validation'
import { createLead, saveConsumption, markPreContractAsSent, updateLeadStatus, saveOfferCalculation } from '../services/api'
import { getAvailableOffers } from '../services/api'
import { findBestOffer, formatCurrency, risolviConsumi, annualizzaConsumi } from '../utils/calculations'
import { sendBothEmails } from '../services/emailService'
import { supabase } from '../services/supabase'

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
  const navigate = useNavigate()
  const [fase, setFase] = useState(FASE.UPLOAD)
  const [progress, setProgress] = useState(0)
  const [erroreMsg, setErroreMsg] = useState('')
  const [datiEstratti, setDatiEstratti] = useState({})
  const [bestOffer, setBestOffer] = useState(null)
  const [leadId, setLeadId] = useState(null)
  const [leadCode, setLeadCode] = useState(null)
  const [fileOriginale, setFileOriginale] = useState(null)

  // Contatti — aggiunto nome e cognome
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [nomeErr, setNomeErr] = useState('')
  const [cognomeErr, setCognomeErr] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [telErr, setTelErr] = useState('')

  // ── OCR e estrazione dati ────────────────────────────────────────────────
  const onDrop = useCallback(async (files) => {
    if (!files.length) return
    setFileOriginale(files[0])
    setFase(FASE.ELABORAZIONE)
    setProgress(0)

    try {
      // Import dinamico Tesseract per non appesantire il bundle
      const Tesseract = (await import('tesseract.js')).default
      const result = await Tesseract.recognize(files[0], 'ita', {
        logger: (m) => {
          if (m.status === 'recognizing text') setProgress(Math.round(m.progress * 100))
        }
      })
      const testo = result.data.text
      const estratti = estraiDatiBolletta(testo)
      setDatiEstratti(estratti)

      // Pre-compila nome/cognome se estratti dall'OCR
      if (estratti.nome) setNome(estratti.nome)
      if (estratti.cognome) setCognome(estratti.cognome)

      setFase(FASE.CONTATTI)
    } catch {
      setErroreMsg("Errore durante la lettura della bolletta. Riprova con un'immagine più nitida.")
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

    // Nome e cognome
    const nomeMatch = testo.match(/intestatario[:\s]+([A-ZÀÈÌÒÙ]{2,}\s+[A-ZÀÈÌÒÙ]{2,}(?:\s+[A-ZÀÈÌÒÙ]{2,})?)/i)
      || testo.match(/([A-ZÀÈÌÒÙ]{2,}\s+[A-ZÀÈÌÒÙ]{2,})\n.*?(?:via|corso|piazza|viale)/i)
    if (nomeMatch) {
      const parti = nomeMatch[1].trim().split(/\s+/)
      if (parti.length >= 2) { estratti.cognome = parti[0]; estratti.nome = parti.slice(1).join(' ') }
    }

    // Indirizzo fornitura
    const indirizzoMatch = testo.match(/(via|corso|piazza|viale|largo|strada)\s+[^\n,]{3,40}[,\s]+\d{1,5}/i)
    if (indirizzoMatch) estratti.indirizzo_fornitura = indirizzoMatch[0].trim()

    // CAP
    const capMatch = testo.match(/[\s,](\d{5})[\s,]/)
    if (capMatch) estratti.cap = capMatch[1]

    // Città e provincia
    const cittaMatch = testo.match(/\d{5}\s+([A-ZÀÈÌÒÙ][A-ZÀÈÌÒÙa-zàèìòù\s]{2,20})\s+([A-Z]{2})\b/)
    if (cittaMatch) { estratti.citta = cittaMatch[1].trim(); estratti.provincia = cittaMatch[2] }

    // Fornitore attuale
    const fornitori = ['enel', 'eni', 'a2a', 'edison', 'illumia', 'sorgenia', 'acea', 'hera', 'iren', 'e.on']
    for (const f of fornitori) {
      if (testo.toLowerCase().includes(f)) { estratti.fornitore_attuale = f.toUpperCase(); break }
    }

    // Importo totale bolletta
    const importiMatch = [...testo.matchAll(/€\s*(\d{1,4}[.,]\d{2})|(\d{1,4}[.,]\d{2})\s*€/g)]
    if (importiMatch.length) {
      const importi = importiMatch.map(m => parseFloat((m[1] || m[2]).replace(',', '.')))
      estratti.spesa_mensile_attuale = Math.max(...importi).toFixed(2)
    }

    // ── CONSUMO REALE DEL PERIODO ─────────────────────────────────────────
    // kWh (luce) — cerca pattern tipo "450 kWh" o "kWh 450"
    const kwhMatch = testo.match(/(\d{1,5}(?:[.,]\d{1,3})?)\s*kWh/i)
      || testo.match(/kWh[:\s]*(\d{1,5}(?:[.,]\d{1,3})?)/i)
    if (kwhMatch) estratti.consumo_periodo_kwh = parseFloat(kwhMatch[1].replace(',', '.'))

    // Smc (gas) — cerca pattern tipo "221 Smc" o "Smc 221" o "221 mc"
    const smcMatch = testo.match(/(\d{1,5}(?:[.,]\d{1,3})?)\s*(?:Smc|smc|mc|Mc)/i)
      || testo.match(/(?:Smc|smc|mc)[:\s]*(\d{1,5}(?:[.,]\d{1,3})?)/i)
    if (smcMatch) estratti.consumo_periodo_smc = parseFloat(smcMatch[1].replace(',', '.'))

    // ── DATE PERIODO (per calcolare i mesi) ───────────────────────────────
    // Cerca pattern tipo "dal 01/12/2025 al 31/01/2026" o "01.12.25 - 31.01.26"
    const periodoMatch = testo.match(
      /(?:dal?|from|periodo)[:\s]*([\d]{1,2}[/.-][\d]{1,2}[/.-][\d]{2,4})[\s\S]{0,20}(?:al?|to|–|-)[\s]*([\d]{1,2}[/.-][\d]{1,2}[/.-][\d]{2,4})/i
    ) || testo.match(
      /([\d]{1,2}[/.-][\d]{1,2}[/.-][\d]{2,4})\s*[-–]\s*([\d]{1,2}[/.-][\d]{1,2}[/.-][\d]{2,4})/
    )

    if (periodoMatch) {
      try {
        const parseData = (s) => {
          const p = s.split(/[/.-]/)
          // Gestisce sia gg/mm/aa che gg/mm/aaaa
          const anno = p[2].length === 2 ? '20' + p[2] : p[2]
          return new Date(parseInt(anno), parseInt(p[1]) - 1, parseInt(p[0]))
        }
        const dataInizio = parseData(periodoMatch[1])
        const dataFine = parseData(periodoMatch[2])
        const diffMesi = Math.round((dataFine - dataInizio) / (1000 * 60 * 60 * 24 * 30.5))
        estratti.mesi_periodo = Math.max(1, Math.min(12, diffMesi || 2))
        estratti.data_inizio_periodo = periodoMatch[1]
        estratti.data_fine_periodo = periodoMatch[2]
      } catch { estratti.mesi_periodo = 2 }
    } else {
      estratti.mesi_periodo = 2 // default bimestrale
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

    // Tipo fornitura
    if (estratti.codice_pod && estratti.codice_pdr) estratti.tipo_fornitura = 'dual'
    else if (estratti.codice_pod) estratti.tipo_fornitura = 'luce'
    else if (estratti.codice_pdr) estratti.tipo_fornitura = 'gas'
    else if (estratti.consumo_periodo_smc > 0 && !estratti.consumo_periodo_kwh) estratti.tipo_fornitura = 'gas'
    else estratti.tipo_fornitura = 'luce'

    // Annualizza i consumi estratti
    if (estratti.consumo_periodo_kwh > 0)
      estratti.consumo_annuo_kwh = annualizzaConsumi(estratti.consumo_periodo_kwh, estratti.mesi_periodo || 2)
    if (estratti.consumo_periodo_smc > 0)
      estratti.consumo_annuo_smc = annualizzaConsumi(estratti.consumo_periodo_smc, estratti.mesi_periodo || 2)

    return estratti
  }

  // ── Salva file su Supabase Storage ──────────────────────────────────────
  const salvaFileStorage = async (file, leadId) => {
    try {
      const ext = file.name.split('.').pop()
      const nomeFile = `${leadId}_${Date.now()}.${ext}`
      const { data, error } = await supabase.storage
        .from('bollette')
        .upload(nomeFile, file, { cacheControl: '3600', upsert: false })

      if (error) { console.warn('Storage upload error:', error); return null }

      // Salva record in bollette_caricate
      await supabase.from('bollette_caricate').insert([{
        lead_id: leadId,
        file_name: file.name,
        file_url: data.path,
        file_size: file.size,
        ocr_status: 'completato'
      }])

      return data.path
    } catch (e) {
      console.warn('Errore salvataggio file:', e)
      return null
    }
  }

  // ── Validazione e invio contatti ─────────────────────────────────────────
  const handleContatti = async () => {
    let ok = true
    if (!nome.trim()) { setNomeErr('Nome obbligatorio'); ok = false }
    if (!cognome.trim()) { setCognomeErr('Cognome obbligatorio'); ok = false }
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

      // Crea lead con flag origine bolletta
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

      // Salva file originale su Storage (non blocca il flusso se fallisce)
      if (fileOriginale) await salvaFileStorage(fileOriginale, lid)

      // Risolvi consumi con logica priorità: reale > stima importo > stima persone
      const consumiRisolti = risolviConsumi({
        consumoPeriodo_kwh: datiEstratti.consumo_periodo_kwh || 0,
        consumoPeriodo_smc: datiEstratti.consumo_periodo_smc || 0,
        mesiPeriodo: datiEstratti.mesi_periodo || 2,
        importoBolletta: parseFloat(datiEstratti.spesa_mensile_attuale) || 0,
        tipoFornitura: datiEstratti.tipo_fornitura || 'luce',
        numPersone: 2
      })
      const consumi = {
        consumo_annuo_kwh: consumiRisolti.kwh,
        consumo_annuo_smc: consumiRisolti.smc
      }

      // Salva consumi (con dati reali del periodo se disponibili)
      const importoBolletta = parseFloat(datiEstratti.spesa_mensile_attuale) || 0
      const mesiPeriodo = datiEstratti.mesi_periodo || 2
      await saveConsumption({
        lead_id: lid,
        tipo_fornitura: datiEstratti.tipo_fornitura || 'luce',
        potenza_contrattuale: datiEstratti.potenza_contrattuale ? parseFloat(datiEstratti.potenza_contrattuale) : null,
        consumo_annuo_kwh: consumi.consumo_annuo_kwh,
        consumo_annuo_smc: consumi.consumo_annuo_smc,
        spesa_mensile_attuale: importoBolletta / mesiPeriodo,
        spesa_annua_attuale: (importoBolletta / mesiPeriodo) * 12,
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

  // ── Conferma offerta ─────────────────────────────────────────────────────
  const handleConfermaOfferta = async () => {
    setFase(FASE.ELABORAZIONE)
    try {
      const emailData = {
        nome: nome || datiEstratti.nome || '',
        cognome: cognome || datiEstratti.cognome || '',
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
      setFase(FASE.RINGRAZIAMENTO)
    }
  }

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">

      {/* Torna indietro */}
      {(fase === FASE.UPLOAD || fase === FASE.ERRORE) && (
        <button onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Torna alla scelta
        </button>
      )}

      <AnimatePresence mode="wait">

        {/* ── UPLOAD ── */}
        {fase === FASE.UPLOAD && (
          <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-3">Carica la tua bolletta</h1>
              <p className="text-slate-500">Estraiamo i dati automaticamente e calcoliamo il tuo risparmio</p>
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
              <p className="text-slate-500 mb-4">oppure clicca per selezionare un file</p>
              <p className="text-sm text-slate-400">JPG, PNG, PDF · max 10MB</p>
            </div>
            <p className="text-center text-xs text-slate-400 mt-4">
              🔒 Il documento viene analizzato in modo sicuro e conservato per verifica
            </p>
          </motion.div>
        )}

        {/* ── ELABORAZIONE ── */}
        {fase === FASE.ELABORAZIONE && (
          <motion.div key="elab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card text-center py-12">
            <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Elaborazione in corso…</h3>
            {progress > 0 && (
              <>
                <div className="w-full max-w-xs mx-auto bg-slate-200 rounded-full h-3 overflow-hidden">
                  <motion.div className="bg-blue-600 h-full rounded-full" style={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                </div>
                <p className="text-sm text-slate-500 mt-2">{progress}%</p>
              </>
            )}
          </motion.div>
        )}

        {/* ── CONTATTI ── */}
        {fase === FASE.CONTATTI && (
          <motion.div key="contatti" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* Dati estratti */}
            {Object.keys(datiEstratti).length > 0 && (
              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <h3 className="text-lg font-bold text-slate-900">Dati estratti dalla bolletta</h3>
                </div>
                <div className="space-y-1.5 text-sm">
                  {datiEstratti.tipo_fornitura && <Row label="Tipo fornitura" value={datiEstratti.tipo_fornitura.toUpperCase()} />}
                  {datiEstratti.spesa_mensile_attuale && <Row label="Importo bolletta" value={`€ ${datiEstratti.spesa_mensile_attuale}`} />}
                  {datiEstratti.data_inizio_periodo && <Row label="Periodo" value={`${datiEstratti.data_inizio_periodo} – ${datiEstratti.data_fine_periodo}`} />}
                  {datiEstratti.consumo_periodo_kwh > 0 && <Row label="Consumo luce (periodo)" value={`${datiEstratti.consumo_periodo_kwh} kWh`} />}
                  {datiEstratti.consumo_periodo_smc > 0 && <Row label="Consumo gas (periodo)" value={`${datiEstratti.consumo_periodo_smc} Smc`} />}
                  {datiEstratti.consumo_annuo_kwh > 0 && <Row label="→ Stimato annuo luce" value={`${datiEstratti.consumo_annuo_kwh} kWh/anno`} />}
                  {datiEstratti.consumo_annuo_smc > 0 && <Row label="→ Stimato annuo gas" value={`${datiEstratti.consumo_annuo_smc} Smc/anno`} />}
                  {datiEstratti.indirizzo_fornitura && <Row label="Indirizzo" value={datiEstratti.indirizzo_fornitura} />}
                  {datiEstratti.cap && <Row label="CAP / Città" value={`${datiEstratti.cap} ${datiEstratti.citta || ''} ${datiEstratti.provincia || ''}`} />}
                  {datiEstratti.fornitore_attuale && <Row label="Fornitore attuale" value={datiEstratti.fornitore_attuale} />}
                  {datiEstratti.codice_pod && <Row label="POD" value={datiEstratti.codice_pod} mono />}
                  {datiEstratti.codice_pdr && <Row label="PDR" value={datiEstratti.codice_pdr} mono />}
                </div>
              </div>
            )}

            {/* Form contatti */}
            <div className="card">
              <h3 className="text-lg font-bold text-slate-900 mb-1">I tuoi dati</h3>
              <p className="text-sm text-slate-500 mb-5">Dove ti mandiamo l'offerta personalizzata?</p>
              <div className="space-y-4">

                {/* Nome e Cognome */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" value={nome} onChange={e => { setNome(e.target.value); setNomeErr('') }}
                        className="input-field pl-10 w-full" placeholder="Mario" />
                    </div>
                    {nomeErr && <p className="mt-1 text-xs text-red-600">{nomeErr}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cognome *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" value={cognome} onChange={e => { setCognome(e.target.value); setCognomeErr('') }}
                        className="input-field pl-10 w-full" placeholder="Rossi" />
                    </div>
                    {cognomeErr && <p className="mt-1 text-xs text-red-600">{cognomeErr}</p>}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="email" value={email} onChange={e => { setEmail(e.target.value); setEmailErr('') }}
                      className="input-field pl-10 w-full" placeholder="mario@esempio.it" />
                  </div>
                  {emailErr && <p className="mt-1 text-xs text-red-600">{emailErr}</p>}
                </div>

                {/* Telefono */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Telefono *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="tel" value={telefono} onChange={e => { setTelefono(e.target.value); setTelErr('') }}
                      className="input-field pl-10 w-full" placeholder="+39 333 1234567" />
                  </div>
                  {telErr && <p className="mt-1 text-xs text-red-600">{telErr}</p>}
                </div>

                <button onClick={handleContatti} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                  Calcola il mio risparmio <ChevronRight className="w-5 h-5" />
                </button>

                <p className="text-xs text-slate-400 text-center">
                  Cliccando accetti la nostra <a href="#" className="underline">privacy policy</a>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── OFFERTA ── */}
        {fase === FASE.OFFERTA && bestOffer && (
          <motion.div key="offerta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 mb-6 text-white text-center shadow-xl">
              <h2 className="text-xl font-bold mb-2">🎉 Abbiamo trovato la tua offerta migliore!</h2>
              <div className="bg-white/20 rounded-xl p-4 mt-3">
                <p className="text-sm font-medium mb-1">Risparmio annuo stimato</p>
                <p className="text-4xl font-bold">{formatCurrency(bestOffer.calculation.risparmio_annuo)}</p>
                <p className="text-sm mt-1">(-{bestOffer.calculation.risparmio_percentuale.toFixed(1)}% · {formatCurrency(bestOffer.calculation.risparmio_mensile)}/mese)</p>
              </div>
            </div>

            <div className="card mb-6">
              {bestOffer.fornitori?.logo_url && (
                <img src={bestOffer.fornitori.logo_url} alt={bestOffer.fornitori.nome}
                  className="h-12 object-contain mb-4" onError={e => e.target.style.display = 'none'} />
              )}
              <h3 className="text-xl font-bold text-slate-900 mb-1">{bestOffer.nome_offerta}</h3>
              <p className="text-slate-500 text-sm mb-3">{bestOffer.fornitori?.nome}</p>
              <p className="text-slate-700 text-sm">{bestOffer.descrizione_breve}</p>

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

            <div className="card bg-blue-50 border-2 border-blue-200 text-center">
              <p className="text-slate-700 font-medium mb-4">Vuoi procedere con questa offerta?</p>
              <button onClick={handleConfermaOfferta} className="btn-primary w-full flex items-center justify-center gap-2">
                Sì, voglio questa offerta <ChevronRight className="w-5 h-5" />
              </button>
              <button onClick={() => { setFase(FASE.UPLOAD); setDatiEstratti({}); setFileOriginale(null) }}
                className="mt-3 text-sm text-slate-500 underline">
                Carica un'altra bolletta
              </button>
            </div>
          </motion.div>
        )}

        {/* ── OFFERTA GIÀ BUONA ── */}
        {fase === FASE.OFFERTA_BUONA && (
          <motion.div key="buona" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="card text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-3">La tua offerta è già ottima! 🎉</h2>
            <p className="text-slate-600 mb-6">Al momento non abbiamo offerte più convenienti della tua. Ti avviseremo quando ne avremo una migliore.</p>
            <button onClick={() => { setFase(FASE.UPLOAD); setDatiEstratti({}); setFileOriginale(null) }}
              className="btn-secondary flex items-center gap-2 mx-auto">
              <RefreshCw className="w-4 h-4" /> Prova con un'altra bolletta
            </button>
          </motion.div>
        )}

        {/* ── RINGRAZIAMENTO ── */}
        {fase === FASE.RINGRAZIAMENTO && (
          <motion.div key="grazie" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="card text-center py-8">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-slate-900 mb-3">Richiesta inviata! 🎉</h1>
            <p className="text-slate-500 mb-6">Ciao {nome}, abbiamo ricevuto la tua richiesta.</p>
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
                <button onClick={() => { setFase(FASE.UPLOAD); setDatiEstratti({}); setFileOriginale(null) }}
                  className="btn-secondary">
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
    <span className="text-slate-500 text-sm">{label}</span>
    <span className={`font-semibold text-slate-900 text-sm ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
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
