import React, { useState, useRef } from 'react'
import { User, MapPin, FileText } from 'lucide-react'
import { useForm } from '../contexts/FormContext'
import { motion } from 'framer-motion'
import { validateCodiceFiscale, validateCAP, validatePOD, validatePDR } from '../utils/validation'
import { createPreContract, updateLeadStatus } from '../services/api'

// ── Database CAP offline ───────────────────────────────────────────────────────
// Copre tutti i capoluoghi + varianti principali. Nessuna API esterna necessaria.
const CAP_DB = {
  '00100':'Roma|RM','00118':'Roma|RM','00121':'Roma|RM','00122':'Roma|RM','00123':'Roma|RM',
  '00124':'Roma|RM','00125':'Roma|RM','00126':'Roma|RM','00127':'Roma|RM','00128':'Roma|RM',
  '00131':'Roma|RM','00132':'Roma|RM','00133':'Roma|RM','00134':'Roma|RM','00135':'Roma|RM',
  '00136':'Roma|RM','00137':'Roma|RM','00138':'Roma|RM','00139':'Roma|RM','00141':'Roma|RM',
  '00142':'Roma|RM','00143':'Roma|RM','00144':'Roma|RM','00145':'Roma|RM','00146':'Roma|RM',
  '00147':'Roma|RM','00148':'Roma|RM','00149':'Roma|RM','00151':'Roma|RM','00152':'Roma|RM',
  '00153':'Roma|RM','00154':'Roma|RM','00155':'Roma|RM','00156':'Roma|RM','00157':'Roma|RM',
  '00158':'Roma|RM','00159':'Roma|RM','00161':'Roma|RM','00162':'Roma|RM','00163':'Roma|RM',
  '00164':'Roma|RM','00165':'Roma|RM','00166':'Roma|RM','00167':'Roma|RM','00168':'Roma|RM',
  '00169':'Roma|RM','00171':'Roma|RM','00172':'Roma|RM','00173':'Roma|RM','00174':'Roma|RM',
  '00175':'Roma|RM','00176':'Roma|RM','00177':'Roma|RM','00178':'Roma|RM','00179':'Roma|RM',
  '00181':'Roma|RM','00182':'Roma|RM','00183':'Roma|RM','00184':'Roma|RM','00185':'Roma|RM',
  '00186':'Roma|RM','00187':'Roma|RM','00188':'Roma|RM','00189':'Roma|RM','00191':'Roma|RM',
  '00192':'Roma|RM','00193':'Roma|RM','00194':'Roma|RM','00195':'Roma|RM','00196':'Roma|RM',
  '00197':'Roma|RM','00198':'Roma|RM',
  '20100':'Milano|MI','20121':'Milano|MI','20122':'Milano|MI','20123':'Milano|MI','20124':'Milano|MI',
  '20125':'Milano|MI','20126':'Milano|MI','20127':'Milano|MI','20128':'Milano|MI','20129':'Milano|MI',
  '20131':'Milano|MI','20132':'Milano|MI','20133':'Milano|MI','20134':'Milano|MI','20135':'Milano|MI',
  '20136':'Milano|MI','20137':'Milano|MI','20138':'Milano|MI','20139':'Milano|MI','20141':'Milano|MI',
  '20142':'Milano|MI','20143':'Milano|MI','20144':'Milano|MI','20145':'Milano|MI','20146':'Milano|MI',
  '20147':'Milano|MI','20148':'Milano|MI','20149':'Milano|MI','20151':'Milano|MI','20152':'Milano|MI',
  '20153':'Milano|MI','20154':'Milano|MI','20155':'Milano|MI','20156':'Milano|MI','20157':'Milano|MI',
  '20158':'Milano|MI','20159':'Milano|MI','20161':'Milano|MI','20162':'Milano|MI',
  '10100':'Torino|TO','10121':'Torino|TO','10122':'Torino|TO','10123':'Torino|TO','10124':'Torino|TO',
  '10125':'Torino|TO','10126':'Torino|TO','10127':'Torino|TO','10128':'Torino|TO','10129':'Torino|TO',
  '10131':'Torino|TO','10132':'Torino|TO','10133':'Torino|TO','10134':'Torino|TO','10135':'Torino|TO',
  '10136':'Torino|TO','10137':'Torino|TO','10138':'Torino|TO','10139':'Torino|TO','10141':'Torino|TO',
  '10142':'Torino|TO','10143':'Torino|TO','10144':'Torino|TO','10145':'Torino|TO','10146':'Torino|TO',
  '10147':'Torino|TO','10148':'Torino|TO','10149':'Torino|TO','10151':'Torino|TO','10152':'Torino|TO',
  '10153':'Torino|TO','10154':'Torino|TO','10155':'Torino|TO','10156':'Torino|TO',
  '80100':'Napoli|NA','80121':'Napoli|NA','80122':'Napoli|NA','80123':'Napoli|NA','80124':'Napoli|NA',
  '80125':'Napoli|NA','80126':'Napoli|NA','80127':'Napoli|NA','80128':'Napoli|NA','80129':'Napoli|NA',
  '80131':'Napoli|NA','80132':'Napoli|NA','80133':'Napoli|NA','80134':'Napoli|NA','80135':'Napoli|NA',
  '80136':'Napoli|NA','80137':'Napoli|NA','80138':'Napoli|NA','80139':'Napoli|NA','80141':'Napoli|NA',
  '80142':'Napoli|NA','80143':'Napoli|NA','80144':'Napoli|NA','80145':'Napoli|NA','80146':'Napoli|NA',
  '80147':'Napoli|NA',
  '74100':'Taranto|TA','74121':'Taranto|TA','74122':'Taranto|TA','74123':'Taranto|TA','74124':'Taranto|TA',
  '70100':'Bari|BA','70121':'Bari|BA','70122':'Bari|BA','70123':'Bari|BA','70124':'Bari|BA',
  '70125':'Bari|BA','70126':'Bari|BA','70127':'Bari|BA','70128':'Bari|BA','70129':'Bari|BA',
  '70131':'Bari|BA','70132':'Bari|BA',
  '40100':'Bologna|BO','40121':'Bologna|BO','40122':'Bologna|BO','40123':'Bologna|BO','40124':'Bologna|BO',
  '40125':'Bologna|BO','40126':'Bologna|BO','40127':'Bologna|BO','40128':'Bologna|BO','40129':'Bologna|BO',
  '40131':'Bologna|BO','40132':'Bologna|BO','40133':'Bologna|BO','40134':'Bologna|BO','40135':'Bologna|BO',
  '40136':'Bologna|BO','40137':'Bologna|BO','40138':'Bologna|BO','40139':'Bologna|BO','40141':'Bologna|BO',
  '50100':'Firenze|FI','50121':'Firenze|FI','50122':'Firenze|FI','50123':'Firenze|FI','50124':'Firenze|FI',
  '50125':'Firenze|FI','50126':'Firenze|FI','50127':'Firenze|FI','50128':'Firenze|FI','50129':'Firenze|FI',
  '50131':'Firenze|FI','50132':'Firenze|FI','50133':'Firenze|FI','50134':'Firenze|FI','50135':'Firenze|FI',
  '50136':'Firenze|FI','50137':'Firenze|FI','50139':'Firenze|FI','50141':'Firenze|FI','50142':'Firenze|FI',
  '50143':'Firenze|FI','50144':'Firenze|FI','50145':'Firenze|FI',
  '16100':'Genova|GE','16121':'Genova|GE','16122':'Genova|GE','16123':'Genova|GE','16124':'Genova|GE',
  '16125':'Genova|GE','16126':'Genova|GE','16127':'Genova|GE','16128':'Genova|GE','16129':'Genova|GE',
  '16131':'Genova|GE','16132':'Genova|GE','16133':'Genova|GE','16134':'Genova|GE','16135':'Genova|GE',
  '16136':'Genova|GE','16137':'Genova|GE','16138':'Genova|GE','16139':'Genova|GE','16141':'Genova|GE',
  '16142':'Genova|GE','16143':'Genova|GE','16145':'Genova|GE','16146':'Genova|GE','16147':'Genova|GE',
  '16148':'Genova|GE','16149':'Genova|GE','16151':'Genova|GE','16152':'Genova|GE','16153':'Genova|GE',
  '16154':'Genova|GE','16155':'Genova|GE','16156':'Genova|GE','16157':'Genova|GE','16158':'Genova|GE',
  '16159':'Genova|GE','16161':'Genova|GE','16162':'Genova|GE','16163':'Genova|GE','16164':'Genova|GE',
  '16165':'Genova|GE',
  '90100':'Palermo|PA','90121':'Palermo|PA','90122':'Palermo|PA','90123':'Palermo|PA','90124':'Palermo|PA',
  '90125':'Palermo|PA','90126':'Palermo|PA','90127':'Palermo|PA','90128':'Palermo|PA','90129':'Palermo|PA',
  '90131':'Palermo|PA','90132':'Palermo|PA','90133':'Palermo|PA','90134':'Palermo|PA','90135':'Palermo|PA',
  '90136':'Palermo|PA','90137':'Palermo|PA','90138':'Palermo|PA','90139':'Palermo|PA','90141':'Palermo|PA',
  '90142':'Palermo|PA','90143':'Palermo|PA','90144':'Palermo|PA','90145':'Palermo|PA','90146':'Palermo|PA',
  '90147':'Palermo|PA','90148':'Palermo|PA',
  '95100':'Catania|CT','95121':'Catania|CT','95122':'Catania|CT','95123':'Catania|CT','95124':'Catania|CT',
  '95125':'Catania|CT','95126':'Catania|CT','95127':'Catania|CT','95128':'Catania|CT','95129':'Catania|CT',
  '95131':'Catania|CT',
  '25100':'Brescia|BS','25121':'Brescia|BS','25122':'Brescia|BS','25123':'Brescia|BS','25124':'Brescia|BS',
  '25125':'Brescia|BS','25126':'Brescia|BS','25127':'Brescia|BS','25128':'Brescia|BS','25129':'Brescia|BS',
  '37100':'Verona|VR','37121':'Verona|VR','37122':'Verona|VR','37123':'Verona|VR','37124':'Verona|VR',
  '37125':'Verona|VR','37126':'Verona|VR','37127':'Verona|VR','37128':'Verona|VR','37129':'Verona|VR',
  '35100':'Padova|PD','35121':'Padova|PD','35122':'Padova|PD','35123':'Padova|PD','35124':'Padova|PD',
  '35125':'Padova|PD','35126':'Padova|PD','35127':'Padova|PD','35128':'Padova|PD','35129':'Padova|PD',
  '30100':'Venezia|VE','30121':'Venezia|VE','30122':'Venezia|VE','30123':'Venezia|VE','30124':'Venezia|VE',
  '30125':'Venezia|VE','30126':'Venezia|VE','30127':'Venezia|VE','30128':'Venezia|VE','30129':'Venezia|VE',
  '30131':'Venezia|VE','30132':'Venezia|VE','30133':'Venezia|VE','30134':'Venezia|VE','30135':'Venezia|VE',
  '24100':'Bergamo|BG','24121':'Bergamo|BG','24122':'Bergamo|BG','24123':'Bergamo|BG','24124':'Bergamo|BG',
  '24125':'Bergamo|BG','24126':'Bergamo|BG','24127':'Bergamo|BG','24128':'Bergamo|BG',
  '41100':'Modena|MO','41121':'Modena|MO','41122':'Modena|MO','41123':'Modena|MO','41124':'Modena|MO',
  '41125':'Modena|MO','41126':'Modena|MO',
  '43100':'Parma|PR','43121':'Parma|PR','43122':'Parma|PR','43123':'Parma|PR','43124':'Parma|PR',
  '42100':'Reggio Emilia|RE','42121':'Reggio Emilia|RE','42122':'Reggio Emilia|RE','42123':'Reggio Emilia|RE',
  '47900':'Rimini|RN','47921':'Rimini|RN','47922':'Rimini|RN','47923':'Rimini|RN',
  '48100':'Ravenna|RA','48121':'Ravenna|RA','48122':'Ravenna|RA','48123':'Ravenna|RA',
  '44100':'Ferrara|FE','44121':'Ferrara|FE','44122':'Ferrara|FE','44123':'Ferrara|FE','44124':'Ferrara|FE',
  '29100':'Piacenza|PC','29121':'Piacenza|PC','29122':'Piacenza|PC',
  '60100':'Ancona|AN','60121':'Ancona|AN','60122':'Ancona|AN','60123':'Ancona|AN','60124':'Ancona|AN',
  '61100':'Pesaro|PU','61121':'Pesaro|PU','61122':'Pesaro|PU',
  '06100':'Perugia|PG','06121':'Perugia|PG','06122':'Perugia|PG','06123':'Perugia|PG','06124':'Perugia|PG',
  '05100':'Terni|TR','05121':'Terni|TR','05122':'Terni|TR',
  '64100':'Teramo|TE','65100':'Pescara|PE','65121':'Pescara|PE','65122':'Pescara|PE','65123':'Pescara|PE',
  '66100':'Chieti|CH','67100':'L\'Aquila|AQ',
  '82100':'Benevento|BN','83100':'Avellino|AV','84100':'Salerno|SA','84121':'Salerno|SA','84122':'Salerno|SA',
  '84123':'Salerno|SA','84124':'Salerno|SA','84125':'Salerno|SA','84126':'Salerno|SA','84127':'Salerno|SA',
  '81100':'Caserta|CE','86100':'Campobasso|CB',
  '71100':'Foggia|FG','71121':'Foggia|FG','71122':'Foggia|FG',
  '72100':'Brindisi|BR','72121':'Brindisi|BR','72122':'Brindisi|BR',
  '73100':'Lecce|LE','73121':'Lecce|LE','73122':'Lecce|LE',
  '75100':'Matera|MT','75121':'Matera|MT','85100':'Potenza|PZ','85121':'Potenza|PZ',
  '87100':'Cosenza|CS','87121':'Cosenza|CS','88100':'Catanzaro|CZ','89100':'Reggio Calabria|RC',
  '89121':'Reggio Calabria|RC','89122':'Reggio Calabria|RC','89123':'Reggio Calabria|RC',
  '96100':'Siracusa|SR','96121':'Siracusa|SR','97100':'Ragusa|RG','98100':'Messina|ME',
  '98121':'Messina|ME','98122':'Messina|ME','92100':'Agrigento|AG','91100':'Trapani|TP',
  '93100':'Caltanissetta|CL','94100':'Enna|EN',
  '09100':'Cagliari|CA','09121':'Cagliari|CA','09122':'Cagliari|CA','09123':'Cagliari|CA',
  '07100':'Sassari|SS','08100':'Nuoro|NU',
  '34100':'Trieste|TS','34121':'Trieste|TS','34122':'Trieste|TS','34123':'Trieste|TS',
  '33100':'Udine|UD','33121':'Udine|UD','33122':'Udine|UD',
  '38100':'Trento|TN','38121':'Trento|TN','38122':'Trento|TN','39100':'Bolzano|BZ','39121':'Bolzano|BZ',
  '11100':'Aosta|AO','34170':'Gorizia|GO',
  '21100':'Varese|VA','22100':'Como|CO','23100':'Sondrio|SO','26100':'Cremona|CR',
  '27100':'Pavia|PV','28100':'Novara|NO','12100':'Cuneo|CN','13100':'Vercelli|VC',
  '14100':'Asti|AT','15100':'Alessandria|AL','17100':'Savona|SV','18100':'Imperia|IM',
  '19100':'La Spezia|SP','46100':'Mantova|MN','31100':'Treviso|TV','32100':'Belluno|BL',
  '36100':'Vicenza|VI','36121':'Vicenza|VI','45100':'Rovigo|RO','51100':'Pistoia|PT',
  '52100':'Arezzo|AR','53100':'Siena|SI','54100':'Massa|MS','55100':'Lucca|LU',
  '56100':'Pisa|PI','56121':'Pisa|PI','56122':'Pisa|PI','57100':'Livorno|LI',
  '58100':'Grosseto|GR','62100':'Macerata|MC','63100':'Ascoli Piceno|AP',
  '01100':'Viterbo|VT','02100':'Rieti|RI','03100':'Frosinone|FR','04100':'Latina|LT',
  '76100':'Barletta|BT','76121':'Barletta|BT','76125':'Trani|BT','76123':'Andria|BT',
  '47100':'Forlì|FC','47121':'Forlì|FC','47122':'Forlì|FC',
}

