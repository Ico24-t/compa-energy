import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Loader, CheckCircle, AlertCircle, Mail, Phone, ChevronRight, RefreshCw, User, ArrowLeft, XCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { validateEmail, validatePhone, formatPhone } from '../utils/validation'
import { createLead, saveConsumption, markPreContractAsSent, updateLeadStatus, saveOfferCalculation, getAvailableOffers, createPreContract } from '../services/api'
import { findBestOffer, formatCurrency, annualizzaConsumi } from '../utils/calculations'
import { sendBothEmails } from '../services/emailService'
import { supabase } from '../services/supabase'

const WORKER_URL = import.meta.env.VITE_OCR_WORKER_URL

const FASE = {
  UPLOAD: 'upload',
  ELABORAZIONE: 'elaborazione',
  CONTATTI: 'contatti',
  OFFERTA: 'offerta',
  RINGRAZIAMENTO: 'ringraziamento',
  ERRORE: 'errore',
  NON_LEGGIBILE: 'non_leggibile',
  OFFERTA_BUONA: 'offerta_buona'
}

// Converte file in base64
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result.split(',')[1])
  reader.onerror = reject
  reader.readAsDataURL(file)
})

const BillUpload = () => {
  const navigate = useNavigate()
  const [fase, setFase] = useState(FASE.UPLOAD)
  const [erroreMsg, setErroreMsg] = useState('')
  const [datiEstratti, setDatiEstratti] = useState({})
  const [bestOffer, setBestOffer] = useState(null)
  const [leadId, setLeadId] = useState(null)
  const [leadCode, setLeadCode] = useState(null)
  const [fileOriginale, setFileOriginale] = useState(null)

  // Contatti
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [nomeErr, setNomeErr] = useState('')
  const [cognomeErr, setCognomeErr] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [telErr, setTelErr] = useState('')

  // ── OCR con Claude Vision tramite Worker ─────────────────────────────────
  const onDrop = useCallback(async (files) => {
    if (!files.length) return
    const file = files[0]
    setFileOriginale(file)
    setFase(FASE.ELABORAZIONE)

    try {
      // Converti in base64
      const base64 = await fileToBase64(file)
      const mediaType = file.type || 'image/jpeg'

      // Chiama il Worker Cloudflare
      const risposta = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immagine: base64, media_type: mediaType })
      })

      if (!risposta.ok) {
        throw new Error(`Worker error: ${risposta.status}`)
      }

      const risultato = await risposta.json()

      if (!risultato.success || !risultato.dati) {
        throw new Error('Dati non estratti')
      }

      const dati = risultato.dati

      // Verifica che i dati minimi siano presenti
      // Se manca l'importo totale non possiamo procedere
      if (!dati.importo_totale) {
        setFase(FASE.NON_LEGGIBILE)
        return
      }

      // Annualizza i consumi se abbiamo il periodo
      const mesi = dati.mesi_periodo || 2
      if (dati.consumo_kwh > 0) {
        dati.consumo_annuo_kwh = annualizzaConsumi(dati.consumo_kwh, mesi)
      }
      if (dati.consumo_smc > 0) {
        dati.consumo_annuo_smc = annualizzaConsumi(dati.consumo_smc, mesi)
      }

      setDatiEstratti(dati)

      // Precompila nome/cognome se estratti
      if (dati.intestatario) {
        const parti = dati.intestatario.trim().split(/\s+/)
        if (parti.length >= 2) {
          setCognome(parti[0])
          setNome(parti.slice(1).join(' '))
        }
      }

      setFase(FASE.CONTATTI)

    } catch (err) {
      console.error('Errore OCR:', err)
      setFase(FASE.NON_LEGGIBILE)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 10485760
  })

  // ── Salva file su Supabase Storage ───────────────────────────────────────
  const salvaFileStorage = async (file, lid) => {
    try {
      const ext = file.name.split('.').pop()
      const nomeFile = `${lid}_${Date.now()}.${ext}`
      const { data, error } = await supabase.storage
        .from('bollette')
        .upload(nomeFile, file, { cacheControl: '3600', upsert: false })
      if (error) return null
      await supabase.from('bollette_caricate').insert([{
        lead_id: lid,
        file_name: file.name,
        file_url: data.path,
        file_size: file.size,
        ocr_status: 'completato'
      }])
      return data.path
    } catch { return null }
  }

  // ── Validazione contatti e calcolo offerta ───────────────────────────────
  const handleContatti = async () => {
    let ok = true
    if (!nome.trim()) { setNomeErr('Nome obbligatorio'); ok = false }
    if (!cognome.trim()) { setCognomeErr('Cognome obbligatorio'); ok = false }
    if (!validateEmail(email)) { setEmailErr('Email non valida'); ok = false }
    if (!validatePhone(telefono)) { setTelErr('Numero non valido'); ok = false }
    if (!ok) return

    setFase(FASE.ELABORAZIONE)

    try {
      let ipAddress = null
      try { const r = await fetch('https://api.ipify.org?format=json'); ipAddress = (await r.json()).ip } catch {}

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

      // Salva file originale su Storage — non bloccante
      if (fileOriginale) {
        try { await salvaFileStorage(fileOriginale, lid) }
        catch (e) { console.warn('Storage non disponibile:', e) }
      }

      // Determina consumi annui
      const consumoKwh = datiEstratti.consumo_annuo_kwh || 0
      const consumoSmc = datiEstratti.consumo_annuo_smc || 0
      const importo = parseFloat(datiEstratti.importo_totale) || 0
      const mesi = datiEstratti.mesi_periodo || 2
      const tipoFornitura = datiEstratti.tipo_fornitura || 'luce'

      const consumi = { consumo_annuo_kwh: consumoKwh, consumo_annuo_smc: consumoSmc }

      // Salva consumi
      await saveConsumption({
        lead_id: lid,
        tipo_fornitura: tipoFornitura,
        consumo_annuo_kwh: consumoKwh,
        consumo_annuo_smc: consumoSmc,
        spesa_mensile_attuale: importo / mesi,
        spesa_annua_attuale: (importo / mesi) * 12,
        tipo_tariffa: 'monoraria'
      })

      // Trova migliore offerta
      const offersRes = await getAvailableOffers({ tipo_fornitura: tipoFornitura })
      if (!offersRes.success || !offersRes.data.length) throw new Error('Nessuna offerta disponibile')

      const currentCost = {
        spesa_mensile_attuale: importo / mesi,
        spesa_annua_attuale: (importo / mesi) * 12
      }

      const best = findBestOffer(offersRes.data, consumi, currentCost, 'privato')

      if (!best || best.calculation.risparmio_annuo < 50) {
        await updateLeadStatus(lid, 'disinteressato', { note: 'Offerta già ottima - da bolletta' })
        setFase(FASE.OFFERTA_BUONA)
        return
      }

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
      const importo = parseFloat(datiEstratti.importo_totale) || 0
      const mesi = datiEstratti.mesi_periodo || 2
      


      const emailData = {
        nome, cognome, email,
        telefono: formatPhone(telefono),
        codice_univoco: leadCode,
        tipo_cliente: 'privato',
        tipo_fornitura: datiEstratti.tipo_fornitura || 'luce',
        fornitore_nome: bestOffer.fornitori?.nome || '',
        nome_offerta: bestOffer.nome_offerta || '',
        descrizione_offerta: bestOffer.descrizione_breve || '',
        spesa_mensile_attuale_calc: importo / mesi,
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
        fornitore_attuale: datiEstratti.fornitore || ''
      }

      // Salva dati anagrafici e fornitura in pre_contratti
      await createPreContract({
        lead_id: leadId,
        offerta_id: bestOffer.id,
        nome: nome,
        cognome: cognome,
        indirizzo_fornitura: datiEstratti.indirizzo_fornitura || null,
        cap: datiEstratti.cap || null,
        citta: datiEstratti.citta || null,
        provincia: datiEstratti.provincia || null,
        codice_pod: datiEstratti.codice_pod || null,
        codice_pdr: datiEstratti.codice_pdr || null,
        fornitore_attuale: datiEstratti.fornitore || null,
        stato: 'inviato',
        data_invio: new Date().toISOString()
      })

      await sendBothEmails(emailData)
      await updateLeadStatus(leadId, 'inviato_operatore')
      await markPreContractAsSent(leadId)
      setFase(FASE.RINGRAZIAMENTO)
    } catch (err) {
      console.error('Errore handleConfermaOfferta:', err)
      setFase(FASE.RINGRAZIAMENTO)
    }
  }

  const reset = () => {
    setFase(FASE.UPLOAD)
    setDatiEstratti({})
    setFileOriginale(null)
    setNome(''); setCognome(''); setEmail(''); setTelefono('')
  }

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">

      {(fase === FASE.UPLOAD || fase === FASE.NON_LEGGIBILE || fase === FASE.ERRORE) && (
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
              <p className="text-slate-500">Analizziamo la bolletta e calcoliamo il risparmio in pochi secondi</p>
            </div>
            <div {...getRootProps()}
              className={`card cursor-pointer text-center p-12 border-2 border-dashed transition-all duration-300
                ${isDragActive ? 'border-blue-500 bg-blue-50 scale-105' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/30'}`}>
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
          <motion.div key="elab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="card text-center py-16">
            <Loader className="w-14 h-14 text-blue-600 animate-spin mx-auto mb-5" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Analisi in corso…</h3>
            <p className="text-sm text-slate-500">Stiamo leggendo la tua bolletta</p>
          </motion.div>
        )}

        {/* ── BOLLETTA NON LEGGIBILE ── */}
        {fase === FASE.NON_LEGGIBILE && (
          <motion.div key="nonlegg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="card border-orange-200 bg-orange-50 text-center py-10">
              <XCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Bolletta non leggibile</h2>
              <p className="text-slate-600 mb-2">
                Non siamo riusciti a leggere tutti i dati necessari dalla bolletta.
              </p>
              <p className="text-slate-500 text-sm mb-8">
                Prova con una foto più nitida oppure inserisci i dati manualmente.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={reset}
                  className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                  <RefreshCw className="w-4 h-4" /> Riprova con altra foto
                </button>
                <button onClick={() => navigate('/?percorso=manuale')}
                  className="flex items-center justify-center gap-2 bg-white border-2 border-slate-300 hover:border-blue-400 text-slate-700 font-bold px-6 py-3 rounded-xl transition-colors">
                  Compila manualmente
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── CONTATTI ── */}
        {fase === FASE.CONTATTI && (
          <motion.div key="contatti" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4">

            {/* Dati estratti da Claude */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <h3 className="text-lg font-bold text-slate-900">Dati letti dalla bolletta</h3>
              </div>
              <div className="space-y-1.5 text-sm">
                {datiEstratti.tipo_fornitura && (
                  <Row label="Tipo fornitura" value={datiEstratti.tipo_fornitura.toUpperCase()} />
                )}
                {datiEstratti.importo_totale && (
                  <Row label="Importo totale bolletta" value={`€ ${Number(datiEstratti.importo_totale).toFixed(2)}`} />
                )}
                {datiEstratti.data_inizio && (
                  <Row label="Periodo" value={`${datiEstratti.data_inizio} – ${datiEstratti.data_fine}`} />
                )}
                {datiEstratti.consumo_kwh > 0 && (
                  <Row label="Consumo luce (periodo)" value={`${datiEstratti.consumo_kwh} kWh`} />
                )}
                {datiEstratti.consumo_smc > 0 && (
                  <Row label="Consumo gas (periodo)" value={`${datiEstratti.consumo_smc} Smc`} />
                )}
                {datiEstratti.consumo_annuo_kwh > 0 && (
                  <Row label="→ Annualizzato luce" value={`${datiEstratti.consumo_annuo_kwh} kWh/anno`} green />
                )}
                {datiEstratti.consumo_annuo_smc > 0 && (
                  <Row label="→ Annualizzato gas" value={`${datiEstratti.consumo_annuo_smc} Smc/anno`} green />
                )}
                {datiEstratti.fornitore && (
                  <Row label="Fornitore attuale" value={datiEstratti.fornitore} />
                )}
                {datiEstratti.indirizzo_fornitura && (
                  <Row label="Indirizzo" value={`${datiEstratti.indirizzo_fornitura}, ${datiEstratti.cap || ''} ${datiEstratti.citta || ''}`} />
                )}
                {datiEstratti.codice_pod && <Row label="POD" value={datiEstratti.codice_pod} mono />}
                {datiEstratti.codice_pdr && <Row label="PDR" value={datiEstratti.codice_pdr} mono />}
              </div>
            </div>

            {/* Form contatti */}
            <div className="card">
              <h3 className="text-lg font-bold text-slate-900 mb-1">I tuoi dati</h3>
              <p className="text-sm text-slate-500 mb-5">Dove ti mandiamo l'offerta personalizzata?</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" value={nome} onChange={e => { setNome(e.target.value); setNomeErr('') }}
                        className="input-field pl-9 w-full" placeholder="Mario" />
                    </div>
                    {nomeErr && <p className="mt-1 text-xs text-red-600">{nomeErr}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cognome *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" value={cognome} onChange={e => { setCognome(e.target.value); setCognomeErr('') }}
                        className="input-field pl-9 w-full" placeholder="Rossi" />
                    </div>
                    {cognomeErr && <p className="mt-1 text-xs text-red-600">{cognomeErr}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="email" value={email} onChange={e => { setEmail(e.target.value); setEmailErr('') }}
                      className="input-field pl-9 w-full" placeholder="mario@esempio.it" />
                  </div>
                  {emailErr && <p className="mt-1 text-xs text-red-600">{emailErr}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Telefono *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="tel" value={telefono} onChange={e => { setTelefono(e.target.value); setTelErr('') }}
                      className="input-field pl-9 w-full" placeholder="+39 333 1234567" />
                  </div>
                  {telErr && <p className="mt-1 text-xs text-red-600">{telErr}</p>}
                </div>

                <button onClick={handleContatti}
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                  Calcola il mio risparmio <ChevronRight className="w-5 h-5" />
                </button>
                <p className="text-xs text-slate-400 text-center">
                  Cliccando accetti la nostra <a href="/privacy-policy" className="underline">privacy policy</a>
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
                <p className="text-sm mt-1">
                  -{bestOffer.calculation.risparmio_percentuale.toFixed(1)}% · {formatCurrency(bestOffer.calculation.risparmio_mensile)}/mese
                </p>
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
            </div>

            <div className="card bg-blue-50 border-2 border-blue-200 text-center">
              <p className="text-slate-700 font-medium mb-4">Vuoi procedere con questa offerta?</p>
              <button onClick={handleConfermaOfferta} className="btn-primary w-full flex items-center justify-center gap-2">
                Sì, voglio questa offerta <ChevronRight className="w-5 h-5" />
              </button>
              <button onClick={reset} className="mt-3 text-sm text-slate-500 underline">
                Carica un'altra bolletta
              </button>
            </div>
          </motion.div>
        )}

        {/* ── OFFERTA GIÀ BUONA ── */}
        {fase === FASE.OFFERTA_BUONA && (
          <motion.div key="buona" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }} className="card text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-3">La tua offerta è già ottima! 🎉</h2>
            <p className="text-slate-600 mb-6">
              Al momento non abbiamo offerte più convenienti della tua.<br />
              Ti avviseremo quando ne avremo una migliore.
            </p>
            <button onClick={reset} className="btn-secondary flex items-center gap-2 mx-auto">
              <RefreshCw className="w-4 h-4" /> Prova con un'altra bolletta
            </button>
          </motion.div>
        )}

        {/* ── RINGRAZIAMENTO ── */}
        {fase === FASE.RINGRAZIAMENTO && (
          <motion.div key="grazie" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }} className="card text-center py-8">
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
                <button onClick={reset} className="btn-secondary">Riprova</button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}

const Row = ({ label, value, mono, green }) => (
  <div className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
    <span className="text-slate-500 text-sm">{label}</span>
    <span className={`font-semibold text-sm ${mono ? 'font-mono text-xs' : ''} ${green ? 'text-green-600' : 'text-slate-900'}`}>
      {value}
    </span>
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
