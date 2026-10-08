"use client";

import { useState, useMemo, type Dispatch, type SetStateAction } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Landmark, Search, ShieldCheck, ArrowRight } from "lucide-react";

export interface Institution {
  id: string;
  name: string;
  color?: string;
  type?: string;
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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredInstitutions = useMemo(() => {
    if (!searchQuery.trim()) return institutions;
    const q = searchQuery.toLowerCase();
    return institutions.filter((inst) => inst.name.toLowerCase().includes(q));
  }, [institutions, searchQuery]);

  const handleLink = async (institutionId?: string) => {
    if (institutionId) {
      setSelectedInstitution(institutionId);
    }
    const success = await linkBank();
    if (success) {
      setOpen(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button type="button" className="gap-2 shadow-sm font-medium">
          <Plus size={18} />
          Collega banca
        </Button>
      </DrawerTrigger>

      <DrawerContent className="max-w-2xl mx-auto p-4 md:p-6">
        <DrawerHeader className="text-left px-2 pt-2">
          <DrawerTitle className="text-xl font-bold tracking-tight">
            Collega il tuo conto bancario
          </DrawerTitle>
          <DrawerDescription className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Connessione sicura in sola lettura tramite protocollo PSD2 / Open Banking.
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-4 px-2 py-4">
          {/* Barra di ricerca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca la tua banca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 bg-background"
            />
          </div>

          {/* Lista Banche */}
          <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <p className="text-center py-8 text-sm text-muted-foreground">
                Caricamento degli istituti disponibili...
              </p>
            ) : filteredInstitutions.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Nessun istituto trovato per &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredInstitutions.map((institution) => {
                const isSelected = selectedInstitution === institution.id;
                const isSandbox =
                  institution.type === "sandbox" || institution.id === "sandbox";

                return (
                  <button
                    key={institution.id}
                    type="button"
                    onClick={() => setSelectedInstitution(institution.id)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border/70 hover:border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-sm"
                        style={{
                          backgroundColor: institution.color || "#0284c7",
                        }}
                      >
                        <Landmark className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-foreground">
                            {institution.name}
                          </p>
                          {isSandbox && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal border-sky-500/30 text-sky-500">
                              Sandbox Test
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {isSandbox
                            ? "Ambiente di prova istantaneo con movimenti realistici"
                            : "Accesso sicuro a conti e movimenti"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Azione di Connessione */}
          <div className="pt-2">
            <Button
              type="button"
              className="w-full h-11 text-base font-semibold gap-2 shadow-sm"
              onClick={() => void handleLink()}
              disabled={!selectedInstitution || loading || connecting}
            >
              {connecting ? (
                "Preparazione del collegamento..."
              ) : (
                <>
                  Continua e Autorizza <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground mt-2">
              Verrai reindirizzato all&apos;interfaccia di autorizzazione per confermare l&apos;accesso in sola lettura.
            </p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
