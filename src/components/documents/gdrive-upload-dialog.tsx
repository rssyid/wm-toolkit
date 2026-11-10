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
  const [fileSize, setFileSize] = useState("2.4 MB");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setFileSize(`${sizeMb} MB`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fileName.trim()) {
      toast.error("Nama berkas atau file wajib dipilih.");
      return;
    }

    setUploading(true);
    setUploadProgress(20);

    try {
      setUploadProgress(45);
      const formData = new FormData();
      if (selectedFile) {
        formData.append("file", selectedFile);
      } else {
        const cleanName = fileName.includes(".") ? fileName : `${fileName}.pdf`;
        const blob = new Blob(["Lampiran dokumen proyek WM-Toolkit: " + fileName], {
          type: "application/pdf",
        });
        formData.append("file", blob, cleanName);
      }
      formData.append("projectId", projectId);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(85);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal mengunggah berkas ke Google Drive API.");
      }

      setUploadProgress(100);
      const uploadedData = json.data;

      const newAttachmentData: Omit<ProjectAttachment, "id" | "uploadedAt"> = {
        projectId,
        source: "UPLOAD",
        fileName: uploadedData.fileName || fileName,
        fileUrl: uploadedData.webViewLink,
        fileSize: uploadedData.fileSize || fileSize || "1.5 MB",
        mimeType: uploadedData.mimeType || "application/pdf",
        category,
        docNumber: docNumber.trim() || undefined,
        googleDriveFileId: uploadedData.fileId,
        uploadedBy: userProfile.fullName,
      };

      if (onSaveAttachment) {
        onSaveAttachment(newAttachmentData);
      } else {
        addAttachment(newAttachmentData);
        toast.success(
          uploadedData.isMock
            ? "Dokumen tersimpan (mode simulasi link)!"
            : `Dokumen berhasil diunggah ke folder Google Drive: ${uploadedData.folderName || project?.name || "Proyek"}!`
        );
      }

      setUploading(false);
      setUploadProgress(0);
      setFileName("");
      setDocNumber("");
      setSelectedFile(null);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Terjadi kesalahan saat mengunggah berkas.");
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !uploading && onOpenChange(val)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base">Unggah Berkas ke Google Drive</DialogTitle>
              <DialogDescription className="text-xs">
                Simpan dokumen ke folder Google Drive:{" "}
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                  [{project?.code || "PROYEK"}] {project?.name || ""}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-1 text-xs">
          {/* File input / Dropzone */}
          <div className="p-4 border-2 border-dashed rounded-lg text-center bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer relative">
            <input
              type="file"
              onChange={handleFileSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <UploadCloud className="w-7 h-7 text-emerald-600 mx-auto mb-1.5" />
            {fileName ? (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <File className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[220px]">{fileName}</span>
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
                  Mendukung format PDF, PNG, JPG, DWG, XLSX hingga 25 MB
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">
              Nama Berkas Dokumen <span className="text-rose-500">*</span>
            </label>
            <Input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Contoh: Berita_Acara_Serah_Terima_BAST.pdf"
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
                Nomor Registrasi / SAP
              </label>
              <Input
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="Contoh: BAST-01/2026"
                className="text-xs font-mono"
              />
            </div>
          </div>

          {uploading && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  Mengunggah ke Google Drive Storage...
                </span>
                <span className="font-mono">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-1.5" />
            </div>
          )}

          <div className="rounded-md border p-3 bg-muted/30 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-muted-foreground leading-relaxed">
              Berkas akan otomatis disimpan ke direktori Google Drive terkelola perkebunan dan terdaftar pada tabel arsip proyek.
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={uploading || !fileName.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
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
