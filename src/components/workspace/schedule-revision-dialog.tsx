"use client";

import React, { useState, useEffect } from "react";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useAppState } from "@/context/app-state-context";
import { Project } from "@/types";
import { toast } from "sonner";
import { CalendarClock, UploadCloud, AlertTriangle, Calendar, ShieldCheck, Loader2 } from "lucide-react";
import { formatIDDate, calculateDaysBetween } from "@/lib/utils";

interface ScheduleRevisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

export function ScheduleRevisionDialog({
  open,
  onOpenChange,
  project,
}: ScheduleRevisionDialogProps) {
  const { reviseProjectSchedule, users, userProfile } = useAppState();

  const [newEndDate, setNewEndDate] = useState(
    new Date(new Date(project.targetEndDate).getTime() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]
  );
  const [approvalDate, setApprovalDate] = useState(new Date().toISOString().split("T")[0]);
  const [approvedBy, setApprovedBy] = useState(userProfile?.fullName || "");
  const [revisedBy, setRevisedBy] = useState(userProfile?.fullName || "");
  const [reason, setReason] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setNewEndDate(
        new Date(new Date(project.targetEndDate).getTime() + 14 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      );
      setApprovalDate(new Date().toISOString().split("T")[0]);
      setRevisedBy(userProfile?.fullName || "");
      const defaultApprover =
        users.find((u) => u.status === "Active" && u.role !== "VIEWER")?.name ||
        userProfile?.fullName ||
        "";
      setApprovedBy(defaultApprover);
      setReason("");
      setAttachmentName("");
    }
  }, [open, project.targetEndDate, users, userProfile?.fullName]);

  const daysExtended = calculateDaysBetween(project.targetEndDate, newEndDate);
  const weeksExtended = Math.max(1, Math.ceil(daysExtended / 7));

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
        toast.error(json.error || "Gagal mengunggah Berita Acara ke Google Drive.");
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
    if (!newEndDate) {
      toast.error("Pilih tanggal target penyelesaian baru");
      return;
    }
    if (new Date(newEndDate) <= new Date(project.targetEndDate)) {
      toast.error("Target baru harus lebih lama dari target saat ini");
      return;
    }
    if (!approvalDate) {
      toast.error("Tanggal approval/pengesahan addendum wajib diisi");
      return;
    }
    if (!approvedBy.trim()) {
      toast.error("Nama pejabat penyetuju addendum wajib diisi");
      return;
    }
    if (!reason.trim()) {
      toast.error("Alasan perpanjangan jadwal wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await reviseProjectSchedule(project.id, {
        revisionNumber: project.revisions.length + 1,
        previousEndDate: project.targetEndDate,
        newEndDate,
        extendedWeeks: weeksExtended,
        reason: reason.trim(),
        revisedAt: new Date().toISOString().split("T")[0],
        approvalDate,
        approvedBy: approvedBy.trim(),
        revisedBy: revisedBy.trim() || userProfile?.fullName || "",
        approvalStatus: "Approved",
        attachmentName: attachmentName.trim() || undefined,
      });

      if (!ok) return;

      toast.success(
        `Jadwal proyek berhasil direvisi (+${weeksExtended} minggu) dan disahkan pada ${formatIDDate(approvalDate)}.`
      );
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent scrollable className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="w-4 h-4 text-amber-500 shrink-0" />
            Pengajuan Revisi Jadwal Proyek (Addendum Waktu)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Perubahan tanggal target penyelesaian tidak menghapus jadwal baseline awal proyek.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3 text-xs">
          {/* Baseline Info Strip */}
          <div className="px-3 py-2 rounded-md bg-muted/40 border flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span>
              Baseline: <strong className="font-mono text-foreground">{formatIDDate(project.baselineStartDate)} s/d {formatIDDate(project.baselineEndDate)}</strong>
            </span>
            <span>
              Target Saat Ini: <strong className="font-mono text-foreground">{formatIDDate(project.targetEndDate)}</strong> ({project.revisions.length}x revisi)
            </span>
          </div>

          {/* 3 Kolom: Target Baru, Tanggal Approval & Pejabat */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground block">
                Target Selesai Baru <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                className="h-9 font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                Tgl Approval <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={approvalDate}
                onChange={(e) => setApprovalDate(e.target.value)}
                className="h-9 font-mono text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                Pejabat Penyetuju <span className="text-rose-600">*</span>
              </label>
              <SearchableSelect
                value={approvedBy}
                onValueChange={setApprovedBy}
                placeholder="Pilih Pejabat..."
                searchPlaceholder="Cari nama pejabat..."
                options={users
                  .filter((u) => u.status === "Active")
                  .map((u) => ({
                    value: u.name,
                    label: `${u.name} (${u.role})`,
                  }))}
              />
            </div>
          </div>

          <div className="px-3 py-2 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
            <span className="flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Perpanjangan Waktu:
            </span>
            <span className="font-mono font-bold">
              +{daysExtended} Hari (+{weeksExtended} Minggu)
            </span>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              Alasan Justifikasi Keterlambatan / Kendala Lapangan <span className="text-rose-500">*</span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Jelaskan alasan teknis (misal: cuaca ekstrem, kendala suplai material, atau kerusakan alat berat)..."
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              Lampiran Berita Acara (BA) / Bukti Pendukung (Opsional)
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                placeholder="Tautan Google Drive atau nama berkas Berita Acara"
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
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || uploadingAttachment}
            className="bg-amber-700 hover:bg-amber-800 text-white"
          >
            {isSubmitting ? "Menyimpan..." : "Konfirmasi Simpan Revisi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
