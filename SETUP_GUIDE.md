# Guida Setup Completa - Comparatore Energia

Questa guida ti accompagnerà passo-passo nella configurazione completa del sistema, anche senza un PC fisso.

---

## 📱 Requisiti

- Account GitHub
- Account Supabase (gratuito)
- Account EmailJS (gratuito)
- Account Cloudflare (gratuito)
- Browser web moderno

**IMPORTANTE**: Tutto può essere fatto online, non serve PC fisso!

---

## 1️⃣ Setup GitHub (10 minuti)

### A. Crea Repository

1. Vai su [github.com](https://github.com)
2. Clicca su "New repository"
3. Nome: `comparatore-energia`
4. Descrizione: `Sistema comparazione offerte energia`
5. Pubblico o Privato (a tua scelta)
6. NON aggiungere README, .gitignore, license
7. Clicca "Create repository"

### B. Carica File

#### Opzione 1: GitHub Web (più facile senza PC)

1. Nel repository appena creato, clicca "uploading an existing file"
2. Trascina TUTTI i file del progetto (ricevuti in ZIP)
3. Scrivi commit message: "Initial commit"
4. Clicca "Commit changes"

#### Opzione 2: GitHub CLI (se hai accesso terminal)

```bash
# Scarica e decomprimi il progetto
unzip comparatore-energia.zip
cd comparatore-energia

# Inizializza e carica
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TUO-USERNAME/comparatore-energia.git
git push -u origin main
```

---

## 2️⃣ Setup Supabase (15 minuti)

### A. Crea Progetto

1. Vai su [supabase.com](https://supabase.com)
2. Clicca "Start your project"
3. Login con GitHub
4. "New Project"
5. Compila:
   - Name: `comparatore-energia`
   - Database Password: (genera una forte e SALVALA!)
   - Region: `Europe (Central)` (più vicina all'Italia)
   - Pricing Plan: Free
6. Clicca "Create new project"
7. Attendi 2-3 minuti per setup

### B. Ottieni Credenziali

1. Nel progetto, clicca l'icona "Settings" (⚙️) in basso a sinistra
2. Vai su "API"
3. Copia e salva:
   - **Project URL** (es: `https://xyz.supabase.co`)
   - **anon public** key (la chiave molto lunga)

### C. Setup Database

1. Nel menu laterale, clicca "SQL Editor"
2. Clicca "+ New query"
3. COPIA TUTTO il contenuto del file `supabase_compa-energy.sql`
4. INCOLLA nell'editor
5. Clicca "Run" (o F5)
6. Attendi completamento (dovrebbe dire "Success")
7. Verifica nella sezione "Table Editor" che le tabelle siano state create

### D. Configura Row Level Security

1. Sempre in "SQL Editor", nuova query
2. Copia e incolla questo codice:

```sql
-- Abilita RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumi_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE offerte ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornitori ENABLE ROW LEVEL SECURITY;
ALTER TABLE calcolo_offerta ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_contratti ENABLE ROW LEVEL SECURITY;

-- Policy lettura pubblica
CREATE POLICY "Lettura offerte pubbliche" ON offerte
FOR SELECT TO anon USING (visibile = true);

CREATE POLICY "Lettura fornitori attivi" ON fornitori
FOR SELECT TO anon USING (attivo = true);

-- Policy scrittura leads
CREATE POLICY "Inserimento leads" ON leads
FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Aggiornamento leads" ON leads
FOR UPDATE TO anon USING (true);

CREATE POLICY "Inserimento consumi" ON consumi_cliente
FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Inserimento calcoli" ON calcolo_offerta
FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Inserimento pre-contratti" ON pre_contratti
FOR INSERT TO anon WITH CHECK (true);
```

3. Clicca "Run"

### E. Inserisci Offerte di Test

1. Nuova query SQL
2. Modifica e inserisci le TUE offerte reali:

```sql
-- Esempio offerta luce
INSERT INTO offerte (
  fornitore_id,
  nome_offerta,
  descrizione_breve,
  descrizione_completa,
  tipo_fornitura,
  prezzo_kwh,
  quota_fissa_luce_mensile,
  potenza_contrattuale,
  tipo_tariffa_luce,
  green_energy,
  digitale,
  bonus_attivazione,
  durata_mesi,
  penale_recesso,
  visibile,
  data_inizio,
  priorita_visualizzazione
) VALUES (
  (SELECT id FROM fornitori WHERE nome = 'ENEL Energia'),
  'Energia Semplice Luce',
  'Prezzo bloccato per 12 mesi con energia verde',
  'Offerta con prezzo fisso garantito per 12 mesi. Energia 100% da fonti rinnovabili certificate. Gestione completamente digitale con app dedicata. Nessuna penale di recesso.',
  'luce',
  0.125,  -- €/kWh
  8.50,   -- quota fissa mensile
  3.0,    -- kW
  'monoraria',
  true,   -- energia verde
  true,   -- digitale
  50.00,  -- bonus attivazione
  12,     -- durata
  0,      -- nessuna penale
  true,   -- visibile
  CURRENT_DATE,
  90      -- priorità alta
);

-- Aggiungi commissione per questa offerta
INSERT INTO commissioni (
  offerta_id,
  tipo_commissione,
  importo_fisso,
  bonus_verde,
  valido_da
) VALUES (
  (SELECT id FROM offerte WHERE nome_offerta = 'Energia Semplice Luce'),
  'fissa',
  120.00,  -- commissione fissa
  20.00,   -- bonus extra per verde
  CURRENT_DATE
);
```

3. Ripeti per tutte le tue offerte
4. Clicca "Run"

---

## 3️⃣ Setup EmailJS (10 minuti)

### A. Crea Account

1. Vai su [emailjs.com](https://www.emailjs.com)
2. "Sign Up" gratis
3. Conferma email

### B. Aggiungi Email Service

1. Nella dashboard, clicca "Add New Service"
2. Scegli il tuo provider email:
   - **Gmail**: più semplice
   - **Outlook/Hotmail**: alternativa
   - **Other**: SMTP personalizzato
3. Per Gmail:
   - Clicca "Connect Account"
   - Autorizza EmailJS
4. Dai un nome al service (es: "Comparatore Energia")
5. Clicca "Create Service"
6. **SALVA** il Service ID (es: `service_abc123`)

### C. Crea Template Email Cliente

1. Vai su "Email Templates"
2. "Create New Template"
3. Template Name: `Cliente - Offerta Energia`
4. From Name: `Comparatore Energia`
5. From Email: La tua email
6. Subject: `La tua offerta energia - Codice {{lead_code}}`
7. Content (copia e personalizza):

```
Ciao {{customer_name}},

Grazie per aver richiesto un preventivo tramite il nostro comparatore!

=== LA TUA OFFERTA PERSONALIZZATA ===

🔌 Servizio: {{offer_type}}
💰 Risparmio annuo: € {{annual_savings}}
📊 Spesa attuale: € {{current_cost}}/anno
✨ Nuova spesa: € {{new_cost}}/anno

Fornitore proposto: {{supplier_name}}

{{offer_details}}

=== PROSSIMI PASSI ===

Un nostro operatore ti contatterà entro 24 ore per:
- Verificare i dati inseriti
- Rispondere alle tue domande
- Finalizzare l'offerta

Il tuo codice pratica: {{lead_code}}
Conservalo per future comunicazioni.

=== CONTATTI ===
Email: tuaemail@esempio.it
Telefono: +39 123 456 7890

Cordiali saluti,
Il Team di Comparatore Energia

---
Questa email è stata generata automaticamente.
Per non ricevere più comunicazioni, rispondi con "CANCELLAMI".
```

8. Clicca "Save"
9. **SALVA** il Template ID (es: `template_xyz789`)

### D. Crea Template Email Operatore

1. "Create New Template"
2. Template Name: `Operatore - Nuovo Lead`
3. Subject: `🆕 Nuova richiesta - {{lead_code}}`
4. Content:

```
=== NUOVA RICHIESTA OFFERTA ===

Codice Pratica: {{lead_code}}
Data/Ora: {{created_at}}

--- DATI CLIENTE ---
Nome: {{customer_name}}
Email: {{customer_email}}
Telefono: {{customer_phone}}
Tipo Cliente: {{customer_type}}

--- SERVIZIO RICHIESTO ---
Tipo: {{service_type}}
Consumo Luce: {{annual_consumption_kwh}} kWh/anno
Consumo Gas: {{annual_consumption_smc}} Smc/anno
Spesa Mensile Attuale: € {{current_monthly_cost}}

--- OFFERTA PROPOSTA ---
Fornitore: {{supplier_name}}
Risparmio Annuo Stimato: € {{annual_savings}}

--- INDIRIZZO FORNITURA ---
{{address}}
{{city}} ({{province}})

--- NOTE CLIENTE ---
{{notes}}

=== AZIONI RICHIESTE ===
1. Contattare il cliente entro 24h
2. Verificare i dati
3. Inviare documentazione
4. Seguire fino alla firma

Dashboard: https://tuo-dominio.com/admin
```

5. Salva
6. **SALVA** il Template ID

### E. Ottieni Public Key

1. Vai su "Account" → "General"
2. Trova "Public Key"
3. **SALVA** la chiave

---

## 4️⃣ Setup Cloudflare Pages (15 minuti)

### A. Crea Account

1. Vai su [cloudflare.com](https://cloudflare.com)
2. "Sign Up" gratis
3. Conferma email

### B. Connetti GitHub

1. Nel dashboard, vai su "Pages"
2. "Create a project"
3. "Connect to Git"
4. "Connect GitHub"
5. Autorizza Cloudflare
6. Seleziona il repository `comparatore-energia`

### C. Configura Build

1. Project name: `comparatore-energia`
2. Production branch: `main`
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Build output directory: `dist`
6. NON cliccare ancora "Save and Deploy"!

### D. Aggiungi Variabili Ambiente

Nella sezione "Environment variables", aggiungi TUTTE queste (clicca "+ Add variable" per ognuna):

```
VITE_SUPABASE_URL = https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGc...
VITE_EMAILJS_SERVICE_ID = service_xxx
VITE_EMAILJS_TEMPLATE_ID_CUSTOMER = template_xxx  
VITE_EMAILJS_TEMPLATE_ID_OPERATOR = template_yyy
VITE_EMAILJS_PUBLIC_KEY = xxx
VITE_APP_NAME = Comparatore Energia
VITE_APP_URL = https://comparatore-energia.pages.dev
VITE_OPERATOR_EMAIL = tuaemail@esempio.it
VITE_OPERATOR_PHONE = +39 123 456 7890
```

**IMPORTANTE**: Sostituisci tutti i valori `xxx` con le tue credenziali salvate precedentemente!

### E. Deploy!

1. Clicca "Save and Deploy"
2. Attendi 2-5 minuti
3. Il sito sarà disponibile su: `https://comparatore-energia.pages.dev`

### F. Dominio Personalizzato (Opzionale)

1. Nel progetto Cloudflare Pages, vai su "Custom domains"
2. "Set up a custom domain"
3. Inserisci il tuo dominio (es: `comparatore-energia.it`)
4. Segui le istruzioni per configurare DNS:
   - Aggiungi record CNAME che punta a `comparatore-energia.pages.dev`
5. Attendi propagazione DNS (5-30 minuti)

---

## 5️⃣ Test del Sistema (10 minuti)

### A. Test Frontend

1. Apri il sito: `https://comparatore-energia.pages.dev`
2. Verifica che si carichi correttamente
3. Prova a navigare tra le pagine

### B. Test Form Completo

1. Compila tutti gli step del form:
   - Step 1: Seleziona "Privato"
   - Step 2: Inserisci consumi e email VERA
   - Step 3: Inserisci telefono
   - Step 4: Visualizza offerta
   - Step 5: Compila anagrafica
   - Step 6: Conferma invio

### C. Verifica Email

1. Controlla la tua casella email
2. Dovresti ricevere l'email con l'offerta
3. Controlla anche spam/junk
4. Verifica email operatore

### D. Verifica Database

1. Vai su Supabase → Table Editor
2. Apri tabella `leads`
3. Verifica che il nuovo lead sia stato salvato
4. Controlla anche tabelle `consumi_cliente` e `pre_contratti`

---

## 6️⃣ Configurazione Finale

### A. Personalizza Contenuti

File da modificare (su GitHub o Cloudflare):

1. `index.html`: Titolo e meta description
2. `src/components/Header.jsx`: Logo e nome
3. `src/components/Footer.jsx`: Contatti e copyright
4. `README.md`: Informazioni progetto

### B. Aggiungi Favicon

1. Crea favicon.ico (usa [favicon.io](https://favicon.io))
2. Carica nella cartella `public/`
3. Aggiorna `index.html`:
```html
<link rel="icon" type="image/x-icon" href="/favicon.ico">
```

### C. Setup Analytics (Opzionale)

1. Crea account Google Analytics
2. Ottieni Tracking ID
3. Aggiungi in `.env`:
```
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

---

## ✅ Checklist Finale

Prima di andare live, verifica:

- [ ] Database Supabase configurato correttamente
- [ ] RLS policies attive
- [ ] Offerte inserite nel database
- [ ] EmailJS configurato e testato
- [ ] Cloudflare Pages deployed
- [ ] Variabili ambiente impostate
- [ ] Test form completo funzionante
- [ ] Email ricevute correttamente
- [ ] Dati salvati nel database
- [ ] Logo e branding personalizzati
- [ ] Contatti aggiornati
- [ ] Dominio personalizzato (se richiesto)

---

## 🆘 Problemi Comuni

### "Failed to fetch" o errori CORS
- Verifica URL Supabase in `.env`
- Controlla che RLS policies siano configurate
- Riavvia build Cloudflare

### Email non arrivano
- Verifica Template IDs corretti
- Controlla Public Key EmailJS
- Verifica spam/posta indesiderata
- Prova a inviare email di test da EmailJS dashboard

### Build fallisce su Cloudflare
- Verifica che tutte le variabili ambiente siano impostate
- Controlla log di build per errori specifici
- Verifica che il comando build sia `npm run build`

### Offerte non appaiono
- Verifica che siano impostate `visibile = true`
- Controlla date `data_inizio` e `data_fine`
- Verifica RLS policy per tabella offerte

---

## 📞 Supporto

Se hai problemi non risolti:

1. Controlla i log:
   - Cloudflare: Pages → Deployment → View logs
   - Browser: F12 → Console
   - Supabase: Logs

2. Consulta documentazione:
   - [Supabase Docs](https://supabase.com/docs)
   - [EmailJS Docs](https://www.emailjs.com/docs/)
   - [Cloudflare Docs](https://developers.cloudflare.com/pages/)

3. Community:
   - Stack Overflow
   - GitHub Issues del progetto

---

## 🎉 Complimenti!

Il tuo sistema è ora operativo!

Puoi monitorare i lead su Supabase e gestire le richieste via email.

**Prossimi passi suggeriti**:
- Implementa dashboard admin
- Aggiungi più offerte
- Configura domain personalizzato
- Setup backup automatico database
- Implementa notifiche SMS

