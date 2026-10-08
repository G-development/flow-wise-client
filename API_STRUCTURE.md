# API e caching client

Il client usa Supabase Auth per la sessione e il wrapper `apiFetch` in
`lib/api.ts` per la maggior parte delle chiamate al backend. La base URL è
`NEXT_PUBLIC_API_URL`, definita in `lib/constants.ts`.

## Autenticazione delle richieste

`apiFetch(path, options, token?)` usa il token passato o quello della sessione
Supabase, aggiunge `Authorization: Bearer <token>`, imposta JSON
`Content-Type` quando necessario e interrompe le richieste dopo 30 secondi.
Senza sessione lancia un errore. I form di login e registrazione sono eccezioni:
il login usa direttamente `supabase.auth.signInWithPassword`, mentre la
registrazione invia una richiesta diretta a `POST /users/register`.

Le pagine di recupero password usano le route pubbliche `/auth` del server.
Le chiamate bancarie e quelle dell'agente AI passano attraverso `apiFetch`.

## Route usate dal client

| Funzionalità | Chiamate |
| --- | --- |
| Registrazione | `POST /users/register` |
| Profilo | `GET /users/profile`; aggiornamento avatar `POST /users/profile/photo` |
| Password | `POST /auth/forgot-password`, `/auth/verify-reset-token`, `/auth/reset-password` |
| Transazioni | `POST /transaction`, `PUT /transaction/:id`, `DELETE /transaction/:id` |
| Entrate | `GET /income/all?startDate=&endDate=` |
| Spese | `GET /expense/all?startDate=&endDate=` |
| Wallet | `GET /wallet`, `POST /wallet`, `PUT /wallet/:id`, `DELETE /wallet/:id` |
| Categorie | `GET /category`, `/category/active`; CRUD su `/category` e `/category/:id` |
| Import | `POST /import/csv` |
| Layout dashboard | `GET /dashboard-layout`, `PUT /dashboard-layout` |
| Banca - Configurazione | `GET /bank/config`, `GET /bank/institutions`, `GET /bank/status?bank=` |
| Banca - Connessione | `GET /bank/authorize?bank=`, `POST /bank/disconnect?bank=` |
| Banca - Movimenti | `GET /bank/transactions?startDate=&endDate=&bank=`, `POST /bank/sync?bank=` |
| Banca - Importazione | `POST /bank/import` (`{ transactionIds, walletId, categoryId }`) |
| AI Beta | `POST /agents/analytics` con domanda e date `startDate`/`endDate` |

### Elenco transazioni

Il backend espone l'elenco completo su `GET /transaction/all` e
`GET /transaction/:id` per una singola transazione; `GET /transaction` non è
una route lista. Le pagine principali del client usano gli endpoint separati
`/income/all` e `/expense/all`.

## Flusso Importazione Bancaria

La pagina `/settings/yourbank` interagisce con il backend tramite:
1. `GET /bank/transactions?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`: carica i movimenti bancari sincronizzati per il periodo selezionato.
2. `POST /bank/import`: invia un payload JSON con gli ID delle transazioni selezionate, il `walletId` e il `categoryId`. Il server inserisce i record nella tabella `Transaction` di Flow Wise e contrassegna i movimenti come `imported`.
3. Invalida la cache TanStack Query per `transactions`, `wallets`, `expenses` e `incomes`.

## AI Beta

La pagina `app/ai-beta/page.tsx` invia `question`, `startDate` e `endDate` a
`POST /agents/analytics`. Le date iniziali sono il primo giorno del mese
corrente e oggi. Ogni invio è una richiesta indipendente: la cronologia visibile
nel browser non viene inviata come contesto. La risposta del modello è resa
come testo Markdown; non viene interpretato HTML.

Il server limita le transazioni selezionate a 1.000 e invia al modello un
riepilogo compatto, non il record completo delle spese. Il riepilogo include
totali, categorie, andamento mensile e fino a dieci esempi di spese.

## TanStack Query

Gli hook sono in `lib/hooks/useQueries.ts`. Le query condividono un
`QueryClient` creato in `lib/providers/QueryProvider.tsx` con:

- `staleTime`: 60 secondi;
- `gcTime`: 5 minuti;
- `retry`: una volta per query e nessun retry predefinito per mutation;
- `refetchOnWindowFocus`: disabilitato.

Le chiavi sono raggruppate in `queryKeys`. Le mutation di transazioni o le importazioni bancarie
invalidano transazioni, wallet, entrate e spese; le mutation di wallet o
categorie invalidano la rispettiva risorsa. Le mutation mostrano toast tramite
Sonner.

`buildQuery` serializza parametri non nulli con `URLSearchParams`.
