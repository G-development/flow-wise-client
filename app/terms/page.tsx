import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalPage, LegalSection } from "@/components/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service — Flow Wise",
};

/**
 * Termini di servizio, in inglese dall'11/11/2026 (stesso contenuto della versione italiana del
 * 6/11, aggiornato alle funzioni di oggi: salvadanai, trasferimenti, rimborsi, piano annuale).
 */
export default function TermsPage() {
  const mail = (
    <a className="text-primary hover:underline" href={`mailto:${LEGAL.contactEmail}`}>
      {LEGAL.contactEmail}
    </a>
  );

  return (
    <LegalPage
      title="Terms of Service"
      intro={
        <>
          <p>
            These Terms govern the use of {LEGAL.serviceName} (&quot;the Service&quot;), the web
            application for personal finance available at{" "}
            <a className="text-primary hover:underline" href={LEGAL.siteUrl}>{LEGAL.siteUrl}</a>.
            By creating an account or using the Service you confirm that you have read and accept them. If
            you do not accept them, do not use the Service.
          </p>
          <p>
            The processing of your personal data is described in the{" "}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, which is
            part of these Terms.
          </p>
        </>
      }
    >
      <LegalSection id="fornitore" title="1. Who provides the Service">
        <p>
          {LEGAL.serviceName} is a personal, non-commercial project, developed and offered free of charge
          by {LEGAL.ownerName}, an individual (&quot;we&quot;). It is not a business and does not sell
          products or services through the Service. For any communication you can write to {mail}.
        </p>
      </LegalSection>

      <LegalSection id="servizio" title="2. What the Service does">
        <p>The Service lets you:</p>
        <LegalList>
          <li>
            record income, expenses, refunds and transfers, organized by category and by wallet (up to 3
            accounts, each with its own savings pots);
          </li>
          <li>see balances, charts and summaries in a customizable dashboard;</li>
          <li>plan yearly expenses paid from a savings pot, with a suggested monthly deposit;</li>
          <li>import movements from CSV files;</li>
          <li>
            if you wish, link one or more bank accounts to sync movements read-only and import them, also
            automatically every day (section 6);
          </li>
          <li>if you wish, ask an experimental AI assistant to analyse your spending (section 8).</li>
        </LegalList>
        <p>
          Some features are experimental or in development (for example the AI Beta page and the Budgets
          section) and may change or be removed.
        </p>
      </LegalSection>

      <LegalSection id="non-consulenza" title="3. What the Service is not">
        <LegalList>
          <li>
            <strong>It is not advice.</strong> Data, charts, categories, suggested deposits and the AI
            assistant&apos;s answers are for information only: they are not financial, tax, legal or
            investment advice and do not replace a professional&apos;s opinion.
          </li>
          <li>
            <strong>It is not a bank or a payment service.</strong> We do not hold money, we do not make
            payments and we cannot carry out operations on your accounts.
          </li>
          <li>
            <strong>We do not provide the account information service directly.</strong> Access to bank
            accounts happens through GoCardless (Bank Account Data service), a provider authorized for the
            account information service under the European Payment Services Directive (PSD2), implemented
            in Italy by Legislative Decree 218/2017.
          </li>
          <li>
            <strong>It is not an official document.</strong> For any check, your bank&apos;s statements and
            communications prevail.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="account" title="4. Account and requirements">
        <LegalList>
          <li>To use the Service you must be at least 18 and have full legal capacity.</li>
          <li>The Service is meant for personal, non-commercial use.</li>
          <li>Each account is personal: do not share it and do not create accounts in other people&apos;s names.</li>
          <li>You must provide a valid email address that belongs to you.</li>
          <li>
            You are responsible for keeping your password confidential and for everything done with your
            account. If you suspect unauthorized access, change the password at once and write to us.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="gratuita" title="5. Free of charge and availability">
        <p>
          The Service is free and relies on the free plans of third-party providers (hosting, database,
          bank connection). Therefore:
        </p>
        <LegalList>
          <li>we do not guarantee that it is always available, error-free or uninterrupted;</li>
          <li>there may be usage limits, for example on the number of bank syncs;</li>
          <li>
            we may change, suspend or close the Service or individual features. If we decide to close it,
            we will give at least 30 days&apos; notice where possible, so you can ask for a copy of your
            data.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="banca" title="6. Bank link and auto-import">
        <LegalList>
          <li>
            Linking a bank is optional. To turn it on you authorize GoCardless and your bank to access your
            accounts read-only, under their terms. The authorization lasts for a limited period set by the
            bank and GoCardless (usually 90 days), then it must be renewed.
          </li>
          <li>
            You can revoke access at any time by disconnecting the bank from the Your Bank page or through
            your bank&apos;s channels. Movements already synced stay in your account until you delete them
            or ask for your data to be deleted.
          </li>
          <li>
            Banks limit how many reads a service can make without you being present (often 4 per day per
            account): the automatic sync runs once a day.
          </li>
          <li>
            If you turn on auto-import for a bank, every day the new booked movements are added to the
            account you chose, from the date you set: as income, expenses, refunds or transfers still to
            assign, depending on your rules. Pending movements are imported only once booked.
          </li>
          <li>
            The category of imported movements is assigned automatically by rules inside the Service,
            which learn from your corrections; without a rule the movement goes to the &quot;Other&quot;
            category. The assignment can be wrong: check and correct movements when needed.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="dati-utente" title="7. Your data">
        <LegalList>
          <li>
            The data you enter or import remains yours. You only grant us the right to store and process
            it as far as needed to provide the Service.
          </li>
          <li>We do not sell your data and do not use it for advertising or profiling.</li>
          <li>
            You can download a full copy of your data at any time from Settings → Your data: a JSON file
            with everything and a CSV file with your movements. To delete your data, delete your account
            (section 11).
          </li>
          <li>
            You are responsible for the accuracy of the data you enter and for having the right to enter
            data about other people (for example names in movement descriptions).
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="ai" title="8. AI assistant (AI Beta)">
        <LegalList>
          <li>
            The assistant is optional and works only when you ask it a question. To answer, it sends a
            summary of your expenses to Groq, an external artificial intelligence provider: what is sent is
            listed on the AI Beta page and in the{" "}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </li>
          <li>
            Answers are generated automatically and may be incomplete or wrong. They are not advice
            (section 3): always check before making decisions.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="uso" title="9. Acceptable use">
        <p>By using the Service you agree not to:</p>
        <LegalList>
          <li>use it for unlawful purposes or on behalf of others without their consent;</li>
          <li>access or try to access other users&apos; accounts or data;</li>
          <li>
            get around security measures, overload the Service (for example with massive automated
            requests) or interfere with how it works;
          </li>
          <li>upload harmful content, such as malicious code, or content that infringes third-party rights.</li>
        </LegalList>
        <p>
          If you find a vulnerability, please report it to {mail} without exploiting it or disclosing it
          before it is fixed.
        </p>
      </LegalSection>

      <LegalSection id="proprieta" title="10. Intellectual property">
        <p>
          The name, logo, graphics and texts of {LEGAL.serviceName} belong to {LEGAL.ownerName}. The source
          code is publicly viewable; it can be reused only within the limits of any license stated in the
          respective repository. Using the Service does not give you any rights beyond those needed to use
          it.
        </p>
      </LegalSection>

      <LegalSection id="chiusura" title="11. Closing the account">
        <LegalList>
          <li>
            You can stop using the Service at any time. To close the account and delete your data, use
            Settings → Delete account and confirm with your email: everything is deleted right away and cannot
            be recovered (encrypted backups disappear within 30 days). If you cannot sign in, write to {mail}
            from the address linked to the account.
          </li>
          <li>
            We may suspend or close an account that breaks these Terms or puts the security of the Service
            or other users at risk, telling you by email unless security or legal reasons prevent it.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="responsabilita" title="12. Limitation of liability">
        <LegalList>
          <li>
            The Service is provided &quot;as is&quot;. To the extent permitted by law we are not liable for
            damage resulting from decisions made on the basis of the Service&apos;s data or analyses, from
            inaccurate data provided by you or your bank, or from interruptions or data loss caused by
            third-party providers (banks, GoCardless, hosting, database, AI services).
          </li>
          <li>
            Nothing in these Terms limits our liability for wilful misconduct or gross negligence (Art.
            1229 of the Italian Civil Code), nor the rights that the law grants consumers and that cannot
            be waived.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="modifiche" title="13. Changes to the Terms">
        <p>
          We may update these Terms, for example when we add features or the rules change. The date at the
          top of the page shows the latest version. We will tell you about substantial changes by email or
          with a notice in the app at least 15 days before they apply; if you do not accept them, you can
          close the account (section 11).
        </p>
      </LegalSection>

      <LegalSection id="legge" title="14. Governing law and disputes">
        <LegalList>
          <li>These Terms are governed by Italian law.</li>
          <li>
            If you use the Service as a consumer, any dispute falls under the court of the place where you
            live or are domiciled (Art. 66-bis of the Italian Consumer Code, Legislative Decree 206/2005).
          </li>
          <li>Before taking action, write to us: we will try to settle the matter amicably.</li>
        </LegalList>
      </LegalSection>

      <LegalSection id="contatti" title="15. Contact">
        <p>For questions about these Terms write to {mail}.</p>
      </LegalSection>
    </LegalPage>
  );
}
