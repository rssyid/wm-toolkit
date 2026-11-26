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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppState } from "@/context/app-state-context";
import { Project, USPKItem, TechnicalEvaluationResult } from "@/types";
import { toast } from "sonner";
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  UploadCloud,
  FileText,
  Check,
  X,
  UserCheck,
  Calendar,
  Loader2,
} from "lucide-react";
import { formatIDR, formatIDDate } from "@/lib/utils";

interface TechnicalEvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  uspk: USPKItem | null;
}

export function TechnicalEvaluationDialog({
  open,
  onOpenChange,
  project,
  uspk,
}: TechnicalEvaluationDialogProps) {
  const { recordTechnicalEvaluation, userProfile } = useAppState();

  const [evaluationDate, setEvaluationDate] = useState("");
  const [result, setResult] = useState<TechnicalEvaluationResult>("RECOMMENDED");
  const [rekomendasi, setRekomendasi] = useState("Disetujui untuk Penerbitan Kontrak SPK");
  const [score, setScore] = useState<number>(90);
  const [evaluatorName, setEvaluatorName] = useState(userProfile?.fullName || "");
  const [evaluatorJabatan, setEvaluatorJabatan] = useState(userProfile?.role || "");
  const [notes, setNotes] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setEvaluationDate(new Date().toISOString().split("T")[0]);
      setEvaluatorName(userProfile?.fullName || "");
      setEvaluatorJabatan(userProfile?.role || "");
      setResult("RECOMMENDED");
      setRekomendasi("Disetujui untuk Penerbitan Kontrak SPK");
      setScore(90);
      setNotes("");
      setAttachmentName("");
    }
  }, [open, userProfile?.fullName, userProfile?.role]);

  if (!uspk) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAttachment(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", project.id);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Gagal mengunggah berita acara ke Google Drive.");
        return;
      }

      setAttachmentName(
        json.data.webViewLink ||
          (json.data.fileId ? `/api/files/${json.data.fileId}/download` : json.data.fileName)
      );
      toast.success(`Berkas "${json.data.fileName}" berhasil diunggah ke Google Drive.`);
    } catch {
      toast.error("Gagal terhubung ke server saat mengunggah berkas.");
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleSubmit = async () => {
    if (!evaluationDate) {
      toast.error("Tanggal evaluasi teknis wajib diisi");
      return;
    }
    const parsedScore = Number(score);
    if (Number.isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) {
      toast.error("Skor evaluasi teknis harus bernilai 0 sampai 100");
      return;
    }
    if (!evaluatorName.trim()) {
      toast.error("Nama penilai / evaluator teknis wajib diisi");
      return;
    }
    if (!rekomendasi.trim()) {
      toast.error("Rekomendasi formal wajib diisi");
      return;
    }
    if (!notes.trim()) {
      toast.error("Catatan evaluasi teknis wajib diisi sebagai dasar rekomendasi");
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await recordTechnicalEvaluation({
        uspkId: uspk.id,
        uspkNumber: uspk.uspkNumber,
        projectId: project.id,
        evaluatorName: evaluatorName.trim(),
        evaluatorJabatan: evaluatorJabatan.trim(),
        evaluationDate,
        result,
        rekomendasi: rekomendasi.trim(),
        score: parsedScore,
        notes: notes.trim(),
        attachmentName: attachmentName.trim() || undefined,
      });

      if (!ok) return;

      toast.success(
        `Evaluasi teknis untuk ${uspk.uspkNumber} (${uspk.vendorName}) berhasil dicatat: ${
          result === "RECOMMENDED" ? "DIREKOMENDASIKAN (Status USPK: Approved)" : "TIDAK DIREKOMENDASIKAN"
        }`
      );

      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent scrollable className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Catat Evaluasi Teknis Rekanan Jasa
              </DialogTitle>
              <DialogDescription className="text-xs">
                Penilaian kelaikan metodologi teknis, peralatan, dan kapasitas kontraktor untuk {uspk.uspkNumber}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-3 text-xs">
          {/* USPK Summary Strip */}
          <div className="px-3 py-2 bg-muted/50 rounded-md border space-y-1 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold text-foreground">{uspk.uspkNumber}</span>
                <span className="font-semibold text-foreground">{uspk.vendorName}</span>
                <span className="text-[11px] text-muted-foreground">
                  ({formatIDDate(uspk.startDate)} s/d {formatIDDate(uspk.endDate)})
                </span>
              </div>
              <div className="flex items-center gap-2">
                {uspk.targetVolume && (
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    {uspk.targetVolume} {uspk.unit || "Unit"}
                  </span>
                )}
                <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                  {formatIDR(uspk.value)}
                </span>
              </div>
            </div>
            <p className="text-muted-foreground truncate text-[11px] italic">
              &quot;{uspk.scope}&quot;
            </p>
          </div>

          {/* Row 1: Hasil, Skor & Tanggal (3 Kolom) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6 space-y-1">
              <label className="font-semibold text-foreground block">
                Hasil Evaluasi Kelaikan <span className="text-red-500">*</span>
              </label>
              <Select
                value={result}
                onValueChange={(val: TechnicalEvaluationResult) => setResult(val)}
              >
                <SelectTrigger className="h-9 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECOMMENDED" className="text-emerald-700 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>DIREKOMENDASIKAN (Memenuhi Syarat)</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="NOT_RECOMMENDED" className="text-rose-700 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <X className="w-3.5 h-3.5" />
                      <span>TIDAK DIREKOMENDASIKAN (Gugur Teknis)</span>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-3 space-y-1">
              <label className="font-semibold text-foreground block">
                Skor (0-100)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="h-9 font-mono text-xs"
              />
            </div>

            <div className="sm:col-span-3 space-y-1">
              <label className="font-semibold text-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Tgl Evaluasi <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={evaluationDate}
                onChange={(e) => setEvaluationDate(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          {/* Row 2: Evaluator & Jabatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-muted-foreground" /> Nama Evaluator Teknis <span className="text-red-500">*</span>
              </label>
              <Input
                value={evaluatorName}
                onChange={(e) => setEvaluatorName(e.target.value)}
                placeholder="Nama evaluator..."
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground block">
                Jabatan Evaluator
              </label>
              <Input
                value={evaluatorJabatan}
                onChange={(e) => setEvaluatorJabatan(e.target.value)}
                placeholder="Manager Estate / Area / Water Management"
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Row 3: Rekomendasi Formal */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              Rekomendasi Formal <span className="text-red-500">*</span>
            </label>
            <Input
              value={rekomendasi}
              onChange={(e) => setRekomendasi(e.target.value)}
              placeholder="Disetujui untuk Penerbitan SPK..."
              className="h-9 text-xs"
            />
          </div>

          {/* Row 4: Catatan Evaluasi Teknis */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              Catatan & Justifikasi Teknis Lapangan <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jelaskan hasil uji kesiapan alat berat, kecukupan tenaga kerja, track record rekanan, kepatuhan K3, atau alasan jika tidak direkomendasikan..."
              rows={3}
              className="text-xs leading-relaxed resize-none"
            />
          </div>

          {/* Row 5: Berita Acara Evaluasi */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground flex items-center gap-1">
              <UploadCloud className="w-3.5 h-3.5 text-muted-foreground" /> Lampiran Berita Acara Evaluasi Teknis (Opsional)
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                placeholder="Tautan Google Drive atau nama berkas berita acara"
                className="h-9 text-xs"
              />
              <label className="h-9 px-3 rounded-md border border-input bg-background hover:bg-muted text-xs font-medium flex items-center justify-center cursor-pointer shrink-0 gap-1">
                {uploadingAttachment ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                )}
                <span>Unggah</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  disabled={uploadingAttachment}
                />
              </label>
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || uploadingAttachment}
            className={`gap-1 text-white ${
              result === "RECOMMENDED"
                ? "bg-emerald-700 hover:bg-emerald-800"
                : "bg-rose-700 hover:bg-rose-800"
            }`}
          >
            {result === "RECOMMENDED" ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isSubmitting ? "Menyimpan..." : "Simpan & Rekomendasikan"}
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5" />
                {isSubmitting ? "Menyimpan..." : "Simpan Penolakan"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
