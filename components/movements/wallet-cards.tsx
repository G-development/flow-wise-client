"use client";

import { useState } from "react";
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
import { MoreVertical, Plus, Wallet as WalletIcon } from "lucide-react";

/** Wallet massimi per utente: il limite lo impone il database (migrazione 004). */
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

/**
 * Card dei wallet in cima alla pagina Movements: logo della banca, saldo, entrate e spese
 * del periodo, azioni (modifica, default, elimina). Cliccare una card filtra la tabella
 * su quel wallet; cliccarla di nuovo torna a tutti.
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
  const [deleting, setDeleting] = useState<Wallet | null>(null);
  const updateWallet = useUpdateWallet();
  const deleteWallet = useDeleteWallet();

  const onlySelected = (walletId: string) =>
    selectedWalletIds !== null && selectedWalletIds.size === 1 && selectedWalletIds.has(walletId);

  return (
    <>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ wallet, bank, income, expense }) => {
          const id = String(wallet.id);
          const selected = onlySelected(id);
          return (
            <div
              key={id}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              onClick={() => onToggleWallet(id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onToggleWallet(id);
                }
              }}
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
                    <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      <span className="truncate">{bank ? bank.name : "Not linked"}</span>
                      {wallet.is_default && (
                        <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-normal">Default</Badge>
                      )}
                    </p>
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
          disabled={cards.length >= MAX_WALLETS}
          title={cards.length >= MAX_WALLETS ? `You can create up to ${MAX_WALLETS} wallets` : undefined}
          className="flex min-h-[132px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-5 w-5" />
          {cards.length >= MAX_WALLETS ? `Limit of ${MAX_WALLETS} wallets reached` : "Add wallet"}
        </button>
      </div>

      <WalletDialog wallet={editing} open={editing !== null || creating} onClose={() => { setEditing(null); setCreating(false); }} />

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

/** Crea un wallet (solo il nome) o ne modifica nome e saldo di apertura. */
function WalletDialog({ wallet, open, onClose }: { wallet: Wallet | null; open: boolean; onClose: () => void }) {
  const createWallet = useCreateWallet();
  const updateWallet = useUpdateWallet();
  const [name, setName] = useState("");
  const [opening, setOpening] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastOpened, setLastOpened] = useState<string | null>(null);

  // Ripopola il modulo ogni volta che si apre (per un wallet diverso o per uno nuovo).
  const openKey = open ? (wallet ? `edit-${wallet.id}` : "new") : null;
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
          <DialogTitle>{wallet ? "Edit wallet" : "Add wallet"}</DialogTitle>
          <DialogDescription>
            {wallet
              ? "The balance is derived from movements, starting from the opening balance."
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
