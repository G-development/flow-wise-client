> ⚠️ **Generato con IA** - Questo documento è stato generato utilizzando GitHub Copilot

# Flow-Wise: Architettura Tecnica Dettagliata

## Panoramica

Flow-Wise è un'applicazione di tracking finanziario suddivisa in due repository separate:
- **flow-wise-client**: Frontend Next.js (React 19, TypeScript)
- **flow-wise-server**: Backend Express.js (Node.js, ESM)

Entrambi deployati su **Vercel** con variabili d'ambiente gestite nel dashboard di Vercel.

---

## Stack Tecnico

### Frontend (flow-wise-client)
- **Framework**: Next.js 15 (App Router)
- **UI Framework**: React 19 con TypeScript
- **Styling**: Tailwind CSS
- **Componenti UI**: ShadCN UI (Radix UI)
- **State Management**: React Query (@tanstack/react-query) + React state
- **Auth**: Supabase Auth (client-side)
- **API Client**: `fetch` nativo + wrapper centralizzato
- **Visualizzazione**: Recharts (grafici), react-day-picker (date picker)
- **Notifiche**: Sonner (toast)

### Backend (flow-wise-server)
- **Framework**: Express.js 4 (ESM modules)
- **Runtime**: Node.js
- **Database**: Supabase (PostgreSQL)
- **ORM**: @supabase/supabase-js v2
- **Validazione**: Zod
- **Rate Limiting**: express-rate-limit
- **CORS**: express CORS middleware

### Database
- **Supabase PostgreSQL** con tabelle:
  - `Transaction` (transazioni, income/expense)
  - `Category` (categorie, filtrate per tipo I/E)
  - `Wallet` (portafogli, max 3 per utente)
  - `auth.users` (gestito da Supabase Auth)

---

## Architettura Client (Frontend)

### Entry Point e Layout
- `app/layout.tsx`: Root layout che wrappa tutto con `QueryProvider` (React Query).
- Navbar globale con logout che usa `supabase.auth.signOut()`.

### Pagine Principali
- `app/login/page.tsx`: Form login con Supabase
- `app/register/page.tsx`: Form registrazione con validazione
- `app/incomes/page.tsx`: Lista Entrate con filtri data + CRUD
- `app/expenses/page.tsx`: Lista spese con filtri data + CRUD
- `app/wallets/page.tsx`: Gestione portafogli, toggle default
- `app/category/page.tsx`: Gestione categorie, toggle active
- `app/dashboard/page.tsx`: Dashboard (da implementare con DnD widgets)
- `app/settings/yourbank/page.tsx`: Integrazione banche (GoCardless-like)
- `app/settings/import/page.tsx`: Import transazioni

### Autenticazione e Fetch Centralizzato

**`lib/supabaseClient.ts`**
```
supabase = new SupabaseClient(url, anonKey, {})
```
- Istanza Supabase client-side.
- Token letto da `supabase.auth.getSession().access_token`.

**`lib/api.ts`** (Fetch Helper Centralizzato)
```typescript
apiFetch(path, options, token?)
  → Aggiunge Authorization: Bearer <token>
  → Aggiunge Content-Type: application/json se body presente
  → Chiama fetch(API_URL + path)

bankApiFetch(path, accessToken, options)
  → Simile ad apiFetch, ma usa token diverso (GoCardless)
```

**`lib/constants.ts`**
```typescript
API_URL = process.env.NEXT_PUBLIC_API_URL
```
- Centralizza la base URL del server (es. `https://flow-wise-server.vercel.app`).

### React Query e Caching

**`lib/hooks/useQueries.ts`** (Custom Hooks)

Fornisce hook per ogni risorsa:

**Transactions**
- `useTransactions(startDate?, endDate?)` → GET `/transaction?startDate=&endDate=`
- `useCreateTransaction()` → POST `/transaction`
- `useUpdateTransaction()` → PUT `/transaction/:id`
- `useDeleteTransaction()` → DELETE `/transaction/:id`

