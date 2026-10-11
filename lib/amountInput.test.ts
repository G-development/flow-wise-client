/**
 * Test di `lib/amountInput.ts`: il guard dell'importo nelle form di transazione.
 *
 * Blocca l'invio di un `amount` negativo dalla form di creazione e da quella di
 * modifica. Il segno lo porta il selettore Income/Expense (`type`): un negativo
 * digitato a mano e' un errore dell'utente da **fermare**, non da normalizzare
 * con `Math.abs`, perche' una correzione silenziosa nasconderebbe l'errore e
 * cambierebbe il dato che l'utente crede di aver inserito.
 *
 * E' la barriera lato client della stessa invariante che il server impone in
 * `utils/schemas.js` (commit dccb2c3): se il guard non bloccasse, il 400 del
 * server arriverebbe comunque al toast (vedi `lib/httpError.ts`).
 *
 * Esecuzione: `npm test`. Import con estensione `.ts` esplicita (type stripping di Node).
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  AMOUNT_NEGATIVE_MESSAGE,
  AMOUNT_NOT_A_NUMBER_MESSAGE,
  checkAmountInput,
} from "./amountInput.ts";

test("checkAmountInput rifiuta un importo negativo indicando il selettore", () => {
  assert.deepEqual(checkAmountInput(-50), {
    ok: false,
    message: AMOUNT_NEGATIVE_MESSAGE,
  });
  assert.equal(checkAmountInput(-0.01).ok, false);
  assert.match(AMOUNT_NEGATIVE_MESSAGE, /Income\/Expense/);
});

test("checkAmountInput non normalizza il negativo con Math.abs", () => {
  const check = checkAmountInput(-50);

  // Un `Math.abs` di comodo trasformerebbe -50 in 50 e la transazione
  // partirebbe col valore sbagliato: qui deve restare un rifiuto, senza
  // `amount` nel risultato.
  assert.equal(check.ok, false);
  assert.equal("amount" in check, false);
});

test("checkAmountInput accetta lo zero e i positivi senza alterarli", () => {
  // Lo zero e' ammesso: non e' una questione di segno (stessa scelta dello
  // schema del server, che usa `.nonnegative()` e non `.positive()`).
  assert.deepEqual(checkAmountInput(0), { ok: true, amount: 0 });
  assert.deepEqual(checkAmountInput(50), { ok: true, amount: 50 });
  assert.deepEqual(checkAmountInput(12.34), { ok: true, amount: 12.34 });
});

test("checkAmountInput rifiuta i valori non numerici", () => {
  assert.deepEqual(checkAmountInput(NaN), {
    ok: false,
    message: AMOUNT_NOT_A_NUMBER_MESSAGE,
  });
  assert.equal(checkAmountInput(Number("non-un-numero")).ok, false);
  assert.equal(checkAmountInput(Infinity).ok, false);
});
