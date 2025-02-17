/***************************************
 * This component should be used       *
 * ONLY in Incomes and Expenses pages  *
 ***************************************/

import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
}

const SimpleTable = ({ data, caption = "Default cap" }: SimpleTableProps) => {
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
                {/* {header === "category"
                  ? income.category?.name
                    ? income.category.name.charAt(0).toUpperCase() +
                      income.category.name.slice(1)
                    : "No category"
                  : String(income[header])} */}
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default SimpleTable;
