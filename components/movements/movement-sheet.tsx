"use client";

import { ArrowLeftRight, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CategoryAvatar, CategoryBadge } from "@/lib/categoryStyle";
import { absoluteAmount } from "@/lib/amount";
import { userNote } from "@/lib/movements";
import type { Category, Transaction, Wallet } from "@/lib/hooks/useQueries";
import { formatEuro, movementTitle } from "./movement-list";

/**
 * Dettaglio di un movimento (ridisegno di Movements, 15/11/2026): importo, data, categoria, wallet,
 * nota e testo originale della banca, con Edit (la finestra del movimento) e Delete.
 */
export function MovementSheet({
  movement,
  categories,
  wallets,
  onClose,
  onEdit,
  onDelete,
}: {
  movement: Transaction | null;
  categories: Map<string, Category>;
  wallets: Map<string, Wallet>;
  onClose: () => void;
  onEdit: (movement: Transaction) => void;
  onDelete: (movement: Transaction) => void;
}) {
  const category = movement ? categories.get(String(movement.category_id)) : undefined;
  const isTransfer = movement?.type === "T";
  const walletName = (id: unknown) => (id == null ? "To assign" : wallets.get(String(id))?.name ?? `#${String(id)}`);
  const kind = !movement
    ? ""
    : isTransfer
      ? "Transfer"
      : movement.is_refund
        ? "Refund"
        : movement.type === "I"
          ? "Income"
          : "Expense";
  const signed = movement?.type === "I" ? "+ " : movement?.type === "E" ? "− " : "";

  return (
    <Sheet open={movement != null} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {movement && (
          <>
            <SheetHeader className="text-left">
              <div className="flex items-center gap-3 pr-8">
                {isTransfer ? (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <ArrowLeftRight className="h-5 w-5" />
                  </span>
                ) : (
                  <CategoryAvatar category={category} size="lg" />
                )}
                <div className="min-w-0">
                  <SheetTitle className="truncate">{movementTitle(movement)}</SheetTitle>
                  <SheetDescription>{kind}</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <p
              className={`mt-6 text-3xl font-semibold tracking-tight tabular-nums ${
                movement.type === "I" ? "text-success" : ""
              }`}
            >
              {signed}
              {formatEuro(absoluteAmount(movement.amount))}
            </p>

            <dl className="mt-5 divide-y divide-border/60 rounded-2xl border border-border/70 text-sm">
              <Row label="Date">
                {new Date(String(movement.date)).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Row>
              {isTransfer ? (
                <>
                  <Row label="From">{walletName(movement.wallet_id)}</Row>
                  <Row label="To">{walletName(movement.to_wallet_id)}</Row>
                </>
              ) : (
                <>
                  <Row label="Category">
                    <CategoryBadge category={category} fallback="No category" />
                  </Row>
                  <Row label="Wallet">{walletName(movement.wallet_id)}</Row>
                </>
              )}
              {userNote(movement.note) ? <Row label="Note">{userNote(movement.note)}</Row> : null}
            </dl>

            {movement.description && movement.merchant && (
              <div className="mt-4">
                <p className="text-xs font-medium text-muted-foreground">Bank text</p>
                <p className="mt-1 text-xs text-muted-foreground [overflow-wrap:anywhere]">{String(movement.description)}</p>
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => onEdit(movement)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onDelete(movement)}
              >
                <Trash className="mr-2 h-4 w-4" /> Delete
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}
