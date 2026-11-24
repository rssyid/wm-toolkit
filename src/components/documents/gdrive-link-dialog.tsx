"use client";

import React, { useState } from "react";
import { Link2, ExternalLink } from "lucide-react";
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

function extractDriveFileIdFromUrl(url: string): string | undefined {
  const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch?.[1]) return fileDMatch[1];
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch?.[1]) return idMatch[1];
  return undefined;
}

function isValidHttpsUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

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
  const [fileSize, setFileSize] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = fileUrl.trim();
    const trimmedName = fileName.trim();

    if (!trimmedUrl || !isValidHttpsUrl(trimmedUrl)) {
      toast.error("Tautan Google Drive wajib menggunakan protokol https:// yang valid.");
      return;
    }

    if (!trimmedName) {
      toast.error("Nama berkas dokumen wajib diisi.");
      return;
    }

    const cleanName = trimmedName.includes(".") ? trimmedName : `${trimmedName}.pdf`;
    const extractedDriveId = extractDriveFileIdFromUrl(trimmedUrl);

    const newAttachmentData: Omit<ProjectAttachment, "id" | "uploadedAt"> = {
      projectId,
      source: "GOOGLE_DRIVE_LINK",
      fileName: cleanName,
      fileUrl: trimmedUrl,
      fileSize: fileSize.trim() || "",
      mimeType: cleanName.toLowerCase().endsWith(".dwg")
        ? "application/acad"
        : cleanName.toLowerCase().endsWith(".png") ||
          cleanName.toLowerCase().endsWith(".jpg") ||
          cleanName.toLowerCase().endsWith(".jpeg")
        ? "image/jpeg"
        : "application/pdf",
      category,
      docNumber: docNumber.trim() || undefined,
      googleDriveFileId: extractedDriveId,
      uploadedBy: userProfile.fullName,
    };

    if (onSaveAttachment) {
      onSaveAttachment(newAttachmentData);
      setFileUrl("");
      setFileName("");
      setDocNumber("");
      setFileSize("");
      onOpenChange(false);
      return;
    }

    setIsSaving(true);
    try {
      const saved = await addAttachment(newAttachmentData);
      if (saved) {
        toast.success("Tautan berkas Google Drive berhasil disimpan.");
        setFileUrl("");
        setFileName("");
        setDocNumber("");
        setFileSize("");
        onOpenChange(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-700 dark:text-blue-300">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base">Tautkan URL Google Drive</DialogTitle>
              <DialogDescription className="text-xs">
                Masukkan tautan berbagi (shared link HTTPS) dokumen atau gambar dari Google Drive.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-1 text-xs">
          <div>
            <label htmlFor="gdrive-link-url" className="font-semibold text-foreground block mb-1">
              Tautan Google Drive (HTTPS) <span className="text-rose-600">*</span>
            </label>
            <Input
              id="gdrive-link-url"
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className="text-xs font-mono"
              required
            />
          </div>

          <div>
            <label htmlFor="gdrive-link-name" className="font-semibold text-foreground block mb-1">
              Nama Tampilan Dokumen <span className="text-rose-600">*</span>
            </label>
            <Input
              id="gdrive-link-name"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Contoh: Peta_Kontur_Blok_A12.pdf"
              className="text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="gdrive-link-cat" className="font-semibold text-foreground block mb-1">
                Kategori Dokumen
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="gdrive-link-cat" className="text-xs h-9">
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
              <label htmlFor="gdrive-link-docnum" className="font-semibold text-foreground block mb-1">
                Nomor Dokumen / SAP
              </label>
              <Input
                id="gdrive-link-docnum"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="Opsional"
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label htmlFor="gdrive-link-size" className="font-semibold text-foreground block mb-1">
              Keterangan Ukuran File (Opsional)
            </label>
            <Input
              id="gdrive-link-size"
              value={fileSize}
              onChange={(e) => setFileSize(e.target.value)}
              placeholder="Contoh: 2.5 MB"
              className="text-xs"
            />
          </div>

          <div className="rounded-md bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-2.5 flex items-start gap-2 text-[11px] text-blue-900 dark:text-blue-200">
            <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Pastikan hak akses tautan Google Drive diatur minimal ke{" "}
              <strong>Anyone with the link (Viewer)</strong> agar dapat dibuka tim terkait.
            </span>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className="h-9 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              {isSaving ? "Menyimpan..." : "Simpan Tautan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
