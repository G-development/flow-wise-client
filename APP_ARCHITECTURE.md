# Architettura Flow Wise

Flow Wise è composto da due applicazioni distinte:

- **Client**: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS,
  componenti Radix/shadcn-style, TanStack Query e Supabase Auth.
- **Server**: API Express 4 in ESM, Supabase JS, Zod, CORS e servizi per
  importazione, reset password e connessione bancaria.

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
reindirizzato al login se vi accede. La logica non è stata modificata.

La barra di navigazione è in `components/navbar.jsx`. `lib/api.ts` centralizza
le chiamate autenticate; i form di autenticazione usano anche direttamente
Supabase o `fetch`, a seconda del flusso.

### Pagine

- `/login`, `/register`, `/forgot-password`, `/reset-password`: accesso,
  registrazione e recupero credenziali.
- `/dashboard`: griglia widget configurabile e intervallo date condiviso.
- `/incomes`, `/expenses`: rispettivamente movimenti di tipo entrata e spesa.
- `/wallets`, `/category`, `/budgets`: gestione wallet, categorie e pagina
  budgets attualmente indicata come work in progress.
- `/settings`, `/settings/import`, `/settings/yourbank`: profilo, CSV e
  integrazione bancaria.
- `/ai-beta`: interfaccia di prova dell'agente di analisi spese.
- `/privacy`: informativa.

La pagina AI Beta invia ogni domanda separatamente insieme al periodo scelto;
la cronologia in pagina non è memoria lato modello o lato server.

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
- `/bank`: OAuth e movimenti bancari.
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
conversazione. I dati inclusi nel riepilogo vengono inviati al provider AI.

## Avvio e verifica

Avvia prima il server (`cd ../flow-wise-server && npm run dev`), poi il client
(`npm run dev`). In locale il client usa `NEXT_PUBLIC_API_URL`, tipicamente
`http://localhost:5030`; Supabase deve essere configurato per entrambi.

Per verificare il client esegui `npx tsc --noEmit` e `npm run build`. Per
verificare il server esegui `node --check` sui file JavaScript. I manifest
attuali non definiscono una suite di test applicativa.
