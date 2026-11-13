import Image from "next/image";
import Link from "next/link";
import Logo from "@/app/flow-wise-logo.svg";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Guscio delle pagine di accesso fuori dal login (recupero e reset password): stesso sfondo
 * `auth-shell`, logo, titolo e card della pagina di login, cosi' le pagine restano coerenti
 * anche in tema scuro. Il login e la registrazione hanno ancora il loro markup.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="auth-shell flex min-h-svh flex-col items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-4 text-center">
          <Link
            href="/"
            className="mx-auto inline-flex items-center gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <Image src={Logo} width={40} height={40} alt="Flow Wise logo" priority />
            <span className="text-lg font-semibold tracking-tight">Flow Wise</span>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
            {description && <p className="mt-2 text-muted-foreground">{description}</p>}
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-8 pb-6">{children}</CardContent>
        </Card>

        {footer && <div className="text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </main>
  );
}

/** Icona tonda di esito (successo o errore) in cima a una card. */
export function AuthStatusIcon({ tone, children }: { tone: "success" | "error"; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full",
        tone === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
      )}
    >
      {children}
    </div>
  );
}

/** Messaggio d'errore dentro un form di accesso. */
export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {children}
    </p>
  );
}
