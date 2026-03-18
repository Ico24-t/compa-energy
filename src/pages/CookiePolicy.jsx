import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Cookie, ChevronDown, ChevronUp } from 'lucide-react'

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">{title}</h2>
    <div className="text-slate-600 leading-relaxed space-y-3">{children}</div>
  </div>
)

const CookieRow = ({ nome, tipo, durata, scopo }) => (
  <tr className="border-b border-slate-100 last:border-0">
    <td className="py-2.5 pr-4 text-sm font-mono text-slate-700 font-medium">{nome}</td>
    <td className="py-2.5 pr-4 text-sm text-slate-600">{tipo}</td>
    <td className="py-2.5 pr-4 text-sm text-slate-600">{durata}</td>
    <td className="py-2.5 text-sm text-slate-600">{scopo}</td>
  </tr>
)

const CookiePolicy = () => {
  const [preferenze, setPreferenze] = useState({
    tecnici: true, // non disattivabili
    analitici: false,
    marketing: false
  })

  const salvaPreferenze = () => {
    localStorage.setItem('cookie_preferences', JSON.stringify(preferenze))
    alert('Preferenze salvate!')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="container mx-auto max-w-3xl px-4 py-10">

      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Cookie className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Cookie Policy</h1>
          <p className="text-slate-500 text-sm mt-0.5">Ultimo aggiornamento: marzo 2026</p>
        </div>
      </div>

      <Section title="1. Cosa sono i cookie">
        <p>
          I cookie sono piccoli file di testo che i siti web salvano sul tuo dispositivo (computer, tablet, smartphone)
          quando li visiti. Sono ampiamente utilizzati per far funzionare i siti web in modo efficiente,
          per migliorare l'esperienza utente e per fornire informazioni ai proprietari del sito.
        </p>
      </Section>

      <Section title="2. Cookie che utilizziamo">
        <p>Il sito eUtenti utilizza esclusivamente cookie tecnici, necessari al funzionamento del servizio.</p>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="pb-2 text-xs font-bold text-slate-500 uppercase tracking-wide pr-4">Nome</th>
                <th className="pb-2 text-xs font-bold text-slate-500 uppercase tracking-wide pr-4">Tipo</th>
                <th className="pb-2 text-xs font-bold text-slate-500 uppercase tracking-wide pr-4">Durata</th>
                <th className="pb-2 text-xs font-bold text-slate-500 uppercase tracking-wide">Scopo</th>
              </tr>
            </thead>
            <tbody>
              <CookieRow nome="sb-*-auth-token" tipo="Tecnico" durata="Sessione" scopo="Autenticazione utente admin (Supabase)" />
              <CookieRow nome="cookie_preferences" tipo="Tecnico" durata="12 mesi" scopo="Salvataggio preferenze cookie" />
              <CookieRow nome="backup_freq" tipo="Tecnico" durata="Permanente" scopo="Preferenze pannello admin" />
              <CookieRow nome="sheets_url" tipo="Tecnico" durata="Permanente" scopo="URL Google Sheets salvato nell'admin" />
            </tbody>
          </table>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4">
          <p className="text-sm text-green-800">
            ✅ <strong>eUtenti non utilizza cookie di profilazione, tracciamento o marketing.</strong>{' '}
            Non sono presenti cookie di terze parti a fini pubblicitari.
          </p>
        </div>
      </Section>

      <Section title="3. Cookie tecnici — necessari">
        <p>
          I cookie tecnici sono indispensabili per il corretto funzionamento del sito e non richiedono
          il consenso dell'utente ai sensi dell'art. 122 del Codice Privacy e delle Linee Guida del Garante.
          Non è possibile disattivarli senza compromettere il funzionamento del servizio.
        </p>
        <p>
          Questi cookie non raccolgono informazioni sull'utente che possano essere utilizzate per scopi
          di marketing e non memorizzano quale sito hai visitato in precedenza.
        </p>
      </Section>

      <Section title="4. Cookie di terze parti">
        <p>
          Il sito utilizza i seguenti servizi di terze parti che potrebbero impostare cookie tecnici propri:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>
            <strong>Supabase</strong> — database e autenticazione. Cookie tecnici per la gestione della sessione admin.
            <a href="https://supabase.com/privacy" target="_blank" rel="noreferrer"
              className="text-blue-600 underline ml-1 text-sm">Privacy Policy Supabase</a>
          </li>
          <li>
            <strong>Cloudflare</strong> — hosting e CDN. Cookie tecnici per sicurezza e prestazioni.
            <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noreferrer"
              className="text-blue-600 underline ml-1 text-sm">Privacy Policy Cloudflare</a>
          </li>
        </ul>
      </Section>

      <Section title="5. Come gestire i cookie">
        <p>
          Puoi configurare il tuo browser per bloccare o eliminare i cookie. Tieni presente che
          disabilitare i cookie tecnici potrebbe compromettere il funzionamento del sito.
          Ecco come gestire i cookie nei principali browser:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noreferrer" className="text-blue-600 underline">Google Chrome</a></li>
          <li><a href="https://support.mozilla.org/it/kb/Attivare%20e%20disattivare%20i%20cookie" target="_blank" rel="noreferrer" className="text-blue-600 underline">Mozilla Firefox</a></li>
          <li><a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noreferrer" className="text-blue-600 underline">Apple Safari</a></li>
          <li><a href="https://support.microsoft.com/it-it/microsoft-edge/eliminare-i-cookie-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noreferrer" className="text-blue-600 underline">Microsoft Edge</a></li>
        </ul>
      </Section>

      <Section title="6. Aggiornamenti alla Cookie Policy">
        <p>
          Ci riserviamo il diritto di aggiornare questa Cookie Policy in qualsiasi momento.
          Le modifiche saranno pubblicate su questa pagina con l'indicazione della data di aggiornamento.
          Ti invitiamo a consultare periodicamente questa pagina.
        </p>
      </Section>

      <Section title="7. Contatti">
        <p>
          Per qualsiasi domanda relativa all'utilizzo dei cookie su questo sito puoi contattarci
          tramite il modulo di contatto disponibile sul sito o scrivendo all'indirizzo email
          indicato nel footer.
        </p>
      </Section>

      <div className="mt-10 pt-6 border-t border-slate-100 text-xs text-slate-400 text-center">
        eUtenti — Associazione di affiancamento agli utenti · Cookie Policy v1.0 · Marzo 2026
      </div>
    </motion.div>
  )
}

export default CookiePolicy
