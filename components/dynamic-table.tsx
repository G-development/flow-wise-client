"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "./ui/button";
import { Pencil, Trash } from "lucide-react";

import EditDialog from "@/app/dashboard/edit-dialog";
import DeleteDialog from "@/app/dashboard/delete-dialog";

interface Props {
  data: Record<string, any>[];
  caption?: string;
}

export function DynamicTable({ data, caption = "default cap" }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);

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
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i}>
              {columns.map((col) => (
                <TableCell key={col}>
                  {row[col] !== null && row[col] !== undefined
                    ? row[col].toString()
                    : "-"}
                </TableCell>
              ))}
              <TableCell className="text-right flex justify-end gap-2">
                {/* Edit */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedId(row.id);
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                {/* Delete */}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setSelectedId(row.id);
                    setDeleteOpen(true);
                  }}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Dialogs */}
      {selectedId && (
        <>
          <EditDialog
            isOpen={editOpen}
            onClose={() => setEditOpen(false)}
            id={selectedId}
          />
          <DeleteDialog
            isOpen={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            id={selectedId}
          />
        </>
      )}
    </>
  );
}
