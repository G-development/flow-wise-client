"use client";

import { useMemo, useState, useCallback } from "react";
import { DynamicTable } from "@/components/dynamic-table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/navbar";
import {
  useBankConnections,
  useBankInstitutions,
  useUpdateWallet,
  useWallets,
  type Wallet,
} from "@/lib/hooks/useQueries";
import { Badge } from "@/components/ui/badge";
import { Landmark } from "lucide-react";
import { toast } from "sonner";

/**
 * Il server parla in centesimi interi (`opening_balance_cents`, come la somma in
 * `utils/walletService.js`), l'utente digita euro. Accetta virgola o punto e un
 * segno (un'apertura negativa è un debito); rifiuta tutto il resto invece di
 * convertire un valore ambiguo in un importo plausibile.
 */
function parseAmountToCents(raw: string): number | null {
  const normalized = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
  }).format((Number.isFinite(cents) ? cents : 0) / 100);
}

function OpeningBalanceCell({
  wallet,
  saving,
  onSave,
}: {
  wallet: Wallet;
  saving: boolean;
  onSave: (wallet: Wallet, cents: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const currency = wallet.currency || "EUR";

  const startEditing = () => {
    setDraft((wallet.opening_balance_cents / 100).toFixed(2));
    setError(null);
    setEditing(true);
  };

  const commit = () => {
    const cents = parseAmountToCents(draft);
    if (cents === null) {
      setError("Enter a valid amount, e.g. 13264,23");
      return;
    }
    setEditing(false);
    onSave(wallet, cents);
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span>{formatCents(wallet.opening_balance_cents, currency)}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={startEditing}
          disabled={saving}
        >
          Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Input
          className="h-8 w-28"
          inputMode="decimal"
          value={draft}
          autoFocus
          aria-label={`Opening balance for ${wallet.name}`}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit();
            if (event.key === "Escape") setEditing(false);
          }}
        />
        <Button size="sm" onClick={commit} disabled={saving}>
          Save
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditing(false)}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}

export default function Wallets() {
  const { data: wallets = [], isLoading, isError } = useWallets();
  const updateWallet = useUpdateWallet();
  const [changingId, setChangingId] = useState<string | null>(null);

  const handleSetDefault = useCallback(async (wallet: Wallet) => {
    // Se il wallet è già default, non fare nulla
    if (wallet.is_default) {
      return;
    }

    setChangingId(wallet.id);
    try {
      // Il server si occupa automaticamente di disattivare gli altri wallet
      await updateWallet.mutateAsync({
        id: wallet.id,
        data: { is_default: true },
      });

      toast.success("Default wallet updated");
    } catch {
      toast.error("Failed to update wallet");
    } finally {
      setChangingId(null);
    }
  }, [updateWallet]);

  const handleOpeningBalanceSave = useCallback(
    async (wallet: Wallet, cents: number) => {
      setChangingId(wallet.id);
      try {
        // La cache dei wallet è invalidata dalla mutation: il `balance` riletto
        // dal server è già ricalcolato con la nuova apertura.
        await updateWallet.mutateAsync({
          id: wallet.id,
          data: { opening_balance_cents: cents },
        });
        toast.success("Opening balance updated");
      } catch {
        toast.error("Failed to update opening balance");
      } finally {
        setChangingId(null);
      }
    },
    [updateWallet]
  );

  // Un wallet e' "collegato alla banca" quando e' il wallet di destinazione dell'import
  // automatico di una banca (Your Bank -> Import automatico giornaliero).
  const { data: bankConnections = [] } = useBankConnections();
  const { data: institutions = [] } = useBankInstitutions();
  const linkedBanksByWallet = useMemo(() => {
    const nameById = new Map(institutions.map((inst) => [inst.id, inst.name]));
    const map = new Map<string, string[]>();
    for (const connection of bankConnections) {
      const walletId = connection.autoImport?.walletId;
      if (walletId == null) continue;
      const names = map.get(String(walletId)) ?? [];
      names.push(nameById.get(connection.bank) ?? connection.bank);
      map.set(String(walletId), names);
    }
    return map;
  }, [bankConnections, institutions]);

  const rows = useMemo(() => {
    const formatCurrency = (wallet: Wallet) => {
      const currency = wallet.currency || "EUR";
      // `balance` e' il saldo derivato restituito da GET /wallet, non una colonna memorizzata.
      return new Intl.NumberFormat("it-IT", { style: "currency", currency }).format(wallet.balance);
    };

    return wallets.map((w, idx) => ({
      "#": idx + 1,
      Name: w.name,
      Bank: (() => {
        const banks = linkedBanksByWallet.get(String(w.id));
        return banks ? (
          <Badge
            variant="outline"
            className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            title="Bank transactions are auto-imported into this wallet"
          >
            <Landmark className="h-3 w-3" /> Linked to {banks.join(", ")}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Not linked
          </Badge>
        );
      })(),
      Balance: formatCurrency(w),
      "Opening balance": (
        <OpeningBalanceCell
          wallet={w}
          saving={changingId === w.id}
          onSave={handleOpeningBalanceSave}
        />
      ),
      Default: (
        <Switch
          checked={w.is_default}
          onCheckedChange={() => handleSetDefault(w)}
          disabled={w.is_default || changingId === w.id || updateWallet.isPending}
        />
      ),
    }));
  }, [wallets, changingId, updateWallet.isPending, handleSetDefault, handleOpeningBalanceSave, linkedBanksByWallet]);

  return (
    <>
      <Navbar />
      <main className="app-page">
        {/* Header */}
        <div className="app-page-header">
          <div>
            <h1 className="page-title">Wallets</h1>
            <p className="page-description">
              Manage your wallets and accounts
            </p>
          </div>
        </div>

        {/* Loading & Error States */}
        {isLoading && (
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Loading wallets...</p>
          </div>
        )}

        {isError && (
          <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
            <p className="text-destructive font-medium">Error loading wallets</p>
          </div>
        )}

        {!isLoading && !isError && wallets.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <p className="text-muted-foreground mb-4">No wallets yet</p>
            <p className="text-sm text-muted-foreground">You can create up to 3 wallets</p>
          </div>
        )}

        {/* Table */}
        {!isLoading && !isError && wallets.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-border/70 bg-card shadow-sm">
            <DynamicTable
              data={rows}
              caption={`You can create up to 3 wallets. You currently have ${wallets.length}. Balance is derived from movements, starting from the opening balance.`}
            />
          </div>
        )}
      </main>
    </>
  );
}
