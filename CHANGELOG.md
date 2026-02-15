# Changelog

Tutte le modifiche rilevanti al progetto saranno documentate qui.

## [1.0.0] - 2024-02-15

### Iniziale Release

#### Aggiunte
- Form multi-step responsive (6 step)
- Integrazione Supabase per database
- Sistema di calcolo risparmio automatico
- Invio email automatiche con EmailJS
- Caricamento bolletta con OCR (Tesseract.js)
- Gestione stato con Context API
- Animazioni con Framer Motion
- Design moderno con Tailwind CSS
- Validazione completa form
- Tracking UTM e dispositivo
- Row Level Security su Supabase
- Deploy automatico su Cloudflare Pages
- CI/CD con GitHub Actions
- Documentazione completa

#### Componenti
- Step1ClientType: Selezione tipo cliente
- Step2Consumption: Raccolta consumi e contatti
- Step3OfferCalculation: Calcolo e presentazione offerta
- Step4OfferDetails: Dettagli completi offerta
- Step5PersonalData: Raccolta dati anagrafici
- Step6Confirmation: Conferma e invio email
- BillUpload: Caricamento bolletta con OCR
- ProgressSteps: Indicatore avanzamento
- Header: Intestazione responsive
- Footer: Piè di pagina con contatti

#### Database
- Schema completo con 9 tabelle
- Views ottimizzate
- Triggers automatici
- Sequenze per codici univoci
- RLS policies per sicurezza

#### Integrazioni
- Supabase: Database PostgreSQL
- EmailJS: Invio email transazionali
- Cloudflare Pages: Hosting e CDN
- GitHub: Version control
- Tesseract.js: OCR per bollette

### Roadmap Futura

#### v1.1.0 (Q1 2024)
- [ ] Dashboard admin per gestione lead
- [ ] Statistiche e analytics
- [ ] Esportazione dati CSV/Excel
- [ ] Notifiche SMS con Twilio
- [ ] Sistema di reminder automatici

#### v1.2.0 (Q2 2024)
- [ ] App mobile nativa (React Native)
- [ ] Sistema di referral
- [ ] Comparazione automatica fornitori
- [ ] Integrazione firma digitale
- [ ] Chat support integrata

#### v2.0.0 (Q3 2024)
- [ ] Marketplace fornitori
- [ ] Sistema di rating e recensioni
- [ ] Comparazione multi-utenza (famiglie)
- [ ] AI per ottimizzazione offerte
- [ ] Blockchain per certificazioni energia verde
