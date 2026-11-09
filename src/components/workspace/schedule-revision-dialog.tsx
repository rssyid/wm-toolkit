"use client";

import React, { useState } from "react";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useAppState } from "@/context/app-state-context";
import { Project } from "@/types";
import { toast } from "sonner";
import { CalendarClock, UploadCloud, AlertTriangle, Calendar, ShieldCheck } from "lucide-react";
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
  const { reviseProjectSchedule } = useAppState();

  const [newEndDate, setNewEndDate] = useState(
    new Date(new Date(project.targetEndDate).getTime() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]
  );
  const [approvalDate, setApprovalDate] = useState(new Date().toISOString().split("T")[0]);
  const [approvedBy, setApprovedBy] = useState("Ir. Ahmad Dahlan (Manager Area)");
  const [revisedBy, setRevisedBy] = useState("Dedi Setiawan, S.T. (Manager Estate)");
  const [reason, setReason] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

  const daysExtended = calculateDaysBetween(project.targetEndDate, newEndDate);
  const weeksExtended = Math.max(1, Math.ceil(daysExtended / 7));

  const handleSubmit = () => {
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
    if (!reason.trim()) {
      toast.error("Alasan perpanjangan jadwal wajib diisi");
      return;
    }

    reviseProjectSchedule(project.id, {
      revisionNumber: project.revisions.length + 1,
      previousEndDate: project.targetEndDate,
      newEndDate,
      extendedWeeks: weeksExtended,
      reason: reason.trim(),
      revisedAt: new Date().toISOString().split("T")[0],
      approvalDate,
      approvedBy,
      revisedBy,
      approvalStatus: "Approved",
      attachmentName:
        attachmentName || `BA_Revisi_Jadwal_${project.code}_Rev${project.revisions.length + 1}.pdf`,
    });

    toast.success(
      `Jadwal proyek berhasil direvisi (+${weeksExtended} minggu) dan disahkan pada ${formatIDDate(approvalDate)}.`
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="w-5 h-5 text-amber-500" />
            Pengajuan Revisi Jadwal Proyek (Addendum Waktu)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Perubahan tanggal target penyelesaian tidak menghapus jadwal baseline awal proyek.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1 text-xs">
          {/* Baseline Info */}
          <div className="p-3 rounded-lg bg-muted/40 border space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Jadwal Baseline Awal:</span>
              <span className="font-mono font-medium">
                {formatIDDate(project.baselineStartDate)} s/d {formatIDDate(project.baselineEndDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Target Selesai Saat Ini:</span>
              <span className="font-mono font-semibold text-foreground">
                {formatIDDate(project.targetEndDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Jumlah Revisi Sebelumnya:</span>
              <span className="font-mono">{project.revisions.length} Kali</span>
            </div>
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">
              Target Tanggal Selesai Baru <span className="text-rose-500">*</span>
            </label>
            <Input
              type="date"
              value={newEndDate}
              onChange={(e) => setNewEndDate(e.target.value)}
            />
          </div>

          {/* Addendum Approval Date & Approver */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-foreground block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                Tanggal Approval Addendum <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={approvalDate}
                onChange={(e) => setApprovalDate(e.target.value)}
                className="font-mono text-xs"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                Pejabat Penyetuju Addendum
              </label>
              <SearchableSelect
                value={approvedBy}
                onValueChange={setApprovedBy}
                placeholder="Pilih Pejabat..."
                searchPlaceholder="Cari nama pejabat..."
                options={[
                  { value: "Ir. Ahmad Dahlan (Manager Area)", label: "Ir. Ahmad Dahlan (Manager Area)" },
                  { value: "Dedi Setiawan, S.T. (Manager Estate)", label: "Dedi Setiawan, S.T. (Manager Estate)" },
                  { value: "Dr. Raden Haryo, M.M. (Head Office)", label: "Dr. Raden Haryo, M.M. (Head Office)" },
                ]}
              />
            </div>
          </div>

          <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
            <span className="flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Perpanjangan Waktu:
            </span>
            <span className="font-mono font-bold">
              +{daysExtended} Hari (+{weeksExtended} Minggu)
            </span>
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">
              Alasan Justifikasi Keterlambatan / Kendala Lapangan <span className="text-rose-500">*</span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Jelaskan alasan teknis (misal: cuaca ekstrem, kendala suplai material, atau kerusakan alat berat)..."
              rows={3}
            />
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">
              Lampiran Berita Acara (BA) / Bukti Pendukung
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                placeholder="BA_Perpanjangan_Waktu.pdf"
                className="text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 text-xs"
                onClick={() => {
                  setAttachmentName(`BA_Adendum_${project.code}_${newEndDate}.pdf`);
                  toast.info("Berita Acara perpanjangan terlampir");
                }}
              >
                <UploadCloud className="w-3.5 h-3.5 mr-1" /> Mock BA
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button size="sm" onClick={handleSubmit} className="bg-amber-600 hover:bg-amber-700 text-white">
            Konfirmasi Simpan Revisi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
