# Comparatore Energia - Sistema Multi-Step

Sistema completo per il confronto bollette energetiche con funnel a 6 step.

## 🚀 Quick Start

### 1. Setup Supabase

1. Vai su [supabase.com](https://supabase.com) e crea un nuovo progetto
2. Nella sezione SQL Editor, esegui il file `database/schema.sql`
3. Copia le credenziali:
   - Project URL
   - Anon/Public Key

### 2. Setup Cloudflare Pages

1. Fai fork del repository su GitHub
2. Vai su [dash.cloudflare.com](https://dash.cloudflare.com)
3. Pages → Create a project → Connect to Git
4. Seleziona il repository
5. Configurazione build:
   - Framework preset: `Create React App`
   - Build command: `npm run build`
   - Build output directory: `build`

### 3. Variabili d'Ambiente Cloudflare

Nelle impostazioni del progetto su Cloudflare Pages, aggiungi:

```
REACT_APP_SUPABASE_URL=tua_supabase_url
REACT_APP_SUPABASE_ANON_KEY=tua_supabase_key
REACT_APP_EMAILJS_SERVICE_ID=tuo_service_id
REACT_APP_EMAILJS_TEMPLATE_CLIENT=template_cliente
REACT_APP_EMAILJS_TEMPLATE_OPERATOR=template_operatore
REACT_APP_EMAILJS_PUBLIC_KEY=tua_public_key
```

### 4. Setup EmailJS

1. Vai su [emailjs.com](https://www.emailjs.com) e crea un account
2. Crea un servizio email
3. Crea due template:
   - **Template Cliente**: Vedi `email-templates/template-cliente.html`
   - **Template Operatore**: Vedi `email-templates/template-operatore.html`
4. Copia Service ID, Template IDs e Public Key

### 5. Installazione Locale (per sviluppo)

```bash
npm install
npm start
```

L'app sarà disponibile su `http://localhost:3000`

## 📁 Struttura Progetto

```
comparatore-energia/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── Step1TipoCliente.jsx    # Privato/P.Iva/Azienda
│   │   ├── Step2Consumi.jsx         # Servizio, potenza, consumi
│   │   ├── Step3Confronto.jsx       # Calcoli e confronto offerte
│   │   ├── Step4DettaglioOfferta.jsx # Dettagli completi offerta
│   │   ├── Step5Anagrafica.jsx      # Raccolta dati anagrafici
│   │   ├── Step6Conferma.jsx        # Conferma e ringraziamento
│   │   └── ProgressBar.jsx          # Barra di progresso
│   ├── services/
│   │   ├── supabaseClient.js        # Client Supabase
│   │   ├── offerteService.js        # Logica calcolo offerte
│   │   └── emailService.js          # Invio email EmailJS
│   ├── utils/
│   │   ├── calculator.js            # Calcoli bolletta
│   │   └── validators.js            # Validazione form
│   ├── styles/
│   │   └── App.css                  # Stili globali
│   ├── App.jsx                      # Component principale
│   └── index.js                     # Entry point
├── database/
│   └── schema.sql                   # Schema database (dal tuo file)
├── email-templates/
│   ├── template-cliente.html        # Template email cliente
│   └── template-operatore.html      # Template email operatore
├── package.json
└── README.md
```

## 🔧 Configurazione Database

Il database Supabase utilizza lo schema fornito. Assicurati di:

1. Eseguire tutto il file `database/schema.sql`
2. Inserire almeno 1-2 offerte di test nella tabella `offerte`
3. Verificare che i fornitori siano attivi

## 📊 Flusso Applicazione

### Step 1: Tipo Cliente
- Selezione: Privato / P.Iva / Azienda
- Salvataggio immediato in `leads` con stato `solo_email`

### Step 2: Consumi e Contatti
- Scelta servizio (Luce/Gas/Dual)
- Potenza contatore (3kW, 4.5kW, 6kW, ecc.)
- Spesa mensile bolletta
- Consumo annuo
- **Email obbligatoria** → Salva in DB

### Step 3: Confronto Offerte
- Calcolo automatico migliore offerta
- Visualizzazione risparmio potenziale
- Due scenari:
  - **Migliorativa**: Mostra calcoli e richiede telefono
  - **Non migliorativa**: Messaggio "Ti avviseremo" + exit

### Step 4: Dettaglio Offerta
- Logo fornitore
- Nome offerta completo
- Condizioni dettagliate
- Agevolazioni
- Button "Prosegui" → Step 5

### Step 5: Anagrafica Completa
- Nome, Cognome, Codice Fiscale
- Indirizzo completo
- Dati fornitura (POD/PDR)
- Consensi privacy
- Salvataggio completo in `pre_contratti`

### Step 6: Conferma e Invio Email
- Messaggio ringraziamento
- Informazioni su prossimi step
- **Invio automatico 2 email**:
  1. Cliente: Riepilogo offerta
  2. Operatore: Nuova pratica da gestire

## 🎨 Personalizzazione

### Colori Brand
Modifica in `src/styles/App.css`:
```css
:root {
  --primary-color: #007bff;
  --secondary-color: #28a745;
  --danger-color: #dc3545;
}
```

### Offerte
Gestisci le offerte direttamente da Supabase nella tabella `offerte`.

### Email Templates
Personalizza i template in `email-templates/` e caricali su EmailJS.

## 🔒 Sicurezza

- Tutte le chiavi API sono in variabili d'ambiente
- Supabase RLS (Row Level Security) attivo
- Validazione input lato client e server
- Sanitizzazione dati prima del salvataggio

## 📱 Responsive

- Mobile-first design
- Ottimizzato per smartphone (target principale)
- Funziona su tablet e desktop

## 🐛 Troubleshooting

### Errore connessione Supabase
- Verifica URL e chiavi in `.env`
- Controlla che RLS sia configurato correttamente

### Email non inviate
- Verifica credenziali EmailJS
- Controlla template IDs
- Verifica limiti piano EmailJS

### Offerte non visualizzate
- Verifica che `visibile = true` in tabella offerte
- Controlla date validità offerte
- Verifica che fornitore sia `attivo = true`

## 📞 Supporto

Per problemi o domande, contatta il team di sviluppo.

## 📄 Licenza

Proprietario: [Il tuo nome/azienda]
Tutti i diritti riservati.
