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
import { AFCEDocument } from "@/types";
import { useAppState } from "@/context/app-state-context";
import { formatIDR } from "@/lib/utils";
import { findMatchingApprovalTier } from "@/lib/approval-matrix-utils";
import { toast } from "sonner";
import { FileEdit, Send, Save, AlertCircle } from "lucide-react";

interface AFCEEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  afce: AFCEDocument;
}

export function AFCEEditDialog({
  open,
  onOpenChange,
  afce,
}: AFCEEditDialogProps) {
  const { updateAfceDocument, submitAfceApproval, approvalMatrix } = useAppState();

  const [afceNumber, setAfceNumber] = useState(afce.afceNumber);
  const [value, setValue] = useState(afce.value.toString());
  const [sapDocNumber, setSapDocNumber] = useState(afce.sapDocNumber || "");
  const [sapScreenshotPlaceholder, setSapScreenshotPlaceholder] = useState(
    afce.sapScreenshotPlaceholder || ""
  );
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matchedTier = findMatchingApprovalTier(Number(value) || 0, approvalMatrix);

  useEffect(() => {
    if (open) {
      setAfceNumber(afce.afceNumber);
      setValue(afce.value.toString());
      setSapDocNumber(afce.sapDocNumber || "");
      setSapScreenshotPlaceholder(
        afce.sapScreenshotPlaceholder || ""
      );
      setNote("");
      setError(null);
    }
  }, [open, afce]);

  const handleSave = async (submitForApproval: boolean = false) => {
    if (!afceNumber.trim()) {
      setError("Nomor AFCE wajib diisi.");
      return;
    }

    const numValue = Number(value);
    if (isNaN(numValue) || numValue <= 0) {
      setError("Nilai AFCE harus berupa nominal angka valid lebih besar dari 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateAfceDocument(afce.id, {
        afceNumber: afceNumber.trim(),
        value: numValue,
        sapDocNumber: sapDocNumber.trim() || undefined,
        sapScreenshotPlaceholder: sapScreenshotPlaceholder.trim() || undefined,
      });

      if (!updated) {
        setError("Gagal memperbarui dokumen AFCE.");
        return;
      }

      if (submitForApproval) {
        const submitted = await submitAfceApproval(
          afce.id,
          note.trim() || "Pengajuan persetujuan AFCE oleh tim teknis kebun."
        );
        if (!submitted) {
          setError("Data AFCE tersimpan, tetapi pengajuan otorisasi gagal.");
          return;
        }
        toast.success(
          "Dokumen AFCE berhasil diperbarui dan diajukan ke Level 1 untuk otorisasi!"
        );
      } else {
        toast.success("Data dokumen AFCE berhasil disimpan.");
      }

      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent scrollable className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileEdit className="w-4 h-4 text-emerald-600 shrink-0" />
            Ubah Data Dokumen AFCE
          </DialogTitle>
          <DialogDescription className="text-xs">
            Perbarui nomor otorisasi anggaran, nominal anggaran, atau nomor referensi SAP ERP untuk proyek {afce.projectName}.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3 text-xs">
          {error && (
            <div className="p-2.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground block">
                Nomor Dokumen AFCE <span className="text-rose-500">*</span>
              </label>
              <Input
                value={afceNumber}
                onChange={(e) => {
                  setAfceNumber(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Contoh: AFCE-2026-0125"
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground block">
                Nomor Referensi SAP ERP
              </label>
              <Input
                value={sapDocNumber}
                onChange={(e) => setSapDocNumber(e.target.value)}
                placeholder="Contoh: AFCE-SAP-9901428"
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              Nilai Anggaran Investasi (IDR) <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Contoh: 420000000"
              className="h-9 text-xs font-mono"
            />
            {Number(value) > 0 && (
              <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                <span className="text-muted-foreground font-mono">
                  Terbaca: <b>{formatIDR(Number(value))}</b>
                </span>
                {matchedTier && (
                  <span className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-300">
                    SOP: {matchedTier.tierName} ({(matchedTier.levels.filter(Boolean) as string[]).length} Level)
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              Nama Berkas Bukti / Tangkapan Layar SAP
            </label>
            <Input
              value={sapScreenshotPlaceholder}
              onChange={(e) => setSapScreenshotPlaceholder(e.target.value)}
              placeholder="Opsional: tautan atau nama berkas bukti SAP"
              className="h-9 text-xs font-mono"
            />
          </div>

          {afce.status === "Draft" && (
            <div className="space-y-1">
              <label className="font-semibold text-foreground block">
                Catatan Pengajuan (Opsional)
              </label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Tuliskan justifikasi singkat pengajuan AFCE..."
                rows={2}
                className="text-xs resize-none"
              />
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Batal
          </Button>

          <Button
            size="sm"
            disabled={isSubmitting}
            onClick={() => handleSave(false)}
            className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            <Save className="w-3.5 h-3.5" /> Simpan
          </Button>

          {afce.status === "Draft" && (
            <Button
              size="sm"
              disabled={isSubmitting}
              onClick={() => handleSave(true)}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              <Send className="w-3.5 h-3.5" /> Simpan & Ajukan
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
