"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys, useWallets } from "@/lib/hooks/useQueries";

export interface BankAutoImport {
  enabled: boolean;
  walletId: number | null;
  fromDate: string | null;
}

const DISABLED = "off";

interface AutoImportSettingsProps {
  bank: string;
  autoImport: BankAutoImport | null | undefined;
  onSaved: (autoImport: BankAutoImport) => void;
}

/**
 * Import automatico di una banca collegata (PUT /bank/connections/:bank/auto-import).
 * Ogni mattina il job del server importa i movimenti contabilizzati nel wallet scelto,
 * dalla data indicata in poi, con la categoria scelta dal modello o "Altro".
 */
export default function AutoImportSettings({ bank, autoImport, onSaved }: AutoImportSettingsProps) {
  const queryClient = useQueryClient();
  const { data: allWallets = [], isLoading: loadingWallets } = useWallets();
  // Una banca importa sempre in un conto: i movimenti dei salvadanai arrivano come trasferimenti
  // da assegnare (U5, deciso da Gio il 10/11). Il server rifiuta comunque un salvadanaio.
  const wallets = allWallets.filter((wallet) => wallet.kind !== "pot");
  const [walletValue, setWalletValue] = useState(DISABLED);
  const [fromDate, setFromDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setWalletValue(autoImport?.walletId != null ? String(autoImport.walletId) : DISABLED);
    setFromDate(autoImport?.fromDate ?? "");
  }, [autoImport?.walletId, autoImport?.fromDate]);

  const savedWallet = autoImport?.walletId != null ? String(autoImport.walletId) : DISABLED;
  const dirty = walletValue !== savedWallet || fromDate !== (autoImport?.fromDate ?? "");

  const save = async () => {
    setSaving(true);
    try {
      const enabling = walletValue !== DISABLED;
      const response = await apiFetch(`/bank/connections/${encodeURIComponent(bank)}/auto-import`, {
        method: "PUT",
        body: JSON.stringify({
          walletId: enabling ? Number(walletValue) : null,
          ...(fromDate ? { fromDate } : {}),
        }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : "Impossibile salvare l'import automatico";
        throw new Error(message);
      }
      const saved = (data as { autoImport: BankAutoImport }).autoImport;
      onSaved(saved);
      // Il tag "collegato alla banca" della pagina Wallets legge /bank/connections.
      void queryClient.invalidateQueries({ queryKey: queryKeys.bank.connections });
      toast.success(
        saved.enabled
          ? `Import automatico attivo${saved.fromDate ? ` dal ${new Date(`${saved.fromDate}T00:00:00`).toLocaleDateString("it-IT")}` : ""}`
          : "Import automatico disattivato"
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossibile salvare l'import automatico");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-border/70 pt-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <Bot className="h-3.5 w-3.5 text-primary" />
        Import automatico giornaliero
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Wallet</Label>
          <Select value={walletValue} onValueChange={setWalletValue} disabled={loadingWallets || saving}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Disattivato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DISABLED}>Disattivato</SelectItem>
              {wallets.map((wallet) => (
                <SelectItem key={wallet.id} value={String(wallet.id)}>
                  {wallet.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Dal</Label>
          <Input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            disabled={walletValue === DISABLED || saving}
            className="h-8 text-xs"
          />
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Solo movimenti contabilizzati. Categoria dalle tue regole, altrimenti &quot;Altro&quot;.
      </p>
      {dirty && (
        <Button size="sm" className="h-8 w-full" onClick={() => void save()} disabled={saving}>
          {saving ? "Salvo..." : "Salva"}
        </Button>
      )}
    </div>
  );
}
