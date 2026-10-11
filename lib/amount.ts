/**
 * Convenzione sugli importi di `Transaction`, lato client.
 *
 * `amount` è **sempre un valore assoluto** (>= 0) e `type` ("I" | "E") è
 * l'**unica** fonte del segno. Il segno non va mai letto dal numero: un
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

/** Valore firmato della transazione: positivo per "I", negativo per "E". */
export function signedAmount(
  amount: unknown,
  type: string | null | undefined
): number {
  const magnitude = absoluteAmount(amount);
  return type === "I" ? magnitude : -magnitude;
}

/**
 * Totale **positivo** di una selezione omogenea per tipo (le entrate per i
 * widget delle entrate, le uscite per quelli delle spese).
 *
 * Le righe con `type` diverso da `expectedType` valgono 0: il segno lo decide
 * `type`, non il valore, quindi una riga mal classificata non entra nel totale
 * sbagliato. Il risultato è la magnitudine della somma firmata, cioè la stessa
 * grandezza che `walletService` somma per quel tipo.
 */
export function totalForType(
  transactions: ReadonlyArray<{ amount: unknown; type?: string | null }>,
  expectedType: "I" | "E"
): number {
  const signed = transactions.reduce(
    (total, transaction) =>
      transaction.type === expectedType
        ? total + signedAmount(transaction.amount, transaction.type)
        : total,
    0
  );

  return Math.abs(signed);
}
