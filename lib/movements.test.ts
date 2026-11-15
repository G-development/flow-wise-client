/**
 * Test di `lib/movements.ts`: filtri nell'indirizzo, filtro per tipo e wallet (con le "T"
 * sui due lati e da assegnare), totali della selezione e delle card.
 *
 * Esecuzione: `npm test`. Import con estensione `.ts` esplicita (type stripping di Node).
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_FILTERS,
  filterMovements,
  movementDirection,
  movementTotals,
  parseMovementFilters,
  serializeMovementFilters,
  touchesWallet,
  walletPeriodTotals,
} from "./movements.ts";

const rows = [
  { id: "1", type: "I", amount: 1800, wallet_id: 1, to_wallet_id: null },
  { id: "2", type: "E", amount: 40, wallet_id: 1, to_wallet_id: null },
  { id: "3", type: "T", amount: 150, wallet_id: 1, to_wallet_id: 11 }, // conto -> Trade Republic
  { id: "4", type: "T", amount: 100, wallet_id: 1, to_wallet_id: null }, // accantonamento da assegnare
  { id: "5", type: "T", amount: 60, wallet_id: null, to_wallet_id: 1 }, // riunione somme da assegnare
  { id: "6", type: "E", amount: -10, wallet_id: 11, to_wallet_id: null }, // segno nel numero: conta come 10
];

const params = (query: string) => new URLSearchParams(query);
const ids = (list: { id: string }[]) => list.map((row) => row.id);

test("parseMovementFilters: tipi e wallet dall'indirizzo, valori sconosciuti ignorati", () => {
  const filters = parseMovementFilters(params("types=I,T,X&wallets=11, 1"));
  assert.deepEqual([...filters.types], ["I", "T"]);
  assert.deepEqual([...(filters.wallets ?? [])], ["11", "1"]);
});

test("parseMovementFilters: niente parametri o solo valori sbagliati = tutto", () => {
  for (const query of ["", "types=", "types=X,Y", "wallets="]) {
    const filters = parseMovementFilters(params(query));
    assert.deepEqual([...filters.types], ["I", "E", "T"], query);
    assert.equal(filters.wallets, null, query);
  }
});

test("serializeMovementFilters: scrive solo cio' che si allontana dal default", () => {
  assert.equal(serializeMovementFilters(DEFAULT_FILTERS).toString(), "");
  const narrowed = serializeMovementFilters({ types: new Set(["T", "I"]), wallets: new Set(["11", "1"]) });
  assert.equal(narrowed.get("types"), "I,T");
  assert.equal(narrowed.get("wallets"), "1,11");
});

test("touchesWallet: una T tocca origine e destinazione, una spesa solo il suo wallet", () => {
  assert.equal(touchesWallet(rows[2], "1"), true);
  assert.equal(touchesWallet(rows[2], "11"), true);
  assert.equal(touchesWallet(rows[4], "1"), true, "da assegnare: tocca il lato noto");
  assert.equal(touchesWallet({ type: "E", amount: 1, wallet_id: 1, to_wallet_id: 11 }, "11"), false);
});

test("filterMovements: per tipo, per wallet e combinati", () => {
  assert.deepEqual(ids(filterMovements(rows, DEFAULT_FILTERS)), ["1", "2", "3", "4", "5", "6"]);
  assert.deepEqual(ids(filterMovements(rows, { types: new Set(["T"]), wallets: null })), ["3", "4", "5"]);
  assert.deepEqual(ids(filterMovements(rows, { types: new Set(["I", "E", "T"]), wallets: new Set(["11"]) })), ["3", "6"]);
  assert.deepEqual(ids(filterMovements(rows, { types: new Set(["E"]), wallets: new Set(["1"]) })), ["2"]);
  assert.deepEqual(ids(filterMovements(rows, { types: new Set(), wallets: null })), []);
});

test("movementTotals: i trasferimenti non entrano nel netto", () => {
  const totals = movementTotals(rows);
  assert.deepEqual(totals, { income: 1800, expense: 50, net: 1750, transfersIn: null, transfersOut: null });
});

test("movementTotals con un solo wallet: trasferimenti in entrata e in uscita", () => {
  assert.deepEqual(movementTotals(filterMovements(rows, { types: new Set(["I", "E", "T"]), wallets: new Set(["1"]) }), "1"), {
    income: 1800,
    expense: 40,
    net: 1760,
    transfersIn: 60,
    transfersOut: 250,
  });
  const tr = movementTotals(filterMovements(rows, { types: new Set(["T"]), wallets: new Set(["11"]) }), "11");
  assert.equal(tr.transfersIn, 150);
  assert.equal(tr.transfersOut, 0);
});

test("walletPeriodTotals: entrate e spese del wallet, trasferimenti esclusi", () => {
  assert.deepEqual(walletPeriodTotals(rows, "1"), { income: 1800, expense: 40 });
  assert.deepEqual(walletPeriodTotals(rows, "11"), { income: 0, expense: 10 });
});

test("movementDirection: neutro per le T, tranne quando si guarda un solo wallet", () => {
  assert.equal(movementDirection(rows[0]), "in");
  assert.equal(movementDirection(rows[1]), "out");
  assert.equal(movementDirection(rows[2]), "neutral");
  assert.equal(movementDirection(rows[2], "1"), "out");
  assert.equal(movementDirection(rows[2], "11"), "in");
});

test("rimborso: con le spese nei filtri e nei totali, in entrata sul wallet", () => {
  const refund = { type: "I", is_refund: true, amount: 36, wallet_id: 1, to_wallet_id: null };
  const cena = { type: "E", amount: 60, wallet_id: 1, to_wallet_id: null };
  const stipendio = { type: "I", amount: 1800, wallet_id: 1, to_wallet_id: null };
  const onlyExpenses = filterMovements([refund, cena, stipendio], { types: new Set(["E"]), wallets: null });
  assert.deepEqual(onlyExpenses, [refund, cena]);
  assert.deepEqual(movementTotals([refund, cena, stipendio]), { income: 1800, expense: 24, net: 1776, transfersIn: null, transfersOut: null });
  assert.equal(movementDirection(refund), "in");
});

test("searchMovements: parole in nome, descrizione, nota o testo in piu', senza maiuscole e accenti", async () => {
  const { searchMovements } = await import("./movements.ts");
  const rows = [
    { id: 1, type: "E", amount: 10, merchant: "Conad", description: "PAGAM. POS CONAD SUPERMERCATO", note: null },
    { id: 2, type: "E", amount: 5, merchant: null, description: "Caffè al bar", note: "con Marco" },
    { id: 3, type: "I", amount: 50, merchant: "To Michele", description: "Bonifico", note: null },
  ];
  assert.deepEqual(searchMovements(rows, "conad").map((r) => r.id), [1]);
  assert.deepEqual(searchMovements(rows, "CAFFE marco").map((r) => r.id), [2]);
  assert.deepEqual(searchMovements(rows, "spesa", (r) => (r.id === 1 ? "Spesa" : "")).map((r) => r.id), [1]);
  assert.equal(searchMovements(rows, "   ").length, 3);
  assert.equal(searchMovements(rows, "conad marco").length, 0, "tutte le parole devono esserci");
});

test("groupMovementsByDay: dal giorno piu' recente, con il saldo del giorno nel verso mostrato", async () => {
  const { groupMovementsByDay } = await import("./movements.ts");
  const rows = [
    { id: 1, date: "2026-11-14", type: "E", amount: 10, wallet_id: 1 },
    { id: 2, date: "2026-11-15", type: "I", amount: 100, wallet_id: 1 },
    { id: 3, date: "2026-11-14", type: "I", amount: 4, is_refund: true, wallet_id: 1 },
    { id: 4, date: "2026-11-14T10:00:00", type: "T", amount: 50, wallet_id: 1, to_wallet_id: 2 },
  ];
  const groups = groupMovementsByDay(rows);
  assert.deepEqual(groups.map((g) => g.day), ["2026-11-15", "2026-11-14"]);
  assert.equal(groups[1].items.length, 3);
  assert.equal(groups[1].net, -6, "−10 + 4 di rimborso; il trasferimento non conta senza un wallet scelto");
  const onWallet1 = groupMovementsByDay(rows, "1");
  assert.equal(onWallet1[1].net, -56, "guardando il wallet 1 il trasferimento in uscita conta");
});
