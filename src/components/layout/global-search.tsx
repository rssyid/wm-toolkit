"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { useAppState } from "@/context/app-state-context";
import { FolderGit2, FileText, ShoppingCart, MapPin, Package, Users } from "lucide-react";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { projects, afces, prs, pos, locations, materials } = useAppState();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-muted/60 hover:bg-muted border rounded-md transition-colors w-64 justify-between"
      >
        <span className="flex items-center gap-1.5">
          <span className="text-[13px]">🔍</span>
          <span>Cari proyek, AFCE, PR, PO...</span>
        </span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">Ctrl</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Ketik kata kunci untuk mencari..." />
        <CommandList>
          <CommandEmpty>Tidak ditemukan hasil.</CommandEmpty>

          <CommandGroup heading="Proyek Estate">
            {projects.slice(0, 5).map((p) => (
              <CommandItem
                key={p.id}
                onSelect={() => handleSelect(`/workspace/${p.id}`)}
                className="flex items-center gap-2 py-2"
              >
                <FolderGit2 className="w-4 h-4 text-emerald-600" />
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{p.code} - {p.name}</span>
                  <span className="text-[11px] text-muted-foreground">{p.locationName} &bull; {p.status} ({p.progress}%)</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Dokumen AFCE">
            {afces.slice(0, 3).map((a) => (
              <CommandItem
                key={a.id}
                onSelect={() => handleSelect(`/workspace/${a.projectId}/afce`)}
                className="flex items-center gap-2 py-2"
              >
                <FileText className="w-4 h-4 text-amber-500" />
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{a.afceNumber} &bull; {a.projectName}</span>
                  <span className="text-[11px] text-muted-foreground">Status: {a.status} &bull; {a.currentApproverRole}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Purchase Order (PO)">
            {pos.slice(0, 3).map((po) => (
              <CommandItem
                key={po.id}
                onSelect={() => handleSelect(`/workspace/${po.projectId}/po`)}
                className="flex items-center gap-2 py-2"
              >
                <ShoppingCart className="w-4 h-4 text-blue-500" />
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{po.poNumber} &bull; {po.supplierName}</span>
                  <span className="text-[11px] text-muted-foreground">{po.status} &bull; Penerimaan: {po.receiptProgressPercent}%</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Master Data">
            <CommandItem onSelect={() => handleSelect("/master-data/locations")} className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span>Daftar Kebun / Estate ({locations.length} lokasi)</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/master-data/materials")} className="flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-500" />
              <span>Katalog Material SAP ({materials.length} item)</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/master-data/approval-matrix")} className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <span>Matriks Persetujuan AFCE</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
