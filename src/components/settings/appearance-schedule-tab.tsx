"use client";

import React, { useState, useEffect } from "react";
import { Sun, Moon, Laptop, SlidersHorizontal, DollarSign } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useAppState } from "@/context/app-state-context";
import { toast } from "sonner";

export function AppearanceScheduleTab() {
  const { theme, setTheme } = useTheme();
  const { tableDensity, setTableDensity, systemSettings, updateSystemSettings } = useAppState();

  const [dateFormat, setDateFormat] = useState(systemSettings.dateFormat);
  const [currencyFormat, setCurrencyFormat] = useState(systemSettings.currencyFormat);
  const [defaultDurationUnit, setDefaultDurationUnit] = useState(systemSettings.defaultDurationUnit);

  useEffect(() => {
    setDateFormat(systemSettings.dateFormat);
    setCurrencyFormat(systemSettings.currencyFormat);
    setDefaultDurationUnit(systemSettings.defaultDurationUnit);
  }, [systemSettings]);

  const handleSave = () => {
    updateSystemSettings({
      dateFormat: dateFormat as "id-formal" | "id-short" | "iso",
      currencyFormat: currencyFormat as "compact" | "full",
      defaultDurationUnit: defaultDurationUnit as "Hari" | "Minggu" | "Bulan",
    });
    toast.success("Preferensi tampilan dan format angka berhasil disimpan!");
  };

  const handleReset = () => {
    setDateFormat(systemSettings.dateFormat);
    setCurrencyFormat(systemSettings.currencyFormat);
    setDefaultDurationUnit(systemSettings.defaultDurationUnit);
    toast.info("Pengaturan tampilan dikembalikan ke setelan tersimpan");
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
      {/* Card Header */}
      <div className="p-5 border-b bg-card">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          Tampilan & Format Antarmuka
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Atur kenyamanan tema visual, kepadatan tabel operasional, format tanggal, dan ringkasan nilai anggaran.
        </p>
      </div>

      {/* Form Content - 2-Column Rows */}
      <div className="divide-y text-xs">
        {/* Row 1: Mode Tema Visual */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="md:w-1/3">
            <span className="font-medium text-foreground block text-xs">Mode Tema Visual</span>
            <span className="text-[11px] text-muted-foreground">
              Pilih mode terang untuk luar ruangan, mode gelap untuk kantor, atau ikuti pengaturan sistem.
            </span>
          </div>
          <div className="md:w-2/3 flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg max-w-sm border">
            <Button
              type="button"
              size="sm"
              variant={theme === "light" ? "default" : "ghost"}
              onClick={() => setTheme("light")}
              className="flex-1 h-8 text-xs gap-1.5 shadow-none"
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              Terang
            </Button>
            <Button
              type="button"
              size="sm"
              variant={theme === "dark" ? "default" : "ghost"}
              onClick={() => setTheme("dark")}
              className="flex-1 h-8 text-xs gap-1.5 shadow-none"
            >
              <Moon className="w-3.5 h-3.5 text-slate-300" />
              Gelap
            </Button>
            <Button
              type="button"
              size="sm"
              variant={theme === "system" ? "default" : "ghost"}
              onClick={() => setTheme("system")}
              className="flex-1 h-8 text-xs gap-1.5 shadow-none"
            >
              <Laptop className="w-3.5 h-3.5" />
              Sistem
            </Button>
          </div>
        </div>

        {/* Row 2: Kepadatan Tabel Data */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="md:w-1/3">
            <span className="font-medium text-foreground block text-xs">Kepadatan Tabel Data (Density)</span>
            <span className="text-[11px] text-muted-foreground">
              Mode padat (Compact) sangat ideal untuk pemantauan ratusan baris data proyek dan item PR/PO di desktop.
            </span>
          </div>
          <div className="md:w-2/3 flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg max-w-sm border">
            <Button
              type="button"
              size="sm"
              variant={tableDensity === "comfortable" ? "default" : "ghost"}
              onClick={() => setTableDensity("comfortable")}
              className="flex-1 h-8 text-xs gap-1.5 shadow-none"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Comfortable
            </Button>
            <Button
              type="button"
              size="sm"
              variant={tableDensity === "compact" ? "default" : "ghost"}
              onClick={() => setTableDensity("compact")}
              className="flex-1 h-8 text-xs gap-1.5 shadow-none"
            >
              Compact (Padat)
            </Button>
          </div>
        </div>

        {/* Row 3: Format Anggaran Mata Uang */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="md:w-1/3">
            <span className="font-medium text-foreground block text-xs">Format Tampilan Nilai Anggaran</span>
            <span className="text-[11px] text-muted-foreground">
              Penyajian angka nominal AFCE, PR, dan PO pada kartu ringkasan dan dashboard.
            </span>
          </div>
          <div className="md:w-2/3 max-w-md">
            <SearchableSelect
              value={currencyFormat}
              onValueChange={(val) => setCurrencyFormat(val as "compact" | "full")}
              placeholder="Pilih Format Nilai"
              triggerClassName="h-9 text-xs"
              options={[
                { value: "compact", label: "Ringkas (Contoh: Rp 125,50 Jt / Rp 1,2 M)" },
                { value: "full", label: "Lengkap Rupiah Penuh (Contoh: Rp 125.500.000)" },
              ]}
            />
          </div>
        </div>

        {/* Row 4: Format Tanggal Operasional */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="md:w-1/3">
            <span className="font-medium text-foreground block text-xs">Format Tanggal Tampilan</span>
            <span className="text-[11px] text-muted-foreground">
              Format tanggal yang diterapkan di seluruh tabel, form inspeksi, dan dokumen ekspor.
            </span>
          </div>
          <div className="md:w-2/3 max-w-md">
            <SearchableSelect
              value={dateFormat}
              onValueChange={(val) => setDateFormat(val as "id-formal" | "id-short" | "iso")}
              placeholder="Pilih Format Tanggal"
              triggerClassName="h-9 text-xs"
              options={[
                { value: "id-formal", label: "24 Okt 2026 (Bahasa Indonesia)" },
                { value: "id-short", label: "24/10/2026 (DD/MM/YYYY)" },
                { value: "iso", label: "2026-10-24 (ISO Standar SAP ERP)" },
              ]}
            />
          </div>
        </div>

        {/* Row 5: Satuan Default Durasi */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="md:w-1/3">
            <span className="font-medium text-foreground block text-xs">Satuan Default Durasi Fisik</span>
            <span className="text-[11px] text-muted-foreground">
              Unit satuan waktu default ketika membuat paket pekerjaan baru dalam BoQ proyek.
            </span>
          </div>
          <div className="md:w-2/3 max-w-md">
            <SearchableSelect
              value={defaultDurationUnit}
              onValueChange={(val) => setDefaultDurationUnit(val as "Hari" | "Minggu" | "Bulan")}
              placeholder="Pilih Satuan Durasi"
              triggerClassName="h-9 text-xs"
              options={[
                { value: "Hari", label: "Hari Kalender" },
                { value: "Minggu", label: "Minggu Pelaksanaan (Weekly)" },
                { value: "Bulan", label: "Bulan Kalender" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-4 bg-muted/20 border-t flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="h-8 text-xs"
        >
          Batal
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-medium"
        >
          Simpan Perubahan
        </Button>
      </div>
    </div>
  );
}
