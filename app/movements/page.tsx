"use client";

import { Suspense, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/navbar";
import NewTransaction from "@/components/new-transaction";
import DeleteDialog from "@/components/delete-dialog";
import { PeriodPicker } from "@/components/period-picker";
import { TruncatedNotice } from "@/components/truncated-notice";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MovementDayList, formatEuro } from "@/components/movements/movement-list";
import { MovementSheet } from "@/components/movements/movement-sheet";
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
import {
  MOVEMENT_TYPES,
  filterMovements,
  groupMovementsByDay,
  movementTotals,
  searchMovements,
  parseMovementFilters,
  serializeMovementFilters,
  walletPeriodTotals,
  type MovementFilters,
  type MovementType,
} from "@/lib/movements";
import { format } from "date-fns";
import { Search } from "lucide-react";

// Giorno locale, non UTC: `toISOString()` sposta la mezzanotte italiana al giorno prima
// (1 novembre 00:00 CET = 31 ottobre 23:00 UTC) e allargava il periodo di un giorno.
const toIsoDay = (date?: Date) => (date ? format(date, "yyyy-MM-dd") : undefined);

/**
 * Movements: wallet, entrate, spese e trasferimenti in una pagina sola (sostituisce
 * Incomes, Expenses, Transfers e Wallets). I filtri stanno nell'indirizzo
 * (`?types=I,E&wallets=1`), così i vecchi indirizzi portano qui con il filtro giusto.
 *
 * Ridisegnata il 15/11/2026 con Gio, pensando prima al telefono: periodo e totali, poi i
 * trasferimenti da sistemare, filtri compatti con ricerca, elenco per giorno con il dettaglio
 * a un tocco, e i wallet in fondo come schede scorrevoli.
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

  const { dateRange } = useDateRange();
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

  // Tipo a segmenti: "All" = tutti i tipi, altrimenti uno solo (un rimborso sta con le spese).
  const typeValue: "all" | MovementType = filters.types.size === 1 ? [...filters.types][0] : "all";
  const setType = (value: string) =>
    setFilters({ ...filters, types: value === "all" ? new Set(MOVEMENT_TYPES) : new Set([value as MovementType]) });

  // Wallet: tutti o uno solo (anche un salvadanaio).
  const walletValue = singleWalletId ?? "all";
  const setWallet = (value: string) => setFilters({ ...filters, wallets: value === "all" ? null : new Set([value]) });

  // Clic su una scheda wallet: solo quel wallet; di nuovo sulla stessa: tutti.
  const focusWallet = (walletId: string) => setWallet(singleWalletId === walletId ? "all" : walletId);

  const [query, setQuery] = useState("");
  const [opened, setOpened] = useState<Transaction | null>(null);

  const categoryById = useMemo(() => new Map(categoryList.rows.map((c) => [String(c.id), c])), [categoryList.rows]);
  const walletById = useMemo(() => new Map(wallets.map((w) => [String(w.id), w])), [wallets]);
  const walletLabel = (wallet: (typeof wallets)[number]) => {
    if (wallet.kind !== "pot" || wallet.parent_wallet_id == null) return wallet.name;
    return `${wallet.name} · ${walletById.get(String(wallet.parent_wallet_id))?.name ?? "pot"}`;
  };

  const found = useMemo(
    () => searchMovements(visible, query, (m) => String(categoryById.get(String(m.category_id))?.name ?? "")),
    [visible, query, categoryById]
  );
  const groups = useMemo(() => groupMovementsByDay(found, singleWalletId), [found, singleWalletId]);
  const shownTotals = query.trim() ? movementTotals(found, singleWalletId) : totals;

  return (
    <main className="app-page">
      <div className="mx-auto max-w-3xl space-y-5">
        {/* 1. Titolo e periodo */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="page-title">Movements</h1>
            <p className="page-description">Everything that comes in, goes out or moves between your wallets</p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <PeriodPicker />
            {/* Su mobile c'e' gia' il + della barra in basso (navbar): qui solo da desktop. */}
            <div className="hidden lg:block">
              <NewTransaction />
            </div>
          </div>
        </div>

        {/* 2. Totali del periodo (e della ricerca, se c'e') */}
        <section className="grid grid-cols-3 gap-2 sm:gap-3">
          <Total label="Income" value={shownTotals.income} className="text-success" />
          <Total label="Expenses" value={shownTotals.expense} />
          <Total label="Net" value={shownTotals.net} className={shownTotals.net < 0 ? "text-destructive" : "text-success"} />
          {shownTotals.transfersIn !== null && <Total label="Transfers in" value={shownTotals.transfersIn} />}
          {shownTotals.transfersOut !== null && <Total label="Transfers out" value={shownTotals.transfersOut} />}
        </section>

        {/* 3. Da sistemare: trasferimenti arrivati dalla banca senza l'altro lato (solo se ci sono) */}
        <PendingTransfers transfers={transferList.rows as Transaction[]} wallets={wallets} />

        {/* 4. Filtri compatti e ricerca */}
        <section className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Tabs value={typeValue} onValueChange={setType} className="sm:flex-1">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="I">Income</TabsTrigger>
                <TabsTrigger value="E">Expenses</TabsTrigger>
                <TabsTrigger value="T">Transfers</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={walletValue} onValueChange={setWallet}>
              <SelectTrigger className="sm:w-56" aria-label="Wallet">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All wallets</SelectItem>
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={String(wallet.id)}>
                    {walletLabel(wallet)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search shop, description, note or category"
              className="pl-9"
              aria-label="Search movements"
            />
          </div>
        </section>

        {list.truncated && <TruncatedNotice shown={list.count} total={list.total} />}

        {/* 5. Elenco per giorno */}
        {isError ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Error loading movements
          </p>
        ) : isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {query.trim() ? "No movement matches your search." : "No movements in this period."}
          </div>
        ) : (
          <>
            <p className="px-1 text-xs text-muted-foreground">
              {found.length} {found.length === 1 ? "movement" : "movements"}
            </p>
            <MovementDayList
              groups={groups}
              categories={categoryById}
              wallets={walletById}
              singleWalletId={singleWalletId}
              onOpen={setOpened}
            />
          </>
        )}

        {/* 6. Wallet in fondo: schede scorrevoli; un tocco filtra l'elenco su quel wallet */}
        <section className="space-y-2 pt-2">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Wallets</h2>
          <WalletCards cards={cards} selectedWalletIds={filters.wallets} onToggleWallet={focusWallet} layout="row" />
        </section>
      </div>

      <MovementSheet
        movement={opened}
        categories={categoryById}
        wallets={walletById}
        onClose={() => setOpened(null)}
        onEdit={(movement) => {
          setOpened(null);
          setEditing(movement);
        }}
        onDelete={(movement) => {
          setOpened(null);
          setDeleteId(String(movement.id));
        }}
      />

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
    <div className="rounded-2xl border border-border/70 bg-card px-3 py-2.5 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`truncate text-base font-semibold tabular-nums sm:text-lg ${className}`}>{formatEuro(value)}</p>
    </div>
  );
}
