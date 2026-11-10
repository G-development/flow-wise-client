"use client";

import { Suspense, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { addMonths, format } from "date-fns";
import Navbar from "@/components/navbar";
import DeleteDialog from "@/components/delete-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseAmountToCents } from "@/components/movements/wallet-cards";
import { useMovements, useWallets, type Wallet } from "@/lib/hooks/useQueries";
import { EMPTY_LIST_RESPONSE } from "@/lib/listResponse";
import { absoluteAmount } from "@/lib/amount";
import {
  useAddInstallment,
  useAnnualPlan,
  useCopyNextYear,
  useCreateAnnualItem,
  useDeleteAnnualItem,
  useDeleteInstallment,
  useSetInstallmentPayment,
  useUpdateInstallment,
  type AnnualInstallment,
  type AnnualItem,
} from "@/lib/hooks/useAnnualPlan";
import { AlertTriangle, Check, Copy, Pencil, Plus, Trash } from "lucide-react";

const euro = (cents: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
const day = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("it-IT");

/**
 * Piano delle spese annuali di un salvadanaio (fase 3): voci con rate esplicite, quota mensile
 * consigliata, tetto e proiezione a 12 mesi. Il calcolo e' del server (`utils/annualPlan.js`):
 * i versamenti di un mese coprono le rate dei mesi successivi.
 */
export default function AnnualPlanPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<main className="app-page"><p className="text-muted-foreground">Loading…</p></main>}>
        <AnnualPlanView />
      </Suspense>
    </>
  );
}

