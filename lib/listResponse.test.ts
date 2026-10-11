/**
 * Test di `lib/listResponse.ts`.
 *
 * Il modulo e' JS puro senza React e senza path alias `@/`: e' un test di
 * regressione sull'envelope delle liste, cioe' il punto in cui il client decide
 * se una somma calcolata su `rows` e' definitiva o parziale (`truncated`).
 *
 * Esecuzione: `npm test` (in catena con tsc + next build). Import con estensione
 * `.ts` esplicita perche' la scoperta dei test usa il type stripping di Node, non
 * un bundler: gli alias `@/` e gli import senza estensione non si risolvono qui.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  EMPTY_LIST_RESPONSE,
  parseListResponse,
  type ListResponse,
} from "./listResponse.ts";

test("parseListResponse legge l'envelope dichiarato dal server", () => {
  const payload = { data: [{ id: "a" }, { id: "b" }], count: 2, truncated: true, total: 1315 };
  const result = parseListResponse<{ id: string }>(payload);

  assert.deepEqual(result.rows, [{ id: "a" }, { id: "b" }]);
  assert.equal(result.count, 2);
  assert.equal(result.truncated, true);
  assert.equal(result.total, 1315);
});

test("parseListResponse non marca come troncato un set completo", () => {
  const result = parseListResponse<number>({ data: [1, 2, 3], count: 3, truncated: false, total: 3 });

  assert.equal(result.truncated, false);
  assert.equal(result.total, 3);
  assert.deepEqual(result.rows, [1, 2, 3]);
});

test("parseListResponse rispetta rowsKey diverso da 'data' (/bank/transactions)", () => {
  const payload = { transactions: [{ id: "t1" }], count: 1, truncated: false, total: 1 };
  const result = parseListResponse<{ id: string }>(payload, "transactions");

  assert.deepEqual(result.rows, [{ id: "t1" }]);
  assert.equal(result.count, 1);
});

test("parseListResponse accetta l'array nudo (forma precedente al contratto)", () => {
  const result = parseListResponse<number>([10, 20]);

  assert.deepEqual(result.rows, [10, 20]);
  assert.equal(result.count, 2);
  // Un array nudo non dichiara nulla: il troncamento resta una responsabilita' del server.
  assert.equal(result.truncated, false);
  assert.equal(result.total, null);
});

test("parseListResponse rifiuta payload non validi invece di nasconderli come liste vuote", () => {
  for (const payload of [null, undefined, "errore", 42, {}, { data: "not an array" }]) {
    assert.throws(() => parseListResponse(payload), /Invalid list response/);
  }
});

test("parseListResponse rifiuta metadati incoerenti", () => {
  assert.throws(
    () => parseListResponse({ data: [1, 2, 3], count: "3" }),
    /count must match/
  );
  assert.throws(
    () => parseListResponse({ data: [1], count: 1, truncated: "false" }),
    /truncated must be a boolean/
  );
  assert.throws(
    () => parseListResponse({ data: [1], count: 1, total: "molte" }),
    /total must be a non-negative integer/
  );
});

test("EMPTY_LIST_RESPONSE e' assegnabile a ListResponse<T> e resta vuoto", () => {
  const empty: ListResponse<{ id: string }> = EMPTY_LIST_RESPONSE;

  assert.deepEqual(empty.rows, []);
  assert.equal(empty.count, 0);
  assert.equal(empty.truncated, false);
  assert.equal(empty.total, null);
});
