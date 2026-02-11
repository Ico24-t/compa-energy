import React, { useState, useEffect } from 'react';
import { validateStep2, stimaConsumoAnnuo } from '../utils/validators';

const Step2Consumi = ({ onNext, onBack, initialData }) => {
  const [formData, setFormData] = useState({
    tipoFornitura: initialData?.tipoFornitura || '',
    potenzaContatore: initialData?.potenzaContatore || '',
    spesaMensile: initialData?.spesaMensile || '',
    consumoAnnuoKwh: initialData?.consumoAnnuoKwh || '',
    consumoAnnuoSmc: initialData?.consumoAnnuoSmc || '',
    email: initialData?.email || '',
    marketingConsent: initialData?.marketingConsent || false
  });
  
  const [errors, setErrors] = useState({});
  const [showConsumoStimato, setShowConsumoStimato] = useState(false);

  // Stima consumo quando cambia la spesa
  useEffect(() => {
    if (formData.spesaMensile && formData.tipoFornitura) {
      const stima = stimaConsumoAnnuo(parseFloat(formData.spesaMensile), formData.tipoFornitura);
      
      if (formData.tipoFornitura === 'dual') {
        setFormData(prev => ({
          ...prev,
          consumoAnnuoKwh: prev.consumoAnnuoKwh || stima.kwh,
          consumoAnnuoSmc: prev.consumoAnnuoSmc || stima.smc
        }));
      } else if (formData.tipoFornitura === 'luce') {
        setFormData(prev => ({
          ...prev,
          consumoAnnuoKwh: prev.consumoAnnuoKwh || stima
        }));
      } else if (formData.tipoFornitura === 'gas') {
        setFormData(prev => ({
          ...prev,
          consumoAnnuoSmc: prev.consumoAnnuoSmc || stima
        }));
      }
      
      setShowConsumoStimato(true);
    }
  }, [formData.spesaMensile, formData.tipoFornitura]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Rimuovi errore quando l'utente modifica
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNext = () => {
    const validation = validateStep2(formData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    onNext(formData);
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <h2>I tuoi consumi</h2>
        <p>Aiutaci a trovare l'offerta migliore per te</p>
      </div>

      <div className="step-content">
        {/* Tipo Fornitura */}
        <div className="form-group">
          <label className="step-label">Quale servizio ti interessa?</label>
          <div className="btn-group-toggle">
            <button
              type="button"
              className={`btn-toggle ${formData.tipoFornitura === 'luce' ? 'active' : ''}`}
              onClick={() => handleChange({ target: { name: 'tipoFornitura', value: 'luce' }})}
            >
              ⚡ Solo Luce
            </button>
            <button
              type="button"
              className={`btn-toggle ${formData.tipoFornitura === 'gas' ? 'active' : ''}`}
              onClick={() => handleChange({ target: { name: 'tipoFornitura', value: 'gas' }})}
            >
              🔥 Solo Gas
            </button>
            <button
              type="button"
              className={`btn-toggle ${formData.tipoFornitura === 'dual' ? 'active' : ''}`}
              onClick={() => handleChange({ target: { name: 'tipoFornitura', value: 'dual' }})}
            >
              💡 Luce + Gas
            </button>
          </div>
          {errors.tipoFornitura && <span className="error-text">{errors.tipoFornitura}</span>}
        </div>

        {/* Potenza Contatore (solo per luce) */}
        {(formData.tipoFornitura === 'luce' || formData.tipoFornitura === 'dual') && (
          <div className="form-group">
            <label className="step-label">Potenza contatore elettrico</label>
            <select 
              name="potenzaContatore"
              value={formData.potenzaContatore}
              onChange={handleChange}
              className={`form-select ${errors.potenzaContatore ? 'error' : ''}`}
            >
              <option value="">Seleziona potenza...</option>
              <option value="3">3 kW</option>
              <option value="4.5">4.5 kW</option>
              <option value="6">6 kW</option>
              <option value="10">10 kW</option>
              <option value="15">15 kW o superiore</option>
            </select>
            {errors.potenzaContatore && <span className="error-text">{errors.potenzaContatore}</span>}
          </div>
        )}

        {/* Spesa Mensile */}
        <div className="form-group">
          <label className="step-label">
            Quanto spendi mediamente al mese?
            <span className="label-hint">Include tutte le bollette del servizio scelto</span>
          </label>
          <div className="input-with-suffix">
            <input
              type="number"
              name="spesaMensile"
              value={formData.spesaMensile}
              onChange={handleChange}
              placeholder="es. 80"
              className={`form-input ${errors.spesaMensile ? 'error' : ''}`}
              min="0"
              step="0.01"
            />
            <span className="input-suffix">€/mese</span>
          </div>
          {errors.spesaMensile && <span className="error-text">{errors.spesaMensile}</span>}
        </div>

        {/* Consumi Stimati (opzionali ma compilati automaticamente) */}
        {showConsumoStimato && (
          <div className="consumo-stimato-box">
            <p className="info-text">📊 Basandoci sulla tua spesa, stimiamo:</p>
            
            {(formData.tipoFornitura === 'luce' || formData.tipoFornitura === 'dual') && (
              <div className="form-group-inline">
                <label>Consumo annuo elettrico</label>
                <div className="input-with-suffix">
                  <input
                    type="number"
                    name="consumoAnnuoKwh"
                    value={formData.consumoAnnuoKwh}
                    onChange={handleChange}
                    className="form-input"
                  />
                  <span className="input-suffix">kWh/anno</span>
                </div>
              </div>
            )}
            
            {(formData.tipoFornitura === 'gas' || formData.tipoFornitura === 'dual') && (
              <div className="form-group-inline">
                <label>Consumo annuo gas</label>
                <div className="input-with-suffix">
                  <input
                    type="number"
                    name="consumoAnnuoSmc"
                    value={formData.consumoAnnuoSmc}
                    onChange={handleChange}
                    className="form-input"
                  />
                  <span className="input-suffix">Smc/anno</span>
                </div>
              </div>
            )}
            
            <p className="hint-text">Puoi modificare questi valori se li conosci con precisione</p>
          </div>
        )}

        {/* Email */}
        <div className="form-group">
          <label className="step-label">
            Email
            <span className="label-required">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="tuaemail@esempio.it"
            className={`form-input ${errors.email ? 'error' : ''}`}
            required
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
          <p className="hint-text">Ti invieremo l'offerta personalizzata via email</p>
        </div>

        {/* Marketing Consent */}
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="marketingConsent"
              checked={formData.marketingConsent}
              onChange={handleChange}
            />
            <span>
              Desidero ricevere comunicazioni commerciali e aggiornamenti su offerte vantaggiose
            </span>
          </label>
        </div>
      </div>

      <div className="step-actions">
        <button 
          className="btn btn-secondary"
          onClick={onBack}
        >
          Indietro
        </button>
        <button 
          className="btn btn-primary btn-large"
          onClick={handleNext}
        >
          Continua
        </button>
      </div>
    </div>
  );
};

export default Step2Consumi;
