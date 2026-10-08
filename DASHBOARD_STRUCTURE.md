# Dashboard e widget

La dashboard è implementata in `app/dashboard/page.tsx`; il modello dati e la
validazione della griglia sono in `lib/types/dashboard.ts`. Il renderer sceglie
un componente in base a `widget.type`.

## Widget supportati

- `total-balance`: somma dei saldi di tutti i wallet dell'utente.
- `period-incomes`: totale delle entrate nell'intervallo di date selezionato.
- `period-expenses`: totale delle spese nell'intervallo di date selezionato.
- `income-vs-expenses`: confronto dei totali e differenza netta tra entrate e spese.
- `expense-breakdown`: grafico a torta e legenda delle spese raggruppate per categoria.

Il layout iniziale include solo saldo totale e entrate del periodo. Il provider
globale delle date parte dal primo giorno del mese corrente a oggi; i widget
periodali usano l'intervallo condiviso oppure, quando non fornito, gli ultimi
30 giorni. La valuta visualizzata nei widget è EUR.

## Aggiornamento e Reattività

Quando nuovi movimenti vengono aggiunti manualmente, importati via CSV (`/settings/import`) o importati dal conto bancario (`/settings/yourbank`), la cache TanStack Query viene invalidata automaticamente, aggiornando in tempo reale tutti i widget della dashboard e i saldi dei wallet.

## Griglia e modifiche

Su desktop la griglia usa 4 colonne × 3 righe. `isValidPosition` verifica che
un widget resti entro i limiti e non si sovrapponga agli altri. In modalità
edit si possono trascinare, ridimensionare tramite i preset `1 × 1`, `2 × 1`
e `2 × 2`, rimuovere e aggiungere widget. L'aggiunta cerca il primo spazio
libero `2 × 1`; il dialogo non filtra i tipi già presenti. Su mobile i widget
sono disposti in una colonna e drag/resize sono disabilitati.

Il layout utente viene letto da `GET /dashboard-layout` e salvato con
`PUT /dashboard-layout`. Gli spostamenti, ridimensionamenti, aggiunte e
rimozioni salvano tramite `useSaveDashboardLayout`; il pulsante Done salva
il layout corrente. L'API usa la tabella Supabase `dashboard_layouts`.

## Componenti principali

- `components/dashboard/dashboard-grid.tsx`: griglia, interazione dnd-kit,
  resize e rimozione.
- `components/dashboard/draggable-widget.tsx`: wrapper trascinabile.
- `components/dashboard/widget-renderer.tsx`: selezione del componente widget.
- `components/dashboard/add-widget-dialog.tsx`: selezione e posizionamento
  automatico di widget.
- `components/dashboard/widgets/`: implementazioni dei cinque widget.
- `lib/hooks/useQueries.ts`: query layout e mutation di salvataggio.

Le date condivise con le pagine Entrate e Spese provengono da
`DateRangeProvider`; il layout dei widget è invece specifico per utente.
