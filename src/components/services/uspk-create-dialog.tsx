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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useAppState } from "@/context/app-state-context";
import { Project, USPKStatus } from "@/types";
import { toast } from "sonner";
import { FileSpreadsheet, Plus, UploadCloud, Briefcase, Calendar, Loader2 } from "lucide-react";
import { formatIDR } from "@/lib/utils";

interface USPKCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

export function USPKCreateDialog({
  open,
  onOpenChange,
  project,
}: USPKCreateDialogProps) {
  const { createUspk, uspks, suppliers, userProfile } = useAppState();

  const [uspkNumber, setUspkNumber] = useState("");
  const [uspkDate, setUspkDate] = useState("");
  const [vendorId, setVendorId] = useState(suppliers[0]?.id || "");
  const [customVendorName, setCustomVendorName] = useState("");
  const [workItemId, setWorkItemId] = useState(project.workItems[0]?.id || "");
  const [scope, setScope] = useState("");
  const [targetVolume, setTargetVolume] = useState<number | "">(100);
  const [unit, setUnit] = useState<string>("M3");
  const [value, setValue] = useState<number>(50000000);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<USPKStatus>("SUBMITTED");
  const [attachmentName, setAttachmentName] = useState("");
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const today = new Date().toISOString().split("T")[0];
      const plus30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const year = new Date().getFullYear();
      const seq = String(uspks.length + 1).padStart(4, "0");
      setUspkNumber(`USPK-${year}-${seq}`);
      setUspkDate(today);
      setVendorId(suppliers[0]?.id || "");
      setWorkItemId(project.workItems[0]?.id || "");
      setCustomVendorName("");
      setScope("");
      setAttachmentName("");
      setStartDate(today);
      setEndDate(plus30);
      setStatus("SUBMITTED");
    }
  }, [open, uspks.length, suppliers, project.workItems]);

  const selectedSupplier = suppliers.find((s) => s.id === vendorId);
  const effectiveVendorName = customVendorName.trim() || selectedSupplier?.name || "";
  const selectedWorkItem = project.workItems.find((w) => w.id === workItemId);

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
        toast.error(json.error || "Gagal mengunggah dokumen penawaran ke Google Drive.");
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
    if (!uspkNumber.trim()) {
      toast.error("Nomor USPK wajib diisi");
      return;
    }
    if (!uspkDate) {
      toast.error("Tanggal USPK wajib diisi");
      return;
    }
    if (!effectiveVendorName) {
      toast.error("Nama rekanan penyedia jasa wajib dipilih/diisi");
      return;
    }
    if (!scope.trim()) {
      toast.error("Lingkup pekerjaan teknis wajib diisi");
      return;
    }
    if (!targetVolume || Number(targetVolume) <= 0) {
      toast.error("Target volume kerja harus lebih besar dari 0");
      return;
    }
    if (!unit.trim()) {
      toast.error("Satuan ukuran (uoM) pekerjaan wajib diisi");
      return;
    }
    if (!value || Number(value) <= 0) {
      toast.error("Nilai penawaran usulan harus lebih besar dari Rp 0");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Tanggal awal dan akhir pelaksanaan wajib diisi");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("Tanggal target selesai tidak boleh lebih awal dari tanggal mulai");
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await createUspk({
        afceId: project.afceNumber,
        projectId: project.id,
        projectCode: project.code,
        workItemId: selectedWorkItem?.id,
        workItemName: selectedWorkItem?.name,
        uspkNumber: uspkNumber.trim(),
        vendorName: effectiveVendorName,
        vendorId: selectedSupplier ? selectedSupplier.id : undefined,
        scope: scope.trim(),
        targetVolume: Number(targetVolume),
        unit: unit.trim().toUpperCase(),
        value: Number(value),
        startDate,
        endDate,
        status,
        submittedAt: status === "SUBMITTED" ? uspkDate : undefined,
        createdBy: userProfile?.fullName || "",
        attachmentName: attachmentName.trim() || undefined,
      });

      if (!ok) return;

      toast.success(
        `Usulan SPK ${uspkNumber.trim()} untuk rekanan ${effectiveVendorName} berhasil dicatat!`
      );

      setScope("");
      setAttachmentName("");
      setCustomVendorName("");
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Buat Usulan SPK (USPK) Baru
              </DialogTitle>
              <DialogDescription className="text-xs">
                Pencatatan usulan rekanan penyedia jasa, lingkup teknis, dan nilai penawaran untuk proyek {project.code}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-2 text-xs">
          {/* Row 1: Nomor USPK, Tanggal & Status Awal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Nomor USPK <span className="text-red-500">*</span>
              </label>
              <Input
                value={uspkNumber}
                onChange={(e) => setUspkNumber(e.target.value)}
                placeholder="USPK-2026-00..."
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Tanggal USPK <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={uspkDate}
                onChange={(e) => setUspkDate(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Status Pengajuan
              </label>
              <Select
                value={status}
                onValueChange={(val: USPKStatus) => setStatus(val)}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUBMITTED">SUBMITTED (Diajukan)</SelectItem>
                  <SelectItem value="DRAFT">DRAFT (Konsep Awal)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Rekanan Vendor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground">
                Rekanan Kontraktor / Vendor Jasa <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-muted-foreground">
                Pilih dari Master Vendor atau tulis baru
              </span>
            </div>
            <SearchableSelect
              value={vendorId}
              onValueChange={(val) => {
                setVendorId(val);
                setCustomVendorName("");
              }}
              options={suppliers.map((s) => ({
                value: s.id,
                label: `${s.name} (${s.category})`,
              }))}
              placeholder="Cari atau pilih rekanan..."
            />
            <div className="pt-1">
              <Input
                value={customVendorName}
                onChange={(e) => setCustomVendorName(e.target.value)}
                placeholder="Atau ketik nama rekanan jika belum ada di master..."
                className="text-xs placeholder:text-[11px]"
              />
            </div>
          </div>

          {/* Row 3: Work Item Terkait */}
          {project.workItems.length > 0 && (
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Item Pekerjaan Proyek Terkait (WBS)
              </label>
              <Select value={workItemId} onValueChange={setWorkItemId}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Pilih WBS terkait..." />
                </SelectTrigger>
                <SelectContent>
                  {project.workItems.map((wi) => (
                    <SelectItem key={wi.id} value={wi.id} className="text-xs">
                      {wi.name} (Bobot: {wi.weight}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Row 4: Lingkup Pekerjaan Teknis */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">
              Lingkup Pekerjaan Teknis (Scope of Work) <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder="Deskripsikan spesifikasi pekerjaan teknis, volume, lokasi detail, metode pelaksanaan..."
              rows={3}
              className="text-xs leading-relaxed"
            />
          </div>

          {/* Row 4B: Target Kerja & Satuan (uoM) */}
          <div className="p-3 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground text-xs">
                Target Kerja Fisik & Satuan (uoM) <span className="text-red-500">*</span>
              </label>
              {targetVolume && unit ? (
                <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300">
                  Target: {targetVolume} {unit}
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">
                  Volume Target Kontrak
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

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-muted-foreground">Pilihan cepat:</span>
              {["M3", "M", "Ha", "Titik", "Batang", "Unit", "Kg", "Ton", "Jam", "Hari"].map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                    unit.toUpperCase() === u
                      ? "bg-blue-600 text-white border-blue-600 font-bold"
                      : "bg-background text-muted-foreground hover:bg-muted border-border"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              * Target ini akan diwariskan ke SPK dan menjadi dasar pengurangan volume harian (*burn-down*).
            </p>
          </div>

          {/* Row 5: Nilai Penawaran */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground">
                Nilai Penawaran Usulan (Rp) <span className="text-red-500">*</span>
              </label>
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                {formatIDR(Number(value) || 0)}
              </span>
            </div>
            <Input
              type="number"
              value={value || ""}
              onChange={(e) => setValue(Number(e.target.value))}
              placeholder="50000000"
              className="font-mono text-xs"
            />
          </div>

          {/* Row 6: Tanggal Pelaksanaan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Tanggal Mulai Pelaksanaan
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
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Target Selesai
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          {/* Row 7: Lampiran Berkas */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center gap-1">
              <UploadCloud className="w-3.5 h-3.5 text-muted-foreground" /> Berkas Penawaran / Proposal Teknis (Opsional)
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                placeholder="Tautan Google Drive atau nama berkas proposal"
                className="text-xs"
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
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
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
            disabled={isSubmitting || uploadingAttachment}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            {isSubmitting ? "Menyimpan..." : "Simpan USPK"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
