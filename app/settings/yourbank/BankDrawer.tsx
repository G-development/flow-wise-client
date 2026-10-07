"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export interface Institution {
  id: string;
  name: string;
}

interface BankDrawerProps {
  institutions: Institution[];
  loading: boolean;
  connecting: boolean;
  linkBank: () => Promise<boolean>;
  selectedInstitution: string;
  setSelectedInstitution: Dispatch<SetStateAction<string>>;
}

export default function BankDrawer({
  institutions,
  loading,
  connecting,
  linkBank,
  selectedInstitution,
  setSelectedInstitution,
}: BankDrawerProps) {
  const [open, setOpen] = useState(false);

  const handleLink = async () => {
    if (await linkBank()) setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button type="button" className="gap-2">
          <Plus size={18} />
          Collega banca
        </Button>
      </DrawerTrigger>

      <DrawerContent className="p-4">
        <DrawerHeader>
          <DrawerTitle>Collega la tua banca</DrawerTitle>
        </DrawerHeader>

        <div className="space-y-4 px-4 pb-6">
          <div className="space-y-2">
            <label htmlFor="bank-institution" className="text-sm font-medium">
              Seleziona la tua banca
            </label>
            <select
              id="bank-institution"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={selectedInstitution}
              onChange={(event) => setSelectedInstitution(event.target.value)}
              disabled={loading || institutions.length === 0}
            >
              <option value="">
                {loading
                  ? "Caricamento banche..."
                  : institutions.length === 0
                    ? "Nessuna banca disponibile"
                    : "Seleziona"}
              </option>
              {institutions.map((institution) => (
                <option key={institution.id} value={institution.id}>
                  {institution.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="button"
            className="w-full"
            onClick={() => void handleLink()}
            disabled={
              !selectedInstitution ||
              loading ||
              connecting
            }
          >
            {connecting ? "Preparazione del collegamento..." : "Continua"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
