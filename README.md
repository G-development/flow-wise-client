# Flow Wise Client

Frontend del money tracker Flow Wise, realizzato con Next.js App Router (Next.js 15), React 19,
TypeScript, Tailwind CSS, TanStack Query e autenticazione Supabase.

## Funzionalità

Interfaccia **solo in inglese** (dall'11/11/2026); i commenti del codice restano in italiano.

- **Autenticazione**: registrazione, login, recupero e reset password via email (pagine con lo stesso stile del login,
  `components/auth-shell.tsx`; la mail parte dalla casella di sistema del server). Un account nuovo vede un **tour
  guidato** sulla dashboard (`components/onboarding-tour.tsx`), che si rivede da Settings.
- **Dashboard fissa** (16/11/2026): saldo (conti e salvadanai, saldo della banca per i conti collegati), cose da
  sistemare nel periodo, il mese con il confronto sul mese prima, versamenti e rate in arrivo del piano annuale, spese
  per categoria e ritmo delle spese. Il periodo è condiviso con Movements e parte dal **giorno di inizio del mese**
  scelto al primo accesso (modificabile in Settings).
- **Movements (`/movements`)**: wallet, entrate, spese e trasferimenti in una pagina, con filtri per tipo, wallet e
  periodo, trasferimenti da assegnare in cima ed etichetta colorata della categoria su ogni movimento. Il saldo di ogni
  wallet e' calcolato dalle transazioni a partire da un saldo di apertura; i salvadanai stanno sotto il loro conto, con
  un tetto facoltativo, e si muovono **solo con trasferimenti dal o verso il loro conto**.
- **Rimborsi**: un'entrata segnata "Refund" riduce la spesa della sua categoria invece di contare come entrata.
- **Categorie (`/category`)**: schede Expenses / Income, quanto e' usata ogni categoria, regole che categorizzano i
  movimenti della banca (visibili e modificabili), unione di due categorie, riquadro "To review" per i movimenti ancora
  in "Altro"/"Other", colore e icona.
- **Piano annuale (`/annual-plan`)**: spese annuali con rate pagate da un salvadanaio; mese per mese quanto si paga
  (Due), quanto versare (Deposit, alto finche' il salvadanaio e' indietro, poi verso la media annua) e il saldo; senza
  salvadanai la pagina aiuta a crearne uno.
- **Importazione CSV** (`/settings/import`).
- **Your Bank (`/settings/yourbank`)**: collegamento PSD2 tramite GoCardless (o sandbox mock), sincronizzazione,
  import guidato con la categoria suggerita (e "Back to suggestion"), **import automatico giornaliero** con regole
  locali che imparano dalle correzioni. Dettagli in `flow-wise-server/BANK_INTEGRATION.md`.
- **Settings (`/settings`)**: profilo e foto, preferenze, scorciatoie, aiuto (tour, novita', pagine legali), **Your
  data** (export JSON o CSV) e **Delete account**.
- **AI Beta (`/ai-beta`)**: chat con l'agente di analisi delle spese, con il riquadro dei dati inviati a Groq.
- **Pagine legali**: Termini (`/terms`) e Privacy (`/privacy`), in inglese, aggiornate al 13/11/2026.
- **Landing page** (`/`) con il changelog dal febbraio 2025.

## Struttura

```text
app/                  Route Next.js e pagine
  dashboard/          Dashboard fissa a sezioni
  movements/          Wallet, entrate, spese e trasferimenti
  category/           Categorie, regole, unione, "To review"
  annual-plan/        Piano delle spese annuali
  settings/           Profilo e dati (page), import CSV, Your Bank
  ai-beta/            Chat di prova per l'agente delle spese
  login/ register/ forgot-password/ reset-password/  Accesso
  privacy/ terms/     Pagine legali
components/           Componenti condivisi (navbar, dialog, categories/, settings/, movements/, dashboard/, ui/)
lib/                  Client Supabase, API wrapper, hook (hooks/), stile categorie (categoryStyle.tsx), logica pura con test
public/               Asset statici
```

## Configurazione

Crea `.env.local` nella root del progetto:

```env
NEXT_PUBLIC_API_URL=http://localhost:5030
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-key>
```

`NEXT_PUBLIC_API_URL` deve puntare al server Flow Wise. In locale il backend
consente le origini client di sviluppo configurate in `server.js`; in
produzione configura le origini effettive in `ALLOWED_ORIGINS` sul server.
Non inserire chiavi Supabase service-role o chiavi del provider AI nel client.

## Avvio e controlli

```bash
npm install
npm run dev
```

Per compilare per la produzione:

```bash
npm run build
```

I controlli del client — test unitari, typecheck e build con lint — stanno in un
unico comando:

```bash
npm test    # node --test + npx tsc --noEmit + next build (include il lint di Next)
```

Il comando parte da `.next` pulito: senza la pulizia i tipi generati di una route
rimossa o rinominata restano in cache e fanno fallire la build su un albero
sorgente corretto.

## Controlli prima del push

Il repo versiona un hook `pre-push` in `.githooks/pre-push`, attivo quando
`git config core.hooksPath .githooks` è impostato. L'hook esegue `npm test` e
rifiuta il push se fallisce: `node --test` (invarianti), `npx tsc --noEmit`
(typecheck) e `next build` (build + lint di Next), in quest'ordine.

Non c'è un'approvazione per commit: il push lo decide Gio, e un agente lo fa solo
dopo il suo ok esplicito.

## Documentazione

- [API Structure](./API_STRUCTURE.md): chiamate client, route backend, caching e payload.
- [Architettura](./APP_ARCHITECTURE.md): struttura del frontend e del backend, layout e flussi di dati.
- [Dashboard](./DASHBOARD_STRUCTURE.md): sezioni della dashboard e inizio del mese.