**Wallets**
- `useWallets()` → GET `/wallet`
- `useCreateWallet()` → POST `/wallet`
- `useUpdateWallet()` → PUT `/wallet/:id`
- `useDeleteWallet()` → DELETE `/wallet/:id`

**Categories**
- `useCategories()` → GET `/category`
- `useCreateCategory()` → POST `/category`
- `useUpdateCategory()` → PUT `/category/:id`
- `useDeleteCategory()` → DELETE `/category/:id`

**Incomes/Expenses**
- `useIncomes(startDate?, endDate?)` → GET `/income/all?startDate=&endDate=`
- `useExpenses(startDate?, endDate?)` → GET `/expense/all?startDate=&endDate=`

**Configurazione QueryClient** (`lib/providers/QueryProvider.tsx`)
```javascript
staleTime: 60 * 1000          // 1 minuto: cache valida per 1m
gcTime: 5 * 60 * 1000         // 5 minuti: cache stored per 5m
retry: 1                       // retry errori 1 volta
refetchOnWindowFocus: false    // non refetch al focus
```

**Invalidazione Cache**
- Dopo DELETE: invalida `transactions`, `wallets`, `incomes`, `expenses`
- Dopo POST/PUT: invalida la risorsa interessata + `wallets`, `incomes`, `expenses`
- Hook passano `onSuccess` ai dialog (refetch su chiusura)

### Componenti

**`components/dynamic-table.tsx`**
- Tabella generica che accetta array di dati + `renderActions(row)` opzionale.
- Mostra loading state se `isLoading=true`.

**`components/new-transaction.tsx`**
- Drawer con form (description, amount, type I/E, wallet, category, date).
- Carica wallets e categories da React Query al mount.
- Chiama `useCreateTransaction().mutate()` e invalida cache.

**`components/edit-dialog.tsx`**
- AlertDialog per editare transazione.
- Carica dati della transazione, wallets, categories.
- Chiama `useUpdateTransaction().mutate()`.

**`components/delete-dialog.tsx`**
- AlertDialog di conferma.
- Chiama `useDeleteTransaction().mutate()`.

**`components/register-form.tsx`**, **`components/login-form.tsx`**
- Form login/register via fetch diretto (non apiFetch, non autenticato).
- Usa `toast` per errori/successo.

---

## Architettura Server (Backend)

### Entry Point e Middleware

**`server.js`**
- Express app + middleware setup:
  - `express.json({ limit: "10mb" })`
  - CORS middleware (configurable da env)
  - Route mounter
  - 404 handler
  - Global error handler (catch-all)

### CORS Configuration

```javascript
ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || "http://localhost:3000,https://flow-wise-client.vercel.app"
allowedPatterns = [/\.vercel\.app$/]

cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);  // allow non-browser
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (allowedPatterns.some(re => re.test(origin))) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
})
```

### Authentication Middleware

**`config/auth-middleware.js`** (`requireAuth`)
```javascript
async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: "Invalid token" });

  req.user = data.user;  // Attach user to request
  next();
}
```

### Validazione (Zod)

**`utils/schemas.js`** (Zod Schemas)
```javascript
transactionCreateSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().date(),
  category_id: z.number(),
  wallet_id: z.number(),
  // ...
})
```

**`utils/validate.js`** (Middleware)
```javascript
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.flatten() });
    }
    req.validated = result.data;
    next();
  };
}
```

### Async Handler

**`utils/asyncHandler.js`**
```javascript
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```
- Cattura errori async nelle route.

### Route Endpoints

**`routes/user.js`**
- `POST /users/register` (rate-limited, validato, crea user + profilo)
- `POST /users/login` (custom login endpoint)
- `GET /users/:id` (profilo, autenticato)

**`routes/transaction.js`**
- `GET /transaction?startDate=&endDate=` (lista per user, filtrata per date)
- `POST /transaction` (crea, validato)
- `PUT /transaction/:id` (aggiorna, validato)
- `DELETE /transaction/:id` (cancella)

**`routes/income.js`**
- `GET /income/all?startDate=&endDate=` (query Transaction con type=I)

