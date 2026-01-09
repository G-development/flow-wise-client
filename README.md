# Flow Wise - Client 

## Descrizione
Frontend part of Flow-Wise project - Money tracker.
Created with React + Next.js

## Tech

- **Next.js** 
- **Tailwind CSS** 
- **Sonner** 
- **ShadCN/UI** 

## Features
- Dashboard con drag & drop, modalità edit/view e salvataggio layout per utente
- Widget pronti: saldo totale, entrate periodo, spese periodo, income vs expenses, breakdown spese per categoria
- Legenda widget “Spese per categoria” scrollabile + tooltip con nome categoria e importo
- Tabelle entrate/spese con filtri per data, badge categoria/portafoglio e azioni inline
- Gestione wallet con default singolo e formattazione EUR
- Autenticazione Supabase, toast di stato e layout responsive mobile-first
- Navbar mobile modernizzata (app bar + bottom nav) coerente con lo stile
- Date range condiviso tra Dashboard/Incomes/Expenses (ripristino al mese corrente al reload)
- Drawer “New Transaction” migliorato: selettore tipo con icone, scrollabile su mobile, categorie attive

## Structure

```
flow-wise-client/
├── app/
	└── dashboard/
	└── login/
	└── register/
├── components/
	└── ui/
├── lib/
├── utils/
├── public/
└── styles/
```

## Env config

Create a `.env.local` in the project root, in which at least you should have this:

```
NEXT_PUBLIC_API_URL=http://localhost:5030/
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_ANON_KEY
```

Notes:
- The client must use the publishable anon key only.
- The server uses the legacy service_role key (eyJ…) to bypass RLS.

## Quick start

```bash
# from flow-wise-client/
npm install
npm run dev
```

Open http://localhost:3000 and ensure the server is reachable at `NEXT_PUBLIC_API_URL`.

## Scripts

- `dev`: start Next.js dev server (Turbopack)
- `build`: production build
- `start`: run production build
- `lint`: run ESLint

## Troubleshooting

- CORS error: ensure server `ALLOWED_ORIGINS` includes `http://localhost:3000`.
- Empty data: verify you are logged in (Supabase session) and the server uses the legacy `service_role` key.
- 401 Unauthorized: the client attaches `Authorization: Bearer <supabase_access_token>`; ensure the token is valid and time-synced.

## Deployment

Deployed using Vercel at [Flow Wise (Client)](https://flow-wise-client.vercel.app/)