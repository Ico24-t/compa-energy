# Comparatore Energia - Documentazione Completa

Sistema completo per il confronto di offerte energia (Luce, Gas, Dual) con gestione automatizzata dei lead e invio email.

## 📋 Indice

1. [Panoramica](#panoramica)
2. [Tecnologie Utilizzate](#tecnologie-utilizzate)
3. [Struttura Progetto](#struttura-progetto)
4. [Configurazione Passo-Passo](#configurazione-passo-passo)
5. [Deployment](#deployment)
6. [Funzionalità](#funzionalità)

---

## 🎯 Panoramica

Sistema web responsive per:
- ✅ Confronto offerte luce, gas e dual
- ✅ Form multi-step con salvataggio automatico
- ✅ Calcolo risparmio automatico
- ✅ Caricamento bolletta con OCR
- ✅ Invio email automatiche (cliente + operatore)
- ✅ Gestione lead nel database
- ✅ Dashboard admin (da implementare)

## 🛠 Tecnologie Utilizzate

### Frontend
- **React 18** - Framework UI
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animazioni
- **React Router** - Navigazione
- **Lucide React** - Icone

### Backend & Servizi
- **Supabase** - Database PostgreSQL + Auth
- **EmailJS** - Invio email automatiche
- **Cloudflare Pages** - Hosting e CDN
- **GitHub** - Version control e CI/CD

### Librerie Aggiuntive
- **Tesseract.js** - OCR per bollette
- **React Dropzone** - Upload file

---

## 📁 Struttura Progetto

```
comparatore-energia/
├── public/                    # File statici
├── src/
│   ├── components/           # Componenti React
│   │   ├── Step1ClientType.jsx
│   │   ├── Step2Consumption.jsx
│   │   ├── Step3OfferCalculation.jsx
│   │   ├── Step4OfferDetails.jsx
│   │   ├── Step5PersonalData.jsx
│   │   ├── Step6Confirmation.jsx
│   │   ├── ProgressSteps.jsx
│   │   ├── Header.jsx
│   │   └── Footer.jsx
│   ├── contexts/             # Context API
│   │   └── FormContext.jsx
│   ├── pages/               # Pagine principali
│   │   ├── MainForm.jsx
│   │   └── BillUpload.jsx
│   ├── services/            # Servizi API
│   │   ├── supabase.js
│   │   ├── api.js
│   │   └── emailService.js
│   ├── utils/               # Utility functions
│   │   ├── calculations.js
│   │   └── validation.js
│   ├── styles/              # CSS globali
│   │   └── index.css
│   ├── App.jsx              # App principale
│   └── main.jsx             # Entry point
├── .env.example             # Template variabili ambiente
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## ⚙️ Configurazione Passo-Passo

### 1. Setup Iniziale

```bash
# Clona il repository (dopo averlo creato su GitHub)
git clone https://github.com/tuo-username/comparatore-energia.git
cd comparatore-energia

# Installa dipendenze
npm install
```

### 2. Configurazione Supabase

#### A. Crea Progetto
1. Vai su [supabase.com](https://supabase.com)
2. Crea nuovo progetto
3. Annota URL e anon key

#### B. Setup Database
1. Nel pannello Supabase, vai su **SQL Editor**
2. Copia il contenuto del file `supabase_compa-energy.sql`
3. Esegui lo script per creare tutte le tabelle

#### C. Configura RLS (Row Level Security)
```sql
-- Abilita RLS per tutte le tabelle
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumi_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE offerte ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornitori ENABLE ROW LEVEL SECURITY;
ALTER TABLE calcolo_offerta ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_contratti ENABLE ROW LEVEL SECURITY;

-- Policy per lettura pubblica offerte e fornitori
CREATE POLICY "Lettura pubblica offerte"
ON offerte FOR SELECT
TO anon
USING (visibile = true);

CREATE POLICY "Lettura pubblica fornitori"
ON fornitori FOR SELECT
TO anon
USING (attivo = true);

-- Policy per inserimento leads (solo insert)
CREATE POLICY "Inserimento leads pubblico"
ON leads FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Update leads pubblico"
ON leads FOR UPDATE
TO anon
USING (true);

-- Policy per inserimento consumi
CREATE POLICY "Inserimento consumi pubblico"
ON consumi_cliente FOR INSERT
TO anon
WITH CHECK (true);

-- Policy per inserimento calcoli
CREATE POLICY "Inserimento calcoli pubblico"
ON calcolo_offerta FOR INSERT
TO anon
WITH CHECK (true);

-- Policy per inserimento pre-contratti
CREATE POLICY "Inserimento pre-contratti pubblico"
ON pre_contratti FOR INSERT
TO anon
WITH CHECK (true);
```

#### D. Inserisci Dati di Test
```sql
-- Inserisci fornitori di esempio (già presente nello script principale)
-- Aggiungi le tue offerte reali qui
INSERT INTO offerte (
  fornitore_id,
  nome_offerta,
  descrizione_breve,
  descrizione_completa,
  tipo_fornitura,
  prezzo_kwh,
  quota_fissa_luce_mensile,
  green_energy,
  visibile,
  data_inizio
) VALUES (
  (SELECT id FROM fornitori WHERE nome = 'ENEL Energia'),
  'Offerta Luce Verde',
  'Energia 100% rinnovabile con prezzo bloccato',
  'Offerta con energia certificata da fonti rinnovabili, prezzo fisso per 12 mesi',
  'luce',
  0.125,
  8.50,
  true,
  true,
  CURRENT_DATE
);
```

### 3. Configurazione EmailJS

#### A. Setup Account
1. Vai su [emailjs.com](https://www.emailjs.com)
2. Crea account gratuito
3. Crea nuovo service (es. Gmail, Outlook)

#### B. Crea Template Email Cliente
```
Subject: La tua offerta energia personalizzata - Codice {{lead_code}}

Ciao {{customer_name}},

Grazie per aver richiesto un preventivo!

Ecco la tua offerta personalizzata:

🔌 Tipo: {{offer_type}}
💰 Risparmio annuo: €{{annual_savings}}
📊 Spesa attuale: €{{current_cost}}/anno
✨ Nuova spesa: €{{new_cost}}/anno

Fornitore: {{supplier_name}}

{{offer_details}}

Un nostro operatore ti contatterà entro 24 ore per finalizzare l'offerta.

Il tuo codice pratica: {{lead_code}}

Per domande: tuaemail@esempio.it

Cordiali saluti,
Il Team Comparatore Energia
```

#### C. Crea Template Email Operatore
```
Subject: Nuova richiesta offerta - {{lead_code}}

NUOVA RICHIESTA OFFERTA

Codice: {{lead_code}}
Data: {{created_at}}

CLIENTE:
Nome: {{customer_name}}
Email: {{customer_email}}
Telefono: {{customer_phone}}
Tipo: {{customer_type}}

SERVIZIO:
Tipo: {{service_type}}
Consumo Luce: {{annual_consumption_kwh}} kWh
Consumo Gas: {{annual_consumption_smc}} Smc
Spesa Mensile: €{{current_monthly_cost}}

OFFERTA:
Fornitore: {{supplier_name}}
Risparmio Annuo: €{{annual_savings}}

INDIRIZZO:
{{address}}
{{city}} ({{province}})

NOTE:
{{notes}}
```

### 4. Configurazione File .env

Copia `.env.example` in `.env` e compila:

```env
# SUPABASE
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...

# EMAILJS
VITE_EMAILJS_SERVICE_ID=service_xxx
VITE_EMAILJS_TEMPLATE_ID_CUSTOMER=template_xxx
VITE_EMAILJS_TEMPLATE_ID_OPERATOR=template_yyy
VITE_EMAILJS_PUBLIC_KEY=xxx

# APP
VITE_APP_NAME=Comparatore Energia
VITE_APP_URL=https://tuo-dominio.com
VITE_OPERATOR_EMAIL=tuaemail@esempio.it
VITE_OPERATOR_PHONE=+39 123 456 7890
```

### 5. Test Locale

```bash
# Avvia server di sviluppo
npm run dev

# Apri browser su http://localhost:3000
```

---

## 🚀 Deployment

### Opzione 1: Cloudflare Pages (Consigliato)

#### A. Setup GitHub
```bash
# Inizializza repository
git init
git add .
git commit -m "Initial commit"

# Crea repository su GitHub e collega
git remote add origin https://github.com/tuo-username/comparatore-energia.git
git push -u origin main
```

#### B. Deploy su Cloudflare Pages
1. Vai su [dash.cloudflare.com](https://dash.cloudflare.com)
2. Pages → Create a project
3. Connect to Git → Seleziona il tuo repository
4. Build settings:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Environment variables: Aggiungi tutte le variabili del file `.env`
6. Save and Deploy

#### C. Dominio Personalizzato
1. Pages → Il tuo progetto → Custom domains
2. Add custom domain
3. Segui istruzioni DNS

### Opzione 2: Deploy Manuale

```bash
# Build per produzione
npm run build

# Upload contenuto cartella dist/ sul tuo hosting
```

---

## ✨ Funzionalità

### Form Multi-Step

1. **Step 1** - Tipo Cliente
   - Privato / P.IVA / Azienda
   - Auto-advance dopo selezione

2. **Step 2** - Consumi e Contatti
   - Tipo servizio (Luce/Gas/Dual)
   - Potenza contatore
   - Consumi (opzionali)
   - Spesa mensile
   - Email + Privacy
   - Salvataggio lead in DB

3. **Step 3** - Calcolo Offerta
   - Ricerca migliore offerta
   - Calcolo risparmio
   - Se conveniente: mostra risparmio + richiede telefono
   - Se non conveniente: informa cliente

4. **Step 4** - Dettagli Offerta
   - Mostra logo fornitore
   - Dettagli completi offerta
   - Vantaggi e condizioni
   - CTA per proseguire

5. **Step 5** - Anagrafica
   - Dati personali
   - Indirizzo fornitura
   - Codici POD/PDR (opzionali)
   - Note

6. **Step 6** - Conferma
   - Riepilogo
   - Invio email automatiche
   - Prossimi passi

### Caricamento Bolletta (OCR)

- Upload immagine/PDF bolletta
- Estrazione automatica dati:
  - Consumi (kWh/Smc)
  - Spesa
  - Potenza
  - Codici POD/PDR
- Pre-compilazione form

### Sistema Email Automatico

- Email cliente con offerta
- Email operatore con dettagli lead
- Codice pratica univoco

---

## 🔧 Manutenzione

### Aggiungere Nuove Offerte

```sql
INSERT INTO offerte (
  fornitore_id,
  nome_offerta,
  descrizione_breve,
  tipo_fornitura,
  prezzo_kwh,
  -- altri campi
) VALUES (
  (SELECT id FROM fornitori WHERE nome = 'Nome Fornitore'),
  'Nome Offerta',
  'Descrizione',
  'luce',
  0.12,
  -- altri valori
);
```

### Monitoraggio Lead

```sql
-- Lead di oggi
SELECT * FROM vw_leads_oggi;

-- Lead per stato
SELECT stato, COUNT(*) 
FROM leads 
GROUP BY stato;

-- Offerte più performanti
SELECT * FROM vw_offerte_redditizie;
```

### Aggiornamento Commissioni

```sql
INSERT INTO commissioni (
  offerta_id,
  tipo_commissione,
  importo_fisso,
  valido_da
) VALUES (
  'uuid-offerta',
  'fissa',
  150.00,
  CURRENT_DATE
);
```

---

## 🐛 Troubleshooting

### Errore: "Cannot connect to Supabase"
- Verifica URL e anon key in `.env`
- Controlla che RLS policies siano configurate
- Verifica connessione internet

### Email non arrivano
- Verifica credenziali EmailJS
- Controlla spam/junk
- Verifica template IDs corretti
- Controlla console browser per errori

### OCR non funziona
- Usa immagini chiare e nitide
- Formato supportato: JPG, PNG, PDF
- Max 10MB
- Prova con browser diverso

### Build fallisce
- Esegui `npm install` per dipendenze
- Verifica sintassi JSX
- Controlla log di build

---

## 📞 Supporto

Per domande o problemi:
- Email: tuaemail@esempio.it
- GitHub Issues: [Repository Issues](https://github.com/tuo-username/comparatore-energia/issues)

---

## 📄 Licenza

Tutti i diritti riservati © 2024

---

## 🎉 Contributi

Contributi benvenuti! Apri una Pull Request.

