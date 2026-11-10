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
`/register`, `/privacy`, `/terms`, `/forgot-password` e `/reset-password`.

Le pagine `/forgot-password` e `/reset-password` sono implementate e chiamano
le route pubbliche di reset del server; essendo in `PUBLIC_ROUTES` del provider
sono raggiungibili anche senza sessione.

La barra di navigazione è in `components/navbar.tsx`. `lib/api.ts` centralizza
le chiamate autenticate; i form di autenticazione usano anche direttamente
Supabase o `fetch`, a seconda del flusso.

### Pagine

- `/login`, `/register`, `/forgot-password`, `/reset-password`: accesso,
  registrazione e recupero credenziali.
- `/dashboard`: griglia widget configurabile e intervallo date condiviso.
- `/movements`: wallet, entrate, spese e trasferimenti in una pagina (dal 10/11/2026 sostituisce `/incomes`, `/expenses`, `/transfers` e `/wallets`, che rimandano qui con il filtro giusto: `next.config.ts`). In alto le card dei wallet (logo della banca collegata da `GET /bank/institutions` + `GET /bank/connections`, saldo, entrate e spese del periodo, modifica / default / elimina, "Add wallet"); poi i trasferimenti da assegnare; poi filtri a checkbox per tipo e wallet, salvati nell'indirizzo (`?types=I,E&wallets=1`), totali e tabella. Filtri e totali in `lib/movements.ts`; dati da `GET /transaction/all` con le date (`useMovements`). Creazione e modifica con lo stesso pannello (`components/new-transaction.tsx`, prop `transaction`).
- `/annual-plan` (fase 3, migrazione 013 del server): piano delle spese annuali di un salvadanaio (`?wallet=`). Riepilogo (saldo, quota mensile consigliata, tetto, rate dei prossimi 12 mesi), avvisi di scoperto adesso e di conflitto col tetto, proiezione mese per mese, voci con le loro rate (aggiungi, modifica, elimina, copia sull'anno dopo, collega il pagamento a un movimento). Il calcolo è tutto del server (`GET /annual-plan`); hook in `lib/hooks/useAnnualPlan.ts`. Le card dei salvadanai in `/movements` mostrano saldo / tetto e la quota consigliata, con "Set cap" (nessuno, fisso, dal piano) e il link al piano; l'avviso di tetto superato (`components/movements/cap-warning.tsx`, logica in `lib/potCap.ts`) compare assegnando un trasferimento o creandone uno, e non blocca.
- `/category`: gestione categorie.
- `/budgets`: placeholder "Work in progress", deliberatamente non linkato in
  navigazione finche' la feature non esiste (raggiungibile solo per URL diretto).
- `/settings`, `/settings/import`, `/settings/yourbank`: profilo, CSV e
  integrazione bancaria completa.
- `/ai-beta`: interfaccia di prova dell'agente di analisi spese.
- `/privacy`: informativa privacy (GDPR, artt. 13-14). `/terms`: termini di servizio. Titolare, contatto e data di aggiornamento stanno in `lib/legal.ts`, l'impaginazione comune in `components/legal-page.tsx`. Se cambia un trattamento (nuovo fornitore, nuovi dati raccolti) l'informativa va aggiornata.
- `/` (landing): include il changelog del progetto (`components/landing-changelog.tsx`), da aggiornare a ogni rilascio rilevante.

Il CRUD delle categorie è in `components/category-dialog.tsx`, che invia
`type: "I"` / `"E"` come il database; in `/category` edit e delete partono
dall'id della riga (la colonna id è nascosta da `hiddenColumns` di
`components/dynamic-table.tsx`) e `components/delete-dialog.tsx` è un dialog di
conferma generico che lascia la mutation al chiamante.

### Integrazione Bancaria (`/settings/yourbank`)

