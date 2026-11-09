"use client";

import React, { useState, useRef } from "react";
import {
  Database,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  AlertTriangle,
  FolderGit2,
  HardDrive,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useAppState } from "@/context/app-state-context";
import { toast } from "sonner";

export function MaintenanceDangerTab() {
  const {
    projects,
    afces,
    prs,
    pos,
    grs,
    dailyProgress,
    weeklyProgress,
    regions,
    companies,
    locations,
    blocks,
    materials,
    suppliers,
    users,
    approvalMatrix,
    userProfile,
    systemSettings,
    resetToMockData,
    restoreBackupFromJson,
  } = useAppState();

  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [stagedJsonData, setStagedJsonData] = useState<any>(null);
  const [stagedFileName, setStagedFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJson = () => {
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        version: "1.0",
        appName: "WM-Toolkit Project Management Perkebunan",
        data: {
          projectsCount: projects.length,
          afcesCount: afces.length,
          prsCount: prs.length,
          posCount: pos.length,
          grsCount: grs.length,
          dailyProgressCount: dailyProgress.length,
          weeklyProgressCount: weeklyProgress.length,
          projects,
          afces,
          prs,
          pos,
          grs,
          dailyProgress,
          weeklyProgress,
          regions,
          companies,
          locations,
          blocks,
          materials,
          suppliers,
          users,
          approvalMatrix,
          userProfile,
          systemSettings,
        },
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `wm_toolkit_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast.success("Cadangan data JSON berhasil diekspor dan diunduh!");
    } catch {
      toast.error("Gagal mengekspor data cadangan.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setStagedJsonData(parsed);
        setStagedFileName(file.name);
        setIsImportConfirmOpen(true);
      } catch {
        toast.error("Format berkas tidak valid. Harap pilih berkas JSON yang benar.");
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = "";
  };

  const handleConfirmImport = () => {
    if (!stagedJsonData) return;
    const res = restoreBackupFromJson(stagedJsonData);
    if (res.success) {
      toast.success(res.message);
      setIsImportConfirmOpen(false);
      setStagedJsonData(null);
    } else {
      toast.error(res.message);
    }
  };

  const handleConfirmReset = () => {
    resetToMockData();
    setIsResetDialogOpen(false);
    toast.success("Database lokal berhasil direset kembali ke kondisi dataset demo awal!");
  };

  const handleFlushCache = () => {
    toast.success("Cache sementara sesi antarmuka berhasil dibersihkan!");
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input for JSON Restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Card 1: Status Database & Cadangan Data */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        <div className="p-5 border-b bg-card">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Status Penyimpanan & Cadangan Basis Data
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Informasi volume catatan operasional yang tersimpan pada sistem lokal, opsi ekspor berkas, dan pemulihan cadangan data.
          </p>
        </div>

        <div className="divide-y text-xs">
          {/* Row 1: Status Volume Data */}
          <div className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="md:w-1/3">
              <span className="font-medium text-foreground block text-xs">
                Volume Rekod Tersimpan
              </span>
              <span className="text-[11px] text-muted-foreground">
                Ringkasan total entitas data aktif yang dimuat dalam memori kerja aplikasi.
              </span>
            </div>
            <div className="md:w-2/3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-lg border bg-muted/30">
                <span className="text-[10px] text-muted-foreground block">Total Proyek Fisik</span>
                <span className="text-base font-bold text-foreground mt-0.5 block">
                  {projects.length}
                </span>
              </div>
              <div className="p-2.5 rounded-lg border bg-muted/30">
                <span className="text-[10px] text-muted-foreground block">Dokumen AFCE</span>
                <span className="text-base font-bold text-foreground mt-0.5 block">
                  {afces.length}
                </span>
              </div>
              <div className="p-2.5 rounded-lg border bg-muted/30">
                <span className="text-[10px] text-muted-foreground block">Purchase Requisition</span>
                <span className="text-base font-bold text-foreground mt-0.5 block">
                  {prs.length}
                </span>
              </div>
              <div className="p-2.5 rounded-lg border bg-muted/30">
                <span className="text-[10px] text-muted-foreground block">Purchase Order (PO)</span>
                <span className="text-base font-bold text-foreground mt-0.5 block">
                  {pos.length}
                </span>
              </div>
              <div className="p-2.5 rounded-lg border bg-muted/30">
                <span className="text-[10px] text-muted-foreground block">Penerimaan GR</span>
                <span className="text-base font-bold text-foreground mt-0.5 block">
                  {grs.length}
                </span>
              </div>
              <div className="p-2.5 rounded-lg border bg-muted/30">
                <span className="text-[10px] text-muted-foreground block">Log Progres Lapangan</span>
                <span className="text-base font-bold text-foreground mt-0.5 block">
                  {dailyProgress.length + weeklyProgress.length}
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Ekspor Data JSON */}
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="md:w-2/3">
              <span className="font-medium text-foreground block text-xs">
                Ekspor Cadangan Lengkap (JSON Snapshot)
              </span>
              <span className="text-[11px] text-muted-foreground">
                Unduh seluruh struktur proyek, matriks persetujuan, dan pengadaan dalam berkas JSON mandiri.
              </span>
            </div>
            <div className="md:w-1/3 flex md:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportJson}
                className="h-8 text-xs gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-muted-foreground" />
                Unduh Berkas JSON
              </Button>
            </div>
          </div>

          {/* Row 3: Impor / Pulihkan Cadangan Data JSON */}
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="md:w-2/3">
              <span className="font-medium text-foreground block text-xs">
                Impor & Pulihkan Cadangan (Restore JSON Snapshot)
              </span>
              <span className="text-[11px] text-muted-foreground">
                Unggah berkas cadangan JSON untuk memulihkan seluruh basis data proyek dan konfigurasi sistem.
              </span>
            </div>
            <div className="md:w-1/3 flex md:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 text-xs gap-1.5 shadow-xs bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                Pilih Berkas JSON Cadangan
              </Button>
            </div>
          </div>

          {/* Row 4: Bersihkan Cache */}
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="md:w-2/3">
              <span className="font-medium text-foreground block text-xs">
                Segarkan Penyimpanan Cache Sesi
              </span>
              <span className="text-[11px] text-muted-foreground">
                Bersihkan data penelusuran sementara dan filter tabel tanpa memodifikasi isi master data.
              </span>
            </div>
            <div className="md:w-1/3 flex md:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFlushCache}
                className="h-8 text-xs gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                Bersihkan Cache
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for JSON Restore */}
      <Dialog open={isImportConfirmOpen} onOpenChange={setIsImportConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Upload className="w-4 h-4 text-emerald-600" />
              Konfirmasi Pemulihan Cadangan Data
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-2">
              Berkas cadangan <strong>{stagedFileName}</strong> siap dipulihkan.
              Tindakan ini akan menggantikan dataset yang saat ini aktif dengan data dari berkas cadangan tersebut. Apakah Anda ingin melanjutkan?
            </DialogDescription>
          </DialogHeader>

          {stagedJsonData && (
            <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1 border">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Waktu Ekspor:</span>
                <span className="font-mono text-foreground">{stagedJsonData.exportedAt ? new Date(stagedJsonData.exportedAt).toLocaleString("id-ID") : "-"}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Perkiraan Proyek:</span>
                <span className="font-semibold text-foreground">
                  {stagedJsonData.data?.projects?.length ?? stagedJsonData.projects?.length ?? 0} Proyek
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs">
                Batal
              </Button>
            </DialogClose>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmImport}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Pulihkan Data Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Card 2: Zona Bahaya (Danger Zone / Delete-Reset Actions) */}
      <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              Zona Bahaya: Reset Database Simulasi (Demo Dataset)
            </h3>
            <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">
              Tindakan ini akan mengembalikan seluruh dataset aplikasi ke kondisi standar awal demo.
            </p>
          </div>
          <Badge variant="destructive" className="text-[10px] font-mono uppercase">
            Irreversible
          </Badge>
        </div>

        <div className="p-5 text-xs text-muted-foreground space-y-4">
          <p>
            Jika Anda melakukan reset, semua penambahan proyek baru, perubahan persetujuan AFCE, dokumen rilis PR,
            Purchase Order (PO), pencatatan Goods Receipt (GR), dan kurva-S progres fisik yang telah Anda inputkan
            akan digantikan kembali dengan 8 proyek percontohan standar holding.
          </p>

          <div className="flex items-center justify-end pt-2">
            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-8 text-xs gap-1.5 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset Semua Data Mockup
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Konfirmasi Pemulihan Dataset Awal
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground pt-2">
                    Apakah Anda yakin ingin mengatur ulang seluruh database aplikasi? Seluruh data proyek, PR, PO,
                    dan progres yang telah Anda ubah pada sesi ini akan digantikan kembali ke data bawaan awal.
                  </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" size="sm" className="h-8 text-xs">
                      Batal
                    </Button>
                  </DialogClose>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleConfirmReset}
                    className="h-8 text-xs"
                  >
                    Ya, Reset Database
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
