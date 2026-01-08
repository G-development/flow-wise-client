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
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Saldo Totale</CardTitle>
        <Wallet2 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-2xl font-bold text-muted-foreground">...</div>
        ) : (
          <div className="text-2xl font-bold">
            €{totalBalance.toFixed(2)}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {wallets.length} portafogli
        </p>
      </CardContent>
    </Card>
  );
}
