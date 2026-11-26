"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
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
import { FileCheck2, Calendar, UploadCloud, AlertCircle, Loader2 } from "lucide-react";
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

  const activeSpkUspkIds = useMemo(
    () =>
      new Set(
        spkContracts
          .filter((s) => s.projectId === project.id && !s.deletedAt)
          .map((s) => s.uspkId)
      ),
    [spkContracts, project.id]
  );

  const recommendedUspkIds = useMemo(
    () =>
      new Set(
        technicalEvaluations
          .filter((e) => e.projectId === project.id && e.result === "RECOMMENDED")
          .map((e) => e.uspkId)
      ),
    [technicalEvaluations, project.id]
  );

  const projectUspks = useMemo(
    () => uspks.filter((u) => u.projectId === project.id && !u.deletedAt),
    [uspks, project.id]
  );

  const eligibleUspks = useMemo(
    () =>
      projectUspks.filter(
        (u) =>
          !activeSpkUspkIds.has(u.id) &&
          (recommendedUspkIds.has(u.id) || u.status === "APPROVED")
      ),
    [projectUspks, activeSpkUspkIds, recommendedUspkIds]
  );

  const [selectedUspkId, setSelectedUspkId] = useState<string>(
    preselectedUspk?.id || eligibleUspks[0]?.id || ""
  );
  const [spkNumber, setSpkNumber] = useState("");
  const [value, setValue] = useState<number>(0);
  const [targetVolume, setTargetVolume] = useState<number | "">(0);
  const [unit, setUnit] = useState<string>("M3");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [status, setStatus] = useState<SPKStatus>("ACTIVE");
  const [notes, setNotes] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeUspk =
    eligibleUspks.find((u) => u.id === selectedUspkId) ||
    (preselectedUspk &&
    !activeSpkUspkIds.has(preselectedUspk.id) &&
    (recommendedUspkIds.has(preselectedUspk.id) || preselectedUspk.status === "APPROVED")
      ? preselectedUspk
      : undefined);

  useEffect(() => {
    if (open) {
      const year = new Date().getFullYear();
      const seq = String(spkContracts.length + 1).padStart(4, "0");
      setSpkNumber(`SPK-${year}-${seq}`);

      const preselectedEligible =
        preselectedUspk &&
        !activeSpkUspkIds.has(preselectedUspk.id) &&
        (recommendedUspkIds.has(preselectedUspk.id) || preselectedUspk.status === "APPROVED")
          ? preselectedUspk
          : undefined;
      const initialUspk = preselectedEligible || eligibleUspks[0];

      if (initialUspk) {
        setSelectedUspkId(initialUspk.id);
        setValue(initialUspk.value);
        setTargetVolume(initialUspk.targetVolume || 0);
        setUnit(initialUspk.unit || "M3");
        setStartDate(initialUspk.startDate);
        setEndDate(initialUspk.endDate);
      } else {
        setSelectedUspkId("");
        setValue(0);
        setTargetVolume(0);
        setStartDate(new Date().toISOString().split("T")[0]);
        setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
      }

      setReleaseDate(new Date().toISOString().split("T")[0]);
      setStatus("ACTIVE");
      setNotes("");
      setAttachmentName("");
    }
  }, [open, preselectedUspk, spkContracts.length, eligibleUspks, activeSpkUspkIds, recommendedUspkIds]);

  const handleUspkChange = (uspkId: string) => {
    setSelectedUspkId(uspkId);
    const targetUspk = eligibleUspks.find((u) => u.id === uspkId);
    if (targetUspk) {
      setValue(targetUspk.value);
      setTargetVolume(targetUspk.targetVolume || 0);
      setUnit(targetUspk.unit || "M3");
      setStartDate(targetUspk.startDate);
      setEndDate(targetUspk.endDate);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAttachment(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", project.id);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Gagal mengunggah dokumen SPK ke Google Drive.");
        return;
      }

      setAttachmentName(
        json.data.webViewLink ||
          (json.data.fileId ? `/api/files/${json.data.fileId}/download` : json.data.fileName)
      );
      toast.success(`Berkas "${json.data.fileName}" berhasil diunggah ke Google Drive.`);
    } catch {
      toast.error("Gagal terhubung ke server saat mengunggah berkas.");
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleSubmit = async () => {
    if (!activeUspk) {
      toast.error("Pilih USPK yang sudah lolos evaluasi teknis (RECOMMENDED) dan belum memiliki SPK");
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
    if (!startDate || !endDate || !releaseDate) {
      toast.error("Tanggal mulai, selesai, dan tanggal penerbitan kontrak wajib diisi");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("Tanggal akhir kontrak tidak boleh lebih awal dari tanggal mulai");
      return;
    }
    if (activeSpkUspkIds.has(activeUspk.id)) {
      toast.error(`USPK ${activeUspk.uspkNumber} sudah memiliki kontrak SPK aktif (aturan 1:1).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await createSpkContract({
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
        attachmentName: attachmentName.trim() || undefined,
        createdBy: userProfile?.fullName || "",
      });

      if (!ok) return;

      toast.success(
        `Surat Perintah Kerja ${spkNumber.trim()} untuk rekanan ${activeUspk.vendorName} berhasil diterbitkan!`
      );

      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent scrollable className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 shrink-0">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Terbitkan Surat Perintah Kerja (SPK) Resmi
              </DialogTitle>
              <DialogDescription className="text-xs">
                Penerbitan kontrak ikatan kerja definitif rekanan 1:1 berdasarkan USPK yang lolos evaluasi teknis.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-3 text-xs">
          {eligibleUspks.length === 0 && (
            <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Tidak Ada USPK Tersedia untuk Penerbitan SPK</p>
                <p className="text-[11px] mt-0.5">
                  Penerbitan SPK membutuhkan USPK dengan evaluasi teknis berstatus <strong>RECOMMENDED</strong> yang belum memiliki SPK aktif.
                </p>
              </div>
            </div>
          )}

          {/* Row 1: Pilih USPK Rujukan */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              Dasar Usulan SPK (USPK) <span className="text-red-600">*</span>
            </label>
            <Select value={selectedUspkId} onValueChange={handleUspkChange} disabled={eligibleUspks.length === 0}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Pilih USPK lolos evaluasi..." />
              </SelectTrigger>
              <SelectContent>
                {eligibleUspks.map((u) => (
                  <SelectItem key={u.id} value={u.id} className="text-xs">
                    {u.uspkNumber} - {u.vendorName} ({formatIDR(u.value)}) [Lolos Evaluasi]
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeUspk && (
              <div className="px-2.5 py-1.5 rounded bg-muted/50 border text-[11px] flex flex-wrap items-center justify-between gap-2">
                <span>
                  Kontraktor: <strong className="text-foreground">{activeUspk.vendorName}</strong>
                </span>
                <span className="text-muted-foreground truncate max-w-sm">{activeUspk.scope}</span>
              </div>
            )}
          </div>

          {/* Row 2: Nomor SPK & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground block">
                Nomor SPK Resmi <span className="text-red-500">*</span>
              </label>
              <Input
                value={spkNumber}
                onChange={(e) => setSpkNumber(e.target.value)}
                placeholder="SPK-2026-0..."
                className="h-9 font-mono text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground block">
                Status Kontrak SPK
              </label>
              <Select
                value={status}
                onValueChange={(val: SPKStatus) => setStatus(val)}
              >
                <SelectTrigger className="h-9 text-xs font-semibold">
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

          {/* Row 3: Nilai Kontrak & Target Kerja (3 Kolom Ringkas) */}
          <div className="p-2.5 rounded-lg border bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 space-y-1.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground block">
                  Nilai Kontrak (Rp) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={value || ""}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="h-8 font-mono text-xs bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground block">
                  Volume Target <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="0.1"
                  step="any"
                  value={targetVolume}
                  onChange={(e) => setTargetVolume(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Misal: 500"
                  className="h-8 font-mono text-xs bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground block">
                  Satuan (uoM) <span className="text-red-500">*</span>
                </label>
                <Input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="M3, M, Ha, Titik..."
                  className="h-8 text-xs font-mono uppercase bg-background"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="text-muted-foreground">
                Target diwariskan dari USPK dan dipotong otomatis saat input progress harian.
              </span>
              <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">
                {formatIDR(Number(value) || 0)}
              </span>
            </div>
          </div>

          {/* Row 4: 3 Tanggal Kontrak dalam 1 Baris */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Mulai Kontrak
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Akhir Kontrak
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Tanggal Terbit
              </label>
              <Input
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          {/* Row 5: Ketentuan Khusus & Lampiran */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              Ketentuan Khusus & Pembayaran (Opsional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ketentuan termin, jaminan pelaksanaan, sanksi keterlambatan, retensi..."
              rows={2}
              className="text-xs leading-relaxed resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground flex items-center gap-1">
              <UploadCloud className="w-3.5 h-3.5 text-muted-foreground" /> Lampiran Dokumen SPK Ditandatangani (Opsional)
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                placeholder="Tautan Google Drive atau nama berkas kontrak SPK"
                className="h-9 text-xs"
              />
              <label className="h-9 px-3 rounded-md border border-input bg-background hover:bg-muted text-xs font-medium flex items-center justify-center cursor-pointer shrink-0 gap-1">
                {uploadingAttachment ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                )}
                <span>Unggah</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  disabled={uploadingAttachment}
                />
              </label>
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || uploadingAttachment || eligibleUspks.length === 0}
            className="bg-indigo-700 hover:bg-indigo-800 text-white gap-1"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            {isSubmitting ? "Menyimpan..." : "Terbitkan SPK"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
