/**
 * Validazione dell'input "Amount" delle form di transazione (create e edit).
 *
 * L'importo di una `Transaction` e' una **magnitudine**: il segno lo porta il
 * selettore Income/Expense (`type`). Un valore negativo digitato a mano e' un
 * errore dell'utente da **fermare**, non da correggere con `Math.abs`: la
 * correzione silenziosa nasconderebbe l'errore e contraddirebbe la convenzione
 * del progetto (vedi `lib/amount.ts`). Il server applica la stessa invariante
 * (`amount >= 0`, `utils/schemas.js`) e risponde `400` se qualcosa la aggira,
 * quindi questa e' la prima delle due barriere, non l'unica.
 *
 * Sta in un modulo a parte perche' i due punti di ingresso (la drawer di
 * creazione e il dialog di modifica) devono rifiutare **lo stesso** valore con
 * **lo stesso** messaggio: duplicare la regola e' il modo in cui le due form
 * divergono alla prima modifica.
 */

export const AMOUNT_NEGATIVE_MESSAGE =
  "Amount must be positive: use the Income/Expense selector to set the sign";

export const AMOUNT_NOT_A_NUMBER_MESSAGE = "Amount must be a number";

export type AmountInputCheck =
  | { ok: true; amount: number }
  | { ok: false; message: string };

/**
 * Controlla un importo gia' convertito a numero.
 *
 * Il parsing resta al chiamante (`Number(...)` nella drawer, `parseFloat(...)`
 * nel dialog): cosi' il valore inviato al server e' esattamente quello che la
 * form calcolava prima. Il campo vuoto e' gestito a monte dal controllo dei
 * campi obbligatori, quindi qui `0` e' un valore valido (lo zero e' ammesso,
 * non e' una questione di segno).
 */
export function checkAmountInput(amount: number): AmountInputCheck {
  if (!Number.isFinite(amount)) {
    return { ok: false, message: AMOUNT_NOT_A_NUMBER_MESSAGE };
  }

  if (amount < 0) {
    return { ok: false, message: AMOUNT_NEGATIVE_MESSAGE };
  }

  return { ok: true, amount };
}
