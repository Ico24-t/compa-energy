import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, FileText, Zap, Building2,
  Download, LogOut, Search, Filter, RefreshCw,
  TrendingUp, Euro, CheckCircle, Clock, XCircle,
  ChevronDown, Edit, Eye, Plus, Save, X, AlertCircle,
  ArrowUpRight, Calendar, Phone, Mail
} from 'lucide-react'

// ── Helpers ─────────────────────────────────────────────────────────────────
const eur = v => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(v || 0)
const dt = v => v ? new Date(v).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
const dtm = v => v ? new Date(v).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'

const STATO_COLORS = {
  solo_email: 'bg-slate-100 text-slate-600',
  telefono_richiesto: 'bg-yellow-100 text-yellow-700',
  offerta_vista: 'bg-blue-100 text-blue-700',
  dati_anagrafici: 'bg-indigo-100 text-indigo-700',
  inviato_operatore: 'bg-purple-100 text-purple-700',
  confermato: 'bg-green-100 text-green-700',
  disinteressato: 'bg-red-100 text-red-600',
}

const Badge = ({ stato }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATO_COLORS[stato] || 'bg-slate-100 text-slate-600'}`}>
    {stato?.replace(/_/g, ' ')}
  </span>
)

// ── Export CSV ───────────────────────────────────────────────────────────────
const exportCSV = (data, filename) => {
  if (!data.length) return
  const keys = Object.keys(data[0])
  const csv = [
    keys.join(','),
    ...data.map(row => keys.map(k => {
      const v = row[k] === null || row[k] === undefined ? '' : String(row[k])
      return `"${v.replace(/"/g, '""')}"`
    }).join(','))
  ].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

// ── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, color }) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <p className="text-2xl font-black text-slate-900 leading-none mb-1">{value}</p>
    <p className="text-sm font-medium text-slate-600">{label}</p>
    {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
  </div>
)

