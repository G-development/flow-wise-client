/**
 * Test di `lib/dashboard.ts` (dashboard fissa, 16/11/2026).
 *
 * Esecuzione: `npm test`. Import con estensione `.ts` esplicita (type stripping di Node).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  categorySpending,
  cumulativeSpending,
  expenseAmount,
  inRange,
  pendingTransfersIn,
  percentChange,
  upcomingDues,
} from "./dashboard.ts";

const d = (s: string) => {
  const [y, m, day] = s.split("-").map(Number);
  return new Date(y, m - 1, day);
};

test("percentChange: null se prima non c'era una spesa positiva", () => {
  assert.equal(percentChange(112, 100), 12);
  assert.equal(percentChange(50, 100), -50);
  assert.equal(percentChange(10, 0), null);
  assert.equal(percentChange(10, -5), null);
});

test("expenseAmount: spese positive, rimborsi negativi, il resto 0", () => {
  assert.equal(expenseAmount({ type: "E", amount: 10 }), 10);
  assert.equal(expenseAmount({ type: "E", amount: -10 }), 10, "il segno lo da' il tipo");
  assert.equal(expenseAmount({ type: "I", is_refund: true, amount: 4 }), -4);
  assert.equal(expenseAmount({ type: "I", amount: 4 }), 0);
  assert.equal(expenseAmount({ type: "T", amount: 4 }), 0);
});

test("inRange: giorni compresi, anche con l'ora nella data", () => {
  const list = [{ date: "2026-10-31" }, { date: "2026-11-01T10:00:00" }, { date: "2026-11-15" }, { date: "2026-11-16" }];
  assert.deepEqual(
    inRange(list, d("2026-11-01"), d("2026-11-15")).map((m) => m.date),
    ["2026-11-01T10:00:00", "2026-11-15"]
  );
});

test("categorySpending: netto dei rimborsi, confronto e ordine", () => {
  const current = [
    { type: "E", amount: 30, category_id: 1 },
    { type: "E", amount: 20, category_id: 1 },
    { type: "I", is_refund: true, amount: 10, category_id: 1 },
    { type: "E", amount: 60, category_id: 2 },
    { type: "E", amount: 5, category_id: 3 },
    { type: "I", is_refund: true, amount: 8, category_id: 3 },
    { type: "I", amount: 1000, category_id: 9 },
    { type: "T", amount: 50, category_id: 7 },
  ];
  const previous = [
    { type: "E", amount: 50, category_id: 2 },
    { type: "E", amount: 40, category_id: 1 },
  ];
  assert.deepEqual(categorySpending(current, previous), [
    { categoryId: "2", amount: 60, previous: 50, change: 20 },
    { categoryId: "1", amount: 40, previous: 40, change: 0 },
  ]);
});

test("cumulativeSpending: totale progressivo per giorno", () => {
  const list = [
    { type: "E", amount: 10, date: "2026-11-01" },
    { type: "E", amount: 5, date: "2026-11-03" },
    { type: "I", is_refund: true, amount: 2, date: "2026-11-03" },
    { type: "I", amount: 100, date: "2026-11-02" },
  ];
  assert.deepEqual(cumulativeSpending(list, d("2026-11-01"), 4), [10, 10, 13, 13]);
});

test("pendingTransfersIn: un solo lato vuoto, nel periodo", () => {
  const list = [
    { type: "T", amount: 1, wallet_id: 1, to_wallet_id: null, date: "2026-11-05" },
    { type: "T", amount: 1, wallet_id: null, to_wallet_id: 2, date: "2026-10-20" },
    { type: "T", amount: 1, wallet_id: 1, to_wallet_id: 2, date: "2026-11-05" },
    { type: "E", amount: 1, wallet_id: null, date: "2026-11-05" },
  ];
  assert.equal(pendingTransfersIn(list).length, 2);
  assert.equal(pendingTransfersIn(list, { from: d("2026-11-01"), to: d("2026-11-15") }).length, 1);
});

test("upcomingDues: non pagate, voci attive, scadute prima, limite", () => {
  const plans = [
    {
      wallet: { name: "Savings" },
      items: [
        {
          name: "TARI",
          active: true,
          installments: [
            { due_date: "2026-12-02", amount_cents: 12000, paid: false },
            { due_date: "2026-11-01", amount_cents: 5000, paid: false },
            { due_date: "2026-10-01", amount_cents: 5000, paid: true },
          ],
        },
        { name: "Old", active: false, installments: [{ due_date: "2026-11-20", amount_cents: 1, paid: false }] },
      ],
    },
    { wallet: { name: "Emergenze" }, items: [{ name: "Car", active: true, installments: [{ due_date: "2026-11-30", amount_cents: 30000, paid: false }] }] },
  ];
  const rows = upcomingDues(plans, d("2026-11-15"), 2);
  assert.deepEqual(rows.map((r) => [r.itemName, r.dueDate, r.overdue, r.potName]), [
    ["TARI", "2026-11-01", true, "Savings"],
    ["Car", "2026-11-30", false, "Emergenze"],
  ]);
});