// Prefisso CAP → Provincia (fallback per CAP non nel DB)
const PREFIX_PROV = {
  '00':'RM','01':'VT','02':'RI','03':'FR','04':'LT','05':'TR','06':'PG','07':'SS','08':'NU','09':'CA',
  '10':'TO','11':'AO','12':'CN','13':'VC','14':'AT','15':'AL','16':'GE','17':'SV','18':'IM','19':'SP',
  '20':'MI','21':'VA','22':'CO','23':'SO','24':'BG','25':'BS','26':'CR','27':'PV','28':'NO','29':'PC',
  '30':'VE','31':'TV','32':'BL','33':'UD','34':'TS','35':'PD','36':'VI','37':'VR','38':'TN','39':'BZ',
  '40':'BO','41':'MO','42':'RE','43':'PR','44':'FE','45':'RO','46':'MN','47':'FC','48':'RA',
  '50':'FI','51':'PT','52':'AR','53':'SI','54':'MS','55':'LU','56':'PI','57':'LI','58':'GR',
  '60':'AN','61':'PU','62':'MC','63':'AP','64':'TE','65':'PE','66':'CH','67':'AQ',
  '70':'BA','71':'FG','72':'BR','73':'LE','74':'TA','75':'MT','76':'BT',
  '80':'NA','81':'CE','82':'BN','83':'AV','84':'SA','85':'PZ','86':'CB','87':'CS','88':'CZ','89':'RC',
  '90':'PA','91':'TP','92':'AG','93':'CL','94':'EN','95':'CT','96':'SR','97':'RG','98':'ME',
}

