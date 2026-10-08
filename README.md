# Flow Wise Client

Frontend del money tracker Flow Wise, realizzato con Next.js App Router (Next.js 15), React 19,
TypeScript, Tailwind CSS, TanStack Query e autenticazione Supabase.

## Funzionalità

- **Autenticazione**: Registrazione, login, recupero e reset password via email con token temporaneo.
- **Dashboard Personalizzabile**: Griglia widget interattiva (saldo totale, entrate, spese, confronto entrate/uscite, grafico a torta per categoria) con supporto drag & drop, resize e salvataggio persistente del layout per utente.
- **Gestione Finanziaria**: Pagine dedicate per entrate (`/incomes`), spese (`/expenses`), wallet (`/wallets`) e categorie (`/category`).
- **Importazione CSV**: Caricamento massivo e parsing automatico di file CSV di transazioni.
- **Integrazione Bancaria Completa (`/settings/yourbank`)**:
  - Connessione a conti bancari reali tramite **Open Banking PSD2 (GoCardless)** o in modalità **Sandbox Mock interattiva**.
  - Visualizzazione e sincronizzazione automatica dei movimenti.
  - **Filtro del periodo transazioni** (con default dal 1° del mese corrente a oggi e preset rapidi).
  - **Selezione massiva e importazione** guidata delle transazioni bancarie nei propri Wallet e Categorie.
- **AI Beta (`/ai-beta`)**: Interfaccia di chat per interrogare l'agente intelligente di analisi delle spese.
- **Design & UX**: Interfaccia moderna responsive, supporto dark/light theme, notifiche toast con Sonner.

## Struttura

```text
app/                  Route Next.js e pagine
  ai-beta/            Chat di prova per l'agente delle spese
  dashboard/          Dashboard e griglia widget
  incomes/            Gestione entrate
  expenses/           Gestione spese
  wallets/            Gestione wallet e conti
  category/           Gestione categorie
  settings/           Profilo, import CSV e integrazione bancaria
components/           Componenti condivisi, navbar e primitive UI
lib/                  Client Supabase, API wrapper, hook e provider
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

## Documentazione

- [API Structure](./API_STRUCTURE.md): chiamate client, route backend, caching e payload.
- [Architettura](./APP_ARCHITECTURE.md): struttura del frontend e del backend, layout e flussi di dati.
- [Dashboard](./DASHBOARD_STRUCTURE.md): widget, griglia e persistenza layout.
