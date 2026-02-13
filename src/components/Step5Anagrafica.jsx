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

    // Formattazioni automatiche
    if (name === 'codiceFiscale') finalValue = formatCodiceFiscale(value);
    if (name === 'codicePod') finalValue = formatPOD(value);
    if (name === 'codicePdr') finalValue = formatPDR(value);
    if (name === 'provincia') finalValue = value.toUpperCase().substring(0,2);
    if (name === 'cap') finalValue = value.replace(/\D/g,'').substring(0,5);

    setFormData(prev => ({ ...prev, [name]: finalValue }));

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const validation = validateStep5(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);

      // Scroll al primo errore
      const firstErrorField = Object.keys(validation.errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      return;
    }

    // Avanza al prossimo step senza mostrare alert
    try {
      await onNext(formData);
    } catch (err) {
      console.error('Errore invio dati:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <h2>Completa i tuoi dati</h2>
        <p>Ultimi dettagli per generare la tua proposta personalizzata</p>
      </div>

      <div className="step-content">
        {/* Dati Anagrafici */}
        <div className="form-section">
          <h3>📋 Dati anagrafici</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Nome *</label>
              <input type="text" name="nome" value={formData.nome} onChange={handleChange} className={errors.nome ? 'error' : ''} />
              {errors.nome && <span className="error-text">{errors.nome}</span>}
            </div>
            <div className="form-group">
              <label>Cognome *</label>
              <input type="text" name="cognome" value={formData.cognome} onChange={handleChange} className={errors.cognome ? 'error' : ''} />
              {errors.cognome && <span className="error-text">{errors.cognome}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Codice Fiscale *</label>
            <input type="text" name="codiceFiscale" value={formData.codiceFiscale} onChange={handleChange} maxLength="16" className={errors.codiceFiscale ? 'error' : ''} />
            {errors.codiceFiscale && <span className="error-text">{errors.codiceFiscale}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Data di nascita *</label>
              <input type="date" name="dataNascita" value={formData.dataNascita} onChange={handleChange} max={new Date().toISOString().split('T')[0]} className={errors.dataNascita ? 'error' : ''} />
              {errors.dataNascita && <span className="error-text">{errors.dataNascita}</span>}
            </div>
            <div className="form-group">
              <label>Luogo di nascita *</label>
              <input type="text" name="luogoNascita" value={formData.luogoNascita} onChange={handleChange} className={errors.luogoNascita ? 'error' : ''} />
              {errors.luogoNascita && <span className="error-text">{errors.luogoNascita}</span>}
            </div>
          </div>
        </div>

        {/* Indirizzo Fornitura */}
        <div className="form-section">
          <h3>🏠 Indirizzo di fornitura</h3>
          <input type="text" name="indirizzoFornitura" value={formData.indirizzoFornitura} onChange={handleChange} placeholder="Via Roma, 123" className={errors.indirizzoFornitura ? 'error' : ''} />
          {errors.indirizzoFornitura && <span className="error-text">{errors.indirizzoFornitura}</span>}

          <div className="form-row">
            <input type="text" name="cap" value={formData.cap} onChange={handleChange} placeholder="CAP" className={errors.cap ? 'error' : ''} />
            <input type="text" name="citta" value={formData.citta} onChange={handleChange} placeholder="Città" className={errors.citta ? 'error' : ''} />
            <input type="text" name="provincia" value={formData.provincia} onChange={handleChange} placeholder="Provincia" className={errors.provincia ? 'error' : ''} />
          </div>
        </div>

        {/* Dati Fornitura Attuale */}
        <div className="form-section">
          <h3>⚡ Dati fornitura attuale</h3>
          {(tipoFornitura === 'luce' || tipoFornitura === 'dual') && (
            <input type="text" name="codicePod" value={formData.codicePod} onChange={handleChange} placeholder="Codice POD" className={errors.codicePod ? 'error' : ''} />
          )}
          {(tipoFornitura === 'gas' || tipoFornitura === 'dual') && (
            <input type="text" name="codicePdr" value={formData.codicePdr} onChange={handleChange} placeholder="Codice PDR" className={errors.codicePdr ? 'error' : ''} />
          )}
        </div>

        {/* Privacy */}
        <div className="form-section">
          <label>
            <input type="checkbox" name="privacyAccettata" checked={formData.privacyAccettata} onChange={handleChange} />
            Accetto l'informativa privacy *
          </label>
          {errors.privacyAccettata && <span className="error-text">{errors.privacyAccettata}</span>}
        </div>
      </div>

      <div className="step-actions">
        <button onClick={onBack} disabled={isSubmitting}>Indietro</button>
        <button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Invio in corso...' : 'Invia richiesta'}
        </button>
      </div>
    </div>
  );
};

export default Step5Anagrafica;
