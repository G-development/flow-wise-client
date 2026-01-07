"use client";

import { useCallback, useEffect, useState } from "react";
import { DynamicTable } from "@/components/dynamic-table";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/navbar";

import { supabase } from "@/lib/supabaseClient";

interface Category {
  id: number;
  name: string;
  type: string;
  userid: string;
  active: boolean;
}

export default function Categories() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCategories = useCallback(async () => {
    try {
      const session = supabase.auth.getSession
        ? await supabase.auth.getSession()
        : null;
      const token = session?.data?.session?.access_token;

      const res = await fetch(`${API_URL}/category`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch categories");

      setCategories(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // toggle active category
  const toggleActive = async (category: Category) => {
    try {
      const session = supabase.auth.getSession
        ? await supabase.auth.getSession()
        : null;
      const token = session?.data?.session?.access_token;

      const res = await fetch(`${API_URL}/category/${category.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ active: !category.active }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update category");

      // aggiorna lo stato locale
      setCategories((prev) =>
        prev.map((c) =>
          c.id === category.id ? { ...c, active: data.active } : c
        )
      );
    } catch (err) {
      console.error(err);
      alert("Errore aggiornando la categoria");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <>
      <Navbar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-2 lg:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        </div>

        {loading && <p>Loading categories...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && categories.length === 0 && (
          <p>You have no categories yet.</p>
        )}

        {!loading && categories.length > 0 && (
          <DynamicTable
            data={categories.map((c) => ({
              Name: c.name,
              Type: c.type,
              Active: (
                <Switch
                  checked={c.active}
                  onCheckedChange={() => toggleActive(c)}
                />
              ),
            }))}
            caption={`You currently have ${categories.length} categories.`}
          />
        )}
      </div>
    </>
  );
}
