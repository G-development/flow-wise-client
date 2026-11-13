"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
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
    <section className="surface-card p-4 md:p-6 space-y-4" aria-labelledby="your-data-title">
      <div className="space-y-1">
        <h2 id="your-data-title" className="text-lg font-semibold flex items-center gap-2">
          <Download width={18} /> Your data
        </h2>
        <p className="text-sm text-muted-foreground">
          Download a copy of everything you have in Flow Wise. The JSON file holds all your data
          (accounts, pots, categories, rules, annual plan, movements and bank movements); bank
          access tokens are never included. The CSV file lists your movements and opens in Excel.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="outline" onClick={() => download("json")} disabled={busy !== null}>
          <FileJson width={16} />
          {busy === "json" ? "Preparing…" : EXPORTS.json.label}
        </Button>
        <Button variant="outline" onClick={() => download("csv")} disabled={busy !== null}>
          <FileSpreadsheet width={16} />
          {busy === "csv" ? "Preparing…" : EXPORTS.csv.label}
        </Button>
      </div>
    </section>
  );
}