La pagina `/settings/yourbank` include:
- **Badge di stato modalità**: mostra dinamicamente se è attivo l'ambiente *PSD2 Open Banking* reale o la *Sandbox Mode*.
- **Drawer di selezione istituti (`BankDrawer.tsx`)**: ricerca rapida e avvio dell'autorizzazione per banche italiane ed europee.
- **Card dei conti collegati**: elenco dei conti attivi con data dell'ultimo sync, azione di sincronizzazione manuale immediata e disconnessione sicura.
- **Filtro del periodo transazioni**: default dinamico dal 1° giorno del mese corrente alla data odierna, con preset rapidi (*Questo mese*, *Mese scorso*, *Ultimi 30 gg*, *Ultimi 90 gg*, *Tutto*) e selezione date manuale.
- **Selezione massiva e importazione (`ImportTransactionDialog.tsx`)**: riepilogo finanziario del gruppo selezionato (numero di movimenti, totale entrate e totale spese) e conversione in record di tipo `Transaction` associati al Wallet di destinazione e a una Categoria, con invalidazione automatica della cache TanStack Query (`transactions`, `wallets`, `incomes`, `expenses`). La categoria si sceglie **per ogni movimento**, con un menu filtrato sul tipo atteso dal segno dell'importo (`"I"` per importi non negativi, `"E"` altrimenti) e precompilato da `suggestBankTransactionCategory` (`lib/bankCategorySuggestion.ts`, coperto da `lib/bankCategorySuggestion.test.ts`). Il suggerimento è *sicuro* solo se il nome di **una sola** categoria attiva del tipo giusto (almeno 3 caratteri) compare come parola intera in descrizione + controparte normalizzate; altrimenti (nessuna corrispondenza o pareggio) il movimento è marcato **incerto** con un'icona di avviso e precompilato con la categoria `Altro` del suo tipo. Se `Altro` manca, all'import il modale propone di crearla; se l'utente rifiuta, la categoria va scelta a mano. All'invio i movimenti vengono raggruppati per categoria e inviati con una `POST /bank/import` per gruppo; se un gruppo fallisce dopo che altri sono passati, il modale segnala l'import parziale e aggiorna comunque gli elenchi.
- **Import automatico (`AutoImportSettings.tsx`)**: in ogni card si sceglie il wallet di destinazione e la data di partenza dell'import automatico giornaliero (`PUT /bank/connections/:bank/auto-import`), oppure lo si disattiva. Il job gira sul server, ogni mattina, e importa solo movimenti contabilizzati con la categoria scelta dall'AI o `Altro`: dettagli in [BANK_INTEGRATION.md](../flow-wise-server/BANK_INTEGRATION.md#import-automatico-giornaliero).
- **Saldo del conto**: ogni card dei conti collegati mostra l'ultimo saldo letto dal provider (campo `balance` di `/bank/connections` e `/bank/status`), con tipo e data, oppure "Saldo bancario non disponibile".

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

### Convenzione sugli importi

`Transaction.amount` è un **valore assoluto**: il segno lo decide `type` (`"I"` /
`"E"`). Il segno non va mai letto dal numero, perché un `amount` negativo non
significa "uscita" ma "dato non normalizzato" (per esempio un CSV importato con
`-50,00`).

La regola vive in due punti speculari, uno per repo, perché i repo sono separati:
`lib/amount.ts` nel client (`absoluteAmount`, `signedAmount`, `totalForType`) e
`utils/amount.js` nel server (`amountToCents`, `signedAmountCents`), che
`sumBalancesInCents` usa per il saldo. I widget di dashboard sommano con
`totalForType` le stesse righe che il server somma per il saldo, quindi una riga
col segno nel numero non fa più divergere i totali di periodo dal saldo: entrambi
la contano come magnitudine e le danno il segno di `type`.

Non vale per `bank_transactions`, dove il segno è nel valore perché è il formato
del provider bancario: la traduzione in (`amount` positivo, `type`) avviene
all'import.

### Saldo dei wallet

Il saldo mostrato non è un valore memorizzato: è **derivato dalle transazioni**
a ogni lettura, in `utils/walletService.js`. `sumBalancesInCents` legge le
transazioni dell'utente paginando con `.range()` (PostgREST tronca le risposte a
1000 righe e su questo progetto gli aggregati SQL sono disabilitati con
`PGRST123`, quindi la somma avviene in JavaScript), somma in centesimi per
evitare errori di virgola mobile e si ferma con un errore esplicito oltre
`MAX_PAGES` invece di restituire una somma parziale. `getWalletsWithBalances`
restituisce i wallet con il `balance` calcolato ed è quello che usa
`GET /wallet`; `getWalletBalance` (il singolo wallet) è esportato ma nessuna
route lo chiama ancora.

