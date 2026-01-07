"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/navbar";
import Papa from "papaparse";
import { parse } from "date-fns";
import { apiFetch } from "@/lib/api";

interface csvRow {
  Type: string;
  Amount: string;
  Date: string;
  Category: string;
}

export default function Import() {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: Papa.ParseResult<csvRow>) => {
        const rows = results.data;

        rows.forEach((r) => {
          console.log(r.Date);
        });

        const valid = rows.filter(
          (r) =>
            ["I", "E"].includes(r.Type?.trim()) &&
            !isNaN(parseFloat(r.Amount)) &&
            !isNaN(new Date(r.Date).getTime()) &&
            r.Category?.trim()
        );

        const income = valid
          .filter((r) => r.Type === "I")
          .map((r) => ({
            amount: parseFloat(r.Amount.replace(",", ".")),
            date: parse(r.Date, "dd/MM/yyyy", new Date()),
            category: r.Category.trim(),
          }));

        const expense = valid
          .filter((r) => r.Type === "E")
          .map((r) => ({
            amount: parseFloat(r.Amount),
            date: new Date(r.Date),
            category: r.Category.trim(),
          }));

        console.log(JSON.stringify({ income, expense }));

        const res = await apiFetch("/import", {
          method: "POST",
          body: JSON.stringify({ income, expense }),
        });

        if (res.ok) alert("Import done!");
        else alert("Error while trying to import.");
      },
    });
  };

  return (
    <>
      <Navbar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-2 lg:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight">
            Import utility - WIP
          </h1>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6 text-center space-y-2  my-6">
            <p className="text-lg font-medium">How it works</p>
            <p className="text-sm text-muted-foreground">
              Upload a <code>.csv</code> file containing your transactions.
              <br />
              The first row must contain exactly: <br />
              <b>Type</b>, <b>Amount</b>, <b>Date</b>, <b>Category</b> <br />
              and then the data.
            </p>
            <p className="text-sm text-muted-foreground">Example:</p>

            <div className="flex justify-center gap-5 text-sm font-mono">
              <code>
                Type;Amount;Date;Category <br />
                I;261,88;02/04/2025;Salary <br />
                I;88,96;03/04/2025;Salary <br />
                I;98,85;04/04/2025;Test <br />
                E;721,68;04/04/2025;Rent <br />
                E;501,83;06/04/2025;Transports <br />
                I;102,5;07/04/2025;Test <br />
                E;310,56;08/04/2025;Online <br />
              </code>
            </div>

            <div className="grid w-full max-w-sm items-center gap-2 mx-auto p-8">
              <Label htmlFor="csv">
                Upload <code>.csv</code> file
              </Label>
              <Input id="csv" accept=".csv" type="file" onChange={handleFile} />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
