import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, Zap, Database, Download, LogOut,
  Search, RefreshCw, Euro, CheckCircle, ChevronDown, Edit,
  Plus, Save, X, Phone, Mail, MessageCircle, Calendar,
  Clock, Bell, FileImage, ExternalLink, Table, Cloud,
  ChevronRight, ArrowLeft, Eye
} from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────────────────────
const eur = v => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(v || 0)
const dt = v => v ? new Date(v).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
const dtm = v => v ? new Date(v).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'
const giorniA = v => v ? Math.ceil((new Date(v) - new Date()) / 86400000) : null

const STATO_COLORS = {
  solo_email: 'bg-slate-100 text-slate-600',
  telefono_richiesto: 'bg-yellow-100 text-yellow-700',
  dati_consumi: 'bg-cyan-100 text-cyan-700',
  offerta_vista: 'bg-blue-100 text-blue-700',
  dati_anagrafici: 'bg-indigo-100 text-indigo-700',
  pre_contratto: 'bg-violet-100 text-violet-700',
  inviato_operatore: 'bg-purple-100 text-purple-700',
  confermato: 'bg-green-100 text-green-700',
  disinteressato: 'bg-red-100 text-red-600',
}

const TIPI_ATTIVITA = [
  { id: 'chiamata', label: 'Chiamata', icon: '📞', esiti: ['Risponde', 'Non risponde', 'Occupato', 'Richiama dopo'] },
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬', esiti: ['Risposto', 'Non letto', 'Inviato'] },
  { id: 'email', label: 'Email', icon: '📧', esiti: ['Inviata', 'Risposto'] },
  { id: 'appuntamento', label: 'Appuntamento', icon: '📅', esiti: ['Fissato', 'Completato', 'Annullato'] },
  { id: 'confermato', label: 'Confermato', icon: '✅', esiti: ['Pratica inviata'] },
  { id: 'disinteressato', label: 'Disinteressato', icon: '❌', esiti: ['Non interessato', 'Ha già cambiato', 'Altro'] },
  { id: 'nota', label: 'Nota', icon: '📝', esiti: [] },
]

