import React, { useEffect } from 'react';
import { formatCurrency } from '../utils/validators';

const Step6Conferma = ({ offerta, emailInviata, emailStatus, codiceRichiesta }) => {
  useEffect(() => {
    // Scroll to top quando si arriva a questa pagina
    window.scrollTo(0, 0);
  }, []);

  // Determina il messaggio email in base allo stato
  const getEmailMessage = () => {
    if (emailInviata && emailStatus?.cliente && emailStatus?.operatore) {
      return {
        type: 'success',
        icon: '✅',
        text: "Ti abbiamo inviato un'email con tutti i dettagli dell'offerta. Controlla la tua casella di posta (anche nello spam)."
      };
    } else if (emailInviata && (emailStatus?.cliente || emailStatus?.operatore)) {
      return {
        type: 'warning',
        icon: '⚠️',
        text: "Abbiamo riscontrato problemi nell'invio di alcune email, ma i tuoi dati sono stati salvati correttamente. Verrai contattato al più presto."
      };
    } else if (!emailInviata) {
      return {
        type: 'info',
        icon: '📱',
        text: "I tuoi dati sono stati salvati con successo. Riceverai conferma via email o telefono entro 24 ore."
      };
    } else {
      return {
        type: 'pending',
        icon: '⏳',
        text: "Riceverai a breve un'email con tutti i dettagli dell'offerta."
      };
    }
  };

  const emailMessage = getEmailMessage();

  return (
    <div className="step-container step-conferma">
      <div className="success-animation">
        <div className="checkmark-circle">
          <div className="checkmark"></div>
        </div>
      </div>

      <div className="step-header">
        <h1>🎉 Richiesta inviata con successo!</h1>
        <p className="subtitle">La tua offerta è stata generata e salvata</p>
      </div>

      <div className="step-content">
        {/* Codice Richiesta */}
        {codiceRichiesta && (
          <div className="codice-richiesta-box">
            <div className="codice-label">Il tuo codice richiesta:</div>
            <div className="codice-value">{codiceRichiesta}</div>
            <p className="codice-hint">Conserva questo codice per future comunicazioni</p>
          </div>
        )}

        {/* Riepilogo Risparmio */}
        {offerta && (
          <div className="risparmio-finale-box">
            <h3>💰 Il tuo risparmio stimato</h3>
            <div className="risparmio-grid">
              <div className="risparmio-item">
                <div className="risparmio-amount">{formatCurrency(offerta.risparmioAnnuo)}</div>
                <div className="risparmio-period">all&apos;anno</div>
              </div>
              <div className="risparmio-item">
                <div className="risparmio-amount">{formatCurrency(offerta.risparmioMensile)}</div>
                <div className="risparmio-period">al mese</div>
              </div>
            </div>
          </div>
        )}

        {/* Cosa succede ora */}
        <div className="prossimi-passi-section">
          <h3>📋 Cosa succede ora?</h3>
          
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-marker">
                <span className="timeline-number">1</span>
              </div>
              <div className="timeline-content">
                <h4>Email di conferma</h4>
                <div className={`email-status email-status-${emailMessage.type}`}>
                  <span className="email-icon">{emailMessage.icon}</span>
                  <p>{emailMessage.text}</p>
                </div>
                {emailStatus && !emailStatus.cliente && emailStatus.operatore && (
                  <p className="email-note">
                    <small>ℹ️ L&apos;email cliente non è partita, ma l&apos;operatore ha ricevuto la tua richiesta.</small>
                  </p>
                )}
                {emailStatus && emailStatus.cliente && !emailStatus.operatore && (
                  <p className="email-note">
                    <small>ℹ️ Hai ricevuto l&apos;email, l&apos;operatore sarà informato a breve.</small>
                  </p>
                )}
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-marker">
                <span className="timeline-number">2</span>
              </div>
              <div className="timeline-content">
                <h4>Chiamata di verifica</h4>
                <p>
                  Un nostro operatore ti contatterà entro <strong>24-48 ore</strong> per:
                </p>
                <ul>
                  <li>Verificare i dati inseriti</li>
                  <li>Rispondere a eventuali domande</li>
                  <li>Confermare i dettagli dell&apos;offerta</li>
                </ul>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-marker">
                <span className="timeline-number">3</span>
              </div>
              <div className="timeline-content">
                <h4>Documentazione e attivazione</h4>
                <p>
                  Se deciderai di procedere, ti guideremo passo passo:
                </p>
                <ul>
                  <li>Invio della documentazione necessaria</li>
                  <li>Firma del contratto (anche digitale)</li>
                  <li>Gestione del cambio fornitore</li>
                </ul>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-marker">
                <span className="timeline-number">4</span>
              </div>
              <div className="timeline-content">
                <h4>Attivazione completata</h4>
                <p>
                  Mediamente in <strong>30-45 giorni</strong> il passaggio sarà completato:
                </p>
                <ul>
                  <li>Nessuna interruzione del servizio</li>
                  <li>Nessun intervento tecnico necessario</li>
                  <li>Inizio risparmio immediato</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Info Importanti */}
        <div className="info-boxes-grid">
          <div className="info-box-card">
            <span className="info-icon">📞</span>
            <h4>Contatti</h4>
            <p>
              Se hai domande urgenti, usa il codice richiesta <strong>{codiceRichiesta}</strong> per contattarci.
            </p>
          </div>

          <div className="info-box-card">
            <span className="info-icon">🔒</span>
            <h4>Sicurezza</h4>
            <p>
              I tuoi dati sono protetti e utilizzati esclusivamente per processare la tua richiesta.
            </p>
          </div>

          <div className="info-box-card">
            <span className="info-icon">❌</span>
            <h4>Nessun obbligo</h4>
            <p>
              Questa è solo una proposta. Puoi decidere liberamente se procedere o meno senza alcun vincolo.
            </p>
          </div>

          <div className="info-box-card">
            <span className="info-icon">💚</span>
            <h4>Gratuito</h4>
            <p>
              Il nostro servizio di comparazione è completamente gratuito per te.
            </p>
          </div>
        </div>

        {/* FAQ Rapide */}
        <div className="faq-section">
          <h3>❓ Domande frequenti</h3>
          
          <div className="faq-list">
            <div className="faq-item">
              <h4>Non ho ricevuto l&apos;email, cosa faccio?</h4>
              <p>
                Controlla la cartella spam/posta indesiderata. 
                Se non la trovi entro 24 ore, contattaci usando il codice richiesta <strong>{codiceRichiesta}</strong>.
              </p>
            </div>

            <div className="faq-item">
              <h4>Ci sono costi nascosti?</h4>
              <p>
                No, il nostro servizio è gratuito. I prezzi mostrati sono quelli effettivi 
                del fornitore, senza alcun sovrapprezzo.
              </p>
            </div>

            <div className="faq-item">
              <h4>Posso cambiare idea?</h4>
              <p>
                Certamente! Puoi decidere di non procedere in qualsiasi momento, 
                anche dopo aver ricevuto la proposta. Nessun vincolo.
              </p>
            </div>

            <div className="faq-item">
              <h4>Quanto tempo ci vuole per il cambio?</h4>
              <p>
                Il processo di switch richiede mediamente 30-45 giorni dal momento 
                della firma del contratto. Non ci sarà mai interruzione del servizio.
              </p>
            </div>

            <div className="faq-item">
              <h4>Devo disdire il vecchio contratto?</h4>
              <p>
                No, pensiamo a tutto noi! Ci occupiamo noi della disdetta del vecchio 
                contratto e di tutte le pratiche necessarie.
              </p>
            </div>
          </div>
        </div>

        {/* Messaggio Finale */}
        <div className="messaggio-finale">
          <h3>Grazie per la tua fiducia! 🙏</h3>
          <p>
            Il team è già al lavoro sulla tua pratica {codiceRichiesta && `(${codiceRichiesta})`}. A presto!
          </p>
        </div>
      </div>

      {/* Azione finale */}
      <div className="step-actions">
        <button 
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Fai una nuova richiesta
        </button>
      </div>
    </div>
  );
};

export default Step6Conferma;
