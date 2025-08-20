"use client";

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

interface Props {
  data: Record<string, unknown>[];
  caption?: string;
  renderActions?: (row: Record<string, unknown>) => React.ReactNode;
}

export function DynamicTable({
  data,
  caption = "default cap",
  renderActions,
}: Props) {
  if (!Array.isArray(data) || data.length === 0)
    return (
      <div className="flex flex-col items-center justify-center text-center py-8">
        <p className="mb-2">No data available</p>
        <p className="text-sm text-gray-500">
          Try changing the selected date range
        </p>
      </div>
    );

  const columns = data[0] ? Object.keys(data[0]) : [];
  if (columns.length === 0) return <p>No columns available</p>;

  return (
    <>
      <Table>
        <TableCaption>{caption}</TableCaption>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col} className="capitalize">
                {col}
              </TableHead>
            ))}
            {renderActions && (
              <TableHead className="text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i}>
              {columns.map((col) => {
                const value = row[col];
                return (
                  <TableCell key={col}>
                    {value === null || value === undefined
                      ? "-"
                      : React.isValidElement(value)
                      ? value
                      : value.toString()}
                  </TableCell>
                );
              })}
              {renderActions && <TableCell>{renderActions(row)}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
