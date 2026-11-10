import test from "node:test";
import assert from "node:assert/strict";
import { effectiveCapCents, overCapCents } from "./potCap.ts";

test("effectiveCapCents: fisso, dal piano, nessuno, e mai per un conto", () => {
  assert.equal(effectiveCapCents({ kind: "pot", cap_cents: 100000, cap_from_plan: false }, 5), 100000);
  assert.equal(effectiveCapCents({ kind: "pot", cap_cents: null, cap_from_plan: true }, 77700), 77700);
  assert.equal(effectiveCapCents({ kind: "pot", cap_cents: null, cap_from_plan: true }, undefined), null);
  assert.equal(effectiveCapCents({ kind: "pot", cap_cents: null, cap_from_plan: false }, 77700), null);
  assert.equal(effectiveCapCents({ kind: "account", cap_cents: 100000 }, 77700), null);
});

test("overCapCents: quanto si sfora, 0 sotto il tetto o senza tetto", () => {
  assert.equal(overCapCents(950, 100, 100000), 5000);
  assert.equal(overCapCents(900, 100, 100000), 0, "arrivare esattamente al tetto non e' sforare");
  assert.equal(overCapCents(950, 100, null), 0);
  assert.equal(overCapCents(0.1, 0.2, 30), 0, "niente errori di virgola mobile: 10+20 centesimi");
  assert.equal(overCapCents(0.1, 0.21, 30), 1);
});
