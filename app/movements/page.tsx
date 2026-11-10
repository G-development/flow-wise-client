"use client";

import { Suspense, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/navbar";
import NewTransaction from "@/components/new-transaction";
import DeleteDialog from "@/components/delete-dialog";
import DatePickerWithRange from "@/components/date-picker";
import { DynamicTable } from "@/components/dynamic-table";
import { TruncatedNotice } from "@/components/truncated-notice";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PendingTransfers } from "@/components/movements/pending-transfers";
import { WalletCards, type WalletCardInfo } from "@/components/movements/wallet-cards";
import {
  useBankConnections,
  useBankInstitutions,
  useCategories,
  useDeleteTransaction,
  useMovements,
  useTransfers,
  useWallets,
  type Transaction,
} from "@/lib/hooks/useQueries";
import { EMPTY_LIST_RESPONSE } from "@/lib/listResponse";
import { useDateRange } from "@/lib/providers/DateRangeProvider";
import { absoluteAmount } from "@/lib/amount";
import {
  MOVEMENT_TYPES,
  filterMovements,
  movementDirection,
  movementTotals,
  parseMovementFilters,
  serializeMovementFilters,
  walletPeriodTotals,
  type MovementFilters,
  type MovementType,
} from "@/lib/movements";
import { ArrowRight, Pencil, Trash } from "lucide-react";

const TYPE_LABELS: Record<MovementType, string> = { I: "Income", E: "Expense", T: "Transfer" };
const formatEuro = (value: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);
const toIsoDay = (date?: Date) => date?.toISOString().split("T")[0];

/**
 * Movements: wallet, entrate, spese e trasferimenti in una pagina sola (sostituisce
 * Incomes, Expenses, Transfers e Wallets). I filtri stanno nell'indirizzo
 * (`?types=I,E&wallets=1`), così i vecchi indirizzi portano qui con il filtro giusto.
 */
export default function MovementsPage() {
  // `useSearchParams` richiede un confine di Suspense per la build statica di Next.
  return (
    <>
      <Navbar />
      <Suspense fallback={<main className="app-page"><p className="text-muted-foreground">Loading…</p></main>}>
        <Movements />
      </Suspense>
    </>
  );
}

