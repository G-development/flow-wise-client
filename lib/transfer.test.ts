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
  canTransferBetween,
  findTransferCategory,
  incomeExpenseTypeOf,
  isPendingTransfer,
  isTransfer,
  missingTransferSide,
  transferAsIncomeExpense,
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

test("transferAsIncomeExpense: una ricarica uscita dal conto diventa una spesa sul conto", () => {
  const body = transferAsIncomeExpense({ ...base, type: "T", wallet_id: 1, to_wallet_id: null }, 70);
  assert.deepEqual(body, { ...base, type: "E", wallet_id: 1, to_wallet_id: null, category_id: 70 });
  assert.equal(incomeExpenseTypeOf({ type: "T", wallet_id: 1, to_wallet_id: null }), "E");
});

test("transferAsIncomeExpense: un rientro nel conto diventa un'entrata sul conto", () => {
  const body = transferAsIncomeExpense({ ...base, type: "T", wallet_id: null, to_wallet_id: 1 }, 71);
  assert.equal(body.type, "I");
  assert.equal(body.wallet_id, 1);
  assert.equal(body.to_wallet_id, null);
  assert.equal(incomeExpenseTypeOf({ type: "T", wallet_id: null, to_wallet_id: 1 }), "I");
});

test("transferAsIncomeExpense rifiuta un trasferimento gia' completo", () => {
  assert.throws(() => transferAsIncomeExpense({ ...base, type: "T", wallet_id: 1, to_wallet_id: 2 }, 70), /da assegnare/);
  assert.equal(incomeExpenseTypeOf({ type: "T", wallet_id: 1, to_wallet_id: 2 }), null);
});

test("canTransferBetween: un salvadanaio solo con il suo conto, due conti liberi", () => {
  const isp = { id: "1", kind: "account" };
  const tr = { id: "11", kind: "account" };
  const emergenze = { id: "18", kind: "pot", parent_wallet_id: 1 };
  const potTr = { id: "30", kind: "pot", parent_wallet_id: "11" };
  assert.equal(canTransferBetween(isp, emergenze), true);
  assert.equal(canTransferBetween(emergenze, isp), true);
  assert.equal(canTransferBetween(isp, tr), true);
  assert.equal(canTransferBetween(emergenze, tr), false);
  assert.equal(canTransferBetween(tr, emergenze), false);
  assert.equal(canTransferBetween(emergenze, potTr), false);
  assert.equal(canTransferBetween(isp, isp), false);
  assert.equal(canTransferBetween({ id: 2 }, { id: 3 }), true, "wallet senza kind (prima della 012) = conto");
});
