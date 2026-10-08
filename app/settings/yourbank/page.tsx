"use client";

import { Suspense, useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch, buildQuery } from "@/lib/api";
import BankDrawer, { type Institution } from "./BankDrawer";
import ImportTransactionDialog, {
  type BankTransactionItem,
} from "./ImportTransactionDialog";
import {
  Landmark,
  RefreshCw,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Layers,
  Sparkles,
  Calendar,
  Filter,
} from "lucide-react";

interface BankConnection {
  bank: string;
  account: string | null;
  lastSynced: string | null;
}

interface BankStatusResponse extends BankConnection {
  connected: boolean;
}

interface BankTransactionsResponse {
  transactions: BankTransactionItem[];
}

interface BankSetupStatus {
  ready: boolean;
  provider?: string;
  isRealBankEnabled?: boolean;
  issues: { code: string; message: string }[];
}

// Calcola primo giorno del mese corrente e oggi in formato YYYY-MM-DD
function getDefaultDateRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const startOfMonth = `${year}-${month}-01`;
  const today = `${year}-${month}-${day}`;
  return { startOfMonth, today };
}

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  const data: unknown = await response.json();
  if (!response.ok) {
    const message =
      data && typeof data === "object"
        ? "error" in data && typeof data.error === "string"
          ? data.error
          : "message" in data && typeof data.message === "string"
            ? data.message
            : fallback
        : fallback;
    throw new Error(message);
  }
  return data as T;
}

