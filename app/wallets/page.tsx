"use client";

import { useEffect, useState } from "react";
import { DynamicTable } from "@/components/dynamic-table";
import Navbar from "@/components/navbar";

import { supabase } from "@/lib/supabaseClient";

export default function Wallets() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch wallets
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

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
              Default: w.is_default ? "Yes" : "No",
            }))}
            caption={`You can create up to 3 wallets. You currently have ${wallets.length}.`}
          />
        )}
      </div>
    </>
  );
}
