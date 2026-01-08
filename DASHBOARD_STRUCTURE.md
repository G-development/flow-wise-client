> ⚠️ **Generato con IA** - Questo documento è stato generato utilizzando GitHub Copilot

# Dashboard & dnd-kit: Struttura

Questo documento riassume l'implementazione della dashboard drag & drop basata su dnd-kit (griglia 4×3, widget configurabili, layout salvato per utente).

## Componenti e Tipi Principali
- Tipi: [lib/types/dashboard.ts](lib/types/dashboard.ts) → `Widget`, `WidgetPosition`, `DashboardLayout`, `DEFAULT_LAYOUT`, `GRID_COLS/ROWS`, helper `isValidPosition` (collisioni e bounds).
- Griglia: [components/dashboard/dashboard-grid.tsx](components/dashboard/dashboard-grid.tsx) → DndContext + PointerSensor, griglia CSS 4×3, drag overlay, validazione collisioni, callback `onLayoutChange`.
- Draggable wrapper: [components/dashboard/draggable-widget.tsx](components/dashboard/draggable-widget.tsx) → set di attributi dnd-kit, posizionamento via `gridColumn`/`gridRow`, cursor grab.
- Renderer widget: [components/dashboard/widget-renderer.tsx](components/dashboard/widget-renderer.tsx) → switch su `widget.type`.
- Widget base:
  - Balance: [components/dashboard/widgets/total-balance-widget.tsx](components/dashboard/widgets/total-balance-widget.tsx) (somma wallets via `useWallets`).
  - Incomes periodo: [components/dashboard/widgets/period-incomes-widget.tsx](components/dashboard/widgets/period-incomes-widget.tsx) (ultimi 30 giorni via `useIncomes`).

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
  - `DashboardGrid` per drag & drop; `onLayoutChange` salva via `useSaveDashboardLayout`.
  - Messaggio di fallback se `widgets.length === 0` (debug), loading spinner su fetch.

## dnd-kit: Scelte Implementative
- Sensor: `PointerSensor` con `activationConstraint.distance = 8` (evita drag accidentali).
- Collision: `closestCenter` + validazione custom `isValidPosition` (no collisioni, rispetto bounds griglia 4×3).
- Grid sizing: CSS `gridTemplateColumns/Rows`, overlay semi-trasparente durante il drag.

## Default Layout
- `DEFAULT_LAYOUT` (2 widget):
  - `total-balance` @ (x:0,y:0,w:2,h:1)
  - `period-incomes` @ (x:2,y:0,w:2,h:1)

## Note Operative
- Server deve essere attivo su `http://localhost:5030` per caricare wallets/incomes/layout.
- In produzione, `NEXT_PUBLIC_API_URL` deve puntare al backend corretto.
- Se manca un record layout per l’utente, il client usa il default e salva al primo drag.
