/**
 * Trasferimenti tra wallet (type "T", migrazione 011 del server).
 *
 * Una "T" sposta `amount` da `wallet_id` (origine) a `to_wallet_id` (destinazione)
 * e non è né entrata né spesa: `/income/all` e `/expense/all` non la restituiscono,
 * quindi i widget la ignorano senza filtri qui.
 *
 * Un lato vuoto è un trasferimento "da assegnare": dalla banca si conosce il conto ma
 * non il salvadanaio, e il lato mancante può essere l'origine ("Riunione somme dal
 * salvadanaio") o la destinazione ("Accantonamento somma sul Salvadanaio").
 */

type TransferLike = {
  type?: string | null;
  wallet_id?: number | string | null;
  to_wallet_id?: number | string | null;
};

type CategoryLike = { id: string | number; type?: string | null };

export function isTransfer(transaction: TransferLike): boolean {
  return transaction.type === "T";
}

/** Il lato che manca a una "T" da assegnare, o null se è completa (o non è una "T"). */
export function missingTransferSide(transaction: TransferLike): "from" | "to" | null {
  if (!isTransfer(transaction)) return null;
  if (transaction.wallet_id == null) return "from";
  if (transaction.to_wallet_id == null) return "to";
  return null;
}

export function isPendingTransfer(transaction: TransferLike): boolean {
  return missingTransferSide(transaction) !== null;
}

/** La categoria di sistema "Trasferimento": l'unica di tipo "T" dell'utente. */
export function findTransferCategory<C extends CategoryLike>(categories: ReadonlyArray<C>): C | null {
  return categories.find((category) => category.type === "T") ?? null;
}

/**
 * Corpo di `PUT /transaction/:id` che assegna il lato mancante di una "T".
 * Il server vuole la transazione intera (stesso schema del POST), non solo il campo.
 */
export function assignTransferSide<T extends TransferLike & {
  description?: string | null;
  note?: string | null;
  amount: number;
  date: string;
  category_id: number;
}>(transaction: T, walletId: number) {
  const side = missingTransferSide(transaction);
  if (side === null) throw new Error("assignTransferSide: the transfer has no side to assign");

  const from = side === "from" ? walletId : Number(transaction.wallet_id);
  const to = side === "to" ? walletId : Number(transaction.to_wallet_id);
  if (from === to) throw new Error("assignTransferSide: origine e destinazione devono essere diverse");

  return {
    description: transaction.description || "Trasferimento",
    note: transaction.note ?? null,
    amount: transaction.amount,
    date: transaction.date,
    type: "T" as const,
    wallet_id: from,
    to_wallet_id: to,
    category_id: transaction.category_id,
  };
}

/**
 * Corpo di `PUT /transaction/:id` che trasforma un trasferimento "da assegnare" in una
 * spesa o un'entrata ("Not a transfer"): per un conto che non si traccia (es. una ricarica
 * verso un Revolut non collegato) i soldi usciti sono spesi, quelli entrati sono entrate.
 *
 * Il lato noto resta il wallet della transazione: se è l'origine (uscita dal conto) diventa
 * una spesa, se è la destinazione (entrata nel conto) un'entrata. Il server impara la
 * correzione come regola (`learnRuleFromCorrection`), quindi i movimenti simili successivi
 * arrivano già con quella categoria. Con `refund` un'entrata diventa un rimborso di una
 * categoria di spesa (fase 5): il server impara la regola solo dal testo libero del bonifico.
 */
export function transferAsIncomeExpense<T extends TransferLike & {
  description?: string | null;
  note?: string | null;
  amount: number;
  date: string;
}>(transaction: T, categoryId: number, { refund = false }: { refund?: boolean } = {}) {
  const side = missingTransferSide(transaction);
  if (side === null) throw new Error("transferAsIncomeExpense: only a transfer with a side to assign");
  const outgoing = side === "to";
  // Un rimborso (fase 5) e' solo un'entrata: i soldi rientrano e riducono una spesa.
  if (refund && outgoing) throw new Error("transferAsIncomeExpense: an outgoing movement cannot be a refund");
  return {
    ...(refund ? { is_refund: true } : {}),
    description: transaction.description || (outgoing ? "Spesa" : "Entrata"),
    note: transaction.note ?? null,
    amount: transaction.amount,
    date: transaction.date,
    type: outgoing ? ("E" as const) : ("I" as const),
    wallet_id: Number(outgoing ? transaction.wallet_id : transaction.to_wallet_id),
    to_wallet_id: null,
    category_id: categoryId,
  };
}

/** Il tipo che avrà un trasferimento da assegnare se diventa spesa o entrata. */
export function incomeExpenseTypeOf(transaction: TransferLike): "I" | "E" | null {
  const side = missingTransferSide(transaction);
  return side === null ? null : side === "to" ? "E" : "I";
}

type PairWallet = { id: string | number; kind?: string | null; parent_wallet_id?: string | number | null };

/**
 * Un trasferimento tra questi due wallet e' ammesso? Un salvadanaio scambia soldi solo con il
 * suo conto (regola del server, `routes/transaction.js`, decisa da Gio l'11/11/2026); due wallet
 * uguali mai. Serve a non proporre nei menu una coppia che il server rifiuterebbe.
 */
export function canTransferBetween(a: PairWallet, b: PairWallet): boolean {
  if (String(a.id) === String(b.id)) return false;
  const potOk = (pot: PairWallet, other: PairWallet) =>
    pot.kind !== "pot" || String(pot.parent_wallet_id) === String(other.id);
  return potOk(a, b) && potOk(b, a);
}
