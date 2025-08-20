"use client";

import { useEffect, useState } from "react";
import { DynamicTable } from "@/components/dynamic-table";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/navbar";

import { supabase } from "@/lib/supabaseClient";

interface Wallet {
  id: string;
  name: string;
  balance: number;
  currency: string;
  is_default: boolean;
}

export default function Wallets() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWallets = async () => {
    try {
      const session = supabase.auth.getSession
        ? await supabase.auth.getSession()
        : null;
      const token = session?.data?.session?.access_token;
      const res = await fetch(`${API_URL}/wallet`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch wallets");
      setWallets(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  return (
    <>
      <Navbar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-2 lg:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight">Wallets</h1>
        </div>

        {loading && <p>Loading wallets...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && wallets.length === 0 && (
          <p>You have no wallets yet. You can create up to 3 wallets.</p>
        )}

        {!loading && wallets.length > 0 && (
          <DynamicTable
            data={wallets.map((w) => ({
              Name: w.name,
              Balance: w.balance.toFixed(2),
              Default: <Switch checked={w.is_default} disabled />,
            }))}
            caption={`You can create up to 3 wallets. You currently have ${wallets.length}.`}
          />
        )}
      </div>
    </>
  );
}
