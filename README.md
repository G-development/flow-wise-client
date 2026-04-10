# Flow Wise - Client

## Descrizione
Frontend di Flow-Wise, un money tracker con dashboard, gestione transazioni, wallet e analisi categorie.
Realizzato con Next.js 15, Tailwind CSS e Supabase Auth.

## Tech

- Next.js 15
- TypeScript
- Tailwind CSS
- ShadCN/UI
- Supabase Auth
- React Query
- Recharts
- Papaparse per import CSV
- Sonner per notifiche toast

## Feature principali

- Dashboard con widget drag & drop e modalita edit/view
- Layout dashboard salvato per utente
- Grafici e breakdown spese per categoria
- Date range condiviso tra Dashboard, Incomes e Expenses
- Pagine Incomes, Expenses e Wallet con filtri, tabelle e azioni inline
- Import CSV transazioni con validazione e feedback
- Autenticazione Supabase e sessione utente
- Mobile-first responsive design con bottom navigation

## Struttura del progetto

```
flow-wise-client/
├── app/               # pagine e layout Next.js
│   ├── dashboard/
│   ├── incomes/
│   ├── expenses/
│   ├── wallets/
│   ├── settings/
│   ├── login/
│   ├── register/
│   └── ...
├── components/        # componenti riutilizzabili e UI primitives
│   ├── ui/
│   └── ...
├── lib/               # client Supabase, hook e utility
├── styles/            # stili globali
└── public/            # asset statici
```

## Configurazione ambiente

Crea un file `.env.local` nella root del progetto con almeno queste variabili:

```env
NEXT_PUBLIC_API_URL=http://localhost:5030
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Note:
- Il client usa solo la anon key pubblicabile.
- Il backend deve usare la SUPABASE_SERVICE_ROLE_KEY per bypassare le RLS.

## Avvio locale

```bash
cd flow-wise-client
npm install
npm run dev
```

Apri http://localhost:3000 e verifica che il server sia raggiungibile su NEXT_PUBLIC_API_URL.

## Script disponibili

- npm run dev — avvia Next.js in sviluppo (Turbopack)
- npm run build — genera il build di produzione
- npm run start — esegue il build in produzione
- npm run lint — esegue ESLint

## Risoluzione problemi

- CORS: verifica che il backend includa http://localhost:3000 in ALLOWED_ORIGINS.
- Dati non visibili: assicurati di essere autenticato e che il token Supabase sia valido.
- Import CSV: usa colonne coerenti con il formato del progetto e formato data supportato.

## Deployment

Questa app e pronta per Vercel. Assicurati che NEXT_PUBLIC_API_URL punti al backend di produzione.