// ── SEZIONE DASHBOARD ────────────────────────────────────────────────────────
const SezioneDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [leadsOggi, setLeadsOggi] = useState([])

  useEffect(() => {
    const load = async () => {
      const oggi = new Date().toISOString().slice(0, 10)
      const [l, a, c] = await Promise.all([
        supabase.from('leads').select('stato, created_at'),
        supabase.from('attivazioni').select('commissione_dovuta, commissione_pagata, stato'),
        supabase.from('calcolo_offerta').select('risparmio_annuo, tua_commissione'),
      ])
      const leads = l.data || []
      const att = a.data || []
      const calc = c.data || []
      const oggiLeads = leads.filter(x => x.created_at?.slice(0, 10) === oggi)
      setLeadsOggi(oggiLeads)
      setStats({
        totLeads: leads.length,
        oggiLeads: oggiLeads.length,
        inviati: leads.filter(x => x.stato === 'inviato_operatore').length,
        confermati: att.filter(x => x.stato === 'confermata').length,
        commissTotali: att.reduce((s, x) => s + (x.commissione_dovuta || 0), 0),
        commissPagate: att.reduce((s, x) => s + (x.commissione_pagata || 0), 0),
        risparmioClienti: calc.reduce((s, x) => s + (x.risparmio_annuo || 0), 0),
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <Loader />

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900 mb-1">Dashboard</h2>
        <p className="text-sm text-slate-500">Panoramica aggiornata al {dtm(new Date())}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Lead totali" value={stats.totLeads} sub={`+${stats.oggiLeads} oggi`} icon={Users} color="bg-blue-100 text-blue-600" />
        <StatCard label="Pratiche inviate" value={stats.inviati} icon={FileText} color="bg-purple-100 text-purple-600" />
        <StatCard label="Attivazioni confermate" value={stats.confermati} icon={CheckCircle} color="bg-green-100 text-green-600" />
        <StatCard label="Commissioni maturate" value={eur(stats.commissTotali)} sub={`Pagate: ${eur(stats.commissPagate)}`} icon={Euro} color="bg-amber-100 text-amber-600" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" /> Lead di oggi ({leadsOggi.length})
        </h3>
        {leadsOggi.length === 0
          ? <p className="text-slate-400 text-sm">Nessun lead oggi ancora</p>
          : (
            <div className="space-y-2">
              {leadsOggi.map((l, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-600">{dtm(l.created_at)}</span>
                  <Badge stato={l.stato} />
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  )
}

// ── SEZIONE LEADS ────────────────────────────────────────────────────────────
const SezioneLeads = () => {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroStato, setFiltroStato] = useState('')
  const [pagina, setPagina] = useState(0)
  const PER_PAG = 25

  const carica = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('leads').select(`
      id, codice_univoco, stato, email, telefono, tipo_cliente,
      tipo_fornitura, privacy_acconsentito, created_at,
      consumi_cliente(spesa_mensile_attuale, tipo_fornitura),
      calcolo_offerta(risparmio_annuo, tua_commissione)
    `).order('created_at', { ascending: false })
    if (filtroStato) q = q.eq('stato', filtroStato)
    if (search) q = q.or(`email.ilike.%${search}%,telefono.ilike.%${search}%,codice_univoco.ilike.%${search}%`)
    q = q.range(pagina * PER_PAG, (pagina + 1) * PER_PAG - 1)
    const { data } = await q
    setLeads(data || [])
    setLoading(false)
  }, [search, filtroStato, pagina])

  useEffect(() => { carica() }, [carica])

  const esporta = async () => {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    exportCSV(data || [], 'leads_eutenti')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900">Lead</h2>
          <p className="text-sm text-slate-500">Tutti i potenziali clienti</p>
        </div>
        <button onClick={esporta} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          <Download className="w-4 h-4" /> Esporta CSV
        </button>
      </div>

      {/* Filtri */}
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

      {/* Tabella */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Data</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Contatto</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Stato</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Risparmio</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Commissione</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={6} className="py-12 text-center text-slate-400">Caricamento…</td></tr>
                : leads.length === 0
                  ? <tr><td colSpan={6} className="py-12 text-center text-slate-400">Nessun risultato</td></tr>
                  : leads.map(l => {
                    const calcolo = Array.isArray(l.calcolo_offerta) ? l.calcolo_offerta[0] : l.calcolo_offerta
                    return (
                      <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{dtm(l.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 text-xs">{l.email}</div>
                          {l.telefono && <div className="text-slate-400 text-xs">{l.telefono}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-600">{l.tipo_cliente || '—'}</span>
                          {l.tipo_fornitura && <div className="text-xs text-blue-600 font-medium">{l.tipo_fornitura}</div>}
                        </td>
                        <td className="px-4 py-3"><Badge stato={l.stato} /></td>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-green-600">
                          {calcolo?.risparmio_annuo ? eur(calcolo.risparmio_annuo) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-blue-600">
                          {calcolo?.tua_commissione ? eur(calcolo.tua_commissione) : '—'}
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>
        {/* Paginazione */}
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">Pagina {pagina + 1}</span>
          <div className="flex gap-2">
            <button disabled={pagina === 0} onClick={() => setPagina(p => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs disabled:opacity-40 hover:bg-slate-50 transition-colors">← Prec</button>
            <button disabled={leads.length < PER_PAG} onClick={() => setPagina(p => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs disabled:opacity-40 hover:bg-slate-50 transition-colors">Succ →</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── SEZIONE PRATICHE ─────────────────────────────────────────────────────────
const SezionePratiche = () => {
  const [pratiche, setPratiche] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const carica = async () => {
      const { data } = await supabase
        .from('pre_contratti')
        .select(`*, leads(email, telefono, stato)`)
        .order('created_at', { ascending: false })
      setPratiche(data || [])
      setLoading(false)
    }
    carica()
  }, [])

  const esporta = () => exportCSV(pratiche, 'pratiche_eutenti')

  const aggiornaStato = async (id, nuovoStato) => {
    await supabase.from('pre_contratti').update({ stato: nuovoStato }).eq('id', id)
    setPratiche(p => p.map(x => x.id === id ? { ...x, stato: nuovoStato } : x))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900">Pratiche</h2>
          <p className="text-sm text-slate-500">Pre-contratti e attivazioni</p>
        </div>
        <button onClick={esporta} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          <Download className="w-4 h-4" /> Esporta CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Data</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Indirizzo</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Stato pratica</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={5} className="py-12 text-center text-slate-400">Caricamento…</td></tr>
                : pratiche.length === 0
                  ? <tr><td colSpan={5} className="py-12 text-center text-slate-400">Nessuna pratica</td></tr>
                  : pratiche.map(p => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{dtm(p.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 text-xs">{p.nome} {p.cognome}</div>
                        <div className="text-slate-400 text-xs">{p.leads?.email}</div>
                        {p.leads?.telefono && <div className="text-slate-400 text-xs">{p.leads.telefono}</div>}
                        {p.codice_fiscale && <div className="text-slate-400 text-xs font-mono">{p.codice_fiscale}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <div>{p.indirizzo_fornitura}</div>
                        <div className="text-slate-400">{p.cap} {p.citta} ({p.provincia})</div>
                        {p.codice_pod && <div className="text-blue-600 font-mono text-[10px]">POD: {p.codice_pod}</div>}
                        {p.codice_pdr && <div className="text-orange-600 font-mono text-[10px]">PDR: {p.codice_pdr}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <select value={p.stato || 'bozza'}
                          onChange={e => aggiornaStato(p.id, e.target.value)}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="bozza">Bozza</option>
                          <option value="inviato">Inviato</option>
                          <option value="in_lavorazione">In lavorazione</option>
                          <option value="confermato">Confermato</option>
                          <option value="annullato">Annullato</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {p.leads?.telefono && (
                          <a href={`tel:${p.leads.telefono}`}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                            <Phone className="w-3 h-3" /> Chiama
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── SEZIONE OFFERTE ──────────────────────────────────────────────────────────
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

  const iniziaEdit = (o) => { setEditId(o.id); setForm(o); setNuova(false) }
  const iniziaNuova = () => { setForm({ visibile: true, tipo_fornitura: 'dual' }); setNuova(true); setEditId(null) }

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

  const campoEdit = (k, label, type = 'text') => (
    <div key={k}>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <input type={type} value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900">Offerte</h2>
          <p className="text-sm text-slate-500">Gestisci le offerte energia disponibili</p>
        </div>
        <button onClick={iniziaNuova}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Nuova offerta
        </button>
      </div>

      {/* Form edit/nuova */}
      <AnimatePresence>
        {(editId || nuova) && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-white rounded-2xl border-2 border-blue-200 shadow-lg p-6">
            <h3 className="font-bold text-slate-900 mb-4">{nuova ? '+ Nuova offerta' : 'Modifica offerta'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">{campoEdit('nome_offerta', 'Nome offerta')}</div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fornitore</label>
                <select value={form.fornitore_id || ''} onChange={e => setForm(f => ({ ...f, fornitore_id: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Seleziona…</option>
                  {fornitori.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo fornitura</label>
                <select value={form.tipo_fornitura || 'dual'} onChange={e => setForm(f => ({ ...f, tipo_fornitura: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="luce">Luce</option>
                  <option value="gas">Gas</option>
                  <option value="dual">Dual (Luce + Gas)</option>
                </select>
              </div>
              {campoEdit('prezzo_kwh', 'Prezzo €/kWh', 'number')}
              {campoEdit('prezzo_smc', 'Prezzo €/Smc', 'number')}
              {campoEdit('quota_fissa_luce_mensile', 'Quota fissa luce/mese €', 'number')}
              {campoEdit('quota_fissa_gas_mensile', 'Quota fissa gas/mese €', 'number')}
              {campoEdit('bonus_attivazione', 'Bonus attivazione €', 'number')}
              {campoEdit('durata_mesi', 'Durata mesi', 'number')}
              {campoEdit('priorita_visualizzazione', 'Priorità (1-100)', 'number')}
              {campoEdit('data_inizio', 'Data inizio', 'date')}
              {campoEdit('data_fine', 'Data fine', 'date')}
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Descrizione breve</label>
                <input type="text" value={form.descrizione_breve || ''} onChange={e => setForm(f => ({ ...f, descrizione_breve: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Descrizione completa</label>
                <textarea value={form.descrizione_completa || ''} rows={3}
                  onChange={e => setForm(f => ({ ...f, descrizione_completa: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!form.visibile} onChange={e => setForm(f => ({ ...f, visibile: e.target.checked }))}
                    className="w-4 h-4 rounded" />
                  <span className="text-sm text-slate-700">Visibile</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!form.green_energy} onChange={e => setForm(f => ({ ...f, green_energy: e.target.checked }))}
                    className="w-4 h-4 rounded" />
                  <span className="text-sm text-slate-700">Green energy</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!form.digitale} onChange={e => setForm(f => ({ ...f, digitale: e.target.checked }))}
                    className="w-4 h-4 rounded" />
                  <span className="text-sm text-slate-700">Digitale</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-5 pt-5 border-t border-slate-100">
              <button onClick={salva} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
                <Save className="w-4 h-4" /> Salva
              </button>
              <button onClick={() => { setEditId(null); setNuova(false); setForm({}) }}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
                <X className="w-4 h-4" /> Annulla
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista offerte */}
      <div className="space-y-3">
        {loading ? <Loader /> : offerte.map(o => (
          <div key={o.id} className={`bg-white rounded-xl border shadow-sm p-4 transition-all ${o.visibile ? 'border-slate-100' : 'border-slate-200 opacity-60'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold text-slate-900">{o.nome_offerta}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${o.tipo_fornitura === 'dual' ? 'bg-blue-100 text-blue-700' : o.tipo_fornitura === 'luce' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'}`}>
                    {o.tipo_fornitura}
                  </span>
                  {!o.visibile && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Nascosta</span>}
                </div>
                <p className="text-xs text-slate-500 mb-2">{o.fornitori?.nome || '—'}</p>
                <div className="flex gap-4 flex-wrap text-xs text-slate-600">
                  {o.prezzo_kwh > 0 && <span>⚡ {Number(o.prezzo_kwh).toFixed(4)} €/kWh</span>}
                  {o.prezzo_smc > 0 && <span>🔥 {Number(o.prezzo_smc).toFixed(4)} €/Smc</span>}
                  {o.bonus_attivazione > 0 && <span>🎁 Bonus {eur(o.bonus_attivazione)}</span>}
                  <span>Priorità: {o.priorita_visualizzazione || 0}</span>
                  <span>{dt(o.data_inizio)} → {o.data_fine ? dt(o.data_fine) : 'no scad.'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleVisibile(o.id, o.visibile)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${o.visibile ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {o.visibile ? 'Attiva' : 'Disattiva'}
                </button>
                <button onClick={() => iniziaEdit(o)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900">
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

// ── SEZIONE FORNITORI ────────────────────────────────────────────────────────
const SezioneFornitori = () => {
  const [fornitori, setFornitori] = useState([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({})

  useEffect(() => {
    supabase.from('fornitori').select('*').order('nome').then(({ data }) => {
      setFornitori(data || [])
      setLoading(false)
    })
  }, [])

  const salva = async () => {
    if (editId === 'nuovo') {
      const { data } = await supabase.from('fornitori').insert([form]).select()
      if (data) setFornitori(p => [...p, data[0]])
    } else {
      await supabase.from('fornitori').update(form).eq('id', editId)
      setFornitori(p => p.map(x => x.id === editId ? { ...x, ...form } : x))
    }
    setEditId(null); setForm({})
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
        <div>
          <h2 className="text-xl font-black text-slate-900">Fornitori</h2>
          <p className="text-sm text-slate-500">Gestisci i fornitori di energia</p>
        </div>
        <button onClick={() => { setForm({ attivo: true, fornisce_luce: true, fornisce_gas: true }); setEditId('nuovo') }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Nuovo fornitore
        </button>
      </div>

      <AnimatePresence>
        {editId && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-white rounded-2xl border-2 border-blue-200 shadow-lg p-6">
            <h3 className="font-bold text-slate-900 mb-4">{editId === 'nuovo' ? '+ Nuovo fornitore' : 'Modifica fornitore'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <F k="nome" label="Nome *" />
              <F k="email_operatore" label="Email operatore" type="email" />
              <F k="telefono_operatore" label="Telefono operatore" />
              <F k="referente_nome" label="Referente" />
              <F k="sito_web" label="Sito web" />
              <F k="logo_url" label="URL Logo" />
              <F k="rating_fornitore" label="Rating (1-5)" type="number" />
              <F k="tempo_attivazione_medio" label="Giorni attivazione medi" type="number" />
              <div className="flex gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.fornisce_luce} onChange={e => setForm(f => ({ ...f, fornisce_luce: e.target.checked }))} /> Luce</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.fornisce_gas} onChange={e => setForm(f => ({ ...f, fornisce_gas: e.target.checked }))} /> Gas</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.attivo} onChange={e => setForm(f => ({ ...f, attivo: e.target.checked }))} /> Attivo</label>
              </div>
            </div>
            <div className="flex gap-3 mt-5 pt-5 border-t border-slate-100">
              <button onClick={salva} className="flex items-center gap-2 bg-blue-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl">
                <Save className="w-4 h-4" /> Salva
              </button>
              <button onClick={() => { setEditId(null); setForm({}) }}
                className="flex items-center gap-2 bg-slate-100 text-slate-700 text-sm font-bold px-5 py-2.5 rounded-xl">
                <X className="w-4 h-4" /> Annulla
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? <Loader /> : fornitori.map(f => (
          <div key={f.id} className={`bg-white rounded-xl border shadow-sm p-4 ${!f.attivo ? 'opacity-50' : 'border-slate-100'}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-900">{f.nome}</span>
                  {!f.attivo && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Inattivo</span>}
                </div>
                <div className="text-xs text-slate-500 space-y-0.5">
                  <div>{f.email_operatore}</div>
                  {f.telefono_operatore && <div>{f.telefono_operatore}</div>}
                  <div className="flex gap-2 mt-1">
                    {f.fornisce_luce && <span className="text-yellow-600">⚡ Luce</span>}
                    {f.fornisce_gas && <span className="text-orange-600">🔥 Gas</span>}
                    {f.rating_fornitore && <span>⭐ {f.rating_fornitore}</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => { setEditId(f.id); setForm(f) }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors">
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SEZIONE EXPORT ───────────────────────────────────────────────────────────
const SezioneExport = () => {
  const [loading, setLoading] = useState({})

  const TABELLE = [
    { id: 'leads', label: 'Lead', desc: 'Tutti i potenziali clienti con contatti e stato', icon: Users },
    { id: 'pre_contratti', label: 'Pratiche', desc: 'Dati anagrafici e pratiche inviate', icon: FileText },
    { id: 'calcolo_offerta', label: 'Calcoli offerta', desc: 'Risparmi calcolati e commissioni', icon: TrendingUp },
    { id: 'attivazioni', label: 'Attivazioni', desc: 'Contratti confermati e pagamenti', icon: CheckCircle },
    { id: 'consumi_cliente', label: 'Consumi', desc: 'Dati di consumo per cliente', icon: Zap },
    { id: 'offerte', label: 'Offerte', desc: 'Tutte le offerte energia', icon: ArrowUpRight },
    { id: 'fornitori', label: 'Fornitori', desc: 'Anagrafica fornitori', icon: Building2 },
    { id: 'commissioni', label: 'Commissioni', desc: 'Struttura commissioni per offerta', icon: Euro },
  ]

  const esporta = async (tabella) => {
    setLoading(p => ({ ...p, [tabella]: true }))
    const { data } = await supabase.from(tabella).select('*').order('created_at', { ascending: false }).catch(() => ({ data: [] }))
    exportCSV(data || [], tabella)
    setLoading(p => ({ ...p, [tabella]: false }))
  }

  const esportaTutto = async () => {
    setLoading({ tutto: true })
    for (const t of TABELLE) await esporta(t.id)
    setLoading({})
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900">Esporta dati</h2>
          <p className="text-sm text-slate-500">Scarica i dati in formato CSV</p>
        </div>
        <button onClick={esportaTutto} disabled={loading.tutto}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          {loading.tutto
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Esportando…</>
            : <><Download className="w-4 h-4" /> Esporta tutto (ZIP CSV)</>
          }
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {TABELLE.map(t => {
          const Icon = t.icon
          return (
            <div key={t.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{t.label}</p>
                  <p className="text-xs text-slate-500">{t.desc}</p>
                </div>
              </div>
              <button onClick={() => esporta(t.id)} disabled={loading[t.id]}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex-shrink-0">
                {loading[t.id]
                  ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                  : <Download className="w-3 h-3" />}
                CSV
              </button>
            </div>
          )
        })}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm text-blue-800 font-semibold mb-1">📋 Come usare i CSV con Brevo</p>
        <p className="text-xs text-blue-700 line-height-1.5">
          Esporta "Lead" → su Brevo vai in Contacts → Import → carica il CSV → mappa i campi:
          <strong> email → Email</strong>, <strong>telefono → SMS</strong>, <strong>tipo_fornitura → Attributo personalizzato</strong>.
          I contatti vengono aggiunti senza duplicati se l'email è già presente.
        </p>
      </div>
    </div>
  )
}

// ── Loader ───────────────────────────────────────────────────────────────────
const Loader = () => (
  <div className="flex items-center justify-center py-12">
    <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
  </div>
)

// ── PANNELLO PRINCIPALE ──────────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leads', label: 'Lead', icon: Users },
  { id: 'pratiche', label: 'Pratiche', icon: FileText },
  { id: 'offerte', label: 'Offerte', icon: Zap },
  { id: 'fornitori', label: 'Fornitori', icon: Building2 },
  { id: 'export', label: 'Esporta', icon: Download },
]

const AdminDashboard = ({ admin, onLogout }) => {
  const [sezione, setSezione] = useState('dashboard')
  const [menuMobile, setMenuMobile] = useState(false)

  const logout = async () => {
    await supabase.auth.signOut()
    onLogout()
  }

  const SezioneAttiva = {
    dashboard: SezioneDashboard,
    leads: SezioneLeads,
    pratiche: SezionePratiche,
    offerte: SezioneOfferte,
    fornitori: SezioneFornitori,
    export: SezioneExport,
  }[sezione]

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-slate-100 shadow-sm fixed h-full z-20">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black text-slate-900">e<span className="text-blue-600">Utenti</span></span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Pannello Admin</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(n => {
            const Icon = n.icon
            const active = sezione === n.id
            return (
              <button key={n.id} onClick={() => setSezione(n.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {n.label}
              </button>
            )
          })}
        </nav>

        {/* Admin info + logout */}
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
          <button onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 font-semibold transition-colors">
            <LogOut className="w-4 h-4" /> Esci
          </button>
        </div>
      </aside>

      {/* Header mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-100 z-30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-slate-900">eUtenti <span className="text-blue-600 font-normal text-sm">Admin</span></span>
        </div>
        <button onClick={() => setMenuMobile(!menuMobile)} className="p-2 rounded-lg hover:bg-slate-100">
          <ChevronDown className={`w-5 h-5 text-slate-600 transition-transform ${menuMobile ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Menu mobile */}
      <AnimatePresence>
        {menuMobile && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="md:hidden fixed top-14 left-0 right-0 bg-white border-b border-slate-100 z-20 px-4 py-3 shadow-lg">
            <div className="grid grid-cols-3 gap-2">
              {NAV.map(n => {
                const Icon = n.icon
                return (
                  <button key={n.id} onClick={() => { setSezione(n.id); setMenuMobile(false) }}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-semibold transition-all ${sezione === n.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600'}`}>
                    <Icon className="w-4 h-4" />
                    {n.label}
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

      {/* Contenuto principale */}
      <main className="flex-1 md:ml-60 pt-16 md:pt-0">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <AnimatePresence mode="wait">
            <motion.div key={sezione} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <SezioneAttiva />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
