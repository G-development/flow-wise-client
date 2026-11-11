import Link from "next/link";
import type { ReactNode } from "react";
import { LEGAL } from "@/lib/legal";

/** Impaginazione comune di /terms e /privacy. */
export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-10 text-foreground sm:px-6">
      <header className="space-y-3 border-b pb-6 text-center">
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          {LEGAL.serviceName}
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="text-sm text-muted-foreground">Effective from {LEGAL.lastUpdated}</p>
      </header>

      <div className="space-y-3 leading-relaxed">{intro}</div>

      <div className="space-y-8">{children}</div>

      <footer className="flex flex-col gap-2 border-t pt-6 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <span>
          Contact: <a className="text-primary hover:underline" href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>
        </span>
        <span className="flex gap-4">
          <Link href="/terms" className="hover:underline">Terms of Service</Link>
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
        </span>
      </footer>
    </main>
  );
}

/** Sezione numerata di un testo legale. */
export function LegalSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 space-y-3 leading-relaxed">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5">{children}</ul>;
}