function AnnualPlanView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: wallets = [] } = useWallets();
  const pots = wallets.filter((wallet) => wallet.kind === "pot");

  // Salvadanaio dall'indirizzo (?wallet=); senza, quello con il tetto dal piano o il primo.
  const requested = Number(searchParams.get("wallet"));
  const pot =
    pots.find((wallet) => Number(wallet.id) === requested) ??
    pots.find((wallet) => wallet.cap_from_plan) ??
    pots[0] ??
    null;
  const potId = pot ? Number(pot.id) : null;

  const { data, isLoading, isError } = useAnnualPlan(potId);
  const [creating, setCreating] = useState(false);

  if (!isLoading && pots.length === 0) {
    return (
      <main className="app-page">
        <h1 className="page-title">Annual plan</h1>
        <p className="page-description">Create a savings pot first (Movements → account menu → Add savings pot).</p>
      </main>
    );
  }

  return (
    <main className="app-page">
      <div className="app-page-header">
        <div>
          <h1 className="page-title">Annual plan</h1>
          <p className="page-description">
            Yearly expenses paid from a savings pot. Deposits made in a month cover the installments of the
            following months.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            value={potId != null ? String(potId) : undefined}
            onValueChange={(value) => router.replace(`${pathname}?wallet=${value}`, { scroll: false })}
          >
            <SelectTrigger className="w-full sm:w-48" aria-label="Savings pot">
              <SelectValue placeholder="Savings pot" />
            </SelectTrigger>
            <SelectContent>
              {pots.map((wallet) => (
                <SelectItem key={wallet.id} value={String(wallet.id)}>
                  {wallet.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setCreating(true)} disabled={!pot}>
            <Plus className="mr-2 h-4 w-4" />
            Add item
          </Button>
        </div>
      </div>

      {isError && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="font-medium text-destructive">Error loading the plan</p>
        </div>
      )}

      {data && (
        <>
          <section className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Balance" value={euro(data.plan.balanceCents)} />
            <Stat label="Suggested deposit" value={`${euro(data.plan.suggestedMonthlyCents)} / month`} strong />
            <Stat label="Cap" value={data.plan.capCents != null ? euro(data.plan.capCents) : "—"} />
            <Stat
              label="Next 12 months"
              value={euro(data.plan.projection.slice(1).reduce((sum, row) => sum + row.dueCents, 0))}
            />
          </section>

          {data.plan.shortfallNowCents > 0 && (
            <Warning>
              {euro(data.plan.shortfallNowCents)} short for the installments of this month: no deposit made now
              covers them in time.
            </Warning>
          )}
          {data.plan.capConflict && (
            <Warning>Covering the installments needs more than the cap of this pot: the suggestion ignores the cap.</Warning>
          )}

          <Projection today={data.today} projection={data.plan.projection} />

          <section className="space-y-4">
            {data.items.length === 0 && (
              <p className="text-sm text-muted-foreground">No items yet for {pot?.name}. Add the first one.</p>
            )}
            {data.items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </section>
        </>
      )}

      {pot && <ItemDialog pot={pot} open={creating} onClose={() => setCreating(false)} />}
    </main>
  );
}

function Stat({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-lg border border-border/70 bg-card px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`tabular-nums ${strong ? "text-lg font-semibold" : "font-medium"}`}>{value}</p>
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <p>{children}</p>
    </div>
  );
}

/** Mese per mese: rate e saldo previsto a fine mese versando la quota consigliata. */
function Projection({ today, projection }: { today: string; projection: { month: number; dueCents: number; balanceCents: number }[] }) {
  const start = new Date(`${today}T00:00:00`);
  return (
    <section className="mb-6 overflow-x-auto rounded-xl border border-border/70 bg-card shadow-sm">
      <table className="w-full min-w-[520px] text-sm">
        <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Month</th>
            <th className="px-3 py-2 text-right font-medium">Installments</th>
            <th className="px-3 py-2 text-right font-medium">Balance at month end</th>
          </tr>
        </thead>
        <tbody>
          {projection.map((row) => (
            <tr key={row.month} className="border-t border-border/50">
              <td className="px-3 py-1.5">{format(addMonths(start, row.month), "MMM yyyy")}{row.month === 0 ? " (now)" : ""}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{row.dueCents ? euro(row.dueCents) : "—"}</td>
              <td className={`px-3 py-1.5 text-right tabular-nums ${row.balanceCents < 0 ? "font-medium text-destructive" : ""}`}>
                {euro(row.balanceCents)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ItemCard({ item }: { item: AnnualItem }) {
  const copyNextYear = useCopyNextYear();
  const deleteItem = useDeleteAnnualItem();
  const deleteInstallment = useDeleteInstallment();
  const [editing, setEditing] = useState<AnnualInstallment | "new" | null>(null);
  const [paying, setPaying] = useState<AnnualInstallment | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">{item.name}</h2>
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant="outline" onClick={() => setEditing("new")}>
            <Plus className="mr-1 h-4 w-4" /> Installment
          </Button>
          <Button size="sm" variant="outline" onClick={() => copyNextYear.mutate(item.id)} disabled={item.installments.length === 0}>
            <Copy className="mr-1 h-4 w-4" /> Copy next year
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(true)}>
            <Trash className="h-4 w-4" />
            <span className="sr-only">Delete item</span>
          </Button>
        </div>
      </div>
      <ul className="divide-y divide-border/60 text-sm">
        {item.installments.map((installment) => (
          <li key={installment.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span className="tabular-nums">{day(installment.due_date)}</span>
            <span className="tabular-nums font-medium">{euro(installment.amount_cents)}</span>
            <button
              type="button"
              onClick={() => setPaying(installment)}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                installment.paid ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
              }`}
            >
              {installment.paid ? <><Check className="h-3 w-3" /> Paid</> : "To pay"}
            </button>
            <span className="flex gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(installment)}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit installment</span>
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteInstallment.mutate(installment.id)}>
                <Trash className="h-4 w-4" />
                <span className="sr-only">Delete installment</span>
              </Button>
            </span>
          </li>
        ))}
      </ul>

      <InstallmentDialog itemId={item.id} installment={editing === "new" ? null : editing} open={editing !== null} onClose={() => setEditing(null)} />
      <PaymentDialog installment={paying} onClose={() => setPaying(null)} />
      <DeleteDialog
        isOpen={confirmDelete}
        title="Delete item"
        description={`Delete "${item.name}" and all its installments? Transactions are not touched.`}
        onClose={() => setConfirmDelete(false)}
        isPending={deleteItem.isPending}
        onConfirm={async () => {
          try {
            await deleteItem.mutateAsync(item.id);
          } finally {
            setConfirmDelete(false);
          }
        }}
      />
    </div>
  );
}

/** Nuova voce con le sue rate (righe data + importo in euro). */
function ItemDialog({ pot, open, onClose }: { pot: Wallet; open: boolean; onClose: () => void }) {
  const createItem = useCreateAnnualItem();
  const [name, setName] = useState("");
  const [rows, setRows] = useState([{ date: "", amount: "" }]);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setRows([{ date: "", amount: "" }]);
    setError(null);
  };

  const save = async () => {
    const installments = [];
    for (const row of rows) {
      if (!row.date && !row.amount) continue;
      const cents = parseAmountToCents(row.amount);
      if (!row.date || cents === null || cents <= 0) {
        setError("Every installment needs a date and a positive amount, e.g. 477 or 127,50");
        return;
      }
      installments.push({ due_date: row.date, amount_cents: cents });
    }
    if (!name.trim()) {
      setError("Enter a name");
      return;
    }
    try {
      await createItem.mutateAsync({ name: name.trim(), pot_wallet_id: Number(pot.id), installments });
      reset();
      onClose();
    } catch {
      // il messaggio lo mostra la mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) { reset(); onClose(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add item to {pot.name}</DialogTitle>
          <DialogDescription>One row per installment: amounts and dates can change every year.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="item-name">Name</Label>
            <Input id="item-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Car insurance" />
          </div>
          {rows.map((row, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <Input type="date" value={row.date} onChange={(event) => setRows(rows.map((r, i) => (i === index ? { ...r, date: event.target.value } : r)))} />
              <Input inputMode="decimal" placeholder="Amount €" value={row.amount} onChange={(event) => setRows(rows.map((r, i) => (i === index ? { ...r, amount: event.target.value } : r)))} />
              <Button variant="ghost" size="icon" onClick={() => setRows(rows.filter((_, i) => i !== index))} disabled={rows.length === 1}>
                <Trash className="h-4 w-4" />
                <span className="sr-only">Remove row</span>
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setRows([...rows, { date: "", amount: "" }])}>
            <Plus className="mr-1 h-4 w-4" /> Another installment
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button onClick={save} disabled={createItem.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Aggiunge o modifica una rata (data e importo previsto). */
function InstallmentDialog({ itemId, installment, open, onClose }: { itemId: number; installment: AnnualInstallment | null; open: boolean; onClose: () => void }) {
  const addInstallment = useAddInstallment();
  const updateInstallment = useUpdateInstallment();
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastOpened, setLastOpened] = useState<string | null>(null);

  const openKey = open ? (installment ? `edit-${installment.id}` : "new") : null;
  if (openKey !== lastOpened) {
    setLastOpened(openKey);
    setDate(installment ? installment.due_date.slice(0, 10) : "");
    setAmount(installment ? (installment.amount_cents / 100).toFixed(2) : "");
    setError(null);
  }

  const save = async () => {
    const cents = parseAmountToCents(amount);
    if (!date || cents === null || cents <= 0) {
      setError("Enter a date and a positive amount");
      return;
    }
    try {
      if (installment) await updateInstallment.mutateAsync({ id: installment.id, data: { due_date: date, amount_cents: cents } });
      else await addInstallment.mutateAsync({ itemId, data: { due_date: date, amount_cents: cents } });
      onClose();
    } catch {
      // il messaggio lo mostra la mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{installment ? "Edit installment" : "Add installment"}</DialogTitle>
          <DialogDescription>Expected date and amount.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <Input inputMode="decimal" placeholder="Amount €" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={addInstallment.isPending || updateInstallment.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Collega a mano la transazione che ha pagato la rata (o la scollega). Propone i movimenti entro
 * 45 giorni dalla scadenza, i piu' vicini per importo per primi.
 */
function PaymentDialog({ installment, onClose }: { installment: AnnualInstallment | null; onClose: () => void }) {
  const setPayment = useSetInstallmentPayment();
  const { data: list = EMPTY_LIST_RESPONSE } = useMovements();
  const [choice, setChoice] = useState<string>("");

  const candidates = useMemo(() => {
    if (!installment) return [];
    const due = new Date(`${installment.due_date.slice(0, 10)}T00:00:00`).getTime();
    const window = 45 * 24 * 3600 * 1000;
    return list.rows
      .filter((row) => row.date && Math.abs(new Date(row.date).getTime() - due) <= window)
      .sort(
        (a, b) =>
          Math.abs(absoluteAmount(a.amount) * 100 - installment.amount_cents) -
          Math.abs(absoluteAmount(b.amount) * 100 - installment.amount_cents)
      )
      .slice(0, 30);
  }, [installment, list.rows]);

  const close = () => {
    setChoice("");
    onClose();
  };

  return (
    <Dialog open={installment !== null} onOpenChange={(next) => !next && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
          <DialogDescription>
            {installment && `${euro(installment.amount_cents)} due on ${day(installment.due_date)}. `}
            Link the movement that paid it.
          </DialogDescription>
        </DialogHeader>
        <Select value={choice} onValueChange={setChoice}>
          <SelectTrigger>
            <SelectValue placeholder="Pick a movement…" />
          </SelectTrigger>
          <SelectContent>
            {candidates.map((row) => (
              <SelectItem key={row.id} value={String(row.id)}>
                {day(String(row.date))} · {euro(Math.round(absoluteAmount(row.amount) * 100))} · {String(row.description ?? "").slice(0, 40)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter className="gap-2">
          {installment?.paid && (
            <Button variant="outline" onClick={() => setPayment.mutate({ id: installment.id, transactionId: null }, { onSuccess: close })}>
              Mark as not paid
            </Button>
          )}
          <Button
            disabled={!choice || setPayment.isPending}
            onClick={() => installment && setPayment.mutate({ id: installment.id, transactionId: Number(choice) }, { onSuccess: close })}
          >
            Link payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
