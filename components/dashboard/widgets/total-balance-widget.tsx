"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallets } from "@/lib/hooks/useQueries";
import { Wallet2 } from "lucide-react";

export function TotalBalanceWidget() {
  const { data: wallets = [], isLoading } = useWallets();

  const totalBalance = wallets.reduce((sum, wallet) => {
    const balance = typeof wallet.balance === "number" ? wallet.balance : 0;
    return sum + balance;
  }, 0);

  return (
    <Card className="h-full border-border/70 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-semibold">Total Balance</CardTitle>
        <div className="rounded-xl bg-primary/10 p-2.5">
          <Wallet2 className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="text-3xl font-bold text-muted-foreground animate-pulse">...</div>
        ) : (
          <div className="text-3xl font-semibold tracking-tight text-foreground">
            €{totalBalance.toFixed(2)}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {wallets.length} {wallets.length === 1 ? 'wallet' : 'wallets'}
        </p>
      </CardContent>
    </Card>
  );
}
