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

    // Formattazione automatica
    if (name === 'codiceFiscale') {
      finalValue = formatCodiceFiscale(value);
    } else if (name === 'codicePod') {
      finalValue = formatPOD(value);
    } else if (name === 'codicePdr') {
      finalValue = formatPDR(value);
    } else if (name === 'provincia') {
      finalValue = value.toUpperCase().substring(0, 2);
    } else if (name === 'cap') {
      finalValue = value.replace(/\D/g, '').substring(0, 5);
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));

    // Rimuovi errore quando l'utente modifica
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
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
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      return;
    }

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
        {/* Dati Anagrafici */}
        <div className="form-section">
          <h3 className="section-title">📋 Dati anagrafici</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label className="step-label">
                Nome <span className="label-required">*</span>
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className={`form-input ${errors.nome ? 'error' : ''}`}
                placeholder="Mario"
              />
              {errors.nome && <span className="error-text">{errors.nome}</span>}
            </div>

            <div className="form-group">
              <label className="step-label">
                Cognome <span className="label-required">*</span>
              </label>
              <input
                type="text"
                name="cognome"
                value={formData.cognome}
                onChange={handleChange}
                className={`form-input ${errors.cognome ? 'error' : ''}`}
                placeholder="Rossi"
              />
              {errors.cognome && <span className="error-text">{errors.cognome}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="step-label">
              Codice Fiscale <span className="label-required">*</span>
            </label>
            <input
              type="text"
              name="codiceFiscale"
              value={formData.codiceFiscale}
              onChange={handleChange}
              className={`form-input ${errors.codiceFiscale ? 'error' : ''}`}
              placeholder="RSSMRA80A01H501Z"
              maxLength="16"
            />
            {errors.codiceFiscale && <span className="error-text">{errors.codiceFiscale}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="step-label">
                Data di nascita <span className="label-required">*</span>
              </label>
              <input
                type="date"
                name="dataNascita"
                value={formData.dataNascita}
                onChange={handleChange}
                className={`form-input ${errors.dataNascita ? 'error' : ''}`}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.dataNascita && <span className="error-text">{errors.dataNascita}</span>}
            </div>

            <div className="form-group">
              <label className="step-label">
                Luogo di nascita <span className="label-required">*</span>
              </label>
              <input
                type="text"
                name="luogoNascita"
                value={formData.luogoNascita}
                onChange={handleChange}
                className={`form-input ${errors.luogoNascita ? 'error' : ''}`}
                placeholder="Roma"
              />
              {errors.luogoNascita && <span className="error-text">{errors.luogoNascita}</span>}
            </div>
          </div>
        </div>

        {/* Indirizzo Fornitura */}
        <div className="form-section">
          <h3 className="section-title">🏠 Indirizzo di fornitura</h3>
          
          <div className="form-group">
            <label className="step-label">
              Indirizzo completo <span className="label-required">*</span>
            </label>
            <input
              type="text"
              name="indirizzoFornitura"
              value={formData.indirizzoFornitura}
              onChange={handleChange}
              className={`form-input ${errors.indirizzoFornitura ? 'error' : ''}`}
              placeholder="Via Roma, 123"
            />
            {errors.indirizzoFornitura && <span className="error-text">{errors.indirizzoFornitura}</span>}
          </div>

          <div className="form-row">
            <div className="form-group form-group-small">
              <label className="step-label">
                CAP <span className="label-required">*</span>
              </label>
              <input
                type="text"
                name="cap"
                value={formData.cap}
                onChange={handleChange}
                className={`form-input ${errors.cap ? 'error' : ''}`}
                placeholder="00100"
                maxLength="5"
              />
              {errors.cap && <span className="error-text">{errors.cap}</span>}
            </div>

            <div className="form-group">
              <label className="step-label">
                Città <span className="label-required">*</span>
              </label>
              <input
                type="text"
                name="citta"
                value={formData.citta}
                onChange={handleChange}
                className={`form-input ${errors.citta ? 'error' : ''}`}
                placeholder="Roma"
              />
              {errors.citta && <span className="error-text">{errors.citta}</span>}
            </div>

            <div className="form-group form-group-small">
              <label className="step-label">
                Provincia <span className="label-required">*</span>
              </label>
              <input
                type="text"
                name="provincia"
                value={formData.provincia}
                onChange={handleChange}
                className={`form-input ${errors.provincia ? 'error' : ''}`}
                placeholder="RM"
                maxLength="2"
              />
              {errors.provincia && <span className="error-text">{errors.provincia}</span>}
            </div>
          </div>
        </div>

        {/* Dati Fornitura Attuale */}
        <div className="form-section">
          <h3 className="section-title">⚡ Dati fornitura attuale</h3>
          
          {(tipoFornitura === 'luce' || tipoFornitura === 'dual') && (
            <div className="form-group">
              <label className="step-label">
                Codice POD
                <span className="label-hint">Codice identificativo utenza elettrica (opzionale ma consigliato)</span>
              </label>
              <input
                type="text"
                name="codicePod"
                value={formData.codicePod}
                onChange={handleChange}
                className={`form-input ${errors.codicePod ? 'error' : ''}`}
                placeholder="IT001E12345678"
              />
              {errors.codicePod && <span className="error-text">{errors.codicePod}</span>}
              <p className="hint-text">Lo trovi sulla bolletta della luce. Formato: IT001E12345678</p>
            </div>
          )}

          {(tipoFornitura === 'gas' || tipoFornitura === 'dual') && (
            <div className="form-group">
              <label className="step-label">
                Codice PDR
                <span className="label-hint">Codice identificativo utenza gas (opzionale ma consigliato)</span>
              </label>
              <input
                type="text"
                name="codicePdr"
                value={formData.codicePdr}
                onChange={handleChange}
                className={`form-input ${errors.codicePdr ? 'error' : ''}`}
                placeholder="12345678901234"
                maxLength="14"
              />
              {errors.codicePdr && <span className="error-text">{errors.codicePdr}</span>}
              <p className="hint-text">Lo trovi sulla bolletta del gas. Formato: 14 cifre numeriche</p>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="step-label">Fornitore attuale</label>
              <input
                type="text"
                name="fornitoreAttuale"
                value={formData.fornitoreAttuale}
                onChange={handleChange}
                className="form-input"
                placeholder="es. Enel, Eni, A2A..."
              />
            </div>

            <div className="form-group">
              <label className="step-label">Tipo contratto attuale</label>
              <select
                name="tipoContrattoAttuale"
                value={formData.tipoContrattoAttuale}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Seleziona...</option>
                <option value="mercato_libero">Mercato Libero</option>
                <option value="maggior_tutela">Maggior Tutela</option>
                <option value="non_so">Non so</option>
              </select>
            </div>
          </div>
        </div>

        {/* Note Aggiuntive */}
        <div className="form-section">
          <h3 className="section-title">💬 Note aggiuntive (opzionale)</h3>
          
          <div className="form-group">
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Hai richieste particolari o vuoi comunicarci qualcosa? Scrivilo qui..."
              rows="4"
            />
          </div>
        </div>

        {/* Consensi Privacy */}
        <div className="form-section">
          <h3 className="section-title">🔒 Privacy e consensi</h3>
          
          <div className="checkbox-group">
            <label className={`checkbox-label ${errors.privacyAccettata ? 'error' : ''}`}>
              <input
                type="checkbox"
                name="privacyAccettata"
                checked={formData.privacyAccettata}
                onChange={handleChange}
              />
              <span>
                <strong>Accetto l'informativa privacy</strong> <span className="label-required">*</span>
                <br />
                <small>
                  Ho letto e accetto l'
                  <a href="/privacy" target="_blank" rel="noopener noreferrer"> informativa sulla privacy</a>
                  {' '}e il trattamento dei miei dati personali
                </small>
              </span>
            </label>
            {errors.privacyAccettata && <span className="error-text">{errors.privacyAccettata}</span>}
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="condizioniAccettate"
                checked={formData.condizioniAccettate}
                onChange={handleChange}
              />
              <span>
                Accetto i{' '}
                <a href="/termini" target="_blank" rel="noopener noreferrer">termini e condizioni</a>
                {' '}del servizio
              </span>
            </label>
          </div>
        </div>

        <div className="info-box">
          <p>
            ℹ️ I tuoi dati verranno utilizzati esclusivamente per processare la tua richiesta
            e non saranno condivisi con terze parti senza il tuo consenso.
          </p>
        </div>
      </div>

      <div className="step-actions">
        <button 
          className="btn btn-secondary"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Indietro
        </button>
        <button 
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
