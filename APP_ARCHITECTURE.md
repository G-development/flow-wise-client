# Architettura Flow Wise

Flow Wise è composto da due applicazioni distinte:

- **Client**: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS,
  componenti Radix/shadcn-style, TanStack Query e Supabase Auth.
- **Server**: API Express 4 in ESM, Supabase JS, Zod, CORS e servizi per
  importazione, reset password, connessione bancaria Open Banking PSD2 e agente AI.

Le configurazioni locali del client e del server sono in `.env.local` e `.env`;
non committare file contenenti segreti.

## Client

### Layout e sessione

`app/layout.tsx` avvolge le pagine con `AuthProvider`, `DateRangeProvider` e
`QueryProvider`, oltre a Sonner e agli strumenti Vercel. `AuthProvider`
controlla e osserva la sessione Supabase, aggiorna lo stato condiviso e
reindirizza alla pagina di login quando manca una sessione su una route
protetta. Le route considerate pubbliche dal provider sono `/`, `/login`,
`/register` e `/privacy`.

Le pagine `/forgot-password` e `/reset-password` sono implementate e chiamano
le route pubbliche di reset del server, ma non sono incluse nell'elenco
`PUBLIC_ROUTES` del provider: attualmente un utente senza sessione viene
reindirizzato al login se vi accede.

La barra di navigazione è in `components/navbar.jsx`. `lib/api.ts` centralizza
le chiamate autenticate; i form di autenticazione usano anche direttamente
Supabase o `fetch`, a seconda del flusso.

### Pagine

- `/login`, `/register`, `/forgot-password`, `/reset-password`: accesso,
  registrazione e recupero credenziali.
- `/dashboard`: griglia widget configurabile e intervallo date condiviso.
- `/incomes`, `/expenses`: rispettivamente movimenti di tipo entrata e spesa.
- `/wallets`, `/category`, `/budgets`: gestione wallet, categorie e pagina
  budgets.
- `/settings`, `/settings/import`, `/settings/yourbank`: profilo, CSV e
  integrazione bancaria completa.
- `/ai-beta`: interfaccia di prova dell'agente di analisi spese.
- `/privacy`: informativa.

### Integrazione Bancaria (`/settings/yourbank`)

La pagina `/settings/yourbank` include:
- **Badge di stato modalità**: mostra dinamicamente se è attivo l'ambiente *PSD2 Open Banking* reale o la *Sandbox Mode*.
- **Drawer di selezione istituti (`BankDrawer.tsx`)**: ricerca rapida e avvio dell'autorizzazione per banche italiane ed europee.
- **Card dei conti collegati**: elenco dei conti attivi con data dell'ultimo sync, azione di sincronizzazione manuale immediata e disconnessione sicura.
- **Filtro del periodo transazioni**: default dinamico dal 1° giorno del mese corrente alla data odierna, con preset rapidi (*Questo mese*, *Mese scorso*, *Ultimi 30 gg*, *Ultimi 90 gg*, *Tutto*) e selezione date manuale.
- **Selezione massiva e importazione (`ImportTransactionDialog.tsx`)**: selezione multipla di movimenti con checkbox, riepilogo finanziario di entrate/spese e conversione immediata in record di tipo `Transaction` associati al Wallet e alla Categoria scelti, con invalidazione automatica della cache TanStack Query.

### Stato e dati

TanStack Query gestisce le query e le mutation in `lib/hooks/useQueries.ts`.
La configurazione corrente usa cache fresh per 60 secondi, garbage collection
dopo 5 minuti, un retry sulle query e nessun retry predefinito sulle mutation.
`DateRangeProvider` condivide tra dashboard, entrate e spese un intervallo
iniziale dal primo giorno del mese corrente a oggi.

Il client usa la chiave Supabase pubblicabile. Le chiamate API includono il
token bearer della sessione; non inserire chiavi service-role o AI nel bundle
frontend.

## Server

`server.js` inizializza Express, JSON fino a 10 MB, file statici da `public`,
CORS, le route API e il gestore globale degli errori. Il CORS usa
`ALLOWED_ORIGINS`, consente le origini Vercel che terminano in `.vercel.app` e
le porte localhost/127.0.0.1 3000–3002 per lo sviluppo. Il server avvia anche
lo scheduler bancario.

`config/auth-middleware.js` valida i bearer token tramite
`supabase.auth.getUser` e associa l'utente a `req.user`. Le query delle risorse
utente filtrano per il relativo ID, dato che il client Supabase del server usa
la service-role key.

### API montate

