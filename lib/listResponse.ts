/**
 * Lettura dell'envelope delle liste.
 *
 * Il server (flow-wise-server, `utils/paginatedSelect.js` -> `toListResponse`)
 * risponde agli endpoint di lista con:
 *
 * ```json
 * { "data": [ ...righe... ], "count": 1000, "truncated": false, "total": 1315 }
 * ```
 *
 * `GET /bank/transactions` è l'unica eccezione e mantiene la chiave `transactions`
 * al posto di `data` (si legge passando `rowsKey`). `truncated` è `true` quando il
 * set è stato tagliato al tetto di paginazione: in quel caso le somme calcolate su
 * `rows` sono parziali e non vanno mostrate come un totale definitivo.
 */

export interface ListResponse<T> {
  /** Le righe effettivamente ricevute. */
  rows: T[];
  /** Righe presenti nella risposta (`rows.length` secondo il contratto). */
  count: number;
  /** `true` quando il set è stato tagliato: le somme su `rows` sono parziali. */
  truncated: boolean;
  /** Righe totali del range secondo il database; `null` se non dichiarate. */
  total: number | null;
}

/**
 * Valore di default per i consumer mentre la query è in corso o in errore.
 * Assegnabile a qualunque `ListResponse<T>`.
 */
export const EMPTY_LIST_RESPONSE: ListResponse<never> = {
  rows: [],
  count: 0,
  truncated: false,
  total: null,
};

/**
 * Normalizza la risposta di un endpoint di lista.
 *
 * Accetta anche la forma precedente al contratto (array nudo, usata da
 * `/income/all`, `/expense/all` e `/transaction/all` fino all'allineamento dei
 * due repo): un array nudo non dichiara nulla, quindi non è marcato come
 * troncato — la dichiarazione è responsabilità del server.
 */
export function parseListResponse<T>(
  payload: unknown,
  rowsKey: string = "data"
): ListResponse<T> {
  if (Array.isArray(payload)) {
    return {
      rows: payload as T[],
      count: payload.length,
      truncated: false,
      total: null,
    };
  }

  const body: Record<string, unknown> =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};

  const raw = body[rowsKey];
  const rows = Array.isArray(raw) ? (raw as T[]) : [];

  return {
    rows,
    count: typeof body.count === "number" ? body.count : rows.length,
    truncated: body.truncated === true,
    total: typeof body.total === "number" ? body.total : null,
  };
}
