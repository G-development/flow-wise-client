/**
 * Test di `lib/transfer.ts`: riconoscere un trasferimento, il lato da assegnare e
 * costruire il corpo del PUT che lo completa.
 *
 * Esecuzione: `npm test`. Import con estensione `.ts` esplicita (type stripping di Node).
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  assignTransferSide,
  findTransferCategory,
  isPendingTransfer,
  isTransfer,
  missingTransferSide,
} from "./transfer.ts";

const base = {
  description: "MOVIM. SALVADANAIO",
  note: null,
  amount: 100,
  date: "2026-12-01",
  category_id: 30,
};

test("isTransfer riconosce solo il tipo T", () => {
  assert.equal(isTransfer({ type: "T" }), true);
  assert.equal(isTransfer({ type: "E" }), false);
  assert.equal(isTransfer({ type: "I" }), false);
});

test("missingTransferSide indica il lato vuoto di una T", () => {
  assert.equal(missingTransferSide({ type: "T", wallet_id: 1, to_wallet_id: null }), "to");
  assert.equal(missingTransferSide({ type: "T", wallet_id: null, to_wallet_id: 1 }), "from");
  assert.equal(missingTransferSide({ type: "T", wallet_id: 1, to_wallet_id: 2 }), null);
  // Una spesa non ha lati da assegnare, anche senza destinazione.
  assert.equal(missingTransferSide({ type: "E", wallet_id: 1, to_wallet_id: null }), null);
});

test("isPendingTransfer: vero solo per una T con un lato vuoto", () => {
  assert.equal(isPendingTransfer({ type: "T", wallet_id: 1 }), true);
  assert.equal(isPendingTransfer({ type: "T", wallet_id: 1, to_wallet_id: 2 }), false);
  assert.equal(isPendingTransfer({ type: "E", wallet_id: 1 }), false);
});

test("findTransferCategory trova la categoria di tipo T", () => {
  const categories = [
    { id: 1, type: "E" },
    { id: 30, type: "T" },
    { id: 2, type: "I" },
  ];
  assert.equal(findTransferCategory(categories)?.id, 30);
  assert.equal(findTransferCategory([{ id: 1, type: "E" }]), null);
});

test("assignTransferSide completa la destinazione di un accantonamento", () => {
  const body = assignTransferSide({ ...base, type: "T", wallet_id: 1, to_wallet_id: null }, 5);
  assert.deepEqual(body, { ...base, type: "T", wallet_id: 1, to_wallet_id: 5 });
});

test("assignTransferSide completa l'origine di una riunione somme", () => {
  const body = assignTransferSide({ ...base, type: "T", wallet_id: null, to_wallet_id: 1 }, 5);
  assert.equal(body.wallet_id, 5);
  assert.equal(body.to_wallet_id, 1);
});

test("assignTransferSide rifiuta una T completa e lo stesso wallet sui due lati", () => {
  assert.throws(() => assignTransferSide({ ...base, type: "T", wallet_id: 1, to_wallet_id: 2 }, 5), /non ha lati/);
  assert.throws(() => assignTransferSide({ ...base, type: "T", wallet_id: 1, to_wallet_id: null }, 1), /diverse/);
});
