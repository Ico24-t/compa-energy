import React from 'react'
import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">{title}</h2>
    <div className="text-slate-600 leading-relaxed space-y-3">{children}</div>
  </div>
)

const TerminiCondizioni = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
    className="container mx-auto max-w-3xl px-4 py-10">

    <div className="flex items-center gap-4 mb-10">
      <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center flex-shrink-0">
        <FileText className="w-6 h-6 text-purple-600" />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Termini e Condizioni</h1>
        <p className="text-slate-500 text-sm mt-0.5">Ultimo aggiornamento: marzo 2026</p>
      </div>
    </div>

    <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 mb-8">
      <p className="text-sm text-purple-800 leading-relaxed">
        Leggere attentamente i presenti Termini e Condizioni prima di utilizzare il servizio.
        L'utilizzo del sito implica l'accettazione integrale di quanto qui indicato.
        <strong> eUtenti</strong> è un'associazione di affiancamento agli utenti, senza finalità commerciali dirette,
        che offre gratuitamente un servizio di orientamento e comparazione delle offerte energetiche.
      </p>
    </div>

    <Section title="1. Descrizione del servizio">
      <p>
        eUtenti mette a disposizione degli utenti uno strumento gratuito di comparazione delle offerte di fornitura
        di energia elettrica e gas naturale disponibili sul mercato libero italiano. Il servizio include:
      </p>
      <ul className="list-disc pl-5 space-y-1.5 mt-2">
        <li>Calcolo del risparmio potenziale rispetto alla fornitura attuale</li>
        <li>Presentazione delle offerte più convenienti disponibili</li>
        <li>Affiancamento nella procedura di cambio fornitore</li>
        <li>Analisi automatica della bolletta tramite tecnologia OCR (riconoscimento ottico dei caratteri)</li>
      </ul>
      <p>
        Il servizio è rivolto a utenti privati, professionisti e piccole imprese residenti o con utenza
        attiva nel territorio italiano.
      </p>
    </Section>

    <Section title="2. Gratuità del servizio">
      <p>
        Il servizio di comparazione e affiancamento offerto da eUtenti è completamente <strong>gratuito per l'utente</strong>.
        eUtenti può ricevere compensi dai fornitori energetici a titolo di commissione per le pratiche
        di cambio contratto concluse con successo. Tale compenso non incide in alcun modo sul costo
        del contratto energetico per l'utente, né pregiudica l'imparzialità della comparazione.
      </p>
    </Section>

    <Section title="3. Accuratezza delle informazioni">
      <p>
        eUtenti si impegna a mantenere aggiornate le offerte presenti nel comparatore. Tuttavia:
      </p>
      <ul className="list-disc pl-5 space-y-1.5 mt-2">
        <li>Le offerte e i prezzi potrebbero variare nel tempo senza preavviso da parte dei fornitori</li>
        <li>I calcoli di risparmio sono <strong>stime indicative</strong> basate sui dati forniti dall'utente
          e sulle condizioni di mercato al momento della comparazione</li>
        <li>L'analisi OCR della bolletta è automatica e potrebbe non essere sempre accurata al 100%;
          invitiamo a verificare i dati estratti prima di procedere</li>
        <li>eUtenti non garantisce che le offerte mostrate siano le migliori in assoluto sul mercato</li>
      </ul>
    </Section>

    <Section title="4. Obblighi dell'utente">
      <p>L'utente si impegna a:</p>
      <ul className="list-disc pl-5 space-y-1.5 mt-2">
        <li>Fornire informazioni veritiere, accurate e aggiornate durante l'utilizzo del servizio</li>
        <li>Non utilizzare il servizio per finalità illecite o contrarie alla buona fede</li>
        <li>Non caricare documenti che non gli appartengano o per i quali non abbia il diritto di trattamento</li>
        <li>Verificare sempre le condizioni contrattuali del fornitore prima di sottoscrivere un nuovo contratto</li>
      </ul>
    </Section>

    <Section title="5. Responsabilità">
      <p>
        eUtenti agisce come intermediario informativo e di affiancamento. La responsabilità contrattuale
        per la fornitura di energia rimane esclusivamente in capo al fornitore energetico scelto dall'utente.
        eUtenti non è parte del contratto di fornitura e non risponde di eventuali disservizi,
        variazioni di prezzo o comportamenti dei fornitori.
      </p>
      <p>
        eUtenti non può essere ritenuta responsabile per danni diretti o indiretti derivanti dall'uso
        o dall'impossibilità di utilizzo del servizio, da errori nei calcoli di risparmio o da
        informazioni non aggiornate sulle offerte.
      </p>
    </Section>

    <Section title="6. Proprietà intellettuale">
      <p>
        Tutti i contenuti del sito (testi, grafica, codice, loghi) sono di proprietà di eUtenti
        o dei rispettivi titolari e sono protetti dalle norme sul diritto d'autore.
        È vietata la riproduzione, anche parziale, senza previa autorizzazione scritta.
      </p>
    </Section>

    <Section title="7. Modifiche al servizio e ai termini">
      <p>
        eUtenti si riserva il diritto di modificare, sospendere o interrompere il servizio in qualsiasi
        momento, nonché di aggiornare i presenti Termini e Condizioni. Le modifiche saranno pubblicate
        su questa pagina con indicazione della data di aggiornamento. L'utilizzo continuato del servizio
        dopo la pubblicazione delle modifiche costituisce accettazione delle stesse.
      </p>
    </Section>

    <Section title="8. Legge applicabile e foro competente">
      <p>
        I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia derivante
        dall'utilizzo del servizio sarà competente il Foro del luogo di sede di eUtenti,
        salvo diversa disposizione di legge a tutela del consumatore.
      </p>
    </Section>

    <Section title="9. Contatti">
      <p>
        Per qualsiasi domanda relativa ai presenti Termini puoi contattarci tramite il modulo
        di contatto disponibile sul sito o scrivendo all'indirizzo email indicato nel footer.
      </p>
    </Section>

    <div className="mt-10 pt-6 border-t border-slate-100 text-xs text-slate-400 text-center">
      eUtenti — Associazione di affiancamento agli utenti · Termini e Condizioni v1.0 · Marzo 2026
    </div>
  </motion.div>
)

export default TerminiCondizioni
