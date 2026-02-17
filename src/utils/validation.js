/**
 * Validazione Email
 */
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

/**
 * Validazione Telefono Italiano
 */
export const validatePhone = (phone) => {
  // Rimuovi spazi e caratteri speciali
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  
  // Verifica formato italiano (+39, 39, 0, 3)
  const regex = /^(\+39|39)?[0-9]{9,10}$/
  return regex.test(cleaned)
}

/**
 * Formatta telefono italiano
 */
export const formatPhone = (phone) => {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  
  if (cleaned.startsWith('+39')) {
    return cleaned
  } else if (cleaned.startsWith('39')) {
    return `+${cleaned}`
  } else if (cleaned.startsWith('3') || cleaned.startsWith('0')) {
    return `+39${cleaned}`
  }
  
  return cleaned
}

/**
 * Validazione Codice Fiscale
 */
export const validateCodiceFiscale = (cf) => {
  if (!cf || cf.length !== 16) return false
  
  const regex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/
  return regex.test(cf.toUpperCase())
}

/**
 * Validazione Partita IVA
 */
export const validatePartitaIVA = (piva) => {
  if (!piva || piva.length !== 11) return false
  
  const regex = /^[0-9]{11}$/
  if (!regex.test(piva)) return false
  
  // Algoritmo di controllo P.IVA
  let sum = 0
  for (let i = 0; i < 11; i++) {
    let digit = parseInt(piva[i])
    if (i % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  
  return sum % 10 === 0
}

/**
 * Validazione CAP
 */
export const validateCAP = (cap) => {
  const regex = /^[0-9]{5}$/
  return regex.test(cap)
}

/**
 * Validazione Codice POD (Luce)
 */
export const validatePOD = (pod) => {
  if (!pod) return true // Opzionale
  
  // IT001E12345678 (formato standard)
  const regex = /^IT[0-9]{3}[A-Z][0-9]{8}$/
  return regex.test(pod.toUpperCase())
}

/**
 * Validazione Codice PDR (Gas)
 */
export const validatePDR = (pdr) => {
  if (!pdr) return true // Opzionale
  
  // 14 cifre
  const regex = /^[0-9]{14}$/
  return regex.test(pdr)
}

/**
 * Validazione IBAN
 */
export const validateIBAN = (iban) => {
  if (!iban) return true // Opzionale
  
  const cleaned = iban.replace(/\s/g, '').toUpperCase()
  
  // IBAN italiano: IT + 2 cifre di controllo + 1 lettera + 10 cifre + 12 caratteri alfanumerici
  if (!cleaned.startsWith('IT') || cleaned.length !== 27) return false
  
  const regex = /^IT[0-9]{2}[A-Z][0-9]{10}[A-Z0-9]{12}$/
  return regex.test(cleaned)
}

/**
 * Validazione Data di Nascita
 */
export const validateDateOfBirth = (date) => {
  if (!date) return false
  
  const birthDate = new Date(date)
  const today = new Date()
  const age = today.getFullYear() - birthDate.getFullYear()
  
  // Età minima 18 anni, massima 120 anni
  return age >= 18 && age <= 120
}

/**
 * Sanitizza input per prevenire XSS
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  
  return input
    .replace(/[<>]/g, '')
    .trim()
}

/**
 * Validazione form completo con messaggi di errore
 */
export const validateForm = (formData, requiredFields) => {
  const errors = {}
  
  requiredFields.forEach(field => {
    if (!formData[field] || formData[field].toString().trim() === '') {
      errors[field] = 'Campo obbligatorio'
    }
  })
  
  // Validazioni specifiche
  if (formData.email && !validateEmail(formData.email)) {
    errors.email = 'Email non valida'
  }
  
  if (formData.telefono && !validatePhone(formData.telefono)) {
    errors.telefono = 'Telefono non valido'
  }
  
  if (formData.codice_fiscale && !validateCodiceFiscale(formData.codice_fiscale)) {
    errors.codice_fiscale = 'Codice fiscale non valido'
  }
  
  if (formData.cap && !validateCAP(formData.cap)) {
    errors.cap = 'CAP non valido'
  }
  
  if (formData.data_nascita && !validateDateOfBirth(formData.data_nascita)) {
    errors.data_nascita = 'Data di nascita non valida'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Genera codice di verifica SMS (6 cifre)
 */
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Valida consensi privacy obbligatori
 */
export const validatePrivacyConsents = (consents) => {
  const errors = []
  
  if (!consents.privacy_acconsentito) {
    errors.push('Devi accettare l\'informativa sulla privacy per continuare')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
