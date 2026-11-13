"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { SettingsSection } from "@/components/settings/settings-section";
import { errorFromResponse } from "@/lib/httpError";

/**
 * "Your data": scarica una copia dei propri dati (fase 6 C, 13/11/2026).
 *
 * - JSON: tutte le tabelle dell'utente (GET /export), senza token della banca;
 * - CSV: i movimenti, da aprire in Excel (GET /export/transactions.csv).
 *
 * Il file passa da un Blob perche' la richiesta porta il token nell'header Authorization:
 * un semplice link non potrebbe farlo.
 */

type Kind = "json" | "csv";

const EXPORTS: Record<Kind, { path: string; filename: () => string; label: string }> = {
  json: {
    path: "/export",
    filename: () => `flow-wise-export-${today()}.json`,
    label: "Download everything (JSON)",
  },
  csv: {
    path: "/export/transactions.csv",
    filename: () => `flow-wise-movements-${today()}.csv`,
    label: "Download movements (CSV)",
  },
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function YourDataCard() {
  const [busy, setBusy] = useState<Kind | null>(null);

  const download = async (kind: Kind) => {
    const { path, filename } = EXPORTS[kind];
    setBusy(kind);
    try {
      const res = await apiFetch(path);
      if (!res.ok) throw await errorFromResponse(res, "Export failed");
      saveBlob(await res.blob(), filename());
      toast.success("Download started");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <SettingsSection
      id="your-data"
      icon={Download}
      title="Your data"
      description="A copy of everything you have in Flow Wise. Bank access tokens are never included."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Button variant="outline" className="h-auto justify-start gap-3 py-3 text-left" onClick={() => download("json")} disabled={busy !== null}>
          <FileJson className="h-5 w-5 shrink-0 text-primary" />
          <span className="min-w-0">
            <span className="block font-medium">{busy === "json" ? "Preparing…" : "Everything (JSON)"}</span>
            <span className="block whitespace-normal text-xs font-normal text-muted-foreground">Accounts, pots, categories, rules, plan, movements</span>
          </span>
        </Button>
        <Button variant="outline" className="h-auto justify-start gap-3 py-3 text-left" onClick={() => download("csv")} disabled={busy !== null}>
          <FileSpreadsheet className="h-5 w-5 shrink-0 text-primary" />
          <span className="min-w-0">
            <span className="block font-medium">{busy === "csv" ? "Preparing…" : "Movements (CSV)"}</span>
            <span className="block whitespace-normal text-xs font-normal text-muted-foreground">Opens in Excel</span>
          </span>
        </Button>
      </div>
    </SettingsSection>
  );
}
