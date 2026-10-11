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

Il contratto dei wallet merita una nota a parte, perché il saldo **finale** non è
un campo scrivibile: `GET /wallet` restituisce ogni wallet con il `balance`
**calcolato dalle transazioni** al momento della lettura, a partire dal saldo di
apertura del wallet (vedi [APP_ARCHITECTURE.md](./APP_ARCHITECTURE.md)).
`PUT /wallet/:id` accetta `name`, `is_default` e `opening_balance_cents` — il
saldo di apertura, in **centesimi interi** con segno ammesso, reso modificabile
dalla pagina `/wallets` — ma non `balance`. `POST /wallet` accetta solo `name` e
crea il wallet con `balance: 0` e apertura `0`.

### Elenco transazioni

Il backend espone l'elenco completo su `GET /transaction/all` e
`GET /transaction/:id` per una singola transazione; `GET /transaction` non è
una route lista. Le pagine principali del client usano gli endpoint separati
`/income/all` e `/expense/all`.

Gli endpoint di lista rispondono con un **envelope**, non più con un array nudo:
`{ data, count, truncated, total }` — `GET /bank/transactions` mantiene la chiave
`transactions` al posto di `data`. `count` è il numero di righe presenti nella
risposta, `total` è il numero di righe del periodo secondo il database (`null` se
il server non lo dichiara), `truncated` è `true` quando il set è stato tagliato al
tetto di paginazione (server: `utils/paginatedSelect.js`).

Il client normalizza la risposta con `parseListResponse` (`lib/listResponse.ts`),
che restituisce `{ rows, count, truncated, total }` e accetta anche l'array nudo
della forma precedente, per non rompersi nella finestra in cui il server non è
ancora aggiornato. Gli hook `useIncomes` / `useExpenses` restituiscono questo
oggetto: le righe si leggono da `rows` (non dal body) e le somme si calcolano su
`rows`, così il totale di periodo usa lo stesso insieme di righe contato dal
server. Quando `truncated` è `true` la somma è parziale: i widget mostrano
`≥ <totale>` e, come le pagine `/incomes`, `/expenses` e i movimenti bancari,
rendono l'avviso di `components/truncated-notice.tsx` ("Dati troncati: mostrate N
righe su M").

Anche `GET /category` e `GET /category/active` usano l'envelope (pagina
`/category`, hook `useCategories` / `useActiveCategories`: le righe si leggono da
`rows`). L'elenco categorie non è un elenco di movimenti, quindi non ha somme da
dichiarare parziali, ma la pagina `/category` mostra comunque l'avviso quando
`truncated` è `true`: un elenco tagliato non deve passare per completo.

## Flusso Importazione Bancaria

La pagina `/settings/yourbank` interagisce con il backend tramite:
1. `GET /bank/transactions?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`: carica i movimenti bancari sincronizzati per il periodo selezionato.
2. `POST /bank/import`: invia un payload JSON con gli ID delle transazioni selezionate, il `walletId` e il `categoryId`. Il server inserisce i record nella tabella `Transaction` di Flow Wise, decide il tipo dal segno dell'importo (`amount >= 0` → `"I"`, altrimenti `"E"`; un eventuale `defaultType` inviato dal chiamante ha la precedenza) e contrassegna i movimenti come `imported`.
3. **Categoria proposta automaticamente nell'import massivo**: `ImportTransactionDialog.tsx` non si limita a inoltrare la categoria scelta dall'utente. Con l'auto-suggerimento attivo (default) assegna a ogni movimento una categoria **attiva** del tipo corretto per il segno dell'importo, scegliendola in base alla somiglianza tra descrizione/controparte e nome della categoria; raggruppa poi i movimenti per categoria suggerita e ripete la chiamata a `POST /bank/import` una volta per gruppo. Per un singolo movimento o con l'auto-suggerimento disattivato invia una sola chiamata con la categoria scelta a mano.
4. Invalida la cache TanStack Query per `transactions`, `wallets`, `expenses` e `incomes`.

## AI Beta

La pagina `app/ai-beta/page.tsx` invia `question`, `startDate` e `endDate` a
`POST /agents/analytics`. Le date iniziali sono il primo giorno del mese
corrente e oggi. Ogni invio è una richiesta indipendente: la cronologia visibile
nel browser non viene inviata come contesto. La risposta del modello è resa
come testo Markdown; non viene interpretato HTML.

Il server legge al massimo 1.000 movimenti del periodo e invia al modello un
riepilogo compatto, non il record completo delle spese. Il riepilogo include
totali, categorie, andamento mensile e fino a dieci esempi di spese. Il conteggio
totale del periodo arriva da una query di count separata, quindi la risposta non
viene mai presentata come completa quando non lo è: `analysis` inizia con la
dichiarazione di copertura ("Ho analizzato N movimenti su M del periodo") e, se
il periodo supera il limite, aggiunge l'avviso che l'analisi copre solo i primi
N. Gli stessi numeri sono nel payload come `coverage`
(`rowsFetched`, `totalRows`, `limit`, `truncated`, `notice`) e in
`transactionsAnalyzed` / `totalTransactions`, per chi vuole mostrarli a parte.

## TanStack Query

Gli hook sono in `lib/hooks/useQueries.ts`. Le query condividono un
`QueryClient` creato in `lib/providers/QueryProvider.tsx` con:

- `staleTime`: 60 secondi;
- `gcTime`: 5 minuti;
- `retry`: una volta per query e nessun retry predefinito per mutation;
- `refetchOnWindowFocus`: disabilitato.

Le chiavi sono raggruppate in `queryKeys`. Le mutation di transazioni, le importazioni bancarie
e l'import CSV (`useImportCsv`) invalidano transazioni, wallet, entrate e spese; le mutation di
wallet o categorie invalidano la rispettiva risorsa. Le mutation mostrano toast tramite Sonner,
con l'eccezione di `useImportCsv`, che non ne mostra: la pagina `/settings/import` gestisce già
i propri messaggi con un `id` condiviso.

`buildQuery` serializza parametri non nulli con `URLSearchParams`.
