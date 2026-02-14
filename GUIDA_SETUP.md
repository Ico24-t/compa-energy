# 🚀 Guida Completa al Setup

## Indice
1. [Setup Supabase](#1-setup-supabase)
2. [Setup EmailJS](#2-setup-emailjs)
3. [Setup Cloudflare Pages](#3-setup-cloudflare-pages)
4. [Test Locale](#4-test-locale-opzionale)
5. [Popolamento Database](#5-popolamento-database)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Setup Supabase

### Passo 1: Crea un Progetto Supabase
1. Vai su https://supabase.com
2. Fai login o registrati
3. Clicca su "New Project"
4. Compila i campi:
   - **Name:** `comparatore-energia` (o il nome che preferisci)
   - **Database Password:** Scegli una password sicura (salvala!)
   - **Region:** Scegli la più vicina all'Italia (es. Frankfurt)
5. Clicca "Create new project"
6. Attendi 2-3 minuti per la creazione

### Passo 2: Esegui lo Schema SQL
1. Nel progetto Supabase, vai su **SQL Editor** (nella barra laterale)
2. Clicca su "New query"
3. Copia l'intero contenuto del file `database/schema.sql`
4. Incollalo nell'editor
5. Clicca "Run" in basso a destra
6. Attendi il completamento (dovrebbe dire "Success")

### Passo 3: Verifica Tabelle Create
1. Vai su **Table Editor**
2. Dovresti vedere tutte le tabelle create:
   - `fornitori`
   - `offerte`
   - `leads`
   - `consumi_cliente`
   - `calcolo_offerta`
   - `pre_contratti`
   - `admin_pannello`
   - Altre...

### Passo 4: Ottieni le Credenziali
1. Vai su **Project Settings** (icona ingranaggio in basso)
2. Clicca su **API**
3. Copia questi valori (li userai dopo):
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon/public key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Passo 5: Configura RLS (Row Level Security)
Per ora, disabilita RLS per semplificare lo sviluppo:
1. Vai su **Authentication** → **Policies**
2. Per ogni tabella, clicca "Disable RLS" (lo abiliteremo dopo)

**IMPORTANTE:** In produzione, dovrai configurare correttamente RLS!

---

## 2. Setup EmailJS

### Passo 1: Crea Account EmailJS
1. Vai su https://www.emailjs.com
2. Clicca "Sign Up"
3. Registrati con la tua email
4. Verifica l'email ricevuta

### Passo 2: Aggiungi un Servizio Email
1. Vai su **Email Services**
2. Clicca "Add New Service"
3. Scegli il tuo provider email (es. Gmail, Outlook)
4. Segui le istruzioni per collegare la tua email
5. **Salva il Service ID** (es. `service_abc123`)

### Passo 3: Crea Template per Cliente
1. Vai su **Email Templates**
2. Clicca "Create New Template"
3. Nella sezione HTML, incolla il contenuto di `email-templates/template-cliente.html`
4. Clicca "Save"
5. **Salva il Template ID** (es. `template_xyz789`)

### Passo 4: Crea Template per Operatore
1. Clicca di nuovo su "Create New Template"
2. Incolla il contenuto di `email-templates/template-operatore.html`
3. Clicca "Save"
4. **Salva anche questo Template ID**

### Passo 5: Ottieni Public Key
1. Vai su **Account** → **General**
2. Nella sezione "API Keys", copia la **Public Key**
3. **Salvala** (es. `user_abc123xyz`)

### Passo 6: Test (Opzionale)
1. Nella pagina del template, clicca "Test"
2. Compila i valori di esempio
3. Clicca "Send Test Email"
4. Verifica di aver ricevuto l'email

---

## 3. Setup Cloudflare Pages

### Passo 1: Carica il Codice su GitHub
1. Vai su https://github.com
2. Crea un nuovo repository (es. `comparatore-energia`)
3. Carica tutti i file del progetto:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TUO-USERNAME/comparatore-energia.git
git push -u origin main
```

### Passo 2: Crea Progetto Cloudflare Pages
1. Vai su https://dash.cloudflare.com
2. Fai login o registrati
3. Nel menu laterale, clicca **Pages**
4. Clicca "Create a project"
5. Scegli "Connect to Git"
6. Autorizza GitHub
7. Seleziona il repository `comparatore-energia`
8. Clicca "Begin setup"

### Passo 3: Configura Build
Compila i campi come segue:
- **Project name:** `comparatore-energia`
- **Production branch:** `main`
- **Framework preset:** `Create React App`
- **Build command:** `npm run build`
- **Build output directory:** `build`

### Passo 4: Aggiungi Variabili d'Ambiente
1. Scorri fino a "Environment variables"
2. Clicca "Add variable" per ciascuna:

```
REACT_APP_SUPABASE_URL = https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY = eyJhbGciOiJIUz...
REACT_APP_EMAILJS_SERVICE_ID = service_abc123
REACT_APP_EMAILJS_TEMPLATE_CLIENT = template_xyz789
REACT_APP_EMAILJS_TEMPLATE_OPERATOR = template_xyz790
REACT_APP_EMAILJS_PUBLIC_KEY = user_abc123xyz
```

### Passo 5: Deploy
1. Clicca "Save and Deploy"
2. Attendi il completamento del build (2-3 minuti)
3. Una volta completato, clicca sul link per vedere il sito live!

### Passo 6: Dominio Personalizzato (Opzionale)
1. Nella pagina del progetto, clicca "Custom domains"
2. Clicca "Set up a custom domain"
3. Inserisci il tuo dominio (es. `comparatore.tuosito.it`)
4. Segui le istruzioni DNS

---

## 4. Test Locale (Opzionale)

Se vuoi testare in locale prima del deploy:

### Passo 1: Installa Dipendenze
```bash
cd comparatore-energia
npm install
```

### Passo 2: Crea File .env
Crea un file `.env` nella root del progetto:
```
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGci...
REACT_APP_EMAILJS_SERVICE_ID=service_abc123
REACT_APP_EMAILJS_TEMPLATE_CLIENT=template_xyz789
REACT_APP_EMAILJS_TEMPLATE_OPERATOR=template_xyz790
REACT_APP_EMAILJS_PUBLIC_KEY=user_abc123xyz
```

### Passo 3: Avvia Development Server
```bash
npm start
```

Il sito sarà disponibile su `http://localhost:3000`

---

## 5. Popolamento Database

### Inserire Fornitori
Vai su Supabase → Table Editor → `fornitori` → Insert row:

**Esempio 1:**
```
nome: Enel Energia
email_operatore: tuaemail@esempio.it
fornisce_luce: true
fornisce_gas: true
attivo: true
priorita: 10
```

**Esempio 2:**
```
nome: Eni Plenitude
email_operatore: tuaemail@esempio.it
fornisce_luce: true
fornisce_gas: true
attivo: true
priorita: 20
```

### Inserire Offerte
Vai su Table Editor → `offerte` → Insert row:

**Esempio Offerta Luce:**
```
fornitore_id: [ID del fornitore creato sopra]
nome_offerta: Luce Web Special
tipo_fornitura: luce
prezzo_kwh: 0.120000
quota_fissa_luce_mensile: 8.50
potenza_contrattuale: 3.000
durata_mesi: 12
green_energy: true
digitale: true
data_inizio: 2026-01-01
visibile: true
priorita_visualizzazione: 50
```

**Esempio Offerta Dual:**
```
fornitore_id: [ID del fornitore]
nome_offerta: Dual Energy Plus
tipo_fornitura: dual
prezzo_kwh: 0.115000
prezzo_smc: 0.850000
quota_fissa_luce_mensile: 7.00
quota_fissa_gas_mensile: 6.00
durata_mesi: 24
green_energy: true
data_inizio: 2026-01-01
visibile: true
```

### Inserire Commissioni (Opzionale)
Vai su Table Editor → `commissioni` → Insert row:
```
offerta_id: [ID dell'offerta]
tipo_commissione: fissa
importo_fisso: 50.00
valido_da: 2026-01-01
```

---

## 6. Troubleshooting

### Problema: Email non arrivano
**Soluzione:**
1. Verifica che EmailJS Service ID, Template IDs e Public Key siano corretti
2. Controlla lo spam
3. Verifica il limite del piano EmailJS (200 email/mese nel piano gratuito)
4. Testa i template direttamente da EmailJS

### Problema: Errore "Supabase URL not found"
**Soluzione:**
1. Verifica che le variabili d'ambiente siano configurate in Cloudflare
2. Se test locale, verifica il file `.env`
3. Riavvia il server di sviluppo dopo aver modificato `.env`

### Problema: Offerte non vengono visualizzate
**Soluzione:**
1. Verifica che ci siano offerte nel database con `visibile = true`
2. Verifica che `data_inizio` sia nel passato o oggi
3. Verifica che `data_fine` sia null o nel futuro
4. Verifica che il fornitore sia `attivo = true`
5. Controlla la console browser per errori

### Problema: Build fallito su Cloudflare
**Soluzione:**
1. Verifica che `package.json` sia presente
2. Verifica che non ci siano errori di sintassi nel codice
3. Controlla i log di build in Cloudflare
4. Prova a buildare in locale: `npm run build`

### Problema: Dati non vengono salvati
**Soluzione:**
1. Verifica RLS settings in Supabase
2. Temporaneamente disabilita RLS per debug
3. Controlla la console browser per errori
4. Verifica che le tabelle esistano

---

## 🎉 Congratulazioni!

Se hai seguito tutti i passi, il tuo comparatore energia dovrebbe essere online e funzionante!

### Prossimi Passi Consigliati:
1. **Personalizza i colori** modificando le variabili CSS in `src/styles/App.css`
2. **Aggiungi logo** nella cartella `public/`
3. **Configura RLS** su Supabase per sicurezza
4. **Aggiungi più offerte** nel database
5. **Monitora le conversioni** con Google Analytics (opzionale)
6. **Crea dashboard admin** per gestire lead e offerte

### Supporto
Per problemi o domande:
- Consulta la documentazione Supabase: https://supabase.com/docs
- Consulta la documentazione EmailJS: https://www.emailjs.com/docs/
- Consulta la documentazione Cloudflare Pages: https://developers.cloudflare.com/pages/

Buon lavoro! 🚀
