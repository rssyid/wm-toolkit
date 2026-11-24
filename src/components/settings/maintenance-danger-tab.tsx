"use client";

import React, { useState } from "react";
import {
  Database,
  Download,
  Trash2,
  AlertTriangle,
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
    vendorEvaluations,
    goodsHandovers,
    uspks,
    technicalEvaluations,
    spkContracts,
    dailyProgress,
    weeklyProgress,
    comments,
    attachments,
    auditLogs,
    notifications,
    regions,
    companies,
    locations,
    blocks,
    materials,
    suppliers,
    users,
    approvalMatrix,
    projectCategories,
    projectTypes,
    procurementTypes,
    userProfile,
    canManageSystem,
    clearDemoData,
    resetToEmptyProduction,
  } = useAppState();

  const [isClearDemoOpen, setIsClearDemoOpen] = useState(false);
  const [isResetEmptyOpen, setIsResetEmptyOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [confirmKeyword, setConfirmKeyword] = useState("");

  const handleExportJson = () => {
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        version: "2.0",
        appName: "WM-Toolkit Project Management Perkebunan",
        data: {
          projects,
          afces,
          prs,
          pos,
          grs,
          vendorEvaluations,
          goodsHandovers,
          uspks,
          technicalEvaluations,
          spkContracts,
          dailyProgress,
          weeklyProgress,
          comments,
          attachments,
          auditLogs,
          notifications,
          regions,
          companies,
          locations,
          blocks,
          materials,
          suppliers,
          users,
          approvalMatrix,
          projectCategories,
          projectTypes,
          procurementTypes,
          userProfile,
        },
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.href = url;
      downloadAnchor.download = `wm_toolkit_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);

      toast.success("Cadangan data JSON berhasil diekspor dan diunduh.");
    } catch {
      toast.error("Gagal mengekspor data cadangan.");
    }
  };

  const handleClearDemo = async () => {
    setLoadingAction("clearDemo");
    try {
      const ok = await clearDemoData();
      if (ok) {
        setIsClearDemoOpen(false);
      }
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
      const ok = await resetToEmptyProduction(confirmKeyword);
      if (ok) {
        setIsResetEmptyOpen(false);
        setConfirmKeyword("");
      }
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="p-5 border-b bg-card">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Ringkasan Data & Ekspor Cadangan
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ringkasan jumlah entitas aktif pada database dan unduhan arsip JSON untuk keperluan dokumentasi.
          </p>
        </div>

        <div className="divide-y text-xs">
          <div className="p-5 space-y-3">
            <div>
              <span className="font-medium text-foreground block text-xs">
                Volume Rekod Tersimpan
              </span>
              <span className="text-[11px] text-muted-foreground">
                Total entitas transaksi proyek yang aktif terhubung dengan PostgreSQL.
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border bg-muted/30">
                <span className="text-[11px] text-muted-foreground block">Proyek Aktif</span>
                <span className="text-base font-bold text-foreground mt-0.5 block">
                  {projects.length}
                </span>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <span className="text-[11px] text-muted-foreground block">Dokumen AFCE</span>
                <span className="text-base font-bold text-foreground mt-0.5 block">
                  {afces.length}
                </span>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <span className="text-[11px] text-muted-foreground block">PO &amp; SPK</span>
                <span className="text-base font-bold text-foreground mt-0.5 block">
                  {pos.length + spkContracts.length}
                </span>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <span className="text-[11px] text-muted-foreground block">Log Progres</span>
                <span className="text-base font-bold text-foreground mt-0.5 block">
                  {dailyProgress.length + weeklyProgress.length}
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="md:w-2/3">
              <span className="font-medium text-foreground block text-xs">
                Ekspor Arsip Lengkap (JSON)
              </span>
              <span className="text-[11px] text-muted-foreground">
                Unduh seluruh struktur proyek, matriks persetujuan, pengadaan barang/jasa, progres, diskusi, dan master data dalam berkas JSON.
              </span>
            </div>
            <div className="md:w-1/3 flex md:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportJson}
                className="h-9 text-xs gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-muted-foreground" />
                Unduh Berkas JSON
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="p-5 border-b border-rose-100 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/10 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Database className="w-4 h-4 text-rose-700 dark:text-rose-400" />
              Operasi Basis Data (PostgreSQL)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pembersihan data transaksi proyek dan penyiapan lingkungan awal produksi. Master data dan akun pengguna tetap dipertahankan.
            </p>
          </div>
          {!canManageSystem && (
            <Badge variant="outline" className="text-[11px] text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800">
              Khusus Admin
            </Badge>
          )}
        </div>

        <div className="divide-y text-xs">
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="md:w-2/3">
              <span className="font-medium text-foreground block text-xs flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                Kosongkan Data Transaksi Proyek
              </span>
              <span className="text-[11px] text-muted-foreground">
                Menghapus seluruh transaksi proyek (proyek, AFCE, PR, PO, GR, BAST, USPK, SPK, progres, diskusi, lampiran) tanpa menghapus Master Data, akun pengguna, dan catatan audit log historis.
              </span>
            </div>
            <div className="md:w-1/3 flex md:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canManageSystem || !!loadingAction}
                onClick={() => setIsClearDemoOpen(true)}
                className="h-9 text-xs gap-1.5 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/60"
              >
                {loadingAction === "clearDemo" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Kosongkan Transaksi
              </Button>
            </div>
          </div>

          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="md:w-2/3">
              <span className="font-medium text-rose-700 dark:text-rose-400 block text-xs flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Reset ke Basis Data Kosong Produksi
              </span>
              <span className="text-[11px] text-muted-foreground">
                Menghapus seluruh transaksi proyek sekaligus membersihkan notifikasi dan catatan audit log historis agar siap untuk lingkungan operasional baru.
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
                className="h-9 text-xs gap-1.5"
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

      <Dialog open={isClearDemoOpen} onOpenChange={setIsClearDemoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <Trash2 className="w-4 h-4" />
              Konfirmasi Pengosongan Transaksi Proyek
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-2">
              Apakah Anda yakin ingin mengosongkan seluruh data transaksi proyek? Proyek, AFCE, PR, PO, GR, USPK, SPK, dan progres fisik akan dihapus permanen. Master data, akun pengguna, dan audit log historis tetap dipertahankan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm" className="h-9 text-xs">
                Batal
              </Button>
            </DialogClose>
            <Button
              type="button"
              size="sm"
              disabled={loadingAction === "clearDemo"}
              onClick={handleClearDemo}
              className="h-9 text-xs bg-amber-800 hover:bg-amber-900 text-white gap-1.5"
            >
              {loadingAction === "clearDemo" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Ya, Kosongkan Transaksi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isResetEmptyOpen} onOpenChange={setIsResetEmptyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
              Konfirmasi Reset Basis Data Produksi
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-2">
              Tindakan ini akan mengosongkan seluruh proyek, AFCE, PR, PO, GR, USPK, SPK, progres fisik, komentar, lampiran, dan log audit sebelumnya. Tindakan ini <strong>tidak dapat dibatalkan</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label htmlFor="reset-confirm-keyword" className="text-[11px] text-muted-foreground block">
              Untuk mengonfirmasi tindakan ini, ketik <strong className="text-foreground">PRODUKSI</strong> di bawah ini:
            </label>
            <Input
              id="reset-confirm-keyword"
              type="text"
              placeholder="Ketik PRODUKSI"
              value={confirmKeyword}
              onChange={(e) => setConfirmKeyword(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm" className="h-9 text-xs">
                Batal
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={confirmKeyword !== "PRODUKSI" || loadingAction === "resetEmpty"}
              onClick={handleResetEmptyProduction}
              className="h-9 text-xs gap-1.5"
            >
              {loadingAction === "resetEmpty" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Reset ke Database Produksi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
