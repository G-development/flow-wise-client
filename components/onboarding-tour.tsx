"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

/**
 * Tour guidato al primo accesso (R5, 13/11/2026, scelta di Gio: tour, non dati finti ne' slide).
 *
 * - Parte da solo sulla dashboard per gli account creati da oggi in poi, una volta per dispositivo
 *   (`localStorage`); chi c'era gia' non lo vede comparire. Si rivede da Settings ("Replay the tour"),
 *   che porta a `/dashboard?tour=1`.
 * - Ogni passaggio evidenzia un elemento con `data-tour="…"`. Lo stesso nome esiste sia nella barra
 *   desktop sia in quella in basso su mobile: si usa quello visibile. Senza elemento il riquadro sta
 *   al centro.
 * - Nessuna libreria: un riquadro con un "buco" (box-shadow enorme) sopra l'elemento e una card vicina.
 */

type Step = { target?: string; title: string; body: string };

const STEPS: Step[] = [
  {
    title: "Welcome to Flow Wise",
    body: "A quick look at the places you will use most. It takes half a minute, and you can skip it.",
  },
  {
    target: "widgets",
    title: "Your dashboard",
    body: "Balances and charts for the period you pick. Tap Edit to choose and arrange the widgets.",
  },
  {
    target: "new",
    title: "Add a movement",
    body: "Record income, expenses, transfers and refunds. A linked bank adds booked movements by itself every morning.",
  },
  {
    target: "nav-movements",
    title: "Movements",
    body: "Everything in one list, with filters by type, wallet and period. Transfers from the bank wait here to be assigned.",
  },
  {
    target: "nav-annual-plan",
    title: "Annual plan",
    body: "Yearly expenses such as insurance or car tax, paid from a savings pot: Flow Wise tells you how much to put aside each month.",
  },
  {
    target: "nav-your-bank",
    title: "Your Bank",
    body: "Link your bank read-only to sync movements, and turn on the daily import into an account.",
  },
  {
    title: "You're all set",
    body: "You can replay this tour anytime from Settings.",
  },
];

const DONE_KEY = "fw-tour-done-v1";
/** Gli account creati prima del rilascio del tour non lo vedono comparire da soli. */
const RELEASED_AT = "2026-11-13T00:00:00Z";

const readDone = () => {
  try {
    return window.localStorage.getItem(DONE_KEY) === "1";
  } catch {
    return false;
  }
};
const writeDone = () => {
  try {
    window.localStorage.setItem(DONE_KEY, "1");
  } catch {
    // storage non disponibile (navigazione privata): il tour potra' ricomparire, pazienza
  }
};

/** Il primo elemento visibile con quel `data-tour` (la barra desktop o quella mobile). */
const findTarget = (name: string): HTMLElement | null => {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`));
  return candidates.find((element) => element.getClientRects().length > 0) ?? null;
};

type Rect = { top: number; left: number; width: number; height: number };
const PAD = 6;

export function OnboardingTour() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [index, setIndex] = useState<number | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  // Avvio: ?tour=1 (da Settings) oppure account nuovo che non l'ha ancora visto.
  useEffect(() => {
    if (searchParams.get("tour") === "1") {
      setIndex(0);
      router.replace(pathname, { scroll: false });
      return;
    }
    if (readDone()) return;
    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
      const createdAt = data.session?.user?.created_at;
      if (!cancelled && createdAt && createdAt >= RELEASED_AT) setIndex(0);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname, router, searchParams]);

  const step = index != null ? STEPS[index] : null;

  const measure = useCallback(() => {
    if (!step?.target) {
      setRect(null);
      return;
    }
    const element = findTarget(step.target);
    if (!element) {
      setRect(null);
      return;
    }
    const r = element.getBoundingClientRect();
    setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
  }, [step]);

  useLayoutEffect(() => {
    if (!step) return;
    const element = step.target ? findTarget(step.target) : null;
    element?.scrollIntoView({ block: "center", behavior: "smooth" });
    measure();
    const timer = window.setTimeout(measure, 350); // dopo lo scroll morbido
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    nextRef.current?.focus();
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step, measure]);

  const finish = useCallback(() => {
    writeDone();
    setIndex(null);
  }, []);

  useEffect(() => {
    if (index == null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, finish]);

  if (!step || index == null) return null;

  const last = index === STEPS.length - 1;
  // Card sotto l'elemento se c'e' spazio, altrimenti sopra; senza elemento al centro.
  const cardStyle: React.CSSProperties = rect
    ? rect.top + rect.height + 200 < window.innerHeight
      ? { top: rect.top + rect.height + 12, left: clampLeft(rect.left) }
      : { bottom: window.innerHeight - rect.top + 12, left: clampLeft(rect.left) }
    : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

  return (
    <div className="fixed inset-0 z-[100]" aria-live="polite">
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-xl ring-2 ring-primary transition-all duration-200"
          style={{ ...rect, boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)" }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900/55" />
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        className="absolute w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xl"
        style={cardStyle}
      >
        <p className="text-xs font-medium text-muted-foreground">
          {index + 1} of {STEPS.length}
        </p>
        <h2 id="tour-title" className="mt-1 text-base font-semibold">
          {step.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          {last ? (
            <span />
          ) : (
            <Button variant="ghost" size="sm" onClick={finish}>
              Skip
            </Button>
          )}
          <div className="flex gap-2">
            {index > 0 && (
              <Button variant="outline" size="sm" onClick={() => setIndex(index - 1)}>
                Back
              </Button>
            )}
            <Button ref={nextRef} size="sm" onClick={() => (last ? finish() : setIndex(index + 1))}>
              {last ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** La card resta dentro lo schermo con 16px di margine. */
function clampLeft(left: number) {
  const width = Math.min(352, window.innerWidth - 32);
  return Math.max(16, Math.min(left, window.innerWidth - width - 16));
}
