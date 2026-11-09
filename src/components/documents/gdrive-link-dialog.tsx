"use client";

import React, { useState } from "react";
import { Link2, ExternalLink, FileText, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppState } from "@/context/app-state-context";
import { ProjectAttachment } from "@/types";
import { toast } from "sonner";

interface GDriveLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSaveAttachment?: (attachment: Omit<ProjectAttachment, "id" | "uploadedAt">) => void;
}

const CATEGORY_OPTIONS = [
  "Survey Lapangan & Kontur",
  "Spesifikasi Teknis Material",
  "Gambar As-Built / DED",
  "Dokumen PR SAP",
  "Dokumen PO & Kontrak",
  "SPK Kontraktor Rekanan",
  "Berita Acara (BAST)",
  "Laporan Uji Laboratorium",
  "Dokumentasi Foto Lapangan",
  "Lainnya",
];

export function GDriveLinkDialog({
  open,
  onOpenChange,
  projectId,
  onSaveAttachment,
}: GDriveLinkDialogProps) {
  const { userProfile, addAttachment } = useAppState();

  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [category, setCategory] = useState("Survey Lapangan & Kontur");
  const [docNumber, setDocNumber] = useState("");
  const [fileSize, setFileSize] = useState("2.5 MB");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fileUrl.trim()) {
      toast.error("Tautan Google Drive wajib diisi.");
      return;
    }

    if (!fileName.trim()) {
      toast.error("Nama berkas dokumen wajib diisi.");
      return;
    }

    // Auto append extension if missing
    let cleanName = fileName.trim();
    if (!cleanName.includes(".")) {
      cleanName += ".pdf";
    }

    const newAttachmentData: Omit<ProjectAttachment, "id" | "uploadedAt"> = {
      projectId,
      source: "GOOGLE_DRIVE_LINK",
      fileName: cleanName,
      fileUrl: fileUrl.trim(),
      fileSize: fileSize.trim() || "1.8 MB",
      mimeType: cleanName.endsWith(".dwg")
        ? "application/acad"
        : cleanName.endsWith(".png") || cleanName.endsWith(".jpg")
        ? "image/jpeg"
        : "application/pdf",
      category,
      docNumber: docNumber.trim() || undefined,
      uploadedBy: userProfile.fullName,
    };

    if (onSaveAttachment) {
      onSaveAttachment(newAttachmentData);
    } else {
      addAttachment(newAttachmentData);
      toast.success("Tautan berkas Google Drive berhasil disimpan!");
    }

    // Reset & close
    setFileUrl("");
    setFileName("");
    setDocNumber("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base">Tautkan Berkas Google Drive</DialogTitle>
              <DialogDescription className="text-xs">
                Hubungkan dokumen proyek dari Google Drive atau tautan berkas cloud.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-1 text-xs">
          <div>
            <label className="font-semibold text-foreground block mb-1">
              URL Tautan Google Drive <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Input
                value={fileUrl}
                onChange={(e) => {
                  setFileUrl(e.target.value);
                  // Auto extract or suggest filename if possible
                  if (!fileName && e.target.value.includes("/")) {
                    const parts = e.target.value.split("/");
                    const last = parts[parts.length - 1];
                    if (last && last.length < 40 && last.includes(".")) {
                      setFileName(decodeURIComponent(last));
                    }
                  }
                }}
                placeholder="https://drive.google.com/file/d/..."
                className="pr-8 text-xs font-mono"
                required
              />
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Pastikan hak akses berkas disetel ke &quot;Siapa saja yang memiliki tautan dapat melihat&quot;.
            </p>
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">
              Nama Berkas Dokumen <span className="text-rose-500">*</span>
            </label>
            <Input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Contoh: Kajian_Elevasi_Pintu_Air_2026.pdf"
              className="text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Kategori Dokumen
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Perkiraan Ukuran File
              </label>
              <Input
                value={fileSize}
                onChange={(e) => setFileSize(e.target.value)}
                placeholder="Contoh: 3.2 MB"
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">
              Nomor Registrasi / SAP (Opsional)
            </label>
            <Input
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder="Contoh: DOC-SURV-2026/089"
              className="text-xs font-mono"
            />
          </div>

          <div className="rounded-md border p-3 bg-muted/30 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-muted-foreground leading-relaxed">
              Berkas ini akan langsung terdaftar di tab <span className="font-semibold text-foreground">Documents</span> dan dapat diakses oleh seluruh anggota tim proyek.
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Tautkan Berkas
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
