"use client";

import React, { useState } from "react";
import { UploadCloud, CheckCircle2, File, Loader2 } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { useAppState } from "@/context/app-state-context";
import { ProjectAttachment } from "@/types";
import { toast } from "sonner";

interface GDriveUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSaveAttachment?: (attachment: Omit<ProjectAttachment, "id" | "uploadedAt">) => void;
}

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

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

export function GDriveUploadDialog({
  open,
  onOpenChange,
  projectId,
  onSaveAttachment,
}: GDriveUploadDialogProps) {
  const { userProfile, addAttachment, projects } = useAppState();
  const project = projects.find((p) => p.id === projectId);

  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState("Berita Acara (BAST)");
  const [docNumber, setDocNumber] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("Ukuran berkas melebihi batas maksimal 15 MB.");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
    const sizeKb = file.size / 1024;
    setFileSize(
      sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(2)} MB` : `${Math.max(1, Math.round(sizeKb))} KB`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Pilih berkas nyata dari perangkat Anda terlebih dahulu.");
      return;
    }

    if (!fileName.trim()) {
      toast.error("Nama berkas dokumen wajib diisi.");
      return;
    }

    setUploading(true);
    setUploadProgress(25);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("projectId", projectId);

      setUploadProgress(55);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(85);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal mengunggah berkas ke Google Drive.");
      }

      setUploadProgress(100);
      const uploadedData = json.data;

      const newAttachmentData: Omit<ProjectAttachment, "id" | "uploadedAt"> = {
        projectId,
        source: "UPLOAD",
        fileName: fileName.trim() || uploadedData.fileName,
        fileUrl: uploadedData.webViewLink,
        fileSize: uploadedData.fileSize || fileSize,
        mimeType: uploadedData.mimeType || selectedFile.type || "application/octet-stream",
        category,
        docNumber: docNumber.trim() || undefined,
        googleDriveFileId: uploadedData.fileId,
        uploadedBy: userProfile.fullName,
      };

      if (onSaveAttachment) {
        onSaveAttachment(newAttachmentData);
      } else {
        const saved = await addAttachment(newAttachmentData);
        if (!saved) {
          throw new Error("Berkas terunggah, namun gagal mencatat metadata lampiran.");
        }
        toast.success(
          `Dokumen berhasil diunggah ke folder Google Drive: ${
            uploadedData.folderName || project?.name || "Proyek"
          }.`
        );
      }

      setUploading(false);
      setUploadProgress(0);
      setFileName("");
      setDocNumber("");
      setFileSize("");
      setSelectedFile(null);
      onOpenChange(false);
    } catch (err: unknown) {
      console.error("Upload error:", err);
      toast.error(
        err instanceof Error ? err.message : "Terjadi kesalahan saat mengunggah berkas."
      );
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !uploading && onOpenChange(val)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base">Unggah Berkas ke Google Drive</DialogTitle>
              <DialogDescription className="text-xs">
                Direktori tujuan:{" "}
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                  [{project?.code || "PROYEK"}] {project?.name || ""}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-1 text-xs">
          <div className="p-4 border-2 border-dashed rounded-lg text-center bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer relative">
            <input
              type="file"
              aria-label="Pilih berkas untuk diunggah"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.csv,.docx,.doc,.dwg"
              onChange={handleFileSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <UploadCloud className="w-7 h-7 text-emerald-700 dark:text-emerald-400 mx-auto mb-1.5" />
            {selectedFile ? (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <File className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[220px]">{selectedFile.name}</span>
                  <span className="text-[11px] text-muted-foreground">({fileSize})</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Klik untuk mengganti berkas</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">
                  Pilih berkas dari perangkat Anda
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Mendukung PDF, PNG, JPG, WebP, XLSX, CSV, DOCX, DWG maksimal 15 MB
                </p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="gdrive-upload-name" className="font-semibold text-foreground block mb-1">
              Nama Tampilan Berkas <span className="text-rose-600">*</span>
            </label>
            <Input
              id="gdrive-upload-name"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Contoh: Berita_Acara_Serah_Terima_BAST.pdf"
              className="text-xs h-9"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="gdrive-upload-cat" className="font-semibold text-foreground block mb-1">
                Kategori Dokumen
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="gdrive-upload-cat" className="text-xs h-9">
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
              <label htmlFor="gdrive-upload-doc" className="font-semibold text-foreground block mb-1">
                Nomor Registrasi / SAP
              </label>
              <Input
                id="gdrive-upload-doc"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="Contoh: BAST-01/2026"
                className="text-xs font-mono h-9"
              />
            </div>
          </div>

          {uploading && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                  Mengunggah ke Google Drive...
                </span>
                <span className="font-mono">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-1.5" />
            </div>
          )}

          <div className="rounded-md border p-3 bg-muted/30 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-muted-foreground leading-relaxed">
              Unggahan memerlukan konfigurasi kredensial Google Drive server yang aktif. Maksimal ukuran berkas adalah 15 MB.
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={uploading || !selectedFile || !fileName.trim()}
              className="h-9 text-xs bg-emerald-700 hover:bg-emerald-800 text-white gap-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengunggah...
                </>
              ) : (
                "Unggah Sekarang"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
