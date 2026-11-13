"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeleteDialog from "@/components/delete-dialog";
import {
  useCreateWallet,
  useDeleteWallet,
  useUpdateWallet,
  type Wallet,
} from "@/lib/hooks/useQueries";
import { usePotCaps } from "@/lib/hooks/useAnnualPlan";
import { MoreVertical, PiggyBank, Plus, Wallet as WalletIcon } from "lucide-react";

/** Conti massimi per utente: il limite lo impone il database (migrazioni 004 e 012; i salvadanai non contano). */
const MAX_WALLETS = 3;

const formatEuro = (value: number, currency = "EUR") =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency }).format(Number.isFinite(value) ? value : 0);

/**
 * Il server parla in centesimi interi (`opening_balance_cents`), l'utente digita euro.
 * Accetta virgola o punto e un segno (un'apertura negativa è un debito); rifiuta il resto
 * invece di convertire un valore ambiguo in un importo plausibile.
 */
export function parseAmountToCents(raw: string): number | null {
  const normalized = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

export type WalletCardInfo = {
  wallet: Wallet;
  /** Banca collegata (import automatico verso questo wallet), se c'è. */
  bank: { name: string; logo?: string | null } | null;
  income: number;
  expense: number;
};

const isPot = (wallet: Wallet) => wallet.kind === "pot";

/**
 * Card dei wallet in cima alla pagina Movements: logo della banca, saldo, entrate e spese
 * del periodo, azioni (modifica, default, elimina). Cliccare una card filtra la tabella
 * su quel wallet; cliccarla di nuovo torna a tutti.
 *
 * I salvadanai (migrazione 012) non hanno una card grande: compaiono come card piccole sotto
 * il loro conto, e si creano dal menu del conto ("Add savings pot").
 */
export function WalletCards({
  cards,
  selectedWalletIds,
  onToggleWallet,
}: {
  cards: WalletCardInfo[];
  selectedWalletIds: ReadonlySet<string> | null;
  onToggleWallet: (walletId: string) => void;
}) {
  const [editing, setEditing] = useState<Wallet | null>(null);
  const [creating, setCreating] = useState(false);
  const [creatingPotFor, setCreatingPotFor] = useState<Wallet | null>(null);
  const [deleting, setDeleting] = useState<Wallet | null>(null);
  const [cappingPot, setCappingPot] = useState<Wallet | null>(null);
  const updateWallet = useUpdateWallet();
  const deleteWallet = useDeleteWallet();
  const { caps, planById } = usePotCaps(cards.map((card) => card.wallet));

  const onlySelected = (walletId: string) =>
    selectedWalletIds !== null && selectedWalletIds.size === 1 && selectedWalletIds.has(walletId);

  const accounts = cards.filter((card) => !isPot(card.wallet));
  const potsByAccount = new Map<string, Wallet[]>();
  for (const { wallet } of cards) {
    if (!isPot(wallet) || wallet.parent_wallet_id == null) continue;
    const list = potsByAccount.get(String(wallet.parent_wallet_id)) ?? [];
    list.push(wallet);
    potsByAccount.set(String(wallet.parent_wallet_id), list);
  }

  const cardKeyHandler = (id: string) => (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggleWallet(id);
    }
  };

  return (
    <>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {accounts.map(({ wallet, bank, income, expense }) => {
          const id = String(wallet.id);
          const selected = onlySelected(id);
          return (
            <div
              key={id}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              onClick={() => onToggleWallet(id)}
              onKeyDown={cardKeyHandler(id)}
              className={`flex cursor-pointer flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/50 ${
                selected ? "border-primary ring-2 ring-primary/30" : "border-border/70"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  {bank?.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- logo esterno di GoCardless, dimensione fissa
                    <img src={bank.logo} alt="" className="h-9 w-9 shrink-0 rounded-md bg-white object-contain p-0.5" />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <WalletIcon className="h-5 w-5" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium">{wallet.name}</p>
                    {/* div, non p: il Badge e' un div e dentro un <p> rompe l'idratazione di React. */}
                    <div className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      <span className="truncate">{bank ? bank.name : "Not linked"}</span>
                      {wallet.is_default && (
                        <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-normal">Default</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${wallet.name}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setEditing(wallet)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setCreatingPotFor(wallet)}>Add savings pot</DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={wallet.is_default || updateWallet.isPending}
                        onSelect={() => updateWallet.mutate({ id: wallet.id, data: { is_default: true } })}
                      >
                        Set as default
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onSelect={() => setDeleting(wallet)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <p className="text-2xl font-semibold tabular-nums">{formatEuro(wallet.balance, wallet.currency || "EUR")}</p>
              <div className="flex gap-4 text-xs text-muted-foreground tabular-nums">
                <span className="text-success">+ {formatEuro(income)}</span>
                <span className="text-destructive">− {formatEuro(expense)}</span>
                <span className="ml-auto">in period</span>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => setCreating(true)}
          disabled={accounts.length >= MAX_WALLETS}
          title={accounts.length >= MAX_WALLETS ? `You can create up to ${MAX_WALLETS} wallets` : undefined}
          className="flex min-h-[132px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-5 w-5" />
          {accounts.length >= MAX_WALLETS ? `Limit of ${MAX_WALLETS} wallets reached` : "Add wallet"}
        </button>
      </div>

      {/* Salvadanai, raggruppati sotto il loro conto */}
      {accounts.map(({ wallet: account }) => {
        const pots = potsByAccount.get(String(account.id)) ?? [];
        if (pots.length === 0) return null;
        return (
          <section key={`pots-${account.id}`} className="mb-6">
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">Savings pots · {account.name}</h2>
            <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {pots.map((pot) => {
                const id = String(pot.id);
                const selected = onlySelected(id);
                return (
                  <div
                    key={id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selected}
                    onClick={() => onToggleWallet(id)}
                    onKeyDown={cardKeyHandler(id)}
                    className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 shadow-sm transition-colors hover:border-primary/50 ${
                      selected ? "border-primary ring-2 ring-primary/30" : "border-border/70"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <PiggyBank className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{pot.name}</p>
                        <p className="text-sm font-semibold tabular-nums">
                          {formatEuro(pot.balance, pot.currency || "EUR")}
                          {caps.get(id) != null && (
                            <span className="font-normal text-muted-foreground"> / {formatEuro((caps.get(id) ?? 0) / 100)}</span>
                          )}
                        </p>
                        {(planById.get(id)?.items.length ?? 0) > 0 && (
                          <p className="text-xs text-muted-foreground tabular-nums">
                            Deposit this month {formatEuro((planById.get(id)?.plan.suggestedMonthlyCents ?? 0) / 100)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div onClick={(event) => event.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Actions for ${pot.name}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setEditing(pot)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setCappingPot(pot)}>Set cap</DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/annual-plan?wallet=${id}`}>Annual plan</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onSelect={() => setDeleting(pot)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <WalletDialog
        wallet={editing}
        parentAccount={creatingPotFor}
        open={editing !== null || creating || creatingPotFor !== null}
        onClose={() => {
          setEditing(null);
          setCreating(false);
          setCreatingPotFor(null);
        }}
      />

      <CapDialog pot={cappingPot} onClose={() => setCappingPot(null)} />

      <DeleteDialog
        isOpen={deleting !== null}
        title="Delete wallet"
        description={`Delete "${deleting?.name ?? ""}"? A wallet with movements cannot be deleted: reassign or remove them first.`}
        onClose={() => setDeleting(null)}
        isPending={deleteWallet.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteWallet.mutateAsync(deleting.id);
          } catch {
            // il messaggio d'errore lo mostra la mutation
          } finally {
            setDeleting(null);
          }
        }}
      />
    </>
  );
}

/**
 * Crea un conto o un salvadanaio (con `parentAccount`), oppure modifica nome e saldo di
 * apertura di un wallet esistente.
 */
function WalletDialog({
  wallet,
  parentAccount,
  open,
  onClose,
}: {
  wallet: Wallet | null;
  parentAccount: Wallet | null;
  open: boolean;
  onClose: () => void;
}) {
  const createWallet = useCreateWallet();
  const updateWallet = useUpdateWallet();
  const [name, setName] = useState("");
  const [opening, setOpening] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastOpened, setLastOpened] = useState<string | null>(null);

  // Ripopola il modulo ogni volta che si apre (per un wallet diverso o per uno nuovo).
  const openKey = open ? (wallet ? `edit-${wallet.id}` : parentAccount ? `pot-${parentAccount.id}` : "new") : null;
  if (openKey !== lastOpened) {
    setLastOpened(openKey);
    setName(wallet?.name ?? "");
    setOpening(wallet ? (wallet.opening_balance_cents / 100).toFixed(2) : "");
    setError(null);
  }

  const save = async () => {
    if (!name.trim()) {
      setError("Enter a name");
      return;
    }
    try {
      if (wallet) {
        const cents = parseAmountToCents(opening);
        if (cents === null) {
          setError("Enter a valid opening balance, e.g. 1140,52");
          return;
        }
        await updateWallet.mutateAsync({ id: wallet.id, data: { name: name.trim(), opening_balance_cents: cents } });
      } else if (parentAccount) {
        await createWallet.mutateAsync({ name: name.trim(), kind: "pot", parent_wallet_id: Number(parentAccount.id) });
      } else {
        await createWallet.mutateAsync({ name: name.trim() });
      }
      onClose();
    } catch {
      // il messaggio d'errore lo mostra la mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {wallet ? "Edit wallet" : parentAccount ? `Add savings pot to ${parentAccount.name}` : "Add wallet"}
          </DialogTitle>
          <DialogDescription>
            {wallet
              ? "The balance is derived from movements, starting from the opening balance."
              : parentAccount
                ? "Money moves in and out of a savings pot with transfers. Pots don't count toward the 3-wallet limit."
                : "You can set the opening balance after creating it."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="wallet-name">Name</Label>
            <Input id="wallet-name" value={name} onChange={(event) => { setName(event.target.value); setError(null); }} />
          </div>
          {wallet && (
            <div className="grid gap-2">
              <Label htmlFor="wallet-opening">Opening balance (EUR)</Label>
              <Input
                id="wallet-opening"
                inputMode="decimal"
                value={opening}
                onChange={(event) => { setOpening(event.target.value); setError(null); }}
              />
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={createWallet.isPending || updateWallet.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Tetto di un salvadanaio: nessuno, fisso (in euro) o "dal piano" (somma delle rate dei
 * prossimi 12 mesi, calcolata dal server). Superarlo produce solo un avviso.
 */
function CapDialog({ pot, onClose }: { pot: Wallet | null; onClose: () => void }) {
  const updateWallet = useUpdateWallet();
  const [mode, setMode] = useState<"none" | "fixed" | "plan">("none");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastOpened, setLastOpened] = useState<string | null>(null);

  const openKey = pot ? String(pot.id) : null;
  if (openKey !== lastOpened) {
    setLastOpened(openKey);
    setMode(pot?.cap_from_plan ? "plan" : pot?.cap_cents != null ? "fixed" : "none");
    setAmount(pot?.cap_cents != null ? (pot.cap_cents / 100).toFixed(2) : "");
    setError(null);
  }

  const save = async () => {
    if (!pot) return;
    let data: { cap_cents: number | null; cap_from_plan: boolean } = { cap_cents: null, cap_from_plan: false };
    if (mode === "plan") data = { cap_cents: null, cap_from_plan: true };
    if (mode === "fixed") {
      const cents = parseAmountToCents(amount);
      if (cents === null || cents <= 0) {
        setError("Enter a positive amount, e.g. 1000");
        return;
      }
      data = { cap_cents: cents, cap_from_plan: false };
    }
    try {
      await updateWallet.mutateAsync({ id: pot.id, data });
      onClose();
    } catch {
      // il messaggio d'errore lo mostra la mutation
    }
  };

  const options = [
    { value: "none", label: "No cap" },
    { value: "fixed", label: "Fixed amount" },
    { value: "plan", label: "From the annual plan (next 12 months of installments)" },
  ] as const;

  return (
    <Dialog open={pot !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cap for {pot?.name}</DialogTitle>
          <DialogDescription>The most this pot should hold. Going over it shows a warning, nothing is blocked.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {options.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm">
              <input type="radio" name="cap-mode" checked={mode === option.value} onChange={() => { setMode(option.value); setError(null); }} />
              {option.label}
            </label>
          ))}
          {mode === "fixed" && (
            <Input inputMode="decimal" aria-label="Cap (EUR)" placeholder="1000" value={amount} onChange={(event) => { setAmount(event.target.value); setError(null); }} />
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={updateWallet.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
