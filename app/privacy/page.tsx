import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalPage, LegalSection } from "@/components/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy — Flow Wise",
};

/**
 * Informativa ai sensi degli artt. 13 e 14 del Regolamento (UE) 2016/679 (GDPR), in inglese
 * dall'11/11/2026 (stesso contenuto della versione italiana del 6/11).
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
      title="Privacy Policy"
      intro={
        <p>
          This policy explains which personal data {LEGAL.serviceName} processes, why, who it is shared
          with, how long it is kept and which rights you have, under Regulation (EU) 2016/679
          (&quot;GDPR&quot;) and the Italian Personal Data Protection Code (Legislative Decree 196/2003, as
          amended by Legislative Decree 101/2018). The terms of use of the Service are in the{" "}
          <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>.
        </p>
      }
    >
      <LegalSection id="titolare" title="1. Data controller">
        <p>
          The controller is {LEGAL.ownerName}, an individual who develops and offers {LEGAL.serviceName} as
          a free personal project. Contact for any request about your data: {mail}. No data protection
          officer (DPO) has been appointed, as one is not required for this processing.
        </p>
      </LegalSection>

      <LegalSection id="dati" title="2. Which data we process">
        <LegalList>
          <li>
            <strong>Account:</strong> email and password. The password is handled by the authentication
            service (Supabase Auth) as a hash: nobody, not even us, can read it.
          </li>
          <li>
            <strong>Profile:</strong> name, username, preferred currency and, if you upload it, your
            profile photo.
          </li>
          <li>
            <strong>Financial data you enter or import:</strong> income, expenses, refunds and transfers
            (amount, date, description, notes, category, wallet), categories, wallets and savings pots with
            their opening balance and cap, the annual expenses plan, budgets, dashboard layout, movements
            imported from CSV files. The CSV file is read to create the movements and is not stored.
          </li>
          <li>
            <strong>Bank data, only if you link a bank:</strong> bank and account identifiers, the access
            tokens provided by GoCardless (stored encrypted), the account movements (amount, currency,
            date, description, counterparty, booked or pending status), the account balance and the
            auto-import settings (target wallet, start date).
          </li>
          <li>
            <strong>Category rules:</strong> the links &quot;shop name, counterparty or transfer text →
            category&quot; that you create or that the Service learns from your corrections.
          </li>
          <li>
            <strong>Password recovery:</strong> a one-time code valid for one hour, linked to your
            account.
          </li>
          <li>
            <strong>Technical data:</strong> the server&apos;s technical logs (for example IP address, date
            and time, request made) and aggregate usage and performance statistics, collected with Vercel
            Web Analytics and Speed Insights without cookies.
          </li>
        </LegalList>
        <p>
          We do not ask for special categories of data (for example about health or religious beliefs).
          Bank movement descriptions, however, may reveal them indirectly (for example the name of a
          pharmacy or an association): we process them only to show and categorize them, never for other
          purposes.
        </p>
      </LegalSection>

      <LegalSection id="finalita" title="3. Why we process them and on which legal basis">
        <LegalList>
          <li>
            <strong>Providing the Service</strong> (account, recording and showing movements, balances,
            charts, CSV import, password recovery emails): performance of the contract formed by the Terms
            of Service (Art. 6(1)(b) GDPR).
          </li>
          <li>
            <strong>Bank link and auto-import</strong>, only if you turn them on: performance of the
            contract, at your request. Access to the accounts is also based on the explicit consent you
            give GoCardless and your bank, which you can withdraw at any time.
          </li>
          <li>
            <strong>Analysis with the AI assistant</strong>, only when you ask for it: performance of the
            contract, at your request. You can avoid it with no effect on the rest of the Service.
          </li>
          <li>
            <strong>Security, abuse prevention and troubleshooting</strong> (technical logs): our
            legitimate interest (Art. 6(1)(f) GDPR).
          </li>
          <li>
            <strong>Aggregate statistics</strong> on usage and performance, to improve the Service: our
            legitimate interest. They do not identify you and do not use cookies.
          </li>
          <li>
            <strong>Complying with legal obligations</strong> or requests from authorities: legal
            obligation (Art. 6(1)(c) GDPR).
          </li>
        </LegalList>
        <p>
          We do not use your data for marketing, we do not sell it and we do not profile you. The automatic
          categorization of movements uses internal rules and does not produce decisions with legal or
          similarly significant effects on you (Art. 22 GDPR).
        </p>
      </LegalSection>

      <LegalSection id="obbligo" title="4. What happens if you do not provide the data">
        <p>
          Email and password are needed to create the account: without them you cannot use the Service.
          All other data is optional; the features that need it (for example the bank link or the AI
          assistant) will simply not be available.
        </p>
      </LegalSection>

      <LegalSection id="destinatari" title="5. Who we share the data with">
        <p>
          To run the Service we rely on the following providers, which process the data only for the
          purposes stated:
        </p>
        <LegalList>
          <li><strong>Supabase</strong>: database and authentication; stores all account data.</li>
          <li><strong>Vercel</strong>: hosting of the application and the server, technical logs, aggregate statistics.</li>
          <li>
            <strong>GoCardless</strong> (Bank Account Data), only if you link a bank: reads the accounts
            and sends us movements and balance. For the account information service GoCardless acts on the
            consent you give it and under its own privacy policy.
          </li>
          <li><strong>Cloudinary</strong>: storage of the profile photo, if you upload one.</li>
          <li>
            <strong>Groq</strong>, only if you use the AI assistant: receives your question, the period,
            the expense totals by category and by month and the 10 largest expenses with date, amount,
            category and the first 120 characters of the description. It does not receive your name,
            email, income, balances or wallet names. Flow Wise does not store the conversation.
          </li>
          <li><strong>Email service provider</strong>: sending password recovery emails.</li>
        </LegalList>
        <p>
          The daily auto-import is started by a GitHub Actions job, which does not receive your data, only
          anonymous counts (for example the number of movements imported). Imported movements are
          categorized inside {LEGAL.serviceName}, without sending data to external services. We may
          disclose data to authorities only where the law requires it.
        </p>
        <p>
          <strong>Backups.</strong> Every night a GitHub Actions job copies the database, encrypts the copy
          before it leaves the job and stores it in a private GitHub repository. The copy is encrypted
          with a key that only we hold: GitHub stores it but cannot read it. Bank access tokens in the
          copy stay encrypted as they are in the database.
        </p>
      </LegalSection>

      <LegalSection id="trasferimenti" title="6. Transfers outside the European Union">
        <p>
          Some providers may process data outside the European Economic Area, in particular in the United
          States. In those cases the transfer is based on an adequacy decision of the European Commission
          (such as the EU-US Data Privacy Framework, for certified providers) or on the standard
          contractual clauses approved by the Commission (Arts. 45 and 46 GDPR). You can ask for more
          information at {mail}.
        </p>
      </LegalSection>

      <LegalSection id="conservazione" title="7. How long we keep the data">
        <LegalList>
          <li>
            <strong>Account, profile and financial data:</strong> as long as the account is active. When you
            delete the account (Settings → Delete account) they are deleted right away; the encrypted nightly
            backups that still contain them are overwritten within 30 days.
          </li>
          <li>
            <strong>Bank access tokens:</strong> until you disconnect the bank or the authorization
            expires. Bank movements already synced stay until you ask for their deletion or close the
            account.
          </li>
          <li>
            <strong>Backups:</strong> the last 30 nightly copies, so a deleted record disappears from the
            backups within about 30 days.
          </li>
          <li><strong>Password recovery codes:</strong> valid for one hour and usable once.</li>
          <li>
            <strong>Technical logs:</strong> for the limited period set by the hosting provider, unless
            needed longer to investigate abuse or a security incident.
          </li>
          <li>
            <strong>Requests to the AI assistant:</strong> Flow Wise does not keep them; Groq processes
            them under its own terms.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="sicurezza" title="8. How we protect the data">
        <LegalList>
          <li>All communication happens over an encrypted connection (HTTPS).</li>
          <li>Every request to the server is authenticated and limited to your account&apos;s data.</li>
          <li>Passwords are stored only as hashes; bank access tokens are encrypted.</li>
          <li>The database is reachable only by the server and by whoever administers it.</li>
        </LegalList>
        <p>
          No system is 100% secure. In case of a data breach that poses a risk to your rights, we will
          notify the Italian Data Protection Authority within 72 hours and, if the risk is high, inform you
          without undue delay (Arts. 33 and 34 GDPR).
        </p>
      </LegalSection>

      <LegalSection id="diritti" title="9. Your rights">
        <p>At any time you can ask us to:</p>
        <LegalList>
          <li>
            access your data and receive a copy (Art. 15) — you can download it yourself from Settings →
            Your data;
          </li>
          <li>correct it (Art. 16) — you can change much of it directly in the app;</li>
          <li>delete it (Art. 17) — you can delete your account and all its data yourself from Settings → Delete account;</li>
          <li>restrict its processing (Art. 18);</li>
          <li>
            receive it in a structured, machine-readable format, to move it elsewhere (Art. 20) — the JSON
            download in Settings → Your data;
          </li>
          <li>object to processing based on our legitimate interest (Art. 21);</li>
          <li>withdraw consent already given, without affecting the lawfulness of earlier processing (Art. 7).</li>
        </LegalList>
        <p>
          To exercise them, write to {mail} from the address linked to your account. We will answer within
          one month (Art. 12). If you believe the processing breaks the law, you can lodge a complaint with
          the Italian Data Protection Authority (Garante per la protezione dei dati personali,{" "}
          <a className="text-primary hover:underline" href="https://www.garanteprivacy.it" target="_blank" rel="noreferrer">
            www.garanteprivacy.it
          </a>
          ) or go to court.
        </p>
      </LegalSection>

      <LegalSection id="cookie" title="10. Cookies and browser storage">
        <p>
          {LEGAL.serviceName} does not use profiling cookies or third-party advertising cookies. To keep you
          signed in, the browser keeps a session token in local storage: it is a technical tool needed for
          the Service to work and does not require consent (Art. 122 of the Italian Privacy Code). Vercel
          Web Analytics and Speed Insights statistics are collected without cookies.
        </p>
      </LegalSection>

      <LegalSection id="minori" title="11. Minors">
        <p>
          The Service is not intended for people under 18. If you believe a minor has given us data, write
          to us and we will delete it.
        </p>
      </LegalSection>

      <LegalSection id="modifiche" title="12. Changes to this policy">
        <p>
          We will update this policy when the processing changes, for example with new features or new
          providers. The date at the top of the page shows the latest version; we will tell you about
          significant changes by email or with a notice in the app.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
