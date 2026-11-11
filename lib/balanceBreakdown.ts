/**
 * Ripartizione del saldo totale tra conti e salvadanai (widget Total Balance della dashboard).
 * Tutto in centesimi interi: i saldi arrivano in euro da `GET /wallet` e si sommano senza
 * errori di virgola mobile. Un wallet senza `kind` (prima della migrazione 012) e' un conto.
 */

type BalanceWallet = {
  id: string | number;
  name: string;
  balance: number;
  kind?: "account" | "pot" | null;
  parent_wallet_id?: number | string | null;
};

export type BreakdownRow = {
  id: string;
  name: string;
  /** Saldo usato nel totale: quello della banca se il wallet e' collegato, altrimenti quello dell'app. */
  cents: number;
  share: number;
  /** Solo per un wallet collegato a una banca: saldo calcolato dall'app e ora della lettura della banca. */
  bank?: { appCents: number; fetchedAt: string | null };
};

/** Saldo letto dalla banca per i wallet collegati (id wallet -> saldo in euro e ora della lettura). */
export type BankBalances = ReadonlyMap<string, { amount: number; fetchedAt: string | null }>;
export type AccountGroup = BreakdownRow & { pots: BreakdownRow[] };

export type BalanceBreakdown = {
  totalCents: number;
  accounts: { count: number; cents: number };
  pots: { count: number; cents: number };
  /** Conti in ordine di saldo, ognuno con i suoi salvadanai; salvadanai senza conto in fondo. */
  groups: AccountGroup[];
};

const toCents = (euro: number) => (Number.isFinite(euro) ? Math.round(euro * 100) : 0);

/** Quota sul totale, 0…1. Con un totale nullo o negativo la quota non ha senso: 0. */
const shareOf = (cents: number, totalCents: number) => (totalCents > 0 ? cents / totalCents : 0);

/**
 * Per un conto collegato a una banca il saldo e' quello letto dalla banca (deciso da Gio
 * l'11/11/2026): e' il numero vero del conto. Il saldo calcolato dall'app resta nella riga,
 * cosi' una differenza si vede invece di sparire. I salvadanai non sono mai collegati.
 */
export function balanceBreakdown(wallets: BalanceWallet[], bankBalances: BankBalances = new Map()): BalanceBreakdown {
  const isPot = (wallet: BalanceWallet) => wallet.kind === "pot";
  const effectiveCents = (wallet: BalanceWallet) => {
    const bank = isPot(wallet) ? undefined : bankBalances.get(String(wallet.id));
    return bank && Number.isFinite(bank.amount) ? toCents(bank.amount) : toCents(wallet.balance);
  };
  const totalCents = wallets.reduce((sum, wallet) => sum + effectiveCents(wallet), 0);
  const row = (wallet: BalanceWallet): BreakdownRow => {
    const cents = effectiveCents(wallet);
    const bank = isPot(wallet) ? undefined : bankBalances.get(String(wallet.id));
    return {
      id: String(wallet.id),
      name: wallet.name,
      cents,
      share: shareOf(cents, totalCents),
      ...(bank && Number.isFinite(bank.amount) ? { bank: { appCents: toCents(wallet.balance), fetchedAt: bank.fetchedAt } } : {}),
    };
  };

  const accounts = wallets.filter((wallet) => !isPot(wallet));
  const pots = wallets.filter(isPot);
  const byCents = (a: BreakdownRow, b: BreakdownRow) => b.cents - a.cents;

  const groups: AccountGroup[] = accounts
    .map((account) => ({
      ...row(account),
      pots: pots.filter((pot) => String(pot.parent_wallet_id) === String(account.id)).map(row).sort(byCents),
    }))
    .sort(byCents);
  const orphans = pots.filter((pot) => !accounts.some((account) => String(account.id) === String(pot.parent_wallet_id)));
  if (orphans.length > 0) {
    groups.push({ id: "orphans", name: "Other savings pots", cents: 0, share: 0, pots: orphans.map(row).sort(byCents) });
  }

  const sum = (list: BalanceWallet[]) => list.reduce((total, wallet) => total + effectiveCents(wallet), 0);
  return {
    totalCents,
    accounts: { count: accounts.length, cents: sum(accounts) },
    pots: { count: pots.length, cents: sum(pots) },
    groups,
  };
}