const Badge = ({ stato }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATO_COLORS[stato] || 'bg-slate-100 text-slate-600'}`}>
    {stato?.replace(/_/g, ' ') || '—'}
  </span>
)

const Loader = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
  </div>
)

const exportCSV = (data, filename) => {
  if (!data?.length) return
  const keys = Object.keys(data[0])
  const csv = [keys.join(','), ...data.map(row =>
    keys.map(k => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(',')
  )].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── SCHEDA CLIENTE ────────────────────────────────────────────────────────────
const SchedaCliente = ({ leadId, onClose }) => {
  const [lead, setLead] = useState(null)
  const [attivita, setAttivita] = useState([])
  const [promemoria, setPromemoria] = useState(null)
  const [bollette, setBollette] = useState([])
  const [calcolo, setCalcolo] = useState(null)
  const [precontratto, setPrecontratto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [noteInterne, setNoteInterne] = useState('')
  const [salvandoNote, setSalvandoNote] = useState(false)
  const [formAtt, setFormAtt] = useState({ tipo: 'chiamata', esito: '', note: '' })
  const [showFormAtt, setShowFormAtt] = useState(false)
  const [formProm, setFormProm] = useState({ data: '', nota: '' })
  const [showFormProm, setShowFormProm] = useState(false)

  const carica = useCallback(async () => {
    setLoading(true)
    try {
      const { data: l } = await supabase.from('leads').select('*').eq('id', leadId).single()
      setLead(l)
      setNoteInterne(l?.note_crm || '')

      const [att, prom, boll, calc, pre] = await Promise.all([
        supabase.from('crm_attivita').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }),
        supabase.from('crm_promemoria').select('*').eq('lead_id', leadId).eq('completato', false).order('data_promemoria').limit(1).maybeSingle(),
        supabase.from('bollette_caricate').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }),
        supabase.from('calcolo_offerta').select('*, offerte(nome_offerta, fornitori(nome))').eq('lead_id', leadId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('pre_contratti').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ])

      setAttivita(att.data || [])
      setPromemoria(prom.data || null)
      setBollette(boll.data || [])
      setCalcolo(calc.data || null)
      setPrecontratto(pre.data || null)
    } catch (err) {
      console.error('Errore scheda:', err)
    } finally {
      setLoading(false)
    }
  }, [leadId])

  useEffect(() => { carica() }, [carica])

  const aggiungiAttivita = async () => {
    if (!formAtt.tipo) return
    await supabase.from('crm_attivita').insert([{ lead_id: leadId, ...formAtt }])
    if (formAtt.tipo === 'confermato') await supabase.from('leads').update({ stato: 'confermato' }).eq('id', leadId)
    if (formAtt.tipo === 'disinteressato') await supabase.from('leads').update({ stato: 'disinteressato' }).eq('id', leadId)
    setFormAtt({ tipo: 'chiamata', esito: '', note: '' })
    setShowFormAtt(false)
    carica()
  }

  const salvaPromemoria = async () => {
    if (!formProm.data) return
    await supabase.from('crm_promemoria').delete().eq('lead_id', leadId).eq('completato', false)
    await supabase.from('crm_promemoria').insert([{ lead_id: leadId, ...formProm }])
    setFormProm({ data: '', nota: '' })
    setShowFormProm(false)
    carica()
  }

  const completaPromemoria = async () => {
    if (!promemoria) return
    await supabase.from('crm_promemoria').update({ completato: true }).eq('id', promemoria.id)
    setPromemoria(null)
  }

  const salvaNote = async () => {
    setSalvandoNote(true)
    await supabase.from('leads').update({ note_crm: noteInterne }).eq('id', leadId)
    setSalvandoNote(false)
  }

  const tipoAtt = tipoId => TIPI_ATTIVITA.find(t => t.id === tipoId)
  const giorniScadenza = precontratto?.data_scadenza ? giorniA(precontratto.data_scadenza) : null

  if (loading) return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-xl bg-white shadow-2xl flex items-center justify-center"><Loader /></div>
    </div>
  )

  if (!lead) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-w-xl bg-white shadow-2xl overflow-y-auto flex flex-col"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div>
              <h2 className="font-bold text-slate-900 text-base leading-none">
                {precontratto ? `${precontratto.nome} ${precontratto.cognome}` : lead.email}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{dtm(lead.created_at)}</p>
            </div>
          </div>
          <Badge stato={lead.stato} />
        </div>

        <div className="flex-1 p-5 space-y-5">

          {/* CONTATTI */}
          <section className="bg-slate-50 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Contatti</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-700">{lead.email}</span>
                </div>
                <button onClick={() => window.open(`mailto:${lead.email}`, '_self')} className="text-xs text-blue-600 font-medium hover:underline">Scrivi</button>
              </div>
              {lead.telefono && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">{lead.telefono}</span>
                  </div>
                  <div className="flex gap-3">
                    <a href={`tel:${lead.telefono}`} className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Chiama
                    </a>
                    <a href={`https://wa.me/${lead.telefono?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                      className="text-xs text-green-600 font-medium hover:underline flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </a>
                  </div>
                </div>
              )}
              <div className="flex gap-4 pt-1 text-xs text-slate-500">
                {lead.tipo_cliente && <span>Tipo: <strong>{lead.tipo_cliente}</strong></span>}
                {lead.tipo_cliente && <span>Tipo: <strong>{lead.tipo_cliente}</strong></span>}
              </div>
            </div>
          </section>

          {/* OFFERTA */}
          {calcolo && (
            <section className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">Offerta proposta</h3>
              <div className="font-semibold text-slate-900 mb-1">{calcolo.offerte?.nome_offerta || '—'}</div>
              <div className="text-sm text-slate-600 mb-3">Fornitore: <strong>{calcolo.offerte?.fornitori?.nome || '—'}</strong></div>
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-green-600 font-black text-xl">{eur(calcolo.risparmio_annuo)}</div>
                  <div className="text-xs text-slate-500">risparmio/anno</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-600 font-black text-xl">{eur(calcolo.tua_commissione)}</div>
                  <div className="text-xs text-slate-500">tua commissione</div>
                </div>
              </div>
            </section>
          )}

          {/* DATI ANAGRAFICI E FORNITURA */}
          {precontratto ? (
            <section className="border border-slate-100 rounded-xl p-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Dati anagrafici</h3>
              <div className="space-y-2">
                {/* Nome e cognome */}
                {(precontratto.nome || precontratto.cognome) && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-24 flex-shrink-0">Intestatario</span>
                    <span className="text-sm font-semibold text-slate-900">{precontratto.nome} {precontratto.cognome}</span>
                  </div>
                )}
                {precontratto.codice_fiscale && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-24 flex-shrink-0">Cod. Fiscale</span>
                    <span className="font-mono text-xs text-slate-700 bg-slate-50 px-2 py-0.5 rounded">{precontratto.codice_fiscale}</span>
                  </div>
                )}
                {precontratto.data_nascita && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-24 flex-shrink-0">Nato il</span>
                    <span className="text-sm text-slate-700">{dt(precontratto.data_nascita)}{precontratto.luogo_nascita ? ` a ${precontratto.luogo_nascita}` : ''}</span>
                  </div>
                )}
                {precontratto.indirizzo_fornitura && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-slate-400 w-24 flex-shrink-0 mt-0.5">Indirizzo</span>
                    <span className="text-sm text-slate-700">{precontratto.indirizzo_fornitura}, {precontratto.cap} {precontratto.citta} ({precontratto.provincia})</span>
                  </div>
                )}

                {/* Dati fornitura */}
                {(precontratto.codice_pod || precontratto.codice_pdr || precontratto.fornitore_attuale || precontratto.tipo_contratto_attuale) && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fornitura</p>
                    {precontratto.fornitore_attuale && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 w-24 flex-shrink-0">Fornitore att.</span>
                        <span className="text-sm text-slate-700">{precontratto.fornitore_attuale}</span>
                      </div>
                    )}
                    {precontratto.tipo_contratto_attuale && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 w-24 flex-shrink-0">Contratto att.</span>
                        <span className="text-sm text-slate-700">{precontratto.tipo_contratto_attuale}</span>
                      </div>
                    )}
                    {precontratto.codice_pod && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 w-24 flex-shrink-0">POD</span>
                        <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{precontratto.codice_pod}</span>
                      </div>
                    )}
                    {precontratto.codice_pdr && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 w-24 flex-shrink-0">PDR</span>
                        <span className="font-mono text-xs text-orange-700 bg-orange-50 px-2 py-0.5 rounded">{precontratto.codice_pdr}</span>
                      </div>
                    )}
                    {precontratto.note_cliente && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-slate-400 w-24 flex-shrink-0 mt-0.5">Note cliente</span>
                        <span className="text-xs text-slate-600 italic">{precontratto.note_cliente}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Scadenza contratto */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Scadenza contratto:</span>
                  {precontratto.data_scadenza
                    ? <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${giorniScadenza <= 30 ? 'bg-red-100 text-red-700' : giorniScadenza <= 90 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {dt(precontratto.data_scadenza)} · {giorniScadenza}gg
                      </span>
                    : <button onClick={() => {
                        const d = prompt('Data scadenza (YYYY-MM-DD):')
                        if (d) supabase.from('pre_contratti').update({ data_scadenza: d }).eq('id', precontratto.id).then(carica)
                      }} className="text-xs text-blue-600 hover:underline">+ Aggiungi scadenza</button>
                  }
                </div>
              </div>
            </section>
          ) : (
            <section className="border border-dashed border-slate-200 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400">Nessun dato anagrafico ancora compilato</p>
            </section>
          )}

          {/* BOLLETTE */}
          {bollette.length > 0 && (
            <section className="border border-slate-100 rounded-xl p-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Documenti ({bollette.length})</h3>
              <div className="space-y-2">
                {bollette.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileImage className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="text-xs font-medium text-slate-700">{b.file_name || 'Documento'}</div>
                        <div className="text-[10px] text-slate-400">{dtm(b.uploaded_at)}</div>
                      </div>
                    </div>
                    {b.file_url && (
                      <a href={b.file_url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline">
                        <ExternalLink className="w-3 h-3" /> Apri
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* PROMEMORIA */}
          <section className="border border-slate-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prossimo contatto</h3>
              <button onClick={() => setShowFormProm(!showFormProm)} className="text-xs text-blue-600 font-medium hover:underline">
                {promemoria ? 'Modifica' : '+ Aggiungi'}
              </button>
            </div>
            {promemoria && !showFormProm && (
              <div className={`flex items-start justify-between p-3 rounded-lg ${giorniA(promemoria.data_promemoria) <= 0 ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
                <div>
                  <div className={`text-sm font-bold ${giorniA(promemoria.data_promemoria) <= 0 ? 'text-red-700' : 'text-amber-700'}`}>
                    📅 {dt(promemoria.data_promemoria)}
                    {giorniA(promemoria.data_promemoria) <= 0 && <span className="ml-2">⚠️ Scaduto</span>}
                  </div>
                  {promemoria.nota && <div className="text-xs text-slate-600 mt-1">{promemoria.nota}</div>}
                </div>
                <button onClick={completaPromemoria} className="text-xs text-green-600 font-medium hover:underline ml-3">✓ Fatto</button>
              </div>
            )}
            {!promemoria && !showFormProm && <p className="text-xs text-slate-400">Nessun promemoria</p>}
            {showFormProm && (
              <div className="space-y-3 mt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Data ricontatto</label>
                  <input type="date" value={formProm.data} onChange={e => setFormProm(p => ({ ...p, data: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Note</label>
                  <input type="text" value={formProm.nota} onChange={e => setFormProm(p => ({ ...p, nota: e.target.value }))}
                    placeholder="es. Richiamare la mattina…"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex gap-2">
                  <button onClick={salvaPromemoria} className="flex-1 bg-blue-600 text-white text-sm font-bold py-2 rounded-lg">Salva</button>
                  <button onClick={() => setShowFormProm(false)} className="px-4 bg-slate-100 text-slate-700 text-sm font-bold py-2 rounded-lg">Annulla</button>
                </div>
              </div>
            )}
          </section>

          {/* LOG ATTIVITÀ */}
          <section className="border border-slate-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attività ({attivita.length})</h3>
              <button onClick={() => setShowFormAtt(!showFormAtt)} className="text-xs text-blue-600 font-medium hover:underline">
                {showFormAtt ? 'Annulla' : '+ Aggiungi'}
              </button>
            </div>
            {showFormAtt && (
              <div className="mb-4 p-3 bg-slate-50 rounded-xl space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {TIPI_ATTIVITA.map(t => (
                      <button key={t.id} onClick={() => setFormAtt(p => ({ ...p, tipo: t.id, esito: '' }))}
                        className={`py-2 px-1 rounded-lg text-xs font-semibold border transition-all ${formAtt.tipo === t.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                {TIPI_ATTIVITA.find(t => t.id === formAtt.tipo)?.esiti?.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Esito</label>
                    <select value={formAtt.esito} onChange={e => setFormAtt(p => ({ ...p, esito: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Seleziona…</option>
                      {TIPI_ATTIVITA.find(t => t.id === formAtt.tipo).esiti.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Note</label>
                  <textarea value={formAtt.note} onChange={e => setFormAtt(p => ({ ...p, note: e.target.value }))}
                    placeholder="Descrivi brevemente…" rows={2}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
                <button onClick={aggiungiAttivita} className="w-full bg-blue-600 text-white text-sm font-bold py-2.5 rounded-lg">Salva attività</button>
              </div>
            )}
            {attivita.length === 0
              ? <p className="text-xs text-slate-400">Nessuna attività registrata</p>
              : (
                <div className="space-y-2">
                  {attivita.map(a => {
                    const tipo = TIPI_ATTIVITA.find(t => t.id === a.tipo)
                    return (
                      <div key={a.id} className="flex gap-3 py-2 border-b border-slate-50 last:border-0">
                        <div className="text-base leading-none mt-0.5 flex-shrink-0">{tipo?.icon || '📌'}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-slate-700">{tipo?.label || a.tipo}</span>
                            {a.esito && <span className="text-xs text-slate-500">· {a.esito}</span>}
                            <span className="text-[10px] text-slate-400 ml-auto">{dtm(a.created_at)}</span>
                          </div>
                          {a.note && <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{a.note}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
          </section>

          {/* NOTE INTERNE */}
          <section className="border border-slate-100 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Note interne</h3>
            <textarea value={noteInterne} onChange={e => setNoteInterne(e.target.value)}
              placeholder="Annotazioni private su questo cliente…" rows={4}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-700" />
            <button onClick={salvaNote} disabled={salvandoNote}
              className="mt-2 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
              <Save className="w-3 h-3" />
              {salvandoNote ? 'Salvataggio…' : 'Salva note'}
            </button>
          </section>

        </div>
      </motion.div>
    </div>
  )
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
const SezioneDashboard = ({ onApriScheda }) => {
  const [stats, setStats] = useState(null)
  const [agenda, setAgenda] = useState([])
  const [scadenze, setScadenze] = useState([])
  const [leadsOggi, setLeadsOggi] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const oggi = new Date().toISOString().slice(0, 10)
        const tra90 = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)

        const { data: leads } = await supabase.from('leads').select('id, stato, email, telefono, created_at')
        const { data: att } = await supabase.from('attivazioni').select('commissione_dovuta, stato')
        const { data: prom } = await supabase.from('crm_promemoria')
          .select('*, leads(id, email, telefono)')
          .eq('completato', false)
          .lte('data_promemoria', oggi)
          .order('data_promemoria')
        const { data: scad } = await supabase.from('pre_contratti')
          .select('*, leads(id, email, telefono)')
          .not('data_scadenza', 'is', null)
          .lte('data_scadenza', tra90)
          .gte('data_scadenza', oggi)
          .order('data_scadenza')

        const oggiLeads = (leads || []).filter(x => x.created_at?.slice(0, 10) === oggi)
        setLeadsOggi(oggiLeads)
        setAgenda(prom || [])
        setScadenze(scad || [])
        setStats({
          totLeads: (leads || []).length,
          oggiLeads: oggiLeads.length,
          inviati: (leads || []).filter(x => x.stato === 'inviato_operatore').length,
          confermati: (att || []).filter(x => x.stato === 'confermata').length,
          commissTotali: (att || []).reduce((s, x) => s + (x.commissione_dovuta || 0), 0),
        })
      } catch (err) {
        console.error('Errore dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <Loader />

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900 mb-0.5">Buongiorno 👋</h2>
        <p className="text-sm text-slate-500">{new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Lead totali', value: stats?.totLeads, sub: `+${stats?.oggiLeads} oggi`, color: 'bg-blue-100 text-blue-600', icon: Users },
          { label: 'Inviate', value: stats?.inviati, color: 'bg-purple-100 text-purple-600', icon: Calendar },
          { label: 'Confermate', value: stats?.confermati, color: 'bg-green-100 text-green-600', icon: CheckCircle },
          { label: 'Commissioni', value: eur(stats?.commissTotali), color: 'bg-amber-100 text-amber-600', icon: Euro },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xl font-black text-slate-900 leading-none mb-1">{s.value}</p>
              <p className="text-xs font-medium text-slate-600">{s.label}</p>
              {s.sub && <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>}
            </div>
          )
        })}
      </div>

      {/* Da contattare oggi */}
      {agenda.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4" /> Da contattare oggi ({agenda.length})
          </h3>
          <div className="space-y-2">
            {agenda.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{p.leads?.email}</div>
                  <div className="text-xs text-slate-500">{p.nota || '—'} · {dt(p.data_promemoria)}</div>
                </div>
                <div className="flex gap-2">
                  {p.leads?.telefono && (
                    <a href={`tel:${p.leads.telefono}`} className="p-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button onClick={() => onApriScheda(p.leads?.id)}
                    className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scadenze prossimi 90gg */}
      {scadenze.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" /> Contratti in scadenza — 90 giorni
          </h3>
          <div className="space-y-2">
            {scadenze.map(s => {
              const gg = giorniA(s.data_scadenza)
              return (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{s.nome} {s.cognome}</div>
                    <div className="text-xs text-slate-500">{s.leads?.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${gg <= 30 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {dt(s.data_scadenza)} · {gg}gg
                    </span>
                    <button onClick={() => onApriScheda(s.leads?.id)}
                      className="p-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Lead oggi */}
      {leadsOggi.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-green-600" /> Nuovi lead oggi ({leadsOggi.length})
          </h3>
          <div className="space-y-2">
            {leadsOggi.map(l => (
              <div key={l.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <div className="text-sm text-slate-700">{l.email}</div>
                  {l.telefono && <div className="text-xs text-slate-400">{l.telefono}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge stato={l.stato} />
                  <button onClick={() => onApriScheda(l.id)}
                    className="p-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── CLIENTI ───────────────────────────────────────────────────────────────────
const SezioneClienti = ({ onApriScheda }) => {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroStato, setFiltroStato] = useState('')
  const [pagina, setPagina] = useState(0)
  const PER_PAG = 20

  const carica = useCallback(async () => {
    setLoading(true)
    try {
      // Query leads SENZA join per evitare errori 400
      let q = supabase.from('leads')
        .select('id, codice_univoco, stato, email, telefono, tipo_cliente, created_at')
        .order('created_at', { ascending: false })

      if (filtroStato) q = q.eq('stato', filtroStato)
      if (search) q = q.or(`email.ilike.%${search}%,telefono.ilike.%${search}%,codice_univoco.ilike.%${search}%`)
      q = q.range(pagina * PER_PAG, (pagina + 1) * PER_PAG - 1)

      const { data: leadsData, error } = await q
      if (error) { console.error('Errore leads:', error); setLoading(false); return }

      const ids = (leadsData || []).map(l => l.id)
      let promemoria = []
      let calcoli = []

      if (ids.length > 0) {
        const { data: promData } = await supabase
          .from('crm_promemoria')
          .select('lead_id, data_promemoria, completato')
          .in('lead_id', ids)
          .eq('completato', false)
        promemoria = promData || []

        const { data: calcData } = await supabase
          .from('calcolo_offerta')
          .select('lead_id, tua_commissione')
          .in('lead_id', ids)
        calcoli = calcData || []
      }

      setLeads((leadsData || []).map(l => ({
        ...l,
        crm_promemoria: promemoria.filter(p => p.lead_id === l.id),
        calcolo: calcoli.find(c => c.lead_id === l.id) || null,
      })))
    } catch (err) {
      console.error('Errore clienti:', err)
    } finally {
      setLoading(false)
    }
  }, [search, filtroStato, pagina])

  useEffect(() => { carica() }, [carica])

  const prossimoProm = lead => {
    const proms = (lead.crm_promemoria || []).filter(p => !p.completato)
    if (!proms.length) return null
    return proms.sort((a, b) => new Date(a.data_promemoria) - new Date(b.data_promemoria))[0]
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-slate-900">Clienti</h2>
        <p className="text-sm text-slate-500">Clicca su un cliente per aprire la scheda CRM</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPagina(0) }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Cerca email, telefono, codice…" />
        </div>
        <select value={filtroStato} onChange={e => { setFiltroStato(e.target.value); setPagina(0) }}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">Tutti gli stati</option>
          {Object.keys(STATO_COLORS).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <button onClick={carica} className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
          <RefreshCw className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      <div className="space-y-2">
        {loading ? <Loader /> : leads.length === 0
          ? <div className="text-center py-12 text-slate-400 text-sm">Nessun cliente trovato</div>
          : leads.map(l => {
            const prom = prossimoProm(l)
            const promScaduto = prom && new Date(prom.data_promemoria) <= new Date()
            return (
              <motion.div key={l.id} whileHover={{ x: 2 }}
                onClick={() => onApriScheda(l.id)}
                className="bg-white border border-slate-100 rounded-xl p-4 cursor-pointer hover:border-blue-200 hover:shadow-sm transition-all flex items-center gap-4">
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-blue-700">{l.email?.[0]?.toUpperCase() || '?'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900 truncate">{l.email}</span>
                    <Badge stato={l.stato} />
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 flex-wrap">
                    {l.telefono && <span>{l.telefono}</span>}
                    {l.tipo_cliente && <span className="text-blue-600 font-medium">{l.tipo_cliente}</span>}
                    {prom && (
                      <span className={`font-medium ${promScaduto ? 'text-red-600' : 'text-amber-600'}`}>
                        {promScaduto ? '⚠️' : '📅'} {dt(prom.data_promemoria)}
                      </span>
                    )}
                  </div>
                </div>
                {l.calcolo?.tua_commissione > 0 && (
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-blue-600">{eur(l.calcolo.tua_commissione)}</div>
                    <div className="text-[10px] text-slate-400">commissione</div>
                  </div>
                )}
                <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
              </motion.div>
            )
          })}
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-slate-500">Pagina {pagina + 1}</span>
        <div className="flex gap-2">
          <button disabled={pagina === 0} onClick={() => setPagina(p => p - 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs disabled:opacity-40 hover:bg-slate-50">← Prec</button>
          <button disabled={leads.length < PER_PAG} onClick={() => setPagina(p => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs disabled:opacity-40 hover:bg-slate-50">Succ →</button>
        </div>
      </div>
    </div>
  )
}

// ── OFFERTE ───────────────────────────────────────────────────────────────────
const SezioneOfferte = () => {
  const [offerte, setOfferte] = useState([])
  const [fornitori, setFornitori] = useState([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({})
  const [nuova, setNuova] = useState(false)

  useEffect(() => {
    const carica = async () => {
      const [o, f] = await Promise.all([
        supabase.from('offerte').select('*, fornitori(nome)').order('priorita_visualizzazione', { ascending: false }),
        supabase.from('fornitori').select('id, nome').eq('attivo', true)
      ])
      setOfferte(o.data || [])
      setFornitori(f.data || [])
      setLoading(false)
    }
    carica()
  }, [])

  const salva = async () => {
    if (nuova) {
      const { data } = await supabase.from('offerte').insert([form]).select()
      if (data) setOfferte(p => [data[0], ...p])
    } else {
      await supabase.from('offerte').update(form).eq('id', editId)
      setOfferte(p => p.map(x => x.id === editId ? { ...x, ...form } : x))
    }
    setEditId(null); setNuova(false); setForm({})
  }

  const toggleVisibile = async (id, visibile) => {
    await supabase.from('offerte').update({ visibile: !visibile }).eq('id', id)
    setOfferte(p => p.map(x => x.id === id ? { ...x, visibile: !visibile } : x))
  }

  const F = ({ k, label, type = 'text' }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <input type={type} value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-black text-slate-900">Offerte</h2><p className="text-sm text-slate-500">Gestisci le offerte energia</p></div>
        <button onClick={() => { setForm({ visibile: true, tipo_fornitura: 'dual' }); setNuova(true); setEditId(null) }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Nuova offerta
        </button>
      </div>

      <AnimatePresence>
        {(editId || nuova) && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-white rounded-2xl border-2 border-blue-200 shadow-lg p-6">
            <h3 className="font-bold text-slate-900 mb-4">{nuova ? '+ Nuova offerta' : 'Modifica offerta'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2"><F k="nome_offerta" label="Nome offerta" /></div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fornitore</label>
                <select value={form.fornitore_id || ''} onChange={e => setForm(f => ({ ...f, fornitore_id: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Seleziona…</option>
                  {fornitori.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo</label>
                <select value={form.tipo_fornitura || 'dual'} onChange={e => setForm(f => ({ ...f, tipo_fornitura: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="luce">Luce</option><option value="gas">Gas</option><option value="dual">Dual</option>
                </select>
              </div>
              <F k="prezzo_kwh" label="€/kWh" type="number" />
              <F k="prezzo_smc" label="€/Smc" type="number" />
              <F k="quota_fissa_luce_mensile" label="Quota fissa luce/mese" type="number" />
              <F k="quota_fissa_gas_mensile" label="Quota fissa gas/mese" type="number" />
              <F k="bonus_attivazione" label="Bonus attivazione €" type="number" />
              <F k="durata_mesi" label="Durata mesi" type="number" />
              <F k="priorita_visualizzazione" label="Priorità (1-100)" type="number" />
              <F k="data_inizio" label="Data inizio" type="date" />
              <F k="data_fine" label="Data fine" type="date" />
              <div className="md:col-span-3"><F k="descrizione_breve" label="Descrizione breve" /></div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Descrizione completa</label>
                <textarea value={form.descrizione_completa || ''} rows={3}
                  onChange={e => setForm(f => ({ ...f, descrizione_completa: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-4">
                {['visibile', 'green_energy', 'digitale'].map(k => (
                  <label key={k} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.checked }))} className="w-4 h-4 rounded" />
                    <span className="text-sm text-slate-700 capitalize">{k.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-5 pt-5 border-t border-slate-100">
              <button onClick={salva} className="flex items-center gap-2 bg-blue-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl"><Save className="w-4 h-4" /> Salva</button>
              <button onClick={() => { setEditId(null); setNuova(false); setForm({}) }} className="flex items-center gap-2 bg-slate-100 text-slate-700 text-sm font-bold px-5 py-2.5 rounded-xl"><X className="w-4 h-4" /> Annulla</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {loading ? <Loader /> : offerte.map(o => (
          <div key={o.id} className={`bg-white rounded-xl border shadow-sm p-4 ${!o.visibile ? 'opacity-60 border-slate-200' : 'border-slate-100'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold text-slate-900">{o.nome_offerta}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${o.tipo_fornitura === 'dual' ? 'bg-blue-100 text-blue-700' : o.tipo_fornitura === 'luce' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'}`}>{o.tipo_fornitura}</span>
                  {!o.visibile && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Nascosta</span>}
                </div>
                <p className="text-xs text-slate-500 mb-1">{o.fornitori?.nome}</p>
                <div className="flex gap-3 text-xs text-slate-600 flex-wrap">
                  {o.prezzo_kwh > 0 && <span>⚡ {Number(o.prezzo_kwh).toFixed(4)} €/kWh</span>}
                  {o.prezzo_smc > 0 && <span>🔥 {Number(o.prezzo_smc).toFixed(4)} €/Smc</span>}
                  {o.bonus_attivazione > 0 && <span>🎁 Bonus {eur(o.bonus_attivazione)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleVisibile(o.id, o.visibile)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${o.visibile ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {o.visibile ? 'Attiva' : 'Inattiva'}
                </button>
                <button onClick={() => { setEditId(o.id); setForm(o); setNuova(false) }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── DATABASE ──────────────────────────────────────────────────────────────────
const SezioneDatabase = () => {
  const [loadingCSV, setLoadingCSV] = useState({})
  const [loadingBackup, setLoadingBackup] = useState(false)
  const [loadingSchema, setLoadingSchema] = useState(false)
  const [loadingMigrazione, setLoadingMigrazione] = useState(false)
  const [sheetsUrl, setSheetsUrl] = useState(localStorage.getItem('sheets_url') || '')
  const [ultimoBackup, setUltimoBackup] = useState(localStorage.getItem('ultimo_backup') || null)
  const [syncStatus, setSyncStatus] = useState({})

  const TABELLE = [
    { id: 'leads', label: 'Lead', desc: 'Tutti i contatti e potenziali clienti' },
    { id: 'pre_contratti', label: 'Pratiche', desc: 'Dati anagrafici e fornitura' },
    { id: 'calcolo_offerta', label: 'Calcoli offerta', desc: 'Risparmi e commissioni calcolate' },
    { id: 'attivazioni', label: 'Attivazioni', desc: 'Contratti confermati' },
    { id: 'consumi_cliente', label: 'Consumi', desc: 'Dati di consumo energetico' },
    { id: 'offerte', label: 'Offerte', desc: 'Offerte energia disponibili' },
    { id: 'fornitori', label: 'Fornitori', desc: 'Anagrafica fornitori' },
    { id: 'commissioni', label: 'Commissioni', desc: 'Struttura commissioni' },
    { id: 'admin_pannello', label: 'Admin', desc: 'Utenti pannello admin' },
    { id: 'bollette_caricate', label: 'Bollette', desc: 'Documenti caricati' },
    { id: 'crm_attivita', label: 'Attività CRM', desc: 'Log chiamate e note' },
    { id: 'crm_promemoria', label: 'Promemoria', desc: 'Promemoria ricontatto' },
  ]

  // ── Export CSV singola tabella ─────────────────────────────────────────────
  const scaricaCSV = async (tabella) => {
    setLoadingCSV(p => ({ ...p, [tabella]: true }))
    try {
      const { data } = await supabase.from(tabella).select('*').order('created_at', { ascending: false })
      exportCSV(data || [], tabella)
    } catch (e) {
      console.warn('Errore export', tabella, e)
    }
    setLoadingCSV(p => ({ ...p, [tabella]: false }))
  }

  // ── Backup completo dati (tutti i CSV) ────────────────────────────────────
  const backupDati = async () => {
    setLoadingBackup(true)
    for (const t of TABELLE) await scaricaCSV(t.id)
    const now = new Date().toLocaleString('it-IT')
    localStorage.setItem('ultimo_backup', now)
    setUltimoBackup(now)
    setLoadingBackup(false)
  }

  // ── Scarica schema SQL (struttura database) ───────────────────────────────
  const scaricaSchema = () => {
    setLoadingSchema(true)
    try {
      const schema = generaSchemaSQL()
      const blob = new Blob([schema], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `eutenti_schema_${new Date().toISOString().slice(0, 10)}.sql`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.warn('Errore schema:', e)
    }
    setLoadingSchema(false)
  }

  // ── Genera SQL completo per migrazione ────────────────────────────────────
  const generaSchemaSQL = () => {
    const ts = new Date().toLocaleString('it-IT')
    return `-- ═══════════════════════════════════════════════════════════════
-- eUtenti CRM — Schema Database Completo
-- Generato il: ${ts}
-- ═══════════════════════════════════════════════════════════════
-- ISTRUZIONI MIGRAZIONE:
-- 1. Crea un nuovo progetto Supabase
-- 2. Vai su SQL Editor e incolla tutto questo file
-- 3. Clicca Run
-- 4. Importa i dati CSV uno per uno dalla sezione Database
-- ═══════════════════════════════════════════════════════════════

-- Abilita UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── TABELLA: leads ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  codice_univoco text,
  email text NOT NULL,
  telefono text,
  tipo_cliente text,
  stato text DEFAULT 'solo_email',
  origine text,
  fonte_utm text,
  medium_utm text,
  campagna_utm text,
  dispositivo text,
  ip_address text,
  user_agent text,
  privacy_acconsentito boolean DEFAULT false,
  marketing_acconsentito boolean DEFAULT false,
  data_consenso timestamptz,
  codice_verifica_sms text,
  telefono_verificato boolean DEFAULT false,
  data_primo_contatto timestamptz,
  data_ultimo_contatto timestamptz,
  note_crm text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── TABELLA: fornitori ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fornitori (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  logo_url text,
  sito_web text,
  telefono_assistenza text,
  email_assistenza text,
  attivo boolean DEFAULT true,
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── TABELLA: offerte ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS offerte (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fornitore_id uuid REFERENCES fornitori(id),
  nome_offerta text NOT NULL,
  tipo_fornitura text, -- luce / gas / dual
  prezzo_kwh numeric,
  prezzo_smc numeric,
  quota_fissa_luce_mensile numeric,
  quota_fissa_gas_mensile numeric,
  bonus_attivazione numeric DEFAULT 0,
  durata_mesi integer,
  descrizione_breve text,
  descrizione_completa text,
  visibile boolean DEFAULT true,
  green_energy boolean DEFAULT false,
  digitale boolean DEFAULT false,
  priorita_visualizzazione integer DEFAULT 50,
  data_inizio date,
  data_fine date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── TABELLA: commissioni ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS commissioni (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  offerta_id uuid REFERENCES offerte(id),
  tipo_cliente text,
  commissione_luce numeric DEFAULT 0,
  commissione_gas numeric DEFAULT 0,
  commissione_dual numeric DEFAULT 0,
  attivo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ── TABELLA: consumi_cliente ──────────────────────────────────
CREATE TABLE IF NOT EXISTS consumi_cliente (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  tipo_fornitura text,
  consumo_annuo_kwh numeric,
  consumo_annuo_smc numeric,
  potenza_impegnata numeric,
  spesa_attuale_annua numeric,
  created_at timestamptz DEFAULT now()
);

-- ── TABELLA: calcolo_offerta ──────────────────────────────────
CREATE TABLE IF NOT EXISTS calcolo_offerta (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  offerta_id uuid REFERENCES offerte(id),
  consumo_kwh numeric,
  consumo_smc numeric,
  costo_attuale_annuo numeric,
  costo_nuovo_annuo numeric,
  risparmio_annuo numeric,
  tua_commissione numeric,
  created_at timestamptz DEFAULT now()
);

-- ── TABELLA: pre_contratti ────────────────────────────────────
CREATE TABLE IF NOT EXISTS pre_contratti (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  offerta_id uuid REFERENCES offerte(id),
  nome text,
  cognome text,
  codice_fiscale text,
  data_nascita date,
  luogo_nascita text,
  indirizzo_fornitura text,
  cap text,
  citta text,
  provincia text,
  codice_pod text,
  codice_pdr text,
  fornitore_attuale text,
  tipo_contratto_attuale text,
  note_cliente text,
  stato text DEFAULT 'bozza',
  data_invio timestamptz,
  data_scadenza date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── TABELLA: attivazioni ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS attivazioni (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES leads(id),
  pre_contratto_id uuid REFERENCES pre_contratti(id),
  offerta_id uuid REFERENCES offerte(id),
  stato text DEFAULT 'in_attesa',
  data_attivazione date,
  commissione_dovuta numeric DEFAULT 0,
  commissione_pagata boolean DEFAULT false,
  data_pagamento_commissione date,
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── TABELLA: bollette_caricate ────────────────────────────────
CREATE TABLE IF NOT EXISTS bollette_caricate (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  file_name text,
  file_url text,
  file_size integer,
  ocr_status text DEFAULT 'pending',
  ocr_data jsonb,
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- ── TABELLA: admin_pannello ───────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_pannello (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  email text NOT NULL,
  nome_utente text,
  ruolo text DEFAULT 'admin',
  attivo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ── TABELLA: crm_attivita ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_attivita (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  esito text,
  note text,
  created_at timestamptz DEFAULT now()
);

-- ── TABELLA: crm_promemoria ───────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_promemoria (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  data_promemoria date NOT NULL,
  nota text,
  completato boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ── INDICI ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_leads_stato ON leads(stato);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calcolo_lead ON calcolo_offerta(lead_id);
CREATE INDEX IF NOT EXISTS idx_precontratti_lead ON pre_contratti(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_attivita_lead ON crm_attivita(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_promemoria_lead ON crm_promemoria(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_promemoria_data ON crm_promemoria(data_promemoria) WHERE completato = false;
CREATE INDEX IF NOT EXISTS idx_precontratti_scadenza ON pre_contratti(data_scadenza) WHERE data_scadenza IS NOT NULL;

-- ── RLS (Row Level Security) ──────────────────────────────────
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE calcolo_offerta ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_contratti ENABLE ROW LEVEL SECURITY;
ALTER TABLE offerte ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornitori ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissioni ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumi_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE attivazioni ENABLE ROW LEVEL SECURITY;
ALTER TABLE bollette_caricate ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_pannello ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_attivita ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_promemoria ENABLE ROW LEVEL SECURITY;

-- Policy pubbliche (comparatore)
CREATE POLICY "Inserimento leads pubblico" ON leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Lettura offerte pubblico" ON offerte FOR SELECT TO anon USING (visibile = true);
CREATE POLICY "Lettura fornitori pubblico" ON fornitori FOR SELECT TO anon USING (attivo = true);
CREATE POLICY "Inserimento consumi pubblico" ON consumi_cliente FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Inserimento calcolo pubblico" ON calcolo_offerta FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Inserimento precontratti pubblico" ON pre_contratti FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Inserimento bollette pubblico" ON bollette_caricate FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Lettura bollette pubblico" ON bollette_caricate FOR SELECT TO anon USING (true);

-- Policy admin (pannello)
CREATE POLICY "Autenticati leggono leads" ON leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticati aggiornano leads" ON leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Autenticati leggono calcolo_offerta" ON calcolo_offerta FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticati gestiscono offerte" ON offerte FOR ALL TO authenticated USING (true);
CREATE POLICY "Autenticati gestiscono fornitori" ON fornitori FOR ALL TO authenticated USING (true);
CREATE POLICY "Autenticati leggono precontratti" ON pre_contratti FOR ALL TO authenticated USING (true);
CREATE POLICY "Autenticati leggono attivazioni" ON attivazioni FOR ALL TO authenticated USING (true);
CREATE POLICY "Autenticati gestiscono crm_attivita" ON crm_attivita FOR ALL TO authenticated USING (true);
CREATE POLICY "Autenticati gestiscono crm_promemoria" ON crm_promemoria FOR ALL TO authenticated USING (true);
CREATE POLICY "Autenticati leggono admin" ON admin_pannello FOR SELECT TO authenticated USING (true);

-- ── VISTE ─────────────────────────────────────────────────────
CREATE OR REPLACE VIEW vw_leads_oggi AS
  SELECT * FROM leads
  WHERE DATE(created_at) = CURRENT_DATE;

CREATE OR REPLACE VIEW vw_offerte_redditizie AS
  SELECT o.*, f.nome as fornitore_nome,
    COUNT(c.id) as num_calcoli,
    AVG(c.tua_commissione) as commissione_media
  FROM offerte o
  LEFT JOIN fornitori f ON f.id = o.fornitore_id
  LEFT JOIN calcolo_offerta c ON c.offerta_id = o.id
  GROUP BY o.id, f.nome;

-- ═══════════════════════════════════════════════════════════════
-- SCHEMA GENERATO CON SUCCESSO
-- Dopo aver eseguito questo SQL, importa i CSV dei dati
-- nell'ordine: fornitori → offerte → leads → pre_contratti
--              → calcolo_offerta → attivazioni → crm_*
-- ═══════════════════════════════════════════════════════════════
`
  }

  // ── Scarica kit migrazione completo (istruzioni) ──────────────────────────
  const scaricaMigrazione = async () => {
    setLoadingMigrazione(true)
    try {
      // 1. Prima scarica lo schema SQL
      await scaricaSchema()
      // 2. Poi scarica tutti i CSV dati
      await backupDati()
    } catch (e) {
      console.warn('Errore migrazione:', e)
    }
    setLoadingMigrazione(false)
  }

  // ── Google Sheets ─────────────────────────────────────────────────────────
  const salvaSheetsUrl = () => {
    localStorage.setItem('sheets_url', sheetsUrl)
    alert('URL salvato!')
  }

  const sincronizzaSheets = (tabella) => {
    if (!sheetsUrl) { alert("Prima inserisci l'URL del Google Sheets"); return }
    setSyncStatus(p => ({ ...p, [tabella || 'tutto']: 'ok' }))
    window.open(sheetsUrl, '_blank')
    setTimeout(() => setSyncStatus(p => ({ ...p, [tabella || 'tutto']: null })), 3000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900 mb-1">Gestione Database</h2>
        <p className="text-sm text-slate-500">Backup dati, struttura e migrazione completa</p>
      </div>

      {/* ── KIT MIGRAZIONE COMPLETO ── */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-2xl p-5 text-white">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-xl">📦</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white text-base">Kit migrazione completo</h3>
            <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
              Scarica tutto il necessario per spostare il progetto su un altro server o Supabase:
              struttura SQL + tutti i dati CSV. Con questi file ricostruisci il database identico in 10 minuti.
            </p>
          </div>
        </div>
        <button onClick={scaricaMigrazione} disabled={loadingMigrazione}
          className="w-full flex items-center justify-center gap-2 bg-white text-slate-900 text-sm font-black py-3 rounded-xl hover:bg-slate-100 disabled:opacity-50 transition-colors">
          {loadingMigrazione
            ? <><span className="w-4 h-4 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" /> Preparazione in corso…</>
            : <><Download className="w-4 h-4" /> Scarica Kit Migrazione Completo</>}
        </button>
        {ultimoBackup && <p className="text-xs text-white/40 text-center mt-2">Ultimo backup: {ultimoBackup}</p>}
      </div>

      {/* ── BACKUP SEPARATI ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Backup dati CSV */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-base">📊</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Solo Dati</h3>
              <p className="text-xs text-slate-500">Tutti i CSV con i dati reali</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            Scarica i dati di ogni tabella in formato CSV. Usa questo per fare backup regolari o per aprire i dati in Excel.
          </p>
          <button onClick={backupDati} disabled={loadingBackup}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl transition-colors">
            {loadingBackup
              ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Scaricando…</>
              : <><Download className="w-3.5 h-3.5" /> Scarica tutti i CSV</>}
          </button>
        </div>

        {/* Schema SQL */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-base">🗄️</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Struttura Database</h3>
              <p className="text-xs text-slate-500">Schema SQL completo</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            Scarica il file SQL per ricreare tutte le tabelle, indici, policy RLS e viste su un nuovo Supabase.
          </p>
          <button onClick={scaricaSchema} disabled={loadingSchema}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl transition-colors">
            {loadingSchema
              ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generando…</>
              : <><Download className="w-3.5 h-3.5" /> Scarica Schema SQL</>}
          </button>
        </div>
      </div>

      {/* ── ISTRUZIONI MIGRAZIONE ── */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
          <span>📋</span> Come migrare su un nuovo Supabase
        </h3>
        <ol className="space-y-2 text-xs text-amber-800">
          <li className="flex gap-2"><span className="font-black text-amber-600 flex-shrink-0">1.</span> Crea un nuovo progetto su <strong>supabase.com</strong></li>
          <li className="flex gap-2"><span className="font-black text-amber-600 flex-shrink-0">2.</span> Vai su <strong>SQL Editor</strong> e incolla il contenuto del file <strong>eutenti_schema.sql</strong> → clicca Run</li>
          <li className="flex gap-2"><span className="font-black text-amber-600 flex-shrink-0">3.</span> Copia le nuove <strong>SUPABASE_URL</strong> e <strong>SUPABASE_ANON_KEY</strong> dalle impostazioni del nuovo progetto</li>
          <li className="flex gap-2"><span className="font-black text-amber-600 flex-shrink-0">4.</span> Su Cloudflare aggiorna le variabili d'ambiente con i nuovi valori e rideploya</li>
          <li className="flex gap-2"><span className="font-black text-amber-600 flex-shrink-0">5.</span> Importa i CSV nell'ordine: <strong>fornitori → offerte → leads → pre_contratti → calcolo_offerta → attivazioni → crm_*</strong></li>
          <li className="flex gap-2"><span className="font-black text-amber-600 flex-shrink-0">6.</span> Ricrea l'utente admin in <strong>Authentication → Users</strong> e reinserisci il record in <strong>admin_pannello</strong></li>
        </ol>
      </div>

      {/* ── GOOGLE SHEETS ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <Table className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Google Sheets</h3>
            <p className="text-xs text-slate-500">Sincronizza con il tuo foglio condiviso</p>
          </div>
        </div>
        <div className="flex gap-2 mb-3">
          <input type="url" value={sheetsUrl} onChange={e => setSheetsUrl(e.target.value)}
            placeholder="URL deployment Apps Script (https://script.google.com/macros/s/...)"
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          <button onClick={salvaSheetsUrl} className="px-4 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition-colors">Salva</button>
        </div>
        <button onClick={() => sincronizzaSheets(null)} disabled={!sheetsUrl}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors">
          {syncStatus['tutto'] === 'ok' ? <><CheckCircle className="w-4 h-4" /> Aperto!</> : <><Cloud className="w-4 h-4" /> Sincronizza tutto</>}
        </button>
      </div>

      {/* ── TABELLE SINGOLE ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-bold text-slate-900 mb-4">Export tabella singola</h3>
        <div className="space-y-1">
          {TABELLE.map(t => (
            <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
              <div>
                <p className="text-sm font-semibold text-slate-800">{t.label}</p>
                <p className="text-xs text-slate-400">{t.desc}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => scaricaCSV(t.id)} disabled={loadingCSV[t.id]}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
                  {loadingCSV[t.id] ? <span className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Download className="w-3 h-3" />}
                  CSV
                </button>
                <button onClick={() => sincronizzaSheets(t.id)} disabled={!sheetsUrl}
                  className="flex items-center gap-1.5 bg-green-100 hover:bg-green-200 disabled:opacity-40 text-green-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
                  <Cloud className="w-3 h-3" /> Sheets
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── PANNELLO PRINCIPALE ───────────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard', label: 'Agenda', icon: LayoutDashboard },
  { id: 'clienti', label: 'Clienti', icon: Users },
  { id: 'offerte', label: 'Offerte', icon: Zap },
  { id: 'database', label: 'Database', icon: Database },
]

const AdminDashboard = ({ admin, onLogout }) => {
  const [sezione, setSezione] = useState('dashboard')
  const [menuMobile, setMenuMobile] = useState(false)
  const [schedaLeadId, setSchedaLeadId] = useState(null)

  const logout = async () => { await supabase.auth.signOut(); onLogout() }

  const SezioneAttiva = {
    dashboard: () => <SezioneDashboard onApriScheda={setSchedaLeadId} />,
    clienti: () => <SezioneClienti onApriScheda={setSchedaLeadId} />,
    offerte: () => <SezioneOfferte />,
    database: () => <SezioneDatabase />,
  }[sezione]

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-slate-100 shadow-sm fixed h-full z-20">
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black text-slate-900">e<span className="text-blue-600">Utenti</span></span>
          </div>
          <p className="text-xs text-slate-400 mt-1">CRM Admin</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(n => {
            const Icon = n.icon
            const active = sezione === n.id
            return (
              <button key={n.id} onClick={() => setSezione(n.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />{n.label}
              </button>
            )
          })}
        </nav>
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
              {admin?.nome_utente?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 leading-none">{admin?.nome_utente}</p>
              <p className="text-[10px] text-slate-400">{admin?.ruolo || 'admin'}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 font-semibold transition-colors">
            <LogOut className="w-4 h-4" /> Esci
          </button>
        </div>
      </aside>

      {/* Header mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-100 z-30 px-4 py-3 flex items-center justify-between">
        <span className="font-black text-slate-900">e<span className="text-blue-600">Utenti</span> <span className="text-slate-400 font-normal text-sm">CRM</span></span>
        <button onClick={() => setMenuMobile(!menuMobile)} className="p-2 rounded-lg hover:bg-slate-100">
          <ChevronDown className={`w-5 h-5 text-slate-600 transition-transform ${menuMobile ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {menuMobile && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="md:hidden fixed top-14 left-0 right-0 bg-white border-b border-slate-100 z-20 px-4 py-3 shadow-lg">
            <div className="grid grid-cols-4 gap-2">
              {NAV.map(n => {
                const Icon = n.icon
                return (
                  <button key={n.id} onClick={() => { setSezione(n.id); setMenuMobile(false) }}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-semibold ${sezione === n.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600'}`}>
                    <Icon className="w-4 h-4" />{n.label}
                  </button>
                )
              })}
            </div>
            <button onClick={logout} className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-red-600 bg-red-50 font-semibold">
              <LogOut className="w-4 h-4" /> Esci
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenuto */}
      <main className="flex-1 md:ml-56 pt-16 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <AnimatePresence mode="wait">
            <motion.div key={sezione} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {SezioneAttiva && <SezioneAttiva />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Scheda cliente */}
      <AnimatePresence>
        {schedaLeadId && <SchedaCliente leadId={schedaLeadId} onClose={() => setSchedaLeadId(null)} />}
      </AnimatePresence>
    </div>
  )
}

export default AdminDashboard
