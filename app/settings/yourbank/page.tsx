"use client";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import { useSearchParams } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
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

import BankDrawer from "./BankDrawer";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Institution = {
  id: string;
  name: string;
};

interface Transaction {
  date: string; // Or Date if you're working with Date objects
  description: string;
  amount: number;
}

function YourBank() {
  useAuth();
  const [accessToken, setAccessToken] = useState("");
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const requisitionId = searchParams.get("ref");
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [transactions, setTransactions] = useState([]);
  const [fetchError, setFetchError] = useState("");

  // 1. Ottieni token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await axios.post(`${API_URL}/bank/token`);
        setAccessToken(res.data.access);
      } catch (err) {
        console.error("Errore nel recupero token:", err);
      }
    };
    fetchToken();
  }, []);

  // 2. Ottieni istituti
  useEffect(() => {
    if (!accessToken) return;
    const fetchInstitutions = async () => {
      try {
        const res = await axios.get(`${API_URL}/bank/institutions`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setInstitutions(res.data);
      } catch (err) {
        console.error("Errore nel recupero banche:", err);
      }
    };
    fetchInstitutions();
  }, [accessToken]);

  // 3. Gestione requisition dopo redirect
  useEffect(() => {
    if (!accessToken) return;

    const fw_token = localStorage.getItem("fw-token");
    if (!fw_token) return;

    const checkOrCreateRequisition = async () => {
      try {
        let currentRequisitionId = requisitionId;

        // 1. If no ref in params, search in db
        if (!currentRequisitionId) {
          try {
            console.log(`${API_URL}/bank/requisition/user`);

            const res = await axios.get(`${API_URL}/bank/requisition/user`, {
              headers: {
                Authorization: `Bearer ${fw_token}`,
              },
            });

            if (res.data?.requisitionId) {
              currentRequisitionId = res.data.requisitionId;
              console.log(
                "Requisition recuperata da DB:",
                currentRequisitionId
              );
            } else if (res.data?.message === "No requisition found") {
              console.log("Nessuna requisition trovata per l'utente.");
              // eventualmente logica per crearne una nuova
            }
          } catch (error) {
            console.error(
              "Errore nel recupero della requisition dal DB:",
              error
            );
            setStatusMessage("Impossibile recuperare i dati bancari.");
            return;
          }
        }

        if (!currentRequisitionId) {
          setStatusMessage("Nessun conto collegato. Collega la tua banca.");
          return;
        }

        // 2. Verifica lo stato della requisition
        try {
          const res = await axios.get(
            `${API_URL}/bank/requisition/${currentRequisitionId}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );

          const { accounts, status } = res.data;
          console.log("Status requisition:", status); // 👈 aggiungi questo log

          setAccounts(accounts);

          if (status === "LN") {
            setStatusMessage("Conto collegato con successo!");
            // try {
            //   const res_transactions = await axios.get(
            //     `${API_URL}/bank/accounts/${accounts[0]}/transactions`,
            //     {
            //       headers: { Authorization: `Bearer ${accessToken}` },
            //     }
            //   );
            //   setTransactions(res_transactions.data);
            // } catch (error) {
            //   console.error("Errore nel recupero delle transazioni:", error);
            //   setStatusMessage(
            //     "Conto collegato, ma errore nel recupero transazioni. Probably went out of 4 requests per day. We're sorry."
            //   );
            // }
          } else {
            setStatusMessage("Collegamento non completato.");
          }
        } catch (error) {
          console.error(
            "Errore nel controllo dello stato della requisition:",
            error
          );
          setStatusMessage("Errore nel controllo della connessione bancaria.");
        }
      } catch (err) {
        console.error("Errore generico nella gestione della requisition:", err);
        setStatusMessage("Si è verificato un errore inaspettato.");
      }
    };

    checkOrCreateRequisition();
  }, [requisitionId, accessToken]);

  // 4. Collegamento banca
  const linkBank = async () => {
    if (!accessToken || !selectedInstitution) return;

    const fw_token = localStorage.getItem("fw-token");
    if (!fw_token) return;

    try {
      // 1. Crea agreement
      const agreementRes = await axios.post(
        `${API_URL}/bank/agreement`,
        { institution_id: selectedInstitution },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const agreement = agreementRes.data.id;

      // 2. Crea requisition
      const requisitionRes = await axios.post(
        `${API_URL}/bank/requisition`,
        {
          institution_id: selectedInstitution,
          agreement,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const { id, institution_id, status, accounts, link } =
        requisitionRes.data;

      // 3. Salva requisition nel DB
      await axios.post(
        `${API_URL}/bank/requisition/save`,
        {
          requisitionId: id,
          institutionId: institution_id,
          status,
          accounts,
        },
        { headers: { Authorization: `Bearer ${fw_token}` } }
      );

      // 4. Redirect
      window.location.href = link;
    } catch (err) {
      console.error("Errore nel collegamento banca:", err);
    }
  };

  // - Retrieve transactions
  const fetchTransactions = async (accountId: string) => {
    const fw_token = localStorage.getItem("fw-token");
    if (!fw_token) return;

    setFetchError("");
    try {
      setSelectedAccount(accountId);
      const res = await axios.get(
        `${API_URL}/bank/accounts/${accountId}/transactions`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          validateStatus: () => true,
        }
      );

      if (res.status === 429 || res.status === 500) {
        setFetchError("Too many requests, try again tomorrow");
        setTransactions([]);
        return;
      }

      setTransactions(res.data);
      console.log("here", res.data);

      saveTransactions(accountId, res.data.transactions, fw_token);
    } catch (error) {
      setFetchError("Errore nel recupero delle transazioni:");
      setTransactions([]);
      console.error(error);
    }
  };

  // - Save transactions
  const saveTransactions = async (
    accountId: string,
    transactions: Transaction[],
    token: string
  ) => {
    setSelectedAccount(accountId);
    try {
      const response = await fetch(`${API_URL}/bank/transactions/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountId,
          transactions,
        }),
      });

      const data = await response.json();
      console.log("Risposta:", data);
      toast(data.message, {
        description: data,
      });
    } catch (error) {
      console.error("Errore nel salvataggio transazioni:", error);
      toast.error(`${error}`);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h1 className="text-3xl font-bold tracking-tight">Your Bank</h1>

        {statusMessage && (
          <div className="p-4 bg-green-100 text-700 rounded flex items-center justify-between">
            {statusMessage}

            <BankDrawer
              institutions={institutions}
              accessToken={accessToken}
              linkBank={linkBank}
              selectedInstitution={selectedInstitution}
              setSelectedInstitution={setSelectedInstitution}
              requisitionId={requisitionId}
            />
          </div>
        )}
        <div>
          {accounts && accounts.length > 0 && (
            <Table className="mt-6">
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Account ID</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((id, index) => (
                  <TableRow key={id}>
                    <TableCell>Conto {index + 1}</TableCell>
                    <TableCell>{id}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        onClick={() => fetchTransactions(id)}
                      >
                        Mostra transazioni
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div>
          {selectedAccount && (
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold">
                Transazioni per conto: {selectedAccount}
              </h3>

              {fetchError ? (
                toast.error(`${fetchError}`)
              ) : transactions.length === 0 ? (
                <p className="text-muted-foreground">
                  Nessuna transazione trovata.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrizione</TableHead>
                      <TableHead>Importo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx: Transaction, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{tx.date}</TableCell>
                        <TableCell>{tx.description}</TableCell>
                        <TableCell>{tx.amount} €</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </div>
      </div>
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
