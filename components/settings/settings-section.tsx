import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Sezione della pagina Settings (restyling del 13/11/2026, colonna unica scelta da Gio): card con
 * l'icona in un riquadro colorato (come i widget della dashboard), titolo, descrizione e contenuto.
 * `tone="danger"` per la zona rossa (elimina account).
 */
export function SettingsSection({
  id,
  icon: Icon,
  title,
  description,
  tone = "default",
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  tone?: "default" | "danger";
  children: React.ReactNode;
}) {
  const danger = tone === "danger";
  return (
    <section
      aria-labelledby={`${id}-title`}
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-sm sm:p-6",
        danger ? "border-destructive/30" : "border-border/70"
      )}
    >
      <div className="mb-4 flex items-start gap-3">
        <div className={cn("rounded-xl p-2.5", danger ? "bg-destructive/10" : "bg-primary/10")}>
          <Icon className={cn("h-4 w-4", danger ? "text-destructive" : "text-primary")} />
        </div>
        <div className="min-w-0">
          <h2 id={`${id}-title`} className={cn("font-semibold", danger && "text-destructive")}>
            {title}
          </h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

/** Riga cliccabile con icona, testo e freccia, come nelle impostazioni del telefono. */
export function SettingsLinkRow({
  href,
  icon: Icon,
  label,
  hint,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  hint?: string;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-secondary"
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block truncate text-xs text-muted-foreground">{hint}</span>}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-60 group-hover:opacity-100" />
    </Link>
  );
}

/** Le righe di una lista, separate da una linea sottile. */
export function SettingsRows({ children }: { children: React.ReactNode }) {
  return <div className="-mx-2 divide-y divide-border/60">{children}</div>;
}
