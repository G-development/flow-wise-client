"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Dashboard() {
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("fw-token");

    if (!token) {
      router.push("/login");
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch(`${API_URL}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log(response);

        if (!response.ok) {
          throw new Error("Token non valido");
        }

        const data = await response.json();
        console.log(data);
        setMessage(data.message);
      } catch (error) {
        console.error("Errore:", error);
        localStorage.removeItem("fw-token");
        router.push("/login");
      }
    }

    fetchData();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">{message || "Caricamento..."}</h1>
      <button
        onClick={() => {
          localStorage.removeItem("fw-token");
          router.push("/");
        }}
        className="bg-red-500 text-white p-2 mt-4"
      >
        Logout
      </button>
    </div>
  );
}
