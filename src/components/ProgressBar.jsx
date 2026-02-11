import React from 'react';

const ProgressBar = ({ currentStep, totalSteps = 6 }) => {
  const percentage = (currentStep / totalSteps) * 100;
  
  const steps = [
    { num: 1, label: 'Tipo' },
    { num: 2, label: 'Consumi' },
    { num: 3, label: 'Offerta' },
    { num: 4, label: 'Dettagli' },
    { num: 5, label: 'Dati' },
    { num: 6, label: 'Conferma' }
  ];

  return (
    <div className="progress-container">
      <div className="progress-bar-wrapper">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      <div className="progress-steps">
        {steps.map((step) => (
          <div 
            key={step.num}
            className={`progress-step ${currentStep >= step.num ? 'active' : ''} ${currentStep === step.num ? 'current' : ''}`}
          >
            <div className="step-number">{step.num}</div>
            <div className="step-label">{step.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
