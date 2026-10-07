"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import BankDrawer, { type Institution } from "./BankDrawer";

interface BankConnection {
  bank: string;
  account: string | null;
  lastSynced: string | null;
}

interface BankStatusResponse extends BankConnection {
  connected: boolean;
}

interface BankTransaction {
  id: string;
  external_id: string;
  bank_id: string;
  amount: number | string;
  currency: string;
  description: string;
  date: string;
  counterparty: string | null;
}

interface BankTransactionsResponse {
  transactions: BankTransaction[];
}

interface BankSetupStatus {
  ready: boolean;
  issues: { code: string; message: string }[];
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

function TransactionsTable({ items }: { items: BankTransaction[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Descrizione</TableHead>
          <TableHead>Controparte</TableHead>
          <TableHead>Importo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>
              {new Date(transaction.date).toLocaleDateString("it-IT")}
            </TableCell>
            <TableCell>{transaction.description || "—"}</TableCell>
            <TableCell>{transaction.counterparty || "—"}</TableCell>
            <TableCell>
              {Number(transaction.amount).toLocaleString("it-IT", {
                style: "currency",
                currency: transaction.currency || "EUR",
              })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function YourBank() {
  const searchParams = useSearchParams();
  const callbackBank = searchParams.get("bank");
  const callbackComplete = searchParams.get("connected") === "1";
  const callbackError = searchParams.get("error_description");
  const callbackSyncError = searchParams.get("sync_error") === "1";

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [setupReady, setSetupReady] = useState(false);
  const [transactions, setTransactions] = useState<
    Record<string, BankTransaction[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncingBank, setSyncingBank] = useState<string | null>(null);
  const [loadingTransactionsBank, setLoadingTransactionsBank] = useState<
    string | null
  >(null);
  const [connectionLoadFailed, setConnectionLoadFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    const loadBanksAndConnections = async () => {
      setLoading(true);
      setConnectionLoadFailed(false);
      try {
        const configResponse = await apiFetch("/bank/config");
        const setupStatus = await readJson<BankSetupStatus>(
          configResponse,
          "Impossibile verificare la configurazione bancaria."
        );
        if (!setupStatus.ready) {
          const message = setupStatus.issues
            .map((issue) => issue.message)
            .join(" ");
          if (!active) return;
          setSetupReady(false);
          setErrorMessage(
            message || "L'integrazione bancaria non è ancora configurata."
          );
          setConnections([]);
          setConnectionLoadFailed(false);
          return;
        }
        if (!active) return;
        setSetupReady(true);

        const institutionsResponse = await apiFetch("/bank/institutions");
        const availableBanks = await readJson<Institution[]>(
          institutionsResponse,
          "Impossibile caricare le banche disponibili."
        );
        if (
          !Array.isArray(availableBanks) ||
          availableBanks.some(
            (bank) =>
              !bank ||
              typeof bank.id !== "string" ||
              typeof bank.name !== "string"
          )
        ) {
          throw new Error("Il server ha restituito un elenco di banche non valido.");
        }
        if (!active) return;
        setConnectionLoadFailed(false);
        setInstitutions(availableBanks);

        const bankStatuses = await Promise.all(
          availableBanks.map(async (institution) => {
            const statusResponse = await apiFetch(
              `/bank/status?bank=${encodeURIComponent(institution.id)}`
            );
            return readJson<BankStatusResponse>(
              statusResponse,
              `Impossibile verificare il collegamento con ${institution.name}.`
            );
          })
        );
        if (!active) return;

        const connectedBanks = bankStatuses
          .filter((status) => status.connected)
          .map(({ bank, account, lastSynced }) => ({
            bank,
            account,
            lastSynced,
          }));
        setConnections(connectedBanks);

        const transactionResponse = await apiFetch("/bank/transactions");
        const transactionData = await readJson<BankTransactionsResponse>(
          transactionResponse,
          "Impossibile caricare lo storico dei movimenti bancari."
        );
        if (!Array.isArray(transactionData.transactions)) {
          throw new Error("Il server ha restituito lo storico in un formato non valido.");
        }
        const transactionsByBank = transactionData.transactions.reduce<
          Record<string, BankTransaction[]>
        >((grouped, transaction) => {
          (grouped[transaction.bank_id] ??= []).push(transaction);
          return grouped;
        }, {});
        setTransactions(transactionsByBank);

        if (callbackError) {
          setErrorMessage(callbackError);
          toast.error(callbackError);
        } else if (callbackComplete && callbackBank) {
          const linkedBank = availableBanks.find(
            (institution) => institution.id === callbackBank
          );
          toast.success(
            linkedBank
              ? `${linkedBank.name} collegata.`
              : "Banca collegata."
          );
          if (callbackSyncError) {
            const message =
              "Conto collegato, ma la prima sincronizzazione non è riuscita. Riprova con «Sincronizza».";
            setErrorMessage(message);
            toast.error(message);
          }
          if (!connectedBanks.some((connection) => connection.bank === callbackBank)) {
            const message =
              "La banca ha completato l'autorizzazione, ma il server non ha trovato il conto collegato.";
            setErrorMessage(message);
            toast.error(message);
          }
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Errore durante il caricamento dei dati bancari.";
        console.error("Errore nel caricamento delle connessioni bancarie:", error);
        if (active) {
          setSetupReady(false);
          setConnectionLoadFailed(true);
          setErrorMessage(message);
          toast.error(message);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadBanksAndConnections();

    if (callbackComplete || callbackError || callbackSyncError) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    return () => {
      active = false;
    };
  }, [callbackBank, callbackComplete, callbackError, callbackSyncError]);

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
      console.error("Errore durante il collegamento della banca:", error);
      setErrorMessage(message);
      toast.error(message);
      return false;
    } finally {
      setConnecting(false);
    }
  };

  const loadTransactions = async (bankId: string) => {
    setLoadingTransactionsBank(bankId);
    setErrorMessage("");
    try {
      const response = await apiFetch(
        `/bank/transactions?bank=${encodeURIComponent(bankId)}`
      );
      const data = await readJson<BankTransactionsResponse>(
        response,
        "Impossibile caricare i movimenti bancari."
      );
      if (!Array.isArray(data.transactions)) {
        throw new Error("Il server ha restituito i movimenti in un formato non valido.");
      }
      setTransactions((current) => ({
        ...current,
        [bankId]: data.transactions,
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Errore durante il caricamento dei movimenti.";
      console.error("Errore nel caricamento dei movimenti bancari:", error);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoadingTransactionsBank(null);
    }
  };

  const syncBank = async (bankId: string) => {
    setSyncingBank(bankId);
    setErrorMessage("");
    try {
      const response = await apiFetch(
        `/bank/sync?bank=${encodeURIComponent(bankId)}`,
        { method: "POST" }
      );
      const result = await readJson<{ synced: number }>(
        response,
        "Impossibile sincronizzare i movimenti bancari."
      );
      toast.success(`Sincronizzati ${result.synced} movimenti.`);
      await loadTransactions(bankId);

      const statusResponse = await apiFetch(
        `/bank/status?bank=${encodeURIComponent(bankId)}`
      );
      const status = await readJson<BankStatusResponse>(
        statusResponse,
        "Impossibile aggiornare lo stato del conto."
      );
      if (status.connected) {
        setConnections((current) =>
          current.map((connection) =>
            connection.bank === bankId
              ? {
                  bank: status.bank,
                  account: status.account,
                  lastSynced: status.lastSynced,
                }
              : connection
          )
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Errore durante la sincronizzazione bancaria.";
      console.error("Errore nella sincronizzazione bancaria:", error);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setSyncingBank(null);
    }
  };

  const disconnectBank = async (bankId: string) => {
    if (
      !window.confirm(
        "Disconnettere questa banca? I movimenti già sincronizzati resteranno nello storico."
      )
    ) {
      return;
    }
    try {
      const response = await apiFetch(
        `/bank/disconnect?bank=${encodeURIComponent(bankId)}`,
        { method: "POST" }
      );
      await readJson<{ success: boolean }>(
        response,
        "Impossibile disconnettere la banca."
      );
      setConnections((current) =>
        current.filter((connection) => connection.bank !== bankId)
      );
      toast.success("Banca disconnessa. I movimenti già sincronizzati restano conservati.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Errore durante la disconnessione della banca.";
      console.error("Errore nella disconnessione bancaria:", error);
      setErrorMessage(message);
      toast.error(message);
    }
  };

  const institutionName = (bankId: string) =>
    institutions.find((institution) => institution.id === bankId)?.name ?? bankId;
  const connectedBankIds = new Set(connections.map((connection) => connection.bank));
  const archivedBankIds = Object.keys(transactions)
    .filter((bankId) => !connectedBankIds.has(bankId))
    .sort();
  const connectableInstitutions = institutions.filter(
    (institution) =>
      !connections.some((connection) => connection.bank === institution.id)
  );

  return (
    <>
      <Navbar />
      <main className="app-page">
        <div className="app-page-header">
          <div>
            <h1 className="page-title">La tua banca</h1>
            <p className="page-description">
              Collega i tuoi conti e consulta i movimenti sincronizzati.
            </p>
          </div>
          {!loading && setupReady && connectableInstitutions.length > 0 && (
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
          <p role="alert" className="mb-4 text-sm text-destructive">
            {errorMessage}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">
            Caricamento dei conti bancari...
          </p>
        ) : !setupReady && !connectionLoadFailed ? (
          <div className="surface-card p-6 text-sm text-muted-foreground">
            L&apos;integrazione bancaria non è pronta. Completa la configurazione
            indicata sopra prima di collegare un conto.
          </div>
        ) : connectionLoadFailed ? (
          <div className="surface-card flex flex-col items-start gap-3 p-6">
            <p className="text-sm text-muted-foreground">
              Non è stato possibile verificare i conti. Riprova quando la
              sessione è attiva e il server è raggiungibile.
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Riprova
            </Button>
          </div>
        ) : connections.length === 0 && archivedBankIds.length === 0 ? (
          <div className="surface-card p-6 text-sm text-muted-foreground">
            Nessun conto collegato. Collega una banca per sincronizzare i tuoi
            movimenti.
          </div>
        ) : (
          <div className="space-y-6">
            {connections.map((connection) => {
              const bankTransactions = transactions[connection.bank];
              return (
                <section
                  key={connection.bank}
                  className="surface-card space-y-4 p-4 md:p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <h2 className="text-lg font-semibold">
                        {institutionName(connection.bank)}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Conto: {connection.account ?? "non disponibile"}
                      </p>
                      {connection.lastSynced && (
                        <p className="text-sm text-muted-foreground">
                          Ultima sincronizzazione:{" "}
                          {new Date(connection.lastSynced).toLocaleString("it-IT")}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => void loadTransactions(connection.bank)}
                        disabled={
                          loadingTransactionsBank === connection.bank ||
                          syncingBank === connection.bank
                        }
                      >
                        {loadingTransactionsBank === connection.bank
                          ? "Caricamento..."
                          : "Carica movimenti"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => void syncBank(connection.bank)}
                        disabled={
                          syncingBank === connection.bank ||
                          loadingTransactionsBank === connection.bank
                        }
                      >
                        {syncingBank === connection.bank
                          ? "Sincronizzazione..."
                          : "Sincronizza"}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => void disconnectBank(connection.bank)}
                        disabled={
                          syncingBank === connection.bank ||
                          loadingTransactionsBank === connection.bank
                        }
                      >
                        Disconnetti
                      </Button>
                    </div>
                  </div>

                  {bankTransactions && (
                    bankTransactions.length > 0 ? (
                      <TransactionsTable items={bankTransactions} />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nessun movimento sincronizzato per questa banca.
                      </p>
                    )
                  )}
                </section>
              );
            })}
            {archivedBankIds.length > 0 && (
              <section className="surface-card space-y-4 p-4 md:p-6">
                <div>
                  <h2 className="text-lg font-semibold">Storico disconnesso</h2>
                  <p className="text-sm text-muted-foreground">
                    Questi movimenti restano conservati, ma non vengono più sincronizzati.
                  </p>
                </div>
                {archivedBankIds.map((bankId) => (
                  <div key={bankId} className="space-y-3">
                    <h3 className="font-medium">{institutionName(bankId)}</h3>
                    <TransactionsTable items={transactions[bankId] ?? []} />
                  </div>
                ))}
              </section>
            )}
          </div>
        )}
      </main>
    </>
  );
}

export default function YourBankWithSuspense() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <YourBank />
    </Suspense>
  );
}
