import React, { useState, useEffect } from 'react';
import ProgressBar from './components/ProgressBar';
import Step1TipoCliente from './components/Step1TipoCliente';
import Step2Consumi from './components/Step2Consumi';
import Step3Confronto from './components/Step3Confronto';
import Step4DettaglioOfferta from './components/Step4DettaglioOfferta';
import Step5Anagrafica from './components/Step5Anagrafica';
import Step6Conferma from './components/Step6Conferma';

import {
  createLead,
  saveConsumi,
  calcolaMiglioreOfferta,
  updateLeadTelefono,
  createPreContratto,
  confermaInvioPreContratto,
  testSupabaseConnection
} from './services/offerteService';

import { initEmailJS, checkEmailJSConfig } from './services/emailService';
import { testConnection } from './services/supabaseClient';

import './styles/App.css';

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [leadId, setLeadId] = useState(null);
  const [offerta, setOfferta] = useState(null);
  const [isMigliorativa, setIsMigliorativa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailInviata, setEmailInviata] = useState(false);
  const [codiceRichiesta, setCodiceRichiesta] = useState('');
  const [connectionError, setConnectionError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Monitora stato connessione
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Inizializza servizi all'avvio
  useEffect(() => {
    const init = async () => {
      console.log('🚀 Inizializzazione app...');
      console.log('📱 Dispositivo:', /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop');
      
      // Inizializza EmailJS
      const emailJsInit = initEmailJS();
      
      // Verifica configurazione EmailJS
      const emailConfig = checkEmailJSConfig();
      console.log('📧 Config EmailJS:', emailConfig);
      
      // Test connessione Supabase
      const supabaseTest = await testConnection();
      console.log('🔌 Test Supabase:', supabaseTest);
      
      if (!supabaseTest.success) {
        setConnectionError('Problemi di connessione al database. Verifica la tua connessione internet.');
      }
    };
    
    init();
  }, []);

  // Handler per passare al prossimo step
  const handleNext = async (stepData) => {
    // Verifica connessione prima di procedere
    if (isOffline) {
      alert('Sei offline. Alcune funzionalità potrebbero non essere disponibili.');
    }

    const newFormData = { ...formData, ...stepData };
    setFormData(newFormData);

    try {
      switch (currentStep) {
        case 1:
          await handleStep1(newFormData);
          break;

        case 2:
          await handleStep2(newFormData);
          break;

        case 3:
          await handleStep3(newFormData);
          break;

        case 4:
          setCurrentStep(5);
          break;

        case 5:
          await handleStep5(newFormData);
          break;

        default:
          setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.error('❌ Errore nel passaggio step:', error);
      alert('Si è verificato un errore. Riprova più tardi.');
    }
  };

  // Handler per tornare indietro
  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  // Step 1: Crea lead nel database
  const handleStep1 = async (data) => {
    setLoading(true);
    try {
      // Crea lead immediatamente
      const leadResult = await createLead({
        email: data.email || 'temp@example.com', // Email temporanea se non presente
        tipoCliente: data.tipoCliente,
        marketingConsent: false
      });

      if (leadResult.success) {
        setLeadId(leadResult.data.id);
        console.log('✅ Lead creato:', leadResult.data.id);
      }
    } catch (error) {
      console.error('❌ Errore creazione lead:', error);
    } finally {
      setLoading(false);
      setCurrentStep(2);
    }
  };

  // Step 2: Salva consumi e crea lead con email
  const handleStep2 = async (data) => {
    setLoading(true);

    try {
      // Crea lead se non esiste
      if (!leadId) {
        const leadResult = await createLead({
          email: data.email,
          tipoCliente: data.tipoCliente || formData.tipoCliente,
          marketingConsent: data.marketingConsent || false
        });

        if (!leadResult.success) {
          throw new Error('Errore nel salvataggio dei dati');
        }

        setLeadId(leadResult.data.id);
      }
      
      // Salva consumi
      if (leadId || leadId) {
        await saveConsumi(leadId || leadId, {
          tipoFornitura: data.tipoFornitura,
          potenzaContatore: data.potenzaContatore,
          spesaMensile: data.spesaMensile,
          consumoAnnuoKwh: data.consumoAnnuoKwh,
          consumoAnnuoSmc: data.consumoAnnuoSmc
        });

        // Calcola migliore offerta
        const offertaResult = await calcolaMiglioreOfferta(leadId || leadId, {
          tipoFornitura: data.tipoFornitura,
          spesaMensile: data.spesaMensile,
          consumoAnnuoKwh: data.consumoAnnuoKwh,
          consumoAnnuoSmc: data.consumoAnnuoSmc
        });

        if (offertaResult.success && offertaResult.offerta) {
          setOfferta(offertaResult.offerta);
          setIsMigliorativa(offertaResult.isMigliorativa);
        } else {
          setOfferta(null);
          setIsMigliorativa(false);
        }
      }

      setCurrentStep(3);
    } catch (error) {
      console.error('❌ Errore step 2:', error);
      alert('Si è verificato un errore. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Gestisce interesse e telefono
  const handleStep3 = async (data) => {
    if (!data.interessato) {
      setCurrentStep(6);
      return;
    }

    // Interessato - salva telefono
    if (data.telefono && leadId) {
      await updateLeadTelefono(leadId, data.telefono);
    }

    setCurrentStep(4);
  };

  // Step 5: Salva anagrafica e invia email
  const handleStep5 = async (data) => {
    setLoading(true);

    try {
      if (!leadId || !offerta) {
        throw new Error('Dati mancanti');
      }

      // Crea pre-contratto
      const preContrattoResult = await createPreContratto(leadId, offerta.id, {
        nome: data.nome,
        cognome: data.cognome,
        codiceFiscale: data.codiceFiscale,
        dataNascita: data.dataNascita,
        luogoNascita: data.luogoNascita,
        indirizzoFornitura: data.indirizzoFornitura,
        cap: data.cap,
        citta: data.citta,
        provincia: data.provincia,
        codicePod: data.codicePod,
        codicePdr: data.codicePdr,
        fornitoreAttuale: data.fornitoreAttuale,
        tipoContrattoAttuale: data.tipoContrattoAttuale,
        note: data.note
      });

      if (!preContrattoResult.success) {
        throw new Error('Errore nel salvataggio');
      }

      setCodiceRichiesta(preContrattoResult.data.id.substring(0, 8).toUpperCase());

      // Prepara dati per email
      const datiCompleti = {
        ...formData,
        ...data,
        telefono: formData.telefono,
        email: formData.email
      };

      // Invia email (anche se offline, salva i dati)
      const emailResult = await inviaEmailComplete(
        datiCompleti,
        offerta,
        preContrattoResult.data,
        leadId
      );

      if (emailResult.success) {
        setEmailInviata(true);
        
        // Conferma invio nel database
        await confermaInvioPreContratto(preContrattoResult.data.id, leadId);
      } else if (emailResult.offline) {
        // Salva in localStorage per invio quando torna online
        saveOfflineData(preContrattoResult.data.id, datiCompleti, offerta);
        setEmailInviata(false);
      }

      setCurrentStep(6);
    } catch (error) {
      console.error('❌ Errore step 5:', error);
      alert('Si è verificato un errore. I tuoi dati sono stati salvati, ma potrebbero esserci problemi con l\'invio delle email.');
      setCurrentStep(6);
    } finally {
      setLoading(false);
    }
  };

  // Salva dati per invio offline
  const saveOfflineData = (preContrattoId, dati, offerta) => {
    try {
      const offlineData = JSON.parse(localStorage.getItem('offlineEmails') || '[]');
      offlineData.push({
        id: preContrattoId,
        dati,
        offerta,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('offlineEmails', JSON.stringify(offlineData));
      console.log('💾 Dati salvati per invio offline');
    } catch (e) {
      console.error('Errore salvataggio offline:', e);
    }
  };

  // Render dello step corrente
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1TipoCliente
            onNext={handleNext}
            initialData={formData}
          />
        );

      case 2:
        return (
          <Step2Consumi
            onNext={handleNext}
            onBack={handleBack}
            initialData={formData}
          />
        );

      case 3:
        return (
          <Step3Confronto
            onNext={handleNext}
            onBack={handleBack}
            offerta={offerta}
            isMigliorativa={isMigliorativa}
            loading={loading}
          />
        );

      case 4:
        return (
          <Step4DettaglioOfferta
            onNext={handleNext}
            onBack={handleBack}
            offerta={offerta}
          />
        );

      case 5:
        return (
          <Step5Anagrafica
            onNext={handleNext}
            onBack={handleBack}
            initialData={formData}
            tipoFornitura={formData.tipoFornitura}
          />
        );

      case 6:
        return (
          <Step6Conferma
            offerta={offerta}
            emailInviata={emailInviata}
            codiceRichiesta={codiceRichiesta}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      {/* Banner offline */}
      {isOffline && (
        <div className="offline-banner">
          <div className="container">
            <p>⚠️ Sei offline. I dati verranno salvati e inviati quando tornerai online.</p>
          </div>
        </div>
      )}

      {/* Errore connessione */}
      {connectionError && (
        <div className="error-banner">
          <div className="container">
            <p>⚠️ {connectionError}</p>
          </div>
        </div>
      )}

      <header className="app-header">
        <div className="container">
          <h1 className="app-title">⚡ Comparatore Energia</h1>
          <p className="app-subtitle">Trova l'offerta luce e gas perfetta per te</p>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          {currentStep < 6 && (
            <ProgressBar currentStep={currentStep} totalSteps={6} />
          )}
          
          <div className="step-wrapper">
            {renderStep()}
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <div className="container">
          <p>&copy; 2026 Comparatore Energia. Tutti i diritti riservati.</p>
          <div className="footer-links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/termini">Termini e Condizioni</a>
            <a href="/contatti">Contatti</a>
          </div>
        </div>
      </footer>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Caricamento...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
