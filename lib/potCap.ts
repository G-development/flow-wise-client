/**
 * Tetto dei salvadanai (migrazione 013). Un salvadanaio ha un tetto fisso (`cap_cents`) oppure
 * il tetto "dal piano" (`cap_from_plan`): la somma delle rate dei prossimi 12 mesi, che calcola
 * il server in `GET /annual-plan` (`plan.capCents`). Il tetto e' un'indicazione: superarlo
 * produce un avviso, mai un blocco.
 */

type CapFields = { kind?: string | null; cap_cents?: number | null; cap_from_plan?: boolean | null };

/** Il tetto in vigore, in centesimi, o null se il salvadanaio non ne ha (o non e' un salvadanaio). */
export function effectiveCapCents(wallet: CapFields, planCapCents: number | null | undefined): number | null {
  if (wallet.kind !== "pot") return null;
  if (wallet.cap_from_plan) return planCapCents ?? null;
  return wallet.cap_cents ?? null;
}

/**
 * Di quanto un versamento porterebbe il salvadanaio sopra il tetto, in centesimi (0 se resta
 * sotto o non c'e' tetto). Saldo e versamento arrivano in euro, come li usa il client.
 */
export function overCapCents(balanceEuro: number, incomingEuro: number, capCents: number | null): number {
  if (capCents == null || !Number.isFinite(incomingEuro) || incomingEuro <= 0) return 0;
  const after = Math.round(balanceEuro * 100) + Math.round(incomingEuro * 100);
  return Math.max(0, after - capCents);
}
