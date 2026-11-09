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
  UserCheck,
  Calendar,
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

  const [evaluationDate, setEvaluationDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [result, setResult] = useState<TechnicalEvaluationResult>("RECOMMENDED");
  const [rekomendasi, setRekomendasi] = useState("Disetujui untuk Penerbitan Kontrak SPK");
  const [score, setScore] = useState<number>(90);
  const [evaluatorName, setEvaluatorName] = useState(userProfile.fullName || "Dedi Setiawan, S.T.");
  const [evaluatorJabatan, setEvaluatorJabatan] = useState(userProfile.role || "Manager Estate");
  const [notes, setNotes] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

  useEffect(() => {
    if (open) {
      setEvaluationDate(new Date().toISOString().split("T")[0]);
      setEvaluatorName(userProfile.fullName || "Dedi Setiawan, S.T.");
      setEvaluatorJabatan(userProfile.role || "Manager Estate");
      setResult("RECOMMENDED");
      setRekomendasi("Disetujui untuk Penerbitan Kontrak SPK");
      setScore(90);
      setNotes("");
      setAttachmentName("");
    }
  }, [open, userProfile]);

  if (!uspk) return null;

  const handleSubmit = () => {
    if (!evaluatorName.trim()) {
      toast.error("Nama penilai / evaluator teknis wajib diisi");
      return;
    }
    if (!notes.trim()) {
      toast.error("Catatan evaluasi teknis wajib diisi sebagai dasar rekomendasi");
      return;
    }

    const defaultFilename = `BA_EvaluasiTeknis_${uspk.uspkNumber.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

    recordTechnicalEvaluation({
      uspkId: uspk.id,
      uspkNumber: uspk.uspkNumber,
      projectId: project.id,
      evaluatorName: evaluatorName.trim(),
      evaluatorJabatan: evaluatorJabatan.trim(),
      evaluationDate,
      result,
      rekomendasi: rekomendasi.trim(),
      score: Number(score) || undefined,
      notes: notes.trim(),
      attachmentName: attachmentName.trim() || defaultFilename,
    });

    toast.success(
      `Evaluasi teknis untuk ${uspk.uspkNumber} (${uspk.vendorName}) berhasil dicatat: ${
        result === "RECOMMENDED" ? "DIREKOMENDASIKAN (Status USPK: Approved)" : "TIDAK DIREKOMENDASIKAN"
      }`
    );

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Catat Evaluasi Teknis Rekanan Jasa
              </DialogTitle>
              <DialogDescription className="text-xs">
                Penilaian kelaikan metodologi teknis, peralatan, dan kapasitas rekanan kontraktor untuk {uspk.uspkNumber}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* USPK Summary Card */}
        <div className="p-3 bg-muted/60 rounded-lg border space-y-1.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="font-mono font-bold text-foreground">
              {uspk.uspkNumber}
            </span>
            <div className="flex items-center gap-2">
              {uspk.targetVolume && (
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  Target: {uspk.targetVolume} {uspk.unit || "Unit"}
                </span>
              )}
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                {formatIDR(uspk.value)}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
            <span className="font-semibold text-foreground">{uspk.vendorName}</span>
            <span>&bull;</span>
            <span>Pelaksanaan: {formatIDDate(uspk.startDate)} s/d {formatIDDate(uspk.endDate)}</span>
          </div>
          <p className="text-muted-foreground line-clamp-2 text-[11px] pt-0.5 italic">
            "{uspk.scope}"
          </p>
        </div>

        <div className="grid gap-4 py-1 text-xs">
          {/* Row 1: Hasil Rekomendasi & Skor Teknis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Hasil Evaluasi Kelaikan <span className="text-red-500">*</span>
              </label>
              <Select
                value={result}
                onValueChange={(val: TechnicalEvaluationResult) => setResult(val)}
              >
                <SelectTrigger className="text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECOMMENDED" className="text-emerald-700 font-semibold">
                    ✓ DIREKOMENDASIKAN (Memenuhi Syarat)
                  </SelectItem>
                  <SelectItem value="NOT_RECOMMENDED" className="text-rose-700 font-semibold">
                    ✕ TIDAK DIREKOMENDASIKAN (Gugur Teknis)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Skor Penilaian Teknis (0 - 100)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="font-mono text-xs"
              />
            </div>
          </div>

          {/* Row 2: Evaluator & Jabatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-muted-foreground" /> Nama Evaluator Teknis <span className="text-red-500">*</span>
              </label>
              <Input
                value={evaluatorName}
                onChange={(e) => setEvaluatorName(e.target.value)}
                placeholder="Nama evaluator..."
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Jabatan Evaluator
              </label>
              <Input
                value={evaluatorJabatan}
                onChange={(e) => setEvaluatorJabatan(e.target.value)}
                placeholder="Manager Estate / Area / Water Management"
                className="text-xs"
              />
            </div>
          </div>

          {/* Row 3: Tanggal Evaluasi & Rekomendasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Tanggal Evaluasi Selesai <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={evaluationDate}
                onChange={(e) => setEvaluationDate(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Rekomendasi Formal <span className="text-red-500">*</span>
              </label>
              <Input
                value={rekomendasi}
                onChange={(e) => setRekomendasi(e.target.value)}
                placeholder="Disetujui untuk Penerbitan SPK..."
                className="text-xs"
              />
            </div>
          </div>

          {/* Row 4: Catatan Evaluasi Teknis */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">
              Catatan & Justifikasi Teknis Lapangan <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jelaskan hasil uji kesiapan alat berat, kecukupan tenaga kerja, track record rekanan, kepatuhan K3 perkebunan, atau alasan jika tidak direkomendasikan..."
              rows={4}
              className="text-xs leading-relaxed"
            />
          </div>

          {/* Row 5: Berita Acara Evaluasi */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center gap-1">
              <UploadCloud className="w-3.5 h-3.5 text-muted-foreground" /> Lampiran Berita Acara Evaluasi Teknis
            </label>
            <Input
              value={attachmentName}
              onChange={(e) => setAttachmentName(e.target.value)}
              placeholder="BA_EvaluasiTeknis_USPK.pdf (opsional)"
              className="text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            className={`gap-1 text-white ${
              result === "RECOMMENDED"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            {result === "RECOMMENDED" ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" /> Simpan & Rekomendasikan
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5" /> Simpan Penolakan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
