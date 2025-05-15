"use client";

import { useState } from "react";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Plus } from "lucide-react";

export default function BankDrawer({
  institutions,
  accessToken,
  linkBank,
  selectedInstitution,
  setSelectedInstitution,
  requisitionId,
}) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded hover:bg-gray-700">
          <Plus size={20} />
          Collega banca
        </button>
      </DrawerTrigger>

      <DrawerContent className="p-4">
        <DrawerHeader>
          <DrawerTitle>Link your bank</DrawerTitle>
        </DrawerHeader>
        {!requisitionId && (
          <>
            <div className="mt-4">
              <label className="block font-medium mb-2">
                Seleziona la tua banca:
              </label>
              <select
                className="border px-4 py-2 rounded w-full"
                value={selectedInstitution}
                onChange={(e) => setSelectedInstitution(e.target.value)}
              >
                <option value="">Seleziona</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                linkBank();
                setOpen(false); // Chiudi il Drawer dopo la selezione
              }}
              disabled={!selectedInstitution || !accessToken}
              className="mt-4 w-full bg-black text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Collega la banca
            </button>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