**`routes/expense.js`**
- `GET /expense/all?startDate=&endDate=` (query Transaction con type=E)

**`routes/category.js`**
- `GET /category` (lista categorie per user)
- `GET /category/active` (solo active=true)
- `GET /category/:id` (singola)
- `POST /category` (crea, validato)
- `PUT /category/:id` (aggiorna, validato)
- `DELETE /category/:id` (cancella)

**`routes/wallet.js`**
- `GET /wallet` (lista per user)
- `POST /wallet` (crea, max 3 per user, validato)
- `PUT /wallet/:id` (aggiorna, toggle isdefault, validato)
- `DELETE /wallet/:id` (cancella)

**`routes/bank.js`** (Integrazione banche)
- `POST /bank/token` (pubblico, ottiene token GoCardless)
- `GET /bank/institutions` (pubblico, lista banche)
- `POST /bank/requisition` (protetto, salva requisition)
- `GET /bank/accounts` (protetto, lista conti collegati)
- `GET /bank/transactions` (protetto, scarica transazioni)

---

## Variabili d'Ambiente

### Client (flow-wise-client)
Impostare in Vercel → Settings → Environment Variables

```
NEXT_PUBLIC_API_URL=https://flow-wise-server.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxx...
```

### Server (flow-wise-server)
Impostare in Vercel → Settings → Environment Variables

```
PORT=5030 (locale; Vercel ignora)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxx...
ALLOWED_ORIGINS=https://flow-wise-client.vercel.app,https://*.vercel.app,http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5
```

---

## Flusso in Locale

1. **Avvia il server**
   ```bash
   cd flow-wise-server
   npm run start
   # Ascolta su http://localhost:5030
   # CORS permette http://localhost:3000
   ```

2. **Avvia il client**
   ```bash
   cd flow-wise-client
   npm run dev
   # Corre su http://localhost:3000
   # API_URL punta a http://localhost:5030
   ```

3. **User registra/logga**
   - Form invia dati a `http://localhost:5030/users/register` o `/users/login`.
   - Supabase ritorna JWT.
   - Client lo salva in sessione Supabase (mempool storage).

4. **User naviga a Incomes**
   - `useIncomes(startDate, endDate)` effettua `GET /income/all?startDate=...&endDate=...`.
   - Supabase token inviato via `apiFetch`.
   - Server valida con `requireAuth`, controlla user ID, ritorna transazioni filtrate.
   - React Query caccha il risultato per 1 minuto.

5. **User crea transazione**
   - Click "Add Transaction" → `NewTransaction` drawer apre.
   - Carica wallets/categories da React Query (se cached, istantaneo; altrimenti fetch).
   - Form invia POST a `/transaction` con apiFetch.
   - `useCreateTransaction().mutate()` invalida le query di transactions, wallets, incomes, expenses.
   - `refetch()` passato a `onSuccess` ricarica la lista.

6. **User edita transazione**
   - Click pencil → `EditDialog` si apre.
   - Carica dati dalla transazione (da state locale o fetch).
   - Invia PUT a `/transaction/:id`.
   - `useUpdateTransaction` invalida cache.
   - Dialog chiude, lista si aggiorna.

7. **User cancella transazione**
   - Click trash → `DeleteDialog` chiede conferma.
   - Invia DELETE a `/transaction/:id`.
   - `useDeleteTransaction` invalida cache.
   - Dialogo chiude, lista si ricarica.

---

## Flusso in Produzione (Vercel)

1. **Setup Vercel Projects**
   - Crea due progetti su Vercel: uno per client, uno per server.
   - Collega ai branch GitHub: `main` (o preferito) su entrambi.

2. **Configura Environment Variables**
   - **Client project**:
     - `NEXT_PUBLIC_API_URL` → `https://flow-wise-server.vercel.app`
     - `NEXT_PUBLIC_SUPABASE_URL` → URL Supabase
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon key Supabase
   - **Server project**:
     - `SUPABASE_URL` → URL Supabase
     - `SUPABASE_SERVICE_ROLE_KEY` → service role key Supabase
     - `ALLOWED_ORIGINS` → `https://flow-wise-client.vercel.app,https://*.vercel.app,http://localhost:3000`

