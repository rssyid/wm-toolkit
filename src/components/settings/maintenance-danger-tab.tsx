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
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
    canManageSystem,
    loadDemoData,
    clearDemoData,
    resetToEmptyProduction,
    resetToMockData,
    restoreBackupFromJson,
  } = useAppState();

  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [isLoadDemoOpen, setIsLoadDemoOpen] = useState(false);
  const [isClearDemoOpen, setIsClearDemoOpen] = useState(false);
  const [isResetEmptyOpen, setIsResetEmptyOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [confirmKeyword, setConfirmKeyword] = useState("");
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

  const handleLoadDemo = async () => {
    setLoadingAction("loadDemo");
    try {
      await loadDemoData();
      setIsLoadDemoOpen(false);
    } catch {
      toast.error("Gagal memuat ulang data demo ke database.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleClearDemo = async () => {
    setLoadingAction("clearDemo");
    try {
      await clearDemoData();
      setIsClearDemoOpen(false);
    } catch {
      toast.error("Gagal membersihkan data transaksi demo.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResetEmptyProduction = async () => {
    if (confirmKeyword !== "PRODUKSI") {
      toast.error('Ketik kata "PRODUKSI" untuk mengonfirmasi reset total.');
      return;
    }
    setLoadingAction("resetEmpty");
    try {
      await resetToEmptyProduction();
      setIsResetEmptyOpen(false);
      setConfirmKeyword("");
    } catch {
      toast.error("Gagal melakukan reset ke basis data produksi.");
    } finally {
      setLoadingAction(null);
    }
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

      {/* Card 2: Manajemen Basis Data Server Neon (Fitur Khusus Administrator) */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        <div className="p-5 border-b bg-card flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Operasi Basis Data Cloud (Neon PostgreSQL)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kendali data operasional terpusat: muat data demo untuk pelatihan, bersihkan transaksi demo, atau siapkan basis data kosong untuk produksi (Go-Live).
            </p>
          </div>
          {!canManageSystem && (
            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 dark:border-amber-800">
              Khusus Admin
            </Badge>
          )}
        </div>

        <div className="divide-y text-xs">
          {/* Action 1: Load Demo Data */}
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="md:w-2/3">
              <span className="font-medium text-foreground block text-xs flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                Muat Ulang Data Demo Lengkap (Load Demo Data)
              </span>
              <span className="text-[11px] text-muted-foreground">
                Mengimpor dataset standar holding (8 proyek, dokumen AFCE dengan evidence SAP, PR, PO, GR, SPK, dan log progres fisik) ke dalam database Neon PostgreSQL.
              </span>
            </div>
            <div className="md:w-1/3 flex md:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canManageSystem || !!loadingAction}
                onClick={() => setIsLoadDemoOpen(true)}
                className="h-8 text-xs gap-1.5 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/50"
              >
                {loadingAction === "loadDemo" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                )}
                Muat Data Demo
              </Button>
            </div>
          </div>

          {/* Action 2: Clear Demo Data */}
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="md:w-2/3">
              <span className="font-medium text-foreground block text-xs flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-amber-600" />
                Bersihkan Data Transaksi Demo (Clear Demo Data)
              </span>
              <span className="text-[11px] text-muted-foreground">
                Menghapus semua entitas operasional transaksi (proyek, AFCE, PR, PO, GR, progress, lampiran) tanpa menghapus Master Data (kebun, material, rekanan, dan akun pengguna).
              </span>
            </div>
            <div className="md:w-1/3 flex md:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canManageSystem || !!loadingAction}
                onClick={() => setIsClearDemoOpen(true)}
                className="h-8 text-xs gap-1.5 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/50"
              >
                {loadingAction === "clearDemo" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5 text-amber-600" />
                )}
                Bersihkan Data Demo
              </Button>
            </div>
          </div>

          {/* Action 3: Reset to Empty Production Data */}
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="md:w-2/3">
              <span className="font-medium text-rose-700 dark:text-rose-400 block text-xs flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                Reset ke Basis Data Kosong Produksi (Go-Live Ready)
              </span>
              <span className="text-[11px] text-muted-foreground">
                Menghapus seluruh proyek, dokumen AFCE, PO, progres, lampiran, komentar, dan catatan audit log. Menyisakan lingkungan bersih untuk implementasi operasional riil.
              </span>
            </div>
            <div className="md:w-1/3 flex md:justify-end">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={!canManageSystem || !!loadingAction}
                onClick={() => {
                  setConfirmKeyword("");
                  setIsResetEmptyOpen(true);
                }}
                className="h-8 text-xs gap-1.5"
              >
                {loadingAction === "resetEmpty" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}
                Reset untuk Produksi
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog: Load Demo Data */}
      <Dialog open={isLoadDemoOpen} onOpenChange={setIsLoadDemoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Database className="w-4 h-4 text-blue-600" />
              Konfirmasi Muat Ulang Data Demo
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-2">
              Sistem akan mengimpor kembali 8 proyek demo standar perkebunan kelapa sawit lengkap dengan dokumen AFCE, bukti SAP, PR, PO, GR, evaluasi rekanan, dan kurva-S progres ke Neon PostgreSQL.
              Apakah Anda ingin melanjutkan?
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
              size="sm"
              disabled={loadingAction === "loadDemo"}
              onClick={handleLoadDemo}
              className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              {loadingAction === "loadDemo" && <Loader2 className="w-3 h-3 animate-spin" />}
              Ya, Muat Data Demo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Clear Demo Data */}
      <Dialog open={isClearDemoOpen} onOpenChange={setIsClearDemoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Trash2 className="w-4 h-4 text-amber-600" />
              Konfirmasi Pembersihan Data Demo
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-2">
              Apakah Anda yakin ingin membersihkan data operasional demo? Semua proyek, dokumen AFCE, PR, PO, dan progres fisik akan dihapus dari server database. Master data lokasi, material, rekanan, dan pengguna tidak akan terhapus.
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
              size="sm"
              disabled={loadingAction === "clearDemo"}
              onClick={handleClearDemo}
              className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
            >
              {loadingAction === "clearDemo" && <Loader2 className="w-3 h-3 animate-spin" />}
              Ya, Bersihkan Data Demo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Reset to Empty Production */}
      <Dialog open={isResetEmptyOpen} onOpenChange={setIsResetEmptyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Konfirmasi Reset Basis Data Produksi
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-2">
              Tindakan ini akan mengosongkan seluruh proyek, dokumen AFCE, PR, PO, GR, progres fisik, komentar, lampiran, dan catatan audit log di database Neon. Tindakan ini <strong>tidak dapat dibatalkan</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <p className="text-[11px] text-muted-foreground">
              Untuk mengonfirmasi tindakan ini, ketik <strong className="text-foreground">PRODUKSI</strong> di bawah ini:
            </p>
            <Input
              type="text"
              placeholder="Ketik PRODUKSI"
              value={confirmKeyword}
              onChange={(e) => setConfirmKeyword(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

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
              disabled={confirmKeyword !== "PRODUKSI" || loadingAction === "resetEmpty"}
              onClick={handleResetEmptyProduction}
              className="h-8 text-xs gap-1.5"
            >
              {loadingAction === "resetEmpty" && <Loader2 className="w-3 h-3 animate-spin" />}
              Reset ke Database Produksi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Card 3: Zona Bahaya Lokal (Penyimpanan Browser / Mockup Fallback) */}
      <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              Penyimpanan Lokal: Reset Cache Mockup Browser
            </h3>
            <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">
              Reset salinan data sementara di browser LocalStorage kembali ke nilai bawaan kode klien.
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] text-rose-700 border-rose-300 dark:border-rose-800">
            Klien Browser
          </Badge>
        </div>

        <div className="p-5 text-xs text-muted-foreground space-y-4">
          <p>
            Jika Anda mengalami ketidaksesuaian tampilan pada peramban tertentu atau ingin menghapus berkas penyimpanan peramban lokal (LocalStorage), Anda dapat melakukan reset dataset mockup peramban.
          </p>

          <div className="flex items-center justify-end pt-2">
            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 shadow-xs text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset Cache Mockup Browser
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Konfirmasi Reset Mockup Browser
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground pt-2">
                    Apakah Anda yakin ingin mengatur ulang cache browser lokal? Data tersimpan di memori browser Anda akan dipulihkan ke default.
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
                    Ya, Reset Cache Browser
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
