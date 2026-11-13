"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { apiFetch } from "@/lib/api";
import { errorFromResponse } from "@/lib/httpError";
import { supabase } from "@/lib/supabaseClient";

/**
 * Elimina account (R4, 13/11/2026). Deciso con Gio: subito, senza ripensamento, confermando con la
 * propria email; prima si invita a scaricare l'export (sezione "Your data" sopra). Il server
 * (`DELETE /users/me`) cancella tutti i dati e poi il login; qui si esce e si torna alla landing.
 */
export function DeleteAccountCard({ email }: { email: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);

  const matches = email.trim() !== "" && typed.trim().toLowerCase() === email.trim().toLowerCase();

  const remove = async () => {
    setBusy(true);
    try {
      const res = await apiFetch("/users/me", { method: "DELETE", body: JSON.stringify({ confirmEmail: typed }) });
      if (!res.ok) throw await errorFromResponse(res, "Could not delete the account");
      await supabase.auth.signOut();
      queryClient.clear();
      toast.success("Your account has been deleted");
      router.replace("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the account");
      setBusy(false);
    }
  };

  return (
    <section className="surface-card space-y-4 border border-destructive/30 p-4 md:p-6" aria-labelledby="delete-account-title">
      <div className="space-y-1">
        <h2 id="delete-account-title" className="flex items-center gap-2 text-lg font-semibold text-destructive">
          <Trash2 width={18} /> Delete account
        </h2>
        <p className="text-sm text-muted-foreground">
          Permanently delete your account and all your data: movements, wallets and pots, categories, rules, the
          annual plan and the bank link. This cannot be undone.
        </p>
      </div>
      <Button variant="destructive" onClick={() => { setTyped(""); setOpen(true); }}>
        Delete my account
      </Button>

      <Dialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              Everything is deleted right away and cannot be recovered. Encrypted backups disappear within 30 days.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              Want to keep a copy? Close this window and use Your data → Download everything first.
            </p>
            <div className="grid gap-2">
              <Label htmlFor="confirm-email">Type your email to confirm</Label>
              <Input
                id="confirm-email"
                type="email"
                autoComplete="off"
                placeholder={email}
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                disabled={busy}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void remove()} disabled={!matches || busy}>
              {busy ? "Deleting…" : "Delete forever"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
