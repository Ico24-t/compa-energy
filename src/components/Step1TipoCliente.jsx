import React, { useState } from 'react';

const Step1TipoCliente = ({ onNext, initialData }) => {
  const [tipoCliente, setTipoCliente] = useState(initialData?.tipoCliente || '');
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!tipoCliente) {
      setError('Seleziona il tipo di cliente');
      return;
    }
    
    onNext({ tipoCliente });
  };

  const tipiCliente = [
    {
      value: 'privato',
      icon: '🏠',
      title: 'Privato',
      description: 'Utenza domestica residenziale'
    },
    {
      value: 'p_iva',
      icon: '💼',
      title: 'Partita IVA',
      description: 'Professionista o lavoratore autonomo'
    },
    {
      value: 'azienda',
      icon: '🏢',
      title: 'Azienda',
      description: 'Impresa o società'
    }
  ];

  return (
    <div className="step-container">
      <div className="step-header">
        <h2>Benvenuto!</h2>
        <p>Iniziamo trovando l'offerta perfetta per te</p>
      </div>

      <div className="step-content">
        <label className="step-label">Seleziona il tipo di utenza</label>
        
        <div className="tipo-cliente-grid">
          {tipiCliente.map((tipo) => (
            <button
              key={tipo.value}
              className={`tipo-cliente-card ${tipoCliente === tipo.value ? 'selected' : ''}`}
              onClick={() => {
                setTipoCliente(tipo.value);
                setError('');
              }}
              type="button"
            >
              <div className="tipo-icon">{tipo.icon}</div>
              <div className="tipo-title">{tipo.title}</div>
              <div className="tipo-description">{tipo.description}</div>
            </button>
          ))}
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="step-actions">
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

export default Step1TipoCliente;
