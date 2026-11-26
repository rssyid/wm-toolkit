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
import { Project, PRType } from "@/types";
import { toast } from "sonner";
import { FilePlus2, UploadCloud, Loader2 } from "lucide-react";

interface PRRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

export function PRRecordDialog({ open, onOpenChange, project }: PRRecordDialogProps) {
  const { createPr, prs } = useAppState();

  const [prNumber, setPrNumber] = useState("");
  const [sapPrNumber, setSapPrNumber] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [workItemId, setWorkItemId] = useState("");
  const [prType, setPrType] = useState<PRType>("Material");
  const [description, setDescription] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const year = new Date().getFullYear();
      const seq = String(prs.length + 1).padStart(4, "0");
      setPrNumber(`PR-${year}-${seq}`);
      setSapPrNumber(`10045${String(9700 + prs.length)}`);
      setReleaseDate(new Date().toISOString().split("T")[0]);
      setWorkItemId(project.workItems[0]?.id || "");
      setPrType("Material");
      setDescription("");
      setAttachmentName("");
    }
  }, [open, prs.length, project.workItems]);

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
        toast.error(json.error || "Gagal mengunggah lampiran PR ke Google Drive.");
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
    if (!prNumber.trim() || !sapPrNumber.trim()) {
      toast.error("Nomor PR dan Nomor Dokumen SAP wajib diisi");
      return;
    }
    if (!releaseDate) {
      toast.error("Tanggal approval & rilis PR wajib diisi");
      return;
    }
    if (!workItemId) {
      toast.error("Pilih item pekerjaan terkait");
      return;
    }

    const selectedWi = project.workItems.find((w) => w.id === workItemId);
    if (!selectedWi) {
      toast.error("Item pekerjaan terkait tidak ditemukan pada proyek ini");
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await createPr({
        prNumber: prNumber.trim(),
        sapPrNumber: sapPrNumber.trim(),
        projectId: project.id,
        projectCode: project.code,
        workItemId,
        workItemName: selectedWi.name,
        releaseDate,
        prType,
        description: description.trim() || `Pengadaan untuk ${selectedWi.name}`,
        status: "Released",
        linkedPoCount: 0,
        attachmentName: attachmentName.trim() || undefined,
      });

      if (!ok) return;

      toast.success(`Purchase Requisition ${prNumber.trim()} berhasil dicatat!`);
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
            <FilePlus2 className="w-4 h-4 text-blue-600 shrink-0" />
            Catat Rilis Purchase Requisition (PR)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Dokumentasikan nomor PR dan nomor reservasi SAP untuk proyek {project.code}.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground block">
                Nomor PR Internal <span className="text-rose-500">*</span>
              </label>
              <Input
                value={prNumber}
                onChange={(e) => setPrNumber(e.target.value)}
                placeholder="PR-2026-..."
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground block">
                Nomor SAP PR <span className="text-rose-500">*</span>
              </label>
              <Input
                value={sapPrNumber}
                onChange={(e) => setSapPrNumber(e.target.value)}
                placeholder="10045..."
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground block">
                Tanggal Approval & Rilis PR <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground block">Tipe PR</label>
              <SearchableSelect
                value={prType}
                onValueChange={(val) => setPrType(val as PRType)}
                options={[
                  { value: "Material", label: "Material" },
                  { value: "Service", label: "Jasa / Service" },
                ]}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              Item Pekerjaan Terkait <span className="text-rose-500">*</span>
            </label>
            <SearchableSelect
              value={workItemId}
              onValueChange={setWorkItemId}
              placeholder="Pilih work item..."
              searchPlaceholder="Cari item pekerjaan..."
              options={project.workItems.map((wi) => ({
                value: wi.id,
                label: wi.name,
                subLabel: `Bobot: ${wi.weight}% | ${wi.phase}`,
              }))}
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground block">Uraian Kebutuhan PR</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi spesifikasi material atau lingkup sewa alat..."
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              Lampiran Screenshot SAP / Dokumen Pendukung (Opsional)
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                placeholder="Tautan Google Drive atau nama berkas"
                className="h-9 text-xs"
              />
              <label className="h-9 px-3 rounded-md border border-input bg-background hover:bg-muted text-xs font-medium flex items-center justify-center cursor-pointer shrink-0 gap-1.5">
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
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Rilis PR"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
