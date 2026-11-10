"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWallets } from "@/lib/hooks/useQueries";
import { balanceBreakdown, type BreakdownRow } from "@/lib/balanceBreakdown";
import { ChevronRight, PiggyBank, Wallet as WalletIcon, Wallet2 } from "lucide-react";

const euro = (cents: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
const percent = (share: number) =>
  new Intl.NumberFormat("it-IT", { style: "percent", maximumFractionDigits: 1 }).format(share);
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/**
 * Saldo totale di tutti i wallet. Sotto, in piccolo, quanto sta nei conti e quanto nei
 * salvadanai; toccandolo si apre la ripartizione wallet per wallet. `wallet.balance` e' il
 * saldo derivato di `GET /wallet` (server, `utils/walletService.js`); i conti si fanno in
 * centesimi in `lib/balanceBreakdown.ts`.
 */
export function TotalBalanceWidget() {
  const { data: wallets = [], isLoading } = useWallets();
  const [open, setOpen] = useState(false);
  const breakdown = balanceBreakdown(wallets);

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
          <div className="text-3xl font-semibold tracking-tight text-foreground">{euro(breakdown.totalCents)}</div>
        )}
        {!isLoading && wallets.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group flex w-full min-w-0 items-center gap-1 text-left text-xs text-muted-foreground hover:text-foreground"
            aria-label="Show how the balance is split"
          >
            <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                <WalletIcon className="h-3 w-3" />
                {euro(breakdown.accounts.cents)} in {plural(breakdown.accounts.count, "account", "accounts")}
              </span>
              {breakdown.pots.count > 0 && (
                <span className="inline-flex items-center gap-1 whitespace-nowrap">
                  <PiggyBank className="h-3 w-3" />
                  {euro(breakdown.pots.cents)} in {plural(breakdown.pots.count, "pot", "pots")}
                </span>
              )}
            </span>
            <ChevronRight className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100" />
          </button>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Balance by wallet</DialogTitle>
            <DialogDescription>
              {euro(breakdown.totalCents)} in total. Savings pots are listed under their account.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-3">
            {breakdown.groups.map((group) => (
              <li key={group.id}>
                {group.id !== "orphans" && <Row row={group} icon="account" />}
                {group.id === "orphans" && <p className="text-xs font-medium text-muted-foreground">{group.name}</p>}
                {group.pots.length > 0 && (
                  <ul className="mt-1 space-y-1 border-l border-border/70 pl-3 ml-1.5">
                    {group.pots.map((pot) => (
                      <li key={pot.id}>
                        <Row row={pot} icon="pot" />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function Row({ row, icon }: { row: BreakdownRow; icon: "account" | "pot" }) {
  const Icon = icon === "pot" ? PiggyBank : WalletIcon;
  return (
    <div className={icon === "pot" ? "text-sm" : "text-sm font-medium"}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{row.name}</span>
        </span>
        <span className="shrink-0 tabular-nums">
          {euro(row.cents)}
          <span className="ml-2 inline-block w-12 text-right text-xs font-normal text-muted-foreground">{percent(row.share)}</span>
        </span>
      </div>
      <div className="mt-1 h-1 rounded-full bg-muted">
        <div className="h-1 rounded-full bg-primary/70" style={{ width: `${Math.min(100, Math.max(0, row.share * 100))}%` }} />
      </div>
    </div>
  );
}
