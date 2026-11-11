/**
 * Convenzione sugli importi di `Transaction`, lato client.
 *
 * `amount` è **sempre un valore assoluto** (>= 0) e `type` ("I" | "E" | "T") è
 * l'**unica** fonte del segno. Un trasferimento "T" sposta `amount` da
 * `wallet_id` a `to_wallet_id` e non è né entrata né spesa (`lib/transfer.ts`). Il segno non va mai letto dal numero: un
 * `amount` negativo non è "un'uscita", è un dato non normalizzato arrivato da un
 * import.
 *
 * Perché passa tutto da qui: il saldo di un wallet (`utils/walletService.js` nel
 * repo server) e i totali di periodo dei widget leggono gli stessi dati. Se
 * ognuno interpreta il segno a modo suo, una sola riga col segno nel numero fa
 * divergere saldo e totali senza che nulla lo segnali. La stessa regola vive in
 * `flow-wise-server/utils/amount.js`: due file e non uno condiviso perché i due
 * repo sono separati, quindi se la convenzione cambia vanno cambiati entrambi.
 *
 * Nota: vale per `Transaction`. In `bank_transactions` il segno **è** nel
 * valore, perché è il formato del provider bancario; la traduzione avviene
 * all'import bancario, non nei widget.
 */

/** Magnitudine letta da `amount`: il segno, se c'è, è ignorato. */
export function absoluteAmount(amount: unknown): number {
  const value = Number(amount);
  return Number.isFinite(value) ? Math.abs(value) : 0;
}

/**
 * Valore firmato della transazione: positivo per "I", negativo per "E".
 *
 * Vale solo per entrate e spese. Un trasferimento ("T") non ha un segno unico
 * (toglie dall'origine e aggiunge alla destinazione) e ogni altro tipo è un
 * errore: prima tutto ciò che non era "I" veniva contato come spesa. Stessa
 * regola di `signedAmountCents` nel server.
 */
export function signedAmount(
  amount: unknown,
  type: string | null | undefined
): number {
  const magnitude = absoluteAmount(amount);
  if (type === "I") return magnitude;
  if (type === "E") return -magnitude;
  throw new Error(`signedAmount: tipo ${JSON.stringify(type)} non è un'entrata né una spesa`);
}

type RefundLike = { type?: string | null; is_refund?: boolean | null };

/**
 * Rimborso (fase 5, migrazione 014 del server): una riga "I" con `is_refund`. I soldi entrano
 * nel wallet, ma nelle statistiche non è un'entrata: è una spesa in meno della sua categoria
 * (di tipo "E"), nel mese in cui arriva.
 */
export function isRefund(transaction: RefundLike): boolean {
  return transaction.type === "I" && transaction.is_refund === true;
}

/**
 * Totale di una selezione per i widget: le **entrate** senza i rimborsi, le **spese** al
 * netto dei rimborsi (che le riducono). Il segno lo decide `type`, mai il valore.
 *
 * Le righe di altro tipo valgono 0, così una riga mal classificata non entra nel totale
 * sbagliato. Le spese nette possono risultare negative in un mese in cui arrivano più
 * rimborsi che spese: il numero resta onesto, non viene corretto a zero.
 */
export function totalForType(
  transactions: ReadonlyArray<{ amount: unknown; type?: string | null; is_refund?: boolean | null }>,
  expectedType: "I" | "E"
): number {
  const total = transactions.reduce((sum, transaction) => {
    const magnitude = absoluteAmount(transaction.amount);
    if (expectedType === "I") return transaction.type === "I" && !isRefund(transaction) ? sum + magnitude : sum;
    if (transaction.type === "E") return sum + magnitude;
    if (isRefund(transaction)) return sum - magnitude;
    return sum;
  }, 0);
  return Math.round(total * 100) / 100;
}
