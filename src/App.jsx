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
  confermaInvioPreContratto
} from './services/offerteService';

import { initEmailJS, inviaEmailComplete } from './services/emailService';

import './styles/App.css';

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [leadId, setLeadId] = useState(null);
  const [offerta, setOfferta] = useState(null);
  const [isMigliorativa, setIsMigliorativa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailInviata, setEmailInviata] = useState(false);
  const [emailStatus, setEmailStatus] = useState({ cliente: false, operatore: false });
  const [codiceRichiesta, setCodiceRichiesta] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('Caricamento...');

  // Inizializza EmailJS all'avvio con verifica
  useEffect(() => {
    console.log('🚀 Inizializzazione app...');
    initEmailJS();
    
    // Verifica configurazione EmailJS
    const config = {
      serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID,
      templateClient: process.env.REACT_APP_EMAILJS_TEMPLATE_CLIENT,
      templateOperator: process.env.REACT_APP_EMAILJS_TEMPLATE_OPERATOR,
      publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY
    };
    
    const missingKeys = Object.entries(config)
      .filter(([_, value]) => !value)
      .map(([key]) => key);
    
    if (missingKeys.length > 0) {
      console.error('⚠️ Chiavi EmailJS mancanti:', missingKeys);
    } else {
      console.log('✅ Configurazione EmailJS completa');
    }
  }, []);

  // Handler per passare al prossimo step
  const handleNext = async (stepData) => {
    const newFormData = { ...formData, ...stepData };
    setFormData(newFormData);

    switch (currentStep) {
      case 1:
        // Step 1: Salva tipo cliente e crea lead
        await handleStep1(newFormData);
        break;

      case 2:
        // Step 2: Salva consumi e calcola offerta
        await handleStep2(newFormData);
        break;

      case 3:
        // Step 3: Gestisce telefono e interesse
        await handleStep3(newFormData);
        break;

      case 4:
        // Step 4: Passa allo step 5 (anagrafica)
        setCurrentStep(5);
        break;

      case 5:
        // Step 5: Salva anagrafica e invia email
        await handleStep5(newFormData);
        break;

      default:
        setCurrentStep(currentStep + 1);
    }
  };

  // Handler per tornare indietro
  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  // Step 1: Crea lead nel database
  const handleStep1 = async (data) => {
    setLoading(true);
    setLoadingMessage('Preparazione del preventivo...');
    setCurrentStep(2);
    setLoading(false);
  };

  // Step 2: Salva consumi e crea lead con email
  const handleStep2 = async (data) => {
    setLoading(true);
    setLoadingMessage('Analisi dei tuoi consumi...');

    try {
      // Crea lead se non esiste
      if (!leadId) {
        setLoadingMessage('Salvataggio dei dati...');
        const leadResult = await createLead({
          email: data.email,
          tipoCliente: data.tipoCliente,
          marketingConsent: data.marketingConsent
        });

        if (!leadResult.success) {
          alert('Errore nel salvataggio dei dati. Riprova.');
          setLoading(false);
          return;
        }

        setLeadId(leadResult.data.id);
        console.log('✅ Lead creato:', leadResult.data.id);
        
        // Salva consumi
        setLoadingMessage('Registrazione dei consumi...');
        await saveConsumi(leadResult.data.id, {
          tipoFornitura: data.tipoFornitura,
          potenzaContatore: data.potenzaContatore,
          spesaMensile: data.spesaMensile,
          consumoAnnuoKwh: data.consumoAnnuoKwh,
          consumoAnnuoSmc: data.consumoAnnuoSmc
        });

        // Calcola migliore offerta
        setLoadingMessage('Ricerca della migliore offerta per te...');
        const offertaResult = await calcolaMiglioreOfferta(leadResult.data.id, {
          tipoFornitura: data.tipoFornitura,
          spesaMensile: data.spesaMensile,
          consumoAnnuoKwh: data.consumoAnnuoKwh,
          consumoAnnuoSmc: data.consumoAnnuoSmc
        });

        if (offertaResult.success && offertaResult.offerta) {
          setOfferta(offertaResult.offerta);
          setIsMigliorativa(offertaResult.isMigliorativa);
          console.log('✅ Offerta calcolata:', offertaResult.offerta.nome_offerta);
        } else {
          setOfferta(null);
          setIsMigliorativa(false);
          console.warn('⚠️ Nessuna offerta trovata');
        }
      }

      setCurrentStep(3);
    } catch (error) {
      console.error('❌ Errore step 2:', error);
      alert('Si è verificato un errore. Riprova.');
    } finally {
      setLoading(false);
      setLoadingMessage('Caricamento...');
    }
  };

  // Step 3: Gestisce interesse e telefono
  const handleStep3 = async (data) => {
    if (!data.interessato) {
      // Non interessato - termina qui
      console.log('ℹ️ Utente non interessato');
      setCurrentStep(6);
      return;
    }

    // Interessato - salva telefono
    if (data.telefono && leadId) {
      setLoading(true);
      setLoadingMessage('Salvataggio contatto telefonico...');
      await updateLeadTelefono(leadId, data.telefono);
      setLoading(false);
      console.log('✅ Telefono salvato:', data.telefono);
    }

    setCurrentStep(4);
  };

  // Step 5: Salva anagrafica e invia email
  const handleStep5 = async (data) => {
    setLoading(true);
    setLoadingMessage('Creazione del preventivo...');

    try {
      // Crea pre-contratto
      console.log('📝 Creazione pre-contratto...');
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
        alert('Errore nel salvataggio dei dati. Riprova.');
        setLoading(false);
        return;
      }

      const codice = preContrattoResult.data.id.substring(0, 8).toUpperCase();
      setCodiceRichiesta(codice);
      console.log('✅ Pre-contratto creato:', codice);

      // Prepara dati per email
      const datiCompleti = {
        ...formData,
        ...data,
        telefono: formData.telefono
      };

      // Invia email con feedback visivo migliorato
      setLoadingMessage('📧 Invio email di conferma...');
      console.log('📧 Inizio invio email...');
      
      const emailResult = await inviaEmailComplete(
        datiCompleti,
        offerta,
        preContrattoResult.data,
        leadId
      );

      console.log('📬 Risultato invio email:', emailResult);

      // Aggiorna stati in base ai risultati
      if (emailResult.success) {
        // Entrambe le email inviate
        setEmailInviata(true);
        setEmailStatus({ cliente: true, operatore: true });
        console.log('✅ Tutte le email inviate con successo');
        
        // Conferma invio nel database
        await confermaInvioPreContratto(preContrattoResult.data.id, leadId);
        
      } else if (emailResult.partial) {
        // Solo alcune email inviate
        setEmailInviata(true);
        setEmailStatus({
          cliente: emailResult.risultati.cliente.success,
          operatore: emailResult.risultati.operatore.success
        });
        console.warn('⚠️ Solo alcune email inviate');
        
        // Conferma comunque (i dati sono salvati)
        await confermaInvioPreContratto(preContrattoResult.data.id, leadId);
        
      } else {
        // Nessuna email inviata
        setEmailInviata(false);
        setEmailStatus({ cliente: false, operatore: false });
        console.error('❌ Nessuna email inviata');
        
        // NON bloccare l'utente - mostra comunque conferma
        alert('⚠️ C\'è stato un problema con l\'invio delle email, ma i tuoi dati sono stati salvati correttamente. Verrai contattato al più presto.');
      }

      // Vai sempre allo step finale
      setCurrentStep(6);
      
    } catch (error) {
      console.error('❌ Errore critico step 5:', error);
      alert('Si è verificato un errore. I tuoi dati sono stati salvati, verrai ricontattato.');
      
      // Vai comunque allo step finale
      setCurrentStep(6);
    } finally {
      setLoading(false);
      setLoadingMessage('Caricamento...');
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
            emailStatus={emailStatus}
            codiceRichiesta={codiceRichiesta}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="container">
          <h1 className="app-title">⚡ Comparatore Energia</h1>
          <p className="app-subtitle">Trova l&apos;offerta luce e gas perfetta per te</p>
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
            <p>{loadingMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
