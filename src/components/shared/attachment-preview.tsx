"use client";

import React, { useState } from "react";
import {
  FileText,
  Eye,
  Download,
  Image as ImageIcon,
  ExternalLink,
  Cloud,
  CheckCircle2,
  FileSpreadsheet,
  FileCode,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export interface AttachmentPreviewProps {
  filename?: string;
  fileUrl?: string;
  fileId?: string;
  mimeType?: string;
  type?: string;
  title?: string;
  description?: string;
  size?: string;
  category?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  docNumber?: string;
  variant?: "badge" | "button" | "icon";
  className?: string;
}

function extractFileId(urlOrId?: string | null): string | null {
  if (!urlOrId) return null;
  const str = urlOrId.trim();

  if (/^[a-zA-Z0-9_-]{25,50}$/.test(str)) {
    return str;
  }

  const fileDMatch = str.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch?.[1]) return fileDMatch[1];

  const idParamMatch = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch?.[1]) return idParamMatch[1];

  return null;
}

export function AttachmentPreview({
  filename = "Dokumen",
  fileUrl,
  fileId,
  mimeType,
  type,
  title,
  description = "Pratinjau lampiran dokumen proyek WM-Toolkit.",
  size,
  category,
  uploadedBy,
  docNumber,
  variant = "badge",
  className = "",
}: AttachmentPreviewProps) {
  const [open, setOpen] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(true);

  const cleanFileId = fileId || extractFileId(fileUrl) || "";
  const isImage =
    mimeType?.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(filename) ||
    Boolean(fileUrl && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileUrl));
  const isCad = /\.dwg$/i.test(filename);
  const isExcel = /\.(xlsx|xls|csv)$/i.test(filename);

  const safeExternalUrl =
    fileUrl && (fileUrl.startsWith("https://") || fileUrl.startsWith("/api/files/"))
      ? fileUrl
      : undefined;

  const driveViewUrl =
    safeExternalUrl ||
    (cleanFileId ? `https://drive.google.com/file/d/${cleanFileId}/view` : undefined);
  const driveEmbedPreviewUrl = cleanFileId
    ? `https://drive.google.com/file/d/${cleanFileId}/preview`
    : undefined;
  const directApiPreviewUrl = cleanFileId
    ? `/api/files/${encodeURIComponent(cleanFileId)}/preview?name=${encodeURIComponent(filename)}`
    : safeExternalUrl;
  const downloadApiUrl = cleanFileId
    ? `/api/files/${encodeURIComponent(cleanFileId)}/download?name=${encodeURIComponent(filename)}`
    : safeExternalUrl;

  const handleDownload = () => {
    if (!downloadApiUrl) {
      toast.error("Berkas atau tautan unduhan tidak tersedia pada server.");
      return;
    }
    const link = document.createElement("a");
    link.href = downloadApiUrl;
    link.download = filename;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const dialogTitle = title || filename;

  return (
    <>
      {variant === "icon" ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Lihat pratinjau ${filename}`}
          onClick={() => setOpen(true)}
          className={`h-8 w-8 text-muted-foreground hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 ${className}`}
          title={`Lihat pratinjau: ${filename}`}
        >
          <Eye className="w-3.5 h-3.5" />
        </Button>
      ) : variant === "button" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className={`h-8 px-2.5 text-xs gap-1.5 ${className}`}
        >
          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Pratinjau</span>
        </Button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md bg-muted/60 hover:bg-muted text-foreground transition-colors border max-w-full truncate ${className}`}
          title={`Lihat pratinjau: ${filename}`}
        >
          {isImage ? (
            <ImageIcon className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />
          ) : isCad ? (
            <FileCode className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
          ) : isExcel ? (
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          )}
          <span className="truncate max-w-[160px] sm:max-w-[220px]">{filename}</span>
          <Eye className="w-3 h-3 text-muted-foreground ml-0.5 shrink-0" />
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-4 sm:p-6 overflow-hidden">
          <DialogHeader className="border-b pb-3 shrink-0">
            <div className="flex items-start justify-between gap-3 pr-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  {isImage ? (
                    <ImageIcon className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  ) : (
                    <FileText className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-sm sm:text-base font-bold truncate max-w-[320px] sm:max-w-[500px]">
                    {dialogTitle}
                  </DialogTitle>
                  <DialogDescription className="text-xs flex flex-wrap items-center gap-1.5 mt-0.5">
                    <span>{description}</span>
                    {size && (
                      <>
                        <span>&bull;</span>
                        <span className="font-mono">{size}</span>
                      </>
                    )}
                    {category && (
                      <>
                        <span>&bull;</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                          {category}
                        </span>
                      </>
                    )}
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 px-3 bg-muted/40 rounded-md text-[11px] shrink-0 border">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Nomor Dokumen
              </span>
              <span className="font-mono font-medium text-foreground">{docNumber || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Tipe Berkas
              </span>
              <span className="font-medium text-foreground">{mimeType || type || "Dokumen"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Pengunggah
              </span>
              <span className="font-medium text-foreground truncate block">
                {uploadedBy || "-"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Sumber
              </span>
              <span className="font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <Cloud className="w-3 h-3" /> {cleanFileId ? "Google Drive" : "Lampiran"}
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-[280px] max-h-[55vh] overflow-hidden rounded-lg border bg-slate-950 flex flex-col items-center justify-center relative">
            {isImage && directApiPreviewUrl ? (
              <div className="w-full h-full p-2 flex items-center justify-center overflow-auto bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={directApiPreviewUrl}
                  alt={filename}
                  width={800}
                  height={600}
                  className="max-h-[50vh] w-auto h-auto object-contain rounded shadow-md"
                  onLoad={() => setLoadingMedia(false)}
                  onError={() => setLoadingMedia(false)}
                />
              </div>
            ) : driveEmbedPreviewUrl ? (
              <div className="w-full h-full relative">
                {loadingMedia && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-300 gap-2 z-10">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                    <span className="text-xs">Memuat pratinjau Google Drive...</span>
                  </div>
                )}
                <iframe
                  src={driveEmbedPreviewUrl}
                  className="w-full h-full min-h-[360px] border-0 rounded"
                  title={filename}
                  onLoad={() => setLoadingMedia(false)}
                  allow="autoplay"
                />
              </div>
            ) : (
              <div className="p-6 text-center space-y-3 text-slate-200">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-white">{filename}</h4>
                  <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                    {downloadApiUrl
                      ? "Pratinjau langsung tidak tersedia untuk berkas ini. Gunakan tombol Unduh atau buka tautan sumber."
                      : "Hanya nama berkas yang tercatat (belum ada tautan file Google Drive yang tersimpan)."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 pt-3 border-t shrink-0">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 w-full sm:w-auto">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>
                {cleanFileId ? "Terhubung dengan Google Drive" : "Metadata lampiran tercatat"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              {driveViewUrl && (
                <a
                  href={driveViewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-9 px-3 rounded-md text-xs font-medium border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 gap-1.5 transition-colors"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Buka Sumber</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {downloadApiUrl && (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleDownload}
                  className="h-9 text-xs bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh Dokumen
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                className="h-9 text-xs"
              >
                Tutup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
