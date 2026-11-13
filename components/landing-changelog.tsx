/**
 * Changelog mostrato nella landing page. Ricostruito dalla storia dei commit di
 * flow-wise-client e flow-wise-server (primo commit: 7 febbraio 2025). Le voci
 * descrivono cosa e' cambiato per chi usa l'app, non il dettaglio tecnico.
 * Aggiungi in cima le nuove versioni.
 */
const CHANGELOG: Array<{ period: string; title: string; items: string[] }> = [
  {
    period: "November 2026",
    title: "Your data, backed up and yours to download",
    items: [
      "Settings → Your data: download everything you have in Flow Wise as a JSON file, or your movements as a CSV file that opens in Excel.",
      "Nightly encrypted backups of the database, kept for 30 days, with a tested restore.",
      "Forgot your password? The reset email now really arrives, from a Flow Wise address and in the app's style.",
      "The password recovery pages look like the login page, in light and dark mode.",
      "Annual plan: each month shows what is due and how much to put aside that month, higher while a pot is behind and then down to the yearly average.",
      "Settings → Delete account: delete your account and all its data yourself, confirming with your email.",
      "Annual plan without a savings pot? It now helps you create one and add the first expense.",
      "Bank import: one tap brings a changed category back to the suggested one.",
      "A short guided tour for new accounts, and Replay the tour in Settings.",
      "Annual plan items can be renamed.",
    ],
  },
  {
    period: "November 2026",
    title: "Refunds and an English app",
    items: [
      "Refunds: money a friend pays back lowers the expense it belongs to (a dinner, the condo fees) instead of counting as income.",
      "Bank transfers with a note such as \"condominio\" or \"tari\" are recognized by their text, not by who sent them.",
      "Total Balance shows the balance read from your bank for linked accounts, and how it splits between accounts and savings pots.",
      "Annual plan installments can be marked as paid even without linking a movement.",
      "The whole app, the Privacy Policy and the Terms of Service are now in English.",
    ],
  },
  {
    period: "November 2026",
    title: "Savings pots and the annual expenses plan",
    items: [
      "Transfers between wallets: moving money from one account to another no longer counts as income or expense.",
      "A single Movements page for wallets, income, expenses and transfers, with combinable filters by type, wallet and period.",
      "Transfers that arrive from the bank without a destination are completed in one click, or recorded as an expense or income when the other account is not tracked.",
      "Savings pots inside an account, with an optional cap and a warning when a deposit would exceed it.",
      "Annual plan: expenses with installments and due dates, a suggested monthly deposit and a 12-month projection of the fund.",
    ],
  },
  {
    period: "November 2026",
    title: "Automatic import, and data that stays yours",
    items: [
      "Bank movements arrive on their own every morning, only once booked and without duplicates.",
      "Imported movements are categorized by internal rules that learn from your corrections: no data is sent to external services.",
      "Wallet filter for income and expenses, and a tag on wallets linked to a bank.",
      "New Terms of Service and Privacy Policy, and a box explaining which data the AI assistant uses.",
    ],
  },
  {
    period: "October 2026",
    title: "Open banking and the AI assistant",
    items: [
      "Link real Italian and European banks through GoCardless (PSD2, read-only), with movement sync and account balance.",
      "Import bank movements, also in groups, with a suggested category for each one.",
      "AI Beta assistant that analyses your spending over a period.",
      "Password recovery by email.",
      "Wallet balances calculated from the movements, starting from an editable opening balance.",
      "Stricter CSV import: ambiguous rows are rejected with a clear message.",
      "Always complete lists, protection against deleting wallets and categories still in use, encrypted bank credentials.",
    ],
  },
  {
    period: "April 2026",
    title: "Import from file",
    items: ["New import of movements from CSV files."],
  },
  {
    period: "January 2026",
    title: "A dashboard that fits you",
    items: [
      "New dashboard with widgets to drag and resize: period expenses, income vs expenses, spending by category.",
      "Period picker shared across pages.",
      "Navigation designed for smartphones, with a bottom bar.",
      "More reliable profile photo upload.",
    ],
  },
  {
    period: "August 2025",
    title: "New foundations",
    items: [
      "Move to Supabase (PostgreSQL) for data and sign-in.",
      "Multiple wallets, with a default wallet.",
      "Categories that can be turned on and off, redesigned profile page.",
    ],
  },
  {
    period: "April – May 2025",
    title: "First steps towards the bank",
    items: [
      "First page to import movements.",
      "First bank link experiments and the birth of the Your Bank page.",
    ],
  },
  {
    period: "March 2025",
    title: "More control",
    items: ["Edit categories.", "Chart of the balance over time."],
  },
  {
    period: "February 2025",
    title: "Flow Wise is born",
    items: [
      "First version: income and expenses with categories, sign-in and sign-up.",
      "Dashboard with summaries and charts, date filter.",
      "Edit and delete movements straight from the tables.",
      "Profile with photo.",
    ],
  },
];

export function LandingChangelog() {
  return (
    <section id="changelog" className="bg-[#f5f5ef] px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
      <div className="mx-auto max-w-[1280px]">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#5f7a6d]">Changelog</p>
        <h2 className="mt-4 max-w-xl text-3xl font-medium leading-tight tracking-[-0.04em] text-[#142c26] sm:text-4xl">
          How Flow Wise grew
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-7 text-[#4f6158]">
          From the first commit in February 2025 to today: what changed, release after release.
        </p>

        <ol className="mt-10 space-y-8 border-l border-[#cfd8d1] pl-6 sm:pl-8">
          {CHANGELOG.map((entry) => (
            <li key={`${entry.period}-${entry.title}`} className="relative">
              <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-[#f5f5ef] bg-[#173e33] sm:-left-[39px]" />
              <p className="font-mono text-xs text-[#5f7a6d]">{entry.period}</p>
              <h3 className="mt-1 text-lg font-semibold text-[#142c26]">{entry.title}</h3>
              <ul className="mt-2 space-y-1.5 text-sm leading-6 text-[#4f6158]">
                {entry.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-[#7fa08f]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
