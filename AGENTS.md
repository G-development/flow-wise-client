# flow-wise-client

Frontend Next.js 15 (App Router, React 19, TypeScript, Tailwind + shadcn/ui) di Flow-Wise, l'app di
finanza personale di Gio. È una metà di un progetto su due repo: l'altra è `~/Projects/flow-wise-server`.

Questo file viene letto automaticamente quando la sessione gira **dentro** questo repo: la catena è dal
git root fino alla cwd, quindi vale anche da una sottocartella (verificato sul sorgente:
`_agents_md_directory_chain` in `agent/prompt_builder.py`). Per ogni cartella vince il primo nome non
vuoto tra `AGENTS.override.md`, `AGENTS.md` e `agents.md`, e le sezioni si fondono root → cwd.

Hermes carica **un solo tipo** di file di contesto, in quest'ordine di priorità: `.hermes.md` →
`AGENTS.md` → `CLAUDE.md` → `.cursorrules`. Quindi **non aggiungere anche un `.hermes.md`** qui:
vincerebbe lui e questo file diventerebbe peso morto che deriva in silenzio. Per vedere cosa è davvero
caricato c'è `/context` in sessione.

## Dove sta la verità — non duplicarla qui

| Cosa | Dove |
| --- | --- |
| Architettura, data model, limiti noti, stato, workflow multi-agente, push gate | skill **`flow-wise`** — caricala prima di lavorare |
| Indice file-per-file (route, componente, export) | `CODE_MAP.md` in questo repo |
| Architettura e "stato verificato e limiti noti" | `APP_ARCHITECTURE.md` |
| Chiamate dal client, route consumate, caching | `API_STRUCTURE.md` |
| Widget e griglia della dashboard | `DASHBOARD_STRUCTURE.md` |

Se una regola vale per entrambi i repo, sta nella skill; qui solo ciò che è locale a questo.

## Convenzioni del repo

- App Router: il percorso della cartella è l'URL (`app/wallets/page.tsx` → `/wallets`). I componenti
  accanto a una pagina ma senza `page.tsx` non sono route (es. `app/settings/yourbank/BankDrawer.tsx`).
- Dati server via TanStack Query: gli hook stanno in `lib/hooks/useQueries.ts`, le chiavi in
  `queryKeys`. Una mutazione che cambia una lista deve invalidare la sua chiave.
- Le liste arrivano nell'envelope `{ data, count, truncated, total }`: si legge con
  `lib/listResponse.ts` (`parseListResponse`, `EMPTY_LIST_RESPONSE`), non a mano.
- Le chiamate HTTP passano da `lib/api.ts` (`apiFetch`, `buildQuery`, `getAuthToken`).
- Importi: `amount` è **sempre >= 0** e il segno lo decide `type` (`"I"` / `"E"`). Le funzioni stanno in
  `lib/amount.ts`; la validazione dell'input in `lib/amountInput.ts`.
- `components/ui/*` è shadcn/ui generato: si tocca solo per scelta esplicita, non per rifiniture di
  passaggio.

## Verifica prima di affermare

```bash
npm test              # rm -rf .next && node --test && npx tsc --noEmit && next build
npx tsc --noEmit      # solo i tipi, quando il build intero è eccessivo
npx eslint <file>     # mirato: `next build` esegue anche ESLint, un errore di lint lo fa fallire
```

Attenzione al caso noto: un `@typescript-eslint/no-explicit-any` in un file toccato rende `next build`
rosso anche quando `tsc --noEmit` passa.

## Guardrail

- **Push gated**: `.githooks/pre-push` rifiuta il push finché non esiste un'approvazione per lo **SHA
  esatto**. Autorizza Gio; l'agente non approva mai da solo. Un commit nuovo riapre il gate.
- `app/incomes/page.tsx` e `app/expenses/page.tsx` sono ancora quasi identici: **ogni fix va applicato
  due volte** finché non vengono deduplicati.
- `app/settings/page.tsx` scrive la tabella `Profile` dal browser con la chiave anon: dipende dalle RLS
  e fallisce in silenzio se non configurate. La scrittura appartiene al server.
