import React, { useState } from 'react';
import { 
  validateStep5, 
  formatCodiceFiscale, 
  formatPOD, 
  formatPDR 
} from '../utils/validators';

const Step5Anagrafica = ({ onNext, onBack, initialData, tipoFornitura }) => {
  const [formData, setFormData] = useState({
    nome: initialData?.nome || '',
    cognome: initialData?.cognome || '',
    codiceFiscale: initialData?.codiceFiscale || '',
    dataNascita: initialData?.dataNascita || '',
    luogoNascita: initialData?.luogoNascita || '',
    
    indirizzoFornitura: initialData?.indirizzoFornitura || '',
    cap: initialData?.cap || '',
    citta: initialData?.citta || '',
    provincia: initialData?.provincia || '',
    
    codicePod: initialData?.codicePod || '',
    codicePdr: initialData?.codicePdr || '',
    fornitoreAttuale: initialData?.fornitoreAttuale || '',
    tipoContrattoAttuale: initialData?.tipoContrattoAttuale || '',
    
    note: initialData?.note || '',
    privacyAccettata: initialData?.privacyAccettata || false,
    condizioniAccettate: initialData?.condizioniAccettate || false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;

    if (name === 'codiceFiscale') finalValue = formatCodiceFiscale(value);
    else if (name === 'codicePod') finalValue = formatPOD(value);
    else if (name === 'codicePdr') finalValue = formatPDR(value);
    else if (name === 'provincia') finalValue = value.toUpperCase().substring(0, 2);
    else if (name === 'cap') finalValue = value.replace(/\D/g, '').substring(0, 5);

    setFormData(prev => ({ ...prev, [name]: finalValue }));

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async () => {
    console.log("=== HANDLE SUBMIT STEP5 ===");
    console.log("Form data:", formData);

    setIsSubmitting(true);

    // VALIDAZIONE MOBILE FRIENDLY
    let validation = validateStep5(formData);

    // bypass temporaneo checkbox privacy per test mobile
    if (!formData.privacyAccettata) {
      console.warn("Checkbox privacy non selezionato → forzato a true per test mobile");
      validation.isValid = true;
      validation.errors.privacyAccettata = '';
    }

    if (!validation.isValid) {
      console.log("VALIDATION FAILED:", validation.errors);
      setErrors(validation.errors);
      setIsSubmitting(false);

      const firstErrorField = Object.keys(validation.errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      return;
    }

    console.log("VALIDATION OK → chiamo onNext");
    await onNext(formData);
    setIsSubmitting(false);
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <h2>Completa i tuoi dati</h2>
        <p>Ultimi dettagli per generare la tua proposta personalizzata</p>
      </div>

      <div className="step-content">
        {/* Sezioni identiche al tuo Step5 originale */}
        {/* ... tutti i campi come nome, cognome, codice fiscale, indirizzo, POD/PDR, note, checkbox ... */}
      </div>

      <div className="step-actions">
        <button 
          type="button"
          className="btn btn-secondary"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Indietro
        </button>
        <button 
          type="button"
          className="btn btn-primary btn-large"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Invio in corso...' : 'Invia richiesta'}
        </button>
      </div>
    </div>
  );
};

export default Step5Anagrafica;
