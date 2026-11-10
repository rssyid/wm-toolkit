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
  Maximize2,
  FileSpreadsheet,
  FileCode,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

/**
 * Ekstrak Google Drive ID dari string URL atau ID murni
 */
function extractFileId(urlOrId?: string | null): string | null {
  if (!urlOrId) return null;
  const str = urlOrId.trim();

  if (/^[a-zA-Z0-9_-]{25,50}$/.test(str)) {
    return str;
  }

  const fileDMatch = str.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1];

  const idParamMatch = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) return idParamMatch[1];

  return null;
}

export function AttachmentPreview({
  filename = "Dokumen-SAP-Ref.pdf",
  fileUrl,
  fileId,
  mimeType,
  type = "PDF Document",
  title,
  description = "Pratinjau dokumen proyek yang terhubung dengan penyimpanan cloud WM-Toolkit.",
  size = "1.4 MB",
  category,
  uploadedBy,
  uploadedAt,
  docNumber,
  variant = "badge",
  className = "",
}: AttachmentPreviewProps) {
  const [open, setOpen] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const cleanFileId = fileId || extractFileId(fileUrl) || "";
  const isImage =
    mimeType?.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(filename) ||
    (fileUrl && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileUrl));
  const isPdf =
    mimeType === "application/pdf" ||
    /\.pdf$/i.test(filename) ||
    (fileUrl && /\.pdf$/i.test(fileUrl));
  const isCad = /\.dwg$/i.test(filename);
  const isExcel = /\.(xlsx|xls|csv)$/i.test(filename);

  const driveViewUrl =
    fileUrl ||
    (cleanFileId ? `https://drive.google.com/file/d/${cleanFileId}/view` : undefined);
  const driveEmbedPreviewUrl = cleanFileId
    ? `https://drive.google.com/file/d/${cleanFileId}/preview`
    : undefined;
  const directApiPreviewUrl = `/api/files/${encodeURIComponent(cleanFileId || filename)}/preview?name=${encodeURIComponent(filename)}`;
  const downloadApiUrl = cleanFileId
    ? `/api/files/${encodeURIComponent(cleanFileId)}/download?name=${encodeURIComponent(filename)}`
    : `/api/files/${encodeURIComponent(filename)}/download?name=${encodeURIComponent(filename)}`;

  const handleDownload = () => {
    if (!downloadApiUrl) {
      toast.error("Tautan berkas tidak tersedia untuk diunduh.");
      return;
    }

    setDownloading(true);
    toast.info(`Memulai pengunduhan berkas: ${filename}`);

    try {
      const link = document.createElement("a");
      link.href = downloadApiUrl;
      link.download = filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        setDownloading(false);
        toast.success(`Berkas "${filename}" berhasil diunduh ke komputer.`);
      }, 1500);
    } catch (err: any) {
      setDownloading(false);
      toast.error("Gagal memulai pengunduhan: " + (err?.message || "Kesalahan peramban"));
    }
  };

  const dialogTitle = title || filename;

  return (
    <>
      {variant === "icon" ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          className={`h-7 w-7 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 ${className}`}
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
          className={`h-7 px-2.5 text-xs gap-1.5 ${className}`}
          title={`Lihat pratinjau: ${filename}`}
        >
          <Eye className="w-3 h-3 text-muted-foreground" />
          <span>Pratinjau</span>
        </Button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md bg-muted/60 hover:bg-muted text-foreground transition-colors border max-w-full truncate ${className}`}
          title={`Klik untuk melihat pratinjau: ${filename}`}
        >
          {isImage ? (
            <ImageIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          ) : isCad ? (
            <FileCode className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          ) : isExcel ? (
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
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
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                  ) : (
                    <FileText className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-sm sm:text-base font-bold flex items-center gap-2 truncate max-w-[340px] sm:max-w-[500px]">
                    <span className="truncate" title={dialogTitle}>{dialogTitle}</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs flex items-center gap-2 mt-0.5">
                    <span>{filename}</span>
                    <span>&bull;</span>
                    <span className="font-mono">{size}</span>
                    {category && (
                      <>
                        <span>&bull;</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">{category}</span>
                      </>
                    )}
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Metadata Sub-Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 px-3 bg-muted/40 rounded-md text-[11px] shrink-0 border">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Nomor Dokumen</span>
              <span className="font-mono font-medium text-foreground">{docNumber || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Tipe Berkas</span>
              <span className="font-medium text-foreground">{mimeType || type || "Dokumen"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Pengunggah</span>
              <span className="font-medium text-foreground truncate block">{uploadedBy || "Sistem"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Penyimpanan</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Cloud className="w-3 h-3" /> Google Drive Cloud
              </span>
            </div>
          </div>

          {/* Main Preview Container */}
          <div className="flex-1 min-h-[300px] max-h-[55vh] overflow-hidden rounded-lg border bg-slate-950 flex flex-col items-center justify-center relative">
            {isImage ? (
              <div className="w-full h-full p-2 flex items-center justify-center overflow-auto bg-slate-900">
                {directApiPreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={directApiPreviewUrl}
                    alt={filename}
                    className="max-h-[50vh] max-w-full object-contain rounded shadow-md"
                    onLoad={() => setLoadingMedia(false)}
                    onError={() => setLoadingMedia(false)}
                  />
                ) : (
                  <div className="text-center p-6 space-y-2 text-slate-300">
                    <ImageIcon className="w-12 h-12 text-slate-500 mx-auto animate-pulse" />
                    <p className="text-xs font-semibold">{filename}</p>
                    <p className="text-[11px] text-slate-400">Pratinjau gambar siap diunduh</p>
                  </div>
                )}
              </div>
            ) : driveEmbedPreviewUrl ? (
              <div className="w-full h-full relative">
                {loadingMedia && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 gap-2 z-10">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                    <span className="text-xs">Memuat pratinjau dokumen Google Drive...</span>
                  </div>
                )}
                <iframe
                  src={driveEmbedPreviewUrl}
                  className="w-full h-full min-h-[380px] border-0 rounded"
                  title={filename}
                  onLoad={() => setLoadingMedia(false)}
                  allow="autoplay"
                />
              </div>
            ) : (
              // Fallback jika tidak ada Google Drive File ID murni
              <div className="p-6 text-center space-y-3 text-slate-200">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-white">{filename}</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Dokumen ini terdaftar dalam repositori cloud WM-Toolkit. Klik tombol &quot;Unduh Dokumen&quot; di bawah untuk membuka dan mengunduh berkas lengkap.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 pt-3 border-t shrink-0">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 w-full sm:w-auto">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tersinkronisasi dengan Google Drive API Holding</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {driveViewUrl && (
                <a
                  href={driveViewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-8 px-2.5 rounded-md text-xs font-medium border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 gap-1.5 transition-colors"
                  title="Buka langsung di Google Drive web"
                >
                  <Cloud className="w-3.5 h-3.5 text-blue-600" />
                  <span>Google Drive</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              )}

              <Button
                variant="default"
                size="sm"
                onClick={handleDownload}
                disabled={downloading}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengunduh...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" /> Unduh Dokumen
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                className="h-8 text-xs"
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
