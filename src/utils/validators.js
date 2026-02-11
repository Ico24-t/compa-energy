/**
 * Validazione email
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Validazione telefono italiano
 */
export const validateTelefono = (telefono) => {
  // Rimuovi spazi e caratteri speciali
  const cleaned = telefono.replace(/[\s\-()]/g, '');
  
  // Accetta numeri italiani (con o senza prefisso +39)
  const re = /^(\+39)?[0-9]{9,10}$/;
  return re.test(cleaned);
};

/**
 * Validazione Codice Fiscale italiano
 */
export const validateCodiceFiscale = (cf) => {
  const re = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i;
  return re.test(cf.toUpperCase());
};

/**
 * Validazione CAP italiano
 */
export const validateCAP = (cap) => {
  const re = /^[0-9]{5}$/;
  return re.test(cap);
};

/**
 * Validazione POD (energia elettrica)
 * Formato: IT001E12345678
 */
export const validatePOD = (pod) => {
  if (!pod) return true; // Opzionale
  const re = /^IT[0-9]{3}E[0-9]{8}$/i;
  return re.test(pod.toUpperCase());
};

/**
 * Validazione PDR (gas)
 * Formato: 14 cifre numeriche
 */
export const validatePDR = (pdr) => {
  if (!pdr) return true; // Opzionale
  const re = /^[0-9]{14}$/;
  return re.test(pdr);
};

/**
 * Validazione importo
 */
export const validateImporto = (importo) => {
  const num = parseFloat(importo);
  return !isNaN(num) && num > 0;
};

/**
 * Validazione numero positivo
 */
export const validateNumeroPositivo = (numero) => {
  const num = parseFloat(numero);
  return !isNaN(num) && num >= 0;
};

/**
 * Formatta telefono in formato standard
 */
export const formatTelefono = (telefono) => {
  const cleaned = telefono.replace(/[\s\-()]/g, '');
  
  // Aggiungi +39 se manca
  if (cleaned.length === 10 && !cleaned.startsWith('+')) {
    return '+39' + cleaned;
  }
  if (cleaned.length === 9 && !cleaned.startsWith('+')) {
    return '+39' + cleaned;
  }
  
  return cleaned.startsWith('+') ? cleaned : '+' + cleaned;
};

/**
 * Formatta Codice Fiscale in uppercase
 */
export const formatCodiceFiscale = (cf) => {
  return cf.toUpperCase().replace(/\s/g, '');
};

/**
 * Formatta POD in uppercase
 */
export const formatPOD = (pod) => {
  return pod ? pod.toUpperCase().replace(/\s/g, '') : '';
};

/**
 * Formatta PDR rimuovendo spazi
 */
export const formatPDR = (pdr) => {
  return pdr ? pdr.replace(/\s/g, '') : '';
};

/**
 * Calcola consumo annuo stimato da spesa mensile
 * Usa prezzi medi di mercato
 */
export const stimaConsumoAnnuo = (spesaMensile, tipoFornitura) => {
  const spesaAnnua = spesaMensile * 12;
  
  if (tipoFornitura === 'luce') {
    // Prezzo medio 0.25 €/kWh (con tasse)
    return Math.round(spesaAnnua / 0.25);
  }
  
  if (tipoFornitura === 'gas') {
    // Prezzo medio 1.20 €/Smc (con tasse)
    return Math.round(spesaAnnua / 1.20);
  }
  
  if (tipoFornitura === 'dual') {
    // Dividi circa 50/50
    return {
      kwh: Math.round((spesaAnnua / 2) / 0.25),
      smc: Math.round((spesaAnnua / 2) / 1.20)
    };
  }
  
  return 0;
};

/**
 * Formatta numero come valuta
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Formatta numero con separatore migliaia
 */
export const formatNumber = (value) => {
  return new Intl.NumberFormat('it-IT').format(value);
};

/**
 * Validazione form Step 2 (consumi)
 */
export const validateStep2 = (data) => {
  const errors = {};
  
  if (!data.tipoFornitura) {
    errors.tipoFornitura = 'Seleziona il tipo di fornitura';
  }
  
  if (!data.potenzaContatore && data.tipoFornitura !== 'gas') {
    errors.potenzaContatore = 'Seleziona la potenza del contatore';
  }
  
  if (!validateImporto(data.spesaMensile)) {
    errors.spesaMensile = 'Inserisci una spesa mensile valida';
  } else if (parseFloat(data.spesaMensile) < 10) {
    errors.spesaMensile = 'La spesa mensile sembra troppo bassa';
  } else if (parseFloat(data.spesaMensile) > 1000) {
    errors.spesaMensile = 'La spesa mensile sembra troppo alta. Verifica il dato.';
  }
  
  if (!validateEmail(data.email)) {
    errors.email = 'Inserisci un indirizzo email valido';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validazione form Step 3 (telefono)
 */
export const validateStep3 = (telefono) => {
  if (!telefono || telefono.trim() === '') {
    return { isValid: false, error: 'Il numero di telefono è obbligatorio' };
  }
  
  if (!validateTelefono(telefono)) {
    return { isValid: false, error: 'Inserisci un numero di telefono valido' };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validazione form Step 5 (anagrafica)
 */
export const validateStep5 = (data) => {
  const errors = {};
  
  if (!data.nome || data.nome.trim().length < 2) {
    errors.nome = 'Inserisci un nome valido';
  }
  
  if (!data.cognome || data.cognome.trim().length < 2) {
    errors.cognome = 'Inserisci un cognome valido';
  }
  
  if (!validateCodiceFiscale(data.codiceFiscale)) {
    errors.codiceFiscale = 'Inserisci un codice fiscale valido';
  }
  
  if (!data.dataNascita) {
    errors.dataNascita = 'Inserisci la data di nascita';
  } else {
    const oggi = new Date();
    const nascita = new Date(data.dataNascita);
    const eta = oggi.getFullYear() - nascita.getFullYear();
    if (eta < 18 || eta > 120) {
      errors.dataNascita = 'Data di nascita non valida';
    }
  }
  
  if (!data.luogoNascita || data.luogoNascita.trim().length < 2) {
    errors.luogoNascita = 'Inserisci il luogo di nascita';
  }
  
  if (!data.indirizzoFornitura || data.indirizzoFornitura.trim().length < 5) {
    errors.indirizzoFornitura = 'Inserisci un indirizzo valido';
  }
  
  if (!validateCAP(data.cap)) {
    errors.cap = 'Inserisci un CAP valido (5 cifre)';
  }
  
  if (!data.citta || data.citta.trim().length < 2) {
    errors.citta = 'Inserisci la città';
  }
  
  if (!data.provincia || data.provincia.trim().length !== 2) {
    errors.provincia = 'Inserisci la sigla provincia (es. BA, RM, MI)';
  }
  
  if (data.codicePod && !validatePOD(data.codicePod)) {
    errors.codicePod = 'Formato POD non valido (es. IT001E12345678)';
  }
  
  if (data.codicePdr && !validatePDR(data.codicePdr)) {
    errors.codicePdr = 'Formato PDR non valido (14 cifre)';
  }
  
  if (!data.privacyAccettata) {
    errors.privacyAccettata = 'Devi accettare l\'informativa privacy per procedere';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
