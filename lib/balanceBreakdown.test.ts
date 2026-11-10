import test from "node:test";
import assert from "node:assert/strict";
import { balanceBreakdown } from "./balanceBreakdown.ts";

const wallets = [
  { id: "1", name: "ISP", balance: 80.32, kind: "account" as const, parent_wallet_id: null },
  { id: "11", name: "Trade Republic", balance: 6347.15, kind: "account" as const, parent_wallet_id: null },
  { id: "18", name: "Emergenze", balance: 100, kind: "pot" as const, parent_wallet_id: 1 },
  { id: "19", name: "Savings", balance: 150, kind: "pot" as const, parent_wallet_id: 1 },
  { id: "20", name: "Annuali", balance: 60, kind: "pot" as const, parent_wallet_id: 1 },
];

test("balanceBreakdown: totali in centesimi esatti, conti e salvadanai separati", () => {
  const b = balanceBreakdown(wallets);
  assert.equal(b.totalCents, 673747);
  assert.deepEqual(b.accounts, { count: 2, cents: 642747 });
  assert.deepEqual(b.pots, { count: 3, cents: 31000 });
});

test("balanceBreakdown: conti per saldo, ognuno con i suoi salvadanai ordinati", () => {
  const b = balanceBreakdown(wallets);
  assert.deepEqual(b.groups.map((g) => g.name), ["Trade Republic", "ISP"]);
  assert.deepEqual(b.groups[1].pots.map((p) => p.name), ["Savings", "Emergenze", "Annuali"]);
  assert.deepEqual(b.groups[0].pots, []);
  assert.ok(Math.abs(b.groups[0].share + b.groups[1].share + b.pots.cents / b.totalCents - 1) < 1e-9);
});

test("balanceBreakdown: un wallet senza kind e' un conto; un salvadanaio senza conto finisce in fondo", () => {
  const b = balanceBreakdown([
    { id: "1", name: "Vecchio", balance: 10 },
    { id: "2", name: "Orfano", balance: 5, kind: "pot", parent_wallet_id: 99 },
  ]);
  assert.equal(b.accounts.count, 1);
  assert.deepEqual(b.groups.map((g) => g.id), ["1", "orphans"]);
  assert.equal(b.groups[1].pots[0].name, "Orfano");
});

test("balanceBreakdown: totale nullo o negativo, quote a 0 invece di numeri senza senso", () => {
  const b = balanceBreakdown([{ id: "1", name: "In rosso", balance: -50, kind: "account" }]);
  assert.equal(b.totalCents, -5000);
  assert.equal(b.groups[0].share, 0);
});
