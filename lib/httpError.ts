/**
 * Estrazione del messaggio d'errore da una `Response` non-ok.
 *
 * Il server Express ha due forme, in ordine di priorita':
 *
 * 1. `400` del middleware di validazione (`utils/validate.js`):
 *    `{ error: "Validation error", details: [{ path, message }] }`. La
 *    spiegazione azionabile sta nel primo `details[].message` (es. il vincolo
 *    `amount >= 0`), non nel generico "Validation error";
 * 2. gli altri rami mettono il messaggio direttamente in `body.error` (es. la
 *    409 di `DELETE /category`: "Category is in use by N transactions; reassign
 *    or remove them first").
 *
 * Il `Response` grezzo di `apiFetch` e' gia' disponibile al chiamante, quindi la
 * lettura e' best-effort: se il body e' assente, vuoto o non-JSON si ricade sul
 * messaggio generico invece di perdere l'errore.
 */
export async function errorFromResponse(
  res: Response,
  fallback: string
): Promise<Error> {
  try {
    const body: unknown = await res.json();
    if (!body || typeof body !== "object") return new Error(fallback);

    const detail = firstDetailMessage((body as { details?: unknown }).details);
    if (detail) return new Error(detail);

    const { error } = body as { error?: unknown };
    if (typeof error === "string" && error.trim()) {
      return new Error(error);
    }
  } catch {
    // body assente o non-JSON: si usa il fallback
  }
  return new Error(fallback);
}

/** Primo `details[].message` non vuoto, `null` se non c'e' nulla di mostrabile. */
function firstDetailMessage(details: unknown): string | null {
  if (!Array.isArray(details)) return null;

  for (const detail of details) {
    if (!detail || typeof detail !== "object") continue;
    const message = (detail as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }

  return null;
}
