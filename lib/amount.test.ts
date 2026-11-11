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

import { absoluteAmount, isRefund, signedAmount, totalForType } from "./amount.ts";

test("absoluteAmount ignora il segno e normalizza a 0 i valori non numerici", () => {
  assert.equal(absoluteAmount(-50), 50);
  assert.equal(absoluteAmount(50), 50);
  assert.equal(absoluteAmount("-50"), 50);
  assert.equal(absoluteAmount(0), 0);
  assert.equal(absoluteAmount(NaN), 0);
  assert.equal(absoluteAmount(undefined), 0);
  assert.equal(absoluteAmount("non-un-numero"), 0);
});

test("signedAmount rifiuta ogni tipo che non sia I o E (T compreso)", () => {
  // Prima tutto cio' che non era "I" diventava una spesa; una "T" non ha un segno unico.
  assert.throws(() => signedAmount(50, "T"), /neither an income nor an expense/);
  assert.throws(() => signedAmount(50, undefined), /neither an income nor an expense/);
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

test("rimborsi: non sono entrate e riducono le spese", () => {
  const rows = [
    { amount: 60, type: "E" },
    { amount: 36, type: "I", is_refund: true },
    { amount: 1800, type: "I" },
  ];
  assert.equal(isRefund(rows[1]), true);
  assert.equal(isRefund(rows[2]), false);
  assert.equal(totalForType(rows, "E"), 24);
  assert.equal(totalForType(rows, "I"), 1800);
});

test("rimborsi: un mese con piu' rimborsi che spese resta negativo, senza arrotondamenti sbagliati", () => {
  assert.equal(totalForType([{ amount: 132.91, type: "I", is_refund: true }, { amount: 0.1, type: "E" }], "E"), -132.81);
});
