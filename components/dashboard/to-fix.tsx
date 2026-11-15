import Link from "next/link";
import { ArrowLeftRight, ChevronRight, Tag } from "lucide-react";

/**
 * "To fix" (16/11/2026): trasferimenti da assegnare e movimenti da rivedere **nel periodo scelto**
 * (scelta di Gio). Compare solo se c'e' qualcosa; un tocco porta dove si sistemano.
 */
export function ToFix({ pendingTransfers, toReview }: { pendingTransfers: number; toReview: number }) {
  if (pendingTransfers === 0 && toReview === 0) return null;
  return (
    <section aria-label="To fix" className="divide-y divide-amber-500/20 overflow-hidden rounded-2xl border border-amber-500/40 bg-amber-500/5">
      {pendingTransfers > 0 && (
        <Row
          href="/movements"
          icon={<ArrowLeftRight className="h-4 w-4" />}
          title={`${pendingTransfers} ${pendingTransfers === 1 ? "transfer" : "transfers"} to assign`}
          hint="Bank transfers missing the other wallet"
        />
      )}
      {toReview > 0 && (
        <Row
          href="/category?review=1"
          icon={<Tag className="h-4 w-4" />}
          title={`${toReview} ${toReview === 1 ? "movement" : "movements"} to review`}
          hint="Still in a fallback category"
        />
      )}
    </section>
  );
}

function Row({ href, icon, title, hint }: { href: string; icon: React.ReactNode; title: string; hint: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-amber-500/10">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{hint}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