La scelta è deliberata: `Wallet.balance` andrebbe riscritto da ogni percorso che
tocca `Transaction` (creazione, modifica ed eliminazione di transazioni, import
CSV, import bancario) e basta dimenticarne uno per avere un saldo sbagliato che
sembra corretto; derivarlo rende `Transaction` l'unica fonte di verità. Il costo
è una lettura paginata per ogni richiesta che mostra i saldi. Quando il volume
crescerà, la sostituzione naturale è una view Postgres (`wallet_balances`
`GROUP BY wallet_id`) letta in una sola query.

La colonna `Wallet.balance` esiste ancora e viene scritta a `0` alla creazione
del wallet (`routes/wallet.js`, `routes/user.js`), ma non è più la fonte del
dato mostrato; `PUT /wallet/:id` non accetta `balance`.

Il punto di partenza della somma è `Wallet.opening_balance_cents` (integer NOT
NULL default 0, in centesimi, `migrations/003_wallet_opening_balance.sql`):
`sumBalancesInCents` parte da lì invece che da zero, altrimenti il saldo è
corretto solo se ogni movimento dalla nascita del wallet è in `Transaction`.
`PUT /wallet/:id` accetta anche `opening_balance_cents` (intero, segno ammesso) e
la pagina `/wallets` lo mostra e lo rende modificabile per wallet: l'input è in
EUR e viene convertito in centesimi prima della chiamata.

### Liste e troncamento

PostgREST tronca una risposta a 1000 righe anche senza `limit`: vale per gli
endpoint di lista, non solo per il saldo. Il server pagina e ogni endpoint di
lista risponde con un envelope
(`{ data, count, truncated, total }`; `GET /bank/transactions` mantiene
`transactions` al posto di `data`, vedi
[API_STRUCTURE.md](./API_STRUCTURE.md)).

Il client legge quell'envelope con `parseListResponse` (`lib/listResponse.ts`) e
gli hook `useIncomes` / `useExpenses` restituiscono `{ rows, count, truncated,
total }`. Da qui discendono due regole, entrambe coperte dal codice:

- le righe si leggono da `rows` e le somme si calcolano su `rows`, mai sul campo
  dichiarato `count`: così la somma di periodo usa lo stesso insieme di righe che
  il server ha contato, e con 1001 righe nel periodo i due numeri coincidono;
- quando `truncated` è `true` l'insieme è incompleto: i widget mostrano
  `≥ <totale>` e `components/truncated-notice.tsx` rende "Dati troncati: mostrate
  N righe su M", quindi una somma parziale non viene mai presentata come totale
  definitivo. Lo stesso avviso compare su `/movements` e sui movimenti bancari
  (`/settings/yourbank`).

`parseListResponse` accetta anche l'array nudo della forma precedente al
contratto, per non rompere il client nella finestra in cui il server non è ancora
aggiornato; in quel caso non c'è nulla da dichiarare e `total` resta `null`.

### Agente di analytics

`routes/agents.js` recupera solo spese dell'utente autenticato nell'intervallo
richiesto (mese corrente fino a oggi se omesso), con un massimo di 1.000
transazioni per richiesta (`.range(0, limit - 1)`, `range` è inclusivo). Il
totale reale del periodo arriva da una count query separata, e la risposta dichiara
sempre la copertura ("Ho analizzato N movimenti su M del periodo"): se il periodo
ha più movimenti del limite, `analysis` lo dice esplicitamente invece di
presentare l'analisi come completa. `agents/analyticsAgent.js` aggrega i dati
prima dell'invio al provider: totale, media, categoria, andamento mensile e fino
a dieci esempi, con limiti sulle descrizioni. Il provider si configura sul server
con `LLM_API_KEY`; endpoint Groq e modello predefinito sono documentati nel
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