3. **Deploy**
   - Push a `main` su entrambi i repo.
   - Vercel automaticamente builda e deploya:
     - Client: builda Next.js, output statico (prerendered) + ISR.
     - Server: copia code, esegue `npm start`, avvia Express su porta 3000 (Vercel standard).

4. **Client Request Flow**
   - Browser visita `https://flow-wise-client.vercel.app`.
   - Vercel serve Next.js statico (HTML, CSS, JS).
   - Client JavaScript carica.
   - User logga via Supabase.
   - Fetch di `/income/all?startDate=...&endDate=...` va a `https://flow-wise-server.vercel.app`.

5. **Preflight CORS**
   - Browser effettua OPTIONS request.
   - Server risponde con `Access-Control-Allow-Origin: https://flow-wise-client.vercel.app`.
   - Browser consente la richiesta GET/POST/PUT/DELETE.

6. **Server Autenticazione**
   - Request contiene `Authorization: Bearer <supabase_token>`.
   - `requireAuth` chiama `supabase.auth.getUser(token)`.
   - Se valido, `req.user` è attaccato; query procede.
   - Dati filtrati per `userid = req.user.id`.

7. **React Query Cache**
   - Dati cachati per 1 minuto (staleTime).
   - Refetch al mount, cambio date range, o invalidazione.
   - Persistenza: locale storage via React Query (opzionale).

---

## Error Handling

### Client
- **API errors**: `apiFetch` rilla exception se `!res.ok`. Componenti catchano e mostrano toast (`sonner`).
- **React Query errors**: mutation error callback mostra `toast.error()`.
- **Form validation**: Componenti validano lato client; server double-check con Zod.

### Server
- **Zod validation**: `validate()` middleware ritorna 400 con errori flattened.
- **Auth errors**: `requireAuth` ritorna 401 se token invalido.
- **Async errors**: `asyncHandler` cattura e passa a global error handler.
- **Global handler**: ultima safety net, ritorna 500 JSON.

---

## Performance & Scalability

### Frontend
- **Code splitting**: Next.js auto lazy-load pagine.
- **React Query**: cache intelligente, evita ridondanti fetch.
- **Static generation**: pagine pubbliche (login, privacy) prerendered.
- **Image optimization**: `next/image` se usato.

### Backend
- **Supabase indexes**: query filter su `userid`, `date`, `type` dovrebbero avere index.
  ```sql
  CREATE INDEX idx_tx_userid_date ON "Transaction"(userid, date DESC);
  CREATE INDEX idx_cat_userid_active ON "Category"(userid, active);
  CREATE INDEX idx_wallet_userid ON "Wallet"(userid);
  ```
- **Rate limiting**: `/register` limitato a 5 request/15min per IP.
- **Validazione**: Zod early-reject input invalidi.

---

## Deploy Checklist

- [ ] `.env.local` locale **non** committato (aggiungi a `.gitignore`).
- [ ] Variabili d'ambiente salvate in Vercel per entrambi i progetti.
- [ ] Server `ALLOWED_ORIGINS` include client URL.
- [ ] Supabase RLS policies configurate (user può leggere/scrivere solo i propri dati).
- [ ] Build locale passa: `npm run build` su entrambi.
- [ ] Test login/transazioni in ambiente locale.
- [ ] Push a `main`, verifica deploy Vercel, test su produzione.

---

## Prossimi Step (Future Enhancements)

1. **Dashboard Drag-and-Drop**: Widget system con react-beautiful-dnd.
2. **Grafici avanzati**: Breakdown per categoria, trend, forecast.
3. **Mobile app**: React Native o Flutter.
4. **Offline mode**: Service Worker + sync.
5. **Bank auto-sync**: Webhook GoCardless per transazioni real-time.
6. **Notifications**: Email/push per budget exceeded.
7. **Multi-currency**: Conversione real-time, storage per valuta.
