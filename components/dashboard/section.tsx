import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Una sezione della dashboard fissa (16/11/2026): titolo piccolo, link facoltativo, contenuto. */
export function DashboardSection({
  title,
  href,
  linkLabel,
  className,
  children,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("space-y-2", className)} aria-label={title}>
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
        {href && (
          <Link href={href} className="inline-flex items-center text-xs font-medium text-primary hover:underline">
            {linkLabel ?? "See all"}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export const formatEuro = (value: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);

/** "+12%" / "−8%" / "same": la variazione rispetto al periodo di confronto. */
export function ChangeLabel({ change, className }: { change: number | null; className?: string }) {
  if (change === null) return null;
  const text = change === 0 ? "same" : `${change > 0 ? "+" : "−"}${Math.abs(change)}%`;
  return <span className={cn("tabular-nums", className)}>{text}</span>;
}
