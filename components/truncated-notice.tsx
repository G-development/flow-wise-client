import { AlertTriangle } from "lucide-react";

interface TruncatedNoticeProps {
  /** Righe presenti nella risposta. */
  shown: number;
  /** Righe totali secondo il database, `null` se il server non le dichiara. */
  total: number | null;
  /** Classi aggiuntive per l'allineamento nel contenitore che lo ospita. */
  className?: string;
}

/**
 * Avviso per un set di righe tagliato al tetto di paginazione del server.
 *
 * Da mostrare accanto alla lista o alla somma che sta a valle dello stesso set:
 * il numero di righe che il server dichiara non esaurisce il periodo richiesto.
 * Il chiamante decide se renderlo, in base a `truncated` nella risposta.
 */
export function TruncatedNotice({
  shown,
  total,
  className = "",
}: TruncatedNoticeProps) {
  const detail = total === null ? `${shown} righe` : `${shown} righe su ${total}`;

  return (
    <p
      role="status"
      className={`flex items-start gap-1.5 text-xs font-medium text-warning ${className}`}
    >
      <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
      Dati troncati: mostrate {detail}. Il totale non comprende tutte le
      transazioni del periodo.
    </p>
  );
}
