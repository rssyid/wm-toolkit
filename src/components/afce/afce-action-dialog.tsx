"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
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
  const [approverName, setApproverName] = useState(userProfile?.fullName || "Pejabat Otorisasi");
  const [approverRole, setApproverRole] = useState(defaultRole);
  const [sapDocNumber, setSapDocNumber] = useState(afce.sapDocNumber || "");
  const [sapEvidenceUrl, setSapEvidenceUrl] = useState(
    afce.sapScreenshotPlaceholder || "SAP_AFCE_Authorization_Released.png"
  );
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
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

      setSapEvidenceUrl(json.data.fileName);
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

      // Default approver name to the authenticated user's name
      if (userProfile?.fullName) {
        setApproverName(userProfile.fullName);
      } else if (targetRole.includes("Water Management") || targetRole === "WM") {
        setApproverName("Dedi Setiawan, S.T.");
      } else if (targetRole.includes("Estate Manager") || targetRole === "EM") {
        setApproverName("Budi Santoso, S.T.");
      } else if (targetRole.includes("General Estate") || targetRole === "GEM") {
        setApproverName("Ir. Ahmad Dahlan");
      } else if (targetRole.includes("Regional Head") || targetRole === "RH") {
        setApproverName("Dr. Raden Haryo, M.M.");
      } else if (targetRole.includes("Plantation Head") || targetRole === "PH") {
        setApproverName("Ir. Bambang Trihatmojo");
      } else if (targetRole.includes("Mill & Civil") || targetRole.includes("MCA") || targetRole === "MCA") {
        setApproverName("Ir. Hendra Kusuma, M.T.");
      } else if (targetRole.includes("CFO") || targetRole.includes("Chief Financial")) {
        setApproverName("Gunawan Wijaya, S.E., Ak.");
      } else if (targetRole.includes("COO") || targetRole.includes("Chief Operating")) {
        setApproverName("Ir. Faisal Bahri");
      } else if (targetRole.includes("Chairman") || targetRole.includes("Dewan Direksi")) {
        setApproverName("Dewan Direksi PTPN IV");
      } else {
        setApproverName("Pejabat Otorisasi");
      }

      setSapDocNumber(afce.sapDocNumber || `AFCE-SAP-REL-L${levelNum}`);
      setSapEvidenceUrl(afce.sapScreenshotPlaceholder || `SAP_AFCE_L${levelNum}_Evidence.png`);
    }
  }, [open, initialAction, activeLevelItem, afce, levelNum, userProfile?.fullName]);

  const handleSubmit = () => {
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

    processAfceAction(
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Catat Persetujuan Otorisasi SAP
          </DialogTitle>
          <DialogDescription className="text-xs">
            {afce.afceNumber} &bull; Proyek: {afce.projectName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-1 text-xs">
          {error && (
            <div className="p-2.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Level Info Banner */}
          <div className="p-2.5 rounded-lg bg-muted/60 border flex items-center justify-between text-xs">
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

          {/* Action Choice */}
          <div>
            <label className="font-semibold text-foreground block mb-1">
              Tindakan Keputusan Otorisasi <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAction("Approve")}
                className={`py-1.5 px-2 rounded-md font-medium border text-xs text-center transition-colors ${
                  action === "Approve"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold shadow-xs"
                    : "border-input hover:bg-muted"
                }`}
              >
                Setujui (Approve)
              </button>
              <button
                type="button"
                onClick={() => setAction("Revise")}
                className={`py-1.5 px-2 rounded-md font-medium border text-xs text-center transition-colors ${
                  action === "Revise"
                    ? "bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-bold shadow-xs"
                    : "border-input hover:bg-muted"
                }`}
              >
                Minta Revisi
              </button>
              <button
                type="button"
                onClick={() => setAction("Reject")}
                className={`py-1.5 px-2 rounded-md font-medium border text-xs text-center transition-colors ${
                  action === "Reject"
                    ? "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold shadow-xs"
                    : "border-input hover:bg-muted"
                }`}
              >
                Tolak (Reject)
              </button>
            </div>
          </div>

          {/* Approval Date Input */}
          <div>
            <label className="font-semibold text-foreground flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Tanggal Otorisasi / Approval SAP <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-normal">
                (Tercatat di Audit Log)
              </span>
            </label>
            <Input
              type="date"
              value={approvalDate}
              onChange={(e) => {
                setApprovalDate(e.target.value);
                if (error) setError(null);
              }}
              className="h-8 text-xs font-mono"
              required
            />
          </div>

          {/* Reviewer Name and Role */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Nama Pejabat Otorisasi <span className="text-rose-500">*</span>
              </label>
              <Input
                value={approverName}
                onChange={(e) => {
                  setApproverName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Nama lengkap pejabat"
                className="h-8 text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Jabatan / Tingkat Otoritas
              </label>
              <Input
                value={approverRole}
                onChange={(e) => setApproverRole(e.target.value)}
                placeholder="Jabatan resmi"
                className="h-8 text-xs font-medium"
              />
            </div>
          </div>

          {/* SAP Reference & Evidence Box */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Nomor Referensi SAP
              </label>
              <Input
                value={sapDocNumber}
                onChange={(e) => setSapDocNumber(e.target.value)}
                placeholder="Contoh: AFCE-SAP-9901428"
                className="h-8 text-xs font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground flex items-center justify-between mb-1">
                <span>Bukti Otorisasi SAP</span>
                {uploadingEvidence && (
                  <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-normal">
                    <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
                  </span>
                )}
              </label>
              <div className="flex items-center gap-1.5">
                <Input
                  value={sapEvidenceUrl}
                  onChange={(e) => setSapEvidenceUrl(e.target.value)}
                  placeholder="Bukti_Otorisasi_SAP.png"
                  className="h-8 text-xs font-mono flex-1"
                />
                <label className="h-8 px-2 rounded border border-input hover:bg-muted text-[11px] font-medium flex items-center justify-center cursor-pointer shrink-0 text-foreground transition-colors gap-1">
                  <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Pilih Berkas</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Mandatory Note */}
          <div>
            <label className="font-semibold text-foreground block mb-1">
              Catatan / Justifikasi Evaluasi <span className="text-rose-500">*</span>
            </label>
            <Textarea
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Tuliskan catatan teknis hasil verifikasi dokumen SAP atau rekomendasi..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-1.5 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            className={
              action === "Approve"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                : action === "Revise"
                ? "bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs"
                : "bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
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
