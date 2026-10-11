"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallets } from "@/lib/hooks/useQueries";
import { Wallet2 } from "lucide-react";

export function TotalBalanceWidget() {
  const { data: wallets = [], isLoading } = useWallets();

  // `wallet.balance` e' il saldo derivato restituito da GET /wallet (parte dal saldo di
  // apertura del wallet, `utils/walletService.js`), non una colonna memorizzata.
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  const formattedTotal = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(totalBalance);

  return (
    <Card className="h-full flex flex-col overflow-hidden border-border/70 shadow-sm transition-shadow hover:shadow-md min-h-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
        <CardTitle className="text-sm font-semibold">Total Balance</CardTitle>
        <div className="rounded-xl bg-primary/10 p-2.5">
          <Wallet2 className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4 pt-0 space-y-2 overflow-hidden flex flex-col justify-center min-h-0">
        {isLoading ? (
          <div className="text-3xl font-bold text-muted-foreground animate-pulse">...</div>
        ) : (
          <div className="text-3xl font-semibold tracking-tight text-foreground">
            {formattedTotal}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {wallets.length} {wallets.length === 1 ? 'wallet' : 'wallets'}
        </p>
      </CardContent>
    </Card>
  );
}
