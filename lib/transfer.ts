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
  if (side === null) throw new Error("assignTransferSide: il trasferimento non ha lati da assegnare");

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
