"use client";
import { useState, useCallback, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useFetch<T>(endpoint: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("fw-token");
      if (!token) throw new Error("Unauthorized");

      const res = await fetch(`${API_URL}/${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(options?.headers || {}),
        },
      });

      if (!res.ok) throw new Error("Failed to fetch data");

      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
      setError("An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  }, [endpoint, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, fetchData };
}