function Movements() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseMovementFilters(searchParams), [searchParams]);
  const setFilters = (next: MovementFilters) => {
    const query = serializeMovementFilters(next).toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const { dateRange, setDateRange } = useDateRange();
  const { data: list = EMPTY_LIST_RESPONSE, isLoading, isError } = useMovements(
    toIsoDay(dateRange?.from),
    toIsoDay(dateRange?.to)
  );
  const { data: transferList = EMPTY_LIST_RESPONSE } = useTransfers();
  const { data: wallets = [] } = useWallets();
  const { data: categoryList = EMPTY_LIST_RESPONSE } = useCategories();
  const { data: bankConnections = [] } = useBankConnections();
  const { data: institutions = [] } = useBankInstitutions();
  const deleteTransaction = useDeleteTransaction();

  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const movements = list.rows as Transaction[];
  const visible = useMemo(() => filterMovements(movements, filters), [movements, filters]);
  const singleWalletId = filters.wallets !== null && filters.wallets.size === 1 ? [...filters.wallets][0] : null;
  const totals = movementTotals(visible, singleWalletId);

  // Un wallet e' "collegato alla banca" quando riceve l'import automatico di una banca.
  const cards: WalletCardInfo[] = useMemo(() => {
    const institutionById = new Map(institutions.map((inst) => [inst.id, inst]));
    const bankByWallet = new Map<string, { name: string; logo?: string | null }>();
    for (const connection of bankConnections) {
      const walletId = connection.autoImport?.walletId;
      if (walletId == null) continue;
      const institution = institutionById.get(connection.bank);
      bankByWallet.set(String(walletId), { name: institution?.name ?? connection.bank, logo: institution?.logo });
    }
    return wallets.map((wallet) => ({
      wallet,
      bank: bankByWallet.get(String(wallet.id)) ?? null,
      ...walletPeriodTotals(movements, String(wallet.id)),
    }));
  }, [wallets, bankConnections, institutions, movements]);

  const toggleType = (type: MovementType, checked: boolean) => {
    const types = new Set(filters.types);
    if (checked) types.add(type);
    else types.delete(type);
    setFilters({ ...filters, types });
  };

  const toggleWallet = (walletId: string, checked: boolean) => {
    const current = filters.wallets ?? new Set(wallets.map((w) => String(w.id)));
    const next = new Set(current);
    if (checked) next.add(walletId);
    else next.delete(walletId);
    // Tutti selezionati = nessun filtro: un wallet creato dopo compare da solo.
    const all = wallets.every((w) => next.has(String(w.id)));
    setFilters({ ...filters, wallets: all ? null : next });
  };

  // Clic su una card: solo quel wallet; di nuovo sulla stessa: tutti.
  const focusWallet = (walletId: string) => {
    const already = singleWalletId === walletId;
    setFilters({ ...filters, wallets: already ? null : new Set([walletId]) });
  };

  const rows = useMemo(() => {
    const walletName = new Map(wallets.map((w) => [String(w.id), w.name]));
    const categoryName = new Map(categoryList.rows.map((c) => [String(c.id), c.name]));
    const name = (id: number | null | undefined) => (id == null ? "?" : walletName.get(String(id)) ?? `#${id}`);
    return visible.map((movement) => {
      const direction = movementDirection(movement, singleWalletId);
      const sign = direction === "in" ? "+ " : direction === "out" ? "− " : "";
      const color = direction === "in" ? "text-success" : direction === "out" ? "text-destructive" : "text-foreground";
      return {
        Id: movement.id,
        Date: movement.date ? new Date(movement.date).toLocaleDateString("it-IT") : "-",
        // Le descrizioni della banca sono lunghe (codici, IBAN): due righe, il resto nel tooltip.
        Description: (
          <span className="line-clamp-2 max-w-[28rem] break-words" title={movement.description || undefined}>
            {movement.description || "-"}
          </span>
        ),
        Category: categoryName.get(String(movement.category_id)) ?? "-",
        Wallet:
          movement.type === "T" ? (
            <span className="inline-flex items-center gap-1">
              {name(movement.wallet_id)} <ArrowRight className="h-3 w-3" /> {name(movement.to_wallet_id)}
            </span>
          ) : (
            name(movement.wallet_id)
          ),
        Amount: (
          <span className={`whitespace-nowrap font-medium tabular-nums ${color}`}>
            {sign}
            {formatEuro(absoluteAmount(movement.amount))}
          </span>
        ),
      } as Record<string, unknown>;
    });
  }, [visible, wallets, categoryList.rows, singleWalletId]);

  return (
    <main className="app-page">
      <div className="app-page-header">
        <div>
          <h1 className="page-title">Movements</h1>
          <p className="page-description">Wallets, income, expenses and transfers in one place</p>
        </div>
        <NewTransaction />
      </div>

      <WalletCards cards={cards} selectedWalletIds={filters.wallets} onToggleWallet={focusWallet} />

      <PendingTransfers transfers={transferList.rows as Transaction[]} wallets={wallets} />

      {/* Filtri */}
      <section className="mb-4 flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <fieldset className="flex flex-wrap items-center gap-4">
            <legend className="sr-only">Type</legend>
            {MOVEMENT_TYPES.map((type) => (
              <Label key={type} className="flex cursor-pointer items-center gap-2 font-normal">
                <Checkbox checked={filters.types.has(type)} onCheckedChange={(checked) => toggleType(type, checked === true)} />
                {TYPE_LABELS[type]}
              </Label>
            ))}
          </fieldset>
          <fieldset className="flex flex-wrap items-center gap-4">
            <legend className="sr-only">Wallets</legend>
            {wallets.map((wallet) => {
              const id = String(wallet.id);
              return (
                <Label key={id} className="flex cursor-pointer items-center gap-2 font-normal">
                  <Checkbox
                    checked={filters.wallets === null || filters.wallets.has(id)}
                    onCheckedChange={(checked) => toggleWallet(id, checked === true)}
                  />
                  {wallet.name}
                </Label>
              );
            })}
          </fieldset>
        </div>
        <DatePickerWithRange date={dateRange} dateChange={setDateRange} />
      </section>

      {/* Totali della selezione */}
      <section className="mb-4 grid grid-cols-3 gap-3 text-sm sm:max-w-xl">
        <Total label="Income" value={totals.income} className="text-success" />
        <Total label="Expense" value={totals.expense} className="text-destructive" />
        <Total label="Net" value={totals.net} />
        {totals.transfersIn !== null && <Total label="Transfers in" value={totals.transfersIn} />}
        {totals.transfersOut !== null && <Total label="Transfers out" value={totals.transfersOut} />}
      </section>

      {list.truncated && <TruncatedNotice shown={list.count} total={list.total} className="mb-4" />}

      {isError ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="font-medium text-destructive">Error loading movements</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/70 bg-card shadow-sm">
          <DynamicTable
            data={rows}
            isLoading={isLoading}
            hiddenColumns={["Id"]}
            caption={`${rows.length} movement${rows.length === 1 ? "" : "s"} in the selection.`}
            renderActions={(row) => (
              <div className="flex justify-end gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setEditing(visible.find((m) => String(m.id) === String(row.Id)) ?? null)}
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleteId(String(row.Id))}
                >
                  <Trash className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            )}
          />
        </div>
      )}

      <NewTransaction
        transaction={editing}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      />

      <DeleteDialog
        isOpen={deleteId !== null}
        title="Delete movement"
        description="The movement is removed and the wallet balances go back as before. This cannot be undone."
        onClose={() => setDeleteId(null)}
        isPending={deleteTransaction.isPending}
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await deleteTransaction.mutateAsync(deleteId);
          } finally {
            setDeleteId(null);
          }
        }}
      />
    </main>
  );
}

function Total({ label, value, className = "" }: { label: string; value: number; className?: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-card px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-semibold tabular-nums ${className}`}>{formatEuro(value)}</p>
    </div>
  );
}
