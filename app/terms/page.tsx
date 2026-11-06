import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalPage, LegalSection } from "@/components/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Termini di servizio — Flow Wise",
};

export default function TermsPage() {
  const mail = (
    <a className="text-primary hover:underline" href={`mailto:${LEGAL.contactEmail}`}>
      {LEGAL.contactEmail}
    </a>
  );

  return (
    <LegalPage
      title="Termini di servizio"
      intro={
        <>
          <p>
            Questi Termini regolano l&apos;uso di {LEGAL.serviceName} (&quot;il Servizio&quot;),
            l&apos;applicazione web per la gestione delle finanze personali disponibile su{" "}
            <a className="text-primary hover:underline" href={LEGAL.siteUrl}>{LEGAL.siteUrl}</a>.
            Creando un account o usando il Servizio dichiari di averli letti e di accettarli. Se non li
            accetti, non usare il Servizio.
          </p>
          <p>
            Il trattamento dei tuoi dati personali è descritto nell&apos;
            <Link href="/privacy" className="text-primary hover:underline">Informativa privacy</Link>,
            che fa parte di questi Termini.
          </p>
        </>
      }
    >
      <LegalSection id="fornitore" title="1. Chi fornisce il Servizio">
        <p>
          {LEGAL.serviceName} è un progetto personale e non commerciale, sviluppato e offerto
          gratuitamente da {LEGAL.ownerName}, persona fisica (&quot;noi&quot;). Non è un&apos;impresa e non
          vende prodotti o servizi tramite il Servizio. Per qualsiasi comunicazione puoi scrivere a {mail}.
        </p>
      </LegalSection>

      <LegalSection id="servizio" title="2. Cosa fa il Servizio">
        <p>Il Servizio ti permette di:</p>
        <LegalList>
          <li>registrare entrate e spese, organizzarle per categoria e per wallet (fino a 3 wallet);</li>
          <li>consultare saldi, grafici e riepiloghi in una dashboard personalizzabile;</li>
          <li>importare movimenti da file CSV;</li>
          <li>
            collegare, se lo desideri, uno o più conti bancari per sincronizzare i movimenti in sola
            lettura e importarli, anche automaticamente ogni giorno (sezione 6);
          </li>
          <li>chiedere, se lo desideri, un&apos;analisi delle tue spese a un assistente AI sperimentale (sezione 8).</li>
        </LegalList>
        <p>
          Alcune funzioni sono sperimentali o in sviluppo (per esempio la pagina AI Beta e la sezione
          Budget) e possono cambiare o essere rimosse.
        </p>
      </LegalSection>

      <LegalSection id="non-consulenza" title="3. Cosa il Servizio non è">
        <LegalList>
          <li>
            <strong>Non è consulenza.</strong> Dati, grafici, categorie e risposte dell&apos;assistente AI
            hanno solo scopo informativo: non costituiscono consulenza finanziaria, fiscale, legale o
            di investimento e non sostituiscono il parere di un professionista.
          </li>
          <li>
            <strong>Non è una banca né un servizio di pagamento.</strong> Non custodiamo denaro, non
            eseguiamo pagamenti e non possiamo disporre operazioni sui tuoi conti.
          </li>
          <li>
            <strong>Non forniamo direttamente il servizio di informazione sui conti.</strong>{" "}
            L&apos;accesso ai conti bancari avviene tramite GoCardless (servizio Bank Account Data),
            prestatore autorizzato al servizio di informazione sui conti ai sensi della direttiva
            europea sui servizi di pagamento (PSD2), recepita in Italia dal D.Lgs. 218/2017.
          </li>
          <li>
            <strong>Non è un documento ufficiale.</strong> Per qualsiasi verifica fanno fede gli
            estratti conto e le comunicazioni della tua banca.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="account" title="4. Account e requisiti">
        <LegalList>
          <li>Per usare il Servizio devi avere almeno 18 anni e la capacità di agire.</li>
          <li>Il Servizio è destinato a un uso personale e non commerciale.</li>
          <li>Ogni account è personale: non condividerlo e non crearne a nome di altre persone.</li>
          <li>Devi fornire un indirizzo email valido e di tua titolarità.</li>
          <li>
            Sei responsabile della riservatezza della password e di tutto ciò che avviene con il tuo
            account. Se sospetti un accesso non autorizzato, cambia subito la password e scrivici.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="gratuita" title="5. Gratuità e disponibilità">
        <p>
          Il Servizio è gratuito e si basa sui piani gratuiti di fornitori terzi (hosting, database,
          collegamento bancario). Per questo:
        </p>
        <LegalList>
          <li>non garantiamo che sia sempre disponibile, privo di errori o senza interruzioni;</li>
          <li>possono esserci limiti di utilizzo, per esempio sul numero di sincronizzazioni bancarie;</li>
          <li>
            possiamo modificare, sospendere o chiudere il Servizio o singole funzioni. Se decidiamo di
            chiuderlo, lo comunicheremo con almeno 30 giorni di preavviso, quando possibile, per darti
            modo di chiedere una copia dei tuoi dati.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="banca" title="6. Collegamento bancario e import automatico">
        <LegalList>
          <li>
            Il collegamento è facoltativo. Per attivarlo autorizzi GoCardless e la tua banca ad accedere
            ai tuoi conti in sola lettura, secondo le loro condizioni. L&apos;autorizzazione dura per un
            periodo limitato stabilito dalla banca e da GoCardless (di norma 90 giorni), poi va rinnovata.
          </li>
          <li>
            Puoi revocare l&apos;accesso in qualsiasi momento disconnettendo la banca dalla pagina Your
            Bank o dai canali della tua banca. I movimenti già sincronizzati restano nel tuo account
            finché non li elimini o non chiedi la cancellazione dei dati.
          </li>
          <li>
            Le banche limitano il numero di letture che un servizio può fare senza la tua presenza (spesso
            4 al giorno per conto): la sincronizzazione automatica avviene una volta al giorno.
          </li>
          <li>
            Se attivi l&apos;import automatico per una banca, ogni giorno i nuovi movimenti
            contabilizzati vengono aggiunti a entrate e spese nel wallet che hai scelto, dalla data che
            hai indicato. I movimenti in sospeso vengono importati solo dopo la contabilizzazione.
          </li>
          <li>
            La categoria dei movimenti importati è assegnata automaticamente da regole interne al
            Servizio, che imparano dalle tue correzioni; senza una regola il movimento va nella categoria
            &quot;Altro&quot;. L&apos;assegnazione può essere sbagliata: controlla e correggi i movimenti
            quando serve.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="dati-utente" title="7. I tuoi dati">
        <LegalList>
          <li>
            I dati che inserisci o importi restano tuoi. Ci concedi solo il diritto di conservarli ed
            elaborarli nella misura necessaria a fornirti il Servizio.
          </li>
          <li>Non vendiamo i tuoi dati e non li usiamo per pubblicità o profilazione.</li>
          <li>
            Per ricevere una copia completa dei tuoi dati in un formato leggibile (per esempio CSV o
            JSON), o per la loro cancellazione, scrivi a {mail}.
          </li>
          <li>
            Sei responsabile della correttezza dei dati che inserisci e di avere il diritto di inserire
            dati che riguardano altre persone (per esempio nomi nelle descrizioni dei movimenti).
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="ai" title="8. Assistente AI (AI Beta)">
        <LegalList>
          <li>
            L&apos;assistente è facoltativo e funziona solo quando gli fai una domanda. Per rispondere,
            invia un riepilogo delle tue spese a Groq, un fornitore esterno di intelligenza artificiale:
            cosa viene inviato è indicato nella pagina AI Beta e nell&apos;
            <Link href="/privacy" className="text-primary hover:underline">Informativa privacy</Link>.
          </li>
          <li>
            Le risposte sono generate automaticamente e possono essere incomplete o errate. Non sono
            consulenza (sezione 3): verifica sempre prima di prendere decisioni.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="uso" title="9. Uso consentito">
        <p>Usando il Servizio ti impegni a non:</p>
        <LegalList>
          <li>usarlo per scopi illeciti o per conto di terzi senza il loro consenso;</li>
          <li>accedere o tentare di accedere ad account o dati di altri utenti;</li>
          <li>
            aggirare le misure di sicurezza, sovraccaricare il Servizio (per esempio con richieste
            automatizzate massive) o interferire con il suo funzionamento;
          </li>
          <li>caricare contenuti dannosi, come codice malevolo, o che violano diritti di terzi.</li>
        </LegalList>
        <p>
          Se scopri una vulnerabilità, ti chiediamo di segnalarla a {mail} senza sfruttarla né
          divulgarla prima che sia corretta.
        </p>
      </LegalSection>

      <LegalSection id="proprieta" title="10. Proprietà intellettuale">
        <p>
          Nome, logo, grafica e testi di {LEGAL.serviceName} appartengono a {LEGAL.ownerName}. Il codice
          sorgente è consultabile pubblicamente; può essere riutilizzato solo nei limiti della licenza
          eventualmente indicata nel rispettivo repository. L&apos;uso del Servizio non ti trasferisce
          altri diritti oltre a quelli necessari per usarlo.
        </p>
      </LegalSection>

      <LegalSection id="chiusura" title="11. Chiusura dell'account">
        <LegalList>
          <li>
            Puoi smettere di usare il Servizio in qualsiasi momento. Per chiudere l&apos;account e
            cancellare i tuoi dati scrivi a {mail} dall&apos;indirizzo associato all&apos;account:
            procederemo entro 30 giorni.
          </li>
          <li>
            Possiamo sospendere o chiudere un account che viola questi Termini o che mette a rischio la
            sicurezza del Servizio o di altri utenti, avvisandoti via email salvo che ciò sia impedito da
            ragioni di sicurezza o di legge.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="responsabilita" title="12. Limitazione di responsabilità">
        <LegalList>
          <li>
            Il Servizio è fornito &quot;così com&apos;è&quot;. Nei limiti consentiti dalla legge non
            rispondiamo di danni derivanti da decisioni prese sulla base dei dati o delle analisi del
            Servizio, da dati inesatti forniti da te o dalla tua banca, da interruzioni o perdite di dati
            dovute a fornitori terzi (banche, GoCardless, hosting, database, servizi AI).
          </li>
          <li>
            Nulla in questi Termini limita la nostra responsabilità per dolo o colpa grave (art. 1229 del
            Codice civile), né i diritti che la legge riconosce in modo inderogabile ai consumatori.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="modifiche" title="13. Modifiche ai Termini">
        <p>
          Possiamo aggiornare questi Termini, per esempio quando aggiungiamo funzioni o cambiano le norme.
          La data in cima alla pagina indica l&apos;ultima versione. Delle modifiche sostanziali ti
          avviseremo via email o con un avviso nell&apos;app almeno 15 giorni prima che si applichino;
          se non le accetti, puoi chiudere l&apos;account (sezione 11).
        </p>
      </LegalSection>

      <LegalSection id="legge" title="14. Legge applicabile e controversie">
        <LegalList>
          <li>Questi Termini sono regolati dalla legge italiana.</li>
          <li>
            Se usi il Servizio come consumatore, per qualsiasi controversia è competente il giudice del
            luogo in cui risiedi o sei domiciliato (art. 66-bis del Codice del Consumo, D.Lgs. 206/2005).
          </li>
          <li>Prima di agire, scrivici: proveremo a risolvere la questione in modo amichevole.</li>
        </LegalList>
      </LegalSection>

      <LegalSection id="contatti" title="15. Contatti">
        <p>Per domande su questi Termini scrivi a {mail}.</p>
      </LegalSection>
    </LegalPage>
  );
}
