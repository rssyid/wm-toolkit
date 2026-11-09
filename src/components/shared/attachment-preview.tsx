"use client";

import React, { useState } from "react";
import { FileText, Eye, Download, Image as ImageIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface AttachmentPreviewProps {
  filename?: string;
  type?: string;
  title?: string;
  description?: string;
  size?: string;
}

export function AttachmentPreview({
  filename = "Dokumen-SAP-Ref.pdf",
  type = "PDF Document",
  title = "Pratinjau Dokumen SAP / Lapangan",
  description = "Tampilan dokumen referensi yang terhubung dengan sistem ERP / SAP perkebunan.",
  size = "1.4 MB",
}: AttachmentPreviewProps) {
  const [open, setOpen] = useState(false);
  const isImage = filename.endsWith(".jpg") || filename.endsWith(".png");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md bg-muted/60 hover:bg-muted text-foreground transition-colors border max-w-full truncate"
        title="Klik untuk melihat pratinjau"
      >
        {isImage ? (
          <ImageIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        ) : (
          <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        )}
        <span className="truncate">{filename}</span>
        <Eye className="w-3 h-3 text-muted-foreground ml-1 shrink-0" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {isImage ? <ImageIcon className="w-5 h-5 text-blue-500" /> : <FileText className="w-5 h-5 text-rose-500" />}
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {description} &bull; <span className="font-medium text-foreground">{filename}</span> ({size})
            </DialogDescription>
          </DialogHeader>

          {/* Realistic Document / SAP Mockup Window */}
          <div className="rounded-lg border bg-slate-950 text-slate-100 p-4 font-mono text-xs overflow-hidden shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                SAP S/4HANA Enterprise - Technical Asset Monitoring
              </span>
              <span>Doc No: {filename.replace(/[^0-9]/g, "").slice(0, 10) || "450009821"}</span>
            </div>

            {isImage ? (
              <div className="h-64 rounded bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-6 text-center">
                <ImageIcon className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
                <p className="text-xs text-slate-300 font-sans font-medium">Dokumentasi Visual Lapangan / Pintu Air</p>
                <p className="text-[11px] text-slate-500 font-sans mt-1">Geo-tagging: Sumatera Utara Estate &bull; Verifikasi Lapangan OK</p>
              </div>
            ) : (
              <div className="h-64 rounded bg-slate-900 border border-slate-800 p-4 overflow-y-auto space-y-2 text-[11px] text-slate-300">
                <div className="text-emerald-400 font-semibold">[TRANSACTION RELEASED] SAP ERP MM/PS MODULE</div>
                <div>Company Code : PTPN Estate Holding</div>
                <div>Purchasing Org: P001 - Kantor Direksi</div>
                <div>Cost Center   : CC-EST-CIVIL-04</div>
                <div>Posting Date  : 2026-10-23</div>
                <div className="border-t border-slate-800 my-2 pt-2 text-slate-400">
                  Document verified digitally. All approval matrix roles signed electronically with HMAC-SHA256 signature token.
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast.success(`Mengunduh file: ${filename}`);
                setOpen(false);
              }}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Unduh Dokumen
            </Button>
            <Button size="sm" onClick={() => setOpen(false)}>
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
