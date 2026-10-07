# Flow Wise Client

Frontend del money tracker Flow Wise, realizzato con Next.js App Router, React,
TypeScript, Tailwind CSS e autenticazione Supabase.

## Funzionalità

- Autenticazione e registrazione; sono presenti anche le pagine di recupero
  password (vedi la nota sulle route pubbliche in [Architettura](./APP_ARCHITECTURE.md)).
- Dashboard configurabile con widget per saldo, entrate, spese e grafici.
- Pagine per entrate, spese, wallet e categorie.
- Importazione CSV delle transazioni.
- Integrazione bancaria in beta, disponibile dalla pagina Your Bank.
- Pagina **AI Beta** per interrogare l'agente di analisi delle spese. Ogni
  messaggio invia la domanda e il periodo selezionato al backend; la cronologia
  è solo locale alla pagina e non costituisce una conversazione persistente.
- Layout responsive con navigazione mobile.

## Struttura

```text
app/                  Route Next.js e pagine
  ai-beta/            Chat di prova per l'agente delle spese
  dashboard/          Dashboard e widget
  settings/            Profilo, import e integrazione bancaria
components/            Componenti condivisi e primitive UI
lib/                   Client Supabase, API, hook e provider
public/                Asset statici
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

Per l'agente AI configura `LLM_API_KEY` sul **server**, non qui. Le transazioni
del periodo richiesto vengono inviate dal backend al provider configurato.

## Avvio e controlli

```bash
npm install
npm run dev
```

Per compilare per la produzione:

```bash
npm run build
```

La base URL predefinita locale del client è `http://localhost:5030` solo se
impostata in `.env.local`; anche il frontend e il server devono essere avviati
separatamente.

## Documentazione

- [API Structure](./API_STRUCTURE.md): chiamate client, route backend e caching.
- [Architettura](./APP_ARCHITECTURE.md): struttura e flussi applicativi.
- [Dashboard](./DASHBOARD_STRUCTURE.md): widget, griglia e persistenza layout.
