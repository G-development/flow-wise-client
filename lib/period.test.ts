/**
 * Test di `lib/period.ts`: il "mese" dell'utente con un giorno di inizio scelto (16/11/2026).
 *
 * Esecuzione: `npm test`. Import con estensione `.ts` esplicita (type stripping di Node).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  comparisonRange,
  daysBetween,
  monthStartIn,
  normalizeStartDay,
  periodStart,
  presetRange,
  rangeLabel,
} from "./period.ts";

const d = (s: string) => {
  const [y, m, day] = s.split("-").map(Number);
  return new Date(y, m - 1, day);
};
const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const r = (range?: { from: Date; to: Date }) => (range ? `${iso(range.from)}..${iso(range.to)}` : "none");

test("normalizeStartDay: 1–31, altrimenti 1", () => {
  assert.equal(normalizeStartDay(27), 27);
  for (const bad of [0, 32, 2.5, "5", null, undefined]) assert.equal(normalizeStartDay(bad), 1);
});

test("monthStartIn: i mesi corti usano l'ultimo giorno", () => {
  assert.equal(iso(monthStartIn(2026, 10, 31)), "2026-11-30");
  assert.equal(iso(monthStartIn(2026, 1, 30)), "2026-02-28");
  assert.equal(iso(monthStartIn(2028, 1, 30)), "2028-02-29", "anno bisestile");
  assert.equal(iso(monthStartIn(2026, -1, 15)), "2025-12-15", "mese -1 = dicembre dell'anno prima");
});

test("periodStart: il mese che contiene il giorno", () => {
  assert.equal(iso(periodStart(d("2026-11-15"), 1)), "2026-11-01");
  assert.equal(iso(periodStart(d("2026-11-15"), 27)), "2026-10-27", "prima del 27 si e' ancora nel mese partito a ottobre");
  assert.equal(iso(periodStart(d("2026-11-27"), 27)), "2026-11-27", "il giorno stesso apre il mese nuovo");
  assert.equal(iso(periodStart(d("2026-01-10"), 27)), "2025-12-27", "a cavallo d'anno");
  assert.equal(iso(periodStart(d("2026-11-15"), 27, -1)), "2026-09-27");
  assert.equal(iso(periodStart(d("2026-03-05"), 31)), "2026-02-28", "febbraio corto, partenza al 28");
  assert.equal(iso(periodStart(d("2026-03-31"), 31)), "2026-03-31");
});

test("presetRange con il 1°: mesi di calendario", () => {
  const now = d("2026-11-15");
  assert.equal(r(presetRange("this-month", 1, now)), "2026-11-01..2026-11-15");
  assert.equal(r(presetRange("last-month", 1, now)), "2026-10-01..2026-10-31");
  assert.equal(r(presetRange("last-3", 1, now)), "2026-09-01..2026-11-15");
  assert.equal(presetRange("all", 1, now), undefined);
  assert.equal(presetRange("custom", 1, now), undefined);
});

test("presetRange con il 27", () => {
  const now = d("2026-11-15");
  assert.equal(r(presetRange("this-month", 27, now)), "2026-10-27..2026-11-15");
  assert.equal(r(presetRange("last-month", 27, now)), "2026-09-27..2026-10-26");
  assert.equal(r(presetRange("last-3", 27, now)), "2026-08-27..2026-11-15");
});

test("presetRange con il 31: il mese prima finisce il giorno prima dell'inizio", () => {
  const now = d("2026-12-10");
  assert.equal(r(presetRange("this-month", 31, now)), "2026-11-30..2026-12-10");
  assert.equal(r(presetRange("last-month", 31, now)), "2026-10-31..2026-11-29");
});

test("comparisonRange: This month contro lo stesso punto del mese prima", () => {
  const now = d("2026-11-15");
  const range = presetRange("this-month", 1, now);
  assert.equal(r(comparisonRange("this-month", range, 1, now)), "2026-10-01..2026-10-15");
  const range27 = presetRange("this-month", 27, now);
  assert.equal(r(comparisonRange("this-month", range27, 27, now)), "2026-09-27..2026-10-16", "20 giorni come 27 ott – 15 nov");
});

test("comparisonRange: non supera la fine del mese prima", () => {
  const now = d("2026-03-31");
  const range = presetRange("this-month", 1, now);
  assert.equal(r(comparisonRange("this-month", range, 1, now)), "2026-02-01..2026-02-28");
});

test("comparisonRange: Last month contro il mese prima ancora; custom contro lo stesso numero di giorni prima", () => {
  const now = d("2026-11-15");
  assert.equal(r(comparisonRange("last-month", presetRange("last-month", 1, now), 1, now)), "2026-09-01..2026-09-30");
  const custom = { from: d("2026-11-10"), to: d("2026-11-14") };
  assert.equal(r(comparisonRange("custom", custom, 1, now)), "2026-11-05..2026-11-09");
  assert.equal(comparisonRange("all", undefined, 1, now), undefined);
});

test("daysBetween e rangeLabel", () => {
  assert.equal(daysBetween(d("2026-11-01"), d("2026-11-15")), 15);
  assert.equal(daysBetween(d("2026-03-28"), d("2026-03-30")), 3, "attraversa il cambio dell'ora");
  const now = d("2026-11-15");
  assert.equal(rangeLabel({ from: d("2026-11-01"), to: d("2026-11-15") }, now), "1–15 Nov");
  assert.equal(rangeLabel({ from: d("2026-10-27"), to: d("2026-11-15") }, now), "27 Oct – 15 Nov");
  assert.equal(rangeLabel({ from: d("2025-12-27"), to: d("2026-01-10") }, now), "27 Dec 2025 – 10 Jan 2026");
});
