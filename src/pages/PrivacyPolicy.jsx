import React from 'react'
import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">{title}</h2>
    <div className="text-slate-600 leading-relaxed space-y-3">{children}</div>
  </div>
)

const PrivacyPolicy = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
    className="container mx-auto max-w-3xl px-4 py-10">

    {/* Header */}
    <div className="flex items-center gap-4 mb-10">
      <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
        <Shield className="w-6 h-6 text-blue-600" />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mt-0.5">Ultimo aggiornamento: marzo 2026</p>
      </div>
    </div>

    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-8">
      <p className="text-sm text-blue-800 leading-relaxed">
        <strong>eUtenti</strong> è un'associazione di affiancamento agli utenti che ha come scopo migliorare la quotidianità
        dei propri assistiti, anche attraverso la ricerca delle migliori offerte energetiche disponibili sul mercato.
        La presente policy spiega come trattiamo i tuoi dati personali in conformità al Regolamento UE 2016/679 (GDPR).
      </p>
    </div>

    <Section title="1. Titolare del trattamento">
      <p>
        Il Titolare del trattamento è <strong>eUtenti</strong>, associazione di affiancamento agli utenti.
        Per esercitare i tuoi diritti o per qualsiasi domanda relativa alla privacy puoi contattarci all'indirizzo
        email indicato nel footer del sito.
      </p>
    </Section>

    <Section title="2. Dati raccolti">
      <p>Raccogliamo i seguenti dati personali esclusivamente su base volontaria:</p>
      <ul className="list-disc pl-5 space-y-1.5 mt-2">
        <li><strong>Dati anagrafici:</strong> nome, cognome, data e luogo di nascita, codice fiscale</li>
        <li><strong>Dati di contatto:</strong> indirizzo email, numero di telefono</li>
        <li><strong>Dati della fornitura:</strong> indirizzo di fornitura, codici POD/PDR, fornitore attuale</li>
        <li><strong>Dati di consumo:</strong> consumi energetici annui, spesa attuale</li>
        <li><strong>Documenti:</strong> copia della bolletta energetica (se caricata volontariamente)</li>
        <li><strong>Dati tecnici:</strong> indirizzo IP, tipo di dispositivo, browser (per sicurezza e analisi)</li>
      </ul>
    </Section>

    <Section title="3. Finalità e base giuridica del trattamento">
      <p>Trattiamo i tuoi dati per le seguenti finalità:</p>
      <ul className="list-disc pl-5 space-y-1.5 mt-2">
        <li><strong>Erogazione del servizio di comparazione:</strong> per calcolare il tuo risparmio potenziale e proporti
          le offerte più vantaggiose — base giuridica: esecuzione del contratto/servizio richiesto (art. 6.1.b GDPR)</li>
        <li><strong>Invio dell'offerta via email e contatto telefonico:</strong> per inviarti la proposta personalizzata
          — base giuridica: consenso (art. 6.1.a GDPR)</li>
        <li><strong>Marketing:</strong> solo previo consenso esplicito, per informarti su nuove offerte e promozioni
          — base giuridica: consenso (art. 6.1.a GDPR)</li>
        <li><strong>Obblighi di legge:</strong> per adempiere ad eventuali obblighi normativi
          — base giuridica: obbligo legale (art. 6.1.c GDPR)</li>
      </ul>
    </Section>

    <Section title="4. Conservazione dei dati">
      <p>
        I tuoi dati vengono conservati per il tempo strettamente necessario alle finalità per cui sono stati raccolti:
      </p>
      <ul className="list-disc pl-5 space-y-1.5 mt-2">
        <li>Dati di contatto e offerta: <strong>24 mesi</strong> dalla raccolta</li>
        <li>Dati contrattuali (se il contratto viene stipulato): <strong>10 anni</strong> per obblighi fiscali</li>
        <li>Documenti caricati (bollette): <strong>12 mesi</strong> dalla data di caricamento, salvo diversa richiesta</li>
        <li>Dati tecnici (IP, log): <strong>12 mesi</strong></li>
      </ul>
      <p className="mt-3">Trascorso tale periodo, i dati vengono eliminati o anonimizzati in modo irreversibile.</p>
    </Section>

    <Section title="5. Destinatari dei dati">
      <p>
        I tuoi dati non vengono venduti a terzi. Possono essere comunicati esclusivamente a:
      </p>
      <ul className="list-disc pl-5 space-y-1.5 mt-2">
        <li><strong>Fornitori di energia</strong> selezionati, per la gestione della pratica di cambio contratto,
          previa tua esplicita richiesta e consenso</li>
        <li><strong>Fornitori di servizi tecnici</strong> (hosting, database, email) che agiscono come Responsabili
          del trattamento ai sensi dell'art. 28 GDPR</li>
        <li><strong>Autorità competenti</strong> nei casi previsti dalla legge</li>
      </ul>
    </Section>

    <Section title="6. Trasferimento fuori dall'UE">
      <p>
        Alcuni servizi tecnici da noi utilizzati (come Supabase e Cloudflare) potrebbero trasferire dati al di fuori
        dello Spazio Economico Europeo. In tali casi, ci assicuriamo che il trasferimento avvenga nel rispetto delle
        garanzie previste dal GDPR (ad es. Clausole Contrattuali Standard o decisioni di adeguatezza).
      </p>
    </Section>

    <Section title="7. I tuoi diritti">
      <p>Ai sensi del GDPR hai il diritto di:</p>
      <ul className="list-disc pl-5 space-y-1.5 mt-2">
        <li><strong>Accesso:</strong> ottenere conferma che siano in corso trattamenti e ricevere una copia dei tuoi dati</li>
        <li><strong>Rettifica:</strong> richiedere la correzione di dati inesatti o incompleti</li>
        <li><strong>Cancellazione:</strong> richiedere la cancellazione dei tuoi dati ("diritto all'oblio")</li>
        <li><strong>Limitazione:</strong> richiedere la limitazione del trattamento in determinati casi</li>
        <li><strong>Portabilità:</strong> ricevere i tuoi dati in formato strutturato e leggibile da macchina</li>
        <li><strong>Opposizione:</strong> opporti al trattamento per finalità di marketing in qualsiasi momento</li>
        <li><strong>Revoca del consenso:</strong> revocare il consenso in qualsiasi momento senza pregiudicare
          la liceità del trattamento precedente</li>
      </ul>
      <p className="mt-3">
        Per esercitare i tuoi diritti puoi contattarci via email. Hai inoltre il diritto di proporre reclamo al
        Garante per la Protezione dei Dati Personali (<a href="https://www.garanteprivacy.it" target="_blank" rel="noreferrer"
          className="text-blue-600 underline">www.garanteprivacy.it</a>).
      </p>
    </Section>

    <Section title="8. Sicurezza">
      <p>
        Adottiamo misure tecniche e organizzative adeguate per proteggere i tuoi dati da accessi non autorizzati,
        perdita, distruzione o divulgazione. I dati sono archiviati su server con crittografia in transito (HTTPS)
        e a riposo, con accesso limitato al solo personale autorizzato.
      </p>
    </Section>

    <Section title="9. Cookie">
      <p>
        Per informazioni dettagliate sull'utilizzo dei cookie consulta la nostra{' '}
        <a href="/cookie-policy" className="text-blue-600 underline">Cookie Policy</a>.
      </p>
    </Section>

    <div className="mt-10 pt-6 border-t border-slate-100 text-xs text-slate-400 text-center">
      eUtenti — Associazione di affiancamento agli utenti · Privacy Policy v1.0 · Marzo 2026
    </div>
  </motion.div>
)

export default PrivacyPolicy
