"use client";

import React, { useState, useRef } from "react";
import { Sun, Moon, Laptop, SlidersHorizontal } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/app-state-context";
import { toast } from "sonner";

export function AppearanceScheduleTab() {
  const { theme, setTheme } = useTheme();
  const { tableDensity, setTableDensity } = useAppState();

  const savedSnapshotRef = useRef({
    theme: theme || "system",
    tableDensity,
  });
  const [hasUnsaved, setHasUnsaved] = useState(false);

  const handleSelectTheme = (nextTheme: string) => {
    setTheme(nextTheme);
    setHasUnsaved(true);
  };

  const handleSelectDensity = (nextDensity: "comfortable" | "compact") => {
    setTableDensity(nextDensity);
    setHasUnsaved(true);
  };

  const handleSave = () => {
    savedSnapshotRef.current = {
      theme: theme || "system",
      tableDensity,
    };
    setHasUnsaved(false);
    toast.success("Preferensi tampilan antarmuka berhasil disimpan.");
  };

  const handleReset = () => {
    setTheme(savedSnapshotRef.current.theme);
    setTableDensity(savedSnapshotRef.current.tableDensity);
    setHasUnsaved(false);
    toast.info("Pengaturan tampilan dikembalikan ke setelan terakhir.");
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="p-5 border-b bg-card">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          Tampilan & Antarmuka
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Atur mode tema visual dan kepadatan baris tabel operasional sesuai kebutuhan kerja Anda.
        </p>
      </div>

      <div className="divide-y text-xs">
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="md:w-1/3">
            <span className="font-medium text-foreground block text-xs">Mode Tema Visual</span>
            <span className="text-[11px] text-muted-foreground">
              Pilih mode terang untuk kondisi lapangan, mode gelap untuk kantor, atau ikuti pengaturan perangkat.
            </span>
          </div>
          <div className="md:w-2/3 flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg max-w-sm border">
            <Button
              type="button"
              size="sm"
              variant={theme === "light" ? "default" : "ghost"}
              onClick={() => handleSelectTheme("light")}
              className="flex-1 h-9 text-xs gap-1.5 shadow-none"
            >
              <Sun className="w-3.5 h-3.5" />
              Terang
            </Button>
            <Button
              type="button"
              size="sm"
              variant={theme === "dark" ? "default" : "ghost"}
              onClick={() => handleSelectTheme("dark")}
              className="flex-1 h-9 text-xs gap-1.5 shadow-none"
            >
              <Moon className="w-3.5 h-3.5" />
              Gelap
            </Button>
            <Button
              type="button"
              size="sm"
              variant={theme === "system" || !theme ? "default" : "ghost"}
              onClick={() => handleSelectTheme("system")}
              className="flex-1 h-9 text-xs gap-1.5 shadow-none"
            >
              <Laptop className="w-3.5 h-3.5" />
              Sistem
            </Button>
          </div>
        </div>

        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="md:w-1/3">
            <span className="font-medium text-foreground block text-xs">Kepadatan Tabel Data</span>
            <span className="text-[11px] text-muted-foreground">
              Mode padat menampilkan lebih banyak baris proyek dan transaksi pengadaan dalam satu layar.
            </span>
          </div>
          <div className="md:w-2/3 flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg max-w-sm border">
            <Button
              type="button"
              size="sm"
              variant={tableDensity === "comfortable" ? "default" : "ghost"}
              onClick={() => handleSelectDensity("comfortable")}
              className="flex-1 h-9 text-xs gap-1.5 shadow-none"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Nyaman
            </Button>
            <Button
              type="button"
              size="sm"
              variant={tableDensity === "compact" ? "default" : "ghost"}
              onClick={() => handleSelectDensity("compact")}
              className="flex-1 h-9 text-xs gap-1.5 shadow-none"
            >
              Padat
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-muted/20 border-t flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={!hasUnsaved}
          className="h-9 text-xs"
        >
          Batal
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          className="h-9 text-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm font-medium"
        >
          Simpan Perubahan
        </Button>
      </div>
    </div>
  );
}
