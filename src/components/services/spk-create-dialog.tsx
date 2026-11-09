"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppState } from "@/context/app-state-context";
import { Project, USPKItem, SPKStatus } from "@/types";
import { toast } from "sonner";
import { FileCheck2, Calendar, UploadCloud, AlertCircle } from "lucide-react";
import { formatIDR } from "@/lib/utils";

interface SPKCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  preselectedUspk?: USPKItem | null;
}

export function SPKCreateDialog({
  open,
  onOpenChange,
  project,
  preselectedUspk,
}: SPKCreateDialogProps) {
  const { createSpkContract, spkContracts, uspks, technicalEvaluations, userProfile } =
    useAppState();

  // Find all USPKs for this project that have a RECOMMENDED technical evaluation
  const projectUspks = uspks.filter((u) => u.projectId === project.id);
  const recommendedUspkIds = new Set(
    technicalEvaluations
      .filter((e) => e.projectId === project.id && e.result === "RECOMMENDED")
      .map((e) => e.uspkId)
  );

  const eligibleUspks = projectUspks.filter(
    (u) => recommendedUspkIds.has(u.id) || u.status === "APPROVED"
  );

  const [selectedUspkId, setSelectedUspkId] = useState<string>(
    preselectedUspk?.id || eligibleUspks[0]?.id || ""
  );
  const [spkNumber, setSpkNumber] = useState(
    `SPK-2026-0${40 + spkContracts.length}`
  );
  const [value, setValue] = useState<number>(0);
  const [targetVolume, setTargetVolume] = useState<number | "">(0);
  const [unit, setUnit] = useState<string>("M3");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [releaseDate, setReleaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [status, setStatus] = useState<SPKStatus>("ACTIVE");
  const [notes, setNotes] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

  const activeUspk =
    projectUspks.find((u) => u.id === selectedUspkId) || preselectedUspk;

  useEffect(() => {
    if (open) {
      setSpkNumber(`SPK-2026-0${40 + spkContracts.length}`);
      const initialUspk = preselectedUspk || eligibleUspks[0] || projectUspks[0];
      if (initialUspk) {
        setSelectedUspkId(initialUspk.id);
        setValue(initialUspk.value);
        setTargetVolume(initialUspk.targetVolume || 0);
        setUnit(initialUspk.unit || "M3");
        setStartDate(initialUspk.startDate);
        setEndDate(initialUspk.endDate);
      }
      setReleaseDate(new Date().toISOString().split("T")[0]);
      setStatus("ACTIVE");
      setNotes(
        "Kontrak borongan jasa konstruksi sipil berpedoman pada spesifikasi teknis dan RAB yang telah dievaluasi."
      );
      setAttachmentName("");
    }
  }, [open, preselectedUspk, spkContracts.length, eligibleUspks.length]);

  const handleUspkChange = (uspkId: string) => {
    setSelectedUspkId(uspkId);
    const targetUspk = projectUspks.find((u) => u.id === uspkId);
    if (targetUspk) {
      setValue(targetUspk.value);
      setTargetVolume(targetUspk.targetVolume || 0);
      setUnit(targetUspk.unit || "M3");
      setStartDate(targetUspk.startDate);
      setEndDate(targetUspk.endDate);
    }
  };

  const handleSubmit = () => {
    if (!activeUspk) {
      toast.error("Pilih usulan SPK (USPK) yang menjadi dasar kontrak");
      return;
    }
    if (!spkNumber.trim()) {
      toast.error("Nomor SPK resmi wajib diisi");
      return;
    }
    if (!value || Number(value) <= 0) {
      toast.error("Nilai kontrak SPK harus lebih besar dari Rp 0");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Masa berlaku kontrak (tanggal mulai dan selesai) wajib diisi");
      return;
    }

    // Check if USPK already has an SPK
    const existingSpk = spkContracts.find((s) => s.uspkId === activeUspk.id);
    if (existingSpk) {
      toast.error(
        `USPK ${activeUspk.uspkNumber} sudah memiliki kontrak SPK aktif (${existingSpk.spkNumber}). Satu USPK berlaku untuk satu kontrak SPK.`
      );
      return;
    }

    const defaultFilename = `SPK_Kontrak_${spkNumber.replace(/[^a-zA-Z0-9]/g, "_")}_Signed.pdf`;

    createSpkContract({
      uspkId: activeUspk.id,
      uspkNumber: activeUspk.uspkNumber,
      projectId: project.id,
      projectCode: project.code,
      workItemId: activeUspk.workItemId,
      workItemName: activeUspk.workItemName,
      spkNumber: spkNumber.trim(),
      vendorName: activeUspk.vendorName,
      vendorId: activeUspk.vendorId,
      value: Number(value),
      targetVolume: Number(targetVolume) || 0,
      unit: unit.trim().toUpperCase(),
      startDate,
      endDate,
      status,
      releasedAt: releaseDate,
      notes: notes.trim(),
      attachmentName: attachmentName.trim() || defaultFilename,
      createdBy: userProfile.fullName || "Manager Estate",
    });

    toast.success(
      `Surat Perintah Kerja ${spkNumber} untuk rekanan ${activeUspk.vendorName} berhasil diterbitkan!`
    );

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Terbitkan Surat Perintah Kerja (SPK) Resmi
              </DialogTitle>
              <DialogDescription className="text-xs">
                Penerbitan kontrak ikatan kerja definitif rekanan 1:1 berdasarkan usulan USPK yang telah lolos evaluasi teknis.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {eligibleUspks.length === 0 && !preselectedUspk && (
          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Belum Ada USPK yang Direkomendasikan</p>
              <p className="text-[11px] mt-0.5">
                Penerbitan SPK membutuhkan USPK dengan evaluasi teknis berstatus <strong>RECOMMENDED</strong>. Catat evaluasi teknis pada USPK terlebih dahulu.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-4 py-2 text-xs">
          {/* Row 1: Pilih USPK Rujukan */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">
              Dasar Usulan SPK (USPK) <span className="text-red-500">*</span>
            </label>
            <Select value={selectedUspkId} onValueChange={handleUspkChange}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Pilih USPK rujukan..." />
              </SelectTrigger>
              <SelectContent>
                {projectUspks.map((u) => {
                  const isRec = recommendedUspkIds.has(u.id) || u.status === "APPROVED";
                  return (
                    <SelectItem key={u.id} value={u.id} className="text-xs">
                      {u.uspkNumber} — {u.vendorName} ({formatIDR(u.value)}) {isRec ? "✓ Lolos Evaluasi" : "— Belum Direkomendasikan"}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Active USPK Information Highlight */}
          {activeUspk && (
            <div className="p-2.5 rounded-md bg-muted/60 border text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kontraktor:</span>
                <span className="font-semibold text-foreground">{activeUspk.vendorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lingkup:</span>
                <span className="font-medium text-foreground max-w-sm truncate">{activeUspk.scope}</span>
              </div>
            </div>
          )}

          {/* Row 2: Nomor SPK & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Nomor SPK Resmi <span className="text-red-500">*</span>
              </label>
              <Input
                value={spkNumber}
                onChange={(e) => setSpkNumber(e.target.value)}
                placeholder="SPK-2026-0..."
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Status Kontrak SPK
              </label>
              <Select
                value={status}
                onValueChange={(val: SPKStatus) => setStatus(val)}
              >
                <SelectTrigger className="text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE" className="text-emerald-700 font-semibold">
                    ACTIVE (Kontrak Berjalan)
                  </SelectItem>
                  <SelectItem value="DRAFT">DRAFT (Konsep Kontrak)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Nilai Kontrak Definitif */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground">
                Nilai Kontrak Definitif (Rp) <span className="text-red-500">*</span>
              </label>
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {formatIDR(Number(value) || 0)}
              </span>
            </div>
            <Input
              type="number"
              value={value || ""}
              onChange={(e) => setValue(Number(e.target.value))}
              className="font-mono text-xs"
            />
          </div>

          {/* Row 3B: Target Kerja Definitif Kontrak */}
          <div className="p-3 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground text-xs">
                Target Kerja Definitif Kontrak SPK <span className="text-red-500">*</span>
              </label>
              {targetVolume && unit ? (
                <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  Target Kontrak: {targetVolume} {unit}
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">
                  Volume Kontrak Definitif
                </span>
                <Input
                  type="number"
                  min="0.1"
                  step="any"
                  value={targetVolume}
                  onChange={(e) => setTargetVolume(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Misal: 500"
                  className="font-mono text-xs bg-background"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">
                  Satuan Ukuran (uoM)
                </span>
                <Input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="M3, M, Ha, Titik..."
                  className="text-xs font-mono uppercase bg-background"
                />
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground">
              * Diwariskan otomatis dari USPK rujukan. Target ini akan dipotong secara *real-time* saat mandor/pengawas menginput laporan progress harian.
            </p>
          </div>

          {/* Row 4: Masa Berlaku Kontrak */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Tanggal Mulai Kontrak
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Tanggal Akhir Masa Kontrak
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          {/* Row 5: Tanggal Terbit Kontrak */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Tanggal Penerbitan Kontrak Resmi
            </label>
            <Input
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              className="text-xs font-mono"
            />
          </div>

          {/* Row 6: Catatan Ketentuan Kontrak */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">
              Ketentuan Khusus & Pembayaran
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ketentuan termin, jaminan pelaksanaan, sanksi keterlambatan, retensi..."
              rows={3}
              className="text-xs leading-relaxed"
            />
          </div>

          {/* Row 7: Lampiran Berkas Kontrak */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center gap-1">
              <UploadCloud className="w-3.5 h-3.5 text-muted-foreground" /> Lampiran Dokumen SPK Ditandatangani
            </label>
            <Input
              value={attachmentName}
              onChange={(e) => setAttachmentName(e.target.value)}
              placeholder="SPK_Kontrak_Signed.pdf (opsional)"
              className="text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
          >
            <FileCheck2 className="w-3.5 h-3.5" /> Terbitkan SPK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
