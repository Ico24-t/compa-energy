import React from 'react';
import { formatCurrency } from '../utils/validators';

const Step4DettaglioOfferta = ({ onNext, onBack, offerta }) => {
  if (!offerta) {
    return null;
  }

  const fornitore = offerta.fornitori;

  return (
    <div className="step-container">
      <div className="step-header">
        <h2>Ecco la tua offerta personalizzata</h2>
        <p>Tutti i dettagli del fornitore e dell'offerta</p>
      </div>

      <div className="step-content">
        {/* Card Fornitore */}
        <div className="fornitore-card">
          {fornitore.logo_url && (
            <div className="fornitore-logo">
              <img src={fornitore.logo_url} alt={fornitore.nome} />
            </div>
          )}
          <h3 className="fornitore-nome">{fornitore.nome}</h3>
          {fornitore.sito_web && (
            <a 
              href={fornitore.sito_web} 
              target="_blank" 
              rel="noopener noreferrer"
              className="fornitore-link"
            >
              Visita il sito →
            </a>
          )}
        </div>

        {/* Nome Offerta */}
        <div className="offerta-title-section">
          <h2>{offerta.nome_offerta}</h2>
          {offerta.descrizione_breve && (
            <p className="offerta-subtitle">{offerta.descrizione_breve}</p>
          )}
          {offerta.promozione && (
            <span className="badge badge-promo">🔥 Promozione Limitata</span>
          )}
        </div>

        {/* Risparmio Evidenziato */}
        <div className="risparmio-box-highlight">
          <div className="risparmio-row">
            <span className="risparmio-label">Risparmio stimato annuo</span>
            <span className="risparmio-value-big">{formatCurrency(offerta.risparmioAnnuo)}</span>
          </div>
          <div className="risparmio-row">
            <span className="risparmio-label">Risparmio mensile</span>
            <span className="risparmio-value">{formatCurrency(offerta.risparmioMensile)}</span>
          </div>
        </div>

        {/* Dettagli Tariffe */}
        <div className="tariffe-section">
          <h3>Dettagli tariffe</h3>
          
          <div className="tariffe-table">
            {offerta.prezzo_kwh && (
              <div className="tariffa-row">
                <span className="tariffa-label">
                  ⚡ Prezzo energia elettrica
                  {offerta.tipo_tariffa_luce && (
                    <span className="tariffa-tipo"> ({offerta.tipo_tariffa_luce})</span>
                  )}
                </span>
                <span className="tariffa-value">{offerta.prezzo_kwh.toFixed(6)} €/kWh</span>
              </div>
            )}
            
            {offerta.prezzo_smc && (
              <div className="tariffa-row">
                <span className="tariffa-label">🔥 Prezzo gas naturale</span>
                <span className="tariffa-value">{offerta.prezzo_smc.toFixed(6)} €/Smc</span>
              </div>
            )}
            
            {offerta.quota_fissa_luce_mensile > 0 && (
              <div className="tariffa-row">
                <span className="tariffa-label">📋 Quota fissa luce</span>
                <span className="tariffa-value">{formatCurrency(offerta.quota_fissa_luce_mensile)}/mese</span>
              </div>
            )}
            
            {offerta.quota_fissa_gas_mensile > 0 && (
              <div className="tariffa-row">
                <span className="tariffa-label">📋 Quota fissa gas</span>
                <span className="tariffa-value">{formatCurrency(offerta.quota_fissa_gas_mensile)}/mese</span>
              </div>
            )}
            
            {offerta.potenza_contrattuale && (
              <div className="tariffa-row">
                <span className="tariffa-label">🔌 Potenza impegnata</span>
                <span className="tariffa-value">{offerta.potenza_contrattuale} kW</span>
              </div>
            )}
          </div>
        </div>

        {/* Condizioni Contrattuali */}
        <div className="condizioni-section">
          <h3>Condizioni contrattuali</h3>
          
          <div className="condizioni-grid">
            {offerta.durata_mesi && (
              <div className="condizione-item">
                <span className="condizione-icon">📅</span>
                <div>
                  <div className="condizione-label">Durata contratto</div>
                  <div className="condizione-value">{offerta.durata_mesi} mesi</div>
                </div>
              </div>
            )}
            
            <div className="condizione-item">
              <span className="condizione-icon">🔄</span>
              <div>
                <div className="condizione-label">Rinnovo</div>
                <div className="condizione-value">
                  {offerta.rinnovo_automatico ? 'Automatico' : 'Manuale'}
                </div>
              </div>
            </div>
            
            <div className="condizione-item">
              <span className="condizione-icon">💰</span>
              <div>
                <div className="condizione-label">Penale recesso</div>
                <div className="condizione-value">
                  {offerta.penale_recesso > 0 
                    ? formatCurrency(offerta.penale_recesso)
                    : 'Nessuna'}
                </div>
              </div>
            </div>
            
            {offerta.bonus_attivazione > 0 && (
              <div className="condizione-item">
                <span className="condizione-icon">🎁</span>
                <div>
                  <div className="condizione-label">Bonus attivazione</div>
                  <div className="condizione-value">{formatCurrency(offerta.bonus_attivazione)}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Agevolazioni e Vantaggi */}
        <div className="agevolazioni-section">
          <h3>Agevolazioni e vantaggi</h3>
          
          <div className="vantaggi-grid">
            {offerta.green_energy && (
              <div className="vantaggio-card">
                <span className="vantaggio-icon">🌱</span>
                <div className="vantaggio-content">
                  <h4>Energia Verde</h4>
                  <p>100% da fonti rinnovabili certificate</p>
                </div>
              </div>
            )}
            
            {offerta.digitale && (
              <div className="vantaggio-card">
                <span className="vantaggio-icon">📱</span>
                <div className="vantaggio-content">
                  <h4>Digitale</h4>
                  <p>Gestione completa via app e area clienti online</p>
                </div>
              </div>
            )}
            
            {offerta.descrizione_completa && (
              <div className="vantaggio-card full-width">
                <span className="vantaggio-icon">ℹ️</span>
                <div className="vantaggio-content">
                  <h4>Informazioni aggiuntive</h4>
                  <p>{offerta.descrizione_completa}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scadenza Offerta */}
        {offerta.valido_fino && (
          <div className="scadenza-box">
            <span className="scadenza-icon">⏰</span>
            <div>
              <strong>Offerta valida fino al:</strong> {' '}
              {new Date(offerta.valido_fino).toLocaleDateString('it-IT')}
            </div>
          </div>
        )}

        {/* Note importanti */}
        <div className="note-box">
          <h4>📌 Note importanti</h4>
          <ul>
            <li>I prezzi indicati sono IVA esclusa. Verrà applicata l'IVA secondo la normativa vigente.</li>
            <li>I consumi indicati sono stimati e potrebbero variare in base all'utilizzo effettivo.</li>
            <li>Il risparmio è calcolato rispetto alla tua spesa attuale dichiarata.</li>
            <li>Questa è un'offerta preliminare. Il contratto finale potrebbe contenere condizioni aggiornate.</li>
          </ul>
        </div>
      </div>

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={onBack}>
          Indietro
        </button>
        <button className="btn btn-primary btn-large" onClick={onNext}>
          Prosegui con l'attivazione
        </button>
      </div>
    </div>
  );
};

export default Step4DettaglioOfferta;
