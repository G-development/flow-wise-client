"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// import { Nav } from "@/components/nav-menu";
import Navbar from "@/components/navbar";

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

  // return <Nav />;
  return (
    <div>
      <Navbar />
      <div className="mx-auto w-[90%] md:w-[80%]">
        {Object.entries(data).map(([key, transactions]): any => (
          <Table key={key}>
            <TableCaption>
              A list of your recent {key} transactions.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] capitalize">{key}</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(transactions as any).map((item: any) => (
                <TableRow key={item._id}>
                  <TableCell className="font-medium capitalize">
                    {key}
                  </TableCell>
                  <TableCell className="truncate max-w-[10ch] md:max-w-none">
                    {item.category}
                  </TableCell>
                  <TableCell>
                    {new Date(item.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell
                    className={`text-right ${
                      key === "income" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {key === "income" ? "$" : "-$"}
                    {item.amount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ))}
      </div>
    </div>
  );
}
