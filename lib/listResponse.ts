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

  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid list response: expected an array or response object");
  }

  const body = payload as Record<string, unknown>;
  const raw = body[rowsKey];
  if (!Array.isArray(raw)) {
    throw new Error(`Invalid list response: "${rowsKey}" must be an array`);
  }

  const count = body.count === undefined ? raw.length : body.count;
  if (
    typeof count !== "number" ||
    !Number.isSafeInteger(count) ||
    count < 0 ||
    count !== raw.length
  ) {
    throw new Error("Invalid list response: count must match the number of rows");
  }

  const truncated = body.truncated === undefined ? false : body.truncated;
  if (typeof truncated !== "boolean") {
    throw new Error("Invalid list response: truncated must be a boolean");
  }

  const total = body.total === undefined || body.total === null ? null : body.total;
  if (
    total !== null &&
    (typeof total !== "number" || !Number.isSafeInteger(total) || total < 0)
  ) {
    throw new Error("Invalid list response: total must be a non-negative integer or null");
  }

  return {
    rows: raw as T[],
    count,
    truncated,
    total,
  };
}