const lookupCap = (cap) => {
  const entry = CAP_DB[cap]
  if (entry) { const [c, p] = entry.split('|'); return { citta: c, provincia: p } }
  const prov = PREFIX_PROV[cap.slice(0, 2)]
  return prov ? { citta: '', provincia: prov } : null
}

// ── Componente ────────────────────────────────────────────────────────────────
const Step5PersonalData = () => {
  const { formData, updateFormData, nextStep, leadId, setLoading } = useForm()
  const [errors, setErrors] = useState({})

  const handleCapChange = (val) => {
    const v = val.replace(/\D/g, '').slice(0, 5)
    updateFormData({ cap: v })
    setErrors(p => ({ ...p, cap: null }))
    if (v.length === 5) {
      const res = lookupCap(v)
      if (res) {
        const update = { provincia: res.provincia }
        if (res.citta) update.citta = res.citta
        updateFormData(update)
      }
    }
  }

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
                <input type="text" value={formData.codice_fiscale || ''} maxLength={16} className="input-field uppercase"
                  onChange={e => { updateFormData({ codice_fiscale: e.target.value.toUpperCase() }); setErrors(p => ({ ...p, codice_fiscale: null })) }} />
              </F>
            </div>
          </section>

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
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">CAP *</label>
                  <input type="text" value={formData.cap || ''} maxLength={5} className="input-field"
                    placeholder="es. 20121" onChange={e => handleCapChange(e.target.value)} />
                  {errors.cap && <p className="mt-1 text-xs text-red-600">{errors.cap}</p>}
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Città *</label>
                  <input type="text" value={formData.citta || ''} className="input-field"
                    onChange={e => { updateFormData({ citta: e.target.value }); setErrors(p => ({ ...p, citta: null })) }} />
                  {errors.citta && <p className="mt-1 text-xs text-red-600">{errors.citta}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Prov. *</label>
                  <input type="text" value={formData.provincia || ''} maxLength={2} className="input-field uppercase"
                    onChange={e => { updateFormData({ provincia: e.target.value.toUpperCase() }); setErrors(p => ({ ...p, provincia: null })) }} />
                  {errors.provincia && <p className="mt-1 text-xs text-red-600">{errors.provincia}</p>}
                </div>
              </div>
              <p className="text-xs text-slate-400">💡 Digita il CAP: città e provincia si compilano automaticamente</p>
            </div>
          </section>

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
      {label}{sub && <span className="text-slate-400 font-normal ml-1">— {sub}</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
)

export default Step5PersonalData
