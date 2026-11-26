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
import { useAppState } from "@/context/app-state-context";
import { AFCEApprovalLevelItem, AFCEDocument } from "@/types";
import { formatIDDate } from "@/lib/utils";
import { toast } from "sonner";
import { ShieldCheck, Calendar, AlertTriangle, FileText, CheckCircle2, UploadCloud, Loader2 } from "lucide-react";

interface AFCEActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  afce: AFCEDocument;
  targetLevelItem?: AFCEApprovalLevelItem;
  initialAction?: "Approve" | "Revise" | "Reject";
}

export function AFCEActionDialog({
  open,
  onOpenChange,
  afce,
  targetLevelItem,
  initialAction = "Approve",
}: AFCEActionDialogProps) {
  const { processAfceAction, userProfile } = useAppState();

  // Find active level
  const activeLevelItem =
    targetLevelItem ||
    (afce.approvalMatrixLevels &&
      afce.approvalMatrixLevels.find((l) => l.status === "Pending")) ||
    (afce.approvalMatrixLevels && afce.approvalMatrixLevels[afce.currentLevel - 1]);

  const levelNum = activeLevelItem ? activeLevelItem.level : afce.currentLevel;
  const defaultRole = activeLevelItem ? activeLevelItem.label : afce.currentApproverRole;

  const [action, setAction] = useState<"Approve" | "Revise" | "Reject">(initialAction);
  const [approvalDate, setApprovalDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [approverName, setApproverName] = useState(userProfile?.fullName || "");
  const [approverRole, setApproverRole] = useState(defaultRole);
  const [sapDocNumber, setSapDocNumber] = useState(afce.sapDocNumber || "");
  const [sapEvidenceUrl, setSapEvidenceUrl] = useState(
    afce.sapScreenshotPlaceholder || ""
  );
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingEvidence(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", afce.projectId);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal mengunggah berkas");
      }

      setSapEvidenceUrl(
        json.data.webViewLink ||
          (json.data.fileId ? `/api/files/${json.data.fileId}/download` : json.data.fileName)
      );
      toast.success(`Berkas "${json.data.fileName}" berhasil diunggah langsung ke Google Drive!`);
    } catch (err: any) {
      toast.error(err.message || "Gagal mengunggah berkas ke Google Drive");
    } finally {
      setUploadingEvidence(false);
    }
  };

  useEffect(() => {
    if (open) {
      setAction(initialAction);
      setApprovalDate(new Date().toISOString().split("T")[0]);
      setNote("");
      setError(null);

      const targetRole = activeLevelItem ? activeLevelItem.label : afce.currentApproverRole;
      setApproverRole(targetRole);

      // Default nama & jabatan pejabat dari profil pengguna yang masuk
      setApproverName(userProfile?.fullName || "");
      setApproverRole(targetRole);

      setSapDocNumber(afce.sapDocNumber || "");
      setSapEvidenceUrl(afce.sapScreenshotPlaceholder || "");
    }
  }, [open, initialAction, activeLevelItem, afce, userProfile?.fullName]);

  const handleSubmit = async () => {
    if (!approvalDate) {
      setError("Tanggal approval/otorisasi SAP wajib diisi.");
      return;
    }
    if (!approverName.trim()) {
      setError("Nama pejabat penyetuju wajib diisi.");
      return;
    }
    if (!note.trim()) {
      setError("Catatan / justifikasi evaluasi teknis wajib diisi.");
      return;
    }

    const targetLevelIndex = activeLevelItem ? activeLevelItem.level - 1 : afce.currentLevel - 1;
    setIsSubmitting(true);
    try {
      const ok = await processAfceAction(
        afce.id,
        action,
        note.trim(),
        approverName.trim(),
        approverRole,
        approvalDate,
        sapDocNumber.trim() || undefined,
        sapEvidenceUrl.trim() || undefined,
        targetLevelIndex
      );

      if (!ok) {
        setError("Gagal mencatat otorisasi AFCE. Periksa hak akses atau kelengkapan data.");
        return;
      }

      const actionText =
        action === "Approve"
          ? "disetujui (Approved)"
          : action === "Revise"
          ? "diminta revisi (Needs Revision)"
          : "ditolak (Rejected)";

      toast.success(
        `Otorisasi Level ${levelNum} (${approverRole}) berhasil ${actionText} pada tanggal ${formatIDDate(
          approvalDate
        )}`
      );

      setNote("");
      setError(null);
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
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            Catat Persetujuan Otorisasi SAP
          </DialogTitle>
          <DialogDescription className="text-xs">
            {afce.afceNumber} | Proyek: {afce.projectName}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3 text-xs">
          {error && (
            <div className="p-2.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Level Info & Action Choice */}
          <div className="px-3 py-2 rounded-md bg-muted/50 border flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Tingkat Otorisasi
              </span>
              <span className="font-semibold text-foreground">
                Level {levelNum}: {defaultRole}
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-muted-foreground bg-background px-2 py-0.5 rounded border">
              WBS SAP
            </span>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              Tindakan Keputusan Otorisasi <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAction("Approve")}
                className={`py-2 px-2 rounded-md font-medium border text-xs text-center transition-colors cursor-pointer ${
                  action === "Approve"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold shadow-sm"
                    : "border-input hover:bg-muted"
                }`}
              >
                Setujui (Approve)
              </button>
              <button
                type="button"
                onClick={() => setAction("Revise")}
                className={`py-2 px-2 rounded-md font-medium border text-xs text-center transition-colors cursor-pointer ${
                  action === "Revise"
                    ? "bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-bold shadow-sm"
                    : "border-input hover:bg-muted"
                }`}
              >
                Minta Revisi
              </button>
              <button
                type="button"
                onClick={() => setAction("Reject")}
                className={`py-2 px-2 rounded-md font-medium border text-xs text-center transition-colors cursor-pointer ${
                  action === "Reject"
                    ? "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold shadow-sm"
                    : "border-input hover:bg-muted"
                }`}
              >
                Tolak (Reject)
              </button>
            </div>
          </div>

          {/* Tanggal & Nomor Referensi SAP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Tanggal Approval SAP <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={approvalDate}
                onChange={(e) => {
                  setApprovalDate(e.target.value);
                  if (error) setError(null);
                }}
                className="h-9 text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground block">
                Nomor Referensi SAP
              </label>
              <Input
                value={sapDocNumber}
                onChange={(e) => setSapDocNumber(e.target.value)}
                placeholder="Contoh: AFCE-SAP-9901428"
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          {/* Nama Pejabat & Jabatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground block">
                Nama Pejabat Otorisasi <span className="text-rose-500">*</span>
              </label>
              <Input
                value={approverName}
                onChange={(e) => {
                  setApproverName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Nama lengkap pejabat"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground block">
                Jabatan / Tingkat Otoritas
              </label>
              <Input
                value={approverRole}
                onChange={(e) => setApproverRole(e.target.value)}
                placeholder="Jabatan resmi"
                className="h-9 text-xs font-medium"
              />
            </div>
          </div>

          {/* Bukti Otorisasi SAP */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground flex items-center justify-between">
              <span>Bukti Otorisasi SAP (Opsional)</span>
              {uploadingEvidence && (
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-normal">
                  <Loader2 className="w-3 h-3 animate-spin" /> Mengunggah...
                </span>
              )}
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={sapEvidenceUrl}
                onChange={(e) => setSapEvidenceUrl(e.target.value)}
                placeholder="Tautan Drive atau nama berkas bukti SAP"
                className="h-9 text-xs font-mono flex-1"
              />
              <label className="h-9 px-3 rounded-md border border-input bg-background hover:bg-muted text-xs font-medium flex items-center justify-center cursor-pointer shrink-0 text-foreground transition-colors gap-1">
                <UploadCloud className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>Unggah</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  disabled={uploadingEvidence}
                />
              </label>
            </div>
          </div>

          {/* Mandatory Note */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              Catatan / Justifikasi Evaluasi <span className="text-rose-500">*</span>
            </label>
            <Textarea
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Tuliskan catatan teknis hasil verifikasi dokumen SAP atau rekomendasi..."
              rows={2}
              className="text-xs resize-none"
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={uploadingEvidence || isSubmitting}
            className={
              action === "Approve"
                ? "bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm"
                : action === "Revise"
                ? "bg-amber-700 hover:bg-amber-800 text-white font-semibold shadow-sm"
                : "bg-rose-700 hover:bg-rose-800 text-white font-semibold shadow-sm"
            }
          >
            {action === "Approve" ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Konfirmasi Otorisasi (Approve)
              </>
            ) : action === "Revise" ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Minta Revisi Dokumen
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Konfirmasi Penolakan (Reject)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
