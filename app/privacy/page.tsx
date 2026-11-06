import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalPage, LegalSection } from "@/components/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Informativa privacy — Flow Wise",
};

/**
 * Informativa ai sensi degli artt. 13 e 14 del Regolamento (UE) 2016/679 (GDPR).
 * I dati e i fornitori elencati rispecchiano il codice di flow-wise-client e
 * flow-wise-server: se cambia un trattamento (nuovo fornitore, nuovi dati), va aggiornata.
 */
export default function PrivacyPage() {
  const mail = (
    <a className="text-primary hover:underline" href={`mailto:${LEGAL.contactEmail}`}>
      {LEGAL.contactEmail}
    </a>
  );

  return (
    <LegalPage
      title="Informativa privacy"
      intro={
        <p>
          Questa informativa spiega quali dati personali tratta {LEGAL.serviceName}, perché, con chi li
          condivide, per quanto li conserva e quali diritti hai, ai sensi del Regolamento (UE) 2016/679
          (&quot;GDPR&quot;) e del Codice in materia di protezione dei dati personali (D.Lgs. 196/2003,
          come modificato dal D.Lgs. 101/2018). Le condizioni d&apos;uso del Servizio sono nei{" "}
          <Link href="/terms" className="text-primary hover:underline">Termini di servizio</Link>.
        </p>
      }
    >
      <LegalSection id="titolare" title="1. Titolare del trattamento">
        <p>
          Il titolare è {LEGAL.ownerName}, persona fisica che sviluppa e offre {LEGAL.serviceName} come
          progetto personale e gratuito. Contatto per qualsiasi richiesta sui tuoi dati: {mail}. Non è
          stato nominato un responsabile della protezione dei dati (DPO), perché non obbligatorio per
          questo trattamento.
        </p>
      </LegalSection>

      <LegalSection id="dati" title="2. Quali dati trattiamo">
        <LegalList>
          <li>
            <strong>Account:</strong> email e password. La password è gestita dal servizio di
            autenticazione (Supabase Auth) in forma cifrata con hash: nessuno, nemmeno noi, può leggerla.
          </li>
          <li>
            <strong>Profilo:</strong> nome, nome utente, valuta preferita e, se la carichi, la foto
            profilo.
          </li>
          <li>
            <strong>Dati finanziari che inserisci o importi:</strong> entrate e spese (importo, data,
            descrizione, note, categoria, wallet), categorie, wallet e relativo saldo di apertura, budget,
            disposizione della dashboard, movimenti importati da file CSV. Il file CSV viene letto per
            creare i movimenti e non viene conservato.
          </li>
          <li>
            <strong>Dati bancari, solo se colleghi una banca:</strong> identificativo della banca e del
            conto, i token di accesso forniti da GoCardless (conservati cifrati), i movimenti del conto
            (importo, valuta, data, descrizione, controparte, stato contabilizzato o in sospeso), il saldo
            del conto, le impostazioni dell&apos;import automatico (wallet di destinazione, data di
            partenza).
          </li>
          <li>
            <strong>Regole di categoria:</strong> le associazioni &quot;nome del negozio o della
            controparte → categoria&quot; che crei o che il Servizio impara dalle tue correzioni.
          </li>
          <li>
            <strong>Recupero password:</strong> un codice monouso valido un&apos;ora, collegato al tuo
            account.
          </li>
          <li>
            <strong>Dati tecnici:</strong> i log tecnici del server (per esempio indirizzo IP, data e ora,
            richiesta effettuata) e statistiche di utilizzo e prestazioni aggregate, raccolte con Vercel
            Web Analytics e Speed Insights senza cookie.
          </li>
        </LegalList>
        <p>
          Non ti chiediamo dati appartenenti a categorie particolari (per esempio relativi alla salute o
          alle convinzioni religiose). Le descrizioni dei movimenti bancari, però, possono rivelarle
          indirettamente (per esempio il nome di una farmacia o di un&apos;associazione): li trattiamo solo
          per mostrarteli e categorizzarli, mai per altri scopi.
        </p>
      </LegalSection>

      <LegalSection id="finalita" title="3. Perché li trattiamo e su quale base giuridica">
        <LegalList>
          <li>
            <strong>Fornirti il Servizio</strong> (account, registrazione e visualizzazione dei movimenti,
            saldi, grafici, import CSV, email per il recupero password): esecuzione del contratto
            costituito dai Termini di servizio (art. 6, par. 1, lett. b, GDPR).
          </li>
          <li>
            <strong>Collegamento bancario e import automatico</strong>, solo se li attivi: esecuzione del
            contratto, su tua richiesta. L&apos;accesso ai conti avviene inoltre in base al consenso
            esplicito che dai a GoCardless e alla tua banca, revocabile in qualsiasi momento.
          </li>
          <li>
            <strong>Analisi con l&apos;assistente AI</strong>, solo quando la chiedi: esecuzione del
            contratto, su tua richiesta. Puoi non usarla senza conseguenze sul resto del Servizio.
          </li>
          <li>
            <strong>Sicurezza, prevenzione di abusi e diagnosi dei malfunzionamenti</strong> (log
            tecnici): nostro legittimo interesse (art. 6, par. 1, lett. f, GDPR).
          </li>
          <li>
            <strong>Statistiche aggregate</strong> sull&apos;uso e sulle prestazioni, per migliorare il
            Servizio: nostro legittimo interesse. Non permettono di identificarti e non usano cookie.
          </li>
          <li>
            <strong>Adempiere a obblighi di legge</strong> o richieste delle autorità: obbligo legale
            (art. 6, par. 1, lett. c, GDPR).
          </li>
        </LegalList>
        <p>
          Non usiamo i tuoi dati per marketing, non li vendiamo e non facciamo profilazione. La
          categorizzazione automatica dei movimenti avviene con regole interne e non produce decisioni con
          effetti giuridici o analogamente significativi su di te (art. 22 GDPR).
        </p>
      </LegalSection>

      <LegalSection id="obbligo" title="4. Cosa succede se non fornisci i dati">
        <p>
          Email e password sono necessarie per creare l&apos;account: senza non puoi usare il Servizio.
          Tutti gli altri dati sono facoltativi; le funzioni che li richiedono (per esempio il
          collegamento bancario o l&apos;assistente AI) semplicemente non saranno disponibili.
        </p>
      </LegalSection>

      <LegalSection id="destinatari" title="5. Con chi condividiamo i dati">
        <p>
          Per far funzionare il Servizio ci affidiamo ai seguenti fornitori, che trattano i dati solo per
          le finalità indicate:
        </p>
        <LegalList>
          <li><strong>Supabase</strong>: database e autenticazione; conserva tutti i dati dell&apos;account.</li>
          <li><strong>Vercel</strong>: hosting dell&apos;applicazione e del server, log tecnici, statistiche aggregate.</li>
          <li>
            <strong>GoCardless</strong> (Bank Account Data), solo se colleghi una banca: accede ai conti in
            sola lettura e ci trasmette movimenti e saldo. Per il servizio di informazione sui conti
            GoCardless agisce in base al consenso che gli dai e secondo la propria informativa privacy.
          </li>
          <li><strong>Cloudinary</strong>: conservazione della foto profilo, se la carichi.</li>
          <li>
            <strong>Groq</strong>, solo se usi l&apos;assistente AI: riceve la tua domanda, il periodo, i
            totali delle spese per categoria e per mese e le 10 spese più alte con data, importo, categoria
            e i primi 120 caratteri della descrizione. Non riceve nome, email, entrate, saldi o nomi dei
            wallet. Flow Wise non salva la conversazione.
          </li>
          <li><strong>Fornitore del servizio email</strong>: invio delle email di recupero password.</li>
        </LegalList>
        <p>
          L&apos;import automatico giornaliero è avviato da un job su GitHub Actions, che non riceve i tuoi
          dati ma solo conteggi anonimi (per esempio il numero di movimenti importati). La categorizzazione
          dei movimenti importati avviene all&apos;interno di {LEGAL.serviceName}, senza inviare dati a
          servizi esterni. Possiamo comunicare i dati alle autorità solo se previsto dalla legge.
        </p>
      </LegalSection>

      <LegalSection id="trasferimenti" title="6. Trasferimenti fuori dall'Unione europea">
        <p>
          Alcuni fornitori possono trattare i dati al di fuori dello Spazio economico europeo, in
          particolare negli Stati Uniti. In questi casi il trasferimento avviene sulla base di una
          decisione di adeguatezza della Commissione europea (come l&apos;EU-US Data Privacy Framework,
          per i fornitori certificati) o delle clausole contrattuali tipo approvate dalla Commissione (art.
          45 e 46 GDPR). Puoi chiederci maggiori informazioni scrivendo a {mail}.
        </p>
      </LegalSection>

      <LegalSection id="conservazione" title="7. Per quanto tempo conserviamo i dati">
        <LegalList>
          <li>
            <strong>Account, profilo e dati finanziari:</strong> finché l&apos;account è attivo. Se chiedi
            la cancellazione, li eliminiamo entro 30 giorni; eventuali copie di sicurezza dei fornitori
            vengono sovrascritte secondo i loro cicli.
          </li>
          <li>
            <strong>Token di accesso alla banca:</strong> fino alla disconnessione della banca o alla
            scadenza dell&apos;autorizzazione. I movimenti bancari già sincronizzati restano finché non ne
            chiedi la cancellazione o non chiudi l&apos;account.
          </li>
          <li><strong>Codici di recupero password:</strong> validi un&apos;ora e utilizzabili una sola volta.</li>
          <li>
            <strong>Log tecnici:</strong> per il periodo limitato previsto dal fornitore di hosting, salvo
            che servano più a lungo per accertare un abuso o un incidente di sicurezza.
          </li>
          <li>
            <strong>Richieste all&apos;assistente AI:</strong> Flow Wise non le conserva; Groq le tratta
            secondo le proprie condizioni.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="sicurezza" title="8. Come proteggiamo i dati">
        <LegalList>
          <li>Tutte le comunicazioni avvengono su connessione cifrata (HTTPS).</li>
          <li>Ogni richiesta al server è autenticata e limitata ai dati del tuo account.</li>
          <li>Le password sono conservate solo in forma di hash; i token di accesso alla banca sono cifrati.</li>
          <li>Il database è accessibile solo dal server e da chi ne gestisce l&apos;amministrazione.</li>
        </LegalList>
        <p>
          Nessun sistema è sicuro al 100%. In caso di violazione dei dati che presenti un rischio per i tuoi
          diritti, la notificheremo al Garante entro 72 ore e, se il rischio è elevato, ti avviseremo
          senza ingiustificato ritardo (artt. 33 e 34 GDPR).
        </p>
      </LegalSection>

      <LegalSection id="diritti" title="9. I tuoi diritti">
        <p>In qualsiasi momento puoi chiederci di:</p>
        <LegalList>
          <li>accedere ai tuoi dati e riceverne una copia (art. 15);</li>
          <li>correggerli (art. 16) — molti li puoi modificare direttamente nell&apos;app;</li>
          <li>cancellarli (art. 17), anche chiudendo l&apos;account;</li>
          <li>limitarne il trattamento (art. 18);</li>
          <li>riceverli in un formato strutturato e leggibile da dispositivo automatico, per trasferirli altrove (art. 20);</li>
          <li>opporti ai trattamenti basati sul nostro legittimo interesse (art. 21);</li>
          <li>revocare un consenso già dato, senza pregiudicare la liceità dei trattamenti precedenti (art. 7).</li>
        </LegalList>
        <p>
          Per esercitarli scrivi a {mail} dall&apos;indirizzo associato all&apos;account. Ti risponderemo
          entro un mese (art. 12). Se ritieni che il trattamento violi la normativa puoi proporre reclamo
          al Garante per la protezione dei dati personali (
          <a className="text-primary hover:underline" href="https://www.garanteprivacy.it" target="_blank" rel="noreferrer">
            www.garanteprivacy.it
          </a>
          ) o rivolgerti all&apos;autorità giudiziaria.
        </p>
      </LegalSection>

      <LegalSection id="cookie" title="10. Cookie e archiviazione nel browser">
        <p>
          {LEGAL.serviceName} non usa cookie di profilazione né cookie di terze parti a fini pubblicitari.
          Per mantenerti connesso, il browser conserva nella memoria locale un token di sessione: è uno
          strumento tecnico necessario al funzionamento del Servizio, per il quale non serve il consenso
          (art. 122 del Codice privacy). Le statistiche di Vercel Web Analytics e Speed Insights sono
          raccolte senza cookie.
        </p>
      </LegalSection>

      <LegalSection id="minori" title="11. Minori">
        <p>
          Il Servizio non è destinato a chi ha meno di 18 anni. Se ritieni che un minore ci abbia fornito
          dati, scrivici e li cancelleremo.
        </p>
      </LegalSection>

      <LegalSection id="modifiche" title="12. Modifiche a questa informativa">
        <p>
          Aggiorneremo questa informativa quando cambiano i trattamenti, per esempio con nuove funzioni o
          nuovi fornitori. La data in cima alla pagina indica l&apos;ultima versione; delle modifiche
          rilevanti ti avviseremo via email o con un avviso nell&apos;app.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
