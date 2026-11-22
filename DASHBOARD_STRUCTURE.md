# Dashboard

Dal 16/11/2026 la dashboard è una **pagina fissa** (deciso con Gio: la griglia personalizzabile con
drag & drop, resize e layout salvato è stata tolta). È in `app/dashboard/page.tsx`; i calcoli sono
funzioni pure in `lib/dashboard.ts` (con test), i periodi in `lib/period.ts` (con test).

## Ordine dall'alto

1. **Titolo e periodo**: lo stesso selettore di Movements (`components/period-picker.tsx`: This month,
   Last month, Last 3 months, All time, Custom…), condiviso tramite `DateRangeProvider`. Sotto il
   titolo l'etichetta del periodo ("1–15 Nov", "27 Oct – 15 Nov"). Da `lg` il pulsante "Add Transaction".
2. **Total Balance** (`components/dashboard/total-balance.tsx`): conti | salvadanai affiancati, il
   dettaglio al tocco. Per un conto collegato conta il saldo letto dalla banca (`GET /bank/connections`),
   deciso da Gio l'11/11/2026; nel dettaglio la riga mostra l'ora della lettura e, se diverso, il saldo
   calcolato dall'app. Per gli altri wallet il saldo è derivato dal server (`utils/walletService.js`).
   Non dipende dal periodo. Calcolo in centesimi in `lib/balanceBreakdown.ts`.
3. **To fix** (`to-fix.tsx`): compare solo se c'è qualcosa **nel periodo scelto** (scelta di Gio):
   trasferimenti da assegnare (`pendingTransfersIn`, link a `/movements`) e movimenti in una categoria
   da sistemare (`isReviewCategory`, link a `/category?review=1`, che apre "To review").
4. **This month so far / This period** (`period-summary.tsx`): entrate, spese e netto con la variazione
   rispetto al periodo di confronto (`comparisonRange`): con "This month" lo stesso punto del mese
   prima (stessi giorni dall'inizio), con "Last month" il mese prima ancora, con un periodo a mano
   quello subito prima della stessa lunghezza; "All time" non ha confronto. Il netto mostra la
   differenza in euro.
5. **Coming up** (`coming-up.tsx`): quanto mettere da parte questo mese in ogni salvadanaio
   (`suggestedMonthlyCents` di `GET /annual-plan`) e le prossime 4 rate non pagate del piano annuale,
   prima le scadute (`upcomingDues`). Parte sempre da oggi e resta a **mesi di calendario** come il
   piano, qualunque periodo sia scelto. Senza salvadanai non compare.
6. **Where the money goes** (`category-spending.tsx`): spese nette per categoria (i rimborsi le
   riducono), dalla più alta, barre nel colore della categoria (`lib/categoryStyle.tsx`) e la
   variazione sul confronto ("new" se prima non c'era); le prime 6, poi "Show all".
7. **Spending pace** (`spending-pace.tsx`): spese cumulate giorno per giorno contro il periodo
   precedente (con "This month" tutto il mese scorso, tratteggiato), con la frase "X € more/less than
   last month at this point". Non compare per "All time" o per periodi oltre 92 giorni.

Niente ultimi movimenti (stanno in Movements, nella barra in basso).

## Inizio del mese

L'utente sceglie il giorno in cui parte il suo mese (1–31), salvato dal server nel JSON
`Profile.settings.monthStartDay` (`GET`/`PUT /users/settings`, nessuna migrazione). Nei mesi più
corti si usa l'ultimo giorno disponibile (con 31, novembre parte il 30). Vale per **tutta l'app**:
"This month", "Last month" e "Last 3 months" in dashboard e in Movements; il piano annuale resta a
mesi di calendario.

- **Primo accesso** (`components/month-start/month-start-gate.tsx`, montato nella navbar): finché
  `monthStartDay` è null — anche per chi aveva già un account — compare una finestra che non si chiude
  senza scegliere ("On the 1st" è già selezionato). Il tour dei nuovi account parte dopo questa scelta.
- **Settings → Preferences → Start of the month** (`components/settings/month-start-setting.tsx`).
- `DateRangeProvider` tiene la **scorciatoia** scelta, non le date: quando arriva il giorno di
  inizio, "This month" si ricalcola da solo. Le date scelte a mano restano tali e quali ("custom").

## Aggiornamento

Le sezioni leggono `GET /transaction/all` con le date (`useMovements`, per il periodo e per quello di
confronto), i trasferimenti (`useTransfers`), le categorie, i wallet e i piani annuali. Ogni scrittura
su una transazione invalida la chiave `transactions`, quindi la dashboard si aggiorna senza ricaricare.

## Layout salvato: tolto

`GET`/`PUT /dashboard-layout` e la tabella `dashboard_layouts` della vecchia griglia sono stati tolti il
22/11/2026 (migrazione 019 del server).
