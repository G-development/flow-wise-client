/***************************************
 * This component should be used       *
 * ONLY in Incomes and Expenses pages  *
 ***************************************/

import React, { useState } from "react";
import { Button } from "./ui/button";
import { Pencil, Trash } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import EditDialog from "@/app/dashboard/edit-dialog";
import DeleteDialog from "@/app/dashboard/delete-dialog";

interface Category {
  name: string;
}

interface Transaction {
  _id: string;
  category?: Category;
  [key: string]: unknown;
}

interface SimpleTableProps {
  data: Transaction[];
  caption?: string;
  fetchData: () => void;
  transactionType: "income" | "expense";
}

const SimpleTable = ({
  data,
  caption = "Default cap",
  fetchData,
  transactionType,
}: SimpleTableProps) => {
  const [transactionToEdit, setTransactionToEdit] = useState<string | null>(
    null
  );
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(
    null
  );

  if (data.length === 0) return <div>No data available</div>;

  const removeHeaders = ["_id", "user", "createdAt", "updatedAt", "__v"];
  const headers = Object.keys(data[0]).filter(
    (key) => !removeHeaders.includes(key)
  );

  return (
    <Table className="caption-top">
      <TableCaption>{caption}</TableCaption>
      <TableHeader>
        <TableRow>
          {headers.map((header) => (
            <TableHead key={header}>
              {header.charAt(0).toUpperCase() + header.slice(1)}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((income, index) => (
          <TableRow key={String(income._id) ?? index}>
            {headers.map((header) => (
              <TableCell key={header}>
                {(() => {
                  if (header === "category") {
                    return income.category?.name
                      ? income.category.name.charAt(0).toUpperCase() +
                          income.category.name.slice(1)
                      : "No category";
                  }

                  if (header === "date") {
                    const dateValue = income.date as
                      | string
                      | number
                      | undefined;

                    if (!dateValue) return "N/A";

                    const date = new Date(dateValue);
                    return !isNaN(date.getTime())
                      ? date.toLocaleDateString()
                      : "N/A";
                  }

                  return String(income[header] ?? "N/A");
                })()}
              </TableCell>
            ))}
            <TableCell className="text-right flex justify-end gap-2">
              {/* Edit */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTransactionToEdit(income._id)} // Imposta l'ID della transazione da eliminare
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <EditDialog
                isOpen={transactionToEdit === income._id} // Mostra solo per la transazione selezionata
                onClose={() => setTransactionToEdit(null)} // Chiudi il dialogo
                transactionType={transactionType}
                id={income._id}
                fetchData={fetchData}
              />

              {/* Delete */}
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setTransactionToDelete(income._id)} // Imposta l'ID della transazione da eliminare
              >
                <Trash className="h-4 w-4" />
              </Button>
              <DeleteDialog
                isOpen={transactionToDelete === income._id}
                onClose={() => setTransactionToDelete(null)} // Chiudi il dialogo
                transactionType={transactionType}
                id={income._id}
                fetchData={fetchData}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default SimpleTable;
