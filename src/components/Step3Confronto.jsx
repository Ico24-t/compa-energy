import React, { useState, useEffect } from 'react';
import { validateStep3, formatCurrency, formatNumber } from '../utils/validators';

const Step3Confronto = ({ onNext, onBack, offerta, isMigliorativa, loading }) => {
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');
  const [showTelefonoInput, setShowTelefonoInput] = useState(false);

  useEffect(() => {
    // Se l&apos;offerta non è migliorativa, mostra il messaggio e non richiedere telefono
    if (!loading && !isMigliorativa) {
      setShowTelefonoInput(false);
    } else if (!loading && isMigliorativa) {
      setShowTelefonoInput(true);
    }
  }, [loading, isMigliorativa]);

  const handleContinua = () => {
    if (!showTelefonoInput) {
      // Non migliorativa - prosegui senza telefono
      onNext({ interessato: false });
      return;
    }

    // Offerta migliorativa - valida telefono
    const validation = validateStep3(telefono);
    
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }
    
    onNext({ telefono, interessato: true });
  };

  if (loading) {
    return (
      <div className="step-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <h3>Stiamo calcolando la migliore offerta per te...</h3>
          <p>Un momento, per favore</p>
        </div>
      </div>
    );
  }

  // Caso: Nessuna offerta disponibile
  if (!offerta) {
    return (
      <div className="step-container">
        <div className="step-header">
          <h2>😔 Ci dispiace</h2>
        </div>
        <div className="step-content">
          <div className="alert alert-info">
            <p>Al momento non abbiamo offerte disponibili per il profilo inserito.</p>
            <p>Verrai contattato appena avremo proposte vantaggiose per te!</p>
          </div>
        </div>
        <div className="step-actions">
          <button className="btn btn-secondary" onClick={onBack}>
            Indietro
          </button>
        </div>
      </div>
    );
  }

  // Caso: Offerta NON migliorativa
  if (!isMigliorativa) {
    return (
      <div className="step-container">
        <div className="step-header">
          <h2>La tua offerta attuale è già ottima! 👍</h2>
        </div>
        
        <div className="step-content">
          <div className="alert alert-success">
            <p className="alert-title">🎯 Ottima notizia!</p>
            <p>
              Al momento la tua offerta attuale è già molto competitiva. 
              Non abbiamo proposte significativamente più vantaggiose da offrirti.
            </p>
          </div>

          <div className="info-box">
            <h3>Ti avviseremo quando avremo qualcosa di meglio</h3>
            <p>
              Monitoriamo costantemente il mercato dell&apos;energia. 
              Ti contatteremo via email non appena avremo un&apos;offerta 
              che possa farti risparmiare rispetto alla tua situazione attuale.
            </p>
            <div className="features-list">
              <div className="feature-item">
                <span className="feature-icon">📧</span>
                <span>Notifiche solo per offerte vantaggiose</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💰</span>
                <span>Nessun costo o impegno</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔔</span>
                <span>Aggiornamenti quando il mercato cambia</span>
              </div>
            </div>
          </div>

          <div className="current-offer-summary">
            <h4>La tua situazione attuale</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Spesa annuale stimata</span>
                <span className="summary-value">{formatCurrency(offerta.spesaAttuale)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Spesa mensile media</span>
                <span className="summary-value">{formatCurrency(offerta.spesaAttuale / 12)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="step-actions">
          <button className="btn btn-secondary" onClick={onBack}>
            Indietro
          </button>
          <button className="btn btn-primary btn-large" onClick={handleContinua}>
            Ho capito, grazie
          </button>
        </div>
      </div>
    );
  }

  // Caso: Offerta MIGLIORATIVA
  return (
    <div className="step-container">
      <div className="step-header">
        <div className="risparmio-banner">
          <h2>🎉 Abbiamo la tua offerta esclusiva!</h2>
          <div className="risparmio-highlight">
            <div className="risparmio-amount">
              {formatCurrency(offerta.risparmioAnnuo)}
            </div>
            <div className="risparmio-label">di risparmio all&apos;anno</div>
            <div className="risparmio-percentage">
              (-{offerta.risparmioPercentuale.toFixed(1)}% rispetto alla tua spesa attuale)
            </div>
          </div>
        </div>
      </div>

      <div className="step-content">
        <div className="alert alert-warning">
          <p className="alert-title">⏰ Offerta riservata valida 48 ore</p>
          <p>Questa proposta esclusiva è riservata solo per te per le prossime 48 ore</p>
        </div>

        {/* Confronto Spese */}
        <div className="confronto-container">
          <h3>Confronto spese</h3>
          
          <div className="confronto-grid">
            {/* Situazione Attuale */}
            <div className="confronto-card confronto-attuale">
              <div className="card-header">
                <h4>La tua bolletta attuale</h4>
              </div>
              <div className="card-body">
                <div className="price-display">
                  <div className="price-amount">{formatCurrency(offerta.spesaAttuale / 12)}</div>
                  <div className="price-label">al mese</div>
                </div>
                <div className="price-annual">
                  {formatCurrency(offerta.spesaAttuale)} all&apos;anno
                </div>
              </div>
            </div>

            {/* Freccia risparmio */}
            <div className="confronto-arrow">
              <div className="arrow-icon">→</div>
              <div className="arrow-label">Risparmio</div>
              <div className="arrow-amount">{formatCurrency(offerta.risparmioMensile)}/mese</div>
            </div>

            {/* Nuova Offerta */}
            <div className="confronto-card confronto-nuova">
              <div className="card-header">
                <h4>Con la nuova offerta</h4>
                <span className="badge badge-success">Consigliata</span>
              </div>
              <div className="card-body">
                <div className="price-display">
                  <div className="price-amount">{formatCurrency(offerta.spesaOfferta / 12)}</div>
                  <div className="price-label">al mese</div>
                </div>
                <div className="price-annual">
                  {formatCurrency(offerta.spesaOfferta)} all&apos;anno
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dettagli Offerta (senza fornitore) */}
        <div className="offerta-dettagli">
          <h3>Cosa include questa offerta</h3>
          
          <div className="dettagli-grid">
            {offerta.prezzo_kwh && (
              <div className="dettaglio-item">
                <span className="dettaglio-icon">⚡</span>
                <div>
                  <div className="dettaglio-label">Prezzo energia elettrica</div>
                  <div className="dettaglio-value">{offerta.prezzo_kwh.toFixed(4)} €/kWh</div>
                </div>
              </div>
            )}
            
            {offerta.prezzo_smc && (
              <div className="dettaglio-item">
                <span className="dettaglio-icon">🔥</span>
                <div>
                  <div className="dettaglio-label">Prezzo gas naturale</div>
                  <div className="dettaglio-value">{offerta.prezzo_smc.toFixed(4)} €/Smc</div>
                </div>
              </div>
            )}
            
            {offerta.quota_fissa_luce_mensile > 0 && (
              <div className="dettaglio-item">
                <span className="dettaglio-icon">📋</span>
                <div>
                  <div className="dettaglio-label">Quota fissa luce</div>
                  <div className="dettaglio-value">{formatCurrency(offerta.quota_fissa_luce_mensile)}/mese</div>
                </div>
              </div>
            )}
            
            {offerta.quota_fissa_gas_mensile > 0 && (
              <div className="dettaglio-item">
                <span className="dettaglio-icon">📋</span>
                <div>
                  <div className="dettaglio-label">Quota fissa gas</div>
                  <div className="dettaglio-value">{formatCurrency(offerta.quota_fissa_gas_mensile)}/mese</div>
                </div>
              </div>
            )}
          </div>

          {/* Vantaggi */}
          <div className="vantaggi-list">
            <h4>Vantaggi dell&apos;offerta</h4>
            {offerta.green_energy && (
              <div className="vantaggio-item">
                <span className="check-icon">✓</span>
                <span>Energia 100% verde da fonti rinnovabili</span>
              </div>
            )}
            {offerta.digitale && (
              <div className="vantaggio-item">
                <span className="check-icon">✓</span>
                <span>Gestione completamente digitale via app</span>
              </div>
            )}
            {offerta.bonus_attivazione > 0 && (
              <div className="vantaggio-item">
                <span className="check-icon">✓</span>
                <span>Bonus attivazione di {formatCurrency(offerta.bonus_attivazione)}</span>
              </div>
            )}
            {offerta.durata_mesi && (
              <div className="vantaggio-item">
                <span className="check-icon">✓</span>
                <span>Prezzo bloccato per {offerta.durata_mesi} mesi</span>
              </div>
            )}
            {!offerta.penale_recesso || offerta.penale_recesso === 0 && (
              <div className="vantaggio-item">
                <span className="check-icon">✓</span>
                <span>Nessuna penale di recesso</span>
              </div>
            )}
          </div>

          {/* Condizioni */}
          {offerta.descrizione_completa && (
            <div className="condizioni-box">
              <h4>Condizioni</h4>
              <p>{offerta.descrizione_completa}</p>
            </div>
          )}
        </div>

        {/* Input Telefono */}
        {showTelefonoInput && (
          <div className="telefono-section">
            <div className="form-group">
              <label className="step-label">
                Inserisci il tuo numero di telefono per continuare
                <span className="label-required">*</span>
              </label>
              <p className="hint-text">
                Ti contatteremo solo per confermare l&apos;attivazione dell&apos;offerta
              </p>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => {
                  setTelefono(e.target.value);
                  setError('');
                }}
                placeholder="+39 333 1234567"
                className={`form-input ${error ? 'error' : ''}`}
              />
              {error && <span className="error-text">{error}</span>}
            </div>

            <div className="privacy-notice">
              <p>
                📞 Il tuo numero verrà utilizzato esclusivamente per contattarti 
                riguardo questa offerta. Non lo condivideremo con terze parti.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={onBack}>
          Indietro
        </button>
        <button className="btn btn-primary btn-large" onClick={handleContinua}>
          {showTelefonoInput ? 'Sono interessato!' : 'Continua'}
        </button>
      </div>
    </div>
  );
};

export default Step3Confronto;