function YourBank() {
  const searchParams = useSearchParams();
  const callbackBank = searchParams.get("bank");
  const callbackComplete = searchParams.get("connected") === "1";
  const callbackError = searchParams.get("error_description");
  const callbackSyncError = searchParams.get("sync_error") === "1";

  const { startOfMonth, today } = useMemo(() => getDefaultDateRange(), []);

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [setupStatus, setSetupStatus] = useState<BankSetupStatus | null>(null);
  const [transactions, setTransactions] = useState<BankTransactionItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncingBank, setSyncingBank] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Filtri per periodo (Default: dal 1° del mese corrente ad oggi)
  const [startDate, setStartDate] = useState<string>(startOfMonth);
  const [endDate, setEndDate] = useState<string>(today);
  const [quickRange, setQuickRange] = useState<string>("this_month");

  // Filtri ricerca e stato movimenti
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBank, setFilterBank] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Selezione massiva per importazione in Flow Wise
  const [selectedTxnIds, setSelectedTxnIds] = useState<Set<string>>(new Set());
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [txnsToImport, setTxnsToImport] = useState<BankTransactionItem[]>([]);

  const loadTransactions = useCallback(async (start?: string, end?: string, bank?: string) => {
    try {
      const query = buildQuery({
        startDate: start || undefined,
        endDate: end || undefined,
        bank: bank && bank !== "all" ? bank : undefined,
      });

      const response = await apiFetch(`/bank/transactions${query}`);
      const data = await readJson<BankTransactionsResponse>(
        response,
        "Impossibile caricare i movimenti bancari."
      );
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error("Error loading transactions:", err);
    }
  }, []);

  const loadBanksAndConnections = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const configResponse = await apiFetch("/bank/config");
      const setup = await readJson<BankSetupStatus>(
        configResponse,
        "Impossibile verificare la configurazione bancaria."
      );
      setSetupStatus(setup);

      if (!setup.ready) {
        const message = setup.issues.map((i) => i.message).join(" ");
        setErrorMessage(
          message || "L'integrazione bancaria non è ancora configurata."
        );
        setConnections([]);
        return;
      }

      // Carica istituti disponibili
      const institutionsResponse = await apiFetch("/bank/institutions");
      const availableBanks = await readJson<Institution[]>(
        institutionsResponse,
        "Impossibile caricare le banche disponibili."
      );
      setInstitutions(availableBanks);

      // Carica connessioni attive
      const bankStatuses = await Promise.all(
        availableBanks.map(async (institution) => {
          try {
            const statusResponse = await apiFetch(
              `/bank/status?bank=${encodeURIComponent(institution.id)}`
            );
            return await readJson<BankStatusResponse>(
              statusResponse,
              `Impossibile verificare lo stato di ${institution.name}.`
            );
          } catch {
            return { connected: false, bank: institution.id, account: null, lastSynced: null };
          }
        })
      );

      const connectedBanks = bankStatuses
        .filter((status) => status.connected)
        .map(({ bank, account, lastSynced }) => ({
          bank,
          account,
          lastSynced,
        }));
      setConnections(connectedBanks);

      // Carica i movimenti per il periodo selezionato
      await loadTransactions(startDate, endDate);

      if (callbackError) {
        setErrorMessage(callbackError);
        toast.error(callbackError);
      } else if (callbackComplete && callbackBank) {
        const linkedBank = availableBanks.find((b) => b.id === callbackBank);
        toast.success(
          linkedBank
            ? `Conto ${linkedBank.name} collegato e sincronizzato con successo!`
            : "Banca collegata con successo!"
        );
        if (callbackSyncError) {
          toast.error("Conto collegato. Clicca su «Sincronizza» per aggiornare lo storico.");
        }
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Errore durante il caricamento dei dati bancari.";
      console.error("Errore nel caricamento delle connessioni bancarie:", error);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [callbackBank, callbackComplete, callbackError, callbackSyncError, startDate, endDate, loadTransactions]);

  useEffect(() => {
    void loadBanksAndConnections();

    if (callbackComplete || callbackError || callbackSyncError) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [loadBanksAndConnections, callbackComplete, callbackError, callbackSyncError]);

  // Gestione preset intervallo date
  const handleQuickRangeChange = (value: string) => {
    setQuickRange(value);
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const curDay = now.getDate();

    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    let start = "";
    let end = formatDate(now);

    if (value === "this_month") {
      start = `${curYear}-${String(curMonth + 1).padStart(2, "0")}-01`;
    } else if (value === "last_month") {
      const firstOfLastMonth = new Date(curYear, curMonth - 1, 1);
      const lastOfLastMonth = new Date(curYear, curMonth, 0);
      start = formatDate(firstOfLastMonth);
      end = formatDate(lastOfLastMonth);
    } else if (value === "last_30_days") {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(curDay - 30);
      start = formatDate(thirtyDaysAgo);
    } else if (value === "last_90_days") {
      const ninetyDaysAgo = new Date(now);
      ninetyDaysAgo.setDate(curDay - 90);
      start = formatDate(ninetyDaysAgo);
    } else if (value === "all") {
      start = "";
      end = "";
    }

    setStartDate(start);
    setEndDate(end);
    void loadTransactions(start, end, filterBank);
  };

  const handleApplyDateRange = () => {
    setQuickRange("custom");
    void loadTransactions(startDate, endDate, filterBank);
  };

  const linkBank = async (): Promise<boolean> => {
    if (!selectedInstitution) return false;
    setConnecting(true);
    setErrorMessage("");

    try {
      const response = await apiFetch(
        `/bank/authorize?bank=${encodeURIComponent(selectedInstitution)}`
      );
      const data = await readJson<{ authUrl?: string }>(
        response,
        "Impossibile avviare il collegamento bancario."
      );
      if (!data.authUrl) {
        throw new Error("Il server non ha restituito il link di autorizzazione.");
      }
      window.location.assign(data.authUrl);
      return true;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Errore durante il collegamento della banca.";
      setErrorMessage(message);
      toast.error(message);
      return false;
    } finally {
      setConnecting(false);
    }
  };

  const syncBank = async (bankId: string) => {
    setSyncingBank(bankId);
    setErrorMessage("");
    const toastId = toast.loading("Sincronizzazione dei movimenti in corso...");

    try {
      const response = await apiFetch(
        `/bank/sync?bank=${encodeURIComponent(bankId)}`,
        { method: "POST" }
      );
      const result = await readJson<{ synced: number }>(
        response,
        "Impossibile sincronizzare i movimenti bancari."
      );
      toast.success(`Sincronizzati ${result.synced} movimenti con successo!`, {
        id: toastId,
      });

      // Ricarica transazioni e stato
      await loadTransactions(startDate, endDate, filterBank);

      const statusResponse = await apiFetch(
        `/bank/status?bank=${encodeURIComponent(bankId)}`
      );
      const status = await readJson<BankStatusResponse>(
        statusResponse,
        "Impossibile aggiornare lo stato del conto."
      );
      if (status.connected) {
        setConnections((current) =>
          current.map((conn) =>
            conn.bank === bankId
              ? {
                  bank: status.bank,
                  account: status.account,
                  lastSynced: status.lastSynced,
                }
              : conn
          )
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Errore durante la sincronizzazione bancaria.";
      setErrorMessage(message);
      toast.error(message, { id: toastId });
    } finally {
      setSyncingBank(null);
    }
  };

  const disconnectBank = async (bankId: string) => {
    const instName = institutionName(bankId);
    if (
      !window.confirm(
        `Sei sicuro di voler disconnettere ${instName}? I movimenti già sincronizzati rimarranno conservati nello storico.`
      )
    ) {
      return;
    }

    const toastId = toast.loading("Disconnessione in corso...");
    try {
      const response = await apiFetch(
        `/bank/disconnect?bank=${encodeURIComponent(bankId)}`,
        { method: "POST" }
      );
      await readJson<{ success: boolean }>(
        response,
        "Impossibile disconnettere la banca."
      );

      setConnections((current) => current.filter((conn) => conn.bank !== bankId));
      setSelectedTxnIds(new Set());
      toast.success(`${instName} disconnessa con successo.`, { id: toastId });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Errore durante la disconnessione della banca.";
      setErrorMessage(message);
      toast.error(message, { id: toastId });
    }
  };

  const institutionName = (bankId: string) => {
    const found = institutions.find(
      (inst) => inst.id === bankId || inst.id.toLowerCase().includes(bankId.toLowerCase())
    );
    return found?.name ?? bankId.toUpperCase();
  };

  const connectableInstitutions = institutions.filter(
    (institution) =>
      !connections.some((connection) => connection.bank === institution.id)
  );

  // Filtra transazioni lato client (per testo, banca, tipo, stato e date)
  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      // Filtro banca
      if (filterBank !== "all" && txn.bank_id !== filterBank) {
        return false;
      }
      // Filtro tipo
      const amt = Number(txn.amount);
      if (filterType === "income" && amt < 0) return false;
      if (filterType === "expense" && amt >= 0) return false;
      // Filtro stato
      if (filterStatus === "imported" && txn.status !== "imported") return false;
      if (filterStatus === "synced" && txn.status === "imported") return false;

      // Filtro data locale (se impostato)
      if (startDate && txn.date < startDate) return false;
      if (endDate && txn.date > endDate) return false;

      // Ricerca testo
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const descMatch = (txn.description || "").toLowerCase().includes(query);
        const partyMatch = (txn.counterparty || "").toLowerCase().includes(query);
        const bankMatch = (txn.bank_id || "").toLowerCase().includes(query);
        if (!descMatch && !partyMatch && !bankMatch) return false;
      }

      return true;
    });
  }, [transactions, filterBank, filterType, filterStatus, startDate, endDate, searchQuery]);

  // Gestione selezione massiva
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTxnIds(new Set(filteredTransactions.map((t) => t.id)));
    } else {
      setSelectedTxnIds(new Set());
    }
  };

  const handleToggleSelectTxn = (id: string) => {
    setSelectedTxnIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openImportSingle = (txn: BankTransactionItem) => {
    setTxnsToImport([txn]);
    setImportDialogOpen(true);
  };

  const openImportSelected = () => {
    const selected = transactions.filter((t) => selectedTxnIds.has(t.id));
    if (selected.length === 0) return;
    setTxnsToImport(selected);
    setImportDialogOpen(true);
  };

  const onImportSuccess = async () => {
    await loadTransactions(startDate, endDate, filterBank);
    setSelectedTxnIds(new Set());
  };

  return (
    <>
      <Navbar />
      <main className="app-page">
        {/* Header */}
        <div className="app-page-header">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="page-title">La tua banca</h1>
              {setupStatus?.isRealBankEnabled ? (
                <Badge variant="outline" className="gap-1 border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-xs">
                  <ShieldCheck className="h-3 w-3" /> PSD2 Open Banking
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 border-sky-500/30 text-sky-500 bg-sky-500/10 text-xs">
                  <Sparkles className="h-3 w-3" /> Sandbox Mode
                </Badge>
              )}
            </div>
            <p className="page-description">
              Collega i tuoi conti correnti Open Banking e importa con selezione massiva le transazioni nei tuoi wallet Flow Wise.
            </p>
          </div>

          {!loading && setupStatus?.ready && connectableInstitutions.length > 0 && (
            <BankDrawer
              institutions={connectableInstitutions}
              loading={loading}
              connecting={connecting}
              linkBank={linkBank}
              selectedInstitution={selectedInstitution}
              setSelectedInstitution={setSelectedInstitution}
            />
          )}
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-center justify-between">
            <span>{errorMessage}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadBanksAndConnections()}
            >
              Riprova
            </Button>
          </div>
        )}

        {/* Stato Caricamento */}
        {loading ? (
          <div className="surface-card flex items-center justify-center p-12 text-sm text-muted-foreground">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Caricamento dei dati bancari...
          </div>
        ) : connections.length === 0 ? (
          /* Nessun conto collegato */
          <div className="surface-card p-8 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Nessun conto bancario collegato</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Collega la tua banca per sincronizzare automaticamente i movimenti, visualizzare i saldi e importarli nei tuoi budget Flow Wise.
              </p>
            </div>
            {connectableInstitutions.length > 0 && (
              <BankDrawer
                institutions={connectableInstitutions}
                loading={loading}
                connecting={connecting}
                linkBank={linkBank}
                selectedInstitution={selectedInstitution}
                setSelectedInstitution={setSelectedInstitution}
              />
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Lista Conti Bancari Connessi */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {connections.map((connection) => {
                const isSyncing = syncingBank === connection.bank;
                const instName = institutionName(connection.bank);

                return (
                  <div
                    key={connection.bank}
                    className="surface-card p-5 space-y-4 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                          <Landmark className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{instName}</h3>
                          <p className="text-xs text-muted-foreground">
                            Conto: {connection.account ? `${connection.account.slice(-8)}` : "Attivo"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 gap-1 text-[11px]">
                        <ShieldCheck className="h-3 w-3" /> Connesso
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground border-t border-border/70 pt-3 flex justify-between items-center">
                      <span>Ultimo sync:</span>
                      <span className="font-medium text-foreground">
                        {connection.lastSynced
                          ? new Date(connection.lastSynced).toLocaleString("it-IT", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Mai"}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1.5 h-9"
                        onClick={() => void syncBank(connection.bank)}
                        disabled={isSyncing}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                        {isSyncing ? "Sincronizzo..." : "Sincronizza"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive h-9 px-2.5"
                        onClick={() => void disconnectBank(connection.bank)}
                        disabled={isSyncing}
                        title="Disconnetti banca"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sezione Movimenti Bancari con Filtro Periodo e Selezione Massiva */}
            <div className="surface-card p-4 md:p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-foreground">
                      Movimenti Bancari ({filteredTransactions.length})
                    </h2>
                    {selectedTxnIds.size > 0 && (
                      <Badge variant="secondary" className="font-semibold text-primary">
                        {selectedTxnIds.size} selezionate
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Filtra per periodo e seleziona le transazioni per importarle in blocco nei tuoi Wallet.
                  </p>
                </div>

                {selectedTxnIds.size > 0 && (
                  <Button
                    onClick={openImportSelected}
                    className="gap-2 shadow-sm font-semibold animate-in fade-in"
                  >
                    <Layers className="h-4 w-4" />
                    Importa selezionate ({selectedTxnIds.size})
                  </Button>
                )}
              </div>

              {/* Box Filtro Periodo (Date Range) */}
              <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Periodo Transazioni</span>
                  </div>

                  {/* Preset Veloci */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      variant={quickRange === "this_month" ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs px-2.5"
                      onClick={() => handleQuickRangeChange("this_month")}
                    >
                      Questo mese
                    </Button>
                    <Button
                      variant={quickRange === "last_month" ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs px-2.5"
                      onClick={() => handleQuickRangeChange("last_month")}
                    >
                      Mese scorso
                    </Button>
                    <Button
                      variant={quickRange === "last_30_days" ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs px-2.5"
                      onClick={() => handleQuickRangeChange("last_30_days")}
                    >
                      Ultimi 30 gg
                    </Button>
                    <Button
                      variant={quickRange === "last_90_days" ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs px-2.5"
                      onClick={() => handleQuickRangeChange("last_90_days")}
                    >
                      Ultimi 90 gg
                    </Button>
                    <Button
                      variant={quickRange === "all" ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs px-2.5"
                      onClick={() => handleQuickRangeChange("all")}
                    >
                      Tutto
                    </Button>
                  </div>
                </div>

                {/* Input Date Manuali */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-end pt-1">
                  <div className="space-y-1">
                    <Label htmlFor="start-date" className="text-xs text-muted-foreground">
                      Data Inizio
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-9 text-xs bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="end-date" className="text-xs text-muted-foreground">
                      Data Fine
                    </Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-9 text-xs bg-background"
                    />
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-9 text-xs font-medium gap-1.5"
                    onClick={handleApplyDateRange}
                  >
                    <Filter className="h-3.5 w-3.5" /> Applica Filtro Date
                  </Button>
                </div>
              </div>

              {/* Barra Filtri Aggiuntivi (Testo, Banca, Tipo, Stato) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca descrizione o controparte..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 text-sm"
                  />
                </div>

                <Select value={filterBank} onValueChange={setFilterBank}>
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue placeholder="Filtra per banca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le banche</SelectItem>
                    {connections.map((c) => (
                      <SelectItem key={c.bank} value={c.bank}>
                        {institutionName(c.bank)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue placeholder="Filtra per tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i tipi</SelectItem>
                    <SelectItem value="expense">Solo Spese</SelectItem>
                    <SelectItem value="income">Solo Entrate</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue placeholder="Stato importazione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli stati</SelectItem>
                    <SelectItem value="synced">Da importare</SelectItem>
                    <SelectItem value="imported">Già importati</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tabella Movimenti */}
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground border rounded-xl border-dashed">
                  Nessun movimento trovato per il periodo e i filtri selezionati.
                </div>
              ) : (
                <div className="rounded-xl border border-border/70 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="w-10 text-center">
                          <Checkbox
                            checked={
                              filteredTransactions.length > 0 &&
                              selectedTxnIds.size === filteredTransactions.length
                            }
                            onCheckedChange={handleSelectAll}
                            aria-label="Seleziona tutte le transazioni"
                          />
                        </TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Banca</TableHead>
                        <TableHead>Descrizione</TableHead>
                        <TableHead>Controparte</TableHead>
                        <TableHead className="text-right">Importo</TableHead>
                        <TableHead className="text-center">Stato</TableHead>
                        <TableHead className="text-right">Azione</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => {
                        const isIncome = Number(transaction.amount) >= 0;
                        const isSelected = selectedTxnIds.has(transaction.id);
                        const isImported = transaction.status === "imported";

                        return (
                          <TableRow
                            key={transaction.id}
                            className={isSelected ? "bg-primary/5" : ""}
                          >
                            <TableCell className="text-center">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleToggleSelectTxn(transaction.id)}
                                aria-label={`Seleziona movimento ${transaction.description}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium text-xs whitespace-nowrap">
                              {new Date(transaction.date).toLocaleDateString("it-IT", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </TableCell>
                            <TableCell className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                              {institutionName(transaction.bank_id)}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {transaction.description || "—"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {transaction.counterparty || "—"}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 font-semibold text-sm ${
                                  isIncome ? "text-emerald-500" : "text-rose-500"
                                }`}
                              >
                                {isIncome ? (
                                  <ArrowDownLeft className="h-3.5 w-3.5" />
                                ) : (
                                  <ArrowUpRight className="h-3.5 w-3.5" />
                                )}
                                {Number(transaction.amount).toLocaleString("it-IT", {
                                  style: "currency",
                                  currency: transaction.currency || "EUR",
                                })}
                              </span>
                            </TableCell>
                            <TableCell className="text-center whitespace-nowrap">
                              {isImported ? (
                                <Badge variant="outline" className="text-[10px] py-0 px-2 text-emerald-500 border-emerald-500/30 bg-emerald-500/10 gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Importato
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] py-0 px-2 text-muted-foreground">
                                  Sincronizzato
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              <Button
                                size="sm"
                                variant={isImported ? "ghost" : "outline"}
                                className="h-8 text-xs font-medium"
                                onClick={() => openImportSingle(transaction)}
                              >
                                {isImported ? "Re-importa" : "Importa"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dialog di Importazione Massiva o Singola */}
        <ImportTransactionDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          transactions={txnsToImport}
          onSuccess={onImportSuccess}
        />
      </main>
    </>
  );
}

export default function YourBankWithSuspense() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          Caricamento...
        </div>
      }
    >
      <YourBank />
    </Suspense>
  );
}
