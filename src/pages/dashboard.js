// "use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Dashboard() {
  const [data, setData] = useState({});
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

        if (!response.ok) {
          throw new Error("Token non valido");
        }

        const res = await response.json();
        console.log(res);
        setData(res);
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
      {/* <h1 className="text-2xl font-bold">{data || "Caricamento..."}</h1> */}
      <button
        onClick={() => {
          localStorage.removeItem("fw-token");
          router.push("/");
        }}
      >
        Logout
      </button>

      {Object.keys(data).length === 0 ? (
        <p className="text-gray-500">Nessun dato trovato.</p>
      ) : (
        Object.entries(data).map(([key, items]) => (
          <div key={key} className="mb-6 w-full max-w-md">
            <h2 className="text-xl font-bold capitalize mb-2">{key}</h2>
            {Array.isArray(items) && items.length > 0 ? (
              <ul className="border border-gray-300 rounded-md overflow-hidden">
                {items.map((item) => (
                  <li key={item._id} className="p-2 border-b last:border-none">
                    {new Date(item.date).toLocaleString()} - {item.amount}€
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Nessun dato disponibile.</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
