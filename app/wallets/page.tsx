"use client";

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
  isdefault: boolean;
}

export default function Wallets() {
  const { data: wallets = [], isLoading, isError } = useWallets();
  const updateWallet = useUpdateWallet();

  const toggleDefault = (wallet: Wallet) => {
    updateWallet.mutate(
      {
        id: wallet.id,
        data: { isdefault: !wallet.isdefault },
      },
      {
        onError: () => {
          toast.error("Failed to update wallet");
        },
      }
    );
  };

  return (
    <>
      <Navbar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-2 lg:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight">Wallets</h1>
        </div>

        {isLoading && <p>Loading wallets...</p>}
        {isError && <p className="text-red-500">Failed to load wallets</p>}

        {!isLoading && !isError && wallets.length === 0 && (
          <p>You have no wallets yet. You can create up to 3 wallets.</p>
        )}

        {!isLoading && wallets.length > 0 && (
          <DynamicTable
            data={wallets.map((w) => ({
              Name: w.name,
              Balance: w.balance.toFixed(2) + " " + w.currency,
              Default: (
                <Switch
                  checked={w.isdefault}
                  onCheckedChange={() => toggleDefault(w)}
                />
              ),
            }))}
            caption={`You can create up to 3 wallets. You currently have ${wallets.length}.`}
          />
        )}
      </div>
    </>
  );
}