- `/users`: registrazione, profilo e upload avatar.
- `/auth`: richiesta/verifica reset password e cambio password.
- `/transaction`, `/income`, `/expense`: CRUD transazioni e liste per tipo.
- `/category`, `/wallet`: gestione delle risorse utente.
- `/dashboard-layout`: lettura e salvataggio layout widget.
- `/import`: importazione CSV.
- `/bank`: configurazione provider, autorizzazione OAuth, callback, sincronizzazione conti, filtri data e importazione massiva nei wallet.
- `/agents/analytics`: analisi delle spese con provider AI compatibile OpenAI.

Le route protette usano `requireAuth`; le eccezioni, come callback OAuth e
reset password, hanno il proprio flusso di verifica.

### Agente di analytics

`routes/agents.js` recupera solo spese dell'utente autenticato nell'intervallo
richiesto (mese corrente fino a oggi se omesso), con un massimo di 1.000
transazioni. `agents/analyticsAgent.js` aggrega i dati prima dell'invio al
provider: totale, media, categoria, andamento mensile e fino a dieci esempi,
con limiti sulle descrizioni. Il provider si configura sul server con
`LLM_API_KEY`; endpoint Groq e modello predefinito sono documentati nel
README server. Ogni messaggio è indipendente e la richiesta non persiste una
conversazione.

## Avvio e verifica

Avvia prima il server (`cd ../flow-wise-server && npm run dev`), poi il client
(`npm run dev`). In locale il client usa `NEXT_PUBLIC_API_URL`, tipicamente
`http://localhost:5030`; Supabase deve essere configurato per entrambi.

Per verificare il client esegui `npx tsc --noEmit` e `npm run build`. Per
verificare il server esegui `node --check` sui file JavaScript.

Nota: `npm run build` esegue anche il lint di Next, quindi un errore ESLint
(per esempio una regola `no-explicit-any`) fa fallire la build anche con i tipi
corretti.

## Stato verificato e limiti noti

Verificato leggendo il codice e lanciando i controlli di build. Da aggiornare
quando i punti vengono chiusi.

**Comportamenti non implementati**

- **Saldo wallet**: `Wallet.balance` resta a `0`. Il server lo scrive solo alla
  creazione (`routes/wallet.js`, `routes/user.js`) e su `PUT /wallet/:id`, che il
  client non chiama mai con `balance`. Nessuna route lo ricalcola su
  insert/update/delete di `Transaction`. Conseguenza: il widget `total-balance` e
  la colonna Balance di `/wallets` mostrano sempre zero.
- **CRUD categorie dal client**: `category-dialog.tsx` invia
  `type: "income" | "expense"`, mentre `utils/schemas.js` valida
  `z.enum(["I", "E"])` → `400 Validation error`. In `/category` l'edit passa
  `row.Name` come id (il nome usato come uuid) e la delete riusa `DeleteDialog`,
  che cancella una transazione con l'id della categoria prima di richiamare
  `onSuccess`.
- **Recupero password poco affidabile**: `requestPasswordReset` usa
  `supabase.auth.admin.listUsers()` senza paginazione (solo i primi utenti) e,
  se `SMTP_HOST` non è configurato, l'invio fallisce ma la route risponde
  comunque `success: true`.
- **`/forgot-password` e `/reset-password` non sono in `PUBLIC_ROUTES`**
  (`lib/providers/AuthProvider.tsx`): l'utente senza sessione viene reindirizzato
  al login.

**Integrazione bancaria**

- `BANK_PROVIDER` è documentata in `.env.example` e in [BANK_INTEGRATION.md](../flow-wise-server/BANK_INTEGRATION.md)
  ma non è letta dal codice: la modalità live è attiva quando
  `GOCARDLESS_SECRET_ID` e `GOCARDLESS_SECRET_KEY` sono presenti.
- `fetchTransactions` in `utils/bankService.js` cattura gli errori del provider e
  ricade sulla generazione mock: in modalità live un errore API può inserire
  movimenti fittizi.
- Gli `external_id` dei movimenti mock contengono un timestamp, quindi a ogni
  sincronizzazione l'unicità `(user_id, bank_id, account_id, external_id)` non
  viene rispettata e i movimenti si duplicano.
- `access_token` e `refresh_token` sono memorizzati in chiaro in
  `bank_connections`.
- `BANK_SCHEDULER_SECRET` non configurato → le route `/bank/scheduler/*`
  rispondono `503`.

**Debito tecnico minore**

- `app/incomes/page.tsx` e `app/expenses/page.tsx` sono due copie identiche.
- `lib/types/dashboard.ts` e `lib/hooks/useQueries.ts` convivono con tipi
  duplicati nelle pagine (`Category.type` come `"income" | "expense"` rispetto a
  `"I" | "E"` del database).
- Codice morto: `app/dashboard/another/page.tsx` (ritorna `null`),
  `check-db.mjs` vuoto, `/budgets` è un placeholder, `components/navbar.jsx` è
  JSX non tipizzato in un progetto TypeScript.
