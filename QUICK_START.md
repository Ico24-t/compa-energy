# Quick Start - Comparatore Energia ⚡

Vuoi partire subito? Segui questi 4 passaggi essenziali!

---

## 🚀 In 20 minuti sei online!

### 1. Scarica e Carica su GitHub (5 min)

```bash
# Se hai ricevuto il file ZIP
1. Decomprimi comparatore-energia.zip
2. Vai su github.com
3. Crea nuovo repository "comparatore-energia"
4. Upload tutti i file
5. Commit!
```

### 2. Setup Supabase (5 min)

```bash
1. Vai su supabase.com → New Project
2. Salva URL e anon key
3. SQL Editor → Copia/incolla supabase_compa-energy.sql → Run
4. Inserisci le tue offerte (vedi esempi nel file SQL)
```

### 3. Setup EmailJS (5 min)

```bash
1. Vai su emailjs.com → Sign Up
2. Add Service (Gmail/Outlook)
3. Create 2 Templates:
   - Cliente: usa template nel SETUP_GUIDE.md
   - Operatore: usa template nel SETUP_GUIDE.md
4. Salva Service ID, Template IDs, Public Key
```

### 4. Deploy Cloudflare (5 min)

```bash
1. Vai su cloudflare.com/pages
2. Connect GitHub repository
3. Framework: Vite
4. Build: npm run build
5. Output: dist
6. Environment Variables → Aggiungi tutte le credenziali
7. Deploy!
```

---

## 📝 Variabili Ambiente Necessarie

Copia questo template e compila con i tuoi dati:

```env
# Da Supabase (step 2)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

# Da EmailJS (step 3)
VITE_EMAILJS_SERVICE_ID=service_xxx
VITE_EMAILJS_TEMPLATE_ID_CUSTOMER=template_xxx
VITE_EMAILJS_TEMPLATE_ID_OPERATOR=template_xxx
VITE_EMAILJS_PUBLIC_KEY=xxx

# Personalizza questi
VITE_APP_NAME=Comparatore Energia
VITE_APP_URL=https://tuo-dominio.pages.dev
VITE_OPERATOR_EMAIL=tuaemail@esempio.it
VITE_OPERATOR_PHONE=+39 123 456 7890
```

---

## ✅ Test Rapido

1. Apri: `https://tuo-progetto.pages.dev`
2. Compila form completo
3. Verifica email ricevuta
4. Controlla Supabase → Table Editor → leads

---

## 🆘 Problemi?

### Build fallisce
→ Verifica variabili ambiente su Cloudflare Pages

### Email non arrivano  
→ Controlla spam + verifica Template IDs su EmailJS

### Offerte non si vedono
→ Verifica che `visibile = true` nel database

---

## 📚 Documentazione Completa

Per setup dettagliato vedi:
- `SETUP_GUIDE.md` - Guida passo-passo completa
- `README.md` - Panoramica progetto e manutenzione

---

## 💡 Prossimi Step Consigliati

1. ✅ Aggiungi le tue offerte reali nel database
2. ✅ Personalizza logo e brand
3. ✅ Configura dominio personalizzato
4. ✅ Setup Google Analytics
5. ✅ Test completo sistema

---

**Buon lavoro! 🎉**

Per domande: vedi SETUP_GUIDE.md sezione "Supporto"
