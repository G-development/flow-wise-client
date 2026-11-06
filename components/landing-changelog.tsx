/**
 * Changelog mostrato nella landing page. Ricostruito dalla storia dei commit di
 * flow-wise-client e flow-wise-server (primo commit: 7 febbraio 2025). Le voci
 * descrivono cosa e' cambiato per chi usa l'app, non il dettaglio tecnico.
 * Aggiungi in cima le nuove versioni.
 */
const CHANGELOG: Array<{ period: string; title: string; items: string[] }> = [
  {
    period: "Novembre 2026",
    title: "Import automatico e dati che restano tuoi",
    items: [
      "I movimenti della banca arrivano da soli ogni mattina, solo quando sono contabilizzati e senza doppioni.",
      "Le categorie dei movimenti importati sono scelte da regole interne che imparano dalle tue correzioni: nessun dato viene inviato a servizi esterni.",
      "Filtro per wallet nelle pagine Entrate e Spese, e indicazione dei wallet collegati alla banca.",
      "Nuovi Termini di servizio e Informativa privacy, e un riquadro che spiega quali dati usa l'assistente AI.",
    ],
  },
  {
    period: "Ottobre 2026",
    title: "Open banking e assistente AI",
    items: [
      "Collegamento a banche reali italiane ed europee tramite GoCardless (PSD2, sola lettura), con sincronizzazione dei movimenti e saldo del conto.",
      "Import dei movimenti bancari, anche a gruppi, con categoria suggerita per ciascuno.",
      "Assistente AI Beta che analizza le tue spese in un periodo.",
      "Recupero della password via email.",
      "Saldo dei wallet calcolato dai movimenti a partire da un saldo di apertura modificabile.",
      "Import CSV più rigoroso: le righe ambigue vengono rifiutate con un messaggio chiaro.",
      "Elenchi sempre completi, protezione contro la cancellazione di wallet e categorie ancora in uso, credenziali bancarie cifrate.",
    ],
  },
  {
    period: "Aprile 2026",
    title: "Import da file",
    items: ["Nuovo import dei movimenti da file CSV."],
  },
  {
    period: "Gennaio 2026",
    title: "Dashboard su misura",
    items: [
      "Nuova dashboard con widget da trascinare e ridimensionare: spese del periodo, entrate contro spese, spese per categoria.",
      "Selettore del periodo condiviso tra le pagine.",
      "Navigazione pensata per lo smartphone, con barra in basso.",
      "Foto profilo con caricamento più affidabile.",
    ],
  },
  {
    period: "Agosto 2025",
    title: "Nuove fondamenta",
    items: [
      "Passaggio a Supabase (PostgreSQL) per dati e accessi.",
      "Wallet multipli, con un wallet predefinito.",
      "Categorie attivabili e disattivabili, pagina del profilo rinnovata.",
    ],
  },
  {
    period: "Aprile – Maggio 2025",
    title: "Primi passi verso la banca",
    items: [
      "Prima pagina per importare movimenti.",
      "Primi esperimenti di collegamento bancario e nascita della pagina Your Bank.",
    ],
  },
  {
    period: "Marzo 2025",
    title: "Più controllo",
    items: ["Modifica delle categorie.", "Grafico dell'andamento del saldo nel tempo."],
  },
  {
    period: "Febbraio 2025",
    title: "Nasce Flow Wise",
    items: [
      "Prima versione: entrate e spese con categorie, accesso e registrazione.",
      "Dashboard con riepiloghi e grafici, filtro per date.",
      "Modifica ed eliminazione dei movimenti direttamente dalle tabelle.",
      "Profilo con foto.",
    ],
  },
];

export function LandingChangelog() {
  return (
    <section id="changelog" className="bg-[#f5f5ef] px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
      <div className="mx-auto max-w-[1280px]">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#5f7a6d]">Changelog</p>
        <h2 className="mt-4 max-w-xl text-3xl font-medium leading-tight tracking-[-0.04em] text-[#142c26] sm:text-4xl">
          Come è cresciuto Flow Wise
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-7 text-[#4f6158]">
          Dal primo commit del febbraio 2025 a oggi: cosa è cambiato, versione dopo versione.
        </p>

        <ol className="mt-10 space-y-8 border-l border-[#cfd8d1] pl-6 sm:pl-8">
          {CHANGELOG.map((entry) => (
            <li key={entry.period} className="relative">
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
