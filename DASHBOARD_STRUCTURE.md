> ⚠️ **Generato con IA** - Questo documento è stato generato utilizzando GitHub Copilot

# Dashboard & dnd-kit: Struttura

Questo documento riassume l'implementazione della dashboard drag & drop basata su dnd-kit (griglia 4×3, widget configurabili, layout salvato per utente).

## Componenti e Tipi Principali
- Tipi: [lib/types/dashboard.ts](lib/types/dashboard.ts) → `Widget`, `WidgetPosition`, `DashboardLayout`, `DEFAULT_LAYOUT`, `GRID_COLS/ROWS`, helper `isValidPosition` (collisioni e bounds).
- Griglia: [components/dashboard/dashboard-grid.tsx](components/dashboard/dashboard-grid.tsx) → DndContext + PointerSensor, griglia CSS 4×3, drag overlay, validazione collisioni, callback `onLayoutChange`, toggle edit/view (bordo dashed in edit, invisibile in view) e pulsante remove in edit.
- Draggable wrapper: [components/dashboard/draggable-widget.tsx](components/dashboard/draggable-widget.tsx) → set di attributi dnd-kit, posizionamento via `gridColumn`/`gridRow`, cursor grab.
- Renderer widget: [components/dashboard/widget-renderer.tsx](components/dashboard/widget-renderer.tsx) → switch su `widget.type`.
- Dialog aggiunta: [components/dashboard/add-widget-dialog.tsx](components/dashboard/add-widget-dialog.tsx) → pulsante “+” in edit mode per aggiungere widget mancanti con posizionamento automatico.
- Widget disponibili:
  - Balance: [components/dashboard/widgets/total-balance-widget.tsx](components/dashboard/widgets/total-balance-widget.tsx) (somma wallets via `useWallets`).
  - Entrate periodo: [components/dashboard/widgets/period-incomes-widget.tsx](components/dashboard/widgets/period-incomes-widget.tsx) (range date o ultimi 30 giorni via `useIncomes`).
  - Spese periodo: [components/dashboard/widgets/period-expenses-widget.tsx](components/dashboard/widgets/period-expenses-widget.tsx) (range date o ultimi 30 giorni via `useExpenses`).
  - Income vs Expenses: [components/dashboard/widgets/income-vs-expenses-widget.tsx](components/dashboard/widgets/income-vs-expenses-widget.tsx) (barre proporzionali e bilancio).
  - Expense Breakdown: [components/dashboard/widgets/expense-breakdown-widget.tsx](components/dashboard/widgets/expense-breakdown-widget.tsx) (torta per categoria con legenda e totale, tooltip con categoria+importo, legenda scrollabile).

### Aggiornamenti UI recenti
- Dialog “Add Widget” con icone per tipo e layout responsivo su mobile.
- Legenda del widget “Spese per categoria” scrollabile per evitare overflow.
- Tooltip del widget mostra categoria e importo formattato.
- Date range condiviso via provider tra le pagine principali.

## API & Persistenza Layout
- Endpoint backend: [flow-wise-server/routes/dashboard-layout.js](../flow-wise-server/routes/dashboard-layout.js)
  - `GET /dashboard-layout` → restituisce layout utente (altrimenti `{ widgets: [] }`).
  - `PUT /dashboard-layout` → upsert del layout (unique per `user_id`).
- Tabella Supabase: `dashboard_layouts` (user_id UNIQUE, widgets JSONB, RLS attive, trigger updated_at). Migration già eseguita manualmente.
- Hook React Query: [lib/hooks/useQueries.ts](lib/hooks/useQueries.ts)
  - `useDashboardLayout()` (query key `dashboard-layout`).
  - `useSaveDashboardLayout()` (mutation con invalidation + toast).

## Pagina Dashboard
- [app/dashboard/page.tsx](app/dashboard/page.tsx)
  - Carica layout via `useDashboardLayout`; se vuoto, usa `DEFAULT_LAYOUT` (2 widget di default).
  - Stato `widgets` locale con init idempotente (`initialized`).
  - Modalità view/edit: in edit si abilitano drag, resize menu, rimozione widget e pulsante “+” per aggiungere widget; in view drag disabilitato e UI pulita.
  - `DashboardGrid` per drag & drop; `onLayoutChange` salva via `useSaveDashboardLayout`; `handleSaveEdit` chiude edit e persiste.
  - Date range picker condiviso per widget che supportano il filtro.
  - Messaggio di fallback se `widgets.length === 0`, loading spinner su fetch.

## dnd-kit: Scelte Implementative
- Sensor: `PointerSensor` con `activationConstraint.distance = 8` (evita drag accidentali).
- Collision: `closestCenter` + validazione custom `isValidPosition` (no collisioni, rispetto bounds griglia 4×3).
- Grid sizing: CSS `gridTemplateColumns/Rows`, overlay semi-trasparente durante il drag.

## Default Layout
- `DEFAULT_LAYOUT` (2 widget):
  - `total-balance` @ (x:0,y:0,w:2,h:1)
  - `period-incomes` @ (x:2,y:0,w:2,h:1)
  - Gli altri widget possono essere aggiunti dall’utente via dialog “+” in edit mode; posizionamento automatico cerca lo slot libero più vicino (2x1).

## Note Operative
- Server deve essere attivo su `http://localhost:5030` per caricare wallets/incomes/layout.
- In produzione, `NEXT_PUBLIC_API_URL` deve puntare al backend corretto.
- Se manca un record layout per l’utente, il client usa il default e salva al primo drag.
