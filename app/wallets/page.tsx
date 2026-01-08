"use client";

import { useMemo, useState, useCallback } from "react";
import { DynamicTable } from "@/components/dynamic-table";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/navbar";
import { useWallets, useUpdateWallet } from "@/lib/hooks/useQueries";
import { toast } from "sonner";

interface Wallet {
  id: string;
  name: string;
  balance: number;
  currency: string;
  is_default: boolean;
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

  const rows = useMemo(() => {
    const formatCurrency = (wallet: Wallet) => {
      const currency = wallet.currency || "EUR";
      const amount = typeof wallet.balance === "number" ? wallet.balance : Number(wallet.balance) || 0;
      return new Intl.NumberFormat("it-IT", { style: "currency", currency }).format(amount);
    };

    return wallets.map((w, idx) => ({
      "#": idx + 1,
      Name: w.name,
      Balance: formatCurrency(w),
      Default: (
        <Switch
          checked={w.is_default}
          onCheckedChange={() => handleSetDefault(w)}
          disabled={w.is_default || changingId === w.id || updateWallet.isPending}
        />
      ),
    }));
  }, [wallets, changingId, updateWallet.isPending, handleSetDefault]);

  return (
    <>
      <Navbar />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-2 lg:space-y-0 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Wallets</h1>
        </div>

        {isLoading && <p>Loading wallets...</p>}
        {isError && <p className="text-red-500">Failed to load wallets</p>}

        {!isLoading && !isError && wallets.length === 0 && (
          <p>You have no wallets yet. You can create up to 3 wallets.</p>
        )}

        {!isLoading && wallets.length > 0 && (
          <div className="overflow-x-auto">
            <DynamicTable
              data={rows}
              caption={`You can create up to 3 wallets. You currently have ${wallets.length}.`}
            />
          </div>
        )}
      </div>
    </>
  );
}
