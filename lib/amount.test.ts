/**
 * Test di `lib/amount.ts`.
 *
 * Blocca la convenzione di sign lato client: `amount` e' un valore assoluto e il
 * segno lo decide `type` ("I" | "E"). E' la stessa regola che applica
 * `utils/amount.js` / `utils/walletService.js` nel repo server: se una delle due
 * parti interpretasse il segno dal numero, saldo e totali dei widget divergerebbero.
 *
 * Esecuzione: `npm test`. Import con estensione `.ts` esplicita (type stripping di Node).
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { absoluteAmount, signedAmount, totalForType } from "./amount.ts";

test("absoluteAmount ignora il segno e normalizza a 0 i valori non numerici", () => {
  assert.equal(absoluteAmount(-50), 50);
  assert.equal(absoluteAmount(50), 50);
  assert.equal(absoluteAmount("-50"), 50);
  assert.equal(absoluteAmount(0), 0);
  assert.equal(absoluteAmount(NaN), 0);
  assert.equal(absoluteAmount(undefined), 0);
  assert.equal(absoluteAmount("non-un-numero"), 0);
});

test("signedAmount usa type come unica fonte del segno", () => {
  assert.equal(signedAmount(50, "I"), 50);
  assert.equal(signedAmount(50, "E"), -50);
  // Il segno scritto nel numero non conta: vale sempre `type`.
  assert.equal(signedAmount(-50, "I"), 50);
  assert.equal(signedAmount(-50, "E"), -50);
});

test("totalForType somma solo le righe del tipo atteso", () => {
  const rows = [
    { amount: 10, type: "E" },
    { amount: 25, type: "E" },
    { amount: 100, type: "I" },
  ];

  assert.equal(totalForType(rows, "E"), 35);
  assert.equal(totalForType(rows, "I"), 100);
});

test("totalForType ignora il segno nel numero e restituisce una magnitudine positiva", () => {
  assert.equal(totalForType([{ amount: -25, type: "E" }], "E"), 25);
  assert.equal(totalForType([], "I"), 0);
  assert.equal(totalForType([{ amount: 10, type: null }, { amount: 5 }], "E"), 0);
});
