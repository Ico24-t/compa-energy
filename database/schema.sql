-- ============================================
-- DATABASE COMPARATORE ENERGIA - VERSIONE FINALE
-- OTTIMIZZATO PER MOBILE E FLUSSO SINGOLA OFFERTA
-- ============================================

-- =========================
-- EXTENSIONS
-- =========================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- per cifrare dati sensibili

-- =========================
-- FUNZIONE UPDATE_TIMESTAMP
-- =========================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- =========================
-- TABELLA 1: FORNITORI
-- =========================
CREATE TABLE fornitori (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  sito_web TEXT,
  
  -- CONTATTI OPERATORE (per te)
  email_operatore TEXT NOT NULL,
  telefono_operatore TEXT,
  referente_nome TEXT,
  
  -- TIPOLOGIA
  fornisce_luce BOOLEAN DEFAULT FALSE,
  fornisce_gas BOOLEAN DEFAULT FALSE,
  
  -- VALUTAZIONE
  rating_fornitore NUMERIC(3,2) DEFAULT 0.00,
  tempo_attivazione_medio INTEGER, -- giorni
  
  -- FLAG
  attivo BOOLEAN DEFAULT TRUE,
  priorita INTEGER DEFAULT 100, -- ordine visualizzazione
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_fornitori_updated_at 
BEFORE UPDATE ON fornitori 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- TABELLA 2: OFFERTE UNIFICATE
-- =========================
CREATE TABLE offerte (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fornitore_id UUID REFERENCES fornitori(id) ON DELETE CASCADE,
  
  -- INFORMAZIONI BASE
  nome_offerta TEXT NOT NULL,
  descrizione_breve TEXT, -- per mobile (max 120 chars)
  descrizione_completa TEXT,
  
  -- TIPO FORNITURA
  tipo_fornitura TEXT CHECK (tipo_fornitura IN ('luce', 'gas', 'dual')) NOT NULL,
  
  -- PREZZI LUCE (se applicabile)
  prezzo_kwh NUMERIC(8,6), -- fino a 0,123456 €/kWh
  tipo_tariffa_luce TEXT CHECK (tipo_tariffa_luce IN ('monoraria', 'bioraria', 'trioraria')) DEFAULT 'monoraria',
  quota_fissa_luce_mensile NUMERIC(6,2), -- €/mese
  potenza_contrattuale NUMERIC(4,3), -- kW
  
  -- PREZZI GAS (se applicabile)
  prezzo_smc NUMERIC(8,6), -- €/Smc
  quota_fissa_gas_mensile NUMERIC(6,2), -- €/mese
  
  -- CONDIZIONI
  durata_mesi INTEGER,
  penale_recesso NUMERIC(6,2),
  bonus_attivazione NUMERIC(6,2),
  rinnovo_automatico BOOLEAN DEFAULT TRUE,
  
  -- FLAG SPECIALI
  green_energy BOOLEAN DEFAULT FALSE,
  digitale BOOLEAN DEFAULT FALSE, -- app, contatto digitale
  promozione BOOLEAN DEFAULT FALSE,
  
  -- VALIDITÀ
  data_inizio DATE NOT NULL,
  data_fine DATE,
  valido_fino TIMESTAMP WITH TIME ZONE, -- scadenza promozionale
  
  -- VISIBILITÀ
  visibile BOOLEAN DEFAULT TRUE,
  priorita_visualizzazione INTEGER DEFAULT 50,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_offerte_visibili ON offerte(visibile, data_inizio, data_fine);
CREATE INDEX idx_offerte_tipo ON offerte(tipo_fornitura);

CREATE TRIGGER update_offerte_updated_at 
BEFORE UPDATE ON offerte 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- TABELLA 3: COMMISSIONI (PER TE)
-- =========================
CREATE TABLE commissioni (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offerta_id UUID REFERENCES offerte(id) ON DELETE CASCADE,
  
  -- COMMISSIONE BASE
  tipo_commissione TEXT CHECK (tipo_commissione IN ('fissa', 'percentuale', 'mista')) DEFAULT 'fissa',
  importo_fisso NUMERIC(6,2), -- €
  percentuale NUMERIC(5,2), -- %
  minimo_garantito NUMERIC(6,2),
  massimo NUMERIC(6,2),
  
  -- BONUS
  bonus_attivazione_rapida NUMERIC(6,2), -- se attivato entro X giorni
  bonus_dual NUMERIC(6,2), -- extra per dual
  bonus_verde NUMERIC(6,2), -- extra per green energy
  
  -- CONDIZIONI
  valido_da DATE NOT NULL,
  valido_a DATE,
  note TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_commissioni_updated_at 
BEFORE UPDATE ON commissioni 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- TABELLA 4: LEADS (STATO PROGRESSIVO)
-- =========================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codice_univoco TEXT UNIQUE GENERATED ALWAYS AS (
    'LEAD-' || EXTRACT(YEAR FROM created_at) || 
    LPAD(EXTRACT(MONTH FROM created_at)::TEXT, 2, '0') || 
    '-' || LPAD((nextval('leads_seq') % 10000)::TEXT, 4, '0')
  ) STORED,
  
  -- STATO PROGRESSIVO (MOBILE FLOW)
  stato TEXT CHECK (stato IN (
    'solo_email',           -- STEP 1: ha inserito email
    'dati_consumi',         -- STEP 2: ha inserito consumi
    'telefono_richiesto',   -- STEP 3: deve inserire tel per vedere offerta
    'offerta_vista',        -- STEP 4: ha visto l'offerta
    'dati_anagrafici',      -- STEP 5: ha inserito dati anagrafici
    'pre_contratto',        -- STEP 6: ha generato pre-contratto
    'inviato_operatore',    -- STEP 7: hai inviato a operatore
    'operatore_gestisce',   -- STEP 8: operatore ha preso in carico
    'attivato',             -- STEP 9: cliente attivato
    'disinteressato',       -- cliente ha abbandonato
    'da_ricontattare'       -- per follow-up
  )) DEFAULT 'solo_email',
  
  -- CONTATTI (acquisiti gradualmente)
  email TEXT NOT NULL,
  telefono TEXT,
  telefono_verificato BOOLEAN DEFAULT FALSE,
  codice_verifica_sms TEXT,
  
  -- ORIGINE
  origine TEXT CHECK (origine IN ('upload_bolletta', 'form_manuale', 'telefono', 'referral')) DEFAULT 'form_manuale',
  dispositivo TEXT CHECK (dispositivo IN ('mobile', 'tablet', 'desktop')),
  user_agent TEXT,
  ip_address INET,
  
  -- UTM PER TRAKING
  fonte_utm TEXT,
  campagna_utm TEXT,
  medium_utm TEXT,
  
  -- PRIVACY (obbligatorio per GDPR)
  privacy_acconsentito BOOLEAN DEFAULT FALSE,
  marketing_acconsentito BOOLEAN DEFAULT FALSE,
  data_consenso TIMESTAMP WITH TIME ZONE,
  
  -- TIMESTAMP
  data_primo_contatto TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_ultimo_contatto TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sequenza per codice univoco
CREATE SEQUENCE leads_seq START 1;

CREATE INDEX idx_leads_stato ON leads(stato);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_created_at ON leads(created_at);

CREATE TRIGGER update_leads_updated_at 
BEFORE UPDATE ON leads 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- TABELLA 5: BOLLETTE OCR
-- =========================
CREATE TABLE bollette_ocr (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  
  -- FILE
  file_name TEXT,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  
  -- OCR RAW DATA
  json_ocr_raw JSONB, -- risposta grezza OCR.space
  json_parsed JSONB, -- dati strutturati
  
  -- DATI ESTRATTI
  fornitore_attuale TEXT,
  tipo_fornitura TEXT CHECK (tipo_fornitura IN ('luce', 'gas', 'dual')),
  codice_pod TEXT,
  codice_pdr TEXT,
  potenza_contrattuale NUMERIC(4,3),
  
  -- CONSUMI
  consumo_kwh NUMERIC(8,2),
  consumo_smc NUMERIC(8,2),
  periodo_giorni INTEGER,
  
  -- COSTI DETTAGLIATI (per confronto)
  costo_materia_prima NUMERIC(8,2), -- energia/gas
  costo_trasporto NUMERIC(8,2),
  oneri_sistema NUMERIC(8,2),
  accise NUMERIC(8,2),
  iva NUMERIC(8,2),
  canone_rai NUMERIC(8,2),
  altre_spese NUMERIC(8,2),
  totale_bolletta NUMERIC(8,2),
  
  -- VALIDAZIONE
  confidence_score NUMERIC(5,2), -- % accuratezza OCR
  verificato_manualmente BOOLEAN DEFAULT FALSE,
  note_correzione TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bollette_lead ON bollette_ocr(lead_id);

-- =========================
-- TABELLA 6: CONSUMI CLIENTE
-- =========================
CREATE TABLE consumi_cliente (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  
  -- TIPO CLIENTE
  tipo_cliente TEXT CHECK (tipo_cliente IN ('privato', 'azienda')) DEFAULT 'privato',
  
  -- DATI INSERITI (form manuale)
  spesa_mensile_stimata NUMERIC(8,2),
  consumo_mensile_kwh NUMERIC(8,2),
  consumo_mensile_smc NUMERIC(8,2),
  fascia_oraria TEXT CHECK (fascia_oraria IN ('monoraria', 'bioraria')) DEFAULT 'monoraria',
  
  -- CALCOLI
  spesa_annua_attuale NUMERIC(8,2),
  consumo_annuo_kwh NUMERIC(8,2),
  consumo_annuo_smc NUMERIC(8,2),
  
  -- METADATI
  fonte_dati TEXT CHECK (fonte_dati IN ('form_manuale', 'bolletta_ocr', 'stima')) DEFAULT 'form_manuale',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_consumi_updated_at 
BEFORE UPDATE ON consumi_cliente 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- TABELLA 7: CALCOLO OFFERTA SINGOLA
-- =========================
CREATE TABLE calcolo_offerta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  offerta_id UUID REFERENCES offerte(id) ON DELETE CASCADE,
  
  -- PARAMETRI CALCOLO
  peso_risparmio_cliente NUMERIC(3,2) DEFAULT 0.70,
  peso_tua_commissione NUMERIC(3,2) DEFAULT 0.30,
  
  -- RISULTATI
  spesa_annua_attuale NUMERIC(8,2),
  spesa_annua_offerta NUMERIC(8,2),
  risparmio_annuo NUMERIC(8,2),
  risparmio_percentuale NUMERIC(5,2),
  
  -- COMMISSIONE
  tua_commissione NUMERIC(8,2),
  tipo_commissione TEXT,
  
  -- PUNTEGGIO FINALE (per selezionare la migliore)
  punteggio_finale NUMERIC(8,2) GENERATED ALWAYS AS (
    (risparmio_annuo * peso_risparmio_cliente) + 
    (tua_commissione * peso_tua_commissione)
  ) STORED,
  
  -- VISUALIZZAZIONE
  visualizzato BOOLEAN DEFAULT FALSE,
  data_visualizzazione TIMESTAMP WITH TIME ZONE,
  tempo_visualizzazione INTEGER, -- secondi
  
  -- SCELTA CLIENTE
  scelto_dal_cliente BOOLEAN DEFAULT FALSE,
  data_scelta TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_calcolo_punteggio ON calcolo_offerta(punteggio_finale DESC);
CREATE INDEX idx_calcolo_lead ON calcolo_offerta(lead_id);

CREATE TRIGGER update_calcolo_updated_at 
BEFORE UPDATE ON calcolo_offerta 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- TABELLA 8: DATI ANAGRAFICI
-- =========================
CREATE TABLE dati_anagrafici (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE UNIQUE,
  
  -- PRIVATO
  nome TEXT,
  cognome TEXT,
  codice_fiscale TEXT,
  data_nascita DATE,
  luogo_nascita TEXT,
  
  -- AZIENDA
  ragione_sociale TEXT,
  partita_iva TEXT,
  codice_sdi TEXT,
  
  -- CONTATTO
  telefono_conferma TEXT,
  email_conferma TEXT,
  
  -- INDIRIZZO
  indirizzo TEXT,
  civico TEXT,
  cap TEXT,
  citta TEXT,
  provincia TEXT,
  nazione TEXT DEFAULT 'Italia',
  
  -- INDIRIZZO FORNITURA (se diverso)
  fornitura_indirizzo TEXT,
  fornitura_civico TEXT,
  fornitura_cap TEXT,
  fornitura_citta TEXT,
  fornitura_provincia TEXT,
  
  -- PRATICA
  tipo_pratica TEXT CHECK (tipo_pratica IN ('cambio', 'subentro', 'nuovo_allaccio')) DEFAULT 'cambio',
  codice_pod TEXT,
  codice_pdr TEXT,
  data_decorrenza_desiderata DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_anagrafici_updated_at 
BEFORE UPDATE ON dati_anagrafici 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- TABELLA 9: PRE-CONTRATTI
-- =========================
CREATE TABLE pre_contratti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  offerta_id UUID REFERENCES offerte(id) ON DELETE CASCADE,
  calcolo_id UUID REFERENCES calcolo_offerta(id) ON DELETE SET NULL,
  
  -- DATI CONTRATTUALI
  codice_contratto TEXT UNIQUE,
  condizioni_generali_url TEXT,
  informativa_privacy_url TEXT,
  
  -- DETTAGLI OFFERTA (copia per storico)
  nome_offerta TEXT,
  fornitore_nome TEXT,
  prezzo_kwh NUMERIC(8,6),
  prezzo_smc NUMERIC(8,6),
  quota_fissa_mensile NUMERIC(6,2),
  durata_mesi INTEGER,
  
  -- STATO
  stato TEXT CHECK (stato IN (
    'generato',
    'inviato_cliente',
    'firmato_digitale',
    'firmato_cartaceo',
    'inviato_fornitore',
    'accettato_fornitore',
    'rifiutato_fornitore',
    'scaduto'
  )) DEFAULT 'generato',
  
  -- SCADENZA
  valido_fino TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- FIRME
  data_firma_cliente TIMESTAMP WITH TIME ZONE,
  data_firma_operatore TIMESTAMP WITH TIME ZONE,
  ip_firma INET,
  
  -- DOCUMENTI
  pdf_url TEXT,
  hash_documento TEXT, -- per integrità
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_precontratti_updated_at 
BEFORE UPDATE ON pre_contratti 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- TABELLA 10: PASSAGGI OPERATORE
-- =========================
CREATE TABLE passaggi_operatore (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  pre_contratto_id UUID REFERENCES pre_contratti(id) ON DELETE SET NULL,
  
  -- OPERATORE DESTINATARIO
  operatore_nome TEXT NOT NULL,
  operatore_email TEXT NOT NULL,
  operatore_telefono TEXT,
  
  -- DATI INVIATI
  dati_inviati JSONB, -- tutti i dati rilevanti
  
  -- STATO
  stato TEXT CHECK (stato IN (
    'in_preparazione',
    'pronto',
    'inviato',
    'confermato',
    'in_lavorazione',
    'completato',
    'errore',
    'richiesta_correzione'
  )) DEFAULT 'in_preparazione',
  
  -- TRACCIA
  data_invio TIMESTAMP WITH TIME ZONE,
  data_conferma TIMESTAMP WITH TIME ZONE,
  data_completamento TIMESTAMP WITH TIME ZONE,
  
  -- FEEDBACK
  codice_pratica_operatore TEXT,
  note_operatore TEXT,
  correzioni_richieste TEXT[],
  
  -- NOTIFICHE
  notifiche_inviate INTEGER DEFAULT 0,
  ultima_notifica TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_passaggi_updated_at 
BEFORE UPDATE ON passaggi_operatore 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- TABELLA 11: FOLLOW-UP AUTOMATICI
-- =========================
CREATE TABLE follow_up (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  
  -- TIPO FOLLOW-UP
  tipo TEXT CHECK (tipo IN (
    'benvenuto',              -- subito dopo registrazione
    'offerta_non_vista',      -- dopo 24h se non ha visto offerta
    'offerta_non_scelta',     -- dopo 3 giorni se non ha scelto
    'promemoria_scadenza',    -- 60 giorni prima scadenza
    'nuova_offerta',          -- quando esce offerta migliore
    'richiesta_feedback',     -- dopo attivazione
    'ritorno'                 -- dopo 1 anno
  )),
  
  -- PROGRAMMAZIONE
  data_programmata TIMESTAMP WITH TIME ZONE NOT NULL,
  data_invio TIMESTAMP WITH TIME ZONE,
  data_risposta TIMESTAMP WITH TIME ZONE,
  
  -- CANALE
  canale TEXT CHECK (canale IN ('email', 'sms', 'whatsapp', 'telefono')) DEFAULT 'email',
  template_id TEXT,
  
  -- CONTENUTO PERSONALIZZATO
  personalizzazione JSONB, -- {nome: "Mario", risparmio: "150€", scadenza: "2024-12-31"}
  
  -- RISPOSTA
  esito TEXT CHECK (esito IN (
    'programmato',
    'inviato',
    'consegnato',
    'aperto',
    'cliccato',
    'risposto',
    'rimbalzato',
    'errore'
  )) DEFAULT 'programmato',
  
  -- METRICA
  apertura BOOLEAN DEFAULT FALSE,
  click BOOLEAN DEFAULT FALSE,
  risposta_testo TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_followup_programmati ON follow_up(data_programmata) WHERE esito = 'programmato';
CREATE INDEX idx_followup_lead ON follow_up(lead_id);

CREATE TRIGGER update_followup_updated_at 
BEFORE UPDATE ON follow_up 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- TABELLA 12: EMAIL LOGS
-- =========================
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  
  -- DESTINATARIO
  destinatario_email TEXT NOT NULL,
  destinatario_nome TEXT,
  
  -- EMAIL
  template_nome TEXT NOT NULL,
  oggetto TEXT,
  corpo_testo TEXT,
  corpo_html TEXT,
  
  -- INVIO
  provider TEXT DEFAULT 'resend',
  message_id TEXT,
  sendgrid_id TEXT,
  
  -- STATO
  stato TEXT CHECK (stato IN ('in_coda', 'inviato', 'consegnato', 'aperto', 'cliccato', 'rimbalzato', 'errore')) DEFAULT 'inviato',
  aperto BOOLEAN DEFAULT FALSE,
  click BOOLEAN DEFAULT FALSE,
  
  -- TIMING
  data_invio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_consegna TIMESTAMP WITH TIME ZONE,
  data_apertura TIMESTAMP WITH TIME ZONE,
  data_click TIMESTAMP WITH TIME ZONE,
  
  -- ERRORI
  errore_codice TEXT,
  errore_messaggio TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_emaillogs_lead ON email_logs(lead_id);
CREATE INDEX idx_emaillogs_data ON email_logs(data_invio);

-- =========================
-- TABELLA 13: PANNELLO AMMINISTRAZIONE (PER TE)
-- =========================
CREATE TABLE admin_pannello (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- UTENTE (tu o operatori)
  nome_utente TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  ruolo TEXT CHECK (ruolo IN ('superadmin', 'admin', 'operatore', 'viewer')) DEFAULT 'operatore',
  password_hash TEXT, -- per autenticazione
  
  -- PREFERENZE
  notifiche_email BOOLEAN DEFAULT TRUE,
  notifiche_sms BOOLEAN DEFAULT FALSE,
  
  -- STATISTICHE VISUALIZZAZIONE
  dashboard_preferita TEXT DEFAULT 'lead_oggi',
  
  -- SICUREZZA
  ultimo_login TIMESTAMP WITH TIME ZONE,
  ultimo_ip INET,
  login_falliti INTEGER DEFAULT 0,
  bloccato BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_admin_updated_at 
BEFORE UPDATE ON admin_pannello 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- TABELLA 14: ATTIVAZIONI (TRACKING FINALE)
-- =========================
CREATE TABLE attivazioni (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  pre_contratto_id UUID REFERENCES pre_contratti(id) ON DELETE SET NULL,
  offerta_id UUID REFERENCES offerte(id) ON DELETE SET NULL,
  
  -- DATI ATTIVAZIONE
  data_attivazione DATE,
  data_decorrenza DATE,
  numero_contratto_fornitore TEXT,
  
  -- COMMISSIONE
  commissione_dovuta NUMERIC(8,2),
  commissione_pagata NUMERIC(8,2),
  data_pagamento DATE,
  metodo_pagamento TEXT,
  
  -- STATO
  stato TEXT CHECK (stato IN (
    'in_attesa',
    'attivato',
    'sospeso',
    'cessato',
    'disdetta',
    'migrazione'
  )) DEFAULT 'in_attesa',
  
  -- NOTE
  note TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_attivazioni_updated_at 
BEFORE UPDATE ON attivazioni 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- FUNZIONI DI SISTEMA
-- =========================

-- Funzione per calcolare la MIGLIORE offerta per un lead
CREATE OR REPLACE FUNCTION calcola_migliore_offerta(
  p_lead_id UUID,
  p_tipo_fornitura TEXT DEFAULT NULL
)
RETURNS TABLE (
  offerta_id UUID,
  fornitore_nome TEXT,
  nome_offerta TEXT,
  spesa_annua_attuale NUMERIC,
  spesa_annua_offerta NUMERIC,
  risparmio_annuo NUMERIC,
  risparmio_percentuale NUMERIC,
  tua_commissione NUMERIC,
  punteggio_finale NUMERIC
) AS $$
DECLARE
  v_consumo RECORD;
  v_migliore_offerta RECORD;
BEGIN
  -- Recupera consumi del lead
  SELECT * INTO v_consumo 
  FROM consumi_cliente 
  WHERE lead_id = p_lead_id;
  
  -- Se non trovato, restituisce vuoto
  IF v_consumo IS NULL THEN
    RETURN;
  END IF;
  
  -- Calcola tutte le offerte possibili e restituisce la migliore
  RETURN QUERY
  WITH offerte_calcolate AS (
    SELECT 
      o.id as offerta_id,
      f.nome as fornitore_nome,
      o.nome_offerta,
      -- Calcola spesa attuale
      COALESCE(v_consumo.spesa_annua_attuale, 0) as spesa_attuale,
      -- Calcola spesa con offerta
      CASE 
        WHEN o.tipo_fornitura = 'luce' THEN
          (v_consumo.consumo_annuo_kwh * o.prezzo_kwh * 1.22) + -- 22% IVA
          (o.quota_fissa_luce_mensile * 12 * 1.22)
        WHEN o.tipo_fornitura = 'gas' THEN
          (v_consumo.consumo_annuo_smc * o.prezzo_smc * 1.22) +
          (o.quota_fissa_gas_mensile * 12 * 1.22)
        WHEN o.tipo_fornitura = 'dual' THEN
          (v_consumo.consumo_annuo_kwh * o.prezzo_kwh * 1.22) +
          (v_consumo.consumo_annuo_smc * o.prezzo_smc * 1.22) +
          (o.quota_fissa_luce_mensile * 12 * 1.22)
        ELSE 0
      END as spesa_offerta,
      -- Calcola commissione
      COALESCE(c.importo_fisso, 0) + 
      COALESCE(c.percentuale * 0.01 * v_consumo.spesa_annua_attuale, 0) as commissione
    FROM offerte o
    JOIN fornitori f ON o.fornitore_id = f.id
    LEFT JOIN commissioni c ON o.id = c.offerta_id
    WHERE o.visibile = TRUE
      AND o.data_inizio <= CURRENT_DATE
      AND (o.data_fine IS NULL OR o.data_fine >= CURRENT_DATE)
      AND f.attivo = TRUE
      AND (p_tipo_fornitura IS NULL OR o.tipo_fornitura = p_tipo_fornitura)
  )
  SELECT 
    oc.offerta_id,
    oc.fornitore_nome,
    oc.nome_offerta,
    oc.spesa_attuale,
    oc.spesa_offerta,
    (oc.spesa_attuale - oc.spesa_offerta) as risparmio_annuo,
    CASE 
      WHEN oc.spesa_attuale > 0 THEN 
        ((oc.spesa_attuale - oc.spesa_offerta) / oc.spesa_attuale * 100)
      ELSE 0 
    END as risparmio_percentuale,
    oc.commissione,
    -- Punteggio: 70% risparmio + 30% commissione
    ((oc.spesa_attuale - oc.spesa_offerta) * 0.70) + (oc.commissione * 0.30) as punteggio
  FROM offerte_calcolate oc
  WHERE oc.spesa_offerta > 0
  ORDER BY punteggio DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Funzione per aggiornare stato lead automaticamente
CREATE OR REPLACE FUNCTION aggiorna_stato_lead()
RETURNS TRIGGER AS $$
BEGIN
  -- Aggiorna data ultimo contatto
  NEW.data_ultimo_contatto = NOW();
  
  -- Logica automatica cambio stato
  IF NEW.telefono IS NOT NULL AND OLD.telefono IS NULL THEN
    IF NEW.stato = 'solo_email' THEN
      NEW.stato = 'dati_consumi';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_aggiorna_stato_lead
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION aggiorna_stato_lead();

-- =========================
-- INSERIMENTO DATI INIZIALI
-- =========================

-- Inserisci il tuo account admin
INSERT INTO admin_pannello (nome_utente, email, ruolo, password_hash) 
VALUES (
  'admin',
  'tua@email.com',
  'superadmin',
  crypt('password_iniziale', gen_salt('bf')) -- CAMBIA SUBITO!
);

-- Inserisci fornitori di esempio
INSERT INTO fornitori (nome, logo_url, email_operatore, fornisce_luce, fornisce_gas, priorita) VALUES
('ENEL Energia', 'https://example.com/logos/enel.png', 'operatore@enel.it', TRUE, TRUE, 10),
('ENGIE', 'https://example.com/logos/engie.png', 'commerciale@engie.it', TRUE, TRUE, 20),
('A2A Energia', 'https://example.com/logos/a2a.png', 'clienti@a2a.it', TRUE, FALSE, 30),
('Iren Mercato', 'https://example.com/logos/iren.png', 'info@iren.it', FALSE, TRUE, 40),
('Eni Plenitude', 'https://example.com/logos/eni.png', 'servizioclienti@eni.it', TRUE, TRUE, 50);

-- =========================
-- VISTE UTILI PER IL PANNELLO
-- =========================

-- Vista lead di oggi
CREATE VIEW vw_leads_oggi AS
SELECT 
  l.id,
  l.codice_univoco,
  l.stato,
  l.email,
  l.telefono,
  l.created_at,
  CASE 
    WHEN l.stato IN ('inviato_operatore', 'operatore_gestisce', 'attivato') THEN 'caldo'
    WHEN l.stato IN ('offerta_vista', 'dati_anagrafici', 'pre_contratto') THEN 'tiepido'
    ELSE 'freddo'
  END as temperatura
FROM leads l
WHERE DATE(l.created_at) = CURRENT_DATE
ORDER BY l.created_at DESC;

-- Vista offerte più redditizie
CREATE VIEW vw_offerte_redditizie AS
SELECT 
  o.nome_offerta,
  f.nome as fornitore,
  o.tipo_fornitura,
  COUNT(co.id) as numero_calcoli,
  AVG(co.tua_commissione) as commissione_media,
  AVG(co.risparmio_percentuale) as risparmio_medio
FROM offerte o
JOIN fornitori f ON o.fornitore_id = f.id
LEFT JOIN calcolo_offerta co ON o.id = co.offerta_id
WHERE o.visibile = TRUE
GROUP BY o.id, f.nome
ORDER BY commissione_media DESC, risparmio_medio DESC;

-- =========================
-- INDICI PERFORMANCE
-- =========================
CREATE INDEX idx_offerte_fornitore ON offerte(fornitore_id);
CREATE INDEX idx_leads_stato_email ON leads(stato, email);
CREATE INDEX idx_calcolo_offerta_lead_offerta ON calcolo_offerta(lead_id, offerta_id);
CREATE INDEX idx_precontratti_stato ON pre_contratti(stato);
CREATE INDEX idx_passaggi_stato ON passaggi_operatore(stato);

-- ============================================
-- FINE - DATABASE COMPLETO E OTTIMIZZATO
-- ============================================