Ultima verifica: 2026-11-06, sui commit `de41f49` (client) e `8b4e0f3` (server).

**Difetti aperti**

- **`app/settings/page.tsx` scrive la tabella `Profile` dal browser** con la
  chiave anon (`supabase.from("Profile")`, in lettura e scrittura), mentre il
  server espone solo `GET /users/profile`: dipende dalle RLS e fallisce in
  silenzio se non sono configurate. La scrittura appartiene al server.
- **L'import bancario manuale usa ancora il suggerimento del client**
  (`lib/bankCategorySuggestion.ts`, confronto con il nome della categoria) e non
  le regole locali del server (`category_rules`), che valgono solo per l'import
  automatico. Inoltre `POST /bank/import` accetta un solo `categoryId` per
  chiamata: il client fa una richiesta per gruppo e un errore a metà lascia un
  import parziale.
- **Nessuna schermata per le regole di categoria**: si creano dalle correzioni
  (`PUT /transaction/:id`) o a mano sul database, ma non si possono vedere né
  eliminare dall'app.
- **Giroconti come entrate/spese**: i trasferimenti (salvadanaio, verso altri
  conti) sono movimenti `I`/`E` nella categoria "Giroconto" e gonfiano i totali;
  il tipo `T` esiste nell'enum del database ma l'app non lo usa.
- **`/budgets` è un segnaposto** (vedi sotto).

**Chiusi**

- **Recupero password** (server, `utils/passwordResetService.js`): la ricerca
  dell'utente scorre tutte le pagine della Admin API e, se le esaurisce, lancia
  un errore invece di rispondere "utente inesistente"; senza `SMTP_HOST` la
  route risponde `502` con il motivo reale, e il token viene salvato solo dopo
  che la mail è partita. `/forgot-password` e `/reset-password` sono in
  `PUBLIC_ROUTES`.
- **Suggerimento di categoria nell'import bancario**: un movimento senza
  corrispondenza non riceve più in silenzio la prima categoria del suo tipo,
  ma è marcato come incerto e precompilato con `Altro` (vedi *Integrazione
  Bancaria* sopra).

**Integrazione bancaria**

Chiusa il 2026-10-11, verificata sul codice del server (`utils/bankService.js`):

- `BANK_PROVIDER` e `BANK_MOCK_ENABLED` sono lette davvero da
  `isMockBankModeEnabled()`: il mock è attivo solo con un consenso esplicito
  (`BANK_PROVIDER=mock`, oppure `BANK_MOCK_ENABLED` a `true`/`1`/`yes`/`on`).
  In ogni altro caso il server è in **live**: un errore del provider GoCardless
  risale come errore e non diventa mai una lista di movimenti finti. Il live
  richiede `GOCARDLESS_SECRET_ID` e `GOCARDLESS_SECRET_KEY`, documentate in
  `.env.example` e in [BANK_INTEGRATION.md](../flow-wise-server/BANK_INTEGRATION.md).
- gli `external_id` dei movimenti mock sono deterministici
  (`txn_<bank>_<account>_mock_<daysAgo>_<indice>`, nessun timestamp), quindi
  l'unicità `(user_id, bank_id, account_id, external_id)` regge a ogni
  sincronizzazione e l'upsert non duplica i movimenti;
- `access_token` e `refresh_token` in `bank_connections` sono cifrati at-rest
  (`utils/bankTokenCrypto.js`), non più in chiaro.

Limite noto:

- `BANK_SCHEDULER_SECRET` non configurato → le route `/bank/scheduler/*`
  rispondono `503`.

**Debito tecnico minore**

- `/budgets` è un placeholder "Work in progress" non linkato in navigazione
  finche' la feature non esiste (raggiungibile solo per URL diretto).
- `check-db.mjs` nel repo server contiene solo un commento: lo script è stato
  rimosso e il file è rimasto.
